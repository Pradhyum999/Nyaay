import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  Building,
  Star,
  ArrowUpRight,
  CheckCircle2,
  X,
  Scale,
  Sparkles,
  Gavel,
  BookOpen,
  MessageSquare,
  FileCheck,
  AlertCircle,
  RefreshCw,
  ExternalLink
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import {
  getLawyerDirectory,
  engageAdvocate,
  DEFAULT_VERIFIED_ADVOCATES
} from '../../services/firestoreService';
import { Language, UserProfile, PublicCourtCase } from '../../types';

interface ClientLawyerDirectoryProps {
  language: Language;
  onOpenChat?: (threadId: string, lawyer: UserProfile) => void;
}

export const ClientLawyerDirectory: React.FC<ClientLawyerDirectoryProps> = ({
  language,
  onOpenChat
}) => {
  const { user, profile } = useAuth();

  const [lawyers, setLawyers] = useState<UserProfile[]>(DEFAULT_VERIFIED_ADVOCATES);
  const [loading, setLoading] = useState(false);
  const [selectedLawyer, setSelectedLawyer] = useState<UserProfile | null>(null);
  const [isEngageModalOpen, setIsEngageModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Engagement Form
  const [matterSubject, setMatterSubject] = useState('Urgent Consultation regarding Legal Rights');
  const [attachAIBrief, setAttachAIBrief] = useState(true);
  const [engaging, setEngaging] = useState(false);

  const t = (en: string, hi: string) => language === 'hi' ? hi : en;

  const loadLawyers = async () => {
    setLoading(true);
    try {
      const liveLawyers = await getLawyerDirectory();
      const verifiedLawyers = liveLawyers.filter(l => l.role === 'lawyer' && l.verificationStatus === 'verified');
      setLawyers(verifiedLawyers.length > 0 ? verifiedLawyers : DEFAULT_VERIFIED_ADVOCATES);
    } catch (err) {
      console.warn("Failed to load lawyers from Firestore:", err);
      setLawyers(DEFAULT_VERIFIED_ADVOCATES);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLawyers();
  }, []);

  const handleOpenEngage = (lawyer: UserProfile) => {
    setSelectedLawyer(lawyer);
    setIsEngageModalOpen(true);
  };

  const handleConfirmEngagement = async () => {
    if (!selectedLawyer) return;
    setEngaging(true);
    try {
      const clientId = user?.uid || `client-${Date.now()}`;
      const clientName = profile?.name || 'Citizen Client';
      const clientPhone = profile?.phone || '+91 98765 00000';

      const briefText = attachAIBrief
        ? `Legal Consultation Request: ${matterSubject}. Pre-screened by NYAAYNEETI Legal Intelligence with verified statutory provisions.`
        : undefined;

      const threadId = await engageAdvocate({
        lawyerId: selectedLawyer.uid,
        lawyerName: selectedLawyer.name,
        lawyerEmail: selectedLawyer.email,
        clientId,
        clientName,
        clientPhone,
        matterSubject,
        attachAIBrief,
        aiBriefText: briefText,
      });

      setIsEngageModalOpen(false);
      setToastMessage(t(
        `Engagement confirmed with ${selectedLawyer.name}! Opening direct chat room.`,
        `${selectedLawyer.name} के साथ परामर्श प्रारंभ! चैट खुल रही है।`
      ));

      setTimeout(() => {
        setToastMessage(null);
        if (onOpenChat) {
          onOpenChat(threadId, selectedLawyer);
        }
      }, 1400);
    } catch (err) {
      console.warn("Engagement error:", err);
    } finally {
      setEngaging(false);
    }
  };

  return (
    <div className="flex flex-col gap-5 p-4 sm:p-5 pb-24">
      {/* Toast */}
      {toastMessage && (
        <div className="sticky top-2 z-40 bg-neutral-900/95 text-white border border-emerald-500/40 px-4 py-2.5 rounded-2xl shadow-2xl backdrop-blur-xl flex items-center gap-2 text-xs font-medium animate-in fade-in">
          <CheckCircle2 size={16} className="text-emerald-400 flex-shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <span className="text-[11px] font-semibold tracking-wider uppercase text-neutral-500 dark:text-neutral-400 font-mono">
            {t('Live Directory', 'सत्यापित अधिवक्ता')}
          </span>
          <h1 className="text-2xl font-bold tracking-tight text-neutral-900 dark:text-white mt-0.5">
            {t('Registered Advocates', 'पंजीकृत अधिवक्ता')}
          </h1>
          <p className="text-xs text-neutral-600 dark:text-neutral-400 mt-1">
            {t(
              'Verified advocates practicing before High Courts and District Courts.',
              'उच्च न्यायालयों एवं जिला न्यायालयों के सत्यापित अधिवक्ता।'
            )}
          </p>
        </div>

        <button
          onClick={loadLawyers}
          className="w-8 h-8 rounded-full bg-neutral-100 hover:bg-neutral-200 dark:bg-white/[0.05] dark:hover:bg-white/[0.1] border border-neutral-200 dark:border-white/[0.08] flex items-center justify-center text-neutral-600 hover:text-black dark:text-neutral-400 dark:hover:text-white transition ios-press"
          title="Refresh Directory"
        >
          <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
        </button>
      </div>

      {/* Lawyers List */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-16 space-y-3">
          <div className="w-8 h-8 rounded-full border-2 border-amber-400/40 border-t-amber-400 animate-spin" />
          <p className="text-xs text-neutral-600 dark:text-neutral-400 font-mono">{t('Connecting to advocate registry...', 'अधिवक्ता सूची लोड हो रही है...')}</p>
        </div>
      ) : lawyers.length === 0 ? (
        <div className="bg-neutral-50 dark:bg-white/[0.03] rounded-3xl p-8 text-center space-y-4 border border-neutral-200 dark:border-white/[0.08]">
          <div className="w-14 h-14 rounded-2xl bg-amber-400/15 border border-amber-400/30 flex items-center justify-center mx-auto text-amber-600 dark:text-amber-300">
            <Scale size={24} />
          </div>
          <div>
            <h3 className="text-base font-bold text-neutral-900 dark:text-white">{t('No Advocates Found', 'कोई अधिवक्ता नहीं मिले')}</h3>
            <p className="text-xs text-neutral-600 dark:text-neutral-400 mt-1 max-w-xs mx-auto">
              {t(
                'Advocates registered with Bar Council credentials will appear in this directory.',
                'बार काउंसिल साख के साथ पंजीकृत अधिवक्ता यहाँ दिखाई देंगे।'
              )}
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {lawyers.map(l => (
            <div
              key={l.uid}
              className="bg-white dark:bg-[#0E0F14] rounded-3xl p-5 flex flex-col gap-3.5 border border-neutral-200 dark:border-white/[0.08] hover:border-neutral-300 dark:hover:border-white/20 transition-all shadow-sm"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <img
                    src={l.photoURL || 'https://images.unsplash.com/photo-1556157382-97eda2d62296?w=150&auto=format&fit=crop&q=80'}
                    alt={l.name}
                    className="w-12 h-12 rounded-2xl object-cover border border-neutral-200 dark:border-white/10 shadow-sm"
                  />
                  <div>
                    <div className="flex items-center gap-1.5">
                      <h3 className="text-sm font-bold text-neutral-900 dark:text-white tracking-tight">{l.name}</h3>
                      {l.verificationStatus === 'verified' ? (
                        <div className="flex items-center gap-0.5 bg-emerald-500/15 border border-emerald-500/30 text-emerald-700 dark:text-emerald-400 px-1.5 py-0.5 rounded-full text-[9px] font-semibold">
                          <ShieldCheck size={11} />
                          <span>Verified</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-0.5 bg-amber-500/15 border border-amber-500/30 text-amber-800 dark:text-amber-300 px-1.5 py-0.5 rounded-full text-[9px] font-semibold">
                          <span>Pending Review</span>
                        </div>
                      )}
                    </div>
                    <span className="text-[10px] text-neutral-500 dark:text-neutral-400 font-mono block mt-0.5">
                      {l.barCouncilId || 'BCI Member'} • {l.state || 'Delhi Bar'}
                    </span>
                    <span className="text-xs text-neutral-600 dark:text-neutral-300 mt-0.5 block">
                      {l.experience || 5} {t('Years Active Practice', 'वर्ष अनुभव')}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-1 bg-neutral-100 dark:bg-white/[0.05] border border-neutral-200 dark:border-white/[0.08] px-2.5 py-1 rounded-full text-xs font-bold text-neutral-900 dark:text-white font-mono">
                  <Star size={12} className="text-amber-500 fill-amber-500" />
                  <span>{l.rating || 4.9}</span>
                </div>
              </div>

              {/* Bio snippet */}
              {l.bio && (
                <p className="text-xs text-neutral-600 dark:text-neutral-400 line-clamp-2 leading-relaxed">
                  {l.bio}
                </p>
              )}

              {/* Specialties */}
              {l.practiceAreas && l.practiceAreas.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {l.practiceAreas.map((s, idx) => (
                    <span key={idx} className="text-[10px] px-2.5 py-0.5 rounded-full bg-neutral-100 dark:bg-white/[0.04] text-neutral-700 dark:text-neutral-300 border border-neutral-200 dark:border-white/[0.06] font-medium">
                      {s}
                    </span>
                  ))}
                </div>
              )}

              {/* Practice Courts */}
              {l.practiceCourts && l.practiceCourts.length > 0 && (
                <div className="text-[11px] text-neutral-600 dark:text-neutral-400 flex items-center gap-1.5 pt-1 border-t border-neutral-100 dark:border-white/[0.04]">
                  <Building size={12} className="text-neutral-400 dark:text-neutral-500" />
                  <span className="line-clamp-1">{l.practiceCourts.join(' • ')}</span>
                </div>
              )}

              {/* Actions */}
              <div className="flex items-center gap-2 pt-1">
                <button
                  onClick={() => setSelectedLawyer(l)}
                  className="flex-1 py-2.5 rounded-2xl bg-neutral-100 hover:bg-neutral-200 dark:bg-white/[0.07] dark:hover:bg-white/[0.12] text-neutral-800 dark:text-white font-semibold text-xs border border-neutral-200 dark:border-white/10 transition ios-press"
                >
                  {t('Inspect Past Cases & Portfolio', 'पिछले केस व विवरण देखें')}
                </button>

                <button
                  onClick={() => handleOpenEngage(l)}
                  className="flex-1 py-2.5 rounded-2xl bg-amber-400 hover:bg-amber-300 text-neutral-950 font-bold text-xs flex items-center justify-center gap-1 transition shadow-sm ios-press"
                >
                  <span>{t('Engage Advocate', 'अधिवक्ता नियुक्त करें')}</span>
                  <ArrowUpRight size={13} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Advocate Detailed Portfolio Modal (Public Court Records from eCourts) */}
      {selectedLawyer && !isEngageModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-in fade-in">
          {/* Backdrop */}
          <div
            onClick={() => setSelectedLawyer(null)}
            className="fixed inset-0 bg-neutral-950/70 dark:bg-black/85 backdrop-blur-md"
          />

          <div className="relative z-10 bg-white dark:bg-[#111216] border border-neutral-200 dark:border-white/[0.12] rounded-3xl p-5 max-w-sm w-full space-y-4 max-h-[90vh] overflow-y-auto shadow-2xl text-neutral-900 dark:text-white">
            {/* Header */}
            <div className="flex items-start justify-between border-b border-neutral-100 dark:border-white/[0.08] pb-3">
              <div className="flex items-center gap-3">
                <img
                  src={selectedLawyer.photoURL || 'https://images.unsplash.com/photo-1556157382-97eda2d62296?w=150&auto=format&fit=crop&q=80'}
                  alt={selectedLawyer.name}
                  className="w-12 h-12 rounded-2xl object-cover border border-neutral-200 dark:border-white/10"
                />
                <div>
                  <div className="flex items-center gap-1.5">
                    <h3 className="text-sm font-bold text-neutral-900 dark:text-white tracking-tight">{selectedLawyer.name}</h3>
                    <ShieldCheck size={14} className="text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <p className="text-[10px] text-neutral-500 dark:text-neutral-400 font-mono mt-0.5">
                    {selectedLawyer.barCouncilId} • {selectedLawyer.state}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedLawyer(null)}
                className="w-7 h-7 rounded-full bg-neutral-100 dark:bg-white/[0.06] flex items-center justify-center text-neutral-600 hover:text-black dark:text-neutral-400 dark:hover:text-white transition"
              >
                <X size={15} />
              </button>
            </div>

            {/* Metrics */}
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="bg-neutral-50 dark:bg-black/40 p-3 rounded-2xl border border-neutral-200 dark:border-white/[0.06]">
                <span className="text-neutral-500 dark:text-neutral-400 block text-[10px] uppercase font-semibold">{t('Experience', 'अनुभव')}</span>
                <span className="text-sm font-bold text-neutral-900 dark:text-white font-mono mt-0.5 block">{selectedLawyer.experience || 10} Years</span>
              </div>
              <div className="bg-neutral-50 dark:bg-black/40 p-3 rounded-2xl border border-neutral-200 dark:border-white/[0.06]">
                <span className="text-neutral-500 dark:text-neutral-400 block text-[10px] uppercase font-semibold">{t('Bar Council / State', 'बार काउंसिल / राज्य')}</span>
                <span className="text-sm font-bold text-amber-700 dark:text-amber-300 font-mono mt-0.5 block truncate">
                  {selectedLawyer.state ? `${selectedLawyer.state} Bar` : 'Bar Council'}
                </span>
              </div>
            </div>

            {/* Education */}
            {selectedLawyer.education && selectedLawyer.education.length > 0 && (
              <div>
                <h4 className="text-[11px] font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-1">
                  Education & Qualifications
                </h4>
                <div className="space-y-1">
                  {selectedLawyer.education.map((edu, idx) => (
                    <p key={idx} className="text-xs text-neutral-700 dark:text-neutral-300 bg-neutral-50 dark:bg-black/40 p-2 rounded-xl border border-neutral-200 dark:border-white/[0.04]">
                      🎓 {edu}
                    </p>
                  ))}
                </div>
              </div>
            )}

            {/* Public Court Cases / eCourts Dockets with Provenance & Notes */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-xs font-semibold text-neutral-800 dark:text-neutral-300 uppercase tracking-wider flex items-center gap-1.5">
                  <Gavel size={13} className="text-amber-600 dark:text-amber-300" />
                  <span>{t('Public Court Cases & Judgments', 'सार्वजनिक केस एवं आदेश (eCourts)')}</span>
                </h4>
                <span className="text-[9px] text-neutral-500 font-mono">eCourts Verified</span>
              </div>

              <div className="space-y-2">
                {selectedLawyer.publicCases && selectedLawyer.publicCases.filter(c => c.showOnProfile).length > 0 ? (
                  selectedLawyer.publicCases
                    .filter(c => c.showOnProfile)
                    .map((c) => (
                      <div
                        key={c.id}
                        className="bg-neutral-50 dark:bg-black/40 p-3.5 rounded-2xl border border-neutral-200 dark:border-white/[0.06] space-y-2 text-left"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-[11px] font-mono text-amber-800 dark:text-amber-300 font-bold">{c.caseNumber}</span>
                          {c.cnrNumber && (
                            <a
                              href={c.ecourtsUrl || `https://services.ecourts.gov.in/ecourtindia_v6/?p=casestatus/index&cnr_no=${c.cnrNumber}`}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1 text-[9px] px-2 py-0.5 rounded-full bg-blue-500/15 text-blue-700 dark:text-blue-300 font-mono border border-blue-500/20 hover:bg-blue-500/25"
                              title="Verify on Official eCourts Portal"
                            >
                              <span>CNR: {c.cnrNumber}</span>
                              <ExternalLink size={9} />
                            </a>
                          )}
                        </div>

                        <p className="text-xs font-semibold text-neutral-900 dark:text-white">{c.title}</p>
                        
                        <p className="text-[10px] text-neutral-600 dark:text-neutral-400">
                          {c.court} • {c.year} • {c.stage}
                          {c.benchJudge && <span className="text-neutral-500"> • Bench: {c.benchJudge}</span>}
                        </p>

                        {(c.petitioner || c.respondent) && (
                          <p className="text-[10px] text-neutral-700 dark:text-neutral-400 bg-neutral-100 dark:bg-white/[0.02] px-2 py-1 rounded-lg border border-neutral-200 dark:border-white/[0.04]">
                            <span className="text-neutral-900 dark:text-neutral-300">{c.petitioner || 'Petitioner'}</span>
                            <span className="text-amber-700 dark:text-amber-400/80 mx-1.5 font-bold">vs</span>
                            <span className="text-neutral-900 dark:text-neutral-300">{c.respondent || 'Respondent'}</span>
                          </p>
                        )}

                        {c.judgmentOutcome && (
                          <p className="text-[10px] text-emerald-800 dark:text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-lg border border-emerald-500/20 font-medium">
                            ⚖️ {c.judgmentOutcome}
                          </p>
                        )}

                        {c.advocateNotes && (
                          <p className="text-[10px] text-neutral-700 dark:text-neutral-300 bg-neutral-100 dark:bg-white/[0.02] p-2 rounded-xl border border-neutral-200 dark:border-white/[0.04] italic">
                            <span className="text-neutral-500 font-semibold uppercase not-italic block text-[9px]">Advocate Observation:</span>
                            "{c.advocateNotes}"
                          </p>
                        )}

                        {c.ecourtsUrl && (
                          <div className="pt-1 border-t border-neutral-200 dark:border-white/[0.04] flex justify-end">
                            <a
                              href={c.ecourtsUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1 text-[10px] text-blue-600 dark:text-blue-400 hover:underline"
                            >
                              <span>Verify on Official Court Portal</span>
                              <ExternalLink size={10} />
                            </a>
                          </div>
                        )}
                      </div>
                    ))
                ) : (
                  <p className="text-xs text-neutral-500 italic p-3 bg-neutral-50 dark:bg-black/40 rounded-2xl text-center border border-neutral-200 dark:border-transparent">
                    {t('No public cases marked for public display yet.', 'कोई सार्वजनिक केस प्रदर्शित नहीं')}
                  </p>
                )}
              </div>
            </div>

            {/* Bio */}
            {selectedLawyer.bio && (
              <div>
                <h4 className="text-xs font-semibold text-neutral-800 dark:text-neutral-300 uppercase tracking-wider mb-1">
                  {t('Advocate Bio', 'अधिवक्ता परिचय')}
                </h4>
                <p className="text-xs text-neutral-600 dark:text-neutral-400 leading-relaxed bg-neutral-50 dark:bg-black/40 p-3 rounded-2xl border border-neutral-200 dark:border-white/[0.06]">
                  {selectedLawyer.bio}
                </p>
              </div>
            )}

            {/* Engage Trigger from modal */}
            <button
              onClick={() => handleOpenEngage(selectedLawyer)}
              className="w-full py-3 rounded-2xl bg-amber-400 hover:bg-amber-300 text-neutral-950 text-xs font-bold ios-press flex items-center justify-center gap-1.5 shadow-md transition"
            >
              <span>{t('Engage This Advocate', 'अधिवक्ता नियुक्त करें')}</span>
              <ArrowUpRight size={14} />
            </button>
          </div>
        </div>
      )}

      {/* Engagement & AI Brief Transfer Modal */}
      {isEngageModalOpen && selectedLawyer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-in fade-in">
          {/* Backdrop */}
          <div
            onClick={() => setIsEngageModalOpen(false)}
            className="fixed inset-0 bg-neutral-950/70 dark:bg-black/85 backdrop-blur-md"
          />

          <div className="relative z-10 bg-white dark:bg-[#111216] border border-neutral-200 dark:border-white/[0.12] rounded-3xl p-5 max-w-sm w-full space-y-4 shadow-2xl text-neutral-900 dark:text-white">
            <div className="flex items-center justify-between border-b border-neutral-100 dark:border-white/[0.08] pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-amber-400/20 border border-amber-400/40 flex items-center justify-center text-amber-600 dark:text-amber-300">
                  <Scale size={18} />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-neutral-900 dark:text-white">{t('Engage Advocate', 'अधिवक्ता से जुड़ें')}</h3>
                  <p className="text-[11px] text-neutral-500 dark:text-neutral-400">{selectedLawyer.name}</p>
                </div>
              </div>
              <button
                onClick={() => setIsEngageModalOpen(false)}
                className="w-7 h-7 rounded-full bg-neutral-100 dark:bg-white/[0.06] flex items-center justify-center text-neutral-600 hover:text-black dark:text-neutral-400 dark:hover:text-white transition"
              >
                <X size={15} />
              </button>
            </div>

            {/* Matter Subject */}
            <div>
              <label className="text-neutral-700 dark:text-white/70 text-xs font-semibold mb-1.5 block">
                {t('Case Subject / Dispute Matter *', 'केस का विषय / विवाद विवरण *')}
              </label>
              <input
                type="text"
                value={matterSubject}
                onChange={(e) => setMatterSubject(e.target.value)}
                placeholder="e.g. Cheque Bounce Sec 138 / Bail / Title Dispute"
                className="w-full rounded-xl px-3.5 py-2.5 text-xs bg-neutral-100 dark:bg-black/40 text-neutral-900 dark:text-white placeholder:text-neutral-400 border border-neutral-300 dark:border-white/10 outline-none focus:border-amber-500"
              />
            </div>

            {/* AI Brief Transfer Option */}
            <div className="rounded-2xl p-3.5 border border-neutral-200 dark:border-white/10 space-y-2 bg-neutral-50 dark:bg-white/[0.02]">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Sparkles size={16} className="text-amber-500 dark:text-amber-300" />
                  <span className="text-xs font-semibold text-neutral-900 dark:text-white">
                    {t('Transfer AI Consultation Summary?', 'AI परामर्श सारांश साझा करें?')}
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={attachAIBrief}
                  onChange={(e) => setAttachAIBrief(e.target.checked)}
                  className="w-4 h-4 accent-amber-500 rounded cursor-pointer"
                />
              </div>
              <p className="text-[11px] text-neutral-600 dark:text-neutral-400 leading-relaxed">
                {attachAIBrief
                  ? t('Your AI facts and legal sections will be immediately attached so the lawyer can review your situation.', 'आपके तथ्य और धाराएं वकील को तुरंत भेज दी जाएंगी।')
                  : t('No summary sent now. You can still transfer it anytime during live chat.', 'सारांश अभी नहीं भेजा जाएगा। आप बाद में चैट में भी भेज सकते हैं।')}
              </p>
            </div>

            {/* Notification alert info */}
            <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/25 text-[11px] text-amber-900 dark:text-neutral-300 leading-relaxed font-medium">
              🔔 {t(
                'When you click confirm, the advocate will receive an instant in-app notification & alert to their registered contact, and a direct chat room will open.',
                'अधिवक्ता को ऐप व ईमेल सूचना प्राप्त होगी और सीधी चैट खुल जाएगी।'
              )}
            </div>

            {/* Submit buttons */}
            <div className="flex gap-2 pt-1">
              <button
                onClick={() => setIsEngageModalOpen(false)}
                className="flex-1 py-2.5 rounded-xl bg-neutral-100 hover:bg-neutral-200 dark:bg-white/[0.08] dark:hover:bg-white/[0.12] text-xs font-semibold text-neutral-700 dark:text-neutral-300 ios-press transition"
              >
                {t('Cancel', 'रद्द करें')}
              </button>
              <button
                onClick={handleConfirmEngagement}
                disabled={engaging || !matterSubject.trim()}
                className="flex-1 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-neutral-950 text-xs font-bold ios-press disabled:opacity-40 shadow-sm transition"
              >
                {engaging ? t('Connecting...', 'जुड़ रहे हैं...') : t('Confirm & Start Chat', 'पुष्टि करें और चैट करें')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
