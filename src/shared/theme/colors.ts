/**
 * xUMD Color System
 *
 * UMD brand colors with semantic tokens for consistent theming
 * across the entire application.
 */

// ── Brand Colors ──────────────────────────────────────────────

export const brand = {
  red: '#E21833',
  gold: '#FFD200',
  dark: '#1A1A2E',
  white: '#FFFFFF',
  black: '#000000',
} as const;

// ── Neutral / Gray Scale ──────────────────────────────────────

export const gray = {
  50: '#F9FAFB',
  100: '#F3F4F6',
  200: '#E5E7EB',
  300: '#D1D5DB',
  400: '#9CA3AF',
  500: '#6B7280',
  600: '#4B5563',
  700: '#374151',
  800: '#1F2937',
  900: '#111827',
} as const;

// ── Primary Palette ───────────────────────────────────────────

export const primary = {
  lightest: '#FDE8EB',
  light: '#F0707E',
  main: brand.red,
  dark: '#B5132A',
  darkest: '#8A0E20',
} as const;

// ── Secondary Palette ─────────────────────────────────────────

export const secondary = {
  lightest: '#FFF8CC',
  light: '#FFE566',
  main: brand.gold,
  dark: '#CCAA00',
  darkest: '#997F00',
} as const;

// ── Text Colors ───────────────────────────────────────────────

export const text = {
  primary: gray[900],
  secondary: gray[600],
  tertiary: gray[400],
  inverse: brand.white,
  link: primary.main,
  disabled: gray[300],
} as const;

// ── Background Colors ─────────────────────────────────────────

export const background = {
  primary: brand.white,
  secondary: gray[50],
  tertiary: gray[100],
  dark: brand.dark,
  overlay: 'rgba(0, 0, 0, 0.5)',
  card: brand.white,
  input: gray[50],
} as const;

// ── Border Colors ─────────────────────────────────────────────

export const border = {
  light: gray[200],
  default: gray[300],
  dark: gray[400],
  focused: primary.main,
} as const;

// ── Status Colors ─────────────────────────────────────────────

export const status = {
  success: '#16A34A',
  successLight: '#DCFCE7',
  warning: '#EAB308',
  warningLight: '#FEF9C3',
  error: '#DC2626',
  errorLight: '#FEE2E2',
  info: '#2563EB',
  infoLight: '#DBEAFE',
} as const;

// ── Club Category Colors ──────────────────────────────────────

export const clubCategory = {
  academic: '#2563EB',
  sports: '#16A34A',
  cultural: '#9333EA',
  professional: '#0891B2',
  social: '#F97316',
  arts: '#EC4899',
  service: '#14B8A6',
  greek: '#8B5CF6',
  other: gray[500],
} as const;

// ── Event Category Colors ─────────────────────────────────────

export const eventCategory = {
  social: '#F97316',
  academic: '#2563EB',
  career: '#0891B2',
  sports: '#16A34A',
  arts: '#EC4899',
  workshop: '#EAB308',
  other: gray[500],
} as const;

// ── Unified Export ────────────────────────────────────────────

export const colors = {
  brand,
  gray,
  primary,
  secondary,
  text,
  background,
  border,
  status,
  clubCategory,
  eventCategory,
} as const;

export type Colors = typeof colors;
