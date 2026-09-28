import React from 'react';
import { TabDef } from '../../config/nav';
import { Language } from '../../types';

interface UnifiedTabBarProps {
  tabs: TabDef[];
  activeTab: string;
  onSelectTab: (tabId: string) => void;
  language?: Language;
  unreadCount?: number;
}

export const UnifiedTabBar: React.FC<UnifiedTabBarProps> = ({
  tabs,
  activeTab,
  onSelectTab,
  language = 'en',
  unreadCount = 0,
}) => {
  return (
    <nav
      aria-label="Primary Navigation"
      className="fixed bottom-0 inset-x-0 z-40 bg-neutral-950/85 backdrop-blur-2xl border-t border-white/[0.08] px-2 py-1.5 sm:py-2 select-none"
    >
      <div className="max-w-md mx-auto flex items-center justify-around gap-1">
        {tabs.map(tab => {
          const isActive = tab.id === activeTab;
          const Icon = tab.icon;
          const showBadge = tab.badge === 'unread' && unreadCount > 0;

          const label =
            language === 'hi'
              ? tab.labelHi
              : language === 'mr'
              ? tab.labelMr
              : tab.labelEn;

          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => onSelectTab(tab.id)}
              className={`flex-1 flex flex-col items-center justify-center min-h-[48px] py-1 px-1 rounded-2xl transition duration-150 ios-press relative ${
                isActive
                  ? 'text-amber-400 font-bold'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              <div className="relative flex items-center justify-center">
                <Icon size={20} className={isActive ? 'text-amber-400 stroke-[2.2]' : 'text-neutral-400 stroke-[1.8]'} />
                {showBadge && (
                  <span className="absolute -top-1 -right-1.5 w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                )}
              </div>
              <span className="text-[11px] sm:text-xs mt-1 tracking-tight truncate max-w-[68px]">
                {label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
