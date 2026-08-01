import React, { useEffect, useMemo } from 'react';
import { useReportContext } from '../ReportContext';
import ReportKpiCard from '../components/ReportKpiCard';
import ChartCard from '../components/ChartCard';
import Table from '../../../components/common/Table';
import { ReportLoading } from '../components/ReportStates';
import { tooltipStyle, axisProps, gridProps, moneyTick } from '../lib/chartTheme';
import { formatCurrency, formatPercent } from '../lib/format';
import {
  IndianRupee,
  Wallet,
  TrendingUp,
  CalendarDays,
  Trophy,
  Building2,
  Truck,
  Users,
  Route as RouteIcon,
  ChartArea,
  ChartLine,
  ChartColumn,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  Tooltip,
  Legend,
  ResponsiveContainer,
  XAxis,
  YAxis,
  CartesianGrid,
  LineChart,
  Line,
  Area,
  AreaChart,
} from 'recharts';

export const RevenueAnalytics = () => {
  const { rangeKey, registerExporter, isLoading, filteredFinances, finance, vehicleList, driverList, companyList, routeList, forecast, range } = useReportContext();

  // Daily revenue series
  const dailyRevenue = useMemo(() => {
    const groups = {};
    filteredFinances.forEach((f) => {
      if (!f.recordedAt) return;
      groups[f.recordedAt] = (groups[f.recordedAt] || 0) + (f.tripAmount || 0);
    });
    return Object.entries(groups)
      .map(([date, revenue]) => ({ name: date.slice(5), revenue }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [filteredFinances]);

  const monthlyRevenue = useMemo(() => {
    const groups = {};
    filteredFinances.forEach((f) => {
      if (!f.recordedAt) return;
      const d = new Date(f.recordedAt);
      const key = `${d.toLocaleString('default', { month: 'short' })} ${String(d.getFullYear()).slice(-2)}`;
      groups[key] = (groups[key] || 0) + (f.tripAmount || 0);
    });
    return Object.entries(groups).map(([name, revenue]) => ({ name, revenue }));
  }, [filteredFinances]);

  const companyRevenue = useMemo(
    () => companyList.filter((c) => c.revenue > 0).sort((a, b) => b.revenue - a.revenue).slice(0, 8).map((c) => ({ name: c.name, revenue: c.revenue })),
    [companyList]
  );
  const vehicleRevenue = useMemo(
    () => vehicleList.filter((v) => v.revenue > 0).sort((a, b) => b.revenue - a.revenue).slice(0, 8).map((v) => ({ name: v.number, revenue: v.revenue })),
    [vehicleList]
  );
  const driverRevenue = useMemo(
    () => driverList.filter((d) => d.revenue > 0).sort((a, b) => b.revenue - a.revenue).slice(0, 8).map((d) => ({ name: d.name, revenue: d.revenue })),
    [driverList]
  );
  const routeRevenue = useMemo(
    () => routeList.filter((r) => r.revenue > 0).sort((a, b) => b.revenue - a.revenue).slice(0, 8).map((r) => ({ name: r.route, revenue: r.revenue })),
    [routeList]
  );

  // Trend + forecast combined
  const trendWithForecast = useMemo(() => {
    const base = monthlyRevenue;
    const last = base[base.length - 1];
    if (!last) return base;
    const forecastShift = forecast.map((f, i) => ({
      ...f,
      name: i === 0 ? 'Next' : `Next+${i}`,
    }));
    return [...base, ...forecastShift];
  }, [monthlyRevenue, forecast]);

  const exportRows = useMemo(
    () => dailyRevenue.map((d) => ({ date: d.name, revenue: d.revenue })),
    [dailyRevenue]
  );

  useEffect(() => {
    registerExporter(() => ({ filename: `revenue_analytics_${rangeKey}`, rows: exportRows }));
  }, [rangeKey, exportRows, registerExporter]);

  if (isLoading) return <ReportLoading />;

  const dayCount = Math.max(dailyRevenue.length, 1);
  const bestDay = dailyRevenue.reduce((m, d) => (d.revenue > (m?.revenue || 0) ? d : m), null);
  const monthCount = Math.max(monthlyRevenue.length, 1);

  return (
    <div className="space-y-8">
      {/* KPI row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        <ReportKpiCard title="Total Revenue" value={formatCurrency(finance.tripAmount)} subtitle={range.label} icon={IndianRupee} color="emerald" />
        <ReportKpiCard title="Avg Daily Revenue" value={formatCurrency(finance.tripAmount / dayCount)} subtitle="Per active day" icon={CalendarDays} color="sky" />
        <ReportKpiCard title="Revenue Per Trip" value={formatCurrency(finance.tripAmount / Math.max(routeList.reduce((s, r) => s + r.count, 0), 1))} subtitle="Average per dispatch" icon={Wallet} color="indigo" />
        <ReportKpiCard title="Monthly Avg" value={formatCurrency(finance.tripAmount / monthCount)} subtitle="Across active months" icon={TrendingUp} color="violet" />
      </div>

      {/* Daily + monthly */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartCard title="Daily Revenue" subtitle="Billing captured per day" icon={ChartArea}>
          {(fullscreen) => (
            <div className={`w-full ${fullscreen ? 'h-[60vh]' : 'h-[280px]'}`}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={dailyRevenue} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                  <defs>
                    <linearGradient id="dailyRev" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.25} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid {...gridProps} />
                  <XAxis dataKey="name" {...axisProps} />
                  <YAxis {...axisProps} tickFormatter={moneyTick} />
                  <Tooltip contentStyle={tooltipStyle} formatter={(v) => formatCurrency(v)} />
                  <Area type="monotone" dataKey="revenue" name="Revenue" stroke="#10b981" strokeWidth={2.5} fill="url(#dailyRev)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}
        </ChartCard>

        <ChartCard title="Monthly Revenue" subtitle="Revenue aggregation by month" icon={ChartColumn}>
          {(fullscreen) => (
            <div className={`w-full ${fullscreen ? 'h-[60vh]' : 'h-[280px]'}`}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlyRevenue} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                  <CartesianGrid {...gridProps} />
                  <XAxis dataKey="name" {...axisProps} />
                  <YAxis {...axisProps} tickFormatter={moneyTick} />
                  <Tooltip contentStyle={tooltipStyle} formatter={(v) => formatCurrency(v)} />
                  <Bar dataKey="revenue" name="Revenue" fill="#6366f1" radius={[4, 4, 0, 0]} maxBarSize={38} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </ChartCard>
      </div>

      {/* Trend + forecast */}
      <ChartCard title="Revenue Trend & Forecast" subtitle="Historical trend with projected next periods" icon={ChartLine}>
        {(fullscreen) => (
          <div className={`w-full ${fullscreen ? 'h-[60vh]' : 'h-[280px]'}`}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trendWithForecast} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid {...gridProps} />
                <XAxis dataKey="name" {...axisProps} />
                <YAxis {...axisProps} tickFormatter={moneyTick} />
                <Tooltip contentStyle={tooltipStyle} formatter={(v) => formatCurrency(v)} />
                <Legend wrapperStyle={{ fontSize: '11px' }} />
                <Line type="monotone" dataKey="revenue" name="Revenue" stroke="#6366f1" strokeWidth={2.5} dot={{ r: 3 }} />
                <Line type="monotone" dataKey="forecast" name="Forecast" stroke="#f59e0b" strokeWidth={2.5} strokeDasharray="6 4" dot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </ChartCard>

      {/* Breakdowns */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <ChartCard title="Company-wise Revenue" icon={Building2}>
          {(fullscreen) => (
            <div className={`w-full ${fullscreen ? 'h-[60vh]' : 'h-[240px]'}`}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={companyRevenue} layout="vertical" margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
                  <CartesianGrid {...gridProps} />
                  <XAxis type="number" {...axisProps} tickFormatter={moneyTick} />
                  <YAxis type="category" dataKey="name" {...axisProps} width={110} tick={{ fill: '#94a3b8', fontSize: 9 }} />
                  <Tooltip contentStyle={tooltipStyle} formatter={(v) => formatCurrency(v)} />
                  <Bar dataKey="revenue" fill="#10b981" radius={[0, 4, 4, 0]} maxBarSize={16} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </ChartCard>

        <ChartCard title="Vehicle-wise Revenue" icon={Truck}>
          {(fullscreen) => (
            <div className={`w-full ${fullscreen ? 'h-[60vh]' : 'h-[240px]'}`}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={vehicleRevenue} layout="vertical" margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
                  <CartesianGrid {...gridProps} />
                  <XAxis type="number" {...axisProps} tickFormatter={moneyTick} />
                  <YAxis type="category" dataKey="name" {...axisProps} width={110} tick={{ fill: '#94a3b8', fontSize: 9 }} />
                  <Tooltip contentStyle={tooltipStyle} formatter={(v) => formatCurrency(v)} />
                  <Bar dataKey="revenue" fill="#6366f1" radius={[0, 4, 4, 0]} maxBarSize={16} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </ChartCard>

        <ChartCard title="Driver-wise Revenue" icon={Users}>
          {(fullscreen) => (
            <div className={`w-full ${fullscreen ? 'h-[60vh]' : 'h-[240px]'}`}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={driverRevenue} layout="vertical" margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
                  <CartesianGrid {...gridProps} />
                  <XAxis type="number" {...axisProps} tickFormatter={moneyTick} />
                  <YAxis type="category" dataKey="name" {...axisProps} width={110} tick={{ fill: '#94a3b8', fontSize: 9 }} />
                  <Tooltip contentStyle={tooltipStyle} formatter={(v) => formatCurrency(v)} />
                  <Bar dataKey="revenue" fill="#8b5cf6" radius={[0, 4, 4, 0]} maxBarSize={16} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </ChartCard>
      </div>

      {/* Route-wise revenue table */}
      <div className="glass-panel rounded-xl p-5 border border-slate-800 space-y-4">
        <h3 className="text-sm font-bold text-slate-100 font-display flex items-center gap-2 border-b border-slate-800 pb-3">
          <RouteIcon size={16} className="text-accent-indigo" />
          Route-wise Revenue
        </h3>
        <Table
          columns={[
            { header: 'Route', accessor: 'route', render: (r) => <span className="font-bold text-indigo-400">{r.route}</span> },
            { header: 'Trips', accessor: 'count', render: (r) => <span className="font-mono">{r.count}</span> },
            { header: 'Revenue', accessor: 'revenue', render: (r) => <span className="font-mono text-emerald-400 font-semibold">{formatCurrency(r.revenue)}</span> },
            { header: 'Revenue / Trip', accessor: 'revenuePerTrip', render: (r) => <span className="font-mono">{formatCurrency(r.revenuePerTrip)}</span> },
            { header: 'Share', accessor: 'revenue', render: (r) => <span className="font-mono text-slate-400">{finance.tripAmount ? formatPercent((r.revenue / finance.tripAmount) * 100, 0) : '0%'}</span> },
          ]}
          data={routeRevenue}
          searchFields={['route']}
        />
      </div>

      {/* Best day highlight */}
      {bestDay && (
        <div className="flex items-center gap-3 p-4 rounded-xl border border-emerald-500/15 bg-emerald-500/5">
          <Trophy size={20} className="text-amber-400" />
          <span className="text-xs text-slate-300">
            <strong className="text-emerald-400">Best revenue day:</strong> {bestDay.name} — {formatCurrency(bestDay.revenue)}
          </span>
        </div>
      )}
    </div>
  );
};

export default RevenueAnalytics;
