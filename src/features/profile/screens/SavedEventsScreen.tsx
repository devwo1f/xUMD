import React from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import EventCard from '../../../shared/components/EventCard';
import ScreenLayout from '../../../shared/components/ScreenLayout';
import { useMapData } from '../../map/hooks/useMapData';
import { useDemoAppStore } from '../../../shared/stores/useDemoAppStore';
import { colors } from '../../../shared/theme/colors';
import { borderRadius } from '../../../shared/theme/spacing';
import type { ProfileStackParamList } from '../../../navigation/types';
import { isUmdSportsEventId } from '../../../services/umdSports';

type Props = NativeStackScreenProps<ProfileStackParamList, 'SavedEvents'>;

export default function SavedEventsScreen({ navigation }: Props) {
  const { savedEventIds, goingEventIds } = useDemoAppStore();
  const { rawEvents } = useMapData();
  const eventIds = new Set([...savedEventIds, ...goingEventIds]);
  const events = rawEvents.filter((event) => eventIds.has(event.id));

  return (
    <ScreenLayout
      title="Saved Events"
      subtitle="Everything you saved or RSVP'd to across xUMD."
      leftAction={
        <Pressable onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={20} color={colors.text.primary} />
        </Pressable>
      }
    >
      {events.map((event) => (
        <EventCard
          key={event.id}
          event={{
            id: event.id,
            title: event.title,
            imageUri: event.image_url ?? undefined,
            category: event.category,
            time: new Date(event.starts_at).toLocaleString(),
            location: event.location_name,
          }}
          onPress={() =>
            navigation.navigate(isUmdSportsEventId(event.id) ? 'SportsEventDetail' : 'EventDetail', {
              eventId: event.id,
            })
          }
        />
      ))}
      {events.length === 0 ? <Text style={styles.emptyText}>Save or RSVP to an event from anywhere in xUMD to see it here.</Text> : null}
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
  emptyText: {
    color: colors.text.secondary,
  },
});
