import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  MapPin, X, Clock, Phone, MessageSquare, 
  ShieldCheck, Star, CheckCircle, Check, ChevronRight, Wallet, 
  Settings, HelpCircle, Shield, LogOut, Tag, ArrowRight,
  Share2, Users, Sparkles, Navigation, Calendar, Box,
  Package, User, Briefcase, Laptop, AlertTriangle, Scale,
  Info, Plus, Minus, AlertCircle, ChevronDown, ChevronUp
} from 'lucide-react';
import { 
  CustomerTab, BookingStatus, Driver, RideOrder, VehicleTier, ServiceMode 
} from '../types';
import { 
  VEHICLE_OPTIONS, MOCK_LOCATIONS, MOCK_CARPOOLS, 
  OUTSTATION_PACKAGES, PAST_RIDES_MOCK, INITIAL_DRIVERS 
} from '../services/mockData';
import { generateActualRoadRoute } from '../services/routeService';
import { InteractiveMap } from './InteractiveMap';
import { ChatModal, CallModal, WalletModal, SafetyModal } from './Modals';
import { sounds } from '../services/audio';
import { Vehicle3dIcon } from './Vehicle3dIcon';
import { Vehicle5dIcon, getVehicleTheme } from './Vehicle5dIcon';
import { LocationPinType } from './Boy3dPin';
import { CarpoolSection, AvailableCarpoolDriver, AVAILABLE_CARPOOL_DRIVERS } from './CarpoolSection';
import { 
  DEFAULT_GPS_COORDS, 
  DEFAULT_GPS_ADDRESS, 
  reverseGeocodeRealWorldAddress 
} from '../services/geocodingService';
import { tripChatBroadcaster } from '../services/tripChatService';

// Parcel Specifications across all vehicle tiers
const VEHICLE_PARCEL_SPECS: Record<string, { maxWeight: number; types: { label: string; icon: string }[] }> = {
  BIKE: {
    maxWeight: 20,
    types: [
      { label: 'Documents & Envelopes', icon: '📄' },
      { label: 'Food & Groceries', icon: '🍱' },
      { label: 'Clothes & Small Box', icon: '👕' },
      { label: 'Electronics & Gadgets', icon: '📱' },
      { label: 'Medicines & Urgent Items', icon: '💊' },
      { label: 'Small Box / Gift Parcel', icon: '📦' }
    ]
  },
  AUTO: {
    maxWeight: 100,
    types: [
      { label: 'Cartons & Medium Boxes', icon: '📦' },
      { label: 'Home Appliances & TV', icon: '📺' },
      { label: 'Catering & Bulk Food', icon: '🍲' },
      { label: 'Retail & Commercial Stock', icon: '🛍️' },
      { label: 'Tools & Hardware', icon: '🧰' },
      { label: 'Bulk Freight (up to 100kg)', icon: '📦' }
    ]
  },
  TRUCK: {
    maxWeight: 750,
    types: [
      { label: 'Commercial Cargo & Freight', icon: '🚛' },
      { label: 'Pallets & Warehouse Stock', icon: '📦' },
      { label: 'Home Furniture & Relocation', icon: '🛋️' },
      { label: 'Industrial Hardware & Tools', icon: '⚙️' },
      { label: 'Construction Materials', icon: '🧱' },
      { label: 'Mini Truck Full Load (up to 750kg)', icon: '🚚' }
    ]
  }
};

const VEHICLE_MAX_SEATS: Record<string, { max: number; label: string }> = {
  BIKE: { max: 1, label: '1 Rider allowed (Bike Solo)' },
  AUTO: { max: 3, label: 'Max 3 Seats' },
  CAB: { max: 4, label: 'Max 4 Seats' },
  PREMIUM: { max: 6, label: 'Max 6 Seats' },
  TRUCK: { max: 2, label: 'Max 2 Seats' }
};

interface CustomerAppProps {
  activeDriver: Driver;
  orders: RideOrder[];
  onNewOrder: (order: RideOrder) => void;
  onUpdateOrder: (orderId: string, updates: Partial<RideOrder>) => void;
  onSendMessage?: (orderId: string, sender: 'PASSENGER' | 'DRIVER', text: string) => void;
  onSwitchToCaptain?: () => void;
}

export const CustomerApp: React.FC<CustomerAppProps> = ({
  activeDriver,
  orders,
  onNewOrder,
  onUpdateOrder,
  onSendMessage,
  onSwitchToCaptain
}) => {
  // Navigation & UI state
  const [customerTab, setCustomerTab] = useState<CustomerTab>('BOOKING');
  const [isNightMode, setIsNightMode] = useState(false);
  const [activeInput, setActiveInput] = useState<'pickup' | 'drop' | null>(null);
  const [locationPinType, setLocationPinType] = useState<LocationPinType>('character_pin');

  // Booking fields
  const [pickup, setPickup] = useState('');
  const [drop, setDrop] = useState('');
  const [distanceKm, setDistanceKm] = useState<number>(0);
  const [selectedVehicleId, setSelectedVehicleId] = useState<string>('AUTO');
  const [promoCode, setPromoCode] = useState('');
  const [discountAmount, setDiscountAmount] = useState(0);
  const [promoMessage, setPromoMessage] = useState<string | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<'WALLET' | 'UPI' | 'CASH'>('WALLET');

  // Service Mode for all vehicles ('PERSON' | 'PARCEL')
  const [serviceModes, setServiceModes] = useState<Record<string, ServiceMode>>({
    BIKE: 'PERSON',
    AUTO: 'PERSON',
    CAB: 'PERSON',
    PREMIUM: 'PERSON',
    TRUCK: 'PARCEL'
  });

  // Parcel details per vehicle
  const [parcelTypes, setParcelTypes] = useState<Record<string, string>>({
    BIKE: 'Documents & Envelopes',
    AUTO: 'Cartons & Medium Boxes',
    TRUCK: 'Commercial Cargo & Freight'
  });
  const [isParcelDropdownOpen, setIsParcelDropdownOpen] = useState(false);
  const [customParcelInput, setCustomParcelInput] = useState('');

  const [parcelWeights, setParcelWeights] = useState<Record<string, number>>({
    BIKE: 5,
    AUTO: 25,
    TRUCK: 200
  });

  // Person Mode Passengers per vehicle (+ increases only one, - decreases only one)
  const [passengersByVehicle, setPassengersByVehicle] = useState<Record<string, number>>({
    BIKE: 1,
    AUTO: 1,
    CAB: 1,
    PREMIUM: 1,
    TRUCK: 1
  });

  // Wallet Balance
  const [walletBalance, setWalletBalance] = useState(480);
  const [isWalletOpen, setIsWalletOpen] = useState(false);

  // Search autocomplete
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState<typeof MOCK_LOCATIONS>([]);
  const dropInputRef = useRef<HTMLInputElement>(null);
  const drawerScrollRef = useRef<HTMLDivElement>(null);

  // Active ride tracking
  const activeOrder = orders.find(o => 
    [
      'FINDING_DRIVER', 'DRIVER_ASSIGNED', 'DRIVER_COMING', 'DRIVER_ARRIVED', 
      'TRIP_STARTED', 'TRIP_COMPLETED',
      'SEARCHING', 'MATCHED', 'ARRIVING', 'IN_PROGRESS'
    ].includes(o.status)
  ) || null;

  const unreadCaptainMessages = (activeOrder?.messages || []).filter(
    m => m.sender === 'DRIVER' && !m.readByPassenger
  ).length;
  const latestMessage = activeOrder?.messages && activeOrder.messages.length > 0 
    ? activeOrder.messages[activeOrder.messages.length - 1] 
    : null;

  // Rating state for completed ride
  const [selectedRating, setSelectedRating] = useState(5);
  const [driverTip, setDriverTip] = useState<number>(0);
  const [selectedCompliments, setSelectedCompliments] = useState<string[]>(['Polite Driver', 'Clean Vehicle']);

  // Modals
  const [showChat, setShowChat] = useState(false);
  const [showCall, setShowCall] = useState(false);
  const [showSafety, setShowSafety] = useState(false);

  // Outstation selected booking modal state
  const [selectedOutstationPkg, setSelectedOutstationPkg] = useState<string | null>(null);
  const [outstationDays, setOutstationDays] = useState(2);

  // Carpool booked state
  const [joinedPoolId, setJoinedPoolId] = useState<string | null>(null);
  const [activeCarpoolDriver, setActiveCarpoolDriver] = useState<AvailableCarpoolDriver | null>(AVAILABLE_CARPOOL_DRIVERS[0]);
  const [activeCarpoolDriverPos, setActiveCarpoolDriverPos] = useState<{ x: number; y: number; headingDeg: number } | null>(null);
  const [isCarpoolMapFocused, setIsCarpoolMapFocused] = useState<boolean>(false);

  // Fixed Location Pin for Pickup Collection State (Screen-fixed pin, map moves underneath)
  const [showFixedPin, setShowFixedPin] = useState(true);
  const [fixedPinPos, setFixedPinPos] = useState(DEFAULT_GPS_COORDS);
  const [fixedPinAddress, setFixedPinAddress] = useState(DEFAULT_GPS_ADDRESS);
  const [locationToast, setLocationToast] = useState<string | null>(null);

  // Address updates automatically after the map stops
  const handleAddressResolved = (addr: string, center: { x: number; y: number }) => {
    setFixedPinAddress(addr);
    setFixedPinPos(center);
    // Automatically update the pickup search/address field
    setPickup(addr);
    if (drop) {
      recalcDistance(addr, drop);
    }
  };

  // When user taps Confirm Location, save the selected real-world address for pickup
  const handleConfirmLocation = (addr: string) => {
    sounds.playSuccess();
    setPickup(addr);
    setFixedPinAddress(addr);
    // Prompt to select drop destination if empty
    if (!drop) {
      dropInputRef.current?.focus();
    }
  };

  // Return to Device's GPS Position
  const handleUseCurrentLocation = () => {
    sounds.playTap();
    setFixedPinPos(DEFAULT_GPS_COORDS);
    setFixedPinAddress(DEFAULT_GPS_ADDRESS);
    setPickup(DEFAULT_GPS_ADDRESS);
    if (drop) {
      recalcDistance(DEFAULT_GPS_ADDRESS, drop);
    }
  };

  // Selected vehicle object
  const selectedVehicle = VEHICLE_OPTIONS.find(v => v.id === selectedVehicleId) || VEHICLE_OPTIONS[0];

  // Active Service Mode for the selected vehicle ('PERSON' or 'PARCEL')
  const currentMode: ServiceMode = useMemo(() => {
    if (selectedVehicleId === 'TRUCK') return 'PARCEL';
    if (selectedVehicleId === 'CAB' || selectedVehicleId === 'PREMIUM') return 'PERSON';
    return serviceModes[selectedVehicleId] || 'PERSON';
  }, [selectedVehicleId, serviceModes]);

  // Active Tier Configuration based on selected vehicle and mode (in all bike, auto, cab, zaldi xl, mini truck)
  const activeTierConfig = useMemo(() => {
    const isParcel = currentMode === 'PARCEL';
    const parcelSpec = VEHICLE_PARCEL_SPECS[selectedVehicleId] || VEHICLE_PARCEL_SPECS.BIKE;
    return {
      id: selectedVehicle.id,
      name: isParcel ? `${selectedVehicle.name.split(' ')[0]} Parcel` : selectedVehicle.name,
      capacity: isParcel ? `Max ${parcelSpec.maxWeight} kg` : selectedVehicle.capacity,
      baseFare: 0,
      perKm: 8.0,
      etaMin: selectedVehicle.etaMin,
      icon: isParcel ? '📦' : selectedVehicle.icon,
      badge: selectedVehicle.badge,
      description: selectedVehicle.description
    };
  }, [selectedVehicleId, currentMode, selectedVehicle]);

  // Specific Captain matching the chosen vehicle tier
  const currentDriver = useMemo<Driver>(() => {
    if (selectedVehicleId === 'BIKE') return INITIAL_DRIVERS[0]; // Ravi (Bike)
    if (selectedVehicleId === 'AUTO') return INITIAL_DRIVERS[1]; // Vikram (Auto)
    if (selectedVehicleId === 'CAB' || selectedVehicleId === 'PREMIUM') return INITIAL_DRIVERS[2]; // Priya (Cab)
    if (selectedVehicleId === 'TRUCK') return INITIAL_DRIVERS[3]; // Suresh (Truck)
    return activeDriver;
  }, [selectedVehicleId, activeDriver]);

  // Actual Road Route between Pickup and Drop
  const roadRouteInfo = useMemo(() => {
    if (!pickup || !drop) return null;
    return generateActualRoadRoute(pickup, drop);
  }, [pickup, drop]);

  // Sync road route distance - strictly 0 if either pickup or drop is empty
  useEffect(() => {
    if (pickup && drop && roadRouteInfo) {
      setDistanceKm(roadRouteInfo.totalDistanceKm);
    } else if (!pickup || !drop) {
      setDistanceKm(0);
    }
  }, [pickup, drop, roadRouteInfo]);

  // Extra luggage fee is removed for bike and auto passenger trips
  const extraLuggageFee = 0;

  // Base trip fare: in ALL bike, auto, cab, zaldi xl, mini truck: distance × per km 8!
  const baseTripFare = distanceKm > 0 
    ? Math.round(distanceKm * 8)
    : 0;

  // Raw fare
  const rawFare = baseTripFare;
  const finalCalculatedFare = Math.max(rawFare - discountAmount, distanceKm > 0 ? 10 : 0);

  // Active specs for current vehicle
  const currentParcelSpec = VEHICLE_PARCEL_SPECS[selectedVehicleId] || VEHICLE_PARCEL_SPECS.BIKE;
  const currentParcelWeight = parcelWeights[selectedVehicleId] || 1;
  const currentParcelType = parcelTypes[selectedVehicleId] || currentParcelSpec.types[0].label;
  const currentParcelItem = currentParcelSpec.types.find(t => t.label === currentParcelType) || {
    label: currentParcelType,
    icon: '📦'
  };
  const currentSeatSpec = VEHICLE_MAX_SEATS[selectedVehicleId] || VEHICLE_MAX_SEATS.BIKE;
  const currentPassengers = passengersByVehicle[selectedVehicleId] || 1;

  // Weight Limit Violations & Validation Checks for Parcels across all vehicles
  const isWeightExceeded = useMemo(() => {
    if (currentMode === 'PARCEL') {
      return currentParcelWeight > currentParcelSpec.maxWeight;
    }
    return false;
  }, [currentMode, currentParcelWeight, currentParcelSpec]);

  const weightExceededMessage = useMemo(() => {
    if (currentMode === 'PARCEL' && currentParcelWeight > currentParcelSpec.maxWeight) {
      return `${selectedVehicle.name} cannot carry parcels above ${currentParcelSpec.maxWeight} kg (Current: ${currentParcelWeight} kg).`;
    }
    return null;
  }, [currentMode, currentParcelWeight, currentParcelSpec, selectedVehicle]);

  // Autocomplete filtering
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSuggestions([]);
      return;
    }
    const q = searchQuery.toLowerCase();
    const filtered = MOCK_LOCATIONS.filter(loc => 
      loc.name.toLowerCase().includes(q) || loc.area.toLowerCase().includes(q)
    );
    setSuggestions(filtered);
  }, [searchQuery]);

  // Real-time smooth driver animation effect advancing through all driver statuses
  useEffect(() => {
    if (!activeOrder) return;

    // 1. FINDING_DRIVER -> DRIVER_ASSIGNED after 2.4s
    if (activeOrder.status === 'FINDING_DRIVER' || activeOrder.status === 'SEARCHING') {
      const timer = setTimeout(() => {
        sounds.playSuccess();
        onUpdateOrder(activeOrder.id, { status: 'DRIVER_ASSIGNED', progressPercent: 0 });
      }, 2400);
      return () => clearTimeout(timer);
    }

    // 2. DRIVER_ASSIGNED -> DRIVER_COMING after 1.6s
    if (activeOrder.status === 'DRIVER_ASSIGNED') {
      const timer = setTimeout(() => {
        sounds.playPop();
        onUpdateOrder(activeOrder.id, { status: 'DRIVER_COMING', progressPercent: 0 });
      }, 1600);
      return () => clearTimeout(timer);
    }

    // 3. DRIVER_COMING: Smooth continuous progress along Driver -> Pickup route
    if (activeOrder.status === 'DRIVER_COMING') {
      const interval = setInterval(() => {
        const next = Math.min(100, +(activeOrder.progressPercent + 2.2).toFixed(1));
        if (next >= 100) {
          clearInterval(interval);
          sounds.playAlert();
          onUpdateOrder(activeOrder.id, { status: 'DRIVER_ARRIVED', progressPercent: 100 });
        } else {
          onUpdateOrder(activeOrder.id, { progressPercent: next });
        }
      }, 120);
      return () => clearInterval(interval);
    }

    // 4. DRIVER_ARRIVED -> auto transition to TRIP_STARTED after 3.8s (or rider boarding)
    if (activeOrder.status === 'DRIVER_ARRIVED') {
      const timer = setTimeout(() => {
        sounds.playPop();
        onUpdateOrder(activeOrder.id, { status: 'TRIP_STARTED', progressPercent: 0 });
      }, 3800);
      return () => clearTimeout(timer);
    }

    // 5. TRIP_STARTED / IN_PROGRESS: Smooth continuous progress along actual road route to destination
    if (activeOrder.status === 'TRIP_STARTED' || activeOrder.status === 'IN_PROGRESS') {
      const interval = setInterval(() => {
        const next = Math.min(100, +(activeOrder.progressPercent + 1.25).toFixed(1));
        if (next >= 100) {
          clearInterval(interval);
          sounds.playSuccess();
          onUpdateOrder(activeOrder.id, { status: 'TRIP_COMPLETED', progressPercent: 100 });
        } else {
          onUpdateOrder(activeOrder.id, { progressPercent: next });
        }
      }, 130);
      return () => clearInterval(interval);
    }
  }, [activeOrder?.id, activeOrder?.status, activeOrder?.progressPercent, onUpdateOrder]);

  const handleSelectLocation = (locName: string) => {
    sounds.playPop();
    setSearchQuery('');
    setSuggestions([]);
    setDrop(locName);
    const effectivePickup = pickup || fixedPinAddress || DEFAULT_GPS_ADDRESS;
    if (!pickup) {
      setPickup(effectivePickup);
    }
    setActiveInput(null);
    recalcDistance(effectivePickup, locName);
  };

  const recalcDistance = (p: string, d: string) => {
    if (!p || !d) {
      setDistanceKm(0);
      return;
    }
    // Calculate deterministic realistic distance based on length
    const hash = (p.length * 3 + d.length * 7) % 18;
    const dist = Math.max(hash + 4, 3);
    setDistanceKm(dist);
  };

  const handleApplyPromo = () => {
    if (!promoCode.trim()) return;
    sounds.playPing();
    if (promoCode.toUpperCase() === 'ZALDI50' || promoCode.toUpperCase() === 'SAVE50') {
      setDiscountAmount(50);
      setPromoMessage('🎉 Coupon ZALDI50 applied! ₹50 OFF saved.');
    } else if (promoCode.toUpperCase() === 'FIRST') {
      setDiscountAmount(75);
      setPromoMessage('🚀 First ride special! ₹75 OFF applied.');
    } else {
      setDiscountAmount(25);
      setPromoMessage('✨ Standard promo code applied: ₹25 OFF.');
    }
  };

  // Start booking flow
  const handleConfirmBooking = () => {
    if (!pickup || !drop) return;
    sounds.playAlert();

    const rideId = "TRP-" + Math.random().toString(36).substring(2, 8).toUpperCase();
    const newRide: RideOrder = {
      id: rideId,
      customerName: "Akhil Nalla",
      customerPhone: "+91 98480-12345",
      pickup,
      drop,
      distanceKm: roadRouteInfo?.totalDistanceKm || (distanceKm > 0 ? distanceKm : 5.8),
      fare: rawFare,
      discount: discountAmount,
      finalFare: finalCalculatedFare,
      vehicleTier: `${activeTierConfig.name} • ${currentMode === 'PARCEL' ? 'Parcel' : 'Person'}`,
      vehicleIcon: currentMode === 'PARCEL' ? '📦' : activeTierConfig.icon,
      driverId: currentDriver.id,
      riderPin: String(Math.floor(1000 + Math.random() * 9000)),
      status: 'FINDING_DRIVER',
      paymentMethod,
      createdAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      progressPercent: 0,
      serviceMode: currentMode,
      parcelType: currentMode === 'PARCEL' ? currentParcelType : undefined,
      parcelWeightKg: currentMode === 'PARCEL' ? currentParcelWeight : undefined,
      luggageWeightKg: undefined,
      extraLuggageFee: 0,
      messages: [
        tripChatBroadcaster.createMessage({
          orderId: rideId,
          sender: 'DRIVER',
          senderName: `${currentDriver.name} (Captain)`,
          text: `Hello! I have accepted your ride to ${drop}. Reaching your pickup spot in ~3 mins.`
        })
      ]
    };

    onNewOrder(newRide);
  };

  const handleCancelBooking = (orderId: string) => {
    sounds.playPop();
    onUpdateOrder(orderId, { status: 'CANCELLED' });
  };

  // Sheet height calculation
  const isHomeTab = customerTab === 'BOOKING';
  const getSheetHeight = () => {
    if (customerTab === 'CARPOOL') {
      if (isCarpoolMapFocused) return '170px';
      return '80%';
    }
    if (!isHomeTab) return '80%';
    if (activeOrder) {
      if (['FINDING_DRIVER', 'SEARCHING'].includes(activeOrder.status)) return '370px';
      if (['DRIVER_ASSIGNED', 'DRIVER_COMING'].includes(activeOrder.status)) return '440px';
      if (activeOrder.status === 'DRIVER_ARRIVED') return '430px';
      if (['TRIP_STARTED', 'IN_PROGRESS', 'ARRIVING'].includes(activeOrder.status)) return '460px';
      if (['TRIP_COMPLETED', 'COMPLETED'].includes(activeOrder.status)) return '540px';
    }
    if (activeInput && suggestions.length > 0) return '75%';
    if (pickup && drop) return '74%';
    return '58%';
  };

  return (
    <div className="flex justify-center items-center w-full py-2 sm:py-6 bg-white">
      
      {/* Phone Mockup Frame */}
      <div className="relative w-full max-w-[420px] h-[870px] bg-white text-slate-900 shadow-2xl rounded-[3rem] border-[10px] border-slate-100 flex flex-col font-sans overflow-hidden ring-1 ring-slate-200">
        
        {/* Map Background Area (Top 55-60%, expands when viewing carpool route) */}
        <div className={`absolute top-0 left-0 right-0 ${customerTab === 'CARPOOL' && isCarpoolMapFocused ? 'h-[78%]' : 'h-[62%]'} z-0 overflow-hidden transition-all duration-300`}>
          <InteractiveMap
            pickup={pickup}
            drop={drop}
            status={activeOrder?.status || 'IDLE'}
            progressPercent={activeOrder?.progressPercent || 0}
            vehicleTierName={activeOrder?.vehicleTier || activeTierConfig.name}
            selectedVehicleId={selectedVehicleId}
            vehicleIcon={activeOrder?.vehicleIcon || (currentMode === 'PARCEL' ? '📦' : activeTierConfig.icon)}
            driverName={currentDriver.name}
            driverPlate={currentDriver.plate}
            isNightMode={isNightMode}
            onToggleNightMode={() => setIsNightMode(!isNightMode)}
            showFixedPin={showFixedPin && customerTab !== 'CARPOOL'}
            fixedPinAddress={fixedPinAddress}
            fixedPinPos={fixedPinPos}
            onAddressResolved={handleAddressResolved}
            onConfirmLocation={handleConfirmLocation}
            onUseCurrentLocation={handleUseCurrentLocation}
            locationPinType={locationPinType}
            onChangePinType={setLocationPinType}
            onUpdatePickup={(newAddr) => {
              setPickup(newAddr);
              setFixedPinAddress(newAddr);
              if (drop) {
                recalcDistance(newAddr, drop);
              }
              if (activeOrder) {
                onUpdateOrder(activeOrder.id, { pickup: newAddr });
              }
            }}
            carpoolRoutePolyline={customerTab === 'CARPOOL' ? activeCarpoolDriver?.routePolyline : undefined}
            carpoolStops={customerTab === 'CARPOOL' ? activeCarpoolDriver?.corridorStops : undefined}
            carpoolDriverPos={customerTab === 'CARPOOL' ? (activeCarpoolDriverPos || undefined) : undefined}
            carpoolDriverName={customerTab === 'CARPOOL' ? activeCarpoolDriver?.driverName : undefined}
            isCarpoolActive={customerTab === 'CARPOOL'}
          />

          {/* Carpool Live Map Focused Floating Bar */}
          {customerTab === 'CARPOOL' && isCarpoolMapFocused && activeCarpoolDriver && (
            <div className="absolute top-16 left-4 right-4 z-40 animate-in fade-in slide-in-from-top-2">
              <div className="bg-slate-900/95 backdrop-blur-md text-white px-3.5 py-2.5 rounded-2xl shadow-2xl border border-blue-500/50 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping flex-shrink-0" />
                  <div className="min-w-0">
                    <div className="text-[11px] font-black truncate">
                      {activeCarpoolDriver.driverName} • {activeCarpoolDriver.vehicle}
                    </div>
                    <div className="text-[10px] text-blue-300 font-semibold truncate">
                      {activeCarpoolDriver.from.split(' ')[0]} → {activeCarpoolDriver.to.split(' ')[0]}
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => {
                    sounds.playPop();
                    setIsCarpoolMapFocused(false);
                  }}
                  className="px-2.5 py-1 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-black text-[10px] flex-shrink-0 transition shadow-sm"
                >
                  Booking Details
                </button>
              </div>
            </div>
          )}

          {/* Top Brand Header Bar over Map (Unobstructed, nothing hidden behind) */}
          <div className="absolute top-4 left-0 right-0 px-5 flex justify-between items-center z-40 pointer-events-none">
            <div className="flex items-center gap-2 bg-white/95 backdrop-blur-md px-3.5 py-1.5 rounded-2xl shadow-md border border-slate-200 pointer-events-auto">
              <div className="w-6 h-6 rounded-lg bg-brand-blue flex items-center justify-center font-black text-white text-xs shadow-md">
                Z
              </div>
              <span className="text-sm font-black text-slate-900 tracking-tight">
                Zaldi <span className="text-emerald-600 text-xs font-semibold">Fast</span>
              </span>
            </div>

            <div className="flex items-center gap-2 pointer-events-auto">
              <button 
                onClick={() => setIsWalletOpen(true)}
                className="flex items-center gap-1.5 bg-white/95 backdrop-blur-md px-3 py-1.5 rounded-2xl shadow-md border border-slate-200 text-xs font-bold text-slate-800 hover:border-blue-500 transition"
              >
                <Wallet className="w-3.5 h-3.5 text-brand-blue" />
                <span>₹{walletBalance}</span>
              </button>

              <button 
                onClick={() => setShowSafety(true)}
                title="Safety Shield"
                className="p-2 bg-white/95 backdrop-blur-md rounded-2xl shadow-md border border-slate-200 text-slate-700 hover:text-emerald-600 transition"
              >
                <ShieldCheck className="w-4 h-4 text-emerald-500" />
              </button>
            </div>
          </div>

        </div>

        {/* Bottom Sheet Drawer */}
        <div 
          className={`absolute w-full bg-white rounded-t-3xl shadow-[0_-15px_40px_rgba(0,0,0,0.1)] border-t border-slate-100 transition-all duration-300 ease-in-out z-30 flex flex-col`}
          style={{ height: getSheetHeight(), bottom: '70px' }}
        >
          {/* Pull Handle */}
          <div className="w-12 h-1.5 bg-slate-200 rounded-full mx-auto mt-3 mb-2 flex-shrink-0 cursor-pointer"></div>

          <div ref={drawerScrollRef} className="flex-1 overflow-y-auto px-5 pb-6 no-scrollbar relative text-slate-900">
            
            {/* =========================================
                1. BOOKING TAB
               ========================================= */}
            {customerTab === 'BOOKING' && (
              <>
                {/* STATE A: IDLE / SELECTING ROUTE */}
                {!activeOrder && (
                  <div className="space-y-4 pt-1">
                    
                    {/* Destination Search Bar (Only Drop Location, no pickup search bar) */}
                    <div className="bg-white border-2 border-slate-200 rounded-2xl p-2.5 sm:p-3 relative shadow-xs">
                      <div className="flex items-center justify-center gap-2.5 bg-slate-50 hover:bg-slate-100/70 focus-within:bg-white focus-within:ring-2 focus-within:ring-rose-500/30 focus-within:border-rose-500 border border-slate-200/90 rounded-xl px-3.5 py-2.5 transition">
                        <div className="w-3.5 h-3.5 rounded-sm bg-rose-500 border-2 border-white shadow-xs flex-shrink-0"></div>
                        <div className="flex-1 min-w-0 flex items-center justify-center">
                          <input 
                            ref={dropInputRef}
                            type="text" 
                            value={drop}
                            onChange={(e) => {
                              setDrop(e.target.value);
                              setSearchQuery(e.target.value);
                            }}
                            onFocus={() => {
                              setActiveInput('drop');
                              setSearchQuery(drop);
                            }}
                            placeholder="Where to Next ?"
                            className="w-full text-center bg-transparent font-bold text-xs sm:text-sm outline-none text-slate-900 placeholder:text-slate-400 placeholder:font-normal placeholder:text-center"
                          />
                        </div>

                        {/* Action buttons in the Drop bar */}
                        {drop && (
                          <div className="flex items-center gap-1.5 flex-shrink-0">
                            <button 
                              type="button"
                              onClick={() => {
                                sounds.playPop();
                                setDrop('');
                                dropInputRef.current?.focus();
                              }} 
                              title="Clear Drop"
                              className="p-1 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        )}
                      </div>

                      {/* Autocomplete Dropdown */}
                      {activeInput && suggestions.length > 0 && (
                        <div className="absolute top-[102%] left-0 right-0 bg-white shadow-2xl border border-slate-200 rounded-2xl z-50 max-h-48 overflow-y-auto p-1 divide-y divide-slate-100">
                          {suggestions.map((loc) => (
                            <div 
                              key={loc.id}
                              onClick={() => handleSelectLocation(loc.name)}
                              className="flex items-center gap-3 p-2.5 hover:bg-slate-100 rounded-xl cursor-pointer transition"
                            >
                              <div className="p-1.5 rounded-lg bg-blue-50 text-brand-blue">
                                <Clock className="w-3.5 h-3.5" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="text-xs font-bold text-slate-900 truncate">{loc.name}</div>
                                <div className="text-[10px] text-slate-500 truncate">{loc.area}</div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Location Confirmation Banner Toast */}
                    {locationToast && (
                      <div className="px-3 py-1.5 bg-emerald-500/15 border border-emerald-500/30 rounded-xl flex items-center gap-2 text-emerald-600 dark:text-emerald-400 text-xs font-bold animate-in fade-in">
                        <Check className="w-3.5 h-3.5 flex-shrink-0" />
                        <span className="truncate">{locationToast}</span>
                      </div>
                    )}

                    {/* Quick Location Chips */}
                    {!pickup && !drop && (
                      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-0.5">
                        <button
                          onClick={handleUseCurrentLocation}
                          className="flex-shrink-0 px-3 py-1.5 rounded-full bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 border border-emerald-300 dark:border-emerald-800 text-[11px] font-bold text-emerald-700 dark:text-emerald-400 transition flex items-center gap-1.5"
                        >
                          <Navigation className="w-3 h-3 text-emerald-500" />
                          <span>Use Current Location</span>
                        </button>
                        {MOCK_LOCATIONS.slice(0, 4).map((loc) => (
                          <button
                            key={loc.id}
                            onClick={() => {
                              setDrop(loc.name);
                              if (pickup) recalcDistance(pickup, loc.name);
                            }}
                            className="flex-shrink-0 px-3 py-1.5 rounded-full bg-white hover:bg-slate-50 border border-slate-200 text-[11px] font-semibold text-slate-700 transition flex items-center gap-1.5 shadow-xs"
                          >
                            <MapPin className="w-3 h-3 text-brand-blue" />
                            <span>{loc.name.split(' ')[0]}</span>
                          </button>
                        ))}
                      </div>
                    )}

                    {/* Vehicle Tier Horizontal Carousel */}
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs font-bold text-slate-500">
                        <div className="flex items-center gap-2">
                          <span className="text-slate-900 dark:text-white font-black">Select Vehicle & Services</span>
                          <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 text-[10px] font-black border border-cyan-500/20">
                            <span className="w-1.5 h-1.5 rounded-full bg-cyan-500 animate-pulse"></span>
                            <span>18 Captains Active</span>
                          </span>
                        </div>
                        {Boolean(pickup && drop && distanceKm > 0) && (
                          <span className="text-slate-600 font-bold">Est. Distance: {distanceKm} km</span>
                        )}
                      </div>

                      <div className="flex gap-2.5 overflow-x-auto no-scrollbar py-1.5 px-0.5">
                        {VEHICLE_OPTIONS.map((v) => {
                          const isSelected = selectedVehicleId === v.id;

                          // Per km rate: exact distance × per km 8 in ALL vehicles (bike, auto, cab, zaldi xl, mini truck)
                          const effPerKm = 8;
                          const hasRoute = Boolean(pickup && drop && distanceKm > 0);
                          const tierFare = hasRoute 
                            ? Math.round(distanceKm * effPerKm)
                            : null;

                          return (
                            <div 
                              key={v.id}
                              onClick={() => {
                                setSelectedVehicleId(v.id);
                                sounds.playPop();
                              }}
                              className={`group flex-shrink-0 w-[112px] p-2.5 rounded-2xl border-2 flex flex-col items-center justify-center transition-all duration-300 cursor-pointer relative overflow-hidden select-none bg-white ${
                                isSelected 
                                  ? 'border-brand-blue shadow-lg scale-[1.02] ring-2 ring-blue-500/20' 
                                  : 'border-slate-200 hover:border-slate-300 hover:scale-[1.01]'
                              }`}
                              style={{
                                backgroundColor: '#ffffff',
                                boxShadow: isSelected ? '0 10px 25px -5px rgba(0, 102, 255, 0.2), 0 8px 10px -6px rgba(0, 102, 255, 0.1)' : undefined
                              }}
                            >
                              {/* 5D Holographic Badge */}
                              {v.badge && (
                                <span className="absolute -top-1 px-2 py-0.5 rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 text-[8px] font-black text-white uppercase tracking-wider shadow-sm">
                                  {v.badge}
                                </span>
                              )}
                              
                              {/* 5D Vehicle Icon Container */}
                              <div className="w-12 h-12 mb-1 flex items-center justify-center relative bg-white rounded-xl">
                                <Vehicle5dIcon 
                                  type={v.id} 
                                  size={44} 
                                  isSelected={isSelected}
                                  showAura={false}
                                />
                              </div>

                              <span className="font-black text-xs text-slate-800 text-center leading-tight tracking-tight">
                                {v.name}
                              </span>

                              {/* Capacity: Mini truck is strictly commercial cargo max 750kg */}
                              <span className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold text-center mt-0.5">
                                {v.id === 'TRUCK' ? 'Max 750 kg' : v.capacity}
                              </span>

                              {/* Price rate display: empty without price when pickup/drop not entered; NO time like 6 mins below rate */}
                              <div className="flex flex-col items-center mt-1.5 pt-1.5 border-t border-slate-100 w-full min-h-[20px] justify-center">
                                {hasRoute && tierFare !== null ? (
                                  <span className="font-black text-xs text-slate-900">
                                    ₹{tierFare}
                                  </span>
                                ) : null}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* ====================================================
                        SERVICE MODE CONTROLS (RIDE vs TRANSPORT FOR VEHICLES)
                        (Completely removed for Cab Prime & Zaldi XL)
                       ==================================================== */}
                    {selectedVehicleId !== 'CAB' && selectedVehicleId !== 'PREMIUM' && (
                      <div className="space-y-3 p-3.5 bg-white rounded-2xl border border-slate-200 shadow-xs animate-in fade-in">
                        
                        {/* Services Header & Ride (Person) vs Transport (Parcel) Segmented Controls */}
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-1.5 min-w-0">
                            <span className="text-xs font-black text-slate-900 flex items-center gap-1">
                              <Sparkles className="w-3.5 h-3.5 text-brand-blue" />
                              <span>Services:</span>
                            </span>
                          </div>

                          {selectedVehicleId === 'TRUCK' ? (
                            // For Mini Truck: strictly dedicated to Commercial Cargo / Freight
                            <div className="bg-amber-500/10 px-3 py-1.5 rounded-xl border border-amber-500/30 flex items-center gap-1.5 text-xs font-black text-amber-700 dark:text-amber-300">
                              <Package className="w-3.5 h-3.5 text-amber-500" />
                              <span>Cargo Freight & Transport (Max 750 kg)</span>
                            </div>
                          ) : (
                            // For Bike Moto and Auto 3W: Both Ride and Transport services available
                            <div className="bg-slate-100 p-0.5 rounded-xl flex items-center gap-1 border border-slate-200 flex-shrink-0">
                              <button
                                type="button"
                                onClick={() => {
                                  sounds.playPop();
                                  setServiceModes(prev => ({ ...prev, [selectedVehicleId]: 'PERSON' }));
                                }}
                                className={`py-1.5 px-3 rounded-lg text-xs font-black flex items-center gap-1.5 transition ${
                                  currentMode === 'PERSON'
                                    ? 'bg-blue-600 text-white shadow-md'
                                    : 'text-slate-600 hover:text-slate-900'
                                }`}
                              >
                                <User className="w-3.5 h-3.5" />
                                <span>Ride</span>
                              </button>

                              <button
                                type="button"
                                onClick={() => {
                                  sounds.playPop();
                                  setServiceModes(prev => ({ ...prev, [selectedVehicleId]: 'PARCEL' }));
                                }}
                                className={`py-1.5 px-3 rounded-lg text-xs font-black flex items-center gap-1.5 transition ${
                                  currentMode === 'PARCEL'
                                    ? 'bg-amber-500 text-white shadow-md'
                                    : 'text-slate-600 hover:text-slate-900'
                                }`}
                              >
                                <Package className="w-3.5 h-3.5" />
                                <span>Transport</span>
                                <span className="text-[9px] px-1 py-0.2 rounded bg-amber-400/20 text-amber-200 font-bold">
                                  Max {currentParcelSpec.maxWeight}kg
                                </span>
                              </button>
                            </div>
                          )}
                        </div>

                      {/* Transport (Parcel) Service Options for all vehicles */}
                      {currentMode === 'PARCEL' && (
                        <div className="space-y-3 pt-1 border-t border-slate-200/80 dark:border-slate-700/60">
                          {/* Type of Parcel / Cargo Dropdown Selector */}
                          <div className="space-y-1.5 relative">
                            <div className="flex items-center justify-between text-[11px] font-bold text-slate-600 dark:text-slate-300">
                              <span className="flex items-center gap-1">
                                <Package className="w-3.5 h-3.5 text-amber-500" />
                                <span>Type of Parcel / Cargo:</span>
                              </span>
                              <span className="text-[10px] text-amber-600 dark:text-amber-400 font-bold bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20">
                                {currentParcelSpec.types.length} Types
                              </span>
                            </div>

                            {/* Dropdown Container */}
                            <div className="relative">
                              {/* Dropdown Trigger Button */}
                              <button
                                type="button"
                                onClick={() => {
                                  sounds.playTap();
                                  setIsParcelDropdownOpen(!isParcelDropdownOpen);
                                }}
                                className={`w-full p-2.5 sm:p-3 rounded-2xl border-2 transition flex items-center justify-between gap-2 shadow-xs text-left ${
                                  isParcelDropdownOpen
                                    ? 'bg-amber-50/50 dark:bg-amber-950/30 border-amber-500 ring-2 ring-amber-500/20'
                                    : 'bg-slate-50 hover:bg-slate-100/90 dark:bg-slate-900/90 border-slate-200 dark:border-slate-700 hover:border-amber-400'
                                }`}
                              >
                                <div className="flex items-center gap-2.5 min-w-0">
                                  <div className="w-8 h-8 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-600 dark:text-amber-400 flex items-center justify-center text-base flex-shrink-0 shadow-2xs">
                                    {currentParcelItem.icon}
                                  </div>
                                  <div className="min-w-0">
                                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                                      <span>Parcel Type</span>
                                      <span className="w-1 h-1 rounded-full bg-amber-400"></span>
                                      <span className="text-amber-600 dark:text-amber-400">{selectedVehicle.name}</span>
                                    </div>
                                    <div className="text-xs sm:text-sm font-black text-slate-900 dark:text-white truncate">
                                      {currentParcelType}
                                    </div>
                                  </div>
                                </div>

                                <div className="flex items-center gap-2 flex-shrink-0">
                                  <span className="px-2 py-0.5 rounded-md bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 font-extrabold text-[10px] hidden xs:inline-block">
                                    {isParcelDropdownOpen ? 'Close' : 'Select'}
                                  </span>
                                  <div className="w-6 h-6 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-500">
                                    {isParcelDropdownOpen ? (
                                      <ChevronUp className="w-4 h-4 text-amber-500" />
                                    ) : (
                                      <ChevronDown className="w-4 h-4 text-slate-500" />
                                    )}
                                  </div>
                                </div>
                              </button>

                              {/* Native Select Alternative (Synchronized & accessible) */}
                              <div className="mt-1 flex items-center justify-between px-1 text-[10px] text-slate-400">
                                <span>Quick drop-down:</span>
                                <select
                                  value={currentParcelType}
                                  onChange={(e) => {
                                    sounds.playPop();
                                    setParcelTypes(prev => ({ ...prev, [selectedVehicleId]: e.target.value }));
                                    setIsParcelDropdownOpen(false);
                                  }}
                                  className="bg-transparent text-amber-600 dark:text-amber-400 font-bold outline-none cursor-pointer hover:underline text-[10px]"
                                >
                                  {currentParcelSpec.types.map(pt => (
                                    <option key={pt.label} value={pt.label} className="text-slate-900 dark:text-slate-100 bg-white dark:bg-slate-900 font-semibold">
                                      {pt.icon} {pt.label}
                                    </option>
                                  ))}
                                </select>
                              </div>

                              {/* Custom Dropdown Menu with Icons and Categories */}
                              {isParcelDropdownOpen && (
                                <div className="absolute top-[102%] left-0 right-0 bg-white dark:bg-slate-900 border-2 border-amber-500/50 rounded-2xl shadow-2xl p-1.5 z-50 max-h-56 overflow-y-auto space-y-1 animate-in fade-in zoom-in-98 divide-y divide-slate-100 dark:divide-slate-800 backdrop-blur-md">
                                  <div className="px-2.5 py-1 text-[10px] font-black uppercase tracking-wider text-slate-400 flex items-center justify-between">
                                    <span>Choose Type of Parcel</span>
                                    <span className="text-amber-600 dark:text-amber-400 font-bold">Max {currentParcelSpec.maxWeight} kg</span>
                                  </div>

                                  <div className="pt-1 space-y-1">
                                    {currentParcelSpec.types.map((pt) => {
                                      const isSelected = currentParcelType === pt.label;
                                      return (
                                        <div
                                          key={pt.label}
                                          onClick={() => {
                                            sounds.playPop();
                                            setParcelTypes(prev => ({ ...prev, [selectedVehicleId]: pt.label }));
                                            setIsParcelDropdownOpen(false);
                                          }}
                                          className={`p-2 rounded-xl flex items-center justify-between gap-2.5 cursor-pointer transition ${
                                            isSelected
                                              ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 font-black border border-amber-300/80 dark:border-amber-700/60 shadow-xs'
                                              : 'hover:bg-slate-50 dark:hover:bg-slate-800/70 text-slate-800 dark:text-slate-200 font-semibold'
                                          }`}
                                        >
                                          <div className="flex items-center gap-2.5 min-w-0">
                                            <span className="w-7 h-7 rounded-lg bg-amber-500/10 flex items-center justify-center text-sm flex-shrink-0">
                                              {pt.icon}
                                            </span>
                                            <span className="text-xs truncate">{pt.label}</span>
                                          </div>
                                          {isSelected ? (
                                            <Check className="w-4 h-4 text-amber-600 dark:text-amber-400 flex-shrink-0" />
                                          ) : (
                                            <span className="text-[10px] text-slate-400 font-medium">Select</span>
                                          )}
                                        </div>
                                      );
                                    })}
                                  </div>

                                  {/* Custom Parcel Input */}
                                  <div className="pt-2 px-1">
                                    <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-800/80 p-1 rounded-xl border border-slate-200 dark:border-slate-700">
                                      <input
                                        type="text"
                                        value={customParcelInput}
                                        onChange={(e) => setCustomParcelInput(e.target.value)}
                                        onKeyDown={(e) => {
                                          if (e.key === 'Enter' && customParcelInput.trim()) {
                                            sounds.playSuccess();
                                            setParcelTypes(prev => ({ ...prev, [selectedVehicleId]: customParcelInput.trim() }));
                                            setCustomParcelInput('');
                                            setIsParcelDropdownOpen(false);
                                          }
                                        }}
                                        placeholder="Other / Custom parcel type..."
                                        className="w-full bg-transparent px-2 text-xs text-slate-800 dark:text-white outline-none font-medium placeholder:text-slate-400"
                                      />
                                      <button
                                        type="button"
                                        disabled={!customParcelInput.trim()}
                                        onClick={() => {
                                          if (!customParcelInput.trim()) return;
                                          sounds.playSuccess();
                                          setParcelTypes(prev => ({ ...prev, [selectedVehicleId]: customParcelInput.trim() }));
                                          setCustomParcelInput('');
                                          setIsParcelDropdownOpen(false);
                                        }}
                                        className="px-2.5 py-1 rounded-lg bg-amber-500 hover:bg-amber-600 disabled:opacity-40 text-white font-black text-[10px] transition flex-shrink-0"
                                      >
                                        Set
                                      </button>
                                    </div>
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Weight Selector & Limit Validation */}
                          <div className="space-y-2 bg-white dark:bg-slate-900/90 p-3 rounded-2xl border border-slate-200 dark:border-slate-700/80">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800 dark:text-white">
                                <Scale className="w-3.5 h-3.5 text-amber-500" />
                                <span>Weight:</span>
                              </div>
                              <div className="flex items-center gap-1.5">
                                <span className="text-base font-black text-slate-900 dark:text-white">
                                  {currentParcelWeight} kg
                                </span>
                                <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                                  currentParcelWeight > currentParcelSpec.maxWeight
                                    ? 'bg-rose-500/20 text-rose-500 border border-rose-500/40 animate-pulse'
                                    : 'bg-emerald-500/20 text-emerald-500 border border-emerald-500/40'
                                }`}>
                                  Limit: Max {currentParcelSpec.maxWeight} kg
                                </span>
                              </div>
                            </div>

                            {/* Stepper (+ increase only one, - decrease only one) */}
                            <div className="flex items-center gap-2 pt-1">
                              <button
                                type="button"
                                onClick={() => {
                                  sounds.playPop();
                                  setParcelWeights(prev => ({
                                    ...prev,
                                    [selectedVehicleId]: Math.max(1, (prev[selectedVehicleId] || 1) - 1)
                                  }));
                                }}
                                disabled={currentParcelWeight <= 1}
                                className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center font-black text-slate-700 dark:text-slate-300 hover:bg-slate-200 disabled:opacity-40 disabled:cursor-not-allowed active:scale-95 transition"
                                title="Decrease only one kg (-1)"
                              >
                                <Minus className="w-3.5 h-3.5" />
                              </button>

                              <input 
                                type="range"
                                min={1}
                                max={currentParcelSpec.maxWeight}
                                step={1}
                                value={currentParcelWeight}
                                onChange={(e) => {
                                  const val = Number(e.target.value);
                                  setParcelWeights(prev => ({
                                    ...prev,
                                    [selectedVehicleId]: Math.min(currentParcelSpec.maxWeight, Math.max(1, val))
                                  }));
                                }}
                                className="flex-1 accent-amber-500 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg cursor-pointer"
                              />

                              <button
                                type="button"
                                onClick={() => {
                                  sounds.playPop();
                                  setParcelWeights(prev => ({
                                    ...prev,
                                    [selectedVehicleId]: Math.min(currentParcelSpec.maxWeight, (prev[selectedVehicleId] || 1) + 1)
                                  }));
                                }}
                                disabled={currentParcelWeight >= currentParcelSpec.maxWeight}
                                className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center font-black text-slate-700 dark:text-slate-300 hover:bg-slate-200 disabled:opacity-40 disabled:cursor-not-allowed active:scale-95 transition"
                                title="Increase only one kg (+1)"
                              >
                                <Plus className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Person mode has no baggage policy or luggage fee */}
                    </div>
                  )}

                    {/* Promo Code & Payment Summary */}
                    {pickup && drop && (
                      <div className="space-y-3 pt-1 animate-in fade-in">
                        {/* Promo Coupon Box */}
                        <div className="flex gap-2">
                          <div className="relative flex-1">
                            <Tag className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                            <input 
                              type="text"
                              value={promoCode}
                              onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
                              placeholder="Coupon (e.g. ZALDI50)"
                              className="w-full pl-8 pr-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-800 dark:text-white uppercase placeholder-slate-400 outline-none"
                            />
                          </div>
                          <button
                            onClick={handleApplyPromo}
                            className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold transition"
                          >
                            Apply
                          </button>
                        </div>
                        {promoMessage && (
                          <div className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
                            {promoMessage}
                          </div>
                        )}

                        {/* Payment Method Selector */}
                        <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs">
                          <span className="font-semibold text-slate-500">Payment:</span>
                          <div className="flex gap-1.5">
                            {(['WALLET', 'UPI', 'CASH'] as const).map(pm => (
                              <button
                                key={pm}
                                onClick={() => setPaymentMethod(pm)}
                                className={`px-2.5 py-1 rounded-lg font-bold text-[10px] transition ${
                                  paymentMethod === pm
                                    ? 'bg-brand-blue text-white shadow'
                                    : 'bg-white dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                                }`}
                              >
                                {pm === 'WALLET' ? `Wallet (₹${walletBalance})` : pm}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}

                  </div>
                )}

                {/* 1. FINDING DRIVER */}
                {activeOrder && (activeOrder.status === 'FINDING_DRIVER' || activeOrder.status === 'SEARCHING') && (
                  <div className="flex flex-col items-center justify-center py-5 text-center space-y-4 animate-in fade-in">
                    <div className="relative flex items-center justify-center w-20 h-20">
                      <div className="w-16 h-16 rounded-2xl bg-white border-2 border-brand-blue flex items-center justify-center shadow-lg">
                        <Vehicle3dIcon type={activeOrder.vehicleTier} size={46} className="filter drop-shadow-md" />
                      </div>
                    </div>
                    <div>
                      <h3 className="font-black text-lg text-slate-900 dark:text-white">Finding Driver...</h3>
                      <p className="text-xs text-slate-500 mt-0.5">Connecting with nearby available captains</p>
                    </div>
                    <div className="w-full max-w-xs bg-slate-100 dark:bg-slate-800 p-3 rounded-2xl text-xs space-y-1.5">
                      <div className="flex justify-between font-medium text-slate-500">
                        <span>Pickup:</span>
                        <span className="font-bold text-slate-800 dark:text-slate-200 truncate max-w-[170px]">{activeOrder.pickup}</span>
                      </div>
                      <div className="flex justify-between font-medium text-slate-500">
                        <span>Destination:</span>
                        <span className="font-bold text-slate-800 dark:text-slate-200 truncate max-w-[170px]">{activeOrder.drop}</span>
                      </div>
                      {activeOrder.serviceMode === 'PARCEL' && (
                        <div className="flex justify-between font-medium text-amber-600 dark:text-amber-400">
                          <span>Transport Item:</span>
                          <span className="font-bold truncate max-w-[170px]">{activeOrder.parcelType} ({activeOrder.parcelWeightKg} kg)</span>
                        </div>
                      )}
                      <div className="flex justify-between font-medium text-slate-500 pt-1 border-t border-slate-200 dark:border-slate-700">
                        <span>Estimated Fare:</span>
                        <span className="font-black text-emerald-500 text-sm">₹{activeOrder.finalFare}</span>
                      </div>
                    </div>
                    <button 
                      onClick={() => handleCancelBooking(activeOrder.id)}
                      className="text-xs font-bold text-rose-500 hover:text-rose-600 underline"
                    >
                      Cancel Search
                    </button>
                  </div>
                )}

                {/* 2. DRIVER ASSIGNED */}
                {activeOrder && activeOrder.status === 'DRIVER_ASSIGNED' && (
                  <div className="space-y-4 pt-1 animate-in fade-in">
                    <div className="flex items-center justify-between bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-300 dark:border-emerald-800 rounded-2xl p-3">
                      <div>
                        <span className="text-[10px] font-black uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                          Driver Assigned
                        </span>
                        <div className="text-xs font-bold text-slate-800 dark:text-white mt-0.5">
                          Captain matched! Preparing departure
                        </div>
                      </div>
                      <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-500 flex items-center justify-center font-black">
                        ✓
                      </div>
                    </div>

                    {/* Driver Card */}
                    <div className="flex items-center gap-3.5 p-3.5 bg-slate-50 dark:bg-slate-800/70 rounded-2xl border border-slate-200 dark:border-slate-700/80">
                      <div className="w-12 h-12 rounded-2xl bg-brand-blue/20 border-2 border-brand-blue/40 flex items-center justify-center font-black text-lg text-brand-blue flex-shrink-0">
                        {currentDriver.name.charAt(0)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <h4 className="font-black text-sm text-slate-900 dark:text-white truncate">{currentDriver.name}</h4>
                          <div className="flex items-center gap-1 text-xs font-black text-amber-500">
                            <Star className="w-3.5 h-3.5 fill-amber-500" />
                            <span>{currentDriver.rating}</span>
                          </div>
                        </div>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">{currentDriver.vehicleModel}</p>
                        <div className="inline-block mt-1 px-2 py-0.5 rounded bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 font-mono text-[10px] font-bold text-slate-800 dark:text-slate-200">
                          {currentDriver.plate}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* 3. DRIVER COMING */}
                {activeOrder && activeOrder.status === 'DRIVER_COMING' && (
                  <div className="space-y-4 pt-1 animate-in fade-in">
                    <div className="flex items-center justify-between bg-blue-50 dark:bg-blue-950/50 border border-blue-200 dark:border-blue-800/80 rounded-2xl p-3">
                      <div>
                        <span className="text-[10px] font-black uppercase tracking-wider text-brand-blue">
                          Driver Coming
                        </span>
                        <div className="text-xs font-bold text-slate-800 dark:text-white mt-0.5">
                          En route to pickup (~2 mins away)
                        </div>
                      </div>
                      <div className="text-right bg-white dark:bg-slate-900 px-3 py-1.5 rounded-xl border border-blue-200 dark:border-blue-700/60 shadow-sm">
                        <div className="text-[9px] font-extrabold uppercase text-slate-400">Rider PIN</div>
                        <div className="text-sm font-black font-mono text-brand-blue tracking-widest">{activeOrder.riderPin}</div>
                      </div>
                    </div>

                    {/* Driver Card */}
                    <div className="flex items-center gap-3.5 p-3.5 bg-slate-50 dark:bg-slate-800/70 rounded-2xl border border-slate-200 dark:border-slate-700/80">
                      <div className="w-12 h-12 rounded-2xl bg-white border border-slate-200 flex items-center justify-center flex-shrink-0 shadow-sm">
                        <Vehicle3dIcon type={activeOrder.vehicleTier || selectedVehicle.name} size={38} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <h4 className="font-black text-sm text-slate-900 dark:text-white truncate">{currentDriver.name}</h4>
                          <div className="flex items-center gap-1 text-xs font-black text-amber-500">
                            <Star className="w-3.5 h-3.5 fill-amber-500" />
                            <span>{currentDriver.rating}</span>
                          </div>
                        </div>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">{currentDriver.vehicleModel}</p>
                        <div className="inline-block mt-1 px-2 py-0.5 rounded bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 font-mono text-[10px] font-bold text-slate-800 dark:text-slate-200">
                          {currentDriver.plate}
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="grid grid-cols-3 gap-2">
                      <button onClick={() => setShowCall(true)} className="py-2.5 px-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 font-bold text-xs flex items-center justify-center gap-1.5 hover:bg-emerald-100 transition">
                        <Phone className="w-3.5 h-3.5" />
                        <span>Call</span>
                      </button>
                      <button onClick={() => setShowChat(true)} className="py-2.5 px-3 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-brand-blue dark:text-blue-400 border border-blue-200 dark:border-blue-800 font-bold text-xs flex items-center justify-center gap-1.5 hover:bg-blue-100 transition relative">
                        <MessageSquare className="w-3.5 h-3.5" />
                        <span>Chat</span>
                        {unreadCaptainMessages > 0 && (
                          <span className="px-1.5 py-0.2 rounded-full bg-blue-600 text-white font-mono text-[9px] font-black animate-pulse">
                            {unreadCaptainMessages}
                          </span>
                        )}
                      </button>
                      <button onClick={() => setShowSafety(true)} className="py-2.5 px-3 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 font-bold text-xs flex items-center justify-center gap-1.5 hover:bg-slate-200 transition">
                        <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                        <span>Safety</span>
                      </button>
                    </div>

                    {/* Cockpit In-Line Live Messaging Strip */}
                    <div 
                      onClick={() => setShowChat(true)}
                      className="p-2.5 rounded-2xl bg-blue-50/90 dark:bg-slate-850 dark:bg-slate-800/80 border border-blue-200/80 dark:border-slate-700/80 flex items-center justify-between cursor-pointer hover:bg-blue-100/60 transition shadow-xs group"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-7 h-7 rounded-xl bg-blue-600/10 text-brand-blue flex items-center justify-center flex-shrink-0 relative">
                          <MessageSquare className="w-3.5 h-3.5" />
                          {unreadCaptainMessages > 0 && (
                            <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-blue-600 animate-ping" />
                          )}
                        </div>
                        <div className="min-w-0 text-left">
                          <div className="text-[11px] font-black text-slate-800 dark:text-white flex items-center gap-1.5 truncate">
                            <span>Chat with Captain {currentDriver.name}</span>
                            {unreadCaptainMessages > 0 && (
                              <span className="px-1.5 py-0.2 rounded-full bg-blue-600 text-white text-[9px] font-bold">New</span>
                            )}
                          </div>
                          <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
                            {latestMessage 
                              ? `${latestMessage.senderName}: "${latestMessage.text}"` 
                              : 'Tap to send pickup landmarks or notes...'}
                          </p>
                        </div>
                      </div>
                      <span className="text-[10px] font-black text-brand-blue group-hover:translate-x-0.5 transition flex-shrink-0 ml-2">
                        Open →
                      </span>
                    </div>

                    {/* Approach Progress */}
                    <div className="space-y-1 bg-slate-100 dark:bg-slate-800/50 p-2.5 rounded-2xl border border-slate-200 dark:border-slate-700/60">
                      <div className="flex justify-between text-[11px] font-semibold text-slate-500">
                        <span>Captain Approach to Pickup</span>
                        <span className="font-bold text-slate-800 dark:text-white">{activeOrder.progressPercent}%</span>
                      </div>
                      <div className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                        <div className="h-full bg-brand-blue transition-all duration-300 ease-linear" style={{ width: `${activeOrder.progressPercent}%` }}></div>
                      </div>
                    </div>
                  </div>
                )}

                {/* 4. DRIVER ARRIVED */}
                {activeOrder && activeOrder.status === 'DRIVER_ARRIVED' && (
                  <div className="space-y-4 pt-1 animate-in fade-in">
                    <div className="flex items-center justify-between bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-300 dark:border-emerald-800 rounded-2xl p-3">
                      <div>
                        <span className="text-[10px] font-black uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                          Driver Arrived
                        </span>
                        <div className="text-xs font-bold text-slate-800 dark:text-white mt-0.5">
                          Captain has arrived at your pickup spot!
                        </div>
                      </div>
                      <div className="w-9 h-9 rounded-xl bg-emerald-500 text-white flex items-center justify-center text-lg shadow-md animate-bounce">
                        📍
                      </div>
                    </div>

                    {/* Prominent OTP Card */}
                    <div className="p-3.5 bg-slate-900 border border-slate-700 rounded-2xl text-center space-y-1 shadow-lg">
                      <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                        Share this PIN with Captain
                      </span>
                      <div className="text-2xl font-black font-mono tracking-widest text-emerald-400">
                        {activeOrder.riderPin}
                      </div>
                      <p className="text-[10px] text-slate-400">Trip will start as soon as OTP is shared</p>
                    </div>

                    {/* Driver Card */}
                    <div className="flex items-center gap-3.5 p-3.5 bg-slate-50 dark:bg-slate-800/70 rounded-2xl border border-slate-200 dark:border-slate-700/80">
                      <div className="w-12 h-12 rounded-2xl bg-white border border-slate-200 flex items-center justify-center flex-shrink-0 shadow-sm">
                        <Vehicle3dIcon type={activeOrder.vehicleTier || selectedVehicle.name} size={38} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <h4 className="font-black text-sm text-slate-900 dark:text-white truncate">{currentDriver.name}</h4>
                          <div className="flex items-center gap-1 text-xs font-black text-amber-500">
                            <Star className="w-3.5 h-3.5 fill-amber-500" />
                            <span>{currentDriver.rating}</span>
                          </div>
                        </div>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">{currentDriver.vehicleModel}</p>
                        <div className="inline-block mt-1 px-2 py-0.5 rounded bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 font-mono text-[10px] font-bold text-slate-800 dark:text-slate-200">
                          {currentDriver.plate}
                        </div>
                      </div>
                    </div>

                    {/* Actions in Arrived State */}
                    <div className="grid grid-cols-3 gap-2">
                      <button onClick={() => setShowCall(true)} className="py-2.5 px-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 font-bold text-xs flex items-center justify-center gap-1.5 hover:bg-emerald-100 transition">
                        <Phone className="w-3.5 h-3.5" />
                        <span>Call</span>
                      </button>
                      <button onClick={() => setShowChat(true)} className="py-2.5 px-3 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-brand-blue dark:text-blue-400 border border-blue-200 dark:border-blue-800 font-bold text-xs flex items-center justify-center gap-1.5 hover:bg-blue-100 transition relative">
                        <MessageSquare className="w-3.5 h-3.5" />
                        <span>Chat</span>
                        {unreadCaptainMessages > 0 && (
                          <span className="px-1.5 py-0.2 rounded-full bg-blue-600 text-white font-mono text-[9px] font-black animate-pulse">
                            {unreadCaptainMessages}
                          </span>
                        )}
                      </button>
                      <button onClick={() => setShowSafety(true)} className="py-2.5 px-3 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 font-bold text-xs flex items-center justify-center gap-1.5 hover:bg-slate-200 transition">
                        <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                        <span>Safety</span>
                      </button>
                    </div>

                    {/* Cockpit In-Line Live Messaging Strip */}
                    <div 
                      onClick={() => setShowChat(true)}
                      className="p-2.5 rounded-2xl bg-blue-50/90 dark:bg-slate-850 dark:bg-slate-800/80 border border-blue-200/80 dark:border-slate-700/80 flex items-center justify-between cursor-pointer hover:bg-blue-100/60 transition shadow-xs group"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-7 h-7 rounded-xl bg-blue-600/10 text-brand-blue flex items-center justify-center flex-shrink-0 relative">
                          <MessageSquare className="w-3.5 h-3.5" />
                          {unreadCaptainMessages > 0 && (
                            <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-blue-600 animate-ping" />
                          )}
                        </div>
                        <div className="min-w-0 text-left">
                          <div className="text-[11px] font-black text-slate-800 dark:text-white flex items-center gap-1.5 truncate">
                            <span>Chat with Captain {currentDriver.name}</span>
                            {unreadCaptainMessages > 0 && (
                              <span className="px-1.5 py-0.2 rounded-full bg-blue-600 text-white text-[9px] font-bold">New</span>
                            )}
                          </div>
                          <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
                            {latestMessage 
                              ? `${latestMessage.senderName}: "${latestMessage.text}"` 
                              : 'Captain waiting at pickup spot. Tap to message...'}
                          </p>
                        </div>
                      </div>
                      <span className="text-[10px] font-black text-brand-blue group-hover:translate-x-0.5 transition flex-shrink-0 ml-2">
                        Open →
                      </span>
                    </div>

                    <button
                      onClick={() => {
                        sounds.playPop();
                        onUpdateOrder(activeOrder.id, { status: 'TRIP_STARTED', progressPercent: 0 });
                      }}
                      className="w-full py-3.5 rounded-2xl bg-brand-blue hover:bg-blue-600 text-white font-black text-sm shadow-xl shadow-blue-600/30 transition flex items-center justify-center gap-2"
                    >
                      <span>Start Trip Now</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                )}

                {/* 5. TRIP STARTED */}
                {activeOrder && (activeOrder.status === 'TRIP_STARTED' || activeOrder.status === 'IN_PROGRESS' || activeOrder.status === 'ARRIVING') && (
                  <div className="space-y-4 pt-1 animate-in fade-in">
                    <div className="flex items-center justify-between bg-blue-50 dark:bg-blue-950/50 border border-blue-200 dark:border-blue-800/80 rounded-2xl p-3">
                      <div>
                        <span className="text-[10px] font-black uppercase tracking-wider text-brand-blue">
                          Trip Started
                        </span>
                        <div className="text-xs font-bold text-slate-800 dark:text-white mt-0.5">
                          En route along actual road network
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-slate-900 border border-slate-700 text-xs font-bold text-emerald-400">
                        <Navigation className="w-3 h-3 animate-spin" />
                        <span>42 km/h</span>
                      </div>
                    </div>

                    {/* Driver Card */}
                    <div className="flex items-center gap-3.5 p-3.5 bg-slate-50 dark:bg-slate-800/70 rounded-2xl border border-slate-200 dark:border-slate-700/80">
                      <div className="w-12 h-12 rounded-2xl bg-white border border-slate-200 flex items-center justify-center flex-shrink-0 shadow-sm">
                        <Vehicle3dIcon type={activeOrder.vehicleTier || selectedVehicle.name} size={38} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <h4 className="font-black text-sm text-slate-900 dark:text-white truncate">{currentDriver.name}</h4>
                          <div className="flex items-center gap-1 text-xs font-black text-amber-500">
                            <Star className="w-3.5 h-3.5 fill-amber-500" />
                            <span>{currentDriver.rating}</span>
                          </div>
                        </div>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">{currentDriver.vehicleModel}</p>
                        <div className="inline-block mt-1 px-2 py-0.5 rounded bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 font-mono text-[10px] font-bold text-slate-800 dark:text-slate-200">
                          {currentDriver.plate}
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="grid grid-cols-3 gap-2">
                      <button onClick={() => setShowCall(true)} className="py-2.5 px-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 font-bold text-xs flex items-center justify-center gap-1.5">
                        <Phone className="w-3.5 h-3.5" />
                        <span>Call</span>
                      </button>
                      <button onClick={() => setShowChat(true)} className="py-2.5 px-3 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-brand-blue dark:text-blue-400 border border-blue-200 dark:border-blue-800 font-bold text-xs flex items-center justify-center gap-1.5 relative">
                        <MessageSquare className="w-3.5 h-3.5" />
                        <span>Chat</span>
                        {unreadCaptainMessages > 0 && (
                          <span className="px-1.5 py-0.2 rounded-full bg-blue-600 text-white font-mono text-[9px] font-black animate-pulse">
                            {unreadCaptainMessages}
                          </span>
                        )}
                      </button>
                      <button onClick={() => setShowSafety(true)} className="py-2.5 px-3 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 font-bold text-xs flex items-center justify-center gap-1.5">
                        <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                        <span>Safety</span>
                      </button>
                    </div>

                    {/* Cockpit In-Line Live Messaging Strip */}
                    <div 
                      onClick={() => setShowChat(true)}
                      className="p-2.5 rounded-2xl bg-blue-50/90 dark:bg-slate-850 dark:bg-slate-800/80 border border-blue-200/80 dark:border-slate-700/80 flex items-center justify-between cursor-pointer hover:bg-blue-100/60 transition shadow-xs group"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-7 h-7 rounded-xl bg-blue-600/10 text-brand-blue flex items-center justify-center flex-shrink-0 relative">
                          <MessageSquare className="w-3.5 h-3.5" />
                          {unreadCaptainMessages > 0 && (
                            <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-blue-600 animate-ping" />
                          )}
                        </div>
                        <div className="min-w-0 text-left">
                          <div className="text-[11px] font-black text-slate-800 dark:text-white flex items-center gap-1.5 truncate">
                            <span>Chat with Captain {currentDriver.name}</span>
                            {unreadCaptainMessages > 0 && (
                              <span className="px-1.5 py-0.2 rounded-full bg-blue-600 text-white text-[9px] font-bold">New</span>
                            )}
                          </div>
                          <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
                            {latestMessage 
                              ? `${latestMessage.senderName}: "${latestMessage.text}"` 
                              : 'Tap to message captain during ride...'}
                          </p>
                        </div>
                      </div>
                      <span className="text-[10px] font-black text-brand-blue group-hover:translate-x-0.5 transition flex-shrink-0 ml-2">
                        Open →
                      </span>
                    </div>

                    {/* Road Progress Bar */}
                    <div className="space-y-1 bg-slate-100 dark:bg-slate-800/50 p-3 rounded-2xl border border-slate-200 dark:border-slate-700/60">
                      <div className="flex justify-between text-xs font-semibold text-slate-500">
                        <span>Road Route Progress</span>
                        <span className="font-bold text-slate-800 dark:text-white">{activeOrder.progressPercent}%</span>
                      </div>
                      <div className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                        <div className="h-full bg-brand-blue transition-all duration-300 ease-linear" style={{ width: `${activeOrder.progressPercent}%` }}></div>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <button 
                        onClick={() => {
                          onUpdateOrder(activeOrder.id, { status: 'TRIP_COMPLETED', progressPercent: 100 });
                          sounds.playSuccess();
                        }}
                        className="flex-1 py-2.5 rounded-xl bg-slate-900 dark:bg-slate-800 text-white text-xs font-bold hover:bg-slate-800 transition"
                      >
                        ⚡ Complete Trip Now
                      </button>
                      <button 
                        onClick={() => handleCancelBooking(activeOrder.id)}
                        className="px-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-rose-500 text-xs font-bold hover:bg-rose-50 dark:hover:bg-rose-950/30 transition"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}

                {/* STATE D: COMPLETED / PAYMENT */}
                {activeOrder && (activeOrder.status === 'COMPLETED' || activeOrder.status === 'TRIP_COMPLETED') && (
                  <div className="flex flex-col items-center justify-center py-4 space-y-4 animate-in fade-in relative">
                    {/* Close / Dismiss Popup */}
                    <button 
                      onClick={() => {
                        sounds.playPop();
                        onUpdateOrder(activeOrder.id, { status: 'COMPLETED' });
                        setPickup('');
                        setDrop('');
                        setDistanceKm(0);
                        setDiscountAmount(0);
                        setDriverTip(0);
                      }}
                      className="absolute top-1 right-1 p-1.5 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition"
                      title="Dismiss"
                    >
                      <X className="w-4 h-4" />
                    </button>

                    <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-500 border-2 border-emerald-500/40 flex items-center justify-center shadow-lg">
                      <CheckCircle className="w-9 h-9" />
                    </div>

                    <div className="text-center">
                      <h3 className="font-black text-xl text-slate-900 dark:text-white">Trip Completed!</h3>
                      <p className="text-xs text-slate-500">Hope you had a safe and smooth journey</p>
                    </div>

                    {/* Fare receipt */}
                    <div className="w-full bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 p-4 rounded-2xl text-center space-y-1">
                      <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Total Fare</span>
                      <div className="text-3xl font-black text-slate-900 dark:text-white">
                        ₹{activeOrder.finalFare + driverTip}
                      </div>
                      <div className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                        Paid via {activeOrder.paymentMethod} • Ref {activeOrder.id}
                      </div>
                      {activeOrder.serviceMode === 'PARCEL' && (
                        <div className="text-[10px] text-amber-600 dark:text-amber-400 font-bold pt-0.5">
                          📦 {activeOrder.parcelType} ({activeOrder.parcelWeightKg} kg)
                        </div>
                      )}
                    </div>

                    {/* Tip Driver Chips */}
                    <div className="w-full space-y-1.5">
                      <div className="text-xs font-bold text-slate-500">Add a tip for Captain {activeDriver.name.split(' ')[0]}</div>
                      <div className="flex gap-2">
                        {[0, 20, 50, 100].map(tip => (
                          <button
                            key={tip}
                            onClick={() => {
                              setDriverTip(tip);
                              sounds.playPop();
                            }}
                            className={`flex-1 py-1.5 rounded-xl text-xs font-bold border transition ${
                              driverTip === tip 
                                ? 'bg-brand-blue text-white border-brand-blue'
                                : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                            }`}
                          >
                            {tip === 0 ? 'No tip' : `+₹${tip}`}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Star Rating */}
                    <div className="flex gap-2 py-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          onClick={() => {
                            setSelectedRating(star);
                            sounds.playPop();
                          }}
                          className="p-1 transition hover:scale-110 active:scale-95"
                        >
                          <Star className={`w-6 h-6 ${
                            star <= selectedRating 
                              ? 'text-amber-400 fill-amber-400' 
                              : 'text-slate-300 dark:text-slate-700'
                          }`} />
                        </button>
                      ))}
                    </div>

                    <button 
                      onClick={() => {
                        sounds.playSuccess();
                        onUpdateOrder(activeOrder.id, { status: 'COMPLETED' });
                        setPickup('');
                        setDrop('');
                        setDistanceKm(0);
                        setDiscountAmount(0);
                        setDriverTip(0);
                      }}
                      className="w-full py-3.5 rounded-xl bg-brand-blue hover:bg-blue-600 text-white font-black text-sm shadow-xl shadow-blue-600/30 transition"
                    >
                      Done & Book Next Ride
                    </button>
                  </div>
                )}
              </>
            )}

            {/* =========================================
                2. CARPOOL TAB
               ========================================= */}
            {customerTab === 'CARPOOL' && (
              <CarpoolSection
                currentAddress={pickup || fixedPinAddress}
                walletBalance={walletBalance}
                onDeductFare={(amt) => setWalletBalance(prev => Math.max(0, prev - amt))}
                onDriverChange={(driver, pos) => {
                  setActiveCarpoolDriver(driver);
                  setActiveCarpoolDriverPos(pos);
                }}
                onViewRouteOnMap={(driver) => {
                  setActiveCarpoolDriver(driver);
                  setIsCarpoolMapFocused(true);
                  sounds.playPop();
                }}
                isMapFocused={isCarpoolMapFocused}
                onToggleMapFocus={() => setIsCarpoolMapFocused(prev => !prev)}
              />
            )}

            {/* =========================================
                3. OUTSTATION TAB
               ========================================= */}
            {customerTab === 'OUTSTATION' && (
              <div className="space-y-4 pt-1 pb-6">
                <div>
                  <h3 className="font-black text-xl text-slate-900 dark:text-white">Outstation & Rentals</h3>
                  <p className="text-xs text-slate-500">Intercity travel, self-drive, or private chauffeurs</p>
                </div>

                <div className="space-y-3">
                  {OUTSTATION_PACKAGES.map((pkg) => (
                    <div 
                      key={pkg.id}
                      className="p-4 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-2xl space-y-2.5 shadow-sm"
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <span className="px-2 py-0.5 rounded-md bg-blue-100 dark:bg-blue-900/40 text-brand-blue text-[9px] font-black uppercase">
                            {pkg.tag}
                          </span>
                          <h4 className="font-black text-sm text-slate-900 dark:text-white mt-1">{pkg.title}</h4>
                        </div>
                        <span className="text-xs font-black text-slate-900 dark:text-white">{pkg.pricing}</span>
                      </div>

                      <div className="space-y-1 text-[11px] text-slate-600 dark:text-slate-400">
                        {pkg.features.map((feat, i) => (
                          <div key={i} className="flex items-center gap-1.5">
                            <CheckCircle className="w-3 h-3 text-emerald-500 flex-shrink-0" />
                            <span>{feat}</span>
                          </div>
                        ))}
                      </div>

                      <button 
                        onClick={() => {
                          setSelectedOutstationPkg(pkg.title);
                          sounds.playPop();
                        }}
                        className="w-full py-2.5 rounded-xl bg-slate-900 dark:bg-slate-700 hover:bg-brand-blue text-white font-bold text-xs transition"
                      >
                        Reserve {pkg.category} Package
                      </button>
                    </div>
                  ))}
                </div>

                {/* Quick Outstation modal */}
                {selectedOutstationPkg && (
                  <div className="p-4 bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800 rounded-2xl text-xs space-y-2">
                    <div className="font-bold text-brand-blue">Booking Request: {selectedOutstationPkg}</div>
                    <div className="flex items-center justify-between">
                      <span>Duration (Days):</span>
                      <div className="flex items-center gap-2">
                        <button onClick={() => setOutstationDays(Math.max(outstationDays - 1, 1))} className="w-6 h-6 bg-white dark:bg-slate-800 rounded border font-bold">-</button>
                        <span className="font-black">{outstationDays} Days</span>
                        <button onClick={() => setOutstationDays(outstationDays + 1)} className="w-6 h-6 bg-white dark:bg-slate-800 rounded border font-bold">+</button>
                      </div>
                    </div>
                    <button 
                      onClick={() => {
                        sounds.playSuccess();
                        alert(`🚀 Outstation Trip Confirmed for ${outstationDays} Days! A coordinator will call you.`);
                        setSelectedOutstationPkg(null);
                      }}
                      className="w-full py-2 bg-brand-blue text-white rounded-xl font-bold"
                    >
                      Confirm Intercity Booking
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* =========================================
                4. HISTORY TAB
               ========================================= */}
            {customerTab === 'HISTORY' && (
              <div className="space-y-4 pt-1 pb-6">
                <div>
                  <h3 className="font-black text-xl text-slate-900 dark:text-white">Trip History</h3>
                  <p className="text-xs text-slate-500">Your completed rides and delivery receipts</p>
                </div>

                <div className="space-y-3">
                  {PAST_RIDES_MOCK.map((trip) => (
                    <div 
                      key={trip.id}
                      className="p-3.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-2xl space-y-2 shadow-sm"
                    >
                      <div className="flex justify-between items-center text-xs">
                        <span className="font-extrabold text-slate-400">{trip.date}</span>
                        <span className="font-black text-emerald-600 dark:text-emerald-400">₹{trip.fare}</span>
                      </div>
                      <div className="text-xs font-bold text-slate-800 dark:text-white space-y-0.5">
                        <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300">
                          <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                          <span>{trip.pickup}</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300">
                          <span className="w-2 h-2 rounded-full bg-rose-500"></span>
                          <span>{trip.drop}</span>
                        </div>
                      </div>
                      <div className="flex justify-between items-center pt-2 border-t border-slate-200 dark:border-slate-700/60 text-[11px]">
                        <span className="text-slate-400">{trip.vehicleTier} • {trip.driverName}</span>
                        <button 
                          onClick={() => {
                            setPickup(trip.pickup);
                            setDrop(trip.drop);
                            recalcDistance(trip.pickup, trip.drop);
                            setCustomerTab('BOOKING');
                            sounds.playPop();
                          }}
                          className="font-bold text-brand-blue hover:underline"
                        >
                          Rebook Route →
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* =========================================
                5. PROFILE TAB
               ========================================= */}
            {customerTab === 'PROFILE' && (
              <div className="space-y-4 pt-1 pb-6">
                
                {/* Profile Header Card */}
                <div className="p-4 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-2xl flex items-center gap-3.5 shadow-sm">
                  <div className="w-14 h-14 rounded-2xl bg-brand-blue text-white font-black text-xl flex items-center justify-center shadow-lg shadow-blue-500/20">
                    AN
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <h4 className="font-black text-base text-slate-900 dark:text-white">Akhil Nalla</h4>
                      <span className="px-1.5 py-0.5 rounded bg-amber-400/20 text-amber-500 font-extrabold text-[9px]">Gold</span>
                    </div>
                    <p className="text-xs text-brand-blue font-bold">+91 98480-12345</p>
                    <p className="text-[11px] text-slate-400">akhil.nalla@zaldi.in</p>
                  </div>
                </div>

                {/* Zaldi Wallet Banner */}
                <div className="p-4 bg-gradient-to-r from-blue-900/40 to-slate-900 border border-blue-500/30 rounded-2xl flex items-center justify-between shadow-sm">
                  <div>
                    <span className="text-[10px] font-black uppercase text-blue-400">Zaldi Wallet Balance</span>
                    <div className="text-2xl font-black text-white mt-0.5">₹{walletBalance.toFixed(2)}</div>
                  </div>
                  <button 
                    onClick={() => setIsWalletOpen(true)}
                    className="px-3.5 py-2 bg-brand-blue hover:bg-blue-600 text-white rounded-xl font-bold text-xs shadow-md transition"
                  >
                    + Add Funds
                  </button>
                </div>

                {/* Saved Places */}
                <div className="space-y-1">
                  <div className="text-xs font-bold text-slate-500 px-1">Saved Addresses</div>
                  
                  <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl flex items-center justify-between text-xs cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition">
                    <div className="flex items-center gap-3">
                      <span className="p-2 rounded-lg bg-blue-100 dark:bg-blue-950/60 text-brand-blue">🏠</span>
                      <div>
                        <div className="font-bold text-slate-800 dark:text-white">Home</div>
                        <div className="text-[10px] text-slate-400">Road No 12, Banjara Hills, Hyderabad</div>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-400" />
                  </div>

                  <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl flex items-center justify-between text-xs cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition">
                    <div className="flex items-center gap-3">
                      <span className="p-2 rounded-lg bg-blue-100 dark:bg-blue-950/60 text-brand-blue">💼</span>
                      <div>
                        <div className="font-bold text-slate-800 dark:text-white">Work / Office</div>
                        <div className="text-[10px] text-slate-400">Building 9, Mindspace IT Park, Hitec City</div>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-400" />
                  </div>
                </div>

                {/* App Preferences */}
                <div className="space-y-1 pt-1">
                  <div className="text-xs font-bold text-slate-500 px-1">Preferences & Support</div>
                  
                  <button 
                    onClick={() => setShowSafety(true)}
                    className="w-full p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl flex items-center justify-between text-xs hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                  >
                    <div className="flex items-center gap-3">
                      <Shield className="w-4 h-4 text-emerald-500" />
                      <span className="font-bold text-slate-800 dark:text-white">Safety Center & SOS Contacts</span>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-400" />
                  </button>

                  <button 
                    onClick={() => setIsNightMode(!isNightMode)}
                    className="w-full p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl flex items-center justify-between text-xs hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                  >
                    <div className="flex items-center gap-3">
                      <Settings className="w-4 h-4 text-brand-blue" />
                      <span className="font-bold text-slate-800 dark:text-white">Map Style: {isNightMode ? 'Dark Neon' : 'Light Street'}</span>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-400" />
                  </button>

                  <button 
                    onClick={() => alert("Zaldi 24x7 Customer Care: +91 1800-419-9922 (Toll-Free)")}
                    className="w-full p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl flex items-center justify-between text-xs hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                  >
                    <div className="flex items-center gap-3">
                      <HelpCircle className="w-4 h-4 text-amber-500" />
                      <span className="font-bold text-slate-800 dark:text-white">24x7 Help & Live Support</span>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-400" />
                  </button>
                </div>

              </div>
            )}

          </div>

          {/* ====================================================
              FIXED "ENTER PICKUP & DROP" ACTION BAR
              Fixed directly above div:nth-of-type(3) (Bottom Navigation Bar)
             ==================================================== */}
          {customerTab === 'BOOKING' && !activeOrder && (
            <div className="p-3 bg-white/98 backdrop-blur-md border-t border-slate-200/90 shadow-[0_-6px_25px_rgba(0,0,0,0.08)] z-30 flex-shrink-0">
              {pickup && drop && (
                <div className="flex items-center justify-between px-1 mb-2 text-[11px] font-bold text-slate-500">
                  <div className="flex items-center gap-1.5 truncate max-w-[220px]">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 flex-shrink-0"></span>
                    <span className="truncate text-slate-700">{pickup.split(',')[0]}</span>
                    <span className="text-slate-300">→</span>
                    <span className="w-2 h-2 rounded-full bg-rose-500 flex-shrink-0"></span>
                    <span className="truncate text-slate-900 font-extrabold">{drop.split(',')[0]}</span>
                  </div>
                  <span className="text-emerald-600 font-extrabold flex-shrink-0">
                    {distanceKm} km • {activeTierConfig.etaMin}m away
                  </span>
                </div>
              )}

              <button 
                onClick={() => {
                  if (!pickup || !drop) {
                    sounds.playTap();
                    dropInputRef.current?.focus();
                    drawerScrollRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
                  } else if (!isWeightExceeded) {
                    handleConfirmBooking();
                  }
                }}
                disabled={Boolean(pickup && drop && isWeightExceeded)}
                className={`w-full py-3.5 rounded-2xl font-black text-sm shadow-xl flex justify-center items-center gap-2 transition-all active:scale-98 ${
                  !pickup || !drop
                    ? 'bg-brand-blue hover:bg-blue-600 text-white shadow-blue-500/25 ring-2 ring-blue-500/20'
                    : isWeightExceeded
                    ? 'bg-rose-500/20 text-rose-500 border border-rose-500/40 cursor-not-allowed shadow-none'
                    : currentMode === 'PARCEL'
                    ? 'bg-amber-500 hover:bg-amber-600 text-white shadow-amber-500/30'
                    : 'bg-brand-blue text-white shadow-blue-600/30 hover:bg-blue-600'
                }`}
              >
                <Navigation className="w-4 h-4" />
                <span>
                  {!pickup || !drop 
                    ? 'Enter Pickup & Drop' 
                    : isWeightExceeded 
                    ? `Weight Exceeded (${weightExceededMessage})`
                    : currentMode === 'PARCEL'
                    ? `Confirm ${activeTierConfig.name} Delivery • ₹${finalCalculatedFare}`
                    : `Confirm ${activeTierConfig.name} Ride • ₹${finalCalculatedFare}`}
                </span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>

        {/* Bottom Navigation Bar */}
        <div className="absolute bottom-0 w-full h-[70px] bg-white border-t border-slate-200 flex justify-between items-center px-4 z-40">
          <button 
            onClick={() => {
              setCustomerTab('BOOKING');
              sounds.playPop();
            }}
            className={`flex flex-col items-center justify-center w-full gap-1 transition ${
              customerTab === 'BOOKING' ? 'text-brand-blue' : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            <Navigation className={`w-5 h-5 ${customerTab === 'BOOKING' ? 'stroke-[2.5px]' : 'stroke-2'}`} />
            <span className="text-[10px] font-bold">Ride</span>
          </button>

          <button 
            onClick={() => {
              setCustomerTab('CARPOOL');
              sounds.playPop();
            }}
            className={`flex flex-col items-center justify-center w-full gap-1 transition ${
              customerTab === 'CARPOOL' ? 'text-brand-blue' : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            <Users className={`w-5 h-5 ${customerTab === 'CARPOOL' ? 'stroke-[2.5px]' : 'stroke-2'}`} />
            <span className="text-[10px] font-bold">Carpool</span>
          </button>

          <button 
            onClick={() => {
              setCustomerTab('OUTSTATION');
              sounds.playPop();
            }}
            className={`flex flex-col items-center justify-center w-full gap-1 transition ${
              customerTab === 'OUTSTATION' ? 'text-brand-blue' : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            <Calendar className={`w-5 h-5 ${customerTab === 'OUTSTATION' ? 'stroke-[2.5px]' : 'stroke-2'}`} />
            <span className="text-[10px] font-bold">Outstation</span>
          </button>

          <button 
            onClick={() => {
              setCustomerTab('HISTORY');
              sounds.playPop();
            }}
            className={`flex flex-col items-center justify-center w-full gap-1 transition ${
              customerTab === 'HISTORY' ? 'text-brand-blue' : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            <Clock className={`w-5 h-5 ${customerTab === 'HISTORY' ? 'stroke-[2.5px]' : 'stroke-2'}`} />
            <span className="text-[10px] font-bold">History</span>
          </button>

          <button 
            onClick={() => {
              setCustomerTab('PROFILE');
              sounds.playPop();
            }}
            className={`flex flex-col items-center justify-center w-full gap-1 transition ${
              customerTab === 'PROFILE' ? 'text-brand-blue' : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            <div className={`w-5 h-5 rounded-full border ${
              customerTab === 'PROFILE' ? 'border-brand-blue bg-blue-100 text-brand-blue' : 'border-slate-400'
            } flex items-center justify-center text-[10px] font-black`}>
              A
            </div>
            <span className="text-[10px] font-bold">Account</span>
          </button>
        </div>

      </div>

      {/* In-App Modals */}
      {showChat && activeOrder && (
        <ChatModal 
          driver={activeDriver} 
          order={activeOrder} 
          onClose={() => setShowChat(false)} 
          onSendMessage={onSendMessage}
          role="PASSENGER"
          onSwitchRole={onSwitchToCaptain}
        />
      )}

      {showCall && (
        <CallModal 
          driver={activeDriver} 
          onClose={() => setShowCall(false)} 
        />
      )}

      {isWalletOpen && (
        <WalletModal 
          currentBalance={walletBalance} 
          onAddFunds={(amt) => setWalletBalance(prev => prev + amt)} 
          onClose={() => setIsWalletOpen(false)} 
        />
      )}

      {showSafety && (
        <SafetyModal 
          order={activeOrder} 
          onClose={() => setShowSafety(false)} 
        />
      )}

    </div>
  );
};
