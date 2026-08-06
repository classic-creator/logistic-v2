import api from './api';
import { useQuery, useMutation } from '@tanstack/react-query';

// Intelligence Dashboard
export const useIntelligenceOverview = () => useQuery({
  queryKey: ['intelligence', 'overview'],
  queryFn: () => api.get('/api/v1/fuel/intelligence/overview').then(r => r.data?.data),
  refetchInterval: 30000, // Refresh every 30s
});

export const useIntelligenceService = useIntelligenceOverview;

export const usePredictionHistory = (params = {}) => useQuery({
  queryKey: ['intelligence', 'predictions', params],
  queryFn: () => api.get('/api/v1/fuel/intelligence/predictions', { params }).then(r => r.data?.data),
});

export const useRecommendations = () => useQuery({
  queryKey: ['intelligence', 'recommendations'],
  queryFn: () => api.get('/api/v1/fuel/intelligence/recommendations').then(r => r.data?.data || []),
});

export const useLearningStatus = () => useQuery({
  queryKey: ['intelligence', 'learning'],
  queryFn: () => api.get('/api/v1/fuel/intelligence/learning').then(r => r.data?.data),
});

export const useFuelScores = () => useQuery({
  queryKey: ['intelligence', 'scores'],
  queryFn: () => api.get('/api/v1/fuel/intelligence/scores').then(r => r.data?.data),
});

export const useVarianceAnalysis = () => useQuery({
  queryKey: ['intelligence', 'variance'],
  queryFn: () => api.get('/api/v1/fuel/intelligence/variance').then(r => r.data?.data),
});

export const useRouteIntelligence = () => useQuery({
  queryKey: ['intelligence', 'routes'],
  queryFn: () => api.get('/api/v1/fuel/intelligence/routes').then(r => r.data?.data || []),
});

export const useCustomerIntelligence = () => useQuery({
  queryKey: ['intelligence', 'customers'],
  queryFn: () => api.get('/api/v1/fuel/intelligence/customers').then(r => r.data?.data || []),
});

export const usePredictOnDemand = () => useMutation({
  mutationFn: (data) => api.post('/api/v1/fuel/intelligence/predict', data).then(r => r.data?.data),
});

export const useRecommendOnDemand = () => useMutation({
  mutationFn: (data) => api.post('/api/v1/fuel/intelligence/recommend', data).then(r => r.data?.data),
});

export const useAnomalyDashboard = () => useQuery({
  queryKey: ['intelligence', 'anomalies'],
  queryFn: () => api.get('/api/v1/fuel/intelligence/anomalies').then(r => r.data?.data),
});
