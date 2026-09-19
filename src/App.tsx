import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { AndroidFrame } from './components/AndroidFrame';
import { TopAppBar } from './components/TopAppBar';
import { BottomNavBar, NavTab } from './components/BottomNavBar';
import { ClientBottomNav, ClientNavTab } from './components/client/ClientBottomNav';
import { SpeedDialFAB } from './components/SpeedDialFAB';
import { VirtualCaseDiary } from './components/VirtualCaseDiary';
import { CaseListView } from './components/CaseListView';
import { AIIntakeSummary } from './components/AIIntakeSummary';
import { DocumentManager } from './components/DocumentManager';
import { BillingManager } from './components/BillingManager';
import { CourtAnalyticsAndForum } from './components/CourtAnalyticsAndForum';
import { LawyerProfileModal } from './components/LawyerProfileModal';
import { AuthScreen } from './components/auth/AuthScreen';

// Client Screens
import { ClientAIConsultation } from './components/client/ClientAIConsultation';
import { ClientCaseTracker } from './components/client/ClientCaseTracker';
import { ClientDocumentUpload } from './components/client/ClientDocumentUpload';
import { ClientPaymentView } from './components/client/ClientPaymentView';
import { ClientLawyerDirectory } from './components/client/ClientLawyerDirectory';

import { 
  mockHearings, 
  mockLimitationAlerts, 
  mockCaseFiles, 
  mockDocuments, 
  mockAIBriefs, 
  mockInvoices, 
  mockJudicialAnalytics, 
  mockForumPosts 
} from './data/mockData';
import { Language, UserRole, HearingItem, InvoiceItem, AIIntakeBrief } from './types';

// ── Loading Screen ────────────────────────────────────────────────────────────
function LoadingScreen() {
  return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <div className="text-center space-y-4">
        <div className="w-16 h-16 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center mx-auto animate-pulse">
          <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" />
          </svg>
        </div>
        <p className="text-white text-xl font-bold">Nyaay</p>
        <div className="flex gap-1.5 justify-center">
          {[0, 1, 2].map(i => (
            <div key={i} className="w-2 h-2 rounded-full bg-white/40 animate-bounce" style={{ animationDelay: `${i * 150}ms` }} />
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Main App (inside AuthProvider) ───────────────────────────────────────────
function AppContent() {
  const { user, profile, loading, logout } = useAuth();

  const [language, setLanguage] = useState<Language>('en');
  const [userRole, setUserRole] = useState<UserRole>('client');
  const [lawyerTab, setLawyerTab] = useState<NavTab>('diary');
  const [clientTab, setClientTab] = useState<ClientNavTab>('consult');

  // Auth state
  const [showAuth, setShowAuth] = useState(false);
  
  // Modals
  const [isProfileOpen, setIsProfileOpen] = useState<boolean>(false);

  // Data states (still using mock for non-AI features, Firestore for real saves)
  const [hearings, setHearings] = useState<HearingItem[]>(mockHearings);
  const [limitationAlerts] = useState(mockLimitationAlerts);
  const [cases] = useState(mockCaseFiles);
  const [documents, setDocuments] = useState(mockDocuments);
  const [invoices, setInvoices] = useState<InvoiceItem[]>(mockInvoices);
  const [aiBriefs, setAiBriefs] = useState<AIIntakeBrief[]>(mockAIBriefs);

  // Sync user role from profile when auth state changes
  useEffect(() => {
    if (profile?.role) {
      setUserRole(profile.role === 'junior' ? 'lawyer' : profile.role);
    }
  }, [profile]);

  // Auto-show auth on startup if no user
  useEffect(() => {
    if (!loading && !user) {
      setShowAuth(true);
    }
  }, [loading, user]);

  if (loading) return <LoadingScreen />;

  // ── Auth Screen (shown when not logged in) ─────────────────────────────────
  if (showAuth && !user) {
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
        />
      </AndroidFrame>
    );
  }

  const handleToggleLanguage = () => setLanguage(prev => prev === 'en' ? 'hi' : 'en');
  const handleToggleRole = () => setUserRole(prev => prev === 'lawyer' ? 'client' : 'lawyer');

  const handleUpdateHearingOrder = (hearingId: string, orderNotes: string, nextDate: string) => {
    setHearings(prev => prev.map(h => {
      if (h.id === hearingId) {
        return {
          ...h,
          previousOrderSummaryEn: orderNotes,
          previousOrderSummaryHi: orderNotes,
          hearingDate: `${nextDate}, 10:30 AM`
        };
      }
      return h;
    }));
  };

  const handlePayInvoice = (invoiceId: string) => {
    setInvoices(prev => prev.map(inv => {
      if (inv.id === invoiceId) {
        return {
          ...inv,
          status: 'Paid',
          paidVia: 'UPI',
          upiRef: `UPI/${Date.now().toString().slice(-10)}/AXIS`
        };
      }
      return inv;
    }));
  };

  const handleCreateInvoice = (newInv: InvoiceItem) => {
    setInvoices(prev => [newInv, ...prev]);
  };

  const handleUploadDocument = (docId: string) => {
    setDocuments(prev => prev.map(doc => {
      if (doc.id === docId) {
        return { ...doc, status: 'Verified', uploadedAt: 'Just now' };
      }
      return doc;
    }));
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

  const handleClientShareBrief = (brief: AIIntakeBrief) => {
    setAiBriefs(prev => [brief, ...prev]);
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
      onToggleRole={handleToggleRole}
    >
      <TopAppBar
        language={language}
        userRole={userRole}
        onOpenProfile={() => userRole === 'lawyer' ? setIsProfileOpen(true) : setShowAuth(true)}
        urgentAlertCount={limitationAlerts.filter(a => a.severity === 'critical').length}
      />

      <main className="flex-1">
        {userRole === 'lawyer' ? (
          <>
            {lawyerTab === 'diary' && (
              <VirtualCaseDiary
                hearings={hearings}
                limitationAlerts={limitationAlerts}
                language={language}
                onUpdateHearingOrder={handleUpdateHearingOrder}
                onOpenCaseDetails={() => setLawyerTab('cases')}
              />
            )}

            {lawyerTab === 'cases' && (
              <div className="flex flex-col">
                <CaseListView
                  cases={cases}
                  language={language}
                  onSelectCase={() => {}}
                />
                <DocumentManager
                  documents={documents}
                  language={language}
                  onUploadDocument={handleUploadDocument}
                />
              </div>
            )}

            {lawyerTab === 'aibriefs' && (
              <AIIntakeSummary
                briefs={aiBriefs}
                language={language}
                onAcceptCase={handleAcceptAICase}
              />
            )}

            {lawyerTab === 'billing' && (
              <BillingManager
                invoices={invoices}
                language={language}
                onPayInvoice={handlePayInvoice}
                onCreateInvoice={handleCreateInvoice}
              />
            )}

            {lawyerTab === 'community' && (
              <CourtAnalyticsAndForum
                analytics={mockJudicialAnalytics}
                posts={mockForumPosts}
                language={language}
              />
            )}
          </>
        ) : (
          <>
            {clientTab === 'consult' && (
              <ClientAIConsultation
                language={language}
              />
            )}

            {clientTab === 'mycase' && (
              <ClientCaseTracker
                activeCase={cases[0]}
                latestHearing={hearings[0]}
                language={language}
                onNavigateToDocs={() => setClientTab('docs')}
                onNavigateToPay={() => setClientTab('payments')}
              />
            )}

            {clientTab === 'docs' && (
              <ClientDocumentUpload
                documents={documents}
                language={language}
                onUploadDocument={handleUploadDocument}
              />
            )}

            {clientTab === 'payments' && (
              <ClientPaymentView
                invoices={invoices}
                language={language}
                onPayInvoice={handlePayInvoice}
              />
            )}

            {clientTab === 'lawyers' && (
              <ClientLawyerDirectory
                language={language}
              />
            )}
          </>
        )}
      </main>

      {userRole === 'lawyer' && (
        <SpeedDialFAB language={language} onAction={handleFABAction} />
      )}

      {userRole === 'lawyer' ? (
        <BottomNavBar
          activeTab={lawyerTab}
          onSelectTab={setLawyerTab}
          language={language}
        />
      ) : (
        <ClientBottomNav
          activeTab={clientTab}
          onSelectTab={setClientTab}
          language={language}
        />
      )}

      <LawyerProfileModal
        isOpen={isProfileOpen}
        onClose={() => setIsProfileOpen(false)}
        language={language}
      />
    </AndroidFrame>
  );
}

// ── Root with Providers ───────────────────────────────────────────────────────
export function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
