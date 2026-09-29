import React from 'react';
import { Card } from '../../design/ui/Card';
import { Button } from '../../design/ui/Button';
import { StatusBadge } from '../../design/ui/StatusBadge';
import { Clock, MapPin, Gavel, ArrowRight, Calendar } from 'lucide-react';
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
}) => {
  const hasOrder = Boolean(hearing.previousOrderSummaryEn || hearing.previousOrderSummaryHi);

  const t = (en: string, hi: string, mr: string) => {
    if (language === 'mr') return mr;
    if (language === 'hi') return hi;
    return en;
  };

  return (
    <Card className="hover:border-white/[0.14] transition duration-150">
      <div className="flex flex-col gap-3">
        {/* Top line: Item number & Time + Court Room */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            {hearing.itemNumber && (
              <span className="inline-flex items-center justify-center w-7 h-7 rounded-xl bg-amber-400/15 border border-amber-400/30 text-amber-300 font-mono font-bold text-xs">
                #{hearing.itemNumber}
              </span>
            )}
            {hearing.hearingTime && (
              <div className="flex items-center gap-1.5 text-xs text-neutral-300">
                <Clock size={13} className="text-neutral-400" />
                <span className="font-mono">{hearing.hearingTime}</span>
              </div>
            )}
          </div>
          {hearing.courtRoom && (
            <span className="text-xs font-mono font-medium text-neutral-400 truncate">
              {hearing.courtRoom}
            </span>
          )}
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
            {hearing.stage && (
              <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-white/[0.06] text-neutral-300 border border-white/[0.08]">
                {hearing.stage}
              </span>
            )}
          </div>
          <p className="text-xs text-neutral-300 mt-1 font-medium truncate">
            {hearing.clientName}
          </p>
          {hearing.courtName && (
            <div className="flex items-center gap-1 text-xs text-neutral-400 mt-0.5 truncate">
              <MapPin size={11} className="shrink-0 text-neutral-500" />
              <span className="truncate">{hearing.courtName}</span>
            </div>
          )}
        </div>

        {/* Action Button: exactly one primary action per card (O1) */}
        <div className="flex items-center justify-end gap-2 pt-2 border-t border-white/[0.06]">
          {!hasOrder && onLogOrder ? (
            <Button
              variant="primary"
              size="sm"
              icon={<Gavel size={13} />}
              onClick={() => onLogOrder(hearing)}
            >
              {t('Log Order', 'आदेश दर्ज करें', 'आदेश नोंदवा')}
            </Button>
          ) : onOpenCase ? (
            <Button
              variant="secondary"
              size="sm"
              onClick={() => onOpenCase(hearing.caseNumber)}
            >
              <span>{t('View Case', 'केस देखें', 'केस पहा')}</span>
              <ArrowRight size={13} />
            </Button>
          ) : null}
        </div>
      </div>
    </Card>
  );
};
