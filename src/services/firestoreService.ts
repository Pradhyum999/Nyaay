import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  getDocs,
  getDoc,
  query,
  where,
  orderBy,
  onSnapshot,
  serverTimestamp,
  Timestamp,
  setDoc,
  collectionGroup,
  writeBatch,
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import {
  HearingItem,
  LimitationAlert,
  CaseFile,
  DocumentItem,
  InvoiceItem as AppInvoiceItem,
  ForumPost as AppForumPost,
  UserProfile,
  PublicCourtCase,
  DirectMessage,
  DirectThread,
  VerificationRequest,
  VerificationStatus,
  AppNotification,
  CaseProfile,
  CaseTimelineEvent,
  CaseTask,
  CaseNote,
  AIInquiryBrief
} from '../types';
import { searchECourtsByAdvocate } from './ecourtsService';

// Re-export UserProfile for convenience
export type { UserProfile };

// ─── Firestore Helpers ───────────────────────────────────────────────────────

export function sanitizeFirestoreData<T extends Record<string, any>>(obj: T): Record<string, any> {
  const clean: Record<string, any> = {};
  for (const [key, value] of Object.entries(obj)) {
    if (value !== undefined) {
      clean[key] = value;
    }
  }
  return clean;
}

// ─── User Profiles ──────────────────────────────────────────────────────────

export async function createUserProfile(uid: string, data: Omit<UserProfile, 'uid'>) {
  const cleanData = sanitizeFirestoreData(data);
  await setDoc(doc(db, 'users', uid), {
    uid,
    ...cleanData,
    createdAt: serverTimestamp(),
  }, { merge: true });
}

export async function getUserProfile(uid: string): Promise<UserProfile | null> {
  try {
    const snap = await Promise.race([
      getDoc(doc(db, 'users', uid)),
      new Promise<null>((resolve) => setTimeout(() => resolve(null), 4000))
    ]);
    return snap && 'exists' in snap && snap.exists() ? (snap.data() as UserProfile) : null;
  } catch (err) {
    console.warn("Error fetching user profile:", err);
    return null;
  }
}

export async function getUserProfileByEmail(email: string): Promise<UserProfile | null> {
  if (!email) return null;
  const cleanEmail = email.trim().toLowerCase();
  try {
    const q = query(
      collection(db, 'users'),
      where('email', '==', cleanEmail)
    );
    const snap = await Promise.race([
      getDocs(q),
      new Promise<null>((resolve) => setTimeout(() => resolve(null), 4000))
    ]);
    if (snap && 'empty' in snap && !snap.empty) {
      return snap.docs[0].data() as UserProfile;
    }
    // Fallback in case email was stored in original casing
    const q2 = query(
      collection(db, 'users'),
      where('email', '==', email.trim())
    );
    const snap2 = await Promise.race([
      getDocs(q2),
      new Promise<null>((resolve) => setTimeout(() => resolve(null), 3000))
    ]);
    return snap2 && 'empty' in snap2 && !snap2.empty ? (snap2.docs[0].data() as UserProfile) : null;
  } catch (err) {
    console.warn("Error fetching user profile by email:", err);
    return null;
  }
}

export async function updateUserProfile(uid: string, data: Partial<UserProfile>) {
  const cleanData = sanitizeFirestoreData(data);
  await setDoc(doc(db, 'users', uid), {
    uid,
    ...cleanData,
    updatedAt: serverTimestamp(),
  }, { merge: true });
}

export async function getLawyerDirectory(): Promise<UserProfile[]> {
  const q = query(
    collection(db, 'users'),
    where('role', '==', 'lawyer'),
    where('verificationStatus', '==', 'verified')
  );
  const snap = await getDocs(q);
  return snap.docs.map(d => d.data() as UserProfile);
}

// ─── Cases (Firestore Realtime) ─────────────────────────────────────────────

export async function createCaseRecord(data: Omit<CaseFile, 'id'>): Promise<string> {
  const ref = await addDoc(collection(db, 'cases'), {
    ...data,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return ref.id;
}

export function subscribeToCases(
  userId: string,
  role: 'lawyer' | 'client',
  callback: (cases: CaseFile[]) => void
) {
  const field = role === 'lawyer' ? 'lawyerId' : 'clientId';
  const q = query(
    collection(db, 'cases'),
    where(field, '==', userId)
  );
  return onSnapshot(q, snap => {
    const list: CaseFile[] = snap.docs.map(d => ({
      id: d.id,
      ...d.data()
    } as CaseFile));
    callback(list);
  }, error => {
    console.warn("Firestore cases subscription fallback:", error);
    callback([]);
  });
}

// ─── Hearings & Cause Lists ─────────────────────────────────────────────────

export async function addHearingRecord(data: Omit<HearingItem, 'id'>): Promise<string> {
  const ref = await addDoc(collection(db, 'hearings'), {
    ...data,
    createdAt: serverTimestamp(),
  });
  return ref.id;
}

export async function updateHearingRecord(
  hearingId: string,
  orderNotes: string,
  nextDate: string
) {
  const ref = doc(db, 'hearings', hearingId);
  await updateDoc(ref, {
    previousOrderSummaryEn: orderNotes,
    previousOrderSummaryHi: orderNotes,
    hearingDate: `${nextDate}, 10:30 AM`,
    updatedAt: serverTimestamp()
  });
}

export function subscribeToHearings(
  userId: string,
  role: 'lawyer' | 'client',
  callback: (hearings: HearingItem[]) => void
) {
  const field = role === 'lawyer' ? 'lawyerId' : 'clientId';
  const q = query(
    collection(db, 'hearings'),
    where(field, '==', userId)
  );
  return onSnapshot(q, snap => {
    const list: HearingItem[] = snap.docs.map(d => ({
      id: d.id,
      ...d.data()
    } as HearingItem));
    callback(list);
  }, error => {
    console.warn("Firestore hearings subscription fallback:", error);
    callback([]);
  });
}

// ─── Invoices & Payments ────────────────────────────────────────────────────

export async function createInvoiceRecord(data: Omit<AppInvoiceItem, 'id'>): Promise<string> {
  const ref = await addDoc(collection(db, 'invoices'), {
    ...data,
    createdAt: serverTimestamp(),
  });
  return ref.id;
}

export async function markInvoiceRecordPaid(invoiceId: string, upiRef: string) {
  const ref = doc(db, 'invoices', invoiceId);
  await updateDoc(ref, {
    status: 'Paid',
    paidVia: 'UPI',
    upiRef,
    paidAt: serverTimestamp()
  });
}

export function subscribeToInvoices(
  userId: string,
  role: 'lawyer' | 'client',
  callback: (invoices: AppInvoiceItem[]) => void
) {
  const field = role === 'lawyer' ? 'lawyerId' : 'clientId';
  const q = query(
    collection(db, 'invoices'),
    where(field, '==', userId)
  );
  return onSnapshot(q, snap => {
    const list: AppInvoiceItem[] = snap.docs.map(d => ({
      id: d.id,
      ...d.data()
    } as AppInvoiceItem));
    callback(list);
  }, error => {
    console.warn("Firestore invoices subscription fallback:", error);
    callback([]);
  });
}

// ─── Documents ──────────────────────────────────────────────────────────────

export async function addDocumentRecord(data: Omit<DocumentItem, 'id'>): Promise<string> {
  const ref = await addDoc(collection(db, 'documents'), {
    ...data,
    uploadedAt: 'Just now',
    createdAt: serverTimestamp(),
  });
  return ref.id;
}

export async function updateDocumentVerification(docId: string, status: DocumentItem['status']) {
  const ref = doc(db, 'documents', docId);
  await updateDoc(ref, {
    status,
    updatedAt: serverTimestamp(),
  });
}

export function subscribeToDocuments(
  userId: string,
  role: 'lawyer' | 'client',
  callback: (docs: DocumentItem[]) => void
) {
  const field = role === 'lawyer' ? 'lawyerId' : 'clientId';
  const q = query(
    collection(db, 'documents'),
    where(field, '==', userId)
  );
  return onSnapshot(q, snap => {
    const list: DocumentItem[] = snap.docs.map(d => ({
      id: d.id,
      ...d.data()
    } as DocumentItem));
    callback(list);
  }, error => {
    console.warn("Firestore documents subscription fallback:", error);
    callback([]);
  });
}

// ─── Community Forum ────────────────────────────────────────────────────────

export async function createForumPostRecord(data: Omit<AppForumPost, 'id' | 'upvotes' | 'repliesCount'>): Promise<string> {
  const ref = await addDoc(collection(db, 'forum'), {
    ...data,
    upvotes: 0,
    repliesCount: 0,
    createdAt: serverTimestamp(),
  });
  return ref.id;
}

export async function upvoteForumPostRecord(postId: string, currentUpvotes: number) {
  const ref = doc(db, 'forum', postId);
  await updateDoc(ref, {
    upvotes: currentUpvotes + 1,
    updatedAt: serverTimestamp(),
  });
}

export function subscribeToForumPosts(callback: (posts: AppForumPost[]) => void) {
  const q = query(
    collection(db, 'forum'),
    orderBy('createdAt', 'desc')
  );
  return onSnapshot(q, snap => {
    const list: AppForumPost[] = snap.docs.map(d => ({
      id: d.id,
      ...d.data()
    } as AppForumPost));
    callback(list);
  }, error => {
    console.warn("Firestore forum subscription fallback:", error);
  });
}

// ─── AI Intake Briefs ───────────────────────────────────────────────────────

export interface AIBrief {
  id?: string;
  clientId: string;
  clientName: string;
  lawyerId?: string;
  chatHistory: Array<{ role: string; content: string }>;
  briefText: string;
  consentGiven: boolean;
  sharedWithLawyer: boolean;
  urgencyLevel?: 'low' | 'medium' | 'high';
  createdAt?: Timestamp;
}

export async function saveAIBrief(data: Omit<AIBrief, 'id'>): Promise<string> {
  const ref = await addDoc(collection(db, 'ai_briefs'), {
    ...data,
    createdAt: serverTimestamp(),
  });
  return ref.id;
}

export function subscribeToLawyerInquiries(
  lawyerId: string,
  callback: (inquiries: AIInquiryBrief[]) => void
) {
  const q = query(
    collection(db, 'ai_briefs'),
    where('lawyerId', '==', lawyerId),
    where('status', '==', 'new')
  );
  return onSnapshot(
    q,
    (snap) => {
      callback(snap.docs.map((d) => ({ id: d.id, ...d.data() } as unknown as AIInquiryBrief)));
    },
    (err) => console.warn('Inquiries subscription fallback:', err)
  );
}

export async function updateInquiryStatus(inquiryId: string, status: 'accepted' | 'declined') {
  await updateDoc(doc(db, 'ai_briefs', inquiryId), {
    status,
    updatedAt: serverTimestamp(),
  });
}


// ─── CASE ROOM: Case-scoped realtime subscriptions & mutations ───────────────
// The Case Room is the persistent workspace for a single matter. Everything
// (documents, hearings, invoices, tasks, timeline, notes) is keyed by caseId.

export function subscribeToCase(
  caseId: string,
  callback: (caseFile: CaseFile | null) => void
) {
  return onSnapshot(doc(db, 'cases', caseId), snap => {
    callback(snap.exists() ? ({ id: snap.id, ...snap.data() } as CaseFile) : null);
  }, err => {
    console.warn("Firestore case subscription fallback:", err);
  });
}

export function subscribeToCaseDocuments(
  caseId: string,
  callback: (docs: DocumentItem[]) => void
) {
  const q = query(collection(db, 'documents'), where('caseId', '==', caseId));
  return onSnapshot(q, snap => {
    callback(snap.docs.map(d => ({ id: d.id, ...d.data() } as DocumentItem)));
  }, err => console.warn("Case documents subscription fallback:", err));
}

export function subscribeToCaseHearings(
  caseId: string,
  callback: (hearings: HearingItem[]) => void
) {
  const q = query(collection(db, 'hearings'), where('caseId', '==', caseId));
  return onSnapshot(q, snap => {
    callback(snap.docs.map(d => ({ id: d.id, ...d.data() } as HearingItem)));
  }, err => console.warn("Case hearings subscription fallback:", err));
}

export function subscribeToCaseInvoices(
  caseId: string,
  callback: (invoices: AppInvoiceItem[]) => void
) {
  const q = query(collection(db, 'invoices'), where('caseId', '==', caseId));
  return onSnapshot(q, snap => {
    callback(snap.docs.map(d => ({ id: d.id, ...d.data() } as AppInvoiceItem)));
  }, err => console.warn("Case invoices subscription fallback:", err));
}

// ── Timeline ────────────────────────────────────────────────────────────────

export function subscribeToCaseTimeline(
  caseId: string,
  callback: (events: CaseTimelineEvent[]) => void
) {
  const q = query(collection(db, 'case_timeline'), where('caseId', '==', caseId));
  return onSnapshot(q, snap => {
    const list = snap.docs.map(d => ({ id: d.id, ...d.data() } as CaseTimelineEvent));
    list.sort((a, b) => (a.eventDate || '').localeCompare(b.eventDate || ''));
    callback(list);
  }, err => console.warn("Case timeline subscription fallback:", err));
}

export async function addTimelineEvent(
  event: Omit<CaseTimelineEvent, 'id' | 'createdAt'>
): Promise<string> {
  const ref = await addDoc(collection(db, 'case_timeline'), {
    ...event,
    createdAt: serverTimestamp(),
  });
  return ref.id;
}

// ── Tasks ───────────────────────────────────────────────────────────────────

export function subscribeToCaseTasks(
  caseId: string,
  callback: (tasks: CaseTask[]) => void
) {
  const q = query(collection(db, 'tasks'), where('caseId', '==', caseId));
  return onSnapshot(q, snap => {
    callback(snap.docs.map(d => ({ id: d.id, ...d.data() } as CaseTask)));
  }, err => console.warn("Case tasks subscription fallback:", err));
}

export async function createCaseTask(
  task: Omit<CaseTask, 'id' | 'createdAt'>
): Promise<string> {
  const ref = await addDoc(collection(db, 'tasks'), {
    ...task,
    createdAt: serverTimestamp(),
  });
  return ref.id;
}

export const addCaseTask = createCaseTask;

export async function updateCaseTask(
  taskId: string,
  data: Partial<Pick<CaseTask, 'status' | 'titleEn' | 'titleHi' | 'dueDate' | 'assignedTo'>>
) {
  await updateDoc(doc(db, 'tasks', taskId), {
    ...data,
    ...(data.status === 'done' ? { completedAt: new Date().toISOString() } : {}),
    updatedAt: serverTimestamp(),
  });
}

export async function deleteCaseTask(taskId: string) {
  await deleteDoc(doc(db, 'tasks', taskId));
}

// ── Notes ───────────────────────────────────────────────────────────────────

export function subscribeToCaseNotes(
  caseId: string,
  callback: (notes: CaseNote[]) => void
) {
  const q = query(collection(db, 'case_notes'), where('caseId', '==', caseId));
  return onSnapshot(q, snap => {
    const list = snap.docs.map(d => ({ id: d.id, ...d.data() } as CaseNote));
    list.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
    callback(list);
  }, err => console.warn("Case notes subscription fallback:", err));
}

export async function addCaseNote(
  note: Omit<CaseNote, 'id' | 'createdAt'>
): Promise<string> {
  const ref = await addDoc(collection(db, 'case_notes'), {
    ...note,
    createdAt: serverTimestamp(),
  });
  return ref.id;
}

// ── Create a Case Room from an AI Case Profile ("Build my case") ─────────────

export async function createCaseFromProfile(params: {
  clientId: string;
  clientName: string;
  clientPhone: string;
  profile: CaseProfile;
  caseNumber?: string;
}): Promise<string> {
  const caseNumber = params.caseNumber || `NY/${new Date().getFullYear()}/${Math.floor(1000 + Math.random() * 9000)}`;

  const caseRef = await addDoc(collection(db, 'cases'), {
    caseNumber,
    clientId: params.clientId,
    clientName: params.clientName,
    clientPhone: params.clientPhone,
    opponentName: 'To be determined',
    court: 'District Court',
    courtLocation: params.profile.location || 'India',
    actSections: [],
    caseType: params.profile.matterType,
    filingDate: new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }),
    nextHearingDate: 'Not scheduled',
    status: 'Active',
    stage: 'Admission',
    unreadDocuments: 0,
    pendingChecklistItems: params.profile.documentsRequired.length,
    totalBilled: 0,
    totalCollected: 0,
    profile: params.profile,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  const caseId = caseRef.id;

  // Seed the document checklist from the profile's required documents
  for (const docName of params.profile.documentsRequired) {
    await addDoc(collection(db, 'documents'), {
      caseId,
      caseNumber,
      clientId: params.clientId,
      titleEn: docName,
      titleHi: docName,
      requiredFormat: 'PDF / Certified Copy',
      status: 'Missing',
      createdAt: serverTimestamp(),
    });
  }

  // Seed the timeline with the intake event
  await addTimelineEvent({
    caseId,
    type: 'intake',
    titleEn: 'Case created via AI intake',
    titleHi: 'AI इनटेक द्वारा केस बनाया गया',
    descriptionEn: params.profile.summaryText,
    descriptionHi: params.profile.summaryText,
    eventDate: new Date().toISOString(),
    actorId: params.clientId,
    actorName: params.clientName,
    actorRole: 'client',
  });

  return caseId;
}

// ─── Identity Verification Requests ─────────────────────────────────────────

// Helper: Automated Bar Council Registry Validator & Matcher
export function verifyBarCouncilAutomated(params: {
  role: string;
  name: string;
  barCouncilId?: string;
  documentType?: string;
  documentUrl?: string;
}): { autoApproved: boolean; reason: string } {
  if (params.role !== 'lawyer') {
    return { autoApproved: false, reason: 'Citizen verification requires manual admin cross-check' };
  }

  const id = params.barCouncilId?.trim().toUpperCase();
  if (!id) {
    return { autoApproved: false, reason: 'Bar Council ID missing' };
  }

  // Bar Council Format Validation (e.g. D/1482/2015, MAH/2034/2019, UP/109/2021)
  const bciRegex = /^([A-Z&]{1,6})\/(\d{1,6})\/(\d{4})$/;
  const match = id.match(bciRegex);
  if (!match) {
    return { autoApproved: false, reason: 'Bar Council ID format invalid (expected STATE/ROLL/YEAR, e.g. D/1482/2015)' };
  }

  const [, stateCode, rollNo, yearStr] = match;
  const year = parseInt(yearStr, 10);
  const currentYear = new Date().getFullYear();
  if (year < 1961 || year > currentYear) {
    return { autoApproved: false, reason: `Enrollment year ${year} out of valid range (1961 - ${currentYear})` };
  }

  // Name check: must have at least first and last name without suspicious symbols
  const nameParts = params.name.trim().split(/\s+/);
  if (nameParts.length < 2) {
    return { autoApproved: false, reason: 'Full advocate name must contain at least first and surname' };
  }

  // State bar council check
  const recognizedStateCodes = ['D', 'MAH', 'UP', 'P&H', 'KAR', 'TN', 'WB', 'MP', 'BIH', 'RAJ', 'GUJ', 'KER', 'AP', 'TS', 'OR', 'JH', 'CH'];
  if (!recognizedStateCodes.includes(stateCode)) {
    return { autoApproved: false, reason: `State bar council code "${stateCode}" not recognized in automated directory` };
  }

  return { autoApproved: true, reason: `Automated registry match passed: Enrolled with Bar Council of ${stateCode}, Roll #${rollNo}/${year}` };
}

export async function submitVerificationRequest(params: {
  uid: string;
  role: 'lawyer' | 'client';
  name: string;
  email?: string;
  phone?: string;
  documentType: string;
  documentUrl?: string;
  maskedIdNumber?: string;
  govIdType?: string;
  barCouncilId?: string;
  education?: string[];
  city?: string;
}): Promise<string> {
  const cleanParams = sanitizeFirestoreData(params);
  
  // Run automated verification matcher for advisory flag only (P2: kill auto-verify bypass)
  const autoCheck = verifyBarCouncilAutomated(params);
  const initialStatus: VerificationStatus = 'pending';
  const now = new Date().toISOString();

  const reqRef = await addDoc(collection(db, 'verification_requests'), {
    ...cleanParams,
    status: initialStatus,
    submittedAt: now,
    autoFlag: autoCheck.autoApproved ? 'likely_valid' : 'review',
    auditTrail: [
      {
        decision: initialStatus,
        adminEmail: 'system',
        timestamp: now,
        reason: `Verification request submitted. Automated check: ${autoCheck.reason}. Queued for administrative review.`,
      }
    ],
    createdAt: serverTimestamp(),
  });

  // Update user profile status
  const profileUpdates: Partial<UserProfile> = {
    verificationStatus: initialStatus,
    idDocumentType: params.documentType as any,
    idDocumentUrl: params.documentUrl || '',
    idDocumentNumberMasked: params.maskedIdNumber || '',
    barCouncilId: params.barCouncilId || '',
    city: params.city || '',
    rejectionReason: '',
  };
  if (params.education && params.education.length > 0) {
    profileUpdates.education = params.education;
  }

  await updateUserProfile(params.uid, profileUpdates);

  // Write notification strictly for admin queue
  await addDoc(collection(db, 'notifications'), {
    recipientId: 'admin',
    type: 'verification',
    title: `New ${params.role === 'lawyer' ? 'Advocate' : 'Citizen'} Verification Request`,
    message: `${params.name} submitted ${params.documentType}. Flagged: ${autoCheck.reason}`,
    senderName: params.name,
    read: false,
    createdAt: now,
    link: `/admin`,
  });

  return reqRef.id;
}

export async function processVerificationRequest(
  requestId: string,
  uidOrStatus: string,
  newStatusOrReason?: 'verified' | 'rejected' | 'resubmission_required' | string,
  reason?: string,
  adminEmail: string = 'admin@nyaayneeti.in'
) {
  const reqRef = doc(db, 'verification_requests', requestId);
  const now = new Date().toISOString();

  let status: 'verified' | 'rejected' | 'resubmission_required';
  let uid = uidOrStatus;
  let finalReason = reason;

  if (uidOrStatus === 'verified' || uidOrStatus === 'rejected' || uidOrStatus === 'resubmission_required') {
    status = uidOrStatus;
    finalReason = typeof newStatusOrReason === 'string' ? newStatusOrReason : undefined;
    uid = '';
  } else {
    status = (newStatusOrReason as 'verified' | 'rejected' | 'resubmission_required') || 'verified';
  }

  // Read existing audit trail and uid from request doc
  const snap = await getDoc(reqRef);
  const existingTrail = snap.exists() ? (snap.data().auditTrail || []) : [];
  if (!uid && snap.exists()) {
    uid = snap.data().uid || '';
  }

  const newAuditEntry = {
    decision: status,
    adminEmail,
    timestamp: now,
    reason: finalReason || (status === 'verified' ? 'Identity verified & approved' : ''),
  };

  await updateDoc(reqRef, {
    status,
    rejectionReason: finalReason || '',
    verifiedBy: status === 'verified' ? adminEmail : '',
    verifiedAt: status === 'verified' ? now : null,
    auditTrail: [...existingTrail, newAuditEntry],
    processedAt: serverTimestamp(),
  });

  if (uid) {
    await updateUserProfile(uid, {
      verificationStatus: status,
      rejectionReason: finalReason || '',
      verifiedBy: status === 'verified' ? adminEmail : undefined,
      verifiedAt: status === 'verified' ? now : undefined,
    });

    // Notify the user about their verification status update
    const notifTitles: Record<string, string> = {
      verified: 'Identity Verified Successfully',
      rejected: 'Verification Application Rejected',
      resubmission_required: 'Document Resubmission Required',
    };

    const notifBodies: Record<string, string> = {
      verified: 'Congratulations! Your identity has been verified by the administrator. Your profile now proudly displays the verified checkmark.',
      rejected: `Your verification request was rejected: ${finalReason || 'Invalid or unverified documents provided.'}`,
      resubmission_required: `Please resubmit your verification document: ${finalReason || 'Document was unreadable or incomplete.'}`,
    };

    await addDoc(collection(db, 'notifications'), {
      recipientId: uid,
      type: 'system',
      title: notifTitles[status] || 'Verification Status Update',
      message: notifBodies[status] || 'Your verification status has been updated.',
      read: false,
      createdAt: now,
    });
  }
}

export async function getPendingVerificationRequests(): Promise<VerificationRequest[]> {
  const q = query(
    collection(db, 'verification_requests'),
    where('status', '==', 'pending')
  );
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() } as VerificationRequest));
}

export async function getAllVerificationRequests(): Promise<VerificationRequest[]> {
  const q = query(
    collection(db, 'verification_requests'),
    orderBy('createdAt', 'desc')
  );
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() } as VerificationRequest));
}

// ─── Public Court Cases & eCourts Fetcher with Provenance ────────────────────

export async function fetchPublicCourtCases(barCouncilId: string, lawyerName: string): Promise<PublicCourtCase[]> {
  // Queries authentic judicial dockets for this advocate.
  // Returns genuine dockets where counsel appeared. Does NOT generate fake random data.
  return searchECourtsByAdvocate(barCouncilId, lawyerName);
}

export async function syncLawyerPublicCases(uid: string, publicCases: PublicCourtCase[]) {
  await updateUserProfile(uid, { publicCases, totalCases: publicCases.length });
}

export async function addPublicCourtCase(uid: string, currentCases: PublicCourtCase[], newCase: PublicCourtCase): Promise<PublicCourtCase[]> {
  // Avoid duplicate CNR imports
  const existingIdx = currentCases.findIndex(c => (c.cnrNumber && c.cnrNumber === newCase.cnrNumber) || c.id === newCase.id);
  let updated: PublicCourtCase[];
  if (existingIdx >= 0) {
    updated = [...currentCases];
    updated[existingIdx] = newCase;
  } else {
    updated = [newCase, ...currentCases];
  }
  await updateUserProfile(uid, { publicCases: updated, totalCases: updated.length });
  return updated;
}

export async function deletePublicCourtCase(uid: string, currentCases: PublicCourtCase[], caseId: string): Promise<PublicCourtCase[]> {
  const updated = currentCases.filter(c => c.id !== caseId);
  await updateUserProfile(uid, { publicCases: updated, totalCases: updated.length });
  return updated;
}

export async function togglePublicCaseVisibility(uid: string, currentCases: PublicCourtCase[], caseId: string, show: boolean) {
  const updated = currentCases.map(c => c.id === caseId ? { ...c, showOnProfile: show } : c);
  await updateUserProfile(uid, { publicCases: updated });
  return updated;
}

export async function updateAdvocateCaseNotes(uid: string, currentCases: PublicCourtCase[], caseId: string, advocateNotes: string) {
  const updated = currentCases.map(c => c.id === caseId ? { ...c, advocateNotes } : c);
  await updateUserProfile(uid, { publicCases: updated });
  return updated;
}

// ─── Direct Client-to-Lawyer Chat Threads & Messages ─────────────────────────

export async function createOrGetDirectThread(params: {
  lawyerId: string;
  lawyerName: string;
  lawyerPhoto?: string;
  clientId: string;
  clientName: string;
  clientPhoto?: string;
  matterSubject: string;
  aiBriefText?: string;
}): Promise<string> {
  const q = query(
    collection(db, 'threads'),
    where('lawyerId', '==', params.lawyerId),
    where('clientId', '==', params.clientId)
  );
  const snap = await getDocs(q);

  if (!snap.empty) {
    const existingId = snap.docs[0].id;
    if (params.aiBriefText) {
      await updateDoc(doc(db, 'threads', existingId), {
        aiBriefAttached: true,
        aiBriefText: params.aiBriefText,
        lastMessage: 'AI Legal Intake Brief shared with Advocate.',
        lastMessageAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      });
      await addDoc(collection(db, `threads/${existingId}/messages`), {
        threadId: existingId,
        senderId: params.clientId,
        senderName: params.clientName,
        senderRole: 'client',
        text: `📋 AI Legal Brief: ${params.aiBriefText}`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        createdAt: serverTimestamp(),
      });
    }
    return existingId;
  }

  const threadRef = await addDoc(collection(db, 'threads'), {
    lawyerId: params.lawyerId,
    lawyerName: params.lawyerName,
    lawyerPhoto: params.lawyerPhoto || '',
    clientId: params.clientId,
    clientName: params.clientName,
    clientPhoto: params.clientPhoto || '',
    matterSubject: params.matterSubject,
    lastMessage: params.aiBriefText ? 'AI Legal Brief attached to consultation.' : 'Consultation requested.',
    lastMessageAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    aiBriefAttached: !!params.aiBriefText,
    aiBriefText: params.aiBriefText || '',
    status: 'active',
    createdAt: serverTimestamp(),
  });

  // Initial greeting message
  await addDoc(collection(db, `threads/${threadRef.id}/messages`), {
    threadId: threadRef.id,
    senderId: params.clientId,
    senderName: params.clientName,
    senderRole: 'client',
    text: params.aiBriefText 
      ? `Hello Adv. ${params.lawyerName}, I have initiated this consultation regarding: ${params.matterSubject}.\n\n📋 Attached AI Case Summary:\n${params.aiBriefText}`
      : `Hello Adv. ${params.lawyerName}, I would like to consult with you regarding: ${params.matterSubject}.`,
    timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    createdAt: serverTimestamp(),
  });

  return threadRef.id;
}

export async function sendDirectMessage(threadId: string, msg: {
  senderId: string;
  senderName: string;
  senderRole: 'lawyer' | 'client';
  text: string;
  hasAttachment?: boolean;
  attachmentName?: string;
  attachmentUrl?: string;
  attachmentType?: 'image' | 'file';
  attachmentSize?: string;
}) {
  const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  await addDoc(collection(db, `threads/${threadId}/messages`), {
    threadId,
    ...msg,
    timestamp,
    createdAt: serverTimestamp(),
  });

  const lastPreview = msg.text?.trim()
    ? (msg.text.length > 80 ? msg.text.slice(0, 80) + '...' : msg.text)
    : (msg.attachmentType === 'image' ? '📷 Photo' : '📎 Document: ' + (msg.attachmentName || 'Attachment'));

  await updateDoc(doc(db, 'threads', threadId), {
    lastMessage: lastPreview,
    lastMessageAt: timestamp,
    lastMessageSenderId: msg.senderId,
    hasAttachment: !!msg.hasAttachment,
    attachmentType: msg.attachmentType || null,
    updatedAt: serverTimestamp(),
  });
}

export async function transferAIBriefToThread(
  threadId: string,
  aiBriefText: string,
  clientName: string,
  clientId: string
) {
  const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  await addDoc(collection(db, `threads/${threadId}/messages`), {
    threadId,
    senderId: clientId,
    senderName: clientName,
    senderRole: 'client',
    text: `⚡ [Transferred AI Consultation Summary]\n${aiBriefText}`,
    timestamp,
    createdAt: serverTimestamp(),
  });

  await updateDoc(doc(db, 'threads', threadId), {
    aiBriefAttached: true,
    aiBriefText,
    lastMessage: 'AI Case Summary transferred by client.',
    lastMessageAt: timestamp,
    updatedAt: serverTimestamp(),
  });
}

export function subscribeToThreadMessages(threadId: string, callback: (msgs: DirectMessage[]) => void) {
  const q = query(
    collection(db, `threads/${threadId}/messages`),
    orderBy('createdAt', 'asc')
  );
  return onSnapshot(q, snap => {
    const list = snap.docs.map(d => ({
      id: d.id,
      ...d.data()
    } as DirectMessage));
    callback(list);
  }, err => {
    console.warn("Messages subscription fallback:", err);
  });
}

export function subscribeToUserThreads(
  userId: string,
  role: 'lawyer' | 'client',
  callback: (threads: DirectThread[]) => void
) {
  const field = role === 'lawyer' ? 'lawyerId' : 'clientId';
  const q = query(
    collection(db, 'threads'),
    where(field, '==', userId)
  );
  return onSnapshot(q, snap => {
    const list = snap.docs.map(d => ({
      id: d.id,
      ...d.data()
    } as DirectThread));
    
    // Sort most recent first
    list.sort((a: any, b: any) => {
      const timeA = a.updatedAt?.toMillis?.() || (a.lastMessageAt ? new Date(a.lastMessageAt).getTime() : 0);
      const timeB = b.updatedAt?.toMillis?.() || (b.lastMessageAt ? new Date(b.lastMessageAt).getTime() : 0);
      return timeB - timeA;
    });

    callback(list);
  }, err => {
    console.warn("Threads subscription fallback:", err);
  });
}

// ─── Advocate Engagement & In-App Notifications ──────────────────────────────

export async function engageAdvocate(params: {
  lawyerId: string;
  lawyerName: string;
  lawyerEmail?: string;
  clientId: string;
  clientName: string;
  clientPhone: string;
  matterSubject: string;
  attachAIBrief: boolean;
  aiBriefText?: string;
}): Promise<string> {
  const threadId = await createOrGetDirectThread({
    lawyerId: params.lawyerId,
    lawyerName: params.lawyerName,
    clientId: params.clientId,
    clientName: params.clientName,
    matterSubject: params.matterSubject,
    aiBriefText: params.attachAIBrief ? params.aiBriefText : undefined,
  });

  // Create notification for Advocate
  await addDoc(collection(db, 'notifications'), {
    recipientId: params.lawyerId,
    type: 'engagement',
    title: 'New Client Consultation Request',
    message: `${params.clientName} has engaged your practice regarding: "${params.matterSubject}". You can now start direct communication.`,
    senderName: params.clientName,
    threadId,
    read: false,
    createdAt: new Date().toISOString(),
    lawyerEmail: params.lawyerEmail || '',
    notifyAdminEmail: 'admin@nyaayneeti.in',
  });

  return threadId;
}

export function subscribeToUserNotifications(
  userId: string,
  callback: (notifs: AppNotification[]) => void,
  opts?: { includeAdminChannel?: boolean }
) {
  const targets = opts?.includeAdminChannel ? [userId, 'admin'] : [userId];
  const q = query(
    collection(db, 'notifications'),
    where('recipientId', 'in', targets)
  );
  return onSnapshot(
    q,
    (snap) => {
      const list = snap.docs.map(
        (d) =>
          ({
            id: d.id,
            ...d.data(),
          } as AppNotification)
      );
      list.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
      callback(list);
    },
    (err) => {
      console.warn('Notifications subscription fallback:', err);
    }
  );
}

export async function markNotificationRead(notifId: string) {
  await updateDoc(doc(db, 'notifications', notifId), {
    read: true,
  });
}

export async function addNotification(
  notif: Omit<AppNotification, 'id'>
): Promise<string> {
  const ref = await addDoc(collection(db, 'notifications'), {
    ...notif,
    createdAt: notif.createdAt || new Date().toISOString(),
  });
  return ref.id;
}

export async function purgeAllCitizenData(): Promise<{ deletedCount: number }> {
  try {
    const usersRef = collection(db, 'users');
    const q = query(usersRef, where('role', '==', 'client'));
    const snap = await getDocs(q);
    let count = 0;
    for (const userDoc of snap.docs) {
      await deleteDoc(doc(db, 'users', userDoc.id));
      count++;
    }

    // Also remove any client verification requests
    const vq = query(collection(db, 'verification_requests'), where('role', '==', 'client'));
    const vSnap = await getDocs(vq);
    for (const vDoc of vSnap.docs) {
      await deleteDoc(doc(db, 'verification_requests', vDoc.id));
    }

    return { deletedCount: count };
  } catch (err) {
    console.error("Error purging citizen data:", err);
    throw err;
  }
}

// ─── Firm Management ─────────────────────────────────────────────────────────

export async function createFirmProfile(
  adminUid: string,
  data: Omit<import('../types').FirmProfile, 'id' | 'adminUid' | 'memberCount' | 'createdAt'>
): Promise<string> {
  const docRef = await addDoc(collection(db, 'firms'), {
    ...sanitizeFirestoreData(data),
    adminUid,
    memberCount: 0,
    createdAt: serverTimestamp(),
  });
  return docRef.id;
}

export async function getFirmByAdminUid(adminUid: string): Promise<import('../types').FirmProfile | null> {
  try {
    const q = query(collection(db, 'firms'), where('adminUid', '==', adminUid));
    const snap = await getDocs(q);
    if (snap.empty) return null;
    const d = snap.docs[0];
    return { id: d.id, ...d.data() } as import('../types').FirmProfile;
  } catch {
    return null;
  }
}

export async function addFirmMember(
  firmId: string,
  member: Omit<import('../types').FirmMember, 'id' | 'firmId' | 'joinedAt'>
): Promise<string> {
  const docRef = await addDoc(collection(db, 'firms', firmId, 'members'), {
    ...sanitizeFirestoreData(member),
    firmId,
    joinedAt: serverTimestamp(),
  });

  // Increment member count
  try {
    const firmRef = doc(db, 'firms', firmId);
    const firmSnap = await getDoc(firmRef);
    if (firmSnap.exists()) {
      const current = firmSnap.data().memberCount || 0;
      await updateDoc(firmRef, { memberCount: current + 1 });
    }
  } catch {}

  return docRef.id;
}

export function subscribeToFirmMembers(
  firmId: string,
  callback: (members: import('../types').FirmMember[]) => void
): () => void {
  return onSnapshot(collection(db, 'firms', firmId, 'members'), (snap) => {
    callback(snap.docs.map(d => ({ id: d.id, ...d.data() } as import('../types').FirmMember)));
  }, (err) => {
    console.warn("Firm members subscription fallback:", err);
  });
}

export async function removeFirmMember(firmId: string, memberId: string): Promise<void> {
  await deleteDoc(doc(db, 'firms', firmId, 'members', memberId));
  try {
    const firmRef = doc(db, 'firms', firmId);
    const firmSnap = await getDoc(firmRef);
    if (firmSnap.exists()) {
      const current = firmSnap.data().memberCount || 1;
      await updateDoc(firmRef, { memberCount: Math.max(0, current - 1) });
    }
  } catch {}
}

export async function updateMemberPasswordStatus(
  firmId: string,
  memberId: string,
  mustChangePassword: boolean
): Promise<void> {
  await updateDoc(doc(db, 'firms', firmId, 'members', memberId), {
    mustChangePassword,
    tempPassword: mustChangePassword ? undefined : null,
  });
}

export async function findFirmMemberByEmail(
  email: string
): Promise<{ member: import('../types').FirmMember; firmId: string; firmName?: string } | null> {
  const cleanEmail = email.toLowerCase().trim();
  try {
    const q = query(collectionGroup(db, 'members'), where('email', '==', cleanEmail));
    const snap = await getDocs(q);
    if (!snap.empty) {
      const docSnap = snap.docs[0];
      const member = { id: docSnap.id, ...docSnap.data() } as import('../types').FirmMember;
      const firmId = docSnap.ref.parent.parent?.id || member.firmId || '';
      let firmName = '';
      if (firmId) {
        try {
          const fDoc = await getDoc(doc(db, 'firms', firmId));
          if (fDoc.exists()) {
            firmName = fDoc.data().firmName || '';
          }
        } catch {}
      }
      return { member, firmId, firmName };
    }
  } catch (err) {
    console.warn("CollectionGroup member search failed, falling back:", err);
  }

  // Fallback: search across all firms documents
  try {
    const firmsSnap = await getDocs(collection(db, 'firms'));
    for (const fDoc of firmsSnap.docs) {
      const memQ = query(collection(db, 'firms', fDoc.id, 'members'), where('email', '==', cleanEmail));
      const memSnap = await getDocs(memQ);
      if (!memSnap.empty) {
        const mDoc = memSnap.docs[0];
        return {
          member: { id: mDoc.id, ...mDoc.data() } as import('../types').FirmMember,
          firmId: fDoc.id,
          firmName: fDoc.data()?.firmName || '',
        };
      }
    }
  } catch (e2) {
    console.warn("Fallback firm scan failed:", e2);
  }

  return null;
}

export async function updateMemberPassword(
  firmId: string,
  memberId: string,
  newPassword: string
): Promise<void> {
  await updateDoc(doc(db, 'firms', firmId, 'members', memberId), {
    mustChangePassword: false,
    tempPassword: null,
    passwordUpdated: true,
    passwordHash: newPassword, // stored for demo verification
  });
}

export function subscribeToCitizenFeedback(
  callback: (feedback: import('../types').CitizenFeedback[]) => void
): () => void {
  const q = query(collection(db, 'citizen_feedback'), orderBy('createdAt', 'desc'));
  return onSnapshot(
    q,
    (snap) => {
      callback(snap.docs.map((d) => ({ id: d.id, ...d.data() } as import('../types').CitizenFeedback)));
    },
    (err) => {
      console.warn("Citizen feedback subscription fallback:", err);
    }
  );
}

// ─── Chambers Geo & Public Directory Mirror (Part C) ────────────────────────

export async function updateAdvocateChamberLocation(
  uid: string,
  geo: import('../types').GeoPoint,
  chambersAddress: string,
  profile: Partial<UserProfile>
): Promise<void> {
  const batch = writeBatch(db);
  const userRef = doc(db, 'users', uid);
  batch.update(userRef, {
    chamberGeo: geo,
    chambersAddress,
    city: geo.city,
    state: geo.state,
    updatedAt: serverTimestamp(),
  });

  const dirRef = doc(db, 'directory', uid);
  const approxGeo = {
    lat: Math.round(geo.lat * 100) / 100,
    lng: Math.round(geo.lng * 100) / 100,
    geohash: geo.geohash.slice(0, 5),
  };

  batch.set(
    dirRef,
    {
      uid,
      name: profile.name || 'Advocate',
      verified: profile.verificationStatus === 'verified',
      city: geo.city,
      state: geo.state,
      approxGeo,
      practiceAreas: profile.practiceAreas || [],
      experience: profile.experience || 0,
      languages: profile.languages || ['English'],
      feeRange: profile.feeRange || null,
      photoURL: profile.photoURL || null,
      firmName: profile.firmName || null,
      barCouncilId: profile.barCouncilId || null,
      phone: profile.phone || null,
      updatedAt: serverTimestamp(),
    },
    { merge: true }
  );

  await batch.commit();
}

export function subscribeToDirectory(
  callback: (entries: import('../types').DirectoryEntry[]) => void
): () => void {
  const q = query(collection(db, 'directory'));
  return onSnapshot(
    q,
    (snap) => {
      const list = snap.docs.map(
        (d) => ({ uid: d.id, ...d.data() } as import('../types').DirectoryEntry)
      );
      callback(list);
    },
    (err) => {
      console.warn("Directory subscription error:", err);
    }
  );
}



