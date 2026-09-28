import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bot, CalendarCheck, FolderUp, Users, MessageSquare } from 'lucide-react';
import { translations } from '../../i18n/translations';
import { Language } from '../../types';

export type ClientNavTab = 'consult' | 'chats' | 'lawyers' | 'mycase' | 'docs' | 'payments';

interface ClientBottomNavProps {
  activeTab: ClientNavTab;
  onSelectTab: (tab: ClientNavTab) => void;
  language: Language;
  onToggleLanguage?: () => void;
  unreadCount?: number;
}

const clientTabs = [
  { id: 'consult' as ClientNavTab,  labelKey: 'clientNavConsult',  icon: Bot },
  { id: 'chats'   as ClientNavTab,  labelKey: 'clientNavChats',    icon: MessageSquare },
  { id: 'lawyers' as ClientNavTab,  labelKey: 'clientNavLawyers',  icon: Users },
  { id: 'mycase'  as ClientNavTab,  labelKey: 'clientNavMyCase',   icon: CalendarCheck },
  { id: 'docs'    as ClientNavTab,  labelKey: 'clientNavDocs',     icon: FolderUp },
];

export const ClientBottomNav: React.FC<ClientBottomNavProps> = ({
  activeTab,
  onSelectTab,
  language,
  onToggleLanguage,
  unreadCount = 0,
}) => {
  const t = translations[language] as Record<string, string>;

  return (
    <nav
      className="sticky bottom-0 z-30 bg-black/90 backdrop-blur-2xl border-t border-white/[0.06] px-2 py-1.5 flex items-center justify-around relative"
      style={{ paddingBottom: 'calc(0.375rem + env(safe-area-inset-bottom))' }}
    >
      {clientTabs.map((tab) => {
        const isActive = activeTab === tab.id;
        const Icon = tab.icon;
        const label = t[tab.labelKey] ?? tab.labelKey;

        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => onSelectTab(tab.id)}
            className="relative flex flex-col items-center justify-center flex-1 py-1.5 gap-0.5 rounded-2xl min-w-0 ios-press cursor-pointer"
          >
            {/* Sliding pill background */}
            {isActive && (
              <motion.span
                layoutId="client-nav-pill"
                className="absolute inset-0 rounded-2xl bg-white/[0.08]"
                transition={{ type: 'spring', stiffness: 400, damping: 32 }}
              />
            )}

            {/* Icon + badge */}
            <div className="relative z-10">
              <motion.div
                animate={isActive
                  ? { scale: 1.12, color: '#10B981' }
                  : { scale: 1, color: '#6B6E7A' }
                }
                transition={{ type: 'spring', stiffness: 500, damping: 28 }}
              >
                <Icon size={19} strokeWidth={isActive ? 2.1 : 1.7} />
              </motion.div>

              {/* Unread badge for chats */}
              <AnimatePresence>
                {tab.id === 'chats' && unreadCount > 0 && (
                  <motion.span
                    key="badge"
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0, opacity: 0 }}
                    transition={{ type: 'spring', stiffness: 600, damping: 22 }}
                    className="absolute -top-1 -right-1.5 min-w-[14px] h-3.5 px-0.5 bg-emerald-400 text-black text-[8px] font-black rounded-full flex items-center justify-center"
                  >
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </motion.span>
                )}
              </AnimatePresence>
            </div>

            {/* Label */}
            <motion.span
              animate={isActive
                ? { opacity: 1, color: '#FFFFFF' }
                : { opacity: 0.45, color: '#9496A1' }
              }
              transition={{ duration: 0.18 }}
              className="text-[9.5px] tracking-tight font-medium whitespace-nowrap z-10"
            >
              {label}
            </motion.span>
          </button>
        );
      })}
    </nav>
  );
};
