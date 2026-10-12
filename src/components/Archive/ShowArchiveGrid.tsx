import React from 'react';
import { Disc3, Play, Clock, Sparkles, Upload } from 'lucide-react';
import { AudioTrack } from '../../types/radio';

interface ShowArchiveGridProps {
  tracks: AudioTrack[];
  onPlayTrack: (track: AudioTrack) => void;
  currentTrackId?: string;
  isPlaying: boolean;
  onOpenUpload?: () => void;
}

export const ShowArchiveGrid: React.FC<ShowArchiveGridProps> = ({
  tracks,
  onPlayTrack,
  currentTrackId,
  isPlaying,
  onOpenUpload,
}) => {
  return (
    <div className="w-full space-y-6">
      {/* Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight flex items-center gap-2.5">
              <Disc3 className="w-6 h-6 text-amber-400" />
              <span>রেকর্ডেড শো ও আর্কাইভ লাইব্রেরি</span>
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              লাইভ মিস করেছেন? রেডিও ডি-লিকনের যেকোনো পূর্ববর্তী পর্ব বা সঙ্গীত আসর শুনুন নিজের সুবিধামতো সময়ে
            </p>
          </div>

          {onOpenUpload && (
            <button
              onClick={onOpenUpload}
              className="flex items-center gap-2 px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl transition-colors cursor-pointer shrink-0 shadow-md shadow-amber-500/20"
            >
              <Upload className="w-4 h-4" />
              <span>+ নতুন অডিও ফাইল আপলোড</span>
            </button>
          )}
        </div>
      </div>

      {/* Grid of Archive Shows */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {tracks.map((track) => {
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
                  <p className="text-xs text-amber-400 font-medium mb-2">{track.artist}</p>
                  <p className="text-xs text-slate-300 leading-relaxed line-clamp-2">
                    {track.description || 'রেডিও ডি-লিকনের বিশেষ অডিও সম্প্রচার কালেকশন।'}
                  </p>
                </div>

                <div className="pt-4 mt-4 border-t border-slate-800/80 flex items-center justify-between">
                  <span className="text-[11px] text-slate-400 font-mono">
                    {track.isUploaded ? 'ইউজার রেকর্ড' : 'ডি-লিকন আর্কাইভ'}
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
                    <span>{isCurrentActive ? 'বাজছে' : 'অন-ডিমান্ড শুনুন'}</span>
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
