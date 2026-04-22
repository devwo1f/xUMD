import React, { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { buildings } from '../../../assets/data/buildings';
import { colors } from '../../../shared/theme/colors';
import { borderRadius, shadows, spacing } from '../../../shared/theme/spacing';
import { typography } from '../../../shared/theme/typography';
import { EventCategory, type Event } from '../../../shared/types';
import type { MapStackParamList } from '../../../navigation/types';
import { campusMapCenter } from '../config/campusMapStyle';
import CampusMap from '../components/CampusMap';
import type { MapCoordinate } from '../types';
import { buildEventLocationGroups } from '../utils/eventDiscovery';
import { useCreateEventLocationStore } from '../stores/useCreateEventLocationStore';

type Props = NativeStackScreenProps<MapStackParamList, 'SelectEventLocation'>;

function distanceToBuilding(coordinate: MapCoordinate, building: typeof buildings[number]) {
  const longitudeDelta = coordinate[0] - building.longitude;
  const latitudeDelta = coordinate[1] - building.latitude;
  return longitudeDelta * longitudeDelta + latitudeDelta * latitudeDelta;
}

export default function SelectEventLocationScreen({ navigation, route }: Props) {
  const insets = useSafeAreaInsets();
  const setSelectedLocation = useCreateEventLocationStore((state) => state.setSelectedLocation);
  const [selectedCoordinate, setSelectedCoordinate] = useState<MapCoordinate>(
    route.params?.initialCoordinate ?? campusMapCenter,
  );

  const nearestBuilding = useMemo(() => {
    const [nearest] = [...buildings].sort(
      (left, right) =>
        distanceToBuilding(selectedCoordinate, left) -
        distanceToBuilding(selectedCoordinate, right),
    );
    return nearest ?? null;
  }, [selectedCoordinate]);

  const locationLabel = nearestBuilding?.name ?? route.params?.initialLocationName ?? 'Pinned campus location';

  const previewEvent = useMemo<Event>(
    () => ({
      id: 'create-event-location-preview',
      title: 'Selected event location',
      description: 'Location preview',
      club_id: null,
      created_by: 'create-event',
      organizer_name: 'xUMD',
      category: EventCategory.Other,
      starts_at: new Date().toISOString(),
      ends_at: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
      status: 'upcoming',
      moderation_status: 'approved',
      location_name: locationLabel,
      location_id: nearestBuilding?.id ?? null,
      latitude: selectedCoordinate[1],
      longitude: selectedCoordinate[0],
      image_url: null,
      rsvp_count: 0,
      attendee_count: 0,
      interested_count: 0,
      max_capacity: null,
      is_featured: false,
      tags: [],
      location: locationLabel,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }),
    [locationLabel, nearestBuilding?.id, selectedCoordinate],
  );

  const previewGroups = useMemo(
    () => buildEventLocationGroups([previewEvent], 'category', new Set()),
    [previewEvent],
  );

  const focusRequest = useMemo(
    () => ({
      id: `create-location-${selectedCoordinate[0]}-${selectedCoordinate[1]}`,
      centerCoordinate: selectedCoordinate,
      zoomLevel: 16.35,
    }),
    [selectedCoordinate],
  );

  function closeLocationPicker() {
    if (navigation.canGoBack()) {
      navigation.goBack();
      return;
    }

    navigation.navigate('CreateEvent', {
      initialCoordinate: selectedCoordinate,
    });
  }

  function confirmLocation() {
    setSelectedLocation({
      locationId: nearestBuilding?.id ?? null,
      locationName: locationLabel,
      latitude: selectedCoordinate[1],
      longitude: selectedCoordinate[0],
    });
    closeLocationPicker();
  }

  return (
    <View style={styles.screen}>
      <View style={[styles.header, { paddingTop: insets.top + spacing.sm }]}>
        <Pressable
          onPress={closeLocationPicker}
          style={({ pressed }) => [styles.headerButton, pressed ? styles.pressed : null]}
        >
          <Ionicons name="arrow-back" size={22} color={colors.text.primary} />
        </Pressable>
        <View style={styles.headerCopy}>
          <Text style={styles.headerTitle}>Choose Location</Text>
          <Text style={styles.headerSubtitle}>Tap anywhere on campus to drop the event pin.</Text>
        </View>
      </View>

      <View style={styles.mapWrap}>
        <CampusMap
          style={StyleSheet.absoluteFill}
          events={[previewEvent]}
          eventGroups={previewGroups}
          densityByEventId={{}}
          buildings={buildings}
          showEvents
          showBuildings
          activeEventGroupId={previewGroups[0]?.id ?? null}
          focusRequest={focusRequest}
          onSelectEventGroup={(group) => setSelectedCoordinate(group.coordinate)}
          onSelectBuilding={(building) => setSelectedCoordinate([building.longitude, building.latitude])}
          onPressCoordinate={setSelectedCoordinate}
          onLongPressCoordinate={setSelectedCoordinate}
        />

        <View style={[styles.selectionCard, { top: insets.top + 84 }]}>
          <View style={styles.selectionRow}>
            <Ionicons name="location" size={18} color={colors.primary.main} />
            <Text style={styles.selectionTitle}>{locationLabel}</Text>
          </View>
          <Text style={styles.selectionSubtitle}>
            {selectedCoordinate[1].toFixed(5)}, {selectedCoordinate[0].toFixed(5)}
          </Text>
        </View>
      </View>

      <View style={[styles.bottomBar, { paddingBottom: Math.max(insets.bottom, spacing.sm) }]}>
        <Text style={styles.bottomHint}>Pan, zoom, then tap to place the pin exactly where you want it.</Text>
        <Pressable onPress={confirmLocation} style={styles.confirmButton}>
          <Text style={styles.confirmButtonText}>Confirm Location</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  header: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    zIndex: 4,
  },
  headerButton: {
    width: 44,
    height: 44,
    borderRadius: borderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.brand.white,
    borderWidth: 1,
    borderColor: colors.border.light,
  },
  headerCopy: {
    flex: 1,
  },
  headerTitle: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
  },
  headerSubtitle: {
    marginTop: 2,
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
  },
  mapWrap: {
    flex: 1,
    overflow: 'hidden',
  },
  selectionCard: {
    position: 'absolute',
    left: spacing.md,
    right: spacing.md,
    borderRadius: borderRadius.lg,
    backgroundColor: 'rgba(255,255,255,0.96)',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    ...shadows.md,
  },
  selectionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  selectionTitle: {
    flex: 1,
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
  },
  selectionSubtitle: {
    marginTop: 4,
    fontSize: typography.fontSize.xs,
    color: colors.text.secondary,
  },
  bottomBar: {
    paddingTop: spacing.sm,
    paddingHorizontal: spacing.md,
    backgroundColor: 'rgba(255,255,255,0.98)',
    borderTopWidth: 1,
    borderTopColor: colors.border.light,
    gap: spacing.sm,
  },
  bottomHint: {
    fontSize: typography.fontSize.sm,
    lineHeight: 20,
    color: colors.text.secondary,
  },
  confirmButton: {
    minHeight: 52,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary.main,
  },
  confirmButtonText: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.bold,
    color: colors.brand.white,
  },
  pressed: {
    opacity: 0.82,
  },
});
