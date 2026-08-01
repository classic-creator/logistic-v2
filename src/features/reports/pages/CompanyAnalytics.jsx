import React, { useEffect, useMemo } from 'react';
import { useReportContext } from '../ReportContext';
import ReportKpiCard from '../components/ReportKpiCard';
import ChartCard from '../components/ChartCard';
import RankingList from '../components/RankingList';
import Table from '../../../components/common/Table';
import { ReportLoading, StatusPill } from '../components/ReportStates';
import { tooltipStyle, axisProps, gridProps, moneyTick } from '../lib/chartTheme';
import { formatCurrency, formatNumber, formatPercent } from '../lib/format';
import { topList } from '../lib/analytics';
import {
  Building2,
  FileText,
  Wallet,
  Award,
  Zap,
  AlertTriangle,
  TrendingUp,
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
  Area,
  AreaChart,
} from 'recharts';

export const CompanyAnalytics = () => {
  const {
    rangeKey,
    registerExporter,
    isLoading,
    companyList,
    filteredTrips,
    filteredFinances,
  } = useReportContext();

  const exportRows = useMemo(
    () =>
      companyList.map((c) => ({
        company: c.name,
        gst: c.gst,
        orders: c.orders,
        trips: c.completedTrips,
        revenue: c.revenue,
        expenses: c.expenses,
        profit: c.profit,
        outstanding: c.outstanding,
        paymentReceived: c.received,
        avgOrderValue: c.avgOrderValue,
        avgMarginPercent: Math.round(c.avgMargin * 100) / 100,
      })),
    [companyList]
  );

  useEffect(() => {
    registerExporter(() => ({ filename: `company_analytics_${rangeKey}`, rows: exportRows }));
  }, [rangeKey, exportRows, registerExporter]);

  const totals = useMemo(() => {
    return companyList.reduce(
      (acc, c) => {
        acc.revenue += c.revenue;
        acc.outstanding += c.outstanding;
        acc.received += c.received;
        acc.orders += c.orders;
        return acc;
      },
      { revenue: 0, outstanding: 0, received: 0, orders: 0 }
    );
  }, [companyList]);

  // "Fastest paying" = lowest outstanding-to-revenue ratio among companies with revenue
  const fastestPaying = useMemo(() => {
    return [...companyList]
      .filter((c) => c.revenue > 0)
      .sort((a, b) => (a.outstanding / a.revenue) - (b.outstanding / b.revenue))
      .slice(0, 5);
  }, [companyList]);

  const revenueData = useMemo(
    () => companyList.filter((c) => c.revenue > 0).sort((a, b) => b.revenue - a.revenue).slice(0, 8).map((c) => ({ name: c.name, revenue: c.revenue })),
    [companyList]
  );
  const outstandingData = useMemo(
    () => companyList.filter((c) => c.outstanding > 0).sort((a, b) => b.outstanding - a.outstanding).slice(0, 8).map((c) => ({ name: c.name, outstanding: c.outstanding })),
    [companyList]
  );

  // Monthly business trend (filtered period's companies breakdown across months)
  const monthlyTrend = useMemo(() => {
    const months = {};
    filteredTrips.forEach((t) => {
      if (!t.pickupDate) return;
      const d = new Date(t.pickupDate);
      const key = `${d.toLocaleString('default', { month: 'short' })} ${String(d.getFullYear()).slice(-2)}`;
      if (!months[key]) months[key] = { name: key, trips: 0, revenue: 0 };
      months[key].trips += 1;
    });
    const finByTrip = new Map(filteredFinances.map((f) => [f.tripId, f]));
    filteredTrips.forEach((t) => {
      const f = finByTrip.get(t.id);
      if (!f) return;
      const d = new Date(t.pickupDate);
      const key = `${d.toLocaleString('default', { month: 'short' })} ${String(d.getFullYear()).slice(-2)}`;
      if (months[key]) months[key].revenue += f.tripAmount || 0;
    });
    return Object.values(months).slice(-8);
  }, [filteredTrips, filteredFinances]);

  const highestRevenue = topList(companyList, 'revenue', 5);
  const mostOrders = topList(companyList, 'orders', 5);
  const highestOutstanding = topList(companyList, 'outstanding', 5);

  if (isLoading) return <ReportLoading />;

  return (
    <div className="space-y-8">
      {/* KPI row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        <ReportKpiCard title="Corporate Clients" value={formatNumber(companyList.length)} subtitle="Active accounts analyzed" icon={Building2} color="indigo" />
        <ReportKpiCard title="Total Orders" value={formatNumber(totals.orders)} subtitle="In selected period" icon={FileText} color="sky" />
        <ReportKpiCard title="Client Revenue" value={formatCurrency(totals.revenue)} subtitle="Billed to customers" icon={Wallet} color="emerald" />
        <ReportKpiCard title="Outstanding Receivables" value={formatCurrency(totals.outstanding)} subtitle="Awaiting settlement" icon={AlertTriangle} color="amber" />
      </div>

      {/* Revenue + outstanding charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartCard title="Company-wise Revenue" subtitle="Top clients by billing" icon={TrendingUp}>
          {(fullscreen) => (
            <div className={`w-full ${fullscreen ? 'h-[60vh]' : 'h-[280px]'}`}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={revenueData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }} layout="vertical">
                  <CartesianGrid {...gridProps} />
                  <XAxis type="number" {...axisProps} tickFormatter={moneyTick} />
                  <YAxis type="category" dataKey="name" {...axisProps} width={120} tick={{ fill: '#94a3b8', fontSize: 10 }} />
                  <Tooltip contentStyle={tooltipStyle} formatter={(v) => formatCurrency(v)} />
                  <Bar dataKey="revenue" name="Revenue" fill="#10b981" radius={[0, 4, 4, 0]} maxBarSize={20} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </ChartCard>

        <ChartCard title="Outstanding Receivables by Company" subtitle="Unsettled balances" icon={Wallet}>
          {(fullscreen) => (
            <div className={`w-full ${fullscreen ? 'h-[60vh]' : 'h-[280px]'}`}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={outstandingData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }} layout="vertical">
                  <CartesianGrid {...gridProps} />
                  <XAxis type="number" {...axisProps} tickFormatter={moneyTick} />
                  <YAxis type="category" dataKey="name" {...axisProps} width={120} tick={{ fill: '#94a3b8', fontSize: 10 }} />
                  <Tooltip contentStyle={tooltipStyle} formatter={(v) => formatCurrency(v)} />
                  <Bar dataKey="outstanding" name="Outstanding" fill="#f59e0b" radius={[0, 4, 4, 0]} maxBarSize={20} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </ChartCard>
      </div>

      {/* Monthly business trend */}
      <ChartCard title="Monthly Business Trend" subtitle="Trips & revenue across months" icon={ChartColumn}>
        {(fullscreen) => (
          <div className={`w-full ${fullscreen ? 'h-[60vh]' : 'h-[280px]'}`}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={monthlyTrend} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid {...gridProps} />
                <XAxis dataKey="name" {...axisProps} />
                <YAxis yAxisId="left" {...axisProps} allowDecimals={false} />
                <YAxis yAxisId="right" orientation="right" {...axisProps} tickFormatter={moneyTick} />
                <Tooltip contentStyle={tooltipStyle} formatter={(v, n) => (n === 'Revenue' ? formatCurrency(v) : v)} />
                <Legend wrapperStyle={{ fontSize: '11px' }} />
                <Area yAxisId="left" type="monotone" dataKey="trips" name="Trips" stroke="#6366f1" strokeWidth={2} fill="#6366f1" fillOpacity={0.12} />
                <Area yAxisId="right" type="monotone" dataKey="revenue" name="Revenue" stroke="#10b981" strokeWidth={2} fill="#10b981" fillOpacity={0.12} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}
      </ChartCard>

      {/* Rankings */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <RankingList title="Highest Revenue" icon={Award} items={highestRevenue.map((c) => ({ id: c.id, name: c.name, subtitle: `${c.completedTrips} trips`, value: c.revenue }))} renderValue={(i) => <span className="text-xs font-bold text-emerald-400 font-mono">{formatCurrency(i.value, true)}</span>} />
        <RankingList title="Most Orders" icon={FileText} items={mostOrders.map((c) => ({ id: c.id, name: c.name, subtitle: formatCurrency(c.revenue, true), value: c.orders }))} renderValue={(i) => <span className="text-xs font-bold text-sky-400 font-mono">{i.value}</span>} />
        <RankingList title="Fastest Paying" icon={Zap} items={fastestPaying.map((c) => ({ id: c.id, name: c.name, subtitle: `${formatPercent((c.avgMargin))} margin`, value: c.outstanding }))} renderValue={(i) => <span className="text-xs font-bold text-emerald-400 font-mono">{formatCurrency(i.value, true)}</span>} />
        <RankingList title="Highest Outstanding" icon={AlertTriangle} items={highestOutstanding.map((c) => ({ id: c.id, name: c.name, subtitle: c.paymentTerms, value: c.outstanding }))} renderValue={(i) => <span className="text-xs font-bold text-amber-400 font-mono">{formatCurrency(i.value, true)}</span>} />
      </div>

      {/* Company table */}
      <div className="glass-panel rounded-xl p-5 border border-slate-800 space-y-4">
        <h3 className="text-sm font-bold text-slate-100 font-display flex items-center gap-2 border-b border-slate-800 pb-3">
          <Building2 size={16} className="text-accent-indigo" />
          Client Portfolio Register
        </h3>
        <Table
          columns={[
            { header: 'Company', accessor: 'name', render: (r) => <span className="font-bold text-slate-200">{r.name}</span> },
            { header: 'Status', accessor: 'status', render: (r) => <StatusPill status={r.status} /> },
            { header: 'Orders', accessor: 'orders', render: (r) => <span className="font-mono">{r.orders}</span> },
            { header: 'Trips', accessor: 'completedTrips', render: (r) => <span className="font-mono">{r.completedTrips}</span> },
            { header: 'Revenue', accessor: 'revenue', render: (r) => <span className="font-mono text-emerald-400 font-semibold">{formatCurrency(r.revenue)}</span> },
            { header: 'Profit', accessor: 'profit', render: (r) => <span className="font-mono font-bold">{formatCurrency(r.profit)}</span> },
            { header: 'Outstanding', accessor: 'outstanding', render: (r) => <span className={`font-mono font-semibold ${r.outstanding > 0 ? 'text-amber-400' : 'text-slate-500'}`}>{formatCurrency(r.outstanding)}</span> },
            { header: 'Avg Order Value', accessor: 'avgOrderValue', render: (r) => <span className="font-mono">{formatCurrency(r.avgOrderValue)}</span> },
            { header: 'Margin', accessor: 'avgMargin', render: (r) => <span className="font-mono text-emerald-400">{formatPercent(r.avgMargin)}</span> },
          ]}
          data={companyList}
          searchFields={['name', 'gst', 'paymentTerms']}
        />
      </div>
    </div>
  );
};

export default CompanyAnalytics;
