import React, { createContext, useContext, useEffect, useState, useRef, ReactNode } from 'react';
import { 
  auth, 
  onAuthStateChanged, 
  GoogleAuthProvider, 
  signInWithPhoneNumber, 
  RecaptchaVerifier, 
  signInWithPopup, 
  signOut,
  User,
  ConfirmationResult
} from '../lib/firebase';
import { getUserProfile, getUserProfileByEmail, purgeAllCitizenData, UserProfile } from '../services/firestoreService';
import { DEMO_ACCOUNTS } from '../config/demoAccounts';

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  signInWithPhone: (phone: string) => Promise<string>; // returns verification ID
  verifyOTP: (verificationId: string, otp: string) => Promise<void>;
  loginAsDemo: (type: 'firm' | 'student') => void;
  logout: () => Promise<void>;
  deleteAccount: () => Promise<void>;
  updateProfile: (data: Partial<UserProfile>) => void;
}

const recaptchaContainerId = 'recaptcha-auth-container';

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const [, setPendingPhone] = useState<string>('');
  const recaptchaVerifierRef = useRef<RecaptchaVerifier | null>(null);
  const confirmationResultRef = useRef<ConfirmationResult | null>(null);

  useEffect(() => {
    let mounted = true;

    // 1. Check if demo account session is active
    const savedDemo = localStorage.getItem('nyaay_demo_account') as 'firm' | 'student' | null;
    if (savedDemo && DEMO_ACCOUNTS[savedDemo]) {
      const demo = DEMO_ACCOUNTS[savedDemo];
      setUser(demo.user as unknown as User);
      setProfile(demo.profile);
      setLoading(false);
      return;
    }

    // 2. 3.5-second safety timer so loading never hangs indefinitely
    const safetyTimer = setTimeout(() => {
      if (mounted) setLoading(false);
    }, 3500);

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      try {
        setUser(firebaseUser);
        if (firebaseUser) {
          let p = await getUserProfile(firebaseUser.uid);
          if (!p && firebaseUser.email) {
            p = await getUserProfileByEmail(firebaseUser.email);
          }
          if (mounted) setProfile(p);
        } else {
          if (mounted) setProfile(null);
        }
      } catch (err) {
        console.error("Auth state profile fetch error:", err);
      } finally {
        clearTimeout(safetyTimer);
        if (mounted) setLoading(false);
      }
    });

    return () => {
      mounted = false;
      clearTimeout(safetyTimer);
      unsubscribe();
    };
  }, []);

  const signInWithGoogle = async () => {
    localStorage.removeItem('nyaay_demo_account');
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: 'select_account' });
    const result = await signInWithPopup(auth, provider);
    const firebaseUser = result.user;
    setUser(firebaseUser);
    
    // Check if profile exists by UID or by email
    let p = await getUserProfile(firebaseUser.uid);
    if (!p && firebaseUser.email) {
      p = await getUserProfileByEmail(firebaseUser.email);
    }
    if (p) {
      setProfile(p);
    } else {
      setProfile(null);
    }
  };

  const signInWithPhone = async (phone: string): Promise<string> => {
    localStorage.removeItem('nyaay_demo_account');
    setPendingPhone(phone);

    try {
      // 1. Ensure recaptcha container element exists in the DOM
      let container = document.getElementById(recaptchaContainerId);
      if (!container) {
        container = document.createElement('div');
        container.id = recaptchaContainerId;
        document.body.appendChild(container);
      }

      // 2. Clear any prior verifier instance to prevent re-render collisions
      if (recaptchaVerifierRef.current) {
        try {
          recaptchaVerifierRef.current.clear();
        } catch {}
        recaptchaVerifierRef.current = null;
      }

      // 3. Initialize RecaptchaVerifier with auth as first param (Firebase modular SDK v9+)
      const appVerifier = new RecaptchaVerifier(auth, recaptchaContainerId, {
        size: 'invisible',
        callback: () => {
          // reCAPTCHA solved
        },
        'expired-callback': () => {
          if (recaptchaVerifierRef.current) {
            try {
              recaptchaVerifierRef.current.clear();
            } catch {}
            recaptchaVerifierRef.current = null;
          }
        },
      });

      recaptchaVerifierRef.current = appVerifier;

      // 4. Send SMS via Firebase Phone Auth
      const confirmationResult = await signInWithPhoneNumber(auth, phone, appVerifier);
      confirmationResultRef.current = confirmationResult;

      return confirmationResult.verificationId;
    } catch (err: any) {
      console.error('Firebase Phone Auth signIn error:', err);
      if (recaptchaVerifierRef.current) {
        try {
          recaptchaVerifierRef.current.clear();
        } catch {}
        recaptchaVerifierRef.current = null;
      }
      throw err;
    }
  };

  const verifyOTP = async (verificationId: string, otp: string): Promise<void> => {
    localStorage.removeItem('nyaay_demo_account');
    if (!otp || otp.trim().length < 6) {
      throw new Error('Please enter the complete 6-digit OTP code');
    }

    try {
      const confirmationResult = confirmationResultRef.current;
      if (!confirmationResult) {
        throw new Error('No active verification session. Please request a new OTP code.');
      }

      // Confirm the OTP code directly with Firebase
      const userCredential = await confirmationResult.confirm(otp.trim());
      const currentUser = userCredential.user;

      setUser(currentUser);

      // Clean up verifier
      if (recaptchaVerifierRef.current) {
        try {
          recaptchaVerifierRef.current.clear();
        } catch {}
        recaptchaVerifierRef.current = null;
      }
      confirmationResultRef.current = null;

      let p = await getUserProfile(currentUser.uid);
      if (!p && currentUser.email) {
        p = await getUserProfileByEmail(currentUser.email);
      }
      if (p) {
        setProfile(p);
      } else {
        setProfile(null);
      }
    } catch (err: any) {
      console.error('Firebase verifyOTP error:', err);
      throw err;
    }
  };

  const loginAsDemo = (type: 'firm' | 'student') => {
    const demo = DEMO_ACCOUNTS[type];
    if (demo) {
      localStorage.setItem('nyaay_demo_account', type);
      setUser(demo.user as unknown as User);
      setProfile(demo.profile);
    }
  };

  const logout = async () => {
    localStorage.removeItem('nyaay_demo_account');
    if (recaptchaVerifierRef.current) {
      try {
        recaptchaVerifierRef.current.clear();
      } catch {}
      recaptchaVerifierRef.current = null;
    }
    confirmationResultRef.current = null;
    try {
      await signOut(auth);
    } catch {}
    setUser(null);
    setProfile(null);
  };

  const deleteAccount = async () => {
    try {
      await purgeAllCitizenData();
    } catch (err) {
      console.warn("Failed to purge citizen data on deleteAccount:", err);
    }
    await logout();
  };

  const updateProfile = (data: Partial<UserProfile>) => {
    setProfile(prev => {
      const merged: UserProfile = {
        ...(prev || {}),
        uid: data.uid ?? prev?.uid ?? user?.uid ?? '',
        email: data.email ?? prev?.email ?? user?.email ?? '',
        phone: data.phone ?? prev?.phone ?? user?.phoneNumber ?? '',
        ...data,
      } as UserProfile;
      return merged;
    });
  };

  return (
    <AuthContext.Provider value={{
      user,
      profile,
      loading,
      signInWithGoogle,
      signInWithPhone,
      verifyOTP,
      loginAsDemo,
      logout,
      deleteAccount,
      updateProfile,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
