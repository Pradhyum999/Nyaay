import React from 'react';
import { Card } from '../../design/ui/Card';
import { Button } from '../../design/ui/Button';
import { StatusBadge } from '../../design/ui/StatusBadge';
import { Clock, MapPin, Gavel, ArrowRight, MessageSquare, MoreVertical, Calendar } from 'lucide-react';
import { HearingItem, Language } from '../../types';

interface HearingCardProps {
  hearing: HearingItem;
  language?: Language;
  onLogOrder?: (hearing: HearingItem) => void;
  onOpenCase?: (caseNumber: string) => void;
  onMessageClient?: (caseNumber: string, clientName: string) => void;
}

export const HearingCard: React.FC<HearingCardProps> = ({
  hearing,
  language = 'en',
  onLogOrder,
  onOpenCase,
  onMessageClient,
}) => {
  const hasOrder = Boolean(hearing.previousOrderSummaryEn || hearing.previousOrderSummaryHi);

  return (
    <Card className="hover:border-white/[0.14] transition duration-150">
      <div className="flex flex-col gap-3">
        {/* Top line: Item number & Time + Court Room */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center justify-center w-7 h-7 rounded-xl bg-amber-400/15 border border-amber-400/30 text-amber-300 font-mono font-bold text-xs">
              #{hearing.itemNumber || 1}
            </span>
            <div className="flex items-center gap-1.5 text-xs text-neutral-300">
              <Clock size={13} className="text-neutral-400" />
              <span className="font-mono">{hearing.hearingTime || '10:30 AM'}</span>
            </div>
          </div>
          <span className="text-xs font-mono font-medium text-neutral-400 truncate">
            {hearing.courtRoom || 'Court Room 04'}
          </span>
        </div>

        {/* Case Info: Case Number & Parties */}
        <div>
          <div className="flex items-center justify-between gap-2">
            <h4
              onClick={() => onOpenCase?.(hearing.caseNumber)}
              className="text-sm font-bold text-white hover:text-amber-300 cursor-pointer font-mono transition"
            >
              {hearing.caseNumber}
            </h4>
            <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-white/[0.06] text-neutral-300 border border-white/[0.08]">
              {hearing.stage}
            </span>
          </div>
          <p className="text-xs text-neutral-300 mt-1 font-medium truncate">
            {hearing.clientName}
          </p>
          <div className="flex items-center gap-1 text-[11px] text-neutral-400 mt-0.5 truncate">
            <MapPin size={12} className="shrink-0" />
            <span>{hearing.courtName}</span>
            {hearing.judgeName && <span>· {hearing.judgeName}</span>}
          </div>
        </div>

        {/* Order / Status if exists */}
        {hasOrder && (
          <div className="p-2.5 rounded-2xl bg-white/[0.03] border border-white/[0.06] text-xs text-neutral-300">
            <div className="flex items-center gap-1.5 text-emerald-400 font-semibold mb-0.5 text-[11px]">
              <Gavel size={12} />
              <span>{language === 'hi' ? 'दर्ज आदेश सारांश' : 'Logged Order Summary'}</span>
            </div>
            <p className="line-clamp-2 text-neutral-300">
              {hearing.previousOrderSummaryEn || hearing.previousOrderSummaryHi}
            </p>
          </div>
        )}

        {/* Primary Action Button */}
        <div className="flex items-center justify-between gap-2 pt-1 border-t border-white/[0.06]">
          {onMessageClient && (
            <button
              type="button"
              onClick={() => onMessageClient(hearing.caseNumber, hearing.clientName)}
              className="flex items-center gap-1 text-xs text-neutral-400 hover:text-white px-2 py-1 rounded-xl transition"
              title="Message Client"
            >
              <MessageSquare size={13} />
              <span className="hidden sm:inline">Message</span>
            </button>
          )}

          <div className="flex items-center gap-2 ml-auto">
            {onOpenCase && (
              <Button
                variant="secondary"
                size="sm"
                onClick={() => onOpenCase(hearing.caseNumber)}
              >
                <span>{language === 'hi' ? 'केस देखें' : 'View Case'}</span>
                <ArrowRight size={13} />
              </Button>
            )}

            {onLogOrder && (
              <Button
                variant="primary"
                size="sm"
                icon={<Gavel size={13} />}
                onClick={() => onLogOrder(hearing)}
              >
                {language === 'hi' ? 'आदेश दर्ज करें' : 'Log Order'}
              </Button>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
};
