import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Send, Sparkles, Mic, Bot, User, Loader2, FolderPlus, CheckCircle2,
  MapPin, Scale, AlertTriangle, FileText, HelpCircle, ChevronRight,
  ChevronDown
} from 'lucide-react';
import { Language, ChatMessage, CaseProfile } from '../../types';
import { runCaseIntakeTurn, isCaseAIConfigured } from '../../lib/caseAI';
import { createCaseFromProfile } from '../../services/firestoreService';
import { useAuth } from '../../contexts/AuthContext';

interface ClientAIConsultationProps {
  language: Language;
  onCaseCreated?: (caseId: string) => void;
  onCaseProfileReady?: (profile: CaseProfile) => void;
  onDirectToDirectory?: () => void;
}

const QUICK_CHIPS = {
  en: [
    '⚖️ Offence under Section 69 BNS / Cheating & Inducement',
    '🏠 My landlord has refused to return my ₹1.5 lakh deposit.',
    '💼 I was terminated without notice or dues.',
    '👨‍👩‍👧 I want to file for divorce and custody.',
    '🚗 I had a motor accident and need compensation.',
    '🏪 A seller refused refund for a defective product.',
  ],
  hi: [
    '⚖️ धारा 69 बीएनएस / धोखाधड़ी और झूठे वादे का मामला',
    '🏠 मकान मालिक ने मेरी ₹1.5 लाख जमा राशि लौटाने से इनकार किया।',
    '💼 मुझे बिना नोटिस नौकरी से निकाल दिया गया।',
    '👨‍👩‍👧 मैं तलाक और बच्चे की हिरासत की याचिका दायर करना चाहता हूं।',
    '🚗 मुझे मोटर दुर्घटना हुई, मुआवजा चाहिए।',
    '🏪 विक्रेता ने खराब उत्पाद का रिफंड देने से इनकार किया।',
  ],
  mr: [
    '⚖️ कलम ६९ बीएनएस / फसवणूक आणि खोटे आश्वासन',
    '🏠 घरमालकाने माझी ₹1.5 लाख ठेव परत करण्यास नकार दिला आहे.',
    '💼 मला कोणतीही नोटीस न देता कामावरून काढून टाकले.',
    '👨‍👩‍👧 मला घटस्फोट आणि मुलाच्या ताब्यासाठी अर्ज करायचा आहे.',
    '🚗 माझा अपघात झाला असून भरपाई हवी आहे.',
    '🏪 विक्रेत्याने सदोष उत्पादनाचा परतावा देण्यास नकार दिला.',
  ],
};

/** Render **bold** markdown as <strong> elements */
function renderBold(text: string): React.ReactNode {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={i}>{part.slice(2, -2)}</strong>;
    }
    return part;
  });
}

export function ClientAIConsultation({
  language,
  onCaseCreated,
  onCaseProfileReady,
  onDirectToDirectory,
}: ClientAIConsultationProps) {
  const { user, profile } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [profileData, setProfileData] = useState<CaseProfile | null>(null);
  const [isSavingCase, setIsSavingCase] = useState(false);
  const [caseCreatedId, setCaseCreatedId] = useState<string | null>(null);
  const [currentModelUsed, setCurrentModelUsed] = useState<string>('NYAAY Legal AI');
  const [bannerExpanded, setBannerExpanded] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const t = (en: string, hi: string, mr?: string) =>
    language === 'mr' && mr ? mr : language === 'hi' ? hi : en;
  const chips = QUICK_CHIPS[language] || QUICK_CHIPS.en;

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  useEffect(() => {
    const welcome: ChatMessage = {
      id: 'welcome',
      role: 'assistant',
      content: language === 'mr'
        ? '👋 नमस्कार! मी NYAAY AI आहे — भारतीय कायद्याबद्दल तुमचा सहायक. कायदेशीर हक्क, न्यायालय प्रक्रिया, किंवा तुमची समस्या सांगा.\n\n⚠️ ही कायदेशीर माहिती आहे, अधिकृत सल्ला नाही.'
        : language === 'hi'
        ? '👋 नमस्ते! मैं NYAAY AI हूं — आपका भारतीय कानून सहायक। आप मुझसे अपने अधिकार, कोर्ट प्रक्रिया, किसी भी कानूनी धारा के बारे में पूछ सकते हैं।\n\n⚠️ यह कानूनी जानकारी है, औपचारिक सलाह नहीं।'
        : '👋 Hi! I am NYAAY AI — your legal assistant for Indian law. You can ask me anything about your legal rights, court procedures, statutes, or describe your situation and I will help guide you.\n\n⚠️ I provide legal information, not formal legal advice.',
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

    // Capture previous history before appending the new user message
    const previousHistory = messages
      .filter(m => m.id !== 'welcome')
      .map(m => ({ role: m.role, content: m.content }));

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    try {
      const result = await runCaseIntakeTurn(text, previousHistory, language);
      if (result.modelUsed) {
        setCurrentModelUsed(result.modelUsed);
      }

      setMessages(prev => [...prev, {
        id: `ai-${Date.now()}`,
        role: 'assistant',
        content: result.text || t('Please continue describing the situation.', 'कृपया आगे बताएं।', 'कृपया पुढे सांगा.'),
        timestamp: new Date().toISOString(),
      }]);

      if (result.profile) {
        setProfileData(result.profile);
        setBannerExpanded(false);
        onCaseProfileReady?.(result.profile);
      }
    } catch (err) {
      console.warn("Intake turn fallback executed:", err);
      setMessages(prev => [...prev, {
        id: `ai-${Date.now()}`,
        role: 'assistant',
        content: t(
          'I understand your situation. Please tell me more about key dates, any written documents or notices exchanged, and what outcome you are seeking.',
          'मैं आपकी स्थिति समझ रहा हूँ। कृपया महत्वपूर्ण तिथियों, दस्तावेजों और आप क्या समाधान चाहते हैं, इसके बारे में और बताएं।',
          'मला आपली अडचण समजली. कृपया महत्त्वाच्या तारखा, कागदपत्रे आणि आपल्याला काय हवे आहे याबद्दल अधिक माहिती द्या.'
        ),
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

      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <div className="flex-shrink-0 px-4 pt-3 pb-3 border-b border-white/[0.06]">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-purple-500/20 to-blue-600/30 border border-purple-500/30 flex items-center justify-center">
            <Bot className="w-4 h-4 text-purple-300" />
          </div>
          <div>
            <p className="text-white text-sm font-semibold tracking-tight">
              {t('NYAAY Legal AI', 'न्याय AI सहायक', 'न्याय AI सहाय्यक')}
            </p>
            <div className="flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <p className="text-white/60 text-[10px] font-mono">
                {currentModelUsed}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ── Messages ────────────────────────────────────────────────────────── */}
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
              <p className="text-white text-sm leading-relaxed whitespace-pre-wrap">
                {renderBold(msg.content)}
              </p>
            </div>
          </motion.div>
        ))}

        {/* Typing indicator — separate AI bubble shown while loading */}
        <AnimatePresence>
          {isLoading && (
            <motion.div
              key="typing-indicator"
              initial={{ opacity: 0, x: -16, scale: 0.96 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.92 }}
              transition={{ type: 'spring', stiffness: 400, damping: 30 }}
              className="flex gap-2.5"
            >
              <div className="w-7 h-7 rounded-full flex-shrink-0 flex items-center justify-center bg-gradient-to-br from-purple-500 to-blue-600">
                <Bot className="w-3.5 h-3.5 text-white" />
              </div>
              <div className="glass-card border border-white/[0.08] rounded-2xl rounded-tl-sm px-4 py-3">
                <div className="flex gap-1.5 items-center py-1">
                  <div className="w-2 h-2 rounded-full bg-white/50 animate-typing-dot-1" />
                  <div className="w-2 h-2 rounded-full bg-white/50 animate-typing-dot-2" />
                  <div className="w-2 h-2 rounded-full bg-white/50 animate-typing-dot-3" />
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Quick chips — visible before any user message */}
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

      {/* ── Case Summary Banner (minimizable, bottom) ───────────────────────── */}
      <AnimatePresence>
        {profileData && (
          <motion.div
            key="case-banner"
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 40 }}
            transition={{ type: 'spring', stiffness: 340, damping: 30 }}
            className="flex-shrink-0 mx-4 mb-2"
          >
            {/* Banner toggle pill */}
            <button
              type="button"
              onClick={() => setBannerExpanded(prev => !prev)}
              className="w-full flex items-center justify-between px-4 py-2.5 glass-card rounded-2xl border border-amber-500/30 text-amber-200 text-xs font-semibold ios-press"
            >
              <div className="flex items-center gap-2">
                <Scale size={13} className="text-amber-300" />
                <span>{t('Case Summary Ready — View Details', 'केस सारांश तैयार — विवरण देखें', 'केस सारांश तयार — तपशील पहा')}</span>
              </div>
              <motion.div
                animate={{ rotate: bannerExpanded ? 180 : 0 }}
                transition={{ duration: 0.2 }}
              >
                <ChevronDown size={14} className="text-amber-300" />
              </motion.div>
            </button>

            {/* Expandable details */}
            <AnimatePresence>
              {bannerExpanded && (
                <motion.div
                  key="banner-content"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.25, ease: 'easeInOut' }}
                  className="overflow-hidden"
                >
                  <div className="mt-1.5 glass-card rounded-2xl border border-amber-500/20 p-4 space-y-3 max-h-64 overflow-y-auto">
                    {/* Confidence + matter */}
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wide">
                        {profileData.matterType} · {profileData.legalArea}
                      </span>
                      <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full">
                        {profileData.confidenceScore}% {t('confident', 'विश्वास')}
                      </span>
                    </div>

                    {/* Location */}
                    {profileData.location && (
                      <div className="flex items-center gap-1.5 text-[11px] text-neutral-300">
                        <MapPin size={11} className="text-amber-400 shrink-0" />
                        <span>{profileData.location}</span>
                      </div>
                    )}

                    {/* Summary */}
                    {profileData.summaryText && (
                      <p className="text-[11px] text-neutral-300 leading-relaxed">
                        {profileData.summaryText}
                      </p>
                    )}

                    {/* Key facts */}
                    {profileData.facts.length > 0 && (
                      <div>
                        <span className="text-[10px] uppercase font-semibold text-neutral-400 block mb-1">
                          {t('Key Facts', 'मुख्य तथ्य', 'मुख्य तथ्ये')}
                        </span>
                        {profileData.facts.map((f, i) => (
                          <p key={i} className="text-[11px] text-neutral-300 flex gap-1.5">
                            <span className="text-amber-400">•</span>{f}
                          </p>
                        ))}
                      </div>
                    )}

                    {/* Documents needed */}
                    {profileData.documentsRequired.length > 0 && (
                      <div>
                        <span className="text-[10px] uppercase font-semibold text-neutral-400 mb-1 flex items-center gap-1">
                          <FileText size={10} /> {t('Documents Needed', 'आवश्यक दस्तावेज़', 'आवश्यक कागदपत्रे')}
                        </span>
                        <div className="flex flex-wrap gap-1">
                          {profileData.documentsRequired.map((d, i) => (
                            <span key={i} className="text-[10px] px-2 py-0.5 rounded-lg bg-white/[0.04] text-neutral-300 border border-white/[0.06]">{d}</span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Missing info */}
                    {profileData.missingInfo.length > 0 && (
                      <div>
                        <span className="text-[10px] uppercase font-semibold text-amber-400/80 mb-1 flex items-center gap-1">
                          <HelpCircle size={10} /> {t('Still needed', 'अभी आवश्यक', 'अजून आवश्यक')}
                        </span>
                        {profileData.missingInfo.map((m, i) => (
                          <p key={i} className="text-[11px] text-neutral-400 flex gap-1.5">
                            <span className="text-amber-400/60">?</span>{m}
                          </p>
                        ))}
                      </div>
                    )}

                    {/* Build Case Room button */}
                    {caseCreatedId ? (
                      <div className="flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/25 rounded-xl p-2.5">
                        <CheckCircle2 size={15} className="text-emerald-400" />
                        <span className="text-[11px] text-emerald-300 font-medium">
                          {t('Case Room created. Track it under "My Case".', 'केस रूम बन गया। "मेरा केस" में देखें।', 'केस रूम तयार झाला. "माझा केस" मध्ये पहा.')}
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
                          : <><FolderPlus size={15} />{t('Build My Case Room', 'मेरा केस रूम बनाएं', 'माझा केस रूम बनवा')}<ChevronRight size={14} /></>}
                      </button>
                    )}

                    <div className="flex items-start gap-1.5 text-[9px] text-neutral-500">
                      <AlertTriangle size={11} className="shrink-0 mt-0.5" />
                      <span>{t('Informational only, not legal advice. A licensed advocate must be consulted for your matter.', 'केवल जानकारी, कानूनी सलाह नहीं। योग्य अधिवक्ता से मिलें।', 'केवळ माहिती, कायदेशीर सल्ला नाही. योग्य वकिलाशी संपर्क साधा.')}</span>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Input Area ──────────────────────────────────────────────────────── */}
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