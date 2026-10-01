import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.database import db
from app.routers import auth, drugs, polymers, simulations, predictions, reports, dashboard
from app.ml.predictor import model, MODEL_PATH

app = FastAPI(title="BioPatch AI Localhost API", version="1.0")

# Setup CORS to allow React Web (5173) and Flutter Mobile
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Seeding demo libraries on database startup into Firestore
def seed_database_libraries():
    # Seeding Drugs
    drugs_ref = db.collection("drugs")
    try:
        docs = list(drugs_ref.limit(1).stream())
        if not docs:
            print("Seeding Firestore reference drug catalog...")
            drugs = [
                {"id": "Metformin", "name": "Metformin", "solubility": 200.0, "molecular_weight": 129.16, "description": "Metformin hydrochloride is a highly water-soluble anti-diabetic biguanide drug."},
                {"id": "Paracetamol", "name": "Paracetamol", "solubility": 14.0, "molecular_weight": 151.16, "description": "Paracetamol (acetaminophen) is a widely used analgesic and antipyretic drug sparingly soluble in water."},
                {"id": "Losartan", "name": "Losartan", "solubility": 3.3, "molecular_weight": 422.9, "description": "Losartan potassium is an angiotensin II receptor antagonist used to treat high blood pressure, hydrophobic with moderate MW."},
                {"id": "Ibuprofen", "name": "Ibuprofen", "solubility": 0.021, "molecular_weight": 206.29, "description": "Ibuprofen is a non-steroidal anti-inflammatory drug (NSAID) with low water solubility."}
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
                {"id": "PLA", "name": "PLA", "type": "Erodible", "biodegradable": True, "ph_response": "Low", "description": "Polylactic acid (PLA) is a biodegradable, hydrophobic thermoplastic aliphatic polyester."},
                {"id": "Alginate", "name": "Alginate", "type": "Hydrogel", "biodegradable": True, "ph_response": "Medium", "description": "Alginate is a natural anionic polysaccharide hydrogel widely used for cell encapsulation and drug delivery."},
                {"id": "Gelatin", "name": "Gelatin", "type": "Swellable Matrix", "biodegradable": True, "ph_response": "High", "description": "Gelatin is a swellable protein matrix obtained from collagen hydrolysate, highly temperature sensitive."},
                {"id": "Pectin", "name": "Pectin", "type": "Swellable Matrix", "biodegradable": True, "ph_response": "Medium", "description": "Pectin is a structural heteropolysaccharide polymer, moderately swellable and slightly pH responsive."},
                {"id": "Cellulose", "name": "Cellulose", "type": "Inert Matrix", "biodegradable": True, "ph_response": "Low", "description": "Cellulose is an inert structural polysaccharide, biocompatible with low swelling indexes."},
                {"id": "Chitosan", "name": "Chitosan", "type": "Hydrogel", "biodegradable": True, "ph_response": "High", "description": "Chitosan is a cationic biopolymer matrix swellable in acidic pH media."}
            ]
            for poly in polymers:
                polymers_ref.document(poly["id"]).set(poly)
    except Exception as e:
        print(f"Warning: Failed to seed Firestore polymers library: {e}")

# Database and Seed tables initialization on startup
@app.on_event("startup")
def on_startup():
    seed_database_libraries()

# Router Registrations
app.include_router(auth.router)
app.include_router(drugs.router)
app.include_router(polymers.router)
app.include_router(simulations.router)
app.include_router(predictions.router)
app.include_router(reports.router)
app.include_router(dashboard.router)

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

    return {
        "status": "ok" if db_connected else "error",
        "database": "connected" if db_connected else "disconnected",
        "model": "loaded" if model_loaded else "unavailable"
    }
