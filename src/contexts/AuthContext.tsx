import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { authAPI } from '../api';

interface User {
  id: string;
  email: string;
  name: string;
  emailVerified?: boolean;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name: string) => Promise<{ requiresVerification: boolean }>;
  logout: () => void;
  forgotPassword: (email: string) => Promise<void>;
  resetPassword: (token: string, password: string) => Promise<void>;
  verifyEmail: (token: string) => Promise<void>;
  resendVerification: (email: string) => Promise<void>;
  socialLogin: (provider: string, accessToken: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

interface Props {
  children: ReactNode;
}

export function AuthProvider({ children }: Props) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user is logged in on mount
    const checkAuth = async () => {
      const token = localStorage.getItem('token');
      if (token) {
        try {
          const userData = await authAPI.getMe();
          setUser(userData);
        } catch (error) {
          // Token invalid, clear it
          localStorage.removeItem('token');
        }
      }
      setLoading(false);
    };

    checkAuth();
  }, []);

  const login = async (email: string, password: string) => {
    const data = await authAPI.login(email, password);
    setUser(data.user);
  };

  const register = async (email: string, password: string, name: string) => {
    const data = await authAPI.register(email, password, name);
    // If email verification is required, don't set user yet
    if (data.requiresVerification) {
      return { requiresVerification: true };
    }
    setUser(data.user);
    return { requiresVerification: false };
  };

  const logout = () => {
    authAPI.logout();
    setUser(null);
  };

  const forgotPassword = async (email: string) => {
    await authAPI.forgotPassword(email);
  };

  const resetPassword = async (token: string, password: string) => {
    await authAPI.resetPassword(token, password);
  };

  const verifyEmail = async (token: string) => {
    const data = await authAPI.verifyEmail(token);
    if (data.user) {
      setUser(data.user);
    }
  };

  const resendVerification = async (email: string) => {
    await authAPI.resendVerification(email);
  };

  const socialLogin = async (provider: string, accessToken: string) => {
    const data = await authAPI.socialLogin(provider, accessToken);
    setUser(data.user);
  };

  return (
    <AuthContext.Provider value={{
      user,
      loading,
      login,
      register,
      logout,
      forgotPassword,
      resetPassword,
      verifyEmail,
      resendVerification,
      socialLogin,
    }}>
      {children}
    </AuthContext.Provider>
  );
}
