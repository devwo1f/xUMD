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
  compact?: boolean;
}

const FeatureCard: React.FC<FeatureCardProps> = ({
  title,
  subtitle,
  icon,
  accentColor,
  tintColor,
  onPress,
  style,
  compact = false,
}) => {
  return (
    <Pressable
      onPress={onPress}
      style={[styles.card, compact ? styles.cardCompact : null, { borderLeftColor: accentColor }, style]}
    >
      <View style={[styles.iconBubble, compact ? styles.iconBubbleCompact : null, { backgroundColor: tintColor }]}>
        <MaterialCommunityIcons name={icon as never} size={compact ? 20 : 22} color={accentColor} />
      </View>
      <Text style={[styles.title, compact ? styles.titleCompact : null]}>{title}</Text>
      <Text style={[styles.subtitle, compact ? styles.subtitleCompact : null]}>{subtitle}</Text>
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
  cardCompact: {
    padding: spacing.sm + 2,
  },
  iconBubble: {
    width: 44,
    height: 44,
    borderRadius: borderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  iconBubbleCompact: {
    width: 38,
    height: 38,
    marginBottom: spacing.sm,
  },
  title: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
  },
  titleCompact: {
    fontSize: typography.fontSize.lg,
  },
  subtitle: {
    fontSize: typography.fontSize.base,
    lineHeight: 22,
    color: colors.text.secondary,
    marginTop: spacing.xs,
  },
  subtitleCompact: {
    fontSize: typography.fontSize.sm,
    lineHeight: 18,
    marginTop: 2,
  },
});

export default FeatureCard;

