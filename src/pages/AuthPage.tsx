import { useState, useEffect } from 'react';
import {
  Sparkles,
  Lock,
  Mail,
  User,
  GraduationCap,
  Building2,
  ArrowRight,
  Loader2,
  CheckCircle2,
  Shield,
  Github,
  X,
  Check,
} from 'lucide-react';
import { useAuth } from '@/lib/authContext';
import { useRouter } from '@/lib/router';
import { LogoMark } from '@/components/Logo';
import type { UserRole } from '@/types';

export function AuthPage({ initialMode = 'signin' }: { initialMode?: 'signin' | 'signup' }) {
  const { profile, signInWithEmail, signUpWithEmail, signInWithGitHubUsername, signInWithGoogleCredentials } = useAuth();
  const { navigate } = useRouter();

  const [mode, setMode] = useState<'signin' | 'signup'>(initialMode);
  const [role, setRole] = useState<UserRole>('student');

  // Form fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [university, setUniversity] = useState('');
  const [program, setProgram] = useState('');
  const [organization, setOrganization] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // GitHub Connect Modal State
  const [showGithubModal, setShowGithubModal] = useState(false);
  const [githubUsername, setGithubUsername] = useState('');
  const [isVerifyingGithub, setIsVerifyingGithub] = useState(false);

  // Google Connect Modal State
  const [showGoogleModal, setShowGoogleModal] = useState(false);
  const [googleName, setGoogleName] = useState('');
  const [googleEmail, setGoogleEmail] = useState('');
  const [isVerifyingGoogle, setIsVerifyingGoogle] = useState(false);

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
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
      setSuccessMessage('GitHub identity verified & connected! Redirecting...');
    }
  };

  const handleConnectGoogle = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!googleEmail.trim()) return;
    setIsVerifyingGoogle(true);
    setError(null);

    const res = await signInWithGoogleCredentials(googleName.trim(), googleEmail.trim());
    setIsVerifyingGoogle(false);
    if (res.error) {
      setError(res.error);
    } else {
      setShowGoogleModal(false);
      setSuccessMessage('Google account authenticated! Redirecting...');
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
        <div className="bg-white py-8 px-6 sm:px-10 shadow-2xl rounded-3xl border border-ink-100">
          {/* Tab Selector */}
          <div className="grid grid-cols-2 p-1 bg-ink-100/70 rounded-2xl mb-6">
            <button
              type="button"
              onClick={() => {
                setMode('signin');
                setError(null);
              }}
              className={`py-2 text-xs font-bold rounded-xl transition ${
                mode === 'signin'
                  ? 'bg-white text-ink-900 shadow-sm'
                  : 'text-ink-500 hover:text-ink-900'
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => {
                setMode('signup');
                setError(null);
              }}
              className={`py-2 text-xs font-bold rounded-xl transition ${
                mode === 'signup'
                  ? 'bg-white text-ink-900 shadow-sm'
                  : 'text-ink-500 hover:text-ink-900'
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

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Role Selection (Available for both Sign In & Sign Up) */}
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-ink-500 block mb-1.5">
                {mode === 'signin' ? 'Signing in as' : 'Select Role'}
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setRole('student')}
                  className={`flex items-center justify-center gap-2 rounded-xl border p-2.5 text-xs font-bold transition ${
                    role === 'student'
                      ? 'border-brand-500 bg-brand-50 text-brand-700 ring-2 ring-brand-200 shadow-2xs'
                      : 'border-ink-200 text-ink-600 hover:bg-ink-50'
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
                      ? 'border-accent-500 bg-accent-50 text-accent-700 ring-2 ring-accent-200 shadow-2xs'
                      : 'border-ink-200 text-ink-600 hover:bg-ink-50'
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
                  <label className="text-xs font-semibold text-ink-700 block mb-1">Full Name</label>
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
                      <label className="text-xs font-semibold text-ink-700 block mb-1">University</label>
                      <input
                        type="text"
                        value={university}
                        onChange={(e) => setUniversity(e.target.value)}
                        placeholder="e.g. ITER SOA"
                        className="input text-xs"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-ink-700 block mb-1">Program</label>
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
                    <label className="text-xs font-semibold text-ink-700 block mb-1">Organization Name</label>
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
              <label className="text-xs font-semibold text-ink-700 block mb-1">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => handleEmailChange(e.target.value)}
                  placeholder={role === 'organization' ? 'recruiter@company.com' : 'name@university.edu'}
                  className="input pl-9 text-xs"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-ink-700 block mb-1">Password</label>
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

            <button
              type="submit"
              disabled={loading}
              className="w-full btn-primary py-3 text-xs font-bold justify-center"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : mode === 'signin' ? (
                'Sign In to Dashboard'
              ) : (
                'Create EvidentX Account'
              )}
            </button>
          </form>

          {/* Social Authentication */}
          <div className="mt-6">
            <div className="relative flex items-center justify-center mb-4">
              <div className="border-t border-ink-200 w-full" />
              <span className="bg-white px-2 text-[10px] uppercase font-bold text-ink-400">
                Or continue with
              </span>
              <div className="border-t border-ink-200 w-full" />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setShowGithubModal(true)}
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-ink-200 bg-white py-2.5 text-xs font-semibold text-ink-700 hover:bg-ink-50 transition shadow-2xs"
              >
                <Github className="h-4 w-4 text-ink-900" />
                <span>GitHub</span>
              </button>

              <button
                type="button"
                onClick={() => setShowGoogleModal(true)}
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-ink-200 bg-white py-2.5 text-xs font-semibold text-ink-700 hover:bg-ink-50 transition shadow-2xs"
              >
                <svg className="h-4 w-4" viewBox="0 0 24 24">
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
                <span>Google</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* GITHUB CONNECT MODAL */}
      {showGithubModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
          <div className="w-full max-w-sm rounded-3xl bg-white p-6 shadow-2xl border border-ink-100 space-y-4">
            <div className="flex items-center justify-between border-b border-ink-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-xl bg-ink-900 text-white flex items-center justify-center">
                  <Github className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="font-bold text-ink-900 text-sm">Sign in with GitHub</h3>
                  <p className="text-[11px] text-ink-500">Connect your public developer profile</p>
                </div>
              </div>
              <button onClick={() => setShowGithubModal(false)} className="text-ink-400 hover:text-ink-700">
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleConnectGithub} className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-ink-700 block mb-1">
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
                <p className="text-[11px] text-ink-400 mt-1">
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

      {/* GOOGLE CONNECT MODAL */}
      {showGoogleModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
          <div className="w-full max-w-sm rounded-3xl bg-white p-6 shadow-2xl border border-ink-100 space-y-4">
            <div className="flex items-center justify-between border-b border-ink-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-xl bg-amber-50 flex items-center justify-center border border-amber-200">
                  <svg className="h-4 w-4" viewBox="0 0 24 24">
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
                </div>
                <div>
                  <h3 className="font-bold text-ink-900 text-sm">Sign in with Google</h3>
                  <p className="text-[11px] text-ink-500">Google Workspace SSO</p>
                </div>
              </div>
              <button onClick={() => setShowGoogleModal(false)} className="text-ink-400 hover:text-ink-700">
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleConnectGoogle} className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-ink-700 block mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={googleName}
                  onChange={(e) => setGoogleName(e.target.value)}
                  placeholder="e.g. Alex Rivera"
                  className="input text-xs"
                  autoFocus
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-ink-700 block mb-1">Google Email Address</label>
                <input
                  type="email"
                  required
                  value={googleEmail}
                  onChange={(e) => setGoogleEmail(e.target.value)}
                  placeholder="alex.rivera@gmail.com"
                  className="input text-xs"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowGoogleModal(false)}
                  className="btn-secondary text-xs py-2 px-3"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isVerifyingGoogle || !googleEmail.trim()}
                  className="btn-primary text-xs py-2 px-3 inline-flex items-center gap-1.5"
                >
                  {isVerifyingGoogle ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin" /> Signing In...
                    </>
                  ) : (
                    <>
                      <Check className="h-3.5 w-3.5" /> Continue with Google
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
