import Constants from 'expo-constants';
import { Platform } from 'react-native';

export const AZURE_API_BASE_URL =
  'https://evrides-exaabxfrcdefc9dh.southeastasia-01.azurewebsites.net';

const PROXY_PREFIX = '/__api';

function metroHost(): string | null {
  const hostUri =
    Constants.expoConfig?.hostUri ||
    Constants.expoGoConfig?.debuggerHost ||
    (Constants as { manifest?: { debuggerHost?: string } }).manifest
      ?.debuggerHost;

  if (!hostUri) return null;
  return hostUri.replace(/^exp:\/\//, '').replace(/\/.*$/, '');
}

/**
 * In Expo Go / web, call Azure through the Metro proxy on this computer.
 * Azure currently fails browser CORS preflight (OPTIONS → 401, no Allow-Origin).
 */
function resolveApiBaseUrl() {
  const fromEnv = process.env.EXPO_PUBLIC_API_BASE_URL?.trim();

  if (!__DEV__) {
    const fromExtra = (
      Constants.expoConfig?.extra as { apiBaseUrl?: string } | undefined
    )?.apiBaseUrl?.trim();
    return (fromEnv || fromExtra || AZURE_API_BASE_URL).replace(/\/$/, '');
  }

  if (Platform.OS === 'web' && typeof window !== 'undefined') {
    return `${window.location.origin}${PROXY_PREFIX}`;
  }

  const host = metroHost();
  if (host) {
    return `http://${host}${PROXY_PREFIX}`;
  }

  return (fromEnv || AZURE_API_BASE_URL).replace(/\/$/, '');
}

export const API_BASE_URL = resolveApiBaseUrl();

/**
 * SignalR must hit the real API origin (WebSockets cannot use the Metro CORS proxy).
 */
export function resolveSignalRBaseUrl() {
  const fromEnv = process.env.EXPO_PUBLIC_API_BASE_URL?.trim()?.replace(/\/$/, '');
  if (
    fromEnv &&
    !fromEnv.includes('/__api') &&
    !fromEnv.includes(':8081')
  ) {
    return fromEnv;
  }
  return AZURE_API_BASE_URL;
}

export const SIGNALR_HUB_URL = `${resolveSignalRBaseUrl()}/hubs/chat`;

/** Ride lifecycle / location / offers — separate from chat. */
export const SIGNALR_RIDES_HUB_URL = `${resolveSignalRBaseUrl()}/hubs/rides`;

/**
 * tripTypeId is required by CreateRideRequest but not documented in Swagger.
 * Confirm with backend; defaulting to 1 for now.
 */
export const DEFAULT_TRIP_TYPE_ID = 1;

/** Default vehicle type: Standard = 1, Moto = 2, Premium = 3 */
export const DEFAULT_VEHICLE_TYPE_ID = 1;

/**
 * Dev / staging fixed OTP.
 * Backend `SmsOtp:FixedCode` is `123456`; email OTP uses the same fixed code.
 */
export const FIXED_OTP_CODE = '123456';
