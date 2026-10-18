import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Bot, User, Sparkles, X, Loader2, ArrowRight, ShieldCheck } from 'lucide-react';
import { askCaseAI, buildGroundingContext, LawyerAIGroundingData } from '../../lib/caseAI';
import { Language } from '../../types';

interface LawyerAIChatProps {
  isOpen: boolean;
  onClose: () => void;
  groundingData: LawyerAIGroundingData;
  language?: Language;
  initialPrompt?: string;
}

interface ChatMsg {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

const SUGGESTED_PROMPTS = [
  "Draft a Section 138 NI Act statutory demand notice",
  "Summarize today's urgent cause list & pending hearings",
  "Draft an application under Order 39 Rule 1 & 2 CPC for injunction",
  "List all unpaid invoices and outstanding client fees",
  "What is the limitation period for filing Written Statement under CPC Order VIII?",
  "Which clients have pending procedural checklist tasks?"
];

export const LawyerAIChat: React.FC<LawyerAIChatProps> = ({
  isOpen,
  onClose,
  groundingData,
  language = 'en',
  initialPrompt,
}) => {
  const [messages, setMessages] = useState<ChatMsg[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content:
        language === 'hi'
          ? 'नमस्ते काउंसिल! मैं न्यायनीति AI सहायक हूँ। मैं आपके सभी केस, कॉज लिस्ट, इनवॉइस और प्रक्रियात्मक कार्यों के लाइव डेटा के आधार पर आपके प्रश्नों का सटीक उत्तर दे सकता हूँ।'
          : language === 'mr'
          ? 'नमस्कार काउंसिल! मी न्यायनीती AI सहाय्यक आहे. मी तुमच्या सर्व खटले, सुनावण्या, इनव्हॉइस आणि कार्यांच्या थेट डेटावर आधारित उत्तरे देण्यास सज्ज आहे.'
          : 'Greetings Counsel! I am NYAAY AI Judicial Assistant. I am grounded in your live chamber records (cases, cause lists, tasks, invoices, documents). How may I assist your practice today?',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const initialPromptExecutedRef = useRef(false);

  useEffect(() => {
    if (isOpen && initialPrompt && !initialPromptExecutedRef.current) {
      initialPromptExecutedRef.current = true;
      handleSend(initialPrompt);
    }
    if (!isOpen) {
      initialPromptExecutedRef.current = false;
    }
  }, [isOpen, initialPrompt]);

  if (!isOpen) return null;

  const handleSend = async (textToSend?: string) => {
    const text = (textToSend || input).trim();
    if (!text || loading) return;

    const userMsg: ChatMsg = {
      id: `u-${Date.now()}`,
      role: 'user',
      content: text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const history = messages.slice(-6).map(m => ({ role: m.role, content: m.content }));
      const answer = await askCaseAI(text, groundingData, history);
      const aiMsg: ChatMsg = {
        id: `ai-${Date.now()}`,
        role: 'assistant',
        content: answer,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages(prev => [...prev, aiMsg]);
    } catch (err) {
      setMessages(prev => [
        ...prev,
        {
          id: `err-${Date.now()}`,
          role: 'assistant',
          content: 'Unable to connect to AI Counsel. Please verify your connection or try again.',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const renderFormattedContent = (content: string) => {
    const lines = content.split('\n');
    return lines.map((line, idx) => {
      const parts = line.split(/(\*\*.*?\*\*)/g);
      const formattedParts = parts.map((part, pIdx) => {
        if (part.startsWith('**') && part.endsWith('**')) {
          return <strong key={pIdx} className="font-bold text-amber-800 dark:text-amber-300">{part.slice(2, -2)}</strong>;
        }
        return part;
      });

      if (line.startsWith('### ')) {
        return <h4 key={idx} className="font-bold text-slate-950 dark:text-amber-300 mt-2 mb-1">{line.slice(4)}</h4>;
      }
      if (line.startsWith('## ')) {
        return <h3 key={idx} className="font-bold text-slate-950 dark:text-amber-300 mt-2 mb-1 text-sm">{line.slice(3)}</h3>;
      }
      if (line.startsWith('- ') || line.startsWith('• ')) {
        return (
          <div key={idx} className="flex items-start gap-1.5 ml-2 my-0.5 text-slate-900 dark:text-slate-100">
            <span className="text-amber-600 dark:text-amber-400 font-bold shrink-0">•</span>
            <span>{formattedParts}</span>
          </div>
        );
      }
      return (
        <p key={idx} className={`leading-relaxed text-slate-900 dark:text-slate-100 ${line === '' ? 'h-2' : ''}`}>
          {formattedParts}
        </p>
      );
    });
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xl flex flex-col justify-end sm:justify-center sm:items-center p-0 sm:p-4 animate-in fade-in">
      <div className="ai-chat-modal bg-[#F8FAFC] dark:bg-[#0B0F19] border border-slate-300 dark:border-white/[0.12] rounded-t-3xl sm:rounded-3xl w-full max-w-2xl h-[92vh] sm:h-[82vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header - Solid High-Contrast Chambers Navy/Slate Bar */}
        <div className="ai-chat-header p-4 border-b border-slate-800 flex items-center justify-between bg-[#0F172A] text-white shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-400/20 border border-amber-400/35 flex items-center justify-center text-amber-300 shrink-0">
              <Bot size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-sm font-bold text-white tracking-tight font-display">NYAAY AI Counsel</h2>
                <span className="text-[10px] font-mono font-medium px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  Live
                </span>
              </div>
              <p className="text-[11px] text-slate-300 font-medium">
                {(groundingData.cases || []).length} cases · {(groundingData.hearings || []).length} hearings · {(groundingData.invoices || []).length} invoices
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white flex items-center justify-center transition border border-slate-700 ios-press"
            aria-label="Close AI Counsel"
          >
            <X size={18} />
          </button>
        </div>

        {/* Message Thread - Soft Eye-Comforting Canvas */}
        <div className="ai-chat-feed flex-1 overflow-y-auto p-4 space-y-4 bg-slate-100/80 dark:bg-[#0B0F19]">
          {messages.map(msg => (
            <div
              key={msg.id}
              className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {msg.role === 'assistant' && (
                <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-800 border border-amber-300 dark:bg-amber-400/15 dark:text-amber-300 dark:border-amber-400/30 flex items-center justify-center shrink-0">
                  <Bot size={16} />
                </div>
              )}
              <div
                className={`max-w-[85%] rounded-2xl p-3.5 text-xs sm:text-sm leading-relaxed shadow-sm ${
                  msg.role === 'user'
                    ? 'ai-bubble-user bg-amber-400 text-neutral-950 font-medium rounded-tr-sm border border-amber-500/30'
                    : 'ai-bubble-assistant bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 rounded-tl-sm'
                }`}
              >
                <div>{renderFormattedContent(msg.content)}</div>
                <div
                  className={`text-[9px] mt-1.5 text-right font-mono ${
                    msg.role === 'user' ? 'text-black/60 font-semibold' : 'text-slate-500 dark:text-slate-400'
                  }`}
                >
                  {msg.timestamp}
                </div>
              </div>
              {msg.role === 'user' && (
                <div className="w-8 h-8 rounded-xl bg-slate-200 dark:bg-white/[0.08] border border-slate-300 dark:border-white/10 flex items-center justify-center text-slate-800 dark:text-white shrink-0">
                  <User size={16} />
                </div>
              )}
            </div>
          ))}

          {loading && (
            <div className="flex gap-3 items-center text-slate-600 dark:text-neutral-400 text-xs pl-2 animate-pulse">
              <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-800 border border-amber-300 dark:bg-amber-400/10 dark:text-amber-300 dark:border-amber-400/20 flex items-center justify-center shrink-0">
                <Loader2 size={16} className="animate-spin" />
              </div>
              <span className="font-medium">Consulting chambers data & generating response...</span>
            </div>
          )}
          <div ref={scrollRef} />
        </div>

        {/* Suggested Prompts */}
        <div className="px-4 py-2 border-t border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-900/90">
          <p className="text-[10px] font-mono font-medium text-slate-600 dark:text-slate-400 mb-1.5 flex items-center gap-1">
            <Sparkles size={11} className="text-amber-600 dark:text-amber-400" />
            <span>Suggested queries:</span>
          </p>
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
            {SUGGESTED_PROMPTS.map((prompt, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleSend(prompt)}
                className="text-[11px] whitespace-nowrap px-2.5 py-1 rounded-xl bg-slate-100 hover:bg-amber-100 text-slate-800 hover:text-amber-900 border border-slate-200 hover:border-amber-300 dark:bg-slate-800/80 dark:hover:bg-amber-400/20 dark:text-slate-200 dark:hover:text-amber-300 dark:border-slate-700 dark:hover:border-amber-400/40 transition shrink-0 ios-press"
              >
                {prompt}
              </button>
            ))}
          </div>
        </div>

        {/* Input Bar */}
        <div className="p-3 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center gap-2 shrink-0">
          <textarea
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            placeholder="Ask about hearings, fees, specific cases, or legal drafting..."
            rows={1}
            className="flex-1 bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-2xl px-3.5 py-2.5 text-xs sm:text-sm text-slate-900 dark:text-white placeholder-slate-500 dark:placeholder-slate-400 focus:outline-none focus:border-amber-500 resize-none max-h-24"
          />
          <button
            type="button"
            onClick={() => handleSend()}
            disabled={!input.trim() || loading}
            className="w-10 h-10 rounded-2xl bg-amber-400 hover:bg-amber-300 disabled:opacity-40 text-black font-bold flex items-center justify-center transition shrink-0 shadow-md shadow-amber-500/10 cursor-pointer ios-press"
          >
            <Send size={16} />
          </button>
        </div>
      </div>
    </div>
  );
};
