import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Provider, useDispatch, useSelector } from 'react-redux';
import { setAuthInitialized, setRole, setUser } from './redux/authSlice';
import store from './redux/store';

// Layout & Auth (eager — shell required immediately)
import DashboardLayout from './components/layout/DashboardLayout';
import Login from './features/auth/Login';

// Pages (code-split for faster initial load)
const Dashboard = lazy(() => import('./features/dashboard/Dashboard'));
const CompanyList = lazy(() => import('./features/companies/CompanyList'));
const CompanyDetail = lazy(() => import('./features/companies/CompanyDetail'));
const VehicleList = lazy(() => import('./features/vehicles/VehicleList'));
const VehicleDetail = lazy(() => import('./features/vehicles/VehicleDetail'));
const DriverList = lazy(() => import('./features/drivers/DriverList'));
const DriverDetail = lazy(() => import('./features/drivers/DriverDetail'));
const OrderList = lazy(() => import('./features/orders/OrderList'));
const TripList = lazy(() => import('./features/trips/TripList'));
const TripDetail = lazy(() => import('./features/trips/TripDetail'));
const DriverTripWorkflow = lazy(() => import('./features/trips/DriverTripWorkflow'));
const FinanceList = lazy(() => import('./features/finance/FinanceList'));

// Fuel Intelligence System
const FuelDashboard = lazy(() => import('./features/fuel/FuelDashboard'));
const FuelVarianceAnalysis = lazy(() => import('./features/fuel/FuelVarianceAnalysis'));
const FuelScoreboard = lazy(() => import('./features/fuel/FuelScoreboard'));
const FuelPredictionCenter = lazy(() => import('./features/fuel/FuelPredictionCenter'));
const FuelLearningInsights = lazy(() => import('./features/fuel/FuelLearningInsights'));
const FuelAnalytics = lazy(() => import('./features/fuel/FuelAnalytics'));
const FuelPrices = lazy(() => import('./features/fuel/FuelPrices'));
const DriverFuelLog = lazy(() => import('./features/fuel/DriverFuelLog'));

// Reports module (each page split into its own chunk)
const ReportsLayout = lazy(() => import('./features/reports/ReportsLayout'));
const ExecutiveDashboard = lazy(() => import('./features/reports/pages/ExecutiveDashboard'));
const TripAnalytics = lazy(() => import('./features/reports/pages/TripAnalytics'));
const VehicleAnalytics = lazy(() => import('./features/reports/pages/VehicleAnalytics'));
const DriverAnalytics = lazy(() => import('./features/reports/pages/DriverAnalytics'));
const CompanyAnalytics = lazy(() => import('./features/reports/pages/CompanyAnalytics'));
const RevenueAnalytics = lazy(() => import('./features/reports/pages/RevenueAnalytics'));
const ExpenseAnalytics = lazy(() => import('./features/reports/pages/ExpenseAnalytics'));
const ProfitAnalytics = lazy(() => import('./features/reports/pages/ProfitAnalytics'));
const FleetAnalytics = lazy(() => import('./features/reports/pages/FleetAnalytics'));
const DriverUtilizationAnalytics = lazy(() => import('./features/reports/pages/DriverUtilizationAnalytics'));
const RouteAnalytics = lazy(() => import('./features/reports/pages/RouteAnalytics'));
const ComparisonReports = lazy(() => import('./features/reports/pages/ComparisonReports'));

// Initialize React Query Client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: false,
    },
  },
});

// Shared loading fallback for lazy chunks
const PageFallback = () => (
  <div className="min-h-[50vh] flex items-center justify-center">
    <div className="flex flex-col items-center gap-3">
      <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      <span className="text-xs text-slate-500 font-semibold uppercase tracking-wider">Loading…</span>
    </div>
  </div>
);


// Full screen auth loader
const AuthLoader = () => (
  <div className="min-h-screen bg-[#070a13] flex items-center justify-center">
    <div className="flex flex-col items-center gap-4">
      <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      <span className="text-sm text-slate-400 font-bold tracking-widest uppercase">Verifying Session...</span>
    </div>
  </div>
);

const AppContent = () => {
  const dispatch = useDispatch();
  const { isAuthInitialized } = useSelector((state) => state.auth);

  React.useEffect(() => {
    const initAuth = async () => {
      const token = localStorage.getItem('ltms_token');
      if (!token) {
        dispatch(setAuthInitialized(true));
        return;
      }

      try {
        const { verifyAuthApi } = await import('./services/authServices');
        const userData = await verifyAuthApi();
        
        // Restore role from local storage or default to Super Admin
        const storedRole = localStorage.getItem('ltms_role');
        const role = userData.role || storedRole || 'Super Admin';
        dispatch(setRole(role));
        dispatch(setUser(userData));
        
        const storedDriverId = localStorage.getItem('ltms_driver_id');
        if (role === 'Driver' && storedDriverId) {
          const { setActiveDriverId } = await import('./redux/authSlice');
          dispatch(setActiveDriverId(storedDriverId));
        }
        
      } catch (error) {
        console.error('Auth verification failed:', error);
        localStorage.removeItem('ltms_token');
        localStorage.removeItem('ltms_role');
        localStorage.removeItem('ltms_driver_id');
      } finally {
        dispatch(setAuthInitialized(true));
      }
    };

    initAuth();
  }, [dispatch]);

  if (!isAuthInitialized) {
    return <AuthLoader />;
  }

  return (
    <Suspense fallback={<PageFallback />}>
      <Routes>
        {/* Unauthenticated Route */}
        <Route path="/login" element={<Login />} />

        {/* Authenticated Application Shell */}
        <Route path="/" element={<DashboardLayout />}>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="companies" element={<CompanyList />} />
          <Route path="companies/:id" element={<CompanyDetail />} />

          <Route path="vehicles" element={<VehicleList />} />
          <Route path="vehicles/:id" element={<VehicleDetail />} />

          <Route path="drivers" element={<DriverList />} />
          <Route path="drivers/:id" element={<DriverDetail />} />

          <Route path="orders" element={<OrderList />} />

          <Route path="trips" element={<TripList />} />
          <Route path="trips/:id" element={<TripDetail />} />
          <Route path="driver-trip" element={<DriverTripWorkflow />} />
          <Route path="driver-profile" element={<DriverDetail />} />

          {/* Fuel Intelligence System */}
          <Route path="fuel" element={<FuelDashboard />} />
          <Route path="fuel/variance" element={<FuelVarianceAnalysis />} />
          <Route path="fuel/scores" element={<FuelScoreboard />} />
          <Route path="fuel/predictions" element={<FuelPredictionCenter />} />
          <Route path="fuel/learning" element={<FuelLearningInsights />} />
          <Route path="fuel/analytics" element={<Navigate to="/fuel" replace />} />
          <Route path="fuel/prices" element={<Navigate to="/fuel" replace />} />
          <Route path="fuel/log" element={<DriverFuelLog />} />

          <Route path="finance" element={<FinanceList />} />

          {/* BI Reports — nested under shared layout */}
          <Route path="reports" element={<ReportsLayout />}>
            <Route index element={<ExecutiveDashboard />} />
            <Route path="trips" element={<TripAnalytics />} />
            <Route path="vehicles" element={<VehicleAnalytics />} />
            <Route path="drivers" element={<DriverAnalytics />} />
            <Route path="companies" element={<CompanyAnalytics />} />
            <Route path="revenue" element={<RevenueAnalytics />} />
            <Route path="expenses" element={<ExpenseAnalytics />} />
            <Route path="profit" element={<ProfitAnalytics />} />
            <Route path="fleet" element={<FleetAnalytics />} />
            <Route path="driver-utilization" element={<DriverUtilizationAnalytics />} />
            <Route path="routes" element={<RouteAnalytics />} />
            <Route path="comparison" element={<ComparisonReports />} />
          </Route>
        </Route>

        {/* Fallback Catch-all Route */}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </Suspense>
  );
};

export const App = () => {
  return (
    <Provider store={store}>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <AppContent />
        </BrowserRouter>
      </QueryClientProvider>
    </Provider>
  );
};

export default App;
