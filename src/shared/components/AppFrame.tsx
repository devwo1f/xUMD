import React from 'react';
import { StyleSheet, View } from 'react-native';
import { useResponsive } from '../hooks/useResponsive';
import { colors } from '../theme/colors';
import { spacing, borderRadius, shadows } from '../theme/spacing';

export default function AppFrame({ children }: { children: React.ReactNode }) {
  const { isDesktop } = useResponsive();

  if (!isDesktop) {
    return <View style={styles.mobile}>{children}</View>;
  }

  return (
    <View style={styles.desktopOuter}>
      <View style={styles.desktopInner}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  mobile: {
    flex: 1,
    backgroundColor: colors.background.secondary,
  },
  desktopOuter: {
    flex: 1,
    backgroundColor: colors.background.tertiary,
    padding: spacing.lg,
  },
  desktopInner: {
    flex: 1,
    width: '100%',
    maxWidth: 1480,
    alignSelf: 'center',
    backgroundColor: colors.background.secondary,
    borderRadius: borderRadius.xl,
    overflow: 'hidden',
    ...shadows.lg,
  },
});
