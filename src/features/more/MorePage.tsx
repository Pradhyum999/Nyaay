import React from 'react';
import { Card } from '../../design/ui/Card';
import { Button } from '../../design/ui/Button';
import { Language, ThemeMode, UserProfile } from '../../types';
import {
  Building2,
  Scale,
  Search,
  UserCheck,
  Globe,
  Moon,
  Sun,
  MessageSquare,
  Shield,
  LogOut,
  ChevronRight,
  ExternalLink,
  BookOpen,
  ShieldAlert,
  Sparkles,
  GraduationCap
} from 'lucide-react';

interface MorePageProps {
  userProfile?: UserProfile;
  language: Language;
  onSelectLanguage: (lang: Language) => void;
  theme?: ThemeMode;
  onToggleTheme?: () => void;
  onOpenFirmPortal?: () => void;
  onOpenIpcToBns?: () => void;
  onOpenUniversalSearch?: () => void;
  onOpenProfile?: () => void;
  onOpenEmergency?: () => void;
  onSwitchDemo?: (type: 'firm' | 'student') => void;
  onOpenFeedback?: () => void;
  onSignOut?: () => void;
}

export const MorePage: React.FC<MorePageProps> = ({
  userProfile,
  language,
  onSelectLanguage,
  theme,
  onToggleTheme,
  onOpenFirmPortal,
  onOpenIpcToBns,
  onOpenUniversalSearch,
  onOpenProfile,
  onOpenEmergency,
  onSwitchDemo,
  onOpenFeedback,
  onSignOut,
}) => {
  const isStudent = userProfile?.role === 'student' || (userProfile as any)?.practiceType === 'student';
  const isFirm = userProfile?.role === 'firm_admin' || userProfile?.practiceType === 'firm';

  return (
    <div className="flex flex-col gap-5 p-4 sm:p-6 pb-28 text-white max-w-4xl mx-auto w-full">
      {/* ── Header Profile Card ── */}
      <Card
        interactive
        onClick={onOpenProfile}
        className="flex items-center justify-between p-4 bg-gradient-to-r from-white/[0.06] to-white/[0.02] border-white/[0.12]"
      >
        <div className="flex items-center gap-3.5 min-w-0">
          <div className="w-12 h-12 rounded-2xl bg-amber-400/20 border border-amber-400/40 flex items-center justify-center font-bold text-amber-300 text-base shrink-0">
            {userProfile?.name?.charAt(0) || 'Adv.'}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h2 className="text-sm sm:text-base font-bold text-white truncate">
                {userProfile?.name || 'Advocate Profile'}
              </h2>
              {isStudent ? (
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-purple-500/15 border border-purple-500/30 text-purple-300 font-bold">
                  Student Intern
                </span>
              ) : isFirm ? (
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-300 font-bold">
                  Chambers Admin
                </span>
              ) : userProfile?.verificationStatus === 'verified' ? (
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 font-bold">
                  Verified
                </span>
              ) : null}
            </div>
            <p className="text-xs text-neutral-400 truncate mt-0.5 font-mono">
              {userProfile?.barCouncilId || 'Bar Council ID Registered'}
            </p>
          </div>
        </div>
        <ChevronRight size={18} className="text-neutral-500" />
      </Card>

      {/* ── Demo Switcher Banner (if demo active) ── */}
      {onSwitchDemo && (
        <Card className="p-4 border-amber-400/35 bg-gradient-to-r from-amber-500/15 via-amber-500/5 to-transparent space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles size={16} className="text-amber-400" />
              <span className="text-xs font-bold text-white uppercase font-mono tracking-wider">
                {language === 'mr' ? 'सक्रिय डेमो खाते' : language === 'hi' ? 'सक्रिय डेमो खाता' : 'Active Demo Portal'}
              </span>
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-400/20 text-amber-300 font-bold">
              {isStudent ? 'Student Intern' : 'Chambers Admin'}
            </span>
          </div>
          <p className="text-xs text-neutral-300 leading-relaxed">
            {isStudent
              ? (language === 'hi'
                ? 'आप आरव पटेल (विधि छात्र इंटर्न) के रूप में देख रहे हैं। कभी भी लॉ फर्म चैम्बर्स खाते में स्विच करें।'
                : 'Viewing as Aarav Patel (Law Student Intern). Switch to explore the Managing Partner Chambers portal.')
              : (language === 'hi'
                ? 'आप एडवोकेट राजेश शर्मा (लॉ फर्म चैम्बर्स पार्टनर) के रूप में देख रहे हैं। कभी भी विधि छात्र इंटर्न खाते में स्विच करें।'
                : 'Viewing as Adv. Rajesh Sharma & Associates (Chambers). Switch to explore the Law Student Intern portal.')}
          </p>
          <div className="flex items-center gap-2 pt-1">
            <Button
              size="sm"
              variant={isStudent ? 'primary' : 'secondary'}
              onClick={() => onSwitchDemo(isStudent ? 'firm' : 'student')}
              icon={isStudent ? <Building2 size={14} /> : <GraduationCap size={14} />}
            >
              {isStudent ? 'Switch to Chambers Demo' : 'Switch to Student Demo'}
            </Button>
          </div>
        </Card>
      )}

      {/* ── Emergency Help Button ── */}
      {onOpenEmergency && (
        <Card
          onClick={onOpenEmergency}
          className="p-3.5 flex items-center justify-between cursor-pointer border-red-500/30 bg-red-500/5 hover:bg-red-500/10 transition"
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-red-500/20 text-red-400 flex items-center justify-center">
              <ShieldAlert size={18} />
            </div>
            <div>
              <p className="text-sm font-semibold text-white">
                {language === 'mr' ? 'आपत्कालीन कायदेशीर मदत' : language === 'hi' ? 'आपातकालीन कानूनी सहायता' : 'Emergency & Legal Aid'}
              </p>
              <p className="text-xs text-neutral-400">
                {language === 'hi' ? '112, 100, NALSA 15100 हेल्पलाईन' : 'National Emergency 112, NALSA 15100'}
              </p>
            </div>
          </div>
          <ChevronRight size={18} className="text-neutral-500" />
        </Card>
      )}

      {/* ── Group 1: Practice & Firm ── */}
      <div className="space-y-2">
        <h3 className="text-xs font-bold uppercase tracking-wider font-mono text-neutral-400 px-1">
          {language === 'hi' ? 'प्रैक्टिस एवं चैम्बर्स' : 'Practice & Chambers'}
        </h3>
        <Card className="divide-y divide-white/[0.06] p-0 overflow-hidden">
          {onOpenFirmPortal && (
            <div
              onClick={onOpenFirmPortal}
              className="flex items-center justify-between p-4 hover:bg-white/[0.04] cursor-pointer transition ios-press"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-amber-400/10 flex items-center justify-center text-amber-300">
                  <Building2 size={18} />
                </div>
                <div>
                  <h4 className="text-xs sm:text-sm font-semibold text-white">Chambers & Firm Portal</h4>
                  <p className="text-[11px] text-neutral-400">Manage associates, juniors, and multi-advocate roster</p>
                </div>
              </div>
              <ChevronRight size={16} className="text-neutral-500" />
            </div>
          )}

          {onOpenUniversalSearch && (
            <div
              onClick={onOpenUniversalSearch}
              className="flex items-center justify-between p-4 hover:bg-white/[0.04] cursor-pointer transition ios-press"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-400">
                  <Search size={18} />
                </div>
                <div>
                  <h4 className="text-xs sm:text-sm font-semibold text-white">Universal Search & CNR Lookup</h4>
                  <p className="text-[11px] text-neutral-400">Search cases, clients, statutes, and CNR filings</p>
                </div>
              </div>
              <ChevronRight size={16} className="text-neutral-500" />
            </div>
          )}
        </Card>
      </div>

      {/* ── Group 2: Legal Tools ── */}
      <div className="space-y-2">
        <h3 className="text-xs font-bold uppercase tracking-wider font-mono text-neutral-400 px-1">
          {language === 'hi' ? 'कानूनी अनुसंधान उपकरण' : 'Legal Research & Tools'}
        </h3>
        <Card className="divide-y divide-white/[0.06] p-0 overflow-hidden">
          {onOpenIpcToBns && (
            <div
              onClick={onOpenIpcToBns}
              className="flex items-center justify-between p-4 hover:bg-white/[0.04] cursor-pointer transition ios-press"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-purple-500/10 flex items-center justify-center text-purple-400">
                  <BookOpen size={18} />
                </div>
                <div>
                  <h4 className="text-xs sm:text-sm font-semibold text-white">IPC ↔ BNS Statutory Concordance</h4>
                  <p className="text-[11px] text-neutral-400">Instant cross-referencing between IPC, CrPC, IEA and new criminal codes</p>
                </div>
              </div>
              <ChevronRight size={16} className="text-neutral-500" />
            </div>
          )}
        </Card>
      </div>

      {/* ── Group 3: Preferences & Account ── */}
      <div className="space-y-2">
        <h3 className="text-xs font-bold uppercase tracking-wider font-mono text-neutral-400 px-1">
          {language === 'hi' ? 'प्राथमिकताएं एवं खाता' : 'Preferences & Account'}
        </h3>
        <Card className="divide-y divide-white/[0.06] p-0 overflow-hidden">
          {/* Language 3-way toggle */}
          <div className="flex items-center justify-between p-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-white/[0.06] flex items-center justify-center text-neutral-300">
                <Globe size={18} />
              </div>
              <div>
                <h4 className="text-xs sm:text-sm font-semibold text-white">App Language / भाषा</h4>
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

          {/* Theme Mode Toggle (Sun/Moon) */}
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
                  <h4 className="text-xs sm:text-sm font-semibold text-white">Submit App Feedback</h4>
                  <p className="text-[11px] text-neutral-400">Share suggestions or report courtroom issues</p>
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
                  <h4 className="text-xs sm:text-sm font-semibold">Sign Out from Device</h4>
                  <p className="text-[11px] text-neutral-400">Safely log out of your legal workstation</p>
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
