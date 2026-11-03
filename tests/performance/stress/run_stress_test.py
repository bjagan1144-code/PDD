#!/usr/bin/env python3
"""
BioPatch AI - Multi-Stage Stress Performance Test Suite
-------------------------------------------------------
Executes a multi-stage stress test against BioPatch AI FastAPI backend API endpoints,
progressively escalating concurrent virtual users to identify system breaking points,
throughput saturation, latency degradation, and post-stress recovery.

Stages:
  Stage 1: 100 virtual users
  Stage 2: 250 virtual users
  Stage 3: 500 virtual users
  Stage 4: 750 virtual users
  Stage 5: 1000 virtual users
  Stage 6 (Recovery): 50 virtual users

Target API Endpoints:
  GET  /api/dashboard
  GET  /api/drugs
  GET  /api/polymers
  GET  /api/reports
  POST /api/simulate
"""

import os
import sys
import time
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
    print("Error: 'httpx' library is required. Install via pip install httpx")
    sys.exit(1)

try:
    import openpyxl
    from openpyxl.styles import Font, PatternFill, Alignment, Border, Side
    from openpyxl.utils import get_column_letter
except ImportError:
    print("Error: 'openpyxl' library is required. Install via pip install openpyxl")
    sys.exit(1)

DEFAULT_BASE_URL = "http://127.0.0.1:8000"
DEFAULT_STAGE_DURATION = 20  # seconds per stage

STRESS_STAGES = [
    {"stage": 1, "name": "Stage 1 (100 Users)", "users": 100},
    {"stage": 2, "name": "Stage 2 (250 Users)", "users": 250},
    {"stage": 3, "name": "Stage 3 (500 Users)", "users": 500},
    {"stage": 4, "name": "Stage 4 (750 Users)", "users": 750},
    {"stage": 5, "name": "Stage 5 (1000 Users)", "users": 1000},
    {"stage": 6, "name": "Stage 6 (Recovery - 50 Users)", "users": 50}
]

DRUGS = ["Metformin", "Paracetamol", "Losartan", "Ibuprofen"]
POLYMERS = ["PLA", "Alginate", "Gelatin", "Pectin", "Cellulose", "Chitosan"]

class StressTestRunner:
    def __init__(self, base_url: str, stage_duration: int):
        self.base_url = base_url.rstrip('/')
        self.stage_duration = stage_duration
        self.all_results = []
        self.stage_metrics = []
        self.server_process = None

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

        backend_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "..", "backend"))
        if not os.path.exists(backend_dir):
            backend_dir = os.getcwd()

        print(f"[STARTING] Starting FastAPI backend server (uvicorn) in controlled environment: {backend_dir}")
        env = os.environ.copy()
        env["PYTHONPATH"] = backend_dir

        self.server_process = subprocess.Popen(
            [sys.executable, "-m", "uvicorn", "app.main:app", "--host", "127.0.0.1", "--port", "8000"],
            cwd=backend_dir,
            env=env,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE
        )

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

    async def worker(self, user_id: int, stop_event: asyncio.Event, stage_id: int, results_list: list):
        """ Worker loop for a single virtual user in a stage """
        endpoints = [
            ("GET", "/api/dashboard", None),
            ("GET", "/api/drugs", None),
            ("GET", "/api/polymers", None),
            ("GET", "/api/reports", None),
            ("POST", "/api/simulate", "DYNAMIC_POST")
        ]

        limits = httpx.Limits(max_keepalive_connections=50, max_connections=200)
        timeout = httpx.Timeout(15.0, connect=5.0)

        async with httpx.AsyncClient(base_url=self.base_url, limits=limits, timeout=timeout) as client:
            while not stop_event.is_set():
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

                record = {
                    "stage_id": stage_id,
                    "timestamp": time.time(),
                    "user_id": user_id,
                    "method": method,
                    "endpoint": path,
                    "status_code": status_code,
                    "latency_ms": latency_ms,
                    "is_success": is_success,
                    "is_timeout": is_timeout,
                    "error": error_msg
                }
                results_list.append(record)
                self.all_results.append(record)

                await asyncio.sleep(random.uniform(0.2, 0.8))

    async def execute_stage(self, stage_info: dict) -> dict:
        """ Executes a single stress testing stage """
        stage_id = stage_info["stage"]
        stage_name = stage_info["name"]
        num_users = stage_info["users"]

        print(f"\n--------------------------------------------------")
        print(f"[STAGE] EXECUTING {stage_name.upper()} ({num_users} Concurrent Users)")
        print(f"--------------------------------------------------")

        stop_event = asyncio.Event()
        stage_results = []
        workers = []

        for i in range(num_users):
            workers.append(asyncio.create_task(self.worker(i + 1, stop_event, stage_id, stage_results)))

        start_time = time.time()
        while time.time() - start_time < self.stage_duration:
            elapsed = time.time() - start_time
            req_count = len(stage_results)
            current_rps = req_count / elapsed if elapsed > 0 else 0
            print(f"  [{stage_name}] Elapsed: {int(elapsed)}s / {self.stage_duration}s | Completed: {req_count} reqs | RPS: {current_rps:.1f}", end="\r")
            await asyncio.sleep(1.0)

        stop_event.set()
        await asyncio.gather(*workers, return_exceptions=True)

        actual_duration = time.time() - start_time
        print(f"\n[OK] {stage_name} finished in {actual_duration:.2f}s. Captured {len(stage_results)} requests.")

        # Compute Stage Metrics
        total_reqs = len(stage_results)
        successful_reqs = sum(1 for r in stage_results if r["is_success"])
        failed_reqs = total_reqs - successful_reqs
        timeout_count = sum(1 for r in stage_results if r["is_timeout"])
        error_rate = (failed_reqs / total_reqs * 100.0) if total_reqs > 0 else 0.0
        rps = total_reqs / actual_duration if actual_duration > 0 else 0.0

        if total_reqs > 0:
            latencies = [r["latency_ms"] for r in stage_results]
            avg_lat = float(np.mean(latencies))
            min_lat = float(np.min(latencies))
            max_lat = float(np.max(latencies))
            p50_lat = float(np.percentile(latencies, 50))
            p95_lat = float(np.percentile(latencies, 95))
            p99_lat = float(np.percentile(latencies, 99))
        else:
            avg_lat = min_lat = max_lat = p50_lat = p95_lat = p99_lat = 0.0

        status_codes = Counter(str(r["status_code"]) if r["status_code"] != 0 else "Timeout/Err" for r in stage_results)

        stage_summary = {
            "stage_id": stage_id,
            "stage_name": stage_name,
            "virtual_users": num_users,
            "total_requests": total_reqs,
            "successful_requests": successful_reqs,
            "failed_requests": failed_reqs,
            "error_rate_pct": round(error_rate, 2),
            "requests_per_second": round(rps, 2),
            "avg_response_time_ms": round(avg_lat, 2),
            "min_response_time_ms": round(min_lat, 2),
            "max_response_time_ms": round(max_lat, 2),
            "p50_ms": round(p50_lat, 2),
            "p95_ms": round(p95_lat, 2),
            "p99_ms": round(p99_lat, 2),
            "timeout_count": timeout_count,
            "http_status_codes": dict(status_codes)
        }
        self.stage_metrics.append(stage_summary)
        return stage_summary

    async def run_stress_test(self):
        """ Sequentially runs all 6 stress testing stages """
        print(f"\n==================================================")
        print(f"STARTING BIOPATCH AI MULTI-STAGE STRESS TEST")
        print(f"==================================================")
        print(f"* Target Host      : {self.base_url}")
        print(f"* Stage Duration   : {self.stage_duration} seconds per stage")
        print(f"* Target Stages    : 100 -> 250 -> 500 -> 750 -> 1000 -> Recovery (50)")
        print(f"==================================================\n")

        for stage_info in STRESS_STAGES:
            await self.execute_stage(stage_info)
            # Brief pause between stages for connection stabilization
            await asyncio.sleep(2.0)

        if self.server_process:
            print("\nCleaning up background backend process...")
            self.server_process.terminate()
            self.server_process = None

    def analyze_breaking_points(self) -> dict:
        """ Evaluates capacity limits, degradation thresholds, and recovery capabilities """
        if not self.stage_metrics:
            return {}

        max_stable_load = 0
        degradation_load = "None (Stable)"
        high_error_load = "None (< 10% errors)"
        breaking_point = "Not Reached"
        slowest_endpoint = "N/A"
        highest_error_endpoint = "N/A"

        baseline_stage = next((s for s in self.stage_metrics if s["stage_id"] == 1), None)
        baseline_p95 = baseline_stage["p95_ms"] if baseline_stage else 1000.0

        for s in self.stage_metrics:
            if s["stage_id"] == 6:
                continue  # Skip recovery stage for capacity evaluation

            users = s["virtual_users"]
            err_pct = s["error_rate_pct"]
            p95 = s["p95_ms"]

            # Max Stable Load
            if err_pct < 5.0 and p95 < 3000:
                max_stable_load = max(max_stable_load, users)

            # Degradation Load
            if degradation_load == "None (Stable)" and (p95 > baseline_p95 * 2.0 or p95 > 2000):
                degradation_load = f"{users} Virtual Users (P95: {p95} ms)"

            # High Error Load
            if high_error_load == "None (< 10% errors)" and err_pct >= 10.0:
                high_error_load = f"{users} Virtual Users (Error Rate: {err_pct}%)"

            # Breaking Point
            if err_pct >= 50.0 or s["timeout_count"] > s["total_requests"] * 0.5:
                if breaking_point == "Not Reached":
                    breaking_point = f"{users} Virtual Users (Error Rate: {err_pct}%, Timeouts: {s['timeout_count']})"

        # Evaluate Recovery Stage (Stage 6)
        recovery_stage = next((s for s in self.stage_metrics if s["stage_id"] == 6), None)
        if recovery_stage:
            rec_err = recovery_stage["error_rate_pct"]
            rec_avg = recovery_stage["avg_response_time_ms"]
            if rec_err < 5.0 and rec_avg < 2000:
                recovery_status = "FULLY RECOVERED (Returned to baseline operational state after stress load)"
            elif rec_err < 15.0:
                recovery_status = "PARTIALLY RECOVERED (Minor residual queue latency observed)"
            else:
                recovery_status = "FAILED RECOVERY (Persistent thread pool exhaustion or error state)"
        else:
            recovery_status = "Not Tested"

        # Overall Endpoint Breakdown across all requests
        ep_data = defaultdict(list)
        for r in self.all_results:
            key = f"{r['method']} {r['endpoint']}"
            ep_data[key].append(r)

        ep_stats = []
        for key, reqs in ep_data.items():
            method, path = key.split(" ", 1)
            total = len(reqs)
            succ = sum(1 for r in reqs if r["is_success"])
            fail = total - succ
            err_pct = (fail / total * 100.0) if total > 0 else 0.0

            lats = [r["latency_ms"] for r in reqs]
            ep_stats.append({
                "endpoint": path,
                "method": method,
                "total_requests": total,
                "successful_requests": succ,
                "failed_requests": fail,
                "error_rate_pct": round(err_pct, 2),
                "avg_response_time_ms": round(float(np.mean(lats)), 2),
                "min_response_time_ms": round(float(np.min(lats)), 2),
                "max_response_time_ms": round(float(np.max(lats)), 2),
                "p50_ms": round(float(np.percentile(lats, 50)), 2),
                "p95_ms": round(float(np.percentile(lats, 95)), 2),
                "p99_ms": round(float(np.percentile(lats, 99)), 2)
            })

        if ep_stats:
            slowest_endpoint = max(ep_stats, key=lambda x: x["avg_response_time_ms"])["endpoint"]
            highest_error_endpoint = max(ep_stats, key=lambda x: x["error_rate_pct"])["endpoint"]

        # Errors list
        error_counts = Counter(r["error"] for r in self.all_results if r["error"])
        errors_list = [{"error_message": err, "occurrences": count} for err, count in error_counts.items()]

        return {
            "max_stable_user_load": f"{max_stable_load} Concurrent Virtual Users" if max_stable_load > 0 else "Below 100 Users",
            "performance_degradation_load": degradation_load,
            "high_error_rate_load": high_error_load,
            "approximate_breaking_point": breaking_point,
            "slowest_endpoint": slowest_endpoint,
            "highest_error_endpoint": highest_error_endpoint,
            "backend_recovery_status": recovery_status,
            "endpoint_statistics": ep_stats,
            "errors": errors_list
        }

def generate_excel_report(stage_metrics: list, analysis: dict, config: dict, filepath: str):
    """ Generates detailed Excel report with all 7 requested worksheets """
    wb = openpyxl.Workbook()
    wb.remove(wb.active)

    font_family = "Segoe UI"
    header_fill = PatternFill(start_color="1E293B", end_color="1E293B", fill_type="solid")
    header_font = Font(name=font_family, size=11, bold=True, color="FFFFFF")
    title_font = Font(name=font_family, size=16, bold=True, color="0F172A")
    subtitle_font = Font(name=font_family, size=11, italic=True, color="64748B")
    data_font = Font(name=font_family, size=10)
    bold_font = Font(name=font_family, size=10, bold=True)

    thin_border = Border(
        left=Side(style='thin', color='E2E8F0'),
        right=Side(style='thin', color='E2E8F0'),
        top=Side(style='thin', color='E2E8F0'),
        bottom=Side(style='thin', color='E2E8F0')
    )

    def style_headers(ws, row_idx):
        for cell in ws[row_idx]:
            cell.fill = header_fill
            cell.font = header_font
            cell.alignment = Alignment(horizontal="center", vertical="center")

    def autofit_columns(ws):
        for col in ws.columns:
            max_len = max(len(str(cell.value or '')) for cell in col)
            col_letter = get_column_letter(col[0].column)
            ws.column_dimensions[col_letter].width = max(max_len + 4, 12)

    # 1. Test Configuration
    ws1 = wb.create_sheet(title="Test Configuration")
    ws1.append(["BioPatch AI Stress Test - Configuration & Setup"])
    ws1.cell(row=1, column=1).font = title_font
    ws1.append(["Generated on " + config["timestamp"]])
    ws1.cell(row=2, column=1).font = subtitle_font
    ws1.append([])
    ws1.append(["Parameter", "Setting / Value", "Description"])
    style_headers(ws1, 4)

    config_rows = [
        ("Target Host API URL", config["target_host"], "Base URL of the BioPatch AI FastAPI backend"),
        ("Stress Test Escalation Stages", "100 -> 250 -> 500 -> 750 -> 1000 -> Recovery (50)", "Multi-stage progressive user load escalation"),
        ("Stage Hold Duration", f"{config['stage_duration_sec']} seconds per stage", "Hold time duration for each concurrency level"),
        ("Total Tested Endpoints", 5, "GET /api/dashboard, GET /api/drugs, GET /api/polymers, GET /api/reports, POST /api/simulate"),
        ("Simulate Request Payload", "Dynamic JSON Schema", "Randomized valid drug/polymer/kinetics parameters")
    ]
    for r in config_rows:
        ws1.append(r)
        for cell in ws1[ws1.max_row]:
            cell.font = data_font
            cell.border = thin_border
    autofit_columns(ws1)

    # 2. Stage Results
    ws2 = wb.create_sheet(title="Stage Results")
    ws2.append(["Stage-by-Stage Performance Comparison"])
    ws2.cell(row=1, column=1).font = title_font
    ws2.append([])
    ws2.append(["Stage Name", "Virtual Users", "Total Reqs", "Success", "Failed", "Error Rate (%)", "RPS", "Avg (ms)", "P50 (ms)", "P95 (ms)", "P99 (ms)", "Timeouts"])
    style_headers(ws2, 3)

    for sm in stage_metrics:
        ws2.append([
            sm["stage_name"], sm["virtual_users"], sm["total_requests"], sm["successful_requests"],
            sm["failed_requests"], sm["error_rate_pct"], sm["requests_per_second"], sm["avg_response_time_ms"],
            sm["p50_ms"], sm["p95_ms"], sm["p99_ms"], sm["timeout_count"]
        ])
        for cell in ws2[ws2.max_row]:
            cell.font = data_font
            cell.border = thin_border
            cell.alignment = Alignment(horizontal="right" if isinstance(cell.value, (int, float)) else "left")
    autofit_columns(ws2)

    # 3. Endpoint Results
    ws3 = wb.create_sheet(title="Endpoint Results")
    ws3.append(["Aggregated Endpoint Performance Breakdown"])
    ws3.cell(row=1, column=1).font = title_font
    ws3.append([])
    ws3.append(["Endpoint", "Method", "Total Reqs", "Success", "Failed", "Error Rate (%)", "Avg (ms)", "Min (ms)", "Max (ms)", "P50 (ms)", "P95 (ms)", "P99 (ms)"])
    style_headers(ws3, 3)

    for ep in analysis["endpoint_statistics"]:
        ws3.append([
            ep["endpoint"], ep["method"], ep["total_requests"], ep["successful_requests"], ep["failed_requests"],
            ep["error_rate_pct"], ep["avg_response_time_ms"], ep["min_response_time_ms"], ep["max_response_time_ms"],
            ep["p50_ms"], ep["p95_ms"], ep["p99_ms"]
        ])
        for cell in ws3[ws3.max_row]:
            cell.font = data_font
            cell.border = thin_border
            cell.alignment = Alignment(horizontal="right" if isinstance(cell.value, (int, float)) else "left")
    autofit_columns(ws3)

    # 4. Response Time Metrics
    ws4 = wb.create_sheet(title="Response Time Metrics")
    ws4.append(["Latency & Percentile Distribution Metrics"])
    ws4.cell(row=1, column=1).font = title_font
    ws4.append([])
    ws4.append(["Stage", "Users", "Min Latency (ms)", "Avg Latency (ms)", "Median P50 (ms)", "P95 Latency (ms)", "P99 Latency (ms)", "Max Latency (ms)"])
    style_headers(ws4, 3)

    for sm in stage_metrics:
        ws4.append([
            sm["stage_name"], sm["virtual_users"], sm["min_response_time_ms"], sm["avg_response_time_ms"],
            sm["p50_ms"], sm["p95_ms"], sm["p99_ms"], sm["max_response_time_ms"]
        ])
        for cell in ws4[ws4.max_row]:
            cell.font = data_font
            cell.border = thin_border
            cell.alignment = Alignment(horizontal="right" if isinstance(cell.value, (int, float)) else "left")
    autofit_columns(ws4)

    # 5. Error Analysis
    ws5 = wb.create_sheet(title="Error Analysis")
    ws5.append(["Exception & Failure Analysis"])
    ws5.cell(row=1, column=1).font = title_font
    ws5.append([])
    ws5.append(["Error Message / Exception", "Occurrences", "Impact Level"])
    style_headers(ws5, 3)

    if analysis["errors"]:
        for err in analysis["errors"]:
            ws5.append([err["error_message"], err["occurrences"], "Critical" if err["occurrences"] > 100 else "Moderate"])
            for cell in ws5[ws5.max_row]:
                cell.font = data_font
                cell.border = thin_border
    else:
        ws5.append(["No errors observed across all stress testing stages.", 0, "None"])
        for cell in ws5[ws5.max_row]:
            cell.font = data_font
            cell.border = thin_border
    autofit_columns(ws5)

    # 6. Breaking Point Analysis
    ws6 = wb.create_sheet(title="Breaking Point Analysis")
    ws6.append(["System Limit & Capacity Analysis"])
    ws6.cell(row=1, column=1).font = title_font
    ws6.append([])
    ws6.append(["Capacity Metric", "Result / Observation", "Engineering Evaluation"])
    style_headers(ws6, 3)

    bp_rows = [
        ("Maximum Stable User Load", analysis["max_stable_user_load"], "Highest concurrency with < 5% error rate and acceptable response time"),
        ("Performance Degradation Threshold", analysis["performance_degradation_load"], "Stage where P95 response times exceeded baseline target"),
        ("High Error Rate Threshold", analysis["high_error_rate_load"], "Stage where error rate exceeded 10% threshold"),
        ("Approximate System Breaking Point", analysis["approximate_breaking_point"], "Stage where failure rate exceeded 50% or queue starvation occurred"),
        ("Slowest API Endpoint", analysis["slowest_endpoint"], "Endpoint requiring highest CPU/memory computation"),
        ("Highest Error Rate Endpoint", analysis["highest_error_endpoint"], "Endpoint with highest connection rejection rate"),
        ("Post-Stress Recovery Evaluation", analysis["backend_recovery_status"], "System resilience after returning to low user load")
    ]

    for r in bp_rows:
        ws6.append(r)
        for cell in ws6[ws6.max_row]:
            cell.font = bold_font if cell.column == 1 else data_font
            cell.border = thin_border
    autofit_columns(ws6)

    # 7. Final Summary
    ws7 = wb.create_sheet(title="Final Summary")
    ws7.append(["BioPatch AI Stress Test - Executive Summary"])
    ws7.cell(row=1, column=1).font = title_font
    ws7.append([])
    ws7.append(["Executive Assessment Item", "Summary Details"])
    style_headers(ws7, 3)

    total_all_reqs = sum(s["total_requests"] for s in stage_metrics)
    total_all_succ = sum(s["successful_requests"] for s in stage_metrics)
    overall_err_rate = round((sum(s["failed_requests"] for s in stage_metrics) / total_all_reqs * 100.0) if total_all_reqs > 0 else 0, 2)

    summary_rows = [
        ("Total Executed Stress Requests", total_all_reqs),
        ("Total Successful Requests", total_all_succ),
        ("Overall Stress Error Rate", f"{overall_err_rate}%"),
        ("Maximum Stable Concurrency", analysis["max_stable_user_load"]),
        ("System Breaking Point", analysis["approximate_breaking_point"]),
        ("Resilience / Recovery Status", analysis["backend_recovery_status"]),
        ("Slowest Endpoint", analysis["slowest_endpoint"]),
        ("Recommendation", "Implement multi-worker process deployment (Gunicorn / Uvicorn workers = 4+), database connection pooling, and payload caching for /api/simulate calculations.")
    ]

    for r in summary_rows:
        ws7.append(r)
        for cell in ws7[ws7.max_row]:
            cell.font = bold_font if cell.column == 1 else data_font
            cell.border = thin_border
    autofit_columns(ws7)

    os.makedirs(os.path.dirname(filepath), exist_ok=True)
    wb.save(filepath)
    print(f"[REPORT] Generated Excel report: {filepath}")

def generate_html_report(stage_metrics: list, analysis: dict, config: dict, filepath: str):
    """ Generates a modern HTML report for the stress test """
    stage_rows_html = ""
    for s in stage_metrics:
        err_badge = "badge-success" if s["error_rate_pct"] < 5 else ("badge-warning" if s["error_rate_pct"] < 25 else "badge-danger")
        stage_rows_html += f"""
        <tr>
            <td><strong>{s['stage_name']}</strong></td>
            <td>{s['virtual_users']}</td>
            <td>{s['total_requests']}</td>
            <td>{s['successful_requests']}</td>
            <td>{s['failed_requests']}</td>
            <td><span class="badge {err_badge}">{s['error_rate_pct']}%</span></td>
            <td><strong>{s['requests_per_second']}</strong></td>
            <td>{s['avg_response_time_ms']} ms</td>
            <td>{s['p50_ms']} ms</td>
            <td><strong>{s['p95_ms']} ms</strong></td>
            <td>{s['p99_ms']} ms</td>
        </tr>
        """

    ep_rows_html = ""
    for ep in analysis["endpoint_statistics"]:
        badge_class = "badge-success" if ep["error_rate_pct"] == 0 else "badge-warning"
        ep_rows_html += f"""
        <tr>
            <td><code>{ep['method']} {ep['endpoint']}</code></td>
            <td>{ep['total_requests']}</td>
            <td>{ep['successful_requests']}</td>
            <td>{ep['failed_requests']}</td>
            <td><span class="badge {badge_class}">{ep['error_rate_pct']}%</span></td>
            <td>{ep['avg_response_time_ms']} ms</td>
            <td>{ep['min_response_time_ms']} ms</td>
            <td>{ep['max_response_time_ms']} ms</td>
            <td>{ep['p50_ms']} ms</td>
            <td><strong>{ep['p95_ms']} ms</strong></td>
        </tr>
        """

    errors_html = ""
    if analysis["errors"]:
        for err in analysis["errors"]:
            errors_html += f"""
            <div class="error-item">
                <span class="error-count">{err['occurrences']}x</span>
                <code>{err['error_message']}</code>
            </div>
            """
    else:
        errors_html = "<div class='no-errors'>Zero errors recorded across all stress testing stages.</div>"

    html_content = f"""<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>BioPatch AI - Multi-Stage Stress Test Report</title>
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
            background: rgba(239, 68, 68, 0.15);
            color: var(--danger);
            border: 1px solid var(--danger);
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
        }}
        .card-label {{
            font-size: 12px;
            color: var(--text-muted);
            text-transform: uppercase;
            letter-spacing: 0.05em;
            margin-bottom: 8px;
        }}
        .card-value {{
            font-size: 22px;
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
        .badge-danger {{ background: rgba(239, 68, 68, 0.15); color: var(--danger); }}
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
                <h1>BioPatch AI Multi-Stage Stress Test Report</h1>
                <div class="subtitle">Execution Timestamp: {config['timestamp']} | Host: {config['target_host']}</div>
            </div>
            <div class="status-badge">STRESS TEST COMPLETE</div>
        </div>

        <div class="grid">
            <div class="card">
                <div class="card-label">Max Stable Load</div>
                <div class="card-value">{analysis['max_stable_user_load']}</div>
                <div class="card-sub">Error Rate &lt; 5%</div>
            </div>
            <div class="card">
                <div class="card-label">Degradation Threshold</div>
                <div class="card-value">{analysis['performance_degradation_load']}</div>
                <div class="card-sub">Latency Increase Point</div>
            </div>
            <div class="card">
                <div class="card-label">Breaking Point</div>
                <div class="card-value">{analysis['approximate_breaking_point']}</div>
                <div class="card-sub">Failure / Queue Starvation</div>
            </div>
            <div class="card">
                <div class="card-label">Recovery Status</div>
                <div class="card-value" style="font-size: 16px;">{analysis['backend_recovery_status']}</div>
                <div class="card-sub">Post-Stress Resilience</div>
            </div>
        </div>

        <h2>Multi-Stage Concurrency Progression</h2>
        <table>
            <thead>
                <tr>
                    <th>Stage</th>
                    <th>Users</th>
                    <th>Total Reqs</th>
                    <th>Passed</th>
                    <th>Failed</th>
                    <th>Error Rate</th>
                    <th>RPS</th>
                    <th>Avg</th>
                    <th>P50</th>
                    <th>P95</th>
                    <th>P99</th>
                </tr>
            </thead>
            <tbody>
                {stage_rows_html}
            </tbody>
        </table>

        <h2>Overall Endpoint Statistics</h2>
        <table>
            <thead>
                <tr>
                    <th>Endpoint</th>
                    <th>Total</th>
                    <th>Passed</th>
                    <th>Failed</th>
                    <th>Error Rate</th>
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

def generate_json_summary(stage_metrics: list, analysis: dict, config: dict, filepath: str):
    """ Generates structured machine-readable JSON summary """
    data = {
        "test_configuration": config,
        "stage_metrics": stage_metrics,
        "breaking_point_analysis": analysis
    }
    os.makedirs(os.path.dirname(filepath), exist_ok=True)
    with open(filepath, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2)
    print(f"[REPORT] Generated JSON summary: {filepath}")

async def main():
    parser = argparse.ArgumentParser(description="BioPatch AI Multi-Stage Stress Performance Tester")
    parser.add_argument("--url", default=DEFAULT_BASE_URL, help="Target backend API base URL")
    parser.add_argument("--stage-duration", type=int, default=DEFAULT_STAGE_DURATION, help="Duration in seconds per stage")
    parser.add_argument("--out-dir", default=None, help="Output directory for reports")

    args = parser.parse_args()

    if args.out_dir is None:
        repo_root = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", ".."))
        reports_dir = os.path.join(repo_root, "tests", "performance", "reports")
    else:
        reports_dir = args.out_dir

    config_info = {
        "target_host": args.url,
        "stage_duration_sec": args.stage_duration,
        "stages": [s["name"] for s in STRESS_STAGES],
        "timestamp": datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    }

    runner = StressTestRunner(base_url=args.url, stage_duration=args.stage_duration)

    # 1. Ensure backend is running
    runner.ensure_backend_running()

    # 2. Execute Multi-Stage Stress Test
    await runner.run_stress_test()

    # 3. Analyze Breaking Points & Capacity
    analysis = runner.analyze_breaking_points()

    # 4. Export Reports
    excel_path = os.path.join(reports_dir, "BioPatch_Stress_Test_Report.xlsx")
    html_path = os.path.join(reports_dir, "BioPatch_Stress_Test_Report.html")
    json_path = os.path.join(reports_dir, "BioPatch_Stress_Test_Summary.json")

    generate_excel_report(runner.stage_metrics, analysis, config_info, excel_path)
    generate_html_report(runner.stage_metrics, analysis, config_info, html_path)
    generate_json_summary(runner.stage_metrics, analysis, config_info, json_path)

    # Console Summary Table
    print("\n==================================================")
    print("BIOPATCH AI STRESS TEST RESULTS SUMMARY")
    print("==================================================")
    print(f"Max Stable Load    : {analysis['max_stable_user_load']}")
    print(f"Degradation Load   : {analysis['performance_degradation_load']}")
    print(f"High Error Load    : {analysis['high_error_rate_load']}")
    print(f"Breaking Point     : {analysis['approximate_breaking_point']}")
    print(f"Recovery Status    : {analysis['backend_recovery_status']}")
    print("==================================================")
    print(f"Slowest Endpoint   : {analysis['slowest_endpoint']}")
    print(f"Highest Error EP   : {analysis['highest_error_endpoint']}")
    print("==================================================\n")

if __name__ == "__main__":
    asyncio.run(main())
