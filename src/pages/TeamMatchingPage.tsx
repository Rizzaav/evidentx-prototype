import { Users, ArrowRight, CheckCircle2, AlertCircle, Target, Crown } from 'lucide-react';
import {
  PageHeader,
  Card,
  Chip,
  SkillBadge,
  ProgressBar,
  Section,
  Avatar,
  MatchRing,
} from '@/components/ui';
import { useDemoStudent } from '@/lib/useDemoStudent';
import { matchStudentToTeam } from '@/lib/matchingEngine';
import { skillMap, studentMap, teamMap } from '@/data/mockData';
import { useCustomTeams } from '@/lib/customTeams';
import { useRouter } from '@/lib/router';
import { useState } from 'react';

export function TeamMatchingPage() {
  const { studentId, student } = useDemoStudent();
  const { navigate } = useRouter();
  const { teams } = useCustomTeams();
  const [selectedTeam, setSelectedTeam] = useState(teams[0]?.id ?? 'team_ai_health');
  if (!student) return null;

  const team = teamMap[selectedTeam] ?? teams[0];
  const match = team ? matchStudentToTeam(studentId, team) : null;

  if (!match || !team) {
    return (
      <div>
        <PageHeader title="Team Matching" subtitle="Find multidisciplinary teams that need your skills" />
        <Card className="p-6">No teams available.</Card>
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="Team Matching"
        subtitle="Find multidisciplinary teams that need your skills"
      />

      {/* Team selector */}
      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        {teams.map((t) => {
          const m = matchStudentToTeam(studentId, t);
          const active = t.id === selectedTeam;
          return (
            <button
              key={t.id}
              onClick={() => setSelectedTeam(t.id)}
              className={`card p-4 text-left transition ${active ? 'border-brand-300 ring-2 ring-brand-200' : 'hover:shadow-lift'}`}
            >
              <div className="flex items-center justify-between">
                <span className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-brand-50 text-brand-600">
                  <Users className="h-4 w-4" />
                </span>
                <span className={`text-sm font-extrabold ${m.overallScore >= 75 ? 'text-accent-600' : m.overallScore >= 50 ? 'text-amber-600' : 'text-rose-600'}`}>
                  {m.overallScore}%
                </span>
              </div>
              <div className="mt-2 font-semibold text-ink-900 text-sm leading-tight">{t.title}</div>
              <div className="text-xs text-ink-500">{t.organization} · {t.roles.length} roles</div>
            </button>
          );
        })}
      </div>


      {/* Team header */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-amber-500 to-orange-600 p-6 text-white sm:p-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <Chip color="amber"><span className="text-amber-700">Multidisciplinary Team</span></Chip>
            <h1 className="mt-2 font-display text-2xl font-extrabold">{team.title}</h1>
            <div className="text-sm text-white/80">{team.organization}</div>
            <p className="mt-2 max-w-2xl text-sm text-white/90">{team.description}</p>
          </div>
          <div className="flex items-center gap-3 rounded-2xl bg-white/15 p-4">
            <MatchRing score={match.overallScore} size={110} label="Team fit" />
            <div>
              <div className="text-xs font-bold uppercase tracking-wide text-white/60">Your fit</div>
              <div className="mt-1 flex items-center gap-2">
                <Avatar name={student.name} color={student.avatarColor} size="sm" />
                <span className="text-sm font-semibold">{student.name.split(' ')[0]}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        {/* Role fit breakdown */}
        <div className="lg:col-span-2">
          <Card className="p-6">
            <h3 className="font-display text-lg font-bold text-ink-900">Role-by-role fit</h3>
            <p className="text-xs text-ink-500 mt-0.5">How well your verified skills match each team role</p>
            <div className="mt-4 space-y-3">
              {match.rolesFit.sort((a, b) => b.fitScore - a.fitScore).map((r) => {
                const role = team.roles.find((rr) => rr.id === r.roleId)!;
                const isBest = r.roleId === match.rolesFit.sort((a, b) => b.fitScore - a.fitScore)[0].roleId;
                return (
                  <div key={r.roleId} className={`rounded-xl border p-4 ${isBest && r.fitScore >= 60 ? 'border-accent-200 bg-accent-50/50' : 'border-ink-100'}`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {isBest && r.fitScore >= 60 && <Crown className="h-4 w-4 text-amber-500" />}
                        <span className="font-semibold text-ink-900">{r.roleName}</span>
                      </div>
                      <span className={`text-sm font-extrabold ${r.fitScore >= 70 ? 'text-accent-600' : r.fitScore >= 40 ? 'text-amber-600' : 'text-rose-600'}`}>
                        {r.fitScore}%
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-ink-500">{role.description}</p>
                    <div className="mt-2"><ProgressBar value={r.fitScore} height="h-1.5" /></div>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {r.matchedSkills.map((m) => (
                        <span key={m.skillId} className={`chip ${m.status === 'matched' ? 'bg-accent-50 text-accent-700' : m.status === 'partial' ? 'bg-amber-50 text-amber-700' : 'bg-rose-50 text-rose-700'}`}>
                          {skillMap[m.skillId]?.name} {m.studentProficiency > 0 && `· ${m.studentProficiency}%`}
                        </span>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>
        </div>

        {/* Side */}
        <div className="space-y-6">
          <Card className="p-5 bg-gradient-to-br from-amber-50 to-orange-50 border-amber-100">
            <Target className="h-5 w-5 text-amber-600" />
            <h3 className="mt-2 font-semibold text-ink-900">Why this team?</h3>
            <p className="mt-1.5 text-sm text-ink-700">{match.explanation}</p>
          </Card>

          <Card className="p-5">
            <h3 className="font-semibold text-ink-900">Skills you'd contribute</h3>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {match.contributedSkills.length === 0 ? (
                <p className="text-sm text-ink-400">No team-required skills yet.</p>
              ) : (
                match.contributedSkills.map((skId) => (
                  <SkillBadge key={skId} name={skillMap[skId]?.name ?? skId} />
                ))
              )}
            </div>
          </Card>

          <Card className="p-5">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-brand-600" />
              <h3 className="font-semibold text-ink-900">Team composition</h3>
            </div>
            <div className="mt-3 space-y-2">
              {team.roles.map((role) => {
                const requiredSkills = role.requiredSkills.map((s) => skillMap[s]?.name ?? s);
                return (
                  <div key={role.id} className="rounded-lg border border-ink-100 p-2.5">
                    <div className="text-sm font-semibold text-ink-800">{role.name}</div>
                    <div className="mt-1 flex flex-wrap gap-1">
                      {requiredSkills.map((s) => (
                        <span key={s} className="text-[11px] rounded bg-ink-50 px-1.5 py-0.5 text-ink-600">{s}</span>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
            <button onClick={() => navigate(`/team/matching/${team.id}`)} className="mt-3 btn-secondary w-full text-xs">
              See full team builder <ArrowRight className="h-3 w-3" />
            </button>
          </Card>
        </div>
      </div>
    </div>
  );
}
