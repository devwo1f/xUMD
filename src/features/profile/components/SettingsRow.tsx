import React from 'react';
import { StyleSheet, Switch, Text, View, Pressable } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { colors } from '../../../shared/theme/colors';
import { typography } from '../../../shared/theme/typography';
import { spacing, borderRadius } from '../../../shared/theme/spacing';
import Badge from '../../../shared/components/Badge';

interface SettingsRowProps {
  icon: string;
  iconColor?: string;
  label: string;
  value?: string;
  onPress?: () => void;
  isToggle?: boolean;
  toggleValue?: boolean;
  onToggle?: (value: boolean) => void;
  danger?: boolean;
  disabled?: boolean;
  badge?: string;
}

const SettingsRow: React.FC<SettingsRowProps> = ({
  icon,
  iconColor,
  label,
  value,
  onPress,
  isToggle = false,
  toggleValue = false,
  onToggle,
  danger = false,
  disabled = false,
  badge,
}) => {
  const resolvedIconColor = danger
    ? colors.status.error
    : iconColor ?? colors.text.secondary;

  const labelColor = danger ? colors.status.error : colors.text.primary;

  const content = (
    <View style={[styles.row, disabled && styles.rowDisabled]}>
      <View style={styles.leftSection}>
        <MaterialCommunityIcons
          name={icon as never}
          size={22}
          color={resolvedIconColor}
        />
        <Text style={[styles.label, { color: labelColor }]}>{label}</Text>
        {badge ? (
          <Badge label={badge} color={colors.text.tertiary} size="sm" />
        ) : null}
      </View>

      <View style={styles.rightSection}>
        {isToggle ? (
          <Switch
            value={toggleValue}
            onValueChange={disabled ? undefined : onToggle}
            trackColor={{
              false: colors.gray[300],
              true: colors.primary.light,
            }}
            thumbColor={toggleValue ? colors.primary.main : colors.gray[100]}
            disabled={disabled}
          />
        ) : (
          <>
            {value ? (
              <Text style={styles.value} numberOfLines={1}>
                {value}
              </Text>
            ) : null}
            <Ionicons
              name="chevron-forward"
              size={20}
              color={colors.text.tertiary}
            />
          </>
        )}
      </View>
    </View>
  );

  if (isToggle || !onPress) {
    return content;
  }

  return (
    <Pressable
      onPress={disabled ? undefined : onPress}
      style={({ pressed }) => [pressed && styles.pressed]}
    >
      {content}
    </Pressable>
  );
};

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    minHeight: 52,
  },
  rowDisabled: {
    opacity: 0.5,
  },
  pressed: {
    opacity: 0.7,
  },
  leftSection: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: spacing.md,
  },
  rightSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    flexShrink: 0,
  },
  label: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.medium,
    color: colors.text.primary,
  },
  value: {
    fontSize: typography.fontSize.md,
    color: colors.text.tertiary,
    maxWidth: 160,
  },
});

export default SettingsRow;
