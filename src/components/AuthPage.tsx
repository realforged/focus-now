import React, { useState } from 'react';
import { api, ApiError } from '../api';
import { Zap, Shield, Sparkles, AlertCircle, ArrowRight, Eye, EyeOff, CheckCircle2, Lock, Mail } from 'lucide-react';

interface AuthPageProps {
  onAuthSuccess: (token: string, user: any) => void;
}

export default function AuthPage({ onAuthSuccess }: AuthPageProps) {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [infoMessage, setInfoMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [guestLoading, setGuestLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading || guestLoading) return;

    setError(null);
    setInfoMessage(null);

    const normalizedEmail = email.trim().toLowerCase();
    if (!normalizedEmail || !password) {
      setError('Please provide both your email address and password.');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    setLoading(true);

    try {
      if (isLogin) {
        const data = await api.login(normalizedEmail, password);
        onAuthSuccess(data.token, data.user);
      } else {
        const data = await api.register(normalizedEmail, password);
        onAuthSuccess(data.token, data.user);
      }
    } catch (err: any) {
      if (err instanceof ApiError && err.status === 202) {
        setInfoMessage(err.message);
        setIsLogin(true);
      } else if (err instanceof ApiError && err.status === 404) {
        setError(err.message || 'No account found. Switch to Create Account to start your 90-day mission.');
      } else {
        setError(err.message || 'An unexpected error occurred. Please try again or use Guest Mode.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGuestLogin = async () => {
    if (loading || guestLoading) return;
    setError(null);
    setInfoMessage(null);
    setGuestLoading(true);

    try {
      const data = await api.startGuestSession();
      onAuthSuccess(data.token, data.user);
    } catch (err: any) {
      setError(err.message || 'Failed to initialize guest session. Please try again.');
    } finally {
      setGuestLoading(false);
    }
  };

  return (
    <div className="flex font-sans min-h-screen items-center justify-center bg-[#F4F6F9] px-4 py-8 relative">
      {/* Background ambient gradient */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-4xl h-96 bg-gradient-to-b from-emerald-500/10 via-emerald-500/5 to-transparent blur-3xl pointer-events-none" />

      <div className="w-full max-w-md bg-white border border-gray-100 rounded-3xl shadow-xl shadow-gray-200/50 p-6 md:p-8 relative z-10">
        {/* Brand Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-emerald-500 text-white shadow-lg shadow-emerald-500/25 mb-3">
            <Zap className="w-6 h-6 stroke-[2.5px]" />
          </div>
          <h1 className="text-2xl font-black text-gray-900 tracking-tight">
            Focus Now
          </h1>
          <p className="text-xs text-gray-500 font-semibold mt-1">
            90-Day Lock-In Transformation
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex bg-gray-100 p-1 rounded-2xl mb-6">
          <button
            type="button"
            onClick={() => {
              setIsLogin(true);
              setError(null);
              setInfoMessage(null);
            }}
            className={`flex-1 py-2.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
              isLogin
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-500 hover:text-gray-800'
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => {
              setIsLogin(false);
              setError(null);
              setInfoMessage(null);
            }}
            className={`flex-1 py-2.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
              !isLogin
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-500 hover:text-gray-800'
            }`}
          >
            Create Account
          </button>
        </div>

        {/* Informational Banner */}
        {infoMessage && (
          <div className="mb-4 p-3.5 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-start gap-2.5 text-emerald-800 text-xs leading-relaxed">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <div>{infoMessage}</div>
          </div>
        )}

        {/* Error Banner */}
        {error && (
          <div className="mb-4 p-3.5 bg-rose-50 border border-rose-200 rounded-2xl flex items-start gap-2.5 text-rose-800 text-xs leading-relaxed">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <div>{error}</div>
          </div>
        )}

        {/* Credentials Form */}
        <form onSubmit={handleSubmit} className="space-y-3.5">
          <div>
            <label className="block text-[11px] font-bold text-gray-700 uppercase tracking-wider mb-1.5">
              Email Address
            </label>
            <div className="relative flex items-center">
              <Mail className="w-4 h-4 text-gray-400 absolute left-3.5 pointer-events-none" />
              <input
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (error) setError(null);
                }}
                placeholder="you@example.com"
                className="w-full bg-gray-50 border border-gray-200 text-gray-900 rounded-xl py-2.5 pl-10 pr-4 text-sm outline-none transition focus:bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
                required
                autoComplete="email"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-gray-700 uppercase tracking-wider mb-1.5">
              Password
            </label>
            <div className="relative flex items-center">
              <Lock className="w-4 h-4 text-gray-400 absolute left-3.5 pointer-events-none" />
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (error) setError(null);
                }}
                placeholder={isLogin ? 'Enter your password' : 'At least 6 characters'}
                className="w-full bg-gray-50 border border-gray-200 text-gray-900 rounded-xl py-2.5 pl-10 pr-10 text-sm outline-none transition focus:bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
                required
                autoComplete={isLogin ? 'current-password' : 'new-password'}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 text-gray-400 hover:text-gray-600 p-1 cursor-pointer"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading || guestLoading}
            className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-black py-3 rounded-xl transition shadow-lg shadow-emerald-500/25 flex items-center justify-center gap-2 cursor-pointer mt-4 active:scale-[0.98] disabled:opacity-50"
          >
            {loading ? (
              <span className="w-5 h-5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <span>{isLogin ? 'Sign In to Your Mission' : 'Start 90-Day Journey'}</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Divider */}
        <div className="relative my-5 text-center">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-100" />
          </div>
          <span className="relative bg-white px-3 text-[10px] text-gray-400 font-extrabold uppercase tracking-widest">
            OR EXPLORE INSTANTLY
          </span>
        </div>

        {/* 1-Click Guest / Demo Mode Button */}
        <button
          type="button"
          onClick={handleGuestLogin}
          disabled={loading || guestLoading}
          className="w-full bg-gray-50 hover:bg-gray-100 border border-gray-200 text-gray-800 font-extrabold py-3 rounded-xl transition flex items-center justify-center gap-2 cursor-pointer text-xs active:scale-[0.98] shadow-xs"
        >
          {guestLoading ? (
            <span className="w-4 h-4 border-2 border-gray-400/40 border-t-gray-600 rounded-full animate-spin" />
          ) : (
            <>
              <Sparkles className="w-4 h-4 text-amber-500 fill-amber-400" />
              <span>Continue as Guest (1-Click Instant Demo)</span>
            </>
          )}
        </button>

        {/* Footer Note */}
        <div className="mt-5 text-center">
          <p className="text-[11px] text-gray-400 flex items-center justify-center gap-1.5">
            <Shield className="w-3.5 h-3.5 text-gray-400" />
            Your progress & data stay saved locally on this device.
          </p>
        </div>
      </div>
    </div>
  );
}
