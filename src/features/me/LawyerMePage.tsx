import React, { useState } from 'react';
import { Card } from '../../design/ui/Card';
import { Button } from '../../design/ui/Button';
import { Language, ThemeMode, UserProfile } from '../../types';
import {
  Scale,
  Award,
  MapPin,
  Phone,
  Mail,
  Share2,
  Download,
  Edit3,
  Building,
  CheckCircle2,
  Briefcase,
  BookOpen,
  Calendar,
  Globe,
  ShieldCheck,
  Star,
  ExternalLink,
  Copy,
  Clock,
} from 'lucide-react';

interface LawyerMePageProps {
  userProfile?: UserProfile;
  language: Language;
  onOpenProfile?: () => void;
  onSelectLanguage?: (lang: Language) => void;
  theme?: ThemeMode;
  onToggleTheme?: () => void;
  onSignOut?: () => void;
}

export const LawyerMePage: React.FC<LawyerMePageProps> = ({
  userProfile,
  language = 'en',
  onOpenProfile,
  onSelectLanguage,
  theme,
  onToggleTheme,
  onSignOut,
}) => {
  const [copiedLink, setCopiedLink] = useState(false);

  const t = (en: string, hi: string, mr: string) => {
    if (language === 'mr') return mr;
    if (language === 'hi') return hi;
    return en;
  };

  const lawyerName = userProfile?.name || 'Adv. Rajesh Sharma';
  const barId = userProfile?.barCouncilId || 'BCI/D/1942/2012';
  const experienceYears = (userProfile as any)?.experienceYears || '14';
  const city = (userProfile as any)?.city || 'New Delhi, India';

  const handleSharePortfolio = () => {
    const portfolioUrl = window.location.origin + `/#/portfolio/${userProfile?.uid || 'counsel'}`;
    if (navigator.share) {
      navigator.share({
        title: `${lawyerName} - Digital Legal Portfolio`,
        text: `Consult ${lawyerName}, Advocate (${barId}) on NYAAYNEETI Digital Chambers:`,
        url: portfolioUrl,
      }).catch(() => {});
    } else {
      navigator.clipboard.writeText(portfolioUrl);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    }
  };

  return (
    <div className="flex flex-col gap-5 p-4 sm:p-6 pb-28 text-white max-w-4xl mx-auto w-full">
      {/* ── Portfolio Hero Header ── */}
      <Card className="relative overflow-hidden p-5 sm:p-6 bg-gradient-to-br from-neutral-900 via-neutral-950 to-neutral-900 border-amber-400/30 shadow-2xl">
        {/* Subtle gold watermark emblem */}
        <div className="absolute right-3 -bottom-6 opacity-5 pointer-events-none text-amber-300">
          <Scale size={180} />
        </div>

        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 relative z-10">
          <div className="flex items-center gap-4">
            {/* Avatar / Portrait with Gold Ring */}
            <div className="relative">
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-tr from-amber-500/20 to-amber-300/10 border-2 border-amber-400/40 flex items-center justify-center font-bold text-amber-300 text-2xl sm:text-3xl shadow-lg shadow-amber-400/10">
                {lawyerName.replace('Adv. ', '').charAt(0) || 'A'}
              </div>
              <div className="absolute -bottom-1 -right-1 bg-amber-400 text-black p-1 rounded-full shadow-md" title="Verified Advocate">
                <ShieldCheck size={14} />
              </div>
            </div>

            {/* Counsel Info */}
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-lg sm:text-xl font-bold text-white tracking-tight font-display">
                  {lawyerName}
                </h1>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 font-bold flex items-center gap-1">
                  <CheckCircle2 size={10} /> Verified Counsel
                </span>
              </div>
              <p className="text-xs text-amber-300 font-mono font-medium mt-1">
                {barId} · High Court & Supreme Court Bar
              </p>
              <div className="flex items-center gap-3 text-xs text-neutral-400 mt-1.5 flex-wrap">
                <span className="flex items-center gap-1">
                  <MapPin size={12} className="text-neutral-500" />
                  {city}
                </span>
                <span className="flex items-center gap-1">
                  <Briefcase size={12} className="text-neutral-500" />
                  {experienceYears}+ {t('Years Experience', 'वर्षों का अनुभव', 'वर्षांचा अनुभव')}
                </span>
              </div>
            </div>
          </div>

          {/* Header Action Buttons */}
          <div className="flex items-center gap-2 w-full sm:w-auto">
            {onOpenProfile && (
              <Button
                variant="secondary"
                size="sm"
                icon={<Edit3 size={13} />}
                onClick={onOpenProfile}
                className="flex-1 sm:flex-initial"
              >
                {t('Edit Profile', 'प्रोफाइल संपादित करें', 'प्रोफाइल संपादित करा')}
              </Button>
            )}
            <Button
              variant="primary"
              size="sm"
              icon={<Share2 size={13} />}
              onClick={handleSharePortfolio}
              className="flex-1 sm:flex-initial"
            >
              {copiedLink ? t('Link Copied!', 'लिंक कॉपी हो गई!', 'लिंक कॉपी झाली!') : t('Share Portfolio', 'शेयर करें', 'शेअर करा')}
            </Button>
          </div>
        </div>
      </Card>

      {/* ── Key Practice Metrics ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3">
        <Card className="p-3.5 bg-white/[0.03] border-white/[0.08] text-center">
          <p className="text-[10px] font-mono text-neutral-400 uppercase tracking-wider">{t('Years in Practice', 'प्रैक्टिस वर्ष', 'वकिली वर्षे')}</p>
          <p className="text-xl sm:text-2xl font-bold font-mono text-white mt-1">{experienceYears}+</p>
          <p className="text-[10px] text-amber-400/80 mt-0.5 font-medium">Enrolled 2012</p>
        </Card>

        <Card className="p-3.5 bg-white/[0.03] border-white/[0.08] text-center">
          <p className="text-[10px] font-mono text-neutral-400 uppercase tracking-wider">{t('Reported Matters', 'कुल केस मामले', 'एकूण खटले')}</p>
          <p className="text-xl sm:text-2xl font-bold font-mono text-amber-300 mt-1">140+</p>
          <p className="text-[10px] text-neutral-400 mt-0.5">High Court & District</p>
        </Card>

        <Card className="p-3.5 bg-white/[0.03] border-white/[0.08] text-center">
          <p className="text-[10px] font-mono text-neutral-400 uppercase tracking-wider">{t('Relief & Success', 'सफलता दर', 'यशस्वी निकाल')}</p>
          <p className="text-xl sm:text-2xl font-bold font-mono text-emerald-400 mt-1">91%</p>
          <p className="text-[10px] text-emerald-400/80 mt-0.5 font-medium">Bail & Trial Relief</p>
        </Card>

        <Card className="p-3.5 bg-white/[0.03] border-white/[0.08] text-center">
          <p className="text-[10px] font-mono text-neutral-400 uppercase tracking-wider">{t('Primary Benches', 'प्रमुख अदालतें', 'प्रमुख न्यायालये')}</p>
          <p className="text-xl sm:text-2xl font-bold font-mono text-white mt-1">4</p>
          <p className="text-[10px] text-neutral-400 mt-0.5">SC, HC, NCLT, Sessions</p>
        </Card>
      </div>

      {/* ── Professional Statement & Bio ── */}
      <Card className="p-4 sm:p-5 space-y-2.5 bg-white/[0.03] border-white/[0.08]">
        <div className="flex items-center gap-2">
          <BookOpen size={16} className="text-amber-400" />
          <h3 className="text-xs font-bold text-white uppercase tracking-wider font-mono">
            {t('Professional Statement & Advocacy Ethos', 'व्यावसायिक वक्तव्य एवं अभ्यास', 'व्यावसायिक निवेदन')}
          </h3>
        </div>
        <p className="text-xs text-neutral-300 leading-relaxed">
          {userProfile?.bio ||
            'Advocate practicing extensively before the High Court and Supreme Court of India, specializing in criminal trials, special statutes (BNS/IPC, Prevention of Money Laundering Act, NDPS, POCSO), complex commercial civil litigation, and corporate insolvency before NCLT. Committed to proactive procedural defense, ethical client representation, and time-bound court relief.'}
        </p>
      </Card>

      {/* ── Courts of Practice & Jurisdiction ── */}
      <Card className="p-4 sm:p-5 space-y-3 bg-white/[0.03] border-white/[0.08]">
        <div className="flex items-center gap-2">
          <Building size={16} className="text-amber-400" />
          <h3 className="text-xs font-bold text-white uppercase tracking-wider font-mono">
            {t('Courts of Practice & Regular Appearances', 'नियमित उपस्थिति वाले न्यायालय', 'नियमित उपस्थिती असलेली न्यायालये')}
          </h3>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
          {[
            { name: 'Supreme Court of India, New Delhi', type: 'Appellate & Writ Jurisdiction' },
            { name: 'Delhi High Court (Sher Shah Road)', type: 'Original & Commercial Division' },
            { name: 'National Company Law Tribunal (NCLT Principal Bench)', type: 'Insolvency & Corporate (IBC)' },
            { name: 'Patiala House & Tis Hazari District Courts Complex', type: 'Sessions & Special CBI / ACB Courts' },
          ].map((c, i) => (
            <div key={i} className="p-2.5 rounded-xl bg-white/[0.03] border border-white/[0.06] flex items-center justify-between">
              <div>
                <p className="font-semibold text-white">{c.name}</p>
                <p className="text-[10px] text-neutral-400 mt-0.5">{c.type}</p>
              </div>
              <CheckCircle2 size={14} className="text-amber-400 shrink-0 ml-2" />
            </div>
          ))}
        </div>
      </Card>

      {/* ── Core Practice Areas & Statutory Expertise ── */}
      <Card className="p-4 sm:p-5 space-y-3 bg-white/[0.03] border-white/[0.08]">
        <div className="flex items-center gap-2">
          <Scale size={16} className="text-amber-400" />
          <h3 className="text-xs font-bold text-white uppercase tracking-wider font-mono">
            {t('Core Practice Areas & Specializations', 'विशेषज्ञता एवं कानूनी क्षेत्र', 'विशेष कायदेशीर कार्यक्षेत्रे')}
          </h3>
        </div>
        <div className="flex flex-wrap gap-2">
          {[
            'Criminal Defense & Bail (Sec 438/439 CrPC)',
            'Cheque Dishonour (Sec 138 NI Act)',
            'Corporate Insolvency & Bankruptcy (IBC)',
            'Constitutional Writs (Art. 226 & 32)',
            'Civil Suits & Specific Performance',
            'Arbitration & Commercial Contracts',
            'Matrimonial & Child Custody Disputes',
            'White Collar Defense & Special CBI/ED Courts',
          ].map((area, idx) => (
            <span
              key={idx}
              className="px-3 py-1.5 rounded-xl bg-amber-400/10 border border-amber-400/25 text-amber-300 text-xs font-medium"
            >
              ⚖️ {area}
            </span>
          ))}
        </div>
      </Card>

      {/* ── Chambers, Office & Consultation Timings ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Card className="p-4 space-y-2.5 bg-white/[0.03] border-white/[0.08]">
          <div className="flex items-center gap-2">
            <Building size={15} className="text-amber-400" />
            <h4 className="text-xs font-bold text-white uppercase font-mono tracking-wider">Chambers Address</h4>
          </div>
          <p className="text-xs text-neutral-300 leading-relaxed font-sans">
            Chambers of Adv. Rajesh Sharma & Associates<br />
            Lawyers Chambers Block C-412, Delhi High Court Complex<br />
            Sher Shah Road, New Delhi – 110003
          </p>
          <div className="pt-1 flex items-center gap-2 text-xs text-neutral-400">
            <Mail size={13} className="text-neutral-500" />
            <span>chambers.sharma@nyaay.in</span>
          </div>
        </Card>

        <Card className="p-4 space-y-2.5 bg-white/[0.03] border-white/[0.08]">
          <div className="flex items-center gap-2">
            <Clock size={15} className="text-amber-400" />
            <h4 className="text-xs font-bold text-white uppercase font-mono tracking-wider">Consultation Hours</h4>
          </div>
          <p className="text-xs text-neutral-300 leading-relaxed">
            <strong className="text-white">Court Hours:</strong> Mon – Fri: 10:00 AM – 04:30 PM<br />
            <strong className="text-white">Chamber Consultations:</strong> Mon – Sat: 05:30 PM – 08:30 PM<br />
            <strong className="text-white">Emergency Bail:</strong> 24/7 Available for registry urgent mention
          </p>
          <div className="pt-1 flex items-center gap-2 text-xs text-emerald-400">
            <Phone size={13} />
            <span>+91 98101 23456 (Chamber Clerk)</span>
          </div>
        </Card>
      </div>

      {/* ── Verified Credentials & Bar Associations ── */}
      <Card className="p-4 space-y-2.5 bg-white/[0.03] border-white/[0.08]">
        <div className="flex items-center gap-2">
          <Award size={16} className="text-amber-400" />
          <h4 className="text-xs font-bold text-white uppercase font-mono tracking-wider">
            Verified Credentials & Bar Association Memberships
          </h4>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs pt-1">
          <div className="p-2.5 rounded-xl bg-white/[0.02] border border-white/[0.06]">
            <p className="font-semibold text-white">Bar Council of Delhi</p>
            <p className="text-[10px] text-neutral-400 mt-0.5">Enrolment: D/1942/2012</p>
          </div>
          <div className="p-2.5 rounded-xl bg-white/[0.02] border border-white/[0.06]">
            <p className="font-semibold text-white">Supreme Court Bar Assn.</p>
            <p className="text-[10px] text-neutral-400 mt-0.5">Member SCBA #4819</p>
          </div>
          <div className="p-2.5 rounded-xl bg-white/[0.02] border border-white/[0.06]">
            <p className="font-semibold text-white">Delhi High Court Bar</p>
            <p className="text-[10px] text-neutral-400 mt-0.5">Member DHCBA #7104</p>
          </div>
        </div>
      </Card>
    </div>
  );
};
