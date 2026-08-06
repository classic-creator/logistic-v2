import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from './api';

// --- FUEL ENTRIES SERVICE ---
export const useFuelEntries = (params = {}) => {
  return useQuery({
    queryKey: ['fuel-entries', params],
    queryFn: async () => {
      const response = await apiClient.get('/api/v1/fuel-entries', { params });
      return response.data?.data || [];
    }
  });
};

export const useFuelEntry = (id) => {
  return useQuery({
    queryKey: ['fuel-entry', id],
    queryFn: async () => {
      const response = await apiClient.get(`/api/v1/fuel-entries/${id}`);
      return response.data?.data || response.data;
    },
    enabled: !!id
  });
};

export const useCreateFuelEntry = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (entry) => {
      const response = await apiClient.post('/api/v1/fuel-entries', entry);
      return response.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['fuel-entries'] });
      queryClient.invalidateQueries({ queryKey: ['fuel-dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['fuel-analytics'] });
      if (variables.tripId) {
        queryClient.invalidateQueries({ queryKey: ['trip', variables.tripId] });
        queryClient.invalidateQueries({ queryKey: ['fuel-breakdown', variables.tripId] });
      }
      queryClient.invalidateQueries({ queryKey: ['trips'] });
      queryClient.invalidateQueries({ queryKey: ['vehicles'] });
      queryClient.invalidateQueries({ queryKey: ['finances'] });
    }
  });
};

export const useUpdateFuelEntry = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }) => {
      const response = await apiClient.put(`/api/v1/fuel-entries/${id}`, data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fuel-entries'] });
      queryClient.invalidateQueries({ queryKey: ['fuel-dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['fuel-analytics'] });
      queryClient.invalidateQueries({ queryKey: ['finances'] });
      queryClient.invalidateQueries({ queryKey: ['trips'] });
    }
  });
};

export const useApproveFuelEntry = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id) => {
      const response = await apiClient.post(`/api/v1/fuel-entries/${id}/approve`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fuel-entries'] });
      queryClient.invalidateQueries({ queryKey: ['fuel-dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['fuel-analytics'] });
      queryClient.invalidateQueries({ queryKey: ['finances'] });
      queryClient.invalidateQueries({ queryKey: ['trips'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    }
  });
};

export const useRejectFuelEntry = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id) => {
      const response = await apiClient.post(`/api/v1/fuel-entries/${id}/reject`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fuel-entries'] });
      queryClient.invalidateQueries({ queryKey: ['fuel-dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['fuel-analytics'] });
      queryClient.invalidateQueries({ queryKey: ['finances'] });
    }
  });
};

export const useDeleteFuelEntry = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id) => {
      const response = await apiClient.delete(`/api/v1/fuel-entries/${id}`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fuel-entries'] });
      queryClient.invalidateQueries({ queryKey: ['fuel-dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['fuel-analytics'] });
      queryClient.invalidateQueries({ queryKey: ['finances'] });
      queryClient.invalidateQueries({ queryKey: ['trips'] });
    }
  });
};

export const useParseFuelReceipt = () => {
  return useMutation({
    mutationFn: async (formData) => {
      const response = await apiClient.post('/api/v1/fuel-entries/parse-receipt', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data?.data;
    },
  });
};

// --- FUEL PRICES SERVICE ---
export const useFuelPrices = (params = {}) => {
  return useQuery({
    queryKey: ['fuel-prices', params],
    queryFn: async () => {
      const response = await apiClient.get('/api/v1/fuel-prices', { params });
      return response.data?.data || [];
    }
  });
};

export const useCreateFuelPrice = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (price) => {
      const response = await apiClient.post('/api/v1/fuel-prices', price);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fuel-prices'] });
    }
  });
};

export const useUpdateFuelPrice = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }) => {
      const response = await apiClient.put(`/api/v1/fuel-prices/${id}`, data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fuel-prices'] });
    }
  });
};

export const useDeleteFuelPrice = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id) => {
      const response = await apiClient.delete(`/api/v1/fuel-prices/${id}`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fuel-prices'] });
    }
  });
};

// --- FUEL INTELLIGENCE SERVICE ---
export const useFuelDashboard = () => {
  return useQuery({
    queryKey: ['fuel-dashboard'],
    queryFn: async () => {
      const response = await apiClient.get('/api/v1/fuel/dashboard');
      return response.data?.data;
    }
  });
};

export const useFuelAnalytics = (params = {}) => {
  return useQuery({
    queryKey: ['fuel-analytics', params],
    queryFn: async () => {
      const response = await apiClient.get('/api/v1/fuel/analytics', { params });
      return response.data?.data;
    }
  });
};

export const useFuelEstimatePreview = () => {
  return useMutation({
    mutationFn: async (payload) => {
      const response = await apiClient.post('/api/v1/fuel/estimate-preview', payload);
      return response.data?.data;
    }
  });
};

export const useTripFuelBreakdown = (tripId) => {
  return useQuery({
    queryKey: ['fuel-breakdown', tripId],
    queryFn: async () => {
      const response = await apiClient.get(`/api/v1/fuel/trips/${tripId}/breakdown`);
      return response.data?.data;
    },
    enabled: !!tripId
  });
};

export const useVehicleFuelPerformance = (vehicleId, params = {}) => {
  return useQuery({
    queryKey: ['fuel-vehicle', vehicleId, params],
    queryFn: async () => {
      const response = await apiClient.get(`/api/v1/fuel/vehicles/${vehicleId}`, { params });
      return response.data?.data;
    },
    enabled: !!vehicleId
  });
};

export const useDriverFuelPerformance = (driverId, params = {}) => {
  return useQuery({
    queryKey: ['fuel-driver', driverId, params],
    queryFn: async () => {
      const response = await apiClient.get(`/api/v1/fuel/drivers/${driverId}`, { params });
      return response.data?.data;
    },
    enabled: !!driverId
  });
};
