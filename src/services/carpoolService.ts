import { RoutePoint } from '../types';

/**
 * Geometric helper: Distance from a point P to a line segment AB.
 * Returns { distanceUnits, projectionPoint, projectionFraction }
 */
export function pointToSegmentDistance(
  p: { x: number; y: number },
  a: { x: number; y: number },
  b: { x: number; y: number }
): { distance: number; projection: { x: number; y: number }; t: number } {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const lenSq = dx * dx + dy * dy;

  if (lenSq === 0) {
    const dist = Math.hypot(p.x - a.x, p.y - a.y);
    return { distance: dist, projection: { x: a.x, y: a.y }, t: 0 };
  }

  // Projection scalar t: dot product / lenSq
  let t = ((p.x - a.x) * dx + (p.y - a.y) * dy) / lenSq;
  t = Math.max(0, Math.min(1, t));

  const projX = a.x + t * dx;
  const projY = a.y + t * dy;
  const distance = Math.hypot(p.x - projX, p.y - projY);

  return { distance, projection: { x: projX, y: projY }, t };
}

/**
 * 1. ROUTE INTERPOLATION (The "On-Route" Check)
 * Calculates the perpendicular distance from passenger location to the driver's route polyline.
 * In our calibrated canvas space (1 canvas unit ≈ 0.22 km = 220m),
 * 500 meters is approximately 2.27 canvas units (0.50 km / 0.22 km).
 */
export function calculatePassengerOnRoute(
  passengerPos: { x: number; y: number },
  polylinePoints: RoutePoint[],
  maxToleranceMeters: number = 500
): {
  isOnRoute: boolean;
  distanceFromHighwayMeters: number;
  closestPoint: { x: number; y: number };
  segmentIndex: number;
  routeProgressFraction: number; // 0 to 1 along the entire driver route
} {
  if (polylinePoints.length < 2) {
    return {
      isOnRoute: false,
      distanceFromHighwayMeters: 9999,
      closestPoint: { x: 0, y: 0 },
      segmentIndex: 0,
      routeProgressFraction: 0
    };
  }

  // Precompute segment lengths and total length
  const segLengths: number[] = [];
  let totalLength = 0;
  for (let i = 0; i < polylinePoints.length - 1; i++) {
    const len = Math.hypot(
      polylinePoints[i + 1].x - polylinePoints[i].x,
      polylinePoints[i + 1].y - polylinePoints[i].y
    );
    segLengths.push(len);
    totalLength += len;
  }

  let minDistanceCanvasUnits = Infinity;
  let bestProjection = { x: polylinePoints[0].x, y: polylinePoints[0].y };
  let bestSegIndex = 0;
  let bestDistAlongRoute = 0;

  let currentDistAccum = 0;
  for (let i = 0; i < polylinePoints.length - 1; i++) {
    const a = polylinePoints[i];
    const b = polylinePoints[i + 1];
    const { distance, projection, t } = pointToSegmentDistance(passengerPos, a, b);

    if (distance < minDistanceCanvasUnits) {
      minDistanceCanvasUnits = distance;
      bestProjection = projection;
      bestSegIndex = i;
      bestDistAlongRoute = currentDistAccum + t * segLengths[i];
    }
    currentDistAccum += segLengths[i];
  }

  // 1 canvas unit = 220 meters
  const distanceFromHighwayMeters = Math.round(minDistanceCanvasUnits * 220);
  const isOnRoute = distanceFromHighwayMeters <= maxToleranceMeters;
  const routeProgressFraction = totalLength > 0 ? bestDistAlongRoute / totalLength : 0;

  return {
    isOnRoute,
    distanceFromHighwayMeters,
    closestPoint: bestProjection,
    segmentIndex: bestSegIndex,
    routeProgressFraction
  };
}

/**
 * 3. DIRECTIONAL FILTERING (The "Passed-Point" Edge Case)
 * Calculates the driver's bearing against the passenger's location.
 * Computes:
 * - Direct distance to passenger in km.
 * - Angle between driver's velocity heading vector and vector towards passenger.
 * - If angle > 90° (dot product < 0), the driver is moving away / has passed the passenger.
 * - Drop condition: if driver has already passed (moving away), drop immediately even if inside 5km!
 */
export function calculateDirectionalPassedPoint(
  driverPos: { x: number; y: number },
  driverHeadingDeg: number,
  passengerPos: { x: number; y: number },
  cutoffRadiusKm: number = 5.0
): {
  distanceKm: number;
  relativeBearingDeg: number;
  isMovingTowardsPassenger: boolean;
  hasPassedPassenger: boolean;
  isEligibleBeforeCutoff: boolean;
  dropReason?: string;
} {
  // Distance in canvas units: 1 unit ≈ 0.22 km
  const canvasDist = Math.hypot(passengerPos.x - driverPos.x, passengerPos.y - driverPos.y);
  const distanceKm = +(canvasDist * 0.22).toFixed(2);

  // Vector from driver to passenger
  const toPassX = passengerPos.x - driverPos.x;
  const toPassY = passengerPos.y - driverPos.y;

  // Driver heading angle converted to radians
  const headingRad = (driverHeadingDeg * Math.PI) / 180;
  // In screen SVG coords (Y is down): dx = sin(heading), dy = -cos(heading)
  const dirX = Math.sin(headingRad);
  const dirY = -Math.cos(headingRad);

  // Vector normalization
  const passVecLen = Math.hypot(toPassX, toPassY);
  let dot = 0;
  if (passVecLen > 0) {
    dot = (dirX * (toPassX / passVecLen)) + (dirY * (toPassY / passVecLen));
  }

  // Dot product > 0 means within ±90 degrees in front of vehicle (moving towards)
  // Dot product <= 0 means behind the vehicle (has passed / moving away)
  const isMovingTowardsPassenger = dot > 0.05;
  const hasPassedPassenger = dot <= 0.05 && distanceKm > 0.15;

  let isEligible = true;
  let dropReason: string | undefined;

  if (distanceKm > cutoffRadiusKm) {
    isEligible = false;
    dropReason = `Beyond ${cutoffRadiusKm}km coverage radius (${distanceKm}km away)`;
  } else if (hasPassedPassenger) {
    isEligible = false;
    dropReason = `Driver has passed pickup point (bearing away by ${Math.round(Math.acos(Math.max(-1, Math.min(1, dot))) * 180 / Math.PI)}°)`;
  }

  return {
    distanceKm,
    relativeBearingDeg: Math.round(Math.acos(Math.max(-1, Math.min(1, dot))) * 180 / Math.PI),
    isMovingTowardsPassenger,
    hasPassedPassenger,
    isEligibleBeforeCutoff: isEligible,
    dropReason
  };
}

/**
 * 2. THROTTLED LOCATION TELEMETRY
 * Tracks client-side updates: pushes new location only if moved >= minDistanceMeters
 * OR elapsed >= maxIntervalMs.
 */
export interface TelemetryThrottleState {
  lastPushedPos: { x: number; y: number } | null;
  lastPushedTime: number;
  totalPushesSaved: number;
  totalWritesSent: number;
}

export function evaluateLocationThrottle(
  currentPos: { x: number; y: number },
  currentTime: number,
  state: TelemetryThrottleState,
  minDistanceMeters: number = 50,
  maxIntervalMs: number = 10000
): {
  shouldPush: boolean;
  distanceMovedMeters: number;
  elapsedMs: number;
  reason: 'DISTANCE' | 'TIME_ELAPSED' | 'INITIAL' | 'THROTTLED';
} {
  if (!state.lastPushedPos) {
    return {
      shouldPush: true,
      distanceMovedMeters: 0,
      elapsedMs: 0,
      reason: 'INITIAL'
    };
  }

  const canvasDist = Math.hypot(
    currentPos.x - state.lastPushedPos.x,
    currentPos.y - state.lastPushedPos.y
  );
  const distanceMovedMeters = Math.round(canvasDist * 220);
  const elapsedMs = currentTime - state.lastPushedTime;

  if (distanceMovedMeters >= minDistanceMeters) {
    return {
      shouldPush: true,
      distanceMovedMeters,
      elapsedMs,
      reason: 'DISTANCE'
    };
  }

  if (elapsedMs >= maxIntervalMs) {
    return {
      shouldPush: true,
      distanceMovedMeters,
      elapsedMs,
      reason: 'TIME_ELAPSED'
    };
  }

  return {
    shouldPush: false,
    distanceMovedMeters,
    elapsedMs,
    reason: 'THROTTLED'
  };
}

/**
 * 4. DYNAMIC SEAT CAPACITY MANAGEMENT ALONG ROUTE SEGMENTS
 * Represents discrete segments of the driver's journey (e.g., stops A -> B -> C -> D).
 * Seat bookings consume capacity only on overlapping segments!
 */
export interface CarpoolRouteStop {
  id: string;
  name: string;
  order: number;
  location: { x: number; y: number };
  eta: string;
}

export interface SegmentSeatOccupancy {
  fromStopId: string;
  toStopId: string;
  fromStopName: string;
  toStopName: string;
  totalSeats: number;
  bookedSeats: number;
  availableSeats: number;
  passengerNames: string[];
}

export interface CarpoolSegmentBooking {
  bookingId: string;
  passengerName: string;
  fromStopId: string;
  toStopId: string;
  seatsCount: number;
  status: 'ACTIVE' | 'COMPLETED' | 'CANCELLED';
  bookedAt: string;
}

export function calculateSegmentSeatCapacities(
  stops: CarpoolRouteStop[],
  totalVehicleSeats: number,
  bookings: CarpoolSegmentBooking[]
): SegmentSeatOccupancy[] {
  const sortedStops = [...stops].sort((a, b) => a.order - b.order);
  const segments: SegmentSeatOccupancy[] = [];

  for (let i = 0; i < sortedStops.length - 1; i++) {
    const fromStop = sortedStops[i];
    const toStop = sortedStops[i + 1];

    // Find all active bookings that traverse this specific segment (from <= i and to >= i + 1)
    const overlappingBookings = bookings.filter(b => {
      if (b.status !== 'ACTIVE') return false;
      const bFromIdx = sortedStops.findIndex(s => s.id === b.fromStopId);
      const bToIdx = sortedStops.findIndex(s => s.id === b.toStopId);
      return bFromIdx <= i && bToIdx >= i + 1;
    });

    const bookedSeats = overlappingBookings.reduce((sum, b) => sum + b.seatsCount, 0);
    const availableSeats = Math.max(0, totalVehicleSeats - bookedSeats);
    const passengerNames = overlappingBookings.map(b => `${b.passengerName} (${b.seatsCount} seat${b.seatsCount > 1 ? 's' : ''})`);

    segments.push({
      fromStopId: fromStop.id,
      toStopId: toStop.id,
      fromStopName: fromStop.name,
      toStopName: toStop.name,
      totalSeats: totalVehicleSeats,
      bookedSeats,
      availableSeats,
      passengerNames
    });
  }

  return segments;
}

/**
 * Checks if a requested seat booking is valid for all segments between start and end stop
 */
export function canBookSeatsForSubTrip(
  fromStopId: string,
  toStopId: string,
  requestedSeats: number,
  stops: CarpoolRouteStop[],
  segments: SegmentSeatOccupancy[]
): {
  canBook: boolean;
  minAvailableSeatsAcrossTrip: number;
  bottleneckSegment?: SegmentSeatOccupancy;
} {
  const sortedStops = [...stops].sort((a, b) => a.order - b.order);
  const fromIdx = sortedStops.findIndex(s => s.id === fromStopId);
  const toIdx = sortedStops.findIndex(s => s.id === toStopId);

  if (fromIdx === -1 || toIdx === -1 || fromIdx >= toIdx) {
    return { canBook: false, minAvailableSeatsAcrossTrip: 0 };
  }

  // Check segments between fromIdx and toIdx
  let minAvail = Infinity;
  let bottleneck: SegmentSeatOccupancy | undefined;

  for (let i = fromIdx; i < toIdx; i++) {
    const seg = segments[i];
    if (seg.availableSeats < minAvail) {
      minAvail = seg.availableSeats;
      bottleneck = seg;
    }
  }

  return {
    canBook: minAvail >= requestedSeats,
    minAvailableSeatsAcrossTrip: minAvail === Infinity ? 0 : minAvail,
    bottleneckSegment: bottleneck
  };
}

/**
 * 5. SMART ROUTE MATCHING & FLEXIBLE PICKUP / DROP ENGINE
 * 
 * Compares passenger pickup & destination against driver's corridor stops and polyline:
 * - Direct route match: Driver's route reaches your destination.
 * - Connected route match: Driver passes through a suitable point near your destination.
 * - Partial journey: Travel part of the way and select an intermediate drop-off.
 */
export type RouteMatchType = 'DIRECT' | 'CONNECTED' | 'PARTIAL' | 'NO_MATCH';

export interface VerifiedTransferConnection {
  transferHubId: string;
  transferHubName: string;
  destinationMatch: string;
  transitMode: 'METRO' | 'AIRPORT_EXPRESS' | 'ORR_SHUTTLE' | 'INTERCITY_BUS';
  connectionName: string;
  transferDurationMin: number;
  totalTripEstimatedMin: number;
  instructions: string;
}

export interface CarpoolRouteStop {
  id: string;
  name: string;
  order: number;
  location: { x: number; y: number };
  eta: string;
  isLegallyApprovedStop?: boolean;
  legalStopType?: string; // 'Designated Bus Bay' | 'Metro Kiss-and-Ride' | 'Highway Toll Transit Stop' | 'Airport Commercial Drop'
  legalStopNotes?: string;
}

// Master registry of verified transfer points and their transit connections
export const VERIFIED_TRANSFER_HUBS: Record<string, VerifiedTransferConnection[]> = {
  'Uppal Metro Hub': [
    {
      transferHubId: 'hub-uppal-mindspace',
      transferHubName: 'Uppal Metro Hub',
      destinationMatch: 'mindspace',
      transitMode: 'METRO',
      connectionName: 'Hyderabad Metro (Blue Line)',
      transferDurationMin: 24,
      totalTripEstimatedMin: 90,
      instructions: 'Step off at Uppal Metro dedicated Kiss-and-Ride bay. Board Hyderabad Metro Blue Line directly to Mindspace / Raidurg (trains every 4 mins).'
    },
    {
      transferHubId: 'hub-uppal-hitec',
      transferHubName: 'Uppal Metro Hub',
      destinationMatch: 'hitec',
      transitMode: 'METRO',
      connectionName: 'Hyderabad Metro (Blue Line)',
      transferDurationMin: 22,
      totalTripEstimatedMin: 88,
      instructions: 'Transfer to Blue Line Metro towards Hitec City. Fast direct elevated rail avoiding city traffic.'
    },
    {
      transferHubId: 'hub-uppal-airport',
      transferHubName: 'Uppal Metro Hub',
      destinationMatch: 'airport',
      transitMode: 'AIRPORT_EXPRESS',
      connectionName: 'Pushpak Airport Liner (AC-12)',
      transferDurationMin: 45,
      totalTripEstimatedMin: 110,
      instructions: 'Transfer at Uppal Ring Road Pushpak AC Express Coach directly to RGIA Airport Terminal via Outer Ring Road.'
    },
    {
      transferHubId: 'hub-uppal-secunderabad',
      transferHubName: 'Uppal Metro Hub',
      destinationMatch: 'secunderabad',
      transitMode: 'METRO',
      connectionName: 'Hyderabad Metro Line 3 / City Bus 18',
      transferDurationMin: 15,
      totalTripEstimatedMin: 80,
      instructions: 'Transfer at Uppal Metro cross-terminal to Secunderabad Rail Terminal.'
    }
  ],
  'Secunderabad Stn': [
    {
      transferHubId: 'hub-secunderabad-airport',
      transferHubName: 'Secunderabad Stn',
      destinationMatch: 'airport',
      transitMode: 'AIRPORT_EXPRESS',
      connectionName: 'Pushpak AC Airport Express (Direct)',
      transferDurationMin: 38,
      totalTripEstimatedMin: 78,
      instructions: 'Alight at Secunderabad Railway West Gate. Board direct Pushpak AC Express every 15 mins to RGIA Airport Departures.'
    },
    {
      transferHubId: 'hub-secunderabad-mindspace',
      transferHubName: 'Secunderabad Stn',
      destinationMatch: 'mindspace',
      transitMode: 'METRO',
      connectionName: 'Parade Grounds Interchange to Blue Line',
      transferDurationMin: 20,
      totalTripEstimatedMin: 65,
      instructions: 'Step into Parade Grounds Metro interchange, board Blue Line direct to Mindspace IT Park.'
    }
  ],
  'Ghatkesar ORR Junction': [
    {
      transferHubId: 'hub-ghatkesar-airport',
      transferHubName: 'Ghatkesar ORR Junction',
      destinationMatch: 'airport',
      transitMode: 'ORR_SHUTTLE',
      connectionName: 'Nehru ORR Expressway Feeder',
      transferDurationMin: 32,
      totalTripEstimatedMin: 85,
      instructions: 'Alight at Ghatkesar Toll Plaza designated carpool bay. Take ORR Express Shuttle directly down expressway south to RGIA.'
    },
    {
      transferHubId: 'hub-ghatkesar-hyderabad',
      transferHubName: 'Ghatkesar ORR Junction',
      destinationMatch: 'hyderabad',
      transitMode: 'METRO',
      connectionName: 'Uppal Expressway Link & Metro',
      transferDurationMin: 22,
      totalTripEstimatedMin: 75,
      instructions: 'Take 12-min connecting electric shuttle to Uppal Metro Station into Hyderabad Core.'
    }
  ]
};

export interface RouteMatchAnalysis {
  matchType: RouteMatchType;
  matchTitle: string;
  matchDescription: string;
  matchBadgeColor: {
    bg: string;
    text: string;
    border: string;
  };
  compatibilityScore: number; // 0 to 100%
  pickupStop: CarpoolRouteStop;
  pickupDistanceKm: number;
  dropoffStop: CarpoolRouteStop;
  dropoffDistanceKm: number;
  isPartialRoute: boolean;
  recommendedIntermediateDropoff?: CarpoolRouteStop;
  availableIntermediateDropoffs: CarpoolRouteStop[];
  estimatedArrivalMin: number;
  calculatedFare: number;
  remainingSeats: number;
  routeHighlights: string;
  verifiedTransfer?: VerifiedTransferConnection;
  isLegallyVerifiedStop: boolean;
  legalStopBadgeText: string;
  unmatchedReason?: string;
}

/**
 * Evaluates whether a destination address or junction connects via a verified transfer hub
 */
export function findTransferConnection(
  driverStops: CarpoolRouteStop[],
  destinationAddress: string
): { transferStop: CarpoolRouteStop; connection: VerifiedTransferConnection } | null {
  const destLower = destinationAddress.toLowerCase();
  
  for (const stop of driverStops) {
    const stopLower = stop.name.toLowerCase();
    let hubConnections: VerifiedTransferConnection[] | undefined = VERIFIED_TRANSFER_HUBS[stop.name];

    if (!hubConnections) {
      for (const [hubKey, conns] of Object.entries(VERIFIED_TRANSFER_HUBS)) {
        const hubKeyLower = hubKey.toLowerCase();
        if (
          stopLower.includes(hubKeyLower) || 
          hubKeyLower.includes(stopLower) ||
          (stopLower.includes('uppal') && hubKeyLower.includes('uppal')) ||
          (stopLower.includes('ghatkesar') && hubKeyLower.includes('ghatkesar')) ||
          (stopLower.includes('secunderabad') && hubKeyLower.includes('secunderabad'))
        ) {
          hubConnections = conns;
          break;
        }
      }
    }

    if (hubConnections) {
      for (const conn of hubConnections) {
        if (destLower.includes(conn.destinationMatch)) {
          return { transferStop: stop, connection: conn };
        }
      }
    }
  }

  return null;
}

export function matchDriverRouteToPassenger(
  driver: {
    id: string;
    driverName: string;
    from: string;
    to: string;
    basePricePerSeat: number;
    totalSeats: number;
    corridorStops: CarpoolRouteStop[];
    routePolyline: RoutePoint[];
  },
  passengerPickupPos: { x: number; y: number },
  passengerDestPos?: { x: number; y: number } | null,
  passengerDestAddress?: string,
  bookings: CarpoolSegmentBooking[] = []
): RouteMatchAnalysis {
  const sortedStops = [...driver.corridorStops].sort((a, b) => a.order - b.order);

  // 1. Calculate road geometry distance from passenger pickup to driver route
  let bestPickupStop = sortedStops[0];
  let minPickupDistCanvas = Infinity;

  sortedStops.forEach(stop => {
    const d = Math.hypot(stop.location.x - passengerPickupPos.x, stop.location.y - passengerPickupPos.y);
    if (d < minPickupDistCanvas) {
      minPickupDistCanvas = d;
      bestPickupStop = stop;
    }
  });

  const pickupDistanceKm = +(minPickupDistCanvas * 0.22).toFixed(1);

  // Candidate drop-off stops strictly after pickup stop
  const candidateDropStops = sortedStops.filter(s => s.order > bestPickupStop.order);
  const validStops = candidateDropStops.length > 0 ? candidateDropStops : [sortedStops[sortedStops.length - 1]];

  let bestDropoffStop = validStops[validStops.length - 1];
  let minDropDistCanvas = Infinity;

  if (passengerDestPos) {
    validStops.forEach(stop => {
      const d = Math.hypot(stop.location.x - passengerDestPos.x, stop.location.y - passengerDestPos.y);
      if (d < minDropDistCanvas) {
        minDropDistCanvas = d;
        bestDropoffStop = stop;
      }
    });
  } else {
    minDropDistCanvas = 0;
  }

  const dropoffDistanceKm = +(minDropDistCanvas * 0.22).toFixed(1);

  // Check road-route geometry distance from destination to driver's route polyline
  let destDistanceToPolylineMeters = 99999;
  if (passengerDestPos && driver.routePolyline.length > 1) {
    const polylineCheck = calculatePassengerOnRoute(passengerDestPos, driver.routePolyline, 3000);
    destDistanceToPolylineMeters = polylineCheck.distanceFromHighwayMeters;
  }

  // 2. Verified Transfer Point Lookup
  const destAddressClean = passengerDestAddress || '';
  const transferInfo = findTransferConnection(validStops, destAddressClean);

  // 3. Precise destination name match
  const destText = destAddressClean.toLowerCase().trim();
  const driverToText = driver.to.toLowerCase();
  const dropStopText = bestDropoffStop.name.toLowerCase();

  // Strict Direct Match Rules:
  // Must be an actual route point or approved stop within <= 1.5 km (or 1500m to road polyline).
  // "Do not mark a destination as direct merely because it is in the same city."
  const isDirectStopNameMatch = Boolean(
    destText &&
    (dropStopText.includes(destText) ||
     (driverToText.includes(destText) && dropoffDistanceKm <= 2.2))
  );

  const isGeometricallyAtDestination = dropoffDistanceKm <= 1.5 || destDistanceToPolylineMeters <= 1500;
  const isDirectMatch = Boolean(passengerDestPos && (isDirectStopNameMatch || isGeometricallyAtDestination));

  // Determine Directional / Coverage Validity
  // If pickup is too far away (> 7.5 km) with no corridor overlap, or driver has passed, mark as NO_MATCH
  const isPickupTooFar = pickupDistanceKm > 7.5;

  let matchType: RouteMatchType = 'DIRECT';
  let matchTitle = "Direct route match";
  let matchDescription = "Driver's route reaches your destination.";
  let isPartialRoute = false;
  let unmatchedReason: string | undefined;

  if (!passengerDestPos) {
    matchType = 'DIRECT';
    matchTitle = 'Direct corridor ride';
    matchDescription = "Departs near your pickup with stops along the highway.";
  } else if (isPickupTooFar) {
    matchType = 'NO_MATCH';
    matchTitle = 'No match';
    matchDescription = `Driver departs outside your pickup corridor (${pickupDistanceKm} km away).`;
    unmatchedReason = `Pickup distance (${pickupDistanceKm} km) exceeds local corridor threshold.`;
  } else if (isDirectMatch) {
    matchType = 'DIRECT';
    matchTitle = 'Direct route match';
    matchDescription = "Driver's route reaches your destination or designated drop-off point.";
  } else if (transferInfo) {
    matchType = 'CONNECTED';
    matchTitle = 'Connected route match';
    matchDescription = `Driver reaches ${transferInfo.transferStop.name} verified transfer point for ${transferInfo.connection.connectionName}.`;
    bestDropoffStop = transferInfo.transferStop;
  } else {
    // Check if the driver covers part of the passenger's journey towards destination
    // Vector check: Is dropoff stop closer to passenger destination than pickup stop?
    const pickupToDestDist = passengerDestPos 
      ? Math.hypot(passengerDestPos.x - passengerPickupPos.x, passengerDestPos.y - passengerPickupPos.y)
      : 0;
    const dropToDestDist = passengerDestPos
      ? Math.hypot(passengerDestPos.x - bestDropoffStop.location.x, passengerDestPos.y - bestDropoffStop.location.y)
      : 0;
    
    const isProgressingTowardsDestination = dropToDestDist < pickupToDestDist * 0.92;

    if (isProgressingTowardsDestination && validStops.length > 0) {
      matchType = 'PARTIAL';
      matchTitle = 'Partial journey';
      matchDescription = `Driver covers journey to ${bestDropoffStop.name}. Select an intermediate drop-off.`;
      isPartialRoute = true;
    } else {
      matchType = 'NO_MATCH';
      matchTitle = 'No route match';
      matchDescription = 'Driver route does not connect or progress towards requested destination.';
      unmatchedReason = 'Vehicle corridor does not intersect passenger destination or verified transfer hubs.';
    }
  }

  // 4. Calculate dynamic fare for selected segments
  const totalCorridorSegments = Math.max(1, sortedStops.length - 1);
  const journeySegments = Math.max(1, bestDropoffStop.order - bestPickupStop.order);
  const segmentRatio = journeySegments / totalCorridorSegments;
  const calculatedFare = matchType === 'NO_MATCH' 
    ? driver.basePricePerSeat 
    : Math.round(Math.max(50, driver.basePricePerSeat * Math.min(1, 0.45 + segmentRatio * 0.55)));

  // 5. Seat capacities along selected sub-trip
  const segOccupancy = calculateSegmentSeatCapacities(sortedStops, driver.totalSeats, bookings);
  const eligibility = canBookSeatsForSubTrip(bestPickupStop.id, bestDropoffStop.id, 1, sortedStops, segOccupancy);
  const remainingSeats = eligibility.minAvailableSeatsAcrossTrip;

  // 6. Compatibility Score computation
  let baseScore = 0;
  if (matchType === 'DIRECT') baseScore = 96;
  else if (matchType === 'CONNECTED') baseScore = 86;
  else if (matchType === 'PARTIAL') baseScore = 72;
  else baseScore = 20;

  const pickupPenalty = Math.min(25, pickupDistanceKm * 3.2);
  const dropPenalty = matchType === 'DIRECT' ? 0 : Math.min(22, dropoffDistanceKm * 1.5);
  const seatBonus = remainingSeats > 0 ? 5 : -30;

  const compatibilityScore = matchType === 'NO_MATCH' 
    ? Math.max(5, Math.min(30, Math.round(baseScore - pickupPenalty)))
    : Math.max(45, Math.min(99, Math.round(baseScore - pickupPenalty - dropPenalty + seatBonus)));

  // ETA in minutes
  const estimatedArrivalMin = Math.round(10 + journeySegments * 18);

  const matchBadgeColor = matchType === 'DIRECT' 
    ? { bg: 'bg-emerald-50 text-emerald-800 border-emerald-300', text: 'text-emerald-700', border: 'border-emerald-400' }
    : matchType === 'CONNECTED'
    ? { bg: 'bg-blue-50 text-blue-800 border-blue-300', text: 'text-blue-700', border: 'border-blue-400' }
    : matchType === 'PARTIAL'
    ? { bg: 'bg-amber-50 text-amber-800 border-amber-300', text: 'text-amber-700', border: 'border-amber-400' }
    : { bg: 'bg-rose-50 text-rose-800 border-rose-300', text: 'text-rose-700', border: 'border-rose-400' };

  // Legal verification details
  const isLegallyVerifiedStop = bestDropoffStop.isLegallyApprovedStop !== false;
  const legalStopBadgeText = bestDropoffStop.legalStopType 
    ? `Authorized Stop: ${bestDropoffStop.legalStopType}`
    : 'Authorized Passenger Pickup/Drop Bay';

  return {
    matchType,
    matchTitle,
    matchDescription,
    matchBadgeColor,
    compatibilityScore,
    pickupStop: bestPickupStop,
    pickupDistanceKm,
    dropoffStop: bestDropoffStop,
    dropoffDistanceKm,
    isPartialRoute,
    recommendedIntermediateDropoff: isPartialRoute ? bestDropoffStop : undefined,
    availableIntermediateDropoffs: validStops,
    estimatedArrivalMin,
    calculatedFare,
    remainingSeats,
    routeHighlights: `${bestPickupStop.name.split(' ')[0]} → ${bestDropoffStop.name.split(' ')[0]}`,
    verifiedTransfer: transferInfo?.connection,
    isLegallyVerifiedStop,
    legalStopBadgeText,
    unmatchedReason
  };
}
