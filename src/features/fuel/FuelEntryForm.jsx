import { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useSelector } from 'react-redux';
import { useVehicles, useDrivers } from '../../services/services';
import { useCreateFuelEntry, useParseFuelReceipt } from '../../services/fuelServices';
import { readOfflineFuelQueue, writeOfflineFuelQueue } from './lib/offlineQueue';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import Select from '../../components/common/Select';
import {
  Info, Camera, CheckCircle2, UploadCloud, MapPin, Fuel, X, Droplets, Loader2, FileText
} from 'lucide-react';

const FUEL_TYPES = ['Diesel', 'Petrol', 'CNG', 'Electric'];
const PAYMENT_METHODS = ['Cash', 'Fleet Card', 'UPI', 'Credit Card', 'Fuel Voucher'];

// ─── Inner form body (pure form, no modal chrome) ─────────────────────────────
const FuelEntryFormInner = ({ trip, lockedVehicle, lockedDriver, onSaved }) => {
  const { activeDriverId } = useSelector((state) => state.auth);
  const { data: vehicles = [] } = useVehicles();
  const { data: drivers = [] } = useDrivers();
  const createFuelEntry = useCreateFuelEntry();
  const parseReceipt = useParseFuelReceipt();

  // Context auto-fill: everything the system already knows is pre-populated.
  const context = useMemo(() => {
    const vehicle =
      lockedVehicle ||
      (trip?.vehicleId ? vehicles.find((v) => v.id === trip.vehicleId) : null);
    const driver =
      lockedDriver ||
      (trip?.driverId ? drivers.find((d) => d.id === trip.driverId) : null) ||
      drivers.find((d) => String(d.id) === String(activeDriverId));
    return { vehicle, driver };
  }, [trip, lockedVehicle, lockedDriver, vehicles, drivers, activeDriverId]);

  const [quantity, setQuantity] = useState('');
  const [unitPrice, setUnitPrice] = useState('');
  const [stationName, setStationName] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('Cash');
  const [fuelType, setFuelType] = useState('Diesel');
  const [odometer, setOdometer] = useState('');
  const [remarks, setRemarks] = useState('');
  const [receipt, setReceipt] = useState(null);
  const [receiptPath, setReceiptPath] = useState(null);
  const [scanStep, setScanStep] = useState(null);
  const [gps, setGps] = useState(null);
  const [gpsLoading, setGpsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [offlineQueued, setOfflineQueued] = useState(0);

  // ✅ FIXED: vehicle-sync moved to useEffect (was causing infinite re-renders
  // because setState was called directly in the render body).
  useEffect(() => {
    if (context.vehicle?.id) {
      setFuelType(context.vehicle.fuelType || 'Diesel');
      if (context.vehicle.lastOdometer) {
        setOdometer((prev) => prev || String(context.vehicle.lastOdometer));
      }
    }
  }, [context.vehicle?.id]); // eslint-disable-line react-hooks/exhaustive-deps

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
    if (file) {
      setReceipt(file);
      setScanStep('Reading');
      setError('');
      setSuccess('');
      
      const formData = new FormData();
      formData.append('receipt', file);
      
      parseReceipt.mutate(formData, {
        onSuccess: (data) => {
          setScanStep('Extracting');
          setTimeout(() => {
            if (data.quantity) setQuantity(String(data.quantity));
            if (data.unitPrice) setUnitPrice(String(data.unitPrice));
            if (data.stationName) setStationName(data.stationName);
            if (data.odometer) setOdometer(String(data.odometer));
            if (data.receiptPath) setReceiptPath(data.receiptPath);
            
            setScanStep('Ready');
            setSuccess('Receipt scanned! Please review the auto-filled data.');
            setTimeout(() => setScanStep(null), 3000);
          }, 800);
        },
        onError: (err) => {
          setScanStep(null);
          setError('Failed to scan receipt. Please enter details manually.');
        }
      });
    }
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
    receipt_path: receiptPath || null,
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
    setReceiptPath(null);
    setScanStep(null);
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
    // Need at least a trip OR a vehicle to save
    if (!trip && !context.vehicle) {
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
        // Show server validation errors if available
        if (err.serverErrors) {
          const msgs = Object.values(err.serverErrors).flat();
          setError(msgs.join(' ') || err.message || 'Failed to save the fuel entry.');
        } else {
          setError(err.message || 'Failed to save the fuel entry.');
        }
      },
    });
  };

  const pendingCount = offlineQueued || readOfflineFuelQueue().length;

  return (
    <div className="space-y-4">
      {success && (
        <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-xs font-semibold text-emerald-400 rounded-lg flex items-center gap-2">
          <CheckCircle2 size={14} className="flex-shrink-0" />
          <span>{success}</span>
        </div>
      )}
      {error && (
        <div className="p-3 bg-rose-500/10 border border-rose-500/20 text-xs font-semibold text-rose-400 rounded-lg flex items-center gap-2">
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

      {/* Receipt + GPS capture */}
      <div className="space-y-1.5">
        <span className="text-xs font-semibold text-slate-400 block">Fuel Receipt &amp; Location</span>
        <div className="grid grid-cols-2 gap-3">
          <label
            className={`relative border-2 border-dashed rounded-xl py-4 flex flex-col items-center justify-center gap-1.5 cursor-pointer transition-colors ${
              parseReceipt.isPending || scanStep === 'Extracting'
                ? 'border-indigo-500/40 bg-indigo-500/5 text-indigo-400'
                : receipt
                ? 'border-emerald-500/40 bg-emerald-500/5 text-emerald-400'
                : 'border-slate-800 hover:border-slate-700 text-slate-500'
            }`}
          >
            <input type="file" accept="image/*" capture="environment" className="hidden" onChange={handleReceipt} />
            {parseReceipt.isPending || scanStep === 'Extracting' ? (
              <>
                <Loader2 size={22} className="animate-spin" />
                <span className="text-[11px] font-bold">
                  {parseReceipt.isPending ? 'Reading Receipt...' : 'Extracting Data...'}
                </span>
              </>
            ) : receipt ? (
              <>
                <CheckCircle2 size={22} />
                <span className="text-[11px] font-bold">Receipt Scanned</span>
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
            className={`relative border-2 border-dashed rounded-xl py-4 flex flex-col items-center justify-center gap-1.5 transition-colors cursor-pointer ${
              gps
                ? 'border-emerald-500/40 bg-emerald-500/5 text-emerald-400'
                : 'border-slate-800 hover:border-slate-700 text-slate-500'
            }`}
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

      {/* Large mobile-first quantity input */}
      <div className="space-y-2">
        <span className="text-xs font-semibold text-slate-400 block">Fuel Quantity (Liters) *</span>
        <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-900 border border-slate-800 focus-within:border-indigo-500 transition-colors">
          <Fuel size={22} className="text-amber-400 flex-shrink-0" />
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
          <div className="w-full bg-slate-800/50 border border-slate-800 rounded-lg py-2 px-3 text-sm font-bold font-mono text-emerald-400 h-[38px] flex items-center">
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
        <div className="p-3 bg-amber-500/10 border border-amber-500/20 text-xs font-semibold text-amber-400 rounded-lg flex items-center gap-2">
          <Info size={14} />
          <span>
            {pendingCount} fuel entr{pendingCount === 1 ? 'y' : 'ies'} waiting in the offline queue — will sync automatically.
          </span>
        </div>
      )}
    </div>
  );
};

// ─── Floating modal wrapper ───────────────────────────────────────────────────
// Usage: <FuelEntryForm trip={trip} onSaved={...} />
// The component manages its own open/close state with a trigger button.
// Pass `defaultOpen={true}` to open immediately (e.g. from DriverFuelLog).
export const FuelEntryForm = ({ trip, lockedVehicle, lockedDriver, onSaved, defaultOpen = false }) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  const handleSaved = () => {
    if (onSaved) onSaved();
    setIsOpen(false);
  };

  return (
    <>
      {/* Trigger button — shown when form is closed */}
      {!isOpen && (
        <motion.button
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          onClick={() => setIsOpen(true)}
          className="flex items-center gap-2.5 px-4 py-2.5 rounded-xl bg-amber-500/10 border border-amber-500/25 text-amber-400 hover:bg-amber-500/15 hover:border-amber-500/40 transition-all text-sm font-bold cursor-pointer"
        >
          <Droplets size={16} />
          Log Fuel Entry
        </motion.button>
      )}

      {/* Floating modal */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              key="fuel-backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 z-40 bg-slate-950/75 backdrop-blur-sm"
            />

            {/* Panel — slides up from bottom on mobile, centers on desktop */}
            <motion.div
              key="fuel-panel"
              initial={{ opacity: 0, y: 60, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 40, scale: 0.97 }}
              transition={{ type: 'spring', damping: 28, stiffness: 360 }}
              className="fixed bottom-0 left-0 right-0 sm:inset-0 sm:flex sm:items-center sm:justify-center z-50 p-0 sm:p-4"
            >
              <div className="relative w-full sm:max-w-lg bg-[#0e1320] border border-slate-800 rounded-t-2xl sm:rounded-2xl shadow-2xl flex flex-col max-h-[90vh]">
                {/* Modal header */}
                <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800/80 bg-slate-900/40 rounded-t-2xl">
                  <div className="flex items-center gap-2.5">
                    <div className="p-1.5 rounded-lg bg-amber-500/10">
                      <Droplets size={16} className="text-amber-400" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-slate-100">Log Fuel Entry</h3>
                      {trip && (
                        <p className="text-[10px] text-slate-500 font-semibold">Trip #{trip.id}</p>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => setIsOpen(false)}
                    className="text-slate-400 hover:text-slate-200 hover:bg-slate-800 p-1.5 rounded-lg transition-colors cursor-pointer"
                  >
                    <X size={18} />
                  </button>
                </div>

                {/* Scrollable form body */}
                <div className="flex-1 overflow-y-auto px-5 py-5">
                  <FuelEntryFormInner
                    trip={trip}
                    lockedVehicle={lockedVehicle}
                    lockedDriver={lockedDriver}
                    onSaved={handleSaved}
                  />
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
};

export default FuelEntryForm;
