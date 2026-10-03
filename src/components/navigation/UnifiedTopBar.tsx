import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Bell,
  Search,
  Scale,
  X,
  Check,
  Building2,
  Shield,
  MessageSquare,
  Globe,
  Sun,
  Moon,
  LogOut,
  ChevronDown,
  Sparkles,
  ExternalLink,
  Trash2,
  Award,
  Users,
  Share2,
  Video,
  Settings as SettingsIcon,
  UserCheck,
} from 'lucide-react';
import { Sheet } from '../../design/ui/Sheet';
import { AppNotification, Language, ThemeMode, UserRole } from '../../types';

interface UnifiedTopBarProps {
  userRole: UserRole;
  language: Language;
  userTag?: string;
  userName?: string;
  barCouncilId?: string;
  notifications?: AppNotification[];
  unreadAlertCount?: number;
  onOpenProfile?: () => void;
  deleteAccount?: () => Promise<void> | void;
  onOpenSearch?: () => void;
  onOpenFirmPortal?: () => void;
  onOpenAdminDashboard?: () => void;
  onOpenFeedback?: () => void;
  onSelectLanguage?: (lang: Language) => void;
  theme?: ThemeMode;
  onToggleTheme?: () => void;
  onSwitchDemo?: (type: 'firm' | 'student') => void;
  onSignOut?: () => void;
  onDismissNotification?: (id: string) => void;
  onDismissAllNotifications?: () => void;
  onNotificationClick?: (notification: AppNotification) => void;
  onOpenLawyerAI?: () => void;
}

export const UnifiedTopBar: React.FC<UnifiedTopBarProps> = ({
  userRole,
  language,
  userTag,
  userName,
  barCouncilId,
  notifications = [],
  unreadAlertCount = 0,
  onOpenSearch,
  onOpenProfile,
  deleteAccount,
  onOpenFirmPortal,
  onOpenAdminDashboard,
  onOpenFeedback,
  onSelectLanguage,
  theme,
  onToggleTheme,
  onSwitchDemo,
  onSignOut,
  onDismissNotification,
  onDismissAllNotifications,
  onNotificationClick,
  onOpenLawyerAI,
}) => {
  const [showNotifications, setShowNotifications] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const displayName = userName
    ? (userName.trim().toLowerCase().startsWith('adv') ? userName.trim() : `Adv. ${userName.trim()}`)
    : (userRole === 'lawyer' ? 'Adv. Rajesh Sharma' : 'Citizen Client');

  // Close menu on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowMenu(false);
      }
    }
    if (showMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showMenu]);

  return (
    <>
      <header className="sticky top-0 z-30 w-full bg-black/90 backdrop-blur-2xl border-b border-white/[0.08] px-4 py-1.5 sm:py-2">
        <div className="max-w-4xl mx-auto flex items-center justify-between gap-3">
          {/* Brand as Dropdown Menu Trigger - Only Edit Profile per user request */}
          {/* Brand as Dropdown Menu Trigger - Displays logged-in lawyer name prominently */}
          <div className="relative" ref={menuRef}>
            <button
              type="button"
              onClick={() => setShowMenu(prev => !prev)}
              className="flex items-center gap-2 p-0.5 rounded-xl hover:bg-white/[0.06] transition text-left ios-press focus:outline-none"
              title={displayName}
            >
              <div className="w-7 h-7 rounded-lg bg-amber-400/20 border border-amber-400/35 flex items-center justify-center text-amber-300 shrink-0">
                <Scale size={15} />
              </div>
              <div className="flex items-center gap-1.5">
                <div className="flex flex-col text-left">
                  <span className="text-xs sm:text-sm font-bold text-white tracking-tight font-display truncate max-w-[150px] sm:max-w-[220px] leading-tight">
                    {displayName}
                  </span>
                  <span className="text-[9.5px] font-mono text-amber-400 font-semibold tracking-wider flex items-center gap-1 leading-tight">
                    NYAAYNEETI {userTag || (userRole === 'lawyer' ? (language === 'hi' ? 'काउंसिल' : language === 'mr' ? 'कौन्सिल' : 'Counsel') : (language === 'hi' ? 'नागरिक' : language === 'mr' ? 'नागरिक' : 'Client'))}
                  </span>
                </div>
                <ChevronDown
                  size={13}
                  className={`text-neutral-400 transition-transform ${showMenu ? 'rotate-180 text-amber-300' : ''}`}
                />
              </div>
            </button>

            {/* ── Nyaayneeti Menu Dropdown: ONLY Edit Profile (per user request) ── */}
            {showMenu && (
              <div className="absolute top-11 left-0 z-50 w-64 bg-neutral-950 border border-white/[0.16] rounded-3xl p-3 shadow-2xl backdrop-blur-2xl space-y-2 animate-in fade-in">
                <div className="flex items-center justify-between px-2 py-1 border-b border-white/[0.06] text-[11px] font-mono text-neutral-400">
                  <span className="font-bold text-amber-400">
                    {language === 'hi' ? 'न्यायनीति मेनू' : language === 'mr' ? 'न्यायनीती मेनू' : 'NYAAYNEETI MENU'}
                  </span>
                  <span>{language === 'hi' ? 'मेरा खाता' : language === 'mr' ? 'माझे खाते' : 'My Account'}</span>
                </div>

                <div className="px-2 py-1">
                  <p className="text-xs font-bold text-white leading-tight truncate">{displayName}</p>
                  <p className="text-[10px] text-neutral-400 font-mono">
                    {barCouncilId || (userRole === 'lawyer' ? (language === 'hi' ? 'बार काउंसिल सत्यापित' : language === 'mr' ? 'बार कौन्सिल सत्यापित' : 'Bar Council Verified') : (language === 'hi' ? 'पंजीकृत उपयोगकर्ता' : language === 'mr' ? 'नोंदणीकृत वापरकर्ता' : 'Registered User'))}
                  </p>
                </div>

                {/* ONLY OPTION: Edit Profile */}
                {onOpenProfile && (
                  <button
                    type="button"
                    onClick={() => {
                      setShowMenu(false);
                      onOpenProfile();
                    }}
                    className="w-full flex items-center justify-center gap-2 p-2.5 rounded-2xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-black font-semibold text-xs transition shadow-md ios-press"
                  >
                    <UserCheck size={16} />
                    <span>{language === 'hi' ? 'प्रोफ़ाइल संपादित करें' : language === 'mr' ? 'प्रोफाइल संपादित करा' : 'Edit Profile'}</span>
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Action Icons: Universal Search + Bell */}
          <div className="flex items-center gap-1.5">

            {onOpenSearch && (
              <button
                type="button"
                onClick={onOpenSearch}
                aria-label={language === 'hi' ? 'सार्वभौमिक खोज' : language === 'mr' ? 'सार्वत्रिक शोध' : 'Universal Search'}
                className="w-8 h-8 min-w-[32px] min-h-[32px] rounded-xl bg-white/[0.05] hover:bg-white/[0.1] text-neutral-300 hover:text-white flex items-center justify-center transition ios-press"
              >
                <Search size={16} />
              </button>
            )}

            <button
              type="button"
              onClick={() => setShowNotifications(true)}
              aria-label={language === 'hi' ? 'सूचनाएं' : language === 'mr' ? 'सूचना' : 'Notifications'}
              className="w-8 h-8 min-w-[32px] min-h-[32px] rounded-xl bg-white/[0.05] hover:bg-white/[0.1] text-neutral-300 hover:text-white flex items-center justify-center transition ios-press relative"
            >
              <Bell size={16} />
              {unreadAlertCount > 0 && (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-red-500 animate-pulse" />
              )}
            </button>
          </div>
        </div>
      </header>

      {/* ── Notification Center Sheet ── */}
      {(() => {
        const unreadNotifications = notifications.filter(n => !n.read);
        const hasNotifications = notifications.length > 0;
        return (
          <Sheet
            open={showNotifications}
            onOpenChange={setShowNotifications}
            title={language === 'hi' ? 'सूचनाएं' : language === 'mr' ? 'सूचना' : 'Notification Center'}
            description={
              unreadNotifications.length > 0
                ? `${unreadNotifications.length} ${language === 'hi' ? 'अपठित सूचनाएं' : language === 'mr' ? 'न वाचलेल्या सूचना' : 'unread updates'}`
                : hasNotifications
                ? `${notifications.length} ${language === 'hi' ? 'सूचनाएं' : language === 'mr' ? 'सूचना' : 'notifications'}`
                : (language === 'hi' ? 'कोई अपठित सूचना नहीं है' : language === 'mr' ? 'कोणतीही न वाचलेली सूचना नाही' : 'No unread notifications')
            }
            primary={
              hasNotifications && onDismissAllNotifications
                ? {
                    label: language === 'hi' ? 'सभी हटाएं' : language === 'mr' ? 'सर्व काढा' : 'Dismiss All',
                    onClick: () => {
                      onDismissAllNotifications();
                      setShowNotifications(false);
                    },
                  }
                : undefined
            }
          >
            {/* Top Toolbar with count & Dismiss All button */}
            {hasNotifications && (
              <div className="flex items-center justify-between pb-2 border-b border-white/[0.08] mb-1">
                <span className="text-[11px] font-mono text-neutral-400">
                  {notifications.length} {notifications.length === 1 ? (language === 'hi' ? 'सूचना' : language === 'mr' ? 'सूचना' : 'alert') : (language === 'hi' ? 'सूचनाएं' : language === 'mr' ? 'सूचना' : 'alerts')} {unreadNotifications.length > 0 ? `(${unreadNotifications.length} ${language === 'hi' ? 'अपठित' : language === 'mr' ? 'न वाचलेले' : 'unread'})` : ''}
                </span>
                {onDismissAllNotifications && (
                  <button
                    type="button"
                    onClick={() => {
                      onDismissAllNotifications();
                    }}
                    className="text-xs font-mono font-semibold text-amber-400 hover:text-amber-300 transition ios-press flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-400/10 border border-amber-400/20"
                  >
                    <Trash2 size={12} />
                    <span>{language === 'hi' ? 'सभी हटाएं' : language === 'mr' ? 'सर्व काढा' : 'Dismiss All'}</span>
                  </button>
                )}
              </div>
            )}

            {!hasNotifications ? (
              <div className="p-8 text-center text-sub text-xs">
                {language === 'hi'
                  ? 'कोई नई सूचना नहीं है'
                  : language === 'mr'
                  ? 'कोणतीही नवीन सूचना नाही'
                  : 'All caught up! No recent alerts.'}
              </div>
            ) : (
              <div className="space-y-2 overflow-hidden">
                <p className="text-[10px] text-neutral-500 font-mono italic">
                  👉 {language === 'hi' ? 'हटाने के लिए बाईं ओर स्लाइड करें या ✕ दबाएं' : language === 'mr' ? 'काढण्यासाठी डावीकडे स्वाइप करा किंवा ✕ दाबा' : 'Slide left or tap ✕ to dismiss'}
                </p>
                <AnimatePresence mode="popLayout">
                  {notifications.map(n => (
                    <motion.div
                      key={n.id}
                      layout
                      initial={{ opacity: 0, y: 10, scale: 0.98 }}
                      animate={{ opacity: 1, y: 0, scale: 1, x: 0 }}
                      exit={{ opacity: 0, x: -240, height: 0, marginBottom: 0, padding: 0 }}
                      transition={{ type: 'spring', stiffness: 450, damping: 32 }}
                      drag="x"
                      dragConstraints={{ left: -140, right: 0 }}
                      dragElastic={0.2}
                      onDragEnd={(_, info) => {
                        if (info.offset.x < -50 || info.velocity.x < -200) {
                          if (onDismissNotification) {
                            onDismissNotification(n.id);
                          }
                        }
                      }}
                      onClick={() => {
                        if (onNotificationClick) {
                          onNotificationClick(n);
                          setShowNotifications(false);
                        }
                      }}
                      className={`relative p-3.5 rounded-2xl border transition ios-press flex items-start justify-between gap-3 cursor-grab active:cursor-grabbing select-none ${
                        n.read
                          ? 'bg-white/[0.02] border-white/[0.06] text-neutral-400'
                          : 'bg-white/[0.06] border-white/[0.14] text-white shadow-sm'
                      }`}
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-semibold">{n.title}</span>
                          {!n.read && (
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0" />
                          )}
                        </div>
                        <p className="text-[11px] text-neutral-400 mt-0.5 line-clamp-2">
                          {n.message}
                        </p>
                      </div>

                      {onDismissNotification && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onDismissNotification(n.id);
                          }}
                          className="p-1.5 rounded-lg hover:bg-red-500/20 text-neutral-400 hover:text-red-300 transition shrink-0 ios-press"
                          title="Dismiss"
                        >
                          <X size={14} />
                        </button>
                      )}
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            )}
          </Sheet>
        );
      })()}
    </>
  );
};
