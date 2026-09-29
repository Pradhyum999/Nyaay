import React, { useState, useEffect, useRef } from 'react';
import { Button } from '../../design/ui/Button';
import { Language } from '../../types';
import { ArrowLeft, KeyRound, Loader2 } from 'lucide-react';

interface OtpStepProps {
  language: Language;
  phone: string;
  onVerifyOtp: (otpString: string) => Promise<void>;
  onResendOtp: () => Promise<void>;
  onChangePhone: () => void;
  loading: boolean;
  error?: string;
}

export const OtpStep: React.FC<OtpStepProps> = ({
  language,
  phone,
  onVerifyOtp,
  onResendOtp,
  onChangePhone,
  loading,
  error,
}) => {
  const [digits, setDigits] = useState(['', '', '', '', '', '']);
  const [timer, setTimer] = useState(30);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (timer <= 0) return;
    const interval = setInterval(() => setTimer(t => t - 1), 1000);
    return () => clearInterval(interval);
  }, [timer]);

  const handleChange = (index: number, val: string) => {
    // Check if pasting multiple digits
    const digitsOnly = val.replace(/\D/g, '');
    if (digitsOnly.length > 1) {
      const next = [...digits];
      for (let i = 0; i < 6; i++) {
        if (digitsOnly[i]) next[i] = digitsOnly[i];
      }
      setDigits(next);
      const nextFocus = Math.min(digitsOnly.length, 5);
      inputRefs.current[nextFocus]?.focus();
      if (digitsOnly.length >= 6) {
        onVerifyOtp(digitsOnly.slice(0, 6));
      }
      return;
    }

    const next = [...digits];
    next[index] = digitsOnly.slice(-1);
    setDigits(next);

    // Auto-advance
    if (digitsOnly && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    // Auto-submit when all 6 filled
    if (next.every(d => d.length === 1)) {
      onVerifyOtp(next.join(''));
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !digits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleResend = async () => {
    if (timer > 0 || loading) return;
    await onResendOtp();
    setTimer(30);
  };

  const isComplete = digits.every(d => d.length === 1);

  return (
    <div className="space-y-5 animate-in fade-in">
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={onChangePhone}
          className="text-xs text-sub hover:text-main flex items-center gap-1 transition"
        >
          <ArrowLeft size={14} />
          <span>{language === 'mr' ? 'नंबर बदला' : language === 'hi' ? 'नंबर बदलें' : 'Change Number'}</span>
        </button>
      </div>

      <div className="text-center space-y-1.5">
        <div className="w-11 h-11 rounded-2xl bg-amber-400/10 border border-amber-400/20 flex items-center justify-center mx-auto text-amber-300">
          <KeyRound size={20} />
        </div>
        <h2 className="text-lg sm:text-xl font-bold text-main">
          {language === 'mr' ? '६-अंकी कोड प्रविष्ट करा' : language === 'hi' ? '6-अंकों का कोड दर्ज करें' : 'Enter 6-Digit Code'}
        </h2>
        <p className="text-xs text-sub">
          {language === 'mr' ? 'कोड पाठवला:' : language === 'hi' ? 'कोड भेजा गया:' : 'Sent to:'}{' '}
          <span className="font-mono font-bold text-main">{phone}</span>
        </p>
      </div>

      <div className="space-y-4 pt-2">
        {/* 6 Digit Boxes */}
        <div className="flex justify-between gap-1.5 sm:gap-2">
          {digits.map((digit, i) => (
            <input
              key={i}
              ref={el => { inputRefs.current[i] = el; }}
              type="text"
              inputMode="numeric"
              maxLength={6}
              value={digit}
              autoFocus={i === 0}
              onChange={e => handleChange(i, e.target.value)}
              onKeyDown={e => handleKeyDown(i, e)}
              className="w-12 h-14 text-center text-lg sm:text-xl font-bold font-mono rounded-2xl bg-white/[0.05] border border-white/[0.12] text-main focus:border-amber-400 focus:bg-amber-400/5 outline-none transition"
            />
          ))}
        </div>

        {error && (
          <p className="text-xs text-red-400 text-center font-medium">
            {error}
          </p>
        )}

        <Button
          type="button"
          variant="primary"
          size="md"
          disabled={!isComplete || loading}
          onClick={() => onVerifyOtp(digits.join(''))}
          className="w-full h-12"
          icon={loading ? <Loader2 size={16} className="animate-spin" /> : undefined}
        >
          {loading
            ? (language === 'mr' ? 'पडताळणी करत आहे...' : language === 'hi' ? 'सत्यापित कर रहे हैं...' : 'Verifying…')
            : (language === 'mr' ? 'सत्यापित करा व पुढे जा' : language === 'hi' ? 'सत्यापित करें और आगे बढ़ें' : 'Verify & Continue')}
        </Button>

        <div className="text-center pt-2">
          {timer > 0 ? (
            <span className="text-xs text-faint font-mono">
              {language === 'mr' ? `पुन्हा कोड पाठवा: 0:${timer < 10 ? `0${timer}` : timer}` : language === 'hi' ? `पुनः भेजें: 0:${timer < 10 ? `0${timer}` : timer}` : `Resend code in 0:${timer < 10 ? `0${timer}` : timer}`}
            </span>
          ) : (
            <button
              type="button"
              onClick={handleResend}
              disabled={loading}
              className="text-xs text-amber-400 hover:underline font-semibold"
            >
              {language === 'mr' ? 'कोड पुन्हा पाठवा' : language === 'hi' ? 'कोड पुनः भेजें' : 'Resend Code'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
