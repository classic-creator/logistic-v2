import React from 'react';
import { BarChart3, Inbox } from 'lucide-react';
import { CardSkeleton } from '../../../components/common/Skeleton';

export const ReportLoading = () => (
  <div className="space-y-6">
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <CardSkeleton />
      <CardSkeleton />
      <CardSkeleton />
      <CardSkeleton />
    </div>
    <div className="glass-panel rounded-xl p-5 border border-slate-800 h-[260px] flex flex-col gap-4">
      <div className="h-5 w-48 bg-slate-800 rounded animate-pulse" />
      <div className="flex-1 bg-slate-800/40 rounded-xl animate-pulse" />
    </div>
  </div>
);

export const ReportEmpty = ({ title = 'No data in this period', hint = 'Try widening the date range or clearing filters.' }) => (
  <div className="glass-panel rounded-xl p-10 border border-slate-800 text-center">
    <div className="inline-flex p-4 bg-slate-800/60 rounded-2xl text-slate-500 mb-3">
      <Inbox size={32} />
    </div>
    <h3 className="text-base font-bold text-slate-200 font-display">{title}</h3>
    <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">{hint}</p>
  </div>
);

export const StatusPill = ({ status }) => {
  const map = {
    Completed: 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/20',
    Delivered: 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/20',
    Running: 'bg-sky-500/15 text-sky-400 border border-sky-500/20',
    Assigned: 'bg-indigo-500/15 text-indigo-400 border border-indigo-500/20',
    Pending: 'bg-amber-500/15 text-amber-400 border border-amber-500/20',
    Cancelled: 'bg-slate-800 text-slate-500 border border-slate-700/60',
    Paid: 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/20',
    Partial: 'bg-amber-500/15 text-amber-400 border border-amber-500/20',
    Available: 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/20',
    'On Trip': 'bg-sky-500/15 text-sky-400 border border-sky-500/20',
    Maintenance: 'bg-amber-500/15 text-amber-400 border border-amber-500/20',
    Inactive: 'bg-slate-800 text-slate-500 border border-slate-700/60',
    Leave: 'bg-amber-500/15 text-amber-400 border border-amber-500/20',
    Offline: 'bg-slate-800 text-slate-500 border border-slate-700/60',
    Active: 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/20',
    High: 'bg-rose-500/15 text-rose-400 border border-rose-500/20',
    Medium: 'bg-indigo-500/15 text-indigo-400 border border-indigo-500/20',
  };
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold ${map[status] || 'bg-slate-800 text-slate-500'}`}>
      {status}
    </span>
  );
};

export const ChartIcon = () => <BarChart3 size={16} />;
