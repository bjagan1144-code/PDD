#!/usr/bin/env python3
"""
BioPatch AI - Spike & Recovery Performance Test Suite
------------------------------------------------------
Executes a high-intensity traffic spike and recovery test against BioPatch AI FastAPI backend,
measuring system degradation under sudden massive traffic surges and post-spike recovery resilience.

Phases:
  Phase 1: Pre-Spike Baseline (100 Virtual Users)
  Phase 2: Immediate Spike Ramp-Up (Instant burst to 1000 Virtual Users)
  Phase 3: Peak Spike Hold (1000 Virtual Users)
  Phase 4: Immediate Traffic Drop (Reduce back to 100 Virtual Users)
  Phase 5: Post-Spike Recovery Hold (100 Virtual Users)
  Phase 6: Cool-Down & Backend Health Recovery Monitoring (0 Users)

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
DEFAULT_PHASE_DURATION = 20  # seconds per phase

SPIKE_PHASES = [
    {"phase": 1, "name": "Phase 1: Pre-Spike Baseline (100 Users)", "users": 100},
    {"phase": 2, "name": "Phase 2: Immediate Spike Ramp-Up (Burst to 1000 Users)", "users": 1000},
    {"phase": 3, "name": "Phase 3: Peak Spike Hold (1000 Users)", "users": 1000},
    {"phase": 4, "name": "Phase 4: Immediate Traffic Drop (Reduce to 100 Users)", "users": 100},
    {"phase": 5, "name": "Phase 5: Post-Spike Recovery Hold (100 Users)", "users": 100},
    {"phase": 6, "name": "Phase 6: Cool-Down & Backend Health Recovery (0 Users)", "users": 0}
]

DRUGS = ["Metformin", "Paracetamol", "Losartan", "Ibuprofen"]
POLYMERS = ["PLA", "Alginate", "Gelatin", "Pectin", "Cellulose", "Chitosan"]

class SpikeTestRunner:
    def __init__(self, base_url: str, phase_duration: int):
        self.base_url = base_url.rstrip('/')
        self.phase_duration = phase_duration
        self.all_results = []
        self.phase_metrics = []
        self.server_process = None
        self.health_recovery_time_sec = 0.0

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

    async def worker(self, user_id: int, stop_event: asyncio.Event, phase_id: int, results_list: list):
        """ Worker loop for virtual users in a phase """
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
                    "phase_id": phase_id,
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

    async def monitor_health_recovery(self, max_wait_sec: int = 30) -> float:
        """ Phase 6: Monitors backend /health response latency after stopping load to measure exact recovery time """
        print("\n--------------------------------------------------")
        print("[PHASE 6] MONITORING BACKEND HEALTH & SYSTEM RECOVERY TIME")
        print("--------------------------------------------------")

        start_mon = time.time()
        recovered_time = max_wait_sec

        async with httpx.AsyncClient(base_url=self.base_url, timeout=httpx.Timeout(5.0)) as client:
            for i in range(1, max_wait_sec + 1):
                t0 = time.perf_counter()
                try:
                    res = await client.get("/health")
                    lat_ms = (time.perf_counter() - t0) * 1000.0
                    if res.status_code == 200 and lat_ms < 150.0:
                        recovered_time = round(time.time() - start_mon, 2)
                        print(f" [OK] Backend health returned to baseline in {recovered_time}s (Latency: {lat_ms:.1f}ms).")
                        self.health_recovery_time_sec = recovered_time
                        return recovered_time
                    else:
                        print(f"  [Monitoring... {i}s] Status: {res.status_code} | Health Latency: {lat_ms:.1f}ms", end="\r")
                except Exception as e:
                    print(f"  [Monitoring... {i}s] Health check error: {e}", end="\r")

                await asyncio.sleep(1.0)

        print(f"\n [WARN] Backend health check did not reach <150ms baseline within {max_wait_sec}s.")
        self.health_recovery_time_sec = max_wait_sec
        return max_wait_sec

    async def execute_phase(self, phase_info: dict) -> dict:
        """ Executes a single phase in the spike test """
        phase_id = phase_info["phase"]
        phase_name = phase_info["name"]
        num_users = phase_info["users"]

        if phase_id == 6:
            rec_sec = await self.monitor_health_recovery(self.phase_duration)
            summary = {
                "phase_id": 6,
                "phase_name": phase_name,
                "virtual_users": 0,
                "total_requests": 0,
                "successful_requests": 0,
                "failed_requests": 0,
                "error_rate_pct": 0.0,
                "requests_per_second": 0.0,
                "avg_response_time_ms": 0.0,
                "min_response_time_ms": 0.0,
                "max_response_time_ms": 0.0,
                "p50_ms": 0.0,
                "p95_ms": 0.0,
                "p99_ms": 0.0,
                "timeout_count": 0,
                "http_status_codes": {},
                "health_recovery_time_sec": rec_sec
            }
            self.phase_metrics.append(summary)
            return summary

        print(f"\n--------------------------------------------------")
        print(f"[PHASE] EXECUTING {phase_name.upper()} ({num_users} Concurrent Users)")
        print(f"--------------------------------------------------")

        stop_event = asyncio.Event()
        phase_results = []
        workers = []

        for i in range(num_users):
            workers.append(asyncio.create_task(self.worker(i + 1, stop_event, phase_id, phase_results)))

        start_time = time.time()
        while time.time() - start_time < self.phase_duration:
            elapsed = time.time() - start_time
            req_count = len(phase_results)
            current_rps = req_count / elapsed if elapsed > 0 else 0
            print(f"  [{phase_name}] Elapsed: {int(elapsed)}s / {self.phase_duration}s | Completed: {req_count} reqs | RPS: {current_rps:.1f}", end="\r")
            await asyncio.sleep(1.0)

        stop_event.set()
        await asyncio.gather(*workers, return_exceptions=True)

        actual_duration = time.time() - start_time
        print(f"\n[OK] {phase_name} finished in {actual_duration:.2f}s. Captured {len(phase_results)} requests.")

        total_reqs = len(phase_results)
        successful_reqs = sum(1 for r in phase_results if r["is_success"])
        failed_reqs = total_reqs - successful_reqs
        timeout_count = sum(1 for r in phase_results if r["is_timeout"])
        error_rate = (failed_reqs / total_reqs * 100.0) if total_reqs > 0 else 0.0
        rps = total_reqs / actual_duration if actual_duration > 0 else 0.0

        if total_reqs > 0:
            latencies = [r["latency_ms"] for r in phase_results]
            avg_lat = float(np.mean(latencies))
            min_lat = float(np.min(latencies))
            max_lat = float(np.max(latencies))
            p50_lat = float(np.percentile(latencies, 50))
            p95_lat = float(np.percentile(latencies, 95))
            p99_lat = float(np.percentile(latencies, 99))
        else:
            avg_lat = min_lat = max_lat = p50_lat = p95_lat = p99_lat = 0.0

        status_codes = Counter(str(r["status_code"]) if r["status_code"] != 0 else "Timeout/Err" for r in phase_results)

        phase_summary = {
            "phase_id": phase_id,
            "phase_name": phase_name,
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
        self.phase_metrics.append(phase_summary)
        return phase_summary

    async def run_spike_test(self):
        """ Sequentially runs all 6 spike and recovery testing phases """
        print(f"\n==================================================")
        print(f"STARTING BIOPATCH AI SPIKE & RECOVERY TEST")
        print(f"==================================================")
        print(f"* Target Host      : {self.base_url}")
        print(f"* Phase Duration   : {self.phase_duration} seconds per phase")
        print(f"* Test Sequence    : Phase 1 (100) -> Phase 2/3 (1000 Burst) -> Phase 4/5 (100 Recovery) -> Phase 6 (0)")
        print(f"==================================================\n")

        for phase_info in SPIKE_PHASES:
            await self.execute_phase(phase_info)
            await asyncio.sleep(1.0)

        if self.server_process:
            print("\nCleaning up background backend process...")
            self.server_process.terminate()
            self.server_process = None

    def analyze_spike_recovery(self) -> dict:
        """ Computes spike impact, latency inflation factor, error rate increase, and recovery status """
        if not self.phase_metrics:
            return {}

        p1_baseline = next((p for p in self.phase_metrics if p["phase_id"] == 1), None)
        p3_spike = next((p for p in self.phase_metrics if p["phase_id"] == 3 or p["phase_id"] == 2), None)
        p5_recovery = next((p for p in self.phase_metrics if p["phase_id"] == 5), None)

        base_avg = p1_baseline["avg_response_time_ms"] if p1_baseline and p1_baseline["avg_response_time_ms"] > 0 else 500.0
        base_err = p1_baseline["error_rate_pct"] if p1_baseline else 0.0

        spike_avg = p3_spike["avg_response_time_ms"] if p3_spike else base_avg
        spike_err = p3_spike["error_rate_pct"] if p3_spike else 0.0
        peak_rps = max((p["requests_per_second"] for p in self.phase_metrics), default=0.0)

        rec_avg = p5_recovery["avg_response_time_ms"] if p5_recovery else 0.0
        rec_err = p5_recovery["error_rate_pct"] if p5_recovery else 0.0

        lat_increase_factor = round(spike_avg / base_avg, 2) if base_avg > 0 else 1.0
        lat_increase_pct = round(((spike_avg - base_avg) / base_avg * 100.0), 2) if base_avg > 0 else 0.0
        err_increase_pct = round(spike_err - base_err, 2)

        # Recovery evaluation
        if rec_err <= (base_err + 5.0) and rec_avg <= (base_avg * 2.5):
            recovery_verdict = "FULL RECOVERY (Latency & Error Rate normalized post-spike)"
            recovery_time_desc = f"{self.health_recovery_time_sec} seconds (Backend /health returned to baseline)"
        elif rec_err <= (base_err + 20.0):
            recovery_verdict = "PARTIAL RECOVERY (Residual queue delay present)"
            recovery_time_desc = f"{self.health_recovery_time_sec} seconds (Partial normalization)"
        else:
            recovery_verdict = "FAILED RECOVERY (Persistent connection exhaustion after traffic drop)"
            recovery_time_desc = "Not Recovered (Exceeded timeout threshold)"

        # Endpoint stats across all results
        ep_data = defaultdict(list)
        for r in self.all_results:
            key = f"{r['method']} {r['endpoint']}"
            ep_data[key].append(r)

        ep_stats = []
        degraded_endpoints = []
        for key, reqs in ep_data.items():
            method, path = key.split(" ", 1)
            total = len(reqs)
            succ = sum(1 for r in reqs if r["is_success"])
            fail = total - succ
            err_pct = (fail / total * 100.0) if total > 0 else 0.0

            lats = [r["latency_ms"] for r in reqs]
            avg_l = float(np.mean(lats))
            p95_l = float(np.percentile(lats, 95))

            if err_pct > 20.0 or p95_l > 5000:
                degraded_endpoints.append(f"{method} {path} ({err_pct}% err, P95: {p95_l:.0f}ms)")

            ep_stats.append({
                "endpoint": path,
                "method": method,
                "total_requests": total,
                "successful_requests": succ,
                "failed_requests": fail,
                "error_rate_pct": round(err_pct, 2),
                "avg_response_time_ms": round(avg_l, 2),
                "min_response_time_ms": round(float(np.min(lats)), 2),
                "max_response_time_ms": round(float(np.max(lats)), 2),
                "p50_ms": round(float(np.percentile(lats, 50)), 2),
                "p95_ms": round(p95_l, 2),
                "p99_ms": round(float(np.percentile(lats, 99)), 2)
            })

        slowest_ep = max(ep_stats, key=lambda x: x["avg_response_time_ms"])["endpoint"] if ep_stats else "N/A"
        highest_err_ep = max(ep_stats, key=lambda x: x["error_rate_pct"])["endpoint"] if ep_stats else "N/A"

        error_counts = Counter(r["error"] for r in self.all_results if r["error"])
        errors_list = [{"error_message": err, "occurrences": count} for err, count in error_counts.items()]

        return {
            "baseline_avg_latency_ms": base_avg,
            "spike_peak_avg_latency_ms": spike_avg,
            "response_time_increase_factor": f"{lat_increase_factor}x ({lat_increase_pct}% increase)",
            "error_rate_increase_pct": f"{err_increase_pct}%",
            "peak_rps": round(peak_rps, 2),
            "performance_degradation": f"{lat_increase_factor}x slowdown during 1000 user burst",
            "recovery_time_sec": recovery_time_desc,
            "application_recovery_status": recovery_verdict,
            "degraded_endpoints": degraded_endpoints if degraded_endpoints else ["None"],
            "slowest_endpoint": slowest_ep,
            "highest_error_endpoint": highest_err_ep,
            "endpoint_statistics": ep_stats,
            "errors": errors_list
        }

def generate_excel_report(phase_metrics: list, analysis: dict, config: dict, filepath: str):
    """ Generates clean Excel report with all 7 requested worksheets """
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
    ws1.append(["BioPatch AI Spike & Recovery Test - Configuration Settings"])
    ws1.cell(row=1, column=1).font = title_font
    ws1.append(["Generated on " + config["timestamp"]])
    ws1.cell(row=2, column=1).font = subtitle_font
    ws1.append([])
    ws1.append(["Parameter", "Setting / Value", "Description"])
    style_headers(ws1, 4)

    config_rows = [
        ("Target Host API URL", config["target_host"], "Base URL of the BioPatch AI FastAPI backend"),
        ("Spike Sequence", "Baseline (100) -> Spike (1000) -> Drop (100) -> Cool-down (0)", "Sudden 10x traffic burst and recovery workflow"),
        ("Phase Hold Duration", f"{config['phase_duration_sec']} seconds per phase", "Duration of active user load per phase"),
        ("Tested Endpoints", 5, "GET /api/dashboard, GET /api/drugs, GET /api/polymers, GET /api/reports, POST /api/simulate"),
        ("Simulate Request Payload", "Dynamic JSON Schema", "Randomized valid drug/polymer/kinetics parameters")
    ]
    for r in config_rows:
        ws1.append(r)
        for cell in ws1[ws1.max_row]:
            cell.font = data_font
            cell.border = thin_border
    autofit_columns(ws1)

    # 2. Phase Results
    ws2 = wb.create_sheet(title="Phase Results")
    ws2.append(["Spike & Recovery Phase Performance Results"])
    ws2.cell(row=1, column=1).font = title_font
    ws2.append([])
    ws2.append(["Phase Name", "Virtual Users", "Total Reqs", "Success", "Failed", "Error Rate (%)", "RPS", "Avg (ms)", "P50 (ms)", "P95 (ms)", "P99 (ms)", "Timeouts"])
    style_headers(ws2, 3)

    for pm in phase_metrics:
        ws2.append([
            pm["phase_name"], pm["virtual_users"], pm["total_requests"], pm["successful_requests"],
            pm["failed_requests"], pm["error_rate_pct"], pm["requests_per_second"], pm["avg_response_time_ms"],
            pm["p50_ms"], pm["p95_ms"], pm["p99_ms"], pm["timeout_count"]
        ])
        for cell in ws2[ws2.max_row]:
            cell.font = data_font
            cell.border = thin_border
            cell.alignment = Alignment(horizontal="right" if isinstance(cell.value, (int, float)) else "left")
    autofit_columns(ws2)

    # 3. Endpoint Results
    ws3 = wb.create_sheet(title="Endpoint Results")
    ws3.append(["Aggregated Endpoint Performance Metrics"])
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

    # 4. Response Time Analysis
    ws4 = wb.create_sheet(title="Response Time Analysis")
    ws4.append(["Spike Latency & Response Time Inflation Analysis"])
    ws4.cell(row=1, column=1).font = title_font
    ws4.append([])
    ws4.append(["Latency Analysis Item", "Value / Metric", "Description"])
    style_headers(ws4, 3)

    lat_rows = [
        ("Pre-Spike Baseline Avg Latency (100 Users)", f"{analysis['baseline_avg_latency_ms']} ms", "Normal baseline response time before spike"),
        ("Peak Spike Avg Latency (1000 Users)", f"{analysis['spike_peak_avg_latency_ms']} ms", "Average latency during 10x traffic burst"),
        ("Response Time Increase Factor", analysis["response_time_increase_factor"], "Multiplier increase in latency during spike"),
        ("Peak System Throughput (RPS)", f"{analysis['peak_rps']} req/sec", "Maximum requests per second sustained during spike"),
        ("Performance Degradation Rating", analysis["performance_degradation"], "Evaluation of latency inflation and bottleneck severity")
    ]
    for r in lat_rows:
        ws4.append(r)
        for cell in ws4[ws4.max_row]:
            cell.font = data_font
            cell.border = thin_border
    autofit_columns(ws4)

    # 5. Error Analysis
    ws5 = wb.create_sheet(title="Error Analysis")
    ws5.append(["Spike Error & Rejection Details"])
    ws5.cell(row=1, column=1).font = title_font
    ws5.append([])
    ws5.append(["Error Message / Exception", "Occurrences", "Impact Level"])
    style_headers(ws5, 3)

    if analysis["errors"]:
        for err in analysis["errors"]:
            ws5.append([err["error_message"], err["occurrences"], "Critical" if err["occurrences"] > 50 else "Moderate"])
            for cell in ws5[ws5.max_row]:
                cell.font = data_font
                cell.border = thin_border
    else:
        ws5.append(["No errors captured during spike execution.", 0, "None"])
        for cell in ws5[ws5.max_row]:
            cell.font = data_font
            cell.border = thin_border
    autofit_columns(ws5)

    # 6. Recovery Analysis
    ws6 = wb.create_sheet(title="Recovery Analysis")
    ws6.append(["Post-Spike Resilience & System Recovery Analysis"])
    ws6.cell(row=1, column=1).font = title_font
    ws6.append([])
    ws6.append(["Recovery Assessment Item", "Result / Measurement", "Engineering Evaluation"])
    style_headers(ws6, 3)

    rec_rows = [
        ("Application Recovery Verdict", analysis["application_recovery_status"], "Evaluation of whether latency & errors normalized post-spike"),
        ("System Recovery Duration", analysis["recovery_time_sec"], "Time elapsed before health checks returned to baseline latency"),
        ("Error Rate Increase During Spike", analysis["error_rate_increase_pct"], "Percentage jump in failed requests during peak spike"),
        ("Endpoints Remaining Degraded", ", ".join(analysis["degraded_endpoints"]), "Endpoints exhibiting persistent slow latency post-spike"),
        ("Slowest API Endpoint", analysis["slowest_endpoint"], "API endpoint with highest average latency across test"),
        ("Highest Error Endpoint", analysis["highest_error_endpoint"], "API endpoint with highest failure percentage")
    ]

    for r in rec_rows:
        ws6.append(r)
        for cell in ws6[ws6.max_row]:
            cell.font = bold_font if cell.column == 1 else data_font
            cell.border = thin_border
    autofit_columns(ws6)

    # 7. Final Summary
    ws7 = wb.create_sheet(title="Final Summary")
    ws7.append(["BioPatch AI Spike & Recovery Test - Executive Summary"])
    ws7.cell(row=1, column=1).font = title_font
    ws7.append([])
    ws7.append(["Executive Assessment Item", "Summary Details"])
    style_headers(ws7, 3)

    total_all_reqs = sum(p["total_requests"] for p in phase_metrics)
    total_all_succ = sum(p["successful_requests"] for p in phase_metrics)

    summary_rows = [
        ("Total Executed Requests", total_all_reqs),
        ("Total Successful Requests", total_all_succ),
        ("Peak Spike Concurrency", "1000 Virtual Users"),
        ("Peak Sustained Throughput", f"{analysis['peak_rps']} req/sec"),
        ("Latency Inflation During Spike", analysis["response_time_increase_factor"]),
        ("Application Recovery Verdict", analysis["application_recovery_status"]),
        ("System Health Recovery Time", analysis["recovery_time_sec"]),
        ("Engineering Recommendation", "Implement rate-limiting (e.g. slowapi/redis), async background task queues (Celery/rq) for kinetics engine, and auto-scaling worker pools to absorb traffic spikes.")
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

def generate_html_report(phase_metrics: list, analysis: dict, config: dict, filepath: str):
    """ Generates modern HTML report for the spike and recovery test """
    phase_rows_html = ""
    for p in phase_metrics:
        err_badge = "badge-success" if p["error_rate_pct"] < 5 else ("badge-warning" if p["error_rate_pct"] < 25 else "badge-danger")
        phase_rows_html += f"""
        <tr>
            <td><strong>{p['phase_name']}</strong></td>
            <td>{p['virtual_users']}</td>
            <td>{p['total_requests']}</td>
            <td>{p['successful_requests']}</td>
            <td>{p['failed_requests']}</td>
            <td><span class="badge {err_badge}">{p['error_rate_pct']}%</span></td>
            <td><strong>{p['requests_per_second']}</strong></td>
            <td>{p['avg_response_time_ms']} ms</td>
            <td>{p['p50_ms']} ms</td>
            <td><strong>{p['p95_ms']} ms</strong></td>
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
        errors_html = "<div class='no-errors'>Zero errors captured during spike execution.</div>"

    html_content = f"""<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>BioPatch AI - Spike & Recovery Performance Report</title>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
    <style>
        :root {{
            --bg: #0F172A;
            --card-bg: #1E293B;
            --accent: #38BDF8;
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
            background: rgba(56, 189, 248, 0.15);
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
                <h1>BioPatch AI Spike & Recovery Report</h1>
                <div class="subtitle">Execution Timestamp: {config['timestamp']} | Host: {config['target_host']}</div>
            </div>
            <div class="status-badge">SPIKE TEST COMPLETE</div>
        </div>

        <div class="grid">
            <div class="card">
                <div class="card-label">Latency Increase</div>
                <div class="card-value">{analysis['response_time_increase_factor']}</div>
                <div class="card-sub">Pre-Spike vs 1000 User Peak</div>
            </div>
            <div class="card">
                <div class="card-label">Peak Throughput</div>
                <div class="card-value">{analysis['peak_rps']} RPS</div>
                <div class="card-sub">Max Sustained Rate</div>
            </div>
            <div class="card">
                <div class="card-label">Recovery Status</div>
                <div class="card-value" style="font-size: 16px;">{analysis['application_recovery_status']}</div>
                <div class="card-sub">Resilience Assessment</div>
            </div>
            <div class="card">
                <div class="card-label">Health Recovery Time</div>
                <div class="card-value" style="font-size: 16px;">{analysis['recovery_time_sec']}</div>
                <div class="card-sub">Return to Baseline Latency</div>
            </div>
        </div>

        <h2>Spike & Recovery Phase Timeline</h2>
        <table>
            <thead>
                <tr>
                    <th>Phase Name</th>
                    <th>Users</th>
                    <th>Total Reqs</th>
                    <th>Passed</th>
                    <th>Failed</th>
                    <th>Error Rate</th>
                    <th>RPS</th>
                    <th>Avg</th>
                    <th>P50</th>
                    <th>P95</th>
                </tr>
            </thead>
            <tbody>
                {phase_rows_html}
            </tbody>
        </table>

        <h2>Endpoint Breakdown Across Test</h2>
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

def generate_json_summary(phase_metrics: list, analysis: dict, config: dict, filepath: str):
    """ Generates structured machine-readable JSON summary """
    data = {
        "test_configuration": config,
        "phase_metrics": phase_metrics,
        "spike_recovery_analysis": analysis
    }
    os.makedirs(os.path.dirname(filepath), exist_ok=True)
    with open(filepath, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2)
    print(f"[REPORT] Generated JSON summary: {filepath}")

async def main():
    parser = argparse.ArgumentParser(description="BioPatch AI Spike & Recovery Performance Tester")
    parser.add_argument("--url", default=DEFAULT_BASE_URL, help="Target backend API base URL")
    parser.add_argument("--phase-duration", type=int, default=DEFAULT_PHASE_DURATION, help="Duration in seconds per phase")
    parser.add_argument("--out-dir", default=None, help="Output directory for reports")

    args = parser.parse_args()

    if args.out_dir is None:
        repo_root = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", ".."))
        reports_dir = os.path.join(repo_root, "tests", "performance", "reports")
    else:
        reports_dir = args.out_dir

    config_info = {
        "target_host": args.url,
        "phase_duration_sec": args.phase_duration,
        "phases": [p["name"] for p in SPIKE_PHASES],
        "timestamp": datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    }

    runner = SpikeTestRunner(base_url=args.url, phase_duration=args.phase_duration)

    # 1. Ensure backend is running
    runner.ensure_backend_running()

    # 2. Execute Spike & Recovery Test
    await runner.run_spike_test()

    # 3. Analyze Spike Impact & Recovery
    analysis = runner.analyze_spike_recovery()

    # 4. Export Reports
    excel_path = os.path.join(reports_dir, "BioPatch_Spike_Recovery_Test_Report.xlsx")
    html_path = os.path.join(reports_dir, "BioPatch_Spike_Recovery_Test_Report.html")
    json_path = os.path.join(reports_dir, "BioPatch_Spike_Recovery_Summary.json")

    generate_excel_report(runner.phase_metrics, analysis, config_info, excel_path)
    generate_html_report(runner.phase_metrics, analysis, config_info, html_path)
    generate_json_summary(runner.phase_metrics, analysis, config_info, json_path)

    # Console Summary Table
    print("\n==================================================")
    print("BIOPATCH AI SPIKE & RECOVERY TEST RESULTS SUMMARY")
    print("==================================================")
    print(f"Pre-Spike Baseline Avg : {analysis['baseline_avg_latency_ms']} ms")
    print(f"Peak Spike Avg Latency : {analysis['spike_peak_avg_latency_ms']} ms")
    print(f"Latency Inflation      : {analysis['response_time_increase_factor']}")
    print(f"Error Rate Increase    : {analysis['error_rate_increase_pct']}")
    print(f"Peak Sustained RPS     : {analysis['peak_rps']} req/s")
    print(f"Recovery Time          : {analysis['recovery_time_sec']}")
    print(f"Recovery Verdict       : {analysis['application_recovery_status']}")
    print("==================================================")
    print(f"Slowest Endpoint       : {analysis['slowest_endpoint']}")
    print(f"Highest Error EP       : {analysis['highest_error_endpoint']}")
    print("==================================================\n")

if __name__ == "__main__":
    asyncio.run(main())
