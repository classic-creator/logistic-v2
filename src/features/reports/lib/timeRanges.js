// Date-range presets and filtering helpers used across every BI report.

export const TIME_RANGES = [
  { key: 'today', label: 'Today' },
  { key: 'yesterday', label: 'Yesterday' },
  { key: 'this_week', label: 'This Week' },
  { key: 'last_week', label: 'Last Week' },
  { key: 'this_month', label: 'This Month' },
  { key: 'last_month', label: 'Last Month' },
  { key: 'quarter', label: 'This Quarter' },
  { key: 'year', label: 'This Year' },
  { key: 'custom', label: 'Custom Range' },
];

const startOfDay = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
const endOfDay = (d) => {
  const e = startOfDay(d);
  e.setHours(23, 59, 59, 999);
  return e;
};

// Resolve a range preset into concrete { start, end, label } boundaries.
export const getRange = (key, custom = null) => {
  const now = new Date();
  const today = startOfDay(now);

  switch (key) {
    case 'today':
      return { start: new Date(today), end: endOfDay(now), label: 'Today' };

    case 'yesterday': {
      const s = new Date(today);
      s.setDate(s.getDate() - 1);
      return { start: s, end: endOfDay(s), label: 'Yesterday' };
    }

    case 'this_week': {
      const day = today.getDay();
      const diff = day === 0 ? 6 : day - 1; // week starts Monday
      const s = new Date(today);
      s.setDate(s.getDate() - diff);
      return { start: s, end: endOfDay(now), label: 'This Week' };
    }

    case 'last_week': {
      const day = today.getDay();
      const diff = day === 0 ? 6 : day - 1;
      const s = new Date(today);
      s.setDate(s.getDate() - diff - 7);
      const e = new Date(s);
      e.setDate(e.getDate() + 6);
      return { start: s, end: endOfDay(e), label: 'Last Week' };
    }

    case 'this_month':
      return {
        start: new Date(today.getFullYear(), today.getMonth(), 1),
        end: endOfDay(now),
        label: 'This Month',
      };

    case 'last_month': {
      const s = new Date(today.getFullYear(), today.getMonth() - 1, 1);
      const e = new Date(today.getFullYear(), today.getMonth(), 0);
      return { start: s, end: endOfDay(e), label: 'Last Month' };
    }

    case 'quarter': {
      const q = Math.floor(today.getMonth() / 3);
      return {
        start: new Date(today.getFullYear(), q * 3, 1),
        end: endOfDay(now),
        label: 'This Quarter',
      };
    }

    case 'year':
      return {
        start: new Date(today.getFullYear(), 0, 1),
        end: endOfDay(now),
        label: 'This Year',
      };

    case 'custom': {
      if (custom && custom.start && custom.end) {
        const s = new Date(custom.start);
        const e = new Date(custom.end);
        e.setHours(23, 59, 59, 999);
        return { start: s, end: e, label: 'Custom Range' };
      }
      return { start: new Date(today), end: endOfDay(now), label: 'Custom Range' };
    }

    default:
      return { start: new Date(today), end: endOfDay(now), label: 'Today' };
  }
};

// Return the immediately-preceding window of identical length for comparisons.
export const getPreviousRange = (range) => {
  const lengthMs = range.end.getTime() - range.start.getTime();
  const prevEnd = new Date(range.start.getTime() - 1);
  const prevStart = new Date(prevEnd.getTime() - lengthMs);
  return { start: prevStart, end: prevEnd, label: 'Previous Period' };
};

// Does a given ISO date fall inside a range window?
export const dateInRange = (dateStr, range) => {
  if (!dateStr) return false;
  const d = new Date(dateStr);
  return d >= range.start && d <= range.end;
};

// Percentage change between two values (handles division by zero).
export const pctChange = (current, previous) => {
  if (!previous) return current > 0 ? 100 : 0;
  return ((current - previous) / previous) * 100;
};

// Format an ISO date key for daily series: "12 Jun".
export const shortDate = (dateStr) => {
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
};

// Human readable range description for report headers.
export const rangeLabel = (range) =>
  `${range.start.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })} – ${range.end.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}`;
