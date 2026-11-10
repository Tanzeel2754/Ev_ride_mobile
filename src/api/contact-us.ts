import { apiRequest } from './client';
import type { ApiResult } from '../types/api';

export type ContactUsRequest = {
  name?: string | null;
  email?: string | null;
  phoneNumber?: string | null;
  subject?: string | null;
  message?: string | null;
};

export function createContactUs(payload: ContactUsRequest) {
  return apiRequest<ApiResult>('/api/contact-us', {
    method: 'POST',
    body: payload,
    auth: true,
  });
}

