import { useState } from 'react';
import {
  Target,
  CheckCircle2,
  AlertCircle,
  XCircle,
  Lightbulb,
  ArrowRight,
  TrendingUp,
  BookOpen,
  ExternalLink,
  Sparkles,
  FolderGit2,
  GraduationCap,
  ArrowUpRight,
  Award,
} from 'lucide-react';
import {
  PageHeader,
  Card,
  Chip,
  SkillBadge,
  ProgressBar,
  Section,
  EmptyState,
  Avatar,
} from '@/components/ui';
import { useDemoStudent } from '@/lib/useDemoStudent';
import { skillGapAnalysis, rankOpportunitiesForStudent } from '@/lib/matchingEngine';
import { OPPORTUNITIES, opportunityMap, skillMap } from '@/data/mockData';
import { getLearningPathwayForSkill } from '@/data/learningRoadmaps';
import { useRouter } from '@/lib/router';

export function SkillGapPage({ opportunityId }: { opportunityId?: string }) {
  const { studentId, student } = useDemoStudent();
  const { navigate } = useRouter();
  const [selectedOpp, setSelectedOpp] = useState<string>(opportunityId ?? OPPORTUNITIES[0].id);
  if (!student) return null;

  const opp = opportunityMap[selectedOpp];
  const gap = skillGapAnalysis(studentId, opp);
  const ranked = rankOpportunitiesForStudent(studentId, OPPORTUNITIES);

  return (
    <div>
      <PageHeader
        title="Skill Gap Analysis"
        subtitle="See your strengths, gaps and growth plan"
      />

      {/* Opportunity selector */}
      <div className="mb-6 flex items-center gap-2 overflow-x-auto pb-2">
        <span className="text-xs font-bold uppercase tracking-wide text-ink-400 flex-shrink-0">Target:</span>
        {ranked.map((r) => {
          const o = opportunityMap[r.targetId];
          const active = o.id === selectedOpp;
          return (
            <button
              key={o.id}
              onClick={() => setSelectedOpp(o.id)}
              className={`flex items-center gap-2 rounded-xl border px-3 py-2 text-xs font-semibold transition flex-shrink-0 ${
                active ? 'border-brand-300 bg-brand-50 text-brand-700' : 'border-ink-200 bg-white text-ink-600 hover:bg-ink-50'
              }`}
            >
              <span className="truncate max-w-[160px]">{o.title}</span>
              <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold ${r.matchScore >= 75 ? 'bg-accent-100 text-accent-700' : r.matchScore >= 50 ? 'bg-amber-100 text-amber-700' : 'bg-rose-100 text-rose-700'}`}>
                {r.matchScore}%
              </span>
            </button>
          );
        })}
      </div>

      {/* Target summary */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-ink-900 to-brand-950 p-5 sm:p-8 text-white">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="text-xs font-bold uppercase tracking-wide text-white/60">Comparing against</div>
            <h2 className="mt-1 font-display text-xl sm:text-2xl font-extrabold">{opp.title}</h2>
            <div className="text-xs sm:text-sm text-white/70">{opp.organization}</div>
          </div>
          <div className="grid grid-cols-3 gap-2 border-t border-white/10 pt-3 sm:border-t-0 sm:pt-0 sm:flex sm:gap-5">
            <GapStat label="Strong" value={gap.strong.length} color="text-accent-400" />
            <GapStat label="Partial" value={gap.partial.length} color="text-amber-400" />
            <GapStat label="Missing" value={gap.missing.length} color="text-rose-400" />
          </div>
        </div>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        {/* Strong */}
        <Card className="p-5">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-accent-600" />
            <h3 className="font-display text-lg font-bold text-ink-900">Strong matches</h3>
          </div>
          <p className="mt-1 text-xs text-ink-500">Proficiency ≥ 70%</p>
          <div className="mt-4 space-y-3">
            {gap.strong.length === 0 ? (
              <p className="text-sm text-ink-400">None for this role.</p>
            ) : (
              gap.strong.map((m) => (
                <div key={m.skillId}>
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-semibold text-ink-800">{skillMap[m.skillId]?.name}</span>
                    <Chip color={m.required ? 'brand' : 'gray'}>{m.required ? 'Req' : 'Pref'}</Chip>
                  </div>
                  <div className="mt-1"><ProgressBar value={m.studentProficiency} height="h-1.5" /></div>
                </div>
              ))
            )}
          </div>
        </Card>

        {/* Partial */}
        <Card className="p-5">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-amber-600" />
            <h3 className="font-display text-lg font-bold text-ink-900">Partial matches</h3>
          </div>
          <p className="mt-1 text-xs text-ink-500">40–69% — demonstrated but below threshold</p>
          <div className="mt-4 space-y-3">
            {gap.partial.length === 0 ? (
              <p className="text-sm text-ink-400">None for this role.</p>
            ) : (
              gap.partial.map((m) => (
                <div key={m.skillId}>
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-semibold text-ink-800">{skillMap[m.skillId]?.name}</span>
                    <Chip color={m.required ? 'brand' : 'gray'}>{m.required ? 'Req' : 'Pref'}</Chip>
                  </div>
                  <div className="mt-1"><ProgressBar value={m.studentProficiency} height="h-1.5" /></div>
                </div>
              ))
            )}
          </div>
        </Card>

        {/* Missing */}
        <Card className="p-5">
          <div className="flex items-center gap-2">
            <XCircle className="h-5 w-5 text-rose-600" />
            <h3 className="font-display text-lg font-bold text-ink-900">Missing skills</h3>
          </div>
          <p className="mt-1 text-xs text-ink-500">&lt; 40% — no or weak evidence</p>
          <div className="mt-4 space-y-3">
            {gap.missing.length === 0 ? (
              <p className="text-sm text-ink-400">None — you cover all required skills.</p>
            ) : (
              gap.missing.map((m) => (
                <div key={m.skillId} className="flex items-center justify-between text-sm">
                  <span className="font-semibold text-ink-800">{skillMap[m.skillId]?.name}</span>
                  <Chip color={m.required ? 'rose' : 'gray'}>{m.required ? 'Req' : 'Pref'}</Chip>
                </div>
              ))
            )}
          </div>
        </Card>
      </div>

      {/* Development recommendations with Curated Courses & Capstone Actions */}
      <Section title="Targeted Skill Bridging & Curated Coursework (Academia & Industry)">
        {gap.recommendations.length === 0 ? (
          <EmptyState
            title="No gaps to close"
            description="You have strong coverage for this role."
            icon={<TrendingUp className="h-10 w-10" />}
          />
        ) : (
          <div className="grid gap-5 md:grid-cols-2">
            {gap.recommendations.map((r) => {
              const pathway = getLearningPathwayForSkill(r.skillId, r.skillName);
              const isHigh = r.priority === 'high';

              return (
                <Card
                  key={r.skillId}
                  className="p-5 flex flex-col justify-between border border-ink-200/90 shadow-soft hover:shadow-card transition-all"
                >
                  <div className="space-y-4">
                    {/* Header */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-2.5">
                        <span
                          className={`inline-flex h-9 w-9 items-center justify-center rounded-xl shrink-0 ${
                            r.status === 'missing'
                              ? 'bg-rose-50 text-rose-600 border border-rose-200'
                              : 'bg-amber-50 text-amber-600 border border-amber-200'
                          }`}
                        >
                          {r.status === 'missing' ? (
                            <XCircle className="h-5 w-5" />
                          ) : (
                            <AlertCircle className="h-5 w-5" />
                          )}
                        </span>
                        <div>
                          <div className="font-display font-bold text-ink-900 leading-snug">
                            {r.skillName}
                          </div>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <span
                              className={`text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded ${
                                isHigh
                                  ? 'bg-rose-100 text-rose-800'
                                  : 'bg-amber-100 text-amber-800'
                              }`}
                            >
                              {r.status === 'missing' ? 'Missing Competency' : 'Needs Reinforcement'}
                            </span>
                            <span className="text-[11px] text-ink-400">·</span>
                            <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                              +{pathway.matchScoreBoostEstimate}% Match Boost
                            </span>
                          </div>
                        </div>
                      </div>
                      <SkillBadge name={r.skillName} />
                    </div>

                    {/* Diagnostic Summary */}
                    <p className="text-xs text-ink-600 leading-relaxed bg-ink-50/70 p-2.5 rounded-xl border border-ink-100">
                      {pathway.diagnosticSummary}
                    </p>

                    {/* Curated Courses (Academia / Industry) */}
                    <div className="space-y-2">
                      <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-ink-500">
                        <GraduationCap className="h-3.5 w-3.5 text-brand-600" />
                        <span>Curated Academic & Industry Courses</span>
                      </div>
                      <div className="space-y-1.5">
                        {pathway.courses.map((course, idx) => (
                          <a
                            key={idx}
                            href={course.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="group flex items-center justify-between p-2.5 rounded-xl border border-ink-200/80 bg-white hover:border-brand-300 hover:bg-brand-50/30 transition-all text-xs"
                          >
                            <div className="min-w-0 pr-2">
                              <div className="font-semibold text-ink-900 group-hover:text-brand-700 flex items-center gap-1.5">
                                <span className="truncate">{course.title}</span>
                                <ArrowUpRight className="h-3 w-3 shrink-0 text-ink-400 group-hover:text-brand-600" />
                              </div>
                              <div className="text-[10px] text-ink-500 mt-0.5 flex items-center gap-2">
                                <span className="font-medium text-ink-700">{course.provider}</span>
                                <span>·</span>
                                <span>{course.duration}</span>
                              </div>
                            </div>
                            <span
                              className={`shrink-0 text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                                course.badge === 'IIT Certified'
                                  ? 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                                  : course.badge === 'Govt Accredited'
                                  ? 'bg-purple-50 text-purple-700 border border-purple-200'
                                  : course.badge === '100% Free'
                                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                  : 'bg-brand-50 text-brand-700 border border-brand-200'
                              }`}
                            >
                              {course.badge}
                            </span>
                          </a>
                        ))}
                      </div>
                    </div>

                    {/* Capstone Proof Project */}
                    <div className="p-3 bg-amber-50/60 rounded-xl border border-amber-200/80 space-y-1.5">
                      <div className="flex items-center gap-1.5 text-[11px] font-bold text-amber-900">
                        <FolderGit2 className="h-3.5 w-3.5 text-amber-700" />
                        <span>Recommended Capstone Proof</span>
                      </div>
                      <div className="text-xs font-semibold text-ink-900">
                        {pathway.capstoneProject.title}
                      </div>
                      <p className="text-[11px] text-ink-600 leading-relaxed">
                        {pathway.capstoneProject.description}
                      </p>
                      <div className="text-[10px] text-amber-800 font-mono pt-1">
                        📦 Deliverable: {pathway.capstoneProject.deliverable}
                      </div>
                    </div>
                  </div>

                  {/* Quick Action Button */}
                  <div className="mt-4 pt-3 border-t border-ink-100">
                    <button
                      onClick={() => navigate('/student/evidence')}
                      className="w-full btn-secondary text-xs py-2 inline-flex items-center justify-center gap-1.5 group"
                    >
                      <Sparkles className="h-3.5 w-3.5 text-brand-600" />
                      <span>Upload Course Proof or Scan GitHub Repo</span>
                      <ArrowRight className="h-3.5 w-3.5 text-ink-400 group-hover:translate-x-0.5 transition-transform" />
                    </button>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </Section>

      {/* Visual: gap chart across all opportunities */}
      <Section title="Gap overview across opportunities">
        <Card className="p-6">
          <div className="space-y-4">
            {ranked.map((r) => {
              const o = opportunityMap[r.targetId];
              const g = skillGapAnalysis(studentId, o);
              return (
                <button
                  key={o.id}
                  onClick={() => setSelectedOpp(o.id)}
                  className={`block w-full rounded-xl border p-4 text-left transition ${o.id === selectedOpp ? 'border-brand-300 bg-brand-50' : 'border-ink-100 hover:bg-ink-50'}`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-ink-900 text-sm">{o.title}</span>
                    <span className="text-xs font-bold text-ink-700">{r.matchScore}% match</span>
                  </div>
                  <div className="mt-2 flex h-2 overflow-hidden rounded-full bg-ink-100">
                    <div className="bg-accent-500" style={{ width: `${(g.strong.length / (g.strong.length + g.partial.length + g.missing.length)) * 100}%` }} />
                    <div className="bg-amber-500" style={{ width: `${(g.partial.length / (g.strong.length + g.partial.length + g.missing.length)) * 100}%` }} />
                    <div className="bg-rose-500" style={{ width: `${(g.missing.length / (g.strong.length + g.partial.length + g.missing.length)) * 100}%` }} />
                  </div>
                  <div className="mt-1.5 flex items-center gap-3 text-[11px] text-ink-500">
                    <span className="inline-flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-accent-500" /> {g.strong.length} strong</span>
                    <span className="inline-flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-amber-500" /> {g.partial.length} partial</span>
                    <span className="inline-flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-rose-500" /> {g.missing.length} missing</span>
                  </div>
                </button>
              );
            })}
          </div>
        </Card>
      </Section>
    </div>
  );
}

function GapStat({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="text-center">
      <div className={`text-2xl font-extrabold ${color}`}>{value}</div>
      <div className="text-[10px] font-semibold uppercase tracking-wide text-white/60">{label}</div>
    </div>
  );
}
