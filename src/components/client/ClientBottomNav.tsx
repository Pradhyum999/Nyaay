import React from 'react';
import { Bot, CalendarCheck, FolderUp, CreditCard, Users } from 'lucide-react';
import { translations } from '../../i18n/translations';
import { Language } from '../../types';

export type ClientNavTab = 'consult' | 'mycase' | 'docs' | 'payments' | 'lawyers';

interface ClientBottomNavProps {
  activeTab: ClientNavTab;
  onSelectTab: (tab: ClientNavTab) => void;
  language: Language;
}

export const ClientBottomNav: React.FC<ClientBottomNavProps> = ({ activeTab, onSelectTab, language }) => {
  const t = translations[language];

  const tabs: { id: ClientNavTab; label: string; icon: React.ReactNode }[] = [
    { id: 'consult', label: t.clientNavConsult, icon: <Bot size={19} strokeWidth={1.8} /> },
    { id: 'mycase', label: t.clientNavMyCase, icon: <CalendarCheck size={19} strokeWidth={1.8} /> },
    { id: 'docs', label: t.clientNavDocs, icon: <FolderUp size={19} strokeWidth={1.8} /> },
    { id: 'payments', label: t.clientNavPay, icon: <CreditCard size={19} strokeWidth={1.8} /> },
    { id: 'lawyers', label: t.clientNavLawyers, icon: <Users size={19} strokeWidth={1.8} /> },
  ];

  return (
    <nav className="sticky bottom-0 z-30 bg-black/85 backdrop-blur-2xl border-t border-white/[0.08] px-3 py-2 flex items-center justify-around">
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
            <div className={`p-1 rounded-xl transition-all ${isActive ? 'text-emerald-400 scale-105' : ''}`}>
              {tab.icon}
            </div>
            <span className={`text-[10px] tracking-tight mt-0.5 whitespace-nowrap transition-all ${isActive ? 'font-semibold text-white' : 'font-normal'}`}>
              {tab.label}
            </span>
          </button>
        );
      })}
    </nav>
  );
};
