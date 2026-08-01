import { motion } from 'framer-motion';
import { ArrowUpRight, ArrowDownRight, Equal } from 'lucide-react';

const COLOR_MAPS = {
  indigo: { border: 'border-indigo-500/15 hover:border-indigo-500/30', iconBg: 'bg-indigo-500/10 text-indigo-400', glow: 'shadow-indigo-500/5' },
  emerald: { border: 'border-emerald-500/15 hover:border-emerald-500/30', iconBg: 'bg-emerald-500/10 text-emerald-400', glow: 'shadow-emerald-500/5' },
  rose: { border: 'border-rose-500/15 hover:border-rose-500/30', iconBg: 'bg-rose-500/10 text-rose-400', glow: 'shadow-rose-500/5' },
  amber: { border: 'border-amber-500/15 hover:border-amber-500/30', iconBg: 'bg-amber-500/10 text-amber-400', glow: 'shadow-amber-500/5' },
  sky: { border: 'border-sky-500/15 hover:border-sky-500/30', iconBg: 'bg-sky-500/10 text-sky-400', glow: 'shadow-sky-500/5' },
  violet: { border: 'border-violet-500/15 hover:border-violet-500/30', iconBg: 'bg-violet-500/10 text-violet-400', glow: 'shadow-violet-500/5' },
};

export const ReportKpiCard = ({
  title,
  value,
  subtitle,
  icon: Icon,
  color = 'indigo',
  trend,
  trendLabel,
  invertTrend = false,
  className = '',
}) => {
  const c = COLOR_MAPS[color] || COLOR_MAPS.indigo;

  let trendNode = null;
  if (trend !== undefined && trend !== null) {
    const isGood = invertTrend ? trend <= 0 : trend >= 0;
    const IconCmp = Math.abs(trend) < 0.05 ? Equal : trend > 0 ? ArrowUpRight : ArrowDownRight;
    trendNode = (
      <span
        className={`inline-flex items-center gap-0.5 px-2 py-0.5 rounded text-xs font-semibold ${
          Math.abs(trend) < 0.05
            ? 'bg-slate-500/10 text-slate-400'
            : isGood
              ? 'bg-emerald-500/10 text-emerald-400'
              : 'bg-rose-500/10 text-rose-400'
        }`}
      >
        <IconCmp size={12} />
        {Math.abs(trend) < 0.05 ? '0%' : `${trend > 0 ? '+' : ''}${trend.toFixed(1)}%`}
      </span>
    );
  }

  return (
    <motion.div
      whileHover={{ y: -3 }}
      className={`relative overflow-hidden rounded-2xl bg-slate-900/60 p-5 shadow-xl shadow-slate-950/20 transition-all border ${c.border} ${c.glow} ${className}`}
    >
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-white/10 to-transparent" />
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 space-y-1">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 truncate block">
            {title}
          </span>
          <h3 className="text-2xl font-bold font-display tracking-tight text-slate-100 truncate">
            {value}
          </h3>
        </div>
        {Icon && (
          <div className={`p-2.5 rounded-lg flex-shrink-0 ${c.iconBg}`}>
            <Icon size={18} />
          </div>
        )}
      </div>
      <div className="flex items-center gap-2 mt-3 min-h-[20px]">
        {trendNode}
        {subtitle && <span className="text-xs text-slate-500 font-medium truncate">{subtitle}</span>}
        {trendLabel && <span className="text-[10px] text-slate-600 font-semibold uppercase tracking-wide">{trendLabel}</span>}
      </div>
    </motion.div>
  );
};

export default ReportKpiCard;
