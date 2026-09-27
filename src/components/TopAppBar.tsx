import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldCheck, Bell, Scale, UserCheck, ShieldAlert, Clock, MessageSquare } from 'lucide-react';
import { Language, UserRole } from '../types';

interface TopAppBarProps {
  language: Language;
  userRole: UserRole;
  userName?: string;
  userIdentifier?: string;
  userPhoto?: string;
  isVerified?: boolean;
  isAdmin?: boolean;
  onOpenProfile: () => void;
  onOpenAdminDashboard?: () => void;
  onOpenChatInbox?: () => void;
  unreadChatCount?: number;
  urgentAlertCount: number;
}

export const TopAppBar: React.FC<TopAppBarProps> = ({
  language,
  userRole,
  userName,
  userIdentifier,
  userPhoto,
  isVerified = false,
  isAdmin = false,
  onOpenProfile,
  onOpenAdminDashboard,
  onOpenChatInbox,
  unreadChatCount = 0,
  urgentAlertCount,
}) => {
  const [scrolled, setScrolled] = useState(false);
  const [prevAlertCount, setPrevAlertCount] = useState(urgentAlertCount);
  const [bellShake, setBellShake] = useState(false);

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

  const displayName = userName || (userRole === 'lawyer'
    ? (language === 'en' ? 'Advocate Profile' : 'अधिवक्ता प्रोफ़ाइल')
    : (language === 'en' ? 'Citizen Account' : 'नागरिक खाता'));
  const displayId = userIdentifier || (userRole === 'lawyer' ? 'Bar Council Member' : 'NYAAYNEETI Citizen');

  return (
    <header
      className={`sticky top-0 z-30 px-4 sm:px-5 py-3.5 flex items-center justify-between border-b transition-colors duration-200 backdrop-blur-2xl ${
        scrolled ? 'bg-black/95 border-white/[0.08]' : 'bg-black/75 border-white/[0.04]'
      }`}
    >
      {/* Profile & Identity */}
      <motion.div
        onClick={onOpenProfile}
        className="flex items-center gap-3 cursor-pointer"
        whileTap={{ scale: 0.96 }}
        transition={{ type: 'spring', stiffness: 600, damping: 30 }}
      >
        <div className="relative">
          {userPhoto ? (
            <motion.img
              src={userPhoto}
              alt={displayName}
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: 'spring', stiffness: 400, damping: 24 }}
              className="w-10 h-10 rounded-2xl object-cover border border-white/[0.14] shadow-[0_4px_16px_rgba(0,0,0,0.6)]"
            />
          ) : (
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: 'spring', stiffness: 400, damping: 24 }}
              className="w-10 h-10 rounded-2xl bg-gradient-to-b from-neutral-800 to-neutral-950 border border-white/[0.14] flex items-center justify-center text-amber-300 shadow-[0_4px_16px_rgba(0,0,0,0.6)]"
            >
              {userRole === 'lawyer'
                ? <Scale size={18} strokeWidth={1.9} />
                : <UserCheck size={18} strokeWidth={1.9} />
              }
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

        <div className="flex flex-col">
          <div className="flex items-center gap-1.5">
            <span className="font-semibold text-xs text-white tracking-tight">
              {displayName}
            </span>
            {isVerified
              ? <ShieldCheck size={13} className="text-emerald-400" />
              : <span className="text-[9px] px-1 rounded bg-amber-500/20 text-amber-300 font-mono">Pending</span>
            }
          </div>
          <span className="text-[10px] text-neutral-400 font-mono tracking-tight line-clamp-1">
            {displayId}
          </span>
        </div>
      </motion.div>

      {/* Right Controls */}
      <div className="flex items-center gap-2">
        {/* Admin button */}
        {isAdmin && onOpenAdminDashboard && (
          <button
            type="button"
            onClick={onOpenAdminDashboard}
            className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-400/15 hover:bg-amber-400/25 border border-amber-400/30 text-[10px] font-bold text-amber-300 shadow-sm transition ios-press cursor-pointer"
            title="Admin Verification Dashboard"
          >
            <ShieldAlert size={11} />
            <span>Admin</span>
          </button>
        )}

        {/* Role badge */}
        <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-white/[0.04] border border-white/[0.08] text-[10px] font-medium text-neutral-400 select-none">
          {userRole === 'lawyer'
            ? (language === 'en' ? 'Advocate' : 'अधिवक्ता')
            : (language === 'en' ? 'Citizen' : 'नागरिक')
          }
        </div>

        {/* Chat button */}
        {onOpenChatInbox && (
          <button
            type="button"
            onClick={onOpenChatInbox}
            className="relative w-8 h-8 rounded-full bg-white/[0.05] hover:bg-amber-400/20 border border-white/[0.08] hover:border-amber-400/40 flex items-center justify-center text-neutral-300 hover:text-amber-300 transition ios-press cursor-pointer"
            aria-label="Messages"
          >
            <MessageSquare size={14} strokeWidth={1.9} />
            <AnimatePresence>
              {unreadChatCount > 0 && (
                <motion.span
                  key="chat-badge"
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0, opacity: 0 }}
                  transition={{ type: 'spring', stiffness: 600, damping: 20 }}
                  className="absolute -top-0.5 -right-0.5 min-w-[14px] h-[14px] px-0.5 bg-amber-400 text-black text-[9px] font-bold rounded-full flex items-center justify-center shadow-[0_0_8px_rgba(245,197,99,0.9)]"
                >
                  {unreadChatCount > 9 ? '9+' : unreadChatCount}
                </motion.span>
              )}
            </AnimatePresence>
          </button>
        )}

        {/* Bell */}
        <button
          type="button"
          onClick={onOpenProfile}
          className="relative w-8 h-8 rounded-full bg-white/[0.05] hover:bg-white/[0.1] border border-white/[0.08] flex items-center justify-center text-neutral-300 transition ios-press cursor-pointer"
          aria-label="Notifications"
        >
          <motion.div
            animate={bellShake ? {
              rotate: [0, -12, 12, -8, 8, -4, 4, 0],
              transition: { duration: 0.6, ease: 'easeInOut' }
            } : {}}
            className="flex items-center justify-center"
          >
            <Bell size={15} strokeWidth={1.8} />
          </motion.div>
          <AnimatePresence>
            {urgentAlertCount > 0 && (
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
      </div>
    </header>
  );
};
