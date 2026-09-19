import React, { useState } from 'react';
import { QrCode, CheckCircle2, IndianRupee, Download, Plus, ArrowUpRight } from 'lucide-react';
import { InvoiceItem, Language } from '../types';
import { translations } from '../i18n/translations';

interface BillingManagerProps {
  invoices: InvoiceItem[];
  language: Language;
  onPayInvoice: (invoiceId: string) => void;
  onCreateInvoice: (newInv: InvoiceItem) => void;
}

export const BillingManager: React.FC<BillingManagerProps> = ({
  invoices,
  language,
  onPayInvoice,
  onCreateInvoice
}) => {
  const t = translations[language];
  const [selectedInvoiceForPayment, setSelectedInvoiceForPayment] = useState<InvoiceItem | null>(null);
  const [selectedInvoiceForReceipt, setSelectedInvoiceForReceipt] = useState<InvoiceItem | null>(null);
  const [isCreatingNew, setIsCreatingNew] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Form states
  const [newClient, setNewClient] = useState<string>('Vikramaditya Singhania');
  const [newCase, setNewCase] = useState<string>('CRL.A./882/2025');
  const [newAppearanceFee, setNewAppearanceFee] = useState<number>(25000);
  const [newDraftingFee, setNewDraftingFee] = useState<number>(10000);
  const [newClerkage, setNewClerkage] = useState<number>(2500);

  const totalBilled = invoices.reduce((acc, curr) => acc + curr.totalAmount, 0);
  const totalCollected = invoices.filter(i => i.status === 'Paid').reduce((acc, curr) => acc + curr.totalAmount, 0);
  const totalOutstanding = totalBilled - totalCollected;

  const handleSimulatePayment = () => {
    if (selectedInvoiceForPayment) {
      onPayInvoice(selectedInvoiceForPayment.id);
      setSelectedInvoiceForPayment(null);
      setToastMessage(t.paymentSuccessNotice);
      setTimeout(() => setToastMessage(null), 3000);
    }
  };

  const handleCreateNewInvoice = () => {
    const total = Number(newAppearanceFee) + Number(newDraftingFee) + Number(newClerkage);
    const newInv: InvoiceItem = {
      id: `inv-${Date.now()}`,
      invoiceNumber: `NAYANEETI/2026/${Math.floor(100 + Math.random() * 900)}`,
      caseNumber: newCase,
      clientName: newClient,
      date: '19 Sep 2026',
      appearanceFee: Number(newAppearanceFee),
      draftingFee: Number(newDraftingFee),
      clerkageAndMisc: Number(newClerkage),
      totalAmount: total,
      status: 'Pending'
    };
    onCreateInvoice(newInv);
    setIsCreatingNew(false);
    setToastMessage("Invoice created and delivered to client!");
    setTimeout(() => setToastMessage(null), 3000);
  };

  return (
    <div className="flex flex-col gap-5 p-5 pb-24">
      {/* Toast */}
      {toastMessage && (
        <div className="sticky top-2 z-30 bg-neutral-900/90 text-white border border-emerald-500/30 px-4 py-2.5 rounded-2xl shadow-2xl backdrop-blur-xl flex items-center gap-2 text-xs font-medium animate-in fade-in">
          <CheckCircle2 size={15} className="text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Hero Header */}
      <div className="flex items-end justify-between">
        <div>
          <span className="text-[11px] font-semibold tracking-wider uppercase text-neutral-500">
            Practice Financials
          </span>
          <h1 className="text-2xl font-bold tracking-tight text-white mt-0.5">
            {t.billingHeader}
          </h1>
        </div>

        <button
          onClick={() => setIsCreatingNew(true)}
          className="px-3.5 py-2 rounded-2xl bg-white text-black font-semibold text-xs flex items-center gap-1.5 shadow-md hover:bg-neutral-200 transition ios-press"
        >
          <Plus size={14} />
          <span>New Invoice</span>
        </button>
      </div>

      {/* Apple Wallet Style Balance Card */}
      <div className="rounded-3xl p-5 border border-white/[0.1] bg-gradient-to-tr from-neutral-950 via-neutral-900 to-neutral-800 shadow-2xl flex flex-col gap-4">
        <div>
          <span className="text-xs text-neutral-400 font-medium">Practice Revenue Collected</span>
          <div className="flex items-baseline gap-1 mt-1">
            <span className="text-3xl font-bold tracking-tight text-white font-mono">
              ₹{totalCollected.toLocaleString('en-IN')}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 pt-3 border-t border-white/[0.08] text-xs">
          <div>
            <span className="text-neutral-500 block text-[10px] uppercase font-semibold">Total Billed</span>
            <span className="font-semibold text-neutral-200 font-mono mt-0.5 block">
              ₹{totalBilled.toLocaleString('en-IN')}
            </span>
          </div>
          <div>
            <span className="text-neutral-500 block text-[10px] uppercase font-semibold">Outstanding</span>
            <span className="font-semibold text-amber-300 font-mono mt-0.5 block">
              ₹{totalOutstanding.toLocaleString('en-IN')}
            </span>
          </div>
        </div>
      </div>

      {/* Invoice Feed */}
      {invoices.length === 0 ? (
        <div className="glass-card rounded-3xl p-8 text-center flex flex-col items-center gap-3 border border-white/[0.08]">
          <div className="w-12 h-12 rounded-2xl bg-white/[0.04] border border-white/[0.08] flex items-center justify-center text-amber-300 font-mono font-bold text-lg">
            ₹
          </div>
          <div>
            <h4 className="text-sm font-semibold text-white">
              {language === 'en' ? 'No Invoices Yet' : 'अभी कोई बिल नहीं है'}
            </h4>
            <p className="text-xs text-neutral-400 mt-1 max-w-xs">
              {language === 'en'
                ? 'Create your first itemized legal bill to receive instant UPI payments from clients.'
                : 'मुवक्किलों से त्वरित यूपीआई भुगतान प्राप्त करने के लिए पहला बिल बनाएं।'}
            </p>
          </div>
          <button
            onClick={() => setIsCreatingNew(true)}
            className="mt-1 px-4 py-2 rounded-xl bg-white text-black font-semibold text-xs transition-all hover:bg-neutral-200 ios-press"
          >
            {language === 'en' ? '+ Create First Invoice' : '+ पहला बिल बनाएं'}
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {invoices.map(inv => (
            <div
              key={inv.id}
              className="glass-card rounded-3xl p-4 flex flex-col gap-3"
            >
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[10px] font-mono text-neutral-500 block">
                  {inv.invoiceNumber} • {inv.date}
                </span>
                <h4 className="text-sm font-bold text-white tracking-tight mt-0.5">
                  {inv.clientName}
                </h4>
                <span className="text-[11px] text-neutral-400 font-mono">{inv.caseNumber}</span>
              </div>

              <div className="text-right">
                <span className="text-base font-bold text-white font-mono block">
                  ₹{inv.totalAmount.toLocaleString('en-IN')}
                </span>
                <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full inline-block mt-1 ${
                  inv.status === 'Paid'
                    ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/20'
                    : 'bg-amber-500/15 text-amber-300 border border-amber-500/20'
                }`}>
                  {inv.status}
                </span>
              </div>
            </div>

            {/* Itemized row */}
            <div className="bg-white/[0.02] border border-white/[0.04] rounded-2xl p-2.5 text-[11px] text-neutral-400 space-y-1 font-sans">
              <div className="flex justify-between">
                <span>{t.appearanceFee}:</span>
                <span className="font-mono text-neutral-300">₹{inv.appearanceFee.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between">
                <span>{t.draftingCharges}:</span>
                <span className="font-mono text-neutral-300">₹{inv.draftingFee.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between">
                <span>{t.clerkageMisc}:</span>
                <span className="font-mono text-neutral-300">₹{inv.clerkageAndMisc.toLocaleString('en-IN')}</span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2 pt-1">
              {inv.status === 'Paid' ? (
                <button
                  onClick={() => setSelectedInvoiceForReceipt(inv)}
                  className="flex-1 py-2 rounded-2xl bg-white/[0.06] hover:bg-white/[0.1] text-neutral-300 text-xs font-semibold flex items-center justify-center gap-1.5 transition ios-press"
                >
                  <Download size={13} />
                  <span>View Official Receipt</span>
                </button>
              ) : (
                <button
                  onClick={() => setSelectedInvoiceForPayment(inv)}
                  className="flex-1 py-2 rounded-2xl bg-white text-black font-semibold text-xs flex items-center justify-center gap-1.5 hover:bg-neutral-200 transition ios-press shadow-md"
                >
                  <QrCode size={14} />
                  <span>Pay via UPI / QR</span>
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    )}

      {/* UPI QR Modal (Apple / Cash App Minimalist) */}
      {selectedInvoiceForPayment && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in">
          <div className="w-full max-w-sm glass-panel rounded-3xl p-6 shadow-2xl flex flex-col items-center gap-4 bg-[#111215] border border-white/[0.1]">
            <div className="text-center">
              <h3 className="text-sm font-semibold text-white tracking-tight">
                Scan to Pay Advocate Fees
              </h3>
              <p className="text-xs text-neutral-400 font-mono mt-0.5">{selectedInvoiceForPayment.invoiceNumber}</p>
            </div>

            <div className="w-44 h-44 bg-white p-3 rounded-3xl flex items-center justify-center shadow-2xl border-4 border-neutral-800">
              <QrCode size={130} className="text-black" />
            </div>

            <div className="text-center">
              <span className="text-2xl font-bold text-white font-mono">
                ₹{selectedInvoiceForPayment.totalAmount.toLocaleString('en-IN')}
              </span>
              <p className="text-[11px] text-neutral-400 font-mono mt-0.5">{t.upiId}</p>
            </div>

            <div className="w-full flex gap-2 pt-2">
              <button
                onClick={() => setSelectedInvoiceForPayment(null)}
                className="flex-1 py-2.5 rounded-2xl bg-white/[0.06] text-neutral-300 text-xs font-semibold"
              >
                {t.cancel}
              </button>
              <button
                onClick={handleSimulatePayment}
                className="flex-1 py-2.5 rounded-2xl bg-emerald-400 text-black font-semibold text-xs hover:bg-emerald-300 ios-press"
              >
                Confirm Settlement
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Formal Receipt Modal */}
      {selectedInvoiceForReceipt && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in">
          <div className="w-full max-w-sm glass-panel rounded-3xl p-6 shadow-2xl flex flex-col gap-3 bg-[#111215] border border-white/[0.1]">
            <div className="text-center border-b border-white/[0.08] pb-3">
              <span className="text-[10px] font-mono tracking-widest uppercase text-amber-300">
                Official Receipt
              </span>
              <h3 className="text-sm font-bold text-white mt-1">Advocate Rajesh Mehta</h3>
              <p className="text-[10px] text-neutral-500">Bar Council of Delhi • D/1482/2015</p>
            </div>

            <div className="bg-black/40 p-3.5 rounded-2xl border border-white/[0.06] space-y-2 text-xs text-neutral-300 font-mono">
              <div className="flex justify-between">
                <span className="text-neutral-500">Receipt Ref:</span>
                <span>REC-{selectedInvoiceForReceipt.invoiceNumber}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-500">Client:</span>
                <span className="text-white font-sans">{selectedInvoiceForReceipt.clientName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-500">Case No:</span>
                <span>{selectedInvoiceForReceipt.caseNumber}</span>
              </div>
              <div className="flex justify-between border-t border-white/[0.06] pt-2 font-bold text-white">
                <span>Settled:</span>
                <span className="text-emerald-400">₹{selectedInvoiceForReceipt.totalAmount.toLocaleString('en-IN')}</span>
              </div>
            </div>

            <button
              onClick={() => setSelectedInvoiceForReceipt(null)}
              className="w-full py-2.5 rounded-2xl bg-white/[0.06] text-white text-xs font-semibold mt-2"
            >
              {t.close}
            </button>
          </div>
        </div>
      )}

      {/* Create New Invoice Modal */}
      {isCreatingNew && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in">
          <div className="w-full max-w-sm glass-panel rounded-3xl p-5 shadow-2xl flex flex-col gap-3 bg-[#121216] border border-white/[0.1]">
            <h3 className="text-sm font-bold text-white tracking-tight">
              Create New Itemized Invoice
            </h3>

            <div className="space-y-2.5 text-xs">
              <div>
                <label className="text-neutral-400 block mb-1">Client Name</label>
                <input
                  type="text"
                  value={newClient}
                  onChange={(e) => setNewClient(e.target.value)}
                  className="w-full bg-black/60 border border-white/[0.08] rounded-2xl p-2.5 text-white"
                />
              </div>
              <div>
                <label className="text-neutral-400 block mb-1">Case Number</label>
                <input
                  type="text"
                  value={newCase}
                  onChange={(e) => setNewCase(e.target.value)}
                  className="w-full bg-black/60 border border-white/[0.08] rounded-2xl p-2.5 text-white font-mono"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-neutral-400 block mb-1">{t.appearanceFee}</label>
                  <input
                    type="number"
                    value={newAppearanceFee}
                    onChange={(e) => setNewAppearanceFee(Number(e.target.value))}
                    className="w-full bg-black/60 border border-white/[0.08] rounded-2xl p-2.5 text-white font-mono"
                  />
                </div>
                <div>
                  <label className="text-neutral-400 block mb-1">{t.draftingCharges}</label>
                  <input
                    type="number"
                    value={newDraftingFee}
                    onChange={(e) => setNewDraftingFee(Number(e.target.value))}
                    className="w-full bg-black/60 border border-white/[0.08] rounded-2xl p-2.5 text-white font-mono"
                  />
                </div>
              </div>
              <div>
                <label className="text-neutral-400 block mb-1">{t.clerkageMisc}</label>
                <input
                  type="number"
                  value={newClerkage}
                  onChange={(e) => setNewClerkage(Number(e.target.value))}
                  className="w-full bg-black/60 border border-white/[0.08] rounded-2xl p-2.5 text-white font-mono"
                />
              </div>
            </div>

            <div className="flex gap-2 pt-3">
              <button
                onClick={() => setIsCreatingNew(false)}
                className="flex-1 py-2.5 rounded-2xl bg-white/[0.06] text-neutral-300 text-xs font-semibold"
              >
                {t.cancel}
              </button>
              <button
                onClick={handleCreateNewInvoice}
                className="flex-1 py-2.5 rounded-2xl bg-white text-black font-semibold text-xs hover:bg-neutral-200 ios-press"
              >
                Issue Bill
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
