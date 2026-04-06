import React, { useState } from 'react';
import { Alert, Linking, Platform, Pressable, ScrollView, Share, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import Button from '../../../shared/components/Button';
import Card from '../../../shared/components/Card';
import ScreenLayout from '../../../shared/components/ScreenLayout';
import { colors } from '../../../shared/theme/colors';
import { borderRadius, spacing } from '../../../shared/theme/spacing';
import { typography } from '../../../shared/theme/typography';
import type { CalendarStackParamList } from '../../../navigation/types';
import { useCalendarEntries } from '../hooks/useCalendarEntries';

export default function CalendarSyncSettingsScreen({ navigation }: NativeStackScreenProps<CalendarStackParamList, 'CalendarSyncSettings'>) {
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const {
    syncPreferences,
    feedUrl,
    updateSyncPreferences,
    regenerateSyncToken,
  } = useCalendarEntries({ anchorDate: new Date(), viewMode: 'week' });

  const toggleSetting = async (key: keyof NonNullable<typeof syncPreferences>) => {
    if (!syncPreferences || typeof syncPreferences[key] !== 'boolean') {
      return;
    }

    await updateSyncPreferences({ [key]: !syncPreferences[key] });
  };

  const handleCopyLink = async () => {
    if (!feedUrl) {
      return;
    }

    if (Platform.OS === 'web' && typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(feedUrl);
      setStatusMessage('Feed link copied to clipboard.');
      return;
    }

    await Share.share({ message: feedUrl });
    setStatusMessage('Feed link opened in the share sheet.');
  };

  const handleAppleCalendar = async () => {
    if (!feedUrl) {
      return;
    }

    const webcalUrl = feedUrl.replace(/^https?/i, 'webcal');
    await Linking.openURL(webcalUrl);
  };

  const handleGoogleCalendar = async () => {
    if (!feedUrl) {
      return;
    }

    const googleUrl = `https://calendar.google.com/calendar/u/0/r/settings/addbyurl?cid=${encodeURIComponent(feedUrl)}`;
    await Linking.openURL(googleUrl);
  };

  const handleRegenerate = async () => {
    await regenerateSyncToken();
    setStatusMessage('Sync token regenerated. Re-add the new link anywhere you subscribed before.');
  };

  return (
    <ScreenLayout
      title="Calendar Sync"
      subtitle="Subscribe to your xUMD schedule and decide what belongs in the exported feed."
      leftAction={
        <Pressable onPress={() => navigation.goBack()} style={styles.iconButton}>
          <Ionicons name="arrow-back" size={20} color={colors.text.primary} />
        </Pressable>
      }
    >
      <Card style={styles.card}>
        <Text style={styles.sectionTitle}>Subscription Feed</Text>
        <Text style={styles.helperText}>Use this URL in Apple Calendar, Google Calendar, or any app that supports subscribed `.ics` feeds.</Text>
        <Card style={styles.feedUrlCard}>
          <Text style={styles.feedUrlLabel}>Feed URL</Text>
          <Text selectable style={styles.feedUrlText}>{feedUrl ?? 'Generating link...'}</Text>
        </Card>
        <View style={styles.buttonStack}>
          <Button title="Add to Apple Calendar" onPress={() => void handleAppleCalendar()} fullWidth />
          <Button title="Add to Google Calendar" onPress={() => void handleGoogleCalendar()} variant="secondary" fullWidth />
          <Button title="Copy Link" onPress={() => void handleCopyLink()} variant="ghost" fullWidth />
        </View>
      </Card>

      <Card style={styles.card}>
        <Text style={styles.sectionTitle}>What to include</Text>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.toggleList}>
          {syncPreferences ? (
            [
              ['includeCourses', 'Courses'],
              ['includeEventsGoing', 'Events you are going to'],
              ['includeEventsInterested', 'Interested events'],
              ['includeClubMeetings', 'Club meetings'],
              ['includePersonalBlocks', 'Personal blocks'],
            ].map(([key, label]) => (
              <Pressable key={key} onPress={() => void toggleSetting(key as keyof typeof syncPreferences)} style={styles.toggleRow}>
                <View>
                  <Text style={styles.toggleTitle}>{label}</Text>
                  <Text style={styles.toggleSubtitle}>Included in your shared `.ics` feed.</Text>
                </View>
                <View style={[styles.togglePill, syncPreferences[key as keyof typeof syncPreferences] ? styles.togglePillActive : null]}>
                  <View style={[styles.toggleKnob, syncPreferences[key as keyof typeof syncPreferences] ? styles.toggleKnobActive : null]} />
                </View>
              </Pressable>
            ))
          ) : null}
        </ScrollView>
      </Card>

      <Card style={styles.card}>
        <Text style={styles.sectionTitle}>Security</Text>
        <Text style={styles.helperText}>Regenerating the token revokes the old feed link immediately.</Text>
        <Button title="Regenerate Link" onPress={() => void handleRegenerate()} variant="danger" fullWidth />
        {syncPreferences?.lastSyncedAt ? <Text style={styles.footnote}>Last updated {new Date(syncPreferences.lastSyncedAt).toLocaleString()}.</Text> : null}
      </Card>

      {statusMessage ? <Text style={styles.statusMessage}>{statusMessage}</Text> : null}
      <Text style={styles.footnote}>If a calendar app does not open directly, copy the feed URL above and paste it into that app's "Subscribe by URL" flow.</Text>
    </ScreenLayout>
  );
}

const styles = StyleSheet.create({
  iconButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: borderRadius.full,
    backgroundColor: colors.background.secondary,
  },
  card: {
    gap: spacing.md,
  },
  sectionTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
  },
  helperText: {
    fontSize: typography.fontSize.sm,
    lineHeight: 20,
    color: colors.text.secondary,
  },
  feedUrlCard: {
    gap: spacing.xs,
    backgroundColor: colors.background.secondary,
  },
  feedUrlLabel: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semiBold,
    color: colors.text.secondary,
    textTransform: 'uppercase',
  },
  feedUrlText: {
    fontSize: typography.fontSize.sm,
    lineHeight: 20,
    color: colors.text.primary,
  },
  buttonStack: {
    gap: spacing.sm,
  },
  toggleList: {
    gap: spacing.sm,
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: borderRadius.lg,
    backgroundColor: colors.background.secondary,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
  },
  toggleTitle: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semiBold,
    color: colors.text.primary,
  },
  toggleSubtitle: {
    marginTop: spacing.xs,
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
  },
  togglePill: {
    width: 50,
    height: 30,
    borderRadius: borderRadius.full,
    backgroundColor: colors.gray[300],
    padding: 3,
    justifyContent: 'center',
  },
  togglePillActive: {
    backgroundColor: colors.primary.main,
  },
  toggleKnob: {
    width: 24,
    height: 24,
    borderRadius: borderRadius.full,
    backgroundColor: colors.brand.white,
  },
  toggleKnobActive: {
    alignSelf: 'flex-end',
  },
  statusMessage: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semiBold,
    color: colors.primary.main,
  },
  footnote: {
    fontSize: typography.fontSize.xs,
    lineHeight: 18,
    color: colors.text.tertiary,
  },
});
