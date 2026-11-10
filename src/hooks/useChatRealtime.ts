import { useCallback, useEffect, useRef, useState } from 'react';
import type { GetRideMessagesResponse } from '../types/api';
import { startChatRealtime } from '../realtime/chatHub';

type Options = {
  rideId?: string | null;
  enabled?: boolean;
};

/** Trip chat messages from `/hubs/chat`. */
export function useChatRealtime({ rideId, enabled = true }: Options) {
  const [connected, setConnected] = useState(false);
  const [incomingMessage, setIncomingMessage] =
    useState<GetRideMessagesResponse | null>(null);

  const clearIncoming = useCallback(() => setIncomingMessage(null), []);

  useEffect(() => {
    if (!enabled || !rideId) {
      setConnected(false);
      return;
    }

    let cleanup: (() => Promise<void>) | undefined;
    let cancelled = false;

    (async () => {
      cleanup = await startChatRealtime(rideId, {
        onConnectionChange: (isConnected) => {
          if (!cancelled) setConnected(isConnected);
        },
        onChatMessage: (message) => {
          if (!cancelled) setIncomingMessage(message);
        },
      });
    })();

    return () => {
      cancelled = true;
      void cleanup?.();
    };
  }, [enabled, rideId]);

  return {
    connected,
    incomingMessage,
    clearIncoming,
  };
}
