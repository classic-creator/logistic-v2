import React, { useMemo, useState } from 'react';
import { Truck, Navigation } from 'lucide-react';
import { APIProvider, Map, AdvancedMarker, Pin, InfoWindow } from '@vis.gl/react-google-maps';

const API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '';

// Default center to India
const defaultCenter = {
  lat: 20.5937,
  lng: 78.9629,
};

const cityCoordinates = {
  'Pune': { lat: 18.5204, lng: 73.8567 },
  'Mumbai': { lat: 19.0760, lng: 72.8777 },
  'Delhi': { lat: 28.6139, lng: 77.2090 },
  'Bangalore': { lat: 12.9716, lng: 77.5946 },
  'Chennai': { lat: 13.0827, lng: 80.2707 },
  'Hyderabad': { lat: 17.3850, lng: 78.4867 },
  'Jaipur': { lat: 26.9124, lng: 75.7873 },
  'Kolkata': { lat: 22.5726, lng: 88.3639 },
  'Patna': { lat: 25.5941, lng: 85.1376 },
  'Ahmedabad': { lat: 23.0225, lng: 72.5714 },
};

const toSvgPoint = (lat, lng) => ({
  x: Math.round((lng - 68) * 7.5 + 40),
  y: Math.round((34 - lat) * 8.2 + 30),
});

// Deterministic pseudo-random offset from a string id (keeps markers stable across re-renders).
const hashOffset = (str, scale) => {
  let h = 0;
  for (let i = 0; i < str.length; i++) {
    h = (h * 31 + str.charCodeAt(i)) >>> 0;
  }
  return ((h % 1000) / 1000 - 0.5) * scale;
};

// Fallback simulated fleet map rendered when no Google Maps API key is configured.
const SimulatedFleetMap = ({ trips }) => {
  const [hovered, setHovered] = useState(null);

  const routeLines = useMemo(
    () =>
      trips.map((trip) => {
        const start = cityCoordinates[trip.pickupLocation] || defaultCenter;
        const end = cityCoordinates[trip.destination] || defaultCenter;
        const s = toSvgPoint(start.lat, start.lng);
        const e = toSvgPoint(end.lat, end.lng);
        const midX = (s.x + e.x) / 2 + 12;
        const midY = (s.y + e.y) / 2 - 12;
        const vehiclePos = trip.currentLocation
          ? toSvgPoint(trip.currentLocation.lat, trip.currentLocation.lng)
          : s;
        return {
          id: trip.id,
          vehicleNumber: trip.vehicleNumber,
          driverName: trip.driverName,
          pickupLocation: trip.pickupLocation,
          destination: trip.destination,
          speed: trip.speed,
          eta: trip.eta,
          path: `M ${s.x} ${s.y} Q ${midX} ${midY} ${e.x} ${e.y}`,
          s,
          e,
          vehiclePos,
        };
      }),
    [trips]
  );

  return (
    <div className="relative w-full h-full border border-slate-800 rounded-xl overflow-hidden bg-[#0a0d16]">
      <div className="absolute inset-0 map-grid opacity-30 pointer-events-none" />

      {/* Simulated grid + bounding box */}
      <svg viewBox="0 0 480 320" className="w-full h-full absolute inset-0">
        {routeLines.map((r) => (
          <path key={r.id} d={r.path} fill="none" stroke="#1e293b" strokeWidth="2.5" strokeLinecap="round" />
        ))}
        {routeLines.map((r) => (
          <path key={`a-${r.id}`} d={r.path} fill="none" stroke="url(#liveGlow)" strokeWidth="1.5" strokeDasharray="6, 10" className="animate-[dash_16s_linear_infinite]" />
        ))}

        {routeLines.map((r) => (
          <g key={`s-${r.id}`} transform={`translate(${r.s.x}, ${r.s.y})`} opacity="0.9">
            <circle r="5" fill="#6366f1" stroke="#070a13" strokeWidth="1.5" />
          </g>
        ))}
        {routeLines.map((r) => (
          <g key={`e-${r.id}`} transform={`translate(${r.e.x}, ${r.e.y})`} opacity="0.9">
            <circle r="5" fill="#10b981" stroke="#070a13" strokeWidth="1.5" />
          </g>
        ))}

        {routeLines.map((r) => (
          <g
            key={`t-${r.id}`}
            transform={`translate(${r.vehiclePos.x}, ${r.vehiclePos.y})`}
            className="cursor-pointer"
            onMouseEnter={() => setHovered(r)}
            onMouseLeave={() => setHovered(null)}
          >
            <circle r="14" fill="#8b5cf6" fillOpacity="0.18" className="animate-pulse" />
            <circle r="6" fill="#8b5cf6" stroke="#ffffff" strokeWidth="1.5" />
          </g>
        ))}
        <defs>
          <linearGradient id="liveGlow" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#6366f1" />
            <stop offset="100%" stopColor="#8b5cf6" />
          </linearGradient>
        </defs>
      </svg>

      {/* Hover tooltip */}
      {hovered && (
        <div className="absolute top-3 left-3 glass-panel rounded-lg px-3 py-2 border border-slate-800 text-xs text-slate-300 space-y-1 z-10">
          <div className="flex items-center gap-1.5 font-bold text-slate-100">
            <Truck size={12} className="text-accent-indigo" />
            {hovered.vehicleNumber}
          </div>
          <div className="text-slate-400">Driver: {hovered.driverName}</div>
          <div className="text-indigo-400 font-semibold">{hovered.pickupLocation} → {hovered.destination}</div>
          <div className="flex gap-3 text-[10px] text-slate-500">
            <span>{hovered.speed ? `${hovered.speed} km/h` : '—'}</span>
            <span>ETA {hovered.eta || '—'}</span>
          </div>
        </div>
      )}

      {/* Legend */}
      <div className="absolute bottom-3 left-3 glass-panel rounded-lg px-3 py-2 border border-slate-800 text-[10px] text-slate-500 space-y-1 z-10">
        <div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-indigo-500" /> Pickup</div>
        <div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-emerald-500" /> Destination</div>
        <div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-violet-500" /> Live vehicle</div>
      </div>

      {/* Status chip */}
      <div className="absolute top-3 right-3 glass-panel rounded-lg px-2.5 py-1.5 border border-indigo-500/20 text-[10px] font-bold text-accent-indigo flex items-center gap-1.5 z-10">
        <Navigation size={11} className="animate-spin-slow" />
        SIMULATED LIVE TRACKING
      </div>
    </div>
  );
};

export const LiveMap = ({ trips = [] }) => {
  const [activeMarker, setActiveMarker] = useState(null);

  // Generate some rough random coordinates based on the route locations for mockup purposes
  const markers = useMemo(() => {
    return trips.filter((t) => t.status === 'Running').map((trip) => {
      const start = cityCoordinates[trip.pickupLocation] || defaultCenter;
      const end = cityCoordinates[trip.destination] || defaultCenter;

      return {
        id: trip.id,
        vehicleNumber: trip.vehicleNumber,
        driverName: trip.driverName,
        pickupLocation: trip.pickupLocation,
        destination: trip.destination,
        position: trip.currentLocation || {
          lat: (start.lat + end.lat) / 2 + hashOffset(`${trip.id}-lat`, 1.5),
          lng: (start.lng + end.lng) / 2 + hashOffset(`${trip.id}-lng`, 1.5),
        },
      };
    });
  }, [trips]);

  // No Google Maps API key configured → graceful simulated fallback.
  if (!API_KEY) {
    return <SimulatedFleetMap trips={markers} />;
  }

  return (
    <APIProvider apiKey={API_KEY}>
      <div className="w-full h-full rounded-xl overflow-hidden relative">
        <Map
          defaultZoom={5}
          defaultCenter={defaultCenter}
          mapId={import.meta.env.VITE_GOOGLE_MAPS_MAP_ID || 'DEMO_MAP_ID'}
          disableDefaultUI={true}
          zoomControl={true}
          colorScheme="DARK"
        >
          {markers.map((marker) => (
            <AdvancedMarker
              key={marker.id}
              position={marker.position}
              onClick={() => setActiveMarker(marker)}
            >
              <Pin background={'#6366f1'} borderColor={'#ffffff'} glyphColor={'#ffffff'} />
            </AdvancedMarker>
          ))}

          {activeMarker && (
            <InfoWindow position={activeMarker.position} onCloseClick={() => setActiveMarker(null)}>
              <div className="text-slate-900 font-sans p-1">
                <h3 className="font-bold text-sm mb-1">{activeMarker.vehicleNumber}</h3>
                <p className="text-xs mb-1"><span className="font-semibold">Driver:</span> {activeMarker.driverName}</p>
                <p className="text-xs text-indigo-600 font-semibold">{activeMarker.pickupLocation} &rarr; {activeMarker.destination}</p>
              </div>
            </InfoWindow>
          )}
        </Map>
      </div>
    </APIProvider>
  );
};

export default LiveMap;
