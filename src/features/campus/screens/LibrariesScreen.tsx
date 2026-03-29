import React from 'react';
import {
  ActivityIndicator,
  ImageBackground,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import Badge from '../../../shared/components/Badge';
import Card from '../../../shared/components/Card';
import HeaderTag from '../../../shared/components/HeaderTag';
import ScreenLayout from '../../../shared/components/ScreenLayout';
import UMDBrandLockup from '../../../shared/components/UMDBrandLockup';
import { useResponsive } from '../../../shared/hooks/useResponsive';
import { colors } from '../../../shared/theme/colors';
import { borderRadius, shadows, spacing } from '../../../shared/theme/spacing';
import { typography } from '../../../shared/theme/typography';
import type { CampusStackParamList } from '../../../navigation/types';
import {
  formatHoursCallout,
  getFallbackLibraryHours,
  getLibraryById,
  libraryProfiles,
} from '../data/libraries';
import { useLibraryHours } from '../hooks/useLibraryHours';

type DirectoryProps = NativeStackScreenProps<CampusStackParamList, 'LibrariesDirectory'>;
type DetailProps = NativeStackScreenProps<CampusStackParamList, 'LibraryProfile'>;

function StatusBadge({ isOpen }: { isOpen: boolean }) {
  return (
    <Badge
      label={isOpen ? 'Open' : 'Closed'}
      color={isOpen ? colors.status.success : colors.text.secondary}
    />
  );
}

export default function LibrariesDirectoryScreen({ navigation }: DirectoryProps) {
  const { isWide } = useResponsive();
  const { hoursByLibraryId, isRefreshing } = useLibraryHours();

  return (
    <ScreenLayout
      title="Libraries"
      subtitle="Every University of Maryland library, with today's status and the spaces students care about most."
      leftAction={
        <Pressable onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={20} color={colors.text.primary} />
        </Pressable>
      }
      headerTopContent={<UMDBrandLockup />}
      headerMetaContent={
        <HeaderTag
          icon="library-outline"
          label="Campus Libraries"
          color={colors.status.info}
          tintColor={colors.status.infoLight}
        />
      }
      headerStyle={styles.headerShell}
    >
      <Card style={styles.directorySummaryCard}>
        <View>
          <Text style={styles.directorySummaryTitle}>Library Directory</Text>
          <Text style={styles.directorySummaryBody}>
            Tap any library to see a full profile with open status, today's hours, and available resources.
          </Text>
        </View>
        <View style={styles.directoryMetaRow}>
          <Badge label={`${libraryProfiles.length} locations`} color={colors.primary.main} />
          {isRefreshing ? (
            <View style={styles.refreshStateRow}>
              <ActivityIndicator size="small" color={colors.status.info} />
              <Text style={styles.refreshStateText}>Syncing today's hours</Text>
            </View>
          ) : null}
        </View>
      </Card>

      <View style={[styles.directoryGrid, isWide && styles.directoryGridWide]}>
        {libraryProfiles.map((library) => {
          const hoursStatus = hoursByLibraryId[library.id] ?? getFallbackLibraryHours(library);

          return (
            <Pressable
              key={library.id}
              onPress={() => navigation.navigate('LibraryProfile', { libraryId: library.id })}
              style={[styles.directoryCard, isWide && styles.directoryCardWide]}
            >
              <ImageBackground
                source={{ uri: library.heroImage }}
                imageStyle={styles.directoryImage}
                style={styles.directoryImageWrap}
              >
                <View style={styles.directoryImageOverlay}>
                  <StatusBadge isOpen={hoursStatus.isOpen} />
                </View>
              </ImageBackground>

              <View style={styles.directoryCardBody}>
                <View style={styles.directoryCardHeader}>
                  <View style={styles.directoryCardCopy}>
                    <Text style={styles.directoryCardTitle}>{library.name}</Text>
                    <Text style={styles.directoryCardCampus}>{library.campusLabel}</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={18} color={colors.text.tertiary} />
                </View>

                <Text style={styles.directoryHoursEyebrow}>Today's hours</Text>
                <Text style={styles.directoryHoursValue}>{hoursStatus.label}</Text>
                <Text style={styles.directoryUpdatedLabel}>{hoursStatus.updatedLabel}</Text>

                <View style={styles.featurePreviewRow}>
                  {library.features.slice(0, 2).map((feature) => (
                    <View key={feature.label} style={styles.featurePreviewPill}>
                      <MaterialCommunityIcons
                        name={feature.icon as never}
                        size={14}
                        color={library.accentColor}
                      />
                      <Text style={styles.featurePreviewText}>{feature.label}</Text>
                    </View>
                  ))}
                </View>
              </View>
            </Pressable>
          );
        })}
      </View>
    </ScreenLayout>
  );
}

export function LibraryProfileScreen({ navigation, route }: DetailProps) {
  const { isWide } = useResponsive();
  const library = getLibraryById(route.params.libraryId);
  const { hoursByLibraryId, isRefreshing } = useLibraryHours();

  if (!library) {
    return (
      <ScreenLayout
        title="Library"
        subtitle="This library profile could not be found."
        leftAction={
          <Pressable onPress={() => navigation.goBack()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={20} color={colors.text.primary} />
          </Pressable>
        }
      >
        <Card>
          <Text style={styles.detailBody}>Try returning to the directory and opening the profile again.</Text>
        </Card>
      </ScreenLayout>
    );
  }

  const hoursStatus = hoursByLibraryId[library.id] ?? getFallbackLibraryHours(library);

  return (
    <ScreenLayout
      title={library.name}
      subtitle={library.campusLabel}
      leftAction={
        <Pressable onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={20} color={colors.text.primary} />
        </Pressable>
      }
      headerStyle={styles.detailHeaderShell}
    >
      <View style={styles.detailContainer}>
        <ImageBackground
          source={{ uri: library.heroImage }}
          imageStyle={styles.heroImage}
          style={[styles.heroCard, isWide && styles.heroCardWide]}
        >
          <View style={styles.heroOverlay}>
            <View style={styles.heroBadgeRow}>
              <StatusBadge isOpen={hoursStatus.isOpen} />
              <Badge label={library.shortName} color={library.accentColor} />
            </View>
            <Text style={styles.heroTitle}>{library.name}</Text>
            <Text style={styles.heroSubtitle}>{library.address}</Text>
          </View>
        </ImageBackground>

        <Card style={styles.hoursCard}>
          <View style={styles.hoursHeader}>
            <View>
              <Text style={styles.hoursEyebrow}>Quick Status</Text>
              <Text style={styles.hoursHeadline}>{formatHoursCallout(hoursStatus)}</Text>
            </View>
            {isRefreshing ? <ActivityIndicator size="small" color={colors.status.info} /> : null}
          </View>
          <View style={styles.hoursHighlight}>
            <Text style={styles.hoursLabel}>Today's Hours</Text>
            <Text style={styles.hoursValue}>{hoursStatus.label}</Text>
          </View>
          <Text style={styles.hoursUpdated}>{hoursStatus.updatedLabel}</Text>
        </Card>

        <Card style={styles.infoCard}>
          <Text style={styles.sectionTitle}>About This Library</Text>
          <Text style={styles.detailBody}>{library.description}</Text>
          <View style={styles.infoList}>
            <View style={styles.infoRow}>
              <Ionicons name="location-outline" size={18} color={colors.text.secondary} />
              <Text style={styles.infoText}>{library.address}</Text>
            </View>
            <View style={styles.infoRow}>
              <Ionicons name="call-outline" size={18} color={colors.text.secondary} />
              <Text style={styles.infoText}>{library.phone}</Text>
            </View>
          </View>
        </Card>

        <Card style={styles.featuresCard}>
          <Text style={styles.sectionTitle}>Available Resources</Text>
          <View style={styles.featureGrid}>
            {library.features.map((feature) => (
              <View key={feature.label} style={[styles.featureTile, isWide && styles.featureTileWide]}>
                <View style={[styles.featureIconWrap, { backgroundColor: `${library.accentColor}14` }]}>
                  <MaterialCommunityIcons
                    name={feature.icon as never}
                    size={20}
                    color={library.accentColor}
                  />
                </View>
                <Text style={styles.featureLabel}>{feature.label}</Text>
              </View>
            ))}
          </View>
        </Card>
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
    borderColor: colors.status.infoLight,
    backgroundColor: '#F9FCFF',
  },
  detailHeaderShell: {
    marginTop: spacing.sm,
    borderRadius: borderRadius.xl,
    paddingTop: spacing.md,
    paddingBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border.light,
    backgroundColor: colors.brand.white,
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: borderRadius.full,
    backgroundColor: colors.background.secondary,
  },
  directorySummaryCard: {
    gap: spacing.md,
  },
  directorySummaryTitle: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
  },
  directorySummaryBody: {
    marginTop: spacing.xs,
    fontSize: typography.fontSize.sm,
    lineHeight: 20,
    color: colors.text.secondary,
  },
  directoryMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
    flexWrap: 'wrap',
  },
  refreshStateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  refreshStateText: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
  },
  directoryGrid: {
    gap: spacing.md,
  },
  directoryGridWide: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  directoryCard: {
    borderRadius: borderRadius.xl,
    backgroundColor: colors.brand.white,
    overflow: 'hidden',
    ...shadows.md,
  },
  directoryCardWide: {
    width: '48%',
  },
  directoryImageWrap: {
    height: 180,
    justifyContent: 'flex-start',
  },
  directoryImage: {
    borderTopLeftRadius: borderRadius.xl,
    borderTopRightRadius: borderRadius.xl,
  },
  directoryImageOverlay: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    padding: spacing.md,
    backgroundColor: 'rgba(0, 0, 0, 0.18)',
  },
  directoryCardBody: {
    gap: spacing.sm,
    padding: spacing.md,
  },
  directoryCardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  directoryCardCopy: {
    flex: 1,
    gap: spacing.xs,
  },
  directoryCardTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
  },
  directoryCardCampus: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
  },
  directoryHoursEyebrow: {
    fontSize: typography.fontSize.xs,
    textTransform: 'uppercase',
    letterSpacing: typography.letterSpacing.wider,
    color: colors.text.tertiary,
  },
  directoryHoursValue: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
  },
  directoryUpdatedLabel: {
    fontSize: typography.fontSize.xs,
    color: colors.text.secondary,
  },
  featurePreviewRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  featurePreviewPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    borderRadius: borderRadius.full,
    backgroundColor: colors.background.secondary,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  featurePreviewText: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.medium,
    color: colors.text.secondary,
  },
  detailContainer: {
    gap: spacing.md,
  },
  heroCard: {
    height: 280,
    overflow: 'hidden',
    borderRadius: borderRadius.xl,
    justifyContent: 'flex-end',
    backgroundColor: colors.gray[200],
  },
  heroCardWide: {
    height: 340,
  },
  heroImage: {
    borderRadius: borderRadius.xl,
  },
  heroOverlay: {
    gap: spacing.sm,
    padding: spacing.lg,
    backgroundColor: 'rgba(15, 23, 42, 0.48)',
  },
  heroBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    flexWrap: 'wrap',
  },
  heroTitle: {
    fontSize: typography.fontSize['2xl'],
    fontWeight: typography.fontWeight.bold,
    color: colors.brand.white,
  },
  heroSubtitle: {
    fontSize: typography.fontSize.base,
    lineHeight: 22,
    color: 'rgba(255,255,255,0.88)',
  },
  hoursCard: {
    gap: spacing.md,
  },
  hoursHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  hoursEyebrow: {
    fontSize: typography.fontSize.xs,
    textTransform: 'uppercase',
    letterSpacing: typography.letterSpacing.wider,
    color: colors.text.tertiary,
  },
  hoursHeadline: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
    marginTop: spacing.xs,
  },
  hoursHighlight: {
    borderRadius: borderRadius.lg,
    backgroundColor: colors.background.secondary,
    padding: spacing.md,
  },
  hoursLabel: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
  },
  hoursValue: {
    fontSize: typography.fontSize['2xl'],
    fontWeight: typography.fontWeight.bold,
    color: colors.primary.main,
    marginTop: spacing.xs,
  },
  hoursUpdated: {
    fontSize: typography.fontSize.xs,
    color: colors.text.secondary,
  },
  infoCard: {
    gap: spacing.md,
  },
  sectionTitle: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
  },
  detailBody: {
    fontSize: typography.fontSize.base,
    lineHeight: 24,
    color: colors.text.secondary,
  },
  infoList: {
    gap: spacing.sm,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
  },
  infoText: {
    flex: 1,
    fontSize: typography.fontSize.base,
    lineHeight: 22,
    color: colors.text.primary,
  },
  featuresCard: {
    gap: spacing.md,
  },
  featureGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  featureTile: {
    width: '47%',
    borderRadius: borderRadius.lg,
    backgroundColor: colors.background.secondary,
    padding: spacing.md,
    gap: spacing.sm,
  },
  featureTileWide: {
    width: '23.5%',
  },
  featureIconWrap: {
    width: 42,
    height: 42,
    borderRadius: borderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  featureLabel: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semiBold,
    lineHeight: 20,
    color: colors.text.primary,
  },
});
