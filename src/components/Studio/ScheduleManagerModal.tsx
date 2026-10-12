import React, { useState } from 'react';
import { X, Calendar, Clock, Disc3, Mic } from 'lucide-react';
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
  const [title, setTitle] = useState('');
  const [host, setHost] = useState('');
  const [category, setCategory] = useState<ProgramCategory>('সঙ্গীত');
  const [startTime, setStartTime] = useState('14:00');
  const [endTime, setEndTime] = useState('16:00');
  const [type, setType] = useState<BroadcastType>('recorded');
  const [selectedTrackId, setSelectedTrackId] = useState<string>(tracks[0]?.id || '');
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !host.trim()) return;

    const newProg: ScheduledProgram = {
      id: `prog-user-${Date.now()}`,
      title: title.trim(),
      host: host.trim(),
      category,
      startTime,
      endTime,
      type,
      trackId: type === 'recorded' ? selectedTrackId : undefined,
      description: description.trim() || 'রেডিও ডি-লিকনের নিয়মিত সম্প্রচার সূচি।',
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
            <h3 className="text-lg font-bold text-white">নতুন অনুষ্ঠান শিডিউল করুন</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
          {/* Title */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">অনুষ্ঠানের নাম *</label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="যেমন: সুরের ঝর্ণাধারা"
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
                placeholder="যেমন: আরজে সুমাইয়া"
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
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-amber-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">সমাপ্তির সময় (24H)</label>
              <input
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-amber-500"
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
                <span>রেকর্ডেড শো / অডিও</span>
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

          {/* If recorded, choose track */}
          {type === 'recorded' && (
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">রেকর্ডেড শো / অডিও সিলেক্ট করুন</label>
              <select
                value={selectedTrackId}
                onChange={(e) => setSelectedTrackId(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-amber-500"
              >
                {tracks.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.title} ({t.artist})
                  </option>
                ))}
              </select>
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
