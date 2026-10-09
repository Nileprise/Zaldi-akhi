import React from 'react';
import bikeImg from '../assets/images/zaldi_bike_lowpoly_64.png';
import autoImg from '../assets/images/zaldi_auto_lowpoly_64.png';
import sedanImg from '../assets/images/zaldi_sedan_lowpoly_64.png';
import suvImg from '../assets/images/zaldi_suv_lowpoly_64.png';
import truckImg from '../assets/images/zaldi_truck_lowpoly_64.png';
import parcelImg from '../assets/images/zaldi_parcel_lowpoly_64.png';

interface VehicleMarkerProps {
  bearing?: number;
  type?: 'BIKE' | 'AUTO' | 'CAB' | 'SUV' | 'TRUCK' | 'PARCEL' | string;
  size?: number;
  isOnline?: boolean;
}

/**
 * Low-Poly Vehicle Marker Base Component
 * - Strong silhouette readable at 32–64 px
 * - Minimal tiny details
 * - High-contrast roof/body
 * - Zaldi Z visible without overwhelming
 * - Transparent background (NO baked ground/shadow)
 * - Rotation-ready for real-time map movement
 */
const LowPolyMarkerWrapper: React.FC<{
  bearing?: number;
  src: string;
  alt: string;
  size?: number;
  lightBeamColor?: string;
  glowColor?: string;
}> = ({ 
  bearing = 0, 
  src, 
  alt, 
  size = 36, 
  lightBeamColor = 'rgba(254, 240, 138, 0.4)',
  glowColor = 'rgba(245, 158, 11, 0.35)'
}) => (
  <div 
    className="relative flex items-center justify-center pointer-events-none select-none transition-transform duration-200"
    style={{ transform: `rotate(${bearing}deg)` }}
  >
    {/* Unbaked Directional Headlight Beam on Road */}
    <div 
      className="absolute -top-3 left-1/2 -translate-x-1/2 w-5 h-6 blur-[2px] rounded-full pointer-events-none"
      style={{ 
        background: `radial-gradient(ellipse at bottom, ${lightBeamColor} 0%, transparent 70%)`,
        clipPath: 'polygon(50% 100%, 0 0, 100% 0)' 
      }} 
    />
    
    {/* Unbaked Ground Contact Occlusion Shadow */}
    <div 
      className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-black/60 rounded-full blur-[2px] pointer-events-none"
      style={{ width: size * 0.75, height: size * 0.3 }}
    />

    {/* Low-Poly Cutout (Zero shadow baked in) */}
    <div 
      className="relative z-10 flex items-center justify-center filter drop-shadow-[0_2px_5px_rgba(0,0,0,0.6)]"
      style={{ width: size, height: size }}
    >
      <img
        src={src}
        alt={alt}
        className="w-full h-full object-contain pointer-events-none"
        style={{ transform: 'scale(1.1)' }}
      />
    </div>
  </div>
);

// 1. 🏍️ Low-Poly Bike Marker (Zaldi Moto)
export const ModernBikeMarker: React.FC<{ bearing?: number; size?: number }> = ({ bearing = 0, size = 34 }) => (
  <LowPolyMarkerWrapper
    bearing={bearing}
    size={size}
    src={bikeImg}
    alt="Zaldi Moto EV"
    lightBeamColor="rgba(56, 189, 248, 0.45)"
    glowColor="rgba(6, 182, 212, 0.4)"
  />
);

// 2. 🛺 Low-Poly Auto Rickshaw Marker (Zaldi TukTuk)
export const ModernAutoMarker: React.FC<{ bearing?: number; size?: number }> = ({ bearing = 0, size = 36 }) => (
  <LowPolyMarkerWrapper
    bearing={bearing}
    size={size}
    src={autoImg}
    alt="Zaldi TukTuk 3W"
    lightBeamColor="rgba(253, 224, 71, 0.5)"
    glowColor="rgba(245, 158, 11, 0.45)"
  />
);

// 3. 🚕 Low-Poly City Sedan Marker (Zaldi Go)
export const ModernCabMarker: React.FC<{ bearing?: number; size?: number }> = ({ bearing = 0, size = 38 }) => (
  <LowPolyMarkerWrapper
    bearing={bearing}
    size={size}
    src={sedanImg}
    alt="Zaldi Go Sedan"
    lightBeamColor="rgba(254, 240, 138, 0.5)"
    glowColor="rgba(59, 130, 246, 0.4)"
  />
);

// 4. 🚙 Low-Poly Rugged SUV Marker (Zaldi Prime SUV)
export const ModernSuvMarker: React.FC<{ bearing?: number; size?: number }> = ({ bearing = 0, size = 40 }) => (
  <LowPolyMarkerWrapper
    bearing={bearing}
    size={size}
    src={suvImg}
    alt="Zaldi Prime SUV"
    lightBeamColor="rgba(192, 132, 252, 0.45)"
    glowColor="rgba(168, 85, 247, 0.45)"
  />
);

// 5. 🚚 Low-Poly Cargo Mini-Truck Marker (Zaldi Haul)
export const ModernTruckMarker: React.FC<{ bearing?: number; size?: number }> = ({ bearing = 0, size = 42 }) => (
  <LowPolyMarkerWrapper
    bearing={bearing}
    size={size}
    src={truckImg}
    alt="Zaldi Haul Mini-Truck"
    lightBeamColor="rgba(99, 102, 241, 0.45)"
    glowColor="rgba(79, 70, 229, 0.4)"
  />
);

// 6. 📦 Low-Poly Courier Parcel Marker (Zaldi Express)
export const ModernParcelMarker: React.FC<{ bearing?: number; size?: number }> = ({ bearing = 0, size = 34 }) => (
  <LowPolyMarkerWrapper
    bearing={bearing}
    size={size}
    src={parcelImg}
    alt="Zaldi Express Courier"
    lightBeamColor="rgba(52, 211, 153, 0.45)"
    glowColor="rgba(16, 185, 129, 0.4)"
  />
);

// Generic Unified Vehicle Marker Switcher
export const ModernVehicleMarker: React.FC<VehicleMarkerProps> = ({ 
  bearing = 0, 
  type = 'CAB',
  size = 38
}) => {
  const norm = String(type).toUpperCase();
  if (norm.includes('BIKE') || norm.includes('MOTO') || norm.includes('🏍')) {
    return <ModernBikeMarker bearing={bearing} size={size} />;
  }
  if (norm.includes('AUTO') || norm.includes('3W') || norm.includes('🛺')) {
    return <ModernAutoMarker bearing={bearing} size={size} />;
  }
  if (norm.includes('SUV') || norm.includes('PRIME') || norm.includes('🚙')) {
    return <ModernSuvMarker bearing={bearing} size={size} />;
  }
  if (norm.includes('TRUCK') || norm.includes('CARGO') || norm.includes('HAUL') || norm.includes('🚚')) {
    return <ModernTruckMarker bearing={bearing} size={size} />;
  }
  if (norm.includes('PARCEL') || norm.includes('COURIER') || norm.includes('PACKAGE') || norm.includes('📦')) {
    return <ModernParcelMarker bearing={bearing} size={size} />;
  }
  return <ModernCabMarker bearing={bearing} size={size} />;
};
