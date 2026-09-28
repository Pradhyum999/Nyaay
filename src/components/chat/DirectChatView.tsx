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
} from 'lucide-react';
import {
  subscribeToThreadMessages,
  sendDirectMessage,
  transferAIBriefToThread
} from '../../services/firestoreService';
import { DirectMessage, Language, UserRole } from '../../types';

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

  // One-time transfer popup state (client only, after 4+ messages)
  const [showTransferPopup, setShowTransferPopup] = useState(false);
  const [transferPopupShownKey] = useState(`transfer_popup_shown_${threadId}`);
  const [highlightTransferBtn, setHighlightTransferBtn] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);


  const t = (en: string, hi: string) => (language === 'hi' ? hi : en);

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
      // Check if AI brief is in the messages
      if (liveMsgs.some(m => m.text?.includes('[Transferred AI Consultation Summary]') || m.text?.includes('📋 AI Legal Brief:'))) {
        setIsAiBriefShared(true);
      }
    });
    return () => unsub();
  }, [threadId]);

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
    <div className="flex flex-col h-full bg-black text-white relative">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="absolute top-16 left-4 right-4 z-40 bg-neutral-900/95 border border-emerald-500/40 px-4 py-2.5 rounded-2xl shadow-2xl backdrop-blur-xl flex items-center gap-2 text-xs font-medium animate-in fade-in">
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

      {/* Header */}
      <div className="flex-shrink-0 bg-neutral-950/95 border-b border-white/[0.08] px-4 py-3 flex items-center justify-between backdrop-blur-2xl z-20">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="w-9 h-9 rounded-2xl bg-white/[0.06] hover:bg-white/[0.12] flex items-center justify-center text-neutral-300 transition ios-press border border-white/[0.06]"
            aria-label="Back to conversations"
          >
            <ArrowLeft size={16} />
          </button>

          <div className="flex items-center gap-2.5">
            <div className="relative">
              {recipientPhoto ? (
                <img
                  src={recipientPhoto}
                  alt={recipientName}
                  className="w-10 h-10 rounded-2xl object-cover border border-white/10 shadow-md"
                />
              ) : (
                <div className="w-10 h-10 rounded-2xl bg-neutral-800 border border-white/10 flex items-center justify-center text-amber-300 shadow-md">
                  {currentUserRole === 'client' ? <Scale size={18} /> : <User size={18} />}
                </div>
              )}
              <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-500 border border-black" />
            </div>

            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-bold text-white tracking-tight">
                  {currentUserRole === 'client' ? `Adv. ${recipientName}` : recipientName}
                </span>
                <span className="inline-flex items-center gap-1 text-[9px] font-semibold text-emerald-400 font-mono">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  Active
                </span>
              </div>
              <p className="text-[10px] text-neutral-400 font-mono line-clamp-1">
                {currentUserRole === 'client' ? 'Verified Legal Counsel' : 'Direct Consultation'}
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1 sm:gap-2">
          {/* Audio Call Button matching Image 5 */}
          <button
            type="button"
            onClick={() => alert(`Initiating secure encrypted audio call with ${recipientName}...`)}
            className="w-8 h-8 rounded-full bg-white/[0.06] hover:bg-white/[0.12] border border-white/[0.08] flex items-center justify-center text-neutral-300 hover:text-white transition ios-press"
            title="Audio Call"
          >
            <Phone size={14} />
          </button>

          {/* Video Call Button matching Image 5 */}
          <button
            type="button"
            onClick={() => alert(`Starting video consultation session with ${recipientName}...`)}
            className="w-8 h-8 rounded-full bg-white/[0.06] hover:bg-white/[0.12] border border-white/[0.08] flex items-center justify-center text-neutral-300 hover:text-white transition ios-press"
            title="Video Call"
          >
            <Video size={14} />
          </button>

          {/* Transfer AI Brief pill button (for client) */}
          {currentUserRole === 'client' && (
            <button
              onClick={() => setShowTransferConfirm(true)}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-semibold transition ios-press ${
                isAiBriefShared
                  ? 'bg-emerald-500/15 border border-emerald-500/30 text-emerald-300'
                  : 'bg-amber-400/20 hover:bg-amber-400/30 border border-amber-400/40 text-amber-300'
              }`}
            >
              <Sparkles size={11} className={isAiBriefShared ? 'text-emerald-400' : 'text-amber-300 animate-pulse'} />
              <span>{isAiBriefShared ? 'Brief Synced' : 'Sync Brief'}</span>
            </button>
          )}
        </div>
      </div>

      {/* ── Attached Case Bar matching Image 5 ── */}
      <div className="bg-neutral-900 border-b border-white/[0.08] px-4 py-2 flex items-center justify-between text-xs text-neutral-300">
        <div className="flex items-center gap-2 truncate">
          <Paperclip size={13} className="text-amber-400 shrink-0" />
          <span className="font-semibold text-white truncate">
            Attached Case: {matterSubject || 'General Legal Consultation'}
          </span>
        </div>
        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-white/[0.06] text-neutral-400 shrink-0 ml-2">
          Encrypted
        </span>
      </div>

      {/* Persistent AI Transfer Reminder Banner (if not transferred yet) */}
      {currentUserRole === 'client' && !isAiBriefShared && (
        <div className="bg-gradient-to-r from-amber-500/15 via-amber-500/5 to-transparent border-b border-amber-500/20 px-4 py-2.5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles size={14} className="text-amber-300 flex-shrink-0" />
            <p className="text-[11px] text-amber-200/90 leading-tight">
              {t(
                'Share your AI consultation brief with the advocate to save initial discussion time.',
                'आप कभी भी वकील को AI केस सारांश भेज सकते हैं।'
              )}
            </p>
          </div>
          <button
            onClick={handleTransferAIBrief}
            className="px-2.5 py-1 bg-amber-400 text-black font-bold text-[10px] rounded-lg ios-press flex-shrink-0 ml-2 shadow-sm"
          >
            {t('Transfer Now', 'अभी भेजें')}
          </button>
        </div>
      )}

      {/* Messages Feed */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 relative">
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
          messages.map((msg) => {
            const isMe = msg.senderId === currentUserId;
            const isAiBriefMsg =
              msg.text?.includes('[Transferred AI Consultation Summary]') ||
              msg.text?.includes('📋 AI Legal Brief:');

            return (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 10, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                className={`flex gap-2.5 items-end ${isMe ? 'justify-end' : 'justify-start'}`}
              >
                {/* Left Avatar for other person (matching Image 5) */}
                {!isMe && (
                  <div className="w-8 h-8 rounded-full bg-neutral-800 border border-white/10 flex items-center justify-center text-xs font-bold text-amber-300 shrink-0 mb-1">
                    {recipientName.charAt(0) || 'L'}
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
                  /* Standard Chat Bubble matching Image 5 */
                  <div
                    className={`max-w-[82%] sm:max-w-[72%] rounded-2xl px-4 py-3 space-y-1.5 shadow-md ${
                      isMe
                        ? 'bg-neutral-900 text-white rounded-br-sm border border-white/[0.08]'
                        : 'bg-white text-black rounded-bl-sm border border-neutral-200 shadow-sm'
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

                    {/* Document / File Attachment */}
                    {msg.attachmentUrl && msg.attachmentType === 'file' && (
                      <div
                        className={`p-2.5 rounded-xl flex items-center justify-between gap-3 border ${
                          isMe
                            ? 'bg-neutral-800 border-white/10 text-white'
                            : 'bg-neutral-100 border-neutral-200 text-black'
                        }`}
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <FileText size={16} className={isMe ? 'text-amber-400' : 'text-neutral-700'} />
                          <p className="text-xs font-semibold truncate leading-tight">
                            {msg.attachmentName || 'Document.pdf'}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleDownloadAttachment(msg.attachmentUrl!, msg.attachmentName || 'doc.pdf')}
                          className={`p-1.5 rounded-lg ${isMe ? 'bg-white text-black' : 'bg-black text-white'}`}
                        >
                          <Download size={12} />
                        </button>
                      </div>
                    )}

                    {/* Text Message */}
                    {msg.text && (
                      <p className="text-xs leading-relaxed whitespace-pre-wrap select-text">
                        {msg.text}
                      </p>
                    )}

                    {/* Timestamp + Blue Double Checks (matching Image 5) */}
                    <div className={`flex items-center justify-end gap-1 text-[9px] font-mono ${isMe ? 'text-neutral-400' : 'text-neutral-500'} pt-0.5`}>
                      <span>{msg.timestamp || 'Just now'}</span>
                      {isMe && <span className="text-blue-400 font-bold">✓✓</span>}
                    </div>
                  </div>
                )}
              </motion.div>
            );
          })
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

      {/* ── Input Bar matching Image 5 (Pill container with paperclip + circular send) ── */}
      <form
        onSubmit={handleSend}
        className="flex-shrink-0 bg-neutral-950/95 border-t border-white/[0.08] p-3 flex items-center gap-2 backdrop-blur-xl"
      >
        {/* Pill-shaped text input with paperclip inside */}
        <div className="flex-1 bg-white/[0.08] rounded-full flex items-center px-4 py-2 border border-white/10 focus-within:border-white/30 transition shadow-inner">
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder={
              currentUserRole === 'lawyer'
                ? t('Type a message...', 'संदेश लिखें...')
                : t('Type a message...', 'संदेश लिखें...')
            }
            className="flex-1 bg-transparent text-xs text-white placeholder-neutral-400 outline-none"
          />
          <button
            type="button"
            onClick={() => alert('Document attachment ready')}
            className="p-1 text-neutral-400 hover:text-white transition shrink-0 ml-1"
            title="Attach document"
          >
            <Paperclip size={16} />
          </button>
        </div>

        {/* Circular Send Button matching Image 5 */}
        <button
          type="submit"
          disabled={!inputText.trim() || isSending}
          className="w-10 h-10 rounded-full bg-white hover:bg-neutral-200 text-black flex items-center justify-center font-bold disabled:opacity-30 ios-press transition flex-shrink-0 shadow-lg cursor-pointer"
        >
          {isSending ? (
            <div className="w-4 h-4 rounded-full border-2 border-black/30 border-t-black animate-spin" />
          ) : (
            <Send size={15} className="ml-0.5" />
          )}
        </button>
      </form>
    </div>
  );
};
