import React from 'react';
import bikeImg from '../assets/images/bike_3d_transparent.png';
import autoImg from '../assets/images/auto_3d_transparent.png';
import cabImg from '../assets/images/cab_3d_transparent.png';
import suvImg from '../assets/images/suv_3d_transparent.png';
import truckImg from '../assets/images/truck_3d_transparent.png';
import parcelImg from '../assets/images/parcel_3d_transparent.png';
import destinationImg from '../assets/images/destination_3d_transparent.png';

export type VehicleTierType = 'BIKE' | 'AUTO' | 'CAB' | 'PREMIUM' | 'TRUCK' | 'PARCEL' | string;

export interface VehicleThemeConfig {
  glowColor: string;
  glowShadow: string;
  badgeBg: string;
  badgeText: string;
  highlightGradient: string;
  label: string;
}

export const VEHICLE_5D_THEMES: Record<string, VehicleThemeConfig> = {
  BIKE: {
    glowColor: 'rgba(6, 182, 212, 0.55)',
    glowShadow: '0 8px 24px -2px rgba(6, 182, 212, 0.45)',
    badgeBg: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30',
    badgeText: 'text-cyan-400',
    highlightGradient: 'from-cyan-400/25 via-transparent to-transparent',
    label: 'Bike Moto'
  },
  AUTO: {
    glowColor: 'rgba(245, 158, 11, 0.55)',
    glowShadow: '0 8px 24px -2px rgba(245, 158, 11, 0.45)',
    badgeBg: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
    badgeText: 'text-amber-400',
    highlightGradient: 'from-amber-400/25 via-transparent to-transparent',
    label: 'Auto 3W'
  },
  CAB: {
    glowColor: 'rgba(59, 130, 246, 0.55)',
    glowShadow: '0 8px 24px -2px rgba(59, 130, 246, 0.45)',
    badgeBg: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    badgeText: 'text-blue-400',
    highlightGradient: 'from-blue-400/25 via-transparent to-transparent',
    label: 'Cab Prime'
  },
  PREMIUM: {
    glowColor: 'rgba(168, 85, 247, 0.6)',
    glowShadow: '0 8px 24px -2px rgba(168, 85, 247, 0.5)',
    badgeBg: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
    badgeText: 'text-purple-400',
    highlightGradient: 'from-purple-400/25 via-transparent to-transparent',
    label: 'Prime SUV'
  },
  TRUCK: {
    glowColor: 'rgba(99, 102, 241, 0.55)',
    glowShadow: '0 8px 24px -2px rgba(99, 102, 241, 0.45)',
    badgeBg: 'bg-indigo-500/20 text-indigo-400 border-indigo-500/30',
    badgeText: 'text-indigo-400',
    highlightGradient: 'from-indigo-400/25 via-transparent to-transparent',
    label: 'Mini Truck'
  },
  PARCEL: {
    glowColor: 'rgba(16, 185, 129, 0.55)',
    glowShadow: '0 8px 24px -2px rgba(16, 185, 129, 0.45)',
    badgeBg: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
    badgeText: 'text-emerald-400',
    highlightGradient: 'from-emerald-400/25 via-transparent to-transparent',
    label: 'Fast Parcel'
  }
};

export const getVehicleImageSrc = (type: string): string => {
  const t = type.toLowerCase();
  if (t.includes('parcel') || t.includes('package') || t.includes('box') || t.includes('📦')) return parcelImg;
  if (t.includes('suv') || t.includes('xl') || t.includes('premium') || t.includes('🚙')) return suvImg;
  if (t.includes('bike') || t.includes('moto') || t.includes('🏍')) return bikeImg;
  if (t.includes('auto') || t.includes('3w') || t.includes('🛺')) return autoImg;
  if (t.includes('truck') || t.includes('cargo') || t.includes('mini') || t.includes('🚚')) return truckImg;
  if (t.includes('cab') || t.includes('car') || t.includes('prime') || t.includes('sedan') || t.includes('taxi') || t.includes('🚕')) return cabImg;
  return cabImg;
};

export const getVehicleTheme = (type: string): VehicleThemeConfig => {
  const t = type.toUpperCase();
  if (t.includes('BIKE')) return VEHICLE_5D_THEMES.BIKE;
  if (t.includes('AUTO')) return VEHICLE_5D_THEMES.AUTO;
  if (t.includes('PREMIUM') || t.includes('SUV')) return VEHICLE_5D_THEMES.PREMIUM;
  if (t.includes('TRUCK')) return VEHICLE_5D_THEMES.TRUCK;
  if (t.includes('PARCEL')) return VEHICLE_5D_THEMES.PARCEL;
  return VEHICLE_5D_THEMES.CAB;
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
 * 5D Modern Vehicle Icon Component
 * Features:
 * 1. 3D Isometric transparent asset with zero container box
 * 2. Directional depth lighting & specular glass reflection flare
 * 3. Chromatic tier-specific floor neon underglow (5D spatial aura)
 * 4. Micro-perspective tilt & tactile float animation
 * 5. Multi-stage ambient occlusion ground contact shadow
 */
export const Vehicle5dIcon: React.FC<Vehicle5dIconProps> = ({
  type,
  size = 44,
  className = "",
  heading = 0,
  isSelected = false,
  showAura = true
}) => {
  const src = getVehicleImageSrc(type);
  const theme = getVehicleTheme(type);

  return (
    <div 
      className={`relative inline-flex items-center justify-center select-none group transition-all duration-300 ${className}`}
      style={{ 
        width: size, 
        height: size,
        perspective: '800px'
      }}
    >
      {/* Dimension 4: Tier-specific Chromatic Floor Glow Aura */}
      {showAura && (
        <div 
          className={`absolute bottom-0 w-[90%] h-[35%] rounded-full blur-md transition-all duration-300 pointer-events-none ${
            isSelected ? 'opacity-85 scale-125' : 'opacity-35 group-hover:opacity-65'
          }`}
          style={{
            backgroundColor: theme.glowColor,
            boxShadow: isSelected ? theme.glowShadow : undefined
          }}
        />
      )}

      {/* Dimension 5: Floor Contact Occlusion Shadow */}
      <div 
        className={`absolute bottom-0.5 w-[75%] h-[20%] bg-black/60 rounded-full blur-[2px] transition-all duration-300 pointer-events-none ${
          isSelected ? 'scale-90 opacity-40' : 'scale-100 opacity-60'
        }`}
      />

      {/* Dimension 1 & 2 & 3: 3D Render Image with Perspective Tilt & Floating Elevation */}
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
        {/* Specular Sheen Reflection Highlight */}
        <div 
          className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/15 to-transparent pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-full"
          style={{ mixBlendMode: 'overlay' }}
        />

        <img
          src={src}
          alt={type}
          className="w-full h-full object-contain pointer-events-none filter drop-shadow-[0_6px_12px_rgba(0,0,0,0.65)]"
          onError={(e) => {
            e.currentTarget.style.display = 'none';
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
 * Live Map 5D Vehicle Marker
 * Direct-on-road placement with realistic dynamic headlight projection,
 * ambient ground shadow, and heading rotation. Zero background box.
 */
export const LiveMap5dVehicleMarker: React.FC<LiveMap5dVehicleMarkerProps> = ({
  type,
  size = 40,
  heading = 0,
  label,
  className = ""
}) => {
  const src = getVehicleImageSrc(type);
  const theme = getVehicleTheme(type);

  return (
    <div className={`relative flex flex-col items-center pointer-events-none select-none ${className}`}>
      
      {/* 5D Vehicle body on road with heading */}
      <div 
        className="relative transition-transform duration-300 ease-linear flex items-center justify-center"
        style={{
          width: size,
          height: size,
          transform: `rotate(${heading}deg)`
        }}
      >
        {/* Directional Dual Headlight Projection Cones on the Road */}
        <div 
          className="absolute -top-3.5 left-1/2 -translate-x-1/2 w-7 h-7 bg-amber-200/30 blur-[2.5px] rounded-full pointer-events-none"
          style={{ clipPath: 'polygon(50% 100%, 0 0, 100% 0)' }}
        />

        {/* Ambient Chromatic Road Neon Underglow */}
        <div 
          className="absolute inset-1 rounded-full blur-[3px] pointer-events-none opacity-45"
          style={{ backgroundColor: theme.glowColor }}
        />

        {/* High-Fidelity 3D Vehicle */}
        <img
          src={src}
          alt={type}
          className="w-full h-full object-contain filter drop-shadow-[0_5px_12px_rgba(0,0,0,0.7)]"
          style={{ transform: 'scale(1.15)' }}
        />
      </div>

      {/* Realistic contact shadow beneath the vehicle wheels */}
      <div 
        className="w-6 h-1.5 bg-black/55 rounded-full blur-[1.5px] -mt-0.5 pointer-events-none" 
      />

      {/* Optional Vehicle Name / Plate Label */}
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

      {/* 5D Destination Pin with underglow */}
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
