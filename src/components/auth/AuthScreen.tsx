import React, { useState } from 'react';
import {
  Scale, Phone, Mail, ChevronRight, Shield, Gavel, User,
  ArrowLeft, CheckCircle, AlertCircle, Camera, FileText,
  CheckCircle2, Upload, Trash2, Image as ImageIcon, Lock, Clock
} from 'lucide-react';
import { auth } from '../../lib/firebase';
import { useAuth } from '../../contexts/AuthContext';
import {
  createUserProfile,
  updateUserProfile,
  submitVerificationRequest,
  fetchPublicCourtCases,
  syncLawyerPublicCases
} from '../../services/firestoreService';
import { maskIdNumber } from '../../utils/masking';
import { compressImageFile } from '../../utils/imageUtils';
import { Language, UserProfile } from '../../types';

interface AuthScreenProps {
  language: Language;
  onSuccess: (role: 'lawyer' | 'client') => void;
}

const PRACTICE_AREAS = [
  'Criminal Law', 'Civil Law', 'Family Law', 'Corporate Law',
  'Property Law', 'Constitutional Law', 'Labour Law', 'Tax Law',
  'Consumer Law', 'IPR', 'Arbitration', 'Banking Law'
];

const INDIAN_STATES = [
  'Delhi', 'Maharashtra', 'Karnataka', 'Tamil Nadu', 'Uttar Pradesh',
  'Gujarat', 'West Bengal', 'Punjab', 'Rajasthan', 'Kerala',
  'Madhya Pradesh', 'Telangana', 'Andhra Pradesh', 'Bihar', 'Haryana'
];

const CITIZEN_AVATARS = [
  'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
];

const ADVOCATE_AVATARS = [
  'https://images.unsplash.com/photo-1556157382-97eda2d62296?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
];

type AuthStep = 
  | 'role_select'
  | 'phone_input'
  | 'otp_verify'
  | 'lawyer_registration'
  | 'client_profile'
  | 'success';

export function AuthScreen({ language, onSuccess }: AuthScreenProps) {
  const { signInWithGoogle, signInWithPhone, verifyOTP, user, profile, updateProfile } = useAuth();
  
  const [step, setStep] = useState<AuthStep>('role_select');
  const [selectedRole, setSelectedRole] = useState<'lawyer' | 'client'>('client');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [verificationId, setVerificationId] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Lawyer registration fields
  const [lawyerData, setLawyerData] = useState({
    name: '',
    barCouncilId: '',
    state: 'Delhi',
    city: 'New Delhi',
    education: 'Faculty of Law, University of Delhi — LL.B.',
    practiceAreas: ['Criminal Law', 'Civil Law'] as string[],
    experience: '7',
    bio: '',
    aibeCertificateNo: 'AIBE-XIV/2019/8821',
    languages: ['English', 'Hindi'],
    photoURL: ADVOCATE_AVATARS[0],
    idDocumentType: 'Bar Council Card' as const,
  });
  const [lawyerDocPhoto, setLawyerDocPhoto] = useState<string>('');
  const [uploadingLawyerDoc, setUploadingLawyerDoc] = useState<boolean>(false);

  // Client profile fields
  const [clientData, setClientData] = useState({
    name: '',
    email: '',
    city: 'New Delhi',
    photoURL: CITIZEN_AVATARS[0],
    idDocumentType: 'Aadhaar' as 'Aadhaar' | 'Voter ID' | 'Passport' | 'Driving License',
    idNumber: '',
  });
  const [clientDocPhoto, setClientDocPhoto] = useState<string>('');
  const [uploadingClientDoc, setUploadingClientDoc] = useState<boolean>(false);

  // Sync Google credentials into form
  React.useEffect(() => {
    if (user) {
      const gName = user.displayName || '';
      const gEmail = user.email || '';
      const gPhoto = user.photoURL || '';
      setLawyerData(prev => ({
        ...prev,
        name: prev.name || (gName.startsWith('Adv.') ? gName : (gName ? `Adv. ${gName}` : '')),
        photoURL: gPhoto || prev.photoURL
      }));
      setClientData(prev => ({
        ...prev,
        name: prev.name || gName,
        email: prev.email || gEmail,
        photoURL: gPhoto || prev.photoURL
      }));
    }
  }, [user]);

  const t = (en: string, hi: string) => language === 'hi' ? hi : en;

  const handleGoogleSignIn = async () => {
    setLoading(true);
    setError('');
    try {
      await signInWithGoogle();
      if (auth.currentUser) {
        const gName = auth.currentUser.displayName || '';
        const gEmail = auth.currentUser.email || '';
        const gPhoto = auth.currentUser.photoURL || '';
        if (selectedRole === 'lawyer') {
          setLawyerData(prev => ({ ...prev, name: gName ? `Adv. ${gName}` : prev.name, photoURL: gPhoto || prev.photoURL }));
        } else {
          setClientData(prev => ({ ...prev, name: gName || prev.name, email: gEmail || prev.email, photoURL: gPhoto || prev.photoURL }));
        }
      }
      setStep(selectedRole === 'lawyer' ? 'lawyer_registration' : 'client_profile');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Sign-in failed';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const handlePhoneSubmit = async () => {
    if (!phone || phone.length < 10) {
      setError(t('Enter a valid phone number', 'सही फ़ोन नंबर दर्ज करें'));
      return;
    }
    setLoading(true);
    setError('');
    try {
      const formattedPhone = phone.startsWith('+91') ? phone : `+91${phone}`;
      const vid = await signInWithPhone(formattedPhone);
      setVerificationId(vid);
      setStep('otp_verify');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to send OTP';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const handleOTPVerify = async () => {
    if (!otp || otp.length !== 6) {
      setError(t('Enter 6-digit OTP', '6 अंकों का OTP दर्ज करें'));
      return;
    }
    setLoading(true);
    setError('');
    try {
      await verifyOTP(verificationId, otp);
      setStep(selectedRole === 'lawyer' ? 'lawyer_registration' : 'client_profile');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'OTP verification failed';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const handleLawyerDocFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setUploadingLawyerDoc(true);
      const dataUrl = await compressImageFile(file);
      setLawyerDocPhoto(dataUrl);
    } catch (err) {
      console.warn("Error compressing lawyer doc image:", err);
    } finally {
      setUploadingLawyerDoc(false);
    }
  };

  const handleClientDocFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setUploadingClientDoc(true);
      const dataUrl = await compressImageFile(file);
      setClientDocPhoto(dataUrl);
    } catch (err) {
      console.warn("Error compressing client doc image:", err);
    } finally {
      setUploadingClientDoc(false);
    }
  };

  const handleSkipClientOnboarding = async () => {
    setLoading(true);
    setError('');
    try {
      const uid = user?.uid || `client-${Date.now()}`;
      const profileData: Partial<UserProfile> = {
        uid,
        role: 'client',
        name: clientData.name || user?.displayName || 'Citizen User',
        phone: phone || user?.phoneNumber || '+91 98765 43210',
        email: clientData.email || user?.email || '',
        photoURL: clientData.photoURL,
        city: clientData.city || 'New Delhi',
        verificationStatus: 'not_submitted',
        onboardingCompleted: true,
      };
      
      if (user) {
        await updateUserProfile(uid, profileData);
      } else {
        await createUserProfile(uid, profileData as any);
      }

      updateProfile(profileData as any);
      onSuccess('client');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Skipping failed';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const handleLawyerRegistration = async () => {
    if (!lawyerData.name || !lawyerData.barCouncilId || !lawyerData.state || lawyerData.practiceAreas.length === 0) {
      setError(t('Please fill all required fields', 'सभी आवश्यक फ़ील्ड भरें'));
      return;
    }
    setLoading(true);
    setError('');
    try {
      const uid = user?.uid || `adv-${Date.now()}`;
      
      // Fetch initial public eCourts cases automatically
      const publicCases = await fetchPublicCourtCases(lawyerData.barCouncilId, lawyerData.name);

      const profileData: Partial<UserProfile> = {
        uid,
        role: 'lawyer',
        name: lawyerData.name.startsWith('Adv.') ? lawyerData.name : `Adv. ${lawyerData.name}`,
        phone: phone || user?.phoneNumber || '+91 98110 00000',
        email: user?.email || '',
        photoURL: lawyerData.photoURL,
        barCouncilId: lawyerData.barCouncilId,
        aibeCertificateNo: lawyerData.aibeCertificateNo,
        state: lawyerData.state,
        city: lawyerData.city || 'New Delhi',
        education: [lawyerData.education || 'Faculty of Law, University of Delhi — LL.B.'],
        practiceCourts: [`${lawyerData.state} High Court`, 'District & Sessions Court', 'Supreme Court of India'],
        practiceAreas: lawyerData.practiceAreas,
        experience: parseInt(lawyerData.experience) || 5,
        bio: lawyerData.bio || 'Advocate practicing before High Court and District Courts.',
        languages: lawyerData.languages,
        verificationStatus: 'pending',
        onboardingCompleted: true,
        idDocumentType: 'Bar Council Card',
        idDocumentUrl: lawyerDocPhoto || undefined,
        rating: 4.9,
        totalCases: publicCases.length,
        publicCases,
      };
      
      if (user) {
        await updateUserProfile(uid, profileData);
      } else {
        await createUserProfile(uid, profileData as any);
      }

      // Submit verification approval request to administrator (pradhumb1998@gmail.com)
      await submitVerificationRequest({
        uid,
        role: 'lawyer',
        name: lawyerData.name,
        email: user?.email || '',
        phone: phone || user?.phoneNumber || '',
        documentType: 'Bar Council Identity Card',
        documentUrl: lawyerDocPhoto || undefined,
        barCouncilId: lawyerData.barCouncilId,
      });

      updateProfile(profileData as any);
      setStep('success');
      setTimeout(() => onSuccess('lawyer'), 1600);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Registration failed';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const handleClientProfile = async () => {
    if (!clientData.name) {
      setError(t('Please enter your name', 'कृपया अपना नाम दर्ज करें'));
      return;
    }
    setLoading(true);
    setError('');
    try {
      const uid = user?.uid || `client-${Date.now()}`;
      const masked = clientData.idNumber ? maskIdNumber(clientData.idDocumentType, clientData.idNumber) : undefined;
      const profileData: Partial<UserProfile> = {
        uid,
        role: 'client',
        name: clientData.name,
        phone: phone || user?.phoneNumber || '+91 98765 43210',
        email: clientData.email || user?.email || '',
        photoURL: clientData.photoURL,
        city: clientData.city || 'New Delhi',
        verificationStatus: 'pending',
        onboardingCompleted: true,
        idDocumentType: clientData.idDocumentType,
        idDocumentUrl: clientDocPhoto || undefined,
        idDocumentNumberMasked: masked,
      };
      
      if (user) {
        await updateUserProfile(uid, profileData);
      } else {
        await createUserProfile(uid, profileData as any);
      }

      // Submit verification approval request to administrator (pradhumb1998@gmail.com)
      await submitVerificationRequest({
        uid,
        role: 'client',
        name: clientData.name,
        email: clientData.email || user?.email || '',
        phone: phone || user?.phoneNumber || '',
        documentType: `${clientData.idDocumentType} ${masked ? `(${masked})` : ''}`,
        documentUrl: clientDocPhoto || undefined,
        maskedIdNumber: masked,
        govIdType: clientData.idDocumentType,
      });

      updateProfile(profileData as any);
      setStep('success');
      setTimeout(() => onSuccess('client'), 1600);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Profile creation failed';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const togglePracticeArea = (area: string) => {
    setLawyerData(prev => ({
      ...prev,
      practiceAreas: prev.practiceAreas.includes(area)
        ? prev.practiceAreas.filter(a => a !== area)
        : [...prev.practiceAreas, area]
    }));
  };

  return (
    <div className="min-h-full bg-black flex flex-col">
      {/* Logo Header */}
      <div className="flex-shrink-0 px-6 pt-12 pb-6 text-center">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-b from-neutral-800/80 to-neutral-900 border border-white/[0.14] flex items-center justify-center mx-auto mb-4 shadow-[0_0_30px_rgba(245,197,99,0.15)] rim-card">
          <Scale className="w-8 h-8 text-amber-300" strokeWidth={1.8} />
        </div>
        <h1 className="text-3xl font-extrabold text-white tracking-tight font-display">NAYANEETI</h1>
        <p className="text-neutral-400 text-xs mt-1 tracking-wide font-mono uppercase">
          {t('Legal Operating System', 'विधिक ऑपरेटिंग सिस्टम')}
        </p>
      </div>

      {/* Content Area */}
      <div className="flex-1 px-6 overflow-y-auto pb-8">

        {/* Step: Role Select */}
        {step === 'role_select' && (
          <div className="space-y-4 animate-fadeIn">
            <p className="text-white/70 text-center text-sm mb-6">
              {t('Choose your account type to proceed', 'जारी रखने के लिए अपना खाता प्रकार चुनें')}
            </p>

            {/* Role Cards */}
            <button
              onClick={() => {
                setSelectedRole('client');
                setStep(user ? 'client_profile' : 'phone_input');
              }}
              className="w-full glass-card rounded-2xl p-5 flex items-center gap-4 ios-press border-2 border-transparent hover:border-emerald-500/40 transition-all"
            >
              <div className="w-12 h-12 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center flex-shrink-0">
                <User className="w-6 h-6 text-emerald-400" />
              </div>
              <div className="text-left flex-1">
                <p className="text-white font-semibold">{t('I\'m a Citizen / Client', 'मैं एक नागरिक / मुवक्किल हूं')}</p>
                <p className="text-white/50 text-xs mt-0.5">{t('Get legal help, consult AI, engage verified advocates', 'कानूनी सहायता पाएं, AI से पूछें, वकील नियुक्त करें')}</p>
              </div>
              <ChevronRight className="w-5 h-5 text-white/30" />
            </button>

            <button
              onClick={() => {
                setSelectedRole('lawyer');
                setStep(user ? 'lawyer_registration' : 'phone_input');
              }}
              className="w-full glass-card rounded-2xl p-5 flex items-center gap-4 ios-press border-2 border-transparent hover:border-amber-400/40 transition-all"
            >
              <div className="w-12 h-12 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center flex-shrink-0">
                <Gavel className="w-6 h-6 text-amber-300" />
              </div>
              <div className="text-left flex-1">
                <p className="text-white font-semibold">{t('I\'m an Advocate / Lawyer', 'मैं एक अधिवक्ता / वकील हूं')}</p>
                <p className="text-white/50 text-xs mt-0.5">{t('Manage cause list, case diary, eCourts dockets & clients', 'केस डायरी, वाद सूची, eCourts डॉकेट्स प्रबंधित करें')}</p>
              </div>
              <ChevronRight className="w-5 h-5 text-white/30" />
            </button>

            {!user && (
              <div className="pt-2">
                <div className="relative flex items-center gap-3 my-3">
                  <div className="flex-1 h-px bg-white/10" />
                  <span className="text-white/30 text-xs">{t('or sign in directly', 'या सीधे लॉगिन करें')}</span>
                  <div className="flex-1 h-px bg-white/10" />
                </div>
                <button
                  onClick={handleGoogleSignIn}
                  disabled={loading}
                  className="w-full glass-card border border-white/10 rounded-2xl py-3.5 flex items-center justify-center gap-3 ios-press text-white font-medium text-sm hover:bg-white/[0.08]"
                >
                  <Mail className="w-5 h-5" />
                  <span>{t('Continue with Google', 'Google से जारी रखें')}</span>
                </button>
              </div>
            )}

            {/* Trust Badge */}
            <div className="flex items-center justify-center gap-2 mt-6 text-white/40 text-xs">
              <Shield className="w-4 h-4" />
              <span>{t('BCI Compliant · DPDP Act 2023 Secure · Private', 'BCI अनुपालित · DPDP अधिनियम 2023 सुरक्षित')}</span>
            </div>
          </div>
        )}

        {/* Step: Phone Input */}
        {step === 'phone_input' && (
          <div className="space-y-6 animate-fadeIn">
            <button onClick={() => setStep('role_select')} className="flex items-center gap-2 text-white/50 text-sm ios-press">
              <ArrowLeft className="w-4 h-4" />
              {t('Back', 'वापस')}
            </button>
            
            <div>
              <h2 className="text-2xl font-bold text-white">
                {t('Enter your number', 'अपना नंबर दर्ज करें')}
              </h2>
              <p className="text-white/50 text-sm mt-1">
                {t("We'll send you a verification code", 'हम आपको एक सत्यापन कोड भेजेंगे')}
              </p>
            </div>

            <div className="glass-card rounded-2xl overflow-hidden border border-white/10">
              <div className="flex items-center">
                <div className="px-4 py-4 border-r border-white/10 text-white font-medium text-sm">🇮🇳 +91</div>
                <input
                  type="tel"
                  value={phone}
                  onChange={e => setPhone(e.target.value.replace(/\D/g, ''))}
                  placeholder={t('10-digit mobile number', '10 अंकों का मोबाइल नंबर')}
                  maxLength={10}
                  className="flex-1 bg-transparent px-4 py-4 text-white placeholder-white/30 outline-none text-sm"
                />
              </div>
            </div>

            {error && (
              <div className="flex items-center gap-2 text-red-400 text-sm">
                <AlertCircle className="w-4 h-4" />
                {error}
              </div>
            )}

            <button
              onClick={handlePhoneSubmit}
              disabled={loading || phone.length < 10}
              className="w-full bg-white text-black font-semibold py-4 rounded-2xl ios-press disabled:opacity-40 text-sm"
            >
              {loading ? t('Sending OTP...', 'OTP भेज रहे हैं...') : t('Send OTP', 'OTP भेजें')}
            </button>

            <div className="relative flex items-center gap-3">
              <div className="flex-1 h-px bg-white/10" />
              <span className="text-white/30 text-xs">{t('or', 'या')}</span>
              <div className="flex-1 h-px bg-white/10" />
            </div>

            <button
              onClick={handleGoogleSignIn}
              disabled={loading}
              className="w-full glass-card border border-white/10 rounded-2xl py-4 flex items-center justify-center gap-3 ios-press text-white font-medium text-sm"
            >
              <Mail className="w-5 h-5" />
              {t('Continue with Google', 'Google से जारी रखें')}
            </button>
          </div>
        )}

        {/* Step: OTP Verify */}
        {step === 'otp_verify' && (
          <div className="space-y-6 animate-fadeIn">
            <button onClick={() => setStep('phone_input')} className="flex items-center gap-2 text-white/50 text-sm ios-press">
              <ArrowLeft className="w-4 h-4" />
              {t('Back', 'वापस')}
            </button>
            
            <div>
              <h2 className="text-2xl font-bold text-white">{t('Enter OTP', 'OTP दर्ज करें')}</h2>
              <p className="text-white/50 text-sm mt-1">
                {t(`Sent to +91 ${phone}`, `+91 ${phone} पर भेजा गया`)}
              </p>
            </div>

            {/* OTP Input */}
            <div className="glass-card rounded-2xl overflow-hidden border border-white/10">
              <input
                type="number"
                value={otp}
                onChange={e => setOtp(e.target.value.slice(0, 6))}
                placeholder="000000"
                className="w-full bg-transparent px-6 py-5 text-white text-2xl font-bold tracking-widest placeholder-white/20 outline-none text-center"
              />
            </div>

            {error && (
              <div className="flex items-center gap-2 text-red-400 text-sm">
                <AlertCircle className="w-4 h-4" />
                {error}
              </div>
            )}

            <button
              onClick={handleOTPVerify}
              disabled={loading || otp.length !== 6}
              className="w-full bg-white text-black font-semibold py-4 rounded-2xl ios-press disabled:opacity-40 text-sm"
            >
              {loading ? t('Verifying...', 'सत्यापित कर रहे हैं...') : t('Verify OTP', 'OTP सत्यापित करें')}
            </button>

            <button onClick={() => setOtp('')} className="w-full text-white/50 text-sm ios-press py-2">
              {t('Resend OTP', 'OTP पुनः भेजें')}
            </button>
          </div>
        )}

        {/* Step: Lawyer Registration */}
        {step === 'lawyer_registration' && (
          <div className="space-y-5 animate-fadeIn">
            <button onClick={() => setStep('phone_input')} className="flex items-center gap-2 text-white/50 text-sm ios-press">
              <ArrowLeft className="w-4 h-4" />
              {t('Back', 'वापस')}
            </button>

            <div>
              <h2 className="text-2xl font-bold text-white">{t('Advocate Profile', 'अधिवक्ता प्रोफ़ाइल')}</h2>
              <p className="text-white/50 text-sm mt-1">{t('Complete your professional credentials & profile', 'अपनी व्यावसायिक साख और प्रोफ़ाइल पूरी करें')}</p>
            </div>

            {/* Profile Picture Selection */}
            <div className="glass-card rounded-2xl p-4 border border-white/10 space-y-3">
              <label className="text-white/80 text-xs font-semibold flex items-center gap-1.5">
                <Camera className="w-4 h-4 text-amber-300" />
                <span>{t('Profile Picture', 'प्रोफ़ाइल फ़ोटो')}</span>
              </label>
              <div className="flex items-center gap-4">
                <img
                  src={lawyerData.photoURL}
                  alt="Lawyer Preview"
                  className="w-14 h-14 rounded-2xl object-cover border-2 border-amber-400/50 shadow-md"
                />
                <div className="flex-1 space-y-1.5">
                  <p className="text-[11px] text-white/50">{t('Choose an avatar or paste custom photo link', 'अवतार चुनें या फ़ोटो लिंक दर्ज करें')}</p>
                  <div className="flex items-center gap-2">
                    {ADVOCATE_AVATARS.map((url, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => setLawyerData(prev => ({ ...prev, photoURL: url }))}
                        className={`w-8 h-8 rounded-xl overflow-hidden border-2 transition ios-press ${
                          lawyerData.photoURL === url ? 'border-amber-400 scale-105' : 'border-white/20 opacity-60'
                        }`}
                      >
                        <img src={url} alt="Avatar" className="w-full h-full object-cover" />
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Basic Info */}
            {[
              { label: t('Full Name *', 'पूरा नाम *'), key: 'name', type: 'text', placeholder: t('Adv. Rajesh Kumar', 'अधि. राजेश कुमार') },
              { label: t('Bar Council Enrollment No. *', 'बार काउंसिल नामांकन संख्या *'), key: 'barCouncilId', type: 'text', placeholder: 'DL/1482/2015' },
              { label: t('Law Degree & University/College *', 'विधि डिग्री एवं कॉलेज *'), key: 'education', type: 'text', placeholder: 'Faculty of Law, University of Delhi — LL.B.' },
              { label: t('City of Practice *', 'अभ्यास का शहर *'), key: 'city', type: 'text', placeholder: 'New Delhi' },
              { label: t('AIBE Certificate / Roll No.', 'AIBE प्रमाण पत्र संख्या'), key: 'aibeCertificateNo', type: 'text', placeholder: 'AIBE-XIV/2019/8821' },
              { label: t('Years of Active Practice *', 'सक्रिय अभ्यास के वर्ष *'), key: 'experience', type: 'number', placeholder: '7' },
            ].map(field => (
              <div key={field.key}>
                <label className="text-white/60 text-xs font-medium mb-1.5 block">{field.label}</label>
                <input
                  type={field.type}
                  value={(lawyerData as unknown as Record<string, string>)[field.key]}
                  onChange={e => setLawyerData(prev => ({ ...prev, [field.key]: e.target.value }))}
                  placeholder={field.placeholder}
                  className="w-full glass-card rounded-xl px-4 py-3 text-white placeholder-white/30 outline-none text-sm border border-white/10 focus:border-white/30 transition-colors"
                />
              </div>
            ))}

            {/* State Picker */}
            <div>
              <label className="text-white/60 text-xs font-medium mb-1.5 block">{t('State Bar Council *', 'राज्य बार काउंसिल *')}</label>
              <select
                value={lawyerData.state}
                onChange={e => setLawyerData(prev => ({ ...prev, state: e.target.value }))}
                style={{ backgroundColor: '#18181b', color: '#ffffff' }}
                className="w-full rounded-xl px-4 py-3 text-white outline-none text-sm border border-white/10 focus:border-white/30 transition-colors bg-[#18181b]"
              >
                <option value="" style={{ backgroundColor: '#18181b', color: '#ffffff' }}>{t('Select State', 'राज्य चुनें')}</option>
                {INDIAN_STATES.map(s => (
                  <option key={s} value={s} style={{ backgroundColor: '#18181b', color: '#ffffff' }}>
                    {s}
                  </option>
                ))}
              </select>
            </div>

            {/* Practice Areas */}
            <div>
              <label className="text-white/60 text-xs font-medium mb-2 block">{t('Practice Areas * (select all that apply)', 'प्रैक्टिस क्षेत्र * (सभी लागू चुनें)')}</label>
              <div className="flex flex-wrap gap-2">
                {PRACTICE_AREAS.map(area => (
                  <button
                    key={area}
                    type="button"
                    onClick={() => togglePracticeArea(area)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium ios-press transition-all ${
                      lawyerData.practiceAreas.includes(area)
                        ? 'bg-amber-300 text-black font-semibold'
                        : 'glass-card border border-white/10 text-white/70'
                    }`}
                  >
                    {area}
                  </button>
                ))}
              </div>
            </div>

            {/* Bio */}
            <div>
              <label className="text-white/60 text-xs font-medium mb-1.5 block">{t('Brief Bio', 'संक्षिप्त परिचय')}</label>
              <textarea
                value={lawyerData.bio}
                onChange={e => setLawyerData(prev => ({ ...prev, bio: e.target.value }))}
                placeholder={t('Brief about your practice, reported judgments, and expertise...', 'अपनी प्रैक्टिस के बारे में...')}
                rows={3}
                className="w-full glass-card rounded-xl px-4 py-3 text-white placeholder-white/30 outline-none text-sm border border-white/10 focus:border-white/30 transition-colors resize-none"
              />
            </div>

            {/* Bar Council ID Card / Certificate Photo Upload */}
            <div className="glass-card rounded-2xl p-4 border border-white/10 space-y-3">
              <label className="text-white/80 text-xs font-semibold flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Camera className="w-4 h-4 text-amber-300" />
                  <span>{t('Bar Council ID Card / Certificate Photo', 'बार काउंसिल आईडी कार्ड / प्रमाण पत्र फ़ोटो')}</span>
                </span>
                <span className="text-[10px] text-amber-300/80 font-mono font-normal">Optional / Recommended</span>
              </label>

              {lawyerDocPhoto ? (
                <div className="relative rounded-xl overflow-hidden border border-amber-400/40 bg-black/50 p-2 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <img
                      src={lawyerDocPhoto}
                      alt="Bar Council ID"
                      className="w-16 h-12 rounded-lg object-cover border border-white/10 shadow"
                    />
                    <div>
                      <p className="text-xs font-medium text-white">{t('Document photo uploaded', 'दस्तावेज़ फ़ोटो अपलोड हो गया')}</p>
                      <p className="text-[10px] text-emerald-400 flex items-center gap-1 mt-0.5">
                        <CheckCircle2 size={10} />
                        <span>Ready for admin review</span>
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setLawyerDocPhoto('')}
                    className="p-1.5 rounded-lg bg-white/[0.08] hover:bg-rose-500/20 text-neutral-400 hover:text-rose-400 transition"
                    title="Remove Photo"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ) : (
                <label className="border-2 border-dashed border-white/15 hover:border-amber-400/50 rounded-xl p-4 flex flex-col items-center justify-center gap-2 cursor-pointer transition bg-white/[0.02] hover:bg-amber-400/[0.03]">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleLawyerDocFileChange}
                    className="hidden"
                    disabled={uploadingLawyerDoc}
                  />
                  <div className="w-9 h-9 rounded-xl bg-amber-400/15 flex items-center justify-center text-amber-300">
                    <Upload size={18} className={uploadingLawyerDoc ? "animate-bounce" : ""} />
                  </div>
                  <div className="text-center">
                    <p className="text-xs font-medium text-white">
                      {uploadingLawyerDoc ? t('Processing Image...', 'प्रोसेसिंग...') : t('Upload Photo of Bar Council Card', 'बार काउंसिल कार्ड की फ़ोटो अपलोड करें')}
                    </p>
                    <p className="text-[10px] text-neutral-400 mt-0.5">
                      JPG, PNG, or photo from camera
                    </p>
                  </div>
                </label>
              )}
            </div>

            {/* Directory Verification Policy Notice */}
            <div className="glass-card rounded-2xl p-4 border border-amber-500/20 bg-amber-500/[0.04] space-y-2">
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-amber-300 flex-shrink-0" />
                <span className="text-amber-200 text-xs font-semibold">{t('Directory Visibility Policy', 'निर्देशिका दृश्यता नीति')}</span>
              </div>
              <p className="text-neutral-300 text-xs leading-relaxed">
                {t(
                  'Your profile is submitted for Bar Council verification. You can manage your practice, cases, and diary right away, but your public profile will remain invisible in the directory until approved.',
                  'आपकी प्रोफ़ाइल बार काउंसिल सत्यापन के लिए जमा की गई है। आप तुरंत अपने अभ्यास और केस डायरी का प्रबंधन कर सकते हैं, लेकिन स्वीकृत होने तक आपकी सार्वजनिक प्रोफ़ाइल निर्देशिका में अदृश्य रहेगी।'
                )}
              </p>
            </div>

            {error && (
              <div className="flex items-center gap-2 text-red-400 text-sm">
                <AlertCircle className="w-4 h-4" />
                {error}
              </div>
            )}

            <button
              onClick={handleLawyerRegistration}
              disabled={loading}
              className="w-full bg-white text-black font-semibold py-4 rounded-2xl ios-press disabled:opacity-40 text-sm shadow-xl hover:bg-neutral-200 transition"
            >
              {loading ? t('Configuring Practice OS...', 'प्रैक्टिस OS सेट कर रहे हैं...') : t('Complete Registration & Enter', 'पंजीकरण पूरा करें और प्रवेश करें')}
            </button>
          </div>
        )}

        {/* Step: Client Profile */}
        {step === 'client_profile' && (
          <div className="space-y-5 animate-fadeIn">
            <button onClick={() => setStep('phone_input')} className="flex items-center gap-2 text-white/50 text-sm ios-press">
              <ArrowLeft className="w-4 h-4" />
              {t('Back', 'वापस')}
            </button>

            <div>
              <h2 className="text-2xl font-bold text-white">{t('Citizen Profile & Verification', 'नागरिक प्रोफ़ाइल एवं सत्यापन')}</h2>
              <p className="text-white/50 text-sm mt-1">{t('Just a few details to get started securely', 'शुरू करने के लिए बस कुछ विवरण')}</p>
            </div>

            {/* Profile Picture Selection */}
            <div className="glass-card rounded-2xl p-4 border border-white/10 space-y-3">
              <label className="text-white/80 text-xs font-semibold flex items-center gap-1.5">
                <Camera className="w-4 h-4 text-emerald-400" />
                <span>{t('Profile Picture', 'प्रोफ़ाइल फ़ोटो')}</span>
              </label>
              <div className="flex items-center gap-4">
                <img
                  src={clientData.photoURL}
                  alt="Citizen Preview"
                  className="w-14 h-14 rounded-2xl object-cover border-2 border-emerald-400/50 shadow-md"
                />
                <div className="flex-1 space-y-1.5">
                  <p className="text-[11px] text-white/50">{t('Choose your avatar', 'अपना अवतार चुनें')}</p>
                  <div className="flex items-center gap-2">
                    {CITIZEN_AVATARS.map((url, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => setClientData(prev => ({ ...prev, photoURL: url }))}
                        className={`w-8 h-8 rounded-xl overflow-hidden border-2 transition ios-press ${
                          clientData.photoURL === url ? 'border-emerald-400 scale-105' : 'border-white/20 opacity-60'
                        }`}
                      >
                        <img src={url} alt="Avatar" className="w-full h-full object-cover" />
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div>
              <label className="text-white/60 text-xs font-medium mb-1.5 block">{t('Your Full Name *', 'आपका पूरा नाम *')}</label>
              <input
                type="text"
                value={clientData.name}
                onChange={e => setClientData(prev => ({ ...prev, name: e.target.value }))}
                placeholder={t('Ramesh Sharma', 'रमेश शर्मा')}
                className="w-full glass-card rounded-xl px-4 py-3 text-white placeholder-white/30 outline-none text-sm border border-white/10 focus:border-white/30 transition-colors"
              />
            </div>

            <div>
              <label className="text-white/60 text-xs font-medium mb-1.5 block">{t('Email Address', 'ईमेल पता')}</label>
              <input
                type="email"
                value={clientData.email}
                onChange={e => setClientData(prev => ({ ...prev, email: e.target.value }))}
                placeholder="name@gmail.com"
                className="w-full glass-card rounded-xl px-4 py-3 text-white placeholder-white/30 outline-none text-sm border border-white/10 focus:border-white/30 transition-colors"
              />
            </div>

            <div>
              <label className="text-white/60 text-xs font-medium mb-1.5 block">{t('City / Residence', 'शहर / निवास स्थान')}</label>
              <input
                type="text"
                value={clientData.city}
                onChange={e => setClientData(prev => ({ ...prev, city: e.target.value }))}
                placeholder="e.g. New Delhi, Mumbai, Bengaluru"
                className="w-full glass-card rounded-xl px-4 py-3 text-white placeholder-white/30 outline-none text-sm border border-white/10 focus:border-white/30 transition-colors"
              />
            </div>

            {/* Government ID Selection */}
            <div className="glass-card rounded-2xl p-4 border border-white/10 space-y-3">
              <label className="text-white/80 text-xs font-semibold flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-emerald-400" />
                <span>{t('Identity Verification Document (Any Govt ID)', 'पहचान सत्यापन दस्तावेज़')}</span>
              </label>
              <div className="grid grid-cols-2 gap-2">
                {(['Aadhaar', 'Voter ID', 'Passport', 'Driving License'] as const).map(idType => (
                  <button
                    key={idType}
                    type="button"
                    onClick={() => setClientData(prev => ({ ...prev, idDocumentType: idType }))}
                    className={`py-2 px-3 rounded-xl text-xs font-medium transition ios-press border ${
                      clientData.idDocumentType === idType
                        ? 'bg-white text-black border-white'
                        : 'bg-white/[0.04] text-neutral-300 border-white/[0.08]'
                    }`}
                  >
                    {idType}
                  </button>
                ))}
              </div>

              <div>
                <label className="text-white/50 text-[11px] block mt-2 mb-1">
                  {t(`${clientData.idDocumentType} Number (for verification request)`, `${clientData.idDocumentType} नंबर`)}
                </label>
                <input
                  type="text"
                  value={clientData.idNumber}
                  onChange={e => setClientData(prev => ({ ...prev, idNumber: e.target.value }))}
                  placeholder={clientData.idDocumentType === 'Aadhaar' ? 'XXXX-XXXX-XXXX' : 'e.g. DL-04201100123'}
                  className="w-full bg-black/40 rounded-xl px-3 py-2.5 text-white placeholder-white/30 outline-none text-xs border border-white/10"
                />
              </div>
            </div>

            {/* ID Document Photo Upload */}
            <div className="glass-card rounded-2xl p-4 border border-white/10 space-y-3">
              <label className="text-white/80 text-xs font-semibold flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Camera className="w-4 h-4 text-emerald-400" />
                  <span>{t(`Upload Photo of ${clientData.idDocumentType}`, `${clientData.idDocumentType} की फ़ोटो अपलोड करें`)}</span>
                </span>
                <span className="text-[10px] text-emerald-400/80 font-mono font-normal">Optional</span>
              </label>

              {clientDocPhoto ? (
                <div className="relative rounded-xl overflow-hidden border border-emerald-400/40 bg-black/50 p-2 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <img
                      src={clientDocPhoto}
                      alt="Govt ID"
                      className="w-16 h-12 rounded-lg object-cover border border-white/10 shadow"
                    />
                    <div>
                      <p className="text-xs font-medium text-white">{t('Document photo uploaded', 'दस्तावेज़ फ़ोटो अपलोड हो गया')}</p>
                      <p className="text-[10px] text-emerald-400 flex items-center gap-1 mt-0.5">
                        <CheckCircle2 size={10} />
                        <span>Ready for admin review</span>
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setClientDocPhoto('')}
                    className="p-1.5 rounded-lg bg-white/[0.08] hover:bg-rose-500/20 text-neutral-400 hover:text-rose-400 transition"
                    title="Remove Photo"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ) : (
                <label className="border-2 border-dashed border-white/15 hover:border-emerald-400/50 rounded-xl p-4 flex flex-col items-center justify-center gap-2 cursor-pointer transition bg-white/[0.02] hover:bg-emerald-400/[0.03]">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleClientDocFileChange}
                    className="hidden"
                    disabled={uploadingClientDoc}
                  />
                  <div className="w-9 h-9 rounded-xl bg-emerald-400/15 flex items-center justify-center text-emerald-300">
                    <Upload size={18} className={uploadingClientDoc ? "animate-bounce" : ""} />
                  </div>
                  <div className="text-center">
                    <p className="text-xs font-medium text-white">
                      {uploadingClientDoc ? t('Processing Image...', 'प्रोसेसिंग...') : t(`Upload ${clientData.idDocumentType} Photo`, `${clientData.idDocumentType} फ़ोटो अपलोड करें`)}
                    </p>
                    <p className="text-[10px] text-neutral-400 mt-0.5">
                      Clear picture of front of card
                    </p>
                  </div>
                </label>
              )}
            </div>

            {error && (
              <div className="flex items-center gap-2 text-red-400 text-sm">
                <AlertCircle className="w-4 h-4" />
                {error}
              </div>
            )}

            <div className="space-y-2.5 pt-1">
              <button
                onClick={handleClientProfile}
                disabled={loading}
                className="w-full bg-white text-black font-semibold py-4 rounded-2xl ios-press disabled:opacity-40 text-sm shadow-xl hover:bg-neutral-200 transition"
              >
                {loading ? t('Setting up Citizen Portal...', 'पोर्टल सेट कर रहे हैं...') : t('Submit & Get Started', 'जमा करें और शुरू करें')}
              </button>

              <button
                type="button"
                onClick={handleSkipClientOnboarding}
                disabled={loading}
                className="w-full py-3 rounded-2xl bg-white/[0.05] hover:bg-white/[0.1] text-neutral-300 font-medium text-xs ios-press transition border border-white/10 flex items-center justify-center gap-1.5"
              >
                <Clock size={13} className="text-neutral-400" />
                <span>{t('Setup Later / Skip for now', 'बाद में सेटअप करें / अभी छोड़ें')}</span>
              </button>
            </div>
          </div>
        )}

        {/* Step: Success */}
        {step === 'success' && (
          <div className="flex flex-col items-center justify-center min-h-64 space-y-4 animate-fadeIn">
            <div className="w-20 h-20 rounded-full bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center">
              <CheckCircle className="w-10 h-10 text-emerald-400" />
            </div>
            <h2 className="text-2xl font-bold text-white text-center">
              {selectedRole === 'lawyer'
                ? t('Registration Submitted!', 'पंजीकरण जमा किया!')
                : t('Welcome to NAYANEETI!', 'NAYANEETI में आपका स्वागत है!')
              }
            </h2>
            <p className="text-white/50 text-sm text-center max-w-xs">
              {selectedRole === 'lawyer'
                ? t('Advocate profile configured! Your practice dashboard is ready to use.', 'अधिवक्ता प्रोफ़ाइल सेट हो गई! आपका अभ्यास डैशबोर्ड उपयोग के लिए तैयार है।')
                : t('Account setup complete! Welcome to NAYANEETI.', 'खाता सेटअप पूरा हुआ! NAYANEETI में आपका स्वागत है।')
              }
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
