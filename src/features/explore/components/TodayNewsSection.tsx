import React, { useMemo, useState } from 'react';
import { ActivityIndicator, Image, Pressable, StyleSheet, Text, View } from 'react-native';
import Badge from '../../../shared/components/Badge';
import Button from '../../../shared/components/Button';
import Card from '../../../shared/components/Card';
import { colors } from '../../../shared/theme/colors';
import { borderRadius, spacing } from '../../../shared/theme/spacing';
import { typography } from '../../../shared/theme/typography';
import type { UmdArticle } from '../../../shared/types';
import { formatRelativeDate, getArticleCategoryColor, getArticleImageUrl } from '../utils/articleHelpers';

const UMD_SEAL = require('../../../assets/images/umd-seal.png');

interface TodayNewsSectionProps {
  articles: UmdArticle[];
  loading: boolean;
  onPressArticle: (articleId: string) => void;
  onPressExploreMore: () => void;
}

function ArticleCardSkeleton() {
  return (
    <Card style={styles.card}>
      <View style={styles.cardRow}>
        <View style={styles.skeletonImage} />
        <View style={styles.cardContent}>
          <View style={styles.skeletonBadge} />
          <View style={styles.skeletonTitle} />
          <View style={styles.skeletonTitleShort} />
          <View style={styles.skeletonMeta} />
        </View>
      </View>
    </Card>
  );
}

function ArticleCard({
  article,
  onPress,
}: {
  article: UmdArticle;
  onPress: () => void;
}) {
  const categoryColor = getArticleCategoryColor(article.category);
  const relativeDate = formatRelativeDate(article.published_at);
  const resolvedImage = useMemo(() => getArticleImageUrl(article), [article]);
  const [imageFailed, setImageFailed] = useState(false);
  const showRemoteImage = Boolean(resolvedImage) && !imageFailed;

  return (
    <Card onPress={onPress} style={styles.card}>
      <View style={styles.cardRow}>
        {showRemoteImage ? (
          <Image
            source={{ uri: resolvedImage! }}
            style={styles.thumbnail}
            resizeMode="cover"
            onError={() => setImageFailed(true)}
          />
        ) : (
          <View style={[styles.thumbnail, styles.thumbnailPlaceholder]}>
            <Image source={UMD_SEAL} style={styles.placeholderLogo} resizeMode="contain" />
          </View>
        )}

        <View style={styles.cardContent}>
          <View style={styles.cardMeta}>
            <Badge label={article.category} color={categoryColor} size="sm" />
            <Text style={styles.readingTime}>{article.reading_time_min} min read</Text>
          </View>
          <Text numberOfLines={2} style={styles.headline}>
            {article.title}
          </Text>
          <Text numberOfLines={2} style={styles.summary}>
            {article.summary}
          </Text>
          <Text style={styles.date}>{relativeDate}</Text>
        </View>
      </View>
    </Card>
  );
}

export default function TodayNewsSection({
  articles,
  loading,
  onPressArticle,
  onPressExploreMore,
}: TodayNewsSectionProps) {
  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <View style={styles.sectionCopy}>
          <View style={styles.eyebrowRow}>
            <View style={styles.accentDot} />
            <Text style={styles.sectionEyebrow}>Today @UMD</Text>
          </View>
          <Text style={styles.sectionTitle}>Campus news and stories</Text>
        </View>
      </View>

      {loading ? (
        <View style={styles.list}>
          <ArticleCardSkeleton />
          <ArticleCardSkeleton />
          <ArticleCardSkeleton />
        </View>
      ) : articles.length > 0 ? (
        <View style={styles.list}>
          {articles.map((article) => (
            <ArticleCard
              key={article.id}
              article={article}
              onPress={() => onPressArticle(article.id)}
            />
          ))}
          <Button
            title="Explore More News"
            variant="ghost"
            onPress={onPressExploreMore}
            fullWidth
          />
        </View>
      ) : (
        <Card style={styles.emptyCard}>
          <Text style={styles.emptyTitle}>No articles available</Text>
          <Text style={styles.emptyBody}>
            Check back soon for the latest UMD news and stories.
          </Text>
        </Card>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    gap: spacing.md,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
  },
  sectionCopy: {
    gap: spacing.xs,
  },
  eyebrowRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  accentDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.primary.main,
  },
  sectionEyebrow: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.semiBold,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    color: colors.primary.main,
  },
  sectionTitle: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
  },
  list: {
    gap: spacing.sm,
  },
  card: {
    padding: spacing.sm,
  },
  cardRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  thumbnail: {
    width: 88,
    height: 88,
    borderRadius: borderRadius.md,
    backgroundColor: colors.background.tertiary,
  },
  thumbnailPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  thumbnailPlaceholderText: {
    fontSize: typography.fontSize['2xl'],
    fontWeight: typography.fontWeight.bold,
    color: colors.text.tertiary,
  },
  placeholderLogo: {
    width: 42,
    height: 42,
    opacity: 0.7,
  },
  cardContent: {
    flex: 1,
    gap: spacing.xs,
    justifyContent: 'center',
  },
  cardMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  headline: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
    lineHeight: 20,
  },
  summary: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
    lineHeight: 18,
  },
  readingTime: {
    fontSize: typography.fontSize.xs,
    color: colors.text.tertiary,
  },
  date: {
    fontSize: typography.fontSize.xs,
    color: colors.text.tertiary,
  },
  emptyCard: {
    gap: spacing.sm,
    alignItems: 'center',
    paddingVertical: spacing.lg,
  },
  emptyTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
  },
  emptyBody: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
    textAlign: 'center',
  },
  // Skeleton styles
  skeletonImage: {
    width: 88,
    height: 88,
    borderRadius: borderRadius.md,
    backgroundColor: colors.background.tertiary,
  },
  skeletonBadge: {
    width: 60,
    height: 18,
    borderRadius: borderRadius.sm,
    backgroundColor: colors.background.tertiary,
  },
  skeletonTitle: {
    width: '90%',
    height: 14,
    borderRadius: borderRadius.xs,
    backgroundColor: colors.background.tertiary,
  },
  skeletonTitleShort: {
    width: '60%',
    height: 14,
    borderRadius: borderRadius.xs,
    backgroundColor: colors.background.tertiary,
  },
  skeletonMeta: {
    width: '40%',
    height: 10,
    borderRadius: borderRadius.xs,
    backgroundColor: colors.background.tertiary,
  },
});
