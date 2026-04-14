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

export const CURRENT_SOCIAL_USER_ID = "6667ca7e-5d07-5fd3-ab93-276110c38063";

export const socialProfiles = {
  "6667ca7e-5d07-5fd3-ab93-276110c38063": {
    "id": "6667ca7e-5d07-5fd3-ab93-276110c38063",
    "displayName": "Alex Johnson",
    "username": "alexj_terp",
    "avatarUrl": "https://i.pravatar.cc/300?u=alexj_terp",
    "bio": "Building things at UMD. Coffee enthusiast, campus explorer, and always down for a late-night build sprint.",
    "pronouns": "they/them",
    "major": "Computer Science",
    "classYear": 2026,
    "clubIds": [
      "aaa41ac9-63e0-592f-a177-be36e8b212ee",
      "94dc4785-694a-5b8a-b73d-d6e896187afb",
      "0e68c4f2-2b14-505c-972d-dda49fca824a",
      "646d7bc1-956c-593b-baec-109a7a9720b6"
    ],
    "interests": [
      "builders",
      "startups",
      "campus-life",
      "design",
      "coffee",
      "community"
    ]
  },
  "79af4eed-7d3d-5729-8963-46e04646d23b": {
    "id": "79af4eed-7d3d-5729-8963-46e04646d23b",
    "displayName": "Nia Brooks",
    "username": "nia_builds",
    "avatarUrl": "https://i.pravatar.cc/300?u=nia_builds",
    "bio": "Infosci student who bounces between Figma files, product strategy, and whoever needs a design critique.",
    "pronouns": "she/her",
    "major": "Information Science",
    "classYear": 2027,
    "clubIds": [
      "aaa41ac9-63e0-592f-a177-be36e8b212ee",
      "0e68c4f2-2b14-505c-972d-dda49fca824a",
      "189a718a-77c7-592f-b26f-c25f576a21b8",
      "673363a9-c22b-5446-98ac-37c379aaed6a"
    ],
    "interests": [
      "design",
      "product",
      "builders",
      "community",
      "mentorship"
    ]
  },
  "0b4c9322-5024-52dd-b93b-68b721c026ee": {
    "id": "0b4c9322-5024-52dd-b93b-68b721c026ee",
    "displayName": "Daniel Park",
    "username": "danielpark",
    "avatarUrl": "https://i.pravatar.cc/300?u=danielpark",
    "bio": "Senior CS student, hackathon organizer, and the person who always knows which Iribe room is still open.",
    "pronouns": "he/him",
    "major": "Computer Science",
    "classYear": 2025,
    "clubIds": [
      "aaa41ac9-63e0-592f-a177-be36e8b212ee",
      "94dc4785-694a-5b8a-b73d-d6e896187afb",
      "572b2a79-031d-5b9e-b4bb-5a727906def8"
    ],
    "interests": [
      "coding",
      "hackathons",
      "mentorship",
      "systems",
      "community"
    ]
  },
  "3871303c-e94e-56e3-b1ea-57ba9b0bc0c1": {
    "id": "3871303c-e94e-56e3-b1ea-57ba9b0bc0c1",
    "displayName": "Priya Shah",
    "username": "priya_shah",
    "avatarUrl": "https://i.pravatar.cc/300?u=priya_shah",
    "bio": "Bio major balancing lab hours, club leadership, and a permanent search for the best study corner on campus.",
    "pronouns": "she/her",
    "major": "Biology",
    "classYear": 2026,
    "clubIds": [
      "94dc4785-694a-5b8a-b73d-d6e896187afb",
      "93df5013-9ec9-56e2-8f1e-dbbb52ad5feb",
      "2c3160cc-928d-54c2-817c-2abc9ad857bf",
      "189a718a-77c7-592f-b26f-c25f576a21b8"
    ],
    "interests": [
      "wellness",
      "research",
      "service",
      "dance",
      "study-spots"
    ]
  },
  "5a90dcaa-9700-59fb-9cc9-66b19e06e6d6": {
    "id": "5a90dcaa-9700-59fb-9cc9-66b19e06e6d6",
    "displayName": "Marcus Thompson",
    "username": "marcus_t",
    "avatarUrl": "https://i.pravatar.cc/300?u=marcus_t",
    "bio": "Mechanical engineering, early morning runs, and the loudest student-section energy you will ever meet.",
    "pronouns": "he/him",
    "major": "Mechanical Engineering",
    "classYear": 2026,
    "clubIds": [
      "93df5013-9ec9-56e2-8f1e-dbbb52ad5feb",
      "646d7bc1-956c-593b-baec-109a7a9720b6",
      "572b2a79-031d-5b9e-b4bb-5a727906def8"
    ],
    "interests": [
      "fitness",
      "sports",
      "engineering",
      "outdoors",
      "campus-events"
    ]
  },
  "a49d4554-325c-5c88-afaa-ef947f0a115a": {
    "id": "a49d4554-325c-5c88-afaa-ef947f0a115a",
    "displayName": "Maya Patel",
    "username": "maya_p",
    "avatarUrl": "https://i.pravatar.cc/300?u=maya_p",
    "bio": "Policy nerd, service organizer, and the friend who will always send you the registration deadline first.",
    "pronouns": "she/her",
    "major": "Government and Politics",
    "classYear": 2027,
    "clubIds": [
      "2c3160cc-928d-54c2-817c-2abc9ad857bf",
      "189a718a-77c7-592f-b26f-c25f576a21b8",
      "b934a1b0-cf09-5fba-b612-1b8d8ee70570",
      "44f63ee3-2917-5ac3-84f4-0ab9aa8cbe2a"
    ],
    "interests": [
      "service",
      "advocacy",
      "community",
      "culture",
      "leadership"
    ]
  },
  "bf962ba5-980e-5ed4-b080-3ddad5c2e760": {
    "id": "bf962ba5-980e-5ed4-b080-3ddad5c2e760",
    "displayName": "Leena Rao",
    "username": "leena_rao",
    "avatarUrl": "https://i.pravatar.cc/300?u=leena_rao",
    "bio": "Usually somewhere between a pitch deck, a rehearsal, and a coffee run through Stamp.",
    "pronouns": "she/her",
    "major": "Finance",
    "classYear": 2026,
    "clubIds": [
      "0e68c4f2-2b14-505c-972d-dda49fca824a",
      "2c3160cc-928d-54c2-817c-2abc9ad857bf",
      "44f63ee3-2917-5ac3-84f4-0ab9aa8cbe2a"
    ],
    "interests": [
      "startups",
      "music",
      "community",
      "culture",
      "events"
    ]
  },
  "f360a23b-4f3d-566a-959f-ea05849e43ab": {
    "id": "f360a23b-4f3d-566a-959f-ea05849e43ab",
    "displayName": "Ethan Kim",
    "username": "ethan_kim",
    "avatarUrl": "https://i.pravatar.cc/300?u=ethan_kim",
    "bio": "Data science lead who genuinely thinks a clean SQL query can fix at least half of life.",
    "pronouns": "he/him",
    "major": "Data Science",
    "classYear": 2025,
    "clubIds": [
      "aaa41ac9-63e0-592f-a177-be36e8b212ee",
      "94dc4785-694a-5b8a-b73d-d6e896187afb",
      "673363a9-c22b-5446-98ac-37c379aaed6a"
    ],
    "interests": [
      "data",
      "analytics",
      "coding",
      "careers",
      "mentorship"
    ]
  },
  "ca86602c-434a-50de-af39-90312889c45d": {
    "id": "ca86602c-434a-50de-af39-90312889c45d",
    "displayName": "Sofia Alvarez",
    "username": "sofia_alvarez",
    "avatarUrl": "https://i.pravatar.cc/300?u=sofia_alvarez",
    "bio": "Campus storyteller with a camera roll full of sunsets, events, and people being unexpectedly iconic.",
    "pronouns": "she/her",
    "major": "Journalism",
    "classYear": 2027,
    "clubIds": [
      "0e68c4f2-2b14-505c-972d-dda49fca824a",
      "673363a9-c22b-5446-98ac-37c379aaed6a",
      "b934a1b0-cf09-5fba-b612-1b8d8ee70570",
      "44f63ee3-2917-5ac3-84f4-0ab9aa8cbe2a"
    ],
    "interests": [
      "film",
      "storytelling",
      "community",
      "arts",
      "photography"
    ]
  },
  "dceb7801-ef4a-5c0d-8c77-d45c18b15df1": {
    "id": "dceb7801-ef4a-5c0d-8c77-d45c18b15df1",
    "displayName": "Jordan Kim",
    "username": "jordank_umd",
    "avatarUrl": "https://i.pravatar.cc/300?u=jordank_umd",
    "bio": "Outdoors club president, trail planner, and champion of touching grass during midterm season.",
    "pronouns": "they/them",
    "major": "Environmental Science",
    "classYear": 2026,
    "clubIds": [
      "93df5013-9ec9-56e2-8f1e-dbbb52ad5feb",
      "646d7bc1-956c-593b-baec-109a7a9720b6",
      "b934a1b0-cf09-5fba-b612-1b8d8ee70570"
    ],
    "interests": [
      "outdoors",
      "sustainability",
      "community",
      "fitness",
      "travel"
    ]
  },
  "9ffda673-63bb-542b-9b0d-0de86e4557ee": {
    "id": "9ffda673-63bb-542b-9b0d-0de86e4557ee",
    "displayName": "Aaliyah Green",
    "username": "aaliyah_green",
    "avatarUrl": "https://i.pravatar.cc/300?u=aaliyah_green",
    "bio": "Running club captain, wellness advocate, and always trying to convince people that morning movement is worth it.",
    "pronouns": "she/her",
    "major": "Kinesiology",
    "classYear": 2027,
    "clubIds": [
      "93df5013-9ec9-56e2-8f1e-dbbb52ad5feb",
      "189a718a-77c7-592f-b26f-c25f576a21b8",
      "b934a1b0-cf09-5fba-b612-1b8d8ee70570"
    ],
    "interests": [
      "running",
      "wellness",
      "community",
      "sports",
      "service"
    ]
  },
  "7ebd3331-9d3e-5d07-b957-dbb6cb18760f": {
    "id": "7ebd3331-9d3e-5d07-b957-dbb6cb18760f",
    "displayName": "Rahul Mehta",
    "username": "rahulm",
    "avatarUrl": "https://i.pravatar.cc/300?u=rahulm",
    "bio": "Usually carrying a soldering kit, a half-built side project, or both.",
    "pronouns": "he/him",
    "major": "Electrical Engineering",
    "classYear": 2026,
    "clubIds": [
      "aaa41ac9-63e0-592f-a177-be36e8b212ee",
      "94dc4785-694a-5b8a-b73d-d6e896187afb",
      "2c3160cc-928d-54c2-817c-2abc9ad857bf"
    ],
    "interests": [
      "engineering",
      "robotics",
      "coding",
      "culture",
      "maker-space"
    ]
  },
  "3a44d09f-f9ee-5606-8958-3cdb4d945381": {
    "id": "3a44d09f-f9ee-5606-8958-3cdb4d945381",
    "displayName": "Grace Chen",
    "username": "gracechen",
    "avatarUrl": "https://i.pravatar.cc/300?u=gracechen",
    "bio": "Founder-energy all day. Loves thoughtful questions, practical advice, and a room full of ambitious people.",
    "pronouns": "she/her",
    "major": "Finance",
    "classYear": 2025,
    "clubIds": [
      "94dc4785-694a-5b8a-b73d-d6e896187afb",
      "0e68c4f2-2b14-505c-972d-dda49fca824a",
      "189a718a-77c7-592f-b26f-c25f576a21b8"
    ],
    "interests": [
      "startups",
      "careers",
      "networking",
      "analytics",
      "community"
    ]
  },
  "c0957686-8810-518a-8a56-df06c240f785": {
    "id": "c0957686-8810-518a-8a56-df06c240f785",
    "displayName": "Omar Hassan",
    "username": "omarh",
    "avatarUrl": "https://i.pravatar.cc/300?u=omarh",
    "bio": "Creative technologist who likes weird interfaces, clean code, and events with a strong vibe.",
    "pronouns": "he/him",
    "major": "Computer Science",
    "classYear": 2026,
    "clubIds": [
      "aaa41ac9-63e0-592f-a177-be36e8b212ee",
      "0e68c4f2-2b14-505c-972d-dda49fca824a",
      "673363a9-c22b-5446-98ac-37c379aaed6a",
      "44f63ee3-2917-5ac3-84f4-0ab9aa8cbe2a"
    ],
    "interests": [
      "creative-tech",
      "coding",
      "design",
      "film",
      "startups"
    ]
  },
  "7e1d57eb-5dc7-58f1-8fe1-a165779a5ddd": {
    "id": "7e1d57eb-5dc7-58f1-8fe1-a165779a5ddd",
    "displayName": "Hannah Lee",
    "username": "hannah_lee",
    "avatarUrl": "https://i.pravatar.cc/300?u=hannah_lee",
    "bio": "KSA president, outdoors regular, and forever making spreadsheets for things that do not need spreadsheets.",
    "pronouns": "she/her",
    "major": "Public Health Science",
    "classYear": 2027,
    "clubIds": [
      "93df5013-9ec9-56e2-8f1e-dbbb52ad5feb",
      "2c3160cc-928d-54c2-817c-2abc9ad857bf",
      "646d7bc1-956c-593b-baec-109a7a9720b6",
      "572b2a79-031d-5b9e-b4bb-5a727906def8"
    ],
    "interests": [
      "culture",
      "community",
      "wellness",
      "outdoors",
      "events"
    ]
  },
  "9e36e2f6-f994-573b-b8f8-5e7ee6c3a6f4": {
    "id": "9e36e2f6-f994-573b-b8f8-5e7ee6c3a6f4",
    "displayName": "David Okafor",
    "username": "davidok",
    "avatarUrl": "https://i.pravatar.cc/300?u=davidok",
    "bio": "Hardware + software + service hours. Finds a way to help before anyone asks.",
    "pronouns": "he/him",
    "major": "Computer Engineering",
    "classYear": 2025,
    "clubIds": [
      "aaa41ac9-63e0-592f-a177-be36e8b212ee",
      "94dc4785-694a-5b8a-b73d-d6e896187afb",
      "b934a1b0-cf09-5fba-b612-1b8d8ee70570"
    ],
    "interests": [
      "engineering",
      "service",
      "coding",
      "mentorship",
      "community"
    ]
  },
  "af45b9b4-fb14-5b6d-bbcd-5ffcc64bf110": {
    "id": "af45b9b4-fb14-5b6d-bbcd-5ffcc64bf110",
    "displayName": "Chloe Nguyen",
    "username": "chloecreates",
    "avatarUrl": "https://i.pravatar.cc/300?u=chloecreates",
    "bio": "Creative Coding Collective president, poster-maker, and curator of niche but excellent campus playlists.",
    "pronouns": "she/her",
    "major": "Studio Art",
    "classYear": 2026,
    "clubIds": [
      "2c3160cc-928d-54c2-817c-2abc9ad857bf",
      "572b2a79-031d-5b9e-b4bb-5a727906def8",
      "673363a9-c22b-5446-98ac-37c379aaed6a",
      "44f63ee3-2917-5ac3-84f4-0ab9aa8cbe2a"
    ],
    "interests": [
      "arts",
      "creative-tech",
      "design",
      "film",
      "culture"
    ]
  },
  "1941e5a9-753c-5055-b24d-ff4990dd714e": {
    "id": "1941e5a9-753c-5055-b24d-ff4990dd714e",
    "displayName": "Aaron Feldman",
    "username": "aaronfeldman",
    "avatarUrl": "https://i.pravatar.cc/300?u=aaronfeldman",
    "bio": "Film Society lead programmer and enthusiastic defender of late-night screenings with strong discussion energy.",
    "pronouns": "he/him",
    "major": "English",
    "classYear": 2027,
    "clubIds": [
      "646d7bc1-956c-593b-baec-109a7a9720b6",
      "673363a9-c22b-5446-98ac-37c379aaed6a",
      "44f63ee3-2917-5ac3-84f4-0ab9aa8cbe2a"
    ],
    "interests": [
      "film",
      "arts",
      "storytelling",
      "community",
      "outdoors"
    ]
  },
  "77de58eb-8b78-5ad5-b5bb-a310726ca240": {
    "id": "77de58eb-8b78-5ad5-b5bb-a310726ca240",
    "displayName": "Sana Mir",
    "username": "sana_mir",
    "avatarUrl": "https://i.pravatar.cc/300?u=sana_mir",
    "bio": "Bhangra captain with equal love for stage lights, careful planning, and a solid post-event debrief.",
    "pronouns": "she/her",
    "major": "Neuroscience",
    "classYear": 2026,
    "clubIds": [
      "94dc4785-694a-5b8a-b73d-d6e896187afb",
      "2c3160cc-928d-54c2-817c-2abc9ad857bf",
      "572b2a79-031d-5b9e-b4bb-5a727906def8"
    ],
    "interests": [
      "dance",
      "culture",
      "community",
      "wellness",
      "data"
    ]
  },
  "ee83f346-1b89-59ad-83b3-5ac6a979327e": {
    "id": "ee83f346-1b89-59ad-83b3-5ac6a979327e",
    "displayName": "Tyler Bennett",
    "username": "tyler_bennett",
    "avatarUrl": "https://i.pravatar.cc/300?u=tyler_bennett",
    "bio": "Shows up for founder talks, club screenings, and basically any event with a good crowd and better snacks.",
    "pronouns": "he/him",
    "major": "Economics",
    "classYear": 2025,
    "clubIds": [
      "0e68c4f2-2b14-505c-972d-dda49fca824a",
      "93df5013-9ec9-56e2-8f1e-dbbb52ad5feb",
      "572b2a79-031d-5b9e-b4bb-5a727906def8",
      "44f63ee3-2917-5ac3-84f4-0ab9aa8cbe2a"
    ],
    "interests": [
      "careers",
      "community",
      "culture",
      "film",
      "running"
    ]
  }
} as Record<string, SocialProfile>;

export const initialFollowingByUser = {
  "6667ca7e-5d07-5fd3-ab93-276110c38063": [
    "0b4c9322-5024-52dd-b93b-68b721c026ee",
    "f360a23b-4f3d-566a-959f-ea05849e43ab",
    "77de58eb-8b78-5ad5-b5bb-a310726ca240",
    "3a44d09f-f9ee-5606-8958-3cdb4d945381",
    "bf962ba5-980e-5ed4-b080-3ddad5c2e760"
  ],
  "79af4eed-7d3d-5729-8963-46e04646d23b": [
    "0b4c9322-5024-52dd-b93b-68b721c026ee",
    "6667ca7e-5d07-5fd3-ab93-276110c38063",
    "f360a23b-4f3d-566a-959f-ea05849e43ab",
    "3a44d09f-f9ee-5606-8958-3cdb4d945381"
  ],
  "0b4c9322-5024-52dd-b93b-68b721c026ee": [
    "6667ca7e-5d07-5fd3-ab93-276110c38063",
    "f360a23b-4f3d-566a-959f-ea05849e43ab",
    "77de58eb-8b78-5ad5-b5bb-a310726ca240"
  ],
  "3871303c-e94e-56e3-b1ea-57ba9b0bc0c1": [
    "f360a23b-4f3d-566a-959f-ea05849e43ab",
    "77de58eb-8b78-5ad5-b5bb-a310726ca240",
    "9ffda673-63bb-542b-9b0d-0de86e4557ee",
    "5a90dcaa-9700-59fb-9cc9-66b19e06e6d6"
  ],
  "5a90dcaa-9700-59fb-9cc9-66b19e06e6d6": [
    "9ffda673-63bb-542b-9b0d-0de86e4557ee",
    "7e1d57eb-5dc7-58f1-8fe1-a165779a5ddd",
    "dceb7801-ef4a-5c0d-8c77-d45c18b15df1"
  ],
  "a49d4554-325c-5c88-afaa-ef947f0a115a": [
    "77de58eb-8b78-5ad5-b5bb-a310726ca240",
    "bf962ba5-980e-5ed4-b080-3ddad5c2e760",
    "3871303c-e94e-56e3-b1ea-57ba9b0bc0c1",
    "79af4eed-7d3d-5729-8963-46e04646d23b"
  ],
  "bf962ba5-980e-5ed4-b080-3ddad5c2e760": [
    "3a44d09f-f9ee-5606-8958-3cdb4d945381",
    "6667ca7e-5d07-5fd3-ab93-276110c38063",
    "77de58eb-8b78-5ad5-b5bb-a310726ca240"
  ],
  "f360a23b-4f3d-566a-959f-ea05849e43ab": [
    "0b4c9322-5024-52dd-b93b-68b721c026ee",
    "6667ca7e-5d07-5fd3-ab93-276110c38063",
    "77de58eb-8b78-5ad5-b5bb-a310726ca240"
  ],
  "ca86602c-434a-50de-af39-90312889c45d": [
    "3a44d09f-f9ee-5606-8958-3cdb4d945381",
    "6667ca7e-5d07-5fd3-ab93-276110c38063",
    "bf962ba5-980e-5ed4-b080-3ddad5c2e760",
    "af45b9b4-fb14-5b6d-bbcd-5ffcc64bf110"
  ],
  "dceb7801-ef4a-5c0d-8c77-d45c18b15df1": [
    "9ffda673-63bb-542b-9b0d-0de86e4557ee",
    "5a90dcaa-9700-59fb-9cc9-66b19e06e6d6",
    "7e1d57eb-5dc7-58f1-8fe1-a165779a5ddd"
  ],
  "9ffda673-63bb-542b-9b0d-0de86e4557ee": [
    "5a90dcaa-9700-59fb-9cc9-66b19e06e6d6",
    "7e1d57eb-5dc7-58f1-8fe1-a165779a5ddd",
    "3871303c-e94e-56e3-b1ea-57ba9b0bc0c1"
  ],
  "7ebd3331-9d3e-5d07-b957-dbb6cb18760f": [
    "0b4c9322-5024-52dd-b93b-68b721c026ee",
    "6667ca7e-5d07-5fd3-ab93-276110c38063",
    "f360a23b-4f3d-566a-959f-ea05849e43ab"
  ],
  "3a44d09f-f9ee-5606-8958-3cdb4d945381": [
    "f360a23b-4f3d-566a-959f-ea05849e43ab",
    "77de58eb-8b78-5ad5-b5bb-a310726ca240",
    "6667ca7e-5d07-5fd3-ab93-276110c38063"
  ],
  "c0957686-8810-518a-8a56-df06c240f785": [
    "0b4c9322-5024-52dd-b93b-68b721c026ee",
    "6667ca7e-5d07-5fd3-ab93-276110c38063",
    "f360a23b-4f3d-566a-959f-ea05849e43ab",
    "3a44d09f-f9ee-5606-8958-3cdb4d945381"
  ],
  "7e1d57eb-5dc7-58f1-8fe1-a165779a5ddd": [
    "9ffda673-63bb-542b-9b0d-0de86e4557ee",
    "5a90dcaa-9700-59fb-9cc9-66b19e06e6d6",
    "77de58eb-8b78-5ad5-b5bb-a310726ca240",
    "bf962ba5-980e-5ed4-b080-3ddad5c2e760"
  ],
  "9e36e2f6-f994-573b-b8f8-5e7ee6c3a6f4": [
    "0b4c9322-5024-52dd-b93b-68b721c026ee",
    "6667ca7e-5d07-5fd3-ab93-276110c38063",
    "f360a23b-4f3d-566a-959f-ea05849e43ab"
  ],
  "af45b9b4-fb14-5b6d-bbcd-5ffcc64bf110": [
    "77de58eb-8b78-5ad5-b5bb-a310726ca240",
    "bf962ba5-980e-5ed4-b080-3ddad5c2e760",
    "7e1d57eb-5dc7-58f1-8fe1-a165779a5ddd",
    "0b4c9322-5024-52dd-b93b-68b721c026ee"
  ],
  "1941e5a9-753c-5055-b24d-ff4990dd714e": [
    "dceb7801-ef4a-5c0d-8c77-d45c18b15df1",
    "7e1d57eb-5dc7-58f1-8fe1-a165779a5ddd",
    "af45b9b4-fb14-5b6d-bbcd-5ffcc64bf110"
  ],
  "77de58eb-8b78-5ad5-b5bb-a310726ca240": [
    "f360a23b-4f3d-566a-959f-ea05849e43ab",
    "bf962ba5-980e-5ed4-b080-3ddad5c2e760",
    "7e1d57eb-5dc7-58f1-8fe1-a165779a5ddd"
  ],
  "ee83f346-1b89-59ad-83b3-5ac6a979327e": [
    "3a44d09f-f9ee-5606-8958-3cdb4d945381",
    "6667ca7e-5d07-5fd3-ab93-276110c38063",
    "bf962ba5-980e-5ed4-b080-3ddad5c2e760",
    "9ffda673-63bb-542b-9b0d-0de86e4557ee"
  ]
} as Record<string, string[]>;

export const clubNameById = mockClubs.reduce<Record<string, string>>((accumulator, club) => {
  accumulator[club.id] = club.name;
  return accumulator;
}, {});
