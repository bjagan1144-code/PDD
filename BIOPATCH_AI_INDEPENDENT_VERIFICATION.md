# BioPatch AI — Independent Final Web Verification Report (Read-Only)

**Execution Date:** November 2, 2026  
**Auditor:** Independent QA / Full-Stack & ML Verification Engineer  
**Target Repository:** `C:\Users\bsowm\OneDrive\Documents\PDD\project-11`  
**Execution Context:** Clean read-only inspection, live test reruns, and empirical evidence gathering.  
**Mode:** READ-ONLY (No source code, databases, models, or previous reports modified).

---

## Executive Summary & Independent Verdict

An independent, rigorous verification of the **BioPatch AI Web Application and Backend** was conducted. All tests were executed fresh from the environment; no prior test results were assumed.

### Overall Verification Summary:
- **Backend Automated Test Suite:** **29 / 29 PASSED (100%)**
- **Major API Endpoints Verified:** **17 / 17 PASSED (100%)**
- **Scientific Simulation Parity (Python vs JS):** **100% IDENTICAL (PASS)**
- **Mass Balance & Monotonicity Constraints:** **PASS**
- **Zero Drug Loading Boundary Law:** **PASS**
- **Machine Learning Integrity & Honesty:** **PASS (Real metrics: $R^2 = 0.7638$, $\text{MAE} = 6.59\%$, In-Silico disclosure verified)**
- **Database Storage Transparency:** **PASS (MockFirestore correctly reported; live Firebase not fabricated)**
- **Web Production Build (`npm run build`):** **PASS (0 errors, 1.97s)**

### Readiness Verdicts (Categorized):
1. **Local Demonstration Readiness:** **READY**  
   The application is fully functional, deterministic, stable, aesthetically polished, and ready for an interactive final-year project academic or technical demonstration.
2. **Production Deployment Readiness:** **NOT READY**  
   Cannot be certified for production deployment until:
   - Production Google Cloud service account keys are provisioned in `.env` to replace `MockFirestore`.
   - Production web hosting (e.g. Vercel, Netlify) and backend containerization (Docker / Cloud Run) are configured.
   - Production CORS domains, rate limiting, and SSL/TLS certificates are enforced.

---

## 1. Backend Verification

### 1.1 Complete Pytest Automated Suite
- **Exact Command:** `python -m pytest backend/test_auth_and_simulation.py -v --tb=short`
- **Execution Output:**
  ```text
  ============================= test session starts =============================
  platform win32 -- Python 3.13.7, pytest-9.1.1, pluggy-1.6.0
  rootdir: C:\Users\bsowm\OneDrive\Documents\PDD\project-11
  plugins: anyio-4.14.2, locust-2.46.7, html-4.2.0, metadata-3.1.1
  collected 29 items

  backend/test_auth_and_simulation.py::test_login_wrong_password_rejected PASSED [  3%]
  backend/test_auth_and_simulation.py::test_login_unknown_user_rejected PASSED [  6%]
  backend/test_auth_and_simulation.py::test_login_seeded_researcher_succeeds PASSED [ 10%]
  backend/test_auth_and_simulation.py::test_login_demo_researcher_succeeds PASSED [ 13%]
  backend/test_auth_and_simulation.py::test_user_registration_and_auth_me PASSED [ 17%]
  backend/test_auth_and_simulation.py::test_unauthenticated_request_rejected PASSED [ 20%]
  backend/test_auth_and_simulation.py::test_simulation_15_scenarios_and_invariants[1. Standard Baseline-params0] PASSED [ 24%]
  backend/test_auth_and_simulation.py::test_simulation_15_scenarios_and_invariants[2. High Solubility-params1] PASSED [ 27%]
  backend/test_auth_and_simulation.py::test_simulation_15_scenarios_and_invariants[3. Hydrophobic PLA-params2] PASSED [ 31%]
  backend/test_auth_and_simulation.py::test_simulation_15_scenarios_and_invariants[4. Burst Gelatin-params3] PASSED [ 34%]
  backend/test_auth_and_simulation.py::test_simulation_15_scenarios_and_invariants[5. Acidic Media-params4] PASSED [ 37%]
  backend/test_auth_and_simulation.py::test_simulation_15_scenarios_and_invariants[6. Alkaline Media-params5] PASSED [ 41%]
  backend/test_auth_and_simulation.py::test_simulation_15_scenarios_and_invariants[7. Cold Temp-params6] PASSED [ 44%]
  backend/test_auth_and_simulation.py::test_simulation_15_scenarios_and_invariants[8. High Temp-params7] PASSED [ 48%]
  backend/test_auth_and_simulation.py::test_simulation_15_scenarios_and_invariants[9. Low Moisture-params8] PASSED [ 51%]
  backend/test_auth_and_simulation.py::test_simulation_15_scenarios_and_invariants[10. High Moisture-params9] PASSED [ 55%]
  backend/test_auth_and_simulation.py::test_simulation_15_scenarios_and_invariants[11. Thin Patch-params10] PASSED [ 58%]
  backend/test_auth_and_simulation.py::test_simulation_15_scenarios_and_invariants[12. Thick Matrix-params11] PASSED [ 62%]
  backend/test_auth_and_simulation.py::test_simulation_15_scenarios_and_invariants[13. High Loading-params12] PASSED [ 65%]
  backend/test_auth_and_simulation.py::test_simulation_15_scenarios_and_invariants[14. Short Duration-params13] PASSED [ 68%]
  backend/test_auth_and_simulation.py::test_simulation_15_scenarios_and_invariants[15. Zero Drug Loading-params14] PASSED [ 72%]
  backend/test_auth_and_simulation.py::test_zero_drug_loading_behavior PASSED [ 75%]
  backend/test_auth_and_simulation.py::test_simulation_determinism PASSED  [ 79%]
  backend/test_auth_and_simulation.py::test_simulation_invalid_boundary_inputs PASSED [ 82%]
  backend/test_auth_and_simulation.py::test_drugs_library_and_crud PASSED  [ 86%]
  backend/test_auth_and_simulation.py::test_polymers_library_and_crud PASSED [ 89%]
  backend/test_auth_and_simulation.py::test_full_simulation_flow_and_history PASSED [ 93%]
  backend/test_auth_and_simulation.py::test_ml_predictions_endpoints PASSED [ 96%]
  backend/test_auth_and_simulation.py::test_health_check PASSED            [100%]

  ======================= 29 passed, 1 warning in 14.58s ========================
  ```
- **Passed:** 29
- **Failed:** 0
- **Skipped:** 0
- **Warning:** 1 (StarletteDeprecationWarning on httpx vs httpx2 in FastAPI TestClient)
- **Status:** **PASS**

---

### 1.2 Direct API Endpoint Verification
Every major route registered in `FastAPI` was queried directly using an isolated test client:

| Endpoint | HTTP Method | Expected Status | Actual Status | Response Evidence | Status |
| :--- | :---: | :---: | :---: | :--- | :---: |
| `/health` | `GET` | 200 | 200 | `status: "ok", storage_mode: "mock_firestore", model: "loaded"` | **PASS** |
| `/api/auth/login` | `POST` | 200 | 200 | Returns JWT Bearer `access_token` for seeded researcher | **PASS** |
| `/api/auth/me` | `GET` | 200 | 200 | `email: "researcher@biopatch.ai", role: "Principal Investigator"` | **PASS** |
| `/api/dashboard` | `GET` | 200 | 200 | Total sims count, `databaseStatus: "mock_firestore"`, `recentSimulations` with curves | **PASS** |
| `/api/simulations/run` | `POST` | 200 | 200 | Predicted release: 24.6%, releasedMg: 12.3, remainingMg: 37.7 | **PASS** |
| `/api/simulations` | `GET` | 200 | 200 | Returns complete simulation history array | **PASS** |
| `/api/simulations/{id}` | `GET` | 200 | 200 | Returns matching simulation record | **PASS** |
| `/api/simulations/{id}/rerun`| `POST`| 200 | 200 | Clones and executes previous formulation | **PASS** |
| `/api/simulate` | `POST` | 200 | 200 | Direct alias route functioning identical to `/simulations/run` | **PASS** |
| `/api/predictions/predict` | `POST` | 200 | 200 | Returns ML prediction: 42.8% and real metadata | **PASS** |
| `/api/predictions/metrics` | `GET` | 200 | 200 | `r2: 0.7638, mae: "6.59%", rmse: "11.51%", samples: 1200` | **PASS** |
| `/api/drugs` | `GET` | 200 | 200 | Catalog with `molecularWeight` and `category` | **PASS** |
| `/api/polymers` | `GET` | 200 | 200 | Catalog with `swellingRatio` and `degradationRate` | **PASS** |
| `/api/reports` | `GET` | 200 | 200 | Lists generated research reports | **PASS** |
| `/api/reports` | `POST` | 200 | 200 | Generates report ID `REP-XXXXXX` from simulation | **PASS** |
| `/api/reports/{id}` | `DELETE` | 200 | 200 | Safely archives/deletes report from store | **PASS** |
| `/api/auth/logout` | `POST` | 200 | 200 | Safely terminates active session | **PASS** |

---

## 2. Scientific Simulation Verification

### 2.1 Determinism Verification
- **Procedure:** Executed 3 consecutive simulation runs with identical parameters:
  - Drug: Fentanyl (50.0 mg)
  - Polymer: Chitosan (5.0%)
  - Thickness: 0.5 mm
  - Temperature: 37.0°C, pH: 7.4, Moisture: 60.0%, Duration: 24h
- **Result:**
  - Run 1: 24.6% release | 12.3 mg released | 37.7 mg remaining
  - Run 2: 24.6% release | 12.3 mg released | 37.7 mg remaining
  - Run 3: 24.6% release | 12.3 mg released | 37.7 mg remaining
  - Curve Array Comparison: `run1["releaseCurve"] == run2["releaseCurve"] == run3["releaseCurve"]` is **True**.
- **Status:** **PASS**

---

### 2.2 Zero Drug Loading Boundary Law
- **Procedure:** Input `drugLoading: 0.0`.
- **Result:**
  - `predictedRelease`: `0.0%`
  - `releasedAmountMg`: `0.0 mg`
  - `remainingDrugMg`: `0.0 mg`
  - Curve points: All 13 points equal `0.0%` and `0.0 mg`.
- **Status:** **PASS**

---

### 2.3 Boundary & Invalid Inputs Rejection
- **Procedure:** Tested 9 invalid parameter inputs:
  1. Negative drug loading (-5.0 mg): **REJECTED (ValueError)**
  2. NaN temperature: **REJECTED (ValueError)**
  3. Infinite duration (`float('inf')`): **REJECTED (ValueError)**
  4. Temperature below minimum (5.0°C < 10°C): **REJECTED (ValueError)**
  5. Temperature above maximum (70.0°C > 60°C): **REJECTED (ValueError)**
  6. pH below physiological bound (-1.0 < 0): **REJECTED (ValueError)**
  7. pH above maximum bound (15.0 > 14): **REJECTED (ValueError)**
  8. Relative moisture above 100% (110%): **REJECTED (ValueError)**
  9. Zero patch thickness (0.0 mm): **REJECTED (ValueError)**
- **Status:** **PASS**

---

### 2.4 Monotonicity & Mass Conservation
- **Mass Balance Formula:** $M_{\text{released}} + M_{\text{remaining}} = M_{\text{initial}}$
- **Evaluation:** $12.30\text{ mg} + 37.70\text{ mg} = 50.00\text{ mg}$ (exact match).
- **Monotonicity:** $R(t_{i}) \ge R(t_{i-1})$ verified across all curve steps.
- **Status:** **PASS**

---

### 2.5 Web (JavaScript) vs Backend (Python) Engine Parity
- **Procedure:** Executed the exact same test cases in Node (`web/src/utils/simulation.js`) and Python (`backend/app/simulation/engine.py`).

| Test Case | Node JS Engine Output | Python Backend Output | Parity |
| :--- | :--- | :--- | :---: |
| **Standard Baseline** | `24.6%` (12.3 mg rel, 37.7 mg rem) | `24.6%` (12.3 mg rel, 37.7 mg rem) | **100% MATCH** |
| **Zero Drug Loading** | `0.0%` (0.0 mg rel, 0.0 mg rem) | `0.0%` (0.0 mg rel, 0.0 mg rem) | **100% MATCH** |
| **High Solubility** | `16.9%` (3.38 mg rel, 16.62 mg rem) | `16.9%` (3.38 mg rel, 16.62 mg rem) | **100% MATCH** |

- **Status:** **PASS**

---

## 3. Machine Learning Pipeline Verification

### 3.1 Dataset Inspection
- **File:** `backend/app/ml/synthetic_dataset.csv`
- **Rows:** 1,200 formulation runs
- **Columns:** 10 (`drugName`, `polymerName`, `drugLoading`, `polymerConcentration`, `patchThickness`, `temperature`, `pH`, `moisture`, `duration`, `release`)
- **Missing / NaN Values:** 0
- **Drugs Included:** Metformin, Paracetamol, Losartan, Ibuprofen
- **Polymers Included:** PLA, Alginate, Gelatin, Pectin, Cellulose, Chitosan
- **Synthetic Transparency:** The file and metadata explicitly state:
  > *"No clinical wet-lab transdermal release dataset is present in local repository; trained on reproducible mathematical Weibull/Korsmeyer-Peppas formulations with 80/20 train/test split."*
- **Status:** **PASS**

---

### 3.2 Model & Metadata Verification
- **Model File:** `backend/app/ml/model.joblib` (RandomForestRegressor, $n=100$, max_depth=14)
- **Metadata File:** `backend/app/ml/model_metadata.json`
- **Empirical Metrics:**
  - $R^2$: **0.7638**
  - $\text{MAE}$: **6.59%**
  - $\text{RMSE}$: **11.51%**
  - $\text{MSE}$: **132.40**
  - Samples: **1,200** (960 train / 240 test)
- **Feature Importances Ranking:**
  1. `patchThickness`: 33.05%
  2. `temperature`: 14.66%
  3. `drug_Metformin`: 12.45%
  4. `polymer_PLA`: 8.89%
  5. `polymer_Gelatin`: 6.39%
  6. `moisture`: 5.74%
  7. `polymerConcentration`: 5.20%
- **Inference Verification:**
  - Test input prediction: **42.8%**
  - Zero loading input prediction: **0.0%**
- **Status:** **PASS**

---

## 4. Firebase & Storage Verification

### 4.1 Credentials Check
- **File Checked:** `backend/.env`
  - `FIREBASE_PROJECT_ID`: `biopatch-ai-fire`
  - `FIREBASE_WEB_API_KEY`: Configured
  - `FIREBASE_PRIVATE_KEY`: **NOT CONFIGURED**
  - `FIREBASE_CLIENT_EMAIL`: **NOT CONFIGURED**
- **Runtime Mode:** `MockFirestoreClient`
- **Status Reporting:**
  - `/health` returns `storage_mode: "mock_firestore"` and `is_mock_storage: true`.
  - `/api/dashboard` returns `databaseStatus: "mock_firestore"`.
  - **Verdict:** Storage fallback is properly handled and completely transparent. No deceptive claims of active live Firestore are made.

---

### 4.2 Local Persistence Across Client Instances
- **Procedure:** Tested writing a document with one `MockFirestoreClient` instance, destroying the instance, and instantiating a completely new client reading from disk:
  ```text
  Persistence Check across separate instances:
  Read after write: True -> {'val': 'persisted_ok', 'num': 42}
  Read after delete: False
  ```
- **Storage File:** `backend/mock_firestore.json` (Size: 1,162,015 bytes / 1.16 MB).
- **Status:** **PASS**

---

## 5. Web Application Frontend Verification

### 5.1 Production Vite Build
- **Command:** `cd web; npm run build`
- **Output:**
  ```text
  vite v8.2.2 building client environment for production...
  transforming...
  ✓ 2494 modules transformed.
  rendering chunks...
  dist/index.html                     0.93 kB │ gzip:   0.51 kB
  dist/assets/index-B7Jw0HkH.css     59.80 kB │ gzip:  10.10 kB
  dist/assets/index-CI1HI3nJ.js   1,313.45 kB │ gzip: 381.08 kB
  ✓ built in 1.97s
  ```
- **Result:** 0 build errors.
- **Status:** **PASS**

---

### 5.2 Frontend Pages & UI Verification

| Page | Verification Procedure | Evidence & Findings | Verdict |
| :--- | :--- | :--- | :---: |
| **Landing (`/`)** | Verified hero section, CTA buttons, feature cards, navigation bar. | Clean layout; buttons link to `/login` and `/explore`. Responsive mobile drawer toggle present. | **PASS** |
| **Explore (`/explore`)** | Verified public kinetics explorer without requiring login. | Renders interactive formulation preview. | **PASS** |
| **Login (`/login`)** | Tested email/password input, Google Sign-in button, form validation. | Intercepts empty submissions; authenticates against `POST /api/auth/login`. | **PASS** |
| **Register (`/register`)** | Tested registration form, password confirmation, role selector. | Sends registration payload; stores token upon creation. | **PASS** |
| **Dashboard (`/dashboard`)** | Verified KPI widgets, recent simulations table, AreaChart rendering. | Chart receives valid `releaseCurve` arrays; empty states handled with default zeros; dates split cleanly without errors. | **PASS** |
| **Simulator (`/simulator`)** | Tested formulation sliders (`drugLoading` 0-100mg, etc.), run button, chart. | Noise-free deterministic curve; zero loading slider produces 0.0% curve; mass balance displays matching mg values. | **PASS** |
| **AI Prediction (`/predictions`)** | Tested ML prediction form, dynamic feature importance, validation table. | Receives actual model predictions; displays real $R^2=0.7638$; shows in-silico dataset disclosure. | **PASS** |
| **Drug Library (`/drugs`)** | Verified drug catalog cards, search bar, Add Drug modal. | Shows `molecularWeight`, `halfLife`, `category`; no `"N/A"` labels; additions persist to storage. | **PASS** |
| **Polymer Library (`/polymers`)** | Verified polymer cards, swelling ratio, degradation rate. | Displays correct units; additions persist to storage. | **PASS** |
| **Release Monitor (`/monitor`)** | Tested simulation playback animation, timeline scrubber. | Smooth curve progression; mass balance counters stay in sync. | **PASS** |
| **Simulation History (`/history`)**| Tested history table, sorting, Re-run button, CSV export. | Table parses dates safely; Re-run navigates to `/simulator` with formulation parameters intact. | **PASS** |
| **Reports (`/reports`)** | Tested report cards, Report Preview modal, PDF export trigger. | Modal handles cached and live simulations without throwing unhandled exceptions. | **PASS** |
| **Profile (`/profile`) & Logout** | Tested profile details display and logout action. | Displays user role and active storage mode; logout revokes token and clears session. | **PASS** |

---

## 6. Final Honest Verdict

### Local Demonstration Readiness: **READY (PASS)**
- The Web application starts reliably, connects to the local backend, executes all mathematical biophysical models without noise, and renders all charts, forms, and catalogs accurately.
- Machine learning metrics and model behaviors are genuine, reproducible, and transparently documented.
- Passwords are securely hashed with `bcrypt`.
- The application is **100% suitable and recommended for academic, peer, or evaluative project demonstration**.

### Production Deployment Readiness: **NOT READY**
- Live Firebase credentials are not provisioned in `.env` (system uses local `mock_firestore.json`).
- Cloud deployment infrastructure (e.g. Docker, Kubernetes, HTTPS certificates, cloud database instances) is not yet configured.
- Full end-to-end integration with clinical wet-lab Franz cell data remains a stated future enhancement.

