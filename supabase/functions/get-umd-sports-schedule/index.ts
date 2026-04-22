import { addMonths } from 'npm:date-fns';
import { errorResponse, handleOptions, jsonResponse } from '../_shared/http.ts';

const OFFICIAL_BASE_URL = 'https://umterps.com';
const OFFICIAL_SCHEDULE_SOURCE_URL = `${OFFICIAL_BASE_URL}/calendar`;
const MAX_MONTHS_AHEAD = 3;

type OfficialSportsFeedLink = {
  title: string | null;
  url: string | null;
  label: string | null;
  css_class?: string | null;
};

type OfficialSportsFeedImage = {
  filename?: string | null;
  path?: string | null;
  title?: string | null;
  alt?: string | null;
};

type OfficialSportsFeedItem = {
  id: number;
  date: string;
  time: string;
  conference: boolean;
  location: string | null;
  location_indicator: 'H' | 'A' | 'N' | string;
  show_at_vs: boolean;
  at_vs: 'vs' | 'at' | string;
  status: string | null;
  noplay_text: string | null;
  type: string | null;
  promotion: string | null;
  is_a_doubleheader: boolean;
  sport: {
    id: number;
    title: string;
    abbreviation: string;
    shortname: string;
    short_display: string;
    global_sport_shortname?: string | null;
  };
  opponent: {
    id?: number | null;
    title: string;
    prefix?: string | null;
    website?: string | null;
    location?: string | null;
    conference?: boolean | null;
    mascot?: string | null;
    image?: OfficialSportsFeedImage | null;
  } | null;
  media?: {
    tv?: OfficialSportsFeedLink | null;
    radio?: OfficialSportsFeedLink | null;
    video?: OfficialSportsFeedLink | null;
    audio?: OfficialSportsFeedLink | null;
    stats?: OfficialSportsFeedLink | null;
    tickets?: OfficialSportsFeedLink | null;
    preview?: OfficialSportsFeedLink | null;
    gamefiles?: OfficialSportsFeedLink[] | null;
    custom_display_fields?: unknown[] | null;
  } | null;
  result?: {
    status?: string | null;
    team_score?: string | null;
    opponent_score?: string | null;
    prescore_info?: string | null;
    postscore_info?: string | null;
    boxscore?: OfficialSportsFeedLink | null;
    recap?: OfficialSportsFeedLink | null;
  } | null;
  facility?: {
    id?: number | null;
    title?: string | null;
    url?: string | null;
  } | null;
  tournament?: {
    title?: string | null;
  } | null;
  gamelinks?: unknown[] | null;
};

function buildAbsoluteUrl(url: string | null | undefined) {
  const trimmed = url?.trim();
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
    return `${OFFICIAL_BASE_URL}${trimmed}`;
  }

  return `${OFFICIAL_BASE_URL}/${trimmed.replace(/^\/+/, '')}`;
}

function normalizeFeedLink(link: OfficialSportsFeedLink | null | undefined) {
  const url = buildAbsoluteUrl(link?.url);
  return {
    title: link?.title?.trim() || link?.label?.trim() || null,
    url,
    label: link?.label?.trim() || null,
    css_class: link?.css_class ?? null,
  };
}

function normalizeFeedImage(image: OfficialSportsFeedImage | null | undefined) {
  if (!image?.filename || !image.path) {
    return null;
  }

  return {
    filename: image.filename,
    path: image.path,
    title: image.title ?? null,
    alt: image.alt ?? null,
    url: buildAbsoluteUrl(`${image.path}/${image.filename}`),
  };
}

function buildMonthRequestDate(date: Date) {
  return `${date.getMonth() + 1}/1/${date.getFullYear()} 12:00:00 AM`;
}

async function fetchOfficialMonth(monthDate: Date) {
  const url = `${OFFICIAL_BASE_URL}/services/responsive-calendar.ashx?type=month&sport=0&location=all&date=${encodeURIComponent(buildMonthRequestDate(monthDate))}`;
  const response = await fetch(url, {
    headers: {
      'User-Agent': 'xUMD-Campus-App/1.0',
      'Accept': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`Maryland Athletics schedule request failed (${response.status}).`);
  }

  return (await response.json()) as Array<{ date: string; events: OfficialSportsFeedItem[] | null }>;
}

function normalizeSportsItem(item: OfficialSportsFeedItem) {
  return {
    ...item,
    opponent: item.opponent
      ? {
          ...item.opponent,
          website: buildAbsoluteUrl(item.opponent.website) ?? null,
          image: normalizeFeedImage(item.opponent.image),
        }
      : null,
    media: item.media
      ? {
          tv: normalizeFeedLink(item.media.tv),
          radio: normalizeFeedLink(item.media.radio),
          video: normalizeFeedLink(item.media.video),
          audio: normalizeFeedLink(item.media.audio),
          stats: normalizeFeedLink(item.media.stats),
          tickets: normalizeFeedLink(item.media.tickets),
          preview: normalizeFeedLink(item.media.preview),
          gamefiles: (item.media.gamefiles ?? []).map((entry) => normalizeFeedLink(entry)),
          custom_display_fields: item.media.custom_display_fields ?? [],
        }
      : null,
    result: item.result
      ? {
          ...item.result,
          boxscore: normalizeFeedLink(item.result.boxscore),
          recap: normalizeFeedLink(item.result.recap),
        }
      : null,
    facility: item.facility
      ? {
          ...item.facility,
          url: buildAbsoluteUrl(item.facility.url) ?? null,
        }
      : null,
  };
}

Deno.serve(async (request: Request) => {
  const optionsResponse = handleOptions(request);
  if (optionsResponse) {
    return optionsResponse;
  }

  try {
    const body = request.method === 'POST' ? await request.json().catch(() => ({})) : {};
    const requestedMonthsAhead =
      typeof body?.monthsAhead === 'number' && Number.isFinite(body.monthsAhead)
        ? body.monthsAhead
        : 2;
    const monthsAhead = Math.max(0, Math.min(requestedMonthsAhead, MAX_MONTHS_AHEAD));
    const monthAnchors = Array.from({ length: monthsAhead + 1 }, (_, index) =>
      addMonths(new Date(), index),
    );

    const monthResponses = await Promise.all(monthAnchors.map((anchor) => fetchOfficialMonth(anchor)));
    const items = [...new Map(
      monthResponses
        .flatMap((month) => month.flatMap((day) => day.events ?? []))
        .map((item) => [item.id, normalizeSportsItem(item)]),
    ).values()];

    return jsonResponse({
      items,
      generatedAt: new Date().toISOString(),
      source: 'official-athletics-calendar',
      sourceUrl: OFFICIAL_SCHEDULE_SOURCE_URL,
    });
  } catch (error) {
    return errorResponse(error);
  }
});

