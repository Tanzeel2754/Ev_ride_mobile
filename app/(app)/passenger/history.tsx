import { useCallback, useMemo, useState } from 'react';
import { FlatList, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect } from 'expo-router';
import {
  Card,
  EmptyBlock,
  ErrorBanner,
  LoadingBlock,
  Screen,
  SoftButton,
} from '../../../src/components/ui';
import { getErrorMessage } from '../../../src/api/client';
import { getRideHistory } from '../../../src/api/rides';
import { RateRide } from '../../../src/components/RateRide';
import type { GetRideHistoryResponse } from '../../../src/types/api';
import { RideStatus, RideStatusLabel } from '../../../src/types/enums';
import { useResponsive } from '../../../src/hooks/useResponsive';
import { colors } from '../../../src/theme/colors';
import { useTypography } from '../../../src/theme/typography';

export default function HistoryScreen() {
  const { spacing, horizontalPadding } = useResponsive();
  const type = useTypography();
  const [items, setItems] = useState<GetRideHistoryResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ratingRideId, setRatingRideId] = useState<string | null>(null);

  const styles = useMemo(
    () =>
      StyleSheet.create({
        list: { padding: horizontalPadding, flexGrow: 1 },
        row: {
          flexDirection: 'row',
          justifyContent: 'space-between',
          marginTop: spacing.sm,
        },
      }),
    [spacing, horizontalPadding],
  );

  const load = useCallback(async (isRefresh = false) => {
    setError(null);
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    try {
      const data = await getRideHistory();
      setItems(Array.isArray(data) ? data : []);
    } catch (e) {
      setError(getErrorMessage(e, 'Could not load history'));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  if (loading) {
    return (
      <Screen>
        <LoadingBlock label="Loading history…" />
      </Screen>
    );
  }

  return (
    <Screen style={{ paddingHorizontal: 0 }}>
      <View style={{ paddingHorizontal: horizontalPadding, marginBottom: spacing.sm }}>
        <Text style={type.eyebrow}>Your trips</Text>
        <Text style={[type.h1, { marginTop: 4 }]}>History</Text>
        <ErrorBanner message={error} />
      </View>
      <FlatList
        data={items}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => load(true)}
            tintColor={colors.green}
          />
        }
        ListEmptyComponent={
          <EmptyBlock
            title="No rides yet"
            message="Your completed and past trips will show here."
          />
        }
        renderItem={({ item, index }) => (
          <Card accent delay={Math.min(index * 40, 200)}>
            <Text style={[type.eyebrow, { fontSize: 11 }]}>
              {RideStatusLabel[item.rideStatusId as RideStatus] ??
                `Status ${item.rideStatusId}`}
            </Text>
            <Text style={[type.h3, { marginTop: spacing.xs }]}>
              {item.pickupAddress || 'Pickup'} → {item.destinationAddress || 'Destination'}
            </Text>
            <View style={styles.row}>
              <Text style={type.caption}>
                {new Date(item.requestedOn).toLocaleString()}
              </Text>
              <Text style={[type.h3, { color: colors.green }]}>
                {item.finalFare != null ? `R${item.finalFare}` : '—'}
              </Text>
            </View>
            {item.rideStatusId === RideStatus.Completed ? (
              ratingRideId === item.id ? (
                <RateRide
                  rideId={item.id}
                  target="driver"
                  onFinished={() => setRatingRideId(null)}
                />
              ) : (
                <View style={{ marginTop: spacing.sm }}>
                  <SoftButton title="Rate your driver" onPress={() => setRatingRideId(item.id)} />
                </View>
              )
            ) : null}
          </Card>
        )}
      />
    </Screen>
  );
}
