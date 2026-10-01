import { getStorageItem, setStorageItem, KEYS } from '../utils/storage';
import api, { isMockMode } from './api';

const delay = (ms = 300) => new Promise(resolve => setTimeout(resolve, ms));

export const reportService = {
  getReports: async () => {
    await delay();
    if (!isMockMode()) {
      try {
        const res = await api.get('/reports');
        return res.data;
      } catch (err) {
        console.warn('API error, falling back to mock:', err);
      }
    }
    
    let reports = getStorageItem('biopatch_reports');
    if (!reports) {
      const simulations = getStorageItem(KEYS.SIMULATIONS, []);
      reports = simulations.map((sim, i) => ({
        id: `REP-${1000 + i}`,
        simulationId: sim.id,
        drugName: sim.drugName,
        polymerName: sim.polymerName,
        date: sim.date,
        status: "Available",
        summary: `Release: ${sim.predictedRelease}%, Duration: ${sim.duration}h, Simulation Risk Indicator: ${sim.riskLevel}`
      }));
      setStorageItem('biopatch_reports', reports);
    }
    return reports;
  },

  generateReport: async (simulation) => {
    await delay(500);
    if (!isMockMode()) {
      try {
        const res = await api.post('/reports', { simulationId: simulation.id });
        return res.data;
      } catch (err) {
        console.warn('API error, falling back to mock:', err);
      }
    }

    const reports = getStorageItem('biopatch_reports') || [];
    const existing = reports.find(r => r.simulationId === simulation.id);
    if (existing) return existing;

    const newReport = {
      id: `REP-${Math.floor(1000 + Math.random() * 9000)}`,
      simulationId: simulation.id,
      drugName: simulation.drugName,
      polymerName: simulation.polymerName,
      date: new Date().toISOString().replace('T', ' ').substring(0, 16),
      status: "Available",
      summary: `Release: ${simulation.predictedRelease}%, Duration: ${simulation.duration}h, Simulation Risk Indicator: ${simulation.riskLevel}`
    };

    reports.unshift(newReport);
    setStorageItem('biopatch_reports', reports);
    return newReport;
  },

  deleteReport: async (id) => {
    await delay();
    if (!isMockMode()) {
      try {
        await api.delete(`/reports/${id}`);
        return true;
      } catch (err) {
        console.warn('API error, falling back to mock:', err);
      }
    }

    const reports = getStorageItem('biopatch_reports') || [];
    const filtered = reports.filter(r => r.id !== id);
    setStorageItem('biopatch_reports', filtered);
    return true;
  }
};
