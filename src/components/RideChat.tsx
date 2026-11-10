import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  FlatList,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import {
  ErrorBanner,
  Field,
  LoadingBlock,
  PrimaryButton,
  SoftButton,
} from './ui';
import { getErrorMessage } from '../api/client';
import {
  getRideMessages,
  markMessagesAsRead,
  sendChatMessage,
} from '../api/chats';
import { useAuth } from '../context/AuthContext';
import { useResponsive } from '../hooks/useResponsive';
import { getUserIdFromAccessToken } from '../lib/jwt';
import { colors } from '../theme/colors';
import { useTypography } from '../theme/typography';
import type { GetRideMessagesResponse } from '../types/api';
import { MessageType } from '../types/enums';

type Props = {
  rideId: string;
  /** Messages pushed from SignalR */
  incomingMessage?: GetRideMessagesResponse | null;
  onIncomingConsumed?: () => void;
  compact?: boolean;
};

export function RideChat({
  rideId,
  incomingMessage,
  onIncomingConsumed,
  compact,
}: Props) {
  const { session } = useAuth();
  const type = useTypography();
  const { spacing, radius, ms } = useResponsive();
  const myId = useMemo(
    () => getUserIdFromAccessToken(session?.accessToken),
    [session?.accessToken],
  );

  const [messages, setMessages] = useState<GetRideMessagesResponse[]>([]);
  const [draft, setDraft] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const listRef = useRef<FlatList<GetRideMessagesResponse>>(null);

  const styles = useMemo(
    () =>
      StyleSheet.create({
        root: { flex: 1 },
        list: {
          flexGrow: 1,
          paddingVertical: spacing.sm,
          gap: spacing.sm,
        },
        bubbleMine: {
          alignSelf: 'flex-end',
          backgroundColor: colors.green,
          borderRadius: 18,
          borderBottomRightRadius: 6,
          paddingHorizontal: spacing.md,
          paddingVertical: spacing.sm + 2,
          maxWidth: '82%',
        },
        bubbleTheirs: {
          alignSelf: 'flex-start',
          backgroundColor: colors.surface,
          borderRadius: 18,
          borderBottomLeftRadius: 6,
          paddingHorizontal: spacing.md,
          paddingVertical: spacing.sm + 2,
          maxWidth: '82%',
          borderWidth: 1.5,
          borderColor: colors.border,
        },
        composer: {
          flexDirection: 'row',
          alignItems: 'flex-end',
          gap: spacing.sm,
          paddingTop: spacing.sm,
          borderTopWidth: 1,
          borderTopColor: colors.borderSoft,
        },
        inputWrap: { flex: 1 },
      }),
    [spacing, radius],
  );

  const load = useCallback(async () => {
    setError(null);
    try {
      const data = await getRideMessages(rideId);
      const sorted = [...(Array.isArray(data) ? data : [])].sort(
        (a, b) =>
          new Date(a.createdOn).getTime() - new Date(b.createdOn).getTime(),
      );
      setMessages(sorted);
      try {
        await markMessagesAsRead({ rideId });
      } catch {
        // read receipts are best-effort
      }
    } catch (e) {
      setError(getErrorMessage(e, 'Could not load chat'));
    } finally {
      setLoading(false);
    }
  }, [rideId]);

  useEffect(() => {
    setLoading(true);
    void load();
  }, [load]);

  useEffect(() => {
    if (!incomingMessage) return;
    setMessages((prev) => {
      if (prev.some((m) => m.id === incomingMessage.id)) return prev;
      return [...prev, incomingMessage];
    });
    onIncomingConsumed?.();
    void markMessagesAsRead({ rideId }).catch(() => undefined);
  }, [incomingMessage, onIncomingConsumed, rideId]);

  async function onSend() {
    const content = draft.trim();
    if (!content) return;
    setSending(true);
    setError(null);
    try {
      const result = await sendChatMessage({
        rideId,
        messageTypeId: MessageType.Text,
        content,
        mediaUrl: null,
        durationInSeconds: 0,
      });
      const optimistic: GetRideMessagesResponse = {
        id: result.id,
        senderId: myId || 'me',
        receiverId: '',
        messageTypeId: MessageType.Text,
        content,
        mediaUrl: null,
        durationInSeconds: 0,
        isRead: false,
        createdOn: result.createdOn || new Date().toISOString(),
      };
      setMessages((prev) =>
        prev.some((m) => m.id === optimistic.id) ? prev : [...prev, optimistic],
      );
      setDraft('');
      // Refresh to sync receiver ids / server ordering
      void load();
    } catch (e) {
      setError(getErrorMessage(e, 'Could not send message'));
    } finally {
      setSending(false);
    }
  }

  if (loading && messages.length === 0) {
    return <LoadingBlock label="Loading chat…" />;
  }

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={compact ? 0 : 64}
    >
      <ErrorBanner message={error} />
      <FlatList
        ref={listRef}
        data={messages}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        onContentSizeChange={() =>
          listRef.current?.scrollToEnd({ animated: true })
        }
        ListEmptyComponent={
          <Text style={[type.caption, { textAlign: 'center', marginTop: spacing.lg }]}>
            Say hi — chat unlocks once the driver accepts your ride.
          </Text>
        }
        renderItem={({ item }) => {
          const mine = !!myId && item.senderId === myId;
          const isVoice = item.messageTypeId === MessageType.Voice;
          return (
            <View style={mine ? styles.bubbleMine : styles.bubbleTheirs}>
              <Text
                style={[
                  type.body,
                  {
                    color: mine ? colors.textOnGreen : colors.text,
                    fontSize: ms(14),
                    lineHeight: ms(20),
                  },
                ]}
              >
                {isVoice
                  ? `Voice note${item.durationInSeconds ? ` · ${item.durationInSeconds}s` : ''}`
                  : item.content || '—'}
              </Text>
              <Text
                style={[
                  type.caption,
                  {
                    marginTop: 4,
                    color: mine ? 'rgba(255,255,255,0.75)' : colors.textMuted,
                    fontSize: ms(10),
                  },
                ]}
              >
                {new Date(item.createdOn).toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </Text>
            </View>
          );
        }}
      />
      <View style={styles.composer}>
        <View style={styles.inputWrap}>
          <Field
            placeholder="Type a message"
            value={draft}
            onChangeText={setDraft}
            editable={!sending}
            returnKeyType="send"
            onSubmitEditing={onSend}
            style={{ marginTop: 0 }}
          />
        </View>
        <View style={{ width: 96 }}>
          <PrimaryButton title="Send" onPress={onSend} loading={sending} />
        </View>
      </View>
      {!compact ? (
        <View style={{ marginTop: spacing.sm }}>
          <SoftButton title="Refresh" onPress={load} />
        </View>
      ) : null}
    </KeyboardAvoidingView>
  );
}
