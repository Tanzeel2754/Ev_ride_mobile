import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import type { LoginMethod } from '../types/api';

const ACCESS_TOKEN_KEY = 'evride_access_token';
const REFRESH_TOKEN_KEY = 'evride_refresh_token';
const EMAIL_KEY = 'evride_email';
const PHONE_KEY = 'evride_phone';
const NAME_KEY = 'evride_name';
const LOGIN_METHOD_KEY = 'evride_login_method';
const EXPIRES_KEY = 'evride_access_expires';

async function setItem(key: string, value: string) {
  if (Platform.OS === 'web') {
    localStorage.setItem(key, value);
    return;
  }
  await SecureStore.setItemAsync(key, value);
}

async function getItem(key: string) {
  if (Platform.OS === 'web') {
    return localStorage.getItem(key);
  }
  return SecureStore.getItemAsync(key);
}

async function deleteItem(key: string) {
  if (Platform.OS === 'web') {
    localStorage.removeItem(key);
    return;
  }
  await SecureStore.deleteItemAsync(key);
}

export type StoredSession = {
  accessToken: string;
  refreshToken?: string | null;
  accessTokenExpiresOn?: string | null;
  email?: string | null;
  phoneNumber?: string | null;
  loginMethod?: LoginMethod | null;
  name?: string | null;
};

export async function saveSession(session: StoredSession) {
  await setItem(ACCESS_TOKEN_KEY, session.accessToken);
  if (session.refreshToken) await setItem(REFRESH_TOKEN_KEY, session.refreshToken);
  if (session.accessTokenExpiresOn) await setItem(EXPIRES_KEY, session.accessTokenExpiresOn);
  if (session.email) await setItem(EMAIL_KEY, session.email);
  if (session.phoneNumber) await setItem(PHONE_KEY, session.phoneNumber);
  if (session.loginMethod) await setItem(LOGIN_METHOD_KEY, session.loginMethod);
  if (session.name) await setItem(NAME_KEY, session.name);
}

export async function getAccessToken() {
  return getItem(ACCESS_TOKEN_KEY);
}

export async function getSession(): Promise<StoredSession | null> {
  const accessToken = await getItem(ACCESS_TOKEN_KEY);
  if (!accessToken) return null;
  const loginMethod = (await getItem(LOGIN_METHOD_KEY)) as LoginMethod | null;
  return {
    accessToken,
    refreshToken: await getItem(REFRESH_TOKEN_KEY),
    accessTokenExpiresOn: await getItem(EXPIRES_KEY),
    email: await getItem(EMAIL_KEY),
    phoneNumber: await getItem(PHONE_KEY),
    loginMethod,
    name: await getItem(NAME_KEY),
  };
}

/** Clears access token from storage; keeps refresh token + identity for sign-in. */
export async function clearSession() {
  await Promise.all([deleteItem(ACCESS_TOKEN_KEY), deleteItem(EXPIRES_KEY)]);
}

export async function getRefreshToken() {
  return getItem(REFRESH_TOKEN_KEY);
}

export async function clearAllSessionData() {
  await Promise.all([
    deleteItem(ACCESS_TOKEN_KEY),
    deleteItem(REFRESH_TOKEN_KEY),
    deleteItem(EXPIRES_KEY),
    deleteItem(EMAIL_KEY),
    deleteItem(PHONE_KEY),
    deleteItem(LOGIN_METHOD_KEY),
    deleteItem(NAME_KEY),
  ]);
}

export async function getLoginHint(): Promise<{
  email: string | null;
  phoneNumber: string | null;
  loginMethod: LoginMethod | null;
  name: string | null;
}> {
  const loginMethod = (await getItem(LOGIN_METHOD_KEY)) as LoginMethod | null;
  return {
    email: await getItem(EMAIL_KEY),
    phoneNumber: await getItem(PHONE_KEY),
    loginMethod,
    name: await getItem(NAME_KEY),
  };
}
