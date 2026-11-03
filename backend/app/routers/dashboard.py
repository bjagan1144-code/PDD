import os
import datetime
from fastapi import APIRouter, Depends
from app.database import db, MockFirestoreClient
from app.routers.auth import get_current_user
from app.ml.predictor import model, MODEL_PATH
from app.simulation.engine import simulate_release

router = APIRouter(prefix="/api/dashboard", tags=["Dashboard Summary"])

@router.get("", response_model=dict)
@router.get("/", response_model=dict)
@router.get("/summary", response_model=dict)
def get_dashboard_summary(
    current_user: dict = Depends(get_current_user)
):
    """
    Computes user-specific stats (total simulations, avg predicted release %, average
    Controlled Release Score) and lists recent runs alongside model/database health checks using Firestore.
    """
    try:
        sims_ref = db.collection("simulations")
        docs = sims_ref.where("user_id", "==", current_user["id"]).stream()
        
        simulations = []
        for doc in docs:
            simulations.append(doc.to_dict())
            
        # Sort in memory by created_at descending
        simulations.sort(key=lambda s: s.get("created_at", ""), reverse=True)
        
        total = len(simulations)
        avg_release = 0.0
        avg_score = 0
        recent = []
        
        if total > 0:
            avg_release = round(sum(float(s["predicted_release"]) for s in simulations) / total, 1)
            avg_score = int(round(sum(int(s["controlled_release_score"]) for s in simulations) / total))
            
            # Take up to 4 recent simulations with full curves
            for sim in simulations[:4]:
                created_at_str = sim.get("created_at", "")
                try:
                    dt = datetime.datetime.fromisoformat(created_at_str)
                    date_str = dt.strftime("%Y-%m-%d %H:%M")
                except Exception:
                    date_str = sim.get("date") or created_at_str

                # Ensure curve is populated for dashboard graphing
                curve = []
                try:
                    params = {
                        "drugName": sim.get("drug_id", "Ibuprofen"),
                        "polymerName": sim.get("polymer_id", "Chitosan"),
                        "drugLoading": float(sim.get("drug_loading", 50.0)),
                        "polymerConcentration": float(sim.get("polymer_concentration", 3.0)),
                        "patchThickness": float(sim.get("patch_thickness", 1.0)),
                        "temperature": float(sim.get("temperature", 37.0)),
                        "pH": float(sim.get("ph", 7.0)),
                        "moisture": float(sim.get("moisture", 50.0)),
                        "duration": float(sim.get("duration", 24.0))
                    }
                    sim_calc = simulate_release(params)
                    curve = sim_calc["releaseCurve"]
                except Exception:
                    curve = []

                recent.append({
                    "id": sim["id"],
                    "drugName": sim["drug_id"],
                    "polymerName": sim["polymer_id"],
                    "predictedRelease": sim["predicted_release"],
                    "duration": int(sim["duration"]),
                    "riskLevel": sim["simulation_risk_indicator"],
                    "date": date_str,
                    "releaseCurve": curve
                })

        latest_sim = simulations[0] if total > 0 else None
        env_conditions = {
            "temperature": latest_sim["temperature"] if latest_sim else 37.0,
            "pH": latest_sim["ph"] if latest_sim else 6.8,
            "moisture": latest_sim["moisture"] if latest_sim else 50.0,
            "patchThickness": latest_sim["patch_thickness"] if latest_sim else 1.2
        }

        # Verify model file presence
        model_loaded = model is not None and os.path.exists(MODEL_PATH)
        is_mock_db = isinstance(db, MockFirestoreClient)

        return {
            "totalSimulations": total,
            "avgPredictedRelease": f"{avg_release}%",
            "controlledReleaseScore": f"{avg_score}/100",
            "activeAIModel": "Random Forest Regression v1.0",
            "environmentalConditions": env_conditions,
            "recentSimulations": recent,
            "backendStatus": "connected",
            "databaseStatus": "mock_firestore" if is_mock_db else "live_firestore",
            "modelStatus": "loaded" if model_loaded else "unavailable"
        }
    except Exception as e:
        print(f"Dashboard summary calculation error: {e}")
        return {
            "totalSimulations": 0,
            "avgPredictedRelease": "0.0%",
            "controlledReleaseScore": "0/100",
            "activeAIModel": "Random Forest Regression v1.0",
            "environmentalConditions": {
                "temperature": 37.0,
                "pH": 6.8,
                "moisture": 50.0,
                "patchThickness": 1.2
            },
            "recentSimulations": [],
            "backendStatus": "disconnected",
            "modelStatus": "unavailable"
        }
