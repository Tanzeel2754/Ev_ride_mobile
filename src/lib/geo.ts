import type { LatLng } from '../types/api';

const EARTH_RADIUS_KM = 6371;

function toRad(degrees: number) {
  return (degrees * Math.PI) / 180;
}

/** Great-circle distance in km between two lat/lng points. */
export function haversineDistanceKm(from: LatLng, to: LatLng): number {
  const dLat = toRad(to.latitude - from.latitude);
  const dLng = toRad(to.longitude - from.longitude);
  const lat1 = toRad(from.latitude);
  const lat2 = toRad(to.latitude);

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return EARTH_RADIUS_KM * c;
}
