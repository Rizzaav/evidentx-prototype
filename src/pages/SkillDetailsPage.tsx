import { ArrowLeft, Shield, FileBadge, TrendingUp } from 'lucide-react';
import {
  PageHeader,
  Card,
  Avatar,
  ProgressBar,
  VerificationPill,
  EvidenceTypeIcon,
  Chip,
  Section,
} from '@/components/ui';
import { useDemoStudent } from '@/lib/useDemoStudent';
import { skillMap, evidenceMap, evidenceSkillStrength, STUDENT_SKILLS } from '@/data/mockData';
import { useRouter } from '@/lib/router';

export function SkillDetailsPage({ skillId }: { skillId: string }) {
  const { student } = useDemoStudent();
  const { navigate } = useRouter();
  if (!student) return null;

  const skill = skillMap[skillId];
  if (!skill) {
    return (
      <div>
        <PageHeader title="Skill not found" backTo="/student/passport" onBack={() => navigate('/student/passport')} />
        <Card className="p-6 text-ink-600">This skill could not be found.</Card>
      </div>
    );
  }

  // find this student's skill record
  const ss = STUDENT_SKILLS.find(
    (s) => s.studentId === student.id && s.skillId === skillId
  );
  const evidenceItems = (ss?.evidenceIds ?? []).map((id: string) => evidenceMap[id]).filter(Boolean);

  const proficiency = ss?.proficiency ?? 0;
  const status = proficiency >= 70 ? 'Strong' : proficiency >= 40 ? 'Developing' : 'Beginner';
  const statusColor =
    proficiency >= 70 ? 'bg-accent-50 text-accent-700' : proficiency >= 40 ? 'bg-amber-50 text-amber-700' : 'bg-rose-50 text-rose-700';

  return (
    <div>
      <button onClick={() => navigate('/student/passport')} className="btn-ghost mb-3 -ml-2">
        <ArrowLeft className="h-4 w-4" /> Back to Passport
      </button>

      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-brand-700 to-brand-900 p-6 text-white sm:p-8">
        <div className="flex items-center justify-between">
          <div>
            <Chip color="gray"><span className="text-ink-700">{skill.category}</span></Chip>
            <h1 className="mt-2 font-display text-3xl font-extrabold">{skill.name}</h1>
          </div>
          <div className="text-right">
            <div className="text-4xl font-extrabold">{proficiency}%</div>
            <div className="text-xs font-semibold uppercase tracking-wide text-white/70">Proficiency</div>
          </div>
        </div>
        <div className="mt-4 h-2.5 rounded-full bg-white/20">
          <div className="h-full rounded-full bg-white" style={{ width: `${proficiency}%` }} />
        </div>
        <div className="mt-3 flex items-center gap-2">
          <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${statusColor}`}>{status}</span>
          <span className="text-xs text-white/70">Derived from {evidenceItems.length} evidence item{evidenceItems.length !== 1 ? 's' : ''}</span>
        </div>
      </div>

      <Section title="Supporting Evidence">
        {evidenceItems.length === 0 ? (
          <Card className="p-6 text-center text-ink-500">No evidence for this skill yet.</Card>
        ) : (
          <div className="space-y-3">
            {evidenceItems.map((e) => {
              const strength = evidenceSkillStrength[e.id]?.[skillId] ?? 50;
              const ver = e.verification;
              const verMult = ver === 'verified' ? 1.0 : ver === 'pending' ? 0.8 : 0.6;
              const effective = Math.round(strength * verMult);
              return (
                <Card key={e.id} className="p-5">
                  <div className="flex items-start gap-4">
                    <EvidenceTypeIcon type={e.type} />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="font-semibold text-ink-900">{e.title}</h3>
                        <VerificationPill status={e.verification} />
                      </div>
                      <p className="mt-1 text-sm text-ink-600">{e.description}</p>
                      <div className="mt-1 text-xs text-ink-500">
                        {e.issuer} · {new Date(e.date).toLocaleDateString('en-IN', { year: 'numeric', month: 'short' })}
                        {e.score && <span className="ml-2 font-semibold text-ink-700">· {e.score}</span>}
                      </div>
                      <div className="mt-3">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-semibold text-ink-600">Evidence strength for {skill.name}</span>
                          <span className="font-bold text-ink-900">{strength}% raw · {effective}% effective</span>
                        </div>
                        <div className="mt-1.5">
                          <ProgressBar value={effective} height="h-1.5" />
                        </div>
                        {ver !== 'verified' && (
                          <div className="mt-1.5 flex items-center gap-1 text-[11px] text-amber-600">
                            <Shield className="h-3 w-3" />
                            Verification status reduces effective strength to {Math.round(verMult * 100)}% of raw.
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </Section>

      <Card className="p-5 bg-ink-50 border-ink-100">
        <div className="flex items-center gap-2">
          <TrendingUp className="h-4 w-4 text-brand-600" />
          <h3 className="font-semibold text-ink-900 text-sm">How proficiency is calculated</h3>
        </div>
        <p className="mt-1.5 text-xs text-ink-600">
          Proficiency is a verification-weighted average of all supporting evidence strengths.
          Verified evidence counts fully, pending at 80%, and self-reported at 60%.
        </p>
      </Card>
    </div>
  );
}
