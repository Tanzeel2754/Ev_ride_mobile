import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
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
import { useAuth, getErrorMessage } from '../../src/context/AuthContext';
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

export default function RegisterScreen() {
  const { signUp } = useAuth();
  const router = useRouter();
  const { spacing, horizontalPadding } = useResponsive();
  const type = useTypography();
  const [loginMethod, setLoginMethod] = useState<LoginMethod>('email');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [agreed, setAgreed] = useState(true);

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
        form: { marginTop: spacing.md },
        checkRow: {
          flexDirection: 'row',
          alignItems: 'center',
          gap: spacing.sm,
          marginTop: spacing.md,
          padding: spacing.md,
          borderRadius: 16,
          backgroundColor: colors.surface,
          borderWidth: 1.5,
          borderColor: colors.border,
        },
        check: {
          width: 24,
          height: 24,
          borderRadius: 8,
          borderWidth: 2,
          borderColor: colors.green,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: agreed ? colors.green : colors.surface,
        },
        footer: { marginTop: 'auto' as const, paddingTop: spacing.xl, alignItems: 'center' },
      }),
    [spacing, horizontalPadding, agreed],
  );

  async function onSubmit() {
    setError(null);
    const address = email.trim().toLowerCase();
    const phone = digitsOnly(phoneNumber);

    if (!name.trim()) {
      setError('Name is required.');
      return;
    }
    if (loginMethod === 'email' && !isEmail(address)) {
      setError('Enter a valid email address.');
      return;
    }
    if (loginMethod === 'sms' && phone.length < 8) {
      setError('Enter a valid phone number (digits only).');
      return;
    }
    if (!agreed) {
      setError('Please agree to the terms to continue.');
      return;
    }

    const identity = {
      name: name.trim(),
      email: loginMethod === 'email' ? address : undefined,
      phoneNumber: loginMethod === 'sms' ? phone : undefined,
      loginMethod,
    };

    setLoading(true);
    try {
      await signUp(identity);
      router.push({
        pathname: '/(auth)/verify-otp',
        params: {
          email: identity.email ?? '',
          phoneNumber: identity.phoneNumber ?? '',
          name: identity.name,
          loginMethod,
        },
      });
    } catch (e) {
      const msg = getErrorMessage(e, 'Registration failed');
      if (/already exists/i.test(msg)) {
        router.replace({
          pathname: '/(auth)/sign-in',
          params: {
            email: identity.email ?? '',
            phoneNumber: identity.phoneNumber ?? '',
            name: identity.name,
            loginMethod,
          },
        });
        return;
      }
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <View style={styles.root}>
      <Atmosphere variant="cyan" />
      <SafeAreaView style={{ flex: 1 }}>
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
            <BackButton onPress={() => router.back()} />

            <Animated.View entering={FadeInDown.springify()} style={styles.heroCard}>
              <Text style={type.eyebrow}>Create account</Text>
              <Text style={[type.h1, { marginTop: spacing.xs }]}>Join EV Ride</Text>
              <Text style={[type.body, { marginTop: spacing.sm }]}>
                Register with email or SMS to receive a verification code.
              </Text>
            </Animated.View>

            <ErrorBanner message={error} />

            <LoginMethodToggle value={loginMethod} onChange={setLoginMethod} />

            <View style={styles.form}>
              <IconField
                icon="Aa"
                placeholder="Full name"
                value={name}
                onChangeText={setName}
                autoCapitalize="words"
              />
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
            </View>

            <Pressable style={styles.checkRow} onPress={() => setAgreed((v) => !v)}>
              <View style={styles.check}>
                {agreed ? (
                  <Text style={{ color: '#fff', fontSize: 12, fontFamily: 'PlusJakartaSans_700Bold' }}>
                    ✓
                  </Text>
                ) : null}
              </View>
              <Text style={[type.caption, { color: colors.charcoal, flex: 1 }]}>
                I agree to the terms & conditions
              </Text>
            </Pressable>

            <View style={{ marginTop: spacing.xl }}>
              <PrimaryButton title="Create account" onPress={onSubmit} loading={loading} />
            </View>

            <View style={styles.footer}>
              <Text style={type.body}>
                Already have an account?{' '}
                <Text
                  style={{ color: colors.green, fontFamily: 'PlusJakartaSans_700Bold' }}
                  onPress={() => router.push('/(auth)/sign-in')}
                >
                  Sign in
                </Text>
              </Text>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}
