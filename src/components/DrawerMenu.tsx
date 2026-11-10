import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { useEffect } from 'react';
import {
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useResponsive } from '../hooks/useResponsive';
import { colors, shadows } from '../theme/colors';
import { useTypography } from '../theme/typography';

export type DrawerItem = {
  key: string;
  label: string;
  subtitle?: string;
  onPress: () => void;
};

type Props = {
  visible: boolean;
  onClose: () => void;
  title?: string;
  subtitle?: string;
  items: DrawerItem[];
};

export function DrawerMenu({
  visible,
  onClose,
  title = 'Menu',
  subtitle,
  items,
}: Props) {
  const insets = useSafeAreaInsets();
  const { spacing, scale, width } = useResponsive();
  const type = useTypography();
  const drawerWidth = Math.min(width * 0.82, 320);

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
              paddingBottom: insets.bottom + spacing.lg,
              paddingHorizontal: spacing.lg,
            },
          ]}
        >
          <LinearGradient
            colors={[colors.greenLight, colors.surface, colors.cyanLight]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFill}
          />
          <View style={styles.glow} />

          <View style={styles.headerRow}>
            <View style={{ flex: 1 }}>
              <Text style={[type.eyebrow, { color: colors.green }]}>{title}</Text>
              {subtitle ? (
                <Text style={[type.h2, { marginTop: 4 }]} numberOfLines={1}>
                  {subtitle}
                </Text>
              ) : null}
            </View>
            <Pressable
              onPress={onClose}
              style={({ pressed }) => [
                styles.closeBtn,
                pressed && { backgroundColor: colors.greenLight },
              ]}
            >
              <Text style={[type.h3, { color: colors.text }]}>✕</Text>
            </Pressable>
          </View>

          <View style={{ marginTop: spacing.lg, gap: spacing.sm }}>
            {items.map((item) => (
              <Pressable
                key={item.key}
                onPress={() => {
                  if (Platform.OS !== 'web') {
                    void Haptics.selectionAsync();
                  }
                  onClose();
                  item.onPress();
                }}
                style={({ pressed }) => [
                  styles.item,
                  {
                    borderRadius: scale(16),
                    paddingVertical: spacing.md,
                    paddingHorizontal: spacing.md,
                  },
                  pressed && styles.itemPressed,
                ]}
              >
                <Text style={type.h3}>{item.label}</Text>
                {item.subtitle ? (
                  <Text style={[type.caption, { marginTop: 2 }]}>{item.subtitle}</Text>
                ) : null}
              </Pressable>
            ))}
          </View>
        </View>

        <Pressable style={styles.backdrop} onPress={onClose}>
          {Platform.OS === 'ios' ? (
            <BlurView intensity={18} tint="dark" style={StyleSheet.absoluteFill} />
          ) : (
            <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(8,40,68,0.45)' }]} />
          )}
        </Pressable>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, flexDirection: 'row' },
  backdrop: { flex: 1 },
  drawer: {
    backgroundColor: colors.surface,
    borderRightWidth: 1,
    borderRightColor: colors.border,
    overflow: 'hidden',
    ...shadows.lg,
  },
  glow: {
    position: 'absolute',
    top: -40,
    left: -40,
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: colors.orbMint,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  closeBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
  },
  item: {
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    ...shadows.sm,
  },
  itemPressed: {
    borderColor: colors.green,
    backgroundColor: colors.greenLight,
  },
});
