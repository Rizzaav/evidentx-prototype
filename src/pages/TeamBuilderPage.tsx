import { useState, useMemo } from 'react';
import {
  Users,
  ArrowRight,
  Crown,
  CheckCircle2,
  XCircle,
  Shield,
  Target,
  Plus,
  Minus,
  Layers,
  Sparkles,
} from 'lucide-react';
import { useRouter } from '@/lib/router';
import {
  PageHeader,
  Card,
  Chip,
  SkillBadge,
  Avatar,
  ProgressBar,
  Section,
  MatchRing,
} from '@/components/ui';
import { teamMap, studentMap, skillMap } from '@/data/mockData';
import { useCustomTeams } from '@/lib/customTeams';
import { rankStudentsForTeam, teamComposition } from '@/lib/matchingEngine';

export function TeamBuilderPage({ teamId }: { teamId?: string }) {
  const { navigate } = useRouter();
  const { teams } = useCustomTeams();
  const [selectedTeamId, setSelectedTeamId] = useState(teamId ?? teams[0]?.id ?? 'team_ai_health');
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);

  const team = teamMap[selectedTeamId] ?? teams.find((t) => t.id === selectedTeamId) ?? teams[0];
  const ranked = useMemo(() => (team ? rankStudentsForTeam(team) : []), [team]);
  const composition = useMemo(
    () =>
      team
        ? teamComposition(team, selectedStudentIds)
        : { candidates: [], filledRoles: [], missingSkills: [], coverage: [] },
    [team, selectedStudentIds]
  );

  const toggleStudent = (id: string) => {
    setSelectedStudentIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  return (
    <div>
      <PageHeader
        title="Team Builder"
        subtitle="Build a multidisciplinary team and see skill coverage"
        right={
          <button onClick={() => navigate('/team/create')} className="btn-primary text-xs">
            + New Team Requirement
          </button>
        }
      />

      {/* Team selector */}
      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        {teams.map((t) => {
          const active = t.id === selectedTeamId;
          return (
            <button
              key={t.id}
              onClick={() => { setSelectedTeamId(t.id); setSelectedStudentIds([]); }}
              className={`card p-4 text-left transition ${active ? 'border-amber-300 ring-2 ring-amber-200' : 'hover:shadow-lift'}`}
            >
              <div className="flex items-center gap-2">
                <span className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-amber-50 text-amber-600">

                  <Users className="h-4 w-4" />
                </span>
                <div className="min-w-0">
                  <div className="font-semibold text-ink-900 text-sm leading-tight truncate">{t.title}</div>
                  <div className="text-xs text-ink-500">{t.roles.length} roles · {t.requiredSkills.length} skills</div>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Team header */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-amber-500 to-orange-600 p-6 text-white sm:p-8">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <Chip color="amber"><span className="text-amber-700">Multidisciplinary Team</span></Chip>
            <h2 className="mt-2 font-display text-xl font-extrabold">{team.title}</h2>
            <div className="text-sm text-white/80">{team.organization}</div>
            <p className="mt-2 max-w-2xl text-sm text-white/90">{team.description}</p>
          </div>
          <div className="flex flex-shrink-0 gap-3">
            <div className="rounded-xl bg-white/15 p-3 text-center">
              <div className="text-2xl font-extrabold">{selectedStudentIds.length}</div>
              <div className="text-[10px] font-semibold uppercase text-white/60">Selected</div>
            </div>
            <div className="rounded-xl bg-white/15 p-3 text-center">
              <div className="text-2xl font-extrabold">{team.roles.length}</div>
              <div className="text-[10px] font-semibold uppercase text-white/60">Roles</div>
            </div>
            <div className="rounded-xl bg-white/15 p-3 text-center">
              <div className="text-2xl font-extrabold">{composition.missingSkills.length}</div>
              <div className="text-[10px] font-semibold uppercase text-white/60">Missing</div>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        {/* Candidates */}
        <div className="lg:col-span-2">
          <Section title="Candidate recommendations" action={<span className="text-xs text-ink-400">Click to add to team</span>}>
            <div className="space-y-3">
              {ranked.map((c, i) => {
                const student = studentMap[c.studentId];
                const selected = selectedStudentIds.includes(c.studentId);
                return (
                  <Card key={c.studentId} className={`p-4 transition ${selected ? 'border-amber-300 ring-2 ring-amber-200' : ''}`}>
                    <div className="flex items-center gap-4">
                      <span className={`inline-flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full text-xs font-bold ${i === 0 ? 'bg-amber-100 text-amber-700' : 'bg-ink-100 text-ink-600'}`}>{i + 1}</span>
                      <Avatar name={student.name} color={student.avatarColor} size="md" />
                      <div className="min-w-0 flex-1">
                        <div className="font-semibold text-ink-900 truncate">{student.name}</div>
                        <div className="text-xs text-ink-500 truncate">{student.program} · {student.university}</div>
                        <div className="mt-1.5 flex flex-wrap gap-1">
                          {c.rolesFit.sort((a, b) => b.fitScore - a.fitScore).slice(0, 2).map((r) => (
                            <Chip key={r.roleId} color={r.fitScore >= 70 ? 'emerald' : r.fitScore >= 40 ? 'amber' : 'gray'}>{r.roleName} {r.fitScore}%</Chip>
                          ))}
                        </div>
                      </div>
                      <div className="flex flex-shrink-0 items-center gap-3">
                        <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${c.overallScore >= 75 ? 'bg-accent-500' : c.overallScore >= 50 ? 'bg-amber-500' : 'bg-rose-500'} text-white font-extrabold`}>
                          {c.overallScore}%
                        </div>
                        <button
                          onClick={() => toggleStudent(c.studentId)}
                          className={`btn ${selected ? 'bg-rose-50 text-rose-600 hover:bg-rose-100' : 'bg-amber-50 text-amber-700 hover:bg-amber-100'} px-2.5 py-2`}
                        >
                          {selected ? <><Minus className="h-4 w-4" /> Remove</> : <><Plus className="h-4 w-4" /> Add</>}
                        </button>
                      </div>
                    </div>
                    {selected && (
                      <div className="mt-3 border-t border-ink-100 pt-3 animate-fade-in">
                        <p className="text-xs text-ink-600">{c.explanation}</p>
                        <div className="mt-2 flex flex-wrap gap-1">
                          <span className="text-[11px] font-bold uppercase text-ink-400">Contributes:</span>
                          {c.contributedSkills.map((id) => <SkillBadge key={id} name={skillMap[id]?.name ?? id} size="sm" />)}
                        </div>
                      </div>
                    )}
                  </Card>
                );
              })}
            </div>
          </Section>
        </div>

        {/* Side: team composition */}
        <div className="space-y-6">
          <Card className="p-5 sticky top-6">
            <div className="flex items-center gap-2">
              <Layers className="h-5 w-5 text-amber-600" />
              <h3 className="font-semibold text-ink-900">Team composition</h3>
            </div>

            {/* Selected members */}
            <div className="mt-3">
              <div className="text-[11px] font-bold uppercase text-ink-400">Selected members ({selectedStudentIds.length})</div>
              <div className="mt-2 space-y-2">
                {selectedStudentIds.length === 0 ? (
                  <p className="text-sm text-ink-400">No members selected. Add candidates from the left.</p>
                ) : (
                  selectedStudentIds.map((id) => {
                    const s = studentMap[id];
                    const c = composition.candidates.find((x) => x.studentId === id)!;
                    const bestRole = c.rolesFit.sort((a, b) => b.fitScore - a.fitScore)[0];
                    return (
                      <div key={id} className="flex items-center gap-2 rounded-lg border border-ink-100 p-2">
                        <Avatar name={s.name} color={s.avatarColor} size="sm" />
                        <div className="min-w-0 flex-1">
                          <div className="text-sm font-semibold text-ink-900 truncate">{s.name}</div>
                          <div className="text-[11px] text-ink-500 truncate">{bestRole.roleName}</div>
                        </div>
                        <button onClick={() => toggleStudent(id)} className="text-rose-400 hover:text-rose-600"><Minus className="h-4 w-4" /></button>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Role coverage */}
            <div className="mt-4">
              <div className="text-[11px] font-bold uppercase text-ink-400">Role coverage</div>
              <div className="mt-2 space-y-1.5">
                {team.roles.map((role) => {
                  const filled = composition.filledRoles.includes(role.id);
                  return (
                    <div key={role.id} className="flex items-center gap-2 text-sm">
                      {filled ? <CheckCircle2 className="h-4 w-4 text-accent-600" /> : <XCircle className="h-4 w-4 text-rose-400" />}
                      <span className={filled ? 'text-ink-800' : 'text-ink-400'}>{role.name}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Skill coverage */}
            <div className="mt-4">
              <div className="text-[11px] font-bold uppercase text-ink-400">Skill coverage ({composition.coverage.filter((c) => c.covered).length}/{team.requiredSkills.length})</div>
              <div className="mt-2 space-y-1.5">
                {composition.coverage.map((c) => (
                  <div key={c.skillId} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      {c.covered ? <CheckCircle2 className="h-3.5 w-3.5 text-accent-600" /> : <XCircle className="h-3.5 w-3.5 text-rose-400" />}
                      <span className={c.covered ? 'text-ink-800' : 'text-rose-600 font-semibold'}>{skillMap[c.skillId]?.name}</span>
                    </div>
                    <span className="text-[11px] text-ink-400">{c.coveredBy.length} {c.coveredBy.length === 1 ? 'person' : 'people'}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Missing skills */}
            {composition.missingSkills.length > 0 ? (
              <div className="mt-4 rounded-lg bg-rose-50 p-3">
                <div className="flex items-center gap-2">
                  <Target className="h-4 w-4 text-rose-600" />
                  <span className="text-sm font-semibold text-rose-700">Missing team skills</span>
                </div>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {composition.missingSkills.map((id) => <SkillBadge key={id} name={skillMap[id]?.name ?? id} size="sm" />)}
                </div>
              </div>
            ) : selectedStudentIds.length > 0 ? (
              <div className="mt-4 rounded-lg bg-accent-50 p-3">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-accent-600" />
                  <span className="text-sm font-semibold text-accent-700">All required skills covered!</span>
                </div>
              </div>
            ) : null}
          </Card>

          <Card className="p-5 bg-gradient-to-br from-amber-50 to-orange-50 border-amber-100">
            <Shield className="h-5 w-5 text-amber-600" />
            <h3 className="mt-2 font-semibold text-ink-900">Fair team building</h3>
            <p className="mt-1.5 text-sm text-ink-700">Selection is based on demonstrated skills and role fit only — never on protected attributes.</p>
            <button onClick={() => navigate('/fairness')} className="mt-2 text-xs font-semibold text-amber-700 hover:underline">
              Fairness policy <ArrowRight className="inline h-3 w-3" />
            </button>
          </Card>
        </div>
      </div>
    </div>
  );
}
