import { useState } from 'react';
import {
  ArrowLeft,
  Building2,
  MapPin,
  Clock,
  Wallet,
  Calendar,
  CheckCircle2,
  AlertCircle,
  XCircle,
  Shield,
  Sparkles,
  Target,
  Brain,
  FileBadge,
  ArrowRight,
  Send,
  Check,
} from 'lucide-react';
import {
  PageHeader,
  Card,
  Chip,
  SkillBadge,
  MatchRing,
  Section,
  ProgressBar,
  Avatar,
} from '@/components/ui';
import { useDemoStudent } from '@/lib/useDemoStudent';
import { matchStudentToOpportunity, skillGapAnalysis } from '@/lib/matchingEngine';
import { opportunityMap, skillMap, evidenceMap, studentMap } from '@/data/mockData';
import { useApplications } from '@/lib/applications';
import { useRouter } from '@/lib/router';

export function InternshipDetailsPage({ opportunityId }: { opportunityId: string }) {
  const { studentId, student } = useDemoStudent();
  const { navigate } = useRouter();
  const { hasApplied, getApplication, apply } = useApplications();
  const [justApplied, setJustApplied] = useState(false);

  const opp = opportunityMap[opportunityId];

  if (!opp || !student) {
    return (
      <div>
        <PageHeader title="Not found" backTo="/student/internships" onBack={() => navigate('/student/internships')} />
        <Card className="p-6 text-ink-600">This opportunity could not be found.</Card>
      </div>
    );
  }

  const result = matchStudentToOpportunity(studentId, opp);
  const gap = skillGapAnalysis(studentId, opp);
  const applied = hasApplied(studentId, opp.id);
  const currentApp = getApplication(studentId, opp.id);

  const handleApply = () => {
    apply(studentId, opp.id, result.matchScore);
    setJustApplied(true);
  };

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
      <div className="mb-3 flex items-center justify-between">
        <button onClick={() => navigate('/student/internships')} className="btn-ghost -ml-2">
          <ArrowLeft className="h-4 w-4" /> Back to opportunities
        </button>
        {applied ? (
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wide text-ink-500">Application:</span>
            <Chip color={statusColors[currentApp?.status ?? 'Applied'] ?? 'brand'}>
              {currentApp?.status ?? 'Applied'}
            </Chip>
          </div>
        ) : (
          <button onClick={handleApply} className="btn-primary">
            <Send className="h-4 w-4" /> Apply with Skill Passport
          </button>
        )}
      </div>

      {justApplied && (
        <div className="mb-4 flex items-center gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-emerald-900 animate-fade-in">
          <Check className="h-5 w-5 text-emerald-600 flex-shrink-0" />
          <div className="text-sm">
            <strong>Application submitted!</strong> Your verified Skill Passport and{' '}
            <span className="font-bold">{result.matchScore}% Match Score</span> breakdown were sent to {opp.organization}.
          </div>
        </div>
      )}

      {/* Opportunity header */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-ink-900 to-brand-950 p-6 text-white sm:p-8">
        <div className="absolute right-0 top-0 h-48 w-48 rounded-full bg-brand-500/20 blur-3xl" />
        <div className="relative flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <Chip color="brand"><span className="text-brand-700">{opp.type}</span></Chip>
              {applied && <Chip color="emerald"><span className="text-emerald-700 font-bold">Applied: {currentApp?.status}</span></Chip>}
            </div>
            <h1 className="mt-2 font-display text-2xl font-extrabold sm:text-3xl">{opp.title}</h1>
            <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-white/80">
              <span className="inline-flex items-center gap-1"><Building2 className="h-4 w-4" /> {opp.organization}</span>
              <span className="inline-flex items-center gap-1"><MapPin className="h-4 w-4" /> {opp.location}</span>
              <span className="inline-flex items-center gap-1"><Clock className="h-4 w-4" /> {opp.duration}</span>
              <span className="inline-flex items-center gap-1"><Wallet className="h-4 w-4" /> {opp.stipend}</span>
            </div>
            <p className="mt-3 max-w-2xl text-sm text-white/80">{opp.description}</p>
          </div>
          <div className="flex items-center gap-3 rounded-2xl bg-white/10 p-4">
            <MatchRing score={result.matchScore} size={110} />
            <div>
              <div className="text-xs font-bold uppercase tracking-wide text-white/60">Your match</div>
              <div className="mt-1 flex items-center gap-2">
                <Avatar name={student.name} color={student.avatarColor} size="sm" />
                <span className="text-sm font-semibold">{student.name.split(' ')[0]}</span>
              </div>
            </div>
          </div>
        </div>
        <div className="relative mt-4 flex items-center justify-between border-t border-white/10 pt-4">
          <div>
            {!applied ? (
              <button onClick={handleApply} className="btn bg-white text-ink-900 hover:bg-white/90 shadow-lift">
                <Send className="h-4 w-4 text-brand-600" /> Apply with Skill Passport
              </button>
            ) : (
              <span className="inline-flex items-center gap-2 text-xs font-bold text-accent-300">
                <CheckCircle2 className="h-4 w-4" /> Application active ({currentApp?.status})
              </span>
            )}
          </div>
        </div>
      </div>


      {/* Skills breakdown */}
      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          {/* Matched */}
          <Card className="p-6">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-accent-600" />
              <h3 className="font-display text-lg font-bold text-ink-900">Matched skills</h3>
              <span className="ml-auto text-xs font-semibold text-ink-400">{result.matchedSkills.length} skills</span>
            </div>
            <div className="mt-4 space-y-3">
              {result.matchedSkills.length === 0 ? (
                <p className="text-sm text-ink-500">No matched skills yet.</p>
              ) : (
                result.matchedSkills.map((m) => (
                  <SkillRow key={m.skillId} skillId={m.skillId} proficiency={m.studentProficiency} status="matched" required={m.required} evidenceTitles={m.evidenceTitles} />
                ))
              )}
            </div>
          </Card>

          {/* Partial */}
          {result.partialSkills.length > 0 && (
            <Card className="p-6">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-amber-600" />
                <h3 className="font-display text-lg font-bold text-ink-900">Partially matched</h3>
                <span className="ml-auto text-xs font-semibold text-ink-400">{result.partialSkills.length} skills</span>
              </div>
              <div className="mt-4 space-y-3">
                {result.partialSkills.map((m) => (
                  <SkillRow key={m.skillId} skillId={m.skillId} proficiency={m.studentProficiency} status="partial" required={m.required} evidenceTitles={m.evidenceTitles} />
                ))}
              </div>
            </Card>
          )}

          {/* Missing */}
          {result.missingSkills.length > 0 && (
            <Card className="p-6">
              <div className="flex items-center gap-2">
                <XCircle className="h-5 w-5 text-rose-600" />
                <h3 className="font-display text-lg font-bold text-ink-900">Missing skills</h3>
                <span className="ml-auto text-xs font-semibold text-ink-400">{result.missingSkills.length} skills</span>
              </div>
              <div className="mt-4 space-y-3">
                {result.missingSkills.map((m) => (
                  <SkillRow key={m.skillId} skillId={m.skillId} proficiency={m.studentProficiency} status="missing" required={m.required} evidenceTitles={m.evidenceTitles} />
                ))}
              </div>
            </Card>
          )}
        </div>

        {/* Side: explanation + fairness */}
        <div className="space-y-6">
          <Card className="p-6 bg-gradient-to-br from-brand-50 to-accent-50 border-brand-100">
            <div className="flex items-center gap-2">
              <Brain className="h-5 w-5 text-brand-600" />
              <h3 className="font-display text-lg font-bold text-ink-900">Why this match?</h3>
            </div>
            <p className="mt-3 text-sm text-ink-700 leading-relaxed">{result.explanation}</p>
            <div className="mt-3 grid grid-cols-3 gap-2 text-center">
              <div className="rounded-lg bg-white p-2">
                <div className="text-lg font-extrabold text-accent-600">{result.matchedSkills.length}</div>
                <div className="text-[10px] font-semibold uppercase text-ink-400">Matched</div>
              </div>
              <div className="rounded-lg bg-white p-2">
                <div className="text-lg font-extrabold text-amber-600">{result.partialSkills.length}</div>
                <div className="text-[10px] font-semibold uppercase text-ink-400">Partial</div>
              </div>
              <div className="rounded-lg bg-white p-2">
                <div className="text-lg font-extrabold text-rose-600">{result.missingSkills.length}</div>
                <div className="text-[10px] font-semibold uppercase text-ink-400">Missing</div>
              </div>
            </div>
          </Card>

          <Card className="p-5">
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-accent-600" />
              <h3 className="font-semibold text-ink-900">Fair matching</h3>
            </div>
            <p className="mt-2 text-sm text-ink-600">{result.fairExplanation}</p>
            <button onClick={() => navigate('/fairness')} className="mt-2 text-xs font-semibold text-brand-600 hover:underline">
              Read the full policy <ArrowRight className="inline h-3 w-3" />
            </button>
          </Card>

          {gap.recommendations.length > 0 && (
            <Card className="p-5">
              <div className="flex items-center gap-2">
                <Target className="h-5 w-5 text-rose-600" />
                <h3 className="font-semibold text-ink-900">Close the gap</h3>
              </div>
              <div className="mt-3 space-y-2.5">
                {gap.recommendations.slice(0, 3).map((r) => (
                  <div key={r.skillId} className="rounded-lg border border-ink-100 p-2.5">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-semibold text-ink-800">{r.skillName}</span>
                      <Chip color={r.priority === 'high' ? 'rose' : r.priority === 'medium' ? 'amber' : 'gray'}>{r.priority}</Chip>
                    </div>
                    <p className="mt-1 text-xs text-ink-600">{r.recommendation}</p>
                  </div>
                ))}
              </div>
              <button onClick={() => navigate(`/student/skillgap/${opp.id}`)} className="mt-3 btn-secondary w-full text-xs">
                Full skill gap analysis <ArrowRight className="h-3 w-3" />
              </button>
            </Card>
          )}
        </div>
      </div>

      {/* Supporting evidence table */}
      <Section title="Supporting evidence">
        <Card className="overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-ink-50 text-left text-xs font-bold uppercase tracking-wide text-ink-500">
              <tr>
                <th className="px-4 py-3">Skill</th>
                <th className="px-4 py-3">Evidence</th>
                <th className="px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink-100">
              {result.supportingEvidence.length === 0 ? (
                <tr><td colSpan={3} className="px-4 py-6 text-center text-ink-500">No supporting evidence.</td></tr>
              ) : (
                result.supportingEvidence.map((se) => (
                  <tr key={se.skillId} className="hover:bg-ink-50/50">
                    <td className="px-4 py-3 font-semibold text-ink-800">{se.skillName}</td>
                    <td className="px-4 py-3 text-ink-600">
                      <div className="flex flex-wrap gap-1.5">
                        {se.evidence.map((t, i) => {
                          const ev = Object.values(evidenceMap).find((e) => e.title === t && e.studentId === studentId);
                          return (
                            <span key={i} className="inline-flex items-center gap-1 rounded-md bg-ink-50 px-2 py-0.5 text-xs">
                              <FileBadge className="h-3 w-3 text-brand-500" /> {t}
                              {ev && ev.verification === 'verified' && <Shield className="h-3 w-3 text-accent-500" />}
                            </span>
                          );
                        })}
                      </div>
                    </td>
                    <td className="px-4 py-3"><Chip color="emerald">Demonstrated</Chip></td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </Card>
      </Section>
    </div>
  );
}

function SkillRow({
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
    matched: { icon: <CheckCircle2 className="h-4 w-4 text-accent-600" />, label: 'Matched', chip: 'emerald' as const },
    partial: { icon: <AlertCircle className="h-4 w-4 text-amber-600" />, label: 'Partial', chip: 'amber' as const },
    missing: { icon: <XCircle className="h-4 w-4 text-rose-600" />, label: 'Missing', chip: 'rose' as const },
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
              <span key={i} className="inline-flex items-center gap-1 text-xs text-ink-500">
                <FileBadge className="h-3 w-3" /> {t}
              </span>
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
