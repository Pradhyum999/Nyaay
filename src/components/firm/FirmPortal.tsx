import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Building2, Plus, Mail, Copy, CheckCircle2, Users, Key, Trash2, UserPlus, Shield, GraduationCap, X } from 'lucide-react';
import { FirmProfile, FirmMember, Language } from '../../types';

interface FirmPortalProps {
  firm: FirmProfile;
  members: FirmMember[];
  language: Language;
  onAddMember: (member: Omit<FirmMember, 'id' | 'firmId' | 'joinedAt'>) => Promise<void>;
  onRemoveMember?: (memberId: string) => Promise<void>;
}

export const FirmPortal: React.FC<FirmPortalProps> = ({
  firm,
  members,
  language,
  onAddMember,
  onRemoveMember,
}) => {
  const [showAddMember, setShowAddMember] = useState(false);
  const [newMemberEmail, setNewMemberEmail] = useState('');
  const [newMemberName, setNewMemberName] = useState('');
  const [newMemberRole, setNewMemberRole] = useState<'associate' | 'junior' | 'paralegal' | 'student'>(
    firm.institutionType === 'college' || firm.institutionType === 'school' ? 'student' : 'associate'
  );
  const [isAdding, setIsAdding] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const t = (en: string, hi: string, mr?: string) =>
    language === 'mr' && mr ? mr : language === 'hi' ? hi : en;

  const generateTempPassword = () => {
    const chars = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789@#';
    return Array.from({ length: 9 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
  };

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMemberEmail || !newMemberName) return;
    setIsAdding(true);
    const tempPassword = generateTempPassword();

    try {
      await onAddMember({
        name: newMemberName.trim(),
        email: newMemberEmail.toLowerCase().trim(),
        role: newMemberRole,
        tempPassword,
        mustChangePassword: true,
      });
      setShowAddMember(false);
      setNewMemberEmail('');
      setNewMemberName('');
      setToastMsg(`Member added! First-time temp password: ${tempPassword}`);
      setTimeout(() => setToastMsg(null), 8000);
    } catch {
      setToastMsg('Failed to add member. Please try again.');
      setTimeout(() => setToastMsg(null), 3000);
    } finally {
      setIsAdding(false);
    }
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="flex flex-col gap-5 p-4 sm:p-5 pb-28 max-w-2xl mx-auto w-full">
      {/* Toast Notification */}
      <AnimatePresence>
        {toastMsg && (
          <motion.div
            initial={{ opacity: 0, y: -16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="sticky top-2 z-40 bg-neutral-900/95 text-white border border-emerald-500/40 px-4 py-3 rounded-2xl shadow-2xl backdrop-blur-2xl flex items-center gap-2 text-xs font-medium"
          >
            <CheckCircle2 size={16} className="text-emerald-400 shrink-0" />
            <span className="flex-1 font-mono">{toastMsg}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="flex items-start justify-between pt-1">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-violet-500/10 border border-violet-500/20 text-[10px] font-mono text-violet-400 font-medium">
              {firm.institutionType === 'college' || firm.institutionType === 'school' ? (
                <>
                  <GraduationCap size={12} />
                  <span>COLLEGE / STUDENT PORTAL</span>
                </>
              ) : (
                <>
                  <Building2 size={12} />
                  <span>FIRM DASHBOARD</span>
                </>
              )}
            </span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white font-display">
            {firm.firmName}
          </h1>
          <p className="text-xs text-neutral-400 mt-0.5 font-mono">
            ID: {firm.firmRegistrationId} • Admin: {firm.adminEmail}
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowAddMember(true)}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-violet-500 hover:bg-violet-400 text-white font-semibold text-xs transition ios-press shadow-lg shadow-violet-500/25"
        >
          <UserPlus size={14} />
          <span>{t('Add Member', 'सदस्य जोड़ें', 'सदस्य जोडा')}</span>
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-3 gap-2.5">
        {[
          { label: t('Total Members', 'कुल सदस्य', 'एकूण सदस्य'), value: members.length, icon: Users, color: 'text-violet-400', bg: 'bg-violet-500/10 border-violet-500/20' },
          { label: t('Pending Password', 'पासवर्ड लंबित', 'पासवर्ड प्रलंबित'), value: members.filter(m => m.mustChangePassword).length, icon: Key, color: 'text-amber-400', bg: 'bg-amber-500/10 border-amber-500/20' },
          { label: t('Active Verified', 'सक्रिय', 'सक्रिय'), value: members.filter(m => !m.mustChangePassword).length, icon: Shield, color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/20' },
        ].map((stat, i) => (
          <div key={i} className={`rounded-2xl p-3 border ${stat.bg} flex flex-col gap-1`}>
            <stat.icon size={14} className={stat.color} />
            <span className={`text-lg font-bold font-mono ${stat.color}`}>{stat.value}</span>
            <span className="text-[9px] text-neutral-400 font-mono leading-tight">{stat.label}</span>
          </div>
        ))}
      </div>

      {/* Members Roster */}
      <div className="space-y-3">
        <h2 className="text-xs font-semibold text-neutral-400 uppercase tracking-widest font-mono">
          {t('Members & Associates', 'सदस्य एवं सहयोगी', 'सदस्य व सहकारी')} ({members.length})
        </h2>

        {members.length === 0 ? (
          <div className="glass-card rounded-3xl p-8 text-center flex flex-col items-center gap-3 border border-white/[0.08]">
            <Users size={24} className="text-neutral-500" />
            <div>
              <p className="text-sm font-semibold text-white">
                {t('No members enrolled yet', 'अभी कोई सदस्य नामांकित नहीं है', 'अद्याप कोणतेही सदस्य नाहीत')}
              </p>
              <p className="text-xs text-neutral-400 mt-1 max-w-xs">
                {t(
                  'Add lawyers, juniors, paralegals or law students to give them access to firm cases with initial temporary credentials.',
                  'सहयोगी वकीलों या छात्रों को जोड़ें ताकि वे फर्म केस पर कार्य कर सकें।',
                  'सहकारी वकील किंवा विद्यार्थ्यांना जोडा.'
                )}
              </p>
            </div>
          </div>
        ) : (
          members.map((member) => (
            <div
              key={member.id}
              className="glass-card rounded-2xl p-4 border border-white/[0.08] flex items-center justify-between gap-3"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-xl bg-violet-500/15 border border-violet-500/20 flex items-center justify-center text-violet-300 font-bold text-sm shrink-0">
                  {member.name.charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold text-white truncate">{member.name}</p>
                    {member.mustChangePassword && (
                      <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-amber-500/15 text-amber-300 border border-amber-500/20 font-mono shrink-0">
                        {t('Must Reset Pwd', 'पासवर्ड रीसेट आवश्यक', 'पासवर्ड रीसेट आवश्यक')}
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-neutral-400 font-mono truncate">{member.email}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-[9px] px-2 py-0.5 rounded-full bg-violet-500/10 text-violet-300 border border-violet-500/15 font-mono capitalize">
                      {member.role}
                    </span>
                    {member.tempPassword && (
                      <button
                        type="button"
                        onClick={() => copyToClipboard(member.tempPassword!, member.id)}
                        className="flex items-center gap-1 text-[9px] px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-300 border border-amber-500/20 font-mono ios-press"
                      >
                        {copiedId === member.id ? <CheckCircle2 size={9} /> : <Copy size={9} />}
                        <span>{copiedId === member.id ? 'Copied' : `Pass: ${member.tempPassword}`}</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {onRemoveMember && (
                <button
                  type="button"
                  onClick={() => onRemoveMember(member.id)}
                  className="p-2 rounded-xl text-neutral-500 hover:text-rose-400 hover:bg-rose-500/10 transition ios-press shrink-0"
                  title="Remove member"
                >
                  <Trash2 size={14} />
                </button>
              )}
            </div>
          ))
        )}
      </div>

      {/* Add Member Modal */}
      <AnimatePresence>
        {showAddMember && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/85 backdrop-blur-xl flex items-end sm:items-center justify-center p-3"
          >
            <motion.div
              initial={{ y: 60, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 40, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 380, damping: 30 }}
              className="w-full max-w-sm glass-panel rounded-3xl p-5 shadow-2xl flex flex-col gap-4 border border-white/[0.14] bg-[#0E0F14]"
            >
              <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
                <div>
                  <h3 className="text-sm font-semibold text-white">
                    {firm.institutionType === 'college' || firm.institutionType === 'school'
                      ? t('Add Student / Intern', 'छात्र / इंटर्न जोड़ें', 'विद्यार्थी जोडा')
                      : t('Add Firm Member', 'फर्म सदस्य जोड़ें', 'फर्म सदस्य जोडा')}
                  </h3>
                  <p className="text-[10px] text-neutral-400">
                    {t('Member receives initial login ID and temp password', 'सदस्य को लॉगिन क्रेडेंशियल प्राप्त होंगे', 'सदस्यास लॉगिन आयडी प्राप्त होईल')}
                  </p>
                </div>
                <button
                  onClick={() => setShowAddMember(false)}
                  className="w-7 h-7 rounded-full bg-white/[0.06] flex items-center justify-center text-neutral-400 hover:text-white"
                >
                  <X size={14} />
                </button>
              </div>

              <form onSubmit={handleAddMember} className="space-y-3">
                <div>
                  <label className="text-[11px] font-medium text-neutral-400 block mb-1">
                    {t('Full Name *', 'पूरा नाम *', 'पूर्ण नाव *')}
                  </label>
                  <input
                    type="text"
                    required
                    value={newMemberName}
                    onChange={(e) => setNewMemberName(e.target.value)}
                    placeholder="e.g. Adv. Priya Sharma / Student Name"
                    className="w-full bg-black/80 border border-white/[0.1] rounded-xl px-3 py-2 text-xs text-white placeholder-neutral-600 focus:outline-none focus:border-violet-400/40"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-medium text-neutral-400 block mb-1">
                    {t('Email Address *', 'ईमेल पता *', 'ईमेल पत्ता *')}
                  </label>
                  <input
                    type="email"
                    required
                    value={newMemberEmail}
                    onChange={(e) => setNewMemberEmail(e.target.value)}
                    placeholder="e.g. member@firmname.com"
                    className="w-full bg-black/80 border border-white/[0.1] rounded-xl px-3 py-2 text-xs text-white placeholder-neutral-600 focus:outline-none focus:border-violet-400/40 font-mono"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-medium text-neutral-400 block mb-1">
                    {t('Role / Designation', 'पद / भूमिका', 'भूमिका')}
                  </label>
                  <select
                    value={newMemberRole}
                    onChange={(e) => setNewMemberRole(e.target.value as any)}
                    style={{ backgroundColor: '#18181b', color: '#ffffff' }}
                    className="w-full bg-[#18181b] border border-white/[0.1] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-violet-400/40"
                  >
                    <option value="associate" style={{ backgroundColor: '#18181b', color: '#ffffff' }}>Associate Advocate</option>
                    <option value="junior" style={{ backgroundColor: '#18181b', color: '#ffffff' }}>Junior Advocate</option>
                    <option value="paralegal" style={{ backgroundColor: '#18181b', color: '#ffffff' }}>Paralegal / Clerk</option>
                    <option value="student" style={{ backgroundColor: '#18181b', color: '#ffffff' }}>Law Student / Intern</option>
                  </select>
                </div>

                <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-3 flex items-start gap-2">
                  <Key size={14} className="text-amber-300 shrink-0 mt-0.5" />
                  <p className="text-[10px] text-amber-200/90 leading-relaxed font-mono">
                    A secure temporary password will be created. On first login, the user is required to reset and change their password before progressing.
                  </p>
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowAddMember(false)}
                    className="flex-1 py-2.5 rounded-xl bg-white/[0.06] text-neutral-300 font-medium text-xs hover:bg-white/[0.1] transition ios-press"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isAdding}
                    className="flex-1 py-2.5 rounded-xl bg-violet-500 hover:bg-violet-400 text-white font-semibold text-xs transition ios-press shadow-md disabled:opacity-50"
                  >
                    {isAdding ? 'Adding...' : 'Add Member'}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
