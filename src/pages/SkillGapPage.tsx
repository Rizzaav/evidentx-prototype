import { useState, useEffect } from 'react';
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
  Zap,
  RotateCcw,
  Sliders,
  Check,
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
import { skillGapAnalysis, rankOpportunitiesForStudent, simulateOpportunityMatch } from '@/lib/matchingEngine';
import { getAllOpportunities, opportunityMap, skillMap } from '@/data/mockData';
import { getLearningPathwayForSkill } from '@/data/learningRoadmaps';
import { useRouter } from '@/lib/router';
import { useToast } from '@/lib/toast';

export function SkillGapPage({ opportunityId }: { opportunityId?: string }) {
  const { studentId, student } = useDemoStudent();
  const { navigate } = useRouter();
  const { toast } = useToast();
  const opps = getAllOpportunities();
  const [selectedOpp, setSelectedOpp] = useState<string>(opportunityId ?? opps[0]?.id ?? 'op_fe_intern');
  const [simulatedSkills, setSimulatedSkills] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (opportunityId && opportunityId !== selectedOpp) {
      setSelectedOpp(opportunityId);
    }
  }, [opportunityId]);

  if (!student) return null;

  const opp = opportunityMap[selectedOpp] ?? opps[0];
  if (!opp) return null;

  const gap = skillGapAnalysis(studentId, opp);
  const ranked = rankOpportunitiesForStudent(studentId, opps);
  const simulated = simulateOpportunityMatch(studentId, opp, simulatedSkills);
  const isSimulating = simulatedSkills.size > 0;

  const toggleSimulatedSkill = (skillId: string, customName?: string) => {
    const next = new Set(simulatedSkills);
    const name = customName ?? skillMap[skillId]?.name ?? skillId;
    if (next.has(skillId)) {
      next.delete(skillId);
      toast.info(`Removed ${name} from simulation.`);
    } else {
      next.add(skillId);
      toast.success(`✨ Simulated acquiring ${name}! Projected match updated.`);
    }
    setSimulatedSkills(next);
  };

  const simulateAllMissing = () => {
    const next = new Set(simulatedSkills);
    gap.missing.forEach((m) => next.add(m.skillId));
    gap.partial.forEach((p) => next.add(p.skillId));
    setSimulatedSkills(next);
    toast.success(`Simulating complete skill coverage for ${opp.title}!`);
  };

  const resetSimulation = () => {
    setSimulatedSkills(new Set());
    toast.info('Simulation reset to your verified passport baseline.');
  };

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
                active
                  ? 'border-brand-300 dark:border-brand-700 bg-brand-50 dark:bg-brand-950/70 text-brand-700 dark:text-brand-300 shadow-2xs'
                  : 'border-ink-200 dark:border-[#30363d] bg-white dark:bg-[#161b22] text-ink-600 dark:text-[#c9d1d9] hover:bg-ink-50 dark:hover:bg-[#21262d]'
              }`}
            >
              <span className="truncate max-w-[160px]">{o.title}</span>
              <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold ${r.matchScore >= 75 ? 'bg-accent-100 dark:bg-accent-950 text-accent-700 dark:text-accent-300' : r.matchScore >= 50 ? 'bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300' : 'bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300'}`}>
                {r.matchScore}%
              </span>
            </button>
          );
        })}
      </div>

      {/* Interactive What-If Skill Simulator Control Center */}
      <div
        className={`mb-6 rounded-3xl border transition-all p-5 sm:p-6 ${
          isSimulating
            ? 'border-brand-400/80 dark:border-brand-500/70 bg-gradient-to-r from-brand-950/30 via-indigo-950/20 to-brand-950/40 shadow-soft'
            : 'border-ink-200 dark:border-[#30363d] bg-white dark:bg-[#161b22] shadow-2xs'
        }`}
      >
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="flex items-start sm:items-center gap-3.5">
            <div
              className={`h-11 w-11 rounded-2xl flex items-center justify-center shrink-0 shadow-2xs ${
                isSimulating
                  ? 'bg-brand-600 text-white animate-pulse'
                  : 'bg-brand-50 dark:bg-brand-950/70 text-brand-600 dark:text-brand-400'
              }`}
            >
              <Sparkles className="h-6 w-6" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="font-display font-bold text-base sm:text-lg text-ink-900 dark:text-white">
                  Interactive "What-If" Skill Simulator
                </h3>
                {isSimulating ? (
                  <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-emerald-500 text-white shadow-2xs flex items-center gap-1">
                    <span className="h-1.5 w-1.5 rounded-full bg-white animate-ping" />
                    {simulatedSkills.size} Skill{simulatedSkills.size > 1 ? 's' : ''} Simulated
                  </span>
                ) : (
                  <span className="text-[10px] font-semibold text-ink-500 dark:text-[#8b949e] bg-ink-100 dark:bg-[#21262d] px-2 py-0.5 rounded-full">
                    Forecast Learning ROI
                  </span>
                )}
              </div>
              <p className="text-xs text-ink-600 dark:text-[#8b949e] mt-0.5">
                Toggle missing skills or course completions below to calculate your projected match boost in real-time.
              </p>
            </div>
          </div>

          {/* Real-time score projection counter */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-3 rounded-2xl bg-ink-50 dark:bg-[#0d1117] border border-ink-200/80 dark:border-[#30363d] px-4 py-2">
              <div className="text-center">
                <div className="text-[10px] font-bold uppercase tracking-wider text-ink-400 dark:text-[#8b949e]">Baseline</div>
                <div className="text-sm sm:text-base font-extrabold text-ink-800 dark:text-[#c9d1d9]">
                  {simulated.baseScore}%
                </div>
              </div>
              <ArrowRight className="h-4 w-4 text-ink-400 dark:text-[#8b949e]" />
              <div className="text-center">
                <div className="text-[10px] font-bold uppercase tracking-wider text-brand-600 dark:text-brand-400">Projected</div>
                <div className="text-base sm:text-lg font-black text-brand-600 dark:text-brand-400">
                  {simulated.simulatedScore}%
                </div>
              </div>
              {simulated.delta > 0 && (
                <div className="ml-1 rounded-xl bg-emerald-500 text-white text-xs font-black px-2.5 py-1 shadow-2xs animate-bounce">
                  +{simulated.delta}%
                </div>
              )}
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={simulateAllMissing}
                className="btn-secondary text-xs py-2 px-3 inline-flex items-center gap-1.5 shadow-2xs hover:border-brand-400"
                title="Simulate acquiring all missing competencies for this target"
              >
                <Zap className="h-3.5 w-3.5 text-amber-500" />
                <span className="whitespace-nowrap">Simulate All Missing</span>
              </button>

              {isSimulating && (
                <button
                  onClick={resetSimulation}
                  className="btn-ghost text-xs py-2 px-2.5 inline-flex items-center gap-1 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30"
                  title="Reset simulation to baseline"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                  <span>Reset</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Target summary */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-ink-900 to-brand-950 p-5 sm:p-8 text-white">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="text-xs font-bold uppercase tracking-wide text-white/60">Comparing against</div>
            <div className="flex items-center gap-2 mt-1">
              <h2 className="font-display text-xl sm:text-2xl font-extrabold">{opp.title}</h2>
              {isSimulating && (
                <span className="rounded-full bg-brand-500/30 border border-brand-400/50 px-2.5 py-0.5 text-xs font-bold text-brand-200">
                  Forecast Active
                </span>
              )}
            </div>
            <div className="text-xs sm:text-sm text-white/70 mt-0.5">{opp.organization}</div>
          </div>
          <div className="grid grid-cols-3 gap-2 border-t border-white/10 pt-3 sm:border-t-0 sm:pt-0 sm:flex sm:gap-5">
            <GapStat
              label="Strong"
              value={simulated.strong.length}
              subtext={isSimulating && simulated.strong.length > gap.strong.length ? `+${simulated.strong.length - gap.strong.length} sim` : undefined}
              color="text-accent-400"
            />
            <GapStat
              label="Partial"
              value={simulated.partial.length}
              color="text-amber-400"
            />
            <GapStat
              label="Missing"
              value={simulated.missing.length}
              subtext={isSimulating && simulated.missing.length < gap.missing.length ? `-${gap.missing.length - simulated.missing.length} sim` : undefined}
              color="text-rose-400"
            />
          </div>
        </div>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        {/* Strong Matches */}
        <Card className="p-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-accent-600" />
              <h3 className="font-display text-lg font-bold text-ink-900 dark:text-white">Strong matches</h3>
            </div>
            <span className="text-xs font-bold text-accent-600 dark:text-accent-400 bg-accent-50 dark:bg-accent-950/60 px-2 py-0.5 rounded-full">
              {simulated.strong.length}
            </span>
          </div>
          <p className="mt-1 text-xs text-ink-500 dark:text-[#8b949e]">Proficiency ≥ 70%</p>
          <div className="mt-4 space-y-3">
            {simulated.strong.length === 0 ? (
              <p className="text-sm text-ink-400">None for this role.</p>
            ) : (
              simulated.strong.map((m) => (
                <div
                  key={m.skillId}
                  className={`p-2 rounded-xl transition ${
                    (m as any).isSimulated
                      ? 'border border-emerald-500/40 bg-emerald-50/50 dark:bg-emerald-950/30'
                      : ''
                  }`}
                >
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-1.5">
                      {(m as any).isSimulated && <Sparkles className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />}
                      <span className="font-semibold text-ink-800 dark:text-[#c9d1d9]">{skillMap[m.skillId]?.name}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      {(m as any).isSimulated ? (
                        <button
                          onClick={() => toggleSimulatedSkill(m.skillId)}
                          className="text-[10px] font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-900/60 px-1.5 py-0.5 rounded hover:bg-rose-100 hover:text-rose-700 transition"
                          title="Click to remove from simulation"
                        >
                          ✨ Simulated ✕
                        </button>
                      ) : (
                        <Chip color={m.required ? 'brand' : 'gray'}>{m.required ? 'Req' : 'Pref'}</Chip>
                      )}
                    </div>
                  </div>
                  <div className="mt-1">
                    <ProgressBar value={m.studentProficiency} height="h-1.5" />
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>

        {/* Partial Matches */}
        <Card className="p-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-amber-600" />
              <h3 className="font-display text-lg font-bold text-ink-900 dark:text-white">Partial matches</h3>
            </div>
            <span className="text-xs font-bold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/60 px-2 py-0.5 rounded-full">
              {simulated.partial.length}
            </span>
          </div>
          <p className="mt-1 text-xs text-ink-500 dark:text-[#8b949e]">40–69% — demonstrated but below threshold</p>
          <div className="mt-4 space-y-3">
            {simulated.partial.length === 0 ? (
              <p className="text-sm text-ink-400">None for this role.</p>
            ) : (
              simulated.partial.map((m) => (
                <div key={m.skillId} className="p-2 rounded-xl bg-ink-50/50 dark:bg-[#0d1117]/60 border border-ink-100 dark:border-[#30363d]">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-semibold text-ink-800 dark:text-[#c9d1d9]">{skillMap[m.skillId]?.name}</span>
                    <div className="flex items-center gap-1.5">
                      <Chip color={m.required ? 'brand' : 'gray'}>{m.required ? 'Req' : 'Pref'}</Chip>
                      <button
                        onClick={() => toggleSimulatedSkill(m.skillId)}
                        className="text-[10px] font-bold text-brand-600 dark:text-brand-400 hover:text-brand-700 bg-brand-50 dark:bg-brand-950/80 px-2 py-0.5 rounded-lg border border-brand-200 dark:border-brand-800 transition"
                      >
                        ⚡ Simulate
                      </button>
                    </div>
                  </div>
                  <div className="mt-1"><ProgressBar value={m.studentProficiency} height="h-1.5" /></div>
                </div>
              ))
            )}
          </div>
        </Card>

        {/* Missing Skills */}
        <Card className="p-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <XCircle className="h-5 w-5 text-rose-600" />
              <h3 className="font-display text-lg font-bold text-ink-900 dark:text-white">Missing skills</h3>
            </div>
            <span className="text-xs font-bold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/60 px-2 py-0.5 rounded-full">
              {simulated.missing.length}
            </span>
          </div>
          <p className="mt-1 text-xs text-ink-500 dark:text-[#8b949e]">&lt; 40% — no or weak evidence</p>
          <div className="mt-4 space-y-3">
            {simulated.missing.length === 0 ? (
              <p className="text-sm text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4" /> 100% coverage under current simulation!
              </p>
            ) : (
              simulated.missing.map((m) => (
                <div key={m.skillId} className="flex items-center justify-between text-sm p-2 rounded-xl bg-ink-50/50 dark:bg-[#0d1117]/60 border border-ink-100 dark:border-[#30363d]">
                  <span className="font-semibold text-ink-800 dark:text-[#c9d1d9]">{skillMap[m.skillId]?.name}</span>
                  <div className="flex items-center gap-1.5">
                    <Chip color={m.required ? 'rose' : 'gray'}>{m.required ? 'Req' : 'Pref'}</Chip>
                    <button
                      onClick={() => toggleSimulatedSkill(m.skillId)}
                      className="text-[10px] font-bold text-brand-600 dark:text-brand-400 hover:text-brand-700 bg-brand-50 dark:bg-brand-950/80 px-2 py-0.5 rounded-lg border border-brand-200 dark:border-brand-800 transition"
                    >
                      ⚡ Simulate
                    </button>
                  </div>
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
              const isSkillSimulated = simulatedSkills.has(r.skillId);

              return (
                <Card
                  key={r.skillId}
                  className={`p-5 flex flex-col justify-between border shadow-soft hover:shadow-card transition-all ${
                    isSkillSimulated
                      ? 'border-emerald-500/60 dark:border-emerald-500/70 bg-emerald-50/20 dark:bg-emerald-950/20'
                      : 'border-ink-200/90 dark:border-[#30363d]'
                  }`}
                >
                  <div className="space-y-4">
                    {/* Header */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-2.5">
                        <span
                          className={`inline-flex h-9 w-9 items-center justify-center rounded-xl shrink-0 ${
                            isSkillSimulated
                              ? 'bg-emerald-50 text-emerald-600 border border-emerald-300'
                              : r.status === 'missing'
                              ? 'bg-rose-50 text-rose-600 border border-rose-200'
                              : 'bg-amber-50 text-amber-600 border border-amber-200'
                          }`}
                        >
                          {isSkillSimulated ? (
                            <Check className="h-5 w-5" />
                          ) : r.status === 'missing' ? (
                            <XCircle className="h-5 w-5" />
                          ) : (
                            <AlertCircle className="h-5 w-5" />
                          )}
                        </span>
                        <div>
                          <div className="font-display font-bold text-ink-900 dark:text-white leading-snug">
                            {r.skillName}
                          </div>
                          <div className="flex flex-wrap items-center gap-1.5 mt-0.5">
                            <span
                              className={`text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded ${
                                isSkillSimulated
                                  ? 'bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300'
                                  : isHigh
                                  ? 'bg-rose-100 text-rose-800'
                                  : 'bg-amber-100 text-amber-800'
                              }`}
                            >
                              {isSkillSimulated ? '✨ In Simulation' : r.status === 'missing' ? 'Missing Competency' : 'Needs Reinforcement'}
                            </span>
                            <span className="text-[11px] text-ink-400">·</span>
                            <span className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 px-1.5 py-0.5 rounded border border-emerald-200 dark:border-emerald-800">
                              +{pathway.matchScoreBoostEstimate}% Match Boost
                            </span>
                          </div>
                        </div>
                      </div>
                      <SkillBadge name={r.skillName} />
                    </div>

                    {/* Diagnostic Summary */}
                    <p className="text-xs text-ink-600 dark:text-ink-300 leading-relaxed bg-ink-50/70 dark:bg-[#0d1117] p-2.5 rounded-xl border border-ink-100 dark:border-[#30363d]">
                      {pathway.diagnosticSummary}
                    </p>

                    {/* Curated Courses (Academia / Industry) */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-ink-500 dark:text-[#8b949e]">
                        <div className="flex items-center gap-1.5">
                          <GraduationCap className="h-3.5 w-3.5 text-brand-600 dark:text-brand-400" />
                          <span>Curated Academic & Industry Courses</span>
                        </div>
                        <button
                          onClick={() => toggleSimulatedSkill(r.skillId, r.skillName)}
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-lg border transition ${
                            isSkillSimulated
                              ? 'border-emerald-500 bg-emerald-500 text-white'
                              : 'border-brand-300 dark:border-brand-700 text-brand-700 dark:text-brand-300 hover:bg-brand-50 dark:hover:bg-brand-950/50'
                          }`}
                        >
                          {isSkillSimulated ? '✓ In Simulation' : '⚡ Simulate Learning'}
                        </button>
                      </div>
                      <div className="space-y-1.5">
                        {pathway.courses.map((course, idx) => (
                          <a
                            key={idx}
                            href={course.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="group flex items-center justify-between p-2.5 rounded-xl border border-ink-200/80 dark:border-[#30363d] bg-white dark:bg-[#161b22] hover:border-brand-300 dark:hover:border-brand-700 hover:bg-brand-50/30 dark:hover:bg-brand-950/40 transition-all text-xs"
                          >
                            <div className="min-w-0 pr-2">
                              <div className="font-semibold text-ink-900 dark:text-white group-hover:text-brand-700 dark:group-hover:text-brand-400 flex items-center gap-1.5">
                                <span className="truncate">{course.title}</span>
                                <ArrowUpRight className="h-3 w-3 shrink-0 text-ink-400 dark:text-[#8b949e] group-hover:text-brand-600" />
                              </div>
                              <div className="text-[10px] text-ink-500 dark:text-[#8b949e] mt-0.5 flex items-center gap-2">
                                <span className="font-medium text-ink-700 dark:text-[#c9d1d9]">{course.provider}</span>
                                <span>·</span>
                                <span>{course.duration}</span>
                              </div>
                            </div>
                            <span
                              className={`shrink-0 text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                                course.badge === 'IIT Certified'
                                  ? 'bg-indigo-50 dark:bg-indigo-950/70 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800'
                                  : course.badge === 'Govt Accredited'
                                  ? 'bg-purple-50 dark:bg-purple-950/70 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800'
                                  : course.badge === '100% Free'
                                  ? 'bg-emerald-50 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                                  : 'bg-brand-50 dark:bg-brand-950/70 text-brand-700 dark:text-brand-300 border border-brand-200 dark:border-brand-800'
                              }`}
                            >
                              {course.badge}
                            </span>
                          </a>
                        ))}
                      </div>
                    </div>

                    {/* Capstone Proof Project */}
                    <div className="p-3 bg-amber-50/60 dark:bg-amber-950/40 rounded-xl border border-amber-200/80 dark:border-amber-800/60 space-y-1.5">
                      <div className="flex items-center gap-1.5 text-[11px] font-bold text-amber-900 dark:text-amber-300">
                        <FolderGit2 className="h-3.5 w-3.5 text-amber-700 dark:text-amber-400" />
                        <span>Recommended Capstone Proof</span>
                      </div>
                      <div className="text-xs font-semibold text-ink-900 dark:text-white">
                        {pathway.capstoneProject.title}
                      </div>
                      <p className="text-[11px] text-ink-600 dark:text-ink-300 leading-relaxed">
                        {pathway.capstoneProject.description}
                      </p>
                      <div className="text-[10px] text-amber-800 dark:text-amber-300 font-mono pt-1">
                        📦 Deliverable: {pathway.capstoneProject.deliverable}
                      </div>
                    </div>
                  </div>

                  {/* Quick Action Buttons */}
                  <div className="mt-4 pt-3 border-t border-ink-100 dark:border-[#30363d] flex items-center gap-2">
                    <button
                      onClick={() => toggleSimulatedSkill(r.skillId, r.skillName)}
                      className={`flex-1 text-xs py-2 px-3 rounded-xl font-bold transition inline-flex items-center justify-center gap-1.5 ${
                        isSkillSimulated
                          ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-2xs'
                          : 'btn-primary'
                      }`}
                    >
                      <Zap className="h-3.5 w-3.5" />
                      <span>{isSkillSimulated ? '✓ Skill Simulated' : '⚡ Simulate Acquisition'}</span>
                    </button>
                    <button
                      onClick={() => navigate('/student/evidence')}
                      className="btn-secondary text-xs py-2 px-3 inline-flex items-center justify-center gap-1"
                      title="Upload actual evidence for this skill"
                    >
                      <span>Locker</span>
                      <ArrowRight className="h-3.5 w-3.5 text-ink-400 dark:text-[#8b949e]" />
                    </button>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </Section>

      {/* Visual: gap chart across all opportunities */}
      <Section title="Gap Overview & Simulated Score Across Opportunities">
        <Card className="p-6">
          <div className="space-y-4">
            {ranked.map((r) => {
              const o = opportunityMap[r.targetId];
              const roleSim = simulateOpportunityMatch(studentId, o, simulatedSkills);
              const g = roleSim;
              const hasBoost = roleSim.delta > 0;

              return (
                <button
                  key={o.id}
                  onClick={() => setSelectedOpp(o.id)}
                  className={`block w-full rounded-xl border p-4 text-left transition ${
                    o.id === selectedOpp
                      ? 'border-brand-400 dark:border-brand-600 bg-brand-50/60 dark:bg-brand-950/60 ring-2 ring-brand-500/20'
                      : 'border-ink-100 dark:border-[#30363d] hover:bg-ink-50 dark:hover:bg-[#21262d]'
                  }`}
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-ink-900 dark:text-white text-sm">{o.title}</span>
                      <span className="text-xs text-ink-500 dark:text-[#8b949e]">· {o.organization}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-ink-600 dark:text-[#8b949e]">
                        {r.matchScore}% baseline
                      </span>
                      {hasBoost && (
                        <span className="inline-flex items-center gap-1 text-xs font-extrabold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800">
                          ➔ {roleSim.simulatedScore}% (+{roleSim.delta}%)
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="mt-2 flex h-2.5 overflow-hidden rounded-full bg-ink-100 dark:bg-[#30363d]">
                    <div
                      className="bg-accent-500 transition-all duration-300"
                      style={{
                        width: `${(g.strong.length / (g.strong.length + g.partial.length + g.missing.length)) * 100}%`,
                      }}
                    />
                    <div
                      className="bg-amber-500 transition-all duration-300"
                      style={{
                        width: `${(g.partial.length / (g.strong.length + g.partial.length + g.missing.length)) * 100}%`,
                      }}
                    />
                    <div
                      className="bg-rose-500 transition-all duration-300"
                      style={{
                        width: `${(g.missing.length / (g.strong.length + g.partial.length + g.missing.length)) * 100}%`,
                      }}
                    />
                  </div>
                  <div className="mt-1.5 flex flex-wrap items-center gap-3 text-[11px] text-ink-500 dark:text-[#8b949e]">
                    <span className="inline-flex items-center gap-1">
                      <span className="h-2 w-2 rounded-full bg-accent-500" /> {g.strong.length} strong
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <span className="h-2 w-2 rounded-full bg-amber-500" /> {g.partial.length} partial
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <span className="h-2 w-2 rounded-full bg-rose-500" /> {g.missing.length} missing
                    </span>
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

function GapStat({
  label,
  value,
  subtext,
  color,
}: {
  label: string;
  value: number;
  subtext?: string;
  color: string;
}) {
  return (
    <div className="text-center">
      <div className={`text-2xl font-extrabold ${color}`}>{value}</div>
      <div className="text-[10px] font-semibold uppercase tracking-wide text-white/60">{label}</div>
      {subtext && (
        <div className="text-[9px] font-bold text-emerald-300 mt-0.5 bg-emerald-950/60 px-1 py-0.2 rounded border border-emerald-700/60">
          {subtext}
        </div>
      )}
    </div>
  );
}
