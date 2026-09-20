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
  Share2,
  Printer,
  Copy,
  Check,
  X,
  FileCheck,
  Zap,
  FolderGit2,
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
import { teamMap, studentMap, skillMap, getStudentSkills } from '@/data/mockData';
import { useCustomTeams } from '@/lib/customTeams';
import { rankStudentsForTeam, teamComposition, autoAssembleOptimalSquad, type OptimalSquadResult } from '@/lib/matchingEngine';
import { useToast } from '@/lib/toast';

export function TeamBuilderPage({ teamId }: { teamId?: string }) {
  const { navigate } = useRouter();
  const { teams } = useCustomTeams();
  const { toast } = useToast();
  const [selectedTeamId, setSelectedTeamId] = useState(teamId ?? teams[0]?.id ?? 'team_ai_health');
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);
  const [showDossierModal, setShowDossierModal] = useState(false);
  const [lastOptimized, setLastOptimized] = useState<OptimalSquadResult | null>(null);

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

  const handleAutoAssemble = () => {
    if (!team) return;
    const result = autoAssembleOptimalSquad(team, 4);
    setSelectedStudentIds(result.squadStudentIds);
    setLastOptimized(result);
    toast.success(`✨ Auto-assembled ideal squad! ${result.coveragePercent}% skill coverage achieved.`);
  };

  const handleCopyDossierMarkdown = () => {
    if (!team) return;
    const coveredCount = team.requiredSkills.length - composition.missingSkills.length;
    const coveragePercent = Math.round((coveredCount / Math.max(1, team.requiredSkills.length)) * 100);
    const text = `# Team Credential Dossier: ${team.title}
**Organization:** ${team.organization}
**Generated Date:** ${new Date().toLocaleDateString()}
**Skill Coverage:** ${coveragePercent}% (${coveredCount}/${team.requiredSkills.length} skills covered)
**Squad Size:** ${selectedStudentIds.length} members

## Squad Roster
${selectedStudentIds
  .map((id) => {
    const s = studentMap[id];
    if (!s) return '';
    const sSkills = getStudentSkills(id);
    const fit = ranked.find((r) => r.studentId === id)?.overallScore ?? 85;
    return `### ${s.name} (${s.program}, ${s.university})
- Overall Fit: ${fit}%
- Key Skills: ${sSkills.map((sk) => skillMap[sk.skillId]?.name || sk.skillId).join(', ')}`;
  })
  .filter(Boolean)
  .join('\n\n')}

## Skill Matrix
${team.requiredSkills
  .map((skId) => {
    const sk = skillMap[skId];
    const cov = composition.coverage.find((c) => c.skillId === skId);
    const covNames =
      cov && cov.coveredBy.length > 0
        ? cov.coveredBy.map((sid) => studentMap[sid]?.name).filter(Boolean).join(', ')
        : 'MISSING (Uncovered)';
    return `- [${cov?.covered ? 'x' : ' '}] **${sk?.name || skId}**: ${covNames}`;
  })
  .join('\n')}

---
*EvidentX Verification Protocol • Zero-Knowledge Skill Attestation Engine*`;

    navigator.clipboard.writeText(text);
    toast.success('📋 Dossier Markdown copied to clipboard!');
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

        {/* Action toolbar */}
        <div className="mt-6 flex flex-wrap items-center gap-3 border-t border-white/20 pt-4">
          <button
            onClick={handleAutoAssemble}
            className="inline-flex items-center gap-2 rounded-xl bg-white text-ink-950 px-4 py-2 text-xs font-bold hover:bg-white/90 shadow-sm transition active:scale-95"
          >
            <Sparkles className="h-4 w-4 text-amber-600" />
            Auto-Assemble Ideal Squad
          </button>
          <button
            onClick={() => {
              if (selectedStudentIds.length === 0) {
                toast.info('Select candidates or click Auto-Assemble first.');
                return;
              }
              setShowDossierModal(true);
            }}
            className="inline-flex items-center gap-2 rounded-xl bg-white/20 hover:bg-white/30 text-white px-4 py-2 text-xs font-semibold backdrop-blur-sm transition active:scale-95"
          >
            <FileCheck className="h-4 w-4 text-amber-200" />
            Team Credential Dossier {selectedStudentIds.length > 0 && `(${selectedStudentIds.length})`}
          </button>
          <button
            onClick={() => navigate(`/team/workspace/${team.id}`)}
            className="inline-flex items-center gap-2 rounded-xl bg-white/20 hover:bg-white/30 text-white px-4 py-2 text-xs font-semibold backdrop-blur-sm transition active:scale-95"
            title="Open live collaborative milestone Kanban workspace for this squad"
          >
            <FolderGit2 className="h-4 w-4 text-white" />
            <span>Open Squad Workspace</span>
          </button>
          {selectedStudentIds.length > 0 && (
            <button
              onClick={() => setSelectedStudentIds([])}
              className="text-xs text-white/80 hover:text-white underline ml-auto"
            >
              Clear selection
            </button>
          )}
        </div>

        {lastOptimized && (
          <div className="mt-3 flex items-center gap-2 rounded-xl bg-black/20 px-3 py-2 text-xs text-amber-100 backdrop-blur-sm">
            <Zap className="h-3.5 w-3.5 text-amber-300 flex-shrink-0" />
            <span>
              Algorithmic squad optimization achieved <strong>{lastOptimized.coveragePercent}%</strong> skill coverage ({lastOptimized.coveredSkills.length}/{team.requiredSkills.length} skills satisfied across {lastOptimized.squadStudentIds.length} members).
            </span>
          </div>
        )}
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

          <Card className="p-5 bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/20 dark:to-orange-950/20 border-amber-100 dark:border-amber-900/30">
            <Shield className="h-5 w-5 text-amber-600 dark:text-amber-400" />
            <h3 className="mt-2 font-semibold text-ink-900 dark:text-white">Fair team building</h3>
            <p className="mt-1.5 text-sm text-ink-700 dark:text-ink-300">Selection is based on demonstrated skills and role fit only — never on protected attributes.</p>
            <button onClick={() => navigate('/fairness')} className="mt-2 text-xs font-semibold text-amber-700 dark:text-amber-400 hover:underline">
              Fairness policy <ArrowRight className="inline h-3 w-3" />
            </button>
          </Card>
        </div>
      </div>

      {/* Team Credential Dossier Modal */}
      {showDossierModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink-950/60 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="relative max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-2xl bg-white dark:bg-ink-900 shadow-2xl border border-ink-100 dark:border-ink-800 p-6 sm:p-8">
            <div className="flex items-start justify-between gap-4 border-b border-ink-100 dark:border-ink-800 pb-5">
              <div>
                <div className="flex items-center gap-2">
                  <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400">
                    <FileCheck className="h-4 w-4" />
                  </span>
                  <Chip color="amber"><span className="text-amber-700 dark:text-amber-300">Verified Dossier</span></Chip>
                </div>
                <h3 className="mt-2 text-xl font-display font-extrabold text-ink-950 dark:text-white">
                  Team Credential Dossier: {team.title}
                </h3>
                <p className="text-xs text-ink-500 dark:text-ink-400">
                  {team.organization} · Issued {new Date().toLocaleDateString()} · EvidentX Attested
                </p>
              </div>
              <button
                onClick={() => setShowDossierModal(false)}
                className="rounded-lg p-1.5 text-ink-400 hover:text-ink-700 dark:hover:text-ink-200 hover:bg-ink-50 dark:hover:bg-ink-800 transition"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Metrics summary */}
            <div className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="rounded-xl border border-ink-100 dark:border-ink-800 bg-ink-50/50 dark:bg-ink-800/40 p-3 text-center">
                <div className="text-2xl font-extrabold text-ink-900 dark:text-white">{selectedStudentIds.length}</div>
                <div className="text-[10px] font-semibold text-ink-500 dark:text-ink-400 uppercase tracking-wider">Squad Size</div>
              </div>
              <div className="rounded-xl border border-ink-100 dark:border-ink-800 bg-ink-50/50 dark:bg-ink-800/40 p-3 text-center">
                <div className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400">
                  {Math.round(((team.requiredSkills.length - composition.missingSkills.length) / Math.max(1, team.requiredSkills.length)) * 100)}%
                </div>
                <div className="text-[10px] font-semibold text-ink-500 dark:text-ink-400 uppercase tracking-wider">Skill Coverage</div>
              </div>
              <div className="rounded-xl border border-ink-100 dark:border-ink-800 bg-ink-50/50 dark:bg-ink-800/40 p-3 text-center">
                <div className="text-2xl font-extrabold text-ink-900 dark:text-white">
                  {team.requiredSkills.length - composition.missingSkills.length}/{team.requiredSkills.length}
                </div>
                <div className="text-[10px] font-semibold text-ink-500 dark:text-ink-400 uppercase tracking-wider">Skills Satisfied</div>
              </div>
              <div className="rounded-xl border border-ink-100 dark:border-ink-800 bg-ink-50/50 dark:bg-ink-800/40 p-3 text-center">
                <div className="text-2xl font-extrabold text-indigo-600 dark:text-indigo-400">
                  {composition.filledRoles.length}/{team.roles.length}
                </div>
                <div className="text-[10px] font-semibold text-ink-500 dark:text-ink-400 uppercase tracking-wider">Roles Staffed</div>
              </div>
            </div>

            {/* Squad Members */}
            <div className="mt-6">
              <h4 className="text-xs font-bold uppercase tracking-wider text-ink-500 dark:text-ink-400 mb-3">
                Squad Members ({selectedStudentIds.length})
              </h4>
              <div className="space-y-2.5">
                {selectedStudentIds.map((id) => {
                  const s = studentMap[id];
                  if (!s) return null;
                  const sSkills = getStudentSkills(id);
                  const fit = ranked.find((r) => r.studentId === id)?.overallScore ?? 85;
                  return (
                    <div key={id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl border border-ink-100 dark:border-ink-800 p-3 bg-white dark:bg-ink-900/60">
                      <div className="flex items-center gap-3">
                        <Avatar name={s.name} color={s.avatarColor} size="md" />
                        <div>
                          <div className="font-semibold text-ink-900 dark:text-white text-sm">{s.name}</div>
                          <div className="text-xs text-ink-500 dark:text-ink-400">{s.program} · {s.university}</div>
                        </div>
                      </div>
                      <div className="flex flex-wrap items-center gap-1.5">
                        {sSkills.slice(0, 3).map((sk) => (
                          <SkillBadge key={sk.skillId} name={skillMap[sk.skillId]?.name || sk.skillId} size="sm" />
                        ))}
                        {sSkills.length > 3 && (
                          <span className="text-[10px] text-ink-400 font-medium">+{sSkills.length - 3} more</span>
                        )}
                        <span className="ml-2 inline-flex items-center text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-md border border-emerald-200 dark:border-emerald-800/50">
                          {fit}% fit
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Squad Skill Coverage Matrix */}
            <div className="mt-6">
              <h4 className="text-xs font-bold uppercase tracking-wider text-ink-500 dark:text-ink-400 mb-3">
                Team Skill Matrix Coverage
              </h4>
              <div className="overflow-hidden rounded-xl border border-ink-100 dark:border-ink-800">
                <table className="w-full text-left text-xs">
                  <thead className="bg-ink-50 dark:bg-ink-800/50 text-ink-600 dark:text-ink-300 font-semibold border-b border-ink-100 dark:border-ink-800">
                    <tr>
                      <th className="px-3.5 py-2.5">Required Skill</th>
                      <th className="px-3.5 py-2.5">Category</th>
                      <th className="px-3.5 py-2.5">Status</th>
                      <th className="px-3.5 py-2.5">Covered By</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-ink-100 dark:divide-ink-800">
                    {team.requiredSkills.map((skId) => {
                      const sk = skillMap[skId];
                      const cov = composition.coverage.find((c) => c.skillId === skId);
                      const isCovered = cov?.covered ?? false;
                      const memberNames = (cov?.coveredBy ?? []).map((sid) => studentMap[sid]?.name).filter(Boolean);

                      return (
                        <tr key={skId} className="hover:bg-ink-50/50 dark:hover:bg-ink-800/30">
                          <td className="px-3.5 py-2.5 font-medium text-ink-900 dark:text-white">
                            {sk?.name || skId}
                          </td>
                          <td className="px-3.5 py-2.5 text-ink-500 dark:text-ink-400">
                            {sk?.category || 'Specialized'}
                          </td>
                          <td className="px-3.5 py-2.5">
                            {isCovered ? (
                              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                                <CheckCircle2 className="h-3.5 w-3.5" /> Covered
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-rose-600 dark:text-rose-400">
                                <XCircle className="h-3.5 w-3.5" /> Unmet Gap
                              </span>
                            )}
                          </td>
                          <td className="px-3.5 py-2.5 text-ink-600 dark:text-ink-300">
                            {memberNames.length > 0 ? memberNames.join(', ') : '—'}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="mt-6 flex flex-wrap items-center justify-end gap-3 border-t border-ink-100 dark:border-ink-800 pt-4">
              <button
                onClick={handleCopyDossierMarkdown}
                className="btn-secondary text-xs inline-flex items-center gap-1.5"
              >
                <Copy className="h-3.5 w-3.5" /> Copy Markdown Summary
              </button>
              <button
                onClick={() => window.print()}
                className="btn-primary text-xs inline-flex items-center gap-1.5"
              >
                <Printer className="h-3.5 w-3.5" /> Print / Save as PDF
              </button>
              <button
                onClick={() => setShowDossierModal(false)}
                className="rounded-xl border border-ink-200 dark:border-ink-700 px-4 py-2 text-xs font-semibold text-ink-600 dark:text-ink-300 hover:bg-ink-50 dark:hover:bg-ink-800 transition"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
