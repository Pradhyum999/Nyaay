import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, Trash2, X, ShieldAlert, Check } from 'lucide-react';
import { Language } from '../../types';

interface DeleteAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirmDelete: (reason: string, details?: string) => Promise<void> | void;
  userName?: string;
  language?: Language;
}

const DELETION_REASONS = [
  { id: 'resolved', labelEn: 'Matter resolved / No longer need legal assistance', labelHi: 'मामला सुलझ गया / अब कानूनी सहायता की आवश्यकता नहीं है' },
  { id: 'found_another', labelEn: 'Found another advocate / consulting offline', labelHi: 'अन्य वकील मिल गया / ऑफलाइन परामर्श ले रहे हैं' },
  { id: 'privacy', labelEn: 'Privacy & data retention concerns (DPDP Act)', labelHi: 'गोपनीयता और डेटा सुरक्षा संबंधी चिंताएं (DPDP अधिनियम)' },
  { id: 'difficulty', labelEn: 'App experience or technical difficulties', labelHi: 'ऐप का उपयोग करने में कठिनाई या तकनीकी समस्या' },
  { id: 'other', labelEn: 'Other personal reason', labelHi: 'अन्य व्यक्तिगत कारण' },
];

export const DeleteAccountModal: React.FC<DeleteAccountModalProps> = ({
  isOpen,
  onClose,
  onConfirmDelete,
  userName = 'User',
  language = 'en',
}) => {
  const [selectedReason, setSelectedReason] = useState<string>('resolved');
  const [additionalDetails, setAdditionalDetails] = useState('');
  const [confirmationInput, setConfirmationInput] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  if (!isOpen) return null;

  const t = (en: string, hi: string) => (language === 'hi' ? hi : en);
  const isConfirmed = confirmationInput.trim().toUpperCase() === 'DELETE';

  const handleDelete = async () => {
    if (!isConfirmed) return;
    setIsDeleting(true);
    try {
      const reasonObj = DELETION_REASONS.find(r => r.id === selectedReason);
      const fullReason = `${reasonObj?.labelEn || selectedReason}${additionalDetails ? ` - Details: ${additionalDetails}` : ''}`;
      await onConfirmDelete(fullReason, additionalDetails);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-xl flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          className="w-full max-w-lg bg-[#0F1117] border border-rose-500/40 rounded-3xl p-5 sm:p-6 shadow-2xl flex flex-col gap-4 text-white"
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-3 border-b border-white/[0.08]">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-2xl bg-rose-500/15 border border-rose-500/30 flex items-center justify-center text-rose-400 shrink-0">
                <Trash2 size={20} />
              </div>
              <div>
                <h3 className="text-sm sm:text-base font-bold text-white tracking-tight">
                  {t('Delete Account & Legal Records', 'खाता एवं कानूनी रिकॉर्ड हटाएं')}
                </h3>
                <p className="text-[11px] text-neutral-400 font-mono">
                  {t('Digital Personal Data Protection Act, 2023 (DPDP)', 'डिजिटल व्यक्तिगत डेटा संरक्षण अधिनियम, २०२३')}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-white/[0.06] hover:bg-white/[0.12] flex items-center justify-center text-neutral-400 hover:text-white transition"
            >
              <X size={15} />
            </button>
          </div>

          {/* Warning Banner */}
          <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/25 flex items-start gap-3 text-xs text-rose-200">
            <ShieldAlert size={18} className="text-rose-400 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <span className="font-bold block text-rose-300">
                {t('This action is permanent and cannot be undone', 'यह कार्रवाई स्थायी है और इसे पूर्ववत नहीं किया जा सकता')}
              </span>
              <p className="text-[11px] text-rose-200/80 leading-relaxed">
                {t(
                  'Deleting your account will permanently purge your consultation messages, uploaded evidentiary documents, and case history from NYAAY servers.',
                  'आपका खाता हटाने से आपकी परामर्श चैट, अपलोड किए गए दस्तावेज और केस इतिहास स्थायी रूप से हटा दिए जाएंगे।'
                )}
              </p>
            </div>
          </div>

          {/* Reason Selection */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-neutral-300 block">
              {t('Please tell us why you are leaving *', 'कृपया बताएं कि आप खाता क्यों हटाना चाहते हैं *')}
            </label>
            <div className="space-y-1.5">
              {DELETION_REASONS.map(r => (
                <label
                  key={r.id}
                  className={`flex items-center gap-2.5 p-2.5 rounded-xl border text-xs cursor-pointer transition ${
                    selectedReason === r.id
                      ? 'bg-rose-500/15 border-rose-500/40 text-white font-medium'
                      : 'bg-white/[0.03] border-white/[0.06] text-neutral-300 hover:bg-white/[0.06]'
                  }`}
                >
                  <input
                    type="radio"
                    name="deletionReason"
                    value={r.id}
                    checked={selectedReason === r.id}
                    onChange={() => setSelectedReason(r.id)}
                    className="accent-rose-500"
                  />
                  <span>{language === 'hi' ? r.labelHi : r.labelEn}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Optional Additional Feedback */}
          <div>
            <label className="text-xs font-semibold text-neutral-300 block mb-1">
              {t('Additional Comments / Feedback (Optional)', 'अतिरिक्त टिप्पणी / सुझाव (वैकल्पिक)')}
            </label>
            <textarea
              rows={2}
              value={additionalDetails}
              onChange={e => setAdditionalDetails(e.target.value)}
              placeholder={t('Share any details that could help us improve...', 'कोई भी विवरण जो हमें सुधारने में मदद कर सके...')}
              className="w-full rounded-xl bg-neutral-900 border border-neutral-800 p-2.5 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-neutral-600"
            />
          </div>

          {/* Type DELETE confirmation */}
          <div className="p-3 rounded-2xl bg-black/40 border border-white/[0.08] space-y-2">
            <label className="text-xs text-neutral-300 block">
              {t('To confirm deletion, type', 'हटाने की पुष्टि के लिए')} <span className="font-mono font-bold text-rose-400">DELETE</span> {t('below:', 'नीचे लिखें:')}
            </label>
            <input
              type="text"
              value={confirmationInput}
              onChange={e => setConfirmationInput(e.target.value)}
              placeholder="DELETE"
              className="w-full bg-neutral-900 border border-neutral-700 rounded-xl px-3 py-2 text-xs font-mono text-white placeholder-neutral-600 focus:outline-none focus:border-rose-400 tracking-wider font-bold"
            />
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-white/[0.08]">
            <button
              type="button"
              onClick={onClose}
              disabled={isDeleting}
              className="px-4 py-2 rounded-xl bg-white/[0.06] hover:bg-white/[0.1] text-xs font-semibold text-neutral-300 transition"
            >
              {t('Cancel', 'रद्द करें')}
            </button>
            <button
              type="button"
              onClick={handleDelete}
              disabled={!isConfirmed || isDeleting}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                isConfirmed && !isDeleting
                  ? 'bg-rose-600 hover:bg-rose-500 text-white shadow-lg shadow-rose-600/30'
                  : 'bg-neutral-800 text-neutral-500 cursor-not-allowed'
              }`}
            >
              <Trash2 size={13} />
              <span>{isDeleting ? t('Deleting Account...', 'खाता हटाया जा रहा है...') : t('Permanently Delete Account', 'खाता स्थायी रूप से हटाएं')}</span>
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

