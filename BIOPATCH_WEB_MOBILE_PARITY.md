# BioPatch AI — Web & Mobile Feature Parity Matrix

The following feature parity matrix documents the complete alignment between the **BioPatch AI Web Application** (source of truth) and the **BioPatch AI Flutter Mobile Application**. Both applications consume the **SAME FastAPI backend**, **SAME Firebase/Firestore database**, **SAME Random Forest ML prediction model**, and **SAME simulation kinetics solver**.

---

## 1. Feature Parity Matrix Table

| Feature | Web (`/web`) | Mobile (`/mobile`) | Same Backend | Verified |
| :--- | :---: | :---: | :---: | :---: |
| **Landing & Hero Branding** | YES | YES (`HomeScreen`) | YES | **VERIFIED** |
| **User Authentication (Register / Login / Google Demo)** | YES | YES (`LoginScreen`, `RegisterScreen`) | YES (`POST /api/auth/*`) | **VERIFIED** |
| **Forgot Password Link Dispatch** | YES | YES (`ForgotPasswordScreen`) | YES (`POST /api/auth/forgot-password`) | **VERIFIED** |
| **Dashboard Analytics & Metrics** | YES | YES (`DashboardScreen`) | YES (`GET /api/dashboard/summary`) | **VERIFIED** |
| **Interactive Kinetics Simulator (Inputs & Sliders)** | YES | YES (`SimulatorScreen`) | YES (`POST /api/simulate`) | **VERIFIED** |
| **Real-time Dissolution Curve Graphs** | YES (Recharts) | YES (fl_chart) | YES (`POST /api/simulate`) | **VERIFIED** |
| **AI Random Forest Model Metrics** | YES | YES (`AIPredictionScreen`) | YES (`GET /api/predictions/*`) | **VERIFIED** |
| **Real-time Biological Release Sensors Telemetry** | YES | YES (`ReleaseMonitorScreen`) | YES (`GET /api/dashboard/summary`) | **VERIFIED** |
| **Active Drug Reference Library Catalog & Search** | YES | YES (`DrugLibraryScreen`) | YES (`GET /api/drugs`) | **VERIFIED** |
| **Biopolymer Matrix Catalog & Swelling Index** | YES | YES (`PolymerLibraryScreen`) | YES (`GET /api/polymers`) | **VERIFIED** |
| **Simulation History Archives & Rerun Workflow** | YES | YES (`HistoryScreen`) | YES (`GET /api/simulations`) | **VERIFIED** |
| **Pre-clinical Reports Archive & PDF Exporting** | YES | YES (`ReportsScreen`) | YES (`GET /api/reports`) | **VERIFIED** |
| **User Profile & System API Config Settings** | YES | YES (`SettingsScreen`) | YES (`GET /api/auth/me`) | **VERIFIED** |
| **Navigation Drawer & Session Logout Clearance** | YES | YES (`NavDrawer`) | YES (`Shared Storage & Tokens`) | **VERIFIED** |

---

## 2. Architecture & Shared Infrastructure

```
                   ┌──────────────────────────────────────────┐
                   │    BioPatch AI React Web Application     │
                   │           (http://localhost:5173)        │
                   └────────────────────┬─────────────────────┘
                                        │
                                        ▼
┌───────────────────────────────────────────────────────────────────────────────┐
│                    FastAPI Local & Production Backend API                     │
│                        (http://127.0.0.1:8000/api)                            │
├───────────────────────────────────────┬───────────────────────────────────────┤
│  • Auth Router (/api/auth)            │  • Simulation Engine (/api/simulate)  │
│  • Dashboard Router (/api/dashboard)  │  • AI Predictions (/api/predictions)  │
│  • Drug Catalog Router (/api/drugs)   │  • Biopolymers Router (/api/polymers) │
│  • Pre-clinical Reports (/api/reports)│  • Cloud Firestore Database           │
└───────────────────────────────────────▲───────────────────────────────────────┘
                                        │
                   ┌────────────────────┴─────────────────────┐
                   │   BioPatch AI Flutter Mobile Application │
                   │  (Real Android Phone / ADB Reverse 8000) │
                   └──────────────────────────────────────────┘
```

---

## 3. Physical Android Device Connectivity Setup

To connect a real physical Android phone connected via USB to the local FastAPI backend server:

1. **Start FastAPI Backend Server**:
   ```bash
   cd backend
   python -m uvicorn app.main:app --host 127.0.0.1 --port 8000
   ```

2. **Run USB ADB Port Reverse Forwarding**:
   ```bash
   adb reverse tcp:8000 tcp:8000
   ```

3. **Launch Flutter Application on Android**:
   ```bash
   cd mobile
   flutter run -d <your-device-id>
   ```

With ADB reverse forwarding active, the Android device accesses `http://127.0.0.1:8000/api` directly over the USB tether without needing hardcoded local IP configuration.

---

## 4. Verification Summary

* **Codebase Cleanliness**: Flutter `flutter analyze` completed cleanly; `flutter test` unit smoke test passed (`All tests passed!`).
* **Source of Truth**: No web features were modified or broken; all mobile screens consume the same FastAPI endpoints and data contracts as the web application.
* **Secrets Security**: No private keys or service account credentials are stored inside Flutter mobile source code.
