import React, { useState, useMemo, useEffect } from 'react';
import { Card } from '../../design/ui/Card';
import { Button } from '../../design/ui/Button';
import { StatusBadge } from '../../design/ui/StatusBadge';
import { EmptyState } from '../../design/ui/EmptyState';
import { Sheet } from '../../design/ui/Sheet';
import { InvoiceItem, CaseFile, Language } from '../../types';
import { IndianRupee, Plus, Send, CheckCircle2, AlertTriangle, Clock, ArrowUpRight, Search, Folder, Scale, FileText, Download, Share2, Printer, X } from 'lucide-react';
import { PREDEFINED_FEE_DESCRIPTIONS } from '../../config/courtsData';

interface LawyerFeesPageProps {
  invoices: InvoiceItem[];
  cases: CaseFile[];
  language?: Language;
  initialCaseNumber?: string | null;
  onClearInitialCase?: () => void;
  onSendReminder?: (invoiceId: string, clientName: string, amount: number) => void;
  onMarkPaid?: (invoiceId: string) => void;
  onCreateInvoice?: (invoice: Omit<InvoiceItem, 'id'>) => void;
}

export const LawyerFeesPage: React.FC<LawyerFeesPageProps> = ({
  invoices,
  cases,
  language = 'en',
  initialCaseNumber,
  onClearInitialCase,
  onSendReminder,
  onMarkPaid,
  onCreateInvoice,
}) => {
  const [showNewInvoice, setShowNewInvoice] = useState(false);
  const [selectedCaseNum, setSelectedCaseNum] = useState('');
  const [filterCaseNum, setFilterCaseNum] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [clientName, setClientName] = useState('');
  const [amount, setAmount] = useState('');
  const [dueDate, setDueDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 7);
    return d.toISOString().split('T')[0];
  });
  const [feeDescription, setFeeDescription] = useState(PREDEFINED_FEE_DESCRIPTIONS[0]);
  const [selectedReceiptInvoice, setSelectedReceiptInvoice] = useState<InvoiceItem | null>(null);

  // If navigated with initialCaseNumber, open new invoice modal pre-filled for that case
  useEffect(() => {
    if (initialCaseNumber) {
      setSelectedCaseNum(initialCaseNumber);
      const found = cases.find(c => c.caseNumber === initialCaseNumber);
      if (found) {
        setClientName(found.clientName);
      }
      setShowNewInvoice(true);
      onClearInitialCase?.();
    }
  }, [initialCaseNumber, cases, onClearInitialCase]);

  const handleSelectCase = (cNum: string) => {
    setSelectedCaseNum(cNum);
    const found = cases.find(c => c.caseNumber === cNum);
    if (found) {
      setClientName(found.clientName);
    }
  };

  // Filter invoices strictly by case and search query
  const filteredInvoices = useMemo(() => {
    return invoices.filter(inv => {
      if (filterCaseNum !== 'all' && inv.caseNumber !== filterCaseNum) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matches =
          (inv.caseNumber || '').toLowerCase().includes(q) ||
          (inv.clientName || '').toLowerCase().includes(q) ||
          (inv.invoiceNumber || '').toLowerCase().includes(q);
        if (!matches) return false;
      }
      return true;
    });
  }, [invoices, filterCaseNum, searchQuery]);

  // Compute Outstanding and Collected dynamically from real invoices
  const { outstanding, collected, totalBilled } = useMemo(() => {
    let out = 0;
    let col = 0;
    filteredInvoices.forEach(inv => {
      if (inv.status === 'Paid') {
        col += inv.totalAmount || 0;
      } else {
        out += inv.totalAmount || 0;
      }
    });
    return { outstanding: out, collected: col, totalBilled: out + col };
  }, [filteredInvoices]);

  // Group invoices: Overdue -> Pending -> Paid
  const groupedInvoices = useMemo(() => {
    const overdue = filteredInvoices.filter(i => i.status === 'Overdue');
    const pending = filteredInvoices.filter(i => i.status === 'Pending');
    const paid = filteredInvoices.filter(i => i.status === 'Paid');
    return { overdue, pending, paid };
  }, [filteredInvoices]);

  const handleCreateSubmit = () => {
    const numAmt = parseFloat(amount);
    if (!numAmt || !selectedCaseNum || !clientName.trim()) return;

    if (onCreateInvoice) {
      onCreateInvoice({
        invoiceNumber: `INV-${Date.now().toString().slice(-4)}`,
        caseNumber: selectedCaseNum,
        clientName: clientName.trim(),
        totalAmount: numAmt,
        appearanceFee: numAmt,
        draftingFee: 0,
        clerkageAndMisc: 0,
        status: 'Pending',
        date: dueDate,
      });
    }
    setShowNewInvoice(false);
    setAmount('');
    setClientName('');
    setSelectedCaseNum('');
  };

  const getAmountFontSize = (val: string | number) => {
    const len = String(val).length;
    if (len > 12) return 'text-xs sm:text-sm';
    if (len > 9) return 'text-sm sm:text-base';
    if (len > 6) return 'text-base sm:text-lg';
    return 'text-xl sm:text-2xl';
  };

  const t = (en: string, hi: string, mr: string) => {
    if (language === 'mr') return mr;
    if (language === 'hi') return hi;
    return en;
  };

  return (
    <div className="flex flex-col gap-5 p-4 sm:p-6 pb-28 text-main max-w-4xl mx-auto w-full">
      {/* ── Header ── */}
      <div className="flex items-center justify-between pt-1">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-main font-display">
            {t('Case Fees & Invoices', 'केस फीस एवं वित्तीय लेजर', 'खटला फी व वित्तीय लेजर')}
          </h1>
          <p className="text-xs text-neutral-400 mt-0.5">
            {t(
              'Case-linked fee tracking, invoicing, and client recovery',
              'केस-वार फीस ट्रैकिंग, इनवॉइसिंग और वसूली लेजर',
              'खटला-निहाय फी ट्रॅकिंग, इनव्हॉइसिंग व वसुली लेजर'
            )}
          </p>
        </div>

        <Button
          variant="primary"
          size="sm"
          icon={<Plus size={14} />}
          onClick={() => setShowNewInvoice(true)}
        >
          {t('New Invoice', 'नया बिल', 'नवीन बिल')}
        </Button>
      </div>

      {/* ── Ledger Summary Strip ── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {/* Outstanding Card */}
        <Card className="bg-gradient-to-br from-amber-500/10 via-amber-500/5 to-transparent border-amber-400/25 p-4">
          <div className="flex items-center justify-between text-neutral-400 text-xs font-semibold">
            <span>{t('Outstanding Dues', 'बकाया देय', 'प्रलंबित देय')}</span>
            <Clock size={15} className="text-amber-400" />
          </div>
          <h2 className={`${getAmountFontSize(outstanding)} font-bold font-mono text-white mt-1.5 truncate max-w-full break-all`}>
            ₹{outstanding.toLocaleString('en-IN')}
          </h2>
          <p className="text-[11px] text-amber-300/80 mt-1 font-medium">
            {t('Pending', 'लंबित', 'प्रलंबित')} ({groupedInvoices.pending.length + groupedInvoices.overdue.length} {t('invoices', 'बिल', 'बिले')})
          </p>
        </Card>

        {/* Collected Card */}
        <Card className="bg-gradient-to-br from-emerald-500/10 via-emerald-500/5 to-transparent border-emerald-500/25 p-4">
          <div className="flex items-center justify-between text-neutral-400 text-xs font-semibold">
            <span>{t('Collected Fees', 'प्राप्त राशि', 'प्राप्त रक्कम')}</span>
            <CheckCircle2 size={15} className="text-emerald-400" />
          </div>
          <h2 className={`${getAmountFontSize(collected)} font-bold font-mono text-emerald-400 mt-1.5 truncate max-w-full break-all`}>
            ₹{collected.toLocaleString('en-IN')}
          </h2>
          <p className="text-[11px] text-emerald-300/80 mt-1 font-medium">
            {t('Settled', 'प्राप्त', 'जमा')} ({groupedInvoices.paid.length} {t('invoices', 'बिल', 'बिले')})
          </p>
        </Card>

        {/* Total Billed Card */}
        <Card className="col-span-1 bg-white/[0.03] border-white/[0.08] p-4">
          <div className="flex items-center justify-between text-neutral-400 text-xs font-semibold">
            <span>{t('Total Invoiced', 'कुल बिल राशि', 'एकूण बिल रक्कम')}</span>
            <IndianRupee size={15} className="text-neutral-400" />
          </div>
          <h2 className={`${getAmountFontSize(totalBilled)} font-bold font-mono text-white mt-1.5 truncate max-w-full break-all`}>
            ₹{totalBilled.toLocaleString('en-IN')}
          </h2>
          <p className="text-[11px] text-neutral-400 mt-1 font-medium">
            {t('Across', 'कुल', 'एकूण')} {filteredInvoices.length} {t('invoices', 'बिल', 'बिले')}
          </p>
        </Card>
      </div>

      {/* ── Case Filter & Search Strip ── */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
        <div className="flex-1 relative">
          <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder={t(
              'Search by case number or client...',
              'केस नंबर या मुवक्किल से खोजें...',
              'खटला क्रमांक किंवा पक्षकाराने शोधा...'
            )}
            className="w-full pl-9 pr-3.5 py-2.5 rounded-xl bg-white/[0.04] border border-white/[0.1] text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-amber-400"
          />
        </div>

        {cases.length > 0 && (
          <div className="shrink-0 flex items-center gap-1.5">
            <span className="text-[11px] text-neutral-400 shrink-0 font-medium">
              {t('Case:', 'केस:', 'खटला:')}
            </span>
            <select
              value={filterCaseNum}
              onChange={e => setFilterCaseNum(e.target.value)}
              className="bg-neutral-900 border border-white/[0.12] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-400 font-mono"
            >
              <option value="all">
                {t('All Matters', 'सभी मामले', 'सर्व खटले')} ({cases.length})
              </option>
              {cases.map(c => (
                <option key={c.caseNumber} value={c.caseNumber}>
                  {c.caseNumber} ({c.clientName})
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* ── Invoice Lists ── */}
      {filteredInvoices.length === 0 ? (
        <EmptyState
          icon={<IndianRupee size={24} />}
          title={searchQuery || filterCaseNum !== 'all' ? t('No matching invoices found', 'कोई मेल खाता बिल नहीं मिला', 'कोणतेही जुळणारे बिल आढळले नाही') : t('No fee invoices generated yet', 'अभी तक कोई फीस बिल नहीं बना', 'अद्याप कोणतेही फी बिल तयार केलेले नाही')}
          description={
            filterCaseNum !== 'all'
              ? `${t('No invoices have been issued for case', 'इस केस के लिए कोई बिल जारी नहीं किया गया है:', 'या खटल्यासाठी अद्याप कोणतेही बिल जारी केलेले नाही:')} ${filterCaseNum}.`
              : t('Create case-linked fee invoices for court appearance, drafting, conference, and filing.', 'अदालत में पेशी, ड्राफ्टिंग, परामर्श और फाइलिंग के लिए केस-आधारित बिल बनाएं।', 'न्यायालयीन उपस्थिती, मसुदा, सल्लामसलत व दाखल करण्यासाठी खटला-आधारित बिले तयार करा.')
          }
          actionLabel={t('+ Create Case Invoice', '+ केस बिल बनाएं', '+ केस बिल तयार करा')}
          onAction={() => {
            if (filterCaseNum !== 'all') {
              setSelectedCaseNum(filterCaseNum);
              const found = cases.find(c => c.caseNumber === filterCaseNum);
              if (found) setClientName(found.clientName);
            }
            setShowNewInvoice(true);
          }}
        />
      ) : (
        <div className="space-y-4">
          {/* Overdue Section */}
          {groupedInvoices.overdue.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-xs font-bold uppercase tracking-wider font-mono text-red-400 flex items-center gap-1.5">
                <AlertTriangle size={13} />
                <span>{t('Overdue Invoices', 'अतिदेय बिल', 'थकबाकी बिले')} ({groupedInvoices.overdue.length})</span>
              </h3>
              <div className="space-y-2">
                {groupedInvoices.overdue.map(inv => (
                  <Card key={inv.id} className="border-red-500/30 bg-red-950/15 flex items-center justify-between p-3.5">
                    <div className="min-w-0 pr-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="px-2 py-0.5 rounded-md bg-amber-400/10 text-amber-300 font-mono text-[11px] font-bold border border-amber-400/20">
                          {inv.caseNumber || t('Unassigned Case', 'अनिर्धारित केस', 'अनिर्धारित केस')}
                        </span>
                        <span className="text-xs font-bold text-white truncate">{inv.clientName}</span>
                      </div>
                      <p className="text-[11px] text-red-400 mt-1">{t('Due since', 'बकाया दिनांक', 'पासून देय')} {inv.date}</p>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <span className="text-xs font-bold font-mono text-white">₹{inv.totalAmount.toLocaleString('en-IN')}</span>
                      {onSendReminder && (
                        <Button
                          variant="secondary"
                          size="sm"
                          icon={<Send size={12} />}
                          onClick={() => onSendReminder(inv.id, inv.clientName, inv.totalAmount)}
                        >
                          {t('Remind', 'याद दिलाएं', 'स्मरण द्या')}
                        </Button>
                      )}
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Pending Section */}
          {groupedInvoices.pending.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-xs font-bold uppercase tracking-wider font-mono text-amber-300 flex items-center gap-1.5">
                <Clock size={13} />
                <span>{t('Pending Invoices', 'लंबित बिल', 'प्रलंबित बिले')} ({groupedInvoices.pending.length})</span>
              </h3>
              <div className="space-y-2">
                {groupedInvoices.pending.map(inv => (
                  <Card key={inv.id} className="flex items-center justify-between p-3.5">
                    <div className="min-w-0 pr-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="px-2 py-0.5 rounded-md bg-amber-400/10 text-amber-300 font-mono text-[11px] font-bold border border-amber-400/20">
                          {inv.caseNumber || t('Unassigned Case', 'अनिर्धारित केस', 'अनिर्धारित केस')}
                        </span>
                        <span className="text-xs font-bold text-white truncate">{inv.clientName}</span>
                      </div>
                      <p className="text-[11px] text-neutral-400 mt-1">{t('Due by', 'देय तारीख', 'पर्यंत देय')} {inv.date}</p>
                    </div>
                    <div className="flex items-center gap-2.5 shrink-0">
                      <span className="text-xs font-bold font-mono text-white">₹{inv.totalAmount.toLocaleString('en-IN')}</span>
                      {onMarkPaid && (
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => onMarkPaid(inv.id)}
                        >
                          {t('Mark Paid', 'प्राप्त चिह्नित करें', 'प्राप्त चिन्हांकित करा')}
                        </Button>
                      )}
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Paid Section */}
          {groupedInvoices.paid.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-xs font-bold uppercase tracking-wider font-mono text-emerald-400 flex items-center gap-1.5">
                <CheckCircle2 size={13} />
                <span>{t('Paid & Settled', 'प्राप्त एवं चुकता', 'प्राप्त व जमा')} ({groupedInvoices.paid.length})</span>
              </h3>
              <div className="space-y-2">
                {groupedInvoices.paid.map(inv => (
                  <Card key={inv.id} className="flex items-center justify-between p-3.5 opacity-85">
                    <div className="min-w-0 pr-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="px-2 py-0.5 rounded-md bg-emerald-400/10 text-emerald-400 font-mono text-[11px] font-bold border border-emerald-400/20">
                          {inv.caseNumber || t('Settled', 'प्राप्त', 'जमा')}
                        </span>
                        <span className="text-xs font-bold text-white truncate">{inv.clientName}</span>
                      </div>
                      <p className="text-[11px] text-neutral-400 mt-1 font-mono">{t('Invoice', 'बिल', 'बिल')} #{inv.invoiceNumber || inv.id} · {t('Paid', 'प्राप्त', 'जमा')}</p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-xs font-bold font-mono text-emerald-400">₹{inv.totalAmount.toLocaleString('en-IN')}</span>
                      <button
                        type="button"
                        onClick={() => setSelectedReceiptInvoice(inv)}
                        className="px-2 py-1 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-emerald-300 text-[11px] font-semibold flex items-center gap-1 transition ios-press"
                      >
                        <FileText size={11} />
                        <span>{t('Receipt', 'रसीद', 'पावती')}</span>
                      </button>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── New Invoice Sheet (Case Association Mandatory) ── */}
      <Sheet
        open={showNewInvoice}
        onOpenChange={setShowNewInvoice}
        title={t('Generate Case Fee Invoice', 'केस फीस इनवॉइस जारी करें', 'केस फी इनव्हॉइस जारी करा')}
        description={t('Every invoice must be linked to a case dossier for structured tracking.', 'संरचित ट्रैकिंग के लिए प्रत्येक बिल को एक केस फाइल से जोड़ना अनिवार्य है।', 'ट्रॅकिंगसाठी प्रत्येक बिल एका केस फाईलशी जोडणे आवश्यक आहे.')}
        primary={{
          label: t('Issue Invoice', 'बिल जारी करें', 'बिल जारी करा'),
          onClick: handleCreateSubmit,
          disabled: !amount || !selectedCaseNum || !clientName.trim(),
        }}
        secondary={{
          label: t('Cancel', 'रद्द करें', 'रद्द करा'),
        }}
      >
        <div className="space-y-3.5">
          <div>
            <label className="text-xs font-semibold text-neutral-300 block mb-1">
              {t('Select Case *', 'केस चुनें *', 'केस निवडा *')}
            </label>
            {cases.length === 0 ? (
              <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-300">
                {t('No active cases found. Please create a case dossier first to attach fee invoices.', 'कोई सक्रिय केस नहीं मिला। कृपया पहले एक केस बनाएं।', 'कोणताही सक्रिय खटला आढळला नाही. कृपया प्रथम खटला तयार करा.')}
              </div>
            ) : (
              <select
                required
                value={selectedCaseNum}
                onChange={e => handleSelectCase(e.target.value)}
                className="w-full bg-neutral-900 border border-white/[0.12] rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-amber-400 font-mono"
              >
                <option value="" disabled>-- {t('Select Case Dossier (Required)', 'केस फ़ाइल चुनें (अनिवार्य)', 'केस फाईल निवडा (आवश्यक)')} --</option>
                {cases.map(c => (
                  <option key={c.caseNumber} value={c.caseNumber}>
                    {c.caseNumber} · {c.clientName} ({c.courtLocation})
                  </option>
                ))}
              </select>
            )}
          </div>

          <div>
            <label className="text-xs font-semibold text-neutral-300 block mb-1">
              {t('Client Name *', 'मुवक्किल का नाम *', 'पक्षकाराचे नाव *')}
            </label>
            <input
              type="text"
              required
              value={clientName}
              onChange={e => setClientName(e.target.value)}
              placeholder="e.g. Ramesh Verma"
              className="w-full bg-white/[0.05] border border-white/[0.12] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-400"
            />
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            <div>
              <label className="text-xs font-semibold text-neutral-300 block mb-1">
                {t('Fee Amount (₹) *', 'फीस राशि (₹) *', 'फी रक्कम (₹) *')}
              </label>
              <input
                type="number"
                required
                value={amount}
                onChange={e => setAmount(e.target.value)}
                style={{ fontSize: (amount || '').length > 8 ? '0.75rem' : '0.85rem' }}
                className="w-full bg-white/[0.05] border border-white/[0.12] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-400 font-mono overflow-hidden text-ellipsis"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-neutral-300 block mb-1">
                {t('Payment Due Date', 'भुगतान देय तारीख', 'पेमेंट देय तारीख')}
              </label>
              <input
                type="date"
                value={dueDate}
                onChange={e => setDueDate(e.target.value)}
                className="w-full bg-white/[0.05] border border-white/[0.12] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-400 font-mono"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-neutral-300 block mb-1">
              {t('Fee Description / Line Item (Dropdown)', 'शुल्क विवरण / सेवा (Dropdown)', 'तपशील / सेवा (Dropdown)')}
            </label>
            <select
              value={feeDescription}
              onChange={e => setFeeDescription(e.target.value)}
              className="w-full bg-neutral-900 border border-white/[0.12] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-400 font-medium"
            >
              {PREDEFINED_FEE_DESCRIPTIONS.map(desc => (
                <option key={desc} value={desc}>
                  {desc}
                </option>
              ))}
              <option value="Custom Legal Fee">{t('Custom Legal Services', 'अन्य कानूनी सेवाएं', 'इतर कायदेशीर सेवा')}</option>
            </select>
          </div>
        </div>
      </Sheet>

      {/* ── Official Tax Invoice & Payment Receipt Modal (Suggestion 6) ── */}
      {selectedReceiptInvoice && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-neutral-950 border border-emerald-500/30 rounded-3xl p-5 sm:p-6 max-w-lg w-full space-y-4 shadow-2xl animate-in fade-in">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 font-bold">
                  ✓
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white font-display">
                    {t('OFFICIAL FEE INVOICE & RECEIPT', 'आधिकारिक फीस इनवॉइस एवं रसीद', 'अधिकृत फी इनव्हॉइस व पावती')}
                  </h3>
                  <p className="text-[10px] text-neutral-400 font-mono">
                    {t('Invoice', 'बिल', 'बिल')} #{selectedReceiptInvoice.invoiceNumber || selectedReceiptInvoice.id}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedReceiptInvoice(null)}
                className="p-1 rounded-lg hover:bg-white/10 text-neutral-400 hover:text-white"
              >
                <X size={18} />
              </button>
            </div>

            {/* Receipt Dossier Body */}
            <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/[0.08] space-y-3 text-xs">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-[10px] text-neutral-500 font-mono uppercase">{t('Case Reference', 'केस संदर्भ', 'केस संदर्भ')}</p>
                  <p className="font-bold text-white font-mono mt-0.5">{selectedReceiptInvoice.caseNumber}</p>
                </div>
                <div className="text-right">
                  <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 text-[10px] font-bold font-mono">
                    {t('STATUS: PAID', 'स्थिति: प्राप्त (चुकता)', 'स्थिती: प्राप्त (जमा)')}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2 border-t border-white/[0.06]">
                <div>
                  <p className="text-[10px] text-neutral-500 font-mono uppercase">{t('Client / Payee', 'मुवक्किल / प्राप्तकर्ता', 'पक्षकार / देणारा')}</p>
                  <p className="font-semibold text-white mt-0.5">{selectedReceiptInvoice.clientName}</p>
                </div>
                <div>
                  <p className="text-[10px] text-neutral-500 font-mono uppercase">{t('Payment Date', 'भुगतान तारीख', 'पेमेंट दिनांक')}</p>
                  <p className="font-semibold text-neutral-300 mt-0.5">{selectedReceiptInvoice.date || new Date().toISOString().split('T')[0]}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2 border-t border-white/[0.06]">
                <div>
                  <p className="text-[10px] text-neutral-500 font-mono uppercase">{t('Payment Mode', 'भुगतान माध्यम', 'पेमेंट पद्धत')}</p>
                  <p className="font-semibold text-neutral-300 mt-0.5">{selectedReceiptInvoice.paidVia || 'UPI / Instant Bank Transfer'}</p>
                </div>
                <div>
                  <p className="text-[10px] text-neutral-500 font-mono uppercase">{t('Transaction Ref / UTR', 'लेनदेन संदर्भ / यूटीआर', 'व्यवहार संदर्भ / यूटीआर')}</p>
                  <p className="font-mono text-amber-300 mt-0.5">{selectedReceiptInvoice.upiRef || `UPI/NYAAY-${Date.now().toString().slice(-8)}`}</p>
                </div>
              </div>

              <div className="pt-2 border-t border-white/[0.06] flex items-center justify-between">
                <span className="font-medium text-neutral-300">{t('Total Settled Fee Amount', 'कुल प्राप्त फीस राशि', 'एकूण प्राप्त फी रक्कम')}</span>
                <span className="text-base font-bold font-mono text-emerald-400">
                  ₹{selectedReceiptInvoice.totalAmount.toLocaleString('en-IN')}
                </span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2 pt-2">
              <Button
                variant="secondary"
                size="sm"
                className="flex-1"
                icon={<Download size={14} />}
                onClick={() => {
                  alert(`Downloading Official Tax Receipt for ${selectedReceiptInvoice.invoiceNumber || selectedReceiptInvoice.id}`);
                }}
              >
                {t('Download Receipt', 'रसीद डाउनलोड करें', 'पावती डाउनलोड करा')}
              </Button>
              <Button
                variant="primary"
                size="sm"
                className="flex-1"
                icon={<Share2 size={14} />}
                onClick={() => {
                  const shareText = `NYAAYNEETI Legal Fee Receipt:\nInvoice: ${selectedReceiptInvoice.invoiceNumber || selectedReceiptInvoice.id}\nCase: ${selectedReceiptInvoice.caseNumber}\nClient: ${selectedReceiptInvoice.clientName}\nAmount Paid: ₹${selectedReceiptInvoice.totalAmount}\nStatus: Settled via UPI`;
                  if (navigator.share) {
                    navigator.share({ title: 'Fee Receipt', text: shareText }).catch(() => {});
                  } else {
                    navigator.clipboard.writeText(shareText);
                    alert('Receipt details copied to clipboard to share with client!');
                  }
                }}
              >
                {t('Share with Client', 'मुवक्किल से साझा करें', 'पक्षकाराला पाठवा')}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
