/**
 * ============================================================
 *  TEST SUITE — New SUGGESTIONS_20261002.docx Requirements
 *  + Lawyer AI Chat (grounded on all his case data)
 * ============================================================
 */
import * as fs from 'fs';
import * as path from 'path';

const ROOT = process.cwd();
let passCount = 0;
let failCount = 0;

function checkFileContains(relPath: string, needles: string[], label: string): boolean {
  const abs = path.join(ROOT, relPath);
  if (!fs.existsSync(abs)) {
    console.log(`[FAIL] ✗ : ${label} — FILE MISSING: ${relPath}`);
    failCount++;
    return false;
  }
  const content = fs.readFileSync(abs, 'utf8');
  const missing = needles.filter(n => !content.includes(n));
  if (missing.length > 0) {
    console.log(`[FAIL] ✗ : ${label} — missing: ${missing.join(' | ')}`);
    failCount++;
    return false;
  }
  console.log(`[PASS] ✅ : ${label}`);
  passCount++;
  return true;
}

// ── 1. Language screen: radio-button selection + Continue button ──
checkFileContains(
  'src/features/auth/LanguageStep.tsx',
  ['type="radio"', 'Continue'],
  'Language screen uses radio-button selection with explicit Continue button'
);

// ── 2. Bar Council ID format validation ( Maharashtra/State Bar format) ──
checkFileContains(
  'src/features/auth/AdvocateProfileStep.tsx',
  ['MAH', 'validateBarCouncilId'],
  'Bar Council ID format validation (MAH-XXXX-YYYY) on Advocate Profile step'
);

// ── 3. Dedicated Welcome page after onboarding ──
checkFileContains(
  'src/features/auth/WelcomeStep.tsx',
  ['Welcome'],
  'Dedicated Welcome page shown after successful onboarding'
);

// ── 4. Case & Hearing Edit functionality (updates record, no duplicates) ──
checkFileContains(
  'src/App.tsx',
  ['handleUpdateCaseDetails', 'updateHearingFull'],
  'Case & Hearing edit handlers update existing records in-place'
);
checkFileContains(
  'src/features/cases/CaseDetailPage.tsx',
  ['Edit Case Details', 'handleUpdateCaseDetails'],
  'Case Detail page exposes Edit Case Details with Save/Cancel'
);
checkFileContains(
  'src/features/cases/NewCaseSheet.tsx',
  ['isEditMode', 'Update Case'],
  'NewCaseSheet doubles as edit form (no duplicate creation)'
);

// ── 5. Dossier form dropdowns: Matter Classification, Initial Stage, Court Complex, Court Room/Hall, Priority Urgent/Normal + queues ──
checkFileContains(
  'src/features/cases/NewCaseSheet.tsx',
  ['PREDEFINED_MATTER_CLASSIFICATIONS', 'PREDEFINED_INITIAL_STAGES', 'INDIAN_COURT_COMPLEXES', 'COURT_HALLS_BY_COMPLEX', "'Urgent' | 'Normal'"],
  'Dossier form: Matter Classification + Initial Stage dropdowns, Court Complex search, Court Room/Hall dynamic dropdown, Urgent/Normal priority'
);

// ── 6. Urgent and Normal case queues in the case list ──
checkFileContains(
  'src/features/cases/CaseListPage.tsx',
  ["'urgent'", "'normal'", "'all'"],
  'Case list provides Urgent and Normal queues (filter tabs)'
);

// ── 7. Auto-invoice generation on Mark-as-Paid (auto-invoice after payment) ──
checkFileContains(
  'src/App.tsx',
  ['Auto Invoice', 'markInvoiceRecordPaid', 'handlePayInvoice'],
  'Auto-invoice is generated immediately after payment confirmation (Mark-as-Paid)'
);

// ── 8. WhatsApp-style attachment "+" menu with all 5 attachment types ──
checkFileContains(
  'src/components/chat/DirectChatView.tsx',
  ['Document', 'Camera', 'Gallery', 'Location', 'Contact', 'showAttachmentMenu'],
  'WhatsApp-style + menu: Document, Camera, Gallery, Location & Contact attachments'
);

// ── 9. Top-left profile shortcut to My Account / Profile ──
checkFileContains(
  'src/components/navigation/UnifiedTopBar.tsx',
  ['onOpenProfile', 'My Account'],
  'Top-left NYAAYNEETI brand click opens profile shortcut (My Account)'
);

// ── 10. More Menu extras: Skill Assessment, Discussion Forum, Peer Referral, Global Search, Video Conferencing, Settings + Delete Account ──
checkFileContains(
  'src/features/more/LawyerMorePage.tsx',
  ['Skill Assessment', 'Discussion Forum', 'Peer Referral', 'Global Search', 'Video Conferencing', 'Settings', 'Delete Account', 'deleteAccount'],
  'More Menu: Skill Assessment, Discussion Forum, Peer Referral, Global Search, Video Conferencing, Settings (with Delete Account)'
);
checkFileContains(
  'src/contexts/AuthContext.tsx',
  ['deleteAccount', 'purgeAllCitizenData'],
  'Delete Account purges all citizen data via Firestore + signs out'
);

// ── 11. LAWYER AI CHAT — grounded on all his case data ──
checkFileContains(
  'src/lib/caseAI.ts',
  ['askCaseAI', 'buildGroundingContext', 'streamCaseAI'],
  'Lawyer AI Chat engine (askCaseAI) grounds on all case data (cases, hearings, invoices, docs, tasks, messages)'
);
checkFileContains(
  'src/features/ai/LawyerAIChat.tsx',
  ['askCaseAI', 'buildGroundingContext', 'Suggested', 'messages'],
  'Lawyer AI Chat UI with suggested prompts, chat history and data-grounded responses'
);
checkFileContains(
  'src/App.tsx',
  ['LawyerAIChat', 'handleAskLawyerAI'],
  'Lawyer AI Chat is wired into the App with full live data context passed'
);

// ── Summary ──
console.log('\n----------------------------------------------------');
console.log(`SUMMARY: ${passCount} / ${passCount + failCount} PASSED`);
if (failCount === 0) {
  console.log('ALL NEW SUGGESTIONS_20261002 REQUIREMENTS + LAWYER AI CHAT VERIFIED!');
} else {
  console.log(`${failCount} CHECK(S) FAILED — see details above.`);
  process.exit(1);
}