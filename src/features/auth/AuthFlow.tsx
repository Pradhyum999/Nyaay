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
  const { user, profile, signInWithGoogle, signInWithPhone, verifyOTP, updateProfile } = useAuth();
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
    setIsSubmitting(true);
    setErrorMsg(null);
    try {
      await signInWithGoogle();
      const currentUser = auth.currentUser;
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

        setDisplayName(existingProfile.name || currentUser.displayName || '');
        if (existingProfile.onboardingCompleted) {
          setCurrentStep('success');
          return;
        }
      }

      setDisplayName(currentUser.displayName || '');
      setCurrentStep('profile');
    } catch (err: any) {
      console.error('Google Sign-In Error:', err);
      setErrorMsg(err.message || 'Failed to sign in with Google');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSendOtp = async (cleanPhone: string) => {
    setIsSubmitting(true);
    setErrorMsg(null);
    try {
      const formatted = `+91${cleanPhone}`;
      const vid = await signInWithPhone(formatted);
      setVerificationId(vid);
      setPhoneNumber(formatted);
      setCurrentStep('otp_verify');
    } catch (err: any) {
      console.error('Phone sign-in error:', err);
      setErrorMsg(err.message || 'Failed to send OTP');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleVerifyOtp = async (otpString: string) => {
    setIsSubmitting(true);
    setErrorMsg(null);
    try {
      await verifyOTP(verificationId, otpString);
      const currentUser = auth.currentUser;
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

          setDisplayName(existingProfile.name || '');
          if (existingProfile.onboardingCompleted) {
            setCurrentStep('success');
            return;
          }
        }
      }

      setCurrentStep('profile');
    } catch (err: any) {
      console.error('OTP verify error:', err);
      setErrorMsg(err.message || 'Invalid verification code');
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
      setDisplayName(data.name);
      const profileData: any = {
        name: data.name,
        state: data.state,
        barCouncilId: data.barCouncilId,
        role: 'lawyer',
        language,
        onboardingCompleted: true,
      };

      const currentUser = auth.currentUser;
      if (profile && currentUser) {
        await updateUserProfile(currentUser.uid, profileData);
        updateProfile(profileData);
      } else if (currentUser) {
        await createUserProfile(currentUser.uid, {
          id: currentUser.uid,
          phone: currentUser.phoneNumber || phoneNumber,
          email: currentUser.email || '',
          ...profileData,
        });
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
      setDisplayName(data.name);
      const profileData: any = {
        name: data.name,
        city: data.city || '',
        role: 'client',
        language,
        onboardingCompleted: true,
      };

      const currentUser = auth.currentUser;
      if (profile && currentUser) {
        await updateUserProfile(currentUser.uid, profileData);
        updateProfile(profileData);
      } else if (currentUser) {
        await createUserProfile(currentUser.uid, {
          id: currentUser.uid,
          phone: currentUser.phoneNumber || phoneNumber,
          email: currentUser.email || '',
          ...profileData,
        });
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
                  await handleSendOtp(phoneNumber.replace('+91', ''));
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
              <SuccessStep
                language={language}
                role={chosenRole}
                userName={displayName.split(' ')[0] || ''}
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
