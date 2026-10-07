import React from 'react';
import boyPinImage from '../assets/images/boy_3d_pin_transparent.png';

export type LocationPinType = 'character_pin' | 'teardrop_3d' | 'compact_boy' | 'boy_3d';

interface Boy3dPinProps {
  address?: string;
  className?: string;
  showAddressBadge?: boolean;
  pinType?: LocationPinType | string;
}

/**
 * Modern 3D PNG Location Pin Pointer
 * - Pure 3D PNG character with ZERO background container, box, or border
 * - NO radius circles or bulky radar rings
 * - Sleek, natural proportions with precision ground contact point
 */
export const Boy3dPin: React.FC<Boy3dPinProps> = ({
  address,
  className = "",
  showAddressBadge = true
}) => {
  return (
    <div className={`relative flex flex-col items-center select-none pointer-events-none ${className}`}>
      
      {/* Floating Modern Address Pill Badge */}
      {showAddressBadge && address && (
        <div className="mb-1 px-2.5 py-0.5 bg-slate-900/90 backdrop-blur-md border border-slate-700/70 rounded-full shadow-lg flex items-center gap-1.5 max-w-[240px] animate-in fade-in">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse flex-shrink-0" />
          <span className="text-[10px] font-black text-white truncate leading-none">
            {address}
          </span>
        </div>
      )}

      {/* Pure 5D PNG Boy Character with specular reflection and tactile depth */}
      <div className="relative flex flex-col items-center">
        {/* Dimension 4: Subtle ambient holographic aura behind the pin */}
        <div className="absolute -inset-1 bg-emerald-500/20 blur-md rounded-full pointer-events-none" />

        <img 
          src={boyPinImage} 
          alt="Pickup Location Pin" 
          className="w-12 h-16 object-contain filter drop-shadow-[0_6px_12px_rgba(0,0,0,0.65)] relative z-10 transition-transform duration-200"
        />

        {/* Dimension 5: Precision pinpoint 5D ground anchor with emerald jewel contact */}
        <div className="relative z-10 flex flex-col items-center">
          <div className="w-0.5 h-2.5 bg-gradient-to-b from-emerald-400 via-emerald-300 to-white shadow-[0_0_6px_#34d399] -mt-1" />
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 shadow-[0_0_8px_#34d399] border-2 border-white" />
          <div className="w-4 h-1 bg-black/50 rounded-full blur-[1px] mt-0.5" />
        </div>
      </div>

    </div>
  );
};
