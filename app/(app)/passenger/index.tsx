import { useFocusEffect, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useCallback, useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  BottomSheet,
  ErrorBanner,
  LoadingBlock,
  PrimaryButton,
} from '../../../src/components/ui';
import { DrawerMenu } from '../../../src/components/DrawerMenu';
import { RideMap } from '../../../src/components/RideMap';
import { getErrorMessage } from '../../../src/api/client';
import { getCurrentRide } from '../../../src/api/rides';
import { useAuth } from '../../../src/context/AuthContext';
import { useCurrentLocation } from '../../../src/hooks/useCurrentLocation';
import type { GetCurrentRideResponse } from '../../../src/types/api';
import { RideStatus, RideStatusLabel } from '../../../src/types/enums';
import { useResponsive } from '../../../src/hooks/useResponsive';
import { colors, shadows } from '../../../src/theme/colors';
import { useTypography } from '../../../src/theme/typography';

export default function PassengerHome() {
  const router = useRouter();
  const { session } = useAuth();
  const insets = useSafeAreaInsets();
  const type = useTypography();
  const { spacing, scale, radius, horizontalPadding } = useResponsive();
  const [ride, setRide] = useState<GetCurrentRideResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);

  const {
    coords: myLocation,
    address: myAddress,
    error: locationError,
    permissionDenied,
    refresh: refreshLocation,
  } = useCurrentLocation(true);

  const styles = useMemo(
    () =>
      StyleSheet.create({
        root: { flex: 1, backgroundColor: colors.mapMid },
        statusBarFill: {
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: insets.top,
          backgroundColor: '#000000',
          zIndex: 6,
        },
        menuBtn: {
          position: 'absolute',
          top: insets.top + spacing.sm,
          left: horizontalPadding,
          width: scale(48),
          height: scale(48),
          borderRadius: scale(16),
          borderWidth: 1.5,
          borderColor: colors.border,
          backgroundColor: colors.surface,
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 5,
          ...shadows.md,
        },
        menuLines: {
          width: 18,
          gap: 3.5,
        },
        menuLine: {
          height: 2.5,
          borderRadius: 2,
          backgroundColor: colors.charcoal,
          width: '100%',
        },
        sheetHeader: {
          flexDirection: 'row',
          alignItems: 'flex-end',
          justifyContent: 'space-between',
          marginBottom: spacing.md,
        },
        chips: {
          flexDirection: 'row',
          gap: spacing.sm,
          marginBottom: spacing.md,
        },
        chip: {
          flex: 1,
          borderRadius: radius.lg,
          padding: spacing.md,
          minHeight: scale(88),
          overflow: 'hidden',
          borderWidth: 1.5,
          borderColor: colors.border,
          ...shadows.sm,
        },
        chipIcon: {
          width: scale(36),
          height: scale(36),
          borderRadius: 12,
          backgroundColor: colors.greenLight,
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: spacing.xs,
        },
        destCard: {
          flexDirection: 'row',
          alignItems: 'center',
          gap: spacing.md,
          backgroundColor: colors.surface,
          borderRadius: radius.lg,
          padding: spacing.md,
          marginBottom: spacing.md,
          borderWidth: 1.5,
          borderColor: colors.border,
          ...shadows.sm,
        },
        nav: {
          flexDirection: 'row',
          justifyContent: 'space-around',
          alignItems: 'center',
          paddingTop: spacing.md,
          paddingBottom: Math.max(insets.bottom, spacing.sm),
          marginTop: spacing.sm,
          borderTopWidth: 1,
          borderTopColor: colors.borderSoft,
        },
        navItem: { alignItems: 'center', gap: 6, minWidth: 64 },
        navDot: {
          width: 6,
          height: 6,
          borderRadius: 3,
          backgroundColor: colors.green,
        },
        navIdleDot: {
          width: 6,
          height: 6,
          borderRadius: 3,
          backgroundColor: 'transparent',
        },
      }),
    [spacing, scale, radius, horizontalPadding, insets.top, insets.bottom],
  );

  const load = useCallback(async () => {
    setError(null);
    setLoading(true);
    try {
      const current = await getCurrentRide();
      setRide(current ?? null);
    } catch (e) {
      const msg = getErrorMessage(e);
      if ((e as { status?: number })?.status === 404) {
        setRide(null);
      } else {
        setError(msg);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
      void refreshLocation();
    }, [load, refreshLocation]),
  );

  const active =
    ride &&
    ![
      RideStatus.Completed,
      RideStatus.CancelledByPassenger,
      RideStatus.CancelledByDriver,
      RideStatus.NoDriverAvailable,
    ].includes(ride.rideStatusId);

  const statusLabel = myLocation
    ? myAddress || 'You are here'
    : permissionDenied
      ? 'Location permission needed'
      : locationError
        ? 'Locating…'
        : 'Finding you…';

  const menuItems = useMemo(
    () => [
      {
        key: 'book',
        label: 'Book a ride',
        subtitle: 'Plan pickup & fare',
        onPress: () => router.push('/(app)/passenger/book'),
      },
      {
        key: 'history',
        label: 'Ride history',
        subtitle: 'Past trips & receipts',
        onPress: () => router.push('/(app)/passenger/history'),
      },
      {
        key: 'profile',
        label: 'Profile',
        subtitle: session?.name || session?.email || 'Your account',
        onPress: () => router.push('/(app)/passenger/profile'),
      },
      {
        key: 'contact',
        label: 'Help & support',
        subtitle: 'Contact us',
        onPress: () => router.push('/(app)/contact'),
      },
      {
        key: 'settings',
        label: 'Settings',
        subtitle: 'Alerts & account',
        onPress: () => router.push('/(app)/settings'),
      },
      {
        key: 'driver',
        label: 'Driver mode',
        subtitle: 'Switch to driving',
        onPress: () => router.push('/(app)/driver'),
      },
    ],
    [router, session?.email, session?.name],
  );

  return (
    <View style={styles.root}>
      <StatusBar style="light" />
      <View style={styles.statusBarFill} />

      <RideMap
        userLocation={myLocation}
        showUserLocation
        showRoute={false}
        connected={!!myLocation}
        statusLabel={statusLabel}
        showStatusChip={false}
      />

      <Pressable
        style={styles.menuBtn}
        onPress={() => setMenuOpen(true)}
        hitSlop={8}
        accessibilityRole="button"
        accessibilityLabel="Open menu"
      >
        <View style={styles.menuLines}>
          <View style={styles.menuLine} />
          <View style={[styles.menuLine, { width: '70%' }]} />
          <View style={[styles.menuLine, { width: '85%' }]} />
        </View>
      </Pressable>

      <DrawerMenu
        visible={menuOpen}
        onClose={() => setMenuOpen(false)}
        title="Menu"
        subtitle={session?.name || session?.email || 'Passenger'}
        items={menuItems}
      />

      <BottomSheet compact>
        <View style={styles.sheetHeader}>
          <View>
            <Text style={type.eyebrow}>EV Ride</Text>
            <Text style={[type.h1, { marginTop: 2 }]}>Where to?</Text>
          </View>
          <Pressable onPress={() => router.push('/(app)/passenger/book')}>
            <Text
              style={[
                type.caption,
                { color: colors.green, fontFamily: 'PlusJakartaSans_700Bold', fontSize: 13 },
              ]}
            >
              Customize
            </Text>
          </Pressable>
        </View>

        <ErrorBanner message={error} />
        {permissionDenied ? (
          <Text style={[type.caption, { color: colors.warning, marginBottom: spacing.sm }]}>
            Enable location to see yourself on the map.
          </Text>
        ) : null}

        {loading ? (
          <View style={{ height: scale(120) }}>
            <LoadingBlock label="Checking current ride…" />
          </View>
        ) : active && ride ? (
          <View style={{ gap: spacing.sm, marginBottom: spacing.md }}>
            <Text style={[type.caption, { color: colors.green }]}>Active ride</Text>
            <Text style={type.h2}>
              {RideStatusLabel[ride.rideStatusId as RideStatus] ??
                `Status ${ride.rideStatusId}`}
            </Text>
            <Text style={type.body}>
              {ride.pickupAddress || 'Pickup'} → {ride.destinationAddress || 'Destination'}
            </Text>
            <PrimaryButton
              title="Open live trip"
              onPress={() =>
                router.push({
                  pathname: '/(app)/passenger/tracking',
                  params: { rideId: ride.id },
                })
              }
            />
          </View>
        ) : (
          <>
            <Pressable
              style={styles.destCard}
              onPress={() => router.push('/(app)/passenger/book')}
            >
              <View style={styles.chipIcon}>
                <Text style={{ color: colors.green, fontFamily: 'PlusJakartaSans_800ExtraBold' }}>
                  →
                </Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={type.h3}>Book electric ride</Text>
                <Text style={[type.caption, { marginTop: 2 }]}>
                  {myAddress ? `From ${myAddress}` : 'Zero emissions · Clear fares in RWF'}
                </Text>
              </View>
            </Pressable>

            <View style={styles.chips}>
              <Pressable
                style={styles.chip}
                onPress={() => router.push('/(app)/passenger/book')}
              >
                <View
                  style={[StyleSheet.absoluteFill, { backgroundColor: colors.greenLight }]}
                />
                <Text style={[type.eyebrow, { marginBottom: spacing.xs }]}>Ride now</Text>
                <Text style={type.h3}>Destination</Text>
                <Text style={[type.caption, { marginTop: 2 }]} numberOfLines={1}>
                  Enter where you are going
                </Text>
              </Pressable>
              <Pressable
                style={[styles.chip, { backgroundColor: colors.surface }]}
                onPress={() => router.push('/(app)/passenger/history')}
              >
                <Text style={[type.eyebrow, { marginBottom: spacing.xs, color: colors.cyan }]}>
                  Past trips
                </Text>
                <Text style={type.h3}>History</Text>
                <Text style={[type.caption, { marginTop: 2 }]}>Your ride log</Text>
              </Pressable>
            </View>
          </>
        )}

        <View style={styles.nav}>
          <Pressable style={styles.navItem}>
            <View style={styles.navDot} />
            <Text style={[type.caption, { color: colors.green, fontFamily: 'PlusJakartaSans_700Bold' }]}>
              Home
            </Text>
          </Pressable>
          <Pressable
            style={styles.navItem}
            onPress={() => router.push('/(app)/passenger/history')}
          >
            <View style={styles.navIdleDot} />
            <Text style={[type.caption, { color: colors.gray }]}>History</Text>
          </Pressable>
          <Pressable style={styles.navItem} onPress={() => router.push('/(app)/contact')}>
            <View style={styles.navIdleDot} />
            <Text style={[type.caption, { color: colors.gray }]}>Help</Text>
          </Pressable>
          <Pressable
            style={styles.navItem}
            onPress={() => router.push('/(app)/passenger/profile')}
          >
            <View style={styles.navIdleDot} />
            <Text style={[type.caption, { color: colors.gray }]}>Profile</Text>
          </Pressable>
        </View>
      </BottomSheet>
    </View>
  );
}
