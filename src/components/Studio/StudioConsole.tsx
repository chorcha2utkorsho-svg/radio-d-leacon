import React, { useState, useEffect } from 'react';
import {
  Mic,
  MicOff,
  Radio,
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
  RadioReceiver,
  GitBranch,
  Terminal,
  Copy,
  Check,
} from 'lucide-react';
import { audioEngine } from '../../services/audioEngine';
import { ScheduledProgram, AudioTrack, SongRequest } from '../../types/radio';

interface StudioConsoleProps {
  isOnAir: boolean;
  onToggleOnAir: () => void;
  isLiveMicActive: boolean;
  onToggleLiveMic: () => void;
  currentProgram: ScheduledProgram;
  schedules: ScheduledProgram[];
  onOpenAddSchedule: () => void;
  onDeleteSchedule: (id: string) => void;
  tracks: AudioTrack[];
  onUploadTrack: (file: File) => void;
  requests: SongRequest[];
  onUpdateReqStatus: (id: string, status: 'pending' | 'approved' | 'played') => void;
  autoDucking: boolean;
  onToggleAutoDucking: () => void;
  micGain: number;
  onChangeMicGain: (val: number) => void;
  musicVolume: number;
  onChangeMusicVolume: (val: number) => void;
  onSelectTrackToPlay: (track: AudioTrack) => void;
  onOpenUploadModal?: () => void;
}

export const StudioConsole: React.FC<StudioConsoleProps> = ({
  isOnAir,
  onToggleOnAir,
  isLiveMicActive,
  onToggleLiveMic,
  currentProgram,
  schedules,
  onOpenAddSchedule,
  onDeleteSchedule,
  tracks,
  onUploadTrack,
  requests,
  onUpdateReqStatus,
  autoDucking,
  onToggleAutoDucking,
  micGain,
  onChangeMicGain,
  musicVolume,
  onChangeMusicVolume,
  onSelectTrackToPlay,
  onOpenUploadModal,
}) => {
  const [micLevel, setMicLevel] = useState<number>(0);
  const [studioTab, setStudioTab] = useState<'console' | 'schedule_mgmt' | 'library' | 'requests' | 'git'>('console');
  const [repoUrl, setRepoUrl] = useState('https://github.com/chorcho2utkosho/radio-d-leacon.git');
  const [hasCopiedGit, setHasCopiedGit] = useState(false);
  const [isRecordingCustom, setIsRecordingCustom] = useState(false);
  const [recordDuration, setRecordDuration] = useState(0);
  const [statusNotification, setStatusNotification] = useState<string | null>(null);

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
      const newFile = new File([blob], `Studio_Recording_${Date.now()}.webm`, { type: 'audio/webm' });
      onUploadTrack(newFile);
      setStatusNotification('ভয়েস শো সফলভাবে রেকর্ড করা হয়েছে এবং লাইব্রেরিতে যোগ হয়েছে!');
      setTimeout(() => setStatusNotification(null), 3000);
    }
  };

  const handleSoundFx = (type: string, name: string) => {
    audioEngine.playSoundEffect(type);
    setStatusNotification(`স্টুডিও সাউন্ড এফেক্ট প্লে হয়েছে: ${name}`);
    setTimeout(() => setStatusNotification(null), 2000);
  };

  return (
    <div className="w-full space-y-6">
      {/* Studio Banner & Master On-Air Status */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div
              className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all ${
                isOnAir
                  ? 'bg-red-600 text-white shadow-lg shadow-red-600/30'
                  : 'bg-slate-800 text-slate-400'
              }`}
            >
              <RadioReceiver className="w-7 h-7" />
            </div>
            <div>
              <div className="flex items-center gap-3">
                <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                  মাস্টার ব্রডকাস্ট কন্ট্রোল রুম
                </h2>
                <div
                  className={`px-3 py-1 rounded text-xs font-mono font-bold uppercase tracking-wider ${
                    isOnAir
                      ? 'bg-red-600 text-white animate-pulse'
                      : 'bg-slate-800 text-slate-400'
                  }`}
                >
                  {isOnAir ? '● অন-এয়ার ট্রান্সমিটার সক্রিয়' : 'অফ-এয়ার'}
                </div>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                স্টেশন: রেডিও ডি-লিকন · বর্তমান সূচি: {currentProgram.title} ({currentProgram.host})
              </p>
            </div>
          </div>

          {/* Master Stream Toggle */}
          <div className="flex items-center gap-3">
            <button
              onClick={onToggleOnAir}
              className={`px-5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-lg ${
                isOnAir
                  ? 'bg-red-600 hover:bg-red-500 text-white shadow-red-600/20'
                  : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/20'
              }`}
            >
              {isOnAir ? 'ট্রান্সমিটার অফ করুন' : 'মাস্টার সম্প্রচার চালু করুন'}
            </button>
          </div>
        </div>

        {/* Studio Sub-Navigation */}
        <div className="flex items-center gap-2 mt-6 pt-6 border-t border-slate-800 overflow-x-auto">
          <button
            onClick={() => setStudioTab('console')}
            className={`px-4 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
              studioTab === 'console'
                ? 'bg-amber-500 text-slate-950 shadow-sm'
                : 'bg-slate-800/80 text-slate-300 hover:bg-slate-800 hover:text-white'
            }`}
          >
            লাইভ মাইক ও মিক্সার কনসোল
          </button>
          <button
            onClick={() => setStudioTab('schedule_mgmt')}
            className={`px-4 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
              studioTab === 'schedule_mgmt'
                ? 'bg-amber-500 text-slate-950 shadow-sm'
                : 'bg-slate-800/80 text-slate-300 hover:bg-slate-800 hover:text-white'
            }`}
          >
            প্রোগ্রাম শিডিউল পরিচালনা ({schedules.length})
          </button>
          <button
            onClick={() => setStudioTab('library')}
            className={`px-4 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
              studioTab === 'library'
                ? 'bg-amber-500 text-slate-950 shadow-sm'
                : 'bg-slate-800/80 text-slate-300 hover:bg-slate-800 hover:text-white'
            }`}
          >
            রেকর্ডেড শো ও অডিও ফাইল ({tracks.length})
          </button>
          <button
            onClick={() => setStudioTab('requests')}
            className={`px-4 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
              studioTab === 'requests'
                ? 'bg-amber-500 text-slate-950 shadow-sm'
                : 'bg-slate-800/80 text-slate-300 hover:bg-slate-800 hover:text-white'
            }`}
          >
            শ্রোতার গানের অনুরোধ ({requests.filter((r) => r.status === 'pending').length} নতুন)
          </button>
          <button
            onClick={() => setStudioTab('git')}
            className={`px-4 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer flex items-center gap-1.5 ${
              studioTab === 'git'
                ? 'bg-amber-500 text-slate-950 shadow-sm'
                : 'bg-slate-800/80 text-slate-300 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <GitBranch className="w-3.5 h-3.5" />
            <span>গিট ও ব্যাকআপ (Git)</span>
          </button>
        </div>
      </div>

      {statusNotification && (
        <div className="bg-emerald-950/80 border border-emerald-600/60 text-emerald-200 text-xs px-4 py-2.5 rounded-xl flex items-center gap-2 animate-fade-in shadow-lg">
          <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{statusNotification}</span>
        </div>
      )}

      {/* TAB 1: LIVE MIC & MIXER CONSOLE */}
      {studioTab === 'console' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* RJ Mic & Broadcast Section (7 cols) */}
          <div className="lg:col-span-7 bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <Mic className="w-5 h-5 text-amber-400" />
                  <span>উপস্থাপক / RJ মাইক্রোফোন কনসোল</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  মাইক্রোফোন অন করলেই শ্রোতারা আপনার লাইভ কণ্ঠ সরাসরি শুনতে পাবেন
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
                <span>{isLiveMicActive ? 'লাইভ মাইক মিউট করুন' : 'অন-এয়ার মাইক চালু'}</span>
              </button>
            </div>

            {/* Hardware Peak VU Meter */}
            <div className="bg-slate-950 rounded-xl p-4 border border-slate-800 space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400 font-medium">মাইক্রোফোন ইনপুট লেভেল (VU মিটার)</span>
                <span className="font-mono text-amber-400 tabular-nums">
                  {isLiveMicActive ? `${Math.round(micLevel * 100)} %` : 'OFF'}
                </span>
              </div>

              {/* Segmented LED Peak Bars */}
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

            {/* Mixer Faders */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-slate-950/60 rounded-xl p-4 border border-slate-800/80">
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

              <div className="bg-slate-950/60 rounded-xl p-4 border border-slate-800/80">
                <div className="flex items-center justify-between text-xs mb-2">
                  <span className="text-slate-300 font-medium">আবহ সঙ্গীত / ট্র্যাক ভলিউম</span>
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
            <div className="bg-slate-950/60 rounded-xl p-4 border border-slate-800/80 flex items-center justify-between">
              <div>
                <h4 className="text-sm font-semibold text-white">স্বয়ংক্রিয় অডিও ডাকিং (Auto-Ducking)</h4>
                <p className="text-xs text-slate-400 mt-0.5">
                  মাইকে কথা বলার সময় আবহ সঙ্গীত স্বয়ংক্রিয়ভাবে ৭০% কমে যাবে
                </p>
              </div>
              <button
                onClick={onToggleAutoDucking}
                className={`w-12 h-6 rounded-full transition-colors cursor-pointer relative p-0.5 ${
                  autoDucking ? 'bg-amber-500' : 'bg-slate-800'
                }`}
              >
                <div
                  className={`w-5 h-5 rounded-full bg-slate-950 transition-transform ${
                    autoDucking ? 'translate-x-6' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
          </div>

          {/* Soundboard FX & Jingles (5 cols) */}
          <div className="lg:col-span-5 bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
            <div>
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-amber-400" />
                <span>স্টুডিও সাউন্ডবোর্ড ও জিঙ্গেল</span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                লাইভ চলাকালীন ১-ক্লিকে স্টেশন সাউন্ড ইফেক্ট অন-এয়ার বাজান
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => handleSoundFx('station_id', 'রেডিও ডি-লিকন সিগনেচার টিউন')}
                className="p-4 bg-slate-800 hover:bg-slate-750 text-left rounded-xl border border-slate-700/80 hover:border-amber-500/50 transition-all cursor-pointer group"
              >
                <div className="text-xs font-mono text-amber-400 mb-1">JINGLE 01</div>
                <div className="text-sm font-bold text-white group-hover:text-amber-300">স্টেশন আইডি টিউন</div>
                <div className="text-[11px] text-slate-400 mt-1">ডি-লিকন সিগনেচার সুর</div>
              </button>

              <button
                onClick={() => handleSoundFx('applause', 'শ্রোতা করতালি ও উল্লাস')}
                className="p-4 bg-slate-800 hover:bg-slate-750 text-left rounded-xl border border-slate-700/80 hover:border-amber-500/50 transition-all cursor-pointer group"
              >
                <div className="text-xs font-mono text-amber-400 mb-1">FX 02</div>
                <div className="text-sm font-bold text-white group-hover:text-amber-300">শ্রোতা করতালি</div>
                <div className="text-[11px] text-slate-400 mt-1">লাইভ উল্লাস ও হাততালি</div>
              </button>

              <button
                onClick={() => handleSoundFx('gong', 'সংকেত ঘণ্টা / গং')}
                className="p-4 bg-slate-800 hover:bg-slate-750 text-left rounded-xl border border-slate-700/80 hover:border-amber-500/50 transition-all cursor-pointer group"
              >
                <div className="text-xs font-mono text-amber-400 mb-1">CHIME 03</div>
                <div className="text-sm font-bold text-white group-hover:text-amber-300">সংকেত ঘণ্টা</div>
                <div className="text-[11px] text-slate-400 mt-1">ঘণ্টার শুরু ও সমাপ্তি</div>
              </button>

              <button
                onClick={() => handleSoundFx('sweep', 'ফ্রিকোয়েন্সি সুইপ')}
                className="p-4 bg-slate-800 hover:bg-slate-750 text-left rounded-xl border border-slate-700/80 hover:border-amber-500/50 transition-all cursor-pointer group"
              >
                <div className="text-xs font-mono text-amber-400 mb-1">SWEEP 04</div>
                <div className="text-sm font-bold text-white group-hover:text-amber-300">রেডিও হুইসল</div>
                <div className="text-[11px] text-slate-400 mt-1">ট্রানজিশন সুইপ এফেক্ট</div>
              </button>
            </div>

            {/* Quick Record Studio Announcement */}
            <div className="bg-slate-950 rounded-xl p-4 border border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                    তাত্ক্ষণিক ভয়েস শো রেকর্ডার
                  </h4>
                  <p className="text-[11px] text-slate-400">
                    রেকর্ড করে সরাসরি শিডিউলে বা লাইব্রেরিতে যুক্ত করুন
                  </p>
                </div>
                {isRecordingCustom && (
                  <span className="font-mono text-xs text-red-400 font-bold animate-pulse tabular-nums">
                    REC: {recordDuration}s
                  </span>
                )}
              </div>

              {isRecordingCustom ? (
                <button
                  onClick={handleStopVoiceRecord}
                  className="w-full py-2.5 bg-red-600 hover:bg-red-500 text-white font-bold text-xs rounded-lg transition-colors cursor-pointer"
                >
                  রেকর্ডিং সম্পন্ন ও লাইব্রেরিতে সংরক্ষণ করুন
                </button>
              ) : (
                <button
                  onClick={handleStartVoiceRecord}
                  className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs rounded-lg transition-colors cursor-pointer border border-slate-700"
                >
                  নতুন ভয়েস ক্লিপ রেকর্ড শুরু করুন
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: SCHEDULE MANAGEMENT */}
      {studioTab === 'schedule_mgmt' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between mb-2">
            <div>
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Calendar className="w-5 h-5 text-amber-400" />
                <span>রেডিও ডি-লিকন প্রোগ্রাম শিডিউলার</span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                কোন সময় লাইভ হবে আর কোন সময় পূর্ব-রেকর্ডেড শো সম্প্রচার হবে তা নির্ধারণ করুন
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

          <div className="space-y-3">
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
                      {prog.type === 'live' ? 'লাইভ সম্প্রচার' : 'রেকর্ডেড অডিও'}
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
                    title="মুছে ফেলুন"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: RECORDED AUDIO & SHOW LIBRARY */}
      {studioTab === 'library' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <FileAudio className="w-5 h-5 text-amber-400" />
                <span>রেকর্ডেড শো ও অডিও সংগ্রহ</span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                আপনার নিজের অডিও ফাইল (.mp3, .wav) আপলোড করুন অথবা স্টুডিওতে সরাসরি প্লে করুন
              </p>
            </div>

            {onOpenUploadModal ? (
              <button
                onClick={onOpenUploadModal}
                className="flex items-center gap-2 px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl transition-colors cursor-pointer shrink-0 shadow-md shadow-amber-500/20"
              >
                <Upload className="w-4 h-4" />
                <span>নতুন অডিও ফাইল আপলোড করুন</span>
              </button>
            ) : (
              <label className="flex items-center gap-2 px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl transition-colors cursor-pointer shrink-0">
                <Upload className="w-4 h-4" />
                <span>অডিও ফাইল আপলোড (.mp3 / .wav)</span>
                <input
                  type="file"
                  accept="audio/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      onUploadTrack(file);
                      setStatusNotification(`"${file.name}" সফলভাবে যুক্ত হয়েছে!`);
                      setTimeout(() => setStatusNotification(null), 3000);
                    }
                  }}
                />
              </label>
            )}
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
                  <h4 className="text-sm font-bold text-white mb-1">{track.title}</h4>
                  <p className="text-xs text-slate-400">{track.artist}</p>
                  {track.description && (
                    <p className="text-[11px] text-slate-400 mt-2 line-clamp-2">{track.description}</p>
                  )}
                </div>

                <div className="pt-4 mt-4 border-t border-slate-800/60 flex items-center justify-between">
                  <span className="text-[10px] text-slate-400">
                    {track.isUploaded ? 'ইউজার আপলোড' : 'স্টুডিও জেনারেটেড'}
                  </span>
                  <button
                    onClick={() => {
                      onSelectTrackToPlay(track);
                      setStatusNotification(`"${track.title}" সম্প্রচারে প্লে করা শুরু হয়েছে!`);
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

      {/* TAB 4: LISTENER REQUESTS INBOX */}
      {studioTab === 'requests' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
          <div>
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-amber-400" />
              <span>শ্রোতাদের গানের অনুরোধ ইনবক্স</span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              শ্রোতাদের পাঠানো গান ও বার্তার তালিকা দেখুন ও অন-এয়ার বাজানোর জন্য অনুমোদন করুন
            </p>
          </div>

          <div className="space-y-3">
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
                    <span className="text-xs text-slate-400">{req.timestamp}</span>
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
                      onClick={() => onUpdateReqStatus(req.id, 'approved')}
                      className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs rounded-lg transition-colors cursor-pointer"
                    >
                      অনুমোদন করুন
                    </button>
                  )}
                  {req.status === 'approved' && (
                    <button
                      onClick={() => onUpdateReqStatus(req.id, 'played')}
                      className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold text-xs rounded-lg transition-colors cursor-pointer"
                    >
                      বাজানো হয়েছে মার্ক করুন
                    </button>
                  )}
                  {req.status === 'played' && (
                    <span className="text-xs text-slate-400 font-medium">বাজানো সম্পন্ন</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 5: GIT & CLOUD BACKUP */}
      {studioTab === 'git' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <GitBranch className="w-5 h-5 text-amber-400" />
                <span>গিট ও ক্লাউড ভার্সন কন্ট্রোল (Git Integration)</span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                রেডিও ডি-লিকনের সম্পূর্ণ সোর্স কোড গিট ভার্সন কন্ট্রোলে প্রস্তুত করা হয়েছে
              </p>
            </div>

            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-950/80 border border-emerald-600/60 text-emerald-300 text-xs font-semibold">
              <Check className="w-3.5 h-3.5" />
              <span>Git Initialized (.git)</span>
            </div>
          </div>

          {/* Git Repository Overview Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-slate-950/70 border border-slate-800/80 rounded-xl p-4">
              <span className="text-[11px] text-slate-400 font-medium">রিপোজিটরি স্ট্যাটাস</span>
              <p className="text-sm font-bold text-white mt-1">সক্রিয় (Active)</p>
              <span className="text-[10px] text-emerald-400 font-mono mt-0.5 block">লোকাল গিট প্রস্তুত</span>
            </div>

            <div className="bg-slate-950/70 border border-slate-800/80 rounded-xl p-4">
              <span className="text-[11px] text-slate-400 font-medium">প্রধান ব্রাঞ্চ (Branch)</span>
              <p className="text-sm font-bold text-amber-400 font-mono mt-1">main</p>
              <span className="text-[10px] text-slate-400 font-mono mt-0.5 block">ডিফল্ট ব্রাঞ্চ</span>
            </div>

            <div className="bg-slate-950/70 border border-slate-800/80 rounded-xl p-4">
              <span className="text-[11px] text-slate-400 font-medium">কমিট করা ফাইল সংখ্যা</span>
              <p className="text-sm font-bold text-white font-mono mt-1">৩১টি ফাইল</p>
              <span className="text-[10px] text-slate-400 font-mono mt-0.5 block">রুট ও সোর্স কোড</span>
            </div>

            <div className="bg-slate-950/70 border border-slate-800/80 rounded-xl p-4">
              <span className="text-[11px] text-slate-400 font-medium">সর্বশেষ কমিট</span>
              <p className="text-xs font-bold text-slate-200 mt-1 truncate">Initial commit</p>
              <span className="text-[10px] text-slate-400 font-mono mt-0.5 block">Radio D-Leacon</span>
            </div>
          </div>

          {/* GitHub / Remote Push Instructions */}
          <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-5 space-y-4">
            <div>
              <h4 className="text-sm font-bold text-white flex items-center gap-2">
                <Terminal className="w-4 h-4 text-amber-400" />
                <span>GitHub / GitLab-এ রিমোট যুক্ত ও পুশ করার নির্দেশাবলী</span>
              </h4>
              <p className="text-xs text-slate-400 mt-0.5">
                আপনার GitHub-এ একটি নতুন খালি রিপোজিটরি তৈরি করে নিচের কমান্ডগুলো চালান
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                আপনার GitHub রিপোজিটরি URL (Repository URL)
              </label>
              <input
                type="text"
                value={repoUrl}
                onChange={(e) => setRepoUrl(e.target.value)}
                placeholder="https://github.com/your-username/radio-d-leacon.git"
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2 text-xs font-mono text-white focus:outline-none focus:border-amber-500"
              />
            </div>

            {/* Generated Git Commands Box */}
            <div className="relative bg-slate-900 rounded-xl p-4 border border-slate-800/80 font-mono text-xs text-slate-300 space-y-1">
              <div className="text-slate-500 mb-2"># টার্মিনালে নিচের কমান্ডগুলো রান করুন:</div>
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

            {/* Step-by-Step Guide in Bengali */}
            <div className="bg-slate-900/50 rounded-xl p-4 border border-slate-800/60 space-y-2 text-xs text-slate-300">
              <h5 className="font-bold text-white text-xs">সহজ ৩টি ধাপ:</h5>
              <ol className="list-decimal list-inside space-y-1 text-slate-300">
                <li><strong className="text-amber-300">ধাপ ১:</strong> GitHub এ যান এবং একটি New Repository তৈরি করুন (কোনো README বা .gitignore টিক দেবেন না)।</li>
                <li><strong className="text-amber-300">ধাপ ২:</strong> রিপোজিটরির HTTPS বা SSH লিঙ্কটি উপরের বক্সে পেস্ট করে কপি বাটনে ক্লিক করুন।</li>
                <li><strong className="text-amber-300">ধাপ ৩:</strong> টার্মিনালে কমান্ডটি রান করলেই সম্পূর্ণ রেডিও ডি-লিকন প্রজেক্ট গিটহাবে পুশ হয়ে যাবে।</li>
              </ol>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
