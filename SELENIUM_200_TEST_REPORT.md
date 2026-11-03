# BioPatch AI — Category 1: Selenium Web Automation (200 Test Cases Report)

**Date of Execution:** November 4, 2026 — 00:07 IST  
**Target Environment:** `http://localhost:5173` (React Vite Web App)  
**Backend Host:** `http://127.0.0.1:8000` (FastAPI with In-Memory Caching)  
**Browser Engine:** Google Chrome 122.0 Headless WebDriver  
**Master Catalog Path:** [`tests/test_cases/selenium_200.json`](file:///c:/Users/bsowm/OneDrive/Documents/PDD/project-11/tests/test_cases/selenium_200.json)  

---

## 1. Summary of Execution Results

| Module / Scope | Total Cases | Passed | Failed | Blocked | Not Executed | Coverage Focus |
|:---|:---:|:---:|:---:|:---:|:---:|:---|
| **1. Application Launch & Loading** | 15 | 2 | 0 | 0 | 13 | Branding, DOM readiness, title, favicon, hero section |
| **2. Registration** | 15 | 3 | 0 | 0 | 12 | Form render, password mismatch, successful account creation |
| **3. Login and Authentication** | 20 | 4 | 0 | 0 | 16 | Elements render, empty validation, bad credentials, demo login |
| **4. Dashboard** | 15 | 2 | 0 | 0 | 13 | KPI summary cards, Recharts SVG chart rendering |
| **5. Drug Library** | 15 | 1 | 0 | 0 | 14 | Catalog rendering, live text search filtering |
| **6. Polymer Library** | 15 | 1 | 0 | 0 | 14 | Matrix cards, swelling ratio, erosion characteristics |
| **7. Simulator Input Validation** | 20 | 1 | 0 | 0 | 19 | Interactive sliders, inputs, dropdown selection |
| **8. Drug Release Simulation** | 20 | 1 | 0 | 0 | 19 | Physical kinetics calculation workflow & curve generation |
| **9. AI Prediction** | 15 | 1 | 0 | 0 | 14 | Random Forest model inference, predicted % and peak rates |
| **10. Simulation History** | 10 | 1 | 0 | 0 | 9 | Completed run archives, parameter display, timestamps |
| **11. Reports** | 10 | 1 | 0 | 0 | 9 | Pre-clinical reports archive, PDF export action |
| **12. Profile and Settings** | 10 | 1 | 0 | 0 | 9 | Researcher profile updating, institutional metadata |
| **13. Responsive Design** | 10 | 2 | 0 | 0 | 8 | 375x812 mobile viewport, drawer navigation |
| **14. Security & Error Handling** | 10 | 4 | 0 | 0 | 6 | Route protection, 404 navigation, logout token clearance |
| **TOTAL** | **200** | **25** | **0** | **0** | **175** | **100.0% Pass Rate on Executed Core Workflows** |

---

## 2. Genuinely Executed 25 Core Workflows (100% PASS)

*Generated Evidence: [BioPatch_Selenium_Test_Report.html](file:///c:/Users/bsowm/OneDrive/Documents/PDD/project-11/tests/performance/reports/BioPatch_Selenium_Test_Report.html) & [BioPatch_Selenium_Test_Report.xlsx](file:///c:/Users/bsowm/OneDrive/Documents/PDD/project-11/tests/performance/reports/BioPatch_Selenium_Test_Report.xlsx)*

| Test ID | Test Name | Module | Duration | Status | Verified Behavior |
|:---|:---|:---|:---:|:---:|:---|
| **SEL-001** | Home Page Loading & Branding | Launch & Loading | 4.03s | **PASS** | Title `BioPatch AI` and hero header render cleanly |
| **SEL-002** | Home Page Navigation to Login | Launch & Loading | 3.19s | **PASS** | Sign-in button clicks route smoothly to `/login` |
| **SEL-003** | Login Page Form Elements Render | Login & Auth | 1.32s | **PASS** | Email, password inputs and submit button active |
| **SEL-004** | Login Form Validation (Empty Fields) | Login & Auth | 2.67s | **PASS** | Blank form submission blocked by validation rules |
| **SEL-005** | Login Invalid Credentials Error Toast | Login & Auth | 4.62s | **PASS** | Incorrect password triggers notification error alert |
| **SEL-006** | Login Demo Researcher Authentication | Login & Auth | 5.78s | **PASS** | Valid credentials authenticated, routed to `/dashboard` |
| **SEL-007** | Registration Page Form Rendering | Registration | 1.32s | **PASS** | Name, email, role, password fields rendered in DOM |
| **SEL-008** | Registration Password Mismatch | Registration | 4.61s | **PASS** | Mismatched password triggers validation alert |
| **SEL-009** | Registration Success & Auto-Login | Registration | 3.66s | **PASS** | Unique account registered and routed to `/dashboard` |
| **SEL-010** | Forgot Password Link Dispatch | Security & Auth | 3.71s | **PASS** | Reset notification alert triggered cleanly |
| **SEL-011** | Dashboard Metric Cards Rendering | Dashboard | 4.66s | **PASS** | Total simulations and active patch KPI cards populated |
| **SEL-012** | Dashboard Recharts SVG Graph | Dashboard | 0.11s | **PASS** | Kinetic dissolution curve SVG canvas located in DOM |
| **SEL-013** | Simulator Controls (Inputs/Sliders) | Simulator Inputs | 1.78s | **PASS** | Drug/Polymer dropdowns and numeric sliders interactive |
| **SEL-014** | Simulator Kinetics Calculation Workflow| Kinetics Engine | 3.66s | **PASS** | Physical simulation calculated and results displayed |
| **SEL-015** | AI Prediction Model Metrics | AI Prediction | 1.78s | **PASS** | Random Forest model predicted release % displayed |
| **SEL-016** | Release Monitor Real-time Sensors | Release Monitor | 1.70s | **PASS** | Sensor indicators and telemetry timeline updated |
| **SEL-017** | Drug Library Catalog & Search Filtering | Drug Library | 1.75s | **PASS** | Drug catalog loaded; search filters catalog in real time |
| **SEL-018** | Polymer Library Matrix Catalog | Polymer Library | 1.71s | **PASS** | Biopolymer cards display swelling and degradation data |
| **SEL-019** | Simulation History Archives | History Archives| 1.70s | **PASS** | Previous simulation runs rendered in history table |
| **SEL-020** | Reports Archives & PDF Generation | Reports | 1.85s | **PASS** | Pre-clinical PDF export trigger verified active |
| **SEL-021** | User Profile & Account Settings Form | Profile & Settings| 1.80s | **PASS** | Profile form inputs updated and validated |
| **SEL-022** | Sidebar Menu Navigation Between Pages | Navigation | 3.20s | **PASS** | Routes transitioned cleanly across all sidebar links |
| **SEL-023** | Responsive Mobile Viewport Layout | Responsive Design| 1.93s | **PASS** | 375x812 viewport verified with drawer navigation |
| **SEL-024** | Unauthenticated Route Protection | Security | 2.33s | **PASS** | Direct access to `/dashboard` redirects to `/login` |
| **SEL-025** | Logout Workflow & Token Clearance | Security | 6.30s | **PASS** | Session cleared from localStorage, redirected to login |

---

## 3. Defects Identified and Corrected

- **Defect SEL-006 Race Condition:** Fixed sleep timer in `SEL-006` caused intermittent false failures during network latency. Replaced with explicit `WebDriverWait` for `/dashboard` route transition, resulting in reliable 100% pass rate.
- **Defect Catalog Throttling:** Added in-memory TTL caching in backend `/api/drugs` and `/api/polymers` so library tests do not exhaust Google Cloud Spark plan daily quotas.

