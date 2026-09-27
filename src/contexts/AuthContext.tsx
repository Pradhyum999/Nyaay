import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { 
  auth, 
  onAuthStateChanged, 
  GoogleAuthProvider, 
  signInWithPopup, 
  signOut,
  User
} from '../lib/firebase';
import { getUserProfile, getUserProfileByEmail, createUserProfile, UserProfile } from '../services/firestoreService';

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
    let mounted = true;
    // 3.5-second safety timer so loading never hangs indefinitely
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
    const provider = new GoogleAuthProvider();
    const result = await signInWithPopup(auth, provider);
    const firebaseUser = result.user;
    
    // Check if profile exists by UID or by email
    let p = await getUserProfile(firebaseUser.uid);
    if (!p && firebaseUser.email) {
      p = await getUserProfileByEmail(firebaseUser.email);
    }
    if (p) {
      setProfile(p);
    } else {
      // Do not write a default client profile to Firestore!
      // The user will choose lawyer or client during onboarding.
      setProfile(null);
    }
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
    setProfile(prev => prev ? { ...prev, ...data } : (data as UserProfile));
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

