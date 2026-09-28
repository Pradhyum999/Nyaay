import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Scale, Search, ArrowRight, ShieldCheck, X, Sparkles, BookOpen } from 'lucide-react';
import { searchLegalSections, LegalSectionEntry } from '../lib/ipcToBns';
import { Language } from '../types';

interface IpcToBnsModalProps {
  isOpen: boolean;
  onClose: () => void;
  language: Language;
}

export const IpcToBnsModal: React.FC<IpcToBnsModalProps> = ({ isOpen, onClose, language }) => {
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState<string>('All');

  const filtered = useMemo(() => {
    const results = searchLegalSections(search);
    if (activeCategory === 'All') return results;
    return results.filter(r => r.category === activeCategory);
  }, [search, activeCategory]);

  if (!isOpen) return null;

  const t = (en: string, hi: string, mr?: string) =>
    language === 'mr' && mr ? mr : language === 'hi' ? hi : en;

  const quickPills = [
    { label: 'Section 69', query: '69' },
    { label: 'BNS 103 (Murder)', query: '103' },
    { label: 'BNS 318 (Cheating)', query: '318' },
    { label: 'BNS 85 (Cruelty)', query: '85' },
    { label: 'BNS 304 (Snatching)', query: '304' },
    { label: 'BNS 111 (Organised)', query: '111' },
  ];

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-2xl flex items-center justify-center p-3 sm:p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.94, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.94, y: 15 }}
          className="w-full max-w-xl bg-[#090A0E] border border-white/[0.14] rounded-3xl p-5 shadow-[0_25px_70px_rgba(0,0,0,0.9)] flex flex-col max-h-[88vh] text-white relative overflow-hidden"
        >
          {/* Subtle 21st.dev laser accent on top */}
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-amber-400 to-transparent opacity-80" />

          {/* Header */}
          <div className="flex items-center justify-between pb-3.5 border-b border-white/[0.08]">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-amber-400/20 to-neutral-900 border border-amber-400/40 flex items-center justify-center text-amber-300 shadow-inner">
                <Scale size={19} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold text-white tracking-tight">
                    {t('IPC ↔ BNS 2023 Statutory Search', 'IPC ↔ BNS 2023 कानूनी धारा खोज', 'IPC ↔ BNS 2023 कायदेशीर कलम शोध')}
                  </h3>
                  <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 font-mono">
                    All Sections Included
                  </span>
                </div>
                <p className="text-[10px] text-neutral-400 font-mono mt-0.5">
                  {t('Search Section 69, 302, 420, Cheating, Murder, BNS sections', 'धारा 69, 302, 420, धोखाधड़ी, हत्या खोजें', 'कलम 69, 302, 420, फसवणूक शोधा')}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-white/[0.06] hover:bg-white/[0.14] border border-white/[0.08] flex items-center justify-center text-neutral-400 hover:text-white transition ios-press"
            >
              <X size={15} />
            </button>
          </div>

          {/* Search bar */}
          <div className="pt-3 pb-2 space-y-2">
            <div className="relative">
              <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={t(
                  'Search "Section 69", "BNS 69", "Murder", "302", "Cheating", "False promise"...',
                  '"धारा 69", "302", "धोखाधड़ी", "विवाह का वादा" खोजें...',
                  '"कलम 69", "302", "फसवणूक", "लग्नाचे खोटे वचन" शोधा...'
                )}
                autoFocus
                className="w-full bg-black/90 border border-white/[0.14] focus:border-amber-400/60 rounded-2xl pl-10 pr-9 py-2.5 text-xs text-white placeholder-neutral-500 focus:outline-none focus:ring-1 focus:ring-amber-400/40 font-sans shadow-inner transition"
              />
              {search && (
                <button
                  onClick={() => setSearch('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-white"
                >
                  <X size={13} />
                </button>
              )}
            </div>

            {/* Quick Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
              <span className="text-[10px] text-neutral-500 font-mono shrink-0 flex items-center gap-1">
                <Sparkles size={11} className="text-amber-400" /> Quick:
              </span>
              {quickPills.map(p => (
                <button
                  key={p.label}
                  onClick={() => setSearch(p.query)}
                  className={`text-[10.5px] px-2.5 py-0.5 rounded-lg border font-mono shrink-0 transition ios-press ${
                    search === p.query
                      ? 'bg-amber-400 text-black border-amber-300 font-bold'
                      : 'bg-white/[0.04] hover:bg-white/[0.09] border-white/[0.08] text-neutral-300'
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          {/* Results List */}
          <div className="flex-1 overflow-y-auto space-y-2 pr-1 no-scrollbar pt-1 min-h-[220px]">
            {filtered.length === 0 ? (
              <div className="p-8 text-center text-neutral-400 text-xs flex flex-col items-center justify-center gap-2">
                <BookOpen size={24} className="text-neutral-600" />
                <p className="font-semibold text-neutral-300">
                  {t('No sections matching query', 'कोई धारा नहीं मिली', 'कोणतेही कलम सापडले नाही')}
                </p>
                <p className="text-[11px] text-neutral-500 max-w-xs">
                  {t(
                    'Try searching by section number (e.g. "69", "302", "420") or legal concept like "cheating", "murder", "promise".',
                    'धारा संख्या (जैसे "69", "302", "420") या कानूनी शब्द से खोजें।',
                    'कलम क्रमांक (उदा. "69", "302") किंवा संज्ञेने शोधा.'
                  )}
                </p>
              </div>
            ) : (
              filtered.map((item) => (
                <div
                  key={item.id}
                  className="p-3.5 rounded-2xl bg-white/[0.035] hover:bg-white/[0.07] border border-white/[0.08] hover:border-white/[0.18] flex flex-col gap-2 transition group"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-mono font-bold text-amber-300 bg-amber-400/15 border border-amber-400/35 px-2.5 py-0.5 rounded-lg flex items-center gap-1 shadow-sm">
                        BNS Sec. {item.bns}
                      </span>
                      <ArrowRight size={11} className="text-neutral-500" />
                      <span className="text-[11px] font-mono font-medium text-rose-400/90 bg-rose-500/10 border border-rose-500/20 px-2 py-0.5 rounded-lg">
                        IPC {item.ipc}
                      </span>
                      {item.category && (
                        <span className="text-[9px] font-mono px-2 py-0.5 rounded-md bg-neutral-800 text-neutral-400 border border-white/[0.06]">
                          {item.category}
                        </span>
                      )}
                    </div>
                  </div>

                  <div>
                    <h4 className="text-xs font-semibold text-white tracking-tight group-hover:text-amber-200 transition">
                      {item.title}
                    </h4>
                    {item.description && (
                      <p className="text-[11px] text-neutral-400 mt-1 leading-relaxed">
                        {item.description}
                      </p>
                    )}
                  </div>

                  {item.punishment && (
                    <div className="pt-2 border-t border-white/[0.05] flex items-center justify-between text-[10.5px]">
                      <span className="text-neutral-500 font-mono">Punishment:</span>
                      <span className="text-neutral-300 font-medium font-mono text-right line-clamp-1">
                        {item.punishment}
                      </span>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>

          {/* Footer note */}
          <div className="pt-3 border-t border-white/[0.08] flex items-center justify-between text-[10px] text-neutral-400">
            <span>Effective from 1 July 2024 across all Courts</span>
            <span className="flex items-center gap-1 text-emerald-400 font-mono">
              <ShieldCheck size={11} /> Verified BCI / Ministry of Law Registry
            </span>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
