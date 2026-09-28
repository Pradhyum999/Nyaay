import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Clock,
  Plus,
  Trash2,
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  ChevronRight,
  Check,
  X,
  Gavel,
  Briefcase,
  Users,
  Calendar as CalendarIcon
} from 'lucide-react';
import { HearingItem, Language } from '../types';

export interface PlannerTask {
  id: string;
  title: string;
  description?: string;
  date: string; // YYYY-MM-DD
  timeRange?: string; // e.g. "9:00 AM"
  category: 'Court Hearing' | 'Pleading & Drafting' | 'Client Meeting' | 'Office & Admin';
  completed: boolean;
  caseNumber?: string;
}

export function toLocalDateKey(d: Date): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

const DEFAULT_TASKS: PlannerTask[] = [
  {
    id: 'pt-1',
    title: 'Bail Arguments: CC/4128/2026',
    description: 'Tis Hazari Court (Court No. 04) • Hon’ble Judge',
    date: toLocalDateKey(new Date()),
    timeRange: '10:30 AM',
    category: 'Court Hearing',
    completed: false,
    caseNumber: 'CC/4128/2026',
  },
  {
    id: 'pt-2',
    title: 'Draft Written Statement',
    description: 'Prepare annexures and verify court fee stamp for Saket matter',
    date: toLocalDateKey(new Date()),
    timeRange: '02:00 PM',
    category: 'Pleading & Drafting',
    completed: true,
    caseNumber: 'CS/330/2024',
  },
  {
    id: 'pt-3',
    title: 'Client Pre-Trial Briefing',
    description: 'Review digital evidence and witness statement sequence',
    date: toLocalDateKey(new Date()),
    timeRange: '04:30 PM',
    category: 'Client Meeting',
    completed: false,
  },
];

interface TaskTimelineCalendarProps {
  language: Language;
  selectedDate: Date;
  onSelectDate: (d: Date) => void;
  hearings: HearingItem[];
  onOpenHearingOrder?: (hearing: HearingItem) => void;
  onOpenCaseDetails?: (caseNumber: string) => void;
}

export const TaskTimelineCalendar: React.FC<TaskTimelineCalendarProps> = ({
  language,
  selectedDate,
  onSelectDate,
  hearings,
  onOpenHearingOrder,
  onOpenCaseDetails,
}) => {
  const selectedDateKey = toLocalDateKey(selectedDate);
  const today = new Date();
  const todayKey = toLocalDateKey(today);

  // Week offset state to navigate forwards/backwards infinitely
  const [weekOffset, setWeekOffset] = useState(0);

  // Expandable Timeline state (Default collapsed as requested)
  const [isTimelineExpanded, setIsTimelineExpanded] = useState(false);

  // Master task store keyed by date
  const [allTasks, setAllTasks] = useState<PlannerTask[]>(() => {
    try {
      const saved = localStorage.getItem('nyaay_master_planner_tasks');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}
    return DEFAULT_TASKS;
  });

  // Modal State for New Task
  const [showNewTaskModal, setShowNewTaskModal] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newTime, setNewTime] = useState('11:00 AM');
  const [newCategory, setNewCategory] = useState<PlannerTask['category']>('Court Hearing');

  const saveAllTasks = (updated: PlannerTask[]) => {
    setAllTasks(updated);
    try {
      localStorage.setItem('nyaay_master_planner_tasks', JSON.stringify(updated));
    } catch {}
  };

  const toggleTask = (id: string) => {
    saveAllTasks(allTasks.map(t => (t.id === id ? { ...t, completed: !t.completed } : t)));
  };

  const deleteTask = (id: string) => {
    saveAllTasks(allTasks.filter(t => t.id !== id));
  };

  const handleCreateTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    const task: PlannerTask = {
      id: `task-${Date.now()}`,
      title: newTitle.trim(),
      description: newDescription.trim() || undefined,
      date: selectedDateKey,
      timeRange: newTime || '10:00 AM',
      category: newCategory,
      completed: false,
    };

    saveAllTasks([...allTasks, task]);
    setShowNewTaskModal(false);
    setNewTitle('');
    setNewDescription('');
  };

  // Filter tasks specifically for the SELECTED date
  const dateTasks = useMemo(() => {
    return allTasks.filter(t => t.date === selectedDateKey);
  }, [allTasks, selectedDateKey]);

  // Filter hearings specifically for the SELECTED date
  const dateHearings = useMemo(() => {
    return hearings.filter(h => {
      if (!h.hearingDate) return false;
      return h.hearingDate.startsWith(selectedDateKey);
    });
  }, [hearings, selectedDateKey]);

  // Calculate start of week (Monday) based on weekOffset
  const startOfWeek = useMemo(() => {
    const d = new Date(today);
    const day = d.getDay();
    const diff = day === 0 ? -6 : 1 - day; // Monday as first day
    d.setDate(d.getDate() + diff + weekOffset * 7);
    d.setHours(0, 0, 0, 0);
    return d;
  }, [weekOffset]);

  // Generate 7 days for the active week
  const weekDays = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(startOfWeek);
      d.setDate(startOfWeek.getDate() + i);
      return d;
    });
  }, [startOfWeek]);

  const dayLabels: Record<Language, string[]> = {
    en: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    hi: ['सोम', 'मंगल', 'बुध', 'गुरु', 'शुक्र', 'शनि', 'रवि'],
    mr: ['सोम', 'मंगळ', 'बुध', 'गुरु', 'शुक्र', 'शनि', 'रवि'],
  };

  // Combine scheduled hearings and tasks into unified timeline items for CURRENT DATE ONLY
  const timelineEvents = useMemo(() => {
    const hearingEvents = dateHearings.map(h => ({
      id: h.id,
      title: `${h.caseNumber}: ${language === 'hi' ? h.purposeHi : h.purposeEn}`,
      time: h.hearingTime || '10:30 AM',
      subtitle: `${h.courtName} • ${h.courtRoom}`,
      isHearing: true,
      hearing: h,
      completed: false,
    }));

    const taskEvents = dateTasks.map(t => ({
      id: t.id,
      title: t.title,
      time: t.timeRange || '12:00 PM',
      subtitle: t.description || t.category,
      isHearing: false,
      hearing: undefined as HearingItem | undefined,
      completed: t.completed,
    }));

    return [...hearingEvents, ...taskEvents];
  }, [dateHearings, dateTasks, language]);

  const featuredEvent = timelineEvents[0];

  // Title label based on date
  const isSelectedToday = selectedDateKey === todayKey;
  const isSelectedTomorrow = (() => {
    const tm = new Date(today);
    tm.setDate(tm.getDate() + 1);
    return toLocalDateKey(tm) === selectedDateKey;
  })();
  const isSelectedYesterday = (() => {
    const ys = new Date(today);
    ys.setDate(ys.getDate() - 1);
    return toLocalDateKey(ys) === selectedDateKey;
  })();

  const dateTitle = isSelectedToday
    ? (language === 'hi' ? 'आज' : language === 'mr' ? 'आज' : 'Today')
    : isSelectedTomorrow
    ? (language === 'hi' ? 'कल' : language === 'mr' ? 'उद्या' : 'Tomorrow')
    : isSelectedYesterday
    ? (language === 'hi' ? 'कल' : language === 'mr' ? 'काल' : 'Yesterday')
    : selectedDate.toLocaleDateString(language === 'hi' ? 'hi-IN' : 'en-IN', { weekday: 'long' });

  return (
    <div className="flex flex-col gap-4 text-white">
      {/* ── 1. Minimal Header with Infinite Week Navigation ── */}
      <div className="flex items-end justify-between pt-1">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-mono text-neutral-400 tracking-wider">
              {selectedDate.toLocaleDateString(language === 'hi' ? 'hi-IN' : 'en-IN', {
                month: 'long',
                day: 'numeric',
                year: 'numeric',
              })}
            </span>

            {/* Jump to Today Button when browsing other weeks/dates */}
            {(!isSelectedToday || weekOffset !== 0) && (
              <button
                type="button"
                onClick={() => {
                  setWeekOffset(0);
                  onSelectDate(new Date());
                }}
                className="px-2 py-0.5 rounded-full bg-white/10 hover:bg-white/20 text-[10px] font-bold text-amber-300 border border-amber-300/30 transition ios-press"
              >
                {language === 'hi' ? 'आज' : 'Today'}
              </button>
            )}
          </div>

          <h2 className="text-2xl font-bold tracking-tight text-white font-display mt-0.5">
            {dateTitle}
          </h2>
        </div>

        <div className="flex items-center gap-2">
          {/* Week Previous / Next navigation buttons */}
          <div className="flex items-center gap-1 bg-white/[0.06] p-1 rounded-full border border-white/[0.08]">
            <button
              type="button"
              onClick={() => {
                setWeekOffset(prev => prev - 1);
              }}
              className="w-7 h-7 rounded-full hover:bg-white/10 flex items-center justify-center text-neutral-300 hover:text-white transition ios-press"
              title="Previous Week"
            >
              <ChevronLeft size={15} />
            </button>
            <button
              type="button"
              onClick={() => {
                setWeekOffset(prev => prev + 1);
              }}
              className="w-7 h-7 rounded-full hover:bg-white/10 flex items-center justify-center text-neutral-300 hover:text-white transition ios-press"
              title="Next Week"
            >
              <ChevronRight size={15} />
            </button>
          </div>

          {/* Add Task Button */}
          <button
            type="button"
            onClick={() => setShowNewTaskModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white text-black font-bold text-xs hover:bg-neutral-200 transition ios-press shadow-sm"
          >
            <Plus size={14} strokeWidth={2.5} />
            <span>{language === 'hi' ? 'कार्य जोड़ें' : 'Add Task'}</span>
          </button>
        </div>
      </div>

      {/* ── 2. Weekday Strip (Tall Capsule Pill with Event Indicators) ── */}
      <div className="flex items-center justify-between gap-1.5 py-1">
        {weekDays.map((d, i) => {
          const isSelected = toLocalDateKey(d) === selectedDateKey;
          const isCurrentToday = toLocalDateKey(d) === todayKey;
          const dayName = dayLabels[language][i];
          const dayNum = d.getDate();
          const dKey = toLocalDateKey(d);

          // Check if this date has any hearings or tasks scheduled
          const hasEvents =
            allTasks.some(t => t.date === dKey) ||
            hearings.some(h => h.hearingDate?.startsWith(dKey));

          return (
            <motion.button
              key={i}
              type="button"
              onClick={() => onSelectDate(d)}
              whileTap={{ scale: 0.94 }}
              className={`flex-1 flex flex-col items-center justify-between rounded-full transition-all cursor-pointer relative ${
                isSelected
                  ? 'h-20 py-2.5 bg-neutral-900 border border-white/20 shadow-xl'
                  : 'h-14 py-2 hover:bg-white/[0.04] text-neutral-400'
              }`}
            >
              <span
                className={`text-xs font-bold leading-none ${
                  isSelected ? 'text-white text-sm' : isCurrentToday ? 'text-amber-400' : 'text-neutral-300'
                }`}
              >
                {dayNum}
              </span>
              <span
                className={`text-[9.5px] font-mono leading-none ${
                  isSelected ? 'text-neutral-300 font-semibold' : 'text-neutral-400'
                }`}
              >
                {dayName}
              </span>

              {/* Event indicator dot or selected indicator */}
              {isSelected ? (
                <motion.span
                  layoutId="calendar-pill-dot"
                  className="w-1.5 h-1.5 rounded-full bg-white mt-1"
                />
              ) : hasEvents ? (
                <span className="w-1 h-1 rounded-full bg-amber-400/80 mt-1" />
              ) : null}
            </motion.button>
          );
        })}
      </div>

      {/* ── 3. Featured Card (Shows primary event for SELECTED DATE) ── */}
      {featuredEvent ? (
        <div className="rounded-3xl p-4 sm:p-5 bg-gradient-to-tr from-neutral-950 via-neutral-900 to-neutral-800 border border-white/[0.12] shadow-2xl relative overflow-hidden">
          <div className="absolute inset-0 opacity-15 pointer-events-none bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.4),transparent_60%)]" />

          <div className="relative z-10 flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <span className="text-[10px] font-mono text-neutral-400 uppercase tracking-widest block">
                {featuredEvent.isHearing ? 'Court Docket' : 'Scheduled Task'}
              </span>
              <h3 className="text-base font-bold text-white tracking-tight mt-1 truncate">
                {featuredEvent.title}
              </h3>
              <p className="text-xs text-neutral-300 mt-1 line-clamp-1">
                {featuredEvent.subtitle}
              </p>

              <div className="flex items-center gap-1.5 mt-3">
                <div className="w-6 h-6 rounded-full bg-white/10 border border-white/20 flex items-center justify-center text-[10px] text-white font-bold">
                  {featuredEvent.isHearing ? <Gavel size={11} /> : <Briefcase size={11} />}
                </div>
                <span className="text-[10px] font-mono text-neutral-400">
                  {featuredEvent.isHearing ? 'Hon’ble Bench' : 'Daily Task Schedule'}
                </span>
              </div>
            </div>

            <div className="flex flex-col items-end justify-between h-full gap-4 shrink-0">
              <span className="text-xs font-bold font-mono text-white/90 bg-white/[0.08] px-2.5 py-1 rounded-full border border-white/10">
                {featuredEvent.time}
              </span>

              {featuredEvent.isHearing && onOpenHearingOrder ? (
                <button
                  type="button"
                  onClick={() => onOpenHearingOrder(featuredEvent.hearing!)}
                  className="w-8 h-8 rounded-full bg-white text-black flex items-center justify-center hover:bg-neutral-200 transition ios-press shadow-md"
                  title="Log Order"
                >
                  <Check size={14} strokeWidth={2.5} />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => toggleTask(featuredEvent.id)}
                  className={`w-8 h-8 rounded-full flex items-center justify-center transition ios-press shadow-md ${
                    featuredEvent.completed
                      ? 'bg-emerald-500 text-black'
                      : 'bg-white text-black hover:bg-neutral-200'
                  }`}
                  title="Toggle Complete"
                >
                  <Check size={14} strokeWidth={2.5} />
                </button>
              )}
            </div>
          </div>
        </div>
      ) : (
        /* Empty State for Selected Date */
        <div className="rounded-3xl p-5 bg-white/[0.02] border border-white/[0.06] text-center text-xs text-neutral-400">
          <CalendarIcon size={24} className="mx-auto mb-2 text-neutral-500 opacity-60" />
          <p className="font-semibold text-neutral-300">
            {language === 'hi'
              ? 'इस तारीख के लिए कोई सुनवाई या कार्य नहीं है'
              : 'No court hearings or tasks for this day'}
          </p>
          <p className="text-[11px] text-neutral-500 mt-1">
            {language === 'hi'
              ? 'नया कार्य जोड़ने के लिए ऊपर "+ कार्य जोड़ें" दबाएं'
              : 'Tap "+ Add Task" above to schedule tasks for this date.'}
          </p>
        </div>
      )}

      {/* ── 4. Expandable Timeline Button ── */}
      {timelineEvents.length > 0 && (
        <>
          <button
            type="button"
            onClick={() => setIsTimelineExpanded(!isTimelineExpanded)}
            className="w-full flex items-center justify-between px-4 py-2.5 rounded-2xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] text-xs font-semibold text-neutral-300 transition ios-press"
          >
            <div className="flex items-center gap-2">
              <Clock size={13} className="text-amber-400" />
              <span>
                {isTimelineExpanded ? 'Collapse Timeline' : 'View Full Schedule & Timeline'}
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-white/[0.06] text-neutral-400">
                {timelineEvents.length} items
              </span>
            </div>
            <div>
              {isTimelineExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </div>
          </button>

          {/* ── 5. Expandable Timeline Body ── */}
          <AnimatePresence>
            {isTimelineExpanded && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.28, ease: [0.4, 0, 0.2, 1] }}
                className="overflow-hidden"
              >
                <div className="relative pl-6 space-y-4 pt-2 pb-1">
                  <div className="absolute left-[11px] top-4 bottom-4 w-px bg-white/20" />

                  {timelineEvents.map((evt, idx) => {
                    const isFirst = idx === 0;

                    return (
                      <div key={evt.id} className="relative flex items-start gap-3 text-xs">
                        <div
                          className={`absolute -left-[19px] top-1.5 w-3.5 h-3.5 rounded-full border-2 bg-black flex items-center justify-center transition ${
                            isFirst ? 'border-white' : 'border-neutral-500'
                          }`}
                        >
                          {isFirst && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                        </div>

                        <div
                          className={`flex-1 rounded-2xl p-3.5 transition ${
                            isFirst
                              ? 'bg-neutral-900 border border-white/[0.12] text-white shadow-md'
                              : 'bg-white/[0.03] hover:bg-white/[0.06] border border-white/[0.06] text-neutral-300'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0">
                              <p className="font-bold text-white truncate">{evt.title}</p>
                              <p className="text-[11px] text-neutral-400 mt-0.5 truncate">{evt.subtitle}</p>
                            </div>
                            <span className="text-[10px] font-mono text-neutral-400 shrink-0">
                              {evt.time}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </>
      )}

      {/* ── 6. Minimalist Tasks List for SELECTED DATE ── */}
      {dateTasks.length > 0 && (
        <div className="space-y-2 pt-1">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white font-display">
              {language === 'hi' ? 'तारीख के कार्य' : language === 'mr' ? 'कामांची यादी' : 'Tasks for this Day'}
            </h3>
            <span className="text-xs text-neutral-400 font-mono">
              {dateTasks.filter(t => t.completed).length}/{dateTasks.length} done
            </span>
          </div>

          <div className="space-y-2">
            {dateTasks.map(t => (
              <div
                key={t.id}
                className="rounded-2xl p-3.5 bg-neutral-950/80 border border-white/[0.06] hover:border-white/[0.14] flex items-center justify-between gap-3 group transition"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <button
                    type="button"
                    onClick={() => toggleTask(t.id)}
                    className={`w-5 h-5 rounded-lg flex items-center justify-center border transition shrink-0 ${
                      t.completed
                        ? 'bg-white border-white text-black'
                        : 'border-white/30 hover:border-white/60 bg-transparent'
                    }`}
                  >
                    {t.completed && <Check size={12} strokeWidth={3} />}
                  </button>

                  <div className="min-w-0">
                    <p
                      className={`text-xs font-semibold leading-snug truncate transition ${
                        t.completed ? 'line-through text-neutral-500' : 'text-white'
                      }`}
                    >
                      {t.title}
                    </p>
                    {t.description && (
                      <p className="text-[11px] text-neutral-400 truncate mt-0.5">
                        {t.description}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {t.timeRange && (
                    <span className="text-[10px] font-mono text-neutral-400 bg-white/[0.05] px-2 py-0.5 rounded-full border border-white/[0.06]">
                      {t.timeRange}
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={() => deleteTask(t.id)}
                    className="text-neutral-500 hover:text-rose-400 p-1 opacity-0 group-hover:opacity-100 transition"
                    title="Delete task"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── 7. New Task Creation Modal ── */}
      <AnimatePresence>
        {showNewTaskModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="glass-card rounded-3xl p-5 border border-white/[0.14] bg-neutral-950 w-full max-w-sm space-y-4 shadow-2xl"
            >
              <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-white/[0.08] flex items-center justify-center text-white">
                    <Plus size={16} />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white font-display">
                      {language === 'hi' ? 'नया कार्य जोड़ें' : 'Add New Task'}
                    </h3>
                    <p className="text-[11px] text-neutral-400 font-mono">
                      {selectedDate.toLocaleDateString(language === 'hi' ? 'hi-IN' : 'en-IN', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowNewTaskModal(false)}
                  className="w-7 h-7 rounded-full bg-white/[0.06] hover:bg-white/[0.12] flex items-center justify-center text-neutral-400 hover:text-white"
                >
                  <X size={14} />
                </button>
              </div>

              <form onSubmit={handleCreateTask} className="space-y-3.5">
                <div>
                  <label className="text-[11px] font-medium text-neutral-300 block mb-1">
                    {language === 'hi' ? 'कार्य का शीर्षक' : 'Task Title *'}
                  </label>
                  <input
                    type="text"
                    required
                    value={newTitle}
                    onChange={e => setNewTitle(e.target.value)}
                    placeholder="e.g. Draft Bail Application, File Caveat"
                    className="w-full bg-white/[0.05] border border-white/[0.12] rounded-xl px-3 py-2 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-white/40"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-medium text-neutral-300 block mb-1">
                    {language === 'hi' ? 'विवरण या कोर्ट रूम' : 'Details / Notes'}
                  </label>
                  <input
                    type="text"
                    value={newDescription}
                    onChange={e => setNewDescription(e.target.value)}
                    placeholder="e.g. Court No. 4, Judge Sharma • Urgency"
                    className="w-full bg-white/[0.05] border border-white/[0.12] rounded-xl px-3 py-2 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-white/40"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label className="text-[11px] font-medium text-neutral-300 block mb-1">
                      {language === 'hi' ? 'समय' : 'Time'}
                    </label>
                    <input
                      type="text"
                      value={newTime}
                      onChange={e => setNewTime(e.target.value)}
                      placeholder="10:30 AM"
                      className="w-full bg-white/[0.05] border border-white/[0.12] rounded-xl px-3 py-2 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-white/40 font-mono"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-medium text-neutral-300 block mb-1">
                      {language === 'hi' ? 'श्रेणी' : 'Category'}
                    </label>
                    <select
                      value={newCategory}
                      onChange={e => setNewCategory(e.target.value as any)}
                      className="w-full bg-neutral-900 border border-white/[0.12] rounded-xl px-2.5 py-2 text-xs text-white focus:outline-none focus:border-white/40"
                    >
                      <option value="Court Hearing">Court Hearing</option>
                      <option value="Pleading & Drafting">Pleading & Drafting</option>
                      <option value="Client Meeting">Client Meeting</option>
                      <option value="Office & Admin">Office & Admin</option>
                    </select>
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowNewTaskModal(false)}
                    className="flex-1 py-2.5 rounded-xl bg-white/[0.06] hover:bg-white/[0.1] text-xs font-semibold text-neutral-300 transition ios-press"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-2.5 rounded-xl bg-white text-black text-xs font-bold hover:bg-neutral-200 transition ios-press shadow-md"
                  >
                    {language === 'hi' ? 'सहेजें' : 'Save Task'}
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
