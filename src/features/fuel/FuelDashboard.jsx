import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  useFuelDashboard,
  useFuelAnalytics,
  useFuelEntries,
  useApproveFuelEntry,
  useRejectFuelEntry,
} from '../../services/fuelServices';
import StatCard from '../../components/common/StatCard';
import { CardSkeleton } from '../../components/common/Skeleton';
import Button from '../../components/common/Button';
import { Fuel, TrendingUp, TrendingDown, AlertTriangle, IndianRupee, Gauge } from 'lucide-react';
import { formatCurrency, formatLiters, formatKmPerLiter, statusPillStyles } from './lib/fuelFormat';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const tooltipStyle = { backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', color: '#f1f5f9', fontSize: '12px' };

const ChartBar = ({ title, subtitle, data, dataKey, color = '#f59e0b', name }) => (
  <div className="glass-panel rounded-xl p-5 border border-slate-800 space-y-4">
    <div>
      <h3 className="text-sm font-bold text-slate-100 font-display">{title}</h3>
      {subtitle && <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>}
    </div>
    <div className="h-[240px] w-full text-xs">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
          <XAxis dataKey="name" stroke="#64748b" tickLine={false} tick={{ fill: '#94a3b8', fontSize: 10 }} />
          <YAxis stroke="#64748b" tickLine={false} tickFormatter={(v) => `₹${v / 1000}k`} />
          <Tooltip contentStyle={tooltipStyle} formatter={(v) => [formatCurrency(v), name]} />
          <Bar dataKey={dataKey} name={name} fill={color} radius={[4, 4, 0, 0]} maxBarSize={34} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  </div>
);

export const FuelDashboard = () => {
  const navigate = useNavigate();
  const { data: dash, isLoading: dashLoading } = useFuelDashboard();
  const { data: vehicleStats = [], isLoading: vehiclesLoading } = useFuelAnalytics({ dimension: 'vehicle' });
  const { data: driverStats = [], isLoading: driversLoading } = useFuelAnalytics({ dimension: 'driver' });
  const { data: anomalies, isLoading: anomaliesLoading } = useFuelAnalytics({ dimension: 'anomalies' });
  const { data: flaggedEntries = [], isLoading: entriesLoading } = useFuelEntries({ flagged: true, per_page: 50 });
  const approveMutation = useApproveFuelEntry();
  const rejectMutation = useRejectFuelEntry();

  const isLoading = dashLoading || vehiclesLoading || driversLoading || anomaliesLoading || entriesLoading;

  const charts = useMemo(() => {
    const byVehicle = (dash?.byVehicle || []).map((v) => ({ name: `V${v.id}`, cost: v.cost, liters: v.liters }));
    const byDriver = (dash?.byDriver || []).map((v) => ({ name: `D${v.id}`, cost: v.cost }));
    const byRoute = (dash?.byRoute || []).slice(0, 6).map((v) => ({ name: v.route, cost: v.cost, mileage: v.mileage }));
    const byCompany = (dash?.byCompany || []).map((v) => ({ name: `C${v.id}`, cost: v.cost }));
    return { byVehicle, byDriver, byRoute, byCompany };
  }, [dash]);

  const topConsumingVehicles = useMemo(
    () => [...vehicleStats].sort((a, b) => b.cost - a.cost).slice(0, 5),
    [vehicleStats]
  );
  const topEfficientVehicles = useMemo(
    () => [...vehicleStats].filter((v) => v.avgMileage > 0).sort((a, b) => b.avgMileage - a.avgMileage).slice(0, 5),
    [vehicleStats]
  );
  const topEfficientDrivers = useMemo(
    () => [...driverStats].filter((d) => d.avgMileage > 0).sort((a, b) => b.avgMileage - a.avgMileage).slice(0, 5),
    [driverStats]
  );

  const anomalyEntries = anomalies?.entries || flaggedEntries;

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

  const overall = dash?.overall || {};

  return (
    <div className="space-y-8 select-none">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold font-display tracking-tight text-slate-100 flex items-center gap-3">
            <Fuel size={28} className="text-accent-amber" />
            Fuel Intelligence
          </h1>
          <p className="text-sm text-slate-400">
            Real-time fuel estimation, consumption and variance command center.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => navigate('/reports')} className="gap-1.5">
            <TrendingUp size={14} /> BI Reports
          </Button>
          <Button variant="primary" size="sm" onClick={() => navigate('/fuel/analytics')} className="gap-1.5">
            <TrendingUp size={14} /> Deep Analytics
          </Button>
        </div>
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Today's Estimated Fuel Cost"
          value={formatCurrency(dash?.today?.estimatedFuelCost)}
          subtitle={`${dash?.today?.trips ?? 0} trips today`}
          icon={IndianRupee}
          color="indigo"
        />
        <StatCard
          title="Today's Actual Fuel Cost"
          value={formatCurrency(dash?.today?.actualFuelCost)}
          subtitle={`${dash?.today?.entries ?? 0} fills today`}
          icon={Fuel}
          color="amber"
        />
        <StatCard
          title="Today's Difference"
          value={formatCurrency(dash?.today?.difference)}
          change={`${Math.abs(Number(dash?.today?.difference || 0)) > 0 ? 'vs estimate' : ''}`}
          changeType={(dash?.today?.difference ?? 0) > 0 ? 'negative' : 'positive'}
          subtitle={dash?.today?.difference > 0 ? 'Over budget' : 'Under budget'}
          icon={TrendingDown}
          color="rose"
        />
        <StatCard
          title="Monthly Fuel Expense"
          value={formatCurrency(dash?.month?.actualFuelCost)}
          subtitle={`${dash?.month?.entries ?? 0} fills this month`}
          icon={IndianRupee}
          color="emerald"
        />
      </div>

      {/* Efficiency metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Average Cost / KM"
          value={`₹${Number(overall.avgCostPerKm || 0).toFixed(2)}`}
          subtitle="Across approved fills"
          icon={Gauge}
          color="sky"
        />
        <StatCard
          title="Average Mileage"
          value={formatKmPerLiter(overall.avgMileage)}
          subtitle="Fleet-wide efficiency"
          icon={Gauge}
          color="emerald"
        />
        <StatCard
          title="Total Fuel Cost"
          value={formatCurrency(overall.totalFuelCost)}
          subtitle={`${formatLiters(overall.totalLiters)} consumed`}
          icon={IndianRupee}
          color="amber"
        />
        <StatCard
          title="Flagged Entries"
          value={anomalies?.totalFlagged ?? 0}
          change={`${anomalies?.pendingReview ?? 0} pending review`}
          changeType="negative"
          subtitle="Anomaly watchlist"
          icon={AlertTriangle}
          color="rose"
        />
      </div>

      {/* Cost breakdown charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartBar
          title="Fuel Cost by Vehicle"
          subtitle="Approved fuel spend per vehicle"
          data={charts.byVehicle}
          dataKey="cost"
          color="#f59e0b"
          name="Fuel Cost"
        />
        <ChartBar
          title="Fuel Cost by Route"
          subtitle="Top routes by fuel spend"
          data={charts.byRoute}
          dataKey="cost"
          color="#6366f1"
          name="Fuel Cost"
        />
      </div>

      {/* Rankings */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Top consuming vehicles */}
        <div className="glass-panel rounded-xl p-5 border border-slate-800 space-y-3">
          <h3 className="text-sm font-bold text-slate-100 font-display flex items-center gap-2">
            <TrendingUp size={15} className="text-accent-rose" /> Top Fuel Consuming Vehicles
          </h3>
          <div className="space-y-2.5">
            {topConsumingVehicles.map((v, i) => (
              <button key={v.id} onClick={() => navigate(`/vehicles/${v.id}`)} className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-slate-800/40 cursor-pointer text-left">
                <span className="w-6 h-6 rounded-lg bg-slate-800 text-[10px] font-extrabold text-slate-400 flex items-center justify-center">{i + 1}</span>
                <div className="flex-1 min-w-0">
                  <span className="text-xs font-bold text-slate-200 block truncate">{v.vehicleNumber}</span>
                  <span className="text-[10px] text-slate-500">{formatLiters(v.liters)} · {v.entries} fills</span>
                </div>
                <span className="text-xs font-mono font-bold text-rose-400">{formatCurrency(v.cost, true)}</span>
              </button>
            ))}
            {!topConsumingVehicles.length && <p className="text-xs text-slate-500">No data yet.</p>}
          </div>
        </div>

        {/* Top efficient vehicles */}
        <div className="glass-panel rounded-xl p-5 border border-slate-800 space-y-3">
          <h3 className="text-sm font-bold text-slate-100 font-display flex items-center gap-2">
            <TrendingUp size={15} className="text-accent-emerald" /> Top Fuel Efficient Vehicles
          </h3>
          <div className="space-y-2.5">
            {topEfficientVehicles.map((v, i) => (
              <button key={v.id} onClick={() => navigate(`/vehicles/${v.id}`)} className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-slate-800/40 cursor-pointer text-left">
                <span className="w-6 h-6 rounded-lg bg-slate-800 text-[10px] font-extrabold text-slate-400 flex items-center justify-center">{i + 1}</span>
                <div className="flex-1 min-w-0">
                  <span className="text-xs font-bold text-slate-200 block truncate">{v.vehicleNumber}</span>
                  <span className="text-[10px] text-slate-500">{v.entries} fills · ₹{v.costPerKm}/km</span>
                </div>
                <span className="text-xs font-mono font-bold text-emerald-400">{formatKmPerLiter(v.avgMileage)}</span>
              </button>
            ))}
            {!topEfficientVehicles.length && <p className="text-xs text-slate-500">No efficiency data yet.</p>}
          </div>
        </div>

        {/* Top efficient drivers */}
        <div className="glass-panel rounded-xl p-5 border border-slate-800 space-y-3">
          <h3 className="text-sm font-bold text-slate-100 font-display flex items-center gap-2">
            <TrendingUp size={15} className="text-accent-sky" /> Top Fuel Efficient Drivers
          </h3>
          <div className="space-y-2.5">
            {topEfficientDrivers.map((d, i) => (
              <button key={d.id} onClick={() => navigate(`/drivers/${d.id}`)} className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-slate-800/40 cursor-pointer text-left">
                <span className="w-6 h-6 rounded-lg bg-slate-800 text-[10px] font-extrabold text-slate-400 flex items-center justify-center">{i + 1}</span>
                <div className="flex-1 min-w-0">
                  <span className="text-xs font-bold text-slate-200 block truncate">{d.driverName}</span>
                  <span className="text-[10px] text-slate-500">{formatLiters(d.liters)} · {formatCurrency(d.cost, true)}</span>
                </div>
                <span className="text-xs font-mono font-bold text-sky-400">{formatKmPerLiter(d.avgMileage)}</span>
              </button>
            ))}
            {!topEfficientDrivers.length && <p className="text-xs text-slate-500">No efficiency data yet.</p>}
          </div>
        </div>
      </div>

      {/* Abnormal fuel usage watchlist */}
      <div className="glass-panel rounded-xl p-5 border border-slate-800 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3">
          <h3 className="text-sm font-bold text-slate-100 font-display flex items-center gap-2">
            <AlertTriangle size={16} className="text-accent-rose" />
            Abnormal Fuel Usage — Review Queue
          </h3>
          <span className="rounded-full border border-rose-500/20 bg-rose-500/10 px-2.5 py-1 text-[10px] font-bold text-rose-300">
            {anomalyEntries.length} flagged
          </span>
        </div>

        {anomalyEntries.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-left text-xs border-collapse">
              <thead>
                <tr className="text-slate-500 font-bold border-b border-slate-800">
                  <th className="py-2.5">Entry / Time</th>
                  <th>Context</th>
                  <th>Amount</th>
                  <th>Reason</th>
                  <th>Status</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50">
                {anomalyEntries.slice(0, 10).map((entry) => (
                  <tr key={entry.id} className="text-slate-300">
                    <td className="py-3">
                      <span className="block font-mono font-bold text-indigo-400">#{entry.id}</span>
                      <span className="text-[10px] text-slate-500">{entry.filledAt ? new Date(entry.filledAt).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) : '—'}</span>
                    </td>
                    <td className="text-[11px]">
                      <span className="block font-semibold text-slate-200">{entry.vehicle?.number || '—'}</span>
                      <span className="text-slate-500">{entry.driver?.name || '—'}</span>
                    </td>
                    <td className="font-mono font-semibold">
                      {formatLiters(entry.quantity)}
                      <span className="block text-accent-amber">{formatCurrency(entry.totalCost)}</span>
                    </td>
                    <td className="max-w-[220px]">
                      {(entry.flags || []).map((f, i) => (
                        <span key={i} className="block text-[10px] text-accent-rose font-semibold">{f.message || f.rule}</span>
                      ))}
                    </td>
                    <td>
                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase ${statusPillStyles[entry.status] || 'bg-slate-800 text-slate-400'}`}>
                        {entry.status}
                      </span>
                    </td>
                    <td className="text-right">
                      <div className="flex justify-end gap-1.5">
                        {entry.status === 'Pending' && (
                          <>
                            <Button variant="success" size="sm" className="!px-2.5 !py-1 text-[10px]" isLoading={approveMutation.isPending} onClick={() => approveMutation.mutate(entry.id)}>
                              Approve
                            </Button>
                            <Button variant="danger" size="sm" className="!px-2.5 !py-1 text-[10px]" isLoading={rejectMutation.isPending} onClick={() => rejectMutation.mutate(entry.id)}>
                              Reject
                            </Button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="py-8 text-center space-y-2">
            <AlertTriangle size={28} className="mx-auto text-slate-700" />
            <p className="text-xs font-semibold text-slate-500">No abnormal fuel entries detected. The fleet is running clean.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default FuelDashboard;
