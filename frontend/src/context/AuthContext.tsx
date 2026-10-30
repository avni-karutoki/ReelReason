import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import { AVATAR_CREATOR_IMG } from '../data/mockData';

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  avatarUrl: string;
  creatorHandle: string;
  isGuest: boolean;
  createdAt: string;
}

export type AuthMode = 'login' | 'signup' | 'guest';

interface AuthContextType {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isGuest: boolean;
  isAuthModalOpen: boolean;
  authModalMode: AuthMode;
  openAuthModal: (mode?: AuthMode) => void;
  closeAuthModal: () => void;
  login: (email: string, password: string) => Promise<boolean>;
  signup: (name: string, email: string, password: string) => Promise<boolean>;
  loginAsGuest: () => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const STORAGE_KEY_AUTH = 'reelreason_auth_session_v1';

const DEFAULT_GUEST_USER: AuthUser = {
  id: 'usr-guest-01',
  name: 'Demo Creator',
  email: 'guest@reelreason.demo',
  avatarUrl: AVATAR_CREATOR_IMG,
  creatorHandle: '@reelreason_demo',
  isGuest: true,
  createdAt: new Date().toISOString().split('T')[0]
};

const DEMO_SAVED_USERS: Record<string, { password: string; user: AuthUser }> = {
  'maya@studioforward.co': {
    password: 'password123',
    user: {
      id: 'usr-maya-01',
      name: 'Maya Chen',
      email: 'maya@studioforward.co',
      avatarUrl: AVATAR_CREATOR_IMG,
      creatorHandle: '@mayachen',
      isGuest: false,
      createdAt: '2026-10-20'
    }
  },
  'creator@reelreason.studio': {
    password: 'password123',
    user: {
      id: 'usr-creator-02',
      name: 'Alex Rivera',
      email: 'creator@reelreason.studio',
      avatarUrl: AVATAR_CREATOR_IMG,
      creatorHandle: '@alexcreates',
      isGuest: false,
      createdAt: '2026-10-25'
    }
  }
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_AUTH);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.warn('Failed to parse auth session:', e);
    }
    // Default to Guest user so demo is completely seamless
    return DEFAULT_GUEST_USER;
  });

  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<AuthMode>('login');

  const openAuthModal = useCallback((mode: AuthMode = 'login') => {
    setAuthModalMode(mode);
    setIsAuthModalOpen(true);
  }, []);

  const closeAuthModal = useCallback(() => {
    setIsAuthModalOpen(false);
  }, []);

  const persistUser = (u: AuthUser | null) => {
    setUser(u);
    try {
      if (u) {
        localStorage.setItem(STORAGE_KEY_AUTH, JSON.stringify(u));
      } else {
        localStorage.removeItem(STORAGE_KEY_AUTH);
      }
    } catch (e) {
      console.warn('Failed to save auth session to localStorage:', e);
    }
  };

  const login = async (email: string, password: string): Promise<boolean> => {
    // Simulated network delay for smooth realistic animation
    await new Promise(res => setTimeout(res, 350));

    const cleanEmail = email.trim().toLowerCase();
    const cleanPass = password.trim();

    if (!cleanEmail || !cleanPass) {
      toast.error('Please enter both email and password.');
      return false;
    }

    // Check if known demo user or accept valid format for frontend demo
    const existing = DEMO_SAVED_USERS[cleanEmail];
    let loggedUser: AuthUser;

    if (existing) {
      if (existing.password !== cleanPass && cleanPass !== 'demo' && cleanPass !== 'password123') {
        toast.error('Incorrect password. (Tip: Use "password123" for demo accounts)');
        return false;
      }
      loggedUser = existing.user;
    } else {
      // Dynamic user generation for demo simulation
      const inferredName = cleanEmail.split('@')[0]
        .replace(/[._-]/g, ' ')
        .replace(/\b\w/g, l => l.toUpperCase());
      loggedUser = {
        id: `usr-${Date.now().toString(36)}`,
        name: inferredName || 'Studio Creator',
        email: cleanEmail,
        avatarUrl: AVATAR_CREATOR_IMG,
        creatorHandle: `@${cleanEmail.split('@')[0]}`,
        isGuest: false,
        createdAt: new Date().toISOString().split('T')[0]
      };
    }

    persistUser(loggedUser);
    setIsAuthModalOpen(false);
    toast.success(`Welcome back, ${loggedUser.name}!`);
    return true;
  };

  const signup = async (name: string, email: string, password: string): Promise<boolean> => {
    await new Promise(res => setTimeout(res, 400));

    const cleanName = name.trim();
    const cleanEmail = email.trim().toLowerCase();
    const cleanPass = password.trim();

    if (!cleanName) {
      toast.error('Please enter your full name.');
      return false;
    }
    if (!cleanEmail || !cleanEmail.includes('@') || !cleanEmail.includes('.')) {
      toast.error('Please enter a valid email address.');
      return false;
    }
    if (cleanPass.length < 6) {
      toast.error('Password must be at least 6 characters long.');
      return false;
    }

    const newUser: AuthUser = {
      id: `usr-${Date.now().toString(36)}`,
      name: cleanName,
      email: cleanEmail,
      avatarUrl: AVATAR_CREATOR_IMG,
      creatorHandle: `@${cleanName.toLowerCase().replace(/\s+/g, '')}`,
      isGuest: false,
      createdAt: new Date().toISOString().split('T')[0]
    };

    persistUser(newUser);
    setIsAuthModalOpen(false);
    toast.success(`Account created successfully! Welcome to ReelReason, ${cleanName}.`);
    return true;
  };

  const loginAsGuest = useCallback(() => {
    persistUser(DEFAULT_GUEST_USER);
    setIsAuthModalOpen(false);
    toast.info('Continuing as Guest Demo Creator. All features are accessible.');
  }, []);

  const logout = useCallback(() => {
    persistUser(DEFAULT_GUEST_USER);
    toast.info('Signed out. Reset to Guest Demo mode.');
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: Boolean(user && !user.isGuest),
        isGuest: Boolean(user?.isGuest),
        isAuthModalOpen,
        authModalMode,
        openAuthModal,
        closeAuthModal,
        login,
        signup,
        loginAsGuest,
        logout
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
