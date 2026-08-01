import { useEffect, useMemo } from 'react';
import { useReportContext } from '../ReportContext';
import ReportKpiCard from '../components/ReportKpiCard';
import ChartCard from '../components/ChartCard';
import RankingList from '../components/RankingList';
import { ReportLoading } from '../components/ReportStates';
import { CHART_COLORS, tooltipStyle, axisProps, gridProps, moneyTick } from '../lib/chartTheme';
import { formatCurrency, formatPercent, formatDistance, formatHours, formatNumber } from '../lib/format';
import { topList } from '../lib/analytics';
import {
  Navigation,
  Truck,
  Users,
  CheckCircle2,
  XCircle,
  IndianRupee,
  Wallet,
  PiggyBank,
  Clock,
  MapPin,
  Gauge,
  Building2,
  ChartArea,
  ChartPie,
  ChartLine,
  ArrowUpRight,
  Activity,
} from 'lucide-react';
import {
  AreaChart,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
  XAxis,
  YAxis,
  CartesianGrid,
  LineChart,
  Line,
  Area,
  BarChart,
  Bar,
} from 'recharts';

export const ExecutiveDashboard = () => {
  const {
    range,
    rangeKey,
    registerExporter,
    isLoading,
    filteredTrips,
    tripStats,
    finance,
    monthlyFinance,
    dailyTrips,
    driverList,
    companyList,
    fleetUtilization,
    driverUtilization,
  } = useReportContext();

  const exportRows = useMemo(
    () => [
      { metric: 'Total Trips', value: tripStats.total },
      { metric: 'Running Trips', value: tripStats.running },
      { metric: 'Completed Trips', value: tripStats.completed },
      { metric: 'Cancelled Trips', value: tripStats.cancelled },
      { metric: 'Total Revenue (INR)', value: finance.tripAmount },
      { metric: 'Total Expenses (INR)', value: finance.totalExpenses },
      { metric: 'Net Profit (INR)', value: finance.netProfit },
      { metric: 'Outstanding Receivables (INR)', value: finance.pendingAmount },
      { metric: 'On-Time Delivery %', value: tripStats.onTimeRate },
      { metric: 'Average Revenue Per Trip', value: tripStats.total ? finance.tripAmount / tripStats.total : 0 },
      { metric: 'Average Cost Per Trip', value: tripStats.total ? finance.totalExpenses / tripStats.total : 0 },
      { metric: 'Average Trip Duration (hrs)', value: tripStats.avgDuration },
      { metric: 'Average Distance (km)', value: tripStats.avgDistance },
      { metric: 'Vehicle Utilization %', value: fleetUtilization.rate },
      { metric: 'Driver Utilization %', value: driverUtilization.rate },
    ],
    [tripStats, finance, fleetUtilization, driverUtilization]
  );

  useEffect(() => {
    registerExporter(() => ({ filename: `executive_dashboard_${rangeKey}`, rows: exportRows }));
  }, [rangeKey, exportRows, registerExporter]);

  if (isLoading) return <ReportLoading />;

  const avgRevenuePerTrip = tripStats.total ? finance.tripAmount / tripStats.total : 0;
  const avgCostPerTrip = tripStats.total ? finance.totalExpenses / tripStats.total : 0;
  const margin = finance.tripAmount ? (finance.netProfit / finance.tripAmount) * 100 : 0;

  const statusPieData = [
    { name: 'Completed', value: tripStats.completed },
    { name: 'Running', value: tripStats.running },
    { name: 'Assigned', value: tripStats.assigned },
    { name: 'Cancelled', value: tripStats.cancelled },
  ].filter((d) => d.value > 0);

  const companyRevenue = companyList
    .filter((c) => c.revenue > 0)
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 6);

  const topDrivers = topList(driverList, 'onTimeRate', 5);

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="flex items-center gap-2 text-[10px] font-extrabold uppercase tracking-[0.18em] text-indigo-300">
            <Activity size={13} /> Executive pulse
          </div>
          <h2 className="mt-1 font-display text-xl font-bold tracking-tight text-slate-100">What needs attention right now</h2>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-slate-500">
          <span className="h-2 w-2 rounded-full bg-emerald-400 shadow-lg shadow-emerald-400/50" />
          Live operational snapshot
        </div>
      </div>

      {/* Primary KPI row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        <ReportKpiCard
          title="Total Trips"
          value={formatNumber(tripStats.total)}
          subtitle={`${tripStats.running} running • ${tripStats.completed} completed`}
          icon={Navigation}
          color="indigo"
          trend={filteredTrips.length ? undefined : 0}
        />
        <ReportKpiCard
          title="Total Revenue"
          value={formatCurrency(finance.tripAmount)}
          subtitle="Billed in period"
          icon={IndianRupee}
          color="emerald"
        />
        <ReportKpiCard
          title="Net Profit"
          value={formatCurrency(finance.netProfit)}
          subtitle={`${formatPercent(margin)} margin`}
          icon={PiggyBank}
          color="sky"
          trend={finance.tripAmount ? margin : 0}
          trendLabel="margin"
        />
        <ReportKpiCard
          title="Outstanding Receivables"
          value={formatCurrency(finance.pendingAmount)}
          subtitle="Pending customer payments"
          icon={Wallet}
          color="amber"
        />
      </div>

      {/* Secondary compact stat strip */}
      <div className="grid grid-cols-2 overflow-hidden rounded-2xl border border-slate-800/90 bg-slate-900/45 md:grid-cols-5">
        {[
          { label: 'Avg Revenue / Trip', value: formatCurrency(avgRevenuePerTrip), icon: IndianRupee, color: 'emerald' },
          { label: 'Avg Cost / Trip', value: formatCurrency(avgCostPerTrip), icon: Wallet, color: 'rose' },
          { label: 'Avg Distance', value: formatDistance(tripStats.avgDistance), icon: MapPin, color: 'sky' },
          { label: 'Avg Trip Duration', value: formatHours(tripStats.avgDuration), icon: Clock, color: 'violet' },
          { label: 'On-Time Rate', value: formatPercent(tripStats.onTimeRate), icon: CheckCircle2, color: 'emerald' },
          { label: 'Vehicle Utilization', value: formatPercent(fleetUtilization.rate), icon: Truck, color: 'indigo' },
          { label: 'Driver Utilization', value: formatPercent(driverUtilization.rate), icon: Users, color: 'sky' },
          { label: 'Delayed Deliveries', value: formatNumber(tripStats.delayed), icon: XCircle, color: 'rose' },
          { label: 'Completed Trips', value: formatNumber(tripStats.completed), icon: CheckCircle2, color: 'emerald' },
          { label: 'Cancelled Trips', value: formatNumber(tripStats.cancelled), icon: XCircle, color: 'amber' },
        ].map((s, index) => (
          <div key={s.label} className={`flex min-w-0 items-center gap-3 border-slate-800/90 p-4 ${index % 2 !== 1 ? 'border-r' : ''} ${index > 1 ? 'md:border-r' : ''} ${index >= 5 ? 'border-t' : ''} ${index >= 5 && index % 2 !== 1 ? 'md:border-t-0' : ''} ${index === 4 ? 'md:border-r-0 md:border-t-0' : ''} ${index === 5 ? 'md:border-t' : ''}`}>
            <span className={`flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl ${s.color === 'emerald' ? 'bg-emerald-500/10 text-emerald-400' : s.color === 'rose' ? 'bg-rose-500/10 text-rose-400' : s.color === 'sky' ? 'bg-sky-500/10 text-sky-400' : s.color === 'violet' ? 'bg-violet-500/10 text-violet-400' : s.color === 'amber' ? 'bg-amber-500/10 text-amber-400' : 'bg-indigo-500/10 text-indigo-400'}`}>
              <s.icon size={16} />
            </span>
            <div className="min-w-0">
              <span className="block truncate text-[10px] font-bold uppercase tracking-wider text-slate-500">{s.label}</span>
              <span className="mt-1 block truncate font-display text-lg font-bold tracking-tight text-slate-100">{s.value}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-2 rounded-xl border border-amber-400/10 bg-amber-400/[0.04] px-4 py-3 text-xs text-slate-400">
        <ArrowUpRight size={15} className="text-amber-300" />
        <span><strong className="text-slate-200">Operational cue:</strong> {tripStats.delayed} delayed deliveries are impacting the {formatPercent(tripStats.onTimeRate)} on-time rate.</span>
      </div>

      {/* Revenue trend + Trip status */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <ChartCard
            title="Revenue vs Expense Trend"
            subtitle="Monthly financial performance"
            icon={ChartArea}
          >
            {(fullscreen) => (
              <div className={`w-full ${fullscreen ? 'h-[60vh]' : 'h-[280px]'}`}>
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={monthlyFinance} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                    <defs>
                      <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#6366f1" stopOpacity={0.25} />
                        <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="expGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.25} />
                        <stop offset="95%" stopColor="#f43f5e" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid {...gridProps} />
                    <XAxis dataKey="name" {...axisProps} />
                    <YAxis {...axisProps} tickFormatter={moneyTick} />
                    <Tooltip contentStyle={tooltipStyle} formatter={(v, n) => [formatCurrency(v), n]} />
                    <Area type="monotone" dataKey="revenue" name="Revenue" stroke="#6366f1" strokeWidth={2.5} fill="url(#revGrad)" />
                    <Area type="monotone" dataKey="expenses" name="Expenses" stroke="#f43f5e" strokeWidth={2} fill="url(#expGrad)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            )}
          </ChartCard>
        </div>

        <ChartCard title="Trip Status Mix" subtitle={`Within ${range.label}`} icon={ChartPie}>
          {(fullscreen) => (
            <div className={`w-full ${fullscreen ? 'h-[60vh]' : 'h-[280px]'} flex items-center justify-center`}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={statusPieData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={80}
                    paddingAngle={3}
                  >
                    {statusPieData.map((_, i) => (
                      <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={tooltipStyle} />
                  <Legend wrapperStyle={{ fontSize: '11px' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
        </ChartCard>
      </div>

      {/* Daily trips + company revenue */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <ChartCard title="Daily Trip Volume" subtitle="Dispatches per day in period" icon={ChartLine}>
            {(fullscreen) => (
              <div className={`w-full ${fullscreen ? 'h-[60vh]' : 'h-[260px]'}`}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={dailyTrips} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid {...gridProps} />
                    <XAxis dataKey="name" {...axisProps} />
                    <YAxis {...axisProps} allowDecimals={false} />
                    <Tooltip contentStyle={tooltipStyle} />
                    <Line type="monotone" dataKey="trips" name="Trips" stroke="#818cf8" strokeWidth={2.5} dot={{ r: 3 }} activeDot={{ r: 5 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}
          </ChartCard>
        </div>

        <ChartCard title="Company-wise Revenue" subtitle="Top clients by billing" icon={Building2}>
          {(fullscreen) => (
            <div className={`w-full ${fullscreen ? 'h-[60vh]' : 'h-[260px]'}`}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={companyRevenue} margin={{ top: 10, right: 10, left: -10, bottom: 0 }} layout="vertical">
                  <CartesianGrid {...gridProps} />
                  <XAxis type="number" {...axisProps} tickFormatter={moneyTick} />
                  <YAxis type="category" dataKey="name" {...axisProps} width={110} tick={{ fill: '#94a3b8', fontSize: 10 }} />
                  <Tooltip contentStyle={tooltipStyle} formatter={(v) => formatCurrency(v)} />
                  <Bar dataKey="revenue" name="Revenue" fill="#10b981" radius={[0, 4, 4, 0]} maxBarSize={18} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </ChartCard>
      </div>

      {/* Fleet utilization + driver leaderboard */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <ChartCard title="Fleet Utilization Overview" subtitle="Current fleet status distribution" icon={Truck}>
            <div className="space-y-4">
              {[
                { label: 'Running', value: fleetUtilization.running, color: 'bg-sky-500' },
                { label: 'Available', value: fleetUtilization.available, color: 'bg-emerald-500' },
                { label: 'Maintenance', value: fleetUtilization.maintenance, color: 'bg-amber-500' },
                { label: 'Inactive', value: fleetUtilization.inactive, color: 'bg-slate-600' },
              ].map((row) => {
                const pct = fleetUtilization.running + fleetUtilization.available + fleetUtilization.maintenance + fleetUtilization.inactive
                  ? (row.value / (fleetUtilization.running + fleetUtilization.available + fleetUtilization.maintenance + fleetUtilization.inactive)) * 100
                  : 0;
                return (
                  <div key={row.label} className="space-y-1.5">
                    <div className="flex justify-between text-xs">
                      <span className="font-semibold text-slate-400">{row.label}</span>
                      <span className="font-bold text-slate-200 font-mono">{row.value}</span>
                    </div>
                    <div className="h-2 rounded-full bg-slate-800 overflow-hidden">
                      <div className={`h-full rounded-full ${row.color}`} style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
              <div className="pt-2 flex items-center gap-2">
                <Gauge size={16} className="text-accent-indigo" />
                <span className="text-sm font-bold text-slate-200">
                  Utilization: {formatPercent(fleetUtilization.rate)}
                </span>
              </div>
            </div>
          </ChartCard>
        </div>

        <RankingList
          title="Driver On-Time Leaderboard"
          icon={Users}
          items={topDrivers.map((d) => ({
            id: d.id,
            name: d.name,
            subtitle: `${d.completedTrips} completed trips • ${d.rating}★`,
            value: d.onTimeRate,
          }))}
          renderValue={(item) => (
            <span className="text-xs font-bold text-emerald-400 font-mono">{item.value}%</span>
          )}
        />
      </div>
    </div>
  );
};

export default ExecutiveDashboard;
