/**
 * xUMD Spacing & Layout System
 *
 * Consistent spacing scale, border radii, and common layout constants.
 */

// ── Spacing Scale ─────────────────────────────────────────────

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
} as const;

// ── Border Radius ─────────────────────────────────────────────

export const borderRadius = {
  none: 0,
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  full: 9999,
} as const;

// ── Layout Constants ──────────────────────────────────────────

export const layout = {
  /** Maximum content width for tablet/web layouts */
  maxContentWidth: 600,

  /** Standard horizontal screen padding */
  screenPaddingHorizontal: spacing.md,

  /** Standard vertical screen padding */
  screenPaddingVertical: spacing.md,

  /** Height of the top navigation header */
  headerHeight: 56,

  /** Height of the bottom tab bar */
  tabBarHeight: 64,

  /** Standard card padding */
  cardPadding: spacing.md,

  /** Standard card elevation (Android shadow) */
  cardElevation: 2,

  /** Standard icon size for nav/tab icons */
  iconSize: 24,

  /** Small icon size for inline icons */
  iconSizeSmall: 16,

  /** Large icon size for feature icons */
  iconSizeLarge: 32,

  /** Avatar sizes */
  avatarSmall: 32,
  avatarMedium: 48,
  avatarLarge: 72,

  /** Standard button height */
  buttonHeight: 48,

  /** Standard text input height */
  inputHeight: 48,

  /** Standard divider/separator thickness */
  divider: 1,

  /** Standard hit slop for touchable elements */
  hitSlop: { top: 8, right: 8, bottom: 8, left: 8 },
} as const;

// ── Shadow Presets ────────────────────────────────────────────

export const shadows = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
} as const;

// ── Unified Export ────────────────────────────────────────────

export const spacingModule = {
  spacing,
  borderRadius,
  layout,
  shadows,
} as const;

export type Spacing = typeof spacing;
export type BorderRadius = typeof borderRadius;
export type Layout = typeof layout;
export type Shadows = typeof shadows;
