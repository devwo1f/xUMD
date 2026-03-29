import React from 'react';
import {
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { colors } from '../theme/colors';
import { typography } from '../theme/typography';
import { spacing, borderRadius } from '../theme/spacing';
import Badge from './Badge';

interface ClubData {
  id: string;
  name: string;
  category: string;
  logoUri?: string;
  memberCount: number;
  description?: string;
}

interface ClubCardProps {
  club: ClubData;
  onPress?: () => void;
}

const ClubCard: React.FC<ClubCardProps> = ({ club, onPress }) => {
  const categoryColor =
    (colors.clubCategory as Record<string, string>)[club.category.toLowerCase()] ??
    colors.gray[500];

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.7}
      style={styles.card}
    >
      {/* Logo */}
      {club.logoUri ? (
        <Image source={{ uri: club.logoUri }} style={styles.logo} />
      ) : (
        <View style={[styles.logo, styles.logoFallback]}>
          <Text style={styles.logoFallbackText}>
            {club.name.charAt(0).toUpperCase()}
          </Text>
        </View>
      )}

      {/* Info */}
      <View style={styles.info}>
        <Text style={styles.name} numberOfLines={1}>
          {club.name}
        </Text>
        <View style={styles.metaRow}>
          <Badge label={club.category} color={categoryColor} variant="filled" size="sm" />
          <Text style={styles.memberCount}>
            {club.memberCount} member{club.memberCount !== 1 ? 's' : ''}
          </Text>
        </View>
        {club.description && (
          <Text style={styles.description} numberOfLines={2}>
            {club.description}
          </Text>
        )}
      </View>

      {/* Chevron */}
      <Text style={styles.chevron}>{'›'}</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background.card,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
  },
  logo: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.md,
    resizeMode: 'cover',
  },
  logoFallback: {
    backgroundColor: colors.primary.lightest,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoFallbackText: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    color: colors.primary.main,
  },
  info: {
    flex: 1,
    marginLeft: spacing.sm,
  },
  name: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semiBold,
    color: colors.text.primary,
    marginBottom: 2,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  memberCount: {
    ...typography.textStyles.caption,
    color: colors.text.secondary,
    marginLeft: spacing.sm,
  },
  description: {
    ...typography.textStyles.caption,
    color: colors.text.secondary,
  },
  chevron: {
    fontSize: 24,
    color: colors.text.tertiary,
    marginLeft: spacing.sm,
  },
});

export default ClubCard;
