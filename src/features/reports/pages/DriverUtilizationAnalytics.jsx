import React, { useEffect, useMemo } from 'react';
import { useReportContext } from '../ReportContext';
import ReportKpiCard from '../components/ReportKpiCard';
import ChartCard from '../components/ChartCard';
import { RankingList } from '../components/RankingList';
import Table from '../../../components/common/Table';
import { ReportLoading } from '../components/ReportStates';
import { CHART_COLORS, tooltipStyle, axisProps, gridProps } from '../lib/chartTheme';
import { formatCurrency, formatDistance } from '../lib/format';
import {
  Users,
  UserCheck,
  CalendarOff,
  Clock,
  Gauge,
  Award,
  TrendingUp,
  TrendingDown,
  Route as RouteIcon,
  ChartPie,
  ChartLine,
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

export const DriverUtilizationAnalytics = () => {
  const { rangeKey, registerExporter, isLoading, driverList, driverUtilization } = useReportContext();

  const statusData = useMemo(
    () => [
      { name: 'On Trip', value: driverUtilization.onTrip },
      { name: 'Available', value: driverUtilization.available },
      { name: 'Leave', value: driverUtilization.leave },
      { name: 'Offline', value: driverUtilization.offline },
    ],
    [driverUtilization]
  );

  const onTimeData = useMemo(
    () => driverList.map((d) => ({ name: d.name, onTime: d.onTimeRate })).sort((a, b) => b.onTime - a.onTime),
    [driverList]
  );

  const workloadData = useMemo(
    () => driverList.map((d) => ({ name: d.name, trips: d.completedTrips })).sort((a, b) => b.trips - a.trips),
    [driverList]
  );

  const exportRows = useMemo(
    () =>
      driverList.map((d) => ({
        driver: d.name,
        mobile: d.mobile,
        status: d.status,
        trips: d.completedTrips,
        onTimeRate: d.onTimeRate,
        distance: d.distance,
        drivingHours: d.drivingHours,
        revenue: d.revenue,
        allowance: d.allowance,
      })),
    [driverList]
  );

  useEffect(() => {
    registerExporter(() => ({ filename: `driver_utilization_${rangeKey}`, rows: exportRows }));
  }, [rangeKey, exportRows, registerExporter]);

  if (isLoading) return <ReportLoading />;

  const totalDrivers = Math.max(driverList.length, 1);
  const totalTrips = driverList.reduce((s, d) => s + (d.completedTrips || 0), 0);
  const avgOnTime = driverList.reduce((s, d) => s + (d.onTimeRate || 0), 0) / totalDrivers;

  const bestOnTime = [...driverList].sort((a, b) => b.onTimeRate - a.onTimeRate).slice(0, 5);
  const mostTrips = [...driverList].sort((a, b) => b.completedTrips - a.completedTrips).slice(0, 5);
  const mostDistance = [...driverList].sort((a, b) => b.distance - a.distance).slice(0, 5);
  const mostDelayed = [...driverList].sort((a, b) => b.delayed - a.delayed).slice(0, 5);

  return (
    <div className="space-y-8">
      {/* KPI row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        <ReportKpiCard title="Driver Pool" value={totalDrivers} subtitle={`${driverUtilization.onTrip} on trip now`} icon={Users} color="indigo" />
        <ReportKpiCard title="Driver Utilization" value={`${driverUtilization.rate}%`} subtitle="On-trip vs total pool" icon={Gauge} color="emerald" />
        <ReportKpiCard title="Avg On-Time Rate" value={`${Math.round(avgOnTime)}%`} subtitle="Deliveries before deadline" icon={UserCheck} color="sky" />
        <ReportKpiCard title="Trips Completed" value={totalTrips} subtitle="In selected period" icon={Award} color="violet" />
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <ReportKpiCard title="On Trip" value={driverUtilization.onTrip} icon={RouteIcon} color="emerald" className="!p-4" />
        <ReportKpiCard title="Available" value={driverUtilization.available} icon={UserCheck} color="sky" className="!p-4" />
        <ReportKpiCard title="On Leave" value={driverUtilization.leave} icon={CalendarOff} color="amber" className="!p-4" />
        <ReportKpiCard title="Offline" value={driverUtilization.offline} icon={Clock} color="rose" className="!p-4" />
      </div>

      {/* Status donut + on-time bars */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <ChartCard title="Driver Availability" subtitle="Current working state" icon={ChartPie}>
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
          <ChartCard title="On-Time Delivery Rate by Driver" subtitle="Percentage of completed trips delivered on schedule" icon={ChartLine}>
            {(fullscreen) => (
              <div className={`w-full ${fullscreen ? 'h-[60vh]' : 'h-[280px]'}`}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={onTimeData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                    <CartesianGrid {...gridProps} />
                    <XAxis dataKey="name" {...axisProps} tick={{ fill: '#94a3b8', fontSize: 9 }} />
                    <YAxis {...axisProps} tickFormatter={(v) => `${v}%`} domain={[0, 100]} />
                    <Tooltip contentStyle={tooltipStyle} formatter={(v) => `${v}%`} />
                    <Bar dataKey="onTime" name="On-Time Rate" fill="#10b981" radius={[4, 4, 0, 0]} maxBarSize={28} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </ChartCard>
        </div>
      </div>

      {/* Workload */}
      <ChartCard title="Trips Completed by Driver" subtitle="Dispatch workload in selected period" icon={TrendingUp}>
        {(fullscreen) => (
          <div className={`w-full ${fullscreen ? 'h-[60vh]' : 'h-[280px]'}`}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={workloadData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid {...gridProps} />
                <XAxis dataKey="name" {...axisProps} tick={{ fill: '#94a3b8', fontSize: 9 }} />
                <YAxis {...axisProps} allowDecimals={false} />
                <Tooltip contentStyle={tooltipStyle} />
                <Bar dataKey="trips" name="Trips" fill="#6366f1" radius={[4, 4, 0, 0]} maxBarSize={28} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </ChartCard>

      {/* Leaderboards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <RankingList
          title="Highest On-Time Rate"
          icon={UserCheck}
          items={bestOnTime.map((d) => ({ id: d.id, name: d.name, subtitle: `${d.completedTrips} trips`, value: d.onTimeRate }))}
          renderValue={(i) => <span className="text-xs font-bold text-emerald-400 font-mono">{i.value}%</span>}
        />
        <RankingList
          title="Most Trips Completed"
          icon={Award}
          items={mostTrips.map((d) => ({ id: d.id, name: d.name, subtitle: `${formatDistance(d.distance)} covered`, value: d.completedTrips }))}
          renderValue={(i) => <span className="text-xs font-bold text-sky-400 font-mono">{i.value}</span>}
        />
        <RankingList
          title="Most Distance Covered"
          icon={RouteIcon}
          items={mostDistance.map((d) => ({ id: d.id, name: d.name, subtitle: `${d.completedTrips} trips`, value: d.distance }))}
          renderValue={(i) => <span className="text-xs font-bold text-indigo-400 font-mono">{formatDistance(i.value)}</span>}
        />
        <RankingList
          title="Most Delayed Deliveries"
          icon={TrendingDown}
          items={mostDelayed.map((d) => ({ id: d.id, name: d.name, subtitle: `${d.onTimeRate}% on-time`, value: d.delayed }))}
          renderValue={(i) => <span className="text-xs font-bold text-amber-400 font-mono">{i.value}</span>}
        />
      </div>

      {/* Driver register */}
      <div className="glass-panel rounded-xl p-5 border border-slate-800 space-y-4">
        <h3 className="text-sm font-bold text-slate-100 font-display flex items-center gap-2 border-b border-slate-800 pb-3">
          <Users size={16} className="text-accent-indigo" />
          Driver Performance Register
        </h3>
        <Table
          columns={[
            { header: 'Driver', accessor: 'name', render: (d) => <span className="font-bold text-indigo-400">{d.name}</span> },
            { header: 'Status', accessor: 'status', render: (d) => <span className="text-slate-400">{d.status}</span> },
            { header: 'Trips', accessor: 'completedTrips', render: (d) => <span className="font-mono">{d.completedTrips}</span> },
            { header: 'On-Time', accessor: 'onTimeRate', render: (d) => <span className={`font-mono ${d.onTimeRate >= 90 ? 'text-emerald-400' : d.onTimeRate >= 70 ? 'text-amber-400' : 'text-rose-400'}`}>{d.onTimeRate}%</span> },
            { header: 'Distance', accessor: 'distance', render: (d) => <span className="font-mono">{formatDistance(d.distance)}</span> },
            { header: 'Hours', accessor: 'drivingHours', render: (d) => <span className="font-mono">{d.drivingHours} hrs</span> },
            { header: 'Revenue', accessor: 'revenue', render: (d) => <span className="font-mono text-emerald-400">{formatCurrency(d.revenue)}</span> },
            { header: 'Allowance', accessor: 'allowance', render: (d) => <span className="font-mono text-amber-400">{formatCurrency(d.allowance)}</span> },
          ]}
          data={driverList}
          searchFields={['name']}
        />
      </div>
    </div>
  );
};

export default DriverUtilizationAnalytics;
