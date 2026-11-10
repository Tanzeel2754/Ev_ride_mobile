import { useFocusEffect, useRouter, type Href } from 'expo-router';
import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Atmosphere, BackButton, ErrorBanner, PrimaryButton } from '../../../src/components/ui';
import { getErrorMessage } from '../../../src/api/client';
import { uploadProfileImage } from '../../../src/api/driver';
import { useAuth } from '../../../src/context/AuthContext';
import { useResponsive } from '../../../src/hooks/useResponsive';
import {
  getLocalAvatarUri,
  setLocalAvatarUri,
} from '../../../src/lib/avatar-storage';
import { pickImage } from '../../../src/lib/pick-document';
import { colors, shadows } from '../../../src/theme/colors';
import { useTypography } from '../../../src/theme/typography';

const MENU: {
  label: string;
  hint: string;
  href?: Href;
  action?: 'driver';
}[] = [
  { label: 'Ride history', hint: 'Past trips & receipts', href: '/(app)/passenger/history' },
  { label: 'Contact & help', hint: 'Support in one tap', href: '/(app)/contact' },
  { label: 'Drive with EV Ride', hint: 'Switch to driver mode', action: 'driver' },
  { label: 'Settings', hint: 'Alerts & account', href: '/(app)/settings' as Href },
];

export default function PassengerProfile() {
  const { session, signOut } = useAuth();
  const router = useRouter();
  const { spacing, horizontalPadding, scale } = useResponsive();
  const type = useTypography();
  const [avatarUri, setAvatarUri] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const styles = StyleSheet.create({
    root: { flex: 1, backgroundColor: colors.background },
    content: { paddingHorizontal: horizontalPadding, paddingBottom: spacing.xl },
    hero: {
      borderRadius: 28,
      padding: spacing.lg,
      marginBottom: spacing.lg,
      overflow: 'hidden',
      borderWidth: 1.5,
      borderColor: colors.border,
      alignItems: 'center',
      ...shadows.md,
    },
    avatarWrap: {
      alignSelf: 'center',
      marginBottom: spacing.md,
    },
    avatarRing: {
      width: scale(104),
      height: scale(104),
      borderRadius: scale(32),
      padding: 3,
      ...shadows.green,
    },
    avatarInner: {
      flex: 1,
      borderRadius: scale(29),
      backgroundColor: colors.greenLight,
      alignItems: 'center',
      justifyContent: 'center',
      overflow: 'hidden',
      borderWidth: 2,
      borderColor: colors.surface,
    },
    cameraBadge: {
      position: 'absolute',
      right: 0,
      bottom: 0,
      width: 34,
      height: 34,
      borderRadius: 12,
      backgroundColor: colors.green,
      borderWidth: 2,
      borderColor: colors.surface,
      alignItems: 'center',
      justifyContent: 'center',
      ...shadows.sm,
    },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.surface,
      borderRadius: 20,
      paddingVertical: spacing.md,
      paddingHorizontal: spacing.md,
      marginBottom: spacing.sm,
      gap: spacing.md,
      borderWidth: 1.5,
      borderColor: colors.border,
      ...shadows.sm,
    },
    icon: {
      width: 44,
      height: 44,
      borderRadius: 14,
      backgroundColor: colors.greenLight,
      borderWidth: 1,
      borderColor: 'rgba(0,184,92,0.22)',
      alignItems: 'center',
      justifyContent: 'center',
    },
    chevron: {
      marginLeft: 'auto',
      color: colors.green,
      fontSize: 20,
      fontFamily: 'PlusJakartaSans_700Bold',
    },
  });

  const initial = (session?.name || session?.email || 'U').trim().charAt(0).toUpperCase();

  const loadAvatar = useCallback(async () => {
    const uri = await getLocalAvatarUri(session?.email);
    setAvatarUri(uri);
  }, [session?.email]);

  useFocusEffect(
    useCallback(() => {
      void loadAvatar();
    }, [loadAvatar]),
  );

  async function onUploadPhoto() {
    setError(null);
    try {
      const file = await pickImage();
      if (!file) return;
      setUploading(true);

      await setLocalAvatarUri(session?.email, file.uri);
      setAvatarUri(file.uri);

      try {
        await uploadProfileImage(file.uri, file.name, file.mimeType);
      } catch {
        // Rider-only accounts may not have this endpoint — local avatar still works.
      }
    } catch (e) {
      setError(getErrorMessage(e, 'Could not update profile picture'));
    } finally {
      setUploading(false);
    }
  }

  return (
    <View style={styles.root}>
      <Atmosphere />
      <SafeAreaView style={{ flex: 1 }} edges={['top', 'left', 'right']}>
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <BackButton onPress={() => router.back()} />

          <Animated.View entering={FadeInDown.springify()} style={styles.hero}>
            <LinearGradient
              colors={[colors.greenLight, colors.cyanLight, colors.surface]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={StyleSheet.absoluteFill}
            />
            <Pressable style={styles.avatarWrap} onPress={onUploadPhoto} disabled={uploading}>
              <LinearGradient
                colors={[colors.green, colors.cyan, colors.greenDark]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.avatarRing}
              >
                <View style={styles.avatarInner}>
                  {avatarUri ? (
                    <Image source={{ uri: avatarUri }} style={{ width: '100%', height: '100%' }} />
                  ) : (
                    <Text style={[type.hero, { color: colors.green, fontSize: scale(36) }]}>
                      {initial}
                    </Text>
                  )}
                  {uploading ? (
                    <View
                      style={[
                        StyleSheet.absoluteFill,
                        {
                          backgroundColor: 'rgba(8,40,68,0.35)',
                          alignItems: 'center',
                          justifyContent: 'center',
                        },
                      ]}
                    >
                      <ActivityIndicator color="#fff" />
                    </View>
                  ) : null}
                </View>
              </LinearGradient>
              <View style={styles.cameraBadge}>
                <Text style={{ color: '#fff', fontSize: 13, fontFamily: 'PlusJakartaSans_700Bold' }}>
                  +
                </Text>
              </View>
            </Pressable>
            <Text style={[type.caption, { textAlign: 'center', marginBottom: spacing.sm }]}>
              Tap photo to upload
            </Text>
            <Text style={[type.h2, { textAlign: 'center' }]}>{session?.name || 'Rider'}</Text>
            <Text style={[type.body, { textAlign: 'center' }]}>
              {session?.loginMethod === 'sms'
                ? session?.phoneNumber || '—'
                : session?.email || session?.phoneNumber || '—'}
            </Text>
          </Animated.View>

          <ErrorBanner message={error} />

          {MENU.map((item, i) => (
            <Animated.View key={item.label} entering={FadeInDown.delay(80 * (i + 1)).springify()}>
              <Pressable
                style={({ pressed }) => [
                  styles.row,
                  pressed && {
                    borderColor: colors.green,
                    backgroundColor: colors.greenLight,
                    transform: [{ scale: 0.99 }],
                  },
                ]}
                onPress={() => {
                  if (item.action === 'driver') {
                    router.replace('/(app)/driver');
                    return;
                  }
                  if (item.href) router.push(item.href);
                }}
              >
                <View style={styles.icon}>
                  <View
                    style={{
                      width: 10,
                      height: 10,
                      borderRadius: 5,
                      backgroundColor: i % 2 === 0 ? colors.green : colors.cyan,
                    }}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={type.h3}>{item.label}</Text>
                  <Text style={[type.caption, { marginTop: 2 }]}>{item.hint}</Text>
                </View>
                <Text style={styles.chevron}>›</Text>
              </Pressable>
            </Animated.View>
          ))}

          <View style={{ marginTop: spacing.lg }}>
            <PrimaryButton
              title="Sign out"
              onPress={async () => {
                await signOut();
                router.replace('/(auth)/splash');
              }}
            />
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}
