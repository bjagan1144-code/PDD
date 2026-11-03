# BioPatch AI — Firebase Firestore Integration Report

**Timestamp:** 2026-11-03 22:42 IST  
**Environment:** Production / Live Cloud Firestore  
**Connected Project ID:** `biopatch-ai-fire`  
**Storage Mode:** `live_firestore` (`is_mock_storage: false`)  
**Status:** **CONNECTED & VERIFIED — PENDING MIGRATION APPROVAL**

---

## 1. Executive Summary

The BioPatch AI FastAPI backend has been connected to Google Cloud Firebase Firestore using the downloaded Firebase Admin SDK Service Account credentials. Silent fallback to mock storage has been disabled. A full backup of the local database has been secured, and a dry-run verified migration script is staged awaiting user approval.

| Check | Expected | Actual Result | Status |
| :--- | :--- | :--- | :--- |
| **Service Account JSON** | `backend/secrets/firebase-service-account.json` | Valid Google Service Account key | **PASS** |
| **Credential Security** | Excluded in `.gitignore` | `backend/secrets/`, `*.json`, `*.backup.json` ignored | **PASS** |
| **Admin SDK Library** | `firebase-admin` available | `firebase-admin v7.5.0` active | **PASS** |
| **Live Connection** | Real Firestore Project Client | Connected to `biopatch-ai-fire` | **PASS** |
| **Read / Write Test** | Probe doc create, read, delete | Atomic read/write/delete verified | **PASS** |
| **No Silent Fallback** | Explicit error if credentials fail | `RuntimeError` raised on failure; mock disabled | **PASS** |
| **Health Check Endpoint** | Live Firestore status | `"storage_mode": "live_firestore"` | **PASS** |
| **Local Database Backup** | Safe backup before any migration | `backend/mock_firestore.backup.json` (1.18 MB) | **PASS** |
| **Migration Readiness** | Script with batching & ID preservation | `backend/migrate_to_firestore.py` ready (Dry-run verified) | **PASS** |
| **UI Parity** | Web & Mobile UI untouched | 0 modifications to `web/src` or `mobile/` | **PASS** |

---

## 2. Credentials & Security Verification

1. **Service Account Detection:**
   - **Path:** `backend/secrets/firebase-service-account.json`
   - **Service Account Identity:** `firebase-adminsdk-fbsvc@biopatch-ai-fire.iam.gserviceaccount.com`
   - **Project ID:** `biopatch-ai-fire`
   - **Key Protection:** Private key verified for valid PEM structure; never exposed, printed, or logged.

2. **Git Security Exclusions (`.gitignore`):**
   The project `.gitignore` was updated to ensure no service account keys, secrets, or database backups can be committed:
   ```gitignore
   # Environment variables & secrets
   .env
   .env.local
   *.pem
   secrets/
   backend/secrets/
   *service-account*.json
   *firebase-adminsdk*.json
   *.backup.json
   ```

3. **Backend Environment Configuration (`backend/.env`):**
   ```env
   FIREBASE_PROJECT_ID=biopatch-ai-fire
   FIREBASE_WEB_API_KEY=AIzaSyDHJ3Yilerm216ROxnq8pbsuVG1DS3LKS8
   FIREBASE_SERVICE_ACCOUNT_KEY_PATH=secrets/firebase-service-account.json
   ```

---

## 3. Database Initialization & Strict Mode

In [`backend/app/database.py`](file:///c:/Users/bsowm/OneDrive/Documents/PDD/project-11/backend/app/database.py), the initialization logic was updated to enforce strict error handling:

- When `FIREBASE_SERVICE_ACCOUNT_KEY_PATH` (or default `secrets/firebase-service-account.json`) is present, the Firebase Admin SDK initializes with `credentials.Certificate(...)`.
- **Silent Fallback Disabled:** If credentials are provided but initialization or cloud connectivity fails, the engine raises a `RuntimeError` rather than silently reverting to `MockFirestoreClient`:
  ```python
  raise RuntimeError(
      f"FATAL: Firebase Admin SDK initialization failed: {e}. "
      "Credentials were provided, so silent fallback to mock storage is disabled. "
      "Please check service account key permissions and network connectivity."
  )
  ```
- `db.storage_mode` is strictly set to `"live_firestore"`.

---

## 4. Live Firestore Verification Tests

### 4.1 Cloud Read/Write Probe
A temporary document was written to `_connection_verification/test_probe` in Google Cloud Firestore, queried back to verify field values, and deleted cleanly:
```
Firestore client obtained: <google.cloud.firestore_v1.client.Client>
Project ID: biopatch-ai-fire
Wrote probe document: {'message': 'BioPatch AI Firestore Integration Verification', 'status': 'connected'}
Verified document existence: True
Cleaned up probe: Deleted successfully
```

### 4.2 Live Health Endpoint Verification
The running backend server was queried at `GET /health` (`http://127.0.0.1:8000/health`):
```json
{
  "status": "ok",
  "database": "connected",
  "storage_mode": "live_firestore",
  "is_mock_storage": false,
  "model": "loaded"
}
```

---

## 5. Inspection of Existing Data

A full inventory of [`backend/mock_firestore.json`](file:///c:/Users/bsowm/OneDrive/Documents/PDD/project-11/backend/mock_firestore.json) was conducted:

| Collection | Records | Notes |
| :--- | :--- | :--- |
| **users** | **215** | Includes researcher accounts (`demo.researcher@biopatch.ai`, `b.jagan021@gmail.com`, etc.) with `bcrypt` password hashes and load-test user profiles. |
| **simulations** | **1,310** | Complete biophysical kinetics outputs, time series, parameters, and user relational links (`user_id`). |
| **predictions** | **1,310** | Random Forest model inference records linked to `simulation_id`. |
| **drugs** | **5** | Metformin, Paracetamol, Losartan, Ibuprofen, etc. |
| **polymers** | **7** | PLA, Alginate, Gelatin, Pectin, Cellulose, Chitosan, etc. |
| **reports** | **2** | Pre-clinical PDF report archives. |
| **Total** | **2,849** | Documents inventoried for migration. |

---

## 6. Data Backup & Migration Script

1. **Backup File:**
   - Source: `backend/mock_firestore.json`
   - Destination: [`backend/mock_firestore.backup.json`](file:///c:/Users/bsowm/OneDrive/Documents/PDD/project-11/backend/mock_firestore.backup.json)
   - Size: 1.18 MB
   - Status: **Safely backed up on disk and excluded from git.**

2. **Migration Tool ([`backend/migrate_to_firestore.py`](file:///c:/Users/bsowm/OneDrive/Documents/PDD/project-11/backend/migrate_to_firestore.py)):**
   - **Dry-run Safe:** Defaults to dry-run mode unless `--confirm` is explicitly passed.
   - **Batching:** Chunks document writes into batches of 450 (well within Firestore's 500-operation transaction quota).
   - **Data Fidelity:** Preserves exact document keys (`sim-xxxxxx`, `uid`), `password` bcrypt hashes, relational fields (`user_id`, `simulation_id`), and ISO timestamps.
   - **Idempotent:** Employs `set(..., merge=True)` so it can be re-run safely without duplication.

### Dry-run Test Output
```
=================================================================
  BioPatch AI — Firestore Migration Engine
=================================================================
[+] Verified backup exists at: backend\mock_firestore.backup.json

[Data Discovery]
  - drugs          :     5 documents
  - polymers       :     7 documents
  - users          :   215 documents
  - simulations    :  1310 documents
  - predictions    :  1310 documents
  - reports        :     2 documents
  Total Records: 2849

=================================================================
 [DRY-RUN MODE] No data was written to Firestore.
 To execute the migration, run with the --confirm flag:
   python backend/migrate_to_firestore.py --confirm
=================================================================
```

---

## 7. Current Action & Next Steps

> [!IMPORTANT]
> **Data Migration is Paused Awaiting Explicit User Approval.**
> - The live Firestore database is currently connected and running.
> - Reference drug/polymer libraries and default researchers have been initialized.
> - The 2,849 historical records (215 users and 1,310 simulations) in `backend/mock_firestore.backup.json` are intact.
> 
> **To proceed with migrating all 2,849 records to live Google Cloud Firestore, please provide your approval.**

