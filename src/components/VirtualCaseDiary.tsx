import React, { useState } from 'react';
import { AlertCircle, Calendar, ChevronRight, CheckCircle2, Gavel, Plus } from 'lucide-react';
import { HearingItem, LimitationAlert, Language } from '../types';
import { translations } from '../i18n/translations';

interface VirtualCaseDiaryProps {
  hearings: HearingItem[];
  limitationAlerts: LimitationAlert[];
  language: Language;
  onUpdateHearingOrder: (hearingId: string, orderNotes: string, nextDate: string) => void;
  onOpenCaseDetails: (caseNumber: string) => void;
}

export const VirtualCaseDiary: React.FC<VirtualCaseDiaryProps> = ({
  hearings,
  limitationAlerts,
  language,
  onUpdateHearingOrder,
  onOpenCaseDetails
}) => {
  const t = translations[language];
  const [selectedCourtFilter, setSelectedCourtFilter] = useState<string>('All');
  const [activeModalHearing, setActiveModalHearing] = useState<HearingItem | null>(null);
  const [orderSummaryText, setOrderSummaryText] = useState<string>('');
  const [nextDateInput, setNextDateInput] = useState<string>('2026-10-14');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const filteredHearings = hearings.filter(h => {
    if (selectedCourtFilter === 'All') return true;
    return h.courtName.toLowerCase().includes(selectedCourtFilter.toLowerCase());
  });

  const handleOpenOrderModal = (hearing: HearingItem) => {
    setActiveModalHearing(hearing);
    setOrderSummaryText(hearing.previousOrderSummaryEn || '');
  };

  const handleSaveOrder = () => {
    if (activeModalHearing) {
      onUpdateHearingOrder(activeModalHearing.id, orderSummaryText, nextDateInput);
      setActiveModalHearing(null);
      setToastMessage(t.orderLoggedSuccessfully);
      setTimeout(() => setToastMessage(null), 3000);
    }
  };

  return (
    <div className="flex flex-col gap-5 p-5 pb-24">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="sticky top-2 z-30 bg-neutral-900/90 text-white border border-emerald-500/30 px-4 py-2.5 rounded-2xl shadow-2xl backdrop-blur-xl flex items-center gap-2 text-xs font-medium animate-in fade-in">
          <CheckCircle2 size={15} className="text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Hero Header: Clean Apple Typography */}
      <div className="flex items-end justify-between pt-1">
        <div>
          <span className="text-[11px] font-semibold tracking-wider uppercase text-neutral-500">
            {language === 'en' ? 'Court Schedule' : 'दैनिक वाद तालिका'}
          </span>
          <h1 className="text-2xl font-bold tracking-tight text-white mt-0.5">
            {t.todaysCauseList}
          </h1>
        </div>
        <span className="text-xs font-medium text-neutral-400 font-mono bg-white/[0.04] px-3 py-1 rounded-full border border-white/[0.06]">
          19 Sep 2026
        </span>
      </div>

      {/* Statutory Limitation Watch (Netflix / Apple Minimalist Card) */}
      <section className="glass-card rounded-3xl p-4 border border-rose-500/20 bg-gradient-to-b from-rose-950/20 to-black">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-rose-500/20 flex items-center justify-center text-rose-400">
              <AlertCircle size={14} />
            </div>
            <h3 className="text-xs font-semibold tracking-tight text-neutral-200">
              {t.limitationWatch}
            </h3>
          </div>
          <span className="text-[10px] font-medium text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded-full border border-rose-500/20">
            {limitationAlerts.length} Active
          </span>
        </div>

        <div className="space-y-2">
          {limitationAlerts.map(alert => (
            <div
              key={alert.id}
              onClick={() => onOpenCaseDetails(alert.caseNumber)}
              className="bg-black/50 hover:bg-white/[0.04] rounded-2xl p-3 border border-white/[0.06] flex items-center justify-between cursor-pointer transition ios-press"
            >
              <div className="pr-3 flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-white tracking-tight">
                    {alert.caseNumber}
                  </span>
                  <span className="text-[9px] text-neutral-500 font-mono">
                    {alert.statutoryAct.split('-')[0]}
                  </span>
                </div>
                <p className="text-[11px] text-neutral-300 mt-0.5 line-clamp-1 font-normal">
                  {language === 'en' ? alert.titleEn : alert.titleHi}
                </p>
              </div>

              <div className="text-right shrink-0">
                <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                  alert.severity === 'critical' ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30' : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                }`}>
                  {alert.daysRemaining} {t.daysLeft}
                </span>
                <span className="text-[9px] text-neutral-500 block mt-1 font-mono">{alert.deadlineDate}</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Filter Pills: Apple Segmented Pill Design */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
        {['All', 'High Court', 'Tis Hazari', 'Patiala House'].map(filter => (
          <button
            key={filter}
            onClick={() => setSelectedCourtFilter(filter)}
            className={`text-xs px-3.5 py-1.5 rounded-full whitespace-nowrap transition-all ${
              selectedCourtFilter === filter
                ? 'bg-white text-black font-semibold shadow-sm'
                : 'bg-white/[0.04] text-neutral-400 hover:text-white border border-white/[0.06]'
            }`}
          >
            {filter === 'All' ? t.allCourts : filter}
          </button>
        ))}
      </div>

      {/* Cause List Items (Minimal Obsidian Style) */}
      <div className="space-y-3">
        {filteredHearings.map(item => (
          <div
            key={item.id}
            className="glass-card rounded-3xl p-4 flex flex-col gap-3 group"
          >
            {/* Top row */}
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[10px] uppercase font-mono tracking-wider text-neutral-500">
                  Item #{item.itemNumber} • {item.courtName}
                </span>
                <h4 
                  onClick={() => onOpenCaseDetails(item.caseNumber)}
                  className="text-base font-bold text-white tracking-tight cursor-pointer hover:text-amber-300 transition mt-0.5 flex items-center gap-1"
                >
                  <span>{item.caseNumber}</span>
                  <ChevronRight size={14} className="text-neutral-500 group-hover:text-white transition" />
                </h4>
                <p className="text-xs text-neutral-400 mt-0.5 font-normal">
                  {item.clientName}
                </p>
              </div>

              <div className="text-right">
                <span className="text-[10px] font-medium px-2.5 py-0.5 rounded-full bg-white/[0.06] text-neutral-300 border border-white/[0.08]">
                  {item.stage}
                </span>
                <span className="text-xs font-mono text-neutral-400 block mt-1.5">
                  {item.hearingTime}
                </span>
              </div>
            </div>

            {/* Purpose & Court Room */}
            <div className="bg-white/[0.02] border border-white/[0.04] rounded-2xl p-3 text-xs text-neutral-300 flex items-start gap-2.5">
              <Gavel size={14} className="text-neutral-500 shrink-0 mt-0.5" />
              <div>
                <p className="font-medium leading-relaxed">
                  {language === 'en' ? item.purposeEn : item.purposeHi}
                </p>
                <span className="text-[10px] text-neutral-500 block mt-1">
                  {item.courtRoom} • {item.judgeName}
                </span>
              </div>
            </div>

            {/* Actions: Apple Style Minimal Buttons */}
            <div className="flex items-center gap-2 pt-0.5">
              <button
                onClick={() => handleOpenOrderModal(item)}
                className="flex-1 py-2 rounded-2xl bg-white text-black font-semibold text-xs transition-all hover:bg-neutral-200 ios-press"
              >
                {t.updateOutcome}
              </button>
              <button
                onClick={() => onOpenCaseDetails(item.caseNumber)}
                className="py-2 px-4 rounded-2xl bg-white/[0.06] hover:bg-white/[0.1] text-neutral-300 font-medium text-xs border border-white/[0.08] transition ios-press"
              >
                {t.viewDetails}
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Apple-grade Action Sheet Modal */}
      {activeModalHearing && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-end sm:items-center justify-center p-3 animate-in fade-in">
          <div className="w-full max-w-sm glass-panel rounded-3xl p-5 shadow-2xl flex flex-col gap-4 border border-white/[0.12] bg-[#121216]">
            <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
              <div>
                <h3 className="text-sm font-semibold text-white tracking-tight">
                  {t.hearingOutcomeTitle}
                </h3>
                <span className="text-[10px] font-mono text-neutral-400">
                  {activeModalHearing.caseNumber}
                </span>
              </div>
              <button
                onClick={() => setActiveModalHearing(null)}
                className="w-7 h-7 rounded-full bg-white/[0.06] flex items-center justify-center text-neutral-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-[11px] font-medium text-neutral-400 block mb-1">
                  Order Summary / आदेश विवरण
                </label>
                <textarea
                  value={orderSummaryText}
                  onChange={(e) => setOrderSummaryText(e.target.value)}
                  placeholder={t.orderSummaryPlaceholder}
                  rows={3}
                  className="w-full bg-black/60 border border-white/[0.08] rounded-2xl p-3 text-xs text-white placeholder-neutral-600 focus:outline-none focus:border-white/30 resize-none font-sans"
                />
              </div>

              <div>
                <label className="text-[11px] font-medium text-neutral-400 block mb-1">
                  {t.selectNextDate}
                </label>
                <input
                  type="date"
                  value={nextDateInput}
                  onChange={(e) => setNextDateInput(e.target.value)}
                  className="w-full bg-black/60 border border-white/[0.08] rounded-2xl p-2.5 text-xs text-white focus:outline-none focus:border-white/30 font-mono"
                />
              </div>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                onClick={() => setActiveModalHearing(null)}
                className="flex-1 py-2.5 rounded-2xl bg-white/[0.06] text-neutral-300 font-medium text-xs hover:bg-white/[0.1]"
              >
                {t.cancel}
              </button>
              <button
                onClick={handleSaveOrder}
                className="flex-1 py-2.5 rounded-2xl bg-white text-black font-semibold text-xs hover:bg-neutral-200 ios-press"
              >
                {t.save}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
