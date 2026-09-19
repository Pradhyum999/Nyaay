import React from 'react';
import { ShieldCheck, Bell, Scale, UserCheck } from 'lucide-react';
import { translations } from '../i18n/translations';
import { Language, UserRole } from '../types';

interface TopAppBarProps {
  language: Language;
  userRole: UserRole;
  onOpenProfile: () => void;
  urgentAlertCount: number;
}

export const TopAppBar: React.FC<TopAppBarProps> = ({
  language,
  userRole,
  onOpenProfile,
  urgentAlertCount
}) => {
  const t = translations[language];

  return (
    <header className="sticky top-0 z-20 bg-black/80 backdrop-blur-xl border-b border-white/[0.06] px-5 py-3 flex items-center justify-between">
      {/* Profile & Identity */}
      <div 
        onClick={onOpenProfile} 
        className="flex items-center gap-3 cursor-pointer group ios-press"
      >
        <div className="w-9 h-9 rounded-full bg-gradient-to-b from-neutral-800 to-neutral-900 border border-white/[0.12] flex items-center justify-center text-amber-300 font-semibold shadow-inner">
          {userRole === 'lawyer' ? <Scale size={17} strokeWidth={1.8} /> : <UserCheck size={17} strokeWidth={1.8} />}
        </div>
        <div className="flex flex-col">
          <div className="flex items-center gap-1.5">
            <span className="font-semibold text-xs text-white tracking-tight group-hover:text-amber-300 transition">
              {userRole === 'lawyer' ? t.advocateTitle : 'Vikramaditya S.'}
            </span>
            <ShieldCheck size={13} className="text-emerald-400" />
          </div>
          <span className="text-[10px] text-neutral-400 font-mono tracking-tight">
            {userRole === 'lawyer' ? 'D/1482/2015 • Delhi HC' : 'Citizen Case ID: CRL-882'}
          </span>
        </div>
      </div>

      {/* Right Controls: Notification Bell & Role Indicator */}
      <div className="flex items-center gap-2">
        <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-white/[0.05] border border-white/[0.08] text-neutral-300 font-medium">
          {userRole === 'lawyer' ? (language === 'en' ? 'Lawyer Mode' : 'वकील मोड') : (language === 'en' ? 'Citizen Mode' : 'मुवक्किल मोड')}
        </span>

        <button 
          onClick={onOpenProfile}
          className="relative w-8 h-8 rounded-full bg-white/[0.05] hover:bg-white/[0.1] border border-white/[0.08] flex items-center justify-center text-neutral-300 transition ios-press"
        >
          <Bell size={15} strokeWidth={1.8} />
          {urgentAlertCount > 0 && (
            <span className="absolute top-1 right-1 w-2 h-2 bg-rose-500 rounded-full shadow-[0_0_6px_rgba(244,63,94,0.8)]"></span>
          )}
        </button>
      </div>
    </header>
  );
};
