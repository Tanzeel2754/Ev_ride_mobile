import { LinearGradient } from 'expo-linear-gradient';
import { useRouter, type Href } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, {
  FadeIn,
  FadeInUp,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Atmosphere } from '../../src/components/ui';
import { hasCompletedOnboarding } from '../../src/lib/onboarding-storage';
import { colors, shadows } from '../../src/theme/colors';
import { fontFamily } from '../../src/theme/typography';

export default function SplashScreen() {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const markScale = useSharedValue(0.72);
  const markOpacity = useSharedValue(0);

  useEffect(() => {
    markScale.value = withSpring(1, { damping: 12, stiffness: 140 });
    markOpacity.value = withTiming(1, { duration: 480 });
  }, [markOpacity, markScale]);

  const markStyle = useAnimatedStyle(() => ({
    transform: [{ scale: markScale.value }],
    opacity: markOpacity.value,
  }));

  const styles = useMemo(
    () =>
      StyleSheet.create({
        root: {
          flex: 1,
          backgroundColor: colors.background,
        },
        content: {
          flex: 1,
          alignItems: 'center',
          justifyContent: 'center',
          paddingHorizontal: 32,
        },
        mark: {
          width: 88,
          height: 88,
          borderRadius: 28,
          overflow: 'hidden',
          marginBottom: 28,
          ...shadows.green,
        },
        markInner: {
          flex: 1,
          alignItems: 'center',
          justifyContent: 'center',
        },
        markText: {
          fontFamily: fontFamily.extraBold,
          fontSize: 28,
          color: '#fff',
          letterSpacing: -1,
        },
        wordmark: {
          flexDirection: 'row',
          alignItems: 'baseline',
        },
        brandGreen: {
          fontFamily: fontFamily.extraBold,
          fontSize: 44,
          color: colors.green,
          letterSpacing: -1.4,
        },
        brandDark: {
          fontFamily: fontFamily.extraBold,
          fontSize: 44,
          color: colors.charcoal,
          letterSpacing: -1.4,
        },
        tagline: {
          marginTop: 12,
          fontFamily: fontFamily.medium,
          fontSize: 14,
          color: colors.textSecondary,
          letterSpacing: 0.2,
        },
        rule: {
          width: 40,
          height: 4,
          borderRadius: 2,
          backgroundColor: colors.green,
          marginTop: 20,
        },
      }),
    [],
  );

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const done = await hasCompletedOnboarding();
      await new Promise((r) => setTimeout(r, 1100));
      if (cancelled) return;
      setReady(true);
      router.replace((done ? '/(auth)/sign-in' : '/(auth)/onboarding') as Href);
    })();
    return () => {
      cancelled = true;
    };
  }, [router]);

  return (
    <View style={styles.root}>
      <Atmosphere variant="mint" />
      <SafeAreaView style={styles.content}>
        <Animated.View style={[styles.mark, markStyle]}>
          <LinearGradient
            colors={[colors.green, colors.cyan, colors.greenDark]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.markInner}
          >
            <Text style={styles.markText}>EV</Text>
          </LinearGradient>
        </Animated.View>

        <Animated.View entering={FadeInUp.delay(180).springify()} style={styles.wordmark}>
          <Text style={styles.brandGreen}>EV</Text>
          <Text style={styles.brandDark}>Ride</Text>
        </Animated.View>
        <Animated.Text entering={FadeIn.delay(360)} style={styles.tagline}>
          Clean rides. Clear fares.
        </Animated.Text>
        <Animated.View entering={FadeIn.delay(420)} style={styles.rule} />
        {!ready ? <View style={{ height: 40, marginTop: 32 }} /> : null}
      </SafeAreaView>
    </View>
  );
}
