import React from 'react';
import { StyleSheet, Text, View, ViewStyle, TextStyle } from 'react-native';
import { colors } from '../theme/colors';
import { typography } from '../theme/typography';
import { spacing, borderRadius } from '../theme/spacing';

type BadgeVariant = 'filled' | 'outlined';
type BadgeSize = 'sm' | 'md';

interface BadgeProps {
  label: string;
  color?: string;
  variant?: BadgeVariant;
  size?: BadgeSize;
}

const Badge: React.FC<BadgeProps> = ({
  label,
  color = colors.primary.main,
  variant = 'filled',
  size = 'sm',
}) => {
  const isFilled = variant === 'filled';
  const isSmall = size === 'sm';

  const containerStyle: ViewStyle[] = [
    styles.base,
    {
      paddingHorizontal: isSmall ? spacing.sm : spacing.md,
      paddingVertical: isSmall ? 2 : spacing.xs,
    },
    isFilled
      ? { backgroundColor: color + '1A' } // 10% opacity
      : { borderWidth: 1, borderColor: color, backgroundColor: 'transparent' },
  ];

  const textStyle: TextStyle = {
    fontSize: isSmall ? typography.fontSize.xs : typography.fontSize.sm,
    fontWeight: typography.fontWeight.semiBold,
    color: color,
  };

  return (
    <View style={containerStyle}>
      <Text style={textStyle} numberOfLines={1}>
        {label}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  base: {
    borderRadius: borderRadius.xl,
    alignSelf: 'flex-start',
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default Badge;
