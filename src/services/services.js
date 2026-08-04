import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from './api';

// --- COMPANIES SERVICE ---
export const useCompanies = (params = {}) => {
  return useQuery({
    queryKey: ['companies', params],
    queryFn: async () => {
      const response = await apiClient.get('/api/v1/companies', { params });
      return response.data; // expects { data: [], meta: {} }
    }
  });
};

export const useCompany = (id) => {
  return useQuery({
    queryKey: ['company', id],
    queryFn: async () => {
      const response = await apiClient.get(`/api/v1/companies/${id}`);
      return response.data;
    },
    enabled: !!id
  });
};

export const useCreateCompany = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (company) => {
      const response = await apiClient.post('/api/v1/companies', company);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['companies'] });
    }
  });
};

export const useUpdateCompany = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }) => {
      const response = await apiClient.put(`/api/v1/companies/${id}`, data);
      return response.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['companies'] });
      queryClient.invalidateQueries({ queryKey: ['company', variables.id] });
    }
  });
};

export const useDeleteCompany = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id) => {
      const response = await apiClient.delete(`/api/v1/companies/${id}`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['companies'] });
    }
  });
};

// --- VEHICLES SERVICE ---
export const useVehicles = (params = { per_page: 1000 }) => {
  return useQuery({
    queryKey: ['vehicles', params],
    queryFn: async () => {
      const response = await apiClient.get('/api/v1/vehicles', { params });
      return response.data?.data || [];
    }
  });
};

export const useVehicle = (id) => {
  return useQuery({
    queryKey: ['vehicle', id],
    queryFn: async () => {
      const response = await apiClient.get(`/api/v1/vehicles/${id}`);
      return response.data?.data || response.data;
    },
    enabled: !!id
  });
};

export const useCreateVehicle = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (vehicle) => {
      const response = await apiClient.post('/api/v1/vehicles', vehicle);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vehicles'] });
    }
  });
};

export const useUpdateVehicle = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }) => {
      const response = await apiClient.put(`/api/v1/vehicles/${id}`, data);
      return response.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['vehicles'] });
      queryClient.invalidateQueries({ queryKey: ['vehicle', variables.id] });
    }
  });
};

export const useDeleteVehicle = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id) => {
      const response = await apiClient.delete(`/api/v1/vehicles/${id}`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vehicles'] });
    }
  });
};

// --- DRIVERS SERVICE ---
export const useDrivers = (params = { per_page: 1000 }) => {
  return useQuery({
    queryKey: ['drivers', params],
    queryFn: async () => {
      const response = await apiClient.get('/api/v1/drivers', { params });
      return response.data?.data || [];
    }
  });
};

export const useDriver = (id) => {
  return useQuery({
    queryKey: ['driver', id],
    queryFn: async () => {
      const response = await apiClient.get(`/api/v1/drivers/${id}`);
      return response.data?.data || response.data;
    },
    enabled: !!id
  });
};

export const useCreateDriver = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (driver) => {
      const response = await apiClient.post('/api/v1/drivers', driver);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['drivers'] });
    }
  });
};

export const useUpdateDriver = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }) => {
      const response = await apiClient.put(`/api/v1/drivers/${id}`, data);
      return response.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['drivers'] });
      queryClient.invalidateQueries({ queryKey: ['driver', variables.id] });
    }
  });
};

export const useDeleteDriver = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id) => {
      const response = await apiClient.delete(`/api/v1/drivers/${id}`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['drivers'] });
    }
  });
};

// --- ORDERS SERVICE ---
export const useOrders = (params = { per_page: 1000 }) => {
  return useQuery({
    queryKey: ['orders', params],
    queryFn: async () => {
      const response = await apiClient.get('/api/v1/orders', { params });
      return response.data?.data || [];
    }
  });
};

export const useOrder = (id) => {
  return useQuery({
    queryKey: ['order', id],
    queryFn: async () => {
      const response = await apiClient.get(`/api/v1/orders/${id}`);
      return response.data?.data || response.data;
    },
    enabled: !!id
  });
};

export const useCreateOrder = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (order) => {
      const response = await apiClient.post('/api/v1/orders', order);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
    }
  });
};

export const useUpdateOrder = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }) => {
      const response = await apiClient.put(`/api/v1/orders/${id}`, data);
      return response.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      queryClient.invalidateQueries({ queryKey: ['order', variables.id] });
    }
  });
};

export const useDeleteOrder = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id) => {
      const response = await apiClient.delete(`/api/v1/orders/${id}`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
    }
  });
};

// --- TRIPS SERVICE ---
export const useTrips = (params = { per_page: 1000 }) => {
  return useQuery({
    queryKey: ['trips', params],
    queryFn: async () => {
      const response = await apiClient.get('/api/v1/trips', { params });
      return response.data?.data || [];
    }
  });
};

export const useTrip = (id) => {
  return useQuery({
    queryKey: ['trip', id],
    queryFn: async () => {
      const response = await apiClient.get(`/api/v1/trips/${id}`);
      return response.data?.data || response.data;
    },
    enabled: !!id
  });
};

export const useCreateTrip = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (trip) => {
      const response = await apiClient.post('/api/v1/trips', trip);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trips'] });
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      queryClient.invalidateQueries({ queryKey: ['vehicles'] });
      queryClient.invalidateQueries({ queryKey: ['drivers'] });
    }
  });
};

export const useUpdateTrip = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }) => {
      const response = await apiClient.put(`/api/v1/trips/${id}`, data);
      return response.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['trips'] });
      queryClient.invalidateQueries({ queryKey: ['trip', variables.id] });
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      queryClient.invalidateQueries({ queryKey: ['vehicles'] });
      queryClient.invalidateQueries({ queryKey: ['drivers'] });
      queryClient.invalidateQueries({ queryKey: ['finances'] });
    }
  });
};

export const useDeleteTrip = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id) => {
      const response = await apiClient.delete(`/api/v1/trips/${id}`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trips'] });
    }
  });
};

// --- FINANCES SERVICE ---
export const useFinances = (params = { per_page: 1000 }) => {
  return useQuery({
    queryKey: ['finances', params],
    queryFn: async () => {
      const response = await apiClient.get('/api/v1/finances', { params });
      return response.data?.data || [];
    }
  });
};

export const useFinance = (id) => {
  return useQuery({
    queryKey: ['finance', id],
    queryFn: async () => {
      const response = await apiClient.get(`/api/v1/finances/${id}`);
      return response.data?.data || response.data;
    },
    enabled: !!id
  });
};

export const useCreateFinance = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (finance) => {
      const response = await apiClient.post('/api/v1/finances', finance);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['finances'] });
    }
  });
};

export const useUpdateFinance = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }) => {
      const response = await apiClient.put(`/api/v1/finances/${id}`, data);
      return response.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['finances'] });
      queryClient.invalidateQueries({ queryKey: ['finance', variables.id] });
    }
  });
};

export const useDeleteFinance = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id) => {
      const response = await apiClient.delete(`/api/v1/finances/${id}`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['finances'] });
    }
  });
};
