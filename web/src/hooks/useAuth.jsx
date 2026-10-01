import React, { createContext, useContext, useState, useEffect } from 'react';
import { getStorageItem, setStorageItem, KEYS } from '../utils/storage';
import api, { checkBackendHealth, isMockMode } from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      const backendConnected = await checkBackendHealth();
      if (backendConnected) {
        const token = localStorage.getItem('biopatch_auth_token');
        if (token) {
          try {
            const res = await api.get('/auth/me');
            setUser(res.data);
            setStorageItem(KEYS.USER, res.data);
          } catch (error) {
            console.error("FastAPI me check failed, clearing session:", error);
            localStorage.removeItem('biopatch_auth_token');
            localStorage.removeItem(KEYS.USER);
            setUser(null);
          }
        } else {
          setUser(null);
          localStorage.removeItem(KEYS.USER);
        }
      } else {
        // Fallback: load demo/mock user from local storage
        const savedUser = getStorageItem(KEYS.USER);
        if (savedUser) {
          setUser(savedUser);
        } else {
          setUser(null);
        }
      }
      setLoading(false);
    };

    initAuth();
  }, []);

  const login = async (email, password) => {
    setLoading(true);
    const backendConnected = await checkBackendHealth();
    if (backendConnected) {
      try {
        const res = await api.post('/auth/login', { email, password });
        const { access_token } = res.data;
        localStorage.setItem('biopatch_auth_token', access_token);
        
        const userRes = await api.get('/auth/me');
        setUser(userRes.data);
        setStorageItem(KEYS.USER, userRes.data);
        setLoading(false);
        return userRes.data;
      } catch (err) {
        setLoading(false);
        throw new Error(err.response?.data?.detail || "Invalid email or password");
      }
    } else {
      // Mock mode auth fallback
      const mockUsers = getStorageItem('biopatch_mock_users', []);
      const matched = mockUsers.find(u => u.email === email && u.password === password);
      if (matched) {
        const userData = {
          id: matched.id,
          name: matched.name,
          email: matched.email,
          role: matched.role || 'Researcher',
          avatarUrl: 'https://images.unsplash.com/photo-1537368910025-700350fe46c7?auto=format&fit=crop&q=80&w=200'
        };
        setUser(userData);
        setStorageItem(KEYS.USER, userData);
        setLoading(false);
        return userData;
      } else if (email === 'demo.researcher@biopatch.ai' && password === 'password') {
        return loginAsDemo();
      } else {
        setLoading(false);
        throw new Error("Invalid email or password");
      }
    }
  };

  const loginAsDemo = async () => {
    setLoading(true);
    await new Promise(resolve => setTimeout(resolve, 400));
    
    const demoUser = {
      id: 999,
      email: 'demo.researcher@biopatch.ai',
      name: 'Dr. Sarah Carter',
      role: 'Principal Investigator',
      avatarUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=200'
    };

    setUser(demoUser);
    setStorageItem(KEYS.USER, demoUser);
    setLoading(false);
    return demoUser;
  };

  const register = async (name, email, password, role) => {
    setLoading(true);
    const backendConnected = await checkBackendHealth();
    if (backendConnected) {
      try {
        await api.post('/auth/register', { name, email, password, role });
        
        // Auto log in after register
        const loginRes = await api.post('/auth/login', { email, password });
        const { access_token } = loginRes.data;
        localStorage.setItem('biopatch_auth_token', access_token);
        
        const userRes = await api.get('/auth/me');
        setUser(userRes.data);
        setStorageItem(KEYS.USER, userRes.data);
        setLoading(false);
        return userRes.data;
      } catch (err) {
        setLoading(false);
        throw new Error(err.response?.data?.detail || "Registration failed");
      }
    } else {
      // Mock mode registration fallback
      const mockUsers = getStorageItem('biopatch_mock_users', []) || [];
      if (mockUsers.some(u => u.email === email)) {
        setLoading(false);
        throw new Error("Email is already registered");
      }
      const newMockUser = {
        id: `mock-user-${Date.now()}`,
        name,
        email,
        password,
        role
      };
      mockUsers.push(newMockUser);
      setStorageItem('biopatch_mock_users', mockUsers);
      
      const userData = {
        id: newMockUser.id,
        name: newMockUser.name,
        email: newMockUser.email,
        role: newMockUser.role,
        avatarUrl: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&q=80&w=200'
      };
      setUser(userData);
      setStorageItem(KEYS.USER, userData);
      setLoading(false);
      return userData;
    }
  };

  const logout = async () => {
    setUser(null);
    localStorage.removeItem(KEYS.USER);
    localStorage.removeItem('biopatch_auth_token');
    const backendConnected = await checkBackendHealth();
    if (backendConnected) {
      try {
        await api.post('/auth/logout');
      } catch (error) {
        console.warn("Logout request failed:", error);
      }
    }
  };

  const value = {
    user,
    loading,
    login,
    loginAsDemo,
    register,
    logout
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
