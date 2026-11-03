import apiClient from './api';

export const libraryService = {
  // Drugs catalog
  getDrugs: async () => {
    const res = await apiClient.get('/drugs');
    return Array.isArray(res.data) ? res.data : [];
  },

  addDrug: async (drug) => {
    const res = await apiClient.post('/drugs', drug);
    return res.data;
  },

  // Polymers catalog
  getPolymers: async () => {
    const res = await apiClient.get('/polymers');
    return Array.isArray(res.data) ? res.data : [];
  },

  addPolymer: async (polymer) => {
    const res = await apiClient.post('/polymers', polymer);
    return res.data;
  },
};

