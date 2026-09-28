import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Clock, MapPin, User, Gavel, Sparkles } from 'lucide-react';
import { HearingItem, Language } from '../types';

interface HearingCalendarProps {
  hearings: HearingItem[];
  language: Language;
  onOpenHearingOrder?: (hearing: HearingItem) => void;
  onOpenCaseDetails?: (caseNumber: string) => void;
}

export const HearingCalendar: React.FC<HearingCalendarProps> = ({
  hearings,
  language,
  onOpenHearingOrder,
  onOpenCaseDetails,
}) => {
  const today = new Date();
  const [currentYear, setCurrentYear] = useState(today.getFullYear());
  const [currentMonth, setCurrentMonth] = useState(today.getMonth());
  const [selectedDay, setSelectedDay] = useState<number>(today.getDate());

  const t = (en: string, hi: string, mr?: string) =>
    language === 'mr' && mr ? mr : language === 'hi' ? hi : en;

  const monthNamesEn = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  const monthNamesHi = [
    'जनवरी', 'फ़रवरी', 'मार्च', 'अप्रैल', 'मई', 'जून',
    'जुलाई', 'अगस्त', 'सितंबर', 'अक्टूबर', 'नवंबर', 'दिसंबर'
  ];
  const monthNamesMr = [
    'जानेवारी', 'फेब्रुवारी', 'मार्च', 'एप्रिल', 'मे', 'जून',
    'जुलै', 'ऑगस्ट', 'सप्टेंबर', 'ऑक्टोबर', 'नोव्हेंबर', 'डिसेंबर'
  ];

  const currentMonthName =
    language === 'mr' ? monthNamesMr[currentMonth] : language === 'hi' ? monthNamesHi[currentMonth] : monthNamesEn[currentMonth];

  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const firstDayOfWeek = new Date(currentYear, currentMonth, 1).getDay();

  // Helper to parse dates from hearings (formats can be "2026-10-14", "26 Sep 2026, 10:30 AM", etc.)
  const parseHearingDate = (dateStr: string): { year: number; month: number; day: number } | null => {
    if (!dateStr) return null;
    // Check ISO: YYYY-MM-DD
    const isoMatch = dateStr.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (isoMatch) {
      return {
        year: parseInt(isoMatch[1], 10),
        month: parseInt(isoMatch[2], 10) - 1,
        day: parseInt(isoMatch[3], 10),
      };
    }
    // Check standard JS Date parse
    const parsed = new Date(dateStr);
    if (!isNaN(parsed.getTime())) {
      return {
        year: parsed.getFullYear(),
        month: parsed.getMonth(),
        day: parsed.getDate(),
      };
    }
    return null;
  };

  // Group hearings by day for current month
  const hearingsByDay: Record<number, HearingItem[]> = {};
  hearings.forEach((h) => {
    const d = parseHearingDate(h.hearingDate);
    if (d && d.year === currentYear && d.month === currentMonth) {
      if (!hearingsByDay[d.day]) hearingsByDay[d.day] = [];
      hearingsByDay[d.day].push(h);
    }
  });

  const selectedDayHearings = hearingsByDay[selectedDay] || [];

  const handlePrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(y => y - 1);
    } else {
      setCurrentMonth(m => m - 1);
    }
    setSelectedDay(1);
  };

  const handleNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(y => y + 1);
    } else {
      setCurrentMonth(m => m + 1);
    }
    setSelectedDay(1);
  };

  const daysOfWeek = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

  return (
    <div className="space-y-4">
      {/* Month Navigation Card */}
      <div className="glass-card rounded-3xl p-4 border border-white/[0.08] bg-black/60">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-amber-400/15 border border-amber-400/30 flex items-center justify-center text-amber-300">
              <CalendarIcon size={16} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white tracking-tight">
                {currentMonthName} {currentYear}
              </h3>
              <p className="text-[10px] text-neutral-400 font-mono">
                {Object.keys(hearingsByDay).length} {t('hearing days this month', 'सुनवाई के दिन इस माह', 'या महिन्यात सुनावणीचे दिवस')}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={handlePrevMonth}
              className="w-8 h-8 rounded-xl bg-white/[0.06] hover:bg-white/[0.12] flex items-center justify-center text-neutral-300 transition ios-press"
            >
              <ChevronLeft size={16} />
            </button>
            <button
              onClick={handleNextMonth}
              className="w-8 h-8 rounded-xl bg-white/[0.06] hover:bg-white/[0.12] flex items-center justify-center text-neutral-300 transition ios-press"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>

        {/* Days Header */}
        <div className="grid grid-cols-7 gap-1 text-center mb-1">
          {daysOfWeek.map((day, idx) => (
            <span key={idx} className="text-[10px] font-mono font-semibold text-neutral-500 py-1">
              {day}
            </span>
          ))}
        </div>

        {/* Calendar Grid */}
        <div className="grid grid-cols-7 gap-1">
          {/* Empty cells before month start */}
          {Array.from({ length: firstDayOfWeek }).map((_, idx) => (
            <div key={`empty-${idx}`} className="h-9" />
          ))}

          {/* Month days */}
          {Array.from({ length: daysInMonth }).map((_, idx) => {
            const day = idx + 1;
            const isSelected = selectedDay === day;
            const isToday =
              today.getFullYear() === currentYear &&
              today.getMonth() === currentMonth &&
              today.getDate() === day;
            const count = hearingsByDay[day]?.length || 0;

            return (
              <button
                key={day}
                onClick={() => setSelectedDay(day)}
                className={`h-9 rounded-xl flex flex-col items-center justify-center relative transition ios-press ${
                  isSelected
                    ? 'bg-amber-400 text-black font-bold shadow-lg shadow-amber-400/20'
                    : isToday
                    ? 'bg-white/[0.1] text-amber-300 border border-amber-400/40 font-bold'
                    : 'text-neutral-300 hover:bg-white/[0.05]'
                }`}
              >
                <span className="text-xs font-mono">{day}</span>
                {count > 0 && (
                  <span
                    className={`w-1 h-1 rounded-full mt-0.5 ${
                      isSelected ? 'bg-black' : 'bg-amber-400'
                    }`}
                  />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Selected Day Hearings List */}
      <div className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <h4 className="text-xs font-bold text-white uppercase tracking-wider font-mono">
            {t('Hearings on', 'सुनवाइयां दिनांक', 'सुनावणी दिनांक')} {selectedDay} {currentMonthName} ({selectedDayHearings.length})
          </h4>
        </div>

        {selectedDayHearings.length === 0 ? (
          <div className="glass-card rounded-2xl p-6 text-center border border-white/[0.06] text-neutral-400 text-xs">
            <p>{t('No hearings scheduled for this date.', 'इस तारीख पर कोई सुनवाई निर्धारित नहीं है।', 'या तारखेला कोणतीही सुनावणी नाही.')}</p>
          </div>
        ) : (
          selectedDayHearings.map((h) => (
            <div
              key={h.id}
              className="glass-card rounded-2xl p-3.5 border border-white/[0.08] hover:border-amber-400/30 transition flex flex-col gap-2.5"
            >
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20 font-bold">
                      ITEM #{h.itemNumber}
                    </span>
                    <span className="text-[11px] text-neutral-400 font-mono flex items-center gap-1">
                      <Clock size={11} /> {h.hearingTime}
                    </span>
                  </div>

                  <h5
                    onClick={() => onOpenCaseDetails && onOpenCaseDetails(h.caseNumber)}
                    className="text-sm font-bold text-white mt-1 cursor-pointer hover:text-amber-300 transition font-mono"
                  >
                    {h.caseNumber}
                  </h5>

                  <p className="text-xs text-neutral-300 mt-0.5 flex items-center gap-1">
                    <User size={12} className="text-neutral-500" />
                    <span>{h.clientName}</span>
                  </p>
                </div>

                <div className="text-right">
                  <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-white/[0.06] text-neutral-300 border border-white/[0.08]">
                    {h.stage}
                  </span>
                </div>
              </div>

              {/* Purpose & Court */}
              <div className="bg-black/50 border border-white/[0.04] rounded-xl p-2.5 text-xs text-neutral-300">
                <p className="font-medium text-white/90 leading-snug">
                  {language === 'mr' && h.purposeHi ? h.purposeHi : language === 'hi' ? h.purposeHi : h.purposeEn}
                </p>
                <div className="flex items-center gap-2 text-[10px] text-neutral-400 font-mono mt-1">
                  <MapPin size={10} />
                  <span>{h.courtName}</span>
                  <span>•</span>
                  <span>{h.courtRoom}</span>
                </div>
              </div>

              {/* Action */}
              {onOpenHearingOrder && (
                <button
                  type="button"
                  onClick={() => onOpenHearingOrder(h)}
                  className="w-full py-2 rounded-xl bg-white text-black font-semibold text-xs transition hover:bg-neutral-200 ios-press flex items-center justify-center gap-1.5 shadow-sm"
                >
                  <Sparkles size={12} />
                  <span>{t('Log Order & Next Date', 'आदेश व अगली तारीख दर्ज करें', 'आदेश व पुढील तारीख नोंदवा')}</span>
                </button>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};
