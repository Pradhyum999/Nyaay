import React from 'react';
import { Sheet } from '../../design/ui/Sheet';
import { Phone, ShieldAlert, Scale, ExternalLink, AlertTriangle, FileText } from 'lucide-react';
import { Language } from '../../types';

interface EmergencySheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  language: Language;
}

interface Helpline {
  name: { en: string; hi: string; mr: string };
  number: string;
  desc: { en: string; hi: string; mr: string };
  badge?: string;
  color: string;
}

const HELPLINES: Helpline[] = [
  {
    name: {
      en: 'National Emergency Service',
      hi: 'राष्ट्रीय आपातकालीन सेवा',
      mr: 'राष्ट्रीय आपत्कालीन सेवा',
    },
    number: '112',
    desc: {
      en: 'All-in-one Police, Fire & Medical response across India',
      hi: 'संपूर्ण भारत में पुलिस, अग्निशामक और चिकित्सा सहायता',
      mr: 'संपूर्ण भारतात पोलीस, अग्निशमन व वैद्यकीय मदत',
    },
    badge: '24x7 Pan-India',
    color: 'from-red-500/20 to-red-500/5 text-red-400 border-red-500/30',
  },
  {
    name: {
      en: 'NALSA Legal Aid Helpline',
      hi: 'नालसा निःशुल्क कानूनी सहायता',
      mr: 'नालसा मोफत कायदेशीर मदत',
    },
    number: '15100',
    desc: {
      en: 'Toll-free free legal services & counsel under Legal Services Authorities Act',
      hi: 'विधिक सेवा प्राधिकरण अधिनियम के अंतर्गत निःशुल्क वकील और सलाह',
      mr: 'विधी सेवा प्राधिकरण अंतर्गत मोफत वकील व कायदेशीर मार्गदर्शन',
    },
    badge: 'Free Legal Aid',
    color: 'from-amber-500/20 to-amber-500/5 text-amber-300 border-amber-500/30',
  },
  {
    name: {
      en: 'National Cyber Crime Helpline',
      hi: 'राष्ट्रीय साइबर अपराध हेल्पलाइन',
      mr: 'राष्ट्रीय सायबर गुन्हा हेल्पलाईन',
    },
    number: '1930',
    desc: {
      en: 'Immediate reporting of financial fraud, UPI theft & online blackmail',
      hi: 'वित्तीय धोखाधड़ी, यूपीआई चोरी और ऑनलाइन ब्लैकमेलिंग की तुरंत रिपोर्ट',
      mr: 'आर्थिक फसवणूक, युपीआय चोरी व सायबर गुन्ह्यांची तत्काळ तक्रार',
    },
    badge: 'Cyber Cell',
    color: 'from-blue-500/20 to-blue-500/5 text-blue-400 border-blue-500/30',
  },
  {
    name: {
      en: 'Women in Distress Helpline',
      hi: 'महिला संकट निवारण हेल्पलाइन',
      mr: 'महिला संकट निवारण हेल्पलाईन',
    },
    number: '1091',
    desc: {
      en: 'Immediate safety response and domestic violence legal assistance',
      hi: 'तत्काल सुरक्षा प्रतिक्रिया और घरेलू हिंसा कानूनी सहायता',
      mr: 'तातडीची सुरक्षा व कौटुंबिक हिंसाचाराविरोधात कायदेशीर मदत',
    },
    badge: 'Women Safety',
    color: 'from-rose-500/20 to-rose-500/5 text-rose-400 border-rose-500/30',
  },
  {
    name: {
      en: 'Childline India',
      hi: 'चाइल्डलाइन भारत',
      mr: 'चाइल्डलाइन इंडिया',
    },
    number: '1098',
    desc: {
      en: 'Protection and care for children in need and crisis situations',
      hi: 'संकट में फंसे बच्चों की सुरक्षा, कानूनी सहायता और देखरेख',
      mr: 'संकटातील बालकांचे रक्षण, कायदेशीर मदत व निगा',
    },
    badge: 'Child Helpline',
    color: 'from-purple-500/20 to-purple-500/5 text-purple-400 border-purple-500/30',
  },
];

export const EmergencySheet: React.FC<EmergencySheetProps> = ({
  open,
  onOpenChange,
  language,
}) => {
  const t = (en: string, hi: string, mr: string) =>
    language === 'mr' ? mr : language === 'hi' ? hi : en;

  return (
    <Sheet
      open={open}
      onOpenChange={onOpenChange}
      title={t(
        'Emergency Helplines & Legal Aid',
        'आपातकालीन हेल्पलाइन एवं निःशुल्क कानूनी सहायता',
        'आपत्कालीन हेल्पलाईन व कायदेशीर मदत'
      )}
      description={t(
        'Official Government of India statutory helplines available 24x7 for urgent legal and physical safety.',
        'तात्कालिक कानूनी और सुरक्षा सहायता हेतु भारत सरकार की आधिकारिक 24x7 हेल्पलाइन।',
        'तातडीच्या कायदेशीर व सुरक्षेच्या मदतीसाठी भारत सरकारची अधिकृत २४x७ हेल्पलाईन.'
      )}
    >
      <div className="space-y-4 pb-6">
        {/* Helplines List */}
        <div className="space-y-2.5">
          {HELPLINES.map((item) => {
            const name = item.name[language] || item.name.en;
            const desc = item.desc[language] || item.desc.en;

            return (
              <a
                key={item.number}
                href={`tel:${item.number}`}
                className={`block p-3.5 rounded-2xl bg-gradient-to-r border transition hover:opacity-90 active:scale-[0.99] ${item.color}`}
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-white truncate">{name}</span>
                      {item.badge && (
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-white/10 border border-white/15 text-white/90">
                          {item.badge}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-neutral-300 mt-1 leading-relaxed">{desc}</p>
                  </div>

                  <div className="flex-shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/15 border border-white/20 text-white font-mono font-bold text-sm">
                    <Phone size={14} className="text-emerald-400" />
                    <span>{item.number}</span>
                  </div>
                </div>
              </a>
            );
          })}
        </div>

        {/* Fundamental Statutory Rights in Emergency */}
        <div className="p-4 rounded-2xl bg-neutral-900 border border-white/10 space-y-2.5">
          <div className="flex items-center gap-2 text-amber-300 text-xs font-bold font-mono uppercase tracking-wider">
            <Scale size={15} />
            <span>{t('Statutory Arrest & Custody Rights', 'गिरफ्तारी एवं हिरासत संबंधी वैधानिक अधिकार', 'अटक व ताब्यासंबंधी वैधानिक हक्क')}</span>
          </div>

          <ul className="text-xs text-neutral-300 space-y-2 leading-relaxed">
            <li className="flex items-start gap-2">
              <span className="text-amber-400 font-bold">•</span>
              <span>
                <strong>Article 22(1) / Sec 35 BNSS:</strong> Right to be informed of grounds of arrest immediately and right to consult & be defended by a legal practitioner of choice.
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-amber-400 font-bold">•</span>
              <span>
                <strong>Article 39A / NALSA:</strong> If you cannot afford counsel, the State is constitutionally mandated to provide free legal representation before the Magistrate.
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-amber-400 font-bold">•</span>
              <span>
                <strong>24-Hour Production Mandate:</strong> No person can be detained beyond 24 hours without being produced before the nearest Judicial Magistrate.
              </span>
            </li>
          </ul>
        </div>
      </div>
    </Sheet>
  );
};
