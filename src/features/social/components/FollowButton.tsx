import React from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';
import { colors } from '../../../shared/theme/colors';
import { borderRadius, spacing } from '../../../shared/theme/spacing';
import { typography } from '../../../shared/theme/typography';

interface FollowButtonProps {
  isFollowing: boolean;
  onPress: () => void;
  compact?: boolean;
}

export default function FollowButton({
  isFollowing,
  onPress,
  compact = false,
}: FollowButtonProps) {
  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.base,
        compact ? styles.compact : styles.regular,
        isFollowing ? styles.following : styles.follow,
      ]}
    >
      <Text style={[styles.label, isFollowing ? styles.followingLabel : styles.followLabel]}>
        {isFollowing ? 'Following' : 'Follow'}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: borderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  regular: {
    minWidth: 104,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  compact: {
    minWidth: 88,
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: spacing.xs + 2,
  },
  follow: {
    backgroundColor: colors.primary.main,
    borderColor: colors.primary.main,
  },
  following: {
    backgroundColor: colors.brand.white,
    borderColor: colors.border.default,
  },
  label: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semiBold,
  },
  followLabel: {
    color: colors.text.inverse,
  },
  followingLabel: {
    color: colors.text.primary,
  },
});
