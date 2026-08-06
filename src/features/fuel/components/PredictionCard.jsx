import React from 'react';
import { formatCurrency, formatKmPerLiter, formatLiters } from '../lib/fuelFormat';
import { Target, AlertCircle } from 'lucide-react';

export const PredictionCard = ({ prediction }) => {
  if (!prediction) return null;

  return (
    <div className="glass-panel rounded-xl p-5 border border-indigo-500/30 bg-indigo-500/5 space-y-4">
      <div className="flex items-center justify-between border-b border-indigo-500/20 pb-3">
        <div className="flex items-center gap-2">
          <Target size={18} className="text-accent-indigo" />
          <h3 className="text-sm font-bold text-slate-100 font-display">AI Prediction</h3>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] text-slate-400">Confidence</span>
          <div className="h-1.5 w-16 bg-slate-800 rounded-full overflow-hidden">
            <div 
              className="h-full bg-indigo-500 rounded-full" 
              style={{ width: `${prediction.confidence || 0}%` }} 
            />
          </div>
          <span className="text-[10px] font-bold text-indigo-400">{prediction.confidence}%</span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <span className="text-[10px] uppercase text-slate-500 block mb-1">Predicted Fuel</span>
          <span className="text-lg font-mono font-bold text-slate-200">{formatLiters(prediction.predictedLiters)}</span>
        </div>
        <div>
          <span className="text-[10px] uppercase text-slate-500 block mb-1">Estimated Cost</span>
          <span className="text-lg font-mono font-bold text-amber-400">{formatCurrency(prediction.estimatedCost)}</span>
        </div>
        <div>
          <span className="text-[10px] uppercase text-slate-500 block mb-1">Expected Mileage</span>
          <span className="text-sm font-mono font-bold text-emerald-400">{formatKmPerLiter(prediction.expectedMileage)}</span>
        </div>
        <div>
          <span className="text-[10px] uppercase text-slate-500 block mb-1">Duration</span>
          <span className="text-sm font-mono font-bold text-slate-300">{prediction.estimatedDuration} hrs</span>
        </div>
      </div>
      
      {prediction.warnings && prediction.warnings.length > 0 && (
        <div className="mt-3 p-2 bg-amber-500/10 border border-amber-500/20 rounded-lg flex items-start gap-2">
          <AlertCircle size={14} className="text-accent-amber shrink-0 mt-0.5" />
          <div className="text-[10px] text-amber-200/80">
            {prediction.warnings.map((w, i) => <div key={i}>{w}</div>)}
          </div>
        </div>
      )}
    </div>
  );
};

export default PredictionCard;
