import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import {
  Card,
  ErrorBanner,
  Field,
  Label,
  PrimaryButton,
  Screen,
  SoftButton,
  Title,
} from '../../src/components/ui';
import { getErrorMessage } from '../../src/api/client';
import { createContactUs, type ContactUsRequest } from '../../src/api/contact-us';
import { useAuth } from '../../src/context/AuthContext';
import { useResponsive } from '../../src/hooks/useResponsive';
import { colors } from '../../src/theme/colors';
import { useTypography } from '../../src/theme/typography';

export default function ContactScreen() {
  const router = useRouter();
  const { session } = useAuth();
  const { spacing } = useResponsive();
  const type = useTypography();

  const styles = useMemo(
    () =>
      StyleSheet.create({
        container: {
          gap: spacing.sm,
          paddingTop: spacing.sm,
          paddingBottom: spacing.xl,
        },
        success: {
          color: colors.green,
          marginTop: spacing.sm,
          fontSize: 14,
          fontFamily: 'PlusJakartaSans_600SemiBold',
        },
      }),
    [spacing],
  );

  const [name, setName] = useState(session?.name ?? '');
  const [email, setEmail] = useState(session?.email ?? '');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');

  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  async function onSubmit() {
    setError(null);
    setSuccess(null);

    if (!subject.trim()) {
      setError('Subject is required.');
      return;
    }
    if (!message.trim() || message.trim().length < 10) {
      setError('Please enter a message (min 10 characters).');
      return;
    }

    setSending(true);
    try {
      const payload: ContactUsRequest = {
        name: name.trim() ? name.trim() : null,
        email: email.trim() ? email.trim() : null,
        phoneNumber: phoneNumber.trim() ? phoneNumber.trim() : null,
        subject: subject.trim(),
        message: message.trim(),
      };

      const result = await createContactUs(payload);
      if (!result.isSuccess) throw new Error(result.message || 'Request failed');

      setSuccess('Message sent successfully. We will get back to you soon.');
      setMessage('');
    } catch (e) {
      setError(getErrorMessage(e, 'Could not send your message.'));
    } finally {
      setSending(false);
    }
  }

  return (
    <Screen>
      <View style={{ marginTop: spacing.md }}>
        <Label>Support</Label>
        <Title>Contact us</Title>
        <Text style={[type.body, { marginBottom: spacing.sm }]}>
          We usually reply within one business day.
        </Text>
      </View>

      <ScrollView
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.container}
      >
        <ErrorBanner message={error} />

        <Card accent>
          <Field placeholder="Your name" value={name} onChangeText={setName} />
          <Field placeholder="Email (optional)" value={email} onChangeText={setEmail} />
          <Field
            placeholder="Phone number (optional)"
            value={phoneNumber}
            onChangeText={setPhoneNumber}
            keyboardType="phone-pad"
          />
          <Field placeholder="Subject" value={subject} onChangeText={setSubject} />
          <Field
            placeholder="Message"
            value={message}
            onChangeText={setMessage}
            multiline
            numberOfLines={5}
            style={{ height: 120, textAlignVertical: 'top' }}
          />

          {success ? <Text style={styles.success}>{success}</Text> : null}

          <View style={{ marginTop: spacing.md, gap: spacing.sm }}>
            <PrimaryButton title="Send message" onPress={onSubmit} loading={sending} />
            <SoftButton title="Back" onPress={() => router.back()} disabled={sending} />
          </View>
        </Card>
      </ScrollView>
    </Screen>
  );
}
