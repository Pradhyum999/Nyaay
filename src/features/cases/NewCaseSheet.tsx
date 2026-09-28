import React, { useState } from 'react';
import { Sheet } from '../../design/ui/Sheet';
import { CaseFile, Language } from '../../types';
import { normaliseCaseNumber } from '../../lib/caseNumber';

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
  const [caseNumber, setCaseNumber] = useState('');
  const [clientName, setClientName] = useState('');
  const [opponentName, setOpponentName] = useState('');
  const [courtLocation, setCourtLocation] = useState('Tis Hazari District Court');
  const [caseType, setCaseType] = useState('Criminal (Bail & Trial)');
  const [actSections, setActSections] = useState('Section 420 IPC / 318 BNS');
  const [stage, setStage] = useState('Institution & Notice');
  const [saving, setSaving] = useState(false);

  const handleSubmit = async () => {
    if (!caseNumber.trim() || !clientName.trim()) return;
    setSaving(true);
    try {
      await onSave({
        caseNumber: normaliseCaseNumber(caseNumber),
        clientName: clientName.trim(),
        clientPhone: '',
        opponentName: opponentName.trim() || 'State',
        courtLocation,
        court: 'District Court',
        caseType,
        actSections: actSections.split(',').map(s => s.trim()).filter(Boolean),
        status: 'Active',
        stage: 'Admission',
        filingDate: new Date().toISOString().split('T')[0],
        nextHearingDate: 'TBD',
        unreadDocuments: 0,
        pendingChecklistItems: 0,
        totalBilled: 0,
        totalCollected: 0,
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
      title={language === 'hi' ? 'नया केस खोलें' : 'Create New Case Dossier'}
      description={language === 'hi' ? 'केस नंबर, पक्षकार और अदालत की जानकारी दर्ज करें' : 'Register a matter dossier, attach client, court & stage'}
      primary={{
        label: saving ? 'Creating...' : (language === 'hi' ? 'केस फाइल सहेजें' : 'Open Case File'),
        onClick: handleSubmit,
        loading: saving,
        disabled: !caseNumber.trim() || !clientName.trim(),
      }}
      secondary={{
        label: language === 'hi' ? 'रद्द करें' : 'Cancel',
      }}
    >
      <div className="space-y-3.5">
        <div>
          <label className="text-xs font-semibold text-neutral-300 block mb-1">
            {language === 'hi' ? 'केस नंबर *' : 'Case Number *'}
          </label>
          <input
            type="text"
            required
            value={caseNumber}
            onChange={e => setCaseNumber(e.target.value)}
            placeholder="e.g. CC/5210/2026 or CS/330/2024"
            className="w-full bg-white/[0.05] border border-white/[0.12] rounded-xl px-3 py-2 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-amber-400 font-mono"
          />
        </div>

        <div className="grid grid-cols-2 gap-2.5">
          <div>
            <label className="text-xs font-semibold text-neutral-300 block mb-1">
              {language === 'hi' ? 'मुवक्किल (Client) *' : 'Client Name *'}
            </label>
            <input
              type="text"
              required
              value={clientName}
              onChange={e => setClientName(e.target.value)}
              placeholder="e.g. Ramesh Gupta"
              className="w-full bg-white/[0.05] border border-white/[0.12] rounded-xl px-3 py-2 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-amber-400"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-neutral-300 block mb-1">
              {language === 'hi' ? 'विपक्षी पक्षकार' : 'Opponent / State'}
            </label>
            <input
              type="text"
              value={opponentName}
              onChange={e => setOpponentName(e.target.value)}
              placeholder="e.g. State of NCT Delhi"
              className="w-full bg-white/[0.05] border border-white/[0.12] rounded-xl px-3 py-2 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-amber-400"
            />
          </div>
        </div>

        <div>
          <label className="text-xs font-semibold text-neutral-300 block mb-1">
            {language === 'hi' ? 'अदालत परिसर व क्षेत्राधिकार' : 'Court Complex / Jurisdiction'}
          </label>
          <input
            type="text"
            value={courtLocation}
            onChange={e => setCourtLocation(e.target.value)}
            placeholder="Tis Hazari / Saket / High Court"
            className="w-full bg-white/[0.05] border border-white/[0.12] rounded-xl px-3 py-2 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-amber-400"
          />
        </div>

        <div className="grid grid-cols-2 gap-2.5">
          <div>
            <label className="text-xs font-semibold text-neutral-300 block mb-1">
              {language === 'hi' ? 'मामले का प्रकार' : 'Matter Classification'}
            </label>
            <input
              type="text"
              value={caseType}
              onChange={e => setCaseType(e.target.value)}
              placeholder="Criminal / Civil / Commercial"
              className="w-full bg-white/[0.05] border border-white/[0.12] rounded-xl px-3 py-2 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-amber-400"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-neutral-300 block mb-1">
              {language === 'hi' ? 'शुरुआती चरण' : 'Initial Stage'}
            </label>
            <input
              type="text"
              value={stage}
              onChange={e => setStage(e.target.value)}
              placeholder="Pleadings / Summons / Bail"
              className="w-full bg-white/[0.05] border border-white/[0.12] rounded-xl px-3 py-2 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-amber-400"
            />
          </div>
        </div>

        <div>
          <label className="text-xs font-semibold text-neutral-300 block mb-1">
            {language === 'hi' ? 'लागू कानूनी धाराएं (कॉमा से अलग करें)' : 'Act & Sections (comma separated)'}
          </label>
          <input
            type="text"
            value={actSections}
            onChange={e => setActSections(e.target.value)}
            placeholder="Section 420 IPC, Section 138 NI Act"
            className="w-full bg-white/[0.05] border border-white/[0.12] rounded-xl px-3 py-2 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-amber-400 font-mono"
          />
        </div>
      </div>
    </Sheet>
  );
};
