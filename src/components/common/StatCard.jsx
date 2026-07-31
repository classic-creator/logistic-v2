import React from 'react';
import { motion } from 'framer-motion';
import { ArrowUpRight, ArrowDownRight, Equal } from 'lucide-react';

export const StatCard = ({
  title,
  value,
  change,
  changeType = 'positive', // positive, negative, neutral
  icon: Icon,
  className = '',
  color = 'indigo', // indigo, emerald, rose, amber, sky
  subtitle
}) => {
  const glowColors = {
    indigo: 'shadow-indigo-500/5 border-indigo-500/10 hover:border-indigo-500/30 text-indigo-400',
    emerald: 'shadow-emerald-500/5 border-emerald-500/10 hover:border-emerald-500/30 text-emerald-400',
    rose: 'shadow-rose-500/5 border-rose-500/10 hover:border-rose-500/30 text-rose-400',
    amber: 'shadow-amber-500/5 border-amber-500/10 hover:border-amber-500/30 text-amber-400',
    sky: 'shadow-sky-500/5 border-sky-500/10 hover:border-sky-500/30 text-sky-400',
  };

  const bgIcons = {
    indigo: 'bg-indigo-500/10 text-indigo-400',
    emerald: 'bg-emerald-500/10 text-emerald-400',
    rose: 'bg-rose-500/10 text-rose-400',
    amber: 'bg-amber-500/10 text-amber-400',
    sky: 'bg-sky-500/10 text-sky-400',
  };

  const trendColors = {
    positive: 'text-emerald-400 bg-emerald-500/10',
    negative: 'text-rose-400 bg-rose-500/10',
    neutral: 'text-slate-400 bg-slate-500/10',
  };

  const TrendIcon = {
    positive: ArrowUpRight,
    negative: ArrowDownRight,
    neutral: Equal,
  }[changeType];

  return (
    <motion.div
      whileHover={{ y: -4 }}
      className={`glass-panel rounded-xl p-5 shadow-lg flex flex-col justify-between transition-all ${glowColors[color]} ${className}`}
    >
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
            {title}
          </span>
          <h3 className="text-2xl font-bold font-display tracking-tight text-slate-100">
            {value}
          </h3>
        </div>
        {Icon && (
          <div className={`p-2.5 rounded-lg ${bgIcons[color]}`}>
            <Icon size={20} />
          </div>
        )}
      </div>

      <div className="flex items-center justify-between mt-4">
        {change ? (
          <div className="flex items-center gap-2">
            <span className={`inline-flex items-center gap-0.5 px-2 py-0.5 rounded text-xs font-semibold ${trendColors[changeType]}`}>
              <TrendIcon size={12} />
              {change}
            </span>
            {subtitle && (
              <span className="text-xs text-slate-500 font-medium">
                {subtitle}
              </span>
            )}
          </div>
        ) : (
          subtitle && (
            <span className="text-xs text-slate-400 font-medium">
              {subtitle}
            </span>
          )
        )}
      </div>
    </motion.div>
  );
};

export default StatCard;
