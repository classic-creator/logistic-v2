import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Provider } from 'react-redux';
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

export const App = () => {
  return (
    <Provider store={store}>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
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
                <Route path="fuel/analytics" element={<FuelAnalytics />} />
                <Route path="fuel/prices" element={<FuelPrices />} />
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
        </BrowserRouter>
      </QueryClientProvider>
    </Provider>
  );
};

export default App;
