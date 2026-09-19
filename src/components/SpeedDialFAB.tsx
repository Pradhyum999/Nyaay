import React, { useState } from 'react';
import { Plus, X, CalendarPlus, Receipt, UploadCloud, Sparkles } from 'lucide-react';
import { translations } from '../i18n/translations';
import { Language } from '../types';

interface SpeedDialFABProps {
  language: Language;
  onAction: (actionType: 'addHearing' | 'newInvoice' | 'uploadDoc' | 'aiConsult') => void;
}

export const SpeedDialFAB: React.FC<SpeedDialFABProps> = ({ language, onAction }) => {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const t = translations[language];

  const handleSelect = (actionType: 'addHearing' | 'newInvoice' | 'uploadDoc' | 'aiConsult') => {
    setIsOpen(false);
    onAction(actionType);
  };

  return (
    <div className="fixed bottom-20 right-5 z-30 flex flex-col items-end gap-2.5">
      {/* Speed Dial Menu items */}
      {isOpen && (
        <div className="flex flex-col items-end gap-2 mb-1 animate-in fade-in slide-in-from-bottom-3 duration-200">
          <button
            onClick={() => handleSelect('addHearing')}
            className="flex items-center gap-2.5 px-3.5 py-2 rounded-2xl glass-panel text-white shadow-2xl ios-press"
          >
            <span className="text-xs font-semibold">{t.fabAddHearing}</span>
            <div className="w-7 h-7 rounded-xl bg-white/[0.08] flex items-center justify-center">
              <CalendarPlus size={14} className="text-white" />
            </div>
          </button>

          <button
            onClick={() => handleSelect('newInvoice')}
            className="flex items-center gap-2.5 px-3.5 py-2 rounded-2xl glass-panel text-white shadow-2xl ios-press"
          >
            <span className="text-xs font-semibold">{t.fabNewInvoice}</span>
            <div className="w-7 h-7 rounded-xl bg-white/[0.08] flex items-center justify-center">
              <Receipt size={14} className="text-emerald-400" />
            </div>
          </button>

          <button
            onClick={() => handleSelect('uploadDoc')}
            className="flex items-center gap-2.5 px-3.5 py-2 rounded-2xl glass-panel text-white shadow-2xl ios-press"
          >
            <span className="text-xs font-semibold">{t.fabUploadDoc}</span>
            <div className="w-7 h-7 rounded-xl bg-white/[0.08] flex items-center justify-center">
              <UploadCloud size={14} className="text-blue-400" />
            </div>
          </button>

          <button
            onClick={() => handleSelect('aiConsult')}
            className="flex items-center gap-2.5 px-3.5 py-2 rounded-2xl glass-panel text-white shadow-2xl ios-press"
          >
            <span className="text-xs font-semibold text-amber-300">{t.fabAIChat}</span>
            <div className="w-7 h-7 rounded-xl bg-amber-400/20 flex items-center justify-center">
              <Sparkles size={14} className="text-amber-300" />
            </div>
          </button>
        </div>
      )}

      {/* Main Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-12 h-12 rounded-full bg-white text-black font-bold shadow-2xl flex items-center justify-center transition-all hover:scale-105 active:scale-95 ios-press"
        aria-label="Quick Actions"
      >
        {isOpen ? <X size={20} /> : <Plus size={22} />}
      </button>
    </div>
  );
};
