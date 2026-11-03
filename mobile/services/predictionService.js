import apiClient from './api';

export const predictionService = {
  // Execute ML Random Forest inference on backend
  predict: async (params) => {
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
    const res = await apiClient.post('/predictions/predict', payload);
    return res.data;
  },

  // Retrieve actual trained model evaluation metadata & feature importances
  getMetrics: async () => {
    const res = await apiClient.get('/predictions/metrics');
    return res.data;
  },
};

