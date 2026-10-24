import React, { useState, useRef } from 'react';
import {
  Upload,
  X,
  FileAudio,
  Play,
  Pause,
  Radio,
  Calendar,
  CheckCircle2,
  Music,
  Plus,
  Trash2,
  ArrowUp,
  ArrowDown,
  Layers,
  Clock,
} from 'lucide-react';
import { AudioTrack, ScheduledProgram } from '../../types/radio';
import { storeAudioBlob } from '../../services/audioStorageDB';

export interface ShowSessionPayload {
  showTitle: string;
  host: string;
  category: string;
  description: string;
  tracks: AudioTrack[];
  scheduleTime?: {
    startTime: string;
    endTime: string;
    daysOfWeek: number[];
  };
}

interface AudioUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSessionUploaded: (payload: ShowSessionPayload, playImmediately: boolean) => void;
  existingShows?: ScheduledProgram[];
}

interface SelectedFileItem {
  id: string;
  file: File;
  title: string;
  artist: string;
  duration: number;
  url: string;
}

export const AudioUploadModal: React.FC<AudioUploadModalProps> = ({
  isOpen,
  onClose,
  onSessionUploaded,
  existingShows = [],
}) => {
  const [dragOver, setDragOver] = useState(false);
  const [showTitle, setShowTitle] = useState('');
  const [host, setHost] = useState('রেডিও ডি-লিকন সঞ্চালক');
  const [category, setCategory] = useState('সঙ্গীত');
  const [description, setDescription] = useState('');

  // List of songs uploaded for this session
  const [songList, setSongList] = useState<SelectedFileItem[]>([]);

  // Preview state
  const [playingSongId, setPlayingSongId] = useState<string | null>(null);
  const audioPreviewRef = useRef<HTMLAudioElement | null>(null);

  // Scheduling options
  const [shouldSchedule, setShouldSchedule] = useState(false);
  const [startTime, setStartTime] = useState('18:00');
  const [endTime, setEndTime] = useState('20:00');
  const [selectedDays, setSelectedDays] = useState<number[]>([0, 1, 2, 3, 4, 5, 6]);

  const [isProcessing, setIsProcessing] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  if (!isOpen) return null;

  const handleFilesAdded = (files: FileList | File[]) => {
    const validFiles: File[] = [];
    for (let i = 0; i < files.length; i++) {
      const f = files[i];
      if (f.type.startsWith('audio/') || f.name.match(/\.(mp3|wav|m4a|aac|ogg|flac|webm)$/i)) {
        validFiles.push(f);
      }
    }

    if (validFiles.length === 0) {
      alert('অনুগ্রহ করে সঠিক অডিও ফাইল (.mp3, .wav, .m4a, .aac, .ogg) নির্বাচন করুন।');
      return;
    }

    // Default show title if empty
    if (!showTitle.trim()) {
      setShowTitle('বিশেষ সঙ্গীত আসর ও সুরের মেলা');
    }

    const newItems: SelectedFileItem[] = validFiles.map((file, idx) => {
      const url = URL.createObjectURL(file);
      const cleanName = file.name.replace(/\.[^/.]+$/, '');
      const tempId = `song-${Date.now()}-${idx}-${Math.random().toString(36).substring(2, 6)}`;

      // Calculate duration asynchronously
      const tempAudio = new Audio(url);
      tempAudio.onloadedmetadata = () => {
        if (!isNaN(tempAudio.duration) && tempAudio.duration > 0) {
          setSongList((prev) =>
            prev.map((item) => (item.id === tempId ? { ...item, duration: Math.round(tempAudio.duration) } : item))
          );
        }
      };

      return {
        id: tempId,
        file,
        title: cleanName,
        artist: host || 'রেডিও ডি-লিকন',
        duration: 210, // default placeholder until metadata loads
        url,
      };
    });

    setSongList((prev) => [...prev, ...newItems]);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFilesAdded(e.dataTransfer.files);
    }
  };

  const removeSong = (id: string) => {
    if (playingSongId === id && audioPreviewRef.current) {
      audioPreviewRef.current.pause();
      setPlayingSongId(null);
    }
    setSongList((prev) => prev.filter((s) => s.id !== id));
  };

  const moveSong = (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= songList.length) return;

    const updated = [...songList];
    const temp = updated[index];
    updated[index] = updated[targetIndex];
    updated[targetIndex] = temp;
    setSongList(updated);
  };

  const togglePreview = (item: SelectedFileItem) => {
    if (playingSongId === item.id) {
      audioPreviewRef.current?.pause();
      setPlayingSongId(null);
    } else {
      if (audioPreviewRef.current) {
        audioPreviewRef.current.src = item.url;
        audioPreviewRef.current.play().then(() => {
          setPlayingSongId(item.id);
        }).catch(() => {
          setPlayingSongId(null);
        });
      }
    }
  };

  const totalRuntimeSeconds = songList.reduce((acc, curr) => acc + curr.duration, 0);

  const formatSeconds = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const secs = sec % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const handleSelectExistingShow = (id: string) => {
    const found = existingShows.find((s) => s.id === id);
    if (found) {
      setShowTitle(found.title);
      setHost(found.host);
      setCategory(found.category);
      setDescription(found.description);
      setStartTime(found.startTime);
      setEndTime(found.endTime);
      setSelectedDays(found.daysOfWeek);
    }
  };

  const handleSubmit = async (playImmediately: boolean) => {
    if (!showTitle.trim()) {
      alert('অনুগ্রহ করে অনুষ্ঠানের একটি নাম লিখুন।');
      return;
    }
    if (songList.length === 0) {
      alert('অনুগ্রহ করে এই অনুষ্ঠানের জন্য কমপক্ষে একটি গান বা অডিও ফাইল আপলোড করুন।');
      return;
    }

    setIsProcessing(true);

    // Save all audio blobs to IndexedDB
    const convertedTracks: AudioTrack[] = [];
    const showId = `session-${Date.now()}`;

    for (let i = 0; i < songList.length; i++) {
      const item = songList[i];
      const trackId = `track-user-${Date.now()}-${i}`;
      await storeAudioBlob(trackId, item.file, item.file.name);

      convertedTracks.push({
        id: trackId,
        title: item.title.trim() || item.file.name.replace(/\.[^/.]+$/, ''),
        artist: item.artist.trim() || host.trim() || 'রেডিও ডি-লিকন',
        duration: item.duration,
        category,
        audioUrl: item.url,
        isUploaded: true,
        showId,
        showTitle: showTitle.trim(),
        trackOrder: i + 1,
        description: `${showTitle.trim()} অধিবেশনের গান ${i + 1}`,
        coverArt: '/src/assets/images/radio_album_art_1791833789333.jpg',
      });
    }

    const payload: ShowSessionPayload = {
      showTitle: showTitle.trim(),
      host: host.trim() || 'রেডিও ডি-লিকন উপস্থাপক',
      category,
      description: description.trim() || `রেডিও ডি-লিকনে বিশেষ অধিবেশন: ${showTitle.trim()} (${convertedTracks.length}টি গান)`,
      tracks: convertedTracks,
      scheduleTime: shouldSchedule
        ? {
            startTime,
            endTime,
            daysOfWeek: selectedDays,
          }
        : undefined,
    };

    setIsProcessing(false);
    setUploadSuccess(true);

    if (audioPreviewRef.current) {
      audioPreviewRef.current.pause();
    }

    setTimeout(() => {
      setUploadSuccess(false);
      onSessionUploaded(payload, playImmediately);
      onClose();
    }, 800);
  };

  const daysList = [
    { label: 'রবি', val: 0 },
    { label: 'সোম', val: 1 },
    { label: 'মঙ্গল', val: 2 },
    { label: 'বুধ', val: 3 },
    { label: 'বৃহস্পতি', val: 4 },
    { label: 'শুক্র', val: 5 },
    { label: 'শনি', val: 6 },
  ];

  const toggleDay = (val: number) => {
    if (selectedDays.includes(val)) {
      if (selectedDays.length > 1) {
        setSelectedDays(selectedDays.filter((d) => d !== val));
      }
    } else {
      setSelectedDays([...selectedDays, val].sort());
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-800 bg-slate-950 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center text-amber-400">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">অনুষ্ঠানের নামে গান আপলোড ও অধিবেশন তৈরি</h3>
              <p className="text-xs text-slate-400">একটি নির্দিষ্ট অনুষ্ঠানের অধীনে একাধিক গান একসাথে যোগ ও সম্প্রচার করুন</p>
            </div>
          </div>
          <button
            onClick={() => {
              if (audioPreviewRef.current) audioPreviewRef.current.pause();
              onClose();
            }}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <audio ref={audioPreviewRef} onEnded={() => setPlayingSongId(null)} className="hidden" />

        {uploadSuccess ? (
          <div className="p-12 text-center space-y-3">
            <CheckCircle2 className="w-14 h-14 text-emerald-400 mx-auto animate-bounce" />
            <h4 className="text-lg font-bold text-white">অনুষ্ঠান ও গানের তালিকা সফলভাবে সংরক্ষিত হয়েছে!</h4>
            <p className="text-xs text-slate-300">
              "{showTitle}" অধিবেশনে {songList.length}টি গান প্রস্তুত করা হচ্ছে...
            </p>
          </div>
        ) : (
          <div className="p-5 sm:p-6 overflow-y-auto space-y-6 flex-1">
            {/* Step 1: Program/Session Information */}
            <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-4 space-y-3.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-amber-400 uppercase tracking-wider">
                  ১. অনুষ্ঠানের বিবরণ (Session Details)
                </span>
                {existingShows.length > 0 && (
                  <select
                    onChange={(e) => {
                      if (e.target.value) handleSelectExistingShow(e.target.value);
                    }}
                    className="text-xs bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1 text-slate-300 focus:outline-none focus:border-amber-500"
                  >
                    <option value="">পূর্ববর্তী শিডিউল থেকে বাছুন...</option>
                    {existingShows.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.title} ({s.host})
                      </option>
                    ))}
                  </select>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  অনুষ্ঠানের নাম (Program / Show Name) *
                </label>
                <input
                  type="text"
                  required
                  value={showTitle}
                  onChange={(e) => setShowTitle(e.target.value)}
                  placeholder="যেমন: সন্ধ্যাতারা সঙ্গীত আসর / সুরের ঝর্ণাধারা / রবীন্দ্র সন্ধ্যা"
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    উপস্থাপক / আরজে (Host / Presenter)
                  </label>
                  <input
                    type="text"
                    value={host}
                    onChange={(e) => setHost(e.target.value)}
                    placeholder="যেমন: আরজে তানভীর"
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    বিভাগ (Category)
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-amber-500"
                  >
                    <option value="সঙ্গীত">সঙ্গীত ও গান</option>
                    <option value="সাহিত্য ও আবৃত্তি">সাহিত্য ও আবৃত্তি</option>
                    <option value="টকশো ও আড্ডা">টকশো ও আড্ডা</option>
                    <option value="খবর ও কারেন্ট অ্যাফেয়ার্স">খবর ও সংবাদ</option>
                    <option value="বিশেষ অনুষ্ঠান">বিশেষ উৎসব বা আসর</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  অনুষ্ঠানের পরিচিতি বা নোট (ঐচ্ছিক)
                </label>
                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="এই অধিবেশনের সংক্ষিপ্ত পরিচিতি..."
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>

            {/* Step 2: Multi-file Upload Zone */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Music className="w-3.5 h-3.5" />
                  <span>২. এই অধিবেশনে গানসমূহ যোগ করুন ({songList.length}টি গান নির্বাচিত)</span>
                </span>
                {songList.length > 0 && (
                  <span className="text-xs font-mono text-slate-400 tabular-nums">
                    মোট সময়: {formatSeconds(totalRuntimeSeconds)} মিনিট
                  </span>
                )}
              </div>

              {/* Dropzone */}
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setDragOver(true);
                }}
                onDragLeave={() => setDragOver(false)}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-xl p-5 text-center cursor-pointer transition-all ${
                  dragOver
                    ? 'border-amber-400 bg-amber-500/10'
                    : 'border-slate-700 bg-slate-950/60 hover:border-amber-500/60 hover:bg-slate-950'
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept="audio/*,.mp3,.wav,.m4a,.aac,.ogg,.flac,.webm"
                  className="hidden"
                  onChange={(e) => {
                    if (e.target.files) handleFilesAdded(e.target.files);
                  }}
                />

                <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center text-amber-400 shrink-0">
                    <Plus className="w-5 h-5" />
                  </div>
                  <div className="text-center sm:text-left">
                    <h5 className="text-sm font-bold text-white">
                      এক বা একাধিক অডিও ফাইল নির্বাচন করুন
                    </h5>
                    <p className="text-[11px] text-slate-400">
                      কন্ট্রোল (Ctrl/Cmd) চেপে একসাথে কয়েকটি MP3 বা WAV ফাইল সিলেক্ট করতে পারেন
                    </p>
                  </div>
                  <span className="ml-auto px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-amber-300 font-semibold text-xs rounded-lg border border-slate-700">
                    + ফাইল বাছুন
                  </span>
                </div>
              </div>

              {/* Uploaded Song List for this Session */}
              {songList.length > 0 && (
                <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                  {songList.map((item, idx) => {
                    const isPreviewing = playingSongId === item.id;
                    return (
                      <div
                        key={item.id}
                        className="bg-slate-950 border border-slate-800 rounded-xl p-3 flex items-center justify-between gap-3 group hover:border-slate-700 transition-colors"
                      >
                        <div className="flex items-center gap-3 min-w-0 flex-1">
                          {/* Order number */}
                          <span className="w-6 h-6 rounded-full bg-slate-800 text-slate-300 text-xs font-mono font-bold flex items-center justify-center shrink-0">
                            {idx + 1}
                          </span>

                          {/* Preview Play Button */}
                          <button
                            type="button"
                            onClick={() => togglePreview(item)}
                            className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-amber-500 hover:text-slate-950 text-amber-400 flex items-center justify-center transition-colors cursor-pointer shrink-0"
                            title={isPreviewing ? 'পজ করুন' : 'গানটি শুনুন'}
                          >
                            {isPreviewing ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 fill-current ml-0.5" />}
                          </button>

                          {/* Editable Title & Artist */}
                          <div className="min-w-0 flex-1 space-y-1">
                            <input
                              type="text"
                              value={item.title}
                              onChange={(e) => {
                                const val = e.target.value;
                                setSongList((prev) =>
                                  prev.map((s) => (s.id === item.id ? { ...s, title: val } : s))
                                );
                              }}
                              placeholder="গানের নাম"
                              className="w-full bg-transparent text-xs font-bold text-white border-b border-transparent hover:border-slate-700 focus:border-amber-400 focus:outline-none py-0.5 truncate"
                            />
                            <div className="flex items-center gap-2 text-[10px] text-slate-400">
                              <input
                                type="text"
                                value={item.artist}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  setSongList((prev) =>
                                    prev.map((s) => (s.id === item.id ? { ...s, artist: val } : s))
                                  );
                                }}
                                placeholder="শিল্পী / ব্যান্ড"
                                className="bg-transparent text-[11px] text-slate-400 border-b border-transparent hover:border-slate-700 focus:border-amber-400 focus:outline-none py-0.5 w-36 truncate"
                              />
                              <span aria-hidden="true">·</span>
                              <span className="font-mono tabular-nums">{formatSeconds(item.duration)}</span>
                            </div>
                          </div>
                        </div>

                        {/* Order & Remove actions */}
                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            type="button"
                            disabled={idx === 0}
                            onClick={() => moveSong(idx, 'up')}
                            className="p-1 text-slate-400 hover:text-white disabled:opacity-20 cursor-pointer"
                            title="উপরে নিন"
                          >
                            <ArrowUp className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            disabled={idx === songList.length - 1}
                            onClick={() => moveSong(idx, 'down')}
                            className="p-1 text-slate-400 hover:text-white disabled:opacity-20 cursor-pointer"
                            title="নিচে নিন"
                          >
                            <ArrowDown className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => removeSong(item.id)}
                            className="p-1 text-slate-400 hover:text-red-400 transition-colors cursor-pointer ml-1"
                            title="তালিকা থেকে বাদ দিন"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Step 3: Advance Scheduling (Optional) */}
            <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h5 className="text-xs font-bold text-white flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-amber-400" />
                    <span>অনুষ্ঠানসূচিতে শিডিউল সেট করবেন? (ঐচ্ছিক)</span>
                  </h5>
                  <p className="text-[11px] text-slate-400">
                    নির্দিষ্ট সময়ে পুরো এই অধিবেশন স্বয়ংক্রিয়ভাবে অন-এয়ার বাজবে
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setShouldSchedule(!shouldSchedule)}
                  className={`w-11 h-6 rounded-full transition-colors cursor-pointer relative p-0.5 ${
                    shouldSchedule ? 'bg-amber-500' : 'bg-slate-800'
                  }`}
                >
                  <div
                    className={`w-5 h-5 rounded-full bg-slate-950 transition-transform ${
                      shouldSchedule ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              {shouldSchedule && (
                <div className="pt-3 border-t border-slate-800 space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                        শুরুর সময় (24H)
                      </label>
                      <input
                        type="time"
                        value={startTime}
                        onChange={(e) => setStartTime(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-amber-500"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                        সমাপ্তির সময় (24H)
                      </label>
                      <input
                        type="time"
                        value={endTime}
                        onChange={(e) => setEndTime(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-amber-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                      সম্প্রচারের দিনসমূহ
                    </label>
                    <div className="flex flex-wrap gap-1.5">
                      {daysList.map((d) => {
                        const isSel = selectedDays.includes(d.val);
                        return (
                          <button
                            key={d.val}
                            type="button"
                            onClick={() => toggleDay(d.val)}
                            className={`px-2.5 py-1 rounded text-xs font-medium cursor-pointer transition-colors ${
                              isSel ? 'bg-amber-500 text-slate-950 font-bold' : 'bg-slate-900 text-slate-400 hover:text-white'
                            }`}
                          >
                            {d.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Footer Actions */}
        {!uploadSuccess && (
          <div className="p-4 sm:p-5 border-t border-slate-800 bg-slate-950 shrink-0 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="text-xs text-slate-400">
              {songList.length > 0 ? (
                <span>
                  <strong className="text-amber-300">{songList.length}টি গান</strong> "{showTitle || 'অধিবেশন'}"-এ অন্তর্ভুক্ত
                </span>
              ) : (
                <span>অনুষ্ঠানের নাম দিয়ে গান সিলেক্ট করুন</span>
              )}
            </div>

            <div className="flex items-center gap-3 w-full sm:w-auto">
              {/* Save Only */}
              <button
                type="button"
                disabled={isProcessing || songList.length === 0}
                onClick={() => handleSubmit(false)}
                className="flex-1 sm:flex-none px-4 py-2.5 bg-slate-800 hover:bg-slate-750 disabled:opacity-40 text-slate-200 text-xs font-semibold rounded-xl transition-colors cursor-pointer border border-slate-700"
              >
                সংরক্ষণ করুন
              </button>

              {/* Play Immediately On-Air in Continuous Loop */}
              <button
                type="button"
                disabled={isProcessing || songList.length === 0}
                onClick={() => handleSubmit(true)}
                className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-2.5 bg-amber-500 hover:bg-amber-400 disabled:opacity-40 text-slate-950 text-xs font-bold rounded-xl transition-all cursor-pointer shadow-lg shadow-amber-500/20 active:scale-95"
                title="কোনো শিডিউল নির্ধারণ ছাড়াই গানগুলো একের পর এক নিরবচ্ছিন্ন লুপে অন-এয়ার বাজবে"
              >
                <Radio className="w-4 h-4" />
                <span>এখনই নন-স্টপ লুপে অন-এয়ার বাজান</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
