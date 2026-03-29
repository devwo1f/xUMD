import { useWindowDimensions } from 'react-native';

export type Breakpoint = 'mobile' | 'tablet' | 'desktop';

export function useResponsive() {
  const { width, height } = useWindowDimensions();

  const breakpoint: Breakpoint =
    width >= 1024 ? 'desktop' : width >= 768 ? 'tablet' : 'mobile';

  return {
    width,
    height,
    breakpoint,
    isMobile: breakpoint === 'mobile',
    isTablet: breakpoint === 'tablet',
    isDesktop: breakpoint === 'desktop',
    isWide: width >= 768,
    contentMaxWidth: breakpoint === 'desktop' ? 1200 : breakpoint === 'tablet' ? 900 : width,
    sidebarWidth: breakpoint === 'desktop' ? 280 : 0,
    columns: breakpoint === 'desktop' ? 3 : breakpoint === 'tablet' ? 2 : 1,
  };
}
