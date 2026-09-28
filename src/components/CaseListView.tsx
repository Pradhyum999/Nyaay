import React, { useState } from 'react';
import {
  Folder,
  FolderOpen,
  ChevronDown,
  ChevronUp,
  Calendar,
  MapPin,
  Scale,
  Tag,
  Activity,
  BookMarked,
  DollarSign,
  Gavel,
  Clock,
  Sparkles,
  Plus,
  FileText,
  AlertCircle,
  CheckCircle2,
  Mic,
  MicOff,
  User,
  CheckSquare,
  Eye,
  UploadCloud,
  X
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { CaseFile, HearingItem, LimitationAlert, DocumentItem, Language } from '../types';

interface CaseListViewProps {
  cases: CaseFile[];
  hearings?: HearingItem[];
  limitationAlerts?: LimitationAlert[];
  documents?: DocumentItem[];
  language: Language;
  onUpdateHearingOrder?: (hearingId: string, orderNotes: string, nextDate: string) => void;
  onAddHearing?: (newHearing: Omit<HearingItem, 'id'>) => void;
  onEditHearing?: (id: string, updates: Partial<HearingItem>) => void;
  onSelectCase?: (caseNumber: string) => void;
  onUploadDocument?: (docId: string) => void;
}

const TITLES: Record<Language, string> = {
  en: 'Case Dossiers & Folder Docket',
  hi: 'केस फाइल्स एवं फोल्डर डायरेक्टरी',
  mr: 'केस फाइल्स आणि फोल्डर डायरेक्टरी',
};

const LABELS: Record<Language, Record<string, string>> = {
  en: {
    parties: 'Parties',
    court: 'Court & Bench',
    sections: 'Sections',
    nextHearing: 'Next Hearing',
    stage: 'Stage',
    status: 'Status',
    billed: 'Total Billed',
    caseDiary: 'Case Diary & Hearings',
    addHearing: 'Add Hearing to Case',
    logOrder: 'Log Order & Next Date',
    noHearings: 'No court hearings recorded for this case yet.',
    documents: 'Case Documents',
    noDocs: 'No documents attached.',
    noCase: 'No case files found.',
    noCaseHint: 'Add a new case to get started.',
    cases: 'cases',
    vs: 'vs.',
  },
  hi: {
    parties: 'पक्षकार',
    court: 'न्यायालय व पीठ',
    sections: 'लागू धाराएँ',
    nextHearing: 'अगली तारीख',
    stage: 'चरण',
    status: 'स्थिति',
    billed: 'कुल बिल राशि',
    caseDiary: 'केस डायरी व सुनवाई सूची',
    addHearing: 'इस केस में सुनवाई जोड़ें',
    logOrder: 'आदेश व अगली तारीख दर्ज करें',
    noHearings: 'इस मामले के लिए कोई सुनवाई दर्ज नहीं है।',
    documents: 'केस दस्तावेज़',
    noDocs: 'कोई दस्तावेज़ संलग्न नहीं है।',
    noCase: 'कोई केस फ़ाइल नहीं मिली।',
    noCaseHint: 'नया मामला जोड़ें।',
    cases: 'मामले',
    vs: 'बनाम',
  },
  mr: {
    parties: 'पक्षकार',
    court: 'न्यायालय व खंडपीठ',
    sections: 'लागू कलमे',
    nextHearing: 'पुढील तारीख',
    stage: 'टप्पा',
    status: 'स्थिती',
    billed: 'एकूण बिल',
    caseDiary: 'केस डायरी आणि सुनावणी यादी',
    addHearing: 'या केसमध्ये सुनावणी जोडा',
    logOrder: 'आदेश व पुढील तारीख नोंदवा',
    noHearings: 'या प्रकरणासाठी कोणतीही सुनावणी नोंदवलेली नाही.',
    documents: 'केस कागदपत्रे',
    noDocs: 'कागदपत्रे जोडलेली नाहीत.',
    noCase: 'कोणतीही केस फाइल आढळली नाही.',
    noCaseHint: 'नवीन प्रकरण जोडा.',
    cases: 'प्रकरणे',
    vs: 'विरुद्ध',
  },
};

function statusColor(status: string): string {
  const s = status.toLowerCase();
  if (s.includes('active') || s.includes('pending')) return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
  if (s.includes('closed') || s.includes('disposed')) return 'bg-neutral-700/60 text-neutral-400 border-white/[0.06]';
  if (s.includes('urgent') || s.includes('critical')) return 'bg-rose-500/10 text-rose-400 border-rose-500/20';
  return 'bg-amber-500/10 text-amber-300 border-amber-400/20';
}

export const CaseListView: React.FC<CaseListViewProps> = ({
  cases,
  hearings = [],
  limitationAlerts = [],
  documents = [],
  language,
  onUpdateHearingOrder,
  onAddHearing,
  onEditHearing,
  onUploadDocument,
}) => {
  const t = LABELS[language];
  const title = TITLES[language];
  const [expandedId, setExpandedId] = useState<string | null>(cases[0]?.id || null);

  // Document Vault State
  const [docItems, setDocItems] = useState<DocumentItem[]>(documents);
  const [previewDoc, setPreviewDoc] = useState<DocumentItem | null>(null);
  const [uploadingDocId, setUploadingDocId] = useState<string | null>(null);

  React.useEffect(() => {
    setDocItems(documents);
  }, [documents]);

  // Modal States for Inline Case Diary Actions
  const [activeModalHearing, setActiveModalHearing] = useState<HearingItem | null>(null);
  const [orderSummaryText, setOrderSummaryText] = useState<string>('');
  const [nextDateInput, setNextDateInput] = useState<string>(() => {
    const d = new Date();
    d.setDate(d.getDate() + 14);
    return d.toISOString().split('T')[0];
  });
  const [isDictating, setIsDictating] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Add Hearing for specific case modal
  const [addingForCase, setAddingForCase] = useState<CaseFile | null>(null);
  const [newPurpose, setNewPurpose] = useState('');
  const [newHearingDate, setNewHearingDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [newHearingTime, setNewHearingTime] = useState('10:30 AM');
  const [newCourtRoom, setNewCourtRoom] = useState('Court No. 04');

  const toggle = (id: string) => setExpandedId(prev => (prev === id ? null : id));

  const handleOpenOrderModal = (hearing: HearingItem) => {
    setActiveModalHearing(hearing);
    setOrderSummaryText(hearing.previousOrderSummaryEn || '');
  };

  const handleSaveOrder = () => {
    if (activeModalHearing && onUpdateHearingOrder) {
      onUpdateHearingOrder(activeModalHearing.id, orderSummaryText, nextDateInput);
      setActiveModalHearing(null);
      setToastMessage(language === 'hi' ? 'आदेश व अगली तारीख सफलतापूर्वक दर्ज!' : 'Order notes & next hearing date saved!');
      setTimeout(() => setToastMessage(null), 3000);
    }
  };

  const handleCreateHearingForCase = (e: React.FormEvent) => {
    e.preventDefault();
    if (!addingForCase || !onAddHearing) return;

    onAddHearing({
      caseNumber: addingForCase.caseNumber,
      clientName: addingForCase.clientName,
      courtName: addingForCase.courtLocation || 'Delhi High Court',
      itemNumber: hearings.length + 1,
      courtRoom: newCourtRoom || 'Court No. 04',
      judgeName: "Hon'ble Presiding Officer",
      stage: addingForCase.stage || 'Admission',
      hearingDate: `${newHearingDate}, ${newHearingTime || '10:30 AM'}`,
      hearingTime: newHearingTime || '10:30 AM',
      purposeEn: newPurpose || 'Preliminary Hearing & Arguments',
      purposeHi: newPurpose || 'प्रारंभिक सुनवाई एवं बहस',
      isUrgent: false
    });

    setAddingForCase(null);
    setNewPurpose('');
    setToastMessage(language === 'hi' ? 'सुनवाई केस डायरी में जोड़ी गई!' : 'Hearing added to Case Diary!');
    setTimeout(() => setToastMessage(null), 3000);
  };

  const toggleDictation = () => {
    // @ts-ignore
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setToastMessage(language === 'en' ? 'Voice dictation not supported' : 'वॉयस डिक्टेशन समर्थित नहीं है');
      setTimeout(() => setToastMessage(null), 3000);
      return;
    }

    if (isDictating) {
      setIsDictating(false);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.lang = language === 'hi' ? 'hi-IN' : 'en-IN';
      recognition.continuous = false;
      recognition.interimResults = false;

      setIsDictating(true);
      recognition.start();

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setOrderSummaryText(prev => prev ? `${prev} ${transcript}` : transcript);
        setIsDictating(false);
      };

      recognition.onerror = () => setIsDictating(false);
      recognition.onend = () => setIsDictating(false);
    } catch {
      setIsDictating(false);
    }
  };

  return (
    <div className="flex flex-col gap-5 p-4 sm:p-5 pb-28 text-white">
      {/* Toast Notification */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: -16, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.97 }}
            className="sticky top-2 z-40 bg-neutral-900/95 text-white border border-emerald-500/40 px-4 py-2.5 rounded-2xl shadow-2xl backdrop-blur-2xl flex items-center gap-2 text-xs font-medium"
          >
            <CheckCircle2 size={15} className="text-emerald-400" />
            <span>{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Header ── */}
      <div className="flex items-center justify-between">
        <div>
          <span className="text-[11px] font-semibold tracking-wider uppercase text-neutral-500 font-mono">
            {language === 'en' ? 'Case Folders & Diary' : language === 'hi' ? 'केस फोल्डर व डायरी' : 'केस फोल्डर व डायरी'}
          </span>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white mt-0.5 font-display">
            {title}
          </h1>
        </div>

        {/* Case count badge */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-2xl bg-amber-400/10 border border-amber-400/20">
          <Folder size={14} className="text-amber-400" />
          <span className="text-amber-300 text-xs font-bold font-mono">
            {cases.length} {t.cases}
          </span>
        </div>
      </div>

      {/* ── Case Folders List ── */}
      <div className="space-y-3.5">
        {cases.length === 0 ? (
          <div className="p-10 rounded-3xl bg-white/[0.02] border border-white/[0.06] flex flex-col items-center justify-center gap-3 text-center">
            <Folder size={36} className="text-amber-400/40" />
            <p className="font-semibold text-neutral-300 text-sm">{t.noCase}</p>
            <p className="text-[11px] text-neutral-500">{t.noCaseHint}</p>
          </div>
        ) : (
          cases.map(c => {
            const isOpen = expandedId === c.id;

            // Match hearings for this specific case folder
            const caseHearings = hearings.filter(
              h => h.caseNumber.trim().toLowerCase() === c.caseNumber.trim().toLowerCase()
            );

            // Match limitation alerts for this case
            const caseAlerts = limitationAlerts.filter(
              a => a.caseNumber.trim().toLowerCase() === c.caseNumber.trim().toLowerCase()
            );

            // Match documents for this case
            const caseDocs = docItems.filter(
              d => d.caseNumber?.trim().toLowerCase() === c.caseNumber.trim().toLowerCase()
            );
            const verifiedDocsCount = caseDocs.filter(d => d.status === 'Verified').length;
            const docProgressPercent = caseDocs.length > 0 ? Math.round((verifiedDocsCount / caseDocs.length) * 100) : 0;

            return (
              <div
                key={c.id}
                className="glass-card rounded-3xl overflow-hidden border border-white/[0.08] hover:border-amber-400/25 transition-all duration-200"
              >
                {/* ── Folder Header ── */}
                <button
                  type="button"
                  onClick={() => toggle(c.id)}
                  className="w-full flex items-center gap-3 p-4 text-left ios-press group bg-gradient-to-r from-neutral-950 via-neutral-900 to-black"
                >
                  {/* Folder Icon */}
                  <div className={`shrink-0 transition-transform duration-300 ${isOpen ? 'scale-110' : ''}`}>
                    {isOpen ? (
                      <FolderOpen size={24} className="text-amber-400" />
                    ) : (
                      <Folder size={24} className="text-amber-400/80 group-hover:text-amber-400 transition" />
                    )}
                  </div>

                  {/* Case Number & Client */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-bold text-white font-mono tracking-tight group-hover:text-amber-300 transition truncate">
                        {c.caseNumber}
                      </p>
                      <span className={`text-[9.5px] font-semibold px-2 py-0.5 rounded-full border ${statusColor(c.status)} shrink-0`}>
                        {c.status}
                      </span>
                    </div>
                    <p className="text-xs text-neutral-400 font-sans mt-0.5 truncate">
                      {c.clientName} <span className="text-neutral-500 italic text-[11px]">vs.</span> {c.opponentName}
                    </p>
                  </div>

                  {/* Court Location */}
                  <span className="hidden sm:block shrink-0 text-[10px] text-neutral-400 font-mono max-w-[120px] truncate">
                    {c.courtLocation}
                  </span>

                  {/* Chevron Toggle */}
                  <div className="shrink-0 text-neutral-500 group-hover:text-amber-400 transition ml-1">
                    {isOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                  </div>
                </button>

                {/* ── Expanded Folder Contents ── */}
                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div
                      key="folder-content"
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.28, ease: [0.4, 0, 0.2, 1] }}
                      className="overflow-hidden"
                    >
                      <div className="px-4 pb-5 pt-3 border-t border-white/[0.08] space-y-4 bg-black/40">

                        {/* SECTION 1: Case Dossier Overview */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-black/60 rounded-2xl p-3.5 border border-white/[0.06]">
                          {/* Parties */}
                          <div className="flex items-start gap-2">
                            <Scale size={14} className="text-amber-400 shrink-0 mt-0.5" />
                            <div>
                              <span className="text-[9.5px] font-mono uppercase tracking-widest text-neutral-500 block">
                                {t.parties}
                              </span>
                              <span className="text-xs font-semibold text-white">{c.clientName}</span>
                              <span className="text-neutral-500 text-xs mx-1">vs.</span>
                              <span className="text-neutral-300 italic text-xs">{c.opponentName}</span>
                            </div>
                          </div>

                          {/* Court & Bench */}
                          <div className="flex items-start gap-2">
                            <MapPin size={14} className="text-amber-400 shrink-0 mt-0.5" />
                            <div>
                              <span className="text-[9.5px] font-mono uppercase tracking-widest text-neutral-500 block">
                                {t.court}
                              </span>
                              <span className="text-xs text-neutral-200">{c.courtLocation}</span>
                              {c.court && <span className="text-neutral-400 text-xs"> — {c.court}</span>}
                            </div>
                          </div>

                          {/* Applicable Sections */}
                          {c.actSections && c.actSections.length > 0 && (
                            <div className="sm:col-span-2 flex items-start gap-2 pt-1 border-t border-white/[0.04]">
                              <BookMarked size={14} className="text-amber-400 shrink-0 mt-0.5" />
                              <div className="flex-1">
                                <span className="text-[9.5px] font-mono uppercase tracking-widest text-neutral-500 block mb-1">
                                  {t.sections}
                                </span>
                                <div className="flex flex-wrap gap-1.5">
                                  {c.actSections.map((sec, idx) => (
                                    <span
                                      key={idx}
                                      className="text-[10px] px-2.5 py-0.5 rounded-lg bg-neutral-900 text-neutral-200 font-mono border border-white/[0.08]"
                                    >
                                      {sec}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            </div>
                          )}

                          {/* Billing & Stage */}
                          <div className="sm:col-span-2 flex items-center justify-between pt-2 border-t border-white/[0.04] text-xs font-mono">
                            <span className="text-neutral-400">
                              {t.billed}: <strong className="text-white">₹{c.totalBilled?.toLocaleString('en-IN')}</strong>
                            </span>
                            {c.stage && (
                              <span className="text-neutral-400">
                                {t.stage}: <strong className="text-amber-300">{c.stage}</strong>
                              </span>
                            )}
                          </div>
                        </div>

                        {/* SECTION 2: Statutory Limitation Alert for this Case (if any) */}
                        {caseAlerts.length > 0 && (
                          <div className="rounded-2xl p-3.5 bg-rose-950/30 border border-rose-500/30 flex items-start gap-2.5">
                            <AlertCircle size={16} className="text-rose-400 shrink-0 mt-0.5" />
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between">
                                <span className="text-xs font-bold text-rose-300 font-mono">
                                  {caseAlerts[0].statutoryAct}
                                </span>
                                <span className="text-[10px] font-bold font-mono px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/30">
                                  {caseAlerts[0].daysRemaining}d left
                                </span>
                              </div>
                              <p className="text-xs text-neutral-200 mt-1">
                                {language === 'hi' ? caseAlerts[0].titleHi : caseAlerts[0].titleEn}
                              </p>
                              <p className="text-[11px] text-neutral-400 mt-0.5">
                                Deadline: {caseAlerts[0].deadlineDate}
                              </p>
                            </div>
                          </div>
                        )}

                        {/* SECTION 3: Embedded Virtual Case Diary & Hearings Docket */}
                        <div className="space-y-3 pt-1">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <Calendar size={15} className="text-amber-400" />
                              <h4 className="text-xs font-bold uppercase tracking-wider text-amber-200 font-mono">
                                {t.caseDiary} ({caseHearings.length})
                              </h4>
                            </div>

                            {/* + Add Hearing to this Case */}
                            <button
                              type="button"
                              onClick={() => {
                                setAddingForCase(c);
                                setNewPurpose('');
                                setNewHearingDate(new Date().toISOString().split('T')[0]);
                                setNewHearingTime('10:30 AM');
                              }}
                              className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-amber-400/10 hover:bg-amber-400/20 border border-amber-400/30 text-amber-300 text-[11px] font-bold transition ios-press"
                            >
                              <Plus size={12} strokeWidth={2.5} />
                              <span>{t.addHearing}</span>
                            </button>
                          </div>

                          {caseHearings.length === 0 ? (
                            <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/[0.06] text-center text-xs text-neutral-400">
                              <p>{t.noHearings}</p>
                              <button
                                type="button"
                                onClick={() => {
                                  setAddingForCase(c);
                                  setNewPurpose('');
                                }}
                                className="mt-2 text-xs font-semibold text-amber-300 underline underline-offset-2"
                              >
                                {t.addHearing}
                              </button>
                            </div>
                          ) : (
                            <div className="space-y-2.5">
                              {caseHearings.map(hearing => (
                                <div
                                  key={hearing.id}
                                  className="rounded-2xl p-3.5 bg-neutral-950/80 border border-white/[0.08] space-y-2.5 hover:border-amber-400/20 transition"
                                >
                                  {/* Hearing Meta */}
                                  <div className="flex items-start justify-between gap-2">
                                    <div>
                                      <div className="flex items-center gap-1.5">
                                        <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-amber-400/15 text-amber-300 border border-amber-400/25">
                                          ITEM #{hearing.itemNumber}
                                        </span>
                                        <span className="text-[11px] text-neutral-400 font-mono">
                                          {hearing.courtName}
                                        </span>
                                      </div>
                                      <p className="text-xs font-semibold text-white mt-1">
                                        {hearing.hearingDate}
                                      </p>
                                    </div>

                                    <div className="text-right">
                                      <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-white/[0.06] text-neutral-300">
                                        {hearing.stage}
                                      </span>
                                    </div>
                                  </div>

                                  {/* Purpose & Court Room */}
                                  <div className="text-xs text-neutral-300 bg-black/40 rounded-xl p-2.5 border border-white/[0.04]">
                                    <p className="font-medium text-white/90">
                                      {language === 'hi' ? hearing.purposeHi : hearing.purposeEn}
                                    </p>
                                    <div className="flex items-center gap-3 text-[10px] text-neutral-400 font-mono mt-1 pt-1 border-t border-white/[0.04]">
                                      <span>{hearing.courtRoom}</span>
                                      <span>•</span>
                                      <span>{hearing.judgeName}</span>
                                    </div>
                                  </div>

                                  {/* Previous Court Order (if recorded) */}
                                  {hearing.previousOrderSummaryEn && (
                                    <div className="text-[11px] text-emerald-300 bg-emerald-950/20 border border-emerald-500/20 rounded-xl p-2.5">
                                      <span className="text-[9.5px] font-mono uppercase text-emerald-400 block mb-0.5">
                                        Recorded Court Order / Notes:
                                      </span>
                                      <p className="leading-relaxed">{hearing.previousOrderSummaryEn}</p>
                                    </div>
                                  )}

                                  {/* Action: Log Order & Next Date */}
                                  <div className="flex items-center gap-2 pt-1">
                                    <button
                                      type="button"
                                      onClick={() => handleOpenOrderModal(hearing)}
                                      className="flex-1 py-2 rounded-xl bg-white text-black font-bold text-xs flex items-center justify-center gap-1.5 hover:bg-neutral-200 transition ios-press shadow-sm"
                                    >
                                      <Sparkles size={13} />
                                      <span>{t.logOrder}</span>
                                    </button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>

                        {/* SECTION 4: Virtual Case File & Documents Vault */}
                        <div className="space-y-3 pt-3 border-t border-white/[0.08]">
                          <div className="flex items-center justify-between flex-wrap gap-2">
                            <div className="flex items-center gap-2">
                              <FileText size={15} className="text-amber-400" />
                              <span className="text-xs font-bold uppercase tracking-wider text-white font-mono">
                                {language === 'hi' ? 'केस दस्तावेज़ एवं फाइल' : 'Virtual Case File & Documents'}
                              </span>
                              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-white/[0.06] text-neutral-300">
                                {caseDocs.length} {language === 'hi' ? 'दस्तावेज़' : 'files'}
                              </span>
                            </div>

                            <div className="flex items-center gap-2">
                              {caseDocs.length > 0 && (
                                <span className="text-[10px] font-mono text-emerald-400 font-bold">
                                  {verifiedDocsCount}/{caseDocs.length} Verified ({docProgressPercent}%)
                                </span>
                              )}
                              <button
                                type="button"
                                onClick={() => {
                                  const newDoc: DocumentItem = {
                                    id: `doc-${Date.now()}`,
                                    caseNumber: c.caseNumber,
                                    titleEn: 'Vakalatnama & Authorisation Letter',
                                    titleHi: 'वकालतनामा एवं अधिकार पत्र',
                                    requiredFormat: 'Signed & Certified Copy',
                                    status: 'Verified',
                                    uploadedAt: 'Just now',
                                    fileSize: '1.4 MB PDF',
                                  };
                                  setDocItems(prev => [...prev, newDoc]);
                                  setToastMessage(
                                    language === 'hi'
                                      ? 'दस्तावेज़ सफलतापूर्वक केस में जोड़ा गया!'
                                      : 'Document added to Virtual Case File!'
                                  );
                                  setTimeout(() => setToastMessage(null), 3000);
                                }}
                                className="px-2 py-0.5 rounded-full bg-white/10 hover:bg-white/20 text-[10px] font-bold text-amber-300 border border-amber-300/30 transition ios-press"
                              >
                                + {language === 'hi' ? 'दस्तावेज़ जोड़ें' : 'Attach File'}
                              </button>
                            </div>
                          </div>

                          {/* Progress Bar */}
                          {caseDocs.length > 0 && (
                            <div className="w-full h-1 bg-white/[0.08] rounded-full overflow-hidden">
                              <div
                                className="h-full bg-emerald-400 transition-all duration-500 rounded-full"
                                style={{ width: `${docProgressPercent}%` }}
                              />
                            </div>
                          )}

                          {/* Documents List */}
                          {caseDocs.length > 0 ? (
                            <div className="space-y-2">
                              {caseDocs.map(doc => (
                                <div
                                  key={doc.id}
                                  className={`p-3 rounded-2xl border transition flex flex-col gap-2 ${
                                    doc.status === 'Format_Issue'
                                      ? 'bg-rose-950/20 border-rose-500/30'
                                      : 'bg-neutral-900/80 border-white/[0.08]'
                                  }`}
                                >
                                  <div className="flex items-start justify-between gap-2">
                                    <div className="min-w-0">
                                      <h5 className="text-xs font-bold text-white tracking-tight">
                                        {language === 'hi' ? doc.titleHi : doc.titleEn}
                                      </h5>
                                      <p className="text-[10px] text-neutral-400 mt-0.5">
                                        Required: <span className="text-neutral-200 font-medium">{doc.requiredFormat}</span>
                                        {doc.fileSize && (
                                          <span className="ml-2 text-neutral-500 font-mono">• {doc.fileSize}</span>
                                        )}
                                      </p>
                                    </div>

                                    <span
                                      className={`text-[10px] font-semibold px-2 py-0.5 rounded-full shrink-0 ${
                                        doc.status === 'Verified'
                                          ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/20'
                                          : doc.status === 'Format_Issue'
                                          ? 'bg-rose-500/15 text-rose-300 border border-rose-500/20'
                                          : 'bg-amber-500/15 text-amber-300 border border-amber-500/20'
                                      }`}
                                    >
                                      {doc.status}
                                    </span>
                                  </div>

                                  <div className="flex items-center gap-2 pt-1 border-t border-white/[0.04]">
                                    <button
                                      type="button"
                                      onClick={() => setPreviewDoc(doc)}
                                      className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/[0.06] hover:bg-white/[0.12] text-[11px] font-medium text-white transition ios-press"
                                    >
                                      <Eye size={12} />
                                      <span>{language === 'hi' ? 'पूर्वावलोकन' : 'Preview File'}</span>
                                    </button>

                                    {doc.status !== 'Verified' && (
                                      <button
                                        type="button"
                                        onClick={() => {
                                          setUploadingDocId(doc.id);
                                          setTimeout(() => {
                                            setDocItems(prev =>
                                              prev.map(d =>
                                                d.id === doc.id
                                                  ? {
                                                      ...d,
                                                      status: 'Verified',
                                                      uploadedAt: 'Just now',
                                                      fileSize: '2.4 MB PDF',
                                                    }
                                                  : d
                                              )
                                            );
                                            setUploadingDocId(null);
                                            onUploadDocument?.(doc.id);
                                            setToastMessage('Document verified successfully!');
                                            setTimeout(() => setToastMessage(null), 3000);
                                          }, 600);
                                        }}
                                        disabled={uploadingDocId === doc.id}
                                        className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/25 text-[11px] font-medium text-emerald-400 border border-emerald-500/30 transition ios-press"
                                      >
                                        <UploadCloud size={12} />
                                        <span>
                                          {uploadingDocId === doc.id
                                            ? (language === 'hi' ? 'सत्यापित हो रहा है...' : 'Verifying...')
                                            : (language === 'hi' ? 'सत्यापित चिह्नित करें' : 'Verify & Sign')}
                                        </span>
                                      </button>
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className="p-3.5 rounded-2xl bg-white/[0.02] border border-white/[0.06] text-center text-xs text-neutral-400">
                              <p className="text-[11px] text-neutral-400">
                                {language === 'hi'
                                  ? 'इस केस में अभी कोई दस्तावेज़ संलग्न नहीं है।'
                                  : 'No documents attached to this case dossier yet.'}
                              </p>
                              <button
                                type="button"
                                onClick={() => {
                                  const newDoc: DocumentItem = {
                                    id: `doc-${Date.now()}`,
                                    caseNumber: c.caseNumber,
                                    titleEn: 'Vakalatnama & Memo of Parties',
                                    titleHi: 'वकालतनामा एवं पक्षकारों का मेमो',
                                    requiredFormat: 'Signed & Certified Copy',
                                    status: 'Verified',
                                    uploadedAt: 'Just now',
                                    fileSize: '1.8 MB PDF',
                                  };
                                  setDocItems(prev => [...prev, newDoc]);
                                  setToastMessage('Vakalatnama attached to case file!');
                                  setTimeout(() => setToastMessage(null), 3000);
                                }}
                                className="mt-2 inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-semibold text-white border border-white/10 transition ios-press"
                              >
                                <Plus size={13} />
                                <span>{language === 'hi' ? 'वकालतनामा जोड़ें' : 'Attach Vakalatnama'}</span>
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })
        )}
      </div>

      {/* ── MODAL: Log Court Order & Next Hearing Date ── */}
      <AnimatePresence>
        {activeModalHearing && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="glass-card rounded-3xl p-5 border border-white/[0.14] bg-neutral-950 w-full max-w-sm space-y-4 shadow-2xl"
            >
              <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
                <div>
                  <h3 className="text-sm font-bold text-white font-display">
                    {language === 'hi' ? 'अदालत आदेश व अगली तारीख' : 'Record Court Order & Next Date'}
                  </h3>
                  <p className="text-[11px] text-amber-300 font-mono mt-0.5">
                    {activeModalHearing.caseNumber}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveModalHearing(null)}
                  className="w-7 h-7 rounded-full bg-white/[0.06] hover:bg-white/[0.12] flex items-center justify-center text-neutral-400 hover:text-white"
                >
                  ✕
                </button>
              </div>

              {/* Order Notes with Voice Dictation */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-neutral-300">
                    {language === 'hi' ? 'आदेश का संक्षिप्त विवरण' : 'Court Order Summary / Directions'}
                  </label>
                  <button
                    type="button"
                    onClick={toggleDictation}
                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium transition ${
                      isDictating
                        ? 'bg-rose-500 text-white animate-pulse'
                        : 'bg-white/[0.08] text-neutral-300 hover:text-white border border-white/[0.1]'
                    }`}
                  >
                    {isDictating ? <MicOff size={11} /> : <Mic size={11} />}
                    <span>{isDictating ? 'Listening...' : 'Voice Dictate'}</span>
                  </button>
                </div>
                <textarea
                  rows={3}
                  value={orderSummaryText}
                  onChange={e => setOrderSummaryText(e.target.value)}
                  placeholder={
                    language === 'hi'
                      ? 'अदालत द्वारा पारित आदेश या निर्देश दर्ज करें...'
                      : 'Enter order passed by Hon’ble Court (e.g. Notice issued, WS directed to be filed in 4 weeks)...'
                  }
                  className="w-full bg-black/60 border border-white/[0.1] rounded-2xl p-3 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-amber-400/50"
                />
              </div>

              {/* Next Hearing Date */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-neutral-300">
                  {language === 'hi' ? 'अगली सुनवाई की तारीख' : 'Next Hearing Date'}
                </label>
                <input
                  type="date"
                  value={nextDateInput}
                  onChange={e => setNextDateInput(e.target.value)}
                  className="w-full bg-black/60 border border-white/[0.1] rounded-2xl p-3 text-xs text-white focus:outline-none focus:border-amber-400/50 [color-scheme:dark]"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setActiveModalHearing(null)}
                  className="flex-1 py-2.5 rounded-2xl bg-white/[0.08] hover:bg-white/[0.14] text-neutral-300 text-xs font-semibold transition"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSaveOrder}
                  className="flex-1 py-2.5 rounded-2xl bg-white text-black font-bold text-xs hover:bg-neutral-200 transition ios-press shadow-md"
                >
                  Save & Sync
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── MODAL: Add Hearing to Case Folder ── */}
      <AnimatePresence>
        {addingForCase && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="glass-card rounded-3xl p-5 border border-white/[0.14] bg-neutral-950 w-full max-w-sm space-y-4 shadow-2xl"
            >
              <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
                <div>
                  <h3 className="text-sm font-bold text-white font-display">
                    {language === 'hi' ? 'केस में नई सुनवाई जोड़ें' : 'Schedule Hearing for Case'}
                  </h3>
                  <p className="text-[11px] text-amber-300 font-mono mt-0.5">
                    {addingForCase.caseNumber} • {addingForCase.clientName}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setAddingForCase(null)}
                  className="w-7 h-7 rounded-full bg-white/[0.06] hover:bg-white/[0.12] flex items-center justify-center text-neutral-400 hover:text-white"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleCreateHearingForCase} className="space-y-3">
                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-neutral-300">
                    {language === 'hi' ? 'सुनवाई की तारीख' : 'Hearing Date'}
                  </label>
                  <input
                    type="date"
                    required
                    value={newHearingDate}
                    onChange={e => setNewHearingDate(e.target.value)}
                    className="w-full bg-black/60 border border-white/[0.1] rounded-2xl p-2.5 text-xs text-white focus:outline-none focus:border-amber-400/50 [color-scheme:dark]"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-neutral-300">
                      {language === 'hi' ? 'समय' : 'Time'}
                    </label>
                    <input
                      type="text"
                      value={newHearingTime}
                      onChange={e => setNewHearingTime(e.target.value)}
                      placeholder="10:30 AM"
                      className="w-full bg-black/60 border border-white/[0.1] rounded-2xl p-2.5 text-xs text-white focus:outline-none focus:border-amber-400/50"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-neutral-300">
                      {language === 'hi' ? 'अदालत कक्ष' : 'Court Room'}
                    </label>
                    <input
                      type="text"
                      value={newCourtRoom}
                      onChange={e => setNewCourtRoom(e.target.value)}
                      placeholder="Court No. 04"
                      className="w-full bg-black/60 border border-white/[0.1] rounded-2xl p-2.5 text-xs text-white focus:outline-none focus:border-amber-400/50"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-neutral-300">
                    {language === 'hi' ? 'कार्यवाही का उद्देश्य' : 'Purpose of Hearing'}
                  </label>
                  <input
                    type="text"
                    value={newPurpose}
                    onChange={e => setNewPurpose(e.target.value)}
                    placeholder="e.g. Final Arguments, Cross Examination"
                    className="w-full bg-black/60 border border-white/[0.1] rounded-2xl p-2.5 text-xs text-white focus:outline-none focus:border-amber-400/50"
                  />
                </div>

                <div className="flex items-center gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setAddingForCase(null)}
                    className="flex-1 py-2.5 rounded-2xl bg-white/[0.08] hover:bg-white/[0.14] text-neutral-300 text-xs font-semibold transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-2.5 rounded-2xl bg-white text-black font-bold text-xs hover:bg-neutral-200 transition ios-press shadow-md"
                  >
                    Add to Diary
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── MODAL: Document Preview & Verification ── */}
      <AnimatePresence>
        {previewDoc && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="glass-card rounded-3xl p-5 border border-white/[0.14] bg-neutral-950 w-full max-w-md space-y-4 shadow-2xl"
            >
              <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-amber-500/15 border border-amber-500/25 flex items-center justify-center text-amber-400">
                    <FileText size={16} />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white font-display truncate max-w-[220px]">
                      {language === 'hi' ? previewDoc.titleHi : previewDoc.titleEn}
                    </h3>
                    <p className="text-[11px] text-amber-300 font-mono mt-0.5">
                      {previewDoc.caseNumber}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setPreviewDoc(null)}
                  className="w-7 h-7 rounded-full bg-white/[0.06] hover:bg-white/[0.12] flex items-center justify-center text-neutral-400 hover:text-white"
                >
                  <X size={14} />
                </button>
              </div>

              {/* Document Metadata Details */}
              <div className="p-3 rounded-2xl bg-white/[0.03] border border-white/[0.06] space-y-2 text-xs">
                <div className="flex justify-between items-center">
                  <span className="text-neutral-400">Required Type:</span>
                  <span className="font-semibold text-neutral-200">{previewDoc.requiredFormat}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-neutral-400">Verification Status:</span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 font-bold">
                    {previewDoc.status}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-neutral-400">File Specification:</span>
                  <span className="font-mono text-neutral-300">{previewDoc.fileSize || '2.4 MB PDF'}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-neutral-400">Uploaded Date:</span>
                  <span className="text-neutral-300">{previewDoc.uploadedAt || 'Official Case Record'}</span>
                </div>
              </div>

              {/* Simulated Certified Document Viewer Preview */}
              <div className="h-44 rounded-2xl bg-neutral-900 border border-white/[0.1] flex flex-col items-center justify-center p-4 text-center relative overflow-hidden">
                <div className="absolute inset-0 flex items-center justify-center rotate-[-25deg] pointer-events-none select-none opacity-10 text-white font-mono text-xl font-bold">
                  CONFIDENTIAL LEGAL DOCKET • NYAAY
                </div>
                <FileText size={32} className="text-amber-400 mb-2 relative z-10" />
                <p className="text-xs font-semibold text-white relative z-10">
                  {language === 'hi' ? previewDoc.titleHi : previewDoc.titleEn}
                </p>
                <p className="text-[10px] text-neutral-400 font-mono mt-1 relative z-10">
                  Certified Court Copy Attached • Section 63 BSA Ready
                </p>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => {
                    alert('Simulated download: Certified PDF copy downloaded to your device.');
                  }}
                  className="flex-1 py-2.5 rounded-2xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold transition ios-press"
                >
                  Download PDF
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewDoc(null)}
                  className="flex-1 py-2.5 rounded-2xl bg-white text-black font-bold text-xs hover:bg-neutral-200 transition ios-press shadow-md"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
