import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  Image,
  InputAccessoryView,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { useQueryClient } from '@tanstack/react-query';
import { endOfDay, format } from 'date-fns';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { buildings } from '../../../assets/data/buildings';
import type { Event, EventAttachment } from '../../../shared/types';
import { MemberRole } from '../../../shared/types';
import type { MapStackParamList } from '../../../navigation/types';
import NativeDateTimePickerModal from '../../../shared/components/NativeDateTimePickerModal';
import Button from '../../../shared/components/Button';
import { createMapEventRemote } from '../../../services/mapEvents';
import { isSupabaseConfigured, supabase } from '../../../services/supabase';
import { useAuth } from '../../auth/hooks/useAuth';
import { useProfile } from '../../profile/hooks/useProfile';
import { useCampusClubs } from '../../clubs/hooks/useCampusClubs';
import { useCrossTabNavStore } from '../../../shared/stores/useCrossTabNavStore';
import { useDemoAppStore } from '../../../shared/stores/useDemoAppStore';
import { useEventCatalogStore } from '../../../shared/stores/useEventCatalogStore';
import { colors } from '../../../shared/theme/colors';
import { borderRadius, shadows, spacing } from '../../../shared/theme/spacing';
import { typography } from '../../../shared/theme/typography';
import {
  EVENT_CATEGORY_OPTIONS,
  TAG_SUGGESTIONS,
  addTagToDraft,
  buildCreateEventDraftErrors,
  buildLocalDraftEvents,
  clearSavedCreateEventDraft,
  isCreateEventDraftPublishable,
  loadSavedCreateEventDraft,
  makeDefaultCreateEventDraft,
  normalizeTag,
  saveCreateEventDraft,
  type CreateEventClubOption,
  type CreateEventDraft,
  type CreateEventLocationSelection,
  type CreateEventPersonOption,
  type EventDraftMediaAsset,
  type EventRecurrenceFrequency,
} from '../utils/createEventDraft';
import { useCreateEventLocationStore } from '../stores/useCreateEventLocationStore';

type Props = NativeStackScreenProps<MapStackParamList, 'CreateEvent'>;
type PickerTarget = 'start-date' | 'start-time' | 'end-date' | 'end-time' | 'recurrence-until';
type CampusLocationOption = {
  id: string;
  name: string;
  shortName: string;
  latitude: number;
  longitude: number;
};

const KEYBOARD_ACCESSORY_ID = 'create-event-keyboard';
const MAX_ATTACHMENTS = 5;
const RECURRENCE_OPTIONS: Array<{ value: EventRecurrenceFrequency; label: string }> = [
  { value: 'weekly', label: 'Weekly' },
  { value: 'biweekly', label: 'Biweekly' },
  { value: 'monthly', label: 'Monthly' },
];
const OFFICER_ROLES = new Set<MemberRole>([
  MemberRole.President,
  MemberRole.Officer,
  MemberRole.Admin,
]);

function makeMediaId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function buildFallbackLocations(): CampusLocationOption[] {
  return buildings.map((building) => ({
    id: building.id,
    name: building.name,
    shortName: building.code,
    latitude: building.latitude,
    longitude: building.longitude,
  }));
}

function formatDateTimeLabel(value: string) {
  return format(new Date(value), 'EEE, MMM d - h:mm a');
}

function formatDateLabel(value: string | null) {
  return value ? format(new Date(value), 'EEE, MMM d') : 'Choose a date';
}

function formatFileSize(bytes?: number | null) {
  if (!bytes) {
    return null;
  }

  const megabytes = bytes / (1024 * 1024);
  if (megabytes >= 1) {
    return `${megabytes.toFixed(1)} MB`;
  }

  return `${Math.max(1, Math.round(bytes / 1024))} KB`;
}

function nearestLocation(latitude: number, longitude: number, locations: CampusLocationOption[]) {
  return (
    [...locations].sort((left, right) => {
      const leftDelta = (latitude - left.latitude) ** 2 + (longitude - left.longitude) ** 2;
      const rightDelta = (latitude - right.latitude) ** 2 + (longitude - right.longitude) ** 2;
      return leftDelta - rightDelta;
    })[0] ?? null
  );
}

async function blobToBase64(blob: Blob) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Failed to prepare the selected file.'));
    reader.onload = () => {
      if (typeof reader.result !== 'string') {
        reject(new Error('Failed to prepare the selected file.'));
        return;
      }
      const commaIndex = reader.result.indexOf(',');
      resolve(commaIndex >= 0 ? reader.result.slice(commaIndex + 1) : reader.result);
    };
    reader.readAsDataURL(blob);
  });
}

async function readUriAsBase64(uri: string) {
  const response = await fetch(uri);
  if (!response.ok) {
    throw new Error('Unable to prepare the selected file.');
  }
  return blobToBase64(await response.blob());
}

async function loadDocumentPicker() {
  try {
    return await import('expo-document-picker');
  } catch (error) {
    throw new Error(
      'Document uploads need a freshly rebuilt app because this installed build does not include the native document picker yet.',
    );
  }
}

function buildMediaAsset(input: {
  uri: string;
  kind: EventAttachment['kind'];
  fileName?: string | null;
  mimeType?: string | null;
  sizeBytes?: number | null;
  width?: number | null;
  height?: number | null;
  durationMs?: number | null;
}) {
  return {
    id: makeMediaId(input.kind),
    uri: input.uri,
    fileName: input.fileName ?? `${input.kind}-${Date.now()}`,
    mimeType:
      input.mimeType ??
      (input.kind === 'document'
        ? 'application/pdf'
        : input.kind === 'video'
          ? 'video/mp4'
          : 'image/jpeg'),
    kind: input.kind,
    sizeBytes: input.sizeBytes ?? null,
    width: input.width ?? null,
    height: input.height ?? null,
    durationMs: input.durationMs ?? null,
    thumbnailUri: null,
  } satisfies EventDraftMediaAsset;
}

function InlineError({ message }: { message?: string }) {
  return message ? <Text style={styles.errorText}>{message}</Text> : null;
}

function Section({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <View style={styles.section}>
      <View style={styles.sectionLabel}>
        <Text style={styles.sectionTitle}>{title}</Text>
        {subtitle ? <Text style={styles.sectionSubtitle}>{subtitle}</Text> : null}
      </View>
      {children}
    </View>
  );
}

function SmallLogo({ uri, fallback }: { uri: string | null | undefined; fallback: string }) {
  if (uri) {
    return <Image source={{ uri }} style={styles.smallLogo} />;
  }

  return (
    <View style={styles.smallLogoFallback}>
      <Text style={styles.smallLogoFallbackText}>
        {(fallback.trim().slice(0, 1) || '?').toUpperCase()}
      </Text>
    </View>
  );
}

export default function CreateEventScreen({ navigation, route }: Props) {
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();
  const { user: authUser } = useAuth();
  const { user: profileUser } = useProfile();
  const { approvedMemberships, clubsById } = useCampusClubs();
  const setPendingMapFocus = useCrossTabNavStore((state) => state.setPendingMapFocus);
  const setEventRsvpStatus = useDemoAppStore((state) => state.setEventRsvpStatus);
  const confirmEventRsvpStatus = useDemoAppStore((state) => state.confirmEventRsvpStatus);
  const upsertLocalEvent = useEventCatalogStore((state) => state.upsertEvent);
  const selectedLocation = useCreateEventLocationStore((state) => state.selectedLocation);
  const selectedLocationUpdatedAt = useCreateEventLocationStore((state) => state.lastUpdatedAt);
  const clearSelectedLocation = useCreateEventLocationStore((state) => state.clearSelectedLocation);
  const initialCoordinate = route.params?.initialCoordinate ?? null;
  const inputAccessoryViewID = Platform.OS === 'ios' ? KEYBOARD_ACCESSORY_ID : undefined;
  const currentViewerId = authUser?.id ?? profileUser.id;
  const currentViewerName = authUser?.display_name ?? profileUser.displayName ?? 'xUMD student';

  const [draft, setDraft] = useState<CreateEventDraft>(() =>
    makeDefaultCreateEventDraft(
      initialCoordinate
        ? {
            locationId: null,
            locationName: '',
            latitude: initialCoordinate[1],
            longitude: initialCoordinate[0],
          }
        : null,
    ),
  );
  const [pickerTarget, setPickerTarget] = useState<PickerTarget | null>(null);
  const [locationOptions, setLocationOptions] = useState<CampusLocationOption[]>(buildFallbackLocations());
  const [peopleOptions, setPeopleOptions] = useState<CreateEventPersonOption[]>([]);
  const [coHostQuery, setCoHostQuery] = useState('');
  const [organizerQuery, setOrganizerQuery] = useState('');
  const [showOrganizerMenu, setShowOrganizerMenu] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [submitAttempted, setSubmitAttempted] = useState(false);
  const initializedRef = useRef(false);

  const organizerClubOptions = useMemo(() => {
    const options: CreateEventClubOption[] = [
      { id: null, name: 'Personal Event', logoUrl: null, type: 'personal' },
    ];

    approvedMemberships
      .filter((membership) => membership.user_id === currentViewerId && OFFICER_ROLES.has(membership.role))
      .forEach((membership) => {
        const club = clubsById.get(membership.club_id);
        if (!club) {
          return;
        }
        options.push({
          id: club.id,
          name: club.name,
          logoUrl: club.logo_url,
          type: 'club',
        });
      });

    return options;
  }, [approvedMemberships, clubsById, currentViewerId]);

  const selectedOrganizerClub =
    organizerClubOptions.find((club) => club.id === draft.organizerClubId) ??
    organizerClubOptions[0];

  function closeCreateScreen() {
    if (navigation.canGoBack()) {
      navigation.goBack();
      return;
    }

    navigation.navigate('MapHome');
  }

  const allClubOptions = useMemo(
    () =>
      [...clubsById.values()].map((club) => ({
        id: club.id,
        name: club.name,
        logoUrl: club.logo_url,
        type: 'club' as const,
      })),
    [clubsById],
  );

  const filteredLocations = useMemo(() => {
    const query = draft.locationQuery.trim().toLowerCase();
    if (!query) {
      return [];
    }
    return locationOptions
      .filter(
        (location) =>
          location.name.toLowerCase().includes(query) ||
          location.shortName.toLowerCase().includes(query),
      )
      .slice(0, 8);
  }, [draft.locationQuery, locationOptions]);

  const filteredCoHosts = useMemo(() => {
    const query = coHostQuery.trim().toLowerCase();
    if (!query) {
      return [];
    }
    return allClubOptions
      .filter(
        (club) =>
          club.id !== draft.organizerClubId &&
          !draft.coHostClubs.some((item) => item.id === club.id) &&
          club.name.toLowerCase().includes(query),
      )
      .slice(0, 6);
  }, [allClubOptions, coHostQuery, draft.coHostClubs, draft.organizerClubId]);

  const filteredPeople = useMemo(() => {
    const query = organizerQuery.trim().toLowerCase();
    if (!query) {
      return [];
    }
    return peopleOptions
      .filter(
        (person) =>
          !draft.organizers.some((item) => item.id === person.id) &&
          (person.displayName.toLowerCase().includes(query) ||
            person.username.toLowerCase().includes(query)),
      )
      .slice(0, 6);
  }, [draft.organizers, organizerQuery, peopleOptions]);

  const errors = useMemo(() => buildCreateEventDraftErrors(draft), [draft]);
  const visibleErrors = submitAttempted ? errors : {};
  const publishDisabled = publishing || !isCreateEventDraftPublishable(draft);
  const pickerMode =
    pickerTarget === 'start-time' || pickerTarget === 'end-time' ? 'time' : 'date';
  const pickerValue = useMemo(() => {
    switch (pickerTarget) {
      case 'start-date':
      case 'start-time':
        return new Date(draft.startsAt);
      case 'end-date':
      case 'end-time':
        return new Date(draft.endsAt);
      case 'recurrence-until':
        return new Date(draft.recurrenceUntil ?? draft.endsAt);
      default:
        return new Date();
    }
  }, [draft.endsAt, draft.recurrenceUntil, draft.startsAt, pickerTarget]);

  useEffect(() => {
    let cancelled = false;

    async function hydrateReferenceData() {
      let nextLocations = buildFallbackLocations();
      let nextPeople = approvedMemberships
        .map((membership) => membership.user)
        .filter((user, index, users) => user.id !== currentViewerId && users.findIndex((candidate) => candidate.id === user.id) === index)
        .map((user) => ({
          id: user.id,
          displayName: user.display_name,
          username: user.username ?? user.email.split('@')[0],
          avatarUrl: user.avatar_url,
        }));

      if (isSupabaseConfigured) {
        const [{ data: locations }, { data: users }] = await Promise.all([
          supabase.from('campus_locations').select('id, name, short_name, latitude, longitude').order('name'),
          supabase.from('users').select('id, display_name, username, avatar_url').order('display_name').limit(80),
        ]);

        if (locations?.length) {
          nextLocations = locations.map((location) => ({
            id: location.id,
            name: location.name,
            shortName: location.short_name ?? '',
            latitude: location.latitude,
            longitude: location.longitude,
          }));
        }

        if (users?.length) {
          nextPeople = users
            .filter((user) => user.id !== currentViewerId)
            .map((user) => ({
              id: user.id,
              displayName: user.display_name,
              username: user.username ?? user.display_name.toLowerCase().replace(/\s+/g, '_'),
              avatarUrl: user.avatar_url,
            }));
        }
      }

      if (!cancelled) {
        setLocationOptions(nextLocations);
        setPeopleOptions(nextPeople);
      }
    }

    void hydrateReferenceData();
    return () => {
      cancelled = true;
    };
  }, [approvedMemberships, currentViewerId]);

  useEffect(() => {
    let cancelled = false;

    async function restoreDraft() {
      if (initializedRef.current) {
        return;
      }

      initializedRef.current = true;
      const savedDraft = await loadSavedCreateEventDraft();
      if (!savedDraft || cancelled) {
        return;
      }

      setDraft((current) => ({
        ...savedDraft,
        latitude: current.latitude ?? savedDraft.latitude,
        longitude: current.longitude ?? savedDraft.longitude,
      }));
    }

    void restoreDraft();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!selectedLocation || !selectedLocationUpdatedAt) {
      return;
    }

    setDraft((current) => ({
      ...current,
      locationId: selectedLocation.locationId,
      locationName: selectedLocation.locationName,
      locationQuery: selectedLocation.locationName,
      latitude: selectedLocation.latitude,
      longitude: selectedLocation.longitude,
    }));
    clearSelectedLocation();
  }, [clearSelectedLocation, selectedLocation, selectedLocationUpdatedAt]);

  useEffect(() => {
    if (
      !draft.locationName &&
      typeof draft.latitude === 'number' &&
      typeof draft.longitude === 'number' &&
      locationOptions.length
    ) {
      const nextLocation = nearestLocation(draft.latitude, draft.longitude, locationOptions);
      if (nextLocation) {
        setDraft((current) => ({
          ...current,
          locationId: current.locationId ?? nextLocation.id,
          locationName: current.locationName || nextLocation.name,
          locationQuery: current.locationQuery || nextLocation.name,
        }));
      }
    }
  }, [draft.latitude, draft.locationName, draft.longitude, locationOptions]);

  useEffect(() => {
    if (!initializedRef.current) {
      return;
    }

    const timeout = setTimeout(() => {
      if (
        draft.title.trim().length === 0 &&
        draft.locationName.trim().length === 0 &&
        draft.attachments.length === 0 &&
        draft.tags.length === 0 &&
        !draft.coverImage
      ) {
        return;
      }

      void saveCreateEventDraft(draft);
    }, 300);

    return () => clearTimeout(timeout);
  }, [draft]);

  function mergeTimeValue(baseValue: string, nextDate: Date) {
    const merged = new Date(baseValue);
    merged.setHours(nextDate.getHours(), nextDate.getMinutes(), 0, 0);
    return merged.toISOString();
  }

  function updatePicker(nextDate: Date) {
    setDraft((current) => {
      let startsAt = current.startsAt;
      let endsAt = current.endsAt;
      let recurrenceUntil = current.recurrenceUntil;

      if (pickerTarget === 'start-date') {
        const merged = new Date(current.startsAt);
        merged.setFullYear(nextDate.getFullYear(), nextDate.getMonth(), nextDate.getDate());
        startsAt = merged.toISOString();
        if (new Date(endsAt) <= new Date(startsAt)) {
          endsAt = new Date(new Date(startsAt).getTime() + 90 * 60 * 1000).toISOString();
        }
        setPickerTarget('start-time');
      } else if (pickerTarget === 'start-time') {
        startsAt = mergeTimeValue(current.startsAt, nextDate);
        if (new Date(endsAt) <= new Date(startsAt)) {
          endsAt = new Date(new Date(startsAt).getTime() + 90 * 60 * 1000).toISOString();
        }
        setPickerTarget(null);
      } else if (pickerTarget === 'end-date') {
        const merged = new Date(current.endsAt);
        merged.setFullYear(nextDate.getFullYear(), nextDate.getMonth(), nextDate.getDate());
        endsAt = merged.toISOString();
        setPickerTarget('end-time');
      } else if (pickerTarget === 'end-time') {
        endsAt = mergeTimeValue(current.endsAt, nextDate);
        setPickerTarget(null);
      } else if (pickerTarget === 'recurrence-until') {
        recurrenceUntil = endOfDay(nextDate).toISOString();
        setPickerTarget(null);
      }

      return {
        ...current,
        startsAt,
        endsAt,
        recurrenceUntil,
      };
    });
  }

  function selectLocation(location: CreateEventLocationSelection) {
    setDraft((current) => ({
      ...current,
      locationId: location.locationId,
      locationName: location.locationName,
      locationQuery: location.locationName,
      latitude: location.latitude,
      longitude: location.longitude,
    }));
  }

  function commitTag(rawValue = draft.tagInput) {
    setDraft((current) => ({
      ...current,
      tags: addTagToDraft(current, rawValue),
      tagInput: '',
    }));
  }

  function changeTagInput(value: string) {
    if (value.includes(',') || value.includes('\n')) {
      const parts = value.split(/[,\n]/);
      let nextTags = draft.tags;
      parts.slice(0, -1).forEach((part) => {
        nextTags = addTagToDraft({ ...draft, tags: nextTags }, part);
      });

      setDraft((current) => ({
        ...current,
        tags: nextTags,
        tagInput: parts[parts.length - 1] ?? '',
      }));
      return;
    }

    setDraft((current) => ({ ...current, tagInput: value }));
  }

  async function pickCover(source: 'library' | 'camera') {
    const permission =
      source === 'camera'
        ? await ImagePicker.requestCameraPermissionsAsync()
        : await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permission.granted) {
      Alert.alert(
        source === 'camera' ? 'Camera access needed' : 'Photo access needed',
        'Please allow access so we can use the selected image.',
      );
      return;
    }

    const result =
      source === 'camera'
        ? await ImagePicker.launchCameraAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            quality: 0.84,
          })
        : await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            quality: 0.84,
          });

    if (result.canceled || !result.assets[0]) {
      return;
    }

    const asset = result.assets[0];
    setDraft((current) => ({
      ...current,
      coverImage: buildMediaAsset({
        uri: asset.uri,
        kind: 'image',
        fileName: asset.fileName,
        mimeType: asset.mimeType,
        sizeBytes: asset.fileSize,
        width: asset.width,
        height: asset.height,
      }),
    }));
  }

  function openCoverMenu() {
    Alert.alert('Cover photo', 'Add or update the event cover.', [
      { text: 'Choose Photo', onPress: () => void pickCover('library') },
      { text: 'Take Photo', onPress: () => void pickCover('camera') },
      ...(draft.coverImage
        ? [
            {
              text: 'Remove Photo',
              style: 'destructive' as const,
              onPress: () =>
                setDraft((current) => ({
                  ...current,
                  coverImage: null,
                })),
            },
          ]
        : []),
      { text: 'Cancel', style: 'cancel' },
    ]);
  }

  async function addMediaAttachments() {
    const remaining = Math.max(0, MAX_ATTACHMENTS - draft.attachments.length);
    if (remaining === 0) {
      Alert.alert('Attachment limit reached', `You can add up to ${MAX_ATTACHMENTS} files.`);
      return;
    }

    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Media access needed', 'Allow media library access to add files.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.All,
      quality: 0.84,
      allowsMultipleSelection: true,
      selectionLimit: remaining,
    });

    if (result.canceled) {
      return;
    }

    setDraft((current) => ({
      ...current,
      attachments: [
        ...current.attachments,
        ...result.assets.slice(0, remaining).map((asset) =>
          buildMediaAsset({
            uri: asset.uri,
            kind: asset.type === 'video' ? 'video' : 'image',
            fileName: asset.fileName,
            mimeType: asset.mimeType,
            sizeBytes: asset.fileSize,
            width: asset.width,
            height: asset.height,
            durationMs: asset.duration,
          }),
        ),
      ],
    }));
  }

  async function addDocumentAttachments() {
    const remaining = Math.max(0, MAX_ATTACHMENTS - draft.attachments.length);
    if (remaining === 0) {
      Alert.alert('Attachment limit reached', `You can add up to ${MAX_ATTACHMENTS} files.`);
      return;
    }

    let documentPicker: Awaited<ReturnType<typeof loadDocumentPicker>>;

    try {
      documentPicker = await loadDocumentPicker();
    } catch (error) {
      Alert.alert(
        'Rebuild needed',
        error instanceof Error ? error.message : 'Document uploads are not available in this installed build yet.',
      );
      return;
    }

    const result = await documentPicker.getDocumentAsync({
      type: ['application/pdf', 'image/*', 'video/*'],
      multiple: remaining > 1,
      copyToCacheDirectory: true,
    });

    if (result.canceled) {
      return;
    }

    setDraft((current) => ({
      ...current,
      attachments: [
        ...current.attachments,
        ...result.assets.slice(0, remaining).map((asset) =>
          buildMediaAsset({
            uri: asset.uri,
            kind:
              asset.mimeType?.startsWith('image/')
                ? 'image'
                : asset.mimeType?.startsWith('video/')
                  ? 'video'
                  : 'document',
            fileName: asset.name,
            mimeType: asset.mimeType,
            sizeBytes: asset.size,
          }),
        ),
      ],
    }));
  }

  async function saveDraftAndClose() {
    await saveCreateEventDraft(draft);
    closeCreateScreen();
  }

  async function publishEvent() {
    setSubmitAttempted(true);
    if (!isCreateEventDraftPublishable(draft)) {
      return;
    }

    setPublishing(true);

    try {
      let createdEvents: Event[] = buildLocalDraftEvents({
        draft,
        viewerId: currentViewerId,
        viewerName: currentViewerName,
        coverImageUrl: draft.coverImage?.uri ?? null,
      });

      if (isSupabaseConfigured) {
        const response = await createMapEventRemote({
          title: draft.title.trim(),
          description: draft.description.trim(),
          category: draft.category!,
          clubId: draft.organizerClubId,
          coHostClubIds: draft.coHostClubs
            .map((club) => club.id)
            .filter((clubId): clubId is string => Boolean(clubId)),
          organizerIds: Array.from(new Set([currentViewerId, ...draft.organizers.map((person) => person.id)])),
          locationName: draft.locationName.trim(),
          locationId: draft.locationId,
          locationDetails: draft.locationDetails.trim() || null,
          latitude: draft.latitude!,
          longitude: draft.longitude!,
          startsAt: draft.startsAt,
          endsAt: draft.endsAt,
          recurrence:
            draft.isRecurring && draft.recurrenceUntil
              ? {
                  frequency: draft.recurrenceFrequency,
                  until: draft.recurrenceUntil,
                }
              : null,
          maxCapacity: draft.maxCapacity.trim().length > 0 ? Number(draft.maxCapacity) : null,
          waitlistEnabled: draft.maxCapacity.trim().length > 0 && draft.waitlistEnabled,
          requireApproval: draft.requireApproval,
          isFree: draft.isFree,
          ticketPrice: draft.isFree ? null : Number(draft.ticketPrice),
          visibility: draft.visibility,
          contactInfo: draft.contactInfo.trim() || null,
          tags: draft.tags,
          coverImage: draft.coverImage
            ? {
                base64Data: await readUriAsBase64(draft.coverImage.uri),
                fileName: draft.coverImage.fileName,
                mimeType: draft.coverImage.mimeType,
              }
            : null,
          attachments: await Promise.all(
            draft.attachments.map(async (attachment) => ({
              base64Data: await readUriAsBase64(attachment.uri),
              fileName: attachment.fileName,
              mimeType: attachment.mimeType,
              kind: attachment.kind,
              sizeBytes: attachment.sizeBytes ?? null,
            })),
          ),
        });

        createdEvents = response.events;
      }

      createdEvents.forEach((event) => {
        upsertLocalEvent(event);
        setEventRsvpStatus(event.id, 'going');
        confirmEventRsvpStatus(event.id, 'going');
      });

      const firstEvent = createdEvents[0];
      if (firstEvent?.latitude !== null && firstEvent?.longitude !== null) {
        setPendingMapFocus({
          type: 'event',
          eventId: firstEvent.id,
          latitude: firstEvent.latitude,
          longitude: firstEvent.longitude,
        });
      }

      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['map-events'] }),
        queryClient.invalidateQueries({ queryKey: ['calendar-data'] }),
      ]);
      await clearSavedCreateEventDraft();
      clearSelectedLocation();
      closeCreateScreen();
    } catch (error) {
      Alert.alert(
        'Unable to publish event',
        error instanceof Error ? error.message : 'We could not publish this event yet.',
      );
    } finally {
      setPublishing(false);
    }
  }

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
      <View style={styles.screen}>
        <KeyboardAvoidingView
          style={styles.screen}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          keyboardVerticalOffset={insets.top + 8}
        >
          <View style={[styles.header, { paddingTop: insets.top + spacing.sm }]}>
            <Pressable
              onPress={closeCreateScreen}
              style={({ pressed }) => [styles.headerButton, pressed ? styles.pressed : null]}
            >
              <Ionicons name="arrow-back" size={22} color={colors.text.primary} />
            </Pressable>
            <View style={styles.headerCopy}>
              <Text style={styles.headerTitle}>Create Event</Text>
              <Text style={styles.headerSubtitle}>Build a full campus moment, not just a pin.</Text>
            </View>
            <View style={styles.headerSpacer} />
          </View>

          <ScrollView
            style={styles.scroll}
            contentContainerStyle={[styles.scrollContent, { paddingBottom: 146 + insets.bottom }]}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <Pressable onPress={openCoverMenu} style={({ pressed }) => [styles.heroCard, pressed ? styles.pressed : null]}>
              {draft.coverImage ? (
                <>
                  <Image source={{ uri: draft.coverImage.uri }} style={styles.heroImage} />
                  <Pressable
                    onPress={() =>
                      setDraft((current) => ({
                        ...current,
                        coverImage: null,
                      }))
                    }
                    style={styles.heroRemove}
                    hitSlop={8}
                  >
                    <Ionicons name="close" size={16} color={colors.brand.white} />
                  </Pressable>
                  <View style={styles.heroBadge}>
                    <Ionicons name="camera-outline" size={16} color={colors.brand.white} />
                    <Text style={styles.heroBadgeText}>Replace</Text>
                  </View>
                </>
              ) : (
                <View style={styles.heroEmpty}>
                  <View style={styles.heroIconWrap}>
                    <Ionicons name="image-outline" size={30} color={colors.primary.main} />
                  </View>
                  <Text style={styles.heroTitle}>Add Cover Photo</Text>
                  <Text style={styles.heroSubtitle}>Optional, but it gives the event a real presence.</Text>
                </View>
              )}
            </Pressable>

            <Section title="Event Name">
              <TextInput
                value={draft.title}
                onChangeText={(value) => setDraft((current) => ({ ...current, title: value }))}
                placeholder="Event name"
                placeholderTextColor={colors.text.tertiary}
                style={styles.titleInput}
                inputAccessoryViewID={inputAccessoryViewID}
              />
              <InlineError message={visibleErrors.title} />
            </Section>

            <Section title="Category" subtitle="Choose the lane this event belongs in.">
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
                {EVENT_CATEGORY_OPTIONS.map((option) => {
                  const active = draft.category === option.value;
                  return (
                    <Pressable
                      key={option.value}
                      onPress={() => setDraft((current) => ({ ...current, category: option.value }))}
                      style={({ pressed }) => [styles.choiceChip, active ? styles.choiceChipActive : null, pressed ? styles.pressed : null]}
                    >
                      <View style={[styles.choiceDot, { backgroundColor: option.color }]} />
                      <Text style={[styles.choiceChipText, active ? styles.choiceChipTextActive : null]}>{option.label}</Text>
                    </Pressable>
                  );
                })}
              </ScrollView>
              <InlineError message={visibleErrors.category} />
            </Section>

            <Section title="Date and Time">
              <Pressable onPress={() => setPickerTarget('start-date')} style={styles.rowCard}>
                <View>
                  <Text style={styles.rowLabel}>Start</Text>
                  <Text style={styles.rowValue}>{formatDateTimeLabel(draft.startsAt)}</Text>
                </View>
                <Ionicons name="calendar-outline" size={20} color={colors.text.secondary} />
              </Pressable>
              <InlineError message={visibleErrors.startsAt} />
              <Pressable onPress={() => setPickerTarget('end-date')} style={styles.rowCard}>
                <View>
                  <Text style={styles.rowLabel}>End</Text>
                  <Text style={styles.rowValue}>{formatDateTimeLabel(draft.endsAt)}</Text>
                </View>
                <Ionicons name="time-outline" size={20} color={colors.text.secondary} />
              </Pressable>
              <InlineError message={visibleErrors.endsAt} />
            </Section>

            <Section title="Recurring Event" subtitle="Turn this on for a repeating series.">
              <View style={styles.toggleCard}>
                <Text style={styles.toggleTitle}>Recurring event</Text>
                <Switch
                  value={draft.isRecurring}
                  onValueChange={(value) =>
                    setDraft((current) => ({
                      ...current,
                      isRecurring: value,
                      recurrenceUntil:
                        value && !current.recurrenceUntil
                          ? endOfDay(new Date(current.endsAt)).toISOString()
                          : value
                            ? current.recurrenceUntil
                            : null,
                    }))
                  }
                  trackColor={{ true: colors.primary.main, false: colors.border.default }}
                  thumbColor={colors.brand.white}
                />
              </View>
              {draft.isRecurring ? (
                <>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
                    {RECURRENCE_OPTIONS.map((option) => (
                      <Pressable
                        key={option.value}
                        onPress={() => setDraft((current) => ({ ...current, recurrenceFrequency: option.value }))}
                        style={({ pressed }) => [styles.secondaryChip, draft.recurrenceFrequency === option.value ? styles.secondaryChipActive : null, pressed ? styles.pressed : null]}
                      >
                        <Text style={[styles.secondaryChipText, draft.recurrenceFrequency === option.value ? styles.secondaryChipTextActive : null]}>
                          {option.label}
                        </Text>
                      </Pressable>
                    ))}
                  </ScrollView>
                  <Pressable onPress={() => setPickerTarget('recurrence-until')} style={styles.rowCard}>
                    <View>
                      <Text style={styles.rowLabel}>Repeats Until</Text>
                      <Text style={styles.rowValue}>{formatDateLabel(draft.recurrenceUntil)}</Text>
                    </View>
                    <Ionicons name="repeat" size={20} color={colors.text.secondary} />
                  </Pressable>
                </>
              ) : null}
            </Section>

            <Section title="Location" subtitle="Search a building or drop a pin on the campus map.">
              <View style={styles.inlineRow}>
                <TextInput
                  value={draft.locationQuery}
                  onChangeText={(value) =>
                    setDraft((current) => ({
                      ...current,
                      locationQuery: value,
                      locationId: null,
                      locationName:
                        value.trim().toLowerCase() === current.locationName.trim().toLowerCase()
                          ? current.locationName
                          : '',
                      latitude:
                        value.trim().toLowerCase() === current.locationName.trim().toLowerCase()
                          ? current.latitude
                          : null,
                      longitude:
                        value.trim().toLowerCase() === current.locationName.trim().toLowerCase()
                          ? current.longitude
                          : null,
                    }))
                  }
                  placeholder="Search for a location..."
                  placeholderTextColor={colors.text.tertiary}
                  style={[styles.textField, styles.flexField]}
                  inputAccessoryViewID={inputAccessoryViewID}
                />
                <Pressable
                  onPress={() =>
                    navigation.navigate('SelectEventLocation', {
                      initialCoordinate:
                        typeof draft.longitude === 'number' && typeof draft.latitude === 'number'
                          ? [draft.longitude, draft.latitude]
                          : initialCoordinate,
                      initialLocationName: draft.locationName || null,
                    })
                  }
                  style={styles.iconButton}
                >
                  <Ionicons name="location-outline" size={20} color={colors.primary.main} />
                </Pressable>
              </View>
              {filteredLocations.length > 0 ? (
                <View style={styles.listCard}>
                  {filteredLocations.map((location) => (
                    <Pressable
                      key={location.id}
                      onPress={() =>
                        selectLocation({
                          locationId: location.id,
                          locationName: location.name,
                          latitude: location.latitude,
                          longitude: location.longitude,
                        })
                      }
                      style={({ pressed }) => [styles.listRow, pressed ? styles.pressed : null]}
                    >
                      <View style={styles.listCopy}>
                        <Text style={styles.listTitle}>{location.name}</Text>
                        <Text style={styles.listSubtitle}>{location.shortName}</Text>
                      </View>
                      <Ionicons name="arrow-forward" size={16} color={colors.text.tertiary} />
                    </Pressable>
                  ))}
                </View>
              ) : null}
              <InlineError message={visibleErrors.location} />
              <TextInput
                value={draft.locationDetails}
                onChangeText={(value) => setDraft((current) => ({ ...current, locationDetails: value }))}
                placeholder="Room number or specific location"
                placeholderTextColor={colors.text.tertiary}
                style={styles.textField}
                inputAccessoryViewID={inputAccessoryViewID}
              />
            </Section>
            <Section title="Organised By">
              <Pressable onPress={() => setShowOrganizerMenu((current) => !current)} style={styles.rowCard}>
                <View style={styles.inlineInfo}>
                  <SmallLogo uri={selectedOrganizerClub?.logoUrl} fallback={selectedOrganizerClub?.name ?? 'P'} />
                  <Text style={styles.rowValue}>{selectedOrganizerClub?.name}</Text>
                </View>
                <Ionicons
                  name={showOrganizerMenu ? 'chevron-up' : 'chevron-down'}
                  size={18}
                  color={colors.text.secondary}
                />
              </Pressable>
              {showOrganizerMenu ? (
                <View style={styles.listCard}>
                  {organizerClubOptions.map((club) => (
                    <Pressable
                      key={club.id ?? 'personal'}
                      onPress={() => {
                        setDraft((current) => ({
                          ...current,
                          organizerClubId: club.id,
                          visibility:
                            current.visibility === 'club_members_only' && !club.id
                              ? 'public'
                              : current.visibility,
                        }));
                        setShowOrganizerMenu(false);
                      }}
                      style={({ pressed }) => [styles.listRow, pressed ? styles.pressed : null]}
                    >
                      <View style={styles.inlineInfo}>
                        <SmallLogo uri={club.logoUrl} fallback={club.name} />
                        <Text style={styles.listTitle}>{club.name}</Text>
                      </View>
                    </Pressable>
                  ))}
                </View>
              ) : null}
            </Section>

            <Section title="Co-Hosts" subtitle="Add any clubs sharing the spotlight.">
              <TextInput
                value={coHostQuery}
                onChangeText={setCoHostQuery}
                placeholder="Add co-hosting clubs"
                placeholderTextColor={colors.text.tertiary}
                style={styles.textField}
                inputAccessoryViewID={inputAccessoryViewID}
              />
              {filteredCoHosts.length > 0 ? (
                <View style={styles.listCard}>
                  {filteredCoHosts.map((club) => (
                    <Pressable
                      key={club.id}
                      onPress={() => {
                        setDraft((current) => ({
                          ...current,
                          coHostClubs: [...current.coHostClubs, club],
                        }));
                        setCoHostQuery('');
                      }}
                      style={({ pressed }) => [styles.listRow, pressed ? styles.pressed : null]}
                    >
                      <View style={styles.inlineInfo}>
                        <SmallLogo uri={club.logoUrl} fallback={club.name} />
                        <Text style={styles.listTitle}>{club.name}</Text>
                      </View>
                      <Ionicons name="add" size={18} color={colors.primary.main} />
                    </Pressable>
                  ))}
                </View>
              ) : null}
              <View style={styles.wrapRow}>
                {draft.coHostClubs.map((club) => (
                  <View key={club.id} style={styles.tagChip}>
                    <SmallLogo uri={club.logoUrl} fallback={club.name} />
                    <Text style={styles.tagChipText}>{club.name}</Text>
                    <Pressable
                      onPress={() =>
                        setDraft((current) => ({
                          ...current,
                          coHostClubs: current.coHostClubs.filter((item) => item.id !== club.id),
                        }))
                      }
                    >
                      <Ionicons name="close" size={14} color={colors.text.secondary} />
                    </Pressable>
                  </View>
                ))}
              </View>
            </Section>

            <Section title="Organising Committee" subtitle="These people can help manage the event.">
              <TextInput
                value={organizerQuery}
                onChangeText={setOrganizerQuery}
                placeholder="Search people by name or @handle"
                placeholderTextColor={colors.text.tertiary}
                style={styles.textField}
                inputAccessoryViewID={inputAccessoryViewID}
              />
              {filteredPeople.length > 0 ? (
                <View style={styles.listCard}>
                  {filteredPeople.map((person) => (
                    <Pressable
                      key={person.id}
                      onPress={() => {
                        setDraft((current) => ({
                          ...current,
                          organizers: [...current.organizers, person],
                        }));
                        setOrganizerQuery('');
                      }}
                      style={({ pressed }) => [styles.listRow, pressed ? styles.pressed : null]}
                    >
                      <View style={styles.inlineInfo}>
                        <SmallLogo uri={person.avatarUrl} fallback={person.displayName} />
                        <View>
                          <Text style={styles.listTitle}>{person.displayName}</Text>
                          <Text style={styles.listSubtitle}>@{person.username}</Text>
                        </View>
                      </View>
                      <Ionicons name="add" size={18} color={colors.primary.main} />
                    </Pressable>
                  ))}
                </View>
              ) : null}
              <View style={styles.wrapRow}>
                {draft.organizers.map((person) => (
                  <View key={person.id} style={styles.tagChip}>
                    <SmallLogo uri={person.avatarUrl} fallback={person.displayName} />
                    <Text style={styles.tagChipText}>{person.displayName}</Text>
                    <Pressable
                      onPress={() =>
                        setDraft((current) => ({
                          ...current,
                          organizers: current.organizers.filter((item) => item.id !== person.id),
                        }))
                      }
                    >
                      <Ionicons name="close" size={14} color={colors.text.secondary} />
                    </Pressable>
                  </View>
                ))}
              </View>
            </Section>

            <Section title="Event Details">
              <TextInput
                value={draft.description}
                onChangeText={(value) =>
                  setDraft((current) => ({ ...current, description: value.slice(0, 2000) }))
                }
                placeholder="Tell Terps what this event is about..."
                placeholderTextColor={colors.text.tertiary}
                style={[styles.textField, styles.detailsField]}
                multiline
                textAlignVertical="top"
                inputAccessoryViewID={inputAccessoryViewID}
              />
              <Text style={styles.counterText}>{draft.description.length}/2000</Text>
            </Section>

            <Section title="Media / Documents" subtitle="Add up to five images, videos, or PDFs.">
              <View style={styles.inlineRow}>
                <Pressable onPress={() => void addMediaAttachments()} style={styles.secondaryButton}>
                  <Ionicons name="images-outline" size={18} color={colors.primary.main} />
                  <Text style={styles.secondaryButtonText}>Photos & Video</Text>
                </Pressable>
                <Pressable onPress={() => void addDocumentAttachments()} style={styles.secondaryButton}>
                  <Ionicons name="document-outline" size={18} color={colors.primary.main} />
                  <Text style={styles.secondaryButtonText}>Documents</Text>
                </Pressable>
              </View>
              <View style={styles.stack}>
                {draft.attachments.map((attachment) => (
                  <View key={attachment.id} style={styles.attachmentCard}>
                    {attachment.kind === 'image' ? (
                      <Image source={{ uri: attachment.uri }} style={styles.attachmentThumb} />
                    ) : (
                      <View style={styles.attachmentFallback}>
                        <Ionicons
                          name={attachment.kind === 'video' ? 'videocam-outline' : 'document-outline'}
                          size={18}
                          color={colors.primary.main}
                        />
                      </View>
                    )}
                    <View style={styles.listCopy}>
                      <Text style={styles.listTitle} numberOfLines={1}>
                        {attachment.fileName}
                      </Text>
                      <Text style={styles.listSubtitle}>
                        {attachment.kind.toUpperCase()}
                        {formatFileSize(attachment.sizeBytes)
                          ? ` - ${formatFileSize(attachment.sizeBytes)}`
                          : ''}
                      </Text>
                    </View>
                    <Pressable
                      onPress={() =>
                        setDraft((current) => ({
                          ...current,
                          attachments: current.attachments.filter((item) => item.id !== attachment.id),
                        }))
                      }
                    >
                      <Ionicons name="close" size={16} color={colors.text.secondary} />
                    </Pressable>
                  </View>
                ))}
              </View>
            </Section>
            <Section title="RSVP Settings">
              <TextInput
                value={draft.maxCapacity}
                onChangeText={(value) =>
                  setDraft((current) => ({
                    ...current,
                    maxCapacity: value.replace(/[^0-9]/g, ''),
                  }))
                }
                placeholder="Unlimited"
                placeholderTextColor={colors.text.tertiary}
                style={styles.textField}
                keyboardType="number-pad"
                inputAccessoryViewID={inputAccessoryViewID}
              />
              <InlineError message={visibleErrors.maxCapacity} />
              {draft.maxCapacity.trim().length > 0 ? (
                <View style={styles.toggleCard}>
                  <View style={styles.listCopy}>
                    <Text style={styles.listTitle}>Enable Waitlist</Text>
                    <Text style={styles.listSubtitle}>Overflow RSVPs go to a waitlist.</Text>
                  </View>
                  <Switch
                    value={draft.waitlistEnabled}
                    onValueChange={(value) => setDraft((current) => ({ ...current, waitlistEnabled: value }))}
                    trackColor={{ true: colors.primary.main, false: colors.border.default }}
                    thumbColor={colors.brand.white}
                  />
                </View>
              ) : null}
              <View style={styles.toggleCard}>
                <View style={styles.listCopy}>
                  <Text style={styles.listTitle}>Require Approval</Text>
                  <Text style={styles.listSubtitle}>Approve attendees before they are fully in.</Text>
                </View>
                <Switch
                  value={draft.requireApproval}
                  onValueChange={(value) => setDraft((current) => ({ ...current, requireApproval: value }))}
                  trackColor={{ true: colors.primary.main, false: colors.border.default }}
                  thumbColor={colors.brand.white}
                />
              </View>
            </Section>

            <Section title="Ticket / Cost">
              <View style={styles.toggleCard}>
                <Text style={styles.listTitle}>Free Event</Text>
                <Switch
                  value={draft.isFree}
                  onValueChange={(value) =>
                    setDraft((current) => ({
                      ...current,
                      isFree: value,
                      ticketPrice: value ? '' : current.ticketPrice,
                    }))
                  }
                  trackColor={{ true: colors.primary.main, false: colors.border.default }}
                  thumbColor={colors.brand.white}
                />
              </View>
              {!draft.isFree ? (
                <>
                  <TextInput
                    value={draft.ticketPrice}
                    onChangeText={(value) =>
                      setDraft((current) => ({
                        ...current,
                        ticketPrice: value.replace(/[^0-9.]/g, ''),
                      }))
                    }
                    placeholder="Ticket price ($)"
                    placeholderTextColor={colors.text.tertiary}
                    style={styles.textField}
                    keyboardType="decimal-pad"
                    inputAccessoryViewID={inputAccessoryViewID}
                  />
                  <InlineError message={visibleErrors.ticketPrice} />
                </>
              ) : null}
            </Section>

            <Section title="Tags" subtitle="Help people discover this event.">
              <TextInput
                value={draft.tagInput}
                onChangeText={changeTagInput}
                onSubmitEditing={() => commitTag()}
                placeholder="Add tags"
                placeholderTextColor={colors.text.tertiary}
                style={styles.textField}
                inputAccessoryViewID={inputAccessoryViewID}
              />
              <View style={styles.wrapRow}>
                {draft.tags.map((tag) => (
                  <View key={tag} style={styles.tagChip}>
                    <Text style={styles.tagChipText}>#{tag}</Text>
                    <Pressable
                      onPress={() =>
                        setDraft((current) => ({
                          ...current,
                          tags: current.tags.filter((item) => item !== tag),
                        }))
                      }
                    >
                      <Ionicons name="close" size={14} color={colors.text.secondary} />
                    </Pressable>
                  </View>
                ))}
              </View>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
                {TAG_SUGGESTIONS.map((tag) => (
                  <Pressable
                    key={tag}
                    onPress={() =>
                      setDraft((current) => ({
                        ...current,
                        tags: addTagToDraft(current, tag),
                      }))
                    }
                    style={({ pressed }) => [styles.secondaryChip, pressed ? styles.pressed : null]}
                  >
                    <Text style={styles.secondaryChipText}>#{normalizeTag(tag)}</Text>
                  </Pressable>
                ))}
              </ScrollView>
            </Section>

            <Section title="Visibility">
              <View style={styles.segmented}>
                {[
                  { value: 'public', label: 'Public' },
                  { value: 'club_members_only', label: 'Club Members Only' },
                ].map((option) => {
                  const active = draft.visibility === option.value;
                  return (
                    <Pressable
                      key={option.value}
                      onPress={() =>
                        setDraft((current) => ({
                          ...current,
                          visibility: option.value as CreateEventDraft['visibility'],
                        }))
                      }
                      style={({ pressed }) => [styles.segmentedItem, active ? styles.segmentedItemActive : null, pressed ? styles.pressed : null]}
                    >
                      <Text style={[styles.segmentedText, active ? styles.segmentedTextActive : null]}>
                        {option.label}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
              <InlineError message={visibleErrors.visibility} />
            </Section>

            <Section title="Contact Info">
              <TextInput
                value={draft.contactInfo}
                onChangeText={(value) => setDraft((current) => ({ ...current, contactInfo: value }))}
                placeholder="Contact email or phone for questions"
                placeholderTextColor={colors.text.tertiary}
                style={styles.textField}
                inputAccessoryViewID={inputAccessoryViewID}
              />
            </Section>
          </ScrollView>

          <View style={[styles.bottomBar, { paddingBottom: Math.max(insets.bottom, spacing.sm) }]}>
            <Button
              title={publishing ? 'Publishing...' : 'Publish Event'}
              onPress={() => void publishEvent()}
              loading={publishing}
              disabled={publishDisabled}
              fullWidth
            />
            <Pressable onPress={() => void saveDraftAndClose()} style={styles.bottomLink}>
              <Text style={styles.bottomLinkText}>Save as Draft</Text>
            </Pressable>
          </View>

          <NativeDateTimePickerModal
            visible={Boolean(pickerTarget)}
            title={
              pickerTarget === 'start-date'
                ? 'Choose start date'
                : pickerTarget === 'start-time'
                  ? 'Choose start time'
                  : pickerTarget === 'end-date'
                    ? 'Choose end date'
                    : pickerTarget === 'end-time'
                      ? 'Choose end time'
                      : 'Choose repeat end date'
            }
            value={pickerValue}
            mode={pickerMode}
            onConfirm={updatePicker}
            onClose={() => setPickerTarget(null)}
            minimumDate={
              pickerTarget === 'end-date' || pickerTarget === 'end-time'
                ? new Date(draft.startsAt)
                : pickerTarget === 'recurrence-until'
                  ? new Date(draft.endsAt)
                  : new Date()
            }
          />

          {Platform.OS === 'ios' ? (
            <InputAccessoryView nativeID={KEYBOARD_ACCESSORY_ID}>
              <View style={styles.keyboardBar}>
                <Pressable onPress={Keyboard.dismiss}>
                  <Text style={styles.keyboardDone}>Done</Text>
                </Pressable>
              </View>
            </InputAccessoryView>
          ) : null}
        </KeyboardAvoidingView>
      </View>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background.primary },
  header: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingHorizontal: spacing.md, paddingBottom: spacing.md },
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
  headerCopy: { flex: 1 },
  headerTitle: { fontSize: typography.fontSize.xl, fontWeight: typography.fontWeight.bold, color: colors.text.primary },
  headerSubtitle: { marginTop: 2, fontSize: typography.fontSize.sm, color: colors.text.secondary },
  headerSpacer: { width: 44 },
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: spacing.md, gap: spacing.lg },
  section: { gap: spacing.sm },
  sectionLabel: { gap: 4 },
  sectionTitle: { fontSize: typography.fontSize.base, fontWeight: typography.fontWeight.bold, color: colors.text.primary },
  sectionSubtitle: { fontSize: typography.fontSize.sm, lineHeight: 20, color: colors.text.secondary },
  heroCard: {
    height: 206,
    borderRadius: borderRadius.xl,
    backgroundColor: colors.brand.white,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border.light,
    ...shadows.md,
  },
  heroImage: { width: '100%', height: '100%' },
  heroEmpty: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.sm, paddingHorizontal: spacing.lg },
  heroIconWrap: {
    width: 60,
    height: 60,
    borderRadius: borderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary.lightest,
  },
  heroTitle: { fontSize: typography.fontSize.lg, fontWeight: typography.fontWeight.bold, color: colors.text.primary },
  heroSubtitle: { fontSize: typography.fontSize.sm, lineHeight: 20, textAlign: 'center', color: colors.text.secondary },
  heroBadge: {
    position: 'absolute',
    right: spacing.sm,
    bottom: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    borderRadius: borderRadius.full,
    backgroundColor: 'rgba(15,23,42,0.68)',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  heroBadgeText: { fontSize: typography.fontSize.xs, fontWeight: typography.fontWeight.semiBold, color: colors.brand.white },
  heroRemove: {
    position: 'absolute',
    top: spacing.sm,
    right: spacing.sm,
    width: 28,
    height: 28,
    borderRadius: borderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(15,23,42,0.65)',
  },
  titleInput: {
    minHeight: 58,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.brand.white,
    borderWidth: 1,
    borderColor: colors.border.light,
    paddingHorizontal: spacing.md,
    fontSize: typography.fontSize['2xl'],
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
    ...shadows.sm,
  },
  textField: {
    minHeight: 52,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.brand.white,
    borderWidth: 1,
    borderColor: colors.border.light,
    paddingHorizontal: spacing.md,
    fontSize: typography.fontSize.base,
    color: colors.text.primary,
    ...shadows.sm,
  },
  detailsField: { minHeight: 156, paddingTop: spacing.md, paddingBottom: spacing.md },
  chipRow: { gap: spacing.sm, paddingRight: spacing.md },
  choiceChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    backgroundColor: colors.brand.white,
    borderWidth: 1,
    borderColor: colors.border.light,
  },
  choiceChipActive: { borderColor: colors.primary.main, backgroundColor: colors.primary.lightest },
  choiceDot: { width: 8, height: 8, borderRadius: borderRadius.full },
  choiceChipText: { fontSize: typography.fontSize.sm, fontWeight: typography.fontWeight.semiBold, color: colors.text.primary },
  choiceChipTextActive: { color: colors.primary.main },
  secondaryChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    backgroundColor: colors.brand.white,
    borderWidth: 1,
    borderColor: colors.border.light,
  },
  secondaryChipActive: { backgroundColor: colors.primary.main, borderColor: colors.primary.main },
  secondaryChipText: { fontSize: typography.fontSize.sm, fontWeight: typography.fontWeight.semiBold, color: colors.text.primary },
  secondaryChipTextActive: { color: colors.brand.white },
  rowCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.brand.white,
    borderWidth: 1,
    borderColor: colors.border.light,
    ...shadows.sm,
  },
  rowLabel: { fontSize: typography.fontSize.sm, color: colors.text.secondary },
  rowValue: { marginTop: 2, fontSize: typography.fontSize.base, fontWeight: typography.fontWeight.semiBold, color: colors.text.primary },
  inlineRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  flexField: { flex: 1 },
  iconButton: {
    width: 52,
    height: 52,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.brand.white,
    borderWidth: 1,
    borderColor: colors.border.light,
    ...shadows.sm,
  },
  listCard: { overflow: 'hidden', borderRadius: borderRadius.lg, backgroundColor: colors.brand.white, borderWidth: 1, borderColor: colors.border.light },
  listRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
  },
  listCopy: { flex: 1 },
  listTitle: { fontSize: typography.fontSize.sm, fontWeight: typography.fontWeight.semiBold, color: colors.text.primary },
  listSubtitle: { marginTop: 2, fontSize: typography.fontSize.xs, color: colors.text.secondary },
  inlineInfo: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, flex: 1 },
  smallLogo: { width: 24, height: 24, borderRadius: borderRadius.full },
  smallLogoFallback: { width: 24, height: 24, borderRadius: borderRadius.full, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.primary.lightest },
  smallLogoFallbackText: { fontSize: typography.fontSize.xs, fontWeight: typography.fontWeight.bold, color: colors.primary.main },
  wrapRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  tagChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
    backgroundColor: colors.brand.white,
    borderWidth: 1,
    borderColor: colors.border.light,
  },
  tagChipText: { fontSize: typography.fontSize.sm, fontWeight: typography.fontWeight.semiBold, color: colors.text.primary },
  stack: { gap: spacing.sm },
  secondaryButton: {
    flex: 1,
    minHeight: 46,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.brand.white,
    borderWidth: 1,
    borderColor: colors.border.light,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
  },
  secondaryButtonText: { fontSize: typography.fontSize.sm, fontWeight: typography.fontWeight.semiBold, color: colors.primary.main },
  attachmentCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.brand.white,
    borderWidth: 1,
    borderColor: colors.border.light,
    ...shadows.sm,
  },
  attachmentThumb: { width: 42, height: 42, borderRadius: borderRadius.md },
  attachmentFallback: { width: 42, height: 42, borderRadius: borderRadius.md, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.primary.lightest },
  toggleCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.brand.white,
    borderWidth: 1,
    borderColor: colors.border.light,
    ...shadows.sm,
  },
  toggleTitle: { fontSize: typography.fontSize.sm, fontWeight: typography.fontWeight.semiBold, color: colors.text.primary },
  segmented: { flexDirection: 'row', borderRadius: borderRadius.lg, backgroundColor: colors.brand.white, borderWidth: 1, borderColor: colors.border.light, overflow: 'hidden' },
  segmentedItem: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: spacing.md },
  segmentedItemActive: { backgroundColor: colors.primary.main },
  segmentedText: { fontSize: typography.fontSize.sm, fontWeight: typography.fontWeight.semiBold, color: colors.text.primary },
  segmentedTextActive: { color: colors.brand.white },
  errorText: { fontSize: typography.fontSize.xs, color: colors.status.error, marginTop: -2 },
  counterText: { alignSelf: 'flex-end', fontSize: typography.fontSize.xs, color: colors.text.tertiary },
  bottomBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingTop: spacing.sm,
    paddingHorizontal: spacing.md,
    backgroundColor: 'rgba(255,255,255,0.98)',
    borderTopWidth: 1,
    borderTopColor: colors.border.light,
    gap: spacing.xs,
  },
  bottomLink: { alignItems: 'center', justifyContent: 'center', minHeight: 28 },
  bottomLinkText: { fontSize: typography.fontSize.sm, fontWeight: typography.fontWeight.semiBold, color: colors.primary.main },
  keyboardBar: { alignItems: 'flex-end', paddingHorizontal: spacing.md, paddingVertical: spacing.sm, backgroundColor: colors.brand.white, borderTopWidth: 1, borderTopColor: colors.border.light },
  keyboardDone: { fontSize: typography.fontSize.sm, fontWeight: typography.fontWeight.bold, color: colors.primary.main },
  pressed: { opacity: 0.82 },
});
