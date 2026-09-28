import React, { useState, useMemo } from 'react';
import { Card } from '../../design/ui/Card';
import { Button } from '../../design/ui/Button';
import { StatusBadge } from '../../design/ui/StatusBadge';
import { EmptyState } from '../../design/ui/EmptyState';
import { CaseFile, Language } from '../../types';
import { Search, Plus, Folder, Calendar, MapPin, ChevronRight, Scale, AlertTriangle } from 'lucide-react';

interface CaseListPageProps {
  cases: CaseFile[];
  language?: Language;
  onSelectCase: (caseNumber: string) => void;
  onNewCase: () => void;
}

export const CaseListPage: React.FC<CaseListPageProps> = ({
  cases,
  language = 'en',
  onSelectCase,
  onNewCase,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState<'all' | 'active' | 'urgent' | 'closed'>('all');

  const filteredCases = useMemo(() => {
    return cases.filter(c => {
      // Search match
      const query = searchQuery.toLowerCase().trim();
      const matchSearch =
        !query ||
        c.caseNumber.toLowerCase().includes(query) ||
        c.clientName.toLowerCase().includes(query) ||
        (c.opponentName && c.opponentName.toLowerCase().includes(query)) ||
        (c.courtLocation && c.courtLocation.toLowerCase().includes(query));

      if (!matchSearch) return false;

      // Status filter
      const stat = (c.status || '').toLowerCase();
      if (filter === 'all') return true;
      if (filter === 'active') return stat === 'active' || !c.status;
      if (filter === 'urgent') return stat === 'urgent' || (c.actSections && c.actSections.some(s => s.includes('302') || s.includes('Bail')));
      if (filter === 'closed') return stat === 'closed' || stat === 'disposed';

      return true;
    });
  }, [cases, searchQuery, filter]);

  return (
    <div className="flex flex-col gap-4 p-4 sm:p-6 pb-28 text-white max-w-4xl mx-auto w-full">
      {/* ── Header ── */}
      <div className="flex items-center justify-between pt-1">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white font-display">
            {language === 'hi' ? 'मामले एवं वाद फाइलें' : 'Case Files & Dossiers'}
          </h1>
          <p className="text-xs text-neutral-400 mt-0.5">
            {cases.length} {cases.length === 1 ? 'Matter' : 'Matters'} under active practice
          </p>
        </div>

        <Button
          variant="primary"
          size="sm"
          icon={<Plus size={14} />}
          onClick={onNewCase}
        >
          {language === 'hi' ? 'नया केस' : 'New Case'}
        </Button>
      </div>

      {/* ── Search Bar ── */}
      <div className="relative">
        <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400 pointer-events-none" />
        <input
          type="text"
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          placeholder={
            language === 'hi'
              ? 'केस नंबर, मुवक्किल का नाम या अदालत से खोजें...'
              : 'Search by case number, client, opponent, or court...'
          }
          className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-white/[0.04] border border-white/[0.1] text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-amber-400/50"
        />
      </div>

      {/* ── Filter Chips ── */}
      <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1">
        {(['all', 'active', 'urgent', 'closed'] as const).map(tab => (
          <button
            key={tab}
            type="button"
            onClick={() => setFilter(tab)}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold capitalize transition ios-press ${
              filter === tab
                ? 'bg-amber-400 text-black font-bold shadow-sm'
                : 'bg-white/[0.05] text-neutral-400 hover:text-white border border-white/[0.06]'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* ── Case List ── */}
      {filteredCases.length === 0 ? (
        <EmptyState
          icon={<Folder size={24} />}
          title={searchQuery ? 'No matching cases found' : 'No cases in this view'}
          description="Create your first case dossier or import filings from eCourts."
          actionLabel="+ Create New Case"
          onAction={onNewCase}
        />
      ) : (
        <div className="space-y-3">
          {filteredCases.map(c => {
            return (
              <Card
                key={c.id || c.caseNumber}
                interactive
                onClick={() => onSelectCase(c.caseNumber)}
                className="hover:border-amber-400/30 transition flex flex-col gap-2.5"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-10 h-10 rounded-2xl bg-neutral-900 border border-white/[0.1] flex items-center justify-center text-amber-300 shrink-0">
                      <Folder size={18} className="text-amber-400" />
                    </div>
                    <div className="min-w-0">
                      <h3 className="text-sm font-bold text-white font-mono hover:text-amber-300 transition truncate">
                        {c.caseNumber}
                      </h3>
                      <p className="text-xs text-neutral-300 font-medium truncate mt-0.5">
                        {c.clientName} {c.opponentName ? `vs. ${c.opponentName}` : ''}
                      </p>
                    </div>
                  </div>

                  <div className="shrink-0 flex items-center gap-1.5">
                    <StatusBadge status={c.status || 'active'} />
                    <ChevronRight size={16} className="text-neutral-500" />
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-white/[0.06] text-xs text-neutral-400">
                  <div className="flex items-center gap-1 truncate">
                    <MapPin size={13} className="shrink-0 text-neutral-500" />
                    <span>{c.courtLocation || c.court || 'District Court'}</span>
                  </div>

                  {c.nextHearingDate && (
                    <div className="flex items-center gap-1 text-amber-300/90 font-mono font-medium">
                      <Calendar size={13} className="shrink-0 text-amber-400" />
                      <span>Next: {c.nextHearingDate}</span>
                    </div>
                  )}

                  {c.stage && (
                    <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-white/[0.06] text-neutral-300 border border-white/[0.08]">
                      {c.stage}
                    </span>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};
