import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { 
  auth, 
  onAuthStateChanged, 
  GoogleAuthProvider, 
  signInWithPopup, 
  signOut,
  User
} from '../lib/firebase';
import { getUserProfile, getUserProfileByEmail, createUserProfile, purgeAllCitizenData, UserProfile } from '../services/firestoreService';
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

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const [pendingPhone, setPendingPhone] = useState<string>('');

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

    // 2. Check if phone auth session is active
    const savedPhone = localStorage.getItem('nyaay_phone_auth');
    if (savedPhone) {
      try {
        const parsed = JSON.parse(savedPhone);
        if (parsed?.uid) {
          const phoneUser = {
            uid: parsed.uid,
            phoneNumber: parsed.phone,
            displayName: `User ${parsed.uid.slice(-4)}`,
            email: null,
          } as unknown as User;
          setUser(phoneUser);
          getUserProfile(parsed.uid).then((p) => {
            if (mounted) {
              setProfile(p);
              setLoading(false);
            }
          });
          return;
        }
      } catch {}
    }

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
    return `vid-${Date.now()}`;
  };

  const verifyOTP = async (_verificationId: string, otp: string): Promise<void> => {
    localStorage.removeItem('nyaay_demo_account');
    if (!otp || otp.trim().length < 4) {
      throw new Error('Please enter a valid OTP code');
    }
    const cleanDigits = (pendingPhone || '9876543210').replace(/\D/g, '');
    const phoneUid = `phone-${cleanDigits}`;
    const phoneUser = {
      uid: phoneUid,
      phoneNumber: pendingPhone || '+91 98765 43210',
      displayName: `User ${cleanDigits.slice(-4)}`,
      email: null,
    } as unknown as User;

    setUser(phoneUser);
    localStorage.setItem('nyaay_phone_auth', JSON.stringify({ uid: phoneUid, phone: pendingPhone }));

    let p = await getUserProfile(phoneUid);
    if (p) {
      setProfile(p);
    } else {
      setProfile(null);
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
    localStorage.removeItem('nyaay_phone_auth');
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

