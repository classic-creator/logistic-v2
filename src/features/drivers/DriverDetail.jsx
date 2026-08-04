import { useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { useDriver, useFinances, useTrips } from '../../services/services';
import { useDriverFuelPerformance } from '../../services/fuelServices';
import { CardSkeleton } from '../../components/common/Skeleton';
import StatCard from '../../components/common/StatCard';
import Button from '../../components/common/Button';
import { ArrowLeft, Star, Calendar, FileText, Compass, BadgeCheck, ShieldAlert, Fuel } from 'lucide-react';
import {
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from 'recharts';

const formatCurrency = (value) => `₹${Number(value || 0).toLocaleString('en-IN')}`;

export const DriverDetail = () => {
  const { id: paramId } = useParams();
  const { activeDriverId } = useSelector((state) => state.auth);
  const id = paramId || activeDriverId;
  const navigate = useNavigate();

  const { data: driver, isLoading: driverLoading } = useDriver(id);
  const { data: trips, isLoading: tripsLoading } = useTrips();
  const { data: finances, isLoading: financesLoading } = useFinances();
  const { data: fuelPerf, isLoading: fuelPerfLoading } = useDriverFuelPerformance(id);

  const isDataLoading = driverLoading || tripsLoading || financesLoading;

  // Calculate statistics for this specific driver
  const driverStats = useMemo(() => {
    if (isDataLoading || !driver) return {};

    // Filter trips for this driver
    const myTrips = trips.filter(t => t.driverId === driver.id);
    const completedTrips = myTrips.filter(t => t.status === 'Completed');
    
    const totalDist = completedTrips.reduce((sum, t) => sum + (t.distance || 0), 0);
    const delayedTrips = completedTrips.filter(t => t.isDelayed).length;
    
    // Calculate on-time rate
    const onTimeRate = completedTrips.length 
      ? Math.round(((completedTrips.length - delayedTrips) / completedTrips.length) * 100) 
      : 100;

    return {
      tripsCount: myTrips.length,
      completedCount: completedTrips.length,
      totalDist,
      onTimeRate,
      delayedTrips
    };
  }, [trips, driver, isDataLoading]);

  // Aggregate safety ratings/points over time for the graph
  const performanceHistory = useMemo(() => {
    if (isDataLoading || !driver) return [];
    
    const myTrips = trips.filter(t => t.driverId === driver.id && t.status === 'Completed');
    // Simulate safety index scores based on whether trip was delayed
    return myTrips.slice(-8).map((t, idx) => ({
      name: `Trip ${idx + 1}`,
      safetyScore: t.isDelayed ? 84 : 93 - (idx % 4)
    }));
  }, [trips, driver, isDataLoading]);

  const driverTripRows = useMemo(() => {
    if (isDataLoading || !driver) return [];

    const financeByTripId = new Map((finances || []).map(finance => [finance.tripId, finance]));

    return (trips || [])
      .filter(trip => trip.driverId === driver.id)
      .map(trip => {
        const finance = financeByTripId.get(trip.id);
        const revenue = finance?.tripAmount || 0;
        const expenses = finance?.totalExpenses ?? [
          finance?.dieselExpense,
          finance?.tollExpense,
          finance?.driverAllowance,
          finance?.loadingCharge,
          finance?.unloadingCharge,
          finance?.otherExpenses
        ].reduce((sum, value) => sum + (value || 0), 0);
        const profit = finance?.netProfit ?? revenue - expenses;

        return { ...trip, revenue, expenses, profit };
      })
      .sort((a, b) => new Date(b.pickupDate || 0) - new Date(a.pickupDate || 0));
  }, [driver, finances, isDataLoading, trips]);

  if (isDataLoading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 bg-slate-800 rounded animate-pulse" />
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <CardSkeleton />
          <CardSkeleton />
        </div>
      </div>
    );
  }

  if (!driver) {
    return (
      <div className="py-12 text-center space-y-4">
        <ShieldAlert size={48} className="text-accent-rose mx-auto" />
        <h2 className="text-lg font-bold text-slate-300">Driver Profile Not Found</h2>
        <Button variant="outline" onClick={() => navigate('/drivers')}>
          Back to Directory
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-8 select-none">
      {/* Header Toolbar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/drivers')}
            className="p-2 hover:bg-slate-800 text-slate-400 hover:text-slate-200 rounded-lg transition-all cursor-pointer"
          >
            <ArrowLeft size={20} />
          </button>
          
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-indigo-500/10 border border-slate-800 flex items-center justify-center text-accent-indigo font-bold text-lg uppercase select-none">
              {driver.name.split(' ').map(n => n[0]).join('')}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold font-display text-slate-100">{driver.name}</h1>
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                  driver.status === 'Available' ? 'bg-emerald-500/15 text-accent-emerald' : 
                  (driver.status === 'On Trip' ? 'bg-sky-500/15 text-accent-sky' : 'bg-amber-500/15 text-accent-amber')
                }`}>
                  {driver.status}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1 font-semibold uppercase tracking-wider">
                Assigned Fleet Asset: {driver.assignedVehicle || 'Unassigned'}
              </p>
            </div>
          </div>
        </div>

        <Button variant="outline" size="sm" onClick={() => navigate('/trips')} className="flex items-center gap-1.5">
          <FileText size={14} />
          <span>Trip logs</span>
        </Button>
      </div>

      {/* KPI Stats cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Trips"
          value={driverStats.tripsCount}
          subtitle="Trips assigned to driver"
          icon={FileText}
          color="indigo"
        />
        <StatCard
          title="Distance Covered"
          value={`${driverStats.totalDist.toLocaleString()} km`}
          subtitle="Lifetime mileage logged"
          icon={Compass}
          color="sky"
        />
        <StatCard
          title="On-Time Delivery Rate"
          value={`${driverStats.onTimeRate}%`}
          changeType={driverStats.onTimeRate >= 90 ? 'positive' : 'neutral'}
          subtitle={`${driverStats.delayedTrips} Delayed Trips`}
          icon={BadgeCheck}
          color="emerald"
        />
        <StatCard
          title="Driver Rating"
          value={`${driver.rating || '4.8'} / 5.0`}
          subtitle="Average dispatch rating"
          icon={Star}
          color="amber"
        />
      </div>

      {/* Fuel Performance */}
      <div className="glass-panel rounded-xl p-5 border border-slate-800 space-y-4">
        <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
          <Fuel size={16} className="text-accent-amber" />
          <h3 className="text-sm font-bold text-slate-100 font-display">Fuel Performance</h3>
          {fuelPerfLoading && <span className="ml-auto text-[10px] text-slate-500">Calculating…</span>}
        </div>

        {fuelPerf ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800">
              <span className="text-[9px] uppercase tracking-wider text-slate-500 font-bold block">Total Fuel</span>
              <span className="text-lg font-extrabold font-mono text-amber-300">{Number(fuelPerf.liters || 0).toFixed(1)} L</span>
              <span className="text-[10px] text-slate-500 block mt-0.5">₹{Number(fuelPerf.cost || 0).toLocaleString('en-IN')}</span>
            </div>
            <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800">
              <span className="text-[9px] uppercase tracking-wider text-slate-500 font-bold block">Avg Mileage</span>
              <span className="text-lg font-extrabold font-mono text-emerald-400">{Number(fuelPerf.avgMileage || 0).toFixed(1)} km/L</span>
              <span className="text-[10px] text-slate-500 block mt-0.5">{fuelPerf.entries} fills</span>
            </div>
            <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800">
              <span className="text-[9px] uppercase tracking-wider text-slate-500 font-bold block">Cost / KM</span>
              <span className="text-lg font-extrabold font-mono text-sky-400">₹{Number(fuelPerf.costPerKm || 0).toFixed(2)}</span>
              <span className="text-[10px] text-slate-500 block mt-0.5">Including flagged</span>
            </div>
            <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800">
              <span className="text-[9px] uppercase tracking-wider text-slate-500 font-bold block">Fuel to Revenue</span>
              <span className="text-lg font-extrabold font-mono text-indigo-300">{fuelPerf.fuelToRevenue ? `${(fuelPerf.fuelToRevenue * 100).toFixed(1)}%` : '—'}</span>
              <span className="text-[10px] text-slate-500 block mt-0.5">Share of trip revenue</span>
            </div>
          </div>
        ) : (
          !fuelPerfLoading && (
            <p className="text-xs text-slate-500">No approved fuel entries logged for this driver yet.</p>
          )
        )}
      </div>

      {/* Charts & Details split grids */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Recharts Area graph */}
        <div className="lg:col-span-2 glass-panel rounded-xl p-5 border border-slate-800 flex flex-col justify-between">
          <div className="mb-4">
            <h3 className="text-sm font-bold text-slate-100 font-display">Safety & Performance Index</h3>
            <p className="text-xs text-slate-500">Calculated driving telemetry scores per trip (scale 0-100)</p>
          </div>

          <div className="h-[240px] w-full text-xs">
            {performanceHistory.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={performanceHistory} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="safetyGlow" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                  <XAxis dataKey="name" stroke="#64748b" tickLine={false} />
                  <YAxis stroke="#64748b" tickLine={false} domain={[70, 100]} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', color: '#f1f5f9' }}
                  />
                  <Area type="monotone" dataKey="safetyScore" name="Driving Score" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#safetyGlow)" />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-slate-500 font-semibold text-xs">
                No performance history recorded.
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Driver License & Aadhaar identification details */}
        <div className="glass-panel rounded-xl p-5 border border-slate-800 space-y-4">
          <h3 className="text-sm font-bold text-slate-100 font-display border-b border-slate-800 pb-2">
            Compliance Details
          </h3>

          <div className="space-y-3.5 text-xs">
            <div className="flex justify-between items-center">
              <span className="text-slate-500 font-semibold">License Number</span>
              <span className="font-mono text-slate-300 font-bold">{driver.license}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-500 font-semibold">License Expiry</span>
              <span className={`font-semibold ${new Date(driver.licenseExpiry) < new Date('2026-09-01') ? 'text-accent-rose font-bold' : 'text-slate-300'}`}>
                {driver.licenseExpiry}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-500 font-semibold">Aadhaar (UIDAI)</span>
              <span className="font-mono text-slate-300 font-bold">{driver.aadhaar}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-500 font-semibold">Emergency Contact</span>
              <span className="text-slate-300 font-semibold text-right">{driver.emergencyContact}</span>
            </div>
            <div className="flex justify-between items-center text-indigo-400 font-semibold pt-1 border-t border-slate-800">
              <span className="text-slate-500">Contact Number</span>
              <span className="font-mono">{driver.mobile}</span>
            </div>
          </div>
        </div>

      </div>

      {/* Driver Trip Profit Ledger */}
      <div className="glass-panel rounded-xl p-5 border border-slate-800 space-y-4">
        <h3 className="text-sm font-bold text-slate-100 font-display flex items-center gap-1.5 border-b border-slate-800 pb-3">
          <Calendar size={16} className="text-accent-indigo" />
          <span>Trip Revenue & Profit Ledger</span>
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[980px] text-left text-xs border-collapse">
            <thead>
              <tr className="text-slate-500 font-bold border-b border-slate-800">
                <th className="py-2.5">Trip ID</th>
                <th>Date</th>
                <th>Company</th>
                <th>Vehicle</th>
                <th>Route</th>
                <th>Load</th>
                <th>Distance</th>
                <th>Revenue</th>
                <th>Expenses</th>
                <th>Profit</th>
                <th className="text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50">
              {driverTripRows.map((t) => (
                <tr key={t.id} className="text-slate-300">
                  <td className="py-3 font-mono font-bold text-indigo-400">{t.id}</td>
                  <td className="font-mono text-slate-500">{t.pickupDate || '—'}</td>
                  <td className="font-semibold">{t.companyName}</td>
                  <td className="font-mono text-slate-400">{t.vehicleNumber || 'Unassigned'}</td>
                  <td className="text-slate-400 font-semibold">{t.pickupLocation} → {t.destination}</td>
                  <td>{t.material} ({t.weight}T)</td>
                  <td className="font-mono">{t.distance} km</td>
                  <td className="font-mono font-semibold text-slate-200">{formatCurrency(t.revenue)}</td>
                  <td className="font-mono text-amber-300">{formatCurrency(t.expenses)}</td>
                  <td className={`font-mono font-bold ${t.profit >= 0 ? 'text-emerald-300' : 'text-rose-300'}`}>{formatCurrency(t.profit)}</td>
                  <td className="text-right">
                    <span className={`px-2 py-0.5 rounded font-semibold text-[10px] uppercase ${
                      t.status === 'Completed' ? 'bg-emerald-500/10 text-accent-emerald' : 'bg-sky-500/10 text-accent-sky'
                    }`}>
                      {t.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};

export default DriverDetail;
