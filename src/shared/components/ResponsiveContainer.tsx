/**
 * ResponsiveContainer
 *
 * Wraps content for desktop: centers content with maxWidth, adds horizontal padding.
 * On mobile, just passes through at full width.
 */

import React from 'react';
import { StyleSheet, View, ViewStyle } from 'react-native';
import { useResponsive } from '../hooks/useResponsive';
import { spacing } from '../theme/spacing';

interface ResponsiveContainerProps {
  children: React.ReactNode;
  maxWidth?: number;
  style?: ViewStyle;
}

const ResponsiveContainer: React.FC<ResponsiveContainerProps> = ({
  children,
  maxWidth = 1200,
  style,
}) => {
  const { isMobile } = useResponsive();

  if (isMobile) {
    return <View style={[styles.mobileContainer, style]}>{children}</View>;
  }

  return (
    <View style={styles.desktopOuter}>
      <View style={[styles.desktopInner, { maxWidth }, style]}>{children}</View>
    </View>
  );
};

const styles = StyleSheet.create({
  mobileContainer: {
    flex: 1,
  },
  desktopOuter: {
    flex: 1,
    alignItems: 'center',
  },
  desktopInner: {
    flex: 1,
    width: '100%',
    paddingHorizontal: spacing.xl,
  },
});

export default ResponsiveContainer;
