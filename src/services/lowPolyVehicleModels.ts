import * as THREE from 'three';
import { GLTFExporter } from 'three/examples/jsm/exporters/GLTFExporter.js';

export type LowPolyVehicleType = 'bike' | 'auto' | 'sedan' | 'suv' | 'truck' | 'parcel';

export interface VehicleSpec {
  id: LowPolyVehicleType;
  name: string;
  category: string;
  description: string;
  lengthMeters: number;
  widthMeters: number;
  heightMeters: number;
  bodyColor: number;
  roofColor: number;
  accentColor: number;
  zColor: number;
  speedRating: string;
  capacityText: string;
}

export const LOW_POLY_VEHICLE_SPECS: Record<LowPolyVehicleType, VehicleSpec> = {
  bike: {
    id: 'bike',
    name: 'Zaldi Moto EV',
    category: '2-Wheeler',
    description: 'Ultra-agile electric two-wheeler with forward aerodynamic cockpit and high-contrast battery cell.',
    lengthMeters: 2.1,
    widthMeters: 0.8,
    heightMeters: 1.25,
    bodyColor: 0x0f172a, // Dark cyber chassis
    roofColor: 0x06b6d4, // Electric cyan tank/fairing
    accentColor: 0x38bdf8,
    zColor: 0xfacc15,   // Neon amber Zaldi 'Z'
    speedRating: '85 km/h',
    capacityText: '1 Rider + Helmet'
  },
  auto: {
    id: 'auto',
    name: 'Zaldi TukTuk 3W',
    category: '3-Wheeler Auto',
    description: 'Iconic Asian 3-wheeler with high-contrast canary yellow canopy roof and rich emerald cabin.',
    lengthMeters: 2.6,
    widthMeters: 1.3,
    heightMeters: 1.7,
    bodyColor: 0x15803d, // Rich emerald green lower chassis
    roofColor: 0xfacc15, // High-contrast bright yellow roof
    accentColor: 0xeab308,
    zColor: 0x0f172a,   // Deep slate Zaldi 'Z' on yellow roof
    speedRating: '55 km/h',
    capacityText: '3 Passengers'
  },
  sedan: {
    id: 'sedan',
    name: 'Zaldi Go Sedan',
    category: 'City Cab',
    description: 'Faceted low-poly sedan with high-contrast solar roof and deep royal cobalt body.',
    lengthMeters: 4.3,
    widthMeters: 1.75,
    heightMeters: 1.45,
    bodyColor: 0x1e3a8a, // Deep royal cobalt body
    roofColor: 0xfde047, // High-contrast solar yellow roof
    accentColor: 0x3b82f6,
    zColor: 0x0f172a,   // Bold Zaldi 'Z' badge
    speedRating: '120 km/h',
    capacityText: '4 Passengers'
  },
  suv: {
    id: 'suv',
    name: 'Zaldi Prime SUV',
    category: 'Premium SUV',
    description: 'Chunky muscular low-poly SUV with contrast titanium roof rack and high-clearance wheel arches.',
    lengthMeters: 4.7,
    widthMeters: 1.9,
    heightMeters: 1.8,
    bodyColor: 0x1e1b4b, // Deep midnight purple chassis
    roofColor: 0xc084fc, // High-contrast radiant purple/silver roof
    accentColor: 0x9333ea,
    zColor: 0xfacc15,   // Illuminated neon Zaldi 'Z'
    speedRating: '140 km/h',
    capacityText: '6 Passengers'
  },
  truck: {
    id: 'truck',
    name: 'Zaldi Haul Mini-Truck',
    category: 'Logistics Van',
    description: 'Cab-over low-poly delivery truck with high-contrast clean white freight box and dual rear axles.',
    lengthMeters: 5.2,
    widthMeters: 2.0,
    heightMeters: 2.3,
    bodyColor: 0x312e81, // Deep indigo cab
    roofColor: 0xf8fafc, // High-contrast bright white freight box
    accentColor: 0x6366f1,
    zColor: 0xfacc15,   // Large golden Zaldi 'Z' on cargo side
    speedRating: '90 km/h',
    capacityText: '1,200 kg Cargo'
  },
  parcel: {
    id: 'parcel',
    name: 'Zaldi Express Courier',
    category: 'Rapid Parcel',
    description: 'Step-through electric courier scooter with high-contrast fluorescent delivery box.',
    lengthMeters: 1.9,
    widthMeters: 0.75,
    heightMeters: 1.35,
    bodyColor: 0x064e3b, // Deep pine teal frame
    roofColor: 0x10b981, // High-contrast mint delivery cube
    accentColor: 0x34d399,
    zColor: 0xfacc15,   // Vivid neon Zaldi 'Z' on parcel cube
    speedRating: '65 km/h',
    capacityText: '45 L Cargo Box'
  }
};

/**
 * Creates a clean geometric 3D Zaldi 'Z' emblem mesh.
 */
function createZaldiZMesh(size = 0.5, thickness = 0.08, color = 0xfacc15): THREE.Mesh {
  const shape = new THREE.Shape();
  const s = size * 0.5;
  const bar = s * 0.35;

  // Outer Z polygon
  shape.moveTo(-s, s);
  shape.lineTo(s, s);
  shape.lineTo(s, s - bar);
  shape.lineTo(-s + bar * 1.2, -s + bar);
  shape.lineTo(s, -s + bar);
  shape.lineTo(s, -s);
  shape.lineTo(-s, -s);
  shape.lineTo(-s, -s + bar);
  shape.lineTo(s - bar * 1.2, s - bar);
  shape.lineTo(-s, s - bar);
  shape.closePath();

  const geom = new THREE.ExtrudeGeometry(shape, {
    depth: thickness,
    bevelEnabled: true,
    bevelSegments: 1,
    bevelSize: 0.02,
    bevelThickness: 0.02
  });

  const mat = new THREE.MeshStandardMaterial({
    color,
    roughness: 0.2,
    metalness: 0.6,
    flatShading: true,
    emissive: color,
    emissiveIntensity: 0.35
  });

  const mesh = new THREE.Mesh(geom, mat);
  mesh.castShadow = true;
  return mesh;
}

/**
 * Creates an octagonal low-poly tire.
 */
function createLowPolyWheel(radius = 0.35, width = 0.22, rimColor = 0xcbd5e1): THREE.Group {
  const group = new THREE.Group();
  
  // Tire (8-sided or 10-sided polygon cylinder for genuine low-poly feel)
  const tireGeom = new THREE.CylinderGeometry(radius, radius, width, 10);
  tireGeom.rotateZ(Math.PI / 2);
  const tireMat = new THREE.MeshStandardMaterial({
    color: 0x0f172a,
    roughness: 0.8,
    metalness: 0.1,
    flatShading: true
  });
  const tire = new THREE.Mesh(tireGeom, tireMat);
  tire.castShadow = true;
  group.add(tire);

  // Wheel rim
  const rimGeom = new THREE.CylinderGeometry(radius * 0.55, radius * 0.55, width * 1.05, 6);
  rimGeom.rotateZ(Math.PI / 2);
  const rimMat = new THREE.MeshStandardMaterial({
    color: rimColor,
    roughness: 0.3,
    metalness: 0.8,
    flatShading: true
  });
  const rim = new THREE.Mesh(rimGeom, rimMat);
  group.add(rim);

  return group;
}

/**
 * 1. Low-Poly Electric Bike (Zaldi Moto)
 */
export function createLowPolyBikeGroup(): THREE.Group {
  const group = new THREE.Group();
  group.name = 'Zaldi_LowPoly_Bike';

  // Materials
  const frameMat = new THREE.MeshStandardMaterial({
    color: 0x0f172a,
    roughness: 0.5,
    metalness: 0.4,
    flatShading: true
  });
  const bodyMat = new THREE.MeshStandardMaterial({
    color: 0x06b6d4, // High-contrast cyan
    roughness: 0.3,
    metalness: 0.3,
    flatShading: true
  });
  const seatMat = new THREE.MeshStandardMaterial({
    color: 0x1e293b,
    roughness: 0.9,
    flatShading: true
  });
  const lightMat = new THREE.MeshStandardMaterial({
    color: 0x38bdf8,
    emissive: 0x38bdf8,
    emissiveIntensity: 0.8,
    flatShading: true
  });

  // Wheels
  const frontWheel = createLowPolyWheel(0.36, 0.14, 0x38bdf8);
  frontWheel.position.set(0, 0.36, 0.95);
  group.add(frontWheel);

  const rearWheel = createLowPolyWheel(0.36, 0.16, 0x38bdf8);
  rearWheel.position.set(0, 0.36, -0.95);
  group.add(rearWheel);

  // Main chassis / frame spine
  const frameGeom = new THREE.BoxGeometry(0.2, 0.35, 1.4);
  const frame = new THREE.Mesh(frameGeom, frameMat);
  frame.position.set(0, 0.6, 0);
  frame.rotation.x = -0.15;
  group.add(frame);

  // Fuel / Battery Cowl (High-contrast body)
  const tankGeom = new THREE.BoxGeometry(0.38, 0.45, 0.8);
  const tank = new THREE.Mesh(tankGeom, bodyMat);
  tank.position.set(0, 0.85, 0.15);
  tank.rotation.x = 0.2;
  group.add(tank);

  // Zaldi Z emblem on battery tank side
  const zLeft = createZaldiZMesh(0.24, 0.03, 0xfacc15);
  zLeft.rotation.y = -Math.PI / 2;
  zLeft.position.set(-0.21, 0.85, 0.15);
  group.add(zLeft);

  const zRight = createZaldiZMesh(0.24, 0.03, 0xfacc15);
  zRight.rotation.y = Math.PI / 2;
  zRight.position.set(0.21, 0.85, 0.15);
  group.add(zRight);

  // Seat
  const seatGeom = new THREE.BoxGeometry(0.3, 0.14, 0.75);
  const seat = new THREE.Mesh(seatGeom, seatMat);
  seat.position.set(0, 0.88, -0.45);
  seat.rotation.x = 0.08;
  group.add(seat);

  // Handlebars & Front Fork
  const forkGeom = new THREE.BoxGeometry(0.12, 0.9, 0.12);
  const fork = new THREE.Mesh(forkGeom, frameMat);
  fork.position.set(0, 0.72, 0.8);
  fork.rotation.x = -0.32;
  group.add(fork);

  const barGeom = new THREE.BoxGeometry(0.75, 0.08, 0.08);
  const bar = new THREE.Mesh(barGeom, frameMat);
  bar.position.set(0, 1.1, 0.65);
  group.add(bar);

  // Angular Headlight
  const headGeom = new THREE.BoxGeometry(0.22, 0.2, 0.16);
  const head = new THREE.Mesh(headGeom, lightMat);
  head.position.set(0, 0.98, 0.85);
  group.add(head);

  return group;
}

/**
 * 2. Low-Poly Auto Rickshaw (Zaldi TukTuk)
 */
export function createLowPolyAutoGroup(): THREE.Group {
  const group = new THREE.Group();
  group.name = 'Zaldi_LowPoly_Auto';

  // Materials
  const chassisMat = new THREE.MeshStandardMaterial({
    color: 0x15803d, // Rich emerald green
    roughness: 0.35,
    metalness: 0.2,
    flatShading: true
  });
  const roofMat = new THREE.MeshStandardMaterial({
    color: 0xfacc15, // High-contrast bright canary yellow
    roughness: 0.25,
    metalness: 0.1,
    flatShading: true
  });
  const blackMat = new THREE.MeshStandardMaterial({
    color: 0x0f172a,
    roughness: 0.7,
    flatShading: true
  });
  const glassMat = new THREE.MeshStandardMaterial({
    color: 0x38bdf8,
    roughness: 0.1,
    metalness: 0.9,
    opacity: 0.85,
    transparent: true,
    flatShading: true
  });

  // Front single wheel
  const frontWheel = createLowPolyWheel(0.32, 0.16, 0xfacc15);
  frontWheel.position.set(0, 0.32, 1.05);
  group.add(frontWheel);

  // Rear dual wheels
  const rearLeft = createLowPolyWheel(0.34, 0.18, 0x15803d);
  rearLeft.position.set(-0.65, 0.34, -0.65);
  group.add(rearLeft);

  const rearRight = createLowPolyWheel(0.34, 0.18, 0x15803d);
  rearRight.position.set(0.65, 0.34, -0.65);
  group.add(rearRight);

  // Front Tapered Nose / Hood (Green)
  const noseGeom = new THREE.BoxGeometry(0.85, 0.55, 0.8);
  const nose = new THREE.Mesh(noseGeom, chassisMat);
  nose.position.set(0, 0.65, 0.75);
  group.add(nose);

  // Front Windshield
  const windGeom = new THREE.BoxGeometry(0.9, 0.6, 0.08);
  const wind = new THREE.Mesh(windGeom, glassMat);
  wind.position.set(0, 1.15, 0.52);
  wind.rotation.x = -0.28;
  group.add(wind);

  // Lower Cabin Tub (Emerald Green)
  const tubGeom = new THREE.BoxGeometry(1.3, 0.55, 1.5);
  const tub = new THREE.Mesh(tubGeom, chassisMat);
  tub.position.set(0, 0.65, -0.3);
  group.add(tub);

  // High-Contrast Roof Canopy (Bright Yellow)
  const roofGeom = new THREE.BoxGeometry(1.28, 0.22, 1.95);
  const roof = new THREE.Mesh(roofGeom, roofMat);
  roof.position.set(0, 1.62, -0.05);
  group.add(roof);

  // Roof Support Pillars
  const pillarGeom = new THREE.BoxGeometry(0.06, 0.8, 0.06);
  [-0.58, 0.58].forEach(x => {
    [-0.85, 0.35].forEach(z => {
      const p = new THREE.Mesh(pillarGeom, blackMat);
      p.position.set(x, 1.15, z);
      group.add(p);
    });
  });

  // Zaldi Z on the Roof (Readable from top-down and isometric!)
  const zRoof = createZaldiZMesh(0.55, 0.05, 0x0f172a);
  zRoof.rotation.x = -Math.PI / 2;
  zRoof.position.set(0, 1.74, -0.05);
  group.add(zRoof);

  // Headlight on front nose
  const lightMat = new THREE.MeshStandardMaterial({
    color: 0xfef08a,
    emissive: 0xfef08a,
    emissiveIntensity: 0.9,
    flatShading: true
  });
  const headlight = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.2, 0.1), lightMat);
  headlight.position.set(0, 0.7, 1.16);
  group.add(headlight);

  return group;
}

/**
 * 3. Low-Poly City Sedan (Zaldi Go)
 */
export function createLowPolySedanGroup(): THREE.Group {
  const group = new THREE.Group();
  group.name = 'Zaldi_LowPoly_Sedan';

  // Materials
  const bodyMat = new THREE.MeshStandardMaterial({
    color: 0x1e3a8a, // Deep royal cobalt blue
    roughness: 0.3,
    metalness: 0.35,
    flatShading: true
  });
  const roofMat = new THREE.MeshStandardMaterial({
    color: 0xfde047, // High-contrast solar yellow
    roughness: 0.25,
    metalness: 0.1,
    flatShading: true
  });
  const glassMat = new THREE.MeshStandardMaterial({
    color: 0x38bdf8,
    roughness: 0.15,
    metalness: 0.85,
    opacity: 0.85,
    transparent: true,
    flatShading: true
  });

  // 4 Wheels
  const wheelPositions = [
    [-0.88, 0.35, 1.2],
    [0.88, 0.35, 1.2],
    [-0.88, 0.35, -1.2],
    [0.88, 0.35, -1.2]
  ];
  wheelPositions.forEach(([x, y, z]) => {
    const w = createLowPolyWheel(0.35, 0.2, 0xfde047);
    w.position.set(x, y, z);
    group.add(w);
  });

  // Lower Body Chassis (Blue)
  const chassisGeom = new THREE.BoxGeometry(1.65, 0.52, 3.8);
  const chassis = new THREE.Mesh(chassisGeom, bodyMat);
  chassis.position.set(0, 0.62, 0);
  group.add(chassis);

  // Front Hood wedge
  const hoodGeom = new THREE.BoxGeometry(1.62, 0.22, 1.1);
  const hood = new THREE.Mesh(hoodGeom, bodyMat);
  hood.position.set(0, 0.78, 1.25);
  hood.rotation.x = -0.12;
  group.add(hood);

  // Rear Trunk deck
  const trunkGeom = new THREE.BoxGeometry(1.62, 0.25, 0.9);
  const trunk = new THREE.Mesh(trunkGeom, bodyMat);
  trunk.position.set(0, 0.8, -1.35);
  group.add(trunk);

  // Cabin Greenhouse / Windows
  const cabinGeom = new THREE.BoxGeometry(1.4, 0.55, 1.85);
  const cabin = new THREE.Mesh(cabinGeom, glassMat);
  cabin.position.set(0, 1.12, -0.05);
  group.add(cabin);

  // High-Contrast Roof
  const roofGeom = new THREE.BoxGeometry(1.36, 0.12, 1.6);
  const roof = new THREE.Mesh(roofGeom, roofMat);
  roof.position.set(0, 1.42, -0.05);
  group.add(roof);

  // Zaldi Z on the Roof
  const zRoof = createZaldiZMesh(0.55, 0.04, 0x0f172a);
  zRoof.rotation.x = -Math.PI / 2;
  zRoof.position.set(0, 1.49, -0.05);
  group.add(zRoof);

  // Front Headlights
  const lightMat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    emissive: 0x38bdf8,
    emissiveIntensity: 0.9,
    flatShading: true
  });
  [-0.6, 0.6].forEach(x => {
    const l = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.14, 0.08), lightMat);
    l.position.set(x, 0.66, 1.91);
    group.add(l);
  });

  return group;
}

/**
 * 4. Low-Poly Rugged SUV (Zaldi Prime SUV)
 */
export function createLowPolySuvGroup(): THREE.Group {
  const group = new THREE.Group();
  group.name = 'Zaldi_LowPoly_Suv';

  // Materials
  const bodyMat = new THREE.MeshStandardMaterial({
    color: 0x1e1b4b, // Deep midnight purple
    roughness: 0.35,
    metalness: 0.3,
    flatShading: true
  });
  const roofMat = new THREE.MeshStandardMaterial({
    color: 0xc084fc, // High-contrast radiant purple/silver
    roughness: 0.25,
    metalness: 0.15,
    flatShading: true
  });
  const rackMat = new THREE.MeshStandardMaterial({
    color: 0x38bdf8,
    roughness: 0.3,
    metalness: 0.7,
    flatShading: true
  });
  const glassMat = new THREE.MeshStandardMaterial({
    color: 0x38bdf8,
    roughness: 0.1,
    metalness: 0.8,
    opacity: 0.85,
    transparent: true,
    flatShading: true
  });

  // 4 Chunky Wheels (Taller clearance)
  const wheelPositions = [
    [-0.96, 0.44, 1.35],
    [0.96, 0.44, 1.35],
    [-0.96, 0.44, -1.35],
    [0.96, 0.44, -1.35]
  ];
  wheelPositions.forEach(([x, y, z]) => {
    const w = createLowPolyWheel(0.44, 0.26, 0xc084fc);
    w.position.set(x, y, z);
    group.add(w);
  });

  // Lower Body Chassis
  const chassisGeom = new THREE.BoxGeometry(1.82, 0.65, 4.2);
  const chassis = new THREE.Mesh(chassisGeom, bodyMat);
  chassis.position.set(0, 0.82, 0);
  group.add(chassis);

  // Chunky Wheel Arches
  const archMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, flatShading: true });
  wheelPositions.forEach(([x, y, z]) => {
    const arch = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.5, 0.95), archMat);
    arch.position.set(x > 0 ? 0.85 : -0.85, 0.78, z);
    group.add(arch);
  });

  // Tall Greenhouse Cabin
  const cabinGeom = new THREE.BoxGeometry(1.58, 0.72, 2.4);
  const cabin = new THREE.Mesh(cabinGeom, glassMat);
  cabin.position.set(0, 1.38, -0.3);
  group.add(cabin);

  // High-Contrast Flat Roof
  const roofGeom = new THREE.BoxGeometry(1.54, 0.16, 2.45);
  const roof = new THREE.Mesh(roofGeom, roofMat);
  roof.position.set(0, 1.76, -0.3);
  group.add(roof);

  // Low-Poly Roof Rack Rails
  [-0.65, 0.65].forEach(x => {
    const rail = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.12, 2.2), rackMat);
    rail.position.set(x, 1.88, -0.3);
    group.add(rail);
  });

  // Zaldi Z on SUV Roof
  const zRoof = createZaldiZMesh(0.65, 0.05, 0xfacc15);
  zRoof.rotation.x = -Math.PI / 2;
  zRoof.position.set(0, 1.86, -0.3);
  group.add(zRoof);

  // Skid plate & Front Grille
  const skid = new THREE.Mesh(
    new THREE.BoxGeometry(1.4, 0.25, 0.2), 
    new THREE.MeshStandardMaterial({ color: 0xcbd5e1, metalness: 0.8, flatShading: true })
  );
  skid.position.set(0, 0.55, 2.1);
  group.add(skid);

  return group;
}

/**
 * 5. Low-Poly Cargo Delivery Truck (Zaldi Haul)
 */
export function createLowPolyTruckGroup(): THREE.Group {
  const group = new THREE.Group();
  group.name = 'Zaldi_LowPoly_Truck';

  // Materials
  const cabMat = new THREE.MeshStandardMaterial({
    color: 0x312e81, // Deep indigo cab
    roughness: 0.35,
    metalness: 0.25,
    flatShading: true
  });
  const cargoBoxMat = new THREE.MeshStandardMaterial({
    color: 0xf8fafc, // High-contrast clean white freight box
    roughness: 0.2,
    metalness: 0.05,
    flatShading: true
  });
  const chassisMat = new THREE.MeshStandardMaterial({
    color: 0x0f172a,
    roughness: 0.8,
    flatShading: true
  });
  const glassMat = new THREE.MeshStandardMaterial({
    color: 0x38bdf8,
    roughness: 0.1,
    metalness: 0.9,
    opacity: 0.85,
    transparent: true,
    flatShading: true
  });

  // 6 Wheels (Cab-over + Dual Rear Axle)
  const wheels = [
    [-0.92, 0.42, 1.55],
    [0.92, 0.42, 1.55],
    [-0.92, 0.42, -0.75],
    [0.92, 0.42, -0.75],
    [-0.92, 0.42, -1.65],
    [0.92, 0.42, -1.65]
  ];
  wheels.forEach(([x, y, z]) => {
    const w = createLowPolyWheel(0.42, 0.24, 0x6366f1);
    w.position.set(x, y, z);
    group.add(w);
  });

  // Main chassis frame rails
  const frame = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.3, 4.8), chassisMat);
  frame.position.set(0, 0.65, -0.1);
  group.add(frame);

  // Front Cab (Cab-over)
  const cabGeom = new THREE.BoxGeometry(1.85, 1.35, 1.35);
  const cab = new THREE.Mesh(cabGeom, cabMat);
  cab.position.set(0, 1.35, 1.6);
  group.add(cab);

  // Cab Windshield
  const windGeom = new THREE.BoxGeometry(1.65, 0.65, 0.1);
  const wind = new THREE.Mesh(windGeom, glassMat);
  wind.position.set(0, 1.55, 2.29);
  group.add(wind);

  // Large Freight Cargo Box (Bright White High-Contrast)
  const boxGeom = new THREE.BoxGeometry(1.95, 1.75, 3.25);
  const cargoBox = new THREE.Mesh(boxGeom, cargoBoxMat);
  cargoBox.position.set(0, 1.72, -0.8);
  group.add(cargoBox);

  // Zaldi Z on Left Side of Cargo Box
  const zLeft = createZaldiZMesh(0.85, 0.05, 0xfacc15);
  zLeft.rotation.y = -Math.PI / 2;
  zLeft.position.set(-0.99, 1.75, -0.8);
  group.add(zLeft);

  // Zaldi Z on Right Side of Cargo Box
  const zRight = createZaldiZMesh(0.85, 0.05, 0xfacc15);
  zRight.rotation.y = Math.PI / 2;
  zRight.position.set(0.99, 1.75, -0.8);
  group.add(zRight);

  // Zaldi Z on Top of Cargo Box (for bird-eye and map views!)
  const zTop = createZaldiZMesh(0.85, 0.05, 0x312e81);
  zTop.rotation.x = -Math.PI / 2;
  zTop.position.set(0, 2.61, -0.8);
  group.add(zTop);

  return group;
}

/**
 * 6. Low-Poly Parcel Courier Scooter (Zaldi Express)
 */
export function createLowPolyParcelGroup(): THREE.Group {
  const group = new THREE.Group();
  group.name = 'Zaldi_LowPoly_Parcel';

  // Materials
  const frameMat = new THREE.MeshStandardMaterial({
    color: 0x064e3b, // Deep teal frame
    roughness: 0.4,
    metalness: 0.3,
    flatShading: true
  });
  const boxMat = new THREE.MeshStandardMaterial({
    color: 0x10b981, // High-contrast mint delivery cube
    roughness: 0.25,
    metalness: 0.1,
    flatShading: true
  });
  const blackMat = new THREE.MeshStandardMaterial({
    color: 0x0f172a,
    roughness: 0.8,
    flatShading: true
  });

  // Wheels
  const frontWheel = createLowPolyWheel(0.32, 0.13, 0x34d399);
  frontWheel.position.set(0, 0.32, 0.85);
  group.add(frontWheel);

  const rearWheel = createLowPolyWheel(0.32, 0.15, 0x34d399);
  rearWheel.position.set(0, 0.32, -0.75);
  group.add(rearWheel);

  // Step-through scooter floorboard & apron
  const floorGeom = new THREE.BoxGeometry(0.38, 0.12, 1.1);
  const floor = new THREE.Mesh(floorGeom, frameMat);
  floor.position.set(0, 0.4, 0.05);
  group.add(floor);

  const apronGeom = new THREE.BoxGeometry(0.46, 0.65, 0.22);
  const apron = new THREE.Mesh(apronGeom, frameMat);
  apron.position.set(0, 0.72, 0.65);
  apron.rotation.x = -0.22;
  group.add(apron);

  // Handlebars
  const bar = new THREE.Mesh(new THREE.BoxGeometry(0.68, 0.07, 0.07), blackMat);
  bar.position.set(0, 1.08, 0.55);
  group.add(bar);

  // Rider Seat
  const seat = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.14, 0.45), blackMat);
  seat.position.set(0, 0.68, -0.15);
  group.add(seat);

  // Large High-Contrast Cubic Delivery Box on Rear Rack
  const cargoCubeGeom = new THREE.BoxGeometry(0.72, 0.72, 0.72);
  const cargoCube = new THREE.Mesh(cargoCubeGeom, boxMat);
  cargoCube.position.set(0, 1.02, -0.65);
  group.add(cargoCube);

  // Zaldi Z on Top of Delivery Box
  const zTop = createZaldiZMesh(0.42, 0.03, 0xfacc15);
  zTop.rotation.x = -Math.PI / 2;
  zTop.position.set(0, 1.39, -0.65);
  group.add(zTop);

  // Zaldi Z on Left Side
  const zLeft = createZaldiZMesh(0.38, 0.03, 0xfacc15);
  zLeft.rotation.y = -Math.PI / 2;
  zLeft.position.set(-0.37, 1.02, -0.65);
  group.add(zLeft);

  // Zaldi Z on Right Side
  const zRight = createZaldiZMesh(0.38, 0.03, 0xfacc15);
  zRight.rotation.y = Math.PI / 2;
  zRight.position.set(0.37, 1.02, -0.65);
  group.add(zRight);

  return group;
}

/**
 * Factory to instantiate a fresh Three.js Group for any vehicle type.
 */
export function createLowPolyVehicleMesh(type: LowPolyVehicleType): THREE.Group {
  switch (type) {
    case 'bike': return createLowPolyBikeGroup();
    case 'auto': return createLowPolyAutoGroup();
    case 'sedan': return createLowPolySedanGroup();
    case 'suv': return createLowPolySuvGroup();
    case 'truck': return createLowPolyTruckGroup();
    case 'parcel': return createLowPolyParcelGroup();
    default: return createLowPolySedanGroup();
  }
}

/**
 * Standardizes vehicle camera and scale for consistent camera angle and scale.
 * Isometric elevated camera: azimuth ~45°, elevation ~35°.
 */
export function normalizeVehicleScale(group: THREE.Group): THREE.Group {
  const box = new THREE.Box3().setFromObject(group);
  const size = new THREE.Vector3();
  box.getSize(size);
  const maxDim = Math.max(size.x, size.y, size.z);
  const targetSize = 2.5; // Normalized bounding scale
  const scale = targetSize / maxDim;
  group.scale.set(scale, scale, scale);

  // Center on ground: bottom of bounding box at y=0, center x/z at 0
  const center = new THREE.Vector3();
  box.getCenter(center);
  group.position.set(-center.x * scale, -box.min.y * scale, -center.z * scale);

  const wrapper = new THREE.Group();
  wrapper.add(group);
  return wrapper;
}

/**
 * Exports a vehicle to a binary GLB ArrayBuffer.
 */
export async function exportVehicleToGLBBuffer(type: LowPolyVehicleType): Promise<ArrayBuffer> {
  const scene = new THREE.Scene();
  const vehicle = createLowPolyVehicleMesh(type);
  const normalized = normalizeVehicleScale(vehicle);
  scene.add(normalized);

  return new Promise((resolve, reject) => {
    const exporter = new GLTFExporter();
    exporter.parse(
      scene,
      (gltf) => {
        resolve(gltf as ArrayBuffer);
      },
      (error) => {
        reject(error);
      },
      { binary: true }
    );
  });
}

/**
 * Triggers a browser download of the vehicle GLB.
 */
export async function downloadVehicleGLB(type: LowPolyVehicleType, filename?: string): Promise<void> {
  const buffer = await exportVehicleToGLBBuffer(type);
  const blob = new Blob([buffer], { type: 'model/gltf-binary' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename || `zaldi-${type}-lowpoly.glb`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Renders the vehicle to a clean transparent PNG data URL with:
 * - NO baked ground / shadow
 * - 100% transparent background
 * - Consistent isometric camera angle
 * - High-contrast roof/body
 * - Strong silhouette
 */
export function renderVehicleToTransparentPNG(
  type: LowPolyVehicleType,
  width = 512,
  height = 512,
  headingDegrees = 0
): Promise<string> {
  return new Promise((resolve, reject) => {
    try {
      const scene = new THREE.Scene();

      // Lighting (Clean studio directional + ambient)
      const ambientLight = new THREE.AmbientLight(0xffffff, 1.2);
      scene.add(ambientLight);

      const dirLight1 = new THREE.DirectionalLight(0xffffff, 2.2);
      dirLight1.position.set(5, 10, 7);
      scene.add(dirLight1);

      const dirLight2 = new THREE.DirectionalLight(0x93c5fd, 1.0);
      dirLight2.position.set(-6, 4, -5);
      scene.add(dirLight2);

      // Vehicle
      const vehicle = createLowPolyVehicleMesh(type);
      const normalized = normalizeVehicleScale(vehicle);
      if (headingDegrees !== 0) {
        normalized.rotation.y = THREE.MathUtils.degToRad(headingDegrees);
      }
      scene.add(normalized);

      // Camera: Consistent elevated isometric angle (elevation 32°, azimuth 45°)
      const aspect = width / height;
      const camera = new THREE.PerspectiveCamera(35, aspect, 0.1, 100);
      
      const distance = 5.2;
      const elevation = Math.PI / 6; // ~30 deg
      const azimuth = Math.PI / 4;   // 45 deg
      
      const camX = distance * Math.cos(elevation) * Math.sin(azimuth);
      const camY = distance * Math.sin(elevation) + 0.5;
      const camZ = distance * Math.cos(elevation) * Math.cos(azimuth);
      
      camera.position.set(camX, camY, camZ);
      camera.lookAt(0, 0.75, 0);

      // Offscreen Canvas WebGL Renderer
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;

      const renderer = new THREE.WebGLRenderer({
        canvas,
        alpha: true,
        antialias: true,
        preserveDrawingBuffer: true
      });
      renderer.setSize(width, height);
      renderer.setClearColor(0x000000, 0); // 100% Transparent background!
      renderer.render(scene, camera);

      const dataUrl = canvas.toDataURL('image/png');
      renderer.dispose();
      resolve(dataUrl);
    } catch (err) {
      reject(err);
    }
  });
}

/**
 * Triggers a browser download of the transparent PNG.
 */
export async function downloadVehiclePNG(
  type: LowPolyVehicleType, 
  size = 512, 
  filename?: string
): Promise<void> {
  const dataUrl = await renderVehicleToTransparentPNG(type, size, size);
  const a = document.createElement('a');
  a.href = dataUrl;
  a.download = filename || `zaldi-${type}-lowpoly-transparent.png`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}
