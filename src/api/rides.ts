import { apiRequest } from './client';
import type {
  AcceptRideRequest,
  ApiResult,
  CancelRideRequest,
  CompleteRideRequest,
  CreateRideRequest,
  DriverArrivedRequest,
  DriverArrivingRequest,
  DriverCancelRideRequest,
  GetAvailableRideResponse,
  GetCurrentRideResponse,
  GetRideByIdResponse,
  GetRideHistoryResponse,
  GuidResult,
  StartRideRequest,
  UpdateDriverLocationRequest,
  UpdateDriverOnlineStatusRequest,
} from '../types/api';

export function createRide(payload: CreateRideRequest) {
  return apiRequest<GuidResult>('/api/rides', {
    method: 'POST',
    body: payload,
  });
}

export function getCurrentRide() {
  return apiRequest<GetCurrentRideResponse | null>('/api/rides/current');
}

export function getRideById(id: string) {
  return apiRequest<GetRideByIdResponse>(`/api/rides/id?Id=${encodeURIComponent(id)}`);
}

export function getRideHistory() {
  return apiRequest<GetRideHistoryResponse[]>('/api/rides/history');
}

export function cancelRide(payload: CancelRideRequest) {
  return apiRequest<ApiResult>('/api/rides/cancel', {
    method: 'PUT',
    body: payload,
  });
}

export function getAvailableRides() {
  return apiRequest<GetAvailableRideResponse[]>('/api/rides/available');
}

export function acceptRide(payload: AcceptRideRequest) {
  return apiRequest<ApiResult>('/api/rides/accept', {
    method: 'PUT',
    body: payload,
  });
}

export function markArriving(payload: DriverArrivingRequest) {
  return apiRequest<ApiResult>('/api/rides/arriving', {
    method: 'PUT',
    body: payload,
  });
}

export function markArrived(payload: DriverArrivedRequest) {
  return apiRequest<ApiResult>('/api/rides/arrived', {
    method: 'PUT',
    body: payload,
  });
}

export function startRide(payload: StartRideRequest) {
  return apiRequest<ApiResult>('/api/rides/start', {
    method: 'PUT',
    body: payload,
  });
}

export function completeRide(payload: CompleteRideRequest) {
  return apiRequest<ApiResult>('/api/rides/complete', {
    method: 'PUT',
    body: payload,
  });
}

export function driverCancelRide(payload: DriverCancelRideRequest) {
  return apiRequest<ApiResult>('/api/rides/driver-cancel', {
    method: 'PUT',
    body: payload,
  });
}

export function updateOnlineStatus(payload: UpdateDriverOnlineStatusRequest) {
  return apiRequest<ApiResult>('/api/rides/online-status', {
    method: 'PUT',
    body: payload,
  });
}

export function updateDriverLocation(payload: UpdateDriverLocationRequest) {
  return apiRequest<ApiResult>('/api/rides/location', {
    method: 'PUT',
    body: payload,
  });
}
