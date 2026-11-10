import { useLocalSearchParams, useRouter } from 'expo-router';
import { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { RideChat } from '../../src/components/RideChat';
import { ErrorBanner, Screen, SoftButton } from '../../src/components/ui';
import { useChatRealtime } from '../../src/hooks/useChatRealtime';
import { useResponsive } from '../../src/hooks/useResponsive';
import { colors } from '../../src/theme/colors';
import { useTypography } from '../../src/theme/typography';

export default function ChatScreen() {
  const { rideId } = useLocalSearchParams<{ rideId?: string }>();
  const router = useRouter();
  const type = useTypography();
  const { spacing } = useResponsive();

  const { connected, incomingMessage, clearIncoming } = useChatRealtime({
    rideId,
    enabled: !!rideId,
  });

  const styles = useMemo(
    () =>
      StyleSheet.create({
        header: {
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: spacing.sm,
        },
        live: {
          color: connected ? colors.green : colors.textMuted,
          fontSize: 12,
        },
      }),
    [spacing, connected],
  );

  if (!rideId) {
    return (
      <Screen>
        <ErrorBanner message="Missing ride id for chat." />
        <SoftButton title="Go back" onPress={() => router.back()} />
      </Screen>
    );
  }

  return (
    <Screen>
      <View style={styles.header}>
        <View>
          <Text style={type.eyebrow}>Live trip</Text>
          <Text style={[type.h2, { marginTop: 2 }]}>Chat</Text>
        </View>
        <View
          style={{
            paddingHorizontal: 12,
            paddingVertical: 6,
            borderRadius: 12,
            backgroundColor: connected ? colors.greenMuted : colors.surfaceMuted,
          }}
        >
          <Text style={[type.caption, styles.live]}>
            {connected ? 'Realtime on' : 'Connecting…'}
          </Text>
        </View>
      </View>
      <RideChat
        rideId={rideId}
        incomingMessage={incomingMessage}
        onIncomingConsumed={clearIncoming}
      />
    </Screen>
  );
}
