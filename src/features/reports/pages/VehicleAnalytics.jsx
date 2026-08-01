import React, { useEffect, useMemo } from 'react';
import { useReportContext } from '../ReportContext';
import ReportKpiCard from '../components/ReportKpiCard';
import ChartCard from '../components/ChartCard';
import RankingList from '../components/RankingList';
import Table from '../../../components/common/Table';
import { ReportLoading, StatusPill } from '../components/ReportStates';
import { tooltipStyle, axisProps, gridProps, moneyTick } from '../lib/chartTheme';
import { formatCurrency, formatNumber, formatDistance, formatHours, formatPercent } from '../lib/format';
import { topList } from '../lib/analytics';
import {
  Truck,
  Fuel,
  Wallet,
  PiggyBank,
  Gauge,
  Award,
  Star,
  TrendingDown,
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
} from 'recharts';

export const VehicleAnalytics = () => {
  const { rangeKey, registerExporter, isLoading, vehicleList, fleetUtilization } = useReportContext();

  const exportRows = useMemo(
    () =>
      vehicleList.map((v) => ({
        vehicle: v.number,
        type: v.type,
        status: v.status,
        trips: v.completedTrips,
        distanceKm: v.distance,
        runningHours: v.runningHours,
        revenue: v.revenue,
        fuelExpense: v.fuelExpense,
        tollExpense: v.tollExpense,
        allowanceExpense: v.allowanceExpense,
        totalExpenses: v.totalExpenses,
        profit: v.profit,
        utilizationPercent: v.utilization,
      })),
    [vehicleList]
  );

  useEffect(() => {
    registerExporter(() => ({ filename: `vehicle_analytics_${rangeKey}`, rows: exportRows }));
  }, [rangeKey, exportRows, registerExporter]);

  const totals = useMemo(() => {
    return vehicleList.reduce(
      (acc, v) => {
        acc.distance += v.distance;
        acc.revenue += v.revenue;
        acc.expenses += v.totalExpenses;
        acc.profit += v.profit;
        return acc;
      },
      { distance: 0, revenue: 0, expenses: 0, profit: 0 }
    );
  }, [vehicleList]);

  const utilizationData = useMemo(() => vehicleList.map((v) => ({ name: v.number, utilization: v.utilization })), [vehicleList]);
  const revenueProfitData = useMemo(
    () =>
      vehicleList
        .filter((v) => v.revenue > 0 || v.profit !== 0)
        .map((v) => ({ name: v.number, revenue: v.revenue, profit: v.profit }))
        .slice(0, 8),
    [vehicleList]
  );

  const mostRevenue = topList(vehicleList, 'revenue', 5);
  const mostUtilized = topList(vehicleList, 'utilization', 5);
  const leastUtilized = topList(vehicleList, 'utilization', 5, 'asc');
  const mostExpense = topList(vehicleList, 'totalExpenses', 5);
  const mostProfitable = topList(vehicleList, 'profit', 5);

  if (isLoading) return <ReportLoading />;

  const runningCount = fleetUtilization.running;

  return (
    <div className="space-y-8">
      {/* KPI row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        <ReportKpiCard title="Vehicles Analyzed" value={formatNumber(vehicleList.length)} subtitle={`${runningCount} running now`} icon={Truck} color="indigo" />
        <ReportKpiCard title="Total Distance" value={formatDistance(totals.distance)} subtitle="Across completed trips" icon={Gauge} color="sky" />
        <ReportKpiCard title="Revenue Generated" value={formatCurrency(totals.revenue)} subtitle="In selected period" icon={Wallet} color="emerald" />
        <ReportKpiCard title="Net Profit" value={formatCurrency(totals.profit)} subtitle="After operating costs" icon={PiggyBank} color="amber" />
      </div>

      {/* Utilization + revenue/profit charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartCard title="Vehicle Utilization" subtitle="Percentage of fleet actively deployed" icon={Gauge}>
          {(fullscreen) => (
            <div className={`w-full ${fullscreen ? 'h-[60vh]' : 'h-[280px]'}`}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={utilizationData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid {...gridProps} />
                  <XAxis dataKey="name" {...axisProps} tick={{ fill: '#94a3b8', fontSize: 9 }} />
                  <YAxis {...axisProps} domain={[0, 100]} tickFormatter={(v) => `${v}%`} />
                  <Tooltip contentStyle={tooltipStyle} formatter={(v) => `${v}%`} />
                  <Bar dataKey="utilization" name="Utilization %" fill="#6366f1" radius={[4, 4, 0, 0]} maxBarSize={34} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </ChartCard>

        <ChartCard title="Revenue vs Profit by Vehicle" subtitle="Top performers in period" icon={ChartColumn}>
          {(fullscreen) => (
            <div className={`w-full ${fullscreen ? 'h-[60vh]' : 'h-[280px]'}`}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={revenueProfitData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                  <CartesianGrid {...gridProps} />
                  <XAxis dataKey="name" {...axisProps} tick={{ fill: '#94a3b8', fontSize: 9 }} />
                  <YAxis {...axisProps} tickFormatter={moneyTick} />
                  <Tooltip contentStyle={tooltipStyle} formatter={(v, n) => [formatCurrency(v), n]} />
                  <Legend wrapperStyle={{ fontSize: '11px' }} />
                  <Bar dataKey="revenue" name="Revenue" fill="#10b981" radius={[4, 4, 0, 0]} maxBarSize={20} />
                  <Bar dataKey="profit" name="Profit" fill="#6366f1" radius={[4, 4, 0, 0]} maxBarSize={20} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </ChartCard>
      </div>

      {/* Rankings */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <RankingList title="Highest Revenue" icon={Award} items={mostRevenue.map((v) => ({ id: v.id, name: v.number, subtitle: v.type, value: v.revenue }))} renderValue={(i) => <span className="text-xs font-bold text-emerald-400 font-mono">{formatCurrency(i.value, true)}</span>} />
        <RankingList title="Most Utilized" icon={Gauge} items={mostUtilized.map((v) => ({ id: v.id, name: v.number, subtitle: v.type, value: v.utilization }))} renderValue={(i) => <span className="text-xs font-bold text-indigo-400 font-mono">{i.value}%</span>} />
        <RankingList title="Most Profitable" icon={PiggyBank} items={mostProfitable.map((v) => ({ id: v.id, name: v.number, subtitle: `${v.completedTrips} trips`, value: v.profit }))} renderValue={(i) => <span className="text-xs font-bold text-emerald-400 font-mono">{formatCurrency(i.value, true)}</span>} />
        <RankingList title="Highest Expense" icon={Wallet} items={mostExpense.map((v) => ({ id: v.id, name: v.number, subtitle: `Fuel: ${formatCurrency(v.fuelExpense, true)}`, value: v.totalExpenses }))} renderValue={(i) => <span className="text-xs font-bold text-rose-400 font-mono">{formatCurrency(i.value, true)}</span>} />
        <RankingList title="Lowest Utilization" icon={TrendingDown} items={leastUtilized.map((v) => ({ id: v.id, name: v.number, subtitle: v.status, value: v.utilization }))} renderValue={(i) => <span className="text-xs font-bold text-amber-400 font-mono">{i.value}%</span>} />
        <RankingList title="Top by Trips Completed" icon={Star} items={topList(vehicleList, 'completedTrips', 5).map((v) => ({ id: v.id, name: v.number, subtitle: `${formatDistance(v.distance)} covered`, value: v.completedTrips }))} renderValue={(i) => <span className="text-xs font-bold text-sky-400 font-mono">{i.value}</span>} />
      </div>

      {/* Vehicle detail table */}
      <div className="glass-panel rounded-xl p-5 border border-slate-800 space-y-4">
        <h3 className="text-sm font-bold text-slate-100 font-display flex items-center gap-2 border-b border-slate-800 pb-3">
          <Fuel size={16} className="text-accent-amber" />
          Fleet Performance Register
        </h3>
        <Table
          columns={[
            { header: 'Vehicle', accessor: 'number', render: (r) => <span className="font-bold text-slate-200">{r.number}</span> },
            { header: 'Type', accessor: 'type' },
            { header: 'Status', accessor: 'status', render: (r) => <StatusPill status={r.status} /> },
            { header: 'Trips', accessor: 'completedTrips', render: (r) => <span className="font-mono">{r.completedTrips}</span> },
            { header: 'Distance', accessor: 'distance', render: (r) => <span className="font-mono">{formatDistance(r.distance)}</span> },
            { header: 'Run Hours', accessor: 'runningHours', render: (r) => <span className="font-mono">{formatHours(r.runningHours)}</span> },
            { header: 'Revenue', accessor: 'revenue', render: (r) => <span className="font-mono text-emerald-400 font-semibold">{formatCurrency(r.revenue)}</span> },
            { header: 'Expenses', accessor: 'totalExpenses', render: (r) => <span className="font-mono text-rose-400">{formatCurrency(r.totalExpenses)}</span> },
            { header: 'Profit', accessor: 'profit', render: (r) => <span className="font-mono font-bold text-slate-200">{formatCurrency(r.profit)}</span> },
            { header: 'Utilization', accessor: 'utilization', render: (r) => <span className="font-mono text-indigo-400">{formatPercent(r.utilization)}</span> },
          ]}
          data={vehicleList}
          searchFields={['number', 'type', 'status']}
        />
      </div>
    </div>
  );
};

export default VehicleAnalytics;
