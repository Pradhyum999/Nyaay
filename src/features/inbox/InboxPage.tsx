import React, { useState } from 'react';
import { Card } from '../../design/ui/Card';
import { Button } from '../../design/ui/Button';
import { Segmented } from '../../design/ui/Segmented';
import { EmptyState } from '../../design/ui/EmptyState';
import { DirectThread, Language, AIInquiryBrief } from '../../types';
import { MessageSquare, Bot, User, ChevronRight } from 'lucide-react';
import { InquiryCard } from './InquiryCard';

interface InboxPageProps {
  threads: DirectThread[];
  inquiries?: AIInquiryBrief[];
  language?: Language;
  onSelectThread: (thread: DirectThread) => void;
  onAcceptInquiry?: (inquiry: AIInquiryBrief) => void;
  onDeclineInquiry?: (inquiryId: string) => void;
}

export const InboxPage: React.FC<InboxPageProps> = ({
  threads,
  inquiries = [],
  language = 'en',
  onSelectThread,
  onAcceptInquiry,
  onDeclineInquiry,
}) => {
  const [activeTab, setActiveTab] = useState<'messages' | 'inquiries'>('messages');

  return (
    <div className="flex flex-col gap-4 p-4 sm:p-6 pb-28 text-main max-w-4xl mx-auto w-full">
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
            badge: threads.reduce((acc, t) => acc + (t.unreadCount || 0), 0) || undefined,
          },
          {
            id: 'inquiries',
            label: language === 'hi' ? 'नए परामर्श अनुरोध' : language === 'mr' ? 'नवीन विचारणा' : 'New Inquiries',
            badge: inquiries.length || undefined,
          },
        ]}
      />

      {/* ── Tab 1: Messages ── */}
      {activeTab === 'messages' && (
        <div className="space-y-3 animate-in fade-in">
          {threads.length === 0 ? (
            <EmptyState
              icon={<MessageSquare size={24} />}
              title={language === 'hi' ? 'कोई सक्रिय चैट सत्र नहीं है' : language === 'mr' ? 'कोणतेही सक्रिय चॅट सत्र नाही' : 'No active chat threads'}
              description={language === 'hi' ? 'जब मुवक्किल आपसे संपर्क करेंगे, तो संदेश यहाँ दिखाई देंगे।' : language === 'mr' ? 'जेव्हा पक्षकार आपल्याशी संवाद साधतील, तेव्हा संदेश येथे दिसतील.' : 'When clients message you or consultations begin, threads appear here.'}
            />
          ) : (
            <div className="space-y-2.5">
              {threads.map(thread => {
                const unread = (thread.unreadCount || 0) > 0;
                return (
                  <Card
                    key={thread.id}
                    interactive
                    onClick={() => onSelectThread(thread)}
                    className="flex items-center justify-between p-3.5 hover:border-amber-400/30 transition"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-2xl bg-neutral-800 border border-white/10 flex items-center justify-center font-bold text-white text-xs shrink-0">
                        {thread.clientName.charAt(0)}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-xs font-bold text-white truncate">{thread.clientName}</p>
                          {thread.caseNumber && (
                            <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-white/[0.08] text-neutral-300">
                              {thread.caseNumber}
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-neutral-400 truncate mt-0.5">
                          {thread.lastMessage || thread.matterSubject}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0 ml-3">
                      {unread && (
                        <span className="min-w-[20px] h-[20px] px-1.5 rounded-full bg-amber-400 text-black font-mono font-extrabold text-[10px] flex items-center justify-center shadow-lg shadow-amber-400/30">
                          {(thread.unreadCount && thread.unreadCount > 99) ? '99+' : thread.unreadCount}
                        </span>
                      )}
                      <ChevronRight size={16} className="text-neutral-500" />
                    </div>
                  </Card>
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
  );
};
