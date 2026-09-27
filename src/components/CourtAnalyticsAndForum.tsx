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

      {/* Bench Analytics — Coming Soon */}
      {activeSubTab === 'analytics' && (
        <div className="flex flex-col items-center justify-center py-12 px-6 text-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-white/[0.04] border border-white/[0.08] flex items-center justify-center mb-2">
            <Landmark size={28} className="text-neutral-600" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white">Bench Analytics — Coming Soon</h3>
            <p className="text-xs text-neutral-400 mt-2 leading-relaxed">
              Objective bench tendency data sourced from verified eCourts public records. 
              Our AI will surface adjournment patterns, hearing intervals, and procedural habits
              to help you prepare smarter arguments.
            </p>
          </div>
          <div className="flex flex-wrap gap-2 justify-center mt-2">
            {['Adjournment Frequency', 'Hearing Intervals', 'Disposal Rate', 'Bench Preferences'].map(tag => (
              <span key={tag} className="text-[10px] px-2.5 py-1 rounded-full bg-white/[0.04] text-neutral-500 border border-white/[0.06] font-mono">
                {tag}
              </span>
            ))}
          </div>
          <button
            onClick={() => setActiveSubTab('forum')}
            className="mt-2 px-4 py-2 rounded-xl bg-white/[0.08] hover:bg-white/[0.14] text-white text-xs font-semibold border border-white/[0.1] transition ios-press"
          >
            View Peer Forum →
          </button>
        </div>
      )}

      {/* Peer Forum */}
      {activeSubTab === 'forum' && (
        <div className="space-y-3">
          {forumList.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 px-6 text-center gap-3">
              <div className="w-14 h-14 rounded-2xl bg-white/[0.04] border border-white/[0.08] flex items-center justify-center">
                <MessageSquare size={24} className="text-neutral-600" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">Advocate Community Forum</h3>
                <p className="text-xs text-neutral-400 mt-1.5 leading-relaxed">
                  A space for verified advocates to share procedural insights, discuss case strategies,
                  and exchange knowledge. Be the first to start a discussion.
                </p>
              </div>
            </div>
          ) : (
            forumList.map(post => (
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
            ))
          )}
        </div>
      )}
    </div>
  );
};
