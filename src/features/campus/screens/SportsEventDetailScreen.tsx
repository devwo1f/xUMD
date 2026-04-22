import React from 'react';
import { Alert, Image, Linking, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { format, parseISO } from 'date-fns';
import Badge from '../../../shared/components/Badge';
import Button from '../../../shared/components/Button';
import Card from '../../../shared/components/Card';
import ScreenLayout from '../../../shared/components/ScreenLayout';
import { useCrossTabNavStore } from '../../../shared/stores/useCrossTabNavStore';
import { useDemoAppStore } from '../../../shared/stores/useDemoAppStore';
import { shareContent } from '../../../shared/utils/shareContent';
import { colors } from '../../../shared/theme/colors';
import { borderRadius, spacing } from '../../../shared/theme/spacing';
import { typography } from '../../../shared/theme/typography';
import type { CampusStackParamList } from '../../../navigation/types';
import { useUmdSportsSchedule } from '../hooks/useUmdSportsSchedule';

type Props = NativeStackScreenProps<CampusStackParamList, 'SportsEventDetail'>;

function makeMapUnavailableMessage(isAway: boolean) {
  return isAway
    ? 'Away and neutral-site games do not have a campus pin to show on the xUMD map.'
    : 'This athletics event does not have a mappable campus venue yet.';
}

export default function SportsEventDetailScreen({ navigation, route }: Props) {
  const { getById, isLoading, error } = useUmdSportsSchedule(true);
  const item = getById(route.params.eventId);
  const { goingEventIds, savedEventIds, setEventRsvpStatus, confirmEventRsvpStatus } = useDemoAppStore();
  const setPendingMapFocus = useCrossTabNavStore((state) => state.setPendingMapFocus);
  const setPendingCalendarFocus = useCrossTabNavStore((state) => state.setPendingCalendarFocus);
  const isInterested = savedEventIds.includes(route.params.eventId) || goingEventIds.includes(route.params.eventId);

  const toggleInterested = () => {
    const nextStatus = isInterested ? null : 'interested';
    setEventRsvpStatus(route.params.eventId, nextStatus);
    confirmEventRsvpStatus(route.params.eventId, nextStatus);
  };

  const openMap = () => {
    if (!item?.campusVenue || typeof item.event.latitude !== 'number' || typeof item.event.longitude !== 'number') {
      Alert.alert('Map unavailable', makeMapUnavailableMessage(Boolean(item?.isAway)));
      return;
    }

    setPendingMapFocus({
      type: 'event',
      eventId: item.event.id,
      latitude: item.event.latitude,
      longitude: item.event.longitude,
    });
    navigation.getParent()?.navigate('Map' as never);
  };

  const openCalendar = () => {
    if (!item) {
      return;
    }

    setPendingCalendarFocus({ date: item.event.starts_at, entryId: item.event.id });
    navigation.getParent()?.navigate('Calendar' as never);
  };

  const openLink = async (url: string) => {
    await Linking.openURL(url);
  };

  if (isLoading && !item) {
    return (
      <ScreenLayout
        title="Terps Sports"
        subtitle="Loading the official Maryland athletics schedule."
        leftAction={
          <Pressable onPress={() => navigation.goBack()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={20} color={colors.text.primary} />
          </Pressable>
        }
      >
        <Card>
          <Text style={styles.helperText}>Pulling the latest games, venues, and media links from Maryland Athletics.</Text>
        </Card>
      </ScreenLayout>
    );
  }

  if (!item) {
    return (
      <ScreenLayout
        title="Terps Sports"
        subtitle="We couldn't find this athletics event."
        leftAction={
          <Pressable onPress={() => navigation.goBack()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={20} color={colors.text.primary} />
          </Pressable>
        }
      >
        <Card>
          <Text style={styles.helperText}>{error instanceof Error ? error.message : 'Try returning to the sports schedule and opening the event again.'}</Text>
        </Card>
      </ScreenLayout>
    );
  }

  return (
    <ScreenLayout
      title="Terps Sports"
      subtitle="Official athletics schedule from Maryland."
      leftAction={
        <Pressable onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={20} color={colors.text.primary} />
        </Pressable>
      }
      rightAction={
        <Pressable
          onPress={() =>
            void shareContent({
              title: item.matchupLabel,
              message: `${item.matchupLabel}\n${item.timeLabel}\n${item.venueTitle}\n${item.sourceUrl}`,
              url: item.sourceUrl,
            })
          }
          style={styles.backButton}
        >
          <Ionicons name="share-social-outline" size={20} color={colors.text.primary} />
        </Pressable>
      }
    >
      <Card style={styles.heroCard}>
        <View style={styles.heroRow}>
          <View style={styles.logoShell}>
            {item.opponentLogoUrl ? (
              <Image source={{ uri: item.opponentLogoUrl }} style={styles.logoImage} />
            ) : (
              <MaterialCommunityIcons name="trophy-outline" size={28} color={colors.secondary.dark} />
            )}
          </View>
          <View style={styles.heroCopy}>
            <View style={styles.badgeRow}>
              <Badge label={item.sportTitle} color={colors.secondary.dark} />
              <Badge
                label={item.isHome ? 'Home' : item.isAway ? 'Away' : 'Neutral'}
                color={item.isHome ? colors.primary.main : item.isAway ? colors.text.secondary : colors.secondary.dark}
                variant="outlined"
              />
              <Badge
                label={item.statusLabel}
                color={item.statusLabel === 'Live now' ? colors.status.success : colors.text.secondary}
                variant={item.statusLabel === 'Live now' ? 'filled' : 'outlined'}
              />
            </View>
            <Text style={styles.title}>{item.matchupLabel}</Text>
            <Text style={styles.subtitle}>{item.timeLabel}</Text>
            <Text style={styles.subtitle}>{item.venueTitle}</Text>
          </View>
        </View>
      </Card>

      <View style={styles.actionRow}>
        <Button
          title={isInterested ? 'Interested' : 'Mark Interested'}
          onPress={toggleInterested}
          fullWidth
          style={styles.flexButton}
        />
        <Button
          title="Show on Map"
          onPress={openMap}
          variant="secondary"
          fullWidth
          style={styles.flexButton}
        />
      </View>

      <View style={styles.actionRow}>
        <Button title="Open in Calendar" onPress={openCalendar} variant="ghost" fullWidth style={styles.flexButton} />
      </View>

      <View style={styles.infoGrid}>
        <Card style={styles.infoCard}>
          <Text style={styles.infoLabel}>When</Text>
          <Text style={styles.infoValue}>{format(parseISO(item.startsAt), 'EEEE, MMM d')}</Text>
          <Text style={styles.infoMeta}>
            {format(parseISO(item.startsAt), 'h:mm a')} - {format(parseISO(item.endsAt), 'h:mm a')}
          </Text>
        </Card>
        <Card style={styles.infoCard}>
          <Text style={styles.infoLabel}>Venue</Text>
          <Text style={styles.infoValue}>{item.venueTitle}</Text>
          <Text style={styles.infoMeta}>{item.locationSummary}</Text>
        </Card>
        <Card style={styles.infoCard}>
          <Text style={styles.infoLabel}>What</Text>
          <Text style={styles.infoValue}>{item.sportTitle}</Text>
          <Text style={styles.infoMeta}>
            {item.conferenceGame ? 'Conference matchup' : 'Non-conference matchup'}
          </Text>
        </Card>
      </View>

      {item.resultLabel ? (
        <Card>
          <Text style={styles.sectionTitle}>Result</Text>
          <Text style={styles.resultText}>{item.resultLabel}</Text>
        </Card>
      ) : null}

      <Card>
        <Text style={styles.sectionTitle}>About this event</Text>
        <Text style={styles.bodyText}>{item.description}</Text>
      </Card>

      {item.links.length > 0 ? (
        <Card>
          <Text style={styles.sectionTitle}>Official links</Text>
          <View style={styles.linksList}>
            {item.links.map((link) => (
              <Pressable key={`${link.key}-${link.url}`} onPress={() => void openLink(link.url)} style={styles.linkRow}>
                <View style={styles.linkIconShell}>
                  <Ionicons
                    name={
                      link.key === 'tickets'
                        ? 'ticket-outline'
                        : link.key === 'watch'
                          ? 'play-circle-outline'
                          : link.key === 'listen'
                            ? 'headset-outline'
                            : link.key === 'stats'
                              ? 'stats-chart-outline'
                              : 'open-outline'
                    }
                    size={18}
                    color={colors.primary.main}
                  />
                </View>
                <View style={styles.linkCopy}>
                  <Text style={styles.linkTitle}>{link.title}</Text>
                  <Text style={styles.linkUrl} numberOfLines={1}>
                    {link.url}
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color={colors.text.tertiary} />
              </Pressable>
            ))}
          </View>
        </Card>
      ) : null}
    </ScreenLayout>
  );
}

const styles = StyleSheet.create({
  backButton: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background.secondary,
  },
  heroCard: {
    paddingVertical: spacing.lg,
  },
  heroRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  logoShell: {
    width: 76,
    height: 76,
    borderRadius: borderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.secondary.lightest,
    overflow: 'hidden',
  },
  logoImage: {
    width: '100%',
    height: '100%',
  },
  heroCopy: {
    flex: 1,
    gap: spacing.xs,
  },
  badgeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
    marginBottom: spacing.xs,
  },
  title: {
    fontSize: typography.fontSize['2xl'],
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
  },
  subtitle: {
    fontSize: typography.fontSize.base,
    color: colors.text.secondary,
    lineHeight: 22,
  },
  helperText: {
    fontSize: typography.fontSize.base,
    color: colors.text.secondary,
    lineHeight: 24,
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
  infoLabel: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semiBold,
    textTransform: 'uppercase',
    color: colors.text.secondary,
  },
  infoValue: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
  },
  infoMeta: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
    lineHeight: 20,
  },
  sectionTitle: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
    marginBottom: spacing.sm,
  },
  resultText: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    color: colors.primary.main,
  },
  bodyText: {
    fontSize: typography.fontSize.base,
    lineHeight: 24,
    color: colors.text.secondary,
  },
  linksList: {
    gap: spacing.sm,
  },
  linkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.background.secondary,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
  },
  linkIconShell: {
    width: 36,
    height: 36,
    borderRadius: borderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary.lightest,
  },
  linkCopy: {
    flex: 1,
  },
  linkTitle: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semiBold,
    color: colors.text.primary,
  },
  linkUrl: {
    marginTop: 2,
    fontSize: typography.fontSize.xs,
    color: colors.text.secondary,
  },
});
