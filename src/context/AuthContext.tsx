import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import {
  logout as logoutApi,
  refreshToken as refreshTokenApi,
  requestOtp as requestOtpApi,
  signUp as signUpApi,
  verifyOtp as verifyOtpApi,
} from '../api/auth';
import { setUnauthorizedHandler } from '../api/client';
import {
  clearAllSessionData,
  clearSession,
  getLoginHint,
  getRefreshToken,
  getSession,
  saveSession,
  type StoredSession,
} from '../lib/auth-storage';
import { getErrorMessage } from '../api/client';
import type { LoginMethod } from '../types/api';

export type AuthIdentity = {
  name?: string;
  email?: string;
  phoneNumber?: string;
  loginMethod: LoginMethod;
};

type AuthContextValue = {
  session: StoredSession | null;
  loading: boolean;
  isAuthenticated: boolean;
  signUp: (identity: AuthIdentity) => Promise<void>;
  requestOtp: (identity: AuthIdentity) => Promise<void>;
  signInWithRefresh: (identity: AuthIdentity) => Promise<boolean>;
  verifyOtp: (identity: AuthIdentity, otp: string) => Promise<void>;
  signOut: () => Promise<void>;
  fullSignOut: () => Promise<void>;
  refreshSession: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

function normalizePhone(value: string) {
  return value.replace(/\D/g, '');
}

function buildSignUpPayload(identity: AuthIdentity) {
  const method = identity.loginMethod;
  return {
    name: identity.name?.trim() || null,
    loginMethod: method,
    email: method === 'email' ? identity.email?.trim().toLowerCase() || null : null,
    phoneNumber: method === 'sms' ? normalizePhone(identity.phoneNumber || '') || null : null,
  };
}

function buildVerifyPayload(identity: AuthIdentity, otp: string) {
  const method = identity.loginMethod;
  return {
    loginMethod: method,
    otp,
    email: method === 'email' ? identity.email?.trim().toLowerCase() || null : null,
    phoneNumber: method === 'sms' ? normalizePhone(identity.phoneNumber || '') || null : null,
  };
}

function identityKey(identity: AuthIdentity) {
  if (identity.loginMethod === 'sms') {
    return normalizePhone(identity.phoneNumber || '');
  }
  return (identity.email || '').trim().toLowerCase();
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<StoredSession | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshSession = useCallback(async () => {
    const stored = await getSession();
    if (!stored) {
      setSession(null);
      return;
    }

    const accessTokenExpiresOn = stored.accessTokenExpiresOn;
    const accessTokenExpired =
      accessTokenExpiresOn == null
        ? true
        : (() => {
            const t = Date.parse(accessTokenExpiresOn);
            if (!Number.isFinite(t)) return true;
            return t <= Date.now() + 10_000;
          })();

    if (!stored.accessToken || accessTokenExpired) {
      try {
        const result = await refreshTokenApi({
          refreshToken: stored.refreshToken ?? null,
        });

        if (result.isSuccess && result.data?.accessToken) {
          const next: StoredSession = {
            ...stored,
            accessToken: result.data.accessToken,
            refreshToken: result.data.refreshToken ?? null,
            accessTokenExpiresOn: result.data.accessTokenExpiresOn,
          };
          await saveSession(next);
          setSession(next);
          return;
        }
      } catch {
        // fall through
      }

      try {
        await logoutApi({ refreshToken: stored.refreshToken ?? null });
      } catch {
        // backend logout can fail; local clear is still needed
      }
      await clearSession();
      setSession(null);
      return;
    }

    setSession(stored);
  }, []);

  const signOut = useCallback(async () => {
    await clearSession();
    setSession(null);
  }, []);

  const fullSignOut = useCallback(async () => {
    const stored = await getSession();
    const refreshToken = stored?.refreshToken ?? (await getRefreshToken());
    try {
      await logoutApi({ refreshToken: refreshToken ?? null });
    } catch {
      // ignore; we still clear local session
    }
    await clearAllSessionData();
    setSession(null);
  }, []);

  const signInWithRefresh = useCallback(async (identity: AuthIdentity): Promise<boolean> => {
    const hint = await getLoginHint();
    const refreshToken = await getRefreshToken();
    if (!refreshToken) return false;

    const key = identityKey(identity);
    const hintKey =
      identity.loginMethod === 'sms'
        ? normalizePhone(hint.phoneNumber || '')
        : (hint.email || '').toLowerCase();

    if (!key || hintKey !== key) return false;
    if (hint.loginMethod && hint.loginMethod !== identity.loginMethod) return false;

    try {
      const result = await refreshTokenApi({ refreshToken });
      if (!result.isSuccess || !result.data?.accessToken) {
        return false;
      }

      const next: StoredSession = {
        accessToken: result.data.accessToken,
        refreshToken: result.data.refreshToken ?? refreshToken,
        accessTokenExpiresOn: result.data.accessTokenExpiresOn,
        email: identity.loginMethod === 'email' ? identity.email?.trim().toLowerCase() : hint.email,
        phoneNumber:
          identity.loginMethod === 'sms'
            ? normalizePhone(identity.phoneNumber || '')
            : hint.phoneNumber,
        loginMethod: identity.loginMethod,
        name: identity.name?.trim() || hint.name || null,
      };
      await saveSession(next);
      setSession(next);
      return true;
    } catch {
      return false;
    }
  }, []);

  useEffect(() => {
    refreshSession().finally(() => setLoading(false));
    setUnauthorizedHandler(() => {
      setSession(null);
    });
    return () => setUnauthorizedHandler(null);
  }, [refreshSession]);

  const signUp = useCallback(async (identity: AuthIdentity) => {
    const result = await signUpApi(buildSignUpPayload(identity));
    if (!result.isSuccess) {
      throw new Error(result.message || 'Registration failed');
    }
  }, []);

  const requestOtp = useCallback(async (identity: AuthIdentity) => {
    const result = await requestOtpApi(buildSignUpPayload(identity));
    if (!result.isSuccess) {
      throw new Error(result.message || 'Could not send verification code');
    }
  }, []);

  const verifyOtp = useCallback(async (identity: AuthIdentity, otp: string) => {
    const result = await verifyOtpApi(buildVerifyPayload(identity, otp));
    if (!result.isSuccess || !result.data?.accessToken) {
      throw new Error(result.message || 'OTP verification failed');
    }
    const next: StoredSession = {
      accessToken: result.data.accessToken,
      refreshToken: result.data.refreshToken,
      accessTokenExpiresOn: result.data.accessTokenExpiresOn,
      email: identity.loginMethod === 'email' ? identity.email?.trim().toLowerCase() : null,
      phoneNumber:
        identity.loginMethod === 'sms' ? normalizePhone(identity.phoneNumber || '') : null,
      loginMethod: identity.loginMethod,
      name: identity.name?.trim() || null,
    };
    await saveSession(next);
    setSession(next);
  }, []);

  const value = useMemo(
    () => ({
      session,
      loading,
      isAuthenticated: !!session?.accessToken,
      signUp,
      requestOtp,
      signInWithRefresh,
      verifyOtp,
      signOut,
      fullSignOut,
      refreshSession,
    }),
    [session, loading, signUp, requestOtp, signInWithRefresh, verifyOtp, signOut, fullSignOut, refreshSession],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

export { getErrorMessage };
