import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MessageSquare,
  TrendingUp,
  Users,
  Star,
  ChevronRight,
  ChevronLeft,
  Folder,
  FileText,
  AlertCircle,
  Calendar,
  Sparkles,
  Phone,
  Video,
  Plus,
  X,
  Gavel,
  Share2,
  Clock,
  CheckCircle2,
  MapPin,
  ArrowRight
} from 'lucide-react';
import { CaseFile, HearingItem, LimitationAlert, Language, DirectThread } from '../../types';
import { TaskTimelineCalendar } from '../TaskTimelineCalendar';

interface LawyerHomeDashboardProps {
  lawyerName?: string;
  cases: CaseFile[];
  hearings: HearingItem[];
  limitationAlerts: LimitationAlert[];
  threads: DirectThread[];
  language: Language;
  onNavigateToCases: () => void;
  onNavigateToCalendar: () => void;
  onNavigateToChats: () => void;
  onNavigateToBilling: () => void;
  onSelectThread: (thread: DirectThread) => void;
  onUpdateHearingOrder?: (hearingId: string, orderNotes: string, nextDate: string) => void;
  onAddHearing?: (newHearing: Omit<HearingItem, 'id'>) => void;
  onSendHearingChatUpdate?: (params: {
    caseNumber: string;
    clientName: string;
    court: string;
    status: string;
    nextDate: string;
    stage: string;
    orderNotes: string;
  }) => void;
}

export interface CourtBoardItem {
  id: string;
  itemNumber: number;
  courtHall: string;
  courtName: string;
  judgeName: string;
  caseNumber: string;
  parties: string;
  stage: string;
  status: 'Calling Now' | 'Passover Requested' | 'In Progress' | 'Disposed / Passed';
}

export const LawyerHomeDashboard: React.FC<LawyerHomeDashboardProps> = ({
  lawyerName = 'Adv. Rajesh Mehta',
  cases,
  hearings,
  limitationAlerts,
  threads,
  language,
  onNavigateToCases,
  onNavigateToCalendar,
  onNavigateToChats,
  onNavigateToBilling,
  onSelectThread,
  onUpdateHearingOrder,
  onAddHearing,
  onSendHearingChatUpdate
}) => {
  const [selectedDashboardDate, setSelectedDashboardDate] = React.useState<Date>(new Date());
  const totalBilled = cases.reduce((sum, c) => sum + (c.totalBilled || 0), 0);
  const criticalAlerts = limitationAlerts.filter(a => a.severity === 'critical');
  const uniqueClients = new Set(cases.map(c => c.clientName)).size;

  const [boardItems, setBoardItems] = React.useState<CourtBoardItem[]>(() => {
    try {
      const saved = localStorage.getItem('nyaay_court_board_items');
      if (saved) return JSON.parse(saved);
    } catch {}
    return [
      {
        id: 'cb-1',
        itemNumber: 12,
        courtHall: 'Court Hall No. 04',
        courtName: 'Tis Hazari District Court',
        judgeName: 'Hon’ble A. K. Sharma, DHJS',
        caseNumber: 'CC/4128/2026',
        parties: 'State vs. Vikram Malhotra',
        stage: 'Regular Bail Arguments',
        status: 'Calling Now',
      },
      {
        id: 'cb-2',
        itemNumber: 28,
        courtHall: 'Court Hall No. 11',
        courtName: 'Saket District Court',
        judgeName: 'Hon’ble Sunita Rao, ADJ',
        caseNumber: 'CS/330/2024',
        parties: 'Mehta vs. Union Bank',
        stage: 'Cross Examination of PW-1',
        status: 'Passover Requested',
      },
      {
        id: 'cb-3',
        itemNumber: 45,
        courtHall: 'Court Room No. 02',
        courtName: 'Delhi High Court (DB)',
        judgeName: 'Hon’ble Chief Justice Bench',
        caseNumber: 'CRL.A./882/2025',
        parties: 'Kavita vs. NCT of Delhi',
        stage: 'Admission & Stay Notice',
        status: 'In Progress',
      },
    ];
  });

  // Carousel & Modal states
  const carouselRef = React.useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = React.useState(0);
  const [showAddBoardModal, setShowAddBoardModal] = React.useState(false);
  const [selectedPostponeItem, setSelectedPostponeItem] = React.useState<CourtBoardItem | null>(null);

  // Helper for date presets
  const getPresetDate = (days: number): string => {
    const d = new Date();
    d.setDate(d.getDate() + days);
    return d.toISOString().split('T')[0];
  };

  const [postponeOutcome, setPostponeOutcome] = React.useState<string>('Postponed / Adjourned');
  const [postponeNextDate, setPostponeNextDate] = React.useState<string>(() => getPresetDate(7));
  const [postponeNextStage, setPostponeNextStage] = React.useState<string>('Final Arguments');
  const [postponeOrderNotes, setPostponeOrderNotes] = React.useState<string>('');
  const [postponeSendChat, setPostponeSendChat] = React.useState<boolean>(true);
  const [toastMessage, setToastMessage] = React.useState<string | null>(null);

  // Add Item form states
  const [newItemNumber, setNewItemNumber] = React.useState('');
  const [newCourtHall, setNewCourtHall] = React.useState('Court Room No. 04');
  const [newCourtName, setNewCourtName] = React.useState('Tis Hazari District Court');
  const [newCaseNumber, setNewCaseNumber] = React.useState('');
  const [newParties, setNewParties] = React.useState('');
  const [newStage, setNewStage] = React.useState('Arguments');

  const scrollToIndex = (idx: number) => {
    if (!carouselRef.current) return;
    const cards = carouselRef.current.children;
    if (cards[idx]) {
      (cards[idx] as HTMLElement).scrollIntoView({
        behavior: 'smooth',
        inline: 'center',
        block: 'nearest',
      });
      setActiveIndex(idx);
    }
  };

  const scrollCarousel = (direction: 'next' | 'prev') => {
    if (!carouselRef.current) return;
    const nextIdx = direction === 'next' 
      ? Math.min(boardItems.length - 1, activeIndex + 1)
      : Math.max(0, activeIndex - 1);
    scrollToIndex(nextIdx);
  };

  const handleScroll = () => {
    if (!carouselRef.current) return;
    const scrollLeft = carouselRef.current.scrollLeft;
    const cardWidth = carouselRef.current.clientWidth * 0.85;
    const newIdx = Math.round(scrollLeft / cardWidth);
    if (newIdx !== activeIndex && newIdx >= 0 && newIdx < boardItems.length) {
      setActiveIndex(newIdx);
    }
  };

  const handleAddBoardItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCaseNumber.trim()) return;

    const item: CourtBoardItem = {
      id: `cb-${Date.now()}`,
      itemNumber: parseInt(newItemNumber) || boardItems.length + 1,
      courtHall: newCourtHall || 'Court Hall No. 01',
      courtName: newCourtName || 'District Court',
      judgeName: 'Hon’ble Presiding Judge',
      caseNumber: newCaseNumber.trim(),
      parties: newParties.trim() || 'Petitioner vs. Respondent',
      stage: newStage || 'Hearing',
      status: 'In Progress',
    };

    const updated = [...boardItems, item];
    setBoardItems(updated);
    try {
      localStorage.setItem('nyaay_court_board_items', JSON.stringify(updated));
    } catch {}

    setShowAddBoardModal(false);
    setNewItemNumber('');
    setNewCaseNumber('');
    setNewParties('');
    setToastMessage('✅ Matter added to Today’s Court Board!');
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleOpenPostponeModal = (item: CourtBoardItem) => {
    setSelectedPostponeItem(item);
    setPostponeOutcome('Postponed / Adjourned');
    setPostponeNextDate(getPresetDate(7));
    setPostponeNextStage(item.stage || 'Hearing');
    setPostponeOrderNotes(`Matter adjourned on counsel request. Next date fixed for ${item.stage || 'further proceedings'}.`);
    setPostponeSendChat(true);
  };

  const handleConfirmPostpone = () => {
    if (!selectedPostponeItem) return;
    const item = selectedPostponeItem;

    // 1. Update board item state
    const updatedBoard = boardItems.map(b =>
      b.id === item.id
        ? {
            ...b,
            status: 'Disposed / Passed' as const,
            stage: `${postponeOutcome} → Next: ${postponeNextDate}`,
          }
        : b
    );
    setBoardItems(updatedBoard);
    try {
      localStorage.setItem('nyaay_court_board_items', JSON.stringify(updatedBoard));
    } catch {}

    // 2. Call onUpdateHearingOrder to update the order summary and case record
    if (onUpdateHearingOrder) {
      onUpdateHearingOrder(
        item.id,
        postponeOrderNotes || `${postponeOutcome}: Next date ${postponeNextDate}`,
        postponeNextDate
      );
    }

    // 3. Automatically create the new Hearing / Diary entry for the next date attached to this case
    if (onAddHearing) {
      onAddHearing({
        caseNumber: item.caseNumber,
        clientName: item.parties.split(' vs ')[0] || item.parties,
        courtName: item.courtName,
        courtRoom: item.courtHall,
        hearingDate: `${postponeNextDate}, 10:30 AM`,
        hearingTime: '10:30 AM',
        itemNumber: item.itemNumber,
        judgeName: item.judgeName,
        stage: (postponeNextStage as any) || 'Final Arguments',
        purposeEn: postponeNextStage,
        purposeHi: postponeNextStage,
        previousOrderSummaryEn:
          postponeOrderNotes ||
          `Matter ${postponeOutcome.toLowerCase()}. Next listing scheduled for ${postponeNextStage}.`,
      });
    }

    // 4. Send interlinked update directly to the client's chat thread
    if (postponeSendChat && onSendHearingChatUpdate) {
      onSendHearingChatUpdate({
        caseNumber: item.caseNumber,
        clientName: item.parties,
        court: `${item.courtHall}, ${item.courtName}`,
        status: postponeOutcome,
        nextDate: postponeNextDate,
        stage: postponeNextStage,
        orderNotes: postponeOrderNotes,
      });
    }

    setSelectedPostponeItem(null);
    setToastMessage(`✅ Order logged! Next hearing set for ${postponeNextDate} & client notified in chat.`);
    setTimeout(() => setToastMessage(null), 4000);
  };

  return (
    <div className="flex flex-col gap-5 p-4 sm:p-5 pb-28 text-white relative">
      {/* ── Toast Notification ── */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-16 left-1/2 -translate-x-1/2 z-50 px-4 py-2.5 rounded-2xl bg-emerald-950/90 border border-emerald-500/40 text-emerald-300 text-xs font-semibold shadow-2xl backdrop-blur-xl flex items-center gap-2"
          >
            <CheckCircle2 size={16} className="text-emerald-400 shrink-0" />
            <span>{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Top Header ── */}
      <div className="pt-1">
        <span className="text-xs text-neutral-400 font-medium">
          {language === 'hi' ? 'पुनः स्वागत है' : language === 'mr' ? 'पुन्हा स्वागत आहे' : 'Welcome back'}
        </span>
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white font-display mt-0.5">
          {lawyerName}
        </h1>
      </div>

      {/* ── Daily Court Board & Cause List (Swipeable Card Carousel) ── */}
      <div className="space-y-3">
        {/* Carousel Header Controls */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
            <h2 className="text-xs font-semibold text-neutral-200 uppercase tracking-wider font-mono">
              {language === 'hi'
                ? 'आज का कोर्ट बोर्ड'
                : language === 'mr'
                ? 'आजचे कोर्ट बोर्ड'
                : "Today's Court Board"}
            </h2>
            <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
              {boardItems.length} {boardItems.length === 1 ? 'Matter' : 'Matters'}
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            {/* Previous Card */}
            <button
              type="button"
              onClick={() => scrollCarousel('prev')}
              disabled={activeIndex === 0}
              className="w-7 h-7 rounded-full bg-white/[0.08] hover:bg-white/[0.16] disabled:opacity-30 border border-white/[0.1] flex items-center justify-center text-neutral-300 transition ios-press"
              title="Previous card"
            >
              <ChevronLeft size={14} />
            </button>
            <span className="text-[11px] font-mono text-neutral-400 px-1">
              {boardItems.length > 0 ? activeIndex + 1 : 0}/{boardItems.length}
            </span>
            {/* Next Card */}
            <button
              type="button"
              onClick={() => scrollCarousel('next')}
              disabled={activeIndex >= boardItems.length - 1}
              className="w-7 h-7 rounded-full bg-white/[0.08] hover:bg-white/[0.16] disabled:opacity-30 border border-white/[0.1] flex items-center justify-center text-neutral-300 transition ios-press"
              title="Next card"
            >
              <ChevronRight size={14} />
            </button>

            <button
              type="button"
              onClick={() => setShowAddBoardModal(true)}
              className="ml-1 text-[11px] font-mono px-2.5 py-1 rounded-full bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-400 border border-emerald-500/30 transition ios-press flex items-center gap-1"
            >
              <Plus size={12} />
              <span>{language === 'hi' ? 'जोड़ें' : 'Add'}</span>
            </button>
          </div>
        </div>

        {/* Swipeable Card Deck Container */}
        {boardItems.length === 0 ? (
          <div className="glass-card rounded-3xl p-6 text-center border border-white/[0.08]">
            <p className="text-sm text-neutral-400">🎉 All matters concluded for today!</p>
            <button
              type="button"
              onClick={() => setShowAddBoardModal(true)}
              className="mt-3 px-4 py-1.5 rounded-full bg-white/[0.08] hover:bg-white/[0.14] text-xs font-semibold text-white border border-white/[0.12] transition"
            >
              + Add matter to today’s board
            </button>
          </div>
        ) : (
          <div
            ref={carouselRef}
            onScroll={handleScroll}
            className="flex gap-3.5 overflow-x-auto snap-x snap-mandatory pb-2 pt-1 scrollbar-none scroll-smooth touch-pan-x"
            style={{ scrollSnapType: 'x mandatory' }}
          >
            {boardItems.map((item, idx) => {
              const isCalling = item.status === 'Calling Now';
              const isPassover = item.status === 'Passover Requested';
              const isInProgress = item.status === 'In Progress';
              const isDisposed = item.status === 'Disposed / Passed';

              return (
                <div
                  key={item.id}
                  className={`snap-center shrink-0 w-[88vw] sm:w-[350px] md:w-[380px] rounded-3xl p-4.5 border transition-all duration-300 flex flex-col justify-between shadow-xl ${
                    isCalling
                      ? 'bg-gradient-to-b from-emerald-950/40 to-neutral-950 border-emerald-500/50 shadow-emerald-950/40'
                      : isPassover
                      ? 'bg-gradient-to-b from-amber-950/30 to-neutral-950 border-amber-500/40 shadow-amber-950/20'
                      : isInProgress
                      ? 'bg-gradient-to-b from-sky-950/30 to-neutral-950 border-sky-500/40 shadow-sky-950/20'
                      : 'glass-card border-white/[0.08] opacity-75'
                  }`}
                >
                  {/* Card Header */}
                  <div>
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono font-bold px-2.5 py-1 rounded-xl bg-white/[0.1] text-white border border-white/[0.12]">
                          Item #{item.itemNumber}
                        </span>
                        <span className="text-xs font-semibold text-neutral-200">
                          {item.courtHall}
                        </span>
                      </div>

                      {/* Interactive Status Pill - Click to cycle status */}
                      <button
                        type="button"
                        onClick={() => {
                          const statuses: CourtBoardItem['status'][] = [
                            'Calling Now',
                            'In Progress',
                            'Passover Requested',
                            'Disposed / Passed',
                          ];
                          const next =
                            statuses[(statuses.indexOf(item.status) + 1) % statuses.length];
                          setBoardItems(prev =>
                            prev.map(b => (b.id === item.id ? { ...b, status: next } : b))
                          );
                        }}
                        className={`px-3 py-1 rounded-full text-[10px] font-bold font-mono border transition shrink-0 ios-press cursor-pointer flex items-center gap-1.5 ${
                          isCalling
                            ? 'bg-emerald-500/25 text-emerald-300 border-emerald-500/50 animate-pulse'
                            : isPassover
                            ? 'bg-amber-500/25 text-amber-300 border-amber-500/50'
                            : isInProgress
                            ? 'bg-sky-500/25 text-sky-300 border-sky-500/50'
                            : 'bg-white/[0.06] text-neutral-400 border-white/10'
                        }`}
                        title="Tap to toggle live board status"
                      >
                        {isCalling && <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />}
                        {item.status}
                      </button>
                    </div>

                    {/* Venue & Parties */}
                    <div className="mt-3">
                      <div className="flex items-center gap-1.5 text-[11px] text-neutral-400 font-mono">
                        <MapPin size={11} className="text-neutral-500 shrink-0" />
                        <span className="truncate">{item.courtName}</span>
                      </div>

                      <p className="text-sm font-bold text-white mt-1 leading-snug">
                        {item.caseNumber}: <span className="font-medium text-neutral-200">{item.parties}</span>
                      </p>

                      <div className="flex items-center gap-2 mt-1.5 text-[11px] text-neutral-400">
                        <span className="truncate">{item.judgeName}</span>
                        <span>•</span>
                        <span className="text-amber-300 font-semibold truncate">{item.stage}</span>
                      </div>
                    </div>
                  </div>

                  {/* Card Bottom Actions */}
                  <div className="mt-4 pt-3 border-t border-white/[0.08] flex items-center justify-between gap-2">
                    <button
                      type="button"
                      onClick={() => handleOpenPostponeModal(item)}
                      className="flex-1 py-2 px-3 rounded-2xl bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-300 text-xs font-semibold font-mono transition ios-press flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <Calendar size={13} />
                      <span>{language === 'hi' ? 'स्थगित / आदेश दर्ज करें' : 'Postpone / Log Order'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        const text = `📋 Court Matter Update (${new Date().toLocaleDateString('en-IN')}):\nItem #${item.itemNumber} | ${item.courtHall}\nCourt: ${item.courtName}\nCase: ${item.caseNumber} (${item.parties})\nStage: ${item.stage}\nStatus: ${item.status}`;
                        navigator.clipboard?.writeText(text);
                        setToastMessage('📋 Matter copied to clipboard for sharing!');
                        setTimeout(() => setToastMessage(null), 2500);
                      }}
                      className="p-2 rounded-2xl bg-white/[0.06] hover:bg-white/[0.12] border border-white/[0.1] text-neutral-300 transition ios-press shrink-0"
                      title="Share matter via WhatsApp"
                    >
                      <Share2 size={14} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Carousel Pagination Indicator Dots */}
        {boardItems.length > 1 && (
          <div className="flex items-center justify-center gap-1.5 pt-0.5">
            {boardItems.map((_, i) => (
              <button
                key={i}
                type="button"
                onClick={() => scrollToIndex(i)}
                className={`h-1.5 rounded-full transition-all ${
                  activeIndex === i ? 'w-6 bg-emerald-400 shadow-sm shadow-emerald-400/50' : 'w-1.5 bg-white/20 hover:bg-white/40'
                }`}
                title={`Jump to card ${i + 1}`}
              />
            ))}
          </div>
        )}
      </div>

      {/* ── Postpone & Order Logger Modal (Interlinked with Diary, Case & Chat) ── */}
      <AnimatePresence>
        {selectedPostponeItem && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md"
          >
            <motion.div
              initial={{ scale: 0.95, y: 15 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 15 }}
              className="w-full max-w-md bg-neutral-950 border border-white/[0.15] rounded-3xl p-5 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-start justify-between pb-2 border-b border-white/[0.08]">
                <div>
                  <h3 className="text-base font-bold text-white font-display">
                    {language === 'hi' ? 'सुनवाई परिणाम व अगली तिथि' : 'Log Outcome & Next Date'}
                  </h3>
                  <p className="text-xs text-neutral-400 font-mono mt-0.5">
                    {selectedPostponeItem.caseNumber} • {selectedPostponeItem.parties}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedPostponeItem(null)}
                  className="p-1 rounded-full bg-white/[0.06] hover:bg-white/[0.12] text-neutral-400 hover:text-white transition"
                >
                  <X size={16} />
                </button>
              </div>

              {/* Hearing Outcome Chips */}
              <div>
                <label className="text-[11px] font-mono text-neutral-400 uppercase tracking-wider block mb-2">
                  {language === 'hi' ? 'सुनवाई का परिणाम' : 'Hearing Outcome'}
                </label>
                <div className="grid grid-cols-2 gap-2 text-xs font-medium">
                  {[
                    'Postponed / Adjourned',
                    'Arguments Concluded',
                    'Cross-Examination of PW',
                    'Order Reserved',
                    'Disposed / Decided',
                  ].map(opt => (
                    <button
                      key={opt}
                      type="button"
                      onClick={() => setPostponeOutcome(opt)}
                      className={`p-2.5 rounded-xl border text-left transition ios-press ${
                        postponeOutcome === opt
                          ? 'bg-amber-500/20 border-amber-500/50 text-amber-300 font-semibold'
                          : 'bg-white/[0.04] border-white/[0.08] text-neutral-300 hover:bg-white/[0.08]'
                      }`}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              </div>

              {/* Next Hearing Date Picker with Quick Presets */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-[11px] font-mono text-neutral-400 uppercase tracking-wider">
                    {language === 'hi' ? 'अगली सुनवाई तिथि' : 'Next Hearing Date'}
                  </label>
                  <div className="flex items-center gap-1.5">
                    {[
                      { label: '+3D', days: 3 },
                      { label: '+1W', days: 7 },
                      { label: '+2W', days: 14 },
                      { label: '+1M', days: 30 },
                    ].map(p => (
                      <button
                        key={p.label}
                        type="button"
                        onClick={() => setPostponeNextDate(getPresetDate(p.days))}
                        className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-white/[0.08] hover:bg-white/[0.15] text-neutral-300 transition"
                      >
                        {p.label}
                      </button>
                    ))}
                  </div>
                </div>
                <input
                  type="date"
                  value={postponeNextDate}
                  min={new Date().toISOString().split('T')[0]}
                  onChange={e => setPostponeNextDate(e.target.value)}
                  className="w-full bg-neutral-900 border border-white/[0.12] rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-400 font-mono"
                  required
                />
              </div>

              {/* Next Stage / Purpose */}
              <div>
                <label className="text-[11px] font-mono text-neutral-400 uppercase tracking-wider block mb-1.5">
                  {language === 'hi' ? 'अगला चरण / उद्देश्य' : 'Next Listing Stage / Purpose'}
                </label>
                <input
                  type="text"
                  value={postponeNextStage}
                  onChange={e => setPostponeNextStage(e.target.value)}
                  placeholder="e.g. Final Arguments / Cross Examination / Orders"
                  className="w-full bg-neutral-900 border border-white/[0.12] rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-400"
                />
              </div>

              {/* Judicial Order Notes / Reason */}
              <div>
                <label className="text-[11px] font-mono text-neutral-400 uppercase tracking-wider block mb-1.5">
                  {language === 'hi' ? 'अदालत आदेश सारांश / स्थगन कारण' : 'Order Notes / Reason for Postponement'}
                </label>
                <textarea
                  value={postponeOrderNotes}
                  onChange={e => setPostponeOrderNotes(e.target.value)}
                  rows={2}
                  placeholder="e.g. Adjourned at request of respondent counsel. Process fee to be filed."
                  className="w-full bg-neutral-900 border border-white/[0.12] rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-amber-400 resize-none"
                />
              </div>

              {/* Interlinked Direct Chat Broadcast Checkbox */}
              <div className="p-3 rounded-2xl bg-emerald-950/20 border border-emerald-500/30 flex items-start gap-2.5">
                <input
                  type="checkbox"
                  id="sendChatToggle"
                  checked={postponeSendChat}
                  onChange={e => setPostponeSendChat(e.target.checked)}
                  className="mt-0.5 w-4 h-4 rounded text-emerald-500 bg-neutral-900 border-white/20 focus:ring-0 cursor-pointer"
                />
                <label htmlFor="sendChatToggle" className="text-xs text-neutral-200 cursor-pointer">
                  <span className="font-semibold text-emerald-400 block">
                    {language === 'hi' ? 'क्लाइंट चैट में लाइव अपडेट भेजें' : 'Send Instant Live Update to Client Chat'}
                  </span>
                  <span className="text-[11px] text-neutral-400">
                    {language === 'hi'
                      ? 'क्लाइंट के चैट थ्रेड में तारीख और आदेश स्वतः प्रेषित होगा।'
                      : 'Automatically broadcasts the new hearing date and judicial order to the client’s chat thread.'}
                  </span>
                </label>
              </div>

              {/* Modal Action Buttons */}
              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedPostponeItem(null)}
                  className="flex-1 py-2.5 rounded-2xl bg-white/[0.08] hover:bg-white/[0.14] text-xs font-semibold text-neutral-300 transition ios-press"
                >
                  {language === 'hi' ? 'रद्द करें' : 'Cancel'}
                </button>
                <button
                  type="button"
                  onClick={handleConfirmPostpone}
                  className="flex-1 py-2.5 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black text-xs font-bold transition ios-press flex items-center justify-center gap-1.5 shadow-lg shadow-amber-500/20"
                >
                  <Gavel size={14} />
                  <span>{language === 'hi' ? 'आदेश व डायरी दर्ज करें' : 'Save & Attach to Diary'}</span>
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Primary Action Section ── */}
      <div className="space-y-3">
        {/* ── Today's Tasks & Timeline Calendar (Matching Image 2 Reference) ── */}
        <div className="space-y-2.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-orange-500 animate-pulse" />
              <h2 className="text-xs font-bold text-neutral-300 uppercase tracking-wider font-mono">
                {language === 'hi' ? 'दैनिक कार्य एवं समयरेखा' : language === 'mr' ? 'दैनिक कामे आणि वेळापत्रक' : "Today's Tasks & Timeline"}
              </h2>
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-orange-500/10 text-orange-400 border border-orange-500/20 font-bold">
              Live Calendar
            </span>
          </div>

          <TaskTimelineCalendar
            language={language}
            selectedDate={selectedDashboardDate}
            onSelectDate={setSelectedDashboardDate}
            hearings={hearings}
            onOpenCaseDetails={onNavigateToCases}
          />
        </div>

        {/* Legal Drafts & Documents Card */}
        <motion.div
          whileTap={{ scale: 0.98 }}
          onClick={onNavigateToCases}
          className="glass-card rounded-3xl p-4 sm:p-5 border border-white/[0.08] hover:border-white/[0.18] transition cursor-pointer flex items-center justify-between group mt-2"
        >
          <div className="flex items-center gap-3.5 min-w-0">
            <div className="w-12 h-12 rounded-2xl bg-neutral-900 border border-white/[0.1] flex items-center justify-center text-neutral-300 shrink-0 shadow-inner">
              <FileText size={22} className="text-neutral-300" />
            </div>
            <div className="min-w-0">
              <h3 className="text-sm font-bold text-white group-hover:text-neutral-200 transition">
                {language === 'hi' ? 'कानूनी मसौदे एवं दस्तावेज़' : language === 'mr' ? 'कायदेशीर मसुदे आणि कागदपत्रे' : 'Legal Drafts & Documents'}
              </h3>
              <p className="text-xs text-neutral-400 mt-0.5 line-clamp-1">
                {language === 'hi'
                  ? 'सत्यापित अनुबंध, नोटिस एवं कानूनी प्रारूप देखें।'
                  : language === 'mr'
                  ? 'करार, नोटिसा आणि कायदेशीर टेम्पलेट्स ब्राउझ करा.'
                  : 'Browse verified contracts, notices & legal templates.'}
              </p>
            </div>
          </div>
          <ChevronRight size={18} className="text-neutral-500 group-hover:text-white transition shrink-0 ml-2" />
        </motion.div>
      </div>

      {/* ── Recent Sessions (Image 3) ── */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-semibold text-neutral-400 uppercase tracking-wider font-mono">
            {language === 'hi' ? 'हाल के सत्र' : language === 'mr' ? 'अलीकडील सत्रे' : 'Recent Sessions'}
          </h2>
          <button
            type="button"
            onClick={onNavigateToChats}
            className="text-xs font-semibold text-amber-300 hover:text-amber-200 transition"
          >
            {language === 'hi' ? 'सभी देखें' : language === 'mr' ? 'सर्व पहा' : 'View All'}
          </button>
        </div>

        {threads.length === 0 ? (
          <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/[0.06] text-center text-xs text-neutral-400">
            <p>{language === 'hi' ? 'कोई सक्रिय सत्र नहीं' : 'No active client consultation sessions'}</p>
          </div>
        ) : (
          <div className="space-y-2">
            {threads.slice(0, 3).map(thread => (
              <motion.div
                key={thread.id}
                whileTap={{ scale: 0.98 }}
                onClick={() => onSelectThread(thread)}
                className="glass-card rounded-2xl p-3.5 border border-white/[0.06] hover:border-white/[0.14] flex items-center justify-between cursor-pointer transition"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-2xl bg-neutral-800 border border-white/10 flex items-center justify-center font-bold text-white text-xs shrink-0">
                    {thread.clientName.charAt(0)}
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-white truncate">{thread.clientName}</p>
                    <p className="text-[11px] text-neutral-400 truncate mt-0.5">{thread.matterSubject}</p>
                  </div>
                </div>
                <ChevronRight size={14} className="text-neutral-500 shrink-0 ml-2" />
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* ── Add Court Board Item Modal ── */}
      <AnimatePresence>
        {showAddBoardModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="glass-card rounded-3xl p-5 border border-white/[0.14] bg-neutral-950 w-full max-w-sm space-y-4 shadow-2xl"
            >
              <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-emerald-500/15 border border-emerald-500/25 flex items-center justify-center text-emerald-400">
                    <Gavel size={16} />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white font-display">
                      {language === 'hi' ? 'दैनिक बोर्ड में आइटम जोड़ें' : 'Add Cause List Item'}
                    </h3>
                    <p className="text-[10px] text-neutral-400 font-mono">
                      Court Room & Board Item Tracker
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowAddBoardModal(false)}
                  className="w-7 h-7 rounded-full bg-white/[0.06] hover:bg-white/[0.12] flex items-center justify-center text-neutral-400 hover:text-white"
                >
                  <X size={14} />
                </button>
              </div>

              <form onSubmit={handleAddBoardItem} className="space-y-3">
                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label className="text-[11px] font-medium text-neutral-300 block mb-1">
                      {language === 'hi' ? 'आइटम नंबर *' : 'Item Number *'}
                    </label>
                    <input
                      type="number"
                      required
                      value={newItemNumber}
                      onChange={e => setNewItemNumber(e.target.value)}
                      placeholder="e.g. 14"
                      className="w-full bg-white/[0.05] border border-white/[0.12] rounded-xl px-3 py-2 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-white/40 font-mono"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-medium text-neutral-300 block mb-1">
                      {language === 'hi' ? 'कोर्ट हॉल *' : 'Court Hall *'}
                    </label>
                    <input
                      type="text"
                      required
                      value={newCourtHall}
                      onChange={e => setNewCourtHall(e.target.value)}
                      placeholder="Court No. 04"
                      className="w-full bg-white/[0.05] border border-white/[0.12] rounded-xl px-3 py-2 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-white/40"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[11px] font-medium text-neutral-300 block mb-1">
                    {language === 'hi' ? 'अदालत का नाम' : 'Court / Complex Name'}
                  </label>
                  <input
                    type="text"
                    value={newCourtName}
                    onChange={e => setNewCourtName(e.target.value)}
                    placeholder="Tis Hazari / Saket / High Court"
                    className="w-full bg-white/[0.05] border border-white/[0.12] rounded-xl px-3 py-2 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-white/40"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-medium text-neutral-300 block mb-1">
                    {language === 'hi' ? 'केस नंबर *' : 'Case Number *'}
                  </label>
                  <input
                    type="text"
                    required
                    value={newCaseNumber}
                    onChange={e => setNewCaseNumber(e.target.value)}
                    placeholder="e.g. CC/5210/2026"
                    className="w-full bg-white/[0.05] border border-white/[0.12] rounded-xl px-3 py-2 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-white/40 font-mono"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-medium text-neutral-300 block mb-1">
                    {language === 'hi' ? 'पक्षकार' : 'Parties (Petitioner vs Respondent)'}
                  </label>
                  <input
                    type="text"
                    value={newParties}
                    onChange={e => setNewParties(e.target.value)}
                    placeholder="e.g. State vs. Verma"
                    className="w-full bg-white/[0.05] border border-white/[0.12] rounded-xl px-3 py-2 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-white/40"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-medium text-neutral-300 block mb-1">
                    {language === 'hi' ? 'सुनवाई का चरण' : 'Hearing Stage'}
                  </label>
                  <input
                    type="text"
                    value={newStage}
                    onChange={e => setNewStage(e.target.value)}
                    placeholder="e.g. Arguments / Cross Exam / Orders"
                    className="w-full bg-white/[0.05] border border-white/[0.12] rounded-xl px-3 py-2 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-white/40"
                  />
                </div>

                <div className="flex items-center gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowAddBoardModal(false)}
                    className="flex-1 py-2.5 rounded-xl bg-white/[0.06] hover:bg-white/[0.1] text-xs font-semibold text-neutral-300 transition ios-press"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-2.5 rounded-xl bg-emerald-500 text-black text-xs font-bold hover:bg-emerald-400 transition ios-press shadow-md"
                  >
                    {language === 'hi' ? 'बोर्ड में जोड़ें' : 'Add to Board'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
