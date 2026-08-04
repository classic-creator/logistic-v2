import React from 'react';
import { NavLink } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { motion } from 'framer-motion';
import {
  LayoutDashboard,
  Building2,
  Truck,
  Users,
  FileText,
  Navigation,
  Coins,
  BarChart3,
  ClipboardCheck,
  UserCircle,
  Fuel,
} from 'lucide-react';

export const Sidebar = () => {
  const { currentRole } = useSelector((state) => state.auth);
  const { sidebarOpen } = useSelector((state) => state.ui);

  // Define navigation items
  const menuItems = [
    { 
      path: '/dashboard', 
      label: 'Dashboard', 
      icon: LayoutDashboard, 
      roles: ['Super Admin', 'Operations Manager', 'Dispatcher', 'Finance Manager'] 
    },
    { 
      path: '/companies', 
      label: 'Company Mgmt', 
      icon: Building2, 
      roles: ['Super Admin', 'Operations Manager', 'Dispatcher', 'Finance Manager'] 
    },
    { 
      path: '/vehicles', 
      label: 'Vehicles', 
      icon: Truck, 
      roles: ['Super Admin', 'Operations Manager'] 
    },
    { 
      path: '/drivers', 
      label: 'Drivers', 
      icon: Users, 
      roles: ['Super Admin', 'Operations Manager'] 
    },
    { 
      path: '/orders', 
      label: 'Orders', 
      icon: FileText, 
      roles: ['Super Admin', 'Operations Manager', 'Dispatcher'] 
    },
    { 
      path: '/trips', 
      label: 'Trips (Core)', 
      icon: Navigation, 
      roles: ['Super Admin', 'Operations Manager', 'Dispatcher'] 
    },
    {
      path: '/driver-trip',
      label: 'My Trips',
      icon: ClipboardCheck,
      roles: ['Driver']
    },
    {
      path: '/fuel/log',
      label: 'Fuel Log',
      icon: Fuel,
      roles: ['Driver']
    },
    {
      path: '/driver-profile',
      label: 'My Profile',
      icon: UserCircle,
      roles: ['Driver']
    },
    {
      path: '/fuel',
      label: 'Fuel Intelligence',
      icon: Fuel,
      roles: ['Super Admin', 'Operations Manager', 'Finance Manager']
    },
    {
      path: '/finance',
      label: 'Finance Ledger',
      icon: Coins,
      roles: ['Super Admin', 'Finance Manager']
    },
    { 
      path: '/reports', 
      label: 'Reports & BI', 
      icon: BarChart3, 
      roles: ['Super Admin', 'Operations Manager', 'Finance Manager'] 
    },
  ];

  // Filter items matching currentRole permissions
  const filteredItems = menuItems.filter(item => item.roles.includes(currentRole));

  return (
    <motion.aside
      animate={{ width: sidebarOpen ? 240 : 70 }}
      transition={{ type: 'spring', damping: 20, stiffness: 200 }}
      className="h-screen bg-slate-900 border-r border-slate-800 flex flex-col z-40 fixed left-0 top-0 pt-16 select-none"
    >
      {/* Scrollable Navigation Links */}
      <nav className="flex-1 px-3 py-4 space-y-1.5 overflow-y-auto overflow-x-hidden">
        {filteredItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) => `
                flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-semibold transition-all duration-150 group cursor-pointer
                ${isActive 
                  ? 'bg-accent-indigo text-white shadow-lg shadow-indigo-500/10' 
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-850'}
              `}
            >
              <div className="flex-shrink-0">
                <Icon size={20} className="stroke-[2px]" />
              </div>
              
              {/* Hide labels if sidebar is collapsed */}
              {sidebarOpen && (
                <motion.span
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.15 }}
                  className="truncate"
                >
                  {item.label}
                </motion.span>
              )}
            </NavLink>
          );
        })}
      </nav>

      {/* Version identifier footer */}
      {sidebarOpen && (
        <div className="p-4 border-t border-slate-850/80 bg-slate-900/40 text-[10px] text-slate-500 font-bold uppercase tracking-widest text-center select-none">
          LTMS • Client v2.5.4
        </div>
      )}
    </motion.aside>
  );
};

export default Sidebar;
