import React, { useState } from 'react';
import {
  Calendar,
  Clock,
  Mic,
  Disc3,
  Bell,
  BellRing,
  Play,
  CheckCircle2,
  PlusCircle,
} from 'lucide-react';
import { ScheduledProgram } from '../../types/radio';

interface ScheduleTimelineProps {
  schedules: ScheduledProgram[];
  currentProgramId: string;
  onPlayProgram: (prog: ScheduledProgram) => void;
  onOpenAddSchedule?: () => void;
}

const DAYS_BN = [
  'রবিবার',
  'সোমবার',
  'মঙ্গলবার',
  'বুধবার',
  'বৃহস্পতিবার',
  'শুক্রবার',
  'শনিবার',
];

export const ScheduleTimeline: React.FC<ScheduleTimelineProps> = ({
  schedules,
  currentProgramId,
  onPlayProgram,
  onOpenAddSchedule,
}) => {
  const [selectedDay, setSelectedDay] = useState<number>(new Date().getDay());
  const [selectedCategory, setSelectedCategory] = useState<string>('সব');
  const [reminders, setReminders] = useState<Record<string, boolean>>({});
  const [reminderToast, setReminderToast] = useState<string | null>(null);

  const toggleReminder = (id: string, title: string) => {
    const nextState = !reminders[id];
    setReminders((prev) => ({ ...prev, [id]: nextState }));

    if (nextState) {
      setReminderToast(`"${title}" অনুষ্ঠানের সম্প্রচারের পূর্বে আপনাকে মনে করিয়ে দেওয়া হবে!`);
      setTimeout(() => setReminderToast(null), 3000);
    }
  };

  const filteredPrograms = schedules.filter((prog) => {
    const matchesDay = prog.daysOfWeek.includes(selectedDay);
    const matchesCategory = selectedCategory === 'সব' || prog.category === selectedCategory;
    return matchesDay && matchesCategory;
  });

  const categories = ['সব', 'সঙ্গীত', 'সাহিত্য ও আবৃত্তি', 'খবর ও কারেন্ট অ্যাফেয়ার্স', 'টকশো ও আড্ডা', 'বিশেষ অনুষ্ঠান'];

  return (
    <div className="w-full space-y-6">
      {/* Header and Day Selector */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight flex items-center gap-2.5">
              <Calendar className="w-6 h-6 text-amber-400" />
              <span>রেডিও ডি-লিকন অনুষ্ঠানসূচি</span>
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              আগাম শিডিউল অনুযায়ী স্বয়ংক্রিয়ভাবে লাইভ ও রেকর্ডেড শো সম্প্রচারিত হয়
            </p>
          </div>

          {onOpenAddSchedule && (
            <button
              onClick={onOpenAddSchedule}
              className="flex items-center gap-2 px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold text-xs rounded-xl transition-colors cursor-pointer shrink-0"
            >
              <PlusCircle className="w-4 h-4" />
              <span>নতুন শো শিডিউল করুন</span>
            </button>
          )}
        </div>

        {/* Days of Week Tab Buttons */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-2 scrollbar-none border-b border-slate-800">
          {DAYS_BN.map((dayName, idx) => {
            const isToday = idx === new Date().getDay();
            const isSelected = selectedDay === idx;
            return (
              <button
                key={dayName}
                onClick={() => setSelectedDay(idx)}
                className={`px-3.5 py-2 rounded-lg text-xs font-medium whitespace-nowrap transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-amber-500 text-slate-950 font-semibold shadow-md shadow-amber-500/20'
                    : 'bg-slate-800/80 text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <span>{dayName}</span>
                {isToday && (
                  <span className={`ml-1.5 text-[10px] ${isSelected ? 'text-slate-950' : 'text-amber-400'}`}>
                    (আজ)
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Categories Bar */}
        <div className="flex items-center gap-2 overflow-x-auto pt-3">
          <span className="text-xs text-slate-400 whitespace-nowrap">বিভাগ:</span>
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1 rounded-md text-xs transition-colors whitespace-nowrap cursor-pointer ${
                selectedCategory === cat
                  ? 'bg-slate-700 text-white font-medium'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {reminderToast && (
        <div className="bg-amber-950/80 border border-amber-600/60 text-amber-200 text-xs px-4 py-2.5 rounded-xl flex items-center gap-2 animate-fade-in shadow-lg">
          <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0" />
          <span>{reminderToast}</span>
        </div>
      )}

      {/* Program Timeline List */}
      <div className="space-y-3">
        {filteredPrograms.length === 0 ? (
          <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-12 text-center text-slate-400">
            <Clock className="w-8 h-8 mx-auto mb-2 text-slate-500" />
            <p className="text-sm">এই দিনে নির্বাচিত বিভাগে কোনো নির্ধারিত অনুষ্ঠান নেই।</p>
          </div>
        ) : (
          filteredPrograms.map((prog) => {
            const isNowPlaying = prog.id === currentProgramId;
            const hasReminder = !!reminders[prog.id];

            return (
              <div
                key={prog.id}
                className={`rounded-xl border transition-all p-5 ${
                  isNowPlaying
                    ? 'bg-slate-900 border-amber-500/80 shadow-lg shadow-amber-500/10 ring-1 ring-amber-500/50'
                    : 'bg-slate-900/70 border-slate-800/80 hover:border-slate-700 hover:bg-slate-900'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  {/* Time + Mode Badge */}
                  <div className="flex items-start gap-4">
                    <div className="w-24 shrink-0">
                      <div className="font-mono text-sm font-bold text-amber-400 tabular-nums">
                        {prog.startTime} - {prog.endTime}
                      </div>
                      <div className="flex items-center gap-1.5 mt-1">
                        <span
                          className={`text-[11px] font-medium px-2 py-0.5 rounded ${
                            prog.type === 'live'
                              ? 'bg-red-950/80 text-red-300 border border-red-800/60'
                              : 'bg-slate-800 text-slate-300'
                          }`}
                        >
                          {prog.type === 'live' ? 'লাইভ' : 'রেকর্ডেড'}
                        </span>
                      </div>
                    </div>

                    {/* Program Info */}
                    <div className="flex-1">
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <h3 className="text-base font-bold text-white">{prog.title}</h3>
                        {isNowPlaying && (
                          <span className="bg-amber-500 text-slate-950 font-bold text-[10px] px-2 py-0.5 rounded-full uppercase tracking-wider">
                            এখন চলছে
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2 text-xs text-slate-400 mb-2">
                        <span className="text-amber-300/90 font-medium">{prog.host}</span>
                        <span aria-hidden="true">·</span>
                        <span>{prog.category}</span>
                      </div>

                      <p className="text-xs text-slate-300 leading-relaxed max-w-3xl">
                        {prog.description}
                      </p>
                    </div>
                  </div>

                  {/* Actions: Listen / Reminder */}
                  <div className="flex items-center gap-2.5 self-end sm:self-center shrink-0">
                    <button
                      onClick={() => toggleReminder(prog.id, prog.title)}
                      className={`p-2 rounded-lg text-xs transition-colors cursor-pointer border ${
                        hasReminder
                          ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                          : 'bg-slate-800/80 text-slate-400 hover:text-white border-slate-700/60'
                      }`}
                      title={hasReminder ? 'রিমাইন্ডার বন্ধ করুন' : 'অনুষ্ঠানের জন্য রিমাইন্ডার সেট করুন'}
                    >
                      {hasReminder ? (
                        <BellRing className="w-4 h-4 text-amber-400" />
                      ) : (
                        <Bell className="w-4 h-4" />
                      )}
                    </button>

                    <button
                      onClick={() => onPlayProgram(prog)}
                      className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                        isNowPlaying
                          ? 'bg-amber-500 text-slate-950 hover:bg-amber-400 shadow-md shadow-amber-500/20'
                          : 'bg-slate-800 text-slate-200 hover:bg-slate-700 hover:text-white border border-slate-700/80'
                      }`}
                    >
                      <Play className="w-3.5 h-3.5 fill-current" />
                      <span>{isNowPlaying ? 'শুনছেন' : 'প্লে করুন'}</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
