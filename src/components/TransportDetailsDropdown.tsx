import React, { useState } from 'react';
import { 
  Package, ChevronDown, ChevronUp, Check, Scale, ShieldCheck, 
  Info, User, Phone, FileText, AlertCircle, Sparkles, CheckCircle2,
  Search, Sliders, Truck, Box, ArrowRight
} from 'lucide-react';
import { sounds } from '../services/audio';

export interface TransportDetails {
  parcelType: string;
  weightKg: number;
  receiverName: string;
  receiverPhone: string;
  deliveryNote: string;
  isFragile: boolean;
  transitInsurance: boolean;
}

interface TransportDetailsDropdownProps {
  vehicleId: string;
  vehicleName: string;
  maxWeight: number;
  currentDetails: TransportDetails;
  onChange: (updates: Partial<TransportDetails>) => void;
  parcelSpec: {
    maxWeight: number;
    types: { label: string; icon: string; desc?: string; category?: string }[];
  };
}

const VEHICLE_CARGO_SPECS: Record<string, {
  volumeLabel: string;
  loadEstimate: string;
  cargoBayType: string;
  dimensions: string;
  badge: string;
}> = {
  BIKE: {
    volumeLabel: '25L Weatherproof Backpack / Box',
    loadEstimate: '~1 min instant handover',
    cargoBayType: 'Insulated motorcycle cargo box',
    dimensions: '40cm × 35cm × 30cm',
    badge: 'Express 15-min Courier'
  },
  AUTO: {
    volumeLabel: '250L Rear Tray & Footwell',
    loadEstimate: '~2 min quick loading',
    cargoBayType: 'Covered weather-protected rear bay',
    dimensions: '90cm × 65cm × 50cm',
    badge: 'Medium Cargo Specialist'
  },
  CAB: {
    volumeLabel: '420L Sedan Boot & Rear Seat',
    loadEstimate: '~3 min passenger loading',
    cargoBayType: 'Air-conditioned clean sedan boot',
    dimensions: '120cm × 85cm × 60cm',
    badge: 'Secured Luggage & Fragile'
  },
  PREMIUM: {
    volumeLabel: '680L SUV Split Cargo Bay',
    loadEstimate: '~4 min family luggage load',
    cargoBayType: 'Flat fold-down heavy luggage compartment',
    dimensions: '150cm × 110cm × 80cm',
    badge: 'High-Volume Executive SUV'
  },
  TRUCK: {
    volumeLabel: '1,800L Tata Ace Commercial Flatbed',
    loadEstimate: '~10 min commercial loading',
    cargoBayType: 'Commercial cargo bed with tarpaulin straps',
    dimensions: '220cm × 140cm × 120cm',
    badge: 'Industrial Freight 750kg'
  }
};

const CATEGORIES = [
  { id: 'ALL', label: 'All Items' },
  { id: 'DOCS', label: '📄 Documents & Tech' },
  { id: 'BOXES', label: '📦 Boxes & Cartons' },
  { id: 'FOOD', label: '🍱 Food & Perishables' },
  { id: 'LUGGAGE', label: '🧳 Luggage & Freight' }
];

export const TransportDetailsDropdown: React.FC<TransportDetailsDropdownProps> = ({
  vehicleId,
  vehicleName,
  maxWeight,
  currentDetails,
  onChange,
  parcelSpec
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [showExtendedDetails, setShowExtendedDetails] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [customInput, setCustomInput] = useState('');

  const cargoSpec = VEHICLE_CARGO_SPECS[vehicleId] || VEHICLE_CARGO_SPECS.BIKE;
  const currentParcel = parcelSpec.types.find(t => t.label === currentDetails.parcelType) || {
    label: currentDetails.parcelType || parcelSpec.types[0]?.label || 'Standard Package',
    icon: '📦',
    desc: 'General delivery parcel'
  };

  const isWeightExceeded = currentDetails.weightKg > maxWeight;
  const weightPercentage = Math.min(100, Math.round((currentDetails.weightKg / maxWeight) * 100));

  // Filtered types based on search and category
  const filteredTypes = parcelSpec.types.filter(item => {
    const matchesSearch = item.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.desc && item.desc.toLowerCase().includes(searchQuery.toLowerCase()));
    
    if (!matchesSearch) return false;
    if (selectedCategory === 'ALL') return true;
    if (selectedCategory === 'DOCS') {
      return item.label.includes('Doc') || item.label.includes('Gadget') || item.label.includes('Electronic') || item.label.includes('Secured');
    }
    if (selectedCategory === 'BOXES') {
      return item.label.includes('Box') || item.label.includes('Carton') || item.label.includes('Stock') || item.label.includes('Hardware');
    }
    if (selectedCategory === 'FOOD') {
      return item.label.includes('Food') || item.label.includes('Catering') || item.label.includes('Grocery') || item.label.includes('Medicine');
    }
    if (selectedCategory === 'LUGGAGE') {
      return item.label.includes('Luggage') || item.label.includes('Cargo') || item.label.includes('Freight') || item.label.includes('Furniture') || item.label.includes('Load');
    }
    return true;
  });

  const weightPresets = vehicleId === 'BIKE' 
    ? [2, 5, 10, 15, 20]
    : vehicleId === 'AUTO'
    ? [10, 25, 50, 75, 100]
    : vehicleId === 'CAB'
    ? [15, 35, 75, 150, 250]
    : vehicleId === 'PREMIUM'
    ? [25, 70, 150, 300, 450]
    : [50, 150, 300, 500, 750];

  return (
    <div className="space-y-3 bg-gradient-to-br from-white via-slate-50 to-blue-50/30 dark:from-slate-900 dark:via-slate-900/90 dark:to-slate-950 p-3.5 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-xs relative">
      
      {/* Header with Transport Mode Status and Cargo Spec Pill */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-600 dark:text-amber-400 font-black text-sm shadow-xs">
            <Package className="w-4 h-4" />
          </div>
          <div>
            <div className="text-xs font-black text-slate-900 dark:text-white flex items-center gap-1.5">
              <span>Transport & Parcel Details</span>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
            </div>
            <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">
              {cargoSpec.volumeLabel}
            </p>
          </div>
        </div>

        <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-400/40 shadow-2xs">
          Max {maxWeight} kg
        </span>
      </div>

      {/* Modern Dropdown Trigger Button */}
      <div className="relative">
        <button
          type="button"
          onClick={() => {
            sounds.playTap();
            setIsOpen(!isOpen);
          }}
          className={`w-full p-3 rounded-2xl border-2 transition-all duration-200 flex items-center justify-between gap-3 text-left shadow-xs ${
            isOpen
              ? 'bg-white dark:bg-slate-900 border-amber-500 ring-4 ring-amber-500/15 shadow-md'
              : 'bg-white hover:bg-slate-50/80 dark:bg-slate-900/90 border-slate-200 dark:border-slate-700 hover:border-amber-400'
          }`}
        >
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-500/30 flex items-center justify-center text-xl flex-shrink-0 shadow-xs">
              {currentParcel.icon}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="text-[9px] font-black uppercase tracking-wider px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-700 dark:text-amber-300">
                  Parcel Category
                </span>
                <span className="text-[10px] text-slate-400 font-semibold">• {vehicleName}</span>
              </div>
              <div className="text-sm font-black text-slate-900 dark:text-white truncate mt-0.5">
                {currentParcel.label}
              </div>
              {currentParcel.desc && (
                <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate font-medium">
                  {currentParcel.desc}
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            <div className="text-right hidden xs:block">
              <div className="text-[9px] font-black uppercase text-slate-400">Payload</div>
              <div className={`text-xs font-black ${isWeightExceeded ? 'text-rose-600' : 'text-slate-900 dark:text-white'}`}>
                {currentDetails.weightKg} kg
              </div>
            </div>
            <div className={`w-8 h-8 rounded-xl flex items-center justify-center transition-transform duration-200 ${
              isOpen ? 'bg-amber-500 text-white rotate-180 shadow-xs' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
            }`}>
              <ChevronDown className="w-4 h-4" />
            </div>
          </div>
        </button>

        {/* Modern Dropdown Overlay / Popover */}
        {isOpen && (
          <>
            <div 
              className="fixed inset-0 z-40 bg-black/20 backdrop-blur-xs" 
              onClick={() => setIsOpen(false)} 
            />
            
            <div className="absolute top-[104%] left-0 right-0 z-50 bg-white dark:bg-slate-900 border-2 border-amber-500/60 rounded-3xl shadow-2xl p-3.5 space-y-3 animate-in fade-in zoom-in-98 duration-150">
              
              {/* Dropdown Header & Search Filter */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs font-black text-slate-900 dark:text-white">
                  <span className="flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                    <span>Select Parcel or Cargo Type</span>
                  </span>
                  <span className="text-[10px] text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/60 px-2 py-0.5 rounded-full border border-amber-300 dark:border-amber-700 font-bold">
                    Max payload {maxWeight} kg
                  </span>
                </div>

                {/* Instant Search Bar */}
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search documents, luggage, cartons..."
                    className="w-full pl-8 pr-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white placeholder-slate-400 outline-none focus:border-amber-500 font-medium"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600"
                    >
                      ✕
                    </button>
                  )}
                </div>

                {/* Category Pills */}
                <div className="flex gap-1 overflow-x-auto no-scrollbar py-0.5">
                  {CATEGORIES.map(cat => (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => {
                        sounds.playTap();
                        setSelectedCategory(cat.id);
                      }}
                      className={`px-2.5 py-1 rounded-lg text-[10px] font-bold whitespace-nowrap transition ${
                        selectedCategory === cat.id
                          ? 'bg-amber-500 text-white shadow-xs'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                      }`}
                    >
                      {cat.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Parcel Type Cards List */}
              <div className="max-h-60 overflow-y-auto space-y-1.5 pr-0.5 divide-y divide-slate-100 dark:divide-slate-800">
                {filteredTypes.length > 0 ? (
                  filteredTypes.map(item => {
                    const isSelected = currentDetails.parcelType === item.label;
                    return (
                      <div
                        key={item.label}
                        onClick={() => {
                          sounds.playPop();
                          onChange({ parcelType: item.label });
                          setIsOpen(false);
                        }}
                        className={`pt-1.5 p-2.5 rounded-2xl cursor-pointer transition flex items-center justify-between gap-3 group ${
                          isSelected
                            ? 'bg-amber-500/10 dark:bg-amber-950/40 border-2 border-amber-500 text-amber-900 dark:text-amber-200 shadow-xs'
                            : 'hover:bg-slate-100/80 dark:hover:bg-slate-800/80 border border-transparent'
                        }`}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-lg flex-shrink-0 transition ${
                            isSelected ? 'bg-amber-500 text-white shadow-xs' : 'bg-slate-100 dark:bg-slate-800 text-slate-800'
                          }`}>
                            {item.icon}
                          </div>
                          <div className="min-w-0">
                            <div className="text-xs font-black text-slate-900 dark:text-white truncate">
                              {item.label}
                            </div>
                            {item.desc && (
                              <div className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
                                {item.desc}
                              </div>
                            )}
                          </div>
                        </div>

                        {isSelected ? (
                          <div className="w-6 h-6 rounded-full bg-amber-500 text-white flex items-center justify-center flex-shrink-0 shadow-xs">
                            <Check className="w-3.5 h-3.5 stroke-[3]" />
                          </div>
                        ) : (
                          <span className="text-[10px] font-bold text-slate-400 group-hover:text-amber-500 transition">
                            Select →
                          </span>
                        )}
                      </div>
                    );
                  })
                ) : (
                  <div className="py-4 text-center text-xs text-slate-400">
                    No matching parcel types found. Enter a custom item below.
                  </div>
                )}
              </div>

              {/* Custom Parcel Input */}
              <div className="pt-2 border-t border-slate-200 dark:border-slate-800">
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                  Or enter custom goods / cargo description:
                </div>
                <div className="flex gap-1.5">
                  <input
                    type="text"
                    value={customInput}
                    onChange={(e) => setCustomInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && customInput.trim()) {
                        sounds.playSuccess();
                        onChange({ parcelType: customInput.trim() });
                        setCustomInput('');
                        setIsOpen(false);
                      }
                    }}
                    placeholder="e.g. 2 Laptop Bags & Charger Box..."
                    className="flex-1 px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white placeholder-slate-400 outline-none focus:border-amber-500"
                  />
                  <button
                    type="button"
                    disabled={!customInput.trim()}
                    onClick={() => {
                      if (!customInput.trim()) return;
                      sounds.playSuccess();
                      onChange({ parcelType: customInput.trim() });
                      setCustomInput('');
                      setIsOpen(false);
                    }}
                    className="px-3 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 disabled:opacity-40 text-white font-black text-xs transition"
                  >
                    Apply
                  </button>
                </div>
              </div>

            </div>
          </>
        )}
      </div>

      {/* Dynamic Weight Stepper & Load Meter */}
      <div className="space-y-2 bg-white dark:bg-slate-900/90 p-3 rounded-2xl border border-slate-200 dark:border-slate-700/80 shadow-xs">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800 dark:text-white">
            <Scale className="w-3.5 h-3.5 text-amber-500" />
            <span>Parcel / Cargo Weight:</span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-base font-black text-slate-900 dark:text-white font-mono">
              {currentDetails.weightKg} kg
            </span>
            <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
              isWeightExceeded
                ? 'bg-rose-50 text-rose-600 border border-rose-300 dark:bg-rose-950/60 dark:text-rose-400 animate-pulse'
                : 'bg-emerald-50 text-emerald-600 border border-emerald-300 dark:bg-emerald-950/60 dark:text-emerald-400'
            }`}>
              {isWeightExceeded ? 'Exceeds limit!' : `Safe (< ${maxWeight}kg)`}
            </span>
          </div>
        </div>

        {/* Visual Payload Capacity Gauge */}
        <div className="space-y-1">
          <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden flex">
            <div 
              className={`h-full transition-all duration-300 rounded-full ${
                isWeightExceeded 
                  ? 'bg-rose-500' 
                  : weightPercentage > 75 
                  ? 'bg-amber-500' 
                  : 'bg-gradient-to-r from-blue-500 to-emerald-500'
              }`}
              style={{ width: `${Math.min(100, weightPercentage)}%` }}
            />
          </div>
          <div className="flex justify-between text-[9px] font-extrabold text-slate-400">
            <span>1 kg</span>
            <span>{weightPercentage}% payload used</span>
            <span>Max {maxWeight} kg</span>
          </div>
        </div>

        {/* Quick Weight Preset Buttons */}
        <div className="flex items-center gap-1.5 pt-1 overflow-x-auto no-scrollbar">
          <span className="text-[10px] font-bold text-slate-400 flex-shrink-0">Presets:</span>
          {weightPresets.map(preset => (
            <button
              key={preset}
              type="button"
              onClick={() => {
                sounds.playTap();
                onChange({ weightKg: preset });
              }}
              className={`px-2 py-1 rounded-lg text-[10px] font-black transition flex-shrink-0 ${
                currentDetails.weightKg === preset
                  ? 'bg-amber-500 text-white shadow-xs'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
              }`}
            >
              {preset} kg
            </button>
          ))}
        </div>
      </div>

      {/* Expandable Transport Details Accordion (Recipient Info & Delivery Notes) */}
      <div className="bg-white dark:bg-slate-900/90 rounded-2xl border border-slate-200 dark:border-slate-700/80 overflow-hidden shadow-xs">
        <button
          type="button"
          onClick={() => {
            sounds.playTap();
            setShowExtendedDetails(!showExtendedDetails);
          }}
          className="w-full p-3 flex items-center justify-between text-left hover:bg-slate-50 dark:hover:bg-slate-800/60 transition"
        >
          <div className="flex items-center gap-2">
            <Sliders className="w-3.5 h-3.5 text-blue-600" />
            <span className="text-xs font-black text-slate-900 dark:text-white">
              Recipient & Drop-off Instructions
            </span>
            {currentDetails.receiverName && (
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            )}
          </div>
          <div className="flex items-center gap-1.5 text-xs text-slate-500 font-bold">
            <span className="text-[10px]">{showExtendedDetails ? 'Hide' : 'Configure'}</span>
            <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${showExtendedDetails ? 'rotate-180' : ''}`} />
          </div>
        </button>

        {showExtendedDetails && (
          <div className="p-3 pt-0 space-y-3 border-t border-slate-100 dark:border-slate-800 animate-in fade-in">
            
            {/* Recipient Name & Phone Input Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 mb-1 flex items-center gap-1">
                  <User className="w-3 h-3 text-slate-400" />
                  <span>Receiver Name</span>
                </label>
                <input
                  type="text"
                  value={currentDetails.receiverName}
                  onChange={(e) => onChange({ receiverName: e.target.value })}
                  placeholder="e.g. Rahul Sharma"
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-900 dark:text-white placeholder-slate-400 outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 mb-1 flex items-center gap-1">
                  <Phone className="w-3 h-3 text-slate-400" />
                  <span>Receiver Mobile</span>
                </label>
                <input
                  type="tel"
                  value={currentDetails.receiverPhone}
                  onChange={(e) => onChange({ receiverPhone: e.target.value })}
                  placeholder="e.g. +91 98480-22334"
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-900 dark:text-white placeholder-slate-400 outline-none focus:border-blue-500"
                />
              </div>
            </div>

            {/* Quick Delivery Notes Preset Chips */}
            <div>
              <label className="block text-[10px] font-bold text-slate-500 mb-1 flex items-center gap-1">
                <FileText className="w-3 h-3 text-slate-400" />
                <span>Delivery Instruction:</span>
              </label>
              
              <div className="flex flex-wrap gap-1 mb-2">
                {[
                  'Leave at Security Gate',
                  'Call on arrival',
                  'Handover directly with OTP',
                  'Do not ring bell'
                ].map(note => (
                  <button
                    key={note}
                    type="button"
                    onClick={() => {
                      sounds.playTap();
                      onChange({ deliveryNote: note });
                    }}
                    className={`px-2 py-1 rounded-lg text-[10px] font-bold transition ${
                      currentDetails.deliveryNote === note
                        ? 'bg-blue-600 text-white shadow-xs'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                    }`}
                  >
                    {note}
                  </button>
                ))}
              </div>

              <input
                type="text"
                value={currentDetails.deliveryNote}
                onChange={(e) => onChange({ deliveryNote: e.target.value })}
                placeholder="Custom drop instructions (e.g. Flat 302, 3rd floor)..."
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-900 dark:text-white placeholder-slate-400 outline-none focus:border-blue-500"
              />
            </div>

            {/* Fragile & Transit Shield Options */}
            <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-2">
              <label 
                className="flex items-center justify-between p-2 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 cursor-pointer"
                onClick={() => {
                  sounds.playTap();
                  onChange({ isFragile: !currentDetails.isFragile });
                }}
              >
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-amber-500/15 text-amber-600 flex items-center justify-center text-sm font-bold">
                    ⚠️
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-900 dark:text-white">Fragile / Sensitive Items</div>
                    <div className="text-[10px] text-slate-400">Driver takes extra care over bumps</div>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={currentDetails.isFragile}
                  onChange={() => {}}
                  className="w-4 h-4 rounded text-amber-500 focus:ring-amber-500"
                />
              </label>

              <div className="flex items-center justify-between p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300/80 dark:border-emerald-700/60">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  <div>
                    <div className="text-xs font-black text-emerald-900 dark:text-emerald-200">
                      ₹5,000 Transit Protection Included
                    </div>
                    <div className="text-[10px] text-emerald-700 dark:text-emerald-400">
                      Real-time OTP handover & live road tracking
                    </div>
                  </div>
                </div>
                <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              </div>
            </div>

          </div>
        )}
      </div>

    </div>
  );
};
