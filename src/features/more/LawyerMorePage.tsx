import React, { useState, useEffect, useRef } from 'react';
import { Card } from '../../design/ui/Card';
import { Button } from '../../design/ui/Button';
import { AppNotification, Language, ThemeMode, UserProfile } from '../../types';
import {
  Scale,
  Award,
  Users,
  Share2,
  Video,
  Search,
  Building2,
  Shield,
  Settings as SettingsIcon,
  Sparkles,
  CheckCircle2,
  MapPin,
  Briefcase,
  ExternalLink,
  ChevronRight,
  MessageSquare,
  Globe,
  Sun,
  Moon,
  LogOut,
  Trash2,
  Check,
  X,
  FileText,
  Phone,
  Clock,
  ThumbsUp,
  Send,
  VideoOff,
  Mic,
  MicOff,
  Copy,
  AlertTriangle,
  HelpCircle,
  Printer,
  Upload,
  Plus,
  FilePlus,
  Eye,
  BookOpen,
} from 'lucide-react';
import { CallModal } from '../../components/chat/CallModal';
import { LegalTemplatesModal } from '../templates/LegalTemplatesModal';
import {
  getAllTemplates,
  getCustomTemplates,
  saveCustomTemplate,
  deleteCustomTemplate,
  LegalTemplate,
} from '../../config/legalTemplates';
import { CaseFile } from '../../types';

export interface LawyerMorePageProps {
  userProfile?: UserProfile;
  language: Language;
  onOpenProfile?: () => void;
  onOpenFirmPortal?: () => void;
  onOpenAdminDashboard?: () => void;
  onOpenFeedback?: () => void;
  onSelectLanguage?: (lang: Language) => void;
  theme?: ThemeMode;
  onToggleTheme?: () => void;
  onSignOut?: () => void;
  deleteAccount?: () => Promise<void> | void;
  cases?: CaseFile[];
}

// ─────────────────────────────────────────────────────────────
// Skill Assessment Questions (Real Indian Law MCQs)
// ─────────────────────────────────────────────────────────────
interface AssessmentQuestion {
  id: number;
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
  actRef: string;
}

const ASSESSMENT_QUESTIONS: AssessmentQuestion[] = [
  {
    id: 1,
    question: 'Under Bharatiya Nagarik Suraksha Sanhita (BNSS), 2023, Section 187, during what period can police custody be authorized by a Magistrate?',
    options: [
      'Strictly within the first 15 days of detention exclusively',
      'In whole or in parts during the initial 40 or 60 days of the total detention period',
      'At any time before the trial court frames formal charges',
      'Only during the initial 7 days with prior High Court permission',
    ],
    correctIndex: 1,
    explanation:
      'BNSS Section 187(3) allows police custody of up to 15 days to be granted in whole or in parts during the first 40 or 60 days (depending on whether the offence is punishable with 10+ years/life/death), departing from the rigid first-15-days CrPC rule.',
    actRef: 'BNSS 2023, Section 187(3)',
  },
  {
    id: 2,
    question: 'What are the three indispensable judicial tests for granting temporary injunction under Order 39 Rules 1 & 2 of the Code of Civil Procedure, 1908?',
    options: [
      'Prima facie case, Balance of convenience, and Irreparable injury',
      'Cause of action, Limitation compliance, and Pecuniary jurisdiction',
      'Caveat lodgement, Court fee valuation, and Affidavit verification',
      'Doctrine of Lis pendens, Res Judicata, and Restitution',
    ],
    correctIndex: 0,
    explanation:
      'The Supreme Court in Dalpat Kumar v. Prahlad Singh reaffirmed that the grant of interlocutory injunction mandates concurrent satisfaction of: (1) prima facie case, (2) balance of convenience, and (3) irreparable injury.',
    actRef: 'CPC 1908, Order 39 Rules 1 & 2',
  },
  {
    id: 3,
    question: 'How does the High Court writ jurisdiction under Article 226 of the Constitution of India compare with Supreme Court jurisdiction under Article 32?',
    options: [
      'High Court writs apply exclusively to inter-state civil property disputes',
      'Article 226 is wider because it can be invoked for Fundamental Rights and "for any other purpose"',
      'Article 32 cannot issue Habeas Corpus or Quo Warranto',
      'Article 226 is purely advisory and non-binding on executive authorities',
    ],
    correctIndex: 1,
    explanation:
      'Article 226 confers a broader canvas than Article 32: whereas Article 32 is restricted to enforcement of Part III Fundamental Rights, Article 226 High Court jurisdiction extends to Fundamental Rights as well as "for any other purpose" (legal rights).',
    actRef: 'Constitution of India, Article 226 vs Article 32',
  },
  {
    id: 4,
    question: 'Under Section 61 of the Bharatiya Sakshya Adhiniyam (BSA), 2023, what is the statutory status of electronic and digital records?',
    options: [
      'Inadmissible in evidence unless validated by oral witness corroboration',
      'Recognized as documentary evidence with the same legal effect, validity, and enforceability as paper records',
      'Admissible exclusively in cyber terrorism cases investigated by central agencies',
      'Classified strictly as secondary hearsay evidence requiring court certification',
    ],
    correctIndex: 1,
    explanation:
      'BSA Section 61 explicitly provides that electronic or digital records shall have the same legal effect, validity, and enforceability as paper records, establishing digital parity in Indian trials.',
    actRef: 'BSA 2023, Section 61',
  },
  {
    id: 5,
    question: 'Under Section 138 proviso (b) of the Negotiable Instruments Act, 1881, within how many days must statutory demand notice be sent after receipt of dishonour memo?',
    options: [
      '15 days of receiving the cheque return memo',
      '30 days of receipt of information from the bank regarding dishonour',
      '45 days from the date the cheque was drawn',
      '60 days with leave of the Judicial Magistrate',
    ],
    correctIndex: 1,
    explanation:
      'Proviso (b) to Section 138 of the NI Act specifies that the payee or holder in due course must make a demand in writing within 30 days of the receipt of information from the bank regarding the dishonour of the cheque.',
    actRef: 'NI Act 1881, Section 138 Proviso (b)',
  },
];

// ─────────────────────────────────────────────────────────────
// Initial Discussion Forum Data
// ─────────────────────────────────────────────────────────────
interface ForumThread {
  id: string;
  title: string;
  category: 'BNS/BNSS' | 'Civil & CPC' | 'High Court' | 'Commercial' | 'General';
  author: string;
  barCouncil: string;
  court: string;
  body: string;
  timestamp: string;
  upvotes: number;
  replies: {
    id: string;
    author: string;
    text: string;
    timestamp: string;
  }[];
}

const INITIAL_THREADS: ForumThread[] = [
  {
    id: 'th-1',
    title: 'Interplay of BNSS Section 479 (Undertrial maximum detention) with pending CrPC cases',
    category: 'BNS/BNSS',
    author: 'Adv. Sneha Kulkarni',
    barCouncil: 'MAH/4211/2014',
    court: 'Bombay High Court',
    body: 'Colleagues, can undertrials booked under the erstwhile CrPC 1973 claim the relaxed one-third detention threshold for first-time offenders under BNSS Section 479 retrospectively? Seeking citations from Supreme Court recent orders.',
    timestamp: '2 hours ago',
    upvotes: 14,
    replies: [
      {
        id: 'rep-1',
        author: 'Adv. Rajesh Sharma',
        text: 'Yes! The Supreme Court in In Re: Policy Strategy for Grant of Bail held Section 479 BNSS applies beneficially to all undertrials regardless of when the FIR was registered.',
        timestamp: '1 hour ago',
      },
    ],
  },
  {
    id: 'th-2',
    title: 'Interim stay on arbitral awards under Section 36(2) post-2015 amendment',
    category: 'Commercial',
    author: 'Adv. Amit Verma',
    barCouncil: 'D/1892/2011',
    court: 'Delhi High Court',
    body: 'Does unconditional stay require clear prima facie evidence of fraud or corruption under Section 36(3) proviso? What is the current judicial posture before the Commercial Division?',
    timestamp: 'Yesterday',
    upvotes: 9,
    replies: [
      {
        id: 'rep-2',
        author: 'Adv. Rohan Mehta',
        text: 'The proviso to Sec 36(3) is mandatory only where court is satisfied prima facie that arbitration agreement or award was induced by fraud or corruption. Otherwise, usual Order 41 Rule 5 CPC principles govern deposit.',
        timestamp: '18 hours ago',
      },
    ],
  },
  {
    id: 'th-3',
    title: 'Mandatory nature of pre-institution mediation under Section 12A Commercial Courts Act',
    category: 'Civil & CPC',
    author: 'Adv. Pradeep Nair',
    barCouncil: 'KAR/3012/2016',
    court: 'Karnataka High Court',
    body: 'In Patil Automation (2022) 10 SCC 1, the Supreme Court declared Sec 12A mandatory. How are courts interpreting "urgent interim relief" exception in IP trademark suits?',
    timestamp: '2 days ago',
    upvotes: 19,
    replies: [
      {
        id: 'rep-3',
        author: 'Adv. Deepa Rao',
        text: 'Courts assess whether the prayer for urgent interim relief is bona fide or a clever device to bypass mediation. Look at Yamini Manohar v. T.K.D. Keerthi (2023).',
        timestamp: '1 day ago',
      },
    ],
  },
];

// ─────────────────────────────────────────────────────────────
// Peer Referral Type
// ─────────────────────────────────────────────────────────────
interface OutgoingReferral {
  id: string;
  clientName: string;
  clientPhone: string;
  targetCourt: string;
  practiceArea: string;
  briefSummary: string;
  referralTerms: string;
  status: 'Dispatched' | 'Acknowledged' | 'Consultation Scheduled';
  date: string;
}

export const LawyerMorePage: React.FC<LawyerMorePageProps> = ({
  userProfile,
  language = 'en',
  onOpenProfile,
  onOpenFirmPortal,
  onOpenAdminDashboard,
  onOpenFeedback,
  onSelectLanguage,
  theme,
  onToggleTheme,
  onSignOut,
  deleteAccount,
  cases = [],
}) => {
  // Navigation / active section inside "More"
  const [activeSection, setActiveSection] = useState<
    'hub' | 'assessment' | 'forum' | 'referral' | 'video' | 'portfolio' | 'settings' | 'templates'
  >('hub');

  // Templates Management State
  const [allTemplates, setAllTemplates] = useState<LegalTemplate[]>([]);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [newTemplateTitle, setNewTemplateTitle] = useState('');
  const [newTemplateCategory, setNewTemplateCategory] = useState<LegalTemplate['category']>('Notice');
  const [newTemplateStatutoryRef, setNewTemplateStatutoryRef] = useState('');
  const [newTemplateCourt, setNewTemplateCourt] = useState<LegalTemplate['courtHierarchy']>('District Court / Tribunal');
  const [newTemplateContent, setNewTemplateContent] = useState('');
  const [templateSearchTerm, setTemplateSearchTerm] = useState('');
  const [templateCategoryFilter, setTemplateCategoryFilter] = useState('All');
  const [draftingModalTemplate, setDraftingModalTemplate] = useState<LegalTemplate | null>(null);
  const [isDraftingModalOpen, setIsDraftingModalOpen] = useState(false);
  const [templateToast, setTemplateToast] = useState<string | null>(null);

  const refreshTemplates = () => {
    setAllTemplates(getAllTemplates());
  };

  useEffect(() => {
    refreshTemplates();
  }, []);

  // Translations helper
  const t = (en: string, hi: string, mr: string) => {
    if (language === 'mr') return mr;
    if (language === 'hi') return hi;
    return en;
  };

  const lawyerName = userProfile?.name || 'Adv. Rajesh Sharma';
  const barId = userProfile?.barCouncilId || 'BCI/D/1942/2012';
  const experienceYears = (userProfile as any)?.experienceYears || '14';
  const city = (userProfile as any)?.city || 'New Delhi, India';

  // ───────────────────────────────────────────────────────────
  // 1. Skill Assessment State
  // ───────────────────────────────────────────────────────────
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, number>>({});
  const [isAssessmentSubmitted, setIsAssessmentSubmitted] = useState(false);
  const [assessmentScore, setAssessmentScore] = useState(0);

  const handleSelectOption = (questionId: number, optionIndex: number) => {
    if (isAssessmentSubmitted) return;
    setSelectedAnswers(prev => ({ ...prev, [questionId]: optionIndex }));
  };

  const handleSubmitAssessment = () => {
    let score = 0;
    ASSESSMENT_QUESTIONS.forEach(q => {
      if (selectedAnswers[q.id] === q.correctIndex) {
        score++;
      }
    });
    setAssessmentScore(score);
    setIsAssessmentSubmitted(true);
  };

  const handleResetAssessment = () => {
    setSelectedAnswers({});
    setIsAssessmentSubmitted(false);
    setAssessmentScore(0);
  };

  // ───────────────────────────────────────────────────────────
  // 2. Discussion Forum State (Persisted in localStorage)
  // ───────────────────────────────────────────────────────────
  const [threads, setThreads] = useState<ForumThread[]>(() => {
    try {
      const saved = localStorage.getItem('nyaay_forum_threads');
      if (saved) return JSON.parse(saved);
    } catch {}
    return INITIAL_THREADS;
  });

  const [forumCategory, setForumCategory] = useState<string>('All');
  const [forumSearch, setForumSearch] = useState('');
  const [showNewThreadModal, setShowNewThreadModal] = useState(false);
  const [newThreadTitle, setNewThreadTitle] = useState('');
  const [newThreadCategory, setNewThreadCategory] = useState<ForumThread['category']>('BNS/BNSS');
  const [newThreadBody, setNewThreadBody] = useState('');
  const [expandedThreadId, setExpandedThreadId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');

  useEffect(() => {
    try {
      localStorage.setItem('nyaay_forum_threads', JSON.stringify(threads));
    } catch {}
  }, [threads]);

  const handleCreateThread = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newThreadTitle.trim() || !newThreadBody.trim()) return;

    const created: ForumThread = {
      id: `th-${Date.now()}`,
      title: newThreadTitle.trim(),
      category: newThreadCategory,
      author: lawyerName,
      barCouncil: barId,
      court: 'High Court',
      body: newThreadBody.trim(),
      timestamp: 'Just now',
      upvotes: 1,
      replies: [],
    };

    setThreads([created, ...threads]);
    setNewThreadTitle('');
    setNewThreadBody('');
    setShowNewThreadModal(false);
    setExpandedThreadId(created.id);
  };

  const handleAddReply = (threadId: string) => {
    if (!replyText.trim()) return;
    const newReply = {
      id: `rep-${Date.now()}`,
      author: lawyerName,
      text: replyText.trim(),
      timestamp: 'Just now',
    };

    setThreads(prev =>
      prev.map(t =>
        t.id === threadId ? { ...t, replies: [...t.replies, newReply] } : t
      )
    );
    setReplyText('');
  };

  const handleUpvote = (threadId: string) => {
    setThreads(prev =>
      prev.map(t => (t.id === threadId ? { ...t, upvotes: t.upvotes + 1 } : t))
    );
  };

  // ───────────────────────────────────────────────────────────
  // 3. Peer Referral State
  // ───────────────────────────────────────────────────────────
  const [referrals, setReferrals] = useState<OutgoingReferral[]>(() => {
    try {
      const saved = localStorage.getItem('nyaay_peer_referrals');
      if (saved) return JSON.parse(saved);
    } catch {}
    return [
      {
        id: 'REF-2026-8812',
        clientName: 'Sunil R. Deshmukh',
        clientPhone: '+91 98201 44521',
        targetCourt: 'Bombay High Court (Appellate Side)',
        practiceArea: 'Commercial & Property',
        briefSummary: 'Commercial Summary Suit under Order 37 CPC seeking recovery of ₹45,00,000 for construction supplies.',
        referralTerms: 'Standard 10% Brief Sharing',
        status: 'Acknowledged',
        date: '2026-10-01',
      },
    ];
  });

  const [refClientName, setRefClientName] = useState('');
  const [refClientPhone, setRefClientPhone] = useState('');
  const [refTargetCourt, setRefTargetCourt] = useState('Bombay High Court');
  const [refPracticeArea, setRefPracticeArea] = useState('Criminal Law (BNS/BNSS)');
  const [refSummary, setRefSummary] = useState('');
  const [refTerms, setRefTerms] = useState('Standard 10% Brief Fee Sharing');
  const [lastDispatchedRef, setLastDispatchedRef] = useState<OutgoingReferral | null>(null);
  const [copiedRef, setCopiedRef] = useState(false);

  useEffect(() => {
    try {
      localStorage.setItem('nyaay_peer_referrals', JSON.stringify(referrals));
    } catch {}
  }, [referrals]);

  const handleDispatchReferral = (e: React.FormEvent) => {
    e.preventDefault();
    if (!refClientName.trim() || !refSummary.trim()) return;

    const newRef: OutgoingReferral = {
      id: `REF-2026-${Math.floor(1000 + Math.random() * 9000)}`,
      clientName: refClientName.trim(),
      clientPhone: refClientPhone.trim() || '+91 Confidential',
      targetCourt: refTargetCourt,
      practiceArea: refPracticeArea,
      briefSummary: refSummary.trim(),
      referralTerms: refTerms,
      status: 'Dispatched',
      date: new Date().toISOString().split('T')[0],
    };

    setReferrals([newRef, ...referrals]);
    setLastDispatchedRef(newRef);
    setRefClientName('');
    setRefClientPhone('');
    setRefSummary('');
  };

  const handleCopyReferralSlip = (ref: OutgoingReferral) => {
    const text = `⚖️ NYAAYNEETI COUNSEL PEER REFERRAL BRIEF
Reference ID: ${ref.id}
Referring Advocate: ${lawyerName} (${barId})
Client: ${ref.clientName} (${ref.clientPhone})
Target Court: ${ref.targetCourt}
Practice Domain: ${ref.practiceArea}
Matter Brief: ${ref.briefSummary}
Terms: ${ref.referralTerms}
Dispatched: ${ref.date}
Confidential Counsel-to-Counsel Brief.`;
    navigator.clipboard.writeText(text);
    setCopiedRef(true);
    setTimeout(() => setCopiedRef(false), 2500);
  };

  // ───────────────────────────────────────────────────────────
  // 4. Video Conferencing State
  // ───────────────────────────────────────────────────────────
  const [isVideoModalOpen, setIsVideoModalOpen] = useState(false);
  const [roomCode, setRoomCode] = useState('NYAAY-ROOM-7492');
  const [camActive, setCamActive] = useState(true);
  const [micActive, setMicActive] = useState(true);
  const [copiedRoomLink, setCopiedRoomLink] = useState(false);

  const handleCopyRoomLink = () => {
    const url = `https://nyaay.app/consult/${roomCode}`;
    navigator.clipboard.writeText(url);
    setCopiedRoomLink(true);
    setTimeout(() => setCopiedRoomLink(false), 2500);
  };

  // ───────────────────────────────────────────────────────────
  // 5. Delete Account Confirmation Modal State
  // ───────────────────────────────────────────────────────────
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleConfirmDeleteAccount = async () => {
    if (!deleteAccount) return;
    setIsDeleting(true);
    try {
      await deleteAccount();
    } catch (e) {
      console.error('Delete account error:', e);
      setIsDeleting(false);
      setShowDeleteModal(false);
    }
  };

  return (
    <div className="flex flex-col gap-5 p-4 sm:p-6 pb-36 text-main max-w-4xl mx-auto w-full">
      {/* ── Sub-Navigation Pill Header (When in sub-modules) ── */}
      {activeSection !== 'hub' && (
        <div className="flex items-center justify-between gap-2 pb-2 border-b border-white/[0.08]">
          <button
            type="button"
            onClick={() => setActiveSection('hub')}
            className="flex items-center gap-1.5 text-xs text-amber-300 font-semibold hover:underline"
          >
            ← {t('Back to More Hub', 'वापस अधिक केंद्र', 'अधिक हब कडे मागे')}
          </button>
          <span className="text-[11px] font-mono text-neutral-400 uppercase tracking-wider">
            {activeSection === 'assessment' && t('Skill Assessment', 'कौशल्य मूल्यांकन', 'कौशल्य चाचणी')}
            {activeSection === 'forum' && t('Discussion Forum', 'चर्चा मंच', 'चर्चा मंच')}
            {activeSection === 'referral' && t('Peer Referral', 'सहयोगी रेफरल', 'सहकारी रेफरल')}
            {activeSection === 'video' && t('Video Conferencing', 'व्हिडिओ कॉन्फरन्स', 'व्हिडिओ कॉन्फरन्स')}
            {activeSection === 'portfolio' && t('Chambers Portfolio', 'डिजिटल चेंबर्स', 'डिजिटल चेंबर्स')}
            {activeSection === 'settings' && t('Settings & Account', 'सेटिंग्ज व खाते', 'सेटिंग्ज व खाते')}
            {activeSection === 'templates' && t('Legal Templates & Drafting', 'ड्राफ्टिंग टेम्प्लेट व अपलोड', 'मसुदा टेम्पलेट्स आणि अपलोड')}
          </span>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          MAIN CONTENT ROUTER BASED ON activeSection
         ───────────────────────────────────────────────────────────── */}

      {/* ── 1. HUB: The Command Center of "More" (Item 20 Grouping & Hierarchy) ── */}
      {activeSection === 'hub' && (
        <div className="space-y-6 animate-in fade-in">
          {/* Section 1: Professional Practice & Collaboration */}
          <div className="space-y-3">
            <div className="flex items-center justify-between px-1">
              <div>
                <h2 className="text-xs font-bold uppercase tracking-wider text-amber-500 dark:text-amber-400">
                  {t('Professional Practice & Chambers', 'पेशेवर वकालत एवं चैंबर्स', 'व्यावसायिक वकिली आणि चेंबर्स')}
                </h2>
                <p className="text-[11px] text-neutral-400 mt-0.5">
                  {t('Chambers portfolio, firm portal, peer referrals & video courtrooms', 'चैंबर प्रोफाइल, लॉ फर्म, रेफरल और वीडियो कॉन्फ्रेंस', 'चेंबर प्रोफाइल, लॉ फर्म, रेफरल आणि व्हिडिओ कक्ष')}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Digital Chambers Portfolio */}
              <Card
                onClick={() => setActiveSection('portfolio')}
                className="p-4 bg-white/[0.03] hover:bg-white/[0.07] border-white/[0.1] hover:border-amber-400/40 transition cursor-pointer flex items-center justify-between group"
              >
                <div className="flex items-center gap-3.5">
                  <div className="w-10 h-10 rounded-2xl bg-amber-500/15 border border-amber-500/30 text-amber-400 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                    <Building2 size={20} />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white group-hover:text-amber-300 transition-colors">
                      {t('Digital Chambers Portfolio', 'डिजिटल चैंबर पोर्टफोलियो', 'डिजिटल चेंबर पोर्टफोलिओ')}
                    </h3>
                    <p className="text-xs text-neutral-400">
                      {t('Courts of practice, bar enrolment, matters handled and chambers credentials', 'वकालत क्रेडेंशियल, बार नामांकन, न्यायालयीन अनुभव', 'वकिली प्रमाणपत्रे, बार नोंदणी, न्यायालयीन अनुभव')}
                    </p>
                  </div>
                </div>
                <ChevronRight size={18} className="text-neutral-500 group-hover:text-amber-300 group-hover:translate-x-0.5 transition" />
              </Card>

              {/* Firm & Chambers Portal */}
              <Card
                onClick={() => {
                  if (onOpenFirmPortal) {
                    onOpenFirmPortal();
                  } else {
                    setActiveSection('portfolio');
                  }
                }}
                className="p-4 bg-white/[0.03] hover:bg-white/[0.07] border-white/[0.1] hover:border-amber-400/40 transition cursor-pointer flex items-center justify-between group"
              >
                <div className="flex items-center gap-3.5">
                  <div className="w-10 h-10 rounded-2xl bg-violet-500/15 border border-violet-500/30 text-violet-400 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                    <Users size={20} />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white group-hover:text-amber-300 transition-colors">
                      {t('Chambers & Firm Portal', 'लॉ फर्म / चेंबर्स पोर्टल', 'लॉ फर्म / चेंबर्स पोर्टल')}
                    </h3>
                    <p className="text-xs text-neutral-400">
                      {t('Manage associate advocates, clerks, and shared dossiers', 'सहयोगी वकील, क्लर्क और साझी फाइलों का प्रबंधन', 'सहयोगी वकील, क्लर्क आणि फाईल्सचे व्यवस्थापन')}
                    </p>
                  </div>
                </div>
                <ChevronRight size={18} className="text-neutral-500 group-hover:text-amber-300 group-hover:translate-x-0.5 transition" />
              </Card>

              {/* Peer Referral */}
              <Card
                onClick={() => setActiveSection('referral')}
                className="p-4 bg-white/[0.03] hover:bg-white/[0.07] border-white/[0.1] hover:border-amber-400/40 transition cursor-pointer flex items-center justify-between group"
              >
                <div className="flex items-center gap-3.5">
                  <div className="w-10 h-10 rounded-2xl bg-teal-500/15 border border-teal-500/30 text-teal-400 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                    <Share2 size={20} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-bold text-white group-hover:text-amber-300 transition-colors">
                        {t('Peer Referral', 'सहयोगी रेफरल', 'सहकारी रेफरल')}
                      </h3>
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-teal-500/20 text-teal-300">
                        {referrals.length} {t('Active', 'सक्रिय', 'सक्रिय')}
                      </span>
                    </div>
                    <p className="text-xs text-neutral-400">
                      {t('Dispatch briefs to colleagues across Bar associations & courts', 'अन्य न्यायालयों में साथी वकीलों को ब्रीफ रेफर करें', 'इतर न्यायालयांमधील सहकारी वकिलांना केस रेफर करा')}
                    </p>
                  </div>
                </div>
                <ChevronRight size={18} className="text-neutral-500 group-hover:text-amber-300 group-hover:translate-x-0.5 transition" />
              </Card>

              {/* Video Conferencing */}
              <Card
                onClick={() => setActiveSection('video')}
                className="p-4 bg-white/[0.03] hover:bg-white/[0.07] border-white/[0.1] hover:border-amber-400/40 transition cursor-pointer flex items-center justify-between group"
              >
                <div className="flex items-center gap-3.5">
                  <div className="w-10 h-10 rounded-2xl bg-rose-500/15 border border-rose-500/30 text-rose-400 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                    <Video size={20} />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white group-hover:text-amber-300 transition-colors">
                      {t('Video Conferencing', 'व्हिडिओ कॉन्फरन्सिंग', 'व्हिडिओ कॉन्फरन्सिंग')}
                    </h3>
                    <p className="text-xs text-neutral-400">
                      {t('Virtual consultation room with client invite links & camera controls', 'क्लाइंट के साथ वर्चुअल परामर्श कक्ष और इनवाइट लिंक', 'क्लायंटसोबत आभासी सल्लामसलत कक्ष आणि लिंक')}
                    </p>
                  </div>
                </div>
                <ChevronRight size={18} className="text-neutral-500 group-hover:text-amber-300 group-hover:translate-x-0.5 transition" />
              </Card>
            </div>
          </div>

          {/* Section 2: Legal Intelligence & Community */}
          <div className="space-y-3">
            <div className="flex items-center justify-between px-1">
              <div>
                <h2 className="text-xs font-bold uppercase tracking-wider text-sky-500 dark:text-sky-400">
                  {t('Legal Intelligence & Knowledge', 'विधिक ज्ञान एवं सहकर्मी समुदाय', 'कायदेशीर बुद्धिमत्ता व सहकारी समुदाय')}
                </h2>
                <p className="text-[11px] text-neutral-400 mt-0.5">
                  {t('Skill mastery testing & peer discussion forum', 'कौशल्य मूल्यांकन और मंच परिचर्चा', 'कौशल्य चाचणी आणि कायदेशीर चर्चा')}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Skill Assessment */}
              <Card
                onClick={() => setActiveSection('assessment')}
                className="p-4 bg-white/[0.03] hover:bg-white/[0.07] border-white/[0.1] hover:border-amber-400/40 transition cursor-pointer flex items-center justify-between group"
              >
                <div className="flex items-center gap-3.5">
                  <div className="w-10 h-10 rounded-2xl bg-indigo-500/15 border border-indigo-500/30 text-indigo-400 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                    <Award size={20} />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white group-hover:text-amber-300 transition-colors">
                      {t('Skill Assessment', 'कौशल्य मूल्यांकन', 'कौशल्य चाचणी')}
                    </h3>
                    <p className="text-xs text-neutral-400">
                      {t('Interactive 5-MCQ Indian Law knowledge quiz with explanations', 'भारतीय कानून पर 5 वस्तुनिष्ठ प्रश्न और स्पष्टीकरण', 'भारतीय कायद्यावर ५ बहुपर्यायी प्रश्न आणि स्पष्टीकरण')}
                    </p>
                  </div>
                </div>
                <ChevronRight size={18} className="text-neutral-500 group-hover:text-amber-300 group-hover:translate-x-0.5 transition" />
              </Card>

              {/* Discussion Forum */}
              <Card
                onClick={() => setActiveSection('forum')}
                className="p-4 bg-white/[0.03] hover:bg-white/[0.07] border-white/[0.1] hover:border-amber-400/40 transition cursor-pointer flex items-center justify-between group"
              >
                <div className="flex items-center gap-3.5">
                  <div className="w-10 h-10 rounded-2xl bg-cyan-500/15 border border-cyan-500/30 text-cyan-400 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                    <Users size={20} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-bold text-white group-hover:text-amber-300 transition-colors">
                        {t('Discussion Forum', 'चर्चा मंच', 'चर्चा मंच')}
                      </h3>
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300">
                        {threads.length} {t('Threads', 'थ्रेड्स', 'थ्रेड्स')}
                      </span>
                    </div>
                    <p className="text-xs text-neutral-400">
                      {t('Consult peers, ask legal queries, share citations & debates', 'सहकर्मियों से परामर्श, कानूनी प्रश्न और उद्धरण साझा करें', 'सहकारी वकिलांशी चर्चा, कायदेशीर प्रश्न आणि संदर्भ')}
                    </p>
                  </div>
                </div>
                <ChevronRight size={18} className="text-neutral-500 group-hover:text-amber-300 group-hover:translate-x-0.5 transition" />
              </Card>
            </div>
          </div>

          {/* Section 3: Practice Settings & Verification */}
          <div className="space-y-3">
            <div className="flex items-center justify-between px-1">
              <div>
                <h2 className="text-xs font-bold uppercase tracking-wider text-emerald-500 dark:text-emerald-400">
                  {t('Account & Practice Settings', 'खाता एवं प्रैक्टिस सेटिंग्स', 'खाते आणि प्रॅक्टिस सेटिंग्ज')}
                </h2>
                <p className="text-[11px] text-neutral-400 mt-0.5">
                  {t('Bar credentials audit, preferences, language & session controls', 'बार सत्यापन, भाषा, थीम व सत्र नियंत्रण', 'बार पडताळणी, भाषा, थीम आणि खाते नियंत्रण')}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">


              {/* Legal Templates & Drafting Manager */}
              <Card
                onClick={() => setActiveSection('templates')}
                className="p-4 bg-white/[0.03] hover:bg-white/[0.07] border-white/[0.1] hover:border-amber-400/40 transition cursor-pointer flex items-center justify-between group"
              >
                <div className="flex items-center gap-3.5">
                  <div className="w-10 h-10 rounded-2xl bg-amber-500/15 border border-amber-500/30 text-amber-400 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                    <FileText size={20} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-bold text-white group-hover:text-amber-300 transition-colors">
                        {t('Legal Templates & Drafting', 'ड्राफ्टिंग टेम्प्लेट व अपलोड', 'मसुदा टेम्पलेट्स आणि अपलोड')}
                      </h3>
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-amber-500/20 text-amber-300">
                        {allTemplates.length} {t('Formats', 'प्रारूप', 'प्रारूपे')}
                      </span>
                    </div>
                    <p className="text-xs text-neutral-400">
                      {t('Upload custom templates, AI pre-fill client facts & direct print', 'कस्टम टेम्प्लेट अपलोड करें, AI से क्लाइंट डेटा भरें और प्रिंट लें', 'कस्टम टेम्पलेट अपलोड करा, AI द्वारे माहिती भरा आणि प्रिंट करा')}
                    </p>
                  </div>
                </div>
                <ChevronRight size={18} className="text-neutral-500 group-hover:text-amber-300 group-hover:translate-x-0.5 transition" />
              </Card>

              {/* Settings & Preferences */}
              <Card
                onClick={() => setActiveSection('settings')}
                className="p-4 bg-white/[0.03] hover:bg-white/[0.07] border-white/[0.1] hover:border-amber-400/40 transition cursor-pointer flex items-center justify-between group"
              >
                <div className="flex items-center gap-3.5">
                  <div className="w-10 h-10 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                    <SettingsIcon size={20} />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white group-hover:text-amber-300 transition-colors">
                      {t('Settings & Account', 'सेटिंग्ज और खाता', 'सेटिंग्ज आणि खाते')}
                    </h3>
                    <p className="text-xs text-neutral-400">
                      {t('Language, theme, feedback, sign out & account purge', 'भाषा, थीम, प्रतिक्रिया, साइन आउट और खाता डेटा', 'भाषा, थीम, फीडबॅक, साइन आउट आणि डेटा नष्ट करणे')}
                    </p>
                  </div>
                </div>
                <ChevronRight size={18} className="text-neutral-500 group-hover:text-amber-300 group-hover:translate-x-0.5 transition" />
              </Card>
            </div>
          </div>
        </div>
      )}

      {/* ── 2. SUB-MODULE: SKILL ASSESSMENT ── */}
      {activeSection === 'assessment' && (
        <div className="space-y-4">
          <Card className="p-4 sm:p-5 bg-neutral-900/90 border-indigo-500/30">
            <div className="flex items-center justify-between pb-3 border-b border-white/[0.08]">
              <div>
                <h2 className="text-base font-bold text-white flex items-center gap-2">
                  <Award size={18} className="text-indigo-400" />
                  {t('Advocate Skill Assessment', 'अधिवक्ता कौशल्य मूल्यांकन', 'वकील कौशल्य चाचणी')}
                </h2>
                <p className="text-xs text-neutral-400 mt-0.5">
                  {t(
                    'Evaluate procedural and substantive mastery across BNS, BNSS, BSA, and CPC 1908.',
                    'बीएनएस, बीएनएसएस, बीएसए और सीपीसी 1908 पर अपनी कानूनी पकड़ जांचें।',
                    'बीएनएस, बीएनएसएस, बीएसए आणि सीपीसी 1908 वर कायदेशीर पकड तपासा.'
                  )}
                </p>
              </div>

              {isAssessmentSubmitted && (
                <div className="text-right">
                  <div className="text-lg font-bold text-amber-300 font-mono">
                    {assessmentScore} / {ASSESSMENT_QUESTIONS.length}
                  </div>
                  <span className="text-[10px] font-mono text-emerald-400 uppercase">
                    {assessmentScore >= 4 ? 'Distinction' : assessmentScore >= 3 ? 'Proficient' : 'Revision Required'}
                  </span>
                </div>
              )}
            </div>

            {/* Questions List */}
            <div className="space-y-5 mt-4">
              {ASSESSMENT_QUESTIONS.map((q, idx) => {
                const userAns = selectedAnswers[q.id];
                const isCorrect = userAns === q.correctIndex;

                return (
                  <div
                    key={q.id}
                    className={`p-4 rounded-2xl border transition ${
                      isAssessmentSubmitted
                        ? isCorrect
                          ? 'bg-emerald-500/10 border-emerald-500/40'
                          : 'bg-rose-500/10 border-rose-500/40'
                        : 'bg-white/[0.02] border-white/[0.08]'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-xs font-bold text-white leading-relaxed">
                        <span className="text-amber-300 font-mono mr-1.5">Q{idx + 1}.</span>
                        {q.question}
                      </p>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-white/[0.05] text-neutral-400 shrink-0">
                        {q.actRef}
                      </span>
                    </div>

                    {/* Radio Options */}
                    <div className="mt-3 space-y-2">
                      {q.options.map((opt, optIdx) => {
                        const isSelected = userAns === optIdx;
                        const isThisCorrect = q.correctIndex === optIdx;

                        let optionStyle = 'bg-white/[0.02] border-white/[0.06] text-neutral-300 hover:bg-white/[0.06]';
                        if (isAssessmentSubmitted) {
                          if (isThisCorrect) {
                            optionStyle = 'bg-emerald-500/20 border-emerald-500 text-emerald-200 font-semibold';
                          } else if (isSelected && !isThisCorrect) {
                            optionStyle = 'bg-rose-500/20 border-rose-500 text-rose-200 line-through';
                          }
                        } else if (isSelected) {
                          optionStyle = 'bg-amber-400/20 border-amber-400 text-amber-200 font-semibold';
                        }

                        return (
                          <label
                            key={optIdx}
                            onClick={() => handleSelectOption(q.id, optIdx)}
                            className={`flex items-center gap-3 p-2.5 rounded-xl border text-xs cursor-pointer transition ${optionStyle}`}
                          >
                            <input
                              type="radio"
                              name={`question-${q.id}`}
                              checked={isSelected}
                              onChange={() => handleSelectOption(q.id, optIdx)}
                              disabled={isAssessmentSubmitted}
                              className="accent-amber-400"
                            />
                            <span className="flex-1">{opt}</span>
                            {isAssessmentSubmitted && isThisCorrect && (
                              <CheckCircle2 size={14} className="text-emerald-400 shrink-0" />
                            )}
                          </label>
                        );
                      })}
                    </div>

                    {/* Statutory Explanation on Submit */}
                    {isAssessmentSubmitted && (
                      <div className="mt-3 p-2.5 rounded-xl bg-black/40 border border-white/[0.06] text-[11px] text-neutral-300">
                        <span className="font-bold text-amber-300 mr-1">Statutory Context:</span>
                        {q.explanation}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Actions */}
            <div className="mt-5 flex items-center justify-between gap-3 pt-3 border-t border-white/[0.08]">
              <span className="text-xs text-neutral-400 font-mono">
                {Object.keys(selectedAnswers).length} of {ASSESSMENT_QUESTIONS.length} Answered
              </span>

              {!isAssessmentSubmitted ? (
                <Button
                  variant="primary"
                  size="sm"
                  onClick={handleSubmitAssessment}
                  disabled={Object.keys(selectedAnswers).length < ASSESSMENT_QUESTIONS.length}
                >
                  {t('Submit Assessment', 'मूल्यांकन जमा करें', 'चाचणी सबमिट करा')}
                </Button>
              ) : (
                <Button variant="secondary" size="sm" onClick={handleResetAssessment}>
                  {t('Retake Assessment', 'पुनः प्रयास करें', 'पुन्हा प्रयत्न करा')}
                </Button>
              )}
            </div>
          </Card>
        </div>
      )}

      {/* ── 3. SUB-MODULE: DISCUSSION FORUM ── */}
      {activeSection === 'forum' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Users size={18} className="text-cyan-400" />
              <h2 className="text-base font-bold text-white font-display">
                {t('Advocate Discussion Forum', 'अधिवक्ता चर्चा मंच', 'वकील चर्चा मंच')}
              </h2>
            </div>
            <Button
              variant="primary"
              size="sm"
              icon={<MessageSquare size={13} />}
              onClick={() => setShowNewThreadModal(true)}
            >
              {t('+ Ask Legal Query', '+ नया प्रश्न पूछें', '+ नवीन प्रश्न विचारा')}
            </Button>
          </div>

          {/* Category Filter Pills */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
            {['All', 'BNS/BNSS', 'Civil & CPC', 'Commercial', 'High Court', 'General'].map(cat => (
              <button
                key={cat}
                type="button"
                onClick={() => setForumCategory(cat)}
                className={`px-3 py-1 rounded-full whitespace-nowrap transition text-xs font-semibold ${
                  forumCategory === cat
                    ? 'bg-cyan-500 text-black font-bold'
                    : 'bg-white/[0.05] text-neutral-400 hover:text-white'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Threads List */}
          <div className="space-y-3">
            {threads
              .filter(t => (forumCategory === 'All' ? true : t.category === forumCategory))
              .map(th => {
                const isExpanded = expandedThreadId === th.id;

                return (
                  <Card key={th.id} className="p-4 bg-neutral-900/80 border-white/[0.1] space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-500/15 border border-cyan-500/30 text-cyan-300">
                            {th.category}
                          </span>
                          <span className="text-xs text-neutral-400">
                            {th.author} · {th.court} ({th.barCouncil})
                          </span>
                          <span className="text-[11px] text-neutral-500">· {th.timestamp}</span>
                        </div>
                        <h3
                          onClick={() => setExpandedThreadId(isExpanded ? null : th.id)}
                          className="text-sm font-bold text-white hover:text-cyan-300 cursor-pointer transition"
                        >
                          {th.title}
                        </h3>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleUpvote(th.id)}
                        className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] text-xs text-amber-300 shrink-0 transition"
                      >
                        <ThumbsUp size={12} />
                        <span>{th.upvotes}</span>
                      </button>
                    </div>

                    <p className="text-xs text-neutral-300 leading-relaxed">{th.body}</p>

                    {/* Replies count and toggle */}
                    <div className="flex items-center justify-between text-xs text-neutral-400 pt-2 border-t border-white/[0.06]">
                      <button
                        type="button"
                        onClick={() => setExpandedThreadId(isExpanded ? null : th.id)}
                        className="text-cyan-400 font-semibold hover:underline flex items-center gap-1"
                      >
                        <MessageSquare size={13} />
                        {th.replies.length} {th.replies.length === 1 ? 'Reply' : 'Replies'}
                      </button>
                    </div>

                    {/* Expanded Replies View & Comment Input */}
                    {isExpanded && (
                      <div className="space-y-3 pt-2 border-t border-white/[0.06]">
                        {th.replies.map(rep => (
                          <div key={rep.id} className="p-3 rounded-xl bg-black/50 border border-white/[0.06] text-xs">
                            <div className="flex items-center justify-between text-[11px] text-neutral-400 mb-1">
                              <span className="font-bold text-amber-300">{rep.author}</span>
                              <span>{rep.timestamp}</span>
                            </div>
                            <p className="text-neutral-200">{rep.text}</p>
                          </div>
                        ))}

                        {/* Reply Form */}
                        <div className="flex items-center gap-2 pt-1">
                          <input
                            type="text"
                            value={replyText}
                            onChange={e => setReplyText(e.target.value)}
                            placeholder={t('Write your legal opinion or citation...', 'अपनी कानूनी राय या उद्धरण लिखें...', 'आपले कायदेशीर मत किंवा संदर्भ लिहा...')}
                            className="flex-1 bg-black/60 border border-white/[0.12] rounded-xl px-3 py-2 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-cyan-400"
                            onKeyDown={e => {
                              if (e.key === 'Enter') handleAddReply(th.id);
                            }}
                          />
                          <Button
                            variant="primary"
                            size="sm"
                            icon={<Send size={13} />}
                            onClick={() => handleAddReply(th.id)}
                          >
                            Reply
                          </Button>
                        </div>
                      </div>
                    )}
                  </Card>
                );
              })}
          </div>

          {/* New Thread Modal */}
          {showNewThreadModal && (
            <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
              <div className="bg-neutral-900 border border-white/[0.15] rounded-3xl p-5 max-w-lg w-full space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-white/[0.08]">
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <MessageSquare size={16} className="text-cyan-400" />
                    {t('Post New Legal Query', 'नया कानूनी प्रश्न पोस्ट करें', 'नवीन कायदेशीर प्रश्न विचारा')}
                  </h3>
                  <button
                    type="button"
                    onClick={() => setShowNewThreadModal(false)}
                    className="p-1 rounded-lg text-neutral-400 hover:text-white"
                  >
                    <X size={16} />
                  </button>
                </div>

                <form onSubmit={handleCreateThread} className="space-y-3">
                  <div>
                    <label className="text-[11px] font-mono text-neutral-400 uppercase">Topic Title</label>
                    <input
                      type="text"
                      required
                      value={newThreadTitle}
                      onChange={e => setNewThreadTitle(e.target.value)}
                      placeholder="e.g. Quashing of FIR under BNSS Section 528 (erstwhile 482)"
                      className="w-full mt-1 bg-black/60 border border-white/[0.12] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-400"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-mono text-neutral-400 uppercase">Category</label>
                    <select
                      value={newThreadCategory}
                      onChange={e => setNewThreadCategory(e.target.value as any)}
                      className="w-full mt-1 bg-neutral-950 border border-white/[0.12] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-400"
                    >
                      <option value="BNS/BNSS">BNS / BNSS (Criminal)</option>
                      <option value="Civil & CPC">Civil & CPC 1908</option>
                      <option value="Commercial">Commercial & Arbitration</option>
                      <option value="High Court">High Court & Writs</option>
                      <option value="General">General Practice</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[11px] font-mono text-neutral-400 uppercase">Details / Case Facts</label>
                    <textarea
                      required
                      rows={4}
                      value={newThreadBody}
                      onChange={e => setNewThreadBody(e.target.value)}
                      placeholder="Outline relevant legal provisions, factual background, or conflicting precedents..."
                      className="w-full mt-1 bg-black/60 border border-white/[0.12] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-400"
                    />
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-2">
                    <Button variant="secondary" size="sm" onClick={() => setShowNewThreadModal(false)}>
                      Cancel
                    </Button>
                    <Button variant="primary" size="sm" type="submit">
                      Post to Forum
                    </Button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── 4. SUB-MODULE: PEER REFERRAL ── */}
      {activeSection === 'referral' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-white/[0.08]">
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <Share2 size={18} className="text-teal-400" />
                {t('Advocate Peer Brief Referral', 'अधिवक्ता सहयोगी ब्रीफ रेफरल', 'वकील सहकारी ब्रीफ रेफरल')}
              </h2>
              <p className="text-xs text-neutral-400 mt-0.5">
                {t(
                  'Refer matters across courts and Bar associations with formal brief slips.',
                  'अन्य बार एसोसिएशनों और अदालतों में साथियों को ब्रीफ रेफर करें।',
                  'इतर बार असोसिएशन आणि न्यायालयांमधील सहकाऱ्यांना केस रेफर करा.'
                )}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* New Referral Form */}
            <Card className="p-4 sm:p-5 bg-neutral-900/90 border-teal-500/30 space-y-3">
              <h3 className="text-xs font-mono font-bold text-teal-400 uppercase tracking-wider">
                {t('Dispatch New Brief', 'नया ब्रीफ भेजें', 'नवीन ब्रीफ पाठवा')}
              </h3>

              <form onSubmit={handleDispatchReferral} className="space-y-3">
                <div>
                  <label className="text-[11px] font-mono text-neutral-400 uppercase">Client Full Name</label>
                  <input
                    type="text"
                    required
                    value={refClientName}
                    onChange={e => setRefClientName(e.target.value)}
                    placeholder="e.g. Ramesh Chandra Agrawal"
                    className="w-full mt-1 bg-black/60 border border-white/[0.12] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-teal-400"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[11px] font-mono text-neutral-400 uppercase">Contact Phone</label>
                    <input
                      type="text"
                      value={refClientPhone}
                      onChange={e => setRefClientPhone(e.target.value)}
                      placeholder="+91 98201 XXXXX"
                      className="w-full mt-1 bg-black/60 border border-white/[0.12] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-teal-400"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-mono text-neutral-400 uppercase">Target Court</label>
                    <input
                      type="text"
                      required
                      value={refTargetCourt}
                      onChange={e => setRefTargetCourt(e.target.value)}
                      placeholder="e.g. Bombay High Court"
                      className="w-full mt-1 bg-black/60 border border-white/[0.12] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-teal-400"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[11px] font-mono text-neutral-400 uppercase">Practice Domain</label>
                  <select
                    value={refPracticeArea}
                    onChange={e => setRefPracticeArea(e.target.value)}
                    className="w-full mt-1 bg-neutral-950 border border-white/[0.12] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-teal-400"
                  >
                    <option value="Criminal Law (BNS/BNSS)">Criminal Law (BNS / BNSS)</option>
                    <option value="Commercial & Property">Commercial & Property</option>
                    <option value="Matrimonial & Family">Matrimonial & Family</option>
                    <option value="Constitutional / Writs">Constitutional / Writs</option>
                    <option value="Cheque Dishonour (NI Act)">Cheque Dishonour (NI Act)</option>
                    <option value="NCLT / Insolvency">NCLT / Insolvency</option>
                  </select>
                </div>

                <div>
                  <label className="text-[11px] font-mono text-neutral-400 uppercase">Brief Matter Summary</label>
                  <textarea
                    required
                    rows={3}
                    value={refSummary}
                    onChange={e => setRefSummary(e.target.value)}
                    placeholder="Provide overview of cause of action, current stage, and urgent instructions..."
                    className="w-full mt-1 bg-black/60 border border-white/[0.12] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-teal-400"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-mono text-neutral-400 uppercase">Referral Terms</label>
                  <select
                    value={refTerms}
                    onChange={e => setRefTerms(e.target.value)}
                    className="w-full mt-1 bg-neutral-950 border border-white/[0.12] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-teal-400"
                  >
                    <option value="Standard 10% Brief Fee Sharing">Standard 10% Brief Fee Sharing</option>
                    <option value="Professional Courtesy (Nil Fee)">Professional Courtesy (Nil Fee)</option>
                    <option value="Co-Counsel Representation">Co-Counsel Representation</option>
                  </select>
                </div>

                <Button variant="primary" size="sm" type="submit" className="w-full">
                  {t('Dispatch Referral Brief', 'रेफरल ब्रीफ जारी करें', 'रेफरल ब्रीफ पाठवा')}
                </Button>
              </form>
            </Card>

            {/* Outgoing Referrals Tracking */}
            <div className="space-y-3">
              <h3 className="text-xs font-mono font-bold text-neutral-400 uppercase tracking-wider">
                {t('Outgoing Referrals', 'भेजे गए रेफरल', 'पाठवलेले रेफरल्स')} ({referrals.length})
              </h3>

              {referrals.map(ref => (
                <Card key={ref.id} className="p-4 bg-white/[0.03] border-white/[0.08] space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-amber-300 font-mono">{ref.id}</span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-teal-500/15 text-teal-300 border border-teal-500/30">
                      {ref.status}
                    </span>
                  </div>

                  <div>
                    <h4 className="text-xs font-bold text-white">{ref.clientName}</h4>
                    <p className="text-[11px] text-neutral-400">
                      {ref.targetCourt} · {ref.practiceArea}
                    </p>
                  </div>

                  <p className="text-[11px] text-neutral-300 italic line-clamp-2">"{ref.briefSummary}"</p>

                  <div className="flex items-center justify-between pt-2 border-t border-white/[0.06] text-[11px]">
                    <span className="text-neutral-500 font-mono">{ref.date}</span>
                    <button
                      type="button"
                      onClick={() => handleCopyReferralSlip(ref)}
                      className="flex items-center gap-1 text-teal-400 hover:underline font-semibold"
                    >
                      <Copy size={12} />
                      {copiedRef ? 'Copied!' : 'Copy Referral Slip'}
                    </button>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── 5. SUB-MODULE: VIDEO CONFERENCING ── */}
      {activeSection === 'video' && (
        <div className="space-y-4">
          <Card className="p-5 sm:p-6 bg-neutral-900/90 border-rose-500/30 space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-white/[0.08]">
              <div>
                <h2 className="text-base font-bold text-white flex items-center gap-2">
                  <Video size={18} className="text-rose-400" />
                  {t('Virtual Consultation Suite', 'वर्चुअल परामर्श कक्ष', 'आभासी सल्लामसलत कक्ष')}
                </h2>
                <p className="text-xs text-neutral-400 mt-0.5">
                  {t(
                    'High-definition video consultations with clients & associates across India.',
                    'भारत भर के मुवक्किलों और सहयोगियों के साथ एचडी वीडियो परामर्श।',
                    'देशभरातील क्लायंट आणि सहकाऱ्यांसोबत थेट व्हिडिओ सल्लामसलत.'
                  )}
                </p>
              </div>

              <span className="text-[10px] font-mono px-2.5 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 font-bold flex items-center gap-1">
                <CheckCircle2 size={11} /> End-to-End Encrypted
              </span>
            </div>

            {/* Video Preview Simulation / Hardware Controls */}
            <div className="relative rounded-2xl overflow-hidden aspect-video bg-neutral-950 border border-white/[0.12] flex flex-col items-center justify-center p-6 text-center shadow-inner">
              <div className="w-16 h-16 rounded-full bg-rose-500/20 text-rose-400 flex items-center justify-center mb-3">
                {camActive ? <Video size={32} /> : <VideoOff size={32} />}
              </div>
              <p className="text-sm font-bold text-white">Camera & Microphone Preview Ready</p>
              <p className="text-xs text-neutral-400 max-w-sm mt-1">
                Consultation room: <span className="font-mono text-amber-300 font-bold">{roomCode}</span>
              </p>

              {/* Hardware Toggles */}
              <div className="flex items-center gap-3 mt-4">
                <button
                  type="button"
                  onClick={() => setCamActive(!camActive)}
                  className={`p-3 rounded-2xl transition border ${
                    camActive
                      ? 'bg-white/[0.08] border-white/[0.15] text-white'
                      : 'bg-rose-500/20 border-rose-500 text-rose-400'
                  }`}
                  title={camActive ? 'Disable Camera' : 'Enable Camera'}
                >
                  {camActive ? <Video size={18} /> : <VideoOff size={18} />}
                </button>
                <button
                  type="button"
                  onClick={() => setMicActive(!micActive)}
                  className={`p-3 rounded-2xl transition border ${
                    micActive
                      ? 'bg-white/[0.08] border-white/[0.15] text-white'
                      : 'bg-rose-500/20 border-rose-500 text-rose-400'
                  }`}
                  title={micActive ? 'Mute Microphone' : 'Unmute Microphone'}
                >
                  {micActive ? <Mic size={18} /> : <MicOff size={18} />}
                </button>
              </div>
            </div>

            {/* Consultation Invite Link */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-3.5 rounded-2xl bg-white/[0.03] border border-white/[0.08]">
              <div className="flex items-center gap-2">
                <Globe size={16} className="text-neutral-400 shrink-0" />
                <span className="text-xs font-mono text-neutral-300 truncate">
                  https://nyaay.app/consult/{roomCode}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="secondary" size="sm" icon={<Copy size={12} />} onClick={handleCopyRoomLink}>
                  {copiedRoomLink ? 'Copied!' : 'Copy Link'}
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  icon={<Video size={13} />}
                  onClick={() => setIsVideoModalOpen(true)}
                >
                  {t('Join Video Room', 'रूम में शामिल हों', 'रूममध्ये सामील व्हा')}
                </Button>
              </div>
            </div>
          </Card>

          {/* Modal Call Interface */}
          {isVideoModalOpen && (
            <CallModal
              isOpen={isVideoModalOpen}
              onClose={() => setIsVideoModalOpen(false)}
              callType="video"
              recipientName="Virtual Consultation Room"
              language={language}
            />
          )}
        </div>
      )}

      {/* ── 6. SUB-MODULE: CHAMBERS PORTFOLIO ── */}
      {activeSection === 'portfolio' && (
        <div className="space-y-4">
          <Card className="p-5 bg-white/[0.03] border-white/[0.08] space-y-4">
            <h3 className="text-xs font-mono text-amber-300 font-bold uppercase tracking-wider">
              {t('Digital Chambers Portfolio', 'डिजिटल चैंबर पोर्टफोलियो', 'डिजिटल चेंबर पोर्टफोलिओ')}
            </h3>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
              <div className="p-3 rounded-2xl bg-black/40 border border-white/[0.06]">
                <p className="text-[10px] font-mono text-neutral-400 uppercase">Years in Practice</p>
                <p className="text-xl font-bold text-amber-300 font-mono mt-1">{experienceYears}+</p>
              </div>
              <div className="p-3 rounded-2xl bg-black/40 border border-white/[0.06]">
                <p className="text-[10px] font-mono text-neutral-400 uppercase">Matters Handled</p>
                <p className="text-xl font-bold text-white font-mono mt-1">320+</p>
              </div>
              <div className="p-3 rounded-2xl bg-black/40 border border-white/[0.06]">
                <p className="text-[10px] font-mono text-neutral-400 uppercase">Bar Enrolment</p>
                <p className="text-xl font-bold text-emerald-400 font-mono mt-1">Active</p>
              </div>
              <div className="p-3 rounded-2xl bg-black/40 border border-white/[0.06]">
                <p className="text-[10px] font-mono text-neutral-400 uppercase">Verification</p>
                <p className="text-xl font-bold text-cyan-400 font-mono mt-1">BCI Gold</p>
              </div>
            </div>

            <div>
              <h4 className="text-xs font-bold text-white mb-1.5">Courts of Practice</h4>
              <div className="flex flex-wrap gap-1.5">
                {[
                  'Supreme Court of India',
                  'High Court of Judicature at Delhi',
                  'High Court of Judicature at Bombay',
                  'National Company Law Appellate Tribunal (NCLAT)',
                  'Debts Recovery Appellate Tribunal (DRAT)',
                ].map(court => (
                  <span
                    key={court}
                    className="text-[11px] font-mono px-2.5 py-1 rounded-xl bg-white/[0.05] border border-white/[0.08] text-neutral-300"
                  >
                    {court}
                  </span>
                ))}
              </div>
            </div>

            <div>
              <h4 className="text-xs font-bold text-white mb-1.5">Professional Statement & Advocacy Ethos</h4>
              <p className="text-xs text-neutral-300 leading-relaxed bg-black/40 p-3 rounded-2xl border border-white/[0.06]">
                Committed to delivering diligent, ethical, and fearless legal advocacy across appellate and original
                jurisdictions. Focusing on complex corporate disputes, constitutional writs, and high-stakes criminal
                defense with procedural rigour and technological efficiency.
              </p>
            </div>
          </Card>
        </div>
      )}

      {/* ── 7. SUB-MODULE: SETTINGS & ACCOUNT ── */}
      {activeSection === 'settings' && (
        <div className="space-y-4">
          <Card className="p-5 bg-neutral-900/90 border-white/[0.12] space-y-5">
            <h3 className="text-xs font-mono text-amber-300 font-bold uppercase tracking-wider">
              {t('System Preferences & Account Settings', 'सिस्टम प्राथमिकताएं और खाता सेटिंग्स', 'प्रणाली प्राधान्ये आणि खाते सेटिंग्ज')}
            </h3>

            {/* Templates & Custom Formats Shortcut */}
            <div className="flex items-center justify-between pb-4 border-b border-white/[0.08]">
              <div>
                <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                  <FileText size={14} className="text-amber-300" />
                  <span>{t('Legal Templates & Custom Formats', 'कानूनी ड्राफ्टिंग टेम्प्लेट व प्रारूप', 'कायदेशीर मसुदा टेम्पलेट्स आणि प्रारूपे')}</span>
                </h4>
                <p className="text-[11px] text-neutral-400">
                  {t('Upload custom formats, pre-fill live client data and print directly', 'कस्टम ड्राफ्ट टेम्प्लेट अपलोड करें, क्लाइंट विवरण भरें और प्रिंट करें', 'कस्टम मसुदा टेम्पलेट्स अपलोड करा आणि थेट प्रिंट करा')}
                </p>
              </div>
              <Button variant="secondary" size="sm" icon={<Upload size={13} />} onClick={() => setActiveSection('templates')}>
                {t('Manage Formats', 'टेम्प्लेट प्रबंधित करें', 'टेम्पलेट्स व्यवस्थापित करा')}
              </Button>
            </div>

            {/* Language Selector */}
            {onSelectLanguage && (
              <div className="space-y-2 pb-4 border-b border-white/[0.08]">
                <label className="text-xs font-bold text-white flex items-center gap-2">
                  <Globe size={14} className="text-amber-300" />
                  {t('Language', 'भाषा', 'भाषा')}
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'en', label: 'English' },
                    { id: 'hi', label: 'हिन्दी' },
                    { id: 'mr', label: 'मराठी' },
                  ].map(l => (
                    <button
                      key={l.id}
                      type="button"
                      onClick={() => onSelectLanguage(l.id as Language)}
                      className={`p-2.5 rounded-xl border text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                        language === l.id
                          ? 'bg-amber-400 text-black border-amber-400'
                          : 'bg-white/[0.04] border-white/[0.08] text-white hover:bg-white/[0.08]'
                      }`}
                    >
                      {language === l.id && <Check size={13} />}
                      {l.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Theme Toggle */}
            {onToggleTheme && (
              <div className="space-y-2 pb-4 border-b border-white/[0.08]">
                <label className="text-xs font-bold text-white flex items-center gap-2">
                  <Sun size={14} className="text-amber-300" />
                  {t('Interface Theme', 'थीम', 'थीम')}
                </label>
                <div className="flex items-center justify-between p-3 rounded-2xl bg-white/[0.03] border border-white/[0.08]">
                  <span className="text-xs text-neutral-300 capitalize">
                    {t('Current Theme', 'वर्तमान थीम', 'सध्याची थीम')}: {theme || 'Dark'}
                  </span>
                  <Button variant="secondary" size="sm" icon={<Moon size={13} />} onClick={onToggleTheme}>
                    {t('Toggle Theme', 'थीम बदलें', 'थीम बदला')}
                  </Button>
                </div>
              </div>
            )}

            {/* Feedback Shortcut */}
            {onOpenFeedback && (
              <div className="flex items-center justify-between pb-4 border-b border-white/[0.08]">
                <div>
                  <h4 className="text-xs font-bold text-white">{t('App Feedback & Bug Reports', 'फीडबैक और बग रिपोर्ट', 'फीडबॅक आणि त्रुटी अहवाल')}</h4>
                  <p className="text-[11px] text-neutral-400">Directly communicate with NYAAY developers</p>
                </div>
                <Button variant="secondary" size="sm" icon={<MessageSquare size={13} />} onClick={onOpenFeedback}>
                  Feedback
                </Button>
              </div>
            )}

            {/* Sign Out */}
            {onSignOut && (
              <div className="flex items-center justify-between pb-4 border-b border-white/[0.08]">
                <div>
                  <h4 className="text-xs font-bold text-white">{t('Sign Out', 'लॉग आउट', 'लॉग आउट')}</h4>
                  <p className="text-[11px] text-neutral-400">Safely terminate active counsel session</p>
                </div>
                <Button variant="secondary" size="sm" icon={<LogOut size={13} />} onClick={onSignOut}>
                  Sign Out
                </Button>
              </div>
            )}

            {/* Delete Account */}
            {deleteAccount && (
              <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-between gap-3">
                <div>
                  <h4 className="text-xs font-bold text-rose-300 flex items-center gap-1.5">
                    <AlertTriangle size={13} />
                    {t('Delete Account', 'खाता हटाएं', 'खाते हटवा')}
                  </h4>
                  <p className="text-[11px] text-rose-200/70">
                    Purges advocate portfolio, citizen records & chambers roster permanently.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowDeleteModal(true)}
                  className="px-3 py-1.5 rounded-xl bg-rose-500 hover:bg-rose-600 text-white font-bold text-xs shrink-0 transition"
                >
                  Delete Account
                </button>
              </div>
            )}
          </Card>
        </div>
      )}

      {/* ── 8. SUB-MODULE: TEMPLATES & LEGAL DRAFTING REPOSITORY ── */}
      {activeSection === 'templates' && (
        <div className="space-y-4 animate-in fade-in">
          {/* Header Action Card */}
          <Card className="p-4 sm:p-5 bg-neutral-900/90 border-white/[0.12] space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <FileText className="text-amber-400" size={18} />
                  <span>{t('Legal Templates & Drafting Hub', 'कानूनी ड्राफ्टिंग टेम्प्लेट व प्रारूप भंडार', 'कायदेशीर मसुदा टेम्पलेट्स हब')}</span>
                </h3>
                <p className="text-xs text-neutral-400 mt-1">
                  {t(
                    'Upload custom templates, search judicial formats, pre-fill live client data, and print directly.',
                    'कस्टम टेम्प्लेट अपलोड करें, ड्राफ्ट खोजें, क्लाइंट डेटा स्वचालित भरें और सीधा प्रिंट लें।',
                    'कस्टम मसुदा टेम्पलेट्स अपलोड करा, शोध करा, क्लायंट डेटा भरा आणि थेट प्रिंट करा.'
                  )}
                </p>
              </div>
              <Button
                variant="primary"
                size="sm"
                icon={<Plus size={14} />}
                onClick={() => setIsUploadModalOpen(true)}
                className="shrink-0"
              >
                {t('Upload Custom Template', '+ नया टेम्प्लेट अपलोड करें', '+ नवीन टेम्पलेट अपलोड करा')}
              </Button>
            </div>

            {/* Notification Toast */}
            {templateToast && (
              <div className="p-2.5 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-300 text-xs flex items-center justify-between">
                <span>{templateToast}</span>
                <button onClick={() => setTemplateToast(null)} className="text-neutral-400 hover:text-white">
                  <X size={14} />
                </button>
              </div>
            )}

            {/* Search & Category Filter */}
            <div className="space-y-3 pt-2 border-t border-white/[0.08]">
              <div className="relative">
                <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400" />
                <input
                  type="text"
                  value={templateSearchTerm}
                  onChange={e => setTemplateSearchTerm(e.target.value)}
                  placeholder={t(
                    'Search formats by title, act or keyword (e.g. NI Act, Bail, Injunction, Vakalatnama)...',
                    'प्रारूप खोजें (उदा. 138 NI Act, जमानत, व्यादेश, वकालतनामा)...',
                    'मसुदा शोधा (उदा. 138 NI Act, जामीन, मनाई हुकूम, वकालतनामा)...'
                  )}
                  className="w-full pl-10 pr-4 py-2 text-xs rounded-xl bg-white/[0.04] border border-white/[0.1] text-white placeholder:text-neutral-500 focus:outline-none focus:border-amber-400/50"
                />
              </div>

              {/* Category Pills */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
                {['All', 'Notice', 'Bail', 'Civil Application', 'Vakalatnama', 'Pleading', 'Custom'].map(cat => {
                  const count =
                    cat === 'All'
                      ? allTemplates.length
                      : cat === 'Custom'
                      ? allTemplates.filter(tp => tp.id.startsWith('custom_')).length
                      : allTemplates.filter(tp => tp.category === cat).length;
                  const isSelected = templateCategoryFilter === cat;
                  return (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setTemplateCategoryFilter(cat)}
                      className={`px-3 py-1.5 rounded-lg text-[11px] font-medium whitespace-nowrap transition-colors flex items-center gap-1.5 ${
                        isSelected
                          ? 'bg-amber-400 text-neutral-950 font-bold shadow-sm'
                          : 'bg-white/[0.04] text-neutral-300 hover:bg-white/[0.08] border border-white/[0.06]'
                      }`}
                    >
                      <span>{cat === 'Custom' ? t('My Uploads', 'मेरे अपलोड', 'माझे अपलोड') : cat}</span>
                      <span
                        className={`text-[9px] px-1.5 py-0.2 rounded-full ${
                          isSelected ? 'bg-neutral-900/20 text-neutral-900 font-bold' : 'bg-white/[0.1] text-neutral-400'
                        }`}
                      >
                        {count}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </Card>

          {/* Templates Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {allTemplates
              .filter(tp => {
                const matchesCat =
                  templateCategoryFilter === 'All'
                    ? true
                    : templateCategoryFilter === 'Custom'
                    ? tp.id.startsWith('custom_')
                    : tp.category === templateCategoryFilter;
                const matchesSearch =
                  tp.title.toLowerCase().includes(templateSearchTerm.toLowerCase()) ||
                  tp.statutoryReference?.toLowerCase().includes(templateSearchTerm.toLowerCase()) ||
                  tp.category.toLowerCase().includes(templateSearchTerm.toLowerCase());
                return matchesCat && matchesSearch;
              })
              .map(tp => {
                const isCustom = tp.id.startsWith('custom_');
                return (
                  <Card
                    key={tp.id}
                    className="p-4 bg-neutral-900/80 hover:bg-neutral-900 border-white/[0.08] hover:border-amber-400/30 transition-all flex flex-col justify-between group"
                  >
                    <div className="space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className="p-1.5 rounded-lg bg-amber-400/10 text-amber-400 text-xs">
                            <FileText size={14} />
                          </span>
                          <div>
                            <span className="text-[10px] font-mono uppercase tracking-wider text-amber-400/80 font-bold">
                              {tp.category}
                            </span>
                            {isCustom && (
                              <span className="ml-2 text-[9px] font-semibold px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                                {t('Custom Upload', 'कस्टम अपलोड', 'कस्टम अपलोड')}
                              </span>
                            )}
                          </div>
                        </div>
                        <span className="text-[10px] text-neutral-400 font-mono">
                          {tp.courtHierarchy}
                        </span>
                      </div>

                      <div>
                        <h4 className="text-sm font-bold text-white group-hover:text-amber-300 transition-colors">
                          {tp.title}
                        </h4>
                        {tp.statutoryReference && (
                          <p className="text-[11px] font-mono text-neutral-400 mt-0.5">
                            § {tp.statutoryReference}
                          </p>
                        )}
                      </div>

                      <p className="text-xs text-neutral-400 line-clamp-2 leading-relaxed">
                        {tp.description || tp.templateContent.slice(0, 120)}...
                      </p>
                    </div>

                    <div className="pt-3 mt-3 border-t border-white/[0.06] flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5">
                        <Button
                          variant="secondary"
                          size="sm"
                          icon={<Eye size={13} />}
                          onClick={() => {
                            setDraftingModalTemplate(tp);
                            setIsDraftingModalOpen(true);
                          }}
                        >
                          {t('Open & Draft', 'खोलें व ड्राफ्ट करें', 'उघडा आणि मसुदा तयार करा')}
                        </Button>
                      </div>

                      {isCustom && (
                        <button
                          type="button"
                          onClick={() => {
                            if (confirm(t('Are you sure you want to delete this custom template?', 'क्या आप इस कस्टम टेम्प्लेट को हटाना चाहते हैं?', 'तुम्हाला हे कस्टम टेम्पलेट हटवायचे आहे का?'))) {
                              deleteCustomTemplate(tp.id);
                              refreshTemplates();
                              setTemplateToast(t('Template deleted successfully', 'टेम्प्लेट सफलतापूर्वक हटाया गया', 'टेम्पलेट यशस्वीरित्या हटवले'));
                            }
                          }}
                          className="p-1.5 rounded-lg text-neutral-500 hover:text-rose-400 hover:bg-rose-500/10 transition"
                          title={t('Delete Template', 'हटाएं', 'हटवा')}
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                  </Card>
                );
              })}
          </div>
        </div>
      )}

      {/* ── UPLOAD CUSTOM TEMPLATE MODAL ── */}
      {isUploadModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-neutral-900 border border-white/[0.14] rounded-3xl p-5 sm:p-6 max-w-lg w-full space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-amber-400/10 text-amber-400">
                  <Upload size={18} />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">
                    {t('Upload Custom Legal Format', 'कस्टम कानूनी प्रारूप अपलोड करें', 'कस्टम कायदेशीर मसुदा अपलोड करा')}
                  </h3>
                  <p className="text-[11px] text-neutral-400">
                    {t('Save standard formats to reuse and auto-fill in your cases', 'केसों में उपयोग और स्वतः भरने के लिए फॉर्मेट सुरक्षित करें', 'केसमध्ये पुन्हा वापरण्यासाठी आणि आपोआप भरण्यासाठी सेव्ह करा')}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsUploadModalOpen(false)}
                className="p-1.5 rounded-xl hover:bg-white/[0.08] text-neutral-400 hover:text-white transition"
              >
                <X size={16} />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-neutral-300 block mb-1">
                  {t('Template Title *', 'टेम्प्लेट शीर्षक *', 'टेम्पलेट शीर्षक *')}
                </label>
                <input
                  type="text"
                  value={newTemplateTitle}
                  onChange={e => setNewTemplateTitle(e.target.value)}
                  placeholder="e.g. Notice for Breach of Commercial Agreement"
                  className="w-full px-3.5 py-2 rounded-xl bg-white/[0.04] border border-white/[0.1] text-xs text-white placeholder:text-neutral-500 focus:outline-none focus:border-amber-400/50"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-neutral-300 block mb-1">
                    {t('Category', 'श्रेणी', 'वर्ग')}
                  </label>
                  <select
                    value={newTemplateCategory}
                    onChange={e => setNewTemplateCategory(e.target.value as LegalTemplate['category'])}
                    className="w-full px-3 py-2 rounded-xl bg-neutral-800 border border-white/[0.1] text-xs text-white focus:outline-none focus:border-amber-400/50"
                  >
                    <option value="Notice">Notice</option>
                    <option value="Bail">Bail</option>
                    <option value="Civil Application">Civil Application</option>
                    <option value="Vakalatnama">Vakalatnama</option>
                    <option value="Pleading">Pleading</option>
                    <option value="Affidavit">Affidavit</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-neutral-300 block mb-1">
                    {t('Statutory Section / Act', 'कानूनी धारा / अधिनियम', 'कायदेशीर कलम / कायदा')}
                  </label>
                  <input
                    type="text"
                    value={newTemplateStatutoryRef}
                    onChange={e => setNewTemplateStatutoryRef(e.target.value)}
                    placeholder="e.g. Sec 73 Indian Contract Act"
                    className="w-full px-3 py-2 rounded-xl bg-white/[0.04] border border-white/[0.1] text-xs text-white placeholder:text-neutral-500 focus:outline-none focus:border-amber-400/50"
                  />
                </div>
              </div>

              {/* Upload file helper */}
              <div className="p-3 rounded-2xl bg-amber-400/5 border border-amber-400/20 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-semibold text-amber-300">
                    {t('Quick Import from text file (.txt)', '.txt फाइल से आयात करें', '.txt फाईल वरून आयात करा')}
                  </span>
                  <label className="cursor-pointer text-xs font-bold px-2.5 py-1 rounded-lg bg-amber-400 text-neutral-950 hover:bg-amber-300 transition">
                    <span>{t('Browse File', 'फाइल चुनें', 'फाईल निवडा')}</span>
                    <input
                      type="file"
                      accept=".txt,.md,.text"
                      className="hidden"
                      onChange={e => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const reader = new FileReader();
                          reader.onload = ev => {
                            const content = ev.target?.result as string;
                            if (content) setNewTemplateContent(content);
                            if (!newTemplateTitle) setNewTemplateTitle(file.name.replace(/\.[^/.]+$/, ''));
                          };
                          reader.readAsText(file);
                        }
                      }}
                    />
                  </label>
                </div>
                <p className="text-[10px] text-neutral-400">
                  {t(
                    'Tip: Use placeholders like [CLIENT_NAME], [OPPONENT_NAME], [CASE_NUMBER], or [CLIENT ACTION REQUIRED: question] for intelligent pre-fill.',
                    'सुझाव: स्वचालित भरने के लिए [CLIENT_NAME], [CASE_NUMBER] आदि का प्रयोग करें।',
                    'टीप: आपोआप भरण्यासाठी [CLIENT_NAME], [CASE_NUMBER] इत्यादी वापरा.'
                  )}
                </p>
              </div>

              <div>
                <label className="text-xs font-semibold text-neutral-300 block mb-1">
                  {t('Draft Template Text *', 'प्रारूप सामग्री *', 'मसुदा मजकूर *')}
                </label>
                <textarea
                  rows={8}
                  value={newTemplateContent}
                  onChange={e => setNewTemplateContent(e.target.value)}
                  placeholder="Paste or write legal notice/application draft here..."
                  className="w-full p-3 rounded-xl bg-white/[0.04] border border-white/[0.1] text-xs text-white font-mono placeholder:text-neutral-500 focus:outline-none focus:border-amber-400/50 leading-relaxed"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-white/[0.08]">
              <Button variant="secondary" size="sm" onClick={() => setIsUploadModalOpen(false)}>
                {t('Cancel', 'रद्द करें', 'रद्द करा')}
              </Button>
              <Button
                variant="primary"
                size="sm"
                icon={<Check size={14} />}
                onClick={() => {
                  if (!newTemplateTitle.trim() || !newTemplateContent.trim()) {
                    alert(t('Please provide both Title and Template Content', 'कृपया शीर्षक और सामग्री दोनों दर्ज करें', 'कृपया शीर्षक आणि मजकूर दोन्ही प्रविष्ट करा'));
                    return;
                  }
                  saveCustomTemplate({
                    title: newTemplateTitle.trim(),
                    category: newTemplateCategory,
                    description: `Custom format uploaded for ${newTemplateCategory} matters`,
                    statutoryReference: newTemplateStatutoryRef.trim() || 'Indian Laws & Practice',
                    courtHierarchy: newTemplateCourt,
                    placeholders: [
                      { key: 'CLIENT_NAME', label: 'Client / Complainant Name' },
                      { key: 'CASE_NUMBER', label: 'Case Number / Diary Number' },
                      { key: 'COURT_LOCATION', label: 'Court / Forum Jurisdiction' },
                    ],
                    templateContent: newTemplateContent,
                  });
                  refreshTemplates();
                  setIsUploadModalOpen(false);
                  setNewTemplateTitle('');
                  setNewTemplateStatutoryRef('');
                  setNewTemplateContent('');
                  setTemplateToast(t('Custom format saved to your library', 'कस्टम प्रारूप आपके भंडार में सहेजा गया', 'कस्टम मसुदा तुमच्या संग्रहात सेव्ह झाला'));
                }}
              >
                {t('Save Template', 'टेम्प्लेट सुरक्षित करें', 'टेम्पलेट सेव्ह करा')}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ── DRAFTING MODAL (PRE-FILL, PRINT & DIRECT ATTACH) ── */}
      {isDraftingModalOpen && (
        <LegalTemplatesModal
          isOpen={isDraftingModalOpen}
          onClose={() => {
            setIsDraftingModalOpen(false);
            setDraftingModalTemplate(null);
          }}
          initialTemplate={draftingModalTemplate || undefined}
          cases={cases}
        />
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-neutral-950 border border-rose-500/40 rounded-3xl p-6 max-w-md w-full space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-rose-500/20 text-rose-400 flex items-center justify-center mx-auto">
              <Trash2 size={24} />
            </div>
            <div className="text-center">
              <h3 className="text-base font-bold text-white">Permanently Delete Account?</h3>
              <p className="text-xs text-neutral-400 mt-1.5 leading-relaxed">
                This action is IRREVERSIBLE. All citizen briefs, case summaries, invoices, and your verified Bar portfolio
                will be permanently purged from the system.
              </p>
            </div>
            <div className="flex items-center gap-2 pt-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setShowDeleteModal(false)}
                className="flex-1"
                disabled={isDeleting}
              >
                Cancel
              </Button>
              <button
                type="button"
                onClick={handleConfirmDeleteAccount}
                disabled={isDeleting}
                className="flex-1 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs transition"
              >
                {isDeleting ? 'Deleting...' : 'Yes, Delete All Data'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
