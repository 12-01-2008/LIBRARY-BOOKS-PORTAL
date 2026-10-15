import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ShieldCheck, Lock, Mail, AlertCircle, Sparkles, Key } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { login, loginAsDemoLibrarian, isLibrarian, isSupabaseConfigured } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // If already logged in, redirect to dashboard
  React.useEffect(() => {
    if (isLibrarian) {
      navigate('/librarian/dashboard', { replace: true });
    }
  }, [isLibrarian, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    const res = await login(email, password);
    setIsSubmitting(false);

    if (res.success) {
      navigate('/librarian/dashboard');
    } else {
      setError(res.error || 'Invalid credentials or non-librarian role');
    }
  };

  const handleDemoLogin = () => {
    loginAsDemoLibrarian();
    navigate('/librarian/dashboard');
  };

  return (
    <div className="min-h-[75vh] flex items-center justify-center px-4 py-12">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="w-full max-w-md bg-[var(--color-surface)] border border-[var(--color-border)] rounded-3xl p-6 sm:p-8 shadow-xl space-y-6"
      >
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-[var(--color-primary)] text-amber-400 flex items-center justify-center mx-auto shadow-md">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-bold font-serif-academic text-[var(--color-text-main)]">
            Librarian Access Portal
          </h1>
          <p className="text-xs text-[var(--color-text-muted)] max-w-xs mx-auto">
            Authorized staff login for catalog updates, loan check-outs, and student hold alerts.
          </p>
        </div>

        {error && (
          <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-500 text-xs flex items-center gap-2 font-medium">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-[var(--color-text-main)] mb-1.5">
              Staff Email Address
            </label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="librarian@campus.edu"
                className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-[var(--color-bg)] border border-[var(--color-border)] text-xs sm:text-sm text-[var(--color-text-main)] focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-[var(--color-text-main)] mb-1.5">
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-[var(--color-bg)] border border-[var(--color-border)] text-xs sm:text-sm text-[var(--color-text-main)] focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-2.5 rounded-xl bg-[var(--color-primary)] hover:bg-[var(--color-primary-light)] text-white text-xs sm:text-sm font-bold transition-colors shadow-sm disabled:opacity-50"
          >
            {isSubmitting ? 'Verifying with Supabase Auth...' : 'Sign in as Librarian'}
          </button>
        </form>

        {/* Demo Login or Production Supabase Enforcement Notice */}
        <div className="pt-4 border-t border-[var(--color-border)] space-y-3">
          {isSupabaseConfigured ? (
            <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-xs space-y-2">
              <div className="flex items-center gap-1.5 font-bold text-emerald-800 dark:text-emerald-300">
                <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span>Supabase Authentication Active</span>
              </div>
              <p className="text-[11px] text-[var(--color-text-muted)] leading-relaxed">
                Demo librarian bypass is strictly disabled because <code className="px-1 py-0.5 rounded bg-black/5 dark:bg-white/10 font-mono text-[10px]">SUPABASE_URL</code> and <code className="px-1 py-0.5 rounded bg-black/5 dark:bg-white/10 font-mono text-[10px]">SUPABASE_SERVICE_ROLE_KEY</code> are configured. Please sign in above with your registered Supabase staff account.
              </p>
              <div className="p-2.5 rounded-xl bg-[var(--color-surface)] border border-[var(--color-border)] text-[10px] space-y-1 font-mono text-[var(--color-text-muted)]">
                <div className="font-sans font-semibold text-[11px] text-[var(--color-text-main)]">Role Assignment SQL:</div>
                <code>UPDATE public.profiles SET role = 'librarian' WHERE id = 'auth-user-id';</code>
              </div>
            </div>
          ) : (
            <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-xs space-y-2">
              <div className="flex items-center gap-1.5 font-bold text-amber-700 dark:text-amber-300">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Instant Evaluator Demo Login (Preview Mode)</span>
              </div>
              <p className="text-[11px] text-[var(--color-text-muted)] leading-relaxed">
                Click below to immediately enter the librarian dashboard with full inventory management, issue/return controls, and live student alerts:
              </p>
              <button
                type="button"
                onClick={handleDemoLogin}
                className="w-full py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition-colors shadow-xs flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Key className="w-3.5 h-3.5" />
                <span>1-Click Demo Librarian Sign-In</span>
              </button>
            </div>
          )}
        </div>

      </motion.div>
    </div>
  );
};
