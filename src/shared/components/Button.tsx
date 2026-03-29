import React from 'react';
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { colors } from '../theme/colors';
import { typography } from '../theme/typography';
import { spacing, borderRadius } from '../theme/spacing';

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: ButtonVariant;
  loading?: boolean;
  disabled?: boolean;
  icon?: React.ReactNode;
  size?: ButtonSize;
  fullWidth?: boolean;
  style?: ViewStyle;
}

const sizeStyles: Record<ButtonSize, { height: number; paddingHorizontal: number; fontSize: number }> = {
  sm: { height: 32, paddingHorizontal: spacing.sm, fontSize: typography.fontSize.sm },
  md: { height: 44, paddingHorizontal: spacing.md, fontSize: typography.fontSize.base },
  lg: { height: 52, paddingHorizontal: spacing.xl, fontSize: typography.fontSize.lg },
};

const Button: React.FC<ButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  loading = false,
  disabled = false,
  icon,
  size = 'md',
  fullWidth = false,
  style,
}) => {
  const isDisabled = disabled || loading;
  const sizeConfig = sizeStyles[size];

  const containerStyle: ViewStyle[] = [
    styles.base,
    {
      height: sizeConfig.height,
      paddingHorizontal: sizeConfig.paddingHorizontal,
    },
    variant === 'primary' && styles.primaryContainer,
    variant === 'secondary' && styles.secondaryContainer,
    variant === 'ghost' && styles.ghostContainer,
    variant === 'danger' && styles.dangerContainer,
    fullWidth && styles.fullWidth,
    isDisabled && styles.disabled,
    style as ViewStyle,
  ].filter(Boolean) as ViewStyle[];

  const textColor = (): string => {
    if (isDisabled) return colors.text.disabled;
    switch (variant) {
      case 'primary':
        return colors.brand.white;
      case 'secondary':
        return colors.primary.main;
      case 'ghost':
        return colors.primary.main;
      case 'danger':
        return colors.brand.white;
      default:
        return colors.brand.white;
    }
  };

  const textStyle: TextStyle = {
    fontSize: sizeConfig.fontSize,
    fontWeight: typography.fontWeight.semiBold,
    color: textColor(),
  };

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={isDisabled}
      activeOpacity={0.7}
      style={containerStyle}
    >
      {loading ? (
        <ActivityIndicator size="small" color={textColor()} />
      ) : (
        <View style={styles.content}>
          {icon && <View style={styles.iconWrapper}>{icon}</View>}
          <Text style={textStyle}>{title}</Text>
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: borderRadius.md,
  },
  primaryContainer: {
    backgroundColor: colors.primary.main,
  },
  secondaryContainer: {
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: colors.primary.main,
  },
  ghostContainer: {
    backgroundColor: 'transparent',
  },
  dangerContainer: {
    backgroundColor: colors.status.error,
  },
  fullWidth: {
    width: '100%',
  },
  disabled: {
    opacity: 0.5,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconWrapper: {
    marginRight: spacing.xs,
  },
});

export default Button;
