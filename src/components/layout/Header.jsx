import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { Bell, Menu, User, Shield, Info, AlertTriangle, AlertOctagon, CheckCircle2, LogOut } from 'lucide-react';
import { setRole, logout } from '../../redux/authSlice';
import { toggleSidebar, markAllRead, clearNotifications } from '../../redux/uiSlice';
import { motion, AnimatePresence } from 'framer-motion';
import { NotificationBell } from '../notifications/NotificationBell';
import { NotificationCenter } from '../notifications/NotificationCenter';

export const Header = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user, currentRole, availableRoles } = useSelector((state) => state.auth);
  const { notifications, sidebarOpen } = useSelector((state) => state.ui);
  
  const [showRoles, setShowRoles] = useState(false);
  const [showNotif, setShowNotif] = useState(false);
  const [showProfile, setShowProfile] = useState(false);

  const unreadCount = notifications.filter(n => !n.read).length;

  const getNotifIcon = (type) => {
    switch (type) {
      case 'warning': return <AlertTriangle size={16} className="text-accent-amber" />;
      case 'error': return <AlertOctagon size={16} className="text-accent-rose animate-pulse" />;
      case 'info': return <Info size={16} className="text-accent-sky" />;
      default: return <CheckCircle2 size={16} className="text-accent-emerald" />;
    }
  };

  const handleLogout = async () => {
    try {
      const { logoutApi } = await import('../../services/authServices');
      await logoutApi();
    } catch (error) {
      console.error('Logout failed on backend:', error);
    } finally {
      localStorage.removeItem('ltms_token');
      localStorage.removeItem('ltms_role');
      localStorage.removeItem('ltms_driver_id');
      dispatch(logout());
      navigate('/login');
    }
  };

  const [showNotifCenter, setShowNotifCenter] = useState(false);
  const [liveUnreadCount, setLiveUnreadCount] = useState(0);

  const fetchUnreadCount = async () => {
    try {
      const { default: api } = await import('../../services/api');
      const res = await api.get('/api/v1/notifications/unread-count');
      if (res.data?.status === 'success' || typeof res.data?.unreadCount === 'number') {
        setLiveUnreadCount(res.data?.unreadCount ?? res.data?.unread_count ?? 0);
      }
    } catch (e) {
      setLiveUnreadCount(notifications.filter(n => !n.read).length);
    }
  };

  React.useEffect(() => {
    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, 15000); // 15s polling for real-time unread updates
    return () => clearInterval(interval);
  }, []);

  return (
    <header className="h-16 border-b border-slate-800 bg-slate-900/40 backdrop-blur-md px-6 flex items-center justify-between z-30 sticky top-0">
      {/* Left section: Collapse Toggle & App Info */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => dispatch(toggleSidebar())}
          className="text-slate-400 hover:text-slate-100 p-2 hover:bg-slate-800/80 rounded-lg transition-colors cursor-pointer"
        >
          <Menu size={20} />
        </button>
        <div>
          <h2 className="text-sm font-semibold text-slate-200 uppercase tracking-wider font-display">
            Logistics Transport MS
          </h2>
          <p className="text-[10px] text-slate-500 font-bold -mt-0.5">
            PARTNER VENTURES PORTAL
          </p>
        </div>
      </div>

      {/* Right section: Role switcher, Notifications, Profile */}
      <div className="flex items-center gap-4">
        
        {/* Static Role Display */}
        <div className="relative">
          <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-800 text-xs font-semibold rounded-lg text-slate-200 border border-slate-700 select-none">
            <Shield size={14} className="text-indigo-400" />
            <span>Role: {currentRole}</span>
          </div>
        </div>

        {/* Master Notification Bell & Center */}
        <NotificationBell
          unreadCount={liveUnreadCount}
          onTogglePanel={() => setShowNotifCenter(!showNotifCenter)}
        />

        <NotificationCenter
          isOpen={showNotifCenter}
          onClose={() => setShowNotifCenter(false)}
          onUnreadCountChange={(count) => setLiveUnreadCount(count)}
        />

        {/* Vertical Divider */}
        <div className="h-6 w-px bg-slate-800" />

        {/* User profile capsule */}
        <div className="relative">
          <button
            onClick={() => { setShowProfile(!showProfile); setShowRoles(false); setShowNotif(false); }}
            className="flex items-center gap-2 select-none hover:opacity-80 transition-opacity cursor-pointer focus:outline-none"
          >
            <img
              src={user.avatar}
              alt={user.name}
              className="w-8 h-8 rounded-full border border-slate-700 object-cover"
            />
            <div className="hidden md:block text-left">
              <h4 className="text-xs font-bold text-slate-300">{user.name}</h4>
              <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">{currentRole}</span>
            </div>
          </button>

          <AnimatePresence>
            {showProfile && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setShowProfile(false)} />
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  className="absolute right-0 mt-2 w-48 bg-slate-900 border border-slate-800 rounded-xl shadow-2xl py-2 z-20"
                >
                  <div className="px-4 py-2 border-b border-slate-800 mb-1">
                    <span className="text-xs font-bold text-slate-200 block">{user.name}</span>
                    <span className="text-[10px] text-slate-400 block truncate">{user.email || 'operator@logistics.com'}</span>
                  </div>
                  <button
                    onClick={handleLogout}
                    className="w-full text-left px-4 py-2 text-xs font-medium text-accent-rose hover:bg-slate-800 transition-colors flex items-center gap-2 cursor-pointer"
                  >
                    <LogOut size={14} />
                    <span>Sign Out</span>
                  </button>
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>

      </div>
    </header>
  );
};

export default Header;
