export type Language = 'en' | 'hi' | 'mr';
export type ThemeMode = 'dark' | 'light';

export type UserRole = 'lawyer' | 'client';
export type ExtendedRole = 'lawyer' | 'client' | 'junior' | 'firm_admin' | 'student';

export type CourtHierarchy = 'Supreme Court' | 'High Court' | 'Sessions Court' | 'District Court' | 'Consumer Forum' | 'NCLT';

export type CaseStage = 'Admission' | 'Notice/Summons' | 'Written Statement' | 'Framing of Issues' | 'Evidence' | 'Final Arguments' | 'Judgment/Order' | 'Execution';

export type VerificationStatus = 'not_submitted' | 'pending' | 'verified' | 'rejected' | 'resubmission_required';

export interface UserProfile {
  uid: string;
  role: ExtendedRole;
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
  firmId?: string;
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
  attachmentType?: 'image' | 'file';
  attachmentSize?: string;
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
  lastMessageSenderId?: string;
  hasAttachment?: boolean;
  attachmentType?: 'image' | 'file';
  aiBriefAttached?: boolean;
  aiBriefText?: string;
  status: 'active' | 'archived';
  unreadCount?: number;
  caseNumber?: string;
  courtName?: string;
  nextHearingDate?: string;
  source?: 'direct' | 'diary';
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
  caseId?: string;
  caseNumber: string;
  clientName: string;
  clientId?: string;
  lawyerId?: string;
  courtName: string;
  itemNumber?: number;
  courtRoom?: string;
  judgeName?: string;
  stage: CaseStage;
  hearingDate: string;
  hearingTime?: string;
  purposeEn: string;
  purposeHi: string;
  previousOrderSummaryEn?: string;
  previousOrderSummaryHi?: string;
  isUrgent?: boolean;
}

// ── Case Room: Structured Case Profile (AI intake output) ────────────────────
export interface CaseProfile {
  matterType: string;              // e.g. "Rental deposit dispute"
  legalArea: string;               // e.g. "Landlord–tenant / civil dispute"
  location: string;                // city / jurisdiction
  facts: string[];                 // key facts extracted from intake
  missingInfo: string[];           // questions still unanswered
  documentsAvailable: string[];    // docs the client already has
  documentsRequired: string[];     // docs needed for the matter
  urgency: 'low' | 'medium' | 'high';
  confidenceScore: number;         // 0-100 AI confidence in classification
  summaryText: string;             // human-readable AI summary
  generatedAt: string;
}

// ── Case Room: Timeline event log ────────────────────────────────────────────
export type CaseTimelineEventType =
  | 'intake'
  | 'notice'
  | 'reply'
  | 'filing'
  | 'hearing'
  | 'order'
  | 'document'
  | 'task'
  | 'payment'
  | 'note'
  | 'status';

export interface CaseTimelineEvent {
  id: string;
  caseId: string;
  type: CaseTimelineEventType;
  titleEn: string;
  titleHi: string;
  descriptionEn?: string;
  descriptionHi?: string;
  eventDate: string;               // ISO or display date
  actorId?: string;
  actorName?: string;
  actorRole?: 'lawyer' | 'client' | 'system';
  createdAt?: any;
}

// ── Case Room: Tasks / action items ──────────────────────────────────────────
export interface CaseTask {
  id: string;
  caseId: string;
  titleEn: string;
  titleHi: string;
  assignedTo: 'lawyer' | 'client';
  assignedToId?: string;
  status: 'pending' | 'in_progress' | 'done';
  dueDate?: string;
  createdBy?: string;
  createdAt?: any;
  completedAt?: string;
}

// ── Case Room: Lawyer notes ──────────────────────────────────────────────────
export interface CaseNote {
  id: string;
  caseId: string;
  authorId: string;
  authorName: string;
  authorRole: 'lawyer' | 'client';
  text: string;
  createdAt?: any;
}

export interface CaseFile {
  id: string;
  caseNumber: string;
  clientName: string;
  clientPhone: string;
  clientId?: string;
  lawyerId?: string;
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
  // Case Room additions
  profile?: CaseProfile;
  lawyerName?: string;
  stage?: CaseStage;
  orderNotes?: string;
  limitationDate?: string;
  timeline?: CaseTimelineEvent[];
  createdAt?: any;
  updatedAt?: any;
}

export interface AIInquiryBrief {
  id: string;
  clientId: string;
  clientName: string;
  clientPhone?: string;
  lawyerId?: string;          // set when client messaged a specific advocate; null = unassigned pool
  profile: CaseProfile;       // the AI intake output
  preparedPacket: string;     // from renderPreparedClientPacket
  status: 'new' | 'accepted' | 'declined';
  createdAt: string;
}

export interface DocumentItem {
  id: string;
  caseId?: string;
  caseNumber: string;
  clientId?: string;
  lawyerId?: string;
  titleEn?: string;
  titleHi?: string;
  title?: string;
  name?: string;
  requiredFormat?: string;
  status: 'Verified' | 'Pending Review' | 'Missing' | 'Format_Issue' | 'Pending' | string;
  uploadedAt?: string;
  fileSize?: string;
  size?: string;
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
  caseId?: string;
  invoiceNumber: string;
  caseNumber: string;
  clientName: string;
  clientId?: string;
  lawyerId?: string;
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
  type: 'engagement' | 'verification' | 'chat' | 'system' | 'case_transfer' | 'limitation';
  title: string;
  message: string;
  senderName?: string;
  threadId?: string;
  read: boolean;
  createdAt: string;
  actionUrl?: string;
}

export interface FirmProfile {
  id: string;
  firmName: string;
  institutionType: 'firm' | 'college' | 'school';
  firmRegistrationId: string;
  gstPan?: string;
  address: string;
  adminEmail: string;
  adminUid: string;
  memberCount: number;
  createdAt?: any;
}

export interface FirmMember {
  id: string;
  firmId: string;
  name: string;
  email: string;
  role: 'associate' | 'junior' | 'paralegal' | 'student';
  tempPassword?: string;
  mustChangePassword: boolean;
  joinedAt?: any;
  uid?: string;
}

export interface CitizenFeedback {
  id: string;
  userId: string;
  userName: string;
  userRole: UserRole;
  rating: number;
  feedbackText: string;
  voiceAudioUrl?: string;
  createdAt: any;
}
