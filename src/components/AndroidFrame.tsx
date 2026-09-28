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
  // Mobile / Full-Screen view toggle:
  // By default, if the user opens this on their mobile phone or small viewport, showFrame is FALSE (full edge-to-edge).
  const [showFrame, setShowFrame] = useState<boolean>(false);
  const [isWideScreen, setIsWideScreen] = useState<boolean>(false);

  useEffect(() => {
    const handleResize = () => {
      const wide = window.innerWidth >= 1024;
      setIsWideScreen(wide);
      // Only show phone frame border if specifically on a wide desktop display
      setShowFrame(wide);
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // ── ON REAL SMARTPHONES OR TABLETS: ALWAYS FULL-SCREEN ────────────────────
  if (!isWideScreen) {
    return (
      <div className="min-h-screen w-full bg-black text-white flex flex-col relative">
        {/* Full-screen Content (Zero mock device borders or punch-holes) */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {children}
        </div>
      </div>
    );
  }

  // ── ON WIDE DESKTOP MONITORS: STUDIO PREVIEW MODE ─────────────────────────
  return (
    <div className="min-h-screen bg-[#050507] text-white flex flex-col items-center justify-start p-4 sm:p-6 selection:bg-amber-400/20">
      {/* Top Studio Control Bar */}
      <header className="w-full max-w-4xl flex items-center justify-between mb-4 px-4 py-2.5 rounded-2xl glass-panel text-xs">
        <div className="flex items-center gap-2.5">
          <div className="w-2 h-2 rounded-full bg-amber-400 shadow-[0_0_8px_rgba(245,197,99,0.8)] animate-radar" />
          <span className="font-semibold tracking-wider text-neutral-200 text-sm font-display">NYAAYNEETI</span>
          <span className="text-[11px] text-neutral-500">|</span>
          <span className="text-[11px] text-neutral-400 font-mono">Studio Desktop Preview</span>
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
            {activeLanguage === 'en' ? 'हिन्दी' : activeLanguage === 'hi' ? 'मराठी' : 'EN'}
          </button>

          <button
            onClick={() => setShowFrame(!showFrame)}
            className="w-7 h-7 rounded-full bg-white/[0.06] hover:bg-white/[0.1] border border-white/[0.08] flex items-center justify-center text-neutral-300 transition ios-press"
            title="Toggle Phone Mockup vs Full Canvas"
          >
            {showFrame ? <Monitor size={13} /> : <Smartphone size={13} />}
          </button>
        </div>
      </header>

      {/* Main Preview Container */}
      <div
        className={`w-full transition-all duration-300 bg-black flex flex-col overflow-hidden relative shadow-[0_25px_70px_rgba(0,0,0,0.8)] ${
          showFrame
            ? 'max-w-[420px] h-[890px] max-h-[92vh] rounded-[48px] border-[9px] border-[#1C1D22] ring-1 ring-white/[0.12]'
            : 'max-w-4xl min-h-[88vh] rounded-3xl border border-white/[0.08]'
        }`}
      >
        {/* Dynamic Island bar only in desktop mockup mode */}
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
