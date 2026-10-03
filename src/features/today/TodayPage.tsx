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
import { Calendar, AlertTriangle, CheckSquare, Plus, ChevronLeft, ChevronRight, Clock, CalendarDays, Trash2, Gavel } from 'lucide-react';
import { TimePicker } from '../../design/ui/TimePicker';
import { getISTDateString, isSameDayIST } from '../../lib/istDate';

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
    <div className="flex flex-col gap-5 p-4 sm:p-6 pb-28 text-main max-w-4xl mx-auto w-full">
      {/* ── Top Header Date & Mode Toggle ── */}
      <div className="flex items-center justify-between pt-1">
        <div>
          <span className="text-xs font-mono font-medium text-amber-500 dark:text-amber-300">
            {selectedDate.toLocaleDateString(language === 'mr' ? 'mr-IN' : language === 'hi' ? 'hi-IN' : 'en-IN', {
              weekday: 'long',
              year: 'numeric',
            })}
          </span>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-main font-display mt-0.5">
            {selectedDate.toLocaleDateString(language === 'mr' ? 'mr-IN' : language === 'hi' ? 'hi-IN' : 'en-IN', {
              day: 'numeric',
              month: 'short',
            })}
          </h1>
        </div>

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
                        <p className="text-xs font-bold text-white font-mono truncate">
                          {alert.caseNumber} · {alert.titleEn}
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
                <span className="text-xs font-semibold text-neutral-400 uppercase tracking-wider font-mono">
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
                className={`text-xs font-semibold transition ${
                  !isSameDay(selectedDate, new Date()) || weekOffset !== 0
                    ? 'text-amber-300 hover:underline'
                    : 'text-neutral-500 opacity-60'
                }`}
              >
                {t('Jump to Today', 'आज पर जाएं', 'आजच्या दिवसावर जा')}
              </button>
            </div>

            <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
              {weekDays.map(day => {
                const isSelected = isSameDay(day, selectedDate);
                const isCurrentToday = isSameDay(day, new Date());
                const count = getHearingCountForDate(day);

                return (
                  <button
                    key={getISTDateString(day)}
                    type="button"
                    onClick={() => setSelectedDate(day)}
                    className={`flex flex-col items-center justify-center p-2 sm:p-2.5 rounded-2xl border transition ios-press select-none ${
                      isSelected
                        ? 'bg-amber-400 border-amber-300 text-black shadow-lg shadow-amber-400/20'
                        : isCurrentToday
                        ? 'bg-white/[0.08] border-amber-400/50 text-white'
                        : 'bg-white/[0.03] border-white/[0.08] hover:bg-white/[0.06] text-neutral-300'
                    }`}
                  >
                    <span className={`text-[10px] sm:text-[11px] font-medium uppercase font-mono ${
                      isSelected ? 'text-black/80 font-bold' : 'text-neutral-400'
                    }`}>
                      {day.toLocaleDateString('en-IN', { weekday: 'short' })}
                    </span>
                    <span className={`text-sm sm:text-base font-bold font-mono mt-0.5 ${
                      isSelected ? 'text-black' : 'text-white'
                    }`}>
                      {day.getDate()}
                    </span>
                    {count > 0 && (
                      <span className={`w-1.5 h-1.5 rounded-full mt-1 ${
                        isSelected ? 'bg-black' : 'bg-amber-400 animate-pulse'
                      }`} />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* ── Integrated Chronological Timeline (Bug 7 & Suggestion 3) ── */}
          {viewMode === 'timeline' ? (
            <div className="space-y-4">
              <SectionHeader
                title={
                  isSameDay(selectedDate, new Date())
                    ? t("Today's Chronological Schedule", 'आज की कालानुक्रमिक समयरेखा', 'आजचे कालक्रमानुसार वेळापत्रक')
                    : `${selectedDate.toLocaleDateString(language === 'hi' ? 'hi-IN' : 'en-IN', { month: 'short', day: 'numeric' })} ${t('Schedule', 'समयरेखा', 'वेळापत्रक')}`
                }
                count={timelineItems.length}
                countLabel={timelineItems.length === 1 ? t('Matter/Task', 'मामला/कार्य', 'खटला/काम') : t('Matters & Tasks', 'मामले व कार्य', 'खटले व कामे')}
              />

              {/* Suggestion 3: Separate Add Cause List & Add New Task buttons */}
              <div className="flex flex-wrap items-center justify-between gap-2.5 p-3 rounded-2xl bg-white/[0.03] border border-white/[0.08]">
                <div className="flex items-center gap-2">
                  <Clock size={14} className="text-amber-400" />
                  <span className="text-xs font-semibold text-neutral-300">
                    {t('Schedule & Tasks Grid', 'कालक्रमानुसार ग्रिड सूची', 'वेळापत्रक आणि कामे ग्रिड')}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="primary"
                    size="sm"
                    icon={<Gavel size={13} />}
                    onClick={() => setShowAddHearingSheet(true)}
                  >
                    {t('+ Add Cause List', '+ वाद सूची जोड़ें', '+ वाद सूची जोडा')}
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    icon={<CheckSquare size={13} />}
                    onClick={() => setShowAddTaskInput(prev => !prev)}
                  >
                    {showAddTaskInput ? t('Cancel Task', 'रद्द करें', 'रद्द करा') : t('+ Add New Task', '+ नया कार्य जोड़ें', '+ नवीन काम जोडा')}
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

              {timelineItems.length === 0 ? (
                <EmptyState
                  icon={<Clock size={24} />}
                  title={
                    isSameDay(selectedDate, new Date())
                      ? t('No hearings or tasks scheduled for today', 'आज कोई सुनवाई या कार्य निर्धारित नहीं है', 'आज कोणतीही सुनावणी किंवा कामे नियोजित नाहीत')
                      : t('No events scheduled for this date', 'इस तारीख के लिए कुछ भी निर्धारित नहीं है', 'या तारखेसाठी काहीही नियोजित नाही')
                  }
                  description={t('Your day is clear. Schedule a hearing or create action tasks below.', 'अपनी वाद सूची और कार्यों को व्यवस्थित रखने के लिए सुनवाई या कार्य जोड़ें।', 'सुनावणी जोडा किंवा कामे नोंदवा.')}
                  actionLabel="+ Add Court Hearing"
                  onAction={() => setShowAddHearingSheet(true)}
                />
              ) : (
                <div className="relative pl-6 sm:pl-8 space-y-4 before:absolute before:left-3 sm:before:left-4 before:top-3 before:bottom-3 before:w-0.5 before:bg-white/10">
                  {timelineItems.map((item) => (
                    <div key={item.id} className="relative group">
                      {/* Timeline node badge */}
                      <div className={`absolute -left-6 sm:-left-8 top-1.5 w-6 h-6 rounded-full border-2 flex items-center justify-center text-[10px] font-bold ${
                        item.type === 'hearing'
                          ? 'bg-neutral-950 border-amber-400 text-amber-300 shadow-md shadow-amber-400/20'
                          : 'bg-neutral-950 border-sky-400 text-sky-300'
                      }`}>
                        {item.type === 'hearing' ? '⚖️' : '✓'}
                      </div>

                      {/* Header row with time and tag */}
                      <div className="flex items-center gap-2 mb-1.5">
                        <span className="text-xs font-bold font-mono text-amber-300 bg-amber-400/10 px-2 py-0.5 rounded-md border border-amber-400/20">
                          {item.displayTime}
                        </span>
                        <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${
                          item.type === 'hearing'
                            ? 'bg-amber-400/15 border-amber-400/30 text-amber-300'
                            : 'bg-sky-400/15 border-sky-400/30 text-sky-300'
                        }`}>
                          {item.type === 'hearing' ? t('Court Hearing', 'अदालत सुनवाई', 'कोर्ट सुनावणी') : t('Action Task', 'कार्य', 'काम')}
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
                  countLabel={dayHearings.length === 1 ? 'Matter' : 'Matters'}
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
