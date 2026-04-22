import { addHours, addMinutes, format, isAfter, isBefore, parseISO } from 'date-fns';
import { Platform } from 'react-native';
import { buildings } from '../assets/data/buildings';
import { EventCategory, type Event } from '../shared/types';
import { isSupabaseConfigured, supabase } from './supabase';

const OFFICIAL_SCHEDULE_SOURCE_URL = 'https://umterps.com/calendar';
const OFFICIAL_BASE_URL = 'https://umterps.com';
const SPORTS_EVENT_ID_PREFIX = 'sports:';
const SPORTS_CREATED_BY = 'umd-athletics-feed';

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

type OfficialSportsFeedResponse = {
  items: OfficialSportsFeedItem[];
  generatedAt: string;
  source: string;
  sourceUrl: string;
};

export interface UmdSportsLink {
  key: 'watch' | 'listen' | 'stats' | 'tickets' | 'preview' | 'recap' | 'boxscore';
  title: string;
  url: string;
}

export interface UmdSportsScheduleItem {
  id: string;
  sourceId: number;
  sportTitle: string;
  sportCode: string;
  sportShortName: string;
  matchupLabel: string;
  opponentLabel: string;
  opponentLogoUrl: string | null;
  opponentWebsite: string | null;
  isHome: boolean;
  isAway: boolean;
  isNeutral: boolean;
  conferenceGame: boolean;
  venueTitle: string;
  locationSummary: string;
  campusVenue: boolean;
  startsAt: string;
  endsAt: string;
  timeLabel: string;
  statusLabel: string;
  resultLabel: string | null;
  description: string;
  sourceUrl: string;
  links: UmdSportsLink[];
  event: Event;
}

type VenueMatch =
  | {
      locationId: string | null;
      locationName: string;
      latitude: number | null;
      longitude: number | null;
      campusVenue: boolean;
    }
  | null;

const SPORTS_VENUE_ALIASES: Array<{
  aliases: string[];
  locationId?: string;
  locationName: string;
  latitude?: number;
  longitude?: number;
}> = [
  {
    aliases: ['secu stadium', 'maryland stadium', 'capital one field at maryland stadium'],
    locationId: 'bld-008',
    locationName: 'Maryland Stadium',
  },
  {
    aliases: ['xfinity center'],
    locationId: 'bld-007',
    locationName: 'XFINITY Center',
  },
  {
    aliases: ['cole field house'],
    locationId: 'bld-009',
    locationName: 'Cole Field House',
  },
  {
    aliases: ['bob "turtle" smith stadium', "bob 'turtle' smith stadium", 'bob turtle smith stadium', 'shipley field at bob', 'shipley field at bob "turtle" smith stadium'],
    locationName: 'Bob "Turtle" Smith Stadium',
    latitude: 38.9948,
    longitude: -76.9404,
  },
  {
    aliases: ['ludwig field', 'kehoe track at ludwig field', 'field hockey and lacrosse complex', 'maryland field hockey & lacrosse complex', 'field hockey & lacrosse complex'],
    locationName: 'Ludwig Field',
    latitude: 38.9925,
    longitude: -76.9462,
  },
];

function normalizeText(value: string | null | undefined) {
  return (value ?? '')
    .toLowerCase()
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

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

function normalizeFeedLink(
  key: UmdSportsLink['key'],
  link: OfficialSportsFeedLink | null | undefined,
): UmdSportsLink | null {
  const url = buildAbsoluteUrl(link?.url);
  if (!url) {
    return null;
  }

  return {
    key,
    title: link?.title?.trim() || link?.label?.trim() || key,
    url,
  };
}

function buildOpponentLogoUrl(item: OfficialSportsFeedItem) {
  const image = item.opponent?.image;
  if (!image?.filename || !image.path) {
    return null;
  }

  return buildAbsoluteUrl(`${image.path}/${image.filename}`);
}

function inferEventStart(item: OfficialSportsFeedItem) {
  const parsed = parseISO(item.date);
  if (
    item.time.trim().length === 0 &&
    parsed.getHours() === 0 &&
    parsed.getMinutes() === 0 &&
    parsed.getSeconds() === 0
  ) {
    return addHours(parsed, 9);
  }

  return parsed;
}

function inferEventEnd(start: Date, item: OfficialSportsFeedItem) {
  if (item.time.trim().length === 0) {
    return addHours(start, 8);
  }

  const sportName = normalizeText(item.sport.short_display || item.sport.title);
  if (sportName.includes('golf') || sportName.includes('track')) {
    return addHours(start, 6);
  }

  if (sportName.includes('baseball') || sportName.includes('softball')) {
    return addHours(start, 3);
  }

  return addHours(start, 2).getMinutes() === 0 ? addMinutes(start, 150) : addHours(start, 2);
}

function resolveVenueMatch(item: OfficialSportsFeedItem): VenueMatch {
  const locationIndicator = item.location_indicator;
  const rawCandidates = [
    item.facility?.title,
    item.location,
    item.opponent?.location,
  ].filter((value): value is string => Boolean(value && value.trim().length > 0));
  const normalizedCandidates = rawCandidates.map((value) => normalizeText(value));
  const isHomeLike =
    locationIndicator === 'H' ||
    rawCandidates.some((candidate) => normalizeText(candidate).includes('college park'));

  if (!isHomeLike) {
    return null;
  }

  const buildingMatch = buildings.find((building) =>
    normalizedCandidates.some((candidate) => {
      const buildingName = normalizeText(building.name);
      const buildingCode = normalizeText(building.code);
      return candidate.includes(buildingName) || (buildingCode.length > 0 && candidate.includes(buildingCode));
    }),
  );

  if (buildingMatch) {
    return {
      locationId: buildingMatch.id,
      locationName: buildingMatch.name,
      latitude: buildingMatch.latitude,
      longitude: buildingMatch.longitude,
      campusVenue: true,
    };
  }

  const aliasMatch = SPORTS_VENUE_ALIASES.find((alias) =>
    alias.aliases.some((needle) =>
      normalizedCandidates.some((candidate) => candidate.includes(normalizeText(needle))),
    ),
  );

  if (aliasMatch) {
    const building = aliasMatch.locationId
      ? buildings.find((entry) => entry.id === aliasMatch.locationId)
      : null;

    return {
      locationId: aliasMatch.locationId ?? null,
      locationName: building?.name ?? aliasMatch.locationName,
      latitude: building?.latitude ?? aliasMatch.latitude ?? null,
      longitude: building?.longitude ?? aliasMatch.longitude ?? null,
      campusVenue: true,
    };
  }

  return null;
}

function buildResultLabel(item: OfficialSportsFeedItem) {
  const teamScore = item.result?.team_score?.trim();
  const opponentScore = item.result?.opponent_score?.trim();
  const postscoreInfo = item.result?.postscore_info?.trim();
  const prescoreInfo = item.result?.prescore_info?.trim();

  if (teamScore && opponentScore) {
    const summary = `Maryland ${teamScore}, ${item.opponent?.title?.trim() || 'Opponent'} ${opponentScore}`;
    return postscoreInfo ? `${summary} ${postscoreInfo}`.trim() : summary;
  }

  if (prescoreInfo) {
    return prescoreInfo;
  }

  return null;
}

function buildStatusLabel(start: Date, end: Date, item: OfficialSportsFeedItem) {
  const now = new Date();

  if (item.result?.team_score || item.result?.opponent_score) {
    return 'Final';
  }

  if (isBefore(now, start)) {
    return 'Upcoming';
  }

  if (isAfter(now, start) && isBefore(now, end)) {
    return 'Live now';
  }

  return 'Final';
}

function buildSportsDescription(args: {
  item: OfficialSportsFeedItem;
  matchupLabel: string;
  sportTitle: string;
  venueTitle: string;
  locationSummary: string;
  resultLabel: string | null;
  links: UmdSportsLink[];
}) {
  const { item, matchupLabel, sportTitle, venueTitle, locationSummary, resultLabel, links } = args;
  const sentences = [
    `${sportTitle} matchup: ${matchupLabel}.`,
    venueTitle !== locationSummary
      ? `Venue: ${venueTitle} in ${locationSummary}.`
      : `Venue: ${venueTitle}.`,
  ];

  if (item.conference) {
    sentences.push('Conference matchup.');
  }

  if (item.location_indicator === 'H') {
    sentences.push('Home contest for Maryland.');
  } else if (item.location_indicator === 'A') {
    sentences.push('Road game for Maryland.');
  } else if (item.location_indicator === 'N') {
    sentences.push('Neutral-site event.');
  }

  if (resultLabel) {
    sentences.push(`Result: ${resultLabel}.`);
  }

  if (links.length > 0) {
    const linkLabels = links.slice(0, 4).map((link) => link.title).join(', ');
    sentences.push(`Available links: ${linkLabels}.`);
  }

  return sentences.join(' ');
}

function normalizeSportsFeedItem(item: OfficialSportsFeedItem): UmdSportsScheduleItem {
  const start = inferEventStart(item);
  const end = inferEventEnd(start, item);
  const sportTitle = item.sport.short_display?.trim() || item.sport.title?.trim() || 'Maryland Athletics';
  const opponentLabel = [item.opponent?.prefix?.trim(), item.opponent?.title?.trim()]
    .filter(Boolean)
    .join(' ')
    .trim() || 'Opponent';
  const matchupLabel = item.show_at_vs === false
    ? `${sportTitle} • ${opponentLabel}`
    : `Maryland ${item.at_vs === 'at' ? 'at' : 'vs'} ${opponentLabel}`;
  const resolvedVenue = resolveVenueMatch(item);
  const venueTitle = resolvedVenue?.locationName ?? item.facility?.title?.trim() ?? item.location?.trim() ?? 'TBD venue';
  const locationSummary = item.location?.trim() || venueTitle;
  const opponentLogoUrl = buildOpponentLogoUrl(item);
  const resultLabel = buildResultLabel(item);
  const linkValues = [
    normalizeFeedLink('watch', item.media?.video),
    normalizeFeedLink('listen', item.media?.audio ?? item.media?.radio),
    normalizeFeedLink('stats', item.media?.stats),
    normalizeFeedLink('tickets', item.media?.tickets),
    normalizeFeedLink('preview', item.media?.preview),
    normalizeFeedLink('recap', item.result?.recap),
    normalizeFeedLink('boxscore', item.result?.boxscore),
  ].filter((value): value is UmdSportsLink => Boolean(value));
  const statusLabel = buildStatusLabel(start, end, item);
  const description = buildSportsDescription({
    item,
    matchupLabel,
    sportTitle,
    venueTitle,
    locationSummary,
    resultLabel,
    links: linkValues,
  });

  const event: Event = {
    id: `${SPORTS_EVENT_ID_PREFIX}${item.id}`,
    title: matchupLabel,
    description,
    club_id: null,
    created_by: SPORTS_CREATED_BY,
    organizer_name: `${sportTitle} · Maryland Athletics`,
    organizer_ids: [],
    co_host_club_ids: [],
    category: EventCategory.Sports,
    starts_at: start.toISOString(),
    ends_at: end.toISOString(),
    recurrence_frequency: null,
    recurs_until: null,
    series_root_id: null,
    status:
      statusLabel === 'Live now'
        ? 'live'
        : statusLabel === 'Final'
          ? 'completed'
          : 'upcoming',
    moderation_status: 'approved',
    location_name: venueTitle,
    location_id: resolvedVenue?.locationId ?? null,
    location_details: locationSummary !== venueTitle ? locationSummary : null,
    latitude: resolvedVenue?.latitude ?? null,
    longitude: resolvedVenue?.longitude ?? null,
    image_url: opponentLogoUrl,
    attachments: [],
    rsvp_count: 0,
    attendee_count: 0,
    interested_count: 0,
    max_capacity: null,
    waitlist_enabled: false,
    require_approval: false,
    is_free: true,
    ticket_price: null,
    visibility: 'public',
    contact_info: item.opponent?.website?.trim() || null,
    is_featured: item.location_indicator === 'H' && isBefore(start, addHours(new Date(), 72)),
    tags: [
      'athletics',
      sportTitle,
      item.location_indicator === 'H' ? 'home game' : item.location_indicator === 'A' ? 'away game' : 'neutral site',
      item.conference ? 'conference' : 'non-conference',
    ],
    location: venueTitle,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  return {
    id: event.id,
    sourceId: item.id,
    sportTitle,
    sportCode: item.sport.abbreviation,
    sportShortName: item.sport.shortname,
    matchupLabel,
    opponentLabel,
    opponentLogoUrl,
    opponentWebsite: buildAbsoluteUrl(item.opponent?.website) ?? null,
    isHome: item.location_indicator === 'H',
    isAway: item.location_indicator === 'A',
    isNeutral: item.location_indicator === 'N',
    conferenceGame: item.conference,
    venueTitle,
    locationSummary,
    campusVenue: Boolean(resolvedVenue?.campusVenue && resolvedVenue.latitude !== null && resolvedVenue.longitude !== null),
    startsAt: event.starts_at,
    endsAt: event.ends_at,
    timeLabel: `${format(start, 'EEE, MMM d')} • ${item.time?.trim() || 'All day'}`,
    statusLabel,
    resultLabel,
    description,
    sourceUrl:
      linkValues.find((link) => link.key === 'preview')?.url ??
      linkValues.find((link) => link.key === 'recap')?.url ??
      linkValues.find((link) => link.key === 'boxscore')?.url ??
      OFFICIAL_SCHEDULE_SOURCE_URL,
    links: linkValues,
    event,
  };
}

function uniqueSportsItems(items: UmdSportsScheduleItem[]) {
  return [...new Map(items.map((item) => [item.id, item])).values()].sort(
    (left, right) => parseISO(left.startsAt).getTime() - parseISO(right.startsAt).getTime(),
  );
}

async function fetchDirectSportsSchedule() {
  const response = await fetch(
    `${OFFICIAL_BASE_URL}/services/responsive-calendar.ashx?type=month&sport=0&location=all&date=${encodeURIComponent(`${new Date().getMonth() + 1}/1/${new Date().getFullYear()} 12:00:00 AM`)}`,
  );

  if (!response.ok) {
    throw new Error(`Maryland Athletics schedule request failed: ${response.status}`);
  }

  const monthRows = (await response.json()) as Array<{ events: OfficialSportsFeedItem[] | null }>;
  const items = monthRows.flatMap((row) => row.events ?? []);
  return {
    items,
    generatedAt: new Date().toISOString(),
    source: 'official-direct',
    sourceUrl: OFFICIAL_SCHEDULE_SOURCE_URL,
  } satisfies OfficialSportsFeedResponse;
}

export function isUmdSportsEventId(eventId: string | null | undefined) {
  return Boolean(eventId?.startsWith(SPORTS_EVENT_ID_PREFIX));
}

export async function fetchUmdSportsSchedule() {
  let payload: OfficialSportsFeedResponse;

  if (!isSupabaseConfigured) {
    if (Platform.OS === 'web') {
      throw new Error('Sports schedule requires the xUMD sports proxy on web.');
    }

    payload = await fetchDirectSportsSchedule();
  } else {
    try {
      const { data, error } = await supabase.functions.invoke('get-umd-sports-schedule', {
        body: { monthsAhead: 2 },
      });

      if (error) {
        throw error;
      }

      payload = data as OfficialSportsFeedResponse;
    } catch (error) {
      if (Platform.OS === 'web') {
        throw error instanceof Error ? error : new Error('Unable to load Maryland Athletics schedule.');
      }

      payload = await fetchDirectSportsSchedule();
    }
  }

  return {
    ...payload,
    items: uniqueSportsItems((payload.items ?? []).map(normalizeSportsFeedItem)),
  };
}

