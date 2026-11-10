import * as Location from 'expo-location';
import { useCallback, useEffect, useState } from 'react';
import type { LatLng } from '../types/api';

export type CurrentLocationState = {
  coords: LatLng | null;
  address: string | null;
  loading: boolean;
  error: string | null;
  permissionDenied: boolean;
};

function formatAddress(parts: Location.LocationGeocodedAddress) {
  const bits = [
    parts.name,
    parts.street,
    parts.city || parts.subregion,
    parts.region,
  ].filter(Boolean);
  // Prefer a short readable line
  if (parts.name && parts.city) return `${parts.name}, ${parts.city}`;
  if (parts.street && parts.city) return `${parts.street}, ${parts.city}`;
  return bits.slice(0, 3).join(', ') || null;
}

export async function requestAndGetCurrentPosition(): Promise<{
  coords: LatLng;
  address: string | null;
}> {
  const { status } = await Location.requestForegroundPermissionsAsync();
  if (status !== 'granted') {
    throw Object.assign(new Error('Location permission denied'), {
      permissionDenied: true,
    });
  }

  const pos = await Location.getCurrentPositionAsync({
    accuracy: Location.Accuracy.Balanced,
  });
  const coords: LatLng = {
    latitude: pos.coords.latitude,
    longitude: pos.coords.longitude,
  };

  let address: string | null = null;
  try {
    const places = await Location.reverseGeocodeAsync(coords);
    if (places[0]) address = formatAddress(places[0]);
  } catch {
    // reverse geocode is best-effort
  }

  return { coords, address };
}

export async function geocodeAddress(query: string): Promise<LatLng | null> {
  const trimmed = query.trim();
  if (!trimmed) return null;
  try {
    const results = await Location.geocodeAsync(trimmed);
    const first = results[0];
    if (!first) return null;
    return { latitude: first.latitude, longitude: first.longitude };
  } catch {
    return null;
  }
}

/** Watch / refresh the device GPS for home & booking maps. */
export function useCurrentLocation(enabled = true) {
  const [state, setState] = useState<CurrentLocationState>({
    coords: null,
    address: null,
    loading: enabled,
    error: null,
    permissionDenied: false,
  });

  const refresh = useCallback(async () => {
    if (!enabled) return null;
    setState((s) => ({ ...s, loading: true, error: null }));
    try {
      const { coords, address } = await requestAndGetCurrentPosition();
      setState({
        coords,
        address,
        loading: false,
        error: null,
        permissionDenied: false,
      });
      return { coords, address };
    } catch (e) {
      const permissionDenied = !!(e as { permissionDenied?: boolean })
        ?.permissionDenied;
      setState({
        coords: null,
        address: null,
        loading: false,
        error: e instanceof Error ? e.message : 'Could not get location',
        permissionDenied,
      });
      return null;
    }
  }, [enabled]);

  useEffect(() => {
    if (!enabled) {
      setState((s) => ({ ...s, loading: false }));
      return;
    }
    void refresh();
  }, [enabled, refresh]);

  return { ...state, refresh };
}
