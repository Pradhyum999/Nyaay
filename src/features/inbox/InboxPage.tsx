import React, { useState } from 'react';
import { Card } from '../../design/ui/Card';
import { Button } from '../../design/ui/Button';
import { Segmented } from '../../design/ui/Segmented';
import { EmptyState } from '../../design/ui/EmptyState';
import { DirectThread, Language, CaseProfile } from '../../types';
import { MessageSquare, Bot, User, Check, X, ChevronRight, Scale, Clock, AlertTriangle } from 'lucide-react';

interface InquiryItem {
  id: string;
  clientName: string;
  legalArea: string;
  urgency: 'high' | 'medium' | 'low';
  summary: string;
  createdAt: string;
  profile?: CaseProfile;
}

interface InboxPageProps {
  threads: DirectThread[];
  inquiries?: InquiryItem[];
  language?: Language;
  onSelectThread: (thread: DirectThread) => void;
  onAcceptInquiry?: (inquiry: InquiryItem) => void;
  onDeclineInquiry?: (inquiryId: string) => void;
}

export const InboxPage: React.FC<InboxPageProps> = ({
  threads,
  inquiries = [
    {
      id: 'inq-1',
      clientName: 'Suresh Patil',
      legalArea: 'Criminal / Cheque Bounce (S. 138 NI Act)',
      urgency: 'high',
      summary: 'Statutory demand notice period elapsed after cheque dishonour of ₹15 Lakhs for commercial supplier invoice. Seeking immediate filing of criminal complaint before MM court.',
      createdAt: '1 hour ago',
    },
    {
      id: 'inq-2',
      clientName: 'Priya Mehra',
      legalArea: 'Civil / Property Partition Suit',
      urgency: 'medium',
      summary: 'Ancestral residential property in Delhi facing unauthorized encumbrance by co-heir. Seeking interim stay order and preliminary decree of partition.',
      createdAt: '3 hours ago',
    }
  ],
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
                <Card key={inq.id} className="space-y-3 border-amber-400/20 bg-gradient-to-b from-white/[0.04] to-transparent">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-2xl bg-amber-400/15 border border-amber-400/30 flex items-center justify-center text-amber-300 shrink-0">
                        <Bot size={18} />
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-white">{inq.clientName}</h3>
                        <p className="text-[11px] text-amber-300 font-mono">{inq.legalArea}</p>
                      </div>
                    </div>

                    <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-red-500/15 border border-red-500/30 text-red-400 uppercase">
                      {inq.urgency} Urgency
                    </span>
                  </div>

                  <div className="p-3 rounded-2xl bg-white/[0.03] border border-white/[0.06] text-xs text-neutral-300 leading-relaxed">
                    <p className="text-[11px] font-semibold text-neutral-400 uppercase tracking-wider mb-1 font-mono">
                      AI Structured Matter Brief:
                    </p>
                    {inq.summary}
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-1 border-t border-white/[0.06]">
                    <Button
                      variant="ghost"
                      size="sm"
                      icon={<X size={13} />}
                      onClick={() => onDeclineInquiry?.(inq.id)}
                    >
                      Decline
                    </Button>
                    <Button
                      variant="primary"
                      size="sm"
                      icon={<Check size={13} />}
                      onClick={() => onAcceptInquiry?.(inq)}
                    >
                      Accept & Open Case
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
