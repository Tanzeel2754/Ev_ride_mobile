import { useMemo } from 'react';
import { useWindowDimensions } from 'react-native';

/** Design reference: iPhone 14 */
export const BASE_WIDTH = 390;
export const BASE_HEIGHT = 844;

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

export function createScale(width: number, height: number) {
  const widthRatio = clamp(width / BASE_WIDTH, 0.82, 1.2);
  const heightRatio = clamp(height / BASE_HEIGHT, 0.82, 1.15);

  const scale = (size: number) => Math.round(size * widthRatio);
  const vScale = (size: number) => Math.round(size * heightRatio);
  const ms = (size: number) => Math.round((scale(size) + vScale(size)) / 2);

  const spacing = {
    xs: scale(4),
    sm: scale(8),
    md: scale(16),
    lg: scale(24),
    xl: scale(32),
    xxl: scale(48),
  };

  const radius = {
    sm: scale(14),
    md: scale(18),
    lg: scale(24),
    xl: scale(32),
    full: 999,
  };

  return { scale, vScale, ms, spacing, radius, widthRatio, heightRatio };
}

export function useResponsive() {
  const { width, height, fontScale } = useWindowDimensions();

  return useMemo(() => {
    const { scale, vScale, ms, spacing, radius } = createScale(width, height);

    const isSmallScreen = width < 360 || height < 680;
    const isShortScreen = height < 740;
    const isLargeScreen = width >= 414;

    return {
      width,
      height,
      fontScale,
      scale,
      vScale,
      ms,
      spacing,
      radius,
      isSmallScreen,
      isShortScreen,
      isLargeScreen,
      horizontalPadding: scale(24),
      contentMaxWidth: Math.min(width - scale(40), 440),
      bottomSheetMaxHeight: clamp(height * (isShortScreen ? 0.52 : 0.46), 260, 480),
      mapAreaMinHeight: clamp(height * 0.42, 240, 460),
      heroLogoOuter: ms(isSmallScreen ? 190 : 220),
      heroLogoInner: ms(isSmallScreen ? 148 : 172),
      wordmarkSize: ms(isSmallScreen ? 28 : 32),
    };
  }, [width, height, fontScale]);
}

export type ResponsiveMetrics = ReturnType<typeof useResponsive>;
