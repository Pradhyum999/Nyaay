import React, { useState, useEffect, useRef } from 'react';
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
  Scale
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
  onBack,
}) => {
  const [messages, setMessages] = useState<DirectMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [isAiBriefShared, setIsAiBriefShared] = useState<boolean>(aiBriefAttached);
  const [showTransferConfirm, setShowTransferConfirm] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const t = (en: string, hi: string) => language === 'hi' ? hi : en;

  // Realtime subscription to thread messages
  useEffect(() => {
    if (!threadId) return;
    const unsub = subscribeToThreadMessages(threadId, (liveMsgs) => {
      setMessages(liveMsgs);
      // Check if AI brief is in the messages
      if (liveMsgs.some(m => m.text.includes('[Transferred AI Consultation Summary]') || m.text.includes('📋 AI Legal Brief:'))) {
        setIsAiBriefShared(true);
      }
    });
    return () => unsub();
  }, [threadId]);

  // Auto scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const trimmed = inputText.trim();
    if (!trimmed) return;

    setInputText('');
    try {
      await sendDirectMessage(threadId, {
        senderId: currentUserId,
        senderName: currentUserName,
        senderRole: currentUserRole,
        text: trimmed,
      });
    } catch (err) {
      console.warn("Failed to send message:", err);
    }
  };

  const handleTransferAIBrief = async () => {
    const briefContent = aiBriefText || 
      `Summary of legal inquiry: ${matterSubject}. The client consulted NAYANEETI AI regarding legal recourse, applicable statutory sections (such as IPC/BNS, CrPC/BNSS, or NI Act Sec 138), and factual timeline. Verified for advocate handoff.`;

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

  return (
    <div className="flex flex-col h-full bg-black text-white relative">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="absolute top-16 left-4 right-4 z-40 bg-neutral-900/95 border border-emerald-500/40 px-4 py-2.5 rounded-2xl shadow-2xl backdrop-blur-xl flex items-center gap-2 text-xs font-medium animate-in fade-in">
          <CheckCircle2 size={16} className="text-emerald-400 flex-shrink-0" />
          <span className="text-emerald-200">{toastMessage}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex-shrink-0 bg-neutral-950/90 border-b border-white/[0.08] px-4 py-3 flex items-center justify-between backdrop-blur-xl">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="w-8 h-8 rounded-full bg-white/[0.06] hover:bg-white/[0.12] flex items-center justify-center text-neutral-300 transition ios-press"
          >
            <ArrowLeft size={16} />
          </button>

          <div className="flex items-center gap-2.5">
            <div className="relative">
              {recipientPhoto ? (
                <img
                  src={recipientPhoto}
                  alt={recipientName}
                  className="w-10 h-10 rounded-2xl object-cover border border-white/10"
                />
              ) : (
                <div className="w-10 h-10 rounded-2xl bg-neutral-800 border border-white/10 flex items-center justify-center text-amber-300">
                  {currentUserRole === 'client' ? <Scale size={18} /> : <User size={18} />}
                </div>
              )}
              <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-500 border border-black" />
            </div>

            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-bold text-white tracking-tight">{recipientName}</span>
                <ShieldCheck size={13} className="text-amber-400" />
              </div>
              <p className="text-[10px] text-neutral-400 font-mono line-clamp-1">
                {matterSubject}
              </p>
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
            <Sparkles size={12} className={isAiBriefShared ? "text-emerald-400" : "text-amber-300 animate-pulse"} />
            <span>{isAiBriefShared ? t('AI Brief Synced', 'AI सारांश साझा') : t('Transfer AI Brief', 'AI केस सारांश भेजें')}</span>
          </button>
        )}
      </div>

      {/* Persistent AI Transfer Reminder Banner (if not transferred yet) */}
      {currentUserRole === 'client' && !isAiBriefShared && (
        <div className="bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent border-b border-amber-500/20 px-4 py-2.5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles size={14} className="text-amber-300 flex-shrink-0" />
            <p className="text-[11px] text-amber-200/90 leading-tight">
              {t(
                'You chose not to transfer AI summary earlier. You can share it anytime to brief the advocate.',
                'आप कभी भी वकील को AI केस सारांश भेज सकते हैं।'
              )}
            </p>
          </div>
          <button
            onClick={handleTransferAIBrief}
            className="px-2.5 py-1 bg-amber-400 text-black font-semibold text-[10px] rounded-lg ios-press flex-shrink-0 ml-2"
          >
            {t('Transfer Now', 'अभी भेजें')}
          </button>
        </div>
      )}

      {/* Messages List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center p-6 space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-white/[0.04] border border-white/[0.08] flex items-center justify-center text-neutral-400">
              <Clock size={20} />
            </div>
            <div>
              <p className="text-sm font-semibold text-white">{t('Direct Secure Channel', 'सुरक्षित विधिक संवाद')}</p>
              <p className="text-xs text-neutral-500 mt-1 max-w-xs">
                {t(
                  'All messages between client and advocate are protected by client-attorney confidentiality.',
                  'अधिवक्ता और मुवक्किल के बीच सभी बातचीत गोपनीय और सुरक्षित है।'
                )}
              </p>
            </div>
          </div>
        ) : (
          messages.map((msg) => {
            const isMe = msg.senderId === currentUserId;
            const isAiBriefMsg = msg.text.includes('[Transferred AI Consultation Summary]') || msg.text.includes('📋 AI Legal Brief:');

            return (
              <div
                key={msg.id}
                className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
              >
                <div className="flex items-center gap-1.5 mb-1 px-1">
                  <span className="text-[10px] text-neutral-500 font-medium">
                    {isMe ? t('You', 'आप') : msg.senderName}
                  </span>
                  <span className="text-[9px] text-neutral-600 font-mono">{msg.timestamp}</span>
                </div>

                {isAiBriefMsg ? (
                  /* Special AI Brief Box */
                  <div className="max-w-[88%] rounded-2xl p-4 bg-gradient-to-br from-amber-500/15 via-neutral-900 to-neutral-950 border border-amber-400/30 shadow-[0_4px_20px_rgba(245,197,99,0.1)] space-y-2 text-left">
                    <div className="flex items-center gap-2 border-b border-amber-400/20 pb-2">
                      <Sparkles size={14} className="text-amber-300" />
                      <span className="text-xs font-bold text-amber-200 tracking-wide">
                        {t('AI Legal Consultation Brief', 'AI विधिक परामर्श सारांश')}
                      </span>
                    </div>
                    <p className="text-xs text-neutral-200 leading-relaxed whitespace-pre-wrap">
                      {msg.text.replace('⚡ [Transferred AI Consultation Summary]', '').replace('📋 AI Legal Brief:', '').trim()}
                    </p>
                    <div className="flex items-center gap-1 text-[10px] text-amber-300/70 pt-1">
                      <ShieldCheck size={12} />
                      <span>{t('Certified Client AI Intake · Confidential', 'प्रमाणित क्लाइंट AI इनटेक · गोपनीय')}</span>
                    </div>
                  </div>
                ) : (
                  /* Standard Chat Bubble */
                  <div
                    className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-xs leading-relaxed ${
                      isMe
                        ? 'bg-white text-black font-medium rounded-tr-sm shadow-md'
                        : 'bg-neutral-900/90 text-white border border-white/[0.08] rounded-tl-sm'
                    }`}
                  >
                    <p className="whitespace-pre-wrap">{msg.text}</p>
                  </div>
                )}
              </div>
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
                <h3 className="text-sm font-bold text-white">{t('Transfer AI Case Summary?', 'AI केस सारांश भेजें?')}</h3>
                <p className="text-xs text-neutral-400 mt-0.5">{t('Share your AI consultation details directly', 'अधिवक्ता के साथ सारांश साझा करें')}</p>
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
                className="flex-1 py-2.5 rounded-xl bg-amber-400 text-black text-xs font-bold hover:bg-amber-300 ios-press"
              >
                {t('Transfer to Advocate', 'अधिवक्ता को भेजें')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Input Bar */}
      <form
        onSubmit={handleSend}
        className="flex-shrink-0 bg-neutral-950 border-t border-white/[0.08] p-3 flex items-center gap-2"
      >
        <div className="flex-1 glass-card rounded-2xl flex items-center px-3.5 py-2 border border-white/10 focus-within:border-white/25 transition">
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder={t('Type a message to advocate...', 'संदेश लिखें...')}
            className="flex-1 bg-transparent text-xs text-white placeholder-neutral-500 outline-none"
          />
        </div>

        <button
          type="submit"
          disabled={!inputText.trim()}
          className="w-10 h-10 rounded-2xl bg-white text-black flex items-center justify-center font-bold disabled:opacity-30 ios-press hover:bg-neutral-200 transition flex-shrink-0"
        >
          <Send size={15} />
        </button>
      </form>
    </div>
  );
};

