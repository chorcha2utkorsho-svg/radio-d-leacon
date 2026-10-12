import React from 'react';
import { Radio } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="mt-16 border-t border-slate-800/80 bg-slate-950 py-10 text-xs text-slate-400">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3 text-left">
            <div className="w-8 h-8 rounded-lg bg-amber-500/20 flex items-center justify-center text-amber-400">
              <Radio className="w-4 h-4" />
            </div>
            <div>
              <p className="font-bold text-white text-sm">রেডিও ডি-লিকন · Radio D-Leacon</p>
              <p className="text-[11px] text-slate-400">
                অনলাইন লাইভ ও শিডিউলড অডিও সম্প্রচার প্ল্যাটফর্ম
              </p>
            </div>
          </div>

          <div className="flex items-center gap-6 text-slate-400">
            <span>FM 98.4 MHz</span>
            <span aria-hidden="true">·</span>
            <span>HD ওয়েব স্ট্রিম</span>
            <span aria-hidden="true">·</span>
            <span>কমিউনিটি ব্রডকাস্টিং</span>
          </div>

          <div className="text-slate-400 text-center md:text-right">
            <p>© {new Date().getFullYear()} রেডিও ডি-লিকন। সর্বস্বত্ব সংরক্ষিত।</p>
          </div>
        </div>
      </div>
    </footer>
  );
};
