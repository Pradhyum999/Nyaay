import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { AndroidFrame } from './components/AndroidFrame';
import { TopAppBar } from './components/TopAppBar';
import { BottomNavBar, NavTab } from './components/BottomNavBar';
import { ClientBottomNav, ClientNavTab } from './components/client/ClientBottomNav';
import { SpeedDialFAB } from './components/SpeedDialFAB';
import { VirtualCaseDiary } from './components/VirtualCaseDiary';
import { CaseListView } from './components/CaseListView';
import { LawyerHomeDashboard } from './components/lawyer/LawyerHomeDashboard';
import { AIIntakeSummary } from './components/AIIntakeSummary';
import { BillingManager } from './components/BillingManager';
import { CourtAnalyticsAndForum } from './components/CourtAnalyticsAndForum';
import { LawyerProfileModal } from './components/LawyerProfileModal';
import { ClientProfileModal } from './components/client/ClientProfileModal';
import { AdminVerificationDashboard } from './components/admin/AdminVerificationDashboard';
import { AuthScreen } from './components/auth/AuthScreen';

import { ClientAIConsultation } from './components/client/ClientAIConsultation';
import { ClientCaseTracker } from './components/client/ClientCaseTracker';
import { ClientDocumentUpload } from './components/client/ClientDocumentUpload';
import { ClientPaymentView } from './components/client/ClientPaymentView';
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
import { flags } from './config/flags';
import { lawyerTabs, clientTabs } from './config/nav';
import { normaliseCaseNumber } from './lib/caseNumber';


// Firestore Realtime Services & Auto-Seeding
import {
  subscribeToCases,
  subscribeToHearings,
  subscribeToInvoices,
  subscribeToDocuments,
  subscribeToForumPosts,
  subscribeToUserNotifications,
  subscribeToUserThreads,
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
  mockHearings,
  mockLimitationAlerts,
  mockCaseFiles,
  mockDocuments,
  mockInvoices
} from './data/mockData';

import {
  Language,
  ThemeMode,
  UserRole,
  HearingItem,
  InvoiceItem,
  AIIntakeBrief,
  CaseFile,
  DocumentItem,
  ForumPost,
  LimitationAlert,
  UserProfile,
  AppNotification,
  DirectThread,
  FirmProfile,
  FirmMember
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
        <div className="flex gap-1.5 justify-center pt-2">
          {[0, 1, 2].map(i => (
            <div key={i} className="w-2 h-2 rounded-full bg-amber-400/60 animate-bounce" style={{ animationDelay: `${i * 150}ms` }} />
          ))}
        </div>

        {showRetry && (
          <div className="pt-3 animate-in fade-in">
            <button
              onClick={() => window.location.reload()}
              className="px-3.5 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-white text-xs font-semibold transition ios-press"
            >
              Taking a moment? Tap to Refresh
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Main App Content ──────────────────────────────────────────────────────────
function AppContent() {
  const { user, profile, loading, updateProfile, logout } = useAuth();

  const [language, setLanguage] = useState<Language>('en');
  const [theme, setTheme] = useState<ThemeMode>(() => {
    return (localStorage.getItem('nyaay_theme') as ThemeMode) || 'bnw';
  });
  const [userRole, setUserRole] = useState<UserRole>('client');
  const [lawyerTab, setLawyerTab] = useState<NavTab>('home');
  const [clientTab, setClientTab] = useState<ClientNavTab>('consult');

  // New UX Refactor State
  const [lawyerActiveTab, setLawyerActiveTab] = useState<string>('today');
  const [clientActiveTab, setClientActiveTab] = useState<string>('case');
  const [selectedCaseNumber, setSelectedCaseNumber] = useState<string | null>(null);
  const [showNewCaseSheet, setShowNewCaseSheet] = useState<boolean>(false);
  const [showGlobalAddHearing, setShowGlobalAddHearing] = useState<boolean>(false);
  const [verifiedLawyers, setVerifiedLawyers] = useState<UserProfile[]>([]);
  const [showFullDirectory, setShowFullDirectory] = useState<boolean>(false);

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
    const newCase: Omit<CaseFile, 'id'> = {
      caseNumber: newCaseNum,
      clientName: inq.clientName,
      clientPhone: inq.clientPhone || '',
      opponentName: 'State / Respondent',
      courtLocation: 'Tis Hazari District Court',
      court: 'District Court',
      caseType: inq.legalArea,
      actSections: ['Relevant Legal Sections'],
      status: 'Active',
      stage: 'Admission',
      filingDate: new Date().toISOString().split('T')[0],
      nextHearingDate: 'TBD',
      unreadDocuments: 0,
      pendingChecklistItems: 0,
      totalBilled: 25000,
      totalCollected: 0,
    };
    await handleCreateCase(newCase);
    setLawyerActiveTab('cases');
    setSelectedCaseNumber(newCaseNum);
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

  // Sync theme with HTML data attribute and storage
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('nyaay_theme', theme);
  }, [theme]);

  const handleToggleTheme = () => {
    setTheme(prev => prev === 'bnw' ? 'dark' : prev === 'dark' ? 'light' : 'bnw');
  };

  // Admin session authentication
  const [adminSessionAuthenticated, setAdminSessionAuthenticated] = useState<boolean>(() => {
    return sessionStorage.getItem('nyaay_admin_authenticated') === 'true';
  });

  // Admin authorization: designated admin email pradhumb1998@gmail.com, or ?admin=true override, or authenticated admin portal session
  const isAdmin = user?.email === 'pradhumb1998@gmail.com' || 
                  profile?.email === 'pradhumb1998@gmail.com' || 
                  adminSessionAuthenticated ||
                  window.location.search.includes('admin=true');

  // Handle URL query parameters for Admin One-Click Actions (e.g. from verification email)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const adminAction = params.get('adminAction');
    const reqId = params.get('reqId');

    if (adminAction && reqId) {
      const runAdminUrlAction = async () => {
        try {
          if (adminAction === 'approve') {
            await processVerificationRequest(reqId, 'verified', 'Approved via Direct Admin Email Action');
            alert(`✅ Verification request #${reqId} has been successfully APPROVED.`);
          } else if (adminAction === 'reject') {
            const reason = prompt('Please provide a reason for rejecting this verification request:', 'Document details did not match official registry.') || 'Document rejected by administrator';
            await processVerificationRequest(reqId, 'rejected', reason);
            alert(`❌ Verification request #${reqId} has been REJECTED.`);
          }
          // Clean URL params without page reload
          const cleanUrl = window.location.origin + window.location.pathname;
          window.history.replaceState({}, document.title, cleanUrl);
        } catch (err) {
          console.error("Error processing admin action from URL:", err);
        }
      };
      runAdminUrlAction();
    }
  }, []);

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

  // Database States (no fake mock fallbacks for authenticated users)
  const [hearings, setHearings] = useState<HearingItem[]>([]);
  const [limitationAlerts, setLimitationAlerts] = useState<LimitationAlert[]>([]);
  const [cases, setCases] = useState<CaseFile[]>([]);
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [invoices, setInvoices] = useState<InvoiceItem[]>([]);
  const [aiBriefs, setAiBriefs] = useState<AIIntakeBrief[]>([]);
  const [forumPosts, setForumPosts] = useState<ForumPost[]>([]);

  // Firm Profile & Members state
  const [currentFirm, setCurrentFirm] = useState<FirmProfile | null>(null);
  const [firmMembers, setFirmMembers] = useState<FirmMember[]>([]);

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

  // Load and subscribe to Firm details
  useEffect(() => {
    if (!user) return;
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
  }, [user]);

  // Prompt auth if not logged in
  useEffect(() => {
    if (!loading && !user) {
      setShowAuth(true);
    }
  }, [loading, user]);

  // ── Firestore Realtime Subscriptions ────────────────────────────────────────
  useEffect(() => {
    if (!user) return;

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

    // 6. Subscribe to In-App Notifications
    const unsubNotifs = subscribeToUserNotifications(user.uid, (liveNotifs) => {
      setNotifications(liveNotifs);
    });

    // 7. Subscribe to User Direct Threads
    const unsubThreads = subscribeToUserThreads(user.uid, userRole, (liveThreads) => {
      setUserThreads(liveThreads);
    });

    return () => {
      unsubHearings();
      unsubCases();
      unsubInvoices();
      unsubDocuments();
      unsubForum();
      unsubNotifs();
      unsubThreads();
    };
  }, [user, userRole]);

  if (loading) return <LoadingScreen />;

  const handleCloseAdminDashboard = () => {
    setIsAdminDashboardOpen(false);
    setAdminSessionAuthenticated(false);
    sessionStorage.removeItem('nyaay_admin_authenticated');
  };

  // ── Mandatory Authentication & Onboarding Gate ──────────────────────────────
  // Signup details should ONLY be asked once:
  // - For advocate: verified with email AND bar council ID!
  // - For citizen: verified with email AND completed onboarding!
  const isAlreadySignedUp = Boolean(
    (profile?.role === 'lawyer' && profile?.email && profile?.barCouncilId && profile.barCouncilId.trim().length > 0) ||
    (profile?.role === 'client' && profile?.email && profile?.onboardingCompleted === true)
  );

  const needsAuthOrOnboarding = !user || !isAlreadySignedUp;

  if (needsAuthOrOnboarding) {
    return (
      <AndroidFrame
        activeLanguage={language}
        onToggleLanguage={() => setLanguage(prev => prev === 'en' ? 'hi' : 'en')}
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
          onAdminSuccess={() => {
            setAdminSessionAuthenticated(true);
            sessionStorage.setItem('nyaay_admin_authenticated', 'true');
            setIsAdminDashboardOpen(true);
          }}
        />

        <AdminVerificationDashboard
          isOpen={isAdminDashboardOpen}
          onClose={handleCloseAdminDashboard}
          language={language}
        />
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
          hearingDate: `${nextDate}, 10:30 AM`
        };
      }
      return h;
    }));

    // Live sync to client's case records so it's immediately visible in "My Case" tab
    setCases(prev => prev.map(c => {
      if (!matchedCaseNumber || c.caseNumber === matchedCaseNumber) {
        return {
          ...c,
          nextHearingDate: nextDate,
          orderNotes: orderNotes,
        };
      }
      return c;
    }));

    try {
      await updateHearingRecord(hearingId, orderNotes, nextDate);
      if (user?.uid) {
        const matchedCase = cases.find(c => c.caseNumber === matchedCaseNumber);
        await addNotification({
          recipientId: matchedCase?.clientId || user.uid,
          type: 'engagement',
          title: language === 'mr' ? 'सुनावणी आदेश अद्यतनित' : language === 'hi' ? 'अदालत आदेश अपडेट' : 'Court Order & Next Date Updated',
          message: `${orderNotes || 'Order logged'}. Next date: ${nextDate}`,
          read: false,
          createdAt: new Date().toISOString(),
        });
      }
    } catch {
      // Local optimistic state preserved
    }
  };

  // Add Hearing to Daily Cause List
  const handleAddHearing = async (newHearingData: Omit<HearingItem, 'id'>) => {
    const tempId = `hr-${Date.now()}`;
    const newHearing: HearingItem = {
      id: tempId,
      ...newHearingData,
      caseNumber: normaliseCaseNumber(newHearingData.caseNumber),
    };
    setHearings(prev => [newHearing, ...prev]);

    try {
      if (user) {
        await addHearingRecord({
          ...newHearingData,
          caseNumber: normaliseCaseNumber(newHearingData.caseNumber),
          lawyerId: user.uid
        });
      }
    } catch {
      // Local optimistic state preserved
    }
  };

  // Interlinked Client Chat Update for Hearings
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
    const clientId = matchedCase?.clientId || user?.uid || 'client';
    const clientName = params.clientName || matchedCase?.clientName || 'Client';
    const advocateName = profile?.name || user?.displayName || 'Advocate Counsel';

    const updateText = `🏛️ **Court Hearing Update — ${normalisedTarget}**\n\n` +
      `• **Court**: ${params.court}\n` +
      `• **Outcome / Status**: ${params.status}\n` +
      `• **Next Hearing Date**: ${params.nextDate}, 10:30 AM\n` +
      `• **Next Stage**: ${params.stage}\n` +
      (params.orderNotes ? `• **Judicial Order**: "${params.orderNotes}"\n\n` : '\n') +
      `📌 *Case Diary has been updated and scheduled for the next date.*`;

    // 1. Send into direct chat thread
    try {
      if (user) {
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

    // 2. Dispatch in-app notification for client
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

  // Upload document with verification toggle
  const handleUploadDocument = async (docId: string) => {
    setDocuments(prev => prev.map(doc => {
      if (doc.id === docId) {
        return { ...doc, status: 'Verified', uploadedAt: 'Just now' };
      }
      return doc;
    }));

    try {
      await updateDocumentVerification(docId, 'Verified');
    } catch {
      // Local optimistic state preserved
    }
  };

  const handleAcceptAICase = (brief: AIIntakeBrief) => {
    const newHearing: HearingItem = {
      id: `hr-${Date.now()}`,
      caseNumber: `CC/${Math.floor(2000 + Math.random() * 8000)}/2026`,
      clientName: brief.clientName,
      courtName: 'Tis Hazari District Court (MM-04)',
      itemNumber: hearings.length + 1,
      courtRoom: 'Court No. 102',
      judgeName: 'Ld. Chief Metropolitan Magistrate',
      stage: 'Admission',
      hearingDate: '26 Sep 2026, 10:30 AM',
      hearingTime: '10:30 AM',
      purposeEn: brief.briefTitleEn,
      purposeHi: brief.briefTitleHi
    };
    setHearings(prev => [newHearing, ...prev]);
  };

  const handleAddFirmMember = async (member: Omit<FirmMember, 'id' | 'firmId' | 'joinedAt'>) => {
    if (!currentFirm) return;
    const newId = await addFirmMember(currentFirm.id, member);
    setFirmMembers(prev => [
      ...prev,
      { ...member, id: newId, firmId: currentFirm.id, joinedAt: new Date().toISOString() }
    ]);
  };

  const handleRemoveFirmMember = async (memberId: string) => {
    if (!currentFirm) return;
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

  const handleFABAction = (actionType: 'addHearing' | 'newInvoice' | 'uploadDoc' | 'aiConsult') => {
    if (actionType === 'addHearing') setLawyerTab('diary');
    else if (actionType === 'newInvoice') setLawyerTab('billing');
    else if (actionType === 'uploadDoc') setLawyerTab('cases');
    else if (actionType === 'aiConsult') setLawyerTab('aibriefs');
  };

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
        notifications={notifications}
        unreadAlertCount={limitationAlerts.filter(a => a.severity === 'critical').length}
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
                  onNavigateToCases={() => {
                    setLawyerActiveTab('cases');
                    setSelectedCaseNumber(null);
                  }}
                  onOpenCase={(caseNumber) => {
                    setLawyerActiveTab('cases');
                    setSelectedCaseNumber(caseNumber);
                  }}
                  onMessageClient={(caseNumber, clientName) => {
                    setActiveThread({
                      threadId: `thread-case-${caseNumber.replace(/[^a-zA-Z0-9]/g, '')}`,
                      recipientName: clientName,
                      matterSubject: `Case: ${caseNumber}`,
                    });
                  }}
                  onUpdateHearingOrder={handleUpdateHearingOrder}
                  onAddHearing={handleAddHearing}
                  onSendHearingChatUpdate={handleSendHearingChatUpdate}
                />
              )}

              {lawyerActiveTab === 'cases' && (
                selectedCaseNumber ? (
                  <CaseDetailPage
                    caseFile={cases.find(c => c.caseNumber === selectedCaseNumber) || cases[0]}
                    hearings={hearings}
                    invoices={invoices}
                    language={language}
                    onBack={() => setSelectedCaseNumber(null)}
                    onMessageClient={(caseNumber, clientName) => {
                      setActiveThread({
                        threadId: `thread-case-${caseNumber.replace(/[^a-zA-Z0-9]/g, '')}`,
                        recipientName: clientName,
                        matterSubject: `Case Dossier: ${caseNumber}`,
                      });
                    }}
                    onUpdateHearingOrder={handleUpdateHearingOrder}
                    onAddHearing={handleAddHearing}
                    onSendHearingChatUpdate={handleSendHearingChatUpdate}
                    onNewInvoice={() => setLawyerActiveTab('fees')}
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
                  onDeclineInquiry={() => {}}
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
                  onOpenFirmPortal={currentFirm ? () => setIsLawyerProfileOpen(true) : undefined}
                  onOpenIpcToBns={() => setIsIpcModalOpen(true)}
                  onOpenUniversalSearch={() => setIsUniversalSearchOpen(true)}
                  onOpenProfile={() => setIsLawyerProfileOpen(true)}
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
                  activeCase={cases[0]}
                  hearings={hearings}
                  invoices={invoices}
                  language={language}
                  onSelectCase={() => {}}
                  onNavigateToHelp={() => setClientActiveTab('help')}
                  onMessageLawyer={() => {
                    setClientActiveTab('messages');
                  }}
                  onUploadDocument={() => handleUploadDocument('doc-1')}
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
                    onMessageLawyer={(lawyer, narrative) => {
                      setClientActiveTab('messages');
                      const threadId = `thread-match-${Date.now()}`;
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
                  onOpenProfile={() => setIsClientProfileOpen(true)}
                  onOpenFeedback={() => setIsFeedbackOpen(true)}
                  onSignOut={() => logout()}
                />
              )}
            </>
          )}
        </main>
      )}

      {/* Contextual Extended FAB per Section 9.7 (Fitts's Law) */}
      {userRole === 'lawyer' && !activeThread && (
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
          unreadCount={userThreads.length}
        />
      )}

      {/* New Case Sheet for Lawyer */}
      <NewCaseSheet
        open={showNewCaseSheet}
        onOpenChange={setShowNewCaseSheet}
        language={language}
        onSave={handleCreateCase}
      />

      {/* Global Add Hearing Sheet (opened via FAB or Today) */}
      <HearingFormSheet
        open={showGlobalAddHearing}
        onOpenChange={setShowGlobalAddHearing}
        cases={cases}
        language={language}
        onSave={hearing => {
          handleAddHearing(hearing);
          setShowGlobalAddHearing(false);
        }}
      />

      <LawyerProfileModal
        isOpen={isLawyerProfileOpen}
        onClose={() => setIsLawyerProfileOpen(false)}
        language={language}
      />

      <ClientProfileModal
        isOpen={isClientProfileOpen}
        onClose={() => setIsClientProfileOpen(false)}
        language={language}
        onOpenFeedback={() => setIsFeedbackOpen(true)}
      />

      <CitizenFeedbackModal
        isOpen={isFeedbackOpen}
        onClose={() => setIsFeedbackOpen(false)}
        userId={user?.uid || 'guest'}
        userName={profile?.name || 'Citizen'}
        language={language}
      />

      <AdminVerificationDashboard
        isOpen={isAdminDashboardOpen}
        onClose={handleCloseAdminDashboard}
        language={language}
      />

      <UniversalSearchModal
        isOpen={isUniversalSearchOpen}
        onClose={() => setIsUniversalSearchOpen(false)}
        cases={cases}
        hearings={hearings}
        language={language}
        onSelectCase={(caseNo) => {
          if (userRole === 'lawyer') {
            setLawyerTab('cases');
          } else {
            setClientTab('mycase');
          }
        }}
        onOpenIpcModal={() => setIsIpcModalOpen(true)}
      />

      <IpcToBnsModal
        isOpen={isIpcModalOpen}
        onClose={() => setIsIpcModalOpen(false)}
        language={language}
      />
    </AndroidFrame>
  );
}

// ── Root Provider ─────────────────────────────────────────────────────────────
export function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <AppContent />
      </ToastProvider>
    </AuthProvider>
  );
}

export default App;
