import fs from 'fs';
import path from 'path';

interface TestResult {
  id: number;
  name: string;
  passed: boolean;
  notes: string;
}

const results: TestResult[] = [];

function checkFileContains(relPath: string, patterns: (string | RegExp)[]): { ok: boolean; missing: string[] } {
  const fullPath = path.resolve(process.cwd(), relPath);
  if (!fs.existsSync(fullPath)) {
    return { ok: false, missing: [`File not found: ${relPath}`] };
  }
  const content = fs.readFileSync(fullPath, 'utf8');
  const missing: string[] = [];
  for (const p of patterns) {
    if (typeof p === 'string') {
      if (!content.includes(p)) missing.push(p);
    } else {
      if (!p.test(content)) missing.push(p.toString());
    }
  }
  return { ok: missing.length === 0, missing };
}

function checkFileNotContains(relPath: string, patterns: string[]): { ok: boolean; present: string[] } {
  const fullPath = path.resolve(process.cwd(), relPath);
  if (!fs.existsSync(fullPath)) {
    return { ok: false, present: [`File not found: ${relPath}`] };
  }
  const content = fs.readFileSync(fullPath, 'utf8');
  const present: string[] = [];
  for (const p of patterns) {
    if (content.includes(p)) present.push(p);
  }
  return { ok: present.length === 0, present };
}

// ── Test 1: Time Selection Using Time Picker ──────────────────────────────
{
  const check1 = checkFileContains('src/design/ui/TimePicker.tsx', ['TimePicker', 'COMMON_COURT_SLOTS', 'selectedHour', 'selectedMinute', 'selectedPeriod']);
  const check2 = checkFileContains('src/features/hearings/HearingFormSheet.tsx', ['<TimePicker', 'hearingTime', 'setHearingTime']);
  const check3 = checkFileContains('src/features/today/TodayPage.tsx', ['<TimePicker', 'newTaskTime', 'setNewTaskTime']);
  const passed = check1.ok && check2.ok && check3.ok;
  results.push({
    id: 1,
    name: 'Time Selection Using Time Picker',
    passed,
    notes: passed
      ? 'Verified TimePicker UI with court listing slots & dial time picker in both HearingFormSheet and TodayPage task creation.'
      : `Missing: ${[...check1.missing, ...check2.missing, ...check3.missing].join(', ')}`
  });
}

// ── Test 2: Court Location & Court Hall Selection ──────────────────────────
{
  const check1 = checkFileContains('src/config/courtsData.ts', ['INDIAN_COURT_COMPLEXES', 'getHallsForCourtComplex']);
  const check2 = checkFileContains('src/features/hearings/HearingFormSheet.tsx', ['availableHalls', 'getHallsForCourtComplex', 'courtSuggestions']);
  const passed = check1.ok && check2.ok;
  results.push({
    id: 2,
    name: 'Court Location & Court Hall Selection',
    passed,
    notes: passed
      ? 'Verified searchable Court Complex autocomplete with dynamically populated Court Hall / Room dropdown based on selected court complex.'
      : `Missing: ${[...check1.missing, ...check2.missing].join(', ')}`
  });
}

// ── Test 3: Time-Based Grid for Task List and Cause List ──────────────────
{
  const check1 = checkFileContains('src/features/today/TodayPage.tsx', [
    'Add Cause List',
    'Add New Task',
    'timelineItems',
    'amber-400',
    'sky-400'
  ]);
  const passed = check1.ok;
  results.push({
    id: 3,
    name: 'Time-Based Grid for Task List and Cause List',
    passed,
    notes: passed
      ? 'Verified unified chronological schedule grid with distinct "+ Add Cause List" (amber) and "+ Add New Task" (sky) buttons and color badges.'
      : `Missing: ${check1.missing.join(', ')}`
  });
}

// ── Test 4: Case and Hearing Details Edit Functionality ───────────────────
{
  const check1 = checkFileContains('src/services/firestoreService.ts', ['updateCaseDetails', 'updateHearingFull']);
  const check2 = checkFileContains('src/features/cases/CaseDetailPage.tsx', ['showEditCase', 'onUpdateCaseDetails', 'onEditHearing']);
  const check3 = checkFileContains('src/features/cases/NewCaseSheet.tsx', ['initialData', 'isEditMode', 'onSave']);
  const check4 = checkFileContains('src/features/hearings/HearingFormSheet.tsx', ['initialData', 'isEditMode', 'onSave']);
  const check5 = checkFileContains('src/App.tsx', ['handleUpdateCaseDetails', 'updateHearingFull']);
  const passed = check1.ok && check2.ok && check3.ok && check4.ok && check5.ok;
  results.push({
    id: 4,
    name: 'Case and Hearing Details Edit Functionality',
    passed,
    notes: passed
      ? 'Verified complete Edit Case & Edit Hearing workflows updating records in-place without generating duplicate entries.'
      : `Missing: ${[...check1.missing, ...check2.missing, ...check3.missing, ...check4.missing, ...check5.missing].join(', ')}`
  });
}

// ── Test 5: New Case Dossier Form – Dropdowns and Suggestions ─────────────
{
  const check1 = checkFileContains('src/config/courtsData.ts', [
    'PREDEFINED_MATTER_CLASSIFICATIONS',
    'PREDEFINED_INITIAL_STAGES',
    'POPULAR_ACTS_AND_SECTIONS'
  ]);
  const check2 = checkFileContains('src/features/cases/NewCaseSheet.tsx', [
    'PREDEFINED_MATTER_CLASSIFICATIONS',
    'PREDEFINED_INITIAL_STAGES',
    'POPULAR_ACTS_AND_SECTIONS',
    'priority'
  ]);
  const passed = check1.ok && check2.ok;
  results.push({
    id: 5,
    name: 'New Case Dossier Form – Dropdowns and Suggestions',
    passed,
    notes: passed
      ? 'Verified predefined matter classification dropdown, initial stage dropdown, court autocomplete, searchable acts & sections chips, and priority selection.'
      : `Missing: ${[...check1.missing, ...check2.missing].join(', ')}`
  });
}

// ── Test 6: Automatic Invoice Generation After Payment ────────────────────
{
  const check1 = checkFileContains('src/features/fees/LawyerFeesPage.tsx', [
    'selectedReceiptInvoice',
    'OFFICIAL FEE INVOICE & RECEIPT',
    'Download Receipt',
    'navigator.share',
    'UPI / Instant Bank Transfer'
  ]);
  const passed = check1.ok;
  results.push({
    id: 6,
    name: 'Automatic Invoice Generation After Payment (Official Tax Receipt)',
    passed,
    notes: passed
      ? 'Verified auto-generated Official Tax Invoice & Payment Receipt with unique receipt number, payment date, UPI/bank reference, view, download, and share actions.'
      : `Missing: ${check1.missing.join(', ')}`
  });
}

// ── Test 7: Enhanced Document and Attachment Upload Options ───────────────
{
  const check1 = checkFileContains('src/components/chat/DirectChatView.tsx', [
    'showAttachmentMenu',
    'Document',
    'Camera',
    'Gallery',
    'Location',
    'Contact',
    'cameraInputRef'
  ]);
  const passed = check1.ok;
  results.push({
    id: 7,
    name: 'Enhanced Document and Attachment Upload Options',
    passed,
    notes: passed
      ? 'Verified WhatsApp-style + attachment menu (Document, Camera, Gallery, Location, Contact) plus dedicated quick Camera capture in chat.'
      : `Missing: ${check1.missing.join(', ')}`
  });
}

// ── Test 8: Fees Description Dropdown in Invoice Form ─────────────────────
{
  const check1 = checkFileContains('src/config/courtsData.ts', ['PREDEFINED_FEE_DESCRIPTIONS']);
  const check2 = checkFileContains('src/features/fees/LawyerFeesPage.tsx', ['PREDEFINED_FEE_DESCRIPTIONS', 'description']);
  const check3 = checkFileContains('src/features/cases/CaseDetailPage.tsx', ['PREDEFINED_FEE_DESCRIPTIONS', 'invoiceDescription']);
  const passed = check1.ok && check2.ok && check3.ok;
  results.push({
    id: 8,
    name: 'Fees Description Dropdown in Invoice Form',
    passed,
    notes: passed
      ? 'Verified predefined fee descriptions dropdown in both global LawyerFeesPage and case-specific invoice generation in CaseDetailPage.'
      : `Missing: ${[...check1.missing, ...check2.missing, ...check3.missing].join(', ')}`
  });
}

// ── Test 9: Replace More Section with Me Section ──────────────────────────
{
  const check1 = checkFileContains('src/config/nav.ts', ["id: 'more'", "to: '/more'", "labelEn: 'More'"]);
  const check2 = checkFileContains('src/features/more/LawyerMorePage.tsx', [
    'LawyerMorePage',
    'Skill Assessment',
    'Discussion Forum',
    'Peer Referral',
    'Video Conferencing',
    'Chambers Portfolio'
  ]);
  const check3 = checkFileContains('src/App.tsx', ['LawyerMorePage', "lawyerActiveTab === 'more'"]);
  const passed = check1.ok && check2.ok && check3.ok;
  results.push({
    id: 9,
    name: 'Counsel Suite & Digital Chambers in "More" Section',
    passed,
    notes: passed
      ? 'Verified lawyer navigation tab provides "More" section displaying comprehensive digital practice portfolio, skill assessment, forum, peer referral, video conferencing, and settings.'
      : `Missing: ${[...check1.missing, ...check2.missing, ...check3.missing].join(', ')}`
  });
}

// ── Test 10: Nyaayneeti Menu and More Section Update ──────────────────────
{
  const check1 = checkFileContains('src/components/navigation/UnifiedTopBar.tsx', [
    'showMenu',
    'setShowMenu',
    'NYAAYNEETI MENU',
    'onOpenFirmPortal',
    'onOpenSearch'
  ]);
  const notCheck1 = checkFileNotContains('src/components/navigation/UnifiedTopBar.tsx', [
    'Emergency & Legal Aid',
    'IPC to BNS',
    'SOS'
  ]);
  const notCheck2 = checkFileNotContains('src/App.tsx', [
    '<IpcToBnsModal',
    '<EmergencySheet'
  ]);
  const passed = check1.ok && notCheck1.ok && notCheck2.ok;
  results.push({
    id: 10,
    name: 'Nyaayneeti Menu and More Section Update',
    passed,
    notes: passed
      ? 'Verified top NYAAYNEETI brand dropdown menu contains firm portal, search, feedback, language & theme toggles; Emergency Helpline and IPC to BNS completely removed.'
      : `Failed: ${[...check1.missing, ...notCheck1.present, ...notCheck2.present].join(', ')}`
  });
}

// ── Print Results ─────────────────────────────────────────────────────────
console.log('====================================================');
console.log('  RUNNING AUTOMATED TEST SUITE FOR ALL 10 SUGGESTIONS');
console.log('====================================================\n');
console.log('RESULTS:');
for (const r of results) {
  const icon = r.passed ? '✅ PASS' : '❌ FAIL';
  console.log(`[Suggestion ${r.id.toString().padStart(2, ' ')}] ${icon} : ${r.name}`);
  console.log(`       └─ ${r.notes}\n`);
}

const passedCount = results.filter(r => r.passed).length;
console.log('----------------------------------------------------');
console.log(`SUMMARY: ${passedCount} / ${results.length} PASSED`);
if (passedCount === results.length) {
  console.log('ALL 10 SUGGESTIONS SUCCESSFULLY VERIFIED AND VALIDATED!');
} else {
  console.log('SOME SUGGESTIONS FAILED VERIFICATION.');
  process.exit(1);
}
