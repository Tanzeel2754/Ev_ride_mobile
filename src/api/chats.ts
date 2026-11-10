import { apiRequest } from './client';
import type {
  GetRideMessagesResponse,
  MarkMessagesAsReadRequest,
  SendMessageRequest,
  SendMessageResponse,
} from '../types/api';

export function sendChatMessage(payload: SendMessageRequest) {
  return apiRequest<SendMessageResponse>('/api/chats', {
    method: 'POST',
    body: payload,
  });
}

export function getRideMessages(rideId: string) {
  return apiRequest<GetRideMessagesResponse[]>(
    `/api/chats/ride?RideId=${encodeURIComponent(rideId)}`,
  );
}

export function markMessagesAsRead(payload: MarkMessagesAsReadRequest) {
  return apiRequest<boolean>('/api/chats/read', {
    method: 'PUT',
    body: payload,
  });
}
