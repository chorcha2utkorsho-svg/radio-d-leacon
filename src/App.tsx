import React, { useState, useEffect, useCallback } from 'react';
import { Header } from './components/Header';
import { MainTunerPlayer } from './components/Player/MainTunerPlayer';
import { ScheduleTimeline } from './components/Schedule/ScheduleTimeline';
import { StudioConsole } from './components/Studio/StudioConsole';
import { BroadcasterDashboard } from './components/Studio/BroadcasterDashboard';
import { BroadcasterAuthModal } from './components/Auth/BroadcasterAuthModal';
import { ScheduleManagerModal } from './components/Studio/ScheduleManagerModal';
import { SongRequestModal } from './components/Requests/SongRequestModal';
import { LiveListenerChat } from './components/Chat/LiveListenerChat';
import { ShowArchiveGrid } from './components/Archive/ShowArchiveGrid';
import { AudioUploadModal, ShowSessionPayload } from './components/Upload/AudioUploadModal';
import { RadioCMSModal } from './components/CMS/RadioCMSModal';
import { ProgramAlertBanner } from './components/Notification/ProgramAlertBanner';
import { NotificationSettingsModal } from './components/Notification/NotificationSettingsModal';
import { Footer } from './components/Footer';
import { audioEngine } from './services/audioEngine';
import { getAudioBlob } from './services/audioStorageDB';
import { checkIsBroadcasterAuthenticated, clearBroadcasterSession } from './services/authSecurity';
import {
  ScheduledProgram,
  AudioTrack,
  SongRequest,
  ChatMessage,
  BroadcastType,
  StationSettings,
} from './types/radio';
import {
  loadSavedSchedules,
  saveSchedules,
  loadSavedTracks,
  saveTracks,
  loadSavedRequests,
  saveRequests,
  loadSavedStationSettings,
  saveStationSettings,
  saveActiveSessionQueue,
  loadActiveSessionQueue,
  saveAutoPilotState,
  loadAutoPilotState,
  INITIAL_CHAT_MESSAGES,
  getCurrentProgramFromSchedule,
  getUpcomingPrograms,
} from './services/stationStorage';
import {
  ListenerNotificationSettings,
  ActiveAlertInfo,
  loadNotificationSettings,
  saveNotificationSettings,
  findFiveMinuteAlert,
  getSecondsUntilProgramStart,
  dismissAlertKey,
  playAlertChime,
  sendBrowserNotification,
  formatSecondsToCountdown,
} from './services/notificationService';
import { Sparkles, Bell, BellRing } from 'lucide-react';

export default function App() {
  // Station State
  const [schedules, setSchedules] = useState<ScheduledProgram[]>(loadSavedSchedules);
  const [tracks, setTracks] = useState<AudioTrack[]>(loadSavedTracks);
  const [requests, setRequests] = useState<SongRequest[]>(loadSavedRequests);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>(INITIAL_CHAT_MESSAGES);

  // Active Program and Track
  const [currentProgram, setCurrentProgram] = useState<ScheduledProgram>(() =>
    getCurrentProgramFromSchedule(schedules)
  );
  const [currentTrack, setCurrentTrack] = useState<AudioTrack>(() => {
    const prog = getCurrentProgramFromSchedule(schedules);
    const matchedTrack = tracks.find((t) => t.id === prog.trackId);
    return matchedTrack || tracks[0];
  });

  // Multi-song session playlist queue with persistence
  const [sessionTracks, setSessionTracks] = useState<AudioTrack[]>(() => {
    const savedQueue = loadActiveSessionQueue();
    const allTracks = loadSavedTracks();
    if (savedQueue && savedQueue.trackIds.length > 0) {
      const matched = allTracks.filter((t) => savedQueue.trackIds.includes(t.id));
      if (matched.length > 0) return matched;
    }
    const prog = getCurrentProgramFromSchedule(schedules);
    const matchedTrack = allTracks.find((t) => t.id === prog.trackId);
    return [matchedTrack || allTracks[0]];
  });
  const [currentTrackIndex, setCurrentTrackIndex] = useState<number>(() => {
    const savedQueue = loadActiveSessionQueue();
    return savedQueue?.currentIndex || 0;
  });

  // Audio & Playback Controls
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [isOnAir, setIsOnAir] = useState<boolean>(true); // station transmitter on
  const [isLiveMicActive, setIsLiveMicActive] = useState<boolean>(false);
  const [broadcastMode, setBroadcastMode] = useState<BroadcastType>(currentProgram.type);
  const [volume, setVolume] = useState<number>(0.85);
  const [bitrate, setBitrate] = useState<'128k' | '320k' | 'lossless'>('320k');
  const [listenerCount, setListenerCount] = useState<number>(248);
  const [isAutoPilotActive, setIsAutoPilotActive] = useState<boolean>(loadAutoPilotState);

  // Studio Controls & Authentication
  const [isStudioMode, setIsStudioMode] = useState<boolean>(false);
  const [isBroadcasterAuthenticated, setIsBroadcasterAuthenticated] = useState<boolean>(
    checkIsBroadcasterAuthenticated
  );
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);
  const [autoDucking, setAutoDucking] = useState<boolean>(true);
  const [micGain, setMicGain] = useState<number>(1.0);
  const [musicVolume, setMusicVolume] = useState<number>(0.8);

  // Navigation & Modals
  const [currentTab, setCurrentTab] = useState<'player' | 'schedule' | 'archive' | 'requests'>('player');
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState<boolean>(false);
  const [isRequestModalOpen, setIsRequestModalOpen] = useState<boolean>(false);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState<boolean>(false);
  const [isCMSOpen, setIsCMSOpen] = useState<boolean>(false);
  const [pendingActionAfterAuth, setPendingActionAfterAuth] = useState<'studio' | 'cms' | null>(null);

  // 5-Minute Listener Pre-Broadcast Notification Alert System
  const [notificationSettings, setNotificationSettings] = useState<ListenerNotificationSettings>(
    loadNotificationSettings
  );
  const [activeAlert, setActiveAlert] = useState<ActiveAlertInfo | null>(null);
  const [isNotificationModalOpen, setIsNotificationModalOpen] = useState<boolean>(false);

  // Station Settings
  const [stationSettings, setStationSettings] = useState<StationSettings>(loadSavedStationSettings);

  // Persist active session queue and AutoPilot mode
  useEffect(() => {
    if (sessionTracks.length > 0) {
      saveActiveSessionQueue(
        sessionTracks.map((t) => t.id),
        currentTrackIndex
      );
    }
  }, [sessionTracks, currentTrackIndex]);

  useEffect(() => {
    saveAutoPilotState(isAutoPilotActive);
  }, [isAutoPilotActive]);

  // Re-hydrate any uploaded audio blobs from IndexedDB
  useEffect(() => {
    const rehydrateBlobs = async () => {
      let hasChanges = false;
      const updated = await Promise.all(
        tracks.map(async (t) => {
          if (t.isUploaded && (t.id.startsWith('track-user-') || t.id.startsWith('track-upload-') || t.id.startsWith('track-cms-'))) {
            const blob = await getAudioBlob(t.id);
            if (blob) {
              hasChanges = true;
              return { ...t, audioUrl: URL.createObjectURL(blob) };
            }
          }
          return t;
        })
      );
      if (hasChanges) {
        setTracks(updated);
        // Also update sessionTracks and currentTrack with fresh blob URLs!
        setSessionTracks((prev) =>
          prev.map((st) => {
            const found = updated.find((u) => u.id === st.id);
            return found ? found : st;
          })
        );
        setCurrentTrack((prev) => {
          const found = updated.find((u) => u.id === prev.id);
          return found ? found : prev;
        });
      }
    };
    rehydrateBlobs();
  }, []);

  // Automated Schedule Tick
  useEffect(() => {
    const checkSchedule = () => {
      // CRITICAL: When AutoPilot continuous replay is active, do NOT override with default raga!
      if (isAutoPilotActive) {
        return;
      }

      const active = getCurrentProgramFromSchedule(schedules);
      if (active.id !== currentProgram.id) {
        setCurrentProgram(active);
        setBroadcastMode(active.type);

        if (active.playlistTrackIds && active.playlistTrackIds.length > 0) {
          const matched = tracks.filter((t) => active.playlistTrackIds?.includes(t.id));
          if (matched.length > 0) {
            setSessionTracks(matched);
            setCurrentTrackIndex(0);
            setCurrentTrack(matched[0]);
            if (isPlaying) {
              audioEngine.playTrack(matched[0].synthTheme || 'evening_melody', matched[0].audioUrl, false);
            }
            return;
          }
        }

        if (active.trackId) {
          const t = tracks.find((track) => track.id === active.trackId);
          if (t) {
            setCurrentTrack(t);
            setSessionTracks([t]);
            setCurrentTrackIndex(0);
            if (isPlaying) {
              audioEngine.playTrack(t.synthTheme || 'morning_raga', t.audioUrl, false);
            }
          }
        }
      }
    };

    // check immediately and every 30 seconds
    const interval = setInterval(checkSchedule, 30000);
    return () => clearInterval(interval);
  }, [schedules, currentProgram.id, tracks, isPlaying, isAutoPilotActive]);

  // Listener count natural oscillation
  useEffect(() => {
    const interval = setInterval(() => {
      setListenerCount((prev) => {
        const delta = Math.floor(Math.random() * 5) - 2;
        return Math.max(180, Math.min(350, prev + delta));
      });
    }, 8000);
    return () => clearInterval(interval);
  }, []);

  // 5-Minute Pre-Broadcast Scheduled Program Alert Checker
  useEffect(() => {
    const checkAlerts = () => {
      // If there's an active alert already being displayed
      if (activeAlert) {
        if (activeAlert.isTest) {
          // Simulation countdown decrements by 1 each second
          const nextSec = activeAlert.secondsUntilStart - 1;
          if (nextSec <= 0) {
            setActiveAlert(null);
          } else {
            setActiveAlert((prev) =>
              prev
                ? {
                    ...prev,
                    secondsUntilStart: nextSec,
                    formattedTimeRemaining: formatSecondsToCountdown(nextSec),
                  }
                : null
            );
          }
          return;
        }

        // Live alert: check remaining time
        const diff = getSecondsUntilProgramStart(activeAlert.program);
        if (diff === null || diff <= 0) {
          setActiveAlert(null);
        } else {
          setActiveAlert((prev) =>
            prev
              ? {
                  ...prev,
                  secondsUntilStart: diff,
                  formattedTimeRemaining: formatSecondsToCountdown(diff),
                }
              : null
          );
        }
        return;
      }

      // Check if any program is scheduled to start in <= 300 seconds (5 minutes)
      const foundAlert = findFiveMinuteAlert(
        schedules,
        notificationSettings,
        currentProgram.id
      );

      if (foundAlert) {
        setActiveAlert(foundAlert);

        // Play gentle radio station FM chime if sound enabled
        if (notificationSettings.soundEnabled) {
          playAlertChime();
        }

        // Send browser notification if permitted and enabled
        if (notificationSettings.browserNotificationsEnabled) {
          sendBrowserNotification(
            foundAlert.program,
            foundAlert.formattedTimeRemaining
          );
        }
      }
    };

    // If an alert is actively showing on screen, tick every second for live countdown;
    // otherwise check every 10 seconds to detect 5-minute threshold
    const intervalTime = activeAlert ? 1000 : 10000;
    const interval = setInterval(checkAlerts, intervalTime);

    // Also run an immediate check on mount / setting changes
    if (!activeAlert) {
      checkAlerts();
    }

    return () => clearInterval(interval);
  }, [schedules, notificationSettings, currentProgram.id, activeAlert]);

  // Update Notification Settings and persist
  const handleUpdateNotificationSettings = (newSettings: ListenerNotificationSettings) => {
    setNotificationSettings(newSettings);
    saveNotificationSettings(newSettings);
  };

  // Toggle reminder for a specific program
  const handleToggleReminder = (progId: string, title?: string) => {
    const isSubscribed = notificationSettings.subscribedProgramIds.includes(progId);
    let updatedIds: string[];
    if (isSubscribed) {
      updatedIds = notificationSettings.subscribedProgramIds.filter((id) => id !== progId);
    } else {
      updatedIds = [...notificationSettings.subscribedProgramIds, progId];
    }

    const updatedSettings: ListenerNotificationSettings = {
      ...notificationSettings,
      subscribedProgramIds: updatedIds,
    };
    setNotificationSettings(updatedSettings);
    saveNotificationSettings(updatedSettings);
  };

  // Dismiss currently active 5-minute alert
  const handleDismissAlert = () => {
    if (activeAlert) {
      dismissAlertKey(activeAlert.key);
    }
    setActiveAlert(null);
  };

  // Tune In from the 5-Minute Alert Banner directly
  const handleTuneInFromAlert = (prog: ScheduledProgram) => {
    handlePlayProgram(prog);
    setIsPlaying(true);
    setActiveAlert(null);
    setCurrentTab('player');
    if (isStudioMode) setIsStudioMode(false);
  };

  // Trigger immediate simulated 5-minute alert for user demonstration
  const handleTriggerTestAlert = () => {
    const upcoming = getUpcomingPrograms(schedules, currentProgram.id);
    const target = upcoming[0] || schedules[0] || currentProgram;
    const testAlert: ActiveAlertInfo = {
      key: `test-${Date.now()}`,
      program: target,
      secondsUntilStart: 285, // 4 mins 45 seconds
      formattedTimeRemaining: formatSecondsToCountdown(285),
      isTest: true,
    };

    setActiveAlert(testAlert);

    if (notificationSettings.soundEnabled) {
      playAlertChime();
    }
    if (notificationSettings.browserNotificationsEnabled) {
      sendBrowserNotification(target, '৪ মিনিট ৪৫ সেকেন্ড পর শুরু হচ্ছে!');
    }
  };

  // Sync volume with audio engine
  const handleVolumeChange = (newVol: number) => {
    setVolume(newVol);
    audioEngine.setMasterVolume(newVol);
  };

  const handleMicGainChange = (val: number) => {
    setMicGain(val);
    audioEngine.setMicGain(val);
  };

  const handleMusicVolumeChange = (val: number) => {
    setMusicVolume(val);
    audioEngine.setMusicVolume(val);
  };

  const handleToggleAutoDucking = () => {
    const next = !autoDucking;
    setAutoDucking(next);
    audioEngine.setAutoDucking(next);
  };

  // Multi-song session playlist navigation handlers
  const handleNextTrackInSession = useCallback(() => {
    if (sessionTracks.length > 1) {
      const nextIndex = (currentTrackIndex + 1) % sessionTracks.length;
      setCurrentTrackIndex(nextIndex);
      const nextTrack = sessionTracks[nextIndex];
      setCurrentTrack(nextTrack);
      audioEngine.setMasterVolume(volume);
      audioEngine.playTrack(nextTrack.synthTheme || 'morning_raga', nextTrack.audioUrl, false);
      setIsPlaying(true);
    } else if (sessionTracks.length === 1 && isAutoPilotActive) {
      const nextTrack = sessionTracks[0];
      audioEngine.setMasterVolume(volume);
      audioEngine.playTrack(nextTrack.synthTheme || 'morning_raga', nextTrack.audioUrl, false);
      setIsPlaying(true);
    }
  }, [sessionTracks, currentTrackIndex, volume, isAutoPilotActive]);

  // Start Full-Day Auto-Pilot / Replay of Uploaded Tracks
  const handleStartAutoPilot = useCallback((customTracks?: AudioTrack[]) => {
    const uploadedTracks = tracks.filter((t) => t.isUploaded);
    const targetTracks = customTracks && customTracks.length > 0 
      ? customTracks 
      : (uploadedTracks.length > 0 ? uploadedTracks : tracks);

    if (targetTracks.length === 0) {
      alert('প্লে করার জন্য কোনো অডিও ট্র্যাক পাওয়া যায়নি।');
      return;
    }

    setIsAutoPilotActive(true);
    setSessionTracks(targetTracks);
    setCurrentTrackIndex(0);
    const firstTrack = targetTracks[0];
    setCurrentTrack(firstTrack);
    setBroadcastMode('recorded');

    const autoProg: ScheduledProgram = {
      id: `autopilot-${Date.now()}`,
      title: 'সারাদিনের বিশেষ অটো-রিপ্লে অধিবেশন (Auto-DJ Stream)',
      host: 'রেডিও ডি-লিকন অটোমেশন',
      description: 'আপলোডকৃত সমস্ত অডিও অনুষ্ঠান একের পর এক সারাদিন অবিরাম বাজছে।',
      category: 'সঙ্গীত',
      startTime: '00:00',
      endTime: '23:59',
      daysOfWeek: [0, 1, 2, 3, 4, 5, 6],
      type: 'recorded',
      playlistTrackIds: targetTracks.map((t) => t.id),
      coverImage: '/src/assets/images/radio_studio_console_1791833776471.jpg',
    };
    setCurrentProgram(autoProg);

    audioEngine.setMasterVolume(volume);
    audioEngine.playTrack(firstTrack.synthTheme || 'evening_melody', firstTrack.audioUrl, false);
    setIsPlaying(true);
    setIsOnAir(true);
    setCurrentTab('player');
  }, [tracks, volume]);

  const handlePrevTrackInSession = useCallback(() => {
    if (sessionTracks.length > 1) {
      const prevIndex = (currentTrackIndex - 1 + sessionTracks.length) % sessionTracks.length;
      setCurrentTrackIndex(prevIndex);
      const prevTrack = sessionTracks[prevIndex];
      setCurrentTrack(prevTrack);
      audioEngine.setMasterVolume(volume);
      audioEngine.playTrack(prevTrack.synthTheme || 'morning_raga', prevTrack.audioUrl, false);
      setIsPlaying(true);
    }
  }, [sessionTracks, currentTrackIndex, volume]);

  const handleSelectSessionTrack = useCallback((index: number) => {
    if (sessionTracks[index]) {
      setCurrentTrackIndex(index);
      const trk = sessionTracks[index];
      setCurrentTrack(trk);
      audioEngine.setMasterVolume(volume);
      audioEngine.playTrack(trk.synthTheme || 'morning_raga', trk.audioUrl, false);
      setIsPlaying(true);
    }
  }, [sessionTracks, volume]);

  // Hook up audio engine onTrackEnded callback
  useEffect(() => {
    audioEngine.setOnTrackEnded(handleNextTrackInSession);
    return () => {
      audioEngine.setOnTrackEnded(null);
    };
  }, [handleNextTrackInSession]);

  // Play / Pause Stream
  const handleTogglePlay = useCallback(() => {
    if (isPlaying) {
      audioEngine.stopMusic();
      setIsPlaying(false);
    } else {
      audioEngine.setMasterVolume(volume);
      const isMultiTrack = sessionTracks.length > 1;
      audioEngine.playTrack(currentTrack.synthTheme || 'morning_raga', currentTrack.audioUrl, !isMultiTrack);
      setIsPlaying(true);
    }
  }, [isPlaying, volume, currentTrack, sessionTracks.length]);

  // Studio Master On-Air toggle
  const handleToggleOnAir = () => {
    const next = !isOnAir;
    setIsOnAir(next);
    if (!next) {
      // station shut down
      if (isPlaying) handleTogglePlay();
      if (isLiveMicActive) handleToggleLiveMic();
    }
  };

  // Studio Live Microphone toggle
  const handleToggleLiveMic = async () => {
    if (isLiveMicActive) {
      audioEngine.stopMicrophone();
      setIsLiveMicActive(false);
      setBroadcastMode(currentProgram.type);
    } else {
      const ok = await audioEngine.startMicrophone();
      if (ok) {
        setIsLiveMicActive(true);
        setBroadcastMode('live');
        // If not already playing master bus, start it so broadcaster/listeners hear it
        if (!isPlaying) {
          handleTogglePlay();
        }
      } else {
        alert('মাইক্রোফোন চালু করা যায়নি। অনুগ্রহ করে ব্রাউজারে মাইক্রোফোনের পারমিশন দিন।');
      }
    }
  };

  // Broadcaster Studio Mode & Authentication Handlers
  const handleToggleStudio = () => {
    if (isStudioMode) {
      setIsStudioMode(false);
    } else {
      if (isBroadcasterAuthenticated) {
        setIsStudioMode(true);
      } else {
        setPendingActionAfterAuth('studio');
        setIsAuthModalOpen(true);
      }
    }
  };

  const handleOpenCMS = () => {
    if (isBroadcasterAuthenticated) {
      setIsCMSOpen(true);
    } else {
      setPendingActionAfterAuth('cms');
      setIsAuthModalOpen(true);
    }
  };

  const handleAuthSuccess = () => {
    setIsBroadcasterAuthenticated(true);
    setIsAuthModalOpen(false);
    if (pendingActionAfterAuth === 'cms') {
      setIsCMSOpen(true);
    } else {
      setIsStudioMode(true);
    }
    setPendingActionAfterAuth(null);
  };

  const handleBroadcasterLogout = () => {
    clearBroadcasterSession();
    setIsBroadcasterAuthenticated(false);
    setIsStudioMode(false);
    setIsCMSOpen(false);
  };

  const handleUpdateStationSettings = (newSettings: StationSettings) => {
    setStationSettings(newSettings);
    saveStationSettings(newSettings);
    if (newSettings.defaultBitrate && newSettings.defaultBitrate !== bitrate) {
      setBitrate(newSettings.defaultBitrate);
    }
  };

  const handleUpdateTracksList = (newTracks: AudioTrack[]) => {
    setTracks(newTracks);
    saveTracks(newTracks);
  };

  const handleUpdateSchedulesList = (newSchedules: ScheduledProgram[]) => {
    setSchedules(newSchedules);
    saveSchedules(newSchedules);
  };

  const handleUpdateRequestsList = (newRequests: SongRequest[]) => {
    setRequests(newRequests);
    saveRequests(newRequests);
  };

  // Play specific track or program
  const handlePlayProgram = (prog: ScheduledProgram) => {
    setCurrentProgram(prog);
    setBroadcastMode(prog.type);

    if (prog.playlistTrackIds && prog.playlistTrackIds.length > 0) {
      const matched = tracks.filter((t) => prog.playlistTrackIds?.includes(t.id));
      if (matched.length > 0) {
        setSessionTracks(matched);
        setCurrentTrackIndex(0);
        setCurrentTrack(matched[0]);
        audioEngine.setMasterVolume(volume);
        audioEngine.playTrack(matched[0].synthTheme || 'evening_melody', matched[0].audioUrl, false);
        setIsPlaying(true);
        setCurrentTab('player');
        return;
      }
    }

    let targetTrack = tracks.find((t) => t.id === prog.trackId);
    if (!targetTrack) targetTrack = tracks[0];

    setSessionTracks([targetTrack]);
    setCurrentTrackIndex(0);
    setCurrentTrack(targetTrack);
    audioEngine.setMasterVolume(volume);
    audioEngine.playTrack(targetTrack.synthTheme || 'evening_melody', targetTrack.audioUrl);
    setIsPlaying(true);
    setCurrentTab('player');
  };

  const handlePlayTrackOnDemand = (track: AudioTrack) => {
    setSessionTracks([track]);
    setCurrentTrackIndex(0);
    setCurrentTrack(track);
    audioEngine.setMasterVolume(volume);
    audioEngine.playTrack(track.synthTheme || 'morning_raga', track.audioUrl);
    setIsPlaying(true);
  };

  // Add new schedule
  const handleAddSchedule = (newProg: ScheduledProgram) => {
    const updated = [...schedules, newProg];
    setSchedules(updated);
    saveSchedules(updated);
  };

  // Delete schedule
  const handleDeleteSchedule = (id: string) => {
    if (schedules.length <= 1) {
      alert('কমপক্ষে একটি শিডিউলড প্রোগ্রাম রাখা আবশ্যক!');
      return;
    }
    const updated = schedules.filter((s) => s.id !== id);
    setSchedules(updated);
    saveSchedules(updated);
  };

  // Upload custom audio track
  const handleUploadTrack = (file: File) => {
    const url = URL.createObjectURL(file);
    const newTrack: AudioTrack = {
      id: `track-upload-${Date.now()}`,
      title: file.name.replace(/\.[^/.]+$/, ''),
      artist: 'রেডিও ডি-লিকন ব্রডকাস্টার',
      duration: 300,
      category: 'ইউজার আপলোড ও রেকর্ড',
      audioUrl: url,
      isUploaded: true,
      description: 'স্টুডিও থেকে সদ্য আপলোড বা রেকর্ড করা অডিও ফাইল।',
    };
    const updated = [newTrack, ...tracks];
    setTracks(updated);
    saveTracks(updated);
  };

  const handleSessionUploaded = (payload: ShowSessionPayload, playImmediately: boolean) => {
    // 1. Add all new tracks to master tracks collection
    const updatedTracks = [...payload.tracks, ...tracks];
    setTracks(updatedTracks);
    saveTracks(updatedTracks);

    // 2. If scheduled, add to schedules
    if (payload.scheduleTime) {
      const newProg: ScheduledProgram = {
        id: `prog-session-${Date.now()}`,
        title: payload.showTitle,
        host: payload.host,
        description: payload.description,
        category: (payload.category as any) || 'সঙ্গীত',
        startTime: payload.scheduleTime.startTime,
        endTime: payload.scheduleTime.endTime,
        daysOfWeek: payload.scheduleTime.daysOfWeek,
        type: 'recorded',
        playlistTrackIds: payload.tracks.map((t) => t.id),
        coverImage: '/src/assets/images/radio_album_art_1791833789333.jpg',
      };
      const updatedSchedules = [...schedules, newProg];
      setSchedules(updatedSchedules);
      saveSchedules(updatedSchedules);
    }

    // 3. If play immediately
    if (playImmediately && payload.tracks.length > 0) {
      setIsAutoPilotActive(true);
      setSessionTracks(payload.tracks);
      setCurrentTrackIndex(0);
      const firstTrack = payload.tracks[0];
      setCurrentTrack(firstTrack);
      setBroadcastMode('recorded');

      setCurrentProgram({
        id: `prog-active-${Date.now()}`,
        title: payload.showTitle,
        host: payload.host,
        description: payload.description,
        category: (payload.category as any) || 'সঙ্গীত',
        startTime: '00:00',
        endTime: '23:59',
        daysOfWeek: [0, 1, 2, 3, 4, 5, 6],
        type: 'recorded',
        playlistTrackIds: payload.tracks.map((t) => t.id),
        coverImage: '/src/assets/images/radio_album_art_1791833789333.jpg',
      });

      audioEngine.setMasterVolume(volume);
      audioEngine.playTrack(firstTrack.synthTheme || 'evening_melody', firstTrack.audioUrl, false);
      setIsPlaying(true);
      setIsOnAir(true);
      setCurrentTab('player');
    }
  };

  // Song request submissions
  const handleSubmitRequest = (newReq: SongRequest) => {
    const updated = [newReq, ...requests];
    setRequests(updated);
    saveRequests(updated);
  };

  const handleUpdateReqStatus = (id: string, status: 'pending' | 'approved' | 'played') => {
    const updated = requests.map((r) => (r.id === id ? { ...r, status } : r));
    setRequests(updated);
    saveRequests(updated);
  };

  // Chat message sending
  const handleSendMessage = (text: string, senderName: string) => {
    const newMsg: ChatMessage = {
      id: `chat-${Date.now()}`,
      sender: senderName,
      text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      isHost: isStudioMode,
      avatarColor: isStudioMode ? 'bg-amber-500' : 'bg-blue-600',
    };
    setChatMessages((prev) => [...prev, newMsg]);
  };

  const upcomingPrograms = getUpcomingPrograms(schedules, currentProgram.id);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-amber-500/30 selection:text-amber-200">
      {/* 3-Zone Top Navigation Bar */}
      <Header
        currentTab={currentTab}
        onSelectTab={(tab) => {
          setIsStudioMode(false);
          setCurrentTab(tab);
        }}
        isStudioMode={isStudioMode}
        onToggleStudioMode={handleToggleStudio}
        isOnAir={isOnAir}
        listenerCount={listenerCount}
        isBroadcasterAuthenticated={isBroadcasterAuthenticated}
        onOpenCMS={handleOpenCMS}
        onOpenUploadModal={() => setIsUploadModalOpen(true)}
        onOpenNotifications={() => setIsNotificationModalOpen(true)}
        activeReminderCount={notificationSettings.subscribedProgramIds.length}
      />

      {/* 5-Minute Scheduled Program Pre-Broadcast Alert Banner */}
      {activeAlert && (
        <ProgramAlertBanner
          alert={activeAlert}
          onTuneIn={handleTuneInFromAlert}
          onDismiss={handleDismissAlert}
          soundEnabled={notificationSettings.soundEnabled}
          onToggleSound={() =>
            handleUpdateNotificationSettings({
              ...notificationSettings,
              soundEnabled: !notificationSettings.soundEnabled,
            })
          }
        />
      )}

      {/* Station Announcement & Breaking News Ticker Bar */}
      {stationSettings.isTickerActive && stationSettings.announcementTicker && (
        <div className="bg-amber-500/10 border-b border-amber-500/25 px-4 py-2 flex items-center gap-3 overflow-hidden text-xs">
          <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-semibold shrink-0 uppercase tracking-wider text-[10px] border border-amber-500/30">
            <Sparkles className="w-3 h-3 text-amber-400 animate-pulse" />
            <span>স্টেশন ঘোষণা</span>
          </div>
          <div className="whitespace-nowrap overflow-hidden text-ellipsis text-slate-200 font-medium">
            {stationSettings.announcementTicker}
          </div>
        </div>
      )}

      {/* Main Container */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-8">
        {/* If in Broadcaster Studio Mode */}
        {isStudioMode ? (
          <BroadcasterDashboard
            isOnAir={isOnAir}
            onToggleOnAir={handleToggleOnAir}
            isLiveMicActive={isLiveMicActive}
            onToggleLiveMic={handleToggleLiveMic}
            currentProgram={currentProgram}
            currentTrack={currentTrack}
            sessionTracks={sessionTracks}
            currentTrackIndex={currentTrackIndex}
            onNextTrack={handleNextTrackInSession}
            onPrevTrack={handlePrevTrackInSession}
            onSelectSessionTrack={handleSelectSessionTrack}
            schedules={schedules}
            onOpenAddSchedule={() => setIsScheduleModalOpen(true)}
            onDeleteSchedule={handleDeleteSchedule}
            tracks={tracks}
            onOpenUploadModal={() => setIsUploadModalOpen(true)}
            requests={requests}
            onUpdateReqStatus={handleUpdateReqStatus}
            chatMessages={chatMessages}
            onSendMessage={handleSendMessage}
            autoDucking={autoDucking}
            onToggleAutoDucking={handleToggleAutoDucking}
            micGain={micGain}
            onChangeMicGain={handleMicGainChange}
            musicVolume={musicVolume}
            onChangeMusicVolume={handleMusicVolumeChange}
            onSelectTrackToPlay={(track) => {
              setSessionTracks([track]);
              setCurrentTrackIndex(0);
              setCurrentTrack(track);
              audioEngine.setMasterVolume(volume);
              audioEngine.playTrack(track.synthTheme || 'morning_raga', track.audioUrl);
              setIsPlaying(true);
            }}
            listenerCount={listenerCount}
            onViewListenerPortal={() => setIsStudioMode(false)}
            onLogout={handleBroadcasterLogout}
            onStartAutoPilot={handleStartAutoPilot}
            isAutoPilotActive={isAutoPilotActive}
            onOpenCMS={handleOpenCMS}
          />
        ) : (
          <>
            {/* Listener View Tab 1: Now Playing & Main Tuner */}
            {currentTab === 'player' && (
              <div className="space-y-8">
                <MainTunerPlayer
                  isPlaying={isPlaying}
                  onTogglePlay={handleTogglePlay}
                  currentProgram={currentProgram}
                  currentTrack={currentTrack}
                  broadcastMode={broadcastMode}
                  isLiveMicActive={isLiveMicActive}
                  listenerCount={listenerCount}
                  volume={volume}
                  onChangeVolume={handleVolumeChange}
                  bitrate={bitrate}
                  onChangeBitrate={setBitrate}
                  onOpenRequests={() => setIsRequestModalOpen(true)}
                  onOpenChat={() => setCurrentTab('requests')}
                  onViewSchedule={() => setCurrentTab('schedule')}
                  onOpenUpload={() => setIsUploadModalOpen(true)}
                  nextProgram={upcomingPrograms[0]}
                  isNextProgramReminderSet={
                    upcomingPrograms[0]
                      ? notificationSettings.notifyAllPrograms ||
                        notificationSettings.subscribedProgramIds.includes(upcomingPrograms[0].id)
                      : false
                  }
                  onToggleNextProgramReminder={
                    upcomingPrograms[0]
                      ? () => handleToggleReminder(upcomingPrograms[0].id, upcomingPrograms[0].title)
                      : undefined
                  }
                  sessionTracks={sessionTracks}
                  currentTrackIndex={currentTrackIndex}
                  onSelectSessionTrack={handleSelectSessionTrack}
                  onNextTrack={handleNextTrackInSession}
                  onPrevTrack={handlePrevTrackInSession}
                />

                {/* 2-Column Split: Upcoming Timetable & Live Chat */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                  {/* Left 7 cols: Upcoming Broadcasts */}
                  <div className="lg:col-span-7 bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
                    <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                      <div>
                        <h3 className="text-base font-bold text-white">পরবর্তী অনুষ্ঠানমালা</h3>
                        <p className="text-xs text-slate-400">আজকের নির্ধারিত সম্প্রচার সূচি (৫ মিনিট পূর্বে সতর্কবার্তা)</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setIsNotificationModalOpen(true)}
                          className="text-xs text-slate-400 hover:text-amber-400 flex items-center gap-1 font-medium cursor-pointer"
                          title="রিমাইন্ডার সেটিংস ও টেস্ট"
                        >
                          <BellRing className="w-3.5 h-3.5 text-amber-400" />
                          <span>সেটিংস</span>
                        </button>
                        <span className="text-slate-700">|</span>
                        <button
                          onClick={() => setCurrentTab('schedule')}
                          className="text-xs text-amber-400 hover:text-amber-300 font-medium cursor-pointer"
                        >
                          সব দেখুন →
                        </button>
                      </div>
                    </div>

                    <div className="space-y-3">
                      {upcomingPrograms.map((prog) => {
                        const isSubscribed =
                          notificationSettings.notifyAllPrograms ||
                          notificationSettings.subscribedProgramIds.includes(prog.id);

                        return (
                          <div
                            key={prog.id}
                            className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-4 flex items-center justify-between gap-4 hover:border-slate-700 transition-colors"
                          >
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="font-mono text-xs text-amber-400 font-semibold tabular-nums">
                                  {prog.startTime} - {prog.endTime}
                                </span>
                                <span
                                  className={`text-[10px] px-2 py-0.5 rounded font-medium ${
                                    prog.type === 'live'
                                      ? 'bg-red-950 text-red-300 border border-red-800/60'
                                      : 'bg-slate-800 text-slate-300'
                                  }`}
                                >
                                  {prog.type === 'live' ? 'লাইভ' : 'রেকর্ডেড'}
                                </span>
                              </div>
                              <h4 className="text-sm font-bold text-white truncate">{prog.title}</h4>
                              <p className="text-xs text-slate-400 truncate">{prog.host} · {prog.category}</p>
                            </div>

                            <div className="flex items-center gap-2 shrink-0">
                              <button
                                onClick={() => handleToggleReminder(prog.id, prog.title)}
                                className={`p-2 rounded-lg border text-xs transition-colors cursor-pointer ${
                                  isSubscribed
                                    ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 shadow-sm'
                                    : 'bg-slate-800/80 text-slate-400 hover:text-white border-slate-700/60'
                                }`}
                                title={
                                  isSubscribed
                                    ? '৫-মিনিট রিমাইন্ডার সক্রিয়'
                                    : 'শুরু হওয়ার ৫ মিনিট পূর্বে সতর্কতা পেতে ক্লিক করুন'
                                }
                              >
                                {isSubscribed ? (
                                  <BellRing className="w-3.5 h-3.5 text-amber-400" />
                                ) : (
                                  <Bell className="w-3.5 h-3.5" />
                                )}
                              </button>

                              <button
                                onClick={() => handlePlayProgram(prog)}
                                className="px-3 py-1.5 bg-slate-800 hover:bg-amber-500 hover:text-slate-950 text-slate-300 rounded-lg text-xs font-semibold transition-colors cursor-pointer shrink-0"
                              >
                                প্লে করুন
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Right 5 cols: Live Listener Shoutouts & Chat */}
                  <div className="lg:col-span-5">
                    <LiveListenerChat
                      messages={chatMessages}
                      onSendMessage={handleSendMessage}
                      isStudioMode={false}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Listener View Tab 2: Full Schedule */}
            {currentTab === 'schedule' && (
              <ScheduleTimeline
                schedules={schedules}
                currentProgramId={currentProgram.id}
                onPlayProgram={handlePlayProgram}
                subscribedProgramIds={notificationSettings.subscribedProgramIds}
                onToggleReminder={handleToggleReminder}
                onOpenNotificationSettings={() => setIsNotificationModalOpen(true)}
                notifyAllPrograms={notificationSettings.notifyAllPrograms}
              />
            )}

            {/* Listener View Tab 3: Show Archive */}
            {currentTab === 'archive' && (
              <ShowArchiveGrid
                tracks={tracks}
                onPlayTrack={handlePlayTrackOnDemand}
                currentTrackId={currentTrack.id}
                isPlaying={isPlaying}
              />
            )}

            {/* Listener View Tab 4: Requests & Live Chat */}
            {currentTab === 'requests' && (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                <div className="lg:col-span-6 space-y-6">
                  <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
                    <h3 className="text-lg font-bold text-white mb-1">গানের অনুরোধ ও শুভেচ্ছা</h3>
                    <p className="text-xs text-slate-400 mb-6">
                      আপনার পছন্দের গানের অনুরোধ স্টুডিও কন্ট্রোল রুমে পাঠান
                    </p>
                    <button
                      onClick={() => setIsRequestModalOpen(true)}
                      className="w-full py-3 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-sm rounded-xl transition-colors cursor-pointer shadow-lg shadow-amber-500/20"
                    >
                      + নতুন গানের অনুরোধ জমা দিন
                    </button>
                  </div>

                  {/* Recently submitted requests */}
                  <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
                    <h4 className="text-sm font-bold text-white">সম্প্রতি অনুমোদিত অনুরোধসমূহ</h4>
                    <div className="space-y-3">
                      {requests.map((r) => (
                        <div key={r.id} className="bg-slate-950/60 border border-slate-800 p-3.5 rounded-xl">
                          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
                            <span className="font-bold text-white">{r.listenerName} ({r.location})</span>
                            <span className="font-mono">{r.timestamp}</span>
                          </div>
                          <div className="text-xs font-semibold text-amber-300">
                            {r.requestedSong} - {r.artist}
                          </div>
                          {r.message && <p className="text-xs text-slate-400 mt-1 italic">"{r.message}"</p>}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="lg:col-span-6">
                  <LiveListenerChat
                    messages={chatMessages}
                    onSendMessage={handleSendMessage}
                    isStudioMode={false}
                  />
                </div>
              </div>
            )}
          </>
        )}
      </main>

      {/* Broadcaster Security Passcode Gate */}
      <BroadcasterAuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onSuccess={handleAuthSuccess}
      />

      {/* Modals */}
      <ScheduleManagerModal
        isOpen={isScheduleModalOpen}
        onClose={() => setIsScheduleModalOpen(false)}
        onAddSchedule={handleAddSchedule}
        tracks={tracks}
      />

      <SongRequestModal
        isOpen={isRequestModalOpen}
        onClose={() => setIsRequestModalOpen(false)}
        onSubmitRequest={handleSubmitRequest}
      />

      <AudioUploadModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        onSessionUploaded={handleSessionUploaded}
        existingShows={schedules}
      />

      {/* Station Content Management System (CMS) Modal */}
      <RadioCMSModal
        isOpen={isCMSOpen}
        onClose={() => setIsCMSOpen(false)}
        tracks={tracks}
        onUpdateTracks={handleUpdateTracksList}
        schedules={schedules}
        onUpdateSchedules={handleUpdateSchedulesList}
        requests={requests}
        onUpdateRequests={handleUpdateRequestsList}
        stationSettings={stationSettings}
        onUpdateStationSettings={handleUpdateStationSettings}
        onPlayTrackNow={(track) => {
          handlePlayTrackOnDemand(track);
          setIsCMSOpen(false);
        }}
        onStartAutoPilot={(customTracks) => {
          handleStartAutoPilot(customTracks);
          setIsCMSOpen(false);
        }}
        currentTrackId={currentTrack.id}
      />

      {/* Listener 5-Minute Pre-Broadcast Notification & Reminder Settings Modal */}
      <NotificationSettingsModal
        isOpen={isNotificationModalOpen}
        onClose={() => setIsNotificationModalOpen(false)}
        settings={notificationSettings}
        onUpdateSettings={handleUpdateNotificationSettings}
        schedules={schedules}
        onTriggerTestAlert={handleTriggerTestAlert}
      />

      {/* Footer */}
      <Footer />
    </div>
  );
}
