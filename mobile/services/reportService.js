import apiClient from './api';

export const reportService = {
  getReports: async () => {
    const res = await apiClient.get('/reports');
    return Array.isArray(res.data) ? res.data : [];
  },

  generateReport: async (simulationId) => {
    const res = await apiClient.post('/reports', { simulationId });
    return res.data;
  },

  deleteReport: async (id) => {
    const res = await apiClient.delete(`/reports/${id}`);
    return res.data;
  },
};

export const dashboardService = {
  getOverview: async () => {
    const res = await apiClient.get('/dashboard');
    return res.data;
  },
};

