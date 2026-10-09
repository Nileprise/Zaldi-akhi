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
    lowPolyPng: bikeLowPolyPng,
    lowPoly64: bikeLowPoly64,
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
    lowPolyPng: autoLowPolyPng,
    lowPoly64: autoLowPoly64,
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

      {/* Low-Poly 3D Cutout with Float & Rotation */}
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
        <img
          src={src}
          alt={theme.label}
          className="w-full h-full object-contain pointer-events-none filter drop-shadow-[0_4px_8px_rgba(0,0,0,0.65)]"
          onError={(e) => {
            // Fallback to photoreal if low-poly image has issue
            e.currentTarget.src = theme.photorealPng;
          }}
        />
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

        {/* Low-Poly Vehicle Cutout */}
        <img
          src={src}
          alt={theme.label}
          className="w-full h-full object-contain filter drop-shadow-[0_4px_8px_rgba(0,0,0,0.7)]"
          style={{ transform: 'scale(1.1)' }}
        />
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
