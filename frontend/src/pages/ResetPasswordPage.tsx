import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { toast } from 'sonner';
import {
  Film,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  ShieldCheck
} from 'lucide-react';
import { frontendSupabase } from '../api/supabaseClient';

/**
 * Password recovery landing page. Users arrive here from the "Recover
 * password" email link — Supabase signs them in via the URL hash, and this
 * page collects (and applies) the new password.
 */
export const ResetPasswordPage: React.FC = () => {
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    if (!frontendSupabase) {
      setError('Password recovery requires a live Supabase connection.');
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const { error: updateError } = await frontendSupabase.auth.updateUser({ password });
      if (updateError) {
        setError(updateError.message || 'Could not update the password. The recovery link may have expired — request a new one.');
        return;
      }
      toast.success('Password updated! You are now signed in.');
      navigate('/upload');
    } finally {
      setIsLoading(false);
    }
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
          Choose a new password
        </h2>
        <p className="text-xs text-sub max-w-xs mx-auto">
          Your recovery link was verified — set a new password to regain studio access.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4 sm:px-0">
        <div className="bg-surface-main py-8 px-6 sm:px-8 border border-subtle rounded-2xl shadow-xl space-y-6">
          <div className="py-2 flex justify-center">
            <div className="w-14 h-14 rounded-2xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shadow-sm">
              <ShieldCheck className="w-7 h-7" />
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="new-password" className="block text-xs font-semibold text-main mb-1">
                New Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-sub absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  id="new-password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); setError(null); }}
                  placeholder="At least 6 characters"
                  autoComplete="new-password"
                  className={`w-full pl-10 pr-10 py-2.5 rounded-xl bg-canvas border text-xs text-main placeholder:text-sub/50 focus:outline-none focus:border-indigo-500 transition-colors ${
                    error ? 'border-red-500' : 'border-subtle'
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
            </div>

            <div>
              <label htmlFor="confirm-password" className="block text-xs font-semibold text-main mb-1">
                Confirm New Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-sub absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  id="confirm-password"
                  type={showPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => { setConfirmPassword(e.target.value); setError(null); }}
                  placeholder="Repeat the new password"
                  autoComplete="new-password"
                  className={`w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-canvas border text-xs text-main placeholder:text-sub/50 focus:outline-none focus:border-indigo-500 transition-colors ${
                    error ? 'border-red-500' : 'border-subtle'
                  }`}
                />
              </div>
            </div>

            {error && (
              <p className="text-[11px] text-red-500">{error}</p>
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
                  <span>Update Password</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          <div className="pt-2 text-center">
            <Link to="/login" className="text-xs text-sub hover:text-indigo-600 dark:hover:text-indigo-400 font-medium transition-colors">
              Back to Sign In
            </Link>
          </div>
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
