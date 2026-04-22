import { createAdminClient } from '../_shared/supabase.ts';
import { handleOptions } from '../_shared/http.ts';
import { jsonResponse, errorResponse } from '../_shared/http.ts';

const UMD_TODAY_BASE = 'https://today.umd.edu';
const MAX_ARTICLES_PER_RUN = 20;
const ARTICLE_RETENTION_DAYS = 60;

// ── HTML helpers ────────────────────────────────────────────

function decodeHtmlEntities(text: string): string {
  return text
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)))
    .replace(/&#x([0-9a-fA-F]+);/g, (_, h) => String.fromCharCode(parseInt(h, 16)))
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&nbsp;/g, ' ');
}

function extractText(html: string): string {
  return decodeHtmlEntities(html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim());
}

function estimateReadingTime(html: string): number {
  const words = extractText(html).split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 200));
}

function extractFirstSentences(text: string, count: number): string {
  const sentences = text.match(/[^.!?]+[.!?]+/g);
  if (!sentences) return text.slice(0, 200);
  return sentences.slice(0, count).join(' ').trim();
}

function normalizeArticleUrl(raw: string | null | undefined): string | null {
  const value = raw?.trim();
  if (!value) {
    return null;
  }

  if (/^https?:\/\//i.test(value)) {
    return value;
  }

  if (value.startsWith('//')) {
    return `https:${value}`;
  }

  if (value.startsWith('/')) {
    return `${UMD_TODAY_BASE}${value}`;
  }

  return `${UMD_TODAY_BASE}/${value.replace(/^\/+/, '')}`;
}

// ── Feed parsing ────────────────────────────────────────────

interface FeedArticle {
  title: string;
  sourceUrl: string;
  publishedAt: string | null;
  category: string;
  summary: string;
}

async function fetchArticleLinksFromFeed(): Promise<FeedArticle[]> {
  const articles: FeedArticle[] = [];

  // Try the main page first
  const response = await fetch(UMD_TODAY_BASE, {
    headers: { 'User-Agent': 'xUMD-Campus-App/1.0 (student project)' },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch ${UMD_TODAY_BASE}: ${response.status}`);
  }

  const html = await response.text();

  // Extract article links from the homepage
  // UMD Today uses article cards with links to full articles
  const articlePattern = /<a[^>]+href=["'](\/[a-z0-9-]+\/[^"']+)["'][^>]*>/gi;
  const seenUrls = new Set<string>();
  let match;

  while ((match = articlePattern.exec(html)) !== null) {
    const path = match[1];
    // Skip non-article links (navigation, footer, etc.)
    if (
      path.startsWith('/feed') ||
      path.startsWith('/search') ||
      path.startsWith('/tag') ||
      path.startsWith('/page') ||
      path === '/' ||
      path.includes('#') ||
      path.includes('?')
    ) {
      continue;
    }

    const url = `${UMD_TODAY_BASE}${path}`;
    if (seenUrls.has(url)) continue;
    seenUrls.add(url);

    articles.push({
      title: '',
      sourceUrl: url,
      publishedAt: null,
      category: 'Campus',
      summary: '',
    });

    if (articles.length >= MAX_ARTICLES_PER_RUN) break;
  }

  // Also try RSS feed as a more reliable source
  try {
    const rssResponse = await fetch(`${UMD_TODAY_BASE}/feed`, {
      headers: { 'User-Agent': 'xUMD-Campus-App/1.0 (student project)' },
    });

    if (rssResponse.ok) {
      const rssText = await rssResponse.text();
      const itemPattern = /<item>([\s\S]*?)<\/item>/gi;
      let itemMatch;

      while ((itemMatch = itemPattern.exec(rssText)) !== null) {
        const item = itemMatch[1];

        const titleMatch = item.match(/<title><!\[CDATA\[(.*?)\]\]><\/title>|<title>(.*?)<\/title>/);
        const linkMatch = item.match(/<link>(.*?)<\/link>/);
        const pubDateMatch = item.match(/<pubDate>(.*?)<\/pubDate>/);
        const categoryMatch = item.match(/<category><!\[CDATA\[(.*?)\]\]><\/category>|<category>(.*?)<\/category>/);
        const descMatch = item.match(/<description><!\[CDATA\[(.*?)\]\]><\/description>|<description>(.*?)<\/description>/s);

        const title = decodeHtmlEntities(titleMatch?.[1] ?? titleMatch?.[2] ?? '');
        const url = linkMatch?.[1]?.trim() ?? '';

        if (!url || seenUrls.has(url)) continue;
        seenUrls.add(url);

        articles.push({
          title,
          sourceUrl: url,
          publishedAt: pubDateMatch?.[1] ? new Date(pubDateMatch[1]).toISOString() : null,
          category: decodeHtmlEntities(categoryMatch?.[1] ?? categoryMatch?.[2] ?? 'Campus'),
          summary: extractText(descMatch?.[1] ?? descMatch?.[2] ?? ''),
        });

        if (articles.length >= MAX_ARTICLES_PER_RUN) break;
      }
    }
  } catch {
    // RSS feed is optional; continue with homepage links
  }

  return articles;
}

// ── Article detail scraping ─────────────────────────────────

interface ScrapedArticle {
  title: string;
  summary: string;
  bodyHtml: string;
  heroImageUrl: string | null;
  inlineImages: Array<{ url: string; alt: string }>;
  category: string;
  author: string | null;
  publishedAt: string | null;
  sourceUrl: string;
  readingTimeMin: number;
}

async function scrapeArticleDetail(feedArticle: FeedArticle): Promise<ScrapedArticle | null> {
  try {
    const response = await fetch(feedArticle.sourceUrl, {
      headers: { 'User-Agent': 'xUMD-Campus-App/1.0 (student project)' },
    });

    if (!response.ok) return null;
    const html = await response.text();

    // Title: from og:title, or <h1>, or feed title
    const ogTitleMatch = html.match(/<meta\s+property=["']og:title["']\s+content=["'](.*?)["']/i);
    const h1Match = html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i);
    const title = decodeHtmlEntities(
      ogTitleMatch?.[1] ?? extractText(h1Match?.[1] ?? '') ?? feedArticle.title
    );

    if (!title) return null;

    // Hero image: from og:image or first large image
    const ogImageMatch = html.match(/<meta\s+property=["']og:image["']\s+content=["'](.*?)["']/i);
    const heroImageUrl = normalizeArticleUrl(ogImageMatch?.[1] ?? null);

    // Author
    const authorPatterns = [
      /<meta\s+name=["']author["']\s+content=["'](.*?)["']/i,
      /class=["'][^"']*author[^"']*["'][^>]*>([\s\S]*?)<\//i,
      /by\s+<[^>]*>([\s\S]*?)<\//i,
    ];
    let author: string | null = null;
    for (const pattern of authorPatterns) {
      const m = html.match(pattern);
      if (m?.[1]) {
        author = extractText(m[1]).trim();
        if (author.length > 0 && author.length < 100) break;
        author = null;
      }
    }

    // Published date: from article:published_time, time element, or feed
    const pubTimeMatch = html.match(
      /<meta\s+property=["']article:published_time["']\s+content=["'](.*?)["']/i,
    );
    const timeMatch = html.match(/<time[^>]+datetime=["'](.*?)["']/i);
    let publishedAt =
      pubTimeMatch?.[1] ?? timeMatch?.[1] ?? feedArticle.publishedAt ?? null;
    if (publishedAt) {
      try {
        publishedAt = new Date(publishedAt).toISOString();
      } catch {
        publishedAt = null;
      }
    }

    // Category: from feed or article:section
    const sectionMatch = html.match(
      /<meta\s+property=["']article:section["']\s+content=["'](.*?)["']/i,
    );
    const category = decodeHtmlEntities(sectionMatch?.[1] ?? feedArticle.category ?? 'Campus');

    // Body: try to find the main article content
    const bodyPatterns = [
      /<article[^>]*>([\s\S]*?)<\/article>/i,
      /<div[^>]+class=["'][^"']*(?:article-body|entry-content|post-content|article-content|story-body)[^"']*["'][^>]*>([\s\S]*?)<\/div>/i,
      /<div[^>]+class=["'][^"']*content[^"']*["'][^>]*>([\s\S]*?)<\/div>/i,
    ];

    let bodyHtml = '';
    for (const pattern of bodyPatterns) {
      const m = html.match(pattern);
      if (m) {
        bodyHtml = m[1] ?? m[0];
        break;
      }
    }

    // Clean body: remove scripts, styles, nav, footer elements
    bodyHtml = bodyHtml
      .replace(/<script[\s\S]*?<\/script>/gi, '')
      .replace(/<style[\s\S]*?<\/style>/gi, '')
      .replace(/<nav[\s\S]*?<\/nav>/gi, '')
      .replace(/<footer[\s\S]*?<\/footer>/gi, '')
      .replace(/<aside[\s\S]*?<\/aside>/gi, '')
      .replace(/<!--[\s\S]*?-->/g, '')
      .trim();

    // Inline images
    const inlineImages: Array<{ url: string; alt: string }> = [];
    const imgPattern = /<img[^>]+src=["'](.*?)["'][^>]*(?:alt=["'](.*?)["'])?[^>]*>/gi;
    let imgMatch;
    while ((imgMatch = imgPattern.exec(bodyHtml)) !== null) {
      const imgUrl = normalizeArticleUrl(imgMatch[1]);
      if (!imgUrl) {
        continue;
      }
      // Skip tiny icons/spacers
      if (imgUrl.includes('1x1') || imgUrl.includes('spacer') || imgUrl.includes('pixel')) {
        continue;
      }
      inlineImages.push({
        url: imgUrl,
        alt: decodeHtmlEntities(imgMatch[2] ?? ''),
      });
    }

    // Summary
    const ogDescMatch = html.match(
      /<meta\s+(?:property=["']og:description["']|name=["']description["'])\s+content=["'](.*?)["']/i,
    );
    let summary = ogDescMatch?.[1] ? decodeHtmlEntities(ogDescMatch[1]) : '';
    if (!summary) {
      const plainBody = extractText(bodyHtml);
      summary = extractFirstSentences(plainBody, 2);
    }
    if (summary.length > 300) {
      summary = summary.slice(0, 297) + '...';
    }

    return {
      title,
      summary,
      bodyHtml,
      heroImageUrl,
      inlineImages,
      category,
      author,
      publishedAt,
      sourceUrl: feedArticle.sourceUrl,
      readingTimeMin: estimateReadingTime(bodyHtml),
    };
  } catch (err) {
    console.error(`Error scraping ${feedArticle.sourceUrl}:`, err);
    return null;
  }
}

// ── Main handler ────────────────────────────────────────────

Deno.serve(async (request: Request) => {
  const optionsResponse = handleOptions(request);
  if (optionsResponse) return optionsResponse;

  try {
    const adminClient = createAdminClient();

    // 1. Gather article links from today.umd.edu
    const feedArticles = await fetchArticleLinksFromFeed();
    console.log(`Found ${feedArticles.length} article links`);

    // 2. Check which articles we already have
    const sourceUrls = feedArticles.map((a) => a.sourceUrl);
    const { data: existingRows } = await adminClient
      .from('umd_articles')
      .select('source_url, scraped_at')
      .in('source_url', sourceUrls);

    const existingMap = new Map(
      (existingRows ?? []).map((row: { source_url: string; scraped_at: string }) => [row.source_url, row.scraped_at]),
    );

    // Only scrape new articles or articles older than 24h since last scrape
    const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const toScrape = feedArticles.filter((a) => {
      const lastScraped = existingMap.get(a.sourceUrl);
      return !lastScraped || lastScraped < cutoff;
    });

    console.log(`${toScrape.length} articles need scraping`);

    // 3. Scrape each article (with a small delay between requests)
    const results: ScrapedArticle[] = [];
    for (const feedArticle of toScrape) {
      const scraped = await scrapeArticleDetail(feedArticle);
      if (scraped) {
        results.push(scraped);
      }
      // Be polite to UMD's server
      await new Promise((resolve) => setTimeout(resolve, 500));
    }

    // 4. Upsert into database
    if (results.length > 0) {
      const rows = results.map((a) => ({
        title: a.title,
        summary: a.summary,
        body_html: a.bodyHtml,
        hero_image_url: a.heroImageUrl,
        inline_images: a.inlineImages,
        category: a.category,
        author: a.author,
        published_at: a.publishedAt,
        source_url: a.sourceUrl,
        reading_time_min: a.readingTimeMin,
        scraped_at: new Date().toISOString(),
      }));

      const { error } = await adminClient
        .from('umd_articles')
        .upsert(rows, { onConflict: 'source_url' });

      if (error) {
        console.error('Upsert error:', error);
        throw error;
      }
    }

    // 5. Clean up old articles (older than retention period)
    const retentionCutoff = new Date(
      Date.now() - ARTICLE_RETENTION_DAYS * 24 * 60 * 60 * 1000,
    ).toISOString();
    await adminClient.from('umd_articles').delete().lt('published_at', retentionCutoff);

    return jsonResponse({
      scraped: results.length,
      skipped: feedArticles.length - toScrape.length,
      total_links: feedArticles.length,
    });
  } catch (error) {
    return errorResponse(error);
  }
});
