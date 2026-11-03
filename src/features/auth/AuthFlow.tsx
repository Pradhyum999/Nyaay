import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Language, UserRole } from '../../types';
import { useAuth } from '../../contexts/AuthContext';
import { auth } from '../../lib/firebase';
import { getUserProfile, createUserProfile, updateUserProfile } from '../../services/firestoreService';
import { LanguageStep } from './LanguageStep';
import { RoleSelectStep } from './RoleSelectStep';
import { SignInStep } from './SignInStep';
import { PhoneInputStep } from './PhoneInputStep';
import { OtpStep } from './OtpStep';
import { AdvocateProfileStep } from './AdvocateProfileStep';
import { CitizenProfileStep } from './CitizenProfileStep';
import { SuccessStep } from './SuccessStep';
import { WelcomeStep } from './WelcomeStep';
import { OtherSignInSheet } from './OtherSignInSheet';

export type AuthStep =
  | 'language'
  | 'role_select'
  | 'sign_in'
  | 'phone_input'
  | 'otp_verify'
  | 'profile'
  | 'success';

interface AuthFlowProps {
  language: Language;
  onSelectLanguage?: (lang: Language) => void;
  onSuccess: (role: 'lawyer' | 'client') => void;
  onAdminSuccess?: () => void;
}

export const AuthFlow: React.FC<AuthFlowProps> = ({
  language: initialLanguage,
  onSelectLanguage,
  onSuccess,
}) => {
  const { user, profile, signInWithGoogle, signInWithPhone, verifyOTP, loginAsDemo, updateProfile } = useAuth();
  const [currentStep, setCurrentStep] = useState<AuthStep>('language');
  const [language, setLanguage] = useState<Language>(() => {
    const saved = localStorage.getItem('nyaay_language') as Language;
    return saved || initialLanguage || 'en';
  });
  const [chosenRole, setChosenRole] = useState<'lawyer' | 'client'>('lawyer');
  const [roleConflict, setRoleConflict] = useState<{
    email: string;
    existingRole: UserRole;
    attemptedRole: UserRole;
  } | null>(null);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [verificationId, setVerificationId] = useState('');
  const [showOtherSignIn, setShowOtherSignIn] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [displayName, setDisplayName] = useState('');

  // Handle external or internal language change
  const handleLanguageChange = (lang: Language) => {
    setLanguage(lang);
    localStorage.setItem('nyaay_language', lang);
    if (onSelectLanguage) {
      onSelectLanguage(lang);
    }
  };

  // If user is already authenticated with completed onboarding
  useEffect(() => {
    if (user && profile?.onboardingCompleted && profile.role) {
      const role = profile.role === 'lawyer' ? 'lawyer' : 'client';
      onSuccess(role);
    }
  }, [user, profile, onSuccess]);

  const handleRoleSelect = (role: UserRole) => {
    const r = role === 'lawyer' ? 'lawyer' : 'client';
    setChosenRole(r);
    setRoleConflict(null);
    setCurrentStep('sign_in');
  };

  const handleGoogleSignIn = async () => {
    localStorage.removeItem('nyaay_demo_account');
    setIsSubmitting(true);
    setErrorMsg(null);
    try {
      await signInWithGoogle();
      const currentUser = auth.currentUser || user;
      if (!currentUser) {
        setIsSubmitting(false);
        return;
      }

      const uid = currentUser.uid;
      const existingProfile = await getUserProfile(uid);

      if (existingProfile) {
        const existingRole: UserRole = existingProfile.role === 'client' ? 'client' : 'lawyer';
        if (existingProfile.role && existingRole !== chosenRole) {
          setRoleConflict({
            email: currentUser.email || '',
            existingRole,
            attemptedRole: chosenRole,
          });
          setCurrentStep('role_select');
          setIsSubmitting(false);
          return;
        }

        const rawName = (existingProfile.name || currentUser.displayName || '').trim();
        const formatted = chosenRole === 'lawyer'
          ? (/^adv\.?\s*/i.test(rawName) ? rawName.replace(/^adv\.?\s*/i, 'Adv. ') : /^advocate\s+/i.test(rawName) ? rawName.replace(/^advocate\s+/i, 'Adv. ') : `Adv. ${rawName}`)
          : rawName;
        setDisplayName(formatted);
        if (existingProfile.onboardingCompleted) {
          setCurrentStep('success');
          return;
        }
      }

      const rawCurrName = (currentUser.displayName || '').trim();
      const formattedCurr = chosenRole === 'lawyer' && rawCurrName
        ? (/^adv\.?\s*/i.test(rawCurrName) ? rawCurrName.replace(/^adv\.?\s*/i, 'Adv. ') : `Adv. ${rawCurrName}`)
        : rawCurrName;
      setDisplayName(formattedCurr);
      setCurrentStep('profile');
    } catch (err: any) {
      console.error('Google Sign-In Error:', err);
      if (err.code === 'auth/popup-closed-by-user') {
        setErrorMsg(language === 'hi' ? 'साइन-इन रद्द कर दिया गया। पुनः प्रयास करें या फ़ोन/डेमो लॉगिन का उपयोग करें।' : 'Sign-in cancelled. Please try again or use Phone / Demo login.');
      } else if (err.code === 'auth/popup-blocked') {
        setErrorMsg(language === 'hi' ? 'ब्राउज़र ने पॉपअप ब्लॉक कर दिया। कृपया पॉपअप की अनुमति दें या फ़ोन लॉगिन का उपयोग करें।' : 'Browser blocked the popup window. Please allow popups or use Phone login.');
      } else {
        setErrorMsg(err.message || 'Failed to sign in with Google');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const normalizePhone = (phone: string): string => {
    // Strip any leading +91 / + / whitespace / leading 0s, then format with +91
    let digits = phone.replace(/\D/g, '');
    if (digits.startsWith('91') && digits.length > 10) {
      digits = digits.slice(2);
    } else if (digits.startsWith('0')) {
      digits = digits.replace(/^0+/, '');
    }
    const cleaned = digits.slice(-10);
    return `+91${cleaned}`;
  };

  const handleSendOtp = async (phone: string) => {
    localStorage.removeItem('nyaay_demo_account');
    setIsSubmitting(true);
    setErrorMsg(null);
    try {
      const formatted = normalizePhone(phone);
      const vid = await signInWithPhone(formatted);
      setVerificationId(vid);
      setPhoneNumber(formatted);
      setCurrentStep('otp_verify');
    } catch (err: any) {
      console.error('Phone sign-in error:', err);
      let friendly = err.message || 'Failed to send OTP';
      if (err.code === 'auth/invalid-phone-number') {
        friendly = language === 'mr'
          ? 'अवैध मोबाईल क्रमांक. कृपया १०-अंकी वैध क्रमांक प्रविष्ट करा.'
          : language === 'hi'
          ? 'अमान्य मोबाइल नंबर। कृपया सही 10-अंकों का नंबर दर्ज करें।'
          : 'Invalid phone number. Please enter a valid 10-digit mobile number.';
      } else if (err.code === 'auth/too-many-requests') {
        friendly = language === 'mr'
          ? 'खूप जास्त प्रयत्न झाले. कृपया काही वेळ प्रतीक्षा करा.'
          : language === 'hi'
          ? 'अत्यधिक अनुरोध। कृपया कुछ समय प्रतीक्षा करके पुनः प्रयास करें।'
          : 'Too many attempts. Please wait a moment and try again.';
      } else if (err.code === 'auth/quota-exceeded') {
        friendly = language === 'mr'
          ? 'दैनिक एसएमएस मर्यादा संपली आहे. कृपया Google लॉगिन वापरा.'
          : language === 'hi'
          ? 'दैनिक SMS कोटा समाप्त हो गया है। कृपया Google लॉगिन का उपयोग करें।'
          : 'Daily SMS quota exceeded. Please use Google Sign-In or try again later.';
      } else if (err.code === 'auth/captcha-check-failed') {
        friendly = language === 'mr'
          ? 'सुरक्षा तपासणी अयशस्वी झाली. कृपया पुन्हा प्रयत्न करा.'
          : language === 'hi'
          ? 'सुरक्षा सत्यापन विफल हुआ। कृपया पुनः प्रयास करें।'
          : 'reCAPTCHA security check failed. Please try again.';
      } else if (err.code === 'auth/operation-not-allowed') {
        friendly = language === 'mr'
          ? 'Firebase Console मध्ये फोन ऑथेंटिकेशन सक्षम केलेले नाही. कृपया Authentication > Sign-in method मध्ये Phone सुरू करा.'
          : language === 'hi'
          ? 'Firebase Console में Phone प्रमाणीकरण सक्षम नहीं है। कृपया Authentication > Sign-in method में Phone को चालू करें।'
          : 'Phone authentication is not enabled in Firebase Console. Please enable "Phone" in Firebase Console > Authentication > Sign-in method.';
      } else if (err.code === 'auth/invalid-app-credential') {
        friendly = language === 'mr'
          ? 'अ‍ॅप पडताळणी अयशस्वी. कृपया Firebase Console मध्ये Phone Auth आणि India (+91) SMS प्रदेश धोरण सक्षम असल्याचे तपासा.'
          : language === 'hi'
          ? 'ऐप सत्यापन विफल। कृपया जांचें कि Firebase Console में Phone Auth और India (+91) SMS क्षेत्र नीति सक्षम है।'
          : 'App verification failed. Please ensure Phone Auth and India (+91) SMS region policy are enabled in Firebase Console.';
      } else if (err.code === 'auth/billing-not-enabled') {
        friendly = language === 'mr'
          ? 'एसएमएस कोटा मर्यादा गाठली. चाचणीसाठी Firebase Console मध्ये चाचणी फोन नंबर (उदा. +91 99999 99999) वापरा.'
          : language === 'hi'
          ? 'SMS कोटा समाप्त। परीक्षण के लिए Firebase Console में टेस्ट फ़ोन नंबर (उदा. +91 99999 99999) का उपयोग करें।'
          : 'SMS quota reached. For testing, please add a Test Phone Number in Firebase Console > Authentication > Sign-in method.';
      } else if (err.code === 'auth/unauthorized-domain' || err.code === 'auth/app-not-authorized') {
        friendly = language === 'mr'
          ? 'हे डोमेन अधिकृत नाही. कृपया Firebase Console > Settings मध्ये अधिकृत डोमेन जोडा.'
          : language === 'hi'
          ? 'यह डोमेन अधिकृत नहीं है। कृपया Firebase Console > Settings में Authorized domains जोड़ें।'
          : 'Domain not authorized. Please add this domain to Firebase Console > Authentication > Settings > Authorized domains.';
      }
      setErrorMsg(friendly);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleVerifyOtp = async (otpString: string) => {
    localStorage.removeItem('nyaay_demo_account');
    setIsSubmitting(true);
    setErrorMsg(null);
    try {
      await verifyOTP(verificationId, otpString);
      const currentUser = auth.currentUser || user;
      if (currentUser) {
        const existingProfile = await getUserProfile(currentUser.uid);

        if (existingProfile) {
          const existingRole: UserRole = existingProfile.role === 'client' ? 'client' : 'lawyer';
          if (existingProfile.role && existingRole !== chosenRole) {
            setRoleConflict({
              email: currentUser.email || '',
              existingRole,
              attemptedRole: chosenRole,
            });
            setCurrentStep('role_select');
            setIsSubmitting(false);
            return;
          }

          const rawPhoneName = (existingProfile.name || '').trim();
          const formattedPhoneName = chosenRole === 'lawyer'
            ? (/^adv\.?\s*/i.test(rawPhoneName) ? rawPhoneName.replace(/^adv\.?\s*/i, 'Adv. ') : `Adv. ${rawPhoneName}`)
            : rawPhoneName;
          setDisplayName(formattedPhoneName);
          if (existingProfile.onboardingCompleted) {
            setCurrentStep('success');
            return;
          }
        }
      }

      setCurrentStep('profile');
    } catch (err: any) {
      console.error('OTP verify error:', err);
      let friendly = err.message || 'Invalid verification code';
      if (err.code === 'auth/invalid-verification-code') {
        friendly = language === 'mr'
          ? 'चुकीचा ६-अंकी पडताळणी कोड. कृपया पुन्हा तपासा.'
          : language === 'hi'
          ? 'गलत 6-अंकों का सत्यापन कोड। कृपया पुनः जाँचें।'
          : 'Incorrect 6-digit verification code. Please check and retry.';
      } else if (err.code === 'auth/code-expired') {
        friendly = language === 'mr'
          ? 'हा कोड कालबाह्य झाला आहे. कृपया नवीन कोड मागवा.'
          : language === 'hi'
          ? 'ओटीपी कोड समाप्त हो चुका है। कृपया नया कोड प्राप्त करें।'
          : 'Verification code has expired. Please request a new code.';
      }
      setErrorMsg(friendly);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAdvocateProfileSubmit = async (data: {
    name: string;
    state: string;
    barCouncilId: string;
  }) => {
    setIsSubmitting(true);
    setErrorMsg(null);
    try {
      const rawName = data.name.trim();
      const formattedName = /^adv\.?\s*/i.test(rawName)
        ? rawName.replace(/^adv\.?\s*/i, 'Adv. ')
        : /^advocate\s+/i.test(rawName)
        ? rawName.replace(/^advocate\s+/i, 'Adv. ')
        : `Adv. ${rawName}`;

      setDisplayName(formattedName);

      const currentUser = auth.currentUser || user;
      const finalEmail = currentUser?.email || profile?.email || '';
      const finalPhone = currentUser?.phoneNumber || phoneNumber || profile?.phone || '';
      const finalUid = currentUser?.uid || profile?.uid || `lawyer-${Date.now()}`;

      const profileData: any = {
        uid: finalUid,
        name: formattedName,
        state: data.state,
        barCouncilId: data.barCouncilId,
        role: 'lawyer',
        email: finalEmail,
        phone: finalPhone,
        language,
        onboardingCompleted: true,
      };

      localStorage.removeItem('nyaay_demo_account');

      if (profile && currentUser) {
        await updateUserProfile(currentUser.uid, profileData);
        updateProfile(profileData);
      } else if (currentUser) {
        await createUserProfile(currentUser.uid, {
          id: currentUser.uid,
          ...profileData,
        });
        updateProfile(profileData);
      } else {
        updateProfile(profileData);
      }

      setCurrentStep('success');
    } catch (err: any) {
      console.error('Advocate Profile Submit error:', err);
      setErrorMsg(err.message || 'Failed to save profile');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCitizenProfileSubmit = async (data: {
    name: string;
    city?: string;
  }) => {
    setIsSubmitting(true);
    setErrorMsg(null);
    try {
      const trimmedName = data.name.trim();
      setDisplayName(trimmedName);

      const currentUser = auth.currentUser || user;
      const finalEmail = currentUser?.email || profile?.email || '';
      const finalPhone = currentUser?.phoneNumber || phoneNumber || profile?.phone || '';
      const finalUid = currentUser?.uid || profile?.uid || `client-${Date.now()}`;

      const profileData: any = {
        uid: finalUid,
        name: trimmedName,
        city: data.city || '',
        role: 'client',
        email: finalEmail,
        phone: finalPhone,
        language,
        onboardingCompleted: true,
      };

      localStorage.removeItem('nyaay_demo_account');

      if (profile && currentUser) {
        await updateUserProfile(currentUser.uid, profileData);
        updateProfile(profileData);
      } else if (currentUser) {
        await createUserProfile(currentUser.uid, {
          id: currentUser.uid,
          ...profileData,
        });
        updateProfile(profileData);
      } else {
        updateProfile(profileData);
      }

      setCurrentStep('success');
    } catch (err: any) {
      console.error('Citizen Profile Submit error:', err);
      setErrorMsg(err.message || 'Failed to save profile');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Progress dot indices (1-indexed for 6 visible step points)
  const getStepIndex = (): number => {
    switch (currentStep) {
      case 'language':
        return 1;
      case 'role_select':
        return 2;
      case 'sign_in':
        return 3;
      case 'phone_input':
      case 'otp_verify':
        return 4;
      case 'profile':
        return 5;
      case 'success':
        return 6;
      default:
        return 1;
    }
  };

  const stepIndex = getStepIndex();

  return (
    <div className="min-h-full flex flex-col justify-between py-6 px-4 max-w-sm mx-auto text-main">
      {/* Top Bar with Brand & Progress Dots */}
      <div className="flex flex-col items-center gap-4 mb-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-ink text-inverse flex items-center justify-center font-bold text-base shadow-sm">
            ⚖
          </div>
          <span className="font-extrabold tracking-wider text-sm uppercase">NYAAYNEETI</span>
        </div>
      </div>

      {/* Invisible reCAPTCHA render container for Firebase phone auth */}
      <div id="recaptcha-auth-container" className="hidden" />

      {/* Step Transition Machine */}
      <div className="flex-1 flex flex-col justify-center">

        {/* 6-dot progress indicator */}
        <div className="flex items-center gap-1.5" aria-label="Progress">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div
              key={i}
              className={`transition-all duration-300 rounded-full ${
                i === stepIndex
                  ? 'w-6 h-2 bg-ink'
                  : i < stepIndex
                  ? 'w-2 h-2 bg-main opacity-60'
                  : 'w-2 h-2 bg-main opacity-20'
              }`}
            />
          ))}
        </div>
      </div>

      {errorMsg && (
        <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 text-sm">
          {errorMsg}
        </div>
      )}

      {/* Step Transition Machine */}
      <div className="flex-1 flex flex-col justify-center">
        <AnimatePresence mode="wait">
          {currentStep === 'language' && (
            <motion.div
              key="step-language"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
            >
              <LanguageStep
                currentLanguage={language}
                onSelectLanguage={(lang) => {
                  handleLanguageChange(lang);
                }}
                onNext={() => setCurrentStep('role_select')}
              />
            </motion.div>
          )}

          {currentStep === 'role_select' && (
            <motion.div
              key="step-role"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
            >
              <RoleSelectStep
                language={language}
                onSelectRole={handleRoleSelect}
                onOpenOther={() => setShowOtherSignIn(true)}
                onBack={() => setCurrentStep('language')}
                roleConflict={
                  roleConflict
                    ? {
                        email: roleConflict.email,
                        existingRole: roleConflict.existingRole,
                        attemptedRole: roleConflict.attemptedRole,
                      }
                    : null
                }
                onResolveConflict={(keepRole) => {
                  const r = keepRole === 'lawyer' ? 'lawyer' : 'client';
                  setChosenRole(r);
                  setRoleConflict(null);
                  onSuccess(r);
                }}
              />
            </motion.div>
          )}

          {currentStep === 'sign_in' && (
            <motion.div
              key="step-sign-in"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
            >
              <SignInStep
                language={language}
                selectedRole={chosenRole}
                onGoogleSignIn={handleGoogleSignIn}
                onPhoneSignIn={() => setCurrentStep('phone_input')}
                onDemoLogin={(type) => {
                  loginAsDemo(type);
                  onSuccess('lawyer');
                }}
                onBack={() => setCurrentStep('role_select')}
                loading={isSubmitting}
                error={errorMsg || undefined}
              />
            </motion.div>
          )}

          {currentStep === 'phone_input' && (
            <motion.div
              key="step-phone"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
            >
              <PhoneInputStep
                language={language}
                initialPhone={phoneNumber}
                onSendOtp={handleSendOtp}
                onBack={() => setCurrentStep('sign_in')}
                loading={isSubmitting}
                error={errorMsg || undefined}
              />
            </motion.div>
          )}

          {currentStep === 'otp_verify' && (
            <motion.div
              key="step-otp"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
            >
              <OtpStep
                language={language}
                phone={phoneNumber}
                onVerifyOtp={handleVerifyOtp}
                onResendOtp={async () => {
                  await handleSendOtp(phoneNumber);
                }}
                onChangePhone={() => setCurrentStep('phone_input')}
                loading={isSubmitting}
                error={errorMsg || undefined}
              />
            </motion.div>
          )}

          {currentStep === 'profile' && chosenRole === 'lawyer' && (
            <motion.div
              key="step-advocate-profile"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
            >
              <AdvocateProfileStep
                language={language}
                initialName={displayName}
                onSaveProfile={handleAdvocateProfileSubmit}
                loading={isSubmitting}
                error={errorMsg || undefined}
              />
            </motion.div>
          )}

          {currentStep === 'profile' && chosenRole === 'client' && (
            <motion.div
              key="step-citizen-profile"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
            >
              <CitizenProfileStep
                language={language}
                initialName={displayName}
                onSaveProfile={handleCitizenProfileSubmit}
                loading={isSubmitting}
                error={errorMsg || undefined}
              />
            </motion.div>
          )}

          {currentStep === 'success' && (
            <motion.div
              key="step-success"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
            >
              <WelcomeStep
                language={language}
                role={chosenRole}
                userName={displayName}
                onFinish={() => onSuccess(chosenRole)}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Other Sign-In Sheet (Firm, Member Password Change) */}
      <OtherSignInSheet
        isOpen={showOtherSignIn}
        onClose={() => setShowOtherSignIn(false)}
        language={language}
        onSuccess={(role) => {
          setShowOtherSignIn(false);
          onSuccess(role === 'lawyer' ? 'lawyer' : 'client');
        }}
      />
    </div>
  );
};
