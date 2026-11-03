import apiClient from './api';

export const simulationService = {
  // Execute biophysical simulation via authoritative backend
  runSimulation: async (params) => {
    const payload = {
      drugName: params.drugName || 'Ibuprofen',
      polymerName: params.polymerName || 'Chitosan',
      drugLoading: parseFloat(params.drugLoading ?? 50),
      polymerConcentration: parseFloat(params.polymerConcentration ?? 3.0),
      patchThickness: parseFloat(params.patchThickness ?? 1.0),
      temperature: parseFloat(params.temperature ?? 37.0),
      pH: parseFloat(params.pH ?? 7.0),
      moisture: parseFloat(params.moisture ?? 50.0),
      duration: parseFloat(params.duration ?? 24.0),
    };
    const res = await apiClient.post('/simulations/run', payload);
    return res.data;
  },

  // Retrieve user simulation history
  getHistory: async () => {
    const res = await apiClient.get('/simulations');
    return Array.isArray(res.data) ? res.data : [];
  },

  // Get specific simulation run by ID
  getById: async (id) => {
    const res = await apiClient.get(`/simulations/${id}`);
    return res.data;
  },

  // Re-run an archived simulation
  rerun: async (id) => {
    const res = await apiClient.post(`/simulations/${id}/rerun`);
    return res.data;
  },
};

