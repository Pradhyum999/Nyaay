import React, { useState } from 'react';
import {
  QrCode,
  CheckCircle2,
  Download,
  Plus,
  ArrowDownLeft,
  ArrowUpRight,
  CreditCard,
  Clock,
  ShieldCheck,
  Building,
  Check
} from 'lucide-react';
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
  const displayBalance = totalCollected > 0 ? totalCollected : 73828.86;

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
      invoiceNumber: `NYAAYNEETI/2026/${Math.floor(100 + Math.random() * 900)}`,
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
    setToastMessage(language === 'hi' ? 'बिल तैयार कर मुवक्किल को प्रेषित!' : 'Invoice created and added to Wallet!');
    setTimeout(() => setToastMessage(null), 3000);
  };

  return (
    <div className="flex flex-col gap-5 p-4 sm:p-5 pb-28 text-white max-w-lg mx-auto w-full">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="sticky top-2 z-30 bg-neutral-900/95 text-white border border-emerald-500/40 px-4 py-2.5 rounded-2xl shadow-2xl backdrop-blur-xl flex items-center gap-2 text-xs font-medium animate-in fade-in">
          <CheckCircle2 size={15} className="text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header matching Image 4 */}
      <div className="flex items-center justify-between pt-1">
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white font-display">
          {language === 'hi' ? 'वॉलेट एवं वित्तीय खाता' : language === 'mr' ? 'वॉलेट आणि व्यवहार' : 'Wallet'}
        </h1>
        <button
          type="button"
          onClick={() => setIsCreatingNew(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-2xl bg-white text-black font-bold text-xs hover:bg-neutral-200 transition ios-press shadow-sm"
        >
          <Plus size={14} strokeWidth={2.5} />
          <span>{language === 'hi' ? 'नया बिल' : 'New Invoice'}</span>
        </button>
      </div>

      {/* ── Wallet Balance Card (Matching Image 4) ── */}
      <div className="rounded-3xl p-5 border border-white/[0.12] bg-gradient-to-b from-neutral-900 via-neutral-950 to-black shadow-2xl flex flex-col gap-4 relative overflow-hidden">
        {/* Top Badges */}
        <div className="flex items-center justify-between">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-white/[0.06] border border-white/[0.1] text-[10px] font-mono font-medium text-amber-200/90">
            <CreditCard size={12} className="text-amber-400" />
            <span>NYAAY Legal Wallet</span>
          </span>
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-[10px] font-semibold tracking-wide">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            Active
          </span>
        </div>

        {/* Current Balance */}
        <div>
          <span className="text-xs text-neutral-400 font-medium">
            {language === 'hi' ? 'वर्तमान शेष' : language === 'mr' ? 'सध्याची शिल्लक' : 'Current Balance'}
          </span>
          <div className="flex items-baseline gap-1 mt-1">
            <span className="text-3xl sm:text-4xl font-black tracking-tight text-white font-mono">
              ₹{displayBalance.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>
        </div>

        {/* Tan / Gold Action Button matching Image 4 */}
        <button
          type="button"
          onClick={() => setIsCreatingNew(true)}
          className="w-full py-3.5 rounded-2xl bg-[#D6B588] hover:bg-[#C9A675] text-black font-bold text-xs tracking-wide flex items-center justify-center gap-2 shadow-lg transition ios-press cursor-pointer"
        >
          <Plus size={16} strokeWidth={2.5} />
          <span>{language === 'hi' ? '+ राशि जोड़ें / नया बिल बनाएं' : '+ Add Money / Create Invoice'}</span>
        </button>
      </div>

      {/* ── Recent Transactions matching Image 4 ── */}
      <div className="space-y-2.5 pt-1">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-semibold text-neutral-400 uppercase tracking-wider font-mono">
            {language === 'hi' ? 'हाल के लेनदेन' : language === 'mr' ? 'अलीकडील व्यवहार' : 'Recent Transactions'}
          </h2>
          <span className="text-[11px] text-neutral-500 font-mono">
            {invoices.length} {language === 'hi' ? 'प्रविष्टियाँ' : 'entries'}
          </span>
        </div>

        {invoices.length === 0 ? (
          <div className="glass-card rounded-2xl p-6 text-center text-xs text-neutral-400">
            {language === 'hi' ? 'कोई हालिया लेनदेन नहीं' : 'No recent transactions recorded'}
          </div>
        ) : (
          <div className="space-y-2">
            {invoices.map((inv, idx) => {
              const isPaid = inv.status === 'Paid';

              return (
                <div
                  key={inv.id || idx}
                  className="glass-card rounded-2xl p-3.5 border border-white/[0.06] hover:border-white/[0.14] flex items-center justify-between gap-3 transition"
                >
                  {/* Left Icon: Circle with diagonal arrow */}
                  <div
                    className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 border ${
                      isPaid
                        ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400'
                        : 'bg-rose-500/15 border-rose-500/30 text-rose-400'
                    }`}
                  >
                    {isPaid ? (
                      <ArrowDownLeft size={18} strokeWidth={2.2} />
                    ) : (
                      <ArrowUpRight size={18} strokeWidth={2.2} />
                    )}
                  </div>

                  {/* Center Details */}
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-white truncate">
                      {inv.clientName}
                    </p>
                    <div className="flex items-center gap-1.5 text-[10px] text-neutral-400 font-mono mt-0.5 truncate">
                      <span>{inv.date}</span>
                      <span>•</span>
                      <span className="truncate">{inv.caseNumber}</span>
                    </div>
                  </div>

                  {/* Right Amount & Status */}
                  <div className="text-right shrink-0">
                    <span
                      className={`text-xs font-bold font-mono block ${
                        isPaid ? 'text-emerald-400' : 'text-rose-400'
                      }`}
                    >
                      {isPaid ? `+₹${inv.totalAmount.toLocaleString('en-IN')}` : `-₹${inv.totalAmount.toLocaleString('en-IN')}`}
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        if (isPaid) setSelectedInvoiceForReceipt(inv);
                        else setSelectedInvoiceForPayment(inv);
                      }}
                      className="text-[10px] text-neutral-400 hover:text-white underline font-mono mt-0.5 block"
                    >
                      {isPaid ? 'Receipt' : 'Pay / Settle'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── MODAL: Create New Invoice ── */}
      {isCreatingNew && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
          <div className="glass-card rounded-3xl p-5 border border-white/[0.14] bg-neutral-950 w-full max-w-sm space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
              <h3 className="text-sm font-bold text-white font-display">
                {language === 'hi' ? 'नया कानूनी बिल तैयार करें' : 'Generate Itemized Invoice'}
              </h3>
              <button
                type="button"
                onClick={() => setIsCreatingNew(false)}
                className="w-7 h-7 rounded-full bg-white/[0.06] hover:bg-white/[0.12] flex items-center justify-center text-neutral-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-[11px] font-semibold text-neutral-300">Client Name</label>
                <input
                  type="text"
                  value={newClient}
                  onChange={e => setNewClient(e.target.value)}
                  className="w-full bg-black/60 border border-white/[0.1] rounded-2xl p-2.5 text-xs text-white focus:outline-none focus:border-amber-400/50 mt-1"
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold text-neutral-300">Case Reference</label>
                <input
                  type="text"
                  value={newCase}
                  onChange={e => setNewCase(e.target.value)}
                  className="w-full bg-black/60 border border-white/[0.1] rounded-2xl p-2.5 text-xs text-white focus:outline-none focus:border-amber-400/50 mt-1"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] text-neutral-400">Appearance Fee (₹)</label>
                  <input
                    type="number"
                    value={newAppearanceFee}
                    onChange={e => setNewAppearanceFee(Number(e.target.value))}
                    className="w-full bg-black/60 border border-white/[0.1] rounded-2xl p-2 text-xs text-white focus:outline-none mt-1 font-mono"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-neutral-400">Drafting Fee (₹)</label>
                  <input
                    type="number"
                    value={newDraftingFee}
                    onChange={e => setNewDraftingFee(Number(e.target.value))}
                    className="w-full bg-black/60 border border-white/[0.1] rounded-2xl p-2 text-xs text-white focus:outline-none mt-1 font-mono"
                  />
                </div>
              </div>

              <div className="pt-2 border-t border-white/[0.06] flex items-center justify-between text-xs">
                <span className="font-semibold text-neutral-300">Total Bill Amount:</span>
                <span className="font-bold text-amber-300 font-mono text-sm">
                  ₹{(Number(newAppearanceFee) + Number(newDraftingFee) + Number(newClerkage)).toLocaleString('en-IN')}
                </span>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsCreatingNew(false)}
                  className="flex-1 py-2.5 rounded-2xl bg-white/[0.08] hover:bg-white/[0.14] text-neutral-300 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleCreateNewInvoice}
                  className="flex-1 py-2.5 rounded-2xl bg-white text-black font-bold text-xs hover:bg-neutral-200 transition ios-press shadow-md"
                >
                  Create & Send
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL: UPI Payment ── */}
      {selectedInvoiceForPayment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
          <div className="glass-card rounded-3xl p-5 border border-white/[0.14] bg-neutral-950 w-full max-w-sm space-y-4 shadow-2xl text-center">
            <div className="flex justify-between items-center pb-2 border-b border-white/[0.08]">
              <h3 className="text-sm font-bold text-white">Settle Legal Fees</h3>
              <button onClick={() => setSelectedInvoiceForPayment(null)} className="text-neutral-400">✕</button>
            </div>
            <div>
              <p className="text-xs text-neutral-400">Amount Due</p>
              <p className="text-2xl font-bold font-mono text-white mt-1">
                ₹{selectedInvoiceForPayment.totalAmount.toLocaleString('en-IN')}
              </p>
              <p className="text-[11px] text-neutral-400 mt-1 font-mono">{selectedInvoiceForPayment.caseNumber}</p>
            </div>
            <button
              onClick={handleSimulatePayment}
              className="w-full py-3 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-xs transition ios-press"
            >
              Simulate Instant UPI Settlement
            </button>
          </div>
        </div>
      )}

      {/* ── MODAL: Receipt ── */}
      {selectedInvoiceForReceipt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
          <div className="glass-card rounded-3xl p-5 border border-white/[0.14] bg-neutral-950 w-full max-w-sm space-y-4 shadow-2xl">
            <div className="flex justify-between items-center pb-2 border-b border-white/[0.08]">
              <h3 className="text-sm font-bold text-white font-mono">Formal Receipt</h3>
              <button onClick={() => setSelectedInvoiceForReceipt(null)} className="text-neutral-400">✕</button>
            </div>
            <div className="text-xs space-y-2 text-neutral-300">
              <p><strong className="text-white">Receipt No:</strong> {selectedInvoiceForReceipt.invoiceNumber}</p>
              <p><strong className="text-white">Client:</strong> {selectedInvoiceForReceipt.clientName}</p>
              <p><strong className="text-white">Amount:</strong> ₹{selectedInvoiceForReceipt.totalAmount.toLocaleString('en-IN')}</p>
              <p><strong className="text-white">Status:</strong> <span className="text-emerald-400 font-bold">PAID VIA UPI</span></p>
            </div>
            <button
              onClick={() => setSelectedInvoiceForReceipt(null)}
              className="w-full py-2.5 rounded-2xl bg-white text-black font-bold text-xs"
            >
              Done
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
