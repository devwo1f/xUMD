/**
 * JoinRequestCard Component
 *
 * Displays a pending join request with approve/reject actions.
 */

import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Avatar from '../../../shared/components/Avatar';
import { colors } from '../../../shared/theme/colors';
import { typography } from '../../../shared/theme/typography';
import { spacing, borderRadius, shadows } from '../../../shared/theme/spacing';
import type { User } from '../../../shared/types';

interface JoinRequestCardProps {
  user: User;
  requestedAt: string;
  onApprove: () => void;
  onReject: () => void;
  onOpenProfile?: () => void;
}

function formatTimeAgo(dateStr: string): string {
  const now = new Date();
  const date = new Date(dateStr);
  const diffMs = now.getTime() - date.getTime();
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffHours / 24);

  if (diffDays > 0) return `${diffDays}d ago`;
  if (diffHours > 0) return `${diffHours}h ago`;
  return 'Just now';
}

const JoinRequestCard: React.FC<JoinRequestCardProps> = ({
  user,
  requestedAt,
  onApprove,
  onReject,
  onOpenProfile,
}) => {
  return (
    <View style={styles.card}>
      <Pressable
        onPress={onOpenProfile}
        disabled={!onOpenProfile}
        style={({ pressed }) => [styles.topRow, onOpenProfile && pressed ? styles.topRowPressed : null]}
      >
        <Avatar uri={user.avatar_url} name={user.display_name} size="md" />
        <View style={styles.info}>
          <Text style={styles.name}>{user.display_name}</Text>
          <Text style={styles.meta}>
            {user.major ?? 'Undeclared'} {user.graduation_year ? `'${String(user.graduation_year).slice(-2)}` : ''}
          </Text>
        </View>
        <Text style={styles.timestamp}>{formatTimeAgo(requestedAt)}</Text>
      </Pressable>

      <View style={styles.actions}>
        <Pressable style={styles.approveButton} onPress={onApprove}>
          <Text style={styles.approveText}>Approve</Text>
        </Pressable>
        <Pressable style={styles.rejectButton} onPress={onReject}>
          <Text style={styles.rejectText}>Reject</Text>
        </Pressable>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.brand.white,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
    ...shadows.md,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  topRowPressed: {
    opacity: 0.8,
  },
  info: {
    flex: 1,
    marginLeft: spacing.md,
  },
  name: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
  },
  meta: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
    marginTop: 2,
  },
  timestamp: {
    fontSize: typography.fontSize.xs,
    color: colors.text.tertiary,
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  approveButton: {
    flex: 1,
    backgroundColor: colors.status.success + '1A',
    borderWidth: 1,
    borderColor: colors.status.success,
    borderRadius: borderRadius.md,
    paddingVertical: spacing.sm,
    alignItems: 'center',
  },
  approveText: {
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.semiBold,
    color: colors.status.success,
  },
  rejectButton: {
    flex: 1,
    backgroundColor: colors.status.error + '1A',
    borderWidth: 1,
    borderColor: colors.status.error,
    borderRadius: borderRadius.md,
    paddingVertical: spacing.sm,
    alignItems: 'center',
  },
  rejectText: {
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.semiBold,
    color: colors.status.error,
  },
});

export default JoinRequestCard;
