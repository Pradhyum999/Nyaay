import React, { useState, useRef } from 'react';
import { Card } from '../../design/ui/Card';
import { Button } from '../../design/ui/Button';
import { Segmented } from '../../design/ui/Segmented';
import { StatusBadge } from '../../design/ui/StatusBadge';
import { EmptyState } from '../../design/ui/EmptyState';
import { CaseFile, HearingItem, InvoiceItem, DocumentItem, Language } from '../../types';
import { getStagesForMatter } from '../../config/stages';
import { normaliseCaseNumber } from '../../lib/caseNumber';
import { askMyCase, CaseRoomContext, summarizeOrder } from '../../lib/ai';
import {
  Scale,
  Calendar,
  Clock,
  MapPin,
  FileText,
  IndianRupee,
  MessageSquare,
  AlertCircle,
  Sparkles,
  ChevronRight,
  UploadCloud,
  Download,
  HelpCircle,
  X,
  Send,
  Loader2
} from 'lucide-react';

interface CaseRoomPageProps {
  cases: CaseFile[];
  activeCase?: CaseFile;
  hearings: HearingItem[];
  invoices: InvoiceItem[];
  documents?: DocumentItem[];
  language?: Language;
  onSelectCase: (caseNumber: string) => void;
  onNavigateToHelp: () => void;
  onMessageLawyer: (lawyerName: string) => void;
  onUploadDocument?: (docId?: string) => void;
  onPayInvoice?: (invoiceId: string) => void;
}

export const CaseRoomPage: React.FC<CaseRoomPageProps> = ({
  cases,
  activeCase,
  hearings,
  invoices,
  documents = [],
  language = 'en',
  onSelectCase,
  onNavigateToHelp,
  onMessageLawyer,
  onUploadDocument,
  onPayInvoice,
}) => {
  const [activeTab, setActiveTab] = useState<'timeline' | 'documents' | 'fees'>('timeline');
  const [explainedOrder, setExplainedOrder] = useState<string | null>(null);
  const [explainLoading, setExplainLoading] = useState(false);
  const [selectedAskPrompt, setSelectedAskPrompt] = useState<string | null>(null);
  const [customQuestion, setCustomQuestion] = useState('');
  const [askAnswer, setAskAnswer] = useState<string | null>(null);
  const [askLoading, setAskLoading] = useState(false);

  const askCache = useRef(new Map<string, string>());
  const explainCache = useRef(new Map<string, string>());

  // If client has no cases yet
  if (!activeCase && cases.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-6 text-main min-h-[70vh] max-w-md mx-auto">
        <EmptyState
          icon={<Scale size={32} />}
          title={
            language === 'mr'
              ? 'कोणताही सक्रिय खटला नाही'
              : language === 'hi'
              ? 'कोई सक्रिय केस नहीं मिला'
              : 'No Active Legal Case'
          }
          description={
            language === 'mr'
              ? 'आपली कायदेशीर समस्या मांडून किंवा वकीलांशी संपर्क साधून तुमचा पहिला खटला सुरू करा.'
              : language === 'hi'
              ? 'अपनी कानूनी समस्या का विवरण देकर या वकील से परामर्श लेकर अपना पहला केस शुरू करें।'
              : 'Consult with an advocate or describe your legal matter to open your Case Room.'
          }
          actionLabel={
            language === 'mr'
              ? 'कायदेशीर मदत मिळवा'
              : language === 'hi'
              ? 'कानूनी सहायता प्राप्त करें'
              : 'Find Legal Help'
          }
          onAction={onNavigateToHelp}
        />
      </div>
    );
  }

  const currentCase = activeCase || cases[0];
  const normalisedCase = normaliseCaseNumber(currentCase.caseNumber);
  const stages = getStagesForMatter(currentCase.caseType || currentCase.actSections?.join(', '));
  const currentStageIdx = stages.findIndex(
    s => s.name.toLowerCase() === (currentCase.stage || '').toLowerCase()
  );
  const safeStageIdx = currentStageIdx >= 0 ? currentStageIdx : 1;

  // Filter hearings for this case
  const caseHearings = hearings.filter(
    h => normaliseCaseNumber(h.caseNumber) === normalisedCase
  );

  // Filter invoices for this case
  const caseInvoices = invoices.filter(
    i => i.caseNumber && normaliseCaseNumber(i.caseNumber) === normalisedCase
  );

  // Filter documents for this case
  const caseDocs = documents.filter(
    d => d.caseNumber && normaliseCaseNumber(d.caseNumber) === normalisedCase
  );

  // Latest court order from hearings
  const latestOrder = caseHearings.find(h => h.previousOrderSummaryEn || h.purposeEn) || null;
  const orderSummaryText = latestOrder?.previousOrderSummaryEn || latestOrder?.purposeEn || null;

  const handleDownloadIcs = () => {
    const title = `Court Hearing: ${currentCase.caseNumber}`;
    const location = currentCase.courtLocation || 'Court';
    const description = `Court listing for ${currentCase.caseNumber} (${currentCase.clientName} vs. ${currentCase.opponentName || 'Opposite Party'}).`;
    const icsContent = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//NYAAYNEETI//Legal Operating System//EN',
      'BEGIN:VEVENT',
      `SUMMARY:${title}`,
      `DESCRIPTION:${description}`,
      `LOCATION:${location}`,
      `DTSTART:${new Date().toISOString().replace(/[-:]/g, '').split('.')[0]}Z`,
      `DTEND:${new Date(Date.now() + 3600000).toISOString().replace(/[-:]/g, '').split('.')[0]}Z`,
      'STATUS:CONFIRMED',
      'END:VEVENT',
      'END:VCALENDAR'
    ].join('\r\n');

    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `${currentCase.caseNumber.replace(/[\/\s]/g, '_')}_hearing.ics`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleAskCasePrompt = async (prompt: string) => {
    setSelectedAskPrompt(prompt);
    const key = `${currentCase.caseNumber}::${prompt}::${language}`;
    if (askCache.current.has(key)) {
      setAskAnswer(askCache.current.get(key)!);
      return;
    }
    setAskLoading(true);
    setAskAnswer(null);
    try {
      const ctx: CaseRoomContext = {
        caseFile: currentCase,
        hearings: caseHearings,
        documents: caseDocs,
        invoices: caseInvoices,
        tasks: [],
        timeline: currentCase.timeline ?? [],
      };
      const answer = await askMyCase(prompt, ctx, language);
      askCache.current.set(key, answer);
      setAskAnswer(answer);
    } catch {
      setAskAnswer(
        language === 'mr'
          ? 'सध्या एआय उपलब्ध नाही. कृपया थोड्या वेळाने प्रयत्न करा.'
          : language === 'hi'
          ? 'एआई वर्तमान में उपलब्ध नहीं है। कृपया थोड़ी देर बाद पुनः प्रयास करें।'
          : 'AI is unavailable right now — please try again in a moment.'
      );
    } finally {
      setAskLoading(false);
    }
  };

  const handleExplain = async () => {
    if (explainedOrder) {
      setExplainedOrder(null);
      return;
    }
    if (!orderSummaryText) return;
    const key = `${latestOrder?.id || 'order'}::${language}`;
    if (explainCache.current.has(key)) {
      setExplainedOrder(explainCache.current.get(key)!);
      return;
    }
    setExplainLoading(true);
    try {
      const summary = await summarizeOrder(orderSummaryText, language);
      explainCache.current.set(key, summary);
      setExplainedOrder(summary);
    } catch {
      setExplainedOrder(
        language === 'mr'
          ? 'आदेश समजावून सांगण्यात त्रुटी आली. कृपया पुन्हा प्रयत्न करा.'
          : language === 'hi'
          ? 'आदेश समझने में त्रुटि हुई। कृपया पुनः प्रयास करें।'
          : 'Could not summarize order. Please retry.'
      );
    } finally {
      setExplainLoading(false);
    }
  };

  // Next hearing
  const nextHearing = caseHearings[0];

  // What you need to do (Action items)
  const todoItems = [
    ...(caseDocs.some(d => d.status === 'Missing' || d.status === 'Pending')
      ? [
          {
            id: 'd1',
            title: language === 'mr' ? 'प्रलंबित कागदपत्रे अपलोड करा' : language === 'hi' ? 'लंबित दस्तावेज अपलोड करें' : 'Upload Pending Documents',
            desc: language === 'mr' ? 'पुढील सुनावणीसाठी आवश्यक' : language === 'hi' ? 'अगली सुनवाई के लिए आवश्यक' : 'Required for next listing',
            action: language === 'mr' ? 'अपलोड' : language === 'hi' ? 'अपलोड' : 'Upload',
            onClick: () => onUploadDocument?.(),
          },
        ]
      : []),
    ...(caseInvoices.some(i => i.status === 'Pending' || i.status === 'Overdue')
      ? [
          {
            id: 'f1',
            title: language === 'mr' ? 'थकित फी भरा' : language === 'hi' ? 'लंबित शुल्क का भुगतान करें' : 'Settle Pending Legal Fee',
            desc: language === 'mr' ? 'थकित पावती उपलब्ध' : language === 'hi' ? 'चालान तैयार है' : 'Invoice ready for settlement',
            action: language === 'mr' ? 'पहा आणि भरा' : language === 'hi' ? 'देखें व भरें' : 'View & Pay',
            onClick: () => setActiveTab('fees'),
          },
        ]
      : []),
  ];

  return (
    <div className="flex flex-col gap-4 p-4 sm:p-6 pb-28 text-main max-w-4xl mx-auto w-full">
      {/* ── Case Switcher (if multiple cases) ── */}
      {cases.length > 1 && (
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
          <span className="text-xs text-sub font-semibold font-mono">
            {language === 'mr' ? 'माझे खटले:' : language === 'hi' ? 'मेरे केस:' : 'My Cases:'}
          </span>
          {cases.map(c => (
            <button
              key={c.caseNumber}
              type="button"
              onClick={() => onSelectCase(c.caseNumber)}
              className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold transition ios-press ${
                c.caseNumber === currentCase.caseNumber
                  ? 'btn-ink shadow-sm'
                  : 'bg-white/[0.06] text-sub hover:text-main'
              }`}
            >
              {c.caseNumber || 'Unnamed Case'}
            </button>
          ))}
        </div>
      )}

      {/* ── Header Dossier Hero Card (Inverse Dark Hero per R2) ── */}
      <Card className="border-amber-400/25 bg-gradient-to-b from-white/[0.06] to-transparent">
        <div className="flex flex-col gap-3">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-full bg-amber-400/15 border border-amber-400/30 text-amber-300">
                  {currentCase.caseType || 'Matter Dossier'}
                </span>
                <StatusBadge status={currentCase.status || 'Active'} />
              </div>
              <h1 className="text-lg sm:text-xl font-bold font-mono text-main mt-1.5">
                {currentCase.caseNumber || 'Case in Preparation'}
              </h1>
              <p className="text-xs sm:text-sm text-sub mt-0.5">
                {currentCase.clientName} {currentCase.opponentName ? `vs. ${currentCase.opponentName}` : ''}
              </p>
            </div>

            <Button
              variant="secondary"
              size="sm"
              icon={<MessageSquare size={13} />}
              onClick={() => onMessageLawyer(currentCase.lawyerName || 'Advocate')}
            >
              {language === 'mr' ? 'वकीलांशी बोला' : language === 'hi' ? 'वकील से बात करें' : 'Message Lawyer'}
            </Button>
          </div>

          {/* Procedural Stage Stepper */}
          <div className="pt-2 border-t border-white/[0.08]">
            <div className="flex items-center justify-between text-xs mb-1.5">
              <span className="font-semibold text-sub">
                {language === 'mr' ? 'खटल्याची सद्यस्थिती:' : language === 'hi' ? 'केस की वर्तमान स्थिति:' : 'Current Stage:'} {stages[safeStageIdx]?.name}
              </span>
              <span className="font-mono text-amber-300 font-bold">
                {safeStageIdx + 1} of {stages.length}
              </span>
            </div>
            <div className="w-full bg-white/[0.08] h-2 rounded-full overflow-hidden">
              <div
                className="bg-amber-400 h-full rounded-full transition-all duration-500"
                style={{ width: `${((safeStageIdx + 1) / stages.length) * 100}%` }}
              />
            </div>
          </div>
        </div>
      </Card>

      {/* ── "What You Need To Do" Section ── */}
      {todoItems.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
            <h3 className="text-xs font-bold uppercase tracking-wider font-mono text-sub">
              {language === 'mr' ? 'तुमच्यासाठी आवश्यक कृती' : language === 'hi' ? 'आपके लिए आवश्यक कार्य' : 'What You Need To Do'}
            </h3>
          </div>

          <div className="grid gap-2">
            {todoItems.map(item => (
              <Card key={item.id} className="flex items-center justify-between p-3.5 bg-amber-400/[0.03] border-amber-400/20">
                <div>
                  <h4 className="text-xs sm:text-sm font-bold text-main">{item.title}</h4>
                  <p className="text-[11px] text-sub mt-0.5">{item.desc}</p>
                </div>
                <Button size="sm" variant="primary" onClick={item.onClick}>
                  {item.action}
                </Button>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* ── Next Hearing Card ── */}
      {nextHearing && (
        <Card className="space-y-3 border-amber-400/25 bg-amber-400/[0.03]">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-2xl bg-amber-400/15 border border-amber-400/30 flex items-center justify-center text-amber-300 shrink-0">
                <Calendar size={18} />
              </div>
              <div>
                <span className="text-[11px] font-semibold text-amber-400 font-mono uppercase tracking-wider block">
                  {language === 'mr' ? 'पुढील सुनावणी' : language === 'hi' ? 'अगली सुनवाई' : 'Next Listing'}
                </span>
                <h3 className="text-sm font-bold text-main">{nextHearing.hearingDate}</h3>
              </div>
            </div>

            <Button
              variant="ghost"
              size="sm"
              icon={<Download size={13} />}
              onClick={handleDownloadIcs}
            >
              .ics
            </Button>
          </div>

          <div className="grid grid-cols-2 gap-2 pt-2 border-t border-white/[0.06] text-xs text-sub">
            <div>
              <span className="text-[10px] text-faint block uppercase font-mono">
                {language === 'mr' ? 'न्यायालय' : language === 'hi' ? 'अदालत' : 'Court'}
              </span>
              <span className="font-semibold text-main truncate block">{nextHearing.courtName || currentCase.courtLocation}</span>
            </div>
            <div>
              <span className="text-[10px] text-faint block uppercase font-mono">
                {language === 'mr' ? 'न्यायाधीश / खंडपीठ' : language === 'hi' ? 'न्यायाधीश / बेंच' : 'Judge / Bench'}
              </span>
              <span className="font-semibold text-main truncate block">{nextHearing.judgeName || 'Hon. Bench'}</span>
            </div>
          </div>

          <div className="flex items-center justify-between pt-1">
            <a
              href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                (nextHearing.courtName || currentCase.courtLocation || 'District Court') + ', India'
              )}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-xs text-amber-300 hover:underline font-semibold"
            >
              <MapPin size={13} className="text-amber-400" />
              <span>{language === 'mr' ? 'दिशानिर्देश (नकाशा)' : language === 'hi' ? 'दिशा-निर्देश' : 'Directions'}</span>
            </a>
          </div>
        </Card>
      )}

      {/* ── Ask About This Case (Real AI Wired) ── */}
      <Card className="space-y-3 border-white/[0.08] bg-white/[0.02]">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-bold text-sub font-mono">
            <HelpCircle size={14} className="text-amber-400" />
            <span>
              {language === 'mr'
                ? 'या खटल्याबद्दल विचारा (मार्गदर्शन)'
                : language === 'hi'
                ? 'इस केस के बारे में पूछें (मार्गदर्शन)'
                : 'Ask About This Case (AI Guidance)'}
            </span>
          </div>
          {selectedAskPrompt && (
            <button
              type="button"
              onClick={() => {
                setSelectedAskPrompt(null);
                setAskAnswer(null);
              }}
              className="text-xs text-sub hover:text-main flex items-center gap-1"
            >
              <X size={12} /> {language === 'mr' ? 'साफ करा' : language === 'hi' ? 'हटाएं' : 'Clear'}
            </button>
          )}
        </div>

        {/* Suggestion Chips */}
        <div className="flex flex-wrap gap-1.5">
          {[
            language === 'mr' ? 'कोर्टात काय कपडे घालावे आणि काय अपेक्षा करावी?' : language === 'hi' ? 'कोर्ट में क्या पहनें और क्या अपेक्षा रखें?' : 'What should I wear and expect in court?',
            language === 'mr' ? 'मला प्रत्यक्ष हजर राहावे लागेल का?' : language === 'hi' ? 'क्या मुझे व्यक्तिगत उपस्थित होना होगा?' : 'Do I have to appear physically?',
            language === 'mr' ? 'माझ्याकडून कोणती कागदपत्रे लागतील?' : language === 'hi' ? 'मुझसे कौन से दस्तावेज अपेक्षित हैं?' : 'What documents are required from me?',
            language === 'mr' ? 'या टप्प्याला साधारण किती वेळ लागतो?' : language === 'hi' ? 'इस चरण में आमतौर पर कितना समय लगता है?' : 'How long does this stage usually take?',
          ].map(p => (
            <button
              key={p}
              type="button"
              onClick={() => handleAskCasePrompt(p)}
              className={`px-2.5 py-1.5 rounded-xl text-xs transition text-left ios-press ${
                selectedAskPrompt === p
                  ? 'btn-ink font-bold shadow-sm'
                  : 'bg-white/[0.04] hover:bg-white/[0.08] text-sub border border-white/[0.06]'
              }`}
            >
              {p}
            </button>
          ))}
        </div>

        {/* Free-text input form */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (customQuestion.trim() && !askLoading) {
              handleAskCasePrompt(customQuestion.trim());
              setCustomQuestion('');
            }
          }}
          className="flex gap-2 pt-1"
        >
          <input
            type="text"
            value={customQuestion}
            onChange={(e) => setCustomQuestion(e.target.value)}
            placeholder={
              language === 'mr'
                ? 'या केसबद्दल कोणताही प्रश्न विचारा...'
                : language === 'hi'
                ? 'इस केस के बारे में कोई भी प्रश्न पूछें...'
                : 'Ask anything about this case...'
            }
            className="flex-1 px-3 py-2 text-xs rounded-xl bg-white/[0.04] border border-white/[0.08] text-main placeholder:text-faint focus:outline-none focus:border-amber-400/50"
          />
          <Button
            type="submit"
            size="sm"
            variant="primary"
            disabled={askLoading || !customQuestion.trim()}
            icon={askLoading ? <Loader2 size={13} className="animate-spin" /> : <Send size={13} />}
          >
            {language === 'mr' ? 'विचारा' : language === 'hi' ? 'पूछें' : 'Ask'}
          </Button>
        </form>

        {/* AI Loading State */}
        {askLoading && (
          <div className="p-3 rounded-2xl bg-white/[0.03] border border-white/[0.06] text-xs text-sub flex items-center gap-2">
            <Loader2 size={14} className="animate-spin text-amber-400" />
            <span>
              {language === 'mr'
                ? 'तुमच्या खटल्याचे विश्लेषण होत आहे...'
                : language === 'hi'
                ? 'आपके केस का विश्लेषण हो रहा है...'
                : 'Analyzing your case workspace…'}
            </span>
          </div>
        )}

        {/* AI Answer with Disclaimer */}
        {askAnswer && !askLoading && (
          <div className="p-3 rounded-2xl bg-amber-400/10 border border-amber-400/25 text-xs text-main animate-in fade-in leading-relaxed space-y-1.5">
            <span className="font-bold block font-mono text-[11px] text-amber-300">
              💡 {language === 'mr' ? 'कायदेशीर माहिती मार्गदर्शन:' : language === 'hi' ? 'कानूनी जानकारी मार्गदर्शन:' : 'Legal Information Guidance:'}
            </span>
            <div className="whitespace-pre-wrap">{askAnswer}</div>
            <p className="text-[10px] text-faint italic pt-1 border-t border-amber-400/20">
              {language === 'mr'
                ? 'माहितीपूर्ण मार्गदर्शन, औपचारिक कायदेशीर सल्ला नाही.'
                : language === 'hi'
                ? 'सूचनात्मक मार्गदर्शन, औपचारिक कानूनी सलाह नहीं।'
                : 'Informational guidance, not legal advice.'}
            </p>
          </div>
        )}
      </Card>

      {/* ── Latest Court Order Summary with Real AI Explainer (§2.4) ── */}
      {orderSummaryText && (
        <Card className="space-y-2 border-white/[0.1]">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-bold text-sub font-mono">
              <Scale size={14} className="text-amber-400" />
              <span>
                {language === 'mr'
                  ? 'न्यायालयीन आदेश सारांश'
                  : language === 'hi'
                  ? 'पिछली सुनवाई का अदालती आदेश'
                  : 'Latest Court Order Summary'}
              </span>
            </div>
            <button
              type="button"
              onClick={handleExplain}
              disabled={explainLoading}
              className="flex items-center gap-1 text-xs text-amber-300 hover:underline font-semibold"
            >
              {explainLoading ? (
                <Loader2 size={13} className="animate-spin" />
              ) : (
                <Sparkles size={13} />
              )}
              <span>
                {explainLoading
                  ? (language === 'mr' ? 'सोप्या शब्दात समजावत आहे...' : language === 'hi' ? 'सरल शब्दों में समझ रहे हैं...' : 'Translating to simple words…')
                  : explainedOrder
                  ? (language === 'mr' ? 'स्पष्टीकरण लपवा' : language === 'hi' ? 'विवरण छिपाएं' : 'Hide Explanation')
                  : (language === 'mr' ? 'सोप्या शब्दात समजावा' : language === 'hi' ? 'सरल शब्दों में समझें' : 'Explain in Simple Words')}
              </span>
            </button>
          </div>

          <p className="text-xs text-sub leading-relaxed bg-white/[0.02] p-3 rounded-2xl border border-white/[0.04]">
            "{orderSummaryText}"
          </p>

          {explainedOrder && (
            <div className="p-3 rounded-2xl bg-amber-400/10 border border-amber-400/20 text-xs text-main animate-in fade-in leading-relaxed space-y-1">
              <span className="font-bold block text-amber-300 font-mono text-[11px]">
                {language === 'mr' ? 'सोपे स्पष्टीकरण:' : language === 'hi' ? 'सरल भाषा में विवरण:' : 'Plain Language Explanation:'}
              </span>
              <div className="whitespace-pre-wrap">{explainedOrder}</div>
              <p className="text-[10px] text-faint italic pt-1 border-t border-amber-400/20">
                {language === 'mr'
                  ? 'माहितीपूर्ण मार्गदर्शन, औपचारिक कायदेशीर सल्ला नाही.'
                  : language === 'hi'
                  ? 'सूचनात्मक मार्गदर्शन, औपचारिक कानूनी सलाह नहीं।'
                  : 'Informational guidance, not legal advice.'}
              </p>
            </div>
          )}
        </Card>
      )}

      {/* ── Segmented Navigation for Deep Details ── */}
      <Segmented
        value={activeTab}
        onChange={setActiveTab}
        items={[
          { id: 'timeline', label: language === 'mr' ? 'समयरेखा' : language === 'hi' ? 'समयरेखा' : 'Timeline' },
          { id: 'documents', label: language === 'mr' ? 'कागदपत्रे' : language === 'hi' ? 'दस्तावेज' : 'Documents', badge: caseDocs.length || undefined },
          { id: 'fees', label: language === 'mr' ? 'फी व भरणा' : language === 'hi' ? 'बिल व भुगतान' : 'Fees & Pay' },
        ]}
      />

      {/* Tab: Timeline */}
      {activeTab === 'timeline' && (
        <div className="space-y-2.5 animate-in fade-in">
          {currentCase.timeline && currentCase.timeline.length > 0 ? (
            currentCase.timeline.map((t, idx) => (
              <div key={idx} className="flex gap-3 text-xs">
                <div className="flex flex-col items-center">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                  {idx < currentCase.timeline!.length - 1 && <span className="w-0.5 h-full bg-white/[0.1] my-1" />}
                </div>
                <div className="pb-3 min-w-0">
                  <span className="text-[11px] font-mono text-faint">{t.eventDate}</span>
                  <p className="font-bold text-main">{language === 'hi' && t.titleHi ? t.titleHi : t.titleEn}</p>
                  {(t.descriptionEn || t.descriptionHi) && (
                    <p className="text-sub mt-0.5 text-[11px]">{language === 'hi' && t.descriptionHi ? t.descriptionHi : t.descriptionEn}</p>
                  )}
                </div>
              </div>
            ))
          ) : caseHearings.length > 0 ? (
            caseHearings.map((h, idx) => (
              <div key={h.id} className="flex gap-3 text-xs">
                <div className="flex flex-col items-center">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                  {idx < caseHearings.length - 1 && <span className="w-0.5 h-full bg-white/[0.1] my-1" />}
                </div>
                <div className="pb-3 min-w-0">
                  <span className="text-[11px] font-mono text-faint">{h.hearingDate}</span>
                  <p className="font-bold text-main">{h.stage} Listing</p>
                  <p className="text-sub mt-0.5 text-[11px]">{h.purposeEn || h.previousOrderSummaryEn || 'Scheduled listing'}</p>
                </div>
              </div>
            ))
          ) : (
            <div className="text-xs text-sub py-6 text-center">
              {language === 'mr' ? 'या खटल्यासाठी कोणतीही नोंद आढळली नाही.' : language === 'hi' ? 'इस केस के लिए कोई समयरेखा प्रविष्टि उपलब्ध नहीं है।' : 'No timeline events recorded yet.'}
            </div>
          )}
        </div>
      )}

      {/* Tab: Documents */}
      {activeTab === 'documents' && (
        <div className="space-y-2.5 animate-in fade-in">
          {caseDocs.length > 0 ? (
            caseDocs.map(doc => (
              <Card key={doc.id} className="flex items-center justify-between p-3.5">
                <div className="flex items-center gap-2.5 min-w-0">
                  <FileText size={16} className="text-amber-300 shrink-0" />
                  <span className="text-xs font-semibold text-main truncate">{doc.titleEn}</span>
                </div>
                <div className="flex items-center gap-2">
                  <StatusBadge status={doc.status} />
                  {doc.status !== 'Verified' && (
                    <Button size="sm" variant="ghost" onClick={() => onUploadDocument?.(doc.id)}>
                      <UploadCloud size={13} />
                    </Button>
                  )}
                </div>
              </Card>
            ))
          ) : (
            <div className="text-center py-8 space-y-2">
              <FileText size={28} className="mx-auto text-faint" />
              <p className="text-xs text-sub">
                {language === 'mr' ? 'कागदपत्रे लवकरच जोडली जातील.' : language === 'hi' ? 'कोई दस्तावेज नहीं मिले।' : 'No documents uploaded yet.'}
              </p>
              <Button size="sm" variant="secondary" onClick={() => onUploadDocument?.()}>
                <UploadCloud size={13} />
                <span>{language === 'mr' ? 'कागदपत्र जोडा' : language === 'hi' ? 'दस्तावेज अपलोड करें' : 'Upload Document'}</span>
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Tab: Fees */}
      {activeTab === 'fees' && (
        <div className="space-y-3 animate-in fade-in">
          {caseInvoices.length > 0 ? (
            caseInvoices.map(inv => (
              <Card key={inv.id} className="flex items-center justify-between p-4 border-amber-400/20">
                <div>
                  <span className="text-[10px] font-mono text-faint uppercase">{inv.invoiceNumber} • {inv.date}</span>
                  <h3 className="text-base font-bold font-mono text-main">₹{inv.totalAmount.toLocaleString('en-IN')}</h3>
                  <StatusBadge status={inv.status} />
                </div>
                {inv.status !== 'Paid' && (
                  <Button variant="primary" size="sm" onClick={() => onPayInvoice?.(inv.id)}>
                    {language === 'mr' ? 'UPI द्वारे भरा' : language === 'hi' ? 'UPI से भुगतान करें' : 'Pay via UPI'}
                  </Button>
                )}
              </Card>
            ))
          ) : (
            <div className="text-xs text-sub py-6 text-center">
              {language === 'mr' ? 'कोणतीही प्रलंबित फी नाही.' : language === 'hi' ? 'कोई बकाया शुल्क नहीं है।' : 'No invoices billed for this matter.'}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
