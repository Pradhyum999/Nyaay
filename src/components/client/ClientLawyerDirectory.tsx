import React, { useState, useEffect, useMemo } from 'react';
import {
  ShieldCheck,
  Building,
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
  ExternalLink,
  SlidersHorizontal,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import {
  getLawyerDirectory,
  engageAdvocate,
  DEFAULT_VERIFIED_ADVOCATES,
} from '../../services/firestoreService';
import { Language, UserProfile, CaseProfile, CaseFile } from '../../types';
import { matchLawyers, LawyerMatch } from '../../services/lawyerMatching';
import { renderPreparedClientPacket, CaseRoomContext } from '../../lib/ai';

interface ClientLawyerDirectoryProps {
  language: Language;
  profile?: CaseProfile | null;
  activeCase?: CaseFile | null;
  onOpenChat?: (threadId: string, lawyer: UserProfile) => void;
}

export const ClientLawyerDirectory: React.FC<ClientLawyerDirectoryProps> = ({
  language,
  profile,
  activeCase,
  onOpenChat,
}) => {
  const { user, profile: userProfile } = useAuth();

  const [lawyers, setLawyers] = useState<UserProfile[]>(DEFAULT_VERIFIED_ADVOCATES);
  const [loading, setLoading] = useState(false);
  const [selectedLawyer, setSelectedLawyer] = useState<UserProfile | null>(null);
  const [isEngageModalOpen, setIsEngageModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Filter state
  const [selectedPracticeArea, setSelectedPracticeArea] = useState<string>('All');

  // Effective case profile from props
  const effectiveProfile: CaseProfile | undefined = profile || activeCase?.profile;

  // Compute objective verified-profile matching (BCI-compliant)
  const matchesMap = useMemo(() => {
    if (!effectiveProfile) return new Map<string, LawyerMatch>();
    const matches = matchLawyers(effectiveProfile, lawyers, lawyers.length);
    const map = new Map<string, LawyerMatch>();
    matches.forEach(m => {
      const key = m.lawyer.uid || m.lawyer.name;
      map.set(key, m);
    });
    return map;
  }, [effectiveProfile, lawyers]);

  // Sort lawyers: matched advocates with highest score first, then by experience
  const sortedLawyers = useMemo(() => {
    let list = [...lawyers];
    if (selectedPracticeArea !== 'All') {
      list = list.filter(l =>
        l.practiceAreas?.some(p => p.toLowerCase().includes(selectedPracticeArea.toLowerCase()))
      );
    }

    if (effectiveProfile && matchesMap.size > 0) {
      list.sort((a, b) => {
        const keyA = a.uid || a.name;
        const keyB = b.uid || b.name;
        const scoreA = matchesMap.get(keyA)?.score ?? 0;
        const scoreB = matchesMap.get(keyB)?.score ?? 0;
        return scoreB - scoreA;
      });
    }
    return list;
  }, [lawyers, selectedPracticeArea, effectiveProfile, matchesMap]);

  // Engagement Form
  const [matterSubject, setMatterSubject] = useState(
    effectiveProfile?.matterType || 'Urgent Consultation regarding Legal Rights'
  );
  const [attachAIBrief, setAttachAIBrief] = useState(true);
  const [engaging, setEngaging] = useState(false);

  const t = (en: string, hi: string, mr?: string) =>
    language === 'mr' && mr ? mr : language === 'hi' ? hi : en;

  const loadLawyers = async () => {
    setLoading(true);
    try {
      const liveLawyers = await getLawyerDirectory();
      const verifiedLawyers = liveLawyers.filter(
        l => l.role === 'lawyer' && l.verificationStatus === 'verified'
      );
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

  useEffect(() => {
    if (effectiveProfile?.matterType) {
      setMatterSubject(effectiveProfile.matterType);
    }
  }, [effectiveProfile]);

  const handleOpenEngage = (lawyer: UserProfile) => {
    setSelectedLawyer(lawyer);
    setIsEngageModalOpen(true);
  };

  const handleConfirmEngagement = async () => {
    if (!selectedLawyer) return;
    setEngaging(true);
    try {
      const clientId = user?.uid || `client-${Date.now()}`;
      const clientName = userProfile?.name || 'Citizen Client';
      const clientPhone = userProfile?.phone || '+91 98765 00000';

      // Generate structured packet if profile is present
      let briefText: string | undefined = undefined;
      if (attachAIBrief) {
        if (effectiveProfile) {
          const cNum = activeCase ? activeCase.caseNumber : 'Intake Docket';
          const ctx: CaseRoomContext = {
            caseFile: activeCase || ({
              id: 'case-intake',
              caseNumber: cNum,
              clientName,
              clientPhone,
              opponentName: 'Opposing Party',
              court: 'District Court',
              courtLocation: effectiveProfile.location || 'India',
              actSections: [],
              caseType: effectiveProfile.matterType || 'Legal Matter',
              filingDate: new Date().toISOString().split('T')[0],
              nextHearingDate: 'TBD',
              status: 'Active',
              unreadDocuments: 0,
              pendingChecklistItems: effectiveProfile.documentsRequired?.length || 0,
              totalBilled: 0,
              totalCollected: 0,
              profile: effectiveProfile,
            } as any),
            hearings: [],
            documents: (effectiveProfile.documentsRequired || []).map((d, i) => ({
              id: `doc-${i}`,
              caseNumber: 'Intake',
              titleEn: d,
              status: 'Required',
            })),
            invoices: [],
            tasks: [],
            timeline: [],
          };
          briefText = renderPreparedClientPacket(ctx);
        } else {
          briefText = `Legal Consultation Request: ${matterSubject}. Pre-screened by NYAAYNEETI Legal Intelligence with verified statutory provisions.`;
        }
      }

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
      setToastMessage(
        t(
          `Engagement confirmed with ${selectedLawyer.name}! Opening direct chat room.`,
          `${selectedLawyer.name} के साथ परामर्श प्रारंभ! चैट खुल रही है।`,
          `${selectedLawyer.name} यांच्याशी थेट संपर्क सुरू झाला आहे!`
        )
      );

      setTimeout(() => {
        setToastMessage(null);
        if (onOpenChat) {
          onOpenChat(threadId, selectedLawyer);
        }
      }, 1200);
    } catch (err) {
      console.warn("Engagement error:", err);
    } finally {
      setEngaging(false);
    }
  };

  // Practice areas for filter pills
  const allPracticeAreas = [
    'All',
    'Criminal',
    'Civil',
    'Commercial',
    'Family',
    'Property',
    'Labor',
  ];

  return (
    <div className="flex flex-col gap-4 p-4 sm:p-5 pb-24 text-main max-w-4xl mx-auto w-full">
      {/* Toast */}
      {toastMessage && (
        <div className="fixed top-5 left-1/2 -translate-x-1/2 z-50 bg-emerald-600 text-white px-4 py-2.5 rounded-2xl shadow-xl text-xs font-semibold animate-in fade-in flex items-center gap-2">
          <CheckCircle2 size={16} />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-neutral-200 dark:border-white/[0.08] pb-4">
        <div>
          <h1 className="text-xl font-bold font-display text-main">
            {t('Verified Advocate Directory', 'सत्यापित अधिवक्ता डायरेक्टरी', 'पडताळणी झालेले वकील')}
          </h1>
          <p className="text-xs text-sub mt-0.5">
            {t(
              'Browse licensed advocates verified with the Bar Council of India',
              'बार काउंसिल ऑफ इंडिया से सत्यापित वकीलों की सूची',
              'बार कौन्सिल ऑफ इंडियाकडे नोंदणीकृत प्रमाणित वकील'
            )}
          </p>
        </div>

        <button
          onClick={loadLawyers}
          disabled={loading}
          className="self-start sm:self-center px-3 py-1.5 rounded-xl bg-neutral-100 dark:bg-white/[0.06] hover:bg-neutral-200 dark:hover:bg-white/[0.1] text-sub hover:text-main text-xs font-mono flex items-center gap-1.5 transition"
        >
          <RefreshCw size={12} className={loading ? 'animate-spin' : ''} />
          <span>{t('Refresh', 'ताज़ा करें', 'रिफ्रेश')}</span>
        </button>
      </div>

      {/* Matched Matter Banner (if Case Profile is active) */}
      {effectiveProfile && (
        <div className="p-3.5 rounded-2xl bg-gradient-to-r from-amber-400/15 via-amber-400/5 to-transparent border border-amber-400/30 flex flex-col sm:flex-row sm:items-center justify-between gap-2 animate-in fade-in">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-xl bg-amber-400/20 border border-amber-400/30 flex items-center justify-center text-amber-600 dark:text-amber-300 shrink-0">
              <Sparkles size={16} />
            </div>
            <div className="min-w-0">
              <span className="text-[10px] font-mono uppercase font-bold text-amber-700 dark:text-amber-300 block">
                {t('Algorithmic Matter Matching', 'केस पैरामीटर के आधार पर मिलान', 'खटल्यानुसार सुचवलेले वकील')}
              </span>
              <p className="text-xs font-bold text-main truncate">
                {effectiveProfile.matterType}
              </p>
              <p className="text-[11px] text-sub truncate">
                {effectiveProfile.location} • {effectiveProfile.legalArea}
              </p>
            </div>
          </div>
          <span className="text-[10px] text-faint font-mono sm:text-right shrink-0">
            BCI Compliant Profile Match
          </span>
        </div>
      )}

      {/* Practice Area Filter Pills */}
      <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1">
        <span className="text-xs text-sub font-semibold font-mono flex items-center gap-1 shrink-0 pr-1">
          <SlidersHorizontal size={12} />
          {t('Area:', 'क्षेत्र:', 'विषय:')}
        </span>
        {allPracticeAreas.map(area => (
          <button
            key={area}
            type="button"
            onClick={() => setSelectedPracticeArea(area)}
            className={`px-3 py-1 rounded-xl text-xs font-medium transition shrink-0 ${
              selectedPracticeArea === area
                ? 'bg-amber-400 text-neutral-950 font-bold shadow-sm'
                : 'bg-neutral-100 dark:bg-white/[0.05] text-sub hover:text-main border border-neutral-200 dark:border-white/[0.06]'
            }`}
          >
            {area}
          </button>
        ))}
      </div>

      {/* Lawyers List */}
      {loading ? (
        <div className="text-center py-16 space-y-2">
          <RefreshCw size={24} className="animate-spin text-amber-500 mx-auto" />
          <p className="text-xs text-sub">{t('Loading verified advocates…', 'वकीलों की सूची लोड हो रही है…', 'वकिलांची यादी लोड होत आहे…')}</p>
        </div>
      ) : sortedLawyers.length === 0 ? (
        <div className="text-center py-16 space-y-2 bg-neutral-50 dark:bg-white/[0.02] rounded-3xl border border-neutral-200 dark:border-white/[0.06]">
          <Scale size={28} className="mx-auto text-faint" />
          <p className="text-xs text-sub">{t('No advocates found for this criteria.', 'इस श्रेणी में कोई अधिवक्ता नहीं मिले।', 'या श्रेणीत वकील उपलब्ध नाहीत.')}</p>
        </div>
      ) : (
        <div className="grid gap-3.5">
          {sortedLawyers.map(l => {
            const key = l.uid || l.name;
            const match = matchesMap.get(key);

            return (
              <div
                key={key}
                className="p-4 sm:p-5 rounded-3xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-white/[0.08] hover:border-amber-400/40 transition shadow-sm space-y-3"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3 min-w-0">
                    <img
                      src={l.photoURL || 'https://images.unsplash.com/photo-1556157382-97eda2d62296?w=150&auto=format&fit=crop&q=80'}
                      alt={l.name}
                      className="w-12 h-12 rounded-2xl object-cover border border-neutral-200 dark:border-white/10 shrink-0 shadow-sm"
                    />
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <h3 className="text-sm sm:text-base font-bold text-main tracking-tight truncate">
                          {l.name}
                        </h3>
                        {l.verificationStatus === 'verified' && (
                          <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[9px] font-semibold bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30">
                            <ShieldCheck size={10} />
                            <span>{t('BCI Verified', 'सत्यापित', 'प्रमाणित')}</span>
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] text-sub font-mono block mt-0.5">
                        {l.barCouncilId || 'BCI Member'} • {l.state || 'High Court of Jurisdiction'}
                      </span>
                      <span className="text-xs text-sub mt-0.5 block">
                        {l.experience || 8}+ {t('Years Active Practice', 'वर्ष अनुभव', 'वर्षे अनुभव')}
                      </span>
                    </div>
                  </div>

                  {/* Objective Match Pill (BCI compliant, no subjective star rating) */}
                  <div className="shrink-0 text-right">
                    {match ? (
                      <div className="inline-flex items-center gap-1 bg-emerald-500/15 border border-emerald-500/30 px-2.5 py-1 rounded-full text-xs font-bold text-emerald-700 dark:text-emerald-400 font-mono">
                        <CheckCircle2 size={12} />
                        <span>{match.score}% Match</span>
                      </div>
                    ) : (
                      <div className="inline-flex items-center gap-1 bg-neutral-100 dark:bg-white/[0.05] border border-neutral-200 dark:border-white/[0.08] px-2.5 py-1 rounded-full text-xs font-bold text-sub font-mono">
                        <ShieldCheck size={12} className="text-emerald-500" />
                        <span>Verified</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Match Reason Chips */}
                {match?.reasons && match.reasons.length > 0 && (
                  <div className="flex flex-wrap gap-1 pt-0.5">
                    {match.reasons.map((reason, i) => (
                      <span
                        key={i}
                        className="text-[10px] font-medium px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20"
                      >
                        ✓ {reason}
                      </span>
                    ))}
                  </div>
                )}

                {/* Bio snippet */}
                {l.bio && (
                  <p className="text-xs text-sub line-clamp-2 leading-relaxed">
                    {l.bio}
                  </p>
                )}

                {/* Specialties */}
                {l.practiceAreas && l.practiceAreas.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {l.practiceAreas.map((s, idx) => (
                      <span
                        key={idx}
                        className="text-[10px] px-2.5 py-0.5 rounded-full bg-neutral-100 dark:bg-white/[0.04] text-sub border border-neutral-200 dark:border-white/[0.06] font-medium"
                      >
                        {s}
                      </span>
                    ))}
                  </div>
                )}

                {/* Actions */}
                <div className="flex items-center gap-2 pt-2 border-t border-neutral-100 dark:border-white/[0.06]">
                  <button
                    onClick={() => setSelectedLawyer(l)}
                    className="flex-1 py-2.5 rounded-2xl bg-neutral-100 hover:bg-neutral-200 dark:bg-white/[0.07] dark:hover:bg-white/[0.12] text-main font-semibold text-xs border border-neutral-200 dark:border-white/10 transition ios-press"
                  >
                    {t('Inspect Portfolio & Cases', 'विवरण देखें', 'तपशील पहा')}
                  </button>

                  <button
                    onClick={() => handleOpenEngage(l)}
                    className="flex-1 py-2.5 rounded-2xl bg-amber-400 hover:bg-amber-300 text-neutral-950 font-bold text-xs flex items-center justify-center gap-1 transition shadow-sm ios-press"
                  >
                    <span>{t('Engage Advocate', 'परामर्श व संपर्क', 'वकीलांशी जोडा')}</span>
                    <ArrowUpRight size={13} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Advocate Detailed Portfolio Modal */}
      {selectedLawyer && !isEngageModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-in fade-in">
          <div
            onClick={() => setSelectedLawyer(null)}
            className="fixed inset-0 bg-neutral-950/70 dark:bg-black/85 backdrop-blur-md"
          />

          <div className="relative z-10 bg-white dark:bg-[#111216] border border-neutral-200 dark:border-white/[0.12] rounded-3xl p-5 max-w-sm w-full space-y-4 max-h-[90vh] overflow-y-auto shadow-2xl text-main">
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
                    <h3 className="text-sm font-bold text-main tracking-tight">{selectedLawyer.name}</h3>
                    <ShieldCheck size={14} className="text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <p className="text-[10px] text-sub font-mono mt-0.5">
                    {selectedLawyer.barCouncilId} • {selectedLawyer.state}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedLawyer(null)}
                className="w-7 h-7 rounded-full bg-neutral-100 dark:bg-white/[0.06] flex items-center justify-center text-sub hover:text-main transition"
              >
                <X size={15} />
              </button>
            </div>

            {/* Metrics */}
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="bg-neutral-50 dark:bg-black/40 p-3 rounded-2xl border border-neutral-200 dark:border-white/[0.06]">
                <span className="text-sub block text-[10px] uppercase font-semibold">{t('Standing', 'अनुभव', 'अनुभव')}</span>
                <span className="text-sm font-bold text-main font-mono mt-0.5 block">{selectedLawyer.experience || 10} Years</span>
              </div>
              <div className="bg-neutral-50 dark:bg-black/40 p-3 rounded-2xl border border-neutral-200 dark:border-white/[0.06]">
                <span className="text-sub block text-[10px] uppercase font-semibold">{t('Bar / State', 'बार / राज्य', 'बार / राज्य')}</span>
                <span className="text-sm font-bold text-amber-700 dark:text-amber-300 font-mono mt-0.5 block truncate">
                  {selectedLawyer.state ? `${selectedLawyer.state} Bar` : 'Bar Council'}
                </span>
              </div>
            </div>

            {/* Public Court Cases */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-xs font-semibold text-main uppercase tracking-wider flex items-center gap-1.5">
                  <Gavel size={13} className="text-amber-600 dark:text-amber-300" />
                  <span>{t('Public Court Matters (eCourts)', 'सार्वजनिक केस (eCourts)', 'सार्वजनिक खटले')}</span>
                </h4>
                <span className="text-[9px] text-faint font-mono">eCourts Verified</span>
              </div>

              <div className="space-y-2">
                {selectedLawyer.publicCases && selectedLawyer.publicCases.filter(c => c.showOnProfile).length > 0 ? (
                  selectedLawyer.publicCases
                    .filter(c => c.showOnProfile)
                    .map((c) => (
                      <div
                        key={c.id}
                        className="bg-neutral-50 dark:bg-black/40 p-3.5 rounded-2xl border border-neutral-200 dark:border-white/[0.06] space-y-1.5 text-left text-xs"
                      >
                        <span className="font-mono text-[10px] text-amber-600 dark:text-amber-400 font-bold block">{c.caseNumber}</span>
                        <p className="font-bold text-main">{c.title}</p>
                        <p className="text-sub text-[11px]">{c.court}</p>
                      </div>
                    ))
                ) : (
                  <p className="text-xs text-sub italic p-3 bg-neutral-50 dark:bg-black/40 rounded-2xl text-center border border-neutral-200 dark:border-transparent">
                    {t('No public cases listed yet.', 'कोई सार्वजनिक केस प्रदर्शित नहीं', 'सार्वजनिक खटले उपलब्ध नाहीत')}
                  </p>
                )}
              </div>
            </div>

            {/* Engage Button */}
            <button
              onClick={() => handleOpenEngage(selectedLawyer)}
              className="w-full py-3 rounded-2xl bg-amber-400 hover:bg-amber-300 text-neutral-950 text-xs font-bold ios-press flex items-center justify-center gap-1.5 shadow-md transition"
            >
              <span>{t('Engage This Advocate', 'अधिवक्ता से परामर्श शुरू करें', 'वकीलांशी जोडा')}</span>
              <ArrowUpRight size={14} />
            </button>
          </div>
        </div>
      )}

      {/* Engagement & AI Brief Transfer Modal */}
      {isEngageModalOpen && selectedLawyer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-in fade-in">
          <div
            onClick={() => setIsEngageModalOpen(false)}
            className="fixed inset-0 bg-neutral-950/70 dark:bg-black/85 backdrop-blur-md"
          />

          <div className="relative z-10 bg-white dark:bg-[#111216] border border-neutral-200 dark:border-white/[0.12] rounded-3xl p-5 max-w-sm w-full space-y-4 shadow-2xl text-main">
            <div className="flex items-center justify-between border-b border-neutral-100 dark:border-white/[0.08] pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-amber-400/20 border border-amber-400/40 flex items-center justify-center text-amber-600 dark:text-amber-300">
                  <Scale size={18} />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-main">{t('Engage Advocate', 'अधिवक्ता से जुड़ें', 'वकीलांशी जोडा')}</h3>
                  <p className="text-[11px] text-sub">{selectedLawyer.name}</p>
                </div>
              </div>
              <button
                onClick={() => setIsEngageModalOpen(false)}
                className="w-7 h-7 rounded-full bg-neutral-100 dark:bg-white/[0.06] flex items-center justify-center text-sub hover:text-main transition"
              >
                <X size={15} />
              </button>
            </div>

            {/* Matter Subject */}
            <div>
              <label className="text-sub text-xs font-semibold mb-1.5 block">
                {t('Case Subject / Dispute Matter *', 'केस का विषय / विवाद विवरण *', 'खटल्याचा विषय *')}
              </label>
              <input
                type="text"
                value={matterSubject}
                onChange={(e) => setMatterSubject(e.target.value)}
                placeholder="e.g. Cheque Bounce Sec 138 / Bail / Title Dispute"
                className="w-full rounded-xl px-3.5 py-2.5 text-xs bg-neutral-100 dark:bg-black/40 text-main placeholder:text-neutral-400 border border-neutral-300 dark:border-white/10 outline-none focus:border-amber-500"
              />
            </div>

            {/* AI Brief Transfer Option */}
            <div className="rounded-2xl p-3.5 border border-neutral-200 dark:border-white/10 space-y-2 bg-neutral-50 dark:bg-white/[0.02]">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Sparkles size={16} className="text-amber-500 dark:text-amber-300" />
                  <span className="text-xs font-semibold text-main">
                    {t('Attach Prepared Client Packet?', 'तैयार केस डॉकेट साझा करें?', 'तयार खटला माहिती पाठवायची?')}
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={attachAIBrief}
                  onChange={(e) => setAttachAIBrief(e.target.checked)}
                  className="w-4 h-4 accent-amber-500 rounded cursor-pointer"
                />
              </div>
              <p className="text-[11px] text-sub leading-relaxed">
                {attachAIBrief
                  ? t(
                      'A structured client intake packet (facts, legal area, required documents) will be securely sent to the advocate.',
                      'संरचित केस डॉकेट (तथ्य, कानूनी धाराएं और दस्तावेज सूची) अधिवक्ता को प्रेषित होगी।',
                      'तथ्य, कायदेशीर कलमे आणि आवश्यक कागदपत्रे वकिलांना पाठवली जातील.'
                    )
                  : t('No summary sent now.', 'कोई सारांश नहीं भेजा जाएगा।', 'माहिती पाठवली जाणार नाही.')}
              </p>
            </div>

            {/* BCI Disclaimer */}
            <p className="text-[10px] text-faint text-center leading-relaxed">
              Advocate matching complies with Bar Council of India guidelines. Client initiates engagement willingly.
            </p>

            {/* Submit buttons */}
            <div className="flex gap-2 pt-1">
              <button
                onClick={() => setIsEngageModalOpen(false)}
                className="flex-1 py-2.5 rounded-xl bg-neutral-100 hover:bg-neutral-200 dark:bg-white/[0.08] dark:hover:bg-white/[0.12] text-xs font-semibold text-sub ios-press transition"
              >
                {t('Cancel', 'रद्द करें', 'रद्द')}
              </button>
              <button
                onClick={handleConfirmEngagement}
                disabled={engaging || !matterSubject.trim()}
                className="flex-1 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-neutral-950 text-xs font-bold ios-press disabled:opacity-40 shadow-sm transition"
              >
                {engaging ? t('Connecting...', 'जुड़ रहे हैं...', 'जोडत आहे...') : t('Confirm & Start Chat', 'पुष्टि करें और चैट करें', 'पुष्टी करा व चॅट करा')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
