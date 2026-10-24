import React, { useState } from 'react';
import { Disc3, Play, Clock, Sparkles, Upload, ListMusic, CheckCircle2, RotateCw, Filter } from 'lucide-react';
import { AudioTrack } from '../../types/radio';

interface ShowArchiveGridProps {
  tracks: AudioTrack[];
  onPlayTrack: (track: AudioTrack) => void;
  currentTrackId?: string;
  isPlaying: boolean;
  onOpenUpload?: () => void;
  onStartAutoPilot?: (tracks?: AudioTrack[]) => void;
  isAutoPilotActive?: boolean;
}

export const ShowArchiveGrid: React.FC<ShowArchiveGridProps> = ({
  tracks,
  onPlayTrack,
  currentTrackId,
  isPlaying,
  onOpenUpload,
  onStartAutoPilot,
  isAutoPilotActive = false,
}) => {
  const [activeFilter, setActiveFilter] = useState<'all' | 'uploaded' | 'official'>('all');

  const uploadedTracks = tracks.filter((t) => t.isUploaded);
  const officialTracks = tracks.filter((t) => !t.isUploaded);

  const displayedTracks =
    activeFilter === 'uploaded'
      ? uploadedTracks
      : activeFilter === 'official'
      ? officialTracks
      : tracks;

  return (
    <div className="w-full space-y-6">
      {/* Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight flex items-center gap-2.5">
              <Disc3 className="w-6 h-6 text-amber-400" />
              <span>রেকর্ডেড শো ও আর্কাইভ লাইব্রেরি</span>
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              আপনার আপলোড করা সমস্ত অডিও ফাইল ব্রাউজারের সুরক্ষিত IndexedDB-তে সংরক্ষিত রয়েছে। আপনি চাইলে সারাদিন এগুলো একটার পর একটা অবিরাম অটো-রিপ্লে চালাতে পারেন।
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            {onStartAutoPilot && (
              <button
                onClick={() => onStartAutoPilot(uploadedTracks.length > 0 ? uploadedTracks : tracks)}
                className={`flex items-center gap-2 px-4 py-2 font-bold text-xs rounded-xl transition-all cursor-pointer shadow-md ${
                  isAutoPilotActive
                    ? 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-emerald-500/20 ring-2 ring-emerald-400/50'
                    : 'bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 shadow-amber-500/20'
                }`}
                title="আজ লাইভে না থাকলে সব গান বা অডিও ফাইল একটার পর একটা ধারাবাহিকভাবে অটো-প্লে করতে ক্লিক করুন"
              >
                <RotateCw className={`w-4 h-4 ${isAutoPilotActive ? 'animate-spin' : ''}`} />
                <span>
                  {isAutoPilotActive ? 'অটো-পাইলট মোড চলছে' : '☀️ সারাদিন অটো-রিপ্লে চালান (Auto-DJ)'}
                </span>
              </button>
            )}

            {onOpenUpload && (
              <button
                onClick={onOpenUpload}
                className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs rounded-xl border border-slate-700 transition-colors cursor-pointer shrink-0"
              >
                <Upload className="w-4 h-4 text-amber-400" />
                <span>+ নতুন অডিও আপলোড</span>
              </button>
            )}
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="flex items-center gap-2 mt-5 pt-4 border-t border-slate-800 text-xs">
          <span className="text-slate-400 font-medium mr-1 flex items-center gap-1">
            <Filter className="w-3.5 h-3.5 text-amber-400" />
            <span>ফিল্টার:</span>
          </span>
          <button
            onClick={() => setActiveFilter('all')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-colors cursor-pointer ${
              activeFilter === 'all'
                ? 'bg-amber-500 text-slate-950 font-bold'
                : 'bg-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            সব অডিও ({tracks.length})
          </button>
          <button
            onClick={() => setActiveFilter('uploaded')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-colors cursor-pointer ${
              activeFilter === 'uploaded'
                ? 'bg-emerald-500 text-slate-950 font-bold'
                : 'bg-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            আমার আপলোডকৃত ফাইলসমূহ ({uploadedTracks.length})
          </button>
          <button
            onClick={() => setActiveFilter('official')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-colors cursor-pointer ${
              activeFilter === 'official'
                ? 'bg-amber-500 text-slate-950 font-bold'
                : 'bg-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            স্টুডিও কালেকশন ({officialTracks.length})
          </button>
        </div>
      </div>

      {/* Auto-Replay Information Banner */}
      <div className="bg-slate-950/80 border border-slate-800/80 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center shrink-0">
            <ListMusic className="w-4 h-4 text-amber-400" />
          </div>
          <div>
            <p className="font-semibold text-white">
              সারাদিন লাইভ সম্প্রচারে না থাকলে কীভাবে ফাইলগুলো রি-প্লে করবেন?
            </p>
            <p className="text-slate-400 text-[11px] mt-0.5">
              উপরে <strong className="text-amber-400">"সারাদিন অটো-রিপ্লে চালান"</strong> বাটনে ক্লিক করলেই আপনার আপলোডকৃত ফাইলগুলো একটার পর একটা স্বয়ংক্রিয়ভাবে চলতে থাকবে। একটি গান শেষ হলে পরবর্তী গান নিজে নিজেই শুরু হবে এবং সম্পূর্ণ তালিকা শেষ হলে আবার ১ম গান থেকে লুপ আকারে অবিরাম চলবে।
            </p>
          </div>
        </div>
      </div>

      {/* Grid of Archive Shows */}
      {displayedTracks.length === 0 ? (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center text-slate-400 space-y-3">
          <FileAudioIcon className="w-10 h-10 text-slate-600 mx-auto" />
          <h4 className="text-base font-bold text-white">এখনো কোনো অডিও ফাইল পাওয়া যায়নি</h4>
          <p className="text-xs max-w-md mx-auto">
            আপনার কম্পিউটারে থাকা .mp3 বা .wav ফাইল আপলোড করতে উপরে "+ নতুন অডিও আপলোড" বাটনে ক্লিক করুন।
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {displayedTracks.map((track) => {
            const isCurrentActive = track.id === currentTrackId && isPlaying;

            return (
              <div
                key={track.id}
                className={`rounded-2xl border transition-all overflow-hidden flex flex-col justify-between ${
                  isCurrentActive
                    ? 'bg-slate-900 border-amber-500 shadow-lg shadow-amber-500/10 ring-1 ring-amber-500/40'
                    : 'bg-slate-900/80 border-slate-800 hover:border-slate-700 hover:bg-slate-900'
                }`}
              >
                <div className="relative h-44 overflow-hidden bg-slate-950">
                  <img
                    src={track.coverArt || '/src/assets/images/radio_album_art_1791833789333.jpg'}
                    alt={track.title}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent" />

                  <div className="absolute top-3 left-3 bg-black/60 backdrop-blur-md px-2.5 py-1 rounded text-[11px] font-mono text-amber-300">
                    {track.category}
                  </div>

                  {track.isUploaded && (
                    <div className="absolute top-3 right-3 bg-emerald-600/90 backdrop-blur-md px-2 py-0.5 rounded text-[10px] font-mono text-white font-bold">
                      ইউজার আপলোড
                    </div>
                  )}

                  <div className="absolute bottom-3 right-3 bg-black/70 backdrop-blur-md px-2 py-1 rounded text-[11px] font-mono text-white/90 flex items-center gap-1.5 tabular-nums">
                    <Clock className="w-3 h-3 text-amber-400" />
                    <span>{Math.round(track.duration / 60)} মিনিট</span>
                  </div>
                </div>

                <div className="p-5 flex-1 flex flex-col justify-between">
                  <div>
                    <h3 className="text-base font-bold text-white mb-1 leading-snug line-clamp-1">
                      {track.title}
                    </h3>
                    <p className="text-xs text-amber-400 font-medium mb-1">{track.artist}</p>
                    {track.showTitle && (
                      <p className="text-[11px] text-slate-400 font-mono mb-2">
                        অধিবেশন: <span className="text-slate-300">{track.showTitle}</span>
                      </p>
                    )}
                    <p className="text-xs text-slate-300 leading-relaxed line-clamp-2">
                      {track.description || 'রেডিও ডি-লিকনের বিশেষ অডিও সম্প্রচার কালেকশন।'}
                    </p>
                  </div>

                  <div className="pt-4 mt-4 border-t border-slate-800/80 flex items-center justify-between">
                    <span className="text-[11px] text-slate-400 font-mono">
                      {track.isUploaded ? 'সংরক্ষিত অডিও' : 'ডি-লিকন আর্কাইভ'}
                    </span>

                    <button
                      onClick={() => onPlayTrack(track)}
                      className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                        isCurrentActive
                          ? 'bg-amber-500 text-slate-950 hover:bg-amber-400 shadow-md shadow-amber-500/20'
                          : 'bg-slate-800 text-slate-200 hover:bg-slate-700 hover:text-white border border-slate-700/80'
                      }`}
                    >
                      <Play className="w-3.5 h-3.5 fill-current" />
                      <span>{isCurrentActive ? 'বাজছে' : 'অন-এয়ার চালান'}</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

function FileAudioIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M17.5 22h.5a2 2 0 0 0 2-2V7l-5-5H6a2 2 0 0 0-2 2v3" />
      <path d="M14 2v4a2 2 0 0 0 2 2h4" />
      <circle cx="6" cy="18" r="3" />
      <path d="M9 18v-6l5-2v6" />
    </svg>
  );
}
