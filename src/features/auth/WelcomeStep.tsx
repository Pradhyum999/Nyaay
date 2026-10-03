import React from 'react';
import { Button } from '../../design/ui/Button';
import { Language, UserRole } from '../../types';
import { CheckCircle2, ArrowRight, ShieldCheck, Scale, Sparkles } from 'lucide-react';

interface WelcomeStepProps {
  language: Language;
  role: UserRole;
  userName: string;
  onFinish: () => void;
}

export const WelcomeStep: React.FC<WelcomeStepProps> = ({
  language,
  role,
  userName,
  onFinish,
}) => {
  const getGreetingName = () => {
    if (!userName || !userName.trim()) return role === 'lawyer' ? 'Advocate' : 'Citizen';
    const trimmed = userName.trim();
    if (role === 'lawyer') {
      const clean = trimmed.replace(/^adv\.?\s*/i, '').replace(/^advocate\s+/i, '').trim();
      return `Adv. ${clean || 'Advocate'}`;
    }
    return trimmed.split(' ')[0] || 'there';
  };

  const displayName = getGreetingName();

  return (
    <div className="space-y-6 text-center py-6 animate-in fade-in zoom-in-95">
      <div className="relative w-20 h-20 mx-auto">
        <div className="w-20 h-20 rounded-3xl bg-amber-400/10 border border-amber-400/30 flex items-center justify-center text-amber-400 shadow-xl shadow-amber-500/10">
          <Scale size={40} />
        </div>
        <div className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-emerald-500 border-2 border-black flex items-center justify-center text-black">
          <CheckCircle2 size={16} strokeWidth={3} />
        </div>
      </div>

      <div className="space-y-2.5">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs font-semibold">
          <Sparkles size={13} />
          <span>Setup Completed Successfully</span>
        </div>

        <h2 className="text-2xl sm:text-3xl font-extrabold text-main">
          {language === 'mr'
            ? `Welcome to न्यायनीती, ${displayName}!`
            : language === 'hi'
            ? `Welcome to न्यायनीति, ${displayName}!`
            : `Welcome to NYAAYNEETI, ${displayName}!`}
        </h2>

        <p className="text-xs sm:text-sm text-sub max-w-sm mx-auto leading-relaxed">
          {role === 'lawyer'
            ? (language === 'mr'
                ? 'तुमचे वकील वर्कस्टेशन सक्रिय झाले आहे. खटल्यांचे व्यवस्थापन, कॉज लिस्ट आणि डिजिटल कोर्ट डायरी वापरण्यासाठी सज्ज आहात.'
                : language === 'hi'
                ? 'आपका अधिवक्ता वर्कस्टेशन सक्रिय हो गया है। केस प्रबंधन, कॉज लिस्ट और डिजिटल कोर्ट डायरी का उपयोग करने के लिए तैयार हैं।'
                : 'Your advocate workstation is ready. Manage cause lists, court diaries, billing, and client cases with ease.')
            : (language === 'mr'
                ? 'तुमचे नागरिक खाते सक्रिय झाले आहे. कायदेशीर समस्या नोंदवा आणि योग्य वकीलांशी संपर्क साधा.'
                : language === 'hi'
                ? 'आपका नागरिक खाता सक्रिय हो गया है। कानूनी समस्या दर्ज करें और सत्यापित वकीलों से जुड़ें।'
                : 'Your citizen portal is active. Describe legal matters, manage case documents, and connect with verified advocates.')}
        </p>
      </div>

      <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/[0.08] text-left text-xs space-y-2 max-w-sm mx-auto">
        <div className="flex items-center gap-2 text-amber-300 font-semibold">
          <ShieldCheck size={16} />
          <span>Verified & Secure Justice Tech Platform</span>
        </div>
        <p className="text-faint text-[11px] leading-relaxed">
          {role === 'lawyer'
            ? 'Fully compliant with Bar Council rules and Indian judicial guidelines.'
            : 'Encrypted communication and verified advocate credentials for legal support.'}
        </p>
      </div>

      <div className="pt-2 max-w-sm mx-auto">
        <Button
          variant="primary"
          size="md"
          onClick={onFinish}
          className="w-full h-12 rounded-2xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20"
        >
          <span>Get Started / Continue</span>
          <ArrowRight size={18} />
        </Button>
      </div>
    </div>
  );
};
