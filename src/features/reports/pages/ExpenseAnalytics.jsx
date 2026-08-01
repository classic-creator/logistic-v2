import React, { useEffect, useMemo } from 'react';
import { useReportContext } from '../ReportContext';
import ReportKpiCard from '../components/ReportKpiCard';
import ChartCard from '../components/ChartCard';
import Table from '../../../components/common/Table';
import { ReportLoading } from '../components/ReportStates';
import { CHART_COLORS, tooltipStyle, axisProps, gridProps, moneyTick } from '../lib/chartTheme';
import { formatCurrency, formatPercent } from '../lib/format';
import {
  Wallet,
  Fuel,
  BadgePercent,
  Users,
  Package,
  PackageOpen,
  Receipt,
  ChartPie,
  ChartArea,
  ChartColumn,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
  XAxis,
  YAxis,
  CartesianGrid,
  Area,
  AreaChart,
} from 'recharts';

export const ExpenseAnalytics = () => {
  const { rangeKey, registerExporter, isLoading, filteredFinances, finance, expenseCategories, vehicleList, driverList } = useReportContext();

  const monthlyExpenses = useMemo(() => {
    const groups = {};
    filteredFinances.forEach((f) => {
      if (!f.recordedAt) return;
      const d = new Date(f.recordedAt);
      const key = `${d.toLocaleString('default', { month: 'short' })} ${String(d.getFullYear()).slice(-2)}`;
      if (!groups[key]) groups[key] = { name: key, expenses: 0 };
      groups[key].expenses += f.totalExpenses || 0;
    });
    return Object.entries(groups).map(([name, g]) => ({ name, expenses: g.expenses }));
  }, [filteredFinances]);

  const vehicleExpenseData = useMemo(
    () =>
      vehicleList
        .filter((v) => v.totalExpenses > 0)
        .sort((a, b) => b.totalExpenses - a.totalExpenses)
        .slice(0, 8)
        .map((v) => ({ name: v.number, fuel: v.fuelExpense, tolls: v.tollExpense, allowance: v.allowanceExpense })),
    [vehicleList]
  );

  const driverExpenseData = useMemo(
    () => driverList.filter((d) => d.allowance > 0).sort((a, b) => b.allowance - a.allowance).slice(0, 8).map((d) => ({ name: d.name, allowance: d.allowance })),
    [driverList]
  );

  const exportRows = useMemo(
    () =>
      expenseCategories.map((c) => ({
        category: c.name,
        amount: c.value,
        sharePercent: finance.totalExpenses ? Math.round((c.value / finance.totalExpenses) * 100) : 0,
      })),
    [expenseCategories, finance.totalExpenses]
  );

  useEffect(() => {
    registerExporter(() => ({ filename: `expense_analytics_${rangeKey}`, rows: exportRows }));
  }, [rangeKey, exportRows, registerExporter]);

  if (isLoading) return <ReportLoading />;

  const fuelShare = finance.totalExpenses ? (finance.dieselExpense / finance.totalExpenses) * 100 : 0;
  const tollShare = finance.totalExpenses ? (finance.tollExpense / finance.totalExpenses) * 100 : 0;

  return (
    <div className="space-y-8">
      {/* KPI row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        <ReportKpiCard title="Total Expenses" value={formatCurrency(finance.totalExpenses)} subtitle="All operating categories" icon={Wallet} color="rose" />
        <ReportKpiCard title="Diesel Cost" value={formatCurrency(finance.dieselExpense)} subtitle={`${formatPercent(fuelShare)} of total`} icon={Fuel} color="amber" />
        <ReportKpiCard title="Toll Charges" value={formatCurrency(finance.tollExpense)} subtitle={`${formatPercent(tollShare)} of total`} icon={BadgePercent} color="sky" />
        <ReportKpiCard title="Driver Allowances" value={formatCurrency(finance.driverAllowance)} subtitle="Crew compensation" icon={Users} color="indigo" />
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <ReportKpiCard title="Loading Charges" value={formatCurrency(finance.loadingCharge)} icon={Package} color="violet" className="!p-4" />
        <ReportKpiCard title="Unloading Charges" value={formatCurrency(finance.unloadingCharge)} icon={PackageOpen} color="amber" className="!p-4" />
        <ReportKpiCard title="Other Expenses" value={formatCurrency(finance.otherExpenses)} icon={Receipt} color="sky" className="!p-4" />
        <ReportKpiCard title="Expense Ratio" value={formatPercent(finance.tripAmount ? (finance.totalExpenses / finance.tripAmount) * 100 : 0)} subtitle="Of gross revenue" icon={ChartPie} color="rose" className="!p-4" />
      </div>

      {/* Breakdown donut + monthly trend */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <ChartCard title="Expense Breakdown" subtitle="Share by category" icon={ChartPie}>
          {(fullscreen) => (
            <div className={`w-full ${fullscreen ? 'h-[60vh]' : 'h-[280px]'} flex items-center justify-center`}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={expenseCategories} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={55} outerRadius={82} paddingAngle={3}>
                    {expenseCategories.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                  </Pie>
                  <Tooltip contentStyle={tooltipStyle} formatter={(v) => formatCurrency(v)} />
                  <Legend wrapperStyle={{ fontSize: '10px' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
        </ChartCard>

        <div className="lg:col-span-2">
          <ChartCard title="Monthly Expense Trend" subtitle="Operating cost accumulation" icon={ChartArea}>
            {(fullscreen) => (
              <div className={`w-full ${fullscreen ? 'h-[60vh]' : 'h-[280px]'}`}>
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={monthlyExpenses} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                    <defs>
                      <linearGradient id="expTrend" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.25} />
                        <stop offset="95%" stopColor="#f43f5e" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid {...gridProps} />
                    <XAxis dataKey="name" {...axisProps} />
                    <YAxis {...axisProps} tickFormatter={moneyTick} />
                    <Tooltip contentStyle={tooltipStyle} formatter={(v) => formatCurrency(v)} />
                    <Area type="monotone" dataKey="expenses" name="Expenses" stroke="#f43f5e" strokeWidth={2.5} fill="url(#expTrend)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            )}
          </ChartCard>
        </div>
      </div>

      {/* Vehicle & driver expense views */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartCard title="Vehicle-wise Expenses" subtitle="Fuel, tolls & allowance by vehicle" icon={ChartColumn}>
          {(fullscreen) => (
            <div className={`w-full ${fullscreen ? 'h-[60vh]' : 'h-[280px]'}`}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={vehicleExpenseData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                  <CartesianGrid {...gridProps} />
                  <XAxis dataKey="name" {...axisProps} tick={{ fill: '#94a3b8', fontSize: 9 }} />
                  <YAxis {...axisProps} tickFormatter={moneyTick} />
                  <Tooltip contentStyle={tooltipStyle} formatter={(v, n) => [formatCurrency(v), n]} />
                  <Legend wrapperStyle={{ fontSize: '10px' }} />
                  <Bar dataKey="fuel" name="Fuel" stackId="a" fill="#f59e0b" maxBarSize={24} />
                  <Bar dataKey="tolls" name="Tolls" stackId="a" fill="#0ea5e9" maxBarSize={24} />
                  <Bar dataKey="allowance" name="Allowance" stackId="a" fill="#8b5cf6" maxBarSize={24} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </ChartCard>

        <ChartCard title="Driver-wise Allowances" subtitle="Crew compensation by driver" icon={Users}>
          {(fullscreen) => (
            <div className={`w-full ${fullscreen ? 'h-[60vh]' : 'h-[280px]'}`}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={driverExpenseData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }} layout="vertical">
                  <CartesianGrid {...gridProps} />
                  <XAxis type="number" {...axisProps} tickFormatter={moneyTick} />
                  <YAxis type="category" dataKey="name" {...axisProps} width={110} tick={{ fill: '#94a3b8', fontSize: 9 }} />
                  <Tooltip contentStyle={tooltipStyle} formatter={(v) => formatCurrency(v)} />
                  <Bar dataKey="allowance" name="Allowance" fill="#6366f1" radius={[0, 4, 4, 0]} maxBarSize={16} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </ChartCard>
      </div>

      {/* Category table */}
      <div className="glass-panel rounded-xl p-5 border border-slate-800 space-y-4">
        <h3 className="text-sm font-bold text-slate-100 font-display flex items-center gap-2 border-b border-slate-800 pb-3">
          <Receipt size={16} className="text-accent-rose" />
          Expense Category Summary
        </h3>
        <Table
          columns={[
            { header: 'Category', accessor: 'name', render: (r) => <span className="font-bold text-slate-200">{r.name}</span> },
            { header: 'Amount', accessor: 'value', render: (r) => <span className="font-mono text-rose-400 font-semibold">{formatCurrency(r.value)}</span> },
            { header: 'Share', accessor: 'value', render: (r) => <span className="font-mono text-slate-400">{finance.totalExpenses ? formatPercent((r.value / finance.totalExpenses) * 100, 0) : '0%'}</span> },
          ]}
          data={expenseCategories}
          searchFields={['name']}
        />
      </div>
    </div>
  );
};

export default ExpenseAnalytics;
