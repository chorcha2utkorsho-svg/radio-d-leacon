export type BroadcastType = 'live' | 'recorded';

export type ProgramCategory =
  | 'সঙ্গীত'
  | 'সাহিত্য ও আবৃত্তি'
  | 'খবর ও কারেন্ট অ্যাফেয়ার্স'
  | 'টকশো ও আড্ডা'
  | 'বিশেষ অনুষ্ঠান'
  | 'লোকগীতি ও ঐতিহ্য'
  | 'ধ্রুপদী ও শাস্ত্রীয়'
  | 'বিনোদন ও নাটক'
  | 'জিয়ল ও জিংগল';

export interface StationSettings {
  stationName: string;
  tagline: string;
  frequency: string;
  announcementTicker: string;
  isTickerActive: boolean;
  autoPilotEnabled: boolean;
  defaultBitrate: '128k' | '320k' | 'lossless';
  contactEmail: string;
  contactPhone: string;
  websiteUrl: string;
}

export interface ScheduledProgram {
  id: string;
  title: string;
  host: string;
  description: string;
  category: ProgramCategory | string;
  startTime: string; // "06:00" (24h)
  endTime: string;   // "08:00" (24h)
  daysOfWeek: number[]; // 0=Sun, 1=Mon, ..., 6=Sat
  type: BroadcastType;
  trackId?: string;
  playlistTrackIds?: string[]; // IDs of multiple tracks in this session
  coverImage?: string;
  isActiveNow?: boolean;
}

export interface AudioTrack {
  id: string;
  title: string;
  artist: string;
  duration: number; // in seconds
  category: string;
  audioUrl?: string; // blob URL, synthesized, or external
  isUploaded?: boolean;
  isSynthesized?: boolean;
  synthTheme?: 'morning_raga' | 'afternoon_talk' | 'evening_melody' | 'night_ambient' | 'news_bulletin' | 'jingle';
  coverArt?: string;
  description?: string;
  showId?: string;       // Linked show / session ID
  showTitle?: string;    // Name of the session/show (অনুষ্ঠানের নাম)
  trackOrder?: number;   // Position within the session playlist
  broadcastType?: BroadcastType; // 'live' | 'recorded'
  uploadedAt?: string;   // date string
  fileSize?: number;     // in bytes
}

export interface SongRequest {
  id: string;
  listenerName: string;
  location: string;
  requestedSong: string;
  artist: string;
  message: string;
  timestamp: string;
  status: 'pending' | 'approved' | 'played';
}

export interface ChatMessage {
  id: string;
  sender: string;
  text: string;
  timestamp: string;
  isHost?: boolean;
  isPinned?: boolean;
  avatarColor?: string;
}

export interface SoundEffect {
  id: string;
  name: string;
  iconName: string;
  type: 'chime' | 'applause' | 'jingle' | 'station_id' | 'sweep' | 'gong';
}

export interface BroadcastState {
  isOnAir: boolean;
  isLiveMicActive: boolean;
  currentProgram: ScheduledProgram | null;
  currentTrack: AudioTrack | null;
  broadcastMode: BroadcastType;
  listenerCount: number;
  micGain: number; // 0 to 1
  musicVolume: number; // 0 to 1
  autoDucking: boolean; // lowers music when mic is speaking
  streamBitrate: '128k' | '320k' | 'lossless';
}
