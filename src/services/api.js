import axios from 'axios';

// Utility to convert camelCase to snake_case
const toSnakeCase = (str) => str.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);

// Utility to convert snake_case to camelCase
const toCamelCase = (str) => str.replace(/_([a-z])/g, (match, letter) => letter.toUpperCase());

// Deep transform keys of an object
const transformKeys = (obj, transformer) => {
  if (Array.isArray(obj)) {
    return obj.map(item => transformKeys(item, transformer));
  } else if (obj !== null && typeof obj === 'object' && !(obj instanceof File) && !(obj instanceof Blob)) {
    return Object.keys(obj).reduce((acc, key) => {
      acc[transformer(key)] = transformKeys(obj[key], transformer);
      return acc;
    }, {});
  }
  return obj;
};

export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || (import.meta.env.PROD ? '/' : 'http://localhost:8000'),
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  },
});

// ---- Request Interceptor -------------------------------------------------
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('ltms_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    if (config.data && !(config.data instanceof FormData)) {
      config.data = transformKeys(config.data, toSnakeCase);
    }
    
    if (config.params) {
      config.params = transformKeys(config.params, toSnakeCase);
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// ---- Response Interceptor ------------------------------------------------
apiClient.interceptors.response.use(
  (response) => {
    if (response.data) {
      response.data = transformKeys(response.data, toCamelCase);
    }
    return response;
  },
  (error) => {
    const normalized = new Error(
      error.response?.data?.message || error.message || 'Something went wrong'
    );
    normalized.status = error.response?.status || 0;
    normalized.isAxiosError = true;
    normalized.serverErrors = error.response?.data?.errors || null;
    
    if (import.meta.env.DEV) {
      console.warn('[api] request failed', normalized.status, normalized.message);
    }

    if (normalized.status === 401) {
      localStorage.removeItem('ltms_token');
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    
    return Promise.reject(normalized);
  }
);

export default apiClient;
