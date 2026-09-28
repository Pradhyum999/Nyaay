import React from 'react';
import { Calendar, Building, Clock, ShieldCheck, Gavel, FileCheck2, ArrowUpRight, Scale, Sparkles, FolderPlus, UserCheck, ChevronRight, MessageSquare } from 'lucide-react';
import { CaseFile, HearingItem, Language } from '../../types';
import { translations } from '../../i18n/translations';

interface ClientCaseTrackerProps {
  cases?: CaseFile[];
  activeCase?: CaseFile | null;
  hearings?: HearingItem[];
  latestHearing?: HearingItem | null;
  language: Language;
  onNavigateToDocs: () => void;
  onNavigateToPay: () => void;
  onNavigateToConsult?: () => void;
  onNavigateToDirectory?: () => void;
  onNavigateToChat?: (lawyerName: string, caseNumber: string) => void;
  onOpenFeedback?: () => void;
}

export const ClientCaseTracker: React.FC<ClientCaseTrackerProps> = ({
  cases,
  activeCase,
  hearings,
  latestHearing,
  language,
  onNavigateToDocs,
  onNavigateToPay,
  onNavigateToConsult,
  onNavigateToDirectory,
  onNavigateToChat,
  onOpenFeedback
}) => {
  const t = translations[language];

  const availableCases = React.useMemo(() => {
    if (cases && cases.length > 0) return cases;
    if (activeCase) return [activeCase];
    return [];
  }, [cases, activeCase]);

  const [selectedCaseIndex, setSelectedCaseIndex] = React.useState(0);
  const currentCase = availableCases[selectedCaseIndex] || activeCase || null;
  const currentHearing = React.useMemo(() => {
    if (currentCase && hearings && hearings.length > 0) {
      const matched = hearings.find(h => h.caseNumber === currentCase.caseNumber);
      if (matched) return matched;
    }
    return latestHearing || null;
  }, [currentCase, hearings, latestHearing]);

  // Procedural milestones stages
  const stages = [
    { label: 'Admission', status: 'completed' },
    { label: 'Notice & WS', status: 'completed' },
    { label: 'Evidence', status: 'current' },
    { label: 'Final Arguments', status: 'upcoming' },
    { label: 'Judgment', status: 'upcoming' },
  ];

  // ── EMPTY STATE FOR NEW CLIENTS (REAL PRODUCTION UX) ───────────────────────
  if (!currentCase) {
    return (
      <div className="flex flex-col gap-5 p-4 sm:p-5 pb-28">
        <div className="pt-1">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/[0.06] border border-white/[0.1] text-[10px] font-mono text-neutral-400 font-medium">
            CITIZEN CASE VAULT
          </span>
          <h1 className="text-2xl font-bold tracking-tight text-white font-display mt-1">
            {t.activeCaseTitle}
          </h1>
          <p className="text-xs text-neutral-400 mt-0.5">
            {language === 'en' ? 'Track ongoing proceedings, orders, and court notices' : 'अपनी अदालती कार्यवाही और आदेशों को ट्रैक करें'}
          </p>
        </div>

        {/* Actionable Empty State Card */}
        <div className="glass-card rounded-3xl p-6 border border-white/[0.1] bg-gradient-to-b from-neutral-900/40 via-black to-black text-center flex flex-col items-center gap-4 rim-card">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-b from-neutral-800 to-neutral-950 border border-white/[0.14] flex items-center justify-center text-amber-300 shadow-xl">
            <Scale size={26} strokeWidth={1.8} />
          </div>

          <div>
            <h3 className="text-base font-bold text-white tracking-tight">
              {language === 'en' ? 'No Active Case Linked' : 'कोई सक्रिय केस नहीं जुड़ा है'}
            </h3>
            <p className="text-xs text-neutral-400 max-w-xs mt-1.5 leading-relaxed">
              {language === 'en'
                ? 'You do not have any court matters assigned to your account yet. You can seek AI legal assistance or engage a verified advocate from our directory.'
                : 'आपके खाते में अभी कोई केस नहीं है। आप NAYANEETI AI से कानूनी सहायता ले सकते हैं या सत्यापित अधिवक्ता से संपर्क कर सकते हैं।'}
            </p>
          </div>

          <div className="w-full flex flex-col sm:flex-row gap-2.5 pt-2">
            {onNavigateToConsult && (
              <button
                onClick={onNavigateToConsult}
                className="flex-1 py-3 px-4 rounded-2xl bg-white text-black font-semibold text-xs flex items-center justify-center gap-2 hover:bg-neutral-200 transition ios-press shadow-md"
              >
                <Sparkles size={14} className="text-black" />
                <span>{language === 'en' ? 'Consult NAYANEETI AI' : 'NAYANEETI AI से पूछें'}</span>
              </button>
            )}
            {onNavigateToDirectory && (
              <button
                onClick={onNavigateToDirectory}
                className="flex-1 py-3 px-4 rounded-2xl bg-white/[0.08] hover:bg-white/[0.14] text-neutral-200 border border-white/[0.1] font-semibold text-xs flex items-center justify-center gap-2 transition ios-press"
              >
                <UserCheck size={14} className="text-amber-400" />
                <span>{language === 'en' ? 'Find an Advocate' : 'वकील खोजें'}</span>
              </button>
            )}
          </div>

          {onOpenFeedback && (
            <button
              onClick={onOpenFeedback}
              className="w-full py-2.5 px-4 rounded-2xl bg-amber-400/10 hover:bg-amber-400/15 text-amber-300 border border-amber-400/20 font-medium text-xs flex items-center justify-center gap-2 transition ios-press"
            >
              <MessageSquare size={13} />
              <span>{language === 'mr' ? 'अभिप्राय नोंदवा (टाइप किंवा बोलून)' : language === 'hi' ? 'नागरिक प्रतिक्रिया दें (टाइप या बोलकर)' : 'Citizen Feedback & Voice Review'}</span>
            </button>
          )}
        </div>
      </div>
    );
  }

  // ── ACTIVE CASE MATTER VIEW ───────────────────────────────────────────────
  const activeOrderSummary = currentHearing?.previousOrderSummaryEn || currentCase.orderNotes;
  const activeNextCourtDate = currentHearing?.hearingDate || currentCase.nextHearingDate;

  return (
    <div className="flex flex-col gap-4 p-4 sm:p-5 pb-28">
      {/* Header */}
      <div className="pt-1">
        <div className="flex items-center justify-between mb-1">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-[10px] font-mono text-emerald-400 font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            CASE PROCEEDING ACTIVE
          </span>
          {availableCases.length > 1 && (
            <span className="text-[10px] font-mono text-neutral-400">
              {selectedCaseIndex + 1} of {availableCases.length} Matters
            </span>
          )}
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-white font-display">
          {t.activeCaseTitle}
        </h1>
        <p className="text-xs text-neutral-400 mt-0.5">
          {language === 'en' ? 'Live status synced with official court dockets' : 'अदालती रिकॉर्ड से सत्यापित लाइव स्टेटस'}
        </p>
      </div>

      {/* Case Switcher Tabs (When client has multiple cases) */}
      {availableCases.length > 1 && (
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
          {availableCases.map((c, idx) => (
            <button
              key={c.id || idx}
              type="button"
              onClick={() => setSelectedCaseIndex(idx)}
              className={`px-3 py-1.5 rounded-xl text-xs font-mono transition ios-press shrink-0 flex items-center gap-1.5 ${
                selectedCaseIndex === idx
                  ? 'bg-amber-400 text-black font-bold shadow-md'
                  : 'bg-white/[0.06] text-neutral-300 hover:text-white border border-white/[0.08]'
              }`}
            >
              <span>{c.caseNumber}</span>
              <span className={`w-1.5 h-1.5 rounded-full ${c.status === 'Active' ? 'bg-emerald-500' : 'bg-neutral-500'}`} />
            </button>
          ))}
        </div>
      )}

      {/* Hero Matter Card: High-End Linear Rim Styling */}
      <div className="glass-card rounded-3xl p-5 border border-white/[0.12] bg-gradient-to-b from-neutral-900/90 via-black to-black shadow-2xl flex flex-col gap-4 relative overflow-hidden rim-card">
        {/* Top Matter Details */}
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] uppercase font-mono tracking-wider text-amber-300 bg-amber-400/10 px-2.5 py-0.5 rounded-full border border-amber-400/20 font-semibold">
                {currentCase.caseType}
              </span>
              <span className="text-[10px] font-mono text-neutral-400">
                Filed: {currentCase.filingDate}
              </span>
            </div>
            
            <h2 className="text-xl font-extrabold text-white tracking-tight mt-2 font-mono">
              {currentCase.caseNumber}
            </h2>
            <p className="text-xs text-neutral-300 mt-1 font-medium leading-relaxed">
              {currentCase.clientName} <span className="text-neutral-500 font-mono">vs.</span> {currentCase.opponentName}
            </p>
          </div>

          <span className="text-[10px] font-semibold px-2.5 py-1 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 font-mono">
            ● {currentCase.status}
          </span>
        </div>

        {/* Court & Bench */}
        <div className="bg-black/60 border border-white/[0.06] rounded-2xl p-3 flex items-center justify-between text-xs text-neutral-300 font-mono">
          <div className="flex items-center gap-2">
            <Building size={15} className="text-amber-400 shrink-0" />
            <span className="text-white/90">{currentCase.courtLocation}</span>
          </div>
          <span className="text-neutral-400">{currentHearing?.courtRoom || 'Court Room TBA'}</span>
        </div>

        {/* Procedural Milestone Tracker */}
        <div className="pt-2 border-t border-white/[0.06]">
          <span className="text-[10px] font-semibold text-neutral-400 uppercase tracking-wider block mb-2.5">
            Procedural Stage Progress
          </span>
          <div className="flex items-center justify-between relative">
            <div className="absolute top-2 left-0 right-0 h-0.5 bg-white/[0.08] -z-0" />
            {stages.map((st, i) => (
              <div key={i} className="flex flex-col items-center gap-1.5 relative z-10">
                <div className={`w-4 h-4 rounded-full flex items-center justify-center border text-[8px] font-bold ${
                  st.status === 'completed'
                    ? 'bg-emerald-500 border-emerald-400 text-black'
                    : st.status === 'current'
                    ? 'bg-amber-400 border-amber-300 text-black animate-pulse'
                    : 'bg-neutral-900 border-white/20 text-white/40'
                }`}>
                  {st.status === 'completed' ? '✓' : i + 1}
                </div>
                <span className={`text-[9px] text-center font-mono ${
                  st.status === 'current' ? 'text-amber-300 font-semibold' : 'text-neutral-500'
                }`}>
                  {st.label}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Verified Advocate Banner */}
        <div className="flex items-center justify-between pt-3 border-t border-white/[0.08]">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-gradient-to-b from-neutral-800 to-neutral-950 border border-white/[0.14] flex items-center justify-center text-amber-300 font-bold text-xs shadow-sm">
              RM
            </div>
            <div>
              <div className="flex items-center gap-1 text-xs font-semibold text-white">
                <span>Adv. Rajesh Mehta</span>
                <ShieldCheck size={13} className="text-amber-400" />
              </div>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-[10px] text-neutral-400 font-mono">D/1482/2015 • Delhi HC</span>
                <span className="text-[9px] px-1.5 py-0.2 rounded bg-emerald-500/10 text-emerald-400 font-mono border border-emerald-500/20">
                  {language === 'mr' ? 'वकालतनामा मंजूर' : language === 'hi' ? 'वकालतनामा स्वीकृत' : 'Representation Active'}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {onNavigateToChat && (
              <button 
                type="button"
                onClick={() => onNavigateToChat('Adv. Rajesh Mehta', currentCase.caseNumber)}
                className="text-xs text-emerald-400 hover:text-emerald-300 font-medium flex items-center gap-1 font-mono transition ios-press bg-emerald-500/15 hover:bg-emerald-500/25 px-2.5 py-1.5 rounded-xl border border-emerald-500/30"
                title="Chat with Advocate"
              >
                <MessageSquare size={12} />
                <span>Chat</span>
              </button>
            )}
            <button 
              type="button"
              onClick={onNavigateToDocs}
              className="text-xs text-amber-300 hover:text-white font-medium flex items-center gap-1 font-mono transition ios-press bg-white/[0.06] hover:bg-white/[0.12] px-2.5 py-1.5 rounded-xl border border-white/[0.08]"
            >
              <span>Files</span>
              <ArrowUpRight size={12} />
            </button>
          </div>
        </div>
      </div>

      {/* Next Court Hearing Countdown Card */}
      {activeNextCourtDate && (
        <div className="glass-card rounded-3xl p-5 border border-white/[0.08] flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-blue-500/15 border border-blue-500/30 text-blue-400 flex items-center justify-center">
                <Calendar size={16} />
              </div>
              <div>
                <h3 className="text-xs font-semibold text-neutral-100">
                  {t.nextCourtDate}
                </h3>
                <span className="text-[10px] text-neutral-400 font-mono">
                  {currentHearing?.courtName || currentCase.courtLocation}
                </span>
              </div>
            </div>
            <span className="text-xs font-bold text-white font-mono bg-white/[0.06] border border-white/[0.1] px-3 py-1 rounded-full">
              {activeNextCourtDate}
            </span>
          </div>

          {currentHearing?.purposeEn && (
            <div className="bg-black/60 border border-white/[0.05] rounded-2xl p-3 text-xs text-neutral-300">
              <span className="text-[10px] uppercase font-semibold text-neutral-400 font-mono block mb-1">
                {t.purpose}:
              </span>
              <p className="font-medium text-white/90 leading-relaxed">
                {language === 'en' ? currentHearing.purposeEn : currentHearing.purposeHi}
              </p>
              {currentHearing.judgeName && (
                <span className="text-[10px] text-neutral-500 font-mono mt-1.5 block">
                  Bench: {currentHearing.judgeName}
                </span>
              )}
            </div>
          )}
        </div>
      )}

      {/* Latest Bench Order Notes (Live updated by advocate in diary) */}
      {activeOrderSummary && (
        <div className="glass-card rounded-3xl p-5 border border-white/[0.08] flex flex-col gap-2.5">
          <div className="flex items-center gap-2 text-xs font-semibold text-neutral-100">
            <Gavel size={15} className="text-amber-400" />
            <span>{t.lastCourtUpdate}</span>
          </div>
          <p className="text-xs text-neutral-300 leading-relaxed bg-black/60 p-3.5 rounded-2xl border border-white/[0.05] font-sans">
            "{language === 'hi' && currentHearing?.previousOrderSummaryHi ? currentHearing.previousOrderSummaryHi : activeOrderSummary}"
          </p>
        </div>
      )}

      {/* Quick Action Navigation Grid */}
      <div className="grid grid-cols-2 gap-3">
        <div
          onClick={onNavigateToDocs}
          className="glass-card rounded-3xl p-4 cursor-pointer hover:border-white/[0.18] transition ios-press flex flex-col justify-between"
        >
          <div>
            <div className="w-8 h-8 rounded-xl bg-purple-500/15 border border-purple-500/30 flex items-center justify-center text-purple-400 mb-2.5">
              <FileCheck2 size={18} />
            </div>
            <h4 className="text-xs font-semibold text-white">Upload Documents</h4>
            <span className="text-[10px] text-neutral-400 mt-0.5 block">Certified copies & affidavits</span>
          </div>
          <div className="flex items-center justify-end mt-3 text-neutral-500">
            <ChevronRight size={14} />
          </div>
        </div>

        <div
          onClick={onNavigateToPay}
          className="glass-card rounded-3xl p-4 cursor-pointer hover:border-white/[0.18] transition ios-press flex flex-col justify-between"
        >
          <div>
            <div className="w-8 h-8 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 mb-2.5 font-mono text-sm font-bold">
              ₹
            </div>
            <h4 className="text-xs font-semibold text-white">Pay Advocate Fee</h4>
            <span className="text-[10px] text-neutral-400 mt-0.5 block">Instant official UPI receipt</span>
          </div>
          <div className="flex items-center justify-end mt-3 text-neutral-500">
            <ChevronRight size={14} />
          </div>
        </div>
      </div>

      {/* Citizen Feedback Banner */}
      {onOpenFeedback && (
        <button
          onClick={onOpenFeedback}
          className="w-full p-4 rounded-3xl bg-amber-400/10 hover:bg-amber-400/15 border border-amber-400/25 flex items-center justify-between transition ios-press text-left"
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-amber-400/20 text-amber-300 flex items-center justify-center shrink-0">
              <MessageSquare size={16} />
            </div>
            <div>
              <p className="text-xs font-semibold text-white">
                {language === 'mr' ? 'नागरिक अभिप्राय व अनुभव नोंदवा' : language === 'hi' ? 'नागरिक प्रतिक्रिया एवं अनुभव साझा करें' : 'Citizen Feedback & Voice Rating'}
              </p>
              <p className="text-[10px] text-neutral-400">
                {language === 'mr' ? 'टाइप करून किंवा आवाजाद्वारे तुमचा अभिप्राय द्या' : language === 'hi' ? 'टाइप करके या अपनी आवाज रिकॉर्ड करके प्रतिक्रिया भेजें' : 'Share your rating or record voice dictation'}
              </p>
            </div>
          </div>
          <ChevronRight size={16} className="text-amber-300 shrink-0" />
        </button>
      )}
    </div>
  );
};
