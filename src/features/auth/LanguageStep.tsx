import React from 'react';
import { Card } from '../../design/ui/Card';
import { Language } from '../../types';
import { Globe, ChevronRight } from 'lucide-react';

interface LanguageStepProps {
  currentLanguage: Language;
  onSelectLanguage: (lang: Language) => void;
  onNext: () => void;
}

export const LanguageStep: React.FC<LanguageStepProps> = ({
  currentLanguage,
  onSelectLanguage,
  onNext,
}) => {
  const languages: Array<{ code: Language; label: string; sub: string }> = [
    { code: 'en', label: 'English', sub: 'Continue in English' },
    { code: 'hi', label: 'हिन्दी', sub: 'हिन्दी में जारी रखें' },
    { code: 'mr', label: 'मराठी', sub: 'मराठी भाषेत सुरू ठेवा' },
  ];

  const handleSelect = (code: Language) => {
    onSelectLanguage(code);
    try {
      localStorage.setItem('nyaay_language', code);
    } catch {}
    onNext();
  };

  return (
    <div className="space-y-5 animate-in fade-in">
      <div className="text-center space-y-1.5">
        <div className="w-12 h-12 rounded-2xl bg-amber-400/10 border border-amber-400/20 flex items-center justify-center mx-auto text-amber-300">
          <Globe size={24} />
        </div>
        <h2 className="text-lg sm:text-xl font-bold text-main">Choose Language / भाषा निवडा</h2>
        <p className="text-xs text-sub">Select your preferred language for judicial assistance</p>
      </div>

      <div className="space-y-2.5">
        {languages.map(l => (
          <Card
            key={l.code}
            interactive
            onClick={() => handleSelect(l.code)}
            className={`flex items-center justify-between p-4 transition-all ios-press ${
              currentLanguage === l.code
                ? 'border-amber-400 bg-amber-400/10 shadow-sm'
                : 'hover:border-white/20'
            }`}
          >
            <div>
              <h3 className="text-base font-bold text-main">{l.label}</h3>
              <p className="text-xs text-sub mt-0.5">{l.sub}</p>
            </div>
            <ChevronRight
              size={18}
              className={currentLanguage === l.code ? 'text-amber-400' : 'text-faint'}
            />
          </Card>
        ))}
      </div>
    </div>
  );
};
