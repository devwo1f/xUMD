/**
 * Mock Club Data
 *
 * Sample UMD student organizations for development and testing.
 */

import { profile as appProfile } from '../../experience/content';
import { Club, ClubCategory, ClubMember, ClubMemberWithUser, MemberRole, MemberStatus, User, Event, EventCategory } from '../../shared/types';

// ── Mock Clubs ───────────────────────────────────────────────

export const mockClubs: Club[] = [
  {
    id: 'club-001',
    name: 'UMD Hackers',
    slug: 'umd-hackers',
    description:
      'The largest tech and coding community at UMD. We host Bitcamp, one of the biggest hackathons on the East Coast, along with weekly workshops on web development, machine learning, and competitive programming. Whether you are a beginner or a seasoned developer, UMD Hackers has a place for you.',
    short_description:
      'The largest tech and coding community at UMD. Builders of Bitcamp.',
    category: ClubCategory.Academic,
    logo_url: 'https://picsum.photos/seed/hackers/200',
    cover_url: 'https://picsum.photos/seed/hackers-cover/800/400',
    meeting_schedule: 'Wednesdays, 7:00 PM - 9:00 PM, IRB 0324',
    contact_email: 'hello@umdhackers.org',
    social_links: {
      instagram: 'https://instagram.com/umdhackers',
      discord: 'https://discord.gg/umdhackers',
      website: 'https://umdhackers.org',
      twitter: 'https://twitter.com/umdhackers',
    },
    member_count: 1250,
    is_active: true,
    created_by: 'user-001',
    created_at: '2018-09-01T00:00:00Z',
  },
  {
    id: 'club-002',
    name: 'Terps Racing',
    slug: 'terps-racing',
    description:
      'Terps Racing is the Formula SAE team at the University of Maryland. We design, build, and race an open-wheel formula-style race car each year. Our team of dedicated engineers works across mechanical, electrical, and software disciplines to create a competitive vehicle for the annual FSAE Michigan competition.',
    short_description:
      'Formula SAE team designing, building, and racing open-wheel cars.',
    category: ClubCategory.Professional,
    logo_url: 'https://picsum.photos/seed/racing/200',
    cover_url: 'https://picsum.photos/seed/racing-cover/800/400',
    meeting_schedule: 'Tues & Thurs, 6:00 PM - 10:00 PM, EGR Workshop',
    contact_email: 'terpsracing@umd.edu',
    social_links: {
      instagram: 'https://instagram.com/terpsracing',
      website: 'https://terpsracing.com',
    },
    member_count: 85,
    is_active: true,
    created_by: 'user-002',
    created_at: '2015-01-15T00:00:00Z',
  },
  {
    id: 'club-003',
    name: 'Maryland Outdoors Club',
    slug: 'maryland-outdoors',
    description:
      'Maryland Outdoors Club organizes hiking, camping, kayaking, rock climbing, and other outdoor adventures for all Terps. No experience needed! We run weekend trips to Shenandoah, the Appalachian Trail, and more. We also host gear rental and outdoor skills workshops throughout the semester.',
    short_description:
      'Organizing hiking, camping, and outdoor adventures for all Terps.',
    category: ClubCategory.Social,
    logo_url: 'https://picsum.photos/seed/outdoors/200',
    cover_url: 'https://picsum.photos/seed/outdoors-cover/800/400',
    meeting_schedule: 'Mondays, 8:00 PM, Stamp 0200',
    contact_email: 'outdoors@terpmail.umd.edu',
    social_links: {
      instagram: 'https://instagram.com/umdoutdoors',
      discord: 'https://discord.gg/umdoutdoors',
      website: 'https://umdoutdoors.org',
    },
    member_count: 420,
    is_active: true,
    created_by: 'user-003',
    created_at: '2019-08-20T00:00:00Z',
  },
  {
    id: 'club-004',
    name: 'Student Government Association',
    slug: 'sga',
    description:
      'The Student Government Association is the representative body for all undergraduate students at UMD. We advocate for student interests, manage student activity fees, and work with the administration to improve campus life. SGA offers opportunities in legislation, programming, and community engagement.',
    short_description:
      'Advocating for the student body and managing student activity fees.',
    category: ClubCategory.Service,
    logo_url: 'https://picsum.photos/seed/sga/200',
    cover_url: 'https://picsum.photos/seed/sga-cover/800/400',
    meeting_schedule: 'Thursdays, 6:30 PM, Stamp Grand Ballroom',
    contact_email: 'sga@umd.edu',
    social_links: {
      instagram: 'https://instagram.com/umdsga',
      twitter: 'https://twitter.com/umdsga',
      website: 'https://sga.umd.edu',
    },
    member_count: 150,
    is_active: true,
    created_by: 'user-004',
    created_at: '2010-09-01T00:00:00Z',
  },
  {
    id: 'club-005',
    name: 'Faux Paz',
    slug: 'faux-paz',
    description:
      'Faux Paz is an award-winning co-ed a cappella group at the University of Maryland. We perform a wide range of music from pop and R&B to indie and classic rock. Our group competes in the ICCA each year and hosts multiple campus concerts per semester. Auditions are held at the beginning of each fall and spring semester.',
    short_description:
      'Award-winning a cappella group performing at campus events and competitions.',
    category: ClubCategory.Arts,
    logo_url: 'https://picsum.photos/seed/acapella/200',
    cover_url: 'https://picsum.photos/seed/acapella-cover/800/400',
    meeting_schedule: 'Mon, Wed, Fri, 5:00 PM - 7:00 PM, Clarice PAC',
    contact_email: 'fauxpaz@terpmail.umd.edu',
    social_links: {
      instagram: 'https://instagram.com/fauxpazumd',
      website: 'https://fauxpaz.com',
    },
    member_count: 25,
    is_active: true,
    created_by: 'user-005',
    created_at: '2005-09-01T00:00:00Z',
  },
  {
    id: 'club-006',
    name: 'Korean Student Association',
    slug: 'ksa',
    description:
      'The Korean Student Association (KSA) is one of the most active cultural organizations on campus. We celebrate Korean culture through food festivals, K-Pop dance showcases, language exchanges, and our annual KSA Show. Open to all students regardless of background. Come hang out and make lifelong friends!',
    short_description:
      'Celebrating Korean culture through events, food, and community.',
    category: ClubCategory.Cultural,
    logo_url: 'https://picsum.photos/seed/ksa/200',
    cover_url: 'https://picsum.photos/seed/ksa-cover/800/400',
    meeting_schedule: 'Fridays, 7:00 PM, Stamp 2103',
    contact_email: 'ksa@terpmail.umd.edu',
    social_links: {
      instagram: 'https://instagram.com/umdksa',
      discord: 'https://discord.gg/umdksa',
    },
    member_count: 200,
    is_active: true,
    created_by: 'user-006',
    created_at: '2012-09-01T00:00:00Z',
  },
];

// ── Mock Users for Member Lists ──────────────────────────────

export const mockUsers: User[] = [
  {
    id: 'user-001',
    email: 'alexj@terpmail.umd.edu',
    username: appProfile.handle,
    display_name: appProfile.name,
    avatar_url: appProfile.avatar,
    major: appProfile.major,
    graduation_year: appProfile.classYear,
    bio: appProfile.bio,
    notification_prefs: { push_enabled: true, email_enabled: true, club_updates: true, event_reminders: true, feed_activity: true },
    created_at: '2023-08-15T00:00:00Z',
  },
  {
    id: 'user-002',
    email: 'sarah.m@terpmail.umd.edu',
    display_name: 'Sarah Martinez',
    avatar_url: 'https://picsum.photos/seed/sarah/200',
    major: 'Mechanical Engineering',
    graduation_year: 2025,
    bio: 'Team lead for Terps Racing. Building fast cars.',
    notification_prefs: { push_enabled: true, email_enabled: true, club_updates: true, event_reminders: true, feed_activity: false },
    created_at: '2022-09-01T00:00:00Z',
  },
  {
    id: 'user-003',
    email: 'jordan.k@terpmail.umd.edu',
    display_name: 'Jordan Kim',
    avatar_url: 'https://picsum.photos/seed/jordan/200',
    major: 'Information Science',
    graduation_year: 2027,
    bio: 'Love the outdoors and hiking trails.',
    notification_prefs: { push_enabled: true, email_enabled: false, club_updates: true, event_reminders: true, feed_activity: true },
    created_at: '2024-01-10T00:00:00Z',
  },
  {
    id: 'user-004',
    email: 'maya.p@terpmail.umd.edu',
    display_name: 'Maya Patel',
    avatar_url: 'https://picsum.photos/seed/maya/200',
    major: 'Government & Politics',
    graduation_year: 2026,
    bio: 'SGA Vice President. Fighting for student rights.',
    notification_prefs: { push_enabled: true, email_enabled: true, club_updates: true, event_reminders: true, feed_activity: true },
    created_at: '2023-09-01T00:00:00Z',
  },
  {
    id: 'user-005',
    email: 'tyler.w@terpmail.umd.edu',
    display_name: 'Tyler Washington',
    avatar_url: 'https://picsum.photos/seed/tyler/200',
    major: 'Music Performance',
    graduation_year: 2025,
    bio: 'Faux Paz music director.',
    notification_prefs: { push_enabled: true, email_enabled: true, club_updates: true, event_reminders: true, feed_activity: false },
    created_at: '2022-09-01T00:00:00Z',
  },
];

// ── Mock Club Members ────────────────────────────────────────

export const mockClubMembers: ClubMemberWithUser[] = [
  {
    club_id: 'club-001',
    user_id: 'user-001',
    role: MemberRole.President,
    status: MemberStatus.Approved,
    joined_at: '2022-09-01T00:00:00Z',
    user: mockUsers[0],
  },
  {
    club_id: 'club-001',
    user_id: 'user-003',
    role: MemberRole.Officer,
    status: MemberStatus.Approved,
    joined_at: '2023-09-15T00:00:00Z',
    user: mockUsers[2],
  },
  {
    club_id: 'club-001',
    user_id: 'user-004',
    role: MemberRole.Member,
    status: MemberStatus.Approved,
    joined_at: '2024-01-20T00:00:00Z',
    user: mockUsers[3],
  },
  {
    club_id: 'club-002',
    user_id: 'user-002',
    role: MemberRole.President,
    status: MemberStatus.Approved,
    joined_at: '2022-01-15T00:00:00Z',
    user: mockUsers[1],
  },
  {
    club_id: 'club-003',
    user_id: 'user-003',
    role: MemberRole.President,
    status: MemberStatus.Approved,
    joined_at: '2023-08-20T00:00:00Z',
    user: mockUsers[2],
  },
];

// ── Mock Join Requests ───────────────────────────────────────

export interface JoinRequest {
  id: string;
  club_id: string;
  user: User;
  status: MemberStatus;
  answers: string[];
  requested_at: string;
}

export const mockJoinRequests: JoinRequest[] = [
  {
    id: 'req-001',
    club_id: 'club-001',
    user: mockUsers[4],
    status: MemberStatus.Pending,
    answers: ['I want to learn web development and contribute to Bitcamp.'],
    requested_at: '2025-03-20T14:30:00Z',
  },
  {
    id: 'req-002',
    club_id: 'club-001',
    user: mockUsers[3],
    status: MemberStatus.Pending,
    answers: ['Interested in competitive programming and hackathons.'],
    requested_at: '2025-03-19T09:15:00Z',
  },
];

// Mock Club Events

export const mockClubEvents: Event[] = [
  {
    id: 'evt-c001',
    title: 'Bitcamp 2025',
    description: 'UMD\'s premier 36-hour hackathon. Build, learn, and win prizes!',
    club_id: 'club-001',
    created_by: 'user-001',
    category: EventCategory.Academic,
    starts_at: '2025-04-12T18:00:00Z',
    ends_at: '2025-04-14T06:00:00Z',
    location_name: 'Reckord Armory',
    latitude: 38.9887,
    longitude: -76.9420,
    image_url: 'https://picsum.photos/seed/bitcamp/800/400',
    rsvp_count: 850,
    attendee_count: 850,
    max_capacity: 1000,
    is_featured: true,
  },
  {
    id: 'evt-c002',
    title: 'Intro to React Workshop',
    description: 'Learn the basics of React.js in this beginner-friendly workshop.',
    club_id: 'club-001',
    created_by: 'user-001',
    category: EventCategory.Workshop,
    starts_at: '2025-03-28T19:00:00Z',
    ends_at: '2025-03-28T21:00:00Z',
    location_name: 'IRB 0324',
    latitude: 38.9891,
    longitude: -76.9365,
    image_url: null,
    rsvp_count: 45,
    attendee_count: 45,
    max_capacity: 60,
    is_featured: false,
  },
  {
    id: 'evt-c003',
    title: 'KSA Annual Show',
    description: 'Our biggest event of the year! Performances, food, and culture.',
    club_id: 'club-006',
    created_by: 'user-006',
    category: EventCategory.Arts,
    starts_at: '2025-04-05T18:00:00Z',
    ends_at: '2025-04-05T22:00:00Z',
    location_name: 'Stamp Grand Ballroom',
    latitude: 38.9882,
    longitude: -76.9447,
    image_url: 'https://picsum.photos/seed/ksashow/800/400',
    rsvp_count: 350,
    attendee_count: 350,
    max_capacity: 500,
    is_featured: true,
  },
];

// Mock Media

export interface ClubMedia {
  id: string;
  club_id: string;
  url: string;
  type: 'photo' | 'video';
  caption: string;
  created_at: string;
}

export const mockClubMedia: ClubMedia[] = [
  { id: 'media-001', club_id: 'club-001', url: 'https://picsum.photos/seed/h1/400/400', type: 'photo', caption: 'Bitcamp 2024 opening ceremony', created_at: '2024-04-14T00:00:00Z' },
  { id: 'media-002', club_id: 'club-001', url: 'https://picsum.photos/seed/h2/400/400', type: 'photo', caption: 'Workshop night', created_at: '2024-03-10T00:00:00Z' },
  { id: 'media-003', club_id: 'club-001', url: 'https://picsum.photos/seed/h3/400/400', type: 'photo', caption: 'Team social event', created_at: '2024-02-20T00:00:00Z' },
  { id: 'media-004', club_id: 'club-001', url: 'https://picsum.photos/seed/h4/400/400', type: 'photo', caption: 'HackUMD winners', created_at: '2024-11-15T00:00:00Z' },
  { id: 'media-005', club_id: 'club-006', url: 'https://picsum.photos/seed/k1/400/400', type: 'photo', caption: 'KSA Show rehearsal', created_at: '2024-04-01T00:00:00Z' },
  { id: 'media-006', club_id: 'club-006', url: 'https://picsum.photos/seed/k2/400/400', type: 'photo', caption: 'Korean BBQ social', created_at: '2024-03-15T00:00:00Z' },
  { id: 'media-007', club_id: 'club-003', url: 'https://picsum.photos/seed/o1/400/400', type: 'photo', caption: 'Shenandoah hike', created_at: '2024-10-20T00:00:00Z' },
  { id: 'media-008', club_id: 'club-003', url: 'https://picsum.photos/seed/o2/400/400', type: 'photo', caption: 'Kayaking trip', created_at: '2024-09-15T00:00:00Z' },
];

export function getClubIdsForUser(userId: string) {
  return mockClubMembers
    .filter((member) => member.user_id === userId && member.status === MemberStatus.Approved)
    .map((member) => member.club_id);
}
