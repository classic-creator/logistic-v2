import React, { useEffect, useState, useRef } from 'react';
import { Navigation, Compass, MapPin, ZoomIn, ZoomOut, RotateCcw, Clock, ShieldAlert } from 'lucide-react';

export const MapContainer = ({
  pickup = 'Pune',
  destination = 'Mumbai',
  vehicleNumber = 'MH-12-QW-5689',
  driverName = 'Rajesh Kumar',
  speed = 65,
  status = 'Running',
  eta = '1.2 hrs',
  remainingDistance = 62,
  onComplete,
  className = ''
}) => {
  const [progress, setProgress] = useState(0.45); // Start at 45% along the path
  const [zoom, setZoom] = useState(1);
  const [isHovered, setIsHovered] = useState(false);
  const mapRef = useRef(null);

  // Geographic mapping coordinates for our visual path representation
  const cityPositions = {
    'Pune': { x: 220, y: 320, lat: '18.5204° N', lng: '73.8567° E' },
    'Mumbai': { x: 120, y: 220, lat: '19.0760° N', lng: '72.8777° E' },
    'Delhi': { x: 280, y: 60, lat: '28.6139° N', lng: '77.2090° E' },
    'Bangalore': { x: 240, y: 420, lat: '12.9716° N', lng: '77.5946° E' },
    'Chennai': { x: 340, y: 440, lat: '13.0827° N', lng: '80.2707° E' },
    'Hyderabad': { x: 310, y: 340, lat: '17.3850° N', lng: '78.4867° E' },
    'Jaipur': { x: 200, y: 110, lat: '26.9124° N', lng: '75.7873° E' },
    'Kolkata': { x: 520, y: 260, lat: '22.5726° N', lng: '88.3639° E' },
    'Patna': { x: 480, y: 180, lat: '25.5941° N', lng: '85.1376° E' }
  };

  const startCity = cityPositions[pickup] || { x: 100, y: 300, lat: '0° N', lng: '0° E' };
  const endCity = cityPositions[destination] || { x: 400, y: 150, lat: '0° N', lng: '0° E' };

  // Calculate mid-points for smooth curves
  const midX = (startCity.x + endCity.x) / 2 + 30; // Curved route offset
  const midY = (startCity.y + endCity.y) / 2 - 30;

  // Path formula for SVG Q-Curve
  const pathD = `M ${startCity.x} ${startCity.y} Q ${midX} ${midY} ${endCity.x} ${endCity.y}`;

  // Bezier curve coordinate calculator for vehicle positioning
  const getQBezierPoint = (t, p0, p1, p2) => {
    const x = (1 - t) * (1 - t) * p0.x + 2 * (1 - t) * t * p1.x + t * t * p2.x;
    const y = (1 - t) * (1 - t) * p0.y + 2 * (1 - t) * t * p1.y + t * t * p2.y;
    return { x, y };
  };

  // Get current truck location
  const p1 = { x: midX, y: midY };
  const truckPos = getQBezierPoint(progress, startCity, p1, endCity);

  // Slowly animate the truck forward if running
  useEffect(() => {
    if (status !== 'Running') return;
    
    const interval = setInterval(() => {
      setProgress((prev) => {
        const next = prev + 0.003;
        if (next >= 1) {
          clearInterval(interval);
          if (onComplete) onComplete();
          return 1;
        }
        return next;
      });
    }, 1500);

    return () => clearInterval(interval);
  }, [status, onComplete]);

  // Telemetry calculation
  const currentLat = (parseFloat(startCity.lat) + progress * (parseFloat(endCity.lat) - parseFloat(startCity.lat))).toFixed(4);
  const currentLng = (parseFloat(startCity.lng) + progress * (parseFloat(endCity.lng) - parseFloat(startCity.lng))).toFixed(4);

  return (
    <div className={`relative w-full h-[400px] border border-slate-800 rounded-xl overflow-hidden bg-[#0a0d16] flex flex-col justify-end ${className}`}>
      {/* Grid overlay background */}
      <div className="absolute inset-0 map-grid opacity-30 pointer-events-none" />

      {/* Dynamic Simulated Map Canvas */}
      <svg
        ref={mapRef}
        viewBox="0 0 600 500"
        className="w-full h-full absolute inset-0 cursor-grab active:cursor-grabbing transition-transform duration-200"
        style={{
          transform: `scale(${zoom})`,
          transformOrigin: 'center center'
        }}
      >
        {/* Route Curved Path - Inactive Background */}
        <path
          d={pathD}
          fill="none"
          stroke="#1e293b"
          strokeWidth="6"
          strokeLinecap="round"
        />

        {/* Route Curved Path - Completed Segment Progress */}
        <path
          d={pathD}
          fill="none"
          stroke="url(#indigoGlow)"
          strokeWidth="4"
          strokeLinecap="round"
          strokeDasharray="600"
          strokeDashoffset={600 * (1 - progress)}
        />

        {/* Route Curved Path - Dash overlay animation */}
        <path
          d={pathD}
          fill="none"
          stroke="#818cf8"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeDasharray="8, 12"
          className="animate-[dash_20s_linear_infinite]"
        />

        {/* Pickup Pin */}
        <g transform={`translate(${startCity.x}, ${startCity.y})`} className="cursor-pointer">
          <circle r="12" fill="#6366f1" fillOpacity="0.2" className="animate-ping" />
          <circle r="7" fill="#6366f1" stroke="#070a13" strokeWidth="2" />
          <foreignObject x="-30" y="-35" width="60" height="20">
            <div className="bg-slate-900 border border-slate-800 text-[10px] text-slate-300 font-bold px-1 py-0.5 rounded text-center truncate">
              {pickup}
            </div>
          </foreignObject>
        </g>

        {/* Destination Pin */}
        <g transform={`translate(${endCity.x}, ${endCity.y})`} className="cursor-pointer">
          <circle r="12" fill="#10b981" fillOpacity="0.2" className="animate-ping" />
          <circle r="7" fill="#10b981" stroke="#070a13" strokeWidth="2" />
          <foreignObject x="-30" y="-35" width="60" height="20">
            <div className="bg-slate-900 border border-slate-800 text-[10px] text-emerald-400 font-bold px-1 py-0.5 rounded text-center truncate">
              {destination}
            </div>
          </foreignObject>
        </g>

        {/* Live Truck Marker */}
        <g transform={`translate(${truckPos.x}, ${truckPos.y})`}>
          <circle r="22" fill="#8b5cf6" fillOpacity="0.15" className="animate-pulse" />
          <circle r="10" fill="#8b5cf6" stroke="#ffffff" strokeWidth="2" />
          {/* Compass Pointer direction */}
          <path
            d="M-5 -2 L0 -10 L5 -2 Z"
            fill="#ffffff"
            transform="rotate(65)"
          />
        </g>

        {/* Secondary Simulated Cities/Nodes */}
        {Object.entries(cityPositions).map(([name, pos]) => {
          if (name === pickup || name === destination) return null;
          // Only show some cities to avoid clutter
          if (pos.x % 3 === 0) return null;
          return (
            <g key={name} transform={`translate(${pos.x}, ${pos.y})`} opacity="0.3">
              <circle r="3" fill="#475569" />
              <text x="6" y="3" fontSize="8" fill="#94a3b8" fontWeight="medium">
                {name}
              </text>
            </g>
          );
        })}

        {/* Definition Gradients */}
        <defs>
          <linearGradient id="indigoGlow" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#6366f1" />
            <stop offset="100%" stopColor="#8b5cf6" />
          </linearGradient>
        </defs>
      </svg>

      {/* Map Control Buttons */}
      <div className="absolute top-4 right-4 flex flex-col gap-2 z-10">
        <button
          onClick={() => setZoom(z => Math.min(z + 0.25, 2))}
          className="p-1.5 bg-slate-900 border border-slate-850 hover:bg-slate-800 text-slate-300 hover:text-slate-100 rounded-lg cursor-pointer"
        >
          <ZoomIn size={16} />
        </button>
        <button
          onClick={() => setZoom(z => Math.max(z - 0.25, 0.75))}
          className="p-1.5 bg-slate-900 border border-slate-850 hover:bg-slate-800 text-slate-300 hover:text-slate-100 rounded-lg cursor-pointer"
        >
          <ZoomOut size={16} />
        </button>
        <button
          onClick={() => { setZoom(1); setProgress(0.45); }}
          className="p-1.5 bg-slate-900 border border-slate-850 hover:bg-slate-800 text-slate-300 hover:text-slate-100 rounded-lg cursor-pointer"
        >
          <RotateCcw size={16} />
        </button>
      </div>

      {/* Live Coordinate Overlay HUD */}
      <div className="absolute top-4 left-4 glass-panel rounded-lg px-3 py-2 border border-indigo-500/20 text-[10px] font-mono text-slate-400 space-y-1">
        <div className="flex items-center gap-1.5 text-slate-300">
          <Compass size={11} className="text-accent-indigo animate-spin-slow" />
          <span>GPS HUD v2.5</span>
        </div>
        <div>LAT: {currentLat}° N</div>
        <div>LNG: {currentLng}° E</div>
        <div className="text-[9px] text-slate-500">REF: {vehicleNumber}</div>
      </div>

      {/* Dynamic Telemetry HUD Panel */}
      <div className="relative glass-panel rounded-t-xl px-5 py-4 border-t border-slate-800 w-full z-10 flex flex-col md:flex-row justify-between items-stretch md:items-center gap-4 bg-slate-950/90">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-indigo-500/10 text-accent-indigo">
            <Navigation size={20} className="rotate-45" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-sm text-slate-100">{vehicleNumber}</span>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-indigo-500/20 text-accent-indigo animate-pulse uppercase">
                {status}
              </span>
            </div>
            <div className="text-xs text-slate-400 font-medium">
              Driver: {driverName} • Routing: {pickup} → {destination}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-6 border-t md:border-t-0 md:border-l border-slate-800 pt-3 md:pt-0 pl-0 md:pl-6 text-center md:text-left">
          <div>
            <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Speed</div>
            <div className="text-sm font-bold text-slate-200 font-mono">{status === 'Running' ? `${speed} km/h` : '0 km/h'}</div>
          </div>
          <div>
            <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider flex items-center gap-1 justify-center md:justify-start">
              <Clock size={10} /> ETA
            </div>
            <div className="text-sm font-bold text-indigo-400 font-mono">
              {status === 'Running' ? (progress >= 1 ? 'Delivered' : `${(remainingDistance * (1 - progress)).toFixed(0)} km (${eta})`) : '—'}
            </div>
          </div>
          <div>
            <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Progress</div>
            <div className="text-sm font-bold text-emerald-400 font-mono">{(progress * 100).toFixed(0)}%</div>
          </div>
        </div>
      </div>
      
      {/* Path dash animation styles */}
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes dash {
          to {
            stroke-dashoffset: -1000;
          }
        }
        .animate-spin-slow {
          animation: spin 8s linear infinite;
        }
      `}} />
    </div>
  );
};

export default MapContainer;
