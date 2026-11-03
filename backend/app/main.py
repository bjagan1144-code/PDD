import os
from contextlib import asynccontextmanager
from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware

from app.database import db
from app.routers import auth, drugs, polymers, simulations, predictions, reports, dashboard
from app.ml.predictor import model, MODEL_PATH
from app.services.auth_service import hash_password

# Seeding demo libraries on database startup into Firestore
def seed_database_libraries():
    # Seeding Drugs
    drugs_ref = db.collection("drugs")
    try:
        docs = list(drugs_ref.limit(1).stream())
        if not docs:
            print("Seeding Firestore reference drug catalog...")
            drugs = [
                {"id": "Metformin", "name": "Metformin", "solubility": 200.0, "molecular_weight": 129.16, "molecularWeight": 129.16, "category": "Antidiabetic", "halfLife": "6.2 hours", "status": "Completed", "description": "Metformin hydrochloride is a highly water-soluble anti-diabetic biguanide drug."},
                {"id": "Paracetamol", "name": "Paracetamol", "solubility": 14.0, "molecular_weight": 151.16, "molecularWeight": 151.16, "category": "Analgesic / Antipyretic", "halfLife": "2.5 hours", "status": "Completed", "description": "Paracetamol (acetaminophen) is a widely used analgesic and antipyretic drug sparingly soluble in water."},
                {"id": "Losartan", "name": "Losartan", "solubility": 3.3, "molecular_weight": 422.9, "molecularWeight": 422.9, "category": "Antihypertensive", "halfLife": "2.0 hours", "status": "Completed", "description": "Losartan potassium is an angiotensin II receptor antagonist used to treat high blood pressure, hydrophobic with moderate MW."},
                {"id": "Ibuprofen", "name": "Ibuprofen", "solubility": 0.021, "molecular_weight": 206.29, "molecularWeight": 206.29, "category": "NSAID / Anti-inflammatory", "halfLife": "2.0 hours", "status": "Completed", "description": "Ibuprofen is a non-steroidal anti-inflammatory drug (NSAID) with low water solubility."}
            ]
            for drug in drugs:
                drugs_ref.document(drug["id"]).set(drug)
    except Exception as e:
        print(f"Warning: Failed to seed Firestore drugs library: {e}")

    # Seeding Polymers
    polymers_ref = db.collection("polymers")
    try:
        docs = list(polymers_ref.limit(1).stream())
        if not docs:
            print("Seeding Firestore reference biopolymer matrix catalog...")
            polymers = [
                {"id": "PLA", "name": "PLA", "type": "Erodible", "biodegradable": True, "ph_response": "Low", "concentrationRange": "2.0% - 15.0%", "releaseBehavior": "Hydrophobic bulk erosion (slow diffusion)", "swellingRatio": "< 10%", "degradationRate": "1-2 years", "description": "Polylactic acid (PLA) is a biodegradable, hydrophobic thermoplastic aliphatic polyester."},
                {"id": "Alginate", "name": "Alginate", "type": "Hydrogel", "biodegradable": True, "ph_response": "Medium", "concentrationRange": "1.0% - 4.0%", "releaseBehavior": "Swellable cross-linked hydrogel matrix", "swellingRatio": "350%", "degradationRate": "30-60 days", "description": "Alginate is a natural anionic polysaccharide hydrogel widely used for cell encapsulation and drug delivery."},
                {"id": "Gelatin", "name": "Gelatin", "type": "Swellable Matrix", "biodegradable": True, "ph_response": "High", "concentrationRange": "2.0% - 10.0%", "releaseBehavior": "Thermal-sensitive rapid dissolution matrix", "swellingRatio": "400%", "degradationRate": "7-14 days", "description": "Gelatin is a swellable protein matrix obtained from collagen hydrolysate, highly temperature sensitive."},
                {"id": "Pectin", "name": "Pectin", "type": "Swellable Matrix", "biodegradable": True, "ph_response": "Medium", "concentrationRange": "1.5% - 5.0%", "releaseBehavior": "pH-responsive matrix swelling & erosion", "swellingRatio": "250%", "degradationRate": "21-45 days", "description": "Pectin is a structural heteropolysaccharide polymer, moderately swellable and slightly pH responsive."},
                {"id": "Cellulose", "name": "Cellulose", "type": "Inert Matrix", "biodegradable": True, "ph_response": "Low", "concentrationRange": "1.0% - 5.0%", "releaseBehavior": "Inert biocompatible non-swelling barrier", "swellingRatio": "15%", "degradationRate": "6-12 months", "description": "Cellulose is an inert structural polysaccharide, biocompatible with low swelling indexes."},
                {"id": "Chitosan", "name": "Chitosan", "type": "Hydrogel", "biodegradable": True, "ph_response": "High", "concentrationRange": "1.0% - 5.0%", "releaseBehavior": "Cationic acid-swelling sustained diffusion", "swellingRatio": "300%", "degradationRate": "14-30 days", "description": "Chitosan is a cationic biopolymer matrix swellable in acidic pH media."}
            ]
            for poly in polymers:
                polymers_ref.document(poly["id"]).set(poly)
    except Exception as e:
        print(f"Warning: Failed to seed Firestore polymers library: {e}")

    # Seeding Default Users with Hashed Passwords
    users_ref = db.collection("users")
    try:
        hashed_pw = hash_password("password")
        default_users = [
            {
                "id": "mock-uid-researcher",
                "name": "Dr. Sarah Carter",
                "email": "researcher@biopatch.ai",
                "password": hashed_pw,
                "role": "Principal Investigator",
                "created_at": "2026-08-20T00:00:00"
            },
            {
                "id": "mock-uid-demo.researcher",
                "name": "Dr. Sarah Carter",
                "email": "demo.researcher@biopatch.ai",
                "password": hashed_pw,
                "role": "Principal Investigator",
                "created_at": "2026-08-20T00:00:00"
            }
        ]
        for u in default_users:
            doc = users_ref.document(u["id"]).get()
            if not doc.exists:
                users_ref.document(u["id"]).set(u)
            else:
                existing = doc.to_dict()
                if not existing.get("password"):
                    existing["password"] = hashed_pw
                    users_ref.document(u["id"]).set(existing)
    except Exception as e:
        print(f"Warning: Failed to seed default users: {e}")

@asynccontextmanager
async def lifespan(app: FastAPI):
    seed_database_libraries()
    yield

app = FastAPI(title="BioPatch AI Localhost API", version="1.0", lifespan=lifespan)

# Setup CORS to allow React Web (5173) and Flutter Mobile
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

from app.schemas.api_schemas import SimulationRunRequest, SimulationResponse
from app.routers.simulations import run_simulation
from app.routers.auth import get_current_user

# Router Registrations
app.include_router(auth.router)
app.include_router(drugs.router)
app.include_router(polymers.router)
app.include_router(simulations.router)
app.include_router(predictions.router)
app.include_router(reports.router)
app.include_router(dashboard.router)

@app.post("/api/simulate", response_model=SimulationResponse, tags=["Simulations"])
@app.post("/api/simulate/", response_model=SimulationResponse, tags=["Simulations"])
def simulate_endpoint(
    req: SimulationRunRequest,
    current_user: dict = Depends(get_current_user)
):
    """ Direct alias endpoint for POST /api/simulate """
    return run_simulation(req, current_user)

@app.get("/health")
@app.get("/api/health")
def health_check():
    """ Health verification endpoint checking Cloud Firestore & RandomForest ML model status """
    # Verify Firestore connectivity
    db_connected = False
    try:
        # Check if we can stream the drugs collection (minimal read)
        db.collection("drugs").limit(1).get()
        db_connected = True
    except Exception as e:
        print(f"Health Firestore check failure: {e}")

    # Verify AI model file presence
    model_loaded = model is not None and os.path.exists(MODEL_PATH)
    storage_mode = getattr(db, "storage_mode", "mock_firestore")

    return {
        "status": "ok" if db_connected else "error",
        "database": "connected" if db_connected else "disconnected",
        "storage_mode": storage_mode,
        "is_mock_storage": (storage_mode == "mock_firestore"),
        "model": "loaded" if model_loaded else "unavailable"
    }
