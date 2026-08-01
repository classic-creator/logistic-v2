import { useCallback, useMemo, useState } from 'react';
import { useCompanies, useDrivers, useVehicles, useCreateTrip } from '../../services/services';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import Select from '../../components/common/Select';
import { Info, Send, Navigation, Truck } from 'lucide-react';
import { CITIES, MATERIALS, ROUTE_DISTANCES } from './routeConstants';
import {
  GoogleTripRoutePicker,
  RouteSummary,
} from '../../components/common/GoogleRouteMap';
import { GOOGLE_MAPS_API_KEY } from '../../components/common/googleMapsConfig';

const cityOptions = CITIES.map(c => ({ value: c, label: c }));
const materialOptions = MATERIALS.map(m => ({ value: m, label: m }));

export const CreateDispatchForm = ({ lockedVehicle, lockedDriver, onDispatched }) => {
  const { data: companies } = useCompanies();
  const { data: drivers } = useDrivers();
  const { data: vehicles } = useVehicles();
  const createTripMutation = useCreateTrip();

  const [companyId, setCompanyId] = useState('');
  const [pickupLocation, setPickupLocation] = useState('');
  const [destination, setDestination] = useState('');
  const [pickupPlace, setPickupPlace] = useState(null);
  const [destinationPlace, setDestinationPlace] = useState(null);
  const [googleRoute, setGoogleRoute] = useState(null);
  const [material, setMaterial] = useState('');
  const [weight, setWeight] = useState('');
  const [distanceInput, setDistanceInput] = useState('');
  const [durationInput, setDurationInput] = useState('');
  const [notes, setNotes] = useState('');
  const [vehicleId, setVehicleId] = useState(lockedVehicle?.id || '');
  const [driverId, setDriverId] = useState(lockedDriver?.id || '');
  const [error, setError] = useState('');

  const companyOptions = useMemo(
    () => (companies || []).map(c => ({ value: c.id, label: c.name })),
    [companies]
  );
  const vehicleOptions = useMemo(
    () => (vehicles || []).map(v => ({ value: v.id, label: `${v.number} (${v.type})` })),
    [vehicles]
  );
  const driverOptions = useMemo(
    () => (drivers || []).map(d => ({ value: d.id, label: d.name })),
    [drivers]
  );

  const computedDistance = useMemo(() => {
    if (!pickupLocation || !destination || pickupLocation === destination) return null;
    return ROUTE_DISTANCES[`${pickupLocation}|${destination}`] ||
      ROUTE_DISTANCES[`${destination}|${pickupLocation}`] ||
      380;
  }, [pickupLocation, destination]);

  const recommendedDistance = googleRoute?.distanceKm || computedDistance || 0;
  const recommendedDuration = googleRoute?.durationHours || (recommendedDistance > 0 ? Math.max(1, Math.round(recommendedDistance / 40)) : 0);

  const effectiveDistance = useMemo(
    () => (Number(distanceInput) > 0 ? Number(distanceInput) : recommendedDistance),
    [distanceInput, recommendedDistance]
  );

  const effectiveDuration = useMemo(
    () => (Number(durationInput) > 0 ? Number(durationInput) : recommendedDuration),
    [durationInput, recommendedDuration]
  );

  const handleRouteChange = (field, value) => {
    setDistanceInput('');
    setDurationInput('');
    setGoogleRoute(null);
    if (field === 'pickup') setPickupPlace(null);
    else setDestinationPlace(null);
    if (field === 'pickup') setPickupLocation(value);
    else setDestination(value);
  };

  const handlePickupTextChange = useCallback((value) => {
    setPickupLocation(value);
    setPickupPlace(null);
    setGoogleRoute(null);
    setDistanceInput('');
    setDurationInput('');
  }, []);

  const handleDestinationTextChange = useCallback((value) => {
    setDestination(value);
    setDestinationPlace(null);
    setGoogleRoute(null);
    setDistanceInput('');
    setDurationInput('');
  }, []);

  const handlePickupSelect = useCallback((place) => {
    setPickupPlace(place);
    setPickupLocation(place.address);
  }, []);

  const handleDestinationSelect = useCallback((place) => {
    setDestinationPlace(place);
    setDestination(place.address);
  }, []);

  const handleGoogleRoute = useCallback((route) => {
    setGoogleRoute(route);
    if (route) {
      setDistanceInput('');
      setDurationInput('');
    }
  }, []);

  const handleSubmit = () => {
    setError('');

    if (!companyId || !pickupLocation || !destination || !material) {
      setError('Please fill in the customer, route and consignment details.');
      return;
    }
    if (GOOGLE_MAPS_API_KEY && (!pickupPlace?.location || !destinationPlace?.location)) {
      setError('Select both trip start and destination from the Google Maps suggestions.');
      return;
    }
    if (pickupLocation === destination) {
      setError('Pickup and destination cities must be different.');
      return;
    }
    if (!weight || isNaN(weight) || Number(weight) <= 0) {
      setError('Please enter a valid consignment weight in tons.');
      return;
    }

    const selectedCompany = (companies || []).find(c => c.id === companyId);
    const selectedVehicle = lockedVehicle || (vehicles || []).find(v => v.id === vehicleId);
    const selectedDriver = lockedDriver || (drivers || []).find(d => d.id === driverId);

    if (!selectedCompany || !selectedVehicle || !selectedDriver) {
      setError('Please select a company, vehicle and driver.');
      return;
    }

    const dist = effectiveDistance > 0 ? effectiveDistance : (computedDistance || 380);
    const dur = effectiveDuration > 0 ? effectiveDuration : Math.max(1, Math.round(dist / 40));
    const deliveryDate = new Date(Date.now() + 24 * 3600 * 1000).toISOString().split('T')[0];

    createTripMutation.mutate({
      companyId: selectedCompany.id,
      companyName: selectedCompany.name,
      vehicleId: selectedVehicle.id,
      vehicleNumber: selectedVehicle.number,
      driverId: selectedDriver.id,
      driverName: selectedDriver.name,
      pickupLocation,
      destination,
      pickupCoordinates: pickupPlace?.location || null,
      destinationCoordinates: destinationPlace?.location || null,
      routeSource: googleRoute ? 'Google Maps' : 'City route estimate',
      routeDistanceText: googleRoute?.distanceText || null,
      routeDurationText: googleRoute?.durationText || null,
      material,
      weight: Number(weight),
      distance: dist,
      estimatedDuration: dur,
      deliveryDate,
      remarks: notes || 'Trip created and dispatched from dispatch desk.',
      status: 'Assigned'
    }, {
      onSuccess: (created) => {
        setCompanyId('');
        setPickupLocation('');
        setDestination('');
        setPickupPlace(null);
        setDestinationPlace(null);
        setGoogleRoute(null);
        setMaterial('');
        setWeight('');
        setDistanceInput('');
        setDurationInput('');
        setNotes('');
        setError('');
        if (onDispatched) onDispatched(created);
      }
    });
  };

  return (
    <div className="space-y-4">
      {lockedVehicle && (
        <div className="flex items-center justify-between p-3 rounded-lg bg-slate-900 border border-slate-800 text-xs">
          <div className="flex items-center gap-2">
            <Truck size={16} className="text-accent-sky" />
            <div>
              <span className="font-bold text-slate-200 block">{lockedVehicle.number}</span>
              <span className="text-[10px] text-slate-500">{lockedVehicle.type} • {lockedVehicle.capacity}</span>
            </div>
          </div>
          <span className="text-[10px] font-bold text-slate-400 uppercase">Locked Vehicle</span>
        </div>
      )}

      {error && (
        <div className="p-3 bg-rose-500/10 border border-rose-500/20 text-[11px] font-semibold text-accent-rose rounded-lg flex items-center gap-2">
          <Info size={14} className="flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <Select
        label="Corporate Customer"
        required
        placeholder="Select customer"
        options={companyOptions}
        value={companyId}
        onChange={e => setCompanyId(e.target.value)}
      />

      <div className="grid grid-cols-2 gap-3">
        {GOOGLE_MAPS_API_KEY ? (
          <div className="col-span-2">
            <GoogleTripRoutePicker
              pickup={pickupLocation}
              destination={destination}
              pickupPlace={pickupPlace}
              destinationPlace={destinationPlace}
              onPickupChange={handlePickupTextChange}
              onDestinationChange={handleDestinationTextChange}
              onPickupSelect={handlePickupSelect}
              onDestinationSelect={handleDestinationSelect}
              onRoute={handleGoogleRoute}
            />
            <div className="mt-2">
              <RouteSummary route={googleRoute} />
            </div>
          </div>
        ) : (
          <>
            <Select
              label="Pickup City"
              required
              placeholder="From"
              options={cityOptions}
              value={pickupLocation}
              onChange={e => handleRouteChange('pickup', e.target.value)}
            />
            <Select
              label="Destination"
              required
              placeholder="To"
              options={cityOptions}
              value={destination}
              onChange={e => handleRouteChange('destination', e.target.value)}
            />
            <p className="col-span-2 text-[10px] text-amber-400/80">Google route suggestions are disabled until VITE_GOOGLE_MAPS_API_KEY is configured.</p>
          </>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Select
          label="Material"
          required
          placeholder="Select cargo"
          options={materialOptions}
          value={material}
          onChange={e => setMaterial(e.target.value)}
        />
        <Input
          label="Weight (Tons)"
          required
          placeholder="e.g. 2.0"
          type="number"
          value={weight}
          onChange={e => setWeight(e.target.value)}
        />
      </div>

      {!lockedVehicle && (
        <Select
          label="Assigned Vehicle"
          required
          placeholder="Select vehicle"
          options={vehicleOptions}
          value={vehicleId}
          onChange={e => setVehicleId(e.target.value)}
        />
      )}

      {!lockedDriver && (
        <Select
          label="Assigned Driver"
          required
          placeholder="Select driver"
          options={driverOptions}
          value={driverId}
          onChange={e => setDriverId(e.target.value)}
        />
      )}

      <div className="grid grid-cols-2 gap-3">
        <Input
          label="Distance (km)"
          placeholder={recommendedDistance ? `Google recommends: ${recommendedDistance}` : 'e.g. 300'}
          type="number"
          value={distanceInput}
          onChange={e => setDistanceInput(e.target.value)}
        />
        <Input
          label="Est. Duration (hrs)"
          placeholder={googleRoute?.durationText || (effectiveDistance > 0 ? `Auto: ${Math.max(1, Math.round(effectiveDistance / 40))}` : 'Auto')}
          type="number"
          value={durationInput}
          onChange={e => setDurationInput(e.target.value)}
        />
      </div>

      <Input
        label="Notes"
        placeholder="Optional delivery instructions"
        value={notes}
        onChange={e => setNotes(e.target.value)}
      />

      <Button
        variant="primary"
        className="w-full flex items-center justify-center gap-2"
        onClick={handleSubmit}
        isLoading={createTripMutation.isPending}
      >
        <Send size={16} />
        <span>Dispatch Trip</span>
      </Button>

      <div className="p-3 bg-slate-900/70 border border-slate-800 rounded-lg flex gap-2.5 items-start text-[10px] text-slate-500 leading-relaxed">
        <Navigation size={13} className="text-accent-indigo mt-0.5 flex-shrink-0" />
        <p>Dispatched trips are written to the shared ledger and appear on the <strong className="text-slate-400">Control Console</strong>, <strong className="text-slate-400">Trip Registry</strong> and fleet tracking map in real time.</p>
      </div>
    </div>
  );
};

export default CreateDispatchForm;
