import React from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

// Positioned ranking row used across leaderboards (Best driver, top vehicle, etc).
export const RankingList = ({ items = [], renderValue, title, icon: Icon }) => {
  return (
    <div className="glass-panel rounded-xl p-5 border border-slate-800 space-y-3">
      <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
        {Icon && <Icon size={16} className="text-accent-indigo" />}
        <h3 className="text-sm font-bold text-slate-100 font-display">{title}</h3>
      </div>

      <div className="space-y-2">
        {items.map((item, idx) => (
          <motion.div
            key={item.id || item.key || idx}
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: idx * 0.04 }}
            className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-slate-800/40 transition-colors"
          >
            <span
              className={`w-7 h-7 flex-shrink-0 rounded-full flex items-center justify-center text-[11px] font-extrabold ${
                idx === 0
                  ? 'bg-amber-500/20 text-amber-300'
                  : idx === 1
                    ? 'bg-slate-400/15 text-slate-300'
                    : idx === 2
                      ? 'bg-orange-500/15 text-orange-400'
                      : 'bg-slate-800 text-slate-500'
              }`}
            >
              {idx + 1}
            </span>
            <div className="flex-1 min-w-0">
              <span className="text-xs font-bold text-slate-200 truncate block">{item.name}</span>
              {item.subtitle && (
                <span className="text-[10px] text-slate-500 truncate block">{item.subtitle}</span>
              )}
            </div>
            <div className="text-right flex-shrink-0">
              {renderValue ? renderValue(item, idx) : <span className="text-xs font-bold text-slate-300">{item.value}</span>}
            </div>
          </motion.div>
        ))}
        {items.length === 0 && (
          <p className="text-xs text-slate-500 text-center py-4">No data available.</p>
        )}
      </div>
    </div>
  );
};

export const TrendIndicator = ({ value, invert = false, suffix = '' }) => {
  if (value === undefined || value === null || Math.abs(value) < 0.05) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-semibold bg-slate-500/10 text-slate-400">
        <Minus size={12} /> 0%
      </span>
    );
  }
  const up = invert ? value < 0 : value > 0;
  const IconCmp = up ? TrendingUp : TrendingDown;
  const cls = up
    ? 'bg-emerald-500/10 text-emerald-400'
    : 'bg-rose-500/10 text-rose-400';
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-semibold ${cls}`}>
      <IconCmp size={12} />
      {value > 0 ? '+' : ''}
      {value.toFixed(1)}%
      {suffix}
    </span>
  );
};

export default RankingList;
