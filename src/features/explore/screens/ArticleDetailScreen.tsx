import React, { useCallback, useMemo, useState } from 'react';
import {
  Alert,
  Image,
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Badge from '../../../shared/components/Badge';
import Card from '../../../shared/components/Card';
import { colors } from '../../../shared/theme/colors';
import { borderRadius, spacing } from '../../../shared/theme/spacing';
import { typography } from '../../../shared/theme/typography';
import type { ExploreStackParamList } from '../../../navigation/types';
import type { UmdArticle } from '../../../shared/types';
import { shareContent } from '../../../shared/utils/shareContent';
import { fetchArticleById } from '../../../services/umdArticles';
import { getArticleCategoryColor, getArticleImageUrl } from '../utils/articleHelpers';

type Props = NativeStackScreenProps<ExploreStackParamList, 'ArticleDetail'>;

const UMD_SEAL = require('../../../assets/images/umd-seal.png');

// ── Simple HTML-to-RN renderer ──────────────────────────────

interface RenderNode {
  type: 'text' | 'heading' | 'paragraph' | 'image' | 'blockquote' | 'list' | 'listItem' | 'link';
  tag?: string;
  content?: string;
  href?: string;
  src?: string;
  alt?: string;
  children?: RenderNode[];
  bold?: boolean;
  italic?: boolean;
}

function parseSimpleHtml(html: string): RenderNode[] {
  const nodes: RenderNode[] = [];
  if (!html) return nodes;

  // Split by block-level elements
  const blocks = html.split(/<\/(?:p|h[1-6]|blockquote|div|figure|figcaption|ul|ol|li)>/gi);

  for (const block of blocks) {
    const trimmed = block.trim();
    if (!trimmed) continue;

    // Heading
    const headingMatch = trimmed.match(/<(h[1-6])[^>]*>([\s\S]*)/i);
    if (headingMatch) {
      const content = headingMatch[2].replace(/<[^>]*>/g, '').trim();
      if (content) {
        nodes.push({ type: 'heading', tag: headingMatch[1].toLowerCase(), content });
      }
      continue;
    }

    // Blockquote
    const bqMatch = trimmed.match(/<blockquote[^>]*>([\s\S]*)/i);
    if (bqMatch) {
      const content = bqMatch[1].replace(/<[^>]*>/g, '').trim();
      if (content) {
        nodes.push({ type: 'blockquote', content });
      }
      continue;
    }

    // Image
    const imgMatch = trimmed.match(/<img[^>]+src=["']([^"']+)["'][^>]*(?:alt=["']([^"']*)["'])?[^>]*>/i);
    if (imgMatch) {
      nodes.push({ type: 'image', src: imgMatch[1], alt: imgMatch[2] ?? '' });
      // Check for caption text after the image
      const afterImg = trimmed.replace(/<img[^>]*>/i, '').replace(/<[^>]*>/g, '').trim();
      if (afterImg) {
        nodes.push({ type: 'paragraph', content: afterImg });
      }
      continue;
    }

    // List items
    if (/<li[^>]*>/i.test(trimmed)) {
      const items = trimmed.split(/<li[^>]*>/gi).filter(Boolean);
      for (const item of items) {
        const content = item.replace(/<[^>]*>/g, '').trim();
        if (content) {
          nodes.push({ type: 'listItem', content });
        }
      }
      continue;
    }

    // Paragraph / generic text
    const pMatch = trimmed.match(/<p[^>]*>([\s\S]*)/i);
    const content = (pMatch ? pMatch[1] : trimmed).replace(/<[^>]*>/g, '').trim();
    if (content) {
      nodes.push({ type: 'paragraph', content });
    }
  }

  return nodes;
}

function RenderedBody({ html }: { html: string }) {
  const nodes = useMemo(() => parseSimpleHtml(html), [html]);

  return (
    <View style={bodyStyles.container}>
      {nodes.map((node, index) => {
        switch (node.type) {
          case 'heading':
            return (
              <Text
                key={index}
                style={node.tag === 'h2' ? bodyStyles.h2 : bodyStyles.h3}
              >
                {node.content}
              </Text>
            );
          case 'blockquote':
            return (
              <View key={index} style={bodyStyles.blockquote}>
                <Text style={bodyStyles.blockquoteText}>{node.content}</Text>
              </View>
            );
          case 'image':
            return (
              <View key={index} style={bodyStyles.imageWrap}>
                <Image
                  source={{ uri: node.src }}
                  style={bodyStyles.inlineImage}
                  resizeMode="cover"
                />
                {node.alt ? (
                  <Text style={bodyStyles.imageCaption}>{node.alt}</Text>
                ) : null}
              </View>
            );
          case 'listItem':
            return (
              <View key={index} style={bodyStyles.listItem}>
                <Text style={bodyStyles.bullet}>{'\u2022'}</Text>
                <Text style={bodyStyles.paragraph}>{node.content}</Text>
              </View>
            );
          case 'paragraph':
          default:
            return (
              <Text key={index} style={bodyStyles.paragraph}>
                {node.content}
              </Text>
            );
        }
      })}
    </View>
  );
}

const bodyStyles = StyleSheet.create({
  container: {
    gap: spacing.md,
  },
  h2: {
    fontSize: typography.fontSize['2xl'],
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
    lineHeight: 32,
    marginTop: spacing.sm,
  },
  h3: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.semiBold,
    color: colors.text.primary,
    lineHeight: 28,
    marginTop: spacing.xs,
  },
  paragraph: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.regular,
    color: colors.text.secondary,
    lineHeight: 26,
  },
  blockquote: {
    borderLeftWidth: 3,
    borderLeftColor: colors.primary.main,
    paddingLeft: spacing.md,
    paddingVertical: spacing.xs,
  },
  blockquoteText: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.regular,
    fontStyle: 'italic',
    color: colors.text.secondary,
    lineHeight: 26,
  },
  imageWrap: {
    gap: spacing.xs,
    marginVertical: spacing.xs,
  },
  inlineImage: {
    width: '100%',
    height: 200,
    borderRadius: borderRadius.md,
    backgroundColor: colors.background.tertiary,
  },
  imageCaption: {
    fontSize: typography.fontSize.xs,
    color: colors.text.tertiary,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  listItem: {
    flexDirection: 'row',
    gap: spacing.sm,
    paddingLeft: spacing.sm,
  },
  bullet: {
    fontSize: typography.fontSize.base,
    color: colors.text.secondary,
    lineHeight: 26,
  },
});

// ── Main Screen ─────────────────────────────────────────────

export default function ArticleDetailScreen({ navigation, route }: Props) {
  const insets = useSafeAreaInsets();
  const { width: screenWidth } = useWindowDimensions();
  const { articleId } = route.params;
  const [heroImageFailed, setHeroImageFailed] = useState(false);

  const { data: article, isLoading } = useQuery({
    queryKey: ['umd-article', articleId],
    queryFn: () => fetchArticleById(articleId),
    staleTime: 10 * 60_000,
  });

  const handleBack = useCallback(() => {
    if (navigation.canGoBack()) {
      navigation.goBack();
      return;
    }

    navigation.navigate('ExploreHome');
  }, [navigation]);

  const handleShare = useCallback(async () => {
    if (!article) return;
    try {
      const result = await shareContent({
        title: article.title,
        message: `${article.title}\n\n${article.source_url}`,
        url: article.source_url,
      });

      if (result === 'copied') {
        Alert.alert('Link copied', 'This article link is now in your clipboard.');
      }
    } catch {
      // User cancelled or share failed
    }
  }, [article]);

  const handleOpenSource = useCallback(() => {
    if (article?.source_url) {
      Linking.openURL(article.source_url);
    }
  }, [article]);

  if (isLoading) {
    return (
      <View style={[styles.screen, { paddingTop: insets.top }]}>
        <View style={styles.navBar}>
          <Pressable onPress={handleBack} style={styles.navButton}>
            <Ionicons name="arrow-back" size={20} color={colors.text.primary} />
          </Pressable>
        </View>
        <View style={styles.loadingWrap}>
          <View style={[styles.heroSkeleton, { width: screenWidth }]} />
          <View style={styles.loadingContent}>
            <View style={styles.skeletonBadge} />
            <View style={styles.skeletonTitleWide} />
            <View style={styles.skeletonTitleMedium} />
            <View style={styles.skeletonMeta} />
          </View>
        </View>
      </View>
    );
  }

  if (!article) {
    return (
      <View style={[styles.screen, { paddingTop: insets.top }]}>
        <View style={styles.navBar}>
          <Pressable onPress={handleBack} style={styles.navButton}>
            <Ionicons name="arrow-back" size={20} color={colors.text.primary} />
          </Pressable>
        </View>
        <View style={styles.errorWrap}>
          <Text style={styles.errorTitle}>Article not found</Text>
          <Text style={styles.errorBody}>This article may have been removed or is no longer available.</Text>
        </View>
      </View>
    );
  }

  const categoryColor = getArticleCategoryColor(article.category);
  const resolvedHeroImage = getArticleImageUrl(article);
  const showHeroImage = Boolean(resolvedHeroImage) && !heroImageFailed;
  const publishedDate = article.published_at ? format(new Date(article.published_at), 'MMMM d, yyyy') : '';
  const metaParts = [
    article.author,
    publishedDate,
    `${article.reading_time_min} min read`,
  ].filter(Boolean);

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      <View style={styles.navBar}>
        <Pressable onPress={handleBack} style={styles.navButton}>
          <Ionicons name="arrow-back" size={20} color={colors.text.primary} />
        </Pressable>
        <Pressable onPress={handleShare} style={styles.navButton}>
          <Ionicons name="share-outline" size={20} color={colors.text.primary} />
        </Pressable>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={{ paddingBottom: insets.bottom + spacing.xxl }}
        showsVerticalScrollIndicator={false}
      >
        {showHeroImage ? (
          <Image
            source={{ uri: resolvedHeroImage! }}
            style={[styles.heroImage, { width: screenWidth }]}
            resizeMode="cover"
            onError={() => setHeroImageFailed(true)}
          />
        ) : (
          <View style={[styles.heroPlaceholder, { width: screenWidth }]}>
            <Image source={UMD_SEAL} style={styles.heroPlaceholderLogo} resizeMode="contain" />
            <Text style={styles.heroPlaceholderText}>{article.category}</Text>
          </View>
        )}

        <View style={styles.articleContent}>
          <Badge label={article.category} color={categoryColor} />

          <Text style={styles.title}>{article.title}</Text>

          <Text style={styles.metaRow}>{metaParts.join('  \u00B7  ')}</Text>

          {article.body_html ? (
            <RenderedBody html={article.body_html} />
          ) : article.summary ? (
            <Text style={bodyStyles.paragraph}>{article.summary}</Text>
          ) : null}

          <Pressable onPress={handleOpenSource} style={styles.sourceLink}>
            <Ionicons name="open-outline" size={16} color={colors.primary.main} />
            <Text style={styles.sourceLinkText}>Read on UMD Today</Text>
          </Pressable>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  navBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  navButton: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.full,
    backgroundColor: colors.background.secondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scroll: {
    flex: 1,
  },
  heroImage: {
    height: 240,
    backgroundColor: colors.background.tertiary,
  },
  heroPlaceholder: {
    height: 160,
    backgroundColor: colors.background.tertiary,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  heroPlaceholderLogo: {
    width: 56,
    height: 56,
    opacity: 0.7,
  },
  heroPlaceholderText: {
    fontSize: typography.fontSize['3xl'],
    fontWeight: typography.fontWeight.bold,
    color: colors.text.tertiary,
    textTransform: 'uppercase',
    letterSpacing: 2,
  },
  articleContent: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    gap: spacing.md,
  },
  title: {
    fontSize: 28,
    fontWeight: typography.fontWeight.extraBold,
    color: colors.text.primary,
    lineHeight: 36,
  },
  metaRow: {
    fontSize: typography.fontSize.sm,
    color: colors.text.tertiary,
    lineHeight: 20,
  },
  sourceLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.md,
    marginTop: spacing.md,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border.light,
  },
  sourceLinkText: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semiBold,
    color: colors.primary.main,
  },
  // Loading / Error
  loadingWrap: {
    flex: 1,
  },
  heroSkeleton: {
    height: 240,
    backgroundColor: colors.background.tertiary,
  },
  loadingContent: {
    padding: spacing.lg,
    gap: spacing.md,
  },
  skeletonBadge: {
    width: 70,
    height: 22,
    borderRadius: borderRadius.sm,
    backgroundColor: colors.background.tertiary,
  },
  skeletonTitleWide: {
    width: '95%',
    height: 22,
    borderRadius: borderRadius.xs,
    backgroundColor: colors.background.tertiary,
  },
  skeletonTitleMedium: {
    width: '65%',
    height: 22,
    borderRadius: borderRadius.xs,
    backgroundColor: colors.background.tertiary,
  },
  skeletonMeta: {
    width: '50%',
    height: 14,
    borderRadius: borderRadius.xs,
    backgroundColor: colors.background.tertiary,
  },
  errorWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
    gap: spacing.sm,
  },
  errorTitle: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
  },
  errorBody: {
    fontSize: typography.fontSize.base,
    color: colors.text.secondary,
    textAlign: 'center',
    lineHeight: 24,
  },
});
