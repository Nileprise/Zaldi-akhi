import React, { useState, useRef, useEffect } from 'react';
import boyPinImage from '../assets/images/boy_3d_pin_transparent.png';
import { Search } from 'lucide-react';

export type LocationPinType = 'character_pin' | 'teardrop_3d' | 'compact_boy' | 'boy_3d';

interface Boy3dPinProps {
  address?: string;
  className?: string;
  showAddressBadge?: boolean;
  pinType?: LocationPinType | string;
  onEdit?: () => void;
  onUpdateAddress?: (newAddress: string) => void;
}

/**
 * Modern 3D PNG Location Pin Pointer
 * - Pure 3D PNG character with ZERO background container, box, or border
 * - Sleek, natural proportions with precision ground contact point
 * - Tap on address converts directly to inline search bar edit (no edit button, no modal card)
 * - Purely visual 3D Boy marker anchor
 */
export const Boy3dPin: React.FC<Boy3dPinProps> = ({
  address,
  className = "",
  showAddressBadge = true,
  onEdit,
  onUpdateAddress
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editVal, setEditVal] = useState(address || '');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!isEditing) {
      setEditVal(address || '');
    }
  }, [address, isEditing]);

  useEffect(() => {
    if (isEditing) {
      inputRef.current?.focus();
      inputRef.current?.select();
    }
  }, [isEditing]);

  const commitEdit = () => {
    const val = editVal.trim();
    setIsEditing(false);
    if (val && val !== address) {
      onUpdateAddress?.(val);
    } else {
      setEditVal(address || '');
    }
  };

  return (
    <div className={`relative flex flex-col items-center select-none ${className}`}>
      
      {/* Floating Modern Address Pill Badge */}
      {showAddressBadge && address && (
        isEditing ? (
          /* CONVERTED TO SEARCH BAR EDIT INSIDE WHEN TAP ON ADDRESS (NO EDIT BUTTON) */
          <div 
            onClick={(e) => e.stopPropagation()}
            className="mb-1 px-2.5 py-1 bg-slate-900/98 backdrop-blur-md border border-emerald-400 rounded-full shadow-lg flex items-center gap-1.5 max-w-[280px] pointer-events-auto ring-2 ring-emerald-500/30 animate-in fade-in zoom-in-95 duration-150"
          >
            <Search className="w-3 h-3 text-emerald-400 flex-shrink-0" />
            <input
              ref={inputRef}
              type="text"
              value={editVal}
              onChange={(e) => setEditVal(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  commitEdit();
                } else if (e.key === 'Escape') {
                  setIsEditing(false);
                  setEditVal(address || '');
                }
              }}
              onBlur={commitEdit}
              placeholder="Search pickup..."
              className="bg-transparent font-bold text-[10px] text-white outline-none w-[150px] placeholder:text-slate-400"
            />
          </div>
        ) : (
          /* TAP ON ADDRESS CONVERTS TO EDIT ADDRESS (NO EDIT BUTTON) */
          <div 
            onClick={(e) => {
              e.stopPropagation();
              setIsEditing(true);
              setEditVal(address);
              onEdit?.();
            }}
            className="mb-1 px-2.5 py-1 bg-slate-900/95 backdrop-blur-md border border-emerald-500/60 hover:border-emerald-400 rounded-full shadow-lg flex items-center gap-1.5 max-w-[280px] cursor-pointer hover:scale-105 active:scale-95 transition pointer-events-auto"
            title="Tap address to edit"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse flex-shrink-0" />
            <span className="text-[10px] font-black text-white truncate max-w-[180px] leading-none">
              {address}
            </span>
          </div>
        )
      )}

      {/* Pure 5D PNG Boy Character - Purely visual marker */}
      <div className="relative flex flex-col items-center pointer-events-none">
        {/* Subtle ambient holographic aura behind the pin */}
        <div className="absolute -inset-1.5 bg-emerald-500/30 blur-md rounded-full pointer-events-none" />

        <img 
          src={boyPinImage} 
          alt="Pickup Location Pin" 
          className="w-12 h-16 object-contain filter drop-shadow-[0_8px_16px_rgba(0,0,0,0.65)] relative z-10"
        />

        {/* Precision pinpoint ground anchor with emerald jewel contact */}
        <div className="relative z-10 flex flex-col items-center">
          <div className="w-0.5 h-2.5 bg-gradient-to-b from-emerald-400 via-emerald-300 to-white shadow-[0_0_6px_#34d399] -mt-1" />
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 shadow-[0_0_8px_#34d399] border-2 border-white" />
          <div className="w-4 h-1 bg-black/50 rounded-full blur-[1px] mt-0.5" />
        </div>
      </div>

    </div>
  );
};
