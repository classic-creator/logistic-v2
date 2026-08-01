import React, { useEffect, useMemo } from 'react';
import { useReportContext } from '../ReportContext';
import ReportKpiCard from '../components/ReportKpiCard';
import ChartCard from '../components/ChartCard';
import { RankingList } from '../components/RankingList';
import Table from '../../../components/common/Table';
import { ReportLoading } from '../components/ReportStates';
import { tooltipStyle, axisProps, gridProps, moneyTick } from '../lib/chartTheme';
import { formatCurrency, formatDistance, formatPercent } from '../lib/format';
import {
  Route as RouteIcon,
  MapPin,
  Navigation,
  TrendingUp,
  Trophy,
  ChartColumn,
  ChartLine,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  Line,
  Tooltip,
  Legend,
  ResponsiveContainer,
  XAxis,
  YAxis,
  CartesianGrid,
  ComposedChart,
} from 'recharts';

export const RouteAnalytics = () => {
  const { rangeKey, registerExporter, isLoading, routeList, range } = useReportContext();

  const popularRoutes = useMemo(
    () => [...routeList].sort((a, b) => b.count - a.count).slice(0, 8),
    [routeList]
  );

  const distanceData = useMemo(
    () =>
      [...routeList]
        .sort((a, b) => b.distance - a.distance)
        .slice(0, 8)
        .map((r) => ({ name: r.from, full: r.route, distance: r.distance, duration: r.duration })),
    [routeList]
  );

  const profitData = useMemo(
    () =>
      [...routeList]
        .sort((a, b) => b.profit - a.profit)
        .slice(0, 8)
        .map((r) => ({ name: r.from, full: r.route, revenue: r.revenue, profit: r.profit })),
    [routeList]
  );

  const exportRows = useMemo(
    () =>
      routeList.map((r) => ({
        route: r.route,
        trips: r.count,
        completed: r.completed,
        delayed: r.delayed,
        cancelled: r.cancelled,
        distance: r.distance,
        duration: r.duration,
        revenue: r.revenue,
        expenses: r.expenses,
        profit: r.profit,
        revenuePerTrip: r.revenuePerTrip,
      })),
    [routeList]
  );

  useEffect(() => {
    registerExporter(() => ({ filename: `route_analytics_${rangeKey}`, rows: exportRows }));
  }, [rangeKey, exportRows, registerExporter]);

  if (isLoading) return <ReportLoading />;

  const uniqueRoutes = routeList.length;
  const totalTrips = routeList.reduce((s, r) => s + r.count, 0);
  const topRoute = [...routeList].sort((a, b) => b.count - a.count)[0];
  const topRevenueRoute = [...routeList].sort((a, b) => b.revenue - a.revenue)[0];

  return (
    <div className="space-y-8">
      {/* KPI row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        <ReportKpiCard title="Unique Routes" value={uniqueRoutes} subtitle="Served corridors" icon={RouteIcon} color="indigo" />
        <ReportKpiCard title="Total Dispatches" value={totalTrips} subtitle={range.label} icon={Navigation} color="sky" />
        <ReportKpiCard title="Most Frequent" value={topRoute?.from || '—'} subtitle={topRoute ? `${topRoute.count} dispatches` : 'No data'} icon={Trophy} color="amber" />
        <ReportKpiCard title="Top Revenue Route" value={topRevenueRoute?.from || '—'} subtitle={topRevenueRoute ? formatCurrency(topRevenueRoute.revenue) : ''} icon={TrendingUp} color="emerald" />
      </div>

      {/* Popular routes + distance */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartCard title="Most Popular Routes" subtitle="Dispatch frequency by corridor" icon={ChartColumn}>
          {(fullscreen) => (
            <div className={`w-full ${fullscreen ? 'h-[60vh]' : 'h-[280px]'}`}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={popularRoutes} margin={{ top: 10, right: 10, left: -10, bottom: 0 }} layout="vertical">
                  <CartesianGrid {...gridProps} />
                  <XAxis type="number" {...axisProps} allowDecimals={false} />
                  <YAxis type="category" dataKey="from" {...axisProps} width={130} tick={{ fill: '#94a3b8', fontSize: 9 }} />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Bar dataKey="count" name="Dispatches" fill="#6366f1" radius={[0, 4, 4, 0]} maxBarSize={18} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </ChartCard>

        <ChartCard title="Distance & Duration" subtitle="Longest corridors by average distance" icon={RouteIcon}>
          {(fullscreen) => (
            <div className={`w-full ${fullscreen ? 'h-[60vh]' : 'h-[280px]'}`}>
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={distanceData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                  <CartesianGrid {...gridProps} />
                  <XAxis dataKey="name" {...axisProps} tick={{ fill: '#94a3b8', fontSize: 9 }} />
                  <YAxis yAxisId="l" {...axisProps} tickFormatter={(v) => `${v} km`} />
                  <YAxis yAxisId="r" orientation="right" {...axisProps} tickFormatter={(v) => `${v} hrs`} />
                  <Tooltip contentStyle={tooltipStyle} formatter={(v, n) => [n === 'Distance' ? formatDistance(v) : `${v} hrs`, n]} />
                  <Legend wrapperStyle={{ fontSize: '11px' }} />
                  <Bar yAxisId="l" dataKey="distance" name="Distance" fill="#0ea5e9" radius={[4, 4, 0, 0]} maxBarSize={24} />
                  <Line yAxisId="r" type="monotone" dataKey="duration" name="Duration" stroke="#f59e0b" strokeWidth={2.5} dot={{ r: 3 }} />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          )}
        </ChartCard>
      </div>

      {/* Revenue vs profit */}
      <ChartCard title="Revenue vs Profit by Route" subtitle="Top corridors by profit" icon={ChartLine}>
        {(fullscreen) => (
          <div className={`w-full ${fullscreen ? 'h-[60vh]' : 'h-[280px]'}`}>
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={profitData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid {...gridProps} />
                <XAxis dataKey="name" {...axisProps} tick={{ fill: '#94a3b8', fontSize: 9 }} />
                <YAxis {...axisProps} tickFormatter={moneyTick} />
                <Tooltip contentStyle={tooltipStyle} formatter={(v) => formatCurrency(v)} />
                <Legend wrapperStyle={{ fontSize: '11px' }} />
                <Bar dataKey="revenue" name="Revenue" fill="#10b981" radius={[4, 4, 0, 0]} maxBarSize={24} />
                <Bar dataKey="profit" name="Profit" fill="#6366f1" radius={[4, 4, 0, 0]} maxBarSize={24} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        )}
      </ChartCard>

      {/* Leaderboards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <RankingList
          title="Top Routes by Revenue"
          icon={TrendingUp}
          items={[...routeList].sort((a, b) => b.revenue - a.revenue).slice(0, 5).map((r) => ({ id: r.route, name: r.from, subtitle: `→ ${r.to}`, value: r.revenue }))}
          renderValue={(i) => <span className="text-xs font-bold text-emerald-400 font-mono">{formatCurrency(i.value)}</span>}
        />
        <RankingList
          title="Top Routes by Profit"
          icon={Trophy}
          items={[...routeList].sort((a, b) => b.profit - a.profit).slice(0, 5).map((r) => ({ id: r.route, name: r.from, subtitle: `→ ${r.to}`, value: r.profit }))}
          renderValue={(i) => <span className="text-xs font-bold text-indigo-400 font-mono">{formatCurrency(i.value)}</span>}
        />
      </div>

      {/* Route register */}
      <div className="glass-panel rounded-xl p-5 border border-slate-800 space-y-4">
        <h3 className="text-sm font-bold text-slate-100 font-display flex items-center gap-2 border-b border-slate-800 pb-3">
          <MapPin size={16} className="text-accent-indigo" />
          Route Performance Register
        </h3>
        <Table
          columns={[
            { header: 'Route', accessor: 'route', render: (r) => <span className="font-bold text-indigo-400">{r.route}</span> },
            { header: 'Trips', accessor: 'count', render: (r) => <span className="font-mono">{r.count}</span> },
            { header: 'Completed', accessor: 'completed', render: (r) => <span className="font-mono text-emerald-400">{r.completed}</span> },
            { header: 'Delayed', accessor: 'delayed', render: (r) => <span className="font-mono text-amber-400">{r.delayed}</span> },
            { header: 'Cancelled', accessor: 'cancelled', render: (r) => <span className="font-mono text-rose-400">{r.cancelled}</span> },
            { header: 'Distance', accessor: 'distance', render: (r) => <span className="font-mono">{formatDistance(r.distance)}</span> },
            { header: 'Avg Time', accessor: 'duration', render: (r) => <span className="font-mono">{r.duration} hrs</span> },
            { header: 'On-Time', accessor: 'count', render: (r) => <span className="font-mono">{r.completed ? formatPercent(((r.completed - r.delayed) / r.completed) * 100) : '—'}</span> },
            { header: 'Revenue / Trip', accessor: 'revenuePerTrip', render: (r) => <span className="font-mono text-emerald-400">{formatCurrency(r.revenuePerTrip)}</span> },
          ]}
          data={routeList}
          searchFields={['route']}
        />
      </div>
    </div>
  );
};

export default RouteAnalytics;
