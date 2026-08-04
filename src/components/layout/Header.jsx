import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { Bell, Menu, User, Shield, Info, AlertTriangle, AlertOctagon, CheckCircle2, LogOut } from 'lucide-react';
import { setRole, logout } from '../../redux/authSlice';
import { toggleSidebar, markAllRead, clearNotifications } from '../../redux/uiSlice';
import { motion, AnimatePresence } from 'framer-motion';

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

  const handleLogout = () => {
    localStorage.removeItem('ltms_token');
    dispatch(logout());
    navigate('/login');
  };

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
        
        {/* Testing Role Switcher HUD */}
        <div className="relative">
          <button
            onClick={() => { setShowRoles(!showRoles); setShowNotif(false); }}
            className="flex items-center gap-2 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-xs font-semibold rounded-lg text-slate-200 border border-slate-700 hover:border-slate-600 transition-all cursor-pointer select-none"
          >
            <Shield size={14} className="text-accent-indigo" />
            <span>Role: {currentRole}</span>
          </button>

          <AnimatePresence>
            {showRoles && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setShowRoles(false)} />
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  className="absolute right-0 mt-2 w-56 bg-slate-900 border border-slate-800 rounded-xl shadow-2xl py-2 z-20"
                >
                  <div className="px-3 py-1.5 border-b border-slate-800 mb-1">
                    <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest block">
                      Mock Role Switcher
                    </span>
                    <span className="text-[10px] text-slate-400">
                      Changes dashboard modules in real time
                    </span>
                  </div>
                  {availableRoles.map((role) => (
                    <button
                      key={role}
                      onClick={() => {
                        dispatch(setRole(role));
                        setShowRoles(false);
                      }}
                      className={`w-full text-left px-4 py-2 text-xs font-medium transition-colors hover:bg-slate-800 ${currentRole === role ? 'text-accent-indigo bg-indigo-500/5' : 'text-slate-400 hover:text-slate-200'}`}
                    >
                      {role}
                    </button>
                  ))}
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>

        {/* Notifications Dropdown */}
        <div className="relative">
          <button
            onClick={() => { setShowNotif(!showNotif); setShowRoles(false); }}
            className="relative text-slate-400 hover:text-slate-100 p-2 hover:bg-slate-800/80 rounded-lg transition-colors cursor-pointer"
          >
            <Bell size={20} />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 w-4 h-4 bg-accent-rose text-white text-[9px] font-bold flex items-center justify-center rounded-full border-2 border-slate-900 animate-pulse">
                {unreadCount}
              </span>
            )}
          </button>

          <AnimatePresence>
            {showNotif && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setShowNotif(false)} />
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  className="absolute right-0 mt-2 w-80 bg-slate-900 border border-slate-800 rounded-xl shadow-2xl z-20 overflow-hidden"
                >
                  <div className="px-4 py-3 border-b border-slate-850 bg-slate-900/80 flex justify-between items-center">
                    <span className="text-xs font-bold text-slate-200 font-display">System Notifications</span>
                    <button
                      onClick={() => dispatch(markAllRead())}
                      className="text-[10px] text-accent-indigo hover:text-indigo-400 font-semibold cursor-pointer"
                    >
                      Mark all read
                    </button>
                  </div>

                  <div className="max-h-60 overflow-y-auto divide-y divide-slate-850">
                    {notifications.length > 0 ? (
                      notifications.map((n) => (
                        <div
                          key={n.id}
                          className={`p-3 text-xs flex gap-3 hover:bg-slate-850/50 transition-colors ${n.read ? 'opacity-65' : ''}`}
                        >
                          <div className="mt-0.5">{getNotifIcon(n.type)}</div>
                          <div className="flex-1 space-y-1">
                            <p className="text-slate-300 font-medium leading-relaxed">{n.message}</p>
                            <span className="text-[10px] text-slate-500 font-medium block">{n.time}</span>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="py-8 text-center text-slate-500 text-xs font-medium">
                        No notifications found.
                      </div>
                    )}
                  </div>

                  <div className="px-4 py-2 bg-slate-950 border-t border-slate-850 flex justify-center">
                    <button
                      onClick={() => dispatch(clearNotifications())}
                      className="text-[10px] text-slate-400 hover:text-slate-300 font-medium cursor-pointer"
                    >
                      Clear all alerts
                    </button>
                  </div>
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>

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
