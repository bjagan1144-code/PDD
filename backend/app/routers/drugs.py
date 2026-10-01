from fastapi import APIRouter, Depends, HTTPException
from typing import List
from app.database import db
from app.schemas.api_schemas import DrugResponse

router = APIRouter(prefix="/api/drugs", tags=["Drug Library"])

@router.get("", response_model=List[DrugResponse])
def get_drugs():
    """ Returns the list of standard drugs in the research database """
    drugs_ref = db.collection("drugs")
    try:
        docs = drugs_ref.stream()
        drugs_list = []
        for doc in docs:
            drugs_list.append(doc.to_dict())
        return drugs_list
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database query failure: {e}")

@router.get("/{id}", response_model=DrugResponse)
def get_drug(id: str):
    """ Retrieves standard parameters for a specific drug molecule """
    try:
        doc = db.collection("drugs").document(id).get()
        if not doc.exists:
            raise HTTPException(status_code=404, detail="Drug not found")
        return doc.to_dict()
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database query failure: {e}")
