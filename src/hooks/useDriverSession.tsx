import * as Location from 'expo-location';
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { getErrorMessage } from '../api/client';
import { getDriverOnboardingStatus, getDriverProfile } from '../api/driver';
import { updateDriverLocation, updateOnlineStatus } from '../api/rides';
import type {
  GetDriverOnboardingStatusResponse,
  GetDriverProfileByIdResponse,
} from '../types/api';

/** Best-effort GPS publish. Must be called AFTER driver is online. */
async function pushCurrentLocationBestEffort() {
  try {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') return;
    const pos = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.Balanced,
    });
    await updateDriverLocation({
      latitude: pos.coords.latitude,
      longitude: pos.coords.longitude,
    });
  } catch {
    // Location is optional after online — don't fail the online toggle
  }
}

type DriverSessionValue = {
  profile: GetDriverProfileByIdResponse | null;
  onboarding: GetDriverOnboardingStatusResponse | null;
  loading: boolean;
  toggling: boolean;
  error: string | null;
  setError: (msg: string | null) => void;
  load: () => Promise<void>;
  setOnline: (next: boolean) => Promise<void>;
  toggleOnline: () => Promise<void>;
  isOnline: boolean;
  isReady: boolean;
};

const DriverSessionContext = createContext<DriverSessionValue | null>(null);

export function DriverSessionProvider({ children }: { children: React.ReactNode }) {
  const [profile, setProfile] = useState<GetDriverProfileByIdResponse | null>(null);
  const [onboarding, setOnboarding] =
    useState<GetDriverOnboardingStatusResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [localOnline, setLocalOnline] = useState(false);
  const autoOnlineTried = useRef(false);

  const load = useCallback(async () => {
    setError(null);
    setLoading(true);
    try {
      const status = await getDriverOnboardingStatus();
      setOnboarding(status);
      if (status.isDriverRegistered) {
        const p = await getDriverProfile();
        setProfile(p);
        setLocalOnline(!!p.isOnline);
      } else {
        setProfile(null);
        setLocalOnline(false);
      }
    } catch (e) {
      setError(getErrorMessage(e, 'Could not load driver status'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  /**
   * Backend rule: location updates require online status.
   * So we MUST call online-status first, then location.
   */
  const setOnline = useCallback(async (next: boolean) => {
    setToggling(true);
    setError(null);
    setLocalOnline(next);

    try {
      const result = await updateOnlineStatus({ isOnline: next });
      if (!result.isSuccess) {
        throw new Error(result.message || (next ? 'Failed to go online' : 'Failed to go offline'));
      }

      if (next) {
        await pushCurrentLocationBestEffort();
      }

      try {
        const p = await getDriverProfile();
        setProfile(p);
        setLocalOnline(!!p.isOnline);
      } catch {
        setProfile((current) =>
          current ? { ...current, isOnline: next } : current,
        );
        setLocalOnline(next);
      }
    } catch (e) {
      setLocalOnline(!next);
      setError(getErrorMessage(e, 'Could not update online status'));
    } finally {
      setToggling(false);
    }
  }, []);

  // Default online once when driver is ready but currently offline
  useEffect(() => {
    if (autoOnlineTried.current || loading || toggling) return;
    const ready =
      !!onboarding?.isDriverRegistered && !!onboarding?.isComplete;
    if (!ready || localOnline || !profile) return;
    autoOnlineTried.current = true;
    void setOnline(true);
  }, [loading, toggling, onboarding, localOnline, profile, setOnline]);

  const toggleOnline = useCallback(async () => {
    await setOnline(!localOnline);
  }, [localOnline, setOnline]);

  const value = useMemo<DriverSessionValue>(
    () => ({
      profile,
      onboarding,
      loading,
      toggling,
      error,
      setError,
      load,
      setOnline,
      toggleOnline,
      isOnline: localOnline,
      isReady: !!onboarding?.isDriverRegistered && !!onboarding?.isComplete,
    }),
    [
      profile,
      onboarding,
      loading,
      toggling,
      error,
      load,
      setOnline,
      toggleOnline,
      localOnline,
    ],
  );

  return (
    <DriverSessionContext.Provider value={value}>
      {children}
    </DriverSessionContext.Provider>
  );
}

export function useDriverSession() {
  const ctx = useContext(DriverSessionContext);
  if (!ctx) {
    throw new Error('useDriverSession must be used within DriverSessionProvider');
  }
  return ctx;
}
