import { RoutePoint } from '../types';

export type TelematicsVehicleType = 'SEDAN' | 'AUTO' | 'BIKE' | 'TRUCK' | 'PREMIUM' | 'PARCEL';
export type VehicleEngineStatus = 'IN_TRANSIT' | 'IDLING' | 'DISPATCHED' | 'MAINTENANCE' | 'CHARGING';

export interface FleetVehicleTelematics {
  id: string;
  driverName: string;
  driverPhone: string;
  driverAvatar: string;
  plateNumber: string;
  vehicleType: TelematicsVehicleType;
  modelName: string;
  year: number;
  engineStatus: VehicleEngineStatus;
  speedKmh: number;
  speedLimit: number;
  headingDeg: number;
  fuelOrBatteryPercent: number;
  powerType: 'EV' | 'PETROL' | 'CNG' | 'DIESEL';
  rangeRemainingKm: number;
  ecoScore: number; // 0 - 100
  harshBrakingEvents: number;
  engineTempC: number;
  odometerKm: number;
  currentGeofence: string;
  currentAddress: string;
  destinationAddress?: string;
  assignedOrder?: string;
  coords: { x: number; y: number };
  lastPingSecondsAgo: number;
  routeTrail: RoutePoint[];
}

export interface GeofenceZone {
  id: string;
  name: string;
  category: 'TECH_SEZ' | 'LOGISTICS_HUB' | 'AIRPORT_CORRIDOR' | 'COMMERCIAL_CORE' | 'DEPOT';
  city: 'Hyderabad' | 'Warangal';
  polygonPoints: Array<{ x: number; y: number }>;
  activeVehiclesCount: number;
  speedLimitKmh: number;
  status: 'OPTIMAL' | 'CONGESTED' | 'RESTRICTED';
}

export interface DepotBay {
  id: string;
  bayNumber: string;
  bayType: 'EV_FAST_CHARGER' | 'CARGO_LOADING_DOCK' | 'FLEET_MAINTENANCE' | 'RAPID_DISPATCH_STAGING';
  status: 'OCCUPIED' | 'AVAILABLE' | 'RESERVED' | 'MAINTENANCE';
  occupiedVehicleId?: string;
  occupiedVehicleModel?: string;
  progressPercent: number;
  etaCompletionMin: number;
}

export interface ArchitecturalFacility {
  id: string;
  title: string;
  category: 'LOGISTICS_DEPOT' | 'URBAN_STREET' | 'SHIPPING_HUB';
  location: string;
  tagline: string;
  activeUnitsCount: number;
  throughputPerHour: number;
  avgTurnaroundMin: number;
  evChargingCapacityKw: number;
  solarEfficiencyPercent: number;
  bays: DepotBay[];
}

export const FLEET_TELEMATICS_UNITS: FleetVehicleTelematics[] = [
  {
    id: 'FLEET-HYD-101',
    driverName: 'Priya Sharma',
    driverPhone: '+91 98490-21345',
    driverAvatar: 'PS',
    plateNumber: 'TS 09 AB 1011',
    vehicleType: 'SEDAN',
    modelName: 'Tata Tigor EV Sedan (Ziptron)',
    year: 2025,
    engineStatus: 'IN_TRANSIT',
    speedKmh: 46,
    speedLimit: 50,
    headingDeg: 135,
    fuelOrBatteryPercent: 78,
    powerType: 'EV',
    rangeRemainingKm: 185,
    ecoScore: 94,
    harshBrakingEvents: 0,
    engineTempC: 38,
    odometerKm: 34210,
    currentGeofence: 'Hitec City IT Corridor',
    currentAddress: 'Mindspace IT Park Circular Rd',
    destinationAddress: 'RGIA Airport Terminal 1',
    assignedOrder: 'TRP-8821B',
    coords: { x: 38, y: 50 },
    lastPingSecondsAgo: 2,
    routeTrail: [
      { x: 34, y: 46 },
      { x: 36, y: 48 },
      { x: 38, y: 50 }
    ]
  },
  {
    id: 'FLEET-HYD-202',
    driverName: 'Vikram Singh',
    driverPhone: '+91 98480-45678',
    driverAvatar: 'VS',
    plateNumber: 'TS 09 TA 2024',
    vehicleType: 'AUTO',
    modelName: 'Bajaj RE E-TEC 9.0 (Electric)',
    year: 2024,
    engineStatus: 'IN_TRANSIT',
    speedKmh: 34,
    speedLimit: 40,
    headingDeg: 210,
    fuelOrBatteryPercent: 62,
    powerType: 'EV',
    rangeRemainingKm: 98,
    ecoScore: 91,
    harshBrakingEvents: 1,
    engineTempC: 41,
    odometerKm: 28400,
    currentGeofence: 'Madhapur Commercial Core',
    currentAddress: 'Inorbit Mall Boulevard',
    destinationAddress: 'Jubilee Hills Road No. 36',
    assignedOrder: 'TRP-9014C',
    coords: { x: 40, y: 42 },
    lastPingSecondsAgo: 3,
    routeTrail: [
      { x: 38, y: 44 },
      { x: 39, y: 43 },
      { x: 40, y: 42 }
    ]
  },
  {
    id: 'FLEET-HYD-303',
    driverName: 'Ravi Kumar',
    driverPhone: '+91 98480-12345',
    driverAvatar: 'RK',
    plateNumber: 'TS 09 MB 3031',
    vehicleType: 'BIKE',
    modelName: 'Ather 450X Gen 3 (Apex Moto)',
    year: 2025,
    engineStatus: 'DISPATCHED',
    speedKmh: 41,
    speedLimit: 45,
    headingDeg: 45,
    fuelOrBatteryPercent: 84,
    powerType: 'EV',
    rangeRemainingKm: 112,
    ecoScore: 96,
    harshBrakingEvents: 0,
    engineTempC: 36,
    odometerKm: 19850,
    currentGeofence: 'Cable Bridge Expressway',
    currentAddress: 'Durgam Cheruvu Bridge Approach',
    destinationAddress: 'Kondapur Botanical Garden',
    assignedOrder: 'TRP-4412M',
    coords: { x: 36, y: 44 },
    lastPingSecondsAgo: 1,
    routeTrail: [
      { x: 34, y: 46 },
      { x: 35, y: 45 },
      { x: 36, y: 44 }
    ]
  },
  {
    id: 'FLEET-HYD-404',
    driverName: 'Suresh Nayak',
    driverPhone: '+91 97000-88112',
    driverAvatar: 'SN',
    plateNumber: 'TS 07 TR 4049',
    vehicleType: 'TRUCK',
    modelName: 'Tata Ace EV (1.5T Logistics Van)',
    year: 2024,
    engineStatus: 'IN_TRANSIT',
    speedKmh: 52,
    speedLimit: 60,
    headingDeg: 280,
    fuelOrBatteryPercent: 55,
    powerType: 'EV',
    rangeRemainingKm: 88,
    ecoScore: 88,
    harshBrakingEvents: 2,
    engineTempC: 44,
    odometerKm: 47620,
    currentGeofence: 'Financial District SEZ',
    currentAddress: 'Wipro Circle Way, Nanakramguda',
    destinationAddress: 'Central Logistics Depot Bay 4',
    assignedOrder: 'CRG-1102A',
    coords: { x: 18, y: 42 },
    lastPingSecondsAgo: 4,
    routeTrail: [
      { x: 22, y: 40 },
      { x: 20, y: 41 },
      { x: 18, y: 42 }
    ]
  },
  {
    id: 'FLEET-HYD-505',
    driverName: 'Kavya Rao',
    driverPhone: '+91 98888-77114',
    driverAvatar: 'KR',
    plateNumber: 'TS 09 PR 5055',
    vehicleType: 'PREMIUM',
    modelName: 'MG ZS EV Excite (Luxury SUV)',
    year: 2025,
    engineStatus: 'IDLING',
    speedKmh: 0,
    speedLimit: 50,
    headingDeg: 90,
    fuelOrBatteryPercent: 92,
    powerType: 'EV',
    rangeRemainingKm: 380,
    ecoScore: 98,
    harshBrakingEvents: 0,
    engineTempC: 32,
    odometerKm: 14200,
    currentGeofence: 'Banjara Hills Royal Enclave',
    currentAddress: 'Road No. 1, near GVK One',
    destinationAddress: 'Taj Krishna Staging Port',
    coords: { x: 48, y: 42 },
    lastPingSecondsAgo: 5,
    routeTrail: [
      { x: 48, y: 42 }
    ]
  },
  {
    id: 'FLEET-HYD-606',
    driverName: 'Naveen Goud',
    driverPhone: '+91 99123-55667',
    driverAvatar: 'NG',
    plateNumber: 'TS 08 EX 6062',
    vehicleType: 'PARCEL',
    modelName: 'Mahindra Zor Grand (Express Cargo)',
    year: 2024,
    engineStatus: 'IN_TRANSIT',
    speedKmh: 38,
    speedLimit: 45,
    headingDeg: 175,
    fuelOrBatteryPercent: 68,
    powerType: 'EV',
    rangeRemainingKm: 124,
    ecoScore: 93,
    harshBrakingEvents: 0,
    engineTempC: 39,
    odometerKm: 31800,
    currentGeofence: 'Secunderabad Junction Hub',
    currentAddress: 'Station Road Portico Lane',
    destinationAddress: 'Paradise Sorting Center',
    assignedOrder: 'EXP-9901X',
    coords: { x: 62, y: 32 },
    lastPingSecondsAgo: 2,
    routeTrail: [
      { x: 60, y: 30 },
      { x: 61, y: 31 },
      { x: 62, y: 32 }
    ]
  },
  {
    id: 'FLEET-WGL-707',
    driverName: 'Sanjay Reddy',
    driverPhone: '+91 94401-22998',
    driverAvatar: 'SR',
    plateNumber: 'TS 03 WN 7071',
    vehicleType: 'TRUCK',
    modelName: 'Ashok Leyland BADA DOST (Freight)',
    year: 2024,
    engineStatus: 'CHARGING',
    speedKmh: 0,
    speedLimit: 50,
    headingDeg: 0,
    fuelOrBatteryPercent: 42,
    powerType: 'EV',
    rangeRemainingKm: 65,
    ecoScore: 89,
    harshBrakingEvents: 1,
    engineTempC: 34,
    odometerKm: 58900,
    currentGeofence: 'Warangal Logistics Terminal',
    currentAddress: 'Station Chowrasta Bay 2',
    destinationAddress: 'Madikonda Agro Park',
    coords: { x: 74, y: 58 },
    lastPingSecondsAgo: 1,
    routeTrail: [
      { x: 74, y: 58 }
    ]
  },
  {
    id: 'FLEET-WGL-808',
    driverName: 'Mahesh Chander',
    driverPhone: '+91 98481-99223',
    driverAvatar: 'MC',
    plateNumber: 'TS 03 AT 8089',
    vehicleType: 'AUTO',
    modelName: 'Piaggio Ape E-City FX (Smart Auto)',
    year: 2024,
    engineStatus: 'IN_TRANSIT',
    speedKmh: 31,
    speedLimit: 40,
    headingDeg: 315,
    fuelOrBatteryPercent: 74,
    powerType: 'CNG',
    rangeRemainingKm: 140,
    ecoScore: 92,
    harshBrakingEvents: 0,
    engineTempC: 43,
    odometerKm: 36500,
    currentGeofence: 'Hanamkonda Subedari Corridor',
    currentAddress: 'Subedari Court Circle Avenue',
    destinationAddress: 'Balasamudram Terminal',
    assignedOrder: 'TRP-3312W',
    coords: { x: 72, y: 46 },
    lastPingSecondsAgo: 3,
    routeTrail: [
      { x: 73, y: 48 },
      { x: 72, y: 46 }
    ]
  }
];

export const GEOFENCE_ZONES: GeofenceZone[] = [
  {
    id: 'GEO-01',
    name: 'Hitec City IT Corridor',
    category: 'TECH_SEZ',
    city: 'Hyderabad',
    polygonPoints: [{ x: 26, y: 38 }, { x: 44, y: 38 }, { x: 44, y: 54 }, { x: 26, y: 54 }],
    activeVehiclesCount: 142,
    speedLimitKmh: 50,
    status: 'OPTIMAL'
  },
  {
    id: 'GEO-02',
    name: 'Financial District SEZ',
    category: 'TECH_SEZ',
    city: 'Hyderabad',
    polygonPoints: [{ x: 14, y: 36 }, { x: 26, y: 36 }, { x: 26, y: 48 }, { x: 14, y: 48 }],
    activeVehiclesCount: 88,
    speedLimitKmh: 45,
    status: 'OPTIMAL'
  },
  {
    id: 'GEO-03',
    name: 'PVNR Airport Expressway',
    category: 'AIRPORT_CORRIDOR',
    city: 'Hyderabad',
    polygonPoints: [{ x: 50, y: 64 }, { x: 72, y: 84 }, { x: 76, y: 80 }, { x: 54, y: 60 }],
    activeVehiclesCount: 96,
    speedLimitKmh: 80,
    status: 'OPTIMAL'
  },
  {
    id: 'GEO-04',
    name: 'Warangal Tri-Cities Logistics Hub',
    category: 'LOGISTICS_HUB',
    city: 'Warangal',
    polygonPoints: [{ x: 66, y: 36 }, { x: 82, y: 36 }, { x: 82, y: 62 }, { x: 66, y: 62 }],
    activeVehiclesCount: 64,
    speedLimitKmh: 40,
    status: 'OPTIMAL'
  }
];

export const ARCHITECTURAL_FACILITIES: ArchitecturalFacility[] = [
  {
    id: 'FAC-HYD-CENTRAL',
    title: 'Hyderabad Mega EV Logistics Depot',
    category: 'LOGISTICS_DEPOT',
    location: 'Outer Ring Road Exit 19, Gachibowli Gate',
    tagline: 'High-Throughput Autonomous Sorting & Fleet Fast-Charging Hub',
    activeUnitsCount: 48,
    throughputPerHour: 320,
    avgTurnaroundMin: 6.4,
    evChargingCapacityKw: 1200,
    solarEfficiencyPercent: 88,
    bays: [
      { id: 'BAY-1', bayNumber: 'Bay 01', bayType: 'EV_FAST_CHARGER', status: 'OCCUPIED', occupiedVehicleId: 'FLEET-HYD-101', occupiedVehicleModel: 'Tata Tigor EV', progressPercent: 82, etaCompletionMin: 8 },
      { id: 'BAY-2', bayNumber: 'Bay 02', bayType: 'EV_FAST_CHARGER', status: 'AVAILABLE', progressPercent: 0, etaCompletionMin: 0 },
      { id: 'BAY-3', bayNumber: 'Bay 03', bayType: 'CARGO_LOADING_DOCK', status: 'OCCUPIED', occupiedVehicleId: 'FLEET-HYD-404', occupiedVehicleModel: 'Tata Ace EV 1.5T', progressPercent: 65, etaCompletionMin: 12 },
      { id: 'BAY-4', bayNumber: 'Bay 04', bayType: 'CARGO_LOADING_DOCK', status: 'RESERVED', progressPercent: 0, etaCompletionMin: 5 },
      { id: 'BAY-5', bayNumber: 'Bay 05', bayType: 'RAPID_DISPATCH_STAGING', status: 'OCCUPIED', occupiedVehicleId: 'FLEET-HYD-303', occupiedVehicleModel: 'Ather 450X Moto', progressPercent: 95, etaCompletionMin: 2 },
      { id: 'BAY-6', bayNumber: 'Bay 06', bayType: 'FLEET_MAINTENANCE', status: 'OCCUPIED', occupiedVehicleId: 'FLEET-HYD-202', occupiedVehicleModel: 'Bajaj RE Electric', progressPercent: 40, etaCompletionMin: 24 }
    ]
  },
  {
    id: 'FAC-STREET-SMART',
    title: 'Multimodal Urban Street Corridor',
    category: 'URBAN_STREET',
    location: 'Jubilee Hills Road No. 36 Arterial Smartway',
    tagline: 'Virtual Concept Cross-Section: Dedicated BRT, Micro-Mobility & Ride-Hail Bays',
    activeUnitsCount: 76,
    throughputPerHour: 580,
    avgTurnaroundMin: 2.1,
    evChargingCapacityKw: 480,
    solarEfficiencyPercent: 92,
    bays: [
      { id: 'BAY-S1', bayNumber: 'Curbside 1A', bayType: 'RAPID_DISPATCH_STAGING', status: 'OCCUPIED', occupiedVehicleId: 'FLEET-HYD-505', occupiedVehicleModel: 'MG ZS EV Prime', progressPercent: 90, etaCompletionMin: 1 },
      { id: 'BAY-S2', bayNumber: 'Curbside 1B', bayType: 'RAPID_DISPATCH_STAGING', status: 'AVAILABLE', progressPercent: 0, etaCompletionMin: 0 },
      { id: 'BAY-S3', bayNumber: 'Curbside 2A', bayType: 'EV_FAST_CHARGER', status: 'OCCUPIED', occupiedVehicleId: 'FLEET-HYD-606', occupiedVehicleModel: 'Mahindra Zor Grand', progressPercent: 75, etaCompletionMin: 10 },
      { id: 'BAY-S4', bayNumber: 'Curbside 2B', bayType: 'CARGO_LOADING_DOCK', status: 'AVAILABLE', progressPercent: 0, etaCompletionMin: 0 }
    ]
  },
  {
    id: 'FAC-WGL-TERMINAL',
    title: 'Warangal Intermodal Shipping & Rail Terminal',
    category: 'SHIPPING_HUB',
    location: 'Kazipet - Warangal Freight Corridor Hub',
    tagline: 'Cross-Docking Depot for Agro-Logistics, E-Commerce & Intercity Transit',
    activeUnitsCount: 32,
    throughputPerHour: 190,
    avgTurnaroundMin: 9.8,
    evChargingCapacityKw: 750,
    solarEfficiencyPercent: 84,
    bays: [
      { id: 'BAY-W1', bayNumber: 'Freight Dock 1', bayType: 'CARGO_LOADING_DOCK', status: 'OCCUPIED', occupiedVehicleId: 'FLEET-WGL-707', occupiedVehicleModel: 'Ashok Leyland BADA DOST', progressPercent: 50, etaCompletionMin: 18 },
      { id: 'BAY-W2', bayNumber: 'Freight Dock 2', bayType: 'CARGO_LOADING_DOCK', status: 'AVAILABLE', progressPercent: 0, etaCompletionMin: 0 },
      { id: 'BAY-W3', bayNumber: 'Staging Lane A', bayType: 'RAPID_DISPATCH_STAGING', status: 'OCCUPIED', occupiedVehicleId: 'FLEET-WGL-808', occupiedVehicleModel: 'Piaggio Ape E-City', progressPercent: 88, etaCompletionMin: 4 },
      { id: 'BAY-W4', bayNumber: 'Depot Charger 1', bayType: 'EV_FAST_CHARGER', status: 'AVAILABLE', progressPercent: 0, etaCompletionMin: 0 }
    ]
  }
];
