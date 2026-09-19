import React, { useState } from 'react';
import { Landmark, ThumbsUp, MessageSquare, TrendingUp, Lightbulb } from 'lucide-react';
import { JudicialAnalytic, ForumPost, Language } from '../types';
import { translations } from '../i18n/translations';

interface CourtAnalyticsAndForumProps {
  analytics: JudicialAnalytic[];
  posts: ForumPost[];
  language: Language;
}

export const CourtAnalyticsAndForum: React.FC<CourtAnalyticsAndForumProps> = ({ analytics, posts, language }) => {
  const t = translations[language];
  const [activeSubTab, setActiveSubTab] = useState<'analytics' | 'forum'>('analytics');
  const [forumList, setForumList] = useState<ForumPost[]>(posts);

  const handleUpvote = (postId: string) => {
    setForumList(prev => prev.map(p => {
      if (p.id === postId) {
        return { ...p, upvotes: p.upvotes + 1 };
      }
      return p;
    }));
  };

  return (
    <div className="flex flex-col gap-5 p-5 pb-24">
      {/* Header */}
      <div>
        <span className="text-[11px] font-semibold tracking-wider uppercase text-neutral-500">
          Peer Intelligence
        </span>
        <h1 className="text-2xl font-bold tracking-tight text-white mt-0.5">
          {t.analyticsHeader}
        </h1>
      </div>

      {/* Segmented Control */}
      <div className="flex bg-white/[0.04] p-1 rounded-2xl border border-white/[0.08]">
        <button
          onClick={() => setActiveSubTab('analytics')}
          className={`flex-1 py-2 rounded-xl text-xs font-semibold transition-all ${
            activeSubTab === 'analytics'
              ? 'bg-white text-black shadow'
              : 'text-neutral-400 hover:text-white'
          }`}
        >
          {t.benchTendencies}
        </button>
        <button
          onClick={() => setActiveSubTab('forum')}
          className={`flex-1 py-2 rounded-xl text-xs font-semibold transition-all ${
            activeSubTab === 'forum'
              ? 'bg-white text-black shadow'
              : 'text-neutral-400 hover:text-white'
          }`}
        >
          {t.peerForum}
        </button>
      </div>

      {/* Bench Analytics */}
      {activeSubTab === 'analytics' && (
        <div className="space-y-3">
          {analytics.map(bench => (
            <div
              key={bench.id}
              className="glass-card rounded-3xl p-5 flex flex-col gap-3 border border-white/[0.08]"
            >
              <div className="border-b border-white/[0.06] pb-2.5">
                <span className="text-[10px] font-mono text-neutral-400 bg-white/[0.04] px-2.5 py-0.5 rounded-full border border-white/[0.06]">
                  {bench.court}
                </span>
                <h4 className="text-sm font-bold text-white tracking-tight mt-1.5">{bench.judgeName}</h4>
              </div>

              {/* Metrics */}
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="bg-white/[0.02] p-3 rounded-2xl border border-white/[0.04]">
                  <span className="text-neutral-500 flex items-center gap-1 text-[10px] uppercase font-semibold">
                    <TrendingUp size={12} className="text-blue-400" />
                    {t.avgInterval}
                  </span>
                  <span className="font-bold text-white font-mono mt-1 block">
                    {bench.avgHearingIntervalDays} Days
                  </span>
                </div>

                <div className="bg-white/[0.02] p-3 rounded-2xl border border-white/[0.04]">
                  <span className="text-neutral-500 flex items-center gap-1 text-[10px] uppercase font-semibold">
                    <TrendingUp size={12} className="text-purple-400" />
                    Adjournments
                  </span>
                  <span className="font-bold text-neutral-200 mt-1 block text-[11px] truncate">
                    {language === 'en' ? bench.adjournmentFrequencyEn : bench.adjournmentFrequencyHi}
                  </span>
                </div>
              </div>

              {/* Disposition Note */}
              <div className="text-xs text-neutral-300 leading-relaxed bg-white/[0.02] p-3 rounded-2xl border border-white/[0.04]">
                <span className="text-neutral-500 block text-[10px] font-semibold uppercase tracking-wider mb-1">
                  Procedural Habit:
                </span>
                {language === 'en' ? bench.dispositionTrendEn : bench.dispositionTrendHi}
              </div>

              {/* Observation Tip */}
              <div className="bg-amber-400/10 border border-amber-400/20 rounded-2xl p-3 flex items-start gap-2 text-xs text-amber-200">
                <Lightbulb size={14} className="text-amber-400 shrink-0 mt-0.5" />
                <p>
                  <strong>Advocate Prep Tip:</strong>{' '}
                  {language === 'en' ? bench.keyObservationEn : bench.keyObservationHi}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Peer Forum */}
      {activeSubTab === 'forum' && (
        <div className="space-y-3">
          {forumList.map(post => (
            <div
              key={post.id}
              className="glass-card rounded-3xl p-5 flex flex-col gap-3 border border-white/[0.08]"
            >
              <div className="flex items-center justify-between border-b border-white/[0.06] pb-2">
                <div>
                  <span className="text-xs font-semibold text-white">{post.authorName}</span>
                  <span className="text-[10px] text-neutral-500 font-mono block">
                    {post.authorBarCouncil}
                  </span>
                </div>
                <span className="text-[10px] text-neutral-500 font-mono">
                  {language === 'en' ? post.timeAgoEn : post.timeAgoHi}
                </span>
              </div>

              <div>
                <h4 className="text-xs font-bold text-white tracking-tight">
                  {language === 'en' ? post.titleEn : post.titleHi}
                </h4>
                <p className="text-xs text-neutral-300 mt-1 leading-relaxed">
                  {language === 'en' ? post.contentEn : post.contentHi}
                </p>
              </div>

              <div className="flex flex-wrap gap-1">
                {post.tags.map((tag, idx) => (
                  <span key={idx} className="text-[10px] px-2.5 py-0.5 rounded-full bg-white/[0.04] text-neutral-400 font-mono border border-white/[0.06]">
                    #{tag}
                  </span>
                ))}
              </div>

              <div className="flex items-center justify-between border-t border-white/[0.06] pt-2 text-xs text-neutral-400">
                <button
                  onClick={() => handleUpvote(post.id)}
                  className="flex items-center gap-1.5 hover:text-white transition ios-press"
                >
                  <ThumbsUp size={13} className="text-amber-300" />
                  <span className="font-semibold text-white">{post.upvotes}</span>
                  <span className="text-[10px]">{t.upvotes}</span>
                </button>

                <div className="flex items-center gap-1.5">
                  <MessageSquare size={13} />
                  <span className="font-semibold text-white">{post.repliesCount}</span>
                  <span className="text-[10px]">{t.replies}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
