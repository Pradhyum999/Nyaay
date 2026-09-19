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

// ─── User Profiles ──────────────────────────────────────────────────────────

export interface UserProfile {
  uid: string;
  role: 'lawyer' | 'client' | 'junior';
  name: string;
  phone: string;
  email?: string;
  photoURL?: string;
  createdAt?: Timestamp;
  // Lawyer specific
  barCouncilId?: string;
  state?: string;
  practiceAreas?: string[];
  experience?: number;
  languages?: string[];
  feeRange?: { min: number; max: number };
  verificationStatus?: 'pending' | 'verified' | 'rejected';
  rating?: number;
  totalCases?: number;
  bio?: string;
}

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

export async function getLawyerDirectory(filters?: {
  practiceArea?: string;
  state?: string;
}): Promise<UserProfile[]> {
  let q = query(
    collection(db, 'users'),
    where('role', '==', 'lawyer'),
    where('verificationStatus', '==', 'verified'),
    orderBy('rating', 'desc')
  );
  const snap = await getDocs(q);
  return snap.docs.map(d => d.data() as UserProfile);
}

// ─── Cases ──────────────────────────────────────────────────────────────────

export interface Case {
  id?: string;
  caseNumber: string;
  title: string;
  court: string;
  stage: string;
  lawyerId: string;
  clientId: string;
  description?: string;
  filingDate?: string;
  nextHearingDate?: string;
  status: 'active' | 'closed' | 'pending';
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

export async function createCase(data: Omit<Case, 'id'>): Promise<string> {
  const ref = await addDoc(collection(db, 'cases'), {
    ...data,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return ref.id;
}

export async function getCasesByLawyer(lawyerId: string): Promise<Case[]> {
  const q = query(
    collection(db, 'cases'),
    where('lawyerId', '==', lawyerId),
    orderBy('updatedAt', 'desc')
  );
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() } as Case));
}

export async function getCasesByClient(clientId: string): Promise<Case[]> {
  const q = query(
    collection(db, 'cases'),
    where('clientId', '==', clientId),
    orderBy('updatedAt', 'desc')
  );
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() } as Case));
}

export async function updateCase(caseId: string, data: Partial<Case>) {
  await updateDoc(doc(db, 'cases', caseId), {
    ...data,
    updatedAt: serverTimestamp(),
  });
}

export function subscribeToCases(lawyerId: string, cb: (cases: Case[]) => void) {
  const q = query(
    collection(db, 'cases'),
    where('lawyerId', '==', lawyerId),
    orderBy('updatedAt', 'desc')
  );
  return onSnapshot(q, snap => {
    cb(snap.docs.map(d => ({ id: d.id, ...d.data() } as Case)));
  });
}

// ─── Hearings ───────────────────────────────────────────────────────────────

export interface Hearing {
  id?: string;
  caseId: string;
  lawyerId: string;
  clientId: string;
  caseNumber: string;
  caseTitle: string;
  court: string;
  hearingDate: string; // ISO string
  time?: string;
  purpose?: string;
  orderNotes?: string;
  nextHearingDate?: string;
  status: 'upcoming' | 'completed' | 'adjourned';
  createdAt?: Timestamp;
}

export async function addHearing(data: Omit<Hearing, 'id'>): Promise<string> {
  const ref = await addDoc(collection(db, 'hearings'), {
    ...data,
    createdAt: serverTimestamp(),
  });
  return ref.id;
}

export async function getHearingsByLawyer(lawyerId: string): Promise<Hearing[]> {
  const q = query(
    collection(db, 'hearings'),
    where('lawyerId', '==', lawyerId),
    orderBy('hearingDate', 'asc')
  );
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() } as Hearing));
}

export async function updateHearing(hearingId: string, data: Partial<Hearing>) {
  await updateDoc(doc(db, 'hearings', hearingId), data);
}

export function subscribeToHearings(lawyerId: string, cb: (hearings: Hearing[]) => void) {
  const q = query(
    collection(db, 'hearings'),
    where('lawyerId', '==', lawyerId),
    orderBy('hearingDate', 'asc')
  );
  return onSnapshot(q, snap => {
    cb(snap.docs.map(d => ({ id: d.id, ...d.data() } as Hearing)));
  });
}

// ─── Invoices ───────────────────────────────────────────────────────────────

export interface InvoiceItem {
  description: string;
  amount: number;
}

export interface Invoice {
  id?: string;
  lawyerId: string;
  clientId: string;
  caseId: string;
  caseNumber: string;
  clientName: string;
  items: InvoiceItem[];
  totalAmount: number;
  status: 'pending' | 'paid' | 'overdue';
  dueDate: string;
  createdAt?: Timestamp;
  paidAt?: Timestamp;
}

export async function createInvoice(data: Omit<Invoice, 'id'>): Promise<string> {
  const ref = await addDoc(collection(db, 'invoices'), {
    ...data,
    createdAt: serverTimestamp(),
  });
  return ref.id;
}

export async function getInvoicesByLawyer(lawyerId: string): Promise<Invoice[]> {
  const q = query(
    collection(db, 'invoices'),
    where('lawyerId', '==', lawyerId),
    orderBy('createdAt', 'desc')
  );
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() } as Invoice));
}

export async function getInvoicesByClient(clientId: string): Promise<Invoice[]> {
  const q = query(
    collection(db, 'invoices'),
    where('clientId', '==', clientId),
    orderBy('createdAt', 'desc')
  );
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() } as Invoice));
}

export async function markInvoicePaid(invoiceId: string) {
  await updateDoc(doc(db, 'invoices', invoiceId), {
    status: 'paid',
    paidAt: serverTimestamp(),
  });
}

// ─── Messages ────────────────────────────────────────────────────────────────

export interface Message {
  id?: string;
  senderId: string;
  senderName: string;
  senderRole: 'lawyer' | 'client' | 'junior';
  text: string;
  timestamp?: Timestamp;
  read?: boolean;
}

export interface MessageThread {
  id?: string;
  participants: string[]; // [lawyerId, clientId]
  caseId?: string;
  caseNumber?: string;
  lastMessage?: string;
  lastMessageAt?: Timestamp;
  createdAt?: Timestamp;
}

export async function getOrCreateThread(lawyerId: string, clientId: string, caseId?: string): Promise<string> {
  // Check if thread exists
  const q = query(
    collection(db, 'threads'),
    where('participants', 'array-contains', lawyerId)
  );
  const snap = await getDocs(q);
  const existing = snap.docs.find(d => {
    const data = d.data() as MessageThread;
    return data.participants.includes(clientId);
  });
  
  if (existing) return existing.id;

  const ref = await addDoc(collection(db, 'threads'), {
    participants: [lawyerId, clientId],
    caseId: caseId || null,
    createdAt: serverTimestamp(),
    lastMessageAt: serverTimestamp(),
  });
  return ref.id;
}

export async function sendMessage(threadId: string, message: Omit<Message, 'id'>) {
  await addDoc(collection(db, `threads/${threadId}/messages`), {
    ...message,
    timestamp: serverTimestamp(),
    read: false,
  });
  await updateDoc(doc(db, 'threads', threadId), {
    lastMessage: message.text,
    lastMessageAt: serverTimestamp(),
  });
}

export function subscribeToMessages(threadId: string, cb: (messages: Message[]) => void) {
  const q = query(
    collection(db, `threads/${threadId}/messages`),
    orderBy('timestamp', 'asc')
  );
  return onSnapshot(q, snap => {
    cb(snap.docs.map(d => ({ id: d.id, ...d.data() } as Message)));
  });
}

// ─── Forum Posts ─────────────────────────────────────────────────────────────

export interface ForumPost {
  id?: string;
  authorId: string;
  authorName: string;
  title: string;
  content: string;
  tags: string[];
  upvotes: number;
  upvotedBy: string[];
  replyCount: number;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

export interface ForumReply {
  id?: string;
  authorId: string;
  authorName: string;
  content: string;
  upvotes: number;
  createdAt?: Timestamp;
}

export async function createForumPost(data: Omit<ForumPost, 'id' | 'upvotes' | 'upvotedBy' | 'replyCount'>): Promise<string> {
  const ref = await addDoc(collection(db, 'forum'), {
    ...data,
    upvotes: 0,
    upvotedBy: [],
    replyCount: 0,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return ref.id;
}

export async function getForumPosts(): Promise<ForumPost[]> {
  const q = query(collection(db, 'forum'), orderBy('createdAt', 'desc'));
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() } as ForumPost));
}

export async function upvotePost(postId: string, userId: string) {
  const postRef = doc(db, 'forum', postId);
  const post = (await getDoc(postRef)).data() as ForumPost;
  const alreadyUpvoted = post.upvotedBy?.includes(userId);
  await updateDoc(postRef, {
    upvotes: alreadyUpvoted ? post.upvotes - 1 : post.upvotes + 1,
    upvotedBy: alreadyUpvoted
      ? post.upvotedBy.filter(id => id !== userId)
      : [...(post.upvotedBy || []), userId],
  });
}

export async function addForumReply(postId: string, reply: Omit<ForumReply, 'id' | 'upvotes'>) {
  await addDoc(collection(db, `forum/${postId}/replies`), {
    ...reply,
    upvotes: 0,
    createdAt: serverTimestamp(),
  });
  await updateDoc(doc(db, 'forum', postId), {
    replyCount: (await getDoc(doc(db, 'forum', postId))).data()?.replyCount + 1 || 1,
  });
}

// ─── AI Session Briefs ───────────────────────────────────────────────────────

export interface AIBrief {
  id?: string;
  clientId: string;
  clientName: string;
  lawyerId?: string;
  chatHistory: Array<{ role: string; content: string }>;
  briefText: string;
  consentGiven: boolean;
  sharedWithLawyer: boolean;
  practiceArea?: string;
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

export async function getAIBriefsByLawyer(lawyerId: string): Promise<AIBrief[]> {
  const q = query(
    collection(db, 'ai_briefs'),
    where('lawyerId', '==', lawyerId),
    where('sharedWithLawyer', '==', true),
    orderBy('createdAt', 'desc')
  );
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() } as AIBrief));
}

// ─── Documents ──────────────────────────────────────────────────────────────

export interface DocumentItem {
  id?: string;
  caseId: string;
  lawyerId: string;
  clientId: string;
  name: string;
  type: string; // 'pdf', 'image', etc.
  url?: string;
  uploadedBy: 'lawyer' | 'client';
  verified: boolean;
  required: boolean;
  uploadedAt?: Timestamp;
}

export async function addDocument(data: Omit<DocumentItem, 'id'>): Promise<string> {
  const ref = await addDoc(collection(db, 'documents'), {
    ...data,
    uploadedAt: serverTimestamp(),
  });
  return ref.id;
}

export async function getDocumentsByCase(caseId: string): Promise<DocumentItem[]> {
  const q = query(collection(db, 'documents'), where('caseId', '==', caseId));
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() } as DocumentItem));
}

// ─── Tasks (Junior Advocate) ─────────────────────────────────────────────────

export interface Task {
  id?: string;
  caseId: string;
  assignedBy: string; // senior lawyerId
  assignedTo: string; // junior lawyerId
  description: string;
  dueDate: string;
  status: 'pending' | 'in_progress' | 'completed' | 'review';
  priority: 'low' | 'medium' | 'high';
  notes?: string;
  createdAt?: Timestamp;
  completedAt?: Timestamp;
}

export async function createTask(data: Omit<Task, 'id'>): Promise<string> {
  const ref = await addDoc(collection(db, 'tasks'), {
    ...data,
    createdAt: serverTimestamp(),
  });
  return ref.id;
}

export async function getTasksByAssignee(juniorId: string): Promise<Task[]> {
  const q = query(
    collection(db, 'tasks'),
    where('assignedTo', '==', juniorId),
    orderBy('dueDate', 'asc')
  );
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() } as Task));
}

export async function updateTask(taskId: string, data: Partial<Task>) {
  await updateDoc(doc(db, 'tasks', taskId), {
    ...data,
    ...(data.status === 'completed' ? { completedAt: serverTimestamp() } : {}),
  });
}

