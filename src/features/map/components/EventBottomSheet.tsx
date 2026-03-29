/**
 * EventBottomSheet
 *
 * Quick preview of an event shown when tapping a map pin.
 * Shows category badge, title, time, location, and action buttons.
 */

import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { format } from 'date-fns';
import Badge from '../../../shared/components/Badge';
import Button from '../../../shared/components/Button';
import BottomSheet from '../../../shared/components/BottomSheet';
import { colors } from '../../../shared/theme/colors';
import { typography } from '../../../shared/theme/typography';
import { spacing } from '../../../shared/theme/spacing';
import type { Event } from '../../../shared/types';

interface EventBottomSheetProps {
  event: Event | null;
  visible: boolean;
  onClose: () => void;
  onViewDetail: (eventId: string) => void;
  onRSVP: (eventId: string) => void;
  secondaryActionLabel?: string;
  onSecondaryAction?: (eventId: string) => void;
}

const EventBottomSheet: React.FC<EventBottomSheetProps> = ({
  event,
  visible,
  onClose,
  onViewDetail,
  onRSVP,
  secondaryActionLabel,
  onSecondaryAction,
}) => {
  if (!event) return null;

  const categoryColor =
    colors.eventCategory[event.category as keyof typeof colors.eventCategory] ??
    colors.gray[500];

  const formattedDate = (() => {
    try {
      return format(new Date(event.starts_at), 'EEE, MMM d \u00b7 h:mm a');
    } catch {
      return event.starts_at;
    }
  })();

  return (
    <BottomSheet visible={visible} onClose={onClose}>
      <View style={styles.content}>
        <Badge label={event.category} color={categoryColor} />
        <Text style={styles.title} numberOfLines={2}>
          {event.title}
        </Text>

        <View style={styles.metaRow}>
          <Ionicons name="time-outline" size={16} color={colors.text.secondary} />
          <Text style={styles.metaText}>{formattedDate}</Text>
        </View>

        <View style={styles.metaRow}>
          <Ionicons name="location-outline" size={16} color={colors.text.secondary} />
          <Text style={styles.metaText}>{event.location_name}</Text>
        </View>

        {event.rsvp_count > 0 && (
          <View style={styles.metaRow}>
            <Ionicons name="people-outline" size={16} color={colors.text.secondary} />
            <Text style={styles.metaText}>
              {event.rsvp_count.toLocaleString()} going
              {event.max_capacity
                ? ` / ${event.max_capacity.toLocaleString()} spots`
                : ''}
            </Text>
          </View>
        )}

        <Text style={styles.description} numberOfLines={2}>
          {event.description}
        </Text>

        <View style={styles.actions}>
          <View style={styles.actionButtons}>
            <Button
              title="RSVP"
              onPress={() => onRSVP(event.id)}
              size="md"
              style={styles.actionButton}
            />
            {secondaryActionLabel && onSecondaryAction ? (
              <Button
                title={secondaryActionLabel}
                onPress={() => onSecondaryAction(event.id)}
                size="md"
                variant="secondary"
                style={styles.actionButton}
              />
            ) : null}
          </View>
          <Pressable
            onPress={() => onViewDetail(event.id)}
            style={styles.detailLink}
          >
            <Text style={styles.detailLinkText}>View Details</Text>
            <Ionicons
              name="chevron-forward"
              size={16}
              color={colors.primary.main}
            />
          </Pressable>
        </View>
      </View>
    </BottomSheet>
  );
};

const styles = StyleSheet.create({
  content: {
    gap: spacing.sm,
    paddingTop: spacing.sm,
    paddingBottom: spacing.lg,
  },
  title: {
    fontSize: typography.fontSize['2xl'],
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  metaText: {
    fontSize: typography.fontSize.md,
    color: colors.text.secondary,
  },
  description: {
    fontSize: typography.fontSize.md,
    lineHeight: typography.fontSize.md * 1.5,
    color: colors.text.primary,
    marginTop: spacing.xs,
  },
  actions: {
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  actionButton: {
    flex: 1,
  },
  detailLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: spacing.sm,
  },
  detailLinkText: {
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.semiBold,
    color: colors.primary.main,
  },
});

export default EventBottomSheet;
