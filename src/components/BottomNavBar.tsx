import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Home, Folder, Sparkles, MessageSquare, CreditCard, Building2, Bot } from 'lucide-react';
import { translations } from '../i18n/translations';
import { Language } from '../types';

export type NavTab = 'home' | 'cases' | 'aibriefs' | 'chats' | 'billing' | 'calendar' | 'diary' | 'firm' | 'community';

interface BottomNavBarProps {
  activeTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  language: Language;
  onToggleLanguage?: () => void;
  unreadCount?: number;
  showFirmTab?: boolean;
}

const mainTabs = [
  { id: 'home' as NavTab,     labelKey: 'navHome',    icon: Home },
  { id: 'cases' as NavTab,    labelKey: 'navCases',   icon: Folder },
  { id: 'aibriefs' as NavTab, labelKey: 'navAI',      icon: Sparkles, isCenter: true },
  { id: 'chats' as NavTab,    labelKey: 'navChats',   icon: MessageSquare },
  { id: 'billing' as NavTab,  labelKey: 'navBilling', icon: CreditCard },
];

export const BottomNavBar: React.FC<BottomNavBarProps> = ({
  activeTab,
  onSelectTab,
  language,
  unreadCount = 0,
  showFirmTab = false,
}) => {
  const t = translations[language] as Record<string, string>;

  const renderedTabs = React.useMemo(() => {
    if (showFirmTab || activeTab === 'firm') {
      return [
        ...mainTabs,
        { id: 'firm' as NavTab, labelKey: 'navFirm', icon: Building2 },
      ];
    }
    return mainTabs;
  }, [showFirmTab, activeTab]);

  return (
    <nav
      className="sticky bottom-0 z-30 bg-black/95 backdrop-blur-2xl border-t border-white/[0.08] px-2 py-1.5 flex items-center justify-around relative shadow-[0_-8px_30px_rgba(0,0,0,0.8)]"
      style={{ paddingBottom: 'calc(0.4rem + env(safe-area-inset-bottom))' }}
    >
      {renderedTabs.map((tab) => {
        const isActive = activeTab === tab.id;
        const Icon = tab.icon;
        const label = t[tab.labelKey] ?? tab.labelKey;

        // Center Elevated AI Chat Button
        if (tab.isCenter) {
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => onSelectTab(tab.id)}
              className="relative -top-3.5 flex flex-col items-center justify-center ios-press group cursor-pointer focus:outline-none px-2"
              title="NYAAY Legal AI Assistant"
            >
              <div
                className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-300 shadow-xl border ${
                  isActive
                    ? 'bg-gradient-to-tr from-amber-500 via-amber-400 to-amber-300 text-black border-amber-200 shadow-[0_4px_24px_rgba(245,197,99,0.5)] scale-105'
                    : 'bg-neutral-900 hover:bg-neutral-800 text-amber-300 border-amber-400/30 shadow-[0_2px_14px_rgba(245,197,99,0.2)] hover:border-amber-400/60'
                }`}
              >
                <Icon size={21} strokeWidth={2.3} className={isActive ? 'text-black' : 'text-amber-300 animate-pulse'} />
              </div>
              <span
                className={`text-[9px] tracking-tight font-bold mt-1 ${
                  isActive ? 'text-amber-300' : 'text-neutral-400 group-hover:text-amber-300'
                }`}
              >
                {label}
              </span>
            </button>
          );
        }

        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => onSelectTab(tab.id)}
            className="relative flex flex-col items-center justify-center flex-1 py-1 gap-0.5 rounded-2xl min-w-0 ios-press cursor-pointer"
          >
            {/* Sliding background pill */}
            {isActive && (
              <motion.span
                layoutId="advocate-nav-pill"
                className="absolute inset-0 rounded-2xl bg-white/[0.08]"
                transition={{ type: 'spring', stiffness: 400, damping: 32 }}
              />
            )}

            {/* Icon + badge */}
            <div className="relative z-10">
              <motion.div
                animate={isActive
                  ? { scale: 1.1, color: '#F5C563' }
                  : { scale: 1, color: '#737373' }
                }
                transition={{ type: 'spring', stiffness: 500, damping: 28 }}
              >
                <Icon size={19} strokeWidth={isActive ? 2.2 : 1.7} />
              </motion.div>

              {/* Unread badge on chats */}
              <AnimatePresence>
                {tab.id === 'chats' && unreadCount > 0 && (
                  <motion.span
                    key="badge"
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0, opacity: 0 }}
                    transition={{ type: 'spring', stiffness: 600, damping: 22 }}
                    className="absolute -top-1 -right-1.5 min-w-[14px] h-3.5 px-0.5 bg-amber-400 text-black text-[8px] font-black rounded-full flex items-center justify-center shadow-md"
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
                : { opacity: 0.5, color: '#A3A3A3' }
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
