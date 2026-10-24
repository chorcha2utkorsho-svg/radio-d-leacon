import { ScheduledProgram } from '../types/radio';

export interface ListenerNotificationSettings {
  soundEnabled: boolean;
  browserNotificationsEnabled: boolean;
  notifyAllPrograms: boolean; // if false, only notify for subscribedProgramIds
  subscribedProgramIds: string[];
}

export interface ActiveAlertInfo {
  key: string;
  program: ScheduledProgram;
  secondsUntilStart: number;
  formattedTimeRemaining: string;
  isTest?: boolean;
}

const STORAGE_KEYS = {
  SETTINGS: 'radio_dleacon_notification_settings',
  DISMISSED_ALERTS: 'radio_dleacon_dismissed_alerts',
};

export const DEFAULT_NOTIFICATION_SETTINGS: ListenerNotificationSettings = {
  soundEnabled: true,
  browserNotificationsEnabled: false,
  notifyAllPrograms: true, // Default to true so listeners get 5-min alerts without having to manually find and opt into each
  subscribedProgramIds: [],
};

// Bengali numeral conversion helper
export function toBengaliNumerals(input: string | number): string {
  const bnDigits = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
  return String(input).replace(/[0-9]/g, (w) => bnDigits[parseInt(w, 10)]);
}

// Convert seconds into human-readable Bengali countdown
export function formatSecondsToCountdown(seconds: number): string {
  if (seconds <= 0) return 'এখনই শুরু হচ্ছে!';
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  if (mins === 0) {
    return `${toBengaliNumerals(secs)} সেকেন্ড বাকি`;
  }
  return `${toBengaliNumerals(mins)} মিনিট ${toBengaliNumerals(secs.toString().padStart(2, '0'))} সেকেন্ড বাকি`;
}

// Format MM:SS for compact digital display
export function formatCompactCountdown(seconds: number): string {
  if (seconds <= 0) return '০০:০০';
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  const mm = String(mins).padStart(2, '0');
  const ss = String(secs).padStart(2, '0');
  return `${toBengaliNumerals(mm)}:${toBengaliNumerals(ss)}`;
}

// Web Audio API FM-Station Melody Chime
let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
  if (!AudioContextClass) return null;
  if (!audioCtx) {
    audioCtx = new AudioContextClass();
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume().catch(() => {});
  }
  return audioCtx;
}

/**
 * Plays a pleasant three-tone harmonic chime (C5 - E5 - G5)
 * reminiscent of public radio broadcast time-signal chimes.
 */
export function playAlertChime(): void {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const chimeFrequencies = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
    const chordGains = [0.15, 0.14, 0.16, 0.12];

    chimeFrequencies.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + idx * 0.12);

      // Attack and exponential decay envelope
      const startTime = now + idx * 0.12;
      const duration = 0.8;

      gain.gain.setValueAtTime(0.0001, startTime);
      gain.gain.exponentialRampToValueAtTime(chordGains[idx], startTime + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(startTime);
      osc.stop(startTime + duration + 0.05);
    });
  } catch (err) {
    console.warn('Unable to play alert chime:', err);
  }
}

// Request Browser Web Notifications Permission
export async function requestBrowserNotificationPermission(): Promise<'granted' | 'denied' | 'default'> {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return 'denied';
  }
  try {
    const result = await Notification.requestPermission();
    return result;
  } catch (err) {
    console.warn('Notification permission error:', err);
    return 'denied';
  }
}

// Send native browser notification
export function sendBrowserNotification(program: ScheduledProgram, timeRemainingText?: string): void {
  if (typeof window === 'undefined' || !('Notification' in window)) return;
  if (Notification.permission !== 'granted') return;

  try {
    const text = timeRemainingText || '৫ মিনিট পর শুরু হচ্ছে!';
    new Notification('রেডিও ডি-লিকন: অনুষ্ঠান সতর্কবার্তা 📻', {
      body: `"${program.title}" (${program.host}) ${text} এখনই টিউন করুন!`,
      icon: '/src/assets/images/radio_studio_console_1791833776471.jpg',
      tag: `radio-alert-${program.id}`,
    });
  } catch (err) {
    console.warn('Browser notification failed:', err);
  }
}

// Storage helpers
export function loadNotificationSettings(): ListenerNotificationSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.SETTINGS);
    if (raw) {
      return { ...DEFAULT_NOTIFICATION_SETTINGS, ...JSON.parse(raw) };
    }
  } catch {
    // fallback
  }
  return DEFAULT_NOTIFICATION_SETTINGS;
}

export function saveNotificationSettings(settings: ListenerNotificationSettings): void {
  try {
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
  } catch {
    // ignore
  }
}

// Dismissed alerts tracking to avoid re-alerting continuously in the same 5-minute window
export function getDismissedAlerts(): Record<string, number> {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.DISMISSED_ALERTS);
    if (raw) return JSON.parse(raw);
  } catch {
    // ignore
  }
  return {};
}

export function dismissAlertKey(alertKey: string): void {
  try {
    const map = getDismissedAlerts();
    map[alertKey] = Date.now();
    localStorage.setItem(STORAGE_KEYS.DISMISSED_ALERTS, JSON.stringify(map));
  } catch {
    // ignore
  }
}

export function isAlertDismissed(alertKey: string): boolean {
  const map = getDismissedAlerts();
  const dismissedTime = map[alertKey];
  if (!dismissedTime) return false;
  // Expire dismissal after 15 minutes
  if (Date.now() - dismissedTime > 15 * 60 * 1000) {
    return false;
  }
  return true;
}

/**
 * Calculates how many seconds until a scheduled program starts today.
 * Returns negative if program has already started or ended.
 */
export function getSecondsUntilProgramStart(program: ScheduledProgram, referenceDate: Date = new Date()): number | null {
  const currentDay = referenceDate.getDay();
  if (!program.daysOfWeek.includes(currentDay)) {
    return null; // Not scheduled for today
  }

  const [hours, minutes] = program.startTime.split(':').map((s) => parseInt(s, 10));
  if (isNaN(hours) || isNaN(minutes)) return null;

  const progStartDate = new Date(referenceDate);
  progStartDate.setHours(hours, minutes, 0, 0);

  const diffMs = progStartDate.getTime() - referenceDate.getTime();
  const diffSeconds = Math.floor(diffMs / 1000);

  return diffSeconds;
}

/**
 * Scans schedules and finds if any program has 5 minutes or less until start
 * (0 <= diffSeconds <= 300).
 */
export function findFiveMinuteAlert(
  schedules: ScheduledProgram[],
  settings: ListenerNotificationSettings,
  currentProgramId?: string,
  referenceDate: Date = new Date()
): ActiveAlertInfo | null {
  for (const prog of schedules) {
    // Skip if this is currently playing
    if (prog.id === currentProgramId) continue;

    // Check subscription filter
    if (!settings.notifyAllPrograms && !settings.subscribedProgramIds.includes(prog.id)) {
      continue;
    }

    const diffSeconds = getSecondsUntilProgramStart(prog, referenceDate);
    if (diffSeconds === null) continue;

    // 5-minute threshold: between 1 second and 300 seconds (5 minutes)
    if (diffSeconds > 0 && diffSeconds <= 300) {
      const todayDateStr = referenceDate.toISOString().slice(0, 10);
      const alertKey = `${prog.id}-${todayDateStr}-${prog.startTime}`;

      if (isAlertDismissed(alertKey)) {
        continue;
      }

      return {
        key: alertKey,
        program: prog,
        secondsUntilStart: diffSeconds,
        formattedTimeRemaining: formatSecondsToCountdown(diffSeconds),
      };
    }
  }

  return null;
}
