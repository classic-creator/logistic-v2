import { useMemo, useState } from 'react';
import { useSelector } from 'react-redux';
import { useVehicles, useDrivers } from '../../services/services';
import { useCreateFuelEntry } from '../../services/fuelServices';
import { readOfflineFuelQueue, writeOfflineFuelQueue } from './lib/offlineQueue';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import Select from '../../components/common/Select';
import { Info, Camera, CheckCircle2, UploadCloud, MapPin, Fuel } from 'lucide-react';

const FUEL_TYPES = ['Diesel', 'Petrol', 'CNG', 'Electric'];
const PAYMENT_METHODS = ['Cash', 'Fleet Card', 'UPI', 'Credit Card', 'Fuel Voucher'];

export const FuelEntryForm = ({ trip, lockedVehicle, lockedDriver, onSaved, className = '' }) => {
  const { activeDriverId } = useSelector((state) => state.auth);
  const { data: vehicles = [] } = useVehicles();
  const { data: drivers = [] } = useDrivers();
  const createFuelEntry = useCreateFuelEntry();

  // Context auto-fill: everything the system already knows is pre-populated.
  const context = useMemo(() => {
    const vehicle = lockedVehicle
      || (trip?.vehicleId ? vehicles.find((v) => v.id === trip.vehicleId) : null);
    const driver = lockedDriver
      || (trip?.driverId ? drivers.find((d) => d.id === trip.driverId) : null)
      || drivers.find((d) => d.id === activeDriverId);
    return { vehicle, driver };
  }, [trip, lockedVehicle, lockedDriver, vehicles, drivers, activeDriverId]);

  const [quantity, setQuantity] = useState('');
  const [unitPrice, setUnitPrice] = useState('');
  const [stationName, setStationName] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('Cash');
  const [fuelType, setFuelType] = useState(context.vehicle?.fuelType || 'Diesel');
  const [odometer, setOdometer] = useState('');
  const [remarks, setRemarks] = useState('');
  const [receipt, setReceipt] = useState(null);
  const [gps, setGps] = useState(null);
  const [gpsLoading, setGpsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [offlineQueued, setOfflineQueued] = useState(0);

  // Sync form defaults when the linked vehicle changes (render-time derived state).
  const [prevVehicleId, setPrevVehicleId] = useState(null);
  if (context.vehicle?.id !== prevVehicleId) {
    setPrevVehicleId(context.vehicle?.id ?? null);
    if (context.vehicle?.id) {
      setFuelType(context.vehicle.fuelType || 'Diesel');
      if (!odometer && context.vehicle.lastOdometer) {
        setOdometer(context.vehicle.lastOdometer);
      }
    }
  }

  const isOnline = typeof navigator !== 'undefined' ? navigator.onLine : true;
  const totalCost = (Number(quantity) || 0) * (Number(unitPrice) || 0);

  const captureLocation = () => {
    setGpsLoading(true);
    setError('');
    if (!navigator.geolocation) {
      setGpsLoading(false);
      setError('GPS is not available on this device.');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setGps({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setGpsLoading(false);
      },
      () => {
        setGpsLoading(false);
        setGps(null);
        setError('Could not fetch GPS location. Please try again or skip.');
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  };

  const handleReceipt = (e) => {
    const file = e.target.files?.[0];
    if (file) setReceipt(file);
  };

  const buildPayload = () => ({
    tripId: trip?.id || null,
    vehicleId: context.vehicle?.id || null,
    driverId: context.driver?.id || null,
    companyId: trip?.companyId || null,
    fuelType,
    quantity: Number(quantity),
    unitPrice: Number(unitPrice) || null,
    totalCost: totalCost > 0 ? Math.round(totalCost * 100) / 100 : null,
    odometer: odometer ? Number(odometer) : null,
    stationName: stationName || null,
    paymentMethod,
    remarks: remarks || null,
    latitude: gps?.lat ?? null,
    longitude: gps?.lng ?? null,
    filledAt: new Date().toISOString(),
  });

  const reset = () => {
    setQuantity('');
    setUnitPrice('');
    setStationName('');
    setPaymentMethod('Cash');
    setOdometer('');
    setRemarks('');
    setReceipt(null);
    setGps(null);
    setError('');
    setSuccess('');
  };

  const handleSubmit = () => {
    setError('');
    setSuccess('');

    if (!Number(quantity) || Number(quantity) <= 0) {
      setError('Enter the fuel quantity filled in liters.');
      return;
    }
    if (!Number(unitPrice) || Number(unitPrice) <= 0) {
      setError('Enter the fuel price per liter.');
      return;
    }
    if (!context.vehicle && !trip) {
      setError('No vehicle is linked. Please add fuel from an assigned trip.');
      return;
    }

    const payload = buildPayload();

    if (!isOnline) {
      const queue = readOfflineFuelQueue();
      queue.push({ ...payload, id: `offline-${Date.now()}`, queuedAt: new Date().toISOString() });
      writeOfflineFuelQueue(queue);
      setOfflineQueued(queue.length);
      setSuccess('Saved offline. It will auto-sync when you are back online.');
      reset();
      return;
    }

    createFuelEntry.mutate(payload, {
      onSuccess: () => {
        setSuccess('Fuel entry recorded and synced to the system.');
        reset();
        if (onSaved) onSaved();
      },
      onError: (err) => {
        setError(err.message || 'Failed to save the fuel entry.');
      },
    });
  };

  const pendingCount = offlineQueued || readOfflineFuelQueue().length;

  return (
    <div className={`space-y-4 ${className}`}>
      {success && (
        <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-xs font-semibold text-accent-emerald rounded-lg flex items-center gap-2">
          <CheckCircle2 size={14} className="flex-shrink-0" />
          <span>{success}</span>
        </div>
      )}
      {error && (
        <div className="p-3 bg-rose-500/10 border border-rose-500/20 text-xs font-semibold text-accent-rose rounded-lg flex items-center gap-2">
          <Info size={14} className="flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Auto-filled context banner */}
      <div className="grid grid-cols-2 gap-2 text-[11px]">
        <div className="p-2.5 rounded-lg bg-slate-900/80 border border-slate-800">
          <span className="text-slate-500 font-bold uppercase tracking-wider block text-[9px]">Vehicle</span>
          <span className="font-bold text-slate-200">{context.vehicle?.number || trip?.vehicleNumber || '—'}</span>
        </div>
        <div className="p-2.5 rounded-lg bg-slate-900/80 border border-slate-800">
          <span className="text-slate-500 font-bold uppercase tracking-wider block text-[9px]">Driver</span>
          <span className="font-bold text-slate-200">{context.driver?.name || trip?.driverName || '—'}</span>
        </div>
        {trip && (
          <div className="col-span-2 p-2.5 rounded-lg bg-indigo-500/5 border border-indigo-500/15">
            <span className="text-slate-500 font-bold uppercase tracking-wider block text-[9px]">Active Trip</span>
            <span className="font-bold text-indigo-300">#{trip.id} · {trip.pickupLocation} → {trip.destination}</span>
          </div>
        )}
      </div>

      {/* Large mobile-first quantity input */}
      <div className="space-y-2">
        <span className="text-xs font-semibold text-slate-400 block">Fuel Quantity (Liters) *</span>
        <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-900 border border-slate-800 focus-within:border-accent-indigo">
          <Fuel size={22} className="text-accent-amber flex-shrink-0" />
          <input
            type="number"
            inputMode="decimal"
            min="0"
            placeholder="e.g. 100"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            className="w-full bg-transparent text-2xl font-extrabold text-slate-100 placeholder-slate-600 outline-none font-mono"
          />
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Liters</span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Input
          label="Price / Liter (₹)"
          type="number"
          inputMode="decimal"
          placeholder="e.g. 92.00"
          value={unitPrice}
          onChange={(e) => setUnitPrice(e.target.value)}
        />
        <div>
          <span className="text-xs font-semibold text-slate-400 block mb-1.5">Total Cost (₹)</span>
          <div className="w-full bg-slate-800/50 border border-slate-800 rounded-lg py-2 px-3 text-sm font-bold font-mono text-accent-emerald h-[38px] flex items-center">
            {totalCost > 0 ? `₹${totalCost.toLocaleString('en-IN')}` : '—'}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Select
          label="Fuel Type"
          options={FUEL_TYPES}
          value={fuelType}
          onChange={(e) => setFuelType(e.target.value)}
        />
        <Select
          label="Payment Method"
          options={PAYMENT_METHODS}
          value={paymentMethod}
          onChange={(e) => setPaymentMethod(e.target.value)}
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Input
          label="Current Odometer (km)"
          type="number"
          inputMode="numeric"
          placeholder="e.g. 35400"
          value={odometer}
          onChange={(e) => setOdometer(e.target.value)}
        />
        <Input
          label="Fuel Station"
          placeholder="e.g. IOCL Pune"
          value={stationName}
          onChange={(e) => setStationName(e.target.value)}
        />
      </div>

      {/* Receipt capture */}
      <div className="space-y-1.5">
        <span className="text-xs font-semibold text-slate-400 block">Fuel Receipt</span>
        <div className="grid grid-cols-2 gap-3">
          <label className={`relative border-2 border-dashed rounded-xl py-4 flex flex-col items-center justify-center gap-1.5 cursor-pointer transition-colors ${receipt ? 'border-emerald-500/40 bg-emerald-500/5 text-accent-emerald' : 'border-slate-800 hover:border-slate-700 text-slate-500'}`}>
            <input type="file" accept="image/*" capture="environment" className="hidden" onChange={handleReceipt} />
            {receipt ? (
              <>
                <CheckCircle2 size={22} />
                <span className="text-[11px] font-bold">Receipt Captured</span>
              </>
            ) : (
              <>
                <Camera size={22} />
                <span className="text-[11px] font-bold">Capture Receipt</span>
              </>
            )}
          </label>
          <button
            type="button"
            onClick={captureLocation}
            className={`relative border-2 border-dashed rounded-xl py-4 flex flex-col items-center justify-center gap-1.5 transition-colors cursor-pointer ${gps ? 'border-emerald-500/40 bg-emerald-500/5 text-accent-emerald' : 'border-slate-800 hover:border-slate-700 text-slate-500'}`}
          >
            {gpsLoading ? (
              <span className="h-5 w-5 border-2 border-slate-600 border-t-slate-200 rounded-full animate-spin" />
            ) : gps ? (
              <CheckCircle2 size={22} />
            ) : (
              <MapPin size={22} />
            )}
            <span className="text-[11px] font-bold">{gps ? 'Location Captured' : 'Add GPS Location'}</span>
          </button>
        </div>
      </div>

      <Input
        label="Remarks"
        placeholder="Optional notes"
        value={remarks}
        onChange={(e) => setRemarks(e.target.value)}
      />

      <Button
        variant="success"
        size="lg"
        className="w-full text-base py-3.5"
        onClick={handleSubmit}
        isLoading={createFuelEntry.isPending}
      >
        <UploadCloud size={18} />
        {isOnline ? 'Save Fuel Entry' : 'Save Offline'}
      </Button>

      {!isOnline && pendingCount > 0 && (
        <div className="p-3 bg-amber-500/10 border border-amber-500/20 text-xs font-semibold text-accent-amber rounded-lg flex items-center gap-2">
          <Info size={14} />
          <span>{pendingCount} fuel entr{pendingCount === 1 ? 'y' : 'ies'} waiting in the offline queue — will sync automatically.</span>
        </div>
      )}
    </div>
  );
};

export default FuelEntryForm;
