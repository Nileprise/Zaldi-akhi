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
