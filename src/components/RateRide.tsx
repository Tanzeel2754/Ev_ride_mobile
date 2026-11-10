import { useCallback, useEffect, useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { getErrorMessage } from '../api/client';
import { createRating, getFeedbackOptions, getRideRating } from '../api/ratings';
import type { RatingFeedbackOption } from '../types/api';
import { RatingParticipantType } from '../types/enums';
import { useResponsive } from '../hooks/useResponsive';
import { colors } from '../theme/colors';
import { useTypography } from '../theme/typography';
import { ErrorBanner, Field, PrimaryButton, SoftButton } from './ui';

type Props = {
  rideId: string;
  /** Who the signed-in user is rating. */
  target: 'rider' | 'driver';
  onFinished?: () => void;
};

export function RateRide({ rideId, target, onFinished }: Props) {
  const type = useTypography();
  const { spacing, radius } = useResponsive();
  const [stars, setStars] = useState(5);
  const [comment, setComment] = useState('');
  const [options, setOptions] = useState<RatingFeedbackOption[]>([]);
  const [selected, setSelected] = useState<number[]>([]);
  const [canRate, setCanRate] = useState(true);
  const [hasRated, setHasRated] = useState(false);
  const [reason, setReason] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const participantType =
    target === 'rider' ? RatingParticipantType.Rider : RatingParticipantType.Driver;
  const title = target === 'rider' ? 'Rate the rider' : 'Rate your driver';

  const styles = useMemo(
    () =>
      StyleSheet.create({
        stars: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.sm },
        star: {
          width: 44,
          height: 44,
          borderRadius: 14,
          alignItems: 'center',
          justifyContent: 'center',
          borderWidth: 1.5,
          borderColor: colors.border,
          backgroundColor: colors.surface,
        },
        starOn: {
          backgroundColor: colors.green,
          borderColor: colors.green,
        },
        chips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginTop: spacing.sm },
        chip: {
          borderWidth: 1.5,
          borderColor: colors.border,
          borderRadius: 12,
          paddingHorizontal: spacing.sm + 2,
          paddingVertical: 8,
          backgroundColor: colors.surface,
        },
        chipOn: {
          backgroundColor: colors.greenMuted,
          borderColor: colors.green,
        },
        actions: { gap: spacing.sm, marginTop: spacing.md },
      }),
    [spacing, radius],
  );

  const load = useCallback(async () => {
    setError(null);
    setLoading(true);
    try {
      const [rating, feedback] = await Promise.all([
        getRideRating(rideId).catch(() => null),
        getFeedbackOptions(participantType).catch(() => [] as RatingFeedbackOption[]),
      ]);
      if (rating) {
        setCanRate(rating.canRate);
        setHasRated(rating.hasRated);
        setReason(rating.reason ?? null);
        if (rating.stars) setStars(rating.stars);
      }
      setOptions(feedback);
    } catch (e) {
      setError(getErrorMessage(e, 'Could not load rating'));
    } finally {
      setLoading(false);
    }
  }, [participantType, rideId]);

  useEffect(() => {
    load();
  }, [load]);

  function toggle(id: number) {
    setSelected((current) =>
      current.includes(id) ? current.filter((value) => value !== id) : [...current, id],
    );
  }

  async function onSubmit() {
    setSaving(true);
    setError(null);
    try {
      await createRating({
        rideId,
        stars,
        feedbackTypeIds: selected.length ? selected : null,
        comment: comment.trim() || null,
      });
      setHasRated(true);
      onFinished?.();
    } catch (e) {
      setError(getErrorMessage(e, 'Could not submit rating'));
    } finally {
      setSaving(false);
    }
  }

  if (loading) return null;

  if (hasRated) {
    return (
      <Text style={[type.body, { marginTop: spacing.sm }]}>
        Thanks — your rating was saved.
      </Text>
    );
  }

  if (!canRate) {
    return reason ? (
      <Text style={[type.caption, { marginTop: spacing.sm }]}>{reason}</Text>
    ) : null;
  }

  return (
    <View style={{ marginTop: spacing.sm }}>
      <Text style={type.h3}>{title}</Text>
      <View style={styles.stars}>
        {[1, 2, 3, 4, 5].map((value) => (
          <Pressable
            key={value}
            onPress={() => setStars(value)}
            style={[styles.star, value <= stars && styles.starOn]}
          >
            <Text style={{ color: value <= stars ? colors.textOnGreen : colors.navy }}>
              {value}
            </Text>
          </Pressable>
        ))}
      </View>
      {options.length ? (
        <View style={styles.chips}>
          {options.map((option) => {
            const on = selected.includes(option.id);
            return (
              <Pressable
                key={option.id}
                onPress={() => toggle(option.id)}
                style={[styles.chip, on && styles.chipOn]}
              >
                <Text style={type.caption}>{option.label || option.code || `Option ${option.id}`}</Text>
              </Pressable>
            );
          })}
        </View>
      ) : null}
      <Field
        placeholder="Comment (optional)"
        value={comment}
        onChangeText={setComment}
        multiline
      />
      <ErrorBanner message={error} />
      <View style={styles.actions}>
        <PrimaryButton title="Submit rating" onPress={onSubmit} loading={saving} />
        {onFinished ? <SoftButton title="Not now" onPress={onFinished} /> : null}
      </View>
    </View>
  );
}
