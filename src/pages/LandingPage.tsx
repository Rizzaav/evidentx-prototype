import {
  Sparkles,
  Shield,
  Target,
  Users,
  GraduationCap,
  Building2,
  ArrowRight,
  CheckCircle2,
  FileBadge,
  Brain,
  Layers,
  TrendingUp,
} from 'lucide-react';
import { useRouter } from '@/lib/router';
import { useAuth } from '@/lib/authContext';
import { STUDENTS, OPPORTUNITIES, TEAMS, SKILLS } from '@/data/mockData';
import { Logo, LogoMark } from '@/components/Logo';
import { ThemeToggle } from '@/lib/themeContext';

export function LandingPage() {
  const { navigate } = useRouter();
  const { profile } = useAuth();

  const stats = [
    { label: 'Students', value: STUDENTS.length },
    { label: 'Opportunities', value: OPPORTUNITIES.length },
    { label: 'Teams', value: TEAMS.length },
    { label: 'Skills tracked', value: SKILLS.length },
  ];

  return (
    <div className="min-h-screen bg-ink-50 dark:bg-ink-950 transition-colors">
      {/* Nav */}
      <header className="sticky top-0 z-30 border-b border-ink-200/80 dark:border-ink-800 bg-white/90 dark:bg-ink-900/90 backdrop-blur-md transition-colors">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3.5 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2.5">
            <LogoMark size={32} />
            <span className="font-display text-lg font-bold text-ink-900 dark:text-white tracking-tight">EvidentX</span>
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            <button onClick={() => navigate('/fairness')} className="btn-ghost hidden sm:inline-flex text-xs font-semibold">
              <Shield className="h-4 w-4 text-accent-600" /> Fairness Policy
            </button>
            <ThemeToggle />
            <button onClick={() => navigate('/login')} className="btn-secondary text-xs font-semibold">
              Sign In / Join
            </button>
            <button
              onClick={() => navigate(profile?.role === 'organization' ? '/org/dashboard' : '/student/dashboard')}
              className="btn-primary text-xs"
            >
              {profile?.role === 'organization' ? 'Organization Portal' : 'Launch Platform'} <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative">
        <div className="mx-auto max-w-7xl px-4 pb-16 pt-12 sm:px-6 lg:px-8 lg:pt-16">
          <div className="grid items-center gap-12 lg:grid-cols-2">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-brand-200 dark:border-brand-800 bg-brand-50 dark:bg-brand-950/60 px-3 py-1 text-xs font-semibold text-brand-700 dark:text-brand-300">
                <Sparkles className="h-3.5 w-3.5" /> Verified Evidence Infrastructure
              </div>
              <h1 className="mt-4 font-display text-4xl font-bold tracking-tight text-ink-900 dark:text-white sm:text-5xl lg:text-6xl leading-[1.1]">
                Demonstrated skills, verified by proof and explainable matching.
              </h1>
              <p className="mt-5 max-w-xl text-base text-ink-600 dark:text-ink-300 leading-relaxed">
                Convert coursework, production projects, and verified credentials into a portable <strong>Skill Passport</strong>. Match to internships and multidisciplinary squads with transparent, deterministic evidence breakdowns.
              </p>
              
              <div className="mt-7 flex flex-wrap gap-3">
                {profile?.role !== 'organization' && (
                  <button onClick={() => navigate('/student/dashboard')} className="btn-primary text-sm px-5 py-3 shadow-card">
                    <GraduationCap className="h-4 w-4" /> Student Portal
                  </button>
                )}
                <button
                  onClick={() => navigate('/org/dashboard')}
                  className={`${profile?.role === 'organization' ? 'btn-primary' : 'btn-secondary'} text-sm px-5 py-3 shadow-card`}
                >
                  <Building2 className="h-4 w-4" /> Organization Portal
                </button>
                <button
                  onClick={() => navigate(profile?.role === 'organization' ? '/team/matching' : '/student/teams')}
                  className="btn-secondary text-sm px-5 py-3 shadow-card"
                >
                  <Users className="h-4 w-4" /> Team Builder
                </button>
              </div>

              <div className="mt-8 grid grid-cols-4 gap-3">
                {stats.map((s) => (
                  <div key={s.label} className="card p-3.5 text-center">
                    <div className="text-2xl font-bold text-brand-600 dark:text-brand-400">{s.value}+</div>
                    <div className="text-[11px] font-medium text-ink-500 dark:text-ink-400 uppercase tracking-wider mt-0.5">{s.label}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Passport preview card */}
            <div>
              <PassportPreview />
            </div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div>
          <h2 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-ink-900">How the evidence pipeline works</h2>
          <p className="mt-2 text-sm text-ink-600 max-w-2xl">
            Every skill entry in the passport is anchored to inspectable proof artifacts. Matching calculations use only verified technical competencies and evidence strength.
          </p>
        </div>

        <div className="mt-8 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <FeatureCard
            icon={<FileBadge className="h-6 w-6 text-brand-600" />}
            title="1. Log Proof Artifacts"
            desc="Projects, coursework, credentials, and code repositories are verified with explicit strength scores."
          />
          <FeatureCard
            icon={<GraduationCap className="h-6 w-6 text-accent-600" />}
            title="2. Compile Skill Passport"
            desc="Skills are dynamically computed from verified artifacts with weighted proficiency levels."
          />
          <FeatureCard
            icon={<Brain className="h-6 w-6 text-amber-600" />}
            title="3. Deterministic Matching"
            desc="Explainable algorithms calculate match scores with clear matched, partial, and missing skill breakdowns."
          />
          <FeatureCard
            icon={<Target className="h-6 w-6 text-rose-600" />}
            title="4. Actionable Gap Analysis"
            desc="Pinpoint missing skills with concrete, prioritized growth recommendations to qualify for target roles."
          />
        </div>
      </section>

      {/* Fairness banner */}
      <section className="mx-auto max-w-7xl px-4 pb-16 sm:px-6 lg:px-8">
        <div className="rounded-3xl bg-ink-950 p-8 sm:p-10 text-white shadow-lift border border-ink-800">
          <div className="grid items-center gap-8 lg:grid-cols-2">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-accent-300">
                <Shield className="h-3.5 w-3.5" /> Fair by Design
              </div>
              <h2 className="mt-4 font-display text-2xl sm:text-3xl font-bold tracking-tight">Zero Demographic Bias. 100% Evidence.</h2>
              <p className="mt-3 text-ink-300 text-sm leading-relaxed">
                Candidate discovery and ranking algorithms evaluate exclusively verified evidence, demonstrated proficiency, and role requirements. Gender, institution prestige, demographic data, and all protected attributes are completely excluded from matching logic.
              </p>
              <button
                onClick={() => navigate('/fairness')}
                className="mt-5 inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-xs font-semibold text-ink-900 hover:bg-ink-100 transition shadow-card"
              >
                Inspect Fairness Policy <ArrowRight className="h-4 w-4" />
              </button>
            </div>
            <div className="grid grid-cols-2 gap-2.5">
              {[
                'Verified Skills & Proficiency',
                'Inspectable Code & Artifacts',
                'Coursework & Projects',
                'Competitions & Credentials',
                'Role-Specific Requirements',
                'Deterministic Evidence Weights',
              ].map((t) => (
                <div key={t} className="flex items-center gap-2 rounded-xl bg-white/5 border border-white/10 px-3.5 py-3 text-xs font-medium text-ink-200">
                  <CheckCircle2 className="h-4 w-4 text-accent-400 flex-shrink-0" />
                  <span>{t}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Roles */}
      <section className="mx-auto max-w-7xl px-4 pb-20 sm:px-6 lg:px-8">
        <h2 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-ink-900 mb-8">Role Perspectives</h2>
        <div className="grid gap-6 md:grid-cols-3">
          <RoleCard
            icon={<GraduationCap className="h-6 w-6 text-brand-600" />}
            title="Student"
            points={['Portable Skill Passport', 'Evidence and credential vault', 'Verified internship matching', 'Targeted skill gap roadmap']}
            onClick={() => navigate('/student/dashboard')}
          />
          <RoleCard
            icon={<Building2 className="h-6 w-6 text-accent-600" />}
            title="Organization"
            points={['Define required and preferred skills', 'Rank candidates by proof', 'Inspect explainable match criteria', 'Manage hiring pipeline']}
            onClick={() => navigate('/org/dashboard')}
          />
          <RoleCard
            icon={<Users className="h-6 w-6 text-amber-600" />}
            title="Team Creator"
            points={['Assemble multidisciplinary squads', 'Analyze complementary skill coverage', 'Identify team capability deficits', 'Slot verified candidates']}
            onClick={() => navigate('/team/matching')}
          />
        </div>
      </section>

      <footer className="border-t border-ink-200/80 bg-white">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-3 px-4 py-6 sm:flex-row sm:px-6 lg:px-8">
          <div className="flex items-center gap-2 text-xs text-ink-500 font-medium">
            <span className="font-bold text-ink-900">EvidentX</span> · Explainable Skills Matching Platform
          </div>
          <div className="flex items-center gap-4 text-xs text-ink-500">
            <span className="inline-flex items-center gap-1.5"><Layers className="h-3.5 w-3.5 text-brand-600" /> Deterministic matching</span>
            <span className="inline-flex items-center gap-1.5"><Shield className="h-3.5 w-3.5 text-accent-600" /> Fair by design</span>
            <span className="inline-flex items-center gap-1.5"><TrendingUp className="h-3.5 w-3.5 text-amber-600" /> Evidence-based</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

function FeatureCard({ icon, title, desc }: { icon: React.ReactNode; title: string; desc: string }) {
  return (
    <div className="card p-6">
      <div>{icon}</div>
      <h3 className="mt-4 font-display text-base font-bold text-ink-900">{title}</h3>
      <p className="mt-1.5 text-xs text-ink-600 leading-relaxed">{desc}</p>
    </div>
  );
}

function RoleCard({
  icon,
  title,
  points,
  onClick,
}: {
  icon: React.ReactNode;
  title: string;
  points: string[];
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="card p-6 text-left hover:border-brand-300 hover:shadow-lift transition-all group flex flex-col justify-between"
    >
      <div>
        <div className="mb-3">{icon}</div>
        <h3 className="font-display text-lg font-bold text-ink-900 group-hover:text-brand-600 transition">{title}</h3>
        <ul className="mt-3 space-y-2">
          {points.map((p) => (
            <li key={p} className="flex items-center gap-2 text-xs text-ink-600">
              <CheckCircle2 className="h-3.5 w-3.5 text-accent-600 flex-shrink-0" />
              <span>{p}</span>
            </li>
          ))}
        </ul>
      </div>
      <span className="mt-5 inline-flex items-center gap-1 text-xs font-semibold text-brand-600 group-hover:translate-x-0.5 transition-transform">
        Open Portal <ArrowRight className="h-3.5 w-3.5" />
      </span>
    </button>
  );
}

function PassportPreview() {
  return (
    <div className="card p-6 shadow-lift border-brand-200/80 bg-white">
      <div className="flex items-center gap-3 border-b border-ink-100 pb-4">
        <div className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-br from-brand-600 to-brand-800 text-white font-bold text-sm shadow-card select-none">
          RS
        </div>
        <div>
          <div className="font-display font-bold text-ink-900 text-sm">Rishav Singh</div>
          <div className="text-xs text-ink-500">B.Tech CSE · ITER SOA</div>
        </div>
        <div className="ml-auto inline-flex items-center gap-1 rounded-full border border-accent-200 bg-accent-50 px-2.5 py-0.5 text-xs font-semibold text-accent-800">
          <Shield className="h-3 w-3" /> Verified
        </div>
      </div>
      <div className="space-y-3 pt-4">
        {[
          { s: 'Problem Solving', v: 91, e: 'Data Structures Coursework' },
          { s: 'React', v: 86, e: 'Smart Campus Navigation Project' },
          { s: 'JavaScript', v: 82, e: 'Web Development Coursework' },
          { s: 'Node.js', v: 80, e: 'E-Commerce Backend Project' },
          { s: 'SQL', v: 48, e: 'Database Systems Coursework' },
        ].map((row) => (
          <div key={row.s}>
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-ink-800">{row.s}</span>
              <span className="font-bold text-ink-900">{row.v}%</span>
            </div>
            <div className="mt-1 h-1.5 rounded-full bg-ink-100 overflow-hidden">
              <div
                className={`h-full rounded-full ${
                  row.v >= 70 ? 'bg-accent-600' : row.v >= 40 ? 'bg-amber-500' : 'bg-rose-500'
                }`}
                style={{ width: `${row.v}%` }}
              />
            </div>
            <div className="mt-1 flex items-center gap-1 text-[10px] text-ink-400">
              <FileBadge className="h-3 w-3 text-ink-400" />
              <span>{row.e}</span>
            </div>
          </div>
        ))}
      </div>
      <div className="mt-4 flex items-center gap-2 rounded-xl bg-brand-50 border border-brand-200/80 p-3 text-xs text-brand-800 font-medium">
        <Brain className="h-4 w-4 text-brand-600 flex-shrink-0" />
        <span>87% match for Frontend Developer Intern: inspect verified proof breakdown</span>
      </div>
    </div>
  );
}
