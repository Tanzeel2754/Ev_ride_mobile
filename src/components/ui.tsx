import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Keyboard,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  type TextInputProps,
  type ViewStyle,
} from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  FadeInDown,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useResponsive } from '../hooks/useResponsive';
import { colors, shadows } from '../theme/colors';
import { useTypography } from '../theme/typography';

/** Soft atmospheric washes behind content. */
export function Atmosphere({ variant = 'mint' }: { variant?: 'mint' | 'cyan' | 'map' }) {
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <LinearGradient
        colors={
          variant === 'cyan'
            ? [colors.cyanLight, colors.background, colors.greenLight]
            : variant === 'map'
              ? [colors.mapFrom, colors.mapMid, colors.mapTo]
              : [colors.greenLight, colors.background, colors.cyanLight]
        }
        start={{ x: 0.1, y: 0 }}
        end={{ x: 0.9, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
    </View>
  );
}

export function Screen({
  children,
  style,
  atmosphere = true,
}: {
  children: React.ReactNode;
  style?: ViewStyle;
  atmosphere?: boolean;
}) {
  const { spacing, horizontalPadding } = useResponsive();
  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      {atmosphere ? <Atmosphere /> : null}
      <SafeAreaView
        edges={['top', 'left', 'right']}
        style={[
          {
            flex: 1,
            paddingHorizontal: horizontalPadding,
            paddingTop: spacing.sm,
          },
          style,
        ]}
      >
        {children}
      </SafeAreaView>
    </View>
  );
}

export function BackButton({ onPress }: { onPress: () => void }) {
  const type = useTypography();
  return (
    <Pressable
      onPress={onPress}
      hitSlop={10}
      style={({ pressed }) => [styles.backBtn, pressed && { opacity: 0.75, transform: [{ scale: 0.97 }] }]}
    >
      <Text style={[type.h3, { color: colors.charcoal }]}>←</Text>
    </Pressable>
  );
}

export function Title({ children }: { children: React.ReactNode }) {
  const type = useTypography();
  const { spacing } = useResponsive();
  return (
    <Text style={[type.h1, { marginTop: spacing.xs, marginBottom: spacing.sm }]}>
      {children}
    </Text>
  );
}

export function Subtitle({ children }: { children: React.ReactNode }) {
  const type = useTypography();
  const { spacing } = useResponsive();
  return <Text style={[type.body, { marginTop: spacing.xs }]}>{children}</Text>;
}

export function Label({ children }: { children: React.ReactNode }) {
  const type = useTypography();
  return <Text style={type.eyebrow}>{children}</Text>;
}

export function Muted({ children }: { children: React.ReactNode }) {
  const type = useTypography();
  return <Text style={[type.caption, { color: colors.textSecondary }]}>{children}</Text>;
}

export function PrimaryButton({
  title,
  onPress,
  disabled,
  loading,
}: {
  title: string;
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
}) {
  const { ms } = useResponsive();
  const type = useTypography();
  const scale = useSharedValue(1);
  const animStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  return (
    <Animated.View style={[{ alignSelf: 'stretch' }, animStyle]}>
      <Pressable
        onPressIn={() => {
          scale.value = withSpring(0.97, { damping: 18, stiffness: 320 });
        }}
        onPressOut={() => {
          scale.value = withSpring(1, { damping: 14, stiffness: 260 });
        }}
        onPress={() => {
          if (Platform.OS !== 'web') void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          onPress();
        }}
        disabled={disabled || loading}
        style={[styles.primaryBtnOuter, (disabled || loading) && styles.btnDisabled]}
      >
        <LinearGradient
          colors={[colors.green, colors.greenDark]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[
            styles.primaryBtn,
            {
              paddingVertical: ms(17),
              paddingHorizontal: ms(20),
              borderRadius: 18,
            },
          ]}
        >
          {loading ? (
            <ActivityIndicator color={colors.textOnGreen} />
          ) : (
            <Text style={[type.button, { color: colors.textOnGreen }]}>{title}</Text>
          )}
        </LinearGradient>
      </Pressable>
    </Animated.View>
  );
}

export function SoftButton({
  title,
  onPress,
  disabled,
  loading,
}: {
  title: string;
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
}) {
  const { ms } = useResponsive();
  const type = useTypography();

  return (
    <Pressable
      onPress={() => {
        if (Platform.OS !== 'web') void Haptics.selectionAsync();
        onPress();
      }}
      disabled={disabled || loading}
      style={({ pressed }) => [
        styles.softBtn,
        {
          paddingVertical: ms(15),
          paddingHorizontal: ms(16),
          borderRadius: 18,
          alignSelf: 'stretch',
          justifyContent: 'center',
        },
        (disabled || loading) && styles.btnDisabled,
        pressed && !disabled && !loading && styles.softBtnPressed,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={colors.text} />
      ) : (
        <Text style={[type.button, { color: colors.text, fontSize: ms(14) }]}>{title}</Text>
      )}
    </Pressable>
  );
}

export function TextLink({
  title,
  onPress,
  align = 'left',
  accent,
}: {
  title: string;
  onPress: () => void;
  align?: 'left' | 'center' | 'right';
  accent?: boolean;
}) {
  const type = useTypography();
  return (
    <Pressable
      onPress={onPress}
      style={{
        alignSelf: align === 'center' ? 'center' : align === 'right' ? 'flex-end' : 'flex-start',
      }}
    >
      <Text
        style={[
          type.caption,
          {
            color: accent ? colors.green : colors.text,
            fontFamily: accent ? 'PlusJakartaSans_700Bold' : 'PlusJakartaSans_500Medium',
            fontSize: 14,
          },
        ]}
      >
        {title}
      </Text>
    </Pressable>
  );
}

export function IconField({
  icon,
  right,
  ...props
}: TextInputProps & { icon?: string; right?: React.ReactNode }) {
  const { spacing, ms } = useResponsive();
  const type = useTypography();
  const [focused, setFocused] = useState(false);

  return (
    <View
      style={[
        styles.iconField,
        {
          borderRadius: 18,
          paddingHorizontal: spacing.md,
          marginTop: spacing.sm,
          minHeight: ms(58),
        },
        focused && styles.fieldFocused,
      ]}
    >
      {icon ? (
        <View style={styles.iconBubble}>
          <Text style={{ fontSize: 13, color: colors.green, fontFamily: 'PlusJakartaSans_700Bold' }}>
            {icon}
          </Text>
        </View>
      ) : null}
      <TextInput
        placeholderTextColor={colors.textMuted}
        {...props}
        onFocus={(e) => {
          setFocused(true);
          props.onFocus?.(e);
        }}
        onBlur={(e) => {
          setFocused(false);
          props.onBlur?.(e);
        }}
        style={[
          styles.iconInput,
          {
            fontSize: ms(15),
            fontFamily: type.body.fontFamily,
            paddingVertical: ms(14),
          },
          props.style,
        ]}
      />
      {right}
    </View>
  );
}

export function NavyButton({
  title,
  onPress,
  disabled,
  loading,
}: {
  title: string;
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
}) {
  const { radius, ms } = useResponsive();
  const type = useTypography();

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      style={({ pressed }) => [
        styles.navyBtn,
        {
          paddingVertical: ms(16),
          borderRadius: radius.md,
        },
        (disabled || loading) && styles.btnDisabled,
        pressed && !disabled && { opacity: 0.92 },
      ]}
    >
      {loading ? (
        <ActivityIndicator color={colors.textOnNavy} />
      ) : (
        <Text style={[type.button, { color: colors.textOnNavy }]}>{title}</Text>
      )}
    </Pressable>
  );
}

export function Field(props: TextInputProps) {
  const { spacing, ms } = useResponsive();
  const type = useTypography();
  const [focused, setFocused] = useState(false);

  return (
    <TextInput
      placeholderTextColor={colors.textMuted}
      {...props}
      onFocus={(e) => {
        setFocused(true);
        props.onFocus?.(e);
      }}
      onBlur={(e) => {
        setFocused(false);
        props.onBlur?.(e);
      }}
      style={[
        styles.input,
        {
          borderRadius: 18,
          paddingHorizontal: spacing.md,
          paddingVertical: ms(16),
          fontSize: ms(15),
          fontFamily: type.body.fontFamily,
          marginTop: spacing.sm,
        },
        focused && styles.fieldFocused,
        props.style,
      ]}
    />
  );
}

export function Card({
  children,
  accent,
  delay = 0,
}: {
  children: React.ReactNode;
  accent?: boolean;
  delay?: number;
}) {
  const { spacing, radius } = useResponsive();
  return (
    <Animated.View
      entering={FadeInDown.delay(delay).springify().damping(18)}
      style={[
        styles.card,
        {
          borderRadius: radius.lg,
          padding: spacing.lg,
          marginBottom: spacing.md,
        },
        accent && styles.cardAccent,
      ]}
    >
      {accent ? (
        <LinearGradient
          colors={['rgba(0,184,92,0.08)', 'transparent']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
          pointerEvents="none"
        />
      ) : null}
      {children}
    </Animated.View>
  );
}

export function ErrorBanner({ message }: { message?: string | null }) {
  const { spacing, radius, ms } = useResponsive();
  const type = useTypography();
  if (!message) return null;
  return (
    <View
      style={[
        styles.errorBanner,
        {
          borderRadius: radius.md,
          padding: spacing.md,
          marginVertical: spacing.sm,
        },
      ]}
    >
      <Text style={[type.caption, { color: colors.danger, fontSize: ms(13), lineHeight: ms(18) }]}>
        {message}
      </Text>
    </View>
  );
}

export function LoadingBlock({ label = 'Loading…' }: { label?: string }) {
  const { spacing } = useResponsive();
  const type = useTypography();
  return (
    <View style={[styles.center, { padding: spacing.lg }]}>
      <ActivityIndicator color={colors.green} size="large" />
      <Text style={[type.caption, { color: colors.textSecondary, marginTop: spacing.md }]}>
        {label}
      </Text>
    </View>
  );
}

export function EmptyBlock({
  title,
  message,
}: {
  title: string;
  message?: string;
}) {
  const { spacing } = useResponsive();
  const type = useTypography();
  return (
    <View style={[styles.center, { padding: spacing.lg }]}>
      <View style={styles.emptyIcon}>
        <View style={styles.emptyDot} />
      </View>
      <Text style={[type.h2, { textAlign: 'center', marginTop: spacing.md }]}>{title}</Text>
      {message ? (
        <Text
          style={[
            type.caption,
            { color: colors.textSecondary, marginTop: spacing.sm, textAlign: 'center' },
          ]}
        >
          {message}
        </Text>
      ) : null}
    </View>
  );
}

export function MapBackdrop() {
  const { width, height, scale, vScale } = useResponsive();

  const mapStyles = useMemo(
    () => ({
      glow: {
        width: scale(220),
        height: scale(220),
        borderRadius: scale(110),
        top: height * 0.2,
        left: width * 0.22,
      },
      routeLine: {
        height: vScale(180),
        top: height * 0.35,
        left: width * 0.48,
      },
      dotPickup: {
        bottom: vScale(200),
        left: scale(48),
        width: scale(16),
        height: scale(16),
        borderRadius: scale(8),
      },
      dotDest: {
        top: vScale(160),
        right: scale(56),
        width: scale(16),
        height: scale(16),
        borderRadius: scale(8),
      },
    }),
    [width, height, scale, vScale],
  );

  return (
    <View style={styles.map}>
      <LinearGradient
        colors={[colors.mapFrom, colors.mapMid, colors.mapTo]}
        style={StyleSheet.absoluteFill}
      />
      <View style={[styles.mapGlow, mapStyles.glow]} />
      <View style={[styles.routeLine, mapStyles.routeLine]} />
      <View style={[styles.dot, styles.dotBase, mapStyles.dotPickup]} />
      <View
        style={[styles.dot, styles.dotBase, mapStyles.dotDest, { backgroundColor: colors.cyan }]}
      />
    </View>
  );
}

export function BottomSheet({
  children,
  compact,
  avoidKeyboard = true,
}: {
  children: React.ReactNode;
  /** Slightly shorter sheet so more map stays visible */
  compact?: boolean;
  /** When false, sheet stays pinned to the bottom while the keyboard is open */
  avoidKeyboard?: boolean;
}) {
  const { spacing, radius, horizontalPadding, bottomSheetMaxHeight, height } = useResponsive();
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  const collapsedHeight = compact
    ? Math.min(bottomSheetMaxHeight, height * 0.42)
    : bottomSheetMaxHeight;
  const expandedHeight = Math.min(height * 0.78, height - 72);
  const minHeight = Math.min(collapsedHeight, height * 0.34);
  const maxDragHeight = expandedHeight;

  const sheetHeight = useSharedValue(collapsedHeight);
  const dragStart = useSharedValue(collapsedHeight);

  useEffect(() => {
    sheetHeight.value = withSpring(collapsedHeight, { damping: 22, stiffness: 220 });
  }, [collapsedHeight, sheetHeight]);

  useEffect(() => {
    if (!avoidKeyboard) {
      setKeyboardHeight(0);
      return;
    }
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';
    const showSub = Keyboard.addListener(showEvent, (e) => {
      setKeyboardHeight(e.endCoordinates?.height ?? 0);
    });
    const hideSub = Keyboard.addListener(hideEvent, () => setKeyboardHeight(0));
    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, [avoidKeyboard]);

  useEffect(() => {
    if (!avoidKeyboard) return;
    if (keyboardHeight > 0) {
      const kbHeight = Math.min(height - keyboardHeight - 24, height * 0.72);
      sheetHeight.value = withSpring(kbHeight, { damping: 22, stiffness: 220 });
    } else {
      sheetHeight.value = withSpring(collapsedHeight, { damping: 22, stiffness: 220 });
    }
  }, [avoidKeyboard, keyboardHeight, height, collapsedHeight, sheetHeight]);

  const pan = Gesture.Pan()
    .activeOffsetY([-8, 8])
    .onBegin(() => {
      dragStart.value = sheetHeight.value;
    })
    .onUpdate((event) => {
      const next = dragStart.value - event.translationY;
      sheetHeight.value = Math.min(maxDragHeight, Math.max(minHeight, next));
    })
    .onEnd((event) => {
      const mid = (minHeight + maxDragHeight) / 2;
      const shouldExpand =
        event.velocityY < -600 ||
        (event.velocityY > -200 && sheetHeight.value > mid) ||
        (event.velocityY <= -200 && sheetHeight.value > minHeight + 24);
      const target =
        event.velocityY > 600
          ? minHeight
          : shouldExpand
            ? maxDragHeight
            : minHeight;
      sheetHeight.value = withSpring(target, { damping: 20, stiffness: 240 });
    });

  const animatedSheetStyle = useAnimatedStyle(() => ({
    height: sheetHeight.value,
  }));

  return (
    <Animated.View
      style={[
        styles.sheet,
        animatedSheetStyle,
        {
          borderTopLeftRadius: radius.xl,
          borderTopRightRadius: radius.xl,
          paddingHorizontal: horizontalPadding,
          paddingBottom: spacing.xl,
          paddingTop: spacing.sm,
          bottom:
            avoidKeyboard && keyboardHeight > 0
              ? Math.max(keyboardHeight - 8, 0)
              : 0,
        },
      ]}
    >
      <LinearGradient
        colors={['#FFFFFF', '#F7FBFA']}
        style={StyleSheet.absoluteFill}
        pointerEvents="none"
      />
      <GestureDetector gesture={pan}>
        <Animated.View
          style={[
            styles.handleHit,
            { marginBottom: spacing.sm },
          ]}
        >
          <View
            style={[
              styles.handle,
              {
                width: scaleFallback(48, horizontalPadding),
              },
            ]}
          />
        </Animated.View>
      </GestureDetector>
      <ScrollView
        showsVerticalScrollIndicator={false}
        bounces={false}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        contentContainerStyle={{ paddingBottom: spacing.sm }}
      >
        {children}
      </ScrollView>
    </Animated.View>
  );
}

function scaleFallback(base: number, padding: number) {
  return Math.max(base, padding * 1.5);
}

export function Badge({
  label,
  variant = 'green',
}: {
  label: string;
  variant?: 'green' | 'navy' | 'cyan';
}) {
  const { spacing, ms } = useResponsive();
  const type = useTypography();
  return (
    <View
      style={[
        styles.badge,
        {
          paddingHorizontal: spacing.sm + 2,
          borderRadius: 12,
        },
        variant === 'navy' && styles.badgeNavy,
        variant === 'cyan' && styles.badgeCyan,
      ]}
    >
      <Text
        style={[
          type.eyebrow,
          { fontSize: ms(10) },
          variant === 'navy' && { color: colors.navy },
          variant === 'cyan' && { color: colors.cyan },
        ]}
      >
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  backBtn: {
    width: 44,
    height: 44,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
    ...shadows.sm,
  },
  primaryBtnOuter: {
    borderRadius: 20,
    overflow: 'hidden',
    ...shadows.green,
  },
  primaryBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  softBtn: {
    borderWidth: 1.5,
    borderColor: colors.border,
    alignItems: 'center',
    backgroundColor: colors.surface,
    width: '100%',
    ...shadows.sm,
  },
  softBtnPressed: {
    backgroundColor: colors.greenLight,
    borderColor: colors.green,
  },
  navyBtn: {
    backgroundColor: colors.navy,
    alignItems: 'center',
    ...shadows.md,
  },
  btnDisabled: {
    opacity: 0.5,
  },
  input: {
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    color: colors.text,
  },
  fieldFocused: {
    borderColor: colors.green,
    backgroundColor: colors.surface,
  },
  iconField: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.border,
    gap: 12,
  },
  iconBubble: {
    width: 34,
    height: 34,
    borderRadius: 12,
    backgroundColor: colors.greenLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconInput: {
    flex: 1,
    color: colors.text,
    padding: 0,
  },
  card: {
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.border,
    overflow: 'hidden',
    ...shadows.md,
  },
  cardAccent: {
    borderColor: 'rgba(0,184,92,0.28)',
  },
  errorBanner: {
    backgroundColor: colors.dangerBg,
    borderColor: 'rgba(229, 72, 77, 0.22)',
    borderWidth: 1,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyIcon: {
    width: 64,
    height: 64,
    borderRadius: 22,
    backgroundColor: colors.greenLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyDot: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: colors.green,
    opacity: 0.85,
  },
  map: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: colors.mapMid,
  },
  mapGlow: {
    position: 'absolute',
    backgroundColor: colors.mapGlow,
  },
  routeLine: {
    position: 'absolute',
    width: 3,
    backgroundColor: colors.green,
    opacity: 0.35,
    borderRadius: 2,
    transform: [{ rotate: '-25deg' }],
  },
  dot: {
    position: 'absolute',
  },
  dotBase: {
    backgroundColor: colors.green,
    borderWidth: 3,
    borderColor: colors.surface,
    ...shadows.sm,
  },
  sheet: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: colors.surface,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    borderTopWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
    ...shadows.lg,
  },
  handleHit: {
    alignSelf: 'stretch',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    zIndex: 2,
  },
  handle: {
    height: 5,
    borderRadius: 3,
    backgroundColor: colors.border,
  },
  badge: {
    alignSelf: 'flex-start',
    backgroundColor: colors.greenMuted,
    paddingVertical: 5,
  },
  badgeNavy: {
    backgroundColor: 'rgba(8, 40, 68, 0.08)',
  },
  badgeCyan: {
    backgroundColor: colors.cyanMuted,
  },
});
