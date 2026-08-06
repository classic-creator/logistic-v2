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
  TrendingDown,
  Award,
  Target,
  Brain,
} from 'lucide-react';

export const Sidebar = () => {
  const { currentRole } = useSelector((state) => state.auth);
  const { sidebarOpen } = useSelector((state) => state.ui);

  // Grouped navigation structure
  const menuGroups = [
    {
      title: 'Core & Fleet',
      roles: ['Super Admin', 'Operations Manager', 'Dispatcher', 'Finance Manager'],
      items: [
        {
          path: '/dashboard',
          label: 'Control Console',
          icon: LayoutDashboard,
          roles: ['Super Admin', 'Operations Manager', 'Dispatcher', 'Finance Manager'],
        },
        {
          path: '/companies',
          label: 'Company Accounts',
          icon: Building2,
          roles: ['Super Admin', 'Operations Manager', 'Dispatcher', 'Finance Manager'],
        },
        {
          path: '/vehicles',
          label: 'Fleet Vehicles',
          icon: Truck,
          roles: ['Super Admin', 'Operations Manager'],
        },
        {
          path: '/drivers',
          label: 'Driver Crew',
          icon: Users,
          roles: ['Super Admin', 'Operations Manager'],
        },
      ],
    },
    {
      title: 'Dispatches & Ops',
      roles: ['Super Admin', 'Operations Manager', 'Dispatcher'],
      items: [
        {
          path: '/orders',
          label: 'Orders Desk',
          icon: FileText,
          roles: ['Super Admin', 'Operations Manager', 'Dispatcher'],
        },
        {
          path: '/trips',
          label: 'Dispatches & Trips',
          icon: Navigation,
          roles: ['Super Admin', 'Operations Manager', 'Dispatcher'],
        },
      ],
    },
    {
      title: 'Fuel Intelligence',
      roles: ['Super Admin', 'Operations Manager', 'Finance Manager'],
      items: [
        {
          path: '/fuel',
          label: 'Intelligence Hub',
          icon: Fuel,
          roles: ['Super Admin', 'Operations Manager', 'Finance Manager'],
        },
        {
          path: '/fuel/variance',
          label: 'Variance Analysis',
          icon: TrendingDown,
          roles: ['Super Admin', 'Operations Manager', 'Finance Manager'],
        },
        {
          path: '/fuel/scores',
          label: 'Fuel Scoreboard',
          icon: Award,
          roles: ['Super Admin', 'Operations Manager', 'Finance Manager'],
        },
        {
          path: '/fuel/predictions',
          label: 'Prediction Center',
          icon: Target,
          roles: ['Super Admin', 'Operations Manager', 'Finance Manager'],
        },
        {
          path: '/fuel/learning',
          label: 'Learning Insights',
          icon: Brain,
          roles: ['Super Admin', 'Operations Manager', 'Finance Manager'],
        },
      ],
    },
    {
      title: 'Finance & BI',
      roles: ['Super Admin', 'Finance Manager', 'Operations Manager'],
      items: [
        {
          path: '/finance',
          label: 'Finance Ledger',
          icon: Coins,
          roles: ['Super Admin', 'Finance Manager'],
        },
        {
          path: '/reports',
          label: 'BI Reports',
          icon: BarChart3,
          roles: ['Super Admin', 'Operations Manager', 'Finance Manager'],
        },
      ],
    },
    {
      title: 'Driver Portal',
      roles: ['Driver'],
      items: [
        {
          path: '/driver-trip',
          label: 'My Active Trip',
          icon: ClipboardCheck,
          roles: ['Driver'],
        },
        {
          path: '/fuel/log',
          label: 'Fuel Receipt Log',
          icon: Fuel,
          roles: ['Driver'],
        },
        {
          path: '/driver-profile',
          label: 'My Profile',
          icon: UserCircle,
          roles: ['Driver'],
        },
      ],
    },
  ];

  return (
    <motion.aside
      animate={{ width: sidebarOpen ? 240 : 70 }}
      transition={{ type: 'spring', damping: 20, stiffness: 200 }}
      className="h-screen bg-slate-900 border-r border-slate-800 flex flex-col z-40 fixed left-0 top-0 pt-16 select-none"
    >
      {/* Scrollable Navigation Links */}
      <nav className="flex-1 px-3 py-4 space-y-5 overflow-y-auto overflow-x-hidden custom-scrollbar">
        {menuGroups.map((group, groupIdx) => {
          const visibleItems = group.items.filter((item) => item.roles.includes(currentRole));

          if (visibleItems.length === 0) return null;

          return (
            <div key={groupIdx} className="space-y-1">
              {/* Group Section Header */}
              {sidebarOpen ? (
                <div className="px-3 pb-1 text-[10px] font-extrabold uppercase tracking-widest text-slate-500 flex items-center justify-between">
                  <span>{group.title}</span>
                </div>
              ) : (
                groupIdx > 0 && <div className="my-2 border-t border-slate-800/80 mx-2" />
              )}

              {/* Group Items */}
              <div className="space-y-1">
                {visibleItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <NavLink
                      key={item.path}
                      to={item.path}
                      className={({ isActive }) => `
                        flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-semibold transition-all duration-150 group cursor-pointer
                        ${
                          isActive
                            ? 'bg-accent-indigo text-white shadow-lg shadow-indigo-500/10'
                            : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                        }
                      `}
                    >
                      <div className="flex-shrink-0">
                        <Icon size={18} className="stroke-[2px]" />
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
              </div>
            </div>
          );
        })}
      </nav>

      {/* Version identifier footer */}
      {sidebarOpen && (
        <div className="p-3 border-t border-slate-800/80 bg-slate-950/40 text-[10px] text-slate-500 font-bold uppercase tracking-widest text-center select-none">
          LTMS Enterprise • v2.6.0
        </div>
      )}
    </motion.aside>
  );
};

export default Sidebar;
