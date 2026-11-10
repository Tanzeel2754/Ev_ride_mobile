import { apiRequest } from './client';
import type {
  CreateRatingRequest,
  CreateRatingResponse,
  GetRideRatingResponse,
  PendingRatingResponse,
  RatingFeedbackOption,
} from '../types/api';

export function createRating(payload: CreateRatingRequest) {
  return apiRequest<CreateRatingResponse>('/api/ratings', {
    method: 'POST',
    body: payload,
  });
}

export function getRideRating(rideId: string) {
  return apiRequest<GetRideRatingResponse>(
    `/api/ratings/ride/${encodeURIComponent(rideId)}`,
  );
}

export function getPendingRatings(page = 1, pageSize = 20) {
  return apiRequest<{
    totalCount: number;
    page: number;
    pageSize: number;
    items?: PendingRatingResponse[] | null;
  }>(`/api/ratings/pending?Page=${page}&PageSize=${pageSize}`);
}

export async function getFeedbackOptions(participantType: number) {
  const data = await apiRequest<unknown>(
    `/api/ratings/feedback-options/${participantType}`,
  );
  return normalizeFeedbackOptions(data);
}

function normalizeFeedbackOptions(data: unknown): RatingFeedbackOption[] {
  const list = Array.isArray(data)
    ? data
    : data && typeof data === 'object' && Array.isArray((data as { items?: unknown }).items)
      ? (data as { items: unknown[] }).items
      : data && typeof data === 'object' && Array.isArray((data as { data?: unknown }).data)
        ? (data as { data: unknown[] }).data
        : [];

  return list.flatMap((item) => {
    if (!item || typeof item !== 'object') return [];
    const row = item as { id?: unknown; code?: unknown; label?: unknown };
    const id = Number(row.id);
    if (!Number.isFinite(id)) return [];
    return [
      {
        id,
        code: typeof row.code === 'string' ? row.code : null,
        label: typeof row.label === 'string' ? row.label : null,
      },
    ];
  });
}
