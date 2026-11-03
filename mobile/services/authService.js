import apiClient, {
  setSecureItem,
  removeSecureItem,
  getSecureItem,
} from './api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { CONFIG } from '../constants/config';

export const authService = {
  // Login with email and password
  login: async (email, password) => {
    const res = await apiClient.post('/auth/login', { email, password });
    const { access_token } = res.data;
    if (access_token) {
      await setSecureItem(CONFIG.STORAGE_KEYS.AUTH_TOKEN, access_token);
      // Fetch user profile immediately
      const userRes = await apiClient.get('/auth/me');
      await AsyncStorage.setItem(
        CONFIG.STORAGE_KEYS.USER_PROFILE,
        JSON.stringify(userRes.data)
      );
      return { token: access_token, user: userRes.data };
    }
    throw new Error('No access token received from authentication server.');
  },

  // Register new researcher
  register: async (payload) => {
    const res = await apiClient.post('/auth/register', payload);
    const { access_token, user } = res.data;
    if (access_token) {
      await setSecureItem(CONFIG.STORAGE_KEYS.AUTH_TOKEN, access_token);
      if (user) {
        await AsyncStorage.setItem(
          CONFIG.STORAGE_KEYS.USER_PROFILE,
          JSON.stringify(user)
        );
      }
      return { token: access_token, user };
    }
    return res.data;
  },

  // Retrieve current user
  getMe: async () => {
    const res = await apiClient.get('/auth/me');
    await AsyncStorage.setItem(
      CONFIG.STORAGE_KEYS.USER_PROFILE,
      JSON.stringify(res.data)
    );
    return res.data;
  },

  // Get cached profile from AsyncStorage
  getCachedUser: async () => {
    try {
      const stored = await AsyncStorage.getItem(CONFIG.STORAGE_KEYS.USER_PROFILE);
      return stored ? JSON.parse(stored) : null;
    } catch (_) {
      return null;
    }
  },

  // Check if session token exists
  hasToken: async () => {
    const token = await getSecureItem(CONFIG.STORAGE_KEYS.AUTH_TOKEN);
    return !!token;
  },

  // Logout
  logout: async () => {
    try {
      await apiClient.post('/auth/logout');
    } catch (_) {}
    await removeSecureItem(CONFIG.STORAGE_KEYS.AUTH_TOKEN);
    await AsyncStorage.removeItem(CONFIG.STORAGE_KEYS.USER_PROFILE);
  },
};

