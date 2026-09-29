import React, { useState } from 'react';
import { Sheet } from '../../design/ui/Sheet';
import { Button } from '../../design/ui/Button';
import { CaseFile, Language } from '../../types';
import { normaliseCaseNumber } from '../../lib/caseNumber';
import { parseCaseText } from '../../lib/caseAI';
import { lookupECourtsByCNR, parseAndValidateCNR } from '../../services/ecourtsService';
import { getStarterTasksForStage } from '../../config/stages';
import { addCaseTask } from '../../services/firestoreService';
import { auth } from '../../lib/firebase';
import {
  Sparkles,
  Search,
  Mic,
  MicOff,
  CheckCircle2,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  FileText,
  Landmark,
} from 'lucide-react';

interface NewCaseSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  language?: Language;
  onSave: (caseFile: Omit<CaseFile, 'id'>) => Promise<void> | void;
}

export const NewCaseSheet: React.FC<NewCaseSheetProps> = ({
  open,
  onOpenChange,
  language = 'en',
  onSave,
}) => {
  // Manual / extracted form states
  const [caseNumber, setCaseNumber] = useState('');
  const [clientName, setClientName] = useState('');
  const [opponentName, setOpponentName] = useState('');
  const [courtLocation, setCourtLocation] = useState('District Court');
  const [caseType, setCaseType] = useState('Criminal (Bail & Trial)');
  const [actSections, setActSections] = useState('Section 420 IPC / 318 BNS');
  const [stage, setStage] = useState('Admission');
  const [createStarterTasks, setCreateStarterTasks] = useState(true);
  const [saving, setSaving] = useState(false);

  // Accordion / assistive modes
  const [activeAssistMode, setActiveAssistMode] = useState<'none' | 'ai' | 'ecourts'>('ai');
  const [aiInputText, setAiInputText] = useState('');
  const [aiExtracting, setAiExtracting] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [isRecording, setIsRecording] = useState(false);

  // eCourts CNR state
  const [cnrInput, setCnrInput] = useState('');
  const [cnrLoading, setCnrLoading] = useState(false);
  const [cnrSourceVerified, setCnrSourceVerified] = useState(false);
  const [cnrError, setCnrError] = useState<string | null>(null);

  // Voice dictation handler (B-3)
  const handleToggleVoiceDictation = () => {
    if (!('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) {
      setAiError('Voice dictation is not supported in this browser.');
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

  // AI extraction handler (B-1)
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

  // eCourts lookup handler (B-2)
  const handleLookupCNR = () => {
    const trimmed = cnrInput.trim().toUpperCase();
    if (!trimmed) return;
    setCnrLoading(true);
    setCnrError(null);

    try {
      const validated = parseAndValidateCNR(trimmed);
      if (!validated.isValid) {
        setCnrError('Invalid CNR format. Expected 16-character alphanumeric code (e.g. DLCT01-005612-2022)');
        setCnrLoading(false);
        return;
      }

      const res = lookupECourtsByCNR(trimmed);
      if (res.success && res.data) {
        const c = res.data;
        if (c.caseNumber) setCaseNumber(normaliseCaseNumber(c.caseNumber));
        if (c.petitioner) setClientName(c.petitioner);
        if (c.respondent) setOpponentName(c.respondent);
        if (c.court) setCourtLocation(c.court);
        if ((c as any).caseType) setCaseType((c as any).caseType);
        if (c.stage) setStage(c.stage);
        setCnrSourceVerified(true);
        setActiveAssistMode('none');
      } else {
        setCnrError(res.error || 'Record not found in judicial CIS. Please verify the CNR number.');
      }
    } catch (err: any) {
      setCnrError('Failed to verify CNR from judicial registry.');
    } finally {
      setCnrLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!caseNumber.trim() || !clientName.trim()) return;
    setSaving(true);
    try {
      const normalised = normaliseCaseNumber(caseNumber);
      await onSave({
        caseNumber: normalised,
        clientName: clientName.trim(),
        clientPhone: '',
        opponentName: opponentName.trim() || 'State',
        courtLocation,
        court: courtLocation.includes('High Court') ? 'High Court' : 'District Court',
        caseType,
        actSections: actSections.split(',').map(s => s.trim()).filter(Boolean),
        status: 'Active',
        stage: (stage || 'Admission') as any,
        filingDate: new Date().toISOString().split('T')[0],
        nextHearingDate: 'TBD',
        unreadDocuments: 0,
        pendingChecklistItems: 0,
        totalBilled: 0,
        totalCollected: 0,
      });

      // B-4: Create starter tasks for stage if opted in
      if (createStarterTasks && auth.currentUser) {
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
              dueDate: new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0],
              createdBy: auth.currentUser.uid,
            });
          } catch (tErr) {
            console.warn('Could not auto-create starter task:', tErr);
          }
        }
      }

      onOpenChange(false);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Sheet
      open={open}
      onOpenChange={onOpenChange}
      title={language === 'hi' ? 'नया केस खोलें' : language === 'mr' ? 'नवीन खटला नोंदवा' : 'Create New Case Dossier'}
      description={
        language === 'hi'
          ? 'केस नंबर, पक्षकार और अदालत की जानकारी दर्ज करें'
          : language === 'mr'
          ? 'खटला क्रमांक, पक्षकार व न्यायालय तपशील भरा'
          : 'Register a matter dossier, attach client, court & stage'
      }
      primary={{
        label: saving ? 'Creating...' : (language === 'hi' ? 'केस फाइल सहेजें' : language === 'mr' ? 'खटला जतन करा' : 'Open Case File'),
        onClick: handleSubmit,
        loading: saving,
        disabled: !caseNumber.trim() || !clientName.trim(),
      }}
      secondary={{
        label: language === 'hi' ? 'रद्द करें' : language === 'mr' ? 'रद्द करा' : 'Cancel',
      }}
    >
      <div className="space-y-4">
        {/* ── Assistive Accordion Options (B-1 & B-2) ── */}
        <div className="space-y-2">
          {/* AI Auto-fill Block */}
          <div className="rounded-2xl border hairline overflow-hidden bg-neutral-900/50">
            <button
              type="button"
              onClick={() => setActiveAssistMode(prev => (prev === 'ai' ? 'none' : 'ai'))}
              className="w-full flex items-center justify-between p-3 text-xs font-bold text-main hover:bg-white/[0.04] transition"
            >
              <div className="flex items-center gap-2">
                <Sparkles size={15} className="text-amber-400" />
                <span>✨ Auto-fill with AI (Paste text or WhatsApp)</span>
              </div>
              {activeAssistMode === 'ai' ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </button>

            {activeAssistMode === 'ai' && (
              <div className="p-3 pt-0 space-y-2.5 animate-in fade-in">
                <p className="text-[11px] text-sub">
                  Paste details from a WhatsApp forward, eCourts page, cause list text, or dictate via mic.
                </p>
                <div className="relative">
                  <textarea
                    rows={3}
                    value={aiInputText}
                    onChange={e => setAiInputText(e.target.value)}
                    placeholder="e.g. CRL.A. 882/2025, State vs R. Sharma, Rohini Court Delhi, next date 14-10-2026, u/s 420 IPC bail matter..."
                    className="w-full bg-black/40 border hairline rounded-xl p-2.5 text-xs text-main placeholder-neutral-500 focus:outline-none focus:border-amber-400 resize-none pr-10"
                  />
                  <button
                    type="button"
                    onClick={handleToggleVoiceDictation}
                    title="Voice Dictation"
                    className={`absolute right-2.5 bottom-3 p-1.5 rounded-lg transition ${
                      isRecording ? 'bg-red-500 text-white animate-pulse' : 'surface-inset text-sub hover:text-main'
                    }`}
                  >
                    {isRecording ? <MicOff size={15} /> : <Mic size={15} />}
                  </button>
                </div>

                {aiError && (
                  <div className="text-[11px] text-red-400 flex items-center gap-1.5">
                    <AlertCircle size={13} />
                    <span>{aiError}</span>
                  </div>
                )}

                <Button
                  size="sm"
                  variant="primary"
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
                    placeholder="e.g. DLCT01-005612-2022"
                    className="flex-1 bg-black/40 border hairline rounded-xl px-3 py-2 text-xs text-main placeholder-neutral-500 font-mono focus:outline-none focus:border-blue-400"
                  />
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={handleLookupCNR}
                    loading={cnrLoading}
                    disabled={!cnrInput.trim() || cnrLoading}
                  >
                    <Search size={14} />
                  </Button>
                </div>

                {cnrError && (
                  <div className="text-[11px] text-red-400 flex items-center gap-1.5">
                    <AlertCircle size={13} />
                    <span>{cnrError}</span>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Source Verification Badge */}
        {cnrSourceVerified && (
          <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs flex items-center gap-2 font-medium">
            <CheckCircle2 size={16} />
            <span>Verified from official eCourts registry</span>
          </div>
        )}

        {/* ── Form Fields ── */}
        <div className="space-y-3">
          <div>
            <label className="text-xs font-semibold text-sub block mb-1">
              {language === 'hi' ? 'केस नंबर *' : language === 'mr' ? 'खटला क्रमांक *' : 'Case Number *'}
            </label>
            <input
              type="text"
              required
              value={caseNumber}
              onChange={e => setCaseNumber(e.target.value)}
              placeholder="e.g. CC/5210/2026 or CS/330/2024"
              className="w-full surface-inset border hairline rounded-xl px-3 py-2 text-xs text-main placeholder-neutral-500 focus:outline-none focus:border-primary font-mono"
            />
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            <div>
              <label className="text-xs font-semibold text-sub block mb-1">
                {language === 'hi' ? 'मुवक्किल (Client) *' : language === 'mr' ? 'पक्षकार (Client) *' : 'Client Name *'}
              </label>
              <input
                type="text"
                required
                value={clientName}
                onChange={e => setClientName(e.target.value)}
                placeholder="e.g. Ramesh Gupta"
                className="w-full surface-inset border hairline rounded-xl px-3 py-2 text-xs text-main placeholder-neutral-500 focus:outline-none focus:border-primary"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-sub block mb-1">
                {language === 'hi' ? 'विपक्षी पक्षकार' : language === 'mr' ? 'विरुद्ध पक्षकार' : 'Opponent / State'}
              </label>
              <input
                type="text"
                value={opponentName}
                onChange={e => setOpponentName(e.target.value)}
                placeholder="e.g. State of NCT Delhi"
                className="w-full surface-inset border hairline rounded-xl px-3 py-2 text-xs text-main placeholder-neutral-500 focus:outline-none focus:border-primary"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-sub block mb-1">
              {language === 'hi' ? 'अदालत परिसर व क्षेत्राधिकार' : language === 'mr' ? 'न्यायालय संकुल व अधिकारक्षेत्र' : 'Court Complex / Jurisdiction'}
            </label>
            <input
              type="text"
              value={courtLocation}
              onChange={e => setCourtLocation(e.target.value)}
              placeholder="e.g. City Civil & Sessions Court / High Court"
              className="w-full surface-inset border hairline rounded-xl px-3 py-2 text-xs text-main placeholder-neutral-500 focus:outline-none focus:border-primary"
            />
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            <div>
              <label className="text-xs font-semibold text-sub block mb-1">
                {language === 'hi' ? 'मामले का प्रकार' : language === 'mr' ? 'खटल्याचा प्रकार' : 'Matter Classification'}
              </label>
              <input
                type="text"
                value={caseType}
                onChange={e => setCaseType(e.target.value)}
                placeholder="Criminal / Civil / Commercial"
                className="w-full surface-inset border hairline rounded-xl px-3 py-2 text-xs text-main placeholder-neutral-500 focus:outline-none focus:border-primary"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-sub block mb-1">
                {language === 'hi' ? 'शुरुआती चरण' : language === 'mr' ? 'सुरुवातीचा टप्पा' : 'Initial Stage'}
              </label>
              <input
                type="text"
                value={stage}
                onChange={e => setStage(e.target.value)}
                placeholder="Admission / Bail / Pleadings"
                className="w-full surface-inset border hairline rounded-xl px-3 py-2 text-xs text-main placeholder-neutral-500 focus:outline-none focus:border-primary"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-sub block mb-1">
              {language === 'hi' ? 'लागू कानूनी धाराएं (कॉमा से अलग करें)' : language === 'mr' ? 'लागू कायदेशीर कलमे (स्वल्पविरामाने वेगळे करा)' : 'Act & Sections (comma separated)'}
            </label>
            <input
              type="text"
              value={actSections}
              onChange={e => setActSections(e.target.value)}
              placeholder="Section 420 IPC, Section 138 NI Act"
              className="w-full surface-inset border hairline rounded-xl px-3 py-2 text-xs text-main placeholder-neutral-500 focus:outline-none focus:border-primary font-mono"
            />
          </div>

          {/* Starter Tasks Checkbox (B-4) */}
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
                  ? `इस चरण (${stage}) के लिए मानक प्रारंभिक कार्य सूची बनाएं`
                  : language === 'mr'
                  ? `या टप्प्यासाठी (${stage}) मानक सुरुवातीची कार्ये जोडा`
                  : `Create starter tasks checklist for ${stage}`}
              </span>
            </label>
          </div>
        </div>
      </div>
    </Sheet>
  );
};
