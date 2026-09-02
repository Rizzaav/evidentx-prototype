import {
  ArrowLeft,
  Shield,
  Brain,
  CheckCircle2,
  AlertCircle,
  XCircle,
  FileBadge,
  Target,
  ArrowRight,
  Mail,
  GraduationCap,
  Building2,
  Check,
  UserCheck,
} from 'lucide-react';
import { useRouter } from '@/lib/router';
import {
  PageHeader,
  Card,
  Chip,
  SkillBadge,
  MatchRing,
  Avatar,
  ProgressBar,
  Section,
  VerificationPill,
} from '@/components/ui';
import { opportunityMap, studentMap, skillMap, evidenceMap, getStudentEvidence } from '@/data/mockData';
import { matchStudentToOpportunity, skillGapAnalysis } from '@/lib/matchingEngine';
import { useApplications } from '@/lib/applications';
import { useNotifications } from '@/lib/notifications';
import { CandidateAiDossier } from '@/components/CandidateAiDossier';
import type { ApplicationStatus } from '@/types';

export function CandidateDetailsPage({ opportunityId, studentId }: { opportunityId: string; studentId: string }) {
  const { navigate } = useRouter();
  const { getApplication, updateStatus } = useApplications();
  const { notifications } = useNotifications();

  const opp = opportunityMap[opportunityId];
  const student = studentMap[studentId];

  if (!opp || !student) {
    return (
      <div>
        <PageHeader title="Not found" backTo="/org/candidates" onBack={() => navigate('/org/candidates')} />
        <Card className="p-6 text-ink-600">Candidate or opportunity not found.</Card>
      </div>
    );
  }

  const result = matchStudentToOpportunity(studentId, opp);
  const gap = skillGapAnalysis(studentId, opp);
  const evidence = getStudentEvidence(studentId);
  const app = getApplication(studentId, opp.id);
  const recentEvidenceUpdate = notifications.find(
    (n) => n.type === 'evidence_update' && n.studentId === studentId
  );

  return (
    <div>
      <button onClick={() => navigate(`/org/candidates/${opp.id}`)} className="btn-ghost mb-3 -ml-2">
        <ArrowLeft className="h-4 w-4" /> Back to candidates
      </button>

      {/* Candidate Evidence Update Recruiter Alert Banner */}
      {recentEvidenceUpdate && (
        <div className="mb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl bg-indigo-50 border border-indigo-200 p-4 text-xs text-indigo-950 shadow-2xs animate-fade-in">
          <div className="flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-600 text-white text-base font-bold shadow-sm flex-shrink-0">
              📝
            </span>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-indigo-900">Verified Evidence Recently Updated</span>
                <span className="text-[10px] font-extrabold bg-indigo-100 border border-indigo-200 text-indigo-800 px-2 py-0.5 rounded-full uppercase">
                  SHA-256 Resealed
                </span>
              </div>
              <p className="text-indigo-700 mt-0.5">{recentEvidenceUpdate.message}</p>
            </div>
          </div>
          <div className="text-[11px] font-mono text-indigo-600 bg-white/80 border border-indigo-200 px-2.5 py-1 rounded-lg flex-shrink-0">
            {new Date(recentEvidenceUpdate.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </div>
        </div>
      )}

      {/* Candidate header */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-ink-900 to-brand-950 p-6 text-white sm:p-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-center gap-4">
            <Avatar name={student.name} color={student.avatarColor} photoUrl={student.photoUrl} size="xl" />
            <div>
              <h2 className="font-display text-2xl font-extrabold">{student.name}</h2>
              <div className="mt-1 flex flex-wrap items-center gap-3 text-sm text-white/80">
                <span className="inline-flex items-center gap-1"><GraduationCap className="h-4 w-4" /> {student.program}</span>
                <span className="inline-flex items-center gap-1"><Building2 className="h-4 w-4" /> {student.university}</span>
              </div>
              <p className="mt-2 max-w-md text-sm text-white/85">{student.bio}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 rounded-2xl bg-white/10 p-4">
            <MatchRing score={result.matchScore} size={110} label="Match" />
            <div>
              <div className="text-xs font-bold uppercase tracking-wide text-white/60">For</div>
              <div className="mt-1 text-sm font-semibold max-w-[160px]">{opp.title}</div>
            </div>
          </div>
        </div>
      </div>

      {/* AI Candidate Executive Dossier & Interactive Recruiter Interrogation */}
      <div className="mt-6">
        <CandidateAiDossier student={student} opportunity={opp} />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        {/* Skills breakdown */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="p-6">
            <h3 className="font-display text-lg font-bold text-ink-900">Skill match breakdown</h3>
            <div className="mt-4 space-y-3">
              {result.matchedSkills.map((m) => (
                <SkillBreakdownRow key={m.skillId} skillId={m.skillId} proficiency={m.studentProficiency} status="matched" required={m.required} evidenceTitles={m.evidenceTitles} />
              ))}
              {result.partialSkills.map((m) => (
                <SkillBreakdownRow key={m.skillId} skillId={m.skillId} proficiency={m.studentProficiency} status="partial" required={m.required} evidenceTitles={m.evidenceTitles} />
              ))}
              {result.missingSkills.map((m) => (
                <SkillBreakdownRow key={m.skillId} skillId={m.skillId} proficiency={m.studentProficiency} status="missing" required={m.required} evidenceTitles={m.evidenceTitles} />
              ))}
            </div>
          </Card>

          {/* Evidence portfolio */}
          <Card className="p-6">
            <h3 className="font-display text-lg font-bold text-ink-900">Candidate evidence portfolio</h3>
            <p className="text-xs text-ink-500 mt-0.5">All verified coursework, projects, competitions and credentials</p>
            <div className="mt-4 space-y-3">
              {evidence.map((e) => (
                <div key={e.id} className="flex items-start gap-3 rounded-xl border border-ink-100 p-3">
                  <span className={`inline-flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg ${e.type === 'project' ? 'bg-accent-50 text-accent-600' : e.type === 'coursework' ? 'bg-brand-50 text-brand-600' : e.type === 'competition' ? 'bg-amber-50 text-amber-600' : 'bg-purple-50 text-purple-600'}`}>
                    <FileBadge className="h-4 w-4" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <span className="font-semibold text-ink-900 text-sm">{e.title}</span>
                      <VerificationPill status={e.verification} />
                    </div>
                    <div className="text-xs text-ink-500">{e.issuer} · {new Date(e.date).toLocaleDateString('en-IN', { year: 'numeric', month: 'short' })}{e.score && ` · ${e.score}`}</div>
                    <div className="mt-1.5 flex flex-wrap gap-1">
                      {e.skills.map((id) => <span key={id} className="text-[11px] rounded bg-ink-50 px-1.5 py-0.5 text-ink-600">{skillMap[id]?.name}</span>)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Side */}
        <div className="space-y-6">
          {/* Hiring Decision Card */}
          <Card className="p-5 border-brand-200 shadow-lift">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <UserCheck className="h-5 w-5 text-brand-600" />
                <h3 className="font-semibold text-ink-900">Application status</h3>
              </div>
              <Chip color={app?.status === 'Offered' ? 'emerald' : app?.status === 'Shortlisted' ? 'accent' : 'brand'}>
                {app?.status ?? 'Not Applied'}
              </Chip>
            </div>
            <p className="mt-2 text-xs text-ink-500">
              Update candidate progression in your evaluation pipeline:
            </p>
            <div className="mt-3 grid grid-cols-2 gap-2">
              <button
                onClick={() => updateStatus(student.id, opp.id, 'Shortlisted')}
                className={`rounded-xl py-2 px-3 text-xs font-semibold transition ${
                  app?.status === 'Shortlisted' ? 'bg-accent-600 text-white' : 'bg-accent-50 text-accent-700 hover:bg-accent-100'
                }`}
              >
                Shortlist
              </button>
              <button
                onClick={() => updateStatus(student.id, opp.id, 'Interviewing')}
                className={`rounded-xl py-2 px-3 text-xs font-semibold transition ${
                  app?.status === 'Interviewing' ? 'bg-brand-600 text-white' : 'bg-brand-50 text-brand-700 hover:bg-brand-100'
                }`}
              >
                Interview
              </button>
              <button
                onClick={() => updateStatus(student.id, opp.id, 'Offered')}
                className={`rounded-xl py-2 px-3 text-xs font-semibold transition ${
                  app?.status === 'Offered' ? 'bg-emerald-600 text-white' : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                }`}
              >
                Make Offer
              </button>
              <button
                onClick={() => updateStatus(student.id, opp.id, 'Rejected')}
                className={`rounded-xl py-2 px-3 text-xs font-semibold transition ${
                  app?.status === 'Rejected' ? 'bg-rose-600 text-white' : 'bg-rose-50 text-rose-700 hover:bg-rose-100'
                }`}
              >
                Reject
              </button>
            </div>
          </Card>

          <Card className="p-5 bg-gradient-to-br from-brand-50 to-accent-50 border-brand-100">
            <div className="flex items-center gap-2">
              <Brain className="h-5 w-5 text-brand-600" />
              <h3 className="font-display text-lg font-bold text-ink-900">Why this candidate?</h3>
            </div>
            <p className="mt-3 text-sm text-ink-700 leading-relaxed">{result.explanation}</p>
            <div className="mt-3 grid grid-cols-3 gap-2 text-center">
              <div className="rounded-lg bg-white p-2"><div className="text-lg font-extrabold text-accent-600">{result.matchedSkills.length}</div><div className="text-[10px] font-semibold uppercase text-ink-400">Matched</div></div>
              <div className="rounded-lg bg-white p-2"><div className="text-lg font-extrabold text-amber-600">{result.partialSkills.length}</div><div className="text-[10px] font-semibold uppercase text-ink-400">Partial</div></div>
              <div className="rounded-lg bg-white p-2"><div className="text-lg font-extrabold text-rose-600">{result.missingSkills.length}</div><div className="text-[10px] font-semibold uppercase text-ink-400">Missing</div></div>
            </div>
          </Card>


          <Card className="p-5">
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-accent-600" />
              <h3 className="font-semibold text-ink-900">Fair assessment</h3>
            </div>
            <p className="mt-2 text-sm text-ink-600">{result.fairExplanation}</p>
          </Card>

          {gap.recommendations.length > 0 && (
            <Card className="p-5">
              <div className="flex items-center gap-2">
                <Target className="h-5 w-5 text-rose-600" />
                <h3 className="font-semibold text-ink-900">Skill gaps to develop</h3>
              </div>
              <div className="mt-3 space-y-2">
                {gap.recommendations.map((r) => (
                  <div key={r.skillId} className="rounded-lg border border-ink-100 p-2.5">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-semibold text-ink-800">{r.skillName}</span>
                      <Chip color={r.priority === 'high' ? 'rose' : r.priority === 'medium' ? 'amber' : 'gray'}>{r.priority}</Chip>
                    </div>
                    <p className="mt-1 text-xs text-ink-600">{r.recommendation}</p>
                  </div>
                ))}
              </div>
            </Card>
          )}

          <Card className="p-5">
            <h3 className="font-semibold text-ink-900 text-sm">Contact</h3>
            <div className="mt-2 flex items-center gap-2 text-sm text-ink-600">
              <Mail className="h-4 w-4 text-ink-400" /> {student.email}
            </div>
            <button onClick={() => navigate('/fairness')} className="mt-3 text-xs font-semibold text-brand-600 hover:underline">
              Fairness policy <ArrowRight className="inline h-3 w-3" />
            </button>
          </Card>
        </div>
      </div>
    </div>
  );
}

function SkillBreakdownRow({
  skillId,
  proficiency,
  status,
  required,
  evidenceTitles,
}: {
  skillId: string;
  proficiency: number;
  status: 'matched' | 'partial' | 'missing';
  required: boolean;
  evidenceTitles: string[];
}) {
  const config = {
    matched: { icon: <CheckCircle2 className="h-4 w-4 text-accent-600" />, chip: 'emerald' as const },
    partial: { icon: <AlertCircle className="h-4 w-4 text-amber-600" />, chip: 'amber' as const },
    missing: { icon: <XCircle className="h-4 w-4 text-rose-600" />, chip: 'rose' as const },
  }[status];

  return (
    <div className="flex items-center gap-3 rounded-xl border border-ink-100 p-3">
      <span className="flex-shrink-0">{config.icon}</span>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-ink-900">{skillMap[skillId]?.name ?? skillId}</span>
          <Chip color={required ? 'brand' : 'gray'}>{required ? 'Required' : 'Preferred'}</Chip>
        </div>
        {evidenceTitles.length > 0 ? (
          <div className="mt-1 flex flex-wrap gap-1.5">
            {evidenceTitles.map((t, i) => (
              <span key={i} className="inline-flex items-center gap-1 text-xs text-ink-500"><FileBadge className="h-3 w-3" /> {t}</span>
            ))}
          </div>
        ) : (
          <div className="mt-1 text-xs text-ink-400">No supporting evidence</div>
        )}
      </div>
      <div className="flex-shrink-0 w-28">
        {status === 'missing' ? (
          <span className="text-xs font-semibold text-rose-500">0% — no evidence</span>
        ) : (
          <ProgressBar value={proficiency} showLabel height="h-1.5" />
        )}
      </div>
    </div>
  );
}
