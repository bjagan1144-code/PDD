import { getStorageItem, setStorageItem, KEYS } from '../utils/storage';
import { simulateRelease } from '../utils/simulation';
import api, { isMockMode } from './api';

const delay = (ms = 500) => new Promise(resolve => setTimeout(resolve, ms));

export const simulationService = {
  getSimulations: async () => {
    await delay(300);
    if (!isMockMode()) {
      try {
        const res = await api.get('/simulations');
        return res.data;
      } catch (err) {
        console.warn('API error, falling back to mock:', err);
      }
    }
    return getStorageItem(KEYS.SIMULATIONS, []);
  },

  runSimulation: async (params) => {
    // Mimic the processing phases of the simulation
    await delay(1500); 
    
    if (!isMockMode()) {
      try {
        const res = await api.post('/simulations/run', params);
        return res.data;
      } catch (err) {
        console.warn('API error, running client-side simulation:', err);
      }
    }

    // Run mathematical simulation locally
    const simulationResult = simulateRelease(params);
    
    const newSim = {
      id: `sim-${Math.floor(100 + Math.random() * 900)}`,
      drugName: params.drugName,
      polymerName: params.polymerName,
      drugLoading: parseFloat(params.drugLoading),
      polymerConcentration: parseFloat(params.polymerConcentration),
      patchThickness: parseFloat(params.patchThickness),
      temperature: parseFloat(params.temperature),
      pH: parseFloat(params.pH),
      moisture: parseFloat(params.moisture),
      duration: parseInt(params.duration),
      date: new Date().toISOString().replace('T', ' ').substring(0, 16),
      status: "Completed",
      ...simulationResult
    };

    // Save to historical simulations in storage
    const simulations = getStorageItem(KEYS.SIMULATIONS, []);
    simulations.unshift(newSim); // Put newest first
    setStorageItem(KEYS.SIMULATIONS, simulations);

    // Also push a notification that simulation finished
    const notifications = getStorageItem(KEYS.NOTIFICATIONS, []);
    notifications.unshift({
      id: `notif-${Date.now()}`,
      title: "Simulation Completed",
      message: `Simulation ${newSim.id} for ${newSim.drugName} + ${newSim.polymerName} completed with score ${newSim.controlledReleaseScore}/100.`,
      time: "Just now",
      read: false,
      type: newSim.riskLevel === 'High' ? 'warning' : 'success'
    });
    setStorageItem(KEYS.NOTIFICATIONS, notifications);

    return newSim;
  },

  deleteSimulation: async (id) => {
    await delay(200);
    if (!isMockMode()) {
      try {
        await api.delete(`/simulations/${id}`);
        return true;
      } catch (err) {
        console.warn('API error, falling back to mock:', err);
      }
    }
    const simulations = getStorageItem(KEYS.SIMULATIONS, []);
    const filtered = simulations.filter(s => s.id !== id);
    setStorageItem(KEYS.SIMULATIONS, filtered);
    return true;
  }
};
