import React, { useState } from 'react';
import { X, Sparkles, Send, CheckCircle2 } from 'lucide-react';
import { SongRequest } from '../../types/radio';

interface SongRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmitRequest: (request: SongRequest) => void;
}

export const SongRequestModal: React.FC<SongRequestModalProps> = ({
  isOpen,
  onClose,
  onSubmitRequest,
}) => {
  const [listenerName, setListenerName] = useState('');
  const [location, setLocation] = useState('');
  const [requestedSong, setRequestedSong] = useState('');
  const [artist, setArtist] = useState('');
  const [message, setMessage] = useState('');
  const [submitted, setSubmitted] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!listenerName.trim() || !requestedSong.trim()) return;

    const newReq: SongRequest = {
      id: `req-${Date.now()}`,
      listenerName: listenerName.trim(),
      location: location.trim() || 'অনলাইন',
      requestedSong: requestedSong.trim(),
      artist: artist.trim() || 'জনপ্রিয় গান',
      message: message.trim(),
      timestamp: 'এইমাত্র',
      status: 'pending',
    };

    onSubmitRequest(newReq);
    setSubmitted(true);
    setTimeout(() => {
      setSubmitted(false);
      onClose();
    }, 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl">
        <div className="flex items-center justify-between p-6 border-b border-slate-800 bg-slate-950">
          <div className="flex items-center gap-2.5">
            <Sparkles className="w-5 h-5 text-amber-400" />
            <h3 className="text-lg font-bold text-white">গানের অনুরোধ ও শুভেচ্ছা বার্তা</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {submitted ? (
          <div className="p-8 text-center space-y-3">
            <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto" />
            <h4 className="text-lg font-bold text-white">অনুরোধ পাঠানো সম্পন্ন হয়েছে!</h4>
            <p className="text-xs text-slate-300">
              আপনার পছন্দের গান ও শুভেচ্ছা বার্তা স্টুডিও কন্ট্রোল রুমে পাঠানো হয়েছে। আরজে তা অন-এয়ার তুলে ধরবেন।
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">আপনার নাম *</label>
                <input
                  type="text"
                  required
                  value={listenerName}
                  onChange={(e) => setListenerName(e.target.value)}
                  placeholder="যেমন: অনিক রহমান"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">আপনার জেলা / শহর</label>
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="যেমন: ঢাকা / সিলেট"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">পছন্দের গান / অনুষ্ঠান *</label>
              <input
                type="text"
                required
                value={requestedSong}
                onChange={(e) => setRequestedSong(e.target.value)}
                placeholder="যেমন: আমি বাংলায় গান গাই"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-amber-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">শিল্পী / ব্যান্ডের নাম</label>
              <input
                type="text"
                value={artist}
                onChange={(e) => setArtist(e.target.value)}
                placeholder="যেমন: প্রতুল মুখোপাধ্যায়"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-amber-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">শুভেচ্ছা বার্তা বা মন্তব্য</label>
              <textarea
                rows={3}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="কাউকে উৎসর্গ করতে চান কি না বা আপনার ভালোলাগার কথা লিখুন..."
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-amber-500"
              />
            </div>

            <div className="pt-2">
              <button
                type="submit"
                className="w-full py-3 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-sm rounded-xl transition-colors cursor-pointer flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20"
              >
                <Send className="w-4 h-4" />
                <span>স্টুডিওতে অনুরোধ জমা দিন</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
