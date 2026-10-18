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
      <header className="unified-top-bar sticky top-0 z-30 w-full bg-black dark:bg-black/95 backdrop-blur-2xl border-b border-white/[0.14] px-2.5 sm:px-4 py-1.5 sm:py-2 text-white shadow-md">
        <div className="max-w-4xl mx-auto flex items-center justify-between gap-1.5 sm:gap-3">
          {/* Brand as Dropdown Menu Trigger - Displays logged-in lawyer name prominently */}
          <div className="relative min-w-0 flex-1 sm:flex-initial" ref={menuRef}>
            <button
              type="button"
              onClick={() => setShowMenu(prev => !prev)}
              className="flex items-center gap-1.5 p-0.5 rounded-xl hover:bg-white/[0.08] transition text-left ios-press focus:outline-none max-w-full"
              title={displayName}
            >
              <div className="w-7 h-7 rounded-lg bg-amber-400/20 border border-amber-400/35 flex items-center justify-center text-amber-300 shrink-0">
                <Scale size={14} />
              </div>
              <div className="flex items-center gap-1 min-w-0">
                <div className="flex flex-col text-left min-w-0">
                  <span className="text-xs sm:text-sm font-bold text-white tracking-tight font-display truncate max-w-[95px] xs:max-w-[130px] sm:max-w-[200px] leading-tight">
                    {displayName}
                  </span>
                  <span className="text-[9px] sm:text-[9.5px] font-mono text-amber-400 font-semibold tracking-wider flex items-center gap-1 leading-tight truncate">
                    NYAAYNEETI {userTag || (userRole === 'lawyer' ? (language === 'hi' ? 'काउंसिल' : language === 'mr' ? 'कौन्सिल' : 'Counsel') : (language === 'hi' ? 'नागरिक' : language === 'mr' ? 'नागरिक' : 'Client'))}
                  </span>
                </div>
                <ChevronDown
                  size={12}
                  className={`text-neutral-400 shrink-0 transition-transform ${showMenu ? 'rotate-180 text-amber-300' : ''}`}
                />
              </div>
            </button>

            {/* ── Nyaayneeti Menu Dropdown: ONLY Edit Profile (per user request) ── */}
            {showMenu && (
              <div className="absolute top-11 left-0 z-50 w-64 bg-white dark:bg-neutral-950 border border-neutral-200 dark:border-white/[0.16] rounded-3xl p-3 shadow-2xl backdrop-blur-2xl space-y-2 animate-in fade-in text-neutral-900 dark:text-white">
                <div className="flex items-center justify-between px-2 py-1 border-b border-neutral-200 dark:border-white/[0.06] text-[11px] font-mono text-neutral-500 dark:text-neutral-400">
                  <span className="font-bold text-amber-400">
                    {language === 'hi' ? 'न्यायनीति मेनू' : language === 'mr' ? 'न्यायनीती मेनू' : 'NYAAYNEETI MENU'}
                  </span>
                  <span>{language === 'hi' ? 'मेरा खाता' : language === 'mr' ? 'माझे खाते' : 'My Account'}</span>
                </div>

                <div className="px-2 py-1">
                  <p className="text-xs font-bold text-neutral-900 dark:text-white leading-tight truncate">{displayName}</p>
                  <p className="text-[10px] text-neutral-600 dark:text-neutral-400 font-mono">
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

          {/* Action Icons: NyaayAI + Universal Search + Bell */}
          <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
            {onOpenLawyerAI && (
              <button
                type="button"
                onClick={onOpenLawyerAI}
                aria-label="NyaayAI"
                title="NyaayAI"
                className="flex items-center gap-1 px-2 py-1.5 sm:px-2.5 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-black font-bold text-xs shadow-md transition ios-press shrink-0 cursor-pointer"
              >
                <Sparkles size={13} className="text-black animate-pulse shrink-0" />
                <span className="font-sans font-bold text-[11px] sm:text-xs tracking-tight whitespace-nowrap">NyaayAI</span>
              </button>
            )}

            {onOpenSearch && (
              <button
                type="button"
                onClick={onOpenSearch}
                aria-label={language === 'hi' ? 'सार्वभौमिक खोज' : language === 'mr' ? 'सार्वत्रिक शोध' : 'Universal Search'}
                className="w-8 h-8 sm:w-9 sm:h-9 min-w-[32px] sm:min-w-[36px] rounded-xl bg-white/[0.1] hover:bg-white/[0.18] text-white flex items-center justify-center transition ios-press border border-white/[0.16] shrink-0"
              >
                <Search size={15} />
              </button>
            )}

            {/* Notification Bell Button - Top Right Corner */}
            <button
              type="button"
              onClick={() => setShowNotifications(true)}
              aria-label={language === 'hi' ? 'सूचनाएं' : language === 'mr' ? 'सूचना' : 'Notifications'}
              title={language === 'hi' ? 'सूचनाएं' : language === 'mr' ? 'सूचना' : 'Notifications'}
              className="w-8 h-8 sm:w-9 sm:h-9 min-w-[32px] sm:min-w-[36px] rounded-xl bg-white/[0.1] hover:bg-white/[0.18] text-white hover:text-amber-300 flex items-center justify-center transition ios-press relative border border-white/[0.16] shadow-sm shrink-0 cursor-pointer mr-0.5"
            >
              <Bell size={16} />
              {((unreadAlertCount || 0) + notifications.filter(n => !n.read).length) > 0 && (
                <span className="absolute -top-1 -right-1 min-w-[16px] h-[16px] px-0.5 rounded-full bg-red-500 text-white text-[8.5px] font-bold font-mono flex items-center justify-center border-2 border-white dark:border-black shadow-sm animate-pulse">
                  {((unreadAlertCount || 0) + notifications.filter(n => !n.read).length) > 9 ? '9+' : ((unreadAlertCount || 0) + notifications.filter(n => !n.read).length)}
                </span>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* ── Top-Down Notification Drawer (Opens from top, slidable both left & right) ── */}
      <AnimatePresence>
        {showNotifications && (() => {
          const unreadNotifications = notifications.filter(n => !n.read);
          const hasNotifications = notifications.length > 0;
          return (
            <>
              {/* Dark backdrop */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setShowNotifications(false)}
                className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
              />

              {/* Notification Shade sliding down from top */}
              <motion.div
                initial={{ y: -60, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: -60, opacity: 0 }}
                transition={{ type: 'spring', damping: 28, stiffness: 380 }}
                className="fixed top-0 left-0 right-0 z-50 max-w-lg mx-auto bg-neutral-900 border-b border-white/[0.15] rounded-b-3xl shadow-2xl p-4 sm:p-5 max-h-[85vh] flex flex-col text-white"
              >
                {/* Header */}
                <div className="flex items-center justify-between pb-3 border-b border-white/[0.08]">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-amber-400/20 border border-amber-400/35 flex items-center justify-center text-amber-300">
                      <Bell size={16} />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-white tracking-tight">
                        {language === 'hi' ? 'सूचनाएं' : language === 'mr' ? 'सूचना' : 'Notification Center'}
                      </h3>
                      <p className="text-[10px] text-neutral-400 font-mono">
                        {unreadNotifications.length > 0
                          ? `${unreadNotifications.length} ${language === 'hi' ? 'अपठित सूचनाएं' : language === 'mr' ? 'न वाचलेल्या सूचना' : 'unread updates'}`
                          : hasNotifications
                          ? `${notifications.length} ${language === 'hi' ? 'सूचनाएं' : language === 'mr' ? 'सूचना' : 'notifications'}`
                          : (language === 'hi' ? 'कोई अपठित सूचना नहीं है' : language === 'mr' ? 'कोणतीही न वाचलेली सूचना नाही' : 'No unread notifications')}
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setShowNotifications(false)}
                    className="p-1.5 rounded-xl hover:bg-white/[0.08] text-neutral-400 hover:text-white transition ios-press"
                    aria-label="Close"
                  >
                    <X size={18} />
                  </button>
                </div>

                {/* Toolbar */}
                {hasNotifications && (
                  <div className="flex items-center justify-between py-2 border-b border-white/[0.06] my-1">
                    <span className="text-[11px] font-mono text-neutral-400">
                      {notifications.length} {notifications.length === 1 ? 'alert' : 'alerts'} {unreadNotifications.length > 0 ? `(${unreadNotifications.length} unread)` : ''}
                    </span>
                    {onDismissAllNotifications && (
                      <button
                        type="button"
                        onClick={() => onDismissAllNotifications()}
                        className="text-xs font-mono font-semibold text-amber-400 hover:text-amber-300 transition ios-press flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-400/10 border border-amber-400/20"
                      >
                        <Trash2 size={12} />
                        <span>{language === 'hi' ? 'सभी हटाएं' : language === 'mr' ? 'सर्व काढा' : 'Dismiss All'}</span>
                      </button>
                    )}
                  </div>
                )}

                {/* Notification Items */}
                <div className="flex-1 overflow-y-auto min-h-0 pt-2 space-y-2">
                  {!hasNotifications ? (
                    <div className="p-8 text-center text-neutral-400 text-xs">
                      {language === 'hi'
                        ? 'कोई नई सूचना नहीं है'
                        : language === 'mr'
                        ? 'कोणतीही नवीन सूचना नाही'
                        : 'All caught up! No recent alerts.'}
                    </div>
                  ) : (
                    <>
                      <p className="text-[10px] text-neutral-400 font-mono italic">
                        👉 {language === 'hi' ? 'हटाने के लिए दोनों तरफ (बाएं या दाएं) स्लाइड करें या ✕ दबाएं' : language === 'mr' ? 'काढण्यासाठी डावीकडे किंवा उजवीकडे स्वाइप करा' : 'Slide left or right to dismiss, or tap ✕'}
                      </p>
                      <AnimatePresence mode="popLayout">
                        {notifications.map(n => (
                          <motion.div
                            key={n.id}
                            layout
                            initial={{ opacity: 0, y: 10, scale: 0.98 }}
                            animate={{ opacity: 1, y: 0, scale: 1, x: 0 }}
                            exit={{ opacity: 0, scale: 0.85, height: 0, marginBottom: 0, padding: 0 }}
                            transition={{ type: 'spring', stiffness: 450, damping: 32 }}
                            drag="x"
                            dragConstraints={{ left: -220, right: 220 }}
                            dragElastic={0.4}
                            onDragEnd={(_, info) => {
                              // Slidable BOTH left and right
                              if (Math.abs(info.offset.x) > 60 || Math.abs(info.velocity.x) > 200) {
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
                    </>
                  )}
                </div>
              </motion.div>
            </>
          );
        })()}
      </AnimatePresence>
    </>
  );
};
