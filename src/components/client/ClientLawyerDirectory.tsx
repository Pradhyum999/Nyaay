import React, { useState } from 'react';
import { ShieldCheck, Building, Star, ArrowUpRight, CheckCircle2 } from 'lucide-react';
import { Language } from '../../types';
import { translations } from '../../i18n/translations';

interface ClientLawyerDirectoryProps {
  language: Language;
}

export const ClientLawyerDirectory: React.FC<ClientLawyerDirectoryProps> = ({ language }) => {
  const t = translations[language];
  const [selectedLawyer, setSelectedLawyer] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const lawyers = [
    {
      id: 'l1',
      name: 'Adv. Rajesh Mehta',
      barCouncil: 'Bar Council of Delhi (D/1482/2015)',
      experience: '12 Years Practice',
      rating: '4.9',
      reviews: 84,
      specialties: ['Criminal Appeals', 'Sec 138 NI Act', 'Bail Petitions'],
      courts: ['Delhi High Court', 'Tis Hazari', 'Supreme Court']
    },
    {
      id: 'l2',
      name: 'Adv. Priya Sharma',
      barCouncil: 'Bar Council of Maharashtra & Goa (MAH/3301/2017)',
      experience: '9 Years Practice',
      rating: '4.8',
      reviews: 62,
      specialties: ['Consumer Disputes', 'Commercial Contracts', 'Cyber Law'],
      courts: ['Bombay High Court', 'City Civil Court', 'NCDRC']
    },
    {
      id: 'l3',
      name: 'Adv. Ananya Mukherjee',
      barCouncil: 'Bar Council of West Bengal (WB/1092/2014)',
      experience: '13 Years Practice',
      rating: '5.0',
      reviews: 110,
      specialties: ['Property & Real Estate', 'Inheritance', 'Civil Writs'],
      courts: ['Calcutta High Court', 'Alipore District Court']
    }
  ];

  const handleBook = (name: string) => {
    setSelectedLawyer(name);
    setToastMessage(`Pre-consultation requested with ${name}! Reviewing AI Intake Summary.`);
    setTimeout(() => {
      setSelectedLawyer(null);
      setToastMessage(null);
    }, 3500);
  };

  return (
    <div className="flex flex-col gap-5 p-5 pb-24">
      {/* Toast */}
      {toastMessage && (
        <div className="sticky top-2 z-30 bg-neutral-900/90 text-white border border-emerald-500/30 px-4 py-2.5 rounded-2xl shadow-2xl backdrop-blur-xl flex items-center gap-2 text-xs font-medium animate-in fade-in">
          <CheckCircle2 size={15} className="text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header */}
      <div>
        <span className="text-[11px] font-semibold tracking-wider uppercase text-neutral-500">
          Verified Directory
        </span>
        <h1 className="text-2xl font-bold tracking-tight text-white mt-0.5">
          {language === 'en' ? 'Verified Advocates' : 'सत्यापित अधिवक्ता सूची'}
        </h1>
        <p className="text-xs text-neutral-400 mt-1">
          Bar Council of India verified advocates matched by legal expertise
        </p>
      </div>

      {/* Lawyers List */}
      <div className="space-y-3">
        {lawyers.map(l => (
          <div
            key={l.id}
            className="glass-card rounded-3xl p-5 flex flex-col gap-3.5 border border-white/[0.08]"
          >
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-1.5">
                  <h3 className="text-base font-bold text-white tracking-tight">{l.name}</h3>
                  <ShieldCheck size={14} className="text-emerald-400" />
                </div>
                <span className="text-[10px] text-neutral-500 font-mono block mt-0.5">{l.barCouncil}</span>
                <span className="text-xs text-neutral-400 mt-1 block">{l.experience}</span>
              </div>

              <div className="flex items-center gap-1 bg-white/[0.05] border border-white/[0.08] px-2.5 py-1 rounded-full text-xs font-bold text-white font-mono">
                <Star size={12} className="text-amber-400 fill-amber-400" />
                <span>{l.rating}</span>
                <span className="text-[10px] text-neutral-500 font-normal">({l.reviews})</span>
              </div>
            </div>

            {/* Specialties */}
            <div className="flex flex-wrap gap-1.5">
              {l.specialties.map((s, idx) => (
                <span key={idx} className="text-[10px] px-2.5 py-0.5 rounded-full bg-white/[0.03] text-neutral-300 border border-white/[0.06]">
                  {s}
                </span>
              ))}
            </div>

            {/* Courts */}
            <div className="text-[11px] text-neutral-400 flex items-center gap-1.5 pt-1 border-t border-white/[0.04]">
              <Building size={12} className="text-neutral-500" />
              <span>{l.courts.join(' • ')}</span>
            </div>

            {/* Book Action */}
            <button
              onClick={() => handleBook(l.name)}
              className="w-full py-2.5 rounded-2xl bg-white text-black font-semibold text-xs flex items-center justify-center gap-1 hover:bg-neutral-200 transition ios-press"
            >
              <span>Engage Advocate</span>
              <ArrowUpRight size={13} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

