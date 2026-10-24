import React, { useState } from 'react';
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  Volume1,
  Radio,
  Mic,
  Disc3,
  Calendar,
  Share2,
  Heart,
  MessageSquare,
  Sparkles,
  Upload,
  SkipForward,
  SkipBack,
  ListMusic,
  BarChart2,
  Waves,
  RotateCw,
  LayoutGrid,
  SlidersHorizontal,
  Gauge,
  Bell,
  BellRing,
} from 'lucide-react';
import { ScheduledProgram, AudioTrack, BroadcastType } from '../../types/radio';
import { AudioVisualizerCanvas } from './AudioVisualizerCanvas';
import { CssAudioVisualizer, VisualizerStyle, ColorPalette } from './CssAudioVisualizer';

interface MainTunerPlayerProps {
  isPlaying: boolean;
  onTogglePlay: () => void;
  currentProgram: ScheduledProgram;
  currentTrack: AudioTrack;
  broadcastMode: BroadcastType;
  isLiveMicActive: boolean;
  listenerCount: number;
  volume: number;
  onChangeVolume: (vol: number) => void;
  bitrate: '128k' | '320k' | 'lossless';
  onChangeBitrate: (bitrate: '128k' | '320k' | 'lossless') => void;
  onOpenRequests: () => void;
  onOpenChat: () => void;
  onViewSchedule: () => void;
  onOpenUpload?: () => void;
  nextProgram?: ScheduledProgram;
  sessionTracks?: AudioTrack[];
  currentTrackIndex?: number;
  onSelectSessionTrack?: (index: number) => void;
  onNextTrack?: () => void;
  onPrevTrack?: () => void;
  isAutoPilotActive?: boolean;
  onStartAutoPilot?: () => void;
  isNextProgramReminderSet?: boolean;
  onToggleNextProgramReminder?: () => void;
}

export const MainTunerPlayer: React.FC<MainTunerPlayerProps> = ({
  isPlaying,
  onTogglePlay,
  currentProgram,
  currentTrack,
  broadcastMode,
  isLiveMicActive,
  listenerCount,
  volume,
  onChangeVolume,
  bitrate,
  onChangeBitrate,
  onOpenRequests,
  onOpenChat,
  onViewSchedule,
  onOpenUpload,
  nextProgram,
  sessionTracks = [],
  currentTrackIndex = 0,
  onSelectSessionTrack,
  onNextTrack,
  onPrevTrack,
  isAutoPilotActive = false,
  onStartAutoPilot,
  isNextProgramReminderSet = false,
  onToggleNextProgramReminder,
}) => {
  const [showQueue, setShowQueue] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [prevVolume, setPrevVolume] = useState(volume);
  const [reactionHearts, setReactionHearts] = useState(142);
  const [hasHearted, setHasHearted] = useState(false);
  const [showShareToast, setShowShareToast] = useState(false);
  const [visualizerStyle, setVisualizerStyle] = useState<VisualizerStyle>('bars');
  const [visualizerSensitivity, setVisualizerSensitivity] = useState<number>(1.2);
  const [visualizerPalette, setVisualizerPalette] = useState<ColorPalette>('dynamic');

  const cycleVisualizerStyle = () => {
    setVisualizerStyle((prev) => {
      if (prev === 'bars') return 'wave';
      if (prev === 'wave') return 'circular';
      if (prev === 'circular') return 'led';
      return 'bars';
    });
  };

  const toggleMute = () => {
    if (isMuted) {
      setIsMuted(false);
      onChangeVolume(prevVolume || 0.8);
    } else {
      setPrevVolume(volume);
      setIsMuted(true);
      onChangeVolume(0);
    }
  };

  const handleHeartClick = () => {
    if (!hasHearted) {
      setReactionHearts((prev) => prev + 1);
      setHasHearted(true);
    }
  };

  const handleShare = () => {
    navigator.clipboard?.writeText(window.location.href);
    setShowShareToast(true);
    setTimeout(() => setShowShareToast(false), 2500);
  };

  const isActuallyLive = isLiveMicActive || broadcastMode === 'live';

  return (
    <div className="w-full">
      {/* Studio Header Banner with Real Live Indicators */}
      <div className="relative rounded-2xl overflow-hidden border border-slate-800 bg-slate-900 shadow-2xl">
        <div className="grid grid-cols-1 lg:grid-cols-12 items-stretch min-h-[440px]">
          {/* Left Column: Visual Artwork / Studio Frame (5 cols) */}
          <div className="lg:col-span-5 relative overflow-hidden bg-slate-950 flex flex-col justify-end p-6 min-h-[300px] lg:min-h-full">
            <img
              src={
                isActuallyLive
                  ? currentProgram.coverImage || '/src/assets/images/radio_studio_console_1791833776471.jpg'
                  : currentTrack.coverArt || currentProgram.coverImage || '/src/assets/images/radio_album_art_1791833789333.jpg'
              }
              alt={currentProgram.title}
              referrerPolicy="no-referrer"
              className={`absolute inset-0 w-full h-full object-cover transition-transform duration-700 ${
                isPlaying ? 'scale-105' : 'scale-100 opacity-90'
              }`}
            />
            {/* Dark Scrim overlay for WCAG AA readability */}
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/60 to-black/30" />

            {/* Status indicator on top of image */}
            <div className="absolute top-4 left-4 right-4 flex items-center justify-between z-10">
              <div className="flex items-center gap-2">
                <div
                  className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-semibold tracking-wide uppercase ${
                    isActuallyLive
                      ? 'bg-red-600 text-white shadow-lg shadow-red-600/30'
                      : 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                  }`}
                >
                  {isActuallyLive ? <Mic className="w-3.5 h-3.5" /> : <Disc3 className="w-3.5 h-3.5" />}
                  <span>{isActuallyLive ? 'অন-এয়ার লাইভ' : 'শিডিউলড শো'}</span>
                </div>

                <span className="text-xs text-white/90 font-mono bg-black/60 px-2.5 py-1 rounded-md backdrop-blur-sm">
                  {currentProgram.category}
                </span>
              </div>

              <div className="text-xs font-mono text-white/80 bg-black/60 px-2.5 py-1 rounded-md backdrop-blur-sm tabular-nums">
                {currentProgram.startTime} – {currentProgram.endTime}
              </div>
            </div>

            {/* Bottom Vinyl & Visualizer preview */}
            <div className="relative z-10 pt-16">
              <div className="h-14 w-full bg-slate-950/70 backdrop-blur-md rounded-xl p-2 border border-white/10 flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-amber-500/20 flex items-center justify-center shrink-0">
                  <Radio className={`w-5 h-5 text-amber-400 ${isPlaying ? 'animate-pulse' : ''}`} />
                </div>
                <div className="flex-1 h-10 overflow-hidden flex items-center">
                  <CssAudioVisualizer
                    isPlaying={isPlaying}
                    barCount={16}
                    variant="compact"
                    colorScheme={visualizerPalette}
                    sensitivity={visualizerSensitivity}
                    className="w-full"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Console Details & Player Controls (7 cols) */}
          <div className="lg:col-span-7 p-6 sm:p-8 flex flex-col justify-between bg-gradient-to-br from-slate-900 to-slate-950">
            <div>
              {/* Program metadata line with typographic separators */}
              <div className="flex items-center gap-2 text-xs text-slate-400 mb-3">
                <span className="text-amber-400 font-medium">রেডিও ডি-লিকন</span>
                <span aria-hidden="true">·</span>
                <span>স্টুডিও ১</span>
                <span aria-hidden="true">·</span>
                <span className="font-mono tabular-nums">{listenerCount} লাইভ শ্রোতা</span>
                <span aria-hidden="true">·</span>
                <span className="font-mono uppercase">{bitrate} স্ট্রিমিং</span>
              </div>

              {/* Title & Host */}
              <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight leading-snug mb-2 font-sans">
                {currentProgram.title}
              </h1>

              <div className="flex items-center gap-2 text-sm text-amber-300 font-medium mb-4">
                <span>উপস্থাপনায়: {currentProgram.host}</span>
              </div>

              <p className="text-sm text-slate-300 leading-relaxed mb-6 line-clamp-3">
                {currentProgram.description}
              </p>

              {/* Currently Playing Track Box */}
              <div className="bg-slate-800/60 rounded-xl p-4 border border-slate-700/60 mb-6">
                <div className="flex items-center justify-between text-xs text-slate-400 mb-1.5">
                  <div className="flex items-center gap-2">
                    <span>সম্প্রচারিত ট্র্যাক / অডিও:</span>
                    {sessionTracks.length > 1 && (
                      <span className="font-mono bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded text-[11px] font-bold">
                        গান {currentTrackIndex + 1}/{sessionTracks.length}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {sessionTracks.length > 1 && (
                      <button
                        onClick={() => setShowQueue(!showQueue)}
                        className="flex items-center gap-1 text-[11px] text-amber-400 hover:text-amber-300 cursor-pointer font-medium"
                      >
                        <ListMusic className="w-3.5 h-3.5" />
                        <span>{showQueue ? 'কিউ লুকান' : `প্লেলিস্ট (${sessionTracks.length})`}</span>
                      </button>
                    )}
                    <span className="font-mono text-amber-400">{isActuallyLive ? 'লাইভ মাইক' : 'অডিও রেকর্ড'}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="min-w-0 flex-1 pr-3">
                    <h4 className="text-base font-semibold text-white truncate">
                      {isActuallyLive ? 'লাইভ স্টুডিও সম্প্রচার চলছে' : currentTrack.title}
                    </h4>
                    <p className="text-xs text-slate-400 mt-0.5 truncate">
                      {isActuallyLive ? `উপস্থাপক: ${currentProgram.host}` : currentTrack.artist}
                      {currentTrack.showTitle && currentTrack.showTitle !== currentProgram.title && (
                        <span> · {currentTrack.showTitle}</span>
                      )}
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-slate-400 shrink-0">
                    <Disc3 className={`w-4 h-4 text-amber-400 ${isPlaying ? 'animate-spin' : ''}`} />
                  </div>
                </div>

                {/* Collapsible Session Playlist Queue Drawer */}
                {showQueue && sessionTracks.length > 1 && (
                  <div className="mt-3 pt-3 border-t border-slate-700/60 space-y-1.5 max-h-48 overflow-y-auto pr-1 animate-fade-in">
                    <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                      এই অধিবেশনের গানসমূহ (ধারাবাহিকভাবে বাজবে):
                    </div>
                    {sessionTracks.map((trk, idx) => {
                      const isThisActive = idx === currentTrackIndex;
                      return (
                        <button
                          key={trk.id}
                          onClick={() => {
                            if (onSelectSessionTrack) onSelectSessionTrack(idx);
                          }}
                          className={`w-full text-left p-2 rounded-lg text-xs flex items-center justify-between gap-2 transition-colors cursor-pointer ${
                            isThisActive
                              ? 'bg-amber-500/20 text-amber-300 font-semibold border border-amber-500/40'
                              : 'bg-slate-900/60 hover:bg-slate-800 text-slate-300'
                          }`}
                        >
                          <div className="flex items-center gap-2 truncate">
                            <span className="font-mono text-[10px] text-slate-400">{idx + 1}.</span>
                            <span className="truncate">{trk.title}</span>
                            <span className="text-[10px] text-slate-400 truncate">({trk.artist})</span>
                          </div>
                          {isThisActive && (
                            <span className="text-[10px] bg-amber-500 text-slate-950 font-bold px-1.5 py-0.2 rounded shrink-0">
                              চলছে
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* CSS-based Real-time Audio Frequency Visualizer with Style Toggle */}
            <div className="mb-6 space-y-2.5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                  <BarChart2 className="w-3.5 h-3.5 text-amber-400" />
                  <span>লাইভ অডিও ভিজ্যুয়ালাইজার (Real-time Audio Visualizer)</span>
                </span>

                <div className="flex flex-wrap items-center gap-2">
                  {/* Style Toggle Button (Cycles through styles) */}
                  <button
                    onClick={cycleVisualizerStyle}
                    className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/30 text-xs font-semibold transition-all cursor-pointer shadow-sm active:scale-95"
                    title="ভিজ্যুয়ালাইজার স্টাইল টগল করুন (বার্স → ওয়েভ → সার্কুলার → এলইডি)"
                  >
                    <RotateCw className="w-3 h-3 text-amber-400" />
                    <span>স্টাইল টগল</span>
                  </button>

                  {/* Segmented direct buttons */}
                  <div className="flex items-center bg-slate-900 border border-slate-800 p-0.5 rounded-lg text-[10px]">
                    <button
                      onClick={() => setVisualizerStyle('bars')}
                      className={`flex items-center gap-1 px-2.5 py-1 rounded font-medium transition-colors cursor-pointer ${
                        visualizerStyle === 'bars'
                          ? 'bg-amber-500 text-slate-950 font-bold shadow-sm'
                          : 'text-slate-400 hover:text-white'
                      }`}
                      title="ফ্রিকোয়েন্সি স্পেকট্রাম বার্স"
                    >
                      <BarChart2 className="w-3 h-3" />
                      <span>বার্স</span>
                    </button>

                    <button
                      onClick={() => setVisualizerStyle('wave')}
                      className={`flex items-center gap-1 px-2.5 py-1 rounded font-medium transition-colors cursor-pointer ${
                        visualizerStyle === 'wave'
                          ? 'bg-amber-500 text-slate-950 font-bold shadow-sm'
                          : 'text-slate-400 hover:text-white'
                      }`}
                      title="অসিলোস্কোপ সাউন্ড ওয়েভ"
                    >
                      <Waves className="w-3 h-3" />
                      <span>ওয়েভ</span>
                    </button>

                    <button
                      onClick={() => setVisualizerStyle('circular')}
                      className={`flex items-center gap-1 px-2.5 py-1 rounded font-medium transition-colors cursor-pointer ${
                        visualizerStyle === 'circular'
                          ? 'bg-amber-500 text-slate-950 font-bold shadow-sm'
                          : 'text-slate-400 hover:text-white'
                      }`}
                      title="বৃত্তাকার রেডিয়াল স্পেকট্রাম"
                    >
                      <Disc3 className="w-3 h-3" />
                      <span>সার্কুলার</span>
                    </button>

                    <button
                      onClick={() => setVisualizerStyle('led')}
                      className={`flex items-center gap-1 px-2.5 py-1 rounded font-medium transition-colors cursor-pointer ${
                        visualizerStyle === 'led'
                          ? 'bg-amber-500 text-slate-950 font-bold shadow-sm'
                          : 'text-slate-400 hover:text-white'
                      }`}
                      title="অ্যানালগ এলইডি র্যাক"
                    >
                      <LayoutGrid className="w-3 h-3" />
                      <span>এলইডি</span>
                    </button>
                  </div>

                  {/* Palette Selector (Dynamic intensity scaling) */}
                  <div className="flex items-center bg-slate-900 border border-slate-800 p-0.5 rounded-lg text-[10px]">
                    <button
                      onClick={() => setVisualizerPalette('dynamic')}
                      className={`flex items-center gap-1 px-2 py-1 rounded font-medium transition-colors cursor-pointer ${
                        visualizerPalette === 'dynamic'
                          ? 'bg-emerald-500 text-slate-950 font-bold shadow-sm'
                          : 'text-slate-400 hover:text-white'
                      }`}
                      title="ডাইনামিক কালার স্কেলিং: তীব্রতা অনুযায়ী কালার পরিবর্তন (পান্না → অ্যাম্বার → কমলা → লাল)"
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block"></span>
                      <span>ডাইনামিক</span>
                    </button>

                    <button
                      onClick={() => setVisualizerPalette('fire')}
                      className={`flex items-center gap-1 px-2 py-1 rounded font-medium transition-colors cursor-pointer ${
                        visualizerPalette === 'fire'
                          ? 'bg-orange-500 text-slate-950 font-bold shadow-sm'
                          : 'text-slate-400 hover:text-white'
                      }`}
                      title="ফায়ার কালার স্কেল"
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-orange-400 inline-block"></span>
                      <span>ফায়ার</span>
                    </button>

                    <button
                      onClick={() => setVisualizerPalette('neon')}
                      className={`flex items-center gap-1 px-2 py-1 rounded font-medium transition-colors cursor-pointer ${
                        visualizerPalette === 'neon'
                          ? 'bg-cyan-500 text-slate-950 font-bold shadow-sm'
                          : 'text-slate-400 hover:text-white'
                      }`}
                      title="সাইবার নিয়ন কালার স্কেল"
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 inline-block"></span>
                      <span>নিয়ন</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Visualizer Sensitivity Slider Controller */}
              <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-950/70 border border-slate-800/80 rounded-xl px-3 py-2 text-xs">
                <div className="flex items-center gap-2 text-slate-300 shrink-0">
                  <SlidersHorizontal className="w-3.5 h-3.5 text-amber-400" />
                  <span className="font-medium">বার্স সংবেদনশীলতা (Sensitivity):</span>
                  <span className="font-mono font-bold text-amber-300 text-[11px] bg-slate-900 border border-slate-800 px-2 py-0.5 rounded tabular-nums">
                    {Math.round(visualizerSensitivity * 100)}% ({visualizerSensitivity.toFixed(1)}x)
                  </span>
                </div>

                <div className="flex items-center gap-2.5 flex-1 min-w-[170px] max-w-xs">
                  <span className="text-[10px] text-slate-400 font-mono">০.৪x</span>
                  <input
                    type="range"
                    min="0.4"
                    max="2.5"
                    step="0.1"
                    value={visualizerSensitivity}
                    onChange={(e) => setVisualizerSensitivity(parseFloat(e.target.value))}
                    className="w-full accent-amber-500 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
                    title="ভিজ্যুয়ালাইজার রেসপন্স সংবেদনশীলতা পরিবর্তন করুন"
                    aria-label="ভিজ্যুয়ালাইজার সংবেদনশীলতা"
                  />
                  <span className="text-[10px] text-slate-400 font-mono">২.৫x</span>
                </div>

                {/* Preset Fast Buttons */}
                <div className="flex items-center gap-1 text-[10px] font-mono">
                  <button
                    onClick={() => setVisualizerSensitivity(0.7)}
                    className={`px-2 py-0.5 rounded transition-colors cursor-pointer ${
                      visualizerSensitivity === 0.7
                        ? 'bg-amber-500/30 text-amber-300 border border-amber-500/50 font-bold'
                        : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800/60'
                    }`}
                    title="শান্ত / কোমল রেসপন্স"
                  >
                    শান্ত
                  </button>
                  <button
                    onClick={() => setVisualizerSensitivity(1.2)}
                    className={`px-2 py-0.5 rounded transition-colors cursor-pointer ${
                      visualizerSensitivity === 1.2
                        ? 'bg-amber-500/30 text-amber-300 border border-amber-500/50 font-bold'
                        : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800/60'
                    }`}
                    title="স্বাভাবিক ব্যালান্সড রেসপন্স"
                  >
                    স্বাভাবিক
                  </button>
                  <button
                    onClick={() => setVisualizerSensitivity(2.0)}
                    className={`px-2 py-0.5 rounded transition-colors cursor-pointer ${
                      visualizerSensitivity === 2.0
                        ? 'bg-amber-500/30 text-amber-300 border border-amber-500/50 font-bold'
                        : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800/60'
                    }`}
                    title="হাইপার ডাইনামিক রেসপন্স"
                  >
                    ডাইনামিক
                  </button>
                </div>
              </div>

              <CssAudioVisualizer
                isPlaying={isPlaying}
                barCount={28}
                variant={visualizerStyle}
                colorScheme={visualizerPalette}
                sensitivity={visualizerSensitivity}
                showLabels={true}
              />
            </div>

            {/* Bottom Interaction & Controls Section */}
            <div>
              {/* Main Player Row */}
              <div className="flex flex-wrap items-center gap-4 sm:gap-6 pt-4 border-t border-slate-800/80">
                {/* Playback Controls (with Skip buttons if multi-track session) */}
                <div className="flex items-center gap-2">
                  {sessionTracks.length > 1 && onPrevTrack && (
                    <button
                      onClick={onPrevTrack}
                      className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer"
                      title="পূর্ববর্তী গান"
                    >
                      <SkipBack className="w-5 h-5" />
                    </button>
                  )}

                  <button
                    onClick={onTogglePlay}
                    className={`flex items-center justify-center w-14 h-14 rounded-2xl cursor-pointer transition-all shadow-lg active:scale-95 ${
                      isPlaying
                        ? 'bg-amber-500 text-slate-950 hover:bg-amber-400 shadow-amber-500/20'
                        : 'bg-white text-slate-950 hover:bg-amber-100 shadow-white/10'
                    }`}
                    aria-label={isPlaying ? 'বিরতি দিন' : 'সরাসরি শুনুন'}
                  >
                    {isPlaying ? (
                      <Pause className="w-6 h-6 fill-current stroke-[2]" />
                    ) : (
                      <Play className="w-6 h-6 fill-current ml-1 stroke-[2]" />
                    )}
                  </button>

                  {sessionTracks.length > 1 && onNextTrack && (
                    <button
                      onClick={onNextTrack}
                      className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer"
                      title="পরবর্তী গান"
                    >
                      <SkipForward className="w-5 h-5" />
                    </button>
                  )}
                </div>

                <div className="flex-1 min-w-[140px]">
                  <div className="flex items-center justify-between text-xs mb-1.5">
                    <span className="text-slate-400">স্ট্রিমিং সাউন্ড লেভেল</span>
                    <span className="font-mono text-slate-300 tabular-nums">
                      {Math.round(volume * 100)}%
                    </span>
                  </div>

                  <div className="flex items-center gap-3">
                    <button
                      onClick={toggleMute}
                      className="text-slate-400 hover:text-white transition-colors cursor-pointer"
                      aria-label="মিউট টগল"
                    >
                      {volume === 0 || isMuted ? (
                        <VolumeX className="w-4 h-4 text-red-400" />
                      ) : volume < 0.5 ? (
                        <Volume1 className="w-4 h-4" />
                      ) : (
                        <Volume2 className="w-4 h-4 text-amber-400" />
                      )}
                    </button>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.01"
                      value={isMuted ? 0 : volume}
                      onChange={(e) => {
                        setIsMuted(false);
                        onChangeVolume(parseFloat(e.target.value));
                      }}
                      className="w-full accent-amber-500 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
                    />
                  </div>
                </div>

                {/* Bitrate Selector (Segmented buttons) */}
                <div className="flex items-center bg-slate-800/80 p-1 rounded-lg border border-slate-700/60">
                  <button
                    onClick={() => onChangeBitrate('128k')}
                    className={`px-2.5 py-1 text-xs font-mono rounded transition-colors cursor-pointer ${
                      bitrate === '128k'
                        ? 'bg-amber-500 text-slate-950 font-bold'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    128K
                  </button>
                  <button
                    onClick={() => onChangeBitrate('320k')}
                    className={`px-2.5 py-1 text-xs font-mono rounded transition-colors cursor-pointer ${
                      bitrate === '320k'
                        ? 'bg-amber-500 text-slate-950 font-bold'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    320K
                  </button>
                  <button
                    onClick={() => onChangeBitrate('lossless')}
                    className={`px-2.5 py-1 text-xs font-mono rounded transition-colors cursor-pointer ${
                      bitrate === 'lossless'
                        ? 'bg-amber-500 text-slate-950 font-bold'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Hi-Fi
                  </button>
                </div>
              </div>

              {/* Interaction Strip: Song Request, Live Chat, Reaction, Share */}
              <div className="flex flex-wrap items-center justify-between gap-3 mt-6 pt-4 border-t border-slate-800/60 text-xs">
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    onClick={onOpenRequests}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg transition-colors cursor-pointer border border-slate-700/60"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                    <span>গানের অনুরোধ</span>
                  </button>

                  <button
                    onClick={onOpenChat}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg transition-colors cursor-pointer border border-slate-700/60"
                  >
                    <MessageSquare className="w-3.5 h-3.5 text-blue-400" />
                    <span>চ্যাট ও বার্তা</span>
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={handleHeartClick}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border transition-colors cursor-pointer ${
                      hasHearted
                        ? 'bg-red-500/20 text-red-300 border-red-500/40'
                        : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700/60'
                    }`}
                    title="ভালোবাসা পাঠান"
                  >
                    <Heart className={`w-3.5 h-3.5 ${hasHearted ? 'fill-red-500 text-red-500' : 'text-red-400'}`} />
                    <span className="font-mono tabular-nums">{reactionHearts}</span>
                  </button>

                  <button
                    onClick={handleShare}
                    className="flex items-center gap-1 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition-colors cursor-pointer border border-slate-700/60 relative"
                    title="স্ট্রিমিং লিঙ্ক কপি করুন"
                  >
                    <Share2 className="w-3.5 h-3.5" />
                    <span>শেয়ার</span>
                  </button>
                </div>
              </div>

              {showShareToast && (
                <div className="mt-2 text-xs text-emerald-400 bg-emerald-950/60 border border-emerald-800/80 px-3 py-1.5 rounded-lg text-center animate-fade-in">
                  রেডিও ডি-লিকনের লাইভ স্ট্রিমিং লিঙ্ক ক্লিপবোর্ডে কপি করা হয়েছে!
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Up Next Bar */}
        {nextProgram && (
          <div className="bg-slate-950 px-6 py-3 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-4 text-xs">
            <div className="flex items-center gap-3">
              <Calendar className="w-4 h-4 text-amber-400 shrink-0" />
              <div className="flex items-center gap-2">
                <span className="text-slate-400 font-medium">পরবর্তী সম্প্রচার:</span>
                <span className="text-white font-semibold">{nextProgram.title}</span>
                <span className="text-slate-400">({nextProgram.host})</span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <span className="font-mono text-amber-400 tabular-nums">
                {nextProgram.startTime} - {nextProgram.endTime}
              </span>

              {onToggleNextProgramReminder && (
                <button
                  onClick={onToggleNextProgramReminder}
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium border transition-colors cursor-pointer ${
                    isNextProgramReminderSet
                      ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 shadow-sm'
                      : 'bg-slate-900 text-slate-400 hover:text-white border-slate-800 hover:border-slate-700'
                  }`}
                  title={
                    isNextProgramReminderSet
                      ? '৫-মিনিট রিমাইন্ডার সেট করা আছে (ক্লিক করে বাদ দিন)'
                      : 'শুরু হওয়ার ৫ মিনিট পূর্বে সতর্কবার্তা পেতে ক্লিক করুন'
                  }
                >
                  {isNextProgramReminderSet ? (
                    <BellRing className="w-3.5 h-3.5 text-amber-400" />
                  ) : (
                    <Bell className="w-3.5 h-3.5" />
                  )}
                  <span>{isNextProgramReminderSet ? 'রিমাইন্ডার সক্রিয়' : '৫-মিনিট অ্যালার্ট'}</span>
                </button>
              )}

              <button
                onClick={onViewSchedule}
                className="text-slate-400 hover:text-white underline underline-offset-2 cursor-pointer transition-colors"
              >
                পুরো শিডিউল দেখুন
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
