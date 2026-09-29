import React, { useState } from 'react';
import { Sheet } from '../../design/ui/Sheet';
import { HearingItem, Language, CaseFile } from '../../types';
import { normaliseCaseNumber } from '../../lib/caseNumber';

interface HearingFormSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  cases?: CaseFile[];
  initialData?: Partial<HearingItem>;
  language?: Language;
  onSave: (hearing: Omit<HearingItem, 'id'>) => Promise<void> | void;
}

export const HearingFormSheet: React.FC<HearingFormSheetProps> = ({
  open,
  onOpenChange,
  cases = [],
  initialData,
  language = 'en',
  onSave,
}) => {
  const [caseNumber, setCaseNumber] = useState(initialData?.caseNumber || '');
  const [clientName, setClientName] = useState(initialData?.clientName || '');
  const [courtName, setCourtName] = useState(initialData?.courtName || '');
  const [courtRoom, setCourtRoom] = useState(initialData?.courtRoom || '');
  const [judgeName, setJudgeName] = useState(initialData?.judgeName || '');
  const [hearingDate, setHearingDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().split('T')[0];
  });
  const [hearingTime, setHearingTime] = useState(initialData?.hearingTime || '');
  const [itemNumber, setItemNumber] = useState<number>(initialData?.itemNumber || 1);
  const [stage, setStage] = useState(initialData?.stage || '');
  const [saving, setSaving] = useState(false);

  // When a case is selected from existing cases, auto-fill details
  const handleSelectCase = (cNumber: string) => {
    setCaseNumber(cNumber);
    const found = cases.find(c => c.caseNumber === cNumber);
    if (found) {
      setClientName(found.clientName);
      if (found.courtLocation) setCourtName(found.courtLocation);
      if (found.stage) setStage(found.stage as any);
    }
  };

  const handleSubmit = async () => {
    if (!caseNumber.trim()) return;
    setSaving(true);
    try {
      await onSave({
        caseNumber: normaliseCaseNumber(caseNumber),
        clientName: clientName.trim() || 'Client',
        courtName,
        courtRoom,
        judgeName,
        hearingDate: `${hearingDate}, ${hearingTime}`,
        hearingTime,
        itemNumber,
        stage: stage as any,
        purposeEn: stage,
        purposeHi: stage,
      });
      onOpenChange(false);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Sheet
      open={open}
      onOpenChange={onOpenChange}
      title={language === 'hi' ? 'नई सुनवाई जोड़ें' : 'Add Hearing to Cause List'}
      description={language === 'hi' ? 'केस नंबर, अदालत, कमरा और समय दर्ज करें' : 'Record matter date, courtroom and cause list item'}
      primary={{
        label: saving ? 'Saving...' : (language === 'hi' ? 'सुनवाई दर्ज करें' : 'Schedule Hearing'),
        onClick: handleSubmit,
        loading: saving,
        disabled: !caseNumber.trim(),
      }}
      secondary={{
        label: language === 'hi' ? 'रद्द करें' : 'Cancel',
      }}
    >
      <div className="space-y-3.5">
        {/* Case selector or input */}
        <div>
          <label className="text-xs font-semibold text-neutral-300 block mb-1">
            {language === 'hi' ? 'केस नंबर *' : 'Case Number *'}
          </label>
          {cases.length > 0 && (
            <select
              value={caseNumber}
              onChange={e => handleSelectCase(e.target.value)}
              className="w-full mb-1.5 bg-neutral-900 border border-white/[0.12] rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
            >
              <option value="">-- Select from My Cases --</option>
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
            placeholder="e.g. CC/4128/2026 or CRL.A./882/2025"
            className="w-full bg-white/[0.05] border border-white/[0.12] rounded-xl px-3 py-2 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-amber-400 font-mono"
          />
        </div>

        {/* Client / Parties */}
        <div>
          <label className="text-xs font-semibold text-neutral-300 block mb-1">
            {language === 'hi' ? 'पक्षकार / मुवक्किल *' : 'Client / Parties *'}
          </label>
          <input
            type="text"
            required
            value={clientName}
            onChange={e => setClientName(e.target.value)}
            placeholder="e.g. State vs. Accused"
            className="w-full bg-white/[0.05] border border-white/[0.12] rounded-xl px-3 py-2 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-amber-400"
          />
        </div>

        {/* Date and Time */}
        <div className="grid grid-cols-2 gap-2.5">
          <div>
            <label className="text-xs font-semibold text-neutral-300 block mb-1">
              {language === 'hi' ? 'सुनवाई की तारीख *' : 'Hearing Date *'}
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
              {language === 'hi' ? 'समय' : 'Hearing Time'}
            </label>
            <input
              type="text"
              value={hearingTime}
              onChange={e => setHearingTime(e.target.value)}
              placeholder="e.g. 10:30 AM"
              className="w-full bg-white/[0.05] border border-white/[0.12] rounded-xl px-3 py-2 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-amber-400 font-mono"
            />
          </div>
        </div>

        {/* Court and Court Room */}
        <div className="grid grid-cols-2 gap-2.5">
          <div>
            <label className="text-xs font-semibold text-neutral-300 block mb-1">
              {language === 'hi' ? 'कोर्ट हॉल / कमरा' : 'Court Room / Hall'}
            </label>
            <input
              type="text"
              value={courtRoom}
              onChange={e => setCourtRoom(e.target.value)}
              placeholder="e.g. Room 04 / Court Hall 2"
              className="w-full bg-white/[0.05] border border-white/[0.12] rounded-xl px-3 py-2 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-amber-400"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-neutral-300 block mb-1">
              {language === 'hi' ? 'आइटम नंबर' : 'Item Number'}
            </label>
            <input
              type="number"
              value={itemNumber}
              onChange={e => setItemNumber(parseInt(e.target.value) || 1)}
              className="w-full bg-white/[0.05] border border-white/[0.12] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-400 font-mono"
            />
          </div>
        </div>

        {/* Court Name & Judge */}
        <div>
          <label className="text-xs font-semibold text-neutral-300 block mb-1">
            {language === 'hi' ? 'न्यायालय परिसर' : 'Court Complex / Location'}
          </label>
          <input
            type="text"
            value={courtName}
            onChange={e => setCourtName(e.target.value)}
            placeholder="e.g. District & Sessions Court"
            className="w-full bg-white/[0.05] border border-white/[0.12] rounded-xl px-3 py-2 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-amber-400"
          />
        </div>

        {/* Stage */}
        <div>
          <label className="text-xs font-semibold text-neutral-300 block mb-1">
            {language === 'hi' ? 'सुनवाई का चरण (Stage)' : 'Hearing Stage / Purpose'}
          </label>
          <input
            type="text"
            value={stage}
            onChange={e => setStage(e.target.value as any)}
            placeholder="Arguments, Cross Examination, Bail"
            className="w-full bg-white/[0.05] border border-white/[0.12] rounded-xl px-3 py-2 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-amber-400"
          />
        </div>
      </div>
    </Sheet>
  );
};
