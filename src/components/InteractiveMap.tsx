import React, { useMemo, useState, useRef, useEffect } from 'react';
import { 
  Compass, Navigation, Sun, Moon, ShieldAlert, 
  ZoomIn, ZoomOut, RotateCcw, MapPin, Flag, Clock
} from 'lucide-react';
import { BookingStatus, RoutePoint } from '../types';
import { 
  generateActualRoadRoute, 
  generateDriverToPickupRoute, 
  getPointAlongRoad, 
  calculateAutoBoundingBox,
  resolveAddressToRoadJunction 
} from '../services/routeService';

interface InteractiveMapProps {
  pickup: string;
  drop: string;
  status: BookingStatus;
  progressPercent?: number;
  vehicleTierName?: string;
  vehicleIcon?: string;
  isNightMode?: boolean;
  onToggleNightMode?: () => void;
  onSelectMapCoord?: (name: string) => void;
  showNearbyDrivers?: boolean;
  driverName?: string;
  driverPlate?: string;
  // Fixed Location Pin props
  showFixedPin?: boolean;
  fixedPinAddress?: string;
  fixedPinPos?: { x: number; y: number };
  onMapClickMovePin?: (x: number, y: number) => void;
}

export const InteractiveMap: React.FC<InteractiveMapProps> = ({
  pickup,
  drop,
  status,
  progressPercent = 0,
  vehicleTierName = 'Cab',
  vehicleIcon = '🚕',
  isNightMode = true,
  onToggleNightMode,
  onSelectMapCoord,
  showNearbyDrivers = true,
  driverName = 'Ravi Kumar',
  driverPlate = 'TS 09 AB 1234',
  showFixedPin = true,
  fixedPinAddress = 'Cyber Towers Main Gate, Hitec City',
  fixedPinPos = { x: 38, y: 52 },
  onMapClickMovePin
}) => {
  // Manual Zoom state
  const [userZoom, setUserZoom] = useState<number | null>(null);
  const touchDistRef = useRef<number | null>(null);

  // Simulated live nearby drivers before booking - dynamically anchored around pickup
  const [nearbyDriverOffsets, setNearbyDriverOffsets] = useState([
    { id: 'd-bike', icon: '🏍️', name: 'Bike', dx: -6.5, dy: -6.0, heading: 45 },
    { id: 'd-auto', icon: '🛺', name: 'Auto', dx: 7.5, dy: -5.0, heading: 120 },
    { id: 'd-cab', icon: '🚕', name: 'Cab', dx: -8.0, dy: 6.5, heading: 220 },
    { id: 'd-truck', icon: '🚚', name: 'Truck', dx: 8.5, dy: 7.0, heading: 310 }
  ]);

  // Subtle real-time drift of online nearby drivers
  useEffect(() => {
    if (status !== 'IDLE' && status !== 'FINDING_DRIVER') return;
    const interval = setInterval(() => {
      setNearbyDriverOffsets(prev => prev.map(d => ({
        ...d,
        dx: +(d.dx + (Math.random() - 0.5) * 0.4).toFixed(2),
        dy: +(d.dy + (Math.random() - 0.5) * 0.4).toFixed(2)
      })));
    }, 2000);
    return () => clearInterval(interval);
  }, [status]);

  // 1. Resolve Pickup and Destination road junctions
  const pickupJunction = useMemo(() => {
    if (!pickup) return fixedPinPos;
    return resolveAddressToRoadJunction(pickup);
  }, [pickup, fixedPinPos]);

  // Live positions of nearby drivers dynamically surrounding the customer's pickup area
  const liveNearbyDrivers = useMemo(() => {
    const center = pickup ? pickupJunction : fixedPinPos;
    return nearbyDriverOffsets.map(d => ({
      ...d,
      x: Math.max(8, Math.min(92, +(center.x + d.dx).toFixed(1))),
      y: Math.max(12, Math.min(88, +(center.y + d.dy).toFixed(1)))
    }));
  }, [pickup, pickupJunction, fixedPinPos, nearbyDriverOffsets]);

  const dropJunction = useMemo(() => {
    if (!drop) return { x: 70, y: 34 };
    return resolveAddressToRoadJunction(drop);
  }, [drop]);

  // 2. Generate actual multi-segment road route between Pickup and Destination
  const roadRoute = useMemo(() => {
    if (!pickup || !drop) return null;
    return generateActualRoadRoute(pickup, drop);
  }, [pickup, drop]);

  // Initial approximate driver location (spawns ~1.4 km from pickup on road network)
  const initialDriverPos = useMemo<RoutePoint>(() => {
    return {
      x: +(pickupJunction.x - 12).toFixed(1),
      y: +(pickupJunction.y - 8).toFixed(1),
      streetName: 'Curbside Approach Road'
    };
  }, [pickupJunction]);

  // 3. Generate Driver -> Pickup road route (shown when Driver is coming)
  const driverToPickupRoute = useMemo(() => {
    return generateDriverToPickupRoute(initialDriverPos, pickupJunction);
  }, [initialDriverPos, pickupJunction]);

  // Determine which stage of trip is active
  const isDriverApproaching = ['DRIVER_ASSIGNED', 'DRIVER_COMING', 'ARRIVING', 'MATCHED'].includes(status);
  const isDriverArrived = status === 'DRIVER_ARRIVED';
  const isTripInProgress = ['TRIP_STARTED', 'IN_PROGRESS'].includes(status);
  const isTripFinished = ['TRIP_COMPLETED', 'COMPLETED', 'PAYMENT'].includes(status);

  // 4. Calculate live smooth driver position along the appropriate road route
  const liveDriverState = useMemo(() => {
    if (isDriverApproaching) {
      // Driver moving smoothly along Driver -> Pickup route
      const fraction = Math.min(1, Math.max(0, progressPercent / 100));
      return getPointAlongRoad(driverToPickupRoute.points, fraction);
    }
    if (isDriverArrived) {
      // Driver is right at the pickup spot!
      return { x: pickupJunction.x, y: pickupJunction.y, bearingDeg: 0 };
    }
    if (isTripInProgress && roadRoute) {
      // Vehicle moving smoothly along Pickup -> Destination route
      const fraction = Math.min(1, Math.max(0, progressPercent / 100));
      return getPointAlongRoad(roadRoute.points, fraction);
    }
    if (isTripFinished && roadRoute) {
      return { x: dropJunction.x, y: dropJunction.y, bearingDeg: 0 };
    }
    return { x: initialDriverPos.x, y: initialDriverPos.y, bearingDeg: 0 };
  }, [
    isDriverApproaching, 
    isDriverArrived, 
    isTripInProgress, 
    isTripFinished, 
    progressPercent, 
    driverToPickupRoute, 
    pickupJunction, 
    dropJunction, 
    roadRoute, 
    initialDriverPos
  ]);

  // 5. Automatic Map Bounding Box / Auto-Zoom adjustment
  const autoBox = useMemo(() => {
    if (!roadRoute) {
      return { centerX: fixedPinPos.x, centerY: fixedPinPos.y, scale: 1 };
    }
    return calculateAutoBoundingBox(
      roadRoute.points, 
      (isDriverApproaching || isTripInProgress) ? liveDriverState : null
    );
  }, [roadRoute, fixedPinPos, isDriverApproaching, isTripInProgress, liveDriverState]);

  // Auto-pan to center bounding box when route is active and not manually zoomed
  const panX = userZoom !== null ? 0 : (roadRoute ? +( (50 - autoBox.centerX) * 0.75 ).toFixed(2) : 0);
  const panY = userZoom !== null ? 0 : (roadRoute ? +( (50 - autoBox.centerY) * 0.75 ).toFixed(2) : 0);

  // Effective zoom (manual overrides auto if user pinched/wheeled)
  const currentZoom = userZoom !== null ? userZoom : (roadRoute ? autoBox.scale : 1);

  // Two-finger pinch-to-zoom gesture handlers
  const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    if (e.touches.length === 2) {
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      touchDistRef.current = Math.hypot(dx, dy);
    }
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    if (e.touches.length === 2 && touchDistRef.current) {
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      const newDist = Math.hypot(dx, dy);
      const scaleDiff = newDist / touchDistRef.current;
      const base = userZoom !== null ? userZoom : currentZoom;
      setUserZoom(Math.max(0.75, Math.min(2.5, +(base * (1 + (scaleDiff - 1) * 0.85)).toFixed(2))));
      touchDistRef.current = newDist;
    }
  };

  const handleTouchEnd = () => {
    touchDistRef.current = null;
  };

  // Mouse wheel zoom
  const handleWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    const delta = e.deltaY < 0 ? 0.12 : -0.12;
    const base = userZoom !== null ? userZoom : currentZoom;
    setUserZoom(Math.max(0.75, Math.min(2.5, +(base + delta).toFixed(2))));
  };

  // Map click to reposition pin
  const handleMapClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!onMapClickMovePin || status !== 'IDLE') return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = Math.max(10, Math.min(90, Math.round(((e.clientX - rect.left) / rect.width) * 100)));
    const y = Math.max(15, Math.min(85, Math.round(((e.clientY - rect.top) / rect.height) * 100)));
    onMapClickMovePin(x, y);
  };

  return (
    <div 
      onClick={handleMapClick}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onWheel={handleWheel}
      className={`relative w-full h-full overflow-hidden select-none ${
        status === 'IDLE' ? 'cursor-crosshair' : 'cursor-default'
      } ${isNightMode ? 'bg-[#0b1329]' : 'bg-[#e2e8f0]'}`}
    >
      
      {/* Zoomable & Auto-Centering Map Canvas Layer */}
      <div 
        className="absolute inset-0 w-full h-full origin-center"
        style={{ 
          transform: `translate(${panX}%, ${panY}%) scale(${currentZoom})`,
          transformOrigin: '50% 50%',
          transition: 'transform 700ms cubic-bezier(0.2, 0.8, 0.2, 1)'
        }}
      >
        {/* SVG Canvas Map Network */}
        <svg 
          viewBox="0 0 100 100" 
          preserveAspectRatio="none" 
          className="absolute inset-0 w-full h-full"
        >
          <defs>
            {/* Pickup -> Destination route gradient */}
            <linearGradient id="roadRouteGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#22c55e" />
              <stop offset="40%" stopColor="#0066FF" />
              <stop offset="100%" stopColor="#ef4444" />
            </linearGradient>

            {/* Driver -> Pickup route gradient */}
            <linearGradient id="driverApproachGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#38bdf8" />
              <stop offset="100%" stopColor="#10b981" />
            </linearGradient>

            <filter id="routeGlow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="0.8" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          {/* River / Water body accent */}
          <path
            d="M -5 32 Q 25 38 45 28 T 95 36 T 110 32 L 110 40 Q 95 44 45 36 T -5 40 Z"
            fill={isNightMode ? '#1e293b' : '#bfdbfe'}
            opacity={isNightMode ? 0.35 : 0.6}
          />

          {/* City Blocks / Commercial Districts */}
          <rect x="8" y="12" width="16" height="14" rx="2" fill={isNightMode ? '#131e3a' : '#cbd5e1'} opacity="0.4" />
          <rect x="28" y="10" width="22" height="12" rx="2" fill={isNightMode ? '#131e3a' : '#cbd5e1'} opacity="0.4" />
          <rect x="58" y="8" width="24" height="15" rx="2" fill={isNightMode ? '#131e3a' : '#cbd5e1'} opacity="0.4" />
          <rect x="12" y="66" width="20" height="18" rx="2" fill={isNightMode ? '#131e3a' : '#cbd5e1'} opacity="0.4" />
          <rect x="42" y="70" width="28" height="16" rx="2" fill={isNightMode ? '#131e3a' : '#cbd5e1'} opacity="0.4" />

          {/* Secondary Grid Streets */}
          <g stroke={isNightMode ? '#1e293b' : '#cbd5e1'} strokeWidth="0.8" opacity="0.7">
            <line x1="0" y1="20" x2="100" y2="20" />
            <line x1="0" y1="48" x2="100" y2="48" />
            <line x1="0" y1="65" x2="100" y2="65" />
            <line x1="0" y1="84" x2="100" y2="84" />
            <line x1="20" y1="0" x2="20" y2="100" />
            <line x1="45" y1="0" x2="45" y2="100" />
            <line x1="68" y1="0" x2="68" y2="100" />
            <line x1="88" y1="0" x2="88" y2="100" />
          </g>

          {/* Major Arterial Expressways */}
          <path
            d="M -5 55 Q 35 50 65 60 T 110 50"
            fill="none"
            stroke={isNightMode ? '#334155' : '#94a3b8'}
            strokeWidth="2.5"
            strokeLinecap="round"
          />
          <path
            d="M 25 -5 Q 32 45 60 70 T 80 110"
            fill="none"
            stroke={isNightMode ? '#334155' : '#94a3b8'}
            strokeWidth="2.5"
            strokeLinecap="round"
          />

          {/* Outer Ring Road (ORR) Expressway */}
          <path
            d="M 5 85 C 20 20, 80 15, 95 85"
            fill="none"
            stroke={isNightMode ? '#1d4ed8' : '#3b82f6'}
            strokeWidth="1.6"
            strokeDasharray="2 1"
            opacity="0.8"
          />

          {/* 1. ACTUAL ROAD ROUTE BETWEEN PICKUP AND DESTINATION */}
          {roadRoute && (
            <>
              {/* Road route shadow casing */}
              <path
                d={roadRoute.pathD}
                fill="none"
                stroke={isNightMode ? '#0284c7' : '#93c5fd'}
                strokeWidth="4.5"
                opacity="0.25"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              {/* Vibrant Road route path */}
              <path
                d={roadRoute.pathD}
                fill="none"
                stroke="url(#roadRouteGrad)"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                filter="url(#routeGlow)"
                className="animate-dash"
              />
            </>
          )}

          {/* 2. DRIVER -> PICKUP ROUTE (Shown when Driver is approaching) */}
          {(isDriverApproaching || status === 'FINDING_DRIVER') && driverToPickupRoute && (
            <>
              <path
                d={driverToPickupRoute.pathD}
                fill="none"
                stroke="#38bdf8"
                strokeWidth="3.5"
                opacity="0.25"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d={driverToPickupRoute.pathD}
                fill="none"
                stroke="url(#driverApproachGrad)"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeDasharray="3 2"
                className="animate-dash"
              />
            </>
          )}
        </svg>

        {/* POI Landmark Markers on Map */}
        <div 
          onClick={(e) => {
            e.stopPropagation();
            onSelectMapCoord?.('Cyber Towers');
          }}
          className="absolute top-[28%] left-[28%] -translate-x-1/2 -translate-y-1/2 cursor-pointer group"
        >
          <div className="flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-slate-900/80 border border-slate-700/80 backdrop-blur-md text-[9px] font-bold text-slate-300 shadow group-hover:scale-105 transition">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
            <span>Cyber Towers</span>
          </div>
        </div>

        <div 
          onClick={(e) => {
            e.stopPropagation();
            onSelectMapCoord?.('Warangal Railway Station');
          }}
          className="absolute top-[62%] left-[34%] -translate-x-1/2 -translate-y-1/2 cursor-pointer group"
        >
          <div className="flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-slate-900/80 border border-slate-700/80 backdrop-blur-md text-[9px] font-bold text-slate-300 shadow group-hover:scale-105 transition">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
            <span>Warangal Stn</span>
          </div>
        </div>

        <div 
          onClick={(e) => {
            e.stopPropagation();
            onSelectMapCoord?.('Clock Tower Center');
          }}
          className="absolute top-[26%] left-[68%] -translate-x-1/2 -translate-y-1/2 cursor-pointer group"
        >
          <div className="flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-slate-900/80 border border-slate-700/80 backdrop-blur-md text-[9px] font-bold text-slate-300 shadow group-hover:scale-105 transition">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
            <span>Clock Tower</span>
          </div>
        </div>

        {/* BEFORE BOOKING: SHOW NEARBY AVAILABLE ONLINE DRIVERS AROUND PICKUP */}
        {showNearbyDrivers && (status === 'IDLE' || status === 'FINDING_DRIVER') && liveNearbyDrivers.map((d) => (
          <div
            key={d.id}
            style={{ top: `${d.y}%`, left: `${d.x}%` }}
            className="absolute -translate-x-1/2 -translate-y-1/2 pointer-events-none transition-all duration-700 ease-out z-10"
          >
            <div className="relative flex flex-col items-center">
              {/* Small modern 3D vehicle marker + rotation + shadow/glow */}
              <div 
                className="w-7 h-7 bg-slate-900/90 dark:bg-slate-950/90 rounded-full shadow-[0_0_8px_rgba(59,130,246,0.5),0_3px_6px_rgba(0,0,0,0.4)] border border-blue-400/60 flex items-center justify-center transition-transform duration-500"
                style={{
                  transform: `rotate(${d.heading}deg)`
                }}
              >
                <span className="text-sm select-none leading-none drop-shadow">
                  {d.icon}
                </span>
              </div>
              <span className="mt-0.5 text-[8px] font-extrabold px-1 rounded bg-slate-900/90 text-blue-300 border border-slate-800 shadow-xs">
                {d.name}
              </span>
              <div className="w-3.5 h-1 bg-black/40 rounded-full blur-[1px] mt-0.5"></div>
            </div>
          </div>
        ))}

        {/* PICKUP LOCATION MARKER (Shown after drop is selected or during ride) */}
        {pickup && drop && status !== 'IDLE' && (
          <div
            style={{ top: `${pickupJunction.y}%`, left: `${pickupJunction.x}%` }}
            className="absolute -translate-x-1/2 -translate-y-[100%] pointer-events-none z-20"
          >
            <div className="relative flex flex-col items-center">
              {/* Pickup badge */}
              <div className="mb-1 px-2 py-0.5 rounded-full bg-emerald-600 text-white font-black text-[9px] uppercase tracking-wider shadow-md flex items-center gap-1">
                <MapPin className="w-2.5 h-2.5" />
                <span>Pickup</span>
              </div>
              {/* Pin body */}
              <div className="w-4 h-4 rounded-full bg-emerald-500 border-2 border-white shadow-md"></div>
              <div className="w-0.5 h-3 bg-emerald-600"></div>
              {/* Ground ripple */}
              <div className="w-6 h-6 rounded-full border border-emerald-400/40 animate-ping-slow absolute top-[100%] left-1/2 -translate-x-1/2"></div>
            </div>
          </div>
        )}

        {/* DESTINATION MARKER */}
        {drop && (
          <div
            style={{ top: `${dropJunction.y}%`, left: `${dropJunction.x}%` }}
            className="absolute -translate-x-1/2 -translate-y-[100%] pointer-events-none z-20"
          >
            <div className="relative flex flex-col items-center">
              {/* Drop badge */}
              <div className="mb-1 px-2 py-0.5 rounded-full bg-rose-600 text-white font-black text-[9px] uppercase tracking-wider shadow-md flex items-center gap-1">
                <Flag className="w-2.5 h-2.5" />
                <span>Destination</span>
              </div>
              {/* Pin body */}
              <div className="w-4 h-4 rounded-full bg-rose-500 border-2 border-white shadow-md"></div>
              <div className="w-0.5 h-3 bg-rose-600"></div>
              {/* Ground ripple */}
              <div className="w-6 h-6 rounded-full border border-rose-400/40 animate-ping-slow absolute top-[100%] left-1/2 -translate-x-1/2"></div>
            </div>
          </div>
        )}

        {/* MODERN MINIMAL LOCATION PIN (When picking location in IDLE state) */}
        {showFixedPin && status === 'IDLE' && (
          <div
            style={{ top: `${pickupJunction.y}%`, left: `${pickupJunction.x}%` }}
            className="absolute -translate-x-1/2 -translate-y-[100%] z-40 transition-all duration-300 ease-out select-none pointer-events-none"
          >
            <div className="relative flex flex-col items-center">
              {/* Floating Modern Address Pill */}
              <div className="mb-1.5 px-3 py-1.5 bg-slate-900/95 backdrop-blur-md border border-slate-700/80 rounded-full shadow-[0_12px_30px_rgba(0,0,0,0.6)] flex items-center gap-2 max-w-[260px]">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse flex-shrink-0"></span>
                <span className="text-[11px] font-black text-white truncate leading-none">
                  {fixedPinAddress || pickup || 'Cyber Towers Main Gate, Hitec City'}
                </span>
              </div>

              {/* Sleek Pin Head & Needle */}
              <div className="relative flex flex-col items-center">
                <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-slate-950 via-slate-800 to-slate-900 border-2 border-emerald-400 shadow-xl flex items-center justify-center">
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 shadow-[0_0_10px_#34d399]"></div>
                </div>
                <div className="w-0.5 h-3 bg-gradient-to-b from-emerald-400 to-white shadow-[0_0_6px_rgba(52,211,153,0.8)]"></div>
                <div className="w-1 h-1 rounded-full bg-white"></div>
              </div>

              {/* Ground Target Reticle */}
              <div className="absolute top-[100%] left-1/2 -translate-x-1/2 pointer-events-none mt-0.5">
                <div className="relative flex items-center justify-center">
                  <div className="absolute w-8 h-8 rounded-full border border-emerald-400/30 animate-ping-slow"></div>
                  <div className="w-5 h-5 rounded-full border border-emerald-400/80 bg-emerald-500/10 flex items-center justify-center">
                    <div className="w-1 h-1 rounded-full bg-emerald-400"></div>
                  </div>
                  <div className="absolute -bottom-0.5 w-4 h-1 bg-black/40 rounded-full blur-[1px]"></div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 🚗 LIVE DRIVER VEHICLE MARKER (Moves smoothly along the road without jumping) */}
        {(isDriverApproaching || isDriverArrived || isTripInProgress || isTripFinished) && (
          <div
            style={{ 
              top: `${liveDriverState.y}%`, 
              left: `${liveDriverState.x}%`
            }}
            className="absolute -translate-x-1/2 -translate-y-1/2 pointer-events-none z-30 transition-all duration-300 ease-linear"
          >
            <div className="relative flex flex-col items-center">
              
              {/* Driver ETA & Status Bubble */}
              <div className="mb-1 px-2 py-0.5 rounded-lg bg-slate-900/95 border border-blue-500/50 shadow-xl flex items-center gap-1.5 whitespace-nowrap backdrop-blur-sm">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                <span className="text-[9px] font-black text-white">
                  {status === 'DRIVER_COMING' || status === 'ARRIVING' 
                    ? `Driver Coming • ${driverToPickupRoute.etaMin}m ETA`
                    : status === 'DRIVER_ASSIGNED'
                    ? 'Driver Assigned'
                    : status === 'DRIVER_ARRIVED'
                    ? 'Driver Arrived at Pickup!'
                    : status === 'TRIP_STARTED' || status === 'IN_PROGRESS'
                    ? `Trip Started • ${roadRoute?.totalDistanceKm || 5} km`
                    : 'Trip Completed'}
                </span>
              </div>

              {/* Small modern 3D vehicle marker + correct road direction + smooth movement */}
              <div 
                className="relative w-8 h-8 rounded-full bg-slate-900/90 dark:bg-slate-950/90 border border-blue-400/80 shadow-[0_0_12px_rgba(59,130,246,0.6),0_4px_8px_rgba(0,0,0,0.5)] flex items-center justify-center transition-transform duration-300 ease-linear"
                style={{
                  transform: `rotate(${liveDriverState.bearingDeg}deg)`
                }}
              >
                {/* Vehicle icon sized cleanly (small, distinct, crisp) */}
                <span className="text-base select-none leading-none drop-shadow filter">
                  {vehicleIcon}
                </span>

                {/* Subtle directional orientation pointer */}
                <div className="absolute -top-1 w-1.5 h-1.5 bg-blue-400 rotate-45 rounded-[1px] shadow-[0_0_4px_#60a5fa]"></div>
              </div>

              {/* Driver License Plate & Vehicle Name Tag */}
              <div className="mt-1 flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-black/85 text-white text-[8px] font-bold border border-slate-700/80 shadow-md">
                <span className="text-blue-400 font-semibold">{vehicleTierName}</span>
                <span className="text-slate-500">•</span>
                <span className="font-mono">{driverPlate}</span>
              </div>
              <div className="w-5 h-1 bg-black/40 rounded-full blur-[1px] mt-0.5"></div>
            </div>
          </div>
        )}

      </div>

      {/* TOP FLOATING ROUTE INFORMATION HUD (When road route is confirmed) */}
      {roadRoute && (
        <div className="absolute top-12 left-4 right-14 z-30 pointer-events-auto">
          <div className="bg-slate-900/95 backdrop-blur-md border border-slate-700/80 rounded-2xl p-3 shadow-2xl space-y-2">
            
            {/* Road Distance & Travel Time Header */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded-lg bg-blue-500/20 text-brand-blue font-black text-[10px] uppercase tracking-wider border border-blue-500/30">
                  Actual Road Route
                </span>
                <span className="text-xs font-black text-white">
                  {roadRoute.totalDistanceKm} km
                </span>
              </div>

              <div className="flex items-center gap-1.5 text-emerald-400 text-xs font-black">
                <Clock className="w-3.5 h-3.5" />
                <span>~{roadRoute.estimatedTravelTimeMin} mins</span>
              </div>
            </div>

            {/* Pickup & Destination Addresses (No coordinates exposed!) */}
            <div className="space-y-1 text-xs">
              <div className="flex items-center gap-2 text-slate-300 truncate">
                <span className="w-2 h-2 rounded-full bg-emerald-500 flex-shrink-0"></span>
                <span className="font-bold truncate">{roadRoute.pickupAddress}</span>
              </div>
              <div className="flex items-center gap-2 text-slate-300 truncate">
                <span className="w-2 h-2 rounded-full bg-rose-500 flex-shrink-0"></span>
                <span className="font-bold truncate">{roadRoute.dropAddress}</span>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* Floating Zoom & Map Style Overlay Controls */}
      <div className="absolute top-12 right-3 z-30 flex flex-col gap-2">
        {onToggleNightMode && (
          <button 
            onClick={(e) => {
              e.stopPropagation();
              onToggleNightMode();
            }}
            title="Toggle Map Style"
            className="w-8 h-8 rounded-full bg-slate-900/85 border border-slate-700 backdrop-blur-md text-slate-300 flex items-center justify-center shadow-lg hover:bg-slate-800 transition active:scale-95"
          >
            {isNightMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-blue-500" />}
          </button>
        )}

        {/* Zoom In Button */}
        <button 
          onClick={(e) => {
            e.stopPropagation();
            const base = userZoom !== null ? userZoom : currentZoom;
            setUserZoom(Math.min(2.5, +(base + 0.25).toFixed(2)));
          }}
          title="Zoom In"
          className="w-8 h-8 rounded-full bg-slate-900/85 border border-slate-700 backdrop-blur-md text-slate-300 flex items-center justify-center shadow-lg hover:bg-slate-800 transition active:scale-95"
        >
          <ZoomIn className="w-4 h-4 text-emerald-400" />
        </button>

        {/* Zoom Out Button */}
        <button 
          onClick={(e) => {
            e.stopPropagation();
            const base = userZoom !== null ? userZoom : currentZoom;
            setUserZoom(Math.max(0.75, +(base - 0.25).toFixed(2)));
          }}
          title="Zoom Out"
          className="w-8 h-8 rounded-full bg-slate-900/85 border border-slate-700 backdrop-blur-md text-slate-300 flex items-center justify-center shadow-lg hover:bg-slate-800 transition active:scale-95"
        >
          <ZoomOut className="w-4 h-4 text-blue-400" />
        </button>

        {/* Reset Zoom Button */}
        {userZoom !== null && (
          <button 
            onClick={(e) => {
              e.stopPropagation();
              setUserZoom(null);
            }}
            title="Reset to Auto-Fit"
            className="w-8 h-8 rounded-full bg-slate-900/85 border border-slate-700 backdrop-blur-md text-slate-300 flex items-center justify-center shadow-lg hover:bg-slate-800 transition active:scale-95 text-[10px] font-mono font-bold"
          >
            <RotateCcw className="w-3.5 h-3.5 text-amber-400" />
          </button>
        )}
      </div>

      {/* Safety & Navigation hint badge */}
      <div className="absolute bottom-2 left-3 z-30 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-900/85 border border-slate-800/90 backdrop-blur-md text-[10px] font-bold text-slate-300 pointer-events-none">
        <ShieldAlert className="w-3.5 h-3.5 text-emerald-400" />
        <span>Live GPS Road Tracking • Two-finger zoom</span>
      </div>

    </div>
  );
};
