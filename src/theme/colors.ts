/**
 * Light-mode palette matched to https://evride-dev.vercel.app/
 * Source CSS vars: --green, --ink, --mint, --cyan, --background, etc.
 */
export const colors = {
  // Brand — EVRide green
  green: '#17A84B',
  greenDark: '#087B3A',
  greenLight: '#EAF8EF',
  greenMuted: 'rgba(23, 168, 75, 0.14)',
  greenSoft: 'rgba(23, 168, 75, 0.08)',

  // Soft cyan wash from site (--cyan) + a saturated companion for accents/pins
  cyan: '#1E9EB0',
  cyanLight: '#DFF6FA',
  cyanMuted: 'rgba(30, 158, 176, 0.14)',

  // Ink / neutrals (--ink / --foreground / --muted-foreground)
  charcoal: '#082844',
  gray: '#556570',
  grayLight: '#F0F4F5',

  // Navy kept as alias → ink
  navy: '#082844',
  navyMid: '#1A3A52',
  navyLight: '#556570',

  // Surfaces (--background / --card / --muted / --secondary)
  background: '#F7FAF9',
  backgroundAlt: '#F0F4F5',
  surface: '#FFFFFF',
  surfaceElevated: '#FFFFFF',
  surfaceMuted: '#EDF5F4',
  surfaceGlass: 'rgba(255, 255, 255, 0.88)',

  // Text
  text: '#082844',
  textSecondary: '#556570',
  textMuted: '#7A8B94',
  textOnGreen: '#FFFFFF',
  textOnNavy: '#FFFFFF',

  // Borders & dividers (--border / --line / --ring)
  border: '#D9E5E7',
  borderFocus: '#17A84B',
  borderSoft: 'rgba(8, 40, 68, 0.06)',

  // Semantic
  danger: '#EF4444',
  dangerBg: '#FEF2F2',
  warning: '#E8A317',
  warningBg: '#FFF8EB',
  success: '#17A84B',
  successBg: '#EAF8EF',

  // Map / hero atmosphere (mint → mist → cyan wash)
  mapFrom: '#F7FAF9',
  mapMid: '#EAF8EF',
  mapTo: '#DFF6FA',
  mapGrid: 'rgba(23, 168, 75, 0.07)',
  mapGlow: 'rgba(23, 168, 75, 0.14)',

  // Atmosphere orbs
  orbMint: 'rgba(23, 168, 75, 0.16)',
  orbCyan: 'rgba(30, 158, 176, 0.14)',
  orbInk: 'rgba(8, 40, 68, 0.04)',

  // Legacy aliases
  dark: '#082844',
  accent: '#17A84B',
  fg: '#082844',
  muted: '#556570',
  black: '#000000',
  surface2: '#EDF5F4',
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
} as const;

export const radius = {
  sm: 12,
  md: 14,
  lg: 18,
  xl: 24,
  full: 999,
} as const;

export const shadows = {
  sm: {
    shadowColor: '#082844',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 2,
  },
  md: {
    shadowColor: '#082844',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.07,
    shadowRadius: 20,
    elevation: 4,
  },
  lg: {
    shadowColor: '#082844',
    shadowOffset: { width: 0, height: 14 },
    shadowOpacity: 0.1,
    shadowRadius: 28,
    elevation: 8,
  },
  green: {
    shadowColor: '#087B3A',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.18,
    shadowRadius: 22,
    elevation: 5,
  },
} as const;
