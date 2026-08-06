import { useCallback, useEffect, useMemo, useState } from 'react';
import { useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { useTrips } from '../../services/services';
import { FuelEntryForm } from './FuelEntryForm';
import { readOfflineFuelQueue, clearOfflineFuelQueue } from './lib/offlineQueue';
import { FuelTimeline } from './FuelTimeline';
import { ShieldCheck, Fuel, Wifi, WifiOff, CheckCircle2 } from 'lucide-react';
import apiClient from '../../services/api';

export const DriverFuelLog = () => {
  const { activeDriverId } = useSelector((state) => state.auth);
  const { data: trips, isLoading } = useTrips();
  const queryClient = useQueryClient();
  const [syncMsg, setSyncMsg] = useState('');

  const activeTrip = useMemo(() => {
    if (!trips || !activeDriverId) return null;
    return trips.find(
      (t) => String(t.driverId) === String(activeDriverId) && ['Assigned', 'Running', 'Delivered'].includes(t.status)
    );
  }, [trips, activeDriverId]);

  const isOnline = typeof navigator !== 'undefined' ? navigator.onLine : true;

  // Auto-sync the offline queue whenever connectivity returns.
  const syncOfflineQueue = useCallback(async () => {
    const queue = readOfflineFuelQueue();
    if (!queue.length || !navigator.onLine) return;

    for (const item of queue) {
      const payload = { ...item };
      delete payload.id;
      delete payload.queuedAt;
      try {
        await apiClient.post('/api/v1/fuel-entries', payload);
      } catch {
        // leave failed items in the queue
        return;
      }
    }
    clearOfflineFuelQueue();
    setSyncMsg(`${queue.length} offline fuel entr${queue.length === 1 ? 'y was' : 'ies were'} synced automatically.`);
    queryClient.invalidateQueries();
  }, [queryClient]);

  useEffect(() => {
    const onOnline = () => syncOfflineQueue();
    window.addEventListener('online', onOnline);
    return () => window.removeEventListener('online', onOnline);
  }, [syncOfflineQueue]);

  if (isLoading) {
    return <div className="h-64 flex items-center justify-center text-slate-500">Loading driver fuel log...</div>;
  }

  const queueLength = readOfflineFuelQueue().length;

  return (
    <div className="max-w-md mx-auto space-y-6 select-none pb-12">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold font-display text-slate-100 flex items-center gap-2">
            <Fuel size={22} className="text-accent-amber" />
            Fuel Log
          </h1>
          <p className="text-xs text-slate-500 mt-1">Record refills for your current dispatch.</p>
        </div>
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide ${isOnline ? 'bg-emerald-500/15 text-accent-emerald' : 'bg-amber-500/15 text-accent-amber'}`}>
          {isOnline ? <Wifi size={11} /> : <WifiOff size={11} />}
          {isOnline ? 'Online' : 'Offline'}
        </span>
      </div>

      {syncMsg && (
        <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-xs font-semibold text-accent-emerald rounded-lg flex items-center gap-2">
          <CheckCircle2 size={14} />
          <span>{syncMsg}</span>
        </div>
      )}

      {queueLength > 0 && (
        <div className="p-3 bg-amber-500/10 border border-amber-500/20 text-xs font-semibold text-accent-amber rounded-lg flex items-center gap-2">
          <WifiOff size={14} />
          <span>{queueLength} entr{queueLength === 1 ? 'y' : 'ies'} in the offline queue.</span>
          {isOnline && (
            <button
              type="button"
              onClick={syncOfflineQueue}
              className="ml-auto px-2 py-1 rounded bg-amber-500/20 text-[10px] font-bold uppercase hover:bg-amber-500/30 cursor-pointer"
            >
              Sync Now
            </button>
          )}
        </div>
      )}

      {!activeTrip ? (
        <div className="glass-panel rounded-xl p-8 text-center space-y-4 border border-slate-800">
          <div className="inline-flex p-5 bg-slate-900 border border-slate-800 rounded-full text-slate-500">
            <ShieldCheck size={40} className="opacity-40" />
          </div>
          <h2 className="text-base font-bold text-slate-200">No Active Dispatch</h2>
          <p className="text-xs text-slate-500 leading-relaxed">
            You need an active trip before recording fuel. Once a dispatch is assigned, this screen will
            pre-fill your vehicle, trip and company automatically.
          </p>
          <Link to="/driver-trip" className="inline-flex text-xs font-bold text-accent-indigo hover:underline">
            Go to My Trips →
          </Link>
        </div>
      ) : (
        <>
          {/* Active trip context */}
          <div className="glass-panel rounded-xl p-4 border border-slate-800 bg-slate-900/80 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Active Dispatch</span>
              <Link to={`/trips/${activeTrip.id}`} className="text-[10px] font-bold text-accent-indigo hover:underline">Trip #{activeTrip.id}</Link>
            </div>
            <p className="text-sm font-bold text-slate-200">{activeTrip.pickupLocation} → {activeTrip.destination}</p>
            <div className="flex flex-wrap gap-x-4 gap-y-1 text-[10px] text-slate-500">
              <span>{activeTrip.material} · {activeTrip.weight} T</span>
              <span>{activeTrip.distance} km</span>
            </div>
            {activeTrip.estimatedFuelLiters > 0 && (
              <div className="p-2.5 rounded-lg bg-indigo-500/5 border border-indigo-500/15 text-[11px] text-slate-300 mt-1">
                <span className="font-bold text-indigo-300">Estimated fuel for this trip:</span>{' '}
                {Number(activeTrip.estimatedFuelLiters).toFixed(1)} L · ₹{Number(activeTrip.estimatedFuelCost || 0).toLocaleString('en-IN')}
              </div>
            )}
          </div>

          {/* Fuel entry — floating modal triggered by its own button */}
          <div className="flex justify-center">
            <FuelEntryForm trip={activeTrip} onSaved={() => setSyncMsg('')} />
          </div>

          {/* Trip fuel timeline */}
          <div className="glass-panel rounded-xl p-5 border border-slate-800 space-y-3">
            <h2 className="text-sm font-bold text-slate-100 font-display">Refill History</h2>
            <FuelTimeline entries={activeTrip.fuelEntries || []} />
          </div>
        </>
      )}
    </div>
  );
};

export default DriverFuelLog;
