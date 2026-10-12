import React, { useState, useEffect, useCallback } from 'react';
import { Header } from './components/Header';
import { MainTunerPlayer } from './components/Player/MainTunerPlayer';
import { ScheduleTimeline } from './components/Schedule/ScheduleTimeline';
import { StudioConsole } from './components/Studio/StudioConsole';
import { ScheduleManagerModal } from './components/Studio/ScheduleManagerModal';
import { SongRequestModal } from './components/Requests/SongRequestModal';
import { LiveListenerChat } from './components/Chat/LiveListenerChat';
import { ShowArchiveGrid } from './components/Archive/ShowArchiveGrid';
import { AudioUploadModal, ShowSessionPayload } from './components/Upload/AudioUploadModal';
import { Footer } from './components/Footer';
import { audioEngine } from './services/audioEngine';
import { getAudioBlob } from './services/audioStorageDB';
import {
  ScheduledProgram,
  AudioTrack,
  SongRequest,
  ChatMessage,
  BroadcastType,
} from './types/radio';
import {
  loadSavedSchedules,
  saveSchedules,
  loadSavedTracks,
  saveTracks,
  loadSavedRequests,
  saveRequests,
  INITIAL_CHAT_MESSAGES,
  getCurrentProgramFromSchedule,
  getUpcomingPrograms,
} from './services/stationStorage';

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

  // Multi-song session playlist queue
  const [sessionTracks, setSessionTracks] = useState<AudioTrack[]>([currentTrack]);
  const [currentTrackIndex, setCurrentTrackIndex] = useState<number>(0);

  // Audio & Playback Controls
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [isOnAir, setIsOnAir] = useState<boolean>(true); // station transmitter on
  const [isLiveMicActive, setIsLiveMicActive] = useState<boolean>(false);
  const [broadcastMode, setBroadcastMode] = useState<BroadcastType>(currentProgram.type);
  const [volume, setVolume] = useState<number>(0.85);
  const [bitrate, setBitrate] = useState<'128k' | '320k' | 'lossless'>('320k');
  const [listenerCount, setListenerCount] = useState<number>(248);

  // Studio Controls
  const [isStudioMode, setIsStudioMode] = useState<boolean>(false);
  const [autoDucking, setAutoDucking] = useState<boolean>(true);
  const [micGain, setMicGain] = useState<number>(1.0);
  const [musicVolume, setMusicVolume] = useState<number>(0.8);

  // Navigation & Modals
  const [currentTab, setCurrentTab] = useState<'player' | 'schedule' | 'archive' | 'requests'>('player');
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState<boolean>(false);
  const [isRequestModalOpen, setIsRequestModalOpen] = useState<boolean>(false);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState<boolean>(false);

  // Re-hydrate any uploaded audio blobs from IndexedDB
  useEffect(() => {
    const rehydrateBlobs = async () => {
      let hasChanges = false;
      const updated = await Promise.all(
        tracks.map(async (t) => {
          if (t.isUploaded && t.id.startsWith('track-user-')) {
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
      }
    };
    rehydrateBlobs();
  }, []);

  // Automated Schedule Tick
  useEffect(() => {
    const checkSchedule = () => {
      const active = getCurrentProgramFromSchedule(schedules);
      if (active.id !== currentProgram.id) {
        setCurrentProgram(active);
        setBroadcastMode(active.type);
        if (active.trackId) {
          const t = tracks.find((track) => track.id === active.trackId);
          if (t) {
            setCurrentTrack(t);
            if (isPlaying) {
              audioEngine.playTrack(t.synthTheme || 'morning_raga', t.audioUrl);
            }
          }
        }
      }
    };

    // check immediately and every 30 seconds
    const interval = setInterval(checkSchedule, 30000);
    return () => clearInterval(interval);
  }, [schedules, currentProgram.id, tracks, isPlaying]);

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
    }
  }, [sessionTracks, currentTrackIndex, volume]);

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
        onToggleStudioMode={() => setIsStudioMode((prev) => !prev)}
        isOnAir={isOnAir}
        listenerCount={listenerCount}
        onOpenUpload={() => setIsUploadModalOpen(true)}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-8">
        {/* If in Broadcaster Studio Mode */}
        {isStudioMode ? (
          <StudioConsole
            isOnAir={isOnAir}
            onToggleOnAir={handleToggleOnAir}
            isLiveMicActive={isLiveMicActive}
            onToggleLiveMic={handleToggleLiveMic}
            currentProgram={currentProgram}
            schedules={schedules}
            onOpenAddSchedule={() => setIsScheduleModalOpen(true)}
            onDeleteSchedule={handleDeleteSchedule}
            tracks={tracks}
            onUploadTrack={handleUploadTrack}
            onOpenUploadModal={() => setIsUploadModalOpen(true)}
            requests={requests}
            onUpdateReqStatus={handleUpdateReqStatus}
            autoDucking={autoDucking}
            onToggleAutoDucking={handleToggleAutoDucking}
            micGain={micGain}
            onChangeMicGain={handleMicGainChange}
            musicVolume={musicVolume}
            onChangeMusicVolume={handleMusicVolumeChange}
            onSelectTrackToPlay={(track) => {
              setCurrentTrack(track);
              audioEngine.playTrack(track.synthTheme || 'morning_raga', track.audioUrl);
              setIsPlaying(true);
            }}
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
                        <p className="text-xs text-slate-400">আজকের নির্ধারিত সম্প্রচার সূচি</p>
                      </div>
                      <button
                        onClick={() => setCurrentTab('schedule')}
                        className="text-xs text-amber-400 hover:text-amber-300 font-medium cursor-pointer"
                      >
                        সব দেখুন →
                      </button>
                    </div>

                    <div className="space-y-3">
                      {upcomingPrograms.map((prog) => (
                        <div
                          key={prog.id}
                          className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-4 flex items-center justify-between gap-4 hover:border-slate-700 transition-colors"
                        >
                          <div>
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
                            <h4 className="text-sm font-bold text-white">{prog.title}</h4>
                            <p className="text-xs text-slate-400">{prog.host} · {prog.category}</p>
                          </div>

                          <button
                            onClick={() => handlePlayProgram(prog)}
                            className="px-3 py-1.5 bg-slate-800 hover:bg-amber-500 hover:text-slate-950 text-slate-300 rounded-lg text-xs font-semibold transition-colors cursor-pointer shrink-0"
                          >
                            প্লে করুন
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Right 5 cols: Live Listener Shoutouts & Chat */}
                  <div className="lg:col-span-5">
                    <LiveListenerChat
                      messages={chatMessages}
                      onSendMessage={handleSendMessage}
                      isStudioMode={isStudioMode}
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
                onOpenAddSchedule={() => setIsScheduleModalOpen(true)}
              />
            )}

            {/* Listener View Tab 3: Show Archive */}
            {currentTab === 'archive' && (
              <ShowArchiveGrid
                tracks={tracks}
                onPlayTrack={handlePlayTrackOnDemand}
                currentTrackId={currentTrack.id}
                isPlaying={isPlaying}
                onOpenUpload={() => setIsUploadModalOpen(true)}
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
                    isStudioMode={isStudioMode}
                  />
                </div>
              </div>
            )}
          </>
        )}
      </main>

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

      {/* Footer */}
      <Footer />
    </div>
  );
}
