import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { Activity, CheckCircle2, AlertCircle, Clock, RefreshCw, Send, Radio } from 'lucide-react';

export const NotificationAuditLogs = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ current_page: 1, last_page: 1 });

  const fetchLogs = async (page = 1) => {
    setLoading(true);
    try {
      const res = await api.get(`/api/v1/notifications/logs?page=${page}`);
      if (res.data?.status === 'success' || Array.isArray(res.data?.data)) {
        setLogs(res.data?.data || []);
        setPagination(res.data?.pagination || { current_page: 1, last_page: 1 });
      }
    } catch (e) {
      console.error('Error fetching delivery logs:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const getStatusBadge = (status) => {
    switch (status) {
      case 'read':
      case 'clicked':
        return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"><CheckCircle2 size={10}/> {status.toUpperCase()}</span>;
      case 'delivered':
      case 'sent':
        return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-blue-500/20 text-blue-300 border border-blue-500/30"><Send size={10}/> {status.toUpperCase()}</span>;
      case 'queued':
        return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30"><Clock size={10}/> {status.toUpperCase()}</span>;
      case 'failed':
      default:
        return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30"><AlertCircle size={10}/> {status.toUpperCase()}</span>;
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center bg-slate-900/60 p-3 rounded-lg border border-slate-800">
        <div className="flex items-center gap-2">
          <Activity size={16} className="text-indigo-400" />
          <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider">Enterprise Delivery Audit Logs</h4>
        </div>
        <button
          onClick={() => fetchLogs(pagination.current_page || 1)}
          className="p-1.5 hover:bg-slate-800 text-slate-400 hover:text-white rounded-lg transition-colors cursor-pointer"
          title="Refresh Logs"
        >
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
        </button>
      </div>

      {loading ? (
        <div className="py-12 text-center text-slate-500 text-xs">Loading delivery audit history...</div>
      ) : logs.length > 0 ? (
        <div className="overflow-x-auto rounded-lg border border-slate-800 bg-slate-950">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-900/80 text-[10px] uppercase font-bold text-slate-400 border-b border-slate-800">
              <tr>
                <th className="px-3 py-2">ID</th>
                <th className="px-3 py-2">Channel</th>
                <th className="px-3 py-2">Event Title</th>
                <th className="px-3 py-2">Status</th>
                <th className="px-3 py-2">Target</th>
                <th className="px-3 py-2">Timestamp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-850">
              {logs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-900/40 transition-colors">
                  <td className="px-3 py-2 font-mono text-[10px] text-slate-400">#{log.id}</td>
                  <td className="px-3 py-2">
                    <span className="font-semibold text-slate-200 capitalize flex items-center gap-1">
                      <Radio size={12} className="text-indigo-400"/> {(log.channel || 'in_app').replace('_', ' ')}
                    </span>
                  </td>
                  <td className="px-3 py-2 text-slate-300 font-medium max-w-[200px] truncate">
                    {log.notification?.title || 'System Notification'}
                  </td>
                  <td className="px-3 py-2">{getStatusBadge(log.status)}</td>
                  <td className="px-3 py-2 text-[11px] text-slate-400 truncate max-w-[150px]">
                    {log.recipientTarget || log.recipient_target || 'Local User'}
                  </td>
                  <td className="px-3 py-2 text-[10px] text-slate-400">
                    {new Date(log.createdAt || log.created_at || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="py-10 text-center text-slate-500 text-xs font-medium">No delivery log history available.</div>
      )}
    </div>
  );
};

export default NotificationAuditLogs;
