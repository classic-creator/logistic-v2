// Consistent Recharts theming shared across every BI page.
export const CHART_COLORS = [
  '#6366f1',
  '#10b981',
  '#f43f5e',
  '#f59e0b',
  '#0ea5e9',
  '#8b5cf6',
  '#ec4899',
  '#14b8a6',
];

export const tooltipStyle = {
  backgroundColor: '#0f172a',
  border: '1px solid #334155',
  borderRadius: '8px',
  color: '#f1f5f9',
  fontSize: '12px',
};

export const axisProps = {
  stroke: '#64748b',
  tickLine: false,
  tick: { fill: '#64748b', fontSize: 11 },
};

export const gridProps = {
  strokeDasharray: '3 3',
  stroke: '#1e293b',
  vertical: false,
};

export const moneyTick = (v) => `₹${v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v}`;
