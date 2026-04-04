import { mockClubs } from '../../../assets/data/mockClubs';

export interface SocialProfile {
  id: string;
  displayName: string;
  username: string;
  avatarUrl: string | null;
  bio: string;
  pronouns?: string | null;
  major: string | null;
  classYear: number | null;
  clubIds: string[];
  interests: string[];
  isOfficial?: boolean;
}

export interface RecommendationReason {
  mutualCount: number;
  sharedClubIds: string[];
  sharedInterests: string[];
  score: number;
  headline: string;
}

export const CURRENT_SOCIAL_USER_ID = 'usr-current';

export const socialProfiles: Record<string, SocialProfile> = {
  'usr-current': {
    id: 'usr-current',
    displayName: 'Alex Johnson',
    username: 'alexj_terp',
    avatarUrl: 'https://i.pravatar.cc/200?u=alexj_terp',
    bio: 'Building things at UMD. Coffee enthusiast and late-night coder.',
    pronouns: 'they/them',
    major: 'Computer Science',
    classYear: 2026,
    clubIds: ['club-001', 'club-003', 'club-005'],
    interests: ['startups', 'design', 'study-spots', 'community'],
  },
  'usr-001': {
    id: 'usr-001',
    displayName: 'Testudo',
    username: 'fearTheTurtle',
    avatarUrl: 'https://i.pravatar.cc/200?u=testudo',
    bio: 'Official campus mascot and good-luck dispenser.',
    pronouns: null,
    major: null,
    classYear: null,
    clubIds: ['club-004'],
    interests: ['campus-spirit', 'events', 'traditions'],
    isOfficial: true,
  },
  'usr-002': {
    id: 'usr-002',
    displayName: 'SGA',
    username: 'umd_sga',
    avatarUrl: 'https://i.pravatar.cc/200?u=umd_sga',
    bio: 'Student Government Association at UMD.',
    pronouns: null,
    major: null,
    classYear: null,
    clubIds: ['club-004'],
    interests: ['campus-policy', 'announcements', 'community'],
    isOfficial: true,
  },
  'usr-003': {
    id: 'usr-003',
    displayName: 'Sarah Jenkins',
    username: 'sarah_j',
    avatarUrl: 'https://i.pravatar.cc/200?u=sarah_j',
    bio: 'CS major, class of 2027. Usually somewhere near Iribe.',
    pronouns: 'she/her',
    major: 'Computer Science',
    classYear: 2027,
    clubIds: ['club-001'],
    interests: ['study-spots', 'hackathons', 'career'],
  },
  'usr-004': {
    id: 'usr-004',
    displayName: 'Marcus Thompson',
    username: 'marcus_t',
    avatarUrl: 'https://i.pravatar.cc/200?u=marcus_t',
    bio: 'Mechanical Engineering and Terps basketball superfan.',
    pronouns: 'he/him',
    major: 'Mechanical Engineering',
    classYear: 2026,
    clubIds: ['club-002'],
    interests: ['sports', 'maker-space', 'events'],
  },
  'usr-005': {
    id: 'usr-005',
    displayName: 'Priya Kapoor',
    username: 'priya_k',
    avatarUrl: 'https://i.pravatar.cc/200?u=priya_k',
    bio: 'Biology + pre-med. Loves campus sunsets and quiet corners.',
    pronouns: 'she/her',
    major: 'Biology',
    classYear: 2026,
    clubIds: ['club-003'],
    interests: ['study-spots', 'wellness', 'community'],
  },
  'usr-006': {
    id: 'usr-006',
    displayName: 'Terps Esports',
    username: 'terps_esports',
    avatarUrl: 'https://i.pravatar.cc/200?u=terps_esports',
    bio: 'Official UMD esports club. Scrims, streams, and campus LAN nights.',
    pronouns: null,
    major: null,
    classYear: null,
    clubIds: ['club-001'],
    interests: ['gaming', 'events', 'community'],
    isOfficial: true,
  },
  'usr-007': {
    id: 'usr-007',
    displayName: 'Nia Brooks',
    username: 'nia_builds',
    avatarUrl: 'https://i.pravatar.cc/200?u=nia_builds',
    bio: 'Infosci + product design. Always down for a prototype sprint.',
    pronouns: 'she/her',
    major: 'Information Science',
    classYear: 2027,
    clubIds: ['club-001', 'club-004'],
    interests: ['design', 'startups', 'community'],
  },
  'usr-008': {
    id: 'usr-008',
    displayName: 'Daniel Park',
    username: 'danielpark',
    avatarUrl: 'https://i.pravatar.cc/200?u=danielpark',
    bio: 'CS, photography, and way too many side projects.',
    pronouns: 'he/him',
    major: 'Computer Science',
    classYear: 2025,
    clubIds: ['club-001', 'club-006'],
    interests: ['photography', 'design', 'hackathons'],
  },
  'usr-009': {
    id: 'usr-009',
    displayName: 'Ava Reynolds',
    username: 'avareynolds',
    avatarUrl: 'https://i.pravatar.cc/200?u=avareynolds',
    bio: 'Architecture student. Best study rooms and best playlists.',
    pronouns: 'she/her',
    major: 'Architecture',
    classYear: 2026,
    clubIds: ['club-003', 'club-005'],
    interests: ['study-spots', 'music', 'design'],
  },
  'usr-010': {
    id: 'usr-010',
    displayName: 'Malik Carter',
    username: 'malikmoves',
    avatarUrl: 'https://i.pravatar.cc/200?u=malikmoves',
    bio: 'Kinesiology, intramurals, and anything happening tonight.',
    pronouns: 'he/him',
    major: 'Kinesiology',
    classYear: 2027,
    clubIds: ['club-002'],
    interests: ['sports', 'community', 'events'],
  },
};

export const initialFollowingByUser: Record<string, string[]> = {
  'usr-current': ['usr-003', 'usr-004', 'usr-006'],
  'usr-001': ['usr-002', 'usr-current'],
  'usr-002': ['usr-001', 'usr-003', 'usr-007'],
  'usr-003': ['usr-004', 'usr-005', 'usr-007'],
  'usr-004': ['usr-003', 'usr-010', 'usr-current'],
  'usr-005': ['usr-003', 'usr-009'],
  'usr-006': ['usr-001', 'usr-004', 'usr-008'],
  'usr-007': ['usr-003', 'usr-008', 'usr-current'],
  'usr-008': ['usr-003', 'usr-007', 'usr-current'],
  'usr-009': ['usr-005', 'usr-current'],
  'usr-010': ['usr-004', 'usr-current'],
};

export const clubNameById = mockClubs.reduce<Record<string, string>>((accumulator, club) => {
  accumulator[club.id] = club.name;
  return accumulator;
}, {});
