import React, { useEffect, useMemo } from 'react';
import { useReportContext } from '../ReportContext';
import ReportKpiCard from '../components/ReportKpiCard';
import ChartCard from '../components/ChartCard';
import RankingList from '../components/RankingList';
import Table from '../../../components/common/Table';
import { ReportLoading, StatusPill } from '../components/ReportStates';
import { tooltipStyle, axisProps, gridProps } from '../lib/chartTheme';
import { formatCurrency, formatNumber, formatDistance, formatHours, formatPercent } from '../lib/format';
import { topList } from '../lib/analytics';
import {
  Users,
  UserCheck,
  Compass,
  Star,
  Wallet,
  BadgeCheck,
  Clock,
  Award,
  CalendarClock,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  Tooltip,
  ResponsiveContainer,
  XAxis,
  YAxis,
  CartesianGrid,
} from 'recharts';

export const DriverAnalytics = () => {
  const { rangeKey, registerExporter, isLoading, driverList, driverUtilization, filteredTrips } = useReportContext();

  const exportRows = useMemo(
    () =>
      driverList.map((d) => ({
        driver: d.name,
        mobile: d.mobile,
        status: d.status,
        trips: d.completedTrips,
        distanceKm: d.distance,
        drivingHours: d.drivingHours,
        revenue: d.revenue,
        allowance: d.allowance,
        onTimeRatePercent: d.onTimeRate,
        delayedTrips: d.delayed,
        rating: d.rating,
      })),
    [driverList]
  );

  useEffect(() => {
    registerExporter(() => ({ filename: `driver_analytics_${rangeKey}`, rows: exportRows }));
  }, [rangeKey, exportRows, registerExporter]);

  const totals = useMemo(() => {
    return driverList.reduce(
      (acc, d) => {
        acc.distance += d.distance;
        acc.hours += d.drivingHours;
        acc.revenue += d.revenue;
        acc.allowance += d.allowance;
        return acc;
      },
      { distance: 0, hours: 0, revenue: 0, allowance: 0 }
    );
  }, [driverList]);

  const onTimeData = useMemo(
    () => driverList.map((d) => ({ name: d.name, onTimeRate: d.onTimeRate })).sort((a, b) => b.onTimeRate - a.onTimeRate),
    [driverList]
  );
  const distanceData = useMemo(
    () => driverList.map((d) => ({ name: d.name, distance: d.distance })).sort((a, b) => b.distance - a.distance).slice(0, 8),
    [driverList]
  );

  const bestOnTime = topList(driverList, 'onTimeRate', 5);
  const highestRevenue = topList(driverList, 'revenue', 5);
  const mostTrips = topList(driverList, 'completedTrips', 5);
  const longestDistance = topList(driverList, 'distance', 5);

  if (isLoading) return <ReportLoading />;

  const avgOnTime = driverList.length
    ? driverList.reduce((s, d) => s + d.onTimeRate, 0) / driverList.length
    : 100;

  return (
    <div className="space-y-8">
      {/* KPI row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        <ReportKpiCard title="Drivers Analyzed" value={formatNumber(driverList.length)} subtitle={`${driverUtilization.onTrip} on trip`} icon={Users} color="indigo" />
        <ReportKpiCard title="Total Distance" value={formatDistance(totals.distance)} subtitle="Across all drivers" icon={Compass} color="sky" />
        <ReportKpiCard title="Driving Hours" value={formatHours(totals.hours)} subtitle="Combined duty time" icon={CalendarClock} color="emerald" />
        <ReportKpiCard title="Avg On-Time Rate" value={formatPercent(Math.round(avgOnTime))} subtitle="Fleet-wide punctuality" icon={BadgeCheck} color="amber" />
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <ReportKpiCard title="Revenue Generated" value={formatCurrency(totals.revenue)} icon={Wallet} color="emerald" className="!p-4" />
        <ReportKpiCard title="Driver Allowances" value={formatCurrency(totals.allowance)} subtitle="Paid to drivers" icon={Wallet} color="rose" className="!p-4" />
        <ReportKpiCard title="Trips Completed" value={formatNumber(filteredTrips.filter((t) => t.status === 'Completed').length)} icon={Award} color="sky" className="!p-4" />
        <ReportKpiCard title="Delayed Trips" value={formatNumber(driverList.reduce((s, d) => s + d.delayed, 0))} icon={Clock} color="amber" className="!p-4" />
      </div>

      {/* On-time + distance charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartCard title="On-Time Delivery Rate by Driver" subtitle="Punctuality score (0-100%)" icon={BadgeCheck}>
          {(fullscreen) => (
            <div className={`w-full ${fullscreen ? 'h-[60vh]' : 'h-[280px]'}`}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={onTimeData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid {...gridProps} />
                  <XAxis dataKey="name" {...axisProps} tick={{ fill: '#94a3b8', fontSize: 10 }} />
                  <YAxis {...axisProps} domain={[0, 100]} tickFormatter={(v) => `${v}%`} />
                  <Tooltip contentStyle={tooltipStyle} formatter={(v) => `${v}%`} />
                  <Bar dataKey="onTimeRate" name="On-Time %" fill="#10b981" radius={[4, 4, 0, 0]} maxBarSize={34} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </ChartCard>

        <ChartCard title="Distance Covered by Driver" subtitle="Top 8 by mileage" icon={Compass}>
          {(fullscreen) => (
            <div className={`w-full ${fullscreen ? 'h-[60vh]' : 'h-[280px]'}`}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={distanceData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }} layout="vertical">
                  <CartesianGrid {...gridProps} />
                  <XAxis type="number" {...axisProps} tickFormatter={(v) => `${v}km`} />
                  <YAxis type="category" dataKey="name" {...axisProps} width={100} tick={{ fill: '#94a3b8', fontSize: 10 }} />
                  <Tooltip contentStyle={tooltipStyle} formatter={(v) => formatDistance(v)} />
                  <Bar dataKey="distance" name="Distance" fill="#6366f1" radius={[0, 4, 4, 0]} maxBarSize={18} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </ChartCard>
      </div>

      {/* Rankings */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <RankingList title="Best On-Time Performance" icon={BadgeCheck} items={bestOnTime.map((d) => ({ id: d.id, name: d.name, subtitle: `${d.rating}★ rating`, value: d.onTimeRate }))} renderValue={(i) => <span className="text-xs font-bold text-emerald-400 font-mono">{i.value}%</span>} />
        <RankingList title="Highest Revenue" icon={Award} items={highestRevenue.map((d) => ({ id: d.id, name: d.name, subtitle: `${d.completedTrips} trips`, value: d.revenue }))} renderValue={(i) => <span className="text-xs font-bold text-emerald-400 font-mono">{formatCurrency(i.value, true)}</span>} />
        <RankingList title="Most Trips Completed" icon={Star} items={mostTrips.map((d) => ({ id: d.id, name: d.name, subtitle: formatDistance(d.distance), value: d.completedTrips }))} renderValue={(i) => <span className="text-xs font-bold text-sky-400 font-mono">{i.value}</span>} />
        <RankingList title="Longest Distance" icon={Compass} items={longestDistance.map((d) => ({ id: d.id, name: d.name, subtitle: `${formatHours(d.drivingHours)} driving`, value: d.distance }))} renderValue={(i) => <span className="text-xs font-bold text-indigo-400 font-mono">{formatDistance(i.value)}</span>} />
        <RankingList title="Highest Allowance" icon={Wallet} items={topList(driverList, 'allowance', 5).map((d) => ({ id: d.id, name: d.name, subtitle: d.status, value: d.allowance }))} renderValue={(i) => <span className="text-xs font-bold text-amber-400 font-mono">{formatCurrency(i.value, true)}</span>} />
        <RankingList title="Top Rated Drivers" icon={UserCheck} items={[...driverList].sort((a, b) => b.rating - a.rating).slice(0, 5).map((d) => ({ id: d.id, name: d.name, subtitle: `${d.completedTrips} trips`, value: d.rating }))} renderValue={(i) => <span className="text-xs font-bold text-amber-400 font-mono">{i.value}★</span>} />
      </div>

      {/* Driver table */}
      <div className="glass-panel rounded-xl p-5 border border-slate-800 space-y-4">
        <h3 className="text-sm font-bold text-slate-100 font-display flex items-center gap-2 border-b border-slate-800 pb-3">
          <Users size={16} className="text-accent-indigo" />
          Driver Performance Register
        </h3>
        <Table
          columns={[
            { header: 'Driver', accessor: 'name', render: (r) => <span className="font-bold text-slate-200">{r.name}</span> },
            { header: 'Status', accessor: 'status', render: (r) => <StatusPill status={r.status} /> },
            { header: 'Trips', accessor: 'completedTrips', render: (r) => <span className="font-mono">{r.completedTrips}</span> },
            { header: 'Distance', accessor: 'distance', render: (r) => <span className="font-mono">{formatDistance(r.distance)}</span> },
            { header: 'Hours', accessor: 'drivingHours', render: (r) => <span className="font-mono">{formatHours(r.drivingHours)}</span> },
            { header: 'Revenue', accessor: 'revenue', render: (r) => <span className="font-mono text-emerald-400">{formatCurrency(r.revenue)}</span> },
            { header: 'Allowance', accessor: 'allowance', render: (r) => <span className="font-mono text-amber-400">{formatCurrency(r.allowance)}</span> },
            { header: 'On-Time', accessor: 'onTimeRate', render: (r) => <span className="font-mono text-emerald-400">{formatPercent(r.onTimeRate)}</span> },
            { header: 'Rating', accessor: 'rating', render: (r) => <span className="text-amber-400 font-bold">{r.rating}★</span> },
          ]}
          data={driverList}
          searchFields={['name', 'mobile', 'status']}
        />
      </div>
    </div>
  );
};

export default DriverAnalytics;
