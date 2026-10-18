import React, { useState, useMemo } from 'react';
import { Card } from '../../design/ui/Card';
import { Button } from '../../design/ui/Button';
import { Segmented } from '../../design/ui/Segmented';
import { EmptyState } from '../../design/ui/EmptyState';
import { DirectThread, Language, AIInquiryBrief, CaseFile } from '../../types';
import { MessageSquare, Bot, User, ChevronRight, Sparkles, Folder, Plus } from 'lucide-react';
import { InquiryCard } from './InquiryCard';
import { normalize12HourTime } from '../../lib/istDate';
import { ErrorBoundary } from '../../components/common/ErrorBoundary';

interface InboxPageProps {
  threads: DirectThread[];
  inquiries?: AIInquiryBrief[];
  cases?: CaseFile[];
  language?: Language;
  onSelectThread: (thread: DirectThread) => void;
  onStartCaseChat?: (caseNumber: string, clientName: string) => void;
  onAcceptInquiry?: (inquiry: AIInquiryBrief) => void;
  onDeclineInquiry?: (inquiryId: string) => void;
}

const cleanPreview = (text?: any): string => {
  if (!text) return '';
  const str = typeof text === 'string' ? text : String(text);
  return str
    .replace(/\*\*(.*?)\*\*/g, '$1')
    .replace(/\*(.*?)\*/g, '$1')
    .replace(/__(.*?)__/g, '$1')
    .replace(/_(.*?)_/g, '$1')
    .replace(/`{1,3}[^`]*`{1,3}/g, '')
    .replace(/#+\s+/g, '')
    .replace(/\n+/g, ' · ')
    .trim();
};

const formatThreadTime = (isoOrTime?: any): string => {
  if (!isoOrTime) return '';
  try {
    let d: Date | null = null;
    if (typeof isoOrTime === 'object' && isoOrTime !== null) {
      if (typeof isoOrTime.toDate === 'function') {
        d = isoOrTime.toDate();
      } else if (typeof isoOrTime.seconds === 'number') {
        d = new Date(isoOrTime.seconds * 1000);
      } else if (isoOrTime instanceof Date) {
        d = isoOrTime;
      }
    } else if (typeof isoOrTime === 'string') {
      if (isoOrTime.includes('T') || isoOrTime.includes('-')) {
        const parsed = new Date(isoOrTime);
        if (!isNaN(parsed.getTime())) {
          d = parsed;
        }
      } else {
        return normalize12HourTime(isoOrTime);
      }
    }
    if (d && !isNaN(d.getTime())) {
      const now = new Date();
      if (d.toDateString() === now.toDateString()) {
        return d.toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit', hour12: true });
      }
      return d.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' });
    }
    return typeof isoOrTime === 'string' ? isoOrTime : '';
  } catch {
    return '';
  }
};

export const InboxPage: React.FC<InboxPageProps> = ({
  threads = [],
  inquiries = [],
  cases = [],
  language = 'en',
  onSelectThread,
  onStartCaseChat,
  onAcceptInquiry,
  onDeclineInquiry,
}) => {
  const [activeTab, setActiveTab] = useState<'messages' | 'inquiries'>('messages');

  // Filter out test/junk threads and deduplicate by client + case (Fixes Items 5 & 10)
  const filteredThreads = useMemo(() => {
    if (!Array.isArray(threads)) return [];
    const valid = threads.filter(t => {
      if (!t) return false;
      const rawMsg = t.lastMessage || t.matterSubject || '';
      const msg = (typeof rawMsg === 'string' ? rawMsg : String(rawMsg)).trim().toLowerCase();
      if ((msg === 'jsj' || msg === 'asdf') && !t.matterSubject) return false;
      return true;
    });

    const seen = new Set<string>();
    const deduplicated: DirectThread[] = [];
    for (const thread of valid) {
      if (!thread) continue;
      const key = `${(thread.clientName || '').toLowerCase().trim()}-${(thread.caseNumber || thread.clientId || thread.id || '').toLowerCase().trim()}`;
      if (!seen.has(key)) {
        seen.add(key);
        deduplicated.push(thread);
      }
    }
    return deduplicated;
  }, [threads]);

  return (
    <ErrorBoundary fallbackTitle="Inbox Temporarily Unavailable">
      <div className="flex flex-col gap-4 p-4 sm:p-6 pb-36 text-main max-w-4xl mx-auto w-full">
      {/* ── Header ── */}
      <div className="flex items-center justify-between pt-1">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-main font-display">
            {language === 'hi' ? 'संदेश एवं परामर्श अनुरोध' : language === 'mr' ? 'संदेश व विचारणा विनंत्या' : 'Client Inbox & Inquiries'}
          </h1>
          <p className="text-xs text-neutral-400 mt-0.5">
            {language === 'hi'
              ? 'सीधा मुवक्किल संवाद और AI-संरचित विधिक परामर्श'
              : language === 'mr'
              ? 'थेट पक्षकार संवाद आणि AI-संरचित कायदेशीर विचारणा'
              : 'Direct client communication and AI-structured legal intake briefs'}
          </p>
        </div>
      </div>

      {/* ── Tabs ── */}
      <Segmented
        value={activeTab}
        onChange={setActiveTab}
        items={[
          {
            id: 'messages',
            label: language === 'hi' ? 'सक्रिय चैट सत्र' : language === 'mr' ? 'सक्रिय चॅट सत्रे' : 'Active Messages',
            badge: (filteredThreads || []).reduce((acc, t) => acc + (t && typeof t.unreadCount === 'number' ? t.unreadCount : 0), 0) || undefined,
          },
          {
            id: 'inquiries',
            label: language === 'hi' ? 'नए परामर्श अनुरोध' : language === 'mr' ? 'नवीन विचारणा' : 'New Inquiries',
            badge: (Array.isArray(inquiries) ? inquiries : []).length || undefined,
          },
        ]}
      />

      {/* ── Tab 1: Messages ── */}
      {activeTab === 'messages' && (
        <div className="space-y-3 animate-in fade-in">
          {filteredThreads.length === 0 ? (
            <div className="space-y-4">
              <EmptyState
                icon={<MessageSquare size={24} />}
                title={language === 'hi' ? 'कोई सक्रिय चैट सत्र नहीं है' : language === 'mr' ? 'कोणतेही सक्रिय चॅट सत्र नाही' : 'No active chat threads'}
                description={language === 'hi' ? 'जब मुवक्किल आपसे संपर्क करेंगे, तो संदेश यहाँ दिखाई देंगे।' : language === 'mr' ? 'जेव्हा पक्षकार आपल्याशी संवाद साधतील, तेव्हा संदेश येथे दिसतील.' : 'When clients message you or consultations begin, threads appear here.'}
              />

              {cases && cases.length > 0 && onStartCaseChat && (
                <div className="p-4 rounded-3xl bg-white/[0.035] border border-white/[0.08] backdrop-blur-md space-y-3">
                  <div className="flex items-center gap-2">
                    <Folder size={14} className="text-amber-400" />
                    <span className="text-xs font-bold text-white uppercase tracking-wider">
                      {language === 'hi' ? 'केस मुवक्किलों को संदेश भेजें' : language === 'mr' ? 'पक्षकारांशी संवाद सुरू करा' : 'Message Active Case Clients'}
                    </span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {cases.map(c => (
                      <button
                        key={c.id || c.caseNumber}
                        type="button"
                        onClick={() => onStartCaseChat(c.caseNumber, c.clientName)}
                        className="flex items-center justify-between p-3 rounded-2xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] hover:border-amber-400/40 transition text-left ios-press cursor-pointer"
                      >
                        <div className="min-w-0 pr-2">
                          <p className="text-xs font-semibold text-white truncate">{c.clientName}</p>
                          <p className="text-[10px] text-amber-300 font-mono truncate">{c.caseNumber}</p>
                        </div>
                        <span className="text-xs font-bold text-amber-400 flex items-center gap-1 shrink-0 bg-amber-400/10 px-2 py-1 rounded-xl">
                          <MessageSquare size={12} /> {language === 'hi' ? 'चैट' : 'Chat'}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-2.5">
              {filteredThreads.map(thread => {
                const unread = (thread.unreadCount || 0) > 0;
                const cleanMsg = cleanPreview(thread.lastMessage || thread.matterSubject);
                const displayTime = formatThreadTime(thread.updatedAt || thread.lastMessageTime);

                return (
                  <button
                    key={thread.id}
                    type="button"
                    onClick={() => onSelectThread(thread)}
                    className={`w-full text-left rounded-3xl bg-white/[0.035] border border-white/[0.08] backdrop-blur-md p-3.5 hover:bg-white/[0.06] hover:border-white/[0.16] cursor-pointer ios-press transition flex items-center justify-between gap-3 ${
                      unread ? 'bg-amber-400/[0.04] border-amber-400/30' : ''
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <div className="w-10 h-10 rounded-2xl bg-neutral-800 border border-white/10 flex items-center justify-center font-bold text-white text-xs shrink-0">
                        {thread.clientName ? thread.clientName.charAt(0).toUpperCase() : 'C'}
                        {(typeof thread.clientName === 'string' && thread.clientName.length > 0) ? thread.clientName.charAt(0).toUpperCase() : 'C'}
                      </div>
                      <div className="min-w-0 flex-1 pr-2">
                        <div className="flex items-center justify-between gap-2 mb-1">
                          <div className="flex items-center gap-2 min-w-0">
                            <p className={`text-xs truncate ${unread ? 'font-bold text-white' : 'font-semibold text-neutral-200'}`}>
                              {thread.clientName || 'Client'}
                            </p>
                            {/* Sender-type badge (Item 17) */}
                            {thread.aiBriefAttached ? (
                              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-purple-500/15 text-purple-300 border border-purple-500/30 shrink-0">
                                AI Intake
                              </span>
                            ) : thread.caseNumber ? (
                              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-300 border border-amber-500/30 shrink-0">
                                {thread.caseNumber}
                              </span>
                            ) : (
                              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-sky-500/15 text-sky-300 border border-sky-500/30 shrink-0">
                                Citizen Client
                              </span>
                            )}
                          </div>
                          {displayTime && (
                            <span className="text-[10px] text-neutral-400 font-mono shrink-0">
                              {displayTime}
                            </span>
                          )}
                        </div>
                        <p className={`text-[11px] truncate ${unread ? 'text-neutral-200 font-medium' : 'text-neutral-400'}`}>
                          {cleanMsg}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0 ml-2">
                      {unread && (
                        <span className="min-w-[20px] h-[20px] px-1.5 rounded-full bg-amber-400 text-black font-mono font-extrabold text-[10px] flex items-center justify-center shadow-lg shadow-amber-400/30">
                          {(thread.unreadCount && thread.unreadCount > 99) ? '99+' : thread.unreadCount}
                        </span>
                      )}
                      <ChevronRight size={16} className="text-neutral-500" />
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ── Tab 2: New Inquiries (AI Intake Briefs) ── */}
      {activeTab === 'inquiries' && (
        <div className="space-y-3 animate-in fade-in">
          {/* Workflow Clarification Banner (Bug 15) */}
          <div className="p-4 rounded-2xl bg-amber-400/[0.08] border border-amber-400/20 text-xs space-y-2">
            <div className="flex items-center gap-2">
              <span className="p-1 rounded-lg bg-amber-400/20 text-amber-300">
                <Bot size={15} />
              </span>
              <h3 className="font-bold text-amber-300 text-xs">
                {language === 'hi' 
                  ? 'नए परामर्श अनुरोध — कार्यप्रणाली एवं प्रक्रिया' 
                  : language === 'mr' 
                  ? 'नवीन विचारणा — कार्यपद्धती व प्रक्रिया' 
                  : 'New Inquiries — Purpose & Case Conversion Workflow'}
              </h3>
            </div>
            <p className="text-[11px] text-neutral-300 leading-relaxed">
              {language === 'hi'
                ? 'मुवक्किलों द्वारा NYAAY AI के साथ कानूनी बातचीत के बाद संरचित केस सारांश (Intake Brief) यहाँ प्राप्त होते हैं। '
                : language === 'mr'
                ? 'अशीलांनी NYAAY AI द्वारे कायदेशीर चर्चा केल्यानंतर तयार केलेले केस सारांश येथे प्राप्त होतात. '
                : 'When citizens seek counsel via NYAAY Legal AI, their extracted facts and applicable legal sections are packaged into a structured intake brief.'}
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1 font-mono text-[10px]">
              <div className="p-2 rounded-xl bg-black/40 border border-white/10">
                <span className="text-amber-300 font-bold block mb-0.5">1. AI Intake</span>
                <span className="text-neutral-400">
                  {language === 'hi' ? 'तथ्य व कानूनी धाराएं संकलित' : language === 'mr' ? 'तथ्य व कलमे संकलित' : 'Facts & sections structured'}
                </span>
              </div>
              <div className="p-2 rounded-xl bg-black/40 border border-white/10">
                <span className="text-amber-300 font-bold block mb-0.5">2. Advocate Review</span>
                <span className="text-neutral-400">
                  {language === 'hi' ? 'वकील द्वारा परीक्षण व स्वीकृति' : language === 'mr' ? 'वकिलांकडून तपासणी' : 'Counsel evaluates merits'}
                </span>
              </div>
              <div className="p-2 rounded-xl bg-black/40 border border-white/10">
                <span className="text-emerald-400 font-bold block mb-0.5">3. Active Dossier</span>
                <span className="text-neutral-400">
                  {language === 'hi' ? 'स्वीकारने पर नया केस डॉसियर तैयार' : language === 'mr' ? 'स्वीकारल्यावर नवीन केस तयार' : 'Accept converts to live case'}
                </span>
              </div>
            </div>
          </div>

          {inquiries.length === 0 ? (
            <EmptyState
              icon={<Bot size={24} />}
              title={language === 'hi' ? 'कोई लंबित परामर्श अनुरोध नहीं है' : language === 'mr' ? 'कोणतीही प्रलंबित विचारणा नाही' : 'No pending intake briefs'}
              description={
                language === 'hi'
                  ? 'जब नए मुवक्किल आपके विधिक अभ्यास से जुड़ेंगे, तो उनके संरचित केस सारांश यहाँ दिखाई देंगे।'
                  : language === 'mr'
                  ? 'जेव्हा नवीन अशील आपल्याशी संपर्क साधतील, तेव्हा त्यांचे केस सारांश येथे दिसतील.'
                  : 'Prospective clients who match with your practice will show their case summaries here.'
              }
            />
          ) : (
            <div className="space-y-3">
              {inquiries.map(inq => (
                <InquiryCard
                  key={inq.id}
                  inquiry={inq}
                  language={language}
                  onAccept={(inquiry) => onAcceptInquiry?.(inquiry)}
                  onDecline={(id) => onDeclineInquiry?.(id)}
                />
              ))}
            </div>
          )}
        </div>
      )}
      </div>
    </ErrorBoundary>
  );
};
