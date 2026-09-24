import { Suspense, lazy } from 'react';
import { useRouter, segments } from '@/lib/router';
import { AppShell } from '@/components/AppShell';
import { PageLoader } from '@/components/PageLoader';
import { AccessRestricted } from '@/components/AccessRestricted';
import { AuthProvider, useAuth } from '@/lib/authContext';
import { ThemeProvider } from '@/lib/themeContext';

// Lazy-loaded route components for fast initial bundle delivery and code-splitting
const AuthPage = lazy(() =>
  import('@/pages/AuthPage').then((m) => ({ default: m.AuthPage }))
);
const LandingPage = lazy(() =>
  import('@/pages/LandingPage').then((m) => ({ default: m.LandingPage }))
);
const FairnessPage = lazy(() =>
  import('@/pages/FairnessPage').then((m) => ({ default: m.FairnessPage }))
);
const StudentDashboardPage = lazy(() =>
  import('@/pages/StudentDashboardPage').then((m) => ({ default: m.StudentDashboardPage }))
);
const SkillPassportPage = lazy(() =>
  import('@/pages/SkillPassportPage').then((m) => ({ default: m.SkillPassportPage }))
);
const EvidencePage = lazy(() =>
  import('@/pages/EvidencePage').then((m) => ({ default: m.EvidencePage }))
);
const SkillDetailsPage = lazy(() =>
  import('@/pages/SkillDetailsPage').then((m) => ({ default: m.SkillDetailsPage }))
);
const InternshipDiscoveryPage = lazy(() =>
  import('@/pages/InternshipDiscoveryPage').then((m) => ({ default: m.InternshipDiscoveryPage }))
);
const InternshipDetailsPage = lazy(() =>
  import('@/pages/InternshipDetailsPage').then((m) => ({ default: m.InternshipDetailsPage }))
);
const SkillGapPage = lazy(() =>
  import('@/pages/SkillGapPage').then((m) => ({ default: m.SkillGapPage }))
);
const TeamMatchingPage = lazy(() =>
  import('@/pages/TeamMatchingPage').then((m) => ({ default: m.TeamMatchingPage }))
);
const OrgDashboardPage = lazy(() =>
  import('@/pages/OrgDashboardPage').then((m) => ({ default: m.OrgDashboardPage }))
);
const CreateOpportunityPage = lazy(() =>
  import('@/pages/CreateOpportunityPage').then((m) => ({ default: m.CreateOpportunityPage }))
);
const VerificationQueuePage = lazy(() =>
  import('@/pages/VerificationQueuePage').then((m) => ({ default: m.VerificationQueuePage }))
);
const CandidateMatchingPage = lazy(() =>
  import('@/pages/CandidateMatchingPage').then((m) => ({ default: m.CandidateMatchingPage }))
);
const CandidateDetailsPage = lazy(() =>
  import('@/pages/CandidateDetailsPage').then((m) => ({ default: m.CandidateDetailsPage }))
);
const TeamBuilderPage = lazy(() =>
  import('@/pages/TeamBuilderPage').then((m) => ({ default: m.TeamBuilderPage }))
);
const CreateTeamPage = lazy(() =>
  import('@/pages/CreateTeamPage').then((m) => ({ default: m.CreateTeamPage }))
);
const PublicPassportPage = lazy(() =>
  import('@/pages/PublicPassportPage').then((m) => ({ default: m.PublicPassportPage }))
);
const StudentInterviewCoachPage = lazy(() =>
  import('@/pages/StudentInterviewCoachPage').then((m) => ({ default: m.StudentInterviewCoachPage }))
);
const SquadWorkspacePage = lazy(() =>
  import('@/pages/SquadWorkspacePage').then((m) => ({ default: m.SquadWorkspacePage }))
);
const InstitutionalAnalyticsPage = lazy(() =>
  import('@/pages/InstitutionalAnalyticsPage').then((m) => ({ default: m.InstitutionalAnalyticsPage }))
);

import { ToastProvider } from '@/lib/toast';

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <ToastProvider>
          <AppRouter />
        </ToastProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

function AppRouter() {
  const { path } = useRouter();
  const { profile, loading } = useAuth();
  const seg = segments(path);

  // While restoring session or processing OAuth callback
  if (loading) {
    return <PageLoader />;
  }

  // Public Skill Passport Route (/passport/:studentId) - No Auth Required
  if (seg[0] === 'passport' && seg[1]) {
    return (
      <Suspense fallback={<PageLoader />}>
        <PublicPassportPage studentId={seg[1]} />
      </Suspense>
    );
  }

  // Standalone Fairness policy
  if (seg[0] === 'fairness') {
    return (
      <Suspense fallback={<PageLoader />}>
        <FairnessPage />
      </Suspense>
    );
  }

  // If NOT logged in: Land directly on Login / Create Account screen
  if (!profile) {
    return (
      <Suspense fallback={<PageLoader />}>
        <AuthPage />
      </Suspense>
    );
  }

  // If logged in and accessing root: Landing & Showcase Page
  if (seg.length === 0 || path === '/') {
    return (
      <Suspense fallback={<PageLoader />}>
        <LandingPage />
      </Suspense>
    );
  }

  // Explicit Login Page when already logged in
  if (path === '/login' || seg[0] === 'login') {
    return (
      <Suspense fallback={<PageLoader />}>
        <AuthPage />
      </Suspense>
    );
  }

  // ===== Student routes =====
  if (seg[0] === 'student') {
    if (profile.role === 'organization') {
      return (
        <AppShell role="org" activePath={path}>
          <AccessRestricted requiredRole="student" currentRole={profile.role} />
        </AppShell>
      );
    }
    return (
      <AppShell role="student" activePath={path}>
        <Suspense fallback={<PageLoader />}>
          {renderStudent(seg)}
        </Suspense>
      </AppShell>
    );
  }

  // ===== Organization routes =====
  if (seg[0] === 'org') {
    if (profile.role === 'student') {
      return (
        <AppShell role="student" activePath={path}>
          <AccessRestricted requiredRole="organization" currentRole={profile.role} />
        </AppShell>
      );
    }
    return (
      <AppShell role="org" activePath={path}>
        <Suspense fallback={<PageLoader />}>
          {renderOrg(seg)}
        </Suspense>
      </AppShell>
    );
  }

  // ===== Team routes =====
  if (seg[0] === 'team') {
    return (
      <AppShell role="team" activePath={path}>
        <Suspense fallback={<PageLoader />}>
          {renderTeam(seg)}
        </Suspense>
      </AppShell>
    );
  }

  // Fallback
  return (
    <Suspense fallback={<PageLoader />}>
      <LandingPage />
    </Suspense>
  );
}

function renderStudent(seg: string[]): React.ReactNode {
  // /student/dashboard
  if (seg[1] === 'dashboard' || !seg[1]) return <StudentDashboardPage />;
  // /student/create -> fallback / redirect to passport
  if (seg[1] === 'create') return <SkillPassportPage />;
  // /student/passport
  if (seg[1] === 'passport') return <SkillPassportPage />;
  // /student/evidence
  if (seg[1] === 'evidence') return <EvidencePage />;
  // /student/skill/:skillId
  if (seg[1] === 'skill' && seg[2]) return <SkillDetailsPage skillId={seg[2]} />;
  // /student/internships
  if (seg[1] === 'internships' && !seg[2]) return <InternshipDiscoveryPage />;
  // /student/internships/:opportunityId
  if (seg[1] === 'internships' && seg[2]) return <InternshipDetailsPage opportunityId={seg[2]} />;
  // /student/skillgap
  if (seg[1] === 'skillgap' && !seg[2]) return <SkillGapPage />;
  // /student/skillgap/:opportunityId
  if (seg[1] === 'skillgap' && seg[2]) return <SkillGapPage opportunityId={seg[2]} />;
  // /student/teams
  if (seg[1] === 'teams') return <TeamMatchingPage />;
  // /student/interview-coach
  if (seg[1] === 'interview-coach') return <StudentInterviewCoachPage />;
  return <StudentDashboardPage />;
}

function renderOrg(seg: string[]): React.ReactNode {
  // /org/dashboard
  if (seg[1] === 'dashboard' || !seg[1]) return <OrgDashboardPage />;
  // /org/verifications
  if (seg[1] === 'verifications') return <VerificationQueuePage />;
  // /org/analytics
  if (seg[1] === 'analytics') return <InstitutionalAnalyticsPage />;
  // /org/create
  if (seg[1] === 'create') return <CreateOpportunityPage />;
  // /org/candidates
  if (seg[1] === 'candidates' && !seg[2]) return <CandidateMatchingPage />;
  // /org/candidates/:opportunityId
  if (seg[1] === 'candidates' && seg[2] && !seg[3]) return <CandidateMatchingPage opportunityId={seg[2]} />;
  // /org/candidates/:opportunityId/:studentId
  if (seg[1] === 'candidates' && seg[2] && seg[3]) return <CandidateDetailsPage opportunityId={seg[2]} studentId={seg[3]} />;
  return <OrgDashboardPage />;
}

function renderTeam(seg: string[]): React.ReactNode {
  // /team/matching
  if (seg[1] === 'matching' && !seg[2]) return <TeamBuilderPage />;
  // /team/matching/:teamId
  if (seg[1] === 'matching' && seg[2]) return <TeamBuilderPage teamId={seg[2]} />;
  // /team/workspace
  if (seg[1] === 'workspace' && !seg[2]) return <SquadWorkspacePage />;
  // /team/workspace/:teamId
  if (seg[1] === 'workspace' && seg[2]) return <SquadWorkspacePage teamId={seg[2]} />;
  // /team/create
  if (seg[1] === 'create') return <CreateTeamPage />;
  return <TeamBuilderPage />;
}

export default App;
