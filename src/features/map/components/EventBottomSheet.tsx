import React from 'react';
import { Image, Pressable, ScrollView, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import Avatar from '../../../shared/components/Avatar';
import Badge from '../../../shared/components/Badge';
import BottomSheet from '../../../shared/components/BottomSheet';
import Button from '../../../shared/components/Button';
import Card from '../../../shared/components/Card';
import { colors } from '../../../shared/theme/colors';
import { borderRadius, spacing } from '../../../shared/theme/spacing';
import { typography } from '../../../shared/theme/typography';
import type { Event } from '../../../shared/types';
import { getContextualTimeLabel, isEventLive } from '../utils/eventDiscovery';

type RsvpState = 'going' | 'interested' | null;

interface HostClubPreview {
  id: string;
  name: string;
  logoUrl?: string | null;
}

interface EventBottomSheetProps {
  event: Event | null;
  visible: boolean;
  onClose: () => void;
  onViewDetail: (eventId: string) => void;
  onToggleGoing?: (eventId: string) => void;
  onToggleInterested?: (eventId: string) => void;
  rsvpState?: RsvpState;
  hostClub?: HostClubPreview | null;
  onOpenHostClub?: (clubId: string) => void;
  secondaryActionLabel?: string;
  onSecondaryAction?: (eventId: string) => void;
}

function getCategoryIconName(category: Event['category']) {
  switch (category) {
    case 'academic':
      return 'school-outline';
    case 'social':
      return 'account-group-outline';
    case 'sports':
      return 'basketball';
    case 'career':
      return 'briefcase-outline';
    case 'arts':
      return 'palette-outline';
    case 'food':
      return 'silverware-fork-knife';
    case 'workshop':
      return 'hammer-wrench';
    case 'party':
      return 'party-popper';
    case 'club':
      return 'flag-outline';
    default:
      return 'map-marker-outline';
  }
}

const EventBottomSheet: React.FC<EventBottomSheetProps> = ({
  event,
  visible,
  onClose,
  onViewDetail,
  onToggleGoing,
  onToggleInterested,
  rsvpState = null,
  hostClub = null,
  onOpenHostClub,
  secondaryActionLabel,
  onSecondaryAction,
}) => {
  const { width } = useWindowDimensions();
  const isWide = width >= 768;

  if (!event) {
    return null;
  }

  const categoryColor =
    colors.eventCategory[event.category as keyof typeof colors.eventCategory] ?? colors.primary.main;
  const goingCount = event.attendee_count ?? event.rsvp_count ?? 0;
  const interestedCount = event.interested_count ?? 0;

  return (
    <BottomSheet visible={visible} onClose={onClose} snapPoints={[0.58]} minHeight={360}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.content, isWide ? styles.contentWide : null]}
      >
        <Card style={styles.summaryCard}>
          {event.image_url ? (
            <Image source={{ uri: event.image_url }} style={[styles.heroImage, isWide ? styles.heroImageWide : null]} />
          ) : (
            <View style={styles.heroFallback}>
              <MaterialCommunityIcons
                name={getCategoryIconName(event.category)}
                size={32}
                color={categoryColor}
              />
            </View>
          )}

          <View style={styles.summaryBody}>
            <View style={styles.badgeRow}>
              <Badge label={event.category} color={categoryColor} />
              {isEventLive(event) ? <Badge label="Live now" color={colors.status.error} /> : null}
            </View>

            <View style={styles.header}>
              <Text style={styles.eyebrow}>Event preview</Text>
              <Text style={styles.title}>{event.title}</Text>
              <Text style={styles.subtitle}>
                {event.location_name} - {event.organizer_name ?? 'xUMD'}
              </Text>
            </View>

            {hostClub ? (
              <Pressable
                onPress={() => onOpenHostClub?.(hostClub.id)}
                style={({ pressed }) => [
                  styles.hostClubRow,
                  pressed ? styles.pressed : null,
                ]}
              >
                <Avatar uri={hostClub.logoUrl} name={hostClub.name} size="md" />
                <View style={styles.hostClubCopy}>
                  <Text style={styles.hostClubLabel}>Hosted by</Text>
                  <Text style={styles.hostClubName}>{hostClub.name}</Text>
                </View>
                <Ionicons name="arrow-forward" size={16} color={colors.text.tertiary} />
              </Pressable>
            ) : null}
          </View>
        </Card>

        <View style={styles.infoTiles}>
          <Card style={styles.infoTile}>
            <View style={styles.infoTileHeader}>
              <Ionicons name="calendar-outline" size={16} color={colors.primary.main} />
              <Text style={styles.infoTileLabel}>Date and time</Text>
            </View>
            <Text style={styles.infoTileValue}>{getContextualTimeLabel(event)}</Text>
          </Card>
          <Card style={styles.infoTile}>
            <View style={styles.infoTileHeader}>
              <Ionicons name="location-outline" size={16} color={colors.primary.main} />
              <Text style={styles.infoTileLabel}>Location</Text>
            </View>
            <Text style={styles.infoTileValue}>{event.location_name}</Text>
          </Card>
        </View>

        <Card style={styles.rsvpSummaryCard}>
          <View style={styles.rsvpSummaryRow}>
            <View style={styles.rsvpSummaryIcon}>
              <Ionicons name="people-outline" size={16} color={colors.primary.main} />
            </View>
            <View style={styles.rsvpSummaryCopy}>
              <Text style={styles.rsvpSummaryTitle}>{goingCount} going</Text>
              <Text style={styles.rsvpSummarySubtitle}>{interestedCount} interested</Text>
            </View>
          </View>

          {onToggleGoing || onToggleInterested ? (
            <View style={styles.buttonRow}>
              {onToggleGoing ? (
                <Button
                  title={rsvpState === 'going' ? 'Going' : 'RSVP'}
                  onPress={() => onToggleGoing(event.id)}
                  fullWidth
                  style={rsvpState === 'going' ? StyleSheet.flatten([styles.flexButton, styles.goingButton]) : styles.flexButton}
                />
              ) : null}
              {onToggleInterested ? (
                <Button
                  title={rsvpState === 'interested' ? 'Saved' : 'Save'}
                  onPress={() => onToggleInterested(event.id)}
                  variant="secondary"
                  fullWidth
                  style={styles.flexButton}
                />
              ) : null}
            </View>
          ) : null}
        </Card>

        <Card style={styles.infoPanel}>
          <Text style={styles.infoPanelTitle}>About this event</Text>
          <Text style={styles.infoText} numberOfLines={3}>
            {event.description}
          </Text>
          <Pressable onPress={() => onViewDetail(event.id)} style={({ pressed }) => [styles.viewDetailsRow, pressed ? styles.pressed : null]}>
            <Text style={styles.viewDetailsText}>View Details</Text>
            <Ionicons name="arrow-up" size={14} color={colors.primary.main} />
          </Pressable>
        </Card>

        {secondaryActionLabel && onSecondaryAction ? (
          <Button
            title={secondaryActionLabel}
            onPress={() => onSecondaryAction(event.id)}
            variant="ghost"
            fullWidth
          />
        ) : null}
      </ScrollView>
    </BottomSheet>
  );
};

const styles = StyleSheet.create({
  content: {
    gap: spacing.md,
    paddingBottom: spacing.xl,
  },
  contentWide: {
    width: '100%',
    maxWidth: 920,
    alignSelf: 'center',
  },
  summaryCard: {
    padding: 0,
    overflow: 'hidden',
  },
  heroImage: {
    width: '100%',
    height: 208,
  },
  heroImageWide: {
    height: 236,
  },
  heroFallback: {
    height: 156,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background.secondary,
  },
  summaryBody: {
    gap: spacing.md,
    padding: spacing.md,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  header: {
    gap: spacing.xs,
  },
  eyebrow: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.semiBold,
    letterSpacing: typography.letterSpacing.wider,
    textTransform: 'uppercase',
    color: colors.primary.main,
  },
  title: {
    fontSize: typography.fontSize['2xl'],
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
  },
  subtitle: {
    fontSize: typography.fontSize.base,
    lineHeight: 22,
    color: colors.text.secondary,
  },
  hostClubRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.background.secondary,
    borderWidth: 1,
    borderColor: colors.primary.lightest,
  },
  hostClubCopy: {
    flex: 1,
  },
  hostClubLabel: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.semiBold,
    color: colors.text.tertiary,
    textTransform: 'uppercase',
  },
  hostClubName: {
    marginTop: 2,
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
  },
  infoTiles: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  infoTile: {
    flex: 1,
    gap: spacing.sm,
  },
  infoTileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  infoTileLabel: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semiBold,
    color: colors.text.secondary,
  },
  infoTileValue: {
    fontSize: typography.fontSize.base,
    lineHeight: 22,
    fontWeight: typography.fontWeight.semiBold,
    color: colors.text.primary,
  },
  rsvpSummaryCard: {
    gap: spacing.md,
  },
  rsvpSummaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  rsvpSummaryIcon: {
    width: 34,
    height: 34,
    borderRadius: borderRadius.full,
    backgroundColor: colors.primary.lightest,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rsvpSummaryCopy: {
    flex: 1,
  },
  rsvpSummaryTitle: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
  },
  rsvpSummarySubtitle: {
    marginTop: 2,
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  flexButton: {
    flex: 1,
  },
  goingButton: {
    backgroundColor: '#2E7D32',
  },
  infoPanel: {
    gap: spacing.sm,
  },
  infoPanelTitle: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
  },
  infoText: {
    fontSize: typography.fontSize.sm,
    lineHeight: 20,
    color: colors.text.secondary,
  },
  viewDetailsRow: {
    marginTop: spacing.xs,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  viewDetailsText: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semiBold,
    color: colors.primary.main,
  },
  pressed: {
    opacity: 0.84,
  },
});

export default EventBottomSheet;
