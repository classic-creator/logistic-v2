// Shared formatting helpers for the Fuel Intelligence System.

export const formatCurrency = (value, compact = false, decimals = 0) => {
  if (value === null || value === undefined) return '₹0';
  if (typeof value === 'string' && value.trim().startsWith('₹')) return value;

  let cleanStr = String(value).replace(/[^0-9.-]/g, '');
  const num = parseFloat(cleanStr);

  if (isNaN(num)) return '₹0';

  const isNegative = num < 0;
  const abs = Math.abs(num);

  if (compact) {
    if (abs >= 10000000) return `${isNegative ? '-' : ''}₹${(abs / 10000000).toFixed(2)} Cr`;
    if (abs >= 100000) return `${isNegative ? '-' : ''}₹${(abs / 100000).toFixed(2)} L`;
    if (abs >= 1000) return `${isNegative ? '-' : ''}₹${(abs / 1000).toFixed(1)}k`;
  }

  const formatted = abs.toLocaleString('en-IN', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });

  return `${isNegative ? '-' : ''}₹${formatted}`;
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
