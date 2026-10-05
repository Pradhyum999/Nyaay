/**
 * Indian Standard Time (IST) Date and Time Utilities
 * Timezone: Asia/Kolkata (UTC +05:30)
 */

/**
 * Returns date in 'YYYY-MM-DD' strictly evaluated in Asia/Kolkata (IST).
 */
export function getISTDateString(date: Date = new Date()): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Kolkata',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date);
}

/**
 * Returns 12-hour time in 'hh:mm A' strictly evaluated in Asia/Kolkata (IST).
 * e.g., '10:30 AM' or '03:15 PM'
 */
export function getISTTimeString(date: Date = new Date()): string {
  return new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Kolkata',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  }).format(date);
}

/**
 * Compares two dates (or date strings) to check if they represent the same day in IST.
 */
export function isSameDayIST(d1: Date | string, d2: Date | string): boolean {
  const str1 = typeof d1 === 'string' ? d1.slice(0, 10) : getISTDateString(d1);
  const str2 = typeof d2 === 'string' ? d2.slice(0, 10) : getISTDateString(d2);
  return str1 === str2;
}

/**
 * Formats a Date or date string for display in Indian format (e.g. "2 Oct 2026").
 */
export function formatISTDateDisplay(dateStrOrObj: Date | string, locale: string = 'en-IN'): string {
  try {
    const d =
      typeof dateStrOrObj === 'string'
        ? new Date(dateStrOrObj.includes('T') ? dateStrOrObj : `${dateStrOrObj.slice(0, 10)}T00:00:00+05:30`)
        : dateStrOrObj;
    return d.toLocaleDateString(locale, {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return String(dateStrOrObj);
  }
}

/**
 * Normalizes any time string (24h or 12h) to clean 12h format e.g. "10:30 AM", "8:35 PM"
 */
export function normalize12HourTime(timeStr?: string): string {
  if (!timeStr) return '';
  const trimmed = timeStr.trim();
  // If already 12h: "02:55 AM" -> "2:55 AM" or "10:30 AM"
  const m12 = trimmed.match(/^(\d{1,2}):(\d{2})(?::\d{2})?\s*(AM|PM)$/i);
  if (m12) {
    const h = parseInt(m12[1], 10);
    const m = m12[2];
    const ampm = m12[3].toUpperCase();
    return `${h}:${m} ${ampm}`;
  }
  // If 24h: "20:35" or "22:59"
  const m24 = trimmed.match(/^(\d{1,2}):(\d{2})(?::\d{2})?$/);
  if (m24) {
    let h = parseInt(m24[1], 10);
    const m = m24[2];
    const ampm = h >= 12 ? 'PM' : 'AM';
    h = h % 12 || 12;
    return `${h}:${m} ${ampm}`;
  }
  return trimmed;
}

/**
 * Parses date string / time into a clean formatted string: "Sat, 3 Oct · 10:30 AM"
 * Eliminates raw ISO dates ("2026-10-03") and duplicated times ("10:30 AM (10:30 AM)").
 */
export function formatHearingDateTime(dateStr?: string, timeStr?: string): string {
  if (!dateStr || dateStr === 'TBD' || dateStr === 'Not scheduled') {
    return 'Date TBD';
  }

  let rawDate = dateStr.trim();
  let extractedTime = timeStr ? normalize12HourTime(timeStr) : '';

  // Extract paren time if present e.g. "(10:30 AM)"
  const parenTimeMatch = rawDate.match(/\(([^)]+)\)/);
  if (parenTimeMatch) {
    extractedTime = normalize12HourTime(parenTimeMatch[1]);
    rawDate = rawDate.replace(/\s*\([^)]+\)/, '').trim();
  }

  // Extract comma-separated time if present e.g. "2026-10-03, 10:30 AM"
  if (rawDate.includes(',')) {
    const parts = rawDate.split(',');
    rawDate = parts[0].trim();
    if (!extractedTime && parts[1]) {
      extractedTime = normalize12HourTime(parts[1].trim());
    }
  }

  let datePart = rawDate;
  if (rawDate.toLowerCase() === 'today') {
    const today = new Date();
    datePart = today.toLocaleDateString('en-US', { timeZone: 'Asia/Kolkata', weekday: 'short', day: 'numeric', month: 'short' });
  } else if (rawDate.toLowerCase() === 'tomorrow') {
    const tmrw = new Date();
    tmrw.setDate(tmrw.getDate() + 1);
    datePart = tmrw.toLocaleDateString('en-US', { timeZone: 'Asia/Kolkata', weekday: 'short', day: 'numeric', month: 'short' });
  } else if (/^\d{4}-\d{2}-\d{2}/.test(rawDate)) {
    const parsed = new Date(`${rawDate.slice(0, 10)}T12:00:00+05:30`);
    if (!isNaN(parsed.getTime())) {
      datePart = parsed.toLocaleDateString('en-US', { timeZone: 'Asia/Kolkata', weekday: 'short', day: 'numeric', month: 'short' });
    }
  } else if (/^\d{1,2}\s+[A-Za-z]+/.test(rawDate)) {
    const parsed = new Date(rawDate);
    if (!isNaN(parsed.getTime())) {
      datePart = parsed.toLocaleDateString('en-US', { timeZone: 'Asia/Kolkata', weekday: 'short', day: 'numeric', month: 'short' });
    }
  }

  if (extractedTime && !datePart.toLowerCase().includes(extractedTime.toLowerCase())) {
    return `${datePart} · ${extractedTime}`;
  }
  return datePart;
}

/**
 * Returns dynamic countdown for a hearing: "Today · in 2h 15m", "Tomorrow", "In 3 days", etc.
 */
export function getHearingCountdown(dateStr?: string, timeStr?: string): {
  label: string;
  isToday: boolean;
  isPast: boolean;
  badgeClass: string;
} {
  if (!dateStr || dateStr === 'TBD' || dateStr === 'Not scheduled') {
    return { label: 'TBD', isToday: false, isPast: false, badgeClass: 'bg-neutral-800 text-neutral-400' };
  }

  const now = new Date();
  const todayStr = getISTDateString(now);

  let targetDateStr = '';
  let targetTimeStr = timeStr ? normalize12HourTime(timeStr) : '';

  if (dateStr.toLowerCase().startsWith('today')) {
    targetDateStr = todayStr;
    const parts = dateStr.split(',');
    if (parts[1] && !targetTimeStr) targetTimeStr = normalize12HourTime(parts[1]);
  } else if (dateStr.toLowerCase().startsWith('tomorrow')) {
    const tmrw = new Date(now);
    tmrw.setDate(tmrw.getDate() + 1);
    targetDateStr = getISTDateString(tmrw);
    const parts = dateStr.split(',');
    if (parts[1] && !targetTimeStr) targetTimeStr = normalize12HourTime(parts[1]);
  } else if (/^\d{4}-\d{2}-\d{2}/.test(dateStr)) {
    targetDateStr = dateStr.slice(0, 10);
    const parts = dateStr.split(',');
    if (parts[1] && !targetTimeStr) targetTimeStr = normalize12HourTime(parts[1]);
  } else {
    const d = new Date(dateStr);
    if (!isNaN(d.getTime())) {
      targetDateStr = getISTDateString(d);
    } else {
      targetDateStr = todayStr;
    }
  }

  let hours = 10;
  let minutes = 30;
  if (targetTimeStr) {
    const match = targetTimeStr.match(/(\d{1,2}):(\d{2})\s*(AM|PM)?/i);
    if (match) {
      hours = parseInt(match[1], 10);
      minutes = parseInt(match[2], 10);
      const ampm = match[3]?.toUpperCase();
      if (ampm === 'PM' && hours < 12) hours += 12;
      if (ampm === 'AM' && hours === 12) hours = 0;
    }
  }

  const targetDate = new Date(`${targetDateStr}T${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:00+05:30`);
  const diffMs = targetDate.getTime() - now.getTime();
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

  const isSameDay = isSameDayIST(now, targetDate);

  if (isSameDay) {
    if (diffMs > 0) {
      if (diffHours === 0) {
        return {
          label: `In ${diffMinutes}m`,
          isToday: true,
          isPast: false,
          badgeClass: 'bg-amber-400 text-black font-bold animate-pulse',
        };
      }
      return {
        label: `Today · in ${diffHours}h ${diffMinutes > 0 ? `${diffMinutes}m` : ''}`.trim(),
        isToday: true,
        isPast: false,
        badgeClass: 'bg-amber-400/20 text-amber-300 border border-amber-400/40 font-bold',
      };
    } else if (diffMs > -1000 * 60 * 60 * 3) {
      return {
        label: 'In session now',
        isToday: true,
        isPast: false,
        badgeClass: 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 font-bold',
      };
    } else {
      return {
        label: 'Concluded today',
        isToday: true,
        isPast: true,
        badgeClass: 'bg-neutral-800 text-neutral-400 font-medium',
      };
    }
  }

  if (diffDays === 1) {
    return {
      label: 'Tomorrow',
      isToday: false,
      isPast: false,
      badgeClass: 'bg-amber-400/15 text-amber-300 border border-amber-400/30',
    };
  }

  if (diffDays > 1) {
    return {
      label: `In ${diffDays} days`,
      isToday: false,
      isPast: false,
      badgeClass: 'bg-white/[0.06] text-neutral-300 border border-white/10',
    };
  }

  return {
    label: 'Past listing',
    isToday: false,
    isPast: true,
    badgeClass: 'bg-neutral-800 text-neutral-500',
  };
}

/**
 * Single source of truth for a case's next hearing date & time & countdown.
 */
export function getCaseNextHearing(caseFile: any, hearings: any[] = []): {
  formattedDateTime: string;
  rawDate: string;
  rawTime?: string;
  countdown: ReturnType<typeof getHearingCountdown>;
} {
  const norm = (caseFile?.caseNumber || '').toLowerCase().replace(/[^a-z0-9]/g, '');
  const matchedHearings = hearings.filter(h => {
    const hNorm = (h.caseNumber || '').toLowerCase().replace(/[^a-z0-9]/g, '');
    return hNorm && norm && hNorm === norm;
  });

  if (matchedHearings.length > 0) {
    // Sort upcoming hearings
    const sorted = [...matchedHearings].sort((a, b) => {
      const da = new Date(a.hearingDate?.split(',')[0] || 0).getTime();
      const db = new Date(b.hearingDate?.split(',')[0] || 0).getTime();
      return da - db;
    });
    const upcoming = sorted[0];
    const formatted = formatHearingDateTime(upcoming.hearingDate, upcoming.hearingTime);
    return {
      formattedDateTime: formatted,
      rawDate: upcoming.hearingDate,
      rawTime: upcoming.hearingTime,
      countdown: getHearingCountdown(upcoming.hearingDate, upcoming.hearingTime),
    };
  }

  if (caseFile?.nextHearingDate && caseFile.nextHearingDate !== 'TBD') {
    const formatted = formatHearingDateTime(caseFile.nextHearingDate, caseFile.nextHearingTime);
    return {
      formattedDateTime: formatted,
      rawDate: caseFile.nextHearingDate,
      rawTime: caseFile.nextHearingTime,
      countdown: getHearingCountdown(caseFile.nextHearingDate, caseFile.nextHearingTime),
    };
  }

  return {
    formattedDateTime: 'Date TBD',
    rawDate: '',
    countdown: getHearingCountdown(undefined),
  };
}
