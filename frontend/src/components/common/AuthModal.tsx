import React, { useState } from 'react';
import {
  X,
  Mail,
  Lock,
  User,
  Sparkles,
  ArrowRight,
  Eye,
  EyeOff,
  Film,
  CheckCircle2,
  AlertCircle,
  Zap,
  UserCheck
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'sonner';

export const AuthModal: React.FC = () => {
  const { isAuthModalOpen, authModalMode, closeAuthModal, login, signup, loginAsGuest } = useAuth();

  const [activeTab, setActiveTab] = useState<'login' | 'signup' | 'guest'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string; name?: string }>({});

  // Sync mode when modal opens
  React.useEffect(() => {
    if (authModalMode) {
      setActiveTab(authModalMode);
    }
    setErrors({});
  }, [authModalMode, isAuthModalOpen]);

  if (!isAuthModalOpen) return null;

  const validate = () => {
    const newErrors: { email?: string; password?: string; name?: string } = {};
    if (!email || !email.includes('@')) {
      newErrors.email = 'Please enter a valid email address';
    }
    if (!password || password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }
    if (activeTab === 'signup' && (!name || name.trim().length < 2)) {
      newErrors.name = 'Please enter your creator or brand name';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsLoading(true);
    try {
      if (activeTab === 'login') {
        await login(email, password);
        toast.success('Welcome back to ReelReason Studio!');
      } else if (activeTab === 'signup') {
        await signup(name, email, password);
        toast.success('Account created! Welcome to ReelReason Studio.');
      }
      closeAuthModal();
    } catch (err: any) {
      toast.error(err.message || 'Authentication error');
    } finally {
      setIsLoading(false);
    }
  };

  const fillDemoAccount = (demoEmail: string) => {
    setEmail(demoEmail);
    setPassword('studio2026!');
    setName('Maya Chen');
    toast.info('Filled demo credentials');
  };

  const onClose = () => {
    closeAuthModal();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
      <div
        className="w-full max-w-md bg-surface-main border border-subtle rounded-3xl p-6 sm:p-7 shadow-2xl relative animate-scale-in"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header */}
        <div className="flex items-center justify-between pb-4 border-b border-subtle">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-600 text-white flex items-center justify-center shadow-md shadow-indigo-500/25">
              <Film className="w-4 h-4 stroke-[2.2]" />
            </div>
            <div>
              <span className="text-base font-extrabold tracking-tight text-main font-sans">
                Reel<span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-violet-600 dark:from-indigo-400 dark:to-violet-400">Reason</span>
              </span>
              <span className="text-[10px] font-mono block text-sub font-medium">
                Creator Studio Demo
              </span>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-sub hover:text-main hover:bg-surface-sub transition-colors cursor-pointer"
            aria-label="Close dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="grid grid-cols-3 gap-1 p-1 bg-surface-sub rounded-xl mt-5 text-xs font-semibold">
          <button
            type="button"
            onClick={() => { setActiveTab('login'); setErrors({}); }}
            className={`py-2 rounded-lg transition-all duration-150 cursor-pointer ${
              activeTab === 'login'
                ? 'bg-surface-main text-indigo-600 dark:text-indigo-400 shadow-xs font-bold'
                : 'text-sub hover:text-main'
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => { setActiveTab('signup'); setErrors({}); }}
            className={`py-2 rounded-lg transition-all duration-150 cursor-pointer ${
              activeTab === 'signup'
                ? 'bg-surface-main text-indigo-600 dark:text-indigo-400 shadow-xs font-bold'
                : 'text-sub hover:text-main'
            }`}
          >
            Sign Up
          </button>
          <button
            type="button"
            onClick={() => { setActiveTab('guest'); setErrors({}); }}
            className={`py-2 rounded-lg transition-all duration-150 flex items-center justify-center gap-1 cursor-pointer ${
              activeTab === 'guest'
                ? 'bg-surface-main text-indigo-600 dark:text-indigo-400 shadow-xs font-bold'
                : 'text-sub hover:text-main'
            }`}
          >
            <Sparkles className="w-3 h-3 text-indigo-500" />
            <span>Try Demo</span>
          </button>
        </div>

        {/* Tab 3: Continue as Guest / Try Demo */}
        {activeTab === 'guest' ? (
          <div className="py-6 space-y-5 text-center animate-fade-in">
            <div className="w-14 h-14 rounded-2xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mx-auto shadow-sm">
              <Zap className="w-7 h-7" />
            </div>

            <div className="space-y-1.5">
              <h3 className="text-lg font-bold text-main font-sans">
                Experience ReelReason Instantly
              </h3>
              <p className="text-xs text-sub max-w-xs mx-auto leading-relaxed">
                No password or account required. Access the complete studio workflow with our sample masterclasses and video clippers.
              </p>
            </div>

            <div className="space-y-2.5 pt-2">
              <button
                type="button"
                onClick={loginAsGuest}
                className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 active:scale-[0.98] text-white text-xs font-bold shadow-md shadow-indigo-500/25 transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <UserCheck className="w-4 h-4" />
                <span>Continue as Guest Demo Creator</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={() => {
                  fillDemoAccount('maya@studioforward.co');
                  setActiveTab('login');
                }}
                className="w-full py-2.5 px-4 rounded-xl bg-surface-sub hover:bg-surface-ter border border-subtle text-xs font-semibold text-main transition-colors cursor-pointer"
              >
                Or Log In with Demo Account (Maya Chen)
              </button>
            </div>

            <div className="flex items-center justify-center gap-4 text-[11px] text-sub pt-2 border-t border-subtle">
              <span className="flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-indigo-500" />
                All 8 Routes Accessible
              </span>
              <span className="flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-indigo-500" />
                Client-Side Safe
              </span>
            </div>
          </div>
        ) : (
          /* Tab 1 & 2: Login or Sign Up Form */
          <form onSubmit={handleSubmit} className="space-y-4 pt-5 animate-fade-in">
            
            {activeTab === 'signup' && (
              <div>
                <label className="block text-xs font-semibold text-main mb-1">
                  Full Name
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-sub absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => { setName(e.target.value); setErrors(prev => ({ ...prev, name: undefined })); }}
                    placeholder="e.g. Maya Chen"
                    className={`w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-canvas border text-xs text-main placeholder:text-sub/50 focus:outline-none focus:border-indigo-500 transition-colors ${
                      errors.name ? 'border-red-500' : 'border-subtle'
                    }`}
                  />
                </div>
                {errors.name && (
                  <p className="text-[11px] text-red-500 mt-1">{errors.name}</p>
                )}
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-main mb-1">
                Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-sub absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); setErrors(prev => ({ ...prev, email: undefined })); }}
                  placeholder="creator@studio.com"
                  className={`w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-canvas border text-xs text-main placeholder:text-sub/50 focus:outline-none focus:border-indigo-500 transition-colors ${
                    errors.email ? 'border-red-500' : 'border-subtle'
                  }`}
                />
              </div>
              {errors.email && (
                <p className="text-[11px] text-red-500 mt-1">{errors.email}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-main mb-1">
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-sub absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); setErrors(prev => ({ ...prev, password: undefined })); }}
                  placeholder={activeTab === 'signup' ? 'At least 6 characters' : 'Enter password'}
                  className={`w-full pl-10 pr-10 py-2.5 rounded-xl bg-canvas border text-xs text-main placeholder:text-sub/50 focus:outline-none focus:border-indigo-500 transition-colors ${
                    errors.password ? 'border-red-500' : 'border-subtle'
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="p-1.5 text-sub hover:text-main absolute right-2.5 top-1/2 -translate-y-1/2 transition-colors cursor-pointer"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.password && (
                <p className="text-[11px] text-red-500 mt-1">{errors.password}</p>
              )}
            </div>

            {/* Quick Demo Credentials Assistant */}
            {activeTab === 'login' && (
              <div className="p-3 bg-surface-sub rounded-xl border border-subtle flex items-center justify-between text-xs">
                <div>
                  <span className="font-semibold text-main block text-[11px]">Demo Credentials</span>
                  <span className="text-[10px] text-sub font-mono">maya@studioforward.co</span>
                </div>
                <button
                  type="button"
                  onClick={() => fillDemoAccount('maya@studioforward.co')}
                  className="px-2.5 py-1 text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 bg-indigo-500/10 hover:bg-indigo-500/20 rounded-lg transition-colors cursor-pointer"
                >
                  Auto-fill
                </button>
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 active:scale-[0.98] text-white text-xs font-bold shadow-md shadow-indigo-500/25 transition-all flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
            >
              {isLoading ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <span>{activeTab === 'login' ? 'Sign In to Studio' : 'Create Creator Account'}</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>

            <div className="pt-2 text-center">
              <button
                type="button"
                onClick={loginAsGuest}
                className="text-xs text-sub hover:text-indigo-600 dark:hover:text-indigo-400 font-medium transition-colors cursor-pointer"
              >
                Skip registration & continue as <strong className="underline">Guest Creator</strong>
              </button>
            </div>

          </form>
        )}

      </div>
    </div>
  );
};
