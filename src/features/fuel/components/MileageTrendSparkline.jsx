import React from 'react';

export const MileageTrendSparkline = ({ data = [], width = 100, height = 30, color = '#10b981' }) => {
  if (!data || data.length === 0) return <div style={{ width, height }} className="bg-slate-800/50 rounded" />;

  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1; // Prevent division by zero
  
  const points = data.map((val, i) => {
    const x = (i / (data.length - 1 || 1)) * width;
    const y = height - ((val - min) / range) * height;
    return `${x},${y}`;
  }).join(' ');

  return (
    <svg width={width} height={height} className="overflow-visible">
      <polyline
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        points={points}
      />
    </svg>
  );
};

export default MileageTrendSparkline;
