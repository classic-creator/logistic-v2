import React from 'react';
import { varianceColors, formatCurrency, formatLiters, formatNumber } from '../lib/fuelFormat';

export const VarianceCard = ({ label, estimated, actual, format = 'number' }) => {
  const diff = actual - estimated;
  const variancePercent = estimated > 0 ? (diff / estimated) * 100 : 0;
  
  let status = 'pending';
  if (estimated > 0) {
    if (variancePercent <= 5) status = 'normal';
    else if (variancePercent <= 15) status = 'elevated';
    else status = 'abnormal';
  }

  const color = varianceColors[status];
  
  const formatter = {
    currency: (v) => formatCurrency(v, true),
    liters: (v) => formatLiters(v),
    number: (v) => formatNumber(v)
  }[format];

  return (
    <div className={`rounded-xl border ${color.bg} p-3 flex flex-col gap-2`}>
      <div className="flex justify-between items-center">
        <span className="text-xs font-semibold text-slate-400 uppercase">{label}</span>
        <div className="flex items-center gap-1.5">
          <div className={`w-2 h-2 rounded-full ${color.dot}`} />
          <span className={`text-[10px] font-bold ${color.text}`}>{color.label}</span>
        </div>
      </div>
      <div className="flex justify-between items-end">
        <div>
          <span className="text-[10px] text-slate-500 block mb-0.5">Estimated</span>
          <span className="text-sm font-mono font-bold text-slate-300">{formatter(estimated)}</span>
        </div>
        <div className="text-right">
          <span className="text-[10px] text-slate-500 block mb-0.5">Actual</span>
          <span className={`text-sm font-mono font-bold ${color.text}`}>{formatter(actual)}</span>
        </div>
      </div>
      <div className="pt-2 border-t border-slate-700/50 mt-1 flex justify-between items-center">
        <span className="text-[10px] text-slate-400">Variance</span>
        <span className={`text-xs font-mono font-bold ${color.text}`}>
          {variancePercent > 0 ? '+' : ''}{variancePercent.toFixed(1)}%
        </span>
      </div>
    </div>
  );
};

export default VarianceCard;
