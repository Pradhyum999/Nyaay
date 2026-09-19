import React, { useState } from 'react';
import { Sparkles, ShieldCheck, CheckCircle, FileText, ArrowUpRight } from 'lucide-react';
import { AIIntakeBrief, Language } from '../types';
import { translations } from '../i18n/translations';

interface AIIntakeSummaryProps {
  briefs: AIIntakeBrief[];
  language: Language;
  onAcceptCase: (brief: AIIntakeBrief) => void;
}

export const AIIntakeSummary: React.FC<AIIntakeSummaryProps> = ({ briefs, language, onAcceptCase }) => {
  const t = translations[language];
  const [selectedBrief, setSelectedBrief] = useState<AIIntakeBrief>(briefs[0]);
  const [acceptedIds, setAcceptedIds] = useState<string[]>([]);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const handleAccept = (brief: AIIntakeBrief) => {
    setAcceptedIds(prev => [...prev, brief.id]);
    onAcceptCase(brief);
    setToastMessage(t.caseAcceptedNotice);
    setTimeout(() => setToastMessage(null), 3000);
  };

  return (
    <div className="flex flex-col gap-5 p-5 pb-24">
      {/* Toast */}
      {toastMessage && (
        <div className="sticky top-2 z-30 bg-neutral-900/90 text-white border border-emerald-500/30 px-4 py-2.5 rounded-2xl shadow-2xl backdrop-blur-xl flex items-center gap-2 text-xs font-medium animate-in fade-in">
          <CheckCircle size={15} className="text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header */}
      <div>
        <span className="text-[11px] font-semibold tracking-wider uppercase text-neutral-500">
          Client Intake Queue
        </span>
        <h1 className="text-2xl font-bold tracking-tight text-white mt-0.5 flex items-center gap-2">
          <span>{t.aiIntakeHeader}</span>
          <span className="w-2 h-2 rounded-full bg-amber-400"></span>
        </h1>
        <p className="text-xs text-neutral-400 mt-1">{t.aiIntakeSubtitle}</p>
      </div>

      {/* Segmented Brief Selector */}
      <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
        {briefs.map(b => (
          <button
            key={b.id}
            onClick={() => setSelectedBrief(b)}
            className={`min-w-[190px] p-3 rounded-2xl border text-left transition-all ios-press ${
              selectedBrief.id === b.id
                ? 'bg-white text-black border-white shadow-lg'
                : 'bg-white/[0.03] text-neutral-400 hover:text-white border-white/[0.06]'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className={`text-xs font-semibold ${selectedBrief.id === b.id ? 'text-black' : 'text-white'}`}>
                {b.clientName.split(' ')[0]}
              </span>
              <span className={`text-[10px] font-mono font-medium ${selectedBrief.id === b.id ? 'text-neutral-700' : 'text-amber-400'}`}>
                {b.confidenceScore}% match
              </span>
            </div>
            <p className={`text-[11px] mt-1 line-clamp-1 ${selectedBrief.id === b.id ? 'text-neutral-700 font-medium' : 'text-neutral-400'}`}>
              {language === 'en' ? b.briefTitleEn : b.briefTitleHi}
            </p>
          </button>
        ))}
      </div>

      {/* Active Brief Card (Apple Card Style) */}
      {selectedBrief && (
        <div className="glass-card rounded-3xl p-5 flex flex-col gap-4 border border-white/[0.08]">
          {/* Top metadata */}
          <div className="flex items-start justify-between border-b border-white/[0.06] pb-3">
            <div>
              <span className="text-[10px] uppercase font-mono tracking-wider text-amber-300 bg-amber-400/10 px-2 py-0.5 rounded-full border border-amber-400/20">
                {selectedBrief.caseCategory}
              </span>
              <h3 className="text-base font-bold text-white tracking-tight mt-1.5">
                {language === 'en' ? selectedBrief.briefTitleEn : selectedBrief.briefTitleHi}
              </h3>
              <p className="text-xs text-neutral-400 mt-0.5">
                Client: <strong className="text-neutral-200">{selectedBrief.clientName}</strong>
              </p>
            </div>

            <div className="text-right">
              <span className="text-[11px] font-bold text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/20 font-mono">
                {selectedBrief.readinessScore}% Ready
              </span>
              <span className="text-[10px] text-neutral-500 block mt-1 font-mono">{selectedBrief.intakeTimestamp}</span>
            </div>
          </div>

          {/* AI Executive Summary */}
          <div className="bg-white/[0.02] border border-white/[0.05] rounded-2xl p-3.5">
            <div className="flex items-center gap-1.5 mb-1.5 text-amber-300 text-xs font-semibold">
              <Sparkles size={14} />
              <span>{t.preMeetingBrief}</span>
            </div>
            <p className="text-xs text-neutral-300 leading-relaxed font-normal">
              {language === 'en' ? selectedBrief.summaryTextEn : selectedBrief.summaryTextHi}
            </p>
          </div>

          {/* Extracted Facts */}
          <div>
            <h4 className="text-xs font-semibold text-neutral-300 uppercase tracking-wider mb-2">
              {t.extractedFacts}
            </h4>
            <div className="space-y-1.5">
              {(language === 'en' ? selectedBrief.extractedFactsEn : selectedBrief.extractedFactsHi).map((fact, idx) => (
                <div key={idx} className="bg-white/[0.02] border border-white/[0.04] p-2.5 rounded-xl text-xs text-neutral-300 flex items-start gap-2">
                  <span className="text-amber-400 font-bold">•</span>
                  <span>{fact}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Applicable Sections */}
          <div>
            <h4 className="text-xs font-semibold text-neutral-300 uppercase tracking-wider mb-2">
              {t.potentialIssues}
            </h4>
            <div className="flex flex-wrap gap-1.5">
              {selectedBrief.applicableSections.map((sec, idx) => (
                <span key={idx} className="text-xs font-mono font-medium px-2.5 py-1 rounded-xl bg-white/[0.04] text-neutral-200 border border-white/[0.08]">
                  {sec}
                </span>
              ))}
            </div>
          </div>

          {/* BCI Disclaimer */}
          <div className="text-[10px] text-neutral-500 leading-relaxed border-t border-white/[0.06] pt-3">
            {t.bciDisclaimer}
          </div>

          {/* Action */}
          <button
            onClick={() => handleAccept(selectedBrief)}
            disabled={acceptedIds.includes(selectedBrief.id)}
            className={`w-full py-3 rounded-2xl font-semibold text-xs flex items-center justify-center gap-1.5 transition-all ios-press ${
              acceptedIds.includes(selectedBrief.id)
                ? 'bg-white/[0.06] text-neutral-400 border border-white/[0.08] cursor-default'
                : 'bg-white text-black hover:bg-neutral-200 shadow-lg'
            }`}
          >
            {acceptedIds.includes(selectedBrief.id) ? (
              <>
                <CheckCircle size={15} className="text-emerald-500" />
                <span>Added to Case Diary</span>
              </>
            ) : (
              <>
                <span>{t.acceptCase}</span>
                <ArrowUpRight size={15} />
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
};
