/**
 * ResponsiveContainer
 *
 * Centers content on larger screens while keeping mobile full-width.
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
  const { isMobile, pageHorizontalPadding } = useResponsive();

  if (isMobile) {
    return <View style={[styles.mobileContainer, style]}>{children}</View>;
  }

  return (
    <View style={[styles.outer, { paddingHorizontal: pageHorizontalPadding }]}>
      <View style={[styles.inner, { maxWidth }, style]}>{children}</View>
    </View>
  );
};

const styles = StyleSheet.create({
  mobileContainer: {
    flex: 1,
  },
  outer: {
    flex: 1,
    alignItems: 'center',
  },
  inner: {
    flex: 1,
    width: '100%',
    paddingHorizontal: spacing.md,
  },
});

export default ResponsiveContainer;
