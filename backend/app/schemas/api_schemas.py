from pydantic import BaseModel, EmailStr, Field, ConfigDict
from typing import List, Optional, Union
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
    created_at: Union[datetime, str]

    model_config = ConfigDict(from_attributes=True)

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
    solubility: Union[float, str]
    molecular_weight: Optional[float] = None
    molecularWeight: Optional[float] = None
    category: Optional[str] = "General Active"
    halfLife: Optional[str] = "N/A"
    status: Optional[str] = "Completed"

    model_config = ConfigDict(from_attributes=True)

class PolymerResponse(BaseModel):
    id: str
    name: str
    description: Optional[str] = None
    type: str
    biodegradable: bool
    ph_response: Optional[str] = None
    phResponse: Optional[str] = None
    concentrationRange: Optional[str] = "1.0% - 5.0%"
    releaseBehavior: Optional[str] = "Sustained matrix erosion diffusion."
    swellingRatio: Optional[str] = "200%"
    degradationRate: Optional[str] = "14-30 days"

    model_config = ConfigDict(from_attributes=True)


# --- SIMULATION SCHEMAS ---
class SimulationRunRequest(BaseModel):
    drugName: str
    polymerName: str
    drugLoading: float = Field(..., ge=0)
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
    releasedMg: Optional[float] = None
    remainingMg: Optional[float] = None

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
    releasedAmountMg: Optional[float] = None
    remainingDrugMg: Optional[float] = None
    date: Optional[str] = None
    created_at: Optional[str] = None
    createdAt: Optional[str] = None
    releaseCurve: List[ReleaseCurvePoint]

    model_config = ConfigDict(from_attributes=True)


# --- REPORT SCHEMAS ---
class ReportResponse(BaseModel):
    id: str
    simulationId: str
    drugName: str
    polymerName: str
    summary: str
    date: str

    model_config = ConfigDict(from_attributes=True)
