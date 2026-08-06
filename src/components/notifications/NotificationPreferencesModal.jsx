import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { Settings, X, Save, BellRing, Smartphone, Mail, MessageSquare, Moon } from 'lucide-react';

export const NotificationPreferencesModal = ({ isOpen, onClose }) => {
  const [preferences, setPreferences] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchPreferences();
    }
  }, [isOpen]);

  const fetchPreferences = async () => {
    setLoading(true);
    try {
      const res = await api.get('/api/v1/notifications/preferences');
      if (res.data?.status === 'success' || Array.isArray(res.data?.data)) {
        setPreferences(res.data?.data || []);
      }
    } catch (e) {
      console.error('Failed to load preferences:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = (index, field) => {
    const updated = [...preferences];
    updated[index][field] = !updated[index][field];
    setPreferences(updated);
  };

  const handleTimeChange = (index, field, value) => {
    const updated = [...preferences];
    updated[index][field] = value;
    setPreferences(updated);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.put('/api/v1/notifications/preferences', { preferences });
      onClose();
    } catch (e) {
      console.error('Failed to save preferences:', e);
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-xl w-full p-6 shadow-2xl space-y-6">
        <div className="flex justify-between items-center border-b border-slate-800 pb-4">
          <div className="flex items-center gap-2">
            <Settings size={20} className="text-indigo-400" />
            <h3 className="text-sm font-bold text-slate-100 uppercase tracking-wider font-display">Notification Channel Rules</h3>
          </div>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-200 rounded-lg hover:bg-slate-800">
            <X size={18} />
          </button>
        </div>

        {loading ? (
          <div className="py-12 text-center text-slate-500 text-xs">Loading preference matrix...</div>
        ) : (
          <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-1 divide-y divide-slate-850">
            {preferences.map((item, idx) => (
              <div key={item.category} className="pt-3 first:pt-0 space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold text-slate-200 uppercase tracking-wide flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-indigo-500" /> {item.category}
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                  <button
                    onClick={() => handleToggle(idx, 'inAppEnabled')}
                    className={`px-3 py-2 rounded-xl border flex items-center gap-2 transition-all cursor-pointer ${
                      item.inAppEnabled || item.in_app_enabled ? 'bg-indigo-600/20 border-indigo-500/50 text-indigo-300' : 'bg-slate-850 border-slate-800 text-slate-500'
                    }`}
                  >
                    <BellRing size={14} /> In-App
                  </button>

                  <button
                    onClick={() => handleToggle(idx, 'browserPushEnabled')}
                    className={`px-3 py-2 rounded-xl border flex items-center gap-2 transition-all cursor-pointer ${
                      item.browserPushEnabled || item.browser_push_enabled ? 'bg-indigo-600/20 border-indigo-500/50 text-indigo-300' : 'bg-slate-850 border-slate-800 text-slate-500'
                    }`}
                  >
                    <Smartphone size={14} /> Push
                  </button>

                  <button
                    onClick={() => handleToggle(idx, 'emailEnabled')}
                    className={`px-3 py-2 rounded-xl border flex items-center gap-2 transition-all cursor-pointer ${
                      item.emailEnabled || item.email_enabled ? 'bg-indigo-600/20 border-indigo-500/50 text-indigo-300' : 'bg-slate-850 border-slate-800 text-slate-500'
                    }`}
                  >
                    <Mail size={14} /> Email
                  </button>

                  <button
                    onClick={() => handleToggle(idx, 'whatsappEnabled')}
                    className={`px-3 py-2 rounded-xl border flex items-center gap-2 transition-all cursor-pointer ${
                      item.whatsappEnabled || item.whatsapp_enabled ? 'bg-indigo-600/20 border-indigo-500/50 text-indigo-300' : 'bg-slate-850 border-slate-800 text-slate-500'
                    }`}
                  >
                    <MessageSquare size={14} /> WhatsApp
                  </button>
                </div>

                <div className="flex items-center gap-2 text-[11px] text-slate-400 bg-slate-950 p-2 rounded-lg">
                  <Moon size={12} className="text-amber-400" />
                  <span>Quiet Hours:</span>
                  <input
                    type="time"
                    value={item.quietHoursStart || item.quiet_hours_start || ''}
                    onChange={(e) => handleTimeChange(idx, 'quietHoursStart', e.target.value)}
                    className="bg-slate-900 border border-slate-800 rounded px-1 text-slate-200 text-[10px]"
                  />
                  <span>to</span>
                  <input
                    type="time"
                    value={item.quietHoursEnd || item.quiet_hours_end || ''}
                    onChange={(e) => handleTimeChange(idx, 'quietHoursEnd', e.target.value)}
                    className="bg-slate-900 border border-slate-800 rounded px-1 text-slate-200 text-[10px]"
                  />
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="flex justify-end gap-3 border-t border-slate-800 pt-4">
          <button onClick={onClose} className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-slate-200 rounded-xl hover:bg-slate-800">
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-5 py-2 text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl shadow-lg shadow-indigo-600/30 flex items-center gap-2 cursor-pointer"
          >
            <Save size={14} />
            <span>{saving ? 'Saving...' : 'Save Rules'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default NotificationPreferencesModal;
