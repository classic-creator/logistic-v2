import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Provider } from 'react-redux';
import store from './redux/store';

// Layout & Auth
import DashboardLayout from './components/layout/DashboardLayout';
import Login from './features/auth/Login';

// Pages
import Dashboard from './features/dashboard/Dashboard';
import CompanyList from './features/companies/CompanyList';
import VehicleList from './features/vehicles/VehicleList';
import VehicleDetail from './features/vehicles/VehicleDetail';
import DriverList from './features/drivers/DriverList';
import DriverDetail from './features/drivers/DriverDetail';
import OrderList from './features/orders/OrderList';
import TripList from './features/trips/TripList';
import DriverTripWorkflow from './features/trips/DriverTripWorkflow';
import FinanceList from './features/finance/FinanceList';
import ReportsDashboard from './features/reports/ReportsDashboard';

// Initialize React Query Client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: false,
    },
  },
});

export const App = () => {
  return (
    <Provider store={store}>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <Routes>
            {/* Unauthenticated Route */}
            <Route path="/login" element={<Login />} />

            {/* Authenticated Application Shell */}
            <Route path="/" element={<DashboardLayout />}>
              <Route index element={<Navigate to="/dashboard" replace />} />
              <Route path="dashboard" element={<Dashboard />} />
              <Route path="companies" element={<CompanyList />} />
              
              <Route path="vehicles" element={<VehicleList />} />
              <Route path="vehicles/:id" element={<VehicleDetail />} />

              <Route path="drivers" element={<DriverList />} />
              <Route path="drivers/:id" element={<DriverDetail />} />

              <Route path="orders" element={<OrderList />} />
              
              <Route path="trips" element={<TripList />} />
              <Route path="driver-trip" element={<DriverTripWorkflow />} />
              <Route path="driver-profile" element={<DriverDetail />} />

              <Route path="finance" element={<FinanceList />} />
              <Route path="reports" element={<ReportsDashboard />} />
            </Route>

            {/* Fallback Catch-all Route */}
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </BrowserRouter>
      </QueryClientProvider>
    </Provider>
  );
};

export default App;
