// Shared formatting helpers for the Fuel Intelligence System.

export const formatCurrency = (value, compact = false) => {
  const num = Number(value || 0);
  if (compact) {
    if (num >= 100000) return `₹${(num / 100000).toFixed(2)}L`;
    if (num >= 1000) return `₹${(num / 1000).toFixed(1)}k`;
  }
  return `₹${num.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;
};

export const formatNumber = (value, digits = 0) =>
  Number(value || 0).toLocaleString('en-IN', { maximumFractionDigits: digits });

export const formatLiters = (value) => `${formatNumber(value, 1)} L`;

export const formatKmPerLiter = (value) => `${formatNumber(value, 1)} km/L`;

export const formatPercent = (value) => `${Number(value || 0).toFixed(1)}%`;

export const FUEL_TYPE_ICONS = {
  Diesel: '⛽',
  Petrol: '⛽',
  CNG: '⛽',
  Electric: '⚡',
};

// Variance status thresholds: green / yellow / red.
export const varianceStatus = (actual, estimated) => {
  if (!estimated || estimated <= 0) return 'pending';
  const diff = ((actual - estimated) / estimated) * 100;
  if (diff <= 5) return 'normal';
  if (diff <= 15) return 'elevated';
  return 'abnormal';
};

export const varianceColors = {
  normal: {
    text: 'text-emerald-400',
    bg: 'bg-emerald-500/10 border-emerald-500/20',
    dot: 'bg-emerald-400',
    label: 'Within Expected Range',
  },
  elevated: {
    text: 'text-amber-400',
    bg: 'bg-amber-500/10 border-amber-500/20',
    dot: 'bg-amber-400',
    label: 'Slightly Higher',
  },
  abnormal: {
    text: 'text-rose-400',
    bg: 'bg-rose-500/10 border-rose-500/20',
    dot: 'bg-rose-400',
    label: 'Abnormal Consumption',
  },
  pending: {
    text: 'text-slate-400',
    bg: 'bg-slate-800 border-slate-700/60',
    dot: 'bg-slate-500',
    label: 'Not Yet Measured',
  },
};

export const statusPillStyles = {
  Pending: 'bg-amber-500/15 text-accent-amber border border-amber-500/20',
  Approved: 'bg-emerald-500/15 text-accent-emerald border border-emerald-500/20',
  Rejected: 'bg-rose-500/15 text-accent-rose border border-rose-500/20',
};
