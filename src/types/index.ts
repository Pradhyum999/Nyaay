export type Language = 'en' | 'hi';

export type UserRole = 'lawyer' | 'client';

export type CourtHierarchy = 'Supreme Court' | 'High Court' | 'Sessions Court' | 'District Court' | 'Consumer Forum' | 'NCLT';

export type CaseStage = 'Admission' | 'Notice/Summons' | 'Written Statement' | 'Framing of Issues' | 'Evidence' | 'Final Arguments' | 'Judgment/Order' | 'Execution';

export interface ClientUser {
  id: string;
  name: string;
  phone: string;
  activeCaseNumber: string;
  opponentName: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  isStreaming?: boolean;
  legalSections?: string[];
  // Legacy fields (kept for backward compat)
  sender?: 'user' | 'ai';
  textEn?: string;
  textHi?: string;
  suggestedActionEn?: string;
  suggestedActionHi?: string;
}

export interface LimitationAlert {
  id: string;
  caseNumber: string;
  titleEn: string;
  titleHi: string;
  statutoryAct: string;
  daysRemaining: number;
  deadlineDate: string;
  severity: 'critical' | 'warning' | 'normal';
  descriptionEn: string;
  descriptionHi: string;
}

export interface HearingItem {
  id: string;
  caseNumber: string;
  clientName: string;
  courtName: string;
  itemNumber: number;
  courtRoom: string;
  judgeName: string;
  stage: CaseStage;
  hearingDate: string;
  hearingTime: string;
  purposeEn: string;
  purposeHi: string;
  previousOrderSummaryEn?: string;
  previousOrderSummaryHi?: string;
  isUrgent?: boolean;
}

export interface CaseFile {
  id: string;
  caseNumber: string;
  clientName: string;
  clientPhone: string;
  opponentName: string;
  court: CourtHierarchy;
  courtLocation: string;
  actSections: string[];
  caseType: string;
  filingDate: string;
  nextHearingDate: string;
  status: 'Active' | 'Reserved' | 'Disposed';
  unreadDocuments: number;
  pendingChecklistItems: number;
  totalBilled: number;
  totalCollected: number;
}

export interface DocumentItem {
  id: string;
  caseNumber: string;
  titleEn: string;
  titleHi: string;
  requiredFormat: 'Certified Copy' | 'Original' | 'Self-Attested' | 'Affidavit' | 'Photocopy';
  status: 'Pending' | 'Uploaded' | 'Format_Issue' | 'Verified';
  uploadedAt?: string;
  validationNoteEn?: string;
  validationNoteHi?: string;
  fileSize?: string;
}

export interface AIIntakeBrief {
  id: string;
  clientName: string;
  caseCategory: string;
  briefTitleEn: string;
  briefTitleHi: string;
  summaryTextEn: string;
  summaryTextHi: string;
  extractedFactsEn: string[];
  extractedFactsHi: string[];
  applicableSections: string[];
  confidenceScore: number;
  intakeTimestamp: string;
  readinessScore: number;
  clientConsentGiven: boolean;
}

export interface InvoiceItem {
  id: string;
  invoiceNumber: string;
  caseNumber: string;
  clientName: string;
  date: string;
  appearanceFee: number;
  draftingFee: number;
  clerkageAndMisc: number;
  totalAmount: number;
  status: 'Paid' | 'Pending' | 'Overdue';
  paidVia?: 'UPI' | 'Bank Transfer' | 'Cash';
  upiRef?: string;
}

export interface ForumPost {
  id: string;
  authorName: string;
  authorBarCouncil: string;
  titleEn: string;
  titleHi: string;
  contentEn: string;
  contentHi: string;
  tags: string[];
  repliesCount: number;
  upvotes: number;
  timeAgoEn: string;
  timeAgoHi: string;
}

export interface JudicialAnalytic {
  id: string;
  judgeName: string;
  court: string;
  dispositionTrendEn: string;
  dispositionTrendHi: string;
  avgHearingIntervalDays: number;
  adjournmentFrequencyEn: string;
  adjournmentFrequencyHi: string;
  keyObservationEn: string;
  keyObservationHi: string;
}
