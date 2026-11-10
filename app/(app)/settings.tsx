import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { Switch, Text, View } from 'react-native';
import {
  Card,
  Label,
  PrimaryButton,
  Screen,
  SoftButton,
  Title,
} from '../../src/components/ui';
import { useAuth } from '../../src/context/AuthContext';
import { useResponsive } from '../../src/hooks/useResponsive';
import { colors } from '../../src/theme/colors';
import { useTypography } from '../../src/theme/typography';

export default function SettingsScreen() {
  const router = useRouter();
  const { session, signOut } = useAuth();
  const { spacing } = useResponsive();
  const type = useTypography();
  const [rideAlerts, setRideAlerts] = useState(true);
  const [promoAlerts, setPromoAlerts] = useState(false);

  const rows = useMemo(
    () => [
      {
        label: 'Ride status alerts',
        value: rideAlerts,
        onChange: setRideAlerts,
      },
      {
        label: 'Offers & tips',
        value: promoAlerts,
        onChange: setPromoAlerts,
      },
    ],
    [rideAlerts, promoAlerts],
  );

  return (
    <Screen>
      <View style={{ marginTop: spacing.md }}>
        <Label>Account</Label>
        <Title>Settings</Title>
        <Text style={[type.body, { marginBottom: spacing.md }]}>
          Tune alerts and manage your EV Ride account.
        </Text>
      </View>

      <Card accent delay={40}>
        <Text style={[type.eyebrow, { marginBottom: spacing.sm }]}>Profile</Text>
        <Text style={type.h3}>{session?.name || 'Rider'}</Text>
        <Text style={[type.caption, { marginTop: 4 }]}>
          {session?.loginMethod === 'sms'
            ? session?.phoneNumber || '—'
            : session?.email || session?.phoneNumber || '—'}
        </Text>
        {session?.loginMethod ? (
          <Text style={[type.caption, { marginTop: 4, color: colors.green }]}>
            loginMethod: {session.loginMethod}
          </Text>
        ) : null}
      </Card>

      <Card delay={80}>
        <Text style={[type.eyebrow, { marginBottom: spacing.md }]}>Notifications</Text>
        {rows.map((row) => (
          <View
            key={row.label}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: spacing.md,
              gap: spacing.md,
              paddingVertical: 4,
            }}
          >
            <Text style={[type.h3, { flex: 1 }]}>{row.label}</Text>
            <Switch
              value={row.value}
              onValueChange={row.onChange}
              trackColor={{ false: colors.border, true: colors.greenLight }}
              thumbColor={row.value ? colors.green : colors.grayLight}
            />
          </View>
        ))}
        <Text style={type.caption}>
          Preferences stay on this device. Push delivery depends on your phone settings.
        </Text>
      </Card>

      <Card delay={120}>
        <Text style={[type.eyebrow, { marginBottom: spacing.sm }]}>Support</Text>
        <SoftButton title="Contact & help" onPress={() => router.push('/(app)/contact')} />
      </Card>

      <View style={{ gap: spacing.sm, marginTop: spacing.sm }}>
        <SoftButton title="Back" onPress={() => router.back()} />
        <PrimaryButton
          title="Sign out"
          onPress={async () => {
            await signOut();
            router.replace('/(auth)/splash');
          }}
        />
      </View>
    </Screen>
  );
}
