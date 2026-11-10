import { useFocusEffect, useRouter, type Href } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native';
import {
  Card,
  EmptyBlock,
  ErrorBanner,
  LoadingBlock,
  Screen,
} from '../../../src/components/ui';
import { getErrorMessage } from '../../../src/api/client';
import { listVehicles } from '../../../src/api/vehicle';
import type { GetAllDriverVehicleResponse } from '../../../src/types/api';
import { useResponsive } from '../../../src/hooks/useResponsive';
import { colors } from '../../../src/theme/colors';
import { useTypography } from '../../../src/theme/typography';
import { VerificationStatusLabel } from '../../../src/types/enums';

export default function DriverVehiclesScreen() {
  const router = useRouter();
  const { spacing, horizontalPadding } = useResponsive();
  const type = useTypography();
  const [items, setItems] = useState<GetAllDriverVehicleResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
      const data = await listVehicles();
      setItems(data.items ?? []);
    } catch (e) {
      setError(getErrorMessage(e, 'Could not load vehicles'));
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
        <LoadingBlock label="Loading vehicles…" />
      </Screen>
    );
  }

  return (
    <Screen style={{ paddingHorizontal: 0 }}>
      <View style={{ paddingHorizontal: horizontalPadding, marginBottom: spacing.sm }}>
        <Text style={type.eyebrow}>Fleet</Text>
        <Text style={[type.h1, { marginTop: 4 }]}>Vehicles</Text>
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
            title="No vehicles yet"
            message="Add an EV from driver onboarding, then it will show here."
          />
        }
        renderItem={({ item, index }) => (
          <Pressable
            onPress={() =>
              router.push(`/(app)/driver/vehicle?id=${encodeURIComponent(item.id)}` as Href)
            }
          >
            <Card accent delay={Math.min(index * 40, 200)}>
              <Text style={type.eyebrow}>
                {VerificationStatusLabel[item.verificationStatusId] ??
                  `Status ${item.verificationStatusId}`}
              </Text>
              <Text style={[type.h3, { marginTop: spacing.xs }]}>
                {item.make || 'Vehicle'} {item.model || ''}
              </Text>
              <View style={styles.row}>
                <Text style={type.caption}>{item.plateNumber || 'No plate'}</Text>
                <Text style={[type.caption, { color: colors.cyan }]}>{item.year || '—'}</Text>
              </View>
            </Card>
          </Pressable>
        )}
      />
    </Screen>
  );
}
