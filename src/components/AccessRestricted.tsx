import { ShieldAlert, ArrowLeft, LogIn, Lock } from 'lucide-react';
import { useRouter } from '@/lib/router';
import { useAuth } from '@/lib/authContext';

export function AccessRestricted({
  requiredRole,
  currentRole,
}: {
  requiredRole: 'organization' | 'student';
  currentRole: string;
}) {
  const { navigate } = useRouter();
  const { profile, signOut } = useAuth();

  return (
    <div className="min-h-[70vh] flex items-center justify-center p-4">
      <div className="max-w-md w-full rounded-3xl border border-ink-200 bg-white p-6 sm:p-8 text-center shadow-lift animate-scale-in">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-rose-50 text-rose-600 border border-rose-200 shadow-2xs mb-4">
          <ShieldAlert className="h-8 w-8" />
        </div>

        <div className="inline-flex items-center gap-1.5 rounded-full bg-rose-50 border border-rose-200 px-3 py-1 text-xs font-bold text-rose-700 uppercase tracking-wider mb-2">
          <Lock className="h-3 w-3" /> Access Restricted (403)
        </div>

        <h2 className="font-display text-xl font-extrabold text-ink-900 tracking-tight">
          {requiredRole === 'organization'
            ? 'Organization Portal Only'
            : 'Student Portal Only'}
        </h2>

        <p className="text-xs sm:text-sm text-ink-600 mt-2 leading-relaxed">
          You are currently signed in as a{' '}
          <strong className="text-ink-900 capitalize font-bold">{currentRole}</strong> (
          <span className="font-mono text-ink-700 text-xs">{profile?.email}</span>). You do not have permission to access {requiredRole === 'organization' ? 'recruiter and candidate management tools' : 'student skill passports and evidence'}.
        </p>

        <div className="mt-6 flex flex-col gap-2.5">
          <button
            onClick={() =>
              navigate(currentRole === 'student' ? '/student/dashboard' : '/org/dashboard')
            }
            className="btn-primary w-full text-xs justify-center py-2.5 shadow-soft"
          >
            <ArrowLeft className="h-4 w-4" /> Return to Your {currentRole === 'student' ? 'Student' : 'Organization'} Dashboard
          </button>

          <button
            onClick={() => {
              signOut();
              navigate('/login');
            }}
            className="btn-secondary w-full text-xs justify-center py-2 text-ink-700"
          >
            <LogIn className="h-3.5 w-3.5" /> Sign In with a Different Account
          </button>
        </div>
      </div>
    </div>
  );
}
