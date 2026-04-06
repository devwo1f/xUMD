import { useWindowDimensions } from 'react-native';
import { spacing } from '../theme/spacing';

export type Breakpoint = 'mobile' | 'tablet' | 'desktop';

export function useResponsive() {
  const { width, height } = useWindowDimensions();

  const breakpoint: Breakpoint =
    width >= 1180 ? 'desktop' : width >= 768 ? 'tablet' : 'mobile';

  const isMobile = breakpoint === 'mobile';
  const isTablet = breakpoint === 'tablet';
  const isDesktop = breakpoint === 'desktop';
  const isWide = width >= 768;
  const isLandscape = width > height;
  const contentMaxWidth = isDesktop ? 1320 : isTablet ? 980 : width;
  const pageHorizontalPadding = isDesktop
    ? spacing.xl * 1.5
    : isTablet
      ? spacing.lg
      : spacing.md;

  return {
    width,
    height,
    breakpoint,
    isMobile,
    isTablet,
    isDesktop,
    isWide,
    isLandscape,
    contentMaxWidth,
    pageHorizontalPadding,
    sidebarWidth: isDesktop ? 320 : isTablet ? 280 : 0,
    columns: isDesktop ? 3 : isTablet ? 2 : 1,
  };
}
