import React from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import EventCard from '../../../shared/components/EventCard';
import ScreenLayout from '../../../shared/components/ScreenLayout';
import { mockCampusEvents } from '../../../assets/data/mockEvents';
import { mockClubEvents } from '../../../assets/data/mockClubs';
import { useDemoAppStore } from '../../../shared/stores/useDemoAppStore';
import { colors } from '../../../shared/theme/colors';
import { borderRadius } from '../../../shared/theme/spacing';
import type { ProfileStackParamList } from '../../../navigation/types';

type Props = NativeStackScreenProps<ProfileStackParamList, 'SavedEvents'>;

export default function SavedEventsScreen({ navigation }: Props) {
  const { savedEventIds } = useDemoAppStore();
  const events = [...mockCampusEvents, ...mockClubEvents].filter((event) => savedEventIds.includes(event.id));

  return (
    <ScreenLayout
      title="Saved Events"
      subtitle="Everything you planned to show up for."
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
          onPress={() => navigation.navigate('EventDetail', { eventId: event.id })}
        />
      ))}
      {events.length === 0 ? <Text style={styles.emptyText}>Save an event from Explore to see it here.</Text> : null}
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