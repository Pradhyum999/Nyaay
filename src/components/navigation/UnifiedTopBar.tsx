import React, { useState } from 'react';
import { Bell, Search, Scale, X, Check, ExternalLink, ShieldAlert } from 'lucide-react';
import { Sheet } from '../../design/ui/Sheet';
import { AppNotification, Language, UserRole } from '../../types';

interface UnifiedTopBarProps {
  userRole: UserRole;
  language: Language;
  userTag?: string;
  notifications?: AppNotification[];
  unreadAlertCount?: number;
  onOpenSearch?: () => void;
  onOpenEmergency?: () => void;
  onDismissNotification?: (id: string) => void;
  onDismissAllNotifications?: () => void;
  onNotificationClick?: (notification: AppNotification) => void;
}

export const UnifiedTopBar: React.FC<UnifiedTopBarProps> = ({
  userRole,
  language,
  userTag,
  notifications = [],
  unreadAlertCount = 0,
  onOpenSearch,
  onOpenEmergency,
  onDismissNotification,
  onDismissAllNotifications,
  onNotificationClick,
}) => {
  const [showNotifications, setShowNotifications] = useState(false);

  return (
    <>
      <header className="sticky top-0 z-30 w-full bg-black/80 backdrop-blur-2xl border-b border-white/[0.08] px-4 py-2.5">
        <div className="max-w-4xl mx-auto flex items-center justify-between gap-3">
          {/* Brand */}
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-amber-400/20 border border-amber-400/35 flex items-center justify-center text-amber-300">
              <Scale size={18} />
            </div>
            <div>
              <span className="text-sm font-bold text-white tracking-tight font-display">
                NYAAYNEETI
              </span>
              <span className="text-[10px] font-mono text-neutral-400 ml-1.5 uppercase tracking-wider">
                {userTag || (userRole === 'lawyer' ? 'Counsel' : 'Legal')}
              </span>
            </div>
          </div>

          {/* Action Icons: Emergency SOS + Search (for lawyer) + Bell */}
          <div className="flex items-center gap-1.5">
            {onOpenEmergency && (
              <button
                type="button"
                onClick={onOpenEmergency}
                aria-label="Emergency Help"
                className="h-9 px-2.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/30 flex items-center gap-1.5 transition ios-press text-xs font-semibold"
                title="Emergency & Legal Aid Helplines (112, 100, 15100)"
              >
                <ShieldAlert size={15} />
                <span className="hidden sm:inline">SOS</span>
              </button>
            )}

            {onOpenSearch && (
              <button
                type="button"
                onClick={onOpenSearch}
                aria-label="Universal Search"
                className="w-10 h-10 min-w-[40px] min-h-[40px] rounded-2xl bg-white/[0.05] hover:bg-white/[0.1] text-neutral-300 hover:text-white flex items-center justify-center transition ios-press"
              >
                <Search size={18} />
              </button>
            )}

            <button
              type="button"
              onClick={() => setShowNotifications(true)}
              aria-label="Notifications"
              className="w-10 h-10 min-w-[40px] min-h-[40px] rounded-2xl bg-white/[0.05] hover:bg-white/[0.1] text-neutral-300 hover:text-white flex items-center justify-center transition ios-press relative"
            >
              <Bell size={18} />
              {unreadAlertCount > 0 && (
                <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-red-500 animate-pulse" />
              )}
            </button>
          </div>
        </div>
      </header>

      {/* ── Notification Center Sheet ── */}
      <Sheet
        open={showNotifications}
        onOpenChange={setShowNotifications}
        title={language === 'hi' ? 'सूचनाएं' : 'Notification Center'}
        description={
          notifications.length > 0
            ? `${notifications.length} updates and alerts`
            : 'All caught up'
        }
        secondary={
          notifications.length > 0 && onDismissAllNotifications
            ? {
                label: 'Dismiss All',
                onClick: onDismissAllNotifications,
              }
            : undefined
        }
      >
        <div className="space-y-2">
          {notifications.length === 0 ? (
            <div className="text-center py-8 text-neutral-400 text-xs">
              <Bell size={24} className="mx-auto mb-2 text-neutral-500 opacity-60" />
              <p>No new notifications at this time.</p>
            </div>
          ) : (
            notifications.map(n => (
              <div
                key={n.id}
                onClick={() => {
                  if (onNotificationClick) onNotificationClick(n);
                  setShowNotifications(false);
                }}
                className="p-3.5 rounded-2xl bg-white/[0.04] border border-white/[0.08] hover:border-amber-400/30 flex items-start justify-between gap-3 cursor-pointer transition ios-press"
              >
                <div className="min-w-0">
                  <h4 className="text-xs font-bold text-white">{n.title}</h4>
                  <p className="text-[11px] text-neutral-300 mt-0.5 leading-relaxed">{n.message}</p>
                  <span className="text-[10px] font-mono text-neutral-500 mt-1 block">
                    {n.createdAt ? new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Just now'}
                  </span>
                </div>
                {onDismissNotification && (
                  <button
                    type="button"
                    onClick={e => {
                      e.stopPropagation();
                      onDismissNotification(n.id);
                    }}
                    className="p-1 rounded-full text-neutral-400 hover:text-white shrink-0"
                  >
                    <X size={14} />
                  </button>
                )}
              </div>
            ))
          )}
        </div>
      </Sheet>
    </>
  );
};
