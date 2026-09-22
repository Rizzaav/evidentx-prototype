import { useState, useEffect } from 'react';
import {
  Sparkles,
  Lock,
  Mail,
  User,
  GraduationCap,
  Building2,
  ArrowRight,
  ArrowLeft,
  Loader2,
  CheckCircle2,
  Shield,
  ShieldCheck,
  KeyRound,
  RefreshCw,
  Github,
  X,
  Check,
} from 'lucide-react';
import { useAuth } from '@/lib/authContext';
import { useRouter } from '@/lib/router';
import { LogoMark } from '@/components/Logo';
import type { UserRole } from '@/types';

export function AuthPage({ initialMode = 'signin' }: { initialMode?: 'signin' | 'signup' }) {
  const {
    profile,
    signInWithEmail,
    signUpWithEmail,
    sendEmailOtp,
    verifyEmailOtp,
    signInWithOAuth,
    signInWithGitHubUsername,
  } = useAuth();
  const { navigate } = useRouter();

  const [mode, setMode] = useState<'signin' | 'signup'>(initialMode);
  const [role, setRole] = useState<UserRole>('student');
  const [authMethod, setAuthMethod] = useState<'password' | 'otp'>('password');

  // OTP Verification state
  const [isOtpStep, setIsOtpStep] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [countdown, setCountdown] = useState(0);

  // Form fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [university, setUniversity] = useState('');
  const [program, setProgram] = useState('');
  const [organization, setOrganization] = useState('');

  const [loading, setLoading] = useState(false);
  const [oauthLoading, setOauthLoading] = useState<'github' | 'google' | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // GitHub Connect Modal State
  const [showGithubModal, setShowGithubModal] = useState(false);
  const [githubUsername, setGithubUsername] = useState('');
  const [isVerifyingGithub, setIsVerifyingGithub] = useState(false);

  // Countdown timer for OTP resend
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown((c) => c - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  // If already logged in, redirect to respective dashboard
  useEffect(() => {
    if (profile) {
      if (profile.role === 'organization') {
        navigate('/org/dashboard');
      } else if (profile.role === 'team-creator') {
        navigate('/team/matching');
      } else {
        navigate('/student/dashboard');
      }
    }
  }, [profile, navigate]);

  const handleEmailChange = (val: string) => {
    setEmail(val);
    const clean = val.trim().toLowerCase();
    try {
      const savedProfiles = JSON.parse(localStorage.getItem('evx_user_profiles_v1') || '{}');
      if (savedProfiles[clean]?.role) {
        setRole(savedProfiles[clean].role);
        return;
      }
      const savedRoles = JSON.parse(localStorage.getItem('evx_user_roles_v1') || '{}');
      if (savedRoles[clean]) {
        setRole(savedRoles[clean]);
      } else if (clean.includes('org') || clean.includes('recruiter')) {
        setRole('organization');
      }
    } catch {}
  };

  const handleSendOtp = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const cleanEmail = email.trim();
    if (!cleanEmail || !cleanEmail.includes('@')) {
      setError('Please enter a valid email address');
      return;
    }
    if (mode === 'signup' && !name.trim()) {
      setError('Please enter your full name');
      return;
    }

    setError(null);
    setSuccessMessage(null);
    setLoading(true);

    const res = await sendEmailOtp(cleanEmail, role, name, {
      university: role === 'student' ? university : undefined,
      program: role === 'student' ? program : undefined,
      organization: role === 'organization' ? organization : undefined,
    });

    setLoading(false);
    if (res.error) {
      setError(res.error);
    } else {
      setIsOtpStep(true);
      setCountdown(60);
      setSuccessMessage(`A 6-digit verification code was sent to ${cleanEmail}. Check your Gmail inbox!`);
    }
  };

  const handleVerifyOtp = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const cleanOtp = otpCode.trim();
    if (!cleanOtp || cleanOtp.length < 6) {
      setError('Please enter the complete 6-digit verification code');
      return;
    }

    setError(null);
    setSuccessMessage(null);
    setLoading(true);

    const res = await verifyEmailOtp(email, cleanOtp, role, name, {
      university: role === 'student' ? university : undefined,
      program: role === 'student' ? program : undefined,
      organization: role === 'organization' ? organization : undefined,
    });

    setLoading(false);
    if (res.error) {
      setError(res.error);
    } else {
      setSuccessMessage('Gmail verified successfully! Redirecting...');
      setTimeout(() => {
        navigate(role === 'organization' ? '/org/dashboard' : '/student/dashboard');
      }, 400);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (authMethod === 'otp') {
      if (isOtpStep) {
        await handleVerifyOtp(e);
      } else {
        await handleSendOtp(e);
      }
      return;
    }

    setError(null);
    setSuccessMessage(null);
    setLoading(true);

    if (mode === 'signin') {
      const res = await signInWithEmail(email, password, role);
      setLoading(false);
      if (res.error) {
        setError(res.error);
      } else {
        setSuccessMessage('Signed in successfully! Redirecting...');
        const cleanEmail = email.trim().toLowerCase();
        let targetRole: UserRole = role;
        try {
          const savedProfiles = JSON.parse(localStorage.getItem('evx_user_profiles_v1') || '{}');
          if (savedProfiles[cleanEmail]?.role) {
            targetRole = savedProfiles[cleanEmail].role;
          } else {
            const savedRoles = JSON.parse(localStorage.getItem('evx_user_roles_v1') || '{}');
            targetRole = savedRoles[cleanEmail] || role;
          }
        } catch {}
        setTimeout(() => {
          navigate(targetRole === 'organization' ? '/org/dashboard' : '/student/dashboard');
        }, 400);
      }
    } else {
      if (!name.trim()) {
        setError('Please enter your full name');
        setLoading(false);
        return;
      }
      const res = await signUpWithEmail(email, password, role, name, {
        university: role === 'student' ? university : undefined,
        program: role === 'student' ? program : undefined,
        organization: role === 'organization' ? organization : undefined,
      });
      setLoading(false);
      if (res.error) {
        setError(res.error);
      } else {
        setSuccessMessage('Account created successfully! Redirecting...');
        setTimeout(() => {
          navigate(role === 'organization' ? '/org/dashboard' : '/student/dashboard');
        }, 400);
      }
    }
  };

  const handleOAuth = async (provider: 'github' | 'google') => {
    setError(null);
    setSuccessMessage(null);
    setOauthLoading(provider);
    const res = await signInWithOAuth(provider);
    if (res.error) {
      setError(res.error);
      setOauthLoading(null);
    }
  };

  const handleConnectGithub = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!githubUsername.trim()) return;
    setIsVerifyingGithub(true);
    setError(null);

    const res = await signInWithGitHubUsername(githubUsername.trim());
    setIsVerifyingGithub(false);
    if (res.error) {
      setError(res.error);
    } else {
      setShowGithubModal(false);
      setSuccessMessage('GitHub identity verified & authenticated! Redirecting...');
      setTimeout(() => {
        navigate('/student/dashboard');
      }, 400);
    }
  };

  return (
    <div className="min-h-screen bg-ink-950 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Background ambient lighting */}
      <div className="absolute -top-40 -left-40 h-96 w-96 rounded-full bg-brand-600/20 blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -right-40 h-96 w-96 rounded-full bg-accent-600/20 blur-3xl pointer-events-none" />

      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10 text-center">
        <div className="inline-flex items-center justify-center gap-2 mb-3">
          <LogoMark size={40} />
          <span className="font-display text-2xl font-extrabold text-white tracking-tight">
            EvidentX
          </span>
        </div>
        <h1 className="font-display text-2xl font-bold text-white tracking-tight">
          {mode === 'signin' ? 'Welcome back to EvidentX' : 'Create your Skill Passport'}
        </h1>
        <p className="mt-2 text-xs text-ink-300">
          Deterministic, verified evidence-based technical talent matching
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        <div className="bg-white dark:bg-[#161b22] py-8 px-6 sm:px-10 shadow-2xl rounded-3xl border border-ink-100 dark:border-[#30363d]">
          {/* Tab Selector */}
          <div className="grid grid-cols-2 p-1 bg-ink-100/70 dark:bg-[#0d1117] rounded-2xl mb-6 border border-transparent dark:border-[#30363d]">
            <button
              type="button"
              onClick={() => {
                setMode('signin');
                setIsOtpStep(false);
                setOtpCode('');
                setError(null);
              }}
              className={`py-2 text-xs font-bold rounded-xl transition ${
                mode === 'signin'
                  ? 'bg-white dark:bg-[#21262d] text-ink-900 dark:text-white shadow-sm'
                  : 'text-ink-500 dark:text-[#8b949e] hover:text-ink-900 dark:hover:text-white'
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => {
                setMode('signup');
                setIsOtpStep(false);
                setOtpCode('');
                setError(null);
              }}
              className={`py-2 text-xs font-bold rounded-xl transition ${
                mode === 'signup'
                  ? 'bg-white dark:bg-[#21262d] text-ink-900 dark:text-white shadow-sm'
                  : 'text-ink-500 dark:text-[#8b949e] hover:text-ink-900 dark:hover:text-white'
              }`}
            >
              Create Account
            </button>
          </div>

          {/* Feedback alerts */}
          {error && (
            <div className="mb-4 rounded-xl bg-rose-50 border border-rose-200 p-3 text-xs text-rose-700 font-medium">
              {error}
            </div>
          )}
          {successMessage && (
            <div className="mb-4 rounded-xl bg-emerald-50 border border-emerald-200 p-3 text-xs text-emerald-800 font-semibold flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-600 flex-shrink-0" />
              <span>{successMessage}</span>
            </div>
          )}

          {isOtpStep ? (
            <div className="space-y-4">
              <div className="text-center pb-1">
                <div className="inline-flex h-12 w-12 rounded-2xl bg-brand-50 dark:bg-brand-950/70 border border-brand-200 dark:border-brand-800 items-center justify-center text-brand-600 dark:text-brand-400 mb-2.5 shadow-2xs">
                  <ShieldCheck className="h-6 w-6" />
                </div>
                <h3 className="font-display text-base font-bold text-ink-900 dark:text-white">
                  Verify Your Gmail
                </h3>
                <p className="mt-1 text-xs text-ink-500 dark:text-[#8b949e]">
                  We sent a 6-digit code to <span className="font-semibold text-ink-900 dark:text-white">{email}</span>. Enter it below to prove email ownership.
                </p>
              </div>

              <div>
                <label className="text-xs font-semibold text-ink-700 dark:text-[#c9d1d9] block mb-1.5 text-center">
                  6-Digit Verification Code
                </label>
                <input
                  type="text"
                  maxLength={6}
                  autoFocus
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="••••••"
                  className="input text-center font-mono text-2xl tracking-[0.4em] py-3 text-ink-900 dark:text-white font-bold"
                />
              </div>

              <button
                type="button"
                onClick={handleVerifyOtp}
                disabled={loading || otpCode.length < 6}
                className="w-full btn-primary py-3 text-xs font-bold justify-center disabled:opacity-50"
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Confirm & Complete Verification'}
              </button>

              <div className="flex items-center justify-between text-xs pt-2 border-t border-ink-100 dark:border-[#30363d]">
                <button
                  type="button"
                  disabled={countdown > 0 || loading}
                  onClick={() => handleSendOtp()}
                  className="text-brand-600 dark:text-brand-400 hover:underline font-semibold disabled:opacity-50 disabled:no-underline"
                >
                  {countdown > 0 ? `Resend code in ${countdown}s` : 'Resend code'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsOtpStep(false);
                    setOtpCode('');
                    setError(null);
                  }}
                  className="text-ink-500 dark:text-[#8b949e] hover:text-ink-900 dark:hover:text-white transition"
                >
                  ← Edit email / Back
                </button>
              </div>
            </div>
          ) : (
            /* Form */
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Auth Method Selector: Password vs Gmail OTP */}
              <div className="grid grid-cols-2 p-1 bg-ink-100/70 dark:bg-[#0d1117] rounded-xl border border-transparent dark:border-[#30363d]">
                <button
                  type="button"
                  onClick={() => {
                    setAuthMethod('password');
                    setError(null);
                  }}
                  className={`py-1.5 text-xs font-bold rounded-lg transition ${
                    authMethod === 'password'
                      ? 'bg-white dark:bg-[#21262d] text-ink-900 dark:text-white shadow-2xs'
                      : 'text-ink-500 dark:text-[#8b949e] hover:text-ink-900 dark:hover:text-white'
                  }`}
                >
                  Password
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setAuthMethod('otp');
                    setError(null);
                  }}
                  className={`py-1.5 text-xs font-bold rounded-lg transition flex items-center justify-center gap-1.5 ${
                    authMethod === 'otp'
                      ? 'bg-white dark:bg-[#21262d] text-ink-900 dark:text-white shadow-2xs'
                      : 'text-ink-500 dark:text-[#8b949e] hover:text-ink-900 dark:hover:text-white'
                  }`}
                >
                  <Mail className="h-3.5 w-3.5 text-brand-500" />
                  <span>Gmail OTP</span>
                </button>
              </div>

              {/* Role Selection (Available for both Sign In & Sign Up) */}
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-ink-500 dark:text-[#8b949e] block mb-1.5">
                  {mode === 'signin' ? 'Signing in as' : 'Select Role'}
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setRole('student')}
                    className={`flex items-center justify-center gap-2 rounded-xl border p-2.5 text-xs font-bold transition ${
                      role === 'student'
                        ? 'border-brand-500 bg-brand-50 dark:bg-brand-950/70 text-brand-700 dark:text-brand-300 ring-2 ring-brand-200 dark:ring-brand-800 shadow-2xs'
                        : 'border-ink-200 dark:border-[#30363d] text-ink-600 dark:text-[#c9d1d9] hover:bg-ink-50 dark:hover:bg-[#21262d]'
                    }`}
                  >
                    <GraduationCap className="h-4 w-4" />
                    <span>Candidate</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setRole('organization')}
                    className={`flex items-center justify-center gap-2 rounded-xl border p-2.5 text-xs font-bold transition ${
                      role === 'organization'
                        ? 'border-accent-500 bg-accent-50 dark:bg-accent-950/70 text-accent-700 dark:text-accent-300 ring-2 ring-accent-200 dark:ring-accent-800 shadow-2xs'
                        : 'border-ink-200 dark:border-[#30363d] text-ink-600 dark:text-[#c9d1d9] hover:bg-ink-50 dark:hover:bg-[#21262d]'
                    }`}
                  >
                    <Building2 className="h-4 w-4" />
                    <span>Organization</span>
                  </button>
                </div>
              </div>

              {mode === 'signup' && (
                <>
                  <div>
                    <label className="text-xs font-semibold text-ink-700 dark:text-[#c9d1d9] block mb-1">Full Name</label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" />
                      <input
                        type="text"
                        required
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder={role === 'organization' ? 'e.g. Acme Talent Team' : 'e.g. Rishav Singh'}
                        className="input pl-9 text-xs"
                      />
                    </div>
                  </div>

                  {role === 'student' ? (
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-xs font-semibold text-ink-700 dark:text-[#c9d1d9] block mb-1">University</label>
                        <input
                          type="text"
                          value={university}
                          onChange={(e) => setUniversity(e.target.value)}
                          placeholder="e.g. ITER SOA"
                          className="input text-xs"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-semibold text-ink-700 dark:text-[#c9d1d9] block mb-1">Program</label>
                        <input
                          type="text"
                          value={program}
                          onChange={(e) => setProgram(e.target.value)}
                          placeholder="e.g. B.Tech CSE"
                          className="input text-xs"
                        />
                      </div>
                    </div>
                  ) : (
                    <div>
                      <label className="text-xs font-semibold text-ink-700 dark:text-[#c9d1d9] block mb-1">Company / Organization</label>
                      <input
                        type="text"
                        value={organization}
                        onChange={(e) => setOrganization(e.target.value)}
                        placeholder="e.g. TechFlow Labs"
                        className="input text-xs"
                      />
                    </div>
                  )}
                </>
              )}

              <div>
                <label className="text-xs font-semibold text-ink-700 dark:text-[#c9d1d9] block mb-1">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => handleEmailChange(e.target.value)}
                    placeholder={role === 'organization' ? 'recruiter@company.com' : 'name@gmail.com'}
                    className="input pl-9 text-xs"
                  />
                </div>
              </div>

              {authMethod === 'password' ? (
                <div>
                  <label className="text-xs font-semibold text-ink-700 dark:text-[#c9d1d9] block mb-1">Password</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" />
                    <input
                      type="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="input pl-9 text-xs"
                    />
                  </div>
                </div>
              ) : (
                <div className="rounded-xl bg-brand-50/70 dark:bg-brand-950/40 border border-brand-200 dark:border-brand-800/60 p-3 text-xs text-brand-900 dark:text-brand-300 flex items-start gap-2.5">
                  <ShieldCheck className="h-4 w-4 text-brand-600 flex-shrink-0 mt-0.5" />
                  <div className="text-[11px] leading-relaxed">
                    <span className="font-bold block text-xs">Verify email authenticity</span>
                    A 6-digit OTP code will be sent to your Gmail to prove this email belongs to you.
                  </div>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full btn-primary py-3 text-xs font-bold justify-center"
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : authMethod === 'otp' ? (
                  'Send 6-Digit Code to Gmail'
                ) : mode === 'signin' ? (
                  'Sign In to Dashboard'
                ) : (
                  'Create EvidentX Account'
                )}
              </button>
            </form>
          )}

          {/* Proper Sequence Divider */}
          <div className="relative flex items-center justify-center my-5">
            <div className="border-t border-ink-200 dark:border-[#30363d] w-full" />
            <span className="bg-white dark:bg-[#161b22] px-3 text-[11px] font-medium text-ink-400 dark:text-[#8b949e] whitespace-nowrap">
              or continue with
            </span>
            <div className="border-t border-ink-200 dark:border-[#30363d] w-full" />
          </div>

          {/* Continue with Google & Continue with GitHub at Bottom */}
          <div className="space-y-2.5">
            <button
              type="button"
              disabled={oauthLoading !== null || loading}
              onClick={() => handleOAuth('google')}
              className="w-full inline-flex items-center justify-center gap-3 rounded-xl border border-ink-200 dark:border-[#30363d] bg-white dark:bg-[#21262d] py-2.5 px-4 text-xs font-semibold text-ink-700 dark:text-[#c9d1d9] hover:bg-ink-50 dark:hover:bg-[#30363d] hover:border-ink-300 dark:hover:border-[#484f58] transition shadow-2xs disabled:opacity-50"
            >
              {oauthLoading === 'google' ? (
                <Loader2 className="h-4 w-4 animate-spin text-ink-900 dark:text-white" />
              ) : (
                <svg className="h-4 w-4 flex-shrink-0" viewBox="0 0 24 24">
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
              )}
              <span>{oauthLoading === 'google' ? 'Redirecting to Google...' : 'Continue with Google'}</span>
            </button>

            <button
              type="button"
              disabled={oauthLoading !== null || loading}
              onClick={() => handleOAuth('github')}
              className="w-full inline-flex items-center justify-center gap-3 rounded-xl border border-ink-200 dark:border-[#30363d] bg-white dark:bg-[#21262d] py-2.5 px-4 text-xs font-semibold text-ink-700 dark:text-[#c9d1d9] hover:bg-ink-50 dark:hover:bg-[#30363d] hover:border-ink-300 dark:hover:border-[#484f58] transition shadow-2xs disabled:opacity-50"
            >
              {oauthLoading === 'github' ? (
                <Loader2 className="h-4 w-4 animate-spin text-ink-900 dark:text-white" />
              ) : (
                <Github className="h-4 w-4 flex-shrink-0 text-ink-900 dark:text-white" />
              )}
              <span>{oauthLoading === 'github' ? 'Redirecting to GitHub...' : 'Continue with GitHub'}</span>
            </button>
          </div>

          {/* Secondary helper option */}
          <div className="mt-4 pt-3 border-t border-ink-100 dark:border-[#30363d] text-center">
            <button
              type="button"
              onClick={() => {
                setError(null);
                setShowGithubModal(true);
              }}
              className="text-[11px] text-ink-500 dark:text-[#8b949e] hover:text-ink-800 dark:hover:text-white underline transition"
            >
              Or verify with public GitHub username
            </button>
          </div>
        </div>
      </div>

      {/* GITHUB CONNECT MODAL */}
      {showGithubModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-fade-in">
          <div className="w-full max-w-sm rounded-3xl bg-white dark:bg-[#161b22] p-6 shadow-2xl border border-ink-100 dark:border-[#30363d] space-y-4">
            <div className="flex items-center justify-between border-b border-ink-100 dark:border-[#30363d] pb-3">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-xl bg-ink-900 dark:bg-ink-800 text-white flex items-center justify-center">
                  <Github className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="font-bold text-ink-900 dark:text-white text-sm">Sign in with GitHub</h3>
                  <p className="text-[11px] text-ink-500 dark:text-[#8b949e]">Connect your public developer profile</p>
                </div>
              </div>
              <button onClick={() => setShowGithubModal(false)} className="text-ink-400 hover:text-ink-700 dark:hover:text-[#c9d1d9]">
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleConnectGithub} className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-ink-700 dark:text-[#c9d1d9] block mb-1">
                  GitHub Username or Profile URL
                </label>
                <input
                  type="text"
                  required
                  value={githubUsername}
                  onChange={(e) => setGithubUsername(e.target.value)}
                  placeholder="e.g. torvalds or octocat"
                  className="input text-xs"
                  autoFocus
                />
                <p className="text-[11px] text-ink-400 dark:text-[#8b949e] mt-1">
                  We'll verify your public avatar, repository stats, and create your skill passport.
                </p>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowGithubModal(false)}
                  className="btn-secondary text-xs py-2 px-3"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isVerifyingGithub || !githubUsername.trim()}
                  className="btn-primary text-xs py-2 px-3 inline-flex items-center gap-1.5"
                >
                  {isVerifyingGithub ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin" /> Verifying...
                    </>
                  ) : (
                    <>
                      <Check className="h-3.5 w-3.5" /> Authenticate
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
