import * as Location from 'expo-location';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import {
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { DriverShell } from '../../../../src/components/driver/DriverShell';
import {
  EmptyBlock,
  ErrorBanner,
  LoadingBlock,
  PrimaryButton,
  SoftButton,
} from '../../../../src/components/ui';
import { getErrorMessage } from '../../../../src/api/client';
import { getDriverProfile } from '../../../../src/api/driver';
import {
  acceptRide,
  getAvailableRides,
  updateDriverLocation,
  updateOnlineStatus,
} from '../../../../src/api/rides';
import type { GetAvailableRideResponse } from '../../../../src/types/api';
import { useDriverRideOffers } from '../../../../src/hooks/useDriverRideOffers';
import { useDriverSession } from '../../../../src/hooks/useDriverSession';
import { useResponsive } from '../../../../src/hooks/useResponsive';
import { colors, shadows } from '../../../../src/theme/colors';
import { useTypography } from '../../../../src/theme/typography';

async function ensureDriverReadyForOffers() {
  const profile = await getDriverProfile();
  // Online first — location API rejects offline drivers
  if (!profile.isOnline) {
    const result = await updateOnlineStatus({ isOnline: true });
    if (!result.isSuccess) {
      throw new Error(result.message || 'Could not go online');
    }
  }
  try {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status === 'granted') {
      const pos = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      await updateDriverLocation({
        latitude: pos.coords.latitude,
        longitude: pos.coords.longitude,
      });
    }
  } catch {
    // Location is best-effort once online
  }
  return true;
}

export default function RideRequestsScreen() {
  const router = useRouter();
  const { spacing, horizontalPadding, ms } = useResponsive();
  const type = useTypography();
  const { isReady, isOnline, load: reloadSession, setOnline, toggling } =
    useDriverSession();
  const [items, setItems] = useState<GetAvailableRideResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [acceptingId, setAcceptingId] = useState<string | null>(null);
  const [preparing, setPreparing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [focused, setFocused] = useState(false);
  const [offersOnline, setOffersOnline] = useState(true);

  const styles = useMemo(
    () =>
      StyleSheet.create({
        banner: {
          marginHorizontal: horizontalPadding,
          marginTop: spacing.sm,
          marginBottom: spacing.sm,
          backgroundColor: colors.warningBg,
          borderRadius: 18,
          borderWidth: 1.5,
          borderColor: 'rgba(232,163,23,0.35)',
          paddingVertical: spacing.md,
          paddingHorizontal: spacing.md,
          flexDirection: 'row',
          alignItems: 'center',
          gap: spacing.sm,
          ...shadows.sm,
        },
        list: {
          paddingHorizontal: horizontalPadding,
          paddingBottom: spacing.xl,
          flexGrow: 1,
        },
        card: {
          backgroundColor: colors.surface,
          borderRadius: 22,
          borderWidth: 1.5,
          borderColor: colors.border,
          padding: spacing.md,
          marginBottom: spacing.sm,
          ...shadows.md,
        },
        row: { flexDirection: 'row', gap: spacing.md },
        avatar: {
          width: 50,
          height: 50,
          borderRadius: 16,
          backgroundColor: colors.greenLight,
          borderWidth: 1.5,
          borderColor: 'rgba(0,184,92,0.28)',
          alignItems: 'center',
          justifyContent: 'center',
        },
        fare: {
          fontFamily: 'PlusJakartaSans_800ExtraBold',
          fontSize: ms(22),
          color: colors.green,
          letterSpacing: -0.5,
        },
        payBadge: {
          alignSelf: 'flex-start',
          marginTop: spacing.sm,
          backgroundColor: colors.greenMuted,
          paddingHorizontal: 10,
          paddingVertical: 5,
          borderRadius: 10,
        },
      }),
    [spacing, horizontalPadding, ms],
  );

  const load = useCallback(async (isRefresh = false) => {
    setError(null);
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    try {
      const data = await getAvailableRides();
      setItems(Array.isArray(data) ? data : []);
      setOffersOnline(true);
    } catch (e) {
      const msg = getErrorMessage(e, 'Could not load available rides');
      setError(msg);
      const lower = msg.toLowerCase();
      if (lower.includes('online') || lower.includes('offline') || lower.includes('location')) {
        setOffersOnline(false);
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  const prepareAndLoad = useCallback(async () => {
    setPreparing(true);
    setError(null);
    try {
      await ensureDriverReadyForOffers();
      setOffersOnline(true);
      await reloadSession();
      await load(true);
    } catch (e) {
      setOffersOnline(false);
      setError(getErrorMessage(e, 'Go online and share location to see rides'));
    } finally {
      setPreparing(false);
    }
  }, [load, reloadSession]);

  useDriverRideOffers({
    enabled: focused && offersOnline,
    onNewRideAvailable: () => void load(true),
    onRideUnavailable: (rideId) => {
      setItems((current) => current.filter((item) => item.id !== rideId));
    },
  });

  useFocusEffect(
    useCallback(() => {
      setFocused(true);
      if (isReady) void prepareAndLoad();
      else setLoading(false);
      const id = setInterval(() => {
        if (offersOnline) void load(true);
      }, 18000);
      return () => {
        setFocused(false);
        clearInterval(id);
      };
    }, [prepareAndLoad, load, isReady, offersOnline]),
  );

  async function onAccept(rideId: string) {
    setAcceptingId(rideId);
    setError(null);
    try {
      const result = await acceptRide({ rideId });
      if (!result.isSuccess) throw new Error(result.message || 'Accept failed');
      router.push({
        pathname: '/(app)/driver/active',
        params: { rideId },
      });
    } catch (e) {
      setError(getErrorMessage(e, 'Could not accept ride'));
    } finally {
      setAcceptingId(null);
    }
  }

  return (
    <DriverShell>
      {!isOnline ? (
        <Pressable
          style={styles.banner}
          onPress={() => {
            if (!isReady) {
              router.push('/(app)/driver/onboarding');
              return;
            }
            void setOnline(true);
          }}
        >
          <Text style={{ fontSize: 16 }}>◈</Text>
          <Text style={[type.h3, { flex: 1 }]}>
            {isReady
              ? toggling
                ? 'Going online…'
                : 'You are offline — tap to go online'
              : 'Finish onboarding to receive rides'}
          </Text>
          <Text style={{ color: colors.gray }}>›</Text>
        </Pressable>
      ) : null}

      <View style={{ paddingHorizontal: horizontalPadding }}>
        <ErrorBanner message={error} />
      </View>

      {!isReady ? (
        <View style={{ padding: horizontalPadding, gap: spacing.sm }}>
          <Text style={type.body}>Complete driver registration before accepting rides.</Text>
          <PrimaryButton
            title="Continue onboarding"
            onPress={() => router.push('/(app)/driver/onboarding')}
          />
        </View>
      ) : loading || preparing ? (
        <LoadingBlock label={preparing ? 'Going online…' : 'Looking for rides…'} />
      ) : (
        <FlatList
          data={items}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => void prepareAndLoad()}
              tintColor={colors.green}
            />
          }
          ListEmptyComponent={
            <EmptyBlock
              title="No ride requests"
              message="Stay online nearby — new requests appear here automatically."
            />
          }
          renderItem={({ item }) => {
            const fare = item.proposedFare ?? item.estimatedFare;
            return (
              <Pressable
                style={({ pressed }) => [
                  styles.card,
                  pressed && { borderColor: colors.green, transform: [{ scale: 0.99 }] },
                ]}
                onPress={() => onAccept(item.id)}
              >
                <View style={styles.row}>
                  <View style={styles.avatar}>
                    <View
                      style={{
                        width: 12,
                        height: 12,
                        borderRadius: 6,
                        backgroundColor: colors.green,
                      }}
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <View
                      style={{
                        flexDirection: 'row',
                        justifyContent: 'space-between',
                        alignItems: 'baseline',
                        gap: spacing.sm,
                      }}
                    >
                      {item.estimatedDistanceKm != null ? (
                        <Text style={type.caption}>
                          ~{item.estimatedDistanceKm.toFixed(1)} km
                        </Text>
                      ) : (
                        <Text style={type.caption}>Nearby</Text>
                      )}
                      <Text style={styles.fare}>R{fare ?? '—'}</Text>
                    </View>
                    <Text style={[type.h3, { marginTop: 4 }]} numberOfLines={1}>
                      {item.pickupAddress || 'Pickup'}
                    </Text>
                    <Text style={[type.body, { marginTop: 2 }]} numberOfLines={1}>
                      {item.destinationAddress || 'Destination'}
                    </Text>
                    <View style={styles.payBadge}>
                      <Text
                        style={{
                          color: colors.green,
                          fontSize: 11,
                          fontFamily: 'PlusJakartaSans_700Bold',
                          letterSpacing: 0.4,
                        }}
                      >
                        EV RIDE
                      </Text>
                    </View>
                  </View>
                </View>
                <View style={{ marginTop: spacing.sm }}>
                  <SoftButton
                    title={acceptingId === item.id ? 'Accepting…' : 'Accept ride'}
                    onPress={() => onAccept(item.id)}
                    loading={acceptingId === item.id}
                  />
                </View>
              </Pressable>
            );
          }}
        />
      )}
    </DriverShell>
  );
}
