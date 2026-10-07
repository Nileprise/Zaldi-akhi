import React, { useMemo, useState, useRef, useEffect, useCallback } from 'react';
import { 
  Compass, Navigation, Sun, Moon, ShieldAlert, 
  RotateCcw, MapPin, Clock, CheckCircle2
} from 'lucide-react';
import { BookingStatus, RoutePoint } from '../types';
import { 
  generateActualRoadRoute, 
  generateDriverToPickupRoute, 
  getPointAlongRoad, 
  calculateAutoBoundingBox,
  resolveAddressToRoadJunction 
} from '../services/routeService';
import { Boy3dPin, LocationPinType } from './Boy3dPin';
import { LiveMapVehicleMarker, Destination3dPin } from './Vehicle3dIcon';
import { 
  reverseGeocodeRealWorldAddress, 
  DEFAULT_GPS_COORDS, 
  DEFAULT_GPS_ADDRESS 
} from '../services/geocodingService';
import { sounds } from '../services/audio';

interface InteractiveMapProps {
  pickup: string;
  drop: string;
  status: BookingStatus;
  progressPercent?: number;
  vehicleTierName?: string;
  vehicleIcon?: string;
  isNightMode?: boolean;
  onToggleNightMode?: () => void;
  showNearbyDrivers?: boolean;
  driverName?: string;
  driverPlate?: string;
  // Fixed Location Pin props
  showFixedPin?: boolean;
  fixedPinAddress?: string;
  fixedPinPos?: { x: number; y: number };
  onMapCenterChange?: (center: { x: number; y: number }, address: string, isMoving: boolean) => void;
  onAddressResolved?: (address: string, center: { x: number; y: number }) => void;
  onConfirmLocation?: (address: string) => void;
  onUseCurrentLocation?: () => void;
  locationPinType?: LocationPinType;
  onChangePinType?: (type: LocationPinType) => void;
}

export const InteractiveMap: React.FC<InteractiveMapProps> = ({
  pickup,
  drop,
  status,
  progressPercent = 0,
  vehicleTierName = 'Cab',
  isNightMode = true,
  onToggleNightMode,
  showNearbyDrivers = true,
  driverPlate = 'TS 09 AB 1234',
  showFixedPin = true,
  fixedPinAddress,
  fixedPinPos,
  onMapCenterChange,
  onAddressResolved,
  onConfirmLocation,
  onUseCurrentLocation,
  locationPinType,
  onChangePinType
}) => {
  // Container ref for client bounding rect
  const mapContainerRef = useRef<HTMLDivElement>(null);

  // Center coordinate of the map in 0-100 canvas units
  // Map moves underneath the fixed center pin!
  const [mapCenter, setMapCenter] = useState<{ x: number; y: number }>(
    fixedPinPos || DEFAULT_GPS_COORDS
  );

  // Live resolved real-world address (No lat/lng displayed!)
  const [liveAddress, setLiveAddress] = useState<string>(
    fixedPinAddress || pickup || DEFAULT_GPS_ADDRESS
  );

  // Dragging and map movement tracking
  const [isDragging, setIsDragging] = useState(false);
  const [isMapMoving, setIsMapMoving] = useState(false);
  const dragStartRef = useRef<{ clientX: number; clientY: number; startCenter: { x: number; y: number } } | null>(null);
  const stopTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Manual Zoom state
  const [userZoom, setUserZoom] = useState<number | null>(null);
  const touchDistRef = useRef<number | null>(null);
  const [activePinType, setActivePinType] = useState<LocationPinType>(locationPinType || 'character_pin');

  // Sync prop pinType if provided
  useEffect(() => {
    if (locationPinType) {
      setActivePinType(locationPinType);
    }
  }, [locationPinType]);

  // Sync external pickup address or coords if provided when not dragging
  useEffect(() => {
    if (!isDragging && fixedPinPos) {
      setMapCenter(fixedPinPos);
    }
  }, [fixedPinPos, isDragging]);

  useEffect(() => {
    if (!isDragging && fixedPinAddress) {
      setLiveAddress(fixedPinAddress);
    }
  }, [fixedPinAddress, isDragging]);

  const handleCyclePinType = () => {
    const types: LocationPinType[] = ['character_pin', 'teardrop_3d', 'compact_boy'];
    const next = types[(types.indexOf(activePinType) + 1) % types.length];
    setActivePinType(next);
    onChangePinType?.(next);
  };

  // Simulated live nearby drivers before booking - dynamically anchored around current map center
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
    if (status === 'IDLE') return mapCenter;
    if (!pickup) return mapCenter;
    return resolveAddressToRoadJunction(pickup);
  }, [status, pickup, mapCenter]);

  // Live positions of nearby drivers dynamically surrounding the customer's pickup area
  const liveNearbyDrivers = useMemo(() => {
    const center = status === 'IDLE' ? mapCenter : (pickup ? pickupJunction : mapCenter);
    return nearbyDriverOffsets.map(d => ({
      ...d,
      x: Math.max(8, Math.min(92, +(center.x + d.dx).toFixed(1))),
      y: Math.max(12, Math.min(88, +(center.y + d.dy).toFixed(1)))
    }));
  }, [status, pickup, pickupJunction, mapCenter, nearbyDriverOffsets]);

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
      const fraction = Math.min(1, Math.max(0, progressPercent / 100));
      return getPointAlongRoad(driverToPickupRoute.points, fraction);
    }
    if (isDriverArrived) {
      return { x: pickupJunction.x, y: pickupJunction.y, bearingDeg: 0 };
    }
    if (isTripInProgress && roadRoute) {
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
      return { centerX: mapCenter.x, centerY: mapCenter.y, scale: 1 };
    }
    return calculateAutoBoundingBox(
      roadRoute.points, 
      (isDriverApproaching || isTripInProgress) ? liveDriverState : null
    );
  }, [roadRoute, mapCenter, isDriverApproaching, isTripInProgress, liveDriverState]);

  // Effective zoom (manual overrides auto if user pinched/wheeled)
  const currentZoom = userZoom !== null ? userZoom : (roadRoute ? autoBox.scale : 1);

  // Pan offsets: When IDLE, center is exactly mapCenter so that map moves underneath fixed screen center pin!
  const panX = status === 'IDLE' 
    ? +(50 - mapCenter.x).toFixed(2)
    : (userZoom !== null ? 0 : (roadRoute ? +( (50 - autoBox.centerX) * 0.75 ).toFixed(2) : 0));

  const panY = status === 'IDLE'
    ? +(50 - mapCenter.y).toFixed(2)
    : (userZoom !== null ? 0 : (roadRoute ? +( (50 - autoBox.centerY) * 0.75 ).toFixed(2) : 0));

  // Pointer dragging event handlers (Pan map underneath fixed pin)
  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (status !== 'IDLE') return;
    if ((e.target as HTMLElement).closest('button')) return;

    try {
      (e.currentTarget as HTMLDivElement).setPointerCapture(e.pointerId);
    } catch {}

    dragStartRef.current = {
      clientX: e.clientX,
      clientY: e.clientY,
      startCenter: { ...mapCenter }
    };
    setIsDragging(true);
    setIsMapMoving(true);

    if (stopTimeoutRef.current) {
      clearTimeout(stopTimeoutRef.current);
      stopTimeoutRef.current = null;
    }
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!dragStartRef.current || !isDragging) return;
    const rect = mapContainerRef.current?.getBoundingClientRect();
    if (!rect) return;

    const dx = e.clientX - dragStartRef.current.clientX;
    const dy = e.clientY - dragStartRef.current.clientY;

    const scale = currentZoom;
    const mapDx = (dx / (rect.width * scale)) * 100;
    const mapDy = (dy / (rect.height * scale)) * 100;

    const newX = Math.max(8, Math.min(92, +(dragStartRef.current.startCenter.x - mapDx).toFixed(2)));
    const newY = Math.max(12, Math.min(88, +(dragStartRef.current.startCenter.y - mapDy).toFixed(2)));

    setMapCenter({ x: newX, y: newY });
    setIsMapMoving(true);

    // Continuously read real-time center coordinates and reverse geocode
    const addr = reverseGeocodeRealWorldAddress(newX, newY);
    setLiveAddress(addr);
    onMapCenterChange?.({ x: newX, y: newY }, addr, true);

    // Debounce settlement: after map stops moving, automatically update address
    if (stopTimeoutRef.current) clearTimeout(stopTimeoutRef.current);
    stopTimeoutRef.current = setTimeout(() => {
      setIsMapMoving(false);
      onAddressResolved?.(addr, { x: newX, y: newY });
    }, 220);
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDragging) return;
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {}
    setIsDragging(false);
    dragStartRef.current = null;

    if (stopTimeoutRef.current) clearTimeout(stopTimeoutRef.current);
    setIsMapMoving(false);

    // Address updates automatically after the map stops
    const finalAddr = reverseGeocodeRealWorldAddress(mapCenter.x, mapCenter.y);
    setLiveAddress(finalAddr);
    onAddressResolved?.(finalAddr, mapCenter);
  };

  // Return to Device's GPS Position
  const handleUseCurrentLocation = useCallback((e?: React.MouseEvent) => {
    e?.stopPropagation();
    sounds.playTap();

    const applyGPSCenter = (targetX: number, targetY: number) => {
      setMapCenter({ x: targetX, y: targetY });
      const addr = reverseGeocodeRealWorldAddress(targetX, targetY);
      setLiveAddress(addr);
      onAddressResolved?.(addr, { x: targetX, y: targetY });
      onUseCurrentLocation?.();
    };

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        () => {
          applyGPSCenter(DEFAULT_GPS_COORDS.x, DEFAULT_GPS_COORDS.y);
        },
        () => {
          applyGPSCenter(DEFAULT_GPS_COORDS.x, DEFAULT_GPS_COORDS.y);
        },
        { timeout: 3500 }
      );
    } else {
      applyGPSCenter(DEFAULT_GPS_COORDS.x, DEFAULT_GPS_COORDS.y);
    }
  }, [onAddressResolved, onUseCurrentLocation]);

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

  return (
    <div 
      ref={mapContainerRef}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onWheel={handleWheel}
      className={`relative w-full h-full overflow-hidden select-none touch-none ${
        status === 'IDLE' ? (isDragging ? 'cursor-grabbing' : 'cursor-grab') : 'cursor-default'
      } ${isNightMode ? 'bg-[#0b1329]' : 'bg-[#e2e8f0]'}`}
    >
      
      {/* Zoomable & Panning Map Canvas Layer (Moves underneath the fixed pin!) */}
      <div 
        className="absolute inset-0 w-full h-full origin-center"
        style={{ 
          transform: `translate(${panX}%, ${panY}%) scale(${currentZoom})`,
          transformOrigin: '50% 50%',
          transition: isDragging ? 'none' : 'transform 600ms cubic-bezier(0.2, 0.8, 0.2, 1)'
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
            <line x1="0" y1="40" x2="100" y2="40" />
            <line x1="0" y1="60" x2="100" y2="60" />
            <line x1="0" y1="80" x2="100" y2="80" />
            <line x1="20" y1="0" x2="20" y2="100" />
            <line x1="40" y1="0" x2="40" y2="100" />
            <line x1="60" y1="0" x2="60" y2="100" />
            <line x1="80" y1="0" x2="80" y2="100" />
          </g>

          {/* Outer Ring Road (ORR Expressway Arc) */}
          <path
            d="M 5 85 Q 20 40 50 18 T 95 15"
            fill="none"
            stroke={isNightMode ? '#334155' : '#94a3b8'}
            strokeWidth="2.5"
            strokeLinecap="round"
          />

          {/* Major City Arterial Roads */}
          <g stroke={isNightMode ? '#27354f' : '#b0c4de'} strokeWidth="1.8">
            <line x1="10" y1="46" x2="90" y2="46" />
            <line x1="28" y1="10" x2="28" y2="90" />
            <line x1="48" y1="15" x2="48" y2="85" />
            <line x1="68" y1="10" x2="68" y2="90" />
            <line x1="15" y1="35" x2="85" y2="75" />
          </g>

          {/* 1. ACTUAL ROAD ROUTE: PICKUP -> DESTINATION */}
          {roadRoute && (
            <>
              {/* Outer Glow Outline */}
              <path
                d={roadRoute.pathD}
                fill="none"
                stroke="#0066FF"
                strokeWidth="4.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                opacity="0.45"
                filter="url(#routeGlow)"
              />
              {/* Main Vivid Colored Road Route */}
              <path
                d={roadRoute.pathD}
                fill="none"
                stroke="url(#roadRouteGrad)"
                strokeWidth="2.6"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              {/* Dashed animated flow line inside route */}
              <path
                d={roadRoute.pathD}
                fill="none"
                stroke="#ffffff"
                strokeWidth="1.2"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeDasharray="4 4"
                className="animate-dash"
                opacity="0.9"
              />
            </>
          )}

          {/* 2. DRIVER APPROACH ROUTE: DRIVER -> PICKUP */}
          {isDriverApproaching && driverToPickupRoute && (
            <>
              <path
                d={driverToPickupRoute.pathD}
                fill="none"
                stroke="#38bdf8"
                strokeWidth="4"
                strokeLinecap="round"
                strokeLinejoin="round"
                opacity="0.4"
                filter="url(#routeGlow)"
              />
              <path
                d={driverToPickupRoute.pathD}
                fill="none"
                stroke="url(#driverApproachGrad)"
                strokeWidth="2.4"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d={driverToPickupRoute.pathD}
                fill="none"
                stroke="#ffffff"
                strokeWidth="1.2"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeDasharray="3 2"
                className="animate-dash"
              />
            </>
          )}
        </svg>

        {/* Authentic POI Landmark Marker (Cyber Towers & Clock Tower strictly removed) */}
        <div 
          className="absolute top-[62%] left-[34%] -translate-x-1/2 -translate-y-1/2 pointer-events-none"
        >
          <div className="flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-slate-900/80 border border-slate-700/80 backdrop-blur-md text-[9px] font-bold text-slate-300 shadow">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
            <span>Warangal Stn</span>
          </div>
        </div>

        {/* BEFORE BOOKING: SHOW NEARBY AVAILABLE ONLINE DRIVERS AROUND PICKUP */}
        {showNearbyDrivers && (status === 'IDLE' || status === 'FINDING_DRIVER') && liveNearbyDrivers.map((d) => {
          const type = d.id === 'd-bike' ? 'BIKE' : d.id === 'd-auto' ? 'AUTO' : d.id === 'd-cab' ? 'CAB' : 'TRUCK';
          return (
            <div
              key={d.id}
              style={{ top: `${d.y}%`, left: `${d.x}%` }}
              className="absolute -translate-x-1/2 -translate-y-1/2 pointer-events-none transition-all duration-700 ease-out z-10"
            >
              <LiveMapVehicleMarker 
                type={type}
                heading={d.heading}
                size={34}
              />
            </div>
          );
        })}

        {/* 🏁 DESTINATION 3D PIN (When route is active) */}
        {drop && roadRoute && (
          <div
            style={{ top: `${dropJunction.y}%`, left: `${dropJunction.x}%` }}
            className="absolute -translate-x-1/2 -translate-y-full z-20 pointer-events-none"
          >
            <Destination3dPin address={drop} />
          </div>
        )}

        {/* 🚗 LIVE DRIVER VEHICLE MARKER (Moves smoothly along the road) */}
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

              {/* 3D Live Vehicle Marker (Directly on road, no background circle/box) */}
              <LiveMapVehicleMarker 
                type={vehicleTierName || 'CAB'}
                heading={liveDriverState.bearingDeg}
                size={38}
              />

              {/* Driver License Plate Tag */}
              <div className="mt-1 flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-black/85 text-white text-[8px] font-bold border border-slate-700/80 shadow-md">
                <span className="text-blue-400 font-semibold">{vehicleTierName}</span>
                <span className="text-slate-500">•</span>
                <span className="font-mono">{driverPlate}</span>
              </div>
            </div>
          </div>
        )}

      </div>

      {/* 📍 THE PIN STAYS FIXED ON THE SCREEN WHILE THE MAP MOVES UNDERNEATH IT */}
      {showFixedPin && status === 'IDLE' && (
        <div 
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-[88%] z-40 pointer-events-none select-none flex flex-col items-center"
        >
          {/* Subtle instruction while moving / detected real-world address when stopped */}
          {isMapMoving ? (
            <div className="mb-2 px-3 py-1 bg-slate-900/90 backdrop-blur-md border border-emerald-500/60 rounded-full shadow-2xl flex items-center gap-1.5 animate-pulse">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping flex-shrink-0" />
              <span className="text-[11px] font-bold text-slate-100 tracking-wide">
                Move map to select location
              </span>
            </div>
          ) : (
            <div className="mb-2 px-3 py-1 bg-slate-900/95 backdrop-blur-md border border-emerald-500/50 rounded-full shadow-2xl flex items-center gap-1.5 max-w-[270px] animate-in fade-in">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse flex-shrink-0" />
              <span className="text-[11px] font-black text-white truncate">
                {liveAddress || pickup || DEFAULT_GPS_ADDRESS}
              </span>
            </div>
          )}

          {/* 3D Boy Pin Pointer (Slight lift effect when dragging map) */}
          <div className={`transition-transform duration-200 ease-out flex flex-col items-center ${
            isMapMoving ? '-translate-y-2.5 scale-105' : 'translate-y-0 scale-100'
          }`}>
            <Boy3dPin 
              showAddressBadge={false}
              pinType={activePinType}
            />
          </div>
        </div>
      )}

      {/* TOP FLOATING ROUTE INFORMATION HUD (Cleanly below header bar, never hidden!) */}
      {roadRoute && (
        <div className="absolute top-24 left-4 right-4 z-30 pointer-events-auto">
          <div className="bg-slate-900/95 backdrop-blur-md border border-slate-700/80 rounded-2xl p-3 shadow-2xl space-y-2">
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

      {/* Floating Map Style & Pin Type Overlay Controls (Cleanly below header, never hidden!) */}
      <div className="absolute top-24 right-3.5 z-30 flex flex-col gap-2">
        {onToggleNightMode && (
          <button 
            onClick={(e) => {
              e.stopPropagation();
              onToggleNightMode();
            }}
            title="Toggle Map Style (Day/Night)"
            className="w-8 h-8 rounded-full bg-slate-900/85 border border-slate-700 backdrop-blur-md text-slate-300 flex items-center justify-center shadow-lg hover:bg-slate-800 transition active:scale-95"
          >
            {isNightMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-blue-500" />}
          </button>
        )}

        {/* Location Pin Pointer Style Switcher */}
        <button 
          onClick={(e) => {
            e.stopPropagation();
            handleCyclePinType();
          }}
          title={`Pin Type: ${activePinType === 'character_pin' ? 'Sleek Character Pin' : activePinType === 'teardrop_3d' ? '3D Teardrop Pin' : 'Compact Character'} (Click to switch)`}
          className="w-8 h-8 rounded-full bg-slate-900/85 border border-slate-700 backdrop-blur-md text-emerald-400 flex items-center justify-center shadow-lg hover:bg-slate-800 transition active:scale-95"
        >
          <MapPin className="w-4 h-4 text-emerald-400" />
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

      {/* “Use Current Location” button on the map (Cleanly below Zaldi Fast, never hidden!) */}
      {status === 'IDLE' && (
        <div className="absolute top-24 left-3.5 z-30">
          <button
            onClick={handleUseCurrentLocation}
            title="Return map to device GPS position"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-2xl bg-slate-900/90 border border-slate-700/80 hover:border-emerald-500/80 backdrop-blur-md text-white text-[11px] font-bold shadow-xl hover:bg-slate-800 transition active:scale-95 group"
          >
            <Navigation className="w-3.5 h-3.5 text-emerald-400 group-hover:rotate-45 transition-transform flex-shrink-0" />
            <span>Use Current Location</span>
          </button>
        </div>
      )}

      {/* “Confirm Location” floating action button on map when picking pickup */}
      {status === 'IDLE' && (
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-30 w-[90%] max-w-xs pointer-events-auto">
          <button
            onClick={(e) => {
              e.stopPropagation();
              sounds.playSuccess();
              const confirmed = liveAddress || pickup || DEFAULT_GPS_ADDRESS;
              onConfirmLocation?.(confirmed);
            }}
            className="w-full py-2.5 px-4 bg-emerald-500 hover:bg-emerald-600 active:scale-[0.98] text-white font-black text-xs sm:text-sm rounded-2xl shadow-xl shadow-emerald-500/30 flex items-center justify-center gap-2 transition"
          >
            <CheckCircle2 className="w-4 h-4 text-white flex-shrink-0" />
            <span>Confirm Location</span>
          </button>
        </div>
      )}

      {/* Safety & Drag Hint */}
      {status !== 'IDLE' && (
        <div className="absolute bottom-2 left-3 z-30 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-900/85 border border-slate-800/90 backdrop-blur-md text-[10px] font-bold text-slate-300 pointer-events-none">
          <ShieldAlert className="w-3.5 h-3.5 text-emerald-400" />
          <span>Live GPS Road Tracking</span>
        </div>
      )}

    </div>
  );
};
