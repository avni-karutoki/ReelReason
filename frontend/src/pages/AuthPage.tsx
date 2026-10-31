import React, { useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import {
  Film,
  Mail,
  MailCheck,
  Lock,
  User,
  ArrowRight,
  Eye,
  EyeOff,
  Sparkles,
  Zap,
  UserCheck
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const AuthPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initialMode = searchParams.get('mode') === 'signup' ? 'signup' : 'login';

  const { login, signup, resetPassword, loginAsGuest } = useAuth();

  const [activeTab, setActiveTab] = useState<'login' | 'signup' | 'guest' | 'forgot'>(initialMode);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [resetSent, setResetSent] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string; name?: string }>({});

  const validate = () => {
    const newErrors: { email?: string; password?: string; name?: string } = {};
    if (!email || !email.includes('@')) {
      newErrors.email = 'Please enter a valid email address';
    }
    if (activeTab !== 'forgot' && (!password || password.length < 6)) {
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
      if (activeTab === 'forgot') {
        const sent = await resetPassword(email);
        if (sent) {
          setResetSent(true);
        }
        return;
      }

      let success = false;
      if (activeTab === 'login') {
        success = await login(email, password);
      } else {
        success = await signup(name, email, password);
      }
      if (success) {
        navigate('/upload');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleGuest = () => {
    loginAsGuest();
    navigate('/upload');
  };

  const fillDemoAccount = (demoEmail: string) => {
    setEmail(demoEmail);
    setPassword('password123');
    setErrors({});
  };

  return (
    <div className="min-h-screen bg-canvas flex flex-col justify-center py-12 sm:px-6 lg:px-8 animate-fade-in">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center space-y-3">
        <Link to="/" className="inline-flex items-center gap-2.5 group">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-600 text-white flex items-center justify-center shadow-md shadow-indigo-500/25 group-hover:scale-105 transition-transform duration-200">
            <Film className="w-5 h-5 stroke-[2.2]" />
          </div>
          <span className="text-2xl font-extrabold tracking-tight text-main font-sans">
            Reel<span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-violet-600 dark:from-indigo-400 dark:to-violet-400">Reason</span>
          </span>
        </Link>
        <h2 className="text-xl sm:text-2xl font-bold font-sans text-main">
          {activeTab === 'signup'
            ? 'Create your Creator Studio account'
            : activeTab === 'forgot'
              ? 'Reset your password'
              : 'Welcome back to ReelReason'}
        </h2>
        <p className="text-xs text-sub max-w-xs mx-auto">
          AI video repurposing designed for purposeful high-retention vertical reels.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4 sm:px-0">
        <div className="bg-surface-main py-8 px-6 sm:px-8 border border-subtle rounded-2xl shadow-xl space-y-6">
          
          {/* Tabs */}
          <div className="grid grid-cols-3 gap-1 p-1 bg-surface-sub rounded-xl text-xs font-semibold">
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

          {activeTab === 'guest' ? (
            <div className="py-4 space-y-5 text-center">
              <div className="w-14 h-14 rounded-2xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mx-auto shadow-sm">
                <Zap className="w-7 h-7" />
              </div>

              <div className="space-y-1">
                <h3 className="text-base font-bold text-main font-sans">
                  Instant Demo Access
                </h3>
                <p className="text-xs text-sub leading-relaxed max-w-xs mx-auto">
                  Experience the full clipping and editing suite immediately without registration.
                </p>
              </div>

              <button
                type="button"
                onClick={handleGuest}
                className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 active:scale-[0.98] text-white text-xs font-bold shadow-md shadow-indigo-500/25 transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <UserCheck className="w-4 h-4" />
                <span>Continue as Guest Demo Creator</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <div className="pt-2">
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
            </div>
          ) : activeTab === 'forgot' ? (
            resetSent ? (
              <div className="py-4 space-y-5 text-center">
                <div className="w-14 h-14 rounded-2xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mx-auto shadow-sm">
                  <MailCheck className="w-7 h-7" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-base font-bold text-main font-sans">
                    Check your inbox
                  </h3>
                  <p className="text-xs text-sub leading-relaxed max-w-xs mx-auto">
                    We sent a password reset link to <span className="font-semibold text-main break-all">{email}</span>. Follow the link to choose a new password.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => { setActiveTab('login'); setResetSent(false); }}
                  className="w-full py-2.5 px-4 rounded-xl bg-surface-sub hover:bg-surface-ter border border-subtle text-xs font-semibold text-main transition-colors cursor-pointer"
                >
                  Back to Sign In
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <p className="text-xs text-sub leading-relaxed">
                  Enter the email you signed up with and we&apos;ll send you a password reset link.
                </p>

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

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 active:scale-[0.98] text-white text-xs font-bold shadow-md shadow-indigo-500/25 transition-all flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
                >
                  {isLoading ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <span>Send Reset Link</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>

                <div className="pt-2 text-center">
                  <button
                    type="button"
                    onClick={() => { setActiveTab('login'); setResetSent(false); }}
                    className="text-xs text-sub hover:text-indigo-600 dark:hover:text-indigo-400 font-medium transition-colors cursor-pointer"
                  >
                    Back to Sign In
                  </button>
                </div>
              </form>
            )
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              
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
                {activeTab === 'login' && (
                  <button
                    type="button"
                    onClick={() => { setActiveTab('forgot'); setResetSent(false); setErrors({}); }}
                    className="mt-1.5 text-[11px] text-indigo-600 dark:text-indigo-400 hover:bg-indigo-500/10 px-1 py-0.5 rounded transition-colors font-medium cursor-pointer"
                  >
                    Forgot password?
                  </button>
                )}
              </div>

              {/* Demo Credentials Assistant */}
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
                  onClick={handleGuest}
                  className="text-xs text-sub hover:text-indigo-600 dark:hover:text-indigo-400 font-medium transition-colors cursor-pointer"
                >
                  Or explore as <strong className="underline">Guest Demo Creator</strong>
                </button>
              </div>

            </form>
          )}

        </div>

        <div className="mt-6 text-center text-xs text-sub">
          <Link to="/" className="text-sub hover:text-main font-medium">
            ← Return to Public Showcase
          </Link>
        </div>
      </div>
    </div>
  );
};
