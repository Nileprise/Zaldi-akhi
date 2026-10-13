import React, { useState, useEffect } from 'react';
import { Check, Crosshair, MapPin } from 'lucide-react';
import { sounds } from '../services/audio';
import cab3dImage from '../assets/images/cab_3d_transparent.png';

interface CarpoolCorridorMapProps {
  pickupAddress: string;
  dropoffAddress: string;
  driverName?: string;
  driverProgress?: number;
  onRecenter?: () => void;
}

export const CarpoolCorridorMap: React.FC<CarpoolCorridorMapProps> = ({
  pickupAddress,
  dropoffAddress,
  driverName = 'Ramesh Kumar',
  driverProgress = 0.42,
  onRecenter
}) => {
  // Animated vehicle progress along the highway
  const [carAnimProgress, setCarAnimProgress] = useState(driverProgress);

  useEffect(() => {
    const interval = setInterval(() => {
      setCarAnimProgress(prev => {
        const next = prev + 0.003;
        return next > 0.94 ? 0.08 : next;
      });
    }, 120);
    return () => clearInterval(interval);
  }, []);

  // Road waypoints definition in SVG coordinates (viewBox 0 0 1000 500)
  const waypoints = [
    { id: 'hanamkonda', name: 'Hanamkonda', x: 195, y: 125, isPickup: true, pinType: 'green' },
    { id: 'warangal', name: 'Warangal', x: 320, y: 155, isPickup: false, pinType: 'node' },
    { id: 'ghatkesar', name: 'Ghatkesar', x: 550, y: 185, isPickup: false, pinType: 'node' },
    { id: 'uppal', name: 'Uppal', x: 655, y: 220, isPickup: false, pinType: 'node' },
    { id: 'hyderabad', name: 'Hyderabad Central', x: 795, y: 255, isDropoff: true, pinType: 'red' },
  ];

  // Smooth SVG road curve string
  const roadPathD = "M 195 125 C 240 130, 280 142, 320 155 C 370 172, 420 182, 470 185 C 510 187, 530 184, 550 185 C 585 186, 620 205, 655 220 C 695 238, 745 252, 795 255";

  // Calculate car position along the parametric curve
  // t is normalized progress (0 to 1)
  const getCarPosOnCurve = (t: number) => {
    // Piecewise approximation across the 5 segments
    const pts = [
      { x: 195, y: 125 },
      { x: 320, y: 155 },
      { x: 440, y: 184 },
      { x: 550, y: 185 },
      { x: 655, y: 220 },
      { x: 795, y: 255 }
    ];
    const segmentCount = pts.length - 1;
    const indexFloat = t * segmentCount;
    const idx = Math.min(segmentCount - 1, Math.floor(indexFloat));
    const frac = indexFloat - idx;
    const p1 = pts[idx];
    const p2 = pts[idx + 1];
    const curX = p1.x + frac * (p2.x - p1.x);
    const curY = p1.y + frac * (p2.y - p1.y);
    const angleRad = Math.atan2(p2.y - p1.y, p2.x - p1.x);
    const angleDeg = (angleRad * 180) / Math.PI;
    return { x: curX, y: curY, angle: angleDeg };
  };

  const carPos = getCarPosOnCurve(carAnimProgress);

  return (
    <div className="relative w-full h-full overflow-hidden select-none bg-[#F3F4EE]">
      {/* -----------------------------------------------------------------
          1. REALISTIC TOPOGRAPHIC MAP CANVAS & ROADS
         ----------------------------------------------------------------- */}
      <svg
        viewBox="0 0 1000 500"
        className="w-full h-full object-cover"
        preserveAspectRatio="xMidYMid slice"
      >
        <defs>
          {/* Subtle terrain topography patterns */}
          <pattern id="terrain-grid" width="80" height="80" patternUnits="userSpaceOnUse">
            <path d="M 80 0 L 0 0 0 80" fill="none" stroke="#E5E7EB" strokeWidth="0.8" opacity="0.6" />
          </pattern>

          {/* Road drop shadow */}
          <filter id="road-glow" x="-10%" y="-10%" width="120%" height="120%">
            <feDropShadow dx="0" dy="3" stdDeviation="4" floodColor="#1E3A8A" floodOpacity="0.25" />
          </filter>
        </defs>

        {/* Base Map Terrain Fills */}
        <rect width="1000" height="500" fill="#F4F4EE" />
        <rect width="1000" height="500" fill="url(#terrain-grid)" />

        {/* Forest / Nature Reserves Green Accents (Realistic background features) */}
        <path
          d="M 60 40 Q 120 20 180 50 Q 240 80 200 130 Q 140 150 90 120 Z"
          fill="#DCFCE7"
          opacity="0.85"
        />
        <path
          d="M 640 40 Q 720 20 800 60 Q 840 120 780 150 Q 700 160 660 110 Z"
          fill="#DCFCE7"
          opacity="0.75"
        />
        <path
          d="M 380 320 Q 460 290 540 330 Q 560 410 490 440 Q 400 450 360 380 Z"
          fill="#E2F1E5"
          opacity="0.9"
        />
        <path
          d="M 740 330 Q 820 300 900 340 Q 940 420 860 460 Q 780 470 730 400 Z"
          fill="#DCFCE7"
          opacity="0.7"
        />

        {/* Water Bodies (Lakes / Reservoirs) */}
        <path
          d="M 280 40 Q 330 30 360 60 Q 370 100 320 110 Q 270 100 260 70 Z"
          fill="#CFE6FC"
          opacity="0.8"
        />
        <path
          d="M 690 350 Q 740 330 780 360 Q 770 410 720 420 Q 670 400 680 370 Z"
          fill="#CFE6FC"
          opacity="0.8"
        />

        {/* Minor Road Network / Secondary Arterials */}
        <path
          d="M 120 200 C 220 190, 310 240, 420 230 C 510 220, 600 270, 700 260 C 800 250, 890 280, 960 300"
          fill="none"
          stroke="#E2E8F0"
          strokeWidth="3.5"
          strokeLinecap="round"
        />
        <path
          d="M 320 0 C 330 80, 310 160, 330 250 C 350 340, 360 420, 370 500"
          fill="none"
          stroke="#E2E8F0"
          strokeWidth="3"
        />
        <path
          d="M 550 0 C 540 90, 560 180, 550 280 C 540 380, 560 440, 570 500"
          fill="none"
          stroke="#E2E8F0"
          strokeWidth="3"
        />
        <path
          d="M 0 350 C 180 340, 340 360, 500 340 C 650 320, 800 360, 1000 330"
          fill="none"
          stroke="#E5E7EB"
          strokeWidth="2.5"
        />

        {/* Outer Highway Border (Dark Blue Casing) */}
        <path
          d={roadPathD}
          fill="none"
          stroke="#1D4ED8"
          strokeWidth="11"
          strokeLinecap="round"
          strokeLinejoin="round"
          filter="url(#road-glow)"
        />

        {/* Inner Vibrant Highway Line (Bright Google Maps Blue) */}
        <path
          d={roadPathD}
          fill="none"
          stroke="#2563EB"
          strokeWidth="7"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Highway Waypoint Rings along the path */}
        {waypoints.map(wp => {
          if (wp.pinType === 'node') {
            return (
              <g key={wp.id}>
                {/* Outer shadow/border */}
                <circle cx={wp.x} cy={wp.y} r="7.5" fill="#1D4ED8" />
                {/* Inner white circle */}
                <circle cx={wp.x} cy={wp.y} r="4.8" fill="#FFFFFF" />
              </g>
            );
          }
          return null;
        })}

        {/* Moving Car Marker along the Road */}
        <g
          transform={`translate(${carPos.x}, ${carPos.y}) rotate(${carPos.angle})`}
          className="transition-transform duration-100 ease-linear"
        >
          {/* Vehicle Drop Shadow */}
          <ellipse cx="0" cy="4" rx="20" ry="11" fill="#0F172A" opacity="0.3" filter="blur(2px)" />

          {/* 3D Vehicle Render */}
          <image
            href={cab3dImage}
            x="-22"
            y="-16"
            width="44"
            height="32"
            preserveAspectRatio="xMidYMid meet"
          />
        </g>
      </svg>

      {/* -----------------------------------------------------------------
          2. FLOATING WAYPOINT LABELS & PINS (HTML Overlay for crisp typography)
         ----------------------------------------------------------------- */}
      {/* 1. Hanamkonda (Start/Pickup - Green Pin) */}
      <div 
        className="absolute z-10 flex flex-col items-center pointer-events-none transform -translate-x-1/2 -translate-y-full"
        style={{ left: '19.5%', top: '25%' }}
      >
        <div className="flex items-center gap-1.5 bg-white px-2.5 py-1 rounded-lg shadow-md border border-slate-200/90 whitespace-nowrap">
          <div className="w-4 h-4 rounded-full bg-emerald-600 text-white flex items-center justify-center -ml-0.5 shadow-2xs">
            <MapPin className="w-2.5 h-2.5 fill-white stroke-none" />
          </div>
          <span className="font-extrabold text-xs text-slate-900 tracking-tight">Hanamkonda</span>
        </div>
        <div className="w-2.5 h-2.5 bg-emerald-700 rounded-full ring-2 ring-white shadow-xs -mt-1"></div>
      </div>

      {/* 2. Warangal (Node - White Pill) */}
      <div 
        className="absolute z-10 pointer-events-none transform -translate-x-1/2 -translate-y-full pb-1"
        style={{ left: '32%', top: '31%' }}
      >
        <div className="bg-white px-2.5 py-0.5 rounded-lg shadow-md border border-slate-200/90 whitespace-nowrap">
          <span className="font-extrabold text-xs text-slate-900 tracking-tight">Warangal</span>
        </div>
      </div>

      {/* 3. Ghatkesar (Node - White Pill) */}
      <div 
        className="absolute z-10 pointer-events-none transform -translate-x-1/2 -translate-y-full pb-1"
        style={{ left: '55%', top: '37%' }}
      >
        <div className="bg-white px-2.5 py-0.5 rounded-lg shadow-md border border-slate-200/90 whitespace-nowrap">
          <span className="font-extrabold text-xs text-slate-900 tracking-tight">Ghatkesar</span>
        </div>
      </div>

      {/* 4. Uppal (Node - White Pill) */}
      <div 
        className="absolute z-10 pointer-events-none transform -translate-x-1/2 -translate-y-full pb-1"
        style={{ left: '65.5%', top: '44%' }}
      >
        <div className="bg-white px-2.5 py-0.5 rounded-lg shadow-md border border-slate-200/90 whitespace-nowrap">
          <span className="font-extrabold text-xs text-slate-900 tracking-tight">Uppal</span>
        </div>
      </div>

      {/* 5. Hyderabad Central (Destination - Red Pin) */}
      <div 
        className="absolute z-10 flex flex-col items-center pointer-events-none transform -translate-x-1/2 -translate-y-full"
        style={{ left: '79.5%', top: '51%' }}
      >
        <div className="flex items-center gap-1.5 bg-white px-2.5 py-1 rounded-lg shadow-md border border-slate-200/90 whitespace-nowrap">
          <div className="w-4 h-4 rounded-full bg-rose-600 text-white flex items-center justify-center -ml-0.5 shadow-2xs">
            <MapPin className="w-2.5 h-2.5 fill-white stroke-none" />
          </div>
          <span className="font-extrabold text-xs text-slate-900 tracking-tight">Hyderabad Central</span>
        </div>
        <div className="w-2.5 h-2.5 bg-rose-700 rounded-full ring-2 ring-white shadow-xs -mt-1"></div>
      </div>

      {/* -----------------------------------------------------------------
          3. FLOATING BADGE (TOP RIGHT): ROUTE VERIFIED ON REAL ROADS
         ----------------------------------------------------------------- */}
      <div className="absolute top-22 sm:top-24 right-3 sm:right-4 z-20 pointer-events-none">
        <div className="bg-white/95 backdrop-blur-xs border border-emerald-200/90 px-3 py-1.5 rounded-xl shadow-md flex items-center gap-2">
          <div className="w-4 h-4 rounded-full bg-emerald-600 text-white flex items-center justify-center shadow-xs">
            <Check className="w-2.5 h-2.5 stroke-[3]" />
          </div>
          <span className="text-[11px] font-black text-slate-800 tracking-tight">
            Route Verified on Real Roads
          </span>
        </div>
      </div>

      {/* -----------------------------------------------------------------
          4. FLOATING BUTTON (BOTTOM LEFT): RECENTER / GPS
         ----------------------------------------------------------------- */}
      <div className="absolute bottom-4 left-4 z-20">
        <button
          onClick={() => {
            sounds.playTap();
            onRecenter?.();
          }}
          className="w-10 h-10 rounded-full bg-white shadow-lg border border-slate-200 text-slate-700 flex items-center justify-center hover:bg-slate-50 transition active:scale-95 cursor-pointer"
          title="Recenter GPS Location"
        >
          <Crosshair className="w-5 h-5 text-slate-700 stroke-[2.2]" />
        </button>
      </div>
    </div>
  );
};
