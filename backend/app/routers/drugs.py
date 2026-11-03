import time
import uuid
from fastapi import APIRouter, Depends, HTTPException
from typing import List
from app.database import db
from app.schemas.api_schemas import DrugResponse

router = APIRouter(prefix="/api/drugs", tags=["Drug Library"])

# In-memory TTL Cache
_DRUGS_CACHE = None
_DRUGS_CACHE_TIME = 0.0
CACHE_TTL_SEC = 300.0  # 5 minutes

DEFAULT_DRUGS_FALLBACK = [
    {"id": "Metformin", "name": "Metformin", "solubility": 200.0, "molecular_weight": 129.16, "molecularWeight": 129.16, "category": "Antidiabetic", "halfLife": "6.2 hours", "status": "Completed", "description": "Metformin hydrochloride is a highly water-soluble anti-diabetic biguanide drug."},
    {"id": "Paracetamol", "name": "Paracetamol", "solubility": 14.0, "molecular_weight": 151.16, "molecularWeight": 151.16, "category": "Analgesic / Antipyretic", "halfLife": "2.5 hours", "status": "Completed", "description": "Paracetamol (acetaminophen) is a widely used analgesic and antipyretic drug sparingly soluble in water."},
    {"id": "Losartan", "name": "Losartan", "solubility": 3.3, "molecular_weight": 422.9, "molecularWeight": 422.9, "category": "Antihypertensive", "halfLife": "2.0 hours", "status": "Completed", "description": "Losartan potassium is an angiotensin II receptor antagonist used to treat high blood pressure, hydrophobic with moderate MW."},
    {"id": "Ibuprofen", "name": "Ibuprofen", "solubility": 0.021, "molecular_weight": 206.29, "molecularWeight": 206.29, "category": "NSAID / Anti-inflammatory", "halfLife": "2.0 hours", "status": "Completed", "description": "Ibuprofen is a non-steroidal anti-inflammatory drug (NSAID) with low water solubility."}
]

def _enrich_drug(d: dict) -> dict:
    item = dict(d)
    if "molecularWeight" not in item and "molecular_weight" in item:
        item["molecularWeight"] = item["molecular_weight"]
    if "molecular_weight" not in item and "molecularWeight" in item:
        item["molecular_weight"] = item["molecularWeight"]
    item.setdefault("category", "General Active")
    item.setdefault("halfLife", "N/A")
    item.setdefault("status", "Completed")
    return item

@router.get("", response_model=List[DrugResponse])
def get_drugs():
    """ Returns the list of standard drugs in the research database with in-memory caching """
    global _DRUGS_CACHE, _DRUGS_CACHE_TIME
    now = time.time()
    if _DRUGS_CACHE is not None and (now - _DRUGS_CACHE_TIME) < CACHE_TTL_SEC:
        return _DRUGS_CACHE

    try:
        drugs_ref = db.collection("drugs")
        docs = drugs_ref.stream()
        drugs_list = []
        for doc in docs:
            drugs_list.append(_enrich_drug(doc.to_dict()))
        
        if drugs_list:
            _DRUGS_CACHE = drugs_list
            _DRUGS_CACHE_TIME = now
            return _DRUGS_CACHE
    except Exception as e:
        print(f"Warning: Firestore drugs query encountered: {e}")
        if _DRUGS_CACHE is not None:
            return _DRUGS_CACHE
        # Graceful fallback to default reference catalog if Firestore quota exceeded
        return [_enrich_drug(d) for d in DEFAULT_DRUGS_FALLBACK]

    return [_enrich_drug(d) for d in DEFAULT_DRUGS_FALLBACK]


@router.get("/{id}")
def get_drug(id: str):
    """ Retrieves standard parameters for a specific drug molecule """
    try:
        doc = db.collection("drugs").document(id).get()
        if not doc.exists:
            # Fallback search by name
            query = db.collection("drugs").where("name", "==", id).get()
            if query:
                d = query[0].to_dict()
            else:
                raise HTTPException(status_code=404, detail="Drug not found")
        else:
            d = doc.to_dict()
        if "molecularWeight" not in d and "molecular_weight" in d:
            d["molecularWeight"] = d["molecular_weight"]
        if "molecular_weight" not in d and "molecularWeight" in d:
            d["molecular_weight"] = d["molecularWeight"]
        d.setdefault("category", "General Active")
        d.setdefault("halfLife", "N/A")
        d.setdefault("status", "Completed")
        return d
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database query failure: {e}")

@router.post("")
def add_drug(drug_data: dict):
    """ Creates or registers a new active drug compound in Firestore """
    drug_id = drug_data.get("id") or drug_data.get("name") or f"drug-{uuid.uuid4().hex[:6]}"
    drug_record = {
        "id": drug_id,
        "name": drug_data.get("name", drug_id),
        "category": drug_data.get("category", "General Active"),
        "solubility": float(drug_data.get("solubility") or 10.0) if str(drug_data.get("solubility", "")).replace(".","").isdigit() else 10.0,
        "molecular_weight": float(drug_data.get("molecularWeight") or drug_data.get("molecular_weight") or 200.0),
        "molecularWeight": float(drug_data.get("molecularWeight") or drug_data.get("molecular_weight") or 200.0),
        "halfLife": drug_data.get("halfLife", "N/A"),
        "description": drug_data.get("description", "Standard active drug molecule.")
    }
    try:
        db.collection("drugs").document(drug_id).set(drug_record)
        return drug_record
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to add drug: {e}")

@router.put("/{id}")
def update_drug(id: str, drug_data: dict):
    """ Updates parameters for an active drug compound in Firestore """
    try:
        doc_ref = db.collection("drugs").document(id)
        doc = doc_ref.get()
        if not doc.exists:
            # Fallback: search by name
            q = db.collection("drugs").where("name", "==", id).get()
            if q:
                doc_ref = db.collection("drugs").document(q[0].id)
            else:
                raise HTTPException(status_code=404, detail="Drug not found")
        
        current = doc_ref.get().to_dict() or {}
        current.update(drug_data)
        doc_ref.set(current)
        return current
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to update drug: {e}")

@router.delete("/{id}")
def delete_drug(id: str):
    """ Deletes a drug entry from Firestore """
    try:
        doc_ref = db.collection("drugs").document(id)
        doc = doc_ref.get()
        if not doc.exists:
            q = db.collection("drugs").where("name", "==", id).get()
            if q:
                doc_ref = db.collection("drugs").document(q[0].id)
            else:
                raise HTTPException(status_code=404, detail="Drug not found")
        doc_ref.delete()
        return {"message": "Drug deleted successfully"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to delete drug: {e}")
