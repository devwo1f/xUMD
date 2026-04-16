import React, { useMemo } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { format } from 'date-fns';
import ClubCard from '../../../shared/components/ClubCard';
import HeaderTag from '../../../shared/components/HeaderTag';
import ScreenLayout from '../../../shared/components/ScreenLayout';
import UMDBrandLockup from '../../../shared/components/UMDBrandLockup';
import SearchBar from '../../../shared/components/SearchBar';
import CategoryChips from '../../../shared/components/CategoryChips';
import { colors } from '../../../shared/theme/colors';
import { borderRadius, spacing } from '../../../shared/theme/spacing';
import { typography } from '../../../shared/theme/typography';
import type { CalendarEntry } from '../../calendar/types';
import { useCalendarEntries } from '../../calendar/hooks/useCalendarEntries';
import { useClubs } from '../hooks/useClubs';
import type { CampusStackParamList, ClubsStackParamList } from '../../../navigation/types';

type Props = NativeStackScreenProps<ClubsStackParamList & CampusStackParamList, 'ClubsHome'>;

const categories = ['All', 'Academic', 'Sports', 'Cultural', 'Professional', 'Social', 'Service', 'Arts'];

export default function ClubsHomeScreen({ navigation }: Props) {
  const {
    clubs,
    search,
    setSearch,
    category,
    setCategory,
    sort,
    setSort,
    viewerId,
    getClubsForUser,
    isLoading,
  } = useClubs();
  const { entries } = useCalendarEntries({ anchorDate: new Date(), viewMode: 'week' });

  const joinedClubs = useMemo(
    () => getClubsForUser(viewerId),
    [getClubsForUser, viewerId],
  );

  const nextMeetingByClubId = useMemo(() => {
    const upcomingMeetings = entries
      .filter((entry) => entry.type === 'club_meeting' && entry.clubId)
      .filter((entry) => new Date(entry.endsAt) >= new Date())
      .sort((left, right) => new Date(left.startsAt).getTime() - new Date(right.startsAt).getTime());

    const mapping = new Map<string, CalendarEntry>();
    upcomingMeetings.forEach((entry) => {
      if (entry.clubId && !mapping.has(entry.clubId)) {
        mapping.set(entry.clubId, entry);
      }
    });

    return mapping;
  }, [entries]);

  return (
    <ScreenLayout
      title="Clubs"
      subtitle="Find your community at Maryland."
      headerTopContent={<UMDBrandLockup />}
      headerMetaContent={
        <HeaderTag
          icon="people-outline"
          label="Communities"
          color={colors.status.success}
          tintColor={colors.status.successLight}
        />
      }
      headerStyle={styles.headerShell}
      leftAction={
        navigation.canGoBack() ? (
          <Pressable onPress={() => navigation.goBack()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={20} color={colors.text.primary} />
          </Pressable>
        ) : undefined
      }
    >
      <SearchBar value={search} onChangeText={setSearch} placeholder="Search clubs..." debounceMs={0} />

      <CategoryChips categories={categories} selected={category} onSelect={setCategory} />

      <View style={styles.sortRow}>
        {[
          { label: 'Most Members', value: 'member_count' },
          { label: 'Newest', value: 'created_at' },
          { label: 'A-Z', value: 'name' },
        ].map((option) => {
          const selected = sort === option.value;
          return (
            <Pressable
              key={option.value}
              onPress={() => setSort(option.value as typeof sort)}
              style={[styles.sortChip, selected && styles.sortChipActive]}
            >
              <Text style={[styles.sortLabel, selected && styles.sortLabelActive]}>{option.label}</Text>
            </Pressable>
          );
        })}
      </View>

      {joinedClubs.length > 0 ? (
        <View style={styles.sectionWrap}>
          <Text style={styles.sectionTitle}>Your Clubs</Text>
          <View style={styles.joinedList}>
            {joinedClubs.map((club) => {
              const nextMeeting = nextMeetingByClubId.get(club.id);
              return (
                <Pressable
                  key={club.id}
                  onPress={() => navigation.navigate('ClubDetail', { clubId: club.id })}
                  style={styles.joinedCard}
                >
                  <View style={styles.joinedHeaderRow}>
                    <View style={styles.joinedIcon}>
                      <Ionicons name="people-outline" size={18} color={colors.brand.white} />
                    </View>
                    <View style={styles.joinedCopy}>
                      <Text style={styles.joinedName}>{club.name}</Text>
                      <Text style={styles.joinedMeta}>{club.member_count.toLocaleString()} members</Text>
                    </View>
                    <View style={styles.joinedPill}>
                      <Text style={styles.joinedPillText}>Joined</Text>
                    </View>
                  </View>
                  <Text style={styles.joinedSchedule}>
                    {nextMeeting
                      ? `Next: ${format(new Date(nextMeeting.startsAt), 'EEE h:mm a')} | ${nextMeeting.locationName}`
                      : club.meeting_schedule ?? 'Meeting schedule coming soon'}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>
      ) : null}

      <View style={styles.metaRow}>
        <Text style={styles.metaTitle}>Discover Clubs</Text>
        <View style={styles.metaFilter}>
          <Ionicons name="filter-outline" size={16} color={colors.text.secondary} />
          <Text style={styles.metaFilterText}>{isLoading ? 'Syncing...' : `${clubs.length} results`}</Text>
        </View>
      </View>

      <View style={styles.listWrap}>
        {clubs.map((club) => (
          <ClubCard
            key={club.id}
            club={{
              id: club.id,
              name: club.name,
              category: club.category,
              logoUri: club.logo_url ?? undefined,
              memberCount: club.member_count,
              description: club.short_description,
            }}
            onPress={() => navigation.navigate('ClubDetail', { clubId: club.id })}
          />
        ))}
      </View>
    </ScreenLayout>
  );
}

const styles = StyleSheet.create({
  headerShell: {
    marginTop: spacing.sm,
    borderRadius: borderRadius.xl,
    paddingTop: spacing.lg,
    paddingBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.status.successLight,
    backgroundColor: '#FCFFFD',
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: borderRadius.full,
    backgroundColor: colors.background.secondary,
  },
  sortRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  sortChip: {
    borderWidth: 1,
    borderColor: colors.border.default,
    borderRadius: borderRadius.full,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.brand.white,
  },
  sortChipActive: {
    backgroundColor: colors.primary.main,
    borderColor: colors.primary.main,
  },
  sortLabel: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semiBold,
    color: colors.text.secondary,
  },
  sortLabelActive: {
    color: colors.brand.white,
  },
  sectionWrap: {
    gap: spacing.md,
  },
  sectionTitle: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
    textTransform: 'uppercase',
  },
  joinedList: {
    gap: spacing.md,
  },
  joinedCard: {
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border.light,
    backgroundColor: colors.brand.white,
    padding: spacing.md,
    gap: spacing.sm,
  },
  joinedHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  joinedIcon: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#9C27B0',
  },
  joinedCopy: {
    flex: 1,
    gap: 2,
  },
  joinedName: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
  },
  joinedMeta: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
  },
  joinedPill: {
    borderRadius: borderRadius.full,
    backgroundColor: colors.status.successLight,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  joinedPillText: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.semiBold,
    color: colors.status.success,
    textTransform: 'uppercase',
    letterSpacing: typography.letterSpacing.wide,
  },
  joinedSchedule: {
    fontSize: typography.fontSize.sm,
    lineHeight: 20,
    color: colors.text.secondary,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  metaTitle: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
    textTransform: 'uppercase',
  },
  metaFilter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  metaFilterText: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
  },
  listWrap: {
    borderRadius: borderRadius.lg,
    backgroundColor: colors.brand.white,
    overflow: 'hidden',
  },
});
