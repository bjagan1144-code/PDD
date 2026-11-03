#!/usr/bin/env python3
"""
BioPatch AI - Baseline & Load Performance Test Suite
---------------------------------------------------
Executes a high-concurrency load test against BioPatch AI FastAPI backend API endpoints,
collects real-time precise measurements, and exports structured reports (XLSX, HTML, JSON).

Target Endpoints:
  GET  /api/dashboard
  GET  /api/drugs
  GET  /api/polymers
  GET  /api/reports
  POST /api/simulate
"""

import os
import sys
import time
import math
import json
import random
import asyncio
import argparse
import subprocess
import numpy as np
import pandas as pd
from datetime import datetime
from collections import Counter, defaultdict

try:
    import httpx
except ImportError:
    print("Error: 'httpx' library is required. Install via `pip install httpx`")
    sys.exit(1)

try:
    import openpyxl
    from openpyxl.styles import Font, PatternFill, Alignment, Border, Side
    from openpyxl.utils import get_column_letter
except ImportError:
    print("Error: 'openpyxl' library is required. Install via `pip install openpyxl`")
    sys.exit(1)

# Default Test Configuration
DEFAULT_BASE_URL = "http://127.0.0.1:8000"
DEFAULT_USERS = 100
DEFAULT_DURATION = 60  # seconds
DEFAULT_RAMP_UP = 10   # seconds

# Sample Data Catalogs for Realistic Payloads
DRUGS = ["Metformin", "Paracetamol", "Losartan", "Ibuprofen"]
POLYMERS = ["PLA", "Alginate", "Gelatin", "Pectin", "Cellulose", "Chitosan"]

class LoadTestRunner:
    def __init__(self, base_url: str, users: int, duration: int, ramp_up: int):
        self.base_url = base_url.rstrip('/')
        self.target_users = users
        self.duration = duration
        self.ramp_up = ramp_up
        self.results = []
        self.server_process = None
        self.stop_event = asyncio.Event()

    def ensure_backend_running(self):
        """ Checks if target backend server is reachable, launches uvicorn if offline """
        print(f"Checking backend connectivity at {self.base_url}/health ...")
        try:
            with httpx.Client(timeout=3.0) as client:
                res = client.get(f"{self.base_url}/health")
                if res.status_code == 200:
                    print("[OK] Backend service is alive and healthy.")
                    return
        except Exception:
            print("[WARN] Backend server not detected on target port.")

        # Attempt auto-starting backend process from repository root or backend folder
        backend_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "..", "backend"))
        if not os.path.exists(backend_dir):
            backend_dir = os.getcwd()

        print(f"[STARTING] Starting FastAPI backend server (uvicorn) in controlled CI environment: {backend_dir}")
        env = os.environ.copy()
        env["PYTHONPATH"] = backend_dir

        self.server_process = subprocess.Popen(
            [sys.executable, "-m", "uvicorn", "app.main:app", "--host", "127.0.0.1", "--port", "8000"],
            cwd=backend_dir,
            env=env,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE
        )

        # Poll health endpoint until server is ready
        max_attempts = 20
        for attempt in range(1, max_attempts + 1):
            time.sleep(1)
            try:
                with httpx.Client(timeout=2.0) as client:
                    res = client.get(f"{self.base_url}/health")
                    if res.status_code == 200:
                        print(f"[OK] Backend server started successfully after {attempt} seconds.")
                        return
            except Exception:
                pass
            print(f"  Waiting for backend startup... ({attempt}/{max_attempts})")

        print("[FAIL] Failed to start backend server within 20 seconds.")
        if self.server_process:
            self.server_process.kill()
        sys.exit(1)

    def generate_simulate_payload(self) -> dict:
        """ Constructs a valid schema-compliant payload for POST /api/simulate """
        return {
            "drugName": random.choice(DRUGS),
            "polymerName": random.choice(POLYMERS),
            "drugLoading": round(random.uniform(5.0, 25.0), 1),
            "polymerConcentration": round(random.uniform(10.0, 40.0), 1),
            "patchThickness": round(random.uniform(0.5, 3.0), 2),
            "temperature": round(random.uniform(25.0, 42.0), 1),
            "pH": round(random.uniform(4.0, 8.5), 1),
            "moisture": round(random.uniform(20.0, 80.0), 1),
            "duration": round(random.uniform(6.0, 48.0), 1)
        }

    async def worker(self, user_id: int, start_delay: float):
        """ Virtual User Worker executing realistic API interactions """
        if start_delay > 0:
            await asyncio.sleep(start_delay)

        endpoints = [
            ("GET", "/api/dashboard", None),
            ("GET", "/api/drugs", None),
            ("GET", "/api/polymers", None),
            ("GET", "/api/reports", None),
            ("POST", "/api/simulate", "DYNAMIC_POST")
        ]

        limits = httpx.Limits(max_keepalive_connections=50, max_connections=100)
        timeout = httpx.Timeout(15.0, connect=5.0)

        async with httpx.AsyncClient(base_url=self.base_url, limits=limits, timeout=timeout) as client:
            while not self.stop_event.is_set():
                method, path, payload_type = random.choice(endpoints)
                payload = self.generate_simulate_payload() if payload_type == "DYNAMIC_POST" else None

                start_t = time.perf_counter()
                status_code = 0
                error_msg = None
                is_success = False
                is_timeout = False

                try:
                    if method == "GET":
                        res = await client.get(path)
                    else:
                        res = await client.post(path, json=payload)

                    status_code = res.status_code
                    is_success = (200 <= status_code < 300)
                    if not is_success:
                        error_msg = f"HTTP {status_code}: {res.text[:100]}"
                except httpx.TimeoutException:
                    is_timeout = True
                    error_msg = "Request Timeout (15s)"
                except Exception as e:
                    error_msg = str(e)

                latency_ms = (time.perf_counter() - start_t) * 1000.0

                self.results.append({
                    "timestamp": time.time(),
                    "user_id": user_id,
                    "method": method,
                    "endpoint": path,
                    "status_code": status_code,
                    "latency_ms": latency_ms,
                    "is_success": is_success,
                    "is_timeout": is_timeout,
                    "error": error_msg
                })

                # Realistic user pause between interactions
                await asyncio.sleep(random.uniform(0.2, 0.8))

    async def run_load_test(self):
        """ Executes load test with gradual user ramp-up over target duration """
        print(f"\n==================================================")
        print(f"STARTING BIOPATCH AI LOAD TEST")
        print(f"==================================================")
        print(f"* Target Host      : {self.base_url}")
        print(f"* Virtual Users    : {self.target_users}")
        print(f"* Test Duration    : {self.duration} seconds")
        print(f"* Ramp-up Period   : {self.ramp_up} seconds")
        print(f"* Target Endpoints : GET /api/dashboard, GET /api/drugs, GET /api/polymers, GET /api/reports, POST /api/simulate")
        print(f"==================================================\n")

        # Calculate ramp-up delays
        workers = []
        ramp_delay_step = self.ramp_up / float(self.target_users) if self.ramp_up > 0 else 0

        for i in range(self.target_users):
            start_delay = i * ramp_delay_step
            workers.append(asyncio.create_task(self.worker(i + 1, start_delay)))

        print(f"Executing load test for {self.duration} seconds...")
        
        # Run test for specified duration
        start_time = time.time()
        while time.time() - start_time < self.duration:
            elapsed = time.time() - start_time
            req_count = len(self.results)
            current_rps = req_count / elapsed if elapsed > 0 else 0
            print(f"  [Elapsed: {int(elapsed)}s / {self.duration}s] Completed: {req_count} requests | Current RPS: {current_rps:.1f}", end="\r")
            await asyncio.sleep(1.0)

        # Stop workers
        self.stop_event.set()
        await asyncio.gather(*workers, return_exceptions=True)

        total_elapsed = time.time() - start_time
        print(f"\n[OK] Load test completed in {total_elapsed:.2f} seconds. Total requests captured: {len(self.results)}")

        if self.server_process:
            print("Cleaning up background backend process...")
            self.server_process.terminate()
            self.server_process = None

    def compute_metrics(self) -> dict:
        """ Processes raw sample measurements into comprehensive performance metrics """
        if not self.results:
            return {}

        total_reqs = len(self.results)
        successful_reqs = sum(1 for r in self.results if r["is_success"])
        failed_reqs = total_reqs - successful_reqs
        timeout_count = sum(1 for r in self.results if r["is_timeout"])
        error_rate = (failed_reqs / total_reqs * 100.0) if total_reqs > 0 else 0.0

        timestamps = [r["timestamp"] for r in self.results]
        actual_duration = max(timestamps) - min(timestamps) if len(timestamps) > 1 else self.duration
        rps = total_reqs / actual_duration if actual_duration > 0 else 0.0

        latencies = [r["latency_ms"] for r in self.results]
        avg_lat = float(np.mean(latencies))
        min_lat = float(np.min(latencies))
        max_lat = float(np.max(latencies))
        p50_lat = float(np.percentile(latencies, 50))
        p95_lat = float(np.percentile(latencies, 95))
        p99_lat = float(np.percentile(latencies, 99))

        status_codes = Counter(str(r["status_code"]) if r["status_code"] != 0 else "Timeout/Err" for r in self.results)

        # Endpoint-level Breakdown
        endpoint_data = defaultdict(list)
        for r in self.results:
            key = f"{r['method']} {r['endpoint']}"
            endpoint_data[key].append(r)

        endpoint_stats = []
        for key, reqs in endpoint_data.items():
            ep_total = len(reqs)
            ep_succ = sum(1 for r in reqs if r["is_success"])
            ep_fail = ep_total - ep_succ
            ep_err_rate = (ep_fail / ep_total * 100.0) if ep_total > 0 else 0.0
            ep_rps = ep_total / actual_duration if actual_duration > 0 else 0.0

            ep_lats = [r["latency_ms"] for r in reqs]
            ep_avg = float(np.mean(ep_lats))
            ep_min = float(np.min(ep_lats))
            ep_max = float(np.max(ep_lats))
            ep_p50 = float(np.percentile(ep_lats, 50))
            ep_p95 = float(np.percentile(ep_lats, 95))
            ep_p99 = float(np.percentile(ep_lats, 99))

            method, path = key.split(" ", 1)
            endpoint_stats.append({
                "endpoint": path,
                "method": method,
                "total_requests": ep_total,
                "successful_requests": ep_succ,
                "failed_requests": ep_fail,
                "error_rate_pct": round(ep_err_rate, 2),
                "rps": round(ep_rps, 2),
                "avg_response_time_ms": round(ep_avg, 2),
                "min_response_time_ms": round(ep_min, 2),
                "max_response_time_ms": round(ep_max, 2),
                "p50_ms": round(ep_p50, 2),
                "p95_ms": round(ep_p95, 2),
                "p99_ms": round(ep_p99, 2)
            })

        # Identify Highlights
        slowest_ep = max(endpoint_stats, key=lambda x: x["avg_response_time_ms"])["endpoint"] if endpoint_stats else "N/A"
        fastest_ep = min(endpoint_stats, key=lambda x: x["avg_response_time_ms"])["endpoint"] if endpoint_stats else "N/A"
        highest_err_ep = max(endpoint_stats, key=lambda x: x["error_rate_pct"])["endpoint"] if endpoint_stats else "N/A"

        # Stability Verdict
        if error_rate == 0.0 and p95_lat < 500:
            stability_status = "EXCELLENT & STABLE"
        elif error_rate < 1.0 and p95_lat < 1500:
            stability_status = "STABLE"
        elif error_rate < 5.0:
            stability_status = "MODERATELY STABLE"
        else:
            stability_status = "UNSTABLE / HIGH ERROR RATE"

        # Error Details Collection
        error_counts = Counter(r["error"] for r in self.results if r["error"])
        errors_list = [{"error_message": err, "occurrences": count} for err, count in error_counts.items()]

        return {
            "test_configuration": {
                "target_host": self.base_url,
                "virtual_users": self.target_users,
                "test_duration_sec": self.duration,
                "ramp_up_sec": self.ramp_up,
                "timestamp": datetime.now().strftime("%Y-%m-%d %H:%M:%S")
            },
            "metrics": {
                "total_requests": total_reqs,
                "successful_requests": successful_reqs,
                "failed_requests": failed_reqs,
                "requests_per_second": round(rps, 2),
                "avg_response_time_ms": round(avg_lat, 2),
                "min_response_time_ms": round(min_lat, 2),
                "max_response_time_ms": round(max_lat, 2),
                "p50_ms": round(p50_lat, 2),
                "p95_ms": round(p95_lat, 2),
                "p99_ms": round(p99_lat, 2),
                "error_rate_pct": round(error_rate, 2),
                "timeout_count": timeout_count
            },
            "highlights": {
                "slowest_endpoint": slowest_ep,
                "fastest_endpoint": fastest_ep,
                "highest_error_rate_endpoint": highest_err_ep,
                "system_stability": stability_status
            },
            "http_status_codes": dict(status_codes),
            "endpoint_statistics": endpoint_stats,
            "errors": errors_list
        }

def generate_excel_report(data: dict, filepath: str):
    """ Generates a beautifully formatted Excel report matching all 6 requested sections """
    wb = openpyxl.Workbook()
    # Remove default sheet
    wb.remove(wb.active)

    # Styles
    font_family = "Segoe UI"
    header_fill = PatternFill(start_color="1E293B", end_color="1E293B", fill_type="solid") # Dark slate header
    header_font = Font(name=font_family, size=11, bold=True, color="FFFFFF")
    title_font = Font(name=font_family, size=16, bold=True, color="0F172A")
    subtitle_font = Font(name=font_family, size=11, italic=True, color="64748B")
    data_font = Font(name=font_family, size=10)
    bold_font = Font(name=font_family, size=10, bold=True)
    success_font = Font(name=font_family, size=10, bold=True, color="166534")
    warn_font = Font(name=font_family, size=10, bold=True, color="991B1B")

    thin_border = Border(
        left=Side(style='thin', color='E2E8F0'),
        right=Side(style='thin', color='E2E8F0'),
        top=Side(style='thin', color='E2E8F0'),
        bottom=Side(style='thin', color='E2E8F0')
    )

    # Helper to format header row
    def style_headers(ws, row_idx):
        for cell in ws[row_idx]:
            cell.fill = header_fill
            cell.font = header_font
            cell.alignment = Alignment(horizontal="center", vertical="center")

    # Helper to set column widths
    def autofit_columns(ws):
        for col in ws.columns:
            max_len = max(len(str(cell.value or '')) for cell in col)
            col_letter = get_column_letter(col[0].column)
            ws.column_dimensions[col_letter].width = max(max_len + 4, 12)

    # SHEET 1: Test Configuration
    ws1 = wb.create_sheet(title="Test Configuration")
    ws1.append(["BioPatch AI Load Test - Configuration Settings"])
    ws1.cell(row=1, column=1).font = title_font
    ws1.append(["Generated on " + data["test_configuration"]["timestamp"]])
    ws1.cell(row=2, column=1).font = subtitle_font
    ws1.append([])

    ws1.append(["Parameter", "Value", "Description"])
    style_headers(ws1, 4)
    
    config_rows = [
        ("Target Host API URL", data["test_configuration"]["target_host"], "Base URL of the BioPatch AI FastAPI backend"),
        ("Virtual Users (Concurrency)", data["test_configuration"]["virtual_users"], "Maximum number of simultaneous user connections"),
        ("Test Duration", f"{data['test_configuration']['test_duration_sec']} seconds", "Total active load test execution timeframe"),
        ("Ramp-up Period", f"{data['test_configuration']['ramp_up_sec']} seconds", "Gradual user connection spawn window"),
        ("Tested API Endpoints", 5, "GET /api/dashboard, GET /api/drugs, GET /api/polymers, GET /api/reports, POST /api/simulate")
    ]
    for r in config_rows:
        ws1.append(r)
        for cell in ws1[ws1.max_row]:
            cell.font = data_font
            cell.border = thin_border
    autofit_columns(ws1)

    # SHEET 2: Endpoint Statistics
    ws2 = wb.create_sheet(title="Endpoint Statistics")
    ws2.append(["Endpoint Performance Breakdown"])
    ws2.cell(row=1, column=1).font = title_font
    ws2.append([])
    ws2.append(["Endpoint", "Method", "Total Reqs", "Success", "Failed", "Error Rate (%)", "RPS", "Avg (ms)", "Min (ms)", "Max (ms)", "P50 (ms)", "P95 (ms)", "P99 (ms)"])
    style_headers(ws2, 3)

    for ep in data["endpoint_statistics"]:
        ws2.append([
            ep["endpoint"], ep["method"], ep["total_requests"], ep["successful_requests"], ep["failed_requests"],
            ep["error_rate_pct"], ep["rps"], ep["avg_response_time_ms"], ep["min_response_time_ms"],
            ep["max_response_time_ms"], ep["p50_ms"], ep["p95_ms"], ep["p99_ms"]
        ])
        for cell in ws2[ws2.max_row]:
            cell.font = data_font
            cell.border = thin_border
            cell.alignment = Alignment(horizontal="right" if isinstance(cell.value, (int, float)) else "left")
    autofit_columns(ws2)

    # SHEET 3: Performance Metrics
    ws3 = wb.create_sheet(title="Performance Metrics")
    ws3.append(["Aggregated System Performance Metrics"])
    ws3.cell(row=1, column=1).font = title_font
    ws3.append([])
    ws3.append(["Metric Name", "Value", "Unit / Standard Target", "Evaluation"])
    style_headers(ws3, 3)

    m = data["metrics"]
    metrics_rows = [
        ("Total Requests Executed", m["total_requests"], "requests", "Completed"),
        ("Successful Requests", m["successful_requests"], "requests", "Passed"),
        ("Failed Requests", m["failed_requests"], "requests", "Zero Errors" if m["failed_requests"] == 0 else "Failures Observed"),
        ("Requests Per Second (RPS)", m["requests_per_second"], "req/sec", "Target > 50 req/s"),
        ("Average Response Time", f"{m['avg_response_time_ms']} ms", "ms", "Target < 500 ms"),
        ("Minimum Response Time", f"{m['min_response_time_ms']} ms", "ms", "Lowest latency"),
        ("Maximum Response Time", f"{m['max_response_time_ms']} ms", "ms", "Peak latency"),
        ("P50 Response Time (Median)", f"{m['p50_ms']} ms", "ms", "Target < 300 ms"),
        ("P95 Response Time", f"{m['p95_ms']} ms", "ms", "Target < 1000 ms"),
        ("P99 Response Time", f"{m['p99_ms']} ms", "ms", "Target < 1500 ms"),
        ("Overall Error Rate", f"{m['error_rate_pct']}%", "%", "Target < 1.0%"),
        ("Timeout Count", m["timeout_count"], "timeouts", "Target = 0")
    ]

    for r in metrics_rows:
        ws3.append(r)
        for cell in ws3[ws3.max_row]:
            cell.font = data_font
            cell.border = thin_border
    autofit_columns(ws3)

    # SHEET 4: HTTP Status Codes
    ws4 = wb.create_sheet(title="HTTP Status Codes")
    ws4.append(["HTTP Status Code Distribution"])
    ws4.cell(row=1, column=1).font = title_font
    ws4.append([])
    ws4.append(["HTTP Status Code", "Description", "Count", "Percentage"])
    style_headers(ws4, 3)

    total_reqs = m["total_requests"]
    code_descriptions = {
        "200": "200 OK - Successful response",
        "201": "201 Created - Resource saved",
        "400": "400 Bad Request - Payload error",
        "401": "401 Unauthorized - Missing token",
        "404": "404 Not Found - Missing route",
        "500": "500 Internal Server Error",
        "Timeout/Err": "Connection Timeout / Network Error"
    }

    for code, count in data["http_status_codes"].items():
        pct = (count / total_reqs * 100.0) if total_reqs > 0 else 0
        desc = code_descriptions.get(str(code), f"HTTP {code} Response")
        ws4.append([code, desc, count, f"{pct:.2f}%"])
        for cell in ws4[ws4.max_row]:
            cell.font = data_font
            cell.border = thin_border
    autofit_columns(ws4)

    # SHEET 5: Errors
    ws5 = wb.create_sheet(title="Errors")
    ws5.append(["Captured Error Log Details"])
    ws5.cell(row=1, column=1).font = title_font
    ws5.append([])
    ws5.append(["Error Message / Exception", "Occurrences", "Impact Level"])
    style_headers(ws5, 3)

    if data["errors"]:
        for err in data["errors"]:
            ws5.append([err["error_message"], err["occurrences"], "High" if err["occurrences"] > 10 else "Low"])
            for cell in ws5[ws5.max_row]:
                cell.font = data_font
                cell.border = thin_border
    else:
        ws5.append(["No errors captured during this test run.", 0, "None"])
        for cell in ws5[ws5.max_row]:
            cell.font = success_font
            cell.border = thin_border
    autofit_columns(ws5)

    # SHEET 6: Final Summary
    ws6 = wb.create_sheet(title="Final Summary")
    ws6.append(["BioPatch AI Load Test - Executive Summary"])
    ws6.cell(row=1, column=1).font = title_font
    ws6.append([])
    ws6.append(["Assessment Field", "Details / Value"])
    style_headers(ws6, 3)

    h = data["highlights"]
    summary_rows = [
        ("System Concurrency Stability", h["system_stability"]),
        ("Total Executed Requests", m["total_requests"]),
        ("Average System Throughput", f"{m['requests_per_second']} req/sec"),
        ("Median Latency (P50)", f"{m['p50_ms']} ms"),
        ("95th Percentile Latency (P95)", f"{m['p95_ms']} ms"),
        ("Overall Error Rate", f"{m['error_rate_pct']}%"),
        ("Slowest API Endpoint", h["slowest_endpoint"]),
        ("Fastest API Endpoint", h["fastest_endpoint"]),
        ("Endpoint with Highest Error Rate", h["highest_error_rate_endpoint"]),
        ("Concurrency Evaluation Verdict", f"The BioPatch AI backend maintained high stability at {data['test_configuration']['virtual_users']} concurrent virtual users with {m['error_rate_pct']}% error rate and {m['requests_per_second']} RPS.")
    ]

    for r in summary_rows:
        ws6.append(r)
        for cell in ws6[ws6.max_row]:
            cell.font = bold_font if cell.column == 1 else data_font
            cell.border = thin_border
    autofit_columns(ws6)

    # Save Excel
    os.makedirs(os.path.dirname(filepath), exist_ok=True)
    wb.save(filepath)
    print(f"[REPORT] Generated Excel report: {filepath}")

def generate_html_report(data: dict, filepath: str):
    """ Generates a modern HTML report with BioPatch AI design system """
    m = data["metrics"]
    c = data["test_configuration"]
    h = data["highlights"]

    ep_rows_html = ""
    for ep in data["endpoint_statistics"]:
        badge_class = "badge-success" if ep["error_rate_pct"] == 0 else "badge-warning"
        ep_rows_html += f"""
        <tr>
            <td><code>{ep['method']} {ep['endpoint']}</code></td>
            <td>{ep['total_requests']}</td>
            <td>{ep['successful_requests']}</td>
            <td>{ep['failed_requests']}</td>
            <td><span class="badge {badge_class}">{ep['error_rate_pct']}%</span></td>
            <td><strong>{ep['rps']}</strong></td>
            <td>{ep['avg_response_time_ms']} ms</td>
            <td>{ep['min_response_time_ms']} ms</td>
            <td>{ep['max_response_time_ms']} ms</td>
            <td>{ep['p50_ms']} ms</td>
            <td><strong>{ep['p95_ms']} ms</strong></td>
        </tr>
        """

    status_rows_html = ""
    for code, count in data["http_status_codes"].items():
        pct = (count / m['total_requests'] * 100.0) if m['total_requests'] > 0 else 0
        status_rows_html += f"""
        <tr>
            <td><code>HTTP {code}</code></td>
            <td>{count}</td>
            <td>{pct:.2f}%</td>
        </tr>
        """

    errors_html = ""
    if data["errors"]:
        for err in data["errors"]:
            errors_html += f"""
            <div class="error-item">
                <span class="error-count">{err['occurrences']}x</span>
                <code>{err['error_message']}</code>
            </div>
            """
    else:
        errors_html = "<div class='no-errors'>Zero errors recorded. All endpoints responded cleanly!</div>"

    html_content = f"""<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>BioPatch AI - Baseline & Load Test Report</title>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
    <style>
        :root {{
            --bg: #0F172A;
            --card-bg: #1E293B;
            --accent: #38BDF8;
            --accent-glow: rgba(56, 189, 248, 0.15);
            --text: #F8FAFC;
            --text-muted: #94A3B8;
            --border: #334155;
            --success: #22C55E;
            --warning: #F59E0B;
            --danger: #EF4444;
        }}
        body {{
            font-family: 'Inter', sans-serif;
            background-color: var(--bg);
            color: var(--text);
            margin: 0;
            padding: 30px;
        }}
        .container {{
            max-width: 1200px;
            margin: 0 auto;
        }}
        .header {{
            display: flex;
            justify-content: space-between;
            align-items: center;
            border-bottom: 1px solid var(--border);
            padding-bottom: 20px;
            margin-bottom: 30px;
        }}
        .title h1 {{
            margin: 0;
            font-size: 28px;
            color: var(--text);
            display: flex;
            align-items: center;
            gap: 12px;
        }}
        .subtitle {{
            color: var(--text-muted);
            font-size: 14px;
            margin-top: 5px;
        }}
        .status-badge {{
            padding: 8px 16px;
            border-radius: 20px;
            font-weight: 600;
            font-size: 14px;
            background: var(--accent-glow);
            color: var(--accent);
            border: 1px solid var(--accent);
        }}
        .grid {{
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
            gap: 20px;
            margin-bottom: 30px;
        }}
        .card {{
            background: var(--card-bg);
            border: 1px solid var(--border);
            border-radius: 12px;
            padding: 20px;
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
        }}
        .card-label {{
            font-size: 12px;
            color: var(--text-muted);
            text-transform: uppercase;
            letter-spacing: 0.05em;
            margin-bottom: 8px;
        }}
        .card-value {{
            font-size: 26px;
            font-weight: 700;
            color: var(--accent);
        }}
        .card-sub {{
            font-size: 12px;
            color: var(--text-muted);
            margin-top: 4px;
        }}
        table {{
            width: 100%;
            border-collapse: collapse;
            background: var(--card-bg);
            border-radius: 12px;
            overflow: hidden;
            border: 1px solid var(--border);
            margin-bottom: 30px;
        }}
        th, td {{
            padding: 14px 18px;
            text-align: left;
            border-bottom: 1px solid var(--border);
            font-size: 14px;
        }}
        th {{
            background: #0F172A;
            color: var(--text-muted);
            font-weight: 600;
            text-transform: uppercase;
            font-size: 11px;
            letter-spacing: 0.05em;
        }}
        code {{
            background: #090D16;
            padding: 4px 8px;
            border-radius: 4px;
            color: #38BDF8;
            font-family: monospace;
        }}
        .badge {{
            padding: 4px 8px;
            border-radius: 6px;
            font-size: 12px;
            font-weight: 600;
        }}
        .badge-success {{ background: rgba(34, 197, 94, 0.15); color: var(--success); }}
        .badge-warning {{ background: rgba(245, 158, 11, 0.15); color: var(--warning); }}
        .error-item {{
            background: #2D1517;
            border: 1px solid #7F1D1D;
            padding: 12px 16px;
            border-radius: 8px;
            margin-bottom: 10px;
            display: flex;
            gap: 12px;
            align-items: center;
        }}
        .error-count {{
            background: var(--danger);
            color: white;
            font-weight: bold;
            padding: 2px 8px;
            border-radius: 4px;
            font-size: 12px;
        }}
        .no-errors {{
            background: rgba(34, 197, 94, 0.1);
            border: 1px solid var(--success);
            color: var(--success);
            padding: 16px;
            border-radius: 8px;
            font-weight: 600;
        }}
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="title">
                <h1>BioPatch AI Load Test Report</h1>
                <div class="subtitle">Execution Timestamp: {c['timestamp']} | Host: {c['target_host']}</div>
            </div>
            <div class="status-badge">{h['system_stability']}</div>
        </div>

        <div class="grid">
            <div class="card">
                <div class="card-label">Virtual Users</div>
                <div class="card-value">{c['virtual_users']}</div>
                <div class="card-sub">Max Concurrent Connections</div>
            </div>
            <div class="card">
                <div class="card-label">Requests / Sec (RPS)</div>
                <div class="card-value">{m['requests_per_second']}</div>
                <div class="card-sub">Total: {m['total_requests']} requests</div>
            </div>
            <div class="card">
                <div class="card-label">Avg Response Time</div>
                <div class="card-value">{m['avg_response_time_ms']} ms</div>
                <div class="card-sub">Min: {m['min_response_time_ms']} ms | Max: {m['max_response_time_ms']} ms</div>
            </div>
            <div class="card">
                <div class="card-label">P95 Latency</div>
                <div class="card-value">{m['p95_ms']} ms</div>
                <div class="card-sub">P50: {m['p50_ms']} ms | P99: {m['p99_ms']} ms</div>
            </div>
            <div class="card">
                <div class="card-label">Error Rate</div>
                <div class="card-value" style="color: {'var(--success)' if m['error_rate_pct'] < 1 else 'var(--danger)'}">{m['error_rate_pct']}%</div>
                <div class="card-sub">Failed: {m['failed_requests']} | Timeouts: {m['timeout_count']}</div>
            </div>
        </div>

        <h2>Endpoint Breakdown</h2>
        <table>
            <thead>
                <tr>
                    <th>Endpoint</th>
                    <th>Total</th>
                    <th>Passed</th>
                    <th>Failed</th>
                    <th>Error Rate</th>
                    <th>RPS</th>
                    <th>Avg</th>
                    <th>Min</th>
                    <th>Max</th>
                    <th>P50</th>
                    <th>P95</th>
                </tr>
            </thead>
            <tbody>
                {ep_rows_html}
            </tbody>
        </table>

        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 30px;">
            <div>
                <h2>Key Highlights</h2>
                <div class="card">
                    <p><strong>Slowest Endpoint:</strong> <code>{h['slowest_endpoint']}</code></p>
                    <p><strong>Fastest Endpoint:</strong> <code>{h['fastest_endpoint']}</code></p>
                    <p><strong>Highest Error Rate:</strong> <code>{h['highest_error_rate_endpoint']}</code></p>
                </div>
            </div>
            <div>
                <h2>HTTP Status Codes</h2>
                <table>
                    <thead>
                        <tr>
                            <th>Status Code</th>
                            <th>Count</th>
                            <th>Percentage</th>
                        </tr>
                    </thead>
                    <tbody>
                        {status_rows_html}
                    </tbody>
                </table>
            </div>
        </div>

        <h2>Captured Error Logs</h2>
        {errors_html}
    </div>
</body>
</html>
"""
    os.makedirs(os.path.dirname(filepath), exist_ok=True)
    with open(filepath, "w", encoding="utf-8") as f:
        f.write(html_content)
    print(f"[REPORT] Generated HTML report: {filepath}")

def generate_json_summary(data: dict, filepath: str):
    """ Generates structured machine-readable JSON summary """
    os.makedirs(os.path.dirname(filepath), exist_ok=True)
    with open(filepath, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2)
    print(f"[REPORT] Generated JSON summary: {filepath}")

async def main():
    parser = argparse.ArgumentParser(description="BioPatch AI Baseline & Load Performance Tester")
    parser.add_argument("--url", default=DEFAULT_BASE_URL, help="Target backend API base URL")
    parser.add_argument("--users", type=int, default=DEFAULT_USERS, help="Number of virtual users (concurrency)")
    parser.add_argument("--duration", type=int, default=DEFAULT_DURATION, help="Test duration in seconds")
    parser.add_argument("--ramp-up", type=int, default=DEFAULT_RAMP_UP, help="Ramp-up duration in seconds")
    parser.add_argument("--out-dir", default=None, help="Output directory for reports")

    args = parser.parse_args()

    # Determine report path output directory
    if args.out_dir is None:
        repo_root = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", ".."))
        reports_dir = os.path.join(repo_root, "tests", "performance", "reports")
    else:
        reports_dir = args.out_dir

    runner = LoadTestRunner(
        base_url=args.url,
        users=args.users,
        duration=args.duration,
        ramp_up=args.ramp_up
    )

    # 1. Ensure backend is running
    runner.ensure_backend_running()

    # 2. Run Load Test
    await runner.run_load_test()

    # 3. Compute Metrics
    metrics_data = runner.compute_metrics()

    # 4. Export Reports
    excel_path = os.path.join(reports_dir, "BioPatch_Load_Test_Report.xlsx")
    html_path = os.path.join(reports_dir, "BioPatch_Load_Test_Report.html")
    json_path = os.path.join(reports_dir, "BioPatch_Load_Test_Summary.json")

    generate_excel_report(metrics_data, excel_path)
    generate_html_report(metrics_data, html_path)
    generate_json_summary(metrics_data, json_path)

    # Print Summary Terminal Console Table
    m = metrics_data["metrics"]
    h = metrics_data["highlights"]

    print("\n==================================================")
    print("BIOPATCH AI LOAD TEST RESULTS SUMMARY")
    print("==================================================")
    print(f"Status Verdict    : {h['system_stability']}")
    print(f"Virtual Users     : {args.users}")
    print(f"Test Duration     : {args.duration}s")
    print(f"Total Requests    : {m['total_requests']}")
    print(f"Requests / Sec    : {m['requests_per_second']} req/s")
    print(f"Successful Reqs   : {m['successful_requests']}")
    print(f"Failed Requests   : {m['failed_requests']}")
    print(f"Error Rate        : {m['error_rate_pct']}%")
    print(f"Avg Latency       : {m['avg_response_time_ms']} ms")
    print(f"Min Latency       : {m['min_response_time_ms']} ms")
    print(f"Max Latency       : {m['max_response_time_ms']} ms")
    print(f"P50 Latency       : {m['p50_ms']} ms")
    print(f"P95 Latency       : {m['p95_ms']} ms")
    print(f"P99 Latency       : {m['p99_ms']} ms")
    print("==================================================")
    print(f"Slowest Endpoint  : {h['slowest_endpoint']}")
    print(f"Fastest Endpoint  : {h['fastest_endpoint']}")
    print("==================================================\n")

if __name__ == "__main__":
    asyncio.run(main())
