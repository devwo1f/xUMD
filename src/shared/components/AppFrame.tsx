import React from 'react';
import { StyleSheet, View } from 'react-native';
import { useResponsive } from '../hooks/useResponsive';
import { colors } from '../theme/colors';
import { spacing, borderRadius, shadows } from '../theme/spacing';

export default function AppFrame({ children }: { children: React.ReactNode }) {
  const { isMobile, isTablet } = useResponsive();

  if (isMobile) {
    return <View style={styles.mobile}>{children}</View>;
  }

  return (
    <View style={[styles.outer, isTablet ? styles.tabletOuter : styles.desktopOuter]}>
      <View style={[styles.inner, isTablet ? styles.tabletInner : styles.desktopInner]}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  mobile: {
    flex: 1,
    backgroundColor: colors.background.secondary,
  },
  outer: {
    flex: 1,
    backgroundColor: colors.background.tertiary,
  },
  tabletOuter: {
    padding: spacing.md,
  },
  desktopOuter: {
    padding: spacing.lg,
  },
  inner: {
    flex: 1,
    width: '100%',
    alignSelf: 'center',
    backgroundColor: colors.background.secondary,
    overflow: 'hidden',
  },
  tabletInner: {
    maxWidth: 1280,
    borderRadius: borderRadius.xl,
    ...shadows.md,
  },
  desktopInner: {
    maxWidth: 1480,
    borderRadius: borderRadius.xl,
    ...shadows.lg,
  },
});
