import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Send,
  ArrowLeft,
  ShieldCheck,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  FileText,
  User,
  Scale,
  X,
  Download,
  Lock,
  Paperclip,
  Phone,
  Video,
  Camera,
  Contact,
  Plus,
  ChevronDown,
  ChevronUp,
  Image as ImageIcon,
  MapPin,
} from 'lucide-react';
import {
  subscribeToThreadMessages,
  sendDirectMessage,
  transferAIBriefToThread,
  markThreadMessagesRead
} from '../../services/firestoreService';
import { DirectMessage, Language, UserRole } from '../../types';
import { CallModal } from './CallModal';
import { normalize12HourTime, isSameDayIST } from '../../lib/istDate';

interface DirectChatViewProps {
  threadId: string;
  currentUserId: string;
  currentUserName: string;
  currentUserRole: UserRole;
  recipientName: string;
  recipientPhoto?: string;
  matterSubject: string;
  aiBriefAttached?: boolean;
  aiBriefText?: string;
  language: Language;
  onSelectLanguage?: (lang: Language) => void;
  onBack: () => void;
}


export const DirectChatView: React.FC<DirectChatViewProps> = ({
  threadId,
  currentUserId,
  currentUserName,
  currentUserRole,
  recipientName,
  recipientPhoto,
  matterSubject,
  aiBriefAttached = false,
  aiBriefText = '',
  language,
  onSelectLanguage,
  onBack,
}) => {
  const [messages, setMessages] = useState<DirectMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [isAiBriefShared, setIsAiBriefShared] = useState<boolean>(aiBriefAttached);
  const [showTransferConfirm, setShowTransferConfirm] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSending, setIsSending] = useState(false);

  const [callModalOpen, setCallModalOpen] = useState(false);
  const [callType, setCallType] = useState<'audio' | 'video'>('audio');

  // Enhanced Attachment Sharing (Suggestion 7)
  const [showAttachmentMenu, setShowAttachmentMenu] = useState(false);
  const [isCaseBannerExpanded, setIsCaseBannerExpanded] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);

  // One-time transfer popup state (client only, after 4+ messages)
  const [showTransferPopup, setShowTransferPopup] = useState(false);
  const [transferPopupShownKey] = useState(`transfer_popup_shown_${threadId}`);
  const [highlightTransferBtn, setHighlightTransferBtn] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const t = (en: string, hi: string) => (language === 'hi' ? hi : en);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async () => {
      const dataUrl = reader.result as string;
      const sizeStr = formatFileSize(file.size);
      await sendDirectMessage(threadId, {
        senderId: currentUserId,
        senderName: currentUserName,
        senderRole: currentUserRole,
        text: `📄 ${file.name} (${sizeStr})`,
        hasAttachment: true,
        attachmentType: 'file',
        attachmentName: file.name,
        attachmentUrl: dataUrl,
        attachmentSize: sizeStr,
      });
      setShowAttachmentMenu(false);
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleCameraCapture = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async () => {
      const dataUrl = reader.result as string;
      await sendDirectMessage(threadId, {
        senderId: currentUserId,
        senderName: currentUserName,
        senderRole: currentUserRole,
        text: '📷 Photo captured with Camera',
        hasAttachment: true,
        attachmentType: 'image',
        attachmentName: 'camera_capture.jpg',
        attachmentUrl: dataUrl,
      });
      setShowAttachmentMenu(false);
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleGalleryUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async () => {
      const dataUrl = reader.result as string;
      await sendDirectMessage(threadId, {
        senderId: currentUserId,
        senderName: currentUserName,
        senderRole: currentUserRole,
        text: `🖼️ ${file.name}`,
        hasAttachment: true,
        attachmentType: 'image',
        attachmentName: file.name,
        attachmentUrl: dataUrl,
      });
      setShowAttachmentMenu(false);
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleShareLocation = async () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (pos) => {
          const { latitude, longitude } = pos.coords;
          await sendDirectMessage(threadId, {
            senderId: currentUserId,
            senderName: currentUserName,
            senderRole: currentUserRole,
            text: `📍 Location Shared: https://maps.google.com/?q=${latitude},${longitude}`,
          });
          setShowAttachmentMenu(false);
        },
        async () => {
          await sendDirectMessage(threadId, {
            senderId: currentUserId,
            senderName: currentUserName,
            senderRole: currentUserRole,
            text: `📍 Location Shared: High Court / District Court Chambers Complex`,
          });
          setShowAttachmentMenu(false);
        }
      );
    }
  };

  const handleShareContact = async () => {
    await sendDirectMessage(threadId, {
      senderId: currentUserId,
      senderName: currentUserName,
      senderRole: currentUserRole,
      text: `👤 Contact Card: ${currentUserName} (${currentUserRole === 'lawyer' ? 'Advocate Counsel' : 'Litigant Client'})\n📞 Phone: +91 98765 43210\n⚖️ Matter: ${matterSubject}`,
    });
    setShowAttachmentMenu(false);
  };

  // Format file size
  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' B';
    else if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
    else return (bytes / 1048576).toFixed(1) + ' MB';
  };

  // Realtime subscription to thread messages
  useEffect(() => {
    if (!threadId) return;
    const unsub = subscribeToThreadMessages(threadId, (liveMsgs) => {
      setMessages(liveMsgs);
      // Mark messages sent by the other party as read (Bug 13)
      if (liveMsgs.some(m => !m.read && (m.senderRole ? m.senderRole !== currentUserRole : m.senderId !== currentUserId))) {
        markThreadMessagesRead(threadId, currentUserId, currentUserRole);
      }
      // Check if AI brief is in the messages
      if (liveMsgs.some(m => m.text?.includes('[Transferred AI Consultation Summary]') || m.text?.includes('📋 AI Legal Brief:'))) {
        setIsAiBriefShared(true);
      }
    });
    return () => unsub();
  }, [threadId, currentUserId, currentUserRole]);

  // Auto scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Trigger one-time case transfer popup after 4+ messages (client only)
  useEffect(() => {
    if (currentUserRole !== 'client') return;
    if (isAiBriefShared) return;
    const alreadyShown = localStorage.getItem(transferPopupShownKey);
    if (alreadyShown) return;
    if (messages.length >= 4) {
      setShowTransferPopup(true);
      localStorage.setItem(transferPopupShownKey, 'true');
    }
  }, [messages.length, currentUserRole, isAiBriefShared, transferPopupShownKey]);

  const handleSend = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const trimmed = inputText.trim();
    if (!trimmed) return;

    setIsSending(true);
    setErrorMessage(null);

    // Clear input immediately for responsiveness
    const textToSend = trimmed;
    setInputText('');

    try {
      await sendDirectMessage(threadId, {
        senderId: currentUserId,
        senderName: currentUserName,
        senderRole: currentUserRole,
        text: textToSend,
      });
    } catch (err) {
      console.warn("Failed to send message:", err);
      setErrorMessage(t('Message delivery failed. Please retry.', 'संदेश भेजने में त्रुटि।'));
    } finally {
      setIsSending(false);
    }
  };


  const handleTransferAIBrief = async () => {
    const briefContent =
      aiBriefText ||
      `Summary of legal inquiry: ${matterSubject}. The client consulted NYAAYNEETI AI regarding legal recourse, applicable statutory provisions, and factual timeline. Verified for advocate handoff.`;

    try {
      await transferAIBriefToThread(threadId, briefContent, currentUserName, currentUserId);
      setIsAiBriefShared(true);
      setShowTransferConfirm(false);
      setToastMessage(t('AI Legal Brief transferred to Advocate!', 'AI विधिक सारांश अधिवक्ता को स्थानांतरित कर दिया गया!'));
      setTimeout(() => setToastMessage(null), 3000);
    } catch (err) {
      console.warn("Failed to transfer brief:", err);
    }
  };

  // Download attachment helper
  const handleDownloadAttachment = (dataUrl: string, fileName: string) => {
    const link = document.createElement('a');
    link.href = dataUrl;
    link.download = fileName || 'nyaayneeti_document';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="flex flex-col h-full min-h-0 max-h-full overflow-hidden bg-neutral-100/70 dark:bg-black text-neutral-900 dark:text-white relative">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="absolute top-16 left-4 right-4 z-40 bg-neutral-900/95 dark:bg-neutral-900/95 border border-emerald-500/40 px-4 py-2.5 rounded-2xl shadow-2xl backdrop-blur-xl flex items-center gap-2 text-xs font-medium animate-in fade-in">
          <CheckCircle2 size={16} className="text-emerald-400 flex-shrink-0" />
          <span className="text-emerald-200">{toastMessage}</span>
        </div>
      )}

      {/* Error Alert */}
      {errorMessage && (
        <div className="absolute top-16 left-4 right-4 z-40 bg-rose-950/90 border border-rose-500/40 px-4 py-2.5 rounded-2xl shadow-2xl backdrop-blur-xl flex items-center justify-between text-xs font-medium text-rose-200 animate-in fade-in">
          <div className="flex items-center gap-2">
            <AlertCircle size={16} className="text-rose-400 flex-shrink-0" />
            <span>{errorMessage}</span>
          </div>
          <button onClick={() => setErrorMessage(null)} className="p-1 hover:text-white">
            <X size={14} />
          </button>
        </div>
      )}

      {/* Header - Compact Single Bar with Safe-Area Inset (Bugs 4, 12, 13, 14, 16) */}
      {(() => {
        const cleanRecipientName = (recipientName || 'Advocate')
          .replace(/^Adv\.?\s*/i, '')
          .replace(/^Advocate\s+/i, '')
          .trim();
        const displayRecipient = currentUserRole === 'client' ? `Adv. ${cleanRecipientName}` : cleanRecipientName;

        return (
          <div className="sticky top-0 z-30 flex-shrink-0 bg-white/95 dark:bg-neutral-950/98 border-b border-neutral-200 dark:border-white/[0.08] px-3 sm:px-4 pt-[max(0.75rem,env(safe-area-inset-top))] pb-2.5 flex items-center justify-between backdrop-blur-2xl shadow-sm dark:shadow-md gap-2 text-neutral-900 dark:text-white">
            <div className="flex items-center gap-2.5 min-w-0 flex-1">
              <button
                onClick={onBack}
                className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-neutral-100 hover:bg-neutral-200 dark:bg-white/[0.06] dark:hover:bg-white/[0.12] flex items-center justify-center text-neutral-800 dark:text-neutral-200 transition ios-press border border-neutral-200 dark:border-white/[0.08] shrink-0"
                aria-label="Back to conversations"
              >
                <ArrowLeft size={16} />
              </button>

              <div className="flex items-center gap-2.5 min-w-0 flex-1">
                <div className="relative shrink-0">
                  {recipientPhoto ? (
                    <img
                      src={recipientPhoto}
                      alt={displayRecipient}
                      className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl object-cover border border-neutral-200 dark:border-white/10 shadow-sm dark:shadow-md"
                    />
                  ) : (
                    <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-amber-100 dark:bg-neutral-800 border border-amber-300 dark:border-white/10 flex items-center justify-center text-amber-800 dark:text-amber-300 shadow-sm">
                      {currentUserRole === 'client' ? <Scale size={18} /> : <User size={18} />}
                    </div>
                  )}
                  <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-500 border-2 border-white dark:border-black" />
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <span className="text-xs sm:text-sm font-bold text-neutral-900 dark:text-white tracking-tight truncate">
                      {displayRecipient}
                    </span>
                    <span className="inline-flex items-center gap-1 text-[9px] font-semibold text-emerald-600 dark:text-emerald-400 shrink-0">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 dark:bg-emerald-400" />
                      Active
                    </span>
                  </div>
                  <p className="text-[10px] text-neutral-500 dark:text-neutral-400 truncate">
                    {currentUserRole === 'client' ? 'Verified Legal Counsel' : 'Direct Consultation'}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1 sm:gap-2 shrink-0">
              {/* Collapsible Case Toggle Pill (Bug 12) */}
              {matterSubject && (
                <button
                  type="button"
                  onClick={() => setIsCaseBannerExpanded(prev => !prev)}
                  className="hidden xs:flex items-center gap-1 px-2 py-1 rounded-lg bg-neutral-100 hover:bg-neutral-200 dark:bg-white/[0.05] dark:hover:bg-white/[0.1] border border-neutral-200 dark:border-white/[0.08] text-[10px] text-neutral-700 dark:text-neutral-300 transition"
                  title="Toggle attached case docket"
                >
                  <Paperclip size={11} className="text-amber-600 dark:text-amber-400 shrink-0" />
                  <span className="max-w-[70px] sm:max-w-[120px] truncate font-medium">Matter</span>
                  {isCaseBannerExpanded ? <ChevronUp size={11} /> : <ChevronDown size={11} />}
                </button>
              )}

              {/* Audio Call Button (High contrast in Light & Dark modes) */}
              <button
                type="button"
                onClick={() => {
                  setCallType('audio');
                  setCallModalOpen(true);
                }}
                className="w-8 h-8 rounded-xl bg-emerald-100 hover:bg-emerald-200 border border-emerald-300 dark:bg-emerald-500/20 dark:hover:bg-emerald-500/30 dark:border-emerald-500/40 flex items-center justify-center text-emerald-800 dark:text-emerald-300 transition ios-press shadow-sm"
                title="Audio Call"
              >
                <Phone size={14} />
              </button>

              {/* Video Call Button (High contrast in Light & Dark modes) */}
              <button
                type="button"
                onClick={() => {
                  setCallType('video');
                  setCallModalOpen(true);
                }}
                className="w-8 h-8 rounded-xl bg-amber-100 hover:bg-amber-200 border border-amber-300 dark:bg-amber-400/20 dark:hover:bg-amber-400/30 dark:border-amber-400/40 flex items-center justify-center text-amber-900 dark:text-amber-300 transition ios-press shadow-sm"
                title="Video Call"
              >
                <Video size={14} />
              </button>

              {/* Transfer AI Brief pill button (for client) */}
              {currentUserRole === 'client' && (
                <button
                  onClick={() => setShowTransferConfirm(true)}
                  className={`flex items-center gap-1 px-2.5 py-1 rounded-xl text-[10px] font-semibold transition ios-press ${
                    isAiBriefShared
                      ? 'bg-emerald-100 border border-emerald-300 text-emerald-800 dark:bg-emerald-500/15 dark:border-emerald-500/30 dark:text-emerald-300'
                      : 'bg-amber-100 hover:bg-amber-200 border border-amber-300 text-amber-900 dark:bg-amber-400/20 dark:hover:bg-amber-400/30 dark:border-amber-400/40 dark:text-amber-300'
                  }`}
                >
                  <Sparkles size={11} className={isAiBriefShared ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-300 animate-pulse'} />
                  <span>{isAiBriefShared ? 'Synced' : 'Sync'}</span>
                </button>
              )}
            </div>
          </div>
        );
      })()}

      {/* ── Collapsible Attached Case Banner (Bug 12) ── */}
      <AnimatePresence>
        {isCaseBannerExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden bg-neutral-100 dark:bg-neutral-900 border-b border-neutral-200 dark:border-white/[0.08]"
          >
            <div className="px-4 py-2 flex items-center justify-between text-xs text-neutral-700 dark:text-neutral-300">
              <div className="flex items-center gap-2 truncate">
                <Paperclip size={13} className="text-amber-600 dark:text-amber-400 shrink-0" />
                <span className="font-semibold text-neutral-900 dark:text-white truncate">
                  Attached Case: {matterSubject || 'General Legal Consultation'}
                </span>
              </div>
              <div className="flex items-center gap-2 shrink-0 ml-2">
                <span className="text-[10px] px-2 py-0.5 rounded bg-neutral-200 dark:bg-white/[0.06] text-neutral-700 dark:text-neutral-400 font-medium">
                  Encrypted
                </span>
                <button
                  type="button"
                  onClick={() => setIsCaseBannerExpanded(false)}
                  className="p-1 hover:text-neutral-900 dark:hover:text-white text-neutral-500 dark:text-neutral-400"
                >
                  <X size={12} />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Persistent AI Transfer Reminder Banner (if not transferred yet) */}
      {currentUserRole === 'client' && !isAiBriefShared && (
        <div className="bg-amber-50 dark:bg-gradient-to-r dark:from-amber-500/15 dark:via-amber-500/5 dark:to-transparent border-b border-amber-200 dark:border-amber-500/20 px-4 py-2 flex items-center justify-between">
          <div className="flex items-center gap-2 min-w-0">
            <Sparkles size={13} className="text-amber-600 dark:text-amber-300 flex-shrink-0" />
            <p className="text-[11px] text-amber-900 dark:text-amber-200/90 leading-tight truncate">
              {t(
                'Share your AI consultation brief with the advocate to save time.',
                'वकील को AI केस सारांश भेजें।'
              )}
            </p>
          </div>
          <button
            onClick={handleTransferAIBrief}
            className="px-2.5 py-1 bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold text-[10px] rounded-lg ios-press flex-shrink-0 ml-2 shadow-sm"
          >
            {t('Transfer Now', 'अभी भेजें')}
          </button>
        </div>
      )}

      {/* Messages Feed */}
      <div className="flex-1 min-h-0 overflow-y-auto p-4 space-y-4 relative">
        {/* One-time Transfer Case Popup (citizen only, after 4+ messages) */}
        <AnimatePresence>
          {showTransferPopup && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-5"
            >
              <motion.div
                initial={{ scale: 0.88, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.9, y: 10 }}
                transition={{ type: 'spring', stiffness: 380, damping: 28 }}
                className="bg-[#0E0F14] border border-amber-400/30 rounded-3xl p-5 max-w-xs w-full shadow-2xl space-y-4"
              >
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-2xl bg-amber-400/10 border border-amber-400/20 flex items-center justify-center text-amber-300">
                    <Sparkles size={22} />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white">
                      {t('Transfer Your Case Brief?', 'अपना केस सारांश भेजें?')}
                    </h3>
                    <p className="text-[10px] text-neutral-400 mt-0.5">
                      {t('Save time — share your AI consultation', 'समय बचाएं')}
                    </p>
                  </div>
                </div>
                <p className="text-xs text-neutral-300 leading-relaxed bg-white/[0.03] rounded-2xl p-3 border border-white/[0.06]">
                  {t(
                    'Your AI consultation has valuable facts and applicable sections. Transfer it now so the advocate can review before responding.',
                    'आपकी AI परामर्श में महत्वपूर्ण तथ्य हैं। अभी भेजें ताकि वकील पहले से समझ सकें।'
                  )}
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      setShowTransferPopup(false);
                      setHighlightTransferBtn(true);
                      setTimeout(() => setHighlightTransferBtn(false), 3000);
                    }}
                    className="flex-1 py-2.5 rounded-xl bg-white/[0.08] hover:bg-white/[0.14] text-xs font-semibold text-neutral-300 ios-press"
                  >
                    {t('Not Now', 'बाद में')}
                  </button>
                  <button
                    onClick={async () => {
                      setShowTransferPopup(false);
                      await handleTransferAIBrief();
                    }}
                    className="flex-1 py-2.5 rounded-xl bg-amber-400 text-black text-xs font-bold hover:bg-amber-300 ios-press shadow-md"
                  >
                    {t('Transfer Now', 'अभी भेजें')}
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center p-6 space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-white/[0.04] border border-white/[0.08] flex items-center justify-center text-amber-300">
              <Lock size={20} />
            </div>
            <div>
              <p className="text-sm font-semibold text-white">{t('Direct Secure Channel', 'सुरक्षित विधिक संवाद')}</p>
              <p className="text-xs text-neutral-400 mt-1 max-w-xs">
                {t(
                  'All messages, photos, and files are protected under Advocate-Client confidentiality (Section 126, Indian Evidence Act).',
                  'अधिवक्ता और मुवक्किल के बीच सभी बातचीत व फ़ाइलें पूर्णतः गोपनीय और संरक्षित हैं।'
                )}
              </p>
            </div>
          </div>
        ) : (
          (() => {
            // Sort messages strictly chronologically (Bug 2)
            const sortedMessages = [...messages].sort((a, b) => {
              const getMs = (m: DirectMessage) => {
                if ((m.createdAt as any)?.toMillis) return (m.createdAt as any).toMillis();
                if ((m.createdAt as any)?.seconds) return (m.createdAt as any).seconds * 1000;
                if (typeof m.createdAt === 'string') {
                  const t = new Date(m.createdAt).getTime();
                  if (!isNaN(t)) return t;
                }
                return 0;
              };
              return getMs(a) - getMs(b);
            });

            const getMessageDateLabel = (msg: DirectMessage): string => {
              const raw = (msg.createdAt as any)?.toDate?.() || (typeof msg.createdAt === 'string' ? new Date(msg.createdAt) : null);
              if (raw && !isNaN(raw.getTime())) {
                const today = new Date();
                if (isSameDayIST(raw, today)) return t('Today', 'आज');
                const yest = new Date(today);
                yest.setDate(yest.getDate() - 1);
                if (isSameDayIST(raw, yest)) return t('Yesterday', 'कल');
                return raw.toLocaleDateString(language === 'hi' ? 'hi-IN' : 'en-US', {
                  timeZone: 'Asia/Kolkata',
                  weekday: 'short',
                  day: 'numeric',
                  month: 'short'
                });
              }
              return t('Today', 'आज');
            };

            return sortedMessages.map((msg, idx) => {
              const isMe = msg.senderRole ? msg.senderRole === currentUserRole : msg.senderId === currentUserId;
              const isAiBriefMsg =
                msg.text?.includes('[Transferred AI Consultation Summary]') ||
                msg.text?.includes('📋 AI Legal Brief:');

              const currentDateLabel = getMessageDateLabel(msg);
              const prevMsg = idx > 0 ? sortedMessages[idx - 1] : null;
              const prevDateLabel = prevMsg ? getMessageDateLabel(prevMsg) : null;
              const showDateSeparator = currentDateLabel !== prevDateLabel;

              const displayTime = normalize12HourTime(msg.timestamp) || 'Just now';

              return (
                <React.Fragment key={msg.id}>
                  {showDateSeparator && (
                    <div className="flex items-center justify-center my-2">
                      <span className="text-[10px] font-sans font-semibold text-neutral-400 bg-neutral-900/90 border border-white/[0.08] px-3 py-0.5 rounded-full shadow-sm">
                        {currentDateLabel}
                      </span>
                    </div>
                  )}

                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                    className={`flex gap-2.5 items-end ${isMe ? 'justify-end' : 'justify-start'}`}
                  >
                    {/* Left Avatar for other person */}
                    {!isMe && (
                      <div className="w-8 h-8 rounded-full bg-neutral-800 border border-white/10 flex items-center justify-center text-xs font-bold text-amber-300 shrink-0 mb-1">
                        {(recipientName || 'Client').charAt(0) || 'C'}
                      </div>
                    )}

                    {isAiBriefMsg ? (
                      /* Special AI Brief Card */
                      <div className="max-w-[85%] rounded-3xl p-4 bg-gradient-to-br from-amber-500/15 via-neutral-900 to-neutral-950 border border-amber-400/30 shadow-lg space-y-2 text-left">
                        <div className="flex items-center gap-2 border-b border-amber-400/20 pb-2">
                          <Sparkles size={14} className="text-amber-300" />
                          <span className="text-xs font-bold text-amber-200 tracking-wide">
                            {t('AI Legal Consultation Brief', 'AI विधिक परामर्श सारांश')}
                          </span>
                        </div>
                        <p className="text-xs text-neutral-200 leading-relaxed whitespace-pre-wrap">
                          {msg.text
                            .replace('⚡ [Transferred AI Consultation Summary]', '')
                            .replace('📋 AI Legal Brief:', '')
                            .trim()}
                        </p>
                      </div>
                    ) : (
                      /* Standard Chat Bubble (Fix Bug 1: No white on white) */
                      <div
                        className={`chat-bubble max-w-[82%] sm:max-w-[72%] rounded-2xl px-4 py-2.5 space-y-1.5 shadow-md ${
                          isMe
                            ? '!bg-amber-400 !text-neutral-950 rounded-br-sm border border-amber-500/40 shadow-amber-500/10'
                            : '!bg-white dark:!bg-neutral-800 !text-neutral-900 dark:!text-white rounded-bl-sm border border-neutral-200 dark:border-white/10 shadow-sm'
                        }`}
                      >
                        {/* Image Attachment Rendering */}
                        {msg.attachmentUrl && msg.attachmentType === 'image' && (
                          <div className="relative rounded-xl overflow-hidden border border-black/10 bg-black/40">
                            <img
                              src={msg.attachmentUrl}
                              alt={msg.attachmentName || 'Shared photo'}
                              className="w-full max-h-72 object-cover"
                            />
                          </div>
                        )}

                        {/* Document / File Attachment with Type Badge & Size (Bug 16) */}
                        {msg.attachmentUrl && msg.attachmentType === 'file' && (
                          <div
                            className={`p-2.5 rounded-xl flex items-center justify-between gap-3 border ${
                              isMe
                                ? 'bg-black/15 border-black/20 text-neutral-900'
                                : 'bg-neutral-100 dark:bg-neutral-800 border-neutral-200 dark:border-white/10 text-neutral-900 dark:text-white'
                            }`}
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-900 dark:text-amber-400 flex items-center justify-center shrink-0 font-mono text-[9px] font-bold uppercase">
                                {(msg.attachmentName || 'FILE').split('.').pop()?.slice(0, 4) || 'FILE'}
                              </div>
                              <div className="min-w-0">
                                <p className="text-xs font-semibold truncate leading-tight">
                                  {msg.attachmentName || 'Document.pdf'}
                                </p>
                                <p className="text-[10px] text-neutral-600 dark:text-neutral-400 font-mono">
                                  {msg.attachmentSize || 'PDF Document · 1.2 MB'}
                                </p>
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={() => handleDownloadAttachment(msg.attachmentUrl!, msg.attachmentName || 'doc.pdf')}
                              className="p-1.5 rounded-lg bg-neutral-900 text-white hover:bg-neutral-800 transition shrink-0"
                              title="Download document"
                            >
                              <Download size={13} />
                            </button>
                          </div>
                        )}

                        {/* Text Message */}
                        {msg.text && (
                          <p className={`text-xs leading-relaxed whitespace-pre-wrap select-text font-sans font-medium ${
                            isMe ? '!text-neutral-950' : '!text-neutral-900 dark:!text-neutral-100'
                          }`}>
                            {msg.text}
                          </p>
                        )}

                        {/* Timestamp + Double Checks (Bug 2: Normalized 12h format) */}
                        <div className={`chat-time flex items-center justify-end gap-1 text-[9px] pt-0.5 ${
                          isMe ? '!text-neutral-800 font-medium' : 'text-neutral-500 dark:text-neutral-400'
                        }`}>
                          <span className="font-mono">{displayTime}</span>
                          {isMe && (
                            <span
                              className={`inline-flex items-center text-[11px] font-bold tracking-[-3px] ml-0.5 select-none ${
                                msg.read ? 'text-blue-700 font-black' : 'text-neutral-900 font-bold'
                              }`}
                              title={msg.read ? 'Read' : 'Delivered'}
                            >
                              ✓✓
                            </span>
                          )}
                        </div>
                      </div>
                    )}
                  </motion.div>
                </React.Fragment>
              );
            });
          })()
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Transfer AI Brief Confirmation Modal */}
      {showTransferConfirm && (
        <div className="absolute inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-neutral-950 border border-white/[0.12] rounded-3xl p-5 max-w-sm w-full space-y-4 shadow-2xl">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-amber-400/10 border border-amber-400/20 flex items-center justify-center text-amber-300">
                <Sparkles size={20} />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">
                  {t('Transfer AI Case Summary?', 'AI केस सारांश भेजें?')}
                </h3>
                <p className="text-xs text-neutral-400 mt-0.5">
                  {t('Share your AI consultation details directly', 'अधिवक्ता के साथ सारांश साझा करें')}
                </p>
              </div>
            </div>

            <p className="text-xs text-neutral-300 leading-relaxed bg-white/[0.03] p-3 rounded-2xl border border-white/[0.06]">
              {t(
                'This will format and share your facts, applicable statutory provisions, and suggested legal steps with the advocate to save consultation time.',
                'यह आपके तथ्य और प्रासंगिक कानून की धाराएं वकील को भेज देगा।'
              )}
            </p>

            <div className="flex gap-2">
              <button
                onClick={() => setShowTransferConfirm(false)}
                className="flex-1 py-2.5 rounded-xl bg-white/[0.08] hover:bg-white/[0.14] text-xs font-semibold text-neutral-300 ios-press"
              >
                {t('Cancel', 'रद्द करें')}
              </button>
              <button
                onClick={handleTransferAIBrief}
                className="flex-1 py-2.5 rounded-xl bg-amber-400 text-black text-xs font-bold hover:bg-amber-300 ios-press shadow-md"
              >
                {t('Transfer to Advocate', 'अधिवक्ता को भेजें')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Input Bar with WhatsApp-style + button & Camera (Suggestion 7) ── */}
      <form
        onSubmit={handleSend}
        className="flex-shrink-0 bg-white/95 dark:bg-neutral-950/95 border-t border-neutral-200 dark:border-white/[0.08] p-3 flex items-center gap-2 backdrop-blur-xl relative"
      >
        {/* Hidden File Inputs for Mobile & Desktop (BUGS_20261002 Item 8) */}
        <input
          id="chat-file-input"
          type="file"
          ref={fileInputRef}
          className="hidden"
          accept=".pdf,.doc,.docx,.txt,image/*"
          onChange={handleFileUpload}
        />
        <input
          id="chat-camera-input"
          type="file"
          ref={cameraInputRef}
          className="hidden"
          accept="image/*"
          capture="environment"
          onChange={handleCameraCapture}
        />
        <input
          id="chat-gallery-input"
          type="file"
          ref={galleryInputRef}
          className="hidden"
          accept="image/*"
          onChange={handleGalleryUpload}
        />

        {/* WhatsApp-Style Circular Attachment Drawer Menu (Suggestion 7) */}
        {showAttachmentMenu && (
          <div className="absolute bottom-16 left-3 z-50 bg-white/98 dark:bg-neutral-950/95 border border-neutral-200 dark:border-white/[0.18] rounded-3xl p-4 shadow-2xl backdrop-blur-2xl w-80 sm:w-88 animate-in slide-in-from-bottom-2 space-y-3 text-neutral-900 dark:text-white">
            <div className="flex items-center justify-between pb-1 border-b border-neutral-200 dark:border-white/[0.06]">
              <span className="text-[11px] font-bold text-neutral-500 dark:text-neutral-400 font-mono uppercase tracking-wider">
                Share with Case
              </span>
              <button
                type="button"
                onClick={() => setShowAttachmentMenu(false)}
                className="text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white p-1 text-xs"
              >
                ✕
              </button>
            </div>
            <div className="grid grid-cols-5 gap-2 text-center">
              {/* Document */}
              <label
                htmlFor="chat-file-input"
                onClick={() => setShowAttachmentMenu(false)}
                className="flex flex-col items-center gap-1.5 p-2 rounded-2xl hover:bg-neutral-100 dark:hover:bg-white/[0.06] transition cursor-pointer ios-press"
              >
                <div className="w-11 h-11 rounded-2xl bg-indigo-100 text-indigo-700 border border-indigo-300 dark:bg-indigo-500/20 dark:text-indigo-400 dark:border-indigo-500/40 flex items-center justify-center shadow-sm">
                  <FileText size={20} />
                </div>
                <span className="text-[10px] text-neutral-800 dark:text-neutral-300 font-medium">Document</span>
              </label>

              {/* Camera */}
              <label
                htmlFor="chat-camera-input"
                onClick={() => setShowAttachmentMenu(false)}
                className="flex flex-col items-center gap-1.5 p-2 rounded-2xl hover:bg-neutral-100 dark:hover:bg-white/[0.06] transition cursor-pointer ios-press"
              >
                <div className="w-11 h-11 rounded-2xl bg-rose-100 text-rose-700 border border-rose-300 dark:bg-rose-500/20 dark:text-rose-400 dark:border-rose-500/40 flex items-center justify-center shadow-sm">
                  <Camera size={20} />
                </div>
                <span className="text-[10px] text-neutral-800 dark:text-neutral-300 font-medium">Camera</span>
              </label>

              {/* Gallery */}
              <label
                htmlFor="chat-gallery-input"
                onClick={() => setShowAttachmentMenu(false)}
                className="flex flex-col items-center gap-1.5 p-2 rounded-2xl hover:bg-neutral-100 dark:hover:bg-white/[0.06] transition cursor-pointer ios-press"
              >
                <div className="w-11 h-11 rounded-2xl bg-purple-100 text-purple-700 border border-purple-300 dark:bg-purple-500/20 dark:text-purple-400 dark:border-purple-500/40 flex items-center justify-center shadow-sm">
                  <ImageIcon size={20} />
                </div>
                <span className="text-[10px] text-neutral-800 dark:text-neutral-300 font-medium">Gallery</span>
              </label>

              {/* Location */}
              <button
                type="button"
                onClick={handleShareLocation}
                className="flex flex-col items-center gap-1.5 p-2 rounded-2xl hover:bg-neutral-100 dark:hover:bg-white/[0.06] transition"
              >
                <div className="w-11 h-11 rounded-2xl bg-emerald-100 text-emerald-700 border border-emerald-300 dark:bg-emerald-500/20 dark:text-emerald-400 dark:border-emerald-500/40 flex items-center justify-center shadow-sm">
                  <MapPin size={20} />
                </div>
                <span className="text-[10px] text-neutral-800 dark:text-neutral-300 font-medium">Location</span>
              </button>

              {/* Contact */}
              <button
                type="button"
                onClick={handleShareContact}
                className="flex flex-col items-center gap-1.5 p-2 rounded-2xl hover:bg-neutral-100 dark:hover:bg-white/[0.06] transition"
              >
                <div className="w-11 h-11 rounded-2xl bg-blue-100 text-blue-700 border border-blue-300 dark:bg-blue-500/20 dark:text-blue-400 dark:border-blue-500/40 flex items-center justify-center shadow-sm">
                  <Contact size={20} />
                </div>
                <span className="text-[10px] text-neutral-800 dark:text-neutral-300 font-medium">Contact</span>
              </button>
            </div>
          </div>
        )}

        {/* WhatsApp-Style '+' Button (Suggestion 7) */}
        <button
          type="button"
          onClick={() => setShowAttachmentMenu(prev => !prev)}
          className={`w-9 h-9 rounded-full flex items-center justify-center transition shrink-0 ios-press border ${
            showAttachmentMenu
              ? 'bg-amber-400 text-black border-amber-300 shadow-md rotate-45'
              : 'bg-neutral-100 hover:bg-neutral-200 dark:bg-white/[0.06] dark:hover:bg-white/[0.12] text-neutral-700 hover:text-neutral-900 dark:text-neutral-300 dark:hover:text-white border-neutral-300 dark:border-white/10'
          }`}
          title="Share document, photo, location, contact"
        >
          <Plus size={18} />
        </button>

        {/* Quick Camera Icon Button (Suggestion 7 & BUGS_20261002 Item 8) */}
        <label
          htmlFor="chat-camera-input"
          className="w-9 h-9 rounded-full bg-neutral-100 hover:bg-neutral-200 dark:bg-white/[0.06] dark:hover:bg-white/[0.12] text-neutral-700 hover:text-neutral-900 dark:text-neutral-300 dark:hover:text-white flex items-center justify-center transition shrink-0 ios-press border border-neutral-300 dark:border-white/10 cursor-pointer"
          title="Quick Camera Photo"
        >
          <Camera size={16} />
        </label>

        {/* Pill-shaped text input */}
        <div className="flex-1 bg-neutral-100 dark:bg-white/[0.08] rounded-full flex items-center px-4 py-2 border border-neutral-300 dark:border-white/10 focus-within:border-amber-500 dark:focus-within:border-white/30 transition shadow-inner">
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder={
              currentUserRole === 'lawyer'
                ? t('Type a message...', 'संदेश लिखें...')
                : t('Type a message...', 'संदेश लिखें...')
            }
            className="flex-1 bg-transparent text-xs text-neutral-900 dark:text-white placeholder-neutral-500 dark:placeholder-neutral-400 outline-none"
          />
        </div>

        {/* Circular Send Button */}
        <button
          type="submit"
          disabled={!inputText.trim() || isSending}
          className="w-10 h-10 rounded-full bg-amber-500 hover:bg-amber-400 text-neutral-950 dark:bg-white dark:hover:bg-neutral-200 dark:text-black flex items-center justify-center font-bold disabled:opacity-30 ios-press transition flex-shrink-0 shadow-lg cursor-pointer"
        >
          {isSending ? (
            <div className="w-4 h-4 rounded-full border-2 border-black/30 border-t-black animate-spin" />
          ) : (
            <Send size={15} className="ml-0.5" />
          )}
        </button>
      </form>

      {/* Audio / Video Call Modal (Bug 14) */}
      <CallModal
        isOpen={callModalOpen}
        onClose={() => setCallModalOpen(false)}
        callType={callType}
        recipientName={recipientName}
        recipientPhoto={recipientPhoto}
        language={language}
      />
    </div>
  );
};
