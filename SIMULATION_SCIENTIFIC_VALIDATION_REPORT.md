# BioPatch AI — Simulation Scientific & Mathematical Validation Report

**Date of Audit:** November 4, 2026 — 00:14 IST  
**Validation Suite:** [`tests/scientific_validation.py`](file:///c:/Users/bsowm/OneDrive/Documents/PDD/project-11/tests/scientific_validation.py)  
**Backend Kinetics Engine:** [`backend/app/simulation/engine.py`](file:///c:/Users/bsowm/OneDrive/Documents/PDD/project-11/backend/app/simulation/engine.py)  
**Frontend Kinetics Engine:** [`web/src/utils/simulation.js`](file:///c:/Users/bsowm/OneDrive/Documents/PDD/project-11/web/src/utils/simulation.js)  
**Machine Learning Predictor:** [`backend/app/ml/predictor.py`](file:///c:/Users/bsowm/OneDrive/Documents/PDD/project-11/backend/app/ml/predictor.py)  

---

## 1. Executive Summary

A rigorous mathematical, kinetic, and algorithmic audit of the BioPatch AI simulation engines was conducted. The application implements hybrid **Higuchi square-root** and **Korsmeyer-Peppas exponential power-law** diffusion kinetics to predict transdermal biopolymer drug release.

### Audit Result: **13 / 13 Verification Checks PASSED (100.0%)**

---

## 2. Itemized Mathematical & Kinetic Verification

| Audit Check ID | Scientific Parameter | Theoretical Standard | Empirical Audit Finding | Status |
|:---|:---|:---|:---|:---:|
| **SCI-001** | Zero Drug Loading | If $L_0 = 0.0\text{ mg}$, cumulative release $Q(t) \equiv 0\%$ and delivered drug $M(t) \equiv 0.0\text{ mg}$. | Output: `predictedRelease = 0.0%`, `releasedAmountMg = 0.0 mg`, `remainingDrugMg = 0.0 mg`. | **PASS** |
| **SCI-002** | Zero Duration Guard | Simulation time $t \le 0$ must be rejected as an invalid experimental duration. | Threw explicit `ValueError: Invalid formulation parameter input`. | **PASS** |
| **SCI-003** | Non-Negativity | For all $t \ge 0$, release percentage $Q(t) \ge 0$ and released mass $M(t) \ge 0$. | All curve points across 4 drug loading tiers verified strictly non-negative. | **PASS** |
| **SCI-004** | Strict Monotonicity | For non-degrading or swelling release models, cumulative release must satisfy $\frac{dQ}{dt} \ge 0$. | Verified monotonically non-decreasing across all 6 biopolymers (PLA, Alginate, Chitosan, Gelatin, Pectin, Cellulose). | **PASS** |
| **SCI-005** | Ceiling Constraint | Cumulative release must never exceed 100% or initial drug loading $L_0$. | Maximum observed curve asymptote $\le 100.0\%$; delivered mass $\le L_0$. | **PASS** |
| **SCI-006** | Mass Conservation Balance | Mass conservation requires $M_{\text{released}}(t) + M_{\text{remaining}}(t) \equiv L_0$ for all time steps. | Maximum observed deviation across all curves was **0.0000 mg** (within $\pm 0.15\text{ mg}$ tolerance). | **PASS** |
| **SCI-007** | pH Boundary Enforcement | Physiological pH ranges must be constrained between $0.0$ and $14.0$. | Negative pH (-1.0) and excessive pH (15.0, 99.0) rejected with `ValueError`. | **PASS** |
| **SCI-008** | Temperature Range | Transdermal formulations constrained between $10^\circ\text{C}$ and $60^\circ\text{C}$. | Out-of-range temperatures ($5^\circ\text{C}, 65^\circ\text{C}, -10^\circ\text{C}$) rejected with `ValueError`. | **PASS** |
| **SCI-009** | Negative Parameter Input | Concentration, thickness, and moisture must strictly be positive numbers. | Negative values (-2.0% conc, -0.5mm thickness, -10% moisture) rejected with `ValueError`. | **PASS** |
| **SCI-010** | NaN / Infinity Guards | Floating-point anomalies (`NaN`, `+Inf`, `-Inf`) must not cause silent calculations. | `math.nan` and $\pm\infty$ safely trapped by `is_valid_num` validator. | **PASS** |
| **SCI-011** | Higuchi Kinetic Behavior | Early Fickian diffusion through planar matrices obeys Higuchi model: $Q(t) \propto \sqrt{t}$. | Ratio $\frac{Q(16\text{h})}{Q(4\text{h})} = 2.00$ exactly matches theoretical $\frac{\sqrt{16}}{\sqrt{4}} = 2.00$. | **PASS** |
| **SCI-012** | Korsmeyer-Peppas Behavior | Swellable hydrogels obey Peppas power law: $\frac{M_t}{M_\infty} = k \cdot t^n$. | Alginate hydrogel kinetics produced characteristic peak rate: $13.27\%/\text{hr}$ and $T_{50} = 10.0\text{ h}$. | **PASS** |
| **SCI-013** | ML Predictor Determinism | Random Forest regressor must yield deterministic predictions given identical inputs. | 20 consecutive inference runs yielded identical **7.40%** predictions. | **PASS** |

---

## 3. Important Scientific Caveat & Research Integrity Statement

> [!IMPORTANT]
> **Experimental Data Disclaimer:**  
> The Higuchi and Korsmeyer-Peppas models implemented in BioPatch AI are **mathematical in-silico simulations**. While mathematically consistent, monotonic, and mass-conserved, **they have not been cross-validated against in-vivo human clinical trials or a specific peer-reviewed wet-lab transdermal release dataset**.  
> The predicted values represent **pre-clinical computational approximations** and must **not** be interpreted as clinically certified drug-release predictions for medical diagnosis or patient treatment.

