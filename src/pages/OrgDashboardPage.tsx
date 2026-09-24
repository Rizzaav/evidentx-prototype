import { useMemo } from 'react';
import {
  Building2,
  PlusCircle,
  Users,
  Briefcase,
  TrendingUp,
  ArrowRight,
  MapPin,
  Clock,
  UserCheck,
  ShieldCheck,
  BarChart3,
} from 'lucide-react';
import { useRouter } from '@/lib/router';
import {
  PageHeader,
  Card,
  Section,
  Chip,
  StatCard,
  SkillBadge,
} from '@/components/ui';
import {
  ORGANIZATIONS,
  STUDENTS,
  getAllStudents,
  skillMap,
  opportunityMap,
  studentMap,
} from '@/data/mockData';
import { useCustomOpportunities } from '@/lib/customOpportunities';
import { useApplications } from '@/lib/applications';
import { rankStudentsForOpportunity } from '@/lib/matchingEngine';

export function OrgDashboardPage() {
  const { navigate } = useRouter();
  const { opportunities } = useCustomOpportunities();
  const { applications } = useApplications();

  const allStudents = useMemo(() => getAllStudents(), []);
  const totalCandidates = allStudents.length;
  const topOpp = opportunities[0];
  const ranked = useMemo(() => (topOpp ? rankStudentsForOpportunity(topOpp) : []), [topOpp]);
  const topCandidate = ranked[0];

  const shortlistedCount = useMemo(
    () =>
      applications.filter(
        (a) => a.status === 'Shortlisted' || a.status === 'Interviewing' || a.status === 'Offered'
      ).length,
    [applications]
  );

  const pipelineFunnel = useMemo(() => {
    let l1 = 0, l2 = 0, l3 = 0, l4 = 0;
    for (const a of applications) {
      if (a.status === 'Applied' || a.status === 'Reviewing') l1++;
      else if (a.status === 'Shortlisted') l2++;
      else if (a.status === 'Interviewing') l3++;
      else if (a.status === 'Offered') l4++;
    }
    return { l1, l2, l3, l4 };
  }, [applications]);

  return (
    <div>
      <PageHeader
        title="Organization Dashboard"
        subtitle="Manage verified role requirements and discover qualified candidates"
      />

      {/* Hero */}
      <div className="rounded-3xl bg-gradient-to-br from-accent-700 via-accent-800 to-ink-950 p-6 text-white sm:p-8 shadow-lift border border-accent-900">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-0.5 text-xs font-semibold text-accent-200">
              <Building2 className="h-3.5 w-3.5" /> Organization Portal
            </div>
            <h2 className="mt-3 font-display text-2xl font-bold tracking-tight">Hire from Verified Evidence</h2>
            <p className="mt-2 max-w-xl text-ink-200 text-xs sm:text-sm leading-relaxed">
              Create opportunities with required and preferred competencies, then inspect ranked candidate portfolios with deterministic match breakdowns based on demonstrated proof.
            </p>
            <div className="mt-5 flex flex-wrap gap-3">
              <button onClick={() => navigate('/org/create')} className="btn-primary bg-white text-accent-800 hover:bg-ink-100 text-xs shadow-card">
                <PlusCircle className="h-4 w-4" /> Create Opportunity
              </button>
              <button onClick={() => navigate('/org/candidates')} className="btn-secondary bg-white/10 text-white border-white/20 hover:bg-white/20 text-xs">
                <Users className="h-4 w-4" /> Browse Candidates
              </button>
              <button onClick={() => navigate('/org/verifications')} className="btn-secondary bg-amber-400/20 text-white border-amber-300/40 hover:bg-amber-400/30 text-xs inline-flex items-center gap-1.5">
                <ShieldCheck className="h-4 w-4 text-amber-300" /> Verification Hub (HITL)
              </button>
              <button onClick={() => navigate('/org/analytics')} className="btn-secondary bg-emerald-500/20 text-white border-emerald-300/40 hover:bg-emerald-500/30 text-xs inline-flex items-center gap-1.5">
                <BarChart3 className="h-4 w-4 text-emerald-300" /> Institutional Analytics
              </button>
            </div>
          </div>
          <div className="flex gap-6 border-t border-white/10 pt-4 sm:border-t-0 sm:pt-0">
            <HeroStat value={opportunities.length} label="Open Roles" />
            <HeroStat value={applications.length} label="Applications" />
            <HeroStat value={shortlistedCount} label="In Pipeline" />
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard label="Active opportunities" value={opportunities.length} icon={<Briefcase className="h-4 w-4 text-accent-600" />} color="accent" />
        <StatCard label="Total applications" value={applications.length} icon={<Users className="h-4 w-4 text-brand-600" />} color="brand" />
        <StatCard label="In Pipeline" value={shortlistedCount} icon={<UserCheck className="h-4 w-4 text-accent-700" />} color="emerald" />
        <StatCard label="Avg match score" value={ranked.length > 0 ? `${Math.round(ranked.reduce((a, b) => a + b.matchScore, 0) / ranked.length)}%` : '0%'} icon={<TrendingUp className="h-4 w-4 text-amber-600" />} color="amber" />
      </div>

      {/* Pipeline Progression Levels Funnel */}
      <div className="mt-6 rounded-2xl border border-ink-200/80 dark:border-[#30363d] bg-white dark:bg-[#161b22] p-5 shadow-soft">
        <div className="flex items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-2">
            <UserCheck className="h-5 w-5 text-brand-600" />
            <h3 className="font-display font-bold text-ink-900 dark:text-white text-sm sm:text-base">
              Hiring Pipeline Progression Levels
            </h3>
          </div>
          <button
            onClick={() => navigate('/org/candidates')}
            className="text-xs font-bold text-brand-600 hover:text-brand-700 dark:text-brand-400 flex items-center gap-1"
          >
            <span>Open Candidate Pipeline</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div
            onClick={() => navigate('/org/candidates')}
            className="cursor-pointer rounded-xl border border-indigo-200 dark:border-indigo-900 bg-indigo-50/40 dark:bg-indigo-950/20 p-3.5 hover:border-indigo-400 transition"
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-indigo-700 dark:text-indigo-300 bg-indigo-100 dark:bg-indigo-900/60 px-2 py-0.5 rounded-full">
                Level 1
              </span>
              <span className="text-base">📋</span>
            </div>
            <div className="mt-2 text-xl font-extrabold text-ink-900 dark:text-white">
              {pipelineFunnel.l1}
            </div>
            <div className="text-xs font-semibold text-ink-600 dark:text-[#8b949e]">
              Applied / Review
            </div>
          </div>

          <div
            onClick={() => navigate('/org/candidates')}
            className="cursor-pointer rounded-xl border border-brand-200 dark:border-brand-900 bg-brand-50/40 dark:bg-brand-950/20 p-3.5 hover:border-brand-400 transition"
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-brand-700 dark:text-brand-300 bg-brand-100 dark:bg-brand-900/60 px-2 py-0.5 rounded-full">
                Level 2
              </span>
              <span className="text-base">⭐</span>
            </div>
            <div className="mt-2 text-xl font-extrabold text-ink-900 dark:text-white">
              {pipelineFunnel.l2}
            </div>
            <div className="text-xs font-semibold text-ink-600 dark:text-[#8b949e]">
              Shortlisted
            </div>
          </div>

          <div
            onClick={() => navigate('/org/candidates')}
            className="cursor-pointer rounded-xl border border-amber-200 dark:border-amber-900 bg-amber-50/40 dark:bg-amber-950/20 p-3.5 hover:border-amber-400 transition"
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-amber-800 dark:text-amber-300 bg-amber-100 dark:bg-amber-900/60 px-2 py-0.5 rounded-full">
                Level 3
              </span>
              <span className="text-base">🎙️</span>
            </div>
            <div className="mt-2 text-xl font-extrabold text-ink-900 dark:text-white">
              {pipelineFunnel.l3}
            </div>
            <div className="text-xs font-semibold text-ink-600 dark:text-[#8b949e]">
              Interviewing
            </div>
          </div>

          <div
            onClick={() => navigate('/org/candidates')}
            className="cursor-pointer rounded-xl border border-emerald-200 dark:border-emerald-900 bg-emerald-50/40 dark:bg-emerald-950/20 p-3.5 hover:border-emerald-400 transition"
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-800 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-900/60 px-2 py-0.5 rounded-full">
                Level 4
              </span>
              <span className="text-base">🏆</span>
            </div>
            <div className="mt-2 text-xl font-extrabold text-ink-900 dark:text-white">
              {pipelineFunnel.l4}
            </div>
            <div className="text-xs font-semibold text-ink-600 dark:text-[#8b949e]">
              Offered / Hired
            </div>
          </div>
        </div>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        {/* Opportunities list */}
        <div className="lg:col-span-2">
          <Section title="Your opportunities" action={<button onClick={() => navigate('/org/create')} className="btn-ghost text-xs"><PlusCircle className="h-3.5 w-3.5" /> New Role</button>}>
            <div className="space-y-3">
              {opportunities.map((opp) => {
                const r = rankStudentsForOpportunity(opp);
                const best = r[0];
                const oppApps = applications.filter((a) => a.opportunityId === opp.id);
                return (
                  <button
                    key={opp.id}
                    onClick={() => navigate(`/org/candidates/${opp.id}`)}
                    className="card w-full p-4 text-left hover:border-accent-300 hover:shadow-lift transition-all"
                  >
                    <div className="flex items-center justify-between gap-4">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-3">
                          <Briefcase className="h-5 w-5 text-accent-600 flex-shrink-0" />
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <h3 className="font-semibold text-ink-900 text-sm truncate">{opp.title}</h3>
                              {oppApps.length > 0 && <Chip color="brand">{oppApps.length} applicants</Chip>}
                            </div>
                            <div className="text-xs text-ink-500 truncate">{opp.organization} · {opp.location}</div>
                          </div>
                        </div>
                      </div>
                      <div className="flex flex-shrink-0 items-center gap-3">
                        {best && (
                          <div className="text-right">
                            <div className="text-[10px] uppercase font-bold text-ink-400">Top Candidate</div>
                            <div className={`text-sm font-bold ${best.matchScore >= 75 ? 'text-accent-600' : best.matchScore >= 50 ? 'text-amber-600' : 'text-rose-600'}`}>
                              {best.matchScore}%
                            </div>
                          </div>
                        )}
                        <ArrowRight className="h-4 w-4 text-ink-400" />
                      </div>
                    </div>
                    <div className="mt-3 flex flex-wrap items-center gap-1.5 border-t border-ink-100 pt-3">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-ink-500">Required:</span>
                      {opp.requiredSkills.map((skId) => (
                        <SkillBadge key={skId} name={skillMap[skId]?.name ?? skId} size="sm" />
                      ))}
                    </div>
                  </button>
                );
              })}
            </div>
          </Section>
        </div>

        {/* Side */}
        <div className="space-y-6">
          {topCandidate && topOpp && (
            <Card className="p-5 border-accent-200/80 bg-accent-50/40">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-accent-600" />
                <h3 className="font-semibold text-ink-900 text-sm">Top Candidate Match</h3>
              </div>
              <div className="mt-3 rounded-xl bg-white border border-accent-100 p-3">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-ink-900 text-xs">{studentMap[topCandidate.studentId]?.name ?? topCandidate.studentId}</span>
                  <span className="text-sm font-bold text-accent-600">{topCandidate.matchScore}%</span>
                </div>
                <p className="mt-1 text-[11px] text-ink-500">Candidate for {topOpp.title}</p>
                <div className="mt-2 flex flex-wrap gap-1">
                  {topCandidate.matchedSkills.slice(0, 3).map((m) => (
                    <Chip key={m.skillId} color="emerald">{skillMap[m.skillId]?.name}</Chip>
                  ))}
                </div>
              </div>
              <button onClick={() => navigate(`/org/candidates/${topOpp.id}`)} className="mt-3 btn-primary w-full text-xs">
                Inspect Candidate Breakdown <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </Card>
          )}

          <Card className="p-5">
            <h3 className="font-semibold text-ink-900 text-sm">Quick Actions</h3>
            <div className="mt-3 space-y-2">
              <button onClick={() => navigate('/org/create')} className="flex w-full items-center gap-2.5 rounded-xl border border-ink-200 p-2.5 text-left text-xs font-semibold text-ink-700 hover:border-accent-300 hover:bg-ink-50 transition">
                <PlusCircle className="h-4 w-4 text-accent-600" /> Create a new opportunity
              </button>
              <button onClick={() => navigate('/org/candidates')} className="flex w-full items-center gap-2.5 rounded-xl border border-ink-200 p-2.5 text-left text-xs font-semibold text-ink-700 hover:border-brand-300 hover:bg-ink-50 transition">
                <Users className="h-4 w-4 text-brand-600" /> Browse all candidate rankings
              </button>
              <button onClick={() => navigate('/fairness')} className="flex w-full items-center gap-2.5 rounded-xl border border-ink-200 p-2.5 text-left text-xs font-semibold text-ink-700 hover:border-ink-300 hover:bg-ink-50 transition">
                <MapPin className="h-4 w-4 text-ink-500" /> Inspect Fairness Policy
              </button>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

function HeroStat({ value, label }: { value: React.ReactNode; label: string }) {
  return (
    <div className="text-center">
      <div className="text-2xl sm:text-3xl font-bold">{value}</div>
      <div className="text-[10px] font-bold uppercase tracking-wider text-accent-200">{label}</div>
    </div>
  );
}
