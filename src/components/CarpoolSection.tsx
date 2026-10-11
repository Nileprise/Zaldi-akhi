import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  Users, MapPin, Navigation, Clock, ShieldCheck, 
  ArrowRight, Check, AlertTriangle, Timer, Zap, 
  RefreshCw, Car, ChevronRight, Info, Sparkles, 
  CheckCircle2, XCircle, Gauge, Sliders, ChevronDown, 
  Phone, Star, Shield, ArrowUpRight, Flame, Search,
  Compass, Radio, ChevronUp
} from 'lucide-react';
import { sounds } from '../services/audio';
import { 
  calculatePassengerOnRoute, 
  calculateDirectionalPassedPoint,
  evaluateLocationThrottle,
  TelemetryThrottleState,
  CarpoolRouteStop,
  CarpoolSegmentBooking,
  calculateSegmentSeatCapacities,
  canBookSeatsForSubTrip
} from '../services/carpoolService';
import { RoutePoint } from '../types';
import { resolveAddressToRoadJunction } from '../services/routeService';

export interface CarpoolInteractiveSectionProps {
  currentAddress: string;
  walletBalance: number;
  onDeductFare?: (amount: number) => void;
  onDriverChange?: (driver: AvailableCarpoolDriver, driverPos: { x: number; y: number; headingDeg: number }) => void;
  onViewRouteOnMap?: (driver: AvailableCarpoolDriver) => void;
  isMapFocused?: boolean;
  onToggleMapFocus?: () => void;
}

// Available highway carpool drivers with realistic routes near user
export interface AvailableCarpoolDriver {
  id: string;
  driverName: string;
  driverRating: number;
  totalTrips: number;
  vehicle: string;
  vehiclePlate: string;
  vehicleTier: string;
  avatarBg: string;
  from: string;
  to: string;
  departsIn: string;
  basePricePerSeat: number;
  totalSeats: number;
  verified: boolean;
  corridorStops: CarpoolRouteStop[];
  routePolyline: RoutePoint[];
  driverProgress: number; // initial progress (0 to 1)
  initialBookings: CarpoolSegmentBooking[];
  corridorSummary: string;
}

export const AVAILABLE_CARPOOL_DRIVERS: AvailableCarpoolDriver[] = [
  {
    id: 'pool-kiran',
    driverName: 'Kiran Reddy',
    driverRating: 4.92,
    totalTrips: 184,
    vehicle: 'Hyundai Creta',
    vehiclePlate: 'TS 09 CD 4422',
    vehicleTier: 'Prime SUV',
    avatarBg: 'bg-blue-600',
    from: 'Gachibowli ORR',
    to: 'Warangal Station',
    departsIn: '6 mins',
    basePricePerSeat: 180,
    totalSeats: 4,
    verified: true,
    corridorSummary: 'Gachibowli → Mindspace → Secunderabad → Kazipet → Warangal',
    driverProgress: 0.16,
    corridorStops: [
      { id: 'stop-1', name: 'Gachibowli ORR', order: 0, location: { x: 22, y: 38 }, eta: '05:30 PM' },
      { id: 'stop-2', name: 'Mindspace (Hitec)', order: 1, location: { x: 38, y: 50 }, eta: '05:45 PM' },
      { id: 'stop-3', name: 'Secunderabad Stn', order: 2, location: { x: 62, y: 32 }, eta: '06:15 PM' },
      { id: 'stop-4', name: 'Kazipet Junction', order: 3, location: { x: 68, y: 52 }, eta: '07:20 PM' },
      { id: 'stop-5', name: 'Warangal Station', order: 4, location: { x: 74, y: 58 }, eta: '07:45 PM' },
    ],
    routePolyline: [
      { x: 22, y: 38, streetName: 'Gachibowli ORR Circle' },
      { x: 28, y: 46, streetName: 'Hitec City Metro Corridor' },
      { x: 38, y: 50, streetName: 'Mindspace IT Park Circular Rd' },
      { x: 44, y: 38, streetName: 'Road No. 36 Jubilee Hills' },
      { x: 48, y: 42, streetName: 'Banjara Hills Express Way' },
      { x: 52, y: 38, streetName: 'Punjagutta Elevated Flyover' },
      { x: 62, y: 32, streetName: 'Station Road Secunderabad' },
      { x: 65, y: 44, streetName: 'NH 163 Warangal Highway' },
      { x: 68, y: 52, streetName: 'Kazipet Junction Crossing' },
      { x: 74, y: 58, streetName: 'Warangal Station Ramp' }
    ],
    initialBookings: [
      {
        bookingId: 'book-alice',
        passengerName: 'Alice',
        fromStopId: 'stop-1',
        toStopId: 'stop-2',
        seatsCount: 2,
        status: 'ACTIVE',
        bookedAt: '05:10 PM'
      },
      {
        bookingId: 'book-rahul',
        passengerName: 'Rahul',
        fromStopId: 'stop-3',
        toStopId: 'stop-5',
        seatsCount: 1,
        status: 'ACTIVE',
        bookedAt: '05:15 PM'
      }
    ]
  },
  {
    id: 'pool-ananya',
    driverName: 'Ananya Roy',
    driverRating: 4.88,
    totalTrips: 112,
    vehicle: 'Honda City',
    vehiclePlate: 'TS 08 XY 8890',
    vehicleTier: 'Comfort Sedan',
    avatarBg: 'bg-emerald-600',
    from: 'Mindspace IT Park',
    to: 'Secunderabad Stn',
    departsIn: '12 mins',
    basePricePerSeat: 120,
    totalSeats: 4,
    verified: true,
    corridorSummary: 'Mindspace → Jubilee Checkpost → Banjara Hills → Punjagutta → Secunderabad',
    driverProgress: 0.10,
    corridorStops: [
      { id: 'stop-m1', name: 'Mindspace (Hitec)', order: 0, location: { x: 38, y: 50 }, eta: '05:40 PM' },
      { id: 'stop-m2', name: 'Jubilee Hills No. 36', order: 1, location: { x: 44, y: 38 }, eta: '05:55 PM' },
      { id: 'stop-m3', name: 'Banjara Hills Rd 1', order: 2, location: { x: 48, y: 42 }, eta: '06:10 PM' },
      { id: 'stop-m4', name: 'Secunderabad Stn', order: 3, location: { x: 62, y: 32 }, eta: '06:30 PM' },
    ],
    routePolyline: [
      { x: 38, y: 50, streetName: 'Mindspace IT Park Circular Rd' },
      { x: 44, y: 38, streetName: 'Road No. 36 Jubilee Hills' },
      { x: 48, y: 42, streetName: 'Banjara Hills Express Way' },
      { x: 52, y: 38, streetName: 'Punjagutta Elevated Flyover' },
      { x: 62, y: 32, streetName: 'Station Road Secunderabad' }
    ],
    initialBookings: [
      {
        bookingId: 'book-tanmay',
        passengerName: 'Tanmay',
        fromStopId: 'stop-m1',
        toStopId: 'stop-m2',
        seatsCount: 1,
        status: 'ACTIVE',
        bookedAt: '05:20 PM'
      }
    ]
  },
  {
    id: 'pool-mahesh',
    driverName: 'Mahesh Goud',
    driverRating: 4.96,
    totalTrips: 340,
    vehicle: 'Toyota Innova Crysta',
    vehiclePlate: 'TS 03 AB 9912',
    vehicleTier: 'Premium 6-Seater',
    avatarBg: 'bg-purple-600',
    from: 'Secunderabad Stn',
    to: 'RGIA Airport',
    departsIn: '20 mins',
    basePricePerSeat: 240,
    totalSeats: 6,
    verified: true,
    corridorSummary: 'Secunderabad → Punjagutta → Charminar → PVNR Expressway → RGIA Airport',
    driverProgress: 0.18,
    corridorStops: [
      { id: 'stop-a1', name: 'Secunderabad Stn', order: 0, location: { x: 62, y: 32 }, eta: '06:00 PM' },
      { id: 'stop-a2', name: 'Punjagutta Flyover', order: 1, location: { x: 52, y: 38 }, eta: '06:20 PM' },
      { id: 'stop-a3', name: 'Charminar Bypass', order: 2, location: { x: 48, y: 62 }, eta: '06:45 PM' },
      { id: 'stop-a4', name: 'RGIA Airport Ramp', order: 3, location: { x: 68, y: 82 }, eta: '07:15 PM' },
    ],
    routePolyline: [
      { x: 62, y: 32, streetName: 'Station Road Secunderabad' },
      { x: 52, y: 38, streetName: 'Punjagutta Elevated Flyover' },
      { x: 48, y: 62, streetName: 'Charminar Heritage Way' },
      { x: 56, y: 68, streetName: 'PVNR Airport Expressway' },
      { x: 68, y: 82, streetName: 'RGIA Terminal Arrivals Ramp' }
    ],
    initialBookings: [
      {
        bookingId: 'book-priya',
        passengerName: 'Priya & Family',
        fromStopId: 'stop-a1',
        toStopId: 'stop-a4',
        seatsCount: 2,
        status: 'ACTIVE',
        bookedAt: '05:35 PM'
      }
    ]
  },
  {
    id: 'pool-suresh',
    driverName: 'Suresh Babu',
    driverRating: 4.82,
    totalTrips: 98,
    vehicle: 'Maruti Ertiga Hybrid',
    vehiclePlate: 'TS 10 EF 3319',
    vehicleTier: 'Comfort MPV',
    avatarBg: 'bg-amber-600',
    from: 'Financial District',
    to: 'Hitec City & Mindspace',
    departsIn: '5 mins',
    basePricePerSeat: 90,
    totalSeats: 4,
    verified: true,
    corridorSummary: 'Financial District → Gachibowli ORR → Hitec City Metro → Mindspace',
    driverProgress: 0.28,
    corridorStops: [
      { id: 'stop-f1', name: 'Financial District', order: 0, location: { x: 18, y: 42 }, eta: '05:35 PM' },
      { id: 'stop-f2', name: 'Gachibowli ORR', order: 1, location: { x: 22, y: 38 }, eta: '05:45 PM' },
      { id: 'stop-f3', name: 'Hitec City Metro', order: 2, location: { x: 28, y: 46 }, eta: '05:55 PM' },
      { id: 'stop-f4', name: 'Mindspace IT Park', order: 3, location: { x: 38, y: 50 }, eta: '06:05 PM' },
    ],
    routePolyline: [
      { x: 18, y: 42, streetName: 'Financial District Way' },
      { x: 22, y: 38, streetName: 'Outer Ring Road (Gachibowli)' },
      { x: 28, y: 46, streetName: 'Hitec City Metro Corridor' },
      { x: 38, y: 50, streetName: 'Mindspace IT Park Circular Rd' }
    ],
    initialBookings: [
      {
        bookingId: 'book-dev',
        passengerName: 'Dev',
        fromStopId: 'stop-f1',
        toStopId: 'stop-f3',
        seatsCount: 1,
        status: 'ACTIVE',
        bookedAt: '05:15 PM'
      }
    ]
  }
];

export const CarpoolSection: React.FC<CarpoolInteractiveSectionProps> = ({
  currentAddress,
  walletBalance,
  onDeductFare,
  onDriverChange,
  onViewRouteOnMap,
  isMapFocused = false,
  onToggleMapFocus
}) => {
  // Passenger pickup position resolved from current customer address
  const [passengerAddress, setPassengerAddress] = useState(currentAddress || 'Mindspace IT Park, Hitec City');
  const passengerPos = useMemo(() => {
    return resolveAddressToRoadJunction(passengerAddress);
  }, [passengerAddress]);

  // Keep passengerAddress in sync when currentAddress changes externally
  useEffect(() => {
    if (currentAddress && currentAddress.trim()) {
      setPassengerAddress(currentAddress);
    }
  }, [currentAddress]);

  // Selected driver ID
  const [selectedDriverId, setSelectedDriverId] = useState<string>('pool-kiran');

  // Drawer / List open state: "carpool click open the list of available riders show near to customer"
  const [isDriversListOpen, setIsDriversListOpen] = useState<boolean>(true);

  // Inspector toggle
  const [showInspector, setShowInspector] = useState(false);

  // Route Corridor Visualizer toggle and anchor
  const [showRouteVisualizer, setShowRouteVisualizer] = useState<boolean>(true);
  const [isBookingOpen, setIsBookingOpen] = useState<boolean>(false);
  const routeVisualizerRef = useRef<HTMLDivElement>(null);
  const activeDriverCardRef = useRef<HTMLDivElement>(null);

  // Active selected driver object
  const activeDriver = useMemo(() => {
    return AVAILABLE_CARPOOL_DRIVERS.find(d => d.id === selectedDriverId) || AVAILABLE_CARPOOL_DRIVERS[0];
  }, [selectedDriverId]);

  // 1. ROUTE INTERPOLATION TOLERANCE
  const [toleranceMeters, setToleranceMeters] = useState<number>(500);

  // 2. LIVE SIMULATION STATE FOR ACTIVE DRIVER
  const [driverProgress, setDriverProgress] = useState<number>(activeDriver.driverProgress);
  const [isDriverMoving, setIsDriverMoving] = useState<boolean>(true);

  // Reset simulation when switching drivers
  useEffect(() => {
    setDriverProgress(activeDriver.driverProgress);
    setBookings(activeDriver.initialBookings);
    setBookingFromStopId(activeDriver.corridorStops[0]?.id || 'stop-1');
    setBookingToStopId(activeDriver.corridorStops[activeDriver.corridorStops.length - 1]?.id || 'stop-2');
  }, [selectedDriverId, activeDriver]);

  const [throttleTelemetry, setThrottleTelemetry] = useState<TelemetryThrottleState>({
    lastPushedPos: null,
    lastPushedTime: 0,
    totalPushesSaved: 0,
    totalWritesSent: 0
  });

  // 4. DYNAMIC SEAT BOOKING STATE
  const [bookings, setBookings] = useState<CarpoolSegmentBooking[]>(activeDriver.initialBookings);
  const [bookingFromStopId, setBookingFromStopId] = useState<string>(activeDriver.corridorStops[0]?.id || 'stop-1');
  const [bookingToStopId, setBookingToStopId] = useState<string>(activeDriver.corridorStops[activeDriver.corridorStops.length - 1]?.id || 'stop-2');
  const [seatsToBook, setSeatsToBook] = useState<number>(1);

  // 5. 60-SECOND GRACE PERIOD STATE
  const [isInBookingFlow, setIsInBookingFlow] = useState<boolean>(false);
  const [gracePeriodRemainingSec, setGracePeriodRemainingSec] = useState<number>(60);
  const [bookingConfirmationSuccess, setBookingConfirmationSuccess] = useState<string | null>(null);

  // Active driver telemetry position along polyline
  const driverState = useMemo(() => {
    const fraction = Math.max(0, Math.min(1, driverProgress));
    const totalSegs = activeDriver.routePolyline.length - 1;
    const exactIdx = fraction * totalSegs;
    const lowIdx = Math.min(Math.floor(exactIdx), totalSegs - 1);
    const segT = exactIdx - lowIdx;
    const p1 = activeDriver.routePolyline[lowIdx];
    const p2 = activeDriver.routePolyline[lowIdx + 1];

    const x = +(p1.x + (p2.x - p1.x) * segT).toFixed(2);
    const y = +(p1.y + (p2.y - p1.y) * segT).toFixed(2);
    const angleRad = Math.atan2(p2.y - p1.y, p2.x - p1.x);
    const headingDeg = Math.round(((angleRad * 180) / Math.PI + 90 + 360) % 360);

    return { x, y, headingDeg, streetName: p1.streetName };
  }, [driverProgress, activeDriver.routePolyline]);

  // Continuously sync active driver & live position to InteractiveMap
  useEffect(() => {
    onDriverChange?.(activeDriver, driverState);
  }, [activeDriver, driverState, onDriverChange]);

  // Generate SVG path string for the corridor visualizer inside the card
  const corridorSvgPath = useMemo(() => {
    if (!activeDriver.routePolyline || activeDriver.routePolyline.length < 2) return '';
    let d = `M ${activeDriver.routePolyline[0].x} ${activeDriver.routePolyline[0].y}`;
    for (let i = 1; i < activeDriver.routePolyline.length; i++) {
      d += ` L ${activeDriver.routePolyline[i].x} ${activeDriver.routePolyline[i].y}`;
    }
    return d;
  }, [activeDriver.routePolyline]);

  // Compute waypoint positions along corridor for active driver (0% to 100%)
  const waypointsWithProgress = useMemo(() => {
    const stops = activeDriver.corridorStops;
    const count = stops.length;
    return stops.map((stop, i) => {
      const pct = count <= 1 ? 0 : Math.round((i / (count - 1)) * 100);
      return {
        ...stop,
        progressPct: pct
      };
    });
  }, [activeDriver.corridorStops]);

  // Determine active waypoint transition based on driverProgress
  const currentJourneyStage = useMemo(() => {
    const currentPct = Math.round(driverProgress * 100);
    let prevStop = waypointsWithProgress[0];
    let nextStop = waypointsWithProgress[1] || waypointsWithProgress[0];

    for (let i = 0; i < waypointsWithProgress.length - 1; i++) {
      if (currentPct >= waypointsWithProgress[i].progressPct && currentPct <= waypointsWithProgress[i + 1].progressPct) {
        prevStop = waypointsWithProgress[i];
        nextStop = waypointsWithProgress[i + 1];
        break;
      }
    }

    if (currentPct > waypointsWithProgress[waypointsWithProgress.length - 2]?.progressPct) {
      prevStop = waypointsWithProgress[waypointsWithProgress.length - 2];
      nextStop = waypointsWithProgress[waypointsWithProgress.length - 1];
    }

    const segSpan = Math.max(1, nextStop.progressPct - prevStop.progressPct);
    const segCompleted = Math.max(0, Math.min(1, (currentPct - prevStop.progressPct) / segSpan));
    const isAtStation = segCompleted < 0.08 || segCompleted > 0.94;

    const distanceToNextKm = +(Math.max(0.3, (1 - segCompleted) * 8.4).toFixed(1));
    const etaMinToNext = Math.max(1, Math.round(distanceToNextKm * 2.2));

    return {
      currentPct,
      prevStop,
      nextStop,
      segCompleted: Math.round(segCompleted * 100),
      isAtStation,
      distanceToNextKm,
      etaMinToNext
    };
  }, [driverProgress, waypointsWithProgress]);

  // 1. On-Route Highway Match
  const onRouteCheck = useMemo(() => {
    return calculatePassengerOnRoute(passengerPos, activeDriver.routePolyline, toleranceMeters);
  }, [passengerPos, activeDriver.routePolyline, toleranceMeters]);

  // 3. Directional Filtering ("Passed-Point" Edge Case)
  const directionalCheck = useMemo(() => {
    return calculateDirectionalPassedPoint(
      driverState,
      driverState.headingDeg,
      passengerPos,
      5.0
    );
  }, [driverState, passengerPos]);

  // 4. Segment Seat Capacities
  const segmentCapacities = useMemo(() => {
    return calculateSegmentSeatCapacities(activeDriver.corridorStops, activeDriver.totalSeats, bookings);
  }, [activeDriver.corridorStops, activeDriver.totalSeats, bookings]);

  const subTripEligibility = useMemo(() => {
    return canBookSeatsForSubTrip(
      bookingFromStopId,
      bookingToStopId,
      seatsToBook,
      activeDriver.corridorStops,
      segmentCapacities
    );
  }, [bookingFromStopId, bookingToStopId, seatsToBook, activeDriver.corridorStops, segmentCapacities]);

  // 5. Overall visibility & Grace Period
  const isHardCutoffTriggered = !directionalCheck.isEligibleBeforeCutoff;
  const isProtectedByGracePeriod = isHardCutoffTriggered && isInBookingFlow && gracePeriodRemainingSec > 0;
  const isVehicleVisibleToPassenger = (directionalCheck.isEligibleBeforeCutoff || isProtectedByGracePeriod) && onRouteCheck.isOnRoute;

  // Real-time Driver Simulation tick
  useEffect(() => {
    if (!isDriverMoving) return;
    const interval = setInterval(() => {
      setDriverProgress(prev => {
        const next = prev + 0.015;
        return next > 0.98 ? 0.05 : next;
      });

      const now = Date.now();
      setThrottleTelemetry(prev => {
        const evalRes = evaluateLocationThrottle(driverState, now, prev, 50, 10000);
        if (evalRes.shouldPush) {
          return {
            lastPushedPos: { x: driverState.x, y: driverState.y },
            lastPushedTime: now,
            totalPushesSaved: prev.totalPushesSaved,
            totalWritesSent: prev.totalWritesSent + 1
          };
        } else {
          return {
            ...prev,
            totalPushesSaved: prev.totalPushesSaved + 1
          };
        }
      });
    }, 1200);

    return () => clearInterval(interval);
  }, [isDriverMoving, driverState]);

  // Grace Period countdown ticker
  useEffect(() => {
    if (!isInBookingFlow || !isHardCutoffTriggered) {
      setGracePeriodRemainingSec(60);
      return;
    }

    const timer = setInterval(() => {
      setGracePeriodRemainingSec(prev => {
        if (prev <= 1) {
          sounds.playAlert();
          setIsInBookingFlow(false);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isInBookingFlow, isHardCutoffTriggered]);

  // Handle seat booking
  const handleConfirmSeatBooking = () => {
    if (!subTripEligibility.canBook) {
      sounds.playAlert();
      return;
    }

    sounds.playSuccess();
    const newBooking: CarpoolSegmentBooking = {
      bookingId: 'book-' + Math.random().toString(36).substring(2, 7),
      passengerName: 'You',
      fromStopId: bookingFromStopId,
      toStopId: bookingToStopId,
      seatsCount: seatsToBook,
      status: 'ACTIVE',
      bookedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setBookings(prev => [...prev, newBooking]);
    const fromStopName = activeDriver.corridorStops.find(s => s.id === bookingFromStopId)?.name;
    const toStopName = activeDriver.corridorStops.find(s => s.id === bookingToStopId)?.name;
    setBookingConfirmationSuccess(
      `🎉 Confirmed ${seatsToBook} seat(s) with ${activeDriver.driverName} from ${fromStopName} to ${toStopName}!`
    );
    setIsInBookingFlow(false);

    const price = seatsToBook * activeDriver.basePricePerSeat;
    onDeductFare?.(price);
  };

  // Rank available drivers by distance to customer's current pickup location
  const driversRankedByProximity = useMemo(() => {
    return AVAILABLE_CARPOOL_DRIVERS.map(driver => {
      // Calculate distance from passenger to driver route polyline
      const onRoute = calculatePassengerOnRoute(passengerPos, driver.routePolyline, 1500);
      const approxDistKm = +(onRoute.distanceFromHighwayMeters / 1000).toFixed(1);
      const isSelected = driver.id === selectedDriverId;
      return {
        ...driver,
        distFromPassengerKm: approxDistKm,
        isOnRoute: onRoute.isOnRoute,
        isSelected
      };
    }).sort((a, b) => a.distFromPassengerKm - b.distFromPassengerKm);
  }, [passengerPos, selectedDriverId]);

  // When live map is focused/expanded, display a sleek compact bar
  if (isMapFocused) {
    return (
      <div className="pt-1 pb-3 space-y-2 text-slate-900">
        <div className="p-3 bg-gradient-to-r from-slate-900 to-blue-950 text-white rounded-2xl shadow-lg border border-blue-500/40 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className={`w-8 h-8 rounded-xl ${activeDriver.avatarBg} text-white flex items-center justify-center font-black text-xs shadow-sm`}>
              <Car className="w-4 h-4 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-black text-xs">{activeDriver.driverName}</span>
                <span className="text-[10px] text-amber-300 font-bold">★ {activeDriver.driverRating}</span>
                <span className="text-[9px] text-blue-300 bg-blue-900/60 px-1.5 py-0.2 rounded font-mono">{activeDriver.vehiclePlate}</span>
              </div>
              <p className="text-[10px] text-slate-300 font-medium truncate max-w-[200px]">
                {activeDriver.from.split(' ')[0]} → {activeDriver.to.split(' ')[0]} • Next: {currentJourneyStage.nextStop.name.split(' ')[0]} (~{currentJourneyStage.etaMinToNext}m)
              </p>
            </div>
          </div>
          <div className="text-right">
            <span className="text-xs font-black text-emerald-400">₹{activeDriver.basePricePerSeat}</span>
            <span className="block text-[8px] text-slate-400">per seat</span>
          </div>
        </div>

        <button
          onClick={() => onToggleMapFocus?.()}
          className="w-full py-2.5 rounded-xl bg-brand-blue hover:bg-blue-600 text-white font-black text-xs shadow-md shadow-blue-500/20 transition flex items-center justify-center gap-1.5"
        >
          <span>Expand Route Details & Book Seat</span>
          <ChevronUp className="w-4 h-4" />
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4 pt-1 pb-6 text-slate-900">

      {/* 1. HERO HEADER: CLEAN & INVITING */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="font-black text-xl text-slate-900 tracking-tight">Zaldi Carpool</h3>
            <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-black uppercase tracking-wider flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-emerald-600" />
              <span>Save 60%</span>
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Real-time highway sharing near: <strong className="text-slate-800">{passengerAddress}</strong>
          </p>
        </div>

        {/* Explain / Inspector toggle */}
        <button
          onClick={() => {
            sounds.playPop();
            setShowInspector(!showInspector);
          }}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 border ${
            showInspector 
              ? 'bg-blue-50 border-blue-200 text-brand-blue' 
              : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
          }`}
        >
          <Sliders className="w-3.5 h-3.5" />
          <span>{showInspector ? 'Hide System' : 'How Matching Works'}</span>
        </button>
      </div>

      {/* 2. SUCCESS TOAST */}
      {bookingConfirmationSuccess && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-300 rounded-2xl flex items-center justify-between text-xs animate-in fade-in shadow-xs">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            <span className="font-bold text-emerald-900">{bookingConfirmationSuccess}</span>
          </div>
          <button 
            onClick={() => setBookingConfirmationSuccess(null)} 
            className="text-emerald-700 font-black text-[11px] underline ml-2"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* =========================================================================
          🌟 CORE USER REQUEST: LIST OF AVAILABLE RIDERS NEAR CUSTOMER'S LOCATION
          Clicking opens the list, and choosing one immediately opens their route!
         ========================================================================= */}
      <div className="bg-white rounded-3xl border-2 border-slate-200 shadow-sm overflow-hidden">
        
        {/* Toggle Bar / Drawer Button */}
        <button
          onClick={() => {
            sounds.playPop();
            setIsDriversListOpen(!isDriversListOpen);
          }}
          className="w-full p-3.5 bg-slate-50 hover:bg-slate-100/80 transition flex items-center justify-between border-b border-slate-200 text-left"
        >
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold text-xs shadow-xs">
              <Users className="w-4 h-4 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-black text-sm text-slate-900">
                  Available Riders Near Your Location
                </span>
                <span className="px-2 py-0.5 rounded-full bg-blue-100 text-brand-blue text-[10px] font-black">
                  {driversRankedByProximity.length} Nearby
                </span>
              </div>
              <p className="text-[11px] text-slate-500 font-medium">
                Showing carpools passing near <span className="font-bold text-slate-700 truncate inline-block max-w-[210px] align-bottom">{passengerAddress}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-600">
            <span>{isDriversListOpen ? 'Collapse' : 'Browse All'}</span>
            {isDriversListOpen ? (
              <ChevronUp className="w-4 h-4 text-slate-400" />
            ) : (
              <ChevronDown className="w-4 h-4 text-slate-400" />
            )}
          </div>
        </button>

        {/* List of Available Riders */}
        {isDriversListOpen && (
          <div className="p-3 space-y-2.5 bg-white divide-y divide-slate-100">
            {driversRankedByProximity.map((driver) => {
              const isSelected = driver.id === selectedDriverId;
              const isExpanded = isSelected && isBookingOpen;

              return (
                <div
                  key={driver.id}
                  ref={isSelected ? activeDriverCardRef : undefined}
                  onClick={() => {
                    sounds.playTap();
                    if (selectedDriverId === driver.id && isBookingOpen) {
                      setIsBookingOpen(false);
                    } else {
                      setSelectedDriverId(driver.id);
                      setIsBookingOpen(true);
                      setIsInBookingFlow(true);
                      setShowRouteVisualizer(true);
                    }
                  }}
                  className={`pt-2.5 first:pt-0 p-3 rounded-2xl cursor-pointer transition-all flex flex-col gap-3 border ${
                    isSelected
                      ? 'bg-blue-50/70 border-blue-300 ring-2 ring-blue-500/20 shadow-xs'
                      : 'border-transparent hover:bg-slate-50 hover:border-slate-200'
                  }`}
                >
                  {/* Top Row: Driver details on left, Proximity/Price/Book button on right */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 w-full">
                    {/* Left: Driver details & vehicle */}
                    <div className="flex items-start gap-3">
                      <div className={`w-10 h-10 rounded-2xl ${driver.avatarBg} text-white flex items-center justify-center font-black text-sm shadow-xs flex-shrink-0 mt-0.5`}>
                        {driver.driverName.charAt(0)}
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="font-black text-sm text-slate-900">{driver.driverName}</span>
                          <span className="flex items-center text-[10px] text-amber-600 font-bold bg-amber-50 border border-amber-200 px-1.5 py-0.2 rounded-md">
                            ★ {driver.driverRating}
                          </span>
                          <span className="text-[10px] text-slate-400">({driver.totalTrips} rides)</span>
                          {driver.verified && (
                            <ShieldCheck className="w-3.5 h-3.5 text-blue-500" />
                          )}
                        </div>

                        <p className="text-[11px] text-slate-600 font-semibold mt-0.5">
                          {driver.vehicle} • <span className="font-mono text-slate-500 text-[10px]">{driver.vehiclePlate}</span>
                        </p>

                        {/* Route Corridor Info */}
                        <div className="flex items-center gap-1 text-[11px] text-slate-500 mt-1">
                          <MapPin className="w-3 h-3 text-emerald-600 flex-shrink-0" />
                          <span className="truncate max-w-[280px]">
                            <strong>{driver.from.split(' ')[0]}</strong> → <strong>{driver.to.split(' ')[0]}</strong> ({driver.corridorSummary})
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Right: Proximity badge, Price & Book Button */}
                    <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-1 flex-shrink-0 border-t sm:border-t-0 pt-2 sm:pt-0 border-slate-100">
                      <div className="flex items-center gap-2">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 text-[10px] font-bold">
                          <Radio className="w-2.5 h-2.5 text-blue-500 animate-pulse" />
                          <span>~{driver.distFromPassengerKm} km to pickup</span>
                        </span>

                        <span className="text-xs font-black text-emerald-700">
                          ₹{driver.basePricePerSeat} / seat
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5 mt-1">
                        {/* Book Button (opens this div for this driver right here) */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            sounds.playSuccess();
                            if (selectedDriverId === driver.id) {
                              setIsBookingOpen(prev => !prev);
                            } else {
                              setSelectedDriverId(driver.id);
                              setIsBookingOpen(true);
                              setIsInBookingFlow(true);
                              setShowRouteVisualizer(true);
                            }
                          }}
                          className={`px-4 py-1.5 rounded-xl font-black text-xs transition shadow-md flex items-center gap-1.5 active:scale-95 ${
                            isExpanded
                              ? 'bg-slate-900 hover:bg-slate-800 text-white shadow-slate-900/25 ring-2 ring-slate-700/40'
                              : 'bg-brand-blue hover:bg-blue-600 text-white shadow-blue-600/25'
                          }`}
                          title={isExpanded ? "Close booking section" : "Book seat with this driver"}
                        >
                          {isExpanded ? (
                            <>
                              <ChevronUp className="w-3.5 h-3.5 text-white" />
                              <span>Close</span>
                            </>
                          ) : (
                            <>
                              <Car className="w-3.5 h-3.5 text-white" />
                              <span>Book</span>
                            </>
                          )}
                        </button>

                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            sounds.playPop();
                            setSelectedDriverId(driver.id);
                            setIsBookingOpen(true);
                            setShowRouteVisualizer(true);
                            if (onViewRouteOnMap) {
                              onViewRouteOnMap(driver);
                            }
                          }}
                          className="px-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 font-black text-xs transition shadow-xs flex items-center gap-1"
                          title="View route corridor on map"
                        >
                          <Compass className="w-3.5 h-3.5 text-blue-600" />
                          <span>View Route</span>
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* INLINE BOOKING & ROUTE CORRIDOR SECTION (Opens directly inside this rider card when clicking Book!) */}
                  {isExpanded && (
                    <div 
                      onClick={(e) => e.stopPropagation()}
                      className="w-full mt-3 pt-3 border-t border-slate-200/90 space-y-3 animate-in fade-in cursor-default"
                    >
                      {/* Driver Status Banner */}
                      <div className="p-3 bg-gradient-to-r from-slate-900 via-slate-800 to-blue-950 text-white rounded-2xl flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-xl bg-blue-500/20 border border-blue-400/30 flex items-center justify-center font-black text-white text-xs shadow-md">
                            <Car className="w-4 h-4 text-blue-300" />
                          </div>
                          <div>
                            <div className="flex items-center gap-1.5">
                              <span className="font-black text-xs">{activeDriver.driverName}</span>
                              <span className="text-[10px] text-amber-300 font-bold">★ {activeDriver.driverRating}</span>
                              <ShieldCheck className="w-3 h-3 text-blue-400" />
                            </div>
                            <p className="text-[10px] text-slate-300 font-medium">
                              {activeDriver.vehicle} • {activeDriver.vehiclePlate} ({activeDriver.vehicleTier})
                            </p>
                          </div>
                        </div>

                        <div className="text-right flex flex-col items-end">
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-black uppercase ${
                            isVehicleVisibleToPassenger
                              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/30'
                              : 'bg-rose-500/20 text-rose-300 border border-rose-400/30'
                          }`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${isVehicleVisibleToPassenger ? 'bg-emerald-400 animate-pulse' : 'bg-rose-400'}`} />
                            <span>{isVehicleVisibleToPassenger ? 'On Your Route' : 'Passed / Filtered'}</span>
                          </span>
                          <div className="flex items-center gap-1.5 mt-1">
                            <span className="text-[10px] text-slate-400">
                              ₹{activeDriver.basePricePerSeat} / seat
                            </span>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                sounds.playPop();
                                if (onViewRouteOnMap) {
                                  onViewRouteOnMap(activeDriver);
                                }
                              }}
                              className="px-2 py-0.5 rounded-lg bg-blue-500/30 hover:bg-blue-500/50 text-blue-200 border border-blue-400/40 font-bold text-[9px] flex items-center gap-1 transition"
                              title="View full road route on map"
                            >
                              <Compass className="w-2.5 h-2.5 text-cyan-300" />
                              <span>View on Map</span>
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Dynamic Visual Route Progress Bar between Major Waypoints */}
                      <div className="px-3.5 pt-3 pb-3 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-3">
                        <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                          <div className="flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-blue-500 animate-ping" />
                            <div className="flex items-center gap-1.5 font-black text-slate-800">
                              <span>En Route:</span>
                              <span className="text-blue-600 font-extrabold">{currentJourneyStage.prevStop.name}</span>
                              <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
                              <span className="text-emerald-700 font-extrabold">{currentJourneyStage.nextStop.name}</span>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            <span className="px-2.5 py-0.5 rounded-full bg-blue-100 text-brand-blue font-bold text-[11px] flex items-center gap-1">
                              <Clock className="w-3 h-3 text-brand-blue" />
                              <span>Next Stop in ~{currentJourneyStage.etaMinToNext} min ({currentJourneyStage.distanceToNextKm} km)</span>
                            </span>
                            <span className="font-mono font-black text-[11px] text-slate-600 bg-slate-200/80 px-2 py-0.5 rounded-md">
                              {currentJourneyStage.currentPct}% Completed
                            </span>
                          </div>
                        </div>

                        {/* Interactive Multi-Waypoint Route Progress Track */}
                        <div className="relative pt-6 pb-2 px-3">
                          <div className="h-3 w-full bg-slate-200 rounded-full relative overflow-hidden shadow-inner">
                            <div 
                              className="h-full bg-gradient-to-r from-blue-600 via-sky-500 to-emerald-400 rounded-full transition-all duration-700 ease-linear shadow-sm"
                              style={{ width: `${currentJourneyStage.currentPct}%` }}
                            />
                            <div 
                              className="absolute inset-y-0 w-8 bg-white/40 blur-xs rounded-full pointer-events-none -translate-x-full animate-[shimmer_2s_infinite]"
                              style={{ left: `${currentJourneyStage.currentPct}%` }}
                            />
                          </div>

                          {/* Moving 2D Vehicle Marker Floating on the Highway Track */}
                          <div 
                            className="absolute top-1 -translate-x-1/2 z-20 transition-all duration-700 ease-linear pointer-events-none flex flex-col items-center"
                            style={{ left: `${Math.max(2, Math.min(98, currentJourneyStage.currentPct))}%` }}
                          >
                            <div className="px-1.5 py-0.5 rounded-full bg-slate-900 text-white text-[9px] font-black shadow-md border border-slate-700 flex items-center gap-1 mb-0.5 whitespace-nowrap">
                              <Car className="w-2.5 h-2.5 text-amber-400" />
                              <span>{activeDriver.vehicle.split(' ')[0]} ({currentJourneyStage.currentPct}%)</span>
                            </div>

                            <div className="relative">
                              <div className="w-5 h-5 rounded-full bg-gradient-to-b from-blue-500 to-indigo-600 border-2 border-white shadow-lg flex items-center justify-center">
                                <Navigation 
                                  className="w-2.5 h-2.5 text-white transform -rotate-45" 
                                />
                              </div>
                              <div className="absolute -inset-1 rounded-full bg-blue-400/40 blur-xs pointer-events-none animate-pulse" />
                            </div>
                          </div>

                          {/* Waypoint Milestone Pins across the Highway Track */}
                          <div className="absolute inset-x-3 top-5 pointer-events-none flex justify-between">
                            {waypointsWithProgress.map((wp) => {
                              const isPassed = currentJourneyStage.currentPct >= wp.progressPct;
                              const isNext = wp.id === currentJourneyStage.nextStop.id;
                              const isSelectedPickup = wp.id === bookingFromStopId;
                              const isSelectedDrop = wp.id === bookingToStopId;

                              return (
                                <div 
                                  key={wp.id} 
                                  className="absolute -translate-x-1/2 flex flex-col items-center"
                                  style={{ left: `${wp.progressPct}%` }}
                                >
                                  <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center transition-all duration-500 ${
                                    isPassed 
                                      ? 'bg-emerald-500 border-white text-white shadow-sm ring-2 ring-emerald-400/40' 
                                      : isNext 
                                      ? 'bg-blue-600 border-white text-white animate-pulse ring-4 ring-blue-400/30' 
                                      : 'bg-white border-slate-300 text-slate-400'
                                  }`}>
                                    {isPassed ? (
                                      <Check className="w-2.5 h-2.5 stroke-[3]" />
                                    ) : (
                                      <span className="w-1.5 h-1.5 rounded-full bg-current" />
                                    )}
                                  </div>

                                  <div className="mt-2 flex flex-col items-center text-center max-w-[70px]">
                                    <span className={`text-[10px] leading-tight font-extrabold transition-colors ${
                                      isSelectedPickup
                                        ? 'text-emerald-700 bg-emerald-100/90 px-1 rounded'
                                        : isSelectedDrop
                                        ? 'text-blue-700 bg-blue-100/90 px-1 rounded'
                                        : isNext
                                        ? 'text-blue-600 font-black'
                                        : isPassed
                                        ? 'text-slate-800'
                                        : 'text-slate-400'
                                    }`}>
                                      {wp.name.split(' ')[0]}
                                    </span>
                                    <span className="text-[8px] font-mono text-slate-400 font-semibold">
                                      {wp.eta}
                                    </span>
                                    {isSelectedPickup && (
                                      <span className="mt-0.5 px-1 py-0.2 rounded bg-emerald-500 text-white text-[7px] font-black uppercase tracking-tighter">
                                        Pickup
                                      </span>
                                    )}
                                    {isSelectedDrop && (
                                      <span className="mt-0.5 px-1 py-0.2 rounded bg-blue-600 text-white text-[7px] font-black uppercase tracking-tighter">
                                        Drop
                                      </span>
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>

                        <div className="h-9" />

                        <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between text-[11px] text-slate-500">
                          <span className="flex items-center gap-1.5">
                            <span className="text-slate-400">Current Leg Progress:</span>
                            <strong className="text-slate-800">
                              {currentJourneyStage.prevStop.name.split(' ')[0]} → {currentJourneyStage.nextStop.name.split(' ')[0]}
                            </strong>
                          </span>
                          <div className="flex items-center gap-2">
                            <div className="w-20 h-1.5 bg-slate-200 rounded-full overflow-hidden">
                              <div 
                                className="h-full bg-blue-500 transition-all duration-500"
                                style={{ width: `${currentJourneyStage.segCompleted}%` }}
                              />
                            </div>
                            <span className="font-mono font-bold text-slate-700">{currentJourneyStage.segCompleted}%</span>
                          </div>
                        </div>
                      </div>

                      {/* Live Route Corridor & Waypoints Visualizer */}
                      <div ref={routeVisualizerRef} className="px-3.5 py-3 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Compass className="w-4 h-4 text-brand-blue" />
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="font-black text-xs text-slate-800">Route Corridor Map</span>
                              <span className="text-[10px] text-slate-500 font-semibold">• {activeDriver.corridorStops.length} Waypoints</span>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => setShowRouteVisualizer(!showRouteVisualizer)}
                              className="text-[11px] font-bold text-slate-600 hover:text-slate-900 flex items-center gap-1"
                            >
                              <span>{showRouteVisualizer ? 'Hide Route' : 'Show Route'}</span>
                              {showRouteVisualizer ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                            </button>

                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                sounds.playPop();
                                if (onViewRouteOnMap) {
                                  onViewRouteOnMap(activeDriver);
                                }
                              }}
                              className="px-2.5 py-1 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-black text-[10px] flex items-center gap-1 shadow-xs transition"
                              title="View full road route on interactive city map"
                            >
                              <Radio className="w-3 h-3 text-cyan-200 animate-pulse" />
                              <span>Focus City Map</span>
                            </button>
                          </div>
                        </div>

                        {showRouteVisualizer && (
                          <div className="space-y-3 animate-in fade-in">
                            <div className="relative w-full h-44 bg-slate-900 rounded-2xl overflow-hidden border border-slate-800 shadow-inner">
                              <div className="absolute inset-0 opacity-15 bg-[radial-gradient(#38bdf8_1px,transparent_1px)] [background-size:12px_12px]" />
                              
                              <svg className="w-full h-full" viewBox="15 25 65 50" preserveAspectRatio="xMidYMid meet">
                                <defs>
                                  <linearGradient id="corridorMiniGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                                    <stop offset="0%" stopColor="#38bdf8" />
                                    <stop offset="50%" stopColor="#06b6d4" />
                                    <stop offset="100%" stopColor="#10b981" />
                                  </linearGradient>
                                  <filter id="corridorGlow">
                                    <feGaussianBlur stdDeviation="1.5" result="coloredBlur" />
                                    <feMerge>
                                      <feMergeNode in="coloredBlur" />
                                      <feMergeNode in="SourceGraphic" />
                                    </feMerge>
                                  </filter>
                                </defs>

                                {corridorSvgPath && (
                                  <path
                                    d={corridorSvgPath}
                                    fill="none"
                                    stroke="#06b6d4"
                                    strokeWidth="3.8"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    opacity="0.4"
                                    filter="url(#corridorGlow)"
                                  />
                                )}

                                {corridorSvgPath && (
                                  <path
                                    d={corridorSvgPath}
                                    fill="none"
                                    stroke="url(#corridorMiniGrad)"
                                    strokeWidth="2.4"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                  />
                                )}

                                {corridorSvgPath && (
                                  <path
                                    d={corridorSvgPath}
                                    fill="none"
                                    stroke="#ffffff"
                                    strokeWidth="1.0"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeDasharray="3 2"
                                    className="animate-dash"
                                    opacity="0.9"
                                  />
                                )}

                                <g>
                                  {onRouteCheck.closestPoint && (
                                    <line
                                      x1={passengerPos.x}
                                      y1={passengerPos.y}
                                      x2={onRouteCheck.closestPoint.x}
                                      y2={onRouteCheck.closestPoint.y}
                                      stroke="#f43f5e"
                                      strokeWidth="0.8"
                                      strokeDasharray="1.5 1.5"
                                    />
                                  )}
                                  <circle cx={passengerPos.x} cy={passengerPos.y} r="2.2" fill="#f43f5e" stroke="#ffffff" strokeWidth="0.8" />
                                  <text x={passengerPos.x + 2} y={passengerPos.y - 1.5} fill="#fda4af" fontSize="2.8" fontWeight="bold">
                                    You ({onRouteCheck.distanceFromHighwayMeters}m)
                                  </text>
                                </g>

                                {activeDriver.corridorStops.map((stop) => {
                                  const isBoarding = stop.id === bookingFromStopId;
                                  const isDropping = stop.id === bookingToStopId;

                                  return (
                                    <g key={stop.id}>
                                      <circle
                                        cx={stop.location.x}
                                        cy={stop.location.y}
                                        r={isBoarding || isDropping ? "2.6" : "1.8"}
                                        fill={isBoarding ? "#10b981" : isDropping ? "#3b82f6" : "#ffffff"}
                                        stroke={isBoarding || isDropping ? "#ffffff" : "#0284c7"}
                                        strokeWidth="0.8"
                                      />
                                      <text
                                        x={stop.location.x}
                                        y={stop.location.y + 4.2}
                                        textAnchor="middle"
                                        fill="#e2e8f0"
                                        fontSize="2.4"
                                        fontWeight="bold"
                                      >
                                        {stop.name.split(' ')[0]}
                                      </text>
                                    </g>
                                  );
                                })}

                                <g transform={`translate(${driverState.x}, ${driverState.y}) rotate(${driverState.headingDeg})`}>
                                  <circle cx="0" cy="0" r="3.2" fill="#3b82f6" stroke="#ffffff" strokeWidth="0.9" />
                                  <polygon points="-1.5,-4 1.5,-4 2.5,-8 -2.5,-8" fill="#fef08a" opacity="0.6" />
                                  <polygon points="0,-2.2 1.5,1.5 -1.5,1.5" fill="#ffffff" />
                                </g>
                              </svg>

                              <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between text-[9px] text-slate-300 bg-slate-950/80 backdrop-blur-sm px-2.5 py-1 rounded-xl border border-slate-800 pointer-events-none">
                                <div className="flex items-center gap-2">
                                  <span className="flex items-center gap-1">
                                    <span className="w-1.5 h-1.5 rounded-full bg-cyan-400"></span>
                                    <span>Highway Corridor</span>
                                  </span>
                                  <span className="flex items-center gap-1">
                                    <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
                                    <span>Your Pickup</span>
                                  </span>
                                </div>
                                <span className="font-mono text-cyan-300 font-bold">
                                  Vehicle: {currentJourneyStage.currentPct}% Completed
                                </span>
                              </div>
                            </div>

                            <div className="space-y-1.5">
                              <span className="text-[10px] font-black uppercase text-slate-400 block">
                                Corridor Stops Timeline (Tap to pick Boarding / Drop):
                              </span>
                              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
                                {activeDriver.corridorStops.map((stop, sIdx) => {
                                  const isBoarding = stop.id === bookingFromStopId;
                                  const isDropping = stop.id === bookingToStopId;

                                  return (
                                    <div
                                      key={stop.id}
                                      className={`flex-shrink-0 px-2.5 py-1.5 rounded-xl border text-xs transition ${
                                        isBoarding
                                          ? 'bg-emerald-50 border-emerald-400 text-emerald-900 font-extrabold shadow-xs'
                                          : isDropping
                                          ? 'bg-blue-50 border-blue-400 text-blue-900 font-extrabold shadow-xs'
                                          : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300'
                                      }`}
                                    >
                                      <div className="flex items-center gap-1">
                                        <span className={`w-1.5 h-1.5 rounded-full ${
                                          isBoarding ? 'bg-emerald-500' : isDropping ? 'bg-blue-500' : 'bg-slate-300'
                                        }`} />
                                        <span className="font-bold text-[11px] whitespace-nowrap">{stop.name}</span>
                                      </div>
                                      <div className="flex items-center justify-between gap-2 mt-1 text-[9px] text-slate-500 font-medium">
                                        <span>{stop.eta}</span>
                                        <div className="flex items-center gap-1 font-bold">
                                          {!isBoarding && sIdx < activeDriver.corridorStops.length - 1 && (
                                            <button
                                              onClick={() => {
                                                sounds.playTap();
                                                setBookingFromStopId(stop.id);
                                              }}
                                              className="text-emerald-700 hover:underline"
                                            >
                                              Pickup
                                            </button>
                                          )}
                                          {!isDropping && sIdx > 0 && (
                                            <button
                                              onClick={() => {
                                                sounds.playTap();
                                                setBookingToStopId(stop.id);
                                              }}
                                              className="text-blue-700 hover:underline"
                                            >
                                              Drop
                                            </button>
                                          )}
                                        </div>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Easy Booking Bar */}
                      <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-3">
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                          <div>
                            <label className="text-[10px] font-black uppercase text-slate-400 block mb-1">
                              Your Boarding Stop
                            </label>
                            <select 
                              value={bookingFromStopId} 
                              onChange={(e) => setBookingFromStopId(e.target.value)}
                              className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                              {activeDriver.corridorStops.slice(0, -1).map(s => (
                                <option key={s.id} value={s.id}>{s.name} ({s.eta})</option>
                              ))}
                            </select>
                          </div>

                          <div>
                            <label className="text-[10px] font-black uppercase text-slate-400 block mb-1">
                              Your Destination Stop
                            </label>
                            <select 
                              value={bookingToStopId} 
                              onChange={(e) => setBookingToStopId(e.target.value)}
                              className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                              {activeDriver.corridorStops.slice(1).map(s => (
                                <option key={s.id} value={s.id}>{s.name} ({s.eta})</option>
                              ))}
                            </select>
                          </div>

                          <div>
                            <label className="text-[10px] font-black uppercase text-slate-400 block mb-1">
                              Seats Needed
                            </label>
                            <div className="flex items-center justify-between bg-white border border-slate-200 rounded-xl px-2 py-1">
                              <button 
                                onClick={() => setSeatsToBook(Math.max(1, seatsToBook - 1))}
                                className="w-7 h-7 rounded-lg bg-slate-100 border border-slate-200 font-black text-slate-700 flex items-center justify-center hover:bg-slate-200"
                              >
                                -
                              </button>
                              <span className="font-black text-xs text-slate-900">{seatsToBook} Seat{seatsToBook > 1 ? 's' : ''}</span>
                              <button 
                                onClick={() => setSeatsToBook(Math.min(3, seatsToBook + 1))}
                                className="w-7 h-7 rounded-lg bg-slate-100 border border-slate-200 font-black text-slate-700 flex items-center justify-center hover:bg-slate-200"
                              >
                                +
                              </button>
                            </div>
                          </div>
                        </div>

                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-2 border-t border-slate-200 text-xs">
                          <div className="flex items-center gap-2">
                            {subTripEligibility.canBook ? (
                              <span className="px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[11px] flex items-center gap-1.5">
                                <Check className="w-3.5 h-3.5 text-emerald-600" />
                                <span>
                                  {subTripEligibility.minAvailableSeatsAcrossTrip} seats open on your leg (Dynamic segment capacity)
                                </span>
                              </span>
                            ) : (
                              <span className="px-2.5 py-1 rounded-full bg-rose-100 text-rose-800 font-bold text-[11px] flex items-center gap-1.5">
                                <XCircle className="w-3.5 h-3.5 text-rose-600" />
                                <span>Fully booked on {subTripEligibility.bottleneckSegment?.fromStopName}</span>
                              </span>
                            )}
                          </div>

                          {isProtectedByGracePeriod && (
                            <span className="px-2.5 py-1 rounded-full bg-amber-100 text-amber-800 font-black text-[11px] flex items-center gap-1 animate-pulse">
                              <Timer className="w-3.5 h-3.5 text-amber-600" />
                              <span>60s Lock: {gracePeriodRemainingSec}s left to confirm</span>
                            </span>
                          )}
                        </div>

                        <div className="flex items-center justify-between gap-3 pt-1">
                          <div>
                            <span className="text-[10px] text-slate-400 block font-semibold">Total Fare</span>
                            <span className="text-lg font-black text-slate-900">
                              ₹{seatsToBook * activeDriver.basePricePerSeat}
                            </span>
                          </div>

                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => setIsBookingOpen(false)}
                              className="px-3 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold text-xs"
                            >
                              Close
                            </button>

                            <button
                              onClick={handleConfirmSeatBooking}
                              disabled={!subTripEligibility.canBook}
                              className={`px-5 py-2.5 rounded-xl font-black text-xs transition shadow-md flex items-center gap-1.5 ${
                                subTripEligibility.canBook
                                  ? 'bg-brand-blue hover:bg-blue-600 text-white shadow-blue-500/20'
                                  : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                              }`}
                            >
                              <span>Book Carpool Seat</span>
                              <ArrowRight className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>

                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 5. COLLAPSIBLE "HOW MATCHING WORKS" INSPECTOR */}
      {showInspector && (
        <div className="bg-slate-50 border-2 border-slate-200/80 rounded-3xl p-4 space-y-3 animate-in fade-in zoom-in-98">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-brand-blue" />
              <h4 className="font-black text-sm text-slate-900">
                Under the Hood: 5 Core Carpool Systems
              </h4>
            </div>
            <button 
              onClick={() => setIsDriverMoving(!isDriverMoving)}
              className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-slate-700 font-bold text-[11px] flex items-center gap-1"
            >
              <RefreshCw className={`w-3 h-3 ${isDriverMoving ? 'animate-spin' : ''}`} />
              <span>{isDriverMoving ? 'Pause Simulation' : 'Resume'}</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
            
            {/* 1. On-Route */}
            <div className="p-3 bg-white rounded-xl border border-slate-200 space-y-1">
              <div className="flex justify-between items-center">
                <strong className="text-[11px] text-slate-800">1. On-Route Highway Check</strong>
                <span className={`text-[10px] font-black px-1.5 py-0.5 rounded ${
                  onRouteCheck.isOnRoute ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                }`}>
                  {onRouteCheck.distanceFromHighwayMeters}m from line
                </span>
              </div>
              <p className="text-[11px] text-slate-500">
                Calculates perpendicular distance from passenger to highway polyline (tolerance: {toleranceMeters}m).
              </p>
            </div>

            {/* 2. Throttled Telemetry */}
            <div className="p-3 bg-white rounded-xl border border-slate-200 space-y-1">
              <div className="flex justify-between items-center">
                <strong className="text-[11px] text-slate-800">2. Throttled Telemetry</strong>
                <span className="text-[10px] font-black px-1.5 py-0.5 rounded bg-cyan-100 text-cyan-800">
                  {throttleTelemetry.totalWritesSent} writes sent
                </span>
              </div>
              <p className="text-[11px] text-slate-500">
                Only commits to database every 50 meters or 10 seconds. Saved {throttleTelemetry.totalPushesSaved} redundant writes!
              </p>
            </div>

            {/* 3. Directional Bearing */}
            <div className="p-3 bg-white rounded-xl border border-slate-200 space-y-1">
              <div className="flex justify-between items-center">
                <strong className="text-[11px] text-slate-800">3. Directional Filtering</strong>
                <span className={`text-[10px] font-black px-1.5 py-0.5 rounded ${
                  directionalCheck.isEligibleBeforeCutoff ? 'bg-blue-100 text-blue-800' : 'bg-amber-100 text-amber-800'
                }`}>
                  {directionalCheck.hasPassedPassenger ? 'Passed (Dropped)' : 'Approaching'}
                </span>
              </div>
              <p className="text-[11px] text-slate-500">
                Calculates driver bearing vector. If moving away, vehicle drops immediately without lingering.
              </p>
            </div>

            {/* 4. Dynamic Seat Segments */}
            <div className="p-3 bg-white rounded-xl border border-slate-200 space-y-1">
              <div className="flex justify-between items-center">
                <strong className="text-[11px] text-slate-800">4. Dynamic Seat Reuse</strong>
                <span className="text-[10px] font-black px-1.5 py-0.5 rounded bg-purple-100 text-purple-800">
                  Segment-based
                </span>
              </div>
              <p className="text-[11px] text-slate-500">
                Seats booked for the first half of a route instantly reopen for downstream passengers.
              </p>
            </div>

          </div>

          {/* 5. 60s Grace note */}
          <div className="p-2.5 bg-blue-50/80 border border-blue-200 rounded-xl flex items-center gap-2 text-xs text-blue-900">
            <Timer className="w-4 h-4 text-blue-600 flex-shrink-0" />
            <span>
              <strong>5. 60-Second Grace Period:</strong> If the vehicle passes the 5km cutoff while you are in checkout, your session stays protected for 60 seconds so your booking doesn't get rejected.
            </span>
          </div>
        </div>
      )}

    </div>
  );
};
