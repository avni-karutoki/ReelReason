import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import { AVATAR_CREATOR_IMG } from '../data/mockData';
import { frontendSupabase, isSupabaseAuthConfigured } from '../api/supabaseClient';
import { setAuthToken, getCurrentUser } from '../api/client';

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
  resetPassword: (email: string) => Promise<boolean>;
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

function supabaseUserToAuthUser(su: { id: string; email?: string | null; created_at?: string | null; user_metadata?: Record<string, unknown> }): AuthUser {
  const meta = su.user_metadata || {};
  const fullName = (meta.full_name as string) || (meta.name as string) || su.email?.split('@')[0] || 'Creator';
  return {
    id: su.id,
    name: fullName,
    email: su.email || '',
    avatarUrl: AVATAR_CREATOR_IMG,
    creatorHandle: `@${fullName.toLowerCase().replace(/\s+/g, '')}`,
    isGuest: false,
    createdAt: (su.created_at || new Date().toISOString()).split('T')[0],
  };
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_AUTH);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.warn('Failed to parse auth session:', (e as Error)?.message || e);
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
      console.warn('Failed to save auth session to localStorage:', (e as Error)?.message || e);
    }
  };

  /* ------------------------------------------------------------------ */
  /* Real Supabase auth: hydrate the session and feed its JWT to the API  */
  /* ------------------------------------------------------------------ */
  useEffect(() => {
    const sb = frontendSupabase;
    if (!sb) {
      // Demo mode — guest/demo tokens work against the backend's mock mode
      setAuthToken('demo-token');
      return;
    }

    let cancelled = false;

    const applySession = async () => {
      const { data, error } = await sb.auth.getSession();
      if (cancelled || error) return;
      const session = data.session;
      setAuthToken(session?.access_token ?? null);
      if (session?.user) {
        const authUser = supabaseUserToAuthUser(session.user);
        if (!cancelled) persistUser(authUser);
      } else if (!cancelled) {
        persistUser(DEFAULT_GUEST_USER);
      }
    };

    applySession();

    const { data: listener } = sb.auth.onAuthStateChange((_event, session) => {
      if (cancelled) return;
      setAuthToken(session?.access_token ?? null);
      if (session?.user) {
        const authUser = supabaseUserToAuthUser(session.user);
        persistUser(authUser);
      } else {
        persistUser(DEFAULT_GUEST_USER);
      }
    });

    return () => {
      cancelled = true;
      listener.subscription.unsubscribe();
    };
  }, []);

  /* Pull the backend-side profile (ensures public.users row + defaults exist) */
  useEffect(() => {
    if (!frontendSupabase || !user || user.isGuest) return;
    let cancelled = false;
    getCurrentUser()
      .then((profile) => {
        if (cancelled || !profile) return;
        const name = profile.full_name || user.name;
        const handle = profile.creator_handle || user.creatorHandle;
        if (name !== user.name || handle !== user.creatorHandle) {
          persistUser({ ...user, name, creatorHandle: handle });
        }
      })
      .catch(() => { /* backend offline — local profile is authoritative */ });
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isSupabaseAuthConfigured, user?.id]);

  const login = async (email: string, password: string): Promise<boolean> => {
    const cleanEmail = email.trim().toLowerCase();
    const cleanPass = password.trim();

    if (!cleanEmail || !cleanPass) {
      toast.error('Please enter both email and password.');
      return false;
    }

    if (!frontendSupabase) {
      // ----------------------------------------------------------------
      // Demo fallback (no Supabase configured) — kept identical to before
      // ----------------------------------------------------------------
      if (isSupabaseAuthConfigured === false) {
        await new Promise(res => setTimeout(res, 350));
        const inferredName = cleanEmail.split('@')[0]
          .replace(/[._-]/g, ' ')
          .replace(/\b\w/g, l => l.toUpperCase());
        const loggedUser: AuthUser = {
          id: `usr-${Date.now().toString(36)}`,
          name: inferredName || 'Studio Creator',
          email: cleanEmail,
          avatarUrl: AVATAR_CREATOR_IMG,
          creatorHandle: `@${cleanEmail.split('@')[0]}`,
          isGuest: false,
          createdAt: new Date().toISOString().split('T')[0]
        };
        persistUser(loggedUser);
        setIsAuthModalOpen(false);
        toast.success(`Welcome back, ${loggedUser.name}!`);
        return true;
      }
    }

    // Real Supabase sign-in
    const { data, error } = await frontendSupabase!.auth.signInWithPassword({
      email: cleanEmail,
      password: cleanPass,
    });

    if (error) {
      toast.error(error.message || 'Could not sign in. Check your credentials.');
      return false;
    }

    setIsAuthModalOpen(false);
    toast.success(`Welcome back, ${data.user ? supabaseUserToAuthUser(data.user).name : 'Creator'}!`);
    return true;
  };

  const signup = async (name: string, email: string, password: string): Promise<boolean> => {
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

    if (!frontendSupabase) {
      // Demo fallback
      await new Promise(res => setTimeout(res, 400));
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
    }

    const { data, error } = await frontendSupabase!.auth.signUp({
      email: cleanEmail,
      password: cleanPass,
      options: {
        data: { full_name: cleanName, creator_handle: `@${cleanName.toLowerCase().replace(/\s+/g, '')}` },
      },
    });

    if (error) {
      toast.error(error.message || 'Could not create the account.');
      return false;
    }

    // ensure_user_profile on the backend creates the public.users row on first API call
    setIsAuthModalOpen(false);

    if (data.session) {
      toast.success(`Account created successfully! Welcome to ReelReason, ${cleanName}.`);
    } else {
      toast.success('Account created! Check your inbox to confirm your email, then sign in.');
    }
    return true;
  };

  const resetPassword = async (email: string): Promise<boolean> => {
    const cleanEmail = email.trim().toLowerCase();

    if (!cleanEmail || !cleanEmail.includes('@') || !cleanEmail.includes('.')) {
      toast.error('Please enter a valid email address.');
      return false;
    }

    if (!frontendSupabase) {
      toast.info('Demo mode: connect Supabase auth to send real reset emails.');
      return false;
    }

    // The recovery link redirects back to /reset-password where the user
    // chooses a new password (Supabase signs them in via the link).
    const { error } = await frontendSupabase.auth.resetPasswordForEmail(cleanEmail, {
      redirectTo: `${window.location.origin}/reset-password`,
    });

    if (error) {
      toast.error(error.message || 'Could not send the password reset email.');
      return false;
    }

    toast.success('Password reset link sent — check your inbox.');
    return true;
  };

  const loginAsGuest = useCallback(() => {
    persistUser(DEFAULT_GUEST_USER);
    setAuthToken('demo-token');
    setIsAuthModalOpen(false);
    toast.info('Continuing as Guest Demo Creator. All features are accessible.');
  }, []);

  const logout = useCallback(() => {
    if (frontendSupabase) {
      frontendSupabase.auth.signOut().finally(() => {
        setAuthToken(null);
        persistUser(DEFAULT_GUEST_USER);
        toast.info('Signed out. Reset to Guest Demo mode.');
      });
    } else {
      setAuthToken(null);
      persistUser(DEFAULT_GUEST_USER);
      toast.info('Signed out. Reset to Guest Demo mode.');
    }
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
        resetPassword,
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
