import { ScheduledProgram, AudioTrack, SongRequest, ChatMessage, StationSettings } from '../types/radio';

// Use the generated assets
export const IMAGES = {
  console: '/src/assets/images/radio_studio_console_1791833776471.jpg',
  albumArt: '/src/assets/images/radio_album_art_1791833789333.jpg',
  rjAvatar: '/src/assets/images/radio_rj_avatar_1791833806942.jpg',
  banner: '/src/assets/images/radio_acoustic_banner_1791833819020.jpg',
};

export const INITIAL_SCHEDULES: ScheduledProgram[] = [
  {
    id: 'prog-1',
    title: 'সকালের সুর ও সুপ্রভাত আলাপন',
    host: 'আরজে অনন্যা',
    description: 'ভোরের নির্মল হাওয়া আর রাগাশ্রয়ী সুরের সাথে দিন শুরুর স্নিগ্ধ অনুভূতি। ক্লাসিক্যাল ও রবীন্দ্রসঙ্গীতের সমন্বিত আয়োজন।',
    category: 'সঙ্গীত',
    startTime: '06:00',
    endTime: '09:00',
    daysOfWeek: [0, 1, 2, 3, 4, 5, 6],
    type: 'recorded',
    trackId: 'track-morning',
    coverImage: IMAGES.albumArt,
  },
  {
    id: 'prog-2',
    title: 'ডি-লিকন সাহিত্য বাসর ও কবিতা',
    host: 'ড. ফারহানা চৌধুরী',
    description: 'বাঙালির চিরায়ত ও আধুনিক সাহিত্য, কবিতা আবৃত্তি, গ্রন্থালোচনা এবং বিশেষ পাঠ।',
    category: 'সাহিত্য ও আবৃত্তি',
    startTime: '09:00',
    endTime: '12:00',
    daysOfWeek: [1, 2, 3, 4, 5],
    type: 'recorded',
    trackId: 'track-lit',
    coverImage: IMAGES.banner,
  },
  {
    id: 'prog-3',
    title: 'দুপুরের সংবাদ ও সমসাময়িক কথামালা',
    host: 'তানভীর আহমেদ',
    description: 'দেশ-বিদেশের তাজা সংবাদ, বিশ্লেষণী মতামত ও লাইভ স্টুডিও আলোচনা।',
    category: 'খবর ও কারেন্ট অ্যাফেয়ার্স',
    startTime: '12:00',
    endTime: '14:00',
    daysOfWeek: [0, 1, 2, 3, 4, 5, 6],
    type: 'live',
    trackId: 'track-news',
    coverImage: IMAGES.console,
  },
  {
    id: 'prog-4',
    title: 'সন্ধ্যাতারা সঙ্গীত আসর',
    host: 'আরজে শায়ান',
    description: 'আধুনিক গান, ব্যান্ড মিউজিক ও নস্টালজিক সুরের মায়ায় সাজানো সন্ধ্যার অনন্য আসর।',
    category: 'সঙ্গীত',
    startTime: '17:00',
    endTime: '20:00',
    daysOfWeek: [0, 1, 2, 3, 4, 5, 6],
    type: 'recorded',
    trackId: 'track-evening',
    coverImage: IMAGES.albumArt,
  },
  {
    id: 'prog-5',
    title: 'লাইভ স্টুডিও: শ্রোতার অনুরোধ ও কথন',
    host: 'আরজে মৈত্রেয়ী',
    description: 'শ্রোতাদের সরাসরি কল, গানের অনুরোধ, প্রিয় মানুষদের বার্তা ও আনন্দঘন আড্ডা।',
    category: 'টকশো ও আড্ডা',
    startTime: '20:00',
    endTime: '23:00',
    daysOfWeek: [0, 1, 2, 3, 4, 5, 6],
    type: 'live',
    trackId: 'track-live-request',
    coverImage: IMAGES.rjAvatar,
  },
  {
    id: 'prog-6',
    title: 'রাতজাগা আলাপন ও নিস্তব্ধ সুর',
    host: 'আরজে নীরব',
    description: 'গভীর রাতের নির্জনতায় শান্ত সুর, জীবনের গল্প ও গভীর অনুভূতির সুরলহরী।',
    category: 'বিশেষ অনুষ্ঠান',
    startTime: '23:00',
    endTime: '02:00',
    daysOfWeek: [0, 1, 2, 3, 4, 5, 6],
    type: 'recorded',
    trackId: 'track-night',
    coverImage: IMAGES.banner,
  },
];

export const INITIAL_TRACKS: AudioTrack[] = [
  {
    id: 'track-morning',
    title: 'প্রভাতী সুরলহরী (রাগ ভৈরব ও বাঁশি)',
    artist: 'ডি-লিকন স্টুডিও অর্কেস্ট্রা',
    duration: 1800,
    category: 'শাস্ত্রীয় সঙ্গীত',
    isSynthesized: true,
    synthTheme: 'morning_raga',
    coverArt: IMAGES.albumArt,
    description: 'শান্ত স্নিগ্ধ প্রভাতী রাগ ভৈরব ও মধুর বংশীধ্বনি।'
  },
  {
    id: 'track-evening',
    title: 'সন্ধ্যা রাগ ও সুরের ধারা',
    artist: 'রেডিও ডি-লিকন সঙ্গীত দল',
    duration: 2100,
    category: 'আধুনিক ও রাগাশ্রয়ী',
    isSynthesized: true,
    synthTheme: 'evening_melody',
    coverArt: IMAGES.albumArt,
    description: 'সন্ধ্যাতারা সঙ্গীত আসরের জন্য নির্বাচিত স্নিগ্ধ সুর।'
  },
  {
    id: 'track-night',
    title: 'নিশীথ রাগ ও গভীর নিস্তব্ধতা',
    artist: 'অ্যাকোস্টিক মেলোডি কালেক্টিভ',
    duration: 2400,
    category: 'অ্যাম্বিয়েন্ট ও ধ্যান',
    isSynthesized: true,
    synthTheme: 'night_ambient',
    coverArt: IMAGES.banner,
    description: 'রাতজাগা মানুষের সঙ্গ দিতে প্রশান্তিময় সুর।'
  },
  {
    id: 'track-news',
    title: 'স্টুডিও নিউজ বুলেটিন আবহ',
    artist: 'ডি-লিকন নিউজ ডেস্ক',
    duration: 1200,
    category: 'সংবাদ ও বিশেষ',
    isSynthesized: true,
    synthTheme: 'news_bulletin',
    coverArt: IMAGES.console,
    description: 'ঘণ্টার সেরা খবর ও সমসাময়িক আলোচনা ব্যাকগ্রাউন্ড।'
  },
  {
    id: 'track-lit',
    title: 'কবিতার অন্তরালে (কথা ও সেতার)',
    artist: 'সাহিত্য পরিষদ ও ডি-লিকন',
    duration: 1500,
    category: 'আবৃত্তি ও কথা',
    isSynthesized: true,
    synthTheme: 'afternoon_talk',
    coverArt: IMAGES.banner,
    description: 'বাংলা সাহিত্যের নির্বাচিত কবিতা ও কথামালা।'
  },
  {
    id: 'track-live-request',
    title: 'শ্রোতাদের পছন্দের গানের ডালি',
    artist: 'রেডিও ডি-লিকন লাইভ বাসর',
    duration: 1800,
    category: 'শ্রোতার পছন্দ',
    isSynthesized: true,
    synthTheme: 'evening_melody',
    coverArt: IMAGES.rjAvatar,
    description: 'শ্রোতাদের পাঠানো অনুরোধের সেরা গানের সম্ভার।'
  }
];

export const INITIAL_REQUESTS: SongRequest[] = [
  {
    id: 'req-1',
    listenerName: 'সাব্বির হোসেন',
    location: 'ঢাকা',
    requestedSong: 'আমি বাংলায় গান গাই',
    artist: 'প্রতুল মুখোপাধ্যায়',
    message: 'আমার প্রিয় রেডিও ডি-লিকনকে অনেক শুভেচ্ছা। প্রবাসে থাকা বন্ধুদের জন্য এই গানটি বাজাবেন প্লিজ!',
    timestamp: '১০ মিনিট আগে',
    status: 'approved',
  },
  {
    id: 'req-2',
    listenerName: 'নুসরাত জাহান',
    location: 'চট্টগ্রাম',
    requestedSong: 'তুমি রবে নীরবে',
    artist: 'রবীন্দ্রসঙ্গীত',
    message: 'বৃষ্টিভেজা বিকেলে এই গানটি শুনতে দারুণ লাগবে। আরজে অনন্যার উপস্থাপনা দারুণ!',
    timestamp: '২৫ মিনিট আগে',
    status: 'pending',
  },
  {
    id: 'req-3',
    listenerName: 'আসিফ মাহমুদ',
    location: 'সিলেট',
    requestedSong: 'কফি হাউসের সেই আড্ডাটা',
    artist: 'মান্না দে',
    message: 'পুরোনো বন্ধুদের স্মরণ করে গানটি শুনতে চাই। রেডিও ডি-লিকনের সম্প্রচার স্পষ্ট ও চমৎকার!',
    timestamp: '১ ঘণ্টা আগে',
    status: 'played',
  },
];

export const INITIAL_CHAT_MESSAGES: ChatMessage[] = [
  {
    id: 'chat-1',
    sender: 'রেডিও ডি-লিকন স্টুডিও',
    text: 'স্বাগতম রেডিও ডি-লিকনে! সুরের মেলবন্ধনে আমরা আছি আপনার পাশে। নিজের অনুরোধ পাঠাতে পারেন উপরের "অনুরোধ" বাটন থেকে।',
    timestamp: '১২:৩০ PM',
    isHost: true,
    isPinned: true,
    avatarColor: 'bg-amber-500',
  },
  {
    id: 'chat-2',
    sender: 'তানিয়া রশীদ',
    text: 'সাউন্ড কোয়ালিটি অনেক ক্রিস্টাল ক্লিয়ার! লাইভ সম্প্রচার শুনছি।',
    timestamp: '১২:৩৪ PM',
    avatarColor: 'bg-emerald-500',
  },
  {
    id: 'chat-3',
    sender: 'রাকিবুল হাসান',
    text: 'শিডিউল দেখে খুব ভালো লাগলো। সন্ধ্যার আধুনিক গানের আসরটির অপেক্ষায় আছি!',
    timestamp: '১২:৩৬ PM',
    avatarColor: 'bg-blue-500',
  },
];

// Helper to determine active program based on current time
export function getCurrentProgramFromSchedule(schedules: ScheduledProgram[], forcedTime?: string): ScheduledProgram {
  const now = new Date();
  const currentDay = now.getDay();
  let currentTime = forcedTime;

  if (!currentTime) {
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    currentTime = `${hours}:${minutes}`;
  }

  // Find matching program for today
  const matched = schedules.find((prog) => {
    if (!prog.daysOfWeek.includes(currentDay)) return false;
    if (prog.startTime <= prog.endTime) {
      return currentTime! >= prog.startTime && currentTime! < prog.endTime;
    } else {
      // Overnight program (e.g. 23:00 to 02:00)
      return currentTime! >= prog.startTime || currentTime! < prog.endTime;
    }
  });

  // Fallback if no exact time match: return first or default
  return matched || schedules[0];
}

// Helper to get upcoming programs
export function getUpcomingPrograms(schedules: ScheduledProgram[], currentId: string): ScheduledProgram[] {
  const currentIndex = schedules.findIndex((p) => p.id === currentId);
  if (currentIndex === -1) return schedules.slice(1, 4);

  const upcoming: ScheduledProgram[] = [];
  for (let i = 1; i < schedules.length; i++) {
    const nextIndex = (currentIndex + i) % schedules.length;
    upcoming.push(schedules[nextIndex]);
    if (upcoming.length >= 4) break;
  }
  return upcoming;
}

// LocalStorage Persistence helpers
const STORAGE_KEYS = {
  SCHEDULES: 'radio_dleacon_schedules',
  TRACKS: 'radio_dleacon_tracks',
  REQUESTS: 'radio_dleacon_requests',
  CHAT: 'radio_dleacon_chat',
};

export function loadSavedSchedules(): ScheduledProgram[] {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.SCHEDULES);
    if (data) return JSON.parse(data);
  } catch {
    // fallback
  }
  return INITIAL_SCHEDULES;
}

export function saveSchedules(schedules: ScheduledProgram[]) {
  try {
    localStorage.setItem(STORAGE_KEYS.SCHEDULES, JSON.stringify(schedules));
  } catch {
    // ignore
  }
}

export function loadSavedTracks(): AudioTrack[] {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.TRACKS);
    if (data) return JSON.parse(data);
  } catch {
    // fallback
  }
  return INITIAL_TRACKS;
}

export function saveTracks(tracks: AudioTrack[]) {
  try {
    localStorage.setItem(STORAGE_KEYS.TRACKS, JSON.stringify(tracks));
  } catch {
    // ignore
  }
}

export function loadSavedRequests(): SongRequest[] {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.REQUESTS);
    if (data) return JSON.parse(data);
  } catch {
    // fallback
  }
  return INITIAL_REQUESTS;
}

export function saveRequests(requests: SongRequest[]) {
  try {
    localStorage.setItem(STORAGE_KEYS.REQUESTS, JSON.stringify(requests));
  } catch {
    // ignore
  }
}

export const DEFAULT_STATION_SETTINGS: StationSettings = {
  stationName: 'রেডিও ডি-লিকন',
  tagline: 'সুর ও কথামালায় জীবনের রঙ',
  frequency: 'FM 98.4 / HD Stream',
  announcementTicker: 'রেডিও ডি-লিকনে আপনাকে স্বাগতম! ২৪ ঘণ্টা নিরবচ্ছিন্ন বাংলা গান, আবৃত্তি ও তথ্যবহুল অনুষ্ঠান শুনতে সঙ্গে থাকুন।',
  isTickerActive: true,
  autoPilotEnabled: false,
  defaultBitrate: '320k',
  contactEmail: 'contact@radiodleacon.com',
  contactPhone: '+880 1700-000000',
  websiteUrl: 'https://radiodleacon.com',
  customStreamUrl: '',
};

const SETTINGS_KEY = 'radio_dleacon_settings';

export function loadSavedStationSettings(): StationSettings {
  try {
    const data = localStorage.getItem(SETTINGS_KEY);
    if (data) {
      return { ...DEFAULT_STATION_SETTINGS, ...JSON.parse(data) };
    }
  } catch {
    // fallback
  }
  return DEFAULT_STATION_SETTINGS;
}

export function saveStationSettings(settings: StationSettings) {
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  } catch {
    // ignore
  }
}

const SESSION_QUEUE_KEY = 'radio_dleacon_session_queue';
const AUTOPILOT_ACTIVE_KEY = 'radio_dleacon_autopilot_active';

export function saveActiveSessionQueue(trackIds: string[], currentIndex: number) {
  try {
    localStorage.setItem(
      SESSION_QUEUE_KEY,
      JSON.stringify({ trackIds, currentIndex, timestamp: Date.now() })
    );
  } catch {
    // ignore
  }
}

export function loadActiveSessionQueue(): { trackIds: string[]; currentIndex: number } | null {
  try {
    const raw = localStorage.getItem(SESSION_QUEUE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed.trackIds) && parsed.trackIds.length > 0) {
        return {
          trackIds: parsed.trackIds,
          currentIndex: typeof parsed.currentIndex === 'number' ? parsed.currentIndex : 0,
        };
      }
    }
  } catch {
    // ignore
  }
  return null;
}

export function saveAutoPilotState(isActive: boolean) {
  try {
    localStorage.setItem(AUTOPILOT_ACTIVE_KEY, JSON.stringify(isActive));
  } catch {
    // ignore
  }
}

export function loadAutoPilotState(): boolean {
  try {
    const raw = localStorage.getItem(AUTOPILOT_ACTIVE_KEY);
    if (raw) return JSON.parse(raw) === true;
  } catch {
    // ignore
  }
  return false;
}

