import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar, ChevronRight, CheckCircle2, Gavel, Mic, MicOff, Sparkles, Clock, MapPin, User, Plus, Scale, Share2, List } from 'lucide-react';
import { HearingItem, LimitationAlert, Language, CaseFile } from '../types';
import { translations } from '../i18n/translations';
import { HearingCalendar } from './HearingCalendar';
import { IpcToBnsModal } from './IpcToBnsModal';
import { ShareCaseModal } from './ShareCaseModal';
import { TaskTimelineCalendar } from './TaskTimelineCalendar';

interface VirtualCaseDiaryProps {
  hearings: HearingItem[];
  limitationAlerts: LimitationAlert[];
  language: Language;
  cases?: CaseFile[]; // NEW: for autocomplete
  onUpdateHearingOrder: (hearingId: string, orderNotes: string, nextDate: string) => void;
  onOpenCaseDetails: (caseNumber: string) => void;
  onAddHearing?: (newHearing: Omit<HearingItem, 'id'>) => void;
  onEditHearing?: (id: string, updates: Partial<HearingItem>) => void; // NEW
}

export const VirtualCaseDiary: React.FC<VirtualCaseDiaryProps> = ({
  hearings,
  limitationAlerts,
  language,
  cases,
  onUpdateHearingOrder,
  onOpenCaseDetails,
  onAddHearing,
  onEditHearing
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
  const [newHearingDate, setNewHearingDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [newHearingTime, setNewHearingTime] = useState('10:30 AM');

  // Edit hearing state
  const [editingHearing, setEditingHearing] = useState<HearingItem | null>(null);

  // Autocomplete state
  const [caseNumberSuggestions, setCaseNumberSuggestions] = useState<CaseFile[]>([]);
  const [clientNameSuggestions, setClientNameSuggestions] = useState<CaseFile[]>([]);
  const [showCaseSuggestions, setShowCaseSuggestions] = useState(false);
  const [showClientSuggestions, setShowClientSuggestions] = useState(false);

  // Calendar & Tools View State
  const [viewMode, setViewMode] = useState<'list' | 'calendar'>('list');
  const [showIpcModal, setShowIpcModal] = useState<boolean>(false);
  const [showShareModal, setShowShareModal] = useState<boolean>(false);

  // Weekly diary date selection
  const [selectedDiaryDate, setSelectedDiaryDate] = useState<Date>(new Date());

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

  // Autocomplete handlers
  const handleCaseNumberChange = (val: string) => {
    setNewCaseNumber(val);
    if (val.length >= 1 && cases && cases.length > 0) {
      const filtered = cases.filter(c =>
        c.caseNumber.toLowerCase().includes(val.toLowerCase()) ||
        c.clientName.toLowerCase().includes(val.toLowerCase())
      ).slice(0, 5);
      setCaseNumberSuggestions(filtered);
      setShowCaseSuggestions(filtered.length > 0);
    } else {
      setShowCaseSuggestions(false);
    }
  };

  const handleClientNameChange = (val: string) => {
    setNewClientName(val);
    if (val.length >= 1 && cases && cases.length > 0) {
      const filtered = cases.filter(c =>
        c.clientName.toLowerCase().includes(val.toLowerCase()) ||
        c.caseNumber.toLowerCase().includes(val.toLowerCase())
      ).slice(0, 5);
      setClientNameSuggestions(filtered);
      setShowClientSuggestions(filtered.length > 0);
    } else {
      setShowClientSuggestions(false);
    }
  };

  const handleCreateHearing = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCaseNumber || !newClientName) return;

    if (editingHearing) {
      // Edit existing
      if (onEditHearing) {
        onEditHearing(editingHearing.id, {
          caseNumber: newCaseNumber,
          clientName: newClientName,
          courtName: newCourtName,
          hearingDate: newHearingDate ? `${newHearingDate}, ${newHearingTime || '10:30 AM'}` : editingHearing.hearingDate,
          hearingTime: newHearingTime,
          purposeEn: newPurpose || editingHearing.purposeEn,
          purposeHi: newPurpose || editingHearing.purposeHi,
        });
      }
      setToastMessage(language === 'en' ? 'Hearing updated!' : 'सुनवाई अपडेट की गई!');
    } else {
      // Create new
      if (onAddHearing) {
        onAddHearing({
          caseNumber: newCaseNumber,
          clientName: newClientName,
          courtName: newCourtName,
          itemNumber: hearings.length + 1,
          courtRoom: 'Court No. 04',
          judgeName: "Hon'ble Presiding Officer",
          stage: 'Admission',
          hearingDate: newHearingDate ? `${newHearingDate}, ${newHearingTime || '10:30 AM'}` : 'Tomorrow, 10:30 AM',
          hearingTime: newHearingTime || '10:30 AM',
          purposeEn: newPurpose || 'Preliminary Hearing & Arguments',
          purposeHi: newPurpose || 'प्रारंभिक सुनवाई एवं बहस',
          isUrgent: false
        });
      }
      setToastMessage(language === 'en' ? 'Hearing added to Cause List!' : 'वाद तालिका में सुनवाई जोड़ी गई!');
    }

    setShowAddHearingModal(false);
    setEditingHearing(null);
    setNewCaseNumber('');
    setNewClientName('');
    setNewPurpose('');
    setNewHearingDate(new Date().toISOString().split('T')[0]);
    setTimeout(() => setToastMessage(null), 3000);
  };

  return (
    <div className="flex flex-col gap-5 p-4 sm:p-6 pb-28">
      {/* Toast Notification */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: -16, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.97 }}
            transition={{ type: 'spring', stiffness: 400, damping: 28 }}
            className="sticky top-2 z-40 bg-neutral-900/95 text-white border border-emerald-500/40 px-4 py-2.5 rounded-2xl shadow-2xl backdrop-blur-2xl flex items-center gap-2 text-xs font-medium"
          >
            <CheckCircle2 size={15} className="text-emerald-400" />
            <span>{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Hero Header & Action Toolbar: Diary */}
      <div className="flex flex-col gap-3 pt-1">
        {/* Row 1: Title, Listings status & Primary Add CTA */}
        <div className="flex items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-[10px] font-mono text-emerald-400 font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-radar" />
                BENCH IN SESSION
              </span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-white font-display">
              {language === 'hi' ? 'डायरी' : language === 'mr' ? 'डायरी' : 'Diary'}
            </h1>
            <p className="text-xs text-neutral-400 mt-0.5">
              {filteredHearings.length} {language === 'mr' ? 'प्रकरणे आज सूचीबद्ध' : language === 'hi' ? 'मामले आज सूचीबद्ध हैं' : 'hearings scheduled'}
            </p>
          </div>

          {/* Primary CTA: + Add Hearing */}
          <button
            type="button"
            onClick={() => {
              setEditingHearing(null);
              setNewCaseNumber('');
              setNewClientName('');
              setNewPurpose('');
              setNewHearingDate(new Date().toISOString().split('T')[0]);
              setNewHearingTime('10:30 AM');
              setShowAddHearingModal(true);
            }}
            className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-2xl bg-white text-black font-bold text-xs transition-all hover:bg-neutral-200 ios-press shadow-[0_4px_16px_rgba(255,255,255,0.18)] shrink-0"
          >
            <Plus size={15} strokeWidth={2.5} />
            <span>{language === 'mr' ? 'सुनावणी जोडा' : language === 'hi' ? 'सुनवाई जोड़ें' : 'Add Hearing'}</span>
          </button>
        </div>

        {/* Task & Timeline Calendar matching Image 2 */}
        <TaskTimelineCalendar
          language={language}
          selectedDate={selectedDiaryDate}
          onSelectDate={setSelectedDiaryDate}
          hearings={hearings}
          onOpenHearingOrder={handleOpenOrderModal}
          onOpenCaseDetails={onOpenCaseDetails}
        />

        {/* Row 2: Clean Toolbar (List/Calendar switcher + IPC/BNS + Share) */}
        <div className="flex items-center justify-between gap-2 pt-2 border-t border-white/[0.06]">
          {/* List vs Calendar Toggle */}
          <div className="flex items-center bg-white/[0.05] border border-white/[0.08] rounded-xl p-0.5">
            <button
              type="button"
              onClick={() => setViewMode('list')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition ios-press ${
                viewMode === 'list'
                  ? 'bg-white text-black shadow-sm'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              <List size={13} />
              <span>{language === 'mr' ? 'यादी' : language === 'hi' ? 'सूची' : 'List'}</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('calendar')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition ios-press ${
                viewMode === 'calendar'
                  ? 'bg-amber-400 text-black shadow-sm font-bold'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              <Calendar size={13} />
              <span>{language === 'mr' ? 'कॅलेंडर' : language === 'hi' ? 'कैलेंडर' : 'Calendar'}</span>
            </button>
          </div>

          {/* Quick Utility Tools */}
          <div className="flex items-center gap-1.5">
            {/* IPC -> BNS Button */}
            <button
              type="button"
              onClick={() => setShowIpcModal(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 font-semibold text-xs border border-amber-500/25 transition ios-press"
              title="IPC to BNS 2023 Conversion Table"
            >
              <Scale size={13} />
              <span>IPC ⇄ BNS</span>
            </button>

            {/* Share Case / Diary Button */}
            <button
              type="button"
              onClick={() => setShowShareModal(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/[0.06] hover:bg-white/[0.12] text-neutral-200 font-semibold text-xs border border-white/[0.08] transition ios-press"
              title="Share case or diary with client"
            >
              <Share2 size={13} />
              <span>{language === 'mr' ? 'शेअर' : language === 'hi' ? 'साझा' : 'Share'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Calendar View vs List View */}
      {viewMode === 'calendar' ? (
        <HearingCalendar
          hearings={hearings}
          language={language}
          onOpenHearingOrder={handleOpenOrderModal}
          onOpenCaseDetails={onOpenCaseDetails}
        />
      ) : (
        <>
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
                {court === 'All' ? (language === 'mr' ? 'सर्व न्यायालये' : language === 'hi' ? 'सभी अदालतें' : 'All Benches') : court}
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
        <motion.div
          className="space-y-3"
          initial="hidden"
          animate="visible"
          variants={{ hidden: {}, visible: { transition: { staggerChildren: 0.07 } } }}
        >
          {filteredHearings.map((item, idx) => (
            <motion.div
              key={item.id || idx}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-20px' }}
              transition={{ type: 'spring', stiffness: 340, damping: 28 }}
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
                onClick={() => {
                  setEditingHearing(item);
                  setNewCaseNumber(item.caseNumber);
                  setNewClientName(item.clientName);
                  setNewCourtName(item.courtName);
                  setNewPurpose(item.purposeEn);
                  setNewHearingTime(item.hearingTime || '10:30 AM');
                  const datePart = item.hearingDate?.split(',')[0]?.trim();
                  setNewHearingDate(datePart && /^\d{4}-\d{2}-\d{2}$/.test(datePart) ? datePart : new Date().toISOString().split('T')[0]);
                  setShowAddHearingModal(true);
                }}
                className="py-2.5 px-4 rounded-2xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 font-medium text-xs border border-amber-500/20 transition ios-press"
              >
                Edit
              </button>
              <button
                onClick={() => onOpenCaseDetails(item.caseNumber)}
                className="py-2.5 px-4 rounded-2xl bg-white/[0.06] hover:bg-white/[0.1] text-neutral-300 font-medium text-xs border border-white/[0.08] transition ios-press"
              >
                {t.viewDetails}
              </button>
            </div>
          </motion.div>
        ))}
        </motion.div>
    )}
    </>
  )}

      {/* Action Sheet Modal: Update Order with Voice Dictation */}
      <AnimatePresence>
        {activeModalHearing && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 bg-black/85 backdrop-blur-xl flex items-end sm:items-center justify-center p-3"
          >
            <motion.div
              initial={{ y: 60, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 40, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 380, damping: 30 }}
              className="w-full max-w-sm glass-panel rounded-3xl p-5 shadow-2xl flex flex-col gap-4 border border-white/[0.14] bg-[#0E0F14]"
            >
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
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Add / Edit Hearing Modal */}
      <AnimatePresence>
        {showAddHearingModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/85 backdrop-blur-xl flex items-end sm:items-center justify-center p-3"
          >
            <motion.div
              initial={{ y: 60, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 40, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 380, damping: 30 }}
              className="w-full max-w-sm glass-panel rounded-3xl p-5 shadow-2xl flex flex-col gap-4 border border-white/[0.14] bg-[#0E0F14]"
            >
            <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
              <div>
                <h3 className="text-sm font-semibold text-white tracking-tight">
                  {editingHearing
                    ? (language === 'en' ? 'Edit Hearing' : 'सुनवाई संपादित करें')
                    : (language === 'en' ? 'Add Court Hearing' : 'नई सुनवाई जोड़ें')}
                </h3>
                <span className="text-[10px] text-neutral-400">
                  {language === 'en' ? 'Add case to daily Cause List' : 'दैनिक वाद तालिका में शामिल करें'}
                </span>
              </div>
              <button
                onClick={() => { setShowAddHearingModal(false); setEditingHearing(null); }}
                className="w-7 h-7 rounded-full bg-white/[0.06] flex items-center justify-center text-neutral-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateHearing} className="space-y-3">
              {/* Case Number with Autocomplete */}
              <div className="relative">
                <label className="text-[11px] font-medium text-neutral-400 block mb-1">
                  {language === 'en' ? 'Case Number *' : 'केस संख्या *'}
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. CRL.A./102/2026"
                  value={newCaseNumber}
                  onChange={e => handleCaseNumberChange(e.target.value)}
                  onBlur={() => setTimeout(() => setShowCaseSuggestions(false), 150)}
                  onFocus={() => newCaseNumber.length >= 1 && setShowCaseSuggestions(caseNumberSuggestions.length > 0)}
                  className="w-full bg-black/80 border border-white/[0.1] rounded-xl px-3 py-2 text-xs text-white placeholder-neutral-600 focus:outline-none focus:border-amber-400/40 font-mono"
                />
                {showCaseSuggestions && (
                  <div className="absolute z-10 top-full left-0 right-0 mt-1 bg-[#0E0F14] border border-white/[0.12] rounded-xl overflow-hidden shadow-xl">
                    {caseNumberSuggestions.map(c => (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => {
                          setNewCaseNumber(c.caseNumber);
                          setNewClientName(c.clientName);
                          setShowCaseSuggestions(false);
                        }}
                        className="w-full text-left px-3 py-2 hover:bg-white/[0.06] transition flex flex-col border-b border-white/[0.04] last:border-0"
                      >
                        <span className="text-xs font-mono text-amber-300">{c.caseNumber}</span>
                        <span className="text-[10px] text-neutral-400">{c.clientName}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Client Name with Autocomplete */}
              <div className="relative">
                <label className="text-[11px] font-medium text-neutral-400 block mb-1">
                  {language === 'en' ? 'Client Name *' : 'मुवक्किल का नाम *'}
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Ramesh Kumar"
                  value={newClientName}
                  onChange={e => handleClientNameChange(e.target.value)}
                  onBlur={() => setTimeout(() => setShowClientSuggestions(false), 150)}
                  onFocus={() => newClientName.length >= 1 && setShowClientSuggestions(clientNameSuggestions.length > 0)}
                  className="w-full bg-black/80 border border-white/[0.1] rounded-xl px-3 py-2 text-xs text-white placeholder-neutral-600 focus:outline-none focus:border-amber-400/40"
                />
                {showClientSuggestions && (
                  <div className="absolute z-10 top-full left-0 right-0 mt-1 bg-[#0E0F14] border border-white/[0.12] rounded-xl overflow-hidden shadow-xl">
                    {clientNameSuggestions.map(c => (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => {
                          setNewClientName(c.clientName);
                          setNewCaseNumber(c.caseNumber);
                          setShowClientSuggestions(false);
                        }}
                        className="w-full text-left px-3 py-2 hover:bg-white/[0.06] transition flex flex-col border-b border-white/[0.04] last:border-0"
                      >
                        <span className="text-xs text-white">{c.clientName}</span>
                        <span className="text-[10px] text-amber-300 font-mono">{c.caseNumber}</span>
                      </button>
                    ))}
                  </div>
                )}
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

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="text-[11px] font-medium text-neutral-400 block mb-1">
                    {language === 'en' ? 'Hearing Date *' : 'सुनवाई की तारीख *'}
                  </label>
                  <input
                    type="date"
                    required
                    value={newHearingDate}
                    onChange={e => setNewHearingDate(e.target.value)}
                    className="w-full bg-black/80 border border-white/[0.1] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-400/40 font-mono"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-medium text-neutral-400 block mb-1">
                    {language === 'en' ? 'Time' : 'समय'}
                  </label>
                  <input
                    type="text"
                    placeholder="10:30 AM"
                    value={newHearingTime}
                    onChange={e => setNewHearingTime(e.target.value)}
                    className="w-full bg-black/80 border border-white/[0.1] rounded-xl px-3 py-2 text-xs text-white placeholder-neutral-600 focus:outline-none focus:border-amber-400/40 font-mono"
                  />
                </div>
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
                  onClick={() => { setShowAddHearingModal(false); setEditingHearing(null); }}
                  className="flex-1 py-2.5 rounded-2xl bg-white/[0.06] text-neutral-300 font-medium text-xs hover:bg-white/[0.1] ios-press"
                >
                  {t.cancel}
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-2xl bg-white text-black font-semibold text-xs hover:bg-neutral-200 ios-press shadow-md"
                >
                  {editingHearing
                    ? (language === 'en' ? 'Update Hearing' : 'अपडेट करें')
                    : (language === 'en' ? 'Save Hearing' : 'सुरक्षित करें')}
                </button>
              </div>
            </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* IPC to BNS Converter Modal */}
      <IpcToBnsModal
        isOpen={showIpcModal}
        onClose={() => setShowIpcModal(false)}
        language={language}
      />

      {/* Share Case / Diary Modal */}
      <ShareCaseModal
        isOpen={showShareModal}
        onClose={() => setShowShareModal(false)}
        cases={cases || []}
        hearings={hearings}
        language={language}
      />
    </div>
  );
};
