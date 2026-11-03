import { Platform } from 'react-native';

/**
 * BioPatch AI — Dynamic API Network Configuration
 * Android emulator automatically defaults to 10.0.2.2:8000/api
 * Physical Android devices can be configured to any local IPv4 address via the Settings screen.
 */

// Default address based on platform
export const getDefaultBaseUrl = () => {
  if (Platform.OS === 'android') {
    // 10.0.2.2 is Android Emulator's loopback alias to host machine localhost
    return 'http://10.0.2.2:8000/api';
  }
  return 'http://127.0.0.1:8000/api';
};

export const CONFIG = {
  DEFAULT_API_URL: getDefaultBaseUrl(),
  STORAGE_KEYS: {
    AUTH_TOKEN: 'biopatch_auth_token',
    USER_PROFILE: 'biopatch_user_profile',
    API_BASE_URL: 'biopatch_custom_api_url',
    LAST_SIMULATION: 'biopatch_last_simulation',
  },
  TIMEOUT: 8000,
  APP_VERSION: '1.0.0',
};

