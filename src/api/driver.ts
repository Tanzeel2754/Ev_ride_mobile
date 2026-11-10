import { apiRequest } from './client';
import { buildFileFormData } from '../lib/form-data';
import type {
  ApiResult,
  GetDriverOnboardingStatusResponse,
  GetDriverProfileByIdResponse,
  GetDriverRegistrationStatusResponse,
  RegisterDriverRequest,
  StringResult,
  UpdateDriverProfileRequest,
} from '../types/api';

export function registerDriver(payload: RegisterDriverRequest) {
  return apiRequest<ApiResult>('/api/driver/register', {
    method: 'POST',
    body: payload,
  });
}

export function getDriverProfile() {
  return apiRequest<GetDriverProfileByIdResponse>('/api/driver/profile');
}

export function updateDriverProfile(payload: UpdateDriverProfileRequest) {
  return apiRequest<ApiResult>('/api/driver/profile', {
    method: 'PUT',
    body: payload,
  });
}

export function getDriverRegistrationStatus() {
  return apiRequest<GetDriverRegistrationStatusResponse>(
    '/api/driver/registration-status',
  );
}

export function getDriverOnboardingStatus() {
  return apiRequest<GetDriverOnboardingStatusResponse>(
    '/api/driver/onboarding-status',
  );
}

export async function uploadLicenseDocument(
  fileUri: string,
  fileName: string,
  mimeType: string,
) {
  const form = await buildFileFormData(fileUri, fileName, mimeType);
  return apiRequest<ApiResult>('/api/driver/license-document', {
    method: 'POST',
    formData: form,
    timeoutMs: 60000,
  });
}

export async function uploadIdDocument(
  fileUri: string,
  fileName: string,
  mimeType: string,
) {
  const form = await buildFileFormData(fileUri, fileName, mimeType);
  return apiRequest<ApiResult>('/api/driver/id-document', {
    method: 'POST',
    formData: form,
    timeoutMs: 60000,
  });
}

export async function uploadProfileImage(
  fileUri: string,
  fileName: string,
  mimeType: string,
) {
  const form = await buildFileFormData(fileUri, fileName, mimeType);
  return apiRequest<StringResult>('/api/driver/profile/image', {
    method: 'POST',
    formData: form,
    timeoutMs: 60000,
  });
}

export function deleteProfileImage() {
  return apiRequest<ApiResult>('/api/driver/profile/image', {
    method: 'DELETE',
  });
}
