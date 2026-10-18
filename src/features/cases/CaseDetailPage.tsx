import React, { useState, useMemo, useEffect } from 'react';
import { Card } from '../../design/ui/Card';
import { Button } from '../../design/ui/Button';
import { Segmented } from '../../design/ui/Segmented';
import { StatusBadge } from '../../design/ui/StatusBadge';
import { Sheet } from '../../design/ui/Sheet';
import { HearingCard } from '../hearings/HearingCard';
import { LogOrderSheet, LogOrderData } from '../hearings/LogOrderSheet';
import { HearingFormSheet } from '../hearings/HearingFormSheet';
import { CaseFile, HearingItem, InvoiceItem, DocumentItem, Language } from '../../types';
import { getStagesForMatter, matchStageIndex } from '../../config/stages';
import { normaliseCaseNumber } from '../../lib/caseNumber';
import { PREDEFINED_FEE_DESCRIPTIONS } from '../../config/courtsData';
import { getISTDateString, getISTTimeString, getCaseNextHearing } from '../../lib/istDate';
import {
  ArrowLeft,
  Calendar,
  MapPin,
  Scale,
  FileText,
  IndianRupee,
  MessageSquare,
  Plus,
  Gavel,
  CheckCircle2,
  Clock,
  Share2,
  AlertTriangle,
  UploadCloud,
  FileCheck,
  Edit3,
  Trash2,
  Sparkles,
  Landmark,
  ExternalLink,
  Users,
  HelpCircle,
  ChevronRight,
  Info,
  BookOpen,
} from 'lucide-react';
import { NewCaseSheet } from './NewCaseSheet';
import { LegalTemplatesModal } from '../templates/LegalTemplatesModal';

interface CaseDetailPageProps {
  caseFile: CaseFile;
  hearings: HearingItem[];
  invoices?: InvoiceItem[];
  documents?: DocumentItem[];
  language?: Language;
  onBack: () => void;
  onMessageClient: (caseNumber: string, clientName: string) => void;
  onUpdateHearingOrder?: (hearingId: string, orderNotes: string, nextDate: string) => void;
  onAddHearing?: (hearing: Omit<HearingItem, 'id'>) => void;
  onSendHearingChatUpdate?: (params: any) => void;
  onNewInvoice?: (caseNumber: string) => void;
  onCreateInvoice?: (invoice: Omit<InvoiceItem, 'id'>) => void;
  onToggleInvoiceStatus?: (invoiceId: string) => void;
  onUploadDocument?: (caseNumber: string, file: File) => void;
  onSaveNotes?: (caseNumber: string, notes: string) => Promise<void> | void;
  onUpdateCaseStatus?: (caseNumber: string, status: 'Active' | 'Closed', priority?: 'Normal' | 'Urgent') => Promise<void> | void;
  onUpdateCaseDetails?: (caseNumber: string, updated: Partial<CaseFile>) => Promise<void> | void;
  onAskAI?: (caseNumber?: string) => void;
}

export const CaseDetailPage: React.FC<CaseDetailPageProps> = ({
  caseFile,
  hearings,
  invoices = [],
  documents = [],
  language = 'en',
  onBack,
  onMessageClient,
  onUpdateHearingOrder,
  onAddHearing,
  onSendHearingChatUpdate,
  onNewInvoice,
  onCreateInvoice,
  onToggleInvoiceStatus,
  onUploadDocument,
  onSaveNotes,
  onUpdateCaseStatus,
  onUpdateCaseDetails,
  onAskAI,
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'hearings' | 'documents' | 'fees' | 'notes'>('overview');
  const [activeLogOrderHearing, setActiveLogOrderHearing] = useState<HearingItem | null>(null);
  const [showAddHearing, setShowAddHearing] = useState(false);
  const [showEditCase, setShowEditCase] = useState(false);
  const [editingHearing, setEditingHearing] = useState<HearingItem | null>(null);
  const [caseNotes, setCaseNotes] = useState('');
  const [savedNotesList, setSavedNotesList] = useState<{ id: string; text: string; createdAt: string }[]>([]);
  const [notesSaving, setNotesSaving] = useState(false);
  const [notesSavedSuccess, setNotesSavedSuccess] = useState(false);
  const [showStageInfoModal, setShowStageInfoModal] = useState(false);
  const [showUpdateStageModal, setShowUpdateStageModal] = useState(false);
  const [updatingStage, setUpdatingStage] = useState(false);
  const [showTemplatesModal, setShowTemplatesModal] = useState(false);

  // Sync notes when case changes (supporting both JSON array and legacy text)
  useEffect(() => {
    const raw = caseFile.notes || caseFile.privateNotes || '';
    if (!raw.trim()) {
      setSavedNotesList([]);
      setCaseNotes('');
      return;
    }
    try {
      if (raw.trim().startsWith('[')) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0 && parsed[0].text) {
          setSavedNotesList(parsed);
          setCaseNotes('');
          return;
        }
      }
    } catch {}
    setSavedNotesList([
      {
        id: 'note-init',
        text: raw,
        createdAt: caseFile.filingDate ? `${caseFile.filingDate}` : 'Initial Note',
      },
    ]);
    setCaseNotes('');
  }, [caseFile.notes, caseFile.privateNotes, caseFile.filingDate]);

  const handleUpdateCaseDetails = async (cNum: string, updated: Partial<CaseFile>) => {
    if (onUpdateCaseDetails) {
      await onUpdateCaseDetails(cNum, updated);
    }
  };

  const handleSaveNotes = async () => {
    const trimmed = caseNotes.trim();
    if (!trimmed) return;
    setNotesSaving(true);
    try {
      const nowStamp = `${getISTDateString()} ${getISTTimeString()}`;
      const newEntry = {
        id: `note-${Date.now()}`,
        text: trimmed,
        createdAt: nowStamp,
      };
      const updatedList = [newEntry, ...savedNotesList];
      setSavedNotesList(updatedList);
      setCaseNotes('');
      if (onSaveNotes) {
        await onSaveNotes(caseFile.caseNumber, JSON.stringify(updatedList));
      }
      setNotesSavedSuccess(true);
      setTimeout(() => setNotesSavedSuccess(false), 3000);
    } finally {
      setNotesSaving(false);
    }
  };

  const handleDeleteNote = async (noteId: string) => {
    const updatedList = savedNotesList.filter(n => n.id !== noteId);
    setSavedNotesList(updatedList);
    if (onSaveNotes) {
      await onSaveNotes(caseFile.caseNumber, JSON.stringify(updatedList));
    }
  };

  // Case-Specific New Invoice Modal State
  const [showCaseNewInvoice, setShowCaseNewInvoice] = useState(false);
  const [invoiceAmount, setInvoiceAmount] = useState('');
  const [invoiceStatus, setInvoiceStatus] = useState<'Pending' | 'Paid'>('Pending');
  const [invoiceDueDate, setInvoiceDueDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 7);
    return getISTDateString(d);
  });
  const [invoiceDescription, setInvoiceDescription] = useState('Professional Fee for Court Appearance & Drafting');

  const handleCreateCaseInvoice = () => {
    const numAmt = parseFloat(invoiceAmount);
    if (!numAmt || numAmt <= 0) return;

    if (onCreateInvoice) {
      onCreateInvoice({
        invoiceNumber: `INV-${Date.now().toString().slice(-4)}`,
        caseNumber: caseFile.caseNumber,
        clientName: caseFile.clientName,
        caseId: caseFile.id,
        totalAmount: numAmt,
        appearanceFee: numAmt,
        draftingFee: 0,
        clerkageAndMisc: 0,
        status: invoiceStatus,
        date: invoiceDueDate,
      });
    }

    setShowCaseNewInvoice(false);
    setInvoiceAmount('');
    setInvoiceStatus('Pending');
  };

  const t = (en: string, hi: string, mr?: string) => {
    if (language === 'mr') return mr || hi || en;
    if (language === 'hi') return hi;
    return en;
  };

  const normalisedCase = normaliseCaseNumber(caseFile.caseNumber);

  // Filter hearings for this case
  const caseHearings = hearings.filter(
    h => normaliseCaseNumber(h.caseNumber) === normalisedCase
  );

  // Single source of truth for Next Hearing Date from hearings and caseFile (Items 3, 15, 18)
  const nextHearingInfo = useMemo(() => {
    return getCaseNextHearing(caseFile, hearings);
  }, [caseFile, hearings]);

  // Filter and auto-populate relevant legal sections (Item 9)
  const cleanedActSections = useMemo(() => {
    const rawList = caseFile.actSections || [];
    const filtered = rawList.filter(
      s => s && s.trim() && !s.toLowerCase().includes('relevant legal section')
    );
    if (filtered.length > 0) return filtered;
    const isNiAct = /138|cheque|dishonou?r|negotiable/i.test(
      `${caseFile.caseType || ''} ${caseFile.caseNumber || ''} ${caseFile.stage || ''}`
    );
    if (isNiAct) {
      return ['Section 138, NI Act (Cheque Dishonour)', 'Section 142, NI Act (Cognizance of Offence)'];
    }
    return [];
  }, [caseFile.actSections, caseFile.caseType, caseFile.caseNumber, caseFile.stage]);

  // Invoices for this case
  const caseInvoices = invoices.filter(
    inv => (inv.caseNumber && normaliseCaseNumber(inv.caseNumber) === normalisedCase) || (inv.caseId && inv.caseId === caseFile.id)
  );

  // Real fee metrics derived strictly from case invoices
  const caseTotalInvoiced = useMemo(() => {
    return caseInvoices.reduce((sum, inv) => sum + (inv.totalAmount || 0), 0);
  }, [caseInvoices]);

  const caseTotalPaid = useMemo(() => {
    return caseInvoices
      .filter(i => i.status === 'Paid')
      .reduce((sum, inv) => sum + (inv.totalAmount || 0), 0);
  }, [caseInvoices]);

  const caseOutstanding = Math.max(0, caseTotalInvoiced - caseTotalPaid);

  // Documents for this case (O4 & F13)
  const caseDocs = documents.filter(
    d => d.caseNumber && normaliseCaseNumber(d.caseNumber) === normalisedCase
  );
  const pendingDocsCount = caseDocs.filter(
    d => (d.status || '').toLowerCase() !== 'verified'
  ).length;
  const verifiedDocsCount = caseDocs.filter(
    d => (d.status || '').toLowerCase() === 'verified'
  ).length;

  // Matter stages from config - show all without slicing (O5-1)
  const stages = getStagesForMatter(caseFile.caseType || caseFile.actSections?.join(', '));
  const safeStageIdx = matchStageIndex(stages, caseFile.stage);

  const handleSelectStage = async (stageName: string) => {
    setUpdatingStage(true);
    try {
      if (onUpdateCaseDetails) {
        await onUpdateCaseDetails(caseFile.caseNumber, { stage: stageName as any });
      }
      setShowUpdateStageModal(false);
    } finally {
      setUpdatingStage(false);
    }
  };

  const handleSaveOrder = (data: LogOrderData) => {
    if (activeLogOrderHearing && onUpdateHearingOrder) {
      onUpdateHearingOrder(activeLogOrderHearing.id, data.orderNotes, data.nextDate);
    }
    if (onAddHearing && activeLogOrderHearing) {
      onAddHearing({
        caseNumber: data.caseNumber,
        clientName: activeLogOrderHearing.clientName,
        courtName: activeLogOrderHearing.courtName,
        courtRoom: activeLogOrderHearing.courtRoom,
        hearingDate: `${data.nextDate}`,
        hearingTime: data.nextDate.includes(',') ? data.nextDate.split(',')[1]?.trim() : undefined,
        itemNumber: activeLogOrderHearing.itemNumber,
        judgeName: activeLogOrderHearing.judgeName,
        stage: data.nextStage as any,
        purposeEn: data.nextStage,
        purposeHi: data.nextStage,
        previousOrderSummaryEn: data.orderNotes,
      });
    }
    if (data.notifyClient && onSendHearingChatUpdate) {
      onSendHearingChatUpdate({
        caseNumber: data.caseNumber,
        clientName: caseFile.clientName,
        court: `${caseFile.courtLocation || 'Court'}, ${caseFile.court || ''}`,
        status: data.outcome,
        nextDate: data.nextDate,
        stage: data.nextStage,
        orderNotes: data.orderNotes || '',
      });
    }
  };

  const handleAnalyzeThisCase = () => {
    const isNiAct = /138|cheque|dishonou?r|negotiable/i.test(
      `${caseFile.caseType || ''} ${caseFile.caseNumber || ''} ${caseFile.stage || ''}`
    );
    const parties = isNiAct
      ? `${caseFile.clientName} (Complainant) vs ${caseFile.opponentName || 'Accused'}`
      : `${caseFile.clientName} (Petitioner/Plaintiff) vs ${caseFile.opponentName || 'Respondent/Defendant'}`;

    const sectionsText = cleanedActSections.length > 0
      ? cleanedActSections.join(', ')
      : (caseFile.actSections?.join(', ') || 'Applicable statutory provisions');

    const hearingsSummary = caseHearings.length > 0
      ? caseHearings.map(h => `• ${h.hearingDate}: Stage '${h.stage || h.purposeEn || 'Hearing'}', Purpose '${h.purposeEn || h.purposeHi || 'General'}', Order Notes: '${h.previousOrderSummaryEn || 'None'}'`).join('\n')
      : 'No hearings scheduled yet.';

    const docsSummary = caseDocs.length > 0
      ? caseDocs.map(d => `• ${d.title} (${d.status || 'Pending inspection'})`).join('\n')
      : 'No documents filed.';

    const feesSummary = `Total Billed: ₹${caseTotalInvoiced.toLocaleString('en-IN')}, Paid: ₹${caseTotalPaid.toLocaleString('en-IN')}, Outstanding: ₹${caseOutstanding.toLocaleString('en-IN')}`;

    const prompt = `Analyze this case in depth:
Dossier: ${caseFile.caseNumber} (${caseFile.caseType || 'Matter'})
Parties: ${parties}
Court: ${caseFile.court || 'Court'} - ${caseFile.courtLocation || 'Chambers'}
Current Stage: ${caseFile.stage || 'Initial'}, Status: ${caseFile.status || 'Active'}, Priority: ${caseFile.priority || 'Normal'}
Relevant Sections: ${sectionsText}

Hearings Timeline:
${hearingsSummary}

Case Documents:
${docsSummary}

Fee & Retainer Status:
${feesSummary}

Advocate's Internal Notes:
${caseNotes || (savedNotesList.map(n => n.text).join('; ')) || 'None recorded.'}

Provide an exhaustive advocate strategic memorandum covering:
1. Legal Strategy & Merits of the Case
2. Critical Procedural Steps for the Current Stage (${caseFile.stage || 'Active'})
3. Evidentiary Requirements & Documents to Summon
4. Limitation Risks & Jurisdictional Defenses
5. Recommended Action Items for Advocate & Client Counsel`;

    if (onAskAI) {
      onAskAI(prompt);
    }
  };

  return (
    <div className="flex flex-col gap-4 p-4 sm:p-6 pb-36 text-main max-w-4xl mx-auto w-full">
      {/* ── Top Bar ── */}
      <div className="flex items-center justify-between gap-3 pt-1">
        <button
          type="button"
          onClick={onBack}
          className="flex items-center gap-1.5 text-xs font-semibold text-neutral-400 hover:text-main transition ios-press"
        >
          <ArrowLeft size={16} />
          <span>{t('All Cases', 'सभी मामले', 'सर्व खटले')}</span>
        </button>

        <div className="flex items-center gap-2">
          {onAskAI && (
            <button
              type="button"
              onClick={handleAnalyzeThisCase}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-black font-bold text-xs shadow-md transition ios-press"
              title={t('Summarize Case with AI', 'AI केस सारांश', 'AI केस सारांश')}
            >
              <Sparkles size={13} className="text-black animate-pulse" />
              <span>{t('Summarize Case', 'केस सारांश', 'केस सारांश')}</span>
            </button>
          )}
          <Button
            variant="secondary"
            size="sm"
            icon={<MessageSquare size={13} />}
            onClick={() => onMessageClient(caseFile.caseNumber, caseFile.clientName)}
          >
            {t('Message Client', 'मुवक्किल से चैट', 'अशील चॅट')}
          </Button>
        </div>
      </div>

      {/* ── Case Header Dossier Card ── */}
      <Card className="border-amber-400/25 bg-gradient-to-b from-white/[0.06] to-white/[0.02] p-4 sm:p-5 shadow-xl">
        <div className="flex flex-col gap-3.5">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-mono font-bold px-2.5 py-0.5 rounded-full bg-amber-400/15 border border-amber-400/30 text-amber-300">
                  {caseFile.caseType || t('Matter Dossier', 'केस फ़ाइल', 'खटला संचिका')}
                </span>
                <StatusBadge status={caseFile.status || 'Active'} />
                {caseFile.priority === 'Urgent' && (
                  <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-rose-500/20 border border-rose-500/40 text-rose-300">
                    🚨 {t('Urgent', 'अति-आवश्यक', 'तातडीचे')}
                  </span>
                )}
              </div>
              <h1 className="text-lg sm:text-2xl font-bold font-mono text-main mt-2 tracking-tight">
                {caseFile.caseNumber}
              </h1>
              {caseFile.cnrNumber && (
                <div className="mt-1 flex items-center gap-2 flex-wrap">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg bg-sky-500/10 border border-sky-500/25 text-[11px] text-sky-300 font-mono font-semibold">
                    <Landmark size={12} className="text-sky-400" />
                    <span>CNR: {caseFile.cnrNumber}</span>
                  </span>
                  <a
                    href={
                      caseFile.cnrNumber.startsWith('SC')
                        ? 'https://main.sci.gov.in/case-status'
                        : caseFile.cnrNumber.substring(0, 4).endsWith('HC') || ['MHBJ', 'MHNG', 'MHAU', 'KADH', 'UPLK', 'TNMD'].includes(caseFile.cnrNumber.substring(0, 4))
                        ? `https://hcservices.ecourts.gov.in/hcservices/main.php?cnr_no=${caseFile.cnrNumber}`
                        : `https://services.ecourts.gov.in/ecourtindia_v6/?p=casestatus/index&cnr_no=${caseFile.cnrNumber}`
                    }
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-[11px] text-sky-400 hover:text-sky-300 underline font-medium"
                  >
                    <span>eCourts CIS Portal</span>
                    <ExternalLink size={11} />
                  </a>
                </div>
              )}
              <p className="text-sm font-semibold text-sub mt-1">
                {(() => {
                  const isNiAct = /138|cheque|dishonou?r|negotiable/i.test(
                    `${caseFile.caseType || ''} ${caseFile.caseNumber || ''}`
                  );
                  if (isNiAct) {
                    const opp = caseFile.opponentName && caseFile.opponentName !== 'State / Respondent' ? caseFile.opponentName : 'Accused';
                    return `${caseFile.clientName} (Complainant) vs. ${opp}`;
                  }
                  return `${caseFile.clientName} ${caseFile.opponentName ? `vs. ${caseFile.opponentName}` : ''}`;
                })()}
              </p>
            </div>

            <div className="flex items-center gap-2 shrink-0 flex-wrap sm:flex-nowrap pt-1 sm:pt-0">
              <button
                type="button"
                onClick={() => setShowTemplatesModal(true)}
                className="text-xs font-semibold px-3 py-1.5 rounded-xl border bg-white/[0.04] border-white/10 text-neutral-200 hover:text-white hover:border-white/20 flex items-center gap-1.5 transition ios-press"
                title="Legal Drafting Templates"
              >
                <BookOpen size={13} className="text-amber-400" />
                <span>{t('Legal Templates', 'ड्राफ्ट टेम्प्लेट', 'मसुदा टेम्पलेट्स')}</span>
              </button>

              <button
                type="button"
                onClick={() => setShowEditCase(true)}
                className="text-xs font-semibold px-3 py-1.5 rounded-xl border bg-white/[0.04] border-white/10 text-neutral-300 hover:text-white hover:border-white/20 flex items-center gap-1.5 transition ios-press"
                title="Edit Case Details"
              >
                <Edit3 size={13} />
                <span>{t('Edit Case Details', 'केस विवरण संपादित करें', 'केस तपशील संपादित करा')}</span>
              </button>

              {onUpdateCaseStatus && (
                <button
                  type="button"
                  onClick={() => onUpdateCaseStatus(
                    caseFile.caseNumber,
                    (caseFile.status?.toLowerCase() === 'closed' ? 'Active' : 'Closed'),
                    caseFile.priority || 'Normal'
                  )}
                  className={`text-xs font-semibold px-3 py-1.5 rounded-xl border transition ios-press ${
                    caseFile.status?.toLowerCase() === 'closed'
                      ? 'bg-emerald-500/20 border-emerald-400/50 text-emerald-300 hover:bg-emerald-500/30'
                      : 'bg-white/[0.04] border-white/10 text-neutral-400 hover:text-white hover:border-white/20'
                  }`}
                >
                  {caseFile.status?.toLowerCase() === 'closed'
                    ? t('Re-open Case', 'केस पुनः खोलें', 'केस पुन्हा उघडा')
                    : t('Close Case', 'केस बंद करें', 'केस बंद करा')}
                </button>
              )}
            </div>
          </div>

          {/* 3 Balanced Metadata Capsules — Smoothly Slideable & Scrollable without text clipping */}
          <div className="flex sm:grid sm:grid-cols-3 gap-2.5 pt-3 border-t border-white/[0.08] text-xs overflow-x-auto no-scrollbar pb-1">
            <div className="min-w-[220px] sm:min-w-0 shrink-0 flex items-center gap-2 p-2.5 rounded-xl bg-white/[0.03] border border-white/[0.06] text-sub">
              <MapPin size={15} className="text-amber-500 dark:text-amber-400 shrink-0" />
              <span className="truncate">{caseFile.courtLocation || caseFile.court || t('Court', 'अदालत', 'न्यायालय')}</span>
            </div>
            <div className="min-w-[260px] sm:min-w-0 shrink-0 flex items-center gap-2 p-2.5 rounded-xl bg-white/[0.03] border border-white/[0.06] text-sub">
              <Calendar size={15} className="text-amber-500 dark:text-amber-400 shrink-0" />
              <div className="min-w-0 flex items-center gap-1.5 flex-nowrap overflow-x-auto no-scrollbar">
                <span className="text-neutral-400 font-medium shrink-0">
                  {t('Next Hearing', 'अगली सुनवाई', 'पुढील सुनावणी')}:
                </span>
                {(() => {
                  const scheduledNextHearingDate = nextHearingInfo.formattedDateTime || nextHearingInfo.rawDate || caseFile.nextHearingDate || t('TBD', 'निर्धारित नहीं', 'ठरवायचे आहे');
                  return (
                    <strong className="text-amber-800 dark:text-amber-300 font-bold font-mono whitespace-nowrap">
                      {scheduledNextHearingDate}
                    </strong>
                  );
                })()}
                {nextHearingInfo.countdown && (
                  <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-amber-500/20 text-amber-800 dark:text-amber-300 border border-amber-500/30 whitespace-nowrap shrink-0">
                    ⏳ {nextHearingInfo.countdown.label}
                  </span>
                )}
              </div>
            </div>
            <div className="min-w-[200px] sm:min-w-0 shrink-0 flex items-center gap-2 p-2.5 rounded-xl bg-white/[0.03] border border-white/[0.06] text-sub">
              <Scale size={15} className="text-amber-500 dark:text-amber-400 shrink-0" />
              <span className="truncate">{caseFile.stage || t('Hearing Scheduled', 'सुनवाई निर्धारित', 'सुनावणी नियोजित')}</span>
            </div>
          </div>
        </div>
      </Card>

      {/* ── Segmented Navigation Tabs (No 0 badge, evenly spaced) ── */}
      <Segmented
        value={activeTab}
        onChange={setActiveTab}
        items={[
          { id: 'overview', label: t('Overview', 'सिंहावलोकन', 'आढावा') },
          { id: 'hearings', label: t('Hearings', 'सुनवाई', 'सुनावणी'), badge: caseHearings.length > 0 ? caseHearings.length : undefined },
          { id: 'documents', label: t('Documents', 'दस्तावेज', 'कागदपत्रे'), badge: caseDocs.length > 0 ? caseDocs.length : undefined },
          { id: 'fees', label: t('Fees', 'शुल्क व बिल', 'फी व बिले'), badge: caseInvoices.length > 0 ? caseInvoices.length : undefined },
          { id: 'notes', label: t('Notes', 'टिप्पणियाँ', 'टिपा'), badge: savedNotesList.length > 0 ? savedNotesList.length : undefined },
        ]}
      />

      {/* ── Tab 1: Overview ── */}
      {activeTab === 'overview' && (
        <div className="space-y-4 animate-in fade-in">
          {/* Parties to the Matter: Petitioner & Accused / Respondent */}
          <Card className="p-4 bg-white/[0.02] border border-white/[0.08]">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-300 flex items-center gap-1.5">
                <Users size={14} className="text-amber-400" />
                <span>{t('Parties to the Matter (Petitioner vs Accused / Respondent)', 'पक्षकार (याचिकाकर्ता / परिवादी बनाम अभियुक्त / प्रतिवादी)', 'पक्षकार (याचिकाकर्ता / तक्रारदार विरुद्ध आरोपी / प्रतिवादी)')}</span>
              </h3>
              <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-white/[0.05] text-neutral-400">
                {caseFile.cnrNumber ? 'eCourts CIS Mapped' : 'Chamber Dossier'}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Petitioner / Complainant Box */}
              <div className="p-3 rounded-2xl bg-sky-500/5 border border-sky-500/20 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] uppercase font-bold text-sky-400 tracking-wider">
                    {/138|cheque|criminal|fir|ipc|bns/i.test(caseFile.caseType || '') ? 'Complainant / Prosecution' : 'Petitioner / Plaintiff'}
                  </span>
                  <span className="text-[9px] px-1.5 py-0.5 rounded bg-sky-500/10 text-sky-300 font-medium">
                    Client Representation
                  </span>
                </div>
                <div className="text-sm font-bold text-white break-words">
                  {caseFile.petitioner || caseFile.clientName}
                </div>
                {caseFile.clientPhone && (
                  <div className="text-[11px] text-neutral-400">
                    Contact: <span className="font-mono text-neutral-300">{caseFile.clientPhone}</span>
                  </div>
                )}
              </div>

              {/* Respondent / Accused Box */}
              <div className="p-3 rounded-2xl bg-purple-500/5 border border-purple-500/20 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] uppercase font-bold text-purple-400 tracking-wider">
                    {/138|cheque|criminal|fir|ipc|bns/i.test(caseFile.caseType || '') ? 'Accused / Opposite Party' : 'Respondent / Defendant'}
                  </span>
                  <span className="text-[9px] px-1.5 py-0.5 rounded bg-purple-500/10 text-purple-300 font-medium">
                    Opposing Party
                  </span>
                </div>
                <div className="text-sm font-bold text-white break-words">
                  {caseFile.respondent || caseFile.accused || caseFile.opponentName || 'State / Opposite Party'}
                </div>
                <div className="text-[11px] text-neutral-400">
                  Role: <span className="text-neutral-300">{/138|cheque|criminal|fir|ipc|bns/i.test(caseFile.caseType || '') ? 'Accused / Defending Party' : 'Respondent / Opposite Counsel'}</span>
                </div>
              </div>
            </div>
          </Card>

          {/* Stage Progression Stepper: Horizontal Scrolling Strip */}
          <Card>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
              <div className="flex items-center gap-2">
                <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-300">
                  {t('Procedural Stage Progression', 'न्यायिक कार्यवाही का चरण', 'न्यायालयीन प्रक्रियेचे टप्पे')}
                </h3>
                <button
                  type="button"
                  onClick={() => setShowStageInfoModal(true)}
                  className="inline-flex items-center gap-1 text-[11px] text-amber-400 hover:text-amber-300 transition"
                  title="How are stages decided & linked?"
                >
                  <HelpCircle size={13} />
                  <span className="text-[10px] font-medium underline">How it works</span>
                </button>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-amber-300 font-mono">
                  {t('Stage', 'चरण', 'टप्पा')} {safeStageIdx + 1} / {stages.length}
                </span>
                <button
                  type="button"
                  onClick={() => setShowUpdateStageModal(true)}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-400/10 hover:bg-amber-400/20 text-amber-300 border border-amber-400/30 text-[11px] font-semibold transition ios-press"
                  title="Click to manually update case stage"
                >
                  <Edit3 size={11} />
                  <span>{t('Change Stage', 'चरण बदलें', 'टप्पा बदला')}</span>
                </button>
              </div>
            </div>

            {/* Stepper bar */}
            <div className="w-full bg-white/[0.08] h-2 rounded-full overflow-hidden mb-3">
              <div
                className="bg-amber-400 h-full rounded-full transition-all duration-500"
                style={{ width: `${((safeStageIdx + 1) / Math.max(stages.length, 1)) * 100}%` }}
              />
            </div>

            {/* Horizontally scrolling stages strip showing ALL stages */}
            <div className="flex overflow-x-auto no-scrollbar gap-2 pb-2">
              {stages.map((s, idx) => {
                const isPassed = idx < safeStageIdx;
                const isCurrent = idx === safeStageIdx;

                return (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => handleSelectStage(s.name)}
                    className={`min-w-[125px] max-w-[165px] flex-shrink-0 p-2.5 rounded-2xl border text-xs text-left transition select-none ios-press ${
                      isCurrent
                        ? 'bg-amber-400/15 border-amber-400/50 text-amber-300 ring-1 ring-amber-400/30'
                        : isPassed
                        ? 'bg-white/[0.04] border-emerald-500/30 text-emerald-400 hover:border-emerald-500/50'
                        : 'bg-white/[0.02] border-white/[0.06] text-neutral-400 hover:border-white/20'
                    }`}
                    title={`Click to set stage to: ${s.name}`}
                  >
                    <div className="flex items-center gap-1.5 font-bold mb-1">
                      {isPassed && <CheckCircle2 size={12} className="shrink-0" />}
                      {isCurrent && <div className="w-2 h-2 rounded-full bg-amber-400 animate-pulse shrink-0" />}
                      {!isPassed && !isCurrent && <span className="text-[10px] text-neutral-500 font-mono">#{idx + 1}</span>}
                      <span className="truncate">{s.name}</span>
                    </div>
                    <p className="text-[10.5px] text-neutral-400 line-clamp-2 leading-tight">{s.description}</p>
                  </button>
                );
              })}
            </div>
            <p className="text-[10px] text-neutral-500 font-mono mt-1">
              💡 {t('Tip: Click any step above or tap "Change Stage" to transition case progress.', 'सुझाव: चरण बदलने के लिए ऊपर किसी भी बॉक्स पर टैप करें।', 'टीप: टप्पा बदलण्यासाठी वरील बॉक्सवर क्लिक करा.')}
            </p>
          </Card>

          {/* Legal Sections & Acts (Item 9) */}
          {cleanedActSections.length > 0 && (
            <Card>
              <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-300 mb-2">
                {t('Applicable Sections & Statutes', 'लागू कानूनी धाराएं एवं अधिनियम', 'लागू कायदेशीर कलमे व कायदे')}
              </h3>
              <div className="flex flex-wrap gap-1.5">
                {cleanedActSections.map(sec => (
                  <span
                    key={sec}
                    className="px-3 py-1 rounded-xl bg-amber-400/10 border border-amber-400/25 text-amber-300 font-mono text-xs font-bold"
                  >
                    {sec}
                  </span>
                ))}
              </div>
            </Card>
          )}
        </div>
      )}

      {/* ── Tab 2: Hearings (O1: Header has the ONLY Add Hearing CTA; O3: min-w-0 + shrink-0) ── */}
      {activeTab === 'hearings' && (
        <div className="space-y-3 animate-in fade-in">
          <div className="flex items-center justify-between gap-3">
            <h3 className="min-w-0 flex-1 truncate text-xs font-bold uppercase tracking-wider text-neutral-300">
              {t('Hearing History & Listings', 'सुनवाई इतिहास व आगामी तारीखें', 'सुनावणी इतिहास व आगामी तारखा')}
            </h3>
            <Button
              variant="primary"
              size="sm"
              className="shrink-0"
              icon={<Plus size={13} />}
              onClick={() => setShowAddHearing(true)}
            >
              {t('Add Hearing', 'सुनवाई जोड़ें', 'सुनावणी जोडा')}
            </Button>
          </div>

          {caseHearings.length === 0 ? (
            <Card className="text-center p-8 text-neutral-400 text-xs">
              <Calendar size={24} className="mx-auto mb-2 text-neutral-500" />
              <p>{t('No hearings listed for this case yet.', 'इस केस के लिए कोई सुनवाई सूचीबद्ध नहीं है।', 'या खटल्यासाठी अद्याप कोणतीही सुनावणी नाही.')}</p>
              <p className="text-[11px] text-neutral-500 mt-1">
                {t('Use the Add Hearing button above to schedule.', 'ऊपर दिए गए बटन से नई सुनवाई जोड़ें।', 'सुनावणी जोडण्यासाठी वरील बटण वापरा.')}
              </p>
            </Card>
          ) : (
            caseHearings.map(hearing => (
              <HearingCard
                key={hearing.id}
                hearing={hearing}
                language={language}
                onLogOrder={h => setActiveLogOrderHearing(h)}
                onEditHearing={h => setEditingHearing(h)}
              />
            ))
          )}
        </div>
      )}

      {/* ── Tab 3: Documents (O4 & F13: Real documents prop, no fake list) ── */}
      {activeTab === 'documents' && (
        <div className="space-y-3 animate-in fade-in">
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0 flex-1 truncate">
              <h3 className="truncate text-xs font-bold uppercase tracking-wider text-neutral-300">
                {t('Dossier Vault & Evidentiary Documents', 'केस दस्तावेज एवं साक्ष्य', 'खटल्याची कागदपत्रे व पुरावे')}
              </h3>
              <p className="text-xs text-neutral-400 truncate">
                {caseDocs.length > 0
                  ? `${verifiedDocsCount} ${t('of', 'में से', 'पैकी')} ${caseDocs.length} ${t('verified', 'सत्यापित', 'सत्यापित')}`
                  : t('No documents uploaded yet', 'कोई दस्तावेज अपलोड नहीं', 'अद्याप कोणतेही कागदपत्र नाही')}
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => setShowTemplatesModal(true)}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-amber-400 hover:bg-amber-300 text-black transition shadow-sm"
                title="Draft Legal Document with AI Pre-fill"
              >
                <FileText size={14} className="text-black" />
                <span>{t('Legal Templates & AI Draft', 'ड्राफ्ट टेम्प्लेट', 'मसुदा टेम्पलेट्स')}</span>
              </button>

              <label className="shrink-0 cursor-pointer">
                <input
                  type="file"
                  className="hidden"
                  onChange={e => {
                    const file = e.target.files?.[0];
                    if (file && onUploadDocument) {
                      onUploadDocument(caseFile.caseNumber, file);
                    }
                  }}
                />
                <span className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-white/[0.08] hover:bg-white/[0.12] text-white transition border border-white/[0.1]">
                  <UploadCloud size={14} />
                  <span>{t('Upload Doc', 'दस्तावेज जोड़ें', 'कागदपत्र जोडा')}</span>
                </span>
              </label>
            </div>
          </div>

          {caseDocs.length === 0 ? (
            <Card className="text-center p-8 text-neutral-400 text-xs">
              <FileText size={24} className="mx-auto mb-2 text-neutral-500" />
              <p>{t('No documents uploaded for this case yet.', 'इस केस के लिए कोई दस्तावेज अपलोड नहीं किया गया है।', 'या खटल्यासाठी अद्याप कोणतीही कागदपत्रे अपलोड केलेली नाहीत.')}</p>
              <p className="text-[11px] text-neutral-500 mt-1">
                {t('Upload filings, orders, and evidence using the button above.', 'ऊपर दिए गए बटन का उपयोग करके याचिका, आदेश या साक्ष्य अपलोड करें।', 'वरील बटण वापरून कागदपत्रे अपलोड करा.')}
              </p>
            </Card>
          ) : (
            <div className="space-y-2">
              {caseDocs.map(doc => {
                const ext = (doc.title || doc.name || '').split('.').pop()?.toUpperCase() || 'DOC';
                return (
                  <Card key={doc.id} className="flex items-center justify-between p-3.5">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-9 h-9 rounded-xl bg-white/[0.06] flex items-center justify-center text-amber-300 shrink-0">
                        <FileText size={16} />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-xs font-semibold text-white truncate">{doc.title || doc.name}</p>
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-400/15 text-amber-300 border border-amber-400/20 shrink-0">
                            {ext}
                          </span>
                        </div>
                        <p className="text-[11px] text-neutral-400 mt-0.5">{doc.size || 'Attached Document'}</p>
                      </div>
                    </div>
                    <StatusBadge status={doc.status || 'pending'} />
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ── Tab 4: Fees (O5-3 & F14: Total agreed fee from real data, zero fallback) ── */}
      {activeTab === 'fees' && (
        <div className="space-y-3 animate-in fade-in">
          <div className="flex items-center justify-between gap-3">
            <h3 className="min-w-0 flex-1 truncate text-xs font-bold uppercase tracking-wider font-mono text-neutral-300">
              {t('Matter Invoices & Fee Ledger', 'केस बिलिंग व देय राशि', 'खटला बिले व फी लेजर')}
            </h3>
            <Button
              variant="primary"
              size="sm"
              className="shrink-0"
              icon={<Plus size={13} />}
              onClick={() => setShowCaseNewInvoice(true)}
            >
              {t('New Invoice', 'नया बिल', 'नवीन बिल')}
            </Button>
          </div>

          {/* Real Invoice & Fee Summary for this Case */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 sm:gap-3">
            <Card className="p-3.5 bg-white/[0.03] border-white/[0.08]">
              <p className="text-xs text-neutral-400 truncate">{t('Total Invoiced', 'कुल बिल राशि', 'एकूण बिल रक्कम')}</p>
              <p className="text-base sm:text-lg font-bold font-mono text-white mt-1">
                ₹{caseTotalInvoiced.toLocaleString('en-IN')}
              </p>
              <p className="text-[11px] text-neutral-500 mt-0.5">
                {caseInvoices.length} {caseInvoices.length === 1 ? t('invoice', 'इनवॉइस', 'इनव्हॉइस') : t('invoices', 'इनवॉइस', 'इनव्हॉइस')}
              </p>
            </Card>

            <Card className="p-3.5 bg-emerald-500/10 border-emerald-500/25">
              <p className="text-xs text-emerald-400 truncate">{t('Collected Fees', 'प्राप्त राशि', 'प्राप्त रक्कम')}</p>
              <p className="text-base sm:text-lg font-bold font-mono text-emerald-400 mt-1">
                ₹{caseTotalPaid.toLocaleString('en-IN')}
              </p>
              <p className="text-[11px] text-emerald-400/80 mt-0.5">
                {caseInvoices.filter(i => i.status === 'Paid').length} {t('settled', 'प्राप्त', 'जमा')}
              </p>
            </Card>

            <Card className="p-3.5 bg-amber-500/10 border-amber-500/25">
              <p className="text-xs text-amber-300 truncate">{t('Outstanding Dues', 'बकाया देय', 'प्रलंबित देय')}</p>
              <p className="text-base sm:text-lg font-bold font-mono text-amber-300 mt-1">
                ₹{caseOutstanding.toLocaleString('en-IN')}
              </p>
              <p className="text-[11px] text-amber-300/80 mt-0.5">
                {caseInvoices.filter(i => i.status !== 'Paid').length} {t('pending', 'लंबित', 'प्रलंबित')}
              </p>
            </Card>
          </div>

          {caseInvoices.length === 0 ? (
            <div className="p-8 rounded-2xl bg-white/[0.02] border border-white/[0.08] text-center space-y-3">
              <p className="text-xs text-neutral-400">
                {t('No fee invoices issued for this case yet.', 'इस केस के लिए अभी तक कोई फीस इनवॉइस जारी नहीं किया गया है।', 'या खटल्यासाठी अद्याप कोणतेही फी इनव्हॉइस जारी केलेले नाही.')}
              </p>
              <Button
                variant="primary"
                size="sm"
                icon={<Plus size={13} />}
                onClick={() => setShowCaseNewInvoice(true)}
              >
                {t('Create Case Invoice', 'केस इनवॉइस बनाएं', 'केस इनव्हॉइस तयार करा')}
              </Button>
            </div>
          ) : (
            caseInvoices.map(inv => (
              <Card key={inv.id} className="flex items-center justify-between p-3.5">
                <div className="min-w-0 pr-2">
                  <p className="text-xs font-bold text-main truncate">
                    <span className="font-mono text-amber-600 dark:text-amber-400">{inv.caseNumber}</span> · <span>{inv.clientName}</span>
                  </p>
                  <p className="text-[11px] text-sub">
                    {t('Invoice', 'बिल', 'बिल')} <span className="font-mono font-medium">#{inv.id}</span> · {t('Dated', 'दिनांक', 'दिनांक')} <span className="font-mono font-medium">{inv.date}</span>
                  </p>
                  {inv.paidVia && (
                    <p className="text-[10px] text-emerald-400/90 font-mono mt-0.5">
                      ✓ {t('Paid via', 'के माध्यम से प्राप्त', 'द्वारे प्राप्त')} {inv.paidVia} {inv.upiRef ? `(${inv.upiRef})` : ''}
                    </p>
                  )}
                </div>
                <div className="text-right flex items-center gap-3 shrink-0">
                  <div className="flex flex-col items-end">
                    <span className="text-xs font-bold font-mono text-white">₹{inv.totalAmount.toLocaleString('en-IN')}</span>
                    {onToggleInvoiceStatus && (
                      <button
                        type="button"
                        onClick={() => onToggleInvoiceStatus(inv.id)}
                        className={`text-[10px] underline mt-0.5 transition font-semibold ${
                          inv.status === 'Paid'
                            ? 'text-neutral-400 hover:text-amber-300'
                            : 'text-emerald-400 hover:text-emerald-300'
                        }`}
                      >
                        {inv.status === 'Paid'
                          ? t('Mark as Pending', 'लंबित चिह्नित करें', 'प्रलंबित चिन्हांकित करा')
                          : t('Mark as Paid', 'प्राप्त चिह्नित करें', 'प्राप्त चिन्हांकित करा')}
                      </button>
                    )}
                  </div>
                  <StatusBadge status={inv.status} />
                </div>
              </Card>
            ))
          )}
        </div>
      )}

      {/* ── Tab 5: Notes (O2: pb-32 avoids FAB overlap) ── */}
      {activeTab === 'notes' && (
        <div className="space-y-4 animate-in fade-in">
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider font-mono text-neutral-300 mb-2">
              {t('Private Advocate Case Strategy & Notes', 'गोपनीय वकील टिप्पणियाँ', 'खाजगी वकील रणनीती व टिपा')}
            </h3>
            <textarea
              rows={4}
              value={caseNotes}
              onChange={e => setCaseNotes(e.target.value)}
              placeholder={t('Enter private strategic case notes...', 'रणनीतिक केस नोट्स यहाँ लिखें...', 'रणनीतिक केस नोट्स येथे लिहा...')}
              className="w-full bg-white/[0.04] border border-white/[0.1] rounded-2xl p-4 text-xs text-neutral-200 leading-relaxed focus:outline-none focus:border-amber-400/50 resize-none font-mono"
            />
            <div className="flex items-center justify-between pt-1">
              {notesSavedSuccess ? (
                <span className="text-xs font-semibold text-emerald-400 flex items-center gap-1.5 animate-in fade-in">
                  <CheckCircle2 size={14} />
                  {t('Strategy notes saved successfully to case dossier!', 'रणनीतिक नोट्स सुरक्षित कर लिए गए हैं!', 'रणनीती टिपा यशस्वीपणे जतन केल्या!')}
                </span>
              ) : <span />}
              <Button
                variant="primary"
                size="sm"
                loading={notesSaving}
                onClick={handleSaveNotes}
                disabled={!caseNotes.trim()}
              >
                {notesSaving
                  ? t('Saving...', 'सुरक्षित हो रहा है...', 'जतन होत आहे...')
                  : t('Save Strategy Notes', 'नोट्स सुरक्षित करें', 'टिपा जतन करा')}
              </Button>
            </div>
          </div>

          {/* ── Saved Notes History (BUGS_20261002 Item 1: Date and Time Segregation) ── */}
          <div className="space-y-2.5 pt-3 border-t border-white/[0.08]">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold uppercase tracking-wider font-mono text-neutral-300 flex items-center gap-1.5">
                <FileText size={13} className="text-amber-400" />
                <span>{t('Saved Notes History (Chronological)', 'सहेजी गई टिप्पणियाँ (दिनांक व समय अनुसार)', 'जतन केलेल्या नोंदी (दिनांक व वेळेनुसार)')}</span>
              </h4>
              <span className="text-[10px] font-mono text-neutral-400">
                {savedNotesList.length} {savedNotesList.length === 1 ? t('entry', 'प्रविष्टि', 'नोंद') : t('entries', 'प्रविष्टियां', 'नोंदी')}
              </span>
            </div>

            {savedNotesList.length === 0 ? (
              <p className="text-xs text-neutral-500 italic p-3.5 rounded-2xl bg-white/[0.02] border border-white/[0.04]">
                {t('No saved notes yet. Write notes above and click Save Strategy Notes.', 'अभी कोई सहेजी गई टिप्पणी नहीं है। ऊपर लिखें और सुरक्षित करें।', 'अद्याप कोणतीही जतन केलेली नोंद नाही. वर लिहा आणि जतन करा.')}
              </p>
            ) : (
              <div className="space-y-2">
                {savedNotesList.map((entry) => (
                  <div
                    key={entry.id}
                    className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/[0.08] space-y-2 transition hover:border-white/20"
                  >
                    <div className="flex items-center justify-between text-[11px] text-neutral-400 font-mono pb-1.5 border-b border-white/[0.04]">
                      <span className="flex items-center gap-1.5 text-amber-300 font-bold">
                        <Clock size={12} className="text-amber-400" />
                        {entry.createdAt}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleDeleteNote(entry.id)}
                        className="text-neutral-500 hover:text-red-400 transition p-1"
                        title="Delete note"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                    <p className="text-xs text-neutral-200 whitespace-pre-wrap leading-relaxed font-sans">
                      {entry.text}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Log Order Sheet ── */}
      {activeLogOrderHearing && (
        <LogOrderSheet
          open={Boolean(activeLogOrderHearing)}
          onOpenChange={(isOpen) => { if (!isOpen) setActiveLogOrderHearing(null); }}
          hearingId={activeLogOrderHearing.id}
          caseNumber={activeLogOrderHearing.caseNumber || caseFile.caseNumber}
          clientName={activeLogOrderHearing.clientName || caseFile.clientName}
          court={activeLogOrderHearing.courtName || caseFile.courtLocation}
          currentStage={activeLogOrderHearing.stage || caseFile.stage}
          language={language}
          onSave={handleSaveOrder}
        />
      )}

      {/* ── Add Hearing Sheet ── */}
      <HearingFormSheet
        open={showAddHearing}
        onOpenChange={setShowAddHearing}
        initialData={{
          caseNumber: caseFile.caseNumber,
          clientName: caseFile.clientName,
          courtName: caseFile.courtLocation || caseFile.court || 'Court',
        }}
        hearings={hearings}
        language={language}
        onSave={(newHearing: Omit<HearingItem, 'id'>) => {
          if (onAddHearing) {
            onAddHearing(newHearing);
          }
          setShowAddHearing(false);
        }}
      />

      {/* ── Case-Specific New Invoice Sheet ── */}
      <Sheet
        open={showCaseNewInvoice}
        onOpenChange={setShowCaseNewInvoice}
        title={t('New Case Invoice', 'केस हेतु नया बिल', 'खटल्यासाठी नवीन बिल')}
        description={`${caseFile.caseNumber} • ${caseFile.clientName}`}
        primary={{
          label: t('Issue Invoice', 'बिल जारी करें', 'बिल जारी करा'),
          onClick: handleCreateCaseInvoice,
          disabled: !invoiceAmount || parseFloat(invoiceAmount) <= 0
        }}
        secondary={{
          label: t('Cancel', 'रद्द करें', 'रद्द करा'),
          onClick: () => setShowCaseNewInvoice(false)
        }}
      >
        <div className="space-y-4 pt-1">
          {/* Locked Case Info Banner */}
          <div className="p-3 rounded-2xl bg-amber-400/10 border border-amber-400/20 flex items-center justify-between">
            <div>
              <p className="text-[10px] uppercase font-mono tracking-wider text-amber-300 font-bold">
                {t('Locked Case Dossier', 'निर्धारित केस फ़ाइल', 'निश्चित केस फाईल')}
              </p>
              <p className="text-xs font-bold text-white mt-0.5">{caseFile.caseNumber}</p>
              <p className="text-[11px] text-neutral-300">{caseFile.clientName}</p>
            </div>
            <div className="px-2.5 py-1 rounded-lg bg-black/40 text-amber-300 text-[10px] font-mono border border-amber-400/20">
              {caseFile.courtLocation || 'Court'}
            </div>
          </div>

          {/* Amount */}
          <div>
            <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
              {t('Total Invoice Amount (₹)', 'कुल बिल राशि (₹)', 'एकूण बिल रक्कम (₹)')} *
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400 font-bold">₹</span>
              <input
                type="number"
                value={invoiceAmount}
                onChange={e => setInvoiceAmount(e.target.value)}
                placeholder="5000"
                style={{ fontSize: (invoiceAmount || '').length > 8 ? '0.8rem' : '0.95rem' }}
                className="w-full bg-white/[0.04] border border-white/[0.1] rounded-xl pl-8 pr-4 py-2.5 text-sm text-white font-mono focus:outline-none focus:border-amber-400/60 overflow-hidden text-ellipsis"
              />
            </div>
          </div>

          {/* Payment Status Selector */}
          <div>
            <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
              {t('Payment Status', 'भुगतान स्थिति', 'पेमेंट स्थिती')}
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setInvoiceStatus('Pending')}
                className={`py-2 px-3 rounded-xl border text-xs font-semibold transition ${
                  invoiceStatus === 'Pending'
                    ? 'bg-amber-400/20 border-amber-400/60 text-amber-300'
                    : 'bg-white/[0.03] border-white/[0.08] text-neutral-400 hover:text-white'
                }`}
              >
                ⏳ {t('Pending (Awaiting)', 'लंबित (अप्राप्त)', 'प्रलंबित (अपेक्षित)')}
              </button>
              <button
                type="button"
                onClick={() => setInvoiceStatus('Paid')}
                className={`py-2 px-3 rounded-xl border text-xs font-semibold transition ${
                  invoiceStatus === 'Paid'
                    ? 'bg-emerald-500/20 border-emerald-400/60 text-emerald-400 font-bold'
                    : 'bg-white/[0.03] border-white/[0.08] text-neutral-400 hover:text-white'
                }`}
              >
                ✓ {t('Paid (Received)', 'प्राप्त (जमा)', 'प्राप्त (जमा)')}
              </button>
            </div>
            <p className="text-[10px] text-neutral-400 mt-1">
              {invoiceStatus === 'Pending' 
                ? t('Defaults to Pending. Once the client settles it, you can tap "Mark as Paid".', 'डिफ़ॉल्ट रूप से लंबित। मुवक्किल द्वारा भुगतान करने पर आप इसे प्राप्त चिह्नित कर सकते हैं।', 'डिफ़ॉल्टपणे प्रलंबित. पक्षकाराने पैसे दिल्यावर आपण "प्राप्त" चिन्हांकित करू शकता.')
                : t('Marks as received and immediately credits to case collected fees.', 'तत्काल प्राप्त मानकर केस जमा राशि में जोड़ दिया जाएगा।', 'लगेच प्राप्त मानून जमा रकमेत जोडले जाईल.')
              }
            </p>
          </div>

          {/* Due Date */}
          <div>
            <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
              {t('Invoice Due Date', 'देय तारीख', 'देय तारीख')}
            </label>
            <input
              type="date"
              value={invoiceDueDate}
              onChange={e => setInvoiceDueDate(e.target.value)}
              className="w-full bg-white/[0.04] border border-white/[0.1] rounded-xl px-3.5 py-2 text-xs text-white font-mono focus:outline-none focus:border-amber-400/60"
            />
          </div>

          {/* Description (Suggestion 8: Dropdown list) */}
          <div>
            <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
              {t('Description / Services Rendered (Dropdown)', 'शुल्क विवरण / सेवा (Dropdown)', 'तपशील / सेवा (Dropdown)')}
            </label>
            <select
              value={invoiceDescription}
              onChange={e => setInvoiceDescription(e.target.value)}
              className="w-full bg-neutral-900 border border-white/[0.12] rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-amber-400"
            >
              {PREDEFINED_FEE_DESCRIPTIONS.map(desc => (
                <option key={desc} value={desc}>
                  {desc}
                </option>
              ))}
              <option value="Custom Legal Fee">Custom Legal Services</option>
            </select>
          </div>
        </div>
      </Sheet>

      {/* ── Edit Case Modal (Suggestion 4) ── */}
      {showEditCase && (
        <NewCaseSheet
          open={showEditCase}
          onOpenChange={setShowEditCase}
          initialData={caseFile}
          cases={[]}
          language={language}
          onSave={async (updated) => {
            await handleUpdateCaseDetails(caseFile.caseNumber, updated);
            setShowEditCase(false);
          }}
        />
      )}

      {/* ── Edit Hearing Modal (Suggestion 4) ── */}
      {editingHearing && (
        <HearingFormSheet
          open={Boolean(editingHearing)}
          onOpenChange={open => {
            if (!open) setEditingHearing(null);
          }}
          initialData={editingHearing}
          hearings={hearings}
          language={language}
          onSave={async (updated) => {
            if (onAddHearing) {
              await onAddHearing(updated);
            }
            setEditingHearing(null);
          }}
        />
      )}

      {/* ── How Procedural Stages Work Explainer Modal ── */}
      <Sheet
        open={showStageInfoModal}
        onOpenChange={setShowStageInfoModal}
        title={t('How Case Stages are Linked & Decided', 'न्यायिक चरण कैसे निर्धारित व लिंक होते हैं', 'न्यायालयीन टप्पे कसे ठरतात व जोडले जातात')}
        description={t('Statutory progression lifecycles in Indian Courts', 'भारतीय न्यायालयों में वैधानिक प्रक्रिया चक्र', 'भारतीय न्यायालयांमधील वैधानिक प्रक्रिया चक्र')}
      >
        <div className="space-y-4 text-xs text-neutral-300">
          {/* Card 1: How Stages are Decided */}
          <div className="p-3.5 rounded-2xl bg-amber-400/10 border border-amber-400/25 space-y-1.5">
            <div className="flex items-center gap-2 text-amber-300 font-bold text-xs">
              <Scale size={15} />
              <span>1. {t('How steps are decided by case type', 'केस प्रकार से चरण कैसे तय होते हैं', 'केस प्रकारानुसार टप्पे कसे ठरतात')}</span>
            </div>
            <p className="text-[11.5px] leading-relaxed text-neutral-200">
              {t(
                `Every matter adheres to statutory legal lifecycles under Indian statutes:
• Criminal matters follow BNSS / CrPC (FIR ➔ Bail ➔ Chargesheet ➔ PW Evidence ➔ S.313 ➔ DW ➔ Arguments ➔ Verdict).
• Civil suits follow CPC (Plaint ➔ Summons ➔ Written Statement ➔ Issues ➔ PE ➔ DE ➔ Arguments ➔ Decree).
• Section 138 NI Act follows summary procedure (Statutory Notice ➔ S.142 Complaint ➔ Pre-Summoning ➔ Accused Plea ➔ Cross-Exam ➔ Judgment).
• Special dockets (Writ Petitions under Art. 226/32, Matrimonial mediation & maintenance, MACT accident compensation, Consumer Forum CPA 2019, Arbitration) each automatically adopt their exact statutory checkpoints.`,
                `प्रत्येक मामले का वैधानिक चक्र उसके कानून के अनुसार तय होता है:
• आपराधिक मामले: प्राथमिकी (FIR) ➔ जमानत ➔ आरोप तय होना ➔ अभियोजन साक्ष्य (PW) ➔ धारा 313 बयान ➔ बचाव साक्ष्य ➔ अंतिम बहस ➔ फैसला।
• दीवानी वाद (CPC): वाद पत्र ➔ समन ➔ लिखित जवाब (WS) ➔ विवादक (Issues) ➔ साक्ष्य ➔ बहस ➔ डिक्री।
• एन.आई. एक्ट धारा 138: 15-दिवसीय विधिक नोटिस ➔ धारा 142 परिवाद ➔ संज्ञान ➔ समन ➔ परिवादी से जिरह ➔ सजा/मुआवजा।
• रिट याचिका, पारिवारिक/वैवाहिक, मोटर दुर्घटना दावा (MACT) और उपभोक्ता आयोग के लिए स्वतः उनकी विशिष्ट प्रक्रिया लागू होती है।`,
                `प्रत्येक खटल्याचा वैधानिक क्रम कायद्यानुसार ठरतो:
• फौजदारी: प्रथम खबरी ➔ जामीन ➔ दोषारोप ➔ सरकारी पुरावे ➔ कलम ३१३ ➔ बचाव पुरावा ➔ युक्तिवाद ➔ निकाल.
• दिवाणी: दावा ➔ समन्स ➔ लेखी म्हणणे ➔ मुद्दे ➔ पुरावे ➔ युक्तिवाद ➔ हुकूमनामा.
• १३८ चेक बाऊन्स: कायदेशीर नोटीस ➔ कलम १४२ तक्रार ➔ हजेरी ➔ उलटतपासणी ➔ निकाल.`
              )}
            </p>
          </div>

          {/* Card 2: How Stages are Linked & Updated */}
          <div className="p-3.5 rounded-2xl bg-sky-500/10 border border-sky-500/25 space-y-1.5">
            <div className="flex items-center gap-2 text-sky-300 font-bold text-xs">
              <Sparkles size={15} />
              <span>2. {t('How stages are linked and get updated', 'चरण कैसे जुड़े हैं और कैसे अपडेट होते हैं', 'टप्पे कसे जोडलेले असतात व कसे अपडेट होतात')}</span>
            </div>
            <div className="space-y-2 text-[11.5px] leading-relaxed text-neutral-200">
              <p>
                <strong>a) {t('Automatic via Hearing Orders:', 'सुनवाई आदेश से स्वतः:', 'सुनावणी आदेशाद्वारे आपोआप:')}</strong>{' '}
                {t(
                  'When you log a court order on any hearing (e.g., "Framing of Charges concluded, next date for PW"), selecting the next stage automatically advances the case progression stepper.',
                  'जब आप किसी सुनवाई का अदालती आदेश दर्ज करते हैं, तो चुना गया अगला चरण केस की स्थिति को स्वतः आगे बढ़ा देता है।'
                )}
              </p>
              <p>
                <strong>b) {t('eCourts CIS Live Sync:', 'eCourts CIS लाइव सिंक:', 'eCourts CIS लाइव्ह सिंक:')}</strong>{' '}
                {t(
                  'Cases with verified CNR numbers automatically synchronize purpose of listing and order stages directly from official court records.',
                  'सत्यापित CNR वाले मामले सीधे आधिकारिक ई-कोर्ट्स रिकॉर्ड से अगली सुनवाई और चरण को सिंक करते हैं।'
                )}
              </p>
              <p>
                <strong>c) {t('Direct Interactive Override:', 'सीधा मैनुअल बदलाव:', 'थेट मॅन्युअल बदल:')}</strong>{' '}
                {t(
                  'Advocates can tap any stage on the progression strip or use the "Change Stage" button anytime to immediately advance or update the current stage.',
                  'अधिवक्ता कभी भी ऊपर दिए गए किसी भी चरण बॉक्स पर क्लिक करके या "चरण बदलें" दबाकर वर्तमान स्थिति बदल सकते हैं।'
                )}
              </p>
            </div>
          </div>

          <Button
            variant="secondary"
            size="sm"
            className="w-full"
            onClick={() => setShowStageInfoModal(false)}
          >
            {t('Got It', 'समझ गया', 'समजले')}
          </Button>
        </div>
      </Sheet>

      {/* ── Interactive Stage Selector Sheet ── */}
      <Sheet
        open={showUpdateStageModal}
        onOpenChange={setShowUpdateStageModal}
        title={t('Update Procedural Stage', 'न्यायिक कार्यवाही का चरण बदलें', 'न्यायालयीन प्रक्रियेचा टप्पा बदला')}
        description={t(
          `Select the current stage for ${caseFile.caseNumber} (${caseFile.caseType || 'Matter'})`,
          `${caseFile.caseNumber} के लिए वर्तमान चरण का चयन करें`,
          `${caseFile.caseNumber} साठी सध्याचा टप्पा निवडा`
        )}
      >
        <div className="space-y-2 max-h-[60vh] overflow-y-auto pr-1">
          {stages.map((s, idx) => {
            const isCurrent = idx === safeStageIdx;
            return (
              <button
                key={s.id}
                type="button"
                disabled={updatingStage}
                onClick={() => handleSelectStage(s.name)}
                className={`w-full p-3 rounded-2xl border text-left transition flex items-start justify-between gap-3 ios-press ${
                  isCurrent
                    ? 'bg-amber-400/20 border-amber-400 text-amber-200 shadow-md ring-1 ring-amber-400/50'
                    : 'bg-white/[0.03] border-white/[0.08] hover:bg-white/[0.06] hover:border-white/20 text-neutral-200'
                }`}
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-white/[0.08] text-neutral-400">
                      Step {idx + 1}
                    </span>
                    <span className="text-xs font-bold text-white truncate">{s.name}</span>
                    {isCurrent && (
                      <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-amber-400 text-black">
                        Current
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-neutral-400 mt-1 line-clamp-2">
                    {s.description}
                  </p>
                </div>
                <div className="shrink-0 pt-0.5 text-neutral-400">
                  <ChevronRight size={16} />
                </div>
              </button>
            );
          })}
        </div>
      </Sheet>

      {/* Legal Templates & Drafting Assistant Modal (Request Item 9) */}
      <LegalTemplatesModal
        isOpen={showTemplatesModal}
        onClose={() => setShowTemplatesModal(false)}
        cases={[caseFile]}
        activeCase={caseFile}
        language={language}
        onAttachDocumentToCase={(cNum, doc) => {
          const fakeFile = new File([doc.content], doc.title, { type: 'text/plain' });
          if (onUploadDocument) {
            onUploadDocument(cNum, fakeFile);
          }
        }}
      />
    </div>
  );
};
