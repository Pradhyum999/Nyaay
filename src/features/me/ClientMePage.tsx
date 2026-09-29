import React from 'react';
import { Card } from '../../design/ui/Card';
import { Language, ThemeMode, UserProfile } from '../../types';
import { User, Globe, MessageSquare, Shield, LogOut, ChevronRight, Sun, Moon, Trash2 } from 'lucide-react';

interface ClientMePageProps {
  userProfile?: UserProfile;
  language: Language;
  theme?: ThemeMode;
  onToggleTheme?: () => void;
  onSelectLanguage: (lang: Language) => void;
  onOpenProfile?: () => void;
  onOpenFeedback?: () => void;
  onSignOut?: () => void;
  onDeleteAccount?: () => void;
}

export const ClientMePage: React.FC<ClientMePageProps> = ({
  userProfile,
  language,
  theme = 'dark',
  onToggleTheme,
  onSelectLanguage,
  onOpenProfile,
  onOpenFeedback,
  onSignOut,
  onDeleteAccount,
}) => {
  return (
    <div className="flex flex-col gap-4 p-4 sm:p-6 pb-28 text-white max-w-4xl mx-auto w-full">
      {/* ── User Header Card ── */}
      <Card
        interactive
        onClick={onOpenProfile}
        className="flex items-center justify-between p-4 bg-gradient-to-r from-white/[0.06] to-transparent border-white/[0.12]"
      >
        <div className="flex items-center gap-3.5 min-w-0">
          <div className="w-12 h-12 rounded-2xl bg-neutral-800 border border-white/10 flex items-center justify-center font-bold text-white text-base shrink-0">
            {userProfile?.name?.charAt(0) || 'U'}
          </div>
          <div className="min-w-0">
            <h2 className="text-sm sm:text-base font-bold text-white truncate">
              {userProfile?.name || 'Citizen Account'}
            </h2>
            <p className="text-xs text-neutral-400 truncate mt-0.5 font-mono">
              {userProfile?.phone || userProfile?.email || 'NYAAYNEETI Citizen'}
            </p>
          </div>
        </div>
        <ChevronRight size={18} className="text-neutral-500" />
      </Card>

      {/* ── Account & Preferences ── */}
      <div className="space-y-2">
        <h3 className="text-xs font-bold uppercase tracking-wider font-mono text-neutral-400 px-1">
          {language === 'hi' ? 'प्राथमिकताएं एवं सेटिंग्स' : 'Account & Preferences'}
        </h3>
        <Card className="divide-y divide-white/[0.06] p-0 overflow-hidden">
          {/* Language toggle */}
          <div className="flex items-center justify-between p-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-white/[0.06] flex items-center justify-center text-neutral-300">
                <Globe size={18} />
              </div>
              <div>
                <h4 className="text-xs sm:text-sm font-semibold text-white">Language / भाषा</h4>
                <p className="text-[11px] text-neutral-400">English, हिन्दी, मराठी</p>
              </div>
            </div>
            <div className="flex items-center p-1 rounded-xl bg-white/[0.06] border border-white/[0.1] text-xs">
              {(['en', 'hi', 'mr'] as const).map(l => (
                <button
                  key={l}
                  type="button"
                  onClick={() => onSelectLanguage(l)}
                  className={`px-2.5 py-1 rounded-lg font-semibold transition ${
                    language === l ? 'bg-amber-400 text-black font-bold' : 'text-neutral-400 hover:text-white'
                  }`}
                >
                  {l === 'en' ? 'EN' : l === 'hi' ? 'हिं' : 'म'}
                </button>
              ))}
            </div>
          </div>

          {/* Theme Mode Toggle */}
          {onToggleTheme && (
            <div
              onClick={onToggleTheme}
              className="flex items-center justify-between p-4 hover:bg-white/[0.04] cursor-pointer transition ios-press"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-amber-400/10 flex items-center justify-center text-amber-300">
                  {theme === 'light' ? <Sun size={18} /> : <Moon size={18} />}
                </div>
                <div>
                  <h4 className="text-xs sm:text-sm font-semibold text-main">
                    {language === 'mr' ? 'थीम मोड' : language === 'hi' ? 'थीम मोड' : 'Theme Mode'}
                  </h4>
                  <p className="text-[11px] text-sub">
                    {theme === 'light'
                      ? (language === 'mr' ? 'लाईट (हलका रंग)' : language === 'hi' ? 'लाइट (उजाला)' : 'Light (Minimal Mono)')
                      : (language === 'mr' ? 'डार्क (काळा व सोनेरी)' : language === 'hi' ? 'डार्क (काला व सुनहरा)' : 'Dark (Gold & Black)')}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-bold text-sub uppercase">
                  {theme}
                </span>
                <ChevronRight size={16} className="text-neutral-500" />
              </div>
            </div>
          )}

          {/* Feedback */}
          {onOpenFeedback && (
            <div
              onClick={onOpenFeedback}
              className="flex items-center justify-between p-4 hover:bg-white/[0.04] cursor-pointer transition ios-press"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-400">
                  <MessageSquare size={18} />
                </div>
                <div>
                  <h4 className="text-xs sm:text-sm font-semibold text-white">Give App Feedback</h4>
                  <p className="text-[11px] text-neutral-400">Help us improve your legal consultation experience</p>
                </div>
              </div>
              <ChevronRight size={16} className="text-neutral-500" />
            </div>
          )}

          {/* Privacy & DPDP Delete Data */}
          {onDeleteAccount && (
            <div
              onClick={onDeleteAccount}
              className="flex items-center justify-between p-4 hover:bg-red-500/10 cursor-pointer transition ios-press text-red-400"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-red-500/15 flex items-center justify-center text-red-400">
                  <Trash2 size={18} />
                </div>
                <div>
                  <h4 className="text-xs sm:text-sm font-semibold">Delete Account & Data</h4>
                  <p className="text-[11px] text-neutral-400">Permanently erase your consultation history (DPDP Act)</p>
                </div>
              </div>
              <ChevronRight size={16} className="text-neutral-500" />
            </div>
          )}

          {/* Sign Out */}
          {onSignOut && (
            <div
              onClick={onSignOut}
              className="flex items-center justify-between p-4 hover:bg-red-500/10 cursor-pointer transition ios-press text-red-400"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-red-500/15 flex items-center justify-center text-red-400">
                  <LogOut size={18} />
                </div>
                <div>
                  <h4 className="text-xs sm:text-sm font-semibold">Sign Out</h4>
                  <p className="text-[11px] text-neutral-400">Securely sign out of this device</p>
                </div>
              </div>
              <ChevronRight size={16} className="text-neutral-500" />
            </div>
          )}
        </Card>
      </div>
    </div>
  );
};
