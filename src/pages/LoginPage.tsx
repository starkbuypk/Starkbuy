import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { BRAND } from '../config';

/* ── small helpers ────────────────────────────────────────────── */
function Input({
  icon, type = 'text', placeholder, value, onChange, right,
}: {
  icon: React.ReactNode;
  type?: string;
  placeholder: string;
  value: string;
  onChange: (v: string) => void;
  right?: React.ReactNode;
}) {
  return (
    <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
      <span style={{ position: 'absolute', left: '1rem', color: 'var(--luna-muted)', display: 'flex', pointerEvents: 'none' }}>{icon}</span>
      <input
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={e => onChange(e.target.value)}
        style={{
          width: '100%',
          background: 'rgba(0,0,0,0.05)',
          border: '1px solid rgba(26,22,20,0.12)',
          borderRadius: '0.75rem',
          padding: '0.875rem 1rem 0.875rem 2.75rem',
          color: 'var(--luna-fg)',
          fontFamily: 'DM Sans, sans-serif',
          fontSize: '0.9375rem',
          outline: 'none',
          boxSizing: 'border-box',
          transition: 'border-color 150ms',
        }}
        onFocus={e => { e.currentTarget.style.borderColor = 'rgba(201,168,76,0.5)'; }}
        onBlur={e => { e.currentTarget.style.borderColor = 'rgba(26,22,20,0.12)'; }}
      />
      {right && <span style={{ position: 'absolute', right: '1rem', color: 'var(--luna-muted)', display: 'flex', cursor: 'pointer' }}>{right}</span>}
    </div>
  );
}

function IconLogin() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/>
      <polyline points="10 17 15 12 10 7"/>
      <line x1="15" y1="12" x2="3" y2="12"/>
    </svg>
  );
}
function IconMail() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect width="20" height="16" x="2" y="4" rx="2"/>
      <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>
    </svg>
  );
}
function IconLock() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect width="18" height="11" x="3" y="11" rx="2" ry="2"/>
      <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
    </svg>
  );
}
function IconEye({ off }: { off: boolean }) {
  return off ? (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24"/>
      <path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68"/>
      <path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61"/>
      <line x1="2" y1="2" x2="22" y2="22"/>
    </svg>
  ) : (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7z"/>
      <circle cx="12" cy="12" r="3"/>
    </svg>
  );
}

function GoogleIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
    </svg>
  );
}

/* ── Main page ────────────────────────────────────────────────── */
export default function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [remember, setRemember] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState('');

  const LOGIN_ATTEMPTS_KEY = 'sb_login_attempts';
  const LOGIN_LOCKED_KEY = 'sb_login_locked_until';

  function getLoginAttempts(): number {
    try { return parseInt(sessionStorage.getItem(LOGIN_ATTEMPTS_KEY) ?? '0', 10); } catch { return 0; }
  }
  function getLoginLocked(): number {
    try { return parseInt(sessionStorage.getItem(LOGIN_LOCKED_KEY) ?? '0', 10); } catch { return 0; }
  }

  async function handleEmail(e: React.FormEvent) {
    e.preventDefault();
    if (!email || !password) { setError('Please fill in all fields.'); return; }

    const lockedUntil = getLoginLocked();
    if (lockedUntil > Date.now()) {
      const s = Math.ceil((lockedUntil - Date.now()) / 1000);
      setError(`Too many failed attempts. Try again in ${s}s.`); return;
    }

    setError('');
    setLoading(true);
    const { error: err } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (err) {
      const attempts = getLoginAttempts() + 1;
      sessionStorage.setItem(LOGIN_ATTEMPTS_KEY, String(attempts));
      if (attempts >= 5) {
        const lockMs = attempts >= 10 ? 15 * 60 * 1000 : 5 * 60 * 1000;
        sessionStorage.setItem(LOGIN_LOCKED_KEY, String(Date.now() + lockMs));
        sessionStorage.setItem(LOGIN_ATTEMPTS_KEY, '0');
        setError(`Too many failed attempts. Locked for ${lockMs / 60000} minutes.`);
      } else {
        setError(err.message);
      }
    } else {
      sessionStorage.removeItem(LOGIN_ATTEMPTS_KEY);
      sessionStorage.removeItem(LOGIN_LOCKED_KEY);
      navigate('/account');
    }
  }

  async function handleGoogle() {
    setGoogleLoading(true);
    const { error: err } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/account` },
    });
    if (err) { setError(err.message); setGoogleLoading(false); }
  }

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '2rem 1rem',
      background: 'var(--luna-bg)',
    }}>
      <div style={{ width: '100%', maxWidth: 420, opacity: 0.8 }}>

        {/* Icon */}
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1.5rem' }}>
          <div style={{ width: 52, height: 52, borderRadius: '50%', background: 'rgba(26,22,20,0.08)', border: '1.5px solid rgba(0,0,0,0.09)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--luna-fg)' }}>
            <IconLogin />
          </div>
        </div>

        {/* Heading */}
        <h1 className="font-display" style={{ textAlign: 'center', fontSize: 'clamp(1.75rem, 5vw, 2.25rem)', fontWeight: 700, letterSpacing: '-0.02em', margin: '0 0 0.5rem' }}>
          Welcome back
        </h1>
        <p style={{ textAlign: 'center', color: 'var(--luna-muted)', margin: '0 0 2rem', fontSize: '0.9375rem' }}>
          Log in to your {BRAND.name} account
        </p>

        {/* Card */}
        <div style={{ background: 'rgba(0,0,0,0.04)', border: '1px solid rgba(26,22,20,0.09)', borderRadius: '1.25rem', padding: '2rem 1.75rem', backdropFilter: 'blur(12px)' }}>

          {/* Google button */}
          <button
            onClick={handleGoogle}
            disabled={googleLoading}
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.75rem',
              padding: '0.875rem 1rem',
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(0,0,0,0.09)',
              borderRadius: '0.75rem',
              color: 'var(--luna-fg)',
              fontFamily: 'DM Sans, sans-serif',
              fontWeight: 600,
              fontSize: '0.9375rem',
              cursor: googleLoading ? 'wait' : 'pointer',
              transition: 'background 150ms',
              marginBottom: '1.5rem',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.09)'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; }}
          >
            <GoogleIcon />
            {googleLoading ? 'Redirecting…' : 'Continue with Google'}
          </button>

          {/* OR divider */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.875rem', marginBottom: '1.5rem' }}>
            <div style={{ flex: 1, height: 1, background: 'rgba(26,22,20,0.09)' }} />
            <span style={{ fontSize: '0.75rem', color: 'var(--luna-muted)', letterSpacing: '0.08em', fontWeight: 500 }}>OR</span>
            <div style={{ flex: 1, height: 1, background: 'rgba(26,22,20,0.09)' }} />
          </div>

          {/* Email / password form */}
          <form onSubmit={handleEmail} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.5rem' }}>Email</label>
              <Input icon={<IconMail />} type="email" placeholder="you@example.com" value={email} onChange={setEmail} />
            </div>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '0.5rem' }}>
                <label style={{ fontSize: '0.875rem', fontWeight: 600 }}>Password</label>
                <Link to="/forgot-password" style={{ fontSize: '0.8125rem', color: 'var(--luna-muted)', textDecoration: 'none', transition: 'color 150ms' }}
                  onMouseEnter={e => { e.currentTarget.style.color = 'var(--luna-1)'; }}
                  onMouseLeave={e => { e.currentTarget.style.color = 'var(--luna-muted)'; }}
                >
                  Forgot password?
                </Link>
              </div>
              <Input
                icon={<IconLock />}
                type={showPw ? 'text' : 'password'}
                placeholder="••••••••"
                value={password}
                onChange={setPassword}
                right={<span onClick={() => setShowPw(v => !v)}><IconEye off={showPw} /></span>}
              />
            </div>

            {/* Remember me */}
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', cursor: 'pointer', fontSize: '0.9rem', color: 'var(--luna-muted)' }}>
              <input
                type="checkbox"
                checked={remember}
                onChange={e => setRemember(e.target.checked)}
                style={{ width: 16, height: 16, accentColor: 'var(--luna-1)', cursor: 'pointer' }}
              />
              Remember me
            </label>

            {/* Error */}
            {error && (
              <p style={{ margin: 0, fontSize: '0.875rem', color: '#f87171', background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.2)', borderRadius: '0.5rem', padding: '0.625rem 0.875rem' }}>
                {error}
              </p>
            )}

            {/* Login button */}
            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary"
              style={{ width: '100%', justifyContent: 'center', opacity: loading ? 0.7 : 1 }}
            >
              {loading ? 'Logging in…' : 'Log in'}
            </button>

            {/* Guest */}
            <button
              type="button"
              onClick={() => navigate('/')}
              style={{ background: 'none', border: 'none', color: 'var(--luna-muted)', fontSize: '0.9rem', cursor: 'pointer', fontFamily: 'DM Sans, sans-serif', padding: '0.25rem', textAlign: 'center' }}
            >
              Just browsing?{' '}
              <span style={{ color: 'var(--luna-fg)', fontWeight: 600 }}>Continue as Guest</span>
            </button>
          </form>
        </div>

        {/* Register link */}
        <p style={{ textAlign: 'center', marginTop: '1.5rem', fontSize: '0.9375rem', color: 'var(--luna-muted)' }}>
          Don't have an account?{' '}
          <Link to="/register" style={{ color: 'var(--luna-1)', fontWeight: 700, textDecoration: 'none' }}>
            Create one
          </Link>
        </p>
      </div>
    </div>
  );
}
