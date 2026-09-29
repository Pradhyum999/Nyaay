import React, { useState } from 'react';
import { Button } from '../../design/ui/Button';
import { Language } from '../../types';
import { Gavel, Loader2, Info } from 'lucide-react';

interface AdvocateProfileStepProps {
  language: Language;
  initialName?: string;
  onSaveProfile: (data: { name: string; state: string; barCouncilId: string }) => Promise<void>;
  loading: boolean;
  error?: string;
}

const INDIAN_STATES = [
  'Delhi', 'Maharashtra', 'Karnataka', 'Tamil Nadu', 'Uttar Pradesh',
  'Gujarat', 'West Bengal', 'Punjab', 'Rajasthan', 'Kerala',
  'Madhya Pradesh', 'Telangana', 'Andhra Pradesh', 'Bihar', 'Haryana'
];

// Format Advocate name to always have "Adv. " prefix
export const formatAdvocateName = (raw: string): string => {
  const trimmed = (raw || '').trim();
  if (!trimmed) return 'Adv. ';
  if (/^adv\.?\s*/i.test(trimmed)) {
    return trimmed.replace(/^adv\.?\s*/i, 'Adv. ');
  }
  if (/^advocate\s+/i.test(trimmed)) {
    return trimmed.replace(/^advocate\s+/i, 'Adv. ');
  }
  return `Adv. ${trimmed}`;
};

export const AdvocateProfileStep: React.FC<AdvocateProfileStepProps> = ({
  language,
  initialName = '',
  onSaveProfile,
  loading,
  error,
}) => {
  const [name, setName] = useState(() => {
    if (initialName && initialName.trim()) {
      return formatAdvocateName(initialName);
    }
    return 'Adv. ';
  });
  const [state, setState] = useState('Maharashtra');
  const [barCouncilId, setBarCouncilId] = useState('');

  // Normalize Bar Council ID on submission (e.g. "mah 1234 2018" -> "MAH/1234/2018")
  const normaliseBarId = (raw: string) => {
    return raw
      .trim()
      .toUpperCase()
      .replace(/[\s\-_]+/g, '/');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const finalName = formatAdvocateName(name);
    const bare = finalName.replace(/^Adv\.\s*/i, '').trim();
    if (bare.length < 2 || !barCouncilId.trim() || loading) return;
    await onSaveProfile({
      name: finalName,
      state,
      barCouncilId: normaliseBarId(barCouncilId),
    });
  };

  const bareName = name.replace(/^adv\.?\s*/i, '').replace(/^advocate\s+/i, '').trim();
  const isValid = bareName.length >= 2 && barCouncilId.trim().length >= 3;

  return (
    <div className="space-y-5 animate-in fade-in">
      <div className="text-center space-y-1.5">
        <div className="w-11 h-11 rounded-2xl bg-amber-400/10 border border-amber-400/20 flex items-center justify-center mx-auto text-amber-300">
          <Gavel size={20} />
        </div>
        <h2 className="text-lg sm:text-xl font-bold text-main">
          {language === 'mr' ? 'वकील प्रोफाइल तयार करा' : language === 'hi' ? 'अधिवक्ता प्रोफ़ाइल बनाएं' : 'Advocate Workstation Profile'}
        </h2>
        <p className="text-xs text-sub">
          {language === 'mr'
            ? 'न्यायनीतीमध्ये तुमची बार नोंदणी पूर्ण करा'
            : language === 'hi'
            ? 'न्यायनीति में अपनी बार काउंसिल जानकारी दर्ज करें'
            : 'Enter your official practice credentials'}
        </p>
      </div>

      {error && (
        <div className="p-3 rounded-2xl bg-red-500/10 border border-red-500/20 text-xs text-red-400">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-3.5 pt-1">
        <div>
          <label className="text-xs font-semibold text-sub block mb-1">
            {language === 'mr' ? 'पूर्ण नाव' : language === 'hi' ? 'पूरा नाम' : 'Full Name'}
          </label>
          <input
            type="text"
            required
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="Adv. Rajesh Mehta"
            className="w-full h-12 px-3.5 rounded-2xl bg-white/[0.05] border border-white/[0.1] text-main text-sm sm:text-base focus:border-amber-400 outline-none"
          />
        </div>

        <div>
          <label className="text-xs font-semibold text-sub block mb-1">
            {language === 'mr' ? 'प्रॅक्टिस राज्य' : language === 'hi' ? 'अभ्यास राज्य' : 'State of Practice'}
          </label>
          <select
            value={state}
            onChange={e => setState(e.target.value)}
            className="w-full h-12 px-3.5 rounded-2xl bg-white/[0.05] border border-white/[0.1] text-main text-sm sm:text-base focus:border-amber-400 outline-none"
          >
            {INDIAN_STATES.map(s => (
              <option key={s} value={s} className="bg-neutral-900 text-white">
                {s}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="text-xs font-semibold text-sub block mb-1 font-mono">
            {language === 'mr' ? 'बार कौन्सिल नोंदणी क्रमांक' : language === 'hi' ? 'बार काउंसिल पंजीकरण संख्या' : 'Bar Council Enrollment ID'}
          </label>
          <input
            type="text"
            required
            value={barCouncilId}
            onChange={e => setBarCouncilId(e.target.value)}
            placeholder="MAH/1234/2018"
            className="w-full h-12 px-3.5 rounded-2xl bg-white/[0.05] border border-white/[0.1] text-main text-sm sm:text-base font-mono focus:border-amber-400 outline-none"
          />
          <p className="text-[11px] text-faint mt-1 flex items-start gap-1">
            <Info size={12} className="shrink-0 mt-0.5" />
            <span>
              {language === 'mr'
                ? 'सनद किंवा नोंदणी प्रमाणपत्र तुम्ही नंतर प्रोफाइलमधून कधीही अपलोड करू शकता.'
                : language === 'hi'
                ? 'सनद या नामांकन प्रमाण आप बाद में प्रोफ़ाइल से भी अपलोड कर सकते हैं।'
                : 'You can upload your Sanad/enrolment certificate later from More → Profile.'}
            </span>
          </p>
        </div>

        <div className="pt-2">
          <Button
            type="submit"
            variant="primary"
            size="md"
            disabled={!isValid || loading}
            className="w-full h-12"
            icon={loading ? <Loader2 size={16} className="animate-spin" /> : undefined}
          >
            {loading
              ? (language === 'mr' ? 'जतन करत आहे...' : language === 'hi' ? 'सहेज रहे हैं...' : 'Setting up…')
              : (language === 'mr' ? 'प्रॅक्टिस सुरू करा' : language === 'hi' ? 'अभ्यास शुरू करें' : 'Start Practising')}
          </Button>
        </div>
      </form>
    </div>
  );
};
