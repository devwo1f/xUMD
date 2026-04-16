import { Club, ClubMemberWithUser, User, Event } from '../../shared/types';

export const mockClubs = [
  {
    "id": "aaa41ac9-63e0-592f-a177-be36e8b212ee",
    "name": "UMD Hackers",
    "slug": "umd-hackers",
    "description": "UMD Hackers brings together students who love shipping projects, learning in public, and helping each other build. Weekly hack nights, mentor office hours, and collaborative sprint energy make this one of the easiest communities on campus to plug into quickly.",
    "short_description": "Hack nights, Bitcamp energy, and the most active builder community on campus.",
    "category": "academic",
    "logo_url": "https://ui-avatars.com/api/?name=UMD%20Hackers&background=E21833&color=ffffff&size=256&bold=true",
    "cover_url": "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=1400&q=80",
    "meeting_schedule": "Wednesdays, 7:00 PM - 9:00 PM, IRB 0324",
    "contact_email": "hello@umdhackers.org",
    "social_links": {
      "instagram": "https://instagram.com/umdhackers",
      "discord": "https://discord.gg/umdhackers",
      "website": "https://umdhackers.org"
    },
    "member_count": 7,
    "is_active": true,
    "created_by": "0b4c9322-5024-52dd-b93b-68b721c026ee",
    "created_at": "2025-06-19T14:00:00.000Z"
  },
  {
    "id": "94dc4785-694a-5b8a-b73d-d6e896187afb",
    "name": "Data Science Club",
    "slug": "data-science-club",
    "description": "Data Science Club is where students go to sharpen analytical skills with real campus-sized support. Members swap resume feedback, run collaborative workshops, and share practical project ideas that feel relevant to recruiting season.",
    "short_description": "Project demos, resume clinics, and a very friendly place to get unstuck in Python or SQL.",
    "category": "academic",
    "logo_url": "https://ui-avatars.com/api/?name=Data%20Science%20Club&background=E21833&color=ffffff&size=256&bold=true",
    "cover_url": "https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=1400&q=80",
    "meeting_schedule": "Tuesdays, 6:30 PM - 8:00 PM, MCK 6137",
    "contact_email": "datascience@terpmail.umd.edu",
    "social_links": {
      "instagram": "https://instagram.com/umddatascience",
      "website": "https://umddatascience.club"
    },
    "member_count": 8,
    "is_active": true,
    "created_by": "f360a23b-4f3d-566a-959f-ea05849e43ab",
    "created_at": "2025-06-18T14:00:00.000Z"
  },
  {
    "id": "0e68c4f2-2b14-505c-972d-dda49fca824a",
    "name": "Terp Entrepreneurs",
    "slug": "terp-entrepreneurs",
    "description": "Terp Entrepreneurs is a home for students building side projects, testing startup ideas, and learning from founders a few steps ahead. Meetings mix practical feedback with honest conversation about what it takes to actually launch something.",
    "short_description": "Pitch practice, founder stories, and a genuinely supportive room for trying ideas out loud.",
    "category": "professional",
    "logo_url": "https://ui-avatars.com/api/?name=Terp%20Entrepreneurs&background=E21833&color=ffffff&size=256&bold=true",
    "cover_url": "https://images.unsplash.com/photo-1552664730-d307ca884978?auto=format&fit=crop&w=1400&q=80",
    "meeting_schedule": "Thursdays, 7:00 PM - 8:30 PM, VMH 1208",
    "contact_email": "hello@terpentrepreneurs.org",
    "social_links": {
      "instagram": "https://instagram.com/terpentrepreneurs",
      "linkedin": "https://linkedin.com/company/terpentrepreneurs",
      "website": "https://terpentrepreneurs.org"
    },
    "member_count": 7,
    "is_active": true,
    "created_by": "3a44d09f-f9ee-5606-8958-3cdb4d945381",
    "created_at": "2025-06-17T14:00:00.000Z"
  },
  {
    "id": "93df5013-9ec9-56e2-8f1e-dbbb52ad5feb",
    "name": "Maryland Running Club",
    "slug": "maryland-running-club",
    "description": "Maryland Running Club welcomes every pace. The club mixes evening campus loops, training blocks for upcoming races, and social coffee hangs that make it easier to keep showing up week after week.",
    "short_description": "Low-pressure group runs, race prep, and the nicest accountability system on campus.",
    "category": "sports",
    "logo_url": "https://ui-avatars.com/api/?name=Maryland%20Running%20Club&background=E21833&color=ffffff&size=256&bold=true",
    "cover_url": "https://images.unsplash.com/photo-1552674605-db6ffd4facb5?auto=format&fit=crop&w=1400&q=80",
    "meeting_schedule": "Mondays & Thursdays, 6:00 PM, ERC Front Steps",
    "contact_email": "runterps@terpmail.umd.edu",
    "social_links": {
      "instagram": "https://instagram.com/marylandrunningclub"
    },
    "member_count": 6,
    "is_active": true,
    "created_by": "9ffda673-63bb-542b-9b0d-0de86e4557ee",
    "created_at": "2025-06-16T14:00:00.000Z"
  },
  {
    "id": "2c3160cc-928d-54c2-817c-2abc9ad857bf",
    "name": "Bhangra at UMD",
    "slug": "bhangra-at-umd",
    "description": "Bhangra at UMD blends high-energy rehearsal nights with the kind of team atmosphere that keeps people coming back. Performances, campus showcases, and beginner-friendly open practices make it feel welcoming without losing ambition.",
    "short_description": "Rehearsals that go hard, showcase energy, and a team culture people rave about.",
    "category": "arts",
    "logo_url": "https://ui-avatars.com/api/?name=Bhangra%20at%20UMD&background=E21833&color=ffffff&size=256&bold=true",
    "cover_url": "https://images.unsplash.com/photo-1516280440614-37939bbacd81?auto=format&fit=crop&w=1400&q=80",
    "meeting_schedule": "Sundays, 7:30 PM - 9:30 PM, The Clarice Rehearsal Room",
    "contact_email": "bhangra@terpmail.umd.edu",
    "social_links": {
      "instagram": "https://instagram.com/bhangraatumd"
    },
    "member_count": 7,
    "is_active": true,
    "created_by": "77de58eb-8b78-5ad5-b5bb-a310726ca240",
    "created_at": "2025-06-15T14:00:00.000Z"
  },
  {
    "id": "189a718a-77c7-592f-b26f-c25f576a21b8",
    "name": "Society of Women Engineers",
    "slug": "society-of-women-engineers",
    "description": "SWE at Maryland creates space for women and allies in engineering to share advice, build confidence, and make recruiting feel less isolating. Panels, peer prep, and mentorship dinners keep the club active through the semester.",
    "short_description": "Professional development with a warm, practical, everyone-helps-each-other vibe.",
    "category": "professional",
    "logo_url": "https://ui-avatars.com/api/?name=Society%20of%20Women%20Engineers&background=E21833&color=ffffff&size=256&bold=true",
    "cover_url": "https://images.unsplash.com/photo-1521737711867-e3b97375f902?auto=format&fit=crop&w=1400&q=80",
    "meeting_schedule": "Tuesdays, 7:00 PM - 8:30 PM, ESJ 2204",
    "contact_email": "swe@terpmail.umd.edu",
    "social_links": {
      "instagram": "https://instagram.com/umdswe",
      "website": "https://swe.umd.edu"
    },
    "member_count": 5,
    "is_active": true,
    "created_by": "3871303c-e94e-56e3-b1ea-57ba9b0bc0c1",
    "created_at": "2025-06-14T14:00:00.000Z"
  },
  {
    "id": "646d7bc1-956c-593b-baec-109a7a9720b6",
    "name": "Maryland Outdoors Club",
    "slug": "maryland-outdoors-club",
    "description": "Maryland Outdoors Club makes adventure feel accessible, even if you have never done a trip before. Planning sessions are straightforward, leaders are calm and organized, and the community tends to pull new people in quickly.",
    "short_description": "Trips, hikes, gear nights, and a reliable reason to leave your laptop behind for a few hours.",
    "category": "social",
    "logo_url": "https://ui-avatars.com/api/?name=Maryland%20Outdoors%20Club&background=E21833&color=ffffff&size=256&bold=true",
    "cover_url": "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1400&q=80",
    "meeting_schedule": "Mondays, 8:00 PM, HBK 1102",
    "contact_email": "outdoors@terpmail.umd.edu",
    "social_links": {
      "instagram": "https://instagram.com/marylandoutdoorsclub",
      "discord": "https://discord.gg/marylandoutdoors"
    },
    "member_count": 5,
    "is_active": true,
    "created_by": "dceb7801-ef4a-5c0d-8c77-d45c18b15df1",
    "created_at": "2025-06-13T14:00:00.000Z"
  },
  {
    "id": "572b2a79-031d-5b9e-b4bb-5a727906def8",
    "name": "Korean Student Association",
    "slug": "korean-student-association",
    "description": "KSA builds community through cultural programs, relaxed socials, and events that bring people together across majors and friend groups. The club balances big showcase moments with low-key community nights that still draw a strong crowd.",
    "short_description": "Language exchange nights, food events, and one of the easiest communities to feel at home in.",
    "category": "cultural",
    "logo_url": "https://ui-avatars.com/api/?name=Korean%20Student%20Association&background=E21833&color=ffffff&size=256&bold=true",
    "cover_url": "https://images.unsplash.com/photo-1529156069898-49953e39b3ac?auto=format&fit=crop&w=1400&q=80",
    "meeting_schedule": "Fridays, 7:00 PM, Stamp Colony Ballroom",
    "contact_email": "ksa@terpmail.umd.edu",
    "social_links": {
      "instagram": "https://instagram.com/umdksa"
    },
    "member_count": 6,
    "is_active": true,
    "created_by": "7e1d57eb-5dc7-58f1-8fe1-a165779a5ddd",
    "created_at": "2025-06-12T14:00:00.000Z"
  },
  {
    "id": "673363a9-c22b-5446-98ac-37c379aaed6a",
    "name": "Creative Coding Collective",
    "slug": "creative-coding-collective",
    "description": "Creative Coding Collective sits at the intersection of art, code, and playful experimentation. Meetings feel like a studio session more than a lecture, which makes it a great landing spot for people who want to make expressive work together.",
    "short_description": "Screens, sketches, installations, and late-night experiments that somehow become real projects.",
    "category": "arts",
    "logo_url": "https://ui-avatars.com/api/?name=Creative%20Coding%20Collective&background=E21833&color=ffffff&size=256&bold=true",
    "cover_url": "https://images.unsplash.com/photo-1517694712202-14dd9538aa97?auto=format&fit=crop&w=1400&q=80",
    "meeting_schedule": "Wednesdays, 6:30 PM - 8:30 PM, Clarice Makers Studio",
    "contact_email": "creativecoding@terpmail.umd.edu",
    "social_links": {
      "instagram": "https://instagram.com/creativecodingumd"
    },
    "member_count": 6,
    "is_active": true,
    "created_by": "af45b9b4-fb14-5b6d-bbcd-5ffcc64bf110",
    "created_at": "2025-06-11T14:00:00.000Z"
  },
  {
    "id": "b934a1b0-cf09-5fba-b612-1b8d8ee70570",
    "name": "Terps for Change",
    "slug": "terps-for-change",
    "description": "Terps for Change focuses on practical service work with enough structure to make busy schedules manageable. Members rotate through kit-packing nights, campus drives, and local partner events that feel immediate and tangible.",
    "short_description": "Service projects that are actually organized well and easy to join, even mid-semester.",
    "category": "service",
    "logo_url": "https://ui-avatars.com/api/?name=Terps%20for%20Change&background=E21833&color=ffffff&size=256&bold=true",
    "cover_url": "https://images.unsplash.com/photo-1469571486292-b53601020f1f?auto=format&fit=crop&w=1400&q=80",
    "meeting_schedule": "Thursdays, 6:00 PM, Stamp Student Involvement Suite",
    "contact_email": "terpsforchange@terpmail.umd.edu",
    "social_links": {
      "instagram": "https://instagram.com/terpsforchange"
    },
    "member_count": 5,
    "is_active": true,
    "created_by": "a49d4554-325c-5c88-afaa-ef947f0a115a",
    "created_at": "2025-06-10T14:00:00.000Z"
  },
  {
    "id": "44f63ee3-2917-5ac3-84f4-0ab9aa8cbe2a",
    "name": "Film Society at Maryland",
    "slug": "film-society-at-maryland",
    "description": "Film Society at Maryland curates campus screenings, director spotlights, and collaborative discussion nights. It is part film club, part creative community, and a consistent source of high-quality event posters.",
    "short_description": "Screenings, critiques, and the kind of post-film conversations that somehow last an extra hour.",
    "category": "arts",
    "logo_url": "https://ui-avatars.com/api/?name=Film%20Society%20at%20Maryland&background=E21833&color=ffffff&size=256&bold=true",
    "cover_url": "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=1400&q=80",
    "meeting_schedule": "Thursdays, 8:00 PM, HBK 0101",
    "contact_email": "filmsociety@terpmail.umd.edu",
    "social_links": {
      "instagram": "https://instagram.com/umdfilmsociety"
    },
    "member_count": 7,
    "is_active": true,
    "created_by": "1941e5a9-753c-5055-b24d-ff4990dd714e",
    "created_at": "2025-06-09T14:00:00.000Z"
  }
] as Club[];

export const mockUsers = [
  {
    "id": "6667ca7e-5d07-5fd3-ab93-276110c38063",
    "email": "alexj_test@terpmail.umd.edu",
    "username": "alexj_terp",
    "display_name": "Alex Johnson",
    "avatar_url": "https://i.pravatar.cc/300?u=alexj_terp",
    "major": "Computer Science",
    "graduation_year": 2026,
    "degree_type": "bs",
    "minor": "Technology Entrepreneurship",
    "bio": "Building things at UMD. Coffee enthusiast, campus explorer, and always down for a late-night build sprint.",
    "pronouns": "they/them",
    "clubs": [
      "UMD Hackers",
      "Data Science Club",
      "Terp Entrepreneurs",
      "Maryland Outdoors Club"
    ],
    "courses": [
      "CMSC216",
      "CMSC330",
      "STAT400",
      "BMGT220"
    ],
    "interests": [
      "builders",
      "startups",
      "campus-life",
      "design",
      "coffee",
      "community"
    ],
    "follower_count": 10,
    "following_count": 5,
    "notification_prefs": {
      "push_enabled": true,
      "email_enabled": true,
      "club_updates": true,
      "event_reminders": true,
      "feed_activity": true
    },
    "push_token": null,
    "profile_completed": true,
    "onboarding_step": 3,
    "created_at": "2025-12-16T14:00:00.000Z",
    "updated_at": "2026-04-13T16:00:00.000Z"
  },
  {
    "id": "79af4eed-7d3d-5729-8963-46e04646d23b",
    "email": "nia.brooks@terpmail.umd.edu",
    "username": "nia_builds",
    "display_name": "Nia Brooks",
    "avatar_url": "https://i.pravatar.cc/300?u=nia_builds",
    "major": "Information Science",
    "graduation_year": 2027,
    "degree_type": "bs",
    "minor": "Human-Computer Interaction",
    "bio": "Infosci student who bounces between Figma files, product strategy, and whoever needs a design critique.",
    "pronouns": "she/her",
    "clubs": [
      "UMD Hackers",
      "Terp Entrepreneurs",
      "Society of Women Engineers",
      "Creative Coding Collective"
    ],
    "courses": [
      "INST201",
      "DATA100",
      "ENGL101"
    ],
    "interests": [
      "design",
      "product",
      "builders",
      "community",
      "mentorship"
    ],
    "follower_count": 1,
    "following_count": 4,
    "notification_prefs": {
      "push_enabled": true,
      "email_enabled": true,
      "club_updates": true,
      "event_reminders": true,
      "feed_activity": true
    },
    "push_token": null,
    "profile_completed": true,
    "onboarding_step": 3,
    "created_at": "2025-12-17T14:00:00.000Z",
    "updated_at": "2026-04-12T16:00:00.000Z"
  },
  {
    "id": "0b4c9322-5024-52dd-b93b-68b721c026ee",
    "email": "daniel.park@terpmail.umd.edu",
    "username": "danielpark",
    "display_name": "Daniel Park",
    "avatar_url": "https://i.pravatar.cc/300?u=danielpark",
    "major": "Computer Science",
    "graduation_year": 2025,
    "degree_type": "bs",
    "minor": "Mathematics",
    "bio": "Senior CS student, hackathon organizer, and the person who always knows which Iribe room is still open.",
    "pronouns": "he/him",
    "clubs": [
      "UMD Hackers",
      "Data Science Club",
      "Korean Student Association"
    ],
    "courses": [
      "CMSC216",
      "CMSC351",
      "MATH141"
    ],
    "interests": [
      "coding",
      "hackathons",
      "mentorship",
      "systems",
      "community"
    ],
    "follower_count": 7,
    "following_count": 3,
    "notification_prefs": {
      "push_enabled": true,
      "email_enabled": true,
      "club_updates": true,
      "event_reminders": true,
      "feed_activity": true
    },
    "push_token": null,
    "profile_completed": true,
    "onboarding_step": 3,
    "created_at": "2025-12-18T14:00:00.000Z",
    "updated_at": "2026-04-11T16:00:00.000Z"
  },
  {
    "id": "3871303c-e94e-56e3-b1ea-57ba9b0bc0c1",
    "email": "priya.shah@terpmail.umd.edu",
    "username": "priya_shah",
    "display_name": "Priya Shah",
    "avatar_url": "https://i.pravatar.cc/300?u=priya_shah",
    "major": "Biology",
    "graduation_year": 2026,
    "degree_type": "bs",
    "minor": "Data Science",
    "bio": "Bio major balancing lab hours, club leadership, and a permanent search for the best study corner on campus.",
    "pronouns": "she/her",
    "clubs": [
      "Data Science Club",
      "Maryland Running Club",
      "Bhangra at UMD",
      "Society of Women Engineers"
    ],
    "courses": [
      "PHYS161",
      "STAT400",
      "ENGL101"
    ],
    "interests": [
      "wellness",
      "research",
      "service",
      "dance",
      "study-spots"
    ],
    "follower_count": 2,
    "following_count": 4,
    "notification_prefs": {
      "push_enabled": true,
      "email_enabled": true,
      "club_updates": true,
      "event_reminders": true,
      "feed_activity": true
    },
    "push_token": null,
    "profile_completed": true,
    "onboarding_step": 3,
    "created_at": "2025-12-19T14:00:00.000Z",
    "updated_at": "2026-04-13T16:00:00.000Z"
  },
  {
    "id": "5a90dcaa-9700-59fb-9cc9-66b19e06e6d6",
    "email": "marcus.thompson@terpmail.umd.edu",
    "username": "marcus_t",
    "display_name": "Marcus Thompson",
    "avatar_url": "https://i.pravatar.cc/300?u=marcus_t",
    "major": "Mechanical Engineering",
    "graduation_year": 2026,
    "degree_type": "bs",
    "minor": null,
    "bio": "Mechanical engineering, early morning runs, and the loudest student-section energy you will ever meet.",
    "pronouns": "he/him",
    "clubs": [
      "Maryland Running Club",
      "Maryland Outdoors Club",
      "Korean Student Association"
    ],
    "courses": [
      "PHYS161",
      "MATH141"
    ],
    "interests": [
      "fitness",
      "sports",
      "engineering",
      "outdoors",
      "campus-events"
    ],
    "follower_count": 4,
    "following_count": 3,
    "notification_prefs": {
      "push_enabled": true,
      "email_enabled": true,
      "club_updates": true,
      "event_reminders": true,
      "feed_activity": true
    },
    "push_token": null,
    "profile_completed": true,
    "onboarding_step": 3,
    "created_at": "2025-12-20T14:00:00.000Z",
    "updated_at": "2026-04-12T16:00:00.000Z"
  },
  {
    "id": "a49d4554-325c-5c88-afaa-ef947f0a115a",
    "email": "maya.patel@terpmail.umd.edu",
    "username": "maya_p",
    "display_name": "Maya Patel",
    "avatar_url": "https://i.pravatar.cc/300?u=maya_p",
    "major": "Government and Politics",
    "graduation_year": 2027,
    "degree_type": "ba",
    "minor": "Nonprofit Leadership",
    "bio": "Policy nerd, service organizer, and the friend who will always send you the registration deadline first.",
    "pronouns": "she/her",
    "clubs": [
      "Bhangra at UMD",
      "Society of Women Engineers",
      "Terps for Change",
      "Film Society at Maryland"
    ],
    "courses": [
      "ENGL101",
      "BMGT220"
    ],
    "interests": [
      "service",
      "advocacy",
      "community",
      "culture",
      "leadership"
    ],
    "follower_count": 0,
    "following_count": 4,
    "notification_prefs": {
      "push_enabled": true,
      "email_enabled": true,
      "club_updates": true,
      "event_reminders": true,
      "feed_activity": true
    },
    "push_token": null,
    "profile_completed": true,
    "onboarding_step": 3,
    "created_at": "2025-12-21T14:00:00.000Z",
    "updated_at": "2026-04-11T16:00:00.000Z"
  },
  {
    "id": "bf962ba5-980e-5ed4-b080-3ddad5c2e760",
    "email": "leena.rao@terpmail.umd.edu",
    "username": "leena_rao",
    "display_name": "Leena Rao",
    "avatar_url": "https://i.pravatar.cc/300?u=leena_rao",
    "major": "Finance",
    "graduation_year": 2026,
    "degree_type": "bs",
    "minor": "Technology Entrepreneurship",
    "bio": "Usually somewhere between a pitch deck, a rehearsal, and a coffee run through Stamp.",
    "pronouns": "she/her",
    "clubs": [
      "Terp Entrepreneurs",
      "Bhangra at UMD",
      "Film Society at Maryland"
    ],
    "courses": [
      "BMGT220",
      "STAT400"
    ],
    "interests": [
      "startups",
      "music",
      "community",
      "culture",
      "events"
    ],
    "follower_count": 7,
    "following_count": 3,
    "notification_prefs": {
      "push_enabled": true,
      "email_enabled": true,
      "club_updates": true,
      "event_reminders": true,
      "feed_activity": true
    },
    "push_token": null,
    "profile_completed": true,
    "onboarding_step": 3,
    "created_at": "2025-12-22T14:00:00.000Z",
    "updated_at": "2026-04-13T16:00:00.000Z"
  },
  {
    "id": "f360a23b-4f3d-566a-959f-ea05849e43ab",
    "email": "ethan.kim@terpmail.umd.edu",
    "username": "ethan_kim",
    "display_name": "Ethan Kim",
    "avatar_url": "https://i.pravatar.cc/300?u=ethan_kim",
    "major": "Data Science",
    "graduation_year": 2025,
    "degree_type": "bs",
    "minor": "Computer Science",
    "bio": "Data science lead who genuinely thinks a clean SQL query can fix at least half of life.",
    "pronouns": "he/him",
    "clubs": [
      "UMD Hackers",
      "Data Science Club",
      "Creative Coding Collective"
    ],
    "courses": [
      "DATA200",
      "STAT400",
      "CMSC216"
    ],
    "interests": [
      "data",
      "analytics",
      "coding",
      "careers",
      "mentorship"
    ],
    "follower_count": 9,
    "following_count": 3,
    "notification_prefs": {
      "push_enabled": true,
      "email_enabled": true,
      "club_updates": true,
      "event_reminders": true,
      "feed_activity": true
    },
    "push_token": null,
    "profile_completed": true,
    "onboarding_step": 3,
    "created_at": "2025-12-23T14:00:00.000Z",
    "updated_at": "2026-04-12T16:00:00.000Z"
  },
  {
    "id": "ca86602c-434a-50de-af39-90312889c45d",
    "email": "sofia.alvarez@terpmail.umd.edu",
    "username": "sofia_alvarez",
    "display_name": "Sofia Alvarez",
    "avatar_url": "https://i.pravatar.cc/300?u=sofia_alvarez",
    "major": "Journalism",
    "graduation_year": 2027,
    "degree_type": "ba",
    "minor": "Film Studies",
    "bio": "Campus storyteller with a camera roll full of sunsets, events, and people being unexpectedly iconic.",
    "pronouns": "she/her",
    "clubs": [
      "Terp Entrepreneurs",
      "Creative Coding Collective",
      "Terps for Change",
      "Film Society at Maryland"
    ],
    "courses": [
      "ENGL101"
    ],
    "interests": [
      "film",
      "storytelling",
      "community",
      "arts",
      "photography"
    ],
    "follower_count": 0,
    "following_count": 4,
    "notification_prefs": {
      "push_enabled": true,
      "email_enabled": true,
      "club_updates": true,
      "event_reminders": true,
      "feed_activity": true
    },
    "push_token": null,
    "profile_completed": true,
    "onboarding_step": 3,
    "created_at": "2025-12-24T14:00:00.000Z",
    "updated_at": "2026-04-11T16:00:00.000Z"
  },
  {
    "id": "dceb7801-ef4a-5c0d-8c77-d45c18b15df1",
    "email": "jordan.kim@terpmail.umd.edu",
    "username": "jordank_umd",
    "display_name": "Jordan Kim",
    "avatar_url": "https://i.pravatar.cc/300?u=jordank_umd",
    "major": "Environmental Science",
    "graduation_year": 2026,
    "degree_type": "bs",
    "minor": "Geographical Sciences",
    "bio": "Outdoors club president, trail planner, and champion of touching grass during midterm season.",
    "pronouns": "they/them",
    "clubs": [
      "Maryland Running Club",
      "Maryland Outdoors Club",
      "Terps for Change"
    ],
    "courses": [
      "ENGL101",
      "PHYS161"
    ],
    "interests": [
      "outdoors",
      "sustainability",
      "community",
      "fitness",
      "travel"
    ],
    "follower_count": 2,
    "following_count": 3,
    "notification_prefs": {
      "push_enabled": true,
      "email_enabled": true,
      "club_updates": true,
      "event_reminders": true,
      "feed_activity": true
    },
    "push_token": null,
    "profile_completed": true,
    "onboarding_step": 3,
    "created_at": "2025-12-25T14:00:00.000Z",
    "updated_at": "2026-04-13T16:00:00.000Z"
  },
  {
    "id": "9ffda673-63bb-542b-9b0d-0de86e4557ee",
    "email": "aaliyah.green@terpmail.umd.edu",
    "username": "aaliyah_green",
    "display_name": "Aaliyah Green",
    "avatar_url": "https://i.pravatar.cc/300?u=aaliyah_green",
    "major": "Kinesiology",
    "graduation_year": 2027,
    "degree_type": "bs",
    "minor": null,
    "bio": "Running club captain, wellness advocate, and always trying to convince people that morning movement is worth it.",
    "pronouns": "she/her",
    "clubs": [
      "Maryland Running Club",
      "Society of Women Engineers",
      "Terps for Change"
    ],
    "courses": [
      "PHYS161",
      "ENGL101"
    ],
    "interests": [
      "running",
      "wellness",
      "community",
      "sports",
      "service"
    ],
    "follower_count": 5,
    "following_count": 3,
    "notification_prefs": {
      "push_enabled": true,
      "email_enabled": true,
      "club_updates": true,
      "event_reminders": true,
      "feed_activity": true
    },
    "push_token": null,
    "profile_completed": true,
    "onboarding_step": 3,
    "created_at": "2025-12-26T14:00:00.000Z",
    "updated_at": "2026-04-12T16:00:00.000Z"
  },
  {
    "id": "7ebd3331-9d3e-5d07-b957-dbb6cb18760f",
    "email": "rahul.mehta@terpmail.umd.edu",
    "username": "rahulm",
    "display_name": "Rahul Mehta",
    "avatar_url": "https://i.pravatar.cc/300?u=rahulm",
    "major": "Electrical Engineering",
    "graduation_year": 2026,
    "degree_type": "bs",
    "minor": "Robotics",
    "bio": "Usually carrying a soldering kit, a half-built side project, or both.",
    "pronouns": "he/him",
    "clubs": [
      "UMD Hackers",
      "Data Science Club",
      "Bhangra at UMD"
    ],
    "courses": [
      "PHYS161",
      "CMSC216",
      "MATH141"
    ],
    "interests": [
      "engineering",
      "robotics",
      "coding",
      "culture",
      "maker-space"
    ],
    "follower_count": 0,
    "following_count": 3,
    "notification_prefs": {
      "push_enabled": true,
      "email_enabled": true,
      "club_updates": true,
      "event_reminders": true,
      "feed_activity": true
    },
    "push_token": null,
    "profile_completed": true,
    "onboarding_step": 3,
    "created_at": "2025-12-27T14:00:00.000Z",
    "updated_at": "2026-04-11T16:00:00.000Z"
  },
  {
    "id": "3a44d09f-f9ee-5606-8958-3cdb4d945381",
    "email": "grace.chen@terpmail.umd.edu",
    "username": "gracechen",
    "display_name": "Grace Chen",
    "avatar_url": "https://i.pravatar.cc/300?u=gracechen",
    "major": "Finance",
    "graduation_year": 2025,
    "degree_type": "bs",
    "minor": "Statistics",
    "bio": "Founder-energy all day. Loves thoughtful questions, practical advice, and a room full of ambitious people.",
    "pronouns": "she/her",
    "clubs": [
      "Data Science Club",
      "Terp Entrepreneurs",
      "Society of Women Engineers"
    ],
    "courses": [
      "BMGT220",
      "STAT400"
    ],
    "interests": [
      "startups",
      "careers",
      "networking",
      "analytics",
      "community"
    ],
    "follower_count": 6,
    "following_count": 3,
    "notification_prefs": {
      "push_enabled": true,
      "email_enabled": true,
      "club_updates": true,
      "event_reminders": true,
      "feed_activity": true
    },
    "push_token": null,
    "profile_completed": true,
    "onboarding_step": 3,
    "created_at": "2025-12-28T14:00:00.000Z",
    "updated_at": "2026-04-13T16:00:00.000Z"
  },
  {
    "id": "c0957686-8810-518a-8a56-df06c240f785",
    "email": "omar.hassan@terpmail.umd.edu",
    "username": "omarh",
    "display_name": "Omar Hassan",
    "avatar_url": "https://i.pravatar.cc/300?u=omarh",
    "major": "Computer Science",
    "graduation_year": 2026,
    "degree_type": "bs",
    "minor": "Immersive Media Design",
    "bio": "Creative technologist who likes weird interfaces, clean code, and events with a strong vibe.",
    "pronouns": "he/him",
    "clubs": [
      "UMD Hackers",
      "Terp Entrepreneurs",
      "Creative Coding Collective",
      "Film Society at Maryland"
    ],
    "courses": [
      "CMSC330",
      "CMSC351",
      "STAT400"
    ],
    "interests": [
      "creative-tech",
      "coding",
      "design",
      "film",
      "startups"
    ],
    "follower_count": 0,
    "following_count": 4,
    "notification_prefs": {
      "push_enabled": true,
      "email_enabled": true,
      "club_updates": true,
      "event_reminders": true,
      "feed_activity": true
    },
    "push_token": null,
    "profile_completed": true,
    "onboarding_step": 3,
    "created_at": "2025-12-29T14:00:00.000Z",
    "updated_at": "2026-04-12T16:00:00.000Z"
  },
  {
    "id": "7e1d57eb-5dc7-58f1-8fe1-a165779a5ddd",
    "email": "hannah.lee@terpmail.umd.edu",
    "username": "hannah_lee",
    "display_name": "Hannah Lee",
    "avatar_url": "https://i.pravatar.cc/300?u=hannah_lee",
    "major": "Public Health Science",
    "graduation_year": 2027,
    "degree_type": "bs",
    "minor": "Asian American Studies",
    "bio": "KSA president, outdoors regular, and forever making spreadsheets for things that do not need spreadsheets.",
    "pronouns": "she/her",
    "clubs": [
      "Maryland Running Club",
      "Bhangra at UMD",
      "Maryland Outdoors Club",
      "Korean Student Association"
    ],
    "courses": [
      "PHYS161",
      "STAT400"
    ],
    "interests": [
      "culture",
      "community",
      "wellness",
      "outdoors",
      "events"
    ],
    "follower_count": 6,
    "following_count": 4,
    "notification_prefs": {
      "push_enabled": true,
      "email_enabled": true,
      "club_updates": true,
      "event_reminders": true,
      "feed_activity": true
    },
    "push_token": null,
    "profile_completed": true,
    "onboarding_step": 3,
    "created_at": "2025-12-30T14:00:00.000Z",
    "updated_at": "2026-04-11T16:00:00.000Z"
  },
  {
    "id": "9e36e2f6-f994-573b-b8f8-5e7ee6c3a6f4",
    "email": "david.okafor@terpmail.umd.edu",
    "username": "davidok",
    "display_name": "David Okafor",
    "avatar_url": "https://i.pravatar.cc/300?u=davidok",
    "major": "Computer Engineering",
    "graduation_year": 2025,
    "degree_type": "bs",
    "minor": null,
    "bio": "Hardware + software + service hours. Finds a way to help before anyone asks.",
    "pronouns": "he/him",
    "clubs": [
      "UMD Hackers",
      "Data Science Club",
      "Terps for Change"
    ],
    "courses": [
      "CMSC216",
      "PHYS161",
      "MATH141"
    ],
    "interests": [
      "engineering",
      "service",
      "coding",
      "mentorship",
      "community"
    ],
    "follower_count": 0,
    "following_count": 3,
    "notification_prefs": {
      "push_enabled": true,
      "email_enabled": true,
      "club_updates": true,
      "event_reminders": true,
      "feed_activity": true
    },
    "push_token": null,
    "profile_completed": true,
    "onboarding_step": 3,
    "created_at": "2025-12-31T14:00:00.000Z",
    "updated_at": "2026-04-13T16:00:00.000Z"
  },
  {
    "id": "af45b9b4-fb14-5b6d-bbcd-5ffcc64bf110",
    "email": "chloe.nguyen@terpmail.umd.edu",
    "username": "chloecreates",
    "display_name": "Chloe Nguyen",
    "avatar_url": "https://i.pravatar.cc/300?u=chloecreates",
    "major": "Studio Art",
    "graduation_year": 2026,
    "degree_type": "ba",
    "minor": "Computer Science",
    "bio": "Creative Coding Collective president, poster-maker, and curator of niche but excellent campus playlists.",
    "pronouns": "she/her",
    "clubs": [
      "Bhangra at UMD",
      "Korean Student Association",
      "Creative Coding Collective",
      "Film Society at Maryland"
    ],
    "courses": [
      "ENGL101",
      "INST201"
    ],
    "interests": [
      "arts",
      "creative-tech",
      "design",
      "film",
      "culture"
    ],
    "follower_count": 2,
    "following_count": 4,
    "notification_prefs": {
      "push_enabled": true,
      "email_enabled": true,
      "club_updates": true,
      "event_reminders": true,
      "feed_activity": true
    },
    "push_token": null,
    "profile_completed": true,
    "onboarding_step": 3,
    "created_at": "2026-01-01T14:00:00.000Z",
    "updated_at": "2026-04-12T16:00:00.000Z"
  },
  {
    "id": "1941e5a9-753c-5055-b24d-ff4990dd714e",
    "email": "aaron.feldman@terpmail.umd.edu",
    "username": "aaronfeldman",
    "display_name": "Aaron Feldman",
    "avatar_url": "https://i.pravatar.cc/300?u=aaronfeldman",
    "major": "English",
    "graduation_year": 2027,
    "degree_type": "ba",
    "minor": "Film Studies",
    "bio": "Film Society lead programmer and enthusiastic defender of late-night screenings with strong discussion energy.",
    "pronouns": "he/him",
    "clubs": [
      "Maryland Outdoors Club",
      "Creative Coding Collective",
      "Film Society at Maryland"
    ],
    "courses": [
      "ENGL101"
    ],
    "interests": [
      "film",
      "arts",
      "storytelling",
      "community",
      "outdoors"
    ],
    "follower_count": 0,
    "following_count": 3,
    "notification_prefs": {
      "push_enabled": true,
      "email_enabled": true,
      "club_updates": true,
      "event_reminders": true,
      "feed_activity": true
    },
    "push_token": null,
    "profile_completed": true,
    "onboarding_step": 3,
    "created_at": "2026-01-02T14:00:00.000Z",
    "updated_at": "2026-04-11T16:00:00.000Z"
  },
  {
    "id": "77de58eb-8b78-5ad5-b5bb-a310726ca240",
    "email": "sana.mir@terpmail.umd.edu",
    "username": "sana_mir",
    "display_name": "Sana Mir",
    "avatar_url": "https://i.pravatar.cc/300?u=sana_mir",
    "major": "Neuroscience",
    "graduation_year": 2026,
    "degree_type": "bs",
    "minor": "Statistics",
    "bio": "Bhangra captain with equal love for stage lights, careful planning, and a solid post-event debrief.",
    "pronouns": "she/her",
    "clubs": [
      "Data Science Club",
      "Bhangra at UMD",
      "Korean Student Association"
    ],
    "courses": [
      "STAT400",
      "ENGL101"
    ],
    "interests": [
      "dance",
      "culture",
      "community",
      "wellness",
      "data"
    ],
    "follower_count": 9,
    "following_count": 3,
    "notification_prefs": {
      "push_enabled": true,
      "email_enabled": true,
      "club_updates": true,
      "event_reminders": true,
      "feed_activity": true
    },
    "push_token": null,
    "profile_completed": true,
    "onboarding_step": 3,
    "created_at": "2026-01-03T14:00:00.000Z",
    "updated_at": "2026-04-13T16:00:00.000Z"
  },
  {
    "id": "ee83f346-1b89-59ad-83b3-5ac6a979327e",
    "email": "tyler.bennett@terpmail.umd.edu",
    "username": "tyler_bennett",
    "display_name": "Tyler Bennett",
    "avatar_url": "https://i.pravatar.cc/300?u=tyler_bennett",
    "major": "Economics",
    "graduation_year": 2025,
    "degree_type": "ba",
    "minor": "General Business",
    "bio": "Shows up for founder talks, club screenings, and basically any event with a good crowd and better snacks.",
    "pronouns": "he/him",
    "clubs": [
      "Terp Entrepreneurs",
      "Maryland Running Club",
      "Korean Student Association",
      "Film Society at Maryland"
    ],
    "courses": [
      "BMGT220",
      "STAT400"
    ],
    "interests": [
      "careers",
      "community",
      "culture",
      "film",
      "running"
    ],
    "follower_count": 0,
    "following_count": 4,
    "notification_prefs": {
      "push_enabled": true,
      "email_enabled": true,
      "club_updates": true,
      "event_reminders": true,
      "feed_activity": true
    },
    "push_token": null,
    "profile_completed": true,
    "onboarding_step": 3,
    "created_at": "2026-01-04T14:00:00.000Z",
    "updated_at": "2026-04-12T16:00:00.000Z"
  }
] as User[];

export const mockClubMembers = [
  {
    "club_id": "aaa41ac9-63e0-592f-a177-be36e8b212ee",
    "user_id": "0b4c9322-5024-52dd-b93b-68b721c026ee",
    "role": "president",
    "status": "approved",
    "joined_at": "2026-01-15T17:00:00.000Z",
    "user": {
      "id": "0b4c9322-5024-52dd-b93b-68b721c026ee",
      "email": "daniel.park@terpmail.umd.edu",
      "username": "danielpark",
      "display_name": "Daniel Park",
      "avatar_url": "https://i.pravatar.cc/300?u=danielpark",
      "major": "Computer Science",
      "graduation_year": 2025,
      "degree_type": "bs",
      "minor": "Mathematics",
      "bio": "Senior CS student, hackathon organizer, and the person who always knows which Iribe room is still open.",
      "pronouns": "he/him",
      "clubs": [
        "UMD Hackers",
        "Data Science Club",
        "Korean Student Association"
      ],
      "courses": [
        "CMSC216",
        "CMSC351",
        "MATH141"
      ],
      "interests": [
        "coding",
        "hackathons",
        "mentorship",
        "systems",
        "community"
      ],
      "follower_count": 7,
      "following_count": 3,
      "notification_prefs": {
        "push_enabled": true,
        "email_enabled": true,
        "club_updates": true,
        "event_reminders": true,
        "feed_activity": true
      },
      "push_token": null,
      "profile_completed": true,
      "onboarding_step": 3,
      "created_at": "2025-12-18T14:00:00.000Z",
      "updated_at": "2026-04-11T16:00:00.000Z"
    }
  },
  {
    "club_id": "aaa41ac9-63e0-592f-a177-be36e8b212ee",
    "user_id": "6667ca7e-5d07-5fd3-ab93-276110c38063",
    "role": "officer",
    "status": "approved",
    "joined_at": "2026-01-14T17:00:00.000Z",
    "user": {
      "id": "6667ca7e-5d07-5fd3-ab93-276110c38063",
      "email": "alexj_test@terpmail.umd.edu",
      "username": "alexj_terp",
      "display_name": "Alex Johnson",
      "avatar_url": "https://i.pravatar.cc/300?u=alexj_terp",
      "major": "Computer Science",
      "graduation_year": 2026,
      "degree_type": "bs",
      "minor": "Technology Entrepreneurship",
      "bio": "Building things at UMD. Coffee enthusiast, campus explorer, and always down for a late-night build sprint.",
      "pronouns": "they/them",
      "clubs": [
        "UMD Hackers",
        "Data Science Club",
        "Terp Entrepreneurs",
        "Maryland Outdoors Club"
      ],
      "courses": [
        "CMSC216",
        "CMSC330",
        "STAT400",
        "BMGT220"
      ],
      "interests": [
        "builders",
        "startups",
        "campus-life",
        "design",
        "coffee",
        "community"
      ],
      "follower_count": 10,
      "following_count": 5,
      "notification_prefs": {
        "push_enabled": true,
        "email_enabled": true,
        "club_updates": true,
        "event_reminders": true,
        "feed_activity": true
      },
      "push_token": null,
      "profile_completed": true,
      "onboarding_step": 3,
      "created_at": "2025-12-16T14:00:00.000Z",
      "updated_at": "2026-04-13T16:00:00.000Z"
    }
  },
  {
    "club_id": "aaa41ac9-63e0-592f-a177-be36e8b212ee",
    "user_id": "f360a23b-4f3d-566a-959f-ea05849e43ab",
    "role": "officer",
    "status": "approved",
    "joined_at": "2026-01-13T17:00:00.000Z",
    "user": {
      "id": "f360a23b-4f3d-566a-959f-ea05849e43ab",
      "email": "ethan.kim@terpmail.umd.edu",
      "username": "ethan_kim",
      "display_name": "Ethan Kim",
      "avatar_url": "https://i.pravatar.cc/300?u=ethan_kim",
      "major": "Data Science",
      "graduation_year": 2025,
      "degree_type": "bs",
      "minor": "Computer Science",
      "bio": "Data science lead who genuinely thinks a clean SQL query can fix at least half of life.",
      "pronouns": "he/him",
      "clubs": [
        "UMD Hackers",
        "Data Science Club",
        "Creative Coding Collective"
      ],
      "courses": [
        "DATA200",
        "STAT400",
        "CMSC216"
      ],
      "interests": [
        "data",
        "analytics",
        "coding",
        "careers",
        "mentorship"
      ],
      "follower_count": 9,
      "following_count": 3,
      "notification_prefs": {
        "push_enabled": true,
        "email_enabled": true,
        "club_updates": true,
        "event_reminders": true,
        "feed_activity": true
      },
      "push_token": null,
      "profile_completed": true,
      "onboarding_step": 3,
      "created_at": "2025-12-23T14:00:00.000Z",
      "updated_at": "2026-04-12T16:00:00.000Z"
    }
  },
  {
    "club_id": "aaa41ac9-63e0-592f-a177-be36e8b212ee",
    "user_id": "79af4eed-7d3d-5729-8963-46e04646d23b",
    "role": "member",
    "status": "approved",
    "joined_at": "2026-01-12T17:00:00.000Z",
    "user": {
      "id": "79af4eed-7d3d-5729-8963-46e04646d23b",
      "email": "nia.brooks@terpmail.umd.edu",
      "username": "nia_builds",
      "display_name": "Nia Brooks",
      "avatar_url": "https://i.pravatar.cc/300?u=nia_builds",
      "major": "Information Science",
      "graduation_year": 2027,
      "degree_type": "bs",
      "minor": "Human-Computer Interaction",
      "bio": "Infosci student who bounces between Figma files, product strategy, and whoever needs a design critique.",
      "pronouns": "she/her",
      "clubs": [
        "UMD Hackers",
        "Terp Entrepreneurs",
        "Society of Women Engineers",
        "Creative Coding Collective"
      ],
      "courses": [
        "INST201",
        "DATA100",
        "ENGL101"
      ],
      "interests": [
        "design",
        "product",
        "builders",
        "community",
        "mentorship"
      ],
      "follower_count": 1,
      "following_count": 4,
      "notification_prefs": {
        "push_enabled": true,
        "email_enabled": true,
        "club_updates": true,
        "event_reminders": true,
        "feed_activity": true
      },
      "push_token": null,
      "profile_completed": true,
      "onboarding_step": 3,
      "created_at": "2025-12-17T14:00:00.000Z",
      "updated_at": "2026-04-12T16:00:00.000Z"
    }
  },
  {
    "club_id": "aaa41ac9-63e0-592f-a177-be36e8b212ee",
    "user_id": "7ebd3331-9d3e-5d07-b957-dbb6cb18760f",
    "role": "member",
    "status": "approved",
    "joined_at": "2026-01-11T17:00:00.000Z",
    "user": {
      "id": "7ebd3331-9d3e-5d07-b957-dbb6cb18760f",
      "email": "rahul.mehta@terpmail.umd.edu",
      "username": "rahulm",
      "display_name": "Rahul Mehta",
      "avatar_url": "https://i.pravatar.cc/300?u=rahulm",
      "major": "Electrical Engineering",
      "graduation_year": 2026,
      "degree_type": "bs",
      "minor": "Robotics",
      "bio": "Usually carrying a soldering kit, a half-built side project, or both.",
      "pronouns": "he/him",
      "clubs": [
        "UMD Hackers",
        "Data Science Club",
        "Bhangra at UMD"
      ],
      "courses": [
        "PHYS161",
        "CMSC216",
        "MATH141"
      ],
      "interests": [
        "engineering",
        "robotics",
        "coding",
        "culture",
        "maker-space"
      ],
      "follower_count": 0,
      "following_count": 3,
      "notification_prefs": {
        "push_enabled": true,
        "email_enabled": true,
        "club_updates": true,
        "event_reminders": true,
        "feed_activity": true
      },
      "push_token": null,
      "profile_completed": true,
      "onboarding_step": 3,
      "created_at": "2025-12-27T14:00:00.000Z",
      "updated_at": "2026-04-11T16:00:00.000Z"
    }
  },
  {
    "club_id": "aaa41ac9-63e0-592f-a177-be36e8b212ee",
    "user_id": "c0957686-8810-518a-8a56-df06c240f785",
    "role": "member",
    "status": "approved",
    "joined_at": "2026-01-10T17:00:00.000Z",
    "user": {
      "id": "c0957686-8810-518a-8a56-df06c240f785",
      "email": "omar.hassan@terpmail.umd.edu",
      "username": "omarh",
      "display_name": "Omar Hassan",
      "avatar_url": "https://i.pravatar.cc/300?u=omarh",
      "major": "Computer Science",
      "graduation_year": 2026,
      "degree_type": "bs",
      "minor": "Immersive Media Design",
      "bio": "Creative technologist who likes weird interfaces, clean code, and events with a strong vibe.",
      "pronouns": "he/him",
      "clubs": [
        "UMD Hackers",
        "Terp Entrepreneurs",
        "Creative Coding Collective",
        "Film Society at Maryland"
      ],
      "courses": [
        "CMSC330",
        "CMSC351",
        "STAT400"
      ],
      "interests": [
        "creative-tech",
        "coding",
        "design",
        "film",
        "startups"
      ],
      "follower_count": 0,
      "following_count": 4,
      "notification_prefs": {
        "push_enabled": true,
        "email_enabled": true,
        "club_updates": true,
        "event_reminders": true,
        "feed_activity": true
      },
      "push_token": null,
      "profile_completed": true,
      "onboarding_step": 3,
      "created_at": "2025-12-29T14:00:00.000Z",
      "updated_at": "2026-04-12T16:00:00.000Z"
    }
  },
  {
    "club_id": "aaa41ac9-63e0-592f-a177-be36e8b212ee",
    "user_id": "9e36e2f6-f994-573b-b8f8-5e7ee6c3a6f4",
    "role": "member",
    "status": "approved",
    "joined_at": "2026-01-09T17:00:00.000Z",
    "user": {
      "id": "9e36e2f6-f994-573b-b8f8-5e7ee6c3a6f4",
      "email": "david.okafor@terpmail.umd.edu",
      "username": "davidok",
      "display_name": "David Okafor",
      "avatar_url": "https://i.pravatar.cc/300?u=davidok",
      "major": "Computer Engineering",
      "graduation_year": 2025,
      "degree_type": "bs",
      "minor": null,
      "bio": "Hardware + software + service hours. Finds a way to help before anyone asks.",
      "pronouns": "he/him",
      "clubs": [
        "UMD Hackers",
        "Data Science Club",
        "Terps for Change"
      ],
      "courses": [
        "CMSC216",
        "PHYS161",
        "MATH141"
      ],
      "interests": [
        "engineering",
        "service",
        "coding",
        "mentorship",
        "community"
      ],
      "follower_count": 0,
      "following_count": 3,
      "notification_prefs": {
        "push_enabled": true,
        "email_enabled": true,
        "club_updates": true,
        "event_reminders": true,
        "feed_activity": true
      },
      "push_token": null,
      "profile_completed": true,
      "onboarding_step": 3,
      "created_at": "2025-12-31T14:00:00.000Z",
      "updated_at": "2026-04-13T16:00:00.000Z"
    }
  },
  {
    "club_id": "94dc4785-694a-5b8a-b73d-d6e896187afb",
    "user_id": "f360a23b-4f3d-566a-959f-ea05849e43ab",
    "role": "president",
    "status": "approved",
    "joined_at": "2026-01-11T17:00:00.000Z",
    "user": {
      "id": "f360a23b-4f3d-566a-959f-ea05849e43ab",
      "email": "ethan.kim@terpmail.umd.edu",
      "username": "ethan_kim",
      "display_name": "Ethan Kim",
      "avatar_url": "https://i.pravatar.cc/300?u=ethan_kim",
      "major": "Data Science",
      "graduation_year": 2025,
      "degree_type": "bs",
      "minor": "Computer Science",
      "bio": "Data science lead who genuinely thinks a clean SQL query can fix at least half of life.",
      "pronouns": "he/him",
      "clubs": [
        "UMD Hackers",
        "Data Science Club",
        "Creative Coding Collective"
      ],
      "courses": [
        "DATA200",
        "STAT400",
        "CMSC216"
      ],
      "interests": [
        "data",
        "analytics",
        "coding",
        "careers",
        "mentorship"
      ],
      "follower_count": 9,
      "following_count": 3,
      "notification_prefs": {
        "push_enabled": true,
        "email_enabled": true,
        "club_updates": true,
        "event_reminders": true,
        "feed_activity": true
      },
      "push_token": null,
      "profile_completed": true,
      "onboarding_step": 3,
      "created_at": "2025-12-23T14:00:00.000Z",
      "updated_at": "2026-04-12T16:00:00.000Z"
    }
  },
  {
    "club_id": "94dc4785-694a-5b8a-b73d-d6e896187afb",
    "user_id": "77de58eb-8b78-5ad5-b5bb-a310726ca240",
    "role": "officer",
    "status": "approved",
    "joined_at": "2026-01-10T17:00:00.000Z",
    "user": {
      "id": "77de58eb-8b78-5ad5-b5bb-a310726ca240",
      "email": "sana.mir@terpmail.umd.edu",
      "username": "sana_mir",
      "display_name": "Sana Mir",
      "avatar_url": "https://i.pravatar.cc/300?u=sana_mir",
      "major": "Neuroscience",
      "graduation_year": 2026,
      "degree_type": "bs",
      "minor": "Statistics",
      "bio": "Bhangra captain with equal love for stage lights, careful planning, and a solid post-event debrief.",
      "pronouns": "she/her",
      "clubs": [
        "Data Science Club",
        "Bhangra at UMD",
        "Korean Student Association"
      ],
      "courses": [
        "STAT400",
        "ENGL101"
      ],
      "interests": [
        "dance",
        "culture",
        "community",
        "wellness",
        "data"
      ],
      "follower_count": 9,
      "following_count": 3,
      "notification_prefs": {
        "push_enabled": true,
        "email_enabled": true,
        "club_updates": true,
        "event_reminders": true,
        "feed_activity": true
      },
      "push_token": null,
      "profile_completed": true,
      "onboarding_step": 3,
      "created_at": "2026-01-03T14:00:00.000Z",
      "updated_at": "2026-04-13T16:00:00.000Z"
    }
  },
  {
    "club_id": "94dc4785-694a-5b8a-b73d-d6e896187afb",
    "user_id": "6667ca7e-5d07-5fd3-ab93-276110c38063",
    "role": "member",
    "status": "approved",
    "joined_at": "2026-01-09T17:00:00.000Z",
    "user": {
      "id": "6667ca7e-5d07-5fd3-ab93-276110c38063",
      "email": "alexj_test@terpmail.umd.edu",
      "username": "alexj_terp",
      "display_name": "Alex Johnson",
      "avatar_url": "https://i.pravatar.cc/300?u=alexj_terp",
      "major": "Computer Science",
      "graduation_year": 2026,
      "degree_type": "bs",
      "minor": "Technology Entrepreneurship",
      "bio": "Building things at UMD. Coffee enthusiast, campus explorer, and always down for a late-night build sprint.",
      "pronouns": "they/them",
      "clubs": [
        "UMD Hackers",
        "Data Science Club",
        "Terp Entrepreneurs",
        "Maryland Outdoors Club"
      ],
      "courses": [
        "CMSC216",
        "CMSC330",
        "STAT400",
        "BMGT220"
      ],
      "interests": [
        "builders",
        "startups",
        "campus-life",
        "design",
        "coffee",
        "community"
      ],
      "follower_count": 10,
      "following_count": 5,
      "notification_prefs": {
        "push_enabled": true,
        "email_enabled": true,
        "club_updates": true,
        "event_reminders": true,
        "feed_activity": true
      },
      "push_token": null,
      "profile_completed": true,
      "onboarding_step": 3,
      "created_at": "2025-12-16T14:00:00.000Z",
      "updated_at": "2026-04-13T16:00:00.000Z"
    }
  },
  {
    "club_id": "94dc4785-694a-5b8a-b73d-d6e896187afb",
    "user_id": "0b4c9322-5024-52dd-b93b-68b721c026ee",
    "role": "member",
    "status": "approved",
    "joined_at": "2026-01-08T17:00:00.000Z",
    "user": {
      "id": "0b4c9322-5024-52dd-b93b-68b721c026ee",
      "email": "daniel.park@terpmail.umd.edu",
      "username": "danielpark",
      "display_name": "Daniel Park",
      "avatar_url": "https://i.pravatar.cc/300?u=danielpark",
      "major": "Computer Science",
      "graduation_year": 2025,
      "degree_type": "bs",
      "minor": "Mathematics",
      "bio": "Senior CS student, hackathon organizer, and the person who always knows which Iribe room is still open.",
      "pronouns": "he/him",
      "clubs": [
        "UMD Hackers",
        "Data Science Club",
        "Korean Student Association"
      ],
      "courses": [
        "CMSC216",
        "CMSC351",
        "MATH141"
      ],
      "interests": [
        "coding",
        "hackathons",
        "mentorship",
        "systems",
        "community"
      ],
      "follower_count": 7,
      "following_count": 3,
      "notification_prefs": {
        "push_enabled": true,
        "email_enabled": true,
        "club_updates": true,
        "event_reminders": true,
        "feed_activity": true
      },
      "push_token": null,
      "profile_completed": true,
      "onboarding_step": 3,
      "created_at": "2025-12-18T14:00:00.000Z",
      "updated_at": "2026-04-11T16:00:00.000Z"
    }
  },
  {
    "club_id": "94dc4785-694a-5b8a-b73d-d6e896187afb",
    "user_id": "3871303c-e94e-56e3-b1ea-57ba9b0bc0c1",
    "role": "member",
    "status": "approved",
    "joined_at": "2026-01-07T17:00:00.000Z",
    "user": {
      "id": "3871303c-e94e-56e3-b1ea-57ba9b0bc0c1",
      "email": "priya.shah@terpmail.umd.edu",
      "username": "priya_shah",
      "display_name": "Priya Shah",
      "avatar_url": "https://i.pravatar.cc/300?u=priya_shah",
      "major": "Biology",
      "graduation_year": 2026,
      "degree_type": "bs",
      "minor": "Data Science",
      "bio": "Bio major balancing lab hours, club leadership, and a permanent search for the best study corner on campus.",
      "pronouns": "she/her",
      "clubs": [
        "Data Science Club",
        "Maryland Running Club",
        "Bhangra at UMD",
        "Society of Women Engineers"
      ],
      "courses": [
        "PHYS161",
        "STAT400",
        "ENGL101"
      ],
      "interests": [
        "wellness",
        "research",
        "service",
        "dance",
        "study-spots"
      ],
      "follower_count": 2,
      "following_count": 4,
      "notification_prefs": {
        "push_enabled": true,
        "email_enabled": true,
        "club_updates": true,
        "event_reminders": true,
        "feed_activity": true
      },
      "push_token": null,
      "profile_completed": true,
      "onboarding_step": 3,
      "created_at": "2025-12-19T14:00:00.000Z",
      "updated_at": "2026-04-13T16:00:00.000Z"
    }
  },
  {
    "club_id": "94dc4785-694a-5b8a-b73d-d6e896187afb",
    "user_id": "7ebd3331-9d3e-5d07-b957-dbb6cb18760f",
    "role": "member",
    "status": "approved",
    "joined_at": "2026-01-06T17:00:00.000Z",
    "user": {
      "id": "7ebd3331-9d3e-5d07-b957-dbb6cb18760f",
      "email": "rahul.mehta@terpmail.umd.edu",
      "username": "rahulm",
      "display_name": "Rahul Mehta",
      "avatar_url": "https://i.pravatar.cc/300?u=rahulm",
      "major": "Electrical Engineering",
      "graduation_year": 2026,
      "degree_type": "bs",
      "minor": "Robotics",
      "bio": "Usually carrying a soldering kit, a half-built side project, or both.",
      "pronouns": "he/him",
      "clubs": [
        "UMD Hackers",
        "Data Science Club",
        "Bhangra at UMD"
      ],
      "courses": [
        "PHYS161",
        "CMSC216",
        "MATH141"
      ],
      "interests": [
        "engineering",
        "robotics",
        "coding",
        "culture",
        "maker-space"
      ],
      "follower_count": 0,
      "following_count": 3,
      "notification_prefs": {
        "push_enabled": true,
        "email_enabled": true,
        "club_updates": true,
        "event_reminders": true,
        "feed_activity": true
      },
      "push_token": null,
      "profile_completed": true,
      "onboarding_step": 3,
      "created_at": "2025-12-27T14:00:00.000Z",
      "updated_at": "2026-04-11T16:00:00.000Z"
    }
  },
  {
    "club_id": "94dc4785-694a-5b8a-b73d-d6e896187afb",
    "user_id": "3a44d09f-f9ee-5606-8958-3cdb4d945381",
    "role": "member",
    "status": "approved",
    "joined_at": "2026-01-05T17:00:00.000Z",
    "user": {
      "id": "3a44d09f-f9ee-5606-8958-3cdb4d945381",
      "email": "grace.chen@terpmail.umd.edu",
      "username": "gracechen",
      "display_name": "Grace Chen",
      "avatar_url": "https://i.pravatar.cc/300?u=gracechen",
      "major": "Finance",
      "graduation_year": 2025,
      "degree_type": "bs",
      "minor": "Statistics",
      "bio": "Founder-energy all day. Loves thoughtful questions, practical advice, and a room full of ambitious people.",
      "pronouns": "she/her",
      "clubs": [
        "Data Science Club",
        "Terp Entrepreneurs",
        "Society of Women Engineers"
      ],
      "courses": [
        "BMGT220",
        "STAT400"
      ],
      "interests": [
        "startups",
        "careers",
        "networking",
        "analytics",
        "community"
      ],
      "follower_count": 6,
      "following_count": 3,
      "notification_prefs": {
        "push_enabled": true,
        "email_enabled": true,
        "club_updates": true,
        "event_reminders": true,
        "feed_activity": true
      },
      "push_token": null,
      "profile_completed": true,
      "onboarding_step": 3,
      "created_at": "2025-12-28T14:00:00.000Z",
      "updated_at": "2026-04-13T16:00:00.000Z"
    }
  },
  {
    "club_id": "94dc4785-694a-5b8a-b73d-d6e896187afb",
    "user_id": "9e36e2f6-f994-573b-b8f8-5e7ee6c3a6f4",
    "role": "member",
    "status": "approved",
    "joined_at": "2026-01-04T17:00:00.000Z",
    "user": {
      "id": "9e36e2f6-f994-573b-b8f8-5e7ee6c3a6f4",
      "email": "david.okafor@terpmail.umd.edu",
      "username": "davidok",
      "display_name": "David Okafor",
      "avatar_url": "https://i.pravatar.cc/300?u=davidok",
      "major": "Computer Engineering",
      "graduation_year": 2025,
      "degree_type": "bs",
      "minor": null,
      "bio": "Hardware + software + service hours. Finds a way to help before anyone asks.",
      "pronouns": "he/him",
      "clubs": [
        "UMD Hackers",
        "Data Science Club",
        "Terps for Change"
      ],
      "courses": [
        "CMSC216",
        "PHYS161",
        "MATH141"
      ],
      "interests": [
        "engineering",
        "service",
        "coding",
        "mentorship",
        "community"
      ],
      "follower_count": 0,
      "following_count": 3,
      "notification_prefs": {
        "push_enabled": true,
        "email_enabled": true,
        "club_updates": true,
        "event_reminders": true,
        "feed_activity": true
      },
      "push_token": null,
      "profile_completed": true,
      "onboarding_step": 3,
      "created_at": "2025-12-31T14:00:00.000Z",
      "updated_at": "2026-04-13T16:00:00.000Z"
    }
  },
  {
    "club_id": "0e68c4f2-2b14-505c-972d-dda49fca824a",
    "user_id": "3a44d09f-f9ee-5606-8958-3cdb4d945381",
    "role": "president",
    "status": "approved",
    "joined_at": "2026-01-07T17:00:00.000Z",
    "user": {
      "id": "3a44d09f-f9ee-5606-8958-3cdb4d945381",
      "email": "grace.chen@terpmail.umd.edu",
      "username": "gracechen",
      "display_name": "Grace Chen",
      "avatar_url": "https://i.pravatar.cc/300?u=gracechen",
      "major": "Finance",
      "graduation_year": 2025,
      "degree_type": "bs",
      "minor": "Statistics",
      "bio": "Founder-energy all day. Loves thoughtful questions, practical advice, and a room full of ambitious people.",
      "pronouns": "she/her",
      "clubs": [
        "Data Science Club",
        "Terp Entrepreneurs",
        "Society of Women Engineers"
      ],
      "courses": [
        "BMGT220",
        "STAT400"
      ],
      "interests": [
        "startups",
        "careers",
        "networking",
        "analytics",
        "community"
      ],
      "follower_count": 6,
      "following_count": 3,
      "notification_prefs": {
        "push_enabled": true,
        "email_enabled": true,
        "club_updates": true,
        "event_reminders": true,
        "feed_activity": true
      },
      "push_token": null,
      "profile_completed": true,
      "onboarding_step": 3,
      "created_at": "2025-12-28T14:00:00.000Z",
      "updated_at": "2026-04-13T16:00:00.000Z"
    }
  },
  {
    "club_id": "0e68c4f2-2b14-505c-972d-dda49fca824a",
    "user_id": "6667ca7e-5d07-5fd3-ab93-276110c38063",
    "role": "officer",
    "status": "approved",
    "joined_at": "2026-01-06T17:00:00.000Z",
    "user": {
      "id": "6667ca7e-5d07-5fd3-ab93-276110c38063",
      "email": "alexj_test@terpmail.umd.edu",
      "username": "alexj_terp",
      "display_name": "Alex Johnson",
      "avatar_url": "https://i.pravatar.cc/300?u=alexj_terp",
      "major": "Computer Science",
      "graduation_year": 2026,
      "degree_type": "bs",
      "minor": "Technology Entrepreneurship",
      "bio": "Building things at UMD. Coffee enthusiast, campus explorer, and always down for a late-night build sprint.",
      "pronouns": "they/them",
      "clubs": [
        "UMD Hackers",
        "Data Science Club",
        "Terp Entrepreneurs",
        "Maryland Outdoors Club"
      ],
      "courses": [
        "CMSC216",
        "CMSC330",
        "STAT400",
        "BMGT220"
      ],
      "interests": [
        "builders",
        "startups",
        "campus-life",
        "design",
        "coffee",
        "community"
      ],
      "follower_count": 10,
      "following_count": 5,
      "notification_prefs": {
        "push_enabled": true,
        "email_enabled": true,
        "club_updates": true,
        "event_reminders": true,
        "feed_activity": true
      },
      "push_token": null,
      "profile_completed": true,
      "onboarding_step": 3,
      "created_at": "2025-12-16T14:00:00.000Z",
      "updated_at": "2026-04-13T16:00:00.000Z"
    }
  },
  {
    "club_id": "0e68c4f2-2b14-505c-972d-dda49fca824a",
    "user_id": "bf962ba5-980e-5ed4-b080-3ddad5c2e760",
    "role": "officer",
    "status": "approved",
    "joined_at": "2026-01-05T17:00:00.000Z",
    "user": {
      "id": "bf962ba5-980e-5ed4-b080-3ddad5c2e760",
      "email": "leena.rao@terpmail.umd.edu",
      "username": "leena_rao",
      "display_name": "Leena Rao",
      "avatar_url": "https://i.pravatar.cc/300?u=leena_rao",
      "major": "Finance",
      "graduation_year": 2026,
      "degree_type": "bs",
      "minor": "Technology Entrepreneurship",
      "bio": "Usually somewhere between a pitch deck, a rehearsal, and a coffee run through Stamp.",
      "pronouns": "she/her",
      "clubs": [
        "Terp Entrepreneurs",
        "Bhangra at UMD",
        "Film Society at Maryland"
      ],
      "courses": [
        "BMGT220",
        "STAT400"
      ],
      "interests": [
        "startups",
        "music",
        "community",
        "culture",
        "events"
      ],
      "follower_count": 7,
      "following_count": 3,
      "notification_prefs": {
        "push_enabled": true,
        "email_enabled": true,
        "club_updates": true,
        "event_reminders": true,
        "feed_activity": true
      },
      "push_token": null,
      "profile_completed": true,
      "onboarding_step": 3,
      "created_at": "2025-12-22T14:00:00.000Z",
      "updated_at": "2026-04-13T16:00:00.000Z"
    }
  },
  {
    "club_id": "0e68c4f2-2b14-505c-972d-dda49fca824a",
    "user_id": "79af4eed-7d3d-5729-8963-46e04646d23b",
    "role": "member",
    "status": "approved",
    "joined_at": "2026-01-04T17:00:00.000Z",
    "user": {
      "id": "79af4eed-7d3d-5729-8963-46e04646d23b",
      "email": "nia.brooks@terpmail.umd.edu",
      "username": "nia_builds",
      "display_name": "Nia Brooks",
      "avatar_url": "https://i.pravatar.cc/300?u=nia_builds",
      "major": "Information Science",
      "graduation_year": 2027,
      "degree_type": "bs",
      "minor": "Human-Computer Interaction",
      "bio": "Infosci student who bounces between Figma files, product strategy, and whoever needs a design critique.",
      "pronouns": "she/her",
      "clubs": [
        "UMD Hackers",
        "Terp Entrepreneurs",
        "Society of Women Engineers",
        "Creative Coding Collective"
      ],
      "courses": [
        "INST201",
        "DATA100",
        "ENGL101"
      ],
      "interests": [
        "design",
        "product",
        "builders",
        "community",
        "mentorship"
      ],
      "follower_count": 1,
      "following_count": 4,
      "notification_prefs": {
        "push_enabled": true,
        "email_enabled": true,
        "club_updates": true,
        "event_reminders": true,
        "feed_activity": true
      },
      "push_token": null,
      "profile_completed": true,
      "onboarding_step": 3,
      "created_at": "2025-12-17T14:00:00.000Z",
      "updated_at": "2026-04-12T16:00:00.000Z"
    }
  },
  {
    "club_id": "0e68c4f2-2b14-505c-972d-dda49fca824a",
    "user_id": "c0957686-8810-518a-8a56-df06c240f785",
    "role": "member",
    "status": "approved",
    "joined_at": "2026-01-03T17:00:00.000Z",
    "user": {
      "id": "c0957686-8810-518a-8a56-df06c240f785",
      "email": "omar.hassan@terpmail.umd.edu",
      "username": "omarh",
      "display_name": "Omar Hassan",
      "avatar_url": "https://i.pravatar.cc/300?u=omarh",
      "major": "Computer Science",
      "graduation_year": 2026,
      "degree_type": "bs",
      "minor": "Immersive Media Design",
      "bio": "Creative technologist who likes weird interfaces, clean code, and events with a strong vibe.",
      "pronouns": "he/him",
      "clubs": [
        "UMD Hackers",
        "Terp Entrepreneurs",
        "Creative Coding Collective",
        "Film Society at Maryland"
      ],
      "courses": [
        "CMSC330",
        "CMSC351",
        "STAT400"
      ],
      "interests": [
        "creative-tech",
        "coding",
        "design",
        "film",
        "startups"
      ],
      "follower_count": 0,
      "following_count": 4,
      "notification_prefs": {
        "push_enabled": true,
        "email_enabled": true,
        "club_updates": true,
        "event_reminders": true,
        "feed_activity": true
      },
      "push_token": null,
      "profile_completed": true,
      "onboarding_step": 3,
      "created_at": "2025-12-29T14:00:00.000Z",
      "updated_at": "2026-04-12T16:00:00.000Z"
    }
  },
  {
    "club_id": "0e68c4f2-2b14-505c-972d-dda49fca824a",
    "user_id": "ca86602c-434a-50de-af39-90312889c45d",
    "role": "member",
    "status": "approved",
    "joined_at": "2026-01-02T17:00:00.000Z",
    "user": {
      "id": "ca86602c-434a-50de-af39-90312889c45d",
      "email": "sofia.alvarez@terpmail.umd.edu",
      "username": "sofia_alvarez",
      "display_name": "Sofia Alvarez",
      "avatar_url": "https://i.pravatar.cc/300?u=sofia_alvarez",
      "major": "Journalism",
      "graduation_year": 2027,
      "degree_type": "ba",
      "minor": "Film Studies",
      "bio": "Campus storyteller with a camera roll full of sunsets, events, and people being unexpectedly iconic.",
      "pronouns": "she/her",
      "clubs": [
        "Terp Entrepreneurs",
        "Creative Coding Collective",
        "Terps for Change",
        "Film Society at Maryland"
      ],
      "courses": [
        "ENGL101"
      ],
      "interests": [
        "film",
        "storytelling",
        "community",
        "arts",
        "photography"
      ],
      "follower_count": 0,
      "following_count": 4,
      "notification_prefs": {
        "push_enabled": true,
        "email_enabled": true,
        "club_updates": true,
        "event_reminders": true,
        "feed_activity": true
      },
      "push_token": null,
      "profile_completed": true,
      "onboarding_step": 3,
      "created_at": "2025-12-24T14:00:00.000Z",
      "updated_at": "2026-04-11T16:00:00.000Z"
    }
  },
  {
    "club_id": "0e68c4f2-2b14-505c-972d-dda49fca824a",
    "user_id": "ee83f346-1b89-59ad-83b3-5ac6a979327e",
    "role": "member",
    "status": "approved",
    "joined_at": "2026-01-01T17:00:00.000Z",
    "user": {
      "id": "ee83f346-1b89-59ad-83b3-5ac6a979327e",
      "email": "tyler.bennett@terpmail.umd.edu",
      "username": "tyler_bennett",
      "display_name": "Tyler Bennett",
      "avatar_url": "https://i.pravatar.cc/300?u=tyler_bennett",
      "major": "Economics",
      "graduation_year": 2025,
      "degree_type": "ba",
      "minor": "General Business",
      "bio": "Shows up for founder talks, club screenings, and basically any event with a good crowd and better snacks.",
      "pronouns": "he/him",
      "clubs": [
        "Terp Entrepreneurs",
        "Maryland Running Club",
        "Korean Student Association",
        "Film Society at Maryland"
      ],
      "courses": [
        "BMGT220",
        "STAT400"
      ],
      "interests": [
        "careers",
        "community",
        "culture",
        "film",
        "running"
      ],
      "follower_count": 0,
      "following_count": 4,
      "notification_prefs": {
        "push_enabled": true,
        "email_enabled": true,
        "club_updates": true,
        "event_reminders": true,
        "feed_activity": true
      },
      "push_token": null,
      "profile_completed": true,
      "onboarding_step": 3,
      "created_at": "2026-01-04T14:00:00.000Z",
      "updated_at": "2026-04-12T16:00:00.000Z"
    }
  },
  {
    "club_id": "93df5013-9ec9-56e2-8f1e-dbbb52ad5feb",
    "user_id": "9ffda673-63bb-542b-9b0d-0de86e4557ee",
    "role": "president",
    "status": "approved",
    "joined_at": "2026-01-03T17:00:00.000Z",
    "user": {
      "id": "9ffda673-63bb-542b-9b0d-0de86e4557ee",
      "email": "aaliyah.green@terpmail.umd.edu",
      "username": "aaliyah_green",
      "display_name": "Aaliyah Green",
      "avatar_url": "https://i.pravatar.cc/300?u=aaliyah_green",
      "major": "Kinesiology",
      "graduation_year": 2027,
      "degree_type": "bs",
      "minor": null,
      "bio": "Running club captain, wellness advocate, and always trying to convince people that morning movement is worth it.",
      "pronouns": "she/her",
      "clubs": [
        "Maryland Running Club",
        "Society of Women Engineers",
        "Terps for Change"
      ],
      "courses": [
        "PHYS161",
        "ENGL101"
      ],
      "interests": [
        "running",
        "wellness",
        "community",
        "sports",
        "service"
      ],
      "follower_count": 5,
      "following_count": 3,
      "notification_prefs": {
        "push_enabled": true,
        "email_enabled": true,
        "club_updates": true,
        "event_reminders": true,
        "feed_activity": true
      },
      "push_token": null,
      "profile_completed": true,
      "onboarding_step": 3,
      "created_at": "2025-12-26T14:00:00.000Z",
      "updated_at": "2026-04-12T16:00:00.000Z"
    }
  },
  {
    "club_id": "93df5013-9ec9-56e2-8f1e-dbbb52ad5feb",
    "user_id": "5a90dcaa-9700-59fb-9cc9-66b19e06e6d6",
    "role": "officer",
    "status": "approved",
    "joined_at": "2026-01-02T17:00:00.000Z",
    "user": {
      "id": "5a90dcaa-9700-59fb-9cc9-66b19e06e6d6",
      "email": "marcus.thompson@terpmail.umd.edu",
      "username": "marcus_t",
      "display_name": "Marcus Thompson",
      "avatar_url": "https://i.pravatar.cc/300?u=marcus_t",
      "major": "Mechanical Engineering",
      "graduation_year": 2026,
      "degree_type": "bs",
      "minor": null,
      "bio": "Mechanical engineering, early morning runs, and the loudest student-section energy you will ever meet.",
      "pronouns": "he/him",
      "clubs": [
        "Maryland Running Club",
        "Maryland Outdoors Club",
        "Korean Student Association"
      ],
      "courses": [
        "PHYS161",
        "MATH141"
      ],
      "interests": [
        "fitness",
        "sports",
        "engineering",
        "outdoors",
        "campus-events"
      ],
      "follower_count": 4,
      "following_count": 3,
      "notification_prefs": {
        "push_enabled": true,
        "email_enabled": true,
        "club_updates": true,
        "event_reminders": true,
        "feed_activity": true
      },
      "push_token": null,
      "profile_completed": true,
      "onboarding_step": 3,
      "created_at": "2025-12-20T14:00:00.000Z",
      "updated_at": "2026-04-12T16:00:00.000Z"
    }
  },
  {
    "club_id": "93df5013-9ec9-56e2-8f1e-dbbb52ad5feb",
    "user_id": "7e1d57eb-5dc7-58f1-8fe1-a165779a5ddd",
    "role": "officer",
    "status": "approved",
    "joined_at": "2026-01-01T17:00:00.000Z",
    "user": {
      "id": "7e1d57eb-5dc7-58f1-8fe1-a165779a5ddd",
      "email": "hannah.lee@terpmail.umd.edu",
      "username": "hannah_lee",
      "display_name": "Hannah Lee",
      "avatar_url": "https://i.pravatar.cc/300?u=hannah_lee",
      "major": "Public Health Science",
      "graduation_year": 2027,
      "degree_type": "bs",
      "minor": "Asian American Studies",
      "bio": "KSA president, outdoors regular, and forever making spreadsheets for things that do not need spreadsheets.",
      "pronouns": "she/her",
      "clubs": [
        "Maryland Running Club",
        "Bhangra at UMD",
        "Maryland Outdoors Club",
        "Korean Student Association"
      ],
      "courses": [
        "PHYS161",
        "STAT400"
      ],
      "interests": [
        "culture",
        "community",
        "wellness",
        "outdoors",
        "events"
      ],
      "follower_count": 6,
      "following_count": 4,
      "notification_prefs": {
        "push_enabled": true,
        "email_enabled": true,
        "club_updates": true,
        "event_reminders": true,
        "feed_activity": true
      },
      "push_token": null,
      "profile_completed": true,
      "onboarding_step": 3,
      "created_at": "2025-12-30T14:00:00.000Z",
      "updated_at": "2026-04-11T16:00:00.000Z"
    }
  },
  {
    "club_id": "93df5013-9ec9-56e2-8f1e-dbbb52ad5feb",
    "user_id": "3871303c-e94e-56e3-b1ea-57ba9b0bc0c1",
    "role": "member",
    "status": "approved",
    "joined_at": "2025-12-31T17:00:00.000Z",
    "user": {
      "id": "3871303c-e94e-56e3-b1ea-57ba9b0bc0c1",
      "email": "priya.shah@terpmail.umd.edu",
      "username": "priya_shah",
      "display_name": "Priya Shah",
      "avatar_url": "https://i.pravatar.cc/300?u=priya_shah",
      "major": "Biology",
      "graduation_year": 2026,
      "degree_type": "bs",
      "minor": "Data Science",
      "bio": "Bio major balancing lab hours, club leadership, and a permanent search for the best study corner on campus.",
      "pronouns": "she/her",
      "clubs": [
        "Data Science Club",
        "Maryland Running Club",
        "Bhangra at UMD",
        "Society of Women Engineers"
      ],
      "courses": [
        "PHYS161",
        "STAT400",
        "ENGL101"
      ],
      "interests": [
        "wellness",
        "research",
        "service",
        "dance",
        "study-spots"
      ],
      "follower_count": 2,
      "following_count": 4,
      "notification_prefs": {
        "push_enabled": true,
        "email_enabled": true,
        "club_updates": true,
        "event_reminders": true,
        "feed_activity": true
      },
      "push_token": null,
      "profile_completed": true,
      "onboarding_step": 3,
      "created_at": "2025-12-19T14:00:00.000Z",
      "updated_at": "2026-04-13T16:00:00.000Z"
    }
  },
  {
    "club_id": "93df5013-9ec9-56e2-8f1e-dbbb52ad5feb",
    "user_id": "dceb7801-ef4a-5c0d-8c77-d45c18b15df1",
    "role": "member",
    "status": "approved",
    "joined_at": "2025-12-30T17:00:00.000Z",
    "user": {
      "id": "dceb7801-ef4a-5c0d-8c77-d45c18b15df1",
      "email": "jordan.kim@terpmail.umd.edu",
      "username": "jordank_umd",
      "display_name": "Jordan Kim",
      "avatar_url": "https://i.pravatar.cc/300?u=jordank_umd",
      "major": "Environmental Science",
      "graduation_year": 2026,
      "degree_type": "bs",
      "minor": "Geographical Sciences",
      "bio": "Outdoors club president, trail planner, and champion of touching grass during midterm season.",
      "pronouns": "they/them",
      "clubs": [
        "Maryland Running Club",
        "Maryland Outdoors Club",
        "Terps for Change"
      ],
      "courses": [
        "ENGL101",
        "PHYS161"
      ],
      "interests": [
        "outdoors",
        "sustainability",
        "community",
        "fitness",
        "travel"
      ],
      "follower_count": 2,
      "following_count": 3,
      "notification_prefs": {
        "push_enabled": true,
        "email_enabled": true,
        "club_updates": true,
        "event_reminders": true,
        "feed_activity": true
      },
      "push_token": null,
      "profile_completed": true,
      "onboarding_step": 3,
      "created_at": "2025-12-25T14:00:00.000Z",
      "updated_at": "2026-04-13T16:00:00.000Z"
    }
  },
  {
    "club_id": "93df5013-9ec9-56e2-8f1e-dbbb52ad5feb",
    "user_id": "ee83f346-1b89-59ad-83b3-5ac6a979327e",
    "role": "member",
    "status": "approved",
    "joined_at": "2025-12-29T17:00:00.000Z",
    "user": {
      "id": "ee83f346-1b89-59ad-83b3-5ac6a979327e",
      "email": "tyler.bennett@terpmail.umd.edu",
      "username": "tyler_bennett",
      "display_name": "Tyler Bennett",
      "avatar_url": "https://i.pravatar.cc/300?u=tyler_bennett",
      "major": "Economics",
      "graduation_year": 2025,
      "degree_type": "ba",
      "minor": "General Business",
      "bio": "Shows up for founder talks, club screenings, and basically any event with a good crowd and better snacks.",
      "pronouns": "he/him",
      "clubs": [
        "Terp Entrepreneurs",
        "Maryland Running Club",
        "Korean Student Association",
        "Film Society at Maryland"
      ],
      "courses": [
        "BMGT220",
        "STAT400"
      ],
      "interests": [
        "careers",
        "community",
        "culture",
        "film",
        "running"
      ],
      "follower_count": 0,
      "following_count": 4,
      "notification_prefs": {
        "push_enabled": true,
        "email_enabled": true,
        "club_updates": true,
        "event_reminders": true,
        "feed_activity": true
      },
      "push_token": null,
      "profile_completed": true,
      "onboarding_step": 3,
      "created_at": "2026-01-04T14:00:00.000Z",
      "updated_at": "2026-04-12T16:00:00.000Z"
    }
  },
  {
    "club_id": "2c3160cc-928d-54c2-817c-2abc9ad857bf",
    "user_id": "77de58eb-8b78-5ad5-b5bb-a310726ca240",
    "role": "president",
    "status": "approved",
    "joined_at": "2025-12-30T17:00:00.000Z",
    "user": {
      "id": "77de58eb-8b78-5ad5-b5bb-a310726ca240",
      "email": "sana.mir@terpmail.umd.edu",
      "username": "sana_mir",
      "display_name": "Sana Mir",
      "avatar_url": "https://i.pravatar.cc/300?u=sana_mir",
      "major": "Neuroscience",
      "graduation_year": 2026,
      "degree_type": "bs",
      "minor": "Statistics",
      "bio": "Bhangra captain with equal love for stage lights, careful planning, and a solid post-event debrief.",
      "pronouns": "she/her",
      "clubs": [
        "Data Science Club",
        "Bhangra at UMD",
        "Korean Student Association"
      ],
      "courses": [
        "STAT400",
        "ENGL101"
      ],
      "interests": [
        "dance",
        "culture",
        "community",
        "wellness",
        "data"
      ],
      "follower_count": 9,
      "following_count": 3,
      "notification_prefs": {
        "push_enabled": true,
        "email_enabled": true,
        "club_updates": true,
        "event_reminders": true,
        "feed_activity": true
      },
      "push_token": null,
      "profile_completed": true,
      "onboarding_step": 3,
      "created_at": "2026-01-03T14:00:00.000Z",
      "updated_at": "2026-04-13T16:00:00.000Z"
    }
  },
  {
    "club_id": "2c3160cc-928d-54c2-817c-2abc9ad857bf",
    "user_id": "bf962ba5-980e-5ed4-b080-3ddad5c2e760",
    "role": "officer",
    "status": "approved",
    "joined_at": "2025-12-29T17:00:00.000Z",
    "user": {
      "id": "bf962ba5-980e-5ed4-b080-3ddad5c2e760",
      "email": "leena.rao@terpmail.umd.edu",
      "username": "leena_rao",
      "display_name": "Leena Rao",
      "avatar_url": "https://i.pravatar.cc/300?u=leena_rao",
      "major": "Finance",
      "graduation_year": 2026,
      "degree_type": "bs",
      "minor": "Technology Entrepreneurship",
      "bio": "Usually somewhere between a pitch deck, a rehearsal, and a coffee run through Stamp.",
      "pronouns": "she/her",
      "clubs": [
        "Terp Entrepreneurs",
        "Bhangra at UMD",
        "Film Society at Maryland"
      ],
      "courses": [
        "BMGT220",
        "STAT400"
      ],
      "interests": [
        "startups",
        "music",
        "community",
        "culture",
        "events"
      ],
      "follower_count": 7,
      "following_count": 3,
      "notification_prefs": {
        "push_enabled": true,
        "email_enabled": true,
        "club_updates": true,
        "event_reminders": true,
        "feed_activity": true
      },
      "push_token": null,
      "profile_completed": true,
      "onboarding_step": 3,
      "created_at": "2025-12-22T14:00:00.000Z",
      "updated_at": "2026-04-13T16:00:00.000Z"
    }
  },
  {
    "club_id": "2c3160cc-928d-54c2-817c-2abc9ad857bf",
    "user_id": "3871303c-e94e-56e3-b1ea-57ba9b0bc0c1",
    "role": "member",
    "status": "approved",
    "joined_at": "2025-12-28T17:00:00.000Z",
    "user": {
      "id": "3871303c-e94e-56e3-b1ea-57ba9b0bc0c1",
      "email": "priya.shah@terpmail.umd.edu",
      "username": "priya_shah",
      "display_name": "Priya Shah",
      "avatar_url": "https://i.pravatar.cc/300?u=priya_shah",
      "major": "Biology",
      "graduation_year": 2026,
      "degree_type": "bs",
      "minor": "Data Science",
      "bio": "Bio major balancing lab hours, club leadership, and a permanent search for the best study corner on campus.",
      "pronouns": "she/her",
      "clubs": [
        "Data Science Club",
        "Maryland Running Club",
        "Bhangra at UMD",
        "Society of Women Engineers"
      ],
      "courses": [
        "PHYS161",
        "STAT400",
        "ENGL101"
      ],
      "interests": [
        "wellness",
        "research",
        "service",
        "dance",
        "study-spots"
      ],
      "follower_count": 2,
      "following_count": 4,
      "notification_prefs": {
        "push_enabled": true,
        "email_enabled": true,
        "club_updates": true,
        "event_reminders": true,
        "feed_activity": true
      },
      "push_token": null,
      "profile_completed": true,
      "onboarding_step": 3,
      "created_at": "2025-12-19T14:00:00.000Z",
      "updated_at": "2026-04-13T16:00:00.000Z"
    }
  },
  {
    "club_id": "2c3160cc-928d-54c2-817c-2abc9ad857bf",
    "user_id": "a49d4554-325c-5c88-afaa-ef947f0a115a",
    "role": "member",
    "status": "approved",
    "joined_at": "2025-12-27T17:00:00.000Z",
    "user": {
      "id": "a49d4554-325c-5c88-afaa-ef947f0a115a",
      "email": "maya.patel@terpmail.umd.edu",
      "username": "maya_p",
      "display_name": "Maya Patel",
      "avatar_url": "https://i.pravatar.cc/300?u=maya_p",
      "major": "Government and Politics",
      "graduation_year": 2027,
      "degree_type": "ba",
      "minor": "Nonprofit Leadership",
      "bio": "Policy nerd, service organizer, and the friend who will always send you the registration deadline first.",
      "pronouns": "she/her",
      "clubs": [
        "Bhangra at UMD",
        "Society of Women Engineers",
        "Terps for Change",
        "Film Society at Maryland"
      ],
      "courses": [
        "ENGL101",
        "BMGT220"
      ],
      "interests": [
        "service",
        "advocacy",
        "community",
        "culture",
        "leadership"
      ],
      "follower_count": 0,
      "following_count": 4,
      "notification_prefs": {
        "push_enabled": true,
        "email_enabled": true,
        "club_updates": true,
        "event_reminders": true,
        "feed_activity": true
      },
      "push_token": null,
      "profile_completed": true,
      "onboarding_step": 3,
      "created_at": "2025-12-21T14:00:00.000Z",
      "updated_at": "2026-04-11T16:00:00.000Z"
    }
  },
  {
    "club_id": "2c3160cc-928d-54c2-817c-2abc9ad857bf",
    "user_id": "7e1d57eb-5dc7-58f1-8fe1-a165779a5ddd",
    "role": "member",
    "status": "approved",
    "joined_at": "2025-12-26T17:00:00.000Z",
    "user": {
      "id": "7e1d57eb-5dc7-58f1-8fe1-a165779a5ddd",
      "email": "hannah.lee@terpmail.umd.edu",
      "username": "hannah_lee",
      "display_name": "Hannah Lee",
      "avatar_url": "https://i.pravatar.cc/300?u=hannah_lee",
      "major": "Public Health Science",
      "graduation_year": 2027,
      "degree_type": "bs",
      "minor": "Asian American Studies",
      "bio": "KSA president, outdoors regular, and forever making spreadsheets for things that do not need spreadsheets.",
      "pronouns": "she/her",
      "clubs": [
        "Maryland Running Club",
        "Bhangra at UMD",
        "Maryland Outdoors Club",
        "Korean Student Association"
      ],
      "courses": [
        "PHYS161",
        "STAT400"
      ],
      "interests": [
        "culture",
        "community",
        "wellness",
        "outdoors",
        "events"
      ],
      "follower_count": 6,
      "following_count": 4,
      "notification_prefs": {
        "push_enabled": true,
        "email_enabled": true,
        "club_updates": true,
        "event_reminders": true,
        "feed_activity": true
      },
      "push_token": null,
      "profile_completed": true,
      "onboarding_step": 3,
      "created_at": "2025-12-30T14:00:00.000Z",
      "updated_at": "2026-04-11T16:00:00.000Z"
    }
  },
  {
    "club_id": "2c3160cc-928d-54c2-817c-2abc9ad857bf",
    "user_id": "af45b9b4-fb14-5b6d-bbcd-5ffcc64bf110",
    "role": "member",
    "status": "approved",
    "joined_at": "2025-12-25T17:00:00.000Z",
    "user": {
      "id": "af45b9b4-fb14-5b6d-bbcd-5ffcc64bf110",
      "email": "chloe.nguyen@terpmail.umd.edu",
      "username": "chloecreates",
      "display_name": "Chloe Nguyen",
      "avatar_url": "https://i.pravatar.cc/300?u=chloecreates",
      "major": "Studio Art",
      "graduation_year": 2026,
      "degree_type": "ba",
      "minor": "Computer Science",
      "bio": "Creative Coding Collective president, poster-maker, and curator of niche but excellent campus playlists.",
      "pronouns": "she/her",
      "clubs": [
        "Bhangra at UMD",
        "Korean Student Association",
        "Creative Coding Collective",
        "Film Society at Maryland"
      ],
      "courses": [
        "ENGL101",
        "INST201"
      ],
      "interests": [
        "arts",
        "creative-tech",
        "design",
        "film",
        "culture"
      ],
      "follower_count": 2,
      "following_count": 4,
      "notification_prefs": {
        "push_enabled": true,
        "email_enabled": true,
        "club_updates": true,
        "event_reminders": true,
        "feed_activity": true
      },
      "push_token": null,
      "profile_completed": true,
      "onboarding_step": 3,
      "created_at": "2026-01-01T14:00:00.000Z",
      "updated_at": "2026-04-12T16:00:00.000Z"
    }
  },
  {
    "club_id": "2c3160cc-928d-54c2-817c-2abc9ad857bf",
    "user_id": "7ebd3331-9d3e-5d07-b957-dbb6cb18760f",
    "role": "member",
    "status": "approved",
    "joined_at": "2025-12-24T17:00:00.000Z",
    "user": {
      "id": "7ebd3331-9d3e-5d07-b957-dbb6cb18760f",
      "email": "rahul.mehta@terpmail.umd.edu",
      "username": "rahulm",
      "display_name": "Rahul Mehta",
      "avatar_url": "https://i.pravatar.cc/300?u=rahulm",
      "major": "Electrical Engineering",
      "graduation_year": 2026,
      "degree_type": "bs",
      "minor": "Robotics",
      "bio": "Usually carrying a soldering kit, a half-built side project, or both.",
      "pronouns": "he/him",
      "clubs": [
        "UMD Hackers",
        "Data Science Club",
        "Bhangra at UMD"
      ],
      "courses": [
        "PHYS161",
        "CMSC216",
        "MATH141"
      ],
      "interests": [
        "engineering",
        "robotics",
        "coding",
        "culture",
        "maker-space"
      ],
      "follower_count": 0,
      "following_count": 3,
      "notification_prefs": {
        "push_enabled": true,
        "email_enabled": true,
        "club_updates": true,
        "event_reminders": true,
        "feed_activity": true
      },
      "push_token": null,
      "profile_completed": true,
      "onboarding_step": 3,
      "created_at": "2025-12-27T14:00:00.000Z",
      "updated_at": "2026-04-11T16:00:00.000Z"
    }
  },
  {
    "club_id": "189a718a-77c7-592f-b26f-c25f576a21b8",
    "user_id": "3871303c-e94e-56e3-b1ea-57ba9b0bc0c1",
    "role": "president",
    "status": "approved",
    "joined_at": "2025-12-26T17:00:00.000Z",
    "user": {
      "id": "3871303c-e94e-56e3-b1ea-57ba9b0bc0c1",
      "email": "priya.shah@terpmail.umd.edu",
      "username": "priya_shah",
      "display_name": "Priya Shah",
      "avatar_url": "https://i.pravatar.cc/300?u=priya_shah",
      "major": "Biology",
      "graduation_year": 2026,
      "degree_type": "bs",
      "minor": "Data Science",
      "bio": "Bio major balancing lab hours, club leadership, and a permanent search for the best study corner on campus.",
      "pronouns": "she/her",
      "clubs": [
        "Data Science Club",
        "Maryland Running Club",
        "Bhangra at UMD",
        "Society of Women Engineers"
      ],
      "courses": [
        "PHYS161",
        "STAT400",
        "ENGL101"
      ],
      "interests": [
        "wellness",
        "research",
        "service",
        "dance",
        "study-spots"
      ],
      "follower_count": 2,
      "following_count": 4,
      "notification_prefs": {
        "push_enabled": true,
        "email_enabled": true,
        "club_updates": true,
        "event_reminders": true,
        "feed_activity": true
      },
      "push_token": null,
      "profile_completed": true,
      "onboarding_step": 3,
      "created_at": "2025-12-19T14:00:00.000Z",
      "updated_at": "2026-04-13T16:00:00.000Z"
    }
  },
  {
    "club_id": "189a718a-77c7-592f-b26f-c25f576a21b8",
    "user_id": "79af4eed-7d3d-5729-8963-46e04646d23b",
    "role": "officer",
    "status": "approved",
    "joined_at": "2025-12-25T17:00:00.000Z",
    "user": {
      "id": "79af4eed-7d3d-5729-8963-46e04646d23b",
      "email": "nia.brooks@terpmail.umd.edu",
      "username": "nia_builds",
      "display_name": "Nia Brooks",
      "avatar_url": "https://i.pravatar.cc/300?u=nia_builds",
      "major": "Information Science",
      "graduation_year": 2027,
      "degree_type": "bs",
      "minor": "Human-Computer Interaction",
      "bio": "Infosci student who bounces between Figma files, product strategy, and whoever needs a design critique.",
      "pronouns": "she/her",
      "clubs": [
        "UMD Hackers",
        "Terp Entrepreneurs",
        "Society of Women Engineers",
        "Creative Coding Collective"
      ],
      "courses": [
        "INST201",
        "DATA100",
        "ENGL101"
      ],
      "interests": [
        "design",
        "product",
        "builders",
        "community",
        "mentorship"
      ],
      "follower_count": 1,
      "following_count": 4,
      "notification_prefs": {
        "push_enabled": true,
        "email_enabled": true,
        "club_updates": true,
        "event_reminders": true,
        "feed_activity": true
      },
      "push_token": null,
      "profile_completed": true,
      "onboarding_step": 3,
      "created_at": "2025-12-17T14:00:00.000Z",
      "updated_at": "2026-04-12T16:00:00.000Z"
    }
  },
  {
    "club_id": "189a718a-77c7-592f-b26f-c25f576a21b8",
    "user_id": "a49d4554-325c-5c88-afaa-ef947f0a115a",
    "role": "member",
    "status": "approved",
    "joined_at": "2025-12-24T17:00:00.000Z",
    "user": {
      "id": "a49d4554-325c-5c88-afaa-ef947f0a115a",
      "email": "maya.patel@terpmail.umd.edu",
      "username": "maya_p",
      "display_name": "Maya Patel",
      "avatar_url": "https://i.pravatar.cc/300?u=maya_p",
      "major": "Government and Politics",
      "graduation_year": 2027,
      "degree_type": "ba",
      "minor": "Nonprofit Leadership",
      "bio": "Policy nerd, service organizer, and the friend who will always send you the registration deadline first.",
      "pronouns": "she/her",
      "clubs": [
        "Bhangra at UMD",
        "Society of Women Engineers",
        "Terps for Change",
        "Film Society at Maryland"
      ],
      "courses": [
        "ENGL101",
        "BMGT220"
      ],
      "interests": [
        "service",
        "advocacy",
        "community",
        "culture",
        "leadership"
      ],
      "follower_count": 0,
      "following_count": 4,
      "notification_prefs": {
        "push_enabled": true,
        "email_enabled": true,
        "club_updates": true,
        "event_reminders": true,
        "feed_activity": true
      },
      "push_token": null,
      "profile_completed": true,
      "onboarding_step": 3,
      "created_at": "2025-12-21T14:00:00.000Z",
      "updated_at": "2026-04-11T16:00:00.000Z"
    }
  },
  {
    "club_id": "189a718a-77c7-592f-b26f-c25f576a21b8",
    "user_id": "3a44d09f-f9ee-5606-8958-3cdb4d945381",
    "role": "member",
    "status": "approved",
    "joined_at": "2025-12-23T17:00:00.000Z",
    "user": {
      "id": "3a44d09f-f9ee-5606-8958-3cdb4d945381",
      "email": "grace.chen@terpmail.umd.edu",
      "username": "gracechen",
      "display_name": "Grace Chen",
      "avatar_url": "https://i.pravatar.cc/300?u=gracechen",
      "major": "Finance",
      "graduation_year": 2025,
      "degree_type": "bs",
      "minor": "Statistics",
      "bio": "Founder-energy all day. Loves thoughtful questions, practical advice, and a room full of ambitious people.",
      "pronouns": "she/her",
      "clubs": [
        "Data Science Club",
        "Terp Entrepreneurs",
        "Society of Women Engineers"
      ],
      "courses": [
        "BMGT220",
        "STAT400"
      ],
      "interests": [
        "startups",
        "careers",
        "networking",
        "analytics",
        "community"
      ],
      "follower_count": 6,
      "following_count": 3,
      "notification_prefs": {
        "push_enabled": true,
        "email_enabled": true,
        "club_updates": true,
        "event_reminders": true,
        "feed_activity": true
      },
      "push_token": null,
      "profile_completed": true,
      "onboarding_step": 3,
      "created_at": "2025-12-28T14:00:00.000Z",
      "updated_at": "2026-04-13T16:00:00.000Z"
    }
  },
  {
    "club_id": "189a718a-77c7-592f-b26f-c25f576a21b8",
    "user_id": "9ffda673-63bb-542b-9b0d-0de86e4557ee",
    "role": "member",
    "status": "approved",
    "joined_at": "2025-12-22T17:00:00.000Z",
    "user": {
      "id": "9ffda673-63bb-542b-9b0d-0de86e4557ee",
      "email": "aaliyah.green@terpmail.umd.edu",
      "username": "aaliyah_green",
      "display_name": "Aaliyah Green",
      "avatar_url": "https://i.pravatar.cc/300?u=aaliyah_green",
      "major": "Kinesiology",
      "graduation_year": 2027,
      "degree_type": "bs",
      "minor": null,
      "bio": "Running club captain, wellness advocate, and always trying to convince people that morning movement is worth it.",
      "pronouns": "she/her",
      "clubs": [
        "Maryland Running Club",
        "Society of Women Engineers",
        "Terps for Change"
      ],
      "courses": [
        "PHYS161",
        "ENGL101"
      ],
      "interests": [
        "running",
        "wellness",
        "community",
        "sports",
        "service"
      ],
      "follower_count": 5,
      "following_count": 3,
      "notification_prefs": {
        "push_enabled": true,
        "email_enabled": true,
        "club_updates": true,
        "event_reminders": true,
        "feed_activity": true
      },
      "push_token": null,
      "profile_completed": true,
      "onboarding_step": 3,
      "created_at": "2025-12-26T14:00:00.000Z",
      "updated_at": "2026-04-12T16:00:00.000Z"
    }
  },
  {
    "club_id": "646d7bc1-956c-593b-baec-109a7a9720b6",
    "user_id": "dceb7801-ef4a-5c0d-8c77-d45c18b15df1",
    "role": "president",
    "status": "approved",
    "joined_at": "2025-12-22T17:00:00.000Z",
    "user": {
      "id": "dceb7801-ef4a-5c0d-8c77-d45c18b15df1",
      "email": "jordan.kim@terpmail.umd.edu",
      "username": "jordank_umd",
      "display_name": "Jordan Kim",
      "avatar_url": "https://i.pravatar.cc/300?u=jordank_umd",
      "major": "Environmental Science",
      "graduation_year": 2026,
      "degree_type": "bs",
      "minor": "Geographical Sciences",
      "bio": "Outdoors club president, trail planner, and champion of touching grass during midterm season.",
      "pronouns": "they/them",
      "clubs": [
        "Maryland Running Club",
        "Maryland Outdoors Club",
        "Terps for Change"
      ],
      "courses": [
        "ENGL101",
        "PHYS161"
      ],
      "interests": [
        "outdoors",
        "sustainability",
        "community",
        "fitness",
        "travel"
      ],
      "follower_count": 2,
      "following_count": 3,
      "notification_prefs": {
        "push_enabled": true,
        "email_enabled": true,
        "club_updates": true,
        "event_reminders": true,
        "feed_activity": true
      },
      "push_token": null,
      "profile_completed": true,
      "onboarding_step": 3,
      "created_at": "2025-12-25T14:00:00.000Z",
      "updated_at": "2026-04-13T16:00:00.000Z"
    }
  },
  {
    "club_id": "646d7bc1-956c-593b-baec-109a7a9720b6",
    "user_id": "7e1d57eb-5dc7-58f1-8fe1-a165779a5ddd",
    "role": "officer",
    "status": "approved",
    "joined_at": "2025-12-21T17:00:00.000Z",
    "user": {
      "id": "7e1d57eb-5dc7-58f1-8fe1-a165779a5ddd",
      "email": "hannah.lee@terpmail.umd.edu",
      "username": "hannah_lee",
      "display_name": "Hannah Lee",
      "avatar_url": "https://i.pravatar.cc/300?u=hannah_lee",
      "major": "Public Health Science",
      "graduation_year": 2027,
      "degree_type": "bs",
      "minor": "Asian American Studies",
      "bio": "KSA president, outdoors regular, and forever making spreadsheets for things that do not need spreadsheets.",
      "pronouns": "she/her",
      "clubs": [
        "Maryland Running Club",
        "Bhangra at UMD",
        "Maryland Outdoors Club",
        "Korean Student Association"
      ],
      "courses": [
        "PHYS161",
        "STAT400"
      ],
      "interests": [
        "culture",
        "community",
        "wellness",
        "outdoors",
        "events"
      ],
      "follower_count": 6,
      "following_count": 4,
      "notification_prefs": {
        "push_enabled": true,
        "email_enabled": true,
        "club_updates": true,
        "event_reminders": true,
        "feed_activity": true
      },
      "push_token": null,
      "profile_completed": true,
      "onboarding_step": 3,
      "created_at": "2025-12-30T14:00:00.000Z",
      "updated_at": "2026-04-11T16:00:00.000Z"
    }
  },
  {
    "club_id": "646d7bc1-956c-593b-baec-109a7a9720b6",
    "user_id": "6667ca7e-5d07-5fd3-ab93-276110c38063",
    "role": "member",
    "status": "approved",
    "joined_at": "2025-12-20T17:00:00.000Z",
    "user": {
      "id": "6667ca7e-5d07-5fd3-ab93-276110c38063",
      "email": "alexj_test@terpmail.umd.edu",
      "username": "alexj_terp",
      "display_name": "Alex Johnson",
      "avatar_url": "https://i.pravatar.cc/300?u=alexj_terp",
      "major": "Computer Science",
      "graduation_year": 2026,
      "degree_type": "bs",
      "minor": "Technology Entrepreneurship",
      "bio": "Building things at UMD. Coffee enthusiast, campus explorer, and always down for a late-night build sprint.",
      "pronouns": "they/them",
      "clubs": [
        "UMD Hackers",
        "Data Science Club",
        "Terp Entrepreneurs",
        "Maryland Outdoors Club"
      ],
      "courses": [
        "CMSC216",
        "CMSC330",
        "STAT400",
        "BMGT220"
      ],
      "interests": [
        "builders",
        "startups",
        "campus-life",
        "design",
        "coffee",
        "community"
      ],
      "follower_count": 10,
      "following_count": 5,
      "notification_prefs": {
        "push_enabled": true,
        "email_enabled": true,
        "club_updates": true,
        "event_reminders": true,
        "feed_activity": true
      },
      "push_token": null,
      "profile_completed": true,
      "onboarding_step": 3,
      "created_at": "2025-12-16T14:00:00.000Z",
      "updated_at": "2026-04-13T16:00:00.000Z"
    }
  },
  {
    "club_id": "646d7bc1-956c-593b-baec-109a7a9720b6",
    "user_id": "5a90dcaa-9700-59fb-9cc9-66b19e06e6d6",
    "role": "member",
    "status": "approved",
    "joined_at": "2025-12-19T17:00:00.000Z",
    "user": {
      "id": "5a90dcaa-9700-59fb-9cc9-66b19e06e6d6",
      "email": "marcus.thompson@terpmail.umd.edu",
      "username": "marcus_t",
      "display_name": "Marcus Thompson",
      "avatar_url": "https://i.pravatar.cc/300?u=marcus_t",
      "major": "Mechanical Engineering",
      "graduation_year": 2026,
      "degree_type": "bs",
      "minor": null,
      "bio": "Mechanical engineering, early morning runs, and the loudest student-section energy you will ever meet.",
      "pronouns": "he/him",
      "clubs": [
        "Maryland Running Club",
        "Maryland Outdoors Club",
        "Korean Student Association"
      ],
      "courses": [
        "PHYS161",
        "MATH141"
      ],
      "interests": [
        "fitness",
        "sports",
        "engineering",
        "outdoors",
        "campus-events"
      ],
      "follower_count": 4,
      "following_count": 3,
      "notification_prefs": {
        "push_enabled": true,
        "email_enabled": true,
        "club_updates": true,
        "event_reminders": true,
        "feed_activity": true
      },
      "push_token": null,
      "profile_completed": true,
      "onboarding_step": 3,
      "created_at": "2025-12-20T14:00:00.000Z",
      "updated_at": "2026-04-12T16:00:00.000Z"
    }
  },
  {
    "club_id": "646d7bc1-956c-593b-baec-109a7a9720b6",
    "user_id": "1941e5a9-753c-5055-b24d-ff4990dd714e",
    "role": "member",
    "status": "approved",
    "joined_at": "2025-12-18T17:00:00.000Z",
    "user": {
      "id": "1941e5a9-753c-5055-b24d-ff4990dd714e",
      "email": "aaron.feldman@terpmail.umd.edu",
      "username": "aaronfeldman",
      "display_name": "Aaron Feldman",
      "avatar_url": "https://i.pravatar.cc/300?u=aaronfeldman",
      "major": "English",
      "graduation_year": 2027,
      "degree_type": "ba",
      "minor": "Film Studies",
      "bio": "Film Society lead programmer and enthusiastic defender of late-night screenings with strong discussion energy.",
      "pronouns": "he/him",
      "clubs": [
        "Maryland Outdoors Club",
        "Creative Coding Collective",
        "Film Society at Maryland"
      ],
      "courses": [
        "ENGL101"
      ],
      "interests": [
        "film",
        "arts",
        "storytelling",
        "community",
        "outdoors"
      ],
      "follower_count": 0,
      "following_count": 3,
      "notification_prefs": {
        "push_enabled": true,
        "email_enabled": true,
        "club_updates": true,
        "event_reminders": true,
        "feed_activity": true
      },
      "push_token": null,
      "profile_completed": true,
      "onboarding_step": 3,
      "created_at": "2026-01-02T14:00:00.000Z",
      "updated_at": "2026-04-11T16:00:00.000Z"
    }
  },
  {
    "club_id": "572b2a79-031d-5b9e-b4bb-5a727906def8",
    "user_id": "7e1d57eb-5dc7-58f1-8fe1-a165779a5ddd",
    "role": "president",
    "status": "approved",
    "joined_at": "2025-12-18T17:00:00.000Z",
    "user": {
      "id": "7e1d57eb-5dc7-58f1-8fe1-a165779a5ddd",
      "email": "hannah.lee@terpmail.umd.edu",
      "username": "hannah_lee",
      "display_name": "Hannah Lee",
      "avatar_url": "https://i.pravatar.cc/300?u=hannah_lee",
      "major": "Public Health Science",
      "graduation_year": 2027,
      "degree_type": "bs",
      "minor": "Asian American Studies",
      "bio": "KSA president, outdoors regular, and forever making spreadsheets for things that do not need spreadsheets.",
      "pronouns": "she/her",
      "clubs": [
        "Maryland Running Club",
        "Bhangra at UMD",
        "Maryland Outdoors Club",
        "Korean Student Association"
      ],
      "courses": [
        "PHYS161",
        "STAT400"
      ],
      "interests": [
        "culture",
        "community",
        "wellness",
        "outdoors",
        "events"
      ],
      "follower_count": 6,
      "following_count": 4,
      "notification_prefs": {
        "push_enabled": true,
        "email_enabled": true,
        "club_updates": true,
        "event_reminders": true,
        "feed_activity": true
      },
      "push_token": null,
      "profile_completed": true,
      "onboarding_step": 3,
      "created_at": "2025-12-30T14:00:00.000Z",
      "updated_at": "2026-04-11T16:00:00.000Z"
    }
  },
  {
    "club_id": "572b2a79-031d-5b9e-b4bb-5a727906def8",
    "user_id": "0b4c9322-5024-52dd-b93b-68b721c026ee",
    "role": "officer",
    "status": "approved",
    "joined_at": "2025-12-17T17:00:00.000Z",
    "user": {
      "id": "0b4c9322-5024-52dd-b93b-68b721c026ee",
      "email": "daniel.park@terpmail.umd.edu",
      "username": "danielpark",
      "display_name": "Daniel Park",
      "avatar_url": "https://i.pravatar.cc/300?u=danielpark",
      "major": "Computer Science",
      "graduation_year": 2025,
      "degree_type": "bs",
      "minor": "Mathematics",
      "bio": "Senior CS student, hackathon organizer, and the person who always knows which Iribe room is still open.",
      "pronouns": "he/him",
      "clubs": [
        "UMD Hackers",
        "Data Science Club",
        "Korean Student Association"
      ],
      "courses": [
        "CMSC216",
        "CMSC351",
        "MATH141"
      ],
      "interests": [
        "coding",
        "hackathons",
        "mentorship",
        "systems",
        "community"
      ],
      "follower_count": 7,
      "following_count": 3,
      "notification_prefs": {
        "push_enabled": true,
        "email_enabled": true,
        "club_updates": true,
        "event_reminders": true,
        "feed_activity": true
      },
      "push_token": null,
      "profile_completed": true,
      "onboarding_step": 3,
      "created_at": "2025-12-18T14:00:00.000Z",
      "updated_at": "2026-04-11T16:00:00.000Z"
    }
  },
  {
    "club_id": "572b2a79-031d-5b9e-b4bb-5a727906def8",
    "user_id": "5a90dcaa-9700-59fb-9cc9-66b19e06e6d6",
    "role": "member",
    "status": "approved",
    "joined_at": "2025-12-16T17:00:00.000Z",
    "user": {
      "id": "5a90dcaa-9700-59fb-9cc9-66b19e06e6d6",
      "email": "marcus.thompson@terpmail.umd.edu",
      "username": "marcus_t",
      "display_name": "Marcus Thompson",
      "avatar_url": "https://i.pravatar.cc/300?u=marcus_t",
      "major": "Mechanical Engineering",
      "graduation_year": 2026,
      "degree_type": "bs",
      "minor": null,
      "bio": "Mechanical engineering, early morning runs, and the loudest student-section energy you will ever meet.",
      "pronouns": "he/him",
      "clubs": [
        "Maryland Running Club",
        "Maryland Outdoors Club",
        "Korean Student Association"
      ],
      "courses": [
        "PHYS161",
        "MATH141"
      ],
      "interests": [
        "fitness",
        "sports",
        "engineering",
        "outdoors",
        "campus-events"
      ],
      "follower_count": 4,
      "following_count": 3,
      "notification_prefs": {
        "push_enabled": true,
        "email_enabled": true,
        "club_updates": true,
        "event_reminders": true,
        "feed_activity": true
      },
      "push_token": null,
      "profile_completed": true,
      "onboarding_step": 3,
      "created_at": "2025-12-20T14:00:00.000Z",
      "updated_at": "2026-04-12T16:00:00.000Z"
    }
  },
  {
    "club_id": "572b2a79-031d-5b9e-b4bb-5a727906def8",
    "user_id": "af45b9b4-fb14-5b6d-bbcd-5ffcc64bf110",
    "role": "member",
    "status": "approved",
    "joined_at": "2025-12-15T17:00:00.000Z",
    "user": {
      "id": "af45b9b4-fb14-5b6d-bbcd-5ffcc64bf110",
      "email": "chloe.nguyen@terpmail.umd.edu",
      "username": "chloecreates",
      "display_name": "Chloe Nguyen",
      "avatar_url": "https://i.pravatar.cc/300?u=chloecreates",
      "major": "Studio Art",
      "graduation_year": 2026,
      "degree_type": "ba",
      "minor": "Computer Science",
      "bio": "Creative Coding Collective president, poster-maker, and curator of niche but excellent campus playlists.",
      "pronouns": "she/her",
      "clubs": [
        "Bhangra at UMD",
        "Korean Student Association",
        "Creative Coding Collective",
        "Film Society at Maryland"
      ],
      "courses": [
        "ENGL101",
        "INST201"
      ],
      "interests": [
        "arts",
        "creative-tech",
        "design",
        "film",
        "culture"
      ],
      "follower_count": 2,
      "following_count": 4,
      "notification_prefs": {
        "push_enabled": true,
        "email_enabled": true,
        "club_updates": true,
        "event_reminders": true,
        "feed_activity": true
      },
      "push_token": null,
      "profile_completed": true,
      "onboarding_step": 3,
      "created_at": "2026-01-01T14:00:00.000Z",
      "updated_at": "2026-04-12T16:00:00.000Z"
    }
  },
  {
    "club_id": "572b2a79-031d-5b9e-b4bb-5a727906def8",
    "user_id": "77de58eb-8b78-5ad5-b5bb-a310726ca240",
    "role": "member",
    "status": "approved",
    "joined_at": "2025-12-14T17:00:00.000Z",
    "user": {
      "id": "77de58eb-8b78-5ad5-b5bb-a310726ca240",
      "email": "sana.mir@terpmail.umd.edu",
      "username": "sana_mir",
      "display_name": "Sana Mir",
      "avatar_url": "https://i.pravatar.cc/300?u=sana_mir",
      "major": "Neuroscience",
      "graduation_year": 2026,
      "degree_type": "bs",
      "minor": "Statistics",
      "bio": "Bhangra captain with equal love for stage lights, careful planning, and a solid post-event debrief.",
      "pronouns": "she/her",
      "clubs": [
        "Data Science Club",
        "Bhangra at UMD",
        "Korean Student Association"
      ],
      "courses": [
        "STAT400",
        "ENGL101"
      ],
      "interests": [
        "dance",
        "culture",
        "community",
        "wellness",
        "data"
      ],
      "follower_count": 9,
      "following_count": 3,
      "notification_prefs": {
        "push_enabled": true,
        "email_enabled": true,
        "club_updates": true,
        "event_reminders": true,
        "feed_activity": true
      },
      "push_token": null,
      "profile_completed": true,
      "onboarding_step": 3,
      "created_at": "2026-01-03T14:00:00.000Z",
      "updated_at": "2026-04-13T16:00:00.000Z"
    }
  },
  {
    "club_id": "572b2a79-031d-5b9e-b4bb-5a727906def8",
    "user_id": "ee83f346-1b89-59ad-83b3-5ac6a979327e",
    "role": "member",
    "status": "approved",
    "joined_at": "2025-12-13T17:00:00.000Z",
    "user": {
      "id": "ee83f346-1b89-59ad-83b3-5ac6a979327e",
      "email": "tyler.bennett@terpmail.umd.edu",
      "username": "tyler_bennett",
      "display_name": "Tyler Bennett",
      "avatar_url": "https://i.pravatar.cc/300?u=tyler_bennett",
      "major": "Economics",
      "graduation_year": 2025,
      "degree_type": "ba",
      "minor": "General Business",
      "bio": "Shows up for founder talks, club screenings, and basically any event with a good crowd and better snacks.",
      "pronouns": "he/him",
      "clubs": [
        "Terp Entrepreneurs",
        "Maryland Running Club",
        "Korean Student Association",
        "Film Society at Maryland"
      ],
      "courses": [
        "BMGT220",
        "STAT400"
      ],
      "interests": [
        "careers",
        "community",
        "culture",
        "film",
        "running"
      ],
      "follower_count": 0,
      "following_count": 4,
      "notification_prefs": {
        "push_enabled": true,
        "email_enabled": true,
        "club_updates": true,
        "event_reminders": true,
        "feed_activity": true
      },
      "push_token": null,
      "profile_completed": true,
      "onboarding_step": 3,
      "created_at": "2026-01-04T14:00:00.000Z",
      "updated_at": "2026-04-12T16:00:00.000Z"
    }
  },
  {
    "club_id": "673363a9-c22b-5446-98ac-37c379aaed6a",
    "user_id": "af45b9b4-fb14-5b6d-bbcd-5ffcc64bf110",
    "role": "president",
    "status": "approved",
    "joined_at": "2025-12-14T17:00:00.000Z",
    "user": {
      "id": "af45b9b4-fb14-5b6d-bbcd-5ffcc64bf110",
      "email": "chloe.nguyen@terpmail.umd.edu",
      "username": "chloecreates",
      "display_name": "Chloe Nguyen",
      "avatar_url": "https://i.pravatar.cc/300?u=chloecreates",
      "major": "Studio Art",
      "graduation_year": 2026,
      "degree_type": "ba",
      "minor": "Computer Science",
      "bio": "Creative Coding Collective president, poster-maker, and curator of niche but excellent campus playlists.",
      "pronouns": "she/her",
      "clubs": [
        "Bhangra at UMD",
        "Korean Student Association",
        "Creative Coding Collective",
        "Film Society at Maryland"
      ],
      "courses": [
        "ENGL101",
        "INST201"
      ],
      "interests": [
        "arts",
        "creative-tech",
        "design",
        "film",
        "culture"
      ],
      "follower_count": 2,
      "following_count": 4,
      "notification_prefs": {
        "push_enabled": true,
        "email_enabled": true,
        "club_updates": true,
        "event_reminders": true,
        "feed_activity": true
      },
      "push_token": null,
      "profile_completed": true,
      "onboarding_step": 3,
      "created_at": "2026-01-01T14:00:00.000Z",
      "updated_at": "2026-04-12T16:00:00.000Z"
    }
  },
  {
    "club_id": "673363a9-c22b-5446-98ac-37c379aaed6a",
    "user_id": "c0957686-8810-518a-8a56-df06c240f785",
    "role": "officer",
    "status": "approved",
    "joined_at": "2025-12-13T17:00:00.000Z",
    "user": {
      "id": "c0957686-8810-518a-8a56-df06c240f785",
      "email": "omar.hassan@terpmail.umd.edu",
      "username": "omarh",
      "display_name": "Omar Hassan",
      "avatar_url": "https://i.pravatar.cc/300?u=omarh",
      "major": "Computer Science",
      "graduation_year": 2026,
      "degree_type": "bs",
      "minor": "Immersive Media Design",
      "bio": "Creative technologist who likes weird interfaces, clean code, and events with a strong vibe.",
      "pronouns": "he/him",
      "clubs": [
        "UMD Hackers",
        "Terp Entrepreneurs",
        "Creative Coding Collective",
        "Film Society at Maryland"
      ],
      "courses": [
        "CMSC330",
        "CMSC351",
        "STAT400"
      ],
      "interests": [
        "creative-tech",
        "coding",
        "design",
        "film",
        "startups"
      ],
      "follower_count": 0,
      "following_count": 4,
      "notification_prefs": {
        "push_enabled": true,
        "email_enabled": true,
        "club_updates": true,
        "event_reminders": true,
        "feed_activity": true
      },
      "push_token": null,
      "profile_completed": true,
      "onboarding_step": 3,
      "created_at": "2025-12-29T14:00:00.000Z",
      "updated_at": "2026-04-12T16:00:00.000Z"
    }
  },
  {
    "club_id": "673363a9-c22b-5446-98ac-37c379aaed6a",
    "user_id": "79af4eed-7d3d-5729-8963-46e04646d23b",
    "role": "member",
    "status": "approved",
    "joined_at": "2025-12-12T17:00:00.000Z",
    "user": {
      "id": "79af4eed-7d3d-5729-8963-46e04646d23b",
      "email": "nia.brooks@terpmail.umd.edu",
      "username": "nia_builds",
      "display_name": "Nia Brooks",
      "avatar_url": "https://i.pravatar.cc/300?u=nia_builds",
      "major": "Information Science",
      "graduation_year": 2027,
      "degree_type": "bs",
      "minor": "Human-Computer Interaction",
      "bio": "Infosci student who bounces between Figma files, product strategy, and whoever needs a design critique.",
      "pronouns": "she/her",
      "clubs": [
        "UMD Hackers",
        "Terp Entrepreneurs",
        "Society of Women Engineers",
        "Creative Coding Collective"
      ],
      "courses": [
        "INST201",
        "DATA100",
        "ENGL101"
      ],
      "interests": [
        "design",
        "product",
        "builders",
        "community",
        "mentorship"
      ],
      "follower_count": 1,
      "following_count": 4,
      "notification_prefs": {
        "push_enabled": true,
        "email_enabled": true,
        "club_updates": true,
        "event_reminders": true,
        "feed_activity": true
      },
      "push_token": null,
      "profile_completed": true,
      "onboarding_step": 3,
      "created_at": "2025-12-17T14:00:00.000Z",
      "updated_at": "2026-04-12T16:00:00.000Z"
    }
  },
  {
    "club_id": "673363a9-c22b-5446-98ac-37c379aaed6a",
    "user_id": "f360a23b-4f3d-566a-959f-ea05849e43ab",
    "role": "member",
    "status": "approved",
    "joined_at": "2025-12-11T17:00:00.000Z",
    "user": {
      "id": "f360a23b-4f3d-566a-959f-ea05849e43ab",
      "email": "ethan.kim@terpmail.umd.edu",
      "username": "ethan_kim",
      "display_name": "Ethan Kim",
      "avatar_url": "https://i.pravatar.cc/300?u=ethan_kim",
      "major": "Data Science",
      "graduation_year": 2025,
      "degree_type": "bs",
      "minor": "Computer Science",
      "bio": "Data science lead who genuinely thinks a clean SQL query can fix at least half of life.",
      "pronouns": "he/him",
      "clubs": [
        "UMD Hackers",
        "Data Science Club",
        "Creative Coding Collective"
      ],
      "courses": [
        "DATA200",
        "STAT400",
        "CMSC216"
      ],
      "interests": [
        "data",
        "analytics",
        "coding",
        "careers",
        "mentorship"
      ],
      "follower_count": 9,
      "following_count": 3,
      "notification_prefs": {
        "push_enabled": true,
        "email_enabled": true,
        "club_updates": true,
        "event_reminders": true,
        "feed_activity": true
      },
      "push_token": null,
      "profile_completed": true,
      "onboarding_step": 3,
      "created_at": "2025-12-23T14:00:00.000Z",
      "updated_at": "2026-04-12T16:00:00.000Z"
    }
  },
  {
    "club_id": "673363a9-c22b-5446-98ac-37c379aaed6a",
    "user_id": "ca86602c-434a-50de-af39-90312889c45d",
    "role": "member",
    "status": "approved",
    "joined_at": "2025-12-10T17:00:00.000Z",
    "user": {
      "id": "ca86602c-434a-50de-af39-90312889c45d",
      "email": "sofia.alvarez@terpmail.umd.edu",
      "username": "sofia_alvarez",
      "display_name": "Sofia Alvarez",
      "avatar_url": "https://i.pravatar.cc/300?u=sofia_alvarez",
      "major": "Journalism",
      "graduation_year": 2027,
      "degree_type": "ba",
      "minor": "Film Studies",
      "bio": "Campus storyteller with a camera roll full of sunsets, events, and people being unexpectedly iconic.",
      "pronouns": "she/her",
      "clubs": [
        "Terp Entrepreneurs",
        "Creative Coding Collective",
        "Terps for Change",
        "Film Society at Maryland"
      ],
      "courses": [
        "ENGL101"
      ],
      "interests": [
        "film",
        "storytelling",
        "community",
        "arts",
        "photography"
      ],
      "follower_count": 0,
      "following_count": 4,
      "notification_prefs": {
        "push_enabled": true,
        "email_enabled": true,
        "club_updates": true,
        "event_reminders": true,
        "feed_activity": true
      },
      "push_token": null,
      "profile_completed": true,
      "onboarding_step": 3,
      "created_at": "2025-12-24T14:00:00.000Z",
      "updated_at": "2026-04-11T16:00:00.000Z"
    }
  },
  {
    "club_id": "673363a9-c22b-5446-98ac-37c379aaed6a",
    "user_id": "1941e5a9-753c-5055-b24d-ff4990dd714e",
    "role": "member",
    "status": "approved",
    "joined_at": "2025-12-09T17:00:00.000Z",
    "user": {
      "id": "1941e5a9-753c-5055-b24d-ff4990dd714e",
      "email": "aaron.feldman@terpmail.umd.edu",
      "username": "aaronfeldman",
      "display_name": "Aaron Feldman",
      "avatar_url": "https://i.pravatar.cc/300?u=aaronfeldman",
      "major": "English",
      "graduation_year": 2027,
      "degree_type": "ba",
      "minor": "Film Studies",
      "bio": "Film Society lead programmer and enthusiastic defender of late-night screenings with strong discussion energy.",
      "pronouns": "he/him",
      "clubs": [
        "Maryland Outdoors Club",
        "Creative Coding Collective",
        "Film Society at Maryland"
      ],
      "courses": [
        "ENGL101"
      ],
      "interests": [
        "film",
        "arts",
        "storytelling",
        "community",
        "outdoors"
      ],
      "follower_count": 0,
      "following_count": 3,
      "notification_prefs": {
        "push_enabled": true,
        "email_enabled": true,
        "club_updates": true,
        "event_reminders": true,
        "feed_activity": true
      },
      "push_token": null,
      "profile_completed": true,
      "onboarding_step": 3,
      "created_at": "2026-01-02T14:00:00.000Z",
      "updated_at": "2026-04-11T16:00:00.000Z"
    }
  },
  {
    "club_id": "b934a1b0-cf09-5fba-b612-1b8d8ee70570",
    "user_id": "a49d4554-325c-5c88-afaa-ef947f0a115a",
    "role": "president",
    "status": "approved",
    "joined_at": "2025-12-10T17:00:00.000Z",
    "user": {
      "id": "a49d4554-325c-5c88-afaa-ef947f0a115a",
      "email": "maya.patel@terpmail.umd.edu",
      "username": "maya_p",
      "display_name": "Maya Patel",
      "avatar_url": "https://i.pravatar.cc/300?u=maya_p",
      "major": "Government and Politics",
      "graduation_year": 2027,
      "degree_type": "ba",
      "minor": "Nonprofit Leadership",
      "bio": "Policy nerd, service organizer, and the friend who will always send you the registration deadline first.",
      "pronouns": "she/her",
      "clubs": [
        "Bhangra at UMD",
        "Society of Women Engineers",
        "Terps for Change",
        "Film Society at Maryland"
      ],
      "courses": [
        "ENGL101",
        "BMGT220"
      ],
      "interests": [
        "service",
        "advocacy",
        "community",
        "culture",
        "leadership"
      ],
      "follower_count": 0,
      "following_count": 4,
      "notification_prefs": {
        "push_enabled": true,
        "email_enabled": true,
        "club_updates": true,
        "event_reminders": true,
        "feed_activity": true
      },
      "push_token": null,
      "profile_completed": true,
      "onboarding_step": 3,
      "created_at": "2025-12-21T14:00:00.000Z",
      "updated_at": "2026-04-11T16:00:00.000Z"
    }
  },
  {
    "club_id": "b934a1b0-cf09-5fba-b612-1b8d8ee70570",
    "user_id": "9ffda673-63bb-542b-9b0d-0de86e4557ee",
    "role": "officer",
    "status": "approved",
    "joined_at": "2025-12-09T17:00:00.000Z",
    "user": {
      "id": "9ffda673-63bb-542b-9b0d-0de86e4557ee",
      "email": "aaliyah.green@terpmail.umd.edu",
      "username": "aaliyah_green",
      "display_name": "Aaliyah Green",
      "avatar_url": "https://i.pravatar.cc/300?u=aaliyah_green",
      "major": "Kinesiology",
      "graduation_year": 2027,
      "degree_type": "bs",
      "minor": null,
      "bio": "Running club captain, wellness advocate, and always trying to convince people that morning movement is worth it.",
      "pronouns": "she/her",
      "clubs": [
        "Maryland Running Club",
        "Society of Women Engineers",
        "Terps for Change"
      ],
      "courses": [
        "PHYS161",
        "ENGL101"
      ],
      "interests": [
        "running",
        "wellness",
        "community",
        "sports",
        "service"
      ],
      "follower_count": 5,
      "following_count": 3,
      "notification_prefs": {
        "push_enabled": true,
        "email_enabled": true,
        "club_updates": true,
        "event_reminders": true,
        "feed_activity": true
      },
      "push_token": null,
      "profile_completed": true,
      "onboarding_step": 3,
      "created_at": "2025-12-26T14:00:00.000Z",
      "updated_at": "2026-04-12T16:00:00.000Z"
    }
  },
  {
    "club_id": "b934a1b0-cf09-5fba-b612-1b8d8ee70570",
    "user_id": "dceb7801-ef4a-5c0d-8c77-d45c18b15df1",
    "role": "member",
    "status": "approved",
    "joined_at": "2025-12-08T17:00:00.000Z",
    "user": {
      "id": "dceb7801-ef4a-5c0d-8c77-d45c18b15df1",
      "email": "jordan.kim@terpmail.umd.edu",
      "username": "jordank_umd",
      "display_name": "Jordan Kim",
      "avatar_url": "https://i.pravatar.cc/300?u=jordank_umd",
      "major": "Environmental Science",
      "graduation_year": 2026,
      "degree_type": "bs",
      "minor": "Geographical Sciences",
      "bio": "Outdoors club president, trail planner, and champion of touching grass during midterm season.",
      "pronouns": "they/them",
      "clubs": [
        "Maryland Running Club",
        "Maryland Outdoors Club",
        "Terps for Change"
      ],
      "courses": [
        "ENGL101",
        "PHYS161"
      ],
      "interests": [
        "outdoors",
        "sustainability",
        "community",
        "fitness",
        "travel"
      ],
      "follower_count": 2,
      "following_count": 3,
      "notification_prefs": {
        "push_enabled": true,
        "email_enabled": true,
        "club_updates": true,
        "event_reminders": true,
        "feed_activity": true
      },
      "push_token": null,
      "profile_completed": true,
      "onboarding_step": 3,
      "created_at": "2025-12-25T14:00:00.000Z",
      "updated_at": "2026-04-13T16:00:00.000Z"
    }
  },
  {
    "club_id": "b934a1b0-cf09-5fba-b612-1b8d8ee70570",
    "user_id": "ca86602c-434a-50de-af39-90312889c45d",
    "role": "member",
    "status": "approved",
    "joined_at": "2025-12-07T17:00:00.000Z",
    "user": {
      "id": "ca86602c-434a-50de-af39-90312889c45d",
      "email": "sofia.alvarez@terpmail.umd.edu",
      "username": "sofia_alvarez",
      "display_name": "Sofia Alvarez",
      "avatar_url": "https://i.pravatar.cc/300?u=sofia_alvarez",
      "major": "Journalism",
      "graduation_year": 2027,
      "degree_type": "ba",
      "minor": "Film Studies",
      "bio": "Campus storyteller with a camera roll full of sunsets, events, and people being unexpectedly iconic.",
      "pronouns": "she/her",
      "clubs": [
        "Terp Entrepreneurs",
        "Creative Coding Collective",
        "Terps for Change",
        "Film Society at Maryland"
      ],
      "courses": [
        "ENGL101"
      ],
      "interests": [
        "film",
        "storytelling",
        "community",
        "arts",
        "photography"
      ],
      "follower_count": 0,
      "following_count": 4,
      "notification_prefs": {
        "push_enabled": true,
        "email_enabled": true,
        "club_updates": true,
        "event_reminders": true,
        "feed_activity": true
      },
      "push_token": null,
      "profile_completed": true,
      "onboarding_step": 3,
      "created_at": "2025-12-24T14:00:00.000Z",
      "updated_at": "2026-04-11T16:00:00.000Z"
    }
  },
  {
    "club_id": "b934a1b0-cf09-5fba-b612-1b8d8ee70570",
    "user_id": "9e36e2f6-f994-573b-b8f8-5e7ee6c3a6f4",
    "role": "member",
    "status": "approved",
    "joined_at": "2025-12-06T17:00:00.000Z",
    "user": {
      "id": "9e36e2f6-f994-573b-b8f8-5e7ee6c3a6f4",
      "email": "david.okafor@terpmail.umd.edu",
      "username": "davidok",
      "display_name": "David Okafor",
      "avatar_url": "https://i.pravatar.cc/300?u=davidok",
      "major": "Computer Engineering",
      "graduation_year": 2025,
      "degree_type": "bs",
      "minor": null,
      "bio": "Hardware + software + service hours. Finds a way to help before anyone asks.",
      "pronouns": "he/him",
      "clubs": [
        "UMD Hackers",
        "Data Science Club",
        "Terps for Change"
      ],
      "courses": [
        "CMSC216",
        "PHYS161",
        "MATH141"
      ],
      "interests": [
        "engineering",
        "service",
        "coding",
        "mentorship",
        "community"
      ],
      "follower_count": 0,
      "following_count": 3,
      "notification_prefs": {
        "push_enabled": true,
        "email_enabled": true,
        "club_updates": true,
        "event_reminders": true,
        "feed_activity": true
      },
      "push_token": null,
      "profile_completed": true,
      "onboarding_step": 3,
      "created_at": "2025-12-31T14:00:00.000Z",
      "updated_at": "2026-04-13T16:00:00.000Z"
    }
  },
  {
    "club_id": "44f63ee3-2917-5ac3-84f4-0ab9aa8cbe2a",
    "user_id": "1941e5a9-753c-5055-b24d-ff4990dd714e",
    "role": "president",
    "status": "approved",
    "joined_at": "2025-12-06T17:00:00.000Z",
    "user": {
      "id": "1941e5a9-753c-5055-b24d-ff4990dd714e",
      "email": "aaron.feldman@terpmail.umd.edu",
      "username": "aaronfeldman",
      "display_name": "Aaron Feldman",
      "avatar_url": "https://i.pravatar.cc/300?u=aaronfeldman",
      "major": "English",
      "graduation_year": 2027,
      "degree_type": "ba",
      "minor": "Film Studies",
      "bio": "Film Society lead programmer and enthusiastic defender of late-night screenings with strong discussion energy.",
      "pronouns": "he/him",
      "clubs": [
        "Maryland Outdoors Club",
        "Creative Coding Collective",
        "Film Society at Maryland"
      ],
      "courses": [
        "ENGL101"
      ],
      "interests": [
        "film",
        "arts",
        "storytelling",
        "community",
        "outdoors"
      ],
      "follower_count": 0,
      "following_count": 3,
      "notification_prefs": {
        "push_enabled": true,
        "email_enabled": true,
        "club_updates": true,
        "event_reminders": true,
        "feed_activity": true
      },
      "push_token": null,
      "profile_completed": true,
      "onboarding_step": 3,
      "created_at": "2026-01-02T14:00:00.000Z",
      "updated_at": "2026-04-11T16:00:00.000Z"
    }
  },
  {
    "club_id": "44f63ee3-2917-5ac3-84f4-0ab9aa8cbe2a",
    "user_id": "ca86602c-434a-50de-af39-90312889c45d",
    "role": "officer",
    "status": "approved",
    "joined_at": "2025-12-05T17:00:00.000Z",
    "user": {
      "id": "ca86602c-434a-50de-af39-90312889c45d",
      "email": "sofia.alvarez@terpmail.umd.edu",
      "username": "sofia_alvarez",
      "display_name": "Sofia Alvarez",
      "avatar_url": "https://i.pravatar.cc/300?u=sofia_alvarez",
      "major": "Journalism",
      "graduation_year": 2027,
      "degree_type": "ba",
      "minor": "Film Studies",
      "bio": "Campus storyteller with a camera roll full of sunsets, events, and people being unexpectedly iconic.",
      "pronouns": "she/her",
      "clubs": [
        "Terp Entrepreneurs",
        "Creative Coding Collective",
        "Terps for Change",
        "Film Society at Maryland"
      ],
      "courses": [
        "ENGL101"
      ],
      "interests": [
        "film",
        "storytelling",
        "community",
        "arts",
        "photography"
      ],
      "follower_count": 0,
      "following_count": 4,
      "notification_prefs": {
        "push_enabled": true,
        "email_enabled": true,
        "club_updates": true,
        "event_reminders": true,
        "feed_activity": true
      },
      "push_token": null,
      "profile_completed": true,
      "onboarding_step": 3,
      "created_at": "2025-12-24T14:00:00.000Z",
      "updated_at": "2026-04-11T16:00:00.000Z"
    }
  },
  {
    "club_id": "44f63ee3-2917-5ac3-84f4-0ab9aa8cbe2a",
    "user_id": "a49d4554-325c-5c88-afaa-ef947f0a115a",
    "role": "member",
    "status": "approved",
    "joined_at": "2025-12-04T17:00:00.000Z",
    "user": {
      "id": "a49d4554-325c-5c88-afaa-ef947f0a115a",
      "email": "maya.patel@terpmail.umd.edu",
      "username": "maya_p",
      "display_name": "Maya Patel",
      "avatar_url": "https://i.pravatar.cc/300?u=maya_p",
      "major": "Government and Politics",
      "graduation_year": 2027,
      "degree_type": "ba",
      "minor": "Nonprofit Leadership",
      "bio": "Policy nerd, service organizer, and the friend who will always send you the registration deadline first.",
      "pronouns": "she/her",
      "clubs": [
        "Bhangra at UMD",
        "Society of Women Engineers",
        "Terps for Change",
        "Film Society at Maryland"
      ],
      "courses": [
        "ENGL101",
        "BMGT220"
      ],
      "interests": [
        "service",
        "advocacy",
        "community",
        "culture",
        "leadership"
      ],
      "follower_count": 0,
      "following_count": 4,
      "notification_prefs": {
        "push_enabled": true,
        "email_enabled": true,
        "club_updates": true,
        "event_reminders": true,
        "feed_activity": true
      },
      "push_token": null,
      "profile_completed": true,
      "onboarding_step": 3,
      "created_at": "2025-12-21T14:00:00.000Z",
      "updated_at": "2026-04-11T16:00:00.000Z"
    }
  },
  {
    "club_id": "44f63ee3-2917-5ac3-84f4-0ab9aa8cbe2a",
    "user_id": "bf962ba5-980e-5ed4-b080-3ddad5c2e760",
    "role": "member",
    "status": "approved",
    "joined_at": "2025-12-03T17:00:00.000Z",
    "user": {
      "id": "bf962ba5-980e-5ed4-b080-3ddad5c2e760",
      "email": "leena.rao@terpmail.umd.edu",
      "username": "leena_rao",
      "display_name": "Leena Rao",
      "avatar_url": "https://i.pravatar.cc/300?u=leena_rao",
      "major": "Finance",
      "graduation_year": 2026,
      "degree_type": "bs",
      "minor": "Technology Entrepreneurship",
      "bio": "Usually somewhere between a pitch deck, a rehearsal, and a coffee run through Stamp.",
      "pronouns": "she/her",
      "clubs": [
        "Terp Entrepreneurs",
        "Bhangra at UMD",
        "Film Society at Maryland"
      ],
      "courses": [
        "BMGT220",
        "STAT400"
      ],
      "interests": [
        "startups",
        "music",
        "community",
        "culture",
        "events"
      ],
      "follower_count": 7,
      "following_count": 3,
      "notification_prefs": {
        "push_enabled": true,
        "email_enabled": true,
        "club_updates": true,
        "event_reminders": true,
        "feed_activity": true
      },
      "push_token": null,
      "profile_completed": true,
      "onboarding_step": 3,
      "created_at": "2025-12-22T14:00:00.000Z",
      "updated_at": "2026-04-13T16:00:00.000Z"
    }
  },
  {
    "club_id": "44f63ee3-2917-5ac3-84f4-0ab9aa8cbe2a",
    "user_id": "c0957686-8810-518a-8a56-df06c240f785",
    "role": "member",
    "status": "approved",
    "joined_at": "2025-12-02T17:00:00.000Z",
    "user": {
      "id": "c0957686-8810-518a-8a56-df06c240f785",
      "email": "omar.hassan@terpmail.umd.edu",
      "username": "omarh",
      "display_name": "Omar Hassan",
      "avatar_url": "https://i.pravatar.cc/300?u=omarh",
      "major": "Computer Science",
      "graduation_year": 2026,
      "degree_type": "bs",
      "minor": "Immersive Media Design",
      "bio": "Creative technologist who likes weird interfaces, clean code, and events with a strong vibe.",
      "pronouns": "he/him",
      "clubs": [
        "UMD Hackers",
        "Terp Entrepreneurs",
        "Creative Coding Collective",
        "Film Society at Maryland"
      ],
      "courses": [
        "CMSC330",
        "CMSC351",
        "STAT400"
      ],
      "interests": [
        "creative-tech",
        "coding",
        "design",
        "film",
        "startups"
      ],
      "follower_count": 0,
      "following_count": 4,
      "notification_prefs": {
        "push_enabled": true,
        "email_enabled": true,
        "club_updates": true,
        "event_reminders": true,
        "feed_activity": true
      },
      "push_token": null,
      "profile_completed": true,
      "onboarding_step": 3,
      "created_at": "2025-12-29T14:00:00.000Z",
      "updated_at": "2026-04-12T16:00:00.000Z"
    }
  },
  {
    "club_id": "44f63ee3-2917-5ac3-84f4-0ab9aa8cbe2a",
    "user_id": "af45b9b4-fb14-5b6d-bbcd-5ffcc64bf110",
    "role": "member",
    "status": "approved",
    "joined_at": "2025-12-01T17:00:00.000Z",
    "user": {
      "id": "af45b9b4-fb14-5b6d-bbcd-5ffcc64bf110",
      "email": "chloe.nguyen@terpmail.umd.edu",
      "username": "chloecreates",
      "display_name": "Chloe Nguyen",
      "avatar_url": "https://i.pravatar.cc/300?u=chloecreates",
      "major": "Studio Art",
      "graduation_year": 2026,
      "degree_type": "ba",
      "minor": "Computer Science",
      "bio": "Creative Coding Collective president, poster-maker, and curator of niche but excellent campus playlists.",
      "pronouns": "she/her",
      "clubs": [
        "Bhangra at UMD",
        "Korean Student Association",
        "Creative Coding Collective",
        "Film Society at Maryland"
      ],
      "courses": [
        "ENGL101",
        "INST201"
      ],
      "interests": [
        "arts",
        "creative-tech",
        "design",
        "film",
        "culture"
      ],
      "follower_count": 2,
      "following_count": 4,
      "notification_prefs": {
        "push_enabled": true,
        "email_enabled": true,
        "club_updates": true,
        "event_reminders": true,
        "feed_activity": true
      },
      "push_token": null,
      "profile_completed": true,
      "onboarding_step": 3,
      "created_at": "2026-01-01T14:00:00.000Z",
      "updated_at": "2026-04-12T16:00:00.000Z"
    }
  },
  {
    "club_id": "44f63ee3-2917-5ac3-84f4-0ab9aa8cbe2a",
    "user_id": "ee83f346-1b89-59ad-83b3-5ac6a979327e",
    "role": "member",
    "status": "approved",
    "joined_at": "2025-11-30T17:00:00.000Z",
    "user": {
      "id": "ee83f346-1b89-59ad-83b3-5ac6a979327e",
      "email": "tyler.bennett@terpmail.umd.edu",
      "username": "tyler_bennett",
      "display_name": "Tyler Bennett",
      "avatar_url": "https://i.pravatar.cc/300?u=tyler_bennett",
      "major": "Economics",
      "graduation_year": 2025,
      "degree_type": "ba",
      "minor": "General Business",
      "bio": "Shows up for founder talks, club screenings, and basically any event with a good crowd and better snacks.",
      "pronouns": "he/him",
      "clubs": [
        "Terp Entrepreneurs",
        "Maryland Running Club",
        "Korean Student Association",
        "Film Society at Maryland"
      ],
      "courses": [
        "BMGT220",
        "STAT400"
      ],
      "interests": [
        "careers",
        "community",
        "culture",
        "film",
        "running"
      ],
      "follower_count": 0,
      "following_count": 4,
      "notification_prefs": {
        "push_enabled": true,
        "email_enabled": true,
        "club_updates": true,
        "event_reminders": true,
        "feed_activity": true
      },
      "push_token": null,
      "profile_completed": true,
      "onboarding_step": 3,
      "created_at": "2026-01-04T14:00:00.000Z",
      "updated_at": "2026-04-12T16:00:00.000Z"
    }
  }
] as ClubMemberWithUser[];

export interface JoinRequest {
  id: string;
  club_id: string;
  user: User;
  status: 'pending' | 'approved' | 'rejected';
  answers: string[];
  requested_at: string;
}

export const mockJoinRequests = [] as JoinRequest[];

export const mockClubEvents = [
  {
    "id": "17d78d68-8c7b-53f5-aba1-1f2e5a37cc82",
    "title": "Founder Coffee Chat",
    "description": "A small-group conversation with alumni founders on how they built momentum before their first full-time hire.",
    "club_id": "0e68c4f2-2b14-505c-972d-dda49fca824a",
    "created_by": "3a44d09f-f9ee-5606-8958-3cdb4d945381",
    "organizer_name": "Terp Entrepreneurs",
    "category": "career",
    "starts_at": "2026-04-10T21:30:00.000Z",
    "ends_at": "2026-04-10T23:00:00.000Z",
    "status": "upcoming",
    "moderation_status": "approved",
    "location_name": "Van Munching Hall",
    "location_id": "4b26f7b3-868a-53db-a1fe-4a81647258ba",
    "latitude": 38.9825,
    "longitude": -76.944,
    "image_url": "https://images.unsplash.com/photo-1515169067868-5387ec356754?auto=format&fit=crop&w=1200&q=80",
    "rsvp_count": 8,
    "attendee_count": 8,
    "interested_count": 2,
    "max_capacity": 40,
    "is_featured": false,
    "tags": [
      "startups",
      "careers",
      "networking"
    ],
    "location": "Van Munching Hall",
    "created_at": "2026-04-08T21:30:00.000Z",
    "updated_at": "2026-04-08T21:30:00.000Z"
  },
  {
    "id": "5c79e535-ccf4-564b-ad21-a16f729ca080",
    "title": "Trail Conditioning Run",
    "description": "Hill repeats, relaxed pacing groups, and a cooldown stretch before sunset.",
    "club_id": "93df5013-9ec9-56e2-8f1e-dbbb52ad5feb",
    "created_by": "5a90dcaa-9700-59fb-9cc9-66b19e06e6d6",
    "organizer_name": "Maryland Running Club",
    "category": "sports",
    "starts_at": "2026-04-09T22:00:00.000Z",
    "ends_at": "2026-04-09T23:15:00.000Z",
    "status": "upcoming",
    "moderation_status": "approved",
    "location_name": "Eppley Recreation Center",
    "location_id": "179e4957-1849-5046-a515-a9fc7fadc8a3",
    "latitude": 38.9935,
    "longitude": -76.9415,
    "image_url": "https://images.unsplash.com/photo-1552674605-db6ffd4facb5?auto=format&fit=crop&w=1200&q=80",
    "rsvp_count": 4,
    "attendee_count": 4,
    "interested_count": 1,
    "max_capacity": 40,
    "is_featured": false,
    "tags": [
      "running",
      "fitness",
      "wellness"
    ],
    "location": "Eppley Recreation Center",
    "created_at": "2026-04-06T22:00:00.000Z",
    "updated_at": "2026-04-06T22:00:00.000Z"
  },
  {
    "id": "28a04154-5255-57f5-842d-98df5fe10753",
    "title": "Bhangra Open Practice",
    "description": "An open rehearsal night for new dancers curious about the team and returning members brushing up before showcase season.",
    "club_id": "2c3160cc-928d-54c2-817c-2abc9ad857bf",
    "created_by": "77de58eb-8b78-5ad5-b5bb-a310726ca240",
    "organizer_name": "Bhangra at UMD",
    "category": "arts",
    "starts_at": "2026-04-13T23:30:00.000Z",
    "ends_at": "2026-04-14T01:30:00.000Z",
    "status": "upcoming",
    "moderation_status": "approved",
    "location_name": "The Clarice Smith Center",
    "location_id": "ae20b078-531a-5310-b481-00504efc443a",
    "latitude": 38.9915,
    "longitude": -76.946,
    "image_url": "https://images.unsplash.com/photo-1508804185872-d7badad00f7d?auto=format&fit=crop&w=1200&q=80",
    "rsvp_count": 8,
    "attendee_count": 8,
    "interested_count": 2,
    "max_capacity": 40,
    "is_featured": false,
    "tags": [
      "dance",
      "culture",
      "performance"
    ],
    "location": "The Clarice Smith Center",
    "created_at": "2026-04-09T23:30:00.000Z",
    "updated_at": "2026-04-09T23:30:00.000Z"
  },
  {
    "id": "52bc4a78-4cab-5d58-8d6f-24b526793f3a",
    "title": "Mutual Aid Packing Night",
    "description": "Packing hygiene kits with a quick volunteer briefing and distribution plan for the weekend.",
    "club_id": "b934a1b0-cf09-5fba-b612-1b8d8ee70570",
    "created_by": "a49d4554-325c-5c88-afaa-ef947f0a115a",
    "organizer_name": "Terps for Change",
    "category": "other",
    "starts_at": "2026-04-11T22:30:00.000Z",
    "ends_at": "2026-04-12T00:15:00.000Z",
    "status": "upcoming",
    "moderation_status": "approved",
    "location_name": "Stamp Student Union",
    "location_id": "b2495581-a99e-5f12-bc26-9106664c28a8",
    "latitude": 38.9882,
    "longitude": -76.9452,
    "image_url": "https://images.unsplash.com/photo-1503428593586-e225b39bddfe?auto=format&fit=crop&w=1200&q=80",
    "rsvp_count": 4,
    "attendee_count": 4,
    "interested_count": 0,
    "max_capacity": 40,
    "is_featured": false,
    "tags": [
      "service",
      "community",
      "impact"
    ],
    "location": "Stamp Student Union",
    "created_at": "2026-04-06T22:30:00.000Z",
    "updated_at": "2026-04-06T22:30:00.000Z"
  },
  {
    "id": "e1681bc4-21d1-526b-9a95-d8150e59b670",
    "title": "SQL Study Jam",
    "description": "Bring your homework, project ideas, or interview prep questions for a guided work session in McKeldin.",
    "club_id": "94dc4785-694a-5b8a-b73d-d6e896187afb",
    "created_by": "f360a23b-4f3d-566a-959f-ea05849e43ab",
    "organizer_name": "Data Science Club",
    "category": "academic",
    "starts_at": "2026-04-12T23:00:00.000Z",
    "ends_at": "2026-04-13T01:00:00.000Z",
    "status": "upcoming",
    "moderation_status": "approved",
    "location_name": "McKeldin Library",
    "location_id": "6ef728db-4dbe-5183-b93a-45ce24a2af3d",
    "latitude": 38.986,
    "longitude": -76.9447,
    "image_url": "https://images.unsplash.com/photo-1481627834876-b7833e8f5570?auto=format&fit=crop&w=1200&q=80",
    "rsvp_count": 8,
    "attendee_count": 8,
    "interested_count": 2,
    "max_capacity": 40,
    "is_featured": false,
    "tags": [
      "data",
      "sql",
      "study"
    ],
    "location": "McKeldin Library",
    "created_at": "2026-04-10T23:00:00.000Z",
    "updated_at": "2026-04-10T23:00:00.000Z"
  },
  {
    "id": "cc06e4c7-27c1-52a2-887a-148e86f78083",
    "title": "Hack Night #3",
    "description": "Weekly build sprint with mentors, whiteboards, and enough snacks to keep people around well past nine.",
    "club_id": "aaa41ac9-63e0-592f-a177-be36e8b212ee",
    "created_by": "6667ca7e-5d07-5fd3-ab93-276110c38063",
    "organizer_name": "UMD Hackers",
    "category": "workshop",
    "starts_at": "2026-04-08T23:00:00.000Z",
    "ends_at": "2026-04-09T01:30:00.000Z",
    "status": "upcoming",
    "moderation_status": "approved",
    "location_name": "Brendan Iribe Center",
    "location_id": "32fd8979-6048-5b0b-8310-d8fca984a96a",
    "latitude": 38.989,
    "longitude": -76.9365,
    "image_url": "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=1200&q=80",
    "rsvp_count": 15,
    "attendee_count": 15,
    "interested_count": 2,
    "max_capacity": 120,
    "is_featured": false,
    "tags": [
      "coding",
      "builders",
      "workshop"
    ],
    "location": "Brendan Iribe Center",
    "created_at": "2026-04-05T23:00:00.000Z",
    "updated_at": "2026-04-05T23:00:00.000Z"
  },
  {
    "id": "3cf3b8b8-b073-5e71-a4e2-31c6d2994712",
    "title": "Hackers Build Lab",
    "description": "Drop in right now for mentor office hours, quick demos, and a warm room full of people shipping things.",
    "club_id": "aaa41ac9-63e0-592f-a177-be36e8b212ee",
    "created_by": "0b4c9322-5024-52dd-b93b-68b721c026ee",
    "organizer_name": "UMD Hackers",
    "category": "workshop",
    "starts_at": "2026-04-15T21:40:38.936Z",
    "ends_at": "2026-04-16T00:10:38.936Z",
    "status": "upcoming",
    "moderation_status": "approved",
    "location_name": "Brendan Iribe Center",
    "location_id": "32fd8979-6048-5b0b-8310-d8fca984a96a",
    "latitude": 38.989,
    "longitude": -76.9365,
    "image_url": "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=1200&q=80",
    "rsvp_count": 9,
    "attendee_count": 9,
    "interested_count": 2,
    "max_capacity": 40,
    "is_featured": false,
    "tags": [
      "coding",
      "builders",
      "mentor"
    ],
    "location": "Brendan Iribe Center",
    "created_at": "2026-04-11T21:40:38.936Z",
    "updated_at": "2026-04-11T21:40:38.936Z"
  },
  {
    "id": "86f93fcb-14a7-5244-9131-25ac345dd6c9",
    "title": "Data Science Office Hours",
    "description": "Live help on Python, SQL, and project cleanup before recruiting deadlines hit.",
    "club_id": "94dc4785-694a-5b8a-b73d-d6e896187afb",
    "created_by": "77de58eb-8b78-5ad5-b5bb-a310726ca240",
    "organizer_name": "Data Science Club",
    "category": "academic",
    "starts_at": "2026-04-15T21:55:38.936Z",
    "ends_at": "2026-04-15T23:55:38.936Z",
    "status": "upcoming",
    "moderation_status": "approved",
    "location_name": "McKeldin Library",
    "location_id": "6ef728db-4dbe-5183-b93a-45ce24a2af3d",
    "latitude": 38.986,
    "longitude": -76.9447,
    "image_url": "https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=1200&q=80",
    "rsvp_count": 8,
    "attendee_count": 8,
    "interested_count": 2,
    "max_capacity": 40,
    "is_featured": false,
    "tags": [
      "data",
      "python",
      "study"
    ],
    "location": "McKeldin Library",
    "created_at": "2026-04-10T21:55:38.936Z",
    "updated_at": "2026-04-10T21:55:38.936Z"
  },
  {
    "id": "f01a4cc6-9d60-5ec9-ad24-90c854473dcb",
    "title": "Editing Bay Open Hours",
    "description": "A quiet-but-social work block for anyone cutting a short, polishing audio, or getting feedback on a scene.",
    "club_id": "44f63ee3-2917-5ac3-84f4-0ab9aa8cbe2a",
    "created_by": "1941e5a9-753c-5055-b24d-ff4990dd714e",
    "organizer_name": "Film Society at Maryland",
    "category": "arts",
    "starts_at": "2026-04-15T22:10:38.936Z",
    "ends_at": "2026-04-16T00:10:38.936Z",
    "status": "upcoming",
    "moderation_status": "approved",
    "location_name": "Stamp Student Union",
    "location_id": "b2495581-a99e-5f12-bc26-9106664c28a8",
    "latitude": 38.9882,
    "longitude": -76.9452,
    "image_url": "https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?auto=format&fit=crop&w=1200&q=80",
    "rsvp_count": 4,
    "attendee_count": 4,
    "interested_count": 1,
    "max_capacity": 40,
    "is_featured": false,
    "tags": [
      "film",
      "editing",
      "arts"
    ],
    "location": "Stamp Student Union",
    "created_at": "2026-04-13T22:10:38.936Z",
    "updated_at": "2026-04-13T22:10:38.936Z"
  },
  {
    "id": "7f12062a-473a-56c6-98a1-f58990f4889d",
    "title": "Hack Night #4",
    "description": "This week is all about fast iterations: project debugging, mentor checkpoints, pizza, and a sponsor prize drop at the end.",
    "club_id": "aaa41ac9-63e0-592f-a177-be36e8b212ee",
    "created_by": "6667ca7e-5d07-5fd3-ab93-276110c38063",
    "organizer_name": "UMD Hackers",
    "category": "workshop",
    "starts_at": "2026-04-15T23:00:00.000Z",
    "ends_at": "2026-04-16T01:30:00.000Z",
    "status": "upcoming",
    "moderation_status": "approved",
    "location_name": "Brendan Iribe Center",
    "location_id": "32fd8979-6048-5b0b-8310-d8fca984a96a",
    "latitude": 38.989,
    "longitude": -76.9365,
    "image_url": "https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=1200&q=80",
    "rsvp_count": 16,
    "attendee_count": 16,
    "interested_count": 2,
    "max_capacity": 120,
    "is_featured": true,
    "tags": [
      "coding",
      "builders",
      "pizza",
      "hackathon"
    ],
    "location": "Brendan Iribe Center",
    "created_at": "2026-04-12T23:00:00.000Z",
    "updated_at": "2026-04-12T23:00:00.000Z"
  },
  {
    "id": "5835cefc-108f-53c3-b300-0cb36d2b2b4f",
    "title": "Analytics Resume Clinic",
    "description": "Bring your current resume and get line-by-line feedback from older students who just finished internship recruiting.",
    "club_id": "94dc4785-694a-5b8a-b73d-d6e896187afb",
    "created_by": "f360a23b-4f3d-566a-959f-ea05849e43ab",
    "organizer_name": "Data Science Club",
    "category": "career",
    "starts_at": "2026-04-15T22:30:00.000Z",
    "ends_at": "2026-04-16T00:00:00.000Z",
    "status": "upcoming",
    "moderation_status": "approved",
    "location_name": "McKeldin Library",
    "location_id": "6ef728db-4dbe-5183-b93a-45ce24a2af3d",
    "latitude": 38.986,
    "longitude": -76.9447,
    "image_url": "https://images.unsplash.com/photo-1552664730-d307ca884978?auto=format&fit=crop&w=1200&q=80",
    "rsvp_count": 8,
    "attendee_count": 8,
    "interested_count": 2,
    "max_capacity": 40,
    "is_featured": false,
    "tags": [
      "careers",
      "resume",
      "data"
    ],
    "location": "McKeldin Library",
    "created_at": "2026-04-11T22:30:00.000Z",
    "updated_at": "2026-04-11T22:30:00.000Z"
  },
  {
    "id": "099b5515-59e1-5531-b5a2-4e37be566d83",
    "title": "Sunset Tempo Run",
    "description": "Campus loop with split pace groups and a quick coffee stop after cooldown if people are feeling it.",
    "club_id": "93df5013-9ec9-56e2-8f1e-dbbb52ad5feb",
    "created_by": "9ffda673-63bb-542b-9b0d-0de86e4557ee",
    "organizer_name": "Maryland Running Club",
    "category": "sports",
    "starts_at": "2026-04-15T22:00:00.000Z",
    "ends_at": "2026-04-15T23:15:00.000Z",
    "status": "upcoming",
    "moderation_status": "approved",
    "location_name": "Eppley Recreation Center",
    "location_id": "179e4957-1849-5046-a515-a9fc7fadc8a3",
    "latitude": 38.9935,
    "longitude": -76.9415,
    "image_url": "https://images.unsplash.com/photo-1473448912268-2022ce9509d8?auto=format&fit=crop&w=1200&q=80",
    "rsvp_count": 8,
    "attendee_count": 8,
    "interested_count": 2,
    "max_capacity": 40,
    "is_featured": false,
    "tags": [
      "running",
      "fitness",
      "community"
    ],
    "location": "Eppley Recreation Center",
    "created_at": "2026-04-10T22:00:00.000Z",
    "updated_at": "2026-04-10T22:00:00.000Z"
  },
  {
    "id": "2a437de6-ec13-5dff-bf7e-52d3295dcddf",
    "title": "Spring Bhangra Mixer",
    "description": "Open dance circle, intro lesson, and a relaxed social for anyone curious about the team before finals take over.",
    "club_id": "2c3160cc-928d-54c2-817c-2abc9ad857bf",
    "created_by": "77de58eb-8b78-5ad5-b5bb-a310726ca240",
    "organizer_name": "Bhangra at UMD",
    "category": "social",
    "starts_at": "2026-04-15T23:30:00.000Z",
    "ends_at": "2026-04-16T01:30:00.000Z",
    "status": "upcoming",
    "moderation_status": "approved",
    "location_name": "Stamp Student Union",
    "location_id": "b2495581-a99e-5f12-bc26-9106664c28a8",
    "latitude": 38.9882,
    "longitude": -76.9452,
    "image_url": "https://images.unsplash.com/photo-1501386761578-eac5c94b800a?auto=format&fit=crop&w=1200&q=80",
    "rsvp_count": 15,
    "attendee_count": 15,
    "interested_count": 2,
    "max_capacity": 120,
    "is_featured": false,
    "tags": [
      "dance",
      "culture",
      "social"
    ],
    "location": "Stamp Student Union",
    "created_at": "2026-04-13T23:30:00.000Z",
    "updated_at": "2026-04-13T23:30:00.000Z"
  },
  {
    "id": "eb0a2d13-7e58-5e6e-92f9-5521ded64158",
    "title": "Shenandoah Trip Info Session",
    "description": "Packing list walkthrough, route overview, and everything you need to know before committing to the next weekend trip.",
    "club_id": "646d7bc1-956c-593b-baec-109a7a9720b6",
    "created_by": "dceb7801-ef4a-5c0d-8c77-d45c18b15df1",
    "organizer_name": "Maryland Outdoors Club",
    "category": "other",
    "starts_at": "2026-04-16T00:00:00.000Z",
    "ends_at": "2026-04-16T01:15:00.000Z",
    "status": "upcoming",
    "moderation_status": "approved",
    "location_name": "Hornbake Library",
    "location_id": "d141b673-5cf5-519b-800e-f2ecab22e19e",
    "latitude": 38.988,
    "longitude": -76.9468,
    "image_url": "https://images.unsplash.com/photo-1503428593586-e225b39bddfe?auto=format&fit=crop&w=1200&q=80",
    "rsvp_count": 4,
    "attendee_count": 4,
    "interested_count": 1,
    "max_capacity": 40,
    "is_featured": false,
    "tags": [
      "outdoors",
      "travel",
      "community"
    ],
    "location": "Hornbake Library",
    "created_at": "2026-04-13T00:00:00.000Z",
    "updated_at": "2026-04-13T00:00:00.000Z"
  },
  {
    "id": "ad2902b4-6582-5ffa-af89-178564b7f539",
    "title": "Service Lead Huddle",
    "description": "A compact planning session for volunteers coordinating the next campus supply drive.",
    "club_id": "b934a1b0-cf09-5fba-b612-1b8d8ee70570",
    "created_by": "9ffda673-63bb-542b-9b0d-0de86e4557ee",
    "organizer_name": "Terps for Change",
    "category": "other",
    "starts_at": "2026-04-15T21:30:00.000Z",
    "ends_at": "2026-04-15T22:30:00.000Z",
    "status": "upcoming",
    "moderation_status": "approved",
    "location_name": "Stamp Student Union",
    "location_id": "b2495581-a99e-5f12-bc26-9106664c28a8",
    "latitude": 38.9882,
    "longitude": -76.9452,
    "image_url": "https://images.unsplash.com/photo-1503428593586-e225b39bddfe?auto=format&fit=crop&w=1200&q=80",
    "rsvp_count": 4,
    "attendee_count": 4,
    "interested_count": 1,
    "max_capacity": 40,
    "is_featured": false,
    "tags": [
      "service",
      "leadership",
      "community"
    ],
    "location": "Stamp Student Union",
    "created_at": "2026-04-11T21:30:00.000Z",
    "updated_at": "2026-04-11T21:30:00.000Z"
  },
  {
    "id": "ee667319-f1cb-5b07-9324-35d19c05336f",
    "title": "Student Shorts Screening",
    "description": "A curated set of student-made short films followed by a conversation with the directors and cinematographers.",
    "club_id": "44f63ee3-2917-5ac3-84f4-0ab9aa8cbe2a",
    "created_by": "ca86602c-434a-50de-af39-90312889c45d",
    "organizer_name": "Film Society at Maryland",
    "category": "arts",
    "starts_at": "2026-04-16T23:00:00.000Z",
    "ends_at": "2026-04-17T01:00:00.000Z",
    "status": "upcoming",
    "moderation_status": "approved",
    "location_name": "Stamp Student Union",
    "location_id": "b2495581-a99e-5f12-bc26-9106664c28a8",
    "latitude": 38.9882,
    "longitude": -76.9452,
    "image_url": "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=1200&q=80",
    "rsvp_count": 16,
    "attendee_count": 16,
    "interested_count": 2,
    "max_capacity": 120,
    "is_featured": false,
    "tags": [
      "film",
      "arts",
      "community"
    ],
    "location": "Stamp Student Union",
    "created_at": "2026-04-11T23:00:00.000Z",
    "updated_at": "2026-04-11T23:00:00.000Z"
  },
  {
    "id": "11ee7049-283f-5473-9178-30363e87ec04",
    "title": "Korean Street Food Social",
    "description": "Snacks, icebreakers, and a very easy night to meet people before the semester gets too busy.",
    "club_id": "572b2a79-031d-5b9e-b4bb-5a727906def8",
    "created_by": "7e1d57eb-5dc7-58f1-8fe1-a165779a5ddd",
    "organizer_name": "Korean Student Association",
    "category": "social",
    "starts_at": "2026-04-16T22:30:00.000Z",
    "ends_at": "2026-04-17T00:30:00.000Z",
    "status": "upcoming",
    "moderation_status": "approved",
    "location_name": "Stamp Student Union",
    "location_id": "b2495581-a99e-5f12-bc26-9106664c28a8",
    "latitude": 38.9882,
    "longitude": -76.9452,
    "image_url": "https://images.unsplash.com/photo-1526318472351-c75fcf070305?auto=format&fit=crop&w=1200&q=80",
    "rsvp_count": 15,
    "attendee_count": 15,
    "interested_count": 2,
    "max_capacity": 120,
    "is_featured": false,
    "tags": [
      "culture",
      "food",
      "community"
    ],
    "location": "Stamp Student Union",
    "created_at": "2026-04-14T22:30:00.000Z",
    "updated_at": "2026-04-14T22:30:00.000Z"
  },
  {
    "id": "86176723-c0f5-56ef-bbe2-f488cc5e160c",
    "title": "Poster Lab + Projection Tests",
    "description": "Bring a sketch or unfinished idea and leave with something that actually looks exhibition-ready.",
    "club_id": "673363a9-c22b-5446-98ac-37c379aaed6a",
    "created_by": "af45b9b4-fb14-5b6d-bbcd-5ffcc64bf110",
    "organizer_name": "Creative Coding Collective",
    "category": "workshop",
    "starts_at": "2026-04-16T22:00:00.000Z",
    "ends_at": "2026-04-17T00:00:00.000Z",
    "status": "upcoming",
    "moderation_status": "approved",
    "location_name": "The Clarice Smith Center",
    "location_id": "ae20b078-531a-5310-b481-00504efc443a",
    "latitude": 38.9915,
    "longitude": -76.946,
    "image_url": "https://images.unsplash.com/photo-1503428593586-e225b39bddfe?auto=format&fit=crop&w=1200&q=80",
    "rsvp_count": 4,
    "attendee_count": 4,
    "interested_count": 0,
    "max_capacity": 40,
    "is_featured": false,
    "tags": [
      "design",
      "creative-tech",
      "arts"
    ],
    "location": "The Clarice Smith Center",
    "created_at": "2026-04-13T22:00:00.000Z",
    "updated_at": "2026-04-13T22:00:00.000Z"
  },
  {
    "id": "63325ef7-e61a-5b6e-b676-555541b6e076",
    "title": "Bitcamp Team Match Night",
    "description": "Project idea pitches, rapid intros, and a packed room of people looking for teammates before the next big build weekend.",
    "club_id": "aaa41ac9-63e0-592f-a177-be36e8b212ee",
    "created_by": "0b4c9322-5024-52dd-b93b-68b721c026ee",
    "organizer_name": "UMD Hackers",
    "category": "academic",
    "starts_at": "2026-04-17T22:30:00.000Z",
    "ends_at": "2026-04-18T01:00:00.000Z",
    "status": "upcoming",
    "moderation_status": "approved",
    "location_name": "Brendan Iribe Center",
    "location_id": "32fd8979-6048-5b0b-8310-d8fca984a96a",
    "latitude": 38.989,
    "longitude": -76.9365,
    "image_url": "https://images.unsplash.com/photo-1516321497487-e288fb19713f?auto=format&fit=crop&w=1200&q=80",
    "rsvp_count": 19,
    "attendee_count": 19,
    "interested_count": 0,
    "max_capacity": 300,
    "is_featured": true,
    "tags": [
      "hackathon",
      "coding",
      "builders",
      "community"
    ],
    "location": "Brendan Iribe Center",
    "created_at": "2026-04-13T22:30:00.000Z",
    "updated_at": "2026-04-13T22:30:00.000Z"
  },
  {
    "id": "11b3ef36-661f-59c6-9171-c5c123e4dee6",
    "title": "Finals Study Jam",
    "description": "Open co-working with office-hour style support and quiet tables reserved for project cleanup.",
    "club_id": "94dc4785-694a-5b8a-b73d-d6e896187afb",
    "created_by": "77de58eb-8b78-5ad5-b5bb-a310726ca240",
    "organizer_name": "Data Science Club",
    "category": "academic",
    "starts_at": "2026-04-17T23:00:00.000Z",
    "ends_at": "2026-04-18T01:30:00.000Z",
    "status": "upcoming",
    "moderation_status": "approved",
    "location_name": "McKeldin Library",
    "location_id": "6ef728db-4dbe-5183-b93a-45ce24a2af3d",
    "latitude": 38.986,
    "longitude": -76.9447,
    "image_url": "https://images.unsplash.com/photo-1503428593586-e225b39bddfe?auto=format&fit=crop&w=1200&q=80",
    "rsvp_count": 8,
    "attendee_count": 8,
    "interested_count": 2,
    "max_capacity": 40,
    "is_featured": false,
    "tags": [
      "study",
      "data",
      "community"
    ],
    "location": "McKeldin Library",
    "created_at": "2026-04-12T23:00:00.000Z",
    "updated_at": "2026-04-12T23:00:00.000Z"
  },
  {
    "id": "ca8008b4-cf50-542a-8f86-e3bd5e003531",
    "title": "Founder Fireside with Maryland Alumni",
    "description": "A candid conversation about building after graduation, early hiring mistakes, and what actually mattered in the first year.",
    "club_id": "0e68c4f2-2b14-505c-972d-dda49fca824a",
    "created_by": "3a44d09f-f9ee-5606-8958-3cdb4d945381",
    "organizer_name": "Terp Entrepreneurs",
    "category": "career",
    "starts_at": "2026-04-18T22:30:00.000Z",
    "ends_at": "2026-04-19T00:15:00.000Z",
    "status": "upcoming",
    "moderation_status": "approved",
    "location_name": "Van Munching Hall",
    "location_id": "4b26f7b3-868a-53db-a1fe-4a81647258ba",
    "latitude": 38.9825,
    "longitude": -76.944,
    "image_url": "https://images.unsplash.com/photo-1521737711867-e3b97375f902?auto=format&fit=crop&w=1200&q=80",
    "rsvp_count": 16,
    "attendee_count": 16,
    "interested_count": 2,
    "max_capacity": 120,
    "is_featured": true,
    "tags": [
      "startups",
      "careers",
      "networking"
    ],
    "location": "Van Munching Hall",
    "created_at": "2026-04-16T22:30:00.000Z",
    "updated_at": "2026-04-16T22:30:00.000Z"
  },
  {
    "id": "ee15417d-0a16-53fd-a0be-f030d5efb6b5",
    "title": "Engineering Internship Panel",
    "description": "Women in engineering sharing what recruiting looked like for them and what they wish they had known earlier.",
    "club_id": "189a718a-77c7-592f-b26f-c25f576a21b8",
    "created_by": "3871303c-e94e-56e3-b1ea-57ba9b0bc0c1",
    "organizer_name": "Society of Women Engineers",
    "category": "career",
    "starts_at": "2026-04-18T23:00:00.000Z",
    "ends_at": "2026-04-19T00:30:00.000Z",
    "status": "upcoming",
    "moderation_status": "approved",
    "location_name": "Edward St. John Learning and Teaching Center",
    "location_id": "40ce49e0-3aac-5a0a-bcda-1461078f9145",
    "latitude": 38.9895,
    "longitude": -76.9382,
    "image_url": "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=1200&q=80",
    "rsvp_count": 9,
    "attendee_count": 9,
    "interested_count": 2,
    "max_capacity": 40,
    "is_featured": false,
    "tags": [
      "careers",
      "engineering",
      "mentorship"
    ],
    "location": "Edward St. John Learning and Teaching Center",
    "created_at": "2026-04-15T23:00:00.000Z",
    "updated_at": "2026-04-15T23:00:00.000Z"
  },
  {
    "id": "22b0144b-74de-52cb-870d-a25b371ffd64",
    "title": "Showcase Rehearsal Night",
    "description": "A focused rehearsal block before next week’s performance, with room for alumni drop-ins and extra run-throughs.",
    "club_id": "2c3160cc-928d-54c2-817c-2abc9ad857bf",
    "created_by": "bf962ba5-980e-5ed4-b080-3ddad5c2e760",
    "organizer_name": "Bhangra at UMD",
    "category": "arts",
    "starts_at": "2026-04-19T23:30:00.000Z",
    "ends_at": "2026-04-20T02:00:00.000Z",
    "status": "upcoming",
    "moderation_status": "approved",
    "location_name": "The Clarice Smith Center",
    "location_id": "ae20b078-531a-5310-b481-00504efc443a",
    "latitude": 38.9915,
    "longitude": -76.946,
    "image_url": "https://images.unsplash.com/photo-1516280440614-37939bbacd81?auto=format&fit=crop&w=1200&q=80",
    "rsvp_count": 8,
    "attendee_count": 8,
    "interested_count": 2,
    "max_capacity": 40,
    "is_featured": false,
    "tags": [
      "dance",
      "performance",
      "culture"
    ],
    "location": "The Clarice Smith Center",
    "created_at": "2026-04-15T23:30:00.000Z",
    "updated_at": "2026-04-15T23:30:00.000Z"
  },
  {
    "id": "7404bc59-2b11-59fd-b1fd-b3c6c73d472a",
    "title": "Ship It Sprint",
    "description": "A build-focused night for anyone trying to cross the finish line on a project before demos next week.",
    "club_id": "aaa41ac9-63e0-592f-a177-be36e8b212ee",
    "created_by": "6667ca7e-5d07-5fd3-ab93-276110c38063",
    "organizer_name": "UMD Hackers",
    "category": "workshop",
    "starts_at": "2026-04-20T22:30:00.000Z",
    "ends_at": "2026-04-21T01:00:00.000Z",
    "status": "upcoming",
    "moderation_status": "approved",
    "location_name": "Brendan Iribe Center",
    "location_id": "32fd8979-6048-5b0b-8310-d8fca984a96a",
    "latitude": 38.989,
    "longitude": -76.9365,
    "image_url": "https://images.unsplash.com/photo-1503428593586-e225b39bddfe?auto=format&fit=crop&w=1200&q=80",
    "rsvp_count": 8,
    "attendee_count": 8,
    "interested_count": 2,
    "max_capacity": 40,
    "is_featured": false,
    "tags": [
      "coding",
      "builders",
      "workshop"
    ],
    "location": "Brendan Iribe Center",
    "created_at": "2026-04-15T22:30:00.000Z",
    "updated_at": "2026-04-15T22:30:00.000Z"
  },
  {
    "id": "cd64733a-9d01-568b-b1da-bb05bd501940",
    "title": "Saturday Long Run",
    "description": "Longer mileage with a few pace groups and a no-stress option for anyone building up distance.",
    "club_id": "93df5013-9ec9-56e2-8f1e-dbbb52ad5feb",
    "created_by": "5a90dcaa-9700-59fb-9cc9-66b19e06e6d6",
    "organizer_name": "Maryland Running Club",
    "category": "sports",
    "starts_at": "2026-04-20T13:00:00.000Z",
    "ends_at": "2026-04-20T14:45:00.000Z",
    "status": "upcoming",
    "moderation_status": "approved",
    "location_name": "Eppley Recreation Center",
    "location_id": "179e4957-1849-5046-a515-a9fc7fadc8a3",
    "latitude": 38.9935,
    "longitude": -76.9415,
    "image_url": "https://images.unsplash.com/photo-1503428593586-e225b39bddfe?auto=format&fit=crop&w=1200&q=80",
    "rsvp_count": 8,
    "attendee_count": 8,
    "interested_count": 2,
    "max_capacity": 40,
    "is_featured": false,
    "tags": [
      "running",
      "fitness",
      "sports"
    ],
    "location": "Eppley Recreation Center",
    "created_at": "2026-04-18T13:00:00.000Z",
    "updated_at": "2026-04-18T13:00:00.000Z"
  },
  {
    "id": "d7727c35-da47-5a43-a0a7-d9fddb77468b",
    "title": "Film Critique Night",
    "description": "Bring a scene, a rough cut, or just opinions. Expect thoughtful feedback and at least one passionate debate.",
    "club_id": "44f63ee3-2917-5ac3-84f4-0ab9aa8cbe2a",
    "created_by": "1941e5a9-753c-5055-b24d-ff4990dd714e",
    "organizer_name": "Film Society at Maryland",
    "category": "arts",
    "starts_at": "2026-04-20T23:30:00.000Z",
    "ends_at": "2026-04-21T01:15:00.000Z",
    "status": "upcoming",
    "moderation_status": "approved",
    "location_name": "Hornbake Library",
    "location_id": "d141b673-5cf5-519b-800e-f2ecab22e19e",
    "latitude": 38.988,
    "longitude": -76.9468,
    "image_url": "https://images.unsplash.com/photo-1503428593586-e225b39bddfe?auto=format&fit=crop&w=1200&q=80",
    "rsvp_count": 4,
    "attendee_count": 4,
    "interested_count": 1,
    "max_capacity": 40,
    "is_featured": false,
    "tags": [
      "film",
      "arts",
      "critique"
    ],
    "location": "Hornbake Library",
    "created_at": "2026-04-17T23:30:00.000Z",
    "updated_at": "2026-04-17T23:30:00.000Z"
  },
  {
    "id": "1eefe324-a89e-5aed-8d1d-2d929ff076dc",
    "title": "Community Care Kits",
    "description": "An all-hands volunteer night assembling finals-week care kits with local partner organizations.",
    "club_id": "b934a1b0-cf09-5fba-b612-1b8d8ee70570",
    "created_by": "a49d4554-325c-5c88-afaa-ef947f0a115a",
    "organizer_name": "Terps for Change",
    "category": "other",
    "starts_at": "2026-04-21T22:00:00.000Z",
    "ends_at": "2026-04-22T00:00:00.000Z",
    "status": "upcoming",
    "moderation_status": "approved",
    "location_name": "Stamp Student Union",
    "location_id": "b2495581-a99e-5f12-bc26-9106664c28a8",
    "latitude": 38.9882,
    "longitude": -76.9452,
    "image_url": "https://images.unsplash.com/photo-1559027615-cd4628902d4a?auto=format&fit=crop&w=1200&q=80",
    "rsvp_count": 16,
    "attendee_count": 16,
    "interested_count": 2,
    "max_capacity": 120,
    "is_featured": false,
    "tags": [
      "service",
      "community",
      "impact"
    ],
    "location": "Stamp Student Union",
    "created_at": "2026-04-17T22:00:00.000Z",
    "updated_at": "2026-04-17T22:00:00.000Z"
  },
  {
    "id": "8438b8d2-832f-5ff5-ab04-c33714715b9d",
    "title": "Language Exchange Night",
    "description": "Conversation tables, beginner-friendly prompts, and a warm crowd that makes it easy to stay longer than planned.",
    "club_id": "572b2a79-031d-5b9e-b4bb-5a727906def8",
    "created_by": "0b4c9322-5024-52dd-b93b-68b721c026ee",
    "organizer_name": "Korean Student Association",
    "category": "social",
    "starts_at": "2026-04-21T23:00:00.000Z",
    "ends_at": "2026-04-22T00:30:00.000Z",
    "status": "upcoming",
    "moderation_status": "approved",
    "location_name": "Edward St. John Learning and Teaching Center",
    "location_id": "40ce49e0-3aac-5a0a-bcda-1461078f9145",
    "latitude": 38.9895,
    "longitude": -76.9382,
    "image_url": "https://images.unsplash.com/photo-1503428593586-e225b39bddfe?auto=format&fit=crop&w=1200&q=80",
    "rsvp_count": 8,
    "attendee_count": 8,
    "interested_count": 2,
    "max_capacity": 40,
    "is_featured": false,
    "tags": [
      "culture",
      "community",
      "language"
    ],
    "location": "Edward St. John Learning and Teaching Center",
    "created_at": "2026-04-16T23:00:00.000Z",
    "updated_at": "2026-04-16T23:00:00.000Z"
  },
  {
    "id": "46a5d689-08ba-51d6-bd44-765af4046441",
    "title": "Prototype Tear-Down Night",
    "description": "Bring a rough interactive concept and get direct design and technical feedback in one room.",
    "club_id": "673363a9-c22b-5446-98ac-37c379aaed6a",
    "created_by": "c0957686-8810-518a-8a56-df06c240f785",
    "organizer_name": "Creative Coding Collective",
    "category": "workshop",
    "starts_at": "2026-04-22T22:30:00.000Z",
    "ends_at": "2026-04-23T00:30:00.000Z",
    "status": "upcoming",
    "moderation_status": "approved",
    "location_name": "The Clarice Smith Center",
    "location_id": "ae20b078-531a-5310-b481-00504efc443a",
    "latitude": 38.9915,
    "longitude": -76.946,
    "image_url": "https://images.unsplash.com/photo-1503428593586-e225b39bddfe?auto=format&fit=crop&w=1200&q=80",
    "rsvp_count": 3,
    "attendee_count": 3,
    "interested_count": 1,
    "max_capacity": 40,
    "is_featured": false,
    "tags": [
      "design",
      "creative-tech",
      "builders"
    ],
    "location": "The Clarice Smith Center",
    "created_at": "2026-04-20T22:30:00.000Z",
    "updated_at": "2026-04-20T22:30:00.000Z"
  },
  {
    "id": "267da4ef-7c6b-5cd0-a622-304afe5f57d8",
    "title": "Demo Day at Van Munching",
    "description": "Short product demos, sharp audience questions, and a room full of people cheering for each other to improve fast.",
    "club_id": "0e68c4f2-2b14-505c-972d-dda49fca824a",
    "created_by": "3a44d09f-f9ee-5606-8958-3cdb4d945381",
    "organizer_name": "Terp Entrepreneurs",
    "category": "career",
    "starts_at": "2026-04-23T22:00:00.000Z",
    "ends_at": "2026-04-24T00:00:00.000Z",
    "status": "upcoming",
    "moderation_status": "approved",
    "location_name": "Van Munching Hall",
    "location_id": "4b26f7b3-868a-53db-a1fe-4a81647258ba",
    "latitude": 38.9825,
    "longitude": -76.944,
    "image_url": "https://images.unsplash.com/photo-1516321165247-4aa89a48be28?auto=format&fit=crop&w=1200&q=80",
    "rsvp_count": 16,
    "attendee_count": 16,
    "interested_count": 2,
    "max_capacity": 120,
    "is_featured": false,
    "tags": [
      "startups",
      "pitch",
      "networking"
    ],
    "location": "Van Munching Hall",
    "created_at": "2026-04-20T22:00:00.000Z",
    "updated_at": "2026-04-20T22:00:00.000Z"
  },
  {
    "id": "391f0c2e-a0a9-5bb7-b035-bef426ebf2b1",
    "title": "Women in Engineering Mentor Dinner",
    "description": "Small tables, honest recruiting talk, and a low-pressure space to ask the questions people usually avoid asking in panels.",
    "club_id": "189a718a-77c7-592f-b26f-c25f576a21b8",
    "created_by": "79af4eed-7d3d-5729-8963-46e04646d23b",
    "organizer_name": "Society of Women Engineers",
    "category": "career",
    "starts_at": "2026-04-23T23:00:00.000Z",
    "ends_at": "2026-04-24T00:45:00.000Z",
    "status": "upcoming",
    "moderation_status": "approved",
    "location_name": "Edward St. John Learning and Teaching Center",
    "location_id": "40ce49e0-3aac-5a0a-bcda-1461078f9145",
    "latitude": 38.9895,
    "longitude": -76.9382,
    "image_url": "https://images.unsplash.com/photo-1503428593586-e225b39bddfe?auto=format&fit=crop&w=1200&q=80",
    "rsvp_count": 9,
    "attendee_count": 9,
    "interested_count": 2,
    "max_capacity": 40,
    "is_featured": false,
    "tags": [
      "engineering",
      "careers",
      "mentorship"
    ],
    "location": "Edward St. John Learning and Teaching Center",
    "created_at": "2026-04-19T23:00:00.000Z",
    "updated_at": "2026-04-19T23:00:00.000Z"
  },
  {
    "id": "b5e3acb1-d51b-5b3f-9444-312ed90615ae",
    "title": "Data for Social Good Workshop",
    "description": "Hands-on workshop using public data sets to explore community-focused problem framing and quick dashboards.",
    "club_id": "94dc4785-694a-5b8a-b73d-d6e896187afb",
    "created_by": "f360a23b-4f3d-566a-959f-ea05849e43ab",
    "organizer_name": "Data Science Club",
    "category": "workshop",
    "starts_at": "2026-04-24T22:30:00.000Z",
    "ends_at": "2026-04-25T00:30:00.000Z",
    "status": "upcoming",
    "moderation_status": "approved",
    "location_name": "Edward St. John Learning and Teaching Center",
    "location_id": "40ce49e0-3aac-5a0a-bcda-1461078f9145",
    "latitude": 38.9895,
    "longitude": -76.9382,
    "image_url": "https://images.unsplash.com/photo-1503428593586-e225b39bddfe?auto=format&fit=crop&w=1200&q=80",
    "rsvp_count": 8,
    "attendee_count": 8,
    "interested_count": 2,
    "max_capacity": 40,
    "is_featured": false,
    "tags": [
      "data",
      "service",
      "workshop"
    ],
    "location": "Edward St. John Learning and Teaching Center",
    "created_at": "2026-04-19T22:30:00.000Z",
    "updated_at": "2026-04-19T22:30:00.000Z"
  },
  {
    "id": "5267a444-203e-5e6d-be2d-e641e5cb4da2",
    "title": "Spring 5K on the Mall",
    "description": "Community 5K with pace leaders, music, and a finish line that actually feels celebratory.",
    "club_id": "93df5013-9ec9-56e2-8f1e-dbbb52ad5feb",
    "created_by": "9ffda673-63bb-542b-9b0d-0de86e4557ee",
    "organizer_name": "Maryland Running Club",
    "category": "sports",
    "starts_at": "2026-04-25T14:00:00.000Z",
    "ends_at": "2026-04-25T16:00:00.000Z",
    "status": "upcoming",
    "moderation_status": "approved",
    "location_name": "Cole Field House",
    "location_id": "1e432712-8929-5a3a-b801-dc8b06ba65ee",
    "latitude": 38.993,
    "longitude": -76.9445,
    "image_url": "https://images.unsplash.com/photo-1517836357463-d25dfeac3438?auto=format&fit=crop&w=1200&q=80",
    "rsvp_count": 19,
    "attendee_count": 19,
    "interested_count": 0,
    "max_capacity": 300,
    "is_featured": false,
    "tags": [
      "running",
      "sports",
      "community"
    ],
    "location": "Cole Field House",
    "created_at": "2026-04-23T14:00:00.000Z",
    "updated_at": "2026-04-23T14:00:00.000Z"
  },
  {
    "id": "5fffd4d5-3b75-5b84-a53e-23a9996c3233",
    "title": "Bhangra at The Clarice",
    "description": "Spring showcase night with guest teams, high energy, and a packed audience expected from across campus.",
    "club_id": "2c3160cc-928d-54c2-817c-2abc9ad857bf",
    "created_by": "77de58eb-8b78-5ad5-b5bb-a310726ca240",
    "organizer_name": "Bhangra at UMD",
    "category": "arts",
    "starts_at": "2026-04-26T23:00:00.000Z",
    "ends_at": "2026-04-27T01:30:00.000Z",
    "status": "upcoming",
    "moderation_status": "approved",
    "location_name": "The Clarice Smith Center",
    "location_id": "ae20b078-531a-5310-b481-00504efc443a",
    "latitude": 38.9915,
    "longitude": -76.946,
    "image_url": "https://images.unsplash.com/photo-1516280440614-37939bbacd81?auto=format&fit=crop&w=1200&q=80",
    "rsvp_count": 20,
    "attendee_count": 20,
    "interested_count": 0,
    "max_capacity": 300,
    "is_featured": true,
    "tags": [
      "dance",
      "performance",
      "culture"
    ],
    "location": "The Clarice Smith Center",
    "created_at": "2026-04-23T23:00:00.000Z",
    "updated_at": "2026-04-23T23:00:00.000Z"
  },
  {
    "id": "e6d82ed7-934b-56bc-87a2-e796ddab36fd",
    "title": "Film Fest Planning Meeting",
    "description": "A practical planning session for the student film fest lineup, volunteers, and promo schedule.",
    "club_id": "44f63ee3-2917-5ac3-84f4-0ab9aa8cbe2a",
    "created_by": "ca86602c-434a-50de-af39-90312889c45d",
    "organizer_name": "Film Society at Maryland",
    "category": "other",
    "starts_at": "2026-04-26T22:30:00.000Z",
    "ends_at": "2026-04-27T00:00:00.000Z",
    "status": "upcoming",
    "moderation_status": "approved",
    "location_name": "Stamp Student Union",
    "location_id": "b2495581-a99e-5f12-bc26-9106664c28a8",
    "latitude": 38.9882,
    "longitude": -76.9452,
    "image_url": "https://images.unsplash.com/photo-1503428593586-e225b39bddfe?auto=format&fit=crop&w=1200&q=80",
    "rsvp_count": 4,
    "attendee_count": 4,
    "interested_count": 0,
    "max_capacity": 40,
    "is_featured": false,
    "tags": [
      "film",
      "planning",
      "community"
    ],
    "location": "Stamp Student Union",
    "created_at": "2026-04-22T22:30:00.000Z",
    "updated_at": "2026-04-22T22:30:00.000Z"
  },
  {
    "id": "a62f5bc6-f49a-5de8-ab3c-bd348f017d84",
    "title": "Shenandoah Trip Briefing",
    "description": "Final route review, carpool planning, and gear Q&A before the next major weekend trip.",
    "club_id": "646d7bc1-956c-593b-baec-109a7a9720b6",
    "created_by": "dceb7801-ef4a-5c0d-8c77-d45c18b15df1",
    "organizer_name": "Maryland Outdoors Club",
    "category": "other",
    "starts_at": "2026-04-27T23:00:00.000Z",
    "ends_at": "2026-04-28T00:15:00.000Z",
    "status": "upcoming",
    "moderation_status": "approved",
    "location_name": "Hornbake Library",
    "location_id": "d141b673-5cf5-519b-800e-f2ecab22e19e",
    "latitude": 38.988,
    "longitude": -76.9468,
    "image_url": "https://images.unsplash.com/photo-1503428593586-e225b39bddfe?auto=format&fit=crop&w=1200&q=80",
    "rsvp_count": 4,
    "attendee_count": 4,
    "interested_count": 1,
    "max_capacity": 40,
    "is_featured": false,
    "tags": [
      "outdoors",
      "travel",
      "community"
    ],
    "location": "Hornbake Library",
    "created_at": "2026-04-22T23:00:00.000Z",
    "updated_at": "2026-04-22T23:00:00.000Z"
  },
  {
    "id": "b97103cd-1bca-58a3-ae1b-8fbcf6158e82",
    "title": "Makers + Founders Brunch",
    "description": "A smaller social designed to help people find collaborators before summer internship plans pull everyone in different directions.",
    "club_id": "0e68c4f2-2b14-505c-972d-dda49fca824a",
    "created_by": "bf962ba5-980e-5ed4-b080-3ddad5c2e760",
    "organizer_name": "Terp Entrepreneurs",
    "category": "social",
    "starts_at": "2026-04-28T15:00:00.000Z",
    "ends_at": "2026-04-28T17:00:00.000Z",
    "status": "upcoming",
    "moderation_status": "approved",
    "location_name": "Stamp Student Union",
    "location_id": "b2495581-a99e-5f12-bc26-9106664c28a8",
    "latitude": 38.9882,
    "longitude": -76.9452,
    "image_url": "https://images.unsplash.com/photo-1503428593586-e225b39bddfe?auto=format&fit=crop&w=1200&q=80",
    "rsvp_count": 8,
    "attendee_count": 8,
    "interested_count": 2,
    "max_capacity": 40,
    "is_featured": false,
    "tags": [
      "startups",
      "community",
      "networking"
    ],
    "location": "Stamp Student Union",
    "created_at": "2026-04-26T15:00:00.000Z",
    "updated_at": "2026-04-26T15:00:00.000Z"
  },
  {
    "id": "1d11e033-2f83-5006-99c2-8c5271fe5367",
    "title": "Creative Coding Gallery Night",
    "description": "Projection pieces, interactive sketches, and a showcase that feels equal parts studio critique and celebration.",
    "club_id": "673363a9-c22b-5446-98ac-37c379aaed6a",
    "created_by": "af45b9b4-fb14-5b6d-bbcd-5ffcc64bf110",
    "organizer_name": "Creative Coding Collective",
    "category": "arts",
    "starts_at": "2026-04-29T22:30:00.000Z",
    "ends_at": "2026-04-30T01:00:00.000Z",
    "status": "upcoming",
    "moderation_status": "approved",
    "location_name": "The Clarice Smith Center",
    "location_id": "ae20b078-531a-5310-b481-00504efc443a",
    "latitude": 38.9915,
    "longitude": -76.946,
    "image_url": "https://images.unsplash.com/photo-1517694712202-14dd9538aa97?auto=format&fit=crop&w=1200&q=80",
    "rsvp_count": 9,
    "attendee_count": 9,
    "interested_count": 2,
    "max_capacity": 40,
    "is_featured": false,
    "tags": [
      "arts",
      "design",
      "creative-tech"
    ],
    "location": "The Clarice Smith Center",
    "created_at": "2026-04-26T22:30:00.000Z",
    "updated_at": "2026-04-26T22:30:00.000Z"
  }
] as Event[];

export interface ClubMedia {
  id: string;
  club_id: string;
  url: string;
  type: 'photo' | 'video';
  caption: string;
  created_at: string;
}

export const mockClubMedia = [
  {
    "id": "9be89db9-9f13-543c-a04b-6419ddd042dd",
    "club_id": "aaa41ac9-63e0-592f-a177-be36e8b212ee",
    "url": "https://images.unsplash.com/photo-1516321497487-e288fb19713f?auto=format&fit=crop&w=900&q=80",
    "type": "photo",
    "caption": "Mentor tables filling up during hack night.",
    "created_at": "2026-04-04T20:00:00.000Z"
  },
  {
    "id": "1687e997-9921-55c1-a75e-d7378ec29fb5",
    "club_id": "aaa41ac9-63e0-592f-a177-be36e8b212ee",
    "url": "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=900&q=80",
    "type": "photo",
    "caption": "Teams sprinting through a product review circle.",
    "created_at": "2026-04-11T20:00:00.000Z"
  },
  {
    "id": "1c6f035f-a4e3-59ba-bf34-a962b7a04241",
    "club_id": "94dc4785-694a-5b8a-b73d-d6e896187afb",
    "url": "https://images.unsplash.com/photo-1504384308090-c894fdcc538d?auto=format&fit=crop&w=900&q=80",
    "type": "photo",
    "caption": "SQL workshop whiteboards after a very productive chaos hour.",
    "created_at": "2026-04-06T20:00:00.000Z"
  },
  {
    "id": "f7989b16-1366-5912-8273-dc0dae5a27e2",
    "club_id": "94dc4785-694a-5b8a-b73d-d6e896187afb",
    "url": "https://images.unsplash.com/photo-1516321310764-8d3c1f6773ce?auto=format&fit=crop&w=900&q=80",
    "type": "photo",
    "caption": "Resume clinic tables at McKeldin before the analytics fair.",
    "created_at": "2026-04-12T20:00:00.000Z"
  },
  {
    "id": "c38e405e-ea95-56ef-9250-a2124778ce12",
    "club_id": "0e68c4f2-2b14-505c-972d-dda49fca824a",
    "url": "https://images.unsplash.com/photo-1521737604893-d14cc237f11d?auto=format&fit=crop&w=900&q=80",
    "type": "photo",
    "caption": "Founder roundtable with alumni who stayed late to answer questions.",
    "created_at": "2026-04-03T20:00:00.000Z"
  },
  {
    "id": "342c3bd9-e643-521f-b0af-c7514375fc88",
    "club_id": "0e68c4f2-2b14-505c-972d-dda49fca824a",
    "url": "https://images.unsplash.com/photo-1516321165247-4aa89a48be28?auto=format&fit=crop&w=900&q=80",
    "type": "photo",
    "caption": "Pitch practice notes spread across the VMH lobby tables.",
    "created_at": "2026-04-10T20:00:00.000Z"
  },
  {
    "id": "54676929-35a8-5dc0-acc1-a29d4cf88b38",
    "club_id": "93df5013-9ec9-56e2-8f1e-dbbb52ad5feb",
    "url": "https://images.unsplash.com/photo-1473448912268-2022ce9509d8?auto=format&fit=crop&w=900&q=80",
    "type": "photo",
    "caption": "Sunset loop around campus before stretching on the Mall.",
    "created_at": "2026-04-07T20:00:00.000Z"
  },
  {
    "id": "9084f97b-14eb-586f-8427-785e0c3d16ef",
    "club_id": "93df5013-9ec9-56e2-8f1e-dbbb52ad5feb",
    "url": "https://images.unsplash.com/photo-1517836357463-d25dfeac3438?auto=format&fit=crop&w=900&q=80",
    "type": "photo",
    "caption": "Long-run crew meeting at Eppley before heading out.",
    "created_at": "2026-04-13T20:00:00.000Z"
  },
  {
    "id": "14975bb2-7e34-51a4-bd48-f904b9747de3",
    "club_id": "2c3160cc-928d-54c2-817c-2abc9ad857bf",
    "url": "https://images.unsplash.com/photo-1508804185872-d7badad00f7d?auto=format&fit=crop&w=900&q=80",
    "type": "photo",
    "caption": "Final run-through before spring showcase.",
    "created_at": "2026-04-05T20:00:00.000Z"
  },
  {
    "id": "e2fbbb5f-5462-5964-acba-7d50b238ad2e",
    "club_id": "2c3160cc-928d-54c2-817c-2abc9ad857bf",
    "url": "https://images.unsplash.com/photo-1501386761578-eac5c94b800a?auto=format&fit=crop&w=900&q=80",
    "type": "photo",
    "caption": "Team huddle right before a Clarice performance slot.",
    "created_at": "2026-04-14T20:00:00.000Z"
  },
  {
    "id": "6042c1be-6c3b-5c62-8cfa-7a9987ead6d7",
    "club_id": "189a718a-77c7-592f-b26f-c25f576a21b8",
    "url": "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=900&q=80",
    "type": "photo",
    "caption": "Internship prep circle with alumni advice that was actually useful.",
    "created_at": "2026-04-08T20:00:00.000Z"
  },
  {
    "id": "0a24602f-e15b-5dd8-841d-3546c9b772b2",
    "club_id": "189a718a-77c7-592f-b26f-c25f576a21b8",
    "url": "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=900&q=80",
    "type": "photo",
    "caption": "Engineering meet-and-greet before the panel began.",
    "created_at": "2026-04-11T20:00:00.000Z"
  },
  {
    "id": "587544e2-be84-5339-816a-5594fc176be7",
    "club_id": "646d7bc1-956c-593b-baec-109a7a9720b6",
    "url": "https://images.unsplash.com/photo-1473448912268-2022ce9509d8?auto=format&fit=crop&w=900&q=80",
    "type": "photo",
    "caption": "Trail day photo dump from a Shenandoah weekend.",
    "created_at": "2026-04-02T20:00:00.000Z"
  },
  {
    "id": "e9e5485d-377f-5145-8718-c915a976bf4c",
    "club_id": "646d7bc1-956c-593b-baec-109a7a9720b6",
    "url": "https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?auto=format&fit=crop&w=900&q=80",
    "type": "photo",
    "caption": "Gear check night before the next trip briefing.",
    "created_at": "2026-04-09T20:00:00.000Z"
  },
  {
    "id": "3ae45127-3cb3-5770-bc26-3f7477784063",
    "club_id": "572b2a79-031d-5b9e-b4bb-5a727906def8",
    "url": "https://images.unsplash.com/photo-1517457373958-b7bdd4587205?auto=format&fit=crop&w=900&q=80",
    "type": "photo",
    "caption": "Language exchange circles taking over a Stamp lounge corner.",
    "created_at": "2026-04-06T20:00:00.000Z"
  },
  {
    "id": "90d47dcb-b80e-5400-95fc-ac274faf452d",
    "club_id": "572b2a79-031d-5b9e-b4bb-5a727906def8",
    "url": "https://images.unsplash.com/photo-1526318472351-c75fcf070305?auto=format&fit=crop&w=900&q=80",
    "type": "photo",
    "caption": "Crowd photo from a food social that stayed packed all night.",
    "created_at": "2026-04-13T20:00:00.000Z"
  },
  {
    "id": "1b35a1f0-3c2d-5519-82db-027d0e5e25e3",
    "club_id": "673363a9-c22b-5446-98ac-37c379aaed6a",
    "url": "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=900&q=80",
    "type": "photo",
    "caption": "Projection tests for gallery night.",
    "created_at": "2026-04-07T20:00:00.000Z"
  },
  {
    "id": "e365619f-ba32-52fe-aa28-8f22dd85c93e",
    "club_id": "673363a9-c22b-5446-98ac-37c379aaed6a",
    "url": "https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=900&q=80",
    "type": "photo",
    "caption": "Laptops, sketches, and a lot of excited debugging.",
    "created_at": "2026-04-12T20:00:00.000Z"
  },
  {
    "id": "1aa0561d-c1f4-5227-a74f-535070dbd93e",
    "club_id": "b934a1b0-cf09-5fba-b612-1b8d8ee70570",
    "url": "https://images.unsplash.com/photo-1559027615-cd4628902d4a?auto=format&fit=crop&w=900&q=80",
    "type": "photo",
    "caption": "Care-kit packing tables full and moving fast.",
    "created_at": "2026-04-09T20:00:00.000Z"
  },
  {
    "id": "2cd0b48d-2eb8-5b63-9e0b-2c8c18d8bc03",
    "club_id": "b934a1b0-cf09-5fba-b612-1b8d8ee70570",
    "url": "https://images.unsplash.com/photo-1532629345422-7515f3d16bb6?auto=format&fit=crop&w=900&q=80",
    "type": "photo",
    "caption": "Volunteer check-in before a community supply drive.",
    "created_at": "2026-04-14T20:00:00.000Z"
  },
  {
    "id": "5cde2b0c-9e9d-5c3f-8fe7-450c637aad9d",
    "club_id": "44f63ee3-2917-5ac3-84f4-0ab9aa8cbe2a",
    "url": "https://images.unsplash.com/photo-1517604931442-7e0c8ed2963c?auto=format&fit=crop&w=900&q=80",
    "type": "photo",
    "caption": "Packed screening night before discussion started.",
    "created_at": "2026-04-05T20:00:00.000Z"
  },
  {
    "id": "6805b6bc-86fa-599d-845e-cde1b485e5f5",
    "club_id": "44f63ee3-2917-5ac3-84f4-0ab9aa8cbe2a",
    "url": "https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?auto=format&fit=crop&w=900&q=80",
    "type": "photo",
    "caption": "Poster wall from a student shorts showcase.",
    "created_at": "2026-04-11T20:00:00.000Z"
  }
] as ClubMedia[];

export function getClubIdsForUser(userId: string) {
  return mockClubMembers.filter((member) => member.user_id === userId && member.status === 'approved').map((member) => member.club_id);
}
