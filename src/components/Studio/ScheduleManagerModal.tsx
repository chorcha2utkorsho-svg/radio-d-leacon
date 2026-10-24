import React, { useState } from 'react';
import {
  X,
  Calendar,
  Clock,
  Disc3,
  Mic,
  ListMusic,
  CheckSquare,
  Square,
  Sparkles,
  Layers,
  FileAudio,
} from 'lucide-react';
import { ScheduledProgram, BroadcastType, ProgramCategory, AudioTrack } from '../../types/radio';

interface ScheduleManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddSchedule: (schedule: ScheduledProgram) => void;
  tracks: AudioTrack[];
}

export const ScheduleManagerModal: React.FC<ScheduleManagerModalProps> = ({
  isOpen,
  onClose,
  onAddSchedule,
  tracks,
}) => {
  const uploadedTracks = tracks.filter((t) => t.isUploaded);

  const [title, setTitle] = useState('');
  const [host, setHost] = useState('');
  const [category, setCategory] = useState<ProgramCategory>('সঙ্গীত');
  const [startTime, setStartTime] = useState('00:00');
  const [endTime, setEndTime] = useState('23:59');
  const [type, setType] = useState<BroadcastType>('recorded');

  // Track selection mode: 'playlist' (multi-song auto-play) vs 'single'
  const [playoutMode, setPlayoutMode] = useState<'playlist' | 'single'>('playlist');
  const [selectedTrackId, setSelectedTrackId] = useState<string>(tracks[0]?.id || '');

  // Default select all uploaded tracks if available, else first few tracks
  const [selectedPlaylistIds, setSelectedPlaylistIds] = useState<string[]>(() => {
    if (uploadedTracks.length > 0) {
      return uploadedTracks.map((t) => t.id);
    }
    return tracks.slice(0, 3).map((t) => t.id);
  });

  const [description, setDescription] = useState('');
  const [selectedDays, setSelectedDays] = useState<number[]>([0, 1, 2, 3, 4, 5, 6]);

  if (!isOpen) return null;

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

  const toggleTrackInPlaylist = (trackId: string) => {
    if (selectedPlaylistIds.includes(trackId)) {
      if (selectedPlaylistIds.length > 1) {
        setSelectedPlaylistIds(selectedPlaylistIds.filter((id) => id !== trackId));
      }
    } else {
      setSelectedPlaylistIds([...selectedPlaylistIds, trackId]);
    }
  };

  const handleSelectAllUploaded = () => {
    if (uploadedTracks.length > 0) {
      setSelectedPlaylistIds(uploadedTracks.map((t) => t.id));
    } else {
      setSelectedPlaylistIds(tracks.map((t) => t.id));
    }
  };

  const handleApplyPreset = (preset: 'allDay' | 'morning' | 'afternoon' | 'evening' | 'night') => {
    if (preset === 'allDay') {
      setStartTime('00:00');
      setEndTime('23:59');
      if (!title) setTitle('সারাদিনের অটো-রিপ্লে প্লেলিস্ট (Auto-DJ)');
      if (!host) setHost('রেডিও ডি-লিকন অটোমেশন');
      if (!description) setDescription('ব্রডকাস্টারের আপলোড করা গানগুলো সারাদিন একটার পর একটা অবিরাম বাজবে।');
      setPlayoutMode('playlist');
      handleSelectAllUploaded();
    } else if (preset === 'morning') {
      setStartTime('06:00');
      setEndTime('12:00');
      if (!title) setTitle('সকালের সঙ্গীত আসর');
    } else if (preset === 'afternoon') {
      setStartTime('12:00');
      setEndTime('18:00');
      if (!title) setTitle('দুপুরের নির্বাচিত কথামালা ও গান');
    } else if (preset === 'evening') {
      setStartTime('18:00');
      setEndTime('22:00');
      if (!title) setTitle('সন্ধ্যার বিশেষ বাসর');
    } else if (preset === 'night') {
      setStartTime('22:00');
      setEndTime('06:00');
      if (!title) setTitle('রাতজাগা সুর ও আবৃত্তি');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !host.trim()) return;

    const isPlaylist = type === 'recorded' && playoutMode === 'playlist' && selectedPlaylistIds.length > 0;
    const effectivePlaylist = isPlaylist ? selectedPlaylistIds : undefined;
    const effectiveTrackId = isPlaylist ? selectedPlaylistIds[0] : (type === 'recorded' ? selectedTrackId : undefined);

    const newProg: ScheduledProgram = {
      id: `prog-user-${Date.now()}`,
      title: title.trim(),
      host: host.trim(),
      category,
      startTime,
      endTime,
      type,
      trackId: effectiveTrackId,
      playlistTrackIds: effectivePlaylist,
      description: description.trim() || (isPlaylist ? `অটো-প্লেলিস্ট: ${selectedPlaylistIds.length}টি গান পর্যায়ক্রমে বাজবে` : 'রেডিও ডি-লিকনের নিয়মিত সম্প্রচার সূচি।'),
      daysOfWeek: selectedDays,
      coverImage: '/src/assets/images/radio_studio_console_1791833776471.jpg',
    };

    onAddSchedule(newProg);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-xl overflow-hidden shadow-2xl">
        <div className="flex items-center justify-between p-6 border-b border-slate-800 bg-slate-950">
          <div className="flex items-center gap-2.5">
            <Calendar className="w-5 h-5 text-amber-400" />
            <div>
              <h3 className="text-lg font-bold text-white">নতুন অনুষ্ঠান শিডিউল করুন</h3>
              <p className="text-[11px] text-slate-400">আপলোডকৃত অডিও দিয়ে সারাদিনের অটো-রিপ্লে বা নির্দিষ্ট স্লট তৈরি করুন</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
          {/* Quick Schedule Presets */}
          <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-800">
            <div className="text-[11px] font-semibold text-amber-400 mb-2 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" />
              <span>দ্রুত শিডিউল প্রিসেট (Quick Presets):</span>
            </div>
            <div className="flex flex-wrap gap-1.5 text-xs">
              <button
                type="button"
                onClick={() => handleApplyPreset('allDay')}
                className="px-2.5 py-1 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 rounded-lg font-semibold transition-all cursor-pointer"
                title="আজ সারাদিন লাইভে না থাকলে সব গান অটো-প্লে করতে এটি সিলেক্ট করুন"
              >
                ☀️ সারাদিন অটো-রিপ্লে (00:00 - 23:59)
              </button>
              <button
                type="button"
                onClick={() => handleApplyPreset('morning')}
                className="px-2 py-1 bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 rounded-lg transition-all cursor-pointer"
              >
                সকাল (০৬:০০ - ১২:০০)
              </button>
              <button
                type="button"
                onClick={() => handleApplyPreset('afternoon')}
                className="px-2 py-1 bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 rounded-lg transition-all cursor-pointer"
              >
                দুপুর (১২:০০ - ১৮:০০)
              </button>
              <button
                type="button"
                onClick={() => handleApplyPreset('evening')}
                className="px-2 py-1 bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 rounded-lg transition-all cursor-pointer"
              >
                সন্ধ্যা (১৮:০০ - ২২:০০)
              </button>
            </div>
          </div>

          {/* Title */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">অনুষ্ঠানের নাম *</label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="যেমন: সারাদিনের বিশেষ সঙ্গীত বাসর"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-amber-500"
            />
          </div>

          {/* Host & Category */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">উপস্থাপক / আরজে *</label>
              <input
                type="text"
                required
                value={host}
                onChange={(e) => setHost(e.target.value)}
                placeholder="যেমন: আরজে সুমাইয়া / রেডিও অটোমেশন"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-amber-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">বিভাগ</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as ProgramCategory)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-amber-500"
              >
                <option value="সঙ্গীত">সঙ্গীত</option>
                <option value="সাহিত্য ও আবৃত্তি">সাহিত্য ও আবৃত্তি</option>
                <option value="খবর ও কারেন্ট অ্যাফেয়ার্স">খবর ও কারেন্ট অ্যাফেয়ার্স</option>
                <option value="টকশো ও আড্ডা">টকশো ও আড্ডা</option>
                <option value="বিশেষ অনুষ্ঠান">বিশেষ অনুষ্ঠান</option>
              </select>
            </div>
          </div>

          {/* Times */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">শুরুর সময় (24H)</label>
              <input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-amber-500 font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">সমাপ্তির সময় (24H)</label>
              <input
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-amber-500 font-mono"
              />
            </div>
          </div>

          {/* Broadcast Type: Live vs Recorded */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">সম্প্রচার ধরণ</label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setType('recorded')}
                className={`flex items-center justify-center gap-2 p-3 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${
                  type === 'recorded'
                    ? 'bg-amber-500/10 border-amber-500 text-amber-300'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                <Disc3 className="w-4 h-4" />
                <span>রেকর্ডেড শো / অডিও ফাইল</span>
              </button>

              <button
                type="button"
                onClick={() => setType('live')}
                className={`flex items-center justify-center gap-2 p-3 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${
                  type === 'live'
                    ? 'bg-red-500/10 border-red-500 text-red-300'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                <Mic className="w-4 h-4" />
                <span>লাইভ স্টুডিও সম্প্রচার</span>
              </button>
            </div>
          </div>

          {/* If recorded, choose Playout Mode (Playlist / Single) */}
          {type === 'recorded' && (
            <div className="space-y-3 bg-slate-950/70 p-4 rounded-xl border border-slate-800">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-white flex items-center gap-1.5">
                  <ListMusic className="w-4 h-4 text-amber-400" />
                  <span>অডিও প্লেব্যাক মোড:</span>
                </label>
                <div className="flex items-center gap-1 bg-slate-900 border border-slate-800 p-0.5 rounded-lg text-xs">
                  <button
                    type="button"
                    onClick={() => setPlayoutMode('playlist')}
                    className={`px-2.5 py-1 rounded font-medium transition-colors cursor-pointer ${
                      playoutMode === 'playlist'
                        ? 'bg-amber-500 text-slate-950 font-bold'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    একাধিক গানের প্লেলিস্ট ({selectedPlaylistIds.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setPlayoutMode('single')}
                    className={`px-2.5 py-1 rounded font-medium transition-colors cursor-pointer ${
                      playoutMode === 'single'
                        ? 'bg-amber-500 text-slate-950 font-bold'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    একক গান / অডিও
                  </button>
                </div>
              </div>

              {playoutMode === 'playlist' ? (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs text-slate-400 pb-1 border-b border-slate-800/80">
                    <span>গানগুলো একটার পর একটা ধারাবাহিকভাবে চলবে:</span>
                    <button
                      type="button"
                      onClick={handleSelectAllUploaded}
                      className="text-amber-400 hover:text-amber-300 font-semibold cursor-pointer text-[11px]"
                    >
                      {uploadedTracks.length > 0 ? 'সব আপলোডকৃত গান যুক্ত করুন' : 'সব গান নির্বাচন করুন'}
                    </button>
                  </div>

                  <div className="max-h-48 overflow-y-auto space-y-1.5 pr-1">
                    {tracks.map((track) => {
                      const isSelected = selectedPlaylistIds.includes(track.id);
                      return (
                        <div
                          key={track.id}
                          onClick={() => toggleTrackInPlaylist(track.id)}
                          className={`p-2.5 rounded-lg border text-xs flex items-center justify-between gap-3 cursor-pointer transition-colors ${
                            isSelected
                              ? 'bg-amber-500/10 border-amber-500/40 text-amber-200'
                              : 'bg-slate-900/60 border-slate-800 hover:border-slate-700 text-slate-400'
                          }`}
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            {isSelected ? (
                              <CheckSquare className="w-4 h-4 text-amber-400 shrink-0" />
                            ) : (
                              <Square className="w-4 h-4 text-slate-600 shrink-0" />
                            )}
                            <div className="truncate">
                              <span className="font-semibold text-white truncate block">{track.title}</span>
                              <span className="text-[11px] text-slate-400 truncate block">
                                {track.artist} {track.showTitle ? `· [${track.showTitle}]` : ''}
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            {track.isUploaded && (
                              <span className="text-[9px] bg-emerald-500/20 text-emerald-300 px-1.5 py-0.5 rounded font-mono">
                                আপলোডকৃত
                              </span>
                            )}
                            <span className="font-mono text-[10px] text-slate-500">
                              {Math.round(track.duration / 60)} মি.
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <div>
                  <select
                    value={selectedTrackId}
                    onChange={(e) => setSelectedTrackId(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-amber-500"
                  >
                    {tracks.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.isUploaded ? '📁 [ইউজার আপলোড] ' : ''}{t.title} ({t.artist})
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          )}

          {/* Days of Week */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">সম্প্রচারের দিনসমূহ</label>
            <div className="flex flex-wrap gap-2">
              {daysList.map((day) => {
                const isSelected = selectedDays.includes(day.val);
                return (
                  <button
                    key={day.val}
                    type="button"
                    onClick={() => toggleDay(day.val)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                      isSelected
                        ? 'bg-amber-500 text-slate-950 font-bold'
                        : 'bg-slate-950 border border-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    {day.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">অনুষ্ঠানের বিবরণ</label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="শ্রোতাদের জন্য অনুষ্ঠানের সংক্ষিপ্ত পরিচিতি..."
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-amber-500"
            />
          </div>

          {/* Submit */}
          <div className="pt-2">
            <button
              type="submit"
              className="w-full py-3 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-sm rounded-xl transition-colors cursor-pointer shadow-lg shadow-amber-500/20"
            >
              শিডিউলে সংরক্ষণ করুন
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
