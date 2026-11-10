import { useEffect, useRef, useState } from 'react';
import type { LatLng } from '../types/api';
import { startRideHub } from '../realtime/rideHub';

type Options = {
  rideId?: string | null;
  enabled?: boolean;
  onRideUpdated?: () => void;
  onRideAccepted?: (rideId?: string | null) => void;
  onRideCancelled?: (rideId?: string | null) => void;
};

/** Active-ride realtime from `/hubs/rides` (JoinRide when rideId is set). */
export function useRideRealtime({
  rideId,
  enabled = true,
  onRideUpdated,
  onRideAccepted,
  onRideCancelled,
}: Options) {
  const [connected, setConnected] = useState(false);
  const [driverLocation, setDriverLocation] = useState<LatLng | null>(null);
  const [liveStatusId, setLiveStatusId] = useState<number | null>(null);

  const onRideUpdatedRef = useRef(onRideUpdated);
  onRideUpdatedRef.current = onRideUpdated;
  const onRideAcceptedRef = useRef(onRideAccepted);
  onRideAcceptedRef.current = onRideAccepted;
  const onRideCancelledRef = useRef(onRideCancelled);
  onRideCancelledRef.current = onRideCancelled;

  useEffect(() => {
    if (!enabled || !rideId) {
      setConnected(false);
      return;
    }

    let cleanup: (() => Promise<void>) | undefined;
    let cancelled = false;

    (async () => {
      cleanup = await startRideHub(
        {
          onConnectionChange: (isConnected) => {
            if (!cancelled) setConnected(isConnected);
          },
          onDriverLocationUpdated: (location) => {
            if (!cancelled) setDriverLocation(location);
          },
          onRideStatusChanged: (statusId) => {
            if (!cancelled) setLiveStatusId(statusId);
            onRideUpdatedRef.current?.();
          },
          onRideAccepted: (id) => {
            onRideAcceptedRef.current?.(id);
            onRideUpdatedRef.current?.();
          },
          onRideCancelled: (id) => {
            onRideCancelledRef.current?.(id);
            onRideUpdatedRef.current?.();
          },
          onRideUpdated: () => onRideUpdatedRef.current?.(),
        },
        { rideId },
      );
    })();

    return () => {
      cancelled = true;
      void cleanup?.();
    };
  }, [enabled, rideId]);

  return {
    connected,
    driverLocation,
    setDriverLocation,
    liveStatusId,
  };
}
