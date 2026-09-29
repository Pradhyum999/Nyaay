import React, { useState } from 'react';
import { Card } from '../../design/ui/Card';
import { Button } from '../../design/ui/Button';
import { ClientAIConsultation } from '../../components/client/ClientAIConsultation';
import { matchLawyers, LawyerMatch } from '../../services/lawyerMatching';
import { CaseProfile, UserProfile, Language } from '../../types';
import { Sparkles, Bot, Users, CheckCircle2, MessageSquare, ArrowRight, ShieldCheck, Scale, MapPin } from 'lucide-react';

interface HelpPageProps {
  lawyers: UserProfile[];
  language?: Language;
  onOpenDirectory: () => void;
  onMessageLawyer: (lawyer: UserProfile, preparedSummary?: string) => void;
  onSaveCase?: (profile: CaseProfile) => void;
}

export const HelpPage: React.FC<HelpPageProps> = ({
  lawyers,
  language = 'en',
  onOpenDirectory,
  onMessageLawyer,
  onSaveCase,
}) => {
  const [profile, setProfile] = useState<CaseProfile | null>(null);
  const [matches, setMatches] = useState<LawyerMatch[]>([]);
  const [step, setStep] = useState<'intake' | 'matched'>('intake');

  const handleProfileReady = (generatedProfile: CaseProfile) => {
    setProfile(generatedProfile);
    const matched = matchLawyers(generatedProfile, lawyers, 3);
    setMatches(matched);
    setStep('matched');
  };

  return (
    <div className="flex flex-col gap-4 p-4 sm:p-6 pb-28 text-white max-w-4xl mx-auto w-full">
      {/* ── Header ── */}
      <div className="flex items-center justify-between pt-1">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white font-display">
            {language === 'hi' ? 'कानूनी सहायता एवं वकील खोजें' : 'Legal Help & Advocate Matching'}
          </h1>
          <p className="text-xs text-neutral-400 mt-0.5">
            Describe your problem with AI guidance and match with verified advocates
          </p>
        </div>

        <button
          type="button"
          onClick={onOpenDirectory}
          className="text-xs font-semibold text-amber-300 hover:underline shrink-0"
        >
          {language === 'hi' ? 'वकील डायरेक्टरी देखें →' : 'Browse All Lawyers →'}
        </button>
      </div>

      {/* ── Step 1: AI Legal Consultation ── */}
      {step === 'intake' && (
        <div className="space-y-4">
          <div className="h-[620px] rounded-3xl overflow-hidden border border-white/[0.1] bg-neutral-950/80">
            <ClientAIConsultation
              language={language}
              onCaseProfileReady={handleProfileReady}
              onDirectToDirectory={onOpenDirectory}
            />
          </div>
        </div>
      )}

      {/* ── Step 2: Matched Advocates & Profile Summary ── */}
      {step === 'matched' && profile && (
        <div className="space-y-4 animate-in fade-in">
          {/* Structured Case Summary */}
          <Card className="border-amber-400/20 bg-gradient-to-b from-white/[0.05] to-transparent">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-mono font-bold text-amber-300 px-2 py-0.5 rounded-full bg-amber-400/10">
                AI Structured Case Summary
              </span>
              <button
                type="button"
                onClick={() => setStep('intake')}
                className="text-xs text-neutral-400 hover:text-white"
              >
                Back to Consultation
              </button>
            </div>
            <h3 className="text-sm sm:text-base font-bold text-white">{profile.matterType}</h3>
            <p className="text-xs text-neutral-300 mt-1 leading-relaxed">{profile.summaryText}</p>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mt-3 pt-3 border-t border-white/[0.06]">
              <div className="flex flex-wrap gap-2 text-xs font-mono text-neutral-400">
                <span>Jurisdiction: {profile.location}</span>
                <span>·</span>
                <span>Category: {profile.legalArea}</span>
                <span>·</span>
                <span className="text-red-400 font-bold uppercase">{profile.urgency} Urgency</span>
              </div>

              {onSaveCase && (
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => onSaveCase(profile)}
                  className="text-xs shrink-0"
                >
                  Save as My Case Room
                </Button>
              )}
            </div>
          </Card>

          {/* Top 3 Matched Lawyers */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider font-mono text-neutral-300">
                Top Matched Verified Advocates ({matches.length})
              </h3>
              <button
                type="button"
                onClick={onOpenDirectory}
                className="text-xs font-semibold text-amber-300 hover:underline"
              >
                View Full Directory
              </button>
            </div>

            {matches.length === 0 ? (
              <Card className="p-6 text-center space-y-3">
                <Users size={28} className="mx-auto text-amber-400" />
                <h4 className="text-sm font-bold text-main">
                  {language === 'mr'
                    ? 'अद्याप कोणतेही सत्यापित वकील ऑनलाइन नाहीत'
                    : language === 'hi'
                    ? 'अभी कोई सत्यापित वकील ऑनलाइन नहीं हैं'
                    : 'No verified advocates online yet'}
                </h4>
                <p className="text-xs text-sub max-w-sm mx-auto leading-relaxed">
                  {language === 'mr'
                    ? 'आम्ही नवीन वकिलांची पडताळणी करत आहोत. तोपर्यंत थेट डायरेक्टरी पहा किंवा तुमचा खटला खटला कक्षात सुरक्षित साठवा.'
                    : language === 'hi'
                    ? 'हम नए अधिवक्ताओं को सत्यापित कर रहे हैं। इस बीच पूरी डायरेक्टरी देखें या अपना केस सुरक्षित सहेजें।'
                    : 'We are actively verifying new advocates. Meanwhile, browse the directory or save your case to your Case Room.'}
                </p>
                <div className="flex justify-center gap-2 pt-2">
                  <Button variant="secondary" size="sm" onClick={onOpenDirectory}>
                    {language === 'mr' ? 'डायरेक्टरी पहा' : language === 'hi' ? 'डायरेक्टरी देखें' : 'Browse Directory'}
                  </Button>
                </div>
              </Card>
            ) : (
              matches.map(m => (
                <Card key={m.lawyer.uid || m.lawyer.name} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-start gap-3 min-w-0">
                    <div className="w-11 h-11 rounded-2xl bg-neutral-800 border border-white/10 flex items-center justify-center font-bold text-amber-300 text-sm shrink-0">
                      {m.lawyer.name.charAt(0)}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-bold text-main truncate">{m.lawyer.name}</h4>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 font-bold shrink-0">
                          {m.score}% Match
                        </span>
                      </div>
                      <p className="text-xs text-sub mt-0.5">
                        {m.lawyer.experience || 10}+ Years Standing · {m.lawyer.state || 'District & High Court'}
                      </p>
                      <div className="flex flex-wrap gap-1 mt-1.5">
                        {m.reasons.map((r, i) => (
                          <span key={i} className="text-[10px] px-2 py-0.5 rounded-md bg-white/[0.05] text-sub">
                            ✓ {r}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="shrink-0 flex items-center gap-2 mt-2 sm:mt-0">
                    <Button
                      variant="primary"
                      size="sm"
                      icon={<MessageSquare size={13} />}
                      onClick={() => onMessageLawyer(m.lawyer, profile.summaryText)}
                    >
                      {language === 'mr' ? 'सल्ला व संदेश' : language === 'hi' ? 'परामर्श व संदेश' : 'Consult & Message'}
                    </Button>
                  </div>
                </Card>
              ))
            )}
          </div>

          {/* BCI Safe Legal Disclaimer */}
          <p className="text-[11px] text-neutral-500 text-center leading-relaxed">
            NYAAY complies with the Bar Council of India rules. Match scores represent algorithmic relevance to matter parameters, not qualitative ranking or advertising.
          </p>
        </div>
      )}
    </div>
  );
};
