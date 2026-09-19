import React, { useState } from 'react';
import { QrCode, CheckCircle2, Download, ShieldCheck, ArrowUpRight } from 'lucide-react';
import { InvoiceItem, Language } from '../../types';
import { translations } from '../../i18n/translations';

interface ClientPaymentViewProps {
  invoices: InvoiceItem[];
  language: Language;
  onPayInvoice: (invoiceId: string) => void;
}

export const ClientPaymentView: React.FC<ClientPaymentViewProps> = ({
  invoices,
  language,
  onPayInvoice
}) => {
  const t = translations[language];
  const [selectedInvoice, setSelectedInvoice] = useState<InvoiceItem | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const clientInvoices = invoices.filter(i => i.caseNumber === 'CRL.A./882/2025' || i.caseNumber === 'CC/4128/2026');

  const handlePay = (inv: InvoiceItem) => {
    onPayInvoice(inv.id);
    setSelectedInvoice(null);
    setToastMessage("Payment of ₹" + inv.totalAmount.toLocaleString('en-IN') + " settled via UPI! Receipt generated.");
    setTimeout(() => setToastMessage(null), 3500);
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

      {/* Header */}
      <div>
        <span className="text-[11px] font-semibold tracking-wider uppercase text-neutral-500">
          Professional Fees
        </span>
        <h1 className="text-2xl font-bold tracking-tight text-white mt-0.5">
          {t.payAdvocateBill}
        </h1>
        <p className="text-xs text-neutral-400 mt-1">{t.instantReceiptNote}</p>
      </div>

      {/* Invoices */}
      <div className="space-y-3">
        {clientInvoices.map(inv => (
          <div
            key={inv.id}
            className="glass-card rounded-3xl p-5 flex flex-col gap-3.5 border border-white/[0.08]"
          >
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[10px] font-mono text-neutral-500 block">
                  {inv.invoiceNumber} • {inv.date}
                </span>
                <h3 className="text-base font-bold text-white tracking-tight mt-0.5">
                  Advocate Appearance & Drafting Fee
                </h3>
                <p className="text-xs text-neutral-400 font-mono mt-0.5">{inv.caseNumber}</p>
              </div>

              <div className="text-right">
                <span className="text-xl font-bold text-white font-mono block">
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

            {/* Itemized summary */}
            <div className="bg-white/[0.02] border border-white/[0.04] rounded-2xl p-3 text-xs text-neutral-400 space-y-1">
              <div className="flex justify-between">
                <span>{t.appearanceFee}:</span>
                <span className="font-mono text-neutral-200">₹{inv.appearanceFee.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between">
                <span>{t.draftingCharges}:</span>
                <span className="font-mono text-neutral-200">₹{inv.draftingFee.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between">
                <span>{t.clerkageMisc}:</span>
                <span className="font-mono text-neutral-200">₹{inv.clerkageAndMisc.toLocaleString('en-IN')}</span>
              </div>
            </div>

            {/* Actions */}
            <div className="pt-1">
              {inv.status === 'Paid' ? (
                <div className="flex items-center justify-between text-xs text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-3.5 py-2.5 rounded-2xl font-medium">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 size={15} />
                    <span>Settled via UPI • Receipt Stored</span>
                  </div>
                  <button className="underline text-white hover:text-amber-300 text-xs">
                    Download
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setSelectedInvoice(inv)}
                  className="w-full py-3 rounded-2xl bg-white text-black font-semibold text-xs flex items-center justify-center gap-1.5 hover:bg-neutral-200 transition ios-press shadow-lg"
                >
                  <QrCode size={15} />
                  <span>Pay with UPI (GPay / PhonePe / Paytm)</span>
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Pay Modal */}
      {selectedInvoice && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in">
          <div className="w-full max-w-sm glass-panel rounded-3xl p-6 shadow-2xl flex flex-col items-center gap-4 bg-[#111215] border border-white/[0.1]">
            <div className="text-center">
              <h3 className="text-sm font-semibold text-white tracking-tight">
                Scan UPI QR to Pay Advocate
              </h3>
              <p className="text-xs text-neutral-400 font-mono mt-0.5">Adv. Rajesh Mehta</p>
            </div>

            <div className="w-44 h-44 bg-white p-3 rounded-3xl flex items-center justify-center shadow-2xl border-4 border-neutral-800">
              <QrCode size={130} className="text-black" />
            </div>

            <div className="text-center">
              <span className="text-2xl font-bold text-white font-mono">
                ₹{selectedInvoice.totalAmount.toLocaleString('en-IN')}
              </span>
              <p className="text-[11px] text-neutral-400 font-mono mt-0.5">nyaay.adv.mehta@oksbi</p>
            </div>

            <div className="w-full flex gap-2 pt-2">
              <button
                onClick={() => setSelectedInvoice(null)}
                className="flex-1 py-2.5 rounded-2xl bg-white/[0.06] text-neutral-300 text-xs font-semibold"
              >
                {t.cancel}
              </button>
              <button
                onClick={() => handlePay(selectedInvoice)}
                className="flex-1 py-2.5 rounded-2xl bg-emerald-400 text-black font-semibold text-xs hover:bg-emerald-300 ios-press"
              >
                Pay & Get Receipt
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

