import React from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import Button from '../../../shared/components/Button';
import Card from '../../../shared/components/Card';
import ScreenLayout from '../../../shared/components/ScreenLayout';
import { colors } from '../../../shared/theme/colors';
import { borderRadius, spacing } from '../../../shared/theme/spacing';
import { typography } from '../../../shared/theme/typography';
import type { CampusFeatureKey, CampusStackParamList, QuickLinkKey } from '../../../navigation/types';

type CampusFeatureProps = NativeStackScreenProps<CampusStackParamList, 'CampusFeature'>;
type QuickLinkProps = NativeStackScreenProps<CampusStackParamList, 'CampusQuickLink'>;

const featureContent: Record<CampusFeatureKey, {
  title: string;
  subtitle: string;
  icon: string;
  color: string;
  highlights: string[];
  cta: string;
}> = {
  'dining': {
    title: 'Dining',
    subtitle: 'What is open now, where the lines are shortest, and what is worth the walk.',
    icon: 'silverware-fork-knife',
    color: '#E21833',
    highlights: ['251 North is serving late-night breakfast', 'Yahentamitsi is the fastest lunch option right now', 'South Campus Dining has the best fries debate still raging'],
    cta: 'Open Dining Tracker',
  },
  'sports': {
    title: 'Sports',
    subtitle: 'Big games, rec activity, and Terps energy all in one place.',
    icon: 'trophy-outline',
    color: '#D4A200',
    highlights: ['Basketball tips off at 7 PM in XFINITY Center', 'Maryland Stadium tours are back this weekend', 'Eppley intramural signups close tomorrow'],
    cta: 'View Schedules',
  },
  'safety': {
    title: 'Safety',
    subtitle: 'Important numbers, alerts, and confidence getting around at night.',
    icon: 'shield-check-outline',
    color: '#1D6FD8',
    highlights: ['NITE Ride is active after dark', 'Blue light phones are mapped across campus', 'Emergency contacts are pinned for one-tap access'],
    cta: 'View Safety Resources',
  },
  'study-spots': {
    title: 'Study Spots',
    subtitle: 'Find the right room for your mood: silent, collaborative, or coffee-fueled.',
    icon: 'book-open-variant',
    color: '#2E8B57',
    highlights: ['McKeldin fourth floor is busiest this afternoon', 'ESJ has open group tables', 'Iribe atrium is lively but productive'],
    cta: 'See Open Spots',
  },
  'campus-info': {
    title: 'Campus Info',
    subtitle: 'The links and references students end up needing every week.',
    icon: 'information-outline',
    color: '#6B7280',
    highlights: ['Advising links for major departments', 'Parking and shuttle notices', 'Academic deadlines and registrar reminders'],
    cta: 'Browse Resources',
  },
  'course-reviews': {
    title: 'Course Reviews',
    subtitle: 'A place for honest class notes, workload expectations, and professor tips.',
    icon: 'star-outline',
    color: '#A855F7',
    highlights: ['Students are comparing CMSC workload patterns', 'Gen-ed suggestions are trending this week', 'Reviews focus on real assignments and class rhythm'],
    cta: 'Read Reviews',
  },
};

const quickLinkContent: Record<QuickLinkKey, {
  title: string;
  subtitle: string;
  icon: string;
  steps: string[];
}> = {
  'terpmail': {
    title: 'TERPmail',
    subtitle: 'Your official University of Maryland email inbox and announcements.',
    icon: 'email-outline',
    steps: ['Check time-sensitive professor updates', 'Watch for event confirmations and SGA notices', 'Use it as your login identity across campus tools'],
  },
  'elms': {
    title: 'ELMS',
    subtitle: 'Assignments, modules, announcements, and course content.',
    icon: 'school-outline',
    steps: ['Open today\'s assignments', 'Check new announcements before class', 'Track grades and discussion deadlines'],
  },
  'testudo': {
    title: 'Testudo',
    subtitle: 'Registration, student records, appointment details, and more.',
    icon: 'file-document-outline',
    steps: ['Review registration dates', 'Check unofficial transcript tools', 'Manage account and student services'],
  },
  'shuttle-um': {
    title: 'Shuttle-UM',
    subtitle: 'Bus routes, arrival timing, and late-night transportation planning.',
    icon: 'map-outline',
    steps: ['Check the nearest bus route', 'Plan late-night return trips', 'Watch route updates during events and weather'],
  },
};

export function CampusFeatureScreen({ navigation, route }: CampusFeatureProps) {
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

      <Button title={content.cta} onPress={() => Alert.alert(content.title, 'This is ready to connect to live campus data next.')} fullWidth />
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
          <MaterialCommunityIcons name={content.icon as never} size={26} color={colors.primary.main} />
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

      <Button title={`Open ${content.title}`} onPress={() => Alert.alert(content.title, 'Browser linking can be connected here when live URLs are added.')} fullWidth />
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
  heroTitle: {
    fontSize: typography.fontSize['2xl'],
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
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
});