import type { LatLng } from '../types/api';

export type PlaceSuggestion = {
  id: string;
  label: string;
  secondary?: string | null;
  latitude: number;
  longitude: number;
};

const USER_AGENT = 'EVRide/1.0 (evride-mobile; place-search)';

type PhotonFeature = {
  geometry?: { coordinates?: [number, number] };
  properties?: {
    osm_id?: number | string;
    name?: string;
    street?: string;
    housenumber?: string;
    district?: string;
    city?: string;
    locality?: string;
    town?: string;
    county?: string;
    state?: string;
    country?: string;
    postcode?: string;
    type?: string;
  };
};

function formatPhotonLabel(props: NonNullable<PhotonFeature['properties']>) {
  const primary =
    [props.name, props.housenumber ? `${props.street || ''} ${props.housenumber}`.trim() : props.street]
      .filter(Boolean)[0] || props.city || props.town || props.locality || 'Place';

  const secondary = [
    props.district,
    props.city || props.town || props.locality,
    props.state,
    props.country,
  ]
    .filter(Boolean)
    .filter((part, index, arr) => arr.indexOf(part) === index)
    .join(', ');

  return {
    label: primary,
    secondary: secondary && secondary !== primary ? secondary : null,
  };
}

async function searchPhoton(
  query: string,
  near: LatLng | null | undefined,
  limit: number,
): Promise<PlaceSuggestion[]> {
  const params = new URLSearchParams({
    q: query,
    limit: String(limit),
    lang: 'en',
  });
  if (near) {
    params.set('lat', String(near.latitude));
    params.set('lon', String(near.longitude));
  }

  const res = await fetch(`https://photon.komoot.io/api/?${params.toString()}`, {
    headers: { Accept: 'application/json', 'User-Agent': USER_AGENT },
  });
  if (!res.ok) return [];

  const data = (await res.json()) as { features?: PhotonFeature[] };
  const features = Array.isArray(data.features) ? data.features : [];

  return features.flatMap((feature, index) => {
    const coords = feature.geometry?.coordinates;
    const props = feature.properties;
    if (!coords || coords.length < 2 || !props) return [];
    const [longitude, latitude] = coords;
    if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return [];
    const { label, secondary } = formatPhotonLabel(props);
    return [
      {
        id: `photon-${props.osm_id ?? index}-${latitude}-${longitude}`,
        label,
        secondary,
        latitude,
        longitude,
      },
    ];
  });
}

type NominatimResult = {
  place_id?: number;
  lat?: string;
  lon?: string;
  display_name?: string;
  name?: string;
  address?: {
    suburb?: string;
    neighbourhood?: string;
    city?: string;
    town?: string;
    village?: string;
    county?: string;
    state?: string;
    country?: string;
  };
};

async function searchNominatim(
  query: string,
  near: LatLng | null | undefined,
  limit: number,
): Promise<PlaceSuggestion[]> {
  const params = new URLSearchParams({
    q: query,
    format: 'json',
    addressdetails: '1',
    limit: String(limit),
  });

  // Bias to ~40km box around the user (helps city-local results like Rawalpindi).
  if (near) {
    const dLat = 0.35;
    const dLng = 0.35;
    const minLon = near.longitude - dLng;
    const maxLat = near.latitude + dLat;
    const maxLon = near.longitude + dLng;
    const minLat = near.latitude - dLat;
    params.set('viewbox', `${minLon},${maxLat},${maxLon},${minLat}`);
    params.set('bounded', '0');
  }

  const res = await fetch(
    `https://nominatim.openstreetmap.org/search?${params.toString()}`,
    {
      headers: {
        Accept: 'application/json',
        'User-Agent': USER_AGENT,
      },
    },
  );
  if (!res.ok) return [];

  const data = (await res.json()) as NominatimResult[];
  if (!Array.isArray(data)) return [];

  return data.flatMap((row, index) => {
    const latitude = Number(row.lat);
    const longitude = Number(row.lon);
    if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return [];
    const label = row.name || row.display_name?.split(',')[0]?.trim() || 'Place';
    const secondary =
      row.display_name && row.display_name !== label ? row.display_name : null;
    return [
      {
        id: `nominatim-${row.place_id ?? index}-${latitude}-${longitude}`,
        label,
        secondary,
        latitude,
        longitude,
      },
    ];
  });
}

/**
 * Autocomplete places near the user (city-biased).
 * Uses Photon first, then Nominatim as fallback.
 */
export async function searchPlacesNearby(
  query: string,
  near?: LatLng | null,
  limit = 6,
): Promise<PlaceSuggestion[]> {
  const trimmed = query.trim();
  if (trimmed.length < 2) return [];

  try {
    const photon = await searchPhoton(trimmed, near, limit);
    if (photon.length) return photon;
  } catch {
    // fall through
  }

  try {
    return await searchNominatim(trimmed, near, limit);
  } catch {
    return [];
  }
}

/** Resolve a typed address to coordinates, preferring nearby matches. */
export async function resolvePlaceNear(
  query: string,
  near?: LatLng | null,
): Promise<PlaceSuggestion | null> {
  const results = await searchPlacesNearby(query, near, 1);
  return results[0] ?? null;
}
