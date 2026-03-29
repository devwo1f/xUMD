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
import { spacing, borderRadius, shadows } from '../theme/spacing';
import Badge from './Badge';

interface EventData {
  id: string;
  title: string;
  imageUri?: string;
  category: string;
  time: string;
  location: string;
}

interface EventCardProps {
  event: EventData;
  onPress?: () => void;
}

const EventCard: React.FC<EventCardProps> = ({ event, onPress }) => {
  const categoryColor =
    (colors.eventCategory as Record<string, string>)[event.category.toLowerCase()] ??
    colors.gray[500];

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.7}
      style={styles.card}
    >
      {event.imageUri && (
        <Image source={{ uri: event.imageUri }} style={styles.image} />
      )}
      <View style={styles.info}>
        <Badge label={event.category} color={categoryColor} variant="filled" size="sm" />
        <Text style={styles.title} numberOfLines={2}>
          {event.title}
        </Text>
        <View style={styles.detailRow}>
          <Text style={styles.detailIcon}>{'🕐'}</Text>
          <Text style={styles.detailText} numberOfLines={1}>
            {event.time}
          </Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.detailIcon}>{'📍'}</Text>
          <Text style={styles.detailText} numberOfLines={1}>
            {event.location}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    backgroundColor: colors.background.card,
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
    ...shadows.md,
  },
  image: {
    width: 110,
    height: '100%',
    resizeMode: 'cover',
  },
  info: {
    flex: 1,
    padding: spacing.sm,
    justifyContent: 'center',
  },
  title: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semiBold,
    color: colors.text.primary,
    marginTop: spacing.xs,
    marginBottom: spacing.xs,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  detailIcon: {
    fontSize: 13,
    marginRight: spacing.xs,
  },
  detailText: {
    ...typography.textStyles.caption,
    color: colors.text.secondary,
    flex: 1,
  },
});

export default EventCard;
