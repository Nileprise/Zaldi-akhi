import React from 'react';

interface Bike3dIconProps {
  className?: string;
  size?: number;
}

export const Bike3dIcon: React.FC<Bike3dIconProps> = ({ 
  className = "w-full h-full", 
  size = 32 
}) => {
  return (
    <svg 
      viewBox="0 0 100 100" 
      width={size} 
      height={size} 
      className={`${className} drop-shadow-md`}
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        {/* Soft Drop Shadow for 3D depth */}
        <filter id="bike-3d-shadow" x="-30%" y="-30%" width="160%" height="160%">
          <feDropShadow dx="0" dy="3" stdDeviation="2.5" floodColor="#000000" floodOpacity="0.6"/>
        </filter>

        {/* Metallic gradients */}
        <linearGradient id="bike-body-grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#38bdf8"/>
          <stop offset="45%" stopColor="#0284c7"/>
          <stop offset="100%" stopColor="#0369a1"/>
        </linearGradient>

        <linearGradient id="helmet-grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#ffffff"/>
          <stop offset="40%" stopColor="#38bdf8"/>
          <stop offset="100%" stopColor="#0f172a"/>
        </linearGradient>

        <linearGradient id="visor-grad" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#090d16"/>
          <stop offset="50%" stopColor="#38bdf8"/>
          <stop offset="100%" stopColor="#090d16"/>
        </linearGradient>

        <linearGradient id="jacket-grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#1d4ed8"/>
          <stop offset="50%" stopColor="#2563eb"/>
          <stop offset="100%" stopColor="#1e40af"/>
        </linearGradient>

        <linearGradient id="box-grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#0284c7"/>
          <stop offset="100%" stopColor="#0f172a"/>
        </linearGradient>

        <linearGradient id="tire-grad" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#0f172a"/>
          <stop offset="50%" stopColor="#334155"/>
          <stop offset="100%" stopColor="#0f172a"/>
        </linearGradient>

        <radialGradient id="headlight-glow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#fef08a" stopOpacity="0.85"/>
          <stop offset="100%" stopColor="#f59e0b" stopOpacity="0"/>
        </radialGradient>
      </defs>

      <g filter="url(#bike-3d-shadow)">
        {/* 1. Front Headlight Beam Projection */}
        <path d="M 44 14 L 32 0 L 68 0 L 56 14 Z" fill="url(#headlight-glow)" opacity="0.6"/>

        {/* 2. Front Tire (Top-down view) */}
        <rect x="46" y="8" width="8" height="15" rx="4" fill="url(#tire-grad)" stroke="#475569" strokeWidth="0.8"/>

        {/* 3. Front Mudguard & Fairing */}
        <path d="M 44 20 Q 50 16 56 20 L 54 28 Q 50 26 46 28 Z" fill="url(#bike-body-grad)"/>

        {/* 4. Handlebars & Mirrors */}
        <path d="M 33 26 Q 50 28 67 26" fill="none" stroke="#94a3b8" strokeWidth="3" strokeLinecap="round"/>
        {/* Grips */}
        <rect x="31" y="24" width="6" height="4" rx="2" fill="#0f172a"/>
        <rect x="63" y="24" width="6" height="4" rx="2" fill="#0f172a"/>
        {/* Mirrors */}
        <ellipse cx="28" cy="22" rx="3.5" ry="2" fill="#e2e8f0" stroke="#0f172a" strokeWidth="1"/>
        <ellipse cx="72" cy="22" rx="3.5" ry="2" fill="#e2e8f0" stroke="#0f172a" strokeWidth="1"/>

        {/* 5. Fuel Tank / Front Chassis */}
        <ellipse cx="50" cy="35" rx="8" ry="10" fill="url(#bike-body-grad)" stroke="#38bdf8" strokeWidth="1"/>

        {/* 6. Rider Body (Top-down 3D perspective) */}
        <path d="M 36 42 Q 50 38 64 42 Q 62 58 50 58 Q 38 58 36 42 Z" fill="url(#jacket-grad)"/>
        {/* Backpack / Delivery Carrier Straps */}
        <rect x="42" y="44" width="3" height="12" rx="1.5" fill="#1e293b"/>
        <rect x="55" y="44" width="3" height="12" rx="1.5" fill="#1e293b"/>

        {/* 7. Rider 3D Helmet (Top-Down spherical with visor) */}
        <circle cx="50" cy="45" r="9" fill="url(#helmet-grad)" stroke="#0f172a" strokeWidth="1.2"/>
        {/* Visor */}
        <path d="M 43 40 Q 50 36 57 40 Q 55 43 50 43 Q 45 43 43 40 Z" fill="url(#visor-grad)" stroke="#38bdf8" strokeWidth="0.6"/>
        {/* Aerodynamic helmet crest */}
        <path d="M 49 37 L 51 37 L 51 52 L 49 52 Z" fill="#ffffff" opacity="0.4"/>

        {/* 8. Seat */}
        <path d="M 44 57 Q 50 55 56 57 L 54 68 Q 50 70 46 68 Z" fill="#090d16"/>

        {/* 9. Rear Delivery Box / Tail Rack (ZALDI branding) */}
        <rect x="40" y="68" width="20" height="16" rx="3" fill="url(#box-grad)" stroke="#38bdf8" strokeWidth="1.2"/>
        <rect x="43" y="71" width="14" height="10" rx="2" fill="#0369a1" opacity="0.8"/>
        {/* Zaldi 'Z' Logo on Box */}
        <text x="50" y="79" fill="#ffffff" fontFamily="system-ui, -apple-system, sans-serif" fontWeight="900" fontSize="8" textAnchor="middle">Z</text>

        {/* 10. Rear Tail Light & Rear Tire */}
        <rect x="46" y="84" width="8" height="10" rx="3" fill="url(#tire-grad)" stroke="#475569" strokeWidth="0.6"/>
        <ellipse cx="50" cy="84" rx="5" ry="1.5" fill="#ef4444" opacity="0.9"/>
      </g>
    </svg>
  );
};
