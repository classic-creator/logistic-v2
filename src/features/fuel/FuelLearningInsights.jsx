import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useLearningStatus } from '../../services/intelligenceServices';
import { CardSkeleton } from '../../components/common/Skeleton';
import Button from '../../components/common/Button';
import { ArrowLeft, Brain, Activity } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import FuelScoreGauge from './components/FuelScoreGauge';

export const FuelLearningInsights = () => {
  const navigate = useNavigate();
  const { data, isLoading } = useLearningStatus();

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-64 bg-slate-800 rounded animate-pulse" />
        <CardSkeleton className="h-64" />
      </div>
    );
  }

  const { entities = [], overallConfidence = 0, recentLearning = [], mileageTrends = {} } = data || {};

  return (
    <div className="space-y-8 select-none">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={() => navigate('/fuel')} className="!p-2 text-slate-400 hover:text-white">
          <ArrowLeft size={20} />
        </Button>
        <div>
          <h1 className="text-3xl font-extrabold font-display tracking-tight text-slate-100 flex items-center gap-3">
            <Brain size={28} className="text-accent-violet" />
            Learning Insights
          </h1>
          <p className="text-sm text-slate-400">Transparency into the ML model's learning process.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="glass-panel rounded-xl p-6 border border-slate-800 flex flex-col items-center justify-center">
          <h3 className="text-sm font-bold text-slate-300 uppercase tracking-widest mb-4">Overall Confidence</h3>
          <FuelScoreGauge score={Math.round(overallConfidence * 100)} size="lg" />
          <p className="text-xs text-slate-500 mt-4 text-center">Based on data volume and variance consistency.</p>
        </div>

        <div className="lg:col-span-2 glass-panel rounded-xl p-5 border border-slate-800 overflow-x-auto">
          <h3 className="text-sm font-bold text-slate-100 font-display mb-4">Entity Learning Progress</h3>
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="text-slate-500 font-bold border-b border-slate-800">
                <th className="py-2.5">Entity</th>
                <th>Mfg. Mileage</th>
                <th>Learned Mileage</th>
                <th>Confidence</th>
                <th>Data Points</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50">
              {entities.map((e, i) => (
                <tr key={i} className="text-slate-300">
                  <td className="py-3 font-semibold text-slate-200">{e.name}</td>
                  <td className="font-mono text-slate-400">{e.manufacturerMileage}</td>
                  <td className="font-mono font-bold text-emerald-400">{e.currentMileage}</td>
                  <td>
                    <div className="w-16 h-1.5 bg-slate-800 rounded-full overflow-hidden inline-block mr-2">
                      <div className="h-full bg-violet-500" style={{ width: `${e.confidence * 100}%` }} />
                    </div>
                    {Math.round(e.confidence * 100)}%
                  </td>
                  <td className="font-mono">{e.dataPoints}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="glass-panel rounded-xl p-5 border border-slate-800 space-y-4">
        <h3 className="text-sm font-bold text-slate-100 font-display flex items-center gap-2">
          <Activity size={16} className="text-accent-sky" /> Recent Learning Events
        </h3>
        <div className="space-y-3">
          {recentLearning.map((event, i) => (
            <div key={i} className="bg-slate-900/50 p-3 rounded-lg flex items-center justify-between text-xs">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-slate-800 rounded text-slate-400"><Brain size={14} /></div>
                <div>
                  <span className="font-bold text-slate-200">Model Updated for {event.entityType}</span>
                  <p className="text-slate-500 mt-0.5">Adjusted from {event.previousMileage} to {event.newMileage} km/L</p>
                </div>
              </div>
              <div className="text-right">
                <span className="text-[10px] bg-slate-800 px-2 py-1 rounded text-slate-400 font-mono">
                  Trigger: {event.trigger}
                </span>
                <p className="text-[10px] text-slate-500 mt-1">{new Date(event.createdAt).toLocaleDateString()}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default FuelLearningInsights;
