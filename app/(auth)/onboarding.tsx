import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useMemo, useRef, useState } from 'react';
import {
  Dimensions,
  FlatList,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import Animated, { FadeInUp } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Atmosphere, PrimaryButton } from '../../src/components/ui';
import { useResponsive } from '../../src/hooks/useResponsive';
import { setOnboardingCompleted } from '../../src/lib/onboarding-storage';
import { colors, shadows } from '../../src/theme/colors';
import { useTypography } from '../../src/theme/typography';

const { width: SCREEN_W } = Dimensions.get('window');

const SLIDES = [
  {
    key: '1',
    title: 'Book an EV in seconds',
    body: 'Offer your fare, match with verified electric drivers, and roll out on clean energy.',
    art: 'route' as const,
  },
  {
    key: '2',
    title: 'Live maps, zero guesswork',
    body: 'Follow your trip in real time with clear routes and status updates from pickup to drop-off.',
    art: 'map' as const,
  },
  {
    key: '3',
    title: 'Every trip stays transparent',
    body: 'Rate drivers, review history, and keep fares honest from the first tap to arrival.',
    art: 'pulse' as const,
  },
];

function SlideArt({ kind }: { kind: 'route' | 'map' | 'pulse' }) {
  if (kind === 'route') {
    return (
      <View style={artStyles.stage}>
        <View style={[artStyles.ring, { width: 140, height: 140, borderRadius: 70 }]} />
        <View style={[artStyles.ring, { width: 96, height: 96, borderRadius: 48, borderColor: colors.cyan }]} />
        <LinearGradient
          colors={[colors.green, colors.cyan]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={artStyles.core}
        />
        <View style={[artStyles.pin, { top: 36, left: 48, backgroundColor: colors.green }]} />
        <View style={[artStyles.pin, { bottom: 42, right: 52, backgroundColor: colors.cyan }]} />
      </View>
    );
  }
  if (kind === 'map') {
    return (
      <View style={artStyles.stage}>
        <View style={artStyles.mapCard}>
          <View style={artStyles.mapLine} />
          <View style={[artStyles.mapLine, { width: '55%', marginTop: 14, opacity: 0.55 }]} />
          <View style={[artStyles.mapLine, { width: '70%', marginTop: 14, opacity: 0.35 }]} />
          <View style={artStyles.mapDot} />
        </View>
      </View>
    );
  }
  return (
    <View style={artStyles.stage}>
      <View style={artStyles.bars}>
        {[54, 84, 120, 70, 98].map((h, i) => (
          <LinearGradient
            key={i}
            colors={i % 2 === 0 ? [colors.green, colors.greenDark] : [colors.cyan, '#087B3A']}
            style={[artStyles.bar, { height: h }]}
          />
        ))}
      </View>
    </View>
  );
}

const artStyles = StyleSheet.create({
  stage: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ring: {
    position: 'absolute',
    borderWidth: 2,
    borderColor: 'rgba(0,184,92,0.28)',
  },
  core: {
    width: 56,
    height: 56,
    borderRadius: 20,
  },
  pin: {
    position: 'absolute',
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 3,
    borderColor: '#fff',
  },
  mapCard: {
    width: '78%',
    height: '68%',
    borderRadius: 24,
    backgroundColor: colors.surface,
    padding: 22,
    justifyContent: 'center',
    ...shadows.md,
  },
  mapLine: {
    height: 10,
    width: '85%',
    borderRadius: 8,
    backgroundColor: colors.greenLight,
  },
  mapDot: {
    position: 'absolute',
    right: 28,
    bottom: 36,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: colors.green,
  },
  bars: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 12,
    height: 120,
  },
  bar: {
    width: 22,
    borderRadius: 12,
    minHeight: 28,
  },
});

export default function OnboardingScreen() {
  const router = useRouter();
  const type = useTypography();
  const { spacing, horizontalPadding, ms } = useResponsive();
  const listRef = useRef<FlatList>(null);
  const [index, setIndex] = useState(0);

  const styles = useMemo(
    () =>
      StyleSheet.create({
        root: { flex: 1, backgroundColor: colors.background },
        slide: {
          width: SCREEN_W,
          paddingHorizontal: horizontalPadding,
          alignItems: 'center',
          paddingTop: spacing.lg,
        },
        artCard: {
          width: '100%',
          height: ms(280),
          borderRadius: 32,
          overflow: 'hidden',
          marginBottom: spacing.xl,
          ...shadows.md,
        },
        title: {
          textAlign: 'center',
          color: colors.charcoal,
          marginBottom: spacing.sm,
        },
        body: {
          textAlign: 'center',
          color: colors.gray,
          marginBottom: spacing.lg,
          paddingHorizontal: spacing.sm,
        },
        dots: {
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 8,
          marginBottom: spacing.lg,
        },
        dot: {
          width: 8,
          height: 8,
          borderRadius: 4,
          backgroundColor: colors.border,
        },
        dotActive: {
          width: 26,
          height: 8,
          borderRadius: 4,
          backgroundColor: colors.green,
        },
        footer: {
          paddingHorizontal: horizontalPadding,
          paddingBottom: spacing.lg,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: spacing.md,
        },
        skip: {
          paddingVertical: spacing.sm,
          paddingHorizontal: spacing.sm,
        },
        nextWrap: { flex: 1, maxWidth: 180, alignSelf: 'flex-end' },
      }),
    [spacing, horizontalPadding, ms],
  );

  async function finish() {
    await setOnboardingCompleted();
    router.replace('/(auth)/sign-in');
  }

  function onNext() {
    if (index >= SLIDES.length - 1) {
      void finish();
      return;
    }
    const next = index + 1;
    listRef.current?.scrollToIndex({ index: next, animated: true });
    setIndex(next);
  }

  function onScrollEnd(e: NativeSyntheticEvent<NativeScrollEvent>) {
    const i = Math.round(e.nativeEvent.contentOffset.x / SCREEN_W);
    setIndex(i);
  }

  return (
    <View style={styles.root}>
      <Atmosphere />
      <SafeAreaView style={{ flex: 1 }}>
        <FlatList
          ref={listRef}
          data={SLIDES}
          keyExtractor={(item) => item.key}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onMomentumScrollEnd={onScrollEnd}
          renderItem={({ item }) => (
            <View style={styles.slide}>
              <LinearGradient
                colors={[colors.greenLight, colors.cyanLight, colors.surface]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.artCard}
              >
                <SlideArt kind={item.art} />
              </LinearGradient>
              <Animated.Text entering={FadeInUp.springify()} style={[type.h1, styles.title]}>
                {item.title}
              </Animated.Text>
              <Text style={[type.body, styles.body]}>{item.body}</Text>
            </View>
          )}
        />

        <View style={styles.dots}>
          {SLIDES.map((s, i) => (
            <View key={s.key} style={i === index ? styles.dotActive : styles.dot} />
          ))}
        </View>

        <View style={styles.footer}>
          <Pressable style={styles.skip} onPress={() => void finish()}>
            <Text style={[type.h3, { color: colors.gray }]}>Skip</Text>
          </Pressable>
          <View style={styles.nextWrap}>
            <PrimaryButton
              title={index === SLIDES.length - 1 ? 'Get started' : 'Next'}
              onPress={onNext}
            />
          </View>
        </View>
      </SafeAreaView>
    </View>
  );
}
