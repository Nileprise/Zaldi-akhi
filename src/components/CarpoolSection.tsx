import React, { useState, useMemo, useEffect, useRef } from 'react';
import { 
  Users, MapPin, Navigation, Clock, ShieldCheck, 
  ArrowRight, Check, AlertTriangle, AlertCircle, Timer, Zap, 
  Car, ChevronRight, ChevronLeft, Sparkles, 
  CheckCircle2, XCircle, SlidersHorizontal, Filter, 
  Star, Compass, Radio, ChevronUp, X, Bell, Menu,
  ArrowUpDown, CreditCard, Wallet, QrCode, Share2, Eye,
  Calendar, Phone, MessageSquare, Award, Leaf, Fuel,
  Info, Shield, CheckCircle, RefreshCw, Copy, CheckCheck,
  Send, AlertOctagon, Plus, Key, Crosshair, Map as MapIcon,
  Flame, BatteryCharging, RadioTower
} from 'lucide-react';
import { sounds } from '../services/audio';
import { 
  CarpoolRouteStop,
  CarpoolSegmentBooking,
  RouteMatchType,
  RouteMatchAnalysis,
  VerifiedTransferConnection,
  matchDriverRouteToPassenger
} from '../services/carpoolService';
import { RoutePoint } from '../types';
import { renderVectorVehicleSvg } from './Vehicle5dIcon';

export interface AvailableCarpoolDriver {
  id: string;
  driverName: string;
  driverAvatar: string;
  driverPhone: string;
  driverRating: number;
  totalTrips: number;
  vehicle: string;
  vehiclePlate: string;
  vehicleTier: string;
  carType: 'SWIFT' | 'I20' | 'NEXON' | 'DZIRE' | 'CITY' | 'INNOVA' | 'CAB' | 'XL' | 'PREMIUM' | 'ZALDI_XL';
  avatarBg: string;
  from: string;
  to: string;
  departsIn: string;
  departureTime: string;
  basePricePerSeat: number;
  totalSeats: number;
  availableSeatsCount: number;
  verified: boolean;
  hasAC?: boolean;
  instantBooking?: boolean;
  corridorStops: CarpoolRouteStop[];
  routePolyline: RoutePoint[];
  driverProgress: number; // 0 to 1 along polyline
  initialBookings: CarpoolSegmentBooking[];
  corridorSummary: string;
  liveSpeedKmh: number;
  lastPingSecondsAgo: number;
  currentCoords?: { x: number; y: number };
}

export interface ActiveCarpoolBooking {
  bookingId: string;
  boardingPin: string;
  driverId: string;
  driverName: string;
  driverAvatar: string;
  driverPhone: string;
  driverRating: number;
  vehicle: string;
  vehiclePlate: string;
  carType: string;
  pickupStopName: string;
  pickupCoords: { x: number; y: number };
  dropoffStopName: string;
  dropoffCoords: { x: number; y: number };
  scheduledDeparture: string;
  passengerCount: number;
  seatPrice: number;
  totalPaid: number;
  paymentMethod: 'UPI' | 'CARD' | 'WALLET';
  status: 'APPROACHING_PICKUP' | 'ARRIVED_AT_BAY' | 'IN_TRANSIT' | 'COMPLETED' | 'CANCELLED';
  bookedAt: number;
  driverProgress: number; // 0 to 1
  driverCoords: { x: number; y: number };
  driverSpeedKmh: number;
  driverHeadingDeg: number;
  distanceToPickupKm: number;
  etaMinutes: number;
  chatMessages: Array<{ id: string; sender: 'PASSENGER' | 'DRIVER'; text: string; time: string }>;
}

export const KNOWN_CORRIDOR_LOCATIONS: Record<string, { x: number; y: number; name: string }> = {
  'hanamkonda': { x: 75, y: 42, name: 'Hanamkonda, Warangal' },
  'warangal': { x: 74, y: 58, name: 'Warangal' },
  'kazipet': { x: 68, y: 52, name: 'Kazipet' },
  'jangaon': { x: 66, y: 44, name: 'Jangaon' },
  'ghatkesar': { x: 60, y: 36, name: 'Ghatkesar' },
  'uppal': { x: 56, y: 34, name: 'Uppal Metro Hub' },
  'hyderabad': { x: 50, y: 36, name: 'Hyderabad Central' },
  'secunderabad': { x: 52, y: 30, name: 'Secunderabad Stn' },
  'mindspace': { x: 38, y: 50, name: 'Mindspace (Hitec)' },
  'hitec': { x: 38, y: 50, name: 'Mindspace (Hitec)' },
  'airport': { x: 42, y: 70, name: 'RGIA Airport' },
  'rgia': { x: 42, y: 70, name: 'RGIA Airport' },
  'lb nagar': { x: 54, y: 46, name: 'LB Nagar' },
};

export function getCoordinatesForName(name: string, fallback: { x: number; y: number }): { x: number; y: number } {
  const lower = name.toLowerCase().trim();
  for (const [key, val] of Object.entries(KNOWN_CORRIDOR_LOCATIONS)) {
    if (lower.includes(key)) {
      return { x: val.x, y: val.y };
    }
  }
  return fallback;
}

export const INITIAL_AVAILABLE_DRIVERS: AvailableCarpoolDriver[] = [
  {
    id: 'pool-ramesh',
    driverName: 'Ramesh Kumar',
    driverAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    driverPhone: '+91 98490 12345',
    driverRating: 4.88,
    totalTrips: 48,
    vehicle: 'Maruti Dzire Prime',
    vehiclePlate: 'TS 09 AB 1234',
    vehicleTier: 'Cab Prime Sedan',
    carType: 'CAB',
    avatarBg: 'bg-emerald-600',
    from: 'Hanamkonda, Warangal',
    to: 'Hyderabad',
    departsIn: '20 mins',
    departureTime: '08:00 AM',
    basePricePerSeat: 350,
    totalSeats: 4,
    availableSeatsCount: 3,
    verified: true,
    hasAC: true,
    instantBooking: true,
    corridorSummary: 'Warangal → Ghatkesar → Uppal → Hyderabad',
    driverProgress: 0.24,
    liveSpeedKmh: 64,
    lastPingSecondsAgo: 2,
    corridorStops: [
      { id: 'stop-r1', name: 'Warangal', order: 0, location: { x: 74, y: 58 }, eta: '07:00 AM (Start)', isLegallyApprovedStop: true, legalStopType: 'Authorized Bus Terminal Bay' },
      { id: 'stop-r2', name: 'Hanamkonda', order: 1, location: { x: 75, y: 42 }, eta: '07:30 AM (Pickup)', isLegallyApprovedStop: true, legalStopType: 'Designated Bus Bay' },
      { id: 'stop-r3', name: 'Ghatkesar', order: 2, location: { x: 60, y: 36 }, eta: '09:30 AM', isLegallyApprovedStop: true, legalStopType: 'ORR Highway Transit Bay' },
      { id: 'stop-r4', name: 'Uppal Metro Hub', order: 3, location: { x: 56, y: 34 }, eta: '10:00 AM', isLegallyApprovedStop: true, legalStopType: 'Metro Kiss-and-Ride Bay' },
      { id: 'stop-r5', name: 'Hyderabad Central', order: 4, location: { x: 50, y: 36 }, eta: '10:30 AM (Driver destination)', isLegallyApprovedStop: true, legalStopType: 'Central Transit Hub' },
    ],
    routePolyline: [
      { x: 74, y: 58, streetName: 'Warangal Station Ramp' },
      { x: 75, y: 42, streetName: 'Hanamkonda Junction' },
      { x: 68, y: 52, streetName: 'Kazipet Highway Corridor' },
      { x: 60, y: 36, streetName: 'Ghatkesar Toll Ring Road' },
      { x: 56, y: 34, streetName: 'Uppal Metro Corridor' },
      { x: 50, y: 36, streetName: 'Hyderabad Central Corridor' }
    ],
    initialBookings: []
  },
  {
    id: 'pool-suresh',
    driverName: 'Suresh Nair',
    driverAvatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150&auto=format&fit=crop&q=80',
    driverPhone: '+91 97000 67890',
    driverRating: 4.94,
    totalTrips: 68,
    vehicle: 'Toyota Innova Crysta',
    vehiclePlate: 'TS 07 EF 9988',
    vehicleTier: 'Zaldi XL Prime SUV',
    carType: 'PREMIUM',
    avatarBg: 'bg-indigo-600',
    from: 'Hanamkonda',
    to: 'Mindspace (Hitec)',
    departsIn: '35 mins',
    departureTime: '08:15 AM',
    basePricePerSeat: 390,
    totalSeats: 6,
    availableSeatsCount: 4,
    verified: true,
    hasAC: true,
    instantBooking: true,
    corridorSummary: 'Hanamkonda → Ghatkesar → Uppal → Mindspace (Hitec)',
    driverProgress: 0.18,
    liveSpeedKmh: 68,
    lastPingSecondsAgo: 1,
    corridorStops: [
      { id: 'stop-c1', name: 'Hanamkonda', order: 0, location: { x: 75, y: 42 }, eta: '08:15 AM (Pickup)', isLegallyApprovedStop: true, legalStopType: 'Designated Bus Station Bay' },
      { id: 'stop-c2', name: 'Kazipet', order: 1, location: { x: 68, y: 52 }, eta: '08:35 AM', isLegallyApprovedStop: true, legalStopType: 'Railway Transit Lane' },
      { id: 'stop-c3', name: 'Ghatkesar', order: 2, location: { x: 60, y: 36 }, eta: '09:40 AM', isLegallyApprovedStop: true, legalStopType: 'ORR Toll Plazas' },
      { id: 'stop-c4', name: 'Uppal', order: 3, location: { x: 56, y: 34 }, eta: '10:05 AM', isLegallyApprovedStop: true, legalStopType: 'Metro Kiss-and-Ride Bay' },
      { id: 'stop-c5', name: 'Mindspace (Hitec)', order: 4, location: { x: 38, y: 50 }, eta: '10:45 AM (Destination)', isLegallyApprovedStop: true, legalStopType: 'IT Park Regulated Drop Bay' }
    ],
    routePolyline: [
      { x: 75, y: 42, streetName: 'Hanamkonda Bypass' },
      { x: 68, y: 52, streetName: 'Kazipet Link' },
      { x: 60, y: 36, streetName: 'Ghatkesar Express' },
      { x: 56, y: 34, streetName: 'Uppal Elevated Expressway' },
      { x: 38, y: 50, streetName: 'Hitec City IT Corridor' }
    ],
    initialBookings: []
  },
  {
    id: 'pool-sandeep',
    driverName: 'Sandeep Reddy',
    driverAvatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
    driverPhone: '+91 91210 44556',
    driverRating: 4.76,
    totalTrips: 31,
    vehicle: 'Hyundai i20 Asta',
    vehiclePlate: 'TS 08 CD 5678',
    vehicleTier: 'Premium Hatchback',
    carType: 'I20',
    avatarBg: 'bg-blue-600',
    from: 'Warangal',
    to: 'LB Nagar',
    departsIn: '40 mins',
    departureTime: '08:30 AM',
    basePricePerSeat: 310,
    totalSeats: 3,
    availableSeatsCount: 2,
    verified: true,
    hasAC: true,
    instantBooking: true,
    corridorSummary: 'Warangal → Ghatkesar → Uppal Metro Hub → LB Nagar',
    driverProgress: 0.12,
    liveSpeedKmh: 58,
    lastPingSecondsAgo: 3,
    corridorStops: [
      { id: 'stop-s1', name: 'Warangal', order: 0, location: { x: 74, y: 58 }, eta: '07:30 AM (Start)', isLegallyApprovedStop: true, legalStopType: 'Authorized Bus Terminal Bay' },
      { id: 'stop-s2', name: 'Hanamkonda', order: 1, location: { x: 75, y: 42 }, eta: '08:00 AM (Pickup)', isLegallyApprovedStop: true, legalStopType: 'Designated Bus Bay' },
      { id: 'stop-s3', name: 'Ghatkesar', order: 2, location: { x: 60, y: 36 }, eta: '09:45 AM', isLegallyApprovedStop: true, legalStopType: 'ORR Highway Transit Bay' },
      { id: 'stop-s4', name: 'Uppal Metro Hub', order: 3, location: { x: 56, y: 34 }, eta: '10:10 AM', isLegallyApprovedStop: true, legalStopType: 'Metro Kiss-and-Ride Bay' },
      { id: 'stop-s5', name: 'LB Nagar Hub', order: 4, location: { x: 54, y: 46 }, eta: '10:35 AM (Driver destination)', isLegallyApprovedStop: true, legalStopType: 'Ring Road Transit Hub' }
    ],
    routePolyline: [
      { x: 74, y: 58, streetName: 'Warangal Highway' },
      { x: 75, y: 42, streetName: 'Hanamkonda Road' },
      { x: 60, y: 36, streetName: 'Ghatkesar ORR' },
      { x: 56, y: 34, streetName: 'Uppal Metro Hub' },
      { x: 54, y: 46, streetName: 'LB Nagar Ring Road' }
    ],
    initialBookings: []
  },
  {
    id: 'pool-vikram',
    driverName: 'Vikram Varma',
    driverAvatar: 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=150&auto=format&fit=crop&q=80',
    driverPhone: '+91 94400 78901',
    driverRating: 4.71,
    totalTrips: 42,
    vehicle: 'Tata Nexon EV',
    vehiclePlate: 'TS 03 KL 5519',
    vehicleTier: 'Compact Eco SUV',
    carType: 'NEXON',
    avatarBg: 'bg-amber-600',
    from: 'Warangal',
    to: 'Ghatkesar',
    departsIn: '55 mins',
    departureTime: '09:00 AM',
    basePricePerSeat: 240,
    totalSeats: 4,
    availableSeatsCount: 3,
    verified: true,
    hasAC: true,
    instantBooking: false,
    corridorSummary: 'Warangal → Kazipet → Jangaon → Ghatkesar',
    driverProgress: 0.14,
    liveSpeedKmh: 60,
    lastPingSecondsAgo: 2,
    corridorStops: [
      { id: 'stop-v1', name: 'Warangal', order: 0, location: { x: 74, y: 58 }, eta: '08:15 AM (Start)', isLegallyApprovedStop: true, legalStopType: 'Authorized Bus Terminal Bay' },
      { id: 'stop-v2', name: 'Hanamkonda', order: 1, location: { x: 75, y: 42 }, eta: '08:45 AM (Pickup)', isLegallyApprovedStop: true, legalStopType: 'Designated Bus Bay' },
      { id: 'stop-v3', name: 'Kazipet', order: 2, location: { x: 68, y: 52 }, eta: '09:10 AM', isLegallyApprovedStop: true, legalStopType: 'Railway Transit Lane' },
      { id: 'stop-v4', name: 'Jangaon', order: 3, location: { x: 66, y: 44 }, eta: '09:40 AM', isLegallyApprovedStop: true, legalStopType: 'Highway Passenger Bay' },
      { id: 'stop-v5', name: 'Ghatkesar', order: 4, location: { x: 60, y: 36 }, eta: '10:15 AM (Driver destination)', isLegallyApprovedStop: true, legalStopType: 'ORR Highway Transit Bay' }
    ],
    routePolyline: [
      { x: 74, y: 58, streetName: 'Warangal Road' },
      { x: 75, y: 42, streetName: 'Hanamkonda Rd' },
      { x: 68, y: 52, streetName: 'Kazipet Link' },
      { x: 66, y: 44, streetName: 'Jangaon Highway' },
      { x: 60, y: 36, streetName: 'Ghatkesar ORR' }
    ],
    initialBookings: []
  },
  {
    id: 'pool-arjun',
    driverName: 'Arjun Patel',
    driverAvatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop&q=80',
    driverPhone: '+91 98888 11223',
    driverRating: 4.82,
    totalTrips: 55,
    vehicle: 'Maruti Dzire',
    vehiclePlate: 'TS 09 XY 4321',
    vehicleTier: 'Comfort Sedan',
    carType: 'DZIRE',
    avatarBg: 'bg-emerald-600',
    from: 'Warangal',
    to: 'Secunderabad',
    departsIn: '1 hr 10m',
    departureTime: '09:15 AM',
    basePricePerSeat: 290,
    totalSeats: 4,
    availableSeatsCount: 3,
    verified: true,
    hasAC: true,
    instantBooking: true,
    corridorSummary: 'Warangal → Ghatkesar → Secunderabad Stn',
    driverProgress: 0.08,
    liveSpeedKmh: 62,
    lastPingSecondsAgo: 1,
    corridorStops: [
      { id: 'stop-a1', name: 'Warangal', order: 0, location: { x: 74, y: 58 }, eta: '08:30 AM', isLegallyApprovedStop: true, legalStopType: 'Authorized Bus Terminal Bay' },
      { id: 'stop-a2', name: 'Hanamkonda', order: 1, location: { x: 75, y: 42 }, eta: '09:00 AM (Pickup)', isLegallyApprovedStop: true, legalStopType: 'Designated Bus Bay' },
      { id: 'stop-a3', name: 'Ghatkesar', order: 2, location: { x: 60, y: 36 }, eta: '10:00 AM', isLegallyApprovedStop: true, legalStopType: 'ORR Highway Transit Bay' },
      { id: 'stop-a4', name: 'Secunderabad Stn', order: 3, location: { x: 52, y: 30 }, eta: '10:45 AM (Driver destination)', isLegallyApprovedStop: true, legalStopType: 'Railway Terminal Bay' }
    ],
    routePolyline: [
      { x: 74, y: 58, streetName: 'Warangal Highway' },
      { x: 75, y: 42, streetName: 'Hanamkonda Rd' },
      { x: 60, y: 36, streetName: 'Ghatkesar Tollway' },
      { x: 52, y: 30, streetName: 'Secunderabad Stn Road' }
    ],
    initialBookings: []
  },
  {
    id: 'pool-kiran',
    driverName: 'Kiran Kumar',
    driverAvatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
    driverPhone: '+91 93456 99887',
    driverRating: 4.58,
    totalTrips: 16,
    vehicle: 'Toyota Innova Crysta',
    vehiclePlate: 'TS 04 ZZ 7711',
    vehicleTier: 'Large 6-Seater MPV',
    carType: 'INNOVA',
    avatarBg: 'bg-rose-600',
    from: 'Warangal ORR',
    to: 'Karimnagar Bypass',
    departsIn: '2 hours',
    departureTime: '10:00 AM',
    basePricePerSeat: 270,
    totalSeats: 6,
    availableSeatsCount: 4,
    verified: false,
    hasAC: true,
    instantBooking: false,
    corridorSummary: 'Warangal ORR → Hunter Road → Karimnagar (North)',
    driverProgress: 0.05,
    liveSpeedKmh: 54,
    lastPingSecondsAgo: 4,
    corridorStops: [
      { id: 'stop-k1', name: 'Warangal ORR', order: 0, location: { x: 80, y: 65 }, eta: '09:40 AM', isLegallyApprovedStop: true, legalStopType: 'ORR Highway Transit Bay' },
      { id: 'stop-k2', name: 'Hunter Road', order: 1, location: { x: 85, y: 55 }, eta: '10:05 AM', isLegallyApprovedStop: true, legalStopType: 'Bus Shelter Bay' },
      { id: 'stop-k3', name: 'Karimnagar Bypass', order: 2, location: { x: 92, y: 25 }, eta: '11:30 AM (Driver destination)', isLegallyApprovedStop: true, legalStopType: 'District Highway Bay' }
    ],
    routePolyline: [
      { x: 80, y: 65, streetName: 'Warangal North ORR' },
      { x: 85, y: 55, streetName: 'Hunter Road Link' },
      { x: 92, y: 25, streetName: 'Karimnagar Highway' }
    ],
    initialBookings: []
  }
];

export const AVAILABLE_CARPOOL_DRIVERS = INITIAL_AVAILABLE_DRIVERS;

export interface CarpoolInteractiveSectionProps {
  currentAddress: string;
  walletBalance: number;
  passengerDestination?: string;
  onDeductFare?: (amount: number) => void;
  onDriverChange?: (driver: AvailableCarpoolDriver, driverPos: { x: number; y: number; headingDeg: number }) => void;
  onViewRouteOnMap?: (driver: AvailableCarpoolDriver) => void;
  isMapFocused?: boolean;
  onToggleMapFocus?: () => void;
  onUpdatePickupLocation?: (newAddress: string) => void;
  onSelectDropoffLocation?: (newAddress: string) => void;
  onBookCarpoolSuccess?: (poolId: string | null) => void;
  onSwitchTab?: (tab: 'BOOKING' | 'CARPOOL' | 'OUTSTATION' | 'HISTORY' | 'PROFILE') => void;
}

export type CarpoolScreenStep = 'HOME' | 'AVAILABLE_RIDES' | 'RIDE_DETAILS' | 'SELECT_DROP' | 'BOOKING_SUMMARY' | 'LIVE_COCKPIT';

export const CarpoolSection: React.FC<CarpoolInteractiveSectionProps> = ({
  currentAddress,
  walletBalance,
  passengerDestination = '',
  onDeductFare,
  onUpdatePickupLocation,
  onSelectDropoffLocation,
  onBookCarpoolSuccess,
  onSwitchTab
}) => {
  // Screen state
  const [currentScreen, setCurrentScreen] = useState<CarpoolScreenStep>('HOME');

  // Search inputs
  const [pickupLocation, setPickupLocation] = useState(currentAddress || 'Hanamkonda, Warangal');
  const [destinationLocation, setDestinationLocation] = useState(passengerDestination || 'Hyderabad');
  const [travelDate, setTravelDate] = useState<'Today, 12 Oct' | 'Tomorrow, 13 Oct'>('Today, 12 Oct');

  // GPS Live State
  const [isGpsActive, setIsGpsActive] = useState(false);
  const [gpsAccuracyMeters, setGpsAccuracyMeters] = useState<number | null>(null);
  const [liveGpsCoords, setLiveGpsCoords] = useState<{ lat: number; lng: number } | null>(null);

  // Filter category in Available Rides
  const [selectedFilterCategory, setSelectedFilterCategory] = useState<'ALL' | 'DIRECT' | 'CONNECTED' | 'PARTIAL' | 'NO_MATCH'>('ALL');
  const [showRuleInspector, setShowRuleInspector] = useState(false);

  // Selected driver
  const [selectedDriverId, setSelectedDriverId] = useState<string>('pool-ramesh');
  const [selectedDropPointId, setSelectedDropPointId] = useState<string | null>(null);

  // Booking Summary state
  const [passengerCount, setPassengerCount] = useState<number>(1);
  const [paymentMethod, setPaymentMethod] = useState<'UPI' | 'CARD' | 'WALLET'>('UPI');
  const [termsAccepted, setTermsAccepted] = useState<boolean>(true);

  // Offer a Ride / Host modal state
  const [showOfferRideModal, setShowOfferRideModal] = useState(false);
  const [offerVehicleModel, setOfferVehicleModel] = useState('Honda City V');
  const [offerVehiclePlate, setOfferVehiclePlate] = useState('TS 09 XY 8899');
  const [offerOrigin, setOfferOrigin] = useState('Hanamkonda');
  const [offerDest, setOfferDest] = useState('Hyderabad');
  const [offerDepTime, setOfferDepTime] = useState('09:30 AM');
  const [offerSeats, setOfferSeats] = useState(3);
  const [offerPrice, setOfferPrice] = useState(320);

  // Real-time Active Booking State (Persisted in localStorage)
  const [activeLiveBooking, setActiveLiveBooking] = useState<ActiveCarpoolBooking | null>(() => {
    try {
      const stored = localStorage.getItem('zaldi_active_carpool_booking');
      if (stored) return JSON.parse(stored);
    } catch {}
    return null;
  });

  // Master Drivers list (Initial + user published rides)
  const [liveDrivers, setLiveDrivers] = useState<AvailableCarpoolDriver[]>(() => {
    try {
      const stored = localStorage.getItem('zaldi_custom_carpool_drivers');
      if (stored) {
        const custom = JSON.parse(stored);
        return [...INITIAL_AVAILABLE_DRIVERS, ...custom];
      }
    } catch {}
    return INITIAL_AVAILABLE_DRIVERS;
  });

  // In-app chat modal state
  const [showChatModal, setShowChatModal] = useState(false);
  const [chatInputText, setChatInputText] = useState('');
  const [hasCopiedPin, setHasCopiedPin] = useState(false);
  const [copiedTrackingLink, setCopiedTrackingLink] = useState(false);

  // Emergency SOS Modal
  const [showSosModal, setShowSosModal] = useState(false);

  // 1. Live Geolocation Watcher
  useEffect(() => {
    if (typeof window === 'undefined' || !('geolocation' in navigator)) return;
    
    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        setIsGpsActive(true);
        setGpsAccuracyMeters(Math.round(pos.coords.accuracy));
        setLiveGpsCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
      },
      () => {
        // Fallback to active corridor GPS tracking
        setIsGpsActive(true);
        setGpsAccuracyMeters(12);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 3000 }
    );

    return () => {
      navigator.geolocation.clearWatch(watchId);
    };
  }, []);

  // 2. Real-time Live Drivers Telemetry Ticker (Moves cars live along highway polyline)
  useEffect(() => {
    const timer = setInterval(() => {
      setLiveDrivers(prevDrivers => {
        return prevDrivers.map(driver => {
          // Advance progress slightly along the route polyline
          const nextProg = driver.driverProgress >= 0.96 ? 0.08 : +(driver.driverProgress + 0.006).toFixed(4);
          
          // Interpolate current (x, y) along routePolyline
          let curX = driver.routePolyline[0]?.x || 75;
          let curY = driver.routePolyline[0]?.y || 42;
          const polyLen = driver.routePolyline.length;
          if (polyLen > 1) {
            const indexFloat = nextProg * (polyLen - 1);
            const idx1 = Math.floor(indexFloat);
            const idx2 = Math.min(polyLen - 1, idx1 + 1);
            const frac = indexFloat - idx1;
            curX = +(driver.routePolyline[idx1].x + frac * (driver.routePolyline[idx2].x - driver.routePolyline[idx1].x)).toFixed(2);
            curY = +(driver.routePolyline[idx1].y + frac * (driver.routePolyline[idx2].y - driver.routePolyline[idx1].y)).toFixed(2);
          }

          // Fluctuate speed realistically
          const speedVariance = (Math.random() - 0.5) * 4;
          const newSpeed = Math.max(45, Math.min(85, Math.round(driver.liveSpeedKmh + speedVariance)));

          return {
            ...driver,
            driverProgress: nextProg,
            liveSpeedKmh: newSpeed,
            lastPingSecondsAgo: Math.max(1, (driver.lastPingSecondsAgo % 4) + 1),
            currentCoords: { x: curX, y: curY }
          };
        });
      });
    }, 1500);

    return () => clearInterval(timer);
  }, []);

  // 3. Real-time Active Booking Telemetry & Lifecycle Ticker
  useEffect(() => {
    if (!activeLiveBooking || activeLiveBooking.status === 'COMPLETED' || activeLiveBooking.status === 'CANCELLED') {
      return;
    }

    const bookingTicker = setInterval(() => {
      setActiveLiveBooking(prev => {
        if (!prev) return null;

        // Progress vehicle towards pickup or destination
        const newDist = Math.max(0, +(prev.distanceToPickupKm - 0.08).toFixed(2));
        const newEta = Math.max(0, Math.ceil(newDist * 1.8));

        let nextStatus = prev.status;
        if (prev.status === 'APPROACHING_PICKUP' && newDist <= 0.15) {
          nextStatus = 'ARRIVED_AT_BAY';
          sounds.playPing();
        }

        // Slightly move driver coordinates
        const progressInc = prev.status === 'IN_TRANSIT' ? 0.012 : 0.005;
        const nextProgress = Math.min(1.0, +(prev.driverProgress + progressInc).toFixed(4));
        
        const updatedBooking: ActiveCarpoolBooking = {
          ...prev,
          distanceToPickupKm: newDist,
          etaMinutes: newEta,
          status: nextStatus,
          driverProgress: nextProgress,
          driverSpeedKmh: 55 + Math.floor(Math.random() * 15)
        };

        try {
          localStorage.setItem('zaldi_active_carpool_booking', JSON.stringify(updatedBooking));
        } catch {}

        return updatedBooking;
      });
    }, 1800);

    return () => clearInterval(bookingTicker);
  }, [activeLiveBooking]);

  // Derived passenger positions
  const pickupPos = useMemo(() => {
    return getCoordinatesForName(pickupLocation, { x: 75, y: 42 });
  }, [pickupLocation]);

  const destPos = useMemo(() => {
    return getCoordinatesForName(destinationLocation, { x: 50, y: 36 });
  }, [destinationLocation]);

  // Dynamic Route Matching Engine across all live drivers
  const rankedDriversWithMatches = useMemo(() => {
    return liveDrivers.map(driver => {
      const matchAnalysis: RouteMatchAnalysis = matchDriverRouteToPassenger(
        driver,
        pickupPos,
        destPos,
        destinationLocation,
        driver.initialBookings
      );
      return {
        ...driver,
        match: matchAnalysis
      };
    }).sort((a, b) => b.match.compatibilityScore - a.match.compatibilityScore);
  }, [liveDrivers, pickupPos, destPos, destinationLocation]);

  // Category counts for filter tabs
  const matchCategoryCounts = useMemo(() => {
    const counts = { ALL: rankedDriversWithMatches.length, DIRECT: 0, CONNECTED: 0, PARTIAL: 0, NO_MATCH: 0 };
    rankedDriversWithMatches.forEach(d => {
      counts[d.match.matchType] = (counts[d.match.matchType] || 0) + 1;
    });
    return counts;
  }, [rankedDriversWithMatches]);

  // Filtered drivers
  const displayedDrivers = useMemo(() => {
    if (selectedFilterCategory === 'ALL') return rankedDriversWithMatches;
    return rankedDriversWithMatches.filter(d => d.match.matchType === selectedFilterCategory);
  }, [rankedDriversWithMatches, selectedFilterCategory]);

  // Active driver object
  const activeDriverWrapper = useMemo(() => {
    return rankedDriversWithMatches.find(d => d.id === selectedDriverId) || rankedDriversWithMatches[0];
  }, [rankedDriversWithMatches, selectedDriverId]);

  const activeDriver = activeDriverWrapper;
  const activeMatch = activeDriverWrapper.match;

  // Selected drop-off stop object
  const activeSelectedDropStop = useMemo(() => {
    if (selectedDropPointId) {
      const found = activeDriver.corridorStops.find(s => s.id === selectedDropPointId);
      if (found) return found;
    }
    return activeMatch.dropoffStop;
  }, [activeDriver, selectedDropPointId, activeMatch]);

  // Dynamic fare calculation for intermediate stop
  const dynamicSelectedFare = useMemo(() => {
    const stops = [...activeDriver.corridorStops].sort((a, b) => a.order - b.order);
    const pickupIdx = stops.findIndex(s => s.id === activeMatch.pickupStop.id);
    const dropIdx = stops.findIndex(s => s.id === activeSelectedDropStop.id);
    
    if (pickupIdx === -1 || dropIdx === -1 || dropIdx <= pickupIdx) {
      return activeMatch.calculatedFare;
    }

    const totalSegs = Math.max(1, stops.length - 1);
    const coveredSegs = dropIdx - pickupIdx;
    const ratio = coveredSegs / totalSegs;

    return Math.round(Math.max(80, activeDriver.basePricePerSeat * Math.min(1, 0.40 + ratio * 0.60)));
  }, [activeDriver, activeMatch, activeSelectedDropStop]);

  // Swap pickup & drop handler
  const handleSwapLocations = () => {
    sounds.playPop();
    const temp = pickupLocation;
    setPickupLocation(destinationLocation);
    setDestinationLocation(temp);
    onUpdatePickupLocation?.(destinationLocation);
    onSelectDropoffLocation?.(temp);
  };

  const handleSelectQuickDestination = (dest: string) => {
    sounds.playTap();
    setDestinationLocation(dest);
    onSelectDropoffLocation?.(dest);
    setSelectedDropPointId(null);
  };

  // Trigger browser live GPS capture
  const handleDetectLiveGps = () => {
    sounds.playPop();
    if (typeof window !== 'undefined' && 'geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setIsGpsActive(true);
          setGpsAccuracyMeters(Math.round(pos.coords.accuracy));
          setLiveGpsCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
          setPickupLocation(`Hanamkonda Bus Terminal (GPS ±${Math.round(pos.coords.accuracy)}m)`);
          onUpdatePickupLocation?.('Hanamkonda Bus Terminal');
          sounds.playSuccess();
        },
        () => {
          setIsGpsActive(true);
          setPickupLocation('Hanamkonda Bus Terminal (GPS Locked)');
          sounds.playSuccess();
        },
        { enableHighAccuracy: true, timeout: 6000 }
      );
    }
  };

  // Publish a custom carpool ride
  const handlePublishCustomRide = () => {
    sounds.playSuccess();
    const newId = 'pool-host-' + Math.random().toString(36).substring(2, 7);
    const newRide: AvailableCarpoolDriver = {
      id: newId,
      driverName: 'You (Host Captain)',
      driverAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
      driverPhone: '+91 98888 77665',
      driverRating: 5.0,
      totalTrips: 1,
      vehicle: offerVehicleModel,
      vehiclePlate: offerVehiclePlate.toUpperCase(),
      vehicleTier: 'Self-Hosted Carpool',
      carType: 'SWIFT',
      avatarBg: 'bg-emerald-600',
      from: offerOrigin,
      to: offerDest,
      departsIn: '30 mins',
      departureTime: offerDepTime,
      basePricePerSeat: offerPrice,
      totalSeats: offerSeats,
      availableSeatsCount: offerSeats,
      verified: true,
      hasAC: true,
      instantBooking: true,
      corridorSummary: `${offerOrigin} → Uppal → ${offerDest}`,
      driverProgress: 0.10,
      liveSpeedKmh: 60,
      lastPingSecondsAgo: 1,
      corridorStops: [
        { id: `${newId}-s1`, name: offerOrigin, order: 0, location: { x: 75, y: 42 }, eta: offerDepTime, isLegallyApprovedStop: true, legalStopType: 'Authorized Bus Terminal Bay' },
        { id: `${newId}-s2`, name: 'Ghatkesar', order: 1, location: { x: 60, y: 36 }, eta: '09:45 AM', isLegallyApprovedStop: true, legalStopType: 'ORR Highway Transit Bay' },
        { id: `${newId}-s3`, name: 'Uppal Metro Hub', order: 2, location: { x: 56, y: 34 }, eta: '10:15 AM', isLegallyApprovedStop: true, legalStopType: 'Metro Kiss-and-Ride Bay' },
        { id: `${newId}-s4`, name: offerDest, order: 3, location: { x: 50, y: 36 }, eta: '10:45 AM', isLegallyApprovedStop: true, legalStopType: 'Central Transit Hub' }
      ],
      routePolyline: [
        { x: 75, y: 42, streetName: `${offerOrigin} Station Way` },
        { x: 60, y: 36, streetName: 'Ghatkesar Toll Ring Road' },
        { x: 56, y: 34, streetName: 'Uppal Metro Corridor' },
        { x: 50, y: 36, streetName: `${offerDest} Expressway` }
      ],
      initialBookings: []
    };

    setLiveDrivers(prev => [newRide, ...prev]);
    try {
      const existing = JSON.parse(localStorage.getItem('zaldi_custom_carpool_drivers') || '[]');
      localStorage.setItem('zaldi_custom_carpool_drivers', JSON.stringify([newRide, ...existing]));
    } catch {}

    setShowOfferRideModal(false);
  };

  // Confirm booking & create active live ride
  const handleConfirmBooking = () => {
    if (!termsAccepted) {
      sounds.playAlert();
      return;
    }
    sounds.playSuccess();

    const totalAmt = passengerCount * dynamicSelectedFare;
    onDeductFare?.(totalAmt);

    const generatedId = 'ZALDI-CP-' + Math.floor(1000 + Math.random() * 9000);
    const generatedPin = '' + Math.floor(1000 + Math.random() * 9000);

    // Decrement seats on selected driver
    setLiveDrivers(prev => prev.map(d => {
      if (d.id === activeDriver.id) {
        return {
          ...d,
          availableSeatsCount: Math.max(0, d.availableSeatsCount - passengerCount)
        };
      }
      return d;
    }));

    const newLiveBooking: ActiveCarpoolBooking = {
      bookingId: generatedId,
      boardingPin: generatedPin,
      driverId: activeDriver.id,
      driverName: activeDriver.driverName,
      driverAvatar: activeDriver.driverAvatar,
      driverPhone: activeDriver.driverPhone,
      driverRating: activeDriver.driverRating,
      vehicle: activeDriver.vehicle,
      vehiclePlate: activeDriver.vehiclePlate,
      carType: activeDriver.carType,
      pickupStopName: activeMatch.pickupStop.name,
      pickupCoords: activeMatch.pickupStop.location,
      dropoffStopName: activeSelectedDropStop.name,
      dropoffCoords: activeSelectedDropStop.location,
      scheduledDeparture: activeDriver.departureTime,
      passengerCount,
      seatPrice: dynamicSelectedFare,
      totalPaid: totalAmt,
      paymentMethod,
      status: 'APPROACHING_PICKUP',
      bookedAt: Date.now(),
      driverProgress: 0.28,
      driverCoords: { x: 73, y: 45 },
      driverSpeedKmh: 64,
      driverHeadingDeg: 240,
      distanceToPickupKm: 1.6,
      etaMinutes: 4,
      chatMessages: [
        {
          id: 'msg-1',
          sender: 'DRIVER',
          text: `Hi! I'm on the highway approaching ${activeMatch.pickupStop.name}. I'll pull into the designated Carpool Bay shortly.`,
          time: 'Just now'
        }
      ]
    };

    setActiveLiveBooking(newLiveBooking);
    try {
      localStorage.setItem('zaldi_active_carpool_booking', JSON.stringify(newLiveBooking));
    } catch {}

    onBookCarpoolSuccess?.(generatedId);
    setCurrentScreen('LIVE_COCKPIT');
  };

  // Send message in active chat
  const handleSendChatMessage = () => {
    if (!chatInputText.trim() || !activeLiveBooking) return;
    sounds.playTap();
    const newMsg = {
      id: 'msg-' + Date.now(),
      sender: 'PASSENGER' as const,
      text: chatInputText.trim(),
      time: 'Just now'
    };
    
    const updatedMessages = [...activeLiveBooking.chatMessages, newMsg];
    const updatedBooking = { ...activeLiveBooking, chatMessages: updatedMessages };
    setActiveLiveBooking(updatedBooking);
    setChatInputText('');

    // Driver auto-response after 1.5s
    setTimeout(() => {
      sounds.playPing();
      const driverReplies = [
        "Received! I am right on schedule, see you at the bay.",
        "Noted! Look for the hazard lights on the white car.",
        "Got it, no problem at all!"
      ];
      const reply = {
        id: 'msg-reply-' + Date.now(),
        sender: 'DRIVER' as const,
        text: driverReplies[Math.floor(Math.random() * driverReplies.length)],
        time: 'Just now'
      };
      setActiveLiveBooking(cur => cur ? { ...cur, chatMessages: [...cur.chatMessages, reply] } : null);
    }, 1500);
  };

  // Cancel active booking
  const handleCancelActiveRide = () => {
    sounds.playPop();
    if (!activeLiveBooking) return;
    
    // Restore seats to driver
    setLiveDrivers(prev => prev.map(d => {
      if (d.id === activeLiveBooking.driverId) {
        return { ...d, availableSeatsCount: Math.min(d.totalSeats, d.availableSeatsCount + activeLiveBooking.passengerCount) };
      }
      return d;
    }));

    // Refund wallet
    onDeductFare?.(-activeLiveBooking.totalPaid);

    setActiveLiveBooking(null);
    try {
      localStorage.removeItem('zaldi_active_carpool_booking');
    } catch {}
    
    setCurrentScreen('HOME');
  };

  // Modern Vector Vehicle Renders
  const renderModernCarImage = (type: string) => {
    return (
      <div className="w-20 h-11 relative flex-shrink-0 flex items-center justify-center transition-transform hover:scale-105">
        {renderVectorVehicleSvg(type)}
      </div>
    );
  };

  return (
    <div className="w-full h-full bg-slate-50 flex flex-col font-sans select-none relative overflow-hidden text-slate-900">
      
      {/* =========================================================================
          PRODUCTION LIVE APP BAR (Brand, Live GPS Status, Offer Ride CTA)
         ========================================================================= */}
      <div className="bg-slate-950 text-white px-4 py-2 flex items-center justify-between z-40 shadow-sm border-b border-slate-800 text-xs">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span className="font-black text-sm tracking-tight text-white">Zaldi Carpool</span>
          </div>

          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-800/80 flex items-center gap-1">
            <RadioTower className="w-3 h-3 text-emerald-400" />
            <span>LIVE CORRIDOR</span>
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* Live GPS Status */}
          <div 
            onClick={handleDetectLiveGps}
            className="flex items-center gap-1 text-[10px] font-bold text-slate-300 bg-slate-900 px-2 py-1 rounded-xl border border-slate-800 hover:border-slate-700 transition cursor-pointer"
            title="Click to refresh live GPS"
          >
            <Crosshair className={`w-3 h-3 ${isGpsActive ? 'text-blue-400 animate-spin' : 'text-slate-400'}`} />
            <span>{isGpsActive ? `GPS ±${gpsAccuracyMeters || 8}m` : 'Detect GPS'}</span>
          </div>

          {/* Offer Ride Button */}
          <button
            onClick={() => { sounds.playTap(); setShowOfferRideModal(true); }}
            className="px-2.5 py-1 rounded-xl bg-[#00875A] hover:bg-[#00704A] text-white font-bold text-[11px] flex items-center gap-1 shadow-xs transition"
          >
            <Plus className="w-3 h-3 stroke-[2.5]" />
            <span>Offer Ride</span>
          </button>
        </div>
      </div>

      {/* Active Live Ride Sticky Status Pill */}
      {activeLiveBooking && currentScreen !== 'LIVE_COCKPIT' && (
        <div 
          onClick={() => { sounds.playTap(); setCurrentScreen('LIVE_COCKPIT'); }}
          className="bg-emerald-600 text-white px-4 py-2 flex items-center justify-between z-30 shadow-md cursor-pointer text-xs animate-in slide-in-from-top"
        >
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-white animate-ping"></span>
            <span className="font-bold">
              Ride Active with <strong>{activeLiveBooking.driverName}</strong>
            </span>
            <span className="text-emerald-100 font-medium">· ETA: {activeLiveBooking.etaMinutes} mins</span>
          </div>

          <div className="flex items-center gap-1 font-black text-xs underline">
            <span>View Live Tracking</span>
            <ChevronRight className="w-4 h-4" />
          </div>
        </div>
      )}

      {/* =========================================================================
          SCREEN 1: SEARCH & LIVE CORRIDOR DISCOVERY
         ========================================================================= */}
      {currentScreen === 'HOME' && (
        <div className="flex-1 flex flex-col h-full bg-slate-50 relative overflow-hidden animate-in fade-in duration-150">
          
          {/* Main Scrollable Area */}
          <div className="flex-1 overflow-y-auto no-scrollbar pb-16 relative">
            
            {/* Live Interactive Vector Map with Real Moving Driver Markers */}
            <div className="w-full h-72 relative bg-[#EBF4F6] overflow-hidden border-b border-slate-200">
              <svg className="w-full h-full" viewBox="0 0 400 300" preserveAspectRatio="none">
                <defs>
                  <pattern id="modernMapGrid" width="36" height="36" patternUnits="userSpaceOnUse">
                    <path d="M 36 0 L 0 0 0 36" fill="none" stroke="#D1E7EC" strokeWidth="1" />
                  </pattern>
                  <linearGradient id="routeGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#38BDF8" />
                    <stop offset="50%" stopColor="#2563EB" />
                    <stop offset="100%" stopColor="#00875A" />
                  </linearGradient>
                </defs>
                <rect width="100%" height="100%" fill="url(#modernMapGrid)" />
                {/* River */}
                <path d="M 280 0 C 260 80 340 160 310 300" fill="none" stroke="#BAE6FD" strokeWidth="28" strokeLinecap="round" />
                {/* Green Parks */}
                <path d="M 40 40 Q 90 20 120 70 T 70 120 Z" fill="#DCFCE7" opacity="0.8" />
                <path d="M 240 180 Q 290 190 280 240 T 210 230 Z" fill="#DCFCE7" opacity="0.8" />
                {/* Major Highway Roads */}
                <path d="M 0 130 L 400 120" stroke="#FFFFFF" strokeWidth="8" />
                <path d="M 0 130 L 400 120" stroke="#CBD5E1" strokeWidth="2" />
                <path d="M 180 0 L 190 300" stroke="#FFFFFF" strokeWidth="7" />
                <path d="M 180 0 L 190 300" stroke="#CBD5E1" strokeWidth="2" />
                {/* Active Carpool Highway Line */}
                <path d="M 70 20 C 110 110 210 150 370 260" stroke="#FFFFFF" strokeWidth="10" />
                <path d="M 70 20 C 110 110 210 150 370 260" stroke="url(#routeGradient)" strokeWidth="5" strokeLinecap="round" />
              </svg>

              {/* Real Moving Drivers on the Live Map */}
              {liveDrivers.slice(0, 4).map(drv => {
                const posX = (drv.currentCoords?.x || 75) * 4;
                const posY = (drv.currentCoords?.y || 42) * 2.8;

                return (
                  <div 
                    key={drv.id}
                    style={{ left: `${Math.min(360, Math.max(20, posX))}px`, top: `${Math.min(260, Math.max(20, posY))}px` }}
                    className="absolute -translate-x-1/2 -translate-y-1/2 flex flex-col items-center pointer-events-none transition-all duration-1000 ease-linear z-10"
                  >
                    <div className="px-2 py-0.5 bg-slate-900/90 text-white text-[9px] font-black rounded shadow-md whitespace-nowrap mb-0.5 flex items-center gap-1">
                      <Car className="w-2.5 h-2.5 text-emerald-400" />
                      <span>{drv.driverName.split(' ')[0]} ({drv.liveSpeedKmh}km/h)</span>
                    </div>
                    <div className="w-4 h-4 rounded-full bg-blue-600 border-2 border-white shadow-lg flex items-center justify-center">
                      <div className="w-1.5 h-1.5 rounded-full bg-white"></div>
                    </div>
                  </div>
                );
              })}

              {/* Live Location Marker Pin */}
              <div className="absolute top-16 left-20 flex flex-col items-center z-20">
                <div className="px-2.5 py-0.5 bg-white text-slate-800 text-[10px] font-bold rounded-full shadow-md border border-slate-200 whitespace-nowrap mb-1 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-ping"></span>
                  <span>Pickup: {pickupLocation.split(',')[0]}</span>
                </div>
                <div className="w-4 h-4 rounded-full bg-blue-600 border-2 border-white shadow-lg flex items-center justify-center">
                  <div className="w-1.5 h-1.5 rounded-full bg-white"></div>
                </div>
              </div>

              {/* Destination Pin */}
              <div className="absolute bottom-12 right-14 flex flex-col items-center z-20">
                <div className="px-2.5 py-0.5 bg-white text-rose-800 text-[10px] font-bold rounded-full shadow-md border border-rose-200 whitespace-nowrap mb-1">
                  Drop: {destinationLocation}
                </div>
                <div className="w-4 h-4 rounded-full bg-rose-600 border-2 border-white shadow-lg flex items-center justify-center">
                  <div className="w-1.5 h-1.5 rounded-full bg-white"></div>
                </div>
              </div>
            </div>

            {/* Modern Floating Search Card */}
            <div className="px-4 -mt-16 relative z-30">
              <div className="bg-white rounded-3xl p-4 shadow-lg border border-slate-200/80 space-y-3">
                
                <div className="flex items-center gap-3">
                  {/* Left Indicators */}
                  <div className="flex flex-col items-center gap-1 py-1">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 ring-4 ring-emerald-100 flex-shrink-0"></span>
                    <div className="w-0.5 h-7 bg-slate-200"></div>
                    <span className="w-2.5 h-2.5 rounded-full bg-rose-500 ring-4 ring-rose-100 flex-shrink-0"></span>
                  </div>

                  {/* Input Fields */}
                  <div className="flex-1 space-y-2">
                    <div>
                      <span className="text-[10px] text-slate-400 font-bold block uppercase tracking-wider">Pickup Location</span>
                      <input 
                        type="text" 
                        value={pickupLocation}
                        onChange={(e) => {
                          setPickupLocation(e.target.value);
                          onUpdatePickupLocation?.(e.target.value);
                        }}
                        className="w-full text-xs font-black text-slate-900 bg-transparent outline-none truncate"
                        placeholder="Current pickup area"
                      />
                    </div>

                    <div className="border-t border-slate-100 pt-1.5">
                      <span className="text-[10px] text-slate-400 font-bold block uppercase tracking-wider">Where are you going?</span>
                      <input 
                        type="text" 
                        value={destinationLocation}
                        onChange={(e) => {
                          setDestinationLocation(e.target.value);
                          onSelectDropoffLocation?.(e.target.value);
                        }}
                        className="w-full text-xs font-black text-slate-900 bg-transparent outline-none truncate"
                        placeholder="Enter destination (e.g. Hyderabad, Mindspace, RGIA)"
                      />
                    </div>
                  </div>

                  {/* Swap Button */}
                  <button 
                    onClick={handleSwapLocations}
                    className="w-8 h-8 rounded-full bg-emerald-50 hover:bg-emerald-100 text-[#00875A] flex items-center justify-center transition border border-emerald-200 self-center shadow-xs active:scale-90"
                    title="Swap locations"
                  >
                    <ArrowUpDown className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Quick Destination Chips */}
                <div className="pt-2 border-t border-slate-100">
                  <span className="text-[10px] text-slate-400 font-bold block mb-1.5 uppercase">Quick Destinations (Smart Matching)</span>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {[
                      { name: 'Hyderabad', tag: 'Direct Match' },
                      { name: 'Mindspace', tag: 'Metro Transfer' },
                      { name: 'RGIA Airport', tag: 'Airport Express' },
                      { name: 'Ghatkesar', tag: 'Intermediate' }
                    ].map(chip => (
                      <button
                        key={chip.name}
                        onClick={() => handleSelectQuickDestination(chip.name)}
                        className={`px-2.5 py-1 rounded-xl text-xs font-bold transition flex items-center gap-1 ${
                          destinationLocation.toLowerCase().includes(chip.name.toLowerCase())
                            ? 'bg-[#00875A] text-white shadow-xs'
                            : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                        }`}
                      >
                        <span>{chip.name}</span>
                        <span className={`text-[9px] ${
                          destinationLocation.toLowerCase().includes(chip.name.toLowerCase())
                            ? 'text-emerald-100'
                            : 'text-slate-400'
                        }`}>({chip.tag})</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Date & Passenger Quick Chips */}
                <div className="flex items-center justify-between gap-2 pt-1 border-t border-slate-100 text-[11px] font-bold text-slate-600">
                  <div className="flex items-center gap-1.5 bg-slate-100/80 px-2.5 py-1 rounded-xl">
                    <Calendar className="w-3.5 h-3.5 text-slate-500" />
                    <span>{travelDate}</span>
                  </div>
                  <div className="flex items-center gap-1.5 bg-slate-100/80 px-2.5 py-1 rounded-xl">
                    <Users className="w-3.5 h-3.5 text-slate-500" />
                    <span>{passengerCount} Passenger{passengerCount > 1 ? 's' : ''}</span>
                  </div>
                </div>

                {/* Primary CTA */}
                <button
                  onClick={() => {
                    sounds.playSuccess();
                    setCurrentScreen('AVAILABLE_RIDES');
                  }}
                  className="w-full py-3.5 bg-[#00875A] hover:bg-[#00704A] text-white rounded-2xl font-black text-sm flex items-center justify-center gap-2 shadow-md shadow-emerald-700/25 active:scale-[0.98] transition cursor-pointer"
                >
                  <span>Search Live Carpool Rides</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Smart Matching Feature Banner */}
            <div className="px-5 pt-4 pb-2">
              <div className="p-3.5 bg-emerald-50/70 border border-emerald-200 rounded-2xl space-y-1 text-xs">
                <div className="flex items-center gap-2 font-black text-emerald-900">
                  <ShieldCheck className="w-4 h-4 text-emerald-700" />
                  <span>Real-time GPS Highway Corridor Active</span>
                </div>
                <p className="text-[11px] text-emerald-800 leading-relaxed">
                  Zaldi tracks active carpoolers travelling along the Warangal-Hyderabad corridor. Book a direct trip, transfer at verified hubs, or select an intermediate stop.
                </p>
              </div>
            </div>

            {/* Active Live Highway Vehicles Feed */}
            <div className="px-5 pt-2 pb-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-black text-slate-900 uppercase tracking-wider">Vehicles Currently on Corridor</span>
                <span className="text-[10px] text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                  {liveDrivers.length} Moving Live
                </span>
              </div>

              <div className="space-y-2">
                {liveDrivers.slice(0, 3).map(drv => (
                  <div
                    key={drv.id}
                    onClick={() => {
                      sounds.playTap();
                      setSelectedDriverId(drv.id);
                      setCurrentScreen('RIDE_DETAILS');
                    }}
                    className="p-3 bg-white rounded-2xl border border-slate-200/90 flex items-center justify-between hover:border-emerald-300 hover:shadow-xs transition cursor-pointer"
                  >
                    <div className="flex items-center gap-2.5">
                      <img src={drv.driverAvatar} alt={drv.driverName} className="w-9 h-9 rounded-full object-cover" />
                      <div>
                        <div className="text-xs font-black text-slate-900 flex items-center gap-1.5">
                          <span>{drv.driverName}</span>
                          <span className="text-[10px] text-slate-400 font-medium">({drv.vehicle})</span>
                        </div>
                        <div className="text-[10px] text-slate-500 font-semibold mt-0.5 flex items-center gap-1">
                          <span className="text-emerald-700 font-bold">{drv.liveSpeedKmh} km/h</span>
                          <span>·</span>
                          <span>Departs in {drv.departsIn}</span>
                          <span>·</span>
                          <span className="text-slate-400">₹{drv.basePricePerSeat}/seat</span>
                        </div>
                      </div>
                    </div>

                    <ChevronRight className="w-4 h-4 text-slate-400" />
                  </div>
                ))}
              </div>
            </div>

          </div>

          {/* Bottom App Navigation */}
          <div className="bg-white border-t border-slate-200 px-5 py-2.5 flex items-center justify-between z-30 shadow-xs">
            <button className="flex flex-col items-center gap-0.5 text-[#00875A]">
              <Zap className="w-5 h-5 fill-[#00875A]" />
              <span className="text-[9px] font-black">Search</span>
            </button>

            <button 
              onClick={() => setCurrentScreen('AVAILABLE_RIDES')}
              className="flex flex-col items-center gap-0.5 text-slate-400 hover:text-slate-700"
            >
              <Car className="w-5 h-5" />
              <span className="text-[9px] font-bold">Rides</span>
            </button>

            <button 
              onClick={() => { sounds.playPop(); setShowOfferRideModal(true); }}
              className="-mt-5 w-11 h-11 rounded-full bg-[#00875A] text-white flex items-center justify-center shadow-lg shadow-emerald-700/35 ring-4 ring-white active:scale-95 transition"
              title="Offer a Ride"
            >
              <span className="text-2xl font-bold leading-none">+</span>
            </button>

            <button 
              onClick={() => {
                if (activeLiveBooking) {
                  setCurrentScreen('LIVE_COCKPIT');
                } else {
                  sounds.playAlert();
                }
              }}
              className={`flex flex-col items-center gap-0.5 ${activeLiveBooking ? 'text-emerald-700 font-black' : 'text-slate-400 hover:text-slate-700'}`}
            >
              <Navigation className="w-5 h-5" />
              <span className="text-[9px] font-bold">Tracking</span>
            </button>

            <button 
              onClick={() => onSwitchTab?.('PROFILE')}
              className="flex flex-col items-center gap-0.5 text-slate-400 hover:text-slate-700"
            >
              <Users className="w-5 h-5" />
              <span className="text-[9px] font-bold">Profile</span>
            </button>
          </div>

        </div>
      )}

      {/* =========================================================================
          SCREEN 2: LIVE AVAILABLE RIDES FEED
         ========================================================================= */}
      {currentScreen === 'AVAILABLE_RIDES' && (
        <div className="flex-1 flex flex-col h-full bg-slate-50 relative overflow-hidden animate-in fade-in duration-150">
          
          {/* Header */}
          <div className="px-5 py-3 bg-white border-b border-slate-100 flex items-center justify-between z-20 shadow-xs">
            <button 
              onClick={() => { sounds.playTap(); setCurrentScreen('HOME'); }}
              className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-700 transition"
            >
              <ChevronLeft className="w-6 h-6 stroke-[2.2]" />
            </button>

            <div className="text-center">
              <span className="text-sm font-black text-slate-900 block leading-tight">Live Route Matches</span>
              <span className="text-[10px] text-slate-500 font-semibold">{travelDate} · {passengerCount} Passenger</span>
            </div>

            <button 
              onClick={() => setShowRuleInspector(!showRuleInspector)}
              className={`p-1.5 rounded-xl border transition ${
                showRuleInspector 
                  ? 'bg-blue-50 border-blue-300 text-blue-700' 
                  : 'bg-slate-50 border-slate-200 text-slate-600'
              }`}
              title="Inspect Matching Rules"
            >
              <SlidersHorizontal className="w-4 h-4" />
            </button>
          </div>

          {/* Route Summary Bar */}
          <div className="px-4 py-2.5 bg-white border-b border-slate-100 flex items-center justify-between text-xs z-20">
            <div className="flex items-center gap-2 text-slate-900 font-bold truncate max-w-[75%]">
              <span className="text-emerald-700">{pickupLocation.split(',')[0]}</span>
              <ArrowRight className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
              <span className="text-rose-600 truncate">{destinationLocation}</span>
            </div>

            <button 
              onClick={() => setCurrentScreen('HOME')}
              className="text-xs font-bold text-[#00875A] hover:underline flex-shrink-0"
            >
              Change
            </button>
          </div>

          {/* Collapsible Rule Inspector */}
          {showRuleInspector && (
            <div className="px-4 py-3 bg-blue-50/80 border-b border-blue-200 text-xs space-y-2 animate-in fade-in">
              <div className="flex items-center justify-between font-black text-blue-900">
                <span className="flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-blue-700" />
                  <span>Matching Criteria & Verified Hubs</span>
                </span>
                <span className="text-[10px] bg-blue-200/80 text-blue-800 px-2 py-0.5 rounded-full font-bold">
                  Road Geometry
                </span>
              </div>
              <div className="grid grid-cols-2 gap-1.5 text-[10px] text-blue-950 font-medium">
                <div className="p-2 bg-white/80 rounded-xl border border-blue-200">
                  <strong className="text-emerald-700 block">1. Direct Match:</strong>
                  Driver reaches destination or approved stop within ≤ 1.5 km road threshold.
                </div>
                <div className="p-2 bg-white/80 rounded-xl border border-blue-200">
                  <strong className="text-blue-700 block">2. Connected Match:</strong>
                  Passes transfer hub (e.g. Uppal Metro) connecting directly to destination.
                </div>
                <div className="p-2 bg-white/80 rounded-xl border border-blue-200">
                  <strong className="text-amber-700 block">3. Partial Journey:</strong>
                  Covers corridor portion. Passenger chooses intermediate drop-off.
                </div>
                <div className="p-2 bg-white/80 rounded-xl border border-blue-200">
                  <strong className="text-rose-700 block">4. Legal Verification:</strong>
                  Only approved transit bays with safe boarding zones allowed.
                </div>
              </div>
            </div>
          )}

          {/* Filter Category Tabs with Live Counters */}
          <div className="px-4 py-2 bg-white border-b border-slate-200 flex items-center gap-1.5 overflow-x-auto no-scrollbar z-20">
            {[
              { id: 'ALL', label: `All (${matchCategoryCounts.ALL})` },
              { id: 'DIRECT', label: `Direct (${matchCategoryCounts.DIRECT})` },
              { id: 'CONNECTED', label: `Connected (${matchCategoryCounts.CONNECTED})` },
              { id: 'PARTIAL', label: `Partial (${matchCategoryCounts.PARTIAL})` },
              { id: 'NO_MATCH', label: `No Match (${matchCategoryCounts.NO_MATCH})` }
            ].map(tab => {
              const isSelected = selectedFilterCategory === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => {
                    sounds.playTap();
                    setSelectedFilterCategory(tab.id as any);
                  }}
                  className={`px-3 py-1.5 rounded-full text-xs font-bold transition whitespace-nowrap flex items-center gap-1 ${
                    isSelected 
                      ? 'bg-slate-900 text-white shadow-xs font-black' 
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* Driver Feed */}
          <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3 no-scrollbar pb-6">
            {displayedDrivers.length === 0 && (
              <div className="text-center py-10 space-y-2">
                <AlertCircle className="w-8 h-8 text-slate-400 mx-auto" />
                <div className="text-xs font-black text-slate-700">No rides in this filter category</div>
                <p className="text-[11px] text-slate-500">Switch to "All" to view all corridor drivers.</p>
              </div>
            )}

            {displayedDrivers.map(driver => {
              const match = driver.match;
              const isDirect = match.matchType === 'DIRECT';
              const isConnected = match.matchType === 'CONNECTED';
              const isPartial = match.matchType === 'PARTIAL';
              const isNoMatch = match.matchType === 'NO_MATCH';

              return (
                <div
                  key={driver.id}
                  onClick={() => {
                    sounds.playTap();
                    setSelectedDriverId(driver.id);
                    setSelectedDropPointId(match.dropoffStop.id);
                    setCurrentScreen('RIDE_DETAILS');
                  }}
                  className={`bg-white rounded-3xl p-4 border transition cursor-pointer space-y-3 relative overflow-hidden ${
                    isNoMatch 
                      ? 'border-slate-200 opacity-80 hover:opacity-100'
                      : 'border-slate-200/90 shadow-xs hover:border-slate-300 hover:shadow-md'
                  }`}
                >
                  {/* Top Match Category Badge & Departure */}
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider text-white ${
                        isDirect 
                          ? 'bg-[#00875A]' 
                          : isConnected
                          ? 'bg-[#0066CC]'
                          : isPartial
                          ? 'bg-[#EA580C]'
                          : 'bg-slate-600'
                      }`}>
                        {match.matchTitle}
                      </span>

                      <span className="text-[10px] font-bold text-slate-500">
                        {match.compatibilityScore}% Compatibility
                      </span>
                    </div>

                    <span className="text-xs font-black text-slate-800 flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      <span>{driver.departureTime}</span>
                    </span>
                  </div>

                  {/* Driver Profile & Vector Car */}
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        <img 
                          src={driver.driverAvatar} 
                          alt={driver.driverName}
                          className="w-11 h-11 rounded-full object-cover ring-2 ring-slate-100 shadow-xs"
                        />
                        {driver.verified && (
                          <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full bg-blue-600 text-white flex items-center justify-center ring-2 ring-white">
                            <Check className="w-2.5 h-2.5 stroke-[3]" />
                          </div>
                        )}
                      </div>

                      <div>
                        <div className="font-black text-sm text-slate-900 leading-tight">
                          {driver.driverName}
                        </div>
                        <div className="flex items-center gap-1.5 text-[11px] text-slate-500 font-semibold mt-0.5">
                          <span className="text-amber-500 font-bold flex items-center gap-0.5">
                            <Star className="w-3 h-3 fill-amber-400 stroke-none" />
                            <span>{driver.driverRating}</span>
                          </span>
                          <span>·</span>
                          <span>({driver.totalTrips} rides)</span>
                        </div>
                      </div>
                    </div>

                    {renderModernCarImage(driver.carType)}
                  </div>

                  {/* Route Summary */}
                  <div className="text-[11px] text-slate-600 font-bold flex items-center gap-1">
                    <span>{driver.corridorSummary}</span>
                  </div>

                  {/* Connected Route Notice */}
                  {isConnected && match.verifiedTransfer && (
                    <div className="p-2.5 bg-blue-50/90 rounded-2xl text-[11px] text-blue-900 border border-blue-200/70 space-y-1">
                      <div className="flex items-center gap-1.5 font-black text-blue-800">
                        <Compass className="w-3.5 h-3.5 text-blue-600" />
                        <span>Transfer at {match.verifiedTransfer.transferHubName}</span>
                      </div>
                      <p className="text-[10px] text-blue-700 leading-tight">
                        {match.verifiedTransfer.instructions} (+{match.verifiedTransfer.transferDurationMin} mins onward)
                      </p>
                    </div>
                  )}

                  {/* Partial Route Notice */}
                  {isPartial && (
                    <div className="p-2.5 bg-amber-50/90 rounded-2xl text-[11px] text-amber-900 border border-amber-200/70 space-y-0.5">
                      <div className="flex items-center gap-1.5 font-black text-amber-800">
                        <MapPin className="w-3.5 h-3.5 text-amber-600" />
                        <span>Partial Route: Covers up to {match.dropoffStop.name}</span>
                      </div>
                      <p className="text-[10px] text-amber-700">
                        Choose an intermediate drop-off point along the way.
                      </p>
                    </div>
                  )}

                  {/* No Match Notice */}
                  {isNoMatch && (
                    <div className="p-2.5 bg-rose-50/90 rounded-2xl text-[11px] text-rose-900 border border-rose-200/70">
                      <div className="flex items-center gap-1.5 font-black text-rose-800">
                        <AlertCircle className="w-3.5 h-3.5 text-rose-600" />
                        <span>No Corridor Overlap</span>
                      </div>
                      <p className="text-[10px] text-rose-700 mt-0.5">
                        {match.unmatchedReason || 'Driver travels along a separate non-connecting highway.'}
                      </p>
                    </div>
                  )}

                  {/* Legal Stop Tag */}
                  <div className="flex items-center gap-1 text-[10px] text-emerald-800 font-bold bg-emerald-50/60 px-2 py-0.5 rounded-lg border border-emerald-200/50 w-fit">
                    <ShieldCheck className="w-3 h-3 text-emerald-600" />
                    <span>{match.legalStopBadgeText}</span>
                  </div>

                  {/* Pricing & Seat Availability */}
                  <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
                    <div className="flex items-center gap-2 text-slate-500 font-medium">
                      <span>{driver.vehicle}</span>
                      <span>·</span>
                      <span className="text-emerald-700 font-bold">{driver.availableSeatsCount} seats left</span>
                    </div>

                    <div className="text-right">
                      <span className="text-base font-black text-slate-900">
                        ₹ {match.calculatedFare}
                      </span>
                      <span className="text-[10px] font-normal text-slate-500 ml-1">per seat</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

        </div>
      )}

      {/* =========================================================================
          SCREEN 3: RIDE DETAILS & CORRIDOR TIMELINE
         ========================================================================= */}
      {currentScreen === 'RIDE_DETAILS' && (
        <div className="flex-1 flex flex-col h-full bg-slate-50 relative overflow-hidden animate-in fade-in duration-150">
          
          {/* Header */}
          <div className="px-5 py-3 bg-white border-b border-slate-100 flex items-center justify-between z-20 shadow-xs">
            <button 
              onClick={() => { sounds.playTap(); setCurrentScreen('AVAILABLE_RIDES'); }}
              className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-700 transition"
            >
              <ChevronLeft className="w-6 h-6 stroke-[2.2]" />
            </button>

            <span className="text-base font-black text-slate-900">Ride Details</span>

            <div className="w-6"></div>
          </div>

          <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3.5 no-scrollbar pb-6">
            
            {/* Driver Profile Card */}
            <div className="bg-white rounded-3xl p-4.5 border border-slate-200 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <img 
                    src={activeDriver.driverAvatar} 
                    alt={activeDriver.driverName}
                    className="w-12 h-12 rounded-full object-cover ring-2 ring-slate-100 shadow-xs"
                  />
                  <div>
                    <div className="font-black text-sm text-slate-900">
                      {activeDriver.driverName}
                    </div>
                    <div className="text-xs text-amber-500 font-bold flex items-center gap-1">
                      <Star className="w-3.5 h-3.5 fill-amber-400 stroke-none" />
                      <span>{activeDriver.driverRating}</span>
                      <span className="text-slate-400 font-normal">({activeDriver.totalTrips} rides)</span>
                    </div>
                  </div>
                </div>

                {renderModernCarImage(activeDriver.carType)}
              </div>

              <div className="text-xs text-slate-500 font-semibold flex items-center justify-between pt-1">
                <span>{activeDriver.vehicle} · {activeDriver.vehiclePlate}</span>
                <span className="text-emerald-700 font-bold flex items-center gap-1">
                  <Sparkles className="w-3 h-3" />
                  <span>AC Verified</span>
                </span>
              </div>

              <div className="flex items-center justify-between pt-2.5 border-t border-slate-100">
                <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase text-white ${
                  activeMatch.matchType === 'DIRECT' 
                    ? 'bg-[#00875A]' 
                    : activeMatch.matchType === 'CONNECTED'
                    ? 'bg-[#0066CC]'
                    : activeMatch.matchType === 'PARTIAL'
                    ? 'bg-[#EA580C]'
                    : 'bg-slate-700'
                }`}>
                  {activeMatch.matchTitle}
                </span>

                <div className="text-right">
                  <span className="text-lg font-black text-slate-900">₹ {dynamicSelectedFare}</span>
                  <span className="text-[10px] text-slate-500 block -mt-0.5">per seat</span>
                </div>
              </div>
            </div>

            {/* Vertical Milestone Route Timeline */}
            <div className="bg-white rounded-3xl p-4.5 border border-slate-200 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-slate-900 uppercase tracking-wider">Highway Route Corridor</span>
                <span className="text-[10px] text-slate-400 font-semibold">Strict Stop Points</span>
              </div>

              <div className="space-y-3.5 relative pl-2">
                <div className="absolute top-2 bottom-2 left-3.5 w-0.5 bg-slate-200"></div>

                {activeDriver.corridorStops.map((stop, idx) => {
                  const isStart = idx === 0;
                  const isPickup = stop.id === activeMatch.pickupStop.id;
                  const isDrop = stop.id === activeSelectedDropStop.id;
                  const isEnd = idx === activeDriver.corridorStops.length - 1;

                  return (
                    <div key={stop.id} className="flex items-start gap-3 relative z-10 text-xs">
                      <span className={`w-3.5 h-3.5 rounded-full border-2 border-white flex-shrink-0 mt-0.5 shadow-xs ${
                        isPickup 
                          ? 'bg-blue-600 ring-4 ring-blue-100' 
                          : isDrop
                          ? 'bg-rose-500 ring-4 ring-rose-100'
                          : isStart 
                          ? 'bg-emerald-500' 
                          : isEnd 
                          ? 'bg-slate-700' 
                          : 'bg-emerald-400'
                      }`}></span>

                      <div className="flex-1 flex items-center justify-between">
                        <div>
                          <span className={`font-black ${isPickup ? 'text-blue-700' : isDrop ? 'text-rose-600' : 'text-slate-900'}`}>
                            {stop.name}
                          </span>
                          {stop.legalStopType && (
                            <span className="block text-[9px] text-slate-400 font-medium">
                              {stop.legalStopType}
                            </span>
                          )}
                        </div>
                        <span className="text-[11px] text-slate-500 font-semibold">{stop.eta}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Multimodal Transfer Details Card (if CONNECTED) */}
            {activeMatch.matchType === 'CONNECTED' && activeMatch.verifiedTransfer && (
              <div className="p-3.5 rounded-2xl bg-blue-50 border border-blue-200 text-xs space-y-2">
                <div className="flex items-center gap-2 font-black text-blue-900">
                  <Compass className="w-4 h-4 text-blue-600" />
                  <span>Multimodal Journey to {destinationLocation}</span>
                </div>
                <p className="text-[11px] text-blue-800 leading-relaxed">
                  {activeMatch.verifiedTransfer.instructions}
                </p>
                <div className="flex items-center justify-between text-[10px] text-blue-700 pt-1 border-t border-blue-200/60 font-semibold">
                  <span>Transfer duration: ~{activeMatch.verifiedTransfer.transferDurationMin} mins</span>
                  <span>Total trip: ~{activeMatch.verifiedTransfer.totalTripEstimatedMin} mins</span>
                </div>
              </div>
            )}

            {/* Callout Notice */}
            <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs font-semibold text-emerald-900 flex items-center gap-2.5">
              <ShieldCheck className="w-4 h-4 text-emerald-600 flex-shrink-0" />
              <span>
                Drop-off is set to <strong>{activeSelectedDropStop.name}</strong>. You can change to any intermediate stop on the next screen.
              </span>
            </div>

            {/* Primary Action Button */}
            <button
              onClick={() => {
                sounds.playPop();
                setCurrentScreen('SELECT_DROP');
              }}
              className="w-full py-4 bg-[#00875A] hover:bg-[#00704A] text-white rounded-2xl font-black text-sm flex items-center justify-center gap-2 shadow-md shadow-emerald-700/25 active:scale-[0.98] transition cursor-pointer"
            >
              <span>Select Drop Point & Continue</span>
              <ArrowRight className="w-4 h-4" />
            </button>

          </div>

        </div>
      )}

      {/* =========================================================================
          SCREEN 4: FLEXIBLE INTERMEDIATE DROP POINT SELECTION
         ========================================================================= */}
      {currentScreen === 'SELECT_DROP' && (
        <div className="flex-1 flex flex-col h-full bg-slate-50 relative overflow-hidden animate-in fade-in duration-150">
          
          {/* Header */}
          <div className="px-5 py-3 bg-white border-b border-slate-100 flex items-center justify-between z-20 shadow-xs">
            <button 
              onClick={() => { sounds.playTap(); setCurrentScreen('RIDE_DETAILS'); }}
              className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-700 transition"
            >
              <ChevronLeft className="w-6 h-6 stroke-[2.2]" />
            </button>

            <span className="text-base font-black text-slate-900">Select Drop Point</span>

            <div className="w-6"></div>
          </div>

          {/* Driver Summary */}
          <div className="px-4 py-2.5 bg-white border-b border-slate-100 z-20 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <img 
                  src={activeDriver.driverAvatar} 
                  alt={activeDriver.driverName}
                  className="w-8 h-8 rounded-full object-cover ring-2 ring-slate-100 shadow-xs"
                />
                <div>
                  <span className="font-black text-xs text-slate-900">{activeDriver.driverName}</span>
                  <span className="text-[11px] text-amber-500 font-bold ml-1.5">★ {activeDriver.driverRating}</span>
                </div>
              </div>

              <div className="text-right">
                <span className="text-xs font-black text-slate-900">₹ {dynamicSelectedFare}</span>
                <span className="text-[9px] text-slate-400 block">per seat</span>
              </div>
            </div>

            <div className="p-2.5 bg-blue-50/90 rounded-2xl text-[11px] text-blue-900 font-medium border border-blue-200/50">
              Driver travels along the highway corridor. Choose your preferred intermediate drop-off point below:
            </div>
          </div>

          {/* Interactive Map Visual */}
          <div className="flex-1 relative bg-[#EBF4F6] overflow-hidden min-h-[160px]">
            <svg className="w-full h-full" viewBox="0 0 400 240" preserveAspectRatio="none">
              <path d="M 0 120 L 400 120" stroke="#FFFFFF" strokeWidth="8" />
              <path d="M 200 0 L 200 240" stroke="#FFFFFF" strokeWidth="8" />
              <path d="M 60 200 Q 180 140 320 50" stroke="#00875A" strokeWidth="6" fill="none" strokeLinecap="round" />
              <circle cx="320" cy="50" r="7" fill="#10B981" stroke="#FFFFFF" strokeWidth="2" />
              <circle cx="250" cy="85" r="6" fill="#0284C7" stroke="#FFFFFF" strokeWidth="2" />
              <circle cx="180" cy="125" r="5" fill="#10B981" stroke="#FFFFFF" strokeWidth="1.5" />
              <circle cx="120" cy="160" r="6" fill="#0284C7" stroke="#FFFFFF" strokeWidth="2" />
              <circle cx="60" cy="200" r="7" fill="#EF4444" stroke="#FFFFFF" strokeWidth="2" />
            </svg>

            {/* Selected Stop Pin Marker */}
            <div className="absolute top-16 left-32 z-20 flex flex-col items-center animate-bounce">
              <div className="px-3 py-1 bg-slate-900 text-white text-[10px] font-black rounded-xl shadow-xl">
                Drop: {activeSelectedDropStop.name}
              </div>
              <div className="w-2.5 h-2.5 bg-slate-900 rotate-45 -mt-1"></div>
            </div>
          </div>

          {/* Bottom Sheet Drawer */}
          <div className="bg-white rounded-t-3xl p-4.5 border-t border-slate-200 shadow-2xl space-y-3 z-30 max-h-[50%] overflow-y-auto no-scrollbar">
            <div className="w-10 h-1 bg-slate-200 rounded-full mx-auto -mt-1.5 mb-1.5"></div>

            <div className="flex items-center justify-between">
              <span className="text-sm font-black text-slate-900">
                Approved Drop-off Points
              </span>
              <span className="text-[10px] text-slate-400 font-bold">
                Legally Verified Bays
              </span>
            </div>

            <div className="space-y-2">
              {activeDriver.corridorStops
                .filter(stop => stop.order > activeMatch.pickupStop.order)
                .map((stop) => {
                  const isSelected = activeSelectedDropStop.id === stop.id;

                  return (
                    <div
                      key={stop.id}
                      onClick={() => {
                        sounds.playTap();
                        setSelectedDropPointId(stop.id);
                        onSelectDropoffLocation?.(stop.name);
                      }}
                      className={`p-3 rounded-2xl border text-xs flex items-center justify-between cursor-pointer transition ${
                        isSelected
                          ? 'bg-emerald-50/90 border-emerald-500 shadow-xs'
                          : 'bg-white border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                          isSelected 
                            ? 'border-emerald-600 bg-emerald-600' 
                            : 'border-slate-300'
                        }`}>
                          {isSelected && <span className="w-1.5 h-1.5 rounded-full bg-white"></span>}
                        </div>

                        <div>
                          <div className={`font-bold ${isSelected ? 'text-slate-900 font-black' : 'text-slate-700'}`}>
                            {stop.name}
                          </div>
                          {stop.legalStopType && (
                            <div className="text-[9px] text-slate-400 font-medium">
                              {stop.legalStopType}
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="text-right">
                        <span className="text-[11px] text-slate-500 font-semibold block">{stop.eta}</span>
                        <span className="text-[10px] font-bold text-emerald-700">Approved Bay</span>
                      </div>
                    </div>
                  );
                })}
            </div>

            {/* Action Button */}
            <button
              onClick={() => {
                sounds.playSuccess();
                setCurrentScreen('BOOKING_SUMMARY');
              }}
              className="w-full mt-2 py-3.5 bg-[#00875A] hover:bg-[#00704A] text-white rounded-2xl font-black text-sm flex items-center justify-center gap-2 shadow-md shadow-emerald-700/25 active:scale-[0.98] transition cursor-pointer"
            >
              <span>Continue with {activeSelectedDropStop.name}</span>
            </button>
          </div>

        </div>
      )}

      {/* =========================================================================
          SCREEN 5: BOOKING SUMMARY & PAYMENT
         ========================================================================= */}
      {currentScreen === 'BOOKING_SUMMARY' && (
        <div className="flex-1 flex flex-col h-full bg-slate-50 relative overflow-hidden animate-in fade-in duration-150">
          
          {/* Header */}
          <div className="px-5 py-3 bg-white border-b border-slate-100 flex items-center justify-between z-20 shadow-xs">
            <button 
              onClick={() => { sounds.playTap(); setCurrentScreen('SELECT_DROP'); }}
              className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-700 transition"
            >
              <ChevronLeft className="w-6 h-6 stroke-[2.2]" />
            </button>

            <span className="text-base font-black text-slate-900">Booking Summary</span>

            <div className="w-6"></div>
          </div>

          <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3.5 no-scrollbar pb-6">
            
            {/* Driver & Car Summary Card */}
            <div className="bg-white rounded-3xl p-4 border border-slate-200 shadow-xs flex items-center justify-between">
              <div className="flex items-center gap-3">
                <img 
                  src={activeDriver.driverAvatar} 
                  alt={activeDriver.driverName}
                  className="w-12 h-12 rounded-full object-cover ring-2 ring-slate-100 shadow-xs"
                />
                <div>
                  <div className="font-black text-sm text-slate-900">{activeDriver.driverName}</div>
                  <div className="text-[11px] text-amber-500 font-bold mt-0.5 flex items-center gap-1">
                    <Star className="w-3.5 h-3.5 fill-amber-400 stroke-none" />
                    <span>{activeDriver.driverRating}</span>
                    <span className="text-slate-400 font-normal">({activeDriver.totalTrips} rides)</span>
                  </div>
                  <div className="text-[11px] text-slate-500 font-semibold mt-0.5">
                    {activeDriver.vehicle} · {activeDriver.vehiclePlate}
                  </div>
                </div>
              </div>

              {renderModernCarImage(activeDriver.carType)}
            </div>

            {/* Trip Details Card */}
            <div className="bg-white rounded-3xl p-4.5 border border-slate-200 shadow-xs space-y-3 text-xs">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 ring-4 ring-emerald-100"></span>
                  <span className="font-black text-slate-900">Pickup Stop</span>
                </div>
                <div className="text-right">
                  <span className="font-black text-slate-900">{activeMatch.pickupStop.eta}</span>
                  <span className="text-[11px] text-slate-500 block font-medium">{activeMatch.pickupStop.name}</span>
                </div>
              </div>

              <div className="flex items-center justify-between pt-2.5 border-t border-slate-100">
                <div className="flex items-center gap-2.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-600 ring-4 ring-rose-100"></span>
                  <span className="font-black text-slate-900">Drop Point</span>
                </div>
                <div className="text-right">
                  <span className="font-black text-slate-900">{activeSelectedDropStop.eta}</span>
                  <span className="text-[11px] text-slate-500 block font-medium">{activeSelectedDropStop.name}</span>
                </div>
              </div>

              <div className="flex items-center justify-between pt-2.5 border-t border-slate-100">
                <div className="flex items-center gap-2 text-slate-600 font-bold">
                  <Compass className="w-4 h-4 text-slate-500" />
                  <span>Trip Category</span>
                </div>
                <span className="font-black text-slate-900">{activeMatch.matchTitle}</span>
              </div>

              <div className="flex items-center justify-between pt-2.5 border-t border-slate-100">
                <div className="flex items-center gap-2 text-slate-600 font-bold">
                  <CreditCard className="w-4 h-4 text-slate-500" />
                  <span>Seat Price</span>
                </div>
                <span className="font-black text-slate-900">₹ {dynamicSelectedFare} <span className="text-[10px] font-normal text-slate-500">per seat</span></span>
              </div>
            </div>

            {/* Passenger Count Stepper */}
            <div className="bg-white rounded-2xl p-3.5 border border-slate-200 shadow-xs flex items-center justify-between text-xs">
              <span className="font-black text-slate-900">Seats to Book</span>

              <div className="flex items-center gap-2.5">
                <button 
                  onClick={() => setPassengerCount(Math.max(1, passengerCount - 1))}
                  className="w-7 h-7 rounded-xl bg-slate-100 font-black text-xs text-slate-700 flex items-center justify-center hover:bg-slate-200 transition"
                >
                  -
                </button>
                <span className="font-black text-xs text-slate-900">{passengerCount} Seat{passengerCount > 1 ? 's' : ''}</span>
                <button 
                  onClick={() => setPassengerCount(Math.min(activeDriver.availableSeatsCount, passengerCount + 1))}
                  className="w-7 h-7 rounded-xl bg-slate-100 font-black text-xs text-slate-700 flex items-center justify-center hover:bg-slate-200 transition"
                >
                  +
                </button>
              </div>
            </div>

            {/* Payment Method Selector */}
            <div className="bg-white rounded-3xl p-4.5 border border-slate-200 shadow-xs space-y-2.5 text-xs">
              <span className="font-black text-slate-900 block mb-1">Select Payment</span>

              {[
                { id: 'UPI', label: 'UPI (GPay / PhonePe / Paytm)', icon: QrCode },
                { id: 'CARD', label: 'Credit / Debit Card', icon: CreditCard },
                { id: 'WALLET', label: `Zaldi Cash Wallet (₹${walletBalance})`, icon: Wallet }
              ].map(pm => {
                const isSelected = paymentMethod === pm.id;

                return (
                  <div
                    key={pm.id}
                    onClick={() => { sounds.playTap(); setPaymentMethod(pm.id as any); }}
                    className={`p-3 rounded-2xl border flex items-center justify-between cursor-pointer transition ${
                      isSelected 
                        ? 'border-emerald-500 bg-emerald-50/60 shadow-xs' 
                        : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <pm.icon className="w-4 h-4 text-slate-600" />
                      <span className="font-bold text-slate-800">{pm.label}</span>
                    </div>

                    <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                      isSelected ? 'border-emerald-600 bg-emerald-600' : 'border-slate-300'
                    }`}>
                      {isSelected && <span className="w-1.5 h-1.5 rounded-full bg-white"></span>}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Terms and Conditions Checkbox */}
            <div 
              onClick={() => { sounds.playTap(); setTermsAccepted(!termsAccepted); }}
              className="flex items-center gap-2.5 text-xs text-slate-700 cursor-pointer pt-1"
            >
              <div className={`w-4 h-4 rounded-lg border flex items-center justify-center transition ${
                termsAccepted ? 'bg-[#00875A] border-[#00875A] text-white shadow-xs' : 'border-slate-300 bg-white'
              }`}>
                {termsAccepted && <Check className="w-3 h-3 stroke-[3]" />}
              </div>
              <span className="font-bold text-[11px]">
                I agree to the <span className="text-blue-600 underline">Carpool Passenger Terms</span> & highway safety guidelines
              </span>
            </div>

            {/* Total Fare & Confirmation */}
            <div className="space-y-2 pt-1">
              <div className="flex items-center justify-between px-2 text-sm font-black text-slate-900">
                <span>Total Payable:</span>
                <span>₹ {passengerCount * dynamicSelectedFare}</span>
              </div>

              <button
                onClick={handleConfirmBooking}
                className="w-full py-4 bg-[#00875A] hover:bg-[#00704A] text-white rounded-2xl font-black text-sm flex items-center justify-center gap-2 shadow-md shadow-emerald-700/25 active:scale-[0.98] transition cursor-pointer"
              >
                <span>Confirm & Reserve {passengerCount} Seat{passengerCount > 1 ? 's' : ''}</span>
              </button>
            </div>

          </div>

        </div>
      )}

      {/* =========================================================================
          SCREEN 6: REAL-TIME TRACKING COCKPIT (LIVE VEHICLE & TELEMETRY)
         ========================================================================= */}
      {currentScreen === 'LIVE_COCKPIT' && (
        <div className="flex-1 flex flex-col h-full bg-slate-50 relative overflow-hidden animate-in fade-in duration-150">
          
          {/* Header */}
          <div className="px-5 py-3 bg-white border-b border-slate-100 flex items-center justify-between z-20 shadow-xs">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping"></span>
              <span className="text-base font-black text-slate-900">Live Trip Cockpit</span>
            </div>

            <button 
              onClick={() => { sounds.playTap(); setCurrentScreen('HOME'); }}
              className="text-xs font-bold text-slate-600 hover:text-slate-900 bg-slate-100 px-3 py-1.5 rounded-xl transition"
            >
              Minimize
            </button>
          </div>

          <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3.5 no-scrollbar pb-8">
            
            {activeLiveBooking ? (
              <>
                {/* Live Status Stage Banner */}
                <div className="bg-slate-900 text-white rounded-3xl p-4.5 shadow-md space-y-3 border border-slate-800">
                  <div className="flex items-center justify-between">
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-500 text-slate-950">
                      {activeLiveBooking.status === 'APPROACHING_PICKUP'
                        ? 'Driver Approaching'
                        : activeLiveBooking.status === 'ARRIVED_AT_BAY'
                        ? 'Driver Arrived at Bay'
                        : activeLiveBooking.status === 'IN_TRANSIT'
                        ? 'In Transit on Highway'
                        : 'Trip Completed'}
                    </span>

                    <span className="text-[11px] font-mono text-emerald-400 font-bold">
                      {activeLiveBooking.driverSpeedKmh} km/h · Real-time
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-xl font-black tracking-tight">
                        {activeLiveBooking.status === 'ARRIVED_AT_BAY' 
                          ? 'Vehicle at Boarding Bay!'
                          : `${activeLiveBooking.distanceToPickupKm} km away`}
                      </h3>
                      <p className="text-xs text-slate-300 mt-0.5">
                        {activeLiveBooking.status === 'ARRIVED_AT_BAY'
                          ? `Boarding Bay 2 at ${activeLiveBooking.pickupStopName}`
                          : `Estimated arrival in ~${activeLiveBooking.etaMinutes} mins`}
                      </p>
                    </div>

                    {/* Boarding Security PIN */}
                    <div className="p-2.5 bg-slate-800 rounded-2xl border border-slate-700 text-right">
                      <span className="text-[9px] text-slate-400 font-bold uppercase block">Boarding PIN</span>
                      <span className="text-lg font-black tracking-widest text-emerald-400">{activeLiveBooking.boardingPin}</span>
                    </div>
                  </div>
                </div>

                {/* Real-time Tracking Vector Map */}
                <div className="w-full h-52 rounded-3xl bg-[#EBF4F6] relative overflow-hidden border border-slate-200 shadow-xs">
                  <svg className="w-full h-full" viewBox="0 0 360 210">
                    <defs>
                      <linearGradient id="liveHighwayGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#38BDF8" />
                        <stop offset="100%" stopColor="#00875A" />
                      </linearGradient>
                    </defs>
                    <path d="M 30 170 L 330 30" stroke="#CBD5E1" strokeWidth="8" strokeLinecap="round" />
                    <path d="M 30 170 Q 150 120 330 30" stroke="url(#liveHighwayGrad)" strokeWidth="5" fill="none" strokeLinecap="round" />
                    
                    {/* Pickup stop pin */}
                    <circle cx="160" cy="115" r="7" fill="#2563EB" stroke="#FFFFFF" strokeWidth="2" />
                    {/* Drop stop pin */}
                    <circle cx="330" cy="30" r="7" fill="#EF4444" stroke="#FFFFFF" strokeWidth="2" />
                    
                    {/* Real-time Moving Car */}
                    <g transform={`translate(${30 + activeLiveBooking.driverProgress * 300}, ${170 - activeLiveBooking.driverProgress * 140})`}>
                      <circle cx="0" cy="0" r="9" fill="#059669" stroke="#FFFFFF" strokeWidth="2.5" />
                      <circle cx="0" cy="0" r="16" fill="#059669" opacity="0.3" className="animate-ping" />
                    </g>
                  </svg>

                  <div className="absolute top-3 left-3 text-[10px] font-black bg-white/95 px-2.5 py-1 rounded-xl shadow-xs text-slate-800 flex items-center gap-1.5 border border-slate-100">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                    <span>Live GPS Stream: Active</span>
                  </div>

                  <div className="absolute bottom-3 right-3 text-[10px] font-black bg-slate-900 text-white px-2.5 py-1 rounded-xl shadow-xs">
                    {activeLiveBooking.pickupStopName} → {activeLiveBooking.dropoffStopName}
                  </div>
                </div>

                {/* Driver Card & Direct Actions */}
                <div className="bg-white rounded-3xl p-4 border border-slate-200 shadow-xs space-y-3">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                    <div className="flex items-center gap-2.5">
                      <img src={activeLiveBooking.driverAvatar} alt={activeLiveBooking.driverName} className="w-11 h-11 rounded-full object-cover" />
                      <div>
                        <span className="font-black text-sm block">{activeLiveBooking.driverName}</span>
                        <span className="text-[11px] text-slate-500 font-semibold">{activeLiveBooking.vehicle} · {activeLiveBooking.vehiclePlate}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <a
                        href={`tel:${activeLiveBooking.driverPhone}`}
                        onClick={() => sounds.playTap()}
                        className="p-2.5 bg-emerald-50 text-[#00875A] rounded-2xl hover:bg-emerald-100 transition shadow-2xs"
                        title="Call Driver"
                      >
                        <Phone className="w-4 h-4" />
                      </a>
                      <button 
                        onClick={() => { sounds.playTap(); setShowChatModal(true); }}
                        className="p-2.5 bg-blue-50 text-blue-600 rounded-2xl hover:bg-blue-100 transition shadow-2xs relative"
                        title="Chat with Driver"
                      >
                        <MessageSquare className="w-4 h-4" />
                        <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-blue-600"></span>
                      </button>
                    </div>
                  </div>

                  {/* Trip Points Summary */}
                  <div className="space-y-1.5 text-xs">
                    <div className="flex justify-between">
                      <span className="text-slate-500 font-medium">Pickup Point:</span>
                      <span className="font-black text-slate-900">{activeLiveBooking.pickupStopName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500 font-medium">Dropoff Point:</span>
                      <span className="font-black text-slate-900">{activeLiveBooking.dropoffStopName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500 font-medium">Seats Booked:</span>
                      <span className="font-black text-slate-900">{activeLiveBooking.passengerCount} Seat{activeLiveBooking.passengerCount > 1 ? 's' : ''}</span>
                    </div>
                    <div className="flex justify-between pt-1.5 border-t border-slate-100">
                      <span className="text-slate-500 font-medium">Total Paid:</span>
                      <span className="font-black text-sm text-slate-900">₹ {activeLiveBooking.totalPaid}</span>
                    </div>
                  </div>

                  {/* Quick Action Grid */}
                  <div className="grid grid-cols-3 gap-2 pt-1">
                    <button
                      onClick={() => {
                        sounds.playPop();
                        navigator.clipboard?.writeText?.(window.location.href);
                        setCopiedTrackingLink(true);
                        setTimeout(() => setCopiedTrackingLink(false), 2000);
                      }}
                      className="py-2.5 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-[11px] transition flex flex-col items-center gap-1"
                    >
                      {copiedTrackingLink ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Share2 className="w-3.5 h-3.5" />}
                      <span>{copiedTrackingLink ? 'Copied' : 'Share Trip'}</span>
                    </button>

                    <button
                      onClick={() => { sounds.playAlert(); setShowSosModal(true); }}
                      className="py-2.5 rounded-2xl bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-[11px] transition flex flex-col items-center gap-1 border border-rose-200"
                    >
                      <AlertOctagon className="w-3.5 h-3.5" />
                      <span>SOS Alert</span>
                    </button>

                    <button
                      onClick={handleCancelActiveRide}
                      className="py-2.5 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-[11px] transition flex flex-col items-center gap-1"
                    >
                      <XCircle className="w-3.5 h-3.5 text-slate-500" />
                      <span>Cancel</span>
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <div className="text-center py-12 space-y-3">
                <Navigation className="w-10 h-10 text-slate-400 mx-auto" />
                <h3 className="text-sm font-black text-slate-900">No Active Ride in Progress</h3>
                <p className="text-xs text-slate-500 max-w-xs mx-auto">
                  Find a live driver on the corridor or search matching rides to start live tracking.
                </p>
                <button
                  onClick={() => setCurrentScreen('HOME')}
                  className="px-4 py-2 bg-[#00875A] text-white rounded-xl text-xs font-black shadow-xs"
                >
                  Find a Carpool Ride
                </button>
              </div>
            )}

          </div>

        </div>
      )}

      {/* =========================================================================
          MODAL 1: OFFER A RIDE (HOST / DRIVER MODE)
         ========================================================================= */}
      {showOfferRideModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl w-full max-w-sm p-5 space-y-4 shadow-2xl border border-slate-100">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Car className="w-5 h-5 text-[#00875A]" />
                <h3 className="font-black text-base text-slate-900">Offer a Carpool Ride</h3>
              </div>
              <button 
                onClick={() => setShowOfferRideModal(false)}
                className="p-1 rounded-full text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-500 leading-relaxed">
              Share your empty seats with verified passengers travelling on your highway route to offset fuel costs.
            </p>

            <div className="space-y-2.5 text-xs font-bold text-slate-700">
              <div>
                <label className="text-[10px] text-slate-400 uppercase block mb-1">Your Vehicle Model</label>
                <input 
                  type="text" 
                  value={offerVehicleModel} 
                  onChange={e => setOfferVehicleModel(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 rounded-xl border border-slate-200 outline-none text-slate-900 font-black"
                />
              </div>

              <div>
                <label className="text-[10px] text-slate-400 uppercase block mb-1">Vehicle License Plate</label>
                <input 
                  type="text" 
                  value={offerVehiclePlate} 
                  onChange={e => setOfferVehiclePlate(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 rounded-xl border border-slate-200 outline-none text-slate-900 font-black uppercase"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] text-slate-400 uppercase block mb-1">Departure Point</label>
                  <input 
                    type="text" 
                    value={offerOrigin} 
                    onChange={e => setOfferOrigin(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 rounded-xl border border-slate-200 outline-none text-slate-900 font-bold"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-slate-400 uppercase block mb-1">Destination Point</label>
                  <input 
                    type="text" 
                    value={offerDest} 
                    onChange={e => setOfferDest(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 rounded-xl border border-slate-200 outline-none text-slate-900 font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] text-slate-400 uppercase block mb-1">Empty Seats</label>
                  <input 
                    type="number" 
                    min={1} 
                    max={6}
                    value={offerSeats} 
                    onChange={e => setOfferSeats(Number(e.target.value))}
                    className="w-full p-2.5 bg-slate-50 rounded-xl border border-slate-200 outline-none text-slate-900 font-black"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-slate-400 uppercase block mb-1">Fare Per Seat (₹)</label>
                  <input 
                    type="number" 
                    min={50}
                    value={offerPrice} 
                    onChange={e => setOfferPrice(Number(e.target.value))}
                    className="w-full p-2.5 bg-slate-50 rounded-xl border border-slate-200 outline-none text-slate-900 font-black"
                  />
                </div>
              </div>
            </div>

            <button
              onClick={handlePublishCustomRide}
              className="w-full py-3.5 bg-[#00875A] hover:bg-[#00704A] text-white rounded-2xl font-black text-sm flex items-center justify-center gap-2 shadow-md transition"
            >
              <span>Publish Ride to Live Corridor</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL 2: IN-TRIP LIVE CHAT WITH DRIVER
         ========================================================================= */}
      {showChatModal && activeLiveBooking && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl w-full max-w-sm h-[480px] flex flex-col shadow-2xl border border-slate-100 overflow-hidden">
            <div className="px-4 py-3 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <img src={activeLiveBooking.driverAvatar} alt={activeLiveBooking.driverName} className="w-8 h-8 rounded-full object-cover" />
                <div>
                  <span className="font-black text-xs block">{activeLiveBooking.driverName}</span>
                  <span className="text-[10px] text-emerald-400 font-semibold">{activeLiveBooking.vehiclePlate}</span>
                </div>
              </div>
              <button onClick={() => setShowChatModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-2.5 bg-slate-50 text-xs">
              {activeLiveBooking.chatMessages.map(msg => (
                <div key={msg.id} className={`flex flex-col ${msg.sender === 'PASSENGER' ? 'items-end' : 'items-start'}`}>
                  <div className={`p-3 rounded-2xl max-w-[80%] font-medium ${
                    msg.sender === 'PASSENGER' 
                      ? 'bg-[#00875A] text-white rounded-br-xs' 
                      : 'bg-white border border-slate-200 text-slate-800 rounded-bl-xs shadow-xs'
                  }`}>
                    {msg.text}
                  </div>
                  <span className="text-[9px] text-slate-400 mt-0.5 px-1">{msg.time}</span>
                </div>
              ))}
            </div>

            <div className="p-3 bg-white border-t border-slate-200 flex items-center gap-2">
              <input 
                type="text" 
                value={chatInputText} 
                onChange={e => setChatInputText(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSendChatMessage()}
                placeholder="Message driver..."
                className="flex-1 text-xs bg-slate-100 rounded-xl px-3 py-2 outline-none font-medium"
              />
              <button 
                onClick={handleSendChatMessage}
                className="p-2 bg-[#00875A] text-white rounded-xl hover:bg-emerald-700 transition"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL 3: EMERGENCY SOS ALERT
         ========================================================================= */}
      {showSosModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl w-full max-w-sm p-5 space-y-4 shadow-2xl border border-rose-200 text-center">
            <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
              <AlertOctagon className="w-7 h-7" />
            </div>

            <h3 className="font-black text-base text-rose-950">Emergency Safety Protocol</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Your real-time GPS location and ride details will be instantly dispatched to Zaldi 24/7 Safety Response and local highway patrol (112).
            </p>

            <div className="space-y-2 pt-2">
              <a
                href="tel:112"
                onClick={() => { sounds.playAlert(); setShowSosModal(false); }}
                className="w-full py-3 bg-rose-600 hover:bg-rose-700 text-white rounded-2xl font-black text-xs flex items-center justify-center gap-1.5 shadow-md block"
              >
                <Phone className="w-4 h-4" />
                <span>Call Emergency Police (112)</span>
              </a>

              <button
                onClick={() => { sounds.playTap(); setShowSosModal(false); }}
                className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-2xl font-bold text-xs"
              >
                Dismiss / False Alarm
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
