import { supabase, isSupabaseConfigured } from './supabase';
import type { UmdArticle } from '../shared/types';

const UMD_TODAY_BASE = 'https://today.umd.edu';

const MOCK_ARTICLES: UmdArticle[] = [
  {
    id: 'mock-1',
    title: 'UMD Researchers Discover New Method for Quantum Computing Error Correction',
    summary: 'A team of physicists at the University of Maryland have developed a breakthrough technique that could dramatically improve the reliability of quantum computers. The method reduces error rates by up to 90%.',
    body_html: '<p>A team of physicists at the University of Maryland have developed a breakthrough technique that could dramatically improve the reliability of quantum computers.</p><p>The method, published in Nature Physics, reduces error rates by up to 90% compared to existing approaches.</p>',
    hero_image_url: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=1200&q=80',
    inline_images: [],
    category: 'Research',
    author: 'Jane Smith',
    published_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    source_url: 'https://today.umd.edu/quantum-computing-error-correction',
    reading_time_min: 4,
    scraped_at: new Date().toISOString(),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'mock-2',
    title: 'Spring Commencement Ceremonies Announced for May 2026',
    summary: 'The University of Maryland will hold its spring commencement ceremonies across multiple days in May. Over 8,000 students are expected to graduate this year.',
    body_html: '<p>The University of Maryland will hold its spring commencement ceremonies across multiple days in May.</p><p>Over 8,000 students are expected to graduate this year from undergraduate and graduate programs.</p>',
    hero_image_url: 'https://images.unsplash.com/photo-1541339907198-e08756dedf3f?auto=format&fit=crop&w=1200&q=80',
    inline_images: [],
    category: 'Campus',
    author: null,
    published_at: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
    source_url: 'https://today.umd.edu/spring-commencement-2026',
    reading_time_min: 3,
    scraped_at: new Date().toISOString(),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'mock-3',
    title: 'Terps Men\'s Basketball Advances to Big Ten Championship Game',
    summary: 'The Maryland Terrapins secured a decisive 78-65 victory over Michigan State to advance to the Big Ten Championship. The team will face Purdue in Sunday\'s final.',
    body_html: '<p>The Maryland Terrapins secured a decisive 78-65 victory over Michigan State.</p>',
    hero_image_url: 'https://images.unsplash.com/photo-1517649763962-0c623066013b?auto=format&fit=crop&w=1200&q=80',
    inline_images: [],
    category: 'Athletics',
    author: 'Sports Desk',
    published_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    source_url: 'https://today.umd.edu/terps-big-ten-championship',
    reading_time_min: 5,
    scraped_at: new Date().toISOString(),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'mock-4',
    title: 'New Student Mental Health Initiative Launches This Semester',
    summary: 'The university is expanding mental health services with a peer counseling program and 24/7 crisis hotline. The initiative includes free therapy sessions for all students.',
    body_html: '<p>The university is expanding mental health services with a new peer counseling program.</p>',
    hero_image_url: 'https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&w=1200&q=80',
    inline_images: [],
    category: 'Students',
    author: 'Campus Life',
    published_at: new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString(),
    source_url: 'https://today.umd.edu/mental-health-initiative',
    reading_time_min: 3,
    scraped_at: new Date().toISOString(),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'mock-5',
    title: 'Clarice Smith Center Announces Spring Performance Season',
    summary: 'The Clarice Smith Performing Arts Center has unveiled its spring lineup featuring world-renowned artists, student performances, and interdisciplinary collaborations.',
    body_html: '<p>The Clarice Smith Performing Arts Center has unveiled its spring lineup.</p>',
    hero_image_url: 'https://images.unsplash.com/photo-1503095396549-807759245b35?auto=format&fit=crop&w=1200&q=80',
    inline_images: [],
    category: 'Arts',
    author: 'Arts & Culture',
    published_at: new Date(Date.now() - 72 * 60 * 60 * 1000).toISOString(),
    source_url: 'https://today.umd.edu/clarice-spring-season',
    reading_time_min: 4,
    scraped_at: new Date().toISOString(),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];

function normalizeMaybeArticleUrl(value: string | null | undefined) {
  const trimmed = value?.trim();
  if (!trimmed) {
    return null;
  }

  if (/^https?:\/\//i.test(trimmed)) {
    return trimmed;
  }

  if (trimmed.startsWith('//')) {
    return `https:${trimmed}`;
  }

  if (trimmed.startsWith('/')) {
    return `${UMD_TODAY_BASE}${trimmed}`;
  }

  return `${UMD_TODAY_BASE}/${trimmed.replace(/^\/+/, '')}`;
}

function normalizeArticle(article: UmdArticle): UmdArticle {
  return {
    ...article,
    hero_image_url: normalizeMaybeArticleUrl(article.hero_image_url),
    inline_images: Array.isArray(article.inline_images)
      ? article.inline_images
          .map((image) => ({
            ...image,
            url: normalizeMaybeArticleUrl(image?.url) ?? '',
          }))
          .filter((image) => image.url.length > 0)
      : [],
  };
}

function getFallbackArticles(category?: string) {
  const filtered = category ? MOCK_ARTICLES.filter((article) => article.category === category) : MOCK_ARTICLES;
  return filtered.map(normalizeArticle);
}

function getFallbackArticlesPage(page = 1, pageSize = 20, category?: string) {
  const filtered = getFallbackArticles(category);
  const start = (page - 1) * pageSize;
  return {
    articles: filtered.slice(start, start + pageSize),
    hasMore: start + pageSize < filtered.length,
  };
}

export async function fetchLatestArticles(limit = 5): Promise<UmdArticle[]> {
  if (!isSupabaseConfigured) {
    return getFallbackArticles().slice(0, limit);
  }

  const { data, error } = await supabase
    .from('umd_articles')
    .select('*')
    .order('published_at', { ascending: false })
    .limit(limit);

  if (error || !data?.length) {
    return getFallbackArticles().slice(0, limit);
  }

  return (data as UmdArticle[]).map(normalizeArticle);
}

export async function fetchArticleById(id: string): Promise<UmdArticle | null> {
  if (!isSupabaseConfigured) {
    return getFallbackArticles().find((a) => a.id === id) ?? null;
  }

  const { data, error } = await supabase
    .from('umd_articles')
    .select('*')
    .eq('id', id)
    .maybeSingle();

  if (error || !data) {
    return getFallbackArticles().find((a) => a.id === id) ?? null;
  }

  return normalizeArticle(data as UmdArticle);
}

export async function fetchArticlesPage({
  page = 1,
  pageSize = 20,
  category,
}: {
  page?: number;
  pageSize?: number;
  category?: string;
}): Promise<{ articles: UmdArticle[]; hasMore: boolean }> {
  if (!isSupabaseConfigured) {
    return getFallbackArticlesPage(page, pageSize, category);
  }

  let query = supabase
    .from('umd_articles')
    .select('*')
    .order('published_at', { ascending: false })
    .range((page - 1) * pageSize, page * pageSize - 1);

  if (category) {
    query = query.eq('category', category);
  }

  const { data, error } = await query;

  if (error || !data?.length) {
    return getFallbackArticlesPage(page, pageSize, category);
  }

  const articles = (data ?? [] as UmdArticle[]).map(normalizeArticle);
  return {
    articles,
    hasMore: articles.length === pageSize,
  };
}
