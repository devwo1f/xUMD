import React from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { format } from 'date-fns';
import Badge from '../../../shared/components/Badge';
import Button from '../../../shared/components/Button';
import Card from '../../../shared/components/Card';
import ScreenLayout from '../../../shared/components/ScreenLayout';
import { useCrossTabNavStore } from '../../../shared/stores/useCrossTabNavStore';
import { useDemoAppStore } from '../../../shared/stores/useDemoAppStore';
import { colors } from '../../../shared/theme/colors';
import { borderRadius, spacing } from '../../../shared/theme/spacing';
import { typography } from '../../../shared/theme/typography';
import type { Event } from '../../../shared/types';
import { useMapData } from '../../map/hooks/useMapData';
import { useMapEventDetail } from '../../map/hooks/useMapEventDetail';
import { submitEventRsvpRemote } from '../../../services/mapEvents';
import { isSupabaseConfigured } from '../../../services/supabase';
import { useCampusClubs } from '../../clubs/hooks/useCampusClubs';
import { useAuth } from '../../auth/hooks/useAuth';

type Props = NativeStackScreenProps<{ EventDetail: { eventId: string } }, 'EventDetail'>;
type RsvpStatus = 'going' | 'interested' | null;

function getCurrentRsvpStatus(eventId: string, goingEventIds: string[], savedEventIds: string[]): RsvpStatus {
  if (goingEventIds.includes(eventId)) {
    return 'going';
  }

  if (savedEventIds.includes(eventId)) {
    return 'interested';
  }

  return null;
}

function patchEventRsvpCounts<T extends Partial<Event> & { id: string }>(event: T, previousStatus: RsvpStatus, nextStatus: RsvpStatus): T {
  let attendeeCount = Number(event.attendee_count ?? event.rsvp_count ?? 0);
  let interestedCount = Number(event.interested_count ?? 0);

  if (previousStatus === 'going') {
    attendeeCount = Math.max(0, attendeeCount - 1);
  }
  if (previousStatus === 'interested') {
    interestedCount = Math.max(0, interestedCount - 1);
  }
  if (nextStatus === 'going') {
    attendeeCount += 1;
  }
  if (nextStatus === 'interested') {
    interestedCount += 1;
  }

  return {
    ...event,
    attendee_count: attendeeCount,
    rsvp_count: attendeeCount,
    interested_count: interestedCount,
  };
}

export default function EventDetailScreen({ navigation, route }: Props) {
  const queryClient = useQueryClient();
  const { user: authUser } = useAuth();
  const { rawEvents } = useMapData();
  const { getClubById } = useCampusClubs();
  const detailQuery = useMapEventDetail(route.params.eventId);
  const event = detailQuery.data?.event ?? rawEvents.find((item) => item.id === route.params.eventId);
  const { savedEventIds, goingEventIds, setEventRsvpStatus, confirmEventRsvpStatus } = useDemoAppStore();
  const setPendingMapFocus = useCrossTabNavStore((state) => state.setPendingMapFocus);
  const setPendingCalendarFocus = useCrossTabNavStore((state) => state.setPendingCalendarFocus);
  const canSyncRsvpRemotely = isSupabaseConfigured && Boolean(authUser?.id);

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

  const rsvpStatus = getCurrentRsvpStatus(event.id, goingEventIds, savedEventIds);
  const hostClub = event.club_id ? getClubById(event.club_id) : null;
  const stats = detailQuery.data?.rsvp_stats ?? {
    going: event.attendee_count ?? event.rsvp_count,
    interested: event.interested_count ?? 0,
  };

  const patchCaches = (previousStatus: RsvpStatus, nextStatus: RsvpStatus) => {
    queryClient.setQueriesData({ queryKey: ['map-events'] }, (current: any) => !current?.items ? current : ({
      ...current,
      items: current.items.map((item: Event) => item.id === event.id ? patchEventRsvpCounts(item, previousStatus, nextStatus) : item),
    }));
    queryClient.setQueryData(['map-event-detail', event.id], (current: any) => !current?.event ? current : ({
      ...current,
      event: patchEventRsvpCounts(current.event, previousStatus, nextStatus),
      current_user_rsvp: nextStatus,
      rsvp_stats: {
        going: Math.max(0, Number(current.rsvp_stats?.going ?? current.event.attendee_count ?? 0) - (previousStatus === 'going' ? 1 : 0) + (nextStatus === 'going' ? 1 : 0)),
        interested: Math.max(0, Number(current.rsvp_stats?.interested ?? current.event.interested_count ?? 0) - (previousStatus === 'interested' ? 1 : 0) + (nextStatus === 'interested' ? 1 : 0)),
      },
    }));
  };

  const handleRsvpChange = async (nextStatus: RsvpStatus) => {
    if (rsvpStatus === nextStatus) {
      return;
    }

    const previousStatus = rsvpStatus;
    setEventRsvpStatus(event.id, nextStatus);
    patchCaches(previousStatus, nextStatus);

    try {
      if (canSyncRsvpRemotely) {
        const response = await submitEventRsvpRemote({ eventId: event.id, status: nextStatus ?? undefined, action: nextStatus ? 'upsert' : 'remove' });
        confirmEventRsvpStatus(event.id, response.current_user_rsvp ?? nextStatus);
      } else {
        confirmEventRsvpStatus(event.id, nextStatus);
      }

      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['map-events'] }),
        queryClient.invalidateQueries({ queryKey: ['map-event-detail', event.id] }),
        queryClient.invalidateQueries({ queryKey: ['calendar-data'] }),
      ]);
    } catch {
      // Revert optimistic update on failure
      setEventRsvpStatus(event.id, previousStatus);
      patchCaches(nextStatus, previousStatus);
    }
  };

  const openCalendar = () => {
    setPendingCalendarFocus({ date: event.starts_at, entryId: event.id });
    navigation.getParent()?.navigate('Calendar' as never);
  };

  const openMap = () => {
    if (typeof event.latitude !== 'number' || typeof event.longitude !== 'number') {
      return;
    }

    setPendingMapFocus({ type: 'event', eventId: event.id, latitude: event.latitude, longitude: event.longitude });
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
        <Pressable onPress={() => void handleRsvpChange(rsvpStatus === 'interested' ? null : 'interested')} style={styles.backButton}>
          <Ionicons name={rsvpStatus === 'interested' ? 'bookmark' : 'bookmark-outline'} size={20} color={rsvpStatus === 'interested' ? colors.primary.main : colors.text.primary} />
        </Pressable>
      }
    >
      {event.image_url ? <Image source={{ uri: event.image_url }} style={styles.heroImage} /> : null}

      <View style={styles.headerMeta}>
        <Badge label={event.category} color={colors.eventCategory[event.category as keyof typeof colors.eventCategory] ?? colors.primary.main} />
        {hostClub ? <Badge label={hostClub.name} color={colors.gray[700]} variant="outlined" /> : null}
      </View>

      <Text style={styles.title}>{event.title}</Text>
      <Text style={styles.description}>{event.description}</Text>

      <View style={styles.actionRow}>
        <Button title={rsvpStatus === 'going' ? 'Going' : 'Mark Going'} onPress={() => void handleRsvpChange(rsvpStatus === 'going' ? null : 'going')} fullWidth style={styles.flexButton} />
        <Button title={rsvpStatus === 'interested' ? 'Saved' : 'Save'} onPress={() => void handleRsvpChange(rsvpStatus === 'interested' ? null : 'interested')} variant="secondary" fullWidth style={styles.flexButton} />
      </View>

      <View style={styles.actionRow}>
        <Button title="Show in Calendar" onPress={openCalendar} variant="ghost" fullWidth style={styles.flexButton} />
        <Button title="Show on Map" onPress={openMap} variant="ghost" fullWidth style={styles.flexButton} />
      </View>

      <View style={styles.infoGrid}>
        <Card style={styles.infoCard}>
          <Text style={styles.cardLabel}>When</Text>
          <Text style={styles.cardValue}>{format(new Date(event.starts_at), 'EEEE, MMM d')}</Text>
          <Text style={styles.cardSubtle}>{format(new Date(event.starts_at), 'h:mm a')} to {format(new Date(event.ends_at), 'h:mm a')}</Text>
        </Card>

        <Card style={styles.infoCard}>
          <Text style={styles.cardLabel}>Where</Text>
          <Text style={styles.cardValue}>{event.location_name}</Text>
          <Text style={styles.cardSubtle}>{event.latitude?.toFixed(4)}, {event.longitude?.toFixed(4)}</Text>
        </Card>

        <Card style={styles.infoCard}>
          <Text style={styles.cardLabel}>Attendance</Text>
          <Text style={styles.cardValue}>{stats.going.toLocaleString()} going</Text>
          <Text style={styles.cardSubtle}>{event.max_capacity ? `${event.max_capacity.toLocaleString()} max capacity` : 'Open attendance'}</Text>
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
