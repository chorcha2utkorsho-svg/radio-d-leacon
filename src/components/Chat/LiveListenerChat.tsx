import React, { useState } from 'react';
import { MessageSquare, Send, Pin, User, ShieldCheck } from 'lucide-react';
import { ChatMessage } from '../../types/radio';

interface LiveListenerChatProps {
  messages: ChatMessage[];
  onSendMessage: (text: string, senderName: string) => void;
  isStudioMode?: boolean;
}

export const LiveListenerChat: React.FC<LiveListenerChatProps> = ({
  messages,
  onSendMessage,
  isStudioMode = false,
}) => {
  const [inputText, setInputText] = useState('');
  const [senderName, setSenderName] = useState('শ্রোতা');

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    onSendMessage(
      inputText.trim(),
      isStudioMode ? 'রেডিও ডি-লিকন স্টুডিও' : senderName.trim() || 'শ্রোতা'
    );
    setInputText('');
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl flex flex-col h-[520px] shadow-xl overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-slate-800 bg-slate-950 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <MessageSquare className="w-4 h-4 text-amber-400" />
          <h3 className="text-sm font-bold text-white">লাইভ স্টুডিও চ্যাট ও বার্তা</h3>
        </div>
        <span className="text-[11px] text-slate-400 font-mono">লাইভ সম্প্রচার চ্যাট</span>
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 p-4 overflow-y-auto space-y-3">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`p-3 rounded-xl border transition-all ${
              msg.isPinned
                ? 'bg-amber-950/40 border-amber-600/40 text-amber-200'
                : msg.isHost
                ? 'bg-slate-800/80 border-slate-700/80'
                : 'bg-slate-950/60 border-slate-800/60'
            }`}
          >
            <div className="flex items-center justify-between gap-2 mb-1">
              <div className="flex items-center gap-2">
                <div
                  className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold text-white ${
                    msg.avatarColor || 'bg-slate-700'
                  }`}
                >
                  {msg.isHost ? 'RJ' : msg.sender[0]}
                </div>
                <span className="text-xs font-bold text-white flex items-center gap-1">
                  {msg.sender}
                  {msg.isHost && (
                    <span title="রেডিও সঞ্চালক">
                      <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
                    </span>
                  )}
                </span>
                {msg.isPinned && (
                  <span className="flex items-center gap-1 text-[10px] bg-amber-500/20 text-amber-300 px-1.5 py-0.2 rounded font-semibold">
                    <Pin className="w-2.5 h-2.5" /> পিন করা
                  </span>
                )}
              </div>
              <span className="text-[10px] text-slate-500 font-mono tabular-nums">
                {msg.timestamp}
              </span>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed pl-8">
              {msg.text}
            </p>
          </div>
        ))}
      </div>

      {/* Chat Input */}
      <form onSubmit={handleSend} className="p-3 border-t border-slate-800 bg-slate-950/80 space-y-2">
        {!isStudioMode && (
          <div className="flex items-center gap-2">
            <User className="w-3 h-3 text-slate-400" />
            <input
              type="text"
              value={senderName}
              onChange={(e) => setSenderName(e.target.value)}
              placeholder="আপনার নাম"
              className="text-xs bg-transparent border-b border-slate-800 text-slate-300 focus:outline-none focus:border-amber-400 py-0.5 w-32"
            />
          </div>
        )}

        <div className="flex items-center gap-2">
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder={
              isStudioMode
                ? 'স্টুডিও থেকে বার্তা বা ঘোষণা লিখুন...'
                : 'লাইভ স্টুডিওতে আপনার বার্তা পাঠান...'
            }
            className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
          />
          <button
            type="submit"
            className="p-2 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl transition-colors cursor-pointer shrink-0"
            aria-label="বার্তা পাঠান"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </form>
    </div>
  );
};
