import React, { useState } from 'react';
import { Sheet } from '../../design/ui/Sheet';
import { Button } from '../../design/ui/Button';
import { Language, UserRole } from '../../types';
import { Building2, GraduationCap, Lock, Mail, Loader2, ArrowLeft } from 'lucide-react';
import { FirmRegistration } from '../../components/firm/FirmRegistration';
import { MemberPasswordChange } from '../../components/firm/MemberPasswordChange';
import { findFirmMemberByEmail, updateMemberPasswordStatus, updateMemberPassword } from '../../services/firestoreService';
import { useAuth } from '../../contexts/AuthContext';

interface OtherSignInSheetProps {
  isOpen: boolean;
  onClose: () => void;
  language: Language;
  onSuccess: (role: UserRole) => void;
}

export const OtherSignInSheet: React.FC<OtherSignInSheetProps> = ({
  isOpen,
  onClose,
  language,
  onSuccess,
}) => {
  const { loginAsDemo } = useAuth();
  const [tab, setTab] = useState<'member' | 'firm' | 'password_change'>('member');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Pending password change state
  const [pendingMember, setPendingMember] = useState<any>(null);
  const [pendingFirmId, setPendingFirmId] = useState('');

  const handleMemberLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) return;
    setError('');
    setLoading(true);

    try {
      const result = await findFirmMemberByEmail(email.trim());
      if (!result) {
        setError(
          language === 'mr'
            ? 'सदस्य आढळला नाही. कृपया आपल्या फर्म व्यवस्थापकाशी संपर्क साधा.'
            : language === 'hi'
            ? 'सदस्य नहीं मिला। कृपया अपने फर्म प्रशासक से संपर्क करें।'
            : 'Member record not found. Please contact your law firm administrator.'
        );
        setLoading(false);
        return;
      }

      const { firmId, member } = result;
      if (member.tempPassword !== password && (member as any).password !== password) {
        setError(
          language === 'mr'
            ? 'चुकीचा पासवर्ड प्रविष्ट केला आहे.'
            : language === 'hi'
            ? 'गलत पासवर्ड दर्ज किया गया।'
            : 'Incorrect password entered.'
        );
        setLoading(false);
        return;
      }

      if (member.mustChangePassword) {
        setPendingMember(member);
        setPendingFirmId(firmId);
        setTab('password_change');
        setLoading(false);
        return;
      }

      // Successful login as lawyer/member
      onSuccess('lawyer');
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordChanged = async (newPassword: string) => {
    if (!pendingMember || !pendingFirmId) return;
    try {
      await updateMemberPassword(pendingFirmId, pendingMember.id, newPassword);
      await updateMemberPasswordStatus(pendingFirmId, pendingMember.id, false);
      onSuccess('lawyer');
      onClose();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <Sheet
      open={isOpen}
      onOpenChange={(open) => { if (!open) onClose(); }}
      title={
        tab === 'firm'
          ? (language === 'mr' ? 'लॉ फर्म किंवा कॉलेज नोंदणी' : language === 'hi' ? 'लॉ फर्म या कॉलेज पंजीकरण' : 'Register Law Firm / College')
          : tab === 'password_change'
          ? (language === 'mr' ? 'पासवर्ड बदला' : language === 'hi' ? 'पासवर्ड बदलें' : 'Change Temporary Password')
          : (language === 'mr' ? 'फर्म सदस्य व विद्यार्थी लॉगिन' : language === 'hi' ? 'फर्म सदस्य व छात्र लॉगिन' : 'Firm Member & Student Login')
      }
    >
      <div className="space-y-4 pt-2">
        {tab !== 'password_change' && (
          <div className="flex rounded-2xl bg-white/[0.05] p-1 border border-white/[0.08]">
            <button
              type="button"
              onClick={() => { setTab('member'); setError(''); }}
              className={`flex-1 py-2 rounded-xl text-xs font-semibold transition ${
                tab === 'member'
                  ? 'btn-ink shadow-sm'
                  : 'text-sub hover:text-main'
              }`}
            >
              {language === 'mr' ? 'सदस्य लॉगिन' : language === 'hi' ? 'सदस्य लॉगिन' : 'Member Login'}
            </button>
            <button
              type="button"
              onClick={() => { setTab('firm'); setError(''); }}
              className={`flex-1 py-2 rounded-xl text-xs font-semibold transition ${
                tab === 'firm'
                  ? 'btn-ink shadow-sm'
                  : 'text-sub hover:text-main'
              }`}
            >
              {language === 'mr' ? 'फर्म नोंदणी' : language === 'hi' ? 'फर्म पंजीकरण' : 'Register Firm'}
            </button>
          </div>
        )}

        {tab === 'member' && (
          <form onSubmit={handleMemberLogin} className="space-y-3.5">
            <p className="text-xs text-sub">
              {language === 'mr'
                ? 'आपल्या वरिष्ठ वकील किंवा कॉलेजने दिलेला अधिकृत ईमेल व तात्पुरता पासवर्ड प्रविष्ट करा.'
                : language === 'hi'
                ? 'अपने वरिष्ठ अधिवक्ता या कॉलेज द्वारा प्रदान किया गया आधिकारिक ईमेल और अस्थायी पासवर्ड दर्ज करें।'
                : 'Sign in with credentials assigned by your law firm chambers or university.'}
            </p>

            {/* Quick Demo Selector */}
            <div className="p-3 rounded-2xl bg-white/[0.03] border border-white/[0.08] space-y-2">
              <span className="text-[10px] font-mono text-amber-400 uppercase font-bold tracking-wider block">
                {language === 'mr' ? 'त्वरित डेमो प्रवेश' : language === 'hi' ? 'त्वरित डेमो प्रवेश' : '1-Click Demo Portals'}
              </span>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => {
                    loginAsDemo('firm');
                    onSuccess('lawyer');
                    onClose();
                  }}
                  className="p-2 rounded-xl bg-amber-400/10 hover:bg-amber-400/15 border border-amber-400/25 text-left text-xs font-semibold text-main transition flex items-center gap-2"
                >
                  <Building2 size={14} className="text-amber-300 shrink-0" />
                  <span className="truncate">Firm Chambers</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    loginAsDemo('student');
                    onSuccess('lawyer');
                    onClose();
                  }}
                  className="p-2 rounded-xl bg-purple-500/10 hover:bg-purple-500/15 border border-purple-500/25 text-left text-xs font-semibold text-main transition flex items-center gap-2"
                >
                  <GraduationCap size={14} className="text-purple-300 shrink-0" />
                  <span className="truncate">Student Intern</span>
                </button>
              </div>
            </div>

            {error && (
              <div className="p-3 rounded-2xl bg-red-500/10 border border-red-500/20 text-xs text-red-400">
                {error}
              </div>
            )}

            <div>
              <label className="text-xs font-semibold text-sub block mb-1">
                {language === 'mr' ? 'अधिकृत ईमेल' : language === 'hi' ? 'आधिकारिक ईमेल' : 'Official Email'}
              </label>
              <div className="flex items-center rounded-2xl bg-white/[0.05] border border-white/[0.1] px-3.5 h-12">
                <Mail size={16} className="text-amber-400 mr-2.5 shrink-0" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="associate@lawfirm.in"
                  className="flex-1 bg-transparent text-sm text-main outline-none"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-sub block mb-1">
                {language === 'mr' ? 'पासवर्ड' : language === 'hi' ? 'पासवर्ड' : 'Password'}
              </label>
              <div className="flex items-center rounded-2xl bg-white/[0.05] border border-white/[0.1] px-3.5 h-12">
                <Lock size={16} className="text-amber-400 mr-2.5 shrink-0" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="flex-1 bg-transparent text-sm text-main outline-none"
                />
              </div>
            </div>

            <div className="pt-2">
              <Button
                type="submit"
                variant="primary"
                size="md"
                disabled={loading}
                className="w-full h-12"
                icon={loading ? <Loader2 size={16} className="animate-spin" /> : undefined}
              >
                {loading
                  ? (language === 'mr' ? 'तपासत आहे...' : language === 'hi' ? 'जांच रहे हैं...' : 'Checking…')
                  : (language === 'mr' ? 'सदस्य म्हणून साइन इन करा' : language === 'hi' ? 'सदस्य के रूप में साइन इन करें' : 'Sign In as Member')}
              </Button>
            </div>
          </form>
        )}

        {tab === 'firm' && (
          <FirmRegistration
            language={language}
            onComplete={() => {
              onSuccess('lawyer');
              onClose();
            }}
            onBack={() => setTab('member')}
          />
        )}

        {tab === 'password_change' && (
          <MemberPasswordChange
            language={language}
            memberName={pendingMember?.name || 'Firm Member'}
            memberEmail={pendingMember?.email || ''}
            firmName="Law Firm Chambers"
            onPasswordChanged={handlePasswordChanged}
          />
        )}
      </div>
    </Sheet>
  );
};
