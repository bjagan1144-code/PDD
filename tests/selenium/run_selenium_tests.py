#!/usr/bin/env python3
"""
BioPatch AI - Selenium Web Automation Test Suite Runner
-------------------------------------------------------
Executes automated browser tests using Selenium WebDriver against the complete
BioPatch AI React web application (http://localhost:5173).

Test Coverage (25 Areas):
  1. Home Page Loading & Branding
  2. Home Page Navigation
  3. Login Page Form Rendering
  4. Login Form Validation
  5. Login Invalid Credentials Error Toast
  6. Login Demo Researcher Authentication
  7. Registration Page Form Rendering
  8. Registration Password Mismatch Validation
  9. Registration Success & Auto-Login Workflow
 10. Forgot Password Link Dispatch Workflow
 11. Dashboard Metric Cards Rendering
 12. Dashboard Recharts SVG Graph Rendering
 13. Simulator Controls (Inputs, Sliders, Dropdowns)
 14. Simulator Kinetics Engine Execution Workflow
 15. AI Prediction Model Metrics (Random Forest)
 16. Release Monitor Real-time Biological Sensors
 17. Drug Library Catalog & Search Filtering
 18. Polymer Library Matrix Catalog
 19. Simulation History Archives
 20. Reports Archives & PDF Generation
 21. User Profile & Account Settings Form
 22. Sidebar Menu Navigation Between Pages
 23. Responsive Mobile Viewport Layout (375x812)
 24. Unauthenticated Route Session Protection Redirect
 25. Logout Workflow & Token Clearance
"""

import os
import sys
import time
import json
import argparse
import subprocess
from datetime import datetime

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

from config import create_driver, DEFAULT_WEB_URL, DEFAULT_BACKEND_URL
from test_cases import BioPatchSeleniumTests

TEST_CATALOG = [
    {
        "id": "SEL-001",
        "name": "Home Page Loading & Branding",
        "module": "Home / Landing",
        "steps": "1. Navigate to /\n2. Verify page title and BIOPATCH AI hero branding text",
        "expected": "Home page loads cleanly with correct branding text",
        "func": "test_01_home_page_load"
    },
    {
        "id": "SEL-002",
        "name": "Home Page Navigation to Login",
        "module": "Home / Landing",
        "steps": "1. Navigate to /\n2. Click 'Sign In' or 'Explore Portal' link\n3. Verify redirect to /login",
        "expected": "URL updates to /login and Login page renders",
        "func": "test_02_home_page_navigation"
    },
    {
        "id": "SEL-003",
        "name": "Login Page Form Elements Render",
        "module": "Login / Auth",
        "steps": "1. Navigate to /login\n2. Inspect Email, Password, and Submit button fields",
        "expected": "All form inputs and buttons are visible and active",
        "func": "test_03_login_page_form_render"
    },
    {
        "id": "SEL-004",
        "name": "Login Form Validation (Empty Fields)",
        "module": "Login / Auth",
        "steps": "1. Navigate to /login\n2. Click 'Sign In' without filling inputs\n3. Check alert toast",
        "expected": "Validation alert requires email and password",
        "func": "test_04_login_form_validation"
    },
    {
        "id": "SEL-005",
        "name": "Login Invalid Credentials Error Toast",
        "module": "Login / Auth",
        "steps": "1. Navigate to /login\n2. Enter invalid email and password\n3. Click 'Sign In'",
        "expected": "Error toast notifies invalid credentials",
        "func": "test_05_login_invalid_credentials"
    },
    {
        "id": "SEL-006",
        "name": "Login Demo Researcher Authentication",
        "module": "Login / Auth",
        "steps": "1. Navigate to /login\n2. Enter demo.researcher@biopatch.ai / password\n3. Click 'Sign In'",
        "expected": "User authenticated and redirected to /dashboard",
        "func": "test_06_login_demo_user_success"
    },
    {
        "id": "SEL-007",
        "name": "Registration Page Form Rendering",
        "module": "Registration",
        "steps": "1. Navigate to /register\n2. Inspect Name, Email, Role, Password, Confirm Password fields",
        "expected": "Registration form fields rendered correctly",
        "func": "test_07_registration_page_render"
    },
    {
        "id": "SEL-008",
        "name": "Registration Password Mismatch Validation",
        "module": "Registration",
        "steps": "1. Navigate to /register\n2. Enter non-matching passwords\n3. Submit form",
        "expected": "Error message alerts passwords do not match",
        "func": "test_08_registration_password_mismatch_validation"
    },
    {
        "id": "SEL-009",
        "name": "Registration Success & Workspace Auto-Login",
        "module": "Registration",
        "steps": "1. Navigate to /register\n2. Fill out unique user credentials\n3. Submit form",
        "expected": "User profile registered and redirected to /dashboard",
        "func": "test_09_registration_success_workflow"
    },
    {
        "id": "SEL-010",
        "name": "Forgot Password Link Dispatch",
        "module": "Forgot Password",
        "steps": "1. Navigate to /forgot-password\n2. Enter registered email address\n3. Click 'Send Reset Link'",
        "expected": "Success toast confirms reset link dispatched to email",
        "func": "test_10_forgot_password_workflow"
    },
    {
        "id": "SEL-011",
        "name": "Dashboard Metric Cards Rendering",
        "module": "Dashboard",
        "steps": "1. Log in and navigate to /dashboard\n2. Inspect summary stat cards",
        "expected": "Total Simulations, Avg Release, Score cards displayed",
        "func": "test_11_dashboard_metrics_render"
    },
    {
        "id": "SEL-012",
        "name": "Dashboard Recharts SVG Graph Rendering",
        "module": "Dashboard",
        "steps": "1. Navigate to /dashboard\n2. Inspect chart canvas container",
        "expected": "Recharts SVG chart elements rendered properly",
        "func": "test_12_dashboard_chart_rendering"
    },
    {
        "id": "SEL-013",
        "name": "Simulator Controls (Inputs, Sliders, Dropdowns)",
        "module": "Simulator",
        "steps": "1. Navigate to /simulator\n2. Inspect drug/polymer selects and parameter sliders",
        "expected": "All formulation dropdowns and sliders accessible",
        "func": "test_13_simulator_form_controls"
    },
    {
        "id": "SEL-014",
        "name": "Simulator Kinetics Engine Execution Workflow",
        "module": "Simulator",
        "steps": "1. Navigate to /simulator\n2. Click 'Run Kinetics Simulation'\n3. Observe calculation progress",
        "expected": "Simulation result curve and risk indices displayed",
        "func": "test_14_simulator_execution_workflow"
    },
    {
        "id": "SEL-015",
        "name": "AI Prediction Model Metrics",
        "module": "AI Prediction",
        "steps": "1. Navigate to /ai-prediction\n2. Inspect Random Forest R² accuracy and RMSE metrics",
        "expected": "AI prediction parameters and regression metrics rendered",
        "func": "test_15_ai_prediction_page"
    },
    {
        "id": "SEL-016",
        "name": "Release Monitor Real-time Biological Sensors",
        "module": "Release Monitor",
        "steps": "1. Navigate to /release-monitor\n2. Inspect live sensor controls and status badges",
        "expected": "Biological sensor parameters and live graph displayed",
        "func": "test_16_release_monitor_page"
    },
    {
        "id": "SEL-017",
        "name": "Drug Library Catalog & Search Filtering",
        "module": "Drug Library",
        "steps": "1. Navigate to /drugs\n2. Inspect drug cards (Metformin, Paracetamol) and search input",
        "expected": "Drug catalog cards rendered and search input functional",
        "func": "test_17_drug_library_page"
    },
    {
        "id": "SEL-018",
        "name": "Polymer Library Matrix Catalog",
        "module": "Polymer Library",
        "steps": "1. Navigate to /polymers\n2. Inspect biopolymer matrix catalog cards (PLA, Alginate, Chitosan)",
        "expected": "Polymer cards and swelling/degradation details rendered",
        "func": "test_18_polymer_library_page"
    },
    {
        "id": "SEL-019",
        "name": "Simulation History Archives",
        "module": "Simulation History",
        "steps": "1. Navigate to /history\n2. Inspect historical run archives table",
        "expected": "Simulation run history table displayed",
        "func": "test_19_simulation_history_page"
    },
    {
        "id": "SEL-020",
        "name": "Reports Archives & PDF Generation",
        "module": "Reports",
        "steps": "1. Navigate to /reports\n2. Inspect compiled pre-clinical simulation reports",
        "expected": "Reports archive cards rendered",
        "func": "test_20_reports_page_and_generation"
    },
    {
        "id": "SEL-021",
        "name": "User Profile & Account Settings Form",
        "module": "Settings",
        "steps": "1. Navigate to /settings\n2. Inspect profile information inputs and save preferences button",
        "expected": "Settings form inputs rendered",
        "func": "test_21_settings_and_profile_form"
    },
    {
        "id": "SEL-022",
        "name": "Sidebar Menu Navigation Between Pages",
        "module": "Navigation",
        "steps": "1. Click sidebar menu link 'Drug Library'\n2. Verify URL changes to /drugs",
        "expected": "Seamless route navigation between workspace views",
        "func": "test_22_sidebar_navigation"
    },
    {
        "id": "SEL-023",
        "name": "Responsive Mobile Viewport Layout",
        "module": "Responsive UI",
        "steps": "1. Resize window viewport to 375x812\n2. Navigate to /\n3. Verify element layout adjustment",
        "expected": "Layout adjusts responsively to mobile screen width",
        "func": "test_23_responsive_mobile_viewport"
    },
    {
        "id": "SEL-024",
        "name": "Unauthenticated Route Session Protection Redirect",
        "module": "Session Protection",
        "steps": "1. Clear storage tokens\n2. Direct navigate to protected route /settings",
        "expected": "Redirected automatically to /login or /",
        "func": "test_24_session_protection_redirect"
    },
    {
        "id": "SEL-025",
        "name": "Logout Workflow & Token Clearance",
        "module": "Authentication",
        "steps": "1. Log in to dashboard\n2. Click 'Sign Out'\n3. Verify storage cleared and redirect to login",
        "expected": "Session terminated and user redirected to /login",
        "func": "test_25_logout_workflow"
    }
]

class SeleniumSuiteRunner:
    def __init__(self, web_url: str, backend_url: str, headless: bool = True):
        self.web_url = web_url.rstrip('/')
        self.backend_url = backend_url.rstrip('/')
        self.headless = headless
        self.backend_process = None
        self.web_process = None
        self.results = []

    def ensure_services_running(self):
        """ Starts FastAPI backend & React Vite web app if not currently active """
        print(f"Checking backend API at {self.backend_url}/health ...")
        try:
            with httpx.Client(timeout=3.0) as client:
                res = client.get(f"{self.backend_url}/health")
                if res.status_code == 200:
                    print("[OK] Backend API is alive.")
                else:
                    self.start_backend()
        except Exception:
            self.start_backend()

        print(f"Checking React Web App at {self.web_url} ...")
        try:
            with httpx.Client(timeout=3.0) as client:
                res = client.get(self.web_url)
                if res.status_code == 200:
                    print("[OK] React Web App is alive.")
                else:
                    self.start_web_app()
        except Exception:
            self.start_web_app()

    def start_backend(self):
        backend_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "backend"))
        print(f"[STARTING] Launching FastAPI backend server in: {backend_dir}")
        env = os.environ.copy()
        env["PYTHONPATH"] = backend_dir
        self.backend_process = subprocess.Popen(
            [sys.executable, "-m", "uvicorn", "app.main:app", "--host", "127.0.0.1", "--port", "8000"],
            cwd=backend_dir,
            env=env,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE
        )
        for i in range(20):
            time.sleep(1)
            try:
                with httpx.Client(timeout=2.0) as client:
                    if client.get(f"{self.backend_url}/health").status_code == 200:
                        print("[OK] Backend server ready!")
                        return
            except Exception:
                pass
        print("[FAIL] Backend server startup timed out.")

    def start_web_app(self):
        web_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "web"))
        print(f"[STARTING] Launching React Vite Web App in: {web_dir}")
        self.web_process = subprocess.Popen(
            ["npx.cmd" if os.name == 'nt' else "npx", "vite", "--port", "5173"],
            cwd=web_dir,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE
        )
        for i in range(25):
            time.sleep(1)
            try:
                with httpx.Client(timeout=2.0) as client:
                    if client.get(self.web_url).status_code == 200:
                        print("[OK] React Web App ready!")
                        return
            except Exception:
                pass
        print("[FAIL] React Web App startup timed out.")

    def run_tests(self):
        """ Executes all 25 Selenium test cases """
        print(f"\n==================================================")
        print(f"STARTING BIOPATCH AI SELENIUM WEB TEST SUITE")
        print(f"==================================================")
        print(f"* Target Web App  : {self.web_url}")
        print(f"* Backend API     : {self.backend_url}")
        print(f"* Mode            : {'Headless Chrome' if self.headless else 'GUI Chrome'}")
        print(f"* Total Test Cases: {len(TEST_CATALOG)}")
        print(f"==================================================\n")

        driver = create_driver(headless=self.headless)
        tester = BioPatchSeleniumTests(driver, self.web_url)

        try:
            for item in TEST_CATALOG:
                test_id = item["id"]
                test_name = item["name"]
                func_name = item["func"]

                print(f"Running [{test_id}] {test_name} ...", end="", flush=True)
                start_t = time.perf_counter()
                status = "PASS"
                actual_result = ""
                error_msg = ""

                try:
                    func = getattr(tester, func_name)
                    actual_result = func()
                except Exception as e:
                    status = "FAIL"
                    error_msg = str(e)
                    actual_result = f"Failed: {e}"

                elapsed = round(time.perf_counter() - start_t, 2)
                print(f" -> {status} ({elapsed}s)")

                self.results.append({
                    "test_id": test_id,
                    "test_name": test_name,
                    "module": item["module"],
                    "steps": item["steps"],
                    "expected": item["expected"],
                    "actual": actual_result,
                    "status": status,
                    "error_message": error_msg,
                    "execution_time_sec": elapsed
                })
        finally:
            driver.quit()
            if self.backend_process:
                self.backend_process.terminate()
            if self.web_process:
                self.web_process.terminate()

        print(f"\n[OK] Selenium test suite execution completed.")

def generate_excel_report(results: list, filepath: str):
    """ Generates Excel report containing test case execution results """
    wb = openpyxl.Workbook()
    ws = wb.active
    ws.title = "Selenium Test Results"

    font_family = "Segoe UI"
    header_fill = PatternFill(start_color="1E293B", end_color="1E293B", fill_type="solid")
    header_font = Font(name=font_family, size=11, bold=True, color="FFFFFF")
    title_font = Font(name=font_family, size=16, bold=True, color="0F172A")
    subtitle_font = Font(name=font_family, size=11, italic=True, color="64748B")
    data_font = Font(name=font_family, size=10)
    pass_font = Font(name=font_family, size=10, bold=True, color="166534")
    fail_font = Font(name=font_family, size=10, bold=True, color="991B1B")

    thin_border = Border(
        left=Side(style='thin', color='E2E8F0'),
        right=Side(style='thin', color='E2E8F0'),
        top=Side(style='thin', color='E2E8F0'),
        bottom=Side(style='thin', color='E2E8F0')
    )

    ws.append(["BioPatch AI Selenium Test Suite Report"])
    ws.cell(row=1, column=1).font = title_font
    ws.append(["Executed on " + datetime.now().strftime("%Y-%m-%d %H:%M:%S")])
    ws.cell(row=2, column=1).font = subtitle_font
    ws.append([])

    headers = ["Test ID", "Test Name", "Page / Module", "Test Steps", "Expected Result", "Actual Result", "Status", "Error Message", "Execution Time (s)"]
    ws.append(headers)
    for cell in ws[4]:
        cell.fill = header_fill
        cell.font = header_font
        cell.alignment = Alignment(horizontal="center", vertical="center")

    for r in results:
        row_data = [
            r["test_id"], r["test_name"], r["module"], r["steps"],
            r["expected"], r["actual"], r["status"], r["error_message"], r["execution_time_sec"]
        ]
        ws.append(row_data)
        curr_row = ws.max_row
        for cell in ws[curr_row]:
            cell.font = data_font
            cell.border = thin_border
            if cell.column == 7: # Status column
                cell.font = pass_font if r["status"] == "PASS" else fail_font
                cell.alignment = Alignment(horizontal="center")

    for col in ws.columns:
        max_len = max(len(str(cell.value or '')) for cell in col)
        col_letter = get_column_letter(col[0].column)
        ws.column_dimensions[col_letter].width = min(max(max_len + 3, 12), 50)

    os.makedirs(os.path.dirname(filepath), exist_ok=True)
    wb.save(filepath)
    print(f"[REPORT] Generated Excel report: {filepath}")

def generate_html_report(results: list, filepath: str):
    """ Generates modern HTML report for Selenium tests """
    total = len(results)
    passed = sum(1 for r in results if r["status"] == "PASS")
    failed = total - passed
    pass_rate = round((passed / total * 100.0), 1) if total > 0 else 0.0

    rows_html = ""
    for r in results:
        badge_class = "badge-pass" if r["status"] == "PASS" else "badge-fail"
        rows_html += f"""
        <tr>
            <td><code>{r['test_id']}</code></td>
            <td><strong>{r['test_name']}</strong></td>
            <td>{r['module']}</td>
            <td style="font-size: 12px; color: #94A3B8;">{r['expected']}</td>
            <td style="font-size: 12px;">{r['actual']}</td>
            <td><span class="badge {badge_class}">{r['status']}</span></td>
            <td>{r['execution_time_sec']}s</td>
        </tr>
        """

    html_content = f"""<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>BioPatch AI - Selenium Test Automation Report</title>
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
        .grid {{
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
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
            font-size: 28px;
            font-weight: 700;
            color: var(--accent);
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
            font-size: 13px;
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
            padding: 4px 10px;
            border-radius: 12px;
            font-size: 12px;
            font-weight: 600;
        }}
        .badge-pass {{ background: rgba(34, 197, 94, 0.15); color: var(--success); border: 1px solid var(--success); }}
        .badge-fail {{ background: rgba(239, 68, 68, 0.15); color: var(--danger); border: 1px solid var(--danger); }}
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="title">
                <h1>BioPatch AI Selenium Web Automation Report</h1>
                <div class="subtitle">Execution Timestamp: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}</div>
            </div>
            <div>
                <span class="badge {'badge-pass' if failed == 0 else 'badge-fail'}">{pass_rate}% Pass Rate</span>
            </div>
        </div>

        <div class="grid">
            <div class="card">
                <div class="card-label">Total Test Cases</div>
                <div class="card-value">{total}</div>
            </div>
            <div class="card">
                <div class="card-label">Passed Tests</div>
                <div class="card-value" style="color: var(--success);">{passed}</div>
            </div>
            <div class="card">
                <div class="card-label">Failed Tests</div>
                <div class="card-value" style="color: {'var(--danger)' if failed > 0 else 'var(--text-muted)'};">{failed}</div>
            </div>
            <div class="card">
                <div class="card-label">Pass Rate</div>
                <div class="card-value">{pass_rate}%</div>
            </div>
        </div>

        <h2>Test Case Execution Details</h2>
        <table>
            <thead>
                <tr>
                    <th>ID</th>
                    <th>Test Name</th>
                    <th>Module</th>
                    <th>Expected Result</th>
                    <th>Actual Result</th>
                    <th>Status</th>
                    <th>Duration</th>
                </tr>
            </thead>
            <tbody>
                {rows_html}
            </tbody>
        </table>
    </div>
</body>
</html>
"""
    os.makedirs(os.path.dirname(filepath), exist_ok=True)
    with open(filepath, "w", encoding="utf-8") as f:
        f.write(html_content)
    print(f"[REPORT] Generated HTML report: {filepath}")

def generate_json_summary(results: list, filepath: str):
    """ Generates JSON summary of Selenium test suite """
    total = len(results)
    passed = sum(1 for r in results if r["status"] == "PASS")
    failed = total - passed
    data = {
        "summary": {
            "timestamp": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
            "total_tests": total,
            "passed_tests": passed,
            "failed_tests": failed,
            "pass_rate_pct": round((passed / total * 100.0), 1) if total > 0 else 0.0
        },
        "test_results": results
    }
    os.makedirs(os.path.dirname(filepath), exist_ok=True)
    with open(filepath, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2)
    print(f"[REPORT] Generated JSON summary: {filepath}")

def main():
    parser = argparse.ArgumentParser(description="BioPatch AI Selenium Test Suite Runner")
    parser.add_argument("--web-url", default=DEFAULT_WEB_URL, help="Target Web App URL")
    parser.add_argument("--backend-url", default=DEFAULT_BACKEND_URL, help="Target Backend API URL")
    parser.add_argument("--gui", action="store_true", help="Run Chrome in GUI mode (default: headless)")
    parser.add_argument("--out-dir", default=None, help="Output report directory")

    args = parser.parse_args()

    if args.out_dir is None:
        repo_root = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
        reports_dir = os.path.join(repo_root, "tests", "performance", "reports")
    else:
        reports_dir = args.out_dir

    runner = SeleniumSuiteRunner(
        web_url=args.web_url,
        backend_url=args.backend_url,
        headless=not args.gui
    )

    runner.ensure_services_running()
    runner.run_tests()

    excel_path = os.path.join(reports_dir, "BioPatch_Selenium_Test_Report.xlsx")
    html_path = os.path.join(reports_dir, "BioPatch_Selenium_Test_Report.html")
    json_path = os.path.join(reports_dir, "BioPatch_Selenium_Test_Summary.json")

    generate_excel_report(runner.results, excel_path)
    generate_html_report(runner.results, html_path)
    generate_json_summary(runner.results, json_path)

    total = len(runner.results)
    passed = sum(1 for r in runner.results if r["status"] == "PASS")
    failed = total - passed

    print("\n==================================================")
    print("BIOPATCH AI SELENIUM TEST SUITE RESULTS")
    print("==================================================")
    print(f"Total Test Cases : {total}")
    print(f"Passed Tests     : {passed}")
    print(f"Failed Tests     : {failed}")
    print(f"Pass Rate        : {round((passed / total * 100.0), 1) if total > 0 else 0}%")
    print("==================================================\n")

if __name__ == "__main__":
    main()
