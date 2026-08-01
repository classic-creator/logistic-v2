import React, { useEffect, useMemo } from 'react';
import { useReportContext } from '../ReportContext';
import ReportKpiCard from '../components/ReportKpiCard';
import ChartCard from '../components/ChartCard';
import Table from '../../../components/common/Table';
import { ReportLoading } from '../components/ReportStates';
import { CHART_COLORS, tooltipStyle, axisProps, gridProps, moneyTick } from '../lib/chartTheme';
import { formatCurrency, formatNumber, formatDistance } from '../lib/format';
import {
  Truck,
  Activity,
  Wrench,
  Power,
  Gauge,
  Route as RouteIcon,
  IndianRupee,
  ChartPie,
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
} from 'recharts';

export const FleetAnalytics = () => {
  const { rangeKey, registerExporter, isLoading, vehicleList, fleetUtilization } = useReportContext();

  const statusData = useMemo(
    () => [
      { name: 'Running', value: fleetUtilization.running },
      { name: 'Available', value: fleetUtilization.available },
      { name: 'Maintenance', value: fleetUtilization.maintenance },
      { name: 'Inactive', value: fleetUtilization.inactive },
    ],
    [fleetUtilization]
  );

  const utilizationData = useMemo(
    () =>
      vehicleList
        .map((v) => ({ name: v.number, utilization: v.utilization }))
        .sort((a, b) => b.utilization - a.utilization),
    [vehicleList]
  );

  const distanceData = useMemo(
    () => vehicleList.slice(0, 8).map((v) => ({ name: v.number, distance: v.distance, hours: v.runningHours })),
    [vehicleList]
  );

  const costData = useMemo(
    () => vehicleList.slice(0, 8).map((v) => ({ name: v.number, expenses: v.totalExpenses, revenue: v.revenue })),
    [vehicleList]
  );

  const exportRows = useMemo(
    () =>
      vehicleList.map((v) => ({
        vehicle: v.number,
        type: v.type,
        status: v.status,
        utilizationPercent: v.utilization,
        distance: v.distance,
        runningHours: v.runningHours,
        trips: v.completedTrips,
        revenue: v.revenue,
        expenses: v.totalExpenses,
        profit: v.profit,
      })),
    [vehicleList]
  );

  useEffect(() => {
    registerExporter(() => ({ filename: `fleet_analytics_${rangeKey}`, rows: exportRows }));
  }, [rangeKey, exportRows, registerExporter]);

  if (isLoading) return <ReportLoading />;

  const totalVehicles = Math.max(vehicleList.length, 1);
  const totalDistance = vehicleList.reduce((s, v) => s + (v.distance || 0), 0);
  const avgUtil = vehicleList.reduce((s, v) => s + (v.utilization || 0), 0) / totalVehicles;

  return (
    <div className="space-y-8">
      {/* KPI row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        <ReportKpiCard title="Fleet Size" value={formatNumber(totalVehicles)} subtitle={`${fleetUtilization.running} running now`} icon={Truck} color="indigo" />
        <ReportKpiCard title="Fleet Utilization" value={`${fleetUtilization.rate}%`} subtitle="Active vs total fleet" icon={Gauge} color="emerald" />
        <ReportKpiCard title="Avg Utilization" value={`${Math.round(avgUtil)}%`} subtitle="Across period" icon={Activity} color="sky" />
        <ReportKpiCard title="Total Distance" value={formatDistance(totalDistance)} subtitle={`Across ${vehicleList.filter((v) => v.distance > 0).length} active vehicles`} icon={RouteIcon} color="violet" />
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <ReportKpiCard title="Running" value={fleetUtilization.running} icon={Activity} color="emerald" className="!p-4" />
        <ReportKpiCard title="Available" value={fleetUtilization.available} icon={Truck} color="sky" className="!p-4" />
        <ReportKpiCard title="Maintenance" value={fleetUtilization.maintenance} icon={Wrench} color="amber" className="!p-4" />
        <ReportKpiCard title="Inactive" value={fleetUtilization.inactive} icon={Power} color="rose" className="!p-4" />
      </div>

      {/* Status donut + utilization bars */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <ChartCard title="Fleet Status Mix" subtitle="Current operating state" icon={ChartPie}>
          {(fullscreen) => (
            <div className={`w-full ${fullscreen ? 'h-[60vh]' : 'h-[280px]'} flex items-center justify-center`}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={statusData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={55} outerRadius={82} paddingAngle={3}>
                    {statusData.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                  </Pie>
                  <Tooltip contentStyle={tooltipStyle} />
                  <Legend wrapperStyle={{ fontSize: '10px' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
        </ChartCard>

        <div className="lg:col-span-2">
          <ChartCard title="Utilization by Vehicle" subtitle="Share of the period the vehicle was productive" icon={Gauge}>
            {(fullscreen) => (
              <div className={`w-full ${fullscreen ? 'h-[60vh]' : 'h-[280px]'}`}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={utilizationData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                    <CartesianGrid {...gridProps} />
                    <XAxis dataKey="name" {...axisProps} tick={{ fill: '#94a3b8', fontSize: 9 }} />
                    <YAxis {...axisProps} tickFormatter={(v) => `${v}%`} domain={[0, 100]} />
                    <Tooltip contentStyle={tooltipStyle} formatter={(v) => `${v}%`} />
                    <Bar dataKey="utilization" name="Utilization" fill="#6366f1" radius={[4, 4, 0, 0]} maxBarSize={28} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </ChartCard>
        </div>
      </div>

      {/* Distance & cost */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartCard title="Distance & Running Hours" subtitle="Top 8 vehicles by distance" icon={RouteIcon}>
          {(fullscreen) => (
            <div className={`w-full ${fullscreen ? 'h-[60vh]' : 'h-[280px]'}`}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={distanceData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                  <CartesianGrid {...gridProps} />
                  <XAxis dataKey="name" {...axisProps} tick={{ fill: '#94a3b8', fontSize: 9 }} />
                  <YAxis {...axisProps} tickFormatter={(v) => `${Math.round(v / 100) / 10}k km`} />
                  <Tooltip contentStyle={tooltipStyle} formatter={(v, n) => [n === 'Distance' ? formatDistance(v) : `${v} hrs`, n]} />
                  <Legend wrapperStyle={{ fontSize: '11px' }} />
                  <Bar dataKey="distance" name="Distance" fill="#0ea5e9" radius={[4, 4, 0, 0]} maxBarSize={24} />
                  <Bar dataKey="hours" name="Hours" fill="#f59e0b" radius={[4, 4, 0, 0]} maxBarSize={24} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </ChartCard>

        <ChartCard title="Revenue vs Expenses by Vehicle" subtitle="Top 8 vehicles by cost" icon={IndianRupee}>
          {(fullscreen) => (
            <div className={`w-full ${fullscreen ? 'h-[60vh]' : 'h-[280px]'}`}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={costData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                  <CartesianGrid {...gridProps} />
                  <XAxis dataKey="name" {...axisProps} tick={{ fill: '#94a3b8', fontSize: 9 }} />
                  <YAxis {...axisProps} tickFormatter={moneyTick} />
                  <Tooltip contentStyle={tooltipStyle} formatter={(v) => formatCurrency(v)} />
                  <Legend wrapperStyle={{ fontSize: '11px' }} />
                  <Bar dataKey="revenue" name="Revenue" fill="#10b981" radius={[4, 4, 0, 0]} maxBarSize={24} />
                  <Bar dataKey="expenses" name="Expenses" fill="#f43f5e" radius={[4, 4, 0, 0]} maxBarSize={24} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </ChartCard>
      </div>

      {/* Fleet register */}
      <div className="glass-panel rounded-xl p-5 border border-slate-800 space-y-4">
        <h3 className="text-sm font-bold text-slate-100 font-display flex items-center gap-2 border-b border-slate-800 pb-3">
          <Truck size={16} className="text-accent-indigo" />
          Fleet Performance Register
        </h3>
        <Table
          columns={[
            { header: 'Vehicle', accessor: 'number', render: (v) => <span className="font-bold text-indigo-400">{v.number}</span> },
            { header: 'Type', accessor: 'type', render: (v) => <span className="text-slate-300">{v.type}</span> },
            { header: 'Status', accessor: 'status', render: (v) => <span className="text-slate-400">{v.status}</span> },
            { header: 'Trips', accessor: 'completedTrips', render: (v) => <span className="font-mono">{v.completedTrips}</span> },
            { header: 'Distance', accessor: 'distance', render: (v) => <span className="font-mono">{formatDistance(v.distance)}</span> },
            { header: 'Utilization', accessor: 'utilization', render: (v) => <span className="font-mono text-indigo-400">{v.utilization}%</span> },
            { header: 'Revenue', accessor: 'revenue', render: (v) => <span className="font-mono text-emerald-400">{formatCurrency(v.revenue)}</span> },
            { header: 'Cost', accessor: 'totalExpenses', render: (v) => <span className="font-mono text-rose-400">{formatCurrency(v.totalExpenses)}</span> },
            { header: 'Profit', accessor: 'profit', render: (v) => <span className={`font-mono font-semibold ${v.profit >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>{formatCurrency(v.profit)}</span> },
          ]}
          data={vehicleList}
          searchFields={['number', 'type']}
        />
      </div>
    </div>
  );
};

export default FleetAnalytics;
