# BioPatch AI — Category 2: Appium Android Automation (200 Test Cases Report)

**Date of Execution:** November 4, 2026 — 00:10 IST  
**Appium Server:** Appium 3.9.0 with `uiautomator2@8.7.0` listening on `127.0.0.1:4723`  
**Host Android Infrastructure:** Android SDK at `~\AppData\Local\Android\Sdk`  
**Target Device / Emulator:** `emulator-5554` (Android Virtual Device `Pixel_8`, Status: `device`)  
**Target Package:** `com.biopatch.ai` (Expo Router / React Native)  
**Master Catalog Path:** [`tests/test_cases/appium_200.json`](file:///c:/Users/bsowm/OneDrive/Documents/PDD/project-11/tests/test_cases/appium_200.json)  

---

## 1. Summary of Execution Results

| Module / Scope | Total Cases | Passed | Failed | Blocked | Not Executed | Coverage Focus |
|:---|:---:|:---:|:---:|:---:|:---:|:---|
| **1. App Installation and Launch** | 15 | 0 | 0 | 15 | 0 | Expo bundle load, splash screen, launcher intent |
| **2. Session & Lifecycle** | 15 | 0 | 0 | 15 | 0 | App foreground/background pause, state restoration |
| **3. Registration** | 15 | 0 | 0 | 15 | 0 | Native form inputs, keyboard handling, validation |
| **4. Login & Authentication** | 15 | 0 | 0 | 15 | 0 | Credentials input, password toggle, SecureStore tokens |
| **5. Dashboard** | 15 | 0 | 0 | 15 | 0 | Summary stat cards, pull-to-refresh, SVG charts |
| **6. Navigation** | 15 | 0 | 0 | 15 | 0 | Bottom tabs, side drawer modal, back stack |
| **7. Drug Library** | 15 | 0 | 0 | 15 | 0 | Mobile drug catalog list, search bar, compound details |
| **8. Polymer Library** | 15 | 0 | 0 | 15 | 0 | Matrix chips, swelling ratio cards, erosion filters |
| **9. Simulator** | 20 | 0 | 0 | 20 | 0 | Native sliders, numeric inputs, formulation bounds |
| **10. Mathematical Simulation Outputs**| 15 | 0 | 0 | 15 | 0 | Physical release %, curve rendering on mobile SVG |
| **11. AI Prediction** | 10 | 0 | 0 | 10 | 0 | Random Forest model inference, confidence indicators |
| **12. History and Reports** | 10 | 0 | 0 | 10 | 0 | History cards, report PDF share intent |
| **13. Profile and Settings** | 10 | 0 | 0 | 10 | 0 | Profile form, dark theme toggle, backend URL modal |
| **14. Network & Firebase Integration** | 15 | 0 | 0 | 15 | 0 | Offline banners, API timeout alerts, sync retry |
| **TOTAL** | **200** | **0** | **0** | **200** | **0** | **Honest Status: 200 BLOCKED (No Mock Fallbacks)** |

---

## 2. Infrastructure Setup & Diagnostic Audit

### 2.1 Genuine Infrastructure Active on Host:
1. **Appium Server:** Successfully bound and active on `http://127.0.0.1:4723` (Version 3.9.0 with `uiautomator2@8.7.0` driver).
2. **Android Virtual Device:** `Pixel_8` AVD was launched and is currently running with online device status:
   ```text
   List of devices attached
   emulator-5554	device
   ```
3. **Environment Variables:** `ANDROID_HOME` and `ANDROID_SDK_ROOT` configured pointing to `C:\Users\bsowm\AppData\Local\Android\Sdk`.

### 2.2 Genuine Blocker Identified (Why Tests are Marked BLOCKED):
When Appium initialized the native UiAutomator2 session against `emulator-5554`, it inspected the device package manager and returned:
```text
Neither provide 'app' option to install 'com.biopatch.ai' or consider setting 'noReset' to 'true' 
if 'com.biopatch.ai' is supposed to be preinstalled.
```
- The Expo application source code is present in `mobile/`, but a compiled standalone Android APK (e.g., `app-debug.apk` for package `com.biopatch.ai`) has not yet been built or installed on `emulator-5554`.
- In strict adherence to testing guidelines: **Zero mock fallbacks or simulated passes were permitted.**
- All 200 mobile test cases are honestly classified as **`BLOCKED`** pending APK generation (`npx expo run:android` or EAS build).
