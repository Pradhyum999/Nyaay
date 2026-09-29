import React, { useEffect } from 'react';
import { Button } from '../../design/ui/Button';
import { Language, UserRole } from '../../types';
import { CheckCircle2, ArrowRight } from 'lucide-react';

interface SuccessStepProps {
  language: Language;
  role: UserRole;
  userName: string;
  onFinish: () => void;
}

export const SuccessStep: React.FC<SuccessStepProps> = ({
  language,
  role,
  userName,
  onFinish,
}) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onFinish();
    }, 1800);
    return () => clearTimeout(timer);
  }, [onFinish]);

  const firstName = userName ? userName.split(' ')[0] : 'there';

  return (
    <div className="space-y-6 text-center py-6 animate-in fade-in zoom-in-95">
      <div className="w-16 h-16 rounded-full bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center mx-auto text-emerald-400">
        <CheckCircle2 size={36} />
      </div>

      <div className="space-y-2">
        <h2 className="text-xl sm:text-2xl font-bold text-main">
          {language === 'mr'
            ? `स्वागत आहे, ${firstName}! ✨`
            : language === 'hi'
            ? `स्वागत है, ${firstName}! ✨`
            : `You're in, ${firstName}! ✨`}
        </h2>
        <p className="text-xs sm:text-sm text-sub max-w-xs mx-auto leading-relaxed">
          {role === 'lawyer'
            ? (language === 'mr'
                ? 'तुमचे वकील वर्कस्टेशन तयार आहे. आजच्या सुनावण्या किंवा नवीन खटला जोडा.'
                : language === 'hi'
                ? 'आपका अधिवक्ता कार्यस्थल तैयार है। आज की सुनवाई या नया केस जोड़ें।'
                : 'Your advocate workstation is ready. Manage cause lists and add cases.')
            : (language === 'mr'
                ? 'तुमचे नागरिक खाते तयार आहे. कायदेशीर समस्या सांगा आणि मार्गदर्शन मिळवा.'
                : language === 'hi'
                ? 'आपका नागरिक खाता तैयार है। कानूनी समस्या बताएं और तुरंत सहायता पाएं।'
                : 'Your citizen account is ready. Describe your issue to find immediate guidance.')}
        </p>
      </div>

      <div className="pt-2">
        <Button
          variant="primary"
          size="md"
          onClick={onFinish}
          className="w-full h-12"
          icon={<ArrowRight size={16} />}
        >
          {language === 'mr' ? 'सुरू करा' : language === 'hi' ? 'जारी रखें' : 'Continue'}
        </Button>
      </div>
    </div>
  );
};
