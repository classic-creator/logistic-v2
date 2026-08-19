import { useMutation } from '@tanstack/react-query';
import apiClient from './api';

export const useParseTransportDocument = () => {
  return useMutation({
    mutationFn: async (formData) => {
      const response = await apiClient.post('/api/v1/trips/parse-document', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data?.data;
    },
  });
};
