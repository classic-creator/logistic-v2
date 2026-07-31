import React, { useMemo, useState } from 'react';
import { APIProvider, Map, AdvancedMarker, Pin, InfoWindow } from '@vis.gl/react-google-maps';

// Default center to India
const defaultCenter = {
  lat: 20.5937,
  lng: 78.9629,
};

export const LiveMap = ({ trips = [] }) => {
  const [activeMarker, setActiveMarker] = useState(null);

  // Generate some rough random coordinates based on the route locations for mockup purposes
  const markers = useMemo(() => {
    return trips.filter(t => t.status === 'Running').map(trip => {
      // Very rough mapping of city to lat/lng just for mockup
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
        'Ahmedabad': { lat: 23.0225, lng: 72.5714 }
      };

      const start = cityCoordinates[trip.pickupLocation] || defaultCenter;
      const end = cityCoordinates[trip.destination] || defaultCenter;

      // Simulate a position halfway
      return {
        id: trip.id,
        vehicleNumber: trip.vehicleNumber,
        driverName: trip.driverName,
        pickupLocation: trip.pickupLocation,
        destination: trip.destination,
        position: {
          lat: (start.lat + end.lat) / 2 + (Math.random() - 0.5) * 1.5,
          lng: (start.lng + end.lng) / 2 + (Math.random() - 0.5) * 1.5,
        }
      };
    });
  }, [trips]);

  return (
    <APIProvider apiKey="YOUR_GOOGLE_MAPS_API_KEY">
      <div className="w-full h-full rounded-xl overflow-hidden relative">
        <Map
          defaultZoom={5}
          defaultCenter={defaultCenter}
          mapId="DEMO_MAP_ID"
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
              <Pin background={"#6366f1"} borderColor={"#ffffff"} glyphColor={"#ffffff"} />
            </AdvancedMarker>
          ))}
          
          {activeMarker && (
            <InfoWindow
              position={activeMarker.position}
              onCloseClick={() => setActiveMarker(null)}
            >
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
