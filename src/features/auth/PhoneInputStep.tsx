import React, { useState } from 'react';
import { Button } from '../../design/ui/Button';
import { Language } from '../../types';
import { ArrowLeft, Phone, Loader2 } from 'lucide-react';

interface PhoneInputStepProps {
  language: Language;
  onSendOtp: (cleanPhone: string) => Promise<void>;
  onBack: () => void;
  loading: boolean;
  error?: string;
}

export const PhoneInputStep: React.FC<PhoneInputStepProps> = ({
  language,
  onSendOtp,
  onBack,
  loading,
  error: externalError,
}) => {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [localError, setLocalError] = useState('');

  const handlePhoneChange = (val: string) => {
    // Strip non-digits
    const digitsOnly = val.replace(/\D/g, '');
    // Take max 10 digits
    const cleaned = digitsOnly.slice(0, 10);
    setPhoneNumber(cleaned);

    if (cleaned.length === 10 && !/^[6-9]/.test(cleaned)) {
      setLocalError(
        language === 'mr'
          ? 'भारतीय मोबाईल क्रमांक ६, ७, ८ किंवा ९ ने सुरू झाला पाहिजे'
          : language === 'hi'
          ? 'भारतीय मोबाइल नंबर 6, 7, 8 या 9 से शुरू होना चाहिए'
          : 'Indian mobile numbers must start with 6, 7, 8, or 9'
      );
    } else {
      setLocalError('');
    }
  };

  const isValid = phoneNumber.length === 10 && /^[6-9]\d{9}$/.test(phoneNumber);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValid || loading) return;
    await onSendOtp(`+91${phoneNumber}`);
  };

  return (
    <div className="space-y-5 animate-in fade-in">
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={onBack}
          className="text-xs text-sub hover:text-main flex items-center gap-1 transition"
        >
          <ArrowLeft size={14} />
          <span>{language === 'mr' ? 'मागे' : language === 'hi' ? 'पीछे' : 'Back'}</span>
        </button>
      </div>

      <div className="text-center space-y-1.5">
        <div className="w-11 h-11 rounded-2xl bg-amber-400/10 border border-amber-400/20 flex items-center justify-center mx-auto text-amber-300">
          <Phone size={20} />
        </div>
        <h2 className="text-lg sm:text-xl font-bold text-main">
          {language === 'mr'
            ? 'आपला मोबाईल नंबर प्रविष्ट करा'
            : language === 'hi'
            ? 'अपना मोबाइल नंबर दर्ज करें'
            : 'Enter Your Phone Number'}
        </h2>
        <p className="text-xs text-sub">
          {language === 'mr'
            ? 'आम्ही एसएमएस द्वारे एक ६-अंकी पडताळणी कोड पाठवू'
            : language === 'hi'
            ? 'हम एसएमएस द्वारा 6-अंकों का सत्यापन कोड भेजेंगे'
            : 'We will send a 6-digit verification code via SMS'}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4 pt-2">
        <div>
          <label className="text-xs font-semibold text-sub block mb-1.5 font-mono">
            {language === 'mr' ? 'मोबाईल नंबर' : language === 'hi' ? 'मोबाइल नंबर' : 'Mobile Number'}
          </label>
          <div className="flex items-center rounded-2xl bg-white/[0.05] border border-white/[0.1] focus-within:border-amber-400/60 overflow-hidden px-3.5 h-12">
            <span className="text-sm font-bold text-main font-mono mr-2 select-none border-r border-white/[0.1] pr-2.5">
              +91
            </span>
            <input
              type="tel"
              inputMode="numeric"
              autoFocus
              value={phoneNumber}
              onChange={e => handlePhoneChange(e.target.value)}
              placeholder="98765 43210"
              className="flex-1 bg-transparent text-sm sm:text-base text-main placeholder:text-faint outline-none font-mono tracking-wider"
            />
          </div>

          {(localError || externalError) && (
            <p className="text-xs text-red-400 mt-1.5 px-1 font-medium">
              {localError || externalError}
            </p>
          )}
        </div>

        {/* Div for invisible reCAPTCHA */}
        <div id="recaptcha-container" />

        <Button
          type="submit"
          variant="primary"
          size="md"
          disabled={!isValid || loading}
          className="w-full h-12"
          icon={loading ? <Loader2 size={16} className="animate-spin" /> : undefined}
        >
          {loading
            ? (language === 'mr' ? 'कोड पाठवत आहे...' : language === 'hi' ? 'कोड भेज रहे हैं...' : 'Sending Code…')
            : (language === 'mr' ? 'ओटीपी पाठवा' : language === 'hi' ? 'ओटीपी भेजें' : 'Send OTP')}
        </Button>
      </form>
    </div>
  );
};
