import { useMutation, useQuery } from '@tanstack/react-query';
import apiClient from './api';

export const verifyAuthApi = async () => {
  const response = await apiClient.get('/api/v1/auth/me');
  return response.data?.data || response.data;
};

export const logoutApi = async () => {
  const response = await apiClient.post('/api/v1/auth/logout');
  return response.data;
};

// We expose standard hooks for components that need them (though logout might be called imperatively)
export const useLogout = () => {
  return useMutation({
    mutationFn: logoutApi,
  });
};
