import React, { useState } from 'react';
import { Button } from '../../design/ui/Button';
import { Language } from '../../types';
import { User, Loader2, ShieldCheck } from 'lucide-react';

interface CitizenProfileStepProps {
  language: Language;
  initialName?: string;
  onSaveProfile: (data: { name: string; city?: string }) => Promise<void>;
  loading: boolean;
  error?: string;
}

export const CitizenProfileStep: React.FC<CitizenProfileStepProps> = ({
  language,
  initialName = '',
  onSaveProfile,
  loading,
  error,
}) => {
  const [name, setName] = useState(initialName);
  const [city, setCity] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || loading) return;
    await onSaveProfile({
      name: name.trim(),
      city: city.trim() || undefined,
    });
  };

  const isValid = name.trim().length >= 2;

  return (
    <div className="space-y-5 animate-in fade-in">
      <div className="text-center space-y-1.5">
        <div className="w-11 h-11 rounded-2xl bg-amber-400/10 border border-amber-400/20 flex items-center justify-center mx-auto text-amber-300">
          <User size={20} />
        </div>
        <h2 className="text-lg sm:text-xl font-bold text-main">
          {language === 'mr' ? 'नागरिक प्रोफाइल' : language === 'hi' ? 'नागरिक प्रोफ़ाइल' : 'Your Citizen Profile'}
        </h2>
        <p className="text-xs text-sub">
          {language === 'mr'
            ? 'कायदेशीर मदत आणि वकीलांशी संवादासाठी तुमची प्राथमिक माहिती'
            : language === 'hi'
            ? 'कानूनी सहायता और वकील से बातचीत के लिए प्राथमिक विवरण'
            : 'Basic details to start your legal consultation'}
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
            {language === 'mr' ? 'आपले पूर्ण नाव' : language === 'hi' ? 'आपका पूरा नाम' : 'Your Full Name'}
          </label>
          <input
            type="text"
            required
            autoFocus
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="Priya Sharma"
            className="w-full h-12 px-3.5 rounded-2xl bg-white/[0.05] border border-white/[0.1] text-main text-sm sm:text-base focus:border-amber-400 outline-none"
          />
        </div>

        <div>
          <label className="text-xs font-semibold text-sub block mb-1">
            {language === 'mr' ? 'शहर / ठिकाण (ऐच्छिक)' : language === 'hi' ? 'शहर / स्थान (वैकल्पिक)' : 'City / Location (Optional)'}
          </label>
          <input
            type="text"
            value={city}
            onChange={e => setCity(e.target.value)}
            placeholder="Mumbai / Pune / Delhi"
            className="w-full h-12 px-3.5 rounded-2xl bg-white/[0.05] border border-white/[0.1] text-main text-sm sm:text-base focus:border-amber-400 outline-none"
          />
        </div>

        <div className="p-3 rounded-2xl bg-white/[0.03] border border-white/[0.06] text-xs text-sub flex items-center gap-2">
          <ShieldCheck size={16} className="text-emerald-400 shrink-0" />
          <span>
            {language === 'mr'
              ? 'ओळखपत्र (आधार/मतदान कार्ड) फक्त वकीलांशी अधिकृत करार करताना मागितले जाईल.'
              : language === 'hi'
              ? 'पहचान प्रमाण पत्र केवल औपचारिक वकील नियुक्ति या भुगतान के समय ही मांगा जाएगा।'
              : 'ID proof is only requested when formally retaining an advocate.'}
          </span>
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
              ? (language === 'mr' ? 'सुरू करत आहे...' : language === 'hi' ? 'शुरू कर रहे हैं...' : 'Getting ready…')
              : (language === 'mr' ? 'कायदेशीर मदत मिळवा' : language === 'hi' ? 'कानूनी सहायता पाएं' : 'Get Legal Help')}
          </Button>
        </div>
      </form>
    </div>
  );
};
