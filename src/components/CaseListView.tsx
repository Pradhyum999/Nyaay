import React, { useState } from 'react';
import { Search, ChevronRight } from 'lucide-react';
import { CaseFile, Language } from '../types';
import { translations } from '../i18n/translations';

interface CaseListViewProps {
  cases: CaseFile[];
  language: Language;
  onSelectCase: (caseNumber: string) => void;
}

export const CaseListView: React.FC<CaseListViewProps> = ({ cases, language, onSelectCase }) => {
  const t = translations[language];
  const [searchTerm, setSearchTerm] = useState<string>('');

  const filteredCases = cases.filter(c => 
    c.caseNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.opponentName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="flex flex-col gap-5 p-5 pb-6">
      {/* Header */}
      <div>
        <span className="text-[11px] font-semibold tracking-wider uppercase text-neutral-500">
          Case Records
        </span>
        <h1 className="text-2xl font-bold tracking-tight text-white mt-0.5">
          {language === 'en' ? 'Active Case Files' : 'सक्रिय वाद फ़ाइलें'}
        </h1>
      </div>

      {/* Minimal Search */}
      <div className="relative">
        <Search size={14} className="absolute left-3.5 top-3 text-neutral-500" />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder={language === 'en' ? 'Search by Case No., Client or Court...' : 'केस नं. या मुवक्किल खोजें...'}
          className="w-full bg-white/[0.04] border border-white/[0.08] rounded-2xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-white/30"
        />
      </div>

      {/* Case Cards */}
      <div className="space-y-3">
        {filteredCases.map(c => (
          <div
            key={c.id}
            onClick={() => onSelectCase(c.caseNumber)}
            className="glass-card rounded-3xl p-4 flex flex-col gap-3 cursor-pointer hover:border-white/[0.15] transition ios-press group"
          >
            <div className="flex items-start justify-between">
              <div>
                <span className="text-sm font-bold text-white font-mono tracking-tight group-hover:text-amber-300 transition">
                  {c.caseNumber}
                </span>
                <p className="text-[10px] text-neutral-500 mt-0.5 font-mono">{c.courtLocation}</p>
              </div>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                {c.status}
              </span>
            </div>

            <div>
              <p className="text-xs font-semibold text-white">{c.clientName}</p>
              <p className="text-[11px] text-neutral-400 mt-0.5 italic">vs. {c.opponentName}</p>
            </div>

            {/* Sections */}
            <div className="flex flex-wrap gap-1">
              {c.actSections.map((sec, idx) => (
                <span key={idx} className="text-[10px] px-2 py-0.5 rounded-lg bg-black/40 text-neutral-300 font-mono border border-white/[0.05]">
                  {sec}
                </span>
              ))}
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-white/[0.06] text-xs text-neutral-400 font-mono">
              <span>Billed: ₹{c.totalBilled.toLocaleString('en-IN')}</span>
              <span className="text-white font-sans text-[11px] flex items-center gap-0.5 group-hover:text-amber-300">
                <span>Case File</span>
                <ChevronRight size={13} />
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
