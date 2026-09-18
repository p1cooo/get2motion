'use client';

import React, { useState } from 'react';
import { X, Mail, Lock, User, ArrowRight } from 'lucide-react';
import { useAuth } from '../../lib/auth-context';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose }) => {
  const { signInWithEmail, signUpWithEmail, signInWithGoogle } = useAuth();

  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const mapFriendlyError = (error: unknown): string => {
    const code = typeof error === 'object' && error !== null && 'code' in error
      ? String(error.code)
      : String(error);

    if (code.includes('auth/email-already-in-use')) {
      return 'An account with this email already exists. Try signing in instead.';
    }
    if (code.includes('auth/invalid-email')) {
      return 'Enter a valid email address.';
    }
    if (code.includes('auth/wrong-password') || code.includes('auth/invalid-credential')) {
      return 'Incorrect email or password. Please check your details and try again.';
    }
    if (code.includes('auth/user-not-found')) {
      return 'No account found with this email. You can sign up in seconds!';
    }
    if (code.includes('auth/weak-password')) {
      return 'Please choose a password with at least 6 characters.';
    }
    if (code.includes('auth/operation-not-allowed')) {
      return 'Email and password sign-in is not enabled for this Firebase project.';
    }
    if (code.includes('auth/invalid-api-key')) {
      return 'This deployment has an invalid Firebase API key. Please contact support.';
    }
    if (code.includes('auth/unauthorized-domain')) {
      return 'This site is not authorized for Google sign-in yet.';
    }
    if (code.includes('auth/network-request-failed')) {
      return 'Unable to reach Firebase. Check your connection and try again.';
    }
    if (code.includes('auth/popup-closed-by-user')) {
      return 'Sign-in was cancelled. Click again when ready.';
    }
    return 'Unable to sign in right now. Please try again.';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (mode === 'signup') {
      if (!displayName.trim()) {
        setErrorMessage('Please enter your name or nickname.');
        return;
      }
      if (password !== confirmPassword) {
        setErrorMessage('Passwords do not match. Please verify your password.');
        return;
      }
    }

    setLoading(true);
    try {
      if (mode === 'signin') {
        await signInWithEmail(email, password);
      } else {
        await signUpWithEmail(displayName.trim(), email, password);
      }
      if (mode === 'signin') onClose();
    } catch (err) {
      setErrorMessage(mapFriendlyError(err));
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setErrorMessage(null);
    setLoading(true);
    try {
      await signInWithGoogle();
      onClose();
    } catch (err) {
      setErrorMessage(mapFriendlyError(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#382b22]/45 backdrop-blur-2xs flex items-center justify-center p-4 animate-in fade-in duration-200">
      {/* Cozy Auth Dialog Container */}
      <div className="relative w-full max-w-md bg-[#fffefb] rounded-3xl border-2 border-[#ede2d2] shadow-2xl p-6 sm:p-8 flex flex-col overflow-hidden animate-in zoom-in-95">
        {/* Close Button */}
        <button
          onClick={onClose}
          id="auth-modal-close-btn"
          className="absolute top-5 right-5 p-1.5 rounded-full text-[#9d8a7c] hover:text-[#43342a] hover:bg-[#f6eee3] transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Top Fox Mascot Area */}
        <div className="flex flex-col items-center text-center mt-2 mb-4">
          <div className="w-20 h-20 rounded-full bg-[#fbf5eb] border border-[#ede2d2] flex items-center justify-center shadow-2xs mb-3 overflow-hidden">
            <img src="/assets/branding/motion-emblem.png" alt="Motion" className="w-full h-full object-contain" />
          </div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-[#43342a] tracking-tight">
            {mode === 'signin' ? 'Welcome back to Motion' : 'Join Motion'}
          </h2>
          <p className="text-xs sm:text-sm text-[#8c7a6e] mt-1">
            {mode === 'signin'
              ? 'Your cozy personal productivity sanctuary'
              : 'Create a quiet space for your studies and work'}
          </p>
        </div>

        {/* Friendly Error Banner */}
        {errorMessage && (
          <div className="mb-4 p-3 rounded-xl bg-[#faeaec] border border-[#f5d7db] text-xs font-medium text-[#8a4b53] leading-relaxed">
            {errorMessage}
          </div>
        )}

        {/* Google Sign In Button */}
        <button
          onClick={handleGoogleSignIn}
          disabled={loading}
          className="w-full py-2.5 px-4 rounded-2xl bg-[#fbf7f1] hover:bg-[#f6eee3] border border-[#ede2d2] text-xs sm:text-sm font-semibold text-[#43342a] flex items-center justify-center gap-3 transition-colors cursor-pointer shadow-2xs mb-4"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
            />
          </svg>
          <span>Continue with Google</span>
        </button>

        {/* Divider */}
        <div className="relative flex items-center justify-center my-2 mb-4">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-[#ede2d2]" />
          </div>
          <span className="relative px-3 bg-[#fffefb] text-[11px] font-semibold text-[#a9998d] uppercase tracking-wider">
            or with email
          </span>
        </div>

        {/* Auth Form */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          {mode === 'signup' && (
            <div>
              <label className="block text-[11px] font-bold text-[#786659] uppercase tracking-wider mb-1">
                Display Name
              </label>
              <div className="relative">
                <User className="absolute left-3.5 top-2.5 w-4 h-4 text-[#b09e91]" />
                <input
                  type="text"
                  placeholder="e.g. Pico"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  required
                  className="w-full pl-10 pr-3.5 py-2 rounded-xl bg-[#fbf7f1] border border-[#ded2c0] text-sm text-[#43342a] focus:outline-none focus:border-[#966746]"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-[11px] font-bold text-[#786659] uppercase tracking-wider mb-1">
              Email Address
            </label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-2.5 w-4 h-4 text-[#b09e91]" />
              <input
                type="email"
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full pl-10 pr-3.5 py-2 rounded-xl bg-[#fbf7f1] border border-[#ded2c0] text-sm text-[#43342a] focus:outline-none focus:border-[#966746]"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-[#786659] uppercase tracking-wider mb-1">
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-2.5 w-4 h-4 text-[#b09e91]" />
              <input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full pl-10 pr-3.5 py-2 rounded-xl bg-[#fbf7f1] border border-[#ded2c0] text-sm text-[#43342a] focus:outline-none focus:border-[#966746]"
              />
            </div>
          </div>

          {mode === 'signup' && (
            <div>
              <label className="block text-[11px] font-bold text-[#786659] uppercase tracking-wider mb-1">
                Confirm Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-2.5 w-4 h-4 text-[#b09e91]" />
                <input
                  type="password"
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  className="w-full pl-10 pr-3.5 py-2 rounded-xl bg-[#fbf7f1] border border-[#ded2c0] text-sm text-[#43342a] focus:outline-none focus:border-[#966746]"
                />
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 py-2.5 rounded-xl bg-[#966746] hover:bg-[#7e5335] text-white text-sm font-bold shadow-xs transition-colors cursor-pointer flex items-center justify-center gap-2"
          >
            <span>{loading ? 'Please wait...' : mode === 'signin' ? 'Sign In' : 'Create Account'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        {/* Toggle Mode Switcher */}
        <div className="mt-5 text-center text-xs text-[#8c7a6e]">
          {mode === 'signin' ? (
            <>
              Don’t have an account?{' '}
              <button
                onClick={() => {
                  setMode('signup');
                  setErrorMessage(null);
                }}
                className="font-bold text-[#966746] hover:underline cursor-pointer"
              >
                Sign up
              </button>
            </>
          ) : (
            <>
              Already have an account?{' '}
              <button
                onClick={() => {
                  setMode('signin');
                  setErrorMessage(null);
                }}
                className="font-bold text-[#966746] hover:underline cursor-pointer"
              >
                Sign in
              </button>
            </>
          )}
        </div>

      </div>
    </div>
  );
};
