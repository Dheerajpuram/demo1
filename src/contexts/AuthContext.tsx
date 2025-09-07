import React, { createContext, useContext, useState } from 'react';
import { User } from '../types';
import toast from 'react-hot-toast';
import { MOCK_ADMIN_USER } from '../lib/mock-data';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  signUp: (email: string, password: string, role: string) => Promise<void>;
  demoLogin: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true); // Start with loading true

  // Auto-login demo user on app startup
  React.useEffect(() => {
    const autoLogin = async () => {
      try {
        // Simulate a brief loading period
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Auto-login with demo credentials
        const demoEmail = import.meta.env.VITE_DEMO_ADMIN_EMAIL || 'admin@telecom.demo';
        const demoPassword = import.meta.env.VITE_DEMO_ADMIN_PASSWORD || 'demo123456';
        
        if (demoEmail === 'admin@telecom.demo' && demoPassword === 'demo123456') {
          setUser(MOCK_ADMIN_USER);
          console.log('Auto-logged in as demo admin user');
        }
      } catch (error) {
        console.error('Auto-login failed:', error);
      } finally {
        setLoading(false);
      }
    };
    
    autoLogin();
  }, []);

  const signIn = async (email: string, password: string) => {
    setLoading(true);
    return new Promise((resolve) => {
      setTimeout(() => {
        const demoEmail = import.meta.env.VITE_DEMO_ADMIN_EMAIL || 'admin@telecom.demo';
        const demoPassword = import.meta.env.VITE_DEMO_ADMIN_PASSWORD || 'demo123456';

        if (email === demoEmail && password === demoPassword) {
          setUser(MOCK_ADMIN_USER);
          toast.success('Signed in successfully (Demo Mode)');
          setLoading(false);
          resolve();
        } else {
          toast.error('Invalid credentials for demo.');
          setLoading(false);
          resolve();
        }
      }, 500); // Simulate network delay
    });
  };

  const signUp = async (_email: string, _password: string, _role: string) => {
    toast.error('Sign up is disabled in frontend-only mode.');
    return Promise.resolve();
  };

  const signOut = async () => {
    setUser(null);
    toast.success('Signed out successfully (Demo Mode)');
    return Promise.resolve();
  };

  const demoLogin = async () => {
    const demoEmail = import.meta.env.VITE_DEMO_ADMIN_EMAIL || 'admin@telecom.demo';
    const demoPassword = import.meta.env.VITE_DEMO_ADMIN_PASSWORD || 'demo123456';
    await signIn(demoEmail, demoPassword);
  };

  const value = {
    user,
    loading,
    signIn,
    signOut,
    signUp,
    demoLogin,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
