from fastapi import APIRouter, Depends, HTTPException
from typing import List
from app.database import db
from app.schemas.api_schemas import PolymerResponse

router = APIRouter(prefix="/api/polymers", tags=["Polymer Library"])

@router.get("", response_model=List[PolymerResponse])
def get_polymers():
    """ Returns the list of standard biopolymer carriers in the database """
    polymers_ref = db.collection("polymers")
    try:
        docs = polymers_ref.stream()
        polymers_list = []
        for doc in docs:
            polymers_list.append(doc.to_dict())
        return polymers_list
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database query failure: {e}")

@router.get("/{id}", response_model=PolymerResponse)
def get_polymer(id: str):
    """ Retrieves standard parameters for a specific biopolymer carrier """
    try:
        doc = db.collection("polymers").document(id).get()
        if not doc.exists:
            raise HTTPException(status_code=404, detail="Polymer not found")
        return doc.to_dict()
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database query failure: {e}")
