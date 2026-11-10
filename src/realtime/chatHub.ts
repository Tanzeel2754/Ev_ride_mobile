import {
  HubConnection,
  HubConnectionBuilder,
  HubConnectionState,
  LogLevel,
} from '@microsoft/signalr';
import { getAccessToken } from '../lib/auth-storage';
import { SIGNALR_HUB_URL } from '../lib/config';
import type { GetRideMessagesResponse } from '../types/api';
import { normalizeChatMessage } from './normalize';

export type ChatRealtimeHandlers = {
  onChatMessage?: (message: GetRideMessagesResponse) => void;
  onConnectionChange?: (connected: boolean) => void;
};

const MESSAGE_EVENTS = [
  'ReceiveMessage',
  'NewMessage',
  'MessageReceived',
  'ChatMessage',
  'ReceiveChatMessage',
];

const JOIN_METHODS = ['JoinRide', 'JoinRideGroup', 'SubscribeToRide', 'Join'];

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

export async function createChatHubConnection(): Promise<HubConnection> {
  return new HubConnectionBuilder()
    .withUrl(SIGNALR_HUB_URL, {
      accessTokenFactory: async () => (await getAccessToken()) || '',
    })
    .withAutomaticReconnect([0, 2000, 5000, 10000, 30000])
    .configureLogging(__DEV__ ? LogLevel.Information : LogLevel.Warning)
    .build();
}

async function joinChatRide(connection: HubConnection, rideId: string) {
  if (connection.state !== HubConnectionState.Connected) return;
  for (const method of JOIN_METHODS) {
    const ok = await safeInvoke(connection, method, rideId);
    if (ok) return;
  }
}

/** Chat-only SignalR against `/hubs/chat`. */
export async function startChatRealtime(
  rideId: string,
  handlers: ChatRealtimeHandlers,
): Promise<() => Promise<void>> {
  const connection = await createChatHubConnection();
  let stopped = false;

  const notifyConnected = () => {
    handlers.onConnectionChange?.(
      connection.state === HubConnectionState.Connected,
    );
  };

  for (const event of MESSAGE_EVENTS) {
    connection.on(event, (...args: unknown[]) => {
      const message =
        normalizeChatMessage(args[0]) ||
        normalizeChatMessage(args.length === 1 ? args[0] : args);
      if (message) handlers.onChatMessage?.(message);
    });
  }

  connection.onreconnected(async () => {
    notifyConnected();
    await joinChatRide(connection, rideId);
  });
  connection.onreconnecting(() => notifyConnected());
  connection.onclose(() => notifyConnected());

  try {
    await connection.start();
    notifyConnected();
    await joinChatRide(connection, rideId);
  } catch (error) {
    notifyConnected();
    if (__DEV__) {
      console.warn('[SignalR] Failed to connect to', SIGNALR_HUB_URL, error);
    }
  }

  return async () => {
    if (stopped) return;
    stopped = true;
    for (const event of MESSAGE_EVENTS) {
      connection.off(event);
    }
    try {
      await safeInvoke(connection, 'LeaveRide', rideId);
      await safeInvoke(connection, 'LeaveRideGroup', rideId);
    } catch {
      // ignore
    }
    try {
      await connection.stop();
    } catch {
      // ignore
    }
  };
}
