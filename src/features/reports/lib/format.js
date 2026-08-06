// Shared numeric / date formatting helpers for report presentation.

export const formatCurrency = (n, compact = false, decimals = 0) => {
  if (n === null || n === undefined) return '₹0';
  if (typeof n === 'string' && n.trim().startsWith('₹')) return n;

  let cleanStr = String(n).replace(/[^0-9.-]/g, '');
  const num = parseFloat(cleanStr);

  if (isNaN(num)) return '₹0';

  const isNegative = num < 0;
  const abs = Math.abs(num);

  if (compact) {
    if (abs >= 1e7) return `${isNegative ? '-' : ''}₹${(abs / 1e7).toFixed(2)} Cr`;
    if (abs >= 1e5) return `${isNegative ? '-' : ''}₹${(abs / 1e5).toFixed(2)} L`;
    if (abs >= 1e3) return `${isNegative ? '-' : ''}₹${(abs / 1e3).toFixed(1)}k`;
    return `${isNegative ? '-' : ''}₹${abs.toFixed(0)}`;
  }

  const formatted = abs.toLocaleString('en-IN', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });

  return `${isNegative ? '-' : ''}₹${formatted}`;
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
