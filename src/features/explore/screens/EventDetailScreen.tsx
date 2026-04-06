import React from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { format } from 'date-fns';
import Badge from '../../../shared/components/Badge';
import Button from '../../../shared/components/Button';
import Card from '../../../shared/components/Card';
import ScreenLayout from '../../../shared/components/ScreenLayout';
import { mockCampusEvents } from '../../../assets/data/mockEvents';
import { mockClubEvents, mockClubs } from '../../../assets/data/mockClubs';
import { useCrossTabNavStore } from '../../../shared/stores/useCrossTabNavStore';
import { useDemoAppStore } from '../../../shared/stores/useDemoAppStore';
import { colors } from '../../../shared/theme/colors';
import { borderRadius, spacing } from '../../../shared/theme/spacing';
import { typography } from '../../../shared/theme/typography';
import type { Event } from '../../../shared/types';

type Props = NativeStackScreenProps<{ EventDetail: { eventId: string } }, 'EventDetail'>;

function findEvent(eventId: string): Event | undefined {
  return [...mockCampusEvents, ...mockClubEvents].find((event) => event.id === eventId);
}

export default function EventDetailScreen({ navigation, route }: Props) {
  const event = findEvent(route.params.eventId);
  const { savedEventIds, goingEventIds, setEventRsvpStatus } = useDemoAppStore();
  const setPendingMapFocus = useCrossTabNavStore((state) => state.setPendingMapFocus);
  const setPendingCalendarFocus = useCrossTabNavStore((state) => state.setPendingCalendarFocus);

  if (!event) {
    return (
      <ScreenLayout
        title="Event"
        subtitle="We couldn't find this event."
        leftAction={
          <Pressable onPress={() => navigation.goBack()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={20} color={colors.text.primary} />
          </Pressable>
        }
      >
        <Card>
          <Text style={styles.bodyText}>Try heading back to Explore and selecting another event.</Text>
        </Card>
      </ScreenLayout>
    );
  }

  const isSaved = savedEventIds.includes(event.id);
  const isGoing = goingEventIds.includes(event.id);
  const hostClub = event.club_id ? mockClubs.find((club) => club.id === event.club_id) : null;

  const openCalendar = () => {
    setPendingCalendarFocus({
      date: event.starts_at,
      entryId: event.id,
    });
    navigation.getParent()?.navigate('Calendar' as never);
  };

  const openMap = () => {
    if (typeof event.latitude !== 'number' || typeof event.longitude !== 'number') {
      return;
    }

    setPendingMapFocus({
      type: 'event',
      eventId: event.id,
      latitude: event.latitude,
      longitude: event.longitude,
    });
    navigation.getParent()?.navigate('Map' as never);
  };

  return (
    <ScreenLayout
      title="Event"
      subtitle="Everything you need before you go."
      leftAction={
        <Pressable onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={20} color={colors.text.primary} />
        </Pressable>
      }
      rightAction={
        <Pressable onPress={() => setEventRsvpStatus(event.id, isSaved ? null : 'interested')} style={styles.backButton}>
          <Ionicons
            name={isSaved ? 'bookmark' : 'bookmark-outline'}
            size={20}
            color={isSaved ? colors.primary.main : colors.text.primary}
          />
        </Pressable>
      }
    >
      {event.image_url ? <Image source={{ uri: event.image_url }} style={styles.heroImage} /> : null}

      <View style={styles.headerMeta}>
        <Badge
          label={event.category}
          color={colors.eventCategory[event.category as keyof typeof colors.eventCategory] ?? colors.primary.main}
        />
        {hostClub ? <Badge label={hostClub.name} color={colors.gray[700]} variant="outlined" /> : null}
      </View>

      <Text style={styles.title}>{event.title}</Text>
      <Text style={styles.description}>{event.description}</Text>

      <View style={styles.actionRow}>
        <Button
          title={isGoing ? 'Going' : 'Mark Going'}
          onPress={() => setEventRsvpStatus(event.id, isGoing ? null : 'going')}
          fullWidth
          style={styles.flexButton}
        />
        <Button
          title={isSaved ? 'Interested' : 'Save'}
          onPress={() => setEventRsvpStatus(event.id, isSaved ? null : 'interested')}
          variant="secondary"
          fullWidth
          style={styles.flexButton}
        />
      </View>

      <View style={styles.actionRow}>
        <Button title="Show in Calendar" onPress={openCalendar} variant="ghost" fullWidth style={styles.flexButton} />
        <Button title="Show on Map" onPress={openMap} variant="ghost" fullWidth style={styles.flexButton} />
      </View>

      <View style={styles.infoGrid}>
        <Card style={styles.infoCard}>
          <Text style={styles.cardLabel}>When</Text>
          <Text style={styles.cardValue}>
            {format(new Date(event.starts_at), 'EEEE, MMM d')}
          </Text>
          <Text style={styles.cardSubtle}>
            {format(new Date(event.starts_at), 'h:mm a')} to {format(new Date(event.ends_at), 'h:mm a')}
          </Text>
        </Card>

        <Card style={styles.infoCard}>
          <Text style={styles.cardLabel}>Where</Text>
          <Text style={styles.cardValue}>{event.location_name}</Text>
          <Text style={styles.cardSubtle}>
            {event.latitude?.toFixed(4)}, {event.longitude?.toFixed(4)}
          </Text>
        </Card>

        <Card style={styles.infoCard}>
          <Text style={styles.cardLabel}>Attendance</Text>
          <Text style={styles.cardValue}>{(event.attendee_count ?? event.rsvp_count).toLocaleString()} going</Text>
          <Text style={styles.cardSubtle}>
            {event.max_capacity ? `${event.max_capacity.toLocaleString()} max capacity` : 'Open attendance'}
          </Text>
        </Card>
      </View>

      {hostClub ? (
        <Card>
          <Text style={styles.sectionTitle}>Hosted by</Text>
          <Text style={styles.cardValue}>{hostClub.name}</Text>
          <Text style={styles.cardSubtle}>{hostClub.short_description}</Text>
        </Card>
      ) : null}
    </ScreenLayout>
  );
}

const styles = StyleSheet.create({
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: borderRadius.full,
    backgroundColor: colors.background.secondary,
  },
  heroImage: {
    width: '100%',
    height: 240,
    borderRadius: borderRadius.lg,
  },
  headerMeta: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  title: {
    fontSize: typography.fontSize['3xl'],
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
  },
  description: {
    fontSize: typography.fontSize.base,
    lineHeight: 24,
    color: colors.text.secondary,
  },
  actionRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  flexButton: {
    flex: 1,
  },
  infoGrid: {
    gap: spacing.md,
  },
  infoCard: {
    gap: spacing.xs,
  },
  cardLabel: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semiBold,
    color: colors.text.secondary,
    textTransform: 'uppercase',
  },
  cardValue: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
  },
  cardSubtle: {
    fontSize: typography.fontSize.sm,
    lineHeight: 20,
    color: colors.text.secondary,
  },
  sectionTitle: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semiBold,
    color: colors.text.secondary,
    marginBottom: spacing.xs,
  },
  bodyText: {
    fontSize: typography.fontSize.base,
    lineHeight: 24,
    color: colors.text.secondary,
  },
});
