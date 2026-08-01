// Shared numeric / date formatting helpers for report presentation.

export const formatCurrency = (n, compact = false) => {
  const num = Number(n || 0);
  if (compact) {
    if (num >= 1e7) return `₹${(num / 1e7).toFixed(2)} Cr`;
    if (num >= 1e5) return `₹${(num / 1e5).toFixed(2)} L`;
    if (num >= 1e3) return `₹${(num / 1e3).toFixed(1)}k`;
    return `₹${num.toFixed(0)}`;
  }
  return `₹${num.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;
};

export const formatNumber = (n) => Number(n || 0).toLocaleString('en-IN');

export const formatPercent = (n, digits = 1) => `${Number(n || 0).toFixed(digits)}%`;

export const formatDistance = (km) => `${formatNumber(km)} km`;

export const formatHours = (hours) => {
  const h = Math.floor(Number(hours || 0));
  const m = Math.round((Number(hours || 0) - h) * 60);
  if (h <= 0) return `${m}m`;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
};

export const formatDate = (dateStr) => {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
};

export const initials = (name = '') =>
  name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
