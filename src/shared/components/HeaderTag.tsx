import React, { type ComponentProps } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme/colors';
import { borderRadius, spacing } from '../theme/spacing';
import { typography } from '../theme/typography';

type IoniconName = ComponentProps<typeof Ionicons>['name'];

interface HeaderTagProps {
  icon: IoniconName;
  label: string;
  color?: string;
  tintColor?: string;
}

export default function HeaderTag({
  icon,
  label,
  color = colors.primary.main,
  tintColor = colors.primary.lightest,
}: HeaderTagProps) {
  return (
    <View style={[styles.container, { backgroundColor: tintColor }]}>
      <Ionicons name={icon} size={14} color={color} />
      <Text style={[styles.label, { color }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    borderRadius: borderRadius.full,
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: spacing.xs,
  },
  label: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.semiBold,
    letterSpacing: typography.letterSpacing.wider,
    textTransform: 'uppercase',
  },
});
