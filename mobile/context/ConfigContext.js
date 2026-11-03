import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { getActiveBaseUrl, setActiveBaseUrl, pingBackend } from '../services/api';

const ConfigContext = createContext(null);

export const ConfigProvider = ({ children }) => {
  const [baseUrl, setBaseUrlState] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const [backendData, setBackendData] = useState(null);
  const [isChecking, setIsChecking] = useState(true);

  const checkConnectivity = useCallback(async (targetUrl = null) => {
    setIsChecking(true);
    const result = await pingBackend(targetUrl);
    setIsConnected(result.connected);
    if (result.connected && result.data) {
      setBackendData(result.data);
    } else {
      setBackendData(null);
    }
    setIsChecking(false);
    return result;
  }, []);

  useEffect(() => {
    const init = async () => {
      const active = await getActiveBaseUrl();
      setBaseUrlState(active);
      await checkConnectivity(active);
    };
    init();
  }, [checkConnectivity]);

  const updateBaseUrl = async (newUrl) => {
    await setActiveBaseUrl(newUrl);
    setBaseUrlState(newUrl);
    return await checkConnectivity(newUrl);
  };

  return (
    <ConfigContext.Provider
      value={{
        baseUrl,
        isConnected,
        backendData,
        isChecking,
        updateBaseUrl,
        refreshHealth: () => checkConnectivity(baseUrl),
      }}
    >
      {children}
    </ConfigContext.Provider>
  );
};

export const useConfig = () => {
  const context = useContext(ConfigContext);
  if (!context) {
    throw new Error('useConfig must be used within a ConfigProvider');
  }
  return context;
};

