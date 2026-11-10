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
import { RideMap } from '../../../src/components/RideMap';
import { getErrorMessage } from '../../../src/api/client';
import { cancelRide, getCurrentRide, getRideById } from '../../../src/api/rides';
import { RateRide } from '../../../src/components/RateRide';
import { useRideRealtime } from '../../../src/hooks/useRideRealtime';
import type { GetCurrentRideResponse, GetRideByIdResponse } from '../../../src/types/api';
import { isChatEnabled, RideStatus, RideStatusLabel } from '../../../src/types/enums';
import { useResponsive } from '../../../src/hooks/useResponsive';
import { colors } from '../../../src/theme/colors';
import { useTypography } from '../../../src/theme/typography';

type Ride = GetCurrentRideResponse | GetRideByIdResponse;

export default function TrackingScreen() {
  const { rideId } = useLocalSearchParams<{ rideId?: string }>();
  const router = useRouter();
  const type = useTypography();
  const { spacing, radius } = useResponsive();
  const [ride, setRide] = useState<Ride | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const rememberedRideId = useRef<string | undefined>(
    typeof rideId === 'string' ? rideId : undefined,
  );

  const styles = useMemo(
    () =>
      StyleSheet.create({
        root: { flex: 1, backgroundColor: colors.mapMid },
        metaRow: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.sm },
        meta: {
          flex: 1,
          borderWidth: 1.5,
          borderColor: colors.border,
          borderRadius: radius.md,
          padding: spacing.md,
          backgroundColor: colors.surface,
        },
        actions: { gap: spacing.sm, marginTop: spacing.sm },
        row: { flexDirection: 'row', gap: spacing.sm },
      }),
    [spacing, radius],
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
      setError(getErrorMessage(e, 'Could not load ride'));
    } finally {
      setLoading(false);
    }
  }, [rideId]);

  const onRideCancelled = useCallback(() => {
    setError('This ride was cancelled.');
    void load();
  }, [load]);

  const {
    connected,
    driverLocation,
    liveStatusId,
  } = useRideRealtime({
    rideId: ride?.id ?? (typeof rideId === 'string' ? rideId : undefined),
    enabled: !!rideId || !!ride?.id,
    onRideUpdated: load,
    onRideAccepted: load,
    onRideCancelled,
  });

  useEffect(() => {
    load();
    // Fallback poll — SignalR is primary for status/location
    const id = setInterval(load, 12000);
    return () => clearInterval(id);
  }, [load]);

  useEffect(() => {
    if (liveStatusId == null || !ride) return;
    if (ride.rideStatusId !== liveStatusId) {
      setRide({ ...ride, rideStatusId: liveStatusId });
    }
  }, [liveStatusId, ride]);

  async function onCancel() {
    if (!ride) return;
    setActionLoading(true);
    setError(null);
    try {
      const result = await cancelRide({
        rideId: ride.id,
        cancellationReason: 'Cancelled by passenger from app',
      });
      if (!result.isSuccess) throw new Error(result.message || 'Cancel failed');
      await load();
    } catch (e) {
      setError(getErrorMessage(e, 'Could not cancel ride'));
    } finally {
      setActionLoading(false);
    }
  }

  const effectiveStatus = (liveStatusId ?? ride?.rideStatusId) as RideStatus | undefined;
  const statusLabel =
    effectiveStatus != null
      ? RideStatusLabel[effectiveStatus] ?? `Status ${effectiveStatus}`
      : '';

  const canCancel =
    !!ride &&
    [
      RideStatus.Searching,
      RideStatus.Accepted,
      RideStatus.DriverArriving,
      RideStatus.DriverArrived,
    ].includes(ride.rideStatusId);

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

  return (
    <View style={styles.root}>
      <RideMap
        pickup={pickup}
        destination={destination}
        driver={driverLocation}
        showUserLocation
        connected={connected}
        statusLabel={statusLabel || 'Live trip'}
      />
      <BottomSheet>
        <Label>Live trip</Label>
        {loading && !ride ? (
          <LoadingBlock label="Loading ride…" />
        ) : !ride ? (
          <>
            <Text style={[type.h1, { marginTop: spacing.xs, fontSize: 24 }]}>No active ride</Text>
            <ErrorBanner message={error} />
            <PrimaryButton
              title="Book a ride"
              onPress={() => router.replace('/(app)/passenger/book')}
            />
          </>
        ) : (
          <>
            <Text style={[type.h1, { marginTop: spacing.xs, fontSize: 24 }]}>{statusLabel}</Text>
            <Text style={[type.body, { marginTop: spacing.sm, marginBottom: spacing.md }]}>
              {ride.pickupAddress || 'Pickup'} → {ride.destinationAddress || 'Destination'}
            </Text>
            {!canChat ? (
              <Text style={[type.caption, { marginBottom: spacing.sm }]}>
                Chat unlocks when a driver accepts your ride.
              </Text>
            ) : null}
            <View style={styles.metaRow}>
              <Meta
                label="Fare"
                value={`R${ride.proposedFare ?? ride.estimatedFare ?? ride.finalFare ?? '—'}`}
              />
              <Meta label="Ride ID" value={ride.id.slice(0, 8)} />
            </View>
            <ErrorBanner message={error} />
            <View style={styles.actions}>
              {canChat ? (
                <View style={styles.row}>
                  <View style={{ flex: 1 }}>
                    <PrimaryButton
                      title="Chat with driver"
                      onPress={() =>
                        router.push(
                          `/(app)/chat?rideId=${encodeURIComponent(ride.id)}` as Href,
                        )
                      }
                    />
                  </View>
                </View>
              ) : null}
              <SoftButton title="Refresh" onPress={load} />
              {effectiveStatus === RideStatus.Completed ? (
                <RateRide rideId={ride.id} target="driver" />
              ) : null}
              {canCancel ? (
                <PrimaryButton
                  title="Cancel ride"
                  onPress={onCancel}
                  loading={actionLoading}
                />
              ) : null}
              <SoftButton
                title="Back to home"
                onPress={() => router.replace('/(app)/passenger')}
              />
            </View>
          </>
        )}
      </BottomSheet>
    </View>
  );
}

function Meta({ label, value }: { label: string; value: string }) {
  const type = useTypography();
  const { spacing, radius } = useResponsive();

  return (
    <View
      style={{
        flex: 1,
        borderWidth: 1.5,
        borderColor: colors.border,
        borderRadius: radius.md,
        padding: spacing.md,
        backgroundColor: colors.greenSoft,
      }}
    >
      <Text style={[type.eyebrow, { fontSize: 9, color: colors.textMuted }]}>{label}</Text>
      <Text style={[type.h3, { marginTop: 4, color: colors.charcoal }]}>{value}</Text>
    </View>
  );
}
