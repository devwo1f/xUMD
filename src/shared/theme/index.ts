/**
 * xUMD Unified Theme
 *
 * Single import for the entire design system:
 *   import { theme } from '@/shared/theme';
 */

export { colors, brand, gray, primary, secondary } from './colors';
export { text, background, border, status } from './colors';
export { clubCategory, eventCategory } from './colors';
export type { Colors } from './colors';

export { typography, fontFamily, fontSize, fontWeight } from './typography';
export { lineHeight, letterSpacing, textStyles } from './typography';
export type { Typography } from './typography';

export { spacing, borderRadius, layout, shadows } from './spacing';
export type { Spacing, BorderRadius, Layout, Shadows } from './spacing';

// ── Unified Theme Object ──────────────────────────────────────

import { colors } from './colors';
import { typography } from './typography';
import { spacing, borderRadius, layout, shadows } from './spacing';

export const theme = {
  colors,
  typography,
  spacing,
  borderRadius,
  layout,
  shadows,
} as const;

export type Theme = typeof theme;

export default theme;
