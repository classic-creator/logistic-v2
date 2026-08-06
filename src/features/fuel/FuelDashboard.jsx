import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useIntelligenceOverview } from '../../services/intelligenceServices';
import { useFuelDashboard, useFuelAnalytics, useApproveFuelEntry, useRejectFuelEntry } from '../../services/fuelServices';
import StatCard from '../../components/common/StatCard';
import { CardSkeleton } from '../../components/common/Skeleton';
import Button from '../../components/common/Button';
import { Brain, TrendingDown, Award, Target, AlertTriangle, CheckCircle, IndianRupee, Gauge } from 'lucide-react';
import { formatCurrency, formatLiters, formatKmPerLiter, statusPillStyles } from './lib/fuelFormat';
import { AreaChart, Area, BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import FuelScoreGauge from './components/FuelScoreGauge';

const tooltipStyle = { backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', color: '#f1f5f9', fontSize: '12px' };

export const FuelDashboard = () => {
  const navigate = useNavigate();
  const { data: intelligenceData, isLoading: intelligenceLoading } = useIntelligenceOverview();
  const { data: dash, isLoading: dashLoading } = useFuelDashboard();
  const { data: anomalies, isLoading: anomaliesLoading } = useFuelAnalytics({ dimension: 'anomalies' });
  const approveMutation = useApproveFuelEntry();
  const rejectMutation = useRejectFuelEntry();

  const isLoading = intelligenceLoading || dashLoading || anomaliesLoading;

  const costByVehicle = useMemo(() => {
    return (dash?.byVehicle || []).map(v => ({ name: `V${v.id}`, cost: v.cost })).slice(0, 10);
  }, [dash]);

  const costByRoute = useMemo(() => {
    return (dash?.byRoute || []).map(v => ({ name: v.route, cost: v.cost })).slice(0, 6);
  }, [dash]);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-64 bg-slate-800 rounded animate-pulse" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <CardSkeleton /><CardSkeleton /><CardSkeleton /><CardSkeleton />
        </div>
      </div>
    );
  }

  const {
    fleetScore = 0,
    predictionAccuracy = 0,
    savingsOpportunity = 0,
    todayStats = {},
    monthlyTrend = [],
    mileageTrend = [],
    topDrivers = [],
    topVehicles = [],
    topRoutes = [],
    recentAnomalies = []
  } = intelligenceData || {};

  return (
    <div className="space-y-8 select-none">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold font-display tracking-tight text-slate-100 flex items-center gap-3">
            <Brain size={28} className="text-accent-indigo" />
            Fuel Intelligence Engine
          </h1>
          <p className="text-sm text-slate-400">
            AI-driven fuel optimization, anomaly detection, and predictive analytics.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" onClick={() => navigate('/fuel/variance')} className="gap-1.5 border-slate-700">
            <TrendingDown size={14} /> Variance Analysis
          </Button>
          <Button variant="outline" size="sm" onClick={() => navigate('/fuel/scores')} className="gap-1.5 border-slate-700">
            <Award size={14} /> Scoreboard
          </Button>
          <Button variant="outline" size="sm" onClick={() => navigate('/fuel/predictions')} className="gap-1.5 border-slate-700">
            <Target size={14} /> Predictions
          </Button>
          <Button variant="primary" size="sm" onClick={() => navigate('/fuel/learning')} className="gap-1.5 bg-indigo-600 hover:bg-indigo-500 text-white">
            <Brain size={14} /> Learning Insights
          </Button>
        </div>
      </div>

      {/* KPI Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="glass-panel rounded-xl p-5 shadow-lg flex items-center justify-between border-slate-800">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Fleet Fuel Score</span>
            <div className="mt-2 text-3xl font-bold font-mono text-slate-100">
              {fleetScore}
              <span className="text-sm text-slate-500">/100</span>
            </div>
          </div>
          <div className="w-16 h-16">
            <FuelScoreGauge score={fleetScore} size="sm" />
          </div>
        </div>
        <StatCard title="Prediction Accuracy" value={`${predictionAccuracy}%`} icon={Target} color="indigo" />
        <StatCard title="Today Est vs Actual" value={formatCurrency(todayStats.difference || 0)} change={todayStats.difference > 0 ? 'Over' : 'Under'} changeType={todayStats.difference > 0 ? 'negative' : 'positive'} subtitle="vs estimate" icon={TrendingDown} color="sky" />
        <StatCard title="Monthly Savings Opp." value={formatCurrency(savingsOpportunity)} subtitle="Based on AI recs" icon={IndianRupee} color="emerald" />
        
        <StatCard title="Active Anomalies" value={recentAnomalies.length} subtitle="Pending review" icon={AlertTriangle} color="rose" />
        <StatCard title="Learning Confidence" value="High" subtitle="Model actively learning" icon={Brain} color="violet" />
        <StatCard title="Cost Per KM" value={formatCurrency(dash?.overall?.avgCostPerKm || 0, false, 2)} subtitle="Fleet average" icon={Gauge} color="amber" />
        <StatCard title="Monthly Expense" value={formatCurrency(dash?.month?.actualFuelCost || 0)} subtitle="Actuals this month" icon={IndianRupee} color="slate" />
      </div>

      {/* Variance Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="glass-panel rounded-xl p-5 border border-slate-800 space-y-4">
          <div>
            <h3 className="text-sm font-bold text-slate-100 font-display">Est. vs Actual Fuel Cost</h3>
            <p className="text-xs text-slate-500">Monthly trend comparison</p>
          </div>
          <div className="h-[240px] w-full text-xs">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={monthlyTrend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorEst" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorAct" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#f59e0b" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                <XAxis dataKey="month" stroke="#64748b" tickLine={false} />
                <YAxis stroke="#64748b" tickLine={false} tickFormatter={(v) => `₹${v/1000}k`} />
                <Tooltip contentStyle={tooltipStyle} formatter={(value) => formatCurrency(value)} />
                <Area type="monotone" dataKey="estimated" stroke="#6366f1" fillOpacity={1} fill="url(#colorEst)" name="Estimated" />
                <Area type="monotone" dataKey="actual" stroke="#f59e0b" fillOpacity={1} fill="url(#colorAct)" name="Actual" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="glass-panel rounded-xl p-5 border border-slate-800 space-y-4">
          <div>
            <h3 className="text-sm font-bold text-slate-100 font-display">Fleet Mileage Trend</h3>
            <p className="text-xs text-slate-500">Average km/L over time</p>
          </div>
          <div className="h-[240px] w-full text-xs">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={mileageTrend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                <XAxis dataKey="month" stroke="#64748b" tickLine={false} />
                <YAxis stroke="#64748b" tickLine={false} />
                <Tooltip contentStyle={tooltipStyle} formatter={(value) => `${value} km/L`} />
                <Line type="monotone" dataKey="mileage" stroke="#10b981" strokeWidth={3} dot={{ r: 4, fill: '#10b981', strokeWidth: 2, stroke: '#0f1524' }} name="Mileage" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Intelligence Rankings */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="glass-panel rounded-xl p-5 border border-slate-800 space-y-3">
          <h3 className="text-sm font-bold text-slate-100 font-display text-accent-sky">Top Efficient Drivers</h3>
          <div className="space-y-2">
            {topDrivers.map((d, i) => (
              <div key={d.id || i} className="flex justify-between items-center bg-slate-900/50 p-2 rounded">
                <div className="flex flex-col">
                  <span className="text-xs font-bold text-slate-200">{d.name}</span>
                  <span className="text-[10px] text-slate-500">{d.avgMileage} km/L</span>
                </div>
                <div className="text-xs font-mono font-bold px-2 py-1 bg-emerald-500/20 text-emerald-400 rounded-full">{d.fuelScore} pts</div>
              </div>
            ))}
          </div>
        </div>

        <div className="glass-panel rounded-xl p-5 border border-slate-800 space-y-3">
          <h3 className="text-sm font-bold text-slate-100 font-display text-accent-emerald">Top Efficient Vehicles</h3>
          <div className="space-y-2">
            {topVehicles.map((v, i) => (
              <div key={v.id || i} className="flex justify-between items-center bg-slate-900/50 p-2 rounded">
                <div className="flex flex-col">
                  <span className="text-xs font-bold text-slate-200">{v.number}</span>
                  <span className="text-[10px] text-slate-500">{v.avgMileage} km/L</span>
                </div>
                <div className="text-xs font-mono font-bold px-2 py-1 bg-emerald-500/20 text-emerald-400 rounded-full">{v.fuelScore} pts</div>
              </div>
            ))}
          </div>
        </div>

        <div className="glass-panel rounded-xl p-5 border border-slate-800 space-y-3">
          <h3 className="text-sm font-bold text-slate-100 font-display text-accent-amber">Most Profitable Routes</h3>
          <div className="space-y-2">
            {topRoutes.map((r, i) => (
              <div key={i} className="flex justify-between items-center bg-slate-900/50 p-2 rounded">
                <div className="flex flex-col">
                  <span className="text-xs font-bold text-slate-200 truncate max-w-[150px]">{r.pickup} → {r.destination}</span>
                  <span className="text-[10px] text-slate-500">{r.totalTrips} trips</span>
                </div>
                <div className="text-xs font-mono font-bold text-emerald-400">{formatCurrency(r.avgProfit, true)} avg</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Cost Breakdown Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="glass-panel rounded-xl p-5 border border-slate-800 space-y-4">
          <h3 className="text-sm font-bold text-slate-100 font-display">Fuel Cost by Vehicle</h3>
          <div className="h-[240px] w-full text-xs">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={costByVehicle} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                <XAxis dataKey="name" stroke="#64748b" tickLine={false} tick={{ fill: '#94a3b8', fontSize: 10 }} />
                <YAxis stroke="#64748b" tickLine={false} tickFormatter={(v) => `₹${v / 1000}k`} />
                <Tooltip contentStyle={tooltipStyle} formatter={(v) => [formatCurrency(v), 'Cost']} />
                <Bar dataKey="cost" fill="#8b5cf6" radius={[4, 4, 0, 0]} maxBarSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        
        <div className="glass-panel rounded-xl p-5 border border-slate-800 space-y-4">
          <h3 className="text-sm font-bold text-slate-100 font-display">Fuel Cost by Route</h3>
          <div className="h-[240px] w-full text-xs">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={costByRoute} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                <XAxis dataKey="name" stroke="#64748b" tickLine={false} tick={{ fill: '#94a3b8', fontSize: 10 }} />
                <YAxis stroke="#64748b" tickLine={false} tickFormatter={(v) => `₹${v / 1000}k`} />
                <Tooltip contentStyle={tooltipStyle} formatter={(v) => [formatCurrency(v), 'Cost']} />
                <Bar dataKey="cost" fill="#0ea5e9" radius={[4, 4, 0, 0]} maxBarSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Anomaly Review Queue */}
      <div className="glass-panel rounded-xl p-5 border border-slate-800 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3">
          <h3 className="text-sm font-bold text-slate-100 font-display flex items-center gap-2">
            <AlertTriangle size={16} className="text-accent-rose" />
            Anomaly Review Queue
          </h3>
          <span className="bg-rose-500/10 text-rose-300 border border-rose-500/20 px-2 py-0.5 rounded-full text-xs font-bold">
            {recentAnomalies.length} Pending
          </span>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="text-slate-500 font-bold border-b border-slate-800">
                <th className="py-2.5">ID</th>
                <th>Vehicle / Driver</th>
                <th>Quantity / Cost</th>
                <th>Flags</th>
                <th>Status</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50">
              {recentAnomalies.map((entry) => (
                <tr key={entry.id} className="text-slate-300">
                  <td className="py-3 font-mono text-indigo-400">#{entry.id}</td>
                  <td>
                    <div className="font-semibold text-slate-200">{entry.vehicle?.number || entry.vehicleNumber || `Vehicle #${entry.vehicleId}`}</div>
                    <div className="text-[10px] text-slate-500">{entry.driver?.name || entry.driverName || `Driver #${entry.driverId}`}</div>
                  </td>
                  <td>
                    <div className="font-mono">{entry.quantity} L</div>
                    <div className="text-[10px] text-amber-400 font-mono">{formatCurrency(entry.totalCost)}</div>
                  </td>
                  <td>
                    <div className="flex flex-col gap-1">
                      {(entry.flags || []).map((f, i) => (
                        <span key={i} className="text-[10px] bg-rose-500/20 text-rose-400 px-1.5 py-0.5 rounded max-w-max">
                          {typeof f === 'object' ? (f.message || f.rule || 'Flagged') : String(f)}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td>
                    <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase ${statusPillStyles[entry.status] || 'bg-slate-800 text-slate-400'}`}>
                      {entry.status}
                    </span>
                  </td>
                  <td className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button variant="success" size="sm" className="!py-1 !px-2 text-[10px]" isLoading={approveMutation.isPending} onClick={() => approveMutation.mutate(entry.id)}>Approve</Button>
                      <Button variant="danger" size="sm" className="!py-1 !px-2 text-[10px]" isLoading={rejectMutation.isPending} onClick={() => rejectMutation.mutate(entry.id)}>Reject</Button>
                    </div>
                  </td>
                </tr>
              ))}
              {recentAnomalies.length === 0 && (
                <tr>
                  <td colSpan="6" className="text-center py-6 text-slate-500 text-xs">No pending anomalies detected.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default FuelDashboard;
