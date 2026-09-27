# NYAAY / NAYANEETI — Implementation Handoff & Context File

> **Purpose**: Resume the "Case Room / OS for the lawyer–client relationship" implementation in a fresh chat with zero loss of context.
> **Generated at**: 2026-09-19 (Asia/Calcutta)
> **Repo**: `c:/Users/pradh/Documents/antigravity/happy-curie` (origin: https://github.com/Pradhyum999/Nyaay.git)

---

## 0. STRATEGIC THESIS (do not drift from this)

Nyayneeti is **NOT** "another AI legal assistant." It is the **operating system for the lawyer–client relationship** — the persistent **digital home for a legal case**.

- Adalat AI owns the **court/judiciary** layer (transcription, case-flow, judicial research, B2G).
- Nyayneeti owns the **CLIENT ↔ LAWYER** layer with the **case as the central object**, later bridging to court via integrations.
- **Positioning line**: *"Your case. One place."*
- **Killer feature**: **"Build my case"** (structured intake) + **"Ask My Case"** (AI grounded on the case workspace).
- **Do NOT** rank "best lawyer" via ratings. Use **objective verified-profile matching** ("verified profile matches the requirements of your matter"). Client decides. BCI-safe.

---

## 1. WHAT IS ALREADY DONE (this session, verified saved)

### ✅ Phase 0 — Data model refactor
**File: `src/types/index.ts`** — added:
- `CaseProfile` — matterType, legalArea, location, facts[], missingInfo[], documentsAvailable[], documentsRequired[], urgency, confidenceScore, summaryText, generatedAt
- `CaseTimelineEventType` + `CaseTimelineEvent` (type, titleEn/Hi, descriptionEn/Hi, eventDate, actor*)
- `CaseTask` (titleEn/Hi, assignedTo: 'lawyer'|'client', status, dueDate)
- `CaseNote`
- Added optional `caseId`, `clientId`, `lawyerId` to `HearingItem`, `DocumentItem`, `InvoiceItem`
- Extended `CaseFile` with `clientId`, `lawyerId`, `profile?`, `lawyerName?`, `stage?`, `createdAt`, `updatedAt`

**File: `src/services/firestoreService.ts`** — added (after `saveAIBrief`, before auto-seeding):
- `subscribeToCase(caseId, cb)`
- `subscribeToCaseDocuments` / `subscribeToCaseHearings` / `subscribeToCaseInvoices` (all keyed by `caseId`)
- `subscribeToCaseTimeline` + `addTimelineEvent`
- `subscribeToCaseTasks` + `createCaseTask` + `updateCaseTask` + `deleteCaseTask`
- `subscribeToCaseNotes` + `addCaseNote`
- `createCaseFromProfile({ clientId, clientName, clientPhone, profile, caseNumber? })` → creates `cases/{id}`, seeds `documents` from profile.documentsRequired, seeds timeline intake event. Returns `caseId`.
- Imported new types: `CaseProfile, CaseTimelineEvent, CaseTask, CaseNote`

### ✅ Phase 1 — Structured AI case intake
**New file: `src/lib/caseAI.ts`** — exports:
- `isCaseAIConfigured()`
- `runCaseIntakeTurn(userMessage, history, language, previousInteractionId?)` → `{ text, profile }` (strips a fenced ```json block)
- `extractProfile(raw)` → `{ text, profile }`
- `CaseRoomContext` interface `{ caseFile, documents, hearings, tasks, timeline }`
- `askMyCase(question, ctx, language)` → grounded answer (Phase 4 logic done, UI pending)
- `summarizeOrder(orderText, language, targetLanguageName?)` → regional-language order explanation
- `renderPreparedClientPacket(ctx)` → lawyer-facing prepared-client packet (Phase 2 logic)
- Uses Gemini model `gemini-3.8-flash` via `@google/genai` Interactions API (`ai.interactions.create`).

**File: `src/components/client/ClientAIConsultation.tsx`** — REWRITTEN:
- Header now "Build My Case" (not generic chatbot)
- Uses `runCaseIntakeTurn`; renders a **Case Profile card** (matter, legal area, location, summary, facts, docs required, missing info, confidence)
- "Build My Case Room" button → `createCaseFromProfile` → sets `caseCreatedId`
- New prop `onCaseCreated?: (caseId: string) => void`
- NOTE: some Hindi quick-chip strings render with minor emoji/encoding artifacts; cosmetic only.

### ✅ Phase 2 — Lawyer matching (logic done, UI pending)
**New file: `src/services/lawyerMatching.ts`** — exports:
- `matchLawyers(profile: CaseProfile | null, lawyers: UserProfile[], limit=5)` → `LawyerMatch[]` `{ lawyer, score, reasons[] }`
- Scoring: practice-area relevance (45), jurisdiction (20), experience (20), language (10), verified+public cases (5). Sorted desc, sliced to limit.
- ⚠️ **VERIFY FILENAME**: the editor tab showed `src/services/lawyer` (possibly truncated). Confirm the actual file is `src/services/lawyerMatching.ts`. If a stray file/dir `src/services/lawyer` exists, remove it.

---

## 2. WHAT REMAINS (todo)

### ⏳ Phase 3 — The Case Room UI (THE MOAT) — NEXT PRIORITY
Create **`src/components/client/CaseRoom.tsx`** (and/or a lawyer variant) with tabs:
1. **Overview** — case number, matter type, court, parties, stage, status, next hearing, lawyer card
2. **Timeline** — `subscribeToCaseTimeline`
3. **Documents** — `subscribeToCaseDocuments` (reuse DocumentManager patterns)
4. **Tasks** — `subscribeToCaseTasks`, create/complete via `createCaseTask`/`updateCaseTask`
5. **Hearings** — `subscribeToCaseHearings` (+ order notes)
6. **Fees** — `subscribeToCaseInvoices`
Use `subscribeToCase` for the header. All realtime.

### ⏳ Phase 4 UI — "Ask My Case"
A panel/button inside the Case Room: quick prompts (*Before next hearing / Explain last order / What did my lawyer ask? / Timeline / Summarise for new lawyer*). Build `CaseRoomContext` from the live subscriptions and call `askMyCase(...)`. Add an "Explain this order" button on hearing order notes calling `summarizeOrder`.

### ⏳ Phase 2 UI — Matching in the directory
Update `src/components/client/ClientLawyerDirectory.tsx` to accept the current `CaseProfile` (from the case's `profile`) and call `matchLawyers`, showing top 3–5 with `reasons` chips. On engage, send `renderPreparedClientPacket(ctx)` instead of the generic one-line string.

###  Wire Case Room into app
- `src/App.tsx`: pass `onCaseCreated` to `ClientAIConsultation` (switch to `mycase` tab). Replace/extend `ClientCaseTracker` (or the `mycase` tab) to open the **CaseRoom** for `cases[0]`. Consider a case selector if multiple.
- `src/components/client/ClientBottomNav.tsx`: optionally relabel `mycase` → "Case Room".

### ⏳ Phase 5 — Security & channels
- **Harden `firestore.rules`**: participants-only (match `request.auth.uid` to `lawyerId`/`clientId`); admin-only `verification_requests` writes. Currently EVERYTHING is `allow read, write: if signedIn()` — production blocker.
- **Real Phone OTP**: `src/contexts/AuthContext.tsx` `signInWithPhone`/`verifyOTP` are stubs. Implement `signInWithPhoneNumber` + `RecaptchaVerifier`.
- **WhatsApp** (later): Cloud Functions + WhatsApp Business API for reminders (reply 1=upload, 2=contact, 3=view).

### ⏳ Phase 6 — Anonymized matter-graph moat (later).

### ⏳ Verification
- Run `npm run build` (tsc + vite) and fix errors.
- Watch for: `cases[0]` typing (`CaseFile | null`), unused imports after rewrites, `mockJudicialAnalytics` still imported in App.tsx from `./data/mockData`.

---

## 3. KEY FILES & PATTERNS

| File | Role |
|---|---|
| `src/types/index.ts` | All domain types (updated) |
| `src/services/firestoreService.ts` | All Firestore CRUD/subscriptions (extended with Case Room) |
| `src/lib/caseAI.ts` | **NEW** intake + askMyCase + summarizeOrder + prepared packet |
| `src/services/lawyerMatching.ts` | **NEW** objective lawyer matching |
| `src/components/client/ClientAIConsultation.tsx` | Intake UI (rewritten) |
| `src/components/client/ClientCaseTracker.tsx` | Old tracker (currently the `mycase` tab) |
| `src/App.tsx` | Root; role routing, tabs, subscriptions |
| `src/components/chat/DirectChatView.tsx` | Client↔lawyer chat + AI brief handoff |
| `src/components/DocumentManager.tsx` | Lawyer doc checklist pattern to reuse |
| `src/contexts/AuthContext.tsx` | Auth (Phone OTP stubbed) |
| `firestore.rules` | Wide open — needs hardening |
| `NYAAY_FULL_CONTEXT.md` | Original dossier |
| `NYAAY_IMPLEMENTATION_CONTEXT.md` | **THIS FILE** |

**Stack**: React 19 / Vite 8 / TS / Tailwind v4 · Firebase (Auth, Firestore, Hosting) · `@google/genai` `gemini-3.8-flash` · lucide-react.
**Commands**: dev `npx vite --host --port 5173` · build `npm run build` · deploy `npx firebase-tools deploy --only hosting --project nyaay-legal-app`.

---

## 4. IMMEDIATE NEXT STEP FOR THE RESUMING CHAT

1. Confirm `src/services/lawyerMatching.ts` exists and no stray `src/services/lawyer` artifact.
2. **Create `src/components/client/CaseRoom.tsx`** (Phase 3).
3. Wire it into `App.tsx` `mycase` tab; pass `onCaseCreated` to intake.
4. Add "Ask My Case" panel (Phase 4 UI).
5. Run `npm run build`; fix type errors.
6. Then Phase 5 (Firestore rules + Phone OTP).

**Reminder**: keep the case (`caseId`) as the central object. Everything hangs off the Case Room.