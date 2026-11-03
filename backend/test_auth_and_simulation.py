import pytest
import math
from fastapi.testclient import TestClient
from app.main import app
from app.simulation.engine import simulate_release

@pytest.fixture
def client():
    with TestClient(app) as c:
        yield c

# =====================================================================
# 1. AUTHENTICATION & AUTHORIZATION TESTS
# =====================================================================

def test_login_wrong_password_rejected(client):
    response = client.post("/api/auth/login", json={
        "email": "researcher@biopatch.ai",
        "password": "wrongpassword123"
    })
    assert response.status_code == 401
    assert "Invalid email or password" in response.json()["detail"]

def test_login_unknown_user_rejected(client):
    response = client.post("/api/auth/login", json={
        "email": "unregistered_stranger@fakebiopatch.com",
        "password": "anypassword"
    })
    assert response.status_code == 401
    assert "Invalid email or password" in response.json()["detail"]

def test_login_seeded_researcher_succeeds(client):
    response = client.post("/api/auth/login", json={
        "email": "researcher@biopatch.ai",
        "password": "password"
    })
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"

def test_login_demo_researcher_succeeds(client):
    response = client.post("/api/auth/login", json={
        "email": "demo.researcher@biopatch.ai",
        "password": "password"
    })
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"

def test_user_registration_and_auth_me(client):
    import uuid
    test_email = f"user_{uuid.uuid4().hex[:8]}@biopatch.ai"
    reg_res = client.post("/api/auth/register", json={
        "name": "Dr. Empirical Test",
        "email": test_email,
        "password": "StrongPassword123!",
        "role": "Lead Scientist"
    })
    assert reg_res.status_code == 200
    assert reg_res.json()["email"] == test_email

    # Duplicate registration rejected
    dup_res = client.post("/api/auth/register", json={
        "name": "Dr. Empirical Test",
        "email": test_email,
        "password": "StrongPassword123!",
        "role": "Lead Scientist"
    })
    assert dup_res.status_code == 400

    # Login with newly registered user
    login_res = client.post("/api/auth/login", json={
        "email": test_email,
        "password": "StrongPassword123!"
    })
    assert login_res.status_code == 200
    token = login_res.json()["access_token"]

    # Access protected profile
    me_res = client.get("/api/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert me_res.status_code == 200
    assert me_res.json()["email"] == test_email
    assert me_res.json()["role"] == "Lead Scientist"

def test_unauthenticated_request_rejected(client):
    res = client.get("/api/auth/me")
    assert res.status_code == 401


# =====================================================================
# 2. SCIENTIFIC SIMULATION TESTS (15 SCENARIOS & INVARIANTS)
# =====================================================================

SCENARIOS = [
    ("1. Standard Baseline", {"drugName": "Ibuprofen", "polymerName": "Chitosan", "drugLoading": 50.0, "polymerConcentration": 3.0, "patchThickness": 1.0, "temperature": 37.0, "pH": 7.4, "moisture": 60.0, "duration": 24.0}),
    ("2. High Solubility", {"drugName": "Metformin", "polymerName": "Alginate", "drugLoading": 80.0, "polymerConcentration": 2.0, "patchThickness": 0.5, "temperature": 37.0, "pH": 6.8, "moisture": 70.0, "duration": 12.0}),
    ("3. Hydrophobic PLA", {"drugName": "Ibuprofen", "polymerName": "PLA", "drugLoading": 30.0, "polymerConcentration": 10.0, "patchThickness": 2.5, "temperature": 37.0, "pH": 7.0, "moisture": 40.0, "duration": 48.0}),
    ("4. Burst Gelatin", {"drugName": "Metformin", "polymerName": "Gelatin", "drugLoading": 100.0, "polymerConcentration": 1.0, "patchThickness": 0.2, "temperature": 42.0, "pH": 7.0, "moisture": 90.0, "duration": 6.0}),
    ("5. Acidic Media", {"drugName": "Paracetamol", "polymerName": "Chitosan", "drugLoading": 40.0, "polymerConcentration": 4.0, "patchThickness": 1.2, "temperature": 37.0, "pH": 2.0, "moisture": 50.0, "duration": 24.0}),
    ("6. Alkaline Media", {"drugName": "Losartan", "polymerName": "Pectin", "drugLoading": 25.0, "polymerConcentration": 5.0, "patchThickness": 1.5, "temperature": 37.0, "pH": 8.5, "moisture": 60.0, "duration": 36.0}),
    ("7. Cold Temp", {"drugName": "Paracetamol", "polymerName": "Cellulose", "drugLoading": 50.0, "polymerConcentration": 3.0, "patchThickness": 1.0, "temperature": 15.0, "pH": 7.0, "moisture": 50.0, "duration": 24.0}),
    ("8. High Temp", {"drugName": "Losartan", "polymerName": "Gelatin", "drugLoading": 60.0, "polymerConcentration": 2.0, "patchThickness": 0.8, "temperature": 55.0, "pH": 7.0, "moisture": 80.0, "duration": 18.0}),
    ("9. Low Moisture", {"drugName": "Ibuprofen", "polymerName": "PLA", "drugLoading": 70.0, "polymerConcentration": 8.0, "patchThickness": 3.0, "temperature": 37.0, "pH": 7.0, "moisture": 5.0, "duration": 48.0}),
    ("10. High Moisture", {"drugName": "Metformin", "polymerName": "Alginate", "drugLoading": 50.0, "polymerConcentration": 2.0, "patchThickness": 0.6, "temperature": 37.0, "pH": 7.0, "moisture": 95.0, "duration": 12.0}),
    ("11. Thin Patch", {"drugName": "Paracetamol", "polymerName": "Chitosan", "drugLoading": 20.0, "polymerConcentration": 1.0, "patchThickness": 0.05, "temperature": 37.0, "pH": 7.0, "moisture": 50.0, "duration": 8.0}),
    ("12. Thick Matrix", {"drugName": "Losartan", "polymerName": "PLA", "drugLoading": 90.0, "polymerConcentration": 12.0, "patchThickness": 5.0, "temperature": 37.0, "pH": 7.0, "moisture": 50.0, "duration": 48.0}),
    ("13. High Loading", {"drugName": "Metformin", "polymerName": "Cellulose", "drugLoading": 200.0, "polymerConcentration": 3.0, "patchThickness": 1.0, "temperature": 37.0, "pH": 7.0, "moisture": 50.0, "duration": 24.0}),
    ("14. Short Duration", {"drugName": "Ibuprofen", "polymerName": "Chitosan", "drugLoading": 50.0, "polymerConcentration": 3.0, "patchThickness": 1.0, "temperature": 37.0, "pH": 7.0, "moisture": 50.0, "duration": 1.0}),
    ("15. Zero Drug Loading", {"drugName": "Ibuprofen", "polymerName": "Chitosan", "drugLoading": 0.0, "polymerConcentration": 3.0, "patchThickness": 1.0, "temperature": 37.0, "pH": 7.0, "moisture": 50.0, "duration": 24.0})
]

@pytest.mark.parametrize("name,params", SCENARIOS)
def test_simulation_15_scenarios_and_invariants(name, params):
    res = simulate_release(params)
    assert 0.0 <= res["predictedRelease"] <= 100.0
    assert res["peakReleaseRate"] >= 0.0
    assert 10 <= res["controlledReleaseScore"] <= 100

    curve = res["releaseCurve"]
    assert len(curve) > 0
    # Invariant 1: Monotonicity (cumulative release never decreases)
    for i in range(len(curve) - 1):
        assert curve[i]["predicted"] <= curve[i+1]["predicted"] + 1e-9

    # Invariant 2: Bounded between 0% and 100%
    for pt in curve:
        assert 0.0 <= pt["predicted"] <= 100.0
        assert math.isfinite(pt["predicted"])
        assert math.isfinite(pt["time"])

    # Invariant 3: Released + Remaining drug mass balance
    init_loading = params["drugLoading"]
    released_mg = res["releasedAmountMg"]
    remaining_mg = res["remainingDrugMg"]
    assert released_mg >= 0.0
    assert remaining_mg >= 0.0
    assert abs((released_mg + remaining_mg) - init_loading) <= 0.05

def test_zero_drug_loading_behavior():
    params = {
        "drugName": "Ibuprofen",
        "polymerName": "Chitosan",
        "drugLoading": 0.0,
        "polymerConcentration": 3.0,
        "patchThickness": 1.0,
        "temperature": 37.0,
        "pH": 7.4,
        "moisture": 60.0,
        "duration": 24.0
    }
    res = simulate_release(params)
    assert res["predictedRelease"] == 0.0
    assert res["releasedAmountMg"] == 0.0
    assert res["remainingDrugMg"] == 0.0
    assert res["peakReleaseRate"] == 0.0
    assert res["timeTo50Percent"] == "N/A"
    for pt in res["releaseCurve"]:
        assert pt["predicted"] == 0.0
        assert pt["releasedMg"] == 0.0
        assert pt["remainingMg"] == 0.0

def test_simulation_determinism():
    params = {
        "drugName": "Metformin",
        "polymerName": "Alginate",
        "drugLoading": 60.0,
        "polymerConcentration": 2.5,
        "patchThickness": 0.8,
        "temperature": 37.5,
        "pH": 6.8,
        "moisture": 65.0,
        "duration": 24.0
    }
    run1 = simulate_release(params)
    run2 = simulate_release(params)
    assert run1 == run2

def test_simulation_invalid_boundary_inputs():
    base = {
        "drugName": "Ibuprofen",
        "polymerName": "Chitosan",
        "drugLoading": 50.0,
        "polymerConcentration": 3.0,
        "patchThickness": 1.0,
        "temperature": 37.0,
        "pH": 7.4,
        "moisture": 60.0,
        "duration": 24.0
    }
    # Negative loading
    with pytest.raises(ValueError):
        simulate_release({**base, "drugLoading": -5.0})
    # Negative thickness
    with pytest.raises(ValueError):
        simulate_release({**base, "patchThickness": -1.0})
    # Out of bound temperature (< 10)
    with pytest.raises(ValueError):
        simulate_release({**base, "temperature": 5.0})
    # Out of bound temperature (> 60)
    with pytest.raises(ValueError):
        simulate_release({**base, "temperature": 65.0})
    # Out of bound pH (< 0 or > 14)
    with pytest.raises(ValueError):
        simulate_release({**base, "pH": -1.0})
    with pytest.raises(ValueError):
        simulate_release({**base, "pH": 15.0})
    # NaN parameter
    with pytest.raises(ValueError):
        simulate_release({**base, "temperature": float("nan")})


# =====================================================================
# 3. ENDPOINTS, CONTRACTS & CRUD TESTING
# =====================================================================

def test_drugs_library_and_crud(client):
    # GET /api/drugs
    res = client.get("/api/drugs")
    assert res.status_code == 200
    drugs = res.json()
    assert len(drugs) >= 4
    for d in drugs:
        assert "name" in d
        assert "solubility" in d
        # Verify schema field parity
        assert ("molecularWeight" in d or "molecular_weight" in d)

    # GET /api/drugs/{id}
    first_id = drugs[0]["id"]
    res_single = client.get(f"/api/drugs/{first_id}")
    assert res_single.status_code == 200
    assert res_single.json()["id"] == first_id

    # POST /api/drugs
    new_drug = {
        "name": "Naproxen",
        "category": "NSAID",
        "solubility": 0.015,
        "molecularWeight": 230.26,
        "halfLife": "12 hours",
        "description": "NSAID compound used for pain relief."
    }
    post_res = client.post("/api/drugs", json=new_drug)
    assert post_res.status_code == 200
    assert post_res.json()["name"] == "Naproxen"

def test_polymers_library_and_crud(client):
    # GET /api/polymers
    res = client.get("/api/polymers")
    assert res.status_code == 200
    polys = res.json()
    assert len(polys) >= 6
    for p in polys:
        assert "name" in p
        assert "type" in p
        assert "swellingRatio" in p
        assert "degradationRate" in p
        assert "releaseBehavior" in p

    # GET /api/polymers/{id}
    res_single = client.get(f"/api/polymers/PLA")
    assert res_single.status_code == 200
    assert res_single.json()["name"] == "PLA"

    # POST /api/polymers
    new_poly = {
        "name": "Polycaprolactone",
        "type": "Polyester",
        "biodegradable": True,
        "concentrationRange": "5.0% - 20.0%",
        "releaseBehavior": "Slow bulk hydrolytic degradation matrix",
        "swellingRatio": "5%",
        "degradationRate": "2-3 years"
    }
    post_res = client.post("/api/polymers", json=new_poly)
    assert post_res.status_code == 200
    assert post_res.json()["name"] == "Polycaprolactone"

def test_full_simulation_flow_and_history(client):
    # 1. Login
    login_res = client.post("/api/auth/login", json={
        "email": "researcher@biopatch.ai",
        "password": "password"
    })
    assert login_res.status_code == 200
    token = login_res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # 2. Run simulation
    sim_payload = {
        "drugName": "Metformin",
        "polymerName": "Alginate",
        "drugLoading": 60.0,
        "polymerConcentration": 2.5,
        "patchThickness": 0.8,
        "temperature": 37.0,
        "pH": 6.8,
        "moisture": 70.0,
        "duration": 24.0
    }
    run_res = client.post("/api/simulations/run", json=sim_payload, headers=headers)
    assert run_res.status_code == 200
    sim_data = run_res.json()
    sim_id = sim_data["id"]
    assert "date" in sim_data
    assert "releaseCurve" in sim_data
    assert len(sim_data["releaseCurve"]) > 0

    # 3. Verify history contains timestamp
    hist_res = client.get("/api/simulations", headers=headers)
    assert hist_res.status_code == 200
    history = hist_res.json()
    assert len(history) > 0
    latest_hist = next(s for s in history if s["id"] == sim_id)
    assert latest_hist["date"] is not None
    assert latest_hist["drugName"] == "Metformin"

    # 4. Generate report for simulation
    rep_res = client.post("/api/reports", json={"simulationId": sim_id}, headers=headers)
    assert rep_res.status_code == 200
    rep_data = rep_res.json()
    rep_id = rep_data["id"]

    # 5. Get reports list
    reports_res = client.get("/api/reports", headers=headers)
    assert reports_res.status_code == 200
    assert any(r["id"] == rep_id for r in reports_res.json())

    # 6. Delete report
    del_rep_res = client.delete(f"/api/reports/{rep_id}", headers=headers)
    assert del_rep_res.status_code == 200

    # 7. Dashboard summary reflects recent simulations and curves
    dash_res = client.get("/api/dashboard", headers=headers)
    assert dash_res.status_code == 200
    dash_data = dash_res.json()
    assert dash_data["totalSimulations"] >= 1
    assert "backendStatus" in dash_data
    assert "databaseStatus" in dash_data
    assert len(dash_data["recentSimulations"]) > 0
    # Crucial Web fix: recentSimulations must have releaseCurve
    assert "releaseCurve" in dash_data["recentSimulations"][0]
    assert len(dash_data["recentSimulations"][0]["releaseCurve"]) > 0

    # 8. Clean up simulation
    del_sim_res = client.delete(f"/api/simulations/{sim_id}", headers=headers)
    assert del_sim_res.status_code == 200

def test_ml_predictions_endpoints(client):
    # GET /api/predictions/metrics
    res = client.get("/api/predictions/metrics")
    assert res.status_code == 200
    metrics = res.json()
    assert metrics["r2"] > 0.5
    assert "mae" in metrics
    assert "rmse" in metrics
    assert metrics["samples"] >= 600
    assert "feature_importances" in metrics
    assert len(metrics["feature_importances"]) > 0

    # POST /api/predictions/predict
    pred_res = client.post("/api/predictions/predict", json={
        "drugName": "Metformin",
        "polymerName": "Alginate",
        "drugLoading": 50.0,
        "polymerConcentration": 3.0,
        "patchThickness": 1.0,
        "temperature": 37.0,
        "pH": 6.8,
        "moisture": 50.0,
        "duration": 24.0
    })
    assert pred_res.status_code == 200
    assert 0.0 <= pred_res.json()["prediction"] <= 100.0

    # Zero drug loading returns 0.0 prediction
    pred_zero = client.post("/api/predictions/predict", json={
        "drugName": "Metformin",
        "polymerName": "Alginate",
        "drugLoading": 0.0,
        "polymerConcentration": 3.0,
        "patchThickness": 1.0,
        "temperature": 37.0,
        "pH": 6.8,
        "moisture": 50.0,
        "duration": 24.0
    })
    assert pred_zero.status_code == 200
    assert pred_zero.json()["prediction"] == 0.0

def test_health_check(client):
    res = client.get("/health")
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "ok"
    assert "database" in data
    assert "storage_mode" in data
