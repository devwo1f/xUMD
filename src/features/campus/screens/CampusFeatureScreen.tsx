import React, { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import Button from '../../../shared/components/Button';
import Card from '../../../shared/components/Card';
import Badge from '../../../shared/components/Badge';
import ScreenLayout from '../../../shared/components/ScreenLayout';
import { useDemoAppStore } from '../../../shared/stores/useDemoAppStore';
import { colors } from '../../../shared/theme/colors';
import { borderRadius, spacing } from '../../../shared/theme/spacing';
import { typography } from '../../../shared/theme/typography';
import type { CampusFeatureKey, CampusStackParamList, QuickLinkKey } from '../../../navigation/types';
import { useUmdSportsSchedule } from '../hooks/useUmdSportsSchedule';

type CampusFeatureProps = NativeStackScreenProps<CampusStackParamList, 'CampusFeature'>;
type QuickLinkProps = NativeStackScreenProps<CampusStackParamList, 'CampusQuickLink'>;

const featureContent: Record<
  CampusFeatureKey,
  {
    title: string;
    subtitle: string;
    icon: string;
    color: string;
    highlights: string[];
    cta: string;
  }
> = {
  dining: {
    title: 'Dining',
    subtitle: 'What is open now, where the lines are shortest, and what is worth the walk.',
    icon: 'silverware-fork-knife',
    color: '#E21833',
    highlights: [
      '251 North is serving late-night breakfast',
      'Yahentamitsi is the fastest lunch option right now',
      'South Campus Dining has the best fries debate still raging',
    ],
    cta: 'Open Dining Tracker',
  },
  sports: {
    title: 'Sports',
    subtitle: 'Big games, rec activity, and Terps energy all in one place.',
    icon: 'trophy-outline',
    color: '#D4A200',
    highlights: [],
    cta: 'View Schedules',
  },
  safety: {
    title: 'Safety',
    subtitle: 'Important numbers, alerts, and confidence getting around at night.',
    icon: 'shield-check-outline',
    color: '#1D6FD8',
    highlights: [
      'NITE Ride is active after dark',
      'Blue light phones are mapped across campus',
      'Emergency contacts are pinned for one-tap access',
    ],
    cta: 'View Safety Resources',
  },
  'study-spots': {
    title: 'Study Spots',
    subtitle: 'Find the right room for your mood: silent, collaborative, or coffee-fueled.',
    icon: 'book-open-variant',
    color: '#2E8B57',
    highlights: [
      'McKeldin fourth floor is busiest this afternoon',
      'ESJ has open group tables',
      'Iribe atrium is lively but productive',
    ],
    cta: 'See Open Spots',
  },
  'campus-info': {
    title: 'Campus Info',
    subtitle: 'The links and references students end up needing every week.',
    icon: 'information-outline',
    color: '#6B7280',
    highlights: [
      'Advising links for major departments',
      'Parking and shuttle notices',
      'Academic deadlines and registrar reminders',
    ],
    cta: 'Browse Resources',
  },
  'course-reviews': {
    title: 'Course Reviews',
    subtitle: 'A place for honest class notes, workload expectations, and professor tips.',
    icon: 'star-outline',
    color: '#A855F7',
    highlights: [
      'Students are comparing CMSC workload patterns',
      'Gen-ed suggestions are trending this week',
      'Reviews focus on real assignments and class rhythm',
    ],
    cta: 'Read Reviews',
  },
};

const quickLinkContent: Record<
  QuickLinkKey,
  {
    title: string;
    subtitle: string;
    icon: string;
    steps: string[];
  }
> = {
  terpmail: {
    title: 'TERPmail',
    subtitle: 'Your official University of Maryland email inbox and announcements.',
    icon: 'email-outline',
    steps: [
      'Check time-sensitive professor updates',
      'Watch for event confirmations and SGA notices',
      'Use it as your login identity across campus tools',
    ],
  },
  elms: {
    title: 'ELMS',
    subtitle: 'Assignments, modules, announcements, and course content.',
    icon: 'school-outline',
    steps: [
      "Open today's assignments",
      'Check new announcements before class',
      'Track grades and discussion deadlines',
    ],
  },
  testudo: {
    title: 'Testudo',
    subtitle: 'Registration, student records, appointment details, and more.',
    icon: 'file-document-outline',
    steps: [
      'Review registration dates',
      'Check unofficial transcript tools',
      'Manage account and student services',
    ],
  },
  'shuttle-um': {
    title: 'Shuttle-UM',
    subtitle: 'Bus routes, arrival timing, and late-night transportation planning.',
    icon: 'map-outline',
    steps: [
      'Check the nearest bus route',
      'Plan late-night return trips',
      'Watch route updates during events and weather',
    ],
  },
};

function SportsScheduleCard({
  matchupLabel,
  sportTitle,
  timeLabel,
  venueTitle,
  statusLabel,
  isHome,
  isAway,
  campusVenue,
  resultLabel,
  opponentLogoUrl,
  interested,
  onPress,
}: {
  matchupLabel: string;
  sportTitle: string;
  timeLabel: string;
  venueTitle: string;
  statusLabel: string;
  isHome: boolean;
  isAway: boolean;
  campusVenue: boolean;
  resultLabel: string | null;
  opponentLogoUrl: string | null;
  interested: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [pressed ? styles.pressed : null]}>
      <Card style={styles.sportsCard}>
        <View style={styles.sportsCardTopRow}>
          <View style={styles.sportsCardLogoShell}>
            {opponentLogoUrl ? (
              <Image source={{ uri: opponentLogoUrl }} style={styles.sportsCardLogoImage} />
            ) : null}
            {!opponentLogoUrl ? (
              <MaterialCommunityIcons name="trophy-outline" size={22} color={colors.secondary.dark} />
            ) : null}
          </View>
          <View style={styles.sportsCardBadges}>
            <Badge label={sportTitle} color={colors.secondary.dark} />
            <Badge
              label={isHome ? 'Home' : isAway ? 'Away' : 'Neutral'}
              color={isHome ? colors.primary.main : colors.text.secondary}
              variant="outlined"
            />
            <Badge
              label={statusLabel}
              color={statusLabel === 'Live now' ? colors.status.success : colors.text.secondary}
              variant={statusLabel === 'Live now' ? 'filled' : 'outlined'}
            />
            {interested ? <Badge label="Interested" color={colors.primary.main} /> : null}
          </View>
        </View>

        <Text style={styles.sportsCardTitle}>{matchupLabel}</Text>
        <Text style={styles.sportsCardMeta}>{timeLabel}</Text>
        <Text style={styles.sportsCardMeta}>{venueTitle}</Text>

        {resultLabel ? <Text style={styles.sportsCardResult}>{resultLabel}</Text> : null}

        <View style={styles.sportsCardFooter}>
          <View style={styles.sportsCardFooterLeft}>
            <Ionicons
              name={campusVenue ? 'location-outline' : 'calendar-outline'}
              size={16}
              color={campusVenue ? colors.primary.main : colors.text.secondary}
            />
            <Text style={styles.sportsCardFooterText}>
              {campusVenue ? 'Map + calendar ready' : 'Calendar-ready, off-campus venue'}
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={colors.text.tertiary} />
        </View>
      </Card>
    </Pressable>
  );
}

function CampusSportsFeature({ navigation }: { navigation: CampusFeatureProps['navigation'] }) {
  const { items, grouped, isLoading, error, refetch } = useUmdSportsSchedule(true);
  const { savedEventIds, goingEventIds } = useDemoAppStore();
  const [selectedSport, setSelectedSport] = useState<string>('All');

  const filteredItems = useMemo(() => {
    if (selectedSport === 'All') {
      return items;
    }

    return items.filter((item) => item.sportTitle === selectedSport);
  }, [items, selectedSport]);

  const liveItems = filteredItems.filter((item) => item.statusLabel === 'Live now');
  const upcomingItems = filteredItems.filter((item) => item.statusLabel === 'Upcoming').slice(0, 18);
  const finalItems = filteredItems.filter((item) => item.statusLabel === 'Final').slice(0, 8);
  const homeGameCount = filteredItems.filter((item) => item.isHome).length;

  return (
    <ScreenLayout
      title="Sports"
      subtitle="Official Maryland athletics schedule, right inside xUMD."
      leftAction={
        <Pressable onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={20} color={colors.text.primary} />
        </Pressable>
      }
    >
      <Card style={styles.heroCard}>
        <View style={styles.heroIconWrap}>
          <View style={[styles.heroIcon, { backgroundColor: '#FFF7D6' }]}>
            <MaterialCommunityIcons name="trophy-outline" size={30} color={colors.secondary.dark} />
          </View>
          <View style={styles.heroMetrics}>
            <View style={styles.heroMetric}>
              <Text style={styles.heroMetricValue}>{grouped.live.length}</Text>
              <Text style={styles.heroMetricLabel}>Live</Text>
            </View>
            <View style={styles.heroMetric}>
              <Text style={styles.heroMetricValue}>{grouped.upcoming.length}</Text>
              <Text style={styles.heroMetricLabel}>Upcoming</Text>
            </View>
            <View style={styles.heroMetric}>
              <Text style={styles.heroMetricValue}>{homeGameCount}</Text>
              <Text style={styles.heroMetricLabel}>Home</Text>
            </View>
          </View>
        </View>
        <Text style={styles.heroTitle}>Terps schedule from the official athletics calendar</Text>
        <Text style={styles.heroSubtitle}>
          Matchups, dates, times, venues, watch links, and results are pulled from Maryland Athletics.
        </Text>
      </Card>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScrollRow}>
        {['All', ...grouped.sports].map((sport) => {
          const active = selectedSport === sport;
          return (
            <Pressable
              key={sport}
              onPress={() => setSelectedSport(sport)}
              style={[styles.sportFilterChip, active ? styles.sportFilterChipActive : null]}
            >
              <View style={[styles.sportFilterDot, { backgroundColor: active ? colors.brand.white : colors.secondary.dark }]} />
              <Text style={[styles.sportFilterText, active ? styles.sportFilterTextActive : null]}>{sport}</Text>
            </Pressable>
          );
        })}
      </ScrollView>

      {isLoading ? (
        <Card style={styles.loadingCard}>
          <ActivityIndicator size="small" color={colors.primary.main} />
          <Text style={styles.helperText}>Loading the latest Terps schedule from Maryland Athletics.</Text>
        </Card>
      ) : null}

      {!isLoading && error ? (
        <Card>
          <Text style={styles.errorText}>
            {error instanceof Error ? error.message : 'Unable to load the Maryland Athletics schedule right now.'}
          </Text>
          <Button title="Try Again" onPress={() => void refetch()} variant="secondary" fullWidth />
        </Card>
      ) : null}

      {!isLoading && !error && filteredItems.length === 0 ? (
        <Card>
          <Text style={styles.helperText}>There are no athletics events in this filter right now.</Text>
        </Card>
      ) : null}

      {liveItems.length > 0 ? (
        <View style={styles.sectionBlock}>
          <Text style={styles.sectionTitle}>Live now</Text>
          <View style={styles.stack}>
            {liveItems.map((item) => (
              <SportsScheduleCard
                key={item.id}
                matchupLabel={item.matchupLabel}
                sportTitle={item.sportTitle}
                timeLabel={item.timeLabel}
                venueTitle={item.venueTitle}
                statusLabel={item.statusLabel}
                isHome={item.isHome}
                isAway={item.isAway}
                campusVenue={item.campusVenue}
                resultLabel={item.resultLabel}
                opponentLogoUrl={item.opponentLogoUrl}
                interested={savedEventIds.includes(item.id) || goingEventIds.includes(item.id)}
                onPress={() => navigation.navigate('SportsEventDetail', { eventId: item.id })}
              />
            ))}
          </View>
        </View>
      ) : null}

      {upcomingItems.length > 0 ? (
        <View style={styles.sectionBlock}>
          <Text style={styles.sectionTitle}>Coming up</Text>
          <View style={styles.stack}>
            {upcomingItems.map((item) => (
              <SportsScheduleCard
                key={item.id}
                matchupLabel={item.matchupLabel}
                sportTitle={item.sportTitle}
                timeLabel={item.timeLabel}
                venueTitle={item.venueTitle}
                statusLabel={item.statusLabel}
                isHome={item.isHome}
                isAway={item.isAway}
                campusVenue={item.campusVenue}
                resultLabel={item.resultLabel}
                opponentLogoUrl={item.opponentLogoUrl}
                interested={savedEventIds.includes(item.id) || goingEventIds.includes(item.id)}
                onPress={() => navigation.navigate('SportsEventDetail', { eventId: item.id })}
              />
            ))}
          </View>
        </View>
      ) : null}

      {finalItems.length > 0 ? (
        <View style={styles.sectionBlock}>
          <Text style={styles.sectionTitle}>Recent results</Text>
          <View style={styles.stack}>
            {finalItems.map((item) => (
              <SportsScheduleCard
                key={item.id}
                matchupLabel={item.matchupLabel}
                sportTitle={item.sportTitle}
                timeLabel={item.timeLabel}
                venueTitle={item.venueTitle}
                statusLabel={item.statusLabel}
                isHome={item.isHome}
                isAway={item.isAway}
                campusVenue={item.campusVenue}
                resultLabel={item.resultLabel}
                opponentLogoUrl={item.opponentLogoUrl}
                interested={savedEventIds.includes(item.id) || goingEventIds.includes(item.id)}
                onPress={() => navigation.navigate('SportsEventDetail', { eventId: item.id })}
              />
            ))}
          </View>
        </View>
      ) : null}

      <Button
        title="Open Official Athletics Calendar"
        onPress={() => void Linking.openURL('https://umterps.com/calendar')}
        variant="ghost"
        fullWidth
      />
    </ScreenLayout>
  );
}

export function CampusFeatureScreen({ navigation, route }: CampusFeatureProps) {
  if (route.params.featureKey === 'sports') {
    return <CampusSportsFeature navigation={navigation} />;
  }

  const content = featureContent[route.params.featureKey];

  return (
    <ScreenLayout
      title={content.title}
      subtitle={content.subtitle}
      leftAction={
        <Pressable onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={20} color={colors.text.primary} />
        </Pressable>
      }
    >
      <Card style={styles.heroCard}>
        <View style={[styles.heroIcon, { backgroundColor: `${content.color}1A` }]}>
          <MaterialCommunityIcons name={content.icon as never} size={28} color={content.color} />
        </View>
        <Text style={styles.heroTitle}>{content.title}</Text>
        <Text style={styles.heroSubtitle}>{content.subtitle}</Text>
      </Card>

      {content.highlights.map((item) => (
        <Card key={item}>
          <Text style={styles.listItem}>{item}</Text>
        </Card>
      ))}

      <Button
        title={content.cta}
        onPress={() =>
          Alert.alert(content.title, 'This is ready to connect to live campus data next.')
        }
        fullWidth
      />
    </ScreenLayout>
  );
}

export function CampusQuickLinkScreen({ navigation, route }: QuickLinkProps) {
  const content = quickLinkContent[route.params.quickLinkKey];

  return (
    <ScreenLayout
      title={content.title}
      subtitle={content.subtitle}
      leftAction={
        <Pressable onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={20} color={colors.text.primary} />
        </Pressable>
      }
    >
      <Card style={styles.heroCard}>
        <View style={styles.heroIconAlt}>
          <MaterialCommunityIcons
            name={content.icon as never}
            size={26}
            color={colors.primary.main}
          />
        </View>
        <Text style={styles.heroTitle}>{content.title}</Text>
        <Text style={styles.heroSubtitle}>{content.subtitle}</Text>
      </Card>

      <Card>
        <Text style={styles.sectionTitle}>What you can do here</Text>
        <View style={styles.steps}>
          {content.steps.map((step, index) => (
            <View key={step} style={styles.stepRow}>
              <View style={styles.stepBadge}>
                <Text style={styles.stepNumber}>{index + 1}</Text>
              </View>
              <Text style={styles.stepText}>{step}</Text>
            </View>
          ))}
        </View>
      </Card>

      <Button
        title={`Open ${content.title}`}
        onPress={() =>
          Alert.alert(
            content.title,
            'Browser linking can be connected here when live URLs are added.',
          )
        }
        fullWidth
      />
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
  heroCard: {
    alignItems: 'center',
  },
  heroIconWrap: {
    width: '100%',
    gap: spacing.md,
  },
  heroIcon: {
    width: 72,
    height: 72,
    borderRadius: borderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  heroIconAlt: {
    width: 72,
    height: 72,
    borderRadius: borderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
    backgroundColor: colors.primary.lightest,
  },
  heroMetrics: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  heroMetric: {
    flex: 1,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.background.secondary,
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  heroMetricValue: {
    fontSize: typography.fontSize['2xl'],
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
  },
  heroMetricLabel: {
    marginTop: spacing.xs,
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
    textTransform: 'uppercase',
  },
  heroTitle: {
    fontSize: typography.fontSize['2xl'],
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
    textAlign: 'center',
  },
  heroSubtitle: {
    fontSize: typography.fontSize.base,
    lineHeight: 24,
    color: colors.text.secondary,
    textAlign: 'center',
    marginTop: spacing.sm,
  },
  listItem: {
    fontSize: typography.fontSize.base,
    lineHeight: 24,
    color: colors.text.primary,
  },
  sectionTitle: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
    marginBottom: spacing.md,
  },
  steps: {
    gap: spacing.md,
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  stepBadge: {
    width: 28,
    height: 28,
    borderRadius: borderRadius.full,
    backgroundColor: colors.primary.lightest,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  stepNumber: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.bold,
    color: colors.primary.main,
  },
  stepText: {
    flex: 1,
    fontSize: typography.fontSize.base,
    lineHeight: 24,
    color: colors.text.primary,
  },
  filterScrollRow: {
    gap: spacing.sm,
    paddingRight: spacing.sm,
  },
  sportFilterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    height: 38,
    borderRadius: borderRadius.full,
    paddingHorizontal: spacing.md,
    borderWidth: 1,
    borderColor: colors.border.light,
    backgroundColor: colors.brand.white,
  },
  sportFilterChipActive: {
    backgroundColor: colors.primary.main,
    borderColor: colors.primary.main,
  },
  sportFilterDot: {
    width: 8,
    height: 8,
    borderRadius: borderRadius.full,
  },
  sportFilterText: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semiBold,
    color: colors.text.primary,
  },
  sportFilterTextActive: {
    color: colors.brand.white,
  },
  loadingCard: {
    alignItems: 'center',
    gap: spacing.sm,
  },
  helperText: {
    fontSize: typography.fontSize.base,
    lineHeight: 24,
    color: colors.text.secondary,
    textAlign: 'center',
  },
  errorText: {
    fontSize: typography.fontSize.base,
    lineHeight: 24,
    color: colors.status.error,
    marginBottom: spacing.md,
  },
  sectionBlock: {
    gap: spacing.sm,
  },
  stack: {
    gap: spacing.sm,
  },
  sportsCard: {
    gap: spacing.sm,
  },
  sportsCardTopRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
  },
  sportsCardLogoShell: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.full,
    backgroundColor: colors.secondary.lightest,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sportsCardLogoImage: {
    width: '100%',
    height: '100%',
    borderRadius: borderRadius.full,
  },
  sportsCardBadges: {
    flex: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  sportsCardTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
  },
  sportsCardMeta: {
    fontSize: typography.fontSize.sm,
    lineHeight: 20,
    color: colors.text.secondary,
  },
  sportsCardResult: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semiBold,
    color: colors.primary.main,
  },
  sportsCardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.xs,
  },
  sportsCardFooterLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    flex: 1,
  },
  sportsCardFooterText: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
  },
  pressed: {
    opacity: 0.86,
  },
});
