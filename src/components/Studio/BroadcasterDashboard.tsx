import React, { useState, useEffect } from 'react';
import {
  Radio,
  RadioReceiver,
  Mic,
  MicOff,
  Sliders,
  Sparkles,
  Volume2,
  Calendar,
  Upload,
  Disc3,
  Clock,
  Play,
  Pause,
  Trash2,
  Plus,
  CheckCircle,
  FileAudio,
  GitBranch,
  Terminal,
  Copy,
  Check,
  ExternalLink,
  Layers,
  SkipForward,
  SkipBack,
  ListMusic,
  LogOut,
  ShieldCheck,
  KeyRound,
  Eye,
  MessageSquare,
  AlertCircle,
} from 'lucide-react';
import { audioEngine } from '../../services/audioEngine';
import { ScheduledProgram, AudioTrack, SongRequest, ChatMessage, BroadcastType } from '../../types/radio';
import { AudioVisualizerCanvas } from '../Player/AudioVisualizerCanvas';

interface BroadcasterDashboardProps {
  isOnAir: boolean;
  onToggleOnAir: () => void;
  isLiveMicActive: boolean;
  onToggleLiveMic: () => void;
  currentProgram: ScheduledProgram;
  currentTrack: AudioTrack;
  sessionTracks: AudioTrack[];
  currentTrackIndex: number;
  onNextTrack: () => void;
  onPrevTrack: () => void;
  onSelectSessionTrack: (idx: number) => void;
  schedules: ScheduledProgram[];
  onOpenAddSchedule: () => void;
  onDeleteSchedule: (id: string) => void;
  tracks: AudioTrack[];
  onOpenUploadModal: () => void;
  requests: SongRequest[];
  onUpdateReqStatus: (id: string, status: 'pending' | 'approved' | 'played') => void;
  chatMessages: ChatMessage[];
  onSendMessage: (text: string, senderName: string) => void;
  autoDucking: boolean;
  onToggleAutoDucking: () => void;
  micGain: number;
  onChangeMicGain: (val: number) => void;
  musicVolume: number;
  onChangeMusicVolume: (val: number) => void;
  onSelectTrackToPlay: (track: AudioTrack) => void;
  listenerCount: number;
  onViewListenerPortal: () => void;
  onLogout: () => void;
}

export const BroadcasterDashboard: React.FC<BroadcasterDashboardProps> = ({
  isOnAir,
  onToggleOnAir,
  isLiveMicActive,
  onToggleLiveMic,
  currentProgram,
  currentTrack,
  sessionTracks,
  currentTrackIndex,
  onNextTrack,
  onPrevTrack,
  onSelectSessionTrack,
  schedules,
  onOpenAddSchedule,
  onDeleteSchedule,
  tracks,
  onOpenUploadModal,
  requests,
  onUpdateReqStatus,
  chatMessages,
  onSendMessage,
  autoDucking,
  onToggleAutoDucking,
  micGain,
  onChangeMicGain,
  musicVolume,
  onChangeMusicVolume,
  onSelectTrackToPlay,
  listenerCount,
  onViewListenerPortal,
  onLogout,
}) => {
  const [micLevel, setMicLevel] = useState<number>(0);
  const [activeTab, setActiveTab] = useState<'playout' | 'schedule' | 'sessions' | 'requests' | 'chat' | 'git'>('playout');
  const [isRecordingCustom, setIsRecordingCustom] = useState(false);
  const [recordDuration, setRecordDuration] = useState(0);
  const [statusNotification, setStatusNotification] = useState<string | null>(null);
  const [currentTimeStr, setCurrentTimeStr] = useState('');
  const [repoUrl, setRepoUrl] = useState('https://github.com/chorcho2utkosho/radio-d-leacon.git');
  const [hasCopiedGit, setHasCopiedGit] = useState(false);
  const [customPin, setCustomPin] = useState('');
  const [pinSavedToast, setPinSavedToast] = useState(false);

  // Studio Clock with seconds
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTimeStr(
        now.toLocaleTimeString('bn-BD', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: true,
        })
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Poll mic level when mic is active
  useEffect(() => {
    let animId: number;
    const update = () => {
      if (isLiveMicActive) {
        setMicLevel(audioEngine.getMicLevel());
      } else {
        setMicLevel(0);
      }
      animId = requestAnimationFrame(update);
    };
    update();
    return () => cancelAnimationFrame(animId);
  }, [isLiveMicActive]);

  // Voice recorder timer
  useEffect(() => {
    let timer: number;
    if (isRecordingCustom) {
      timer = window.setInterval(() => {
        setRecordDuration((prev) => prev + 1);
      }, 1000);
    } else {
      setRecordDuration(0);
    }
    return () => clearInterval(timer);
  }, [isRecordingCustom]);

  const handleStartVoiceRecord = async () => {
    const success = await audioEngine.startRecording();
    if (success) {
      setIsRecordingCustom(true);
    } else {
      alert('মাইক্রোফোন সংযোগ ব্যর্থ হয়েছে। ব্রাউজারের অনুমতি নিশ্চিত করুন।');
    }
  };

  const handleStopVoiceRecord = async () => {
    const blob = await audioEngine.stopRecording();
    setIsRecordingCustom(false);
    if (blob) {
      const url = URL.createObjectURL(blob);
      const newTrack: AudioTrack = {
        id: `track-rec-${Date.now()}`,
        title: `আরজে ভয়েস শো (${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })})`,
        artist: 'স্টুডিও আরজে লাইভ',
        duration: recordDuration || 30,
        category: 'টকশো ও আড্ডা',
        audioUrl: url,
        isUploaded: true,
        description: 'স্টুডিও থেকে সদ্য রেকর্ড করা ভয়েস ক্লিপ।',
      };
      onSelectTrackToPlay(newTrack);
      setStatusNotification('ভয়েস শো সফলভাবে রেকর্ড করা হয়েছে এবং অন-এয়ার বাজানো হচ্ছে!');
      setTimeout(() => setStatusNotification(null), 3000);
    }
  };

  const handleSoundFx = (type: string, name: string) => {
    audioEngine.playSoundEffect(type);
    setStatusNotification(`সাউন্ড ইফেক্ট অন-এয়ার: ${name}`);
    setTimeout(() => setStatusNotification(null), 2000);
  };

  const handleSavePin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customPin.trim() || customPin.trim().length < 4) {
      alert('অনুগ্রহ করে কমপক্ষে ৪ সংখ্যার পিন কোড দিন!');
      return;
    }
    localStorage.setItem('radio_dleacon_broadcaster_pin', customPin.trim());
    setPinSavedToast(true);
    setTimeout(() => setPinSavedToast(false), 3000);
  };

  const pendingRequestsCount = requests.filter((r) => r.status === 'pending').length;

  return (
    <div className="w-full space-y-6">
      {/* 1. PROFESSIONAL BROADCASTER HEADER & MASTER RACK */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-2xl">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
          {/* Station Identity & Hardware Rack Indicator */}
          <div className="flex items-center gap-4">
            <div
              className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all ${
                isOnAir
                  ? 'bg-red-600 text-white shadow-xl shadow-red-600/30'
                  : 'bg-slate-800 text-slate-400'
              }`}
            >
              <RadioReceiver className="w-7 h-7" />
            </div>

            <div>
              <div className="flex flex-wrap items-center gap-2.5">
                <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight font-sans">
                  রেডিও ডি-লিকন · ব্রডকাস্টার মাস্টার কনসোল
                </h1>
                <div
                  className={`px-3 py-1 rounded text-xs font-mono font-bold uppercase tracking-wider ${
                    isOnAir
                      ? 'bg-red-600 text-white animate-pulse'
                      : 'bg-slate-800 text-slate-400'
                  }`}
                >
                  {isOnAir ? '● ট্রান্সমিটার সক্রিয় (ON AIR)' : 'অফ-এয়ার'}
                </div>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                স্টেশন ফ্রিকোয়েন্সি: FM 98.4 MHz · স্টুডিও ১ মাস্টার অটোমেশন ডেক
              </p>
            </div>
          </div>

          {/* Master Telemetry Strip */}
          <div className="flex flex-wrap items-center gap-3 sm:gap-4">
            {/* Live Studio Clock */}
            <div className="bg-slate-950 px-3.5 py-2 rounded-xl border border-slate-800 text-center min-w-[130px]">
              <span className="text-[10px] text-slate-400 font-mono uppercase block">স্টুডিও টাইম</span>
              <span className="font-mono text-sm font-bold text-amber-400 tabular-nums">
                {currentTimeStr || '10:00:00 AM'}
              </span>
            </div>

            {/* Listener Count */}
            <div className="bg-slate-950 px-3.5 py-2 rounded-xl border border-slate-800 text-center min-w-[110px]">
              <span className="text-[10px] text-slate-400 font-mono uppercase block">লাইভ শ্রোতা</span>
              <span className="font-mono text-sm font-bold text-emerald-400 tabular-nums">
                {listenerCount} জন
              </span>
            </div>

            {/* Switch to Public View button */}
            <button
              onClick={onViewListenerPortal}
              className="flex items-center gap-1.5 px-3.5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white rounded-xl text-xs font-semibold transition-colors cursor-pointer border border-slate-700"
              title="শ্রোতারা যেভাবে রেডিও শুনছেন তা দেখুন"
            >
              <Eye className="w-4 h-4 text-amber-400" />
              <span>শ্রোতা পোর্টাল</span>
            </button>

            {/* Master On-Air Transmitter Toggle */}
            <button
              onClick={onToggleOnAir}
              className={`px-5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-lg ${
                isOnAir
                  ? 'bg-red-600 hover:bg-red-500 text-white shadow-red-600/20'
                  : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/20'
              }`}
            >
              {isOnAir ? 'ট্রান্সমিটার অফ' : 'ট্রান্সমিটার অন'}
            </button>

            {/* Logout Studio */}
            <button
              onClick={onLogout}
              className="p-2.5 bg-slate-800 hover:bg-red-950 hover:text-red-400 text-slate-400 rounded-xl transition-colors cursor-pointer border border-slate-700/80"
              title="কন্ট্রোল রুম থেকে লগআউট করুন"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Dashboard Navigation Tabs */}
        <div className="flex items-center gap-2 mt-6 pt-5 border-t border-slate-800 overflow-x-auto">
          <button
            onClick={() => setActiveTab('playout')}
            className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer flex items-center gap-2 ${
              activeTab === 'playout'
                ? 'bg-amber-500 text-slate-950 font-bold shadow-md shadow-amber-500/20'
                : 'bg-slate-800/80 text-slate-300 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>লাইভ মাইক ও প্লেআউট অটোমেশন</span>
          </button>

          <button
            onClick={() => setActiveTab('schedule')}
            className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer flex items-center gap-2 ${
              activeTab === 'schedule'
                ? 'bg-amber-500 text-slate-950 font-bold shadow-md shadow-amber-500/20'
                : 'bg-slate-800/80 text-slate-300 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>প্রোগ্রাম শিডিউলার ({schedules.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('sessions')}
            className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer flex items-center gap-2 ${
              activeTab === 'sessions'
                ? 'bg-amber-500 text-slate-950 font-bold shadow-md shadow-amber-500/20'
                : 'bg-slate-800/80 text-slate-300 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>অধিবেশন ও গান আপলোড ({tracks.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('requests')}
            className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer flex items-center gap-2 ${
              activeTab === 'requests'
                ? 'bg-amber-500 text-slate-950 font-bold shadow-md shadow-amber-500/20'
                : 'bg-slate-800/80 text-slate-300 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>শ্রোতাদের গানের অনুরোধ</span>
            {pendingRequestsCount > 0 && (
              <span className="bg-red-500 text-white text-[10px] px-1.5 py-0.2 rounded-full font-mono">
                {pendingRequestsCount}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('chat')}
            className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer flex items-center gap-2 ${
              activeTab === 'chat'
                ? 'bg-amber-500 text-slate-950 font-bold shadow-md shadow-amber-500/20'
                : 'bg-slate-800/80 text-slate-300 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span>লাইভ চ্যাট ও বার্তা মডারেশন</span>
          </button>

          <button
            onClick={() => setActiveTab('git')}
            className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer flex items-center gap-2 ${
              activeTab === 'git'
                ? 'bg-amber-500 text-slate-950 font-bold shadow-md shadow-amber-500/20'
                : 'bg-slate-800/80 text-slate-300 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <GitBranch className="w-3.5 h-3.5" />
            <span>গিট ও নিরাপত্তা</span>
          </button>
        </div>
      </div>

      {statusNotification && (
        <div className="bg-emerald-950/80 border border-emerald-600/60 text-emerald-200 text-xs px-4 py-2.5 rounded-xl flex items-center gap-2 animate-fade-in shadow-lg">
          <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{statusNotification}</span>
        </div>
      )}

      {/* 2. TAB 1: MASTER PLAYOUT & LIVE RJ CONSOLE */}
      {activeTab === 'playout' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Column: Live RJ Desk & Mixer Console (6 cols) */}
          <div className="lg:col-span-6 space-y-6">
            {/* Live Microphone Channel */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-5">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <Mic className="w-4 h-4 text-amber-400" />
                    <span>আরজে লাইভ মাইক্রোফোন চ্যানেল</span>
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    মাইক অন থাকা অবস্থায় আপনার কথা শ্রোতাদের কাছে সরাসরি যাবে
                  </p>
                </div>

                <button
                  onClick={onToggleLiveMic}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-lg ${
                    isLiveMicActive
                      ? 'bg-red-600 hover:bg-red-500 text-white shadow-red-600/30'
                      : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'
                  }`}
                >
                  {isLiveMicActive ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                  <span>{isLiveMicActive ? 'মাইক মিউট করুন' : 'অন-এয়ার মাইক চালু'}</span>
                </button>
              </div>

              {/* Hardware Peak VU Meter */}
              <div className="bg-slate-950 rounded-xl p-4 border border-slate-800 space-y-2.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400 font-medium">ইনপুট সাউন্ড লেভেল (VU মিটার)</span>
                  <span className="font-mono text-amber-400 tabular-nums">
                    {isLiveMicActive ? `${Math.round(micLevel * 100)} %` : 'OFF'}
                  </span>
                </div>

                <div className="flex items-center gap-1 h-5 w-full bg-slate-900 rounded p-1 border border-slate-800">
                  {Array.from({ length: 24 }).map((_, i) => {
                    const threshold = (i + 1) / 24;
                    const isActive = isLiveMicActive && micLevel >= threshold;
                    let colorClass = 'bg-emerald-500';
                    if (i > 16) colorClass = 'bg-amber-400';
                    if (i > 20) colorClass = 'bg-red-500';

                    return (
                      <div
                        key={i}
                        className={`flex-1 h-full rounded-xs transition-opacity duration-75 ${
                          isActive ? `${colorClass} opacity-100 shadow-sm` : 'bg-slate-800 opacity-20'
                        }`}
                      />
                    );
                  })}
                </div>

                <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                  <span>-36 dB</span>
                  <span>-18 dB</span>
                  <span>-6 dB</span>
                  <span>0 dB (PEAK)</span>
                </div>
              </div>

              {/* Mixer Sliders */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-slate-950/70 rounded-xl p-4 border border-slate-800/80">
                  <div className="flex items-center justify-between text-xs mb-2">
                    <span className="text-slate-300 font-medium">মাইক্রোফোন গেইন</span>
                    <span className="font-mono text-amber-400 tabular-nums">{Math.round(micGain * 100)}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="1.5"
                    step="0.05"
                    value={micGain}
                    onChange={(e) => onChangeMicGain(parseFloat(e.target.value))}
                    className="w-full accent-amber-500 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
                  />
                </div>

                <div className="bg-slate-950/70 rounded-xl p-4 border border-slate-800/80">
                  <div className="flex items-center justify-between text-xs mb-2">
                    <span className="text-slate-300 font-medium">গান ও ব্যাকগ্রাউন্ড লেভেল</span>
                    <span className="font-mono text-amber-400 tabular-nums">{Math.round(musicVolume * 100)}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    value={musicVolume}
                    onChange={(e) => onChangeMusicVolume(parseFloat(e.target.value))}
                    className="w-full accent-amber-500 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
                  />
                </div>
              </div>

              {/* Auto-Ducking Switch */}
              <div className="bg-slate-950/70 rounded-xl p-4 border border-slate-800/80 flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-white">স্বয়ংক্রিয় অডিও ডাকিং (Auto-Ducking / Talkover)</h4>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    মাইকে কথা বলার সময় গান স্বয়ংক্রিয়ভাবে ৭০% কমে যাবে
                  </p>
                </div>
                <button
                  onClick={onToggleAutoDucking}
                  className={`w-11 h-6 rounded-full transition-colors cursor-pointer relative p-0.5 ${
                    autoDucking ? 'bg-amber-500' : 'bg-slate-800'
                  }`}
                >
                  <div
                    className={`w-5 h-5 rounded-full bg-slate-950 transition-transform ${
                      autoDucking ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>
            </div>

            {/* Instant Soundboard & Jingles Matrix */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-400" />
                <span>স্টুডিও সাউন্ডবোর্ড ও সিগনেচার জিঙ্গেল</span>
              </h3>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <button
                  onClick={() => handleSoundFx('station_id', 'রেডিও ডি-লিকন সিগনেচার সুর')}
                  className="p-3 bg-slate-950 hover:bg-slate-800 rounded-xl border border-slate-800 hover:border-amber-500/50 text-left transition-all cursor-pointer group"
                >
                  <span className="text-[10px] font-mono text-amber-400 block mb-0.5">PAD 01</span>
                  <span className="text-xs font-bold text-white group-hover:text-amber-300 block">স্টেশন আইডি</span>
                  <span className="text-[10px] text-slate-400">সিগনেচার টিউন</span>
                </button>

                <button
                  onClick={() => handleSoundFx('applause', 'শ্রোতা করতালি ও উল্লাস')}
                  className="p-3 bg-slate-950 hover:bg-slate-800 rounded-xl border border-slate-800 hover:border-amber-500/50 text-left transition-all cursor-pointer group"
                >
                  <span className="text-[10px] font-mono text-amber-400 block mb-0.5">PAD 02</span>
                  <span className="text-xs font-bold text-white group-hover:text-amber-300 block">শ্রোতা করতালি</span>
                  <span className="text-[10px] text-slate-400">উল্লাস ও হাততালি</span>
                </button>

                <button
                  onClick={() => handleSoundFx('gong', 'সংকেত ঘণ্টা ও গং')}
                  className="p-3 bg-slate-950 hover:bg-slate-800 rounded-xl border border-slate-800 hover:border-amber-500/50 text-left transition-all cursor-pointer group"
                >
                  <span className="text-[10px] font-mono text-amber-400 block mb-0.5">PAD 03</span>
                  <span className="text-xs font-bold text-white group-hover:text-amber-300 block">সংকেত ঘণ্টা</span>
                  <span className="text-[10px] text-slate-400">ঘণ্টার সমাপ্তি</span>
                </button>

                <button
                  onClick={() => handleSoundFx('sweep', 'রেডিও ফ্রিকোয়েন্সি সুইপ')}
                  className="p-3 bg-slate-950 hover:bg-slate-800 rounded-xl border border-slate-800 hover:border-amber-500/50 text-left transition-all cursor-pointer group"
                >
                  <span className="text-[10px] font-mono text-amber-400 block mb-0.5">PAD 04</span>
                  <span className="text-xs font-bold text-white group-hover:text-amber-300 block">রেডিও সুইপ</span>
                  <span className="text-[10px] text-slate-400">হুইসল এফেক্ট</span>
                </button>

                <button
                  onClick={() => handleSoundFx('station_id', 'বিশেষ ঘোষণা')}
                  className="p-3 bg-slate-950 hover:bg-slate-800 rounded-xl border border-slate-800 hover:border-amber-500/50 text-left transition-all cursor-pointer group"
                >
                  <span className="text-[10px] font-mono text-amber-400 block mb-0.5">PAD 05</span>
                  <span className="text-xs font-bold text-white group-hover:text-amber-300 block">ঘোষণা চিঙ্কার</span>
                  <span className="text-[10px] text-slate-400">গুরুত্বপূর্ণ নোটিশ</span>
                </button>

                <button
                  onClick={() => handleSoundFx('gong', 'অনুষ্ঠান সমাপ্তি')}
                  className="p-3 bg-slate-950 hover:bg-slate-800 rounded-xl border border-slate-800 hover:border-amber-500/50 text-left transition-all cursor-pointer group"
                >
                  <span className="text-[10px] font-mono text-amber-400 block mb-0.5">PAD 06</span>
                  <span className="text-xs font-bold text-white group-hover:text-amber-300 block">অনুষ্ঠান ড্রপ</span>
                  <span className="text-[10px] text-slate-400">আউটরো সমাপ্তি</span>
                </button>
              </div>
            </div>
          </div>

          {/* Right Column: Playout Automation & Session Queue (6 cols) */}
          <div className="lg:col-span-6 space-y-6">
            {/* Now Playing Live Broadcast Engine Card */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-5">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs font-mono text-amber-400 font-bold uppercase tracking-wider block">
                    বর্তমান সম্প্রচার (On-Air Deck)
                  </span>
                  <h3 className="text-lg font-bold text-white mt-0.5">{currentProgram.title}</h3>
                  <p className="text-xs text-slate-400">উপস্থাপক: {currentProgram.host} · {currentProgram.category}</p>
                </div>

                <button
                  onClick={onOpenUploadModal}
                  className="flex items-center gap-1.5 px-3.5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-md shadow-amber-500/20"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>+ নতুন অধিবেশন ও গান আপলোড</span>
                </button>
              </div>

              {/* Now Playing Track with Audio Visualizer */}
              <div className="bg-slate-950 rounded-xl p-4 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span>চলতি গান / ট্র্যাক:</span>
                  {sessionTracks.length > 1 && (
                    <span className="font-mono text-amber-300 font-bold bg-amber-500/20 px-2 py-0.5 rounded">
                      গান {currentTrackIndex + 1} / {sessionTracks.length}
                    </span>
                  )}
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-base font-bold text-white">{currentTrack.title}</h4>
                    <p className="text-xs text-slate-400">{currentTrack.artist}</p>
                  </div>
                  <Disc3 className="w-6 h-6 text-amber-400 animate-spin" />
                </div>

                <div className="h-10 w-full overflow-hidden rounded-lg bg-slate-900/60 p-1">
                  <AudioVisualizerCanvas isPlaying={isOnAir} mode="bars" />
                </div>
              </div>

              {/* Automation Skip Controls */}
              <div className="flex items-center justify-between pt-2">
                <div className="flex items-center gap-2">
                  <button
                    onClick={onPrevTrack}
                    disabled={sessionTracks.length <= 1}
                    className="p-2 bg-slate-800 hover:bg-slate-750 disabled:opacity-30 text-white rounded-lg text-xs cursor-pointer transition-colors"
                    title="পূর্ববর্তী গান"
                  >
                    <SkipBack className="w-4 h-4" />
                  </button>
                  <button
                    onClick={onNextTrack}
                    disabled={sessionTracks.length <= 1}
                    className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-800 hover:bg-slate-750 disabled:opacity-30 text-white rounded-lg text-xs font-semibold cursor-pointer transition-colors"
                    title="পরবর্তী গান অন-এয়ার দিন"
                  >
                    <SkipForward className="w-4 h-4 text-amber-400" />
                    <span>পরবর্তী গান চালান</span>
                  </button>
                </div>

                <span className="text-xs font-mono text-slate-400">
                  {sessionTracks.length > 1 ? `${sessionTracks.length}টি গানের প্লেলিস্ট সক্রিয়` : 'একক ট্র্যাক'}
                </span>
              </div>
            </div>

            {/* Session Playout Queue List */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-bold text-white flex items-center gap-2">
                    <ListMusic className="w-4 h-4 text-amber-400" />
                    <span>অধিবেশন প্লেআউট কিউ (Automation Queue)</span>
                  </h4>
                  <p className="text-xs text-slate-400 mt-0.5">
                    এই অধিবেশনের গানগুলো ক্রমানুসারে স্বয়ংক্রিয়ভাবে অন-এয়ার বাজছে
                  </p>
                </div>
              </div>

              {sessionTracks.length === 0 ? (
                <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-8 text-center text-slate-400 text-xs">
                  কোনো গান কিউতে নেই। "+ নতুন অধিবেশন ও গান আপলোড" বাটনে ক্লিক করে গান যুক্ত করুন।
                </div>
              ) : (
                <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                  {sessionTracks.map((trk, idx) => {
                    const isCurrent = idx === currentTrackIndex;
                    return (
                      <div
                        key={trk.id}
                        className={`p-3 rounded-xl border flex items-center justify-between gap-3 transition-colors ${
                          isCurrent
                            ? 'bg-amber-500/15 border-amber-500/50 text-amber-200'
                            : 'bg-slate-950 border-slate-800 hover:border-slate-700'
                        }`}
                      >
                        <div className="flex items-center gap-3 min-w-0 flex-1">
                          <span className="w-6 h-6 rounded-full bg-slate-800 text-xs font-mono font-bold flex items-center justify-center shrink-0">
                            {idx + 1}
                          </span>
                          <div className="truncate">
                            <h5 className="text-xs font-bold text-white truncate">{trk.title}</h5>
                            <p className="text-[11px] text-slate-400 truncate">{trk.artist}</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          {isCurrent ? (
                            <span className="bg-amber-500 text-slate-950 text-[10px] font-bold px-2 py-0.5 rounded uppercase">
                              অন-এয়ার চলছে
                            </span>
                          ) : (
                            <button
                              onClick={() => onSelectSessionTrack(idx)}
                              className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium rounded-lg cursor-pointer"
                            >
                              এখনই প্লে করুন
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 3. TAB 2: SCHEDULE MANAGER */}
      {activeTab === 'schedule' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Calendar className="w-5 h-5 text-amber-400" />
                <span>মাস্টার প্রোগ্রাম শিডিউলার</span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                সপ্তাহের প্রতিদিনের নির্ধারিত সম্প্রচার স্লট তৈরি ও পরিচালনা করুন
              </p>
            </div>

            <button
              onClick={onOpenAddSchedule}
              className="flex items-center gap-2 px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>নতুন শো শিডিউল যুক্ত করুন</span>
            </button>
          </div>

          <div className="space-y-3 pt-2">
            {schedules.map((prog) => (
              <div
                key={prog.id}
                className="bg-slate-950/70 border border-slate-800/80 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-mono text-xs font-bold text-amber-400 tabular-nums">
                      {prog.startTime} - {prog.endTime}
                    </span>
                    <span
                      className={`text-[10px] font-semibold px-2 py-0.5 rounded ${
                        prog.type === 'live'
                          ? 'bg-red-950 text-red-300 border border-red-800/60'
                          : 'bg-slate-800 text-slate-300'
                      }`}
                    >
                      {prog.type === 'live' ? 'লাইভ আরজে' : 'রেকর্ডেড অধিবেশন'}
                    </span>
                    <span className="text-xs text-slate-400">({prog.category})</span>
                  </div>
                  <h4 className="text-base font-bold text-white">{prog.title}</h4>
                  <p className="text-xs text-slate-400 mt-0.5">
                    উপস্থাপক: {prog.host} · {prog.description}
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => onDeleteSchedule(prog.id)}
                    className="p-2 text-slate-400 hover:text-red-400 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                    title="শিডিউল মুছে ফেলুন"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 4. TAB 3: SESSIONS & AUDIO LIBRARY */}
      {activeTab === 'sessions' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Layers className="w-5 h-5 text-amber-400" />
                <span>অধিবেশন ও রেকর্ড সংগ্রহশালা (Sessions Library)</span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                অনুষ্ঠানের নাম দিয়ে আপলোড করা সমস্ত গান ও অডিও ফাইল এখানে তালিকাভুক্ত
              </p>
            </div>

            <button
              onClick={onOpenUploadModal}
              className="flex items-center gap-2 px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl transition-colors cursor-pointer shadow-md shadow-amber-500/20"
            >
              <Upload className="w-4 h-4" />
              <span>+ নতুন অধিবেশন ও গান আপলোড</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {tracks.map((track) => (
              <div
                key={track.id}
                className="bg-slate-950/70 border border-slate-800/80 rounded-xl p-4 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
                    <span className="font-mono text-amber-400">{track.category}</span>
                    <span className="font-mono tabular-nums">{Math.round(track.duration / 60)} মিনিট</span>
                  </div>
                  <h4 className="text-sm font-bold text-white mb-0.5">{track.title}</h4>
                  <p className="text-xs text-slate-400">{track.artist}</p>
                  {track.showTitle && (
                    <span className="inline-block mt-2 text-[10px] bg-slate-800 text-amber-300 px-2 py-0.5 rounded">
                      অধিবেশন: {track.showTitle}
                    </span>
                  )}
                </div>

                <div className="pt-4 mt-4 border-t border-slate-800/60 flex items-center justify-between">
                  <span className="text-[10px] text-slate-500">
                    {track.isUploaded ? 'ইউজার ফাইল' : 'স্টুডিও আবহ'}
                  </span>
                  <button
                    onClick={() => {
                      onSelectTrackToPlay(track);
                      setStatusNotification(`"${track.title}" সরাসরি অন-এয়ার বাজানো শুরু হয়েছে!`);
                      setTimeout(() => setStatusNotification(null), 3000);
                    }}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-semibold transition-colors cursor-pointer"
                  >
                    <Play className="w-3.5 h-3.5 fill-current" />
                    <span>অন-এয়ার দিন</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 5. TAB 4: LISTENER REQUESTS INBOX */}
      {activeTab === 'requests' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
          <div>
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-amber-400" />
              <span>শ্রোতাদের গানের অনুরোধ ইনবক্স</span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              শ্রোতাদের পাঠানো গান ও শুভেচ্ছা বার্তা দেখুন এবং ১-ক্লিকে অন-এয়ার কিউতে দিন
            </p>
          </div>

          <div className="space-y-3 pt-2">
            {requests.map((req) => (
              <div
                key={req.id}
                className="bg-slate-950/70 border border-slate-800/80 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-bold text-white">{req.listenerName}</span>
                    <span className="text-xs text-slate-400">({req.location})</span>
                    <span aria-hidden="true" className="text-slate-600">·</span>
                    <span className="text-xs text-slate-400 font-mono">{req.timestamp}</span>
                  </div>
                  <h4 className="text-sm font-semibold text-amber-300">
                    অনুরোধ: {req.requestedSong} - {req.artist}
                  </h4>
                  {req.message && (
                    <p className="text-xs text-slate-300 mt-1 italic">
                      "{req.message}"
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {req.status === 'pending' && (
                    <button
                      onClick={() => {
                        onUpdateReqStatus(req.id, 'approved');
                        setStatusNotification(`"${req.requestedSong}" অনুরোধ অনুমোদন করা হয়েছে!`);
                        setTimeout(() => setStatusNotification(null), 2500);
                      }}
                      className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs rounded-lg transition-colors cursor-pointer"
                    >
                      অনুমোদন করুন
                    </button>
                  )}
                  {req.status === 'approved' && (
                    <button
                      onClick={() => {
                        onUpdateReqStatus(req.id, 'played');
                        setStatusNotification(`"${req.requestedSong}" বাজানো সম্পন্ন মার্ক করা হয়েছে!`);
                        setTimeout(() => setStatusNotification(null), 2500);
                      }}
                      className="px-3.5 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold text-xs rounded-lg transition-colors cursor-pointer"
                    >
                      বাজানো হয়েছে মার্ক করুন
                    </button>
                  )}
                  {req.status === 'played' && (
                    <span className="text-xs text-slate-400 font-medium font-mono">বাজানো সম্পন্ন</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 6. TAB 5: LIVE CHAT MODERATION */}
      {activeTab === 'chat' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
          <div>
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-amber-400" />
              <span>লাইভ চ্যাট ও বার্তা মডারেশন</span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              শ্রোতাদের মন্তব্য পড়ুন এবং স্টুডিও থেকে অফিসিয়াল নোটিশ বা উত্তর দিন
            </p>
          </div>

          <div className="bg-slate-950 rounded-xl p-4 border border-slate-800 max-h-96 overflow-y-auto space-y-3">
            {chatMessages.map((msg) => (
              <div
                key={msg.id}
                className={`p-3 rounded-xl border ${
                  msg.isPinned
                    ? 'bg-amber-950/40 border-amber-600/40 text-amber-200'
                    : msg.isHost
                    ? 'bg-slate-800/80 border-slate-700/80'
                    : 'bg-slate-900/60 border-slate-800'
                }`}
              >
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="font-bold text-white flex items-center gap-1.5">
                    {msg.sender}
                    {msg.isHost && (
                      <span className="bg-amber-500 text-slate-950 text-[10px] font-bold px-1.5 py-0.2 rounded">
                        স্টুডিও আরজে
                      </span>
                    )}
                  </span>
                  <span className="text-[10px] text-slate-500 font-mono">{msg.timestamp}</span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">{msg.text}</p>
              </div>
            ))}
          </div>

          {/* RJ Reply Box */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const input = (e.currentTarget.elements.namedItem('replyText') as HTMLInputElement);
              if (input.value.trim()) {
                onSendMessage(input.value.trim(), 'রেডিও ডি-লিকন স্টুডিও আরজে');
                input.value = '';
              }
            }}
            className="flex items-center gap-2 pt-2"
          >
            <input
              name="replyText"
              type="text"
              placeholder="স্টুডিও আরজে হিসেবে সরাসরি শ্রোতাদের বার্তা লিখুন..."
              className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-amber-500"
            />
            <button
              type="submit"
              className="px-4 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl cursor-pointer"
            >
              বার্তা পাঠান
            </button>
          </form>
        </div>
      )}

      {/* 7. TAB 6: GIT INTEGRATION & SECURITY */}
      {activeTab === 'git' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <GitBranch className="w-5 h-5 text-amber-400" />
                <span>গিট ও ব্রডকাস্টার নিরাপত্তা সেটিংস</span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                GitHub রিপোজিটরি ব্যাকআপ এবং স্টুডিও অ্যাক্সেস পাসকোড পরিবর্তন
              </p>
            </div>

            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-950/80 border border-emerald-600/60 text-emerald-300 text-xs font-semibold">
              <Check className="w-3.5 h-3.5" />
              <span>Git Initialized (.git)</span>
            </div>
          </div>

          {/* Change Broadcaster Passcode */}
          <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-5 space-y-4">
            <div>
              <h4 className="text-sm font-bold text-white flex items-center gap-2">
                <KeyRound className="w-4 h-4 text-amber-400" />
                <span>আরজে / ব্রডকাস্টার স্টুডিও পাসকোড পরিবর্তন</span>
              </h4>
              <p className="text-xs text-slate-400 mt-0.5">
                শ্রোতারা যেন এই ড্যাশবোর্ডে ঢুকতে না পারে, তার জন্য আপনার পছন্দমতো নতুন গোপন কোড দিন (ডিফল্ট: 1234)
              </p>
            </div>

            <form onSubmit={handleSavePin} className="flex flex-wrap items-center gap-3">
              <input
                type="password"
                value={customPin}
                onChange={(e) => setCustomPin(e.target.value)}
                placeholder="নতুন পাসকোড লিখুন"
                className="bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-xs font-mono text-white focus:outline-none focus:border-amber-500 w-64"
              />
              <button
                type="submit"
                className="px-4 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl cursor-pointer"
              >
                পাসকোড সংরক্ষণ করুন
              </button>
            </form>

            {pinSavedToast && (
              <p className="text-xs text-emerald-400 animate-fade-in font-medium">
                নতুন আরজে পাসকোড সফলভাবে সংরক্ষিত হয়েছে!
              </p>
            )}
          </div>

          {/* GitHub / Remote Push Instructions */}
          <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-5 space-y-4">
            <div>
              <h4 className="text-sm font-bold text-white flex items-center gap-2">
                <Terminal className="w-4 h-4 text-amber-400" />
                <span>GitHub-এ সম্পূর্ণ কোড পুশ করার কমান্ড</span>
              </h4>
              <p className="text-xs text-slate-400 mt-0.5">
                আপনার GitHub রিপোজিটরি লিংক দিয়ে সরাসরি টার্মিনাল কমান্ড কপি করুন
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                আপনার GitHub রিপোজিটরি URL
              </label>
              <input
                type="text"
                value={repoUrl}
                onChange={(e) => setRepoUrl(e.target.value)}
                placeholder="https://github.com/your-username/radio-d-leacon.git"
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2 text-xs font-mono text-white focus:outline-none focus:border-amber-500"
              />
            </div>

            <div className="relative bg-slate-900 rounded-xl p-4 border border-slate-800/80 font-mono text-xs text-slate-300 space-y-1">
              <div className="text-slate-500 mb-2"># টার্মিনালে নিচের কমান্ড রান করুন:</div>
              <div className="text-amber-300">git remote add origin {repoUrl || '<YOUR_REPO_URL>'}</div>
              <div className="text-amber-300">git branch -M main</div>
              <div className="text-emerald-400">git push -u origin main</div>

              <button
                onClick={() => {
                  const cmd = `git remote add origin ${repoUrl || '<YOUR_REPO_URL>'}\ngit branch -M main\ngit push -u origin main`;
                  navigator.clipboard?.writeText(cmd);
                  setHasCopiedGit(true);
                  setTimeout(() => setHasCopiedGit(false), 2500);
                }}
                className="absolute top-3 right-3 flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-[11px] font-sans font-semibold transition-colors cursor-pointer border border-slate-700"
              >
                {hasCopiedGit ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{hasCopiedGit ? 'কপি হয়েছে!' : 'কমান্ড কপি করুন'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
