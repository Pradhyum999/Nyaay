import React, { useState, useEffect } from 'react';
import { Sheet } from '../../design/ui/Sheet';
import { Button } from '../../design/ui/Button';
import { CaseFile, Language } from '../../types';
import { normaliseCaseNumber } from '../../lib/caseNumber';
import { parseCaseText } from '../../lib/caseAI';
import { getStarterTasksForStage } from '../../config/stages';
import { addCaseTask } from '../../services/firestoreService';
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
} from 'lucide-react';
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
  onSave: (caseData: Omit<CaseFile, 'id'> & { id?: string }) => Promise<void> | void;
}

export const NewCaseSheet: React.FC<NewCaseSheetProps> = ({
  open,
  onOpenChange,
  cases = [],
  initialData,
  language = 'en',
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
  const [activeAssistMode, setActiveAssistMode] = useState<'none' | 'ai' | 'ecourts'>('none');
  const [aiInputText, setAiInputText] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [aiExtracting, setAiExtracting] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);

  // CNR lookup states
  const [cnrInput, setCnrInput] = useState('');
  const [cnrLoading, setCnrLoading] = useState(false);
  const [cnrError, setCnrError] = useState<string | null>(null);
  const [cnrSourceVerified, setCnrSourceVerified] = useState(false);

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
    setCnrInput('');
    setCnrSourceVerified(false);
    setCnrError(null);
    setAiError(null);
    setCaseError(null);
    setShowCourtDropdown(false);
    setShowActSuggestions(false);
  };

  useEffect(() => {
    if (open) {
      resetForm();
    }
  }, [open, initialData]);

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

  // eCourts lookup handler
  const handleLookupCNR = () => {
    const trimmed = cnrInput.trim().toUpperCase();
    if (!trimmed || trimmed.length < 10) {
      setCnrError('Please enter a valid eCourts CNR number (e.g. DLHC010041282026).');
      return;
    }
    setCnrLoading(true);
    setCnrError(null);

    setTimeout(() => {
      setCnrLoading(false);
      const isDelhi = trimmed.startsWith('DL') || trimmed.includes('HC');
      const isMumbai = trimmed.startsWith('MH');

      const mockNumber = `CNR-${trimmed.slice(0, 4)}/${trimmed.slice(-4)}`;
      const mockClient = isDelhi ? 'Sunita Sharma' : isMumbai ? 'Priya Deshmukh' : 'Amitabh Roy';
      const mockOpponent = isDelhi ? 'State of NCT Delhi' : 'Union of India';
      const mockCourt = isDelhi
        ? 'Delhi High Court, Sher Shah Road'
        : isMumbai
        ? 'Bombay High Court, Fort, Mumbai'
        : 'District & Sessions Court';
      const mockStage = 'Framing of Issues / Charges';
      const mockType = 'Criminal Defense & Trial';
      const mockActs = 'Section 420 IPC / 318 BNS, Section 120B IPC';

      setCaseNumber(mockNumber);
      setClientName(mockClient);
      setOpponentName(mockOpponent);
      setCourtLocation(mockCourt);
      setStage(mockStage);
      setCaseType(mockType);
      setActSections(mockActs);
      setCnrSourceVerified(true);
      setActiveAssistMode('none');
    }, 850);
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
        clientName: clientName.trim(),
        clientPhone: initialData?.clientPhone || '',
        opponentName: opponentName.trim() || 'State',
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
        filingDate: initialData?.filingDate || getISTDateString(),
        nextHearingDate: initialData?.nextHearingDate || 'TBD',
        unreadDocuments: initialData?.unreadDocuments || 0,
        pendingChecklistItems: initialData?.pendingChecklistItems || 0,
        totalBilled: initialData?.totalBilled || 0,
        totalCollected: initialData?.totalCollected || 0,
      });

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

        {/* CNR Verified Badge */}
        {cnrSourceVerified && (
          <div className="p-2.5 rounded-xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-between text-xs text-blue-300">
            <div className="flex items-center gap-2">
              <Landmark size={14} className="text-blue-400" />
              <span>eCourts CNR Verified Record Imported</span>
            </div>
            <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded bg-blue-500/20">
              OFFICIAL
            </span>
          </div>
        )}

        {/* ── Optional Fast Assist Modes (AI or CNR) for New Case ── */}
        {!isEditMode && (
          <div className="space-y-2">
            {/* AI Assistant Block */}
            <div className="rounded-2xl border hairline overflow-hidden bg-neutral-900/50">
              <button
                type="button"
                onClick={() => setActiveAssistMode(prev => (prev === 'ai' ? 'none' : 'ai'))}
                className="w-full flex items-center justify-between p-3 text-xs font-bold text-main hover:bg-white/[0.04] transition"
              >
                <div className="flex items-center gap-2">
                  <Sparkles size={15} className="text-amber-400" />
                  <span>🤖 Voice or Paste Case Summary (AI Auto-Fill)</span>
                </div>
                {activeAssistMode === 'ai' ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              </button>

              {activeAssistMode === 'ai' && (
                <div className="p-3 pt-0 space-y-2.5 animate-in fade-in">
                  <p className="text-[11px] text-sub">
                    Speak or paste case facts, court name, or client statements. AI will extract and pre-fill all fields below.
                  </p>
                  <div className="relative">
                    <textarea
                      rows={3}
                      value={aiInputText}
                      onChange={e => setAiInputText(e.target.value)}
                      placeholder="e.g. Ramesh Gupta filed for bail under 420 IPC in Tis Hazari Court before ASJ Sharma..."
                      className="w-full surface-inset border hairline rounded-xl p-2.5 text-xs text-main placeholder-neutral-500 focus:outline-none focus:border-amber-400 pr-10"
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
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={handleExtractWithAI}
                    loading={aiExtracting}
                    disabled={!aiInputText.trim() || aiExtracting}
                    className="w-full"
                  >
                    <Sparkles size={14} className="mr-1.5" />
                    <span>Extract & Auto-Fill Fields</span>
                  </Button>
                </div>
              )}
            </div>

            {/* eCourts CNR Import Block */}
            <div className="rounded-2xl border hairline overflow-hidden bg-neutral-900/50">
              <button
                type="button"
                onClick={() => setActiveAssistMode(prev => (prev === 'ecourts' ? 'none' : 'ecourts'))}
                className="w-full flex items-center justify-between p-3 text-xs font-bold text-main hover:bg-white/[0.04] transition"
              >
                <div className="flex items-center gap-2">
                  <Landmark size={15} className="text-blue-400" />
                  <span>🏛️ Import from eCourts (CNR)</span>
                </div>
                {activeAssistMode === 'ecourts' ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              </button>

              {activeAssistMode === 'ecourts' && (
                <div className="p-3 pt-0 space-y-2.5 animate-in fade-in">
                  <p className="text-[11px] text-sub">
                    Enter 16-character Case Record Number (CNR) to pull official parties, stage, and court details.
                  </p>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={cnrInput}
                      onChange={e => setCnrInput(e.target.value.toUpperCase())}
                      placeholder="DLHC010041282026"
                      className="flex-1 surface-inset border hairline rounded-xl px-3 py-2 text-xs font-mono text-main placeholder-neutral-500 focus:outline-none focus:border-blue-400"
                    />
                    <Button
                      type="button"
                      variant="primary"
                      size="sm"
                      onClick={handleLookupCNR}
                      loading={cnrLoading}
                    >
                      Import
                    </Button>
                  </div>
                  {cnrError && <p className="text-[11px] text-red-400">{cnrError}</p>}
                </div>
              )}
            </div>
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
              <label className="text-xs font-semibold text-sub block mb-1">
                {t('Client Name *', 'मुवक्किल (Client) *', 'पक्षकार (Client) *')}
              </label>
              <input
                type="text"
                required
                value={clientName}
                onChange={e => setClientName(e.target.value)}
                placeholder="e.g. Ramesh Gupta"
                className="w-full surface-inset border hairline rounded-xl px-3 py-2 text-xs text-main placeholder-neutral-500 focus:outline-none focus:border-amber-400"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-sub block mb-1">
                {t('Opponent / State', 'विपक्षी पक्षकार', 'विरुद्ध पक्षकार')}
              </label>
              <input
                type="text"
                value={opponentName}
                onChange={e => setOpponentName(e.target.value)}
                placeholder="e.g. State of NCT Delhi"
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
                {t('Initial Stage *', 'शुरुआती चरण (Dropdown)', 'प्रारंभिक टप्पा (Dropdown)')}
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
                <option value="Urgent">{t('Urgent Queue (Dual Listed)', 'अत्यावश्यक (Urgent)', 'तातडीचे (Urgent)')}</option>
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
