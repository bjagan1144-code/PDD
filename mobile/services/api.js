import axios from 'axios';
import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import { CONFIG } from '../constants/config';

// Safe secure storage helper
export const getSecureItem = async (key) => {
  try {
    if (Platform.OS !== 'web') {
      return await SecureStore.getItemAsync(key);
    }
  } catch (_) {}
  return await AsyncStorage.getItem(key);
};

export const setSecureItem = async (key, value) => {
  try {
    if (Platform.OS !== 'web') {
      await SecureStore.setItemAsync(key, value);
      return;
    }
  } catch (_) {}
  await AsyncStorage.setItem(key, value);
};

export const removeSecureItem = async (key) => {
  try {
    if (Platform.OS !== 'web') {
      await SecureStore.deleteItemAsync(key);
      return;
    }
  } catch (_) {}
  await AsyncStorage.removeItem(key);
};

// Get current active base URL
export const getActiveBaseUrl = async () => {
  try {
    const custom = await AsyncStorage.getItem(CONFIG.STORAGE_KEYS.API_BASE_URL);
    if (custom && custom.trim().length > 0) {
      return custom.trim().replace(/\/+$/, '');
    }
  } catch (_) {}
  return CONFIG.DEFAULT_API_URL;
};

// Set active base URL
export const setActiveBaseUrl = async (url) => {
  const cleanUrl = url.trim().replace(/\/+$/, '');
  await AsyncStorage.setItem(CONFIG.STORAGE_KEYS.API_BASE_URL, cleanUrl);
};

// Create dynamic Axios instance
const apiClient = axios.create({
  timeout: CONFIG.TIMEOUT,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});

// Request Interceptor: Inject Dynamic Base URL & Auth Token
apiClient.interceptors.request.use(
  async (config) => {
    // Dynamic Base URL check
    const currentBaseUrl = await getActiveBaseUrl();
    config.baseURL = currentBaseUrl;

    // JWT Token injection
    const token = await getSecureItem(CONFIG.STORAGE_KEYS.AUTH_TOKEN);
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor: Normalize Error Responses
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    let message = 'Network connection failed. Please verify backend server is running.';
    if (error.response?.data?.detail) {
      message = typeof error.response.data.detail === 'string'
        ? error.response.data.detail
        : JSON.stringify(error.response.data.detail);
    } else if (error.message) {
      message = error.message;
    }
    return Promise.reject(new Error(message));
  }
);

// Health check utility
export const pingBackend = async (customUrl = null) => {
  try {
    const baseUrl = customUrl || (await getActiveBaseUrl());
    // Strip trailing /api to reach /health or /api/health
    const healthUrl = baseUrl.endsWith('/api') ? `${baseUrl}/health` : `${baseUrl}/api/health`;
    const res = await axios.get(healthUrl, { timeout: 3500 });
    return {
      connected: res.status === 200,
      data: res.data,
      url: healthUrl,
    };
  } catch (err) {
    return {
      connected: false,
      error: err.message,
    };
  }
};

export default apiClient;

