import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertOctagon, AlertTriangle, Info, CheckCircle2, X, ExternalLink, ShieldAlert } from 'lucide-react';

export const NotificationToastBanner = () => {
  const navigate = useNavigate();
  const [toasts, setToasts] = useState([]);

  useEffect(() => {
    const handleErpAlert = (event) => {
      const detail = event.detail || {};
      const id = Date.now() + Math.random();
      const newToast = {
        id,
        title: detail.title || 'Logistics ERP Alert',
        body: detail.body || 'New enterprise business event generated.',
        priority: detail.priority || 'high',
        category: detail.category || 'system',
        deepLink: detail.deepLink || detail.deep_link || '/dashboard',
      };

      setToasts((prev) => [newToast, ...prev.slice(0, 3)]); // Keep max 4 visible toasts

      // Auto dismiss after 6 seconds
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, 6000);
    };

    window.addEventListener('erp-notification-alert', handleErpAlert);
    return () => window.removeEventListener('erp-notification-alert', handleErpAlert);
  }, []);

  const removeToast = (id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const handleToastClick = (toast) => {
    removeToast(toast.id);
    if (toast.deepLink) {
      navigate(toast.deepLink);
    }
  };

  const getPriorityStyle = (priority) => {
    switch (priority) {
      case 'critical':
        return {
          border: 'border-rose-500/80',
          bg: 'bg-slate-900/95',
          glow: 'shadow-[0_0_25px_rgba(244,63,94,0.35)]',
          badge: 'bg-rose-500/20 text-rose-300 border-rose-500/40',
          icon: <AlertOctagon className="text-rose-500 animate-pulse shrink-0" size={20} />
        };
      case 'high':
        return {
          border: 'border-amber-500/70',
          bg: 'bg-slate-900/95',
          glow: 'shadow-[0_0_20px_rgba(245,158,11,0.25)]',
          badge: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
          icon: <AlertTriangle className="text-amber-400 shrink-0" size={20} />
        };
      default:
        return {
          border: 'border-indigo-500/60',
          bg: 'bg-slate-900/95',
          glow: 'shadow-[0_0_20px_rgba(99,102,241,0.2)]',
          badge: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40',
          icon: <Info className="text-indigo-400 shrink-0" size={20} />
        };
    };
  };

  return (
    <div className="fixed top-20 right-6 z-50 flex flex-col gap-3 max-w-sm w-full pointer-events-none">
      <AnimatePresence>
        {toasts.map((toast) => {
          const style = getPriorityStyle(toast.priority);
          return (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, y: -20, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, x: 100, scale: 0.9 }}
              transition={{ type: 'spring', damping: 20, stiffness: 300 }}
              className={`pointer-events-auto p-4 rounded-2xl border ${style.border} ${style.bg} ${style.glow} backdrop-blur-md text-slate-100 flex gap-3 items-start relative group shadow-2xl`}
            >
              {style.icon}

              <div className="flex-1 space-y-1">
                <div className="flex items-center justify-between gap-2">
                  <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider border ${style.badge}`}>
                    {toast.category} • {toast.priority}
                  </span>
                  <span className="text-[10px] text-slate-400 font-medium">Realtime Alert</span>
                </div>

                <h4 className="text-xs font-bold text-slate-100 leading-tight">
                  {toast.title}
                </h4>

                <p className="text-xs text-slate-300 leading-relaxed">
                  {toast.body}
                </p>

                <div className="pt-1 flex items-center justify-between">
                  <button
                    onClick={() => handleToastClick(toast)}
                    className="text-[11px] font-bold text-indigo-400 hover:text-indigo-300 flex items-center gap-1 cursor-pointer"
                  >
                    <span>View Details</span>
                    <ExternalLink size={12} />
                  </button>
                </div>
              </div>

              <button
                onClick={() => removeToast(toast.id)}
                className="p-1 text-slate-500 hover:text-slate-300 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X size={14} />
              </button>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
};

export default NotificationToastBanner;
