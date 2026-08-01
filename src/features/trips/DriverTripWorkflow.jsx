import React, { useMemo, useState } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { useTrips, useUpdateTrip, useDrivers, useVehicles } from '../../services/services';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import MapContainer from '../../components/common/MapContainer';
import CreateDispatchForm from './CreateDispatchForm';
import { 
  Camera, 
  ShieldCheck, 
  Upload, 
  Play, 
  CheckCircle2, 
  Info,
  PlusCircle,
  ExternalLink
} from 'lucide-react';

export const DriverTripWorkflow = () => {
  const navigate = useNavigate();
  const { activeDriverId } = useSelector((state) => state.auth);
  
  const { data: trips, isLoading } = useTrips();
  const { data: drivers } = useDrivers();
  const { data: vehicles } = useVehicles();
  const updateTripMutation = useUpdateTrip();

  // Toggle for the always-available create & dispatch panel
  const [dispatchOpen, setDispatchOpen] = useState(false);
  const [dispatchSuccess, setDispatchSuccess] = useState(null);

  // Inputs for start/end workflow
  const [startOdo, setStartOdo] = useState('');
  const [endOdo, setEndOdo] = useState('');
  const [pickupPhotoSim, setPickupPhotoSim] = useState(false);
  const [deliveryPhotoSim, setDeliveryPhotoSim] = useState(false);
  const [podPhotoSim, setPodPhotoSim] = useState(false);

  // Error validations
  const [formError, setFormError] = useState('');

  // Find active running/assigned trip for this driver
  const activeTrip = useMemo(() => {
    if (!trips) return null;
    return trips.find(t => t.driverId === activeDriverId && ['Assigned', 'Running', 'Delivered'].includes(t.status));
  }, [trips, activeDriverId]);

  const currentDriver = useMemo(
    () => (drivers || []).find(d => d.id === activeDriverId),
    [drivers, activeDriverId]
  );

  const assignedVehicle = useMemo(
    () => (vehicles || []).find(v => v.number === currentDriver?.assignedVehicle),
    [vehicles, currentDriver]
  );

  const dispatchProps = useMemo(() => ({
    lockedVehicle: assignedVehicle,
    lockedDriver: currentDriver,
    onDispatched: (created) => {
      setDispatchSuccess(created);
      setDispatchOpen(false);
    }
  }), [assignedVehicle, currentDriver]);

  const handleAccept = () => {
    if (!activeTrip) return;
    updateTripMutation.mutate({
      id: activeTrip.id,
      data: { status: 'Running', remarks: 'Trip accepted by driver. Moving to loading point.' }
    });
  };

  const handleStartTrip = () => {
    if (!activeTrip) return;
    if (!startOdo || isNaN(startOdo) || Number(startOdo) <= 0) {
      setFormError('Please enter a valid starting odometer reading.');
      return;
    }
    if (!pickupPhotoSim) {
      setFormError('Please capture/upload the pickup cargo inspection photo.');
      return;
    }

    setFormError('');
    updateTripMutation.mutate({
      id: activeTrip.id,
      data: { 
        remarks: 'Cargo loaded. Transit in progress.',
        startOdometer: Number(startOdo),
        pickupPhoto: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=400&q=80',
        currentLocation: { lat: 18.90, lng: 73.50 }, // starts driving
        speed: 60
      }
    });
  };

  const handleCompleteTrip = () => {
    if (!activeTrip) return;
    if (!endOdo || isNaN(endOdo) || Number(endOdo) <= Number(activeTrip.startOdometer)) {
      setFormError(`Ending odometer must be greater than starting odometer (${activeTrip.startOdometer} km).`);
      return;
    }
    if (!deliveryPhotoSim || !podPhotoSim) {
      setFormError('Please upload both the delivery cargo photo and the signed Proof of Delivery (POD) document.');
      return;
    }

    setFormError('');
    updateTripMutation.mutate({
      id: activeTrip.id,
      data: {
        status: 'Completed',
        remarks: 'Cargo successfully delivered. Consignment closed.',
        endOdometer: Number(endOdo),
        deliveryPhoto: 'https://images.unsplash.com/photo-1578575437130-527eed3abbec?auto=format&fit=crop&w=400&q=80',
        podPhoto: 'https://images.unsplash.com/photo-1554415707-6e8cfc93fe23?auto=format&fit=crop&w=400&q=80'
      }
    }, {
      onSuccess: () => {
        // Reset inputs
        setStartOdo('');
        setEndOdo('');
        setPickupPhotoSim(false);
        setDeliveryPhotoSim(false);
        setPodPhotoSim(false);
      }
    });
  };

  if (isLoading) {
    return <div className="h-64 flex items-center justify-center text-slate-500">Loading driver portal...</div>;
  }

  // State: No active trip assigned
  if (!activeTrip) {
    return (
      <div className="max-w-lg mx-auto py-12 space-y-8 select-none">
        {/* Standby header */}
        <div className="text-center space-y-3">
          <div className="inline-flex p-5 bg-slate-900 border border-slate-800 rounded-full text-slate-500 mb-1">
            <ShieldCheck size={48} className="opacity-40" />
          </div>
          <h2 className="text-xl font-bold font-display text-slate-200">No Active Dispatch</h2>
          <p className="text-sm text-slate-500 leading-relaxed max-w-sm mx-auto">
            You are on standby. Create a consignment dispatch below — it syncs instantly to the Control Console and dispatch desk.
          </p>
        </div>

        {/* Create & Dispatch Trip panel */}
        <div className="glass-panel rounded-xl p-6 border border-slate-800 space-y-5 bg-slate-900/60">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-indigo-500/15 rounded-lg text-accent-indigo">
              <PlusCircle size={18} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-100 font-display">Create & Dispatch Trip</h3>
              <p className="text-[10px] text-slate-500">Self-service consignment registration on your assigned vehicle</p>
            </div>
          </div>

          <CreateDispatchForm {...dispatchProps} />
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto space-y-6 select-none pb-12">
      {/* Active Trip Header */}
      <div className="glass-panel rounded-xl p-4 border border-slate-800 flex items-center justify-between bg-slate-900/80">
        <div>
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block">ACTIVE RUN LOG</span>
          <h2 className="text-lg font-bold text-slate-200 font-display mt-0.5">{activeTrip.id}</h2>
        </div>
        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wide ${
          activeTrip.status === 'Assigned' ? 'bg-indigo-500/20 text-accent-indigo' : 'bg-sky-500/20 text-accent-sky'
        }`}>
          {activeTrip.status === 'Assigned' ? 'Pending Accept' : 'In Transit'}
        </span>
      </div>

      {/* Dispatch success confirmation, synced with the Control Console */}
      {dispatchSuccess && (
        <div className="glass-panel rounded-xl p-4 border border-emerald-500/30 bg-emerald-500/5 space-y-2">
          <div className="flex items-center gap-2 text-accent-emerald">
            <CheckCircle2 size={16} />
            <span className="text-xs font-bold uppercase tracking-wide">Dispatch Created & Synced</span>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed">
            Trip <strong className="text-slate-100">{dispatchSuccess.id}</strong> ({dispatchSuccess.pickupLocation} → {dispatchSuccess.destination}) is now live on the Control Console, Trip Registry and fleet map.
          </p>
          <button
            type="button"
            onClick={() => navigate(`/trips/${dispatchSuccess.id}`)}
            className="inline-flex items-center gap-1 text-[11px] font-bold text-accent-indigo hover:text-indigo-300 transition-colors cursor-pointer"
          >
            <ExternalLink size={12} />
            View Trip Details
          </button>
        </div>
      )}

      {/* Always-available Create & Dispatch toggle */}
      <button
        type="button"
        onClick={() => setDispatchOpen(v => !v)}
        className={`w-full flex items-center justify-between p-3 rounded-xl border transition-colors cursor-pointer ${
          dispatchOpen
            ? 'bg-indigo-500/10 border-indigo-500/30 text-accent-indigo'
            : 'bg-slate-900/60 border-slate-800 text-slate-300 hover:border-slate-700'
        }`}
      >
        <span className="flex items-center gap-2 text-xs font-bold">
          <PlusCircle size={16} />
          Create & Dispatch Trip
        </span>
        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
          {dispatchOpen ? 'Close' : 'New Dispatch'}
        </span>
      </button>

      {dispatchOpen && (
        <div className="glass-panel rounded-xl p-6 border border-slate-800 bg-slate-900/60">
          <CreateDispatchForm {...dispatchProps} />
        </div>
      )}

      {/* Driver Step Cards */}
      {activeTrip.status === 'Assigned' && (
        <div className="glass-panel rounded-xl p-6 border border-slate-800 space-y-6">
          <div className="text-center space-y-2">
            <h3 className="text-base font-bold text-slate-100">Accept Transport Order</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Accept the dispatch request to start route loading operations.
            </p>
          </div>

          {/* Consignment summary */}
          <div className="space-y-3.5 border-t border-b border-slate-800 py-4 text-xs">
            <div className="flex justify-between">
              <span className="text-slate-500">Corporate Customer</span>
              <span className="font-bold text-slate-300">{activeTrip.companyName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Route Map</span>
              <span className="font-semibold text-slate-300">{activeTrip.pickupLocation} → {activeTrip.destination}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Consignment Cargo</span>
              <span className="text-slate-300">{activeTrip.material} ({activeTrip.weight} Tons)</span>
            </div>
          </div>

          <Button variant="success" className="w-full flex items-center justify-center gap-2" onClick={handleAccept}>
            <Play size={16} />
            <span>Accept Dispatch</span>
          </Button>
        </div>
      )}

      {/* State 2: Accepted, pending trip load & odometer */}
      {activeTrip.status === 'Running' && !activeTrip.startOdometer && (
        <div className="glass-panel rounded-xl p-6 border border-slate-800 space-y-5">
          <div className="text-center space-y-1">
            <h3 className="text-base font-bold text-slate-100">Cargo Inspection & Start</h3>
            <p className="text-xs text-slate-500">Verify load parameters and capture vehicle metrics.</p>
          </div>

          {formError && (
            <div className="p-3 bg-rose-500/10 border border-rose-500/20 text-[11px] font-semibold text-accent-rose rounded-lg flex items-center gap-2">
              <Info size={14} className="flex-shrink-0" />
              <span>{formError}</span>
            </div>
          )}

          <div className="space-y-4">
            <Input
              label="Starting Odometer Reading (km)"
              placeholder="e.g. 34500"
              type="number"
              value={startOdo}
              onChange={e => setStartOdo(e.target.value)}
            />

            {/* Simulated camera attachment */}
            <div className="space-y-2">
              <span className="text-xs font-semibold text-slate-400 block">Cargo Inspection Photo</span>
              <button
                type="button"
                onClick={() => setPickupPhotoSim(true)}
                className={`w-full py-4 border-2 border-dashed rounded-xl flex flex-col items-center justify-center gap-1.5 transition-colors cursor-pointer ${
                  pickupPhotoSim 
                    ? 'border-emerald-500/40 bg-emerald-500/5 text-accent-emerald' 
                    : 'border-slate-800 hover:border-slate-700 text-slate-500 hover:text-slate-400'
                }`}
              >
                {pickupPhotoSim ? (
                  <>
                    <CheckCircle2 size={24} />
                    <span className="text-xs font-bold">Inspection Photo Saved</span>
                  </>
                ) : (
                  <>
                    <Camera size={24} />
                    <span className="text-xs font-bold">Capture Cargo Load</span>
                    <span className="text-[10px] text-slate-600">(Simulated attachment)</span>
                  </>
                )}
              </button>
            </div>
          </div>

          <Button variant="primary" className="w-full" onClick={handleStartTrip}>
            Start Route
          </Button>
        </div>
      )}

      {/* State 3: Active in transit (Driving) */}
      {activeTrip.status === 'Running' && activeTrip.startOdometer > 0 && (
        <div className="space-y-6">
          {/* Simulated HUD map inside phone layout */}
          <div className="glass-panel border border-slate-800 rounded-xl overflow-hidden shadow-lg p-3">
            <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest pl-1 mb-2 block">
              LIVE POSITION PATH
            </span>
            <MapContainer
              pickup={activeTrip.pickupLocation}
              destination={activeTrip.destination}
              vehicleNumber={activeTrip.vehicleNumber}
              driverName={activeTrip.driverName}
              status={activeTrip.status}
              speed={58}
              eta={activeTrip.eta}
              remainingDistance={activeTrip.remainingDistance}
              className="!h-[240px]"
            />
          </div>

          {/* Delivery form completion card */}
          <div className="glass-panel rounded-xl p-6 border border-slate-800 space-y-5 bg-slate-900/60">
            <div className="text-center space-y-1">
              <h3 className="text-base font-bold text-slate-100">Delivery Registry</h3>
              <p className="text-xs text-slate-500">Record ending parameters and upload contracting paper logs.</p>
            </div>

            {formError && (
              <div className="p-3 bg-rose-500/10 border border-rose-500/20 text-[11px] font-semibold text-accent-rose rounded-lg flex items-center gap-2">
                <Info size={14} className="flex-shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <div className="space-y-4">
              <Input
                label={`Ending Odometer Reading (Start: ${activeTrip.startOdometer} km)`}
                placeholder="e.g. 34650"
                type="number"
                value={endOdo}
                onChange={e => setEndOdo(e.target.value)}
              />

              <div className="grid grid-cols-2 gap-3">
                {/* Simulated delivery photo */}
                <button
                  type="button"
                  onClick={() => setDeliveryPhotoSim(true)}
                  className={`py-3 border border-dashed rounded-xl flex flex-col items-center justify-center gap-1.5 transition-colors cursor-pointer ${
                    deliveryPhotoSim 
                      ? 'border-emerald-500/40 bg-emerald-500/5 text-accent-emerald' 
                      : 'border-slate-800 hover:border-slate-700 text-slate-500'
                  }`}
                >
                  {deliveryPhotoSim ? <CheckCircle2 size={18} /> : <Camera size={18} />}
                  <span className="text-[10px] font-bold">Unload Photo</span>
                </button>

                {/* Simulated POD upload */}
                <button
                  type="button"
                  onClick={() => setPodPhotoSim(true)}
                  className={`py-3 border border-dashed rounded-xl flex flex-col items-center justify-center gap-1.5 transition-colors cursor-pointer ${
                    podPhotoSim 
                      ? 'border-emerald-500/40 bg-emerald-500/5 text-accent-emerald' 
                      : 'border-slate-800 hover:border-slate-700 text-slate-500'
                  }`}
                >
                  {podPhotoSim ? <CheckCircle2 size={18} /> : <Upload size={18} />}
                  <span className="text-[10px] font-bold">Upload POD Doc</span>
                </button>
              </div>
            </div>

            <Button variant="success" className="w-full" onClick={handleCompleteTrip}>
              Register Completion
            </Button>
          </div>
        </div>
      )}

    </div>
  );
};

export default DriverTripWorkflow;
