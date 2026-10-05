import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldCheck, Lock, Key, X, AlertCircle, CheckCircle2, ArrowRight } from 'lucide-react';
import { Language } from '../../types';
import { auth } from '../../lib/firebase';

const AUTHORIZED_ADMIN_EMAIL = 'Pradhumb1998@gmail.com';
const MASTER_ADMIN_PASSKEYS = ['nyaay1998', 'Pradhumb1998', 'pradhumb1998', 'admin1998', 'nyaay-admin-2026'];

interface AdminSecurityGateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAuthenticated: () => void;
  language?: Language;
}

export const AdminSecurityGateModal: React.FC<AdminSecurityGateModalProps> = ({
  isOpen,
  onClose,
  onAuthenticated,
  language = 'en',
}) => {
  const [passkey, setPasskey] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [rememberSession, setRememberSession] = useState(true);

  if (!isOpen) return null;

  const currentEmail = auth.currentUser?.email || '';
  const isEmailMatch = currentEmail.toLowerCase() === AUTHORIZED_ADMIN_EMAIL.toLowerCase();

  const handleVerify = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setError(null);

    const cleanInput = passkey.trim();
    if (!cleanInput && !isEmailMatch) {
      setError('Please enter the Admin Security Passkey.');
      return;
    }

    if (isEmailMatch || MASTER_ADMIN_PASSKEYS.includes(cleanInput)) {
      if (rememberSession) {
        sessionStorage.setItem('nyaay_admin_portal_authenticated', 'true');
        localStorage.setItem('nyaay_admin_portal_authenticated', 'true');
      } else {
        sessionStorage.setItem('nyaay_admin_portal_authenticated', 'true');
      }
      onAuthenticated();
    } else {
      setError('Invalid Admin Security Passkey. Access Denied.');
    }
  };

  const handleDirectEmailUnlock = () => {
    sessionStorage.setItem('nyaay_admin_portal_authenticated', 'true');
    onAuthenticated();
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-2xl flex items-center justify-center p-4 animate-in fade-in">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          className="w-full max-w-md bg-[#0F1015] border border-amber-500/30 rounded-3xl p-6 sm:p-7 shadow-2xl text-white space-y-5"
        >
          {/* Header */}
          <div className="flex items-start justify-between border-b border-white/[0.08] pb-4">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-amber-400 text-black flex items-center justify-center font-bold shadow-lg shadow-amber-400/20">
                <ShieldCheck size={22} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-bold text-white tracking-tight">Admin Portal Gate</h3>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-400/20 text-amber-300 font-mono font-semibold">
                    RESTRICTED
                  </span>
                </div>
                <p className="text-xs text-neutral-400 mt-0.5">
                  Private Administration & Audit Console
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-white/[0.06] hover:bg-white/[0.12] flex items-center justify-center text-neutral-400 hover:text-white transition ios-press"
              title="Return to App"
            >
              <X size={15} />
            </button>
          </div>

          {/* Authorized Admin Notice */}
          <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 space-y-1 text-xs">
            <div className="flex items-center justify-between text-neutral-300">
              <span className="text-neutral-400">Designated Admin:</span>
              <span className="font-mono font-bold text-amber-300">{AUTHORIZED_ADMIN_EMAIL}</span>
            </div>
            {currentEmail && (
              <div className="flex items-center justify-between text-[11px] pt-1 border-t border-amber-500/20">
                <span className="text-neutral-400">Logged in as:</span>
                <span className={`font-mono font-semibold ${isEmailMatch ? 'text-emerald-400' : 'text-neutral-300'}`}>
                  {currentEmail} {isEmailMatch && '✓ Verified Admin'}
                </span>
              </div>
            )}
          </div>

          {/* Quick email bypass if already signed in with admin email */}
          {isEmailMatch ? (
            <div className="space-y-3">
              <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center gap-2 text-xs text-emerald-300">
                <CheckCircle2 size={16} className="text-emerald-400 shrink-0" />
                <span>You are signed in with the authorized Admin email account.</span>
              </div>
              <button
                type="button"
                onClick={handleDirectEmailUnlock}
                className="w-full py-3 rounded-2xl bg-amber-400 hover:bg-amber-300 text-black font-bold text-xs flex items-center justify-center gap-2 transition ios-press shadow-lg shadow-amber-400/20"
              >
                <span>Enter Admin Console Directly</span>
                <ArrowRight size={15} />
              </button>
            </div>
          ) : (
            <form onSubmit={handleVerify} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-neutral-300 block mb-1.5 flex items-center gap-1.5">
                  <Key size={14} className="text-amber-400" />
                  <span>Enter Admin Passkey</span>
                </label>
                <div className="relative">
                  <input
                    type="password"
                    autoFocus
                    required
                    value={passkey}
                    onChange={(e) => setPasskey(e.target.value)}
                    placeholder="Enter security key..."
                    className="w-full bg-black/80 border border-white/[0.12] rounded-2xl px-3.5 py-2.5 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-amber-400 font-mono tracking-wider"
                  />
                  <Lock size={14} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-neutral-500 pointer-events-none" />
                </div>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="rememberAdmin"
                  checked={rememberSession}
                  onChange={(e) => setRememberSession(e.target.checked)}
                  className="rounded border-white/20 bg-neutral-800 text-amber-400 focus:ring-0"
                />
                <label htmlFor="rememberAdmin" className="text-[11px] text-neutral-400 cursor-pointer select-none">
                  Keep Admin Console authenticated on this browser
                </label>
              </div>

              {error && (
                <div className="p-2.5 rounded-xl bg-red-500/10 border border-red-500/30 flex items-center gap-2 text-xs text-red-400 animate-in fade-in">
                  <AlertCircle size={14} className="shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <div className="flex items-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 py-2.5 rounded-2xl bg-white/[0.05] hover:bg-white/[0.1] border border-white/10 text-xs font-semibold text-neutral-300 transition"
                >
                  Cancel / Return
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-2xl bg-amber-400 hover:bg-amber-300 text-black font-bold text-xs flex items-center justify-center gap-1.5 transition ios-press shadow-lg shadow-amber-400/20"
                >
                  <Lock size={13} />
                  <span>Unlock Console</span>
                </button>
              </div>
            </form>
          )}

          {/* Secure Link Explanation */}
          <p className="text-[10px] text-neutral-500 text-center font-mono pt-1">
            Private Admin URL: <span className="text-neutral-400">?admin=portal</span> • Not shown in public app navigation
          </p>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
