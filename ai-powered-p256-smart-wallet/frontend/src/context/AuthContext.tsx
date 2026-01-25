import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface User {
  id: number;
  username: string;
}

interface Wallet {
  address: string;
  balance: string | null;
}

interface Session {
  token: string;
  expiresAt: string;
}

interface AuthContextType {
  user: User | null;
  wallet: Wallet | null;
  session: Session | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (user: User, wallet: Wallet, session: Session) => void;
  logout: () => void;
  updateBalance: (balance: string) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const SESSION_STORAGE_KEY = 'ai_wallet_session';
const USER_STORAGE_KEY = 'ai_wallet_user';
const WALLET_STORAGE_KEY = 'ai_wallet_wallet';

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load session from localStorage on mount
  useEffect(() => {
    const loadSession = () => {
      try {
        const storedSession = localStorage.getItem(SESSION_STORAGE_KEY);
        const storedUser = localStorage.getItem(USER_STORAGE_KEY);
        const storedWallet = localStorage.getItem(WALLET_STORAGE_KEY);

        if (storedSession && storedUser && storedWallet) {
          const parsedSession = JSON.parse(storedSession);
          const parsedUser = JSON.parse(storedUser);
          const parsedWallet = JSON.parse(storedWallet);

          // Check if session is expired
          const expiresAt = new Date(parsedSession.expiresAt);
          if (expiresAt > new Date()) {
            setSession(parsedSession);
            setUser(parsedUser);
            setWallet(parsedWallet);
          } else {
            // Session expired, clear storage
            localStorage.removeItem(SESSION_STORAGE_KEY);
            localStorage.removeItem(USER_STORAGE_KEY);
            localStorage.removeItem(WALLET_STORAGE_KEY);
          }
        }
      } catch (error) {
        console.error('Error loading session:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadSession();
  }, []);

  const login = (newUser: User, newWallet: Wallet, newSession: Session) => {
    setUser(newUser);
    setWallet(newWallet);
    setSession(newSession);

    // Persist to localStorage
    localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(newUser));
    localStorage.setItem(WALLET_STORAGE_KEY, JSON.stringify(newWallet));
    localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(newSession));
  };

  const logout = () => {
    setUser(null);
    setWallet(null);
    setSession(null);

    // Clear localStorage
    localStorage.removeItem(USER_STORAGE_KEY);
    localStorage.removeItem(WALLET_STORAGE_KEY);
    localStorage.removeItem(SESSION_STORAGE_KEY);
  };

  const updateBalance = (balance: string) => {
    if (wallet) {
      const updatedWallet = { ...wallet, balance };
      setWallet(updatedWallet);
      localStorage.setItem(WALLET_STORAGE_KEY, JSON.stringify(updatedWallet));
    }
  };

  const isAuthenticated = !!user && !!session && !!wallet;

  const value: AuthContextType = {
    user,
    wallet,
    session,
    isAuthenticated,
    isLoading,
    login,
    logout,
    updateBalance,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
