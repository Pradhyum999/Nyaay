import React, { useState, useEffect, useMemo } from 'react';
import { Sheet } from '../../design/ui/Sheet';
import { HearingItem, CaseFile, Language } from '../../types';
import { normaliseCaseNumber } from '../../lib/caseNumber';
import { AlertCircle, Clock, MapPin, Building, ChevronDown, Check } from 'lucide-react';
import { TimePicker } from '../../design/ui/TimePicker';
import { getISTDateString } from '../../lib/istDate';
import {
  INDIAN_COURT_COMPLEXES,
  PREDEFINED_INITIAL_STAGES,
  getHallsForCourtComplex,
} from '../../config/courtsData';

interface HearingFormSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  cases?: CaseFile[];
  hearings?: HearingItem[];
  initialData?: Partial<HearingItem>;
  language?: Language;
  onSave: (hearing: Omit<HearingItem, 'id'> & { id?: string }) => Promise<void> | void;
}

export const HearingFormSheet: React.FC<HearingFormSheetProps> = ({
  open,
  onOpenChange,
  cases = [],
  hearings = [],
  initialData,
  language = 'en',
  onSave,
}) => {
  const t = (en: string, hi: string, mr: string) => {
    if (language === 'mr') return mr;
    if (language === 'hi') return hi;
    return en;
  };

  const isEditMode = Boolean(initialData?.id);

  const [caseNumber, setCaseNumber] = useState(initialData?.caseNumber || '');
  const [clientName, setClientName] = useState(initialData?.clientName || '');
  const [courtName, setCourtName] = useState(initialData?.courtName || '');
  const [courtRoom, setCourtRoom] = useState(initialData?.courtRoom || '');
  const [judgeName, setJudgeName] = useState(initialData?.judgeName || '');
  const [hearingDate, setHearingDate] = useState(() => {
    if (initialData?.hearingDate) {
      const match = initialData.hearingDate.match(/\d{4}-\d{2}-\d{2}/);
      if (match) return match[0];
    }
    return getISTDateString();
  });
  const [hearingTime, setHearingTime] = useState(initialData?.hearingTime || '10:30 AM');
  const [stage, setStage] = useState(initialData?.stage || 'Final Arguments');
  const [hearingError, setHearingError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [customItemNumber, setCustomItemNumber] = useState<number | null>(null);

  // Suggestions state for Court Complex
  const [courtSuggestions, setCourtSuggestions] = useState<string[]>([]);
  const [showCourtDropdown, setShowCourtDropdown] = useState(false);

  // Dynamic halls list based on selected Court Complex (Suggestion 2)
  const availableHalls = useMemo(() => {
    return getHallsForCourtComplex(courtName);
  }, [courtName]);

  // Form Reset After Submission & On Open (Bug 3)
  const resetForm = () => {
    setCaseNumber(initialData?.caseNumber || '');
    setClientName(initialData?.clientName || '');
    setCourtName(initialData?.courtName || '');
    setCourtRoom(initialData?.courtRoom || '');
    setJudgeName(initialData?.judgeName || '');
    if (initialData?.hearingDate) {
      const match = initialData.hearingDate.match(/\d{4}-\d{2}-\d{2}/);
      if (match) setHearingDate(match[0]);
      else setHearingDate(getISTDateString());
    } else {
      setHearingDate(getISTDateString());
    }
    setHearingTime(initialData?.hearingTime || '10:30 AM');
    setStage(initialData?.stage || 'Final Arguments');
    setCustomItemNumber(initialData?.itemNumber || null);
    setHearingError(null);
    setShowCourtDropdown(false);
  };

  useEffect(() => {
    if (open) {
      resetForm();
    }
  }, [open, initialData]);

  // When court complex changes, filter suggestions
  const handleCourtComplexChange = (val: string) => {
    setCourtName(val);
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

  const handleSelectCourtComplex = (name: string) => {
    setCourtName(name);
    setShowCourtDropdown(false);
    // Auto-select first hall if none selected
    const halls = getHallsForCourtComplex(name);
    if (halls.length > 0 && !courtRoom) {
      setCourtRoom(halls[0]);
    }
  };

  const handleCaseSelect = (selectedNum: string) => {
    setCaseNumber(selectedNum);
    setCustomItemNumber(null); // Recalculate auto-increment for the newly selected case
    const found = cases.find(c => c.caseNumber === selectedNum);
    if (found) {
      setClientName(found.clientName);
      if (found.courtLocation) {
        setCourtName(found.courtLocation);
        const halls = getHallsForCourtComplex(found.courtLocation);
        if (halls.length > 0) setCourtRoom(halls[0]);
      }
      if (found.stage) setStage(found.stage as any);
    }
  };

  // Auto-generate item number per case (Bug 5: Auto-increment per case; on another case starts again from 1)
  const generatedItemNumber = useMemo(() => {
    if (initialData?.itemNumber) return initialData.itemNumber;
    if (!caseNumber.trim()) return 1;
    const currentCaseNum = normaliseCaseNumber(caseNumber);
    const caseHearings = (hearings || []).filter(h =>
      normaliseCaseNumber(h.caseNumber) === currentCaseNum && (!initialData?.id || h.id !== initialData.id)
    );
    const maxItem = caseHearings.reduce((max, h) => Math.max(max, h.itemNumber || 0), 0);
    return maxItem > 0 ? maxItem + 1 : (caseHearings.length + 1);
  }, [caseNumber, hearings, initialData?.id, initialData?.itemNumber]);

  const activeItemNumber = customItemNumber !== null ? customItemNumber : generatedItemNumber;

  const handleSubmit = async () => {
    if (!caseNumber.trim()) return;
    setSaving(true);
    setHearingError(null);

    // Duplicate Hearing Prevention:
    // Block duplicate hearings ONLY for the SAME CASE on the same date and time!
    // Multiple different cases CAN be scheduled at the same date and time (e.g. 10:30 AM Cause List)
    const currentNormCase = normaliseCaseNumber(caseNumber);
    const isDuplicateForSameCase = (hearings || []).some(h => {
      if (initialData?.id && h.id === initialData.id) return false;
      const isSameCase = normaliseCaseNumber(h.caseNumber) === currentNormCase;
      if (!isSameCase) return false; // Allowed for different cases!
      const sameDate = h.hearingDate?.startsWith(hearingDate) || h.hearingDate?.includes(hearingDate);
      const sameTime = hearingTime.trim() && h.hearingTime?.trim().toLowerCase() === hearingTime.trim().toLowerCase();
      return sameDate && sameTime;
    });

    if (isDuplicateForSameCase) {
      setHearingError(
        language === 'hi'
          ? `केस "${caseNumber}" के लिए इस तारीख (${hearingDate}) और समय (${hearingTime}) पर पहले से ही एक सुनवाई मौजूद है।`
          : language === 'mr'
          ? `केस "${caseNumber}" साठी या तारखेला (${hearingDate}) आणि वेळेवर (${hearingTime}) आधीच एक सुनावणी अस्तित्वात आहे.`
          : `A hearing for case "${caseNumber}" is already scheduled on this date (${hearingDate}) at ${hearingTime}.`
      );
      setSaving(false);
      return;
    }

    try {
      await onSave({
        ...(initialData?.id ? { id: initialData.id } : {}),
        caseNumber: normaliseCaseNumber(caseNumber),
        clientName: clientName.trim() || 'Client',
        courtName,
        courtRoom,
        judgeName,
        hearingDate: `${hearingDate}, ${hearingTime}`,
        hearingTime,
        itemNumber: activeItemNumber,
        stage: stage as any,
        purposeEn: stage,
        purposeHi: stage,
      });

      // Reset form on success (Bug 3)
      resetForm();
      onOpenChange(false);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Sheet
      open={open}
      onOpenChange={onOpenChange}
      title={
        isEditMode
          ? t('Edit Hearing Details', 'सुनवाई विवरण संपादित करें', 'सुनावणी तपशील संपादित करा')
          : t('Add Hearing to Cause List', 'नई सुनवाई जोड़ें', 'नवीन सुनावणी जोडा')
      }
      description={
        isEditMode
          ? t('Update scheduled time, courtroom and listing details', 'मौजूदा सुनवाई का समय, कोर्ट हॉल और चरण बदलें', 'अनुसूचित वेळ, न्यायालय दालन आणि यादी तपशील अद्ययावत करा')
          : t('Record matter date, courtroom and cause list item', 'केस नंबर, अदालत, कमरा और समय दर्ज करें', 'प्रकरण दिनांक, न्यायालय दालन आणि कॉज लिस्ट नोंदवा')
      }
      primary={{
        label: saving
          ? t('Saving...', 'सहेजा जा रहा है...', 'जतन करत आहे...')
          : isEditMode
          ? t('Save Changes', 'सुनवाई अपडेट करें', 'बदल जतन करा')
          : t('Schedule Hearing', 'सुनवाई दर्ज करें', 'सुनावणी निश्चित करा'),
        onClick: handleSubmit,
        loading: saving,
        disabled: !caseNumber.trim(),
      }}
      secondary={{
        label: t('Cancel', 'रद्द करें', 'रद्द करा'),
      }}
    >
      <div className="space-y-3.5">
        {hearingError && (
          <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 flex items-start gap-2 text-xs text-red-400 animate-in fade-in">
            <AlertCircle size={15} className="shrink-0 mt-0.5" />
            <span>{hearingError}</span>
          </div>
        )}

        {/* Case Selector / Manual Case Number */}
        <div>
          <label className="text-xs font-semibold text-neutral-300 block mb-1">
            {t('Case Number *', 'केस नंबर *', 'केस क्रमांक *')}
          </label>
          {cases.length > 0 && !isEditMode && (
            <select
              value={caseNumber}
              onChange={e => handleCaseSelect(e.target.value)}
              className="w-full bg-neutral-900 border border-white/[0.12] rounded-xl px-3 py-2 text-xs text-white mb-2 focus:outline-none focus:border-amber-400 font-mono"
            >
              <option value="">{t('-- Select Existing Case (Optional) --', '-- मौजूदा केस चुनें (वैकल्पिक) --', '-- अस्तित्वात असलेली केस निवडा (पर्यायी) --')}</option>
              {cases.map(c => (
                <option key={c.caseNumber} value={c.caseNumber}>
                  {c.caseNumber} - {c.clientName}
                </option>
              ))}
            </select>
          )}
          <input
            type="text"
            required
            value={caseNumber}
            onChange={e => setCaseNumber(e.target.value)}
            placeholder={t('e.g. CC/4128/2026 or CRL.A./882/2025', 'उदा. CC/4128/2026 या CRL.A./882/2025', 'उदा. CC/4128/2026 किंवा CRL.A./882/2025')}
            className="w-full bg-white/[0.05] border border-white/[0.12] rounded-xl px-3 py-2 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-amber-400 font-mono"
          />
        </div>

        {/* Client / Parties */}
        <div>
          <label className="text-xs font-semibold text-neutral-300 block mb-1">
            {t('Client / Parties *', 'पक्षकार / मुवक्किल *', 'पक्षकार / अशिल *')}
          </label>
          <input
            type="text"
            required
            value={clientName}
            onChange={e => setClientName(e.target.value)}
            placeholder={t('e.g. State vs. Accused', 'उदा. शासन विरुद्ध आरोपी / वादी', 'उदा. शासन विरुद्ध आरोपी / वादी')}
            className="w-full bg-white/[0.05] border border-white/[0.12] rounded-xl px-3 py-2 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-amber-400"
          />
        </div>

        {/* Date and Time (Suggestion 1: Time Picker) */}
        <div className="grid grid-cols-2 gap-2.5">
          <div>
            <label className="text-xs font-semibold text-neutral-300 block mb-1">
              {t('Hearing Date *', 'सुनवाई की तारीख *', 'सुनावणीची तारीख *')}
            </label>
            <input
              type="date"
              required
              value={hearingDate}
              onChange={e => setHearingDate(e.target.value)}
              className="w-full bg-white/[0.05] border border-white/[0.12] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-400 font-mono"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-neutral-300 block mb-1">
              {t('Hearing Time (Picker) *', 'समय (Time Picker) *', 'सुनावणीची वेळ (Time Picker) *')}
            </label>
            <TimePicker
              value={hearingTime}
              onChange={t => setHearingTime(t)}
              placeholder="e.g. 10:30 AM"
            />
          </div>
        </div>

        {/* Court Complex / Location with Searchable Dropdown (Suggestion 2) */}
        <div className="relative">
          <label className="text-xs font-semibold text-neutral-300 block mb-1">
            {t('Court Complex / Location (Searchable)', 'न्यायालय परिसर (सुझाव अनुसार)', 'न्यायालय संकुल / ठिकाण (शोधण्यायोग्य)')}
          </label>
          <div className="relative">
            <input
              type="text"
              value={courtName}
              onChange={e => handleCourtComplexChange(e.target.value)}
              onFocus={() => {
                if (courtSuggestions.length > 0) setShowCourtDropdown(true);
              }}
              placeholder={t('Type to search: e.g. Tis Hazari, Saket, High Court, NCLT...', 'खोजने के लिए टाइप करें: उदा. तीस हजारी, साकेत, उच्च न्यायालय...', 'शोधण्यासाठी टाइप करा: उदा. तीस हजारी, साकेत, उच्च न्यायालय...')}
              className="w-full bg-white/[0.05] border border-white/[0.12] rounded-xl px-3 py-2 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-amber-400"
            />
            <Building size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 pointer-events-none" />
          </div>

          {/* Autocomplete Dropdown List */}
          {showCourtDropdown && courtSuggestions.length > 0 && (
            <div className="absolute z-40 left-0 right-0 mt-1 max-h-48 overflow-y-auto bg-neutral-950 border border-white/[0.16] rounded-xl shadow-2xl p-1.5 space-y-1 animate-in fade-in">
              {courtSuggestions.map(suggestion => (
                <div
                  key={suggestion}
                  onClick={() => handleSelectCourtComplex(suggestion)}
                  className="px-3 py-1.5 rounded-lg text-xs text-neutral-200 hover:text-white hover:bg-amber-400/15 cursor-pointer flex items-center justify-between transition"
                >
                  <span className="truncate">{suggestion}</span>
                  {courtName === suggestion && <Check size={13} className="text-amber-400" />}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Court Room / Hall: Location-Based Dropdown (Suggestion 2) */}
        <div className="grid grid-cols-2 gap-2.5">
          <div>
            <label className="text-xs font-semibold text-neutral-300 block mb-1">
              {t('Court Room / Hall (Dropdown)', 'कोर्ट हॉल / कमरा (स्थान अनुसार)', 'न्यायालय दालन / कक्ष (स्थान अनुसार)')}
            </label>
            <select
              value={courtRoom}
              onChange={e => setCourtRoom(e.target.value)}
              className="w-full bg-neutral-900 border border-white/[0.12] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-400"
            >
              <option value="">{t('-- Select Hall / Room --', '-- हॉल चुनें --', '-- दालन निवडा --')}</option>
              {availableHalls.map(hall => (
                <option key={hall} value={hall}>
                  {hall}
                </option>
              ))}
              <option value="Custom Room">{t('Custom / Other Chamber', 'अन्य कक्ष / विशेष न्यायालय', 'इतर कक्ष / विशेष न्यायालय')}</option>
            </select>
          </div>

          {/* Item Number (Auto-increment per case) */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-semibold text-neutral-300">
                {t('Item Number (Per Case)', 'आइटम नंबर (केस अनुसार)', 'आयटम क्रमांक (केस अनुसार)')}
              </label>
              <span className="text-[10px] text-amber-400 font-mono">
                #{generatedItemNumber}
              </span>
            </div>
            <div className="relative">
              <input
                type="number"
                min="1"
                value={activeItemNumber}
                onChange={e => setCustomItemNumber(parseInt(e.target.value, 10) || 1)}
                className="w-full bg-white/[0.05] border border-white/[0.12] rounded-xl px-3 py-2 text-xs text-amber-300 font-mono font-bold focus:outline-none focus:border-amber-400"
                placeholder={t('Item Number', 'आइटम नंबर', 'आयटम क्रमांक')}
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-neutral-400 font-sans pointer-events-none">
                {t('Auto per case', 'केस अनुसार स्वतः', 'केस अनुसार स्वयंचलित')}
              </span>
            </div>
          </div>
        </div>

        {/* Stage / Purpose Dropdown (Suggestion 5) */}
        <div>
          <label className="text-xs font-semibold text-neutral-300 block mb-1">
            {t('Hearing Stage / Purpose', 'सुनवाई का चरण (Stage)', 'सुनावणीचा टप्पा / उद्देश')}
          </label>
          <select
            value={stage}
            onChange={e => setStage(e.target.value as any)}
            className="w-full bg-neutral-900 border border-white/[0.12] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-400"
          >
            {PREDEFINED_INITIAL_STAGES.map(st => (
              <option key={st} value={st}>
                {st}
              </option>
            ))}
          </select>
        </div>
      </div>
    </Sheet>
  );
};
