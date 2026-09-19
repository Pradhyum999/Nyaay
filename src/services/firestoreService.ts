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
  AppNotification
} from '../types';
import { searchECourtsByAdvocate } from './ecourtsService';

// Re-export UserProfile for convenience
export type { UserProfile };

// ─── User Profiles ──────────────────────────────────────────────────────────

export async function createUserProfile(uid: string, data: Omit<UserProfile, 'uid'>) {
  await setDoc(doc(db, 'users', uid), {
    uid,
    ...data,
    createdAt: serverTimestamp(),
  });
}

export async function getUserProfile(uid: string): Promise<UserProfile | null> {
  const snap = await getDoc(doc(db, 'users', uid));
  return snap.exists() ? (snap.data() as UserProfile) : null;
}

export async function updateUserProfile(uid: string, data: Partial<UserProfile>) {
  await updateDoc(doc(db, 'users', uid), data);
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

// ─── Auto-Seeding / Starter Data for New Users ──────────────────────────────

export async function seedInitialAdvocateData(uid: string, advocateName: string) {
  // 1. Initial Sample Hearing
  const hearingRef = collection(db, 'hearings');
  await addDoc(hearingRef, {
    lawyerId: uid,
    caseNumber: "CRL.A./882/2026",
    clientName: "Vikramaditya Singhania",
    courtName: "Delhi High Court (Court 14)",
    itemNumber: 4,
    courtRoom: "Court No. 14",
    judgeName: "Hon'ble Mr. Justice S. K. Kaul",
    stage: "Final Arguments",
    hearingDate: "Today, 10:30 AM",
    hearingTime: "10:30 AM",
    purposeEn: "Arguments on Suspension of Sentence & Bail Application",
    purposeHi: "सजा के निलंबन एवं जमानत याचिका पर अंतिम बहस",
    previousOrderSummaryEn: "Ld. State counsel directed to file status report. Interim protection extended.",
    previousOrderSummaryHi: "राज्य अभियोजक को स्थिति रिपोर्ट दाखिल करने का निर्देश दिया गया।",
    isUrgent: true,
    createdAt: serverTimestamp(),
  });

  // 2. Initial Sample Case
  const casesRef = collection(db, 'cases');
  await addDoc(casesRef, {
    lawyerId: uid,
    caseNumber: "CRL.A./882/2026",
    clientName: "Vikramaditya Singhania",
    clientPhone: "+91 98110 44219",
    opponentName: "State (NCT of Delhi) & Anr.",
    court: "High Court",
    courtLocation: "Sher Shah Road, New Delhi",
    actSections: ["Section 302 IPC", "Section 34 IPC", "Section 25 Arms Act"],
    caseType: "Criminal Appeal",
    filingDate: "14 Nov 2025",
    nextHearingDate: "Today, 10:30 AM",
    status: "Active",
    unreadDocuments: 1,
    pendingChecklistItems: 2,
    totalBilled: 125000,
    totalCollected: 75000,
    createdAt: serverTimestamp(),
  });

  // 3. Initial Sample Invoice
  const invoicesRef = collection(db, 'invoices');
  await addDoc(invoicesRef, {
    lawyerId: uid,
    invoiceNumber: "INV-2026-089",
    caseNumber: "CRL.A./882/2026",
    clientName: "Vikramaditya Singhania",
    date: "14 Sep 2026",
    appearanceFee: 35000,
    draftingFee: 15000,
    clerkageAndMisc: 5000,
    totalAmount: 55000,
    status: "Pending",
    createdAt: serverTimestamp(),
  });

  // 4. Initial Sample Document
  const docsRef = collection(db, 'documents');
  await addDoc(docsRef, {
    lawyerId: uid,
    caseNumber: "CRL.A./882/2026",
    titleEn: "Certified Copy of Trial Court Judgment",
    titleHi: "निचली अदालत के फैसले की प्रमाणित प्रति",
    requiredFormat: "Certified Copy",
    status: "Verified",
    uploadedAt: "12 Sep 2026",
    fileSize: "8.4 MB",
    createdAt: serverTimestamp(),
  });
}

// ─── Identity Verification Requests (Admin pradhumb1998@gmail.com) ─────────

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
  const reqRef = await addDoc(collection(db, 'verification_requests'), {
    ...params,
    status: 'pending' as const,
    submittedAt: new Date().toISOString(),
    notifyAdminEmail: 'pradhumb1998@gmail.com',
    auditTrail: [
      {
        decision: 'pending',
        adminEmail: 'system',
        timestamp: new Date().toISOString(),
        reason: 'Initial verification submission by applicant',
      }
    ],
    createdAt: serverTimestamp(),
  });

  // Keep user profile in pending status with submitted document info
  await updateUserProfile(params.uid, {
    verificationStatus: 'pending',
    idDocumentType: params.documentType as any,
    idDocumentUrl: params.documentUrl || '',
    idDocumentNumberMasked: params.maskedIdNumber || '',
    barCouncilId: params.barCouncilId || '',
    education: params.education,
    city: params.city,
    rejectionReason: '',
  });

  // Also write an admin notification alert
  await addDoc(collection(db, 'notifications'), {
    recipientId: 'admin',
    type: 'verification',
    title: `New ${params.role === 'lawyer' ? 'Advocate' : 'Citizen'} Verification Request`,
    message: `${params.name} submitted ${params.documentType} (${params.maskedIdNumber || 'ID'}). Manual review queued for pradhumb1998@gmail.com`,
    senderName: params.name,
    read: false,
    createdAt: new Date().toISOString(),
    actionUrl: `/admin/verify/${reqRef.id}`,
    notifyAdminEmail: 'pradhumb1998@gmail.com',
  });

  return reqRef.id;
}

export async function processVerificationRequest(
  requestId: string,
  uidOrStatus: string,
  newStatusOrReason?: 'verified' | 'rejected' | 'resubmission_required' | string,
  reason?: string,
  adminEmail: string = 'pradhumb1998@gmail.com'
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
}) {
  const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  await addDoc(collection(db, `threads/${threadId}/messages`), {
    threadId,
    ...msg,
    timestamp,
    createdAt: serverTimestamp(),
  });

  await updateDoc(doc(db, 'threads', threadId), {
    lastMessage: msg.text.slice(0, 80),
    lastMessageAt: timestamp,
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
    notifyAdminEmail: 'pradhumb1998@gmail.com',
  });

  return threadId;
}

export function subscribeToUserNotifications(userId: string, callback: (notifs: AppNotification[]) => void) {
  const q = query(
    collection(db, 'notifications'),
    where('recipientId', 'in', [userId, 'admin'])
  );
  return onSnapshot(q, snap => {
    const list = snap.docs.map(d => ({
      id: d.id,
      ...d.data()
    } as AppNotification));
    list.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
    callback(list);
  }, err => {
    console.warn("Notifications subscription fallback:", err);
  });
}

export async function markNotificationRead(notifId: string) {
  await updateDoc(doc(db, 'notifications', notifId), {
    read: true,
  });
}
