import React from 'react';
import { Outlet, Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import Header from './Header';
import Sidebar from './Sidebar';
import ErrorBoundary from '../common/ErrorBoundary';
import NotificationToastBanner from '../notifications/NotificationToastBanner';

export const DashboardLayout = () => {
  const { user } = useSelector((state) => state.auth);
  const { sidebarOpen } = useSelector((state) => state.ui);

  // Simple auth gate: if user is not loaded, redirect to login
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="min-h-screen bg-[#070a13] text-slate-100 flex flex-col relative">
      {/* Global Realtime Notification Alert Banner */}
      <NotificationToastBanner />

      {/* Sidebar Navigation */}
      <Sidebar />

      {/* Main Right Side Content */}
      <div 
        className="flex-1 flex flex-col transition-all duration-300"
        style={{ paddingLeft: sidebarOpen ? '240px' : '70px' }}
      >
        {/* Top Navbar */}
        <Header />

        {/* Content Wrapper */}
        <main className="flex-1 p-6 md:p-8 max-w-[1600px] w-full mx-auto space-y-8">
          <ErrorBoundary>
            <Outlet />
          </ErrorBoundary>
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
