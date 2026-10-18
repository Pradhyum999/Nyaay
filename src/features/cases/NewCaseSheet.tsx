import React, { useState, useEffect } from 'react';
import { Sheet } from '../../design/ui/Sheet';
import { Button } from '../../design/ui/Button';
import { CaseFile, Language } from '../../types';
import { normaliseCaseNumber } from '../../lib/caseNumber';
import { parseCaseText } from '../../lib/caseAI';
import { getStarterTasksForStage } from '../../config/stages';
import { addCaseTask, addHearingRecord } from '../../services/firestoreService';
import { auth } from '../../lib/firebase';
import {
  Sparkles,
  Mic,
  AlertCircle,
  Landmark,
  ChevronDown,
  ChevronUp,
  Search,
  Building,
  Check,
  PlusCircle,
  ExternalLink,
  Key,
} from 'lucide-react';
import {
  lookupECourtsByCNR,
  parseAndValidateCNR,
  SAMPLE_ECOURTS_CNRS,
  getECourtsIndiaApiKey,
  saveECourtsIndiaApiKey,
} from '../../services/ecourtsService';
import {
  INDIAN_COURT_COMPLEXES,
  COURT_HALLS_BY_COMPLEX,
  PREDEFINED_MATTER_CLASSIFICATIONS,
  PREDEFINED_INITIAL_STAGES,
  POPULAR_ACTS_AND_SECTIONS,
} from '../../config/courtsData';
import { getISTDateString } from '../../lib/istDate';

interface NewCaseSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  cases?: CaseFile[];
  initialData?: Partial<CaseFile>;
  language?: Language;
  initialMode?: 'standard' | 'ecourts';
  onSave: (caseData: Omit<CaseFile, 'id'> & { id?: string }) => Promise<void> | void;
}

export const NewCaseSheet: React.FC<NewCaseSheetProps> = ({
  open,
  onOpenChange,
  cases = [],
  initialData,
  language = 'en',
  initialMode = 'standard',
  onSave,
}) => {
  const isEditMode = Boolean(initialData?.caseNumber);

  // Manual / extracted form states
  const [caseNumber, setCaseNumber] = useState(initialData?.caseNumber || '');
  const [clientName, setClientName] = useState(initialData?.clientName || '');
  const [opponentName, setOpponentName] = useState(initialData?.opponentName || '');
  const [courtLocation, setCourtLocation] = useState(initialData?.courtLocation || 'District Court');
  const [caseType, setCaseType] = useState(initialData?.caseType || PREDEFINED_MATTER_CLASSIFICATIONS[0]);
  const [actSections, setActSections] = useState(
    Array.isArray(initialData?.actSections)
      ? initialData.actSections.join(', ')
      : initialData?.actSections || 'Section 420 IPC / 318 BNS'
  );
  const [stage, setStage] = useState(initialData?.stage || PREDEFINED_INITIAL_STAGES[0]);
  const [priority, setPriority] = useState<'Urgent' | 'Normal'>(initialData?.priority || 'Normal');
  const [status, setStatus] = useState<'Active' | 'Closed'>(
    initialData?.status === 'Closed' ? 'Closed' : 'Active'
  );
  const [caseError, setCaseError] = useState<string | null>(null);
  const [createStarterTasks, setCreateStarterTasks] = useState(true);
  const [saving, setSaving] = useState(false);

  // Autocomplete suggestions states
  const [courtSuggestions, setCourtSuggestions] = useState<string[]>([]);
  const [showCourtDropdown, setShowCourtDropdown] = useState(false);

  const [actQuery, setActQuery] = useState('');
  const [showActSuggestions, setShowActSuggestions] = useState(false);

  // AI & eCourts assist states
  const [activeAssistMode, setActiveAssistMode] = useState<'none' | 'ai' | 'ecourts'>(
    initialMode === 'ecourts' ? 'ecourts' : 'none'
  );
  const [aiInputText, setAiInputText] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [aiExtracting, setAiExtracting] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);

  // CNR lookup states
  const [cnrInput, setCnrInput] = useState('');
  const [cnrLoading, setCnrLoading] = useState(false);
  const [cnrError, setCnrError] = useState<string | null>(null);
  const [cnrSourceVerified, setCnrSourceVerified] = useState(false);
  const [retrievedDocket, setRetrievedDocket] = useState<any | null>(null);
  const [ecourtsApiKey, setEcourtsApiKey] = useState(getECourtsIndiaApiKey());
  const [showApiKeyInput, setShowApiKeyInput] = useState(false);

  const resetForm = () => {
    setCaseNumber(initialData?.caseNumber || '');
    setClientName(initialData?.clientName || '');
    setOpponentName(initialData?.opponentName || '');
    setCourtLocation(initialData?.courtLocation || 'District Court');
    setCaseType(initialData?.caseType || PREDEFINED_MATTER_CLASSIFICATIONS[0]);
    setActSections(
      Array.isArray(initialData?.actSections)
        ? initialData.actSections.join(', ')
        : initialData?.actSections || 'Section 420 IPC / 318 BNS'
    );
    setStage(initialData?.stage || PREDEFINED_INITIAL_STAGES[0]);
    setPriority(initialData?.priority || 'Normal');
    setStatus(initialData?.status === 'Closed' ? 'Closed' : 'Active');
    setAiInputText('');
    setCnrInput(initialData?.cnrNumber || '');
    setCnrSourceVerified(Boolean(initialData?.cnrNumber));
    setRetrievedDocket(null);
    setCnrError(null);
    setAiError(null);
    setCaseError(null);
    setShowCourtDropdown(false);
    setShowActSuggestions(false);
  };

  useEffect(() => {
    if (open) {
      resetForm();
      if (initialMode === 'ecourts') {
        setActiveAssistMode('ecourts');
      } else {
        setActiveAssistMode('none');
      }
    }
  }, [open, initialData, initialMode]);

  // Voice recording toggle for AI intake
  const handleToggleVoice = () => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      setAiError('Voice typing is not supported in this browser. Please type your case facts.');
      return;
    }

    if (isRecording) {
      setIsRecording(false);
      return;
    }

    const SpeechRec = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    const recognition = new SpeechRec();
    recognition.lang = language === 'mr' ? 'mr-IN' : language === 'hi' ? 'hi-IN' : 'en-IN';
    recognition.interimResults = true;
    recognition.continuous = false;

    recognition.onstart = () => {
      setIsRecording(true);
      setAiError(null);
    };

    recognition.onresult = (event: any) => {
      let transcript = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        transcript += event.results[i][0].transcript;
      }
      setAiInputText(prev => (prev ? `${prev} ${transcript}` : transcript));
    };

    recognition.onerror = (event: any) => {
      console.warn('Speech recognition error:', event.error);
      setIsRecording(false);
    };

    recognition.onend = () => {
      setIsRecording(false);
    };

    recognition.start();
  };

  // AI extraction handler
  const handleExtractWithAI = async () => {
    if (!aiInputText.trim()) return;
    setAiExtracting(true);
    setAiError(null);
    try {
      const extracted = await parseCaseText(aiInputText, language);
      if (!extracted) {
        setAiError(
          language === 'hi'
            ? 'जानकारी स्पष्ट नहीं है — कृपया फ़ील्ड्स सीधे भरें।'
            : 'Could not extract enough case details — please fill the fields manually.'
        );
        return;
      }

      if (extracted.caseNumber) setCaseNumber(extracted.caseNumber);
      if (extracted.clientName) setClientName(extracted.clientName);
      if (extracted.opponentName) setOpponentName(extracted.opponentName);
      if (extracted.courtLocation) setCourtLocation(extracted.courtLocation);
      if (extracted.caseType) setCaseType(extracted.caseType);
      if (extracted.stage) setStage(extracted.stage);
      if (extracted.actSections?.length) setActSections(extracted.actSections.join(', '));

      setActiveAssistMode('none');
    } catch (err: any) {
      setAiError(err.message || 'AI extraction failed. Please enter details manually.');
    } finally {
      setAiExtracting(false);
    }
  };

  // eCourts lookup handler (Supports 16-char CNR, Case Number, or Party Name)
  const handleLookupCNR = async (targetCnr?: string) => {
    const rawToLookup = targetCnr || cnrInput;
    const trimmed = rawToLookup.trim();
    if (!trimmed) {
      setCnrError('Please enter an eCourts CNR (16-char), Case Number (e.g. 4920/2022), or Party Name.');
      return;
    }
    setCnrLoading(true);
    setCnrError(null);

    try {
      const res = await lookupECourtsByCNR(trimmed);
      if (!res.success || !res.data) {
        setCnrError(res.error || `No eCourts docket found for "${trimmed}".`);
        setCnrLoading(false);
        return;
      }

      const caseData = res.data;
      setRetrievedDocket(caseData);
      setCnrInput(caseData.cnrNumber || trimmed.toUpperCase());
      setCaseNumber(caseData.caseNumber);
      setClientName(caseData.petitioner || 'Petitioner');
      setOpponentName(caseData.respondent || 'State / Respondent');
      setCourtLocation(caseData.court);
      if (caseData.caseType) {
        setCaseType(caseData.caseType);
      }
      if (caseData.stage) {
        setStage(caseData.stage);
      }
      if (caseData.actSections && caseData.actSections.length) {
        setActSections(caseData.actSections.join(', '));
      }
      if (caseData.caseStatus) {
        if (caseData.caseStatus.toUpperCase() === 'DISPOSED') {
          setStatus('Closed');
        } else {
          setStatus('Active');
        }
      }
      setCnrSourceVerified(true);
      setActiveAssistMode('ecourts');
    } catch (err: any) {
      setCnrError(err?.message || 'Error importing CNR from eCourts.');
    } finally {
      setCnrLoading(false);
    }
  };

  // Court Complex Autocomplete filter
  const handleCourtComplexChange = (val: string) => {
    setCourtLocation(val);
    if (!val.trim()) {
      setCourtSuggestions([]);
      setShowCourtDropdown(false);
      return;
    }
    const filtered = INDIAN_COURT_COMPLEXES.map(c => c.name).filter(name =>
      name.toLowerCase().includes(val.toLowerCase())
    );
    setCourtSuggestions(filtered);
    setShowCourtDropdown(filtered.length > 0);
  };

  // Acts and Sections quick-add
  const filteredActs = actQuery.trim()
    ? POPULAR_ACTS_AND_SECTIONS.filter(a => a.toLowerCase().includes(actQuery.toLowerCase()))
    : POPULAR_ACTS_AND_SECTIONS.slice(0, 8);

  const handleAddActSection = (act: string) => {
    if (actSections.toLowerCase().includes(act.toLowerCase())) return;
    setActSections(prev => (prev ? `${prev}, ${act}` : act));
    setActQuery('');
    setShowActSuggestions(false);
  };

  const handleSubmit = async () => {
    if (!caseNumber.trim() || !clientName.trim()) return;
    setSaving(true);
    setCaseError(null);
    try {
      const normalised = normaliseCaseNumber(caseNumber);

      // Duplicate Case Prevention (Bug 4) - Ignore self in edit mode
      if (!isEditMode && cases && cases.some(c => normaliseCaseNumber(c.caseNumber) === normalised)) {
        setCaseError(
          language === 'hi'
            ? 'इस केस नंबर का मामला पहले से मौजूद है। कृपया दूसरा केस नंबर दर्ज करें।'
            : language === 'mr'
            ? 'या खटला क्रमांकाचा खटला आधीच अस्तित्वात आहे. कृपया दुसरा क्रमांक प्रविष्ट करा.'
            : 'A case with this Case Number already exists. Duplicate cases cannot be created.'
        );
        setSaving(false);
        return;
      }

      await onSave({
        ...(initialData?.id ? { id: initialData.id } : {}),
        caseNumber: normalised,
        cnrNumber: cnrSourceVerified ? cnrInput.trim().toUpperCase() : initialData?.cnrNumber,
        clientName: clientName.trim(),
        clientPhone: initialData?.clientPhone || '',
        opponentName: opponentName.trim() || 'State',
        petitioner: clientName.trim(),
        respondent: opponentName.trim() || 'State',
        accused: opponentName.trim() || 'State',
        courtLocation,
        court: (courtLocation.includes('Supreme Court')
          ? 'Supreme Court'
          : courtLocation.includes('High Court')
          ? 'High Court'
          : courtLocation.includes('Sessions')
          ? 'Sessions Court'
          : courtLocation.includes('NCLT')
          ? 'NCLT'
          : 'District Court') as any,
        caseType,
        actSections: actSections.split(',').map(s => s.trim()).filter(Boolean),
        status: status as any,
        priority,
        stage: (stage || PREDEFINED_INITIAL_STAGES[0]) as any,
        filingDate: retrievedDocket?.filingDate || initialData?.filingDate || getISTDateString(),
        nextHearingDate: retrievedDocket?.nextHearingDate || initialData?.nextHearingDate || 'TBD',
        orderNotes: retrievedDocket?.aiSummary || retrievedDocket?.advocateNotes || initialData?.orderNotes,
        unreadDocuments: initialData?.unreadDocuments || 0,
        pendingChecklistItems: initialData?.pendingChecklistItems || 0,
        totalBilled: initialData?.totalBilled || 0,
        totalCollected: initialData?.totalCollected || 0,
      });

      // Auto-import historical and scheduled hearings from official eCourts docket
      if (!isEditMode && retrievedDocket?.historyOfHearings?.length && auth.currentUser) {
        for (const h of retrievedDocket.historyOfHearings.slice(-15)) {
          try {
            await addHearingRecord({
              caseId: normalised,
              caseNumber: normalised,
              clientName: clientName.trim(),
              lawyerId: auth.currentUser.uid,
              courtName: courtLocation,
              judgeName: h.judge || 'Bench',
              stage: (stage || 'Evidence') as any,
              hearingDate: h.hearingDate || getISTDateString(),
              purposeEn: h.purposeOfListing || 'Hearing / Listing',
              purposeHi: h.purposeOfListing || 'सुनवाई',
              previousOrderSummaryEn: h.businessOnDate ? `Business on date: ${h.businessOnDate}` : undefined,
              previousOrderSummaryHi: h.businessOnDate ? `तारीख पर कार्यवाही: ${h.businessOnDate}` : undefined,
            });
          } catch (hErr) {
            console.warn('Could not auto-import docket hearing:', hErr);
          }
        }
      }

      // Starter procedural tasks if opted in (New cases only)
      if (!isEditMode && createStarterTasks && auth.currentUser) {
        const starterTasks = getStarterTasksForStage(stage);
        for (const taskTitle of starterTasks) {
          try {
            await addCaseTask({
              caseId: normalised,
              titleEn: taskTitle,
              titleHi: taskTitle,
              status: 'pending',
              assignedTo: 'lawyer',
              assignedToId: auth.currentUser.uid,
              dueDate: getISTDateString(new Date(Date.now() + 7 * 86400000)),
              createdBy: auth.currentUser.uid,
            });
          } catch (tErr) {
            console.warn('Could not auto-create starter task:', tErr);
          }
        }
      }

      resetForm();
      onOpenChange(false);
    } finally {
      setSaving(false);
    }
  };

  const t = (en: string, hi: string, mr: string) => {
    if (language === 'mr') return mr;
    if (language === 'hi') return hi;
    return en;
  };

  return (
    <Sheet
      open={open}
      onOpenChange={onOpenChange}
      title={
        isEditMode
          ? t('Edit Case Dossier', 'केस विवरण संपादित करें', 'खटला तपशील संपादित करा')
          : t('New Case Dossier', 'नया केस डॉसियर बनाएं', 'नवीन खटला संचिका तयार करा')
      }
      description={
        isEditMode
          ? t('Update existing matter metadata, court and classification', 'मौजूदा केस विवरण और स्थिति को अपडेट करें', 'अस्तित्वात असलेल्या खटल्याचा तपशील आणि स्थिती अद्यतनित करा')
          : t('Create case file manually or assist with AI & eCourts CNR', 'मैन्युअल प्रविष्टि, AI सारांश या eCourts CNR द्वारा भरें', 'मॅन्युअल नोंद, AI सारांश किंवा eCourts CNR द्वारे भरा')
      }
      primary={{
        label: saving
          ? t('Saving...', 'सुरक्षित हो रहा है...', 'जतन होत आहे...')
          : isEditMode
          ? t('Update Case', 'केस अपडेट करें', 'खटला अद्यतनित करा')
          : t('Create Case', 'केस फ़ाइल बनाएं', 'खटला तयार करा'),
        onClick: handleSubmit,
        loading: saving,
        disabled: !caseNumber.trim() || !clientName.trim(),
      }}
      secondary={{
        label: t('Cancel', 'रद्द करें', 'रद्द करा'),
      }}
    >
      <div className="space-y-4">
        {/* Error Banners */}
        {caseError && (
          <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 flex items-start gap-2 text-xs text-red-400 animate-in fade-in">
            <AlertCircle size={15} className="shrink-0 mt-0.5" />
            <span>{caseError}</span>
          </div>
        )}

        {/* CNR Verified Docket Card */}
        {cnrSourceVerified && (
          <div className="p-3.5 rounded-2xl bg-gradient-to-br from-sky-500/15 via-sky-500/10 to-indigo-500/10 border border-sky-500/30 space-y-2.5 text-xs text-sky-200 animate-in fade-in">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Landmark size={16} className="text-sky-400" />
                <span className="font-bold text-white text-xs tracking-tight">eCourts CNR Live Record Imported</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className={`font-mono text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                  retrievedDocket?.caseStatus?.toUpperCase() === 'DISPOSED'
                    ? 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                    : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                }`}>
                  {retrievedDocket?.caseStatus?.toUpperCase() === 'DISPOSED'
                    ? `DISPOSED (${retrievedDocket?.disposalType || 'Disposed'})`
                    : 'ACTIVE / UNDER TRIAL'}
                </span>
                <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded-full bg-sky-500/20 text-sky-300 border border-sky-500/30">
                  ✓ LIVE API
                </span>
              </div>
            </div>

            {/* Matter Caption / Title */}
            <div className="bg-black/30 p-2.5 rounded-xl border border-white/5 space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-[10px] uppercase font-bold tracking-wider text-neutral-400">Matter Caption:</span>
                <span className="text-[10px] font-mono text-amber-300 font-bold">
                  {retrievedDocket?.caseNumber || caseNumber}
                </span>
              </div>
              <div className="text-xs font-semibold text-white">
                {retrievedDocket?.title || `${clientName} v. ${opponentName}`}
              </div>
              <div className="text-[11px] text-neutral-300 flex items-center gap-2 flex-wrap pt-0.5">
                <span>🏛️ {retrievedDocket?.court || courtLocation}</span>
                {retrievedDocket?.courtNo && <span>(Court #{retrievedDocket.courtNo})</span>}
                {retrievedDocket?.district && <span>• {retrievedDocket.district}</span>}
                {retrievedDocket?.filingDate && <span>• Filed: {retrievedDocket.filingDate}</span>}
              </div>
            </div>

            {/* Parties Disclosed */}
            <div className="grid grid-cols-2 gap-2 text-[11px]">
              <div className="p-2.5 rounded-xl bg-sky-950/40 border border-sky-500/20">
                <span className="text-[10px] uppercase font-bold text-sky-300 block mb-0.5">Petitioner / Complainant</span>
                <span className="font-semibold text-white break-words">{clientName}</span>
                {retrievedDocket?.petitionerAdvocate && (
                  <span className="block text-[10px] text-sky-300/80 mt-0.5">Adv: {retrievedDocket.petitionerAdvocate}</span>
                )}
                <span className="inline-block mt-1 text-[9px] px-1.5 py-0.5 rounded bg-sky-500/20 text-sky-200 font-medium">✓ Auto-filled</span>
              </div>
              <div className="p-2.5 rounded-xl bg-purple-950/40 border border-purple-500/20">
                <span className="text-[10px] uppercase font-bold text-purple-300 block mb-0.5">Respondent / Accused</span>
                <span className="font-semibold text-white break-words">{opponentName}</span>
                {retrievedDocket?.respondentAdvocate && (
                  <span className="block text-[10px] text-purple-300/80 mt-0.5">Adv: {retrievedDocket.respondentAdvocate}</span>
                )}
                <span className="inline-block mt-1 text-[9px] px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-200 font-medium">✓ Auto-filled</span>
              </div>
            </div>

            {/* FIR Details if applicable */}
            {retrievedDocket?.firDetails?.policeStation && (
              <div className="p-2 rounded-xl bg-amber-950/30 border border-amber-500/20 text-[11px] text-amber-200 flex items-center justify-between">
                <span>🚨 <strong>Police Station:</strong> {retrievedDocket.firDetails.policeStation}</span>
                {retrievedDocket.firDetails.caseNumber && (
                  <span><strong>FIR No:</strong> {retrievedDocket.firDetails.caseNumber} {retrievedDocket.firDetails.year ? `(${retrievedDocket.firDetails.year})` : ''}</span>
                )}
              </div>
            )}

            {/* What Happened in Court - AI Summary */}
            {retrievedDocket?.aiSummary && (
              <div className="p-2.5 rounded-xl bg-slate-900/80 border border-amber-400/25 space-y-1">
                <div className="flex items-center gap-1.5 text-amber-300 font-semibold text-[11px]">
                  <Sparkles size={12} className="text-amber-400" />
                  <span>What Happened in Court (Official Case Summary):</span>
                </div>
                <p className="text-[11px] text-slate-200 leading-relaxed">
                  {retrievedDocket.aiSummary}
                </p>
              </div>
            )}

            {/* Hearing & Orders Summary Bar */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-[10px]">
              <div className="p-2 rounded-lg bg-black/25 border border-white/5">
                <span className="text-neutral-400 block">Stage / Purpose</span>
                <span className="font-semibold text-white">{retrievedDocket?.stage || stage || 'Under Trial'}</span>
              </div>
              <div className="p-2 rounded-lg bg-black/25 border border-white/5">
                <span className="text-neutral-400 block">Next / Last Listing</span>
                <span className="font-semibold text-amber-300">{retrievedDocket?.nextHearingDate || retrievedDocket?.lastHearingDate || 'TBD'}</span>
              </div>
              <div className="p-2 rounded-lg bg-black/25 border border-white/5 col-span-2 sm:col-span-1">
                <span className="text-neutral-400 block">Dossier Records</span>
                <span className="font-semibold text-sky-300">
                  {retrievedDocket?.historyOfHearings?.length || 0} hearings · {retrievedDocket?.orders?.length || 0} orders
                </span>
              </div>
            </div>

            {/* Recent Hearings History Preview */}
            {retrievedDocket?.historyOfHearings && retrievedDocket.historyOfHearings.length > 0 && (
              <div className="p-2 rounded-xl bg-black/25 border border-white/5 space-y-1.5">
                <span className="text-[10px] uppercase font-bold tracking-wider text-neutral-400 block">
                  Recent Hearings on Record ({retrievedDocket.historyOfHearings.length}):
                </span>
                <div className="space-y-1 max-h-24 overflow-y-auto pr-1">
                  {retrievedDocket.historyOfHearings.slice(-3).reverse().map((h: any, hIdx: number) => (
                    <div key={hIdx} className="flex items-center justify-between text-[10px] text-slate-300 border-b border-white/5 pb-0.5">
                      <span className="font-mono text-amber-200/90">{h.hearingDate || h.businessOnDate}</span>
                      <span className="truncate max-w-[150px] text-neutral-300">{h.purposeOfListing || 'Hearing'}</span>
                      <span className="text-[9px] text-neutral-400 truncate max-w-[100px]">{h.judge || 'Bench'}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex items-center justify-between text-[11px] text-neutral-300 pt-1 border-t border-white/10">
              <span className="font-mono text-amber-300 font-bold">{cnrInput}</span>
              <a
                href={parseAndValidateCNR(cnrInput).officialUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-sky-400 hover:text-sky-300 underline font-medium"
              >
                <span>Verify on Official Portal</span>
                <ExternalLink size={12} />
              </a>
            </div>
          </div>
        )}

        {/* ── Unified Smart Auto-Fill Header (Embedded eCourts CNR & AI/Voice) ── */}
        {!isEditMode && (
          <div className="rounded-2xl border border-amber-400/25 bg-gradient-to-b from-white/[0.05] to-white/[0.02] p-3.5 space-y-3 shadow-lg animate-in fade-in">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-lg bg-amber-400/20 text-amber-300 flex items-center justify-center">
                  <Sparkles size={13} />
                </div>
                <span className="text-xs font-bold text-white tracking-tight">
                  {t('⚡ Smart Intake & Auto-Fill', '⚡ त्वरित ऑटो-फिल (eCourts CNR / AI)', '⚡ त्वरित ऑटो-फिल (eCourts CNR / AI)')}
                </span>
              </div>
              <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full bg-amber-400/15 text-amber-300 border border-amber-400/30">
                All-in-One
              </span>
            </div>

            {/* Option 1: Official eCourts CNR Search Bar */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-[11px] font-semibold text-sky-300 flex items-center gap-1.5">
                  <Landmark size={13} className="text-sky-400" />
                  <span>{t('1. Import via eCourts 16-Digit CNR', '1. 16-अंकीय CNR द्वारा eCourts से आयात करें', '1. 16-अंकी CNR द्वारे eCourts वरून आयात करा')}</span>
                </label>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setShowApiKeyInput(prev => !prev)}
                    className="text-[9.5px] font-mono text-sky-400 hover:underline"
                  >
                    {ecourtsApiKey ? '✓ Live API Token' : '🔑 API Token'}
                  </button>
                  <a
                    href="https://ecourtsindia.com/api"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[9.5px] text-amber-300 hover:text-amber-200 underline inline-flex items-center gap-0.5"
                  >
                    <span>₹200 Free</span>
                    <ExternalLink size={9} />
                  </a>
                </div>
              </div>

              {showApiKeyInput && (
                <div className="space-y-1.5 p-2 rounded-xl bg-black/40 border border-sky-500/30 text-[10px]">
                  <div className="flex gap-1.5">
                    <input
                      type="password"
                      value={ecourtsApiKey}
                      onChange={e => setEcourtsApiKey(e.target.value)}
                      placeholder="eci_live_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                      className="flex-1 bg-black/60 border border-white/10 rounded-lg px-2.5 py-1 text-xs font-mono text-white placeholder-neutral-500 focus:outline-none focus:border-sky-400"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        saveECourtsIndiaApiKey(ecourtsApiKey);
                        setShowApiKeyInput(false);
                      }}
                      className="px-2.5 py-1 rounded-lg bg-sky-500 hover:bg-sky-400 text-black font-bold text-xs"
                    >
                      Save
                    </button>
                  </div>
                </div>
              )}

              <div className="flex gap-2">
                <input
                  type="text"
                  value={cnrInput}
                  onChange={e => setCnrInput(e.target.value)}
                  placeholder="Enter 16-char CNR (e.g. DLHC010049202022) or Case No..."
                  className="flex-1 surface-inset border border-sky-500/30 rounded-xl px-3 py-2 text-xs font-mono text-main placeholder-neutral-500 focus:outline-none focus:border-sky-400"
                />
                <Button
                  type="button"
                  variant="primary"
                  size="sm"
                  onClick={() => handleLookupCNR()}
                  loading={cnrLoading}
                  className="shrink-0"
                >
                  {t('Fetch Docket', 'डॉक्युमेंट लाएं', 'दस्तावेज आणा')}
                </Button>
              </div>

              {cnrError && (
                <div className="p-2 rounded-xl bg-red-500/15 border border-red-500/30 text-red-300 text-[11px] flex items-center gap-1.5">
                  <AlertCircle size={13} className="shrink-0 text-red-400" />
                  <span>{cnrError}</span>
                </div>
              )}

              {/* Sample CNR Chips */}
              <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
                <span className="text-[10px] text-neutral-400 shrink-0">Sample CNRs:</span>
                {SAMPLE_ECOURTS_CNRS.slice(0, 3).map(s => (
                  <button
                    key={s.cnr}
                    type="button"
                    onClick={() => handleLookupCNR(s.cnr)}
                    className="text-[10px] font-mono px-2 py-0.5 rounded-lg bg-sky-500/10 hover:bg-sky-500/20 text-sky-300 border border-sky-500/25 shrink-0 transition"
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Divider OR */}
            <div className="flex items-center gap-2 py-0.5">
              <div className="flex-1 h-[1px] bg-white/[0.08]" />
              <span className="text-[10px] font-mono uppercase font-bold text-neutral-500">OR</span>
              <div className="flex-1 h-[1px] bg-white/[0.08]" />
            </div>

            {/* Option 2: AI Voice / Paste Intake */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-[11px] font-semibold text-purple-300 flex items-center gap-1.5">
                  <Mic size={13} className="text-purple-400" />
                  <span>{t('2. Speak or Paste Case Facts (AI Voice Intake)', '2. बोलकर या पेस्ट करके विवरण भरें (AI वॉयस)', '2. बोलून किंवा पेस्ट करून तपशील भरा (AI व्हॉइस)')}</span>
                </label>
                <span className="text-[9.5px] font-mono text-purple-400">Speech-to-Text</span>
              </div>

              <div className="relative">
                <textarea
                  rows={2}
                  value={aiInputText}
                  onChange={e => setAiInputText(e.target.value)}
                  placeholder={t(
                    'Dictate or paste: "Ramesh Sharma vs State, Bail under Sec 420 IPC at Tis Hazari Court..."',
                    'बोलें या लिखें: "रमेश शर्मा बनाम राज्य, धारा 420 आईपीसी में जमानत, तीस हजारी कोर्ट..."',
                    'बोला किंवा लिहा: "रमेश शर्मा विरुद्ध राज्य, कलम ४२० आयपीसी जामीन, तीस हजारी न्यायालय..."'
                  )}
                  className="w-full surface-inset border border-purple-500/30 rounded-xl p-2.5 text-xs text-main placeholder-neutral-500 focus:outline-none focus:border-purple-400 pr-10"
                />
                <button
                  type="button"
                  onClick={handleToggleVoice}
                  className={`absolute right-2.5 bottom-2.5 p-1.5 rounded-lg transition ${
                    isRecording ? 'bg-red-500 text-white animate-pulse' : 'text-neutral-400 hover:text-white'
                  }`}
                  title="Speak case details"
                >
                  <Mic size={15} />
                </button>
              </div>

              {aiError && <p className="text-[11px] text-red-400">{aiError}</p>}

              {aiInputText.trim() && (
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={handleExtractWithAI}
                  loading={aiExtracting}
                  className="w-full"
                >
                  <Sparkles size={13} className="mr-1.5 text-purple-400" />
                  <span>{t('Extract & Pre-fill Below Fields', 'AI से विवरण निकालें व नीचे भरें', 'AI द्वारे तपशील काढा व खाली भरा')}</span>
                </Button>
              )}
            </div>

            <p className="text-[10px] text-neutral-400 italic">
              ✍️ {t('Or simply edit/type directly into the dossier fields below.', 'या सीधे नीचे दिए गए फ़ील्ड में जानकारी भरें।', 'किंवा थेट खालील रकान्यांमध्ये माहिती भरा.')}
            </p>
          </div>
        )}

        {/* ── Main Case Dossier Form ── */}
        <div className="space-y-3.5 pt-1">
          {/* Case Number */}
          <div>
            <label className="text-xs font-semibold text-sub block mb-1">
              {t('Case / Filing Number *', 'केस नंबर *', 'खटला क्रमांक *')}
            </label>
            <input
              type="text"
              required
              disabled={isEditMode}
              value={caseNumber}
              onChange={e => setCaseNumber(e.target.value)}
              placeholder="e.g. CRL.A./882/2026 or CS(OS)/142/2025"
              className={`w-full surface-inset border hairline rounded-xl px-3 py-2 text-xs font-mono text-main placeholder-neutral-500 focus:outline-none focus:border-amber-400 ${
                isEditMode ? 'opacity-70 cursor-not-allowed' : ''
              }`}
            />
          </div>

          {/* Client & Opponent */}
          <div className="grid grid-cols-2 gap-2.5">
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-semibold text-sub block">
                  {t('Petitioner / Complainant (Client) *', 'याचिकाकर्ता / परिवादी (मुवक्किल) *', 'अर्जदार / तक्रारदार (पक्षकार) *')}
                </label>
                {cnrSourceVerified && (
                  <span className="text-[9px] font-medium text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">
                    eCourts Auto-filled
                  </span>
                )}
              </div>
              <input
                type="text"
                required
                value={clientName}
                onChange={e => setClientName(e.target.value)}
                placeholder="e.g. Suresh Patil"
                className="w-full surface-inset border hairline rounded-xl px-3 py-2 text-xs text-main placeholder-neutral-500 focus:outline-none focus:border-amber-400"
              />
            </div>
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-semibold text-sub block">
                  {t('Respondent / Accused (Opponent)', 'प्रतिवादी / अभियुक्त (विपक्षी)', 'प्रतिवादी / आरोपी (विरुद्ध पक्ष)')}
                </label>
                {cnrSourceVerified && (
                  <span className="text-[9px] font-medium text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">
                    eCourts Auto-filled
                  </span>
                )}
              </div>
              <input
                type="text"
                value={opponentName}
                onChange={e => setOpponentName(e.target.value)}
                placeholder="e.g. Ramesh Gupta"
                className="w-full surface-inset border hairline rounded-xl px-3 py-2 text-xs text-main placeholder-neutral-500 focus:outline-none focus:border-amber-400"
              />
            </div>
          </div>

          {/* Court Complex / Location with Searchable Autocomplete (Suggestion 5) */}
          <div className="relative">
            <label className="text-xs font-semibold text-sub block mb-1">
              {t('Court Complex / Jurisdiction (Searchable)', 'अदालत परिसर व क्षेत्राधिकार (सुझाव अनुसार)', 'न्यायालय परिसर व अधिकारक्षेत्र (शोधण्यायोग्य)')}
            </label>
            <div className="relative">
              <input
                type="text"
                value={courtLocation}
                onChange={e => handleCourtComplexChange(e.target.value)}
                onFocus={() => {
                  if (courtSuggestions.length > 0) setShowCourtDropdown(true);
                }}
                placeholder={t('Type court name (e.g. Saket, High Court, NCLT)...', 'अदालत का नाम लिखें (उदा. साकेत, हाई कोर्ट)...', 'न्यायालयाचे नाव लिहा (उदा. उच्च न्यायालय, जिल्हा सत्र)...')}
                className="w-full surface-inset border hairline rounded-xl px-3 py-2 text-xs text-main placeholder-neutral-500 focus:outline-none focus:border-amber-400 pr-8"
              />
              <Building size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 pointer-events-none" />
            </div>

            {showCourtDropdown && courtSuggestions.length > 0 && (
              <div className="absolute z-40 left-0 right-0 mt-1 max-h-48 overflow-y-auto bg-neutral-950 border border-white/[0.16] rounded-xl shadow-2xl p-1.5 space-y-1 animate-in fade-in">
                {courtSuggestions.map(suggestion => (
                  <div
                    key={suggestion}
                    onClick={() => {
                      setCourtLocation(suggestion);
                      setShowCourtDropdown(false);
                    }}
                    className="px-3 py-1.5 rounded-lg text-xs text-neutral-200 hover:text-white hover:bg-amber-400/15 cursor-pointer flex items-center justify-between transition"
                  >
                    <span className="truncate">{suggestion}</span>
                    {courtLocation === suggestion && <Check size={13} className="text-amber-400" />}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Matter Classification Dropdown & Initial Stage Dropdown (Suggestion 5) */}
          <div className="grid grid-cols-2 gap-2.5">
            <div>
              <label className="text-xs font-semibold text-sub block mb-1">
                {t('Matter Classification *', 'मामले का प्रकार (Dropdown)', 'खटल्याचा प्रकार (Dropdown)')}
              </label>
              <select
                value={caseType}
                onChange={e => setCaseType(e.target.value)}
                className="w-full bg-neutral-900 border hairline rounded-xl px-3 py-2 text-xs text-main focus:outline-none focus:border-amber-400 font-medium"
              >
                {PREDEFINED_MATTER_CLASSIFICATIONS.map(cls => (
                  <option key={cls} value={cls}>
                    {cls}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-sub block mb-1">
                {isEditMode
                  ? t('Procedural Stage *', 'प्रक्रियात्मक चरण *', 'प्रक्रियात्मक टप्पा *')
                  : t('Initial Procedural Stage *', 'शुरुआती प्रक्रियात्मक चरण *', 'प्रारंभिक प्रक्रियात्मक टप्पा *')}
              </label>
              <select
                value={stage}
                onChange={e => setStage(e.target.value)}
                className="w-full bg-neutral-900 border hairline rounded-xl px-3 py-2 text-xs text-main focus:outline-none focus:border-amber-400 font-medium"
              >
                {PREDEFINED_INITIAL_STAGES.map(st => (
                  <option key={st} value={st}>
                    {st}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Priority & Status Controls (Bug 9 & Suggestion 5) */}
          <div className="grid grid-cols-2 gap-2.5">
            <div>
              <label className="text-xs font-semibold text-sub block mb-1">
                {t('Case Priority / Category *', 'प्राथमिकता (Priority)', 'प्राधान्य (Priority)')}
              </label>
              <select
                value={priority}
                onChange={e => setPriority(e.target.value as 'Normal' | 'Urgent')}
                className="w-full bg-neutral-900 border hairline rounded-xl px-3 py-2 text-xs text-main focus:outline-none focus:border-amber-400 font-medium"
              >
                <option value="Normal">{t('Normal Queue', 'सामान्य (Normal)', 'सामान्य (Normal)')}</option>
                <option value="Urgent">{t('Urgent Queue', 'अत्यावश्यक (Urgent)', 'तातडीचे (Urgent)')}</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-sub block mb-1">
                {t('Status', 'केस स्थिति (Status)', 'खटला स्थिती (Status)')}
              </label>
              <select
                value={status}
                onChange={e => setStatus(e.target.value as 'Active' | 'Closed')}
                className="w-full bg-neutral-900 border hairline rounded-xl px-3 py-2 text-xs text-main focus:outline-none focus:border-amber-400 font-medium"
              >
                <option value="Active">{t('Active Matter', 'सक्रिय (Active)', 'सक्रिय (Active)')}</option>
                <option value="Closed">{t('Disposed / Closed', 'बंद / निस्तारित (Closed)', 'बंद / निकाली (Closed)')}</option>
              </select>
            </div>
          </div>

          {/* Acts and Sections Searchable Dropdown & Suggestion Chips (Suggestion 5) */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-semibold text-sub">
                {language === 'hi' ? 'लागू कानूनी धाराएं (Acts & Sections)' : 'Acts & Sections (Searchable)'}
              </label>
              <button
                type="button"
                onClick={() => setShowActSuggestions(prev => !prev)}
                className="text-[11px] text-amber-400 hover:underline flex items-center gap-1 font-medium"
              >
                <Search size={11} />
                <span>{showActSuggestions ? 'Hide Statutes' : 'Browse Statutes'}</span>
              </button>
            </div>

            <input
              type="text"
              value={actSections}
              onChange={e => setActSections(e.target.value)}
              placeholder="e.g. Sec 138 NI Act, Sec 420 IPC, Order 39 CPC"
              className="w-full surface-inset border hairline rounded-xl px-3 py-2 text-xs text-main placeholder-neutral-500 focus:outline-none focus:border-amber-400"
            />

            {/* Quick Statute Suggestion Chips */}
            {showActSuggestions && (
              <div className="mt-2 p-2.5 rounded-xl bg-neutral-900/90 border border-white/10 space-y-2 animate-in fade-in">
                <input
                  type="text"
                  placeholder="Filter legal sections (e.g. 138, Bail, CPC, IPC)..."
                  value={actQuery}
                  onChange={e => setActQuery(e.target.value)}
                  className="w-full bg-black/60 border border-white/10 rounded-lg px-2.5 py-1 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-amber-400"
                />
                <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto">
                  {filteredActs.map(act => (
                    <button
                      key={act}
                      type="button"
                      onClick={() => handleAddActSection(act)}
                      className="text-[10px] font-mono px-2 py-1 rounded-lg bg-white/[0.05] hover:bg-amber-400/20 text-neutral-300 hover:text-amber-300 border border-white/[0.08] flex items-center gap-1 transition"
                    >
                      <PlusCircle size={10} />
                      <span>{act}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Starter Tasks Checkbox (Bug 11: No stage text duplication) */}
          {!isEditMode && (
            <div className="pt-1">
              <label className="flex items-center gap-2 cursor-pointer select-none text-xs text-sub">
                <input
                  type="checkbox"
                  checked={createStarterTasks}
                  onChange={e => setCreateStarterTasks(e.target.checked)}
                  className="w-4 h-4 rounded text-black bg-neutral-900 border-neutral-700"
                />
                <span>
                  {language === 'hi'
                    ? 'इस मामले के लिए मानक प्रारंभिक कार्य सूची बनाएं'
                    : language === 'mr'
                    ? 'या खटल्यासाठी मानक सुरुवातीची कार्ये जोडा'
                    : 'Create starter procedural tasks checklist'}
                </span>
              </label>
            </div>
          )}
        </div>
      </div>
    </Sheet>
  );
};
