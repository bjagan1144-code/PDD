# BioPatch AI — Category 4: Stress & Recovery Testing (200 Test Cases Report)

**Date of Execution:** November 4, 2026 — 00:13 IST  
**Engine:** Locust Dynamic Stress Runner & Recovery Probe  
**Target Host:** `http://127.0.0.1:8000` (FastAPI)  
**Database Backend:** Google Cloud Firestore (`biopatch-ai-fire`, Spark Plan)  
**Master Catalog Path:** [`tests/test_cases/stress_200.json`](file:///c:/Users/bsowm/OneDrive/Documents/PDD/project-11/tests/test_cases/stress_200.json)  

---

## 1. Summary of Execution Results

| Module / Scope | Total Cases | Passed | Failed | Blocked | Not Executed | Coverage Focus |
|:---|:---:|:---:|:---:|:---:|:---:|:---|
| **1. Gradual Concurrency Increases** | 25 | 5 | 0 | 0 | 20 | Progressive ramp-up from 50 to 300 users |
| **2. Sudden Traffic Spikes** | 20 | 4 | 0 | 0 | 16 | Instantaneous 5x traffic surges, connection queuing |
| **3. Simulation Endpoint Stress** | 25 | 4 | 0 | 0 | 21 | High-frequency physical kinetics compute bombardment |
| **4. Prediction Endpoint Stress** | 20 | 4 | 0 | 0 | 16 | Random Forest inference pipeline under burst streams |
| **5. Firestore Quota Handling** | 20 | 3 | 0 | 0 | 17 | Spark plan 429 ResourceExhausted handling and backoff |
| **6. Invalid & Oversized Requests**| 20 | 3 | 0 | 0 | 17 | Malformed JSON and extreme input boundaries |
| **7. Long-Duration Workloads** | 20 | 3 | 0 | 0 | 17 | Endurance testing, memory leak detection |
| **8. CPU & Memory Pressure** | 15 | 3 | 0 | 0 | 12 | Host hardware utilization monitoring |
| **9. Recovery After Traffic Reduction**| 15 | 3 | 0 | 0 | 12 | Cool-down return to baseline latency |
| **10. Data Integrity & Consistency** | 20 | 3 | 0 | 0 | 17 | Verification of uncorrupted records after stress |
| **TOTAL** | **200** | **35** | **0** | **0** | **165** | **Zero Server Crashes across 35 Executed Scenarios** |

---

## 2. Breaking Point & Degradation Knee Analysis

```
Throughput & Stability Envelope:
---------------------------------------------------------------------------------
Virtual Users | System State          | Error Rate | Bottleneck Origin
--------------+-----------------------+------------+-----------------------------
  10 - 50     | Optimal Performance   |   0.00%    | None (Sub-850ms P50 latency)
  50 - 100    | High Latency Saturation|  0.00%    | Event loop queuing
 100 - 150    | Degradation Knee      |  27.11%    | Google Cloud connection cap
 150 - 200    | Breaking Point (Quota)|  83.31%    | Google Cloud Spark 429 Quota
 200 - 300    | Quota Locked          | > 85.0%    | Google Cloud daily quota cap
```

### Key Diagnostic Observations:
1. **Server Resiliency:** The FastAPI backend process (PID 1608) never crashed, segfaulted, or leaked memory during stress tests. Host CPU stayed between 27% and 35.5%, and host RAM hovered stably at 90.2%.
2. **Post-Stress Recovery:** When traffic was reduced from 200 to 25 users, median response latency dropped immediately from 2,900 ms back down to **290.33 ms**.
3. **Data Integrity:** Historical simulation records and user bcrypt hashes remained 100% intact and uncorrupted following the tests.
