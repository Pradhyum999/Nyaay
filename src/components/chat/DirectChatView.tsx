import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Send,
  ArrowLeft,
  ShieldCheck,
  Sparkles,
  Paperclip,
  CheckCircle2,
  AlertCircle,
  FileText,
  Clock,
  User,
  Scale,
  Image as ImageIcon,
  X,
  Download,
  Eye,
  Maximize2,
  Lock,
  FileCheck
} from 'lucide-react';
import {
  subscribeToThreadMessages,
  sendDirectMessage,
  transferAIBriefToThread
} from '../../services/firestoreService';
import { DirectMessage, Language, UserRole } from '../../types';
import { compressImageFile } from '../../utils/imageUtils';

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
  onBack: () => void;
}

interface PendingAttachment {
  dataUrl: string;
  type: 'image' | 'file';
  name: string;
  size: string;
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
  onBack,
}) => {
  const [messages, setMessages] = useState<DirectMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [isAiBriefShared, setIsAiBriefShared] = useState<boolean>(aiBriefAttached);
  const [showTransferConfirm, setShowTransferConfirm] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSending, setIsSending] = useState(false);

  // Attachment state
  const [pendingAttachment, setPendingAttachment] = useState<PendingAttachment | null>(null);
  const [activeLightboxImage, setActiveLightboxImage] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
  }, [messages, pendingAttachment]);

  // Handle Image Selection & Compression
  const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setErrorMessage(null);
      // Compress image to lightweight JPEG data URL
      const compressedDataUrl = await compressImageFile(file, 900, 900, 0.75);
      setPendingAttachment({
        dataUrl: compressedDataUrl,
        type: 'image',
        name: file.name,
        size: formatFileSize(Math.round(compressedDataUrl.length * 0.75)),
      });
    } catch (err) {
      console.warn("Image compression error:", err);
      setErrorMessage(t('Could not process image file', 'फोटो प्रोसेस नहीं हो सकी'));
    } finally {
      if (imageInputRef.current) imageInputRef.current.value = '';
    }
  };

  // Handle Document Selection
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Safety size check (600 KB limit for inline document messaging)
    if (file.size > 650 * 1024) {
      setErrorMessage(
        t(
          `Document exceeds 600 KB limit (${formatFileSize(file.size)}). Please upload a smaller file or compressed PDF.`,
          `फ़ाइल 600 KB से बड़ी है (${formatFileSize(file.size)})। कृपया छोटी फ़ाइल चुनें।`
        )
      );
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    setErrorMessage(null);
    const reader = new FileReader();
    reader.onload = () => {
      setPendingAttachment({
        dataUrl: reader.result as string,
        type: 'file',
        name: file.name,
        size: formatFileSize(file.size),
      });
    };
    reader.onerror = () => {
      setErrorMessage(t('Failed to read document', 'दस्तावेज़ पढ़ने में असमर्थ'));
    };
    reader.readAsDataURL(file);

    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSend = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const trimmed = inputText.trim();
    if (!trimmed && !pendingAttachment) return;

    setIsSending(true);
    setErrorMessage(null);

    const attachmentPayload = pendingAttachment
      ? {
          hasAttachment: true,
          attachmentUrl: pendingAttachment.dataUrl,
          attachmentName: pendingAttachment.name,
          attachmentType: pendingAttachment.type,
          attachmentSize: pendingAttachment.size,
        }
      : {};

    // Clear inputs immediately for responsiveness
    const textToSend = trimmed;
    setInputText('');
    setPendingAttachment(null);

    try {
      await sendDirectMessage(threadId, {
        senderId: currentUserId,
        senderName: currentUserName,
        senderRole: currentUserRole,
        text: textToSend,
        ...attachmentPayload,
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
                <ShieldCheck size={13} className="text-amber-400" />
              </div>
              <div className="flex items-center gap-1 text-[10px] text-neutral-400 font-mono line-clamp-1">
                <Lock size={9} className="text-emerald-400 flex-shrink-0" />
                <span>{matterSubject || t('Direct Consultation', 'प्रत्यक्ष परामर्श')}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Transfer AI Brief pill button (for client) */}
        {currentUserRole === 'client' && (
          <button
            onClick={() => setShowTransferConfirm(true)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-semibold transition ios-press ${
              isAiBriefShared
                ? 'bg-emerald-500/15 border border-emerald-500/30 text-emerald-300'
                : 'bg-amber-400/20 hover:bg-amber-400/30 border border-amber-400/40 text-amber-300 shadow-[0_0_12px_rgba(245,197,99,0.2)]'
            }`}
          >
            <Sparkles size={12} className={isAiBriefShared ? 'text-emerald-400' : 'text-amber-300 animate-pulse'} />
            <span className="hidden sm:inline">
              {isAiBriefShared ? t('AI Brief Synced', 'AI सारांश साझा') : t('Transfer AI Brief', 'AI केस सारांश भेजें')}
            </span>
            <span className="sm:hidden">
              {isAiBriefShared ? t('Synced', 'साझा') : t('AI Brief', 'AI ब्रीफ')}
            </span>
          </button>
        )}
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
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
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
                initial={{ opacity: 0, x: isMe ? 20 : -20, scale: 0.96 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
              >
                <div className="flex items-center gap-1.5 mb-1 px-1">
                  <span className="text-[10px] text-neutral-400 font-medium">
                    {isMe ? t('You', 'आप') : msg.senderName}
                  </span>
                  <span className="text-[9px] text-neutral-500 font-mono">{msg.timestamp}</span>
                </div>

                {isAiBriefMsg ? (
                  /* Special AI Brief Card */
                  <div className="max-w-[88%] rounded-3xl p-4 bg-gradient-to-br from-amber-500/15 via-neutral-900 to-neutral-950 border border-amber-400/30 shadow-[0_4px_20px_rgba(245,197,99,0.1)] space-y-2 text-left">
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
                    <div className="flex items-center gap-1 text-[10px] text-amber-300/80 pt-1">
                      <ShieldCheck size={12} />
                      <span>{t('Certified Client AI Intake · Privileged', 'प्रमाणित क्लाइंट AI इनटेक · विधिक विशेषाधिकार')}</span>
                    </div>
                  </div>
                ) : (
                  /* Standard Chat Bubble (with optional Image / Document attachment) */
                  <div
                    className={`max-w-[82%] sm:max-w-[75%] rounded-3xl p-3.5 space-y-2 shadow-md ${
                      isMe
                        ? 'bg-neutral-100 text-black rounded-tr-sm'
                        : 'bg-neutral-900/90 text-white border border-white/[0.08] rounded-tl-sm backdrop-blur-xl'
                    }`}
                  >
                    {/* Image Attachment Rendering */}
                    {msg.attachmentUrl && msg.attachmentType === 'image' && (
                      <div className="relative group rounded-2xl overflow-hidden border border-black/10 dark:border-white/10 bg-black/40">
                        <img
                          src={msg.attachmentUrl}
                          alt={msg.attachmentName || 'Shared photo'}
                          className="w-full max-h-72 object-cover cursor-pointer hover:opacity-95 transition"
                          onClick={() => setActiveLightboxImage(msg.attachmentUrl!)}
                        />
                        <div
                          onClick={() => setActiveLightboxImage(msg.attachmentUrl!)}
                          className="absolute bottom-2 right-2 px-2 py-1 rounded-lg bg-black/60 backdrop-blur-md text-white text-[10px] font-medium flex items-center gap-1 cursor-pointer opacity-90 group-hover:opacity-100 transition"
                        >
                          <Maximize2 size={11} />
                          <span>{t('View Full', 'बड़ा देखें')}</span>
                        </div>
                      </div>
                    )}

                    {/* Document / File Attachment Rendering */}
                    {msg.attachmentUrl && msg.attachmentType === 'file' && (
                      <div
                        className={`p-3 rounded-2xl flex items-center justify-between gap-3 border ${
                          isMe
                            ? 'bg-neutral-200/80 border-neutral-300 text-neutral-900'
                            : 'bg-neutral-800/80 border-white/10 text-white'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div
                            className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${
                              isMe ? 'bg-neutral-300 text-neutral-900' : 'bg-neutral-700 text-amber-300'
                            }`}
                          >
                            <FileText size={18} />
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs font-semibold truncate leading-tight">
                              {msg.attachmentName || 'Legal_Document.pdf'}
                            </p>
                            <p className="text-[10px] opacity-70 font-mono mt-0.5">
                              {msg.attachmentSize || 'Document'}
                            </p>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() =>
                            handleDownloadAttachment(
                              msg.attachmentUrl!,
                              msg.attachmentName || 'document.pdf'
                            )
                          }
                          className={`p-2 rounded-xl flex items-center justify-center transition flex-shrink-0 ${
                            isMe
                              ? 'bg-neutral-900 text-white hover:bg-neutral-800'
                              : 'bg-white text-black hover:bg-neutral-200'
                          }`}
                          title="Download document"
                        >
                          <Download size={14} />
                        </button>
                      </div>
                    )}

                    {/* Text Message */}
                    {msg.text && (
                      <p className="text-xs leading-relaxed whitespace-pre-wrap select-text">
                        {msg.text}
                      </p>
                    )}
                  </div>
                )}
              </motion.div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Fullscreen Image Lightbox Modal */}
      <AnimatePresence>
        {activeLightboxImage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 bg-black/95 backdrop-blur-2xl flex flex-col items-center justify-between p-4"
          >
            {/* Lightbox Toolbar */}
            <div className="w-full flex items-center justify-between max-w-4xl py-2">
              <span className="text-xs text-neutral-400 font-mono">
                {t('Confidential Case Photo', 'गोपनीय केस फ़ोटो')}
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() =>
                    handleDownloadAttachment(activeLightboxImage, 'nyaayneeti_photo.jpg')
                  }
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/[0.1] hover:bg-white/[0.2] text-xs font-semibold text-white transition ios-press"
                >
                  <Download size={14} />
                  <span>{t('Save Photo', 'सहेजें')}</span>
                </button>
                <button
                  onClick={() => setActiveLightboxImage(null)}
                  className="p-2 rounded-xl bg-white/[0.1] hover:bg-white/[0.2] text-white transition ios-press"
                  aria-label="Close photo view"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Centered Image */}
            <motion.div
              initial={{ scale: 0.88 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              transition={{ type: 'spring', stiffness: 360, damping: 28 }}
              className="flex-1 flex items-center justify-center max-w-4xl max-h-[80vh] w-full p-2"
            >
              <img
                src={activeLightboxImage}
                alt="Expanded view"
                className="max-h-full max-w-full object-contain rounded-2xl shadow-2xl border border-white/10"
              />
            </motion.div>

            <div className="text-[11px] text-neutral-500 py-2">
              {t('Protected under Indian Evidence Act Section 126', 'भारतीय साक्ष्य अधिनियम के तहत संरक्षित')}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

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

      {/* Pending Attachment Preview (Above Input) */}
      {pendingAttachment && (
        <div className="bg-neutral-900 border-t border-amber-400/30 px-4 py-2.5 flex items-center justify-between animate-in fade-in">
          <div className="flex items-center gap-3 min-w-0">
            {pendingAttachment.type === 'image' ? (
              <img
                src={pendingAttachment.dataUrl}
                alt="Preview"
                className="w-10 h-10 rounded-xl object-cover border border-white/20 flex-shrink-0"
              />
            ) : (
              <div className="w-10 h-10 rounded-xl bg-amber-400/20 border border-amber-400/30 flex items-center justify-center text-amber-300 flex-shrink-0">
                <FileCheck size={20} />
              </div>
            )}
            <div className="min-w-0">
              <p className="text-xs font-bold text-white truncate">
                {pendingAttachment.name}
              </p>
              <p className="text-[10px] text-amber-300 font-mono">
                {pendingAttachment.type === 'image' ? t('Photo ready', 'फ़ोटो तैयार') : t('Document ready', 'फ़ाइल तैयार')} • {pendingAttachment.size}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setPendingAttachment(null)}
            className="p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-neutral-300 hover:text-white transition ios-press"
            title="Remove attachment"
          >
            <X size={15} />
          </button>
        </div>
      )}

      {/* Hidden File Inputs */}
      <input
        ref={imageInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleImageSelect}
      />
      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf,.doc,.docx,.txt"
        className="hidden"
        onChange={handleFileSelect}
      />

      {/* Input Bar */}
      <form
        onSubmit={handleSend}
        className="flex-shrink-0 bg-neutral-950 border-t border-white/[0.08] p-3 flex items-center gap-2"
      >
        {/* Photo Upload Action */}
        <button
          type="button"
          onClick={() => imageInputRef.current?.click()}
          className="w-10 h-10 rounded-2xl bg-neutral-900 hover:bg-neutral-800 border border-white/10 flex items-center justify-center text-neutral-300 hover:text-amber-300 transition ios-press flex-shrink-0"
          title={t('Share Photo', 'फ़ोटो साझा करें')}
        >
          <ImageIcon size={18} />
        </button>

        {/* Document Upload Action */}
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="w-10 h-10 rounded-2xl bg-neutral-900 hover:bg-neutral-800 border border-white/10 flex items-center justify-center text-neutral-300 hover:text-amber-300 transition ios-press flex-shrink-0"
          title={t('Share Document / PDF', 'दस्तावेज़ / पीडीएफ साझा करें')}
        >
          <Paperclip size={18} />
        </button>

        {/* Text Input */}
        <div className="flex-1 glass-card rounded-2xl flex items-center px-3.5 py-2 border border-white/10 focus-within:border-amber-400/50 transition">
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder={
              currentUserRole === 'lawyer'
                ? t('Message client...', 'मुवक्किल को संदेश लिखें...')
                : t('Message advocate...', 'अधिवक्ता को संदेश लिखें...')
            }
            className="flex-1 bg-transparent text-xs text-white placeholder-neutral-500 outline-none"
          />
        </div>

        {/* Send Button */}
        <button
          type="submit"
          disabled={(!inputText.trim() && !pendingAttachment) || isSending}
          className="w-10 h-10 rounded-2xl bg-amber-400 text-black flex items-center justify-center font-bold disabled:opacity-30 ios-press hover:bg-amber-300 transition flex-shrink-0 shadow-[0_2px_12px_rgba(245,197,99,0.25)]"
        >
          {isSending ? (
            <div className="w-4 h-4 rounded-full border-2 border-black/30 border-t-black animate-spin" />
          ) : (
            <Send size={16} />
          )}
        </button>
      </form>
    </div>
  );
};
