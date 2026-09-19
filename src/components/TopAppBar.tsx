import React from 'react';
import { ShieldCheck, Bell, Scale, UserCheck, Sparkles, Clock, ShieldAlert } from 'lucide-react';
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
  onToggleRole?: () => void;
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
  onToggleRole,
  urgentAlertCount
}) => {
  const displayName = userName || (userRole === 'lawyer' ? (language === 'en' ? 'Advocate Profile' : 'अधिवक्ता प्रोफ़ाइल') : (language === 'en' ? 'Citizen Account' : 'नागरिक खाता'));
  const displayId = userIdentifier || (userRole === 'lawyer' ? 'Bar Council Member' : 'NAYANEETI Citizen');

  return (
    <header className="sticky top-0 z-30 bg-black/85 backdrop-blur-2xl border-b border-white/[0.08] px-4 sm:px-5 py-3.5 flex items-center justify-between transition-all">
      {/* Profile & Identity */}
      <div 
        onClick={onOpenProfile} 
        className="flex items-center gap-3 cursor-pointer group ios-press"
      >
        <div className="relative">
          {userPhoto ? (
            <img
              src={userPhoto}
              alt={displayName}
              className="w-10 h-10 rounded-2xl object-cover border border-white/[0.14] shadow-[0_4px_16px_rgba(0,0,0,0.6)] group-hover:border-amber-400/40 transition"
            />
          ) : (
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-b from-neutral-800 to-neutral-950 border border-white/[0.14] flex items-center justify-center text-amber-300 font-semibold shadow-[0_4px_16px_rgba(0,0,0,0.6)] group-hover:border-amber-400/40 transition">
              {userRole === 'lawyer' ? <Scale size={18} strokeWidth={1.9} /> : <UserCheck size={18} strokeWidth={1.9} />}
            </div>
          )}
          
          {/* Verification indicator */}
          {isVerified ? (
            <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-emerald-500 border-2 border-black flex items-center justify-center text-black" title="Verified">
              <ShieldCheck size={8} strokeWidth={3} />
            </span>
          ) : (
            <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-amber-400 border-2 border-black flex items-center justify-center text-black" title="Verification Pending">
              <Clock size={8} strokeWidth={3} />
            </span>
          )}
        </div>

        <div className="flex flex-col">
          <div className="flex items-center gap-1.5">
            <span className="font-semibold text-xs text-white tracking-tight group-hover:text-amber-300 transition">
              {displayName}
            </span>
            {isVerified ? (
              <ShieldCheck size={13} className="text-emerald-400" />
            ) : (
              <span className="text-[9px] px-1 rounded bg-amber-500/20 text-amber-300 font-mono">Pending</span>
            )}
          </div>
          <span className="text-[10px] text-neutral-400 font-mono tracking-tight line-clamp-1">
            {displayId}
          </span>
        </div>
      </div>

      {/* Right Controls: Role Badge, Admin Console & Notification Bell */}
      <div className="flex items-center gap-2">
        {/* Admin Dashboard Trigger */}
        {isAdmin && onOpenAdminDashboard && (
          <button
            onClick={onOpenAdminDashboard}
            className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-400/15 hover:bg-amber-400/25 border border-amber-400/30 text-[10px] font-bold text-amber-300 shadow-sm transition ios-press"
            title="Admin Verification Dashboard (pradhumb1998@gmail.com)"
          >
            <ShieldAlert size={11} className="text-amber-300" />
            <span>Admin</span>
          </button>
        )}

        {/* Role Badge (Interactive Switcher) */}
        <button
          onClick={onToggleRole}
          className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-white/[0.04] hover:bg-white/[0.1] border border-white/[0.08] text-[10px] font-medium text-neutral-300 shadow-sm transition ios-press"
          title={language === 'en' ? 'Click to switch role (Advocate / Citizen)' : 'रोल बदलने के लिए क्लिक करें'}
        >
          <Sparkles size={11} className="text-amber-400" />
          <span>{userRole === 'lawyer' ? (language === 'en' ? 'Advocate ⇄' : 'वकील ⇄') : (language === 'en' ? 'Citizen ⇄' : 'नागरिक ⇄')}</span>
        </button>

        <button 
          onClick={onOpenProfile}
          className="relative w-8 h-8 rounded-full bg-white/[0.05] hover:bg-white/[0.1] border border-white/[0.08] flex items-center justify-center text-neutral-300 transition ios-press"
          aria-label="Alerts"
        >
          <Bell size={15} strokeWidth={1.8} />
          {urgentAlertCount > 0 && (
            <span className="absolute top-1 right-1 w-2 h-2 bg-rose-500 rounded-full shadow-[0_0_8px_rgba(244,63,94,0.9)] animate-pulse" />
          )}
        </button>
      </div>
    </header>
  );
};
