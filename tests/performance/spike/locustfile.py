import random
from locust import HttpUser, task, between, LoadTestShape

class BioPatchSpikeUser(HttpUser):
    wait_time = between(0.2, 0.8)

    DRUGS = ["Metformin", "Paracetamol", "Losartan", "Ibuprofen"]
    POLYMERS = ["PLA", "Alginate", "Gelatin", "Pectin", "Cellulose", "Chitosan"]

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

    @task(5)
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
        headers = {"Content-Type": "application/json"}
        self.client.post("/api/simulate", json=payload, headers=headers, name="/api/simulate")


class SpikeTestShape(LoadTestShape):
    """
    Locust Custom Spike Test Shape for BioPatch AI:
    Phase 1 (Pre-Spike Baseline): 100 users for 30s
    Phase 2 & 3 (Peak Spike Burst): 1000 users for 30s
    Phase 4 & 5 (Post-Spike Drop): 100 users for 30s
    Phase 6 (Cool-Down): 0 users
    """
    stages = [
        {"duration": 30, "users": 100, "spawn_rate": 50},
        {"duration": 60, "users": 1000, "spawn_rate": 500},
        {"duration": 90, "users": 100, "spawn_rate": 500},
        {"duration": 110, "users": 0, "spawn_rate": 100}
    ]

    def tick(self):
        run_time = self.get_run_time()
        for stage in self.stages:
            if run_time < stage["duration"]:
                return (stage["users"], stage["spawn_rate"])
        return None
