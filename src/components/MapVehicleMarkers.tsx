import React from 'react';

interface VehicleMarkerProps {
  bearing?: number;
  type?: 'BIKE' | 'AUTO' | 'CAB' | 'TRUCK' | string;
  isOnline?: boolean;
}

/**
 * Small, clean 3D/modern vehicle markers for ride-hailing maps.
 * Compact (24-28px), accurately oriented to road heading,
 * with contact shadow, directional light cone, and clean vector details.
 */

// 1. 🏍️ 3D Modern Motorbike Marker
export const ModernBikeMarker: React.FC<{ bearing?: number }> = ({ bearing = 0 }) => (
  <div 
    className="relative flex items-center justify-center pointer-events-none select-none transition-transform duration-200"
    style={{ transform: `rotate(${bearing}deg)` }}
  >
    {/* Soft directional headlight beam */}
    <div className="absolute -top-3.5 w-4 h-6 bg-gradient-to-t from-sky-400/40 to-transparent blur-[2px] rounded-full pointer-events-none" />
    
    {/* Contact ground shadow */}
    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-6 h-7 bg-black/50 rounded-full blur-[2px]" />

    {/* Vector Modern 3D Bike */}
    <svg width="24" height="28" viewBox="0 0 24 28" fill="none" className="relative z-10 drop-shadow-[0_2px_5px_rgba(0,0,0,0.6)]">
      {/* Front tire */}
      <rect x="10.5" y="1" width="3" height="6" rx="1.5" fill="#0f172a" stroke="#475569" strokeWidth="0.6" />
      {/* Front fork & handlebars */}
      <path d="M 6.5 8 L 17.5 8" stroke="#cbd5e1" strokeWidth="1.5" strokeLinecap="round" />
      <circle cx="6.5" cy="8" r="1.2" fill="#38bdf8" />
      <circle cx="17.5" cy="8" r="1.2" fill="#38bdf8" />
      {/* Bike Chassis / Fuel tank (vibrant blue) */}
      <path d="M 9.5 8 L 14.5 8 L 14 15 L 10 15 Z" fill="#0284c7" />
      {/* Rider Helmet (top-down 3D sphere) */}
      <ellipse cx="12" cy="12" rx="3.5" ry="4" fill="#0f172a" stroke="#38bdf8" strokeWidth="1" />
      <ellipse cx="12" cy="10.5" rx="2.5" ry="1.2" fill="#38bdf8" opacity="0.9" />
      <circle cx="10.5" cy="11.5" r="0.8" fill="#ffffff" opacity="0.6" />
      {/* Rider jacket / shoulders */}
      <path d="M 6.5 14 Q 12 16.5 17.5 14 L 16 19 Q 12 20 8 19 Z" fill="#1e293b" opacity="0.95" />
      {/* Rear seat */}
      <rect x="10" y="18" width="4" height="5" rx="1" fill="#334155" />
      {/* Rear red tail light */}
      <rect x="10.5" y="23" width="3" height="1.5" rx="0.5" fill="#ef4444" />
      {/* Rear tire */}
      <rect x="10.5" y="22" width="3" height="5" rx="1.5" fill="#0f172a" />
    </svg>
  </div>
);

// 2. 🛺 Modern Auto 3W Marker
export const ModernAutoMarker: React.FC<{ bearing?: number }> = ({ bearing = 0 }) => (
  <div 
    className="relative flex items-center justify-center pointer-events-none select-none transition-transform duration-200"
    style={{ transform: `rotate(${bearing}deg)` }}
  >
    {/* Headlight beam */}
    <div className="absolute -top-3.5 w-4 h-6 bg-gradient-to-t from-amber-300/35 to-transparent blur-[2px] rounded-full pointer-events-none" />
    
    {/* Shadow */}
    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-6 h-7 bg-black/50 rounded-full blur-[2px]" />

    <svg width="24" height="28" viewBox="0 0 24 28" fill="none" className="relative z-10 drop-shadow-[0_2px_5px_rgba(0,0,0,0.6)]">
      {/* Front single wheel */}
      <rect x="10.5" y="1.5" width="3" height="5" rx="1.2" fill="#0f172a" />
      {/* Front yellow hood */}
      <path d="M 12 1.5 L 16 7 L 8 7 Z" fill="#eab308" />
      <circle cx="12" cy="1.5" r="1.2" fill="#fef08a" />
      {/* Windshield */}
      <rect x="7" y="7" width="10" height="3" rx="1" fill="#38bdf8" opacity="0.85" />
      {/* Yellow classic roof */}
      <rect x="6" y="10" width="12" height="13" rx="2" fill="#eab308" stroke="#ca8a04" strokeWidth="0.8" />
      {/* Green body stripe */}
      <rect x="6" y="13.5" width="12" height="6.5" fill="#15803d" />
      {/* Rear dual wheels */}
      <rect x="4" y="17" width="2" height="5.5" rx="1" fill="#0f172a" />
      <rect x="18" y="17" width="2" height="5.5" rx="1" fill="#0f172a" />
      {/* Rear bumper & red lights */}
      <rect x="6.5" y="23" width="11" height="2" rx="0.5" fill="#1e293b" />
      <circle cx="8" cy="24" r="0.8" fill="#ef4444" />
      <circle cx="16" cy="24" r="0.8" fill="#ef4444" />
    </svg>
  </div>
);

// 3. 🚕 Modern Cab Sedan Marker
export const ModernCabMarker: React.FC<{ bearing?: number }> = ({ bearing = 0 }) => (
  <div 
    className="relative flex items-center justify-center pointer-events-none select-none transition-transform duration-200"
    style={{ transform: `rotate(${bearing}deg)` }}
  >
    {/* Dual headlights beam */}
    <div className="absolute -top-3.5 w-5 h-6 bg-gradient-to-t from-yellow-300/35 to-transparent blur-[2px] rounded-full pointer-events-none" />
    
    {/* Shadow */}
    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-6 h-8 bg-black/50 rounded-full blur-[2px]" />

    <svg width="24" height="30" viewBox="0 0 24 30" fill="none" className="relative z-10 drop-shadow-[0_2px_5px_rgba(0,0,0,0.6)]">
      {/* Sedan chassis */}
      <rect x="5.5" y="3" width="13" height="24" rx="3.5" fill="#f8fafc" stroke="#94a3b8" strokeWidth="0.8" />
      {/* Front hood headlights */}
      <circle cx="7.5" cy="4" r="1.2" fill="#fef08a" />
      <circle cx="16.5" cy="4" r="1.2" fill="#fef08a" />
      {/* Front Windshield */}
      <path d="M 7 9 L 17 9 L 16 12 L 8 12 Z" fill="#38bdf8" opacity="0.85" />
      {/* Black/Yellow Roof with Taxi Beacon */}
      <rect x="7.5" y="12" width="9" height="7" rx="1.5" fill="#0f172a" />
      <rect x="9.5" y="14" width="5" height="2.5" rx="0.5" fill="#eab308" stroke="#ffffff" strokeWidth="0.4" />
      {/* Rear Windshield */}
      <path d="M 8 19 L 16 19 L 17 22 L 7 22 Z" fill="#38bdf8" opacity="0.85" />
      {/* Dual Red Tail lights */}
      <rect x="6.5" y="26" width="2.5" height="1.2" rx="0.4" fill="#ef4444" />
      <rect x="15" y="26" width="2.5" height="1.2" rx="0.4" fill="#ef4444" />
      {/* 4 Wheels */}
      <rect x="4" y="6" width="1.8" height="4.5" rx="0.8" fill="#0f172a" />
      <rect x="18.2" y="6" width="1.8" height="4.5" rx="0.8" fill="#0f172a" />
      <rect x="4" y="19" width="1.8" height="4.5" rx="0.8" fill="#0f172a" />
      <rect x="18.2" y="19" width="1.8" height="4.5" rx="0.8" fill="#0f172a" />
    </svg>
  </div>
);

// 4. 🚚 Modern Mini Truck Marker
export const ModernTruckMarker: React.FC<{ bearing?: number }> = ({ bearing = 0 }) => (
  <div 
    className="relative flex items-center justify-center pointer-events-none select-none transition-transform duration-200"
    style={{ transform: `rotate(${bearing}deg)` }}
  >
    {/* Headlights beam */}
    <div className="absolute -top-3.5 w-5 h-6 bg-gradient-to-t from-sky-300/35 to-transparent blur-[2px] rounded-full pointer-events-none" />
    
    {/* Shadow */}
    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-7 h-9 bg-black/50 rounded-full blur-[2px]" />

    <svg width="26" height="32" viewBox="0 0 26 32" fill="none" className="relative z-10 drop-shadow-[0_2px_5px_rgba(0,0,0,0.6)]">
      {/* Truck Cabin */}
      <rect x="6" y="2" width="14" height="9" rx="2" fill="#f8fafc" stroke="#cbd5e1" strokeWidth="0.8" />
      {/* Windshield */}
      <rect x="7.5" y="4" width="11" height="4" rx="1" fill="#38bdf8" opacity="0.85" />
      {/* Cargo Bed (Blue/Steel) */}
      <rect x="5.5" y="11" width="15" height="17" rx="1.5" fill="#1e3a8a" stroke="#1d4ed8" strokeWidth="0.8" />
      {/* Cargo payload ribs */}
      <line x1="8" y1="14" x2="18" y2="14" stroke="#3b82f6" strokeWidth="1" />
      <line x1="8" y1="18" x2="18" y2="18" stroke="#3b82f6" strokeWidth="1" />
      <line x1="8" y1="22" x2="18" y2="22" stroke="#3b82f6" strokeWidth="1" />
      {/* Tail lights */}
      <rect x="6.5" y="27.5" width="2.5" height="1" fill="#ef4444" />
      <rect x="17" y="27.5" width="2.5" height="1" fill="#ef4444" />
      {/* 4 Heavy Duty Wheels */}
      <rect x="4" y="4" width="2.2" height="5" rx="1" fill="#0f172a" />
      <rect x="19.8" y="4" width="2.2" height="5" rx="1" fill="#0f172a" />
      <rect x="4" y="20" width="2.2" height="6" rx="1" fill="#0f172a" />
      <rect x="19.8" y="20" width="2.2" height="6" rx="1" fill="#0f172a" />
    </svg>
  </div>
);

// Generic Unified Vehicle Marker Switcher
export const ModernVehicleMarker: React.FC<VehicleMarkerProps> = ({ 
  bearing = 0, 
  type = 'BIKE' 
}) => {
  const norm = String(type).toUpperCase();
  if (norm.includes('BIKE') || norm.includes('MOTO') || norm.includes('🏍')) {
    return <ModernBikeMarker bearing={bearing} />;
  }
  if (norm.includes('AUTO') || norm.includes('3W') || norm.includes('🛺')) {
    return <ModernAutoMarker bearing={bearing} />;
  }
  if (norm.includes('TRUCK') || norm.includes('CARGO') || norm.includes('🚚')) {
    return <ModernTruckMarker bearing={bearing} />;
  }
  return <ModernCabMarker bearing={bearing} />;
};
