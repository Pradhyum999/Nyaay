import React, { useState, useMemo } from 'react';
import { HearingCard } from '../hearings/HearingCard';
import { LogOrderSheet, LogOrderData } from '../hearings/LogOrderSheet';
import { HearingFormSheet } from '../hearings/HearingFormSheet';
import { SectionHeader } from '../../design/ui/SectionHeader';
import { Card } from '../../design/ui/Card';
import { Button } from '../../design/ui/Button';
import { EmptyState } from '../../design/ui/EmptyState';
import { HearingCalendar } from '../../components/HearingCalendar';
import { HearingItem, CaseFile, LimitationAlert, Language } from '../../types';
import { Sparkles, Calendar, AlertTriangle, CheckSquare, Plus, ChevronLeft, ChevronRight, Clock, CalendarDays, Trash2, Gavel, CheckCircle2 } from 'lucide-react';
import { TimePicker } from '../../design/ui/TimePicker';
import { getISTDateString, isSameDayIST, getHearingCountdown } from '../../lib/istDate';

interface TodayPageProps {
  hearings: HearingItem[];
  cases: CaseFile[];
  limitationAlerts: LimitationAlert[];
  language?: Language;
  onNavigateToCases: () => void;
  onOpenCase: (caseNumber: string) => void;
  onMessageClient?: (caseNumber: string, clientName: string) => void;
  onUpdateHearingOrder?: (hearingId: string, orderNotes: string, nextDate: string) => void;
  onAddHearing?: (hearing: Omit<HearingItem, 'id'> & { id?: string }) => void;
  onEditHearing?: (hearing: HearingItem) => void;
  onSendHearingChatUpdate?: (params: {
    caseNumber: string;
    clientName: string;
    court: string;
    status: string;
    nextDate: string;
    stage: string;
    orderNotes: string;
  }) => void;
  onSummarizeDay?: (prompt?: string) => void;
}

function parseTimeToMinutes(timeStr?: string): number {
  if (!timeStr) return 9999;
  const cleaned = timeStr.trim().toLowerCase();

  const match12 = cleaned.match(/(\d{1,2})(?::(\d{2}))?\s*(am|pm)/i);
  if (match12) {
    let hours = parseInt(match12[1], 10);
    const mins = match12[2] ? parseInt(match12[2], 10) : 0;
    const meridian = match12[3].toLowerCase();
    if (meridian === 'pm' && hours < 12) hours += 12;
    if (meridian === 'am' && hours === 12) hours = 0;
    return hours * 60 + mins;
  }

  const match24 = cleaned.match(/(\d{1,2}):(\d{2})/);
  if (match24) {
    const hours = parseInt(match24[1], 10);
    const mins = parseInt(match24[2], 10);
    return hours * 60 + mins;
  }

  const matchFuzzy = cleaned.match(/(\d{1,2})\s*(am|pm)/i);
  if (matchFuzzy) {
    let hours = parseInt(matchFuzzy[1], 10);
    if (matchFuzzy[2].toLowerCase() === 'pm' && hours < 12) hours += 12;
    if (matchFuzzy[2].toLowerCase() === 'am' && hours === 12) hours = 0;
    return hours * 60;
  }

  return 9999;
}

export const TodayPage: React.FC<TodayPageProps> = ({
  hearings,
  cases,
  limitationAlerts,
  language = 'en',
  onNavigateToCases,
  onOpenCase,
  onMessageClient,
  onUpdateHearingOrder,
  onAddHearing,
  onEditHearing,
  onSendHearingChatUpdate,
  onSummarizeDay,
}) => {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [viewMode, setViewMode] = useState<'timeline' | 'list' | 'month'>('timeline');
  const [activeLogOrderHearing, setActiveLogOrderHearing] = useState<HearingItem | null>(null);
  const [showAddHearingSheet, setShowAddHearingSheet] = useState(false);
  const [editingHearing, setEditingHearing] = useState<HearingItem | null>(null);

  const [weekOffset, setWeekOffset] = useState<number>(0);

  const t = (en: string, hi: string, mr: string) => {
    if (language === 'mr') return mr;
    if (language === 'hi') return hi;
    return en;
  };

  // Dynamic daily tasks per date, persisted in localStorage
  const [dailyTasks, setDailyTasks] = useState<Array<{ id: string; title: string; time?: string; date: string; completed: boolean }>>(() => {
    try {
      const saved = localStorage.getItem('nyaay_daily_tasks');
      if (saved) return JSON.parse(saved);
    } catch {}
    return [];
  });

  const [showAddTaskInput, setShowAddTaskInput] = useState<boolean>(false);
  const [newTaskTitle, setNewTaskTitle] = useState<string>('');
  const [newTaskTime, setNewTaskTime] = useState<string>('');

  const saveDailyTasks = (updated: typeof dailyTasks) => {
    setDailyTasks(updated);
    try {
      localStorage.setItem('nyaay_daily_tasks', JSON.stringify(updated));
    } catch {}
  };

  // 7-day week strip dates with week offset navigation
  const weekDays = useMemo(() => {
    const today = new Date();
    const startOfWeek = new Date(today);
    // start 2 days before today + offset
    startOfWeek.setDate(today.getDate() - 2 + (weekOffset * 7));

    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(startOfWeek);
      d.setDate(startOfWeek.getDate() + i);
      return d;
    });
  }, [weekOffset]);

  const isSameDay = (d1: Date, d2: Date) => {
    return isSameDayIST(d1, d2);
  };

  // Format date helper in IST
  const selectedDateStr = getISTDateString(selectedDate);
  const isTodaySelected = isSameDayIST(selectedDate, new Date());

  // Hearings for the selected date, sorted chronologically by scheduled time (Bug 7)
  const dayHearings = useMemo(() => {
    const list = hearings.filter(h => {
      if (!h.hearingDate) return false;
      if (isTodaySelected && (h.hearingDate.startsWith('Today') || h.hearingDate.includes('Today'))) {
        return true;
      }
      return h.hearingDate.startsWith(selectedDateStr) || h.hearingDate.includes(selectedDateStr);
    });

    return [...list].sort((a, b) => {
      const timeA = parseTimeToMinutes(a.hearingTime || a.hearingDate);
      const timeB = parseTimeToMinutes(b.hearingTime || b.hearingDate);
      if (timeA !== timeB) return timeA - timeB;
      return (a.itemNumber || 999) - (b.itemNumber || 999);
    });
  }, [hearings, selectedDateStr, isTodaySelected]);

  // Tasks for the selected date, sorted chronologically by scheduled time (Bug 7)
  const tasksForSelectedDate = useMemo(() => {
    const list = dailyTasks.filter(t => t.date === selectedDateStr);
    return [...list].sort((a, b) => {
      const timeA = parseTimeToMinutes(a.time);
      const timeB = parseTimeToMinutes(b.time);
      return timeA - timeB;
    });
  }, [dailyTasks, selectedDateStr]);

  // Combined Chronological Timeline (Bug 7)
  const timelineItems = useMemo(() => {
    const items: Array<{
      id: string;
      type: 'hearing' | 'task';
      timeMinutes: number;
      displayTime: string;
      hearing?: HearingItem;
      task?: { id: string; title: string; time?: string; date: string; completed: boolean };
    }> = [];

    dayHearings.forEach(h => {
      const tMin = parseTimeToMinutes(h.hearingTime || h.hearingDate);
      items.push({
        id: `h-${h.id}`,
        type: 'hearing',
        timeMinutes: tMin,
        displayTime: h.hearingTime || (tMin < 9999 ? `${Math.floor(tMin / 60) % 12 || 12}:${(tMin % 60).toString().padStart(2, '0')} ${tMin >= 720 ? 'PM' : 'AM'}` : 'Court Session'),
        hearing: h,
      });
    });

    tasksForSelectedDate.forEach(task => {
      const tMin = parseTimeToMinutes(task.time);
      items.push({
        id: `t-${task.id}`,
        type: 'task',
        timeMinutes: tMin,
        displayTime: task.time && task.time !== 'Anytime' ? task.time : (tMin < 9999 ? `${Math.floor(tMin / 60) % 12 || 12}:${(tMin % 60).toString().padStart(2, '0')} ${tMin >= 720 ? 'PM' : 'AM'}` : 'Anytime'),
        task,
      });
    });

    return items.sort((a, b) => a.timeMinutes - b.timeMinutes);
  }, [dayHearings, tasksForSelectedDate]);

  const handleToggleTask = (taskId: string) => {
    const updated = dailyTasks.map(t => (t.id === taskId ? { ...t, completed: !t.completed } : t));
    saveDailyTasks(updated);
  };

  const handleAddTask = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!newTaskTitle.trim()) return;
    const newTask = {
      id: `task-${Date.now()}`,
      title: newTaskTitle.trim(),
      time: newTaskTime.trim() || 'Anytime',
      date: selectedDateStr,
      completed: false,
    };
    saveDailyTasks([...dailyTasks, newTask]);
    setNewTaskTitle('');
    setNewTaskTime('');
    setShowAddTaskInput(false);
  };

  const handleDeleteTask = (taskId: string) => {
    saveDailyTasks(dailyTasks.filter(t => t.id !== taskId));
  };

  // Urgent "Now" items: critical limitations or hearings today with unlogged orders
  const urgentNowItems = useMemo(() => {
    const critical = limitationAlerts.filter(a => a.severity === 'critical' || a.daysRemaining <= 3);
    return critical.slice(0, 3);
  }, [limitationAlerts]);

  // Hearing count per day helper
  const getHearingCountForDate = (date: Date) => {
    const dStr = getISTDateString(date);
    const isToday = isSameDay(date, new Date());
    return hearings.filter(h => {
      if (!h.hearingDate) return false;
      if (isToday && (h.hearingDate.startsWith('Today') || h.hearingDate.includes('Today'))) return true;
      return h.hearingDate.includes(dStr);
    }).length;
  };

  // Helper for tasks count on a given date (for day indicator in week strip)
  const getTaskCountForDate = (date: Date) => {
    const dStr = getISTDateString(date);
    return dailyTasks.filter(t => t.date === dStr).length;
  };

  // Smart Daily Overview metrics
  const todayISTStr = getISTDateString(new Date());
  const todayHearingsCount = useMemo(() => {
    return hearings.filter(h => {
      if (!h.hearingDate) return false;
      return h.hearingDate.startsWith('Today') || h.hearingDate.includes('Today') || h.hearingDate.includes(todayISTStr);
    }).length;
  }, [hearings, todayISTStr]);

  const pendingTasksCount = useMemo(() => {
    return dailyTasks.filter(t => !t.completed).length;
  }, [dailyTasks]);

  const overdueTasksCount = useMemo(() => {
    return dailyTasks.filter(t => !t.completed && t.date < todayISTStr).length;
  }, [dailyTasks, todayISTStr]);

  const upcomingDeadlinesCount = useMemo(() => {
    return limitationAlerts.filter(a => a.severity === 'critical' || a.daysRemaining <= 7).length;
  }, [limitationAlerts]);

  const handleSaveOrder = (data: LogOrderData) => {
    if (activeLogOrderHearing && onUpdateHearingOrder) {
      onUpdateHearingOrder(activeLogOrderHearing.id, data.orderNotes, data.nextDate);
    }
    // Also auto-add the new hearing on nextDate
    if (onAddHearing && activeLogOrderHearing) {
      onAddHearing({
        caseNumber: data.caseNumber,
        clientName: activeLogOrderHearing.clientName,
        courtName: activeLogOrderHearing.courtName,
        courtRoom: activeLogOrderHearing.courtRoom,
        hearingDate: `${data.nextDate}`,
        hearingTime: data.nextDate.includes(',') ? data.nextDate.split(',')[1]?.trim() : undefined,
        itemNumber: activeLogOrderHearing.itemNumber,
        judgeName: activeLogOrderHearing.judgeName,
        stage: data.nextStage as any,
        purposeEn: data.nextStage,
        purposeHi: data.nextStage,
        previousOrderSummaryEn: data.orderNotes || `Matter ${data.outcome.toLowerCase()}. Next listing for ${data.nextStage}.`,
      });
    }
    // And post into chat thread
    if (data.notifyClient && onSendHearingChatUpdate) {
      onSendHearingChatUpdate({
        caseNumber: data.caseNumber,
        clientName: data.clientName || 'Client',
        court: data.court || 'Court Room',
        status: data.outcome,
        nextDate: data.nextDate,
        stage: data.nextStage,
        orderNotes: data.orderNotes,
      });
    }
  };

  return (
    <div className="flex flex-col gap-5 p-4 sm:p-6 pb-36 text-main max-w-4xl mx-auto w-full">
      {/* ── Top Header Date & Mode Toggle ── */}
      <div className="flex items-center justify-between pt-1">
        <div>
          <span className="text-xs font-semibold text-amber-500 dark:text-amber-400">
            {selectedDate.toLocaleDateString(language === 'mr' ? 'mr-IN' : language === 'hi' ? 'hi-IN' : 'en-IN', {
              weekday: 'long',
              year: 'numeric',
            })}
          </span>
          <h1 className="text-2xl sm:text-[30px] font-bold tracking-tight text-main font-display mt-0.5 leading-none">
            {selectedDate.toLocaleDateString(language === 'mr' ? 'mr-IN' : language === 'hi' ? 'hi-IN' : 'en-IN', {
              day: 'numeric',
              month: 'short',
            })}
          </h1>
        </div>

        <div className="flex items-center gap-2">
          {onSummarizeDay && (
            <button
              type="button"
              onClick={() => {
                const dateLabel = selectedDate.toLocaleDateString(language === 'mr' ? 'mr-IN' : language === 'hi' ? 'hi-IN' : 'en-IN', {
                  weekday: 'long',
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric'
                });
                const hearingBriefs = dayHearings.map(h => `• Case ${h.caseNumber} (${h.purposeEn || h.clientName || 'Hearing'}): Court: ${h.courtName || 'Court'}, Room: ${h.courtRoom || 'N/A'}, Time: ${h.hearingTime || h.hearingDate}, Stage: ${h.stage || 'Hearing'}, Item: ${h.itemNumber || 'N/A'}`).join('\n');
                const taskBriefs = tasksForSelectedDate.map(t => `• [${t.completed ? 'Completed' : 'Pending'}] ${t.title}${t.time ? ' (' + t.time + ')' : ''}`).join('\n');
                const prompt = `Please provide a strategic, actionable daily summary and preparation briefing for ${dateLabel}:\n\n` +
                  `📅 Hearings Scheduled (${dayHearings.length}):\n${hearingBriefs || 'No court hearings listed for this date.'}\n\n` +
                  `📋 Chamber Tasks (${tasksForSelectedDate.length}):\n${taskBriefs || 'No specific daily tasks recorded.'}\n\n` +
                  `Please summarize key court timings, procedural priorities, critical preparation steps before appearance, and action items for today.`;
                onSummarizeDay(prompt);
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-2xl bg-amber-400 hover:bg-amber-300 text-black font-bold text-xs shadow-md transition ios-press"
              title={t('Summarize Day with AI', 'दिन का सारांश', 'दिवसाचा सारांश')}
            >
              <Sparkles size={13} className="text-black animate-pulse shrink-0" />
              <span className="hidden xs:inline">{t('Summarize Day', 'दिन का सारांश', 'दिवसाचा सारांश')}</span>
              <span className="xs:hidden">{t('Summary', 'सारांश', 'सारांश')}</span>
            </button>
          )}

          {/* View Mode Toggle: Timeline | Agenda | Month (Bug 7) */}
          <div className="flex items-center p-1 rounded-2xl bg-white/[0.06] border border-white/[0.1]">
            <button
              type="button"
              onClick={() => setViewMode('timeline')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
                viewMode === 'timeline'
                  ? 'bg-amber-400 text-black font-bold shadow-sm'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              {t('Timeline', 'समयरेखा', 'वेळापत्रक')}
            </button>
            <button
              type="button"
              onClick={() => setViewMode('list')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
                viewMode === 'list'
                  ? 'bg-amber-400 text-black font-bold shadow-sm'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              {t('Agenda', 'वाद सूची', 'यादी')}
            </button>
            <button
              type="button"
              onClick={() => setViewMode('month')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
                viewMode === 'month'
                  ? 'bg-amber-400 text-black font-bold shadow-sm'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              {t('Month', 'माह', 'महिना')}
            </button>
          </div>
        </div>
      </div>

      {/* ── Smart Daily Overview (Compact Summary Tiles) ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        <div
          onClick={() => {
            setSelectedDate(new Date());
            setViewMode('timeline');
          }}
          className="p-3 rounded-2xl bg-white/[0.03] dark:bg-white/[0.03] border border-white/[0.08] hover:border-amber-400/40 cursor-pointer transition ios-press flex flex-col justify-between gap-1 shadow-sm"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-medium text-neutral-400">{t('Hearings Today', 'आज की सुनवाई', 'आजची सुनावणी')}</span>
            <span className="w-6 h-6 rounded-lg bg-amber-400/10 text-amber-400 flex items-center justify-center">
              <Gavel size={12} />
            </span>
          </div>
          <div className="flex items-baseline gap-1.5 mt-0.5">
            <span className="text-xl font-bold font-mono text-main">{todayHearingsCount}</span>
            <span className="text-[10px] text-amber-400 font-medium">{t('listed', 'सूचीबद्ध', 'नोंदणी')}</span>
          </div>
        </div>

        <div
          onClick={() => {
            setSelectedDate(new Date());
            setViewMode('timeline');
          }}
          className="p-3 rounded-2xl bg-white/[0.03] dark:bg-white/[0.03] border border-white/[0.08] hover:border-sky-400/40 cursor-pointer transition ios-press flex flex-col justify-between gap-1 shadow-sm"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-medium text-neutral-400">{t('Pending Tasks', 'लंबित कार्य', 'प्रलंबित कामे')}</span>
            <span className="w-6 h-6 rounded-lg bg-sky-400/10 text-sky-400 flex items-center justify-center">
              <CheckSquare size={12} />
            </span>
          </div>
          <div className="flex items-baseline gap-1.5 mt-0.5">
            <span className="text-xl font-bold font-mono text-main">{pendingTasksCount}</span>
            <span className="text-[10px] text-sky-400 font-medium">{t('to do', 'बाकी', 'शिल्लक')}</span>
          </div>
        </div>

        <div
          onClick={() => {
            setSelectedDate(new Date());
            setViewMode('timeline');
          }}
          className="p-3 rounded-2xl bg-white/[0.03] dark:bg-white/[0.03] border border-white/[0.08] hover:border-red-400/40 cursor-pointer transition ios-press flex flex-col justify-between gap-1 shadow-sm"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-medium text-neutral-400">{t('Overdue Tasks', 'अतिदेय कार्य', 'मुदत संपलेली कामे')}</span>
            <span className="w-6 h-6 rounded-lg bg-red-400/10 text-red-400 flex items-center justify-center">
              <AlertTriangle size={12} />
            </span>
          </div>
          <div className="flex items-baseline gap-1.5 mt-0.5">
            <span className={`text-xl font-bold font-mono ${overdueTasksCount > 0 ? 'text-red-400' : 'text-main'}`}>
              {overdueTasksCount}
            </span>
            <span className={`text-[10px] font-medium ${overdueTasksCount > 0 ? 'text-red-400' : 'text-neutral-500'}`}>
              {overdueTasksCount > 0 ? t('urgent', 'तत्काल', 'तातडीचे') : t('none', 'शून्य', 'नाहीत')}
            </span>
          </div>
        </div>

        <div
          onClick={() => {
            if (urgentNowItems[0]) onOpenCase(urgentNowItems[0].caseNumber);
          }}
          className="p-3 rounded-2xl bg-white/[0.03] dark:bg-white/[0.03] border border-white/[0.08] hover:border-amber-400/40 cursor-pointer transition ios-press flex flex-col justify-between gap-1 shadow-sm"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-medium text-neutral-400">{t('Limitation Alerts', 'समय सीमा अलर्ट', 'मुदत सूचना')}</span>
            <span className="w-6 h-6 rounded-lg bg-amber-400/10 text-amber-400 flex items-center justify-center">
              <Clock size={12} />
            </span>
          </div>
          <div className="flex items-baseline gap-1.5 mt-0.5">
            <span className="text-xl font-bold font-mono text-main">{upcomingDeadlinesCount}</span>
            <span className="text-[10px] text-amber-400 font-medium">{t('critical', 'महत्वपूर्ण', 'महत्त्वाचे')}</span>
          </div>
        </div>
      </div>

      {/* ── Month Calendar View (if toggled) ── */}
      {viewMode === 'month' ? (
        <div className="animate-in fade-in">
          <HearingCalendar
            hearings={hearings}
            language={language}
            onOpenCaseDetails={cNum => onOpenCase(cNum)}
          />
        </div>
      ) : (
        <>
          {/* ── Urgent "Now" Strip (Limitation Deadlines <= 3 days) ── */}
          {urgentNowItems.length > 0 && (
            <div className="space-y-2">
              <SectionHeader
                title={t('Urgent Attention (Now)', 'त्वरित ध्यान आवश्यक', 'तातडीचे लक्ष आवश्यक')}
                badge={
                  <span className="px-2 py-0.5 rounded-full bg-red-500/15 border border-red-500/30 text-red-400 text-[10px] font-bold font-mono">
                    {urgentNowItems.length} {t('Due Soon', 'शीघ्र देय', 'लवकरच देय')}
                  </span>
                }
              />
              <div className="grid gap-2">
                {urgentNowItems.map(alert => (
                  <div
                    key={alert.id}
                    onClick={() => onOpenCase(alert.caseNumber)}
                    className="p-3.5 rounded-2xl bg-red-950/20 border border-red-500/30 hover:border-red-500/50 flex items-center justify-between cursor-pointer transition ios-press"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-8 h-8 rounded-xl bg-red-500/20 border border-red-500/40 flex items-center justify-center text-red-400 shrink-0">
                        <AlertTriangle size={16} />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-main truncate">
                          <span className="font-mono text-red-600 dark:text-red-400">{alert.caseNumber}</span> · <span>{alert.titleEn}</span>
                        </p>
                        <p className="text-[11px] text-neutral-400 truncate mt-0.5">
                          {alert.statutoryAct} · {t('Deadline:', 'अंतिम तिथि:', 'अंतिम तारीख:')} {alert.deadlineDate} ({alert.daysRemaining} {t('days left', 'दिन शेष', 'दिवस शिल्लक')})
                        </p>
                      </div>
                    </div>
                    <Button variant="danger" size="sm" className="shrink-0 ml-2">
                      {t('Review', 'समीक्षा करें', 'तपासा')}
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── 7-Day Horizontal Week Strip ── */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-main tracking-tight">
                  {t('Week Strip', 'साप्ताहिक समयरेखा', 'आठवड्याची समयरेखा')}
                </span>
                <div className="flex items-center gap-1 bg-white/[0.04] rounded-lg p-0.5 border border-white/[0.06]">
                  <button
                    type="button"
                    onClick={() => setWeekOffset(prev => prev - 1)}
                    className="p-1 rounded hover:bg-white/10 text-neutral-300 hover:text-white transition"
                    title={t('Previous Week', 'पिछला सप्ताह', 'मागील आठवडा')}
                  >
                    <ChevronLeft size={13} />
                  </button>
                  <button
                    type="button"
                    onClick={() => setWeekOffset(prev => prev + 1)}
                    className="p-1 rounded hover:bg-white/10 text-neutral-300 hover:text-white transition"
                    title={t('Next Week', 'अगला सप्ताह', 'पुढील आठवडा')}
                  >
                    <ChevronRight size={13} />
                  </button>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setWeekOffset(0);
                  setSelectedDate(new Date());
                }}
                className="text-xs font-semibold text-amber-500 dark:text-amber-400 hover:underline transition"
              >
                {t('Jump to Today', 'आज पर जाएं', 'आजच्या दिवसावर जा')}
              </button>
            </div>

            <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
              {weekDays.map(day => {
                const isSelected = isSameDay(day, selectedDate);
                const isCurrentToday = isSameDay(day, new Date());
                const hearingCount = getHearingCountForDate(day);
                const taskCount = getTaskCountForDate(day);

                return (
                  <button
                    key={getISTDateString(day)}
                    type="button"
                    onClick={() => setSelectedDate(day)}
                    className={`flex flex-col items-center justify-center py-2 sm:py-2.5 px-1 rounded-2xl border transition ios-press select-none w-full ${
                      isSelected
                        ? 'bg-[#111216] dark:bg-white text-white dark:text-black border-2 border-amber-400 shadow-md scale-[1.02]'
                        : isCurrentToday
                        ? 'border-2 border-amber-400/60 bg-amber-400/10 text-main'
                        : 'bg-white/[0.03] border-white/[0.08] hover:bg-white/[0.06] text-neutral-300'
                    }`}
                  >
                    <span className={`text-[10px] sm:text-[11px] font-semibold uppercase ${
                      isSelected ? 'text-amber-400 dark:text-amber-600 font-bold' : isCurrentToday ? 'text-amber-500 font-semibold' : 'text-neutral-400'
                    }`}>
                      {day.toLocaleDateString('en-IN', { weekday: 'short' })}
                    </span>
                    <span className={`text-sm sm:text-base font-bold font-mono mt-0.5 ${
                      isSelected ? 'text-white dark:text-black' : 'text-main'
                    }`}>
                      {day.getDate()}
                    </span>

                    {/* Event indicators: gold for hearings, sky for tasks */}
                    <div className="flex items-center gap-1 mt-1 h-2">
                      {hearingCount > 0 && (
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-400 shadow-sm" title={`${hearingCount} hearings`} />
                      )}
                      {taskCount > 0 && (
                        <span className="w-1.5 h-1.5 rounded-full bg-sky-400 shadow-sm" title={`${taskCount} tasks`} />
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* ── Integrated Chronological Timeline (Bug 7 & Suggestion 3) ── */}
          {viewMode === 'timeline' ? (
            <div className="space-y-4">
              {/* Redesigned Schedule Section Header - Eliminates Awkward Truncation */}
              <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-1 pb-1">
                <div>
                  <h2 className="text-base sm:text-lg font-semibold text-main tracking-tight">
                    {isSameDay(selectedDate, new Date())
                      ? t("Today's Schedule", "आज की समयरेखा", "आजचे वेळापत्रक")
                      : `${selectedDate.toLocaleDateString(language === 'hi' ? 'hi-IN' : language === 'mr' ? 'mr-IN' : 'en-IN', { month: 'short', day: 'numeric' })} ${t('Schedule', 'समयरेखा', 'वेळापत्रक')}`}
                  </h2>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
                    {selectedDate.toLocaleDateString(language === 'mr' ? 'mr-IN' : language === 'hi' ? 'hi-IN' : 'en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                  </p>
                </div>
                <div className="text-xs text-neutral-500 dark:text-neutral-400 font-medium">
                  {t('Your chronological agenda', 'आपकी कालानुक्रमिक सूची', 'आपली कालक्रमानुसार यादी')} · <span className="font-semibold text-amber-500 dark:text-amber-400">{timelineItems.length} {timelineItems.length === 1 ? t('item', 'मामला/कार्य', 'नोंद') : t('tasks & matters', 'मामले व कार्ये', 'नोंदी')}</span>
                </div>
              </div>

              {/* Action Buttons Hierarchy */}
              <div className="flex flex-wrap items-center justify-between gap-2.5 p-3 rounded-2xl bg-white/[0.03] border border-white/[0.08]">
                <div className="flex items-center gap-2">
                  <Clock size={15} className="text-amber-400" />
                  <span className="text-sm font-semibold text-main">
                    {t('Schedule & Tasks Grid', 'कालक्रमानुसार ग्रिड सूची', 'वेळापत्रक आणि कामे ग्रिड')}
                  </span>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  {/* Primary Action: + Add Court Hearing (Gold) */}
                  <Button
                    variant="primary"
                    size="sm"
                    icon={<Gavel size={14} />}
                    onClick={() => setShowAddHearingSheet(true)}
                    className="font-semibold shadow-md shadow-amber-400/15"
                  >
                    {t('+ Add Court Hearing', '+ अदालत सुनवाई जोड़ें', '+ कोर्ट सुनावणी जोडा')}
                  </Button>

                  {/* Secondary Action: + Add New Task (Outlined) */}
                  <Button
                    variant="secondary"
                    size="sm"
                    icon={<CheckSquare size={14} />}
                    onClick={() => setShowAddTaskInput(prev => !prev)}
                    className="font-medium"
                  >
                    {showAddTaskInput ? t('Cancel Task', 'रद्द करें', 'रद्द करा') : t('+ Add New Task', '+ नया कार्य जोड़ें', '+ नवीन काम जोडा')}
                  </Button>

                  {/* Secondary Action: Add Cause List (Outlined) */}
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => setShowAddHearingSheet(true)}
                    title={t('Import or Add Cause List', 'वाद सूची जोड़ें', 'वाद सूची जोडा')}
                    className="text-xs text-neutral-400 hover:text-white"
                  >
                    {t('Add Cause List', 'वाद सूची', 'वाद सूची')}
                  </Button>
                </div>
              </div>

              {/* Task Input Form with TimePicker */}
              {showAddTaskInput && (
                <form onSubmit={handleAddTask} className="p-3.5 rounded-2xl bg-sky-950/20 border border-sky-400/40 space-y-3 animate-in fade-in">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold font-mono text-sky-300 uppercase">
                      {t('Create Action Task', 'नया कार्य बनाएं', 'नवीन काम तयार करा')}
                    </span>
                    <button
                      type="button"
                      onClick={() => setShowAddTaskInput(false)}
                      className="text-xs text-neutral-400 hover:text-white"
                    >
                      ✕
                    </button>
                  </div>
                  <input
                    type="text"
                    placeholder={language === 'hi' ? 'कार्य का विवरण (जैसे: वकालतनामा दाखिल करना)...' : 'Task title (e.g., File Vakalatnama in Registry)...'}
                    value={newTaskTitle}
                    onChange={e => setNewTaskTitle(e.target.value)}
                    autoFocus
                    className="w-full px-3 py-2 rounded-xl bg-black/60 border border-white/10 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-sky-400"
                  />
                  <div className="flex items-center justify-between gap-2">
                    <TimePicker
                      value={newTaskTime}
                      onChange={setNewTaskTime}
                      placeholder="Task Time (e.g. 02:00 PM)"
                      className="flex-1"
                    />
                    <Button type="submit" size="sm" variant="primary" className="bg-sky-400 hover:bg-sky-300 text-black border-none">
                      {t('Save Task', 'कार्य सहेजें', 'काम नोंदवा')}
                    </Button>
                  </div>
                </form>
              )}

              {/* Refined Empty State - Reduced Height by 25% with Clear Hierarchy */}
              {timelineItems.length === 0 ? (
                <div className="py-7 px-4 sm:py-8 sm:px-6 rounded-3xl border border-dashed border-white/[0.12] bg-white/[0.02] flex flex-col items-center justify-center text-center">
                  <div className="w-11 h-11 rounded-2xl bg-amber-400/10 border border-amber-400/20 flex items-center justify-center text-amber-300 mb-3 shadow-inner">
                    <Clock size={20} />
                  </div>
                  <h3 className="text-base sm:text-lg font-bold text-main mb-1">
                    {isSameDay(selectedDate, new Date())
                      ? t('Your day is clear!', 'आपका दिन रिक्त है!', 'तुमचा दिवस मोकळा आहे!')
                      : t('No events scheduled', 'कुछ भी निर्धारित नहीं है', 'काहीही नियोजित नाही')}
                  </h3>
                  <p className="text-xs sm:text-sm text-neutral-400 max-w-sm mb-4 leading-relaxed">
                    {isSameDay(selectedDate, new Date())
                      ? t("No hearings or tasks scheduled for today. You're all caught up.", 'आज कोई सुनवाई या कार्य निर्धारित नहीं है। आप पूरी तरह अपडेट हैं।', 'आज कोणतीही सुनावणी किंवा कामे नियोजित नाहीत. सर्व कामे पूर्ण आहेत.')
                      : t('No hearings or tasks scheduled for this date.', 'इस तारीख के लिए कोई सुनवाई या कार्य निर्धारित नहीं है।', 'या तारखेसाठी कोणतीही सुनावणी किंवा कामे नियोजित नाहीत.')}
                  </p>
                  <Button
                    variant="primary"
                    size="sm"
                    icon={<Plus size={14} />}
                    onClick={() => setShowAddHearingSheet(true)}
                    className="font-semibold shadow-md shadow-amber-400/20"
                  >
                    + Add Court Hearing
                  </Button>
                </div>
              ) : (
                <div className="relative pl-6 sm:pl-8 space-y-4 before:absolute before:left-3 sm:before:left-4 before:top-3 before:bottom-3 before:w-0.5 before:bg-white/10">
                  {timelineItems.map((item) => (
                    <div key={item.id} className="relative group">
                      {/* Timeline node badge */}
                      <div className={`absolute -left-6 sm:-left-8 top-1.5 w-6 h-6 rounded-full border-2 flex items-center justify-center text-[10px] font-bold ${
                        item.type === 'hearing'
                          ? 'bg-neutral-950 border-amber-400 text-amber-300 shadow-md shadow-amber-400/20'
                          : item.task?.completed
                          ? 'bg-neutral-900 border-neutral-700 text-neutral-400'
                          : item.task && item.task.date < todayISTStr
                          ? 'bg-neutral-950 border-red-500 text-red-400 shadow-md shadow-red-500/20'
                          : 'bg-neutral-950 border-sky-400 text-sky-300'
                      }`}>
                        {item.type === 'hearing' ? '⚖️' : item.task?.completed ? '✓' : '•'}
                      </div>

                      {/* Header row with time and urgency-based tag */}
                      <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                        <span className="text-xs font-bold font-mono text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded-md border border-amber-400/20">
                          {item.displayTime}
                        </span>
                        {item.type === 'hearing' && item.hearing && (() => {
                          const cd = getHearingCountdown(item.hearing.hearingDate, item.hearing.hearingTime);
                          if (!cd) return null;
                          return (
                            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-800 dark:text-amber-300 border border-amber-500/30">
                              ⏳ {cd.label}
                            </span>
                          );
                        })()}
                        <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border flex items-center gap-1 ${
                          item.type === 'hearing'
                            ? 'bg-amber-400/15 border-amber-400/30 text-amber-300'
                            : item.task?.completed
                            ? 'bg-neutral-800 border-neutral-700 text-neutral-400'
                            : item.task && item.task.date < todayISTStr
                            ? 'bg-red-500/15 border-red-500/30 text-red-400'
                            : 'bg-sky-400/15 border-sky-400/30 text-sky-300'
                        }`}>
                          {item.type === 'hearing' ? (
                            <>
                              <Gavel size={11} /> {t('Court Hearing', 'अदालत सुनवाई', 'कोर्ट सुनावणी')}
                            </>
                          ) : item.task?.completed ? (
                            <>
                              <CheckCircle2 size={11} /> {t('Completed', 'पूर्ण', 'पूर्ण')}
                            </>
                          ) : item.task && item.task.date < todayISTStr ? (
                            <>
                              <AlertTriangle size={11} /> {t('Overdue Task', 'अतिदेय कार्य', 'मुदत संपलेले काम')}
                            </>
                          ) : (
                            <>
                              <Clock size={11} /> {t('Action Task', 'कार्य', 'काम')}
                            </>
                          )}
                        </span>
                      </div>

                      {item.type === 'hearing' && item.hearing ? (
                        <HearingCard
                          hearing={item.hearing}
                          language={language}
                          onLogOrder={h => setActiveLogOrderHearing(h)}
                          onOpenCase={cNum => onOpenCase(cNum)}
                          onEditHearing={h => setEditingHearing(h)}
                          onMessageClient={onMessageClient}
                        />
                      ) : item.task ? (
                        <Card className="p-3.5 flex items-center justify-between gap-3">
                          <div
                            onClick={() => handleToggleTask(item.task!.id)}
                            className="flex items-center gap-2.5 min-w-0 flex-1 cursor-pointer"
                          >
                            <div className={`w-5 h-5 rounded-lg border flex items-center justify-center transition shrink-0 ${
                              item.task.completed ? 'bg-emerald-500 border-emerald-400 text-black' : 'border-white/20 bg-white/[0.04]'
                            }`}>
                              {item.task.completed && <CheckSquare size={14} />}
                            </div>
                            <span className={`text-xs font-medium truncate ${item.task.completed ? 'line-through text-neutral-500' : 'text-neutral-200'}`}>
                              {item.task.title}
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleDeleteTask(item.task!.id)}
                            className="opacity-40 group-hover:opacity-100 p-1 rounded hover:bg-red-500/20 hover:text-red-400 text-neutral-400 transition"
                            title="Delete Task"
                          >
                            <Trash2 size={13} />
                          </button>
                        </Card>
                      ) : null}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <>
              {/* ── Daily Cause List / Agenda for Selected Date ── */}
              <div className="space-y-3">
                <SectionHeader
                  title={
                    isSameDay(selectedDate, new Date())
                      ? (language === 'hi' ? 'आज की वाद सूची (Cause List)' : "Today's Cause List")
                      : `${selectedDate.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })} Cause List`
                  }
                  count={dayHearings.length}
                  countLabel={dayHearings.length === 1 ? 'matter' : 'matters'}
                  action={{
                    label: '+ Add Hearing',
                    onClick: () => setShowAddHearingSheet(true),
                  }}
                />

                {dayHearings.length === 0 ? (
                  <EmptyState
                    icon={<CalendarDays size={24} />}
                    title={
                      isSameDay(selectedDate, new Date())
                        ? (language === 'hi' ? 'आज कोई सुनवाई निर्धारित नहीं है' : 'No hearings scheduled for today')
                        : 'No hearings scheduled for this date'
                    }
                    description={
                      language === 'hi'
                        ? 'अपनी दैनिक वाद सूची में सुनवाई जोड़ने के लिए नीचे दिए गए बटन पर टैप करें।'
                        : 'Keep your court calendar organized by scheduling listings and matters.'
                    }
                    actionLabel="+ Add Court Hearing"
                    onAction={() => setShowAddHearingSheet(true)}
                  />
                ) : (
                  <div className="space-y-3">
                    {dayHearings.map(hearing => (
                      <HearingCard
                        key={hearing.id}
                        hearing={hearing}
                        language={language}
                        onLogOrder={h => setActiveLogOrderHearing(h)}
                        onOpenCase={cNum => onOpenCase(cNum)}
                        onEditHearing={h => setEditingHearing(h)}
                        onMessageClient={onMessageClient}
                      />
                    ))}
                  </div>
                )}
              </div>

              {/* ── Tasks for Selected Date ── */}
              <div className="space-y-3 pt-2">
                <SectionHeader
                  title={
                    isSameDay(selectedDate, new Date())
                      ? (language === 'hi' ? 'आज के कार्य' : 'Tasks Due Today')
                      : (language === 'hi' ? 'निर्धारित कार्य' : `Tasks for ${selectedDate.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })}`)
                  }
                  count={tasksForSelectedDate.length}
                  countLabel={tasksForSelectedDate.length === 1 ? 'Task' : 'Tasks'}
                  action={{
                    label: showAddTaskInput ? 'Cancel' : '+ Add Task',
                    onClick: () => setShowAddTaskInput(prev => !prev),
                  }}
                />

                {/* Quick Add Task Input Form */}
                {showAddTaskInput && (
                  <form onSubmit={handleAddTask} className="p-3.5 rounded-2xl bg-white/[0.04] border border-amber-400/40 space-y-3">
                    <input
                      type="text"
                      placeholder={language === 'hi' ? 'कार्य का विवरण (जैसे: वकालतनामा दाखिल करना)...' : 'Task title (e.g., File Vakalatnama in Registry)...'}
                      value={newTaskTitle}
                      onChange={e => setNewTaskTitle(e.target.value)}
                      autoFocus
                      className="w-full px-3 py-2 rounded-xl bg-black/60 border border-white/10 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-amber-400"
                    />
                    <div className="flex items-center justify-between gap-2">
                      <TimePicker
                        value={newTaskTime}
                        onChange={setNewTaskTime}
                        placeholder="Time / Deadline"
                        className="flex-1"
                      />
                      <Button type="submit" size="sm" variant="primary">
                        Save Task
                      </Button>
                    </div>
                  </form>
                )}

                {tasksForSelectedDate.length === 0 ? (
                  <EmptyState
                    icon={<CheckSquare size={24} />}
                    title={
                      isSameDay(selectedDate, new Date())
                        ? (language === 'hi' ? 'आज कोई कार्य लंबित नहीं है' : 'No tasks for today')
                        : 'No tasks scheduled for this date'
                    }
                    description={
                      language === 'hi'
                        ? 'अदालत में दाखिलियां, ड्राफ्टिंग या रजिस्ट्री कार्यों की सूची बनाएं।'
                        : 'Add reminders for court filings, draft reviews, or client follow-ups.'
                    }
                    actionLabel="+ Add New Task"
                    onAction={() => setShowAddTaskInput(true)}
                  />
                ) : (
                  <Card className="space-y-2">
                    {tasksForSelectedDate.map(task => {
                      return (
                        <div
                          key={task.id}
                          className="group flex items-center justify-between p-2.5 rounded-2xl bg-white/[0.02] hover:bg-white/[0.05] transition select-none"
                        >
                          <div
                            onClick={() => handleToggleTask(task.id)}
                            className="flex items-center gap-2.5 min-w-0 flex-1 cursor-pointer"
                          >
                            <div className={`w-5 h-5 rounded-lg border flex items-center justify-center transition shrink-0 ${
                              task.completed ? 'bg-emerald-500 border-emerald-400 text-black' : 'border-white/20 bg-white/[0.04]'
                            }`}>
                              {task.completed && <CheckSquare size={14} />}
                            </div>
                            <span className={`text-xs font-medium truncate ${task.completed ? 'line-through text-neutral-500' : 'text-neutral-200'}`}>
                              {task.title}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 shrink-0 ml-2">
                            {task.time && (
                              <span className="text-[11px] font-mono text-neutral-400">
                                {task.time}
                              </span>
                            )}
                            <button
                              type="button"
                              onClick={() => handleDeleteTask(task.id)}
                              className="opacity-40 group-hover:opacity-100 p-1 rounded hover:bg-red-500/20 hover:text-red-400 text-neutral-400 transition"
                              title="Delete Task"
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </Card>
                )}
              </div>
            </>
          )}
        </>
      )}

      {/* ── Log Order Modal ── */}
      {activeLogOrderHearing && (
        <LogOrderSheet
          open={Boolean(activeLogOrderHearing)}
          onOpenChange={open => !open && setActiveLogOrderHearing(null)}
          hearingId={activeLogOrderHearing.id}
          caseNumber={activeLogOrderHearing.caseNumber}
          clientName={activeLogOrderHearing.clientName}
          court={`${activeLogOrderHearing.courtRoom || ''}, ${activeLogOrderHearing.courtName || ''}`}
          currentStage={activeLogOrderHearing.stage}
          language={language}
          onSave={handleSaveOrder}
        />
      )}

      {/* ── Add Hearing Modal ── */}
      <HearingFormSheet
        open={showAddHearingSheet}
        onOpenChange={setShowAddHearingSheet}
        initialData={{ hearingDate: selectedDateStr }}
        cases={cases}
        hearings={hearings}
        language={language}
        onSave={hearing => {
          if (onAddHearing) onAddHearing(hearing);
        }}
      />

      {/* ── Edit Hearing Modal (Suggestion 4) ── */}
      {editingHearing && (
        <HearingFormSheet
          open={Boolean(editingHearing)}
          onOpenChange={open => {
            if (!open) setEditingHearing(null);
          }}
          initialData={editingHearing}
          cases={cases}
          hearings={hearings}
          language={language}
          onSave={async (updated) => {
            if (onAddHearing) {
              await onAddHearing(updated);
            }
            setEditingHearing(null);
          }}
        />
      )}
    </div>
  );
};
