import React, { useState } from 'react';
import { AlertCircle, Calendar, ChevronRight, CheckCircle2, Gavel, Mic, MicOff, Sparkles, Clock, MapPin, User, Plus } from 'lucide-react';
import { HearingItem, LimitationAlert, Language } from '../types';
import { translations } from '../i18n/translations';

interface VirtualCaseDiaryProps {
  hearings: HearingItem[];
  limitationAlerts: LimitationAlert[];
  language: Language;
  onUpdateHearingOrder: (hearingId: string, orderNotes: string, nextDate: string) => void;
  onOpenCaseDetails: (caseNumber: string) => void;
  onAddHearing?: (newHearing: Omit<HearingItem, 'id'>) => void;
}

export const VirtualCaseDiary: React.FC<VirtualCaseDiaryProps> = ({
  hearings,
  limitationAlerts,
  language,
  onUpdateHearingOrder,
  onOpenCaseDetails,
  onAddHearing
}) => {
  const t = translations[language];
  const [selectedCourtFilter, setSelectedCourtFilter] = useState<string>('All');
  const [activeModalHearing, setActiveModalHearing] = useState<HearingItem | null>(null);
  const [orderSummaryText, setOrderSummaryText] = useState<string>('');
  const [nextDateInput, setNextDateInput] = useState<string>('2026-10-14');
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isDictating, setIsDictating] = useState<boolean>(false);
  const [showAddHearingModal, setShowAddHearingModal] = useState<boolean>(false);

  // New hearing state
  const [newCaseNumber, setNewCaseNumber] = useState('');
  const [newClientName, setNewClientName] = useState('');
  const [newCourtName, setNewCourtName] = useState('Delhi High Court');
  const [newPurpose, setNewPurpose] = useState('');
  const [newHearingTime, setNewHearingTime] = useState('10:30 AM');

  const filteredHearings = hearings.filter(h => {
    if (selectedCourtFilter === 'All') return true;
    return h.courtName.toLowerCase().includes(selectedCourtFilter.toLowerCase());
  });

  const handleOpenOrderModal = (hearing: HearingItem) => {
    setActiveModalHearing(hearing);
    setOrderSummaryText(hearing.previousOrderSummaryEn || '');
  };

  const handleSaveOrder = () => {
    if (activeModalHearing) {
      onUpdateHearingOrder(activeModalHearing.id, orderSummaryText, nextDateInput);
      setActiveModalHearing(null);
      setToastMessage(t.orderLoggedSuccessfully);
      setTimeout(() => setToastMessage(null), 3000);
    }
  };

  const toggleDictation = () => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      setToastMessage(language === 'en' ? 'Voice dictation not supported in this browser' : 'इस ब्राउज़र में वॉयस डिक्टेशन उपलब्ध नहीं है');
      setTimeout(() => setToastMessage(null), 3000);
      return;
    }

    if (isDictating) {
      setIsDictating(false);
      return;
    }

    try {
      // @ts-ignore
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
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

      recognition.onerror = () => {
        setIsDictating(false);
      };

      recognition.onend = () => {
        setIsDictating(false);
      };
    } catch {
      setIsDictating(false);
    }
  };

  const handleCreateHearing = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCaseNumber || !newClientName) return;

    if (onAddHearing) {
      onAddHearing({
        caseNumber: newCaseNumber,
        clientName: newClientName,
        courtName: newCourtName,
        itemNumber: hearings.length + 1,
        courtRoom: "Court No. 04",
        judgeName: "Hon'ble Presiding Officer",
        stage: "Admission",
        hearingDate: "Tomorrow, 10:30 AM",
        hearingTime: newHearingTime,
        purposeEn: newPurpose || "Preliminary Hearing & Arguments",
        purposeHi: newPurpose || "प्रारंभिक सुनवाई एवं बहस",
        isUrgent: false
      });
      setShowAddHearingModal(false);
      setNewCaseNumber('');
      setNewClientName('');
      setNewPurpose('');
      setToastMessage(language === 'en' ? 'Hearing added to Cause List!' : 'वाद तालिका में सुनवाई जोड़ी गई!');
      setTimeout(() => setToastMessage(null), 3000);
    }
  };

  return (
    <div className="flex flex-col gap-5 p-4 sm:p-6 pb-28">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="sticky top-2 z-40 bg-neutral-900/95 text-white border border-emerald-500/40 px-4 py-2.5 rounded-2xl shadow-2xl backdrop-blur-2xl flex items-center gap-2 text-xs font-medium animate-in fade-in">
          <CheckCircle2 size={15} className="text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Hero Header: Linear-grade Typography with Live Court Pulse */}
      <div className="flex items-start justify-between pt-1">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-[10px] font-mono text-emerald-400 font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-radar" />
              BENCH IN SESSION
            </span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white font-display">
            {t.todaysCauseList}
          </h1>
          <p className="text-xs text-neutral-400 mt-0.5">
            {filteredHearings.length} {language === 'en' ? 'active listings scheduled' : 'मामले आज सूचीबद्ध हैं'}
          </p>
        </div>

        <button
          onClick={() => setShowAddHearingModal(true)}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white text-black font-semibold text-xs transition-all hover:bg-neutral-200 ios-press shadow-[0_2px_12px_rgba(255,255,255,0.2)]"
        >
          <Plus size={14} strokeWidth={2.5} />
          <span>{language === 'en' ? 'Add Hearing' : 'सुनवाई जोड़ें'}</span>
        </button>
      </div>

      {/* Statutory Limitation Watch (Cinematic Urgency Card) */}
      <section className="glass-card rounded-3xl p-4 border border-rose-500/25 bg-gradient-to-b from-rose-950/25 via-black to-black relative overflow-hidden">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-xl bg-rose-500/20 border border-rose-500/30 flex items-center justify-center text-rose-400">
              <AlertCircle size={15} />
            </div>
            <div>
              <h3 className="text-xs font-semibold tracking-tight text-neutral-100">
                {t.limitationWatch}
              </h3>
              <p className="text-[10px] text-rose-300/80 font-mono">
                {language === 'en' ? 'Statutory Deadlines (CPC / CrPC / NI Act)' : 'वैधानिक समय-सीमा अलर्ट'}
              </p>
            </div>
          </div>
          <span className="text-[10px] font-mono font-medium text-rose-400 bg-rose-500/10 px-2.5 py-0.5 rounded-full border border-rose-500/25">
            {limitationAlerts.length} Critical
          </span>
        </div>

        <div className="space-y-2">
          {limitationAlerts.map(alert => (
            <div
              key={alert.id}
              onClick={() => onOpenCaseDetails(alert.caseNumber)}
              className="bg-black/60 hover:bg-white/[0.04] rounded-2xl p-3 border border-white/[0.06] flex items-center justify-between cursor-pointer transition ios-press group"
            >
              <div className="pr-3 flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-white tracking-tight font-mono group-hover:text-amber-300 transition">
                    {alert.caseNumber}
                  </span>
                  <span className="text-[9px] text-neutral-400 font-mono">
                    • {alert.statutoryAct}
                  </span>
                </div>
                <p className="text-xs text-neutral-300 font-medium mt-1 leading-snug">
                  {language === 'en' ? alert.titleEn : alert.titleHi}
                </p>
                <p className="text-[11px] text-neutral-400 mt-1 line-clamp-1">
                  {language === 'en' ? alert.descriptionEn : alert.descriptionHi}
                </p>
              </div>

              <div className="text-right shrink-0">
                <div className="inline-flex flex-col items-end">
                  <span className="text-xs font-bold font-mono text-rose-400 bg-rose-950/60 border border-rose-500/30 px-2 py-0.5 rounded-lg">
                    {alert.daysRemaining}d left
                  </span>
                  <span className="text-[9px] text-neutral-500 font-mono mt-1">
                    {alert.deadlineDate}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Court Filter Pills (Framer-style Segmented Filter) */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
        {['All', 'High Court', 'Tis Hazari', 'Patiala House', 'Saket'].map(court => (
          <button
            key={court}
            onClick={() => setSelectedCourtFilter(court)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all ios-press ${
              selectedCourtFilter === court
                ? 'bg-white text-black font-semibold shadow-sm'
                : 'bg-white/[0.04] hover:bg-white/[0.08] text-neutral-400 border border-white/[0.06]'
            }`}
          >
            {court === 'All' ? (language === 'en' ? 'All Benches' : 'सभी अदालतें') : court}
          </button>
        ))}
      </div>

      {/* Cause List Schedule (Interactive Linear Cards) */}
      {filteredHearings.length === 0 ? (
        <div className="glass-card rounded-3xl p-8 text-center flex flex-col items-center gap-3 border border-white/[0.08] my-2">
          <div className="w-12 h-12 rounded-2xl bg-white/[0.04] border border-white/[0.08] flex items-center justify-center text-amber-300">
            <Gavel size={22} strokeWidth={1.8} />
          </div>
          <div>
            <h4 className="text-sm font-semibold text-white">
              {language === 'en' ? 'No Hearings Scheduled' : 'आज कोई सुनवाई सूचीबद्ध नहीं है'}
            </h4>
            <p className="text-xs text-neutral-400 mt-1 max-w-xs">
              {language === 'en'
                ? 'Your cause list is clear. Tap "Add Hearing" above to log a new court hearing date.'
                : 'आपकी वाद तालिका खाली है। नई अदालत सुनवाई जोड़ने के लिए ऊपर "सुनवाई जोड़ें" पर टैप करें।'}
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredHearings.map((item, idx) => (
            <div
              key={item.id || idx}
              className="glass-card rounded-3xl p-4 flex flex-col gap-3 relative border border-white/[0.08] hover:border-amber-400/25 transition group"
            >
            {/* Header: Item No, Stage & Hearing Time */}
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-mono text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20 font-semibold">
                    ITEM #{item.itemNumber}
                  </span>
                  <span className="text-[11px] text-neutral-400 font-mono flex items-center gap-1">
                    <MapPin size={11} /> {item.courtName}
                  </span>
                </div>

                <h4 
                  onClick={() => onOpenCaseDetails(item.caseNumber)}
                  className="text-base font-bold text-white tracking-tight cursor-pointer hover:text-amber-300 transition mt-1 flex items-center gap-1.5 font-mono"
                >
                  <span>{item.caseNumber}</span>
                  <ChevronRight size={14} className="text-neutral-500 group-hover:text-white transition" />
                </h4>

                <p className="text-xs text-neutral-300 mt-0.5 flex items-center gap-1 font-sans">
                  <User size={12} className="text-neutral-500" />
                  <span>{item.clientName}</span>
                </p>
              </div>

              <div className="text-right">
                <span className="text-[10px] font-medium px-2.5 py-0.5 rounded-full bg-white/[0.06] text-neutral-300 border border-white/[0.08]">
                  {item.stage}
                </span>
                <span className="text-xs font-mono text-neutral-400 flex items-center justify-end gap-1 mt-1.5">
                  <Clock size={11} />
                  {item.hearingTime}
                </span>
              </div>
            </div>

            {/* Purpose & Court Room */}
            <div className="bg-black/50 border border-white/[0.05] rounded-2xl p-3 text-xs text-neutral-300 flex items-start gap-2.5">
              <Gavel size={14} className="text-amber-400 shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="font-medium leading-relaxed text-white/90">
                  {language === 'en' ? item.purposeEn : item.purposeHi}
                </p>
                <div className="flex items-center gap-3 text-[10px] text-neutral-400 font-mono mt-1.5 pt-1.5 border-t border-white/[0.04]">
                  <span>{item.courtRoom}</span>
                  <span>•</span>
                  <span>{item.judgeName}</span>
                </div>
              </div>
            </div>

            {/* Action Bar */}
            <div className="flex items-center gap-2 pt-0.5">
              <button
                onClick={() => handleOpenOrderModal(item)}
                className="flex-1 py-2.5 rounded-2xl bg-white text-black font-semibold text-xs transition-all hover:bg-neutral-200 ios-press flex items-center justify-center gap-1.5 shadow-[0_2px_8px_rgba(255,255,255,0.15)]"
              >
                <Sparkles size={13} />
                <span>{t.updateOutcome}</span>
              </button>
              <button
                onClick={() => onOpenCaseDetails(item.caseNumber)}
                className="py-2.5 px-4 rounded-2xl bg-white/[0.06] hover:bg-white/[0.1] text-neutral-300 font-medium text-xs border border-white/[0.08] transition ios-press"
              >
                {t.viewDetails}
              </button>
            </div>
          </div>
        ))}
      </div>
    )}

      {/* Action Sheet Modal: Update Order with Voice Dictation */}
      {activeModalHearing && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-xl flex items-end sm:items-center justify-center p-3 animate-in fade-in">
          <div className="w-full max-w-sm glass-panel rounded-3xl p-5 shadow-2xl flex flex-col gap-4 border border-white/[0.14] bg-[#0E0F14]">
            <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
              <div>
                <h3 className="text-sm font-semibold text-white tracking-tight">
                  {t.hearingOutcomeTitle}
                </h3>
                <span className="text-[10px] font-mono text-amber-400">
                  {activeModalHearing.caseNumber}
                </span>
              </div>
              <button
                onClick={() => setActiveModalHearing(null)}
                className="w-7 h-7 rounded-full bg-white/[0.06] flex items-center justify-center text-neutral-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-[11px] font-medium text-neutral-400 block">
                    {language === 'en' ? 'Order Summary & Notes' : 'आदेश विवरण एवं टिप्पणी'}
                  </label>
                  {/* Voice Dictation Button (Inspired by Adalat.ai) */}
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
                  value={orderSummaryText}
                  onChange={(e) => setOrderSummaryText(e.target.value)}
                  placeholder={t.orderSummaryPlaceholder}
                  rows={3}
                  className="w-full bg-black/80 border border-white/[0.1] rounded-2xl p-3 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-amber-400/40 resize-none font-sans"
                />
              </div>

              <div>
                <label className="text-[11px] font-medium text-neutral-400 block mb-1">
                  {t.selectNextDate}
                </label>
                <input
                  type="date"
                  value={nextDateInput}
                  onChange={(e) => setNextDateInput(e.target.value)}
                  className="w-full bg-black/80 border border-white/[0.1] rounded-2xl p-2.5 text-xs text-white focus:outline-none focus:border-amber-400/40 font-mono"
                />
              </div>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                onClick={() => setActiveModalHearing(null)}
                className="flex-1 py-2.5 rounded-2xl bg-white/[0.06] text-neutral-300 font-medium text-xs hover:bg-white/[0.1] ios-press"
              >
                {t.cancel}
              </button>
              <button
                onClick={handleSaveOrder}
                className="flex-1 py-2.5 rounded-2xl bg-white text-black font-semibold text-xs hover:bg-neutral-200 ios-press shadow-md"
              >
                {t.save}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add New Hearing Modal */}
      {showAddHearingModal && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-xl flex items-end sm:items-center justify-center p-3 animate-in fade-in">
          <div className="w-full max-w-sm glass-panel rounded-3xl p-5 shadow-2xl flex flex-col gap-4 border border-white/[0.14] bg-[#0E0F14]">
            <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
              <div>
                <h3 className="text-sm font-semibold text-white tracking-tight">
                  {language === 'en' ? 'Add Court Hearing' : 'नई सुनवाई जोड़ें'}
                </h3>
                <span className="text-[10px] text-neutral-400">
                  {language === 'en' ? 'Add case to daily Cause List' : 'दैनिक वाद तालिका में शामिल करें'}
                </span>
              </div>
              <button
                onClick={() => setShowAddHearingModal(false)}
                className="w-7 h-7 rounded-full bg-white/[0.06] flex items-center justify-center text-neutral-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateHearing} className="space-y-3">
              <div>
                <label className="text-[11px] font-medium text-neutral-400 block mb-1">
                  {language === 'en' ? 'Case Number *' : 'केस संख्या *'}
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. CRL.A./102/2026"
                  value={newCaseNumber}
                  onChange={e => setNewCaseNumber(e.target.value)}
                  className="w-full bg-black/80 border border-white/[0.1] rounded-xl px-3 py-2 text-xs text-white placeholder-neutral-600 focus:outline-none focus:border-amber-400/40 font-mono"
                />
              </div>

              <div>
                <label className="text-[11px] font-medium text-neutral-400 block mb-1">
                  {language === 'en' ? 'Client Name *' : 'मुवक्किल का नाम *'}
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Ramesh Kumar"
                  value={newClientName}
                  onChange={e => setNewClientName(e.target.value)}
                  className="w-full bg-black/80 border border-white/[0.1] rounded-xl px-3 py-2 text-xs text-white placeholder-neutral-600 focus:outline-none focus:border-amber-400/40"
                />
              </div>

              <div>
                <label className="text-[11px] font-medium text-neutral-400 block mb-1">
                  {language === 'en' ? 'Court / Forum' : 'न्यायालय'}
                </label>
                <select
                  value={newCourtName}
                  onChange={e => setNewCourtName(e.target.value)}
                  style={{ backgroundColor: '#18181b', color: '#ffffff' }}
                  className="w-full bg-[#18181b] border border-white/[0.1] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-400/40"
                >
                  <option value="Delhi High Court" style={{ backgroundColor: '#18181b', color: '#ffffff' }}>Delhi High Court</option>
                  <option value="Tis Hazari District Court" style={{ backgroundColor: '#18181b', color: '#ffffff' }}>Tis Hazari District Court</option>
                  <option value="Patiala House Court" style={{ backgroundColor: '#18181b', color: '#ffffff' }}>Patiala House Court</option>
                  <option value="Saket District Court" style={{ backgroundColor: '#18181b', color: '#ffffff' }}>Saket District Court</option>
                  <option value="Supreme Court of India" style={{ backgroundColor: '#18181b', color: '#ffffff' }}>Supreme Court of India</option>
                </select>
              </div>

              <div>
                <label className="text-[11px] font-medium text-neutral-400 block mb-1">
                  {language === 'en' ? 'Purpose / Stage' : 'सुनवाई का उद्देश्य'}
                </label>
                <input
                  type="text"
                  placeholder="e.g. Final Arguments / Bail Plea"
                  value={newPurpose}
                  onChange={e => setNewPurpose(e.target.value)}
                  className="w-full bg-black/80 border border-white/[0.1] rounded-xl px-3 py-2 text-xs text-white placeholder-neutral-600 focus:outline-none focus:border-amber-400/40"
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddHearingModal(false)}
                  className="flex-1 py-2.5 rounded-2xl bg-white/[0.06] text-neutral-300 font-medium text-xs hover:bg-white/[0.1] ios-press"
                >
                  {t.cancel}
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-2xl bg-white text-black font-semibold text-xs hover:bg-neutral-200 ios-press shadow-md"
                >
                  {language === 'en' ? 'Save Hearing' : 'सुरक्षित करें'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
