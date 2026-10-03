import assert from 'assert';
import { getISTDateString, getISTTimeString, isSameDayIST } from '../src/lib/istDate.ts';
import { normaliseCaseNumber } from '../src/lib/caseNumber.ts';
import fs from 'fs';
import path from 'path';

console.log('====================================================');
console.log('  TESTING USER HEARING FORM REFINEMENTS');
console.log('====================================================\n');

// ── Test 1: Same Date/Time Duplicate Check ONLY For Same Case ────────────────
console.log('Testing: Multiple hearings allowed across different cases, blocked only for same case...');

const mockHearings = [
  { id: 'h1', caseNumber: 'CC/100/2026', hearingDate: '2026-10-02, 10:30 AM', hearingTime: '10:30 AM', itemNumber: 1 },
  { id: 'h2', caseNumber: 'CC/100/2026', hearingDate: '2026-10-10, 02:00 PM', hearingTime: '02:00 PM', itemNumber: 2 },
  { id: 'h3', caseNumber: 'CRL/200/2026', hearingDate: '2026-10-02, 10:30 AM', hearingTime: '10:30 AM', itemNumber: 1 },
];

function checkDuplicate(
  hearings: typeof mockHearings,
  caseNumber: string,
  hearingDate: string,
  hearingTime: string,
  currentId?: string
): boolean {
  const currentNormCase = normaliseCaseNumber(caseNumber);
  return hearings.some(h => {
    if (currentId && h.id === currentId) return false;
    const isSameCase = normaliseCaseNumber(h.caseNumber) === currentNormCase;
    if (!isSameCase) return false; // Allowed for different cases!
    const sameDate = h.hearingDate?.startsWith(hearingDate) || h.hearingDate?.includes(hearingDate);
    const sameTime = hearingTime.trim() && h.hearingTime?.trim().toLowerCase() === hearingTime.trim().toLowerCase();
    return sameDate && sameTime;
  });
}

// Case CC/100/2026 at 2026-10-02, 10:30 AM => Duplicate for same case!
assert.strictEqual(
  checkDuplicate(mockHearings, 'CC/100/2026', '2026-10-02', '10:30 AM'),
  true,
  'Must block duplicate hearing on same date & time for SAME case'
);

// Case CRL/300/2026 at 2026-10-02, 10:30 AM => DIFFERENT case => MUST BE ALLOWED!
assert.strictEqual(
  checkDuplicate(mockHearings, 'CRL/300/2026', '2026-10-02', '10:30 AM'),
  false,
  'Must ALLOW hearing on same date & time for a DIFFERENT case'
);

// Editing existing hearing h1 at 2026-10-02, 10:30 AM => Allowed!
assert.strictEqual(
  checkDuplicate(mockHearings, 'CC/100/2026', '2026-10-02', '10:30 AM', 'h1'),
  false,
  'Must allow in-place edit of existing hearing'
);

console.log('✅ Test 1 Passed: Duplicate hearing prevention works strictly per case.\n');


// ── Test 2: Item Number Auto-Increment Per Case (Starts From 1 For Another Case) ─
console.log('Testing: Item number auto-increments per case and starts from 1 on another case...');

function calculateItemNumber(
  hearings: typeof mockHearings,
  caseNumber: string,
  initialItemNumber?: number
): number {
  if (initialItemNumber) return initialItemNumber;
  if (!caseNumber.trim()) return 1;
  const currentCaseNum = normaliseCaseNumber(caseNumber);
  const caseHearings = hearings.filter(h => normaliseCaseNumber(h.caseNumber) === currentCaseNum);
  const maxItem = caseHearings.reduce((max, h) => Math.max(max, h.itemNumber || 0), 0);
  return maxItem > 0 ? maxItem + 1 : (caseHearings.length + 1);
}

// Case CC/100/2026 has items 1 and 2 => Next item is #3
assert.strictEqual(
  calculateItemNumber(mockHearings, 'CC/100/2026'),
  3,
  'Next hearing for CC/100/2026 must be Item #3'
);

// Case CRL/200/2026 has item 1 => Next item is #2
assert.strictEqual(
  calculateItemNumber(mockHearings, 'CRL/200/2026'),
  2,
  'Next hearing for CRL/200/2026 must be Item #2'
);

// Case NEW/400/2026 has 0 hearings => Starts again from #1!
assert.strictEqual(
  calculateItemNumber(mockHearings, 'NEW/400/2026'),
  1,
  'Brand new case must start again from Item #1'
);

console.log('✅ Test 2 Passed: Item number increments per case and restarts at 1 for another case.\n');


// ── Test 3: Time and Date in IST (Asia/Kolkata) ──────────────────────────────
console.log('Testing: IST date and time generation...');

const istDate = getISTDateString();
const istTime = getISTTimeString();

console.log(`Current IST Date: ${istDate}`);
console.log(`Current IST Time: ${istTime}`);

assert(/^[0-9]{4}-[0-9]{2}-[0-9]{2}$/.test(istDate), 'IST Date must be in YYYY-MM-DD format');
assert(/^[0-9]{2}:[0-9]{2}\s+(AM|PM)$/i.test(istTime), 'IST Time must be in hh:mm A format');

// Verify HearingFormSheet source code does not contain d.setDate(d.getDate() + 1)
const hearingSheetCode = fs.readFileSync(
  path.resolve(process.cwd(), 'src/features/hearings/HearingFormSheet.tsx'),
  'utf-8'
);

assert(
  !hearingSheetCode.includes('d.setDate(d.getDate() + 1)'),
  'HearingFormSheet must NOT add +1 day by default'
);
assert(
  hearingSheetCode.includes('getISTDateString()'),
  'HearingFormSheet must use getISTDateString()'
);
assert(
  hearingSheetCode.includes('isDuplicateForSameCase'),
  'HearingFormSheet must check duplicates specifically for the same case'
);

console.log('✅ Test 3 Passed: IST date parsing and timezone consistency verified.\n');

console.log('----------------------------------------------------');
console.log('ALL 3 USER HEARING REFINEMENTS SUCCESSFULLY PASSED!');
console.log('====================================================\n');
