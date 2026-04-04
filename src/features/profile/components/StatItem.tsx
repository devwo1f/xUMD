import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors } from '../../../shared/theme/colors';
import { typography } from '../../../shared/theme/typography';
import { borderRadius, spacing } from '../../../shared/theme/spacing';

interface StatItemProps {
  count: string | number;
  label: string;
  onPress?: () => void;
}

const StatItem: React.FC<StatItemProps> = ({ count, label, onPress }) => {
  const content = (
    <>
      <Text style={styles.count}>{count}</Text>
      <Text style={styles.label}>{label}</Text>
    </>
  );

  if (onPress) {
    return (
      <Pressable onPress={onPress} style={[styles.container, styles.pressableContainer]}>
        {content}
      </Pressable>
    );
  }

  return <View style={styles.container}>{content}</View>;
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.sm,
  },
  pressableContainer: {
    borderRadius: borderRadius.md,
  },
  count: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    letterSpacing: typography.letterSpacing.tight,
    color: colors.text.primary,
  },
  label: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.semiBold,
    color: colors.text.secondary,
    textTransform: 'uppercase',
    letterSpacing: typography.letterSpacing.wider,
    marginTop: 2,
  },
});

export default StatItem;
