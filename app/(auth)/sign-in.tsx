import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LoginMethodToggle } from '../../src/components/LoginMethodToggle';
import {
  Atmosphere,
  BackButton,
  ErrorBanner,
  IconField,
  PrimaryButton,
} from '../../src/components/ui';
import { getErrorMessage, useAuth } from '../../src/context/AuthContext';
import { getLoginHint } from '../../src/lib/auth-storage';
import { useResponsive } from '../../src/hooks/useResponsive';
import { colors, shadows } from '../../src/theme/colors';
import { useTypography } from '../../src/theme/typography';
import type { LoginMethod } from '../../src/types/api';

function isEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function digitsOnly(value: string) {
  return value.replace(/\D/g, '');
}

export default function SignInScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    email?: string;
    name?: string;
    phoneNumber?: string;
    loginMethod?: string;
  }>();
  const { requestOtp, signInWithRefresh } = useAuth();
  const { spacing, horizontalPadding } = useResponsive();
  const type = useTypography();

  const [loginMethod, setLoginMethod] = useState<LoginMethod>(
    params.loginMethod === 'sms' ? 'sms' : 'email',
  );
  const [name, setName] = useState(params.name ?? '');
  const [email, setEmail] = useState(params.email ?? '');
  const [phoneNumber, setPhoneNumber] = useState(params.phoneNumber ?? '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (params.email || params.name || params.phoneNumber || params.loginMethod) return;
    getLoginHint().then((hint) => {
      if (hint.loginMethod) setLoginMethod(hint.loginMethod);
      if (hint.email) setEmail(hint.email);
      if (hint.phoneNumber) setPhoneNumber(hint.phoneNumber);
      if (hint.name) setName(hint.name ?? '');
    });
  }, [params.email, params.name, params.phoneNumber, params.loginMethod]);

  const styles = useMemo(
    () =>
      StyleSheet.create({
        root: { flex: 1, backgroundColor: colors.background },
        content: {
          paddingHorizontal: horizontalPadding,
          paddingTop: spacing.md,
          paddingBottom: spacing.xl,
          flexGrow: 1,
        },
        heroCard: {
          borderRadius: 28,
          padding: spacing.lg,
          backgroundColor: colors.surface,
          borderWidth: 1.5,
          borderColor: colors.border,
          marginBottom: spacing.lg,
          ...shadows.md,
        },
        footer: { marginTop: 'auto' as const, paddingTop: spacing.xl, alignItems: 'center' },
        form: { marginTop: spacing.md, gap: 4 },
      }),
    [spacing, horizontalPadding],
  );

  async function onSubmit() {
    setError(null);
    const displayName = name.trim();
    const address = email.trim().toLowerCase();
    const phone = digitsOnly(phoneNumber);

    if (loginMethod === 'email' && !isEmail(address)) {
      setError('Enter a valid email address.');
      return;
    }
    if (loginMethod === 'sms' && phone.length < 8) {
      setError('Enter a valid phone number (digits only).');
      return;
    }

    const identity = {
      name: displayName || undefined,
      email: loginMethod === 'email' ? address : undefined,
      phoneNumber: loginMethod === 'sms' ? phone : undefined,
      loginMethod,
    };

    setLoading(true);
    try {
      const refreshed = await signInWithRefresh(identity);
      if (refreshed) {
        router.replace('/(app)/passenger');
        return;
      }

      try {
        await requestOtp(identity);
      } catch (e) {
        const msg = getErrorMessage(e, 'Could not sign in');
        if (!/already exists/i.test(msg)) throw e;
      }

      router.push({
        pathname: '/(auth)/verify-otp',
        params: {
          email: identity.email ?? '',
          phoneNumber: identity.phoneNumber ?? '',
          name: displayName,
          loginMethod,
        },
      });
    } catch (e) {
      setError(getErrorMessage(e, 'Could not sign in'));
    } finally {
      setLoading(false);
    }
  }

  return (
    <View style={styles.root}>
      <Atmosphere />
      <SafeAreaView style={{ flex: 1 }}>
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
            <BackButton onPress={() => router.back()} />

            <Animated.View entering={FadeInDown.springify()} style={styles.heroCard}>
              <Text style={type.eyebrow}>Welcome back</Text>
              <Text style={[type.h1, { marginTop: spacing.xs }]}>Sign in</Text>
              <Text style={[type.body, { marginTop: spacing.sm }]}>
                Choose email or SMS to receive a verification code.
              </Text>
            </Animated.View>

            <ErrorBanner message={error} />

            <LoginMethodToggle value={loginMethod} onChange={setLoginMethod} />

            <View style={styles.form}>
              {loginMethod === 'email' ? (
                <IconField
                  icon="@"
                  placeholder="Email"
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoComplete="email"
                  autoCorrect={false}
                />
              ) : (
                <IconField
                  icon="#"
                  placeholder="Phone number"
                  value={phoneNumber}
                  onChangeText={setPhoneNumber}
                  keyboardType="phone-pad"
                  autoComplete="tel"
                />
              )}
              <IconField
                icon="Aa"
                placeholder="Name (optional)"
                value={name}
                onChangeText={setName}
                autoCapitalize="words"
              />
            </View>

            <View style={{ marginTop: spacing.xl }}>
              <PrimaryButton title="Continue" onPress={onSubmit} loading={loading} />
            </View>

            <View style={styles.footer}>
              <Text style={type.body}>
                Don&apos;t have an account?{' '}
                <Text
                  style={{ color: colors.green, fontFamily: 'PlusJakartaSans_700Bold' }}
                  onPress={() => router.push('/(auth)/register')}
                >
                  Sign up
                </Text>
              </Text>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}
