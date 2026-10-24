import React, { useState } from 'react';
import { Lock, X, ArrowRight, ShieldCheck, KeyRound } from 'lucide-react';
import { verifyBroadcasterPasscode, setBroadcasterAuthenticated } from '../../services/authSecurity';

interface BroadcasterAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const BroadcasterAuthModal: React.FC<BroadcasterAuthModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [passkey, setPasskey] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [isVerifying, setIsVerifying] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!passkey.trim()) return;

    setIsVerifying(true);
    try {
      const isValid = await verifyBroadcasterPasscode(passkey);
      if (isValid) {
        setBroadcasterAuthenticated(rememberMe);
        setErrorMsg('');
        setPasskey('');
        onSuccess();
      } else {
        setErrorMsg('ভুল পাসকোড! সঠিক পাসকোড দিয়ে পুনরায় চেষ্টা করুন।');
      }
    } catch {
      setErrorMsg('পাসকোড যাচাই করতে সমস্যা হয়েছে। আবার চেষ্টা করুন।');
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-800 bg-slate-950">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center text-amber-400">
              <Lock className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">স্টেশন কন্ট্রোল ড্যাশবোর্ড</h3>
              <p className="text-xs text-slate-400">আরজে ও ব্রডকাস্টারদের নিরাপদ প্রবেশদ্বার</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-4 text-xs text-slate-300 space-y-1.5">
            <div className="flex items-center gap-2 text-amber-400 font-semibold">
              <ShieldCheck className="w-4 h-4" />
              <span>স্টুডিও অ্যাক্সেস নিয়ন্ত্রণ ও শতভাগ গোপনীয়তা</span>
            </div>
            <p className="text-slate-400 leading-relaxed">
              এই ড্যাশবোর্ডটি শুধুমাত্র অনুমোদিত আরজে ও স্টেশন অপারেটরদের জন্য সুরক্ষিত। স্টেশন পরিচালনার জন্য আপনার পাসকোডটি প্রবেশ করান।
            </p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
              <KeyRound className="w-3.5 h-3.5 text-amber-400" />
              <span>স্টুডিও পাসকোড (Passcode)</span>
            </label>
            <input
              type="password"
              required
              autoFocus
              value={passkey}
              onChange={(e) => {
                setPasskey(e.target.value);
                setErrorMsg('');
              }}
              placeholder="গোপন পাসকোড লিখুন"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm font-mono text-white tracking-widest text-center focus:outline-none focus:border-amber-500 transition-colors"
            />
            {errorMsg && (
              <p className="text-xs text-red-400 mt-2 text-center font-medium">{errorMsg}</p>
            )}
          </div>

          <div className="flex items-center justify-between text-xs text-slate-400">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="accent-amber-500 rounded"
              />
              <span>এই ব্রাউজারে লগইন মনে রাখুন</span>
            </label>
            <span className="text-[11px] text-slate-400">রেডিও ডি-লিকন</span>
          </div>

          <button
            type="submit"
            className="w-full py-3 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-sm rounded-xl transition-all cursor-pointer shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2 active:scale-98"
          >
            <span>কন্ট্রোল রুমে প্রবেশ করুন</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
};
