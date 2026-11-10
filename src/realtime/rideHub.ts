import {
  HubConnection,
  HubConnectionBuilder,
  HubConnectionState,
  LogLevel,
} from '@microsoft/signalr';
import { getCurrentRide } from '../api/rides';
import { getAccessToken } from '../lib/auth-storage';
import { SIGNALR_RIDES_HUB_URL } from '../lib/config';
import type { LatLng } from '../types/api';
import {
  extractRideId,
  normalizeLatLng,
  normalizeRideStatus,
} from './normalize';

export type RideHubHandlers = {
  onNewRideAvailable?: (rideId: string) => void;
  onRideUnavailable?: (rideId: string) => void;
  onRideAccepted?: (rideId?: string | null) => void;
  onRideStatusChanged?: (rideStatusId: number, rideId?: string | null) => void;
  onDriverLocationUpdated?: (location: LatLng, rideId?: string | null) => void;
  onRideCancelled?: (rideId?: string | null) => void;
  onRideUpdated?: () => void;
  onConnectionChange?: (connected: boolean) => void;
};

async function safeInvoke(
  connection: HubConnection,
  method: string,
  ...args: unknown[]
) {
  try {
    await connection.invoke(method, ...args);
    return true;
  } catch {
    return false;
  }
}

export async function createRideHubConnection(): Promise<HubConnection> {
  return new HubConnectionBuilder()
    .withUrl(SIGNALR_RIDES_HUB_URL, {
      accessTokenFactory: async () => (await getAccessToken()) || '',
    })
    .withAutomaticReconnect([0, 2000, 5000, 10000, 30000])
    .configureLogging(__DEV__ ? LogLevel.Information : LogLevel.Warning)
    .build();
}

async function joinRide(connection: HubConnection, rideId: string) {
  if (connection.state !== HubConnectionState.Connected) return;
  await safeInvoke(connection, 'JoinRide', rideId);
}

async function leaveRide(connection: HubConnection, rideId: string) {
  if (connection.state !== HubConnectionState.Connected) return;
  await safeInvoke(connection, 'LeaveRide', rideId);
}

function bindRideEvents(connection: HubConnection, handlers: RideHubHandlers) {
  connection.on('NewRideAvailable', (...args: unknown[]) => {
    const rideId = extractRideId(args[0]) ?? (typeof args[0] === 'string' ? args[0] : null);
    if (rideId) handlers.onNewRideAvailable?.(rideId);
    else handlers.onRideUpdated?.();
  });

  connection.on('RideUnavailable', (...args: unknown[]) => {
    const rideId = extractRideId(args[0]) ?? (typeof args[0] === 'string' ? args[0] : null);
    if (rideId) handlers.onRideUnavailable?.(rideId);
    else handlers.onRideUpdated?.();
  });

  connection.on('RideAccepted', (...args: unknown[]) => {
    const rideId = extractRideId(args[0]);
    handlers.onRideAccepted?.(rideId);
    handlers.onRideUpdated?.();
  });

  connection.on('RideStatusChanged', (...args: unknown[]) => {
    const normalized = normalizeRideStatus(args[0]);
    if (
      normalized.rideStatusId == null &&
      typeof args[0] === 'number' &&
      Number.isFinite(args[0])
    ) {
      handlers.onRideStatusChanged?.(args[0], extractRideId(args[1]));
    } else if (normalized.rideStatusId != null) {
      handlers.onRideStatusChanged?.(
        normalized.rideStatusId,
        normalized.rideId,
      );
    }
    handlers.onRideUpdated?.();
  });

  connection.on('DriverLocationUpdated', (...args: unknown[]) => {
    const location =
      normalizeLatLng(args[0]) ||
      normalizeLatLng({ latitude: args[0], longitude: args[1] });
    if (!location) return;
    const rideId = extractRideId(args[0]) ?? extractRideId(args[2]);
    handlers.onDriverLocationUpdated?.(location, rideId);
  });

  connection.on('RideCancelled', (...args: unknown[]) => {
    const rideId = extractRideId(args[0]);
    handlers.onRideCancelled?.(rideId);
    handlers.onRideUpdated?.();
  });
}

function unbindRideEvents(connection: HubConnection) {
  for (const event of [
    'NewRideAvailable',
    'RideUnavailable',
    'RideAccepted',
    'RideStatusChanged',
    'DriverLocationUpdated',
    'RideCancelled',
  ]) {
    connection.off(event);
  }
}

/**
 * Connect to `/hubs/rides`, optionally JoinRide, and deliver ride lifecycle events.
 * On reconnect: GET /api/rides/current then JoinRide again when an active ride exists.
 */
export async function startRideHub(
  handlers: RideHubHandlers,
  options?: { rideId?: string | null },
): Promise<() => Promise<void>> {
  const connection = await createRideHubConnection();
  let stopped = false;
  let activeRideId = options?.rideId ?? null;

  const notifyConnected = () => {
    handlers.onConnectionChange?.(
      connection.state === HubConnectionState.Connected,
    );
  };

  bindRideEvents(connection, handlers);

  const rejoinFromCurrent = async () => {
    try {
      const current = await getCurrentRide();
      if (current?.id) {
        activeRideId = current.id;
        await joinRide(connection, current.id);
      } else if (activeRideId) {
        await joinRide(connection, activeRideId);
      }
    } catch {
      if (activeRideId) await joinRide(connection, activeRideId);
    }
    handlers.onRideUpdated?.();
  };

  connection.onreconnected(async () => {
    notifyConnected();
    await rejoinFromCurrent();
  });
  connection.onreconnecting(() => notifyConnected());
  connection.onclose(() => notifyConnected());

  try {
    await connection.start();
    notifyConnected();
    if (activeRideId) {
      await joinRide(connection, activeRideId);
    }
  } catch (error) {
    notifyConnected();
    if (__DEV__) {
      console.warn('[SignalR] Failed to connect to', SIGNALR_RIDES_HUB_URL, error);
    }
  }

  return async () => {
    if (stopped) return;
    stopped = true;
    unbindRideEvents(connection);
    if (activeRideId) {
      try {
        await leaveRide(connection, activeRideId);
      } catch {
        // ignore
      }
    }
    try {
      await connection.stop();
    } catch {
      // ignore
    }
  };
}
