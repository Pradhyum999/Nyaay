import React, { useState, useMemo } from 'react';
import { Card } from '../../design/ui/Card';
import { Button } from '../../design/ui/Button';
import { StatusBadge } from '../../design/ui/StatusBadge';
import { EmptyState } from '../../design/ui/EmptyState';
import { Sheet } from '../../design/ui/Sheet';
import { InvoiceItem, CaseFile, Language } from '../../types';
import { IndianRupee, Plus, Send, CheckCircle2, AlertTriangle, Clock, ArrowUpRight, Search } from 'lucide-react';

interface LawyerFeesPageProps {
  invoices: InvoiceItem[];
  cases: CaseFile[];
  language?: Language;
  onSendReminder?: (invoiceId: string, clientName: string, amount: number) => void;
  onMarkPaid?: (invoiceId: string) => void;
  onCreateInvoice?: (invoice: Omit<InvoiceItem, 'id'>) => void;
}

export const LawyerFeesPage: React.FC<LawyerFeesPageProps> = ({
  invoices,
  cases,
  language = 'en',
  onSendReminder,
  onMarkPaid,
  onCreateInvoice,
}) => {
  const [showNewInvoice, setShowNewInvoice] = useState(false);
  const [selectedCaseNum, setSelectedCaseNum] = useState('');
  const [clientName, setClientName] = useState('');
  const [amount, setAmount] = useState('');
  const [dueDate, setDueDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 7);
    return d.toISOString().split('T')[0];
  });
  const [feeDescription, setFeeDescription] = useState('Professional Fee for Court Appearance & Drafting');

  // Compute Outstanding and Collected this month from real invoices
  const { outstanding, collected } = useMemo(() => {
    let out = 0;
    let col = 0;
    invoices.forEach(inv => {
      if (inv.status === 'Paid') {
        col += inv.totalAmount || 0;
      } else {
        out += inv.totalAmount || 0;
      }
    });
    return { outstanding: out, collected: col };
  }, [invoices]);

  // Group invoices: Overdue -> Pending -> Paid
  const groupedInvoices = useMemo(() => {
    const overdue = invoices.filter(i => i.status === 'Overdue');
    const pending = invoices.filter(i => i.status === 'Pending');
    const paid = invoices.filter(i => i.status === 'Paid');
    return { overdue, pending, paid };
  }, [invoices]);

  const handleSelectCase = (cNum: string) => {
    setSelectedCaseNum(cNum);
    const found = cases.find(c => c.caseNumber === cNum);
    if (found) {
      setClientName(found.clientName);
    }
  };

  const handleCreateSubmit = () => {
    const numAmt = parseFloat(amount);
    if (!numAmt || !clientName.trim()) return;

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
  };

  return (
    <div className="flex flex-col gap-5 p-4 sm:p-6 pb-28 text-white max-w-4xl mx-auto w-full">
      {/* ── Header ── */}
      <div className="flex items-center justify-between pt-1">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white font-display">
            {language === 'hi' ? 'फीस एवं वित्तीय प्रबंधन' : 'Fees & Financial Ledger'}
          </h1>
          <p className="text-xs text-neutral-400 mt-0.5">
            Advocate fee invoices, recovery tracking, and client billing
          </p>
        </div>

        <Button
          variant="primary"
          size="sm"
          icon={<Plus size={14} />}
          onClick={() => setShowNewInvoice(true)}
        >
          {language === 'hi' ? 'नया बिल' : 'New Invoice'}
        </Button>
      </div>

      {/* ── Ledger Summary Strip ── */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4">
        {/* Outstanding Card */}
        <Card className="bg-gradient-to-br from-amber-500/10 via-amber-500/5 to-transparent border-amber-400/25">
          <div className="flex items-center justify-between text-neutral-400 text-xs font-semibold">
            <span>Outstanding Dues</span>
            <Clock size={15} className="text-amber-400" />
          </div>
          <h2 className="text-xl sm:text-2xl font-bold font-mono text-white mt-1.5">
            ₹{outstanding.toLocaleString('en-IN')}
          </h2>
          <p className="text-[11px] text-amber-300/80 mt-1 font-medium">
            Pending across {groupedInvoices.pending.length + groupedInvoices.overdue.length} invoices
          </p>
        </Card>

        {/* Collected Card */}
        <Card className="bg-gradient-to-br from-emerald-500/10 via-emerald-500/5 to-transparent border-emerald-500/25">
          <div className="flex items-center justify-between text-neutral-400 text-xs font-semibold">
            <span>Collected Fees</span>
            <CheckCircle2 size={15} className="text-emerald-400" />
          </div>
          <h2 className="text-xl sm:text-2xl font-bold font-mono text-emerald-400 mt-1.5">
            ₹{collected.toLocaleString('en-IN')}
          </h2>
          <p className="text-[11px] text-emerald-300/80 mt-1 font-medium">
            Recovered across {groupedInvoices.paid.length} invoices
          </p>
        </Card>
      </div>

      {/* ── Invoice Lists ── */}
      {invoices.length === 0 ? (
        <EmptyState
          icon={<IndianRupee size={24} />}
          title="No fee invoices generated yet"
          description="Create client fee invoices for appearance, drafting, conference, and clerkage."
          actionLabel="+ Create First Invoice"
          onAction={() => setShowNewInvoice(true)}
        />
      ) : (
        <div className="space-y-4">
          {/* Overdue Section */}
          {groupedInvoices.overdue.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-xs font-bold uppercase tracking-wider font-mono text-red-400 flex items-center gap-1.5">
                <AlertTriangle size={13} />
                <span>Overdue Invoices ({groupedInvoices.overdue.length})</span>
              </h3>
              <div className="space-y-2">
                {groupedInvoices.overdue.map(inv => (
                  <Card key={inv.id} className="border-red-500/30 bg-red-950/15 flex items-center justify-between p-3.5">
                    <div>
                      <p className="text-xs font-bold text-white font-mono">{inv.caseNumber} · {inv.clientName}</p>
                      <p className="text-[11px] text-red-400 mt-0.5">Due since {inv.date}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-bold font-mono text-white">₹{inv.totalAmount.toLocaleString('en-IN')}</span>
                      {onSendReminder && (
                        <Button
                          variant="secondary"
                          size="sm"
                          icon={<Send size={12} />}
                          onClick={() => onSendReminder(inv.id, inv.clientName, inv.totalAmount)}
                        >
                          Remind
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
                <span>Pending Invoices ({groupedInvoices.pending.length})</span>
              </h3>
              <div className="space-y-2">
                {groupedInvoices.pending.map(inv => (
                  <Card key={inv.id} className="flex items-center justify-between p-3.5">
                    <div>
                      <p className="text-xs font-bold text-white font-mono">{inv.caseNumber || 'General Matter'} · {inv.clientName}</p>
                      <p className="text-[11px] text-neutral-400 mt-0.5">Due by {inv.date}</p>
                    </div>
                    <div className="flex items-center gap-2.5">
                      <span className="text-xs font-bold font-mono text-white">₹{inv.totalAmount.toLocaleString('en-IN')}</span>
                      {onMarkPaid && (
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => onMarkPaid(inv.id)}
                        >
                          Mark Paid
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
                <span>Paid & Settled ({groupedInvoices.paid.length})</span>
              </h3>
              <div className="space-y-2">
                {groupedInvoices.paid.map(inv => (
                  <Card key={inv.id} className="flex items-center justify-between p-3.5 opacity-80">
                    <div>
                      <p className="text-xs font-bold text-white font-mono">{inv.caseNumber || 'Settled'} · {inv.clientName}</p>
                      <p className="text-[11px] text-neutral-400 mt-0.5">Payment received</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold font-mono text-emerald-400">₹{inv.totalAmount.toLocaleString('en-IN')}</span>
                      <StatusBadge status="paid" />
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── New Invoice Sheet ── */}
      <Sheet
        open={showNewInvoice}
        onOpenChange={setShowNewInvoice}
        title={language === 'hi' ? 'नया फीस बिल जारी करें' : 'Generate Professional Fee Invoice'}
        description="Select case, client, line item, and bill amount"
        primary={{
          label: 'Issue Invoice',
          onClick: handleCreateSubmit,
          disabled: !amount || !clientName.trim(),
        }}
        secondary={{
          label: 'Cancel',
        }}
      >
        <div className="space-y-3.5">
          {cases.length > 0 && (
            <div>
              <label className="text-xs font-semibold text-neutral-300 block mb-1">
                Link to Case Dossier
              </label>
              <select
                value={selectedCaseNum}
                onChange={e => handleSelectCase(e.target.value)}
                className="w-full bg-neutral-900 border border-white/[0.12] rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
              >
                <option value="">-- Choose Case (Optional) --</option>
                {cases.map(c => (
                  <option key={c.caseNumber} value={c.caseNumber}>
                    {c.caseNumber} ({c.clientName})
                  </option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label className="text-xs font-semibold text-neutral-300 block mb-1">
              Client Name *
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
                Amount (₹) *
              </label>
              <input
                type="number"
                required
                value={amount}
                onChange={e => setAmount(e.target.value)}
                placeholder="e.g. 25000"
                className="w-full bg-white/[0.05] border border-white/[0.12] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-400 font-mono"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-neutral-300 block mb-1">
                Payment Due Date
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
              Fee Description / Line Item
            </label>
            <input
              type="text"
              value={feeDescription}
              onChange={e => setFeeDescription(e.target.value)}
              placeholder="Appearance Fee, Bail Application Drafting"
              className="w-full bg-white/[0.05] border border-white/[0.12] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-400"
            />
          </div>
        </div>
      </Sheet>
    </div>
  );
};
