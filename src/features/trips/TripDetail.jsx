import React from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useTrip, useUpdateTrip } from '../../services/services';
import TripFuelPanel from '../fuel/TripFuelPanel';
import MapContainer from '../../components/common/MapContainer';
import Button from '../../components/common/Button';
import StatCard from '../../components/common/StatCard';
import { CardSkeleton } from '../../components/common/Skeleton';
import {
  ArrowLeft,
  Phone,
  Truck,
  User,
  Building2,
  MapPin,
  Box,
  Scale,
  Clock,
  Gauge,
  Navigation,
  FileText,
  CheckCircle2,
  Ban,
  Route as RouteIcon,
} from 'lucide-react';

export const TripDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const { data: trip, isLoading } = useTrip(id);
  const updateTripMutation = useUpdateTrip();

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-64 bg-slate-800 rounded animate-pulse" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2"><CardSkeleton /></div>
          <CardSkeleton />
        </div>
      </div>
    );
  }

  if (!trip) {
    return (
      <div className="py-12 text-center space-y-4">
        <RouteIcon size={48} className="text-accent-rose mx-auto" />
        <h2 className="text-lg font-bold text-slate-300">Trip Not Found</h2>
        <Button variant="outline" onClick={() => navigate('/trips')}>
          Back to Trips
        </Button>
      </div>
    );
  }

  const isRunning = trip.status === 'Running';
  const isDelivered = trip.status === 'Delivered';

  const statusPill = () => {
    const map = {
      Assigned: 'bg-indigo-500/15 text-accent-indigo',
      Running: 'bg-sky-500/15 text-accent-sky animate-pulse',
      Delivered: 'bg-violet-500/15 text-violet-400',
      Completed: 'bg-emerald-500/15 text-accent-emerald',
      Cancelled: 'bg-rose-500/15 text-accent-rose',
    };
    return `px-2.5 py-0.5 rounded-full text-xs font-bold ${map[trip.status] || 'bg-slate-800 text-slate-400'}`;
  };

  const handleComplete = () => {
    if (window.confirm('Confirm delivery and mark this trip as completed?')) {
      updateTripMutation.mutate(
        {
          id: trip.id,
          data: { status: 'Completed', remarks: 'Trip completed and marked delivered.' },
        },
        { onSuccess: () => navigate('/trips') }
      );
    }
  };

  const handleMarkDelivered = () => {
    updateTripMutation.mutate({
      id: trip.id,
      data: { status: 'Delivered', remarks: 'Driver reached destination, awaiting POD confirmation.' },
    });
  };

  const handleCancel = () => {
    if (window.confirm('Cancel this trip? Vehicle and driver will be released.')) {
      updateTripMutation.mutate(
        {
          id: trip.id,
          data: { status: 'Cancelled', remarks: 'Trip cancelled by operations.' },
        },
        { onSuccess: () => navigate('/trips') }
      );
    }
  };

  const telemetry = [
    { label: 'Speed', value: isRunning && trip.speed ? `${trip.speed} km/h` : '0 km/h', icon: Gauge, color: 'text-sky-400' },
    { label: 'ETA', value: isRunning && trip.eta ? trip.eta : '—', icon: Clock, color: 'text-indigo-400' },
    { label: 'Remaining', value: isRunning ? `${trip.remainingDistance ?? 0} km` : '—', icon: Navigation, color: 'text-amber-400' },
    { label: 'Last Update', value: trip.lastUpdated || '—', icon: Clock, color: 'text-slate-400' },
  ];

  const details = [
    { label: 'Company', value: trip.companyName, icon: Building2 },
    { label: 'Driver', value: trip.driverName, icon: User },
    { label: 'Vehicle', value: trip.vehicleNumber, icon: Truck },
    { label: 'Material', value: trip.material, icon: Box },
    { label: 'Weight', value: `${trip.weight} T`, icon: Scale },
    { label: 'Distance', value: `${trip.distance} km`, icon: MapPin },
    { label: 'Est. Duration', value: `${trip.estimatedDuration} hrs`, icon: Clock },
    { label: 'Pickup Date', value: trip.pickupDate, icon: MapPin },
  ];

  return (
    <div className="space-y-8 select-none">
      {/* Header Toolbar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/trips')}
            className="p-2 hover:bg-slate-800 text-slate-400 hover:text-slate-200 rounded-lg transition-all cursor-pointer"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold font-display text-slate-100">{trip.id}</h1>
              <span className={statusPill()}>{trip.status}</span>
            </div>
            <p className="text-xs text-slate-500 mt-1 font-semibold uppercase tracking-wider">
              {trip.pickupLocation} → {trip.destination}
            </p>
          </div>
        </div>

        {/* Action triggers */}
        <div className="flex flex-wrap gap-2">
          {trip.driverName && (
            <a href={`tel:${trip.driverMobile || '1800250500'}`}>
              <Button variant="outline" size="sm" className="flex items-center gap-1.5">
                <Phone size={14} />
                Call Driver
              </Button>
            </a>
          )}
          {isRunning && (
            <Button variant="secondary" size="sm" onClick={handleMarkDelivered} className="flex items-center gap-1.5">
              <CheckCircle2 size={14} />
              Mark Delivered
            </Button>
          )}
          {(isRunning || isDelivered) && (
            <Button variant="primary" size="sm" onClick={handleComplete} isLoading={updateTripMutation.isPending} className="flex items-center gap-1.5">
              <CheckCircle2 size={14} />
              Complete Trip
            </Button>
          )}
          {(isRunning || isDelivered) && (
            <Button variant="danger" size="sm" onClick={handleCancel} className="flex items-center gap-1.5">
              <Ban size={14} />
              Cancel
            </Button>
          )}
        </div>
      </div>

      {/* Live map */}
      <MapContainer
        pickup={trip.pickupLocation}
        destination={trip.destination}
        vehicleNumber={trip.vehicleNumber}
        driverName={trip.driverName}
        speed={trip.speed}
        status={trip.status}
        eta={trip.eta}
        remainingDistance={trip.remainingDistance}
      />

      {/* Telemetry */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {telemetry.map((t) => (
          <div key={t.label} className="glass-panel rounded-xl p-4 border border-slate-800 flex items-center gap-3">
            <div className={`p-2.5 rounded-lg bg-slate-800/60 ${t.color}`}>
              <t.icon size={18} />
            </div>
            <div>
              <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">{t.label}</div>
              <div className={`text-sm font-bold font-mono ${t.color}`}>{t.value}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Status stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="Revenue" value={`₹${trip.distance ? (trip.distance * 55).toLocaleString('en-IN') : '—'}`} subtitle="Estimated billing" icon={FileText} color="emerald" />
        <StatCard title="Start Odometer" value={trip.startOdometer ? trip.startOdometer.toLocaleString('en-IN') : '—'} subtitle="Distance meter at pickup" icon={Gauge} color="sky" />
        <StatCard title="End Odometer" value={trip.endOdometer ? trip.endOdometer.toLocaleString('en-IN') : '—'} subtitle="Distance meter at delivery" icon={Gauge} color="indigo" />
        <StatCard title="Delivery Date" value={trip.deliveryDate || '—'} subtitle={trip.isDelayed ? 'Delayed' : 'On schedule'} icon={Clock} color={trip.isDelayed ? 'amber' : 'emerald'} />
      </div>

      {/* Trip details */}
      <div className="glass-panel rounded-xl p-5 border border-slate-800 space-y-4">
        <h3 className="text-sm font-bold text-slate-100 font-display flex items-center gap-2 border-b border-slate-800 pb-3">
          <RouteIcon size={16} className="text-accent-indigo" />
          Trip Details
        </h3>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
          {details.map((d) => (
            <div key={d.label} className="flex items-center gap-2.5 p-2.5 rounded-lg hover:bg-slate-800/40">
              <d.icon size={14} className="text-slate-500" />
              <div className="min-w-0">
                <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">{d.label}</div>
                <div className="font-semibold text-slate-200 truncate">{d.value}</div>
              </div>
            </div>
          ))}
        </div>
        {trip.remarks && (
          <div className="mt-2 p-3 rounded-lg bg-slate-800/40 border border-slate-800 text-xs text-slate-400">
            <span className="text-slate-500 font-bold uppercase tracking-wider mr-2">Remarks:</span>
            {trip.remarks}
          </div>
        )}
      </div>

      {/* Fuel Intelligence: estimation vs actual + timeline */}
      <TripFuelPanel trip={trip} />

      {/* Related order */}
      {trip.orderId && (
        <div className="glass-panel rounded-xl p-5 border border-slate-800 space-y-4">
          <h3 className="text-sm font-bold text-slate-100 font-display flex items-center gap-2 border-b border-slate-800 pb-3">
            <FileText size={16} className="text-accent-indigo" />
            Linked Order
          </h3>
          <Link to="/orders" className="text-sm font-bold text-indigo-400 hover:text-indigo-300 hover:underline flex items-center gap-1.5">
            <FileText size={14} />
            {trip.orderId}
          </Link>
        </div>
      )}
    </div>
  );
};

export default TripDetail;
