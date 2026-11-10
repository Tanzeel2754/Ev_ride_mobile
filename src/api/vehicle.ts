import { apiRequest } from './client';
import { buildFileFormData } from '../lib/form-data';
import type {
  ApiResult,
  CreateVehicleRequest,
  GetAllDriverVehicleResponse,
  GetDriverVehicleByIdResponse,
  GuidResult,
  PaginatedResponse,
  UpdateVehicleRequest,
} from '../types/api';

export function createVehicle(payload: CreateVehicleRequest) {
  return apiRequest<GuidResult>('/api/vehicle', {
    method: 'POST',
    body: payload,
  });
}

export function updateVehicle(payload: UpdateVehicleRequest) {
  return apiRequest<ApiResult>('/api/vehicle', {
    method: 'PUT',
    body: payload,
  });
}

export async function listVehicles(pageNumber = 1, pageSize = 20) {
  const data = await apiRequest<
    PaginatedResponse<GetAllDriverVehicleResponse> | GetAllDriverVehicleResponse[]
  >(`/api/vehicle?PageNumber=${pageNumber}&PageSize=${pageSize}`);

  if (Array.isArray(data)) {
    return {
      items: data,
      pageNumber,
      pageSize,
      totalCount: data.length,
      totalPages: 1,
      hasPreviousPage: false,
      hasNextPage: false,
    } satisfies PaginatedResponse<GetAllDriverVehicleResponse>;
  }

  return {
    items: data?.items ?? [],
    pageNumber: data?.pageNumber ?? pageNumber,
    pageSize: data?.pageSize ?? pageSize,
    totalCount: data?.totalCount ?? data?.items?.length ?? 0,
    totalPages: data?.totalPages ?? 1,
    hasPreviousPage: !!data?.hasPreviousPage,
    hasNextPage: !!data?.hasNextPage,
  };
}

export function getVehicleById(id: string) {
  return apiRequest<GetDriverVehicleByIdResponse>(
    `/api/vehicle/id?Id=${encodeURIComponent(id)}`,
  );
}

export async function uploadVehicleRegistration(
  vehicleId: string,
  fileUri: string,
  fileName: string,
  mimeType: string,
) {
  const form = await buildFileFormData(fileUri, fileName, mimeType);
  return apiRequest<ApiResult>(
    `/api/vehicle/registration?vehicleId=${encodeURIComponent(vehicleId)}`,
    {
      method: 'POST',
      formData: form,
      timeoutMs: 60000,
    },
  );
}
