/**
 * PasswordRequirements
 *
 * Shows 3 requirements with green checkmark or gray circle:
 *  - At least 8 characters
 *  - At least 1 uppercase letter
 *  - At least 1 number
 */

import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../../shared/theme/colors';
import { typography } from '../../../shared/theme/typography';
import { spacing } from '../../../shared/theme/spacing';

interface PasswordRequirementsProps {
  password: string;
}

interface RequirementItemProps {
  label: string;
  met: boolean;
}

function RequirementItem({ label, met }: RequirementItemProps) {
  return (
    <View style={styles.row}>
      <Ionicons
        name={met ? 'checkmark-circle' : 'ellipse-outline'}
        size={18}
        color={met ? colors.status.success : colors.gray[400]}
      />
      <Text style={[styles.label, met && styles.labelMet]}>{label}</Text>
    </View>
  );
}

const PasswordRequirements: React.FC<PasswordRequirementsProps> = ({ password }) => {
  const hasMinLength = password.length >= 8;
  const hasUppercase = /[A-Z]/.test(password);
  const hasNumber = /[0-9]/.test(password);

  return (
    <View style={styles.container}>
      <RequirementItem label="At least 8 characters" met={hasMinLength} />
      <RequirementItem label="At least 1 uppercase letter" met={hasUppercase} />
      <RequirementItem label="At least 1 number" met={hasNumber} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    gap: spacing.sm,
    marginTop: spacing.sm,
    marginBottom: spacing.md,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  label: {
    fontSize: typography.fontSize.md,
    color: colors.text.secondary,
  },
  labelMet: {
    color: colors.status.success,
  },
});

export default PasswordRequirements;
