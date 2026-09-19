export type Language = 'en' | 'hi';

export type UserRole = 'lawyer' | 'client';

export type CourtHierarchy = 'Supreme Court' | 'High Court' | 'Sessions Court' | 'District Court' | 'Consumer Forum' | 'NCLT';

export type CaseStage = 'Admission' | 'Notice/Summons' | 'Written Statement' | 'Framing of Issues' | 'Evidence' | 'Final Arguments' | 'Judgment/Order' | 'Execution';

export type VerificationStatus = 'not_submitted' | 'pending' | 'verified' | 'rejected' | 'resubmission_required';

export interface UserProfile {
  uid: string;
  role: 'lawyer' | 'client' | 'junior';
  name: string;
  phone: string;
  email?: string;
  photoURL?: string;
  state?: string;
  city?: string;
  createdAt?: any;
  onboardingCompleted?: boolean;
  // Verification
  verificationStatus: VerificationStatus;
  idDocumentType?: 'Aadhaar' | 'Voter ID' | 'Passport' | 'Driving License' | 'Bar Council Card';
  idDocumentUrl?: string;
  idDocumentNumberMasked?: string;
  rejectionReason?: string;
  verifiedAt?: string;
  verifiedBy?: string;
  // Lawyer specific
  barCouncilId?: string;
  aibeCertificateNo?: string;
  barAssociation?: string;
  practiceCourts?: string[];
  practiceAreas?: string[];
  experience?: number;
  education?: string[];
  languages?: string[];
  feeRange?: { min: number; max: number };
  rating?: number;
  totalCases?: number;
  bio?: string;
  publicCases?: PublicCourtCase[];
}

export interface PublicCourtCase {
  id: string;
  cnrNumber?: string;
  caseNumber: string;
  title: string;
  court: string;
  year: number;
  stage: string;
  judgmentOutcome?: string;
  showOnProfile: boolean;
  sourceType: 'ecourts_public' | 'self_reported' | 'high_court_repository';
  sourceCitation?: string;
  advocateNotes?: string;
  ecourtsUrl?: string;
  filingDate?: string;
  nextHearingDate?: string;
  benchJudge?: string;
  petitioner?: string;
  respondent?: string;
  petitionerAdvocate?: string;
  respondentAdvocate?: string;
}

export interface DirectMessage {
  id: string;
  threadId: string;
  senderId: string;
  senderName: string;
  senderRole: UserRole;
  text: string;
  timestamp: string;
  hasAttachment?: boolean;
  attachmentName?: string;
  attachmentUrl?: string;
}

export interface DirectThread {
  id: string;
  lawyerId: string;
  lawyerName: string;
  lawyerPhoto?: string;
  clientId: string;
  clientName: string;
  clientPhoto?: string;
  matterSubject: string;
  lastMessage: string;
  lastMessageAt: string;
  aiBriefAttached?: boolean;
  aiBriefText?: string;
  status: 'active' | 'archived';
}

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
  status: 'Active' | 'Disposed' | 'Stayed';
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
  requiredFormat: string;
  status: 'Verified' | 'Pending Review' | 'Missing' | 'Format_Issue' | 'Pending';
  uploadedAt?: string;
  fileSize?: string;
  validationNoteEn?: string;
  validationNoteHi?: string;
}

export interface AIIntakeBrief {
  id: string;
  clientName: string;
  clientPhone?: string;
  briefTitleEn: string;
  briefTitleHi: string;
  caseCategory?: string;
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

export interface VerificationRequest {
  id: string;
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
  status: VerificationStatus;
  submittedAt: string;
  notifyAdminEmail: string;
  rejectionReason?: string;
  verifiedBy?: string;
  verifiedAt?: string;
  auditTrail?: Array<{
    decision: VerificationStatus;
    adminEmail: string;
    timestamp: string;
    reason?: string;
  }>;
}

export interface AppNotification {
  id: string;
  recipientId: string;
  type: 'engagement' | 'verification' | 'chat' | 'system';
  title: string;
  message: string;
  senderName?: string;
  threadId?: string;
  read: boolean;
  createdAt: string;
  actionUrl?: string;
}
