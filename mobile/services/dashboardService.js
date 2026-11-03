import apiClient from './api';

export const dashboardService = {
  getOverview: async () => {
    const res = await apiClient.get('/dashboard');
    return res.data;
  },
};

