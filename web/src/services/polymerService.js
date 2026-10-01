import { getStorageItem, setStorageItem, KEYS } from '../utils/storage';
import api, { isMockMode } from './api';

const delay = (ms = 300) => new Promise(resolve => setTimeout(resolve, ms));

export const polymerService = {
  getPolymers: async () => {
    await delay();
    if (!isMockMode()) {
      try {
        const res = await api.get('/polymers');
        return res.data;
      } catch (err) {
        console.warn('API error, falling back to mock:', err);
      }
    }
    return getStorageItem(KEYS.POLYMERS, []);
  },

  addPolymer: async (polymer) => {
    await delay();
    if (!isMockMode()) {
      try {
        const res = await api.post('/polymers', polymer);
        return res.data;
      } catch (err) {
        console.warn('API error, falling back to mock:', err);
      }
    }
    const polymers = getStorageItem(KEYS.POLYMERS, []);
    const newPolymer = {
      ...polymer,
      id: `poly-${Date.now()}`
    };
    polymers.push(newPolymer);
    setStorageItem(KEYS.POLYMERS, polymers);
    return newPolymer;
  },

  updatePolymer: async (id, updatedData) => {
    await delay();
    if (!isMockMode()) {
      try {
        const res = await api.put(`/polymers/${id}`, updatedData);
        return res.data;
      } catch (err) {
        console.warn('API error, falling back to mock:', err);
      }
    }
    const polymers = getStorageItem(KEYS.POLYMERS, []);
    const index = polymers.findIndex(p => p.id === id);
    if (index !== -1) {
      polymers[index] = { ...polymers[index], ...updatedData };
      setStorageItem(KEYS.POLYMERS, polymers);
      return polymers[index];
    }
    throw new Error('Polymer not found');
  },

  deletePolymer: async (id) => {
    await delay();
    if (!isMockMode()) {
      try {
        await api.delete(`/polymers/${id}`);
        return true;
      } catch (err) {
        console.warn('API error, falling back to mock:', err);
      }
    }
    const polymers = getStorageItem(KEYS.POLYMERS, []);
    const filtered = polymers.filter(p => p.id !== id);
    setStorageItem(KEYS.POLYMERS, filtered);
    return true;
  }
};
