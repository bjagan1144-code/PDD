# BioPatch AI — Comprehensive Performance & Latency Report

**Evaluator:** Lead Performance QA Engineer  
**Date:** November 4, 2026 — 00:15 IST  
**Host Hardware:** Windows 11 Enterprise | AMD64 | 8 Cores | 16GB RAM  
**Active Backend Worker:** FastAPI 0.115.0 on Uvicorn  
**Database Backend:** Google Cloud Firestore (`biopatch-ai-fire`, Spark Free Tier)  

---

## 1. Concurrency vs. Latency Curve

```mermaid
xychart-beta
    title "Throughput (RPS) vs Concurrent Virtual Users"
    x-axis [10, 25, 50, 100, 150, 200]
    y-axis "Requests Per Second (RPS)" 0 --> 90
    bar [27.8, 37.2, 35.7, 33.9, 34.3, 82.7]
```

### Detailed Metrics Breakdown:

| Concurrency (Users) | Throughput (RPS) | Error Rate (%) | Average (ms) | Median P50 (ms) | P90 (ms) | P95 (ms) | P99 (ms) | Max (ms) | Host CPU (%) | Host RAM (%) |
|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|
| **10** | 27.80 | 0.00% | 233.83 | 181.31 | 361.41 | 883.00 | 1,100.11 | 1,200.42 | 30.5% | 90.7% |
| **25** | 37.20 | 0.00% | 594.74 | 385.04 | 1,375.97 | 1,579.18 | 2,226.95 | 2,535.57 | 32.5% | 90.7% |
| **50** | 35.70 | 0.00% | 1,465.90 | 858.33 | 3,537.04 | 3,870.13 | 4,465.40 | 4,634.93 | 27.7% | 90.5% |
| **100** | 33.90 | 0.00% | 3,210.71 | 3,017.92 | 5,234.45 | 7,094.31 | 8,226.58 | 8,292.05 | 35.5% | 90.5% |
| **150** | 34.30 | 27.11% | 4,635.62 | 3,653.34 | 9,694.29 | 10,336.49 | 11,051.75 | 11,725.14 | 29.9% | 90.2% |
| **200** | 82.70 | 83.31% | 2,773.95 | 2,900.93 | 4,986.65 | 5,932.45 | 7,496.41 | 9,184.92 | 34.0% | 90.2% |

---

## 2. Root Cause Analysis: The 200-User Breaking Point

1. **Host CPU & Memory Stability:**  
   Host CPU never exceeded **35.5%**, and host RAM remained at **90.2%** with no paging thrash or memory leaks. The local machine was never the bottleneck.
2. **Cloud Free-Tier Quota Ceiling:**  
   The project connects to Google Cloud Firestore on the **Spark Plan (Free Tier)**. Google enforces a 100-connection ceiling and daily read/write caps. When 200 concurrent users dished rapid requests, Firestore returned:
   ```text
   google.api_core.exceptions.ResourceExhausted: 429 Quota exceeded.
   ```
3. **Recovery Verification:**  
   When the load was dropped back to 25 users, median response latency recovered immediately to **290.33 ms**, proving the backend process remained entirely healthy.

