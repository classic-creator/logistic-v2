import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Bell, CheckCheck, Trash2, Archive, Search, Filter, AlertOctagon, 
  AlertTriangle, Info, CheckCircle2, Settings, Zap, Clock, ExternalLink, RefreshCw, Activity 
} from 'lucide-react';
import NotificationAuditLogs from './NotificationAuditLogs';
import NotificationPreferencesModal from './NotificationPreferencesModal';

export const NotificationCenter = ({ isOpen, onClose, onUnreadCountChange }) => {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('all'); // all, unread, critical, audit
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showPreferences, setShowPreferences] = useState(false);

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      let url = `/api/v1/notifications?status=${activeTab === 'unread' ? 'unread' : 'all'}`;
      if (selectedCategory !== 'all') url += `&category=${selectedCategory}`;
      if (searchQuery) url += `&search=${encodeURIComponent(searchQuery)}`;
      if (activeTab === 'critical') url += `&priority=critical`;

      const res = await api.get(url);
      if (res.data?.status === 'success' || Array.isArray(res.data?.data)) {
        const list = res.data?.data || [];
        setNotifications(list);
        const count = res.data?.unreadCount ?? res.data?.unread_count ?? list.filter(n => !n.readAt && !n.read_at).length;
        if (onUnreadCountChange && typeof count === 'number') {
          onUnreadCountChange(count);
        }
      }
    } catch (e) {
      console.error('Error fetching notifications:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchNotifications();
    }
  }, [isOpen, activeTab, selectedCategory, searchQuery]);

  const handleMarkRead = async (id, e) => {
    if (e) e.stopPropagation();
    try {
      await api.patch(`/api/v1/notifications/${id}/read`);
      fetchNotifications();
    } catch (err) {
      console.error('Failed to mark read:', err);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await api.post('/api/v1/notifications/mark-all-read');
      fetchNotifications();
    } catch (err) {
      console.error('Failed to mark all read:', err);
    }
  };

  const handleDelete = async (id, e) => {
    if (e) e.stopPropagation();
    try {
      await api.delete(`/api/v1/notifications/${id}`);
      fetchNotifications();
    } catch (err) {
      console.error('Failed to delete notification:', err);
    }
  };

  const handleTriggerTestEvent = async (eventType) => {
    try {
      await api.post('/api/v1/notifications/trigger-test-event', { event_type: eventType });
      setTimeout(fetchNotifications, 400);
    } catch (err) {
      console.error('Test event trigger error:', err);
    }
  };

  const handleNotificationClick = (notif) => {
    if (!notif.readAt && !notif.read_at) {
      handleMarkRead(notif.id);
    }
    const targetLink = notif.deepLink || notif.deep_link;
    if (targetLink) {
      onClose();
      navigate(targetLink);
    }
  };

  const getPriorityBadge = (priority) => {
    switch (priority) {
      case 'critical':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-rose-500/20 text-rose-300 border border-rose-500/40 shadow-sm shadow-rose-500/30 animate-pulse">
            <AlertOctagon size={10} /> Critical
          </span>
        );
      case 'high':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider bg-amber-500/20 text-amber-300 border border-amber-500/40">
            <AlertTriangle size={10} /> High
          </span>
        );
      case 'medium':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-semibold uppercase tracking-wider bg-indigo-500/20 text-indigo-300 border border-indigo-500/40">
            <Info size={10} /> Medium
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-medium uppercase tracking-wider bg-slate-800 text-slate-400 border border-slate-700">
            <CheckCircle2 size={10} /> Low
          </span>
        );
    }
  };

  const getCategoryIcon = (category) => {
    switch (category) {
      case 'trip': return <span className="p-2 rounded-xl bg-indigo-500/20 text-indigo-400 font-bold text-xs">TRIP</span>;
      case 'vehicle': return <span className="p-2 rounded-xl bg-rose-500/20 text-rose-400 font-bold text-xs">FLEET</span>;
      case 'fuel': return <span className="p-2 rounded-xl bg-amber-500/20 text-amber-400 font-bold text-xs">FUEL</span>;
      case 'finance': return <span className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400 font-bold text-xs">FIN</span>;
      default: return <span className="p-2 rounded-xl bg-blue-500/20 text-blue-400 font-bold text-xs">SYS</span>;
    }
  };

  const formatRelativeTime = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const now = new Date();
    const diffSecs = Math.floor((now - date) / 1000);
    if (diffSecs < 60) return 'Just now';
    if (diffSecs < 3600) return `${Math.floor(diffSecs / 60)}m ago`;
    if (diffSecs < 86400) return `${Math.floor(diffSecs / 3600)}h ago`;
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex justify-end">
        <motion.div
          initial={{ x: '100%' }}
          animate={{ x: 0 }}
          exit={{ x: '100%' }}
          transition={{ type: 'spring', damping: 25, stiffness: 200 }}
          className="w-full max-w-md bg-slate-900 border-l border-slate-800 h-full flex flex-col shadow-2xl overflow-hidden"
        >
          {/* Top Header */}
          <div className="px-5 py-4 border-b border-slate-800 bg-slate-950 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-indigo-600/20 border border-indigo-500/30 text-indigo-400">
                <Bell size={18} />
              </div>
              <div>
                <h3 className="text-xs font-bold text-slate-100 uppercase tracking-wider font-display">Notification Center</h3>
                <p className="text-[10px] text-slate-500 font-medium">Master ERP Communication Engine</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowPreferences(true)}
                className="p-2 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                title="Notification Settings"
              >
                <Settings size={16} />
              </button>
              <button
                onClick={onClose}
                className="p-2 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
              >
                ✕
              </button>
            </div>
          </div>

          {/* Quick Event Simulation Toolbar */}
          <div className="px-4 py-2 bg-slate-950/80 border-b border-slate-850 flex items-center gap-2 overflow-x-auto text-[10px]">
            <span className="text-slate-500 font-bold uppercase tracking-wider flex items-center gap-1 shrink-0">
              <Zap size={12} className="text-amber-400" /> Sim:
            </span>
            <button
              onClick={() => handleTriggerTestEvent('vehicle_breakdown')}
              className="px-2 py-1 bg-rose-500/20 border border-rose-500/40 text-rose-300 rounded hover:bg-rose-500/30 shrink-0 cursor-pointer font-semibold"
            >
              + Breakdown Alert
            </button>
            <button
              onClick={() => handleTriggerTestEvent('trip_started')}
              className="px-2 py-1 bg-indigo-500/20 border border-indigo-500/40 text-indigo-300 rounded hover:bg-indigo-500/30 shrink-0 cursor-pointer font-semibold"
            >
              + Trip Started
            </button>
            <button
              onClick={() => handleTriggerTestEvent('fuel_approved')}
              className="px-2 py-1 bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 rounded hover:bg-emerald-500/30 shrink-0 cursor-pointer font-semibold"
            >
              + Fuel Approved
            </button>
          </div>

          {/* Tabs */}
          <div className="flex border-b border-slate-800 bg-slate-900/60 px-4 text-xs font-semibold">
            {[
              { id: 'all', label: 'All Notifications' },
              { id: 'unread', label: 'Unread' },
              { id: 'critical', label: 'Critical' },
              { id: 'audit', label: 'Delivery Logs' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-3 px-3 border-b-2 transition-all cursor-pointer ${
                  activeTab === tab.id
                    ? 'border-indigo-500 text-indigo-400 font-bold'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Search & Category Filter */}
          {activeTab !== 'audit' && (
            <div className="p-3 border-b border-slate-850 space-y-2 bg-slate-950/40">
              <div className="relative">
                <Search size={14} className="absolute left-3 top-2.5 text-slate-500" />
                <input
                  type="text"
                  placeholder="Search notifications..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500/50"
                />
              </div>

              <div className="flex gap-1.5 overflow-x-auto text-[11px]">
                {['all', 'trip', 'vehicle', 'fuel', 'finance', 'system'].map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-2.5 py-1 rounded-lg uppercase tracking-wider font-semibold transition-all cursor-pointer ${
                      selectedCategory === cat
                        ? 'bg-indigo-600 text-white shadow-sm'
                        : 'bg-slate-850 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Main Content Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {activeTab === 'audit' ? (
              <NotificationAuditLogs />
            ) : loading ? (
              <div className="py-20 text-center text-slate-500 text-xs">Loading notifications...</div>
            ) : notifications.length > 0 ? (
              notifications.map((n) => (
                <div
                  key={n.id}
                  onClick={() => handleNotificationClick(n)}
                  className={`p-3.5 rounded-2xl border transition-all cursor-pointer relative group ${
                    !(n.readAt || n.read_at)
                      ? 'bg-slate-850/80 border-indigo-500/40 shadow-lg shadow-indigo-950/20'
                      : 'bg-slate-900/40 border-slate-800/80 opacity-75 hover:opacity-100'
                  }`}
                >
                  <div className="flex gap-3">
                    {getCategoryIcon(n.category)}

                    <div className="flex-1 space-y-1">
                      <div className="flex items-center justify-between gap-2">
                        <h4 className="text-xs font-bold text-slate-100 leading-tight">
                          {n.title}
                        </h4>
                        {getPriorityBadge(n.priority)}
                      </div>

                      <p className="text-xs text-slate-300 leading-relaxed">
                        {n.body}
                      </p>

                      <div className="flex items-center justify-between pt-1 text-[10px] text-slate-500">
                        <span className="flex items-center gap-1 font-medium">
                          <Clock size={10} /> {formatRelativeTime(n.createdAt || n.created_at)}
                        </span>

                        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          {!(n.readAt || n.read_at) && (
                            <button
                              onClick={(e) => handleMarkRead(n.id, e)}
                              className="text-indigo-400 hover:text-indigo-300 font-semibold cursor-pointer"
                            >
                              Mark Read
                            </button>
                          )}
                          <button
                            onClick={(e) => handleDelete(n.id, e)}
                            className="text-rose-400 hover:text-rose-300 cursor-pointer"
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="py-20 text-center text-slate-500 text-xs font-medium">
                No notifications match your current filter.
              </div>
            )}
          </div>

          {/* Bottom Toolbar */}
          {activeTab !== 'audit' && (
            <div className="px-4 py-3 bg-slate-950 border-t border-slate-800 flex justify-between items-center text-xs">
              <button
                onClick={handleMarkAllRead}
                className="text-indigo-400 hover:text-indigo-300 font-bold flex items-center gap-1.5 cursor-pointer"
              >
                <CheckCheck size={14} /> Mark All as Read
              </button>
              <button
                onClick={fetchNotifications}
                className="text-slate-400 hover:text-slate-200 flex items-center gap-1 cursor-pointer"
              >
                <RefreshCw size={12} /> Refresh
              </button>
            </div>
          )}

          {/* Settings Modal */}
          <NotificationPreferencesModal
            isOpen={showPreferences}
            onClose={() => setShowPreferences(false)}
          />
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default NotificationCenter;
