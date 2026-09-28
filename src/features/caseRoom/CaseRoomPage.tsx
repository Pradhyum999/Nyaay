import React, { useState } from 'react';
import { Card } from '../../design/ui/Card';
import { Button } from '../../design/ui/Button';
import { Segmented } from '../../design/ui/Segmented';
import { StatusBadge } from '../../design/ui/StatusBadge';
import { EmptyState } from '../../design/ui/EmptyState';
import { CaseFile, HearingItem, InvoiceItem, Language } from '../../types';
import { getStagesForMatter } from '../../config/stages';
import { normaliseCaseNumber } from '../../lib/caseNumber';
import {
  Scale,
  Calendar,
  Clock,
  MapPin,
  FileText,
  IndianRupee,
  MessageSquare,
  AlertCircle,
  CheckCircle2,
  Sparkles,
  ChevronRight,
  UploadCloud,
  ChevronDown,
  Download,
  HelpCircle,
  X
} from 'lucide-react';

interface CaseRoomPageProps {
  cases: CaseFile[];
  activeCase?: CaseFile;
  hearings: HearingItem[];
  invoices: InvoiceItem[];
  language?: Language;
  onSelectCase: (caseNumber: string) => void;
  onNavigateToHelp: () => void;
  onMessageLawyer: (lawyerName: string) => void;
  onUploadDocument?: () => void;
  onPayInvoice?: (invoiceId: string) => void;
}

export const CaseRoomPage: React.FC<CaseRoomPageProps> = ({
  cases,
  activeCase,
  hearings,
  invoices,
  language = 'en',
  onSelectCase,
  onNavigateToHelp,
  onMessageLawyer,
  onUploadDocument,
  onPayInvoice,
}) => {
  const [activeTab, setActiveTab] = useState<'timeline' | 'documents' | 'fees'>('timeline');
  const [explainedOrder, setExplainedOrder] = useState<string | null>(null);
  const [selectedAskPrompt, setSelectedAskPrompt] = useState<string | null>(null);
  const [askAnswer, setAskAnswer] = useState<string | null>(null);

  // If client has no cases yet
  if (!activeCase && cases.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-6 text-white min-h-[70vh] max-w-md mx-auto">
        <EmptyState
          icon={<Scale size={32} />}
          title={language === 'hi' ? 'कोई सक्रिय केस नहीं मिला' : 'No Active Legal Case'}
          description={
            language === 'hi'
              ? 'अपनी कानूनी समस्या का विवरण देकर या वकील से परामर्श लेकर अपना पहला केस शुरू करें।'
              : 'Consult with an advocate or describe your legal matter to open your Case Room.'
          }
          actionLabel={language === 'hi' ? 'कानूनी सहायता प्राप्त करें' : 'Find Legal Help'}
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

  // Filter hearings for this case using Postel's Law normalisation
  const caseHearings = hearings.filter(
    h => normaliseCaseNumber(h.caseNumber) === normalisedCase
  );

  // Filter invoices for this case
  const caseInvoices = invoices.filter(
    i => i.caseNumber && normaliseCaseNumber(i.caseNumber) === normalisedCase
  );

  const handleDownloadIcs = () => {
    const title = `Court Hearing: ${currentCase.caseNumber}`;
    const location = currentCase.courtLocation || 'Court';
    const description = `Court listing for ${currentCase.caseNumber} (${currentCase.clientName} vs. ${currentCase.opponentName || 'Opposite Party'}).`;
    const icsContent = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//NYAAY//Legal Operating System//EN',
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

  const handleAskCasePrompt = (prompt: string) => {
    setSelectedAskPrompt(prompt);
    if (prompt.includes('wear') || prompt.includes('expect')) {
      setAskAnswer('In Indian District & High Courts: Wear formal, modest attire (white/light-colored shirt with dark trousers). Stand politely when the judge calls your matter number. Do not speak unless directly addressed by the Hon\'ble Judge or your retained advocate.');
    } else if (prompt.includes('person') || prompt.includes('physically')) {
      setAskAnswer('Unless the court explicitly issues a summons requiring personal appearance (e.g. for evidence or recording statement under CrPC/BNSS), your advocate represents you and can answer the cause list on your behalf.');
    } else if (prompt.includes('documents')) {
      setAskAnswer('Keep original photo ID (Aadhaar or Voter ID) and original copies of whatever exhibits are referenced in your petition or written statement. Your advocate will file certified copies with the registry.');
    } else {
      setAskAnswer('Typical procedural intervals in Indian trial courts range between 2 to 4 weeks depending on the court\'s cause list load and urgency of interim relief applications.');
    }
  };

  // Next hearing
  const nextHearing = caseHearings[0];

  // What you need to do (Action items)
  const todoItems = [
    {
      id: 'd1',
      title: 'Upload Signed Affidavit / Identity Proof',
      desc: 'Required by court registry for next date filing',
      action: 'Upload Now',
      onClick: onUploadDocument,
    },
    ...(caseInvoices.some(i => i.status === 'Pending' || i.status === 'Overdue')
      ? [
          {
            id: 'f1',
            title: 'Settle Pending Legal Appearance Fee',
            desc: 'Invoice ready for direct settlement via UPI',
            action: 'View & Pay',
            onClick: () => setActiveTab('fees'),
          },
        ]
      : []),
  ];

  return (
    <div className="flex flex-col gap-4 p-4 sm:p-6 pb-28 text-white max-w-4xl mx-auto w-full">
      {/* ── Case Switcher (if multiple cases) ── */}
      {cases.length > 1 && (
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
          <span className="text-xs text-neutral-400 font-semibold font-mono">My Cases:</span>
          {cases.map(c => (
            <button
              key={c.caseNumber}
              type="button"
              onClick={() => onSelectCase(c.caseNumber)}
              className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold transition ios-press ${
                c.caseNumber === currentCase.caseNumber
                  ? 'bg-amber-400 text-black shadow-sm'
                  : 'bg-white/[0.06] text-neutral-400 hover:text-white'
              }`}
            >
              {c.caseNumber}
            </button>
          ))}
        </div>
      )}

      {/* ── Header Dossier Card ── */}
      <Card className="border-amber-400/25 bg-gradient-to-b from-white/[0.06] to-transparent">
        <div className="flex flex-col gap-3">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-full bg-amber-400/15 border border-amber-400/30 text-amber-300">
                  {currentCase.caseType || 'Matter Dossier'}
                </span>
                <StatusBadge status={currentCase.status || 'active'} />
              </div>
              <h1 className="text-lg sm:text-xl font-bold font-mono text-white mt-1.5">
                {currentCase.caseNumber}
              </h1>
              <p className="text-xs sm:text-sm text-neutral-300 mt-0.5">
                {currentCase.clientName} {currentCase.opponentName ? `vs. ${currentCase.opponentName}` : ''}
              </p>
            </div>

            <Button
              variant="secondary"
              size="sm"
              icon={<MessageSquare size={13} />}
              onClick={() => onMessageLawyer('Advocate')}
            >
              {language === 'hi' ? 'वकील से बात करें' : 'Message Lawyer'}
            </Button>
          </div>

          {/* Procedural Stage Stepper */}
          <div className="pt-2 border-t border-white/[0.08]">
            <div className="flex items-center justify-between text-xs mb-1.5">
              <span className="font-semibold text-neutral-300">
                {language === 'hi' ? 'केस की वर्तमान स्थिति' : 'Current Stage:'} {stages[safeStageIdx]?.name}
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
            <h3 className="text-xs font-bold uppercase tracking-wider font-mono text-neutral-300">
              {language === 'hi' ? 'आपके लिए आवश्यक कार्य' : 'What You Need To Do'}
            </h3>
          </div>

          <div className="grid gap-2">
            {todoItems.map(item => (
              <Card key={item.id} className="flex items-center justify-between p-3.5 bg-amber-400/[0.03] border-amber-400/20">
                <div>
                  <h4 className="text-xs sm:text-sm font-bold text-white">{item.title}</h4>
                  <p className="text-[11px] text-neutral-400 mt-0.5">{item.desc}</p>
                </div>
                <Button variant="primary" size="sm" onClick={item.onClick}>
                  {item.action}
                </Button>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* ── Next Hearing Card with .ics and Directions ── */}
      {currentCase.nextHearingDate && (
        <Card className="flex flex-col gap-3 p-4 bg-gradient-to-r from-white/[0.04] to-transparent border-amber-400/25">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-11 h-11 rounded-2xl bg-amber-400/15 border border-amber-400/30 flex items-center justify-center text-amber-300 shrink-0">
                <Calendar size={20} />
              </div>
              <div className="min-w-0">
                <p className="text-xs text-neutral-400">Next Court Listing</p>
                <h3 className="text-sm sm:text-base font-bold text-white font-mono mt-0.5 truncate">
                  {currentCase.nextHearingDate}
                </h3>
                <p className="text-[11px] text-neutral-400 truncate">
                  {currentCase.courtLocation || 'District Court Complex'}
                </p>
              </div>
            </div>
            <span className="text-xs font-mono font-bold text-amber-300 px-2.5 py-1 rounded-full bg-amber-400/10 border border-amber-400/20 shrink-0">
              Listed
            </span>
          </div>

          <div className="flex items-center gap-2 pt-2 border-t border-white/[0.06]">
            <Button
              variant="secondary"
              size="sm"
              icon={<Download size={13} />}
              onClick={handleDownloadIcs}
              className="flex-1 text-xs"
            >
              Add to Calendar (.ics)
            </Button>
            <a
              href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(currentCase.courtLocation || 'District Court')}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl border border-white/10 hover:border-amber-400/40 bg-white/[0.04] text-xs font-semibold text-neutral-200 hover:text-white transition ios-press"
            >
              <MapPin size={13} className="text-amber-400" />
              <span>Directions</span>
            </a>
          </div>
        </Card>
      )}

      {/* ── Ask About This Case (askMyCase per Section 7.5 & 4.3) ── */}
      <Card className="space-y-2.5 border-white/[0.08] bg-white/[0.02]">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-bold text-neutral-300 font-mono">
            <HelpCircle size={14} className="text-amber-400" />
            <span>Ask About This Case (FAQ & Procedural Guidance)</span>
          </div>
          {selectedAskPrompt && (
            <button
              type="button"
              onClick={() => {
                setSelectedAskPrompt(null);
                setAskAnswer(null);
              }}
              className="text-xs text-neutral-400 hover:text-white flex items-center gap-1"
            >
              <X size={12} /> Clear
            </button>
          )}
        </div>

        <div className="flex flex-wrap gap-1.5">
          {[
            'What should I wear and expect in court?',
            'Do I have to appear physically?',
            'What documents are required from me?',
            'How long does this stage usually take?',
          ].map(p => (
            <button
              key={p}
              type="button"
              onClick={() => handleAskCasePrompt(p)}
              className={`px-2.5 py-1.5 rounded-xl text-xs transition text-left ios-press ${
                selectedAskPrompt === p
                  ? 'bg-amber-400 text-black font-bold shadow-sm'
                  : 'bg-white/[0.04] hover:bg-white/[0.08] text-neutral-300 border border-white/[0.06]'
              }`}
            >
              {p}
            </button>
          ))}
        </div>

        {askAnswer && (
          <div className="p-3 rounded-2xl bg-amber-400/10 border border-amber-400/25 text-xs text-amber-200 animate-in fade-in leading-relaxed">
            <span className="font-bold block mb-1 font-mono text-[11px] text-amber-300">
              💡 Legal Information Guidance:
            </span>
            {askAnswer}
          </div>
        )}
      </Card>

      {/* ── Latest Court Order with Plain Language Explainer ── */}
      <Card className="space-y-2 border-white/[0.1]">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-bold text-neutral-300 font-mono">
            <Scale size={14} className="text-amber-400" />
            <span>{language === 'hi' ? 'पिछली सुनवाई का अदालती आदेश' : 'Latest Court Order Summary'}</span>
          </div>
          <button
            type="button"
            onClick={() =>
              setExplainedOrder(
                explainedOrder
                  ? null
                  : 'In simple words: The judge reviewed the preliminary application and granted an extension for both parties to submit remaining evidentiary documents before the next final arguments date.'
              )
            }
            className="flex items-center gap-1 text-xs text-amber-300 hover:underline font-semibold"
          >
            <Sparkles size={13} />
            <span>{explainedOrder ? 'Hide Explanation' : 'Explain in Simple Words'}</span>
          </button>
        </div>

        <p className="text-xs text-neutral-300 leading-relaxed bg-white/[0.02] p-3 rounded-2xl border border-white/[0.04]">
          "Notice issued to opposite parties. Matter adjourned for completion of pleadings and cross-examination. Interim protection extended until next date of listing."
        </p>

        {explainedOrder && (
          <div className="p-3 rounded-2xl bg-amber-400/10 border border-amber-400/20 text-xs text-amber-200 animate-in fade-in leading-relaxed">
            <span className="font-bold block mb-1">Plain Language Explanation:</span>
            {explainedOrder}
          </div>
        )}
      </Card>

      {/* ── Segmented Navigation for Deep Details ── */}
      <Segmented
        value={activeTab}
        onChange={setActiveTab}
        items={[
          { id: 'timeline', label: language === 'hi' ? 'समयरेखा' : 'Timeline' },
          { id: 'documents', label: language === 'hi' ? 'दस्तावेज' : 'Documents', badge: 3 },
          { id: 'fees', label: language === 'hi' ? 'बिल व भुगतान' : 'Fees & Pay' },
        ]}
      />

      {/* Tab: Timeline */}
      {activeTab === 'timeline' && (
        <div className="space-y-2.5 animate-in fade-in">
          {[
            { date: '18 Sep 2026', title: 'Case Dossier & Vakalatnama Executed', desc: 'Case formally instituted with assigned advocate counsel' },
            { date: '22 Sep 2026', title: 'Summons Issued by Court', desc: 'Notice served to respondent parties for appearance' },
            { date: '28 Sep 2026', title: 'Pleadings & Interim Stay Arguments', desc: 'Oral arguments presented; next date set for final orders' },
          ].map((t, idx) => (
            <div key={idx} className="flex gap-3 text-xs">
              <div className="flex flex-col items-center">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                {idx < 2 && <span className="w-0.5 h-full bg-white/[0.1] my-1" />}
              </div>
              <div className="pb-3 min-w-0">
                <span className="text-[11px] font-mono text-neutral-400">{t.date}</span>
                <p className="font-bold text-white">{t.title}</p>
                <p className="text-neutral-400 mt-0.5 text-[11px]">{t.desc}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Tab: Documents */}
      {activeTab === 'documents' && (
        <div className="space-y-2.5 animate-in fade-in">
          {[
            { name: 'Vakalatnama (Authorized Representation)', status: 'verified' },
            { name: 'Copy of Petition & Attached Exhibits', status: 'verified' },
            { name: 'Certified Copy of Court Notice', status: 'verified' },
            { name: 'Identification Proof (Aadhaar / Voter ID)', status: 'pending' },
          ].map(doc => (
            <Card key={doc.name} className="flex items-center justify-between p-3.5">
              <div className="flex items-center gap-2.5 min-w-0">
                <FileText size={16} className="text-amber-300 shrink-0" />
                <span className="text-xs font-semibold text-white truncate">{doc.name}</span>
              </div>
              <StatusBadge status={doc.status} />
            </Card>
          ))}
        </div>
      )}

      {/* Tab: Fees */}
      {activeTab === 'fees' && (
        <div className="space-y-3 animate-in fade-in">
          <Card className="flex items-center justify-between p-4 bg-gradient-to-r from-amber-400/10 to-transparent border-amber-400/20">
            <div>
              <p className="text-xs text-neutral-400">Total Legal Fee</p>
              <h3 className="text-lg font-bold font-mono text-white">₹35,000</h3>
            </div>
            <Button variant="primary" size="sm" onClick={() => onPayInvoice?.('inv-1')}>
              Pay via UPI
            </Button>
          </Card>
        </div>
      )}
    </div>
  );
};
