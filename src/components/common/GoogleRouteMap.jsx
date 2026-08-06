import { useCallback, useEffect, useRef, useState } from 'react';
import {
  APIProvider,
  AdvancedMarker,
  Map,
  Pin,
  Polyline,
  useMap,
  useMapsLibrary,
} from '@vis.gl/react-google-maps';
import { Clock3, MapPin, Navigation, Route, Search, Zap } from 'lucide-react';
import { CITY_COORDINATES, GOOGLE_MAPS_API_KEY, GOOGLE_MAPS_MAP_ID } from './googleMapsConfig';

const INDIA_CENTER = { lat: 20.5937, lng: 78.9629 };

const toLatLngLiteral = (location) => {
  if (!location) return null;
  if (typeof location.lat === 'function') return { lat: location.lat(), lng: location.lng() };
  return { lat: Number(location.lat), lng: Number(location.lng) };
};

const formatDuration = (hours) => {
  if (!hours) return '—';
  const roundedHours = Math.floor(hours);
  const minutes = Math.round((hours - roundedHours) * 60);
  if (roundedHours === 0) return `${minutes} min`;
  return minutes ? `${roundedHours}h ${minutes}m` : `${roundedHours}h`;
};

export const PlaceAutocomplete = ({
  label,
  value,
  placeholder,
  onChange,
  onPlaceSelect,
  accent = 'indigo',
}) => {
  const inputRef = useRef(null);
  const placesLibrary = useMapsLibrary('places');

  useEffect(() => {
    if (!placesLibrary || !inputRef.current) return undefined;

    const autocomplete = new placesLibrary.Autocomplete(inputRef.current, {
      fields: ['formatted_address', 'geometry', 'name', 'place_id'],
      componentRestrictions: { country: ['in'] },
    });

    const listener = autocomplete.addListener('place_changed', () => {
      const place = autocomplete.getPlace();
      const location = toLatLngLiteral(place.geometry?.location);
      if (!location) return;

      const address = place.formatted_address || place.name || '';
      onChange(address);
      onPlaceSelect({
        address,
        placeId: place.place_id || '',
        location,
      });
    });

    return () => listener?.remove();
  }, [onChange, onPlaceSelect, placesLibrary]);

  const ring = accent === 'emerald' ? 'focus-within:border-emerald-400/70 focus-within:ring-emerald-400/10' : 'focus-within:border-indigo-400/70 focus-within:ring-indigo-400/10';

  return (
    <label className="block min-w-0">
      <span className="mb-1.5 block text-[10px] font-extrabold uppercase tracking-wider text-slate-500">{label}</span>
      <span className={`flex items-center gap-2 rounded-lg border border-slate-800 bg-slate-950/80 px-3 transition-all ring-2 ring-transparent ${ring}`}>
        <Search size={14} className={accent === 'emerald' ? 'text-emerald-400' : 'text-indigo-400'} />
        <input
          ref={inputRef}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          className="h-10 min-w-0 flex-1 bg-transparent text-xs font-semibold text-slate-200 outline-none placeholder:text-slate-600"
          autoComplete="off"
        />
      </span>
    </label>
  );
};

const RouteDirections = ({ start, destination, onRoute, currentLocation }) => {
  const map = useMap();
  const routesLibrary = useMapsLibrary('routes');
  const [directionsRoute, setDirectionsRoute] = useState(null);

  useEffect(() => {
    if (!routesLibrary || !start?.location || !destination?.location) {
      onRoute(null);
      return undefined;
    }

    let active = true;
    const googleMaps = globalThis.google?.maps;
    if (!googleMaps?.DirectionsService) return undefined;

    const service = new googleMaps.DirectionsService();
    service.route(
      {
        origin: start.location,
        destination: destination.location,
        travelMode: googleMaps.TravelMode.DRIVING,
        provideRouteAlternatives: false,
      },
      (result, status) => {
        if (!active) return;
        if (status !== 'OK' || !result?.routes?.[0]) {
          setDirectionsRoute(null);
          onRoute(null);
          return;
        }

        const route = result.routes[0];
        const leg = route.legs?.[0];
        const distanceKm = leg?.distance?.value ? Math.round(leg.distance.value / 1000) : 0;
        const durationHours = leg?.duration?.value ? leg.duration.value / 3600 : 0;
        setDirectionsRoute(route);
        onRoute({
          distanceKm,
          durationHours,
          distanceText: leg?.distance?.text || `${distanceKm} km`,
          durationText: leg?.duration?.text || formatDuration(durationHours),
          source: 'Google Maps',
        });

        if (map && route.bounds) map.fitBounds(route.bounds, 56);
      }
    );

    return () => {
      active = false;
    };
  }, [destination, map, onRoute, routesLibrary, start]);

  const routePath = directionsRoute?.overview_path || [];

  return (
    <>
      {routePath.length > 0 && (
        <Polyline
          path={routePath}
          strokeColor="#6366f1"
          strokeOpacity={0.9}
          strokeWeight={5}
        />
      )}
      {start?.location && (
        <AdvancedMarker position={start.location}>
          <Pin background="#6366f1" borderColor="#ffffff" glyphColor="#ffffff" />
        </AdvancedMarker>
      )}
      {destination?.location && (
        <AdvancedMarker position={destination.location}>
          <Pin background="#10b981" borderColor="#ffffff" glyphColor="#ffffff" />
        </AdvancedMarker>
      )}
      {currentLocation && (
        <AdvancedMarker position={currentLocation}>
          <div className="flex items-center justify-center w-8 h-8 bg-violet-500 rounded-full border-2 border-white shadow-lg animate-pulse relative">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-white">
              <path d="M10 17h4V5H2v12h3" />
              <path d="M20 17h2v-3.34a4 4 0 0 0-1.17-2.83L19 9h-5" />
              <path d="M14 17h1" />
              <circle cx="7.5" cy="17.5" r="2.5" />
              <circle cx="17.5" cy="17.5" r="2.5" />
            </svg>
            <div className="absolute -bottom-1 -z-10 w-4 h-4 bg-violet-500 rotate-45" />
          </div>
        </AdvancedMarker>
      )}
    </>
  );
};

export const GoogleRouteMap = ({ start, destination, onRoute, currentLocation, className = '' }) => {
  const center = start?.location || destination?.location || currentLocation || INDIA_CENTER;

  return (
    <div className={`relative overflow-hidden rounded-xl border border-slate-800 bg-slate-950 ${className}`}>
      <Map
        defaultCenter={center}
        defaultZoom={5}
        mapId={GOOGLE_MAPS_MAP_ID}
        disableDefaultUI
        zoomControl
        gestureHandling="greedy"
        colorScheme="DARK"
        className="h-full w-full"
      >
        <RouteDirections start={start} destination={destination} currentLocation={currentLocation} onRoute={onRoute} />
      </Map>
      <div className="pointer-events-none absolute left-3 top-3 flex items-center gap-2 rounded-lg border border-slate-700/80 bg-slate-950/85 px-2.5 py-2 text-[10px] font-bold uppercase tracking-wider text-slate-300 backdrop-blur-md">
        <Route size={13} className="text-indigo-400" /> Google route preview
      </div>
    </div>
  );
};

export const GoogleTrackingMap = ({
  pickup,
  destination,
  pickupCoordinates,
  destinationCoordinates,
  currentLocation,
  vehicleNumber,
  driverName,
  status,
}) => {
  const noopRoute = useCallback(() => {}, []);
  const start = {
    address: pickup,
    location: pickupCoordinates || CITY_COORDINATES[pickup] || INDIA_CENTER,
  };
  const end = {
    address: destination,
    location: destinationCoordinates || CITY_COORDINATES[destination] || INDIA_CENTER,
  };

  return (
    <APIProvider apiKey={GOOGLE_MAPS_API_KEY} libraries={['routes']}>
      <div className="relative h-[400px] overflow-hidden rounded-xl border border-slate-800 bg-slate-950">
        <GoogleRouteMap start={start} destination={end} currentLocation={currentLocation} onRoute={noopRoute} className="h-full rounded-none border-0" />
        <div className="pointer-events-none absolute bottom-0 left-0 right-0 flex flex-col gap-2 border-t border-slate-800 bg-slate-950/90 px-4 py-3 backdrop-blur-md md:flex-row md:items-center md:justify-between">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold text-slate-100">
              <span className="h-2 w-2 rounded-full bg-violet-400 shadow-lg shadow-violet-400/50" />
              {vehicleNumber || 'Live vehicle'}
              <span className="rounded bg-indigo-500/15 px-2 py-0.5 text-[9px] uppercase tracking-wider text-indigo-300">{status}</span>
            </div>
            <div className="mt-1 text-[10px] text-slate-400">{driverName || 'Assigned driver'} · {pickup} → {destination}</div>
          </div>
          <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-emerald-300">
            <Route size={13} /> Road route from Google Maps
          </div>
        </div>
      </div>
    </APIProvider>
  );
};

export const GoogleTripRoutePicker = ({
  pickup,
  destination,
  pickupPlace,
  destinationPlace,
  onPickupChange,
  onDestinationChange,
  onPickupSelect,
  onDestinationSelect,
  onRoute,
}) => {
  const [isLocating, setIsLocating] = useState(false);
  const [locationError, setLocationError] = useState('');
  const handlePickupChange = useCallback((value) => onPickupChange(value), [onPickupChange]);
  const handleDestinationChange = useCallback((value) => onDestinationChange(value), [onDestinationChange]);
  const handlePickupSelect = useCallback((place) => onPickupSelect(place), [onPickupSelect]);
  const handleDestinationSelect = useCallback((place) => onDestinationSelect(place), [onDestinationSelect]);

  const handleUseCurrentLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setLocationError('Current location is not supported by this browser.');
      return;
    }

    setIsLocating(true);
    setLocationError('');
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        const googleMaps = globalThis.google?.maps;
        if (!googleMaps?.Geocoder) {
          setIsLocating(false);
          setLocationError('Google Maps address lookup is not ready yet. Please try again.');
          return;
        }

        const location = { lat: coords.latitude, lng: coords.longitude };
        new googleMaps.Geocoder().geocode({ location }, (results, status) => {
          setIsLocating(false);
          if (status !== 'OK' || !results?.[0]) {
            setLocationError('Google Maps could not find an address for your current location.');
            return;
          }

          const result = results[0];
          const place = {
            address: result.formatted_address || `${coords.latitude.toFixed(6)}, ${coords.longitude.toFixed(6)}`,
            placeId: result.place_id || '',
            location,
          };
          onPickupChange(place.address);
          onPickupSelect(place);
        });
      },
      (error) => {
        setIsLocating(false);
        setLocationError(
          error.code === error.PERMISSION_DENIED
            ? 'Location permission was denied. Allow location access and try again.'
            : 'Unable to read your current location. Please try again.'
        );
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 30000 }
    );
  }, [onPickupChange, onPickupSelect]);

  return (
    <APIProvider apiKey={GOOGLE_MAPS_API_KEY} libraries={['places', 'routes']}>
      <div className="space-y-3 rounded-xl border border-indigo-500/15 bg-indigo-500/[0.04] p-3">
        <div className="flex items-center justify-between gap-3">
          <div>
            <span className="flex items-center gap-1.5 text-[10px] font-extrabold uppercase tracking-wider text-indigo-300"><MapPin size={12} /> Google route planning</span>
            <p className="mt-1 text-[10px] text-slate-500">Search exact pickup and delivery places for a better ETA.</p>
          </div>
          <Zap size={16} className="text-amber-300" />
        </div>

        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <div className="space-y-2">
            <PlaceAutocomplete
              label="Trip start / pickup"
              value={pickup}
              placeholder="Search a pickup place"
              onChange={handlePickupChange}
              onPlaceSelect={handlePickupSelect}
            />
            <button
              type="button"
              onClick={handleUseCurrentLocation}
              disabled={isLocating}
              className="inline-flex items-center gap-1.5 rounded-md border border-indigo-400/20 bg-indigo-500/10 px-2.5 py-1.5 text-[10px] font-bold text-indigo-300 transition-colors hover:bg-indigo-500/20 disabled:cursor-wait disabled:opacity-60"
            >
              <Navigation size={12} className={isLocating ? 'animate-pulse' : ''} />
              {isLocating ? 'Finding current location...' : 'Use my current location'}
            </button>
            {locationError && <p className="text-[10px] font-semibold text-rose-300">{locationError}</p>}
          </div>
          <PlaceAutocomplete
            label="Trip end / destination"
            value={destination}
            placeholder="Search a delivery place"
            onChange={handleDestinationChange}
            onPlaceSelect={handleDestinationSelect}
            accent="emerald"
          />
        </div>

        <GoogleRouteMap start={pickupPlace} destination={destinationPlace} onRoute={onRoute} className="h-52" />
      </div>
    </APIProvider>
  );
};

export const RouteSummary = ({ route }) => {
  if (!route) return null;
  return (
    <div className="flex flex-wrap items-center gap-3 rounded-lg border border-emerald-500/15 bg-emerald-500/[0.05] px-3 py-2 text-[11px] text-slate-300">
      <span className="flex items-center gap-1.5 font-bold text-emerald-300"><Route size={13} /> Google recommendation</span>
      <span>{route.distanceText || `${route.distanceKm} km`}</span>
      <span className="text-slate-600">•</span>
      <span className="flex items-center gap-1"><Clock3 size={12} className="text-slate-500" />{route.durationText || formatDuration(route.durationHours)}</span>
    </div>
  );
};

export default GoogleRouteMap;
