import { useState, useEffect } from 'react';
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
  Star,
  Sparkles,
  Send,
  Copy,
  ExternalLink,
  Save,
  MessageSquare,
  X,
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
import { useToast } from '@/lib/toast';
import { CandidateAiDossier } from '@/components/CandidateAiDossier';
import { PipelineStepper } from '@/components/PipelineStepper';
import { HitlVerificationModal } from '@/components/HitlVerificationModal';
import { useCustomStudents } from '@/lib/customStudents';
import type { ApplicationStatus, Evidence } from '@/types';

export function CandidateDetailsPage({ opportunityId, studentId }: { opportunityId: string; studentId: string }) {
  const { navigate } = useRouter();
  const { getApplication, updateStatus } = useApplications();
  const { notifications } = useNotifications();
  useCustomStudents(); // Re-render when evidence is verified

  const [auditingEvidence, setAuditingEvidence] = useState<Evidence | null>(null);

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

  const { toast } = useToast();

  // Recruiter Evaluation Scorecard State
  const storageKey = `evx_eval_${opportunityId}_${studentId}`;
  const [scorecard, setScorecard] = useState({
    technical: 4,
    architecture: 4,
    evidence: 5,
    communication: 4,
    notes: '',
    savedAt: null as string | null,
  });

  useEffect(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        setScorecard(JSON.parse(saved));
      }
    } catch {
      // ignore
    }
  }, [storageKey]);

  const handleSaveScorecard = () => {
    const updated = { ...scorecard, savedAt: new Date().toISOString() };
    setScorecard(updated);
    localStorage.setItem(storageKey, JSON.stringify(updated));
    toast.success('Evaluation scorecard saved!');
  };

  const avgScore = Number(
    ((scorecard.technical + scorecard.architecture + scorecard.evidence + scorecard.communication) / 4).toFixed(1)
  );

  const recommendation =
    avgScore >= 4.5
      ? { label: 'Strong Hire', color: 'emerald' as const, bg: 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800' }
      : avgScore >= 3.5
      ? { label: 'Hire', color: 'brand' as const, bg: 'bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border-blue-300 dark:border-blue-800' }
      : avgScore >= 2.5
      ? { label: 'Hold / Follow-up', color: 'amber' as const, bg: 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border-amber-300 dark:border-amber-800' }
      : { label: 'Pass', color: 'rose' as const, bg: 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border-rose-300 dark:border-rose-800' };

  // Email outreach state & generator
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [emailTab, setEmailTab] = useState<'interview' | 'offer' | 'feedback'>('interview');

  const topSkillsText =
    result.matchedSkills
      .map((m) => skillMap[m.skillId]?.name)
      .filter(Boolean)
      .slice(0, 3)
      .join(', ') || 'demonstrated engineering capabilities';

  const missingSkillsText = gap.recommendations
    .map((r) => r.skillName)
    .slice(0, 2)
    .join(' and ');

  const getEmailContent = (type: 'interview' | 'offer' | 'feedback') => {
    if (type === 'interview') {
      return {
        subject: `Interview Invitation: ${opp.title} at ${opp.organization}`,
        body: `Hi ${student.name},

Thank you for applying for the ${opp.title} role at ${opp.organization}!

Our engineering team reviewed your verified EvidentX portfolio and was particularly impressed by your proven competency in ${topSkillsText}. Your verified code and coursework artifacts demonstrate the technical depth we value.

We would love to invite you for a 45-minute technical conversation to discuss your projects and how you might contribute to our team.

Please select a convenient time on our schedule here:
https://cal.com/${opp.organization.toLowerCase().replace(/[^a-z0-9]/g, '')}/technical-interview

Looking forward to our discussion!

Best regards,
Technical Hiring Team
${opp.organization}`,
      };
    } else if (type === 'offer') {
      return {
        subject: `Formal Job Offer: ${opp.title} at ${opp.organization}`,
        body: `Dear ${student.name},

On behalf of ${opp.organization}, we are thrilled to extend a formal offer of employment for the position of ${opp.title}!

Throughout our evaluation, your mastery in ${topSkillsText} and verified project track record demonstrated exceptional capability and engineering maturity.

Offer Details:
• Position: ${opp.title}
• Organization: ${opp.organization}
• Location: ${opp.location} (${opp.type})
• Package: ${opp.stipend || 'Competitive Market Tier'}
• Start Date: Mutually agreed upon completion of degree

Please review the attached formal agreement and sign at your earliest convenience. We are genuinely excited about the impact you will make with us!

Warm regards,
Talent Acquisition Team
${opp.organization}`,
      };
    } else {
      return {
        subject: `Update regarding your application for ${opp.title} at ${opp.organization}`,
        body: `Hi ${student.name},

Thank you for taking the time to share your EvidentX credentials and applying for the ${opp.title} role at ${opp.organization}.

While our team was genuinely impressed by your strong foundation in ${topSkillsText}, we have decided to move forward with candidates whose verified portfolio more directly aligns with our immediate requirements${missingSkillsText ? ` in ${missingSkillsText}` : ''}.

We encourage you to continue expanding your verified evidence base on EvidentX and stay in touch for future openings. We wish you the very best in your engineering journey!

Sincerely,
Talent Acquisition Team
${opp.organization}`,
      };
    }
  };

  const [activeEmail, setActiveEmail] = useState(() => getEmailContent('interview'));

  const handleSelectEmailTab = (tab: 'interview' | 'offer' | 'feedback') => {
    setEmailTab(tab);
    setActiveEmail(getEmailContent(tab));
  };

  const handleCopyEmail = () => {
    const fullText = `Subject: ${activeEmail.subject}\n\n${activeEmail.body}`;
    navigator.clipboard.writeText(fullText);
    toast.success('Email draft copied to clipboard!');
  };

  return (
    <div>
      <button onClick={() => navigate(`/org/candidates/${opp.id}`)} className="btn-ghost mb-3 -ml-2">
        <ArrowLeft className="h-4 w-4" /> Back to candidates
      </button>

      {/* Candidate Evidence Update Recruiter Alert Banner */}
      {recentEvidenceUpdate && (
        <div className="mb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800 p-4 text-xs text-indigo-950 dark:text-indigo-200 shadow-2xs animate-fade-in">
          <div className="flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-600 text-white text-base font-bold shadow-sm flex-shrink-0">
              📝
            </span>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-indigo-900 dark:text-white">Verified Evidence Recently Updated</span>
                <span className="text-[10px] font-extrabold bg-indigo-100 dark:bg-indigo-900/60 border border-indigo-200 dark:border-indigo-800 text-indigo-800 dark:text-indigo-300 px-2 py-0.5 rounded-full uppercase">
                  Evidence Updated
                </span>
              </div>
              <p className="text-indigo-700 dark:text-indigo-300 mt-0.5">{recentEvidenceUpdate.message}</p>
            </div>
          </div>
          <div className="text-[11px] font-mono text-indigo-600 dark:text-indigo-300 bg-white/80 dark:bg-[#161b22] border border-indigo-200 dark:border-indigo-800 px-2.5 py-1 rounded-lg flex-shrink-0">
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
                      <span className="font-semibold text-ink-900 dark:text-white text-sm">{e.title}</span>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <VerificationPill status={e.verification} />
                        <button
                          onClick={() => setAuditingEvidence(e)}
                          className="px-2 py-0.5 rounded-lg border border-indigo-200 dark:border-indigo-800 text-[11px] font-bold text-indigo-700 dark:text-indigo-300 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 inline-flex items-center gap-1 transition shadow-2xs"
                          title="Open Human-in-the-Loop Verification Audit"
                        >
                          <UserCheck className="h-3 w-3" />
                          <span>{e.verification === 'pending' ? 'Audit & Verify' : 'Audit Trail'}</span>
                        </button>
                      </div>
                    </div>
                    <div className="text-xs text-ink-500 dark:text-[#8b949e]">
                      {e.issuer} · {new Date(e.date).toLocaleDateString('en-IN', { year: 'numeric', month: 'short' })}{e.score && ` · ${e.score}`}
                    </div>
                    {e.verifiedBy && (
                      <div className="text-[11px] text-emerald-700 dark:text-emerald-400 font-semibold flex items-center gap-1 mt-0.5">
                        <CheckCircle2 className="h-3 w-3" />
                        <span>Signed by {e.verifiedBy}</span>
                      </div>
                    )}
                    {e.verification === 'rejected' && e.rejectionReason && (
                      <div className="text-[11px] text-rose-600 dark:text-rose-400 font-semibold flex items-center gap-1 mt-0.5">
                        <XCircle className="h-3 w-3" />
                        <span>Flagged: {e.rejectionReason}</span>
                      </div>
                    )}
                    <div className="mt-1.5 flex flex-wrap gap-1">
                      {e.skills.map((id) => <span key={id} className="text-[11px] rounded bg-ink-50 dark:bg-[#21262d] px-1.5 py-0.5 text-ink-600 dark:text-[#c9d1d9]">{skillMap[id]?.name}</span>)}
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
          {/* Hiring Pipeline Progression Decision Card */}
          <div className="space-y-3">
            <PipelineStepper
              currentStatus={app?.status}
              onUpdateStatus={(status) => updateStatus(student.id, opp.id, status)}
            />

            <button
              onClick={() => setShowEmailModal(true)}
              className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-ink-950 hover:bg-ink-800 dark:bg-ink-100 dark:hover:bg-white text-white dark:text-ink-950 py-2.5 px-3 text-xs font-bold transition shadow-sm active:scale-98"
            >
              <Mail className="h-4 w-4 text-brand-400 dark:text-brand-600" />
              Draft Outreach / Offer Email
            </button>
          </div>

          {/* Recruiter Evaluation Scorecard */}
          <Card className="p-5 border-ink-200 dark:border-ink-800">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400">
                  <Star className="h-4 w-4 fill-amber-500 text-amber-500" />
                </span>
                <div>
                  <h3 className="font-semibold text-ink-900 dark:text-white text-sm">Evaluation Scorecard</h3>
                  <div className="text-[10px] text-ink-500 dark:text-ink-400">Standardized recruiter rubric</div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-lg font-extrabold text-ink-950 dark:text-white leading-none">
                  {avgScore} <span className="text-xs text-ink-400 font-normal">/ 5.0</span>
                </div>
                <span className={`inline-block mt-1 text-[10px] font-bold px-2 py-0.5 rounded-full border ${recommendation.bg}`}>
                  {recommendation.label}
                </span>
              </div>
            </div>

            {/* Criteria Sliders / Clickers */}
            <div className="mt-4 space-y-3">
              {[
                { key: 'technical', label: 'Technical Proficiency', desc: 'Core languages, libraries, algorithms' },
                { key: 'architecture', label: 'Architecture & Design', desc: 'System structure, trade-offs, scale' },
                { key: 'evidence', label: 'Evidence Verifiability', desc: 'Verified artifacts & project rigor' },
                { key: 'communication', label: 'Team Communication', desc: 'Clarity, collaboration, velocity' },
              ].map((c) => {
                const val = scorecard[c.key as keyof typeof scorecard] as number;
                return (
                  <div key={c.key} className="rounded-xl border border-ink-100 dark:border-ink-800/80 p-2.5 bg-ink-50/40 dark:bg-ink-800/30">
                    <div className="flex items-center justify-between text-xs">
                      <div>
                        <span className="font-semibold text-ink-900 dark:text-white">{c.label}</span>
                        <div className="text-[10px] text-ink-500 dark:text-ink-400">{c.desc}</div>
                      </div>
                      <span className="font-bold text-ink-900 dark:text-white bg-white dark:bg-ink-900 px-2 py-0.5 rounded border border-ink-200 dark:border-ink-700">
                        {val} / 5
                      </span>
                    </div>
                    <div className="mt-2 flex items-center gap-1.5">
                      {[1, 2, 3, 4, 5].map((score) => (
                        <button
                          key={score}
                          type="button"
                          onClick={() => setScorecard({ ...scorecard, [c.key]: score })}
                          className={`flex-1 py-1 rounded-md text-[11px] font-bold transition ${
                            score <= val
                              ? 'bg-amber-500 text-white shadow-2xs'
                              : 'bg-white dark:bg-ink-800 text-ink-500 dark:text-ink-400 border border-ink-200 dark:border-ink-700 hover:bg-amber-50 dark:hover:bg-amber-950/20'
                          }`}
                        >
                          {score}★
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Recruiter debrief notes */}
            <div className="mt-4">
              <label className="block text-xs font-semibold text-ink-700 dark:text-ink-300 mb-1">
                Recruiter Debrief Notes
              </label>
              <textarea
                value={scorecard.notes}
                onChange={(e) => setScorecard({ ...scorecard, notes: e.target.value })}
                placeholder="Key interview takeaways, project depth, communication strengths..."
                rows={3}
                className="w-full rounded-xl border border-ink-200 dark:border-ink-700 bg-white dark:bg-ink-900 p-2.5 text-xs text-ink-900 dark:text-white placeholder:text-ink-400 focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>

            {/* Save Scorecard Button */}
            <div className="mt-3 flex items-center justify-between">
              <span className="text-[10px] text-ink-400">
                {scorecard.savedAt
                  ? `Saved ${new Date(scorecard.savedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
                  : 'Unsaved changes'}
              </span>
              <button
                onClick={handleSaveScorecard}
                className="inline-flex items-center gap-1.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white px-3 py-1.5 text-xs font-bold transition shadow-sm active:scale-95"
              >
                <Save className="h-3.5 w-3.5" /> Save Scorecard
              </button>
            </div>
          </Card>

          <Card className="p-5 bg-gradient-to-br from-brand-50 to-accent-50 dark:from-brand-950/40 dark:to-accent-950/40 border-brand-100 dark:border-[#30363d]">
            <div className="flex items-center gap-2">
              <Brain className="h-5 w-5 text-brand-600 dark:text-brand-400" />
              <h3 className="font-display text-lg font-bold text-ink-900 dark:text-white">Why this candidate?</h3>
            </div>
            <p className="mt-3 text-sm text-ink-700 dark:text-ink-200 leading-relaxed">{result.explanation}</p>
            <div className="mt-3 grid grid-cols-3 gap-2 text-center">
              <div className="rounded-lg bg-white dark:bg-[#161b22] border border-ink-100 dark:border-[#30363d] p-2"><div className="text-lg font-extrabold text-accent-600 dark:text-accent-400">{result.matchedSkills.length}</div><div className="text-[10px] font-semibold uppercase text-ink-400 dark:text-[#8b949e]">Matched</div></div>
              <div className="rounded-lg bg-white dark:bg-[#161b22] border border-ink-100 dark:border-[#30363d] p-2"><div className="text-lg font-extrabold text-amber-600 dark:text-amber-400">{result.partialSkills.length}</div><div className="text-[10px] font-semibold uppercase text-ink-400 dark:text-[#8b949e]">Partial</div></div>
              <div className="rounded-lg bg-white dark:bg-[#161b22] border border-ink-100 dark:border-[#30363d] p-2"><div className="text-lg font-extrabold text-rose-600 dark:text-rose-400">{result.missingSkills.length}</div><div className="text-[10px] font-semibold uppercase text-ink-400 dark:text-[#8b949e]">Missing</div></div>
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

      {/* Email Outreach & Offer Generator Modal */}
      {showEmailModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink-950/60 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="relative max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white dark:bg-ink-900 shadow-2xl border border-ink-100 dark:border-ink-800 p-6 sm:p-8">
            <div className="flex items-start justify-between gap-4 border-b border-ink-100 dark:border-ink-800 pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-brand-500/10 text-brand-600 dark:text-brand-400">
                    <Mail className="h-4 w-4" />
                  </span>
                  <Chip color="brand">Outreach Studio</Chip>
                </div>
                <h3 className="mt-2 text-xl font-display font-extrabold text-ink-950 dark:text-white">
                  Candidate Communication Generator
                </h3>
                <p className="text-xs text-ink-500 dark:text-ink-400">
                  To: <span className="font-semibold text-ink-800 dark:text-ink-200">{student.name}</span> ({student.email}) · For: {opp.title}
                </p>
              </div>
              <button
                onClick={() => setShowEmailModal(false)}
                className="rounded-lg p-1.5 text-ink-400 hover:text-ink-700 dark:hover:text-ink-200 hover:bg-ink-50 dark:hover:bg-ink-800 transition"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Template selector tabs */}
            <div className="mt-5 flex rounded-xl bg-ink-100 dark:bg-ink-800 p-1">
              <button
                onClick={() => handleSelectEmailTab('interview')}
                className={`flex-1 py-2 text-xs font-bold rounded-lg transition ${
                  emailTab === 'interview'
                    ? 'bg-white dark:bg-ink-900 text-ink-950 dark:text-white shadow-xs'
                    : 'text-ink-600 dark:text-ink-400 hover:text-ink-900 dark:hover:text-white'
                }`}
              >
                📅 Interview Invite
              </button>
              <button
                onClick={() => handleSelectEmailTab('offer')}
                className={`flex-1 py-2 text-xs font-bold rounded-lg transition ${
                  emailTab === 'offer'
                    ? 'bg-white dark:bg-ink-900 text-ink-950 dark:text-white shadow-xs'
                    : 'text-ink-600 dark:text-ink-400 hover:text-ink-900 dark:hover:text-white'
                }`}
              >
                🎉 Formal Offer
              </button>
              <button
                onClick={() => handleSelectEmailTab('feedback')}
                className={`flex-1 py-2 text-xs font-bold rounded-lg transition ${
                  emailTab === 'feedback'
                    ? 'bg-white dark:bg-ink-900 text-ink-950 dark:text-white shadow-xs'
                    : 'text-ink-600 dark:text-ink-400 hover:text-ink-900 dark:hover:text-white'
                }`}
              >
                📝 Constructive Update
              </button>
            </div>

            {/* Email Form Fields */}
            <div className="mt-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-ink-700 dark:text-ink-300 mb-1">
                  Subject Line
                </label>
                <input
                  type="text"
                  value={activeEmail.subject}
                  onChange={(e) => setActiveEmail({ ...activeEmail, subject: e.target.value })}
                  className="w-full rounded-xl border border-ink-200 dark:border-ink-700 bg-white dark:bg-ink-900 px-3 py-2 text-xs font-medium text-ink-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-semibold text-ink-700 dark:text-ink-300">
                    Email Message
                  </label>
                  <span className="text-[10px] text-ink-400">Pre-filled with candidate verified skills</span>
                </div>
                <textarea
                  rows={9}
                  value={activeEmail.body}
                  onChange={(e) => setActiveEmail({ ...activeEmail, body: e.target.value })}
                  className="w-full font-mono text-xs leading-relaxed rounded-xl border border-ink-200 dark:border-ink-700 bg-white dark:bg-ink-900 p-3 text-ink-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>
            </div>

            {/* Modal Actions */}
            <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-ink-100 dark:border-ink-800 pt-4">
              <a
                href={`mailto:${student.email}?subject=${encodeURIComponent(activeEmail.subject)}&body=${encodeURIComponent(activeEmail.body)}`}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-brand-600 dark:text-brand-400 hover:underline"
              >
                <ExternalLink className="h-3.5 w-3.5" /> Open in Email App
              </a>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleCopyEmail}
                  className="btn-secondary text-xs inline-flex items-center gap-1.5"
                >
                  <Copy className="h-3.5 w-3.5" /> Copy Email Content
                </button>
                <button
                  onClick={() => {
                    handleCopyEmail();
                    setShowEmailModal(false);
                  }}
                  className="btn-primary text-xs inline-flex items-center gap-1.5"
                >
                  <Send className="h-3.5 w-3.5" /> Copy & Done
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* HITL Verification Modal */}
      {auditingEvidence && (
        <HitlVerificationModal
          evidence={auditingEvidence}
          onClose={() => setAuditingEvidence(null)}
          onVerified={(updated) => {
            setAuditingEvidence(updated);
          }}
        />
      )}
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
