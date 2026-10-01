import { defaultDrugs } from '../data/drugs';
import { defaultPolymers } from '../data/polymers';
import { defaultSimulations } from '../data/simulations';
import { defaultNotifications } from '../data/notifications';

export const KEYS = {
  USER: 'biopatch_user',
  DRUGS: 'biopatch_drugs',
  POLYMERS: 'biopatch_polymers',
  SIMULATIONS: 'biopatch_simulations',
  NOTIFICATIONS: 'biopatch_notifications',
  SETTINGS: 'biopatch_settings'
};

export const getStorageItem = (key, defaultValue = null) => {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : defaultValue;
  } catch (error) {
    console.error(`Error reading localStorage key "${key}":`, error);
    return defaultValue;
  }
};

export const setStorageItem = (key, value) => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.error(`Error setting localStorage key "${key}":`, error);
  }
};

export const initStorage = () => {
  if (!getStorageItem(KEYS.DRUGS)) {
    setStorageItem(KEYS.DRUGS, defaultDrugs);
  }
  if (!getStorageItem(KEYS.POLYMERS)) {
    setStorageItem(KEYS.POLYMERS, defaultPolymers);
  }
  if (!getStorageItem(KEYS.SIMULATIONS)) {
    setStorageItem(KEYS.SIMULATIONS, defaultSimulations);
  }
  if (!getStorageItem(KEYS.NOTIFICATIONS)) {
    setStorageItem(KEYS.NOTIFICATIONS, defaultNotifications);
  }
  if (!getStorageItem(KEYS.SETTINGS)) {
    setStorageItem(KEYS.SETTINGS, {
      theme: 'dark',
      notifications: true,
      language: 'en',
      apiBaseUrl: ''
    });
  }
};
