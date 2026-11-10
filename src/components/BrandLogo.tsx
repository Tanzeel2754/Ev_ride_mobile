import { Image, StyleSheet, View, type ImageStyle, type ViewStyle } from 'react-native';
import { useResponsive } from '../hooks/useResponsive';
import { colors, shadows } from '../theme/colors';

const logoSource = require('../../assets/logo.jpg');

type Props = {
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'hero';
  variant?: 'default' | 'circular';
  style?: ViewStyle;
  imageStyle?: ImageStyle;
};

export default function BrandLogo({
  size = 'md',
  variant = 'default',
  style,
  imageStyle,
}: Props) {
  const { scale, heroLogoOuter, heroLogoInner } = useResponsive();

  if (variant === 'circular' && size === 'hero') {
    const outer = heroLogoOuter;
    const inner = heroLogoInner;
    const iconFrameHeight = inner * 1.65;

    return (
      <View style={[styles.heroOuter, { width: outer, height: outer }, style]}>
        <View style={[styles.heroInner, { width: inner, height: inner, borderRadius: inner / 2 }]}>
          <View style={[styles.heroClip, { width: inner, height: inner }]}>
            <Image
              source={logoSource}
              style={[{ width: inner, height: iconFrameHeight }, imageStyle]}
              resizeMode="contain"
              accessibilityLabel="EVRide logo"
            />
          </View>
        </View>
      </View>
    );
  }

  const sizeMap = {
    sm: { wrap: scale(48), img: scale(44) },
    md: { wrap: scale(72), img: scale(68) },
    lg: { wrap: scale(120), img: scale(112) },
    xl: { wrap: scale(180), img: scale(168) },
  };

  const dim = sizeMap[size as keyof typeof sizeMap];
  if (!dim) return null;

  const isCircular = variant === 'circular';

  return (
    <View
      style={[
        styles.wrap,
        { width: dim.wrap, height: dim.wrap, borderRadius: isCircular ? dim.wrap / 2 : scale(20) },
        isCircular && styles.wrapCircular,
        style,
      ]}
    >
      <Image
        source={logoSource}
        style={[
          isCircular ? styles.circularImage : { width: dim.img, height: dim.img },
          imageStyle,
        ]}
        resizeMode={isCircular ? 'cover' : 'contain'}
        accessibilityLabel="EVRide logo"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  wrapCircular: {
    backgroundColor: colors.surface,
    ...shadows.md,
  },
  circularImage: {
    width: '100%',
    height: '100%',
  },
  heroOuter: {
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 999,
    backgroundColor: 'rgba(70, 201, 107, 0.14)',
  },
  heroInner: {
    overflow: 'hidden',
    backgroundColor: colors.surface,
    ...shadows.md,
    borderWidth: 3,
    borderColor: colors.surface,
  },
  heroClip: {
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
});
