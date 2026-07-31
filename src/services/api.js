import { db } from './mockDb';

// Delay helper to simulate network latency for skeletons and loading states
const delay = (ms = 350) => new Promise(resolve => setTimeout(resolve, ms));

export const apiClient = {
  get: async (url) => {
    await delay();
    if (url.startsWith('/api/companies')) {
      const match = url.match(/\/api\/companies\/([\w-]+)/);
      if (match) return { data: db.companies.getById(match[1]) };
      return { data: db.companies.getAll() };
    }
    if (url.startsWith('/api/vehicles')) {
      const match = url.match(/\/api\/vehicles\/([\w-]+)/);
      if (match) return { data: db.vehicles.getById(match[1]) };
      return { data: db.vehicles.getAll() };
    }
    if (url.startsWith('/api/drivers')) {
      const match = url.match(/\/api\/drivers\/([\w-]+)/);
      if (match) return { data: db.drivers.getById(match[1]) };
      return { data: db.drivers.getAll() };
    }
    if (url.startsWith('/api/orders')) {
      const match = url.match(/\/api\/orders\/([\w-]+)/);
      if (match) return { data: db.orders.getById(match[1]) };
      return { data: db.orders.getAll() };
    }
    if (url.startsWith('/api/trips')) {
      const match = url.match(/\/api\/trips\/([\w-]+)/);
      if (match) return { data: db.trips.getById(match[1]) };
      return { data: db.trips.getAll() };
    }
    if (url.startsWith('/api/finances')) {
      const match = url.match(/\/api\/finances\/([\w-]+)/);
      if (match) return { data: db.finances.getById(match[1]) };
      return { data: db.finances.getAll() };
    }
    throw new Error('404 Not Found');
  },

  post: async (url, data) => {
    await delay();
    if (url === '/api/companies') return { data: db.companies.create(data) };
    if (url === '/api/vehicles') return { data: db.vehicles.create(data) };
    if (url === '/api/drivers') return { data: db.drivers.create(data) };
    if (url === '/api/orders') return { data: db.orders.create(data) };
    if (url === '/api/trips') return { data: db.trips.create(data) };
    if (url === '/api/finances') return { data: db.finances.create(data) };
    throw new Error('404 Not Found');
  },

  put: async (url, data) => {
    await delay();
    const cleanId = (path) => path.split('/').pop();
    if (url.startsWith('/api/companies/')) return { data: db.companies.update(cleanId(url), data) };
    if (url.startsWith('/api/vehicles/')) return { data: db.vehicles.update(cleanId(url), data) };
    if (url.startsWith('/api/drivers/')) return { data: db.drivers.update(cleanId(url), data) };
    if (url.startsWith('/api/orders/')) return { data: db.orders.update(cleanId(url), data) };
    if (url.startsWith('/api/trips/')) return { data: db.trips.update(cleanId(url), data) };
    if (url.startsWith('/api/finances/')) return { data: db.finances.update(cleanId(url), data) };
    throw new Error('404 Not Found');
  },

  delete: async (url) => {
    await delay();
    const cleanId = (path) => path.split('/').pop();
    if (url.startsWith('/api/companies/')) return { data: db.companies.delete(cleanId(url)) };
    if (url.startsWith('/api/vehicles/')) return { data: db.vehicles.delete(cleanId(url)) };
    if (url.startsWith('/api/drivers/')) return { data: db.drivers.delete(cleanId(url)) };
    if (url.startsWith('/api/orders/')) return { data: db.orders.delete(cleanId(url)) };
    if (url.startsWith('/api/trips/')) return { data: db.trips.delete(cleanId(url)) };
    if (url.startsWith('/api/finances/')) return { data: db.finances.delete(cleanId(url)) };
    throw new Error('404 Not Found');
  }
};
export default apiClient;
