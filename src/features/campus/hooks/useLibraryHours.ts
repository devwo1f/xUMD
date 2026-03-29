import { useEffect, useState } from 'react';
import {
  getFallbackLibraryHours,
  isHoursLabelOpen,
  libraryProfiles,
  normalizeHoursLabel,
  type LibraryHoursStatus,
  type LibraryId,
} from '../data/libraries';

type LibraryHoursMap = Record<LibraryId, LibraryHoursStatus>;

const OFFICIAL_HOURS_URL = 'https://www.lib.umd.edu/visit/libraries';
const CACHE_TTL_MS = 10 * 60 * 1000;

let cachedHours: LibraryHoursMap | null = null;
let cachedAt = 0;
let inflightRequest: Promise<LibraryHoursMap> | null = null;

function buildFallbackMap(date: Date = new Date()): LibraryHoursMap {
  return libraryProfiles.reduce((accumulator, profile) => {
    accumulator[profile.id] = getFallbackLibraryHours(profile, date);
    return accumulator;
  }, {} as LibraryHoursMap);
}

function stripHtml(html: string) {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;|&#160;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/\s+/g, ' ')
    .trim();
}

function extractHoursBlock(text: string) {
  const marker = 'Library Hours are subject to change.';
  const markerIndex = text.indexOf(marker);

  if (markerIndex === -1) {
    return text;
  }

  const afterMarker = text.slice(markerIndex + marker.length);
  const endCandidates = ['All libraries all days', 'More Library Hours', 'View All Status'];
  const endIndexes = endCandidates
    .map((candidate) => afterMarker.indexOf(candidate))
    .filter((index) => index >= 0);
  const endIndex = endIndexes.length > 0 ? Math.min(...endIndexes) : afterMarker.length;

  return afterMarker.slice(0, endIndex).trim();
}

function extractUpdatedLabel(text: string) {
  const match = text.match(
    /(Sunday|Monday|Tuesday|Wednesday|Thursday|Friday|Saturday),\s+[A-Z][a-z]+\s+\d{1,2}/,
  );

  return match ? `${match[0]} · UMD Libraries` : 'UMD Libraries';
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function buildLibraryPattern(currentName: string, nextNames: string[]) {
  const nextMarker = nextNames.length > 0 ? nextNames.map(escapeRegExp).join('|') : 'Shady Grove|All libraries';
  return new RegExp(`${escapeRegExp(currentName)}(?:\\s+\\(MAIN\\))?\\s+(.+?)(?=\\s+(?:${nextMarker})\\s+)`, 'i');
}

function parseOfficialHours(html: string, date: Date = new Date()) {
  const text = stripHtml(html);
  const hoursBlock = extractHoursBlock(text);
  const updatedLabel = extractUpdatedLabel(text);

  const orderedOfficialNames = [
    'McKeldin',
    'Architecture',
    'Art',
    'Hornbake',
    'Michelle Smith Performing Arts',
    'STEM',
  ];

  const idByOfficialName: Partial<Record<string, LibraryId>> = {
    McKeldin: 'mckeldin',
    Architecture: 'architecture',
    Art: 'art',
    Hornbake: 'hornbake',
    'Michelle Smith Performing Arts': 'mspal',
    STEM: 'stem',
  };

  return orderedOfficialNames.reduce<Partial<LibraryHoursMap>>((accumulator, officialName, index) => {
    const pattern = buildLibraryPattern(
      officialName,
      orderedOfficialNames.slice(index + 1).concat(['Special Collections in Hornbake', 'Shady Grove', 'All libraries']),
    );
    const match = hoursBlock.match(pattern);
    const libraryId = idByOfficialName[officialName];

    if (!match || !libraryId) {
      return accumulator;
    }

    const label = normalizeHoursLabel(match[1]);
    accumulator[libraryId] = {
      label,
      isOpen: isHoursLabelOpen(label, date),
      source: 'live',
      updatedLabel,
    };

    return accumulator;
  }, {});
}

async function loadLibraryHours() {
  const now = Date.now();

  if (cachedHours && now - cachedAt < CACHE_TTL_MS) {
    return cachedHours;
  }

  if (inflightRequest) {
    return inflightRequest;
  }

  inflightRequest = (async () => {
    const fallbackMap = buildFallbackMap();

    try {
      const response = await fetch(OFFICIAL_HOURS_URL);

      if (!response.ok) {
        throw new Error(`Hours request failed: ${response.status}`);
      }

      const html = await response.text();
      const liveHours = parseOfficialHours(html);
      cachedHours = {
        ...fallbackMap,
        ...liveHours,
      };
      cachedAt = Date.now();
      return cachedHours;
    } catch {
      cachedHours = fallbackMap;
      cachedAt = Date.now();
      return cachedHours;
    } finally {
      inflightRequest = null;
    }
  })();

  return inflightRequest;
}

export function useLibraryHours() {
  const [hoursByLibraryId, setHoursByLibraryId] = useState<LibraryHoursMap>(
    () => cachedHours ?? buildFallbackMap(),
  );
  const [isRefreshing, setIsRefreshing] = useState(!cachedHours);

  useEffect(() => {
    let isMounted = true;

    const hydrateHours = async () => {
      setIsRefreshing(true);
      const nextHours = await loadLibraryHours();

      if (isMounted) {
        setHoursByLibraryId(nextHours);
        setIsRefreshing(false);
      }
    };

    void hydrateHours();

    return () => {
      isMounted = false;
    };
  }, []);

  return {
    hoursByLibraryId,
    isRefreshing,
  };
}
