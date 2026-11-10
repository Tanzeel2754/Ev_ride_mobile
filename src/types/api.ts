export type ApiResult = {
  isSuccess: boolean;
  message?: string | null;
};

export type GuidResult = ApiResult & {
  data?: string;
};

/** Backend accepts "email" | "sms" — SMS uses fixed OTP from SmsOtp:FixedCode. */
export type LoginMethod = 'email' | 'sms';

export type SignUpRequest = {
  name?: string | null;
  email?: string | null;
  phoneNumber?: string | null;
  loginMethod?: LoginMethod | string | null;
};

export type VerifyOtpRequest = {
  email?: string | null;
  phoneNumber?: string | null;
  loginMethod?: LoginMethod | string | null;
  otp?: string | null;
};

export type VerifyOtpResponse = {
  accessToken?: string | null;
  refreshToken?: string | null;
  accessTokenExpiresOn: string;
  refreshTokenExpiresOn: string;
};

export type VerifyOtpResponseResult = ApiResult & {
  data?: VerifyOtpResponse;
};

export type RefreshTokenRequest = {
  refreshToken: string | null;
};

export type RefreshTokenResponse = {
  accessToken?: string | null;
  refreshToken?: string | null;
  accessTokenExpiresOn: string;
  refreshTokenExpiresOn: string;
};

export type RefreshTokenResponseResult = ApiResult & {
  data?: RefreshTokenResponse;
};

export type LogoutRequest = {
  refreshToken: string | null;
};

export type CreateRideRequest = {
  pickupLatitude: number;
  pickupLongitude: number;
  pickupAddress?: string | null;
  destinationLatitude: number;
  destinationLongitude: number;
  destinationAddress?: string | null;
  tripTypeId: number;
  scheduledPickupTime?: string | null;
  proposedFare?: number | null;
  /** Required by API — must be > 0 or create fails with "distance must be greater than zero". */
  estimatedDistanceKm: number;
  isCorporateRide?: boolean;
};

export type GetCurrentRideResponse = {
  id: string;
  pickupAddress?: string | null;
  destinationAddress?: string | null;
  pickupLatitude: number;
  pickupLongitude: number;
  destinationLatitude: number;
  destinationLongitude: number;
  rideStatusId: number;
  driverProfileId?: string | null;
  vehicleId?: string | null;
  estimatedFare?: number | null;
  proposedFare?: number | null;
  finalFare?: number | null;
  requestedOn: string;
};

export type GetRideByIdResponse = GetCurrentRideResponse & {
  tripTypeId: number;
  scheduledPickupTime?: string | null;
  estimatedDistanceKm?: number | null;
  estimatedDurationMinutes?: number | null;
  actualDistanceKm?: number | null;
  actualDurationMinutes?: number | null;
  acceptedOn?: string | null;
  driverArrivedOn?: string | null;
  startedOn?: string | null;
  completedOn?: string | null;
};

export type GetRideHistoryResponse = {
  id: string;
  pickupAddress?: string | null;
  destinationAddress?: string | null;
  rideStatusId: number;
  finalFare?: number | null;
  requestedOn: string;
  completedOn?: string | null;
};

export type GetAvailableRideResponse = {
  id: string;
  pickupAddress?: string | null;
  destinationAddress?: string | null;
  pickupLatitude: number;
  pickupLongitude: number;
  destinationLatitude: number;
  destinationLongitude: number;
  proposedFare?: number | null;
  estimatedFare?: number | null;
  estimatedDistanceKm?: number | null;
  requestedOn: string;
};

export type CancelRideRequest = {
  rideId: string;
  cancellationReason?: string | null;
};

export type AcceptRideRequest = { rideId: string };
export type DriverArrivingRequest = { rideId: string };
export type DriverArrivedRequest = { rideId: string };
export type StartRideRequest = { rideId: string };

export type CompleteRideRequest = {
  rideId: string;
  actualDistanceKm: number;
  actualDurationMinutes: number;
  finalFare: number;
};

export type DriverCancelRideRequest = {
  rideId: string;
  cancellationReason?: string | null;
};

export type UpdateDriverOnlineStatusRequest = { isOnline: boolean };
export type UpdateDriverLocationRequest = {
  latitude: number;
  longitude: number;
};

export type CreateRatingRequest = {
  rideId: string;
  stars: number;
  feedbackTypeIds?: number[] | null;
  comment?: string | null;
};

export type CreateRatingResponse = {
  id: string;
  rideId: string;
  stars: number;
  ratedParticipantTypeId: number;
};

export type GetRideRatingResponse = {
  rideId: string;
  canRate: boolean;
  hasRated: boolean;
  ratedParticipantTypeId?: number | null;
  ratingId?: string | null;
  stars?: number | null;
  reason?: string | null;
};

export type RatingFeedbackOption = {
  id: number;
  code?: string | null;
  label?: string | null;
};

export type PendingRatingResponse = {
  rideId: string;
  ratedUserProfileId: string;
  ratedUserName?: string | null;
  ratedParticipantTypeId: number;
  rideCompletedOn: string;
};

export type SendMessageRequest = {
  rideId: string;
  messageTypeId: number;
  content?: string | null;
  mediaUrl?: string | null;
  durationInSeconds?: number | null;
};

export type SendMessageResponse = {
  id: string;
  createdOn: string;
};

export type GetRideMessagesResponse = {
  id: string;
  senderId: string;
  receiverId: string;
  messageTypeId: number;
  content?: string | null;
  mediaUrl?: string | null;
  durationInSeconds?: number | null;
  isRead: boolean;
  createdOn: string;
};

export type MarkMessagesAsReadRequest = {
  rideId: string;
};

export type LatLng = {
  latitude: number;
  longitude: number;
};

export type RegisterDriverRequest = {
  drivingLicenseNumber?: string | null;
  licenseExpiryOn: string;
  dateOfBirth?: string | null;
  genderId?: number | null;
  nationalIdNumber?: string | null;
  addressLine?: string | null;
  city?: string | null;
  country?: string | null;
  emergencyContactName?: string | null;
  emergencyContactPhone?: string | null;
};

export type GetDriverProfileByIdResponse = {
  id: string;
  userProfileId: string;
  firstName?: string | null;
  lastName?: string | null;
  email?: string | null;
  phoneNumber?: string | null;
  profileImageUrl?: string | null;
  dateOfBirth?: string | null;
  genderId?: number | null;
  addressLine?: string | null;
  city?: string | null;
  country?: string | null;
  emergencyContactName?: string | null;
  emergencyContactPhone?: string | null;
  about?: string | null;
  preferredLanguage?: string | null;
  drivingLicenseNumber?: string | null;
  licenseExpiryOn?: string | null;
  licenseDocumentUrl?: string | null;
  idDocumentUrl?: string | null;
  verificationStatusId: number;
  rejectionReason?: string | null;
  verifiedOn?: string | null;
  isOnline: boolean;
  averageRating: number;
  ratingCount: number;
  completedTripsCount: number;
};

export type UpdateDriverProfileRequest = {
  firstName?: string | null;
  lastName?: string | null;
  drivingLicenseNumber?: string | null;
  licenseExpiryOn?: string | null;
  dateOfBirth?: string | null;
  genderId?: number | null;
  nationalIdNumber?: string | null;
  addressLine?: string | null;
  city?: string | null;
  country?: string | null;
  emergencyContactName?: string | null;
  emergencyContactPhone?: string | null;
  about?: string | null;
  preferredLanguage?: string | null;
};

export type StringResult = ApiResult & {
  data?: string | null;
};

export type GetDriverOnboardingStatusResponse = {
  isDriverRegistered: boolean;
  hasDrivingLicence: boolean;
  hasIdDocument: boolean;
  hasVehicle: boolean;
  hasVehicleRegistrationDocument: boolean;
  driverVerificationStatusId?: number | null;
  vehicleVerificationStatusId?: number | null;
  isComplete: boolean;
};

export type GetDriverRegistrationStatusResponse = {
  isRegistered: boolean;
  verificationStatusId?: number | null;
  rejectionReason?: string | null;
  hasDrivingLicence: boolean;
  hasIdDocument: boolean;
};

export type CreateVehicleRequest = {
  make?: string | null;
  model?: string | null;
  year: number;
  color?: string | null;
  plateNumber?: string | null;
  vehicleTypeId: number;
};

export type UpdateVehicleRequest = {
  id: string;
  make?: string | null;
  model?: string | null;
  year?: number | null;
  color?: string | null;
  plateNumber?: string | null;
  vehicleTypeId?: number | null;
};

export type GetAllDriverVehicleResponse = {
  id: string;
  make?: string | null;
  model?: string | null;
  year: number;
  plateNumber?: string | null;
  verificationStatusId: number;
  color?: string | null;
  vehicleTypeId?: number | null;
  registrationDocumentUrl?: string | null;
};

export type GetDriverVehicleByIdResponse = {
  id: string;
  make?: string | null;
  model?: string | null;
  year: number;
  plateNumber?: string | null;
  verificationStatusId: number;
  color?: string | null;
  vehicleTypeId?: number | null;
  registrationDocumentUrl?: string | null;
  rejectionReason?: string | null;
};

export type PaginatedResponse<T> = {
  items?: T[] | null;
  pageNumber: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
  hasPreviousPage: boolean;
  hasNextPage: boolean;
};

export type ApiError = {
  status: number;
  message: string;
  isNetworkError?: boolean;
  isUnauthorized?: boolean;
};
