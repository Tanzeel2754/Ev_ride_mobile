import type { LatLng } from '../types/api';

const OSRM_BASE = 'https://router.project-osrm.org';
const USER_AGENT = 'EVRide/1.0 (evride-mobile; routing)';

type OsrmRouteResponse = {
  code?: string;
  routes?: Array<{
    geometry?: {
      coordinates?: [number, number][];
    };
  }>;
};

function roundCoord(value: number) {
  return Math.round(value * 1e5) / 1e5;
}

function samePoint(a: LatLng, b: LatLng) {
  return (
    Math.abs(a.latitude - b.latitude) < 0.00005 &&
    Math.abs(a.longitude - b.longitude) < 0.00005
  );
}

/**
 * Driving route along roads via public OSRM (OpenStreetMap).
 * Returns many lat/lng points; falls back to [] on failure.
 */
export async function fetchDrivingRoute(
  from: LatLng,
  to: LatLng,
): Promise<LatLng[]> {
  if (samePoint(from, to)) return [from, to];

  const coords = `${roundCoord(from.longitude)},${roundCoord(from.latitude)};${roundCoord(to.longitude)},${roundCoord(to.latitude)}`;
  const url = `${OSRM_BASE}/route/v1/driving/${coords}?overview=full&geometries=geojson`;

  const res = await fetch(url, {
    headers: {
      Accept: 'application/json',
      'User-Agent': USER_AGENT,
    },
  });
  if (!res.ok) return [];

  const data = (await res.json()) as OsrmRouteResponse;
  if (data.code !== 'Ok' || !data.routes?.[0]?.geometry?.coordinates?.length) {
    return [];
  }

  return data.routes[0].geometry.coordinates
    .map(([longitude, latitude]) => ({ latitude, longitude }))
    .filter(
      (p) => Number.isFinite(p.latitude) && Number.isFinite(p.longitude),
    );
}

/** Stable key so tiny GPS jitter does not re-fetch the same road path. */
export function routeKey(from: LatLng | null | undefined, to: LatLng | null | undefined) {
  if (!from || !to) return '';
  return `${roundCoord(from.latitude)},${roundCoord(from.longitude)}->${roundCoord(to.latitude)},${roundCoord(to.longitude)}`;
}
