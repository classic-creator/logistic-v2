import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useVarianceAnalysis } from '../../services/intelligenceServices';
import { CardSkeleton } from '../../components/common/Skeleton';
import StatCard from '../../components/common/StatCard';
import Button from '../../components/common/Button';
import { ArrowLeft, TrendingDown, TrendingUp, Equal } from 'lucide-react';
import { formatCurrency, formatPercent } from './lib/fuelFormat';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

export const FuelVarianceAnalysis = () => {
  const navigate = useNavigate();
  const { data, isLoading } = useVarianceAnalysis();

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-64 bg-slate-800 rounded animate-pulse" />
        <div className="grid grid-cols-2 lg:grid-cols-6 gap-4">
          <CardSkeleton /><CardSkeleton /><CardSkeleton /><CardSkeleton /><CardSkeleton /><CardSkeleton />
        </div>
      </div>
    );
  }

  const { aggregates = {}, trips = [] } = data || {};

  // For distribution chart, group by variance buckets
  const buckets = [
    { name: '< -15%', count: 0, color: '#10b981' },
    { name: '-15 to -5%', count: 0, color: '#10b981' },
    { name: '-5 to 5%', count: 0, color: '#475569' },
    { name: '5 to 15%', count: 0, color: '#f59e0b' },
    { name: '> 15%', count: 0, color: '#f43f5e' }
  ];

  trips.forEach(t => {
    const v = t.variancePercent || 0;
    if (v < -15) buckets[0].count++;
    else if (v < -5) buckets[1].count++;
    else if (v <= 5) buckets[2].count++;
    else if (v <= 15) buckets[3].count++;
    else buckets[4].count++;
  });

  return (
    <div className="space-y-8 select-none">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={() => navigate('/fuel')} className="!p-2 text-slate-400 hover:text-white">
          <ArrowLeft size={20} />
        </Button>
        <div>
          <h1 className="text-3xl font-extrabold font-display tracking-tight text-slate-100 flex items-center gap-3">
            <TrendingDown size={28} className="text-accent-emerald" />
            Variance Analysis
          </h1>
          <p className="text-sm text-slate-400">Estimated vs Actual fuel consumption deep-dive.</p>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-6 gap-4">
        <StatCard title="Total Estimated" value={formatCurrency(aggregates.totalEstimated)} color="indigo" />
        <StatCard title="Total Actual" value={formatCurrency(aggregates.totalActual)} color="amber" />
        <StatCard title="Avg Variance" value={formatPercent(aggregates.avgVariance)} color={aggregates.avgVariance > 0 ? 'rose' : 'emerald'} />
        <StatCard title="Over Budget" value={aggregates.overBudgetCount} color="rose" />
        <StatCard title="Under Budget" value={aggregates.underBudgetCount} color="emerald" />
        <StatCard title="Total Savings" value={formatCurrency(aggregates.totalSavings)} color="emerald" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 glass-panel rounded-xl p-5 border border-slate-800 overflow-x-auto">
          <h3 className="text-sm font-bold text-slate-100 font-display mb-4">Trip-by-Trip Variance</h3>
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="text-slate-500 font-bold border-b border-slate-800">
                <th className="py-2.5">Trip</th>
                <th>Context</th>
                <th>Route</th>
                <th>Est / Act Cost</th>
                <th>Variance</th>
                <th>Root Cause</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50">
              {trips.map((t) => {
                let vColor = 'text-slate-400';
                if (t.variancePercent < -5) vColor = 'text-emerald-400';
                else if (t.variancePercent > 15) vColor = 'text-rose-400';
                else if (t.variancePercent > 5) vColor = 'text-amber-400';

                return (
                  <tr key={t.tripId} className="text-slate-300">
                    <td className="py-3 font-mono font-bold text-indigo-400">#{t.tripId}</td>
                    <td>
                      <div className="font-semibold text-slate-200">{t.vehicleNumber}</div>
                      <div className="text-[10px] text-slate-500">{t.driverName}</div>
                    </td>
                    <td>
                      <div className="truncate max-w-[150px]">{t.pickup} →</div>
                      <div className="truncate max-w-[150px]">{t.destination}</div>
                    </td>
                    <td className="font-mono">
                      <div className="text-slate-400">{formatCurrency(t.estimatedCost, true)}</div>
                      <div className="text-slate-200">{formatCurrency(t.actualCost, true)}</div>
                    </td>
                    <td className={`font-mono font-bold ${vColor}`}>
                      {t.variancePercent > 0 ? '+' : ''}{formatPercent(t.variancePercent)}
                    </td>
                    <td className="text-[10px] text-slate-400 max-w-[150px] truncate">{t.rootCause || '-'}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="glass-panel rounded-xl p-5 border border-slate-800">
          <h3 className="text-sm font-bold text-slate-100 font-display mb-4">Variance Distribution</h3>
          <div className="h-[300px] w-full text-xs">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={buckets} layout="vertical" margin={{ top: 0, right: 20, left: 20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" horizontal={false} />
                <XAxis type="number" stroke="#64748b" tickLine={false} />
                <YAxis dataKey="name" type="category" stroke="#64748b" tickLine={false} />
                <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', color: '#f1f5f9' }} />
                <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                  {buckets.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FuelVarianceAnalysis;
