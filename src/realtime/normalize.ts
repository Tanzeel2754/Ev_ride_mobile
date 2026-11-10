import type { GetRideMessagesResponse, LatLng } from '../types/api';

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== 'object') return null;
  return value as Record<string, unknown>;
}

function num(...values: unknown[]): number | null {
  for (const v of values) {
    if (typeof v === 'number' && Number.isFinite(v)) return v;
    if (typeof v === 'string' && v.trim() && Number.isFinite(Number(v))) {
      return Number(v);
    }
  }
  return null;
}

function str(...values: unknown[]): string | null {
  for (const v of values) {
    if (typeof v === 'string' && v.trim()) return v.trim();
  }
  return null;
}

export function normalizeLatLng(payload: unknown): LatLng | null {
  const root = asRecord(payload);
  if (!root) return null;
  const nested =
    asRecord(root.location) ||
    asRecord(root.driverLocation) ||
    asRecord(root.data) ||
    root;

  const latitude = num(
    nested.latitude,
    nested.Latitude,
    nested.lat,
    nested.Lat,
  );
  const longitude = num(
    nested.longitude,
    nested.Longitude,
    nested.lng,
    nested.Lng,
    nested.lon,
    nested.Lon,
  );
  if (latitude == null || longitude == null) return null;
  return { latitude, longitude };
}

export function normalizeRideStatus(payload: unknown): {
  rideId?: string | null;
  rideStatusId?: number | null;
} {
  const root = asRecord(payload);
  if (!root) return {};
  const nested = asRecord(root.data) || asRecord(root.ride) || root;
  return {
    rideId: str(nested.rideId, nested.RideId, nested.id, nested.Id),
    rideStatusId: num(
      nested.rideStatusId,
      nested.RideStatusId,
      nested.statusId,
      nested.StatusId,
      nested.status,
    ),
  };
}

export function normalizeChatMessage(payload: unknown): GetRideMessagesResponse | null {
  const root = asRecord(payload);
  if (!root) return null;
  const nested =
    asRecord(root.message) ||
    asRecord(root.data) ||
    asRecord(root.chatMessage) ||
    root;

  const id = str(nested.id, nested.Id);
  const senderId = str(nested.senderId, nested.SenderId);
  const receiverId = str(nested.receiverId, nested.ReceiverId);
  const messageTypeId = num(nested.messageTypeId, nested.MessageTypeId) ?? 1;
  const createdOn = str(nested.createdOn, nested.CreatedOn) ?? new Date().toISOString();

  if (!id || !senderId) return null;

  return {
    id,
    senderId,
    receiverId: receiverId ?? '',
    messageTypeId,
    content: (str(nested.content, nested.Content) as string | null) ?? null,
    mediaUrl: (str(nested.mediaUrl, nested.MediaUrl) as string | null) ?? null,
    durationInSeconds: num(nested.durationInSeconds, nested.DurationInSeconds),
    isRead: Boolean(nested.isRead ?? nested.IsRead ?? false),
    createdOn,
  };
}

export function extractRideId(payload: unknown): string | null {
  const root = asRecord(payload);
  if (!root) return typeof payload === 'string' ? payload : null;
  return str(root.rideId, root.RideId, root.id, root.Id);
}
