import { apiRequest } from './client';
import type {
  ApiResult,
  LogoutRequest,
  RefreshTokenRequest,
  RefreshTokenResponseResult,
  SignUpRequest,
  VerifyOtpRequest,
  VerifyOtpResponseResult,
} from '../types/api';

export function signUp(payload: SignUpRequest) {
  return apiRequest<ApiResult>('/api/auth/register', {
    method: 'POST',
    body: payload,
    auth: false,
  });
}

/** Sends OTP via email or SMS depending on `loginMethod`. */
export function requestOtp(payload: SignUpRequest) {
  return signUp(payload);
}

export function verifyOtp(payload: VerifyOtpRequest) {
  return apiRequest<VerifyOtpResponseResult>('/api/auth/verify-otp', {
    method: 'POST',
    body: payload,
    auth: false,
  });
}

export function refreshToken(payload: RefreshTokenRequest) {
  return apiRequest<RefreshTokenResponseResult>('/api/auth/refresh-token', {
    method: 'POST',
    body: payload,
    auth: false,
  });
}

export function logout(payload: LogoutRequest) {
  return apiRequest<ApiResult>('/api/auth/logout', {
    method: 'POST',
    body: payload,
    auth: false,
  });
}
