export type AppRole = 
  | 'CUSTOMER_APP' 
  | 'DRIVER_APP' 
  | 'ADMIN_APP' 
  | 'FLEET_GIS' 
  | 'ARCHITECTURAL_DEPOT';

export type CustomerTab = 'BOOKING' | 'CARPOOL' | 'OUTSTATION' | 'HISTORY' | 'PROFILE';

export type BookingStatus = 
  | 'IDLE'
  | 'FINDING_DRIVER'
  | 'DRIVER_ASSIGNED'
  | 'DRIVER_COMING'
  | 'DRIVER_ARRIVED'
  | 'TRIP_STARTED'
  | 'TRIP_COMPLETED'
  | 'SEARCHING'
  | 'MATCHED'
  | 'ARRIVING'
  | 'IN_PROGRESS'
  | 'PAYMENT'
  | 'COMPLETED'
  | 'CANCELLED';

export interface RoutePoint {
  x: number;
  y: number;
  streetName?: string;
}

export interface RoadRouteInfo {
  pathD: string;
  points: RoutePoint[];
  totalDistanceKm: number;
  estimatedTravelTimeMin: number;
  pickupAddress: string;
  dropAddress: string;
}

export interface VehicleTier {
  id: string;
  name: string;
  capacity: string;
  baseFare: number;
  perKm: number;
  etaMin: number;
  icon: string;
  badge?: string;
  description: string;
}

export interface Driver {
  id: string;
  name: string;
  phone: string;
  vehicle: string;
  vehicleModel: string;
  plate: string;
  rating: number;
  totalTrips: number;
  isOnline: boolean;
  avatarSeed: string;
  lat: number;
  lng: number;
  earningsToday: number;
}

export interface RideOrder {
  id: string;
  customerName: string;
  customerPhone: string;
  pickup: string;
  drop: string;
  distanceKm: number;
  fare: number;
  discount: number;
  finalFare: number;
  vehicleTier: string;
  vehicleIcon: string;
  driverId: string;
  riderPin: string;
  status: BookingStatus;
  paymentMethod: 'WALLET' | 'UPI' | 'CASH' | 'CARD';
  createdAt: string;
  progressPercent: number;
}

export interface LocationItem {
  id: string;
  name: string;
  area: string;
  type?: 'popular' | 'station' | 'airport' | 'office';
  lat: number;
  lng: number;
}

export interface CarpoolRoute {
  id: string;
  from: string;
  to: string;
  departureTime: string;
  driverName: string;
  vehicle: string;
  availableSeats: number;
  totalSeats: number;
  pricePerSeat: number;
  verifiedDriver: boolean;
}

export interface OutstationPackage {
  id: string;
  title: string;
  type: 'RENTAL' | 'VEHICLE_DRIVER' | 'DRIVER_ONLY';
  category: 'Bike' | 'Car' | 'Bus' | 'Luxury';
  pricing: string;
  tag: string;
  features: string[];
}

export interface HeatmapDemandPoint {
  id: string;
  name: string;
  area: string;
  city: 'Hyderabad' | 'Warangal';
  x: number; // 0 to 100 relative SVG/canvas coordinates
  y: number; // 0 to 100 relative SVG/canvas coordinates
  intensity: number; // 0.1 to 1.0 (demand scale)
  activeRequests: number;
  surgeMultiplier: number;
  captainsNearby: number;
  avgWaitMin: number;
  lastPingTime: string;
  category: 'office' | 'airport' | 'station' | 'commercial' | 'university';
}

