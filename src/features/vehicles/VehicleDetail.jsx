import { useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useVehicle, useTrips, useFinances, useUpdateVehicle } from '../../services/services';
import { useVehicleFuelPerformance } from '../../services/fuelServices';
import { CardSkeleton } from '../../components/common/Skeleton';
import StatCard from '../../components/common/StatCard';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import { ArrowLeft, Truck, ShieldAlert, Award, FileText, Calendar, PlusCircle, PenTool, Fuel } from 'lucide-react';
import {
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
} from 'recharts';

const formatCurrency = (value) => `₹${Number(value || 0).toLocaleString('en-IN')}`;

export const VehicleDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const { data: vehicle, isLoading: vehicleLoading } = useVehicle(id);
  const { data: trips, isLoading: tripsLoading } = useTrips();
  const { data: finances, isLoading: financesLoading } = useFinances();
  const { data: fuelPerf, isLoading: fuelPerfLoading } = useVehicleFuelPerformance(id);
  const updateMutation = useUpdateVehicle();

  const [showLogModal, setShowLogModal] = useState(false);
  const [maintenanceRecords, setMaintenanceRecords] = useState([
    { id: 1, date: '2026-06-12', type: 'Engine Oil Change', cost: 4500, technician: 'Vikas Motors', status: 'Completed' },
    { id: 2, date: '2026-07-20', type: 'Tire Alignment & Rotation', cost: 3200, technician: 'Apex Wheel Care', status: 'Completed' }
  ]);

  const [newLog, setNewLog] = useState({ date: '', type: '', cost: '', technician: '' });

  const isDataLoading = vehicleLoading || tripsLoading || financesLoading;

  // Compute stats for this specific vehicle
  const vehicleStats = useMemo(() => {
    if (isDataLoading || !vehicle) return {};

    // Filter trips for this vehicle
    const myTrips = trips.filter(t => t.vehicleId === vehicle.id);
    const completedTrips = myTrips.filter(t => t.status === 'Completed');
    
    const totalDist = completedTrips.reduce((sum, t) => sum + (t.distance || 0), 0);
    const tripIds = myTrips.map(t => t.id);

    // Filter finances for those trips
    const myFinances = finances.filter(f => tripIds.includes(f.tripId));
    const revenue = myFinances.reduce((sum, f) => sum + (f.tripAmount || 0), 0);
    const diesel = myFinances.reduce((sum, f) => sum + (f.dieselExpense || 0), 0);
    const tolls = myFinances.reduce((sum, f) => sum + (f.tollExpense || 0), 0);
    const allowance = myFinances.reduce((sum, f) => sum + (f.driverAllowance || 0), 0);
    
    // Operating profit calculations
    const opExpenses = diesel + tolls + allowance;
    const maintenanceCost = maintenanceRecords.reduce((sum, r) => sum + r.cost, 0);
    const netProfit = revenue - (opExpenses + maintenanceCost);
    const profitMargin = revenue ? ((netProfit / revenue) * 100).toFixed(1) : 0;

    return {
      tripsCount: myTrips.length,
      completedCount: completedTrips.length,
      totalDist,
      revenue,
      opExpenses,
      maintenanceCost,
      netProfit,
      profitMargin
    };
  }, [trips, finances, vehicle, maintenanceRecords, isDataLoading]);

  // Aggregate monthly distance for the Recharts graph
  const distanceChartData = useMemo(() => {
    if (isDataLoading || !vehicle) return [];
    
    const myTrips = trips.filter(t => t.vehicleId === vehicle.id && t.status === 'Completed');
    const months = {};

    myTrips.forEach(t => {
      if (!t.pickupDate) return;
      const date = new Date(t.pickupDate);
      const key = date.toLocaleString('default', { month: 'short' });
      months[key] = (months[key] || 0) + (t.distance || 0);
    });

    const monthsOrder = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return Object.entries(months).map(([name, value]) => ({
      name,
      distance: value
    })).sort((a, b) => monthsOrder.indexOf(a.name) - monthsOrder.indexOf(b.name));
  }, [trips, vehicle, isDataLoading]);

  const vehicleTripRows = useMemo(() => {
    if (isDataLoading || !vehicle) return [];

    const financeByTripId = new Map((finances || []).map(finance => [finance.tripId, finance]));

    return (trips || [])
      .filter(trip => trip.vehicleId === vehicle.id)
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
  }, [finances, isDataLoading, trips, vehicle]);

  const handleAddMaintenance = (e) => {
    e.preventDefault();
    if (!newLog.date || !newLog.type || !newLog.cost) return;

    setMaintenanceRecords(prev => [
      ...prev,
      {
        id: Date.now(),
        date: newLog.date,
        type: newLog.type,
        cost: Number(newLog.cost),
        technician: newLog.technician || 'General Workshop',
        status: 'Completed'
      }
    ]);
    
    setShowLogModal(false);
    setNewLog({ date: '', type: '', cost: '', technician: '' });
  };

  const toggleStatus = () => {
    const nextStatus = vehicle.status === 'Available' ? 'Maintenance' : 'Available';
    updateMutation.mutate({
      id: vehicle.id,
      data: { status: nextStatus }
    });
  };

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

  if (!vehicle) {
    return (
      <div className="py-12 text-center space-y-4">
        <ShieldAlert size={48} className="text-accent-rose mx-auto" />
        <h2 className="text-lg font-bold text-slate-300">Vehicle Not Found</h2>
        <Button variant="outline" onClick={() => navigate('/vehicles')}>
          Back to Fleet List
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
            onClick={() => navigate('/vehicles')}
            className="p-2 hover:bg-slate-800 text-slate-400 hover:text-slate-200 rounded-lg transition-all cursor-pointer"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold font-display text-slate-100">{vehicle.number}</h1>
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                vehicle.status === 'Available' ? 'bg-emerald-500/15 text-accent-emerald' : 
                (vehicle.status === 'Running' ? 'bg-sky-500/15 text-accent-sky' : 'bg-amber-500/15 text-accent-amber')
              }`}>
                {vehicle.status}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1 font-semibold uppercase tracking-wider">
              {vehicle.type} • PERMIT: {vehicle.permit}
            </p>
          </div>
        </div>

        {/* Action triggers */}
        <div className="flex gap-2">
          {vehicle.status !== 'Running' && (
            <Button variant="secondary" size="sm" onClick={toggleStatus} className="flex items-center gap-1.5">
              <PenTool size={14} />
              <span>{vehicle.status === 'Available' ? 'Send to Maintenance' : 'Set as Available'}</span>
            </Button>
          )}
          <Button variant="outline" size="sm" onClick={() => navigate('/trips')} className="flex items-center gap-1.5">
            <FileText size={14} />
            <span>Assigned Trips</span>
          </Button>
        </div>
      </div>

      {/* KPI Stats cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Trips"
          value={vehicleStats.tripsCount}
          subtitle="Trips assigned to this asset"
          icon={FileText}
          color="indigo"
        />
        <StatCard
          title="Distance Covered"
          value={`${vehicleStats.totalDist.toLocaleString()} km`}
          subtitle="Lifetime driving log"
          icon={Truck}
          color="sky"
        />
        <StatCard
          title="Net Generated Profit"
          value={`₹${vehicleStats.netProfit.toLocaleString('en-IN')}`}
          change={`${vehicleStats.profitMargin}%`}
          changeType="positive"
          subtitle="After maintenance & fuel"
          icon={Award}
          color="emerald"
        />
        <StatCard
          title="Maintenance Cost"
          value={`₹${vehicleStats.maintenanceCost.toLocaleString('en-IN')}`}
          subtitle="Total service center charges"
          icon={PenTool}
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

        {fuelPerf && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800">
              <span className="text-[9px] uppercase tracking-wider text-slate-500 font-bold block">Lifetime Fuel</span>
              <span className="text-lg font-extrabold font-mono text-amber-300">{Number(fuelPerf.liters || 0).toFixed(1)} L</span>
              <span className="text-[10px] text-slate-500 block mt-0.5">₹{Number(fuelPerf.cost || 0).toLocaleString('en-IN')}</span>
            </div>
            <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800">
              <span className="text-[9px] uppercase tracking-wider text-slate-500 font-bold block">Avg Mileage</span>
              <span className="text-lg font-extrabold font-mono text-emerald-400">{Number(fuelPerf.avgMileage || 0).toFixed(1)} km/L</span>
              <span className="text-[10px] text-slate-500 block mt-0.5">{(fuelPerf.manufacturerMileage ? `Mfr: ${fuelPerf.manufacturerMileage}` : '')}</span>
            </div>
            <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800">
              <span className="text-[9px] uppercase tracking-wider text-slate-500 font-bold block">Cost / KM</span>
              <span className="text-lg font-extrabold font-mono text-sky-400">₹{Number(fuelPerf.costPerKm || 0).toFixed(2)}</span>
              <span className="text-[10px] text-slate-500 block mt-0.5">{fuelPerf.entries} fills</span>
            </div>
            <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800">
              <span className="text-[9px] uppercase tracking-wider text-slate-500 font-bold block">Distance</span>
              <span className="text-lg font-extrabold font-mono text-indigo-300">{Number(fuelPerf.distance || 0).toLocaleString('en-IN')} km</span>
              <span className="text-[10px] text-slate-500 block mt-0.5">Tank: {fuelPerf.tankCapacity ? `${fuelPerf.tankCapacity} L` : '—'}</span>
            </div>
          </div>
        )}

        {fuelPerf && (fuelPerf.bestMileage?.tripId || fuelPerf.worstMileage?.tripId) && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
            {fuelPerf.bestMileage?.tripId && (
              <div className="p-3 rounded-lg bg-emerald-500/5 border border-emerald-500/15">
                <span className="text-[9px] uppercase tracking-wider text-accent-emerald font-bold block mb-1">Best Route</span>
                <span className="text-slate-200 font-semibold block">{fuelPerf.bestMileage.route}</span>
                <span className="text-[10px] text-slate-500 font-mono">{Number(fuelPerf.bestMileage.mileage).toFixed(1)} km/L</span>
              </div>
            )}
            {fuelPerf.worstMileage?.tripId && (
              <div className="p-3 rounded-lg bg-rose-500/5 border border-rose-500/15">
                <span className="text-[9px] uppercase tracking-wider text-accent-rose font-bold block mb-1">Worst Route</span>
                <span className="text-slate-200 font-semibold block">{fuelPerf.worstMileage.route}</span>
                <span className="text-[10px] text-slate-500 font-mono">{Number(fuelPerf.worstMileage.mileage).toFixed(1)} km/L</span>
              </div>
            )}
          </div>
        )}

        {!fuelPerf && !fuelPerfLoading && (
          <p className="text-xs text-slate-500">No approved fuel entries yet for this vehicle.</p>
        )}
      </div>

      {/* Charts & Detail grids */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Recharts Bar graphic */}
        <div className="lg:col-span-2 glass-panel rounded-xl p-5 border border-slate-800 flex flex-col justify-between">
          <div className="mb-4">
            <h3 className="text-sm font-bold text-slate-100 font-display">Monthly Running Log</h3>
            <p className="text-xs text-slate-500 font-medium">Accumulated mileage covered (km) per calendar month</p>
          </div>

          <div className="h-[240px] w-full text-xs">
            {distanceChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={distanceChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                  <XAxis dataKey="name" stroke="#64748b" tickLine={false} />
                  <YAxis stroke="#64748b" tickLine={false} tickFormatter={(val) => `${val}km`} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', color: '#f1f5f9' }}
                  />
                  <Bar dataKey="distance" name="Distance Covered" fill="#6366f1" radius={[4, 4, 0, 0]} maxBarSize={45} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-slate-500 font-semibold text-xs">
                No trip records completed in recent months.
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Asset Specifications & Expiration metadata */}
        <div className="glass-panel rounded-xl p-5 border border-slate-800 space-y-4">
          <h3 className="text-sm font-bold text-slate-100 font-display border-b border-slate-800 pb-2">
            Compliance Details
          </h3>

          <div className="space-y-3.5 text-xs">
            <div className="flex justify-between items-center">
              <span className="text-slate-500 font-semibold">RC Number</span>
              <span className="font-mono text-slate-300 font-bold">{vehicle.rc}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-500 font-semibold">Insurance Policy</span>
              <span className="font-mono text-slate-300 font-bold">{vehicle.insurance}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-500 font-semibold">Fitness Validity</span>
              <span className="text-slate-300 font-semibold">{vehicle.fitness}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-500 font-semibold">Pollution Permit</span>
              <span className="text-slate-300 font-semibold">{vehicle.pollution}</span>
            </div>
            <div className="flex justify-between items-center text-indigo-400 font-semibold pt-1 border-t border-slate-800">
              <span className="text-slate-500">Terminal GPS ID</span>
              <span className="font-mono">{vehicle.gpsId}</span>
            </div>
          </div>
        </div>

      </div>

      {/* Maintenance Logs Section */}
      <div className="glass-panel rounded-xl p-5 border border-slate-800 space-y-4">
        <div className="border-b border-slate-800 pb-3">
          <h3 className="text-sm font-bold text-slate-100 font-display flex items-center gap-1.5">
            <FileText size={16} className="text-accent-indigo" />
            <span>Trip Revenue & Profit Ledger</span>
          </h3>
          <p className="mt-1 text-xs text-slate-500">Every trip assigned to this vehicle, including driver, financials, and status.</p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[980px] text-left text-xs border-collapse">
            <thead>
              <tr className="text-slate-500 font-bold border-b border-slate-800">
                <th className="py-2.5">Trip / Date</th>
                <th>Driver</th>
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
              {vehicleTripRows.length > 0 ? vehicleTripRows.map((trip) => (
                <tr key={trip.id} className="text-slate-300">
                  <td className="py-3">
                    <span className="block font-mono font-bold text-indigo-400">{trip.id}</span>
                    <span className="mt-0.5 flex items-center gap-1 text-[10px] text-slate-500"><Calendar size={11} />{trip.pickupDate || '—'}</span>
                  </td>
                  <td className="font-semibold text-slate-200">{trip.driverName || 'Unassigned'}</td>
                  <td className="max-w-[220px] font-semibold text-slate-400">{trip.pickupLocation} → {trip.destination}</td>
                  <td>{trip.material || '—'} <span className="text-slate-500">({trip.weight || 0}T)</span></td>
                  <td className="font-mono">{Number(trip.distance || 0).toLocaleString('en-IN')} km</td>
                  <td className="font-mono font-semibold text-slate-200">{formatCurrency(trip.revenue)}</td>
                  <td className="font-mono text-amber-300">{formatCurrency(trip.expenses)}</td>
                  <td className={`font-mono font-bold ${trip.profit >= 0 ? 'text-emerald-300' : 'text-rose-300'}`}>{formatCurrency(trip.profit)}</td>
                  <td className="text-right">
                    <span className={`rounded px-2 py-0.5 text-[10px] font-semibold uppercase ${
                      trip.status === 'Completed' || trip.status === 'Delivered'
                        ? 'bg-emerald-500/10 text-accent-emerald'
                        : trip.status === 'Cancelled'
                          ? 'bg-slate-800 text-slate-500'
                          : 'bg-sky-500/10 text-accent-sky'
                    }`}>
                      {trip.status}
                    </span>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan="9" className="py-8 text-center font-semibold text-slate-500">No trips assigned to this vehicle yet.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Maintenance Logs Section */}
      <div className="glass-panel rounded-xl p-5 border border-slate-800 space-y-4">
        <div className="flex justify-between items-center border-b border-slate-800 pb-3">
          <h3 className="text-sm font-bold text-slate-100 font-display flex items-center gap-1.5">
            <PenTool size={16} className="text-accent-amber" />
            <span>Service & Maintenance Logs</span>
          </h3>
          <Button variant="outline" size="sm" onClick={() => setShowLogModal(true)} className="flex items-center gap-1">
            <PlusCircle size={14} />
            <span>Add Record</span>
          </Button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="text-slate-500 font-bold border-b border-slate-800">
                <th className="py-2.5">Date</th>
                <th>Maintenance Activity</th>
                <th>Technician/Vendor</th>
                <th>Cost (INR)</th>
                <th className="text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50">
              {maintenanceRecords.map((rec) => (
                <tr key={rec.id} className="text-slate-300">
                  <td className="py-3 font-mono flex items-center gap-1.5">
                    <Calendar size={12} className="text-slate-500" />
                    {rec.date}
                  </td>
                  <td className="font-semibold">{rec.type}</td>
                  <td className="text-slate-400">{rec.technician}</td>
                  <td className="font-mono font-semibold">₹{rec.cost.toLocaleString('en-IN')}</td>
                  <td className="text-right">
                    <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-accent-emerald font-semibold uppercase text-[10px]">
                      {rec.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Maintenance Log Modal */}
      {showLogModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm" onClick={() => setShowLogModal(false)} />
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 max-w-md w-full relative z-10 space-y-4">
            <h3 className="text-base font-bold text-slate-100 font-display">Add Maintenance Record</h3>
            
            <form onSubmit={handleAddMaintenance} className="space-y-3 text-xs">
              <Input
                label="Date of Service"
                type="date"
                required
                value={newLog.date}
                onChange={e => setNewLog(p => ({ ...p, date: e.target.value }))}
              />
              <Input
                label="Activity Description"
                placeholder="e.g. Engine tune-up, Brake pads replacement"
                required
                value={newLog.type}
                onChange={e => setNewLog(p => ({ ...p, type: e.target.value }))}
              />
              <Input
                label="Maintenance Cost (₹)"
                type="number"
                placeholder="Cost in INR"
                required
                value={newLog.cost}
                onChange={e => setNewLog(p => ({ ...p, cost: e.target.value }))}
              />
              <Input
                label="Workshop / Service Center"
                placeholder="e.g. Maruti Authorized Service"
                value={newLog.technician}
                onChange={e => setNewLog(p => ({ ...p, technician: e.target.value }))}
              />

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
                <Button variant="outline" size="sm" onClick={() => setShowLogModal(false)}>
                  Cancel
                </Button>
                <Button type="submit" variant="primary" size="sm">
                  Save Record
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default VehicleDetail;
