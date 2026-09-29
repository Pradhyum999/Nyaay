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
    <div className="flex flex-col gap-4 p-4 sm:p-6 pb-28 text-white max-w-4xl mx-auto w-full">
      {/* ── Header ── */}
      <div className="flex items-center justify-between pt-1">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white font-display">
            {language === 'hi' ? 'संदेश एवं परामर्श अनुरोध' : 'Client Inbox & Inquiries'}
          </h1>
          <p className="text-xs text-neutral-400 mt-0.5">
            Direct client communication and AI-structured legal intake briefs
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
            label: language === 'hi' ? 'सक्रिय चैट सत्र' : 'Active Messages',
            badge: threads.reduce((acc, t) => acc + (t.unreadCount || 0), 0) || undefined,
          },
          {
            id: 'inquiries',
            label: language === 'hi' ? 'नए परामर्श अनुरोध' : 'New Inquiries',
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
              title="No active chat threads"
              description="When clients message you or consultations begin, threads appear here."
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
                        <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
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
          {inquiries.length === 0 ? (
            <EmptyState
              icon={<Bot size={24} />}
              title="No pending intake briefs"
              description="Prospective clients who match with your practice will show their case summaries here."
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
