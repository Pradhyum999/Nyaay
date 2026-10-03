import React, { useState } from 'react';
import { Card } from '../../design/ui/Card';
import { Button } from '../../design/ui/Button';
import { Language } from '../../types';
import { Globe, ArrowRight } from 'lucide-react';

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
  const [selectedLang, setSelectedLang] = useState<Language>(currentLanguage);

  const languages: Array<{ code: Language; label: string; sub: string }> = [
    { code: 'en', label: 'English', sub: 'Continue in English' },
    { code: 'hi', label: 'हिन्दी', sub: 'हिन्दी में जारी रखें' },
    { code: 'mr', label: 'मराठी', sub: 'मराठी भाषेत सुरू ठेवा' },
  ];

  const handleChoose = (code: Language) => {
    setSelectedLang(code);
    onSelectLanguage(code);
    try {
      localStorage.setItem('nyaay_language', code);
    } catch {}
  };

  const handleContinue = () => {
    onSelectLanguage(selectedLang);
    try {
      localStorage.setItem('nyaay_language', selectedLang);
    } catch {}
    onNext();
  };

  return (
    <div className="space-y-6 animate-in fade-in">
      <div className="text-center space-y-2">
        <div className="w-12 h-12 rounded-2xl bg-amber-400/10 border border-amber-400/20 flex items-center justify-center mx-auto text-amber-300">
          <Globe size={24} />
        </div>
        <h2 className="text-lg sm:text-xl font-bold text-main">Choose Language / भाषा निवडा</h2>
        <p className="text-xs text-sub">Select your preferred language for judicial assistance</p>
      </div>

      <div className="space-y-3">
        {languages.map(l => {
          const isSelected = selectedLang === l.code;
          return (
            <Card
              key={l.code}
              interactive
              onClick={() => handleChoose(l.code)}
              className={`flex items-center justify-between p-4 transition-all ios-press cursor-pointer ${
                isSelected
                  ? 'border-amber-400 bg-amber-400/10 shadow-sm'
                  : 'hover:border-white/20'
              }`}
            >
              <div className="flex items-center gap-3.5">
                <input
                  type="radio"
                  id={`lang-${l.code}`}
                  name="language-select"
                  value={l.code}
                  checked={isSelected}
                  onChange={() => handleChoose(l.code)}
                  className="w-4 h-4 text-amber-500 bg-black/40 border-white/20 focus:ring-amber-400 focus:ring-offset-0 cursor-pointer accent-amber-400"
                />
                <div>
                  <h3 className="text-base font-bold text-main">{l.label}</h3>
                  <p className="text-xs text-sub mt-0.5">{l.sub}</p>
                </div>
              </div>
              {isSelected && (
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-amber-400/20 text-amber-300 border border-amber-400/30">
                  Selected
                </span>
              )}
            </Card>
          );
        })}
      </div>

      <Button
        variant="primary"
        onClick={handleContinue}
        className="w-full py-3.5 text-sm font-semibold rounded-2xl flex items-center justify-center gap-2 shadow-lg shadow-amber-500/10"
      >
        <span>Continue</span>
        <ArrowRight size={18} />
      </Button>
    </div>
  );
};
