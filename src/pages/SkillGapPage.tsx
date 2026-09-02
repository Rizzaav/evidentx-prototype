import { useState } from 'react';
import { Target, CheckCircle2, AlertCircle, XCircle, Lightbulb, ArrowRight, TrendingUp } from 'lucide-react';
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
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-ink-900 to-brand-950 p-6 text-white sm:p-8">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="text-xs font-bold uppercase tracking-wide text-white/60">Comparing against</div>
            <h2 className="mt-1 font-display text-xl font-extrabold">{opp.title}</h2>
            <div className="text-sm text-white/70">{opp.organization}</div>
          </div>
          <div className="flex gap-4">
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

      {/* Development recommendations */}
      <Section title="Recommended Development Areas">
        {gap.recommendations.length === 0 ? (
          <EmptyState title="No gaps to close" description="You have strong coverage for this role." icon={<TrendingUp className="h-10 w-10" />} />
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {gap.recommendations.map((r) => (
              <Card key={r.skillId} className="p-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <span className={`inline-flex h-9 w-9 items-center justify-center rounded-lg ${r.status === 'missing' ? 'bg-rose-50 text-rose-600' : 'bg-amber-50 text-amber-600'}`}>
                      {r.status === 'missing' ? <XCircle className="h-5 w-5" /> : <AlertCircle className="h-5 w-5" />}
                    </span>
                    <div>
                      <div className="font-semibold text-ink-900">{r.skillName}</div>
                      <div className="text-xs text-ink-500 capitalize">{r.status} · {r.priority} priority</div>
                    </div>
                  </div>
                  <SkillBadge name={r.skillName} />
                </div>
                <div className="mt-3 flex items-start gap-2 rounded-lg bg-ink-50 p-3">
                  <Lightbulb className="h-4 w-4 flex-shrink-0 text-amber-500 mt-0.5" />
                  <p className="text-sm text-ink-700">{r.recommendation}</p>
                </div>
              </Card>
            ))}
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
