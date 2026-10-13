import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, PlatformSettings } from '../types';
import { api, getAuthToken, setAuthToken } from '../utils/api';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  settings: PlatformSettings;
  isPro: boolean;
  isAdmin: boolean;
  remainingPdfOps: number;
  remainingAiQueries: number;
  login: (email: string, pass: string) => Promise<void>;
  register: (name: string, email: string, pass: string) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
  upgradeToPro: (paymentMethod: string, transactionRef?: string) => Promise<void>;
  authModalOpen: boolean;
  authModalMode: 'login' | 'register';
  openAuthModal: (mode?: 'login' | 'register') => void;
  closeAuthModal: () => void;
  upgradeModalOpen: boolean;
  openUpgradeModal: () => void;
  closeUpgradeModal: () => void;
}

const DEFAULT_SETTINGS: PlatformSettings = {
  freePdfOpsLimit: 3,
  freeAiQueriesLimit: 5,
  proPriceInr: 109,
  announcement: 'Welcome to PDF Genius AI! High-speed PDF processing & Gemini-powered intelligence.',
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setTokenState] = useState<string | null>(getAuthToken());
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [settings, setSettings] = useState<PlatformSettings>(DEFAULT_SETTINGS);

  const [authModalOpen, setAuthModalOpen] = useState<boolean>(false);
  const [authModalMode, setAuthModalMode] = useState<'login' | 'register'>('login');
  const [upgradeModalOpen, setUpgradeModalOpen] = useState<boolean>(false);

  const fetchCurrentUser = async () => {
    try {
      const storedToken = getAuthToken();
      if (!storedToken) {
        setIsLoading(false);
        return;
      }
      const data = await api.getMe();
      setUser(data.user);
      if (data.settings) setSettings(data.settings);
    } catch (err) {
      console.warn('Session verification failed, logging out:', err);
      setAuthToken(null);
      setTokenState(null);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCurrentUser();
    // Also fetch settings independently
    api.getSettings().then((res) => {
      if (res && res.settings) setSettings(res.settings);
    }).catch(() => {});
  }, []);

  const login = async (email: string, pass: string) => {
    const res = await api.login(email, pass);
    setAuthToken(res.token);
    setTokenState(res.token);
    setUser(res.user);
    setAuthModalOpen(false);
  };

  const register = async (name: string, email: string, pass: string) => {
    const res = await api.register(name, email, pass);
    setAuthToken(res.token);
    setTokenState(res.token);
    setUser(res.user);
    setAuthModalOpen(false);
  };

  const logout = () => {
    setAuthToken(null);
    setTokenState(null);
    setUser(null);
  };

  const refreshUser = async () => {
    try {
      const data = await api.getMe();
      setUser(data.user);
      if (data.settings) setSettings(data.settings);
    } catch (e) {
      // ignore
    }
  };

  const upgradeToPro = async (paymentMethod: string, transactionRef?: string) => {
    const res = await api.upgradePlan(paymentMethod, transactionRef);
    if (res.user) {
      setUser(res.user);
    }
    setUpgradeModalOpen(false);
  };

  const isPro = user?.plan === 'pro';
  const isAdmin = user?.role === 'admin';

  const remainingPdfOps = isPro
    ? Infinity
    : Math.max(0, (settings.freePdfOpsLimit || 3) - (user?.pdfOpsCount || 0));

  const remainingAiQueries = isPro
    ? Infinity
    : Math.max(0, (settings.freeAiQueriesLimit || 5) - (user?.aiQueriesCount || 0));

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        settings,
        isPro,
        isAdmin,
        remainingPdfOps,
        remainingAiQueries,
        login,
        register,
        logout,
        refreshUser,
        upgradeToPro,
        authModalOpen,
        authModalMode,
        openAuthModal: (mode = 'login') => {
          setAuthModalMode(mode);
          setAuthModalOpen(true);
        },
        closeAuthModal: () => setAuthModalOpen(false),
        upgradeModalOpen,
        openUpgradeModal: () => setUpgradeModalOpen(true),
        closeUpgradeModal: () => setUpgradeModalOpen(false),
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
