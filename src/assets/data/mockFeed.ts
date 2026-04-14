import { Post, Comment, UserProfile } from '../../shared/types';

export const mockAuthors = {
  "alexj_terp": {
    "id": "6667ca7e-5d07-5fd3-ab93-276110c38063",
    "email": "alexj_test@terpmail.umd.edu",
    "display_name": "Alex Johnson",
    "avatar_url": "https://i.pravatar.cc/300?u=alexj_terp",
    "bio": "Building things at UMD. Coffee enthusiast, campus explorer, and always down for a late-night build sprint.",
    "major": "Computer Science",
    "graduation_year": 2026,
    "push_token": null,
    "created_at": "2025-12-15T14:00:00.000Z",
    "updated_at": "2026-04-12T16:00:00.000Z"
  },
  "nia_builds": {
    "id": "79af4eed-7d3d-5729-8963-46e04646d23b",
    "email": "nia.brooks@terpmail.umd.edu",
    "display_name": "Nia Brooks",
    "avatar_url": "https://i.pravatar.cc/300?u=nia_builds",
    "bio": "Infosci student who bounces between Figma files, product strategy, and whoever needs a design critique.",
    "major": "Information Science",
    "graduation_year": 2027,
    "push_token": null,
    "created_at": "2025-12-16T14:00:00.000Z",
    "updated_at": "2026-04-11T16:00:00.000Z"
  },
  "danielpark": {
    "id": "0b4c9322-5024-52dd-b93b-68b721c026ee",
    "email": "daniel.park@terpmail.umd.edu",
    "display_name": "Daniel Park",
    "avatar_url": "https://i.pravatar.cc/300?u=danielpark",
    "bio": "Senior CS student, hackathon organizer, and the person who always knows which Iribe room is still open.",
    "major": "Computer Science",
    "graduation_year": 2025,
    "push_token": null,
    "created_at": "2025-12-17T14:00:00.000Z",
    "updated_at": "2026-04-10T16:00:00.000Z"
  },
  "priya_shah": {
    "id": "3871303c-e94e-56e3-b1ea-57ba9b0bc0c1",
    "email": "priya.shah@terpmail.umd.edu",
    "display_name": "Priya Shah",
    "avatar_url": "https://i.pravatar.cc/300?u=priya_shah",
    "bio": "Bio major balancing lab hours, club leadership, and a permanent search for the best study corner on campus.",
    "major": "Biology",
    "graduation_year": 2026,
    "push_token": null,
    "created_at": "2025-12-18T14:00:00.000Z",
    "updated_at": "2026-04-12T16:00:00.000Z"
  },
  "marcus_t": {
    "id": "5a90dcaa-9700-59fb-9cc9-66b19e06e6d6",
    "email": "marcus.thompson@terpmail.umd.edu",
    "display_name": "Marcus Thompson",
    "avatar_url": "https://i.pravatar.cc/300?u=marcus_t",
    "bio": "Mechanical engineering, early morning runs, and the loudest student-section energy you will ever meet.",
    "major": "Mechanical Engineering",
    "graduation_year": 2026,
    "push_token": null,
    "created_at": "2025-12-19T14:00:00.000Z",
    "updated_at": "2026-04-11T16:00:00.000Z"
  },
  "maya_p": {
    "id": "a49d4554-325c-5c88-afaa-ef947f0a115a",
    "email": "maya.patel@terpmail.umd.edu",
    "display_name": "Maya Patel",
    "avatar_url": "https://i.pravatar.cc/300?u=maya_p",
    "bio": "Policy nerd, service organizer, and the friend who will always send you the registration deadline first.",
    "major": "Government and Politics",
    "graduation_year": 2027,
    "push_token": null,
    "created_at": "2025-12-20T14:00:00.000Z",
    "updated_at": "2026-04-10T16:00:00.000Z"
  },
  "leena_rao": {
    "id": "bf962ba5-980e-5ed4-b080-3ddad5c2e760",
    "email": "leena.rao@terpmail.umd.edu",
    "display_name": "Leena Rao",
    "avatar_url": "https://i.pravatar.cc/300?u=leena_rao",
    "bio": "Usually somewhere between a pitch deck, a rehearsal, and a coffee run through Stamp.",
    "major": "Finance",
    "graduation_year": 2026,
    "push_token": null,
    "created_at": "2025-12-21T14:00:00.000Z",
    "updated_at": "2026-04-12T16:00:00.000Z"
  },
  "ethan_kim": {
    "id": "f360a23b-4f3d-566a-959f-ea05849e43ab",
    "email": "ethan.kim@terpmail.umd.edu",
    "display_name": "Ethan Kim",
    "avatar_url": "https://i.pravatar.cc/300?u=ethan_kim",
    "bio": "Data science lead who genuinely thinks a clean SQL query can fix at least half of life.",
    "major": "Data Science",
    "graduation_year": 2025,
    "push_token": null,
    "created_at": "2025-12-22T14:00:00.000Z",
    "updated_at": "2026-04-11T16:00:00.000Z"
  },
  "sofia_alvarez": {
    "id": "ca86602c-434a-50de-af39-90312889c45d",
    "email": "sofia.alvarez@terpmail.umd.edu",
    "display_name": "Sofia Alvarez",
    "avatar_url": "https://i.pravatar.cc/300?u=sofia_alvarez",
    "bio": "Campus storyteller with a camera roll full of sunsets, events, and people being unexpectedly iconic.",
    "major": "Journalism",
    "graduation_year": 2027,
    "push_token": null,
    "created_at": "2025-12-23T14:00:00.000Z",
    "updated_at": "2026-04-10T16:00:00.000Z"
  },
  "jordank_umd": {
    "id": "dceb7801-ef4a-5c0d-8c77-d45c18b15df1",
    "email": "jordan.kim@terpmail.umd.edu",
    "display_name": "Jordan Kim",
    "avatar_url": "https://i.pravatar.cc/300?u=jordank_umd",
    "bio": "Outdoors club president, trail planner, and champion of touching grass during midterm season.",
    "major": "Environmental Science",
    "graduation_year": 2026,
    "push_token": null,
    "created_at": "2025-12-24T14:00:00.000Z",
    "updated_at": "2026-04-12T16:00:00.000Z"
  },
  "aaliyah_green": {
    "id": "9ffda673-63bb-542b-9b0d-0de86e4557ee",
    "email": "aaliyah.green@terpmail.umd.edu",
    "display_name": "Aaliyah Green",
    "avatar_url": "https://i.pravatar.cc/300?u=aaliyah_green",
    "bio": "Running club captain, wellness advocate, and always trying to convince people that morning movement is worth it.",
    "major": "Kinesiology",
    "graduation_year": 2027,
    "push_token": null,
    "created_at": "2025-12-25T14:00:00.000Z",
    "updated_at": "2026-04-11T16:00:00.000Z"
  },
  "rahulm": {
    "id": "7ebd3331-9d3e-5d07-b957-dbb6cb18760f",
    "email": "rahul.mehta@terpmail.umd.edu",
    "display_name": "Rahul Mehta",
    "avatar_url": "https://i.pravatar.cc/300?u=rahulm",
    "bio": "Usually carrying a soldering kit, a half-built side project, or both.",
    "major": "Electrical Engineering",
    "graduation_year": 2026,
    "push_token": null,
    "created_at": "2025-12-26T14:00:00.000Z",
    "updated_at": "2026-04-10T16:00:00.000Z"
  },
  "gracechen": {
    "id": "3a44d09f-f9ee-5606-8958-3cdb4d945381",
    "email": "grace.chen@terpmail.umd.edu",
    "display_name": "Grace Chen",
    "avatar_url": "https://i.pravatar.cc/300?u=gracechen",
    "bio": "Founder-energy all day. Loves thoughtful questions, practical advice, and a room full of ambitious people.",
    "major": "Finance",
    "graduation_year": 2025,
    "push_token": null,
    "created_at": "2025-12-27T14:00:00.000Z",
    "updated_at": "2026-04-12T16:00:00.000Z"
  },
  "omarh": {
    "id": "c0957686-8810-518a-8a56-df06c240f785",
    "email": "omar.hassan@terpmail.umd.edu",
    "display_name": "Omar Hassan",
    "avatar_url": "https://i.pravatar.cc/300?u=omarh",
    "bio": "Creative technologist who likes weird interfaces, clean code, and events with a strong vibe.",
    "major": "Computer Science",
    "graduation_year": 2026,
    "push_token": null,
    "created_at": "2025-12-28T14:00:00.000Z",
    "updated_at": "2026-04-11T16:00:00.000Z"
  },
  "hannah_lee": {
    "id": "7e1d57eb-5dc7-58f1-8fe1-a165779a5ddd",
    "email": "hannah.lee@terpmail.umd.edu",
    "display_name": "Hannah Lee",
    "avatar_url": "https://i.pravatar.cc/300?u=hannah_lee",
    "bio": "KSA president, outdoors regular, and forever making spreadsheets for things that do not need spreadsheets.",
    "major": "Public Health Science",
    "graduation_year": 2027,
    "push_token": null,
    "created_at": "2025-12-29T14:00:00.000Z",
    "updated_at": "2026-04-10T16:00:00.000Z"
  },
  "davidok": {
    "id": "9e36e2f6-f994-573b-b8f8-5e7ee6c3a6f4",
    "email": "david.okafor@terpmail.umd.edu",
    "display_name": "David Okafor",
    "avatar_url": "https://i.pravatar.cc/300?u=davidok",
    "bio": "Hardware + software + service hours. Finds a way to help before anyone asks.",
    "major": "Computer Engineering",
    "graduation_year": 2025,
    "push_token": null,
    "created_at": "2025-12-30T14:00:00.000Z",
    "updated_at": "2026-04-12T16:00:00.000Z"
  },
  "chloecreates": {
    "id": "af45b9b4-fb14-5b6d-bbcd-5ffcc64bf110",
    "email": "chloe.nguyen@terpmail.umd.edu",
    "display_name": "Chloe Nguyen",
    "avatar_url": "https://i.pravatar.cc/300?u=chloecreates",
    "bio": "Creative Coding Collective president, poster-maker, and curator of niche but excellent campus playlists.",
    "major": "Studio Art",
    "graduation_year": 2026,
    "push_token": null,
    "created_at": "2025-12-31T14:00:00.000Z",
    "updated_at": "2026-04-11T16:00:00.000Z"
  },
  "aaronfeldman": {
    "id": "1941e5a9-753c-5055-b24d-ff4990dd714e",
    "email": "aaron.feldman@terpmail.umd.edu",
    "display_name": "Aaron Feldman",
    "avatar_url": "https://i.pravatar.cc/300?u=aaronfeldman",
    "bio": "Film Society lead programmer and enthusiastic defender of late-night screenings with strong discussion energy.",
    "major": "English",
    "graduation_year": 2027,
    "push_token": null,
    "created_at": "2026-01-01T14:00:00.000Z",
    "updated_at": "2026-04-10T16:00:00.000Z"
  },
  "sana_mir": {
    "id": "77de58eb-8b78-5ad5-b5bb-a310726ca240",
    "email": "sana.mir@terpmail.umd.edu",
    "display_name": "Sana Mir",
    "avatar_url": "https://i.pravatar.cc/300?u=sana_mir",
    "bio": "Bhangra captain with equal love for stage lights, careful planning, and a solid post-event debrief.",
    "major": "Neuroscience",
    "graduation_year": 2026,
    "push_token": null,
    "created_at": "2026-01-02T14:00:00.000Z",
    "updated_at": "2026-04-12T16:00:00.000Z"
  },
  "tyler_bennett": {
    "id": "ee83f346-1b89-59ad-83b3-5ac6a979327e",
    "email": "tyler.bennett@terpmail.umd.edu",
    "display_name": "Tyler Bennett",
    "avatar_url": "https://i.pravatar.cc/300?u=tyler_bennett",
    "bio": "Shows up for founder talks, club screenings, and basically any event with a good crowd and better snacks.",
    "major": "Economics",
    "graduation_year": 2025,
    "push_token": null,
    "created_at": "2026-01-03T14:00:00.000Z",
    "updated_at": "2026-04-11T16:00:00.000Z"
  }
} as Record<string, UserProfile>;

export const authorHandles = {
  "6667ca7e-5d07-5fd3-ab93-276110c38063": "@alexj_terp",
  "79af4eed-7d3d-5729-8963-46e04646d23b": "@nia_builds",
  "0b4c9322-5024-52dd-b93b-68b721c026ee": "@danielpark",
  "3871303c-e94e-56e3-b1ea-57ba9b0bc0c1": "@priya_shah",
  "5a90dcaa-9700-59fb-9cc9-66b19e06e6d6": "@marcus_t",
  "a49d4554-325c-5c88-afaa-ef947f0a115a": "@maya_p",
  "bf962ba5-980e-5ed4-b080-3ddad5c2e760": "@leena_rao",
  "f360a23b-4f3d-566a-959f-ea05849e43ab": "@ethan_kim",
  "ca86602c-434a-50de-af39-90312889c45d": "@sofia_alvarez",
  "dceb7801-ef4a-5c0d-8c77-d45c18b15df1": "@jordank_umd",
  "9ffda673-63bb-542b-9b0d-0de86e4557ee": "@aaliyah_green",
  "7ebd3331-9d3e-5d07-b957-dbb6cb18760f": "@rahulm",
  "3a44d09f-f9ee-5606-8958-3cdb4d945381": "@gracechen",
  "c0957686-8810-518a-8a56-df06c240f785": "@omarh",
  "7e1d57eb-5dc7-58f1-8fe1-a165779a5ddd": "@hannah_lee",
  "9e36e2f6-f994-573b-b8f8-5e7ee6c3a6f4": "@davidok",
  "af45b9b4-fb14-5b6d-bbcd-5ffcc64bf110": "@chloecreates",
  "1941e5a9-753c-5055-b24d-ff4990dd714e": "@aaronfeldman",
  "77de58eb-8b78-5ad5-b5bb-a310726ca240": "@sana_mir",
  "ee83f346-1b89-59ad-83b3-5ac6a979327e": "@tyler_bennett"
} as Record<string, string>;

export const mockPosts = [
  {
    "id": "3fe6d5d1-4bc1-5445-b5e6-2273bd0dcc6d",
    "author_id": "ee83f346-1b89-59ad-83b3-5ac6a979327e",
    "author": {
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
      "created_at": "2026-01-03T14:00:00.000Z",
      "updated_at": "2026-04-11T16:00:00.000Z"
    },
    "club_id": null,
    "type": "text",
    "content": "Anyone else's ELMS acting up right now or is it just choosing violence against me specifically?",
    "media_urls": [],
    "media_items": [],
    "hashtags": [],
    "like_count": 9,
    "comment_count": 3,
    "share_count": 0,
    "is_pinned": false,
    "created_at": "2026-04-14T10:29:17.970Z",
    "updated_at": "2026-04-14T10:29:17.970Z",
    "is_liked": false
  },
  {
    "id": "6872b069-d626-56be-8f97-53cfbb0d34f0",
    "author_id": "6667ca7e-5d07-5fd3-ab93-276110c38063",
    "author": {
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
      "created_at": "2025-12-15T14:00:00.000Z",
      "updated_at": "2026-04-12T16:00:00.000Z"
    },
    "club_id": "aaa41ac9-63e0-592f-a177-be36e8b212ee",
    "type": "club_announcement",
    "content": "Hack Night #4 this week\nWe are back in IRB with mentor tables, pizza, and a sponsor challenge at the end. Bring a half-baked idea or just show up and find a team.",
    "media_urls": [],
    "media_items": [],
    "hashtags": [
      "4"
    ],
    "like_count": 16,
    "comment_count": 3,
    "share_count": 2,
    "is_pinned": true,
    "created_at": "2026-04-14T08:29:17.969Z",
    "updated_at": "2026-04-14T08:29:17.969Z",
    "is_liked": false
  },
  {
    "id": "d28c834d-9803-54e0-b58c-bcb2afa5548f",
    "author_id": "ca86602c-434a-50de-af39-90312889c45d",
    "author": {
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
      "created_at": "2025-12-23T14:00:00.000Z",
      "updated_at": "2026-04-10T16:00:00.000Z"
    },
    "club_id": null,
    "type": "image",
    "content": "The sunset over McKeldin Mall tonight was unreal. Campus looked cinematic for like fifteen straight minutes.",
    "media_urls": [
      "https://images.unsplash.com/photo-1541339907198-e08756dedf3f?auto=format&fit=crop&w=1200&q=80"
    ],
    "media_items": [
      {
        "id": "d28c834d-9803-54e0-b58c-bcb2afa5548f-0",
        "uri": "https://images.unsplash.com/photo-1541339907198-e08756dedf3f?auto=format&fit=crop&w=1200&q=80",
        "type": "image"
      }
    ],
    "hashtags": [],
    "like_count": 18,
    "comment_count": 4,
    "share_count": 2,
    "is_pinned": false,
    "created_at": "2026-04-14T00:10:00.000Z",
    "updated_at": "2026-04-14T00:10:00.000Z",
    "is_liked": false
  },
  {
    "id": "78b92ba4-7a17-532e-8c33-d1fa4e4e2ac0",
    "author_id": "1941e5a9-753c-5055-b24d-ff4990dd714e",
    "author": {
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
      "created_at": "2026-01-01T14:00:00.000Z",
      "updated_at": "2026-04-10T16:00:00.000Z"
    },
    "club_id": "44f63ee3-2917-5ac3-84f4-0ab9aa8cbe2a",
    "type": "image",
    "content": "Student Shorts Screening tomorrow night. We have a really strong lineup and the directors are staying for the discussion after.",
    "media_urls": [
      "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=1200&q=80"
    ],
    "media_items": [
      {
        "id": "78b92ba4-7a17-532e-8c33-d1fa4e4e2ac0-0",
        "uri": "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=1200&q=80",
        "type": "image"
      }
    ],
    "hashtags": [],
    "like_count": 11,
    "comment_count": 2,
    "share_count": 0,
    "is_pinned": false,
    "created_at": "2026-04-13T17:00:00.000Z",
    "updated_at": "2026-04-13T17:00:00.000Z",
    "is_liked": false
  },
  {
    "id": "37a221a6-79a8-5545-8054-86f6dce4b5a7",
    "author_id": "7e1d57eb-5dc7-58f1-8fe1-a165779a5ddd",
    "author": {
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
      "created_at": "2025-12-29T14:00:00.000Z",
      "updated_at": "2026-04-10T16:00:00.000Z"
    },
    "club_id": "572b2a79-031d-5b9e-b4bb-5a727906def8",
    "type": "text",
    "content": "Street food social tomorrow at Stamp. No pressure, just come hungry and bring a friend if you want.",
    "media_urls": [],
    "media_items": [],
    "hashtags": [],
    "like_count": 12,
    "comment_count": 0,
    "share_count": 0,
    "is_pinned": false,
    "created_at": "2026-04-13T15:45:00.000Z",
    "updated_at": "2026-04-13T15:45:00.000Z",
    "is_liked": false
  },
  {
    "id": "cba84639-f6aa-5675-ba1c-904bb97cfc56",
    "author_id": "3a44d09f-f9ee-5606-8958-3cdb4d945381",
    "author": {
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
      "created_at": "2025-12-27T14:00:00.000Z",
      "updated_at": "2026-04-12T16:00:00.000Z"
    },
    "club_id": "0e68c4f2-2b14-505c-972d-dda49fca824a",
    "type": "club_announcement",
    "content": "Founder Fireside is almost here\nIf you have ever wanted to hear the honest version of startup life, come through on Thursday. Alumni are staying after for small-group Q&A.",
    "media_urls": [],
    "media_items": [],
    "hashtags": [],
    "like_count": 14,
    "comment_count": 2,
    "share_count": 2,
    "is_pinned": true,
    "created_at": "2026-04-13T14:15:00.000Z",
    "updated_at": "2026-04-13T14:15:00.000Z",
    "is_liked": false
  },
  {
    "id": "7d2297a7-4bfb-5215-b07a-fe33e7ac68a1",
    "author_id": "a49d4554-325c-5c88-afaa-ef947f0a115a",
    "author": {
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
      "created_at": "2025-12-20T14:00:00.000Z",
      "updated_at": "2026-04-10T16:00:00.000Z"
    },
    "club_id": "b934a1b0-cf09-5fba-b612-1b8d8ee70570",
    "type": "club_announcement",
    "content": "Care kit volunteers needed\nWe are packing finals-week care kits this Sunday in Stamp. Easy way to help for an hour between study blocks.",
    "media_urls": [],
    "media_items": [],
    "hashtags": [],
    "like_count": 11,
    "comment_count": 3,
    "share_count": 0,
    "is_pinned": true,
    "created_at": "2026-04-12T18:20:00.000Z",
    "updated_at": "2026-04-12T18:20:00.000Z",
    "is_liked": false
  },
  {
    "id": "7e98aa82-6738-5d33-a190-b2a7c85a0fc5",
    "author_id": "0b4c9322-5024-52dd-b93b-68b721c026ee",
    "author": {
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
      "created_at": "2025-12-17T14:00:00.000Z",
      "updated_at": "2026-04-10T16:00:00.000Z"
    },
    "club_id": "aaa41ac9-63e0-592f-a177-be36e8b212ee",
    "type": "text",
    "content": "Bitcamp Team Match Night is in two days. If you have an idea but no team, that is literally what the room is for.",
    "media_urls": [],
    "media_items": [],
    "hashtags": [],
    "like_count": 15,
    "comment_count": 0,
    "share_count": 2,
    "is_pinned": false,
    "created_at": "2026-04-12T16:05:00.000Z",
    "updated_at": "2026-04-12T16:05:00.000Z",
    "is_liked": false
  },
  {
    "id": "16bb8485-58b3-5d63-a739-559a365a2edb",
    "author_id": "f360a23b-4f3d-566a-959f-ea05849e43ab",
    "author": {
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
      "created_at": "2025-12-22T14:00:00.000Z",
      "updated_at": "2026-04-11T16:00:00.000Z"
    },
    "club_id": "94dc4785-694a-5b8a-b73d-d6e896187afb",
    "type": "text",
    "content": "Resume clinic + SQL help tomorrow at McKeldin. Bring your laptop and something specific you want feedback on.",
    "media_urls": [],
    "media_items": [],
    "hashtags": [],
    "like_count": 13,
    "comment_count": 3,
    "share_count": 2,
    "is_pinned": false,
    "created_at": "2026-04-12T13:15:00.000Z",
    "updated_at": "2026-04-12T13:15:00.000Z",
    "is_liked": false
  },
  {
    "id": "96b8b191-2f44-500d-9596-a552ef24fa0c",
    "author_id": "77de58eb-8b78-5ad5-b5bb-a310726ca240",
    "author": {
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
      "created_at": "2026-01-02T14:00:00.000Z",
      "updated_at": "2026-04-12T16:00:00.000Z"
    },
    "club_id": "2c3160cc-928d-54c2-817c-2abc9ad857bf",
    "type": "text",
    "content": "Our Clarice showcase is finally coming together and rehearsal energy tonight was the exact reset I needed.",
    "media_urls": [],
    "media_items": [],
    "hashtags": [],
    "like_count": 14,
    "comment_count": 3,
    "share_count": 2,
    "is_pinned": false,
    "created_at": "2026-04-12T02:30:00.000Z",
    "updated_at": "2026-04-12T02:30:00.000Z",
    "is_liked": false
  },
  {
    "id": "9121b3d4-faa8-5f02-b3c1-118a5c1186b7",
    "author_id": "3871303c-e94e-56e3-b1ea-57ba9b0bc0c1",
    "author": {
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
      "created_at": "2025-12-18T14:00:00.000Z",
      "updated_at": "2026-04-12T16:00:00.000Z"
    },
    "club_id": null,
    "type": "text",
    "content": "Study Jam at McKeldin was exactly what I needed before this analytics project deadline. Shoutout to Data Science Club for making it feel way less chaotic.",
    "media_urls": [],
    "media_items": [],
    "hashtags": [],
    "like_count": 13,
    "comment_count": 2,
    "share_count": 2,
    "is_pinned": false,
    "created_at": "2026-04-12T01:05:00.000Z",
    "updated_at": "2026-04-12T01:05:00.000Z",
    "is_liked": false
  },
  {
    "id": "707261b6-3c40-5933-afee-cb2a119f7368",
    "author_id": "6667ca7e-5d07-5fd3-ab93-276110c38063",
    "author": {
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
      "created_at": "2025-12-15T14:00:00.000Z",
      "updated_at": "2026-04-12T16:00:00.000Z"
    },
    "club_id": null,
    "type": "text",
    "content": "Today somehow included a mentor meeting in Iribe, coffee in Stamp, and accidentally staying at McKeldin until dark. Very xUMD-coded day.",
    "media_urls": [],
    "media_items": [],
    "hashtags": [],
    "like_count": 10,
    "comment_count": 2,
    "share_count": 0,
    "is_pinned": false,
    "created_at": "2026-04-11T01:45:00.000Z",
    "updated_at": "2026-04-11T01:45:00.000Z",
    "is_liked": false
  },
  {
    "id": "a2856f8d-5fc6-5a4d-a9fa-43fdf81ccc7e",
    "author_id": "dceb7801-ef4a-5c0d-8c77-d45c18b15df1",
    "author": {
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
      "created_at": "2025-12-24T14:00:00.000Z",
      "updated_at": "2026-04-12T16:00:00.000Z"
    },
    "club_id": "646d7bc1-956c-593b-baec-109a7a9720b6",
    "type": "image",
    "content": "Maryland Outdoors is planning our next Shenandoah weekend and the trip briefing is up. Join if you want in before seats disappear.",
    "media_urls": [
      "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1200&q=80"
    ],
    "media_items": [
      {
        "id": "a2856f8d-5fc6-5a4d-a9fa-43fdf81ccc7e-0",
        "uri": "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1200&q=80",
        "type": "image"
      }
    ],
    "hashtags": [],
    "like_count": 12,
    "comment_count": 2,
    "share_count": 0,
    "is_pinned": false,
    "created_at": "2026-04-10T22:40:00.000Z",
    "updated_at": "2026-04-10T22:40:00.000Z",
    "is_liked": false
  },
  {
    "id": "e5f13df7-3eda-54af-964a-8d1f5459936f",
    "author_id": "af45b9b4-fb14-5b6d-bbcd-5ffcc64bf110",
    "author": {
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
      "created_at": "2025-12-31T14:00:00.000Z",
      "updated_at": "2026-04-11T16:00:00.000Z"
    },
    "club_id": "673363a9-c22b-5446-98ac-37c379aaed6a",
    "type": "image",
    "content": "Creative Coding Collective gallery night is getting dangerously cool. Projection tests looked incredible tonight.",
    "media_urls": [
      "https://images.unsplash.com/photo-1517694712202-14dd9538aa97?auto=format&fit=crop&w=1200&q=80"
    ],
    "media_items": [
      {
        "id": "e5f13df7-3eda-54af-964a-8d1f5459936f-0",
        "uri": "https://images.unsplash.com/photo-1517694712202-14dd9538aa97?auto=format&fit=crop&w=1200&q=80",
        "type": "image"
      }
    ],
    "hashtags": [],
    "like_count": 10,
    "comment_count": 0,
    "share_count": 0,
    "is_pinned": false,
    "created_at": "2026-04-10T02:10:00.000Z",
    "updated_at": "2026-04-10T02:10:00.000Z",
    "is_liked": false
  },
  {
    "id": "8c506e11-8c57-51fd-874a-2f507b152165",
    "author_id": "bf962ba5-980e-5ed4-b080-3ddad5c2e760",
    "author": {
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
      "created_at": "2025-12-21T14:00:00.000Z",
      "updated_at": "2026-04-12T16:00:00.000Z"
    },
    "club_id": "0e68c4f2-2b14-505c-972d-dda49fca824a",
    "type": "text",
    "content": "Makers + Founders Brunch is going to be low-key but very useful. If you want collaborators, come early and actually talk to people.",
    "media_urls": [],
    "media_items": [],
    "hashtags": [],
    "like_count": 9,
    "comment_count": 0,
    "share_count": 0,
    "is_pinned": false,
    "created_at": "2026-04-09T16:30:00.000Z",
    "updated_at": "2026-04-09T16:30:00.000Z",
    "is_liked": false
  },
  {
    "id": "2dfd89f2-6720-558a-a14c-ecbbc31298f7",
    "author_id": "5a90dcaa-9700-59fb-9cc9-66b19e06e6d6",
    "author": {
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
      "created_at": "2025-12-19T14:00:00.000Z",
      "updated_at": "2026-04-11T16:00:00.000Z"
    },
    "club_id": null,
    "type": "text",
    "content": "If you saw a group of us absolutely fighting for our lives near Eppley, that was running club hill reps and yes, they were brutal.",
    "media_urls": [],
    "media_items": [],
    "hashtags": [],
    "like_count": 8,
    "comment_count": 0,
    "share_count": 0,
    "is_pinned": false,
    "created_at": "2026-04-09T00:25:00.000Z",
    "updated_at": "2026-04-09T00:25:00.000Z",
    "is_liked": false
  },
  {
    "id": "6bfbf248-546f-574c-b594-44be01739fbc",
    "author_id": "79af4eed-7d3d-5729-8963-46e04646d23b",
    "author": {
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
      "created_at": "2025-12-16T14:00:00.000Z",
      "updated_at": "2026-04-11T16:00:00.000Z"
    },
    "club_id": null,
    "type": "text",
    "content": "ESJ has quietly become my favorite place to work when McKeldin feels too loud. The lighting just works.",
    "media_urls": [],
    "media_items": [],
    "hashtags": [],
    "like_count": 7,
    "comment_count": 0,
    "share_count": 0,
    "is_pinned": false,
    "created_at": "2026-04-06T19:20:00.000Z",
    "updated_at": "2026-04-06T19:20:00.000Z",
    "is_liked": false
  },
  {
    "id": "a8fc74ab-2c0f-5a0d-ab8f-e322a4656d9d",
    "author_id": "9e36e2f6-f994-573b-b8f8-5e7ee6c3a6f4",
    "author": {
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
      "created_at": "2025-12-30T14:00:00.000Z",
      "updated_at": "2026-04-12T16:00:00.000Z"
    },
    "club_id": null,
    "type": "text",
    "content": "Service night reminder: it always feels worth showing up, even when you only have one hour to spare.",
    "media_urls": [],
    "media_items": [],
    "hashtags": [],
    "like_count": 6,
    "comment_count": 2,
    "share_count": 0,
    "is_pinned": false,
    "created_at": "2026-04-05T23:10:00.000Z",
    "updated_at": "2026-04-05T23:10:00.000Z",
    "is_liked": false
  }
] as Post[];

export interface CommentWithReplies extends Comment {
  replies?: CommentWithReplies[];
  is_liked?: boolean;
}

export const mockComments = {
  "6872b069-d626-56be-8f97-53cfbb0d34f0": [
    {
      "id": "e707b6d3-58e9-5d2c-9382-bb62d1919196",
      "post_id": "6872b069-d626-56be-8f97-53cfbb0d34f0",
      "author_id": "f360a23b-4f3d-566a-959f-ea05849e43ab",
      "author": {
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
        "created_at": "2025-12-22T14:00:00.000Z",
        "updated_at": "2026-04-11T16:00:00.000Z"
      },
      "parent_id": null,
      "content": "We have extra mentor coverage this week too, so bring whatever bug has been blocking you.",
      "like_count": 5,
      "created_at": "2026-04-14T08:41:17.969Z",
      "updated_at": "2026-04-14T08:41:17.969Z",
      "is_liked": false,
      "replies": []
    },
    {
      "id": "2736b0ed-4833-50d8-b2c3-f6c28b915691",
      "post_id": "6872b069-d626-56be-8f97-53cfbb0d34f0",
      "author_id": "79af4eed-7d3d-5729-8963-46e04646d23b",
      "author": {
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
        "created_at": "2025-12-16T14:00:00.000Z",
        "updated_at": "2026-04-11T16:00:00.000Z"
      },
      "parent_id": null,
      "content": "Can confirm the pizza lineup is better than usual.",
      "like_count": 1,
      "created_at": "2026-04-14T08:50:17.969Z",
      "updated_at": "2026-04-14T08:50:17.969Z",
      "is_liked": false,
      "replies": [
        {
          "id": "89024815-1fe7-5e8c-975e-f3eb87b55836",
          "post_id": "6872b069-d626-56be-8f97-53cfbb0d34f0",
          "author_id": "6667ca7e-5d07-5fd3-ab93-276110c38063",
          "author": {
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
            "created_at": "2025-12-15T14:00:00.000Z",
            "updated_at": "2026-04-12T16:00:00.000Z"
          },
          "parent_id": "2736b0ed-4833-50d8-b2c3-f6c28b915691",
          "content": "I fought for that line item in the budget and I stand by it.",
          "like_count": 0,
          "created_at": "2026-04-14T08:59:17.969Z",
          "updated_at": "2026-04-14T08:59:17.969Z",
          "is_liked": false,
          "replies": []
        }
      ]
    }
  ],
  "cba84639-f6aa-5675-ba1c-904bb97cfc56": [
    {
      "id": "a351f801-5ab3-5e38-8199-3d05b716ede2",
      "post_id": "cba84639-f6aa-5675-ba1c-904bb97cfc56",
      "author_id": "bf962ba5-980e-5ed4-b080-3ddad5c2e760",
      "author": {
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
        "created_at": "2025-12-21T14:00:00.000Z",
        "updated_at": "2026-04-12T16:00:00.000Z"
      },
      "parent_id": null,
      "content": "Please come ready with real questions. The alumni asked for the honest version, not the polished one.",
      "like_count": 2,
      "created_at": "2026-04-13T14:27:00.000Z",
      "updated_at": "2026-04-13T14:27:00.000Z",
      "is_liked": false,
      "replies": []
    },
    {
      "id": "542b59d6-9d22-5a3a-bd3f-fe3926188b3a",
      "post_id": "cba84639-f6aa-5675-ba1c-904bb97cfc56",
      "author_id": "ee83f346-1b89-59ad-83b3-5ac6a979327e",
      "author": {
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
        "created_at": "2026-01-03T14:00:00.000Z",
        "updated_at": "2026-04-11T16:00:00.000Z"
      },
      "parent_id": null,
      "content": "This is the first founder event I have actually cleared my calendar for all semester.",
      "like_count": 1,
      "created_at": "2026-04-13T14:36:00.000Z",
      "updated_at": "2026-04-13T14:36:00.000Z",
      "is_liked": false,
      "replies": []
    }
  ],
  "7d2297a7-4bfb-5215-b07a-fe33e7ac68a1": [
    {
      "id": "6e9541ce-84c0-5591-b46b-df05f0949bf0",
      "post_id": "7d2297a7-4bfb-5215-b07a-fe33e7ac68a1",
      "author_id": "9ffda673-63bb-542b-9b0d-0de86e4557ee",
      "author": {
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
        "created_at": "2025-12-25T14:00:00.000Z",
        "updated_at": "2026-04-11T16:00:00.000Z"
      },
      "parent_id": null,
      "content": "We can always use another set of hands during the first hour.",
      "like_count": 2,
      "created_at": "2026-04-12T18:32:00.000Z",
      "updated_at": "2026-04-12T18:32:00.000Z",
      "is_liked": false,
      "replies": []
    },
    {
      "id": "9999a818-9e4c-5a54-8eac-ef7b47462af0",
      "post_id": "7d2297a7-4bfb-5215-b07a-fe33e7ac68a1",
      "author_id": "ca86602c-434a-50de-af39-90312889c45d",
      "author": {
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
        "created_at": "2025-12-23T14:00:00.000Z",
        "updated_at": "2026-04-10T16:00:00.000Z"
      },
      "parent_id": null,
      "content": "I will bring tape and markers again.",
      "like_count": 2,
      "created_at": "2026-04-12T18:41:00.000Z",
      "updated_at": "2026-04-12T18:41:00.000Z",
      "is_liked": false,
      "replies": [
        {
          "id": "006aa68b-f2a3-5216-9bf8-bdf811a2fe52",
          "post_id": "7d2297a7-4bfb-5215-b07a-fe33e7ac68a1",
          "author_id": "a49d4554-325c-5c88-afaa-ef947f0a115a",
          "author": {
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
            "created_at": "2025-12-20T14:00:00.000Z",
            "updated_at": "2026-04-10T16:00:00.000Z"
          },
          "parent_id": "9999a818-9e4c-5a54-8eac-ef7b47462af0",
          "content": "Perfect. Poster station is yours if you want it.",
          "like_count": 0,
          "created_at": "2026-04-12T18:50:00.000Z",
          "updated_at": "2026-04-12T18:50:00.000Z",
          "is_liked": false,
          "replies": []
        }
      ]
    }
  ],
  "9121b3d4-faa8-5f02-b3c1-118a5c1186b7": [
    {
      "id": "ce2908be-2a00-5662-a458-d36d6607c140",
      "post_id": "9121b3d4-faa8-5f02-b3c1-118a5c1186b7",
      "author_id": "f360a23b-4f3d-566a-959f-ea05849e43ab",
      "author": {
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
        "created_at": "2025-12-22T14:00:00.000Z",
        "updated_at": "2026-04-11T16:00:00.000Z"
      },
      "parent_id": null,
      "content": "Glad it helped. McKeldin on study-jam nights has such good focus energy.",
      "like_count": 3,
      "created_at": "2026-04-12T01:17:00.000Z",
      "updated_at": "2026-04-12T01:17:00.000Z",
      "is_liked": false,
      "replies": []
    },
    {
      "id": "3ec411dd-969d-516e-909b-2a2f7235493a",
      "post_id": "9121b3d4-faa8-5f02-b3c1-118a5c1186b7",
      "author_id": "77de58eb-8b78-5ad5-b5bb-a310726ca240",
      "author": {
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
        "created_at": "2026-01-02T14:00:00.000Z",
        "updated_at": "2026-04-12T16:00:00.000Z"
      },
      "parent_id": null,
      "content": "You locked in for that whole last hour. Respect.",
      "like_count": 4,
      "created_at": "2026-04-12T01:26:00.000Z",
      "updated_at": "2026-04-12T01:26:00.000Z",
      "is_liked": false,
      "replies": []
    }
  ],
  "d28c834d-9803-54e0-b58c-bcb2afa5548f": [
    {
      "id": "9572d460-18ff-53a6-a5a1-a1d05f596563",
      "post_id": "d28c834d-9803-54e0-b58c-bcb2afa5548f",
      "author_id": "6667ca7e-5d07-5fd3-ab93-276110c38063",
      "author": {
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
        "created_at": "2025-12-15T14:00:00.000Z",
        "updated_at": "2026-04-12T16:00:00.000Z"
      },
      "parent_id": null,
      "content": "This campus really knows when to randomly look its best.",
      "like_count": 2,
      "created_at": "2026-04-14T00:22:00.000Z",
      "updated_at": "2026-04-14T00:22:00.000Z",
      "is_liked": false,
      "replies": []
    },
    {
      "id": "8f59ec51-46b2-5dda-9798-d5770f87c06e",
      "post_id": "d28c834d-9803-54e0-b58c-bcb2afa5548f",
      "author_id": "3871303c-e94e-56e3-b1ea-57ba9b0bc0c1",
      "author": {
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
        "created_at": "2025-12-18T14:00:00.000Z",
        "updated_at": "2026-04-12T16:00:00.000Z"
      },
      "parent_id": null,
      "content": "Please send me the original because this deserves to be wallpaper status.",
      "like_count": 4,
      "created_at": "2026-04-14T00:31:00.000Z",
      "updated_at": "2026-04-14T00:31:00.000Z",
      "is_liked": false,
      "replies": [
        {
          "id": "fcd51c4b-f095-5152-85fb-9f41b002fc12",
          "post_id": "d28c834d-9803-54e0-b58c-bcb2afa5548f",
          "author_id": "ca86602c-434a-50de-af39-90312889c45d",
          "author": {
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
            "created_at": "2025-12-23T14:00:00.000Z",
            "updated_at": "2026-04-10T16:00:00.000Z"
          },
          "parent_id": "8f59ec51-46b2-5dda-9798-d5770f87c06e",
          "content": "On it. I have a couple more from five minutes later too.",
          "like_count": 0,
          "created_at": "2026-04-14T00:40:00.000Z",
          "updated_at": "2026-04-14T00:40:00.000Z",
          "is_liked": false,
          "replies": []
        }
      ]
    },
    {
      "id": "572e9573-8ba8-5c62-90e0-acc16270d20d",
      "post_id": "d28c834d-9803-54e0-b58c-bcb2afa5548f",
      "author_id": "1941e5a9-753c-5055-b24d-ff4990dd714e",
      "author": {
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
        "created_at": "2026-01-01T14:00:00.000Z",
        "updated_at": "2026-04-10T16:00:00.000Z"
      },
      "parent_id": null,
      "content": "The color grade on this is ridiculous.",
      "like_count": 4,
      "created_at": "2026-04-14T00:49:00.000Z",
      "updated_at": "2026-04-14T00:49:00.000Z",
      "is_liked": false,
      "replies": []
    }
  ],
  "a2856f8d-5fc6-5a4d-a9fa-43fdf81ccc7e": [
    {
      "id": "c79245b6-0d6c-550c-8572-99e306502532",
      "post_id": "a2856f8d-5fc6-5a4d-a9fa-43fdf81ccc7e",
      "author_id": "1941e5a9-753c-5055-b24d-ff4990dd714e",
      "author": {
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
        "created_at": "2026-01-01T14:00:00.000Z",
        "updated_at": "2026-04-10T16:00:00.000Z"
      },
      "parent_id": null,
      "content": "I am in if somebody reminds me about gear pickup.",
      "like_count": 5,
      "created_at": "2026-04-10T22:52:00.000Z",
      "updated_at": "2026-04-10T22:52:00.000Z",
      "is_liked": false,
      "replies": []
    },
    {
      "id": "10fa50ef-b4d5-5c11-aa52-34fa87d97b0e",
      "post_id": "a2856f8d-5fc6-5a4d-a9fa-43fdf81ccc7e",
      "author_id": "6667ca7e-5d07-5fd3-ab93-276110c38063",
      "author": {
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
        "created_at": "2025-12-15T14:00:00.000Z",
        "updated_at": "2026-04-12T16:00:00.000Z"
      },
      "parent_id": null,
      "content": "Same. Need a definitive shoe answer before I commit.",
      "like_count": 3,
      "created_at": "2026-04-10T23:01:00.000Z",
      "updated_at": "2026-04-10T23:01:00.000Z",
      "is_liked": false,
      "replies": []
    }
  ],
  "3fe6d5d1-4bc1-5445-b5e6-2273bd0dcc6d": [
    {
      "id": "a38e0632-6152-5fef-a373-c91cd7f22888",
      "post_id": "3fe6d5d1-4bc1-5445-b5e6-2273bd0dcc6d",
      "author_id": "6667ca7e-5d07-5fd3-ab93-276110c38063",
      "author": {
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
        "created_at": "2025-12-15T14:00:00.000Z",
        "updated_at": "2026-04-12T16:00:00.000Z"
      },
      "parent_id": null,
      "content": "ELMS saw your syllabus and chose chaos.",
      "like_count": 5,
      "created_at": "2026-04-14T10:41:17.970Z",
      "updated_at": "2026-04-14T10:41:17.970Z",
      "is_liked": false,
      "replies": []
    },
    {
      "id": "ecaed9d4-bfc0-5862-84e5-249607ec5fac",
      "post_id": "3fe6d5d1-4bc1-5445-b5e6-2273bd0dcc6d",
      "author_id": "a49d4554-325c-5c88-afaa-ef947f0a115a",
      "author": {
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
        "created_at": "2025-12-20T14:00:00.000Z",
        "updated_at": "2026-04-10T16:00:00.000Z"
      },
      "parent_id": null,
      "content": "Not just you. I got booted out twice this afternoon.",
      "like_count": 3,
      "created_at": "2026-04-14T10:50:17.970Z",
      "updated_at": "2026-04-14T10:50:17.970Z",
      "is_liked": false,
      "replies": []
    },
    {
      "id": "bfad464c-979f-544d-9d48-4b39bab769a0",
      "post_id": "3fe6d5d1-4bc1-5445-b5e6-2273bd0dcc6d",
      "author_id": "3a44d09f-f9ee-5606-8958-3cdb4d945381",
      "author": {
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
        "created_at": "2025-12-27T14:00:00.000Z",
        "updated_at": "2026-04-12T16:00:00.000Z"
      },
      "parent_id": null,
      "content": "This app picks the worst possible times to fall apart.",
      "like_count": 5,
      "created_at": "2026-04-14T10:59:17.970Z",
      "updated_at": "2026-04-14T10:59:17.970Z",
      "is_liked": false,
      "replies": []
    }
  ],
  "16bb8485-58b3-5d63-a739-559a365a2edb": [
    {
      "id": "061731dd-cf9d-58e6-a468-6c51cd757fe9",
      "post_id": "16bb8485-58b3-5d63-a739-559a365a2edb",
      "author_id": "3871303c-e94e-56e3-b1ea-57ba9b0bc0c1",
      "author": {
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
        "created_at": "2025-12-18T14:00:00.000Z",
        "updated_at": "2026-04-12T16:00:00.000Z"
      },
      "parent_id": null,
      "content": "Bringing mine. It needs help and I have accepted that.",
      "like_count": 5,
      "created_at": "2026-04-12T13:27:00.000Z",
      "updated_at": "2026-04-12T13:27:00.000Z",
      "is_liked": false,
      "replies": []
    },
    {
      "id": "1dceb0d2-9067-5bca-9115-35a8f29b2bd8",
      "post_id": "16bb8485-58b3-5d63-a739-559a365a2edb",
      "author_id": "6667ca7e-5d07-5fd3-ab93-276110c38063",
      "author": {
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
        "created_at": "2025-12-15T14:00:00.000Z",
        "updated_at": "2026-04-12T16:00:00.000Z"
      },
      "parent_id": null,
      "content": "Can people bring product resumes too or strictly analytics?",
      "like_count": 5,
      "created_at": "2026-04-12T13:36:00.000Z",
      "updated_at": "2026-04-12T13:36:00.000Z",
      "is_liked": false,
      "replies": [
        {
          "id": "bb304ce4-379b-57f8-9d44-e79756696eda",
          "post_id": "16bb8485-58b3-5d63-a739-559a365a2edb",
          "author_id": "f360a23b-4f3d-566a-959f-ea05849e43ab",
          "author": {
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
            "created_at": "2025-12-22T14:00:00.000Z",
            "updated_at": "2026-04-11T16:00:00.000Z"
          },
          "parent_id": "1dceb0d2-9067-5bca-9115-35a8f29b2bd8",
          "content": "Bring it. We can still tighten the story and bullets.",
          "like_count": 1,
          "created_at": "2026-04-12T13:45:00.000Z",
          "updated_at": "2026-04-12T13:45:00.000Z",
          "is_liked": false,
          "replies": []
        }
      ]
    }
  ],
  "78b92ba4-7a17-532e-8c33-d1fa4e4e2ac0": [
    {
      "id": "fb18a16e-6db0-59e9-82ca-92dcbe6fe0f1",
      "post_id": "78b92ba4-7a17-532e-8c33-d1fa4e4e2ac0",
      "author_id": "ca86602c-434a-50de-af39-90312889c45d",
      "author": {
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
        "created_at": "2025-12-23T14:00:00.000Z",
        "updated_at": "2026-04-10T16:00:00.000Z"
      },
      "parent_id": null,
      "content": "The lineup is actually so strong. There is a documentary short in there I cannot stop thinking about.",
      "like_count": 2,
      "created_at": "2026-04-13T17:12:00.000Z",
      "updated_at": "2026-04-13T17:12:00.000Z",
      "is_liked": false,
      "replies": []
    },
    {
      "id": "97bbd230-a821-58d8-961b-140ba606fc0e",
      "post_id": "78b92ba4-7a17-532e-8c33-d1fa4e4e2ac0",
      "author_id": "af45b9b4-fb14-5b6d-bbcd-5ffcc64bf110",
      "author": {
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
        "created_at": "2025-12-31T14:00:00.000Z",
        "updated_at": "2026-04-11T16:00:00.000Z"
      },
      "parent_id": null,
      "content": "Saving a seat near the front for the discussion after.",
      "like_count": 5,
      "created_at": "2026-04-13T17:21:00.000Z",
      "updated_at": "2026-04-13T17:21:00.000Z",
      "is_liked": false,
      "replies": []
    }
  ],
  "96b8b191-2f44-500d-9596-a552ef24fa0c": [
    {
      "id": "606ea996-e099-5fcf-ae1d-379da0630b73",
      "post_id": "96b8b191-2f44-500d-9596-a552ef24fa0c",
      "author_id": "bf962ba5-980e-5ed4-b080-3ddad5c2e760",
      "author": {
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
        "created_at": "2025-12-21T14:00:00.000Z",
        "updated_at": "2026-04-12T16:00:00.000Z"
      },
      "parent_id": null,
      "content": "Tonight felt sharp. The transitions finally clicked.",
      "like_count": 3,
      "created_at": "2026-04-12T02:42:00.000Z",
      "updated_at": "2026-04-12T02:42:00.000Z",
      "is_liked": false,
      "replies": []
    },
    {
      "id": "db2188e4-baeb-5355-8c64-d18e94cf6a4a",
      "post_id": "96b8b191-2f44-500d-9596-a552ef24fa0c",
      "author_id": "3871303c-e94e-56e3-b1ea-57ba9b0bc0c1",
      "author": {
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
        "created_at": "2025-12-18T14:00:00.000Z",
        "updated_at": "2026-04-12T16:00:00.000Z"
      },
      "parent_id": null,
      "content": "Proud of this team every single time.",
      "like_count": 3,
      "created_at": "2026-04-12T02:51:00.000Z",
      "updated_at": "2026-04-12T02:51:00.000Z",
      "is_liked": false,
      "replies": [
        {
          "id": "0c52ccab-a862-5240-a7d6-d1526f61efc2",
          "post_id": "96b8b191-2f44-500d-9596-a552ef24fa0c",
          "author_id": "77de58eb-8b78-5ad5-b5bb-a310726ca240",
          "author": {
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
            "created_at": "2026-01-02T14:00:00.000Z",
            "updated_at": "2026-04-12T16:00:00.000Z"
          },
          "parent_id": "db2188e4-baeb-5355-8c64-d18e94cf6a4a",
          "content": "Okay now I am emotional again.",
          "like_count": 2,
          "created_at": "2026-04-12T03:00:00.000Z",
          "updated_at": "2026-04-12T03:00:00.000Z",
          "is_liked": false,
          "replies": []
        }
      ]
    }
  ],
  "707261b6-3c40-5933-afee-cb2a119f7368": [
    {
      "id": "05333b89-832e-56b3-b15a-32f755eadbaa",
      "post_id": "707261b6-3c40-5933-afee-cb2a119f7368",
      "author_id": "79af4eed-7d3d-5729-8963-46e04646d23b",
      "author": {
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
        "created_at": "2025-12-16T14:00:00.000Z",
        "updated_at": "2026-04-11T16:00:00.000Z"
      },
      "parent_id": null,
      "content": "This is basically the whole promise of the app in one post.",
      "like_count": 5,
      "created_at": "2026-04-11T01:57:00.000Z",
      "updated_at": "2026-04-11T01:57:00.000Z",
      "is_liked": false,
      "replies": []
    },
    {
      "id": "07352195-b406-50b1-ba7c-545f4ace4628",
      "post_id": "707261b6-3c40-5933-afee-cb2a119f7368",
      "author_id": "0b4c9322-5024-52dd-b93b-68b721c026ee",
      "author": {
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
        "created_at": "2025-12-17T14:00:00.000Z",
        "updated_at": "2026-04-10T16:00:00.000Z"
      },
      "parent_id": null,
      "content": "If you did not end the day at McKeldin, was it even a real campus day?",
      "like_count": 1,
      "created_at": "2026-04-11T02:06:00.000Z",
      "updated_at": "2026-04-11T02:06:00.000Z",
      "is_liked": false,
      "replies": []
    }
  ],
  "a8fc74ab-2c0f-5a0d-ab8f-e322a4656d9d": [
    {
      "id": "0d598d13-2824-5325-8128-5c8c721fc35a",
      "post_id": "a8fc74ab-2c0f-5a0d-ab8f-e322a4656d9d",
      "author_id": "a49d4554-325c-5c88-afaa-ef947f0a115a",
      "author": {
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
        "created_at": "2025-12-20T14:00:00.000Z",
        "updated_at": "2026-04-10T16:00:00.000Z"
      },
      "parent_id": null,
      "content": "Exactly. Consistency matters more than people think.",
      "like_count": 3,
      "created_at": "2026-04-05T23:22:00.000Z",
      "updated_at": "2026-04-05T23:22:00.000Z",
      "is_liked": false,
      "replies": []
    },
    {
      "id": "a3ea9550-c183-5f0d-8310-1620d70cd9ed",
      "post_id": "a8fc74ab-2c0f-5a0d-ab8f-e322a4656d9d",
      "author_id": "9ffda673-63bb-542b-9b0d-0de86e4557ee",
      "author": {
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
        "created_at": "2025-12-25T14:00:00.000Z",
        "updated_at": "2026-04-11T16:00:00.000Z"
      },
      "parent_id": null,
      "content": "Small volunteer shifts keep the whole thing moving.",
      "like_count": 2,
      "created_at": "2026-04-05T23:31:00.000Z",
      "updated_at": "2026-04-05T23:31:00.000Z",
      "is_liked": false,
      "replies": []
    }
  ]
} as Record<string, CommentWithReplies[]>;
