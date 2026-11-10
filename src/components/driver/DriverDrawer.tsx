import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { useEffect } from 'react';
import {
  Image,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useResponsive } from '../../hooks/useResponsive';
import { colors, shadows } from '../../theme/colors';
import { useTypography } from '../../theme/typography';
import { PrimaryButton } from '../ui';

export type DriverDrawerItem = {
  key: string;
  label: string;
  icon: string;
  badge?: string | number;
  onPress: () => void;
};

type Props = {
  visible: boolean;
  onClose: () => void;
  name?: string | null;
  rating?: number | null;
  trips?: number | null;
  avatarUri?: string | null;
  items: DriverDrawerItem[];
  onSwitchToPassenger: () => void;
  onOpenProfile: () => void;
};

export function DriverDrawer({
  visible,
  onClose,
  name,
  rating,
  trips,
  avatarUri,
  items,
  onSwitchToPassenger,
  onOpenProfile,
}: Props) {
  const insets = useSafeAreaInsets();
  const { spacing, width } = useResponsive();
  const type = useTypography();
  const drawerWidth = Math.min(width * 0.86, 340);
  const initial = (name || 'D').trim().charAt(0).toUpperCase();

  useEffect(() => {
    if (visible && Platform.OS !== 'web') {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  }, [visible]);

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onClose}>
      <View style={styles.root}>
        <View
          style={[
            styles.drawer,
            {
              width: drawerWidth,
              paddingTop: insets.top + spacing.md,
              paddingBottom: insets.bottom + spacing.md,
            },
          ]}
        >
          <LinearGradient
            colors={[colors.greenLight, colors.surface, colors.cyanLight]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFill}
          />

          <Pressable
            onPress={() => {
              onClose();
              onOpenProfile();
            }}
            style={({ pressed }) => [
              styles.profileRow,
              { paddingHorizontal: spacing.lg, paddingBottom: spacing.md },
              pressed && { opacity: 0.85 },
            ]}
          >
            {avatarUri ? (
              <Image source={{ uri: avatarUri }} style={styles.avatar} />
            ) : (
              <LinearGradient
                colors={[colors.green, colors.cyan]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={[styles.avatar, styles.avatarFallback]}
              >
                <Text style={[type.h2, { color: '#fff' }]}>{initial}</Text>
              </LinearGradient>
            )}
            <View style={{ flex: 1, marginLeft: spacing.md }}>
              <Text style={type.eyebrow}>Driver</Text>
              <Text style={[type.h2, { marginTop: 2 }]} numberOfLines={1}>
                {name || 'Driver'}
              </Text>
              <Text style={[type.caption, { marginTop: 2 }]}>
                {(rating ?? 0).toFixed(2)} rating
                {trips != null ? ` · ${trips} trips` : ''}
              </Text>
            </View>
            <Text style={[type.h2, { color: colors.gray }]}>›</Text>
          </Pressable>

          <View style={styles.divider} />

          <ScrollView
            style={{ flex: 1 }}
            contentContainerStyle={{
              paddingHorizontal: spacing.lg,
              paddingVertical: spacing.sm,
            }}
            showsVerticalScrollIndicator={false}
          >
            {items.map((item, index) => (
              <Pressable
                key={item.key}
                onPress={() => {
                  if (Platform.OS !== 'web') void Haptics.selectionAsync();
                  onClose();
                  item.onPress();
                }}
                style={({ pressed }) => [
                  styles.item,
                  { paddingVertical: spacing.md },
                  pressed && { backgroundColor: colors.greenLight },
                ]}
              >
                <View
                  style={[
                    styles.itemIcon,
                    {
                      backgroundColor: index % 2 === 0 ? colors.greenLight : colors.cyanLight,
                    },
                  ]}
                >
                  <View
                    style={{
                      width: 8,
                      height: 8,
                      borderRadius: 4,
                      backgroundColor: index % 2 === 0 ? colors.green : colors.cyan,
                    }}
                  />
                </View>
                <Text style={[type.h3, { flex: 1 }]}>{item.label}</Text>
                {item.badge != null ? (
                  <View style={styles.badge}>
                    <Text style={styles.badgeText}>{item.badge}</Text>
                  </View>
                ) : (
                  <Text style={{ color: colors.gray, fontSize: 18 }}>›</Text>
                )}
              </Pressable>
            ))}
          </ScrollView>

          <View
            style={{
              paddingHorizontal: spacing.lg,
              paddingTop: spacing.xl,
              marginTop: spacing.lg,
              borderTopWidth: StyleSheet.hairlineWidth,
              borderTopColor: colors.border,
            }}
          >
            <PrimaryButton
              title="Passenger mode"
              onPress={() => {
                onClose();
                onSwitchToPassenger();
              }}
            />
            <Text
              style={[
                type.caption,
                { textAlign: 'center', marginTop: spacing.md, color: colors.textMuted },
              ]}
            >
              EV Ride · Drive electric
            </Text>
          </View>
        </View>

        <View style={styles.backdropWrap}>
          <Pressable style={styles.backdrop} onPress={onClose} />
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, flexDirection: 'row' },
  backdropWrap: { flex: 1 },
  backdrop: { flex: 1, backgroundColor: 'rgba(8,40,68,0.42)' },
  drawer: {
    backgroundColor: colors.surface,
    borderRightWidth: 1,
    borderRightColor: colors.border,
    overflow: 'hidden',
    ...shadows.lg,
  },
  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 58,
    height: 58,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: colors.surface,
  },
  avatarFallback: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.border,
    marginHorizontal: 20,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    borderRadius: 16,
    paddingHorizontal: 8,
  },
  itemIcon: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badge: {
    minWidth: 24,
    height: 24,
    borderRadius: 8,
    backgroundColor: colors.danger,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  badgeText: {
    color: '#fff',
    fontSize: 11,
    fontFamily: 'PlusJakartaSans_700Bold',
  },
});
