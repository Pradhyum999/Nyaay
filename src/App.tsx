import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { AndroidFrame } from './components/AndroidFrame';
import { CourtAnalyticsAndForum } from './components/CourtAnalyticsAndForum';
import { LawyerProfileModal } from './components/LawyerProfileModal';
import { ClientProfileModal } from './components/client/ClientProfileModal';
import { AdminVerificationDashboard } from './components/admin/AdminVerificationDashboard';
import { AuthScreen } from './components/auth/AuthScreen';

import { ClientLawyerDirectory } from './components/client/ClientLawyerDirectory';
import { DirectChatView } from './components/chat/DirectChatView';
import { ChatInboxView } from './components/chat/ChatInboxView';
import { CitizenFeedbackModal } from './components/client/CitizenFeedbackModal';

// NYAAY UX Refactor Core Pages & Shells
import { TodayPage } from './features/today/TodayPage';
import { CaseListPage } from './features/cases/CaseListPage';
import { CaseDetailPage } from './features/cases/CaseDetailPage';
import { NewCaseSheet } from './features/cases/NewCaseSheet';
import { LawyerFeesPage } from './features/fees/LawyerFeesPage';
import { InboxPage } from './features/inbox/InboxPage';
import { MorePage } from './features/more/MorePage';
import { CaseRoomPage } from './features/caseRoom/CaseRoomPage';
import { HelpPage } from './features/help/HelpPage';
import { ClientMePage } from './features/me/ClientMePage';
import { UnifiedTabBar } from './components/navigation/UnifiedTabBar';
import { UnifiedTopBar } from './components/navigation/UnifiedTopBar';
import { ToastProvider } from './design/ui/Toast';
import { ContextFab } from './components/navigation/ContextFab';
import { HearingFormSheet } from './features/hearings/HearingFormSheet';
import { EmergencySheet } from './components/emergency/EmergencySheet';
import { flags } from './config/flags';
import { lawyerTabs, clientTabs } from './config/nav';
import { normaliseCaseNumber } from './lib/caseNumber';
import { DEMO_ACCOUNTS } from './config/demoAccounts';
import { X } from 'lucide-react';

// Firestore Realtime Services
import {
  subscribeToCases,
  subscribeToHearings,
  subscribeToInvoices,
  subscribeToDocuments,
  subscribeToForumPosts,
  subscribeToUserNotifications,
  subscribeToUserThreads,
  subscribeToLawyerInquiries,
  updateInquiryStatus,
  markNotificationRead,
  updateHearingRecord,
  addHearingRecord,
  createInvoiceRecord,
  markInvoiceRecordPaid,
  updateDocumentVerification,
  createCaseRecord,
  processVerificationRequest,
  updateUserProfile,
  addNotification,
  getFirmByAdminUid,
  subscribeToFirmMembers,
  addFirmMember,
  removeFirmMember,
  createFirmProfile,
  createOrGetDirectThread,
  sendDirectMessage,
  getLawyerDirectory
} from './services/firestoreService';
import { FirmPortal } from './components/firm/FirmPortal';
import { FirmRegistration } from './components/firm/FirmRegistration';
import { UniversalSearchModal } from './components/UniversalSearchModal';
import { IpcToBnsModal } from './components/IpcToBnsModal';

import {
  Language,
  ThemeMode,
  UserRole,
  HearingItem,
  InvoiceItem,
  CaseFile,
  DocumentItem,
  ForumPost,
  LimitationAlert,
  UserProfile,
  AppNotification,
  DirectThread,
  FirmProfile,
  FirmMember,
  AIInquiryBrief
} from './types';

// ── Cinematic Loading Screen ──────────────────────────────────────────────────
function LoadingScreen() {
  const [showRetry, setShowRetry] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setShowRetry(true), 3500);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <div className="text-center space-y-4 max-w-xs px-4">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-b from-neutral-800 to-neutral-900 border border-white/[0.14] flex items-center justify-center mx-auto shadow-[0_0_30px_rgba(245,197,99,0.2)] animate-pulse">
          <svg className="w-8 h-8 text-amber-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" />
          </svg>
        </div>
        <div>
          <p className="text-white text-xl font-bold tracking-wider font-display">NYAAYNEETI</p>
          <p className="text-amber-400/80 text-[11px] font-mono uppercase tracking-widest mt-0.5">Legal Operating System</p>
        </div>
        <div className="flex items-center justify-center gap-1.5 pt-2">
          <div className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-bounce [animation-delay:-0.3s]" />
          <div className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-bounce [animation-delay:-0.15s]" />
          <div className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-bounce" />
        </div>
        {showRetry && (
          <div className="pt-2 animate-in fade-in duration-500">
            <button
              onClick={() => window.location.reload()}
              className="text-xs text-neutral-400 hover:text-white underline underline-offset-2 transition"
            >
              Taking longer than usual? Tap to retry
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Main App Content ──────────────────────────────────────────────────────────
function AppContent() {
  const { user, profile, loading, updateProfile, logout, loginAsDemo } = useAuth();

  const [language, setLanguage] = useState<Language>(() => {
    return (localStorage.getItem('nyaay_language') as Language) || 'en';
  });
  const [theme, setTheme] = useState<ThemeMode>(() => {
    const saved = localStorage.getItem('nyaay_theme');
    return (saved === 'light' ? 'light' : 'dark') as ThemeMode;
  });
  const [userRole, setUserRole] = useState<UserRole>('client');

  // New UX Refactor State
  const [lawyerActiveTab, setLawyerActiveTab] = useState<string>('today');
  const [clientActiveTab, setClientActiveTab] = useState<string>('case');
  const [selectedCaseNumber, setSelectedCaseNumber] = useState<string | null>(null);
  const [showNewCaseSheet, setShowNewCaseSheet] = useState<boolean>(false);
  const [showGlobalAddHearing, setShowGlobalAddHearing] = useState<boolean>(false);
  const [verifiedLawyers, setVerifiedLawyers] = useState<UserProfile[]>([]);
  const [showFullDirectory, setShowFullDirectory] = useState<boolean>(false);

  // Inquiries for Lawyer Inbox (§2.5)
  const [inquiries, setInquiries] = useState<AIInquiryBrief[]>([]);

  useEffect(() => {
    const fetchVerifiedLawyers = async () => {
      try {
        const directory = await getLawyerDirectory();
        setVerifiedLawyers(directory.filter(l => l.role === 'lawyer' && l.verificationStatus === 'verified'));
      } catch (err) {
        console.warn("Could not fetch verified lawyers:", err);
      }
    };
    fetchVerifiedLawyers();
  }, []);

  const handleCreateCase = async (newCase: Omit<CaseFile, 'id'>) => {
    const caseId = `case-${Date.now()}`;
    const normalisedCaseNum = normaliseCaseNumber(newCase.caseNumber);
    const fullCase: CaseFile = {
      ...newCase,
      caseNumber: normalisedCaseNum,
      id: caseId,
      lawyerId: user?.uid,
    };
    setCases(prev => [fullCase, ...prev]);
    try {
      if (user) {
        await createCaseRecord({
          ...newCase,
          caseNumber: normalisedCaseNum,
          lawyerId: user.uid
        });
      }
    } catch (err) {
      console.warn("createCaseRecord error:", err);
    }
  };

  const handleAcceptInquiry = async (inq: any) => {
    const newCaseNum = `CC/${Math.floor(2000 + Math.random() * 8000)}/2026`;
    const court = inq.profile?.court || inq.profile?.courtLocation || 'District Court';
    const newCase: Omit<CaseFile, 'id'> = {
      caseNumber: newCaseNum,
      clientName: inq.clientName || inq.profile?.clientName || 'Client',
      clientPhone: inq.clientPhone || inq.profile?.clientPhone || '',
      opponentName: inq.profile?.opponentName || 'State / Respondent',
      courtLocation: court,
      court,
      caseType: inq.profile?.caseType || inq.legalArea || 'Legal Matter',
      actSections: inq.profile?.actSections || ['Relevant Legal Sections'],
      status: 'Active',
      stage: inq.profile?.stage || 'Admission',
      filingDate: new Date().toISOString().split('T')[0],
      nextHearingDate: 'TBD',
      unreadDocuments: 0,
      pendingChecklistItems: 0,
      totalBilled: 0,
      totalCollected: 0,
      clientId: inq.clientId,
    };
    await handleCreateCase(newCase);
    if (inq.id) {
      try {
        await updateInquiryStatus(inq.id, 'accepted');
      } catch (e) {
        console.warn("Could not update inquiry status:", e);
      }
    }
    setInquiries(prev => prev.filter(i => i.id !== inq.id));
    setLawyerActiveTab('cases');
    setSelectedCaseNumber(newCaseNum);
  };

  const handleDeclineInquiry = async (inquiryId: string) => {
    try {
      await updateInquiryStatus(inquiryId, 'declined');
    } catch (e) {
      console.warn("Could not decline inquiry:", e);
    }
    setInquiries(prev => prev.filter(i => i.id !== inquiryId));
  };

  // Auth Modal/Screen state
  const [showAuth, setShowAuth] = useState(false);

  // Modal states
  const [isLawyerProfileOpen, setIsLawyerProfileOpen] = useState<boolean>(false);
  const [isClientProfileOpen, setIsClientProfileOpen] = useState<boolean>(false);
  const [isAdminDashboardOpen, setIsAdminDashboardOpen] = useState<boolean>(false);
  const [isFeedbackOpen, setIsFeedbackOpen] = useState<boolean>(false);
  const [isUniversalSearchOpen, setIsUniversalSearchOpen] = useState<boolean>(false);
  const [isIpcModalOpen, setIsIpcModalOpen] = useState<boolean>(false);
  const [isFirmPortalOpen, setIsFirmPortalOpen] = useState<boolean>(false);
  const [showEmergencySheet, setShowEmergencySheet] = useState<boolean>(false);

  // Sync theme with HTML data attribute and storage
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('nyaay_theme', theme);
  }, [theme]);

  const handleToggleTheme = () => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark');
  };

  // Admin authorization: strictly checked via role or custom claim (S4/S5/§12.2)
  const isAdmin = (profile as any)?.role === 'admin' || (profile as any)?.admin === true;

  // Active Direct Chat state
  const [activeThread, setActiveThread] = useState<{
    threadId: string;
    recipientName: string;
    recipientPhoto?: string;
    matterSubject: string;
    aiBriefAttached?: boolean;
    aiBriefText?: string;
  } | null>(null);

  // In-app Notifications & Chat Threads
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [userThreads, setUserThreads] = useState<DirectThread[]>([]);

  // Database States
  const [hearings, setHearings] = useState<HearingItem[]>([]);
  const [cases, setCases] = useState<CaseFile[]>([]);
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [invoices, setInvoices] = useState<InvoiceItem[]>([]);
  const [forumPosts, setForumPosts] = useState<ForumPost[]>([]);

  // Firm Portal State
  const [currentFirm, setCurrentFirm] = useState<FirmProfile | null>(null);
  const [firmMembers, setFirmMembers] = useState<FirmMember[]>([]);

  // Limitation alerts derived directly from active cases with limitation dates (W6)
  const limitationAlerts: LimitationAlert[] = cases
    .filter(c => Boolean(c.limitationDate))
    .map(c => {
      const diffDays = Math.ceil((new Date(c.limitationDate!).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
      return {
        id: `limit-${c.id}`,
        caseNumber: c.caseNumber,
        titleEn: `Limitation: ${c.caseNumber}`,
        titleHi: `समय सीमा: ${c.caseNumber}`,
        statutoryAct: c.actSections?.[0] || 'Limitation Act',
        daysRemaining: diffDays,
        deadlineDate: c.limitationDate!,
        severity: diffDays <= 7 ? 'critical' : diffDays <= 15 ? 'warning' : 'normal',
        descriptionEn: `Statutory filing deadline approaching for ${c.clientName}.`,
        descriptionHi: `${c.clientName} के लिए दाखिल करने की अंतिम तिथि निकट है।`,
      };
    });

  // Sync user role from Firestore profile
  useEffect(() => {
    if (profile?.role) {
      setUserRole(
        profile.role === 'junior' || profile.role === 'firm_admin' || profile.role === 'student'
          ? 'lawyer'
          : profile.role
      );
    }
  }, [profile]);

  // Demo Account Detection & Hydration
  const isDemoUser = Boolean(user?.uid?.startsWith('demo-'));
  const demoType: 'firm' | 'student' | null = user?.uid === DEMO_ACCOUNTS.firm.user.uid
    ? 'firm'
    : user?.uid === DEMO_ACCOUNTS.student.user.uid
      ? 'student'
      : null;

  useEffect(() => {
    if (isDemoUser && demoType) {
      const demoData = DEMO_ACCOUNTS[demoType];
      setHearings(demoData.hearings);
      setCases(demoData.cases);
      setInvoices(demoData.invoices);
      if (demoData.firm) {
        setCurrentFirm(demoData.firm);
      } else {
        setCurrentFirm(null);
      }
      if (demoData.firmMembers) {
        setFirmMembers(demoData.firmMembers);
      } else {
        setFirmMembers([]);
      }
    } else if (!isDemoUser) {
      // Clear demo firm data when not in demo mode
      if (currentFirm?.id?.startsWith('firm-sharma')) {
        setCurrentFirm(null);
      }
      if (firmMembers.some(m => m.id?.startsWith('mem-'))) {
        setFirmMembers([]);
      }
    }
  }, [user?.uid, isDemoUser, demoType]);

  // Load and subscribe to Firm details
  useEffect(() => {
    if (!user || isDemoUser) return;
    let unsubMembers: (() => void) | undefined;
    const loadFirm = async () => {
      try {
        const firm = await getFirmByAdminUid(user.uid);
        if (firm) {
          setCurrentFirm(firm);
          unsubMembers = subscribeToFirmMembers(firm.id, setFirmMembers);
        }
      } catch (err) {
        console.warn("Failed to load firm for user:", err);
      }
    };
    loadFirm();
    return () => {
      if (unsubMembers) unsubMembers();
    };
  }, [user, isDemoUser]);

  // Prompt auth if not logged in
  useEffect(() => {
    if (!loading && !user) {
      setShowAuth(true);
    }
  }, [loading, user]);

  // ── Firestore Realtime Subscriptions ────────────────────────────────────────
  useEffect(() => {
    if (!user || isDemoUser) return;

    // Reset records immediately so non-demo users start with a clean slate
    setHearings([]);
    setCases([]);
    setInvoices([]);
    setDocuments([]);

    // 1. Subscribe to Hearings
    const unsubHearings = subscribeToHearings(user.uid, userRole, (liveHearings) => {
      setHearings(liveHearings || []);
    });

    // 2. Subscribe to Cases
    const unsubCases = subscribeToCases(user.uid, userRole, (liveCases) => {
      setCases(liveCases || []);
    });

    // 3. Subscribe to Invoices
    const unsubInvoices = subscribeToInvoices(user.uid, userRole, (liveInvoices) => {
      setInvoices(liveInvoices || []);
    });

    // 4. Subscribe to Documents
    const unsubDocuments = subscribeToDocuments(user.uid, userRole, (liveDocs) => {
      setDocuments(liveDocs || []);
    });

    // 5. Subscribe to Community Forum Posts
    const unsubForum = subscribeToForumPosts((livePosts) => {
      setForumPosts(livePosts);
    });

    // 6. Subscribe to In-App Notifications (user-only, no admin leak — §12.0)
    const unsubNotifs = subscribeToUserNotifications(user.uid, (liveNotifs) => {
      setNotifications(liveNotifs);
    });

    // 7. Subscribe to User Direct Threads
    const unsubThreads = subscribeToUserThreads(user.uid, userRole, (liveThreads) => {
      setUserThreads(liveThreads);
    });

    // 8. Subscribe to AI Brief Inquiries for Lawyer (§2.5)
    let unsubInquiries: (() => void) | undefined;
    if (userRole === 'lawyer') {
      unsubInquiries = subscribeToLawyerInquiries(user.uid, (liveInquiries) => {
        setInquiries(liveInquiries || []);
      });
    }

    return () => {
      unsubHearings();
      unsubCases();
      unsubInvoices();
      unsubDocuments();
      unsubForum();
      unsubNotifs();
      unsubThreads();
      if (unsubInquiries) unsubInquiries();
    };
  }, [user, userRole, isDemoUser]);

  if (loading) return <LoadingScreen />;

  const handleCloseAdminDashboard = () => {
    setIsAdminDashboardOpen(false);
  };

  // ── Mandatory Authentication & Onboarding Gate ──────────────────────────────
  const isAlreadySignedUp = Boolean(
    isDemoUser ||
    (profile?.role === 'firm_admin' || profile?.role === 'student' || profile?.role === 'junior') ||
    (profile?.role === 'lawyer' && (profile?.onboardingCompleted === true || ((profile?.email || profile?.phone || user?.email || user?.phoneNumber) && profile?.barCouncilId && profile.barCouncilId.trim().length > 0))) ||
    (profile?.role === 'client' && (profile?.onboardingCompleted === true || (profile?.email || profile?.phone || user?.email || user?.phoneNumber)))
  );

  const needsAuthOrOnboarding = !user || !isAlreadySignedUp;

  if (needsAuthOrOnboarding) {
    return (
      <AndroidFrame
        activeLanguage={language}
        onToggleLanguage={() => setLanguage(prev => prev === 'en' ? 'hi' : prev === 'hi' ? 'mr' : 'en')}
        userRole={userRole}
        onToggleRole={() => {}}
        hideRoleToggle
      >
        <AuthScreen
          language={language}
          onSuccess={(role) => {
            setUserRole(role);
            setShowAuth(false);
          }}
        />

        {isAdmin && (
          <AdminVerificationDashboard
            isOpen={isAdminDashboardOpen}
            onClose={handleCloseAdminDashboard}
            language={language}
          />
        )}
      </AndroidFrame>
    );
  }

  const handleToggleLanguage = () => setLanguage(prev => prev === 'en' ? 'hi' : prev === 'hi' ? 'mr' : 'en');

  // Hearing Order Update with Firestore persistence & Live Client Sync
  const handleUpdateHearingOrder = async (hearingId: string, orderNotes: string, nextDate: string) => {
    let matchedCaseNumber: string | undefined;

    setHearings(prev => prev.map(h => {
      if (h.id === hearingId) {
        matchedCaseNumber = h.caseNumber;
        return {
          ...h,
          previousOrderSummaryEn: orderNotes,
          previousOrderSummaryHi: orderNotes,
          hearingDate: nextDate,
        };
      }
      return h;
    }));

    try {
      await updateHearingRecord(hearingId, orderNotes, nextDate);

      if (matchedCaseNumber) {
        const normalisedTarget = normaliseCaseNumber(matchedCaseNumber);
        const matchedCase = cases.find(c => normaliseCaseNumber(c.caseNumber) === normalisedTarget);

        if (matchedCase) {
          setCases(prev => prev.map(c =>
            c.id === matchedCase.id ? { ...c, nextHearingDate: nextDate } : c
          ));

          if (user) {
            handleSendHearingChatUpdate({
              caseNumber: matchedCaseNumber,
              clientName: matchedCase.clientName,
              court: `${matchedCase.courtLocation || 'Court'}, ${matchedCase.court || ''}`,
              status: 'Adjourned / Order Recorded',
              nextDate,
              stage: matchedCase.stage || 'Ongoing Hearing',
              orderNotes,
            });
          }
        }
      }
    } catch {
      // Local optimistic state preserved
    }
  };

  // Add new Hearing Record with Firestore persistence
  const handleAddHearing = async (newHearing: Omit<HearingItem, 'id'>) => {
    const hearingId = `hr-${Date.now()}`;
    const fullHearing: HearingItem = { ...newHearing, id: hearingId };

    setHearings(prev => [fullHearing, ...prev]);

    try {
      if (user) {
        await addHearingRecord({
          ...newHearing,
          // @ts-ignore
          lawyerId: user.uid
        });
      }
    } catch {
      // Local optimistic state preserved
    }
  };

  // Interlinked Client Chat Update for Hearings (F10: Skip notification if no clientId, never self-notify)
  const handleSendHearingChatUpdate = async (params: {
    caseNumber: string;
    clientName: string;
    court: string;
    status: string;
    nextDate: string;
    stage: string;
    orderNotes: string;
  }) => {
    const normalisedTarget = normaliseCaseNumber(params.caseNumber);
    const matchedCase = cases.find(
      c => normaliseCaseNumber(c.caseNumber) === normalisedTarget || c.clientName === params.clientName
    );
    const clientId = matchedCase?.clientId;
    const clientName = params.clientName || matchedCase?.clientName || 'Client';
    const advocateName = profile?.name || user?.displayName || 'Advocate Counsel';

    const updateText = `🏛️ **Court Hearing Update — ${normalisedTarget}**\n\n` +
      `• **Court**: ${params.court}\n` +
      `• **Outcome / Status**: ${params.status}\n` +
      `• **Next Hearing Date**: ${params.nextDate}\n` +
      `• **Next Stage**: ${params.stage}\n` +
      (params.orderNotes ? `• **Judicial Order**: "${params.orderNotes}"\n\n` : '\n') +
      `📌 *Case Diary has been updated and scheduled for the next date.*`;

    // 1. Send into direct chat thread
    try {
      if (user && clientId) {
        const threadId = await createOrGetDirectThread({
          lawyerId: user.uid,
          lawyerName: advocateName,
          clientId,
          clientName,
          matterSubject: `${normalisedTarget} — ${matchedCase?.caseType || 'Court Hearing Update'}`,
        });

        await sendDirectMessage(threadId, {
          senderId: user.uid,
          senderName: advocateName,
          senderRole: 'lawyer',
          text: updateText,
        });
      }
    } catch (err) {
      console.warn("Could not send hearing update to chat thread:", err);
    }

    // 2. Dispatch in-app notification for client (F10: only if client exists)
    if (clientId) {
      try {
        await addNotification({
          recipientId: clientId,
          type: 'engagement',
          title: `Court Update: ${params.caseNumber}`,
          message: `${params.status} • Next date: ${params.nextDate} (${params.stage})`,
          read: false,
          createdAt: new Date().toISOString(),
        });
      } catch (notifErr) {
        console.warn("Notification error:", notifErr);
      }
    }
  };

  // Pay Invoice with Firestore persistence
  const handlePayInvoice = async (invoiceId: string) => {
    const upiRef = `UPI/${Date.now().toString().slice(-10)}/NYAAYNEETI`;
    setInvoices(prev => prev.map(inv => {
      if (inv.id === invoiceId) {
        return {
          ...inv,
          status: 'Paid',
          paidVia: 'UPI',
          upiRef
        };
      }
      return inv;
    }));

    try {
      await markInvoiceRecordPaid(invoiceId, upiRef);
    } catch {
      // Local optimistic state preserved
    }
  };

  // Create new Invoice with Firestore persistence
  const handleCreateInvoice = async (newInv: InvoiceItem) => {
    setInvoices(prev => [newInv, ...prev]);

    try {
      if (user) {
        const { id, ...data } = newInv;
        await createInvoiceRecord({
          ...data,
          // @ts-ignore
          lawyerId: user.uid
        });
      }
    } catch {
      // Local optimistic state preserved
    }
  };

  const handleAddFirmMember = async (member: Omit<FirmMember, 'id' | 'firmId' | 'joinedAt'>) => {
    if (!currentFirm) return;
    if (isDemoUser) {
      const newId = `mem-${Date.now()}`;
      setFirmMembers(prev => [
        ...prev,
        { ...member, id: newId, firmId: currentFirm.id, joinedAt: new Date().toISOString().split('T')[0] }
      ]);
      return;
    }
    const newId = await addFirmMember(currentFirm.id, member);
    setFirmMembers(prev => [
      ...prev,
      { ...member, id: newId, firmId: currentFirm.id, joinedAt: new Date().toISOString() }
    ]);
  };

  const handleRemoveFirmMember = async (memberId: string) => {
    if (!currentFirm) return;
    if (isDemoUser) {
      setFirmMembers(prev => prev.filter(m => m.id !== memberId));
      return;
    }
    await removeFirmMember(currentFirm.id, memberId);
    setFirmMembers(prev => prev.filter(m => m.id !== memberId));
  };

  const handleRegisterFirmInApp = async (
    firmData: Omit<FirmProfile, 'id' | 'adminUid' | 'memberCount' | 'createdAt'>
  ) => {
    if (!user) return;
    const adminUid = user.uid;
    const firmId = await createFirmProfile(adminUid, firmData);
    const newFirm: FirmProfile = {
      id: firmId,
      adminUid,
      ...firmData,
      memberCount: 0,
      createdAt: new Date().toISOString(),
    };
    setCurrentFirm(newFirm);
    await updateUserProfile(adminUid, { role: 'firm_admin' as any, firmId });
    if (profile) {
      updateProfile({ ...profile, role: 'firm_admin' as any, firmId });
    }
    subscribeToFirmMembers(firmId, setFirmMembers);
  };

  const selectedCase = cases.find(
    c => normaliseCaseNumber(c.caseNumber) === normaliseCaseNumber(selectedCaseNumber || '')
  );

  return (
    <AndroidFrame
      activeLanguage={language}
      onToggleLanguage={handleToggleLanguage}
      userRole={userRole}
      onToggleRole={() => {}}
      hideRoleToggle={true}
    >
      {/* Slim Top Bar */}
      <UnifiedTopBar
        userRole={userRole}
        language={language}
        userTag={
          profile?.role === 'firm_admin'
            ? 'Chambers'
            : profile?.role === 'student'
              ? 'Intern'
              : userRole === 'lawyer'
                ? 'Counsel'
                : 'Citizen'
        }
        notifications={notifications}
        unreadAlertCount={limitationAlerts.filter(a => a.severity === 'critical').length}
        onOpenEmergency={() => setShowEmergencySheet(true)}
        onOpenSearch={userRole === 'lawyer' ? () => setIsUniversalSearchOpen(true) : undefined}
        onDismissNotification={(id) => markNotificationRead(id)}
        onDismissAllNotifications={() => {
          notifications.filter(n => !n.read).forEach(n => markNotificationRead(n.id));
        }}
        onNotificationClick={(n) => {
          if (n.threadId) {
            setActiveThread({
              threadId: n.threadId,
              recipientName: n.senderName || 'Client',
              matterSubject: n.message,
            });
          } else if (userRole === 'lawyer') {
            setLawyerActiveTab('today');
          } else {
            setClientActiveTab('case');
          }
        }}
      />

      {/* Main View: Direct Chat View or Role Views */}
      {activeThread ? (
        <div className="flex-1 flex flex-col h-[calc(100vh-120px)]">
          <DirectChatView
            threadId={activeThread.threadId}
            currentUserId={user?.uid || 'guest'}
            currentUserName={profile?.name || (userRole === 'lawyer' ? 'Advocate' : 'Client')}
            currentUserRole={userRole}
            recipientName={activeThread.recipientName}
            recipientPhoto={activeThread.recipientPhoto}
            matterSubject={activeThread.matterSubject}
            aiBriefAttached={activeThread.aiBriefAttached}
            aiBriefText={activeThread.aiBriefText}
            language={language}
            onSelectLanguage={setLanguage}
            onBack={() => setActiveThread(null)}
          />
        </div>
      ) : (
        <main className="flex-1 overflow-y-auto">
          {userRole === 'lawyer' ? (
            <>
              {lawyerActiveTab === 'today' && (
                <TodayPage
                  hearings={hearings}
                  cases={cases}
                  limitationAlerts={limitationAlerts}
                  language={language}
                  onNavigateToCases={() => setLawyerActiveTab('cases')}
                  onOpenCase={(caseNumber) => {
                    setSelectedCaseNumber(caseNumber);
                    setLawyerActiveTab('cases');
                  }}
                  onMessageClient={async (caseNumber, clientName) => {
                    const matched = cases.find(c => normaliseCaseNumber(c.caseNumber) === normaliseCaseNumber(caseNumber));
                    const threadId = await createOrGetDirectThread({
                      lawyerId: user?.uid || 'lawyer',
                      lawyerName: profile?.name || 'Advocate',
                      clientId: matched?.clientId || 'client',
                      clientName,
                      matterSubject: `Matter: ${caseNumber}`,
                    });
                    setActiveThread({
                      threadId,
                      recipientName: clientName,
                      matterSubject: `Matter: ${caseNumber}`,
                    });
                  }}
                  onUpdateHearingOrder={handleUpdateHearingOrder}
                  onAddHearing={handleAddHearing}
                  onSendHearingChatUpdate={handleSendHearingChatUpdate}
                />
              )}

              {lawyerActiveTab === 'cases' && (
                selectedCase ? (
                  <CaseDetailPage
                    caseFile={selectedCase}
                    hearings={hearings}
                    invoices={invoices}
                    documents={documents}
                    language={language}
                    onBack={() => setSelectedCaseNumber(null)}
                    onMessageClient={async (caseNumber, clientName) => {
                      const threadId = await createOrGetDirectThread({
                        lawyerId: user?.uid || 'lawyer',
                        lawyerName: profile?.name || 'Advocate',
                        clientId: selectedCase.clientId || 'client',
                        clientName,
                        matterSubject: `Case Dossier: ${caseNumber}`,
                      });
                      setActiveThread({
                        threadId,
                        recipientName: clientName,
                        matterSubject: `Case Dossier: ${caseNumber}`,
                      });
                    }}
                    onUpdateHearingOrder={handleUpdateHearingOrder}
                    onAddHearing={handleAddHearing}
                    onSendHearingChatUpdate={handleSendHearingChatUpdate}
                    onNewInvoice={() => setLawyerActiveTab('fees')}
                    onUploadDocument={async (caseNumber, file) => {
                      const docId = `doc-${Date.now()}`;
                      const newDoc: DocumentItem = {
                        id: docId,
                        caseNumber,
                        title: file.name,
                        size: `${(file.size / 1024).toFixed(1)} KB`,
                        status: 'pending',
                        uploadedAt: new Date().toISOString(),
                      };
                      setDocuments(prev => [newDoc, ...prev]);
                    }}
                  />
                ) : (
                  <CaseListPage
                    cases={cases}
                    language={language}
                    onSelectCase={(cNum) => setSelectedCaseNumber(cNum)}
                    onNewCase={() => setShowNewCaseSheet(true)}
                  />
                )
              )}

              {lawyerActiveTab === 'inbox' && (
                <InboxPage
                  threads={userThreads}
                  inquiries={inquiries}
                  language={language}
                  onSelectThread={(thread) => {
                    setActiveThread({
                      threadId: thread.id,
                      recipientName: thread.clientName,
                      recipientPhoto: thread.clientPhoto,
                      matterSubject: thread.matterSubject,
                      aiBriefAttached: thread.aiBriefAttached,
                      aiBriefText: thread.aiBriefText,
                    });
                  }}
                  onAcceptInquiry={handleAcceptInquiry}
                  onDeclineInquiry={handleDeclineInquiry}
                />
              )}

              {lawyerActiveTab === 'fees' && (
                <LawyerFeesPage
                  invoices={invoices}
                  cases={cases}
                  language={language}
                  onSendReminder={(invId, clientName, amt) => {
                    handleSendHearingChatUpdate({
                      caseNumber: 'Fee Invoice',
                      clientName,
                      court: 'Office Accounts',
                      status: 'Payment Reminder',
                      nextDate: 'Immediate',
                      stage: 'Fee Settlement',
                      orderNotes: `Professional fee invoice #${invId} for ₹${amt.toLocaleString('en-IN')} is awaiting settlement. Kindly arrange payment.`,
                    });
                  }}
                  onMarkPaid={handlePayInvoice}
                  onCreateInvoice={(inv) => handleCreateInvoice({ ...inv, id: `inv-${Date.now()}` } as any)}
                />
              )}

              {lawyerActiveTab === 'more' && (
                <MorePage
                  userProfile={profile || undefined}
                  language={language}
                  onSelectLanguage={setLanguage}
                  theme={theme}
                  onToggleTheme={handleToggleTheme}
                  onOpenFirmPortal={currentFirm ? () => setIsFirmPortalOpen(true) : undefined}
                  onOpenIpcToBns={() => setIsIpcModalOpen(true)}
                  onOpenUniversalSearch={() => setIsUniversalSearchOpen(true)}
                  onOpenProfile={() => setIsLawyerProfileOpen(true)}
                  onOpenEmergency={() => setShowEmergencySheet(true)}
                  onSwitchDemo={isDemoUser ? (type: 'firm' | 'student') => loginAsDemo(type) : undefined}
                  onOpenFeedback={() => setIsFeedbackOpen(true)}
                  onSignOut={() => logout()}
                />
              )}
            </>
          ) : (
            <>
              {clientActiveTab === 'case' && (
                <CaseRoomPage
                  cases={cases}
                  activeCase={cases.find(c => normaliseCaseNumber(c.caseNumber) === normaliseCaseNumber(selectedCaseNumber || '')) || cases[0]}
                  hearings={hearings}
                  invoices={invoices}
                  documents={documents}
                  language={language}
                  onSelectCase={(cn) => setSelectedCaseNumber(cn)}
                  onNavigateToHelp={() => setClientActiveTab('help')}
                  onMessageLawyer={() => {
                    setClientActiveTab('messages');
                  }}
                  onUploadDocument={() => {}}
                  onPayInvoice={handlePayInvoice}
                />
              )}

              {clientActiveTab === 'help' && (
                showFullDirectory ? (
                  <div className="space-y-3 p-4">
                    <button
                      type="button"
                      onClick={() => setShowFullDirectory(false)}
                      className="text-xs text-amber-300 font-semibold hover:underline flex items-center gap-1"
                    >
                      ← Back to AI Legal Consultation
                    </button>
                    <ClientLawyerDirectory
                      language={language}
                      onOpenChat={(threadId, lawyer) => {
                        setClientActiveTab('messages');
                        setActiveThread({
                          threadId,
                          recipientName: lawyer.name,
                          recipientPhoto: lawyer.photoURL,
                          matterSubject: `Consultation with ${lawyer.name}`,
                        });
                      }}
                    />
                  </div>
                ) : (
                  <HelpPage
                    lawyers={verifiedLawyers}
                    language={language}
                    onOpenDirectory={() => setShowFullDirectory(true)}
                    onSaveCase={async (profileData) => {
                      const newCaseNum = `CR/${Math.floor(1000 + Math.random() * 9000)}/2026`;
                      const newCase: Omit<CaseFile, 'id'> = {
                        caseNumber: newCaseNum,
                        clientName: profile?.name || 'Client',
                        clientPhone: profile?.phone || '',
                        opponentName: 'Opposing Party',
                        courtLocation: profileData.location || 'Court of Jurisdiction',
                        court: 'District Court',
                        caseType: profileData.legalArea || profileData.matterType || 'Consultation Matter',
                        actSections: ['Relevant Legal Sections'],
                        status: 'Active',
                        stage: 'Admission',
                        filingDate: new Date().toISOString().split('T')[0],
                        nextHearingDate: 'TBD',
                        unreadDocuments: 0,
                        pendingChecklistItems: 0,
                        totalBilled: 0,
                        totalCollected: 0,
                        clientId: user?.uid,
                      };
                      await handleCreateCase(newCase);
                      setSelectedCaseNumber(newCaseNum);
                      setClientActiveTab('case');
                    }}
                    onMessageLawyer={async (lawyer, narrative) => {
                      setClientActiveTab('messages');
                      const lawyerId = (lawyer as any).id || (lawyer as any).uid || 'lawyer';
                      const threadId = await createOrGetDirectThread({
                        lawyerId,
                        lawyerName: lawyer.name,
                        clientId: user?.uid || 'client',
                        clientName: profile?.name || 'Client',
                        matterSubject: `Case Consultation with ${lawyer.name}`,
                        aiBriefText: narrative,
                      });
                      setActiveThread({
                        threadId,
                        recipientName: lawyer.name,
                        recipientPhoto: lawyer.photoURL,
                        matterSubject: `Case Consultation with ${lawyer.name}`,
                        aiBriefAttached: true,
                        aiBriefText: narrative,
                      });
                    }}
                  />
                )
              )}

              {clientActiveTab === 'messages' && (
                <ChatInboxView
                  currentUserId={user?.uid || ''}
                  currentUserRole="client"
                  currentUserName={profile?.name || 'Client'}
                  language={language}
                  cases={cases}
                  hearings={hearings}
                  onSelectThread={(thread) => {
                    setActiveThread({
                      threadId: thread.id,
                      recipientName: thread.lawyerName,
                      recipientPhoto: thread.lawyerPhoto,
                      matterSubject: thread.matterSubject,
                      aiBriefAttached: thread.aiBriefAttached,
                      aiBriefText: thread.aiBriefText,
                    });
                  }}
                  onOpenDirectory={() => setClientActiveTab('help')}
                />
              )}

              {clientActiveTab === 'me' && (
                <ClientMePage
                  userProfile={profile || undefined}
                  language={language}
                  onSelectLanguage={setLanguage}
                  theme={theme}
                  onToggleTheme={handleToggleTheme}
                  onOpenFeedback={() => setIsFeedbackOpen(true)}
                  onSignOut={() => logout()}
                />
              )}
            </>
          )}
        </main>
      )}

      {/* Contextual Extended FAB (O2: hides on Case Detail view to eliminate overlap) */}
      {userRole === 'lawyer' && !activeThread && !(lawyerActiveTab === 'cases' && selectedCaseNumber) && (
        <ContextFab
          activeTab={lawyerActiveTab}
          onAddHearing={() => setShowGlobalAddHearing(true)}
          onNewCase={() => setShowNewCaseSheet(true)}
          onNewInvoice={() => setLawyerActiveTab('fees')}
        />
      )}

      {/* Unified Bottom TabBar */}
      {!activeThread && (
        <UnifiedTabBar
          tabs={userRole === 'lawyer' ? lawyerTabs : clientTabs}
          activeTab={userRole === 'lawyer' ? lawyerActiveTab : clientActiveTab}
          onSelectTab={(tabId) => {
            if (userRole === 'lawyer') {
              setLawyerActiveTab(tabId);
              if (tabId === 'cases') setSelectedCaseNumber(null);
            } else {
              setClientActiveTab(tabId);
              setShowFullDirectory(false);
            }
          }}
          language={language}
          unreadCount={userThreads.reduce((acc, t) => acc + (t.unreadCount || 0), 0)}
        />
      )}

      {/* New Case Sheet for Lawyer */}
      <NewCaseSheet
        open={showNewCaseSheet}
        onOpenChange={setShowNewCaseSheet}
        language={language}
        onSave={async (caseData: Omit<CaseFile, 'id'>) => {
          await handleCreateCase(caseData);
          setShowNewCaseSheet(false);
        }}
      />

      {/* Global Add Hearing Form Sheet */}
      <HearingFormSheet
        open={showGlobalAddHearing}
        onOpenChange={setShowGlobalAddHearing}
        cases={cases}
        language={language}
        onSave={async (hearingData) => {
          await handleAddHearing(hearingData);
          setShowGlobalAddHearing(false);
        }}
      />

      {/* Modals & Dialogs */}
      {isLawyerProfileOpen && (
        <LawyerProfileModal
          isOpen={isLawyerProfileOpen}
          onClose={() => setIsLawyerProfileOpen(false)}
          language={language}
        />
      )}

      {isClientProfileOpen && (
        <ClientProfileModal
          isOpen={isClientProfileOpen}
          onClose={() => setIsClientProfileOpen(false)}
          language={language}
        />
      )}

      {isAdmin && (
        <AdminVerificationDashboard
          isOpen={isAdminDashboardOpen}
          onClose={handleCloseAdminDashboard}
          language={language}
        />
      )}

      {isFeedbackOpen && (
        <CitizenFeedbackModal
          isOpen={isFeedbackOpen}
          onClose={() => setIsFeedbackOpen(false)}
          userId={user?.uid || 'guest'}
          userName={profile?.name || 'Citizen'}
          language={language}
        />
      )}

      {isUniversalSearchOpen && (
        <UniversalSearchModal
          isOpen={isUniversalSearchOpen}
          onClose={() => setIsUniversalSearchOpen(false)}
          onOpenIpcModal={() => setIsIpcModalOpen(true)}
          language={language}
          cases={cases}
          hearings={hearings}
          onSelectCase={(caseNumber) => {
            setIsUniversalSearchOpen(false);
            setSelectedCaseNumber(caseNumber);
            setLawyerActiveTab('cases');
          }}
        />
      )}

      {isIpcModalOpen && (
        <IpcToBnsModal
          isOpen={isIpcModalOpen}
          onClose={() => setIsIpcModalOpen(false)}
          language={language}
        />
      )}

      {/* Firm Portal Modal */}
      {isFirmPortalOpen && currentFirm && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-neutral-900 border border-white/10 rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-y-auto relative p-6">
            <div className="flex items-center justify-between pb-4 border-b border-white/10 mb-4">
              <h2 className="text-lg font-bold text-white font-display">
                {language === 'mr' ? 'लॉ फर्म / चेंबर्स पोर्टल' : language === 'hi' ? 'लॉ फर्म / चैम्बर्स पोर्टल' : 'Law Firm / Chambers Portal'}
              </h2>
              <button
                type="button"
                onClick={() => setIsFirmPortalOpen(false)}
                className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-neutral-400 hover:text-white transition"
              >
                <X size={18} />
              </button>
            </div>
            <FirmPortal
              firm={currentFirm}
              members={firmMembers}
              language={language}
              onAddMember={handleAddFirmMember}
              onRemoveMember={handleRemoveFirmMember}
            />
          </div>
        </div>
      )}

      {/* Emergency & Legal Aid Sheet */}
      <EmergencySheet
        open={showEmergencySheet}
        onOpenChange={setShowEmergencySheet}
        language={language}
      />
    </AndroidFrame>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <AppContent />
      </ToastProvider>
    </AuthProvider>
  );
}
