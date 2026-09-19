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
    { id: 'consult', label: t.clientNavConsult, icon: <Bot size={20} /> },
    { id: 'mycase', label: t.clientNavMyCase, icon: <CalendarCheck size={20} /> },
    { id: 'docs', label: t.clientNavDocs, icon: <FolderUp size={20} /> },
    { id: 'payments', label: t.clientNavPay, icon: <CreditCard size={20} /> },
    { id: 'lawyers', label: t.clientNavLawyers, icon: <Users size={20} /> },
  ];

  return (
    <nav className="sticky bottom-0 z-20 bg-slate-900/98 backdrop-blur border-t border-slate-800 px-2 py-1.5 flex items-center justify-around shadow-2xl">
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            onClick={() => onSelectTab(tab.id)}
            className={`flex flex-col items-center justify-center flex-1 py-1 transition-all touch-ripple ${
              isActive ? 'text-emerald-400 font-semibold' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <div
              className={`px-4 py-1 rounded-full flex items-center justify-center transition-all ${
                isActive ? 'bg-emerald-500/15 text-emerald-300 ring-1 ring-emerald-500/30 shadow-sm' : ''
              }`}
            >
              {tab.icon}
            </div>
            <span className="text-[10px] tracking-tight mt-0.5 whitespace-nowrap">
              {tab.label}
            </span>
          </button>
        );
      })}
    </nav>
  );
};
