import React, { useState } from 'react';
import { Scale, Phone, Mail, ChevronRight, Shield, Gavel, User, ArrowLeft, CheckCircle, Star, AlertCircle } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { createUserProfile, updateUserProfile } from '../../services/firestoreService';
import { Language } from '../../types';

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
  'Andhra Pradesh', 'Delhi', 'Gujarat', 'Karnataka', 'Kerala',
  'Madhya Pradesh', 'Maharashtra', 'Punjab', 'Rajasthan', 'Tamil Nadu',
  'Telangana', 'Uttar Pradesh', 'West Bengal', 'Bihar', 'Jharkhand',
  'Odisha', 'Haryana', 'Himachal Pradesh', 'Uttarakhand', 'Goa'
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
    state: '',
    practiceAreas: [] as string[],
    experience: '',
    bio: '',
    feeMin: '',
    feeMax: '',
    languages: ['Hindi', 'English'],
  });

  // Client profile fields
  const [clientData, setClientData] = useState({
    name: '',
    email: '',
  });

  const t = (en: string, hi: string) => language === 'hi' ? hi : en;

  const handleGoogleSignIn = async () => {
    setLoading(true);
    setError('');
    try {
      await signInWithGoogle();
      // After Google sign-in, show role-specific registration
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

  const handleLawyerRegistration = async () => {
    if (!lawyerData.name || !lawyerData.barCouncilId || !lawyerData.state || lawyerData.practiceAreas.length === 0) {
      setError(t('Please fill all required fields', 'सभी आवश्यक फ़ील्ड भरें'));
      return;
    }
    setLoading(true);
    setError('');
    try {
      const uid = user?.uid || `demo-${Date.now()}`;
      const profileData = {
        role: 'lawyer' as const,
        name: lawyerData.name,
        phone,
        barCouncilId: lawyerData.barCouncilId,
        state: lawyerData.state,
        practiceAreas: lawyerData.practiceAreas,
        experience: parseInt(lawyerData.experience) || 0,
        bio: lawyerData.bio,
        feeRange: { min: parseInt(lawyerData.feeMin) || 0, max: parseInt(lawyerData.feeMax) || 0 },
        languages: lawyerData.languages,
        verificationStatus: 'pending' as const,
        rating: 0,
        totalCases: 0,
      };
      
      if (user) {
        await updateUserProfile(uid, profileData);
      } else {
        await createUserProfile(uid, profileData);
      }
      updateProfile(profileData);
      setStep('success');
      setTimeout(() => onSuccess('lawyer'), 1500);
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
      const uid = user?.uid || `demo-client-${Date.now()}`;
      const profileData = {
        role: 'client' as const,
        name: clientData.name,
        phone,
        email: clientData.email,
      };
      
      if (user) {
        await updateUserProfile(uid, profileData);
      } else {
        await createUserProfile(uid, profileData);
      }
      updateProfile(profileData);
      setStep('success');
      setTimeout(() => onSuccess('client'), 1500);
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
        <div className="w-16 h-16 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center mx-auto mb-4">
          <Scale className="w-8 h-8 text-white" />
        </div>
        <h1 className="text-3xl font-bold text-white tracking-tight">Nyaay</h1>
        <p className="text-white/50 text-sm mt-1">
          {t('Your Legal Partner', 'आपका कानूनी साथी')}
        </p>
      </div>

      {/* Content Area */}
      <div className="flex-1 px-6 overflow-y-auto pb-8">

        {/* Step: Role Select */}
        {step === 'role_select' && (
          <div className="space-y-4 animate-fadeIn">
            <p className="text-white/70 text-center text-sm mb-8">
              {t('Choose how you want to join', 'चुनें आप कैसे जुड़ना चाहते हैं')}
            </p>

            {/* Role Cards */}
            <button
              onClick={() => { setSelectedRole('client'); setStep('phone_input'); }}
              className="w-full glass-card rounded-2xl p-5 flex items-center gap-4 ios-press border-2 border-transparent hover:border-white/20 transition-all"
            >
              <div className="w-12 h-12 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center flex-shrink-0">
                <User className="w-6 h-6 text-emerald-400" />
              </div>
              <div className="text-left flex-1">
                <p className="text-white font-semibold">{t('I\'m a Client', 'मैं एक मुवक्किल हूं')}</p>
                <p className="text-white/50 text-xs mt-0.5">{t('Get legal help, consult AI, track your case', 'कानूनी सहायता पाएं, AI से पूछें, केस ट्रैक करें')}</p>
              </div>
              <ChevronRight className="w-5 h-5 text-white/30" />
            </button>

            <button
              onClick={() => { setSelectedRole('lawyer'); setStep('phone_input'); }}
              className="w-full glass-card rounded-2xl p-5 flex items-center gap-4 ios-press border-2 border-transparent hover:border-white/20 transition-all"
            >
              <div className="w-12 h-12 rounded-xl bg-blue-500/20 border border-blue-500/30 flex items-center justify-center flex-shrink-0">
                <Gavel className="w-6 h-6 text-blue-400" />
              </div>
              <div className="text-left flex-1">
                <p className="text-white font-semibold">{t('I\'m an Advocate', 'मैं एक अधिवक्ता हूं')}</p>
                <p className="text-white/50 text-xs mt-0.5">{t('Manage cases, billing, client intake', 'केस प्रबंधित करें, बिलिंग, क्लाइंट इनटेक')}</p>
              </div>
              <ChevronRight className="w-5 h-5 text-white/30" />
            </button>

            {/* Trust Badge */}
            <div className="flex items-center justify-center gap-2 mt-8 text-white/40 text-xs">
              <Shield className="w-4 h-4" />
              <span>{t('BCI Compliant · Secure · Private', 'BCI अनुपालित · सुरक्षित · निजी')}</span>
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
              <p className="text-white/50 text-sm mt-1">{t('Complete your professional profile', 'अपनी व्यावसायिक प्रोफ़ाइल पूरी करें')}</p>
            </div>

            {[
              { label: t('Full Name *', 'पूरा नाम *'), key: 'name', type: 'text', placeholder: t('Adv. Rajesh Kumar', 'अधि. राजेश कुमार') },
              { label: t('Bar Council Enrollment No. *', 'बार काउंसिल नामांकन संख्या *'), key: 'barCouncilId', type: 'text', placeholder: 'DL/12345/2010' },
              { label: t('Years of Experience *', 'अनुभव के वर्ष *'), key: 'experience', type: 'number', placeholder: '5' },
              { label: t('Min Fee (₹/hearing)', 'न्यूनतम शुल्क (₹/सुनवाई)'), key: 'feeMin', type: 'number', placeholder: '5000' },
              { label: t('Max Fee (₹/hearing)', 'अधिकतम शुल्क (₹/सुनवाई)'), key: 'feeMax', type: 'number', placeholder: '25000' },
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
              <label className="text-white/60 text-xs font-medium mb-1.5 block">{t('State *', 'राज्य *')}</label>
              <select
                value={lawyerData.state}
                onChange={e => setLawyerData(prev => ({ ...prev, state: e.target.value }))}
                className="w-full glass-card rounded-xl px-4 py-3 text-white outline-none text-sm border border-white/10 focus:border-white/30 transition-colors bg-black"
              >
                <option value="">{t('Select State', 'राज्य चुनें')}</option>
                {INDIAN_STATES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>

            {/* Practice Areas */}
            <div>
              <label className="text-white/60 text-xs font-medium mb-2 block">{t('Practice Areas * (select all that apply)', 'प्रैक्टिस क्षेत्र * (सभी लागू चुनें)')}</label>
              <div className="flex flex-wrap gap-2">
                {PRACTICE_AREAS.map(area => (
                  <button
                    key={area}
                    onClick={() => togglePracticeArea(area)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium ios-press transition-all ${
                      lawyerData.practiceAreas.includes(area)
                        ? 'bg-white text-black'
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
                placeholder={t('Brief about your practice and expertise...', 'अपनी प्रैक्टिस के बारे में...')}
                rows={3}
                className="w-full glass-card rounded-xl px-4 py-3 text-white placeholder-white/30 outline-none text-sm border border-white/10 focus:border-white/30 transition-colors resize-none"
              />
            </div>

            {/* Disclaimer */}
            <div className="glass-card rounded-xl p-3 border border-yellow-500/20">
              <p className="text-yellow-400/80 text-xs">
                {t(
                  '⚖️ Your profile will be reviewed for BCI compliance before activation. No advertising or solicitation per BCI rules.',
                  '⚖️ आपकी प्रोफ़ाइल सक्रियण से पहले BCI अनुपालन के लिए समीक्षा की जाएगी।'
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
              className="w-full bg-white text-black font-semibold py-4 rounded-2xl ios-press disabled:opacity-40 text-sm"
            >
              {loading ? t('Submitting...', 'जमा कर रहे हैं...') : t('Submit for Verification', 'सत्यापन के लिए जमा करें')}
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
              <h2 className="text-2xl font-bold text-white">{t('Your Profile', 'आपकी प्रोफ़ाइल')}</h2>
              <p className="text-white/50 text-sm mt-1">{t('Just a few details to get started', 'शुरू करने के लिए बस कुछ विवरण')}</p>
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
              <label className="text-white/60 text-xs font-medium mb-1.5 block">{t('Email (optional)', 'ईमेल (वैकल्पिक)')}</label>
              <input
                type="email"
                value={clientData.email}
                onChange={e => setClientData(prev => ({ ...prev, email: e.target.value }))}
                placeholder="name@email.com"
                className="w-full glass-card rounded-xl px-4 py-3 text-white placeholder-white/30 outline-none text-sm border border-white/10 focus:border-white/30 transition-colors"
              />
            </div>

            {/* Privacy note */}
            <div className="glass-card rounded-xl p-3 border border-emerald-500/20">
              <p className="text-emerald-400/80 text-xs">
                {t(
                  '🔒 Your information is encrypted and never shared without your consent.',
                  '🔒 आपकी जानकारी एन्क्रिप्टेड है और आपकी सहमति के बिना कभी साझा नहीं की जाती।'
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
              onClick={handleClientProfile}
              disabled={loading}
              className="w-full bg-white text-black font-semibold py-4 rounded-2xl ios-press disabled:opacity-40 text-sm"
            >
              {loading ? t('Setting up...', 'सेट कर रहे हैं...') : t('Get Started', 'शुरू करें')}
            </button>
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
                : t('Welcome to Nyaay!', 'Nyaay में आपका स्वागत है!')
              }
            </h2>
            <p className="text-white/50 text-sm text-center">
              {selectedRole === 'lawyer'
                ? t('Your profile is under review. You can start exploring the app.', 'आपकी प्रोफ़ाइल समीक्षाधीन है। आप ऐप एक्सप्लोर कर सकते हैं।')
                : t('Your account is ready. Let\'s get started!', 'आपका खाता तैयार है।')
              }
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
