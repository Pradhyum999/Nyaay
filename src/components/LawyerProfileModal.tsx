import React from 'react';
import { ShieldCheck, Building, BookOpen, X, Scale } from 'lucide-react';
import { Language } from '../types';
import { translations } from '../i18n/translations';

interface LawyerProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  language: Language;
}

export const LawyerProfileModal: React.FC<LawyerProfileModalProps> = ({ isOpen, onClose, language }) => {
  if (!isOpen) return null;
  const t = translations[language];

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in">
      <div className="w-full max-w-sm glass-panel rounded-3xl p-6 shadow-2xl flex flex-col gap-4 bg-[#111216] border border-white/[0.1] max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-white/[0.08] pb-3">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-white text-black font-bold flex items-center justify-center shadow-lg">
              <Scale size={24} strokeWidth={2} />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h3 className="text-sm font-bold text-white tracking-tight">{t.advocateTitle}</h3>
                <ShieldCheck size={16} className="text-emerald-400" />
              </div>
              <p className="text-xs text-neutral-400 font-mono mt-0.5">{t.barCouncil}</p>
            </div>
          </div>
          <button onClick={onClose} className="w-7 h-7 rounded-full bg-white/[0.06] flex items-center justify-center text-neutral-400 hover:text-white">
            <X size={15} />
          </button>
        </div>

        {/* Credential Metrics */}
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="bg-black/40 p-3 rounded-2xl border border-white/[0.06]">
            <span className="text-neutral-500 block text-[10px] uppercase font-semibold">{t.yearsOfExperience}</span>
            <span className="text-sm font-bold text-white font-mono mt-0.5 block">{t.yearsCount}</span>
          </div>
          <div className="bg-black/40 p-3 rounded-2xl border border-white/[0.06]">
            <span className="text-neutral-500 block text-[10px] uppercase font-semibold">Skill Score</span>
            <span className="text-sm font-bold text-amber-300 font-mono mt-0.5 block">94 / 100</span>
          </div>
        </div>

        {/* Courts */}
        <div>
          <h4 className="text-xs font-semibold text-neutral-300 uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <Building size={13} className="text-neutral-500" />
            <span>{t.practiceCourts}</span>
          </h4>
          <div className="flex flex-wrap gap-1.5">
            {['Supreme Court of India', 'Delhi High Court', 'Tis Hazari District Court', 'Patiala House Courts', 'NCLT New Delhi'].map((c, i) => (
              <span key={i} className="text-[11px] px-2.5 py-1 rounded-xl bg-white/[0.03] text-neutral-300 border border-white/[0.06]">
                {c}
              </span>
            ))}
          </div>
        </div>

        {/* Specializations */}
        <div>
          <h4 className="text-xs font-semibold text-neutral-300 uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <BookOpen size={13} className="text-neutral-500" />
            <span>{t.practiceAreas}</span>
          </h4>
          <div className="flex flex-wrap gap-1.5">
            {['Criminal Appeals & Bail', 'Negotiable Instruments (Sec 138)', 'Commercial Dispute Resolution', 'Consumer Protection', 'Insolvency & Bankruptcy'].map((s, i) => (
              <span key={i} className="text-[11px] px-2.5 py-1 rounded-xl bg-white/[0.03] text-neutral-300 border border-white/[0.06]">
                {s}
              </span>
            ))}
          </div>
        </div>

        {/* BCI Regulatory Compliance Disclaimer */}
        <div className="bg-black/40 p-3 rounded-2xl border border-white/[0.06] text-[10px] text-neutral-500 leading-relaxed italic">
          {t.bciComplianceNote}
        </div>

        <button
          onClick={onClose}
          className="w-full py-2.5 rounded-2xl bg-white text-black text-xs font-semibold hover:bg-neutral-200 ios-press"
        >
          {t.close}
        </button>
      </div>
    </div>
  );
};
