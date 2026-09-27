import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Send, Sparkles, Mic, Bot, User, Loader2, FolderPlus, CheckCircle2,
  MapPin, Scale, AlertTriangle, FileText, HelpCircle, ChevronRight
} from 'lucide-react';
import { Language, ChatMessage, CaseProfile } from '../../types';
import { runCaseIntakeTurn, isCaseAIConfigured } from '../../lib/caseAI';
import { createCaseFromProfile } from '../../services/firestoreService';
import { useAuth } from '../../contexts/AuthContext';

interface ClientAIConsultationProps {
  language: Language;
  onCaseCreated?: (caseId: string) => void;
}

const QUICK_CHIPS = {
  en: [
    '🏠 My landlord has refused to return my ₹1.5 lakh deposit.',
    ' I was terminated without notice or dues.',
    '👨‍👩‍👧 I want to file for divorce and custody.',
    '🚗 I had a motor accident and need compensation.',
    '🏪 A seller refused refund for a defective product.',
  ],
  hi: [
    '🏠 मकान मालिक ने मेरी ₹1.5 लाख जमा राशि लौटाने से इनकार किया।',
    '💼 मुझे बिना नोटिस नौकरी से निकाल दिया गया।',
    '‍👩‍ मैं तलाक और बच्चे की हिरासत की याचिका दायर करना चाहता हूं।',
    ' मुझे मोटर दुर्टना हुई, मुआवजा चाहिए।',
    ' विक्रेता ने खराब उत्पाद का रिफंड देने से इनकार किया।',
  ],
};

export function ClientAIConsultation({ language, onCaseCreated }: ClientAIConsultationProps) {
  const { user, profile } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [profileData, setProfileData] = useState<CaseProfile | null>(null);
  const [isSavingCase, setIsSavingCase] = useState(false);
  const [caseCreatedId, setCaseCreatedId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const t = (en: string, hi: string) => language === 'hi' ? hi : en;
  const chips = QUICK_CHIPS[language];

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    const welcome: ChatMessage = {
      id: 'welcome',
      role: 'assistant',
      content: language === 'hi'
        ? ' नमस्ते! मैं NAYANEETI इनटेक हूं। अपनी कानूनी समस्या साधारण शब्दों में बताइए — मैं आपसे कुछ सवाल पूछूंगा और फिर आपका केस प्रोफाइल बनाऊंगा ताकि सही वकील से मिल सकें।\n\n⚠️ यह सामान्य जानकारी है, कानूनी सलाह नहीं।'
        : '🙏 Hello! I\'m NAYANEETI Intake. Describe your legal problem in plain words — I\'ll ask a few questions and then build your case profile so the right lawyer can help.\n\n⚠️ This is general information, not legal advice.',
      timestamp: new Date().toISOString(),
      isStreaming: false,
    };
    setMessages([welcome]);
  }, [language]);

  const sendMessage = async (text: string) => {
    if (!text.trim() || isLoading) return;

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: text,
      timestamp: new Date().toISOString(),
    };
    const nextMessages = [...messages, userMsg];
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    if (!isCaseAIConfigured()) {
      setTimeout(() => {
        setMessages(prev => [...prev, {
          id: `ai-${Date.now()}`,
          role: 'assistant',
          content: t(
            'Running in Demo Mode — Gemini API key not configured. Add VITE_GEMINI_API_KEY to .env to enable structured case intake.',
            'Demo मोड — Gemini API key सेट नहीं है। .env में VITE_GEMINI_API_KEY जोड़ें।'
          ),
          timestamp: new Date().toISOString(),
        }]);
        setIsLoading(false);
      }, 600);
      return;
    }

    try {
      const history = nextMessages
        .filter(m => m.id !== 'welcome')
        .map(m => ({ role: m.role, content: m.content }));

      const result = await runCaseIntakeTurn(text, history, language);

      setMessages(prev => [...prev, {
        id: `ai-${Date.now()}`,
        role: 'assistant',
        content: result.text || t('Please continue.', 'कृपया जारी रखें।'),
        timestamp: new Date().toISOString(),
      }]);

      if (result.profile) {
        setProfileData(result.profile);
      }
    } catch (err) {
      setMessages(prev => [...prev, {
        id: `ai-${Date.now()}`,
        role: 'assistant',
        content: t('Sorry, something went wrong. Please try again.', 'मा़ करें, कुछ गलत हुआ। पुनः प्रयास करें।'),
        timestamp: new Date().toISOString(),
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleBuildCase = async () => {
    if (!profileData || isSavingCase) return;
    setIsSavingCase(true);
    try {
      const caseId = await createCaseFromProfile({
        clientId: user?.uid || `client-${Date.now()}`,
        clientName: profile?.name || 'Citizen Client',
        clientPhone: profile?.phone || '',
        profile: profileData,
      });
      setCaseCreatedId(caseId);
      onCaseCreated?.(caseId);
    } catch (err) {
      console.warn('Failed to create case from profile:', err);
    } finally {
      setIsSavingCase(false);
    }
  };

  const hasConversation = messages.some(m => m.role === 'user');

  return (
    <div className="flex flex-col h-full bg-black">
      {/* Header */}
      <div className="flex-shrink-0 px-4 pt-3 pb-3 border-b border-white/[0.06]">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-amber-500/20 to-amber-600/30 border border-amber-500/30 flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-amber-300" />
          </div>
          <div>
            <p className="text-white text-sm font-semibold tracking-tight">{t('Build My Case', 'मेरा केस बनाएं')}</p>
            <div className="flex items-center gap-1">
              <div className={`w-1.5 h-1.5 rounded-full ${isCaseAIConfigured() ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`} />
              <p className="text-white/40 text-[10px] font-mono">
                {isCaseAIConfigured() ? t('AI Case Intake · Live', 'AI केस इनटेक · लाव') : t('Demo Mode', 'डेमो मोड')}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
        {messages.map(msg => (
          <motion.div
            key={msg.id}
            initial={{ opacity: 0, x: msg.role === 'user' ? 16 : -16, scale: 0.96 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            className={`flex gap-2.5 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
          >
            <div className={`w-7 h-7 rounded-full flex-shrink-0 flex items-center justify-center ${
              msg.role === 'user'
                ? 'bg-emerald-500/20 border border-emerald-500/30'
                : 'bg-gradient-to-br from-purple-500 to-blue-600'
            }`}>
              {msg.role === 'user' ? <User className="w-3.5 h-3.5 text-emerald-400" /> : <Bot className="w-3.5 h-3.5 text-white" />}
            </div>
            <div className={`max-w-[80%] rounded-2xl px-4 py-3 ${
              msg.role === 'user'
                ? 'bg-white/10 border border-white/10 rounded-tr-sm'
                : 'glass-card border border-white/[0.08] rounded-tl-sm'
            }`}>
              {msg.content ? (
                <p className="text-white text-sm leading-relaxed whitespace-pre-wrap">
                  {msg.content.replace(/\*\*/g, '')}
                </p>
              ) : (
                <div className="flex gap-1.5 items-center py-1">
                  <div className="w-2 h-2 rounded-full bg-white/50 animate-typing-dot-1" />
                  <div className="w-2 h-2 rounded-full bg-white/50 animate-typing-dot-2" />
                  <div className="w-2 h-2 rounded-full bg-white/50 animate-typing-dot-3" />
                </div>
              )}
            </div>
          </motion.div>
        ))}

        {/* Quick chips */}
        <AnimatePresence>
          {!hasConversation && (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ type: 'spring', stiffness: 360, damping: 28 }}
              className="pt-2"
            >
              <p className="text-white/30 text-xs mb-3 text-center">{t('Describe your problem', 'अपनी समस्या बताएं')}</p>
              <div className="flex flex-col gap-2">
                {chips.map((chip, i) => (
                  <motion.div
                    key={chip}
                    initial={{ opacity: 0, x: -16 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05, type: 'spring', stiffness: 360, damping: 26 }}
                  >
                    <button
                      type="button"
                      onClick={() => sendMessage(chip)}
                      className="w-full text-left px-3.5 py-2.5 glass-card rounded-xl border border-white/10 text-white/70 text-xs hover:text-white hover:border-amber-400/30 transition-all ios-press cursor-pointer"
                    >
                      {chip}
                    </button>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div ref={messagesEndRef} />
      </div>

      {/* ── CASE PROFILE CARD ─────────────────────────────────────────────── */}
      {profileData && (
        <div className="flex-shrink-0 mx-4 mb-2 glass-card rounded-2xl border border-amber-500/25 p-4 space-y-3 max-h-[45%] overflow-y-auto">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <Scale size={14} className="text-amber-300" />
              <span className="text-xs font-bold text-amber-200 uppercase tracking-wide">{t('Case Profile', 'केस प्रोफाइल')}</span>
            </div>
            <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full">
              {profileData.confidenceScore}% {t('confident', 'विश्वास')}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2 text-[11px]">
            <div className="bg-black/40 rounded-xl p-2 border border-white/[0.05]">
              <span className="text-neutral-500 block text-[9px] uppercase">{t('Matter', 'विषय')}</span>
              <span className="text-white font-semibold">{profileData.matterType}</span>
            </div>
            <div className="bg-black/40 rounded-xl p-2 border border-white/[0.05]">
              <span className="text-neutral-500 block text-[9px] uppercase">{t('Legal Area', 'कानूनी क्षेत्र')}</span>
              <span className="text-white font-semibold">{profileData.legalArea}</span>
            </div>
          </div>

          {profileData.location && (
            <div className="flex items-center gap-1.5 text-[11px] text-neutral-300">
              <MapPin size={12} className="text-amber-400" />
              <span>{profileData.location}</span>
            </div>
          )}

          {profileData.summaryText && (
            <p className="text-[11px] text-neutral-300 leading-relaxed bg-black/40 rounded-xl p-2.5 border border-white/[0.05]">
              {profileData.summaryText}
            </p>
          )}

          {profileData.facts.length > 0 && (
            <div>
              <span className="text-[10px] uppercase font-semibold text-neutral-400 block mb-1">{t('Key Facts', 'मुख्य तथ्य')}</span>
              {profileData.facts.map((f, i) => (
                <p key={i} className="text-[11px] text-neutral-300 flex gap-1.5"><span className="text-amber-400">•</span>{f}</p>
              ))}
            </div>
          )}

          {profileData.documentsRequired.length > 0 && (
            <div>
              <span className="text-[10px] uppercase font-semibold text-neutral-400 block mb-1 flex items-center gap-1">
                <FileText size={11} /> {t('Documents Needed', 'आवश्यक दस्तावेज़')}
              </span>
              <div className="flex flex-wrap gap-1">
                {profileData.documentsRequired.map((d, i) => (
                  <span key={i} className="text-[10px] px-2 py-0.5 rounded-lg bg-white/[0.04] text-neutral-300 border border-white/[0.06]">{d}</span>
                ))}
              </div>
            </div>
          )}

          {profileData.missingInfo.length > 0 && (
            <div>
              <span className="text-[10px] uppercase font-semibold text-amber-400/80 block mb-1 flex items-center gap-1">
                <HelpCircle size={11} /> {t('Still needed', 'अभी आवश्यक')}
              </span>
              {profileData.missingInfo.map((m, i) => (
                <p key={i} className="text-[11px] text-neutral-400 flex gap-1.5"><span className="text-amber-400/60">?</span>{m}</p>
              ))}
            </div>
          )}

          {/* Build case action */}
          {caseCreatedId ? (
            <div className="flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/25 rounded-xl p-2.5">
              <CheckCircle2 size={15} className="text-emerald-400" />
              <span className="text-[11px] text-emerald-300 font-medium">
                {t('Case Room created. Track it under "My Case".', 'केस रूम बन गया। "मेरा केस" में देखें।')}
              </span>
            </div>
          ) : (
            <button
              onClick={handleBuildCase}
              disabled={isSavingCase}
              className="w-full py-3 rounded-2xl bg-white text-black font-bold text-xs flex items-center justify-center gap-2 ios-press disabled:opacity-50"
            >
              {isSavingCase
                ? <><Loader2 size={14} className="animate-spin" />{t('Building...', 'बना रहे हैं...')}</>
                : <><FolderPlus size={15} />{t('Build My Case Room', 'मेरा केस रूम बनाएं')}<ChevronRight size={14} /></>}
            </button>
          )}

          <div className="flex items-start gap-1.5 text-[9px] text-neutral-500">
            <AlertTriangle size={11} className="shrink-0 mt-0.5" />
            <span>{t('Informational only, not legal advice. A licensed advocate must be consulted for your matter.', 'केवल जानकारी, कानूनी सलाह नहीं। योग्य अधिवक्ता से मिलें।')}</span>
          </div>
        </div>
      )}

      {/* Input Area */}
      <div className="flex-shrink-0 px-4 pb-4 pt-2 border-t border-white/[0.06]">
        <div className="flex items-end gap-2">
          <div className="flex-1 glass-card rounded-2xl border border-white/10 overflow-hidden flex items-end">
            <textarea
              ref={inputRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  sendMessage(input);
                }
              }}
              placeholder={t('Describe your legal problem...', 'अपनी कानूनी समस्या बताएं...')}
              rows={1}
              className="flex-1 bg-transparent px-4 py-3 text-white placeholder-white/30 outline-none text-sm resize-none max-h-28"
              style={{ minHeight: '44px' }}
            />
            <button onClick={() => {}} className="p-3 text-white/40">
              <Mic className="w-4 h-4" />
            </button>
          </div>
          <button
            onClick={() => sendMessage(input)}
            disabled={!input.trim() || isLoading}
            className="w-11 h-11 rounded-2xl bg-white flex items-center justify-center ios-press disabled:opacity-40 flex-shrink-0"
          >
            {isLoading ? <Loader2 className="w-4 h-4 text-black animate-spin" /> : <Send className="w-4 h-4 text-black" />}
          </button>
        </div>
      </div>
    </div>
  );
}