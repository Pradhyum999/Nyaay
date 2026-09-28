import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ShieldCheck,
  Bell,
  Scale,
  UserCheck,
  Clock,
  Search,
  MessageSquare,
  Building2,
  Moon,
  Sun,
  Settings,
  X,
} from 'lucide-react';
import { AppNotification, Language, UserRole, ThemeMode } from '../types';

interface TopAppBarProps {
  language: Language;
  onSelectLanguage?: (lang: Language) => void;
  onToggleLanguage?: () => void;
  theme?: ThemeMode;
  onToggleTheme?: () => void;
  userRole: UserRole;
  userName?: string;
  userIdentifier?: string;
  userPhoto?: string;
  isVerified?: boolean;
  isAdmin?: boolean;
  onOpenProfile: () => void;
  onOpenAdminDashboard?: () => void;
  onOpenChatInbox?: () => void;
  onOpenUniversalSearch?: () => void;
  onOpenFeedback?: () => void;
  onOpenFirmPortal?: () => void;
  unreadChatCount?: number;
  urgentAlertCount: number;
  // New optional notification props
  notifications?: AppNotification[];
  onDismissNotification?: (id: string) => void;
  onDismissAllNotifications?: () => void;
}

// NYAAYNEETI label per language
const NYAAYNEETI_LABEL: Record<Language, string> = {
  en: 'NYAAYNEETI',
  hi: 'न्यायनीति',
  mr: 'न्यायनीती',
};

export const TopAppBar: React.FC<TopAppBarProps> = ({
  language,
  onSelectLanguage,
  onToggleLanguage,
  theme = 'bnw',
  onToggleTheme,
  userRole,
  userName,
  userIdentifier,
  userPhoto,
  isVerified = false,
  isAdmin = false,
  onOpenProfile,
  onOpenAdminDashboard,
  onOpenChatInbox,
  onOpenUniversalSearch,
  onOpenFeedback,
  onOpenFirmPortal,
  unreadChatCount = 0,
  urgentAlertCount,
  notifications = [],
  onDismissNotification,
  onDismissAllNotifications,
}) => {
  const [scrolled, setScrolled] = useState(false);
  const [prevAlertCount, setPrevAlertCount] = useState(urgentAlertCount);
  const [bellShake, setBellShake] = useState(false);

  // Panel open states
  const [notifOpen, setNotifOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);

  // Refs for outside-click detection
  const notifRef = useRef<HTMLDivElement>(null);
  const settingsRef = useRef<HTMLDivElement>(null);

  // Scroll shadow
  useEffect(() => {
    const el = document.querySelector('[data-scroll-target]');
    const handleScroll = (e: Event) => {
      const target = e.target as HTMLElement;
      setScrolled(target.scrollTop > 8);
    };
    el?.addEventListener('scroll', handleScroll);
    return () => el?.removeEventListener('scroll', handleScroll);
  }, []);

  // Shake bell when new urgent alerts arrive
  useEffect(() => {
    if (urgentAlertCount > prevAlertCount) {
      setBellShake(true);
      setTimeout(() => setBellShake(false), 800);
    }
    setPrevAlertCount(urgentAlertCount);
  }, [urgentAlertCount]);

  // Close panels on outside click
  useEffect(() => {
    const handleOutside = (e: MouseEvent) => {
      if (notifOpen && notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setNotifOpen(false);
      }
      if (settingsOpen && settingsRef.current && !settingsRef.current.contains(e.target as Node)) {
        setSettingsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, [notifOpen, settingsOpen]);

  const displayName =
    userName ||
    (userRole === 'lawyer'
      ? language === 'en'
        ? 'Advocate Profile'
        : 'अधिवक्ता प्रोफ़ाइल'
      : language === 'en'
      ? 'Citizen Account'
      : 'नागरिक खाता');

  const displayId =
    userIdentifier || (userRole === 'lawyer' ? 'Bar Council Member' : 'NYAAYNEETI Citizen');

  const unreadNotifs = notifications.filter((n) => !n.read);

  // Theme icon helper
  const ThemeIcon = () => {
    if (theme === 'bnw') return <span className="text-[9px] font-mono font-black text-white">B&W</span>;
    if (theme === 'light') return <Sun size={13} className="text-amber-400" />;
    return <Moon size={13} className="text-amber-300" />;
  };

  const themeLabel = theme === 'bnw' ? 'B&W' : theme === 'light' ? 'Light' : 'Dark';

  // Cycle theme: bnw -> dark -> light -> bnw
  const handleThemeCycle = () => {
    if (onToggleTheme) onToggleTheme();
  };

  return (
    <header
      className={`sticky top-0 z-30 px-3 sm:px-5 py-2.5 sm:py-3 flex items-center justify-between border-b transition-colors duration-200 backdrop-blur-2xl ${
        scrolled ? 'bg-black/95 border-white/[0.08]' : 'bg-black/75 border-white/[0.04]'
      }`}
    >
      {/* ── LEFT: Profile & Identity ── */}
      <motion.div
        onClick={onOpenProfile}
        className="flex items-center gap-2.5 sm:gap-3 cursor-pointer min-w-0"
        whileTap={{ scale: 0.96 }}
        transition={{ type: 'spring', stiffness: 600, damping: 30 }}
      >
        {/* Avatar */}
        <div className="relative shrink-0">
          {userPhoto ? (
            <motion.img
              src={userPhoto}
              alt={displayName}
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: 'spring', stiffness: 400, damping: 24 }}
              className="w-9 h-9 sm:w-10 sm:h-10 rounded-2xl object-cover border border-white/[0.14] shadow-[0_4px_16px_rgba(0,0,0,0.6)]"
            />
          ) : (
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: 'spring', stiffness: 400, damping: 24 }}
              className="w-9 h-9 sm:w-10 sm:h-10 rounded-2xl bg-gradient-to-b from-neutral-800 to-neutral-950 border border-white/[0.14] flex items-center justify-center text-amber-300 shadow-[0_4px_16px_rgba(0,0,0,0.6)]"
            >
              {userRole === 'lawyer' ? (
                <Scale size={17} strokeWidth={1.9} />
              ) : (
                <UserCheck size={17} strokeWidth={1.9} />
              )}
            </motion.div>
          )}

          {/* Verification badge */}
          <AnimatePresence>
            {isVerified ? (
              <motion.span
                key="verified"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0 }}
                transition={{ type: 'spring', stiffness: 600, damping: 20 }}
                className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-emerald-500 border-2 border-black flex items-center justify-center"
                title="Verified"
              >
                <ShieldCheck size={8} strokeWidth={3} className="text-black" />
              </motion.span>
            ) : (
              <motion.span
                key="pending"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0 }}
                transition={{ type: 'spring', stiffness: 600, damping: 20 }}
                className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-amber-400 border-2 border-black flex items-center justify-center"
                title="Verification Pending"
              >
                <Clock size={8} strokeWidth={3} className="text-black" />
              </motion.span>
            )}
          </AnimatePresence>
        </div>

        {/* Name + ID + NYAAYNEETI pill */}
        <div className="flex flex-col min-w-0 max-w-[110px] sm:max-w-none">
          <div className="flex items-center gap-1.5">
            <span className="font-semibold text-xs text-white tracking-tight truncate">
              {displayName}
            </span>
            {isVerified ? (
              <ShieldCheck size={12} className="text-emerald-400 shrink-0" />
            ) : (
              <span className="text-[8.5px] px-1 rounded bg-amber-500/20 text-amber-300 font-mono shrink-0 hidden sm:inline">
                Pending
              </span>
            )}
          </div>
          <span className="text-[9.5px] text-neutral-400 font-mono tracking-tight truncate">
            {displayId}
          </span>
        </div>
      </motion.div>

      {/* ── RIGHT: Controls ── */}
      <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">

        {/* Universal Search — lawyer only */}
        {userRole === 'lawyer' && onOpenUniversalSearch && (
          <button
            type="button"
            onClick={onOpenUniversalSearch}
            className="relative w-8 h-8 rounded-full bg-white/[0.06] hover:bg-white/[0.12] border border-white/[0.1] flex items-center justify-center text-neutral-300 hover:text-white transition ios-press cursor-pointer"
            aria-label="Universal Search"
            title="Search Section 69, Cases, Statutes, Clients"
          >
            <Search size={14} strokeWidth={1.9} />
          </button>
        )}

        {/* Firm / Chambers / College Clinic — lawyer only */}
        {userRole === 'lawyer' && onOpenFirmPortal && (
          <button
            type="button"
            onClick={onOpenFirmPortal}
            className="relative w-8 h-8 rounded-full bg-violet-500/10 hover:bg-violet-500/20 border border-violet-500/30 flex items-center justify-center text-violet-300 transition ios-press cursor-pointer"
            aria-label="Firm Dashboard"
            title={
              language === 'mr'
                ? 'फर्म व संस्था पोर्टल'
                : language === 'hi'
                ? 'फर्म एवं कॉलेज पोर्टल'
                : 'Chambers & College Clinic'
            }
          >
            <Building2 size={14} strokeWidth={1.9} />
          </button>
        )}

        {/* Chat Inbox */}
        {onOpenChatInbox && (
          <button
            type="button"
            onClick={onOpenChatInbox}
            className="relative w-8 h-8 rounded-full bg-white/[0.06] hover:bg-white/[0.12] border border-white/[0.1] flex items-center justify-center text-neutral-300 hover:text-white transition ios-press cursor-pointer"
            aria-label="Chat Inbox"
            title={language === 'mr' ? 'संदेश' : language === 'hi' ? 'संदेश' : 'Chat Inbox'}
          >
            <MessageSquare size={14} strokeWidth={1.9} />
            {unreadChatCount > 0 && (
              <span className="absolute top-1 right-1 w-2 h-2 bg-blue-500 rounded-full shadow-[0_0_6px_rgba(59,130,246,0.9)]" />
            )}
          </button>
        )}

        {/* Feedback button — client only */}
        {userRole === 'client' && onOpenFeedback && (
          <button
            type="button"
            onClick={onOpenFeedback}
            className="relative w-8 h-8 rounded-full bg-amber-400/10 hover:bg-amber-400/20 border border-amber-400/30 flex items-center justify-center text-amber-300 transition ios-press cursor-pointer"
            aria-label="Feedback"
            title={
              language === 'mr'
                ? 'अभिप्राय पाठवा'
                : language === 'hi'
                ? 'प्रतिक्रिया दें'
                : 'Citizen Feedback'
            }
          >
            <MessageSquare size={14} strokeWidth={1.9} />
          </button>
        )}

        {/* ── Bell / Notifications ── */}
        <div className="relative" ref={notifRef}>
          <button
            type="button"
            onClick={() => {
              setNotifOpen((v) => !v);
              setSettingsOpen(false);
            }}
            className="relative w-8 h-8 rounded-full bg-white/[0.05] hover:bg-white/[0.1] border border-white/[0.08] flex items-center justify-center text-neutral-300 transition ios-press cursor-pointer"
            aria-label="Notifications"
          >
            <motion.div
              animate={
                bellShake
                  ? {
                      rotate: [0, -12, 12, -8, 8, -4, 4, 0],
                      transition: { duration: 0.6, ease: 'easeInOut' },
                    }
                  : {}
              }
              className="flex items-center justify-center"
            >
              <Bell size={15} strokeWidth={1.8} />
            </motion.div>
            <AnimatePresence>
              {(urgentAlertCount > 0 || unreadNotifs.length > 0) && (
                <motion.span
                  key="alert-dot"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  exit={{ scale: 0 }}
                  transition={{ type: 'spring', stiffness: 600, damping: 20 }}
                  className="absolute top-1 right-1 w-2 h-2 bg-rose-500 rounded-full shadow-[0_0_8px_rgba(244,63,94,0.9)]"
                />
              )}
            </AnimatePresence>
          </button>

          {/* Notification dropdown panel */}
          <AnimatePresence>
            {notifOpen && (
              <motion.div
                initial={{ opacity: 0, y: -8, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -8, scale: 0.97 }}
                transition={{ type: 'spring', stiffness: 400, damping: 28 }}
                className="absolute right-0 top-10 z-50 w-72 sm:w-80 bg-neutral-950/95 backdrop-blur-2xl border border-white/[0.1] rounded-2xl shadow-[0_8px_40px_rgba(0,0,0,0.7)] overflow-hidden"
              >
                {/* Header */}
                <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.07]">
                  <span className="text-xs font-semibold text-white tracking-tight">
                    {language === 'mr'
                      ? 'सूचना'
                      : language === 'hi'
                      ? 'सूचनाएँ'
                      : 'Notifications'}
                  </span>
                  <div className="flex items-center gap-2">
                    {unreadNotifs.length > 0 && onDismissAllNotifications && (
                      <button
                        type="button"
                        onClick={onDismissAllNotifications}
                        className="text-[10px] font-mono text-amber-300 hover:text-amber-200 transition"
                      >
                        {language === 'mr'
                          ? 'सर्व काढा'
                          : language === 'hi'
                          ? 'सभी हटाएं'
                          : 'Dismiss all'}
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => setNotifOpen(false)}
                      className="text-neutral-500 hover:text-neutral-200 transition"
                    >
                      <X size={14} />
                    </button>
                  </div>
                </div>

                {/* Notification list */}
                <div className="max-h-64 overflow-y-auto">
                  {unreadNotifs.length === 0 ? (
                    <div className="px-4 py-6 text-center text-[11px] text-neutral-500">
                      {language === 'mr'
                        ? 'कोणत्याही नवीन सूचना नाहीत'
                        : language === 'hi'
                        ? 'कोई नई सूचना नहीं'
                        : 'No new notifications'}
                    </div>
                  ) : (
                    <ul>
                      {unreadNotifs.map((notif) => (
                        <li
                          key={notif.id}
                          className="flex items-start gap-2.5 px-4 py-3 border-b border-white/[0.04] last:border-b-0 hover:bg-white/[0.03] transition"
                        >
                          <span className="mt-0.5 w-1.5 h-1.5 rounded-full bg-rose-400 shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p className="text-[11px] font-semibold text-white truncate">
                              {notif.title}
                            </p>
                            <p className="text-[10px] text-neutral-400 mt-0.5 line-clamp-2">
                              {notif.message}
                            </p>
                          </div>
                          {onDismissNotification && (
                            <button
                              type="button"
                              onClick={() => onDismissNotification(notif.id)}
                              className="text-neutral-600 hover:text-neutral-300 transition shrink-0"
                            >
                              <X size={12} />
                            </button>
                          )}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* ── Settings gear ── */}
        <div className="relative" ref={settingsRef}>
          <button
            type="button"
            onClick={() => {
              setSettingsOpen((v) => !v);
              setNotifOpen(false);
            }}
            className="relative w-8 h-8 rounded-full bg-white/[0.06] hover:bg-white/[0.12] border border-white/[0.1] flex items-center justify-center text-neutral-300 hover:text-white transition ios-press cursor-pointer"
            aria-label="Settings"
            title="Settings"
          >
            <motion.div
              animate={settingsOpen ? { rotate: 45 } : { rotate: 0 }}
              transition={{ type: 'spring', stiffness: 300, damping: 22 }}
            >
              <Settings size={14} strokeWidth={1.9} />
            </motion.div>
          </button>

          {/* Settings panel */}
          <AnimatePresence>
            {settingsOpen && (
              <motion.div
                initial={{ opacity: 0, y: -8, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -8, scale: 0.97 }}
                transition={{ type: 'spring', stiffness: 400, damping: 28 }}
                className="absolute right-0 top-10 z-50 w-56 bg-neutral-950/95 backdrop-blur-2xl border border-white/[0.1] rounded-2xl shadow-[0_8px_40px_rgba(0,0,0,0.7)] overflow-hidden"
              >
                {/* Header */}
                <div className="flex items-center justify-between px-4 py-2.5 border-b border-white/[0.07]">
                  <span className="text-xs font-semibold text-white tracking-tight">
                    {language === 'mr' ? 'सेटिंग्ज' : language === 'hi' ? 'सेटिंग्स' : 'Settings'}
                  </span>
                  <button
                    type="button"
                    onClick={() => setSettingsOpen(false)}
                    className="text-neutral-500 hover:text-neutral-200 transition"
                  >
                    <X size={14} />
                  </button>
                </div>

                <div className="px-4 py-3 flex flex-col gap-3">
                  {/* Language toggle */}
                  <div>
                    <p className="text-[9px] font-mono text-neutral-500 uppercase tracking-widest mb-1.5">
                      {language === 'mr' ? 'भाषा' : language === 'hi' ? 'भाषा' : 'Language'}
                    </p>
                    <div className="flex items-center bg-white/[0.07] border border-white/[0.12] p-0.5 rounded-full text-[10px] font-mono w-full">
                      {(['en', 'hi', 'mr'] as Language[]).map((lang, i, arr) => (
                        <button
                          key={lang}
                          type="button"
                          onClick={() => onSelectLanguage?.(lang)}
                          className={`flex-1 py-1 rounded-full transition-all font-mono text-[10px] ${
                            language === lang
                              ? 'bg-white text-black font-black shadow-sm'
                              : 'text-neutral-400 hover:text-white'
                          }`}
                          title={lang === 'en' ? 'English' : lang === 'hi' ? 'हिन्दी' : 'मराठी'}
                        >
                          {lang === 'en' ? 'EN' : lang === 'hi' ? 'हिं' : 'म'}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Theme toggle */}
                  {onToggleTheme && (
                    <div>
                      <p className="text-[9px] font-mono text-neutral-500 uppercase tracking-widest mb-1.5">
                        {language === 'mr' ? 'थीम' : language === 'hi' ? 'थीम' : 'Theme'}
                      </p>
                      <div className="flex items-center bg-white/[0.07] border border-white/[0.12] p-0.5 rounded-full text-[10px] font-mono w-full">
                        {(['bnw', 'dark', 'light'] as ThemeMode[]).map((t) => (
                          <button
                            key={t}
                            type="button"
                            onClick={() => {
                              // Cycle to this specific theme by calling onToggleTheme until we reach it
                              // Since onToggleTheme just cycles, we call it the right number of times
                              // But to keep it simple, just call onToggleTheme once and let parent manage
                              handleThemeCycle();
                            }}
                            className={`flex-1 py-1 rounded-full transition-all font-mono text-[10px] flex items-center justify-center gap-0.5 ${
                              theme === t
                                ? 'bg-white text-black font-black shadow-sm'
                                : 'text-neutral-400 hover:text-white'
                            }`}
                            title={t === 'bnw' ? 'B&W' : t === 'light' ? 'Light' : 'Dark'}
                          >
                            {t === 'bnw' ? (
                              'B&W'
                            ) : t === 'light' ? (
                              <Sun size={11} />
                            ) : (
                              <Moon size={11} />
                            )}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Update Profile Photo */}
                  <button
                    type="button"
                    onClick={() => {
                      setSettingsOpen(false);
                      onOpenProfile();
                    }}
                    className="w-full py-2 rounded-xl bg-amber-400/10 hover:bg-amber-400/20 border border-amber-400/25 text-amber-300 text-[11px] font-semibold transition"
                  >
                    {language === 'mr'
                      ? 'प्रोफाइल फोटो अपडेट करा'
                      : language === 'hi'
                      ? 'प्रोफ़ाइल फ़ोटो अपडेट करें'
                      : 'Update Profile Photo'}
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </header>
  );
};
