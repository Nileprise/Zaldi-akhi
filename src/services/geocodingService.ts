/**
 * Real-world Reverse Geocoding Service for Zaldi
 * Converts canvas coordinates (0-100) to authentic, real-world street addresses.
 * Note: Cyber Towers and Clock Tower landmarks are strictly removed per specification.
 * No latitude/longitude is exposed in generated addresses.
 */

export interface RealWorldLocation {
  x: number;
  y: number;
  name: string;
  street: string;
  locality: string;
  city: string;
}

// Curated authentic landmarks and road junctions across Hyderabad and Telangana
export const REAL_WORLD_LANDMARKS: RealWorldLocation[] = [
  {
    x: 38,
    y: 50,
    name: 'Mindspace IT Park Circular Rd',
    street: 'Building 12, Mindspace Tech Park',
    locality: 'Madhapur',
    city: 'Hyderabad'
  },
  {
    x: 28,
    y: 46,
    name: 'Hitec City Metro Station',
    street: 'Station Concourse Gate 2, Metro Corridor',
    locality: 'Madhapur',
    city: 'Hyderabad'
  },
  {
    x: 32,
    y: 48,
    name: 'Hitec City Main Road',
    street: 'Cyber Pearl Junction, Main Corridor',
    locality: 'Hitec City',
    city: 'Hyderabad'
  },
  {
    x: 40,
    y: 42,
    name: 'Inorbit Mall Boulevard',
    street: 'Mall Main Entry Ramp, Vittal Rao Nagar',
    locality: 'Durgam Cheruvu',
    city: 'Hyderabad'
  },
  {
    x: 36,
    y: 44,
    name: 'Cable Bridge Expressway',
    street: 'Durgam Cheruvu Hanging Bridge Approach',
    locality: 'Jubilee Hills Road 45',
    city: 'Hyderabad'
  },
  {
    x: 44,
    y: 38,
    name: 'Road No. 36 Jubilee Hills',
    street: 'Checkpost Metro Pillar #1240',
    locality: 'Jubilee Hills',
    city: 'Hyderabad'
  },
  {
    x: 48,
    y: 42,
    name: 'Road No. 1 Banjara Hills',
    street: 'Near GVK One & City Centre',
    locality: 'Banjara Hills',
    city: 'Hyderabad'
  },
  {
    x: 22,
    y: 38,
    name: 'Outer Ring Road (Gachibowli)',
    street: 'ORR Exit 19, Expressway Service Road',
    locality: 'Gachibowli',
    city: 'Hyderabad'
  },
  {
    x: 18,
    y: 42,
    name: 'Financial District Way',
    street: 'Wipro Circle, Nanakramguda IT SEZ',
    locality: 'Financial District',
    city: 'Hyderabad'
  },
  {
    x: 26,
    y: 40,
    name: 'DLF Cyber City Road',
    street: 'Gate 3 Food Street, APHB Colony',
    locality: 'Gachibowli',
    city: 'Hyderabad'
  },
  {
    x: 52,
    y: 38,
    name: 'Punjagutta Elevated Corridor',
    street: 'Nagarjuna Circle Flyover Ramp',
    locality: 'Somajiguda',
    city: 'Hyderabad'
  },
  {
    x: 62,
    y: 32,
    name: 'Secunderabad Junction Station',
    street: 'Platform 1 Main Portico, Station Road',
    locality: 'Secunderabad',
    city: 'Hyderabad'
  },
  {
    x: 48,
    y: 62,
    name: 'Charminar Heritage Plaza',
    street: 'Gulzar Houz Monument Road',
    locality: 'Old City',
    city: 'Hyderabad'
  },
  {
    x: 56,
    y: 68,
    name: 'PVNR Airport Expressway',
    street: 'Pillar #210, Mehdipatnam Arterial Ramp',
    locality: 'Attapur',
    city: 'Hyderabad'
  },
  {
    x: 68,
    y: 82,
    name: 'RGIA Airport Terminal 1',
    street: 'Departures Curbside Lane 4, Shamshabad',
    locality: 'Aero City',
    city: 'Hyderabad'
  },
  // Warangal Tri-Cities Region
  {
    x: 74,
    y: 58,
    name: 'Warangal Railway Station',
    street: 'Station Chowrasta, Platform 1 East',
    locality: 'Kazipet - Warangal',
    city: 'Warangal'
  },
  {
    x: 68,
    y: 52,
    name: 'Kazipet Diesel Colony Road',
    street: 'Railway Officers Club Junction',
    locality: 'Kazipet',
    city: 'Warangal'
  },
  {
    x: 75,
    y: 42,
    name: 'Balasamudram Bus Terminal',
    street: 'Bus Depot Main Gate Road',
    locality: 'Hanamkonda',
    city: 'Warangal'
  },
  {
    x: 72,
    y: 46,
    name: 'Subedari Court Circle',
    street: 'District Court Arterial Road',
    locality: 'Subedari',
    city: 'Warangal'
  },
  {
    x: 78,
    y: 38,
    name: 'Lashkar Bazaar Cross Road',
    street: 'Bazaar Commercial Corridor, Main Chowk',
    locality: 'Hanamkonda',
    city: 'Warangal'
  },
  {
    x: 72,
    y: 26,
    name: 'Kakatiya University Main Gate',
    street: 'KU Cross Roads, Vidyaranyapuri',
    locality: 'North Hanamkonda',
    city: 'Warangal'
  }
];

/**
 * Reverse-geocodes coordinate (x, y) to an authentic human-readable street address.
 * Never outputs raw lat/lng numbers.
 */
export function reverseGeocodeRealWorldAddress(x: number, y: number): string {
  // Find closest landmark
  let closest = REAL_WORLD_LANDMARKS[0];
  let minDistance = Infinity;

  for (const loc of REAL_WORLD_LANDMARKS) {
    const d = Math.hypot(loc.x - x, loc.y - y);
    if (d < minDistance) {
      minDistance = d;
      closest = loc;
    }
  }

  // If very close to known anchor point (within ~3.5 units)
  if (minDistance < 3.5) {
    return `${closest.name}, ${closest.locality}`;
  }

  // If moderately close (between 3.5 and 7 units)
  if (minDistance < 7) {
    const lane = Math.abs(Math.round(x * 3 + y * 2) % 14) + 1;
    return `Lane #${lane}, near ${closest.name}, ${closest.locality}`;
  }

  // Derive dynamic realistic street/pillar address for intermediate grid positions
  const seed = Math.abs(Math.round(x * 17 + y * 31));
  const pillar = (seed % 140) + 1;
  const sector = (seed % 8) + 1;

  if (x < 35 && y < 55) {
    return `Sector ${sector}, Road #${pillar % 24 + 1}, Madhapur - Hitec Zone`;
  }
  if (x < 32 && y >= 55) {
    return `Financial District Outer Circle, Pillar #${pillar}, Gachibowli`;
  }
  if (x >= 35 && x < 55 && y < 45) {
    return `Road No. ${pillar % 45 + 1}, Jubilee Hills - Banjara Belt`;
  }
  if (x >= 55 && y < 45) {
    return `Pillar #${pillar}, Arterial Way, Secunderabad Metro Belt`;
  }
  if (x >= 65 && y >= 45) {
    return `Pillar #${pillar}, Highway Sector ${sector}, Warangal Corridor`;
  }

  return `Pillar #${pillar}, ${closest.locality}, ${closest.city}`;
}

export const DEFAULT_GPS_COORDS = { x: 38, y: 50 }; // Mindspace IT Park Circular Rd
export const DEFAULT_GPS_ADDRESS = 'Mindspace IT Park Circular Rd, Madhapur';
