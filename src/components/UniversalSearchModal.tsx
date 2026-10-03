import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Scale, Folder, User, Calendar, ArrowRight, ArrowLeft, X, Sparkles, ShieldCheck } from 'lucide-react';
import { searchLegalSections, LegalSectionEntry } from '../lib/ipcToBns';
import { CaseFile, HearingItem, Language } from '../types';
import { BorderBeam } from './ui/BorderBeam';

interface UniversalSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  cases: CaseFile[];
  hearings: HearingItem[];
  language: Language;
  onSelectCase: (caseNumber: string) => void;
  onOpenIpcModal?: () => void;
}

export const UniversalSearchModal: React.FC<UniversalSearchModalProps> = ({
  isOpen,
  onClose,
  cases,
  hearings,
  language,
  onSelectCase,
  onOpenIpcModal,
}) => {
  const [query, setQuery] = useState('');

  const q = query.toLowerCase().trim();
  const digits = q.replace(/[^0-9a-z]/gi, '');

  // 1. Statutory matches (IPC / BNS e.g. section 69, 302, cheating, etc.)
  const matchedStatutes = useMemo<LegalSectionEntry[]>(() => {
    if (!q) return [];
    return searchLegalSections(q).slice(0, 4);
  }, [q]);

  // 2. Case matches
  const matchedCases = useMemo<CaseFile[]>(() => {
    if (!q) return [];
    return cases.filter(c =>
      c.caseNumber.toLowerCase().includes(q) ||
      c.clientName.toLowerCase().includes(q) ||
      c.opponentName.toLowerCase().includes(q) ||
      c.courtLocation.toLowerCase().includes(q) ||
      c.actSections.some(s => s.toLowerCase().includes(q) || (digits && s.replace(/[^0-9a-z]/gi, '').includes(digits)))
    ).slice(0, 4);
  }, [q, cases, digits]);

  // 3. Hearing matches
  const matchedHearings = useMemo<HearingItem[]>(() => {
    if (!q) return [];
    return hearings.filter(h =>
      h.caseNumber.toLowerCase().includes(q) ||
      h.clientName.toLowerCase().includes(q) ||
      h.courtName.toLowerCase().includes(q) ||
      (h.purposeEn && h.purposeEn.toLowerCase().includes(q))
    ).slice(0, 3);
  }, [q, hearings]);

  if (!isOpen) return null;

  const quickSuggestions = ['Section 69', 'BNS 103', 'IPC 420', 'Cheating', 'Bail', 'High Court'];

  return (
    <AnimatePresence>
      <div 
        onClick={(e) => {
          if (e.target === e.currentTarget) onClose();
        }}
        className="fixed inset-0 z-50 bg-black/85 backdrop-blur-2xl flex items-start justify-center p-3 sm:p-6 pt-16 sm:pt-20"
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: -20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: -20 }}
          transition={{ type: 'spring', stiffness: 500, damping: 30 }}
          className="w-full max-w-2xl bg-[#090A0E] border border-white/[0.14] rounded-3xl shadow-[0_30px_90px_rgba(0,0,0,0.95)] flex flex-col max-h-[80vh] text-white relative overflow-hidden"
        >
          {/* 21st.dev Signature Border Beam */}
          <BorderBeam size={250} duration={7} colorFrom="#FFFFFF" colorTo="rgba(245, 197, 99, 0.4)" />

          {/* Top Search Input Bar */}
          <div className="p-3 sm:p-5 pb-3 border-b border-white/[0.08] relative">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="w-10 h-10 rounded-2xl bg-white/[0.06] hover:bg-white/[0.14] border border-white/[0.1] flex items-center justify-center text-neutral-300 hover:text-white transition shrink-0 ios-press"
                title="Back / Close Search"
              >
                <ArrowLeft size={18} />
              </button>

              <div className="relative flex-1 flex items-center">
                <Search size={17} className="absolute left-3.5 text-neutral-400 pointer-events-none" />
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  autoFocus
                  placeholder="Search Section 69, BNS 103, cases, clients, courts..."
                  className="w-full bg-black/70 border border-white/[0.12] focus:border-amber-400/40 rounded-2xl pl-10 pr-10 py-3 text-sm text-white placeholder-neutral-500 focus:outline-none focus:ring-1 focus:ring-amber-400/30 transition shadow-inner font-sans"
                />
                {query ? (
                  <button
                    onClick={() => setQuery('')}
                    className="absolute right-3 text-neutral-400 hover:text-white p-1"
                    title="Clear search input"
                  >
                    <X size={15} />
                  </button>
                ) : (
                  <button
                    onClick={onClose}
                    className="absolute right-3 text-[10px] font-mono text-neutral-400 bg-white/[0.06] px-2 py-0.5 rounded-lg border border-white/[0.08]"
                  >
                    ESC
                  </button>
                )}
              </div>
            </div>

            {/* Quick Filter Chips */}
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pt-3">
              <span className="text-[10px] text-neutral-500 font-mono flex items-center gap-1 shrink-0">
                <Sparkles size={11} className="text-amber-400" /> Suggested:
              </span>
              {quickSuggestions.map(chip => (
                <button
                  key={chip}
                  onClick={() => setQuery(chip)}
                  className="text-[10.5px] px-2.5 py-0.5 rounded-lg bg-white/[0.04] hover:bg-white/[0.1] border border-white/[0.08] text-neutral-300 font-mono transition ios-press shrink-0"
                >
                  {chip}
                </button>
              ))}
            </div>
          </div>

          {/* Results Container */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4 no-scrollbar">
            {!q ? (
              <div className="py-12 text-center text-neutral-500 text-xs flex flex-col items-center justify-center gap-2 font-mono">
                <Scale size={28} className="text-neutral-700 animate-float" />
                <p className="text-neutral-300 font-medium">Type any section, keyword, or case identifier</p>
                <p className="text-[11px] text-neutral-600 max-w-sm">
                  Try "Section 69", "BNS 103", "IPC 420", "Mob lynching", "Sharma", or "High Court".
                </p>
              </div>
            ) : (
              <>
                {/* ── Statutory Sections Result ── */}
                {matchedStatutes.length > 0 && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-[11px] font-mono uppercase tracking-wider text-amber-300 px-1">
                      <span className="flex items-center gap-1.5">
                        <Scale size={13} className="text-amber-400" />
                        Statutory Law (BNS 2023 ↔ IPC Registry)
                      </span>
                      {onOpenIpcModal && (
                        <button
                          onClick={() => {
                            onClose();
                            onOpenIpcModal();
                          }}
                          className="text-[10px] text-neutral-400 hover:text-white underline"
                        >
                          All Sections →
                        </button>
                      )}
                    </div>

                    <div className="space-y-2">
                      {matchedStatutes.map(item => (
                        <div
                          key={item.id}
                          onClick={() => {
                            if (onOpenIpcModal) {
                              onClose();
                              onOpenIpcModal();
                            }
                          }}
                          className="p-3.5 rounded-2xl bg-white/[0.035] hover:bg-white/[0.08] border border-white/[0.08] hover:border-white/[0.2] transition cursor-pointer flex flex-col gap-1.5 group"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-mono font-bold text-amber-300 bg-amber-400/15 border border-amber-400/30 px-2 py-0.5 rounded-md">
                                BNS Sec. {item.bns}
                              </span>
                              <ArrowRight size={11} className="text-neutral-500" />
                              <span className="text-[11px] font-mono text-rose-400 bg-rose-500/10 border border-rose-500/20 px-2 py-0.5 rounded-md">
                                IPC {item.ipc}
                              </span>
                            </div>
                            {item.category && (
                              <span className="text-[9px] font-mono px-2 py-0.5 rounded bg-neutral-800 text-neutral-400 border border-white/[0.06]">
                                {item.category}
                              </span>
                            )}
                          </div>
                          <h4 className="text-xs font-bold text-white group-hover:text-amber-200 transition">
                            {item.title}
                          </h4>
                          {item.description && (
                            <p className="text-[11px] text-neutral-400 line-clamp-2">
                              {item.description}
                            </p>
                          )}
                          {item.punishment && (
                            <p className="text-[10px] font-mono text-neutral-500 pt-1 border-t border-white/[0.04]">
                              Punishment: <span className="text-neutral-300">{item.punishment}</span>
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* ── Case Records Result ── */}
                {matchedCases.length > 0 && (
                  <div className="space-y-2 pt-2">
                    <span className="text-[11px] font-mono uppercase tracking-wider text-emerald-400 flex items-center gap-1.5 px-1">
                      <Folder size={13} />
                      Active Case Dockets ({matchedCases.length})
                    </span>
                    <div className="space-y-2">
                      {matchedCases.map(c => (
                        <div
                          key={c.id}
                          onClick={() => {
                            onClose();
                            onSelectCase(c.caseNumber);
                          }}
                          className="p-3.5 rounded-2xl bg-white/[0.035] hover:bg-white/[0.08] border border-white/[0.08] hover:border-emerald-500/30 transition cursor-pointer flex items-center justify-between gap-3 group"
                        >
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-mono font-bold text-white group-hover:text-emerald-300">
                                {c.caseNumber}
                              </span>
                              <span className="text-[10px] px-1.5 py-0.2 rounded bg-neutral-800 text-neutral-400 font-mono">
                                {c.courtLocation}
                              </span>
                            </div>
                            <p className="text-xs text-neutral-300 mt-1 font-semibold">
                              {c.clientName} <span className="text-neutral-500 font-normal italic">vs. {c.opponentName}</span>
                            </p>
                            <div className="flex items-center gap-1 mt-1.5 flex-wrap">
                              {c.actSections.map((sec, i) => (
                                <span key={i} className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-black/50 text-neutral-400 border border-white/[0.06]">
                                  {sec}
                                </span>
                              ))}
                            </div>
                          </div>
                          <ArrowRight size={14} className="text-neutral-500 group-hover:text-emerald-300 transition shrink-0" />
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* ── Hearings Result ── */}
                {matchedHearings.length > 0 && (
                  <div className="space-y-2 pt-2">
                    <span className="text-[11px] font-mono uppercase tracking-wider text-violet-400 flex items-center gap-1.5 px-1">
                      <Calendar size={13} />
                      Court Hearing Board ({matchedHearings.length})
                    </span>
                    <div className="space-y-2">
                      {matchedHearings.map(h => (
                        <div
                          key={h.id}
                          onClick={() => {
                            onClose();
                            onSelectCase(h.caseNumber);
                          }}
                          className="p-3 rounded-2xl bg-white/[0.03] border border-white/[0.06] hover:border-violet-500/30 flex items-center justify-between text-xs cursor-pointer transition"
                        >
                          <div>
                            <span className="font-mono font-bold text-white">{h.caseNumber}</span>
                            <p className="text-[11px] text-neutral-400">{h.courtName} • {h.purposeEn || 'Hearing'}</p>
                          </div>
                          <span className="text-[10px] font-mono px-2 py-1 rounded-lg bg-violet-500/10 text-violet-300 border border-violet-500/20">
                            {h.hearingDate}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {matchedStatutes.length === 0 && matchedCases.length === 0 && matchedHearings.length === 0 && (
                  <div className="py-12 text-center text-neutral-500 text-xs">
                    No results found for "{query}". Try checking IPC ↔ BNS registry directly.
                  </div>
                )}
              </>
            )}
          </div>

          {/* Footer */}
          <div className="p-3 px-5 border-t border-white/[0.08] flex items-center justify-between text-[10px] text-neutral-400 font-mono bg-black/40">
            <span>NYAAYNEETI Universal Judicial Search</span>
            <span className="flex items-center gap-1 text-emerald-400">
              <ShieldCheck size={11} /> 100% Verified Law
            </span>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
