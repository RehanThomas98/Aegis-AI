import React, { useState } from 'react';
import { X, Mail, Lock, User, Eye, EyeOff, Loader2, CheckCircle2 } from 'lucide-react';
import {
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
} from 'firebase/auth';
import { auth, googleProvider } from './firebase';

export default function AuthModal({ onClose }) {
  const [mode, setMode] = useState('signin'); // 'signin' | 'signup'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const clearError = () => setError('');

  const showSuccess = () => {
    setSuccess(true);
    setTimeout(onClose, 1500);
  };

  const handleGoogle = async () => {
    setLoading(true); clearError();
    try {
      await signInWithPopup(auth, googleProvider);
      showSuccess();
    } catch (e) {
      setError(friendlyError(e.code));
      setLoading(false);
    }
  };

  const handleEmail = async e => {
    e.preventDefault();
    if (!email || !password) return setError('Please fill in all fields.');
    setLoading(true); clearError();
    try {
      if (mode === 'signup') {
        if (!name.trim()) return setError('Please enter your name.');
        const cred = await createUserWithEmailAndPassword(auth, email, password);
        await updateProfile(cred.user, { displayName: name.trim() });
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }
      showSuccess();
    } catch (e) {
      setError(friendlyError(e.code));
      setLoading(false);
    }
  };

  const switchMode = () => { setMode(m => m === 'signin' ? 'signup' : 'signin'); clearError(); };

  if (success) {
    return (
      <div className="auth-overlay">
        <div className="auth-modal auth-success-modal">
          <CheckCircle2 size={56} className="auth-success-icon" />
          <h2 className="auth-success-title">Welcome to AEGIS</h2>
          <p className="auth-success-sub">You're signed in and ready.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="auth-modal">

        <button className="auth-close" onClick={onClose}><X size={16} /></button>

        <div className="auth-brand">
          <img src="/aegis_logo.svg" className="auth-logo-img" alt="AEGIS" />
          <h2>AEGIS</h2>
          <p>{mode === 'signin' ? 'Sign in to save your sessions' : 'Create your account'}</p>
        </div>

        {/* Google */}
        <button className="google-btn" onClick={handleGoogle} disabled={loading}>
          <svg width="18" height="18" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          Continue with Google
        </button>

        <div className="auth-divider"><span>or</span></div>

        <form onSubmit={handleEmail} className="auth-form">
          {mode === 'signup' && (
            <div className="auth-field">
              <User size={15} className="field-icon" />
              <input
                type="text"
                placeholder="Full name"
                value={name}
                onChange={e => { setName(e.target.value); clearError(); }}
                disabled={loading}
                autoComplete="name"
              />
            </div>
          )}

          <div className="auth-field">
            <Mail size={15} className="field-icon" />
            <input
              type="email"
              placeholder="Email address"
              value={email}
              onChange={e => { setEmail(e.target.value); clearError(); }}
              disabled={loading}
              autoComplete="email"
            />
          </div>

          <div className="auth-field">
            <Lock size={15} className="field-icon" />
            <input
              type={showPw ? 'text' : 'password'}
              placeholder={mode === 'signup' ? 'Create password (6+ chars)' : 'Password'}
              value={password}
              onChange={e => { setPassword(e.target.value); clearError(); }}
              disabled={loading}
              autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
            />
            <button type="button" className="pw-toggle" onClick={() => setShowPw(v => !v)}>
              {showPw ? <EyeOff size={14} /> : <Eye size={14} />}
            </button>
          </div>

          {error && <p className="auth-error">{error}</p>}

          <button type="submit" className="auth-submit" disabled={loading}>
            {loading
              ? <><Loader2 size={15} className="spin" /> {mode === 'signin' ? 'Signing in…' : 'Creating account…'}</>
              : (mode === 'signin' ? 'Sign In' : 'Create Account')
            }
          </button>
        </form>

        <p className="auth-switch">
          {mode === 'signin' ? "Don't have an account?" : 'Already have an account?'}
          {' '}
          <button onClick={switchMode}>{mode === 'signin' ? 'Sign up' : 'Sign in'}</button>
        </p>

      </div>
    </div>
  );
}

function friendlyError(code) {
  const map = {
    'auth/user-not-found':        'No account found with that email.',
    'auth/wrong-password':        'Incorrect password. Try again.',
    'auth/email-already-in-use':  'An account with that email already exists.',
    'auth/weak-password':         'Password must be at least 6 characters.',
    'auth/invalid-email':         'Please enter a valid email address.',
    'auth/too-many-requests':     'Too many attempts. Please wait and try again.',
    'auth/popup-closed-by-user':  'Sign-in popup was closed. Please try again.',
    'auth/network-request-failed':'Network error. Check your connection.',
    'auth/invalid-credential':    'Incorrect email or password.',
  };
  return map[code] || 'Something went wrong. Please try again.';
}
