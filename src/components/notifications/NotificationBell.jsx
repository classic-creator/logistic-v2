import React, { useState, useEffect } from 'react';
import { Bell, Sparkles, Zap, Check, AlertCircle } from 'lucide-react';
import { pushNotificationService } from '../../services/pushNotificationService';
import api from '../../services/api';

export const NotificationBell = ({ onTogglePanel, unreadCount = 0 }) => {
  const [permissionState, setPermissionState] = useState('default');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [demoFiring, setDemoFiring] = useState(false);
  const [permissionNotice, setPermissionNotice] = useState('');

  useEffect(() => {
    setPermissionState(pushNotificationService.getPermissionState());
    pushNotificationService.registerServiceWorker().then((reg) => {
      // If permission is already granted, ensure we are subscribed to the backend!
      if (Notification.permission === 'granted' && reg) {
        reg.pushManager.getSubscription().then(sub => {
          if (!sub) {
            pushNotificationService.subscribeUserToPush().catch(console.error);
          } else {
            // Even if we have a subscription locally, ensure the backend has it
            api.post('/api/v1/notifications/push-subscribe', sub.toJSON()).catch(() => {});
          }
        });
      }
    });
  }, []);

  const handleEnablePush = async (e) => {
    if (e) e.stopPropagation();
    setIsSubmitting(true);
    setPermissionNotice('');
    try {
      await pushNotificationService.subscribeUserToPush();
      setPermissionState(pushNotificationService.getPermissionState());
    } catch (err) {
      console.warn('Push notification permission error:', err);
      const perm = pushNotificationService.getPermissionState();
      setPermissionState(perm);
      if (perm === 'denied') {
        setPermissionNotice('Notifications blocked by browser settings. Click the lock icon in address bar to Allow notifications.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInstantDemoAlert = async (e, delay = false) => {
    if (e) e.stopPropagation();
    setDemoFiring(true);
    setPermissionNotice('');
    try {
      // 1. Request permission if not already granted
      if (Notification.permission !== 'granted') {
        const perm = await pushNotificationService.requestPermission();
        setPermissionState(perm);
        if (perm === 'denied') {
          setPermissionNotice('Please Allow notifications in your browser settings to see desktop popups.');
        }
      }

      if (delay) {
        setPermissionNotice('Backend event will fire in 10 seconds. You can safely close this tab now to test background push!');
      }

      // 2. Fire backend domain event (which handles WebPush via FCM to ServiceWorker)
      await api.post('/api/v1/notifications/trigger-test-event', {
        event_type: 'vehicle_breakdown',
        delay: delay
      });

      // 3. Dispatch In-App Real-Time Toast Banner Alert (Only if not delayed)
      if (!delay) {
        window.dispatchEvent(new CustomEvent('erp-notification-alert', {
          detail: {
            title: '🚨 CRITICAL ALERT: Vehicle Breakdown (VEH-102)',
            body: 'Vehicle VEH-102 reported breakdown on Interstate 95. Immediate maintenance dispatch required.',
            priority: 'critical',
            category: 'vehicle',
            deepLink: '/fleet'
          }
        }));
      }

      // Removed local simulated browser push. Relying entirely on Backend -> FCM -> ServiceWorker push!

    } catch (err) {
      console.error('Demo trigger error:', err);
    } finally {
      setTimeout(() => setDemoFiring(false), 600);
    }
  };

  return (
    <div className="relative flex items-center gap-2">
      {/* Delayed Demo Trigger Button */}
      <button
        onClick={(e) => handleInstantDemoAlert(e, true)}
        disabled={demoFiring}
        className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 text-[10px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/40 rounded-full hover:bg-rose-500/40 transition-all cursor-pointer shadow-sm"
        title="Fire breakdown event after 10s delay. Close the tab to test background push!"
      >
        <Zap size={12} className={demoFiring ? "text-rose-400 animate-spin" : "text-rose-400"} />
        <span>{demoFiring ? 'Firing...' : 'Test Background Push (10s)'}</span>
      </button>

      {/* Tempo Demo Trigger Button */}
      <button
        onClick={(e) => handleInstantDemoAlert(e, false)}
        disabled={demoFiring}
        className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40 rounded-full hover:bg-amber-500/40 transition-all cursor-pointer shadow-sm"
        title="Fire instant breakdown event to test Notification Engine & Browser Push"
      >
        <Zap size={12} className={demoFiring ? "text-amber-400 animate-spin" : "text-amber-400"} />
        <span>{demoFiring ? 'Firing...' : 'Demo Test Alert'}</span>
      </button>

      {/* Enable Push Button / Enabled Badge */}
      {permissionState !== 'granted' ? (
        <button
          onClick={handleEnablePush}
          disabled={isSubmitting}
          className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 text-[10px] font-semibold bg-indigo-600/30 text-indigo-300 border border-indigo-500/40 rounded-full hover:bg-indigo-600/50 transition-all cursor-pointer"
          title="Enable Browser Push Notifications"
        >
          <Sparkles size={12} className={isSubmitting ? "text-indigo-400 animate-spin" : "text-indigo-400"} />
          <span>{isSubmitting ? 'Enabling...' : 'Enable Push'}</span>
        </button>
      ) : (
        <span className="hidden sm:flex items-center gap-1 px-2 py-0.5 text-[9px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 rounded-full">
          <Check size={10} /> Push Active
        </span>
      )}

      {/* Main Bell Icon with Badge */}
      <button
        onClick={onTogglePanel}
        className="relative text-slate-300 hover:text-white p-2 hover:bg-slate-800/80 rounded-xl transition-all cursor-pointer focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
        aria-label="Notification Center"
      >
        <Bell size={20} className={unreadCount > 0 ? "text-indigo-400 animate-bounce" : "text-slate-400"} />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 min-w-5 h-5 px-1 bg-gradient-to-r from-rose-500 to-red-600 text-white text-[10px] font-black flex items-center justify-center rounded-full border-2 border-slate-900 shadow-lg shadow-rose-500/30">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Floating Permission Warning Toast if Chrome permission is blocked */}
      {permissionNotice && (
        <div className="absolute top-12 right-0 w-72 bg-slate-900 border border-amber-500/50 text-amber-300 p-2.5 rounded-xl shadow-2xl z-50 text-[11px] flex gap-2 items-start">
          <AlertCircle size={14} className="shrink-0 text-amber-400 mt-0.5" />
          <div className="flex-1">
            <p className="leading-snug">{permissionNotice}</p>
            <button
              onClick={() => setPermissionNotice('')}
              className="mt-1 text-[9px] text-slate-400 hover:text-white underline cursor-pointer"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationBell;
