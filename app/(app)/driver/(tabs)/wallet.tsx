import { useRouter } from 'expo-router';
import { useMemo } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { DriverShell } from '../../../../src/components/driver/DriverShell';
import { PrimaryButton } from '../../../../src/components/ui';
import { useDriverSession } from '../../../../src/hooks/useDriverSession';
import { useResponsive } from '../../../../src/hooks/useResponsive';
import { colors, shadows } from '../../../../src/theme/colors';
import { useTypography } from '../../../../src/theme/typography';

export default function WalletScreen() {
  const router = useRouter();
  const type = useTypography();
  const { spacing, horizontalPadding, ms } = useResponsive();
  const { profile } = useDriverSession();

  const styles = useMemo(
    () =>
      StyleSheet.create({
        content: {
          paddingHorizontal: horizontalPadding,
          paddingTop: spacing.md,
          paddingBottom: spacing.xxl,
        },
        alert: {
          backgroundColor: colors.warningBg,
          borderRadius: 14,
          borderWidth: 1.5,
          borderColor: 'rgba(245,158,11,0.35)',
          padding: spacing.md,
          marginBottom: spacing.md,
          flexDirection: 'row',
          gap: spacing.sm,
          alignItems: 'center',
        },
        balanceCard: {
          backgroundColor: colors.surface,
          borderRadius: 28,
          borderWidth: 1.5,
          borderColor: 'rgba(0,184,92,0.28)',
          padding: spacing.lg,
          marginBottom: spacing.md,
          overflow: 'hidden',
          ...shadows.green,
        },
        balance: {
          fontFamily: 'PlusJakartaSans_800ExtraBold',
          fontSize: ms(40),
          color: colors.charcoal,
          letterSpacing: -1,
          marginTop: spacing.sm,
        },
        linkCard: {
          backgroundColor: colors.surface,
          borderRadius: 20,
          borderWidth: 1.5,
          borderColor: colors.border,
          padding: spacing.md,
          marginBottom: spacing.sm,
          flexDirection: 'row',
          alignItems: 'center',
          gap: spacing.md,
          ...shadows.sm,
        },
        icon: {
          width: 44,
          height: 44,
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

  return (
    <DriverShell>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.alert}>
          <Text style={{ fontSize: 16 }}>ⓘ</Text>
          <Text style={[type.caption, { flex: 1, color: colors.text }]}>
            Keep a healthy balance so you never miss ride requests.
          </Text>
        </View>

        <View style={styles.balanceCard}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
            <View style={styles.icon}>
              <Text>◈</Text>
            </View>
            <Text style={type.h3}>Balance</Text>
          </View>
          <Text style={styles.balance}>R0.00</Text>
          <Text style={[type.caption, { marginBottom: spacing.md }]}>
            0 bonuses · {profile?.completedTripsCount ?? 0} trips completed
          </Text>
          <PrimaryButton title="Top up" onPress={() => router.push('/(app)/contact')} />
        </View>

        <Pressable
          style={({ pressed }) => [
            styles.linkCard,
            pressed && { borderColor: colors.green, backgroundColor: colors.greenLight },
          ]}
          onPress={() => router.push('/(app)/settings')}
        >
          <View style={styles.icon}>
            <Text>▭</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={type.h3}>Payment methods</Text>
            <Text style={type.caption}>Manage how you receive payouts</Text>
          </View>
          <Text style={{ color: colors.gray, fontSize: 18 }}>›</Text>
        </Pressable>

        <Pressable
          style={({ pressed }) => [
            styles.linkCard,
            pressed && { borderColor: colors.green, backgroundColor: colors.greenLight },
          ]}
          onPress={() => router.push('/(app)/driver/(tabs)/performance')}
        >
          <View style={styles.icon}>
            <Text>⚑</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={type.h3}>Achievements</Text>
            <Text style={type.caption}>Bonuses and weekly goals</Text>
          </View>
          <Text style={{ color: colors.gray, fontSize: 18 }}>›</Text>
        </Pressable>
      </ScrollView>
    </DriverShell>
  );
}
