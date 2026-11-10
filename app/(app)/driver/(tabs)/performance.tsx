import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { DriverShell } from '../../../../src/components/driver/DriverShell';
import { SoftButton } from '../../../../src/components/ui';
import { useDriverSession } from '../../../../src/hooks/useDriverSession';
import { useResponsive } from '../../../../src/hooks/useResponsive';
import { colors, shadows } from '../../../../src/theme/colors';
import { useTypography } from '../../../../src/theme/typography';

type Period = 'day' | 'week' | 'month';

export default function PerformanceScreen() {
  const router = useRouter();
  const type = useTypography();
  const { spacing, horizontalPadding, ms } = useResponsive();
  const { profile } = useDriverSession();
  const [period, setPeriod] = useState<Period>('day');

  const styles = useMemo(
    () =>
      StyleSheet.create({
        content: {
          paddingHorizontal: horizontalPadding,
          paddingBottom: spacing.xxl,
          paddingTop: spacing.md,
        },
        pills: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.lg },
        pill: {
          flex: 1,
          alignItems: 'center',
          paddingVertical: spacing.sm + 2,
          borderRadius: 14,
          borderWidth: 1.5,
        },
        pillOn: {
          backgroundColor: colors.green,
          borderColor: colors.green,
        },
        pillOff: {
          backgroundColor: colors.surface,
          borderColor: colors.border,
        },
        heroCard: {
          backgroundColor: colors.surface,
          borderRadius: 28,
          borderWidth: 1.5,
          borderColor: colors.border,
          padding: spacing.lg,
          alignItems: 'center',
          marginBottom: spacing.md,
          overflow: 'hidden',
          ...shadows.md,
        },
        income: {
          fontFamily: 'PlusJakartaSans_800ExtraBold',
          fontSize: ms(42),
          color: colors.charcoal,
          letterSpacing: -1.2,
          marginVertical: spacing.sm,
        },
        card: {
          backgroundColor: colors.surface,
          borderRadius: 20,
          borderWidth: 1.5,
          borderColor: colors.border,
          padding: spacing.md,
          marginBottom: spacing.sm,
          ...shadows.sm,
        },
        row: {
          flexDirection: 'row',
          alignItems: 'center',
          gap: spacing.md,
          paddingVertical: spacing.sm,
        },
        iconBubble: {
          width: 42,
          height: 42,
          borderRadius: 14,
          backgroundColor: colors.greenLight,
          alignItems: 'center',
          justifyContent: 'center',
          borderWidth: 1,
          borderColor: 'rgba(0,184,92,0.25)',
        },
      }),
    [spacing, horizontalPadding, ms],
  );

  const periodLabel =
    period === 'day' ? 'Today' : period === 'week' ? 'This week' : 'This month';

  return (
    <DriverShell>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.pills}>
          {(['day', 'week', 'month'] as Period[]).map((p) => {
            const on = period === p;
            return (
              <Pressable
                key={p}
                onPress={() => setPeriod(p)}
                style={[styles.pill, on ? styles.pillOn : styles.pillOff]}
              >
                <Text
                  style={[
                    type.button,
                    { fontSize: 13, color: on ? colors.textOnGreen : colors.text },
                  ]}
                >
                  {p === 'day' ? 'Day' : p === 'week' ? 'Week' : 'Month'}
                </Text>
              </Pressable>
            );
          })}
        </View>

        <View style={styles.heroCard}>
          <Text style={type.caption}>{periodLabel}</Text>
          <Text style={styles.income}>R0.00</Text>
          <Text style={type.body}>No completed orders yet</Text>
          <View style={{ width: '100%', marginTop: spacing.md }}>
            <SoftButton
              title="Set income plan"
              onPress={() => router.push('/(app)/driver/(tabs)/wallet')}
            />
          </View>
        </View>

        <View style={styles.card}>
          <Text style={[type.eyebrow, { marginBottom: spacing.sm }]}>This week</Text>
          <View style={styles.row}>
            <View style={styles.iconBubble}>
              <Text>★</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={type.h3}>
                {(profile?.averageRating ?? 0).toFixed(2)} rating
              </Text>
              <Text style={type.caption}>Keep 4.80+ to stay eligible</Text>
            </View>
          </View>
          <View style={styles.row}>
            <View style={styles.iconBubble}>
              <Text>▣</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={type.h3}>{profile?.completedTripsCount ?? 0} trips</Text>
              <Text style={type.caption}>Completed with EV Ride</Text>
            </View>
          </View>
        </View>

        <Pressable
          style={({ pressed }) => [styles.card, styles.row, pressed && { borderColor: colors.green }]}
          onPress={() => router.push('/(app)/driver/active')}
        >
          <View style={styles.iconBubble}>
            <Text>✓</Text>
          </View>
          <Text style={[type.h3, { flex: 1 }]}>Order history</Text>
          <Text style={{ color: colors.gray, fontSize: 18 }}>›</Text>
        </Pressable>

        <Pressable
          style={({ pressed }) => [styles.card, styles.row, pressed && { borderColor: colors.green }]}
          onPress={() => router.push('/(app)/driver/profile')}
        >
          <View style={styles.iconBubble}>
            <Text>⚑</Text>
          </View>
          <Text style={[type.h3, { flex: 1 }]}>Achievements</Text>
          <Text style={{ color: colors.gray, fontSize: 18 }}>›</Text>
        </Pressable>
      </ScrollView>
    </DriverShell>
  );
}
