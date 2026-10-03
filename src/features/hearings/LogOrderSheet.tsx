import React, { useState, useEffect } from 'react';
import { Sheet } from '../../design/ui/Sheet';
import { Button } from '../../design/ui/Button';
import { Mic, MicOff, Calendar, Gavel, MessageSquare, Clock } from 'lucide-react';
import { Language } from '../../types';
import { getISTDateString } from '../../lib/istDate';

export interface LogOrderData {
  hearingId?: string;
  caseNumber: string;
  clientName?: string;
  court?: string;
  outcome: string;
  nextDate: string;
  nextStage: string;
  orderNotes: string;
  notifyClient: boolean;
}

interface LogOrderSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  hearingId?: string;
  caseNumber: string;
  clientName?: string;
  court?: string;
  currentStage?: string;
  language?: Language;
  onSave: (data: LogOrderData) => Promise<void> | void;
}

export const LogOrderSheet: React.FC<LogOrderSheetProps> = ({
  open,
  onOpenChange,
  hearingId,
  caseNumber,
  clientName,
  court,
  currentStage,
  language = 'en',
  onSave,
}) => {
  const getPresetDate = (days: number): string => {
    const d = new Date();
    d.setDate(d.getDate() + days);
    return getISTDateString(d);
  };

  const [outcome, setOutcome] = useState('Adjourned / Postponed');
  const [nextDate, setNextDate] = useState(() => getPresetDate(7));
  const [nextStage, setNextStage] = useState(currentStage || 'Final Arguments');
  const [orderNotes, setOrderNotes] = useState('');
  const [notifyClient, setNotifyClient] = useState(true);
  const [isListening, setIsListening] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setNextDate(getPresetDate(7));
      setNextStage(currentStage || 'Final Arguments');
      setOrderNotes('');
      setNotifyClient(true);
    }
  }, [open, currentStage]);

  // Voice speech-to-text
  const toggleListening = () => {
    const SpeechRec = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRec) {
      alert("Speech recognition is not supported on this browser.");
      return;
    }

    if (isListening) {
      setIsListening(false);
      return;
    }

    try {
      const recognition = new SpeechRec();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = language === 'hi' ? 'hi-IN' : language === 'mr' ? 'mr-IN' : 'en-IN';

      recognition.onstart = () => setIsListening(true);
      recognition.onend = () => setIsListening(false);
      recognition.onerror = () => setIsListening(false);

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setOrderNotes(prev => prev ? `${prev} ${transcript}` : transcript);
      };

      recognition.start();
    } catch {
      setIsListening(false);
    }
  };

  const outcomePresets = [
    'Adjourned / Postponed',
    'Arguments Concluded',
    'Order Reserved',
    'Cross-Examination',
    'Passover Requested',
    'Disposed / Decided',
  ];

  const datePresets = [
    { label: '+3 Days', days: 3 },
    { label: '+1 Week', days: 7 },
    { label: '+2 Weeks', days: 14 },
    { label: '+1 Month', days: 30 },
  ];

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSave({
        hearingId,
        caseNumber,
        clientName,
        court,
        outcome,
        nextDate,
        nextStage,
        orderNotes,
        notifyClient,
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
      title={language === 'hi' ? 'अदालती आदेश दर्ज करें' : 'Log Court Order & Next Date'}
      description={`${caseNumber}${clientName ? ` · ${clientName}` : ''}${court ? ` (${court})` : ''}`}
      primary={{
        label: saving ? (language === 'hi' ? 'सहेज रहे हैं...' : 'Saving...') : (language === 'hi' ? 'आदेश व डायरी दर्ज करें' : 'Save & Attach to Diary'),
        onClick: handleSave,
        loading: saving,
      }}
      secondary={{
        label: language === 'hi' ? 'रद्द करें' : 'Cancel',
      }}
    >
      <div className="space-y-4">
        {/* Outcome Chips */}
        <div>
          <label className="text-xs font-semibold text-neutral-300 block mb-1.5">
            {language === 'hi' ? 'आज की कार्यवाही का परिणाम *' : 'Hearing Outcome / Proceeding *'}
          </label>
          <div className="flex flex-wrap gap-1.5">
            {outcomePresets.map(preset => (
              <button
                key={preset}
                type="button"
                onClick={() => setOutcome(preset)}
                className={`px-3 py-1.5 rounded-xl text-xs font-medium transition select-none ios-press ${
                  outcome === preset
                    ? 'bg-amber-400 text-black font-bold shadow-sm'
                    : 'bg-white/[0.06] text-neutral-300 hover:bg-white/[0.1]'
                }`}
              >
                {preset}
              </button>
            ))}
          </div>
        </div>

        {/* Next Date with Presets */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-xs font-semibold text-neutral-300">
              {language === 'hi' ? 'अगली सुनवाई की तारीख (Next Listing) *' : 'Next Hearing Date (Next Listing) *'}
            </label>
            <div className="flex items-center gap-1">
              {datePresets.map(p => (
                <button
                  key={p.label}
                  type="button"
                  onClick={() => setNextDate(getPresetDate(p.days))}
                  className="px-2 py-0.5 rounded-lg bg-white/[0.06] hover:bg-white/[0.12] text-[11px] font-mono text-amber-300 transition"
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>
          <div className="relative">
            <input
              type="date"
              value={nextDate}
              onChange={e => setNextDate(e.target.value)}
              className="w-full bg-white/[0.05] border border-white/[0.12] rounded-2xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-amber-400/50 font-mono"
            />
          </div>
        </div>

        {/* Next Stage / Purpose */}
        <div>
          <label className="text-xs font-semibold text-neutral-300 block mb-1.5">
            {language === 'hi' ? 'अगला चरण / उद्देश्य *' : 'Next Stage / Purpose *'}
          </label>
          <input
            type="text"
            value={nextStage}
            onChange={e => setNextStage(e.target.value)}
            placeholder="e.g. Final Arguments, Cross Examination, Framing Issues"
            className="w-full bg-white/[0.05] border border-white/[0.12] rounded-2xl px-3.5 py-2.5 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-amber-400/50"
          />
        </div>

        {/* Order Notes / Dictation */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-xs font-semibold text-neutral-300">
              {language === 'hi' ? 'कोर्ट आदेश व टिप्पणियाँ' : 'Court Order Notes & Dictation'}
            </label>
            <button
              type="button"
              onClick={toggleListening}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-medium transition ${
                isListening
                  ? 'bg-red-500 text-white animate-pulse'
                  : 'bg-white/[0.08] hover:bg-white/[0.14] text-neutral-300'
              }`}
            >
              {isListening ? <MicOff size={13} /> : <Mic size={13} />}
              <span>{isListening ? 'Listening...' : 'Voice Dictate'}</span>
            </button>
          </div>
          <textarea
            rows={3}
            value={orderNotes}
            onChange={e => setOrderNotes(e.target.value)}
            placeholder={
              language === 'hi'
                ? 'न्यायालय द्वारा दिए गए मौखिक निर्देश या आदेश सारांश दर्ज करें...'
                : 'Dictate or write oral directions, interim relief, or court proceedings...'
            }
            className="w-full bg-white/[0.05] border border-white/[0.12] rounded-2xl p-3 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-amber-400/50 resize-none leading-relaxed"
          />
        </div>

        {/* Notify Client Toggle */}
        <div className="flex items-center justify-between p-3 rounded-2xl bg-white/[0.04] border border-white/[0.08]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-amber-400/10 flex items-center justify-center text-amber-300">
              <MessageSquare size={16} />
            </div>
            <div>
              <p className="text-xs font-semibold text-white">
                {language === 'hi' ? 'मुवक्किल को चैट में तुरंत सूचित करें' : 'Post Court Update in Client Chat'}
              </p>
              <p className="text-[11px] text-neutral-400">
                {language === 'hi' ? 'अगली तारीख और आदेश सारांश स्वतः भेजा जाएगा' : 'Auto-sends next hearing date & order summary'}
              </p>
            </div>
          </div>
          <input
            type="checkbox"
            checked={notifyClient}
            onChange={e => setNotifyClient(e.target.checked)}
            className="w-4 h-4 rounded text-amber-400 focus:ring-0 bg-neutral-900 border-white/20"
          />
        </div>
      </div>
    </Sheet>
  );
};
