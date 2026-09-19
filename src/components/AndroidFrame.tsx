import React, { useState, useEffect } from 'react';
import { UserCheck, Briefcase, Monitor, Smartphone } from 'lucide-react';
import { Language, UserRole } from '../types';

interface AndroidFrameProps {
  children: React.ReactNode;
  activeLanguage: Language;
  onToggleLanguage: () => void;
  userRole: UserRole;
  onToggleRole: () => void;
  hideRoleToggle?: boolean;
}

export const AndroidFrame: React.FC<AndroidFrameProps> = ({
  children,
  activeLanguage,
  onToggleLanguage,
  userRole,
  onToggleRole,
  hideRoleToggle = false,
}) => {
  // Detect if running on a real mobile device
  const [isMobile, setIsMobile] = useState(false);
  const [showFrame, setShowFrame] = useState(true);

  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      if (mobile) setShowFrame(false); // Full screen on real phones
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // ── MOBILE: Full-screen native app experience ──────────────────────────────
  if (isMobile) {
    return (
      <div className="min-h-screen w-full bg-black text-white flex flex-col relative">
        {/* Minimal top bar for language + role toggle */}
        <div className="flex-shrink-0 flex items-center justify-between px-4 pt-3 pb-1">
          <span className="text-white font-bold text-base tracking-tight">Nyaay</span>
          <div className="flex items-center gap-2">
            {!hideRoleToggle && (
              <div className="flex items-center bg-white/[0.08] p-0.5 rounded-full border border-white/[0.08]">
                <button
                  onClick={() => userRole !== 'lawyer' && onToggleRole()}
                  className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium transition-all ${
                    userRole === 'lawyer' ? 'bg-white text-black' : 'text-white/50'
                  }`}
                >
                  <Briefcase size={10} />
                  <span>{activeLanguage === 'en' ? 'Lawyer' : 'वकील'}</span>
                </button>
                <button
                  onClick={() => userRole !== 'client' && onToggleRole()}
                  className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium transition-all ${
                    userRole === 'client' ? 'bg-white text-black' : 'text-white/50'
                  }`}
                >
                  <UserCheck size={10} />
                  <span>{activeLanguage === 'en' ? 'Client' : 'मुवक्किल'}</span>
                </button>
              </div>
            )}
            <button
              onClick={onToggleLanguage}
              className="px-2.5 py-1 rounded-full bg-white/[0.08] border border-white/[0.08] text-xs text-white/70 font-medium"
            >
              {activeLanguage === 'en' ? 'हिन्दी' : 'EN'}
            </button>
          </div>
        </div>

        {/* Full screen content */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {children}
        </div>
      </div>
    );
  }

  // ── DESKTOP: Show phone frame preview ─────────────────────────────────────
  return (
    <div className="min-h-screen bg-[#050507] text-white flex flex-col items-center justify-start p-2 sm:p-6 selection:bg-amber-400/20">
      {/* Top Control Bar */}
      <header className="w-full max-w-4xl flex items-center justify-between mb-4 px-3 py-2 rounded-2xl glass-panel text-xs">
        <div className="flex items-center gap-2.5">
          <div className="w-2 h-2 rounded-full bg-amber-400 shadow-[0_0_8px_rgba(245,197,99,0.8)]" />
          <span className="font-semibold tracking-wider text-neutral-200 text-sm">NYAAY</span>
          <span className="text-[11px] text-neutral-500">|</span>
          <span className="text-[11px] text-neutral-400">Legal OS · Desktop Preview</span>
        </div>

        <div className="flex items-center gap-2">
          {!hideRoleToggle && (
            <div className="flex items-center bg-white/[0.06] p-0.5 rounded-full border border-white/[0.08]">
              <button
                onClick={() => userRole !== 'lawyer' && onToggleRole()}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium transition-all ${
                  userRole === 'lawyer' ? 'bg-white text-black font-semibold shadow-sm' : 'text-neutral-400 hover:text-white'
                }`}
              >
                <Briefcase size={12} />
                <span>{activeLanguage === 'en' ? 'Lawyer' : 'वकील'}</span>
              </button>
              <button
                onClick={() => userRole !== 'client' && onToggleRole()}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium transition-all ${
                  userRole === 'client' ? 'bg-white text-black font-semibold shadow-sm' : 'text-neutral-400 hover:text-white'
                }`}
              >
                <UserCheck size={12} />
                <span>{activeLanguage === 'en' ? 'Client' : 'मुवक्किल'}</span>
              </button>
            </div>
          )}

          <button
            onClick={onToggleLanguage}
            className="px-2.5 py-1 rounded-full bg-white/[0.06] hover:bg-white/[0.1] border border-white/[0.08] text-xs text-neutral-300 font-medium transition ios-press"
          >
            {activeLanguage === 'en' ? 'हिन्दी' : 'EN'}
          </button>

          <button
            onClick={() => setShowFrame(!showFrame)}
            className="w-7 h-7 rounded-full bg-white/[0.06] hover:bg-white/[0.1] border border-white/[0.08] flex items-center justify-center text-neutral-300 transition ios-press"
            title="Toggle Frame"
          >
            {showFrame ? <Monitor size={13} /> : <Smartphone size={13} />}
          </button>
        </div>
      </header>

      {/* Phone Frame or Wide View */}
      <div
        className={`w-full transition-all duration-300 bg-black flex flex-col overflow-hidden relative shadow-[0_25px_70px_rgba(0,0,0,0.8)] ${
          showFrame
            ? 'max-w-[420px] h-[890px] max-h-[92vh] rounded-[48px] border-[9px] border-[#1C1D22] ring-1 ring-white/[0.12]'
            : 'max-w-4xl min-h-[88vh] rounded-3xl border border-white/[0.08]'
        }`}
      >
        {showFrame && (
          <div className="w-full bg-transparent px-7 pt-3.5 pb-2 flex items-center justify-between text-[11px] text-neutral-300 font-medium select-none z-30 shrink-0">
            <span className="font-semibold tracking-tight">9:41</span>
            <div className="w-24 h-4 bg-neutral-900 rounded-full flex items-center justify-center border border-white/[0.05]">
              <div className="w-2 h-2 rounded-full bg-neutral-950 mr-2" />
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500/80" />
            </div>
            <div className="flex items-center gap-1.5 text-neutral-400 text-[10px]">
              ▲▲ WiFi 🔋
            </div>
          </div>
        )}

        <div className="flex-1 flex flex-col overflow-y-auto bg-black text-white relative">
          {children}
        </div>

        {showFrame && (
          <div className="w-full bg-transparent py-2 flex justify-center items-center shrink-0 z-30">
            <div className="w-32 h-1 bg-white/20 rounded-full" />
          </div>
        )}
      </div>
    </div>
  );
};
