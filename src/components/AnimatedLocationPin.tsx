import React, { useEffect, useState, useRef } from 'react';
import boyPinImage from '../assets/images/boy_3d_pin_transparent.png';
import { Navigation, MapPin, Compass } from 'lucide-react';

export type PinStyleType = 'animated_radar' | 'character_pin' | 'precision_crosshair' | 'teardrop_3d';

interface AnimatedLocationPinProps {
  address?: string;
  isMapMoving?: boolean;
  isLocating?: boolean;
  pinStyle?: PinStyleType;
  showAddressBadge?: boolean;
  className?: string;
  onCycleStyle?: () => void;
}

/**
 * Animated Location Pin Component
 * - Dynamic floating levitation with tactile bounce physics
 * - Real-time ground radar ripples radiating outward from contact point
 * - Reactive drag physics (lifts into air while map moves underneath, drops with contact bounce & shockwave upon settlement)
 * - GPS Current Location lock-on reticle animation
 * - Zero bulky card containers or borders
 */
export const AnimatedLocationPin: React.FC<AnimatedLocationPinProps> = ({
  address,
  isMapMoving = false,
  isLocating = false,
  pinStyle = 'animated_radar',
  showAddressBadge = true,
  className = "",
  onCycleStyle
}) => {
  // Track landing bounce when map stops moving
  const [justLanded, setJustLanded] = useState(false);
  const wasMovingRef = useRef(false);

  useEffect(() => {
    if (wasMovingRef.current && !isMapMoving) {
      // Just settled!
      setJustLanded(true);
      const timer = setTimeout(() => setJustLanded(false), 500);
      return () => clearTimeout(timer);
    }
    wasMovingRef.current = isMapMoving;
  }, [isMapMoving]);

  return (
    <div className={`relative flex flex-col items-center select-none pointer-events-none ${className}`}>
      
      {/* 1. FLOATING ADDRESS BADGE */}
      {showAddressBadge && (
        <div className={`mb-2 transition-all duration-300 ease-out ${
          isMapMoving ? 'opacity-90 scale-95 -translate-y-2' : 'opacity-100 scale-100 translate-y-0'
        }`}>
          {isMapMoving ? (
            <div className="px-3 py-1 bg-slate-900/90 backdrop-blur-md border border-emerald-500/60 rounded-full shadow-2xl flex items-center gap-1.5 animate-pulse">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping flex-shrink-0" />
              <span className="text-[11px] font-bold text-slate-100 tracking-wide">
                Move map to set pickup
              </span>
            </div>
          ) : (
            <div className="px-3 py-1 bg-slate-900/95 backdrop-blur-md border border-emerald-500/50 rounded-full shadow-2xl flex items-center gap-1.5 max-w-[270px]">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse flex-shrink-0" />
              <span className="text-[11px] font-black text-white truncate">
                {address || "Locating pickup point..."}
              </span>
            </div>
          )}
        </div>
      )}

      {/* 2. THE ELEVATED PIN BODY (Lifts & tilts while map moves, bounces on landing, floats when idle) */}
      <div 
        className={`relative z-20 flex flex-col items-center transition-transform duration-200 ease-out ${
          isMapMoving 
            ? '-translate-y-4 scale-105 rotate-[-2deg]' 
            : justLanded 
            ? 'animate-pin-landing' 
            : 'animate-pin-float'
        }`}
      >
        {pinStyle === 'character_pin' ? (
          /* Character 3D Pin */
          <div className="relative flex flex-col items-center">
            <div className="absolute -inset-1 bg-emerald-500/25 blur-md rounded-full" />
            <img 
              src={boyPinImage} 
              alt="Pickup Location Pin" 
              className="w-12 h-16 object-contain filter drop-shadow-[0_8px_16px_rgba(0,0,0,0.65)] relative z-10"
            />
            {/* Jewel ground tip */}
            <div className="relative z-10 flex flex-col items-center">
              <div className="w-0.5 h-3 bg-gradient-to-b from-emerald-400 to-white shadow-[0_0_8px_#34d399] -mt-1" />
              <div className="w-3 h-3 rounded-full bg-emerald-400 shadow-[0_0_10px_#34d399] border-2 border-white" />
            </div>
          </div>
        ) : pinStyle === 'precision_crosshair' ? (
          /* Precision Crosshair Pin */
          <div className="relative flex flex-col items-center">
            <div className="w-10 h-10 rounded-full border-2 border-emerald-400 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center shadow-[0_0_20px_rgba(16,185,129,0.7)] animate-pin-glow">
              <Navigation className="w-5 h-5 text-emerald-400 transform rotate-45" />
            </div>
            <div className="w-0.5 h-4 bg-gradient-to-b from-emerald-400 to-white shadow-[0_0_8px_#10b981]" />
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 border border-white shadow-[0_0_8px_#34d399]" />
          </div>
        ) : (
          /* Modern Animated Radar Teardrop Pin (Default) */
          <div className="relative flex flex-col items-center">
            {/* Ambient Aura Halo */}
            <div className="absolute -inset-2 bg-emerald-500/30 blur-lg rounded-full" />

            {/* Teardrop Pin Head */}
            <div className="relative w-11 h-14 flex flex-col items-center">
              <svg 
                viewBox="0 0 44 56" 
                className="w-full h-full filter drop-shadow-[0_8px_16px_rgba(0,0,0,0.6)]"
              >
                <defs>
                  <linearGradient id="pinBodyGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#10b981" />
                    <stop offset="60%" stopColor="#059669" />
                    <stop offset="100%" stopColor="#047857" />
                  </linearGradient>
                  <linearGradient id="pinInnerGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="#ffffff" />
                    <stop offset="100%" stopColor="#e2e8f0" />
                  </linearGradient>
                  <filter id="pinGlow">
                    <feGaussianBlur stdDeviation="2" result="blur" />
                    <feComposite in="SourceGraphic" in2="blur" operator="over" />
                  </filter>
                </defs>

                {/* Outer teardrop silhouette with sharp contact tip */}
                <path 
                  d="M 22 2 C 10.95 2 2 10.95 2 22 C 2 35.5 20 52 22 54 C 24 52 42 35.5 42 22 C 42 10.95 33.05 2 22 2 Z" 
                  fill="url(#pinBodyGrad)" 
                  stroke="#ffffff" 
                  strokeWidth="2"
                />

                {/* Specular highlight arc */}
                <path
                  d="M 10 12 A 14 14 0 0 1 34 12"
                  fill="none"
                  stroke="rgba(255,255,255,0.7)"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                />

                {/* Inner White Core Circle with Zaldi Fast Z Logo */}
                <circle cx="22" cy="20" r="11" fill="url(#pinInnerGrad)" />
                
                {/* Zaldi 'Z' Emblem */}
                <path 
                  d="M 17 15 L 27 15 L 18 25 L 27 25" 
                  fill="none" 
                  stroke="#047857" 
                  strokeWidth="2.6" 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                />
              </svg>
            </div>

            {/* Precision Contact Needle Tip */}
            <div className="w-1 h-3 bg-gradient-to-b from-emerald-500 via-emerald-300 to-white -mt-1 shadow-[0_0_6px_#34d399]" />
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 border border-white shadow-[0_0_10px_#34d399]" />
          </div>
        )}
      </div>

      {/* 3. GROUND PLANE RADAR RIPPLES & SHADOW */}
      <div className="relative -mt-1 flex items-center justify-center pointer-events-none">
        
        {/* Dynamic Ground Contact Shadow (shrinks & softens when pin lifts up) */}
        <div 
          className={`h-2 rounded-full bg-black/60 blur-[2px] transition-all duration-200 ease-out ${
            isMapMoving 
              ? 'w-3 opacity-30 scale-75' 
              : 'w-6 opacity-70 scale-100'
          }`} 
        />

        {/* Primary Animated Ground Radar Ripple Wave */}
        <div className="absolute w-10 h-10 rounded-full border-2 border-emerald-400/80 bg-emerald-400/15 animate-pin-ripple-1 pointer-events-none" />

        {/* Secondary Phase-Delayed Radar Ripple Wave */}
        <div className="absolute w-10 h-10 rounded-full border border-emerald-300/60 bg-emerald-300/10 animate-pin-ripple-2 pointer-events-none" />

        {/* Shockwave Burst upon landing */}
        {justLanded && (
          <div className="absolute w-14 h-14 rounded-full border-2 border-emerald-300 bg-emerald-400/30 animate-ping pointer-events-none" />
        )}

        {/* High-intensity GPS Lock-in Reticle when 'Use Current Location' is pressed */}
        {isLocating && (
          <div className="absolute w-16 h-16 rounded-full border-2 border-dashed border-cyan-400 animate-spin pointer-events-none">
            <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-cyan-400 rounded-full" />
            <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-cyan-400 rounded-full" />
          </div>
        )}

        {/* Center Target Dot */}
        <div className="absolute w-1.5 h-1.5 rounded-full bg-white shadow-[0_0_6px_#ffffff]" />
      </div>

    </div>
  );
};
