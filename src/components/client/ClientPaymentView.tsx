import React from 'react';
import { CheckCircle2, Receipt, FileText, IndianRupee, Clock, AlertCircle } from 'lucide-react';
import { InvoiceItem, Language } from '../../types';

interface ClientPaymentViewProps {
  invoices: InvoiceItem[];
  language: Language;
  onPayInvoice?: (invoiceId: string) => void;
}

export const ClientPaymentView: React.FC<ClientPaymentViewProps> = ({
  invoices,
  language,
}) => {
  const t = (en: string, hi: string) => language === 'hi' ? hi : en;

  const pendingInvoices = invoices.filter(i => i.status !== 'Paid');
  const paidInvoices = invoices.filter(i => i.status === 'Paid');

  return (
    <div className="flex flex-col gap-5 p-5 pb-24">
      {/* Header */}
      <div>
        <span className="text-[11px] font-semibold tracking-wider uppercase text-neutral-500">
          {t('Billing Records', 'बिलिंग रिकॉर्ड')}
        </span>
        <h1 className="text-2xl font-bold tracking-tight text-white mt-0.5">
          {t('Advocate Invoices', 'अधिवक्ता बिल')}
        </h1>
        <p className="text-xs text-neutral-400 mt-1 leading-relaxed">
          {t(
            'Invoices issued by your advocate. Payments are made directly to your advocate offline. Contact them for payment details.',
            'आपके अधिवक्ता द्वारा जारी बिल। भुगतान सीधे अधिवक्ता को ऑफ़लाइन किया जाता है।'
          )}
        </p>
      </div>

      {/* Notice Banner */}
      <div className="flex items-start gap-3 px-4 py-3 rounded-2xl bg-amber-500/10 border border-amber-500/20">
        <AlertCircle size={16} className="text-amber-400 shrink-0 mt-0.5" />
        <p className="text-xs text-amber-200 leading-relaxed">
          {t(
            'Payments are made directly to your advocate (cash, bank transfer, or UPI as agreed). NYAAYNEETI only maintains your invoice records.',
            'भुगतान सीधे अधिवक्ता को करें। NYAAYNEETI केवल बिल रिकॉर्ड रखता है।'
          )}
        </p>
      </div>

      {invoices.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-14 px-6 text-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-white/[0.04] border border-white/[0.08] flex items-center justify-center">
            <Receipt size={26} className="text-neutral-600" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white">No Invoices Yet</h3>
            <p className="text-xs text-neutral-400 mt-1.5 leading-relaxed">
              {t(
                'When your advocate issues a fee invoice, it will appear here for your records.',
                'जब आपका अधिवक्ता बिल जारी करेगा, वह यहाँ दिखेगा।'
              )}
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Pending Invoices */}
          {pendingInvoices.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-[10px] font-semibold text-amber-300 uppercase tracking-wider">
                <Clock size={11} />
                <span>{t('Pending Payment', 'भुगतान बकाया')}</span>
              </div>
              {pendingInvoices.map(inv => (
                <div
                  key={inv.id}
                  className="glass-card rounded-3xl p-5 flex flex-col gap-3.5 border border-amber-500/20"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-[10px] font-mono text-neutral-500 block">
                        {inv.invoiceNumber} • {inv.date}
                      </span>
                      <h3 className="text-base font-bold text-white tracking-tight mt-0.5">
                        {t('Advocate Professional Fee', 'अधिवक्ता शुल्क')}
                      </h3>
                      <p className="text-xs text-neutral-400 font-mono mt-0.5">{inv.caseNumber}</p>
                    </div>
                    <div className="text-right">
                      <span className="text-xl font-bold text-white font-mono flex items-center gap-0.5">
                        <IndianRupee size={16} className="mt-0.5" />
                        {inv.totalAmount.toLocaleString('en-IN')}
                      </span>
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full inline-block mt-1 bg-amber-500/15 text-amber-300 border border-amber-500/20">
                        {t('Awaiting Payment', 'भुगतान बकाया')}
                      </span>
                    </div>
                  </div>

                  {/* Itemized summary */}
                  <div className="bg-white/[0.02] border border-white/[0.04] rounded-2xl p-3 text-xs text-neutral-400 space-y-1.5">
                    <div className="flex justify-between">
                      <span>{t('Appearance Fee', 'उपस्थिति शुल्क')}:</span>
                      <span className="font-mono text-neutral-200">₹{inv.appearanceFee?.toLocaleString('en-IN') ?? '—'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>{t('Drafting Charges', 'प्रारूपण शुल्क')}:</span>
                      <span className="font-mono text-neutral-200">₹{inv.draftingFee?.toLocaleString('en-IN') ?? '—'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>{t('Miscellaneous', 'विविध')}:</span>
                      <span className="font-mono text-neutral-200">₹{inv.clerkageAndMisc?.toLocaleString('en-IN') ?? '—'}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 px-3 py-2.5 rounded-2xl bg-neutral-900/60 border border-white/[0.06] text-xs text-neutral-400">
                    <FileText size={13} className="text-amber-400 shrink-0" />
                    <span>{t('Contact your advocate directly to arrange payment.', 'भुगतान के लिए अपने अधिवक्ता से सीधे संपर्क करें।')}</span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Paid Invoices */}
          {paidInvoices.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-[10px] font-semibold text-emerald-400 uppercase tracking-wider">
                <CheckCircle2 size={11} />
                <span>{t('Paid', 'भुगतान किया गया')}</span>
              </div>
              {paidInvoices.map(inv => (
                <div
                  key={inv.id}
                  className="glass-card rounded-3xl p-5 flex flex-col gap-3 border border-white/[0.08] opacity-80"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-[10px] font-mono text-neutral-500 block">
                        {inv.invoiceNumber} • {inv.date}
                      </span>
                      <h3 className="text-sm font-bold text-white tracking-tight mt-0.5">
                        {t('Advocate Professional Fee', 'अधिवक्ता शुल्क')}
                      </h3>
                      <p className="text-xs text-neutral-400 font-mono mt-0.5">{inv.caseNumber}</p>
                    </div>
                    <div className="text-right">
                      <span className="text-lg font-bold text-white font-mono flex items-center gap-0.5">
                        <IndianRupee size={14} className="mt-0.5" />
                        {inv.totalAmount.toLocaleString('en-IN')}
                      </span>
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full inline-block mt-1 bg-emerald-500/15 text-emerald-400 border border-emerald-500/20">
                        {t('Settled', 'भुगतान हो गया')}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-3.5 py-2.5 rounded-2xl font-medium">
                    <CheckCircle2 size={14} />
                    <span>{t('Payment confirmed by advocate', 'अधिवक्ता द्वारा भुगतान की पुष्टि')}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
