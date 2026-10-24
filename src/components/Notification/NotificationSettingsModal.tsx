import React, { useState } from 'react';
import {
  Bell,
  BellRing,
  Volume2,
  VolumeX,
  Smartphone,
  CheckCircle2,
  X,
  Play,
  Sparkles,
  Info,
  Clock,
  Radio,
} from 'lucide-react';
import { ScheduledProgram } from '../../types/radio';
import {
  ListenerNotificationSettings,
  requestBrowserNotificationPermission,
  playAlertChime,
} from '../../services/notificationService';

interface NotificationSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: ListenerNotificationSettings;
  onUpdateSettings: (newSettings: ListenerNotificationSettings) => void;
  schedules: ScheduledProgram[];
  onTriggerTestAlert: () => void;
}

export const NotificationSettingsModal: React.FC<NotificationSettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  onUpdateSettings,
  schedules,
  onTriggerTestAlert,
}) => {
  const [permissionStatus, setPermissionStatus] = useState<NotificationPermission>(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      return Notification.permission;
    }
    return 'denied';
  });
  const [successToast, setSuccessToast] = useState<string | null>(null);

  if (!isOpen) return null;

  const showToast = (msg: string) => {
    setSuccessToast(msg);
    setTimeout(() => setSuccessToast(null), 3000);
  };

  const handleRequestPermission = async () => {
    const result = await requestBrowserNotificationPermission();
    setPermissionStatus(result);
    if (result === 'granted') {
      onUpdateSettings({ ...settings, browserNotificationsEnabled: true });
      showToast('ব্রাউজার নোটিফিকেশন সফলভাবে সক্রিয় করা হয়েছে!');
    } else {
      showToast('ব্রাউজার নোটিফিকেশনের অনুমতি প্রদান করা হয়নি।');
    }
  };

  const handleToggleSound = () => {
    const next = !settings.soundEnabled;
    onUpdateSettings({ ...settings, soundEnabled: next });
    if (next) {
      playAlertChime();
      showToast('অ্যালার্ট সাউন্ড চালুকৃত ও টেস্ট করা হয়েছে।');
    }
  };

  const handleToggleAllPrograms = () => {
    const next = !settings.notifyAllPrograms;
    onUpdateSettings({ ...settings, notifyAllPrograms: next });
    showToast(
      next
        ? 'সকল অনুষ্ঠানের ৫ মিনিট পূর্বে নোটিফিকেশন আসবে।'
        : 'শুধুমাত্র বুকমার্ক/নির্বাচিত অনুষ্ঠানের জন্য নোটিফিকেশন আসবে।'
    );
  };

  const handleToggleProgramSubscription = (progId: string) => {
    const exists = settings.subscribedProgramIds.includes(progId);
    let updated: string[];
    if (exists) {
      updated = settings.subscribedProgramIds.filter((id) => id !== progId);
      showToast('অনুষ্ঠানের রিমাইন্ডার বন্ধ করা হয়েছে।');
    } else {
      updated = [...settings.subscribedProgramIds, progId];
      showToast('অনুষ্ঠানের জন্য ৫ মিনিটের রিমাইন্ডার সেট করা হয়েছে!');
    }
    onUpdateSettings({ ...settings, subscribedProgramIds: updated });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="p-6 border-b border-slate-800 flex items-center justify-between bg-slate-950/40">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center border border-amber-500/30">
              <BellRing className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white tracking-tight">
                অনুষ্ঠান সম্প্রচার রিমাইন্ডার ও নোটিফিকেশন
              </h3>
              <p className="text-xs text-slate-400">
                যেকোনো নির্ধারিত অনুষ্ঠান শুরু হওয়ার ৫ মিনিট পূর্বে স্বয়ংক্রিয় অ্যালার্ট
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Success Toast */}
        {successToast && (
          <div className="bg-amber-950/80 border-b border-amber-500/40 px-6 py-2.5 text-xs text-amber-200 flex items-center gap-2 animate-fade-in">
            <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0" />
            <span>{successToast}</span>
          </div>
        )}

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-xs sm:text-sm">
          {/* Quick Simulation / Test Alert Button */}
          <div className="bg-gradient-to-r from-amber-950/40 via-slate-950 to-amber-950/40 border border-amber-500/30 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-white font-bold">
                <Sparkles className="w-4 h-4 text-amber-400" />
                <span>সতর্কবার্তা টেস্ট করুন</span>
              </div>
              <p className="text-xs text-slate-300">
                ৫ মিনিটের অ্যালার্ট ব্যানার ও সাউন্ড কেমন দেখাবে এখনই যাচাই করুন
              </p>
            </div>

            <button
              onClick={() => {
                onTriggerTestAlert();
                onClose();
              }}
              className="flex items-center justify-center gap-2 px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl transition-all cursor-pointer shadow-md shadow-amber-500/20 whitespace-nowrap"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>টেস্ট অ্যালার্ট চালান</span>
            </button>
          </div>

          {/* Setting 1: Chime Tone */}
          <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-4 flex items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2 font-semibold text-white">
                {settings.soundEnabled ? (
                  <Volume2 className="w-4 h-4 text-amber-400" />
                ) : (
                  <VolumeX className="w-4 h-4 text-slate-500" />
                )}
                <span>রেডিও সুর/চাইম সাউন্ড (Audio Chime)</span>
              </div>
              <p className="text-xs text-slate-400">
                অনুষ্ঠানের ৫ মিনিট পূর্বে মিষ্টি হারমোনিক রেডিও চাইম বাজবে
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => playAlertChime()}
                className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-amber-300 text-xs font-medium border border-slate-700 cursor-pointer"
                title="সুর শুনুন"
              >
                সুর পরীক্ষা
              </button>
              <button
                onClick={handleToggleSound}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors cursor-pointer ${
                  settings.soundEnabled ? 'bg-amber-500' : 'bg-slate-700'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-slate-950 transition-transform ${
                    settings.soundEnabled ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
          </div>

          {/* Setting 2: Browser Web Push Notification */}
          <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-4 flex items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2 font-semibold text-white">
                <Smartphone className="w-4 h-4 text-amber-400" />
                <span>ব্রাউজার পুশ নোটিফিকেশন</span>
              </div>
              <p className="text-xs text-slate-400">
                ট্যাব ব্যাকগ্রাউন্ডে থাকলেও ব্রাউজারে ডেক্সটপ বা মোবাইল নোটিফিকেশন আসবে
              </p>
            </div>

            <div>
              {permissionStatus === 'granted' ? (
                <div className="flex items-center gap-1.5 text-xs text-emerald-400 bg-emerald-950/50 border border-emerald-800/60 px-3 py-1.5 rounded-lg">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>অনুমোদিত</span>
                </div>
              ) : (
                <button
                  onClick={handleRequestPermission}
                  className="px-3.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-amber-300 text-xs font-semibold border border-amber-500/30 cursor-pointer whitespace-nowrap"
                >
                  অনুমতি দিন
                </button>
              )}
            </div>
          </div>

          {/* Setting 3: Master Trigger Mode */}
          <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-4 flex items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="font-semibold text-white">
                সকল অনুষ্ঠানের জন্য স্বয়ংক্রিয় অ্যালার্ট
              </div>
              <p className="text-xs text-slate-400">
                চালু থাকলে প্রতিটি অনুষ্ঠানের ৫ মিনিট পূর্বে অ্যালার্ট দেখাবে
              </p>
            </div>

            <button
              onClick={handleToggleAllPrograms}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors cursor-pointer ${
                settings.notifyAllPrograms ? 'bg-amber-500' : 'bg-slate-700'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-slate-950 transition-transform ${
                  settings.notifyAllPrograms ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          {/* Program-specific Notification Selectors */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="font-bold text-white text-sm flex items-center gap-2">
                <Clock className="w-4 h-4 text-amber-400" />
                <span>অনুষ্ঠানভিত্তিক রিমাইন্ডার নির্বাচন</span>
              </div>
              <span className="text-xs text-slate-400">
                {settings.subscribedProgramIds.length} টি সক্রিয়
              </span>
            </div>

            <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
              {schedules.map((prog) => {
                const isSubscribed =
                  settings.notifyAllPrograms || settings.subscribedProgramIds.includes(prog.id);
                const isExplicitlySaved = settings.subscribedProgramIds.includes(prog.id);

                return (
                  <div
                    key={prog.id}
                    className={`p-3 rounded-xl border flex items-center justify-between gap-3 transition-colors ${
                      isSubscribed
                        ? 'bg-slate-950/80 border-slate-800 text-white'
                        : 'bg-slate-950/30 border-slate-900 text-slate-400'
                    }`}
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-xs truncate">{prog.title}</span>
                        <span className="font-mono text-[11px] text-amber-400 shrink-0">
                          {prog.startTime}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-400 truncate">
                        {prog.host} · {prog.category}
                      </div>
                    </div>

                    <button
                      onClick={() => handleToggleProgramSubscription(prog.id)}
                      className={`p-2 rounded-lg border text-xs transition-colors cursor-pointer shrink-0 ${
                        isExplicitlySaved || (settings.notifyAllPrograms && !isSubscribed)
                          ? 'bg-amber-500/20 text-amber-400 border-amber-500/40'
                          : 'bg-slate-800/80 text-slate-400 hover:text-white border-slate-700/60'
                      }`}
                      title={isExplicitlySaved ? 'রিমাইন্ডার বাদ দিন' : 'রিমাইন্ডার সেট করুন'}
                    >
                      {isExplicitlySaved ? (
                        <BellRing className="w-4 h-4 text-amber-400" />
                      ) : (
                        <Bell className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-950/60 border-t border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-colors cursor-pointer"
          >
            সম্পন্ন
          </button>
        </div>
      </div>
    </div>
  );
};
