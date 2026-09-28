import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Key, Eye, EyeOff, CheckCircle2, AlertCircle, Lock, ShieldCheck } from 'lucide-react';
import { Language } from '../../types';

interface MemberPasswordChangeProps {
  memberName: string;
  memberEmail: string;
  firmName?: string;
  language: Language;
  onPasswordChanged: (newPassword: string) => Promise<void>;
}

export const MemberPasswordChange: React.FC<MemberPasswordChangeProps> = ({
  memberName,
  memberEmail,
  firmName,
  language,
  onPasswordChanged,
}) => {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const t = (en: string, hi: string, mr?: string) =>
    language === 'mr' && mr ? mr : language === 'hi' ? hi : en;

  const hasLength = newPassword.length >= 8;
  const hasUpper = /[A-Z]/.test(newPassword);
  const hasNumber = /[0-9]/.test(newPassword);
  const isMatch = newPassword === confirmPassword && newPassword.length > 0;
  const isStrong = hasLength && hasUpper && hasNumber && isMatch;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isStrong) {
      setError(t('Please satisfy all password security requirements.', 'कृपया सभी पासवर्ड सुरक्षा शर्तें पूरी करें।', 'कृपया सर्व सुरक्षा अटी पूर्ण करा.'));
      return;
    }

    setIsSubmitting(true);
    setError(null);
    try {
      await onPasswordChanged(newPassword);
    } catch (err: any) {
      setError(err?.message || 'Failed to update password. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="w-full max-w-sm glass-panel bg-[#0E0F14] border border-violet-500/30 rounded-3xl p-6 shadow-2xl space-y-5 text-white"
      >
        {/* Header Icon */}
        <div className="text-center space-y-2">
          <div className="w-14 h-14 rounded-2xl bg-violet-500/20 border border-violet-500/30 flex items-center justify-center text-violet-300 mx-auto shadow-lg shadow-violet-500/10">
            <Lock size={26} />
          </div>
          <h2 className="text-lg font-bold text-white tracking-tight">
            {t('First-Time Login: Set Password', 'प्रथम लॉगिन: नया पासवर्ड सेट करें', 'प्रथम लॉगिन: पासवर्ड सेट करा')}
          </h2>
          <p className="text-xs text-neutral-400">
            {t('Welcome,', 'स्वागत है,', 'स्वागत आहे,')} <span className="text-white font-semibold">{memberName}</span>.
            {firmName && (
              <> {t('You have been enrolled in', 'आप', 'आपण')} <span className="text-violet-300 font-semibold">{firmName}</span>.</>
            )}
            <br />
            <span className="text-amber-300 font-mono text-[11px]">
              {t('You must set a permanent password before accessing cases.', 'प्रणाली में प्रवेश से पहले नया पासवर्ड अनिवार्य है।', 'प्रणालीमध्ये प्रवेश करण्यासाठी नवीन पासवर्ड अनिवार्य आहे.')}
            </span>
          </p>
        </div>

        {error && (
          <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs text-rose-300 flex items-center gap-2">
            <AlertCircle size={14} className="shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3.5">
          <div>
            <label className="text-[11px] font-medium text-neutral-400 block mb-1">
              {t('New Password *', 'नया पासवर्ड *', 'नवीन पासवर्ड *')}
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Min. 8 characters"
                className="w-full bg-black/80 border border-white/[0.1] rounded-xl px-3 py-2 text-xs text-white placeholder-neutral-600 focus:outline-none focus:border-violet-400/50 pr-9"
              />
              <button
                type="button"
                onClick={() => setShowPassword(v => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-white"
              >
                {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
            </div>
          </div>

          <div>
            <label className="text-[11px] font-medium text-neutral-400 block mb-1">
              {t('Confirm Password *', 'पासवर्ड की पुष्टि करें *', 'पासवर्डची पुष्टी करा *')}
            </label>
            <input
              type={showPassword ? 'text' : 'password'}
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Re-enter new password"
              className="w-full bg-black/80 border border-white/[0.1] rounded-xl px-3 py-2 text-xs text-white placeholder-neutral-600 focus:outline-none focus:border-violet-400/50"
            />
          </div>

          {/* Validation Checklist */}
          <div className="space-y-1 bg-white/[0.02] border border-white/[0.04] p-3 rounded-xl text-[10px]">
            <div className="flex items-center gap-1.5">
              <CheckCircle2 size={12} className={hasLength ? 'text-emerald-400' : 'text-neutral-600'} />
              <span className={hasLength ? 'text-neutral-300' : 'text-neutral-500'}>At least 8 characters</span>
            </div>
            <div className="flex items-center gap-1.5">
              <CheckCircle2 size={12} className={hasUpper ? 'text-emerald-400' : 'text-neutral-600'} />
              <span className={hasUpper ? 'text-neutral-300' : 'text-neutral-500'}>At least one uppercase letter (A-Z)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <CheckCircle2 size={12} className={hasNumber ? 'text-emerald-400' : 'text-neutral-600'} />
              <span className={hasNumber ? 'text-neutral-300' : 'text-neutral-500'}>At least one numeric digit (0-9)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <CheckCircle2 size={12} className={isMatch ? 'text-emerald-400' : 'text-neutral-600'} />
              <span className={isMatch ? 'text-neutral-300' : 'text-neutral-500'}>Passwords match</span>
            </div>
          </div>

          <button
            type="submit"
            disabled={!isStrong || isSubmitting}
            className="w-full py-3 rounded-2xl bg-violet-500 hover:bg-violet-400 text-white font-bold text-xs flex items-center justify-center gap-2 transition ios-press shadow-xl shadow-violet-500/25 disabled:opacity-40"
          >
            <ShieldCheck size={14} />
            <span>{isSubmitting ? 'Updating...' : t('Save Password & Enter App', 'पासवर्ड सहेजें और आगे बढ़ें', 'पासवर्ड जतन करा व पुढे जा')}</span>
          </button>
        </form>
      </motion.div>
    </div>
  );
};
