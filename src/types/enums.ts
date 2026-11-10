export enum DriverVerificationStatus {
  Pending = 1,
  Approved = 2,
  Rejected = 3,
}

export enum VehicleType {
  Standard = 1,
  Moto = 2,
  Premium = 3,
}

export enum VehicleVerificationStatus {
  Pending = 1,
  Approved = 2,
  Rejected = 3,
}

export enum RideStatus {
  Searching = 1,
  Accepted = 2,
  DriverArriving = 3,
  DriverArrived = 4,
  InProgress = 5,
  Completed = 6,
  CancelledByPassenger = 7,
  CancelledByDriver = 8,
  NoDriverAvailable = 9,
}

/** Who is being rated. Swagger enum is 1 | 2. */
export enum RatingParticipantType {
  Rider = 1,
  Driver = 2,
}

export enum MessageType {
  Text = 1,
  Voice = 2,
}

/** Statuses where in-ride chat is available (after driver accepts). */
export const CHAT_ENABLED_STATUSES: RideStatus[] = [
  RideStatus.Accepted,
  RideStatus.DriverArriving,
  RideStatus.DriverArrived,
  RideStatus.InProgress,
];

export function isChatEnabled(rideStatusId: number) {
  return CHAT_ENABLED_STATUSES.includes(rideStatusId as RideStatus);
}

export const RideStatusLabel: Record<RideStatus, string> = {
  [RideStatus.Searching]: 'Searching for driver',
  [RideStatus.Accepted]: 'Driver accepted',
  [RideStatus.DriverArriving]: 'Driver arriving',
  [RideStatus.DriverArrived]: 'Driver arrived',
  [RideStatus.InProgress]: 'In progress',
  [RideStatus.Completed]: 'Completed',
  [RideStatus.CancelledByPassenger]: 'Cancelled by you',
  [RideStatus.CancelledByDriver]: 'Cancelled by driver',
  [RideStatus.NoDriverAvailable]: 'No driver available',
};

export const VehicleTypeLabel: Record<VehicleType, string> = {
  [VehicleType.Standard]: 'Standard',
  [VehicleType.Moto]: 'Moto',
  [VehicleType.Premium]: 'Premium',
};

export const VerificationStatusLabel: Record<number, string> = {
  [DriverVerificationStatus.Pending]: 'Pending',
  [DriverVerificationStatus.Approved]: 'Approved',
  [DriverVerificationStatus.Rejected]: 'Rejected',
};
