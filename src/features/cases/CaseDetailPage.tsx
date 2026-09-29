import React, { useState } from 'react';
import { Card } from '../../design/ui/Card';
import { Button } from '../../design/ui/Button';
import { Segmented } from '../../design/ui/Segmented';
import { StatusBadge } from '../../design/ui/StatusBadge';
import { HearingCard } from '../hearings/HearingCard';
import { LogOrderSheet, LogOrderData } from '../hearings/LogOrderSheet';
import { HearingFormSheet } from '../hearings/HearingFormSheet';
import { CaseFile, HearingItem, InvoiceItem, DocumentItem, Language } from '../../types';
import { getStagesForMatter } from '../../config/stages';
import { normaliseCaseNumber } from '../../lib/caseNumber';
import {
  ArrowLeft,
  Calendar,
  MapPin,
  Scale,
  FileText,
  IndianRupee,
  MessageSquare,
  Plus,
  Gavel,
  CheckCircle2,
  Clock,
  Share2,
  AlertTriangle,
  UploadCloud,
  FileCheck
} from 'lucide-react';

interface CaseDetailPageProps {
  caseFile: CaseFile;
  hearings: HearingItem[];
  invoices?: InvoiceItem[];
  documents?: DocumentItem[];
  language?: Language;
  onBack: () => void;
  onMessageClient: (caseNumber: string, clientName: string) => void;
  onUpdateHearingOrder?: (hearingId: string, orderNotes: string, nextDate: string) => void;
  onAddHearing?: (hearing: Omit<HearingItem, 'id'>) => void;
  onSendHearingChatUpdate?: (params: any) => void;
  onNewInvoice?: (caseNumber: string) => void;
  onUploadDocument?: (caseNumber: string, file: File) => void;
}

export const CaseDetailPage: React.FC<CaseDetailPageProps> = ({
  caseFile,
  hearings,
  invoices = [],
  documents = [],
  language = 'en',
  onBack,
  onMessageClient,
  onUpdateHearingOrder,
  onAddHearing,
  onSendHearingChatUpdate,
  onNewInvoice,
  onUploadDocument,
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'hearings' | 'documents' | 'fees' | 'notes'>('overview');
  const [activeLogOrderHearing, setActiveLogOrderHearing] = useState<HearingItem | null>(null);
  const [showAddHearing, setShowAddHearing] = useState(false);
  const [caseNotes, setCaseNotes] = useState('');

  const t = (en: string, hi: string, mr: string) => {
    if (language === 'mr') return mr;
    if (language === 'hi') return hi;
    return en;
  };

  const normalisedCase = normaliseCaseNumber(caseFile.caseNumber);

  // Filter hearings for this case
  const caseHearings = hearings.filter(
    h => normaliseCaseNumber(h.caseNumber) === normalisedCase
  );

  // Invoices for this case
  const caseInvoices = invoices.filter(
    inv => inv.caseNumber && normaliseCaseNumber(inv.caseNumber) === normalisedCase
  );

  // Documents for this case (O4 & F13)
  const caseDocs = documents.filter(
    d => d.caseNumber && normaliseCaseNumber(d.caseNumber) === normalisedCase
  );
  const pendingDocsCount = caseDocs.filter(
    d => (d.status || '').toLowerCase() !== 'verified'
  ).length;
  const verifiedDocsCount = caseDocs.filter(
    d => (d.status || '').toLowerCase() === 'verified'
  ).length;

  // Matter stages from config - show all without slicing (O5-1)
  const stages = getStagesForMatter(caseFile.caseType || caseFile.actSections?.join(', '));
  const currentStageIndex = stages.findIndex(
    s => s.name.toLowerCase() === (caseFile.stage || '').toLowerCase()
  );
  const safeStageIdx = currentStageIndex >= 0 ? currentStageIndex : 0;

  const handleSaveOrder = (data: LogOrderData) => {
    if (activeLogOrderHearing && onUpdateHearingOrder) {
      onUpdateHearingOrder(activeLogOrderHearing.id, data.orderNotes, data.nextDate);
    }
    if (onAddHearing && activeLogOrderHearing) {
      onAddHearing({
        caseNumber: data.caseNumber,
        clientName: activeLogOrderHearing.clientName,
        courtName: activeLogOrderHearing.courtName,
        courtRoom: activeLogOrderHearing.courtRoom,
        hearingDate: `${data.nextDate}`,
        hearingTime: data.nextDate.includes(',') ? data.nextDate.split(',')[1]?.trim() : undefined,
        itemNumber: activeLogOrderHearing.itemNumber,
        judgeName: activeLogOrderHearing.judgeName,
        stage: data.nextStage as any,
        purposeEn: data.nextStage,
        purposeHi: data.nextStage,
        previousOrderSummaryEn: data.orderNotes,
      });
    }
    if (data.notifyClient && onSendHearingChatUpdate) {
      onSendHearingChatUpdate({
        caseNumber: data.caseNumber,
        clientName: caseFile.clientName,
        court: `${caseFile.courtLocation || 'Court'}, ${caseFile.court || ''}`,
        status: data.outcome,
        nextDate: data.nextDate,
        stage: data.nextStage,
        orderNotes: data.orderNotes || '',
      });
    }
  };

  return (
    <div className="flex flex-col gap-4 p-4 sm:p-6 pb-32 text-main max-w-4xl mx-auto w-full">
      {/* ── Top Bar ── */}
      <div className="flex items-center justify-between gap-3 pt-1">
        <button
          type="button"
          onClick={onBack}
          className="flex items-center gap-1.5 text-xs font-semibold text-neutral-400 hover:text-main transition ios-press"
        >
          <ArrowLeft size={16} />
          <span>{t('All Cases', 'सभी मामले', 'सर्व खटले')}</span>
        </button>

        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            size="sm"
            icon={<MessageSquare size={13} />}
            onClick={() => onMessageClient(caseFile.caseNumber, caseFile.clientName)}
          >
            {t('Message Client', 'मुवक्किल से चैट', 'अशील चॅट')}
          </Button>
        </div>
      </div>

      {/* ── Case Header Dossier Card ── */}
      <Card className="border-amber-400/20 bg-gradient-to-b from-white/[0.05] to-white/[0.02]">
        <div className="flex flex-col gap-3">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-full bg-amber-400/15 border border-amber-400/30 text-amber-300">
                  {caseFile.caseType || 'Matter Dossier'}
                </span>
                <StatusBadge status={caseFile.status || 'active'} />
              </div>
              <h1 className="text-lg sm:text-xl font-bold font-mono text-main mt-1.5">
                {caseFile.caseNumber}
              </h1>
              <p className="text-sm font-semibold text-sub mt-0.5">
                {caseFile.clientName} {caseFile.opponentName ? `vs. ${caseFile.opponentName}` : ''}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-3 border-t border-white/[0.08] text-xs">
            <div className="flex items-center gap-1.5 text-sub">
              <MapPin size={14} className="text-amber-400 shrink-0" />
              <span className="truncate">{caseFile.courtLocation || caseFile.court || 'Court'}</span>
            </div>
            <div className="flex items-center gap-1.5 text-sub">
              <Calendar size={14} className="text-amber-400 shrink-0" />
              <span className="truncate font-mono">
                {t('Next', 'अगली', 'पुढील')}: {caseFile.nextHearingDate || t('TBD', 'निर्धारित नहीं', 'ठरवायचे आहे')}
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-sub">
              <Scale size={14} className="text-amber-400 shrink-0" />
              <span className="truncate">{caseFile.stage || t('Hearing Scheduled', 'सुनवाई निर्धारित', 'सुनावणी नियोजित')}</span>
            </div>
          </div>
        </div>
      </Card>

      {/* ── Segmented Navigation Tabs ── */}
      <Segmented
        value={activeTab}
        onChange={setActiveTab}
        items={[
          { id: 'overview', label: t('Overview', 'सिंहावलोकन', 'आढावा') },
          { id: 'hearings', label: t('Hearings', 'सुनवाई', 'सुनावणी'), badge: caseHearings.length },
          { id: 'documents', label: t('Documents', 'दस्तावेज', 'कागदपत्रे'), badge: pendingDocsCount || undefined },
          { id: 'fees', label: t('Fees', 'शुल्क व बिल', 'फी व बिले'), badge: caseInvoices.length },
          { id: 'notes', label: t('Notes', 'नोट्स', 'टिपा') },
        ]}
      />

      {/* ── Tab 1: Overview (O1: ZERO buttons here, clean info only) ── */}
      {activeTab === 'overview' && (
        <div className="space-y-4 animate-in fade-in">
          {/* Stage Progression Stepper: Horizontal Scrolling Strip (O5-1, O5-2) */}
          <Card>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-bold uppercase tracking-wider font-mono text-neutral-300">
                {t('Procedural Stage Progression', 'न्यायिक कार्यवाही का चरण', 'न्यायालयीन प्रक्रियेचे टप्पे')}
              </h3>
              <span className="text-xs font-mono font-bold text-amber-300">
                {t('Stage', 'चरण', 'टप्पा')} {safeStageIdx + 1} / {stages.length}
              </span>
            </div>

            {/* Stepper bar */}
            <div className="w-full bg-white/[0.08] h-2 rounded-full overflow-hidden mb-4">
              <div
                className="bg-amber-400 h-full rounded-full transition-all duration-500"
                style={{ width: `${((safeStageIdx + 1) / Math.max(stages.length, 1)) * 100}%` }}
              />
            </div>

            {/* Horizontally scrolling stages strip showing ALL stages */}
            <div className="flex overflow-x-auto no-scrollbar gap-2 pb-2">
              {stages.map((s, idx) => {
                const isPassed = idx < safeStageIdx;
                const isCurrent = idx === safeStageIdx;

                return (
                  <div
                    key={s.id}
                    className={`min-w-[120px] max-w-[160px] flex-shrink-0 p-2.5 rounded-2xl border text-xs ${
                      isCurrent
                        ? 'bg-amber-400/10 border-amber-400/40 text-amber-300'
                        : isPassed
                        ? 'bg-white/[0.04] border-emerald-500/30 text-emerald-400'
                        : 'bg-white/[0.02] border-white/[0.06] text-neutral-500'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 font-bold mb-1">
                      {isPassed && <CheckCircle2 size={12} />}
                      {isCurrent && <div className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />}
                      <span className="truncate">{s.name}</span>
                    </div>
                    <p className="text-[11px] text-neutral-400 line-clamp-1">{s.description}</p>
                  </div>
                );
              })}
            </div>
          </Card>

          {/* Legal Sections & Acts */}
          {caseFile.actSections && caseFile.actSections.length > 0 && (
            <Card>
              <h3 className="text-xs font-bold uppercase tracking-wider font-mono text-neutral-300 mb-2">
                {t('Applicable Sections & Statutes', 'लागू कानूनी धाराएं एवं अधिनियम', 'लागू कायदेशीर कलमे व कायदे')}
              </h3>
              <div className="flex flex-wrap gap-1.5">
                {caseFile.actSections.map(sec => (
                  <span
                    key={sec}
                    className="px-3 py-1 rounded-xl bg-amber-400/10 border border-amber-400/25 text-amber-300 font-mono text-xs font-bold"
                  >
                    {sec}
                  </span>
                ))}
              </div>
            </Card>
          )}
        </div>
      )}

      {/* ── Tab 2: Hearings (O1: Header has the ONLY Add Hearing CTA; O3: min-w-0 + shrink-0) ── */}
      {activeTab === 'hearings' && (
        <div className="space-y-3 animate-in fade-in">
          <div className="flex items-center justify-between gap-3">
            <h3 className="min-w-0 flex-1 truncate text-xs font-bold uppercase tracking-wider font-mono text-neutral-300">
              {t('Hearing History & Listings', 'सुनवाई इतिहास व आगामी तारीखें', 'सुनावणी इतिहास व आगामी तारखा')}
            </h3>
            <Button
              variant="primary"
              size="sm"
              className="shrink-0"
              icon={<Plus size={13} />}
              onClick={() => setShowAddHearing(true)}
            >
              {t('Add Hearing', 'सुनवाई जोड़ें', 'सुनावणी जोडा')}
            </Button>
          </div>

          {caseHearings.length === 0 ? (
            <Card className="text-center p-8 text-neutral-400 text-xs">
              <Calendar size={24} className="mx-auto mb-2 text-neutral-500" />
              <p>{t('No hearings listed for this case yet.', 'इस केस के लिए कोई सुनवाई सूचीबद्ध नहीं है।', 'या खटल्यासाठी अद्याप कोणतीही सुनावणी नाही.')}</p>
              <p className="text-[11px] text-neutral-500 mt-1">
                {t('Use the Add Hearing button above to schedule.', 'ऊपर दिए गए बटन से नई सुनवाई जोड़ें।', 'सुनावणी जोडण्यासाठी वरील बटण वापरा.')}
              </p>
            </Card>
          ) : (
            caseHearings.map(hearing => (
              <HearingCard
                key={hearing.id}
                hearing={hearing}
                language={language}
                onLogOrder={h => setActiveLogOrderHearing(h)}
              />
            ))
          )}
        </div>
      )}

      {/* ── Tab 3: Documents (O4 & F13: Real documents prop, no fake list) ── */}
      {activeTab === 'documents' && (
        <div className="space-y-3 animate-in fade-in">
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0 flex-1 truncate">
              <h3 className="truncate text-xs font-bold uppercase tracking-wider font-mono text-neutral-300">
                {t('Dossier Vault & Evidentiary Documents', 'केस दस्तावेज एवं साक्ष्य', 'खटल्याची कागदपत्रे व पुरावे')}
              </h3>
              <p className="text-xs text-neutral-400 truncate">
                {caseDocs.length > 0
                  ? `${verifiedDocsCount} ${t('of', 'में से', 'पैकी')} ${caseDocs.length} ${t('verified', 'सत्यापित', 'सत्यापित')}`
                  : t('No documents uploaded yet', 'कोई दस्तावेज अपलोड नहीं', 'अद्याप कोणतेही कागदपत्र नाही')}
              </p>
            </div>
            <label className="shrink-0 cursor-pointer">
              <input
                type="file"
                className="hidden"
                onChange={e => {
                  const file = e.target.files?.[0];
                  if (file && onUploadDocument) {
                    onUploadDocument(caseFile.caseNumber, file);
                  }
                }}
              />
              <span className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-white/[0.08] hover:bg-white/[0.12] text-white transition border border-white/[0.1]">
                <UploadCloud size={14} />
                <span>{t('Upload Doc', 'दस्तावेज जोड़ें', 'कागदपत्र जोडा')}</span>
              </span>
            </label>
          </div>

          {caseDocs.length === 0 ? (
            <Card className="text-center p-8 text-neutral-400 text-xs">
              <FileText size={24} className="mx-auto mb-2 text-neutral-500" />
              <p>{t('No documents uploaded for this case yet.', 'इस केस के लिए कोई दस्तावेज अपलोड नहीं किया गया है।', 'या खटल्यासाठी अद्याप कोणतीही कागदपत्रे अपलोड केलेली नाहीत.')}</p>
              <p className="text-[11px] text-neutral-500 mt-1">
                {t('Upload filings, orders, and evidence using the button above.', 'ऊपर दिए गए बटन का उपयोग करके याचिका, आदेश या साक्ष्य अपलोड करें।', 'वरील बटण वापरून कागदपत्रे अपलोड करा.')}
              </p>
            </Card>
          ) : (
            <div className="space-y-2">
              {caseDocs.map(doc => (
                <Card key={doc.id} className="flex items-center justify-between p-3.5">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-xl bg-white/[0.06] flex items-center justify-center text-amber-300 shrink-0">
                      <FileText size={16} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-white truncate">{doc.title || doc.name}</p>
                      <p className="text-[11px] text-neutral-400">{doc.size || 'Attached Document'}</p>
                    </div>
                  </div>
                  <StatusBadge status={doc.status || 'pending'} />
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Tab 4: Fees (O5-3 & F14: Total agreed fee from real data, zero fallback) ── */}
      {activeTab === 'fees' && (
        <div className="space-y-3 animate-in fade-in">
          <div className="flex items-center justify-between gap-3">
            <h3 className="min-w-0 flex-1 truncate text-xs font-bold uppercase tracking-wider font-mono text-neutral-300">
              {t('Matter Invoices & Fee Ledger', 'केस बिलिंग व देय राशि', 'खटला बिले व फी लेजर')}
            </h3>
            <Button
              variant="primary"
              size="sm"
              className="shrink-0"
              icon={<Plus size={13} />}
              onClick={() => onNewInvoice?.(caseFile.caseNumber)}
            >
              {t('New Invoice', 'नया बिल', 'नवीन बिल')}
            </Button>
          </div>

          <Card className="flex items-center justify-between p-4 bg-gradient-to-r from-amber-400/10 to-amber-500/5 border-amber-400/20">
            <div>
              <p className="text-xs text-neutral-400">{t('Total Agreed Fee', 'कुल सहमत शुल्क', 'एकूण ठरलेली फी')}</p>
              <h3 className="text-lg font-bold font-mono text-amber-300">
                ₹{(caseFile.totalBilled || 0).toLocaleString('en-IN')}
              </h3>
              {!caseFile.totalBilled && (
                <p className="text-[11px] text-neutral-400 mt-0.5">
                  {t('No fee agreed yet — create the first invoice.', 'अभी कोई शुल्क तय नहीं हुआ है — पहला इनवॉइस बनाएं।', 'अद्याप फी ठरलेली नाही — पहिले इनव्हॉइस तयार करा.')}
                </p>
              )}
            </div>
            <div className="text-right">
              <p className="text-xs text-neutral-400">{t('Fee Status', 'स्थिति', 'स्थिती')}</p>
              <StatusBadge status={caseFile.totalBilled ? 'active' : 'pending'} label={caseFile.totalBilled ? t('Fee Agreed', 'शुल्क तय', 'फी ठरली') : t('Pending', 'लंबित', 'प्रलंबित')} />
            </div>
          </Card>

          {caseInvoices.length === 0 ? (
            <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/[0.08] text-center text-xs text-neutral-400">
              <p>{t('No itemized invoices generated yet for this matter.', 'इस केस के लिए अभी कोई इनवॉइस नहीं बना है।', 'या खटल्यासाठी अद्याप कोणतेही इनव्हॉइस तयार केलेले नाही.')}</p>
            </div>
          ) : (
            caseInvoices.map(inv => (
              <Card key={inv.id} className="flex items-center justify-between p-3.5">
                <div>
                  <p className="text-xs font-bold text-white">{inv.clientName}</p>
                  <p className="text-[11px] text-neutral-400 font-mono">Invoice #{inv.id} · Dated {inv.date}</p>
                </div>
                <div className="text-right flex items-center gap-2">
                  <span className="text-xs font-bold font-mono text-white">₹{inv.totalAmount.toLocaleString('en-IN')}</span>
                  <StatusBadge status={inv.status} />
                </div>
              </Card>
            ))
          )}
        </div>
      )}

      {/* ── Tab 5: Notes (O2: pb-32 avoids FAB overlap) ── */}
      {activeTab === 'notes' && (
        <div className="space-y-3 animate-in fade-in">
          <h3 className="text-xs font-bold uppercase tracking-wider font-mono text-neutral-300">
            {t('Private Advocate Case Strategy & Notes', 'गोपनीय वकील टिप्पणियाँ', 'खाजगी वकील रणनीती व टिपा')}
          </h3>
          <textarea
            rows={8}
            value={caseNotes}
            onChange={e => setCaseNotes(e.target.value)}
            placeholder={t('Enter private strategic case notes...', 'रणनीतिक केस नोट्स यहाँ लिखें...', 'रणनीतिक केस नोट्स येथे लिहा...')}
            className="w-full bg-white/[0.04] border border-white/[0.1] rounded-2xl p-4 text-xs text-neutral-200 leading-relaxed focus:outline-none focus:border-amber-400/50 resize-none font-mono"
          />
          <div className="flex justify-end">
            <Button variant="primary" size="sm">
              {t('Save Strategy Notes', 'नोट्स सुरक्षित करें', 'टिपा जतन करा')}
            </Button>
          </div>
        </div>
      )}

      {/* ── Log Order Sheet ── */}
      {activeLogOrderHearing && (
        <LogOrderSheet
          open={Boolean(activeLogOrderHearing)}
          onOpenChange={(isOpen) => { if (!isOpen) setActiveLogOrderHearing(null); }}
          hearingId={activeLogOrderHearing.id}
          caseNumber={activeLogOrderHearing.caseNumber || caseFile.caseNumber}
          clientName={activeLogOrderHearing.clientName || caseFile.clientName}
          court={activeLogOrderHearing.courtName || caseFile.courtLocation}
          currentStage={activeLogOrderHearing.stage || caseFile.stage}
          language={language}
          onSave={handleSaveOrder}
        />
      )}

      {/* ── Add Hearing Sheet ── */}
      <HearingFormSheet
        open={showAddHearing}
        onOpenChange={setShowAddHearing}
        initialData={{
          caseNumber: caseFile.caseNumber,
          clientName: caseFile.clientName,
          courtName: caseFile.courtLocation || caseFile.court || 'Court',
        }}
        language={language}
        onSave={(newHearing: Omit<HearingItem, 'id'>) => {
          if (onAddHearing) {
            onAddHearing(newHearing);
          }
          setShowAddHearing(false);
        }}
      />
    </div>
  );
};
