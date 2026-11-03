# BioPatch AI — GitHub Actions CI/CD Setup Report

**Repository:** [https://github.com/bjagan1144-code/PDD](https://github.com/bjagan1144-code/PDD)  
**Branch:** `main`  
**Date:** November 4, 2026 — 00:15 IST  
**Environment:** Linux Ubuntu Runners (`ubuntu-latest`)  
**Security Policy:** Zero credential exposure, GitHub Secrets for production parameters, Spark plan preserved.

---

## 1. Overview of Implemented Workflows

Four specialized GitHub Actions workflows have been created in `.github/workflows/`:

```
.github/workflows/
├── backend-tests.yml        # Continuous Integration for FastAPI backend & mathematical validation
├── web-tests.yml            # Automated Selenium Web testing using Headless Chrome
├── mobile-tests.yml         # Appium UiAutomator2 Android test suite
└── load-stress-manual.yml   # Protected manual trigger for high-concurrency performance evaluation
```

---

## 2. Workflow Specifications

### 2.1 Backend Workflow (`backend-tests.yml`)
- **Trigger:** Automatic on push or pull request touching `backend/**`, `tests/scientific_validation.py`, or the workflow file.
- **Steps:**
  1. Checks out repository with `actions/checkout@v4`.
  2. Sets up Python 3.11 with pip caching.
  3. Installs backend dependencies from `backend/requirements.txt`.
  4. Executes physical kinetics & scientific validation (`tests/scientific_validation.py`).
  5. Executes backend test suite with code coverage (`pytest --cov=app`).
  6. Archives test logs and summaries as pipeline artifacts.

### 2.2 Web Workflow (`web-tests.yml`)
- **Trigger:** Automatic on push or pull request touching `web/**` or `tests/selenium/**`.
- **Steps:**
  1. Sets up Python 3.11 and Node.js 20.
  2. Builds the React web application with Vite using clean dependency caching.
  3. Starts the backend and Vite preview server in background.
  4. Launches Headless Chrome and runs the 25 core Selenium workflows.
  5. Generates and uploads Excel and HTML test reports.

### 2.3 Mobile Workflow (`mobile-tests.yml`)
- **Trigger:** Push touching `mobile/**` or manual `workflow_dispatch`.
- **Steps:**
  1. Sets up Java 17, Node.js 20, and Python 3.11.
  2. Installs Appium 3.9 and UiAutomator2 driver globally.
  3. Probes ADB device connectivity:
     - If an Android device or emulator is connected, launches Appium on port 4723 and runs native automation.
     - If no hardware or AVD is attached in the GitHub runner, safely reports **`BLOCKED`** with diagnostic logs rather than fabricating test passes.

### 2.4 Controlled Load & Stress Workflow (`load-stress-manual.yml`)
- **Trigger:** **Manual ONLY (`workflow_dispatch`)**.
- **Safety Safeguards:**
  - Requires the user to enter `'I CONFIRM STAGING'` before running.
  - Requires explicit specification of target API host, preventing unintended load against production or Spark-tier Firebase instances.
  - Parameterized concurrency options (10 to 200 users).

---

## 3. GitHub Security & Secret Hygiene

- **Protected Assets:** All Firebase Admin SDK service account files (`backend/secrets/*`) and `.env` files are explicitly excluded via `.gitignore`.
- **No Paid Billing Alteration:** Workflows operate completely within the existing free Spark plan parameters.
