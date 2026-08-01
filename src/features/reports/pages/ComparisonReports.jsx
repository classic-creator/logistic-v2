import React, { useEffect, useMemo } from 'react';
import { useReportContext } from '../ReportContext';
import ReportKpiCard from '../components/ReportKpiCard';
import ChartCard from '../components/ChartCard';
import { TrendIndicator } from '../components/RankingList';
import Table from '../../../components/common/Table';
import { ReportLoading } from '../components/ReportStates';
import { tooltipStyle, axisProps, gridProps, moneyTick } from '../lib/chartTheme';
import { formatCurrency, formatNumber } from '../lib/format';
import { getPreviousRange, dateInRange, pctChange } from '../lib/timeRanges';
import { financialTotals, tripBreakdown } from '../lib/analytics';
import {
  ArrowLeftRight,
  TrendingUp,
  IndianRupee,
  Wallet,
  Navigation,
  Clock,
  ChartColumn,
  ChartPie,
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
} from 'recharts';

export const ComparisonReports = () => {
  const { rangeKey, registerExporter, isLoading, range, allTrips, allFinances } = useReportContext();

  const prevRange = useMemo(() => getPreviousRange(range), [range]);

  // Previous-period datasets filtered in-page (independent of the active window).
  const prevTrips = useMemo(
    () => allTrips.filter((t) => dateInRange(t.pickupDate, prevRange)),
    [allTrips, prevRange]
  );
  const prevFinances = useMemo(
    () => allFinances.filter((f) => dateInRange(f.recordedAt, prevRange)),
    [allFinances, prevRange]
  );

  const currentFin = useMemo(
    () => financialTotals(allFinances.filter((f) => dateInRange(f.recordedAt, range))),
    [allFinances, range]
  );
  const previousFin = useMemo(() => financialTotals(prevFinances), [prevFinances]);
  const currentTrips = useMemo(
    () => allTrips.filter((t) => dateInRange(t.pickupDate, range)),
    [allTrips, range]
  );
  const currentStats = useMemo(() => tripBreakdown(currentTrips), [currentTrips]);
  const previousStats = useMemo(() => tripBreakdown(prevTrips), [prevTrips]);

  const comparison = useMemo(
    () => [
      { metric: 'Revenue', current: currentFin.tripAmount, previous: previousFin.tripAmount },
      { metric: 'Expenses', current: currentFin.totalExpenses, previous: previousFin.totalExpenses },
      { metric: 'Net Profit', current: currentFin.netProfit, previous: previousFin.netProfit },
      { metric: 'Trips Completed', current: currentStats.completed, previous: previousStats.completed },
    ],
    [currentFin, previousFin, currentStats, previousStats]
  );

  const exportRows = useMemo(
    () =>
      comparison.map((c) => ({
        metric: c.metric,
        currentPeriod: c.current,
        previousPeriod: c.previous,
        changePercent: Math.round(pctChange(c.current, c.previous) * 10) / 10,
      })),
    [comparison]
  );

  useEffect(() => {
    registerExporter(() => ({ filename: `time_comparison_${rangeKey}`, rows: exportRows }));
  }, [rangeKey, exportRows, registerExporter]);

  if (isLoading) return <ReportLoading />;

  const totalTripsChanged = pctChange(currentStats.total, previousStats.total);

  const cards = [
    {
      title: 'Revenue',
      value: formatCurrency(currentFin.tripAmount),
      previous: formatCurrency(previousFin.tripAmount),
      trend: pctChange(currentFin.tripAmount, previousFin.tripAmount),
      icon: IndianRupee,
      color: 'emerald',
    },
    {
      title: 'Net Profit',
      value: formatCurrency(currentFin.netProfit),
      previous: formatCurrency(previousFin.netProfit),
      trend: pctChange(currentFin.netProfit, previousFin.netProfit),
      icon: TrendingUp,
      color: 'violet',
    },
    {
      title: 'Expenses',
      value: formatCurrency(currentFin.totalExpenses),
      previous: formatCurrency(previousFin.totalExpenses),
      trend: pctChange(currentFin.totalExpenses, previousFin.totalExpenses),
      icon: Wallet,
      color: 'rose',
      invertTrend: true,
    },
    {
      title: 'Trips',
      value: formatNumber(currentStats.total),
      previous: formatNumber(previousStats.total),
      trend: totalTripsChanged,
      icon: Navigation,
      color: 'sky',
    },
  ];

  const statusCards = [
    { title: 'Completed', current: currentStats.completed, previous: previousStats.completed },
    { title: 'Delayed', current: currentStats.delayed, previous: previousStats.delayed, invert: true },
    { title: 'Cancelled', current: currentStats.cancelled, previous: previousStats.cancelled, invert: true },
    { title: 'On-Time Rate', current: currentStats.onTimeRate, previous: previousStats.onTimeRate, isRate: true },
  ];

  return (
    <div className="space-y-8">
      {/* KPI cards with trend vs previous period */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        {cards.map((c) => (
          <ReportKpiCard
            key={c.title}
            title={c.title}
            value={c.value}
            subtitle={`vs ${c.previous}`}
            trend={c.trend}
            trendLabel="vs prev"
            invertTrend={c.invertTrend}
            icon={c.icon}
            color={c.color}
          />
        ))}
      </div>

      {/* Status-level deltas */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statusCards.map((s) => (
          <div key={s.title} className="glass-panel rounded-xl p-4 border border-slate-800 flex flex-col gap-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">{s.title}</span>
            <div className="flex items-center justify-between gap-2">
              <span className="text-xl font-bold font-display text-slate-100">{s.isRate ? `${s.current}%` : s.current}</span>
              <TrendIndicator value={pctChange(s.current, s.previous)} invert={s.invert} />
            </div>
            <span className="text-[10px] text-slate-600">Prev: {s.isRate ? `${s.previous}%` : s.previous}</span>
          </div>
        ))}
      </div>

      {/* Comparison bars */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartCard title="Period Comparison" subtitle="Current vs previous window" icon={ChartColumn}>
          {(fullscreen) => (
            <div className={`w-full ${fullscreen ? 'h-[60vh]' : 'h-[280px]'}`}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={comparison} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                  <CartesianGrid {...gridProps} />
                  <XAxis dataKey="metric" {...axisProps} tick={{ fill: '#94a3b8', fontSize: 10 }} />
                  <YAxis {...axisProps} tickFormatter={moneyTick} />
                  <Tooltip contentStyle={tooltipStyle} formatter={(v, n) => [formatCurrency(v), n]} />
                  <Legend wrapperStyle={{ fontSize: '11px' }} />
                  <Bar dataKey="current" name={range.label} fill="#6366f1" radius={[4, 4, 0, 0]} maxBarSize={32} />
                  <Bar dataKey="previous" name={prevRange.label} fill="#334155" radius={[4, 4, 0, 0]} maxBarSize={32} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </ChartCard>

        <ChartCard title="Trips by Status" subtitle="Completed vs cancelled across windows" icon={ChartPie}>
          {(fullscreen) => (
            <div className={`w-full ${fullscreen ? 'h-[60vh]' : 'h-[280px]'}`}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={[
                    { name: 'Completed', current: currentStats.completed, previous: previousStats.completed },
                    { name: 'Cancelled', current: currentStats.cancelled, previous: previousStats.cancelled },
                    { name: 'Delayed', current: currentStats.delayed, previous: previousStats.delayed },
                  ]}
                  margin={{ top: 10, right: 10, left: -10, bottom: 0 }}
                >
                  <CartesianGrid {...gridProps} />
                  <XAxis dataKey="name" {...axisProps} tick={{ fill: '#94a3b8', fontSize: 10 }} />
                  <YAxis {...axisProps} allowDecimals={false} />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Legend wrapperStyle={{ fontSize: '11px' }} />
                  <Bar dataKey="current" name={range.label} fill="#10b981" radius={[4, 4, 0, 0]} maxBarSize={32} />
                  <Bar dataKey="previous" name={prevRange.label} fill="#334155" radius={[4, 4, 0, 0]} maxBarSize={32} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </ChartCard>
      </div>

      {/* Summary table */}
      <div className="glass-panel rounded-xl p-5 border border-slate-800 space-y-4">
        <h3 className="text-sm font-bold text-slate-100 font-display flex items-center gap-2 border-b border-slate-800 pb-3">
          <ArrowLeftRight size={16} className="text-accent-indigo" />
          Period Delta Summary
        </h3>
        <Table
          columns={[
            { header: 'Metric', accessor: 'metric', render: (r) => <span className="font-bold text-slate-200">{r.metric}</span> },
            { header: range.label, accessor: 'current', render: (r) => <span className="font-mono text-slate-300">{formatCurrency(r.current)}</span> },
            { header: prevRange.label, accessor: 'previous', render: (r) => <span className="font-mono text-slate-500">{formatCurrency(r.previous)}</span> },
            {
              header: 'Change',
              accessor: 'current',
              render: (r) => (
                <span>
                  <TrendIndicator value={pctChange(r.current, r.previous)} />
                </span>
              ),
            },
          ]}
          data={comparison}
        />
      </div>

      {/* On-time / duration metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <ReportKpiCard title="On-Time Rate" value={`${currentStats.onTimeRate}%`} subtitle={`Prev: ${previousStats.onTimeRate}%`} trend={pctChange(currentStats.onTimeRate, previousStats.onTimeRate)} icon={Clock} color="emerald" className="!p-4" />
        <ReportKpiCard title="Avg Distance" value={`${currentStats.avgDistance} km`} subtitle={`Prev: ${previousStats.avgDistance} km`} trend={pctChange(currentStats.avgDistance, previousStats.avgDistance)} icon={Navigation} color="sky" className="!p-4" />
        <ReportKpiCard title="Avg Duration" value={`${currentStats.avgDuration} hrs`} subtitle={`Prev: ${previousStats.avgDuration} hrs`} trend={pctChange(currentStats.avgDuration, previousStats.avgDuration)} invertTrend icon={Clock} color="amber" className="!p-4" />
        <ReportKpiCard title="Dispatches" value={currentStats.total} subtitle={`Prev: ${previousStats.total}`} trend={totalTripsChanged} icon={Navigation} color="indigo" className="!p-4" />
      </div>
    </div>
  );
};

export default ComparisonReports;
