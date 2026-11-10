import { useEffect, useRef, useState } from 'react';
import { startRideHub } from '../realtime/rideHub';

type Options = {
  enabled?: boolean;
  onNewRideAvailable?: (rideId: string) => void;
  onRideUnavailable?: (rideId: string) => void;
};

/**
 * Driver offer broadcasts on `/hubs/rides` (no JoinRide).
 * Pair with a lighter REST poll as fallback.
 */
export function useDriverRideOffers({
  enabled = true,
  onNewRideAvailable,
  onRideUnavailable,
}: Options) {
  const [connected, setConnected] = useState(false);
  const onNewRef = useRef(onNewRideAvailable);
  onNewRef.current = onNewRideAvailable;
  const onUnavailableRef = useRef(onRideUnavailable);
  onUnavailableRef.current = onRideUnavailable;

  useEffect(() => {
    if (!enabled) {
      setConnected(false);
      return;
    }

    let cleanup: (() => Promise<void>) | undefined;
    let cancelled = false;

    (async () => {
      cleanup = await startRideHub({
        onConnectionChange: (isConnected) => {
          if (!cancelled) setConnected(isConnected);
        },
        onNewRideAvailable: (rideId) => onNewRef.current?.(rideId),
        onRideUnavailable: (rideId) => onUnavailableRef.current?.(rideId),
      });
    })();

    return () => {
      cancelled = true;
      void cleanup?.();
    };
  }, [enabled]);

  return { connected };
}
