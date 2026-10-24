import React from 'react';
import {
  BellRing,
  Clock,
  Play,
  X,
  Volume2,
  VolumeX,
  Sparkles,
  Radio,
  ExternalLink,
} from 'lucide-react';
import { ScheduledProgram } from '../../types/radio';
import { ActiveAlertInfo, formatCompactCountdown } from '../../services/notificationService';

interface ProgramAlertBannerProps {
  alert: ActiveAlertInfo;
  onTuneIn: (program: ScheduledProgram) => void;
  onDismiss: () => void;
  onToggleSound?: () => void;
  soundEnabled?: boolean;
}

export const ProgramAlertBanner: React.FC<ProgramAlertBannerProps> = ({
  alert,
  onTuneIn,
  onDismiss,
  onToggleSound,
  soundEnabled = true,
}) => {
  const { program, secondsUntilStart, isTest } = alert;

  return (
    <aside
      aria-label="আসন্ন অনুষ্ঠান সতর্কবার্তা"
      className="fixed top-18 left-1/2 -translate-x-1/2 z-50 w-11/12 max-w-4xl animate-bounce-subtle shadow-2xl"
    >
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-amber-950 via-slate-900 to-amber-950 border-2 border-amber-500/70 shadow-amber-500/20 p-4 sm:p-5 backdrop-blur-xl">
        {/* Ambient background glow & sweep effect */}
        <div className="absolute -top-12 -left-12 w-40 h-40 bg-amber-500/20 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute -bottom-12 -right-12 w-40 h-40 bg-red-500/15 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          {/* Left section: Live Indicator, Title, Host & Category */}
          <div className="flex items-start gap-3.5">
            <div className="w-12 h-12 rounded-xl bg-amber-500 text-slate-950 flex items-center justify-center shrink-0 shadow-lg shadow-amber-500/30 animate-pulse">
              <BellRing className="w-6 h-6 stroke-[2.2]" />
            </div>

            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-red-600 text-white font-bold text-[11px] uppercase tracking-wider shadow-sm animate-pulse">
                  <span className="w-2 h-2 rounded-full bg-white inline-block animate-ping" />
                  <span>৫ মিনিটে শুরু হচ্ছে</span>
                </span>

                {isTest && (
                  <span className="px-2 py-0.5 rounded-md bg-amber-400/20 text-amber-300 border border-amber-400/40 text-[10px] font-mono">
                    সিমুলেশন মোড
                  </span>
                )}

                <span className="text-xs font-mono font-medium text-amber-300 bg-slate-950/80 px-2 py-0.5 rounded border border-amber-500/30">
                  {program.startTime} - {program.endTime}
                </span>

                <span className="text-[11px] text-slate-300 bg-slate-800 px-2 py-0.5 rounded">
                  {program.category}
                </span>
              </div>

              <h4 className="text-base sm:text-lg font-bold text-white tracking-tight flex items-center gap-2">
                <span>{program.title}</span>
              </h4>

              <div className="flex items-center gap-2 text-xs text-slate-300">
                <span className="text-amber-400 font-semibold">{program.host}</span>
                <span aria-hidden="true">·</span>
                <span className="line-clamp-1 text-slate-400 text-[11px]">
                  {program.description}
                </span>
              </div>
            </div>
          </div>

          {/* Right section: Countdown Timer Badge & Action Buttons */}
          <div className="flex items-center justify-between md:justify-end gap-3 pt-2 md:pt-0 border-t md:border-t-0 border-slate-800/80">
            {/* Digital Countdown timer */}
            <div className="flex items-center gap-2 bg-slate-950/90 border border-amber-500/50 px-3.5 py-2 rounded-xl text-center shadow-inner">
              <Clock className="w-4 h-4 text-amber-400 shrink-0" />
              <div className="text-left">
                <div className="text-[10px] uppercase tracking-wider text-slate-400 font-medium">
                  বাকি সময়
                </div>
                <div className="font-mono text-base font-extrabold text-amber-400 tabular-nums leading-none">
                  {formatCompactCountdown(secondsUntilStart)}
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-2 shrink-0">
              {onToggleSound && (
                <button
                  onClick={onToggleSound}
                  className="p-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700 transition-colors cursor-pointer"
                  title={soundEnabled ? 'সতর্কবার্তা সাউন্ড বন্ধ করুন' : 'সতর্কবার্তা সাউন্ড চালু করুন'}
                  aria-label={soundEnabled ? 'সাউন্ড বন্ধ' : 'সাউন্ড চালু'}
                >
                  {soundEnabled ? (
                    <Volume2 className="w-4 h-4 text-amber-400" />
                  ) : (
                    <VolumeX className="w-4 h-4 text-slate-500" />
                  )}
                </button>
              )}

              <button
                onClick={() => onTuneIn(program)}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs sm:text-sm transition-all transform active:scale-95 shadow-lg shadow-amber-500/25 cursor-pointer whitespace-nowrap"
                title="রেডিও স্ট্রিমে টিউন করুন"
              >
                <Play className="w-4 h-4 fill-slate-950" />
                <span>এখনই টিউন করুন</span>
              </button>

              <button
                onClick={onDismiss}
                className="p-2.5 rounded-xl bg-slate-900/80 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-800 transition-colors cursor-pointer"
                title="সতর্কবার্তা বন্ধ করুন"
                aria-label="বন্ধ করুন"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
};
