import * as Location from 'expo-location';
import { useEffect, useRef, useState } from 'react';
import { updateDriverLocation } from '../api/rides';
import type { LatLng } from '../types/api';

type Options = {
  enabled: boolean;
  intervalMs?: number;
  onLocation?: (coords: LatLng) => void;
};

/**
 * While a driver has an active accepted trip, keep pushing GPS to PUT /api/rides/location
 * so passengers can track movement (via SignalR and/or ride refresh).
 */
export function useDriverLocationPublisher({
  enabled,
  intervalMs = 8000,
  onLocation,
}: Options) {
  const [lastLocation, setLastLocation] = useState<LatLng | null>(null);
  const [error, setError] = useState<string | null>(null);
  const onLocationRef = useRef(onLocation);
  onLocationRef.current = onLocation;

  useEffect(() => {
    if (!enabled) return;

    let cancelled = false;
    let timer: ReturnType<typeof setInterval> | null = null;
    let subscription: Location.LocationSubscription | null = null;

    async function push(coords: LatLng) {
      if (cancelled) return;
      setLastLocation(coords);
      onLocationRef.current?.(coords);
      try {
        await updateDriverLocation(coords);
        setError(null);
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Location update failed');
      }
    }

    async function start() {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          setError('Location permission is required for live tracking.');
          return;
        }

        const current = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });
        await push({
          latitude: current.coords.latitude,
          longitude: current.coords.longitude,
        });

        subscription = await Location.watchPositionAsync(
          {
            accuracy: Location.Accuracy.Balanced,
            timeInterval: intervalMs,
            distanceInterval: 20,
          },
          (pos) => {
            void push({
              latitude: pos.coords.latitude,
              longitude: pos.coords.longitude,
            });
          },
        );

        // Fallback interval in case watch is throttled
        timer = setInterval(async () => {
          try {
            const pos = await Location.getCurrentPositionAsync({
              accuracy: Location.Accuracy.Balanced,
            });
            await push({
              latitude: pos.coords.latitude,
              longitude: pos.coords.longitude,
            });
          } catch {
            // ignore transient GPS failures
          }
        }, Math.max(intervalMs, 10000));
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : 'Could not start location');
        }
      }
    }

    void start();

    return () => {
      cancelled = true;
      if (timer) clearInterval(timer);
      subscription?.remove();
    };
  }, [enabled, intervalMs]);

  return { lastLocation, error };
}
