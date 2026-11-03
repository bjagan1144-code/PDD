# BioPatch AI — Existing Mobile App Diagnostic Audit

**Audit Date:** November 3, 2026  
**Target Directory:** `mobile/`  
**Application Name:** `biopatch_mobile` (BioPatch AI Pre-clinical Drug Release Modeling App)  
**Auditor:** Full-Stack & Mobile Systems Engineer  
**Status:** Audit Completed — Migration to Expo React Native Required

---

## 1. Executive Summary

An in-depth inspection and diagnostic analysis of the existing mobile folder (`mobile/`) was conducted. The existing application is implemented entirely in **Flutter/Dart**, not React Native or Expo. It suffers from fundamental networking configuration defects, outdated dependencies, API mismatches with the completed backend, artificial random noise injection in simulation charts, and over 105 static analyzer diagnostic warnings and errors.

In accordance with project requirements ("Do not use Flutter. Use Expo and React Native with JavaScript"), the Flutter project will be kept intact and safe, while a new, full-fidelity **Expo React Native** application is constructed to match the completed web application pixel-for-pixel and feature-for-feature.

---

## 2. Technical Stack & Architecture of Existing App

- **Framework:** Flutter SDK `3.41.7` / Dart `3.11.5`
- **State Management:** Provider (`^6.1.1`)
- **Routing:** Imperative Navigator 1.0 (`MaterialPageRoute`) in `main.dart`
- **Networking:** `http` package (`^1.2.0`)
- **Persistence:** `shared_preferences` (`^2.2.2`)
- **Charting:** `fl_chart` (`^0.66.0`)
- **Target OS:** Android (`mobile/android`), Windows (`mobile/windows`), Web (`mobile/web`)

---

## 3. Existing Screens & Navigation

The Flutter application implemented 12 screens:
1. `home_screen.dart` — Landing screen with hero text and navigation buttons.
2. `login_screen.dart` — Email/password login with demo shortcut.
3. `register_screen.dart` — User registration.
4. `forgot_password_screen.dart` — Password reset request.
5. `dashboard_screen.dart` — Metrics cards and recent simulations.
6. `simulator_screen.dart` — Formulation sliders and release curve chart.
7. `ai_prediction_screen.dart` — Prediction inputs and validation metrics.
8. `drug_library_screen.dart` — Catalog of drug formulations.
9. `polymer_library_screen.dart` — Catalog of biopolymer matrices.
10. `release_monitor_screen.dart` — Playback animation of drug release.
11. `history_screen.dart` — List of past simulations.
12. `reports_screen.dart` — List of generated PDF reports.
13. `settings_screen.dart` — Backend URL configuration and session info.

*Missing Screen compared to Web:* An explicit dedicated "Explore" public formulation gallery screen.

---

## 4. Identified Defects & Diagnostic Findings

### 4.1 Fatal Network Configuration (Android Emulator Failure)
- **File:** `mobile/lib/core/api/api_config.dart` (Line 4):
  ```dart
  static const String defaultBaseUrl = 'http://127.0.0.1:8000/api';
  ```
- **Defect:** On Android emulators, `127.0.0.1` refers to the internal loopback of the Android virtual machine itself, **not** the developer's workstation host. Any attempt to communicate with the FastAPI backend fails immediately with `SocketException: Connection refused` or network timeout.
- **Requirement:** Android emulators must use `http://10.0.2.2:8000/api`, while physical devices require the host's LAN IP (`http://192.168.x.x:8000/api`).

### 4.2 Artificial Random Noise Injection (Scientific Non-Determinism)
- **File:** `mobile/lib/models/simulation_models.dart` (Lines 28–32):
  ```dart
  final randNoise = (Random((t * 100).toInt()).nextDouble() - 0.5) * 2.5;
  sim = (pred + randNoise).clamp(0.0, 100.0);
  ```
- **Defect:** The Flutter app synthesizes artificial random fluctuation on simulation curves, violating biophysical monotonicity ($R(t_i) \ge R(t_{i-1})$) and determinism.
- **Requirement:** All curves must come directly and deterministically from the authoritative backend simulation engine without artificial noise.

### 4.3 Missing Mass Balance Tracking
- **File:** `mobile/lib/models/simulation_models.dart` & `simulator_screen.dart`
- **Defect:** Does not render or track `releasedAmountMg` and `remainingDrugMg` ($M_{\text{released}} + M_{\text{remaining}} = M_0$).

### 4.4 Hardcoded ML Accuracy Metrics
- **File:** `mobile/lib/screens/ai_prediction_screen.dart`
- **Defect:** Displays hardcoded fabricated accuracy metrics ($R^2 = 94.8\%$, $\text{MAE} = 1.8\%$, 4,500 samples) instead of fetching real evaluation metrics ($R^2 = 0.7638$, $\text{MAE} = 6.59\%$, 1,200 samples) from `/api/predictions/metrics`.

### 4.5 Static Analyzer Diagnostics
- **Command Executed:** `flutter analyze`
- **Result:** **105 diagnostic issues found.**
  - Over 60 deprecation warnings for `withOpacity()` (deprecated in Flutter; recommends `.withValues()`).
  - Numerous `use_super_parameters` and `prefer_const_constructors` warnings.
  - Asynchronous context gaps (`use_build_context_synchronously`) in `settings_screen.dart` and `login_screen.dart` which cause crashes if widgets unmount during HTTP requests.

---

## 5. Migration Strategy: Moving to Expo React Native

Per the project specification:
1. **Preserve Reusable Assets & Concepts:** Preserve color definitions, layout hierarchies, form fields, and user flows.
2. **Framework Switch:** Migrate completely to **Expo React Native with JavaScript and Expo Router**.
3. **Keep Old Code Safe:** Keep `mobile/` untouched until the new Expo app is verified and functional.
4. **Target Structure:**
   - Place the Expo application in a dedicated mobile directory (or migrate in-place cleanly without deleting the Flutter archive).
   - Use Expo Router with file-based navigation matching the 14 required screens.
   - Implement `SecureStore` for JWT tokens.
   - Implement `react-native-chart-kit` or `react-native-gifted-charts` for smooth, responsive dark-themed charts matching web.
   - Configure dynamic API base URL switching (`10.0.2.2:8000` for Android emulator, LAN IP for physical device).

