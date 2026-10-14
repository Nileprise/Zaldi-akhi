import React from 'react';

// Crisp Low-Poly Assets (Separate PNGs with transparent background, high-contrast roof/body, Zaldi Z, no baked shadow)
import bikeLowPolyPng from '../assets/images/zaldi_bike_lowpoly.png';
import autoLowPolyPng from '../assets/images/zaldi_auto_lowpoly.png';
import sedanLowPolyPng from '../assets/images/zaldi_sedan_lowpoly.png';
import suvLowPolyPng from '../assets/images/zaldi_suv_lowpoly.png';
import truckLowPolyPng from '../assets/images/zaldi_truck_lowpoly.png';
import parcelLowPolyPng from '../assets/images/zaldi_parcel_lowpoly.png';

// 64px Silhouette Optimized versions
import bikeLowPoly64 from '../assets/images/zaldi_bike_lowpoly_64.png';
import autoLowPoly64 from '../assets/images/zaldi_auto_lowpoly_64.png';
import sedanLowPoly64 from '../assets/images/zaldi_sedan_lowpoly_64.png';
import suvLowPoly64 from '../assets/images/zaldi_suv_lowpoly_64.png';
import truckLowPoly64 from '../assets/images/zaldi_truck_lowpoly_64.png';
import parcelLowPoly64 from '../assets/images/zaldi_parcel_lowpoly_64.png';

/**
 * High-definition Modern Vector Car Chassis SVG - Cab Prime Sedan
 */
export const VectorCabPrime: React.FC<{ className?: string; isSelected?: boolean }> = ({ 
  className = "", 
  isSelected = false 
}) => (
  <svg 
    viewBox="0 0 110 52" 
    className={`w-full h-full filter drop-shadow-[0_4px_8px_rgba(0,102,255,0.28)] transition-transform duration-300 ${isSelected ? 'scale-105' : ''} ${className}`}
  >
    <defs>
      <linearGradient id="vectorCabChassisGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#1E3A8A" />
        <stop offset="25%" stopColor="#2563EB" />
        <stop offset="65%" stopColor="#1D4ED8" />
        <stop offset="100%" stopColor="#0B132B" />
      </linearGradient>
      <linearGradient id="vectorCabGlassGrad" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" stopColor="#93C5FD" stopOpacity="0.9" />
        <stop offset="50%" stopColor="#60A5FA" stopOpacity="0.75" />
        <stop offset="100%" stopColor="#1E40AF" stopOpacity="0.45" />
      </linearGradient>
      <linearGradient id="vectorCabGlossHighlight" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.65" />
        <stop offset="50%" stopColor="#60A5FA" stopOpacity="0.25" />
        <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
      </linearGradient>
    </defs>
    <ellipse cx="55" cy="46" rx="46" ry="4" fill="#000" opacity="0.22" />
    {/* Aerodynamic Sedan Chassis Path */}
    <path 
      d="M 8 36 C 10 40 88 40 95 36 C 99 33 100 28 95 23 L 85 20 L 71 11 C 67 9 37 9 29 14 L 15 21 C 10 23 7 28 8 36 Z" 
      fill="url(#vectorCabChassisGrad)"
      stroke="rgba(255,255,255,0.45)"
      strokeWidth="0.75"
    />
    {/* Specular Aerodynamic Body Highlight Path */}
    <path 
      d="M 12 32 C 28 35 78 35 92 31 C 94 28 92 24 86 22 L 72 13 C 65 11 36 11 30 16 Z" 
      fill="url(#vectorCabGlossHighlight)" 
      opacity="0.45"
    />
    {/* Glass Cabin Roof Path */}
    <path d="M 30 14 L 69 11 L 80 20 L 23 20 Z" fill="url(#vectorCabGlassGrad)" />
    <line x1="50" y1="11" x2="50" y2="20" stroke="#0F172A" strokeWidth="2.5" />
    {/* Headlamp Cluster */}
    <polygon points="8,25 15,23 13,28" fill="#F8FAFC" opacity="0.95" />
    <circle cx="9" cy="25.5" r="1.5" fill="#38BDF8" />
    {/* Alloy Wheels with Chrome Rim */}
    <circle cx="26" cy="37" r="8" fill="#0F172A" />
    <circle cx="26" cy="37" r="5" fill="#E2E8F0" />
    <circle cx="26" cy="37" r="2.5" fill="#2563EB" />
    <circle cx="78" cy="37" r="8" fill="#0F172A" />
    <circle cx="78" cy="37" r="5" fill="#E2E8F0" />
    <circle cx="78" cy="37" r="2.5" fill="#2563EB" />
  </svg>
);

/**
 * High-definition Modern Vector Car Chassis SVG - Zaldi XL SUV
 */
export const VectorZaldiXl: React.FC<{ className?: string; isSelected?: boolean }> = ({ 
  className = "", 
  isSelected = false 
}) => (
  <svg 
    viewBox="0 0 110 52" 
    className={`w-full h-full filter drop-shadow-[0_4px_8px_rgba(147,51,234,0.32)] transition-transform duration-300 ${isSelected ? 'scale-105' : ''} ${className}`}
  >
    <defs>
      <linearGradient id="vectorZaldiXlChassisGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#4C1D95" />
        <stop offset="30%" stopColor="#6D28D9" />
        <stop offset="70%" stopColor="#5B21B6" />
        <stop offset="100%" stopColor="#2E1065" />
      </linearGradient>
      <linearGradient id="vectorZaldiXlRoofGrad" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" stopColor="#DDD6FE" stopOpacity="0.9" />
        <stop offset="50%" stopColor="#A78BFA" stopOpacity="0.7" />
        <stop offset="100%" stopColor="#4C1D95" stopOpacity="0.5" />
      </linearGradient>
      <linearGradient id="vectorZaldiXlGlossHighlight" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.6" />
        <stop offset="60%" stopColor="#C084FC" stopOpacity="0.25" />
        <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
      </linearGradient>
    </defs>
    <ellipse cx="55" cy="47" rx="48" ry="4.5" fill="#000" opacity="0.25" />
    {/* Muscular Bold SUV Chassis Path */}
    <path 
      d="M 6 36 C 8 41 89 41 97 37 C 101 34 102 27 96 21 L 84 17 L 69 7 C 65 5 36 5 28 10 L 13 18 C 8 20 5 27 6 36 Z" 
      fill="url(#vectorZaldiXlChassisGrad)"
      stroke="rgba(255,255,255,0.45)"
      strokeWidth="0.75"
    />
    {/* Muscular SUV Shoulder Line Specular Highlight */}
    <path 
      d="M 10 33 C 25 36 80 36 94 32 C 96 28 93 22 85 19 L 70 9 C 64 7 35 7 28 12 Z" 
      fill="url(#vectorZaldiXlGlossHighlight)" 
      opacity="0.4" 
    />
    {/* Panoramic SUV Roof Cabin Path */}
    <path d="M 29 10 L 68 7 L 79 17 L 22 17 Z" fill="url(#vectorZaldiXlRoofGrad)" />
    <line x1="48" y1="7" x2="48" y2="17" stroke="#1E1B4B" strokeWidth="2.5" />
    <line x1="64" y1="7" x2="64" y2="17" stroke="#1E1B4B" strokeWidth="2" />
    {/* Silver SUV Roof Rails */}
    <rect x="34" y="4" width="32" height="2.5" rx="1" fill="#E2E8F0" />
    <rect x="38" y="6" width="3" height="2" fill="#64748B" />
    <rect x="60" y="6" width="3" height="2" fill="#64748B" />
    {/* Projector LED Headlamps */}
    <polygon points="6,24 13,22 11,27" fill="#F8FAFC" opacity="0.95" />
    <circle cx="8" cy="25" r="1.5" fill="#38BDF8" />
    {/* Multi-Spoke Alloy Wheels */}
    <circle cx="26" cy="38" r="9" fill="#0F172A" />
    <circle cx="26" cy="38" r="6" fill="#CBD5E1" />
    <circle cx="26" cy="38" r="2.5" fill="#7C3AED" />
    <circle cx="78" cy="38" r="9" fill="#0F172A" />
    <circle cx="78" cy="38" r="6" fill="#CBD5E1" />
    <circle cx="78" cy="38" r="2.5" fill="#7C3AED" />
  </svg>
);

/**
 * High-definition Modern Vector Chassis SVG - Bike Moto EV
 */
export const VectorBikeMoto: React.FC<{ className?: string; isSelected?: boolean }> = ({ 
  className = "", 
  isSelected = false 
}) => (
  <svg 
    viewBox="0 0 110 52" 
    className={`w-full h-full filter drop-shadow-[0_4px_8px_rgba(6,182,212,0.32)] transition-transform duration-300 ${isSelected ? 'scale-105' : ''} ${className}`}
  >
    <defs>
      <linearGradient id="vectorBikeCyanGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#0E7490" />
        <stop offset="25%" stopColor="#06B6D4" />
        <stop offset="65%" stopColor="#0891B2" />
        <stop offset="100%" stopColor="#164E63" />
      </linearGradient>
      <linearGradient id="vectorBikeVisorGrad" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" stopColor="#A5F3FC" stopOpacity="0.9" />
        <stop offset="100%" stopColor="#0891B2" stopOpacity="0.45" />
      </linearGradient>
      <linearGradient id="vectorBikeGlossHighlight" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.7" />
        <stop offset="50%" stopColor="#67E8F9" stopOpacity="0.25" />
        <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
      </linearGradient>
    </defs>
    <ellipse cx="55" cy="46" rx="42" ry="3.5" fill="#000" opacity="0.22" />
    
    {/* Motorcycle Frame & Battery Core Path */}
    <path 
      d="M 32 37 L 46 29 L 60 29 L 70 21 L 80 21 L 83 37" 
      stroke="#1E293B" 
      strokeWidth="3.5" 
      strokeLinecap="round" 
      fill="none" 
    />
    
    {/* Aerodynamic Bike Fairing & Tank Chassis Path */}
    <path 
      d="M 22 22 C 30 22 36 28 46 27 C 56 26 64 16 74 15 C 81 15 86 20 88 27 L 78 32 C 73 26 66 25 58 26 C 50 27 40 33 30 33 L 20 27 C 18 24 19 22 22 22 Z" 
      fill="url(#vectorBikeCyanGrad)"
      stroke="rgba(255,255,255,0.45)"
      strokeWidth="0.75"
    />
    
    {/* Specular Aerodynamic Body Highlight Path */}
    <path 
      d="M 24 23 C 34 24 48 25 60 21 C 68 18 76 16 82 20" 
      stroke="url(#vectorBikeGlossHighlight)" 
      strokeWidth="1.2" 
      strokeLinecap="round" 
      fill="none" 
      opacity="0.8" 
    />
    
    {/* Visor & Handlebars */}
    <polygon points="73,15 78,9 84,14 77,17" fill="url(#vectorBikeVisorGrad)" />
    <line x1="74" y1="14" x2="69" y2="10" stroke="#0F172A" strokeWidth="2.5" strokeLinecap="round" />
    <circle cx="68" cy="9" r="1.5" fill="#E2E8F0" />
    
    {/* Electric Neon Battery Pack */}
    <rect x="48" y="27" width="14" height="6" rx="2" fill="#0F172A" />
    <line x1="51" y1="30" x2="59" y2="30" stroke="#22D3EE" strokeWidth="1.5" strokeLinecap="round" />
    
    {/* LED Headlamp */}
    <polygon points="87,25 93,27 89,31" fill="#F0FDFA" opacity="0.95" />
    <circle cx="89.5" cy="27.5" r="1.5" fill="#22D3EE" />
    
    {/* Rear Rider Seat */}
    <path d="M 28 22 C 34 22 40 25 45 27 L 32 29 Z" fill="#0F172A" />
    
    {/* Dual Motorcycle Wheels with Cyan Rim Accents */}
    <circle cx="30" cy="37" r="8.5" fill="#0F172A" />
    <circle cx="30" cy="37" r="5.5" fill="#CBD5E1" />
    <circle cx="30" cy="37" r="3" fill="#06B6D4" />
    <circle cx="30" cy="37" r="1.2" fill="#0F172A" />
    
    <circle cx="82" cy="37" r="8.5" fill="#0F172A" />
    <circle cx="82" cy="37" r="5.5" fill="#CBD5E1" />
    <circle cx="82" cy="37" r="3" fill="#06B6D4" />
    <circle cx="82" cy="37" r="1.2" fill="#0F172A" />
  </svg>
);

/**
 * High-definition Modern Vector Chassis SVG - Auto 3W TukTuk
 */
export const VectorAutoTukTuk: React.FC<{ className?: string; isSelected?: boolean }> = ({ 
  className = "", 
  isSelected = false 
}) => (
  <svg 
    viewBox="0 0 110 52" 
    className={`w-full h-full filter drop-shadow-[0_4px_8px_rgba(245,158,11,0.32)] transition-transform duration-300 ${isSelected ? 'scale-105' : ''} ${className}`}
  >
    <defs>
      <linearGradient id="vectorAutoAmberGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#B45309" />
        <stop offset="25%" stopColor="#F59E0B" />
        <stop offset="65%" stopColor="#D97706" />
        <stop offset="100%" stopColor="#78350F" />
      </linearGradient>
      <linearGradient id="vectorAutoCanopyGrad" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" stopColor="#334155" />
        <stop offset="100%" stopColor="#0F172A" />
      </linearGradient>
      <linearGradient id="vectorAutoGlassGrad" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" stopColor="#FEF08A" stopOpacity="0.85" />
        <stop offset="50%" stopColor="#CBD5E1" stopOpacity="0.7" />
        <stop offset="100%" stopColor="#1E293B" stopOpacity="0.4" />
      </linearGradient>
      <linearGradient id="vectorAutoGlossHighlight" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.65" />
        <stop offset="50%" stopColor="#FDE68A" stopOpacity="0.25" />
        <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
      </linearGradient>
    </defs>
    <ellipse cx="55" cy="46" rx="44" ry="4" fill="#000" opacity="0.22" />
    
    {/* TukTuk Lower Body Chassis Path */}
    <path 
      d="M 14 36 C 16 40 86 40 93 36 C 96 33 97 28 92 23 L 83 20 L 76 11 C 72 9 32 9 22 13 L 13 22 C 10 25 11 30 14 36 Z" 
      fill="url(#vectorAutoAmberGrad)"
      stroke="rgba(255,255,255,0.45)"
      strokeWidth="0.75"
    />
    
    {/* Specular Aerodynamic Body Highlight Path */}
    <path 
      d="M 16 33 C 28 35 78 35 90 31 C 92 28 89 23 83 21 L 70 13 C 62 11 34 11 25 15 Z" 
      fill="url(#vectorAutoGlossHighlight)" 
      opacity="0.4" 
    />
    
    {/* Dark Canopy Curved Roof */}
    <path 
      d="M 20 13 C 32 10 68 10 76 12 L 78 19 L 18 19 Z" 
      fill="url(#vectorAutoCanopyGrad)" 
      stroke="#0F172A" 
      strokeWidth="0.5" 
    />
    
    {/* Front Windshield Path */}
    <path d="M 74 13 L 86 21 L 77 22 L 67 13 Z" fill="url(#vectorAutoGlassGrad)" />
    <line x1="76" y1="13" x2="76" y2="22" stroke="#0F172A" strokeWidth="1.5" />
    
    {/* Open Passenger Cabin Frame & Yellow Safety Rail */}
    <rect x="26" y="19" width="36" height="13" fill="#1E293B" opacity="0.85" rx="1" />
    <rect x="30" y="22" width="12" height="10" fill="#0F172A" rx="1" />
    <line x1="48" y1="19" x2="48" y2="32" stroke="#F59E0B" strokeWidth="2" strokeLinecap="round" />
    <line x1="28" y1="28" x2="58" y2="28" stroke="#F59E0B" strokeWidth="1.2" strokeLinecap="round" />
    
    {/* Headlamp Cluster with Amber Marker */}
    <polygon points="91,25 97,26 94,30" fill="#FFFBEB" opacity="0.95" />
    <circle cx="94" cy="27" r="1.5" fill="#F59E0B" />
    
    {/* Front Single Fork Wheel */}
    <circle cx="83" cy="37" r="7.5" fill="#0F172A" />
    <circle cx="83" cy="37" r="4.5" fill="#E2E8F0" />
    <circle cx="83" cy="37" r="2" fill="#D97706" />
    
    {/* Rear Wheels with Amber Rims */}
    <circle cx="28" cy="37" r="8" fill="#0F172A" />
    <circle cx="28" cy="37" r="5" fill="#E2E8F0" />
    <circle cx="28" cy="37" r="2.5" fill="#D97706" />
  </svg>
);

/**
 * High-definition Modern Vector Chassis SVG - Mini Truck (Zaldi Haul)
 */
export const VectorMiniTruck: React.FC<{ className?: string; isSelected?: boolean }> = ({ 
  className = "", 
  isSelected = false 
}) => (
  <svg 
    viewBox="0 0 110 52" 
    className={`w-full h-full filter drop-shadow-[0_4px_8px_rgba(79,70,229,0.32)] transition-transform duration-300 ${isSelected ? 'scale-105' : ''} ${className}`}
  >
    <defs>
      <linearGradient id="vectorTruckIndigoGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#312E81" />
        <stop offset="25%" stopColor="#4F46E5" />
        <stop offset="65%" stopColor="#4338CA" />
        <stop offset="100%" stopColor="#1E1B4B" />
      </linearGradient>
      <linearGradient id="vectorTruckBedGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#475569" />
        <stop offset="50%" stopColor="#64748B" />
        <stop offset="100%" stopColor="#334155" />
      </linearGradient>
      <linearGradient id="vectorTruckGlassGrad" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" stopColor="#C7D2FE" stopOpacity="0.9" />
        <stop offset="50%" stopColor="#818CF8" stopOpacity="0.7" />
        <stop offset="100%" stopColor="#312E81" stopOpacity="0.45" />
      </linearGradient>
      <linearGradient id="vectorTruckGlossHighlight" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.6" />
        <stop offset="50%" stopColor="#A5B4FC" stopOpacity="0.2" />
        <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
      </linearGradient>
    </defs>
    <ellipse cx="55" cy="47" rx="48" ry="4" fill="#000" opacity="0.24" />
    
    {/* Rear Cargo Flatbed Box */}
    <rect x="8" y="18" width="56" height="18" rx="2" fill="url(#vectorTruckBedGrad)" stroke="#1E293B" strokeWidth="0.75" />
    <line x1="8" y1="23" x2="64" y2="23" stroke="#94A3B8" strokeWidth="1" opacity="0.6" />
    <line x1="8" y1="28" x2="64" y2="28" stroke="#94A3B8" strokeWidth="1" opacity="0.6" />
    {/* Cargo Tie-Down Hooks */}
    <circle cx="16" cy="23" r="1" fill="#CBD5E1" />
    <circle cx="36" cy="23" r="1" fill="#CBD5E1" />
    <circle cx="56" cy="23" r="1" fill="#CBD5E1" />
    
    {/* Front Commercial Driver Cab Chassis Path */}
    <path 
      d="M 62 36 L 94 36 C 98 34 99 28 95 22 L 87 18 L 76 8 C 72 7 65 7 62 8 Z" 
      fill="url(#vectorTruckIndigoGrad)"
      stroke="rgba(255,255,255,0.45)"
      strokeWidth="0.75"
    />
    
    {/* Specular Cab Highlight Path */}
    <path 
      d="M 64 33 L 92 33 C 94 30 92 24 86 20 L 77 10 L 64 10 Z" 
      fill="url(#vectorTruckGlossHighlight)" 
      opacity="0.35" 
    />
    
    {/* Upright Front Windscreen */}
    <polygon points="65,9 75,9 85,19 65,19" fill="url(#vectorTruckGlassGrad)" />
    <line x1="75" y1="9" x2="75" y2="19" stroke="#1E1B4B" strokeWidth="1.5" />
    
    {/* Commercial Front Bumper & High-Mount Headlamp */}
    <rect x="94" y="32" width="6" height="5" rx="1.5" fill="#0F172A" />
    <polygon points="93,22 98,23 96,27" fill="#FFFFFF" opacity="0.95" />
    <circle cx="95" cy="24" r="1.5" fill="#818CF8" />
    
    {/* Heavy-Duty Steel Rims & Tires */}
    <circle cx="28" cy="38" r="8.5" fill="#0F172A" />
    <circle cx="28" cy="38" r="5.5" fill="#CBD5E1" />
    <circle cx="28" cy="38" r="2.5" fill="#4F46E5" />
    
    <circle cx="80" cy="38" r="8.5" fill="#0F172A" />
    <circle cx="80" cy="38" r="5.5" fill="#CBD5E1" />
    <circle cx="80" cy="38" r="2.5" fill="#4F46E5" />
  </svg>
);

/**
 * High-definition Modern Vector Chassis SVG - Parcel Express
 */
export const VectorParcelExpress: React.FC<{ className?: string; isSelected?: boolean }> = ({ 
  className = "", 
  isSelected = false 
}) => (
  <svg 
    viewBox="0 0 110 52" 
    className={`w-full h-full filter drop-shadow-[0_4px_8px_rgba(16,185,129,0.32)] transition-transform duration-300 ${isSelected ? 'scale-105' : ''} ${className}`}
  >
    <defs>
      <linearGradient id="vectorParcelEmeraldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#065F46" />
        <stop offset="30%" stopColor="#10B981" />
        <stop offset="70%" stopColor="#059669" />
        <stop offset="100%" stopColor="#022C22" />
      </linearGradient>
      <linearGradient id="vectorParcelGlassGrad" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" stopColor="#A7F3D0" stopOpacity="0.85" />
        <stop offset="100%" stopColor="#047857" stopOpacity="0.45" />
      </linearGradient>
    </defs>
    <ellipse cx="55" cy="46" rx="46" ry="4" fill="#000" opacity="0.22" />
    {/* Van / Delivery Box Body */}
    <path 
      d="M 10 36 C 12 40 88 40 95 36 C 98 33 99 27 94 21 L 82 17 L 70 8 C 66 7 20 7 14 10 L 10 18 Z" 
      fill="url(#vectorParcelEmeraldGrad)"
      stroke="rgba(255,255,255,0.45)"
      strokeWidth="0.75"
    />
    {/* Windshield */}
    <polygon points="68,9 79,17 68,17" fill="url(#vectorParcelGlassGrad)" />
    {/* Lightning Bolt Fast Badge on Side */}
    <polygon points="44,14 36,22 42,22 38,30 50,20 44,20" fill="#FDE047" opacity="0.9" />
    {/* Wheels */}
    <circle cx="28" cy="37" r="8" fill="#0F172A" />
    <circle cx="28" cy="37" r="5" fill="#E2E8F0" />
    <circle cx="28" cy="37" r="2.5" fill="#10B981" />
    <circle cx="78" cy="37" r="8" fill="#0F172A" />
    <circle cx="78" cy="37" r="5" fill="#E2E8F0" />
    <circle cx="78" cy="37" r="2.5" fill="#10B981" />
  </svg>
);

/**
 * Universal Vector SVG Renderer for all Vehicle Tiers
 */
export const renderVectorVehicleSvg = (type: string, isSelected = false, className = "") => {
  const t = (type || '').toUpperCase();
  if (t.includes('BIKE') || t.includes('MOTO') || t.includes('🏍')) {
    return <VectorBikeMoto isSelected={isSelected} className={className} />;
  }
  if (t.includes('AUTO') || t.includes('3W') || t.includes('🛺') || t.includes('TUKTUK')) {
    return <VectorAutoTukTuk isSelected={isSelected} className={className} />;
  }
  if (t.includes('TRUCK') || t.includes('HAUL') || t.includes('CARGO') || t.includes('🚚')) {
    return <VectorMiniTruck isSelected={isSelected} className={className} />;
  }
  if (t.includes('PARCEL') || t.includes('PACKAGE') || t.includes('BOX') || t.includes('📦')) {
    return <VectorParcelExpress isSelected={isSelected} className={className} />;
  }
  if (t.includes('PREMIUM') || t.includes('XL') || t.includes('SUV') || t.includes('INNOVA') || t.includes('🚙')) {
    return <VectorZaldiXl isSelected={isSelected} className={className} />;
  }
  return <VectorCabPrime isSelected={isSelected} className={className} />;
};

// Legacy high-res photoreal fallbacks
import bikePhotoreal from '../assets/images/bike_3d_transparent.png';
import autoPhotoreal from '../assets/images/auto_3d_transparent.png';
import cabPhotoreal from '../assets/images/cab_3d_transparent.png';
import suvPhotoreal from '../assets/images/suv_3d_transparent.png';
import truckPhotoreal from '../assets/images/truck_3d_transparent.png';
import parcelPhotoreal from '../assets/images/parcel_3d_transparent.png';
import destinationImg from '../assets/images/destination_3d_transparent.png';

export type VehicleTierType = 'BIKE' | 'AUTO' | 'CAB' | 'PREMIUM' | 'TRUCK' | 'PARCEL' | string;

export interface VehicleThemeConfig {
  glowColor: string;
  glowShadow: string;
  badgeBg: string;
  badgeText: string;
  highlightGradient: string;
  label: string;
  lowPolyPng: string;
  lowPoly64: string;
  photorealPng: string;
  glbModelPath: string;
}

export const VEHICLE_5D_THEMES: Record<string, VehicleThemeConfig> = {
  BIKE: {
    glowColor: 'rgba(6, 182, 212, 0.55)',
    glowShadow: '0 8px 24px -2px rgba(6, 182, 212, 0.45)',
    badgeBg: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30',
    badgeText: 'text-cyan-400',
    highlightGradient: 'from-cyan-400/25 via-transparent to-transparent',
    label: 'Zaldi Moto EV',
    lowPolyPng: bikePhotoreal,
    lowPoly64: bikePhotoreal,
    photorealPng: bikePhotoreal,
    glbModelPath: '/models/zaldi-bike-lowpoly.glb'
  },
  AUTO: {
    glowColor: 'rgba(245, 158, 11, 0.55)',
    glowShadow: '0 8px 24px -2px rgba(245, 158, 11, 0.45)',
    badgeBg: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
    badgeText: 'text-amber-400',
    highlightGradient: 'from-amber-400/25 via-transparent to-transparent',
    label: 'Zaldi TukTuk 3W',
    lowPolyPng: autoPhotoreal,
    lowPoly64: autoPhotoreal,
    photorealPng: autoPhotoreal,
    glbModelPath: '/models/zaldi-auto-lowpoly.glb'
  },
  CAB: {
    glowColor: 'rgba(59, 130, 246, 0.55)',
    glowShadow: '0 8px 24px -2px rgba(59, 130, 246, 0.45)',
    badgeBg: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    badgeText: 'text-blue-400',
    highlightGradient: 'from-blue-400/25 via-transparent to-transparent',
    label: 'Zaldi Go Sedan',
    lowPolyPng: sedanLowPolyPng,
    lowPoly64: sedanLowPoly64,
    photorealPng: cabPhotoreal,
    glbModelPath: '/models/zaldi-sedan-lowpoly.glb'
  },
  PREMIUM: {
    glowColor: 'rgba(168, 85, 247, 0.6)',
    glowShadow: '0 8px 24px -2px rgba(168, 85, 247, 0.5)',
    badgeBg: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
    badgeText: 'text-purple-400',
    highlightGradient: 'from-purple-400/25 via-transparent to-transparent',
    label: 'Zaldi Prime SUV',
    lowPolyPng: suvLowPolyPng,
    lowPoly64: suvLowPoly64,
    photorealPng: suvPhotoreal,
    glbModelPath: '/models/zaldi-suv-lowpoly.glb'
  },
  TRUCK: {
    glowColor: 'rgba(99, 102, 241, 0.55)',
    glowShadow: '0 8px 24px -2px rgba(99, 102, 241, 0.45)',
    badgeBg: 'bg-indigo-500/20 text-indigo-400 border-indigo-500/30',
    badgeText: 'text-indigo-400',
    highlightGradient: 'from-indigo-400/25 via-transparent to-transparent',
    label: 'Zaldi Haul Mini-Truck',
    lowPolyPng: truckLowPolyPng,
    lowPoly64: truckLowPoly64,
    photorealPng: truckPhotoreal,
    glbModelPath: '/models/zaldi-truck-lowpoly.glb'
  },
  PARCEL: {
    glowColor: 'rgba(16, 185, 129, 0.55)',
    glowShadow: '0 8px 24px -2px rgba(16, 185, 129, 0.45)',
    badgeBg: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
    badgeText: 'text-emerald-400',
    highlightGradient: 'from-emerald-400/25 via-transparent to-transparent',
    label: 'Zaldi Express Parcel',
    lowPolyPng: parcelLowPolyPng,
    lowPoly64: parcelLowPoly64,
    photorealPng: parcelPhotoreal,
    glbModelPath: '/models/zaldi-parcel-lowpoly.glb'
  }
};

export const getVehicleTheme = (type: string): VehicleThemeConfig => {
  const t = type.toUpperCase();
  if (t.includes('BIKE') || t.includes('MOTO') || t.includes('🏍')) return VEHICLE_5D_THEMES.BIKE;
  if (t.includes('AUTO') || t.includes('3W') || t.includes('🛺')) return VEHICLE_5D_THEMES.AUTO;
  if (t.includes('PREMIUM') || t.includes('SUV') || t.includes('XL') || t.includes('🚙')) return VEHICLE_5D_THEMES.PREMIUM;
  if (t.includes('TRUCK') || t.includes('HAUL') || t.includes('CARGO') || t.includes('🚚')) return VEHICLE_5D_THEMES.TRUCK;
  if (t.includes('PARCEL') || t.includes('PACKAGE') || t.includes('BOX') || t.includes('📦')) return VEHICLE_5D_THEMES.PARCEL;
  return VEHICLE_5D_THEMES.CAB;
};

export const getVehicleImageSrc = (type: string, isSmall = false): string => {
  const theme = getVehicleTheme(type);
  return isSmall ? theme.lowPoly64 : theme.lowPolyPng;
};

interface Vehicle5dIconProps {
  type: VehicleTierType;
  size?: number;
  className?: string;
  heading?: number;
  isSelected?: boolean;
  isHovered?: boolean;
  showAura?: boolean;
}

/**
 * 5D Modern Vehicle Icon Component with Low-Poly Geometry
 * - Strong silhouette readable at 32-64px
 * - High-contrast roof/body
 * - Zaldi Z visible without overwhelming
 * - Transparent background (NO baked ground/shadow)
 * - Dynamic ground contact shadow & tier neon aura
 * - Rotation-ready for real-time map movement
 */
export const Vehicle5dIcon: React.FC<Vehicle5dIconProps> = ({
  type,
  size = 48,
  className = "",
  heading = 0,
  isSelected = false,
  showAura = true
}) => {
  const theme = getVehicleTheme(type);
  const isSmall = size <= 48;
  const src = isSmall ? theme.lowPoly64 : theme.lowPolyPng;

  return (
    <div 
      className={`relative inline-flex items-center justify-center select-none group transition-all duration-300 ${className}`}
      style={{ 
        width: size, 
        height: size,
        perspective: '800px'
      }}
    >
      {/* Dynamic Tier Neon Underglow Aura (zero baked shadow in PNG) */}
      {showAura && (
        <div 
          className={`absolute bottom-0 w-[85%] h-[30%] rounded-full blur-md transition-all duration-300 pointer-events-none ${
            isSelected ? 'opacity-90 scale-125' : 'opacity-35 group-hover:opacity-70'
          }`}
          style={{
            backgroundColor: theme.glowColor,
            boxShadow: isSelected ? theme.glowShadow : undefined
          }}
        />
      )}

      {/* Dynamic Contact Occlusion Shadow beneath wheels */}
      <div 
        className={`absolute bottom-0.5 w-[75%] h-[18%] bg-black/60 rounded-full blur-[2px] transition-all duration-300 pointer-events-none ${
          isSelected ? 'scale-90 opacity-40' : 'scale-100 opacity-60'
        }`}
      />

      {/* Low-Poly / Vector 3D Cutout with Float & Rotation */}
      <div 
        className={`relative w-full h-full flex items-center justify-center transition-all duration-300 ease-out ${
          isSelected 
            ? '-translate-y-2 scale-110' 
            : 'group-hover:-translate-y-1 group-hover:scale-105'
        }`}
        style={{
          transformStyle: 'preserve-3d',
          transform: heading ? `rotate(${heading}deg)` : undefined
        }}
      >
        {renderVectorVehicleSvg(type, isSelected)}
      </div>

      {/* Selected 5D Energy Pulse Halo */}
      {isSelected && (
        <div 
          className="absolute -inset-1 rounded-full border border-white/40 pointer-events-none animate-ping opacity-30"
          style={{ borderColor: theme.glowColor }}
        />
      )}
    </div>
  );
};

interface LiveMap5dVehicleMarkerProps {
  type: string;
  size?: number;
  heading?: number;
  label?: string;
  className?: string;
}

/**
 * Live Map Low-Poly Vehicle Marker
 * - Clean silhouette readable at 32-64px
 * - Dynamic heading rotation along real-time road coordinates
 * - Dynamic headlight projection beam & contact shadow on road
 * - High-contrast roof/body for instant recognition from map view
 */
export const LiveMap5dVehicleMarker: React.FC<LiveMap5dVehicleMarkerProps> = ({
  type,
  size = 38,
  heading = 0,
  label,
  className = ""
}) => {
  const theme = getVehicleTheme(type);
  const src = size <= 48 ? theme.lowPoly64 : theme.lowPolyPng;

  return (
    <div className={`relative flex flex-col items-center pointer-events-none select-none ${className}`}>
      
      {/* Rotatable Vehicle on Road */}
      <div 
        className="relative transition-transform duration-300 ease-linear flex items-center justify-center"
        style={{
          width: size,
          height: size,
          transform: `rotate(${heading}deg)`
        }}
      >
        {/* Dynamic Forward Headlight Projection Beam on Road */}
        <div 
          className="absolute -top-3 left-1/2 -translate-x-1/2 w-6 h-6 bg-amber-200/35 blur-[2px] rounded-full pointer-events-none"
          style={{ clipPath: 'polygon(50% 100%, 0 0, 100% 0)' }}
        />

        {/* Ambient Road Underglow */}
        <div 
          className="absolute inset-1 rounded-full blur-[2.5px] pointer-events-none opacity-40"
          style={{ backgroundColor: theme.glowColor }}
        />

        {/* Low-Poly or Vector Vehicle Cutout - Forward oriented so headlights lead forward */}
        <div className="w-full h-full flex items-center justify-center scale-110">
          <div className={
            (type || '').toUpperCase().includes('BIKE') || (type || '').toUpperCase().includes('AUTO')
              ? '-rotate-90 w-full h-full flex items-center justify-center'
              : 'rotate-90 w-full h-full flex items-center justify-center'
          }>
            {renderVectorVehicleSvg(type, false, "w-full h-full")}
          </div>
        </div>
      </div>

      {/* Dynamic contact shadow under wheels */}
      <div 
        className="w-6 h-1.5 bg-black/55 rounded-full blur-[1.5px] -mt-0.5 pointer-events-none" 
      />

      {/* Optional Vehicle Plate / Name Label */}
      {label && (
        <span className="mt-0.5 px-1.5 py-0.2 rounded-md bg-slate-900/90 border border-slate-700/60 text-[8px] font-black text-slate-100 shadow-md whitespace-nowrap">
          {label}
        </span>
      )}
    </div>
  );
};

interface Destination5dPinProps {
  className?: string;
  size?: number;
  showBadge?: boolean;
  address?: string;
}

/**
 * Destination 5D Pin Marker
 */
export const Destination5dPin: React.FC<Destination5dPinProps> = ({
  className = "",
  size = 38,
  showBadge = true,
  address
}) => {
  return (
    <div className={`relative flex flex-col items-center pointer-events-none select-none ${className}`}>
      
      {/* Floating Destination Badge */}
      {showBadge && address && (
        <div className="mb-1 px-2.5 py-0.5 rounded-full bg-slate-900/90 backdrop-blur-md border border-rose-500/60 text-white text-[10px] font-bold shadow-lg flex items-center gap-1.5 animate-in fade-in max-w-[200px]">
          <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse flex-shrink-0" />
          <span className="truncate">{address}</span>
        </div>
      )}

      {/* Destination Pin */}
      <div className="relative flex flex-col items-center">
        <div className="absolute inset-0 bg-rose-500/30 blur-md rounded-full pointer-events-none" />
        <img
          src={destinationImg}
          alt="Destination Flag Pin"
          className="object-contain filter drop-shadow-[0_6px_14px_rgba(239,68,68,0.5)]"
          style={{ width: size, height: size }}
        />
        <div className="w-2.5 h-2.5 rounded-full bg-rose-500 border-2 border-white shadow-[0_0_8px_#ef4444] -mt-1" />
        <div className="w-4 h-1 bg-black/50 rounded-full blur-[1px] mt-0.5" />
      </div>

    </div>
  );
};
