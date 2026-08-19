// API Service to connect the Driver App 100%// Configurable API Base URL (Public HTTPS Tunnel)
export const API_BASE_URL = 'https://clever-teams-report.loca.lt/api';

let userToken = null;

export const setAuthToken = (token) => {
  userToken = token;
};

// Generic fetch wrapper with headers and error handling
async function apiFetch(endpoint, options = {}) {
  const headers = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    ...(userToken ? { 'Authorization': `Bearer ${userToken}` } : {}),
    ...options.headers,
  };

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10000);

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers,
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || `API Error: ${response.status}`);
    }
    return data;
  } catch (error) {
    clearTimeout(timeoutId);
    console.warn(`[Backend Fetch Error ${endpoint}]:`, error.message);
    throw error;
  }
}

// Normalizer to translate Laravel API Trip structure into React Native Driver App format
export function normalizeTrip(rawTrip) {
  if (!rawTrip) return null;

  const statusMap = {
    'Assigned': 'ASSIGNED',
    'Running': 'IN_TRANSIT',
    'In Transit': 'IN_TRANSIT',
    'Delivered': 'DELIVERED',
    'Completed': 'DELIVERED',
  };

  const status = statusMap[rawTrip.status] || 'ASSIGNED';
  const tripIdStr = typeof rawTrip.id === 'number' ? `TRIP-#10${rawTrip.id}` : (rawTrip.id || 'TRIP-NEW');

  return {
    id: tripIdStr,
    rawId: rawTrip.id,
    status: status,
    cargo: rawTrip.material || 'General Freight',
    weight: rawTrip.weight ? `${rawTrip.weight} lbs` : 'Standard Weight',
    origin: {
      name: rawTrip.pickup_location || 'Pickup Location',
      address: rawTrip.pickup_location || 'Origin Address',
      time: rawTrip.pickup_date || '08:00 AM',
    },
    destination: {
      name: rawTrip.destination || 'Destination Depot',
      address: rawTrip.destination || 'Destination Address',
      time: rawTrip.delivery_date || '04:00 PM',
    },
    distance: rawTrip.distance ? `${rawTrip.distance} km` : '0 km',
    payout: rawTrip.estimated_fuel_cost ? `$${Number(rawTrip.estimated_fuel_cost).toFixed(2)}` : '$0.00',
    dispatcher: rawTrip.company_name || 'Dispatch Center',
    customer: rawTrip.company_name || 'Client',
    notes: rawTrip.remarks || '',
    timeline: [
      { step: 'Assigned', time: rawTrip.created_at ? new Date(rawTrip.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : '--:--', completed: true },
      { step: 'Arrived at Pickup', time: rawTrip.start_date ? new Date(rawTrip.start_date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : '--:--', completed: status === 'IN_TRANSIT' || status === 'DELIVERED' },
      { step: 'Loaded & Verified', time: rawTrip.start_date ? new Date(rawTrip.start_date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : '--:--', completed: status === 'IN_TRANSIT' || status === 'DELIVERED' },
      { step: 'In Transit', time: rawTrip.start_date ? new Date(rawTrip.start_date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : '--:--', completed: status === 'IN_TRANSIT' || status === 'DELIVERED' },
      { step: 'Delivered & Signed', time: rawTrip.end_date ? new Date(rawTrip.end_date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : '--:--', completed: status === 'DELIVERED' },
    ]
  };
}

// Normalizer to translate Laravel Driver API structure into Mobile App format
export function normalizeDriver(rawDriver) {
  if (!rawDriver) return null;

  return {
    id: rawDriver.id,
    name: rawDriver.name || 'Driver',
    driverId: `DRV-${rawDriver.id || '001'}`,
    email: rawDriver.email || `driver${rawDriver.id}@logistics.com`,
    phone: rawDriver.mobile || rawDriver.phone || '+1 (555) 000-0000',
    rating: rawDriver.rating || 4.9,
    vehicle: {
      model: rawDriver.vehicle_number ? `Truck #${rawDriver.vehicle_number}` : 'Fleet Vehicle',
      plate: rawDriver.vehicle_number || 'N/A',
      capacity: '24 Tons',
      fuelLevel: '85%',
    },
    stats: {
      tripsCompletedToday: rawDriver.trips_count || 0,
      earningsToday: '$0.00',
      hoursOnline: '0.0 hrs',
      onTimeRate: '100%',
    },
    isOnline: rawDriver.status === 'Available' || rawDriver.status === 'On Trip',
  };
}

// Driver API Endpoints
export const driverApi = {
  // Fetch Demo Drivers from Backend
  getDemoDrivers: async () => {
    const res = await apiFetch('/v1/demo/drivers');
    const list = Array.isArray(res.data) ? res.data : [];
    return list.map(normalizeDriver);
  },

  // Login Driver
  login: async (email, password) => {
    return apiFetch('/v1/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  },

  // Get Current Authenticated Profile
  getProfile: async () => {
    const res = await apiFetch('/v1/auth/me');
    return normalizeDriver(res.data || res);
  },

  // Fetch Live Trips & Normalize for Mobile UI
  getTrips: async () => {
    const res = await apiFetch('/v1/trips');
    const list = Array.isArray(res.data) ? res.data : [];
    return list.map(normalizeTrip);
  },

  // Fetch Live Notifications
  getNotifications: async () => {
    const res = await apiFetch('/v1/notifications');
    const list = Array.isArray(res.data) ? res.data : [];
    return list.map(n => ({
      id: String(n.id),
      title: n.title || 'Notification',
      message: n.message || n.data?.message || '',
      time: n.created_at ? new Date(n.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : 'Just now',
      type: n.type || 'INFO',
      unread: !n.read_at,
    }));
  },

  // Update Trip Status in Backend
  startTrip: async (tripId) => {
    const numericId = String(tripId).replace(/[^0-9]/g, '') || 1;
    return apiFetch(`/trips/${numericId}/start`, { 
      method: 'PATCH',
      body: JSON.stringify({ start_odometer: 1000, remarks: 'Trip started via driver app' })
    });
  },

  markDelivered: async (tripId, notes = '') => {
    const numericId = String(tripId).replace(/[^0-9]/g, '') || 1;
    return apiFetch(`/trips/${numericId}/mark-delivered`, {
      method: 'PATCH',
      body: JSON.stringify({ remarks: notes || 'Delivered via driver app' }),
    });
  },
};
