import React from 'react';
import { AuthFlow } from '../../features/auth/AuthFlow';
import { Language } from '../../types';

interface AuthScreenProps {
  language: Language;
  onSuccess: (role: 'lawyer' | 'client') => void;
  onAdminSuccess?: () => void;
}

export const AuthScreen: React.FC<AuthScreenProps> = (props) => {
  return <AuthFlow {...props} />;
};

export default AuthScreen;
