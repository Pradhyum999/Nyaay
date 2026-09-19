# NYAAY — Complete Project Context, Architecture, & Roadmap Dossier

> **Target Audience**: Any AI agent or developer continuing work on this codebase. This document contains full end-to-end context, technical specs, current implementation state, credentials mapping, and what needs to be replaced to transition from mock data to a 100% full-fledged app.

---

## 1. Executive Summary & Vision

**Application Name**: NYAAY (न्याय) — Legal-Tech Platform  
**Live Production URL**: `https://nyaay-legal-app-f6e99.web.app`  
**Hosting**: Firebase Hosting (Spark Free Tier)  
**Target Platform**: Android-first Progressive Web App (PWA) with Google Play TWA path.  
**Design Standard**: Apple / Netflix minimalist aesthetic (Obsidian Black `#000000`, frosted glass `backdrop-blur`, subtle borders `border-white/[0.08]`, iOS press micro-interactions).  
**Languages**: Full English & Hindi (हिन्दी) bilingual support with dynamic toggle.  
**Compliance**: Bar Council of India (BCI) rules compliant (no public advertisement or solicitation, objective directory & practice data).

---

## 2. Infrastructure & Credentials

- **Firebase Project ID**: `nyaay-legal-app`
- **Linked Hosting Site**: `nyaay-legal-app-f6e99`
- **Owner Account**: `pradhumb1998@gmail.com`
- **Web App Config** (stored in `.env`):
  ```env
  VITE_FIREBASE_API_KEY=AIzaSyA631nC0q7kLNJEE5PvceNppTgvV9Ohm1U
  VITE_FIREBASE_AUTH_DOMAIN=nyaay-legal-app.firebaseapp.com
  VITE_FIREBASE_PROJECT_ID=nyaay-legal-app
  VITE_FIREBASE_STORAGE_BUCKET=nyaay-legal-app.firebasestorage.app
  VITE_FIREBASE_MESSAGING_SENDER_ID=135442555454
  VITE_FIREBASE_APP_ID=1:135442555454:web:15a79552d9185f3a27276f
  VITE_FIREBASE_MEASUREMENT_ID=G-G92V5Q4283
  VITE_GEMINI_API_KEY=AIzaSy_REPLACE_WITH_GEMINI_KEY
  ```
- **Firebase Auth Authorized Domains**:
  - `localhost`
  - `nyaay-legal-app-f6e99.web.app`
  - `nyaay-legal-app-f6e99.firebaseapp.com`

---

## 3. Technology Stack

- **Frontend**: React 19 / Vite 8 / TypeScript / Tailwind CSS v4
- **Icons**: `lucide-react`
- **Backend / Database**: Cloud Firestore (`asia-south1` or default)
- **Auth**: Firebase Authentication (Google OAuth + Phone OTP UI)
- **AI Core**: Google Gemini SDK (`@google/genai` v2.3.0+) using model `gemini-3.8-flash` (Interactions API)
- **State Management**: React Context (`AuthContext.tsx`) + Firestore real-time snapshot listeners (`onSnapshot`)

---

## 4. Current File Tree & Responsibilities

```
c:\Users\pradh\Documents\antigravity\happy-curie\
├── .env                              # Active env variables (Firebase + Gemini key)
├── .env.example                      # Template for env variables
├── .firebaserc                       # Firebase project binding ("default": "nyaay-legal-app")
├── firebase.json                     # Firebase Hosting rewrites (SPA routing to index.html)
├── package.json                      # Dependencies (firebase, @google/genai, tailwindcss v4)
├── public/
│   └── manifest.json                 # PWA install manifest (standalone display, Android icon)
├── src/
│   ├── main.tsx                      # Vite React entry point
│   ├── App.tsx                       # Root component: handles role routing (Lawyer vs Client)
│   ├── index.css                     # Tailwind v4 import, custom glass-card & ios-press classes
│   ├── types/
│   │   └── index.ts                  # Domain models: HearingItem, CaseFile, InvoiceItem, ChatMessage, etc.
│   ├── i18n/
│   │   └── translations.ts           # EN / HI dictionaries for all screens
│   ├── lib/
│   │   ├── firebase.ts               # Firebase App, Auth, Firestore, Storage exports
│   │   └── gemini.ts                 # Gemini 3.8 Flash streaming client, brief generator, doc analyzer
│   ├── contexts/
│   │   └── AuthContext.tsx           # Session management, Google login, Firestore user profile synchronization
│   ├── services/
│   │   └── firestoreService.ts       # Complete Firestore CRUD for cases, hearings, invoices, messages, forum
│   ├── data/
│   │   └── mockData.ts               # LEGACY MOCK DATA (Being replaced with Firestore)
│   └── components/
│       ├── AndroidFrame.tsx          # Responsive frame: Full-screen on mobile (<768px), phone frame on desktop
│       ├── TopAppBar.tsx             # Header with title, limitation alert badge, profile trigger
│       ├── BottomNavBar.tsx          # Lawyer 5-tab navigation (Diary, Cases, AI Briefs, Billing, Community)
│       ├── SpeedDialFAB.tsx          # Quick action floating menu for lawyers
│       ├── LawyerProfileModal.tsx    # BCI details, enrollment ID, practice areas modal
│       ├── VirtualCaseDiary.tsx      # Cause list, limitation alerts, post-hearing order updater
│       ├── CaseListView.tsx          # Active cases list, search filter, case summary cards
│       ├── DocumentManager.tsx       # Lawyer checklist publisher & verification tracking
│       ├── BillingManager.tsx        # Itemized billing, Apple Wallet-style stats, UPI QR modal
│       ├── CourtAnalyticsAndForum.tsx# Bench tendency analytics & verified lawyer peer forum
│       ├── auth/
│       │   └── AuthScreen.tsx        # Role selection, Google sign-in, mobile OTP, advocate onboarding
│       └── client/
│           ├── ClientBottomNav.tsx   # Client 5-tab navigation (AI Consult, Tracker, Upload, Pay, Directory)
│           ├── ClientAIConsultation.tsx # Real-time streaming legal chat with Gemini 3.8 Flash & consent brief
│           ├── ClientCaseTracker.tsx # Case status progress bar, advocate card, upcoming hearing
│           ├── ClientDocumentUpload.tsx # Client upload vault with format validation warnings
│           ├── ClientPaymentView.tsx # Outstanding fee cards + direct UPI payment trigger
│           └── ClientLawyerDirectory.tsx # Verified lawyer search by practice area & state
```

---

## 5. Transitioning from Mock Data to 100% Full-Fledged Data

### A. Current Mock Data Dependencies in `App.tsx`
Currently, `App.tsx` imports from `./data/mockData.ts`:
- `mockHearings`
- `mockLimitationAlerts`
- `mockCaseFiles`
- `mockDocuments`
- `mockInvoices`
- `mockJudicialAnalytics`
- `mockForumPosts`

### B. Firestore Collections Schema
The data service in `src/services/firestoreService.ts` is already fully written. It connects to the following collections:

1. **`users/{uid}`**:
   - `role`: `'lawyer' | 'client' | 'junior'`
   - `name`: string
   - `phone`: string
   - `email`: string
   - `barCouncilId`: string (Advocate only)
   - `state`: string
   - `practiceAreas`: string[]
   - `experience`: number
   - `verificationStatus`: `'pending' | 'verified' | 'rejected'`
   - `feeRange`: `{ min: number, max: number }`

2. **`cases/{caseId}`**:
   - `caseNumber`: string
   - `title`: string
   - `court`: string
   - `stage`: string
   - `lawyerId`: string
   - `clientId`: string
   - `filingDate`: string
   - `nextHearingDate`: string
   - `status`: `'active' | 'closed' | 'pending'`

3. **`hearings/{hearingId}`**:
   - `caseId`: string
   - `lawyerId`: string
   - `clientId`: string
   - `caseNumber`: string
   - `court`: string
   - `hearingDate`: string (ISO)
   - `itemNumber`: number
   - `judgeName`: string
   - `stage`: string
   - `purposeEn` / `purposeHi`: string
   - `orderNotes`: string
   - `status`: `'upcoming' | 'completed' | 'adjourned'`

4. **`invoices/{invoiceId}`**:
   - `lawyerId`: string
   - `clientId`: string
   - `caseNumber`: string
   - `items`: `Array<{ description: string, amount: number }>`
   - `totalAmount`: number
   - `status`: `'pending' | 'paid' | 'overdue'`
   - `dueDate`: string

5. **`documents/{documentId}`**:
   - `caseId`: string
   - `lawyerId`: string
   - `clientId`: string
   - `name`: string
   - `type`: string
   - `uploadedBy`: `'lawyer' | 'client'`
   - `verified`: boolean
   - `required`: boolean

6. **`forum/{postId}`**:
   - `authorId`: string
   - `authorName`: string
   - `title`: string
   - `content`: string
   - `tags`: string[]
   - `upvotes`: number
   - `upvotedBy`: string[]
   - `replyCount`: number

7. **`ai_briefs/{briefId}`**:
   - `clientId`: string
   - `clientName`: string
   - `lawyerId`: string
   - `chatHistory`: array
   - `briefText`: string
   - `consentGiven`: boolean
   - `sharedWithLawyer`: boolean

---

## 6. Implementation Step-by-Step for the Next AI/Developer

To make the app completely live with real Firestore data:

1. **Seed or Initial Query Mechanism**:
   - When a user signs in (Lawyer or Client), `App.tsx` must subscribe to their real documents via `subscribeToHearings(user.uid)`, `subscribeToCases(user.uid)`, etc.
   - If the database is empty for a new lawyer, automatically provide an "Add First Case" or sample onboarding button that creates genuine documents in Firestore.

2. **Connect Components Directly to Firestore**:
   - **`VirtualCaseDiary.tsx`**: When a hearing order is logged via `onUpdateHearingOrder`, call `updateHearing(hearingId, { orderNotes, nextHearingDate })` in Firestore.
   - **`BillingManager.tsx`**: When an invoice is created, call `createInvoice(...)`. When marked as paid via UPI, call `markInvoicePaid(invoiceId)`.
   - **`CourtAnalyticsAndForum.tsx`**: Replace `mockForumPosts` with real-time `getForumPosts()` and `upvotePost(...)`.
   - **`ClientLawyerDirectory.tsx`**: Query Firestore for real verified lawyers using `getLawyerDirectory()`.

3. **Gemini Live AI Connection**:
   - Put a valid Gemini API Key from Google AI Studio into `VITE_GEMINI_API_KEY` inside `.env`.
   - Re-run `npm run build` and `npx firebase-tools deploy --only hosting --project nyaay-legal-app`.

---

## 7. Deployment & Build Commands

- **Local Dev Server**: `npx vite --host --port 5173`
- **Build**: `npm run build`
- **Deploy to Production**: `npx firebase-tools deploy --only hosting --project nyaay-legal-app`

