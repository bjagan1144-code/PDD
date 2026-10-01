from pydantic import BaseModel, EmailStr, Field
from typing import List, Optional
from datetime import datetime

# --- AUTH SCHEMAS ---
class UserRegister(BaseModel):
    name: str = Field(..., min_length=1)
    email: EmailStr
    password: str = Field(..., min_length=6)
    role: str = Field("Researcher")

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserResponse(BaseModel):
    id: str
    name: str
    email: EmailStr
    role: str
    created_at: datetime

    class Config:
        from_attributes = True

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    email: Optional[str] = None


# --- DRUG & POLYMER SCHEMAS ---
class DrugResponse(BaseModel):
    id: str
    name: str
    description: Optional[str] = None
    solubility: float
    molecular_weight: float

    class Config:
        from_attributes = True

class PolymerResponse(BaseModel):
    id: str
    name: str
    description: Optional[str] = None
    type: str
    biodegradable: bool
    ph_response: Optional[str] = None

    class Config:
        from_attributes = True


# --- SIMULATION SCHEMAS ---
class SimulationRunRequest(BaseModel):
    drugName: str
    polymerName: str
    drugLoading: float = Field(..., gt=0)
    polymerConcentration: float = Field(..., gt=0)
    patchThickness: float = Field(..., gt=0)
    temperature: float = Field(..., ge=10, le=60)
    pH: float = Field(..., ge=0, le=14)
    moisture: float = Field(..., ge=0, le=100)
    duration: float = Field(..., gt=0)

class ReleaseCurvePoint(BaseModel):
    time: float
    predicted: float
    target: float

class SimulationResponse(BaseModel):
    id: str
    drugName: str
    polymerName: str
    drugLoading: float
    polymerConcentration: float
    patchThickness: float
    temperature: float
    pH: float
    moisture: float
    duration: float
    predictedRelease: float
    peakReleaseRate: float
    timeTo50Percent: str
    estimatedDuration: str
    controlledReleaseScore: int
    riskLevel: str
    analysis: str
    releaseCurve: List[ReleaseCurvePoint]

    class Config:
        from_attributes = True


# --- REPORT SCHEMAS ---
class ReportResponse(BaseModel):
    id: str
    simulationId: str
    drugName: str
    polymerName: str
    summary: str
    date: str

    class Config:
        from_attributes = True
