# BioPatch AI — Comprehensive Initial Audit Report

**Date of Inspection:** November 2, 2026  
**Auditor:** Automated Diagnostic & Inspection Suite  
**Project Root:** `C:\Users\bsowm\OneDrive\Documents\PDD\project-11`  
**Execution Environment:** Windows (x64), Python 3.13.7, Flutter 3.41.7 / Dart 3.11.5, Node v24.19.0, npm 11.17.0

---

## 1. Executive Summary

This local audit of **BioPatch AI** was conducted across the source code trees: `web/src`, `mobile/lib`, `backend/app`, `tests`, ML model artifacts, database configurations, and scientific simulation kinetics engines.

### Overall Initial Status
- **Backend API & Testing:** Functional core exists in FastAPI; baseline test suite `test_auth_and_simulation.py` passed (5/5 tests), but revealed 12 deprecation and feature-mismatch warnings.
- **Scientific Simulation:** Deterministic Weibull/Korsmeyer-Peppas kinetics are mathematically sound, but zero drug loading causes an immediate input rejection error rather than calculating 0% release. In addition, client-side UI graphs in both Web and Mobile inject synthetic pseudo-random noise ($\pm 1.25\%$) that introduces non-monotonicity and violates determinism.
- **Machine Learning:** **CRITICAL FINDING.** There is **no persistent real-world training dataset** (no CSV or parquet data files). The model artifact `model.joblib` was trained on only 200 dynamically generated synthetic records. Hardcoded metrics in `predictor.py` and UI pages claim $R^2 = 0.948$, $\text{MAE} = 1.84\%$, and $N = 4,500$. **Actual measured performance on 200 synthetic samples yielded $R^2 = 0.5093$, $\text{MAE} = 9.42\%$, and $\text{RMSE} = 13.27\%$**.
- **Database / Firebase:** Real Cloud Firestore credentials are **not configured** in `backend/.env` (service account private key and client email are missing). Backend runs exclusively in `MockFirestoreClient` reading/writing to `backend/mock_firestore.json`. Furthermore, `database.py` contains a path bug searching for `.env` at root instead of `backend/.env`.
- **Web & Mobile Parity:** Several API contract mismatches exist between backend response schemas and frontend/mobile UI consumers (missing dates in simulation history, missing curve data in dashboard summary, naming mismatches like `molecular_weight` vs `molecularWeight`, and missing catalog fields).
- **Mobile Static Analysis:** `flutter analyze` reported 105 issues (chiefly deprecated `withOpacity` and missing const/super parameters). `flutter test` passed (5/5 tests).
- **Web Build:** `npm run build` completed successfully with Vite production bundling.

---

## 2. Identified Problems by Component and Source Location

### A. Scientific Simulation Engine (`backend/app/simulation/engine.py`, `web/src/utils/simulation.js`, `mobile/lib/`)

| # | Issue Description | Severity | File Location | Line(s) |
|---|-------------------|----------|---------------|---------|
| 1 | **Zero Loading Handling:** Input validation strictly rejects `drugLoading = 0` (`is_valid_num(raw_drug_loading, 0.001)` and Pydantic `gt=0`) throwing `ValueError` instead of gracefully returning 0.0% release and 0.0 mg remaining drug. | High | `backend/app/simulation/engine.py`<br>`backend/app/schemas/api_schemas.py`<br>`web/src/utils/simulation.js` | `engine.py:33`<br>`api_schemas.py:61`<br>`simulation.js:28` |
| 2 | **Non-Deterministic Graph Noise Injection:** Web UI injects random noise `(Math.random() - 0.5) * 2.5` into curve points labeled "Simulated Test", causing release curves to decrease between time steps and producing non-deterministic results across identical runs. | High | `web/src/pages/SimulatorPage.jsx`<br>`mobile/lib/models/simulation_models.dart` | `SimulatorPage.jsx:167-179`<br>`simulation_models.dart:25-33` |
| 3 | **Equation Parameter Coupling:** When `drugLoading` is positive, `loading_factor = 1.0 + (drug_loading / 150.0)` never scales to 0 when loading approaches 0, meaning percentage release formula doesn't scale to zero loading naturally without an explicit check. | Medium | `backend/app/simulation/engine.py`<br>`web/src/utils/simulation.js` | `engine.py:102`<br>`simulation.js:127` |

---

### B. Machine Learning Pipeline & Data Integrity (`backend/app/ml/`, `web/src/pages/AIPredictionPage.jsx`, `mobile/lib/screens/ai_prediction_screen.dart`)

| # | Issue Description | Severity | File Location | Line(s) |
|---|-------------------|----------|---------------|---------|
| 4 | **Fabricated Model Accuracy Metrics:** `MODEL_METRICS` dictionary hardcodes $R^2 = 0.948$, $\text{MAE} = 1.84\%$, $\text{RMSE} = 2.45\%$, and 4,500 samples. Actual model evaluation against synthetic data reveals $R^2 = 0.5093$, $\text{MAE} = 9.42\%$, and $\text{RMSE} = 13.27\%$. | Critical | `backend/app/ml/predictor.py`<br>`web/src/pages/AIPredictionPage.jsx`<br>`mobile/lib/screens/ai_prediction_screen.dart` | `predictor.py:12-20`<br>`AIPredictionPage.jsx:41-48`<br>`ai_prediction_screen.dart:31-40` |
| 5 | **Missing Real Dataset:** There are no `.csv`, `.parquet`, or database tables storing experimental patch release datasets. Training uses on-the-fly generated random numbers (`generate_synthetic_data(num_samples=150)`). | Critical | `backend/app/ml/predictor.py` | `predictor.py:22-60` |
| 6 | **Feature Mismatch & Omitted Variable Bias:** `simulate_release()` changes diffusion rates up to 10-fold based on `drugName` and `polymerName` (e.g. PLA modifier 0.15 vs Gelatin 1.5), but `generate_synthetic_data()` omits drug and polymer identification from feature matrix $X$. The Random Forest is trained only on 7 numeric features, creating latent variable distortion. | Critical | `backend/app/ml/predictor.py` | `predictor.py:47-56, 72` |
| 7 | **Hardcoded Visualizations:** Both Web and Mobile AI prediction screens render hardcoded arrays for Feature Importance and Performance Curves (`_validationSamples` with 8 static points) rather than computing real feature importance or validation predictions from the model. | High | `web/src/pages/AIPredictionPage.jsx`<br>`mobile/lib/screens/ai_prediction_screen.dart` | `AIPredictionPage.jsx:20-38`<br>`ai_prediction_screen.dart:22-40` |
| 8 | **Feature Names Missing Warning:** `RandomForestRegressor` was fitted with feature names from a Pandas DataFrame, but inference in `predictor.py` passes an anonymous NumPy array, generating `UserWarning: X does not have valid feature names`. | Low | `backend/app/ml/predictor.py` | `predictor.py:100-109` |

---

### C. Backend API, Schemas, & Security (`backend/app/`)

| # | Issue Description | Severity | File Location | Line(s) |
|---|-------------------|----------|---------------|---------|
| 9 | **Missing `uuid` Import in Drug & Polymer Routers:** `add_drug` and `add_polymer` invoke `uuid.uuid4()` as fallback ID generation, but `uuid` is never imported in those modules. Calling these endpoints without an ID or name raises a runtime `NameError`. | High | `backend/app/routers/drugs.py`<br>`backend/app/routers/polymers.py` | `drugs.py:41`<br>`polymers.py:40` |
| 10 | **Plaintext Password Storage in Mock Database:** `auth.py:register` stores passwords in plaintext in mock Firestore (`"password": user_data.password`), completely bypassing the bcrypt hashing utility `hash_password()` defined in `auth_service.py`. | High | `backend/app/routers/auth.py` | `auth.py:106, 150` |
| 11 | **Startup User Seeding Partial Overwrite:** `seed_database_libraries()` only creates demo users if `not doc.exists`. If `mock-uid-demo.researcher` exists from a previous run without a password field, it is not updated, locking out the user. | Medium | `backend/app/main.py` | `main.py:80-84` |
| 12 | **FastAPI Deprecation Warnings:** Uses deprecated `@app.on_event("startup")` instead of modern FastAPI `lifespan` handler. Uses deprecated Pydantic v1 `class Config: from_attributes = True` instead of `model_config = ConfigDict(from_attributes=True)`. Uses deprecated `datetime.datetime.utcnow()`. | Low | `backend/app/main.py`<br>`backend/app/schemas/api_schemas.py`<br>`backend/app/services/auth_service.py` | `main.py:87`<br>`api_schemas.py:23, 42, 53, 94, 107`<br>`auth_service.py:26, 28` |

---

### D. Firebase & Database Configuration (`backend/app/database.py`, `backend/.env`)

| # | Issue Description | Severity | File Location | Line(s) |
|---|-------------------|----------|---------------|---------|
| 13 | **Missing Live Firebase Credentials:** `backend/.env` only specifies `FIREBASE_PROJECT_ID` and `FIREBASE_WEB_API_KEY`. No Service Account credentials (`FIREBASE_PRIVATE_KEY`, `FIREBASE_CLIENT_EMAIL`) or `GOOGLE_APPLICATION_CREDENTIALS` are provided. The backend operates exclusively on `MockFirestoreClient` (`backend/mock_firestore.json`). | High | `backend/app/database.py`<br>`backend/.env` | `database.py:183-208`<br>`.env:7-8` |
| 14 | **Incorrect `.env` Resolution Path:** `database.py` line 9 calls `os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))` to find `.env`. This resolves to the workspace root `project-11\.env` which does not exist, rather than `backend\.env`. | Medium | `backend/app/database.py` | `database.py:9` |

---

### E. Frontend & Mobile Parity / Contract Mismatches

| # | Issue Description | Severity | File Location | Line(s) |
|---|-------------------|----------|---------------|---------|
| 15 | **Dashboard Chart Broken on Backend Connection:** `latestSim.releaseCurve` is `undefined` when connected to the backend because `GET /api/dashboard` excludes `releaseCurve` from `recentSimulations`. Web `DashboardPage.jsx` renders an empty `AreaChart`. | High | `backend/app/routers/dashboard.py`<br>`web/src/pages/DashboardPage.jsx` | `dashboard.py:49-57`<br>`DashboardPage.jsx:99-107, 193` |
| 16 | **Missing Timestamp in Simulation History:** Backend `SimulationResponse` does not serialize `date` or `created_at`. Web `SimulationHistoryPage.jsx` renders blank dates in `<td ...>{sim.date}</td>`, while Mobile `history_screen.dart` always falls back to `"Recent"`. | Medium | `backend/app/schemas/api_schemas.py`<br>`backend/app/routers/simulations.py`<br>`web/src/pages/SimulationHistoryPage.jsx` | `api_schemas.py:74-93`<br>`simulations.py:149-168`<br>`SimulationHistoryPage.jsx:231` |
| 17 | **Drug Library Field Name Mismatches:** Backend `DrugResponse` provides `molecular_weight` (snake_case) and numeric `solubility`, while Web `DrugLibraryPage.jsx` expects `molecularWeight` (camelCase) and misses `category` and `halfLife`. This causes the Web UI to render "N/A" for molecular weight, half-life, and category. | Medium | `backend/app/schemas/api_schemas.py`<br>`web/src/pages/DrugLibraryPage.jsx` | `api_schemas.py:35-41`<br>`DrugLibraryPage.jsx:208-209, 251` |
| 18 | **Polymer Library Missing Attributes:** Backend `PolymerResponse` excludes `swellingRatio`, `degradationRate`, and `releaseBehavior`. Web `PolymerLibraryPage.jsx` displays "N/A" for swelling/degradation and blank kinetics. | Medium | `backend/app/schemas/api_schemas.py`<br>`web/src/pages/PolymerLibraryPage.jsx` | `api_schemas.py:45-52`<br>`PolymerLibraryPage.jsx:212-217` |
| 19 | **Flutter Linter / Deprecation Warnings:** 105 issues found during `flutter analyze`, notably widespread usage of deprecated `.withOpacity()` (recommended replacement: `.withValues()`), missing super parameters, and missing `const` constructors. | Low | `mobile/lib/` | Entire mobile codebase |

---

## 3. Scientific Simulation Test Results (15 Input Scenarios)

The physical release simulation engine was tested with 15 parameter sets:

| # | Scenario Name | Formulation / Conditions | Engine Verdict | Status | Invariants Verified |
|---|---------------|--------------------------|----------------|--------|---------------------|
| 1 | Standard Baseline | Ibuprofen + Chitosan, 50mg, 3%, 1.0mm, 37°C, pH 7.4, 60%, 24h | 14.5% rel, peak 1.95%/h | **PASS** | Monotonic, [0, 100], finite |
| 2 | Highly Soluble Drug | Metformin + Alginate, 80mg, 2%, 0.5mm, 37°C, pH 6.8, 70%, 12h | 87.0% rel, peak 40.5%/h | **PASS** | Monotonic, [0, 100], finite |
| 3 | Hydrophobic PLA | Ibuprofen + PLA, 30mg, 10%, 2.5mm, 37°C, pH 7.0, 40%, 48h | 0.4% rel, peak 0.03%/h | **PASS** | Monotonic, [0, 100], finite |
| 4 | Fast Burst Gelatin | Metformin + Gelatin, 100mg, 1%, 0.2mm, 42°C, pH 7.0, 90%, 6h | 100.0% rel, peak 99.99%/h | **PASS** | Monotonic, [0, 100], finite |
| 5 | Acidic Chitosan | Paracetamol + Chitosan, 40mg, 4%, 1.2mm, 37°C, pH 2.0, 50%, 24h | 44.8% rel, peak 7.02%/h | **PASS** | Monotonic, [0, 100], finite |
| 6 | Alkaline Pectin | Losartan + Pectin, 25mg, 5%, 1.5mm, 37°C, pH 8.5, 60%, 36h | 14.3% rel, peak 1.26%/h | **PASS** | Monotonic, [0, 100], finite |
| 7 | Cold Temperature | Paracetamol + Cellulose, 50mg, 3%, 1.0mm, 15°C, pH 7.0, 50%, 24h | 0.0% rel, peak 0.0%/h | **PASS** | Monotonic, [0, 100], finite |
| 8 | High Temperature | Losartan + Gelatin, 60mg, 2%, 0.8mm, 55°C, pH 7.0, 80%, 18h | 94.4% rel, peak 30.84%/h | **PASS** | Monotonic, [0, 100], finite |
| 9 | Low Moisture | Ibuprofen + PLA, 70mg, 8%, 3.0mm, 37°C, pH 7.0, 5%, 48h | 0.2% rel, peak 0.02%/h | **PASS** | Monotonic, [0, 100], finite |
| 10 | High Moisture | Metformin + Alginate, 50mg, 2%, 0.6mm, 37°C, pH 7.0, 95%, 12h | 84.0% rel, peak 37.29%/h | **PASS** | Monotonic, [0, 100], finite |
| 11 | Ultra-Thin Patch | Paracetamol + Chitosan, 20mg, 1%, 0.05mm, 37°C, pH 7.0, 50%, 8h | 100.0% rel, peak 92.16%/h | **PASS** | Monotonic, [0, 100], finite |
| 12 | Thick Matrix | Losartan + PLA, 90mg, 12%, 5.0mm, 37°C, pH 7.0, 50%, 48h | 0.5% rel, peak 0.04%/h | **PASS** | Monotonic, [0, 100], finite |
| 13 | High Drug Loading | Metformin + Cellulose, 200mg, 3%, 1.0mm, 37°C, pH 7.0, 50%, 24h | 67.0% rel, peak 13.71%/h | **PASS** | Monotonic, [0, 100], finite |
| 14 | Short Duration | Ibuprofen + Chitosan, 50mg, 3%, 1.0mm, 37°C, pH 7.0, 50%, 1h | 2.5% rel, peak 2.49%/h | **PASS** | Monotonic, [0, 100], finite |
| 15 | Zero Drug Loading | Ibuprofen + Chitosan, **0.0mg**, 3%, 1.0mm, 37°C, pH 7.0, 50%, 24h | **ValueError: Invalid input** | **FAIL** | Rejects zero loading with error |

---

## 4. Machine Learning Model Audit Evidence

```text
Actual Evaluated Performance (RandomForestRegressor v1.0, 200 validation samples):
- MAE: 9.4222%
- MSE: 176.1610
- RMSE: 13.2726%
- R² Score: 0.5093
- Training Samples: 200 (dynamically generated)

Claimed / Fabricated Performance (in predictor.py & UI):
- MAE: 1.84% (Discrepancy: +7.58%)
- RMSE: 2.45% (Discrepancy: +10.82%)
- R² Score: 0.948 (Discrepancy: -0.4387)
- Samples: 4,500 (Discrepancy: +4,300)
```

---

## 5. Summary of Recommended Bug Fixes (Phase 7 Scope)

1. **Simulation Engine:** Allow `drugLoading == 0.0` to return `predictedRelease: 0.0`, `peakReleaseRate: 0.0`, `timeTo50Percent: 'N/A'`, and all curve points `predicted: 0.0`, with remaining drug = 0.0 mg.
2. **Deterministic Graphs:** Remove random noise injection from `web/src/pages/SimulatorPage.jsx` and `mobile/lib/models/simulation_models.dart`. The simulated curve should accurately track physical kinetics or actual experimental points without artificial random perturbations.
3. **ML Pipeline & Realism:**
   - Either train a legitimate model with proper drug and polymer encodings on a reproducible dataset, or dynamically compute the honest evaluation metrics ($R^2$, MAE, RMSE) rather than hardcoding 0.948 and 1.84%.
   - Expose real feature importance data from the model to replace hardcoded UI arrays.
   - Fix feature name warnings by passing named DataFrames to `model.predict()`.
4. **Backend Stability & Security:**
   - Add missing `import uuid` in `drugs.py` and `polymers.py`.
   - Hash passwords with bcrypt in `auth.py` and ensure the demo researcher has valid credentials.
   - Fix `.env` loading path in `database.py`.
   - Replace deprecated FastAPI and Pydantic constructs.
5. **Contract Parity:**
   - Include `date` and `createdAt` in `SimulationResponse` and `simulations.py`.
   - Include `releaseCurve` in `recentSimulations` or populate `latestSim` properly in `DashboardPage.jsx`.
   - Align `DrugResponse` and `PolymerResponse` fields with frontend expectations (`category`, `molecularWeight` alias, `halfLife`, `swellingRatio`, `degradationRate`, `releaseBehavior`).

