import { useRouter } from 'expo-router';
import { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { DriverShell } from '../../../../src/components/driver/DriverShell';
import { RideMap } from '../../../../src/components/RideMap';
import { ErrorBanner, PrimaryButton, SoftButton } from '../../../../src/components/ui';
import { useCurrentLocation } from '../../../../src/hooks/useCurrentLocation';
import { useDriverSession } from '../../../../src/hooks/useDriverSession';
import { useResponsive } from '../../../../src/hooks/useResponsive';
import { colors, shadows } from '../../../../src/theme/colors';
import { useTypography } from '../../../../src/theme/typography';

export default function DemandScreen() {
  const router = useRouter();
  const type = useTypography();
  const { spacing, horizontalPadding } = useResponsive();
  const { coords: myLocation, address } = useCurrentLocation(true);
  const { isOnline, isReady, error, toggling, toggleOnline } = useDriverSession();

  const styles = useMemo(
    () =>
      StyleSheet.create({
        root: { flex: 1 },
        mapWrap: { flex: 1 },
        legend: {
          position: 'absolute',
          left: horizontalPadding,
          bottom: spacing.lg,
          backgroundColor: colors.surfaceGlass,
          borderRadius: 18,
          borderWidth: 1.5,
          borderColor: colors.border,
          paddingHorizontal: spacing.md,
          paddingVertical: spacing.sm + 2,
          flexDirection: 'row',
          alignItems: 'center',
          gap: spacing.sm,
          ...shadows.md,
        },
        sheet: {
          backgroundColor: colors.surface,
          borderTopLeftRadius: 28,
          borderTopRightRadius: 28,
          borderTopWidth: 1.5,
          borderTopColor: colors.border,
          paddingHorizontal: horizontalPadding,
          paddingVertical: spacing.md,
          gap: spacing.sm,
          ...shadows.lg,
        },
      }),
    [spacing, horizontalPadding],
  );

  return (
    <DriverShell>
      <View style={styles.root}>
        <View style={styles.mapWrap}>
          <RideMap
            userLocation={myLocation}
            showUserLocation
            showRoute={false}
            connected={!!myLocation}
            statusLabel={
              isOnline
                ? address
                  ? `Online · ${address}`
                  : 'Online — watching demand'
                : 'Offline — go online to see demand'
            }
            showStatusChip={false}
          />
          <View style={styles.legend}>
            <Text style={type.caption}>Demand</Text>
            <Text style={[type.caption, { color: colors.gray }]}>Low</Text>
            <View
              style={{
                width: 48,
                height: 8,
                borderRadius: 4,
                backgroundColor: colors.greenLight,
                overflow: 'hidden',
              }}
            >
              <View
                style={{
                  width: isOnline ? '55%' : '15%',
                  height: '100%',
                  backgroundColor: colors.green,
                }}
              />
            </View>
            <Text style={[type.caption, { color: colors.gray }]}>High</Text>
          </View>
        </View>

        <View style={styles.sheet}>
          <ErrorBanner message={error} />
          {!isReady ? (
            <>
              <Text style={type.body}>Finish onboarding to go online on the map.</Text>
              <PrimaryButton
                title="Continue onboarding"
                onPress={() => router.push('/(app)/driver/onboarding')}
              />
            </>
          ) : (
            <>
              <Text style={type.h3}>
                {isOnline ? 'You are online' : 'You are offline'}
              </Text>
              <Text style={type.caption}>
                {isOnline
                  ? 'Hotter areas may mean more ride requests nearby.'
                  : 'Go online to appear on the demand map and receive requests.'}
              </Text>
              <PrimaryButton
                title={isOnline ? 'Go offline' : 'Go online'}
                onPress={() => void toggleOnline()}
                loading={toggling}
              />
              <SoftButton
                title="Open ride requests"
                onPress={() => router.push('/(app)/driver/(tabs)')}
              />
            </>
          )}
        </View>
      </View>
    </DriverShell>
  );
}
