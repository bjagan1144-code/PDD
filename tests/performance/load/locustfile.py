import random
from locust import HttpUser, task, between

class BioPatchUser(HttpUser):
    wait_time = between(0.1, 0.5)

    DRUGS = ["Metformin", "Paracetamol", "Losartan", "Ibuprofen"]
    POLYMERS = ["PLA", "Alginate", "Gelatin", "Pectin", "Cellulose", "Chitosan"]
    token = None

    def on_start(self):
        """ Authenticate with isolated test account and set Bearer token """
        if not BioPatchUser.token:
            res = self.client.post("/api/auth/login", json={
                "email": "demo.researcher@biopatch.ai",
                "password": "password"
            }, name="/api/auth/login")
            if res.status_code == 200:
                BioPatchUser.token = res.json().get("access_token")
        
        if BioPatchUser.token:
            self.client.headers["Authorization"] = f"Bearer {BioPatchUser.token}"

    @task(3)
    def get_dashboard(self):
        """ GET /api/dashboard """
        self.client.get("/api/dashboard", name="/api/dashboard")

    @task(4)
    def get_drugs(self):
        """ GET /api/drugs """
        self.client.get("/api/drugs", name="/api/drugs")

    @task(4)
    def get_polymers(self):
        """ GET /api/polymers """
        self.client.get("/api/polymers", name="/api/polymers")

    @task(3)
    def get_reports(self):
        """ GET /api/reports """
        self.client.get("/api/reports", name="/api/reports")

    @task(3)
    def get_history(self):
        """ GET /api/simulations (History) """
        self.client.get("/api/simulations", name="/api/simulations")

    @task(2)
    def post_predict(self):
        """ POST /api/predictions/predict (AI Prediction) """
        payload = {
            "drugName": random.choice(self.DRUGS),
            "polymerName": random.choice(self.POLYMERS),
            "drugLoading": round(random.uniform(5.0, 25.0), 1),
            "polymerConcentration": round(random.uniform(10.0, 40.0), 1),
            "patchThickness": round(random.uniform(0.5, 3.0), 2),
            "temperature": round(random.uniform(25.0, 42.0), 1),
            "pH": round(random.uniform(4.0, 8.5), 1),
            "moisture": round(random.uniform(20.0, 80.0), 1),
            "duration": round(random.uniform(6.0, 48.0), 1)
        }
        self.client.post("/api/predictions/predict", json=payload, name="/api/predictions/predict")

    @task(4)
    def post_simulate(self):
        """ POST /api/simulate with valid schema payload """
        payload = {
            "drugName": random.choice(self.DRUGS),
            "polymerName": random.choice(self.POLYMERS),
            "drugLoading": round(random.uniform(5.0, 25.0), 1),
            "polymerConcentration": round(random.uniform(10.0, 40.0), 1),
            "patchThickness": round(random.uniform(0.5, 3.0), 2),
            "temperature": round(random.uniform(25.0, 42.0), 1),
            "pH": round(random.uniform(4.0, 8.5), 1),
            "moisture": round(random.uniform(20.0, 80.0), 1),
            "duration": round(random.uniform(6.0, 48.0), 1)
        }
        self.client.post("/api/simulate", json=payload, name="/api/simulate")
