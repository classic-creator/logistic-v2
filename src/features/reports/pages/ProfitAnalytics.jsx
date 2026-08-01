import React, { useEffect, useMemo } from 'react';
import { useReportContext } from '../ReportContext';
import ReportKpiCard from '../components/ReportKpiCard';
import ChartCard from '../components/ChartCard';
import { RankingList } from '../components/RankingList';
import Table from '../../../components/common/Table';
import { ReportLoading } from '../components/ReportStates';
import { tooltipStyle, axisProps, gridProps, moneyTick } from '../lib/chartTheme';
import { formatCurrency, formatPercent } from '../lib/format';
import {
  TrendingUp,
  IndianRupee,
  Wallet,
  PieChart as PieIcon,
  Building2,
  Truck,
  Users,
  Route as RouteIcon,
  ChartLine,
  ChartColumn,
} from 'lucide-react';
import {
  Bar,
  Line,
  Area,
  AreaChart,
  Tooltip,
  Legend,
  ResponsiveContainer,
  XAxis,
  YAxis,
  CartesianGrid,
  ComposedChart,
} from 'recharts';

export const ProfitAnalytics = () => {
  const { rangeKey, registerExporter, isLoading, finance, monthlyFinance, vehicleList, driverList, companyList, routeList, range } = useReportContext();

  const marginSeries = useMemo(
    () => monthlyFinance.map((m) => ({ name: m.name, revenue: m.revenue, expenses: m.expenses, profit: m.profit })),
    [monthlyFinance]
  );

  const marginTrend = useMemo(
    () =>
      monthlyFinance.map((m) => ({
        name: m.name,
        margin: m.revenue ? Math.round((m.profit / m.revenue) * 100 * 10) / 10 : 0,
      })),
    [monthlyFinance]
  );

  const companyProfit = useMemo(
    () => companyList.filter((c) => c.profit !== 0).sort((a, b) => b.profit - a.profit).slice(0, 6),
    [companyList]
  );
  const vehicleProfit = useMemo(
    () => vehicleList.filter((v) => v.profit !== 0).sort((a, b) => b.profit - a.profit).slice(0, 6),
    [vehicleList]
  );
  const driverProfit = useMemo(
    () => driverList.filter((d) => d.profit !== 0).sort((a, b) => b.profit - a.profit).slice(0, 6),
    [driverList]
  );
  const routeProfit = useMemo(
    () => routeList.filter((r) => r.profit !== 0).sort((a, b) => b.profit - a.profit).slice(0, 6),
    [routeList]
  );

  const exportRows = useMemo(() => marginSeries, [marginSeries]);

  useEffect(() => {
    registerExporter(() => ({ filename: `profit_analytics_${rangeKey}`, rows: exportRows }));
  }, [rangeKey, exportRows, registerExporter]);

  if (isLoading) return <ReportLoading />;

  const margin = finance.tripAmount ? (finance.netProfit / finance.tripAmount) * 100 : 0;

  return (
    <div className="space-y-8">
      {/* KPI row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        <ReportKpiCard title="Net Profit" value={formatCurrency(finance.netProfit)} subtitle={range.label} icon={TrendingUp} color="emerald" />
        <ReportKpiCard title="Profit Margin" value={formatPercent(margin)} subtitle="Net over gross revenue" icon={PieIcon} color="violet" />
        <ReportKpiCard title="Gross Revenue" value={formatCurrency(finance.tripAmount)} subtitle="All billing captured" icon={IndianRupee} color="sky" />
        <ReportKpiCard title="Total Expenses" value={formatCurrency(finance.totalExpenses)} subtitle="All operating costs" icon={Wallet} color="rose" />
      </div>

      {/* Revenue / Expenses / Profit combo */}
      <ChartCard title="Profit Structure" subtitle="Revenue vs expenses vs net profit by month" icon={ChartColumn}>
        {(fullscreen) => (
          <div className={`w-full ${fullscreen ? 'h-[60vh]' : 'h-[300px]'}`}>
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={marginSeries} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid {...gridProps} />
                <XAxis dataKey="name" {...axisProps} />
                <YAxis {...axisProps} tickFormatter={moneyTick} />
                <Tooltip contentStyle={tooltipStyle} formatter={(v) => formatCurrency(v)} />
                <Legend wrapperStyle={{ fontSize: '11px' }} />
                <Bar dataKey="revenue" name="Revenue" fill="#6366f1" radius={[4, 4, 0, 0]} maxBarSize={26} />
                <Bar dataKey="expenses" name="Expenses" fill="#f43f5e" radius={[4, 4, 0, 0]} maxBarSize={26} />
                <Line type="monotone" dataKey="profit" name="Net Profit" stroke="#10b981" strokeWidth={2.5} dot={{ r: 3 }} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        )}
      </ChartCard>

      {/* Margin trend */}
      <ChartCard title="Monthly Margin Trend" subtitle="Net profit as % of revenue" icon={ChartLine}>
        {(fullscreen) => (
          <div className={`w-full ${fullscreen ? 'h-[60vh]' : 'h-[260px]'}`}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={marginTrend} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <defs>
                  <linearGradient id="marginFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid {...gridProps} />
                <XAxis dataKey="name" {...axisProps} />
                <YAxis {...axisProps} tickFormatter={(v) => `${v}%`} />
                <Tooltip contentStyle={tooltipStyle} formatter={(v) => `${v}%`} />
                <Area type="monotone" dataKey="margin" name="Margin" stroke="#10b981" strokeWidth={2.5} fill="url(#marginFill)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}
      </ChartCard>

      {/* Leaderboards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <RankingList
          title="Top Companies by Profit"
          icon={Building2}
          items={companyProfit.map((c) => ({ id: c.id, name: c.name, subtitle: `${c.completedTrips} trips`, value: c.profit }))}
          renderValue={(i) => <span className="text-xs font-bold text-emerald-400 font-mono">{formatCurrency(i.value)}</span>}
        />
        <RankingList
          title="Top Vehicles by Profit"
          icon={Truck}
          items={vehicleProfit.map((v) => ({ id: v.id, name: v.number, subtitle: v.type, value: v.profit }))}
          renderValue={(i) => <span className="text-xs font-bold text-emerald-400 font-mono">{formatCurrency(i.value)}</span>}
        />
        <RankingList
          title="Top Drivers by Profit"
          icon={Users}
          items={driverProfit.map((d) => ({ id: d.id, name: d.name, subtitle: `${d.completedTrips} trips`, value: d.profit }))}
          renderValue={(i) => <span className="text-xs font-bold text-emerald-400 font-mono">{formatCurrency(i.value)}</span>}
        />
        <RankingList
          title="Most Profitable Routes"
          icon={RouteIcon}
          items={routeProfit.map((r) => ({ id: r.route, name: r.route, subtitle: `${r.count} trips`, value: r.profit }))}
          renderValue={(i) => <span className="text-xs font-bold text-emerald-400 font-mono">{formatCurrency(i.value)}</span>}
        />
      </div>

      {/* Route profit table */}
      <div className="glass-panel rounded-xl p-5 border border-slate-800 space-y-4">
        <h3 className="text-sm font-bold text-slate-100 font-display flex items-center gap-2 border-b border-slate-800 pb-3">
          <RouteIcon size={16} className="text-accent-indigo" />
          Route Profitability Register
        </h3>
        <Table
          columns={[
            { header: 'Route', accessor: 'route', render: (r) => <span className="font-bold text-indigo-400">{r.route}</span> },
            { header: 'Trips', accessor: 'count', render: (r) => <span className="font-mono">{r.count}</span> },
            { header: 'Revenue', accessor: 'revenue', render: (r) => <span className="font-mono text-sky-400">{formatCurrency(r.revenue)}</span> },
            { header: 'Expenses', accessor: 'expenses', render: (r) => <span className="font-mono text-rose-400">{formatCurrency(r.expenses)}</span> },
            { header: 'Profit', accessor: 'profit', render: (r) => <span className={`font-mono font-semibold ${r.profit >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>{formatCurrency(r.profit)}</span> },
            { header: 'Profit / Trip', accessor: 'profitPerTrip', render: (r) => <span className="font-mono">{formatCurrency(r.profitPerTrip)}</span> },
          ]}
          data={routeList}
          searchFields={['route']}
        />
      </div>
    </div>
  );
};

export default ProfitAnalytics;
