import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { format } from 'date-fns';
import Card from '../../../shared/components/Card';
import { colors } from '../../../shared/theme/colors';
import { borderRadius, shadows, spacing } from '../../../shared/theme/spacing';
import { typography } from '../../../shared/theme/typography';
import type { CalendarConflict, CalendarEntry } from '../types';
import { formatCalendarTime, getEntryTypeLabel } from '../utils/calendar';

interface MiniCalendarStripProps {
  date?: Date;
  entries: CalendarEntry[];
  conflicts: CalendarConflict[];
  summary: string;
  onViewFullCalendar: () => void;
  onEntryTap: (entry: CalendarEntry) => void;
  onConflictTap: () => void;
  onEmptyTap?: () => void;
}

export default function MiniCalendarStrip({
  date = new Date(),
  entries,
  conflicts,
  summary,
  onViewFullCalendar,
  onEntryTap,
  onConflictTap,
  onEmptyTap,
}: MiniCalendarStripProps) {
  const activeEntries = entries.slice(0, 8);

  return (
    <Card style={styles.card}>
      <View style={styles.headerRow}>
        <View>
          <Text style={styles.headerTitle}>Today, {format(date, 'MMM d')}</Text>
          <Text style={styles.headerSubtitle}>Your day at a glance</Text>
        </View>
        <Pressable onPress={onViewFullCalendar}>
          <Text style={styles.linkText}>Full Cal →</Text>
        </Pressable>
      </View>

      {activeEntries.length > 0 ? (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
          {activeEntries.map((entry) => (
            <Pressable
              key={entry.id}
              onPress={() => onEntryTap(entry)}
              style={({ pressed }) => [styles.entryCard, pressed ? styles.entryCardPressed : null]}
            >
              <View style={[styles.colorBar, { backgroundColor: entry.color }]} />
              <View style={styles.entryMetaRow}>
                <View style={[styles.entryTypePill, entry.isDashed && styles.entryTypePillDashed]}>
                  <Ionicons name={entry.icon as never} size={12} color={entry.color} />
                  <Text style={[styles.entryTypeText, { color: entry.color }]}>{getEntryTypeLabel(entry)}</Text>
                </View>
              </View>
              <Text style={styles.entryTitle} numberOfLines={2}>{entry.title}</Text>
              <Text style={styles.entryTime}>{formatCalendarTime(entry)}</Text>
              <Text style={styles.entryLocation} numberOfLines={1}>{entry.locationName}</Text>
            </Pressable>
          ))}
        </ScrollView>
      ) : (
        <Pressable onPress={onEmptyTap ?? onViewFullCalendar} style={styles.emptyState}>
          <Text style={styles.emptyTitle}>Nothing scheduled today.</Text>
          <Text style={styles.emptyBody}>Browse events or add a personal block to start shaping your day.</Text>
        </Pressable>
      )}

      {conflicts.length > 0 ? (
        <Pressable onPress={onConflictTap} style={styles.conflictBadge}>
          <Ionicons name="warning-outline" size={16} color={colors.status.warning} />
          <Text style={styles.conflictText}>{conflicts.length} conflict{conflicts.length === 1 ? '' : 's'} today</Text>
        </Pressable>
      ) : null}

      <View style={styles.summaryPill}>
        <Ionicons name="calendar-outline" size={14} color={colors.text.secondary} />
        <Text style={styles.summaryText}>{summary}</Text>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: spacing.md,
    borderWidth: 1,
    borderColor: colors.border.light,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  headerTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
  },
  headerSubtitle: {
    marginTop: spacing.xs,
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
  },
  linkText: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semiBold,
    color: colors.primary.main,
  },
  row: {
    gap: spacing.md,
    paddingRight: spacing.sm,
  },
  entryCard: {
    width: 168,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.brand.white,
    borderWidth: 1,
    borderColor: colors.border.light,
    padding: spacing.md,
    gap: spacing.sm,
    ...shadows.sm,
  },
  entryCardPressed: {
    opacity: 0.9,
  },
  colorBar: {
    height: 4,
    borderRadius: borderRadius.full,
  },
  entryMetaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  entryTypePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    alignSelf: 'flex-start',
    borderRadius: borderRadius.full,
    backgroundColor: colors.background.secondary,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  entryTypePillDashed: {
    borderWidth: 1,
    borderColor: colors.border.default,
    borderStyle: 'dashed',
  },
  entryTypeText: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.semiBold,
    textTransform: 'uppercase',
    letterSpacing: typography.letterSpacing.wide,
  },
  entryTitle: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
  },
  entryTime: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semiBold,
    color: colors.text.secondary,
  },
  entryLocation: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
  },
  conflictBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: spacing.xs,
    borderRadius: borderRadius.full,
    backgroundColor: colors.status.warningLight,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  conflictText: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semiBold,
    color: colors.text.primary,
  },
  summaryPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    borderRadius: borderRadius.full,
    backgroundColor: colors.background.secondary,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  summaryText: {
    flex: 1,
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
  },
  emptyState: {
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border.light,
    borderStyle: 'dashed',
    padding: spacing.md,
    backgroundColor: colors.background.secondary,
    gap: spacing.xs,
  },
  emptyTitle: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
  },
  emptyBody: {
    fontSize: typography.fontSize.sm,
    lineHeight: 20,
    color: colors.text.secondary,
  },
});
