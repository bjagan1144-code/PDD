import uuid
import datetime
from fastapi import APIRouter, Depends, HTTPException, status
from typing import List
from app.database import db
from app.schemas.api_schemas import ReportResponse
from app.routers.auth import get_current_user

router = APIRouter(prefix="/api/reports", tags=["Reports"])

@router.get("", response_model=List[ReportResponse])
def get_reports(
    current_user: dict = Depends(get_current_user)
):
    """ Returns the list of compiled simulation reports for the authenticated user from Firestore """
    try:
        reports_ref = db.collection("reports")
        docs = reports_ref.where("user_id", "==", current_user["id"]).stream()
        
        reports_list = []
        for doc in docs:
            reports_list.append(doc.to_dict())
            
        # Sort in memory by created_at descending
        reports_list.sort(key=lambda r: r.get("created_at", ""), reverse=True)
        
        response_list = []
        for r in reports_list:
            sim_doc = db.collection("simulations").document(r["simulation_id"]).get()
            if not sim_doc.exists:
                continue
            sim = sim_doc.to_dict()
            
            summary_str = f"Release: {sim['predicted_release']}%, Duration: {sim['duration']}h, Simulation Risk Indicator: {sim['simulation_risk_indicator']}"
            
            created_at_str = r.get("created_at", "")
            try:
                dt = datetime.datetime.fromisoformat(created_at_str)
                date_str = dt.strftime("%Y-%m-%d %H:%M")
            except:
                date_str = created_at_str
                
            response_list.append({
                "id": r["id"],
                "simulationId": r["simulation_id"],
                "drugName": sim["drug_id"],
                "polymerName": sim["polymer_id"],
                "summary": summary_str,
                "date": date_str
            })
        return response_list
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to retrieve reports: {e}")

@router.post("", response_model=ReportResponse)
def generate_report(
    req: dict, # Expects {"simulationId": "..."}
    current_user: dict = Depends(get_current_user)
):
    """ Compiles and saves a pre-clinical simulation report for history archives in Firestore """
    sim_id = req.get("simulationId")
    if not sim_id:
        raise HTTPException(status_code=400, detail="simulationId is required")
        
    try:
        sim_doc = db.collection("simulations").document(sim_id).get()
        if not sim_doc.exists:
            raise HTTPException(status_code=404, detail="Simulation run not found")
            
        sim = sim_doc.to_dict()
        if sim["user_id"] != current_user["id"]:
            raise HTTPException(status_code=403, detail="Not authorized to run report on this simulation")

        # Check if report already exists for this simulation
        reports_ref = db.collection("reports")
        existing_query = reports_ref.where("simulation_id", "==", sim_id).limit(1).stream()
        existing_docs = list(existing_query)
        
        if existing_docs:
            existing = existing_docs[0].to_dict()
            created_at_str = existing.get("created_at", "")
            try:
                dt = datetime.datetime.fromisoformat(created_at_str)
                date_str = dt.strftime("%Y-%m-%d %H:%M")
            except:
                date_str = created_at_str
                
            summary_str = f"Release: {sim['predicted_release']}%, Duration: {sim['duration']}h, Simulation Risk Indicator: {sim['simulation_risk_indicator']}"
            return {
                "id": existing["id"],
                "simulationId": existing["simulation_id"],
                "drugName": sim["drug_id"],
                "polymerName": sim["polymer_id"],
                "summary": summary_str,
                "date": date_str
            }

        rep_id = f"REP-{uuid.uuid4().hex[:6].upper()}"
        now_str = datetime.datetime.utcnow().isoformat()
        new_report = {
            "id": rep_id,
            "user_id": current_user["id"],
            "simulation_id": sim_id,
            "report_type": "PDF",
            "created_at": now_str
        }
        reports_ref.document(rep_id).set(new_report)

        try:
            dt = datetime.datetime.fromisoformat(now_str)
            date_str = dt.strftime("%Y-%m-%d %H:%M")
        except:
            date_str = now_str
            
        summary_str = f"Release: {sim['predicted_release']}%, Duration: {sim['duration']}h, Simulation Risk Indicator: {sim['simulation_risk_indicator']}"
        
        return {
            "id": rep_id,
            "simulationId": sim_id,
            "drugName": sim["drug_id"],
            "polymerName": sim["polymer_id"],
            "summary": summary_str,
            "date": date_str
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to generate report: {e}")

@router.delete("/{id}")
def delete_report(
    id: str,
    current_user: dict = Depends(get_current_user)
):
    """ Deletes a report file log from Firestore archives """
    try:
        doc_ref = db.collection("reports").document(id)
        doc = doc_ref.get()
        if not doc.exists:
            raise HTTPException(status_code=404, detail="Report not found")
            
        report = doc.to_dict()
        if report["user_id"] != current_user["id"]:
            raise HTTPException(status_code=403, detail="Not authorized to delete this report")
            
        doc_ref.delete()
        return {"message": "Report deleted successfully"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to delete report: {e}")
