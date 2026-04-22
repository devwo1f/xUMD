import React, { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { format } from 'date-fns';
import Badge from '../../../shared/components/Badge';
import Card from '../../../shared/components/Card';
import { colors } from '../../../shared/theme/colors';
import { borderRadius, spacing } from '../../../shared/theme/spacing';
import { typography } from '../../../shared/theme/typography';
import type { ExploreStackParamList } from '../../../navigation/types';
import type { UmdArticle } from '../../../shared/types';
import { useNewsArchive } from '../hooks/useTodayNews';
import {
  formatDateGroupLabel,
  formatRelativeDate,
  getArticleCategoryColor,
  getArticleImageUrl,
} from '../utils/articleHelpers';

type Props = NativeStackScreenProps<ExploreStackParamList, 'NewsArchive'>;

const UMD_SEAL = require('../../../assets/images/umd-seal.png');

const CATEGORY_FILTERS = [
  { label: 'All', value: undefined },
  { label: 'Research', value: 'Research' },
  { label: 'Campus', value: 'Campus' },
  { label: 'Students', value: 'Students' },
  { label: 'Athletics', value: 'Athletics' },
  { label: 'Arts', value: 'Arts' },
] as const;

// ── Article Row Component ───────────────────────────────────

function ArticleRow({
  article,
  onPress,
}: {
  article: UmdArticle;
  onPress: () => void;
}) {
  const categoryColor = getArticleCategoryColor(article.category);
  const resolvedImage = useMemo(() => getArticleImageUrl(article), [article]);
  const [imageFailed, setImageFailed] = useState(false);
  const showRemoteImage = Boolean(resolvedImage) && !imageFailed;

  return (
    <Card onPress={onPress} style={styles.articleCard}>
      <View style={styles.articleRow}>
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
        <View style={styles.articleContent}>
          <View style={styles.articleMeta}>
            <Badge label={article.category} color={categoryColor} size="sm" />
            <Text style={styles.readingTime}>{article.reading_time_min} min read</Text>
          </View>
          <Text numberOfLines={2} style={styles.headline}>
            {article.title}
          </Text>
          <Text style={styles.publishedDate}>
            {formatRelativeDate(article.published_at)}
          </Text>
        </View>
      </View>
    </Card>
  );
}

// ── Date group helpers ──────────────────────────────────────

interface DateGroup {
  dateLabel: string;
  articles: UmdArticle[];
}

function groupArticlesByDate(articles: UmdArticle[]): DateGroup[] {
  const groups = new Map<string, UmdArticle[]>();

  for (const article of articles) {
    const dateKey = article.published_at
      ? format(new Date(article.published_at), 'yyyy-MM-dd')
      : 'unknown';
    const existing = groups.get(dateKey);
    if (existing) {
      existing.push(article);
    } else {
      groups.set(dateKey, [article]);
    }
  }

  return Array.from(groups.entries()).map(([dateKey, items]) => ({
    dateLabel: dateKey === 'unknown' ? 'Recent' : formatDateGroupLabel(dateKey),
    articles: items,
  }));
}

// ── Main Screen ─────────────────────────────────────────────

export default function NewsArchiveScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const [selectedCategory, setSelectedCategory] = useState<string | undefined>(undefined);
  const { articles, loading, loadingMore, hasMore, fetchMore, refetch } =
    useNewsArchive(selectedCategory);

  const dateGroups = useMemo(() => groupArticlesByDate(articles), [articles]);

  const openArticle = useCallback(
    (articleId: string) => {
      navigation.navigate('ArticleDetail', { articleId });
    },
    [navigation],
  );

  const handleBack = useCallback(() => {
    if (navigation.canGoBack()) {
      navigation.goBack();
      return;
    }

    navigation.navigate('ExploreHome');
  }, [navigation]);

  const renderFooter = useCallback(() => {
    if (loadingMore) {
      return (
        <View style={styles.footerLoader}>
          <ActivityIndicator size="small" color={colors.text.tertiary} />
        </View>
      );
    }
    if (!hasMore && articles.length > 0) {
      return (
        <View style={styles.footerEnd}>
          <Text style={styles.footerEndText}>You're all caught up</Text>
        </View>
      );
    }
    return null;
  }, [loadingMore, hasMore, articles.length]);

  // Flatten groups into a flat list with section headers
  const flatData = useMemo(() => {
    const items: Array<{ type: 'header'; label: string } | { type: 'article'; article: UmdArticle }> = [];
    for (const group of dateGroups) {
      items.push({ type: 'header', label: group.dateLabel });
      for (const article of group.articles) {
        items.push({ type: 'article', article });
      }
    }
    return items;
  }, [dateGroups]);

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Pressable onPress={handleBack} style={styles.backButton}>
          <Ionicons name="arrow-back" size={20} color={colors.text.primary} />
        </Pressable>
        <View style={styles.headerCopy}>
          <Text style={styles.headerTitle}>Today @UMD</Text>
          <Text style={styles.headerSubtitle}>Campus news and stories</Text>
        </View>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filterRow}
        style={styles.filterScroll}
      >
        {CATEGORY_FILTERS.map((filter) => {
          const isActive = selectedCategory === filter.value;
          return (
            <Pressable
              key={filter.label}
              onPress={() => setSelectedCategory(filter.value)}
              style={[styles.filterChip, isActive && styles.filterChipActive]}
            >
              <Text style={[styles.filterChipText, isActive && styles.filterChipTextActive]}>
                {filter.label}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>

      {loading ? (
        <View style={styles.loadingWrap}>
          <ActivityIndicator size="large" color={colors.primary.main} />
        </View>
      ) : (
        <FlatList
          data={flatData}
          keyExtractor={(item, index) =>
            item.type === 'header' ? `header-${item.label}` : `article-${item.article.id}`
          }
          renderItem={({ item }) => {
            if (item.type === 'header') {
              return (
                <Text style={styles.dateGroupHeader}>{item.label}</Text>
              );
            }
            return (
              <ArticleRow
                article={item.article}
                onPress={() => openArticle(item.article.id)}
              />
            );
          }}
          contentContainerStyle={[
            styles.listContent,
            { paddingBottom: insets.bottom + spacing.xl },
          ]}
          onEndReached={fetchMore}
          onEndReachedThreshold={0.3}
          ListFooterComponent={renderFooter}
          refreshControl={
            <RefreshControl
              refreshing={false}
              onRefresh={() => void refetch()}
              tintColor={colors.primary.main}
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyWrap}>
              <Text style={styles.emptyTitle}>No articles found</Text>
              <Text style={styles.emptyBody}>
                {selectedCategory
                  ? `No ${selectedCategory} articles available right now.`
                  : 'Check back soon for the latest UMD news.'}
              </Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.full,
    backgroundColor: colors.background.secondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerCopy: {
    flex: 1,
  },
  headerTitle: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
  },
  headerSubtitle: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
  },
  filterScroll: {
    flexGrow: 0,
  },
  filterRow: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    gap: spacing.sm,
  },
  filterChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    backgroundColor: colors.background.secondary,
    borderWidth: 1,
    borderColor: colors.border.light,
  },
  filterChipActive: {
    backgroundColor: colors.primary.main,
    borderColor: colors.primary.main,
  },
  filterChipText: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semiBold,
    color: colors.text.secondary,
  },
  filterChipTextActive: {
    color: colors.brand.white,
  },
  listContent: {
    paddingHorizontal: spacing.md,
    gap: spacing.sm,
  },
  dateGroupHeader: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.tertiary,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginTop: spacing.lg,
    marginBottom: spacing.xs,
  },
  articleCard: {
    padding: spacing.sm,
  },
  articleRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  thumbnail: {
    width: 80,
    height: 80,
    borderRadius: borderRadius.md,
    backgroundColor: colors.background.tertiary,
  },
  thumbnailPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  thumbnailPlaceholderText: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.tertiary,
  },
  placeholderLogo: {
    width: 38,
    height: 38,
    opacity: 0.7,
  },
  articleContent: {
    flex: 1,
    gap: spacing.xs,
    justifyContent: 'center',
  },
  articleMeta: {
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
  readingTime: {
    fontSize: typography.fontSize.xs,
    color: colors.text.tertiary,
  },
  publishedDate: {
    fontSize: typography.fontSize.xs,
    color: colors.text.tertiary,
  },
  footerLoader: {
    paddingVertical: spacing.lg,
    alignItems: 'center',
  },
  footerEnd: {
    paddingVertical: spacing.lg,
    alignItems: 'center',
  },
  footerEndText: {
    fontSize: typography.fontSize.sm,
    color: colors.text.tertiary,
  },
  loadingWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyWrap: {
    paddingVertical: spacing.xxl,
    alignItems: 'center',
    gap: spacing.sm,
  },
  emptyTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
  },
  emptyBody: {
    fontSize: typography.fontSize.base,
    color: colors.text.secondary,
    textAlign: 'center',
  },
});
