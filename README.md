# BioPatch AI

### Intelligent Drug Delivery. Predictive Release. Personalized Medicine.
> **Final-Year B.Tech CSE Project Showcase**
> **Title:** Development of an Intelligent Biopolymer Drug-Delivery Patch with Real-Time Release Modeling

BioPatch AI is an intelligent research simulation and real-time monitoring platform for designing natural, biopolymer-based transdermal drug-delivery patches. Using machine learning predictive models, researchers can simulate cumulative drug-release kinetics based on molecular loading, polymer concentrations, and bodily environmental variables (pH, temperature, moisture).

---

## 🚀 Web Application Setup (First Priority)

The core web workspace runs locally at `http://localhost:5173`.

### 1. Installation
Navigate to the `web` folder and install dependencies:
```bash
cd web
npm install
```

### 2. Launch Local Server
Boot up the local Vite development instance:
```bash
npm run dev
```
Open your browser and navigate to: [http://localhost:5173](http://localhost:5173).

---

## 📱 Mobile Application Skeleton (Expo)

A structured React Native Expo application code framework.

### 1. Installation
Navigate to the `mobile` folder and install dependencies:
```bash
cd mobile
npm install
```

### 2. Launch Bundle Packager
Launch the Expo package manager:
```bash
npx expo start
```
Use the Expo Go app on your mobile device (iOS/Android) to scan the terminal QR code.

---

## 🧪 Simulation Kinetics Engine & Local Storage Architecture

To support offline B.Tech project demonstrations without requiring an active backend, all services use local memory and simulated mathematical kinetics:

- **Local Storage Cache:** Reference compound tables, simulation runs, diagnostic preferences, and notification queues are fully preserved across browser reloads using the browser's `localStorage` API.
- **Deterministic Modeling:** Simulations run in `web/src/utils/simulation.js` using hybrid Fickian diffusion equations (based on **Higuchi** and **Korsmeyer-Peppas** transport phenomena):
  $$Q(t) = Q_0 + (100 - Q_0) \cdot (1 - e^{-k \cdot t^n})$$
  This ensures that identical formulation ratios, patch thickness, temperatures, and pH indices consistently yield identical curves and safety metrics rather than random calculations.
- **Real-Time Monitoring Telemetry:** The `Release Monitor` dashboard runs a JavaScript interval thread to plot live concentrations, simulating telemetry streams from a hypothetical biosensor.

---

## 🔗 Future Backend API Integration Points

To transition from the current mock database layer to a live Python/FastAPI/Node server, update the following interface modules:

### 1. API Client Base Configuration
File: [`web/src/services/api.js`](file:///c:/Users/bsowm/OneDrive/Desktop/project-11/web/src/services/api.js)
```javascript
// 1. Configure backend URL inside .env or update:
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

// 2. Change isMockMode return value to false to activate Axios hooks:
export const isMockMode = () => false;
```

### 2. AI Simulation Inference
File: [`web/src/services/simulationService.js`](file:///c:/Users/bsowm/OneDrive/Desktop/project-11/web/src/services/simulationService.js)
```javascript
// The UI calls simulationService.runSimulation(params)
// Toggle isMockMode to false to direct parameters to:
POST /api/simulate
```

### 3. Drug and Polymer Catalogs
Files: [`web/src/services/drugService.js`](file:///c:/Users/bsowm/OneDrive/Desktop/project-11/web/src/services/drugService.js) & [`web/src/services/polymerService.js`](file:///c:/Users/bsowm/OneDrive/Desktop/project-11/web/src/services/polymerService.js)
```javascript
// Activating live database routes:
GET    /drugs          | GET    /polymers
POST   /drugs          | POST   /polymers
PUT    /drugs/:id      | PUT    /polymers/:id
DELETE /drugs/:id      | DELETE /polymers/:id
```
