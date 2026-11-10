import { LinearGradient } from 'expo-linear-gradient';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useResponsive } from '../../hooks/useResponsive';
import { colors, shadows } from '../../theme/colors';
import { useTypography } from '../../theme/typography';

type Props = {
  isOnline: boolean;
  toggling?: boolean;
  onToggleOnline: () => void;
  onOpenMenu: () => void;
  onOpenSettings: () => void;
};

/** Driver chrome: menu · online toggle · settings */
export function DriverHeader({
  isOnline,
  toggling,
  onToggleOnline,
  onOpenMenu,
  onOpenSettings,
}: Props) {
  const insets = useSafeAreaInsets();
  const { spacing, scale, horizontalPadding } = useResponsive();
  const type = useTypography();

  const trackW = scale(168);
  const trackH = scale(46);
  const thumbW = scale(88);
  const thumbH = scale(36);
  const pad = 5;

  return (
    <View
      style={[
        styles.bar,
        {
          paddingTop: insets.top + spacing.xs,
          paddingHorizontal: horizontalPadding,
          paddingBottom: spacing.sm,
        },
      ]}
    >
      <LinearGradient
        colors={[colors.surface, colors.greenLight]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />

      <Pressable
        onPress={onOpenMenu}
        style={({ pressed }) => [styles.iconBtn, pressed && { opacity: 0.7 }]}
        hitSlop={8}
      >
        <View style={styles.menuLines}>
          <View style={styles.menuLine} />
          <View style={[styles.menuLine, { width: '70%' }]} />
          <View style={[styles.menuLine, { width: '85%' }]} />
        </View>
      </Pressable>

      <Pressable
        onPress={onToggleOnline}
        disabled={toggling}
        accessibilityRole="switch"
        accessibilityState={{ checked: isOnline }}
        style={({ pressed }) => [
          styles.toggleTrack,
          {
            width: trackW,
            height: trackH,
            borderRadius: 18,
            justifyContent: isOnline ? 'flex-end' : 'flex-start',
          },
          isOnline ? styles.trackOnline : styles.trackOffline,
          pressed && { opacity: 0.92 },
          toggling && { opacity: 0.85 },
        ]}
      >
        <View
          style={[
            styles.toggleThumb,
            {
              width: thumbW,
              height: thumbH,
              borderRadius: 14,
              marginHorizontal: pad,
            },
            isOnline ? styles.thumbOnline : styles.thumbOffline,
          ]}
        >
          <Text
            style={[
              type.button,
              {
                fontSize: scale(13),
                color: isOnline ? colors.textOnGreen : colors.textOnNavy,
              },
            ]}
          >
            {toggling ? '…' : isOnline ? 'Online' : 'Offline'}
          </Text>
        </View>
      </Pressable>

      <Pressable
        onPress={onOpenSettings}
        style={({ pressed }) => [styles.iconBtn, pressed && { opacity: 0.7 }]}
        hitSlop={8}
      >
        <View style={styles.gear}>
          <View style={styles.gearCore} />
        </View>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    zIndex: 10,
    overflow: 'hidden',
  },
  iconBtn: {
    width: 46,
    height: 46,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.sm,
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
  gear: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2.5,
    borderColor: colors.charcoal,
    alignItems: 'center',
    justifyContent: 'center',
  },
  gearCore: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.green,
  },
  toggleTrack: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    overflow: 'hidden',
    ...shadows.sm,
  },
  trackOnline: {
    backgroundColor: colors.greenLight,
    borderColor: 'rgba(0,184,92,0.4)',
  },
  trackOffline: {
    backgroundColor: colors.surfaceMuted,
    borderColor: colors.border,
  },
  toggleThumb: {
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.sm,
  },
  thumbOnline: {
    backgroundColor: colors.green,
  },
  thumbOffline: {
    backgroundColor: '#E57373',
  },
});
