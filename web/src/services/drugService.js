import { getStorageItem, setStorageItem, KEYS } from '../utils/storage';
import api, { isMockMode } from './api';

const delay = (ms = 300) => new Promise(resolve => setTimeout(resolve, ms));

export const drugService = {
  getDrugs: async () => {
    await delay();
    if (!isMockMode()) {
      try {
        const res = await api.get('/drugs');
        return res.data;
      } catch (err) {
        console.warn('API error, falling back to mock:', err);
      }
    }
    return getStorageItem(KEYS.DRUGS, []);
  },

  addDrug: async (drug) => {
    await delay();
    if (!isMockMode()) {
      try {
        const res = await api.post('/drugs', drug);
        return res.data;
      } catch (err) {
        console.warn('API error, falling back to mock:', err);
      }
    }
    const drugs = getStorageItem(KEYS.DRUGS, []);
    const newDrug = {
      ...drug,
      id: `drug-${Date.now()}`
    };
    drugs.push(newDrug);
    setStorageItem(KEYS.DRUGS, drugs);
    return newDrug;
  },

  updateDrug: async (id, updatedData) => {
    await delay();
    if (!isMockMode()) {
      try {
        const res = await api.put(`/drugs/${id}`, updatedData);
        return res.data;
      } catch (err) {
        console.warn('API error, falling back to mock:', err);
      }
    }
    const drugs = getStorageItem(KEYS.DRUGS, []);
    const index = drugs.findIndex(d => d.id === id);
    if (index !== -1) {
      drugs[index] = { ...drugs[index], ...updatedData };
      setStorageItem(KEYS.DRUGS, drugs);
      return drugs[index];
    }
    throw new Error('Drug not found');
  },

  deleteDrug: async (id) => {
    await delay();
    if (!isMockMode()) {
      try {
        await api.delete(`/drugs/${id}`);
        return true;
      } catch (err) {
        console.warn('API error, falling back to mock:', err);
      }
    }
    const drugs = getStorageItem(KEYS.DRUGS, []);
    const filtered = drugs.filter(d => d.id !== id);
    setStorageItem(KEYS.DRUGS, filtered);
    return true;
  }
};
