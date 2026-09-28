import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Share2, Calendar, Folder, Copy, CheckCircle2, X, Send, Lock } from 'lucide-react';
import { CaseFile, HearingItem, Language } from '../types';

interface ShareCaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  cases: CaseFile[];
  hearings: HearingItem[];
  language: Language;
  onShareToChat?: (sharePayload: { type: 'diary_only' | 'specific_case' | 'all_cases'; title: string; summary: string }) => void;
}

export const ShareCaseModal: React.FC<ShareCaseModalProps> = ({
  isOpen,
  onClose,
  cases,
  hearings,
  language,
  onShareToChat,
}) => {
  const [shareType, setShareType] = useState<'diary_only' | 'specific_case' | 'all_cases'>('specific_case');
  const [selectedCaseNumber, setSelectedCaseNumber] = useState<string>(cases[0]?.caseNumber || '');
  const [copied, setCopied] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const t = (en: string, hi: string, mr?: string) =>
    language === 'mr' && mr ? mr : language === 'hi' ? hi : en;

  const generateShareText = () => {
    if (shareType === 'diary_only') {
      const hearingLines = hearings
        .slice(0, 5)
        .map(h => `• ${h.caseNumber}: ${h.hearingDate} (${h.stage} - ${h.courtName})`)
        .join('\n');
      return `📅 NYAAYNEETI — Case Diary & Hearing Schedule\n\n${hearingLines}\n\nTracked in NYAAYNEETI Legal Operating System`;
    }

    if (shareType === 'specific_case') {
      const selected = cases.find(c => c.caseNumber === selectedCaseNumber) || cases[0];
      if (!selected) return 'Case details unavailable';
      return `📁 NYAAYNEETI — Case Docket: ${selected.caseNumber}\nClient: ${selected.clientName}\nOpponent: ${selected.opponentName}\nCourt: ${selected.court}, ${selected.courtLocation}\nNext Hearing: ${selected.nextHearingDate}\nStage: ${selected.stage || 'Ongoing'}\nStatus: ${selected.status}\n\nPrivileged Attorney Handoff`;
    }

    // all_cases
    const caseLines = cases
      .map(c => `• ${c.caseNumber} (${c.clientName} v. ${c.opponentName}) - Next: ${c.nextHearingDate}`)
      .join('\n');
    return `📋 NYAAYNEETI — Active Case Portfolio (${cases.length} Matters)\n\n${caseLines}\n\nShared via NYAAYNEETI Secure Channel`;
  };

  const handleCopyLink = () => {
    const text = generateShareText();
    navigator.clipboard.writeText(text);
    setCopied(true);
    setToastMsg(t('Share summary copied to clipboard!', 'केस विवरण क्लिपबोर्ड पर कॉपी हो गया!', 'केस तपशील कॉपी केले!'));
    setTimeout(() => {
      setCopied(false);
      setToastMsg(null);
    }, 2500);
  };

  const handleSendToChat = () => {
    const text = generateShareText();
    if (onShareToChat) {
      onShareToChat({
        type: shareType,
        title: shareType === 'diary_only' ? 'Case Diary Tracker' : shareType === 'specific_case' ? `Case ${selectedCaseNumber}` : 'Full Practice Portfolio',
        summary: text,
      });
    }
    setToastMsg(t('Shared successfully to client chat!', 'मुवक्किल चैट में साझा किया गया!', 'पक्षकार चॅटमध्ये पाठवले!'));
    setTimeout(() => {
      setToastMsg(null);
      onClose();
    }, 1500);
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-xl flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          className="w-full max-w-md bg-[#0E0F14] border border-amber-400/30 rounded-3xl p-5 shadow-2xl flex flex-col gap-4 text-white"
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-3 border-b border-white/[0.08]">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-amber-400/15 border border-amber-400/30 flex items-center justify-center text-amber-300">
                <Share2 size={18} />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white tracking-tight">
                  {t('Share Case or Diary', 'केस या डायरी साझा करें', 'केस किंवा डायरी शेअर करा')}
                </h3>
                <p className="text-[10px] text-neutral-400 font-mono">
                  {t('Share with client or associate for date tracking', 'तारीख ट्रैकिंग हेतु मुवक्किल को साझा करें', 'तारीख ट्रॅकिंगसाठी पक्षकाराला पाठवा')}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-white/[0.06] hover:bg-white/[0.12] flex items-center justify-center text-neutral-400 hover:text-white transition ios-press"
            >
              <X size={15} />
            </button>
          </div>

          {/* Toast */}
          {toastMsg && (
            <div className="bg-emerald-500/15 border border-emerald-500/30 px-3 py-2 rounded-xl text-xs text-emerald-300 flex items-center gap-2">
              <CheckCircle2 size={14} className="text-emerald-400 shrink-0" />
              <span>{toastMsg}</span>
            </div>
          )}

          {/* Share Options */}
          <div className="space-y-2">
            <label className="text-[11px] font-medium text-neutral-400 block">
              {t('Select Sharing Mode', 'साझा करने का विकल्प चुनें', 'पर्याय निवडा')}
            </label>

            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'specific_case', label: t('Specific Case', 'विशिष्ट केस', 'विशिष्ट केस'), icon: Folder },
                { id: 'diary_only', label: t('Diary Only', 'केवल डायरी', 'केवळ डायरी'), icon: Calendar },
                { id: 'all_cases', label: t('All Cases', 'सभी केस', 'सर्व केसेस'), icon: Share2 },
              ].map(opt => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setShareType(opt.id as any)}
                  className={`p-2.5 rounded-2xl flex flex-col items-center justify-center gap-1.5 border text-center transition ios-press ${
                    shareType === opt.id
                      ? 'bg-amber-400/20 border-amber-400 text-amber-300 font-bold'
                      : 'bg-white/[0.03] border-white/[0.08] text-neutral-400 hover:text-white'
                  }`}
                >
                  <opt.icon size={16} />
                  <span className="text-[10px] leading-tight">{opt.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Specific case picker if selected */}
          {shareType === 'specific_case' && cases.length > 0 && (
            <div>
              <label className="text-[11px] font-medium text-neutral-400 block mb-1">
                {t('Choose Case to Share', 'साझा करने हेतु केस चुनें', 'केस निवडा')}
              </label>
              <select
                value={selectedCaseNumber}
                onChange={(e) => setSelectedCaseNumber(e.target.value)}
                style={{ backgroundColor: '#18181b', color: '#ffffff' }}
                className="w-full bg-[#18181b] border border-white/[0.1] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-400/40 font-mono"
              >
                {cases.map(c => (
                  <option key={c.id} value={c.caseNumber} style={{ backgroundColor: '#18181b', color: '#ffffff' }}>
                    {c.caseNumber} — {c.clientName}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Preview Box */}
          <div className="bg-black/60 border border-white/[0.06] rounded-2xl p-3 space-y-1.5">
            <span className="text-[10px] font-mono text-neutral-500 uppercase tracking-wider block">
              {t('Preview', 'पूर्वावलोकन', 'पूर्वावलोकन')}
            </span>
            <pre className="text-xs text-neutral-300 whitespace-pre-wrap font-sans max-h-36 overflow-y-auto no-scrollbar">
              {generateShareText()}
            </pre>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 pt-1">
            <button
              type="button"
              onClick={handleCopyLink}
              className="flex-1 py-2.5 rounded-xl bg-white/[0.06] hover:bg-white/[0.1] text-xs font-semibold text-neutral-200 border border-white/[0.08] flex items-center justify-center gap-1.5 transition ios-press"
            >
              {copied ? <CheckCircle2 size={14} className="text-emerald-400" /> : <Copy size={14} />}
              <span>{copied ? t('Copied!', 'कॉपी हो गया!', 'कॉपी केले!') : t('Copy Text', 'टेक्स्ट कॉपी करें', 'मजकूर कॉपी करा')}</span>
            </button>

            <button
              type="button"
              onClick={handleSendToChat}
              className="flex-1 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-black text-xs font-bold flex items-center justify-center gap-1.5 transition ios-press shadow-md"
            >
              <Send size={14} />
              <span>{t('Share to Client', 'मुवक्किल को भेजें', 'पक्षकारास पाठवा')}</span>
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
