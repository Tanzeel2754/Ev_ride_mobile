import { useMemo } from 'react';
import { TextStyle } from 'react-native';
import { useResponsive } from '../hooks/useResponsive';
import { colors } from './colors';

export const fontFamily = {
  regular: 'PlusJakartaSans_400Regular',
  medium: 'PlusJakartaSans_500Medium',
  semiBold: 'PlusJakartaSans_600SemiBold',
  bold: 'PlusJakartaSans_700Bold',
  extraBold: 'PlusJakartaSans_800ExtraBold',
} as const;

/** Static defaults — prefer useTypography() in components */
export const typography = {
  hero: {
    fontFamily: fontFamily.extraBold,
    fontSize: 36,
    color: colors.charcoal,
    letterSpacing: -1.2,
    lineHeight: 42,
  } satisfies TextStyle,
  h1: {
    fontFamily: fontFamily.extraBold,
    fontSize: 28,
    color: colors.charcoal,
    letterSpacing: -0.8,
    lineHeight: 34,
  } satisfies TextStyle,
  h2: {
    fontFamily: fontFamily.bold,
    fontSize: 20,
    color: colors.charcoal,
    letterSpacing: -0.3,
  } satisfies TextStyle,
  h3: {
    fontFamily: fontFamily.semiBold,
    fontSize: 16,
    color: colors.charcoal,
    letterSpacing: -0.2,
  } satisfies TextStyle,
  body: {
    fontFamily: fontFamily.regular,
    fontSize: 15,
    color: colors.textSecondary,
    lineHeight: 23,
  } satisfies TextStyle,
  caption: {
    fontFamily: fontFamily.medium,
    fontSize: 12,
    color: colors.textMuted,
    letterSpacing: 0.2,
  } satisfies TextStyle,
  eyebrow: {
    fontFamily: fontFamily.semiBold,
    fontSize: 11,
    color: colors.green,
    letterSpacing: 1.6,
    textTransform: 'uppercase',
  } satisfies TextStyle,
  button: {
    fontFamily: fontFamily.bold,
    fontSize: 15,
    letterSpacing: 0.2,
  } satisfies TextStyle,
} as const;

export function useTypography() {
  const { ms } = useResponsive();

  return useMemo(
    () => ({
      hero: {
        fontFamily: fontFamily.extraBold,
        fontSize: ms(36),
        color: colors.charcoal,
        letterSpacing: -1.2,
        lineHeight: ms(42),
      } satisfies TextStyle,
      h1: {
        fontFamily: fontFamily.extraBold,
        fontSize: ms(28),
        color: colors.charcoal,
        letterSpacing: -0.8,
        lineHeight: ms(34),
      } satisfies TextStyle,
      h2: {
        fontFamily: fontFamily.bold,
        fontSize: ms(20),
        color: colors.charcoal,
        letterSpacing: -0.3,
      } satisfies TextStyle,
      h3: {
        fontFamily: fontFamily.semiBold,
        fontSize: ms(16),
        color: colors.charcoal,
        letterSpacing: -0.2,
      } satisfies TextStyle,
      body: {
        fontFamily: fontFamily.regular,
        fontSize: ms(15),
        color: colors.textSecondary,
        lineHeight: ms(23),
      } satisfies TextStyle,
      caption: {
        fontFamily: fontFamily.medium,
        fontSize: ms(12),
        color: colors.textMuted,
        letterSpacing: 0.2,
      } satisfies TextStyle,
      eyebrow: {
        fontFamily: fontFamily.semiBold,
        fontSize: ms(11),
        color: colors.green,
        letterSpacing: 1.6,
        textTransform: 'uppercase' as const,
      } satisfies TextStyle,
      button: {
        fontFamily: fontFamily.bold,
        fontSize: ms(15),
        letterSpacing: 0.2,
      } satisfies TextStyle,
    }),
    [ms],
  );
}
