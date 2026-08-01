import React, { useEffect, useMemo } from 'react';
import { useReportContext } from '../ReportContext';
import ReportKpiCard from '../components/ReportKpiCard';
import ChartCard from '../components/ChartCard';
import Table from '../../../components/common/Table';
import { ReportLoading, StatusPill } from '../components/ReportStates';
import { CHART_COLORS, tooltipStyle, axisProps, gridProps } from '../lib/chartTheme';
import { formatNumber, formatDistance, formatHours } from '../lib/format';
import { groupBy } from '../lib/analytics';
import {
  Navigation,
  CheckCircle2,
  XCircle,
  Clock,
  MapPin,
  Map,
  CalendarClock,
  Gauge,
  ChartArea,
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
  Area,
  AreaChart,
} from 'recharts';

export const TripAnalytics = () => {
  const { rangeKey, registerExporter, isLoading, filteredTrips, tripStats, routeList } = useReportContext();

  const exportRows = useMemo(
    () =>
      filteredTrips.map((t) => ({
        tripId: t.id,
        company: t.companyName,
        vehicle: t.vehicleNumber,
        driver: t.driverName,
        route: `${t.pickupLocation} → ${t.destination}`,
        material: t.material,
        weight: t.weight,
        distanceKm: t.distance,
        status: t.status,
        delayed: t.isDelayed ? 'Yes' : 'No',
        pickupDate: t.pickupDate,
      })),
    [filteredTrips]
  );

  useEffect(() => {
    registerExporter(() => ({ filename: `trip_analytics_${rangeKey}`, rows: exportRows }));
  }, [rangeKey, exportRows, registerExporter]);

  // Pickup / destination frequency analysis
  const pickupData = useMemo(() => {
    const counts = groupBy(filteredTrips, (t) => t.pickupLocation);
    return [...counts.entries()].map(([name, trips]) => ({ name, trips: trips.length })).sort((a, b) => b.trips - a.trips);
  }, [filteredTrips]);

  const destinationData = useMemo(() => {
    const counts = groupBy(filteredTrips, (t) => t.destination);
    return [...counts.entries()].map(([name, trips]) => ({ name, trips: trips.length })).sort((a, b) => b.trips - a.trips);
  }, [filteredTrips]);

  // Distance distribution buckets
  const distanceBuckets = useMemo(() => {
    const buckets = { '< 200 km': 0, '200-500 km': 0, '500-1000 km': 0, '> 1000 km': 0 };
    filteredTrips.forEach((t) => {
      const d = t.distance || 0;
      if (d < 200) buckets['< 200 km'] += 1;
      else if (d < 500) buckets['200-500 km'] += 1;
      else if (d < 1000) buckets['500-1000 km'] += 1;
      else buckets['> 1000 km'] += 1;
    });
    return Object.entries(buckets).map(([name, value]) => ({ name, value }));
  }, [filteredTrips]);

  const statusPie = [
    { name: 'Completed', value: tripStats.completed },
    { name: 'Running', value: tripStats.running },
    { name: 'Assigned', value: tripStats.assigned },
    { name: 'Delivered', value: tripStats.delivered },
    { name: 'Cancelled', value: tripStats.cancelled },
  ].filter((d) => d.value > 0);

  const monthly = useMemo(() => {
    const counts = {};
    filteredTrips.forEach((t) => {
      if (!t.pickupDate) return;
      const d = new Date(t.pickupDate);
      const key = `${d.toLocaleString('default', { month: 'short' })} ${String(d.getFullYear()).slice(-2)}`;
      if (!counts[key]) counts[key] = { name: key, completed: 0, cancelled: 0 };
      if (t.status === 'Completed') counts[key].completed += 1;
      if (t.status === 'Cancelled') counts[key].cancelled += 1;
    });
    return Object.values(counts).slice(-8);
  }, [filteredTrips]);

  const frequentRoutes = useMemo(
    () => [...routeList].sort((a, b) => b.count - a.count).slice(0, 8),
    [routeList]
  );

  if (isLoading) return <ReportLoading />;

  return (
    <div className="space-y-8">
      {/* KPI row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        <ReportKpiCard title="Total Trips" value={formatNumber(tripStats.total)} subtitle="Trips in period" icon={Navigation} color="indigo" />
        <ReportKpiCard title="Completed" value={formatNumber(tripStats.completed)} subtitle="Successfully delivered" icon={CheckCircle2} color="emerald" />
        <ReportKpiCard title="Cancelled" value={formatNumber(tripStats.cancelled)} subtitle="Dispatches revoked" icon={XCircle} color="rose" />
        <ReportKpiCard title="Delayed" value={formatNumber(tripStats.delayed)} subtitle={`${tripStats.onTimeRate}% on-time rate`} icon={Clock} color="amber" />
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <ReportKpiCard title="Avg Distance" value={formatDistance(tripStats.avgDistance)} icon={MapPin} color="sky" className="!p-4" />
        <ReportKpiCard title="Avg Trip Time" value={formatHours(tripStats.avgDuration)} icon={CalendarClock} color="violet" className="!p-4" />
        <ReportKpiCard title="Pickup Locations" value={formatNumber(pickupData.length)} icon={Map} color="emerald" className="!p-4" />
        <ReportKpiCard title="Destinations" value={formatNumber(destinationData.length)} icon={Gauge} color="amber" className="!p-4" />
      </div>

      {/* Status mix + distance distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <ChartCard title="Trip Status Distribution" subtitle="Mix by current state" icon={ChartPie}>
          {(fullscreen) => (
            <div className={`w-full ${fullscreen ? 'h-[60vh]' : 'h-[260px]'} flex items-center justify-center`}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={statusPie} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={50} outerRadius={75} paddingAngle={3}>
                    {statusPie.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                  </Pie>
                  <Tooltip contentStyle={tooltipStyle} />
                  <Legend wrapperStyle={{ fontSize: '11px' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
        </ChartCard>

        <ChartCard title="Distance Distribution" subtitle="Trips by route length" icon={Gauge}>
          {(fullscreen) => (
            <div className={`w-full ${fullscreen ? 'h-[60vh]' : 'h-[260px]'}`}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={distanceBuckets} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid {...gridProps} />
                  <XAxis dataKey="name" {...axisProps} tick={{ fill: '#94a3b8', fontSize: 9 }} />
                  <YAxis {...axisProps} allowDecimals={false} />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Bar dataKey="value" name="Trips" fill="#6366f1" radius={[4, 4, 0, 0]} maxBarSize={40} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </ChartCard>

        <ChartCard title="Monthly Completed vs Cancelled" subtitle="Period trend" icon={ChartArea}>
          {(fullscreen) => (
            <div className={`w-full ${fullscreen ? 'h-[60vh]' : 'h-[260px]'}`}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={monthly} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid {...gridProps} />
                  <XAxis dataKey="name" {...axisProps} />
                  <YAxis {...axisProps} allowDecimals={false} />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Area type="monotone" dataKey="completed" name="Completed" stroke="#10b981" strokeWidth={2} fill="#10b981" fillOpacity={0.15} />
                  <Area type="monotone" dataKey="cancelled" name="Cancelled" stroke="#f43f5e" strokeWidth={2} fill="#f43f5e" fillOpacity={0.15} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}
        </ChartCard>
      </div>

      {/* Pickup & destination analysis */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartCard title="Pickup Analysis" subtitle="Trip origins" icon={Map}>
          {(fullscreen) => (
            <div className={`w-full ${fullscreen ? 'h-[60vh]' : 'h-[260px]'}`}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={pickupData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid {...gridProps} />
                  <XAxis dataKey="name" {...axisProps} tick={{ fill: '#94a3b8', fontSize: 10 }} />
                  <YAxis {...axisProps} allowDecimals={false} />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Bar dataKey="trips" name="Trips" fill="#0ea5e9" radius={[4, 4, 0, 0]} maxBarSize={32} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </ChartCard>

        <ChartCard title="Destination Analysis" subtitle="Trip end points" icon={ChartLine}>
          {(fullscreen) => (
            <div className={`w-full ${fullscreen ? 'h-[60vh]' : 'h-[260px]'}`}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={destinationData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid {...gridProps} />
                  <XAxis dataKey="name" {...axisProps} tick={{ fill: '#94a3b8', fontSize: 10 }} />
                  <YAxis {...axisProps} allowDecimals={false} />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Bar dataKey="trips" name="Trips" fill="#8b5cf6" radius={[4, 4, 0, 0]} maxBarSize={32} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </ChartCard>
      </div>

      {/* Most frequent routes */}
      <div className="glass-panel rounded-xl p-5 border border-slate-800 space-y-4">
        <h3 className="text-sm font-bold text-slate-100 font-display flex items-center gap-2 border-b border-slate-800 pb-3">
          <MapPin size={16} className="text-accent-indigo" />
          Most Frequent Routes
        </h3>
        <Table
          columns={[
            { header: 'Route', accessor: 'route', render: (r) => <span className="font-bold text-indigo-400">{r.route}</span> },
            { header: 'Trips', accessor: 'count', render: (r) => <span className="font-mono">{r.count}</span> },
            { header: 'Completed', accessor: 'completed', render: (r) => <span className="font-mono text-emerald-400">{r.completed}</span> },
            { header: 'Delayed', accessor: 'delayed', render: (r) => <span className="font-mono text-amber-400">{r.delayed}</span> },
            { header: 'Distance', accessor: 'distance', render: (r) => <span className="font-mono">{formatDistance(r.distance)}</span> },
            { header: 'Avg Delivery Time', accessor: 'avgDeliveryTime', render: (r) => <span className="font-mono">{formatHours(r.duration)}</span> },
          ]}
          data={frequentRoutes}
          searchFields={['route']}
        />
      </div>

      {/* Full trip log */}
      <div className="glass-panel rounded-xl p-5 border border-slate-800 space-y-4">
        <h3 className="text-sm font-bold text-slate-100 font-display flex items-center gap-2 border-b border-slate-800 pb-3">
          <Navigation size={16} className="text-accent-indigo" />
          Trip Register
        </h3>
        <Table
          columns={[
            { header: 'Trip ID', accessor: 'id', render: (r) => <span className="font-bold text-slate-200">{r.id}</span> },
            { header: 'Company', accessor: 'companyName' },
            { header: 'Crew', accessor: 'driverName', render: (r) => <span className="text-xs">{r.driverName} • {r.vehicleNumber}</span> },
            { header: 'Route', accessor: 'pickupLocation', render: (r) => <span>{r.pickupLocation} → {r.destination}</span> },
            { header: 'Cargo', accessor: 'material', render: (r) => <span className="text-xs">{r.material} ({r.weight}T)</span> },
            { header: 'Distance', accessor: 'distance', render: (r) => <span className="font-mono">{r.distance} km</span> },
            { header: 'Status', accessor: 'status', render: (r) => <StatusPill status={r.status} /> },
            { header: 'Punctuality', accessor: 'isDelayed', render: (r) => (r.isDelayed ? <span className="text-amber-400 font-semibold text-xs">Delayed</span> : <span className="text-emerald-400 font-semibold text-xs">On-time</span>) },
          ]}
          data={filteredTrips}
          searchFields={['id', 'companyName', 'driverName', 'vehicleNumber', 'status']}
        />
      </div>
    </div>
  );
};

export default TripAnalytics;
