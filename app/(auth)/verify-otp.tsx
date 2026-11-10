import { useLocalSearchParams, useRouter } from 'expo-router';
import { useMemo, useRef, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Atmosphere,
  BackButton,
  ErrorBanner,
  PrimaryButton,
} from '../../src/components/ui';
import { useAuth, getErrorMessage } from '../../src/context/AuthContext';
import { useResponsive } from '../../src/hooks/useResponsive';
import { colors, shadows } from '../../src/theme/colors';
import { useTypography } from '../../src/theme/typography';
import type { LoginMethod } from '../../src/types/api';

const OTP_LEN = 6;

export default function VerifyOtpScreen() {
  const { verifyOtp } = useAuth();
  const router = useRouter();
  const { spacing, horizontalPadding, ms } = useResponsive();
  const type = useTypography();
  const params = useLocalSearchParams<{
    email?: string;
    phoneNumber?: string;
    name?: string;
    loginMethod?: string;
  }>();

  const loginMethod: LoginMethod = params.loginMethod === 'sms' ? 'sms' : 'email';
  const email = params.email ?? '';
  const phoneNumber = (params.phoneNumber ?? '').replace(/\D/g, '');
  const name = params.name ?? '';
  const destination =
    loginMethod === 'sms' ? phoneNumber || 'your phone' : email || 'your email';

  const [digits, setDigits] = useState<string[]>(Array(OTP_LEN).fill(''));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [focusedIndex, setFocusedIndex] = useState(0);
  const inputs = useRef<(TextInput | null)[]>([]);

  const styles = useMemo(
    () =>
      StyleSheet.create({
        root: { flex: 1, backgroundColor: colors.background },
        content: {
          flex: 1,
          paddingHorizontal: horizontalPadding,
          paddingTop: spacing.md,
        },
        heroCard: {
          borderRadius: 28,
          padding: spacing.lg,
          backgroundColor: colors.surface,
          borderWidth: 1.5,
          borderColor: colors.border,
          marginBottom: spacing.lg,
          alignItems: 'center',
          ...shadows.md,
        },
        boxes: {
          flexDirection: 'row',
          justifyContent: 'space-between',
          gap: spacing.sm,
          marginTop: spacing.md,
          marginBottom: spacing.lg,
        },
        box: {
          flex: 1,
          height: ms(58),
          borderRadius: 16,
          backgroundColor: colors.surface,
          borderWidth: 1.5,
          borderColor: colors.border,
          textAlign: 'center',
          fontSize: ms(22),
          fontFamily: 'PlusJakartaSans_800ExtraBold',
          color: colors.charcoal,
        },
        boxFocused: {
          borderColor: colors.green,
          backgroundColor: colors.greenLight,
        },
        boxFilled: {
          borderColor: 'rgba(0,184,92,0.4)',
        },
      }),
    [spacing, horizontalPadding, ms],
  );

  function setDigitAt(index: number, value: string) {
    const cleaned = value.replace(/\D/g, '');
    if (cleaned.length > 1) {
      const chars = cleaned.slice(0, OTP_LEN).split('');
      const next = Array(OTP_LEN)
        .fill('')
        .map((_, i) => chars[i] ?? '');
      setDigits(next);
      const focusAt = Math.min(chars.length, OTP_LEN - 1);
      inputs.current[focusAt]?.focus();
      return;
    }
    const next = [...digits];
    next[index] = cleaned;
    setDigits(next);
    if (cleaned && index < OTP_LEN - 1) inputs.current[index + 1]?.focus();
  }

  async function onSubmit() {
    setError(null);
    const otp = digits.join('');
    if (loginMethod === 'email' && !email) {
      setError('Missing email for verification.');
      return;
    }
    if (loginMethod === 'sms' && !phoneNumber) {
      setError('Missing phone number for verification.');
      return;
    }
    if (otp.length < 4) {
      setError('Enter the code from your email or SMS.');
      return;
    }

    setLoading(true);
    try {
      await verifyOtp(
        {
          email: loginMethod === 'email' ? email : undefined,
          phoneNumber: loginMethod === 'sms' ? phoneNumber : undefined,
          name: name || undefined,
          loginMethod,
        },
        otp,
      );
      router.replace('/(app)/passenger');
    } catch (e) {
      setError(getErrorMessage(e, 'OTP verification failed'));
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
          <View style={styles.content}>
            <BackButton onPress={() => router.back()} />

            <Animated.View entering={FadeInDown.springify()} style={styles.heroCard}>
              <Text style={type.eyebrow}>
                {loginMethod === 'sms' ? 'SMS verification' : 'Email verification'}
              </Text>
              <Text style={[type.h1, { textAlign: 'center', marginTop: spacing.xs }]}>
                Enter your code
              </Text>
              <Text style={[type.body, { textAlign: 'center', marginTop: spacing.sm }]}>
                Sent to {destination}
              </Text>
            </Animated.View>

            <ErrorBanner message={error} />

            <View style={styles.boxes}>
              {digits.map((d, i) => (
                <TextInput
                  key={i}
                  ref={(el) => {
                    inputs.current[i] = el;
                  }}
                  style={[
                    styles.box,
                    d ? styles.boxFilled : null,
                    focusedIndex === i ? styles.boxFocused : null,
                  ]}
                  value={d}
                  onChangeText={(v) => setDigitAt(i, v)}
                  onFocus={() => setFocusedIndex(i)}
                  onKeyPress={({ nativeEvent }) => {
                    if (nativeEvent.key === 'Backspace' && !digits[i] && i > 0) {
                      inputs.current[i - 1]?.focus();
                    }
                  }}
                  keyboardType="number-pad"
                  maxLength={OTP_LEN}
                  selectTextOnFocus
                />
              ))}
            </View>

            <PrimaryButton title="Verify & continue" onPress={onSubmit} loading={loading} />
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}
