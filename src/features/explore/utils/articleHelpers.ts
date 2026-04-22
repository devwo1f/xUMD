import { differenceInHours, differenceInMinutes, format, isToday, isYesterday } from 'date-fns';
import type { UmdArticle } from '../../../shared/types';

export const ARTICLE_CATEGORY_COLORS: Record<string, string> = {
  Research: '#1565C0',
  Campus: '#E21833',
  Students: '#2E7D32',
  Athletics: '#F57C00',
  Arts: '#5E35B1',
  'Faculty/Staff': '#6D4C41',
};

const FALLBACK_CATEGORY_COLOR = '#757575';
const UMD_TODAY_BASE = 'https://today.umd.edu';

export function getArticleCategoryColor(category: string): string {
  return ARTICLE_CATEGORY_COLORS[category] ?? FALLBACK_CATEGORY_COLOR;
}

function normalizeArticleUrl(value: string | null | undefined) {
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

export function getArticleImageUrl(article: Pick<UmdArticle, 'hero_image_url' | 'inline_images'>): string | null {
  const candidates = [
    article.hero_image_url,
    ...(Array.isArray(article.inline_images) ? article.inline_images.map((image) => image?.url ?? null) : []),
  ];

  for (const candidate of candidates) {
    const normalized = normalizeArticleUrl(candidate);
    if (normalized) {
      return normalized;
    }
  }

  return null;
}

export function formatRelativeDate(isoDate: string | null): string {
  if (!isoDate) return '';

  const date = new Date(isoDate);
  if (isNaN(date.getTime())) return '';

  const now = new Date();
  const minutesAgo = differenceInMinutes(now, date);
  const hoursAgo = differenceInHours(now, date);

  if (minutesAgo < 1) return 'Just now';
  if (minutesAgo < 60) return `${minutesAgo}m ago`;
  if (hoursAgo < 24 && isToday(date)) return `${hoursAgo}h ago`;
  if (isYesterday(date)) return 'Yesterday';
  return format(date, 'MMM d');
}

export function formatDateGroupLabel(isoDate: string): string {
  const date = new Date(isoDate);
  if (isToday(date)) return 'Today';
  if (isYesterday(date)) return 'Yesterday';
  return format(date, 'EEEE, MMMM d');
}
