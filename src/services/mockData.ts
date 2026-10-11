import { Driver, LocationItem, VehicleTier, CarpoolRoute, OutstationPackage, HeatmapDemandPoint } from '../types';

export const VEHICLE_OPTIONS: VehicleTier[] = [
  { 
    id: "BIKE", 
    name: "Bike Moto", 
    capacity: "1 person", 
    baseFare: 0, 
    perKm: 8.0, 
    etaMin: 2, 
    icon: "🏍️",
    badge: "Fastest",
    description: "Beat the traffic quickly & economically"
  },
  { 
    id: "AUTO", 
    name: "Auto 3W", 
    capacity: "3 persons", 
    baseFare: 0, 
    perKm: 8.0, 
    etaMin: 4, 
    icon: "🛺",
    badge: "Popular",
    description: "Affordable shared city commute"
  },
  { 
    id: "CAB", 
    name: "Cab Prime", 
    capacity: "4 persons", 
    baseFare: 0, 
    perKm: 8.0, 
    etaMin: 6, 
    icon: "🚕",
    badge: "Comfort",
    description: "Air-conditioned sedans with top rated captains"
  },
  { 
    id: "PREMIUM", 
    name: "Zaldi XL", 
    capacity: "6 persons", 
    baseFare: 0, 
    perKm: 8.0, 
    etaMin: 9, 
    icon: "🚙",
    badge: "Spacious",
    description: "Spacious SUVs for family & luggage"
  },
  { 
    id: "TRUCK", 
    name: "Mini Truck", 
    capacity: "Max 750 kg", 
    baseFare: 0, 
    perKm: 8.0, 
    etaMin: 14, 
    icon: "🚚",
    badge: "Cargo",
    description: "Commercial logistics & heavy goods moving"
  }
];

export const MOCK_LOCATIONS: LocationItem[] = [
  { id: "loc-1", name: "Hitec City Metro Station", area: "Madhapur, Hyderabad", type: "office", lat: 17.4504, lng: 78.3811 },
  { id: "loc-2", name: "RGIA International Airport", area: "Shamshabad", type: "airport", lat: 17.2403, lng: 78.4294 },
  { id: "loc-3", name: "SLN Terminus", area: "Gachibowli, Hyderabad", type: "office", lat: 17.4568, lng: 78.3644 },
  { id: "loc-4", name: "Warangal Railway Station", area: "Kazipet Junction", type: "station", lat: 17.9689, lng: 79.5941 },
  { id: "loc-5", name: "Hanamkonda Bus Station", area: "Subedari, Warangal", type: "station", lat: 18.0073, lng: 79.5593 },
  { id: "loc-6", name: "Lashkar Bazaar Center", area: "Hanamkonda, Warangal", type: "popular", lat: 18.0012, lng: 79.5678 },
  { id: "loc-7", name: "Mindspace IT Park", area: "Madhapur, Hyderabad", type: "office", lat: 17.4435, lng: 78.3772 },
  { id: "loc-8", name: "Secunderabad Junction", area: "Station Road, Secunderabad", type: "station", lat: 17.4334, lng: 78.5015 },
  { id: "loc-9", name: "Inorbit Mall", area: "Cyberabad, Durgam Cheruvu", type: "popular", lat: 17.4345, lng: 78.3866 },
  { id: "loc-10", name: "Banjara Hills Road No. 1", area: "Near GVK One, Hyderabad", type: "popular", lat: 17.4239, lng: 78.4482 }
];

export const INITIAL_DRIVERS: Driver[] = [
  {
    id: "cap-ravi-001",
    name: "Ravi Kumar",
    phone: "+91 98480-12345",
    vehicle: "Bike Moto",
    vehicleModel: "Hero Splendor iSmart (Blue)",
    plate: "TS 09 AB 1234",
    rating: 4.92,
    totalTrips: 1840,
    isOnline: true,
    avatarSeed: "RaviKumarCaptain",
    lat: 17.449,
    lng: 78.379,
    earningsToday: 1350
  },
  {
    id: "cap-vikram-002",
    name: "Vikram Singh",
    phone: "+91 98765-43210",
    vehicle: "Auto 3W",
    vehicleModel: "Bajaj RE Compact (Yellow/Green)",
    plate: "TS 08 TC 4920",
    rating: 4.88,
    totalTrips: 2410,
    isOnline: true,
    avatarSeed: "VikramSinghCaptain",
    lat: 17.453,
    lng: 78.375,
    earningsToday: 1680
  },
  {
    id: "cap-priya-003",
    name: "Priya Sharma",
    phone: "+91 94401-88992",
    vehicle: "Cab Prime",
    vehicleModel: "Maruti Suzuki Dzire (White)",
    plate: "TS 07 EA 9988",
    rating: 4.97,
    totalTrips: 3120,
    isOnline: true,
    avatarSeed: "PriyaSharmaCaptain",
    lat: 17.446,
    lng: 78.384,
    earningsToday: 2420
  },
  {
    id: "cap-suresh-004",
    name: "Suresh Babu",
    phone: "+91 98492-55441",
    vehicle: "Mini Truck",
    vehicleModel: "Tata Ace Gold (White)",
    plate: "TS 03 LM 7711",
    rating: 4.85,
    totalTrips: 940,
    isOnline: false,
    avatarSeed: "SureshBabuCaptain",
    lat: 17.441,
    lng: 78.371,
    earningsToday: 950
  }
];

export const MOCK_CARPOOLS: CarpoolRoute[] = [
  {
    id: "pool-1",
    from: "Hanamkonda Collectorate",
    to: "Mindspace IT Park, Hitec City",
    departureTime: "Today at 05:30 PM",
    driverName: "Kiran Reddy",
    vehicle: "Hyundai Creta • TS 09 CD 4422",
    availableSeats: 2,
    totalSeats: 4,
    pricePerSeat: 320,
    verifiedDriver: true
  },
  {
    id: "pool-2",
    from: "Gachibowli ORR Circle",
    to: "Secunderabad Railway Station",
    departureTime: "Today at 06:15 PM",
    driverName: "Ananya Roy",
    vehicle: "Honda City • TS 08 XY 8890",
    availableSeats: 3,
    totalSeats: 4,
    pricePerSeat: 150,
    verifiedDriver: true
  },
  {
    id: "pool-3",
    from: "Warangal Bus Stand",
    to: "RGIA Airport, Shamshabad",
    departureTime: "Tomorrow at 07:00 AM",
    driverName: "Mahesh Goud",
    vehicle: "Toyota Innova • TS 03 AB 9912",
    availableSeats: 4,
    totalSeats: 6,
    pricePerSeat: 450,
    verifiedDriver: true
  }
];

export const OUTSTATION_PACKAGES: OutstationPackage[] = [
  {
    id: "pkg-1",
    title: "Self-Drive Rental",
    type: "RENTAL",
    category: "Car",
    pricing: "From ₹1,299 / 24 hrs",
    tag: "Unlimited Freedom",
    features: ["Zero Security Deposit option", "Comprehensive insurance covered", "Doorstep pickup or delivery", "Cleaned & sanitized vehicles"]
  },
  {
    id: "pkg-2",
    title: "Chauffeur Driven Intercity",
    type: "VEHICLE_DRIVER",
    category: "Car",
    pricing: "From ₹14 / km",
    tag: "Stress-free Travel",
    features: ["Verified highway expert drivers", "AC sedans & SUVs", "Toll & fuel transparent pricing", "One-way or Round-trip bookings"]
  },
  {
    id: "pkg-3",
    title: "Private Driver on Demand",
    type: "DRIVER_ONLY",
    category: "Car",
    pricing: "From ₹699 / 8 hrs",
    tag: "Your Car, Our Captain",
    features: ["Professional licensed drivers", "Ideal for long trips & weddings", "Background verified captains", "Night driving certified"]
  },
  {
    id: "pkg-4",
    title: "Luxury Minibus / Tempo",
    type: "VEHICLE_DRIVER",
    category: "Bus",
    pricing: "From ₹26 / km",
    tag: "Group Pilgrimage & Tours",
    features: ["12 to 26 Seater options", "Pushback recliner seats", "Music system & charging ports", "Luggage carrier included"]
  }
];

export const PAST_RIDES_MOCK = [
  {
    id: "TRP-8F29A1",
    pickup: "Warangal Railway Station",
    drop: "Lashkar Bazaar Center, Hanamkonda",
    date: "Yesterday, 8:45 PM",
    fare: 115,
    vehicleTier: "Auto 3W",
    driverName: "Vikram Singh",
    status: "Completed",
    rating: 5
  },
  {
    id: "TRP-4E11C9",
    pickup: "SLN Terminus, Gachibowli",
    drop: "RGIA Airport, Shamshabad",
    date: "03 Oct 2026, 11:20 AM",
    fare: 620,
    vehicleTier: "Cab Prime",
    driverName: "Priya Sharma",
    status: "Completed",
    rating: 5
  },
  {
    id: "TRP-3A00B7",
    pickup: "Hitec City Metro Station",
    drop: "Mindspace IT Park",
    date: "01 Oct 2026, 06:10 PM",
    fare: 45,
    vehicleTier: "Bike Moto",
    driverName: "Ravi Kumar",
    status: "Completed",
    rating: 4
  }
];

export const HEATMAP_INITIAL_POINTS: HeatmapDemandPoint[] = [
  // Hyderabad Clusters
  {
    id: "hm-hyd-1",
    name: "Madhapur & Mindspace",
    area: "Hitec City / Madhapur",
    city: "Hyderabad",
    x: 28,
    y: 42,
    intensity: 0.94,
    activeRequests: 168,
    surgeMultiplier: 1.8,
    captainsNearby: 22,
    avgWaitMin: 2.8,
    lastPingTime: "Just now",
    category: "office"
  },
  {
    id: "hm-hyd-2",
    name: "Financial District & SLN Terminus",
    area: "Gachibowli / Nanakramguda",
    city: "Hyderabad",
    x: 20,
    y: 49,
    intensity: 0.82,
    activeRequests: 114,
    surgeMultiplier: 1.5,
    captainsNearby: 18,
    avgWaitMin: 3.4,
    lastPingTime: "Just now",
    category: "office"
  },
  {
    id: "hm-hyd-3",
    name: "RGIA International Airport",
    area: "Shamshabad Terminal 1",
    city: "Hyderabad",
    x: 32,
    y: 84,
    intensity: 0.88,
    activeRequests: 142,
    surgeMultiplier: 1.6,
    captainsNearby: 35,
    avgWaitMin: 4.1,
    lastPingTime: "Just now",
    category: "airport"
  },
  {
    id: "hm-hyd-4",
    name: "Inorbit Mall & Knowledge City",
    area: "Durgam Cheruvu Road",
    city: "Hyderabad",
    x: 33,
    y: 45,
    intensity: 0.76,
    activeRequests: 89,
    surgeMultiplier: 1.3,
    captainsNearby: 19,
    avgWaitMin: 3.0,
    lastPingTime: "1m ago",
    category: "commercial"
  },
  {
    id: "hm-hyd-5",
    name: "Jubilee Hills Checkpost",
    area: "Road No. 36 / 45",
    city: "Hyderabad",
    x: 36,
    y: 38,
    intensity: 0.78,
    activeRequests: 95,
    surgeMultiplier: 1.4,
    captainsNearby: 16,
    avgWaitMin: 3.2,
    lastPingTime: "Just now",
    category: "commercial"
  },
  {
    id: "hm-hyd-6",
    name: "Banjara Hills & Care Hospital",
    area: "Road No. 1 / 12, Hyderabad",
    city: "Hyderabad",
    x: 42,
    y: 40,
    intensity: 0.69,
    activeRequests: 78,
    surgeMultiplier: 1.2,
    captainsNearby: 21,
    avgWaitMin: 3.6,
    lastPingTime: "2m ago",
    category: "commercial"
  },
  {
    id: "hm-hyd-7",
    name: "Secunderabad Junction",
    area: "Railway Station Complex",
    city: "Hyderabad",
    x: 52,
    y: 28,
    intensity: 0.85,
    activeRequests: 135,
    surgeMultiplier: 1.5,
    captainsNearby: 28,
    avgWaitMin: 2.9,
    lastPingTime: "Just now",
    category: "station"
  },
  {
    id: "hm-hyd-8",
    name: "Charminar & Laad Bazaar",
    area: "Old City Heritage Hub",
    city: "Hyderabad",
    x: 46,
    y: 56,
    intensity: 0.72,
    activeRequests: 82,
    surgeMultiplier: 1.3,
    captainsNearby: 15,
    avgWaitMin: 4.0,
    lastPingTime: "3m ago",
    category: "commercial"
  },

  // Warangal Clusters
  {
    id: "hm-wgl-1",
    name: "Warangal Railway Station",
    area: "Kazipet-Warangal Corridor",
    city: "Warangal",
    x: 74,
    y: 54,
    intensity: 0.91,
    activeRequests: 126,
    surgeMultiplier: 1.6,
    captainsNearby: 14,
    avgWaitMin: 3.1,
    lastPingTime: "Just now",
    category: "station"
  },
  {
    id: "hm-wgl-2",
    name: "Hanamkonda Bus Station",
    area: "Subedari / Balasamudram",
    city: "Warangal",
    x: 69,
    y: 35,
    intensity: 0.84,
    activeRequests: 98,
    surgeMultiplier: 1.4,
    captainsNearby: 17,
    avgWaitMin: 2.7,
    lastPingTime: "Just now",
    category: "station"
  },
  {
    id: "hm-wgl-3",
    name: "Lashkar Bazaar Center",
    area: "Lashkar Bazaar, Hanamkonda",
    city: "Warangal",
    x: 78,
    y: 38,
    intensity: 0.77,
    activeRequests: 74,
    surgeMultiplier: 1.3,
    captainsNearby: 12,
    avgWaitMin: 3.5,
    lastPingTime: "1m ago",
    category: "commercial"
  },
  {
    id: "hm-wgl-4",
    name: "Kazipet Railway Junction",
    area: "Diesel Colony / Stn Road",
    city: "Warangal",
    x: 64,
    y: 44,
    intensity: 0.86,
    activeRequests: 104,
    surgeMultiplier: 1.5,
    captainsNearby: 15,
    avgWaitMin: 3.0,
    lastPingTime: "Just now",
    category: "station"
  },
  {
    id: "hm-wgl-5",
    name: "Kakatiya University Campus",
    area: "KU Cross Roads, Hanamkonda",
    city: "Warangal",
    x: 67,
    y: 22,
    intensity: 0.70,
    activeRequests: 62,
    surgeMultiplier: 1.2,
    captainsNearby: 10,
    avgWaitMin: 4.2,
    lastPingTime: "2m ago",
    category: "university"
  },
  {
    id: "hm-wgl-6",
    name: "MGM Hospital & Collectorate",
    area: "Nakkalagutta, Hanamkonda",
    city: "Warangal",
    x: 72,
    y: 41,
    intensity: 0.73,
    activeRequests: 68,
    surgeMultiplier: 1.3,
    captainsNearby: 11,
    avgWaitMin: 3.8,
    lastPingTime: "Just now",
    category: "office"
  },
  {
    id: "hm-wgl-7",
    name: "Bhadrakali Temple Promenade",
    area: "Bhadrakali Lake Bund",
    city: "Warangal",
    x: 76,
    y: 31,
    intensity: 0.64,
    activeRequests: 48,
    surgeMultiplier: 1.1,
    captainsNearby: 9,
    avgWaitMin: 4.5,
    lastPingTime: "4m ago",
    category: "commercial"
  }
];

