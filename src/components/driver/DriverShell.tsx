import { useRouter, type Href } from 'expo-router';
import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { View } from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { useDriverSession } from '../../hooks/useDriverSession';
import { getLocalAvatarUri } from '../../lib/avatar-storage';
import { colors } from '../../theme/colors';
import { DriverDrawer, type DriverDrawerItem } from './DriverDrawer';
import { DriverHeader } from './DriverHeader';

type Props = {
  children: ReactNode;
  hideOnlineToggle?: boolean;
};

export function DriverShell({ children, hideOnlineToggle }: Props) {
  const router = useRouter();
  const { session } = useAuth();
  const {
    profile,
    loading,
    toggling,
    toggleOnline,
    isOnline,
    isReady,
  } = useDriverSession();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [avatarUri, setAvatarUri] = useState<string | null>(null);

  useEffect(() => {
    void getLocalAvatarUri(session?.email).then(setAvatarUri);
  }, [session?.email, profile?.profileImageUrl]);

  const displayName =
    [profile?.firstName, profile?.lastName].filter(Boolean).join(' ') ||
    session?.name ||
    'Driver';

  const items: DriverDrawerItem[] = useMemo(
    () => [
      {
        key: 'requests',
        label: 'Ride requests',
        icon: '☰',
        onPress: () => router.push('/(app)/driver/(tabs)' as Href),
      },
      {
        key: 'demand',
        label: 'Demand',
        icon: '⚡',
        onPress: () => router.push('/(app)/driver/(tabs)/demand' as Href),
      },
      {
        key: 'performance',
        label: 'Performance',
        icon: '▦',
        onPress: () => router.push('/(app)/driver/(tabs)/performance' as Href),
      },
      {
        key: 'wallet',
        label: 'Wallet',
        icon: '◈',
        onPress: () => router.push('/(app)/driver/(tabs)/wallet' as Href),
      },
      {
        key: 'active',
        label: 'Active ride',
        icon: '▶',
        onPress: () => router.push('/(app)/driver/active'),
      },
      {
        key: 'vehicles',
        label: 'Vehicles',
        icon: '▣',
        onPress: () => router.push('/(app)/driver/vehicles' as Href),
      },
      {
        key: 'settings',
        label: 'Settings',
        icon: '⚙',
        onPress: () => router.push('/(app)/settings'),
      },
      {
        key: 'support',
        label: 'Support',
        icon: '💬',
        onPress: () => router.push('/(app)/contact'),
      },
      {
        key: 'onboarding',
        label: 'Online registration',
        icon: '✎',
        onPress: () => router.push('/(app)/driver/onboarding'),
      },
    ],
    [router],
  );

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <DriverHeader
        isOnline={isOnline}
        toggling={toggling || loading}
        onToggleOnline={() => {
          if (!isReady) {
            router.push('/(app)/driver/onboarding');
            return;
          }
          if (hideOnlineToggle || toggling) return;
          void toggleOnline();
        }}
        onOpenMenu={() => setDrawerOpen(true)}
        onOpenSettings={() => router.push('/(app)/settings')}
      />

      <DriverDrawer
        visible={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        name={displayName}
        rating={profile?.averageRating}
        trips={profile?.completedTripsCount}
        avatarUri={profile?.profileImageUrl || avatarUri}
        items={items}
        onSwitchToPassenger={() => router.replace('/(app)/passenger')}
        onOpenProfile={() => router.push('/(app)/driver/profile')}
      />

      <View style={{ flex: 1 }}>{children}</View>
    </View>
  );
}
