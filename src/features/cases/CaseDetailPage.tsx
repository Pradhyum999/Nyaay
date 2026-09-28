import React, { useState } from 'react';
import { Card } from '../../design/ui/Card';
import { Button } from '../../design/ui/Button';
import { Segmented } from '../../design/ui/Segmented';
import { StatusBadge } from '../../design/ui/StatusBadge';
import { HearingCard } from '../hearings/HearingCard';
import { LogOrderSheet, LogOrderData } from '../hearings/LogOrderSheet';
import { HearingFormSheet } from '../hearings/HearingFormSheet';
import { CaseFile, HearingItem, InvoiceItem, Language } from '../../types';
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
  language?: Language;
  onBack: () => void;
  onMessageClient: (caseNumber: string, clientName: string) => void;
  onUpdateHearingOrder?: (hearingId: string, orderNotes: string, nextDate: string) => void;
  onAddHearing?: (hearing: Omit<HearingItem, 'id'>) => void;
  onSendHearingChatUpdate?: (params: any) => void;
  onNewInvoice?: (caseNumber: string) => void;
}

export const CaseDetailPage: React.FC<CaseDetailPageProps> = ({
  caseFile,
  hearings,
  invoices = [],
  language = 'en',
  onBack,
  onMessageClient,
  onUpdateHearingOrder,
  onAddHearing,
  onSendHearingChatUpdate,
  onNewInvoice,
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'hearings' | 'documents' | 'fees' | 'notes'>('overview');
  const [activeLogOrderHearing, setActiveLogOrderHearing] = useState<HearingItem | null>(null);
  const [showAddHearing, setShowAddHearing] = useState(false);
  const [caseNotes, setCaseNotes] = useState(
    'Key strategy: Cross-examine PW-1 regarding discrepancies in spot recovery memo. File certified copy of High Court precedent on Section 482 quashing.'
  );

  const normalisedCase = normaliseCaseNumber(caseFile.caseNumber);

  // Filter hearings for this case
  const caseHearings = hearings.filter(
    h => normaliseCaseNumber(h.caseNumber) === normalisedCase
  );

  // Invoices for this case
  const caseInvoices = invoices.filter(
    inv => inv.caseNumber && normaliseCaseNumber(inv.caseNumber) === normalisedCase
  );

  // Matter stages from config
  const stages = getStagesForMatter(caseFile.caseType || caseFile.actSections?.join(', '));
  const currentStageIndex = stages.findIndex(
    s => s.name.toLowerCase() === (caseFile.stage || '').toLowerCase()
  );
  const safeStageIdx = currentStageIndex >= 0 ? currentStageIndex : 2;

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
        hearingDate: `${data.nextDate}, 10:30 AM`,
        hearingTime: '10:30 AM',
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
        orderNotes: data.orderNotes,
      });
    }
  };

  return (
    <div className="flex flex-col gap-4 p-4 sm:p-6 pb-28 text-white max-w-4xl mx-auto w-full">
      {/* ── Top Bar ── */}
      <div className="flex items-center justify-between gap-3 pt-1">
        <button
          type="button"
          onClick={onBack}
          className="flex items-center gap-1.5 text-xs font-semibold text-neutral-400 hover:text-white transition ios-press"
        >
          <ArrowLeft size={16} />
          <span>{language === 'hi' ? 'सभी मामले' : 'All Cases'}</span>
        </button>

        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            size="sm"
            icon={<MessageSquare size={13} />}
            onClick={() => onMessageClient(caseFile.caseNumber, caseFile.clientName)}
          >
            {language === 'hi' ? 'मुवक्किल से चैट' : 'Message Client'}
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
              <h1 className="text-lg sm:text-xl font-bold font-mono text-white mt-1.5">
                {caseFile.caseNumber}
              </h1>
              <p className="text-sm font-semibold text-neutral-200 mt-0.5">
                {caseFile.clientName} {caseFile.opponentName ? `vs. ${caseFile.opponentName}` : ''}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-3 border-t border-white/[0.08] text-xs">
            <div className="flex items-center gap-1.5 text-neutral-300">
              <MapPin size={14} className="text-amber-400 shrink-0" />
              <span className="truncate">{caseFile.courtLocation || 'District Court'}</span>
            </div>
            <div className="flex items-center gap-1.5 text-neutral-300">
              <Calendar size={14} className="text-amber-400 shrink-0" />
              <span className="truncate font-mono">Next: {caseFile.nextHearingDate || 'TBD'}</span>
            </div>
            <div className="flex items-center gap-1.5 text-neutral-300">
              <Scale size={14} className="text-amber-400 shrink-0" />
              <span className="truncate">{caseFile.stage || 'Hearing Scheduled'}</span>
            </div>
          </div>
        </div>
      </Card>

      {/* ── Segmented Navigation Tabs ── */}
      <Segmented
        value={activeTab}
        onChange={setActiveTab}
        items={[
          { id: 'overview', label: language === 'hi' ? 'सिंहावलोकन' : 'Overview' },
          { id: 'hearings', label: language === 'hi' ? 'सुनवाई' : 'Hearings', badge: caseHearings.length },
          { id: 'documents', label: language === 'hi' ? 'दस्तावेज' : 'Documents', badge: 4 },
          { id: 'fees', label: language === 'hi' ? 'शुल्क व बिल' : 'Fees', badge: caseInvoices.length },
          { id: 'notes', label: language === 'hi' ? 'नोट्स' : 'Notes' },
        ]}
      />

      {/* ── Tab 1: Overview ── */}
      {activeTab === 'overview' && (
        <div className="space-y-4 animate-in fade-in">
          {/* Stage Progression Stepper */}
          <Card>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-bold uppercase tracking-wider font-mono text-neutral-300">
                {language === 'hi' ? 'न्यायिक कार्यवाही का चरण' : 'Procedural Stage Progression'}
              </h3>
              <span className="text-xs font-mono font-bold text-amber-300">
                Step {safeStageIdx + 1} of {stages.length}
              </span>
            </div>

            {/* Stepper bar */}
            <div className="w-full bg-white/[0.08] h-2 rounded-full overflow-hidden mb-4">
              <div
                className="bg-amber-400 h-full rounded-full transition-all duration-500"
                style={{ width: `${((safeStageIdx + 1) / stages.length) * 100}%` }}
              />
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {stages.slice(0, 4).map((s, idx) => {
                const isPassed = idx < safeStageIdx;
                const isCurrent = idx === safeStageIdx;

                return (
                  <div
                    key={s.id}
                    className={`p-2.5 rounded-2xl border text-xs ${
                      isCurrent
                        ? 'bg-amber-400/10 border-amber-400/40 text-amber-300'
                        : isPassed
                        ? 'bg-white/[0.04] border-emerald-500/30 text-emerald-400'
                        : 'bg-white/[0.02] border-white/[0.06] text-neutral-500'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 font-bold mb-1">
                      {isPassed && <CheckCircle2 size={12} />}
                      {isCurrent && <Clock size={12} className="animate-spin" />}
                      <span>{s.name}</span>
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
                {language === 'hi' ? 'लागू कानूनी धाराएं एवं अधिनियम' : 'Applicable Sections & Statutes'}
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

          {/* Quick Actions Card */}
          <Card className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h4 className="text-xs font-bold text-white">
                {language === 'hi' ? 'अगली सुनवाई निर्धारित करें या आदेश दर्ज करें' : 'Court Hearing Operations'}
              </h4>
              <p className="text-xs text-neutral-400 mt-0.5">
                Fast-track order notes, adjournments, and cause list scheduling.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="secondary"
                size="sm"
                icon={<Plus size={13} />}
                onClick={() => setShowAddHearing(true)}
              >
                Add Hearing
              </Button>
              <Button
                variant="primary"
                size="sm"
                icon={<Gavel size={13} />}
                onClick={() => {
                  const latest = caseHearings[0] || {
                    id: 'temp',
                    caseNumber: caseFile.caseNumber,
                    clientName: caseFile.clientName,
                    courtName: caseFile.courtLocation || 'District Court',
                    courtRoom: 'Court Room 04',
                    stage: caseFile.stage as any,
                  };
                  setActiveLogOrderHearing(latest as any);
                }}
              >
                Log Order
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* ── Tab 2: Hearings ── */}
      {activeTab === 'hearings' && (
        <div className="space-y-3 animate-in fade-in">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider font-mono text-neutral-300">
              {language === 'hi' ? 'सुनवाई इतिहास व आगामी तारीखें' : 'Hearing History & Listings'}
            </h3>
            <Button
              variant="primary"
              size="sm"
              icon={<Plus size={13} />}
              onClick={() => setShowAddHearing(true)}
            >
              Add Hearing
            </Button>
          </div>

          {caseHearings.length === 0 ? (
            <Card className="text-center p-8 text-neutral-400 text-xs">
              <Calendar size={24} className="mx-auto mb-2 text-neutral-500" />
              <p>No hearings listed for this case yet.</p>
              <Button
                variant="primary"
                size="sm"
                className="mt-3 mx-auto"
                onClick={() => setShowAddHearing(true)}
              >
                Schedule First Hearing
              </Button>
            </Card>
          ) : (
            caseHearings.map(hearing => (
              <HearingCard
                key={hearing.id}
                hearing={hearing}
                language={language}
                onLogOrder={h => setActiveLogOrderHearing(h)}
                onMessageClient={onMessageClient}
              />
            ))
          )}
        </div>
      )}

      {/* ── Tab 3: Documents ── */}
      {activeTab === 'documents' && (
        <div className="space-y-3 animate-in fade-in">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider font-mono text-neutral-300">
                {language === 'hi' ? 'केस दस्तावेज एवं साक्ष्य' : 'Dossier Vault & Evidentiary Documents'}
              </h3>
              <p className="text-[11px] text-neutral-400">3 of 5 required documents verified</p>
            </div>
            <Button variant="secondary" size="sm" icon={<UploadCloud size={14} />}>
              Upload Doc
            </Button>
          </div>

          <div className="space-y-2">
            {[
              { title: 'Certified Copy of Impugned Order / FIR', status: 'verified', size: '2.4 MB' },
              { title: 'Vakalatnama (Duly Signed by Client & Advocate)', status: 'verified', size: '1.1 MB' },
              { title: 'Affidavit in support of Bail Application', status: 'verified', size: '850 KB' },
              { title: 'Income & Property Tax Returns for Surety', status: 'pending', size: 'Missing' },
              { title: 'Bank Account Statement (Last 6 Months)', status: 'pending', size: 'Missing' },
            ].map(doc => (
              <Card key={doc.title} className="flex items-center justify-between p-3.5">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-xl bg-white/[0.06] flex items-center justify-center text-amber-300 shrink-0">
                    <FileText size={16} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-white truncate">{doc.title}</p>
                    <p className="text-[11px] text-neutral-400">{doc.size}</p>
                  </div>
                </div>
                <StatusBadge status={doc.status} />
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* ── Tab 4: Fees ── */}
      {activeTab === 'fees' && (
        <div className="space-y-3 animate-in fade-in">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider font-mono text-neutral-300">
              {language === 'hi' ? 'केस बिलिंग व देय राशि' : 'Matter Invoices & Fee Ledger'}
            </h3>
            <Button
              variant="primary"
              size="sm"
              icon={<Plus size={13} />}
              onClick={() => onNewInvoice?.(caseFile.caseNumber)}
            >
              New Invoice
            </Button>
          </div>

          <Card className="flex items-center justify-between p-4 bg-gradient-to-r from-amber-400/10 to-amber-500/5 border-amber-400/20">
            <div>
              <p className="text-xs text-neutral-400">Total Agreed Fee</p>
              <h3 className="text-lg font-bold font-mono text-amber-300">
                ₹{((caseFile.totalBilled || 50000)).toLocaleString('en-IN')}
              </h3>
            </div>
            <div className="text-right">
              <p className="text-xs text-neutral-400">Fee Status</p>
              <StatusBadge status={caseFile.totalBilled ? 'active' : 'pending'} label="Fee Agreed" />
            </div>
          </Card>

          {caseInvoices.length === 0 ? (
            <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/[0.08] text-center text-xs text-neutral-400">
              <p>No itemized invoices generated yet for this matter.</p>
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

      {/* ── Tab 5: Notes ── */}
      {activeTab === 'notes' && (
        <div className="space-y-3 animate-in fade-in">
          <h3 className="text-xs font-bold uppercase tracking-wider font-mono text-neutral-300">
            {language === 'hi' ? 'गोपनीय वकील टिप्पणियाँ' : 'Private Advocate Case Strategy & Notes'}
          </h3>
          <textarea
            rows={8}
            value={caseNotes}
            onChange={e => setCaseNotes(e.target.value)}
            className="w-full bg-white/[0.04] border border-white/[0.1] rounded-2xl p-4 text-xs text-neutral-200 leading-relaxed focus:outline-none focus:border-amber-400/50 resize-none font-mono"
          />
          <div className="flex justify-end">
            <Button variant="primary" size="sm">
              Save Strategy Notes
            </Button>
          </div>
        </div>
      )}

      {/* ── Modals ── */}
      {activeLogOrderHearing && (
        <LogOrderSheet
          open={Boolean(activeLogOrderHearing)}
          onOpenChange={open => !open && setActiveLogOrderHearing(null)}
          hearingId={activeLogOrderHearing.id}
          caseNumber={activeLogOrderHearing.caseNumber}
          clientName={activeLogOrderHearing.clientName}
          court={`${caseFile.courtLocation || 'Court'}, ${caseFile.court || ''}`}
          currentStage={caseFile.stage}
          language={language}
          onSave={handleSaveOrder}
        />
      )}

      <HearingFormSheet
        open={showAddHearing}
        onOpenChange={setShowAddHearing}
        cases={[caseFile]}
        initialData={{
          caseNumber: caseFile.caseNumber,
          clientName: caseFile.clientName,
          courtName: caseFile.courtLocation || 'District Court',
          stage: caseFile.stage as any,
        }}
        language={language}
        onSave={hearing => {
          if (onAddHearing) onAddHearing(hearing);
        }}
      />
    </div>
  );
};
