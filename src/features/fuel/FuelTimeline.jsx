import { AlertTriangle, Fuel, MapPin } from 'lucide-react';
import { statusPillStyles, formatCurrency, formatLiters } from './lib/fuelFormat';

const FuelTimelineItem = ({ entry, index }) => (
  <div className="relative pl-6">
    {index < 0 && (
      <span className="absolute left-0 top-0 h-full w-px bg-slate-800" />
    )}
    <span className={`absolute left-0 top-1.5 flex h-3.5 w-3.5 items-center justify-center rounded-full ${entry.status === 'Approved' ? 'bg-emerald-400' : entry.isFlagged ? 'bg-rose-400' : 'bg-amber-400'}`}>
      <span className="h-1.5 w-1.5 rounded-full bg-slate-950" />
    </span>
    <div className={`rounded-xl border p-3.5 space-y-2 ${entry.isFlagged ? 'border-rose-500/25 bg-rose-500/5' : 'border-slate-800 bg-slate-900/50'}`}>
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-xs font-bold text-slate-200">
          <Fuel size={13} className="text-accent-amber" />
          {formatLiters(entry.quantity)} {entry.fuelType}
        </div>
        <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase ${statusPillStyles[entry.status] || 'bg-slate-800 text-slate-400'}`}>
          {entry.status}
        </span>
      </div>
      <div className="flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-slate-400">
        <span className="font-mono font-semibold text-accent-emerald">{formatCurrency(entry.totalCost)}</span>
        {entry.stationName && <span>{entry.stationName}</span>}
        {entry.odometer && <span className="font-mono">{Number(entry.odometer).toLocaleString('en-IN')} km</span>}
      </div>
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px] text-slate-500">
        <span>{entry.filledAt ? new Date(entry.filledAt).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) : '—'}</span>
        {entry.paymentMethod && <span>{entry.paymentMethod}</span>}
        {entry.latitude && (
          <span className="inline-flex items-center gap-0.5 text-sky-400">
            <MapPin size={9} /> GPS
          </span>
        )}
      </div>
      {entry.isFlagged && entry.flags?.length > 0 && (
        <div className="flex items-start gap-1.5 text-[10px] font-semibold text-accent-rose">
          <AlertTriangle size={11} className="flex-shrink-0 mt-0.5" />
          <span>{entry.flags.map((f) => f.message || f.rule).join(' · ')}</span>
        </div>
      )}
    </div>
  </div>
);

export const FuelTimeline = ({ entries = [] }) => {
  if (!entries.length) {
    return (
      <div className="py-6 text-center space-y-2">
        <Fuel size={28} className="mx-auto text-slate-700" />
        <p className="text-xs font-semibold text-slate-500">No fuel fills recorded for this trip yet.</p>
      </div>
    );
  }

  const sorted = [...entries].sort((a, b) => new Date(a.filledAt || a.createdAt || 0) - new Date(b.filledAt || b.createdAt || 0));

  return (
    <div className="space-y-3">
      {sorted.map((entry, i) => (
        <div key={entry.id} className="relative">
          {i < sorted.length - 1 && (
            <span className="absolute left-[5px] top-6 bottom-[-12px] w-px bg-slate-800" />
          )}
          <FuelTimelineItem entry={entry} index={i} />
        </div>
      ))}
    </div>
  );
};

export default FuelTimeline;
