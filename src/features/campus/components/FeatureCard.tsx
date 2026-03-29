/**
 * FeatureCard Component
 *
 * Card with colored left border accent, icon bubble, title, and subtitle.
 * Used on the Campus screen grid.
 */

import React from 'react';
import { Pressable, StyleProp, StyleSheet, Text, View, ViewStyle } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors } from '../../../shared/theme/colors';
import { typography } from '../../../shared/theme/typography';
import { spacing, borderRadius, shadows } from '../../../shared/theme/spacing';

interface FeatureCardProps {
  title: string;
  subtitle: string;
  icon: string;
  accentColor: string;
  tintColor: string;
  onPress: () => void;
  style?: StyleProp<ViewStyle>;
}

const FeatureCard: React.FC<FeatureCardProps> = ({
  title,
  subtitle,
  icon,
  accentColor,
  tintColor,
  onPress,
  style,
}) => {
  return (
    <Pressable
      onPress={onPress}
      style={[styles.card, { borderLeftColor: accentColor }, style]}
    >
      <View style={[styles.iconBubble, { backgroundColor: tintColor }]}>
        <MaterialCommunityIcons name={icon as never} size={22} color={accentColor} />
      </View>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.subtitle}>{subtitle}</Text>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.brand.white,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    borderLeftWidth: 4,
    ...shadows.md,
  },
  iconBubble: {
    width: 44,
    height: 44,
    borderRadius: borderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  title: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
  },
  subtitle: {
    fontSize: typography.fontSize.base,
    lineHeight: 22,
    color: colors.text.secondary,
    marginTop: spacing.xs,
  },
});

export default FeatureCard;

