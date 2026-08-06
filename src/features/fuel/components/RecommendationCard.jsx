import React from 'react';
import { Lightbulb, Zap } from 'lucide-react';

export const RecommendationCard = ({ recommendation }) => {
  if (!recommendation) return null;

  const recData = recommendation.recommendation || recommendation;
  const type = recommendation.type || recData.type || 'Recommendation';
  const confidence = recommendation.confidencePercent || recommendation.confidence || recData.confidencePercent || recData.confidence || 85;
  const suggestion = recData.suggestion || recData.vehicleNumber || recData.driverName || (typeof recData === 'string' ? recData : 'Asset Optimization');
  const reasoning = recData.reasoning || recData.description || 'Based on AI historical analysis.';

  return (
    <div className="glass-panel rounded-xl p-4 border border-emerald-500/30 bg-emerald-500/5 flex flex-col gap-3">
      <div className="flex justify-between items-start">
        <div className="flex items-center gap-2 text-accent-emerald">
          <Lightbulb size={16} />
          <span className="text-xs font-bold uppercase tracking-wider">{type}</span>
        </div>
        <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full font-bold">
          {confidence}% Match
        </span>
      </div>

      <div>
        <h4 className="text-sm font-bold text-slate-100">{suggestion}</h4>
        <p className="text-xs text-slate-400 mt-1">{reasoning}</p>
      </div>

      {recommendation.actionable && (
        <button className="mt-2 w-full flex items-center justify-center gap-2 text-xs font-semibold bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 py-1.5 rounded-lg transition-colors">
          <Zap size={12} /> Apply Recommendation
        </button>
      )}
    </div>
  );
};

export default RecommendationCard;
