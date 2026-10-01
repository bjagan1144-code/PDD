import axios from 'axios';

// Base URL for the backend API, pulled from VITE_API_URL or defaults to localhost
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 5000, // 5s timeout
});

// Interceptor to inject JWT authentication token on outgoing requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('biopatch_auth_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Helper to determine if we should fall back to LocalStorage mock services
export const isMockMode = () => {
  const status = localStorage.getItem('biopatch_backend_status');
  return status !== 'connected';
};

// Check backend server availability and cache result
export const checkBackendHealth = async () => {
  try {
    const res = await axios.get(`${API_BASE_URL}/health`, { timeout: 2000 });
    if (res.data && res.data.status === 'ok') {
      localStorage.setItem('biopatch_backend_status', 'connected');
      return true;
    }
  } catch (err) {
    console.warn('Backend server is down. Falling back to Offline Demo Mode.');
  }
  localStorage.setItem('biopatch_backend_status', 'disconnected');
  return false;
};

// Trigger verification check on load
checkBackendHealth();

export default api;
