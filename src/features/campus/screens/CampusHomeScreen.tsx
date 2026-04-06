import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import HeaderTag from '../../../shared/components/HeaderTag';
import ScreenLayout from '../../../shared/components/ScreenLayout';
import UMDBrandLockup from '../../../shared/components/UMDBrandLockup';
import FeatureCard from '../components/FeatureCard';
import { campusCards, quickLinks } from '../../../experience/content';
import { colors } from '../../../shared/theme/colors';
import { borderRadius, shadows, spacing } from '../../../shared/theme/spacing';
import { typography } from '../../../shared/theme/typography';
import type { CampusFeatureKey, CampusStackParamList, QuickLinkKey } from '../../../navigation/types';

type Props = NativeStackScreenProps<CampusStackParamList, 'CampusHome'>;

type CampusDestination = CampusFeatureKey | 'libraries-directory' | 'clubs-home';

const featureMap: Record<string, CampusDestination> = {
  Dining: 'dining',
  Libraries: 'libraries-directory',
  Sports: 'sports',
  Safety: 'safety',
  'Study Spots': 'study-spots',
  'Campus Info': 'campus-info',
  Clubs: 'clubs-home',
  'Course Reviews': 'course-reviews',
};

const quickLinkMap: Record<string, QuickLinkKey> = {
  TERPmail: 'terpmail',
  ELMS: 'elms',
  Testudo: 'testudo',
  'Shuttle-UM': 'shuttle-um',
};

export default function CampusHomeScreen({ navigation }: Props) {
  return (
    <ScreenLayout
      title="Campus"
      subtitle="Everything you need, right here."
      headerTopContent={<UMDBrandLockup />}
      headerMetaContent={
        <HeaderTag
          icon="grid-outline"
          label="Tools + Services"
          color={colors.secondary.dark}
          tintColor={colors.secondary.lightest}
        />
      }
      headerStyle={styles.headerShell}
    >
      <View style={styles.grid}>
        {campusCards.map((card, index) => {
          const destination = featureMap[card.title];
          const isLastOddCard = campusCards.length % 2 === 1 && index === campusCards.length - 1;

          return (
            <FeatureCard
              key={card.title}
              title={card.title}
              subtitle={card.subtitle}
              icon={card.icon}
              accentColor={card.color}
              tintColor={card.tint}
              onPress={() => {
                if (destination === 'libraries-directory') {
                  navigation.navigate('LibrariesDirectory');
                  return;
                }

                if (destination === 'clubs-home') {
                  navigation.navigate('ClubsHome');
                  return;
                }

                navigation.navigate('CampusFeature', { featureKey: destination });
              }}
              style={[styles.featureCard, isLastOddCard && styles.featureCardWide]}
            />
          );
        })}
      </View>

      <View>
        <Text style={styles.sectionTitle}>UMD Quick Links</Text>
        <View style={styles.quickLinksRow}>
          {quickLinks.map((link) => (
            <Pressable
              key={link.title}
              onPress={() =>
                navigation.navigate('CampusQuickLink', { quickLinkKey: quickLinkMap[link.title] })
              }
              style={styles.quickLinkCard}
            >
              <View style={styles.quickLinkIcon}>
                <MaterialCommunityIcons
                  name={link.icon as never}
                  size={24}
                  color={colors.primary.main}
                />
              </View>
              <Text style={styles.quickLinkText}>{link.title}</Text>
            </Pressable>
          ))}
        </View>
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
    borderColor: colors.secondary.lightest,
    backgroundColor: '#FFFDF7',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  featureCard: {
    width: '47%',
  },
  featureCardWide: {
    width: '100%',
  },
  sectionTitle: {
    fontSize: typography.fontSize['2xl'],
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
    marginBottom: spacing.md,
  },
  quickLinksRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  quickLinkCard: {
    width: '22%',
    alignItems: 'center',
  },
  quickLinkIcon: {
    width: 68,
    height: 68,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.brand.white,
    ...shadows.md,
  },
  quickLinkText: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
    color: colors.text.secondary,
    textAlign: 'center',
    marginTop: spacing.sm,
  },
});
