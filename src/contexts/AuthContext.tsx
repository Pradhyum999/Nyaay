import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { 
  auth, 
  onAuthStateChanged, 
  GoogleAuthProvider, 
  signInWithPopup, 
  signOut,
  User
} from '../lib/firebase';
import { getUserProfile, createUserProfile, UserProfile } from '../services/firestoreService';

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  signInWithPhone: (phone: string) => Promise<string>; // returns verification ID
  verifyOTP: (verificationId: string, otp: string) => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (data: Partial<UserProfile>) => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      if (firebaseUser) {
        const p = await getUserProfile(firebaseUser.uid);
        setProfile(p);
      } else {
        setProfile(null);
      }
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const signInWithGoogle = async () => {
    const provider = new GoogleAuthProvider();
    const result = await signInWithPopup(auth, provider);
    const firebaseUser = result.user;
    
    // Check if profile exists
    let p = await getUserProfile(firebaseUser.uid);
    if (!p) {
      // New user - will be prompted to complete onboarding registration
      p = {
        uid: firebaseUser.uid,
        role: 'client',
        name: firebaseUser.displayName || '',
        phone: firebaseUser.phoneNumber || '',
        email: firebaseUser.email || '',
        photoURL: firebaseUser.photoURL || '',
        verificationStatus: 'not_submitted',
        onboardingCompleted: false,
      };
      await createUserProfile(firebaseUser.uid, p);
    }
    setProfile(p);
  };

  const signInWithPhone = async (_phone: string): Promise<string> => {
    // Phone auth requires RecaptchaVerifier which needs DOM element
    // This is a stub that returns mock verificationId for demo
    // Real implementation would use signInWithPhoneNumber(auth, phone, recaptchaVerifier)
    return 'demo-verification-id';
  };

  const verifyOTP = async (_verificationId: string, _otp: string): Promise<void> => {
    // For demo, we use Google sign-in as a proxy
    // Real implementation: confirmationResult.confirm(otp)
    await signInWithGoogle();
  };

  const logout = async () => {
    await signOut(auth);
    setUser(null);
    setProfile(null);
  };

  const updateProfile = (data: Partial<UserProfile>) => {
    setProfile(prev => prev ? { ...prev, ...data } : null);
  };

  return (
    <AuthContext.Provider value={{
      user,
      profile,
      loading,
      signInWithGoogle,
      signInWithPhone,
      verifyOTP,
      logout,
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

