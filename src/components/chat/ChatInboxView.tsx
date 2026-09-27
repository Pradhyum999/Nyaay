import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MessageSquare,
  Search,
  ShieldCheck,
  Sparkles,
  Paperclip,
  Image as ImageIcon,
  Clock,
  User,
  Scale,
  ArrowRight,
  PlusCircle,
  FileText,
  Lock
} from 'lucide-react';
import { DirectThread, Language, UserRole } from '../../types';
import { subscribeToUserThreads } from '../../services/firestoreService';

interface ChatInboxViewProps {
  currentUserId: string;
  currentUserRole: UserRole;
  currentUserName: string;
  language: Language;
  onSelectThread: (thread: DirectThread) => void;
  onOpenDirectory?: () => void;
}

export const ChatInboxView: React.FC<ChatInboxViewProps> = ({
  currentUserId,
  currentUserRole,
  currentUserName,
  language,
  onSelectThread,
  onOpenDirectory,
}) => {
  const [threads, setThreads] = useState<DirectThread[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState<'all' | 'attachments' | 'briefs'>('all');

  const t = (en: string, hi: string) => (language === 'hi' ? hi : en);

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

  // Filter and search
  const filteredThreads = threads.filter((thread) => {
    const recipientName = currentUserRole === 'lawyer' ? thread.clientName : thread.lawyerName;
    const matchesSearch =
      recipientName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      thread.matterSubject?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      thread.lastMessage?.toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;

    if (filter === 'attachments') {
      return thread.hasAttachment || thread.lastMessage?.includes('Photo') || thread.lastMessage?.includes('Document');
    }
    if (filter === 'briefs') {
      return thread.aiBriefAttached;
    }
    return true;
  });

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
              {t('Encrypted Legal Channel', 'सुरक्षित विधिक संवाद')}
            </span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white mt-1">
            {currentUserRole === 'lawyer'
              ? t('Client Consultations', 'मुवक्किल परामर्श एवं संदेश')
              : t('Advocate Messages', 'अधिवक्ता परामर्श एवं संदेश')}
          </h1>
          <p className="text-xs text-neutral-400 mt-0.5">
            {currentUserRole === 'lawyer'
              ? t('Real-time direct inquiries, case briefs & multimedia document transfers', 'सीधे मुवक्किल परामर्श, केस ब्रीफ और दस्तावेज़')
              : t('Direct conversation with your engaged advocates with photo & doc sharing', 'अपने अधिवक्ताओं से सीधा संवाद व दस्तावेज़ साझा करें')}
          </p>
        </div>

        {currentUserRole === 'client' && onOpenDirectory && (
          <button
            onClick={onOpenDirectory}
            className="flex items-center gap-1.5 px-3 py-2 rounded-2xl bg-amber-400 hover:bg-amber-300 text-black text-xs font-bold transition ios-press shadow-[0_4px_16px_rgba(245,197,99,0.25)] flex-shrink-0"
          >
            <PlusCircle size={14} />
            <span className="hidden sm:inline">{t('New Consultation', 'नया परामर्श')}</span>
            <span className="sm:hidden">{t('New', 'नया')}</span>
          </button>
        )}
      </div>

      {/* Privilege & Confidentiality Banner */}
      <div className="p-3 rounded-2xl bg-gradient-to-r from-neutral-900 via-neutral-900/90 to-neutral-950 border border-white/[0.08] flex items-center justify-between text-xs">
        <div className="flex items-center gap-2 text-neutral-300">
          <Lock size={14} className="text-emerald-400 flex-shrink-0" />
          <span className="text-[11px] text-neutral-300 font-medium">
            {t(
              'Protected by Indian Evidence Act Section 126 (Attorney-Client Privilege)',
              'भारतीय साक्ष्य अधिनियम की धारा 126 के तहत पूर्णतः गोपनीय व संरक्षित'
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
                ? t('Search clients, matters or messages...', 'मुवक्किल या विषय खोजें...')
                : t('Search advocates, legal matters...', 'अधिवक्ता या केस विषय खोजें...')
            }
            className="w-full bg-neutral-900/90 border border-white/10 rounded-2xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-neutral-500 outline-none focus:border-amber-400/50 transition backdrop-blur-xl"
          />
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
            {t('All Conversations', 'सभी बातचीत')} ({threads.length})
          </button>
          <button
            onClick={() => setFilter('attachments')}
            className={`px-3 py-1.5 rounded-xl text-[11px] font-medium flex items-center gap-1.5 transition ${
              filter === 'attachments'
                ? 'bg-white text-black font-semibold'
                : 'bg-white/[0.05] text-neutral-400 hover:text-white border border-white/[0.08]'
            }`}
          >
            <Paperclip size={11} />
            <span>{t('Files & Photos', 'फाइलें व फोटो')}</span>
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
            <span>{t('AI Brief Synced', 'AI सारांश संलग्न')}</span>
          </button>
        </div>
      </div>

      {/* Threads List */}
      <motion.div
        className="space-y-3"
        initial="hidden"
        animate="visible"
        variants={{ hidden: {}, visible: { transition: { staggerChildren: 0.06 } } }}
      >
        {loading ? (
          // Shimmer skeleton placeholders
          Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="p-4 rounded-3xl bg-neutral-950/80 border border-white/[0.06] flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl animate-shimmer bg-neutral-800 flex-shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="h-3 rounded-full animate-shimmer bg-neutral-800 w-3/5" />
                <div className="h-2.5 rounded-full animate-shimmer bg-neutral-800/80 w-4/5" />
                <div className="h-2 rounded-full animate-shimmer bg-neutral-800/50 w-2/5" />
              </div>
            </div>
          ))
        ) : filteredThreads.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: 'spring', stiffness: 320, damping: 26 }}
            className="flex flex-col items-center justify-center p-8 rounded-3xl bg-neutral-900/40 border border-white/[0.08] text-center space-y-4"
          >
            <div className="w-14 h-14 rounded-3xl bg-neutral-800/80 border border-white/10 flex items-center justify-center text-neutral-400 shadow-inner">
              <MessageSquare size={24} />
            </div>

            <div className="space-y-1">
              <h3 className="text-sm font-bold text-white">
                {searchQuery
                  ? t('No conversations match your search', 'कोई बातचीत नहीं मिली')
                  : currentUserRole === 'lawyer'
                  ? t('No client consultations yet', 'अभी तक कोई मुवक्किल परामर्श नहीं')
                  : t('No active legal consultations', 'अभी तक कोई सक्रिय परामर्श नहीं')}
              </h3>
              <p className="text-xs text-neutral-400 max-w-sm">
                {currentUserRole === 'lawyer'
                  ? t(
                      'When citizens engage your practice from the directory or AI intake, their threads and case files will appear here.',
                      'जब नागरिक आपके साथ परामर्श शुरू करेंगे, उनकी बातचीत यहाँ दिखाई देगी।'
                    )
                  : t(
                      'Browse verified advocates by high court, practice area, or rating to initiate a confidential legal consultation with file sharing.',
                      'न्यायनीति पर सत्यापित वकीलों से जुड़ें और सीधे चैट व दस्तावेज़ साझा करें।'
                    )}
              </p>
            </div>

            {currentUserRole === 'client' && onOpenDirectory && (
              <button
                type="button"
                onClick={onOpenDirectory}
                className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-amber-400 hover:bg-amber-300 text-black text-xs font-bold transition shadow-[0_4px_20px_rgba(245,197,99,0.3)] ios-press cursor-pointer"
              >
                <span>{t('Browse Verified Advocates', 'सत्यापित अधिवक्ता देखें')}</span>
                <ArrowRight size={14} />
              </button>
            )}
          </motion.div>
        ) : (
          filteredThreads.map((thread) => {
            const recipientName = currentUserRole === 'lawyer' ? thread.clientName : thread.lawyerName;
            const recipientPhoto = currentUserRole === 'lawyer' ? thread.clientPhoto : thread.lawyerPhoto;

            return (
              <motion.div
                key={thread.id}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-30px' }}
                transition={{ type: 'spring', stiffness: 320, damping: 26 }}
                onClick={() => onSelectThread(thread)}
                className="group relative p-4 rounded-3xl bg-neutral-950/80 hover:bg-neutral-900 border border-white/[0.08] hover:border-amber-400/30 cursor-pointer shadow-lg transition ios-press"
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
                    {/* Online dot */}
                    <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-emerald-500 border-2 border-neutral-950" />
                  </div>

                  {/* Body */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <h4 className="text-sm font-bold text-white truncate group-hover:text-amber-300 transition">
                          {currentUserRole === 'client' ? `Adv. ${recipientName}` : recipientName}
                        </h4>
                        {currentUserRole === 'client' && (
                          <ShieldCheck size={14} className="text-amber-400 flex-shrink-0" />
                        )}
                      </div>
                      <span className="text-[10px] text-neutral-500 font-mono flex-shrink-0 flex items-center gap-1">
                        <Clock size={10} />
                        <span>{thread.lastMessageAt || 'Recently'}</span>
                      </span>
                    </div>

                    {/* Matter Subject Tag */}
                    <div className="flex items-center gap-1.5 mt-1">
                      <span className="text-[10px] px-2 py-0.5 rounded-md bg-white/[0.06] text-neutral-300 font-medium truncate max-w-[200px]">
                        {thread.matterSubject || t('Legal Consultation', 'विधिक परामर्श')}
                      </span>
                      {thread.aiBriefAttached && (
                        <span className="flex items-center gap-1 text-[9px] px-1.5 py-0.5 rounded-md bg-amber-400/15 text-amber-300 border border-amber-400/30 flex-shrink-0">
                          <Sparkles size={9} />
                          <span>AI Brief</span>
                        </span>
                      )}
                    </div>

                    {/* Last Message Preview */}
                    <p className="text-xs text-neutral-400 truncate mt-2 font-normal flex items-center gap-1.5">
                      {thread.lastMessage?.includes('Photo') && <ImageIcon size={12} className="text-amber-300 flex-shrink-0" />}
                      {thread.lastMessage?.includes('Document') && <FileText size={12} className="text-blue-400 flex-shrink-0" />}
                      <span>{thread.lastMessage || t('Tap to open direct chat...', 'चैट शुरू करने के लिए टैप करें...')}</span>
                    </p>
                  </div>

                  {/* Right chevron */}
                  <motion.div
                    animate={{ x: 0 }}
                    whileHover={{ x: 3 }}
                    className="self-center pl-1 text-neutral-600 group-hover:text-amber-400 flex-shrink-0"
                  >
                    <ArrowRight size={16} />
                  </motion.div>
                </div>
              </motion.div>
            );
          })
        )}
      </motion.div>
    </div>
  );
};
