import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  MapPin, X, ArrowUpDown, Clock, Phone, MessageSquare, 
  ShieldCheck, Star, CheckCircle, Check, ChevronRight, Wallet, 
  Settings, HelpCircle, Shield, LogOut, Tag, ArrowRight,
  Share2, Users, Sparkles, Navigation, Calendar
} from 'lucide-react';
import { 
  CustomerTab, BookingStatus, Driver, RideOrder, VehicleTier 
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
import { 
  DEFAULT_GPS_COORDS, 
  DEFAULT_GPS_ADDRESS, 
  reverseGeocodeRealWorldAddress 
} from '../services/geocodingService';

interface CustomerAppProps {
  activeDriver: Driver;
  orders: RideOrder[];
  onNewOrder: (order: RideOrder) => void;
  onUpdateOrder: (orderId: string, updates: Partial<RideOrder>) => void;
}

export const CustomerApp: React.FC<CustomerAppProps> = ({
  activeDriver,
  orders,
  onNewOrder,
  onUpdateOrder
}) => {
  // Navigation & UI state
  const [customerTab, setCustomerTab] = useState<CustomerTab>('BOOKING');
  const [showWelcome, setShowWelcome] = useState(true);
  const [isNightMode, setIsNightMode] = useState(false);
  const [activeInput, setActiveInput] = useState<'pickup' | 'drop' | null>(null);
  const [locationPinType, setLocationPinType] = useState<LocationPinType>('character_pin');

  // Booking fields
  const [pickup, setPickup] = useState('');
  const [drop, setDrop] = useState('');
  const [distanceKm, setDistanceKm] = useState<number>(0);
  const [selectedVehicleId, setSelectedVehicleId] = useState<string>('BIKE');
  const [promoCode, setPromoCode] = useState('');
  const [discountAmount, setDiscountAmount] = useState(0);
  const [promoMessage, setPromoMessage] = useState<string | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<'WALLET' | 'UPI' | 'CASH'>('WALLET');

  // Wallet Balance
  const [walletBalance, setWalletBalance] = useState(480);
  const [isWalletOpen, setIsWalletOpen] = useState(false);

  // Search autocomplete
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState<typeof MOCK_LOCATIONS>([]);
  const pickupInputRef = useRef<HTMLInputElement>(null);
  const dropInputRef = useRef<HTMLInputElement>(null);

  // Active ride tracking
  const activeOrder = orders.find(o => 
    [
      'FINDING_DRIVER', 'DRIVER_ASSIGNED', 'DRIVER_COMING', 'DRIVER_ARRIVED', 
      'TRIP_STARTED', 'TRIP_COMPLETED',
      'SEARCHING', 'MATCHED', 'ARRIVING', 'IN_PROGRESS', 'COMPLETED'
    ].includes(o.status)
  ) || null;

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
    setLocationToast(`Pickup Confirmed: ${addr}`);
    setTimeout(() => setLocationToast(null), 3200);
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
    setLocationToast(`Current GPS Location Locked`);
    setTimeout(() => setLocationToast(null), 2500);
    if (drop) {
      recalcDistance(DEFAULT_GPS_ADDRESS, drop);
    }
  };

  // Selected vehicle object
  const selectedVehicle = VEHICLE_OPTIONS.find(v => v.id === selectedVehicleId) || VEHICLE_OPTIONS[0];

  // Specific Captain matching the chosen vehicle tier
  const currentDriver = useMemo<Driver>(() => {
    if (selectedVehicleId === 'BIKE') return INITIAL_DRIVERS[0]; // Ravi (Bike)
    if (selectedVehicleId === 'AUTO') return INITIAL_DRIVERS[1]; // Vikram (Auto)
    if (selectedVehicleId === 'CAB' || selectedVehicleId === 'PREMIUM') return INITIAL_DRIVERS[2]; // Priya (Cab)
    if (selectedVehicleId === 'TRUCK' || selectedVehicleId === 'PARCEL') return INITIAL_DRIVERS[3]; // Suresh (Truck)
    return activeDriver;
  }, [selectedVehicleId, activeDriver]);

  // Actual Road Route between Pickup and Drop
  const roadRouteInfo = useMemo(() => {
    if (!pickup || !drop) return null;
    return generateActualRoadRoute(pickup, drop);
  }, [pickup, drop]);

  // Sync road route distance
  useEffect(() => {
    if (roadRouteInfo) {
      setDistanceKm(roadRouteInfo.totalDistanceKm);
    }
  }, [roadRouteInfo]);

  // Base fare calculation
  const rawFare = distanceKm > 0 
    ? Math.round(selectedVehicle.baseFare + distanceKm * selectedVehicle.perKm)
    : 0;
  const finalCalculatedFare = Math.max(rawFare - discountAmount, 10);

  // Auto-dismiss welcome hero after 6 seconds (or manual click)
  useEffect(() => {
    if (showWelcome) {
      const timer = setTimeout(() => setShowWelcome(false), 6000);
      return () => clearTimeout(timer);
    }
  }, [showWelcome]);

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

  // Quick swap pickup & drop
  const handleSwapLocations = () => {
    sounds.playPop();
    const tempP = pickup;
    setPickup(drop);
    setDrop(tempP);
    if (tempP && drop) {
      recalcDistance(drop, tempP);
    }
  };

  const handleSelectLocation = (locName: string) => {
    sounds.playPop();
    setSearchQuery('');
    setSuggestions([]);
    if (activeInput === 'pickup') {
      setPickup(locName);
      if (!drop) {
        setActiveInput('drop');
        dropInputRef.current?.focus();
      } else {
        setActiveInput(null);
        recalcDistance(locName, drop);
      }
    } else {
      setDrop(locName);
      if (!pickup) {
        setActiveInput('pickup');
        pickupInputRef.current?.focus();
      } else {
        setActiveInput(null);
        recalcDistance(pickup, locName);
      }
    }
  };

  const recalcDistance = (p: string, d: string) => {
    if (!p || !d) return;
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

    const newRide: RideOrder = {
      id: "TRP-" + Math.random().toString(36).substring(2, 8).toUpperCase(),
      customerName: "Akhil Nalla",
      customerPhone: "+91 98480-12345",
      pickup,
      drop,
      distanceKm: roadRouteInfo?.totalDistanceKm || (distanceKm > 0 ? distanceKm : 5.8),
      fare: rawFare,
      discount: discountAmount,
      finalFare: finalCalculatedFare,
      vehicleTier: selectedVehicle.name,
      vehicleIcon: selectedVehicle.icon,
      driverId: currentDriver.id,
      riderPin: String(Math.floor(1000 + Math.random() * 9000)),
      status: 'FINDING_DRIVER',
      paymentMethod,
      createdAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      progressPercent: 0
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
    if (!isHomeTab) return 'h-[80%]';
    if (activeOrder) {
      if (['FINDING_DRIVER', 'SEARCHING'].includes(activeOrder.status)) return 'h-[370px]';
      if (['DRIVER_ASSIGNED', 'DRIVER_COMING'].includes(activeOrder.status)) return 'h-[440px]';
      if (activeOrder.status === 'DRIVER_ARRIVED') return 'h-[430px]';
      if (['TRIP_STARTED', 'IN_PROGRESS', 'ARRIVING'].includes(activeOrder.status)) return 'h-[460px]';
      if (['TRIP_COMPLETED', 'COMPLETED'].includes(activeOrder.status)) return 'h-[540px]';
    }
    if (activeInput && suggestions.length > 0) return 'h-[75%]';
    if (pickup && drop) return 'h-[58%]';
    return 'h-[46%]';
  };

  return (
    <div className="flex justify-center items-center w-full py-2 sm:py-6">
      
      {/* Phone Mockup Frame */}
      <div className="relative w-full max-w-[420px] h-[870px] bg-slate-950 text-slate-100 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.8)] rounded-[3rem] border-[10px] border-slate-900 flex flex-col font-sans overflow-hidden ring-1 ring-slate-800">
        
        {/* Top Speaker / Dynamic Island & Status Bar */}
        <div className="absolute top-0 w-full h-11 bg-transparent z-[110] flex justify-between items-center px-7 pointer-events-none">
          <span className="text-[13px] font-black tracking-tight text-slate-800 dark:text-slate-200">9:41</span>
          
          {/* Dynamic Island pill */}
          <div className="w-24 h-5 bg-black rounded-full flex items-center justify-center gap-1.5 shadow-sm">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">GPS LIVE</span>
          </div>

          <div className="flex gap-1.5 items-center">
            <div className="w-3.5 h-2.5 bg-slate-800 dark:bg-slate-200 rounded-sm"></div>
            <div className="w-4 h-2.5 border border-slate-800 dark:border-slate-200 rounded-sm relative flex items-center p-0.5">
              <div className="w-2.5 h-1.5 bg-emerald-500 rounded-xs"></div>
            </div>
          </div>
        </div>

        {/* Map Background Area (Top 55-60%) */}
        <div className="absolute top-0 left-0 right-0 h-[62%] z-0 overflow-hidden">
          <InteractiveMap
            pickup={pickup}
            drop={drop}
            status={activeOrder?.status || 'IDLE'}
            progressPercent={activeOrder?.progressPercent || 0}
            vehicleTierName={activeOrder?.vehicleTier || selectedVehicle.name}
            vehicleIcon={activeOrder?.vehicleIcon || selectedVehicle.icon}
            driverName={currentDriver.name}
            driverPlate={currentDriver.plate}
            isNightMode={isNightMode}
            onToggleNightMode={() => setIsNightMode(!isNightMode)}
            showFixedPin={showFixedPin}
            fixedPinAddress={fixedPinAddress}
            fixedPinPos={fixedPinPos}
            onAddressResolved={handleAddressResolved}
            onConfirmLocation={handleConfirmLocation}
            onUseCurrentLocation={handleUseCurrentLocation}
            locationPinType={locationPinType}
            onChangePinType={setLocationPinType}
          />

          {/* Top Brand Header Bar over Map (Unobstructed, nothing hidden behind) */}
          <div className="absolute top-12 left-0 right-0 px-5 flex justify-between items-center z-40 pointer-events-none">
            <div className="flex items-center gap-2 bg-slate-900/90 backdrop-blur-md px-3.5 py-1.5 rounded-2xl shadow-lg border border-slate-800 pointer-events-auto">
              <div className="w-6 h-6 rounded-lg bg-brand-blue flex items-center justify-center font-black text-white text-xs shadow-md">
                Z
              </div>
              <span className="text-sm font-black text-white tracking-tight">
                Zaldi <span className="text-emerald-400 text-xs font-semibold">Fast</span>
              </span>
            </div>

            <div className="flex items-center gap-2 pointer-events-auto">
              <button 
                onClick={() => setIsWalletOpen(true)}
                className="flex items-center gap-1.5 bg-slate-900/90 backdrop-blur-md px-3 py-1.5 rounded-2xl shadow-lg border border-slate-800 text-xs font-bold text-white hover:border-blue-500 transition"
              >
                <Wallet className="w-3.5 h-3.5 text-blue-400" />
                <span>₹{walletBalance}</span>
              </button>

              <button 
                onClick={() => setShowSafety(true)}
                title="Safety Shield"
                className="p-2 bg-slate-900/90 backdrop-blur-md rounded-2xl shadow-lg border border-slate-800 text-slate-300 hover:text-emerald-400 transition"
              >
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
              </button>
            </div>
          </div>

          {/* Welcome Overlay (Click to dismiss or view again) */}
          <div 
            onClick={() => setShowWelcome(false)}
            className={`absolute inset-0 z-50 transition-all duration-400 cursor-pointer overflow-hidden ${
              showWelcome ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
            }`}
          >
            <div className={`w-full h-full p-6 pt-16 flex flex-col justify-between ${isNightMode ? 'hero-bg-dark' : 'hero-bg'} text-slate-900 dark:text-white`}>
              <div className="flex items-center justify-between">
                <span className="px-3 py-1 rounded-full bg-blue-600/10 text-brand-blue border border-blue-500/30 text-[10px] font-black uppercase tracking-wider">
                  Zaldi Logistics
                </span>
                <span className="text-[11px] font-bold text-slate-400">Tap anywhere to book ✕</span>
              </div>

              <div className="my-auto py-4">
                <h2 className="text-4xl font-black tracking-tight leading-none text-slate-900 dark:text-white">
                  Move<br/>
                  Anything<br/>
                  <span className="text-brand-blue">Anywhere</span>
                </h2>
                <p className="mt-3 text-xs sm:text-sm font-semibold text-slate-600 dark:text-slate-300 leading-relaxed max-w-[260px]">
                  Bikes • Autos • Cabs • Parcels • Trucks. Superfast pickup in 3 minutes.
                </p>
                <div className="flex items-center gap-2 mt-4 text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
                  <span>14 Captains online near you</span>
                </div>
              </div>

              <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md p-3 rounded-2xl border border-slate-200 dark:border-slate-800 flex items-center justify-between shadow-lg">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-amber-500" />
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200">Special: ₹50 OFF code ZALDI50</span>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400" />
              </div>
            </div>
          </div>

        </div>

        {/* Bottom Sheet Drawer */}
        <div 
          className={`absolute w-full bg-white dark:bg-slate-900 rounded-t-3xl shadow-[0_-15px_40px_rgba(0,0,0,0.3)] transition-all duration-300 ease-in-out z-30 flex flex-col`}
          style={{ height: getSheetHeight(), bottom: '70px' }}
        >
          {/* Pull Handle */}
          <div className="w-12 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full mx-auto mt-3 mb-2 flex-shrink-0 cursor-pointer"></div>

          <div className="flex-1 overflow-y-auto px-5 pb-6 no-scrollbar relative text-slate-900 dark:text-slate-100">
            
            {/* =========================================
                1. BOOKING TAB
               ========================================= */}
            {customerTab === 'BOOKING' && (
              <>
                {/* STATE A: IDLE / SELECTING ROUTE */}
                {!activeOrder && (
                  <div className="space-y-4 pt-1">
                    
                    {/* Location Inputs with Swap button */}
                    <div className="bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 rounded-2xl p-3 relative shadow-sm">
                      
                      {/* Pickup Input */}
                      <div className="flex items-center gap-2">
                        <div className="w-3.5 h-3.5 rounded-full bg-emerald-500 border-2 border-white dark:border-slate-800 flex-shrink-0"></div>
                        <input 
                          ref={pickupInputRef}
                          type="text" 
                          value={pickup}
                          onChange={(e) => {
                            setPickup(e.target.value);
                            setSearchQuery(e.target.value);
                          }}
                          onFocus={() => {
                            setActiveInput('pickup');
                            setSearchQuery(pickup);
                          }}
                          placeholder="Current location (Pickup)"
                          className="w-full bg-transparent font-semibold text-xs sm:text-sm outline-none text-slate-800 dark:text-white placeholder-slate-400"
                        />
                        <button
                          onClick={handleUseCurrentLocation}
                          title="Use Current Location (GPS)"
                          className="p-1 rounded-lg text-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 transition flex items-center gap-1 text-[10px] font-bold flex-shrink-0"
                        >
                          <Navigation className="w-3.5 h-3.5" />
                        </button>
                        {pickup && (
                          <button onClick={() => setPickup('')} className="p-1 text-slate-400 hover:text-slate-600">
                            <X className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>

                      {/* Connecting Line + Swap Button */}
                      <div className="flex items-center justify-between ml-[5px] my-1">
                        <div className="border-l-2 border-dotted-spacing h-4 ml-[1px]"></div>
                        <button 
                          onClick={handleSwapLocations}
                          title="Swap Pickup & Drop"
                          className="p-1.5 rounded-full bg-slate-200 dark:bg-slate-700 hover:bg-brand-blue hover:text-white text-slate-600 dark:text-slate-300 transition -mr-1"
                        >
                          <ArrowUpDown className="w-3 h-3" />
                        </button>
                      </div>

                      {/* Drop Input */}
                      <div className="flex items-center gap-3">
                        <div className="w-3.5 h-3.5 rounded-sm bg-rose-500 border-2 border-white dark:border-slate-800 flex-shrink-0"></div>
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
                          placeholder="Where are you going? (Drop)"
                          className="w-full bg-transparent font-semibold text-xs sm:text-sm outline-none text-slate-800 dark:text-white placeholder-slate-400"
                        />
                        {drop && (
                          <button onClick={() => setDrop('')} className="p-1 text-slate-400 hover:text-slate-600">
                            <X className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>

                      {/* Autocomplete Dropdown */}
                      {activeInput && suggestions.length > 0 && (
                        <div className="absolute top-[102%] left-0 right-0 bg-white dark:bg-slate-800 shadow-2xl border border-slate-200 dark:border-slate-700 rounded-2xl z-50 max-h-48 overflow-y-auto p-1 divide-y divide-slate-100 dark:divide-slate-700/50">
                          {suggestions.map((loc) => (
                            <div 
                              key={loc.id}
                              onClick={() => handleSelectLocation(loc.name)}
                              className="flex items-center gap-3 p-2.5 hover:bg-slate-100 dark:hover:bg-slate-700/60 rounded-xl cursor-pointer transition"
                            >
                              <div className="p-1.5 rounded-lg bg-blue-50 dark:bg-slate-700 text-brand-blue">
                                <Clock className="w-3.5 h-3.5" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="text-xs font-bold text-slate-800 dark:text-white truncate">{loc.name}</div>
                                <div className="text-[10px] text-slate-400 truncate">{loc.area}</div>
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
                            className="flex-shrink-0 px-3 py-1.5 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-blue-50 dark:hover:bg-blue-900/30 border border-slate-200 dark:border-slate-700 text-[11px] font-semibold text-slate-700 dark:text-slate-300 transition flex items-center gap-1.5"
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
                        <span>Select Vehicle Tier</span>
                        {distanceKm > 0 && <span>Est. Distance: {distanceKm} km</span>}
                      </div>

                      <div className="flex gap-2.5 overflow-x-auto no-scrollbar py-1.5 px-0.5">
                        {VEHICLE_OPTIONS.map((v) => {
                          const isSelected = selectedVehicleId === v.id;
                          const theme = getVehicleTheme(v.id);
                          const tierFare = distanceKm > 0 
                            ? Math.round(v.baseFare + distanceKm * v.perKm)
                            : v.baseFare;

                          return (
                            <div 
                              key={v.id}
                              onClick={() => {
                                setSelectedVehicleId(v.id);
                                sounds.playPop();
                              }}
                              className={`group flex-shrink-0 w-[112px] p-2.5 rounded-2xl border-2 flex flex-col items-center justify-center transition-all duration-300 cursor-pointer relative overflow-hidden select-none ${
                                isSelected 
                                  ? 'border-brand-blue bg-gradient-to-b from-blue-500/10 to-blue-500/5 dark:from-blue-600/20 dark:to-slate-900/90 shadow-lg scale-[1.02]' 
                                  : 'border-slate-200/90 dark:border-slate-800 bg-white/95 dark:bg-slate-900/60 hover:border-slate-300 dark:hover:border-slate-700 hover:scale-[1.01]'
                              }`}
                              style={{
                                boxShadow: isSelected ? theme.glowShadow : undefined
                              }}
                            >
                              {/* 5D Holographic Badge */}
                              {v.badge && (
                                <span className="absolute -top-1 px-2 py-0.5 rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 text-[8px] font-black text-white uppercase tracking-wider shadow-sm">
                                  {v.badge}
                                </span>
                              )}
                              
                              {/* 5D Vehicle Icon Container */}
                              <div className="w-12 h-12 mb-1 flex items-center justify-center relative">
                                <Vehicle5dIcon 
                                  type={v.id} 
                                  size={44} 
                                  isSelected={isSelected}
                                />
                              </div>

                              <span className="font-black text-xs text-slate-800 dark:text-slate-100 text-center leading-tight tracking-tight">
                                {v.name}
                              </span>
                              <span className="text-[9px] text-slate-400 font-medium">
                                {v.capacity}
                              </span>

                              <div className="flex flex-col items-center mt-1.5 pt-1.5 border-t border-slate-100 dark:border-slate-800/80 w-full">
                                <span className="font-black text-xs text-slate-900 dark:text-white">
                                  ₹{tierFare}
                                </span>
                                <span className="text-[9px] font-bold text-emerald-500 dark:text-emerald-400 flex items-center gap-1">
                                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                  <span>{v.etaMin} min</span>
                                </span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

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

                    {/* Book Now Button */}
                    <button 
                      onClick={handleConfirmBooking}
                      disabled={!pickup || !drop}
                      className={`w-full py-3.5 rounded-2xl font-black text-sm shadow-xl flex justify-center items-center gap-2 transition-all mt-2 active:scale-98 ${
                        pickup && drop 
                          ? 'bg-brand-blue text-white shadow-blue-600/30 hover:bg-blue-600'
                          : 'bg-slate-200 dark:bg-slate-800 text-slate-400 dark:text-slate-600 cursor-not-allowed shadow-none'
                      }`}
                    >
                      <span>
                        {pickup && drop ? `Confirm ${selectedVehicle.name} • ₹${finalCalculatedFare}` : 'Enter Pickup & Drop'}
                      </span>
                      {pickup && drop && <ArrowRight className="w-4 h-4" />}
                    </button>

                  </div>
                )}

                {/* 1. FINDING DRIVER */}
                {activeOrder && (activeOrder.status === 'FINDING_DRIVER' || activeOrder.status === 'SEARCHING') && (
                  <div className="flex flex-col items-center justify-center py-5 text-center space-y-4 animate-in fade-in">
                    <div className="relative flex items-center justify-center w-20 h-20">
                      <div className="w-16 h-16 rounded-2xl bg-brand-blue/10 border-2 border-brand-blue flex items-center justify-center shadow-lg">
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
                      <div className="w-12 h-12 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 flex items-center justify-center flex-shrink-0 shadow-sm">
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
                      <button onClick={() => setShowChat(true)} className="py-2.5 px-3 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-brand-blue dark:text-blue-400 border border-blue-200 dark:border-blue-800 font-bold text-xs flex items-center justify-center gap-1.5 hover:bg-blue-100 transition">
                        <MessageSquare className="w-3.5 h-3.5" />
                        <span>Chat</span>
                      </button>
                      <button onClick={() => setShowSafety(true)} className="py-2.5 px-3 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 font-bold text-xs flex items-center justify-center gap-1.5 hover:bg-slate-200 transition">
                        <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                        <span>Safety</span>
                      </button>
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
                      <div className="w-12 h-12 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 flex items-center justify-center flex-shrink-0 shadow-sm">
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
                      <div className="w-12 h-12 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 flex items-center justify-center flex-shrink-0 shadow-sm">
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
                      <button onClick={() => setShowChat(true)} className="py-2.5 px-3 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-brand-blue dark:text-blue-400 border border-blue-200 dark:border-blue-800 font-bold text-xs flex items-center justify-center gap-1.5">
                        <MessageSquare className="w-3.5 h-3.5" />
                        <span>Chat</span>
                      </button>
                      <button onClick={() => setShowSafety(true)} className="py-2.5 px-3 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 font-bold text-xs flex items-center justify-center gap-1.5">
                        <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                        <span>Safety</span>
                      </button>
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
                  <div className="flex flex-col items-center justify-center py-4 space-y-4 animate-in fade-in">
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
                        onUpdateOrder(activeOrder.id, { status: 'IDLE' });
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
              <div className="space-y-4 pt-1 pb-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-black text-xl text-slate-900 dark:text-white">Zaldi Carpool</h3>
                    <p className="text-xs text-slate-500">Daily commute sharing • Save up to 60%</p>
                  </div>
                  <button className="px-3 py-1.5 rounded-xl bg-brand-blue text-white text-xs font-bold">
                    + Offer Ride
                  </button>
                </div>

                {joinedPoolId && (
                  <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 rounded-2xl flex items-center justify-between text-xs">
                    <span className="font-bold text-emerald-700 dark:text-emerald-300">
                      🎉 Seat Confirmed for Carpool!
                    </span>
                    <button onClick={() => setJoinedPoolId(null)} className="text-emerald-600 underline font-bold">
                      Dismiss
                    </button>
                  </div>
                )}

                <div className="space-y-3">
                  {MOCK_CARPOOLS.map((pool) => (
                    <div 
                      key={pool.id}
                      className="p-3.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-2xl space-y-2.5 shadow-sm"
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="flex items-center gap-1.5 text-[10px] font-extrabold text-brand-blue uppercase">
                            <Clock className="w-3 h-3" />
                            <span>{pool.departureTime}</span>
                          </div>
                          <h4 className="font-black text-xs text-slate-900 dark:text-white mt-1">
                            {pool.from} → {pool.to}
                          </h4>
                        </div>
                        <div className="text-right">
                          <span className="text-sm font-black text-emerald-600 dark:text-emerald-400">
                            ₹{pool.pricePerSeat}
                          </span>
                          <span className="text-[10px] text-slate-400 block font-semibold">per seat</span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-2 border-t border-slate-200 dark:border-slate-700/60 text-xs">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center font-bold text-xs text-slate-700 dark:text-slate-300">
                            {pool.driverName.charAt(0)}
                          </div>
                          <div>
                            <span className="font-bold text-slate-800 dark:text-slate-200 block text-[11px]">{pool.driverName}</span>
                            <span className="text-[9px] text-slate-400">{pool.vehicle}</span>
                          </div>
                        </div>

                        <button 
                          onClick={() => {
                            sounds.playSuccess();
                            setJoinedPoolId(pool.id);
                          }}
                          className="px-3.5 py-1.5 rounded-xl bg-brand-blue hover:bg-blue-600 text-white font-bold text-xs shadow-md transition"
                        >
                          Book Seat ({pool.availableSeats} left)
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
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
        </div>

        {/* Bottom Navigation Bar */}
        <div className="absolute bottom-0 w-full h-[70px] bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex justify-between items-center px-4 z-40">
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
      {showChat && (
        <ChatModal 
          driver={activeDriver} 
          order={activeOrder} 
          onClose={() => setShowChat(false)} 
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
