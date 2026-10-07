import React from 'react';
import { 
  Vehicle5dIcon, 
  LiveMap5dVehicleMarker, 
  Destination5dPin,
  getVehicleImageSrc,
  getVehicleTheme,
  VehicleTierType,
  VEHICLE_5D_THEMES
} from './Vehicle5dIcon';

export { 
  Vehicle5dIcon, 
  LiveMap5dVehicleMarker, 
  Destination5dPin, 
  getVehicleImageSrc, 
  getVehicleTheme, 
  VEHICLE_5D_THEMES 
};
export type { VehicleTierType };

interface Vehicle3dIconProps {
  type: VehicleTierType;
  size?: number;
  className?: string;
  heading?: number;
  showShadow?: boolean;
  isSelected?: boolean;
}

/**
 * Modern 5D Vehicle Icon Component
 * Enhanced with multi-dimensional lighting, chromatic tier neon underglow,
 * specular reflection, and floating depth elevation.
 */
export const Vehicle3dIcon: React.FC<Vehicle3dIconProps> = ({
  type,
  size = 40,
  className = "",
  heading = 0,
  isSelected = false
}) => {
  return (
    <Vehicle5dIcon
      type={type}
      size={size}
      heading={heading}
      isSelected={isSelected}
      className={className}
    />
  );
};

interface LiveMapVehicleMarkerProps {
  type: string;
  size?: number;
  heading?: number;
  label?: string;
  className?: string;
}

/**
 * Live Map 5D Vehicle Marker - Specially designed for live map navigation.
 * ZERO background circle/rectangle. The 5D vehicle sits directly on the road
 * with natural directional rotation, road contact shadow, and forward headlight cone.
 */
export const LiveMapVehicleMarker: React.FC<LiveMapVehicleMarkerProps> = ({
  type,
  size = 38,
  heading = 0,
  label,
  className = ""
}) => {
  return (
    <LiveMap5dVehicleMarker
      type={type}
      size={size}
      heading={heading}
      label={label}
      className={className}
    />
  );
};

interface Destination3dPinProps {
  className?: string;
  size?: number;
  showBadge?: boolean;
  address?: string;
}

/**
 * Destination 5D Pin Marker - Modern 5D PNG pin with ZERO background container.
 */
export const Destination3dPin: React.FC<Destination3dPinProps> = ({
  className = "",
  size = 36,
  showBadge = true,
  address
}) => {
  return (
    <Destination5dPin
      className={className}
      size={size}
      showBadge={showBadge}
      address={address}
    />
  );
};
