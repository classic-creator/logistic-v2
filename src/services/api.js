import axios from 'axios';
import { db } from './mockDb';

// Simulated network latency so skeletons and loading states are visible.
const delay = (ms = 350) => new Promise((resolve) => setTimeout(resolve, ms));

// REST router backed by the in-memory localStorage mock database.
// Swap these handlers for real fetch calls when a backend is integrated.
const router = {
  get: (url) => {
    const match = (prefix) => url.match(new RegExp(`${prefix}/([\\w-]+)`));
    if (url.startsWith('/api/companies')) {
      const m = match('/api/companies');
      return m ? db.companies.getById(m[1]) : db.companies.getAll();
    }
    if (url.startsWith('/api/vehicles')) {
      const m = match('/api/vehicles');
      return m ? db.vehicles.getById(m[1]) : db.vehicles.getAll();
    }
    if (url.startsWith('/api/drivers')) {
      const m = match('/api/drivers');
      return m ? db.drivers.getById(m[1]) : db.drivers.getAll();
    }
    if (url.startsWith('/api/orders')) {
      const m = match('/api/orders');
      return m ? db.orders.getById(m[1]) : db.orders.getAll();
    }
    if (url.startsWith('/api/trips')) {
      const m = match('/api/trips');
      return m ? db.trips.getById(m[1]) : db.trips.getAll();
    }
    if (url.startsWith('/api/finances')) {
      const m = match('/api/finances');
      return m ? db.finances.getById(m[1]) : db.finances.getAll();
    }
    throw new Error(`404 Not Found: ${url}`);
  },

  post: (url, data) => {
    if (url === '/api/companies') return db.companies.create(data);
    if (url === '/api/vehicles') return db.vehicles.create(data);
    if (url === '/api/drivers') return db.drivers.create(data);
    if (url === '/api/orders') return db.orders.create(data);
    if (url === '/api/trips') return db.trips.create(data);
    if (url === '/api/finances') return db.finances.create(data);
    throw new Error(`404 Not Found: ${url}`);
  },

  put: (url, data) => {
    const id = url.split('/').pop();
    if (url.startsWith('/api/companies/')) return db.companies.update(id, data);
    if (url.startsWith('/api/vehicles/')) return db.vehicles.update(id, data);
    if (url.startsWith('/api/drivers/')) return db.drivers.update(id, data);
    if (url.startsWith('/api/orders/')) return db.orders.update(id, data);
    if (url.startsWith('/api/trips/')) return db.trips.update(id, data);
    if (url.startsWith('/api/finances/')) return db.finances.update(id, data);
    throw new Error(`404 Not Found: ${url}`);
  },

  delete: (url) => {
    const id = url.split('/').pop();
    if (url.startsWith('/api/companies/')) return db.companies.delete(id);
    if (url.startsWith('/api/vehicles/')) return db.vehicles.delete(id);
    if (url.startsWith('/api/drivers/')) return db.drivers.delete(id);
    if (url.startsWith('/api/orders/')) return db.orders.delete(id);
    if (url.startsWith('/api/trips/')) return db.trips.delete(id);
    if (url.startsWith('/api/finances/')) return db.finances.delete(id);
    throw new Error(`404 Not Found: ${url}`);
  },
};

// Configured axios instance. In production, swap `baseURL` for the real
// backend origin and remove the custom adapter.
export const apiClient = axios.create({
  baseURL: '',
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

// ---- Request Interceptor -------------------------------------------------
// Attaches the session token to every outgoing request when available.
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('ltms_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ---- Response Interceptor ------------------------------------------------
// Normalizes API errors into a consistent shape for the UI layer.
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const normalized = new Error(
      error.response?.data?.message || error.message || 'Something went wrong'
    );
    normalized.status = error.response?.status || 0;
    normalized.isAxiosError = true;
    if (import.meta.env.DEV) {
      console.warn('[api] request failed', normalized.status, normalized.message);
    }
    return Promise.reject(normalized);
  }
);

// ---- Mock Adapter ---------------------------------------------------------
// Routes requests to the mock database while preserving the axios request
// lifecycle (interceptors run as usual). Remove when a backend is available.
apiClient.defaults.adapter = async (config) => {
  await delay();
  const method = (config.method || 'get').toLowerCase();
  let data;
  try {
    data = router[method](config.url, config.data);
  } catch (err) {
    const error = new Error(err.message || 'Request failed');
    error.status = 404;
    throw error;
  }
  return {
    data,
    status: 200,
    statusText: 'OK',
    headers: {},
    config,
  };
};

export default apiClient;
