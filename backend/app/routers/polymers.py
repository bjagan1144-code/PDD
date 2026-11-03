import uuid
from fastapi import APIRouter, Depends, HTTPException
from typing import List
from app.database import db
from app.schemas.api_schemas import PolymerResponse

router = APIRouter(prefix="/api/polymers", tags=["Polymer Library"])

POLYMER_METADATA_DEFAULTS = {
    "PLA": {
        "releaseBehavior": "Hydrophobic bulk erosion (slow diffusion)",
        "swellingRatio": "< 10%",
        "degradationRate": "1-2 years",
        "concentrationRange": "2.0% - 15.0%"
    },
    "Alginate": {
        "releaseBehavior": "Swellable cross-linked hydrogel matrix",
        "swellingRatio": "350%",
        "degradationRate": "30-60 days",
        "concentrationRange": "1.0% - 4.0%"
    },
    "Gelatin": {
        "releaseBehavior": "Thermal-sensitive rapid dissolution matrix",
        "swellingRatio": "400%",
        "degradationRate": "7-14 days",
        "concentrationRange": "2.0% - 10.0%"
    },
    "Pectin": {
        "releaseBehavior": "pH-responsive matrix swelling & erosion",
        "swellingRatio": "250%",
        "degradationRate": "21-45 days",
        "concentrationRange": "1.5% - 5.0%"
    },
    "Cellulose": {
        "releaseBehavior": "Inert biocompatible non-swelling barrier",
        "swellingRatio": "15%",
        "degradationRate": "6-12 months",
        "concentrationRange": "1.0% - 5.0%"
    },
    "Chitosan": {
        "releaseBehavior": "Cationic acid-swelling sustained diffusion",
        "swellingRatio": "300%",
        "degradationRate": "14-30 days",
        "concentrationRange": "1.0% - 5.0%"
    }
}

def _enrich_polymer(poly: dict) -> dict:
    d = dict(poly)
    name = d.get("name", "")
    defaults = POLYMER_METADATA_DEFAULTS.get(name, {})
    for k, v in defaults.items():
        d.setdefault(k, v)
    d.setdefault("ph_response", d.get("phResponse", "Medium"))
    d.setdefault("phResponse", d.get("ph_response", "Medium"))
    d.setdefault("releaseBehavior", d.get("description", "Sustained matrix diffusion."))
    d.setdefault("swellingRatio", "200%")
    d.setdefault("degradationRate", "14-30 days")
    d.setdefault("concentrationRange", "1.0% - 5.0%")
    return d

@router.get("", response_model=List[PolymerResponse])
def get_polymers():
    """ Returns the list of standard biopolymer carriers in the database """
    polymers_ref = db.collection("polymers")
    try:
        docs = polymers_ref.stream()
        polymers_list = []
        for doc in docs:
            polymers_list.append(_enrich_polymer(doc.to_dict()))
        return polymers_list
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database query failure: {e}")

@router.get("/{id}")
def get_polymer(id: str):
    """ Retrieves standard parameters for a specific biopolymer carrier """
    try:
        doc = db.collection("polymers").document(id).get()
        if not doc.exists:
            q = db.collection("polymers").where("name", "==", id).get()
            if q:
                return _enrich_polymer(q[0].to_dict())
            raise HTTPException(status_code=404, detail="Polymer not found")
        return _enrich_polymer(doc.to_dict())
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database query failure: {e}")

@router.post("")
def add_polymer(poly_data: dict):
    """ Creates or registers a new biopolymer matrix in Firestore """
    poly_id = poly_data.get("id") or poly_data.get("name") or f"poly-{uuid.uuid4().hex[:6]}"
    poly_record = {
        "id": poly_id,
        "name": poly_data.get("name", poly_id),
        "type": poly_data.get("type", "Hydrogel"),
        "biodegradable": bool(poly_data.get("biodegradable", True)),
        "ph_response": poly_data.get("ph_response") or poly_data.get("phResponse") or "Medium",
        "concentrationRange": poly_data.get("concentrationRange", "1.0% - 5.0%"),
        "releaseBehavior": poly_data.get("releaseBehavior") or poly_data.get("description") or "Sustained matrix erosion diffusion.",
        "swellingRatio": poly_data.get("swellingRatio", "200%"),
        "degradationRate": poly_data.get("degradationRate", "14-30 days"),
        "description": poly_data.get("description") or poly_data.get("releaseBehavior") or "Biopolymer matrix carrier."
    }
    try:
        db.collection("polymers").document(poly_id).set(poly_record)
        return poly_record
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to add polymer: {e}")

@router.put("/{id}")
def update_polymer(id: str, poly_data: dict):
    """ Updates parameters for a biopolymer carrier in Firestore """
    try:
        doc_ref = db.collection("polymers").document(id)
        doc = doc_ref.get()
        if not doc.exists:
            q = db.collection("polymers").where("name", "==", id).get()
            if q:
                doc_ref = db.collection("polymers").document(q[0].id)
            else:
                raise HTTPException(status_code=404, detail="Polymer not found")
                
        current = doc_ref.get().to_dict() or {}
        current.update(poly_data)
        doc_ref.set(current)
        return current
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to update polymer: {e}")

@router.delete("/{id}")
def delete_polymer(id: str):
    """ Deletes a polymer entry from Firestore """
    try:
        doc_ref = db.collection("polymers").document(id)
        doc = doc_ref.get()
        if not doc.exists:
            q = db.collection("polymers").where("name", "==", id).get()
            if q:
                doc_ref = db.collection("polymers").document(q[0].id)
            else:
                raise HTTPException(status_code=404, detail="Polymer not found")
        doc_ref.delete()
        return {"message": "Polymer deleted successfully"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to delete polymer: {e}")
