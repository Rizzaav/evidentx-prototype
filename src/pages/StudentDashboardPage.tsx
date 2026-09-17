import { useMemo } from 'react';
import {
  GraduationCap,
  Compass,
  Target,
  Users,
  ArrowRight,
  Sparkles,
  TrendingUp,
  FileBadge,
  Shield,
  Clock,
  Building2,
  CheckCircle2,
  Brain,
} from 'lucide-react';
import { useRouter } from '@/lib/router';
import {
  PageHeader,
  Card,
  Section,
  Avatar,
  ProgressBar,
  Chip,
  StatCard,
} from '@/components/ui';
import { useDemoStudent } from '@/lib/useDemoStudent';
import { passportSummary, rankOpportunitiesForStudent } from '@/lib/matchingEngine';
import { getAllOpportunities, skillMap, opportunityMap } from '@/data/mockData';
import { useApplications } from '@/lib/applications';
import { useNotifications } from '@/lib/notifications';

export function StudentDashboardPage() {
  const { studentId, student } = useDemoStudent();
  const { navigate } = useRouter();
  const { getStudentApplications } = useApplications();
  const { notifications, markAsRead } = useNotifications(studentId);

  const allOpps = useMemo(() => getAllOpportunities(), []);
  const studentApps = useMemo(() => (studentId ? getStudentApplications(studentId) : []), [studentId, getStudentApplications]);
  const summary = useMemo(() => (studentId ? passportSummary(studentId) : null), [studentId]);
  const ranked = useMemo(
    () => (studentId ? rankOpportunitiesForStudent(studentId, allOpps).slice(0, 3) : []),
    [studentId, allOpps]
  );
  const topMatch = ranked[0];

  const unreadNotif = notifications.find((n) => !n.read);

  if (!student || !summary) return null;

  const statusColors: Record<string, 'brand' | 'accent' | 'emerald' | 'amber' | 'rose' | 'gray'> = {
    Applied: 'brand',
    Reviewing: 'amber',
    Shortlisted: 'accent',
    Interviewing: 'brand',
    Offered: 'emerald',
    Rejected: 'rose',
  };

  return (
    <div>
      <PageHeader
        title="Dashboard"
        subtitle={`Welcome back, ${student.name.split(' ')[0]}`}
      />

      {/* Real-time Recruiter Status Alert Banner */}
      {unreadNotif && (
        <div className="mb-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 rounded-2xl bg-gradient-to-r from-brand-900 via-indigo-900 to-brand-950 p-4 text-white shadow-soft border border-brand-700 animate-slide-up">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-white/10 text-xl backdrop-blur-sm border border-white/20">
              {unreadNotif.type === 'shortlist' ? '⭐' : unreadNotif.type === 'interview' ? '🎙️' : unreadNotif.type === 'offer' ? '🏆' : '📬'}
            </span>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-sm text-white">{unreadNotif.title}</span>
                <span className="text-[10px] uppercase font-extrabold bg-brand-500/80 px-2 py-0.5 rounded-full text-white">
                  Live Update
                </span>
              </div>
              <p className="text-xs text-brand-100 mt-0.5 leading-snug">{unreadNotif.message}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 self-end sm:self-center">
            {unreadNotif.opportunityId && (
              <button
                onClick={() => {
                  markAsRead(unreadNotif.id);
                  navigate(`/student/internships/${unreadNotif.opportunityId}`);
                }}
                className="btn bg-white text-ink-950 text-xs py-1.5 px-3 font-bold hover:bg-brand-50 shadow-sm"
              >
                View Opportunity →
              </button>
            )}
            <button
              onClick={() => markAsRead(unreadNotif.id)}
              className="px-2 py-1 text-xs text-brand-200 hover:text-white transition"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      {/* Hero banner */}
      <div className="rounded-3xl bg-gradient-to-br from-brand-700 via-brand-800 to-brand-950 p-6 text-white sm:p-8 shadow-lift border border-brand-900">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <Avatar name={student.name} color={student.avatarColor} photoUrl={student.photoUrl} size="xl" />
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-display text-2xl font-bold tracking-tight">{student.name}</h2>
                <button
                  onClick={() => navigate('/student/passport')}
                  className="px-2 py-0.5 rounded-lg bg-white/15 hover:bg-white/25 text-white text-[11px] font-semibold transition"
                >
                  Edit Profile
                </button>
              </div>
              <p className="text-brand-100 text-xs sm:text-sm mt-0.5">{student.program} · {student.university}</p>
              <div className="mt-2.5 flex flex-wrap gap-1.5">
                {student.interests.map((i) => (
                  <span key={i} className="rounded-md bg-white/10 px-2 py-0.5 text-xs font-medium text-brand-100">{i}</span>
                ))}
              </div>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-2 text-center border-t border-white/10 pt-4 sm:flex sm:items-center sm:text-left sm:gap-6 sm:border-t-0 sm:pt-0">
            <div>
              <div className="text-2xl sm:text-3xl font-bold">{summary.skills.length}</div>
              <div className="text-[10px] font-bold uppercase tracking-wider text-brand-200">Verified Skills</div>
            </div>
            <div>
              <div className="text-2xl sm:text-3xl font-bold">{summary.avgProficiency}%</div>
              <div className="text-[10px] font-bold uppercase tracking-wider text-brand-200">Avg Proficiency</div>
            </div>
            <div>
              <div className="text-2xl sm:text-3xl font-bold">{studentApps.length}</div>
              <div className="text-[10px] font-bold uppercase tracking-wider text-brand-200">Applications</div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick actions: 2x2 on mobile, 4-col on desktop */}
      <div className="mt-5 sm:mt-6 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <ActionCard icon={<GraduationCap className="h-5 w-5 text-brand-600" />} title="Skill Passport" desc="Verified skills & proof" onClick={() => navigate('/student/passport')} />
        <ActionCard icon={<Compass className="h-5 w-5 text-accent-600" />} title="Internships" desc="Explainable matches" onClick={() => navigate('/student/internships')} />
        <ActionCard icon={<Target className="h-5 w-5 text-amber-600" />} title="Skill Gap" desc="Development roadmaps" onClick={() => navigate('/student/skillgap')} />
        <ActionCard icon={<Users className="h-5 w-5 text-rose-600" />} title="Teams" desc="Multidisciplinary squads" onClick={() => navigate('/student/teams')} />
      </div>

      {/* AI Technical Interview Coach Banner */}
      <div className="mt-5 relative overflow-hidden rounded-2xl bg-gradient-to-r from-purple-900 via-indigo-900 to-brand-900 p-5 text-white shadow-soft border border-purple-500/30">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <span className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl bg-white/10 text-2xl backdrop-blur-sm border border-white/20 shadow-inner">
              🎯
            </span>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-display font-bold text-base text-white">AI Technical Interview Coach</span>
                <span className="rounded-full bg-purple-400/20 px-2 py-0.5 text-[10px] font-extrabold uppercase text-purple-200 border border-purple-400/30">
                  Evidence-Grounded
                </span>
              </div>
              <p className="text-xs text-purple-100 mt-1 max-w-xl leading-relaxed">
                Practice realistic technical and behavioral interview questions generated directly from your verified coursework and project evidence, with instant rubric feedback and senior model answers.
              </p>
            </div>
          </div>
          <button
            onClick={() => navigate('/student/interview-coach')}
            className="flex-shrink-0 inline-flex items-center gap-2 rounded-xl bg-white text-ink-950 px-4 py-2.5 text-xs font-bold hover:bg-purple-50 transition shadow-sm active:scale-95"
          >
            Launch Interview Coach <ArrowRight className="h-4 w-4 text-purple-600" />
          </button>
        </div>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        {/* Main column */}
        <div className="lg:col-span-2 space-y-6">
          {/* Active Applications Section */}
          {studentApps.length > 0 && (
            <Section title="Your active applications" action={<span className="text-xs font-semibold text-ink-500">{studentApps.length} active</span>}>
              <div className="space-y-3">
                {studentApps.map((app) => {
                  const opp = opportunityMap[app.opportunityId];
                  if (!opp) return null;
                  return (
                    <div
                      key={app.id}
                      onClick={() => navigate(`/student/internships/${opp.id}`)}
                      className="card p-4 flex items-center justify-between gap-4 cursor-pointer hover:border-brand-300 hover:shadow-lift transition-all"
                    >
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-ink-900 truncate">{opp.title}</span>
                          <Chip color={statusColors[app.status] ?? 'brand'}>{app.status}</Chip>
                        </div>
                        <div className="mt-1 flex items-center gap-3 text-xs text-ink-500">
                          <span className="inline-flex items-center gap-1"><Building2 className="h-3 w-3" /> {opp.organization}</span>
                          <span className="inline-flex items-center gap-1"><Clock className="h-3 w-3" /> Applied {app.appliedDate}</span>
                        </div>
                      </div>
                      <ArrowRight className="h-4 w-4 text-ink-400 flex-shrink-0" />
                    </div>
                  );
                })}
              </div>
            </Section>
          )}

          {/* Top matches */}
          <Section title="Your top internship matches" action={<button onClick={() => navigate('/student/internships')} className="btn-ghost text-xs">View all <ArrowRight className="h-3 w-3" /></button>}>
            <div className="space-y-3">
              {ranked.map((r) => {
                const opp = opportunityMap[r.targetId];
                if (!opp) return null;
                return (
                  <button
                    key={r.targetId}
                    onClick={() => navigate(`/student/internships/${opp.id}`)}
                    className="card w-full p-4 text-left hover:border-brand-300 hover:shadow-lift transition-all"
                  >
                    <div className="flex items-center gap-4">
                      <div className={`flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl text-white font-bold text-sm shadow-card ${r.matchScore >= 75 ? 'bg-accent-600' : r.matchScore >= 50 ? 'bg-amber-600' : 'bg-rose-600'}`}>
                        {r.matchScore}%
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="font-semibold text-ink-900 truncate">{opp.title}</div>
                        <div className="text-xs text-ink-500">{opp.organization} · {opp.location}</div>
                        <div className="mt-1.5 flex flex-wrap gap-1">
                          {r.matchedSkills.slice(0, 3).map((m) => (
                            <Chip key={m.skillId} color="emerald">{skillMap[m.skillId]?.name}</Chip>
                          ))}
                          {r.missingSkills.length > 0 && (
                            <Chip color="rose">+{r.missingSkills.length} missing</Chip>
                          )}
                        </div>
                      </div>
                      <ArrowRight className="h-4 w-4 flex-shrink-0 text-ink-400" />
                    </div>
                  </button>
                );
              })}
            </div>
          </Section>
        </div>

        {/* Side */}
        <div className="space-y-6">
          <Card className="p-5">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-accent-600" />
              <h3 className="font-semibold text-ink-900 text-sm">Proficiency Overview</h3>
            </div>
            <div className="mt-4 space-y-3">
              {summary.topSkills.map((sk) => (
                <div key={sk.skillId}>
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium text-ink-700">{skillMap[sk.skillId]?.name}</span>
                    <span className="font-bold text-ink-900">{sk.proficiency}%</span>
                  </div>
                  <div className="mt-1">
                    <ProgressBar value={sk.proficiency} height="h-1.5" />
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {topMatch && (
            <Card className="p-5 border-brand-200/80 bg-brand-50/40">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-brand-600" />
                <h3 className="font-semibold text-ink-900 text-sm">Highest Ranked Match</h3>
              </div>
              <p className="mt-2 text-xs text-ink-700">
                <strong>{opportunityMap[topMatch.targetId]?.title}</strong> at {opportunityMap[topMatch.targetId]?.organization}
              </p>
              <p className="mt-1 text-xs text-ink-600 line-clamp-2">{topMatch.explanation}</p>
              <button
                onClick={() => navigate(`/student/internships/${topMatch.targetId}`)}
                className="mt-3 btn-primary w-full text-xs"
              >
                Inspect Match Breakdown <ArrowRight className="h-3 w-3" />
              </button>
            </Card>
          )}

          <Card className="p-5">
            <div className="flex items-center gap-2">
              <Shield className="h-4 w-4 text-accent-600" />
              <h3 className="font-semibold text-ink-900 text-sm">Explainable Audit</h3>
            </div>
            <p className="mt-2 text-xs text-ink-600 leading-relaxed">
              Matching calculations are derived strictly from inspectable coursework, projects, and verified credentials. Demographic factors are mathematically ignored.
            </p>
            <button onClick={() => navigate('/fairness')} className="mt-2.5 text-xs font-semibold text-brand-600 hover:underline inline-flex items-center gap-1">
              Read Fairness Policy <ArrowRight className="h-3 w-3" />
            </button>
          </Card>
        </div>
      </div>
    </div>
  );
}

function ActionCard({ icon, title, desc, onClick }: { icon: React.ReactNode; title: string; desc: string; onClick: () => void }) {
  return (
    <button onClick={onClick} className="card p-4 text-left hover:border-brand-300 hover:shadow-lift transition-all group">
      <div>{icon}</div>
      <div className="mt-2.5 font-semibold text-ink-900 text-sm group-hover:text-brand-600 transition">{title}</div>
      <div className="text-xs text-ink-500 mt-0.5">{desc}</div>
    </button>
  );
}
