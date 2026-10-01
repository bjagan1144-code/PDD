import uuid
import datetime
from fastapi import APIRouter, Depends, HTTPException, status
from typing import List
from app.database import db
from app.schemas.api_schemas import SimulationRunRequest, SimulationResponse
from app.routers.auth import get_current_user
from app.simulation.engine import simulate_release
from app.ml.predictor import run_ai_prediction

router = APIRouter(prefix="/api/simulations", tags=["Simulations"])

@router.post("/run", response_model=SimulationResponse)
def run_simulation(
    req: SimulationRunRequest,
    current_user: dict = Depends(get_current_user)
):
    """
    Runs kinetics mathematical engine & ML inference, saves simulation results to Firestore,
    and returns curve coordinates and metrics.
    """
    params = {
        "drugName": req.drugName,
        "polymerName": req.polymerName,
        "drugLoading": req.drugLoading,
        "polymerConcentration": req.polymerConcentration,
        "patchThickness": req.patchThickness,
        "temperature": req.temperature,
        "pH": req.pH,
        "moisture": req.moisture,
        "duration": req.duration
    }

    try:
        # 1. Run physical kinetics calculations
        result = simulate_release(params)
        
        # 2. Run AI Random Forest Regression
        ai_release_pred = run_ai_prediction(params)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Calculation engine failed: {e}")

    # Generate a unique simulation ID
    sim_id = f"sim-{uuid.uuid4().hex[:6]}"
    now_str = datetime.datetime.utcnow().isoformat()

    # Save simulation configuration and outputs to Firestore simulations collection
    sim_data = {
        "id": sim_id,
        "user_id": current_user["id"],
        "drug_id": req.drugName,
        "polymer_id": req.polymerName,
        "drug_loading": req.drugLoading,
        "polymer_concentration": req.polymerConcentration,
        "patch_thickness": req.patchThickness,
        "temperature": req.temperature,
        "ph": req.pH,
        "moisture": req.moisture,
        "duration": req.duration,
        "predicted_release": result["predictedRelease"],
        "peak_release_rate": result["peakReleaseRate"],
        "time_to_50_percent": result["timeTo50Percent"],
        "controlled_release_score": result["controlledReleaseScore"],
        "simulation_risk_indicator": result["riskLevel"],
        "created_at": now_str
    }
    
    try:
        db.collection("simulations").document(sim_id).set(sim_data)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to persist simulation run: {e}")

    # Save associated AI prediction model metadata to predictions collection
    pred_id = f"pred-{uuid.uuid4().hex[:6]}"
    pred_data = {
        "id": pred_id,
        "simulation_id": sim_id,
        "model_name": "Random Forest Regression",
        "model_version": "1.0",
        "prediction": ai_release_pred,
        "created_at": now_str
    }
    
    try:
        db.collection("predictions").document(pred_id).set(pred_data)
    except Exception as e:
        print(f"Warning: Failed to log prediction metadata: {e}")

    # Format output curve array
    curve_points = [
        {"time": float(pt["time"]), "predicted": float(pt["predicted"]), "target": float(pt["target"])}
        for pt in result["releaseCurve"]
    ]

    return {
        "id": sim_id,
        "drugName": req.drugName,
        "polymerName": req.polymerName,
        "drugLoading": req.drugLoading,
        "polymerConcentration": req.polymerConcentration,
        "patchThickness": req.patchThickness,
        "temperature": req.temperature,
        "pH": req.pH,
        "moisture": req.moisture,
        "duration": req.duration,
        "predictedRelease": result["predictedRelease"],
        "peakReleaseRate": result["peakReleaseRate"],
        "timeTo50Percent": result["timeTo50Percent"],
        "estimatedDuration": result["estimatedDuration"],
        "controlledReleaseScore": result["controlledReleaseScore"],
        "riskLevel": result["riskLevel"],
        "analysis": result["analysis"],
        "releaseCurve": curve_points
    }

@router.get("", response_model=List[SimulationResponse])
def get_simulations_history(
    current_user: dict = Depends(get_current_user)
):
    """ Returns the authenticated user's simulation history list from Firestore """
    try:
        sims_ref = db.collection("simulations")
        docs = sims_ref.where("user_id", "==", current_user["id"]).stream()
        
        simulations = []
        for doc in docs:
            simulations.append(doc.to_dict())
            
        # Sort in memory by created_at descending to avoid composite index requirements
        simulations.sort(key=lambda s: s.get("created_at", ""), reverse=True)
        
        response_list = []
        for sim in simulations:
            params = {
                "drugName": sim["drug_id"],
                "polymerName": sim["polymer_id"],
                "drugLoading": sim["drug_loading"],
                "polymerConcentration": sim["polymer_concentration"],
                "patchThickness": sim["patch_thickness"],
                "temperature": sim["temperature"],
                "pH": sim["ph"],
                "moisture": sim["moisture"],
                "duration": sim["duration"]
            }
            res = simulate_release(params)
            
            response_list.append({
                "id": sim["id"],
                "drugName": sim["drug_id"],
                "polymerName": sim["polymer_id"],
                "drugLoading": sim["drug_loading"],
                "polymerConcentration": sim["polymer_concentration"],
                "patchThickness": sim["patch_thickness"],
                "temperature": sim["temperature"],
                "pH": sim["ph"],
                "moisture": sim["moisture"],
                "duration": sim["duration"],
                "predictedRelease": sim["predicted_release"],
                "peakReleaseRate": sim["peak_release_rate"],
                "timeTo50Percent": sim["time_to_50_percent"],
                "estimatedDuration": f"{sim['duration']} hours",
                "controlledReleaseScore": sim["controlled_release_score"],
                "riskLevel": sim["simulation_risk_indicator"],
                "analysis": res["analysis"],
                "releaseCurve": res["releaseCurve"]
            })
            
        return response_list
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to query simulation history: {e}")

@router.get("/{id}", response_model=SimulationResponse)
def get_simulation(
    id: str,
    current_user: dict = Depends(get_current_user)
):
    """ Retrieves details of a specific simulation run by its ID """
    try:
        doc = db.collection("simulations").document(id).get()
        if not doc.exists:
            raise HTTPException(status_code=404, detail="Simulation run not found")
            
        sim = doc.to_dict()
        if sim["user_id"] != current_user["id"]:
            raise HTTPException(status_code=403, detail="Not authorized to access this simulation run")
            
        params = {
            "drugName": sim["drug_id"],
            "polymerName": sim["polymer_id"],
            "drugLoading": sim["drug_loading"],
            "polymerConcentration": sim["polymer_concentration"],
            "patchThickness": sim["patch_thickness"],
            "temperature": sim["temperature"],
            "pH": sim["ph"],
            "moisture": sim["moisture"],
            "duration": sim["duration"]
        }
        res = simulate_release(params)

        return {
            "id": sim["id"],
            "drugName": sim["drug_id"],
            "polymerName": sim["polymer_id"],
            "drugLoading": sim["drug_loading"],
            "polymerConcentration": sim["polymer_concentration"],
            "patchThickness": sim["patch_thickness"],
            "temperature": sim["temperature"],
            "pH": sim["ph"],
            "moisture": sim["moisture"],
            "duration": sim["duration"],
            "predictedRelease": sim["predicted_release"],
            "peakReleaseRate": sim["peak_release_rate"],
            "timeTo50Percent": sim["time_to_50_percent"],
            "estimatedDuration": f"{sim['duration']} hours",
            "controlledReleaseScore": sim["controlled_release_score"],
            "riskLevel": sim["simulation_risk_indicator"],
            "analysis": res["analysis"],
            "releaseCurve": res["releaseCurve"]
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database query failure: {e}")

@router.delete("/{id}")
def delete_simulation(
    id: str,
    current_user: dict = Depends(get_current_user)
):
    """ Deletes a simulation run from Firestore """
    try:
        doc_ref = db.collection("simulations").document(id)
        doc = doc_ref.get()
        if not doc.exists:
            raise HTTPException(status_code=404, detail="Simulation run not found")
            
        sim = doc.to_dict()
        if sim["user_id"] != current_user["id"]:
            raise HTTPException(status_code=403, detail="Not authorized to delete this simulation run")
            
        doc_ref.delete()
        
        # Clean up associated predictions if any
        preds_ref = db.collection("predictions")
        pred_query = preds_ref.where("simulation_id", "==", id).stream()
        for p_doc in pred_query:
            preds_ref.document(p_doc.id).delete()
            
        # Clean up associated reports if any
        reps_ref = db.collection("reports")
        rep_query = reps_ref.where("simulation_id", "==", id).stream()
        for r_doc in rep_query:
            reps_ref.document(r_doc.id).delete()
            
        return {"message": "Simulation run deleted successfully"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to delete simulation run: {e}")

@router.post("/{id}/rerun", response_model=SimulationResponse)
def rerun_simulation(
    id: str,
    current_user: dict = Depends(get_current_user)
):
    """ Re-runs an existing simulation from the database history """
    try:
        doc = db.collection("simulations").document(id).get()
        if not doc.exists:
            raise HTTPException(status_code=404, detail="Simulation run not found")
            
        sim = doc.to_dict()
        if sim["user_id"] != current_user["id"]:
            raise HTTPException(status_code=403, detail="Not authorized to re-run this simulation")

        req = SimulationRunRequest(
            drugName=sim["drug_id"],
            polymerName=sim["polymer_id"],
            drugLoading=sim["drug_loading"],
            polymerConcentration=sim["polymer_concentration"],
            patchThickness=sim["patch_thickness"],
            temperature=sim["temperature"],
            pH=sim["ph"],
            moisture=sim["moisture"],
            duration=sim["duration"]
        )
        return run_simulation(req, current_user)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to rerun simulation: {e}")
