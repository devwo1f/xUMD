#!/usr/bin/env node

process.env.TZ = process.env.TZ || 'America/New_York';

import fs from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { createClient } from '@supabase/supabase-js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '..');

loadEnvFiles([
  path.join(ROOT, '.env.local'),
  path.join(ROOT, '.env'),
]);

const VALIDATE_ONLY = process.argv.includes('--validate-only');
const LOCAL_ONLY = process.argv.includes('--local-only');
const DEFAULT_TEST_PASSWORD = process.env.RESEED_TEST_ACCOUNT_PASSWORD || 'Terps2026!';
const SUPABASE_URL = process.env.SUPABASE_URL || process.env.EXPO_PUBLIC_SUPABASE_URL || '';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const TEST_ACCOUNT_EMAIL_OVERRIDE = process.env.RESEED_TEST_ACCOUNT_EMAIL?.trim().toLowerCase() || null;

const DEFAULT_NOTIFICATION_PREFS = {
  push_enabled: true,
  email_enabled: true,
  club_updates: true,
  event_reminders: true,
  feed_activity: true,
};

const FALLBACK_LOCATIONS = {
  MCK: { name: 'McKeldin Library', short_name: 'MCK', latitude: 38.986, longitude: -76.9447 },
  STAMP: { name: 'Stamp Student Union', short_name: 'STAMP', latitude: 38.9882, longitude: -76.9452 },
  IRB: { name: 'Brendan Iribe Center', short_name: 'IRB', latitude: 38.989, longitude: -76.9365 },
  ESJ: { name: 'Edward St. John Learning and Teaching Center', short_name: 'ESJ', latitude: 38.9895, longitude: -76.9382 },
  CLAR: { name: 'The Clarice Smith Center', short_name: 'CLAR', latitude: 38.9915, longitude: -76.946 },
  XFIN: { name: 'XFINITY Center', short_name: 'XFIN', latitude: 38.994, longitude: -76.943 },
  ERC: { name: 'Eppley Recreation Center', short_name: 'ERC', latitude: 38.9935, longitude: -76.9415 },
  HBK: { name: 'Hornbake Library', short_name: 'HBK', latitude: 38.988, longitude: -76.9468 },
  VMH: { name: 'Van Munching Hall', short_name: 'VMH', latitude: 38.9825, longitude: -76.944 },
  CFH: { name: 'Cole Field House', short_name: 'CFH', latitude: 38.993, longitude: -76.9445 },
  KEB: { name: 'Kim Engineering Building', short_name: 'KEB', latitude: 38.991, longitude: -76.9395 },
  KIR: { name: 'Kirwan Hall', short_name: 'KIR', latitude: 38.9889, longitude: -76.9427 },
  AVW: { name: 'A.V. Williams Building', short_name: 'AVW', latitude: 38.9899, longitude: -76.9412 },
  TAW: { name: 'Tawes Hall', short_name: 'TAW', latitude: 38.9856, longitude: -76.9459 },
  PHY: { name: 'Physics Building', short_name: 'PHY', latitude: 38.9904, longitude: -76.9389 },
};

function loadEnvFiles(filePaths) {
  for (const filePath of filePaths) {
    if (!fs.existsSync(filePath)) {
      continue;
    }

    const content = fs.readFileSync(filePath, 'utf8');
    for (const line of content.split(/\r?\n/)) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) {
        continue;
      }

      const match = trimmed.match(/^([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$/);
      if (!match) {
        continue;
      }

      const [, key, rawValue] = match;
      if (process.env[key]) {
        continue;
      }

      let value = rawValue.trim();
      if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
        value = value.slice(1, -1);
      }
      process.env[key] = value;
    }
  }
}

function avatarUrl(seed) {
  return `https://i.pravatar.cc/300?u=${encodeURIComponent(seed)}`;
}

function logoUrl(label) {
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(label)}&background=E21833&color=ffffff&size=256&bold=true`;
}

function stableUuid(namespace, value) {
  const hash = createHash('sha1').update(`${namespace}:${value}`).digest('hex');
  const part1 = hash.slice(0, 8);
  const part2 = hash.slice(8, 12);
  const part3 = `5${hash.slice(13, 16)}`;
  const variantNibble = ((parseInt(hash.slice(16, 17), 16) & 0x3) | 0x8).toString(16);
  const part4 = `${variantNibble}${hash.slice(17, 20)}`;
  const part5 = hash.slice(20, 32);
  return `${part1}-${part2}-${part3}-${part4}-${part5}`;
}

function unique(values) {
  return Array.from(new Set(values));
}

function uniqueBy(items, getKey) {
  const seen = new Set();
  const result = [];
  for (const item of items) {
    const key = getKey(item);
    if (seen.has(key)) {
      continue;
    }
    seen.add(key);
    result.push(item);
  }
  return result;
}

function slugify(value) {
  return value.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
}

function getStartOfToday() {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  return date;
}

function addMinutes(date, minutes) {
  return new Date(date.getTime() + minutes * 60 * 1000);
}

function addHours(date, hours) {
  return new Date(date.getTime() + hours * 60 * 60 * 1000);
}

function addDays(date, days) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

function localDayDate(dayOffset, hour, minute = 0) {
  const date = addDays(getStartOfToday(), dayOffset);
  date.setHours(hour, minute, 0, 0);
  return date;
}

function iso(value) {
  return value.toISOString();
}

const USER_BLUEPRINTS = [
  {
    key: 'alex',
    displayName: 'Alex Johnson',
    username: 'alexj_terp',
    email: TEST_ACCOUNT_EMAIL_OVERRIDE || 'alexj_test@terpmail.umd.edu',
    major: 'Computer Science',
    graduationYear: 2026,
    degreeType: 'bs',
    minor: 'Technology Entrepreneurship',
    pronouns: 'they/them',
    bio: "Building things at UMD. Coffee enthusiast, campus explorer, and always down for a late-night build sprint.",
    interests: ['builders', 'startups', 'campus-life', 'design', 'coffee', 'community'],
    courses: ['CMSC216', 'CMSC330', 'STAT400', 'BMGT220'],
    avatarUrl: avatarUrl('alexj_terp'),
    isTestAccount: true,
  },
  {
    key: 'nia',
    displayName: 'Nia Brooks',
    username: 'nia_builds',
    email: 'nia.brooks@terpmail.umd.edu',
    major: 'Information Science',
    graduationYear: 2027,
    degreeType: 'bs',
    minor: 'Human-Computer Interaction',
    pronouns: 'she/her',
    bio: 'Infosci student who bounces between Figma files, product strategy, and whoever needs a design critique.',
    interests: ['design', 'product', 'builders', 'community', 'mentorship'],
    courses: ['INST201', 'DATA100', 'ENGL101'],
    avatarUrl: avatarUrl('nia_builds'),
  },
  {
    key: 'daniel',
    displayName: 'Daniel Park',
    username: 'danielpark',
    email: 'daniel.park@terpmail.umd.edu',
    major: 'Computer Science',
    graduationYear: 2025,
    degreeType: 'bs',
    minor: 'Mathematics',
    pronouns: 'he/him',
    bio: 'Senior CS student, hackathon organizer, and the person who always knows which Iribe room is still open.',
    interests: ['coding', 'hackathons', 'mentorship', 'systems', 'community'],
    courses: ['CMSC216', 'CMSC351', 'MATH141'],
    avatarUrl: avatarUrl('danielpark'),
  },
  {
    key: 'priya',
    displayName: 'Priya Shah',
    username: 'priya_shah',
    email: 'priya.shah@terpmail.umd.edu',
    major: 'Biology',
    graduationYear: 2026,
    degreeType: 'bs',
    minor: 'Data Science',
    pronouns: 'she/her',
    bio: 'Bio major balancing lab hours, club leadership, and a permanent search for the best study corner on campus.',
    interests: ['wellness', 'research', 'service', 'dance', 'study-spots'],
    courses: ['PHYS161', 'STAT400', 'ENGL101'],
    avatarUrl: avatarUrl('priya_shah'),
  },
  {
    key: 'marcus',
    displayName: 'Marcus Thompson',
    username: 'marcus_t',
    email: 'marcus.thompson@terpmail.umd.edu',
    major: 'Mechanical Engineering',
    graduationYear: 2026,
    degreeType: 'bs',
    minor: null,
    pronouns: 'he/him',
    bio: 'Mechanical engineering, early morning runs, and the loudest student-section energy you will ever meet.',
    interests: ['fitness', 'sports', 'engineering', 'outdoors', 'campus-events'],
    courses: ['PHYS161', 'MATH141'],
    avatarUrl: avatarUrl('marcus_t'),
  },
  {
    key: 'maya',
    displayName: 'Maya Patel',
    username: 'maya_p',
    email: 'maya.patel@terpmail.umd.edu',
    major: 'Government and Politics',
    graduationYear: 2027,
    degreeType: 'ba',
    minor: 'Nonprofit Leadership',
    pronouns: 'she/her',
    bio: 'Policy nerd, service organizer, and the friend who will always send you the registration deadline first.',
    interests: ['service', 'advocacy', 'community', 'culture', 'leadership'],
    courses: ['ENGL101', 'BMGT220'],
    avatarUrl: avatarUrl('maya_p'),
  },
  {
    key: 'leena',
    displayName: 'Leena Rao',
    username: 'leena_rao',
    email: 'leena.rao@terpmail.umd.edu',
    major: 'Finance',
    graduationYear: 2026,
    degreeType: 'bs',
    minor: 'Technology Entrepreneurship',
    pronouns: 'she/her',
    bio: 'Usually somewhere between a pitch deck, a rehearsal, and a coffee run through Stamp.',
    interests: ['startups', 'music', 'community', 'culture', 'events'],
    courses: ['BMGT220', 'STAT400'],
    avatarUrl: avatarUrl('leena_rao'),
  },
  {
    key: 'ethan',
    displayName: 'Ethan Kim',
    username: 'ethan_kim',
    email: 'ethan.kim@terpmail.umd.edu',
    major: 'Data Science',
    graduationYear: 2025,
    degreeType: 'bs',
    minor: 'Computer Science',
    pronouns: 'he/him',
    bio: 'Data science lead who genuinely thinks a clean SQL query can fix at least half of life.',
    interests: ['data', 'analytics', 'coding', 'careers', 'mentorship'],
    courses: ['DATA200', 'STAT400', 'CMSC216'],
    avatarUrl: avatarUrl('ethan_kim'),
  },
  {
    key: 'sofia',
    displayName: 'Sofia Alvarez',
    username: 'sofia_alvarez',
    email: 'sofia.alvarez@terpmail.umd.edu',
    major: 'Journalism',
    graduationYear: 2027,
    degreeType: 'ba',
    minor: 'Film Studies',
    pronouns: 'she/her',
    bio: 'Campus storyteller with a camera roll full of sunsets, events, and people being unexpectedly iconic.',
    interests: ['film', 'storytelling', 'community', 'arts', 'photography'],
    courses: ['ENGL101'],
    avatarUrl: avatarUrl('sofia_alvarez'),
  },
  {
    key: 'jordan',
    displayName: 'Jordan Kim',
    username: 'jordank_umd',
    email: 'jordan.kim@terpmail.umd.edu',
    major: 'Environmental Science',
    graduationYear: 2026,
    degreeType: 'bs',
    minor: 'Geographical Sciences',
    pronouns: 'they/them',
    bio: 'Outdoors club president, trail planner, and champion of touching grass during midterm season.',
    interests: ['outdoors', 'sustainability', 'community', 'fitness', 'travel'],
    courses: ['ENGL101', 'PHYS161'],
    avatarUrl: avatarUrl('jordank_umd'),
  },
  {
    key: 'aaliyah',
    displayName: 'Aaliyah Green',
    username: 'aaliyah_green',
    email: 'aaliyah.green@terpmail.umd.edu',
    major: 'Kinesiology',
    graduationYear: 2027,
    degreeType: 'bs',
    minor: null,
    pronouns: 'she/her',
    bio: 'Running club captain, wellness advocate, and always trying to convince people that morning movement is worth it.',
    interests: ['running', 'wellness', 'community', 'sports', 'service'],
    courses: ['PHYS161', 'ENGL101'],
    avatarUrl: avatarUrl('aaliyah_green'),
  },
  {
    key: 'rahul',
    displayName: 'Rahul Mehta',
    username: 'rahulm',
    email: 'rahul.mehta@terpmail.umd.edu',
    major: 'Electrical Engineering',
    graduationYear: 2026,
    degreeType: 'bs',
    minor: 'Robotics',
    pronouns: 'he/him',
    bio: 'Usually carrying a soldering kit, a half-built side project, or both.',
    interests: ['engineering', 'robotics', 'coding', 'culture', 'maker-space'],
    courses: ['PHYS161', 'CMSC216', 'MATH141'],
    avatarUrl: avatarUrl('rahulm'),
  },
  {
    key: 'grace',
    displayName: 'Grace Chen',
    username: 'gracechen',
    email: 'grace.chen@terpmail.umd.edu',
    major: 'Finance',
    graduationYear: 2025,
    degreeType: 'bs',
    minor: 'Statistics',
    pronouns: 'she/her',
    bio: 'Founder-energy all day. Loves thoughtful questions, practical advice, and a room full of ambitious people.',
    interests: ['startups', 'careers', 'networking', 'analytics', 'community'],
    courses: ['BMGT220', 'STAT400'],
    avatarUrl: avatarUrl('gracechen'),
  },
  {
    key: 'omar',
    displayName: 'Omar Hassan',
    username: 'omarh',
    email: 'omar.hassan@terpmail.umd.edu',
    major: 'Computer Science',
    graduationYear: 2026,
    degreeType: 'bs',
    minor: 'Immersive Media Design',
    pronouns: 'he/him',
    bio: 'Creative technologist who likes weird interfaces, clean code, and events with a strong vibe.',
    interests: ['creative-tech', 'coding', 'design', 'film', 'startups'],
    courses: ['CMSC330', 'CMSC351', 'STAT400'],
    avatarUrl: avatarUrl('omarh'),
  },
  {
    key: 'hannah',
    displayName: 'Hannah Lee',
    username: 'hannah_lee',
    email: 'hannah.lee@terpmail.umd.edu',
    major: 'Public Health Science',
    graduationYear: 2027,
    degreeType: 'bs',
    minor: 'Asian American Studies',
    pronouns: 'she/her',
    bio: 'KSA president, outdoors regular, and forever making spreadsheets for things that do not need spreadsheets.',
    interests: ['culture', 'community', 'wellness', 'outdoors', 'events'],
    courses: ['PHYS161', 'STAT400'],
    avatarUrl: avatarUrl('hannah_lee'),
  },
  {
    key: 'david',
    displayName: 'David Okafor',
    username: 'davidok',
    email: 'david.okafor@terpmail.umd.edu',
    major: 'Computer Engineering',
    graduationYear: 2025,
    degreeType: 'bs',
    minor: null,
    pronouns: 'he/him',
    bio: 'Hardware + software + service hours. Finds a way to help before anyone asks.',
    interests: ['engineering', 'service', 'coding', 'mentorship', 'community'],
    courses: ['CMSC216', 'PHYS161', 'MATH141'],
    avatarUrl: avatarUrl('davidok'),
  },
  {
    key: 'chloe',
    displayName: 'Chloe Nguyen',
    username: 'chloecreates',
    email: 'chloe.nguyen@terpmail.umd.edu',
    major: 'Studio Art',
    graduationYear: 2026,
    degreeType: 'ba',
    minor: 'Computer Science',
    pronouns: 'she/her',
    bio: 'Creative Coding Collective president, poster-maker, and curator of niche but excellent campus playlists.',
    interests: ['arts', 'creative-tech', 'design', 'film', 'culture'],
    courses: ['ENGL101', 'INST201'],
    avatarUrl: avatarUrl('chloecreates'),
  },
  {
    key: 'aaron',
    displayName: 'Aaron Feldman',
    username: 'aaronfeldman',
    email: 'aaron.feldman@terpmail.umd.edu',
    major: 'English',
    graduationYear: 2027,
    degreeType: 'ba',
    minor: 'Film Studies',
    pronouns: 'he/him',
    bio: 'Film Society lead programmer and enthusiastic defender of late-night screenings with strong discussion energy.',
    interests: ['film', 'arts', 'storytelling', 'community', 'outdoors'],
    courses: ['ENGL101'],
    avatarUrl: avatarUrl('aaronfeldman'),
  },
  {
    key: 'sana',
    displayName: 'Sana Mir',
    username: 'sana_mir',
    email: 'sana.mir@terpmail.umd.edu',
    major: 'Neuroscience',
    graduationYear: 2026,
    degreeType: 'bs',
    minor: 'Statistics',
    pronouns: 'she/her',
    bio: 'Bhangra captain with equal love for stage lights, careful planning, and a solid post-event debrief.',
    interests: ['dance', 'culture', 'community', 'wellness', 'data'],
    courses: ['STAT400', 'ENGL101'],
    avatarUrl: avatarUrl('sana_mir'),
  },
  {
    key: 'tyler',
    displayName: 'Tyler Bennett',
    username: 'tyler_bennett',
    email: 'tyler.bennett@terpmail.umd.edu',
    major: 'Economics',
    graduationYear: 2025,
    degreeType: 'ba',
    minor: 'General Business',
    pronouns: 'he/him',
    bio: 'Shows up for founder talks, club screenings, and basically any event with a good crowd and better snacks.',
    interests: ['careers', 'community', 'culture', 'film', 'running'],
    courses: ['BMGT220', 'STAT400'],
    avatarUrl: avatarUrl('tyler_bennett'),
  },
];

const CLUB_BLUEPRINTS = [
  {
    key: 'hackers',
    name: 'UMD Hackers',
    slug: 'umd-hackers',
    category: 'academic',
    tags: ['coding', 'hackathons', 'builders', 'workshops'],
    shortDescription: 'Hack nights, Bitcamp energy, and the most active builder community on campus.',
    description:
      'UMD Hackers brings together students who love shipping projects, learning in public, and helping each other build. Weekly hack nights, mentor office hours, and collaborative sprint energy make this one of the easiest communities on campus to plug into quickly.',
    meetingSchedule: 'Wednesdays, 7:00 PM - 9:00 PM, IRB 0324',
    locationShort: 'IRB',
    contactEmail: 'hello@umdhackers.org',
    socialLinks: {
      instagram: 'https://instagram.com/umdhackers',
      discord: 'https://discord.gg/umdhackers',
      website: 'https://umdhackers.org',
    },
    president: 'daniel',
    officers: ['alex', 'ethan'],
    members: ['nia', 'rahul', 'omar', 'david'],
    logoUrl: logoUrl('UMD Hackers'),
    coverUrl: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=1400&q=80',
    media: [
      {
        url: 'https://images.unsplash.com/photo-1516321497487-e288fb19713f?auto=format&fit=crop&w=900&q=80',
        caption: 'Mentor tables filling up during hack night.',
        createdBy: 'daniel',
        daysAgo: 11,
      },
      {
        url: 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=900&q=80',
        caption: 'Teams sprinting through a product review circle.',
        createdBy: 'alex',
        daysAgo: 4,
      },
    ],
  },
  {
    key: 'data-science',
    name: 'Data Science Club',
    slug: 'data-science-club',
    category: 'academic',
    tags: ['analytics', 'python', 'career', 'study'],
    shortDescription: 'Project demos, resume clinics, and a very friendly place to get unstuck in Python or SQL.',
    description:
      'Data Science Club is where students go to sharpen analytical skills with real campus-sized support. Members swap resume feedback, run collaborative workshops, and share practical project ideas that feel relevant to recruiting season.',
    meetingSchedule: 'Tuesdays, 6:30 PM - 8:00 PM, MCK 6137',
    locationShort: 'MCK',
    contactEmail: 'datascience@terpmail.umd.edu',
    socialLinks: {
      instagram: 'https://instagram.com/umddatascience',
      website: 'https://umddatascience.club',
    },
    president: 'ethan',
    officers: ['sana'],
    members: ['alex', 'daniel', 'priya', 'rahul', 'grace', 'david'],
    logoUrl: logoUrl('Data Science Club'),
    coverUrl: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=1400&q=80',
    media: [
      {
        url: 'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?auto=format&fit=crop&w=900&q=80',
        caption: 'SQL workshop whiteboards after a very productive chaos hour.',
        createdBy: 'ethan',
        daysAgo: 9,
      },
      {
        url: 'https://images.unsplash.com/photo-1516321310764-8d3c1f6773ce?auto=format&fit=crop&w=900&q=80',
        caption: 'Resume clinic tables at McKeldin before the analytics fair.',
        createdBy: 'sana',
        daysAgo: 3,
      },
    ],
  },
  {
    key: 'entrepreneurs',
    name: 'Terp Entrepreneurs',
    slug: 'terp-entrepreneurs',
    category: 'professional',
    tags: ['startups', 'careers', 'networking', 'founders'],
    shortDescription: 'Pitch practice, founder stories, and a genuinely supportive room for trying ideas out loud.',
    description:
      'Terp Entrepreneurs is a home for students building side projects, testing startup ideas, and learning from founders a few steps ahead. Meetings mix practical feedback with honest conversation about what it takes to actually launch something.',
    meetingSchedule: 'Thursdays, 7:00 PM - 8:30 PM, VMH 1208',
    locationShort: 'VMH',
    contactEmail: 'hello@terpentrepreneurs.org',
    socialLinks: {
      instagram: 'https://instagram.com/terpentrepreneurs',
      linkedin: 'https://linkedin.com/company/terpentrepreneurs',
      website: 'https://terpentrepreneurs.org',
    },
    president: 'grace',
    officers: ['alex', 'leena'],
    members: ['nia', 'omar', 'sofia', 'tyler'],
    logoUrl: logoUrl('Terp Entrepreneurs'),
    coverUrl: 'https://images.unsplash.com/photo-1552664730-d307ca884978?auto=format&fit=crop&w=1400&q=80',
    media: [
      {
        url: 'https://images.unsplash.com/photo-1521737604893-d14cc237f11d?auto=format&fit=crop&w=900&q=80',
        caption: 'Founder roundtable with alumni who stayed late to answer questions.',
        createdBy: 'grace',
        daysAgo: 12,
      },
      {
        url: 'https://images.unsplash.com/photo-1516321165247-4aa89a48be28?auto=format&fit=crop&w=900&q=80',
        caption: 'Pitch practice notes spread across the VMH lobby tables.',
        createdBy: 'leena',
        daysAgo: 5,
      },
    ],
  },
  {
    key: 'running',
    name: 'Maryland Running Club',
    slug: 'maryland-running-club',
    category: 'sports',
    tags: ['running', 'fitness', 'community', 'wellness'],
    shortDescription: 'Low-pressure group runs, race prep, and the nicest accountability system on campus.',
    description:
      'Maryland Running Club welcomes every pace. The club mixes evening campus loops, training blocks for upcoming races, and social coffee hangs that make it easier to keep showing up week after week.',
    meetingSchedule: 'Mondays & Thursdays, 6:00 PM, ERC Front Steps',
    locationShort: 'ERC',
    contactEmail: 'runterps@terpmail.umd.edu',
    socialLinks: {
      instagram: 'https://instagram.com/marylandrunningclub',
    },
    president: 'aaliyah',
    officers: ['marcus', 'hannah'],
    members: ['priya', 'jordan', 'tyler'],
    logoUrl: logoUrl('Maryland Running Club'),
    coverUrl: 'https://images.unsplash.com/photo-1552674605-db6ffd4facb5?auto=format&fit=crop&w=1400&q=80',
    media: [
      {
        url: 'https://images.unsplash.com/photo-1473448912268-2022ce9509d8?auto=format&fit=crop&w=900&q=80',
        caption: 'Sunset loop around campus before stretching on the Mall.',
        createdBy: 'aaliyah',
        daysAgo: 8,
      },
      {
        url: 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?auto=format&fit=crop&w=900&q=80',
        caption: 'Long-run crew meeting at Eppley before heading out.',
        createdBy: 'marcus',
        daysAgo: 2,
      },
    ],
  },
  {
    key: 'bhangra',
    name: 'Bhangra at UMD',
    slug: 'bhangra-at-umd',
    category: 'arts',
    tags: ['dance', 'culture', 'performance', 'community'],
    shortDescription: 'Rehearsals that go hard, showcase energy, and a team culture people rave about.',
    description:
      'Bhangra at UMD blends high-energy rehearsal nights with the kind of team atmosphere that keeps people coming back. Performances, campus showcases, and beginner-friendly open practices make it feel welcoming without losing ambition.',
    meetingSchedule: 'Sundays, 7:30 PM - 9:30 PM, The Clarice Rehearsal Room',
    locationShort: 'CLAR',
    contactEmail: 'bhangra@terpmail.umd.edu',
    socialLinks: {
      instagram: 'https://instagram.com/bhangraatumd',
    },
    president: 'sana',
    officers: ['leena'],
    members: ['priya', 'maya', 'hannah', 'chloe', 'rahul'],
    logoUrl: logoUrl('Bhangra at UMD'),
    coverUrl: 'https://images.unsplash.com/photo-1516280440614-37939bbacd81?auto=format&fit=crop&w=1400&q=80',
    media: [
      {
        url: 'https://images.unsplash.com/photo-1508804185872-d7badad00f7d?auto=format&fit=crop&w=900&q=80',
        caption: 'Final run-through before spring showcase.',
        createdBy: 'sana',
        daysAgo: 10,
      },
      {
        url: 'https://images.unsplash.com/photo-1501386761578-eac5c94b800a?auto=format&fit=crop&w=900&q=80',
        caption: 'Team huddle right before a Clarice performance slot.',
        createdBy: 'leena',
        daysAgo: 1,
      },
    ],
  },
  {
    key: 'swe',
    name: 'Society of Women Engineers',
    slug: 'society-of-women-engineers',
    category: 'professional',
    tags: ['careers', 'engineering', 'mentorship', 'community'],
    shortDescription: 'Professional development with a warm, practical, everyone-helps-each-other vibe.',
    description:
      'SWE at Maryland creates space for women and allies in engineering to share advice, build confidence, and make recruiting feel less isolating. Panels, peer prep, and mentorship dinners keep the club active through the semester.',
    meetingSchedule: 'Tuesdays, 7:00 PM - 8:30 PM, ESJ 2204',
    locationShort: 'ESJ',
    contactEmail: 'swe@terpmail.umd.edu',
    socialLinks: {
      instagram: 'https://instagram.com/umdswe',
      website: 'https://swe.umd.edu',
    },
    president: 'priya',
    officers: ['nia'],
    members: ['maya', 'grace', 'aaliyah'],
    logoUrl: logoUrl('Society of Women Engineers'),
    coverUrl: 'https://images.unsplash.com/photo-1521737711867-e3b97375f902?auto=format&fit=crop&w=1400&q=80',
    media: [
      {
        url: 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=900&q=80',
        caption: 'Internship prep circle with alumni advice that was actually useful.',
        createdBy: 'priya',
        daysAgo: 7,
      },
      {
        url: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=900&q=80',
        caption: 'Engineering meet-and-greet before the panel began.',
        createdBy: 'nia',
        daysAgo: 4,
      },
    ],
  },
  {
    key: 'outdoors',
    name: 'Maryland Outdoors Club',
    slug: 'maryland-outdoors-club',
    category: 'social',
    tags: ['outdoors', 'community', 'travel', 'weekends'],
    shortDescription: 'Trips, hikes, gear nights, and a reliable reason to leave your laptop behind for a few hours.',
    description:
      'Maryland Outdoors Club makes adventure feel accessible, even if you have never done a trip before. Planning sessions are straightforward, leaders are calm and organized, and the community tends to pull new people in quickly.',
    meetingSchedule: 'Mondays, 8:00 PM, HBK 1102',
    locationShort: 'HBK',
    contactEmail: 'outdoors@terpmail.umd.edu',
    socialLinks: {
      instagram: 'https://instagram.com/marylandoutdoorsclub',
      discord: 'https://discord.gg/marylandoutdoors',
    },
    president: 'jordan',
    officers: ['hannah'],
    members: ['alex', 'marcus', 'aaron'],
    logoUrl: logoUrl('Maryland Outdoors Club'),
    coverUrl: 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1400&q=80',
    media: [
      {
        url: 'https://images.unsplash.com/photo-1473448912268-2022ce9509d8?auto=format&fit=crop&w=900&q=80',
        caption: 'Trail day photo dump from a Shenandoah weekend.',
        createdBy: 'jordan',
        daysAgo: 13,
      },
      {
        url: 'https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?auto=format&fit=crop&w=900&q=80',
        caption: 'Gear check night before the next trip briefing.',
        createdBy: 'hannah',
        daysAgo: 6,
      },
    ],
  },
  {
    key: 'ksa',
    name: 'Korean Student Association',
    slug: 'korean-student-association',
    category: 'cultural',
    tags: ['culture', 'community', 'social', 'food'],
    shortDescription: 'Language exchange nights, food events, and one of the easiest communities to feel at home in.',
    description:
      'KSA builds community through cultural programs, relaxed socials, and events that bring people together across majors and friend groups. The club balances big showcase moments with low-key community nights that still draw a strong crowd.',
    meetingSchedule: 'Fridays, 7:00 PM, Stamp Colony Ballroom',
    locationShort: 'STAMP',
    contactEmail: 'ksa@terpmail.umd.edu',
    socialLinks: {
      instagram: 'https://instagram.com/umdksa',
    },
    president: 'hannah',
    officers: ['daniel'],
    members: ['marcus', 'chloe', 'sana', 'tyler'],
    logoUrl: logoUrl('Korean Student Association'),
    coverUrl: 'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?auto=format&fit=crop&w=1400&q=80',
    media: [
      {
        url: 'https://images.unsplash.com/photo-1517457373958-b7bdd4587205?auto=format&fit=crop&w=900&q=80',
        caption: 'Language exchange circles taking over a Stamp lounge corner.',
        createdBy: 'hannah',
        daysAgo: 9,
      },
      {
        url: 'https://images.unsplash.com/photo-1526318472351-c75fcf070305?auto=format&fit=crop&w=900&q=80',
        caption: 'Crowd photo from a food social that stayed packed all night.',
        createdBy: 'daniel',
        daysAgo: 2,
      },
    ],
  },
  {
    key: 'creative-coding',
    name: 'Creative Coding Collective',
    slug: 'creative-coding-collective',
    category: 'arts',
    tags: ['creative-tech', 'design', 'code', 'arts'],
    shortDescription: 'Screens, sketches, installations, and late-night experiments that somehow become real projects.',
    description:
      'Creative Coding Collective sits at the intersection of art, code, and playful experimentation. Meetings feel like a studio session more than a lecture, which makes it a great landing spot for people who want to make expressive work together.',
    meetingSchedule: 'Wednesdays, 6:30 PM - 8:30 PM, Clarice Makers Studio',
    locationShort: 'CLAR',
    contactEmail: 'creativecoding@terpmail.umd.edu',
    socialLinks: {
      instagram: 'https://instagram.com/creativecodingumd',
    },
    president: 'chloe',
    officers: ['omar'],
    members: ['nia', 'ethan', 'sofia', 'aaron'],
    logoUrl: logoUrl('Creative Coding Collective'),
    coverUrl: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?auto=format&fit=crop&w=1400&q=80',
    media: [
      {
        url: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=900&q=80',
        caption: 'Projection tests for gallery night.',
        createdBy: 'chloe',
        daysAgo: 8,
      },
      {
        url: 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=900&q=80',
        caption: 'Laptops, sketches, and a lot of excited debugging.',
        createdBy: 'omar',
        daysAgo: 3,
      },
    ],
  },
  {
    key: 'terps-for-change',
    name: 'Terps for Change',
    slug: 'terps-for-change',
    category: 'service',
    tags: ['service', 'community', 'volunteering', 'impact'],
    shortDescription: 'Service projects that are actually organized well and easy to join, even mid-semester.',
    description:
      'Terps for Change focuses on practical service work with enough structure to make busy schedules manageable. Members rotate through kit-packing nights, campus drives, and local partner events that feel immediate and tangible.',
    meetingSchedule: 'Thursdays, 6:00 PM, Stamp Student Involvement Suite',
    locationShort: 'STAMP',
    contactEmail: 'terpsforchange@terpmail.umd.edu',
    socialLinks: {
      instagram: 'https://instagram.com/terpsforchange',
    },
    president: 'maya',
    officers: ['aaliyah'],
    members: ['jordan', 'sofia', 'david'],
    logoUrl: logoUrl('Terps for Change'),
    coverUrl: 'https://images.unsplash.com/photo-1469571486292-b53601020f1f?auto=format&fit=crop&w=1400&q=80',
    media: [
      {
        url: 'https://images.unsplash.com/photo-1559027615-cd4628902d4a?auto=format&fit=crop&w=900&q=80',
        caption: 'Care-kit packing tables full and moving fast.',
        createdBy: 'maya',
        daysAgo: 6,
      },
      {
        url: 'https://images.unsplash.com/photo-1532629345422-7515f3d16bb6?auto=format&fit=crop&w=900&q=80',
        caption: 'Volunteer check-in before a community supply drive.',
        createdBy: 'aaliyah',
        daysAgo: 1,
      },
    ],
  },
  {
    key: 'film-society',
    name: 'Film Society at Maryland',
    slug: 'film-society-at-maryland',
    category: 'arts',
    tags: ['film', 'arts', 'community', 'screenings'],
    shortDescription: 'Screenings, critiques, and the kind of post-film conversations that somehow last an extra hour.',
    description:
      'Film Society at Maryland curates campus screenings, director spotlights, and collaborative discussion nights. It is part film club, part creative community, and a consistent source of high-quality event posters.',
    meetingSchedule: 'Thursdays, 8:00 PM, HBK 0101',
    locationShort: 'HBK',
    contactEmail: 'filmsociety@terpmail.umd.edu',
    socialLinks: {
      instagram: 'https://instagram.com/umdfilmsociety',
    },
    president: 'aaron',
    officers: ['sofia'],
    members: ['maya', 'leena', 'omar', 'chloe', 'tyler'],
    logoUrl: logoUrl('Film Society at Maryland'),
    coverUrl: 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=1400&q=80',
    media: [
      {
        url: 'https://images.unsplash.com/photo-1517604931442-7e0c8ed2963c?auto=format&fit=crop&w=900&q=80',
        caption: 'Packed screening night before discussion started.',
        createdBy: 'aaron',
        daysAgo: 10,
      },
      {
        url: 'https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?auto=format&fit=crop&w=900&q=80',
        caption: 'Poster wall from a student shorts showcase.',
        createdBy: 'sofia',
        daysAgo: 4,
      },
    ],
  },
];

const EVENT_BLUEPRINTS = [
  {
    key: 'founder-coffee-chat',
    clubKey: 'entrepreneurs',
    creatorKey: 'grace',
    title: 'Founder Coffee Chat',
    description: 'A small-group conversation with alumni founders on how they built momentum before their first full-time hire.',
    category: 'career',
    locationShort: 'VMH',
    timing: { kind: 'day', dayOffset: -5, hour: 17, minute: 30, durationMinutes: 90 },
    tags: ['startups', 'careers', 'networking'],
    popularity: 'medium',
  },
  {
    key: 'trail-conditioning-run',
    clubKey: 'running',
    creatorKey: 'marcus',
    title: 'Trail Conditioning Run',
    description: 'Hill repeats, relaxed pacing groups, and a cooldown stretch before sunset.',
    category: 'sports',
    locationShort: 'ERC',
    timing: { kind: 'day', dayOffset: -6, hour: 18, minute: 0, durationMinutes: 75 },
    tags: ['running', 'fitness', 'wellness'],
    popularity: 'small',
  },
  {
    key: 'bhangra-open-practice',
    clubKey: 'bhangra',
    creatorKey: 'sana',
    title: 'Bhangra Open Practice',
    description: 'An open rehearsal night for new dancers curious about the team and returning members brushing up before showcase season.',
    category: 'arts',
    locationShort: 'CLAR',
    timing: { kind: 'day', dayOffset: -2, hour: 19, minute: 30, durationMinutes: 120 },
    tags: ['dance', 'culture', 'performance'],
    popularity: 'medium',
  },
  {
    key: 'mutual-aid-packing-night',
    clubKey: 'terps-for-change',
    creatorKey: 'maya',
    title: 'Mutual Aid Packing Night',
    description: 'Packing hygiene kits with a quick volunteer briefing and distribution plan for the weekend.',
    category: 'other',
    locationShort: 'STAMP',
    timing: { kind: 'day', dayOffset: -4, hour: 18, minute: 30, durationMinutes: 105 },
    tags: ['service', 'community', 'impact'],
    popularity: 'small',
  },
  {
    key: 'sql-study-jam',
    clubKey: 'data-science',
    creatorKey: 'ethan',
    title: 'SQL Study Jam',
    description: 'Bring your homework, project ideas, or interview prep questions for a guided work session in McKeldin.',
    category: 'academic',
    locationShort: 'MCK',
    timing: { kind: 'day', dayOffset: -3, hour: 19, minute: 0, durationMinutes: 120 },
    tags: ['data', 'sql', 'study'],
    popularity: 'medium',
  },
  {
    key: 'hack-night-3',
    clubKey: 'hackers',
    creatorKey: 'alex',
    title: 'Hack Night #3',
    description: 'Weekly build sprint with mentors, whiteboards, and enough snacks to keep people around well past nine.',
    category: 'workshop',
    locationShort: 'IRB',
    timing: { kind: 'day', dayOffset: -7, hour: 19, minute: 0, durationMinutes: 150 },
    tags: ['coding', 'builders', 'workshop'],
    popularity: 'popular',
  },
  {
    key: 'hackers-build-lab',
    clubKey: 'hackers',
    creatorKey: 'daniel',
    title: 'Hackers Build Lab',
    description: 'Drop in right now for mentor office hours, quick demos, and a warm room full of people shipping things.',
    category: 'workshop',
    locationShort: 'IRB',
    timing: { kind: 'live', startedMinutesAgo: 45, durationMinutes: 150 },
    tags: ['coding', 'builders', 'mentor'],
    popularity: 'medium',
  },
  {
    key: 'data-office-hours-live',
    clubKey: 'data-science',
    creatorKey: 'sana',
    title: 'Data Science Office Hours',
    description: 'Live help on Python, SQL, and project cleanup before recruiting deadlines hit.',
    category: 'academic',
    locationShort: 'MCK',
    timing: { kind: 'live', startedMinutesAgo: 30, durationMinutes: 120 },
    tags: ['data', 'python', 'study'],
    popularity: 'medium',
  },
  {
    key: 'editing-bay-open-hours',
    clubKey: 'film-society',
    creatorKey: 'aaron',
    title: 'Editing Bay Open Hours',
    description: 'A quiet-but-social work block for anyone cutting a short, polishing audio, or getting feedback on a scene.',
    category: 'arts',
    locationShort: 'STAMP',
    timing: { kind: 'live', startedMinutesAgo: 15, durationMinutes: 120 },
    tags: ['film', 'editing', 'arts'],
    popularity: 'small',
  },
  {
    key: 'hack-night-4',
    clubKey: 'hackers',
    creatorKey: 'alex',
    title: 'Hack Night #4',
    description: 'This week is all about fast iterations: project debugging, mentor checkpoints, pizza, and a sponsor prize drop at the end.',
    category: 'workshop',
    locationShort: 'IRB',
    timing: { kind: 'day', dayOffset: 0, hour: 19, minute: 0, durationMinutes: 150 },
    tags: ['coding', 'builders', 'pizza', 'hackathon'],
    popularity: 'popular',
    featured: true,
  },
  {
    key: 'analytics-resume-clinic',
    clubKey: 'data-science',
    creatorKey: 'ethan',
    title: 'Analytics Resume Clinic',
    description: 'Bring your current resume and get line-by-line feedback from older students who just finished internship recruiting.',
    category: 'career',
    locationShort: 'MCK',
    timing: { kind: 'day', dayOffset: 0, hour: 18, minute: 30, durationMinutes: 90 },
    tags: ['careers', 'resume', 'data'],
    popularity: 'medium',
  },
  {
    key: 'sunset-tempo-run',
    clubKey: 'running',
    creatorKey: 'aaliyah',
    title: 'Sunset Tempo Run',
    description: 'Campus loop with split pace groups and a quick coffee stop after cooldown if people are feeling it.',
    category: 'sports',
    locationShort: 'ERC',
    timing: { kind: 'day', dayOffset: 0, hour: 18, minute: 0, durationMinutes: 75 },
    tags: ['running', 'fitness', 'community'],
    popularity: 'medium',
  },
  {
    key: 'spring-bhangra-mixer',
    clubKey: 'bhangra',
    creatorKey: 'sana',
    title: 'Spring Bhangra Mixer',
    description: 'Open dance circle, intro lesson, and a relaxed social for anyone curious about the team before finals take over.',
    category: 'social',
    locationShort: 'STAMP',
    timing: { kind: 'day', dayOffset: 0, hour: 19, minute: 30, durationMinutes: 120 },
    tags: ['dance', 'culture', 'social'],
    popularity: 'popular',
  },
  {
    key: 'trip-info-session',
    clubKey: 'outdoors',
    creatorKey: 'jordan',
    title: 'Shenandoah Trip Info Session',
    description: 'Packing list walkthrough, route overview, and everything you need to know before committing to the next weekend trip.',
    category: 'other',
    locationShort: 'HBK',
    timing: { kind: 'day', dayOffset: 0, hour: 20, minute: 0, durationMinutes: 75 },
    tags: ['outdoors', 'travel', 'community'],
    popularity: 'small',
  },
  {
    key: 'service-lead-huddle',
    clubKey: 'terps-for-change',
    creatorKey: 'aaliyah',
    title: 'Service Lead Huddle',
    description: 'A compact planning session for volunteers coordinating the next campus supply drive.',
    category: 'other',
    locationShort: 'STAMP',
    timing: { kind: 'day', dayOffset: 0, hour: 17, minute: 30, durationMinutes: 60 },
    tags: ['service', 'leadership', 'community'],
    popularity: 'small',
  },
  {
    key: 'film-shorts-screening',
    clubKey: 'film-society',
    creatorKey: 'sofia',
    title: 'Student Shorts Screening',
    description: 'A curated set of student-made short films followed by a conversation with the directors and cinematographers.',
    category: 'arts',
    locationShort: 'STAMP',
    timing: { kind: 'day', dayOffset: 1, hour: 19, minute: 0, durationMinutes: 120 },
    tags: ['film', 'arts', 'community'],
    popularity: 'popular',
  },
  {
    key: 'street-food-social',
    clubKey: 'ksa',
    creatorKey: 'hannah',
    title: 'Korean Street Food Social',
    description: 'Snacks, icebreakers, and a very easy night to meet people before the semester gets too busy.',
    category: 'social',
    locationShort: 'STAMP',
    timing: { kind: 'day', dayOffset: 1, hour: 18, minute: 30, durationMinutes: 120 },
    tags: ['culture', 'food', 'community'],
    popularity: 'popular',
  },
  {
    key: 'poster-lab',
    clubKey: 'creative-coding',
    creatorKey: 'chloe',
    title: 'Poster Lab + Projection Tests',
    description: 'Bring a sketch or unfinished idea and leave with something that actually looks exhibition-ready.',
    category: 'workshop',
    locationShort: 'CLAR',
    timing: { kind: 'day', dayOffset: 1, hour: 18, minute: 0, durationMinutes: 120 },
    tags: ['design', 'creative-tech', 'arts'],
    popularity: 'small',
  },
  {
    key: 'bitcamp-team-match',
    clubKey: 'hackers',
    creatorKey: 'daniel',
    title: 'Bitcamp Team Match Night',
    description: 'Project idea pitches, rapid intros, and a packed room of people looking for teammates before the next big build weekend.',
    category: 'academic',
    locationShort: 'IRB',
    timing: { kind: 'day', dayOffset: 2, hour: 18, minute: 30, durationMinutes: 150 },
    tags: ['hackathon', 'coding', 'builders', 'community'],
    popularity: 'major',
    featured: true,
  },
  {
    key: 'ds-finals-study-jam',
    clubKey: 'data-science',
    creatorKey: 'sana',
    title: 'Finals Study Jam',
    description: 'Open co-working with office-hour style support and quiet tables reserved for project cleanup.',
    category: 'academic',
    locationShort: 'MCK',
    timing: { kind: 'day', dayOffset: 2, hour: 19, minute: 0, durationMinutes: 150 },
    tags: ['study', 'data', 'community'],
    popularity: 'medium',
  },
  {
    key: 'founder-fireside',
    clubKey: 'entrepreneurs',
    creatorKey: 'grace',
    title: 'Founder Fireside with Maryland Alumni',
    description: 'A candid conversation about building after graduation, early hiring mistakes, and what actually mattered in the first year.',
    category: 'career',
    locationShort: 'VMH',
    timing: { kind: 'day', dayOffset: 3, hour: 18, minute: 30, durationMinutes: 105 },
    tags: ['startups', 'careers', 'networking'],
    popularity: 'popular',
    featured: true,
  },
  {
    key: 'swe-intern-panel',
    clubKey: 'swe',
    creatorKey: 'priya',
    title: 'Engineering Internship Panel',
    description: 'Women in engineering sharing what recruiting looked like for them and what they wish they had known earlier.',
    category: 'career',
    locationShort: 'ESJ',
    timing: { kind: 'day', dayOffset: 3, hour: 19, minute: 0, durationMinutes: 90 },
    tags: ['careers', 'engineering', 'mentorship'],
    popularity: 'medium',
  },
  {
    key: 'showcase-rehearsal',
    clubKey: 'bhangra',
    creatorKey: 'leena',
    title: 'Showcase Rehearsal Night',
    description: 'A focused rehearsal block before next week’s performance, with room for alumni drop-ins and extra run-throughs.',
    category: 'arts',
    locationShort: 'CLAR',
    timing: { kind: 'day', dayOffset: 4, hour: 19, minute: 30, durationMinutes: 150 },
    tags: ['dance', 'performance', 'culture'],
    popularity: 'medium',
  },
  {
    key: 'ship-it-sprint',
    clubKey: 'hackers',
    creatorKey: 'alex',
    title: 'Ship It Sprint',
    description: 'A build-focused night for anyone trying to cross the finish line on a project before demos next week.',
    category: 'workshop',
    locationShort: 'IRB',
    timing: { kind: 'day', dayOffset: 5, hour: 18, minute: 30, durationMinutes: 150 },
    tags: ['coding', 'builders', 'workshop'],
    popularity: 'medium',
  },
  {
    key: 'long-run-saturday',
    clubKey: 'running',
    creatorKey: 'marcus',
    title: 'Saturday Long Run',
    description: 'Longer mileage with a few pace groups and a no-stress option for anyone building up distance.',
    category: 'sports',
    locationShort: 'ERC',
    timing: { kind: 'day', dayOffset: 5, hour: 9, minute: 0, durationMinutes: 105 },
    tags: ['running', 'fitness', 'sports'],
    popularity: 'medium',
  },
  {
    key: 'film-critique-night',
    clubKey: 'film-society',
    creatorKey: 'aaron',
    title: 'Film Critique Night',
    description: 'Bring a scene, a rough cut, or just opinions. Expect thoughtful feedback and at least one passionate debate.',
    category: 'arts',
    locationShort: 'HBK',
    timing: { kind: 'day', dayOffset: 5, hour: 19, minute: 30, durationMinutes: 105 },
    tags: ['film', 'arts', 'critique'],
    popularity: 'small',
  },
  {
    key: 'community-care-kits',
    clubKey: 'terps-for-change',
    creatorKey: 'maya',
    title: 'Community Care Kits',
    description: 'An all-hands volunteer night assembling finals-week care kits with local partner organizations.',
    category: 'other',
    locationShort: 'STAMP',
    timing: { kind: 'day', dayOffset: 6, hour: 18, minute: 0, durationMinutes: 120 },
    tags: ['service', 'community', 'impact'],
    popularity: 'popular',
  },
  {
    key: 'language-exchange-night',
    clubKey: 'ksa',
    creatorKey: 'daniel',
    title: 'Language Exchange Night',
    description: 'Conversation tables, beginner-friendly prompts, and a warm crowd that makes it easy to stay longer than planned.',
    category: 'social',
    locationShort: 'ESJ',
    timing: { kind: 'day', dayOffset: 6, hour: 19, minute: 0, durationMinutes: 90 },
    tags: ['culture', 'community', 'language'],
    popularity: 'medium',
  },
  {
    key: 'prototype-tear-down',
    clubKey: 'creative-coding',
    creatorKey: 'omar',
    title: 'Prototype Tear-Down Night',
    description: 'Bring a rough interactive concept and get direct design and technical feedback in one room.',
    category: 'workshop',
    locationShort: 'CLAR',
    timing: { kind: 'day', dayOffset: 7, hour: 18, minute: 30, durationMinutes: 120 },
    tags: ['design', 'creative-tech', 'builders'],
    popularity: 'small',
  },
  {
    key: 'demo-day-munching',
    clubKey: 'entrepreneurs',
    creatorKey: 'grace',
    title: 'Demo Day at Van Munching',
    description: 'Short product demos, sharp audience questions, and a room full of people cheering for each other to improve fast.',
    category: 'career',
    locationShort: 'VMH',
    timing: { kind: 'day', dayOffset: 8, hour: 18, minute: 0, durationMinutes: 120 },
    tags: ['startups', 'pitch', 'networking'],
    popularity: 'popular',
  },
  {
    key: 'engineers-mentor-dinner',
    clubKey: 'swe',
    creatorKey: 'nia',
    title: 'Women in Engineering Mentor Dinner',
    description: 'Small tables, honest recruiting talk, and a low-pressure space to ask the questions people usually avoid asking in panels.',
    category: 'career',
    locationShort: 'ESJ',
    timing: { kind: 'day', dayOffset: 8, hour: 19, minute: 0, durationMinutes: 105 },
    tags: ['engineering', 'careers', 'mentorship'],
    popularity: 'medium',
  },
  {
    key: 'data-for-social-good',
    clubKey: 'data-science',
    creatorKey: 'ethan',
    title: 'Data for Social Good Workshop',
    description: 'Hands-on workshop using public data sets to explore community-focused problem framing and quick dashboards.',
    category: 'workshop',
    locationShort: 'ESJ',
    timing: { kind: 'day', dayOffset: 9, hour: 18, minute: 30, durationMinutes: 120 },
    tags: ['data', 'service', 'workshop'],
    popularity: 'medium',
  },
  {
    key: 'spring-5k',
    clubKey: 'running',
    creatorKey: 'aaliyah',
    title: 'Spring 5K on the Mall',
    description: 'Community 5K with pace leaders, music, and a finish line that actually feels celebratory.',
    category: 'sports',
    locationShort: 'CFH',
    timing: { kind: 'day', dayOffset: 10, hour: 10, minute: 0, durationMinutes: 120 },
    tags: ['running', 'sports', 'community'],
    popularity: 'major',
  },
  {
    key: 'bhangra-at-the-clarice',
    clubKey: 'bhangra',
    creatorKey: 'sana',
    title: 'Bhangra at The Clarice',
    description: 'Spring showcase night with guest teams, high energy, and a packed audience expected from across campus.',
    category: 'arts',
    locationShort: 'CLAR',
    timing: { kind: 'day', dayOffset: 11, hour: 19, minute: 0, durationMinutes: 150 },
    tags: ['dance', 'performance', 'culture'],
    popularity: 'major',
    featured: true,
  },
  {
    key: 'film-fest-planning',
    clubKey: 'film-society',
    creatorKey: 'sofia',
    title: 'Film Fest Planning Meeting',
    description: 'A practical planning session for the student film fest lineup, volunteers, and promo schedule.',
    category: 'other',
    locationShort: 'STAMP',
    timing: { kind: 'day', dayOffset: 11, hour: 18, minute: 30, durationMinutes: 90 },
    tags: ['film', 'planning', 'community'],
    popularity: 'small',
  },
  {
    key: 'shenandoah-trip-briefing',
    clubKey: 'outdoors',
    creatorKey: 'jordan',
    title: 'Shenandoah Trip Briefing',
    description: 'Final route review, carpool planning, and gear Q&A before the next major weekend trip.',
    category: 'other',
    locationShort: 'HBK',
    timing: { kind: 'day', dayOffset: 12, hour: 19, minute: 0, durationMinutes: 75 },
    tags: ['outdoors', 'travel', 'community'],
    popularity: 'small',
  },
  {
    key: 'founders-brunch',
    clubKey: 'entrepreneurs',
    creatorKey: 'leena',
    title: 'Makers + Founders Brunch',
    description: 'A smaller social designed to help people find collaborators before summer internship plans pull everyone in different directions.',
    category: 'social',
    locationShort: 'STAMP',
    timing: { kind: 'day', dayOffset: 13, hour: 11, minute: 0, durationMinutes: 120 },
    tags: ['startups', 'community', 'networking'],
    popularity: 'medium',
  },
  {
    key: 'gallery-night',
    clubKey: 'creative-coding',
    creatorKey: 'chloe',
    title: 'Creative Coding Gallery Night',
    description: 'Projection pieces, interactive sketches, and a showcase that feels equal parts studio critique and celebration.',
    category: 'arts',
    locationShort: 'CLAR',
    timing: { kind: 'day', dayOffset: 14, hour: 18, minute: 30, durationMinutes: 150 },
    tags: ['arts', 'design', 'creative-tech'],
    popularity: 'medium',
  },
];

const POST_BLUEPRINTS = [
  {
    key: 'alex-hack-night',
    authorKey: 'alex',
    clubKey: 'hackers',
    title: 'Hack Night #4 this week',
    body: 'We are back in IRB with mentor tables, pizza, and a sponsor challenge at the end. Bring a half-baked idea or just show up and find a team.',
    isPinned: true,
    type: 'club_announcement',
    createdAt: { kind: 'hoursAgo', value: 7 },
    mediaUrls: [],
    targetLikes: 16,
  },
  {
    key: 'grace-founder-fireside',
    authorKey: 'grace',
    clubKey: 'entrepreneurs',
    title: 'Founder Fireside is almost here',
    body: 'If you have ever wanted to hear the honest version of startup life, come through on Thursday. Alumni are staying after for small-group Q&A.',
    isPinned: true,
    type: 'club_announcement',
    createdAt: { kind: 'daysAgo', dayOffset: 1, hour: 10, minute: 15 },
    mediaUrls: [],
    targetLikes: 14,
  },
  {
    key: 'maya-care-kits',
    authorKey: 'maya',
    clubKey: 'terps-for-change',
    title: 'Care kit volunteers needed',
    body: 'We are packing finals-week care kits this Sunday in Stamp. Easy way to help for an hour between study blocks.',
    isPinned: true,
    type: 'club_announcement',
    createdAt: { kind: 'daysAgo', dayOffset: 2, hour: 14, minute: 20 },
    mediaUrls: [],
    targetLikes: 11,
  },
  {
    key: 'priya-study-jam',
    authorKey: 'priya',
    clubKey: null,
    content: 'Study Jam at McKeldin was exactly what I needed before this analytics project deadline. Shoutout to Data Science Club for making it feel way less chaotic.',
    isPinned: false,
    type: 'text',
    createdAt: { kind: 'daysAgo', dayOffset: 3, hour: 21, minute: 5 },
    mediaUrls: [],
    targetLikes: 13,
  },
  {
    key: 'sofia-sunset',
    authorKey: 'sofia',
    clubKey: null,
    content: 'The sunset over McKeldin Mall tonight was unreal. Campus looked cinematic for like fifteen straight minutes.',
    isPinned: false,
    type: 'image',
    createdAt: { kind: 'daysAgo', dayOffset: 1, hour: 20, minute: 10 },
    mediaUrls: ['https://images.unsplash.com/photo-1541339907198-e08756dedf3f?auto=format&fit=crop&w=1200&q=80'],
    targetLikes: 18,
  },
  {
    key: 'daniel-team-match',
    authorKey: 'daniel',
    clubKey: 'hackers',
    content: 'Bitcamp Team Match Night is in two days. If you have an idea but no team, that is literally what the room is for.',
    isPinned: false,
    type: 'club_update',
    createdAt: { kind: 'daysAgo', dayOffset: 2, hour: 12, minute: 5 },
    mediaUrls: [],
    targetLikes: 15,
  },
  {
    key: 'jordan-trip',
    authorKey: 'jordan',
    clubKey: 'outdoors',
    content: 'Maryland Outdoors is planning our next Shenandoah weekend and the trip briefing is up. Join if you want in before seats disappear.',
    isPinned: false,
    type: 'club_update',
    createdAt: { kind: 'daysAgo', dayOffset: 4, hour: 18, minute: 40 },
    mediaUrls: ['https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1200&q=80'],
    targetLikes: 12,
  },
  {
    key: 'chloe-gallery',
    authorKey: 'chloe',
    clubKey: 'creative-coding',
    content: 'Creative Coding Collective gallery night is getting dangerously cool. Projection tests looked incredible tonight.',
    isPinned: false,
    type: 'club_update',
    createdAt: { kind: 'daysAgo', dayOffset: 5, hour: 22, minute: 10 },
    mediaUrls: ['https://images.unsplash.com/photo-1517694712202-14dd9538aa97?auto=format&fit=crop&w=1200&q=80'],
    targetLikes: 10,
  },
  {
    key: 'marcus-hill-reps',
    authorKey: 'marcus',
    clubKey: null,
    content: 'If you saw a group of us absolutely fighting for our lives near Eppley, that was running club hill reps and yes, they were brutal.',
    isPinned: false,
    type: 'text',
    createdAt: { kind: 'daysAgo', dayOffset: 6, hour: 20, minute: 25 },
    mediaUrls: [],
    targetLikes: 8,
  },
  {
    key: 'hannah-ksa-social',
    authorKey: 'hannah',
    clubKey: 'ksa',
    content: 'Street food social tomorrow at Stamp. No pressure, just come hungry and bring a friend if you want.',
    isPinned: false,
    type: 'club_update',
    createdAt: { kind: 'daysAgo', dayOffset: 1, hour: 11, minute: 45 },
    mediaUrls: [],
    targetLikes: 12,
  },
  {
    key: 'tyler-elms',
    authorKey: 'tyler',
    clubKey: null,
    content: "Anyone else's ELMS acting up right now or is it just choosing violence against me specifically?",
    isPinned: false,
    type: 'text',
    createdAt: { kind: 'hoursAgo', value: 5 },
    mediaUrls: [],
    targetLikes: 9,
  },
  {
    key: 'nia-esj',
    authorKey: 'nia',
    clubKey: null,
    content: 'ESJ has quietly become my favorite place to work when McKeldin feels too loud. The lighting just works.',
    isPinned: false,
    type: 'text',
    createdAt: { kind: 'daysAgo', dayOffset: 8, hour: 15, minute: 20 },
    mediaUrls: [],
    targetLikes: 7,
  },
  {
    key: 'ethan-resume-clinic',
    authorKey: 'ethan',
    clubKey: 'data-science',
    content: 'Resume clinic + SQL help tomorrow at McKeldin. Bring your laptop and something specific you want feedback on.',
    isPinned: false,
    type: 'club_update',
    createdAt: { kind: 'daysAgo', dayOffset: 2, hour: 9, minute: 15 },
    mediaUrls: [],
    targetLikes: 13,
  },
  {
    key: 'aaron-screening',
    authorKey: 'aaron',
    clubKey: 'film-society',
    content: 'Student Shorts Screening tomorrow night. We have a really strong lineup and the directors are staying for the discussion after.',
    isPinned: false,
    type: 'club_update',
    createdAt: { kind: 'daysAgo', dayOffset: 1, hour: 13, minute: 0 },
    mediaUrls: ['https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=1200&q=80'],
    targetLikes: 11,
  },
  {
    key: 'sana-showcase',
    authorKey: 'sana',
    clubKey: 'bhangra',
    content: 'Our Clarice showcase is finally coming together and rehearsal energy tonight was the exact reset I needed.',
    isPinned: false,
    type: 'club_update',
    createdAt: { kind: 'daysAgo', dayOffset: 3, hour: 22, minute: 30 },
    mediaUrls: [],
    targetLikes: 14,
  },
  {
    key: 'alex-campus-day',
    authorKey: 'alex',
    clubKey: null,
    content: 'Today somehow included a mentor meeting in Iribe, coffee in Stamp, and accidentally staying at McKeldin until dark. Very xUMD-coded day.',
    isPinned: false,
    type: 'text',
    createdAt: { kind: 'daysAgo', dayOffset: 4, hour: 21, minute: 45 },
    mediaUrls: [],
    targetLikes: 10,
  },
  {
    key: 'leena-brunch',
    authorKey: 'leena',
    clubKey: 'entrepreneurs',
    content: 'Makers + Founders Brunch is going to be low-key but very useful. If you want collaborators, come early and actually talk to people.',
    isPinned: false,
    type: 'club_update',
    createdAt: { kind: 'daysAgo', dayOffset: 5, hour: 12, minute: 30 },
    mediaUrls: [],
    targetLikes: 9,
  },
  {
    key: 'david-service',
    authorKey: 'david',
    clubKey: null,
    content: 'Service night reminder: it always feels worth showing up, even when you only have one hour to spare.',
    isPinned: false,
    type: 'text',
    createdAt: { kind: 'daysAgo', dayOffset: 9, hour: 19, minute: 10 },
    mediaUrls: [],
    targetLikes: 6,
  },
];

const COMMENT_BLUEPRINTS = {
  'alex-hack-night': [
    { authorKey: 'ethan', content: 'We have extra mentor coverage this week too, so bring whatever bug has been blocking you.' },
    {
      authorKey: 'nia',
      content: 'Can confirm the pizza lineup is better than usual.',
      replies: [{ authorKey: 'alex', content: 'I fought for that line item in the budget and I stand by it.' }],
    },
  ],
  'grace-founder-fireside': [
    { authorKey: 'leena', content: 'Please come ready with real questions. The alumni asked for the honest version, not the polished one.' },
    { authorKey: 'tyler', content: 'This is the first founder event I have actually cleared my calendar for all semester.' },
  ],
  'maya-care-kits': [
    { authorKey: 'aaliyah', content: 'We can always use another set of hands during the first hour.' },
    {
      authorKey: 'sofia',
      content: 'I will bring tape and markers again.',
      replies: [{ authorKey: 'maya', content: 'Perfect. Poster station is yours if you want it.' }],
    },
  ],
  'priya-study-jam': [
    { authorKey: 'ethan', content: 'Glad it helped. McKeldin on study-jam nights has such good focus energy.' },
    { authorKey: 'sana', content: 'You locked in for that whole last hour. Respect.' },
  ],
  'sofia-sunset': [
    { authorKey: 'alex', content: 'This campus really knows when to randomly look its best.' },
    {
      authorKey: 'priya',
      content: 'Please send me the original because this deserves to be wallpaper status.',
      replies: [{ authorKey: 'sofia', content: 'On it. I have a couple more from five minutes later too.' }],
    },
    { authorKey: 'aaron', content: 'The color grade on this is ridiculous.' },
  ],
  'jordan-trip': [
    { authorKey: 'aaron', content: 'I am in if somebody reminds me about gear pickup.' },
    { authorKey: 'alex', content: 'Same. Need a definitive shoe answer before I commit.' },
  ],
  'tyler-elms': [
    { authorKey: 'alex', content: 'ELMS saw your syllabus and chose chaos.' },
    { authorKey: 'maya', content: 'Not just you. I got booted out twice this afternoon.' },
    { authorKey: 'grace', content: 'This app picks the worst possible times to fall apart.' },
  ],
  'ethan-resume-clinic': [
    { authorKey: 'priya', content: 'Bringing mine. It needs help and I have accepted that.' },
    {
      authorKey: 'alex',
      content: 'Can people bring product resumes too or strictly analytics?',
      replies: [{ authorKey: 'ethan', content: 'Bring it. We can still tighten the story and bullets.' }],
    },
  ],
  'aaron-screening': [
    { authorKey: 'sofia', content: 'The lineup is actually so strong. There is a documentary short in there I cannot stop thinking about.' },
    { authorKey: 'chloe', content: 'Saving a seat near the front for the discussion after.' },
  ],
  'sana-showcase': [
    { authorKey: 'leena', content: 'Tonight felt sharp. The transitions finally clicked.' },
    {
      authorKey: 'priya',
      content: 'Proud of this team every single time.',
      replies: [{ authorKey: 'sana', content: 'Okay now I am emotional again.' }],
    },
  ],
  'alex-campus-day': [
    { authorKey: 'nia', content: 'This is basically the whole promise of the app in one post.' },
    { authorKey: 'daniel', content: 'If you did not end the day at McKeldin, was it even a real campus day?' },
  ],
  'david-service': [
    { authorKey: 'maya', content: 'Exactly. Consistency matters more than people think.' },
    { authorKey: 'aaliyah', content: 'Small volunteer shifts keep the whole thing moving.' },
  ],
};

const TEST_ACCOUNT_GOING_EVENT_KEYS = ['hackers-build-lab', 'hack-night-4', 'film-shorts-screening', 'founder-fireside', 'community-care-kits', 'demo-day-munching'];
const TEST_ACCOUNT_INTERESTED_EVENT_KEYS = ['trip-info-session', 'bhangra-at-the-clarice', 'gallery-night'];

function timingToRange(timing) {
  if (timing.kind === 'live') {
    const start = addMinutes(new Date(), -timing.startedMinutesAgo);
    const end = addMinutes(start, timing.durationMinutes);
    return { start, end };
  }

  const start = localDayDate(timing.dayOffset, timing.hour, timing.minute);
  return { start, end: addMinutes(start, timing.durationMinutes) };
}

function activityToDate(activity) {
  if (activity.kind === 'hoursAgo') {
    return addHours(new Date(), -activity.value);
  }
  return localDayDate(-activity.dayOffset, activity.hour, activity.minute);
}

function membershipEntriesForClub(club) {
  return [
    { userKey: club.president, role: 'president' },
    ...club.officers.map((userKey) => ({ userKey, role: 'officer' })),
    ...club.members.map((userKey) => ({ userKey, role: 'member' })),
  ];
}

function getAllClubMembers(club) {
  return membershipEntriesForClub(club).map((entry) => entry.userKey);
}

async function main() {
  if (!SUPABASE_URL && !VALIDATE_ONLY && !LOCAL_ONLY) {
    throw new Error('Missing SUPABASE_URL or EXPO_PUBLIC_SUPABASE_URL. Add your project URL before reseeding.');
  }

  const blueprintSummary = validateBlueprints();
  console.log(`Prepared ${blueprintSummary.userCount} users, ${blueprintSummary.clubCount} clubs, ${blueprintSummary.eventCount} events, and ${blueprintSummary.postCount} posts.`);

  if (VALIDATE_ONLY) {
    const dataset = buildDataset({
      authUsersByKey: new Map(USER_BLUEPRINTS.map((user) => [user.key, { id: stableUuid('auth', user.key) }])),
      locationsByShortName: new Map(Object.entries(FALLBACK_LOCATIONS).map(([shortName, location]) => [shortName, { ...location, id: stableUuid('location', shortName) }])),
      coursesByCode: buildValidationCourses(),
    });
    validateDataset(dataset);
    console.log('Blueprint and dataset validation completed. No remote changes were made because --validate-only was used.');
    return;
  }

  if (LOCAL_ONLY) {
    const dataset = buildDataset({
      authUsersByKey: new Map(USER_BLUEPRINTS.map((user) => [user.key, { id: stableUuid('auth', user.key) }])),
      locationsByShortName: new Map(Object.entries(FALLBACK_LOCATIONS).map(([shortName, location]) => [shortName, { ...location, id: stableUuid('location', shortName) }])),
      coursesByCode: buildValidationCourses(),
    });
    validateDataset(dataset);
    writeLocalMockFiles(dataset);
    console.log('Wrote consistent local mock data with --local-only. No remote tables were modified.');
    printCompletionSummary(dataset);
    return;
  }

  if (!SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error('Missing SUPABASE_SERVICE_ROLE_KEY. The script is ready, but an admin key is required to create auth users, wipe the app data tables, and reseed Supabase.');
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  const authUsersByKey = await ensureAuthUsers(supabase);
  const referenceData = await loadReferenceData(supabase);
  const dataset = buildDataset({
    authUsersByKey,
    locationsByShortName: referenceData.locationsByShortName,
    coursesByCode: referenceData.coursesByCode,
  });

  validateDataset(dataset);
  await wipeExistingData(supabase);
  await seedAllData(supabase, dataset);
  await validateRemoteState(supabase, dataset);
  writeLocalMockFiles(dataset);
  printCompletionSummary(dataset);
}

function validateBlueprints() {
  const usersByKey = new Map(USER_BLUEPRINTS.map((user) => [user.key, user]));
  const membershipCountByUser = new Map(USER_BLUEPRINTS.map((user) => [user.key, 0]));

  for (const club of CLUB_BLUEPRINTS) {
    if (!usersByKey.has(club.president)) {
      throw new Error(`Unknown president "${club.president}" for club "${club.name}".`);
    }

    if (club.officers.length < 1 || club.officers.length > 2) {
      throw new Error(`Club "${club.name}" must have 1-2 officers.`);
    }

    const memberKeys = getAllClubMembers(club);
    if (memberKeys.length < 5 || memberKeys.length > 10) {
      throw new Error(`Club "${club.name}" must have 5-10 approved members.`);
    }

    if (new Set(memberKeys).size !== memberKeys.length) {
      throw new Error(`Club "${club.name}" has duplicate membership entries.`);
    }

    for (const key of memberKeys) {
      if (!usersByKey.has(key)) {
        throw new Error(`Club "${club.name}" references unknown user "${key}".`);
      }
      membershipCountByUser.set(key, (membershipCountByUser.get(key) ?? 0) + 1);
    }
  }

  for (const user of USER_BLUEPRINTS) {
    const membershipCount = membershipCountByUser.get(user.key) ?? 0;
    if (membershipCount < 2 || membershipCount > 4) {
      throw new Error(`${user.displayName} must belong to 2-4 clubs, but is assigned ${membershipCount}.`);
    }
  }

  const testUser = USER_BLUEPRINTS.find((user) => user.isTestAccount);
  if (!testUser) {
    throw new Error('A single test account is required.');
  }

  const testClubCount = membershipCountByUser.get(testUser.key) ?? 0;
  if (testClubCount < 3 || testClubCount > 4) {
    throw new Error('The test account must belong to 3-4 clubs.');
  }

  const officerClubCount = CLUB_BLUEPRINTS.filter(
    (club) => club.president === testUser.key || club.officers.includes(testUser.key),
  ).length;
  if (officerClubCount < 1) {
    throw new Error('The test account must be an officer or president in at least one club.');
  }

  if (EVENT_BLUEPRINTS.length < 30 || EVENT_BLUEPRINTS.length > 40) {
    throw new Error('The event blueprint must contain 30-40 events.');
  }

  if (POST_BLUEPRINTS.length < 15 || POST_BLUEPRINTS.length > 20) {
    throw new Error('The post blueprint must contain 15-20 posts.');
  }

  return {
    userCount: USER_BLUEPRINTS.length,
    clubCount: CLUB_BLUEPRINTS.length,
    eventCount: EVENT_BLUEPRINTS.length,
    postCount: POST_BLUEPRINTS.length,
  };
}

async function ensureAuthUsers(supabase) {
  const existingUsersByEmail = await listAllAuthUsersByEmail(supabase);
  const authUsersByKey = new Map();

  for (const blueprint of USER_BLUEPRINTS) {
    const email = blueprint.email.toLowerCase();
    const existing = existingUsersByEmail.get(email);
    const metadata = {
      display_name: blueprint.displayName,
      username: blueprint.username,
      major: blueprint.major,
      graduation_year: blueprint.graduationYear,
      degree_type: blueprint.degreeType,
      minor: blueprint.minor,
      bio: blueprint.bio,
      pronouns: blueprint.pronouns,
      avatar_url: blueprint.avatarUrl,
    };

    if (existing) {
      const { data, error } = await supabase.auth.admin.updateUserById(existing.id, {
        password: DEFAULT_TEST_PASSWORD,
        email_confirm: true,
        user_metadata: metadata,
      });
      if (error) {
        throw new Error(`Unable to update auth user ${email}: ${error.message}`);
      }
      authUsersByKey.set(blueprint.key, data.user);
      continue;
    }

    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password: DEFAULT_TEST_PASSWORD,
      email_confirm: true,
      user_metadata: metadata,
    });
    if (error || !data.user) {
      throw new Error(`Unable to create auth user ${email}: ${error?.message ?? 'Unknown error'}`);
    }
    authUsersByKey.set(blueprint.key, data.user);
  }

  return authUsersByKey;
}

async function listAllAuthUsersByEmail(supabase) {
  const byEmail = new Map();
  let page = 1;

  while (true) {
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage: 200 });
    if (error) {
      throw new Error(`Unable to list auth users: ${error.message}`);
    }

    const users = data?.users ?? [];
    for (const user of users) {
      if (user.email) {
        byEmail.set(user.email.toLowerCase(), user);
      }
    }

    if (users.length < 200) {
      break;
    }
    page += 1;
  }

  return byEmail;
}

async function loadReferenceData(supabase) {
  const [{ data: locations, error: locationsError }, { data: courses, error: coursesError }] = await Promise.all([
    supabase.from('campus_locations').select('id, name, short_name, latitude, longitude'),
    supabase.from('courses').select('id, course_code, section, title, semester, meeting_days, start_time, end_time, building_name, room_number'),
  ]);

  if (locationsError) {
    throw new Error(`Unable to load campus_locations: ${locationsError.message}`);
  }
  if (coursesError) {
    throw new Error(`Unable to load courses: ${coursesError.message}`);
  }

  return {
    locationsByShortName: new Map((locations ?? []).map((location) => [location.short_name, location])),
    coursesByCode: new Map(uniqueBy(courses ?? [], (course) => course.course_code).map((course) => [course.course_code, course])),
  };
}

function buildValidationCourses() {
  const codes = unique(USER_BLUEPRINTS.flatMap((user) => user.courses));
  return new Map(
    codes.map((code, index) => [
      code,
      {
        id: stableUuid('course', code),
        course_code: code,
        section: `0${String((index % 3) + 1)}01`,
        semester: 'Spring 2026',
        meeting_days: ['Mo', 'We'],
        start_time: '10:00:00',
        end_time: '11:15:00',
        building_name: 'Brendan Iribe Center',
        room_number: '0324',
      },
    ]),
  );
}

function buildDataset({ authUsersByKey, locationsByShortName, coursesByCode }) {
  const usersByKey = new Map(
    USER_BLUEPRINTS.map((blueprint) => {
      const authUser = authUsersByKey.get(blueprint.key);
      if (!authUser?.id) {
        throw new Error(`Missing auth user id for ${blueprint.key}.`);
      }
      return [blueprint.key, { ...blueprint, id: authUser.id, email: blueprint.email.toLowerCase() }];
    }),
  );

  const clubsByKey = new Map(
    CLUB_BLUEPRINTS.map((club) => [
      club.key,
      {
        ...club,
        id: stableUuid('club', club.key),
      },
    ]),
  );

  const memberships = buildClubMembershipRows({ clubsByKey, usersByKey });
  const membershipsByUserKey = indexMembershipsByUser(memberships);
  const followRows = buildFollowRows({ usersByKey, clubsByKey, membershipsByUserKey });
  const countsByUserId = buildFollowCountMaps(followRows);
  const userRows = buildUserRows({ usersByKey, membershipsByUserKey, countsByUserId });
  const clubRows = buildClubRows({ clubsByKey, usersByKey, memberships });
  const clubMediaRows = buildClubMediaRows({ clubsByKey, usersByKey });
  const eventRows = buildEventRows({ clubsByKey, usersByKey, locationsByShortName });
  const rsvpRows = buildEventRsvps({ eventRows, usersByKey, clubsByKey, membershipsByUserKey, followRows });
  const postRows = buildPostRows({ usersByKey, clubsByKey });
  const commentRows = buildCommentRows({ postRows, usersByKey });
  const likeRows = buildPostLikeRows({ postRows, usersByKey, membershipsByUserKey, followRows });
  const userCourseRows = buildUserCourseRows({ usersByKey, coursesByCode });

  return {
    testUser: usersByKey.get('alex'),
    usersByKey,
    clubsByKey,
    users: userRows,
    clubs: clubRows,
    clubMembers: memberships,
    clubMedia: clubMediaRows,
    follows: followRows,
    events: eventRows,
    eventRsvps: rsvpRows,
    posts: postRows,
    comments: commentRows,
    postLikes: likeRows,
    userCourses: userCourseRows,
  };
}

function buildClubMembershipRows({ clubsByKey, usersByKey }) {
  return CLUB_BLUEPRINTS.flatMap((clubBlueprint, clubIndex) =>
    membershipEntriesForClub(clubBlueprint).map((entry, entryIndex) => ({
      club_id: clubsByKey.get(clubBlueprint.key).id,
      user_id: usersByKey.get(entry.userKey).id,
      role: entry.role,
      status: 'approved',
      joined_at: iso(localDayDate(-(90 + clubIndex * 4 + entryIndex), 12, 0)),
      created_at: iso(localDayDate(-(90 + clubIndex * 4 + entryIndex), 12, 5)),
      updated_at: iso(localDayDate(-(90 + clubIndex * 4 + entryIndex), 12, 5)),
      clubKey: clubBlueprint.key,
      userKey: entry.userKey,
    })),
  );
}

function indexMembershipsByUser(memberships) {
  const map = new Map();
  for (const membership of memberships) {
    if (!map.has(membership.userKey)) {
      map.set(membership.userKey, []);
    }
    map.get(membership.userKey).push(membership.clubKey);
  }
  return map;
}

function buildFollowRows({ usersByKey, clubsByKey, membershipsByUserKey }) {
  const edges = [];
  for (const user of USER_BLUEPRINTS) {
    const memberClubKeys = membershipsByUserKey.get(user.key) ?? [];
    const clubLeaders = unique(
      memberClubKeys.flatMap((clubKey) => {
        const club = clubsByKey.get(clubKey);
        return [club.president, ...club.officers];
      }),
    ).filter((candidate) => candidate !== user.key);

    const peers = unique(
      memberClubKeys.flatMap((clubKey) => {
        const club = clubsByKey.get(clubKey);
        return club.members.filter((candidate) => candidate !== user.key);
      }),
    ).filter((candidate) => candidate !== user.key);

    const limit = user.key === 'alex' ? 5 : Math.min(4, Math.max(2, memberClubKeys.length));
    const chosen = unique([...clubLeaders, ...peers]).slice(0, limit);
    for (const followingKey of chosen) {
      edges.push({
        id: stableUuid('follow', `${user.key}:${followingKey}`),
        follower_id: usersByKey.get(user.key).id,
        following_id: usersByKey.get(followingKey).id,
        created_at: iso(localDayDate(-(40 + chosen.indexOf(followingKey)), 9, 0)),
        followerKey: user.key,
        followingKey,
      });
    }
  }

  return uniqueBy(edges, (edge) => `${edge.follower_id}:${edge.following_id}`);
}

function buildFollowCountMaps(followRows) {
  const countsByUserId = new Map();
  for (const edge of followRows) {
    if (!countsByUserId.has(edge.follower_id)) {
      countsByUserId.set(edge.follower_id, { follower_count: 0, following_count: 0 });
    }
    if (!countsByUserId.has(edge.following_id)) {
      countsByUserId.set(edge.following_id, { follower_count: 0, following_count: 0 });
    }
    countsByUserId.get(edge.follower_id).following_count += 1;
    countsByUserId.get(edge.following_id).follower_count += 1;
  }
  return countsByUserId;
}

function buildUserRows({ usersByKey, membershipsByUserKey, countsByUserId }) {
  return USER_BLUEPRINTS.map((blueprint, index) => {
    const user = usersByKey.get(blueprint.key);
    const clubNames = (membershipsByUserKey.get(blueprint.key) ?? []).map((clubKey) =>
      CLUB_BLUEPRINTS.find((club) => club.key === clubKey).name,
    );
    const counts = countsByUserId.get(user.id) ?? { follower_count: 0, following_count: 0 };

    return {
      id: user.id,
      email: user.email,
      username: user.username,
      display_name: user.displayName,
      avatar_url: user.avatarUrl,
      major: user.major,
      graduation_year: user.graduationYear,
      degree_type: user.degreeType,
      minor: user.minor,
      bio: user.bio,
      pronouns: user.pronouns,
      clubs: clubNames,
      courses: user.courses,
      interests: user.interests,
      follower_count: counts.follower_count,
      following_count: counts.following_count,
      notification_prefs: DEFAULT_NOTIFICATION_PREFS,
      push_token: null,
      profile_completed: true,
      onboarding_step: 3,
      created_at: iso(localDayDate(-(120 - index), 9, 0)),
      updated_at: iso(localDayDate(-(2 + (index % 3)), 12, 0)),
      is_test_account: Boolean(user.isTestAccount),
    };
  });
}

function buildClubRows({ clubsByKey, usersByKey, memberships }) {
  return CLUB_BLUEPRINTS.map((blueprint, index) => {
    const club = clubsByKey.get(blueprint.key);
    const memberCount = memberships.filter((membership) => membership.clubKey === blueprint.key).length;
    const presidentId = usersByKey.get(blueprint.president).id;
    const location = FALLBACK_LOCATIONS[blueprint.locationShort];
    return {
      id: club.id,
      name: blueprint.name,
      slug: blueprint.slug || slugify(blueprint.name),
      description: blueprint.description,
      short_description: blueprint.shortDescription,
      category: blueprint.category,
      tags: blueprint.tags,
      logo_url: blueprint.logoUrl,
      cover_url: blueprint.coverUrl,
      cover_image_url: blueprint.coverUrl,
      meeting_schedule: blueprint.meetingSchedule,
      location_name: location?.name ?? blueprint.locationShort,
      location_id: null,
      contact_email: blueprint.contactEmail,
      instagram_handle: extractInstagramHandle(blueprint.socialLinks.instagram),
      social_links: blueprint.socialLinks,
      member_count: memberCount,
      is_active: true,
      created_by: presidentId,
      created_at: iso(localDayDate(-(300 + index), 10, 0)),
      clubKey: blueprint.key,
    };
  });
}

function buildClubMediaRows({ clubsByKey, usersByKey }) {
  return CLUB_BLUEPRINTS.flatMap((clubBlueprint) =>
    clubBlueprint.media.map((item, index) => ({
      id: stableUuid('club-media', `${clubBlueprint.key}:${index}`),
      club_id: clubsByKey.get(clubBlueprint.key).id,
      url: item.url,
      type: 'photo',
      caption: item.caption,
      created_by: usersByKey.get(item.createdBy).id,
      created_at: iso(localDayDate(-item.daysAgo, 16, 0)),
      clubKey: clubBlueprint.key,
    })),
  );
}

function buildEventRows({ clubsByKey, usersByKey, locationsByShortName }) {
  return EVENT_BLUEPRINTS.map((blueprint, index) => {
    const club = clubsByKey.get(blueprint.clubKey);
    const location = locationsByShortName.get(blueprint.locationShort) ?? FALLBACK_LOCATIONS[blueprint.locationShort];
    const { start, end } = timingToRange(blueprint.timing);
    const creator = usersByKey.get(blueprint.creatorKey);
    return {
      id: stableUuid('event', blueprint.key),
      title: blueprint.title,
      description: blueprint.description,
      organizer_id: creator.id,
      created_by: creator.id,
      organizer_name: club.name,
      category: blueprint.category,
      club_id: club.id,
      location_name: location.name,
      location_id: locationsByShortName.get(blueprint.locationShort)?.id ?? null,
      latitude: location.latitude,
      longitude: location.longitude,
      starts_at: iso(start),
      ends_at: iso(end),
      status: 'upcoming',
      cover_image_url: eventImageUrl(blueprint.key),
      image_url: eventImageUrl(blueprint.key),
      tags: blueprint.tags,
      attendee_count: 0,
      interested_count: 0,
      max_capacity: blueprint.popularity === 'major' ? 300 : blueprint.popularity === 'popular' ? 120 : 40,
      moderation_status: 'approved',
      is_featured: Boolean(blueprint.featured),
      created_at: iso(addDays(start, -Math.max(1, 2 + (index % 4)))),
      updated_at: iso(addDays(start, -Math.max(1, 2 + (index % 4)))),
      eventKey: blueprint.key,
      clubKey: blueprint.clubKey,
      creatorKey: blueprint.creatorKey,
      popularity: blueprint.popularity,
    };
  });
}

function buildEventRsvps({ eventRows, usersByKey, clubsByKey, membershipsByUserKey, followRows }) {
  const followSet = new Set(followRows.map((row) => `${row.followerKey}:${row.followingKey}`));
  const users = USER_BLUEPRINTS.map((blueprint) => usersByKey.get(blueprint.key));
  const forcedGoing = new Set(TEST_ACCOUNT_GOING_EVENT_KEYS);
  const forcedInterested = new Set(TEST_ACCOUNT_INTERESTED_EVENT_KEYS);
  const rsvpRows = [];

  for (const event of eventRows) {
    const clubMembers = new Set(membershipsByUserKey.get(event.clubKey) ?? []);
    const eventBlueprint = EVENT_BLUEPRINTS.find((item) => item.key === event.eventKey);
    const scoredUsers = users
      .map((user) => {
        const blueprint = USER_BLUEPRINTS.find((item) => item.key === findUserKeyById(usersByKey, user.id));
        const userKey = blueprint.key;
        let score = 0;
        if (clubMembers.has(userKey)) score += 8;
        if (userKey === event.creatorKey) score += 4;
        score += overlapCount(blueprint.interests, eventBlueprint.tags) * 2;
        score += overlapCount(blueprint.courses, eventBlueprint.tags.map((tag) => tag.toUpperCase())) * 0;
        if (followSet.has(`${userKey}:${event.creatorKey}`)) score += 1;
        if (forcedGoing.has(event.eventKey) && userKey === 'alex') score += 50;
        if (forcedInterested.has(event.eventKey) && userKey === 'alex') score += 30;
        return { userKey, userId: user.id, score };
      })
      .sort((left, right) => right.score - left.score || left.userKey.localeCompare(right.userKey));

    const targets = getRsvpTargets(event.popularity);
    const going = [];
    const interested = [];

    for (const candidate of scoredUsers) {
      if (going.length >= targets.going) {
        break;
      }
      going.push(candidate);
    }

    for (const candidate of scoredUsers) {
      if (going.some((row) => row.userKey === candidate.userKey)) continue;
      if (interested.length >= targets.interested) break;
      interested.push(candidate);
    }

    if (forcedGoing.has(event.eventKey) && !going.some((row) => row.userKey === 'alex')) {
      replaceLowestScored(going, scoredUsers.find((row) => row.userKey === 'alex'));
    }
    if (forcedInterested.has(event.eventKey) && !going.some((row) => row.userKey === 'alex') && !interested.some((row) => row.userKey === 'alex')) {
      replaceLowestScored(interested, scoredUsers.find((row) => row.userKey === 'alex'));
    }

    for (const row of going) {
      rsvpRows.push({
        event_id: event.id,
        user_id: row.userId,
        status: 'going',
        created_at: iso(addDays(new Date(event.starts_at), -1)),
        eventKey: event.eventKey,
        userKey: row.userKey,
      });
    }
    for (const row of interested) {
      if (going.some((candidate) => candidate.userKey === row.userKey)) continue;
      rsvpRows.push({
        event_id: event.id,
        user_id: row.userId,
        status: 'interested',
        created_at: iso(addDays(new Date(event.starts_at), -2)),
        eventKey: event.eventKey,
        userKey: row.userKey,
      });
    }
  }

  const deduped = uniqueBy(rsvpRows, (row) => `${row.event_id}:${row.user_id}`);
  const alexRows = deduped.filter((row) => row.userKey === 'alex');
  const forcedEventKeys = new Set([...TEST_ACCOUNT_GOING_EVENT_KEYS, ...TEST_ACCOUNT_INTERESTED_EVENT_KEYS]);
  if (alexRows.length > 9) {
    const removable = alexRows.filter((row) => !forcedEventKeys.has(row.eventKey)).slice(0, alexRows.length - 9);
    return deduped.filter(
      (row) => !removable.some((candidate) => candidate.event_id === row.event_id && candidate.user_id === row.user_id),
    );
  }

  return deduped;
}

function buildPostRows({ usersByKey, clubsByKey }) {
  return POST_BLUEPRINTS.map((blueprint) => {
    const author = usersByKey.get(blueprint.authorKey);
    const club = blueprint.clubKey ? clubsByKey.get(blueprint.clubKey) : null;
    const content = blueprint.title ? `${blueprint.title}\n${blueprint.body}` : blueprint.content;
    const createdAt = activityToDate(blueprint.createdAt);
    return {
      id: stableUuid('post', blueprint.key),
      user_id: author.id,
      author_id: author.id,
      club_id: club?.id ?? null,
      content_text: content,
      content,
      media_urls: blueprint.mediaUrls,
      media_type: blueprint.mediaUrls.length > 0 ? 'image' : 'none',
      hashtags: extractHashtags(content),
      like_count: 0,
      comment_count: 0,
      share_count: blueprint.targetLikes > 12 ? 2 : 0,
      moderation_status: 'approved',
      is_pinned: blueprint.isPinned,
      created_at: iso(createdAt),
      updated_at: iso(createdAt),
      postKey: blueprint.key,
      authorKey: blueprint.authorKey,
    };
  }).sort((left, right) => new Date(right.created_at).getTime() - new Date(left.created_at).getTime());
}

function buildCommentRows({ postRows, usersByKey }) {
  const comments = [];
  for (const [postKey, commentSpecs] of Object.entries(COMMENT_BLUEPRINTS)) {
    const post = postRows.find((row) => row.postKey === postKey);
    let order = 0;
    for (const spec of commentSpecs) {
      const parentId = stableUuid('comment', `${postKey}:comment:${order}`);
      comments.push({
        id: parentId,
        post_id: post.id,
        user_id: usersByKey.get(spec.authorKey).id,
        author_id: usersByKey.get(spec.authorKey).id,
        parent_id: null,
        content_text: spec.content,
        content: spec.content,
        like_count: Math.max(0, 1 + spec.content.length % 5),
        moderation_status: 'approved',
        created_at: iso(addMinutes(new Date(post.created_at), 12 + order * 9)),
        updated_at: iso(addMinutes(new Date(post.created_at), 12 + order * 9)),
        postKey,
      });
      order += 1;

      for (const reply of spec.replies ?? []) {
        comments.push({
          id: stableUuid('comment', `${postKey}:reply:${order}`),
          post_id: post.id,
          user_id: usersByKey.get(reply.authorKey).id,
          author_id: usersByKey.get(reply.authorKey).id,
          parent_id: parentId,
          content_text: reply.content,
          content: reply.content,
          like_count: Math.max(0, reply.content.length % 4),
          moderation_status: 'approved',
          created_at: iso(addMinutes(new Date(post.created_at), 12 + order * 9)),
          updated_at: iso(addMinutes(new Date(post.created_at), 12 + order * 9)),
          postKey,
        });
        order += 1;
      }
    }
  }
  return comments;
}

function buildPostLikeRows({ postRows, usersByKey, membershipsByUserKey, followRows }) {
  const followSet = new Set(followRows.map((row) => `${row.followerKey}:${row.followingKey}`));
  const likes = [];

  for (const post of postRows) {
    const postBlueprint = POST_BLUEPRINTS.find((item) => item.key === post.postKey);
    const authorBlueprint = USER_BLUEPRINTS.find((item) => item.key === post.authorKey);
    const candidates = USER_BLUEPRINTS
      .filter((user) => user.key !== post.authorKey)
      .map((user) => {
        let score = 0;
        score += overlapCount(user.interests, authorBlueprint.interests) * 2;
        if (followSet.has(`${user.key}:${post.authorKey}`)) score += 2;
        if (postBlueprint.clubKey && (membershipsByUserKey.get(user.key) ?? []).includes(postBlueprint.clubKey)) score += 5;
        score += overlapCount(user.courses, authorBlueprint.courses);
        return { userKey: user.key, userId: usersByKey.get(user.key).id, score };
      })
      .sort((left, right) => right.score - left.score || left.userKey.localeCompare(right.userKey))
      .slice(0, postBlueprint.targetLikes);

    for (const candidate of candidates) {
      likes.push({
        post_id: post.id,
        user_id: candidate.userId,
        created_at: iso(addMinutes(new Date(post.created_at), 5)),
      });
    }
  }

  return uniqueBy(likes, (row) => `${row.post_id}:${row.user_id}`);
}

function buildUserCourseRows({ usersByKey, coursesByCode }) {
  const rows = [];
  for (const blueprint of USER_BLUEPRINTS) {
    for (const code of blueprint.courses) {
      const course = coursesByCode.get(code);
      if (!course) continue;
      rows.push({
        id: stableUuid('user-course', `${blueprint.key}:${code}`),
        user_id: usersByKey.get(blueprint.key).id,
        course_id: course.id,
        course_code: course.course_code,
        section: course.section,
        semester: course.semester,
        meeting_days: course.meeting_days ?? [],
        start_time: course.start_time,
        end_time: course.end_time,
        building_name: course.building_name,
        room_number: course.room_number,
        created_at: iso(localDayDate(-20, 9, 0)),
      });
    }
  }
  return rows;
}

function extractInstagramHandle(value) {
  if (!value) return null;
  const match = value.match(/instagram\.com\/([^/?#]+)/i);
  return match?.[1] ?? null;
}

function overlapCount(left, right) {
  const rightSet = new Set(right.map((value) => String(value).toLowerCase()));
  return left.filter((value) => rightSet.has(String(value).toLowerCase())).length;
}

function getRsvpTargets(popularity) {
  switch (popularity) {
    case 'major':
      return { going: 20, interested: 0 };
    case 'popular':
      return { going: 16, interested: 2 };
    case 'medium':
      return { going: 9, interested: 2 };
    default:
      return { going: 4, interested: 1 };
  }
}

function replaceLowestScored(rows, replacement) {
  if (!replacement) return;
  const existingIndex = rows.findIndex((row) => row.userKey === replacement.userKey);
  if (existingIndex >= 0) return;
  if (rows.length === 0) {
    rows.push(replacement);
    return;
  }
  rows.sort((left, right) => left.score - right.score);
  rows[0] = replacement;
  rows.sort((left, right) => right.score - left.score);
}

function findUserKeyById(usersByKey, userId) {
  for (const [key, value] of usersByKey.entries()) {
    if (value.id === userId) {
      return key;
    }
  }
  return null;
}

function extractHashtags(content) {
  return Array.from(content.matchAll(/#([A-Za-z0-9_]+)/g)).map((match) => match[1].toLowerCase());
}

function eventImageUrl(key) {
  const imageMap = {
    'founder-coffee-chat': 'https://images.unsplash.com/photo-1515169067868-5387ec356754?auto=format&fit=crop&w=1200&q=80',
    'trail-conditioning-run': 'https://images.unsplash.com/photo-1552674605-db6ffd4facb5?auto=format&fit=crop&w=1200&q=80',
    'bhangra-open-practice': 'https://images.unsplash.com/photo-1508804185872-d7badad00f7d?auto=format&fit=crop&w=1200&q=80',
    'sql-study-jam': 'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?auto=format&fit=crop&w=1200&q=80',
    'hack-night-3': 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=1200&q=80',
    'hackers-build-lab': 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=1200&q=80',
    'data-office-hours-live': 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=1200&q=80',
    'editing-bay-open-hours': 'https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?auto=format&fit=crop&w=1200&q=80',
    'hack-night-4': 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=1200&q=80',
    'analytics-resume-clinic': 'https://images.unsplash.com/photo-1552664730-d307ca884978?auto=format&fit=crop&w=1200&q=80',
    'sunset-tempo-run': 'https://images.unsplash.com/photo-1473448912268-2022ce9509d8?auto=format&fit=crop&w=1200&q=80',
    'spring-bhangra-mixer': 'https://images.unsplash.com/photo-1501386761578-eac5c94b800a?auto=format&fit=crop&w=1200&q=80',
    'film-shorts-screening': 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=1200&q=80',
    'street-food-social': 'https://images.unsplash.com/photo-1526318472351-c75fcf070305?auto=format&fit=crop&w=1200&q=80',
    'bitcamp-team-match': 'https://images.unsplash.com/photo-1516321497487-e288fb19713f?auto=format&fit=crop&w=1200&q=80',
    'founder-fireside': 'https://images.unsplash.com/photo-1521737711867-e3b97375f902?auto=format&fit=crop&w=1200&q=80',
    'swe-intern-panel': 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=1200&q=80',
    'showcase-rehearsal': 'https://images.unsplash.com/photo-1516280440614-37939bbacd81?auto=format&fit=crop&w=1200&q=80',
    'community-care-kits': 'https://images.unsplash.com/photo-1559027615-cd4628902d4a?auto=format&fit=crop&w=1200&q=80',
    'demo-day-munching': 'https://images.unsplash.com/photo-1516321165247-4aa89a48be28?auto=format&fit=crop&w=1200&q=80',
    'spring-5k': 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?auto=format&fit=crop&w=1200&q=80',
    'bhangra-at-the-clarice': 'https://images.unsplash.com/photo-1516280440614-37939bbacd81?auto=format&fit=crop&w=1200&q=80',
    'gallery-night': 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?auto=format&fit=crop&w=1200&q=80',
  };

  return imageMap[key] ?? 'https://images.unsplash.com/photo-1503428593586-e225b39bddfe?auto=format&fit=crop&w=1200&q=80';
}

function validateDataset(dataset) {
  const testUserId = dataset.testUser.id;
  const testMemberships = dataset.clubMembers.filter((row) => row.user_id === testUserId);
  const testOfficerMemberships = testMemberships.filter((row) => row.role === 'officer' || row.role === 'president');
  if (testMemberships.length < 3 || testMemberships.length > 4) {
    throw new Error(`The test account must be in 3-4 clubs. Found ${testMemberships.length}.`);
  }
  if (testOfficerMemberships.length < 1) {
    throw new Error('The test account must be an officer in at least one club.');
  }

  const testRsvps = dataset.eventRsvps.filter((row) => row.user_id === testUserId);
  if (testRsvps.length < 8 || testRsvps.length > 10) {
    throw new Error(`The test account must have 8-10 RSVPs. Found ${testRsvps.length}.`);
  }

  const clubMemberCountByClub = new Map();
  for (const row of dataset.clubMembers) {
    clubMemberCountByClub.set(row.club_id, (clubMemberCountByClub.get(row.club_id) ?? 0) + 1);
  }
  for (const club of dataset.clubs) {
    const memberCount = clubMemberCountByClub.get(club.id) ?? 0;
    if (memberCount !== club.member_count) {
      throw new Error(`Club ${club.name} member_count mismatch in generated data.`);
    }
  }

  const likeCountByPost = new Map();
  for (const row of dataset.postLikes) {
    likeCountByPost.set(row.post_id, (likeCountByPost.get(row.post_id) ?? 0) + 1);
  }
  const commentCountByPost = new Map();
  for (const row of dataset.comments) {
    commentCountByPost.set(row.post_id, (commentCountByPost.get(row.post_id) ?? 0) + 1);
  }

  for (const post of dataset.posts) {
    const likes = likeCountByPost.get(post.id) ?? 0;
    const comments = commentCountByPost.get(post.id) ?? 0;
    const blueprint = POST_BLUEPRINTS.find((item) => item.key === post.postKey);
    if (likes !== blueprint.targetLikes) {
      throw new Error(`Post ${post.postKey} expected ${blueprint.targetLikes} likes but generated ${likes}.`);
    }
    if (post.postKey in COMMENT_BLUEPRINTS && comments < 2) {
      throw new Error(`Post ${post.postKey} should have at least 2 comments.`);
    }
  }

  for (const event of dataset.events) {
    const hostingMembership = dataset.clubMembers.find(
      (row) => row.club_id === event.club_id && row.user_id === event.organizer_id && ['officer', 'president'].includes(row.role),
    );
    if (!hostingMembership) {
      throw new Error(`Event ${event.title} creator must be an officer or president of the hosting club.`);
    }
  }
}

async function wipeExistingData(supabase) {
  const steps = [
    ['post_likes', 'post_id'],
    ['comments', 'id'],
    ['posts', 'id'],
    ['event_rsvps', 'event_id'],
    ['club_media', 'id'],
    ['club_members', 'club_id'],
    ['event_reports', 'id'],
    ['events', 'id'],
    ['follows', 'id'],
    ['feed_cache', 'user_id'],
    ['people_recommendations', 'user_id'],
    ['interactions', 'id'],
    ['content_reports', 'id'],
    ['user_courses', 'id'],
    ['clubs', 'id'],
    ['users', 'id'],
  ];

  for (const [table, column] of steps) {
    const { error } = await supabase.from(table).delete().not(column, 'is', null);
    if (error) {
      throw new Error(`Unable to clear ${table}: ${error.message}`);
    }
  }
}

async function insertInChunks(supabase, table, rows, size = 100) {
  for (let index = 0; index < rows.length; index += size) {
    const chunk = rows.slice(index, index + size);
    if (chunk.length === 0) continue;
    const { error } = await supabase.from(table).insert(chunk);
    if (error) {
      throw new Error(`Unable to insert into ${table}: ${error.message}`);
    }
  }
}

function stripKeys(rows, keys) {
  return rows.map((row) => {
    const next = { ...row };
    for (const key of keys) delete next[key];
    return next;
  });
}

async function seedAllData(supabase, dataset) {
  await insertInChunks(
    supabase,
    'users',
    stripKeys(dataset.users, ['is_test_account']),
  );
  await insertInChunks(
    supabase,
    'clubs',
    stripKeys(dataset.clubs, ['clubKey']),
  );
  await insertInChunks(
    supabase,
    'club_members',
    stripKeys(dataset.clubMembers, ['clubKey', 'userKey']),
  );
  await insertInChunks(
    supabase,
    'club_media',
    stripKeys(dataset.clubMedia, ['clubKey']),
  );
  await insertInChunks(
    supabase,
    'follows',
    stripKeys(dataset.follows, ['followerKey', 'followingKey']),
  );
  await insertInChunks(
    supabase,
    'events',
    stripKeys(dataset.events, ['eventKey', 'clubKey', 'creatorKey', 'popularity']),
  );
  await insertInChunks(
    supabase,
    'event_rsvps',
    stripKeys(dataset.eventRsvps, ['eventKey', 'userKey']),
  );
  await insertInChunks(
    supabase,
    'posts',
    stripKeys(dataset.posts, ['postKey', 'authorKey']),
  );
  await insertInChunks(
    supabase,
    'post_likes',
    dataset.postLikes,
  );

  const parentComments = dataset.comments.filter((row) => !row.parent_id);
  const replyComments = dataset.comments.filter((row) => row.parent_id);
  await insertInChunks(
    supabase,
    'comments',
    stripKeys(parentComments, ['postKey']),
  );
  await insertInChunks(
    supabase,
    'comments',
    stripKeys(replyComments, ['postKey']),
  );
  await insertInChunks(supabase, 'user_courses', dataset.userCourses);
}

async function validateRemoteState(supabase, dataset) {
  const [clubsResult, eventsResult, postsResult] = await Promise.all([
    supabase.from('clubs').select('id, member_count'),
    supabase.from('events').select('id, attendee_count, interested_count'),
    supabase.from('posts').select('id, like_count, comment_count'),
  ]);

  if (clubsResult.error) throw new Error(`Unable to validate clubs: ${clubsResult.error.message}`);
  if (eventsResult.error) throw new Error(`Unable to validate events: ${eventsResult.error.message}`);
  if (postsResult.error) throw new Error(`Unable to validate posts: ${postsResult.error.message}`);

  const expectedMembers = new Map();
  for (const row of dataset.clubMembers) {
    expectedMembers.set(row.club_id, (expectedMembers.get(row.club_id) ?? 0) + 1);
  }
  for (const row of clubsResult.data ?? []) {
    if ((expectedMembers.get(row.id) ?? 0) !== row.member_count) {
      throw new Error(`Club member_count mismatch persisted for ${row.id}.`);
    }
  }

  const expectedGoing = new Map();
  const expectedInterested = new Map();
  for (const row of dataset.eventRsvps) {
    if (row.status === 'going') expectedGoing.set(row.event_id, (expectedGoing.get(row.event_id) ?? 0) + 1);
    if (row.status === 'interested') expectedInterested.set(row.event_id, (expectedInterested.get(row.event_id) ?? 0) + 1);
  }
  for (const row of eventsResult.data ?? []) {
    if ((expectedGoing.get(row.id) ?? 0) !== row.attendee_count) {
      throw new Error(`Event attendee_count mismatch persisted for ${row.id}.`);
    }
    if ((expectedInterested.get(row.id) ?? 0) !== row.interested_count) {
      throw new Error(`Event interested_count mismatch persisted for ${row.id}.`);
    }
  }

  const expectedLikes = new Map();
  for (const row of dataset.postLikes) {
    expectedLikes.set(row.post_id, (expectedLikes.get(row.post_id) ?? 0) + 1);
  }
  const expectedComments = new Map();
  for (const row of dataset.comments) {
    expectedComments.set(row.post_id, (expectedComments.get(row.post_id) ?? 0) + 1);
  }
  for (const row of postsResult.data ?? []) {
    if ((expectedLikes.get(row.id) ?? 0) !== row.like_count) {
      throw new Error(`Post like_count mismatch persisted for ${row.id}.`);
    }
    if ((expectedComments.get(row.id) ?? 0) !== row.comment_count) {
      throw new Error(`Post comment_count mismatch persisted for ${row.id}.`);
    }
  }
}

function writeLocalMockFiles(dataset) {
  const localUsers = buildLocalUsers(dataset);
  const userById = new Map(localUsers.map((user) => [user.id, user]));
  const localClubs = buildLocalClubs(dataset);
  const localClubMembers = dataset.clubMembers.map((membership) => ({
    club_id: membership.club_id,
    user_id: membership.user_id,
    role: membership.role,
    status: membership.status,
    joined_at: membership.joined_at,
    user: userById.get(membership.user_id),
  }));
  const localEvents = buildLocalEvents(dataset);
  const localPosts = buildLocalPosts(dataset, userById);
  const localComments = buildLocalComments(dataset, userById);
  const socialProfiles = buildLocalSocialProfiles(dataset, userById);
  const followingByUser = buildFollowingByUser(dataset);
  const joinedClubIdsByUser = buildJoinedClubIdsByUser(dataset);
  const eventPresenceByUser = buildEventPresenceByUser(dataset);
  const mockCampusEvents = localEvents.filter((event) => event.is_featured || new Date(event.starts_at) < addDays(new Date(), 3)).slice(0, 12);

  fs.writeFileSync(
    path.join(ROOT, 'src', 'assets', 'data', 'mockClubs.ts'),
    `import { Club, ClubMemberWithUser, User, Event } from '../../shared/types';\n\nexport const mockClubs = ${JSON.stringify(localClubs, null, 2)} as Club[];\n\nexport const mockUsers = ${JSON.stringify(localUsers, null, 2)} as User[];\n\nexport const mockClubMembers = ${JSON.stringify(localClubMembers, null, 2)} as ClubMemberWithUser[];\n\nexport interface JoinRequest {\n  id: string;\n  club_id: string;\n  user: User;\n  status: 'pending' | 'approved' | 'rejected';\n  answers: string[];\n  requested_at: string;\n}\n\nexport const mockJoinRequests = [] as JoinRequest[];\n\nexport const mockClubEvents = ${JSON.stringify(localEvents, null, 2)} as Event[];\n\nexport interface ClubMedia {\n  id: string;\n  club_id: string;\n  url: string;\n  type: 'photo' | 'video';\n  caption: string;\n  created_at: string;\n}\n\nexport const mockClubMedia = ${JSON.stringify(dataset.clubMedia.map((item) => ({ id: item.id, club_id: item.club_id, url: item.url, type: 'photo', caption: item.caption, created_at: item.created_at })), null, 2)} as ClubMedia[];\n\nexport function getClubIdsForUser(userId: string) {\n  return mockClubMembers.filter((member) => member.user_id === userId && member.status === 'approved').map((member) => member.club_id);\n}\n`,
    'utf8',
  );

  fs.writeFileSync(
    path.join(ROOT, 'src', 'assets', 'data', 'mockEvents.ts'),
    `import { Event } from '../../shared/types';\n\nexport const mockCampusEvents = ${JSON.stringify(mockCampusEvents, null, 2)} as Event[];\n\nexport function findMockCampusEvent(eventId: string) {\n  return mockCampusEvents.find((event) => event.id === eventId);\n}\n`,
    'utf8',
  );

  fs.writeFileSync(
    path.join(ROOT, 'src', 'assets', 'data', 'mockAppState.ts'),
    `export interface MockEventPresence {\n  goingEventIds: string[];\n  savedEventIds: string[];\n}\n\nexport const mockJoinedClubIdsByUser = ${JSON.stringify(joinedClubIdsByUser, null, 2)} as Record<string, string[]>;\n\nexport const mockEventPresenceByUser = ${JSON.stringify(eventPresenceByUser, null, 2)} as Record<string, MockEventPresence>;\n`,
    'utf8',
  );

  fs.writeFileSync(
    path.join(ROOT, 'src', 'assets', 'data', 'mockFeed.ts'),
    `import { Post, Comment, UserProfile } from '../../shared/types';\n\nexport const mockAuthors = ${JSON.stringify(buildMockAuthors(localUsers), null, 2)} as Record<string, UserProfile>;\n\nexport const authorHandles = ${JSON.stringify(Object.fromEntries(localUsers.map((user) => [user.id, `@${user.username}`])), null, 2)} as Record<string, string>;\n\nexport const mockPosts = ${JSON.stringify(localPosts, null, 2)} as Post[];\n\nexport interface CommentWithReplies extends Comment {\n  replies?: CommentWithReplies[];\n  is_liked?: boolean;\n}\n\nexport const mockComments = ${JSON.stringify(localComments, null, 2)} as Record<string, CommentWithReplies[]>;\n`,
    'utf8',
  );

  fs.writeFileSync(
    path.join(ROOT, 'src', 'features', 'social', 'data', 'mockSocialGraph.ts'),
    `import { mockClubs } from '../../../assets/data/mockClubs';\n\nexport interface SocialProfile {\n  id: string;\n  displayName: string;\n  username: string;\n  avatarUrl: string | null;\n  bio: string;\n  pronouns?: string | null;\n  major: string | null;\n  classYear: number | null;\n  clubIds: string[];\n  interests: string[];\n  isOfficial?: boolean;\n}\n\nexport interface RecommendationReason {\n  mutualCount: number;\n  sharedClubIds: string[];\n  sharedInterests: string[];\n  score: number;\n  headline: string;\n}\n\nexport const CURRENT_SOCIAL_USER_ID = ${JSON.stringify(dataset.testUser.id)};\n\nexport const socialProfiles = ${JSON.stringify(socialProfiles, null, 2)} as Record<string, SocialProfile>;\n\nexport const initialFollowingByUser = ${JSON.stringify(followingByUser, null, 2)} as Record<string, string[]>;\n\nexport const clubNameById = mockClubs.reduce<Record<string, string>>((accumulator, club) => {\n  accumulator[club.id] = club.name;\n  return accumulator;\n}, {});\n`,
    'utf8',
  );
}

function buildLocalUsers(dataset) {
  return dataset.users.map((user) => ({
    id: user.id,
    email: user.email,
    username: user.username,
    display_name: user.display_name,
    avatar_url: user.avatar_url,
    major: user.major,
    graduation_year: user.graduation_year,
    degree_type: user.degree_type,
    minor: user.minor,
    bio: user.bio,
    pronouns: user.pronouns,
    clubs: user.clubs,
    courses: user.courses,
    interests: user.interests,
    follower_count: user.follower_count,
    following_count: user.following_count,
    notification_prefs: user.notification_prefs,
    push_token: null,
    profile_completed: true,
    onboarding_step: 3,
    created_at: user.created_at,
    updated_at: user.updated_at,
  }));
}

function buildLocalClubs(dataset) {
  return dataset.clubs.map((club) => ({
    id: club.id,
    name: club.name,
    slug: club.slug,
    description: club.description,
    short_description: club.short_description,
    category: club.category,
    logo_url: club.logo_url,
    cover_url: club.cover_url,
    meeting_schedule: club.meeting_schedule,
    contact_email: club.contact_email,
    social_links: club.social_links,
    member_count: club.member_count,
    is_active: club.is_active,
    created_by: club.created_by,
    created_at: club.created_at,
  }));
}

function buildLocalEvents(dataset) {
  const counts = new Map();
  const interested = new Map();
  for (const row of dataset.eventRsvps) {
    if (row.status === 'going') counts.set(row.event_id, (counts.get(row.event_id) ?? 0) + 1);
    if (row.status === 'interested') interested.set(row.event_id, (interested.get(row.event_id) ?? 0) + 1);
  }
  return dataset.events.map((event) => ({
    id: event.id,
    title: event.title,
    description: event.description,
    club_id: event.club_id,
    created_by: event.created_by,
    organizer_name: event.organizer_name,
    category: event.category,
    starts_at: event.starts_at,
    ends_at: event.ends_at,
    status: event.status,
    moderation_status: event.moderation_status,
    location_name: event.location_name,
    location_id: event.location_id,
    latitude: event.latitude,
    longitude: event.longitude,
    image_url: event.image_url,
    rsvp_count: counts.get(event.id) ?? 0,
    attendee_count: counts.get(event.id) ?? 0,
    interested_count: interested.get(event.id) ?? 0,
    max_capacity: event.max_capacity,
    is_featured: event.is_featured,
    tags: event.tags,
    location: event.location_name,
    created_at: event.created_at,
    updated_at: event.updated_at,
  }));
}

function buildLocalPosts(dataset, userById) {
  const likesByPost = new Map();
  const commentsByPost = new Map();
  for (const like of dataset.postLikes) likesByPost.set(like.post_id, (likesByPost.get(like.post_id) ?? 0) + 1);
  for (const comment of dataset.comments) commentsByPost.set(comment.post_id, (commentsByPost.get(comment.post_id) ?? 0) + 1);
  return dataset.posts.map((post) => ({
    id: post.id,
    author_id: post.user_id,
    author: userById.get(post.user_id),
    club_id: post.club_id,
    type: post.media_type === 'image' ? 'image' : post.is_pinned ? 'club_announcement' : 'text',
    content: post.content,
    media_urls: post.media_urls,
    media_items: post.media_urls.map((uri, index) => ({ id: `${post.id}-${index}`, uri, type: 'image' })),
    hashtags: post.hashtags,
    like_count: likesByPost.get(post.id) ?? 0,
    comment_count: commentsByPost.get(post.id) ?? 0,
    share_count: post.share_count,
    is_pinned: post.is_pinned,
    created_at: post.created_at,
    updated_at: post.updated_at,
    is_liked: false,
  }));
}

function buildLocalComments(dataset, userById) {
  const childrenByParent = new Map();
  const rootsByPost = new Map();
  for (const comment of dataset.comments) {
    const node = {
      id: comment.id,
      post_id: comment.post_id,
      author_id: comment.user_id,
      author: userById.get(comment.user_id),
      parent_id: comment.parent_id,
      content: comment.content,
      like_count: comment.like_count,
      created_at: comment.created_at,
      updated_at: comment.updated_at,
      is_liked: false,
      replies: [],
    };
    if (comment.parent_id) {
      if (!childrenByParent.has(comment.parent_id)) childrenByParent.set(comment.parent_id, []);
      childrenByParent.get(comment.parent_id).push(node);
    } else {
      if (!rootsByPost.has(comment.post_id)) rootsByPost.set(comment.post_id, []);
      rootsByPost.get(comment.post_id).push(node);
    }
  }
  for (const roots of rootsByPost.values()) {
    for (const root of roots) {
      root.replies = childrenByParent.get(root.id) ?? [];
    }
  }
  return Object.fromEntries(Array.from(rootsByPost.entries()));
}

function buildLocalSocialProfiles(dataset, userById) {
  const clubIdsByUser = new Map();
  for (const membership of dataset.clubMembers) {
    if (!clubIdsByUser.has(membership.user_id)) clubIdsByUser.set(membership.user_id, []);
    clubIdsByUser.get(membership.user_id).push(membership.club_id);
  }
  return Object.fromEntries(
    dataset.users.map((user) => [
      user.id,
      {
        id: user.id,
        displayName: user.display_name,
        username: user.username,
        avatarUrl: user.avatar_url,
        bio: user.bio ?? '',
        pronouns: user.pronouns,
        major: user.major,
        classYear: user.graduation_year,
        clubIds: clubIdsByUser.get(user.id) ?? [],
        interests: user.interests ?? [],
      },
    ]),
  );
}

function buildFollowingByUser(dataset) {
  const mapping = {};
  for (const user of dataset.users) mapping[user.id] = [];
  for (const edge of dataset.follows) mapping[edge.follower_id].push(edge.following_id);
  return mapping;
}

function buildJoinedClubIdsByUser(dataset) {
  const mapping = {};
  for (const user of dataset.users) mapping[user.id] = [];
  for (const membership of dataset.clubMembers) {
    if (membership.status !== 'approved') {
      continue;
    }

    mapping[membership.user_id].push(membership.club_id);
  }

  return mapping;
}

function buildEventPresenceByUser(dataset) {
  const mapping = {};

  for (const user of dataset.users) {
    mapping[user.id] = {
      goingEventIds: [],
      savedEventIds: [],
    };
  }

  for (const rsvp of dataset.eventRsvps) {
    const current = mapping[rsvp.user_id] ?? {
      goingEventIds: [],
      savedEventIds: [],
    };

    if (rsvp.status === 'going') {
      current.goingEventIds.push(rsvp.event_id);
    } else if (rsvp.status === 'interested') {
      current.savedEventIds.push(rsvp.event_id);
    }

    mapping[rsvp.user_id] = current;
  }

  return mapping;
}

function buildMockAuthors(localUsers) {
  return Object.fromEntries(localUsers.map((user) => [user.username, {
    id: user.id,
    email: user.email,
    display_name: user.display_name,
    avatar_url: user.avatar_url,
    bio: user.bio,
    major: user.major,
    graduation_year: user.graduation_year,
    push_token: null,
    created_at: user.created_at,
    updated_at: user.updated_at,
  }]));
}

function printCompletionSummary(dataset) {
  const testRsvps = dataset.eventRsvps.filter((row) => row.user_id === dataset.testUser.id);
  const testPosts = dataset.posts.filter((row) => row.user_id === dataset.testUser.id);
  const testClubs = dataset.clubMembers.filter((row) => row.user_id === dataset.testUser.id).map((row) => dataset.clubs.find((club) => club.id === row.club_id)?.name).filter(Boolean);

  console.log('');
  console.log('Reseed complete.');
  console.log(`Users: ${dataset.users.length}`);
  console.log(`Clubs: ${dataset.clubs.length}`);
  console.log(`Events: ${dataset.events.length}`);
  console.log(`Posts: ${dataset.posts.length}`);
  console.log('');
  console.log('Test account');
  console.log(`Email: ${dataset.testUser.email}`);
  console.log(`Password: ${DEFAULT_TEST_PASSWORD}`);
  console.log('Sign-in method in the app: email OTP');
  console.log('Note: if you want to receive the OTP for real, rerun with RESEED_TEST_ACCOUNT_EMAIL set to a deliverable @umd.edu or @terpmail.umd.edu inbox.');
  console.log(`Clubs: ${testClubs.join(', ')}`);
  console.log(`RSVPs: ${testRsvps.length}`);
  console.log(`Posts: ${testPosts.length}`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
