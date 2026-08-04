import { useMemo, useState } from 'react';
import {
  useFuelAnalytics,
  useFuelEntries,
} from '../../services/fuelServices';
import Table from '../../components/common/Table';
import StatCard from '../../components/common/StatCard';
import { CardSkeleton } from '../../components/common/Skeleton';
import { Fuel, Gauge, IndianRupee, TrendingUp, Route as RouteIcon } from 'lucide-react';
import { formatCurrency, formatLiters, formatKmPerLiter } from './lib/fuelFormat';
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';

const tooltipStyle = { backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', color: '#f1f5f9', fontSize: '12px' };
const axisTick = { fill: '#94a3b8', fontSize: 10 };

const DIMENSIONS = [
  { key: 'vehicle', label: 'By Vehicle' },
  { key: 'driver', label: 'By Driver' },
  { key: 'route', label: 'By Route' },
  { key: 'company', label: 'By Customer' },
  { key: 'month', label: 'Monthly Trend' },
  { key: 'year', label: 'Yearly Trend' },
];

export const FuelAnalytics = () => {
  const [dimension, setDimension] = useState('vehicle');
  const { data: stats = [], isLoading } = useFuelAnalytics({ dimension });
  const { data: entries = [] } = useFuelEntries({ status: 'Approved', per_page: 500 });

  const isTrend = dimension === 'month' || dimension === 'year';

  const tableRows = useMemo(() => {
    if (isTrend) {
      return stats.map((s) => ({
        id: s.month || s.year,
        name: s.month || s.year,
        entries: s.entries,
        liters: s.liters,
        cost: s.cost,
      }));
    }
    return stats.map((s) => ({
      id: s.id || s.route,
      name: dimension === 'vehicle' ? s.vehicleNumber : dimension === 'driver' ? s.driverName : dimension === 'company' ? s.companyName : s.route,
      entries: s.entries,
      liters: s.liters,
      cost: s.cost,
      mileage: s.avgMileage,
      costPerKm: s.costPerKm,
    }));
  }, [stats, dimension, isTrend]);

  const totals = useMemo(() => {
    const liters = stats.reduce((s, x) => s + Number(x.liters || 0), 0);
    const cost = stats.reduce((s, x) => s + Number(x.cost || 0), 0);
    const distance = stats.reduce((s, x) => s + Number(x.distance || 0), 0);
    const mileageVals = stats.map((x) => Number(x.avgMileage || 0)).filter((v) => v > 0);
    return {
      liters,
      cost,
      distance,
      avgMileage: mileageVals.length ? mileageVals.reduce((a, b) => a + b, 0) / mileageVals.length : 0,
      costPerKm: distance > 0 ? cost / distance : 0,
    };
  }, [stats]);

  const distributionData = useMemo(
    () => tableRows.filter((r) => r.cost > 0).map((r) => ({ name: String(r.name).slice(0, 14), cost: r.cost, liters: r.liters })).slice(0, 10),
    [tableRows]
  );

  const mileageTrendData = useMemo(
    () => stats.map((s) => ({ name: String(s.month || s.year || '').slice(0, 7), mileage: Number(s.avgMileage || 0) })).filter((s) => s.mileage > 0),
    [stats]
  );

  const isTrendView = dimension === 'month' || dimension === 'year';

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-56 bg-slate-800 rounded animate-pulse" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <CardSkeleton /><CardSkeleton /><CardSkeleton /><CardSkeleton />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 select-none">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold font-display tracking-tight text-slate-100 flex items-center gap-3">
            <Fuel size={28} className="text-accent-amber" />
            Fuel Analytics
          </h1>
          <p className="text-sm text-slate-400">Advanced fuel consumption analysis across every dimension.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {DIMENSIONS.map((d) => (
            <button
              key={d.key}
              onClick={() => setDimension(d.key)}
              className={`px-3 py-2 rounded-lg text-xs font-bold transition-colors cursor-pointer ${dimension === d.key ? 'bg-accent-indigo text-white shadow-lg shadow-indigo-500/20' : 'bg-slate-900 border border-slate-800 text-slate-400 hover:border-slate-700'}`}
            >
              {d.label}
            </button>
          ))}
        </div>
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="Total Fuel" value={formatLiters(totals.liters)} subtitle={`${entries.length} approved fills`} icon={Fuel} color="amber" />
        <StatCard title="Total Fuel Cost" value={formatCurrency(totals.cost)} subtitle="In selected view" icon={IndianRupee} color="rose" />
        <StatCard title="Average Mileage" value={formatKmPerLiter(totals.avgMileage)} subtitle="Fleet efficiency" icon={Gauge} color="emerald" />
        <StatCard title="Average Cost / KM" value={`₹${Number(totals.costPerKm || 0).toFixed(2)}`} subtitle="Fuel burn rate" icon={Gauge} color="sky" />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Distribution chart */}
        <div className="glass-panel rounded-xl p-5 border border-slate-800 space-y-4">
          <div>
            <h3 className="text-sm font-bold text-slate-100 font-display">Fuel Spend Distribution</h3>
            <p className="text-xs text-slate-500 mt-0.5">{isTrendView ? 'Period-by-period fuel spend' : 'Top entities by fuel spend'}</p>
          </div>
          <div className="h-[260px] w-full text-xs">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={distributionData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                <XAxis dataKey="name" stroke="#64748b" tickLine={false} tick={axisTick} />
                <YAxis stroke="#64748b" tickLine={false} tickFormatter={(v) => `₹${v / 1000}k`} />
                <Tooltip contentStyle={tooltipStyle} formatter={(v, n) => [n === 'cost' ? formatCurrency(v) : formatLiters(v), n]} />
                <Legend wrapperStyle={{ fontSize: '11px' }} />
                <Bar dataKey="cost" name="Fuel Cost" fill="#f59e0b" radius={[4, 4, 0, 0]} maxBarSize={30} />
                <Bar dataKey="liters" name="Liters" fill="#6366f1" radius={[4, 4, 0, 0]} maxBarSize={30} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Efficiency trend */}
        <div className="glass-panel rounded-xl p-5 border border-slate-800 space-y-4">
          <div>
            <h3 className="text-sm font-bold text-slate-100 font-display flex items-center gap-2">
              <TrendingUp size={15} className="text-accent-emerald" />
              Fuel Efficiency Trend
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">Average mileage (km/L) over the active dimension</p>
          </div>
          <div className="h-[260px] w-full text-xs">
            {mileageTrendData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={mileageTrendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                  <XAxis dataKey="name" stroke="#64748b" tickLine={false} tick={axisTick} />
                  <YAxis stroke="#64748b" tickLine={false} tickFormatter={(v) => `${v} km/L`} />
                  <Tooltip contentStyle={tooltipStyle} formatter={(v) => [`${v} km/L`, 'Avg Mileage']} />
                  <Line type="monotone" dataKey="mileage" name="Avg Mileage" stroke="#10b981" strokeWidth={2.5} dot={{ r: 3 }} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-slate-500">
                Mileage data not available for this dimension yet.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Detailed table */}
      <div className="glass-panel rounded-xl p-5 border border-slate-800 space-y-4">
        <h3 className="text-sm font-bold text-slate-100 font-display flex items-center gap-2 border-b border-slate-800 pb-3">
          <RouteIcon size={15} className="text-accent-indigo" />
          {isTrendView ? 'Fuel Consumption by Period' : 'Fuel Performance Register'}
        </h3>
        <Table
          columns={[
            { header: 'Name', accessor: 'name', render: (r) => <span className="font-bold text-slate-200">{r.name}</span> },
            { header: 'Fills', accessor: 'entries', render: (r) => <span className="font-mono">{r.entries}</span> },
            { header: 'Liters', accessor: 'liters', render: (r) => <span className="font-mono text-slate-300">{formatLiters(r.liters)}</span> },
            { header: 'Fuel Cost', accessor: 'cost', render: (r) => <span className="font-mono font-semibold text-accent-amber">{formatCurrency(r.cost)}</span> },
            ...(isTrendView
              ? []
              : [
                  { header: 'Avg Mileage', accessor: 'mileage', render: (r) => <span className="font-mono text-emerald-400">{formatKmPerLiter(r.mileage)}</span> },
                  { header: 'Cost / KM', accessor: 'costPerKm', render: (r) => <span className="font-mono text-sky-400">₹{Number(r.costPerKm || 0).toFixed(2)}</span> },
                ]),
          ]}
          data={tableRows}
          searchFields={['name']}
          searchPlaceholder="Search..."
        />
      </div>
    </div>
  );
};

export default FuelAnalytics;
