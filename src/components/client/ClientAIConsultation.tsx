import React, { useState, useRef, useEffect } from 'react';
import { Send, Sparkles, Share2, Mic, ChevronDown, Bot, User, AlertCircle, Loader2 } from 'lucide-react';
import { Language, ChatMessage } from '../../types';
import { streamLegalQuery, generateCaseBrief, isGeminiConfigured } from '../../lib/gemini';
import { saveAIBrief } from '../../services/firestoreService';
import { useAuth } from '../../contexts/AuthContext';

interface ClientAIConsultationProps {
  language: Language;
}

const QUICK_CHIPS = {
  en: [
    '🏠 Property dispute with landlord',
    '💼 Wrongful termination at work',
    '👨‍👩‍👧 Divorce and child custody',
    '🚗 Motor accident compensation',
    '🏪 Consumer complaint',
    '💰 Loan recovery harassment',
    '📄 FIR filing process',
    '🔒 Bail procedure',
  ],
  hi: [
    '🏠 मकान मालिक से विवाद',
    '💼 नौकरी से अनुचित बर्खास्तगी',
    '👨‍👩‍👧 तलाक और बाल हिरासत',
    '🚗 मोटर दुर्घटना मुआवजा',
    '🏪 उपभोक्ता शिकायत',
    '💰 ऋण वसूली उत्पीड़न',
    '📄 FIR दर्ज करने की प्रक्रिया',
    '🔒 जमानत प्रक्रिया',
  ],
};

export function ClientAIConsultation({ language }: ClientAIConsultationProps) {
  const { user, profile } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [previousInteractionId, setPreviousInteractionId] = useState<string | undefined>();
  const [showShareModal, setShowShareModal] = useState(false);
  const [isSharingBrief, setIsSharingBrief] = useState(false);
  const [briefSaved, setBriefSaved] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const t = (en: string, hi: string) => language === 'hi' ? hi : en;
  const chips = QUICK_CHIPS[language];

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Welcome message
  useEffect(() => {
    const welcome: ChatMessage = {
      id: 'welcome',
      role: 'assistant',
      content: language === 'hi'
        ? '🙏 नमस्ते! मैं Nyaay AI हूं - आपका कानूनी सहायक। आप मुझसे भारतीय कानून से जुड़े किसी भी सवाल पूछ सकते हैं। मैं आपकी मदद करने की पूरी कोशिश करूंगा।\n\n⚠️ याद रखें: मैं सामान्य कानूनी जानकारी देता हूं, कानूनी सलाह नहीं। किसी भी गंभीर मामले के लिए योग्य वकील से मिलें।'
        : '🙏 Hello! I\'m Nyaay AI, your legal assistant. You can ask me anything about Indian law — property disputes, family matters, criminal procedures, consumer rights, and more.\n\n⚠️ Note: I provide general legal information, not legal advice. For serious matters, please consult a qualified advocate.',
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
      isStreaming: false,
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    if (!isGeminiConfigured()) {
      // Demo mode
      setTimeout(() => {
        const demoResponse: ChatMessage = {
          id: `ai-${Date.now()}`,
          role: 'assistant',
          content: language === 'hi'
            ? `आपने पूछा: "${text}"\n\nDemo Mode में हूं - Gemini API key नहीं मिली। .env फ़ाइल में VITE_GEMINI_API_KEY जोड़ें।\n\n**अस्थायी जानकारी:** भारत में अधिकांश कानूनी मामलों के लिए आप अपने नजदीकी जिला न्यायालय से सहायता प्राप्त कर सकते हैं।`
            : `You asked: "${text}"\n\nRunning in Demo Mode — Gemini API key not configured. Add VITE_GEMINI_API_KEY to your .env file.\n\n**General tip:** For most legal matters in India, you can start by consulting at your nearest District Court legal aid cell (available free of charge under Section 12 of the Legal Services Authorities Act).`,
          timestamp: new Date().toISOString(),
          isStreaming: false,
        };
        setMessages(prev => [...prev, demoResponse]);
        setIsLoading(false);
      }, 800);
      return;
    }

    // Streaming response
    const aiMsgId = `ai-${Date.now()}`;
    const streamingMsg: ChatMessage = {
      id: aiMsgId,
      role: 'assistant',
      content: '',
      timestamp: new Date().toISOString(),
      isStreaming: true,
    };
    setMessages(prev => [...prev, streamingMsg]);

    try {
      await streamLegalQuery(
        text,
        (chunk) => {
          setMessages(prev => prev.map(m =>
            m.id === aiMsgId ? { ...m, content: m.content + chunk } : m
          ));
        },
        (interactionId) => {
          setMessages(prev => prev.map(m =>
            m.id === aiMsgId ? { ...m, isStreaming: false } : m
          ));
          setPreviousInteractionId(interactionId);
          setIsLoading(false);
        },
        previousInteractionId,
        language
      );
    } catch (err) {
      setMessages(prev => prev.map(m =>
        m.id === aiMsgId
          ? { ...m, content: t('Sorry, something went wrong. Please try again.', 'माफ़ करें, कुछ गलत हुआ। कृपया पुनः प्रयास करें।'), isStreaming: false }
          : m
      ));
      setIsLoading(false);
    }
  };

  const handleShareBrief = async () => {
    setIsSharingBrief(true);
    try {
      const chatHistory = messages
        .filter(m => m.id !== 'welcome')
        .map(m => ({ role: m.role, content: m.content }));

      let briefText = '';
      if (isGeminiConfigured()) {
        briefText = await generateCaseBrief(chatHistory, language);
      } else {
        briefText = `Case Brief (Demo)\n\nClient: ${profile?.name || 'Unknown'}\nDate: ${new Date().toLocaleDateString()}\n\nConversation Summary:\n${chatHistory.map(m => `${m.role}: ${m.content.slice(0, 100)}...`).join('\n')}`;
      }

      // Save to Firestore
      await saveAIBrief({
        clientId: user?.uid || 'demo-client',
        clientName: profile?.name || 'Client',
        chatHistory,
        briefText,
        consentGiven: true,
        sharedWithLawyer: true,
        urgencyLevel: 'medium',
      });

      setBriefSaved(true);
      setShowShareModal(false);
      setTimeout(() => setBriefSaved(false), 3000);
    } catch {
      // Fail silently
    } finally {
      setIsSharingBrief(false);
    }
  };

  const hasConversation = messages.filter(m => m.id !== 'welcome' && m.role === 'user').length > 0;

  return (
    <div className="flex flex-col h-full bg-black">
      {/* Header */}
      <div className="flex-shrink-0 px-4 pt-3 pb-3 border-b border-white/[0.06]">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-blue-600 flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <div>
              <p className="text-white text-sm font-semibold">Nyaay AI</p>
              <div className="flex items-center gap-1">
                <div className={`w-1.5 h-1.5 rounded-full ${isGeminiConfigured() ? 'bg-emerald-400 animate-pulse' : 'bg-yellow-400'}`} />
                <p className="text-white/40 text-[10px]">
                  {isGeminiConfigured() ? t('Online · Gemini 3.8', 'ऑनलाइन · Gemini 3.8') : t('Demo Mode', 'डेमो मोड')}
                </p>
              </div>
            </div>
          </div>
          {hasConversation && (
            <button
              onClick={() => setShowShareModal(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 glass-card rounded-xl border border-white/10 ios-press"
            >
              <Share2 className="w-3.5 h-3.5 text-white/70" />
              <span className="text-white/70 text-xs">{t('Share Brief', 'Brief शेयर करें')}</span>
            </button>
          )}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
        {messages.map(msg => (
          <div key={msg.id} className={`flex gap-2.5 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
            {/* Avatar */}
            <div className={`w-7 h-7 rounded-full flex-shrink-0 flex items-center justify-center ${
              msg.role === 'user'
                ? 'bg-emerald-500/20 border border-emerald-500/30'
                : 'bg-gradient-to-br from-purple-500 to-blue-600'
            }`}>
              {msg.role === 'user'
                ? <User className="w-3.5 h-3.5 text-emerald-400" />
                : <Bot className="w-3.5 h-3.5 text-white" />
              }
            </div>

            {/* Bubble */}
            <div className={`max-w-[80%] rounded-2xl px-4 py-3 ${
              msg.role === 'user'
                ? 'bg-white/10 border border-white/10 rounded-tr-sm'
                : 'glass-card border border-white/[0.08] rounded-tl-sm'
            }`}>
              {msg.content ? (
                <p className="text-white text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</p>
              ) : (
                <div className="flex gap-1 items-center py-1">
                  <div className="w-2 h-2 rounded-full bg-white/40 animate-bounce" style={{ animationDelay: '0ms' }} />
                  <div className="w-2 h-2 rounded-full bg-white/40 animate-bounce" style={{ animationDelay: '150ms' }} />
                  <div className="w-2 h-2 rounded-full bg-white/40 animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              )}
              {msg.isStreaming && <span className="inline-block w-0.5 h-4 bg-white/60 animate-pulse ml-0.5 align-middle" />}
            </div>
          </div>
        ))}

        {/* Quick Chips — shown when no conversation yet */}
        {messages.filter(m => m.id !== 'welcome').length === 0 && (
          <div className="pt-2">
            <p className="text-white/30 text-xs mb-3 text-center">{t('Common questions', 'सामान्य प्रश्न')}</p>
            <div className="flex flex-wrap gap-2 justify-center">
              {chips.map(chip => (
                <button
                  key={chip}
                  onClick={() => sendMessage(chip)}
                  className="px-3 py-2 glass-card rounded-xl border border-white/10 text-white/70 text-xs ios-press"
                >
                  {chip}
                </button>
              ))}
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Brief Saved Toast */}
      {briefSaved && (
        <div className="flex-shrink-0 mx-4 mb-2 bg-emerald-500/20 border border-emerald-500/30 rounded-xl px-4 py-2.5 flex items-center gap-2">
          <Share2 className="w-4 h-4 text-emerald-400" />
          <span className="text-emerald-400 text-sm">{t('Brief shared with your lawyer!', 'Brief वकील को शेयर किया गया!')}</span>
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
              placeholder={t('Ask about your legal situation...', 'अपनी कानूनी स्थिति के बारे में पूछें...')}
              rows={1}
              className="flex-1 bg-transparent px-4 py-3 text-white placeholder-white/30 outline-none text-sm resize-none max-h-28"
              style={{ minHeight: '44px' }}
            />
            <button
              onClick={() => setIsListening(prev => !prev)}
              className={`p-3 ios-press ${isListening ? 'text-red-400' : 'text-white/40'}`}
            >
              <Mic className="w-4 h-4" />
            </button>
          </div>
          <button
            onClick={() => sendMessage(input)}
            disabled={!input.trim() || isLoading}
            className="w-11 h-11 rounded-2xl bg-white flex items-center justify-center ios-press disabled:opacity-40 flex-shrink-0"
          >
            {isLoading
              ? <Loader2 className="w-4 h-4 text-black animate-spin" />
              : <Send className="w-4 h-4 text-black" />
            }
          </button>
        </div>
      </div>

      {/* Share Brief Modal */}
      {showShareModal && (
        <div className="absolute inset-0 bg-black/80 backdrop-blur-sm flex items-end z-50">
          <div className="w-full glass-card rounded-t-3xl border-t border-white/10 p-6 space-y-4">
            <div className="w-12 h-1 bg-white/20 rounded-full mx-auto mb-2" />
            <h3 className="text-white font-semibold text-lg">{t('Share Case Brief', 'केस Brief शेयर करें')}</h3>
            <p className="text-white/50 text-sm">
              {t(
                'AI will generate a structured brief from your conversation and share it with an advocate. Your consent is required.',
                'AI आपकी बातचीत से एक संरचित Brief बनाएगा और इसे एक वकील के साथ शेयर करेगा। आपकी सहमति आवश्यक है।'
              )}
            </p>
            <div className="glass-card rounded-xl p-3 border border-yellow-500/20">
              <p className="text-yellow-400/80 text-xs">
                {t(
                  '⚠️ By sharing, you consent to an advocate viewing your conversation summary.',
                  '⚠️ शेयर करने से आप सहमति देते हैं कि एक वकील आपकी बातचीत का सारांश देख सके।'
                )}
              </p>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setShowShareModal(false)} className="flex-1 glass-card border border-white/10 py-3.5 rounded-2xl text-white text-sm ios-press">
                {t('Cancel', 'रद्द करें')}
              </button>
              <button
                onClick={handleShareBrief}
                disabled={isSharingBrief}
                className="flex-1 bg-white text-black font-semibold py-3.5 rounded-2xl text-sm ios-press disabled:opacity-60 flex items-center justify-center gap-2"
              >
                {isSharingBrief
                  ? <><Loader2 className="w-4 h-4 animate-spin" />{t('Sharing...', 'शेयर हो रहा है...')}</>
                  : t('Share with Consent', 'सहमति से शेयर करें')
                }
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
