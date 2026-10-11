import React, { useMemo, useState, useRef, useEffect, useCallback } from 'react';
import { 
  Compass, Navigation, Sun, Moon, ShieldAlert, 
  RotateCcw, Clock, CheckCircle2, Layers, Crosshair, 
  Radio, Train, Activity, Eye, SlidersHorizontal, Sparkles,
  Search, X
} from 'lucide-react';
import boyPinImage from '../assets/images/boy_3d_pin_transparent.png';
import { BookingStatus, RoutePoint } from '../types';
import { 
  generateActualRoadRoute, 
  generateDriverToPickupRoute, 
  getPointAlongRoad, 
  calculateAutoBoundingBox,
  resolveAddressToRoadJunction 
} from '../services/routeService';
import { AnimatedLocationPin, PinStyleType } from './AnimatedLocationPin';
import { LiveMapVehicleMarker, Destination3dPin } from './Vehicle3dIcon';
import { 
  reverseGeocodeRealWorldAddress, 
  DEFAULT_GPS_COORDS, 
  DEFAULT_GPS_ADDRESS 
} from '../services/geocodingService';
import { sounds } from '../services/audio';

export type MapBaseLayerStyle = 'standard' | 'night' | 'satellite';

export interface MapLayerOptions {
  traffic: boolean;
  transit: boolean;
  fleetGIS: boolean;
}

interface InteractiveMapProps {
  pickup: string;
  drop: string;
  status: BookingStatus;
  progressPercent?: number;
  vehicleTierName?: string;
  selectedVehicleId?: string;
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
  locationPinType?: any;
  onChangePinType?: (type: any) => void;
  onEditPickup?: () => void;
  onUpdatePickup?: (newPickup: string) => void;
  // Carpool Corridor Props
  carpoolRoutePolyline?: RoutePoint[];
  carpoolStops?: { id: string; name: string; location: { x: number; y: number } }[];
  carpoolDriverPos?: { x: number; y: number; headingDeg: number };
  carpoolDriverName?: string;
  isCarpoolActive?: boolean;
}

export const InteractiveMap: React.FC<InteractiveMapProps> = ({
  pickup,
  drop,
  status,
  progressPercent = 0,
  vehicleTierName = 'Cab',
  selectedVehicleId,
  isNightMode = false,
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
  onChangePinType,
  onEditPickup,
  onUpdatePickup,
  carpoolRoutePolyline,
  carpoolStops,
  carpoolDriverPos,
  carpoolDriverName,
  isCarpoolActive = false
}) => {
  // Container ref for client bounding rect
  const mapContainerRef = useRef<HTMLDivElement>(null);

  // Center coordinate of the map in 0-100 canvas units (Map moves underneath fixed pin!)
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

  // Locating animation state (triggered on GPS Current Location click)
  const [isLocating, setIsLocating] = useState(false);
  const [locationToast, setLocationToast] = useState<string | null>(null);

  // Manual Zoom state
  const [userZoom, setUserZoom] = useState<number | null>(null);
  const touchDistRef = useRef<number | null>(null);

  // Active route pickup pin inline search bar edit state
  const [isRoutePillEditing, setIsRoutePillEditing] = useState(false);
  const [routePillInput, setRoutePillInput] = useState(pickup || '');

  useEffect(() => {
    if (!isRoutePillEditing) {
      setRoutePillInput(pickup || '');
    }
  }, [pickup, isRoutePillEditing]);

  const handleUpdatePickupAddress = useCallback((newAddr: string) => {
    const finalAddr = newAddr.trim();
    if (!finalAddr) return;
    sounds.playSuccess();
    setLiveAddress(finalAddr);
    // Pan map to resolved junction for this address
    const resolvedJunction = resolveAddressToRoadJunction(finalAddr);
    setMapCenter(resolvedJunction);
    onAddressResolved?.(finalAddr, resolvedJunction);
    onConfirmLocation?.(finalAddr);
    onUpdatePickup?.(finalAddr);
  }, [onAddressResolved, onConfirmLocation, onUpdatePickup]);

  const handleCommitRoutePill = () => {
    const val = routePillInput.trim();
    setIsRoutePillEditing(false);
    if (val && val !== pickup) {
      handleUpdatePickupAddress(val);
    } else {
      setRoutePillInput(pickup || '');
    }
  };

  // Pin style selector
  const [activePinStyle, setActivePinStyle] = useState<PinStyleType>(
    (locationPinType as PinStyleType) || 'animated_radar'
  );

  // Map Layers state
  const [showLayersMenu, setShowLayersMenu] = useState(false);
  const [baseLayerStyle, setBaseLayerStyle] = useState<MapBaseLayerStyle>(
    isNightMode ? 'night' : 'standard'
  );
  const [layers, setLayers] = useState<MapLayerOptions>({
    traffic: true,
    transit: false,
    fleetGIS: true
  });

  // Keep night mode synchronized
  useEffect(() => {
    if (isNightMode && baseLayerStyle === 'standard') {
      setBaseLayerStyle('night');
    } else if (!isNightMode && baseLayerStyle === 'night') {
      setBaseLayerStyle('standard');
    }
  }, [isNightMode]);

  // Sync prop pinType if provided
  useEffect(() => {
    if (locationPinType) {
      if (locationPinType === 'character_pin' || locationPinType === 'precision_crosshair' || locationPinType === 'animated_radar') {
        setActivePinStyle(locationPinType as PinStyleType);
      }
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

  const handleCyclePinStyle = () => {
    const styles: PinStyleType[] = ['animated_radar', 'precision_crosshair', 'character_pin'];
    const next = styles[(styles.indexOf(activePinStyle) + 1) % styles.length];
    setActivePinStyle(next);
    onChangePinType?.(next);
    sounds.playPop();
  };

  // Normalize selected vehicle type to match 5D vehicle themes ('BIKE', 'AUTO', 'CAB', 'PREMIUM', 'TRUCK', 'PARCEL')
  const normalizedVehicleType = useMemo(() => {
    const raw = (selectedVehicleId || vehicleTierName || 'AUTO').toUpperCase();
    if (raw.includes('BIKE') || raw.includes('MOTO')) return 'BIKE';
    if (raw.includes('AUTO') || raw.includes('TUKTUK') || raw.includes('3W')) return 'AUTO';
    if (raw.includes('PREMIUM') || raw.includes('SUV') || raw.includes('XL') || raw.includes('PRIME')) return 'PREMIUM';
    if (raw.includes('TRUCK') || raw.includes('HAUL') || raw.includes('CARGO')) return 'TRUCK';
    if (raw.includes('PARCEL')) return 'PARCEL';
    return 'CAB';
  }, [selectedVehicleId, vehicleTierName]);

  // 1. Resolve Pickup and Destination road junctions (anchors to pickup address if set, else current location / fixed pin)
  const pickupJunction = useMemo(() => {
    if (pickup && pickup.trim()) return resolveAddressToRoadJunction(pickup);
    return fixedPinPos || mapCenter;
  }, [pickup, fixedPinPos, mapCenter]);

  // Simulated live nearby drivers before booking - dynamically cruising along real roads around current/pickup location
  const [nearbyDriverOffsets, setNearbyDriverOffsets] = useState([
    { id: 'auto-1', dx: -6.5, dy: -4.5, heading: 90, speed: 0.18, dirX: 1, dirY: 0, roadAxis: 'x' as const },
    { id: 'auto-2', dx: 5.5, dy: -5.0, heading: 180, speed: 0.22, dirX: 0, dirY: 1, roadAxis: 'y' as const },
    { id: 'auto-3', dx: -7.0, dy: 4.8, heading: 270, speed: 0.19, dirX: -1, dirY: 0, roadAxis: 'x' as const },
    { id: 'auto-4', dx: 6.2, dy: 6.0, heading: 0, speed: 0.24, dirX: 0, dirY: -1, roadAxis: 'y' as const },
    { id: 'auto-5', dx: -2.5, dy: 7.2, heading: 90, speed: 0.16, dirX: 1, dirY: 0, roadAxis: 'x' as const },
    { id: 'auto-6', dx: 3.8, dy: -7.0, heading: 270, speed: 0.21, dirX: -1, dirY: 0, roadAxis: 'x' as const },
  ]);

  // Real-time smooth dynamic tracking & road movement of nearby drivers
  useEffect(() => {
    if (status !== 'IDLE' && status !== 'FINDING_DRIVER') return;
    const interval = setInterval(() => {
      setNearbyDriverOffsets(prev => prev.map(d => {
        let newDx = d.dx;
        let newDy = d.dy;
        let newDirX = d.dirX;
        let newDirY = d.dirY;
        let newHeading = d.heading;
        let newAxis = d.roadAxis;

        if (d.roadAxis === 'x') {
          newDx = +(d.dx + d.dirX * d.speed).toFixed(3);
          // Turn at road block limits
          if (Math.abs(newDx) > 11) {
            newDirX = -d.dirX;
            // 40% chance to turn onto perpendicular cross street
            if (Math.random() > 0.6) {
              newAxis = 'y';
              newDirY = Math.random() > 0.5 ? 1 : -1;
              newHeading = newDirY > 0 ? 180 : 0;
            } else {
              newHeading = newDirX > 0 ? 90 : 270;
            }
          } else {
            newHeading = d.dirX > 0 ? 90 : 270;
          }
        } else {
          newDy = +(d.dy + d.dirY * d.speed).toFixed(3);
          // Turn at road block limits
          if (Math.abs(newDy) > 10) {
            newDirY = -d.dirY;
            // 40% chance to turn onto perpendicular cross street
            if (Math.random() > 0.6) {
              newAxis = 'x';
              newDirX = Math.random() > 0.5 ? 1 : -1;
              newHeading = newDirX > 0 ? 90 : 270;
            } else {
              newHeading = newDirY > 0 ? 180 : 0;
            }
          } else {
            newHeading = d.dirY > 0 ? 180 : 0;
          }
        }

        return {
          ...d,
          dx: newDx,
          dy: newDy,
          dirX: newDirX,
          dirY: newDirY,
          roadAxis: newAxis,
          heading: newHeading
        };
      }));
    }, 1200);
    return () => clearInterval(interval);
  }, [status]);

  // Live positions of nearby rides dynamically surrounding the customer's pickup or current location
  const liveNearbyDrivers = useMemo(() => {
    const center = pickupJunction;
    return nearbyDriverOffsets.map(d => ({
      ...d,
      type: normalizedVehicleType,
      x: Math.max(8, Math.min(92, +(center.x + d.dx).toFixed(1))),
      y: Math.max(12, Math.min(88, +(center.y + d.dy).toFixed(1)))
    }));
  }, [pickupJunction, nearbyDriverOffsets, normalizedVehicleType]);

  const dropJunction = useMemo(() => {
    if (!drop) return { x: 70, y: 34 };
    return resolveAddressToRoadJunction(drop);
  }, [drop]);

  // 2. Generate actual multi-segment road route between Pickup and Destination
  const roadRoute = useMemo(() => {
    if (!pickup || !drop) return null;
    return generateActualRoadRoute(pickup, drop);
  }, [pickup, drop]);

  // Carpool Corridor Road Route SVG Path
  const carpoolCorridorSvgPath = useMemo(() => {
    if (!carpoolRoutePolyline || carpoolRoutePolyline.length < 2) return null;
    let d = `M ${carpoolRoutePolyline[0].x} ${carpoolRoutePolyline[0].y}`;
    for (let i = 1; i < carpoolRoutePolyline.length; i++) {
      d += ` L ${carpoolRoutePolyline[i].x} ${carpoolRoutePolyline[i].y}`;
    }
    return d;
  }, [carpoolRoutePolyline]);

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

  // 🎯 Primary "USE CURRENT LOCATION" Handler
  const handleUseCurrentLocation = useCallback((e?: React.MouseEvent) => {
    e?.stopPropagation();
    sounds.playPing();
    setIsLocating(true);
    setLocationToast("Location Locked");
    setTimeout(() => setLocationToast(null), 3000);

    const applyGPSCenter = (targetX: number, targetY: number) => {
      setMapCenter({ x: targetX, y: targetY });
      const addr = reverseGeocodeRealWorldAddress(targetX, targetY);
      setLiveAddress(addr);
      onAddressResolved?.(addr, { x: targetX, y: targetY });
      onUseCurrentLocation?.();
      setTimeout(() => setIsLocating(false), 1600);
    };

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        () => {
          applyGPSCenter(DEFAULT_GPS_COORDS.x, DEFAULT_GPS_COORDS.y);
        },
        () => {
          applyGPSCenter(DEFAULT_GPS_COORDS.x, DEFAULT_GPS_COORDS.y);
        },
        { timeout: 3000 }
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

  // Base background styling according to layer
  const mapBgClass = useMemo(() => {
    if (baseLayerStyle === 'night') return 'bg-[#090f1e]';
    if (baseLayerStyle === 'satellite') return 'bg-[#0e1713]';
    return 'bg-white';
  }, [baseLayerStyle]);

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
      } ${mapBgClass}`}
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

            {/* Carpool Corridor Highway Gradient */}
            <linearGradient id="carpoolCorridorGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#3b82f6" />
              <stop offset="50%" stopColor="#06b6d4" />
              <stop offset="100%" stopColor="#10b981" />
            </linearGradient>

            {/* Satellite Terrain Grid Pattern */}
            <pattern id="satGrid" width="6" height="6" patternUnits="userSpaceOnUse">
              <path d="M 6 0 L 0 0 0 6" fill="none" stroke="#162e24" strokeWidth="0.25" opacity="0.6" />
            </pattern>

            {/* Metro Rail Dash Pattern */}
            <pattern id="railTies" width="2" height="1.5" patternUnits="userSpaceOnUse">
              <line x1="0" y1="0.75" x2="2" y2="0.75" stroke="#ffffff" strokeWidth="0.4" />
            </pattern>

            <filter id="routeGlow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="0.8" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>

            <filter id="layerAura" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="0.5" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          {/* SATELLITE BASE: Textured Urban Terrain & Forest Foliage */}
          {baseLayerStyle === 'satellite' && (
            <>
              <rect x="0" y="0" width="100" height="100" fill="url(#satGrid)" />
              {/* Forest Reserves & Botanical Parks */}
              <path d="M 5 5 Q 18 10 24 25 T 10 45 Z" fill="#0f3322" opacity="0.85" />
              <path d="M 65 65 Q 85 70 88 90 T 55 95 Z" fill="#0d2b1d" opacity="0.85" />
              <circle cx="82" cy="24" r="14" fill="#0b2418" opacity="0.8" />
            </>
          )}

          {/* STANDARD BASE: Green Parks */}
          {baseLayerStyle === 'standard' && (
            <>
              <path d="M 4 4 Q 16 8 20 22 T 8 40 Z" fill="#bbf7d0" opacity="0.7" />
              <path d="M 68 68 Q 84 72 86 88 T 60 92 Z" fill="#bbf7d0" opacity="0.6" />
            </>
          )}

          {/* NIGHT BASE: Cyber Dark Districts */}
          {baseLayerStyle === 'night' && (
            <>
              <path d="M 4 4 Q 16 8 20 22 T 8 40 Z" fill="#0d1b2a" opacity="0.7" />
              <path d="M 68 68 Q 84 72 86 88 T 60 92 Z" fill="#0d1b2a" opacity="0.6" />
            </>
          )}

          {/* River / Water body accent */}
          <path
            d="M -5 32 Q 25 38 45 28 T 95 36 T 110 32 L 110 40 Q 95 44 45 36 T -5 40 Z"
            fill={
              baseLayerStyle === 'satellite' ? '#091c28' :
              baseLayerStyle === 'night' ? '#152438' : 
              '#bfdbfe'
            }
            opacity={baseLayerStyle === 'night' ? 0.75 : 0.85}
          />

          {/* City Blocks / Commercial Districts */}
          <rect x="8" y="12" width="16" height="14" rx="2" 
            fill={baseLayerStyle === 'satellite' ? '#1a2923' : baseLayerStyle === 'night' ? '#131e3a' : '#cbd5e1'} 
            stroke={baseLayerStyle === 'satellite' ? '#264236' : 'none'}
            strokeWidth="0.3"
            opacity={baseLayerStyle === 'satellite' ? 0.8 : 0.4} 
          />
          <rect x="28" y="10" width="22" height="12" rx="2" 
            fill={baseLayerStyle === 'satellite' ? '#1c2d27' : baseLayerStyle === 'night' ? '#131e3a' : '#cbd5e1'} 
            stroke={baseLayerStyle === 'satellite' ? '#264236' : 'none'}
            strokeWidth="0.3"
            opacity={baseLayerStyle === 'satellite' ? 0.8 : 0.4} 
          />
          <rect x="58" y="8" width="24" height="15" rx="2" 
            fill={baseLayerStyle === 'satellite' ? '#182821' : baseLayerStyle === 'night' ? '#131e3a' : '#cbd5e1'} 
            stroke={baseLayerStyle === 'satellite' ? '#264236' : 'none'}
            strokeWidth="0.3"
            opacity={baseLayerStyle === 'satellite' ? 0.8 : 0.4} 
          />
          <rect x="12" y="66" width="20" height="18" rx="2" 
            fill={baseLayerStyle === 'satellite' ? '#1b2c25' : baseLayerStyle === 'night' ? '#131e3a' : '#cbd5e1'} 
            stroke={baseLayerStyle === 'satellite' ? '#264236' : 'none'}
            strokeWidth="0.3"
            opacity={baseLayerStyle === 'satellite' ? 0.8 : 0.4} 
          />
          <rect x="42" y="70" width="28" height="16" rx="2" 
            fill={baseLayerStyle === 'satellite' ? '#1a2a24' : baseLayerStyle === 'night' ? '#131e3a' : '#cbd5e1'} 
            stroke={baseLayerStyle === 'satellite' ? '#264236' : 'none'}
            strokeWidth="0.3"
            opacity={baseLayerStyle === 'satellite' ? 0.8 : 0.4} 
          />

          {/* Secondary Grid Streets */}
          <g stroke={baseLayerStyle === 'satellite' ? '#284438' : baseLayerStyle === 'night' ? '#1b283d' : '#cbd5e1'} strokeWidth="0.8" opacity="0.75">
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
            stroke={baseLayerStyle === 'satellite' ? '#5a7366' : baseLayerStyle === 'night' ? '#334155' : '#94a3b8'}
            strokeWidth="2.8"
            strokeLinecap="round"
          />

          {/* Major City Arterial Roads */}
          <g stroke={baseLayerStyle === 'satellite' ? '#476255' : baseLayerStyle === 'night' ? '#27354f' : '#b0c4de'} strokeWidth="2.0">
            <line x1="10" y1="46" x2="90" y2="46" />
            <line x1="28" y1="10" x2="28" y2="90" />
            <line x1="48" y1="15" x2="48" y2="85" />
            <line x1="68" y1="10" x2="68" y2="90" />
            <line x1="15" y1="35" x2="85" y2="75" />
          </g>

          {/* 🚦 MAP LAYER OVERLAY: LIVE TRAFFIC FLOW CONDITIONS */}
          {layers.traffic && (
            <g opacity="0.9">
              {/* Green (Normal Flow, 40-50 km/h) */}
              <line x1="10" y1="46" x2="40" y2="46" stroke="#22c55e" strokeWidth="1.2" strokeLinecap="round" opacity="0.85" />
              <line x1="48" y1="15" x2="48" y2="45" stroke="#22c55e" strokeWidth="1.2" strokeLinecap="round" opacity="0.85" />
              <path d="M 5 85 Q 20 40 38 25" fill="none" stroke="#22c55e" strokeWidth="1.4" strokeLinecap="round" opacity="0.8" />

              {/* Amber (Moderate Traffic, 20-30 km/h) */}
              <line x1="40" y1="46" x2="68" y2="46" stroke="#f59e0b" strokeWidth="1.4" strokeLinecap="round" />
              <line x1="28" y1="35" x2="28" y2="65" stroke="#f59e0b" strokeWidth="1.4" strokeLinecap="round" />

              {/* Red / Ruby (Heavy Congestion / Slowdown, 5-15 km/h) */}
              <line x1="68" y1="46" x2="88" y2="46" stroke="#ef4444" strokeWidth="1.6" strokeLinecap="round" />
              <line x1="15" y1="35" x2="35" y2="45" stroke="#ef4444" strokeWidth="1.6" strokeLinecap="round" />
              
              {/* Congestion Pulse Dots */}
              <circle cx="78" cy="46" r="1.4" fill="#ef4444" className="animate-ping" />
              <circle cx="28" cy="50" r="1.2" fill="#f59e0b" className="animate-pulse" />
            </g>
          )}

          {/* 🚊 MAP LAYER OVERLAY: TRANSIT & METRO LINES */}
          {layers.transit && (
            <g opacity="0.95">
              {/* Hyderabad Metro Red Line (Corridor 1) */}
              <path
                d="M 5 12 L 28 35 L 50 50 L 75 70 L 95 85"
                fill="none"
                stroke="#dc2626"
                strokeWidth="2"
                strokeLinecap="round"
                strokeDasharray="4 2"
              />
              {/* Hyderabad Metro Blue Line (Hitec City Corridor) */}
              <path
                d="M 12 78 L 32 60 L 52 45 L 82 25 L 94 20"
                fill="none"
                stroke="#0284c7"
                strokeWidth="2"
                strokeLinecap="round"
                strokeDasharray="4 2"
              />
              {/* Metro Stations */}
              <circle cx="28" cy="35" r="1.8" fill="#ffffff" stroke="#dc2626" strokeWidth="1" />
              <circle cx="50" cy="50" r="2.2" fill="#ffffff" stroke="#dc2626" strokeWidth="1.2" />
              <circle cx="75" cy="70" r="1.8" fill="#ffffff" stroke="#dc2626" strokeWidth="1" />
              <circle cx="32" cy="60" r="1.8" fill="#ffffff" stroke="#0284c7" strokeWidth="1" />
              <circle cx="52" cy="45" r="2.2" fill="#ffffff" stroke="#0284c7" strokeWidth="1.2" />
              <circle cx="82" cy="25" r="1.8" fill="#ffffff" stroke="#0284c7" strokeWidth="1" />
            </g>
          )}

          {/* 📡 MAP LAYER OVERLAY: FLEET TELEMATICS GIS HEATMAP */}
          {layers.fleetGIS && (
            <g opacity="0.75">
              {/* Zone 1: Hitec City Hub Density */}
              <circle cx="32" cy="36" r="12" fill="none" stroke="#06b6d4" strokeWidth="0.8" opacity="0.4" strokeDasharray="2 2" className="animate-pulse" />
              <circle cx="32" cy="36" r="6" fill="#06b6d4" opacity="0.15" />
              
              {/* Zone 2: Secunderabad / Warangal Junction Hub Density */}
              <circle cx="68" cy="54" r="14" fill="none" stroke="#10b981" strokeWidth="0.8" opacity="0.4" strokeDasharray="2 2" className="animate-pulse" />
              <circle cx="68" cy="54" r="7" fill="#10b981" opacity="0.15" />
            </g>
          )}

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

          {/* 3. CARPOOL CORRIDOR HIGHWAY ROUTE (Visible when viewing carpool route) */}
          {(isCarpoolActive || carpoolCorridorSvgPath) && carpoolCorridorSvgPath && (
            <>
              {/* Outer Corridor Glow */}
              <path
                d={carpoolCorridorSvgPath}
                fill="none"
                stroke="#06b6d4"
                strokeWidth="5"
                strokeLinecap="round"
                strokeLinejoin="round"
                opacity="0.35"
                filter="url(#routeGlow)"
              />
              {/* Main Vivid Highway Corridor Line */}
              <path
                d={carpoolCorridorSvgPath}
                fill="none"
                stroke="url(#carpoolCorridorGrad)"
                strokeWidth="2.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              {/* Directional Shimmer Flow Line */}
              <path
                d={carpoolCorridorSvgPath}
                fill="none"
                stroke="#ffffff"
                strokeWidth="1.2"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeDasharray="4 3"
                className="animate-dash"
                opacity="0.95"
              />
            </>
          )}
        </svg>

        {/* Metro Station Badges (when transit layer enabled) */}
        {layers.transit && (
          <>
            <div className="absolute top-[49%] left-[49%] -translate-x-1/2 -translate-y-1/2 pointer-events-none">
              <div className="px-1.5 py-0.5 rounded-full bg-red-600/90 text-white font-mono text-[8px] font-black shadow flex items-center gap-0.5">
                <Train className="w-2.5 h-2.5" />
                <span>Ameerpet Interchange</span>
              </div>
            </div>
            <div className="absolute top-[23%] left-[80%] -translate-x-1/2 -translate-y-1/2 pointer-events-none">
              <div className="px-1.5 py-0.5 rounded-full bg-sky-600/90 text-white font-mono text-[8px] font-black shadow flex items-center gap-0.5">
                <Train className="w-2.5 h-2.5" />
                <span>Hitec Metro</span>
              </div>
            </div>
          </>
        )}

        {/* Authentic POI Landmark Marker */}
        <div 
          className="absolute top-[62%] left-[34%] -translate-x-1/2 -translate-y-1/2 pointer-events-none"
        >
          <div className="flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-slate-900/80 border border-slate-700/80 backdrop-blur-md text-[9px] font-bold text-slate-300 shadow">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
            <span>Warangal Stn</span>
          </div>
        </div>

        {/* BEFORE BOOKING: SHOW NEARBY RIDES NEAR CURRENT OR PICKUP LOCATION BY SELECTED VEHICLE */}
        {showNearbyDrivers && (status === 'IDLE' || status === 'FINDING_DRIVER') && liveNearbyDrivers.map((d) => {
          return (
            <div
              key={d.id}
              style={{ top: `${d.y}%`, left: `${d.x}%` }}
              className="absolute -translate-x-1/2 -translate-y-1/2 pointer-events-none transition-all duration-1000 ease-linear z-10 flex flex-col items-center"
            >
              <LiveMapVehicleMarker 
                type={d.type}
                heading={d.heading}
                size={36}
              />
            </div>
          );
        })}

        {/* 🏁 DESTINATION PIN (When route is active) */}
        {drop && roadRoute && (
          <div
            style={{ top: `${dropJunction.y}%`, left: `${dropJunction.x}%` }}
            className="absolute -translate-x-1/2 -translate-y-full z-20 pointer-events-none"
          >
            <Destination3dPin address={drop} />
          </div>
        )}

        {/* 📍 BOY PICKUP PIN (When route is active or ride is in progress) */}
        {pickup && (status !== 'IDLE' || Boolean(drop && roadRoute)) && (
          <div
            style={{ top: `${pickupJunction.y}%`, left: `${pickupJunction.x}%` }}
            className="absolute -translate-x-1/2 -translate-y-[88%] z-25 pointer-events-auto select-none"
          >
            <div className="relative flex flex-col items-center">
              {/* Floating Address Pill - Tap on address converts to search bar edit (no edit button) */}
              {isRoutePillEditing ? (
                <div 
                  onClick={(e) => e.stopPropagation()}
                  className="mb-1 px-3 py-1 bg-slate-900/98 backdrop-blur-md border border-emerald-400 rounded-full shadow-2xl flex items-center gap-1.5 max-w-[300px] ring-2 ring-emerald-500/40 animate-in fade-in zoom-in-95 pointer-events-auto"
                >
                  <Search className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                  <input
                    type="text"
                    value={routePillInput}
                    onChange={(e) => setRoutePillInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleCommitRoutePill();
                      } else if (e.key === 'Escape') {
                        setIsRoutePillEditing(false);
                        setRoutePillInput(pickup);
                      }
                    }}
                    onBlur={handleCommitRoutePill}
                    placeholder="Search or enter pickup..."
                    className="bg-transparent font-bold text-[10px] text-white outline-none w-[160px] placeholder:text-slate-400"
                    autoFocus
                  />
                </div>
              ) : (
                <div 
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsRoutePillEditing(true);
                    setRoutePillInput(pickup);
                  }}
                  className="mb-1 px-3 py-1.5 bg-slate-900/95 backdrop-blur-md border border-emerald-500/60 hover:border-emerald-400 rounded-full shadow-2xl flex items-center gap-1.5 max-w-[280px] cursor-pointer hover:scale-105 active:scale-95 transition pointer-events-auto"
                  title="Tap address to edit"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse flex-shrink-0" />
                  <span className="text-[10px] font-black text-white truncate max-w-[200px]">
                    {pickup}
                  </span>
                </div>
              )}

              {/* Boy Character - Purely visual marker */}
              <div className="flex flex-col items-center pointer-events-none">
                <div className="absolute -inset-1.5 bg-emerald-500/30 blur-md rounded-full pointer-events-none" />
                <img 
                  src={boyPinImage} 
                  alt="Pickup Boy Pin" 
                  className="w-12 h-16 object-contain filter drop-shadow-[0_8px_16px_rgba(0,0,0,0.65)] relative z-10"
                />

                <div className="relative z-10 flex flex-col items-center">
                  <div className="w-0.5 h-3 bg-gradient-to-b from-emerald-400 to-white shadow-[0_0_8px_#34d399] -mt-1" />
                  <div className="w-3 h-3 rounded-full bg-emerald-400 shadow-[0_0_10px_#34d399] border-2 border-white" />
                </div>
              </div>
            </div>
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

              {/* Live Vehicle Marker */}
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

        {/* 🛣️ CARPOOL CORRIDOR WAYPOINT STOP NODES & LIVE MOVING CARPOOL VEHICLE */}
        {isCarpoolActive && (
          <>
            {/* Waypoint Stop Badges on Road Network */}
            {carpoolStops && carpoolStops.map((stop, sIdx) => (
              <div
                key={stop.id}
                style={{ top: `${stop.location.y}%`, left: `${stop.location.x}%` }}
                className="absolute -translate-x-1/2 -translate-y-1/2 z-22 pointer-events-none"
              >
                <div className="flex flex-col items-center">
                  <div className="px-2 py-0.5 rounded-full bg-slate-950/90 text-white border border-cyan-400/80 text-[8px] font-black shadow-lg flex items-center gap-1 whitespace-nowrap mb-0.5 backdrop-blur-sm">
                    <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
                    <span>{stop.name}</span>
                  </div>
                  <div className="w-2.5 h-2.5 rounded-full bg-cyan-400 border-2 border-white shadow-md ring-2 ring-cyan-500/40" />
                </div>
              </div>
            ))}

            {/* Live Moving Carpool Driver on the Corridor */}
            {carpoolDriverPos && (
              <div
                style={{ top: `${carpoolDriverPos.y}%`, left: `${carpoolDriverPos.x}%` }}
                className="absolute -translate-x-1/2 -translate-y-1/2 z-35 pointer-events-none transition-all duration-1000 ease-linear flex flex-col items-center"
              >
                {/* Live Carpool Driver Tag */}
                <div className="mb-1 px-2.5 py-0.5 rounded-full bg-slate-950/95 text-white border border-blue-400 text-[9px] font-black shadow-xl flex items-center gap-1.5 whitespace-nowrap backdrop-blur-md">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                  <span>{carpoolDriverName || 'Carpool Driver'}</span>
                </div>

                {/* 3D Carpool Vehicle Marker */}
                <LiveMapVehicleMarker 
                  type="PREMIUM"
                  heading={carpoolDriverPos.headingDeg}
                  size={40}
                />
              </div>
            )}
          </>
        )}

      </div>

      {/* 📍 ANIMATED LOCATION PIN (STAYS FIXED ON SCREEN WHILE MAP MOVES UNDERNEATH) */}
      {showFixedPin && status === 'IDLE' && (
        <div 
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-[88%] z-40 pointer-events-none select-none flex flex-col items-center"
        >
          <AnimatedLocationPin
            address={liveAddress || pickup || DEFAULT_GPS_ADDRESS}
            isMapMoving={isMapMoving}
            isLocating={isLocating}
            pinStyle={activePinStyle}
            showAddressBadge={true}
            onCycleStyle={handleCyclePinStyle}
            onUpdateAddress={handleUpdatePickupAddress}
          />
        </div>
      )}

      {/* 🧭 RIGHT-SIDE FLOATING MAP CONTROLS (Layers, Zoom Reset, Pin Toggle) */}
      <div className="absolute top-24 right-3.5 z-30 flex flex-col items-end gap-2 pointer-events-auto">
        
        {/* 1. MAP LAYERS BUTTON */}
        <button 
          onClick={(e) => {
            e.stopPropagation();
            sounds.playPop();
            setShowLayersMenu(!showLayersMenu);
          }}
          title="Map Layers (Traffic, Satellite, Transit, GIS)"
          className={`w-9 h-9 rounded-2xl backdrop-blur-md border flex items-center justify-center shadow-xl transition active:scale-95 ${
            showLayersMenu 
              ? 'bg-blue-600 border-blue-400 text-white shadow-blue-500/40 ring-2 ring-blue-500/30' 
              : 'bg-slate-900/90 border-slate-700/80 text-slate-300 hover:text-white hover:bg-slate-800'
          }`}
        >
          <Layers className="w-4 h-4 text-blue-400" />
        </button>

        {/* 2. PIN STYLE CYCLE BUTTON */}
        {status === 'IDLE' && (
          <button 
            onClick={handleCyclePinStyle}
            title={`Pin Style: ${activePinStyle}`}
            className="w-9 h-9 rounded-2xl bg-slate-900/90 border border-slate-700/80 backdrop-blur-md text-amber-400 flex items-center justify-center shadow-xl hover:bg-slate-800 transition active:scale-95"
          >
            <Sparkles className="w-4 h-4 text-amber-400" />
          </button>
        )}

        {/* 4. RESET AUTO-FIT ZOOM */}
        {userZoom !== null && (
          <button 
            onClick={(e) => {
              e.stopPropagation();
              setUserZoom(null);
            }}
            title="Reset Zoom"
            className="w-9 h-9 rounded-2xl bg-slate-900/90 border border-slate-700/80 backdrop-blur-md text-slate-300 flex items-center justify-center shadow-xl hover:bg-slate-800 transition active:scale-95"
          >
            <RotateCcw className="w-3.5 h-3.5 text-amber-400" />
          </button>
        )}
      </div>

      {/* 🗺️ INTERACTIVE MAP LAYERS OVERLAY PANEL */}
      {showLayersMenu && (
        <div 
          onClick={(e) => e.stopPropagation()}
          className="absolute top-24 right-14 z-40 w-64 bg-slate-900/95 backdrop-blur-xl border border-slate-700/90 rounded-2xl p-3.5 shadow-2xl animate-in fade-in slide-in-from-right-3 duration-200 pointer-events-auto text-xs text-slate-200 space-y-3"
        >
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <div className="flex items-center gap-1.5 font-black text-white">
              <Layers className="w-4 h-4 text-blue-400" />
              <span>Map Layers</span>
            </div>
            <button 
              onClick={() => setShowLayersMenu(false)}
              className="text-slate-400 hover:text-white p-0.5"
            >
              ✕
            </button>
          </div>

          {/* Base Layer Switcher */}
          <div>
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
              Base Map Style
            </div>
            <div className="grid grid-cols-3 gap-1.5">
              <button
                onClick={() => {
                  setBaseLayerStyle('standard');
                  if (isNightMode) onToggleNightMode?.();
                  sounds.playPop();
                }}
                className={`p-2 rounded-xl border flex flex-col items-center gap-1 transition text-center ${
                  baseLayerStyle === 'standard'
                    ? 'bg-blue-600/20 border-blue-500 text-white font-bold'
                    : 'bg-slate-800/60 border-slate-700/60 text-slate-400 hover:text-slate-200'
                }`}
              >
                <Sun className="w-3.5 h-3.5 text-amber-400" />
                <span className="text-[10px]">Streets</span>
              </button>

              <button
                onClick={() => {
                  setBaseLayerStyle('night');
                  if (!isNightMode) onToggleNightMode?.();
                  sounds.playPop();
                }}
                className={`p-2 rounded-xl border flex flex-col items-center gap-1 transition text-center ${
                  baseLayerStyle === 'night'
                    ? 'bg-blue-600/20 border-blue-500 text-white font-bold'
                    : 'bg-slate-800/60 border-slate-700/60 text-slate-400 hover:text-slate-200'
                }`}
              >
                <Moon className="w-3.5 h-3.5 text-indigo-400" />
                <span className="text-[10px]">Night</span>
              </button>

              <button
                onClick={() => {
                  setBaseLayerStyle('satellite');
                  sounds.playPop();
                }}
                className={`p-2 rounded-xl border flex flex-col items-center gap-1 transition text-center ${
                  baseLayerStyle === 'satellite'
                    ? 'bg-emerald-600/20 border-emerald-500 text-white font-bold'
                    : 'bg-slate-800/60 border-slate-700/60 text-slate-400 hover:text-slate-200'
                }`}
              >
                <Compass className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-[10px]">Satellite</span>
              </button>
            </div>
          </div>

          {/* Toggleable Layer Overlays */}
          <div>
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
              Layer Overlays
            </div>
            <div className="space-y-1.5">
              {/* Traffic Flow */}
              <div 
                onClick={() => {
                  setLayers(prev => ({ ...prev, traffic: !prev.traffic }));
                  sounds.playPop();
                }}
                className="flex items-center justify-between p-2 rounded-xl bg-slate-800/50 hover:bg-slate-800 border border-slate-700/50 cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  <Activity className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-[11px] font-semibold">Live Traffic Flow</span>
                </div>
                <div className={`w-7 h-4 rounded-full transition-colors relative flex items-center p-0.5 ${
                  layers.traffic ? 'bg-emerald-500' : 'bg-slate-700'
                }`}>
                  <div className={`w-3 h-3 rounded-full bg-white transition-transform ${
                    layers.traffic ? 'translate-x-3' : 'translate-x-0'
                  }`} />
                </div>
              </div>

              {/* Transit & Metro */}
              <div 
                onClick={() => {
                  setLayers(prev => ({ ...prev, transit: !prev.transit }));
                  sounds.playPop();
                }}
                className="flex items-center justify-between p-2 rounded-xl bg-slate-800/50 hover:bg-slate-800 border border-slate-700/50 cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  <Train className="w-3.5 h-3.5 text-sky-400" />
                  <span className="text-[11px] font-semibold">Metro & Transit</span>
                </div>
                <div className={`w-7 h-4 rounded-full transition-colors relative flex items-center p-0.5 ${
                  layers.transit ? 'bg-sky-500' : 'bg-slate-700'
                }`}>
                  <div className={`w-3 h-3 rounded-full bg-white transition-transform ${
                    layers.transit ? 'translate-x-3' : 'translate-x-0'
                  }`} />
                </div>
              </div>

              {/* Fleet Telematics Heatmap */}
              <div 
                onClick={() => {
                  setLayers(prev => ({ ...prev, fleetGIS: !prev.fleetGIS }));
                  sounds.playPop();
                }}
                className="flex items-center justify-between p-2 rounded-xl bg-slate-800/50 hover:bg-slate-800 border border-slate-700/50 cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  <Radio className="w-3.5 h-3.5 text-cyan-400" />
                  <span className="text-[11px] font-semibold">Fleet GIS Density</span>
                </div>
                <div className={`w-7 h-4 rounded-full transition-colors relative flex items-center p-0.5 ${
                  layers.fleetGIS ? 'bg-cyan-500' : 'bg-slate-700'
                }`}>
                  <div className={`w-3 h-3 rounded-full bg-white transition-transform ${
                    layers.fleetGIS ? 'translate-x-3' : 'translate-x-0'
                  }`} />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 🎯 CURRENT LOCATION TOAST NOTIFICATION */}
      {locationToast && (
        <div className="absolute top-24 left-1/2 -translate-x-1/2 z-40 px-3.5 py-1.5 bg-emerald-500 text-slate-950 font-black text-xs rounded-full shadow-2xl flex items-center gap-2 animate-in fade-in slide-in-from-top-2">
          <Navigation className="w-3.5 h-3.5 text-slate-950" />
          <span>{locationToast}</span>
        </div>
      )}

      {/* “CONFIRM LOCATION” FLOATING ACTION BUTTON ON MAP (WHEN PICKING PICKUP) */}
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

    </div>
  );
};
