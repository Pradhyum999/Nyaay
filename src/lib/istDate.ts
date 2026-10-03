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
      timeZone: 'Asia/Kolkata',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  } catch {
    return String(dateStrOrObj);
  }
}
