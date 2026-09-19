import React from 'react';
import { Calendar, Folder, Sparkles, CreditCard, Landmark } from 'lucide-react';
import { translations } from '../i18n/translations';
import { Language } from '../types';

export type NavTab = 'diary' | 'cases' | 'aibriefs' | 'billing' | 'community';

interface BottomNavBarProps {
  activeTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  language: Language;
}

export const BottomNavBar: React.FC<BottomNavBarProps> = ({ activeTab, onSelectTab, language }) => {
  const t = translations[language];

  const tabs: { id: NavTab; label: string; icon: React.ReactNode }[] = [
    { id: 'diary', label: t.navDiary, icon: <Calendar size={18} strokeWidth={1.8} /> },
    { id: 'cases', label: t.navCases, icon: <Folder size={18} strokeWidth={1.8} /> },
    { id: 'aibriefs', label: t.navAIBriefs, icon: <Sparkles size={18} strokeWidth={1.8} /> },
    { id: 'billing', label: t.navBilling, icon: <CreditCard size={18} strokeWidth={1.8} /> },
    { id: 'community', label: t.navCommunity, icon: <Landmark size={18} strokeWidth={1.8} /> },
  ];

  return (
    <nav className="sticky bottom-0 z-20 bg-black/85 backdrop-blur-2xl border-t border-white/[0.08] px-3 py-2 flex items-center justify-around">
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            onClick={() => onSelectTab(tab.id)}
            className={`flex flex-col items-center justify-center flex-1 py-1 transition-all ios-press ${
              isActive ? 'text-white' : 'text-neutral-500 hover:text-neutral-300'
            }`}
          >
            <div className={`p-1 rounded-xl transition-all ${isActive ? 'text-amber-300 scale-105' : ''}`}>
              {tab.icon}
            </div>
            <span className={`text-[10px] tracking-tight mt-0.5 transition-all ${isActive ? 'font-semibold text-white' : 'font-normal'}`}>
              {tab.label}
            </span>
          </button>
        );
      })}
    </nav>
  );
};
