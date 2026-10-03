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
  const [filter, setFilter] = useState<'all' | 'active' | 'urgent' | 'normal' | 'closed'>('all');

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

      // Status & Priority filter (Bug 9 & Suggestion 6)
      const stat = (c.status || 'Active').toLowerCase();
      const priority = (c.priority || 'Normal').toLowerCase();

      if (filter === 'all') return true;
      if (filter === 'active') return stat === 'active';
      if (filter === 'urgent') return stat === 'active' && (priority === 'urgent' || (c.actSections && c.actSections.some(s => s.toLowerCase().includes('302') || s.toLowerCase().includes('bail'))));
      if (filter === 'normal') return stat === 'active' && priority !== 'urgent';
      if (filter === 'closed') return stat === 'closed' || stat === 'disposed';

      return true;
    });
  }, [cases, searchQuery, filter]);

  return (
    <div className="flex flex-col gap-4 p-4 sm:p-6 pb-28 text-main max-w-4xl mx-auto w-full">
      {/* ── Header ── */}
      <div className="flex items-center justify-between pt-1">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-main font-display">
            {language === 'hi' ? 'मामले एवं वाद फाइलें' : language === 'mr' ? 'खटले व वाद संचिका' : 'Case Files & Dossiers'}
          </h1>
          <p className="text-xs text-neutral-400 mt-0.5">
            {cases.length} {cases.length === 1 ? (language === 'hi' ? 'मामला' : language === 'mr' ? 'खटला' : 'Matter') : (language === 'hi' ? 'मामले' : language === 'mr' ? 'खटले' : 'Matters')} {language === 'hi' ? 'सक्रिय विधिक अभ्यास' : language === 'mr' ? 'सक्रिय कायदेशीर सराव' : 'under active practice'}
          </p>
        </div>

        {filter !== 'closed' && (
          <Button
            variant="primary"
            size="sm"
            icon={<Plus size={14} />}
            onClick={onNewCase}
          >
            {language === 'hi' ? 'नया केस' : language === 'mr' ? 'नवीन खटला' : 'New Case'}
          </Button>
        )}
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
              : language === 'mr'
              ? 'खटला क्रमांक, पक्षकाराचे नाव किंवा न्यायालयाने शोधा...'
              : 'Search by case number, client, opponent, or court...'
          }
          className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-white/[0.04] border border-white/[0.1] text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-amber-400/50"
        />
      </div>

      {/* ── Option Panel with balanced alignment (Bug 8) ── */}
      <div className="grid grid-cols-4 gap-2 bg-neutral-900/60 p-1.5 rounded-2xl border border-white/[0.08]">
        {(['all', 'active', 'urgent', 'closed'] as const).map(tab => (
          <button
            key={tab}
            type="button"
            onClick={() => setFilter(tab)}
            className={`py-2 px-1 text-center rounded-xl text-xs font-semibold capitalize transition ios-press ${
              filter === tab
                ? 'bg-amber-400 text-black font-bold shadow-md'
                : 'text-neutral-400 hover:text-white hover:bg-white/[0.04]'
            }`}
          >
            {tab === 'all'
              ? (language === 'hi' ? 'सभी' : language === 'mr' ? 'सर्व' : 'All')
              : tab === 'active'
              ? (language === 'hi' ? 'सक्रिय' : language === 'mr' ? 'सक्रिय' : 'Active')
              : tab === 'urgent'
              ? (language === 'hi' ? 'अत्यावश्यक' : language === 'mr' ? 'तातडीचे' : 'Urgent')
              : (language === 'hi' ? 'बंद' : language === 'mr' ? 'बंद' : 'Closed')}
          </button>
        ))}
      </div>

      {/* ── Case List ── */}
      {filteredCases.length === 0 ? (
        <EmptyState
          icon={<Folder size={24} />}
          title={
            searchQuery
              ? (language === 'hi' ? 'कोई मामला नहीं मिला' : language === 'mr' ? 'कोणताही खटला आढळला नाही' : 'No matching cases found')
              : (language === 'hi' ? 'इस श्रेणी में कोई केस नहीं' : language === 'mr' ? 'या वर्गात कोणतेही खटले नाहीत' : 'No cases in this view')
          }
          description={
            filter === 'closed'
              ? (language === 'hi' ? 'कोई भी बंद या निस्तारित मामला रिकॉर्ड में नहीं है।' : language === 'mr' ? 'कोणताही बंद किंवा निकाली काढलेला खटला नाही.' : 'No closed or disposed cases found in your portfolio.')
              : (language === 'hi' ? 'नया केस खोलें या ई-कोर्ट से विवरण आयात करें।' : language === 'mr' ? 'नवीन खटला जोडा किंवा ई-कोर्टमधून माहिती आयात करा.' : 'Create your first case dossier or import filings from eCourts.')
          }
          actionLabel={filter === 'closed' ? undefined : (language === 'hi' ? '+ नया केस खोलें' : language === 'mr' ? '+ नवीन खटला जोडा' : '+ Create New Case')}
          onAction={filter === 'closed' ? undefined : onNewCase}
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
                    <span>{c.courtLocation || c.court || (language === 'hi' ? 'जिला न्यायालय' : language === 'mr' ? 'जिल्हा न्यायालय' : 'District Court')}</span>
                  </div>

                  {c.nextHearingDate && (
                    <div className="flex items-center gap-1 text-amber-300/90 font-mono font-medium">
                      <Calendar size={13} className="shrink-0 text-amber-400" />
                      <span>{language === 'hi' ? 'अगली:' : language === 'mr' ? 'पुढील:' : 'Next:'} {c.nextHearingDate}</span>
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
