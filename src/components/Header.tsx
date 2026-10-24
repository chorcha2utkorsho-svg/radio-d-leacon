import React from 'react';
import { Radio, Sliders, Volume2, Upload, Bell } from 'lucide-react';

interface HeaderProps {
  currentTab: 'player' | 'schedule' | 'archive' | 'requests';
  onSelectTab: (tab: 'player' | 'schedule' | 'archive' | 'requests') => void;
  isStudioMode: boolean;
  onToggleStudioMode: () => void;
  isOnAir: boolean;
  listenerCount: number;
  isBroadcasterAuthenticated?: boolean;
  onOpenCMS?: () => void;
  onOpenNotifications?: () => void;
  activeReminderCount?: number;
}

export const Header: React.FC<HeaderProps> = ({
  currentTab,
  onSelectTab,
  isStudioMode,
  onToggleStudioMode,
  isOnAir,
  listenerCount,
  isBroadcasterAuthenticated = false,
  onOpenCMS,
  onOpenNotifications,
  activeReminderCount = 0,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-slate-950/90 backdrop-blur-md border-b border-slate-800/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-8">
        {/* Zone 1: Brand title */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={() => {
              if (isStudioMode) onToggleStudioMode();
              onSelectTab('player');
            }}
            className="flex items-center gap-2.5 text-left group cursor-pointer focus:outline-none"
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-amber-700 flex items-center justify-center text-slate-950 shadow-md shadow-amber-500/20 group-hover:scale-105 transition-transform">
              <Radio className="w-5 h-5 text-slate-950 stroke-[2.2]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-lg font-bold tracking-tight text-white font-sans whitespace-nowrap">
                  রেডিও ডি-লিকন
                </span>
                <span className="text-xs text-amber-400 font-mono font-medium hidden sm:inline">
                  FM 98.4
                </span>
              </div>
              <p className="text-[11px] text-slate-400 -mt-0.5 whitespace-nowrap">
                Radio D-Leacon · সুর ও কথামালা
              </p>
            </div>
          </button>
        </div>

        {/* Zone 2: Navigation Links */}
        <nav className="hidden md:flex items-center gap-6 text-sm font-medium">
          <button
            onClick={() => {
              if (isStudioMode) onToggleStudioMode();
              onSelectTab('player');
            }}
            className={`transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              !isStudioMode && currentTab === 'player'
                ? 'text-amber-400 font-semibold'
                : 'text-slate-300 hover:text-white'
            }`}
          >
            এখন সম্প্রচার
          </button>

          <button
            onClick={() => {
              if (isStudioMode) onToggleStudioMode();
              onSelectTab('schedule');
            }}
            className={`transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              !isStudioMode && currentTab === 'schedule'
                ? 'text-amber-400 font-semibold'
                : 'text-slate-300 hover:text-white'
            }`}
          >
            প্রোগ্রাম শিডিউল
          </button>

          <button
            onClick={() => {
              if (isStudioMode) onToggleStudioMode();
              onSelectTab('archive');
            }}
            className={`transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              !isStudioMode && currentTab === 'archive'
                ? 'text-amber-400 font-semibold'
                : 'text-slate-300 hover:text-white'
            }`}
          >
            রেকর্ডেড শো ও আর্কাইভ
          </button>

          <button
            onClick={() => {
              if (isStudioMode) onToggleStudioMode();
              onSelectTab('requests');
            }}
            className={`transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              !isStudioMode && currentTab === 'requests'
                ? 'text-amber-400 font-semibold'
                : 'text-slate-300 hover:text-white'
            }`}
          >
            অনুরোধ ও বার্তা
          </button>
        </nav>

        {/* Zone 3: Primary Action & Status */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          <div className="hidden lg:flex items-center gap-2 text-xs text-slate-400 mr-1">
            <Volume2 className="w-3.5 h-3.5 text-amber-400" />
            <span className="font-mono tabular-nums text-slate-200">{listenerCount}</span>
            <span>শ্রোতা যুক্ত</span>
          </div>

          {onOpenNotifications && (
            <button
              onClick={onOpenNotifications}
              className="relative p-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-amber-400 border border-slate-800 hover:border-amber-500/30 transition-all cursor-pointer"
              title="৫-মিনিট সম্প্রচার সতর্কতা ও রিমাইন্ডার সেটিংস"
              aria-label="নোটিফিকেশন ও রিমাইন্ডার"
            >
              <Bell className="w-4 h-4" />
              {activeReminderCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-amber-500 text-slate-950 font-bold text-[9px] flex items-center justify-center shadow-sm">
                  {activeReminderCount > 9 ? '9+' : activeReminderCount}
                </span>
              )}
            </button>
          )}

          {onOpenCMS && (
            <button
              onClick={onOpenCMS}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg bg-slate-900 hover:bg-slate-800 text-amber-300 border border-slate-800 hover:border-amber-500/40 transition-all cursor-pointer whitespace-nowrap shrink-0"
              title="স্টেশন কনটেন্ট ও শিডিউল ম্যানেজমেন্ট সিস্টেম (CMS)"
            >
              <Upload className="w-3.5 h-3.5 text-amber-400" />
              <span className="hidden sm:inline">স্টেশন সিএমএস</span>
              <span className="sm:hidden">CMS</span>
            </button>
          )}

          <button
            onClick={onToggleStudioMode}
            className={`flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer whitespace-nowrap shrink-0 ${
              isStudioMode
                ? 'bg-amber-500 text-slate-950 hover:bg-amber-400 shadow-md shadow-amber-500/20'
                : isBroadcasterAuthenticated
                ? 'bg-slate-800 text-amber-300 hover:bg-slate-700 border border-amber-500/30'
                : 'bg-slate-900 text-slate-300 hover:text-white hover:bg-slate-800 border border-slate-800'
            }`}
            title={isStudioMode ? 'শ্রোতা প্লেয়ারে ফিরে যান' : 'ব্রডকাস্টার ও আরজে কন্ট্রোল ড্যাশবোর্ডে প্রবেশ'}
          >
            <Sliders className="w-3.5 h-3.5 text-amber-400" />
            <span>{isStudioMode ? 'শ্রোতা প্লেয়ার' : 'আরজে ড্যাশবোর্ড'}</span>
          </button>
        </div>
      </div>

      {/* Mobile subnav */}
      <div className="flex md:hidden items-center justify-around px-2 py-2 border-t border-slate-800/80 bg-slate-950 text-xs overflow-x-auto">
        <button
          onClick={() => {
            if (isStudioMode) onToggleStudioMode();
            onSelectTab('player');
          }}
          className={`px-3 py-1.5 rounded-md whitespace-nowrap ${
            !isStudioMode && currentTab === 'player' ? 'text-amber-400 font-semibold' : 'text-slate-400'
          }`}
        >
          এখন বাজছে
        </button>
        <button
          onClick={() => {
            if (isStudioMode) onToggleStudioMode();
            onSelectTab('schedule');
          }}
          className={`px-3 py-1.5 rounded-md whitespace-nowrap ${
            !isStudioMode && currentTab === 'schedule' ? 'text-amber-400 font-semibold' : 'text-slate-400'
          }`}
        >
          শিডিউল
        </button>
        <button
          onClick={() => {
            if (isStudioMode) onToggleStudioMode();
            onSelectTab('archive');
          }}
          className={`px-3 py-1.5 rounded-md whitespace-nowrap ${
            !isStudioMode && currentTab === 'archive' ? 'text-amber-400 font-semibold' : 'text-slate-400'
          }`}
        >
          আর্কাইভ
        </button>
        <button
          onClick={() => {
            if (isStudioMode) onToggleStudioMode();
            onSelectTab('requests');
          }}
          className={`px-3 py-1.5 rounded-md whitespace-nowrap ${
            !isStudioMode && currentTab === 'requests' ? 'text-amber-400 font-semibold' : 'text-slate-400'
          }`}
        >
          অনুরোধ
        </button>
      </div>
    </header>
  );
};
