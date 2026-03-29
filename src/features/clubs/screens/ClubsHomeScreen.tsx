import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import ClubCard from '../../../shared/components/ClubCard';
import HeaderTag from '../../../shared/components/HeaderTag';
import ScreenLayout from '../../../shared/components/ScreenLayout';
import UMDBrandLockup from '../../../shared/components/UMDBrandLockup';
import SearchBar from '../../../shared/components/SearchBar';
import CategoryChips from '../../../shared/components/CategoryChips';
import { useClubs } from '../hooks/useClubs';
import { colors } from '../../../shared/theme/colors';
import { borderRadius, spacing } from '../../../shared/theme/spacing';
import { typography } from '../../../shared/theme/typography';
import type { ClubsStackParamList } from '../../../navigation/types';

type Props = NativeStackScreenProps<ClubsStackParamList, 'ClubsHome'>;

const categories = ['All', 'Academic', 'Sports', 'Cultural', 'Professional', 'Social', 'Service', 'Arts'];

export default function ClubsHomeScreen({ navigation }: Props) {
  const { clubs, search, setSearch, category, setCategory, sort, setSort } = useClubs();

  return (
    <ScreenLayout
      title="Clubs & Orgs"
      subtitle="Find your people at Maryland."
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

      <View style={styles.metaRow}>
        <Text style={styles.metaTitle}>Top Clubs</Text>
        <View style={styles.metaFilter}>
          <Ionicons name="filter-outline" size={16} color={colors.text.secondary} />
          <Text style={styles.metaFilterText}>{clubs.length} results</Text>
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
