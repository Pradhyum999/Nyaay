import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Card } from '../../design/ui/Card';
import { Button } from '../../design/ui/Button';
import { Segmented } from '../../design/ui/Segmented';
import { StatusBadge } from '../../design/ui/StatusBadge';
import { EmptyState } from '../../design/ui/EmptyState';
import {
  CaseFile,
  HearingItem,
  InvoiceItem,
  DocumentItem,
  Language,
  CaseTimelineEvent,
  CaseTask,
  CaseProfile,
} from '../../types';
import { getStagesForMatter } from '../../config/stages';
import { normaliseCaseNumber } from '../../lib/caseNumber';
import { askMyCase, CaseRoomContext, summarizeOrder } from '../../lib/ai';
import {
  subscribeToCase,
  subscribeToCaseTimeline,
  subscribeToCaseDocuments,
  subscribeToCaseTasks,
  subscribeToCaseHearings,
  subscribeToCaseInvoices,
  createCaseTask,
  updateCaseTask,
  deleteCaseTask,
  addTimelineEvent,
} from '../../services/firestoreService';
import {
  Scale,
  Calendar,
  Clock,
  MapPin,
  FileText,
  IndianRupee,
  MessageSquare,
  AlertCircle,
  Sparkles,
  ChevronRight,
  UploadCloud,
  Download,
  HelpCircle,
  X,
  Send,
  Loader2,
  Phone,
  ShieldCheck,
  CheckCircle2,
  CheckSquare,
  Square,
  Plus,
  Trash2,
  CalendarDays,
  FileCheck,
  UserCheck,
  Bot,
  ExternalLink,
  Info,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

export interface CaseRoomProps {
  cases: CaseFile[];
  activeCase?: CaseFile;
  hearings: HearingItem[];
  invoices: InvoiceItem[];
  documents?: DocumentItem[];
  language?: Language;
  onSelectCase: (caseNumber: string) => void;
  onNavigateToHelp: () => void;
  onMessageLawyer: (lawyerName: string) => void;
  onUploadDocument?: (file: any) => void;
  onPayInvoice?: (invoiceId: string) => void;
}

type CaseRoomTab = 'overview' | 'timeline' | 'documents' | 'tasks' | 'hearings' | 'fees';

export const CaseRoom: React.FC<CaseRoomProps> = ({
  cases,
  activeCase,
  hearings,
  invoices,
  documents = [],
  language = 'en',
  onSelectCase,
  onNavigateToHelp,
  onMessageLawyer,
  onUploadDocument,
  onPayInvoice,
}) => {
  const [activeTab, setActiveTab] = useState<CaseRoomTab>('overview');

  // Realtime Live Data States
  const [liveCase, setLiveCase] = useState<CaseFile | null>(null);
  const [liveTimeline, setLiveTimeline] = useState<CaseTimelineEvent[]>([]);
  const [liveDocs, setLiveDocs] = useState<DocumentItem[]>([]);
  const [liveTasks, setLiveTasks] = useState<CaseTask[]>([]);
  const [liveHearings, setLiveHearings] = useState<HearingItem[]>([]);
  const [liveInvoices, setLiveInvoices] = useState<InvoiceItem[]>([]);

  // "Ask My Case" State & Drawer
  const [isAskDrawerOpen, setIsAskDrawerOpen] = useState(false);
  const [selectedAskPrompt, setSelectedAskPrompt] = useState<string | null>(null);
  const [customQuestion, setCustomQuestion] = useState('');
  const [askAnswer, setAskAnswer] = useState<string | null>(null);
  const [askLoading, setAskLoading] = useState(false);

  // Court Order Explainer State
  const [explainingOrderId, setExplainingOrderId] = useState<string | null>(null);
  const [explainedOrders, setExplainedOrders] = useState<Record<string, string>>({});
  const [explainLoadingId, setExplainLoadingId] = useState<string | null>(null);

  // New Task Modal / Inline State
  const [isAddTaskOpen, setIsAddTaskOpen] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskAssignedTo, setNewTaskAssignedTo] = useState<'client' | 'lawyer'>('client');
  const [newTaskDueDate, setNewTaskDueDate] = useState('');
  const [creatingTask, setCreatingTask] = useState(false);

  // New Timeline Event State
  const [isAddEventOpen, setIsAddEventOpen] = useState(false);
  const [newEventTitle, setNewEventTitle] = useState('');
  const [newEventDesc, setNewEventDesc] = useState('');
  const [newEventDate, setNewEventDate] = useState(new Date().toISOString().split('T')[0]);
  const [creatingEvent, setCreatingEvent] = useState(false);

  // Profile narrative collapse state
  const [showFullProfile, setShowFullProfile] = useState(false);

  const askCache = useRef(new Map<string, string>());
  const explainCache = useRef(new Map<string, string>());
  const docInputRef = useRef<HTMLInputElement | null>(null);

  const t = (en: string, hi: string, mr?: string) =>
    language === 'mr' && mr ? mr : language === 'hi' ? hi : en;

  // If client has no cases yet
  if (!activeCase && cases.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-6 text-main min-h-[70vh] max-w-md mx-auto">
        <EmptyState
          icon={<Scale size={32} />}
          title={t('No Active Legal Case', 'कोई सक्रिय केस नहीं मिला', 'कोणताही सक्रिय खटला नाही')}
          description={t(
            'Consult with an advocate or describe your legal matter to open your Case Room.',
            'अपनी कानूनी समस्या का विवरण देकर या वकील से परामर्श लेकर अपना पहला केस शुरू करें।',
            'आपली कायदेशीर समस्या मांडून किंवा वकीलांशी संपर्क साधून तुमचा पहिला खटला सुरू करा.'
          )}
          actionLabel={t('Find Legal Help', 'कानूनी सहायता प्राप्त करें', 'कायदेशीर मदत मिळवा')}
          onAction={onNavigateToHelp}
        />
      </div>
    );
  }

  const currentCase = liveCase || activeCase || cases[0];
  const normalisedCase = normaliseCaseNumber(currentCase.caseNumber);
  const caseId = currentCase.id;

  // Realtime Subscriptions for current case
  useEffect(() => {
    if (!caseId) {
      setLiveCase(null);
      setLiveTimeline([]);
      setLiveDocs([]);
      setLiveTasks([]);
      setLiveHearings([]);
      setLiveInvoices([]);
      return;
    }

    const unsubCase = subscribeToCase(caseId, (c) => {
      if (c) setLiveCase(c);
    });

    const unsubTimeline = subscribeToCaseTimeline(caseId, (events) => {
      setLiveTimeline(events);
    });

    const unsubDocs = subscribeToCaseDocuments(caseId, (docs) => {
      setLiveDocs(docs);
    });

    const unsubTasks = subscribeToCaseTasks(caseId, (tasks) => {
      setLiveTasks(tasks);
    });

    const unsubHearings = subscribeToCaseHearings(caseId, (hList) => {
      setLiveHearings(hList);
    });

    const unsubInvoices = subscribeToCaseInvoices(caseId, (invList) => {
      setLiveInvoices(invList);
    });

    return () => {
      unsubCase?.();
      unsubTimeline?.();
      unsubDocs?.();
      unsubTasks?.();
      unsubHearings?.();
      unsubInvoices?.();
    };
  }, [caseId]);

  // Fallback to prop arrays when Firestore collections are still empty
  const effectiveHearings = useMemo(() => {
    if (liveHearings.length > 0) return liveHearings;
    return hearings.filter(h => normaliseCaseNumber(h.caseNumber) === normalisedCase);
  }, [liveHearings, hearings, normalisedCase]);

  const effectiveDocs = useMemo(() => {
    if (liveDocs.length > 0) return liveDocs;
    return documents.filter(d => d.caseNumber && normaliseCaseNumber(d.caseNumber) === normalisedCase);
  }, [liveDocs, documents, normalisedCase]);

  const effectiveInvoices = useMemo(() => {
    if (liveInvoices.length > 0) return liveInvoices;
    return invoices.filter(i => i.caseNumber && normaliseCaseNumber(i.caseNumber) === normalisedCase);
  }, [liveInvoices, invoices, normalisedCase]);

  const effectiveTimeline = useMemo(() => {
    if (liveTimeline.length > 0) return liveTimeline;
    if (currentCase.timeline && currentCase.timeline.length > 0) return currentCase.timeline;
    // Map hearings to initial timeline fallback if no events recorded
    return effectiveHearings.map(h => ({
      id: h.id,
      caseId: currentCase.id || 'case-1',
      type: 'hearing' as const,
      titleEn: `${h.stage} Hearing`,
      titleHi: `${h.stage} सुनवाई`,
      descriptionEn: h.purposeEn || h.previousOrderSummaryEn || 'Scheduled listing',
      descriptionHi: h.purposeHi || h.previousOrderSummaryHi || 'नियत सुनवाई',
      eventDate: h.hearingDate,
      actorName: 'Court Registry',
      actorRole: 'system' as const,
    }));
  }, [liveTimeline, currentCase, effectiveHearings]);

  const effectiveTasks = useMemo(() => {
    if (liveTasks.length > 0) return liveTasks;
    // If no tasks seeded yet, generate helpful contextual defaults
    const defaults: CaseTask[] = [];
    if (effectiveDocs.some(d => d.status === 'Missing' || d.status === 'Pending')) {
      defaults.push({
        id: 'task-doc-1',
        caseId: currentCase.id || 'c1',
        titleEn: 'Upload required verification documents',
        titleHi: 'आवश्यक सत्यापन दस्तावेज अपलोड करें',
        assignedTo: 'client',
        status: 'pending',
        dueDate: 'Within 7 days',
      });
    }
    defaults.push({
      id: 'task-review-1',
      caseId: currentCase.id || 'c1',
      titleEn: 'Review case brief and confirm matter details',
      titleHi: 'केस सारांश की समीक्षा करें और विवरण सत्यापित करें',
      assignedTo: 'client',
      status: 'pending',
      dueDate: 'Before next hearing',
    });
    return defaults;
  }, [liveTasks, effectiveDocs, currentCase]);

  // Stages
  const stages = getStagesForMatter(currentCase.caseType || currentCase.actSections?.join(', '));
  const currentStageIdx = stages.findIndex(
    s => s.name.toLowerCase() === (currentCase.stage || '').toLowerCase()
  );
  const safeStageIdx = currentStageIdx >= 0 ? currentStageIdx : 1;

  // Next hearing
  const nextHearing = effectiveHearings[0] || null;

  // Profile data
  const profile: CaseProfile | undefined = currentCase.profile;

  // Build CaseRoomContext for AI Grounding
  const buildContext = (): CaseRoomContext => ({
    caseFile: currentCase,
    hearings: effectiveHearings,
    documents: effectiveDocs,
    invoices: effectiveInvoices,
    tasks: effectiveTasks,
    timeline: effectiveTimeline,
  });

  // Ask My Case handler
  const handleAskCasePrompt = async (prompt: string) => {
    setSelectedAskPrompt(prompt);
    const key = `${currentCase.caseNumber}::${prompt}::${language}`;
    if (askCache.current.has(key)) {
      setAskAnswer(askCache.current.get(key)!);
      return;
    }
    setAskLoading(true);
    setAskAnswer(null);
    try {
      const ctx = buildContext();
      const answer = await askMyCase(prompt, ctx, language);
      askCache.current.set(key, answer);
      setAskAnswer(answer);
    } catch {
      setAskAnswer(
        t(
          'AI is unavailable right now — please try again in a moment.',
          'एआई वर्तमान में उपलब्ध नहीं है। कृपया थोड़ी देर बाद पुनः प्रयास करें।',
          'सध्या एआय उपलब्ध नाही. कृपया थोड्या वेळाने प्रयत्न करा.'
        )
      );
    } finally {
      setAskLoading(false);
    }
  };

  // Order summary handler
  const handleExplainOrder = async (orderId: string, orderText: string) => {
    if (explainedOrders[orderId]) {
      // Toggle off
      setExplainedOrders(prev => {
        const copy = { ...prev };
        delete copy[orderId];
        return copy;
      });
      return;
    }

    const key = `${orderId}::${language}`;
    if (explainCache.current.has(key)) {
      setExplainedOrders(prev => ({ ...prev, [orderId]: explainCache.current.get(key)! }));
      return;
    }

    setExplainLoadingId(orderId);
    try {
      const summary = await summarizeOrder(orderText, language);
      explainCache.current.set(key, summary);
      setExplainedOrders(prev => ({ ...prev, [orderId]: summary }));
    } catch {
      setExplainedOrders(prev => ({
        ...prev,
        [orderId]: t('Could not summarize order. Please retry.', 'आदेश समझने में त्रुटि हुई। कृपया पुनः प्रयास करें।', 'आदेश स्पष्ट करण्यात त्रुटी आली.'),
      }));
    } finally {
      setExplainLoadingId(null);
    }
  };

  // Toggle Task Completion
  const handleToggleTask = async (task: CaseTask) => {
    const nextStatus = task.status === 'done' ? 'pending' : 'done';
    // Optimistic update
    setLiveTasks(prev => prev.map(tk => tk.id === task.id ? { ...tk, status: nextStatus } : tk));

    if (task.id.startsWith('task-')) {
      // Offline local default task
      return;
    }
    try {
      await updateCaseTask(task.id, { status: nextStatus });
    } catch (err) {
      console.warn("Could not update task in Firestore:", err);
    }
  };

  // Delete Task
  const handleDeleteTask = async (taskId: string) => {
    setLiveTasks(prev => prev.filter(t => t.id !== taskId));
    if (!taskId.startsWith('task-')) {
      try {
        await deleteCaseTask(taskId);
      } catch (err) {
        console.warn("Could not delete task:", err);
      }
    }
  };

  // Create Task
  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;
    setCreatingTask(true);
    const title = newTaskTitle.trim();
    const newTask: Omit<CaseTask, 'id' | 'createdAt'> = {
      caseId: currentCase.id || 'case-1',
      titleEn: title,
      titleHi: title,
      assignedTo: newTaskAssignedTo,
      status: 'pending',
      dueDate: newTaskDueDate || undefined,
    };

    try {
      if (currentCase.id) {
        const id = await createCaseTask(newTask);
        setLiveTasks(prev => [{ ...newTask, id } as CaseTask, ...prev]);
      } else {
        const id = `local-task-${Date.now()}`;
        setLiveTasks(prev => [{ ...newTask, id } as CaseTask, ...prev]);
      }
      setNewTaskTitle('');
      setNewTaskDueDate('');
      setIsAddTaskOpen(false);
    } catch (err) {
      console.warn("Failed to create task:", err);
    } finally {
      setCreatingTask(false);
    }
  };

  // Add Timeline Event
  const handleCreateTimelineEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEventTitle.trim()) return;
    setCreatingEvent(true);
    const eventPayload: Omit<CaseTimelineEvent, 'id' | 'createdAt'> = {
      caseId: currentCase.id || 'case-1',
      type: 'note',
      titleEn: newEventTitle.trim(),
      titleHi: newEventTitle.trim(),
      descriptionEn: newEventDesc.trim() || undefined,
      descriptionHi: newEventDesc.trim() || undefined,
      eventDate: newEventDate || new Date().toISOString().split('T')[0],
      actorRole: 'client',
    };

    try {
      if (currentCase.id) {
        const id = await addTimelineEvent(eventPayload);
        setLiveTimeline(prev => [{ ...eventPayload, id } as CaseTimelineEvent, ...prev]);
      } else {
        const id = `event-${Date.now()}`;
        setLiveTimeline(prev => [{ ...eventPayload, id } as CaseTimelineEvent, ...prev]);
      }
      setNewEventTitle('');
      setNewEventDesc('');
      setIsAddEventOpen(false);
    } catch (err) {
      console.warn("Could not add timeline event:", err);
    } finally {
      setCreatingEvent(false);
    }
  };

  // Calendar ICS Download
  const handleDownloadIcs = () => {
    const title = `Court Listing: ${currentCase.caseNumber}`;
    const location = currentCase.courtLocation || 'Court';
    const description = `Court listing for ${currentCase.caseNumber} (${currentCase.clientName} vs. ${currentCase.opponentName || 'Opposite Party'}).`;
    const icsContent = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//NYAAYNEETI//Legal Operating System//EN',
      'BEGIN:VEVENT',
      `SUMMARY:${title}`,
      `DESCRIPTION:${description}`,
      `LOCATION:${location}`,
      `DTSTART:${new Date().toISOString().replace(/[-:]/g, '').split('.')[0]}Z`,
      `DTEND:${new Date(Date.now() + 3600000).toISOString().replace(/[-:]/g, '').split('.')[0]}Z`,
      'STATUS:CONFIRMED',
      'END:VEVENT',
      'END:VCALENDAR',
    ].join('\r\n');

    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `${currentCase.caseNumber.replace(/[\/\s]/g, '_')}_hearing.ics`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Counts for badges
  const pendingTasksCount = effectiveTasks.filter(t => t.status !== 'done').length;
  const missingDocsCount = effectiveDocs.filter(d => d.status === 'Missing' || d.status === 'Pending').length;

  return (
    <div className="flex flex-col gap-4 p-4 sm:p-6 pb-28 text-main max-w-4xl mx-auto w-full animate-in fade-in">
      {/* ── Case Switcher (if multiple cases) ── */}
      {cases.length > 1 && (
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
          <span className="text-xs text-sub font-semibold font-mono shrink-0">
            {t('My Matters:', 'मेरे केस:', 'माझे खटले:')}
          </span>
          {cases.map(c => (
            <button
              key={c.caseNumber}
              type="button"
              onClick={() => onSelectCase(c.caseNumber)}
              className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold transition ios-press shrink-0 ${
                c.caseNumber === currentCase.caseNumber
                  ? 'btn-ink shadow-sm'
                  : 'bg-neutral-100 dark:bg-white/[0.06] text-sub hover:text-main'
              }`}
            >
              {c.caseNumber || 'Unnamed Case'}
            </button>
          ))}
        </div>
      )}

      {/* ── Case Room Master Header (Hero Card) ── */}
      <Card className="border-amber-400/25 bg-gradient-to-b from-neutral-100 dark:from-white/[0.06] to-transparent shadow-sm">
        <div className="flex flex-col gap-3">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-mono font-bold px-2.5 py-0.5 rounded-full bg-amber-400/15 border border-amber-400/30 text-amber-700 dark:text-amber-300">
                  {currentCase.caseType || profile?.matterType || 'Matter Dossier'}
                </span>
                <StatusBadge status={currentCase.status || 'Active'} />
                {profile?.urgency && (
                  <span className={`text-[10px] font-mono uppercase font-bold px-2 py-0.5 rounded-full ${
                    profile.urgency === 'high' ? 'bg-red-500/15 text-red-600 dark:text-red-400 border border-red-500/30' : 'bg-blue-500/15 text-blue-600 dark:text-blue-400'
                  }`}>
                    {profile.urgency} Urgency
                  </span>
                )}
              </div>

              <h1 className="text-lg sm:text-xl font-bold font-mono text-main mt-1.5 truncate">
                {currentCase.caseNumber || 'Case Docket'}
              </h1>
              <p className="text-xs sm:text-sm text-sub mt-0.5 truncate">
                {currentCase.clientName} {currentCase.opponentName ? `vs. ${currentCase.opponentName}` : ''}
              </p>
              <div className="flex items-center gap-2 mt-1 text-[11px] text-faint font-mono">
                <span className="flex items-center gap-1">
                  <MapPin size={11} className="text-amber-500" />
                  {currentCase.courtLocation || profile?.location || 'District Court Jurisdiction'}
                </span>
                <span>•</span>
                <span>{currentCase.court || 'Court of Record'}</span>
              </div>
            </div>

            {/* Header Action Buttons */}
            <div className="flex items-center gap-2 shrink-0">
              <Button
                variant="primary"
                size="sm"
                icon={<Sparkles size={13} className="text-amber-400 dark:text-black animate-pulse" />}
                onClick={() => setIsAskDrawerOpen(true)}
                className="text-xs font-bold shadow-md"
              >
                {t('Ask My Case', 'केस से पूछें', 'खटल्यास विचारा')}
              </Button>

              <Button
                variant="secondary"
                size="sm"
                icon={<MessageSquare size={13} />}
                onClick={() => onMessageLawyer(currentCase.lawyerName || 'Advocate')}
                className="text-xs hidden sm:inline-flex"
              >
                {t('Message Counsel', 'वकील से बात करें', 'वकीलांशी बोला')}
              </Button>
            </div>
          </div>

          {/* Procedural Stage Stepper */}
          <div className="pt-2 border-t border-neutral-200 dark:border-white/[0.08]">
            <div className="flex items-center justify-between text-xs mb-1.5">
              <span className="font-semibold text-sub">
                {t('Current Procedural Stage:', 'वर्तमान कानूनी चरण:', 'खटल्याची सद्यस्थिती:')}{' '}
                <span className="text-main font-bold">{stages[safeStageIdx]?.name || currentCase.stage || 'Intake & Filing'}</span>
              </span>
              <span className="font-mono text-amber-600 dark:text-amber-300 font-bold">
                {safeStageIdx + 1} of {stages.length}
              </span>
            </div>
            <div className="w-full bg-neutral-200 dark:bg-white/[0.08] h-2 rounded-full overflow-hidden">
              <div
                className="bg-amber-400 h-full rounded-full transition-all duration-500"
                style={{ width: `${((safeStageIdx + 1) / stages.length) * 100}%` }}
              />
            </div>
          </div>
        </div>
      </Card>

      {/* Hidden file input for seamless document uploads */}
      <input
        type="file"
        ref={docInputRef}
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) {
            onUploadDocument?.(file);
            e.target.value = '';
          }
        }}
      />

      {/* ── 6-Tab Navigation Segmented Control ── */}
      <Segmented
        value={activeTab}
        onChange={(val) => setActiveTab(val as CaseRoomTab)}
        items={[
          { id: 'overview', label: t('Overview', 'अवलोकन', 'आढावा') },
          { id: 'timeline', label: t('Timeline', 'समयरेखा', 'समयरेखा'), badge: effectiveTimeline.length || undefined },
          { id: 'documents', label: t('Documents', 'दस्तावेज', 'कागदपत्रे'), badge: effectiveDocs.length || undefined },
          { id: 'tasks', label: t('Tasks', 'कार्य', 'कामे'), badge: pendingTasksCount || undefined },
          { id: 'hearings', label: t('Hearings', 'सुनवाई', 'सुनावणी'), badge: effectiveHearings.length || undefined },
          { id: 'fees', label: t('Fees & Pay', 'शुल्क व बिल', 'फी व भरणा') },
        ]}
      />

      {/* ═════════════════════════════════════════════════════════════════════════
          TAB 1: OVERVIEW
      ═════════════════════════════════════════════════════════════════════════ */}
      {activeTab === 'overview' && (
        <div className="space-y-4 animate-in fade-in duration-200">
          {/* Next Listing Hero Card */}
          {nextHearing ? (
            <Card className="border-amber-400/30 bg-gradient-to-br from-amber-400/[0.08] via-transparent to-transparent space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-2xl bg-amber-400/20 border border-amber-400/30 flex items-center justify-center text-amber-600 dark:text-amber-300 shrink-0">
                    <CalendarDays size={20} />
                  </div>
                  <div>
                    <span className="text-[10px] font-mono uppercase tracking-wider text-amber-600 dark:text-amber-400 font-bold block">
                      {t('Next Court Listing', 'अगली अदालती सुनवाई', 'पुढील न्यायालयीन सुनावणी')}
                    </span>
                    <h3 className="text-sm sm:text-base font-bold text-main">
                      {nextHearing.hearingDate}
                      {nextHearing.hearingTime ? ` • ${nextHearing.hearingTime}` : ''}
                    </h3>
                  </div>
                </div>

                <Button
                  size="sm"
                  variant="secondary"
                  icon={<Calendar size={13} />}
                  onClick={handleDownloadIcs}
                  className="text-xs shrink-0"
                >
                  {t('Add to Calendar', 'कैलेंडर में जोड़ें', 'कॅलेंडरमध्ये जोडा')}
                </Button>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-2 border-t border-neutral-200 dark:border-white/[0.08] text-xs">
                <div>
                  <span className="text-sub block text-[10px]">{t('Stage / Purpose', 'चरण / उद्देश्य', 'टप्पा / हेतू')}</span>
                  <span className="font-semibold text-main">{nextHearing.stage} • {nextHearing.purposeEn || 'Listing'}</span>
                </div>
                <div>
                  <span className="text-sub block text-[10px]">{t('Court Bench', 'न्यायालय कक्ष', 'कोर्ट कक्ष')}</span>
                  <span className="font-semibold text-main">{nextHearing.courtRoom || nextHearing.courtName || currentCase.court || 'Court Room 4'}</span>
                </div>
                <div>
                  <span className="text-sub block text-[10px]">{t('Presiding Judge', 'पीठासीन न्यायाधीश', 'न्यायाधीश')}</span>
                  <span className="font-semibold text-main">{nextHearing.judgeName || 'Hon’ble Bench'}</span>
                </div>
              </div>

              <div className="flex items-center justify-between pt-1 text-xs">
                <a
                  href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                    (nextHearing.courtName || currentCase.courtLocation || 'District Court') + ', India'
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-amber-600 dark:text-amber-300 hover:underline font-semibold"
                >
                  <MapPin size={12} className="text-amber-500" />
                  <span>{t('Directions to Court (Google Maps)', 'कोर्ट का रास्ता (गूगल मैप)', 'कोर्टाचा नकाशा')}</span>
                  <ExternalLink size={10} />
                </a>
              </div>
            </Card>
          ) : (
            <Card className="p-4 flex items-center justify-between text-xs bg-neutral-50 dark:bg-white/[0.02]">
              <div className="flex items-center gap-2">
                <Calendar size={16} className="text-amber-500" />
                <span className="text-sub">
                  {t('No upcoming court listing scheduled yet.', 'अभी कोई अगली सुनवाई नियत नहीं है।', 'पुढील सुनावणी अद्याप निश्चित झालेली नाही.')}
                </span>
              </div>
              <span className="text-[11px] font-mono text-faint">Status: Active</span>
            </Card>
          )}

          {/* Assigned Legal Counsel & Digital Chambers Card */}
          <Card className="border-amber-400/25 bg-gradient-to-br from-amber-400/[0.04] via-transparent to-transparent space-y-3.5">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <img
                    src="https://images.unsplash.com/photo-1556157382-97eda2d62296?w=150&auto=format&fit=crop&q=80"
                    alt={currentCase.lawyerName || 'Assigned Counsel'}
                    className="w-12 h-12 rounded-2xl object-cover border border-amber-400/30 shadow-md"
                  />
                  <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-emerald-500 border-2 border-neutral-900 rounded-full" title="Online" />
                </div>
                <div>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <h3 className="text-sm font-bold text-main">{currentCase.lawyerName || 'Adv. Rajesh Sharma'}</h3>
                    <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[9px] font-semibold bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30">
                      <ShieldCheck size={10} />
                      <span>{t('Verified Counsel', 'सत्यापित अधिवक्ता', 'प्रमाणित वकील')}</span>
                    </span>
                  </div>
                  <p className="text-[11px] text-sub font-mono mt-0.5">
                    BCI/D/1942/2012 • {t('High Court Counsel', 'उच्च न्यायालय अधिवक्ता', 'उच्च न्यायालय अधिवक्ता')}
                  </p>
                  <p className="text-[10px] text-faint mt-0.5">
                    {t('Chambers of Rajesh Sharma & Associates', 'शर्मा एंड एसोसिएट्स चैंबर्स', 'शर्मा ॲण्ड असोसिएट्स चेंबर्स')}
                  </p>
                </div>
              </div>

              <div className="text-right">
                <span className="text-[10px] uppercase font-mono tracking-wider text-amber-600 dark:text-amber-400 font-bold block">
                  {t('Direct Line', 'सीधा संपर्क', 'थेट संपर्क')}
                </span>
                <span className="text-[11px] text-sub font-mono">Encrypted • S.126 IEA</span>
              </div>
            </div>

            {/* Quick Action Matrix */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 border-t border-neutral-200 dark:border-white/[0.08]">
              <Button
                size="sm"
                variant="primary"
                icon={<MessageSquare size={13} />}
                onClick={() => onMessageLawyer(currentCase.lawyerName || 'Adv. Rajesh Sharma')}
                className="w-full text-xs font-semibold"
              >
                {t('Direct Chat', 'चैट संदेश', 'चॅट संदेश')}
              </Button>

              <Button
                size="sm"
                variant="secondary"
                icon={<Phone size={13} />}
                onClick={() => onMessageLawyer(currentCase.lawyerName || 'Adv. Rajesh Sharma')}
                className="w-full text-xs"
              >
                {t('Consultation', 'परामर्श कॉल', 'कॉल विनंती')}
              </Button>

              <Button
                size="sm"
                variant="secondary"
                icon={<UploadCloud size={13} />}
                onClick={() => docInputRef.current?.click()}
                className="w-full text-xs"
              >
                {t('Upload Files', 'दस्तावेज भेजें', 'कागदपत्र द्या')}
              </Button>

              <Button
                size="sm"
                variant="secondary"
                icon={<IndianRupee size={13} />}
                onClick={() => setActiveTab('fees')}
                className="w-full text-xs"
              >
                {t('Case Fees', 'शुल्क विवरण', 'फी भरा')}
              </Button>
            </div>

            {/* Legal Privilege Note */}
            <div className="text-[10px] text-faint flex items-center justify-between pt-0.5">
              <span className="flex items-center gap-1">
                <CheckCircle2 size={11} className="text-emerald-500" />
                {t(
                  'Advocate-Client privilege protected under Section 126 Evidence Act / BSA S.132',
                  'भारतीय साक्ष्य अधिनियम धारा १२६ अंतर्गत वकील-मुवक्किल गोपनीयता सुरक्षित',
                  'भारतीय पुरावा कायदा कलम १२६ अन्वये वकील-अशील संवाद संरक्षित'
                )}
              </span>
              <span className="text-[9px] font-mono text-amber-600 dark:text-amber-400 font-semibold">Privileged Channel</span>
            </div>
          </Card>

          {/* AI Structured Case Profile (Intake Summary) */}
          {profile && (
            <Card className="border-amber-400/20 bg-gradient-to-b from-neutral-100 dark:from-white/[0.03] to-transparent space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Bot size={15} className="text-amber-500" />
                  <span className="text-xs font-mono font-bold text-amber-700 dark:text-amber-300 uppercase">
                    {t('Case Intake Intelligence Dossier', 'केस इनटेक कानूनी डॉकेट', 'खटला पूर्व-माहिती डॉकेट')}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setShowFullProfile(!showFullProfile)}
                  className="text-xs text-sub hover:text-main flex items-center gap-1 font-semibold"
                >
                  <span>{showFullProfile ? t('Collapse', 'संक्षिप्त करें', 'संक्षिप्त') : t('Expand Details', 'विस्तार से देखें', 'तपशील')}</span>
                  {showFullProfile ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                </button>
              </div>

              <p className="text-xs text-main leading-relaxed">
                {profile.summaryText}
              </p>

              {showFullProfile && (
                <div className="space-y-3 pt-2 border-t border-neutral-200 dark:border-white/[0.08] animate-in fade-in">
                  {profile.facts && profile.facts.length > 0 && (
                    <div>
                      <h4 className="text-[11px] font-bold uppercase font-mono text-sub mb-1">
                        {t('Extracted Case Facts', 'प्रमाणित तथ्य', 'नोंदवलेली वस्तुस्थिती')}
                      </h4>
                      <ul className="space-y-1">
                        {profile.facts.map((fact, idx) => (
                          <li key={idx} className="text-xs text-sub flex items-start gap-1.5">
                            <span className="text-amber-500 mt-0.5">•</span>
                            <span>{fact}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {profile.missingInfo && profile.missingInfo.length > 0 && (
                    <div className="bg-amber-400/10 p-2.5 rounded-xl border border-amber-400/20">
                      <h4 className="text-[11px] font-bold uppercase font-mono text-amber-700 dark:text-amber-300 mb-1 flex items-center gap-1">
                        <AlertCircle size={12} />
                        {t('Missing Information to Clarify', 'स्पष्ट करने योग्य महत्वपूर्ण बिंदु', 'स्पष्टीकरण आवश्यक बाबी')}
                      </h4>
                      <ul className="space-y-1">
                        {profile.missingInfo.map((m, idx) => (
                          <li key={idx} className="text-xs text-main flex items-start gap-1.5">
                            <span className="text-amber-500 mt-0.5">?</span>
                            <span>{m}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  <div className="flex flex-wrap gap-2 text-[10px] font-mono text-faint pt-1">
                    <span>Category: {profile.legalArea}</span>
                    <span>•</span>
                    <span>Confidence Score: {profile.confidenceScore}%</span>
                    <span>•</span>
                    <span>Generated: {new Date(profile.generatedAt).toLocaleDateString()}</span>
                  </div>
                </div>
              )}
            </Card>
          )}

          {/* Quick Case Tasks Preview */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                <h3 className="text-xs font-bold uppercase tracking-wider font-mono text-sub">
                  {t('Action Items & Checklist', 'आवश्यक कार्य व चेकलिस्ट', 'कृती व तपासणी यादी')}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setActiveTab('tasks')}
                className="text-xs text-amber-600 dark:text-amber-300 font-semibold hover:underline"
              >
                {t('View All Tasks →', 'सभी कार्य देखें →', 'सर्व कामे पहा →')}
              </button>
            </div>

            <div className="grid gap-2">
              {effectiveTasks.slice(0, 3).map(task => (
                <Card
                  key={task.id}
                  className={`flex items-center justify-between p-3.5 transition ${
                    task.status === 'done' ? 'opacity-60 bg-neutral-50 dark:bg-white/[0.01]' : 'border-neutral-200 dark:border-white/[0.08]'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <button
                      type="button"
                      onClick={() => handleToggleTask(task)}
                      className="text-amber-500 hover:text-amber-400 shrink-0 transition"
                      aria-label="Toggle task"
                    >
                      {task.status === 'done' ? (
                        <CheckSquare size={18} className="text-emerald-500" />
                      ) : (
                        <Square size={18} />
                      )}
                    </button>
                    <div className="min-w-0">
                      <p className={`text-xs sm:text-sm font-semibold truncate ${task.status === 'done' ? 'line-through text-sub' : 'text-main'}`}>
                        {language === 'hi' && task.titleHi ? task.titleHi : task.titleEn}
                      </p>
                      <div className="flex items-center gap-2 text-[10px] text-faint font-mono mt-0.5">
                        <span className="capitalize">{task.assignedTo === 'client' ? 'Client' : 'Counsel'}</span>
                        {task.dueDate && <span>• Due: {task.dueDate}</span>}
                      </div>
                    </div>
                  </div>

                  <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full shrink-0 ${
                    task.status === 'done' ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' : 'bg-amber-400/15 text-amber-700 dark:text-amber-300'
                  }`}>
                    {task.status === 'done' ? 'Done' : 'Pending'}
                  </span>
                </Card>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ═════════════════════════════════════════════════════════════════════════
          TAB 2: TIMELINE
      ═════════════════════════════════════════════════════════════════════════ */}
      {activeTab === 'timeline' && (
        <div className="space-y-4 animate-in fade-in duration-200">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider font-mono text-sub">
              {t('Matter Chronology & Judicial Record', 'केस की समयरेखा व घटनाक्रम', 'खटल्याची अधिकृत समयरेखा')}
            </h3>
            <Button
              size="sm"
              variant="secondary"
              icon={<Plus size={13} />}
              onClick={() => setIsAddEventOpen(!isAddEventOpen)}
              className="text-xs"
            >
              {t('Add Timeline Event', 'घटनाक्रम जोड़ें', 'नोंद जोडा')}
            </Button>
          </div>

          {/* Add Event Form Modal/Sheet */}
          {isAddEventOpen && (
            <Card className="p-4 border-amber-400/30 bg-neutral-100 dark:bg-white/[0.04] space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-main font-mono">
                  {t('Record New Timeline Milestone', 'नया घटनाक्रम दर्ज करें', 'नवीन घटनाक्रम नोंदवा')}
                </span>
                <button type="button" onClick={() => setIsAddEventOpen(false)} className="text-sub hover:text-main">
                  <X size={14} />
                </button>
              </div>
              <form onSubmit={handleCreateTimelineEvent} className="space-y-2.5">
                <input
                  type="text"
                  value={newEventTitle}
                  onChange={(e) => setNewEventTitle(e.target.value)}
                  placeholder={t('Event Title (e.g. Demand Notice Dispatched)', 'शीर्षक (उदा. कानूनी नोटिस भेजा)', 'शीर्षक')}
                  required
                  className="w-full px-3 py-2 text-xs rounded-xl bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-white/[0.1] text-main focus:outline-none focus:border-amber-400"
                />
                <textarea
                  value={newEventDesc}
                  onChange={(e) => setNewEventDesc(e.target.value)}
                  placeholder={t('Details or reference notes (optional)...', 'विवरण (वैकल्पिक)...', 'तपशील...')}
                  rows={2}
                  className="w-full px-3 py-2 text-xs rounded-xl bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-white/[0.1] text-main focus:outline-none focus:border-amber-400"
                />
                <div className="flex items-center gap-2">
                  <input
                    type="date"
                    value={newEventDate}
                    onChange={(e) => setNewEventDate(e.target.value)}
                    className="px-3 py-1.5 text-xs rounded-xl bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-white/[0.1] text-main font-mono"
                  />
                  <div className="flex-1" />
                  <Button type="submit" size="sm" variant="primary" disabled={creatingEvent || !newEventTitle.trim()}>
                    {creatingEvent ? <Loader2 size={13} className="animate-spin" /> : t('Save Event', 'सुरक्षित करें', 'साठवा')}
                  </Button>
                </div>
              </form>
            </Card>
          )}

          {/* Timeline Events List */}
          <div className="relative pl-6 space-y-4 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-neutral-200 dark:before:bg-white/[0.1]">
            {effectiveTimeline.length > 0 ? (
              effectiveTimeline.map((ev, idx) => (
                <div key={ev.id || idx} className="relative group">
                  {/* Dot */}
                  <span className="absolute -left-6 top-1.5 w-3 h-3 rounded-full bg-amber-400 border-2 border-white dark:border-neutral-950 shadow-sm" />
                  <Card className="p-3.5 space-y-1.5">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[11px] font-mono text-amber-600 dark:text-amber-400 font-bold">
                        {ev.eventDate}
                      </span>
                      <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded-md bg-neutral-200 dark:bg-white/[0.06] text-sub">
                        {ev.type || 'Event'}
                      </span>
                    </div>
                    <h4 className="text-xs sm:text-sm font-bold text-main">
                      {language === 'hi' && ev.titleHi ? ev.titleHi : ev.titleEn}
                    </h4>
                    {(ev.descriptionEn || ev.descriptionHi) && (
                      <p className="text-xs text-sub leading-relaxed">
                        {language === 'hi' && ev.descriptionHi ? ev.descriptionHi : ev.descriptionEn}
                      </p>
                    )}
                    {ev.actorName && (
                      <span className="text-[10px] text-faint font-mono block pt-1">
                        Recorded by: {ev.actorName} ({ev.actorRole || 'Party'})
                      </span>
                    )}
                  </Card>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-xs text-sub">
                {t('No chronology recorded yet.', 'समयरेखा में अभी कोई प्रविष्टि नहीं है।', 'नोंद उपलब्ध नाही.')}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ═════════════════════════════════════════════════════════════════════════
          TAB 3: DOCUMENTS
      ═════════════════════════════════════════════════════════════════════════ */}
      {activeTab === 'documents' && (
        <div className="space-y-4 animate-in fade-in duration-200">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider font-mono text-sub">
                {t('Evidentiary Documents & Case Files', 'केस दस्तावेज एवं साक्ष्य', 'कागदपत्रे आणि पुरावे')}
              </h3>
              <p className="text-[11px] text-faint mt-0.5">
                {effectiveDocs.length} {t('documents tracked in digital chambers', 'दस्तावेज सुरक्षित हैं', 'कागदपत्रे नोंदवली आहेत')}
              </p>
            </div>
            <Button
              size="sm"
              variant="primary"
              icon={<UploadCloud size={13} />}
              onClick={() => docInputRef.current?.click()}
              className="text-xs"
            >
              {t('Upload File', 'दस्तावेज अपलोड करें', 'कागदपत्र जोडा')}
            </Button>
          </div>

          {/* Missing Checklist Banner (if profile requires specific docs) */}
          {profile?.documentsRequired && profile.documentsRequired.length > 0 && (
            <Card className="p-3.5 bg-amber-400/[0.05] border-amber-400/25 space-y-2">
              <div className="flex items-center gap-2">
                <FileCheck size={14} className="text-amber-500" />
                <h4 className="text-xs font-bold font-mono text-amber-700 dark:text-amber-300 uppercase">
                  {t('Statutory Document Checklist Required by Matter', 'इस केस के लिए आवश्यक वैधानिक दस्तावेज सूची', 'आवश्यक कागदपत्रांची यादी')}
                </h4>
              </div>
              <div className="grid sm:grid-cols-2 gap-2 pt-1">
                {profile.documentsRequired.map((docName, idx) => {
                  const matchingDoc = effectiveDocs.find(
                    d => (d.titleEn || d.title || '').toLowerCase().includes(docName.toLowerCase().slice(0, 10))
                  );
                  const isUploaded = matchingDoc && matchingDoc.status !== 'Missing';

                  return (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-2 rounded-xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-white/[0.06] text-xs"
                    >
                      <span className="truncate pr-2 font-medium text-main">{docName}</span>
                      <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full shrink-0 ${
                        isUploaded ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400' : 'bg-red-500/15 text-red-600 dark:text-red-400'
                      }`}>
                        {isUploaded ? 'Uploaded' : 'Missing'}
                      </span>
                    </div>
                  );
                })}
              </div>
            </Card>
          )}

          {/* Uploaded Documents List */}
          <div className="space-y-2">
            {effectiveDocs.length > 0 ? (
              effectiveDocs.map(doc => (
                <Card key={doc.id} className="flex items-center justify-between p-3.5 hover:border-amber-400/40 transition">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-xl bg-neutral-100 dark:bg-white/[0.06] flex items-center justify-center text-amber-500 shrink-0">
                      <FileText size={18} />
                    </div>
                    <div className="min-w-0">
                      <span className="text-xs sm:text-sm font-semibold text-main truncate block">
                        {doc.titleEn || doc.title || doc.name || 'Legal Filing Document'}
                      </span>
                      <div className="flex items-center gap-2 text-[10px] text-faint font-mono mt-0.5">
                        <span>{doc.size || doc.fileSize || '1.2 MB'}</span>
                        {doc.uploadedAt && <span>• Uploaded: {new Date(doc.uploadedAt).toLocaleDateString()}</span>}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <StatusBadge status={doc.status || 'Verified'} />
                    {doc.status === 'Missing' ? (
                      <Button size="sm" variant="secondary" onClick={() => docInputRef.current?.click()}>
                        <UploadCloud size={13} />
                        <span className="hidden sm:inline">{t('Upload', 'अपलोड', 'अपलोड')}</span>
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => alert(`Downloading verified court copy: ${doc.titleEn || 'document.pdf'}`)}
                        title="Download Document"
                      >
                        <Download size={13} />
                      </Button>
                    )}
                  </div>
                </Card>
              ))
            ) : (
              <div className="text-center py-10 space-y-2">
                <FileText size={32} className="mx-auto text-faint" />
                <p className="text-xs text-sub">
                  {t('No documents uploaded for this case yet.', 'इस केस में अभी कोई दस्तावेज नहीं हैं।', 'कागदपत्रे लवकरच जोडली जातील.')}
                </p>
                <Button size="sm" variant="secondary" onClick={() => docInputRef.current?.click()}>
                  <UploadCloud size={13} />
                  <span>{t('Upload First Document', 'पहला दस्तावेज अपलोड करें', 'पहिले कागदपत्र जोडा')}</span>
                </Button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ═════════════════════════════════════════════════════════════════════════
          TAB 4: TASKS
      ═════════════════════════════════════════════════════════════════════════ */}
      {activeTab === 'tasks' && (
        <div className="space-y-4 animate-in fade-in duration-200">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider font-mono text-sub">
                {t('Case Task Manager & Deadlines', 'केस कार्य सूची व समय-सीमा', 'खटल्यातील आवश्यक कामे')}
              </h3>
              <p className="text-[11px] text-faint mt-0.5">
                {effectiveTasks.filter(t => t.status === 'done').length} of {effectiveTasks.length} {t('tasks completed', 'कार्य पूर्ण', 'कामे पूर्ण')}
              </p>
            </div>
            <Button
              size="sm"
              variant="primary"
              icon={<Plus size={13} />}
              onClick={() => setIsAddTaskOpen(!isAddTaskOpen)}
              className="text-xs"
            >
              {t('New Task', 'नया कार्य', 'नवीन काम')}
            </Button>
          </div>

          {/* New Task Inline Card */}
          {isAddTaskOpen && (
            <Card className="p-4 border-amber-400/30 bg-neutral-100 dark:bg-white/[0.04] space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-main font-mono">
                  {t('Create Action Item', 'नया कार्य जोड़ें', 'नवीन काम तयार करा')}
                </span>
                <button type="button" onClick={() => setIsAddTaskOpen(false)} className="text-sub hover:text-main">
                  <X size={14} />
                </button>
              </div>
              <form onSubmit={handleCreateTask} className="space-y-2.5">
                <input
                  type="text"
                  value={newTaskTitle}
                  onChange={(e) => setNewTaskTitle(e.target.value)}
                  placeholder={t('Task title (e.g., Procure bank return memo from branch)', 'कार्य का नाम...', 'कामाचे नाव...')}
                  required
                  className="w-full px-3 py-2 text-xs rounded-xl bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-white/[0.1] text-main focus:outline-none focus:border-amber-400"
                />
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] text-sub font-mono block mb-1">
                      {t('Assigned To', 'किसे सौंपा गया', 'जबाबदारी')}
                    </label>
                    <select
                      value={newTaskAssignedTo}
                      onChange={(e) => setNewTaskAssignedTo(e.target.value as 'client' | 'lawyer')}
                      className="w-full px-3 py-1.5 text-xs rounded-xl bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-white/[0.1] text-main"
                    >
                      <option value="client">{t('Client (You)', 'मुवक्किल (आप)', 'अशील (तुम्ही)')}</option>
                      <option value="lawyer">{t('Advocate (Counsel)', 'अधिवक्ता', 'वकील')}</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] text-sub font-mono block mb-1">
                      {t('Due Date (Optional)', 'अंतिम तिथि', 'अंतिम मुदत')}
                    </label>
                    <input
                      type="date"
                      value={newTaskDueDate}
                      onChange={(e) => setNewTaskDueDate(e.target.value)}
                      className="w-full px-3 py-1.5 text-xs rounded-xl bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-white/[0.1] text-main font-mono"
                    />
                  </div>
                </div>
                <div className="flex justify-end gap-2 pt-1">
                  <Button type="button" size="sm" variant="secondary" onClick={() => setIsAddTaskOpen(false)}>
                    {t('Cancel', 'रद्द करें', 'रद्द')}
                  </Button>
                  <Button type="submit" size="sm" variant="primary" disabled={creatingTask || !newTaskTitle.trim()}>
                    {creatingTask ? <Loader2 size={13} className="animate-spin" /> : t('Add Task', 'कार्य जोड़ें', 'काम जोडा')}
                  </Button>
                </div>
              </form>
            </Card>
          )}

          {/* Tasks List */}
          <div className="space-y-2">
            {effectiveTasks.length > 0 ? (
              effectiveTasks.map(task => (
                <Card
                  key={task.id}
                  className={`flex items-center justify-between p-3.5 transition ${
                    task.status === 'done' ? 'opacity-60 bg-neutral-50 dark:bg-white/[0.01]' : 'hover:border-amber-400/30'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <button
                      type="button"
                      onClick={() => handleToggleTask(task)}
                      className="text-amber-500 hover:text-amber-400 shrink-0 transition"
                      aria-label="Toggle task status"
                    >
                      {task.status === 'done' ? (
                        <CheckSquare size={20} className="text-emerald-500" />
                      ) : (
                        <Square size={20} />
                      )}
                    </button>
                    <div className="min-w-0">
                      <p className={`text-xs sm:text-sm font-semibold truncate ${task.status === 'done' ? 'line-through text-sub' : 'text-main'}`}>
                        {language === 'hi' && task.titleHi ? task.titleHi : task.titleEn}
                      </p>
                      <div className="flex items-center gap-2 text-[10px] text-faint font-mono mt-0.5">
                        <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${
                          task.assignedTo === 'client' ? 'bg-amber-400/15 text-amber-700 dark:text-amber-300' : 'bg-blue-500/15 text-blue-600 dark:text-blue-400'
                        }`}>
                          {task.assignedTo === 'client' ? 'Client' : 'Counsel'}
                        </span>
                        {task.dueDate && <span>• Due: {task.dueDate}</span>}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full ${
                      task.status === 'done' ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400' : 'bg-amber-400/15 text-amber-700 dark:text-amber-300'
                    }`}>
                      {task.status === 'done' ? 'Completed' : 'Pending'}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleDeleteTask(task.id)}
                      className="text-sub hover:text-red-500 p-1 transition"
                      title="Delete Task"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </Card>
              ))
            ) : (
              <div className="text-center py-10 space-y-2">
                <CheckCircle2 size={32} className="mx-auto text-emerald-500" />
                <p className="text-xs text-sub">
                  {t('All action items completed!', 'सभी कार्य संपन्न हो चुके हैं!', 'सर्व कामे पूर्ण झाली आहेत!')}
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ═════════════════════════════════════════════════════════════════════════
          TAB 5: HEARINGS
      ═════════════════════════════════════════════════════════════════════════ */}
      {activeTab === 'hearings' && (
        <div className="space-y-4 animate-in fade-in duration-200">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider font-mono text-sub">
              {t('Court Listings & Judicial Orders', 'न्यायालयीन तारीखें व अदालती आदेश', 'न्यायालयीन सुनावण्या व आदेश')}
            </h3>
            <span className="text-xs font-mono text-faint">
              {effectiveHearings.length} {t('Listings on Record', 'तारीखें दर्ज', 'सुनावण्या')}
            </span>
          </div>

          <div className="space-y-3">
            {effectiveHearings.length > 0 ? (
              effectiveHearings.map(h => {
                const orderText = h.previousOrderSummaryEn || h.purposeEn || '';
                const isExplaining = explainLoadingId === h.id;
                const explained = explainedOrders[h.id];

                return (
                  <Card key={h.id} className="p-4 space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-xs font-bold font-mono text-amber-600 dark:text-amber-400">
                            {h.hearingDate} {h.hearingTime ? `• ${h.hearingTime}` : ''}
                          </span>
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-neutral-200 dark:bg-white/[0.06] text-sub">
                            {h.stage}
                          </span>
                        </div>
                        <h4 className="text-sm font-bold text-main mt-1">
                          {h.courtRoom || h.courtName || currentCase.court || 'District Court Bench'}
                        </h4>
                        <p className="text-xs text-sub mt-0.5">
                          {h.judgeName ? `Coram: ${h.judgeName}` : 'Presiding Judicial Magistrate / Judge'}
                        </p>
                      </div>

                      <Button size="sm" variant="secondary" icon={<Calendar size={12} />} onClick={handleDownloadIcs}>
                        ICS
                      </Button>
                    </div>

                    {/* Judicial Order Note */}
                    {orderText && (
                      <div className="p-3 rounded-2xl bg-neutral-50 dark:bg-white/[0.02] border border-neutral-200 dark:border-white/[0.06] space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] font-mono font-bold text-sub uppercase flex items-center gap-1.5">
                            <Scale size={13} className="text-amber-500" />
                            {t('Court Order / Purpose', 'अदालती आदेश / उद्देश्य', 'न्यायालयीन आदेश')}
                          </span>

                          <button
                            type="button"
                            onClick={() => handleExplainOrder(h.id, orderText)}
                            disabled={isExplaining}
                            className="inline-flex items-center gap-1 text-xs font-bold text-amber-600 dark:text-amber-300 hover:underline"
                          >
                            {isExplaining ? (
                              <Loader2 size={12} className="animate-spin" />
                            ) : (
                              <Sparkles size={12} />
                            )}
                            <span>
                              {explained
                                ? t('Hide Explanation', 'विवरण छिपाएं', 'स्पष्टीकरण लपवा')
                                : t('Explain in Simple Words', 'सरल शब्दों में समझें', 'सोप्या शब्दात समजावा')}
                            </span>
                          </button>
                        </div>

                        <p className="text-xs text-sub leading-relaxed italic">
                          "{orderText}"
                        </p>

                        {/* Plain Language AI Breakdown */}
                        {explained && (
                          <div className="p-3 rounded-xl bg-amber-400/10 border border-amber-400/25 text-xs text-main animate-in fade-in space-y-1.5 leading-relaxed">
                            <span className="font-bold text-amber-700 dark:text-amber-300 font-mono text-[11px] block">
                              💡 {t('Plain Language Explanation for Citizen:', 'नागरिक के लिए सरल भाषा में अर्थ:', 'सोपे स्पष्टीकरण:')}
                            </span>
                            <div className="whitespace-pre-wrap">{explained}</div>
                            <p className="text-[10px] text-faint italic pt-1 border-t border-amber-400/20">
                              {t('Informational guidance, not formal legal advice.', 'सूचनात्मक मार्गदर्शन, औपचारिक कानूनी सलाह नहीं।', 'माहितीपूर्ण मार्गदर्शन, कायदेशीर सल्ला नाही.')}
                            </p>
                          </div>
                        )}
                      </div>
                    )}
                  </Card>
                );
              })
            ) : (
              <div className="text-center py-10 space-y-2">
                <CalendarDays size={32} className="mx-auto text-faint" />
                <p className="text-xs text-sub">
                  {t('No court listing history recorded for this matter yet.', 'इस केस के लिए अभी कोई सुनवाई दर्ज नहीं है।', 'सुनावणी नोंद आढळली नाही.')}
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ═════════════════════════════════════════════════════════════════════════
          TAB 6: FEES & PAY
      ═════════════════════════════════════════════════════════════════════════ */}
      {activeTab === 'fees' && (
        <div className="space-y-4 animate-in fade-in duration-200">
          {/* Summary Balance Cards */}
          <div className="grid grid-cols-3 gap-2 p-3 rounded-2xl bg-neutral-100 dark:bg-white/[0.04] border border-neutral-200 dark:border-white/[0.08]">
            <div className="text-center p-2">
              <span className="text-[10px] font-mono uppercase text-sub block font-semibold">
                {t('Total Billed', 'कुल बिल', 'एकूण आकारलेली फी')}
              </span>
              <span className="text-sm font-bold font-mono text-main">
                ₹{effectiveInvoices.reduce((acc, i) => acc + (i.totalAmount || 0), 0).toLocaleString('en-IN')}
              </span>
            </div>
            <div className="text-center p-2 border-x border-neutral-200 dark:border-white/[0.08]">
              <span className="text-[10px] font-mono uppercase text-emerald-600 dark:text-emerald-400 block font-semibold">
                {t('Paid', 'जमा की गई', 'भरलेली रक्कम')}
              </span>
              <span className="text-sm font-bold font-mono text-emerald-700 dark:text-emerald-400">
                ₹{effectiveInvoices.filter(i => i.status === 'Paid').reduce((acc, i) => acc + (i.totalAmount || 0), 0).toLocaleString('en-IN')}
              </span>
            </div>
            <div className="text-center p-2">
              <span className="text-[10px] font-mono uppercase text-amber-600 dark:text-amber-400 block font-semibold">
                {t('Due Balance', 'बकाया', 'थकित बाकी')}
              </span>
              <span className="text-sm font-bold font-mono text-amber-700 dark:text-amber-300">
                ₹{effectiveInvoices.filter(i => i.status !== 'Paid').reduce((acc, i) => acc + (i.totalAmount || 0), 0).toLocaleString('en-IN')}
              </span>
            </div>
          </div>

          {/* Invoices List */}
          <div className="space-y-3">
            {effectiveInvoices.length > 0 ? (
              effectiveInvoices.map(inv => (
                <Card key={inv.id} className="p-4 space-y-3 border-neutral-200 dark:border-white/[0.08]">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono font-bold text-sub uppercase">{inv.invoiceNumber}</span>
                        <span className="text-[10px] text-faint">• {inv.date}</span>
                      </div>
                      <h3 className="text-lg font-bold font-mono text-main mt-1">
                        ₹{inv.totalAmount.toLocaleString('en-IN')}
                      </h3>
                      <div className="mt-1">
                        <StatusBadge status={inv.status} />
                      </div>
                    </div>

                    <div>
                      {inv.status !== 'Paid' ? (
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={() => onPayInvoice?.(inv.id)}
                          className="shadow-md text-xs font-bold"
                        >
                          {t('Pay via UPI', 'UPI से भुगतान करें', 'UPI द्वारे भरा')}
                        </Button>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] font-mono text-emerald-700 dark:text-emerald-400 font-semibold bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20">
                          <CheckCircle2 size={12} />
                          <span>{t('Settled & Verified', 'भुगतान सफल', 'भरणा पूर्ण')}</span>
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Fee Breakdown */}
                  <div className="grid grid-cols-3 gap-2 pt-2 border-t border-neutral-200 dark:border-white/[0.08] text-[11px] font-mono">
                    <div>
                      <span className="text-faint block text-[9px] uppercase">Appearance</span>
                      <span className="text-sub font-semibold">₹{(inv.appearanceFee || 0).toLocaleString('en-IN')}</span>
                    </div>
                    <div>
                      <span className="text-faint block text-[9px] uppercase">Drafting</span>
                      <span className="text-sub font-semibold">₹{(inv.draftingFee || 0).toLocaleString('en-IN')}</span>
                    </div>
                    <div>
                      <span className="text-faint block text-[9px] uppercase">Clerkage & Misc</span>
                      <span className="text-sub font-semibold">₹{(inv.clerkageAndMisc || 0).toLocaleString('en-IN')}</span>
                    </div>
                  </div>
                </Card>
              ))
            ) : (
              <div className="text-center py-10 space-y-3">
                <IndianRupee size={32} className="mx-auto text-faint" />
                <p className="text-xs text-sub max-w-xs mx-auto">
                  {t('No invoices billed for this matter yet.', 'इस केस के लिए कोई बकाया बिल या चालान नहीं है।', 'या खटल्यासाठी कोणतीही प्रलंबित पावती नाही.')}
                </p>
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => onMessageLawyer(currentCase.lawyerName || 'Adv. Rajesh Sharma')}
                >
                  <MessageSquare size={13} />
                  <span>{t('Request Retainer Quote', 'शुल्क विवरण पूछें', 'फी अंदाज विचारा')}</span>
                </Button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ═════════════════════════════════════════════════════════════════════════
          "ASK MY CASE" DRAWER / MODAL (THE GROUNDED CASE AI)
      ═════════════════════════════════════════════════════════════════════════ */}
      {isAskDrawerOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in">
          <div className="w-full max-w-xl bg-white dark:bg-neutral-950 border border-neutral-200 dark:border-amber-400/30 rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh] animate-in slide-in-from-bottom duration-300">
            {/* Header */}
            <div className="px-5 py-4 border-b border-neutral-200 dark:border-white/[0.08] flex items-center justify-between bg-neutral-50 dark:bg-neutral-900">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-amber-400/20 border border-amber-400/40 flex items-center justify-center text-amber-500">
                  <Sparkles size={16} />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-main font-mono">
                    {t('Ask My Case AI', 'केस कानूनी सलाहकार', 'खटला एआय सल्लागार')}
                  </h3>
                  <p className="text-[10px] text-faint">
                    Grounded strictly on {currentCase.caseNumber} dossier & filings
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsAskDrawerOpen(false);
                  setSelectedAskPrompt(null);
                  setAskAnswer(null);
                }}
                className="w-8 h-8 rounded-full flex items-center justify-center text-sub hover:text-main bg-neutral-200 dark:bg-white/[0.08]"
              >
                <X size={15} />
              </button>
            </div>

            {/* Body */}
            <div className="p-4 sm:p-5 overflow-y-auto space-y-4">
              {/* Quick Prompts */}
              <div>
                <span className="text-[10px] font-mono uppercase tracking-wider text-faint font-bold block mb-2">
                  {t('Suggested Case Prompts', 'सुझाए गए प्रश्न', 'सुचवलेले प्रश्न')}
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {[
                    t('What should I do before the next hearing?', 'अगली सुनवाई से पहले मुझे क्या तैयारी करनी चाहिए?', 'पुढील सुनावणीपूर्वी मी काय करावे?'),
                    t('Explain the last court order in plain language', 'पिछली अदालत के आदेश का सरल अर्थ क्या है?', 'मागील कोर्ट आदेशाचा सोपा अर्थ काय आहे?'),
                    t('What documents did my lawyer ask me to bring?', 'मेरे वकील ने मुझसे कौन से दस्तावेज मांगे हैं?', 'वकीलांनी कोणती कागदपत्रे आणण्यास सांगितले?'),
                    t('Give me a timeline summary of this matter', 'इस पूरे केस का संक्षिप्त घटनाक्रम बताएं', 'या खटल्याचा थोडक्यात घटनाक्रम द्या'),
                    t('Summarize this case for a new lawyer', 'नए वकील को समझाने हेतु केस का सारांश तैयार करें', 'नवीन वकिलासाठी केसचा सारांश'),
                  ].map(p => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => handleAskCasePrompt(p)}
                      className={`px-3 py-1.5 rounded-xl text-xs transition text-left ios-press ${
                        selectedAskPrompt === p
                          ? 'btn-ink font-bold shadow-sm'
                          : 'bg-neutral-100 dark:bg-white/[0.04] hover:bg-neutral-200 dark:hover:bg-white/[0.08] text-sub border border-neutral-200 dark:border-white/[0.06]'
                      }`}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>

              {/* Freeform Question Form */}
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (customQuestion.trim() && !askLoading) {
                    handleAskCasePrompt(customQuestion.trim());
                    setCustomQuestion('');
                  }
                }}
                className="flex gap-2"
              >
                <input
                  type="text"
                  value={customQuestion}
                  onChange={(e) => setCustomQuestion(e.target.value)}
                  placeholder={t('Ask anything about this case workspace...', 'इस केस के बारे में कोई भी प्रश्न पूछें...', 'या खटल्याबद्दल प्रश्न विचारा...')}
                  className="flex-1 px-3.5 py-2.5 text-xs rounded-xl bg-neutral-100 dark:bg-white/[0.04] border border-neutral-300 dark:border-white/[0.1] text-main placeholder:text-faint focus:outline-none focus:border-amber-400"
                />
                <Button
                  type="submit"
                  size="sm"
                  variant="primary"
                  disabled={askLoading || !customQuestion.trim()}
                  icon={askLoading ? <Loader2 size={13} className="animate-spin" /> : <Send size={13} />}
                >
                  {t('Ask', 'पूछें', 'विचारा')}
                </Button>
              </form>

              {/* Loading State */}
              {askLoading && (
                <div className="p-4 rounded-2xl bg-neutral-100 dark:bg-white/[0.03] border border-neutral-200 dark:border-white/[0.06] text-xs text-sub flex items-center gap-3">
                  <Loader2 size={16} className="animate-spin text-amber-500 shrink-0" />
                  <span>{t('Synthesizing case filings, orders, and timeline…', 'केस दस्तावेजों और आदेशों का विश्लेषण हो रहा है…', 'खटल्याचे विश्लेषण सुरू आहे…')}</span>
                </div>
              )}

              {/* Answer Display */}
              {askAnswer && !askLoading && (
                <div className="p-4 rounded-2xl bg-amber-400/10 border border-amber-400/30 text-xs text-main animate-in fade-in space-y-2 leading-relaxed">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-amber-700 dark:text-amber-300 font-mono text-[11px] flex items-center gap-1.5">
                      <Sparkles size={13} />
                      {t('Grounded Case Intelligence Response', 'केस विश्लेषण उत्तर', 'खटला विश्लेषण उत्तर')}
                    </span>
                    <span className="text-[9px] font-mono text-faint">NYAAY Case AI</span>
                  </div>
                  <div className="whitespace-pre-wrap">{askAnswer}</div>
                  <p className="text-[10px] text-faint italic pt-1.5 border-t border-amber-400/20">
                    {t(
                      'Answers are grounded on uploaded case files and docket information. Informational guidance only, not legal advice.',
                      'उत्तर उपलब्ध केस दस्तावेजों पर आधारित हैं। केवल सूचनात्मक मार्गदर्शन, कानूनी सलाह नहीं।',
                      'माहितीपूर्ण मार्गदर्शन, कायदेशीर सल्ला नाही.'
                    )}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
