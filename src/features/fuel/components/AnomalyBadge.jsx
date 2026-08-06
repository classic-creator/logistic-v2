import React from 'react';

export const AnomalyBadge = ({ severity = 'low', label }) => {
  const styles = {
    low: 'bg-slate-500/10 text-slate-400 border-slate-500/20',
    medium: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    high: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
    critical: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
  };

  return (
    <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${styles[severity] || styles.low}`}>
      {label}
    </span>
  );
};

export default AnomalyBadge;
