import React from 'react';
import { Calendar, Building, Clock, ShieldCheck, Gavel, FileCheck2, ArrowUpRight } from 'lucide-react';
import { CaseFile, HearingItem, Language } from '../../types';
import { translations } from '../../i18n/translations';

interface ClientCaseTrackerProps {
  activeCase: CaseFile;
  latestHearing: HearingItem;
  language: Language;
  onNavigateToDocs: () => void;
  onNavigateToPay: () => void;
}

export const ClientCaseTracker: React.FC<ClientCaseTrackerProps> = ({
  activeCase,
  latestHearing,
  language,
  onNavigateToDocs,
  onNavigateToPay
}) => {
  const t = translations[language];

  return (
    <div className="flex flex-col gap-5 p-5 pb-24">
      {/* Header */}
      <div>
        <span className="text-[11px] font-semibold tracking-wider uppercase text-neutral-500">
          Citizen Legal Dashboard
        </span>
        <h1 className="text-2xl font-bold tracking-tight text-white mt-0.5">
          {t.activeCaseTitle}
        </h1>
      </div>

      {/* Hero Matter Card (Apple Watch / Fitness Ring Style Aesthetic) */}
      <div className="rounded-3xl p-5 border border-white/[0.1] bg-gradient-to-br from-neutral-900 to-black shadow-2xl flex flex-col gap-4">
        <div className="flex items-start justify-between">
          <div>
            <span className="text-[10px] uppercase font-mono tracking-wider text-amber-300 bg-amber-400/10 px-2.5 py-0.5 rounded-full border border-amber-400/20">
              {activeCase.caseType}
            </span>
            <h2 className="text-lg font-bold text-white tracking-tight mt-2 font-mono">
              {activeCase.caseNumber}
            </h2>
            <p className="text-xs text-neutral-400 mt-0.5">
              {activeCase.clientName} vs. {activeCase.opponentName}
            </p>
          </div>

          <span className="text-[10px] font-semibold px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
            {activeCase.status}
          </span>
        </div>

        {/* Court & Bench */}
        <div className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-3 flex items-center justify-between text-xs text-neutral-300">
          <div className="flex items-center gap-2">
            <Building size={16} className="text-neutral-500" />
            <span>{activeCase.courtLocation}</span>
          </div>
          <span className="font-mono text-neutral-400">{latestHearing.courtRoom}</span>
        </div>

        {/* Advocate Card */}
        <div className="flex items-center justify-between pt-2 border-t border-white/[0.08]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-white text-black font-bold flex items-center justify-center text-xs">
              RM
            </div>
            <div>
              <div className="flex items-center gap-1 text-xs font-semibold text-white">
                <span>Adv. Rajesh Mehta</span>
                <ShieldCheck size={12} className="text-emerald-400" />
              </div>
              <span className="text-[10px] text-neutral-500 font-mono">D/1482/2015</span>
            </div>
          </div>

          <button 
            onClick={onNavigateToDocs}
            className="text-xs text-amber-300 hover:text-white font-medium flex items-center gap-1"
          >
            <span>Case Files</span>
            <ArrowUpRight size={12} />
          </button>
        </div>
      </div>

      {/* Next Court Hearing Countdown Card */}
      <div className="glass-card rounded-3xl p-5 border border-white/[0.08] flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center">
              <Calendar size={15} />
            </div>
            <h3 className="text-xs font-semibold text-neutral-200">
              {t.nextCourtDate}
            </h3>
          </div>
          <span className="text-xs font-bold text-white font-mono bg-white/[0.06] px-2.5 py-0.5 rounded-full">
            {latestHearing.hearingDate}
          </span>
        </div>

        <div className="bg-white/[0.02] border border-white/[0.04] rounded-2xl p-3 text-xs text-neutral-300">
          <span className="text-[10px] uppercase font-semibold text-neutral-500 block mb-1">
            {t.purpose}:
          </span>
          <p className="font-medium">
            {language === 'en' ? latestHearing.purposeEn : latestHearing.purposeHi}
          </p>
        </div>
      </div>

      {/* Latest Bench Order Notes */}
      <div className="glass-card rounded-3xl p-5 border border-white/[0.08] flex flex-col gap-2.5">
        <div className="flex items-center gap-2 text-xs font-semibold text-neutral-200">
          <Gavel size={15} className="text-amber-400" />
          <span>{t.lastCourtUpdate}</span>
        </div>
        <p className="text-xs text-neutral-300 leading-relaxed bg-white/[0.02] p-3 rounded-2xl border border-white/[0.04]">
          "{language === 'en' ? latestHearing.previousOrderSummaryEn : latestHearing.previousOrderSummaryHi}"
        </p>
      </div>

      {/* Quick Action Cards */}
      <div className="grid grid-cols-2 gap-3">
        <div
          onClick={onNavigateToDocs}
          className="glass-card rounded-3xl p-4 cursor-pointer hover:border-white/[0.15] transition ios-press"
        >
          <FileCheck2 size={20} className="text-purple-400 mb-2" />
          <h4 className="text-xs font-semibold text-white">Upload Documents</h4>
          <span className="text-[10px] text-neutral-400 mt-0.5 block">1 format warning</span>
        </div>

        <div
          onClick={onNavigateToPay}
          className="glass-card rounded-3xl p-4 cursor-pointer hover:border-white/[0.15] transition ios-press"
        >
          <div className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mb-2 font-mono text-[10px] font-bold">
            ₹
          </div>
          <h4 className="text-xs font-semibold text-white">Pay Advocate Fee</h4>
          <span className="text-[10px] text-neutral-400 mt-0.5 block">Instant UPI receipt</span>
        </div>
      </div>
    </div>
  );
};

