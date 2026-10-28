import React, { useState } from 'react';
import { Download, Smartphone, X, Share, PlusSquare } from 'lucide-react';
import { usePWAInstall } from '../../hooks/usePWAInstall';

export const PWAInstallButton: React.FC<{ variant?: 'header' | 'compact' | 'banner' }> = ({
  variant = 'header',
}) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  // If already installed and running as standalone app, suppress prompt
  if (isInstalled) {
    return null;
  }

  // Android / Chromium / Desktop PWA Flow
  if (isInstallable) {
    if (variant === 'banner') {
      return (
        <div className="flex items-center justify-between p-3 bg-amber-500/15 border border-amber-500/30 rounded-xl text-xs text-amber-200">
          <div className="flex items-center gap-2">
            <Smartphone className="w-4 h-4 text-amber-400 shrink-0" />
            <span>মোবাইলে সহজে শুনতে রেডিও অ্যাপটি ফোনে ইনস্টল করুন</span>
          </div>
          <button
            onClick={install}
            className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-lg cursor-pointer transition-colors shadow-sm"
          >
            ইনস্টল করুন
          </button>
        </div>
      );
    }

    return (
      <button
        onClick={install}
        className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold rounded-lg bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 border border-emerald-500/40 transition-all cursor-pointer whitespace-nowrap shrink-0 shadow-sm shadow-emerald-500/10 active:scale-95"
        title="স্মার্টফোনে রেডিও অ্যাপ ইনস্টল করুন"
        aria-label="রেডিও অ্যাপ ইনস্টল করুন"
      >
        <Download className="w-3.5 h-3.5 text-emerald-400" />
        <span className="hidden sm:inline">অ্যাপ ইনস্টল করুন</span>
        <span className="sm:hidden">ইনস্টল</span>
      </button>
    );
  }

  // iOS Safari Flow
  if (isIOS) {
    return (
      <>
        <button
          onClick={() => setShowIOSGuide(true)}
          className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg bg-slate-900 hover:bg-slate-800 text-amber-300 border border-slate-800 hover:border-amber-500/40 transition-all cursor-pointer whitespace-nowrap shrink-0"
          title="আইফোনে অ্যাপ হিসেবে যুক্ত করুন"
          aria-label="আইফোনে ইনস্টল গাইড"
        >
          <Smartphone className="w-3.5 h-3.5 text-amber-400" />
          <span className="hidden sm:inline">হোমস্ক্রিনে যুক্ত করুন</span>
          <span className="sm:hidden">ইনস্টল</span>
        </button>

        {showIOSGuide && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
            <div className="w-full max-w-sm rounded-2xl bg-slate-900 border border-slate-800 p-6 shadow-2xl text-slate-100 relative">
              <button
                onClick={() => setShowIOSGuide(false)}
                className="absolute top-4 right-4 p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 cursor-pointer"
                aria-label="বন্ধ করুন"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center text-amber-400">
                  <Smartphone className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">আইফোনে রেডিও ইনস্টল করুন</h3>
                  <p className="text-xs text-slate-400">হোমস্ক্রিনে সরাসরি অ্যাপ হিসেবে যুক্ত করুন</p>
                </div>
              </div>

              <div className="space-y-3 text-xs text-slate-300 bg-slate-950 p-4 rounded-xl border border-slate-800">
                <div className="flex items-start gap-2.5">
                  <div className="w-5 h-5 rounded-full bg-slate-800 text-amber-400 font-bold flex items-center justify-center shrink-0 text-[11px]">
                    ১
                  </div>
                  <div className="flex-1">
                    Safari ব্রাউজারের নিচে থাকা <strong className="text-white">Share (শেয়ার)</strong> বাটনে ট্যাপ করুন।
                    <div className="inline-flex items-center gap-1 text-[11px] text-amber-400 ml-1">
                      <Share className="w-3 h-3" />
                    </div>
                  </div>
                </div>

                <div className="flex items-start gap-2.5">
                  <div className="w-5 h-5 rounded-full bg-slate-800 text-amber-400 font-bold flex items-center justify-center shrink-0 text-[11px]">
                    ২
                  </div>
                  <div className="flex-1">
                    নিচে স্ক্রোল করে <strong className="text-white">'Add to Home Screen'</strong> (হোম স্ক্রিনে যোগ করুন) নির্বাচন করুন।
                    <div className="inline-flex items-center gap-1 text-[11px] text-amber-400 ml-1">
                      <PlusSquare className="w-3 h-3" />
                    </div>
                  </div>
                </div>

                <div className="flex items-start gap-2.5">
                  <div className="w-5 h-5 rounded-full bg-slate-800 text-amber-400 font-bold flex items-center justify-center shrink-0 text-[11px]">
                    ৩
                  </div>
                  <div className="flex-1">
                    উপরে ডানপাশের <strong className="text-white">'Add'</strong> বাটনে ট্যাপ করলেই ফোনের অ্যাপ তালিকায় যুক্ত হয়ে যাবে!
                  </div>
                </div>
              </div>

              <button
                onClick={() => setShowIOSGuide(false)}
                className="mt-5 w-full py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition-colors cursor-pointer"
              >
                ঠিক আছে, বুঝেছি
              </button>
            </div>
          </div>
        )}
      </>
    );
  }

  return null;
};
