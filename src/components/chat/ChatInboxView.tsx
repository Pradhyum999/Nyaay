import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MessageSquare,
  Search,
  ShieldCheck,
  Sparkles,
  Clock,
  User,
  Scale,
  ArrowRight,
  Pin,
  Calendar,
  X
} from 'lucide-react';
import { DirectThread, Language, UserRole, CaseFile, HearingItem } from '../../types';
import { subscribeToUserThreads } from '../../services/firestoreService';

interface ChatInboxViewProps {
  currentUserId: string;
  currentUserRole: UserRole;
  currentUserName: string;
  language: Language;
  cases?: CaseFile[];
  hearings?: HearingItem[];
  onSelectThread: (thread: DirectThread) => void;
  onOpenDirectory?: () => void;
}

export const ChatInboxView: React.FC<ChatInboxViewProps> = ({
  currentUserId,
  currentUserRole,
  currentUserName,
  language,
  cases = [],
  hearings = [],
  onSelectThread,
  onOpenDirectory,
}) => {
  const [threads, setThreads] = useState<DirectThread[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState<'all' | 'pinned' | 'diary' | 'briefs'>('all');
  const [pinnedThreadIds, setPinnedThreadIds] = useState<string[]>(() => {
    try {
      const stored = localStorage.getItem(`nyaay_pinned_threads_${currentUserId}`);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  const t = (en: string, hi: string, mr?: string) =>
    language === 'mr' && mr ? mr : language === 'hi' ? hi : en;

  const togglePin = (threadId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setPinnedThreadIds(prev => {
      const next = prev.includes(threadId)
        ? prev.filter(id => id !== threadId)
        : [threadId, ...prev];
      try {
        localStorage.setItem(`nyaay_pinned_threads_${currentUserId}`, JSON.stringify(next));
      } catch {}
      return next;
    });
  };

  useEffect(() => {
    if (!currentUserId) {
      setLoading(false);
      return;
    }

    const unsub = subscribeToUserThreads(currentUserId, currentUserRole, (userThreads) => {
      setThreads(userThreads);
      setLoading(false);
    });

    return () => unsub();
  }, [currentUserId, currentUserRole]);

  // Combine live direct threads with Case Diary dockets & hearings
  const combinedThreads = useMemo<DirectThread[]>(() => {
    const list: DirectThread[] = [...threads];

    // 1. Cross-link caseNumber to existing direct threads if client names match
    list.forEach(t => {
      if (!t.caseNumber && cases && cases.length > 0) {
        const found = cases.find(
          c => c.clientName?.toLowerCase().trim() === t.clientName?.toLowerCase().trim()
        );
        if (found) {
          t.caseNumber = found.caseNumber;
          t.courtName = found.courtLocation;
          t.nextHearingDate = found.nextHearingDate;
        }
      }
    });

    // 2. Add active cases from Diary/Docket as case conversations
    if (cases && cases.length > 0) {
      cases.forEach(c => {
        const alreadyInList = list.some(
          t => (t.caseNumber && t.caseNumber.toLowerCase() === c.caseNumber.toLowerCase()) ||
               (t.clientName && t.clientName.toLowerCase().trim() === c.clientName.toLowerCase().trim())
        );

        if (!alreadyInList) {
          list.push({
            id: `diary-case-${c.id}`,
            lawyerId: currentUserId,
            lawyerName: currentUserName,
            clientId: c.clientPhone || c.id,
            clientName: c.clientName,
            matterSubject: `${c.caseType} • vs. ${c.opponentName}`,
            lastMessage: `Court Matter • Hearing: ${c.nextHearingDate || 'Scheduled'}`,
            lastMessageAt: c.nextHearingDate || 'Today',
            status: 'active',
            aiBriefAttached: true,
            caseNumber: c.caseNumber,
            courtName: c.courtLocation,
            nextHearingDate: c.nextHearingDate,
            source: 'diary',
          });
        }
      });
    }

    // 3. Add hearings from Diary that might not have a case yet
    if (hearings && hearings.length > 0) {
      hearings.forEach(h => {
        const alreadyInList = list.some(
          t => (t.caseNumber && t.caseNumber.toLowerCase() === h.caseNumber.toLowerCase()) ||
               (t.clientName && t.clientName.toLowerCase().trim() === h.clientName.toLowerCase().trim())
        );

        if (!alreadyInList) {
          list.push({
            id: `diary-hearing-${h.id}`,
            lawyerId: currentUserId,
            lawyerName: currentUserName,
            clientId: h.id,
            clientName: h.clientName,
            matterSubject: `${h.purposeEn || 'Hearing'} • ${h.courtName}`,
            lastMessage: `Bench Hearing • ${h.hearingDate}`,
            lastMessageAt: h.hearingDate,
            status: 'active',
            aiBriefAttached: false,
            caseNumber: h.caseNumber,
            courtName: h.courtName,
            nextHearingDate: h.hearingDate,
            source: 'diary',
          });
        }
      });
    }

    return list;
  }, [threads, cases, hearings, currentUserId, currentUserName]);

  // Filter and search across Case Numbers, Client Names, Courts, and Subjects
  const filteredThreads = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    const cleanDigits = q.replace(/[^0-9a-z]/gi, '');

    return combinedThreads
      .filter((thread) => {
        const recipientName = currentUserRole === 'lawyer' ? thread.clientName : thread.lawyerName;
        const matchesSearch =
          !q ||
          recipientName?.toLowerCase().includes(q) ||
          thread.matterSubject?.toLowerCase().includes(q) ||
          thread.lastMessage?.toLowerCase().includes(q) ||
          (thread.caseNumber && thread.caseNumber.toLowerCase().includes(q)) ||
          (cleanDigits && thread.caseNumber && thread.caseNumber.replace(/[^0-9a-z]/gi, '').includes(cleanDigits)) ||
          (thread.courtName && thread.courtName.toLowerCase().includes(q));

        if (!matchesSearch) return false;

        if (filter === 'pinned') {
          return pinnedThreadIds.includes(thread.id);
        }
        if (filter === 'diary') {
          return thread.source === 'diary' || !!thread.caseNumber;
        }
        if (filter === 'briefs') {
          return thread.aiBriefAttached;
        }
        return true;
      })
      .sort((a, b) => {
        const aPinned = pinnedThreadIds.includes(a.id) ? 1 : 0;
        const bPinned = pinnedThreadIds.includes(b.id) ? 1 : 0;
        return bPinned - aPinned;
      });
  }, [combinedThreads, searchQuery, filter, pinnedThreadIds, currentUserRole]);

  return (
    <div className="flex flex-col min-h-full p-4 sm:p-5 pb-24 space-y-4 max-w-2xl mx-auto w-full">
      {/* Top Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-xl bg-amber-400/15 border border-amber-400/30 flex items-center justify-center text-amber-300">
              <MessageSquare size={14} />
            </div>
            <span className="text-[11px] font-semibold tracking-wider uppercase text-amber-400 font-mono">
              {t('Encrypted Legal Channel & Case Docket', 'सुरक्षित विधिक संवाद एवं केस डॉकेट')}
            </span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white mt-1">
            {currentUserRole === 'lawyer'
              ? t('Client Consultations & Case Chats', 'मुवक्किल परामर्श एवं केस संवाद')
              : t('Advocate Messages', 'अधिवक्ता परामर्श एवं संदेश')}
          </h1>
          <p className="text-xs text-neutral-400 mt-0.5">
            {currentUserRole === 'lawyer'
              ? t('Direct client inquiries and linked case dockets with Case Numbers from Diary', 'मुवक्किल संवाद एवं केस डायरी से जुड़े मामले (केस नंबर सहित)')
              : t('Direct conversation with your engaged advocates with photo & doc sharing', 'अपने अधिवक्ताओं से सीधा संवाद व दस्तावेज़ साझा करें')}
          </p>
        </div>

        {currentUserRole === 'client' && onOpenDirectory && (
          <button
            onClick={onOpenDirectory}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-400/15 hover:bg-amber-400/25 border border-amber-400/30 text-amber-300 text-xs font-semibold transition ios-press"
          >
            <span>{t('Find Lawyer', 'वकील खोजें')}</span>
            <ArrowRight size={13} />
          </button>
        )}
      </div>

      {/* Attorney-Client Privilege Banner */}
      <div className="bg-neutral-900/60 border border-white/[0.08] px-3.5 py-2.5 rounded-2xl flex items-center justify-between text-xs backdrop-blur-xl">
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded-lg bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
            <ShieldCheck size={12} />
          </div>
          <span className="text-neutral-300 font-medium text-[11px]">
            {t(
              'Protected by Indian Evidence Act Section 126 (Attorney-Client Privilege)',
              'भारतीय साक्ष्य अधिनियम की धारा 126 के तहत पूर्णतः सुरक्षित',
              'भारतीय पुरावा कायदा कलम 126 अन्वये पूर्णतः संरक्षित'
            )}
          </span>
        </div>
        <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-mono flex-shrink-0 ml-2">
          {t('E2E Privileged', 'विधिक विशेषाधिकार')}
        </span>
      </div>

      {/* Search Bar & Filter Chips */}
      <div className="space-y-2.5">
        <div className="relative">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={
              currentUserRole === 'lawyer'
                ? t('Search Case No. (e.g. 123, CC/4128), client or matter...', 'केस नं. (उदा. 123, CC/4128), मुवक्किल या विषय खोजें...')
                : t('Search advocates, legal matters, case numbers...', 'अधिवक्ता या केस विषय खोजें...')
            }
            className="w-full bg-neutral-900/90 border border-white/10 rounded-2xl pl-10 pr-9 py-2.5 text-xs text-white placeholder-neutral-500 outline-none focus:border-amber-400/50 transition backdrop-blur-xl shadow-inner font-sans"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-white"
            >
              <X size={14} />
            </button>
          )}
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs no-scrollbar">
          <button
            onClick={() => setFilter('all')}
            className={`px-3 py-1.5 rounded-xl text-[11px] font-medium transition ${
              filter === 'all'
                ? 'bg-white text-black font-semibold'
                : 'bg-white/[0.05] text-neutral-400 hover:text-white border border-white/[0.08]'
            }`}
          >
            {t('All Conversations', 'सभी बातचीत', 'सर्व संवाद')} ({combinedThreads.length})
          </button>
          <button
            onClick={() => setFilter('diary')}
            className={`px-3 py-1.5 rounded-xl text-[11px] font-medium flex items-center gap-1.5 transition ${
              filter === 'diary'
                ? 'bg-amber-400 text-black font-semibold'
                : 'bg-white/[0.05] text-neutral-400 hover:text-white border border-white/[0.08]'
            }`}
          >
            <Calendar size={11} className={filter === 'diary' ? 'text-black' : 'text-amber-300'} />
            <span>{t('From Diary', 'डायरी से जुड़े', 'डायरीतून')} ({combinedThreads.filter(t => t.source === 'diary' || t.caseNumber).length})</span>
          </button>
          <button
            onClick={() => setFilter('pinned')}
            className={`px-3 py-1.5 rounded-xl text-[11px] font-medium flex items-center gap-1.5 transition ${
              filter === 'pinned'
                ? 'bg-amber-400 text-black font-semibold'
                : 'bg-white/[0.05] text-neutral-400 hover:text-white border border-white/[0.08]'
            }`}
          >
            <Pin size={11} className={filter === 'pinned' ? 'text-black' : 'text-amber-300'} />
            <span>{t('Pinned', 'पिन किए गए', 'पिन केलेले')} ({pinnedThreadIds.length})</span>
          </button>
          <button
            onClick={() => setFilter('briefs')}
            className={`px-3 py-1.5 rounded-xl text-[11px] font-medium flex items-center gap-1.5 transition ${
              filter === 'briefs'
                ? 'bg-amber-400 text-black font-semibold'
                : 'bg-white/[0.05] text-neutral-400 hover:text-white border border-white/[0.08]'
            }`}
          >
            <Sparkles size={11} className={filter === 'briefs' ? 'text-black' : 'text-amber-300'} />
            <span>{t('AI Brief Synced', 'AI सारांश संलग्न', 'AI सारांश जोडलेले')}</span>
          </button>
        </div>
      </div>

      {/* Threads List */}
      <motion.div
        className="space-y-3"
        initial="hidden"
        animate="visible"
        variants={{ hidden: {}, visible: { transition: { staggerChildren: 0.05 } } }}
      >
        {loading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="p-4 rounded-3xl bg-neutral-900/60 border border-white/[0.06] animate-pulse h-24" />
          ))
        ) : filteredThreads.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="p-8 rounded-3xl bg-white/[0.02] border border-white/[0.06] text-center space-y-3 flex flex-col items-center justify-center"
          >
            <div className="w-12 h-12 rounded-2xl bg-white/[0.05] flex items-center justify-center text-neutral-500">
              <MessageSquare size={22} />
            </div>

            <div className="space-y-1">
              <h3 className="text-sm font-bold text-white">
                {searchQuery
                  ? t('No conversations match your search', 'कोई बातचीत नहीं मिली', 'कोणताही संवाद सापडला नाही')
                  : filter === 'pinned'
                  ? t('No pinned conversations yet', 'कोई पिन की गई बातचीत नहीं है', 'अद्याप कोणतेही पिन केलेले संवाद नाहीत')
                  : currentUserRole === 'lawyer'
                  ? t('No client consultations yet', 'अभी तक कोई मुवक्किल परामर्श नहीं', 'अद्याप कोणताही पक्षकार सल्ला नाही')
                  : t('No active legal consultations', 'अभी तक कोई सक्रिय परामर्श नहीं', 'अद्याप कोणताही सक्रिय सल्ला नाही')}
              </h3>
              <p className="text-xs text-neutral-400 max-w-sm">
                {searchQuery
                  ? `No case docket or client found for "${searchQuery}". Check the Case No. or browse the diary.`
                  : currentUserRole === 'lawyer'
                  ? t(
                      'When citizens engage your practice or cases are added to your diary, their threads and case files appear here.',
                      'जब नागरिक परामर्श शुरू करेंगे या केस डायरी में मामले जुड़ेंगे, वे यहाँ दिखाई देंगे।',
                      'जेव्हा पक्षकार सल्ला सुरू करतील किंवा डायरीतील केसेस येथे दिसतील.'
                    )
                  : t(
                      'Browse verified advocates by high court, practice area, or rating to initiate a confidential legal consultation.',
                      'न्यायनीति पर सत्यापित वकीलों से जुड़ें और सीधे चैट करें।',
                      'सत्यापित वकिलांशी जोडा आणि थेट कायदेशीर संवाद सुरू करा.'
                    )}
              </p>
            </div>

            {currentUserRole === 'client' && onOpenDirectory && (
              <button
                type="button"
                onClick={onOpenDirectory}
                className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-amber-400 hover:bg-amber-300 text-black text-xs font-bold transition shadow-[0_4px_20px_rgba(245,197,99,0.3)] ios-press cursor-pointer"
              >
                <span>{t('Browse Verified Advocates', 'सत्यापित अधिवक्ता देखें', 'सत्यापित वकील पहा')}</span>
                <ArrowRight size={14} />
              </button>
            )}
          </motion.div>
        ) : (
          filteredThreads.map((thread) => {
            const recipientName = currentUserRole === 'lawyer' ? thread.clientName : thread.lawyerName;
            const recipientPhoto = currentUserRole === 'lawyer' ? thread.clientPhoto : thread.lawyerPhoto;
            const isPinned = pinnedThreadIds.includes(thread.id);
            const unread = thread.unreadCount ?? 0;

            return (
              <motion.div
                key={thread.id}
                initial={{ opacity: 0, y: 14 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-20px' }}
                transition={{ type: 'spring', stiffness: 340, damping: 26 }}
                onClick={() => onSelectThread(thread)}
                className={`group relative p-4 rounded-3xl bg-neutral-950/80 hover:bg-neutral-900 border transition ios-press cursor-pointer shadow-lg ${
                  isPinned
                    ? 'border-amber-400/40 bg-gradient-to-r from-amber-500/10 via-neutral-950 to-neutral-950'
                    : 'border-white/[0.08] hover:border-amber-400/30'
                }`}
              >
                <div className="flex items-start gap-3.5">
                  {/* Avatar */}
                  <div className="relative flex-shrink-0">
                    {recipientPhoto ? (
                      <img
                        src={recipientPhoto}
                        alt={recipientName}
                        className="w-12 h-12 rounded-2xl object-cover border border-white/10 shadow-md"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-2xl bg-neutral-800 border border-white/10 flex items-center justify-center text-amber-300 shadow-md">
                        {currentUserRole === 'client' ? <Scale size={20} /> : <User size={20} />}
                      </div>
                    )}
                    {/* Online / Active status dot */}
                    <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-emerald-500 border-2 border-neutral-950" />
                  </div>

                  {/* Body */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5 min-w-0 flex-wrap">
                        {isPinned && (
                          <Pin size={11} className="text-amber-400 fill-amber-400 flex-shrink-0" />
                        )}
                        <h4 className="text-sm font-bold text-white truncate group-hover:text-amber-300 transition">
                          {currentUserRole === 'client' ? `Adv. ${recipientName}` : recipientName}
                        </h4>
                        {currentUserRole === 'client' && (
                          <ShieldCheck size={14} className="text-amber-400 flex-shrink-0" />
                        )}
                      </div>

                      <div className="flex items-center gap-2 flex-shrink-0">
                        {unread > 0 && (
                          <span className="min-w-[18px] h-[18px] px-1 bg-amber-400 text-black text-[9px] font-black rounded-full flex items-center justify-center shadow-sm">
                            {unread > 9 ? '9+' : unread}
                          </span>
                        )}
                        <span className="text-[10px] text-neutral-500 font-mono flex items-center gap-1">
                          <Clock size={10} />
                          <span>{thread.lastMessageAt || 'Recently'}</span>
                        </span>
                      </div>
                    </div>

                    {/* Prominent Case Number & Docket Badges */}
                    <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                      {thread.caseNumber ? (
                        <span className="text-[10.5px] font-mono font-bold text-amber-300 bg-amber-400/15 border border-amber-400/35 px-2 py-0.5 rounded-md flex items-center gap-1 shadow-sm">
                          <Scale size={10} className="text-amber-400" />
                          <span>Case No: {thread.caseNumber}</span>
                        </span>
                      ) : (
                        <span className="text-[9.5px] font-mono text-neutral-400 bg-neutral-800/80 px-2 py-0.5 rounded-md border border-white/[0.06]">
                          Direct Consultation
                        </span>
                      )}

                      {thread.source === 'diary' && (
                        <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-violet-500/15 text-violet-300 border border-violet-500/30">
                          Diary Matter
                        </span>
                      )}

                      {thread.aiBriefAttached && (
                        <span className="flex items-center gap-1 text-[9px] px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 flex-shrink-0">
                          <Sparkles size={9} />
                          <span>AI Brief</span>
                        </span>
                      )}
                    </div>

                    {/* Matter Subject / Court Info */}
                    <div className="flex items-center gap-1.5 mt-1 text-[11px] text-neutral-300">
                      <span className="truncate max-w-[240px]">
                        {thread.matterSubject || t('Legal Consultation', 'विधिक परामर्श', 'कायदेशीर सल्ला')}
                      </span>
                      {thread.courtName && (
                        <span className="text-[10px] text-neutral-500 font-mono shrink-0">
                          • {thread.courtName}
                        </span>
                      )}
                    </div>

                    {/* Last Message Preview */}
                    <p className="text-xs text-neutral-400 truncate mt-1.5 font-normal">
                      {thread.lastMessage || t('Tap to open direct chat...', 'चैट शुरू करने के लिए टैप करें...', 'चॅट उघडण्यासाठी टॅप करा...')}
                    </p>
                  </div>

                  {/* Actions: Pin button & Right chevron */}
                  <div className="flex items-center gap-1 self-center pl-1 flex-shrink-0">
                    <button
                      type="button"
                      onClick={(e) => togglePin(thread.id, e)}
                      className={`p-1.5 rounded-xl transition ios-press ${
                        isPinned
                          ? 'text-amber-400 bg-amber-400/15 hover:bg-amber-400/25'
                          : 'text-neutral-500 hover:text-neutral-300 hover:bg-white/[0.06]'
                      }`}
                      title={isPinned ? 'Unpin' : 'Pin conversation'}
                    >
                      <Pin size={13} className={isPinned ? 'fill-amber-400' : ''} />
                    </button>
                    <motion.div
                      animate={{ x: 0 }}
                      whileHover={{ x: 3 }}
                      className="text-neutral-600 group-hover:text-amber-400"
                    >
                      <ArrowRight size={16} />
                    </motion.div>
                  </div>
                </div>
              </motion.div>
            );
          })
        )}
      </motion.div>
    </div>
  );
};
