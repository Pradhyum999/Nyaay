import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Building2, GraduationCap, ArrowRight, ShieldCheck, Mail, ArrowLeft } from 'lucide-react';
import { FirmProfile, Language } from '../../types';

interface FirmRegistrationProps {
  language: Language;
  onComplete: (firmData: Omit<FirmProfile, 'id' | 'adminUid' | 'memberCount' | 'createdAt'>) => void;
  onBack?: () => void;
}

export const FirmRegistration: React.FC<FirmRegistrationProps> = ({
  language,
  onComplete,
  onBack,
}) => {
  const [institutionType, setInstitutionType] = useState<'firm' | 'college' | 'school'>('firm');
  const [firmName, setFirmName] = useState('');
  const [firmRegistrationId, setFirmRegistrationId] = useState('');
  const [address, setAddress] = useState('');
  const [adminEmail, setAdminEmail] = useState('');
  const [gstPan, setGstPan] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const t = (en: string, hi: string, mr?: string) =>
    language === 'mr' && mr ? mr : language === 'hi' ? hi : en;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!firmName || !firmRegistrationId || !address || !adminEmail) return;

    setIsSubmitting(true);
    try {
      onComplete({
        firmName: firmName.trim(),
        institutionType,
        firmRegistrationId: firmRegistrationId.trim(),
        address: address.trim(),
        adminEmail: adminEmail.toLowerCase().trim(),
        gstPan: gstPan.trim() || undefined,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col gap-5 p-4 sm:p-6 pb-28 max-w-lg mx-auto w-full">
      {onBack && (
        <button
          type="button"
          onClick={onBack}
          className="self-start flex items-center gap-1.5 text-xs text-neutral-400 hover:text-white transition ios-press"
        >
          <ArrowLeft size={14} />
          <span>{t('Back to Login', 'लॉगिन पर वापस', 'लॉगिनकडे मागे')}</span>
        </button>
      )}

      {/* Header */}
      <div className="pt-1">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-8 h-8 rounded-xl bg-violet-500/20 border border-violet-500/30 flex items-center justify-center text-violet-300">
            {institutionType === 'college' ? <GraduationCap size={16} /> : <Building2 size={16} />}
          </div>
          <span className="text-[11px] font-mono text-violet-400 uppercase tracking-widest font-semibold">
            {t('Enterprise Registration', 'संस्थागत पंजीकरण', 'संस्थागत नोंदणी')}
          </span>
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-white font-display">
          {t('Register as Firm / College', 'फर्म या कॉलेज के रूप में पंजीकृत हों', 'फर्म किंवा कॉलेज म्हणून नोंदणी करा')}
        </h1>
        <p className="text-xs text-neutral-400 mt-1">
          {t(
            'Enroll associates, juniors, or law students with firm-wide case dockets and centralized admin.',
            'अपनी पूरी कानूनी फर्म, सहयोगी वकीलों या छात्रों के लिए संस्थागत खाता बनाएं।',
            'आपल्या फर्म किंवा महाविद्यालयासाठी संस्थागत खाते तयार करा.'
          )}
        </p>
      </div>

      {/* Institution Type Selector */}
      <div className="grid grid-cols-2 gap-2.5">
        <button
          type="button"
          onClick={() => setInstitutionType('firm')}
          className={`p-3 rounded-2xl border flex flex-col items-center gap-1.5 transition ios-press ${
            institutionType === 'firm'
              ? 'bg-violet-500/15 border-violet-500 text-white font-bold'
              : 'bg-white/[0.03] border-white/[0.08] text-neutral-400 hover:text-white'
          }`}
        >
          <Building2 size={20} className={institutionType === 'firm' ? 'text-violet-400' : 'text-neutral-500'} />
          <span className="text-xs">{t('Law Firm / Chambers', 'लॉ फर्म / चैंबर', 'लॉ फर्म')}</span>
        </button>

        <button
          type="button"
          onClick={() => setInstitutionType('college')}
          className={`p-3 rounded-2xl border flex flex-col items-center gap-1.5 transition ios-press ${
            institutionType === 'college'
              ? 'bg-violet-500/15 border-violet-500 text-white font-bold'
              : 'bg-white/[0.03] border-white/[0.08] text-neutral-400 hover:text-white'
          }`}
        >
          <GraduationCap size={20} className={institutionType === 'college' ? 'text-violet-400' : 'text-neutral-500'} />
          <span className="text-xs">{t('Law School / College', 'लॉ कॉलेज / संस्थान', 'विधी महाविद्यालय')}</span>
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-3.5">
        <div>
          <label className="text-[11px] font-medium text-neutral-400 block mb-1">
            {institutionType === 'college'
              ? t('College / Institution Name *', 'कॉलेज / संस्थान का नाम *', 'महाविद्यालयाचे नाव *')
              : t('Law Firm Name *', 'लॉ फर्म का नाम *', 'लॉ फर्मचे नाव *')}
          </label>
          <input
            type="text"
            required
            value={firmName}
            onChange={(e) => setFirmName(e.target.value)}
            placeholder={institutionType === 'college' ? 'e.g. Faculty of Law, University of Delhi' : 'e.g. Mehta & Partners Advocates'}
            className="w-full bg-black/80 border border-white/[0.1] rounded-xl px-3 py-2.5 text-xs text-white placeholder-neutral-600 focus:outline-none focus:border-violet-400/40"
          />
        </div>

        <div>
          <label className="text-[11px] font-medium text-neutral-400 block mb-1">
            {institutionType === 'college'
              ? t('University / UGC / Bar Council Affiliation ID *', 'संबद्धता आईडी *', 'संलग्नीकरण आयडी *')
              : t('Firm Registration ID / Bar Association Roll *', 'फर्म पंजीकरण संख्या *', 'फर्म नोंदणी क्र. *')}
          </label>
          <input
            type="text"
            required
            value={firmRegistrationId}
            onChange={(e) => setFirmRegistrationId(e.target.value)}
            placeholder="e.g. DHCBA/FIRM/2026/044"
            className="w-full bg-black/80 border border-white/[0.1] rounded-xl px-3 py-2.5 text-xs text-white placeholder-neutral-600 focus:outline-none focus:border-violet-400/40 font-mono"
          />
        </div>

        <div>
          <label className="text-[11px] font-medium text-neutral-400 block mb-1">
            {t('Administrative / Head Email *', 'प्रशासनिक ईमेल *', 'प्रशासकीय ईमेल *')}
          </label>
          <input
            type="email"
            required
            value={adminEmail}
            onChange={(e) => setAdminEmail(e.target.value)}
            placeholder="admin@firmdomain.com"
            className="w-full bg-black/80 border border-white/[0.1] rounded-xl px-3 py-2.5 text-xs text-white placeholder-neutral-600 focus:outline-none focus:border-violet-400/40 font-mono"
          />
        </div>

        <div>
          <label className="text-[11px] font-medium text-neutral-400 block mb-1">
            {t('Office / Campus Address *', 'कार्यालय का पता *', 'कार्यालय पत्ता *')}
          </label>
          <input
            type="text"
            required
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="e.g. Lawyers Chambers Block C, High Court of Delhi"
            className="w-full bg-black/80 border border-white/[0.1] rounded-xl px-3 py-2.5 text-xs text-white placeholder-neutral-600 focus:outline-none focus:border-violet-400/40"
          />
        </div>

        <div>
          <label className="text-[11px] font-medium text-neutral-400 block mb-1">
            {t('GST / PAN (Optional)', 'जीएसटी / पैन (वैकल्पिक)', 'GST / PAN (पर्यायी)')}
          </label>
          <input
            type="text"
            value={gstPan}
            onChange={(e) => setGstPan(e.target.value)}
            placeholder="e.g. 07AAAAA0000A1Z5"
            className="w-full bg-black/80 border border-white/[0.1] rounded-xl px-3 py-2.5 text-xs text-white placeholder-neutral-600 focus:outline-none focus:border-violet-400/40 font-mono uppercase"
          />
        </div>

        <button
          type="submit"
          disabled={isSubmitting || !firmName || !firmRegistrationId || !adminEmail || !address}
          className="w-full py-3 rounded-2xl bg-violet-500 hover:bg-violet-400 text-white font-bold text-xs flex items-center justify-center gap-2 transition ios-press shadow-xl shadow-violet-500/25 disabled:opacity-40"
        >
          <span>{isSubmitting ? 'Registering...' : t('Complete Firm Registration', 'फर्म पंजीकरण पूरा करें', 'नोंदणी पूर्ण करा')}</span>
          <ArrowRight size={14} />
        </button>
      </form>
    </div>
  );
};
