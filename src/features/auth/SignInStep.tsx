import React from 'react';
import { Button } from '../../design/ui/Button';
import { Language, UserRole } from '../../types';
import { Phone, ArrowLeft, Shield } from 'lucide-react';

interface SignInStepProps {
  language: Language;
  selectedRole: UserRole;
  onGoogleSignIn: () => void;
  onPhoneSignIn: () => void;
  onBack: () => void;
  loading: boolean;
  error?: string;
}

export const SignInStep: React.FC<SignInStepProps> = ({
  language,
  selectedRole,
  onGoogleSignIn,
  onPhoneSignIn,
  onBack,
  loading,
  error,
}) => {
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
        <span className="text-[11px] font-mono text-amber-400 uppercase font-semibold">
          {selectedRole === 'lawyer'
            ? (language === 'mr' ? 'वकील प्रवेश' : language === 'hi' ? 'अधिवक्ता प्रवेश' : 'Advocate Portal')
            : (language === 'mr' ? 'नागरिक प्रवेश' : language === 'hi' ? 'नागरिक प्रवेश' : 'Citizen Portal')}
        </span>
      </div>

      <div className="text-center space-y-1.5">
        <h2 className="text-lg sm:text-xl font-bold text-main">
          {language === 'mr'
            ? 'साइन इन किंवा नोंदणी करा'
            : language === 'hi'
            ? 'साइन इन या पंजीकरण करें'
            : 'Sign In or Create Account'}
        </h2>
        <p className="text-xs text-sub">
          {language === 'mr'
            ? 'आपल्या कायदेशीर डेटासाठी सुरक्षित प्रमाणीकरण'
            : language === 'hi'
            ? 'अपने कानूनी रिकॉर्ड के लिए सुरक्षित प्रमाणीकरण'
            : 'Secure authentication for your legal workspace'}
        </p>
      </div>

      {error && (
        <div className="p-3 rounded-2xl bg-red-500/10 border border-red-500/20 text-xs text-red-400">
          {error}
        </div>
      )}

      <div className="space-y-3 pt-2">
        {/* Google Sign In */}
        <button
          type="button"
          onClick={onGoogleSignIn}
          disabled={loading}
          className="w-full h-12 rounded-2xl bg-white text-black font-semibold text-sm flex items-center justify-center gap-3 shadow-md hover:bg-neutral-100 transition ios-press disabled:opacity-50"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.8-2.4 3.66v3.05h3.87c2.26-2.09 3.67-5.17 3.67-9.15z"
            />
            <path
              fill="#34A853"
              d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.87-3.05c-1.08.72-2.45 1.16-4.06 1.16-3.13 0-5.78-2.11-6.73-4.96H1.28v3.15C3.26 21.36 7.35 24 12 24z"
            />
            <path
              fill="#FBBC05"
              d="M5.27 14.24A7.17 7.17 0 0 1 4.89 12c0-.78.14-1.53.38-2.24V6.61H1.28A11.96 11.96 0 0 0 0 12c0 1.92.45 3.74 1.28 5.39l3.99-3.15z"
            />
            <path
              fill="#EA4335"
              d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.35 0 3.26 2.64 1.28 6.61l3.99 3.15c.95-2.85 3.6-4.96 6.73-4.96z"
            />
          </svg>
          <span>
            {language === 'mr'
              ? 'Google सह पुढे जा'
              : language === 'hi'
              ? 'Google के साथ जारी रखें'
              : 'Continue with Google'}
          </span>
        </button>

        <div className="flex items-center gap-3 py-1">
          <div className="flex-1 h-px bg-white/[0.08]" />
          <span className="text-[11px] text-faint uppercase font-mono">
            {language === 'mr' ? 'किंवा' : language === 'hi' ? 'अथवा' : 'or'}
          </span>
          <div className="flex-1 h-px bg-white/[0.08]" />
        </div>

        {/* Phone Sign In */}
        <button
          type="button"
          onClick={onPhoneSignIn}
          disabled={loading}
          className="w-full h-12 rounded-2xl bg-white/[0.05] border border-white/[0.1] text-main font-semibold text-sm flex items-center justify-center gap-2 hover:bg-white/[0.08] transition ios-press disabled:opacity-50"
        >
          <Phone size={16} className="text-amber-400" />
          <span>
            {language === 'mr'
              ? 'मोबाईल नंबर द्वारे सुरू करा'
              : language === 'hi'
              ? 'फ़ोन नंबर से जारी रखें'
              : 'Continue with Phone'}
          </span>
        </button>
      </div>

      <div className="pt-4 text-center">
        <p className="text-[11px] text-faint flex items-center justify-center gap-1.5">
          <Shield size={12} className="text-emerald-400 shrink-0" />
          <span>
            {language === 'mr'
              ? 'कायदेशीर गोपनीयता व डीपीएचपी कायदा २०२३ अंतर्गत संरक्षित'
              : language === 'hi'
              ? 'गोपनीयता एवं डीपीएचपी अधिनियम २०२३ के तहत सुरक्षित'
              : 'Protected by Indian legal privilege & DPDP Act 2023'}
          </span>
        </p>
      </div>
    </div>
  );
};
