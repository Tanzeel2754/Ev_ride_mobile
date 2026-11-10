import { useLocalSearchParams, useRouter, type Href } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import {
  BottomSheet,
  ErrorBanner,
  Label,
  LoadingBlock,
  PrimaryButton,
  SoftButton,
} from '../../../src/components/ui';
import { RateRide } from '../../../src/components/RateRide';
import { RideMap } from '../../../src/components/RideMap';
import { getErrorMessage } from '../../../src/api/client';
import {
  completeRide,
  driverCancelRide,
  getCurrentRide,
  getRideById,
  markArrived,
  markArriving,
  startRide,
} from '../../../src/api/rides';
import { useDriverLocationPublisher } from '../../../src/hooks/useDriverLocationPublisher';
import { useRideRealtime } from '../../../src/hooks/useRideRealtime';
import type { GetCurrentRideResponse, GetRideByIdResponse } from '../../../src/types/api';
import { isChatEnabled, RideStatus, RideStatusLabel } from '../../../src/types/enums';
import { useResponsive } from '../../../src/hooks/useResponsive';
import { colors } from '../../../src/theme/colors';
import { useTypography } from '../../../src/theme/typography';

type Ride = GetCurrentRideResponse | GetRideByIdResponse;

const ACTIVE_FOR_LOCATION: RideStatus[] = [
  RideStatus.Accepted,
  RideStatus.DriverArriving,
  RideStatus.DriverArrived,
  RideStatus.InProgress,
];

export default function DriverActiveRideScreen() {
  const { rideId } = useLocalSearchParams<{ rideId?: string }>();
  const router = useRouter();
  const { spacing, ms } = useResponsive();
  const type = useTypography();
  const [ride, setRide] = useState<Ride | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const rememberedRideId = useRef<string | undefined>(
    typeof rideId === 'string' ? rideId : undefined,
  );

  const styles = useMemo(
    () =>
      StyleSheet.create({
        root: { flex: 1, backgroundColor: colors.mapMid },
        actions: { gap: spacing.sm, marginTop: spacing.sm },
      }),
    [spacing],
  );

  const load = useCallback(async () => {
    setError(null);
    try {
      const id =
        (typeof rideId === 'string' ? rideId : undefined) || rememberedRideId.current;
      let data: Ride | null = null;
      if (id) {
        try {
          data = await getRideById(id);
        } catch {
          data = (await getCurrentRide()) ?? null;
        }
      } else {
        data = (await getCurrentRide()) ?? null;
      }
      if (data?.id) rememberedRideId.current = data.id;
      setRide((current) => data ?? current);
    } catch (e) {
      setError(getErrorMessage(e, 'Could not load active ride'));
    } finally {
      setLoading(false);
    }
  }, [rideId]);

  const status = ride?.rideStatusId as RideStatus | undefined;
  const publishLocation =
    !!ride && status != null && ACTIVE_FOR_LOCATION.includes(status);

  const { lastLocation, error: locationError } = useDriverLocationPublisher({
    enabled: publishLocation,
  });

  const onRideCancelled = useCallback(() => {
    setError('This ride was cancelled by the passenger.');
    void load();
  }, [load]);

  const { connected, driverLocation, setDriverLocation, liveStatusId } =
    useRideRealtime({
      rideId: ride?.id ?? (typeof rideId === 'string' ? rideId : undefined),
      enabled: !!ride?.id || !!rideId,
      onRideUpdated: load,
      onRideCancelled,
    });

  useEffect(() => {
    if (lastLocation) setDriverLocation(lastLocation);
  }, [lastLocation, setDriverLocation]);

  useEffect(() => {
    load();
    const id = setInterval(load, 12000);
    return () => clearInterval(id);
  }, [load]);

  useEffect(() => {
    if (liveStatusId == null || !ride) return;
    if (ride.rideStatusId !== liveStatusId) {
      setRide({ ...ride, rideStatusId: liveStatusId });
    }
  }, [liveStatusId, ride]);

  async function runAction(fn: () => Promise<{ isSuccess: boolean; message?: string | null }>) {
    if (!ride) return;
    setBusy(true);
    setError(null);
    try {
      const result = await fn();
      if (!result.isSuccess) throw new Error(result.message || 'Action failed');
      await load();
    } catch (e) {
      setError(getErrorMessage(e, 'Action failed'));
    } finally {
      setBusy(false);
    }
  }

  const effectiveStatus = (liveStatusId ?? status) as RideStatus | undefined;
  const fare = ride?.proposedFare ?? ride?.estimatedFare ?? ride?.finalFare ?? 0;
  const canChat = !!ride && isChatEnabled(effectiveStatus ?? ride.rideStatusId);

  const pickup =
    ride != null
      ? { latitude: ride.pickupLatitude, longitude: ride.pickupLongitude }
      : null;
  const destination =
    ride != null
      ? {
          latitude: ride.destinationLatitude,
          longitude: ride.destinationLongitude,
        }
      : null;
  const mapDriver = lastLocation ?? driverLocation;

  if (loading && !ride) {
    return (
      <View style={styles.root}>
        <LoadingBlock label="Loading active ride…" />
      </View>
    );
  }

  if (!ride) {
    return (
      <View style={[styles.root, { padding: spacing.lg }]}>
        <Text style={type.h2}>No active ride</Text>
        <ErrorBanner message={error} />
        <View style={{ marginTop: spacing.md, gap: spacing.sm }}>
          <PrimaryButton
            title="Browse available rides"
            onPress={() => router.replace('/(app)/driver/(tabs)')}
          />
          <SoftButton title="Back" onPress={() => router.back()} />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <RideMap
        pickup={pickup}
        destination={destination}
        driver={mapDriver}
        connected={connected}
        statusLabel={
          RideStatusLabel[effectiveStatus as RideStatus] ??
          `Status ${ride.rideStatusId}`
        }
      />
      <BottomSheet>
        <Label>Active trip</Label>
        <Text style={[type.h2, { marginTop: spacing.xs }]}>
          {RideStatusLabel[effectiveStatus as RideStatus] ??
            `Status ${ride.rideStatusId}`}
        </Text>
        <Text style={[type.body, { marginTop: spacing.sm }]}>
          {ride.pickupAddress || 'Pickup'} → {ride.destinationAddress || 'Destination'}
        </Text>
        <Text
          style={[
            type.hero,
            { fontSize: ms(28), color: colors.green, marginTop: spacing.sm },
          ]}
        >
          R{fare}
        </Text>
        {publishLocation ? (
          <Text style={[type.caption, { marginTop: spacing.xs }]}>
            Sharing live location with passenger
            {mapDriver
              ? ` · ${mapDriver.latitude.toFixed(4)}, ${mapDriver.longitude.toFixed(4)}`
              : ''}
          </Text>
        ) : null}
        <ErrorBanner message={error || locationError} />

        <View style={styles.actions}>
          {canChat ? (
            <PrimaryButton
              title="Chat with passenger"
              onPress={() =>
                router.push(
                  `/(app)/chat?rideId=${encodeURIComponent(ride.id)}` as Href,
                )
              }
            />
          ) : null}
          {effectiveStatus === RideStatus.Accepted ? (
            <PrimaryButton
              title="Mark arriving"
              loading={busy}
              onPress={() => runAction(() => markArriving({ rideId: ride.id }))}
            />
          ) : null}
          {effectiveStatus === RideStatus.DriverArriving ? (
            <PrimaryButton
              title="Mark arrived"
              loading={busy}
              onPress={() => runAction(() => markArrived({ rideId: ride.id }))}
            />
          ) : null}
          {effectiveStatus === RideStatus.DriverArrived ? (
            <PrimaryButton
              title="Start ride"
              loading={busy}
              onPress={() => runAction(() => startRide({ rideId: ride.id }))}
            />
          ) : null}
          {effectiveStatus === RideStatus.Completed ? (
            <RateRide rideId={ride.id} target="rider" />
          ) : null}
          {effectiveStatus === RideStatus.InProgress ? (
            <PrimaryButton
              title="Complete ride"
              loading={busy}
              onPress={() =>
                runAction(async () => {
                  const result = await completeRide({
                    rideId: ride.id,
                    actualDistanceKm: 12,
                    actualDurationMinutes: 25,
                    finalFare: Number(fare) || 0,
                  });
                  if (result.isSuccess) {
                    setRide((current) =>
                      current
                        ? { ...current, rideStatusId: RideStatus.Completed }
                        : current,
                    );
                  }
                  return result;
                })
              }
            />
          ) : null}
          {[
            RideStatus.Accepted,
            RideStatus.DriverArriving,
            RideStatus.DriverArrived,
            RideStatus.InProgress,
          ].includes(effectiveStatus as RideStatus) ? (
            <SoftButton
              title="Cancel ride"
              onPress={() =>
                runAction(() =>
                  driverCancelRide({
                    rideId: ride.id,
                    cancellationReason: 'Cancelled by driver from app',
                  }),
                )
              }
            />
          ) : null}
          <SoftButton title="Refresh" onPress={load} />
        </View>
      </BottomSheet>
    </View>
  );
}
