import { useState } from 'react';
import {
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  FileText,
  Lock,
  Copy,
  Check,
  X,
  UserCheck,
  Brain,
  Building2,
  Calendar,
  Layers,
  Sparkles,
  AlertCircle,
  FileCheck2,
  XCircle,
} from 'lucide-react';
import { VerificationPill, Chip } from '@/components/ui';
import { skillMap, studentMap } from '@/data/mockData';
import { updateEvidenceRecord } from '@/lib/customStudents';
import { useToast } from '@/lib/toast';
import type { Evidence, VerificationStatus } from '@/types';

interface HitlVerificationModalProps {
  evidence: Evidence;
  onClose: () => void;
  onVerified?: (updated: Evidence) => void;
  readOnly?: boolean;
}

const REVIEWER_ROLES = [
  'University Faculty / Placement Chair',
  'Technical Hiring Manager / Tech Lead',
  'Senior University Recruiter',
  'Institutional Examination Board',
  'Accredited Platform Verifier',
];

export function HitlVerificationModal({
  evidence,
  onClose,
  onVerified,
  readOnly = false,
}: HitlVerificationModalProps) {
  const { toast } = useToast();
  const student = studentMap[evidence.studentId];

  const [copiedHash, setCopiedHash] = useState(false);
  const [reviewerRole, setReviewerRole] = useState(REVIEWER_ROLES[0]);
  const [reviewerName, setReviewerName] = useState('Prof. A. K. Sharma (Placement Cell)');
  const [reviewNotes, setReviewNotes] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const audit = evidence.aiAuditSummary;
  const shortHash = evidence.evidenceHash
    ? `${evidence.evidenceHash.slice(0, 16)}...${evidence.evidenceHash.slice(-10)}`
    : 'UNREGISTERED';

  const handleCopyHash = () => {
    if (evidence.evidenceHash) {
      navigator.clipboard.writeText(evidence.evidenceHash);
      setCopiedHash(true);
      setTimeout(() => setCopiedHash(false), 2000);
      toast.success('Verification hash copied to clipboard');
    }
  };

  const handleApprove = () => {
    setIsProcessing(true);

    const verifiedRecord: Evidence = {
      ...evidence,
      verification: 'verified',
      verifiedBy: `${reviewerName} (${reviewerRole})`,
      verifiedAt: new Date().toISOString(),
      rejectionReason: undefined,
    };

    updateEvidenceRecord(verifiedRecord);

    setTimeout(() => {
      setIsProcessing(false);
      toast.success(`Evidence marked Verified by ${reviewerName}!`);
      onVerified?.(verifiedRecord);
      onClose();
    }, 400);
  };

  const handleReject = () => {
    if (!reviewNotes.trim()) {
      toast.error('Please enter a rejection reason or feedback note for the candidate.');
      return;
    }

    setIsProcessing(true);

    const rejectedRecord: Evidence = {
      ...evidence,
      verification: 'rejected',
      verifiedBy: `${reviewerName} (${reviewerRole})`,
      verifiedAt: new Date().toISOString(),
      rejectionReason: reviewNotes.trim(),
    };

    updateEvidenceRecord(rejectedRecord);

    setTimeout(() => {
      setIsProcessing(false);
      toast.error(`Evidence flagged as Rejected.`);
      onVerified?.(rejectedRecord);
      onClose();
    }, 400);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink-950/70 p-4 backdrop-blur-sm animate-fade-in overflow-y-auto">
      <div className="w-full max-w-2xl rounded-3xl bg-white dark:bg-[#161b22] p-6 sm:p-7 shadow-lift max-h-[92vh] overflow-y-auto border border-ink-200 dark:border-[#30363d] space-y-5">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-ink-100 dark:border-[#30363d] pb-4">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-indigo-50 dark:bg-indigo-950/70 text-indigo-600 dark:text-indigo-400">
              <UserCheck className="h-5 w-5" />
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-display font-bold text-ink-900 dark:text-white text-lg">
                  Human-in-the-Loop (HITL) Evidence Audit
                </h3>
                <VerificationPill status={evidence.verification} />
              </div>
              <p className="text-xs text-ink-500 dark:text-[#8b949e] mt-0.5">
                Inspect AI pre-screening heuristics, cryptographic proof, and sign off as verified reviewer
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-xl p-1.5 text-ink-400 dark:text-[#8b949e] hover:bg-ink-100 dark:hover:bg-[#30363d] transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Candidate & Document Overview */}
        <div className="grid sm:grid-cols-2 gap-3 p-4 rounded-2xl bg-ink-50/70 dark:bg-[#0d1117] border border-ink-200 dark:border-[#30363d] text-xs">
          <div className="space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-ink-400 dark:text-[#8b949e]">
              Candidate Profile
            </span>
            <div className="font-bold text-ink-900 dark:text-white text-sm">
              {student ? student.name : `Student (${evidence.studentId})`}
            </div>
            {student && (
              <div className="text-ink-600 dark:text-[#8b949e] flex items-center gap-1.5">
                <Building2 className="h-3.5 w-3.5 text-ink-400" />
                <span>{student.university} · {student.program}</span>
              </div>
            )}
          </div>

          <div className="space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-ink-400 dark:text-[#8b949e]">
              Evidence Artifact
            </span>
            <div className="font-bold text-ink-900 dark:text-white text-sm line-clamp-1">
              {evidence.title}
            </div>
            <div className="text-ink-600 dark:text-[#8b949e] flex items-center gap-1.5">
              <Calendar className="h-3.5 w-3.5 text-ink-400" />
              <span>{evidence.issuer} · {new Date(evidence.date).toLocaleDateString('en-IN', { year: 'numeric', month: 'short' })}</span>
            </div>
          </div>
        </div>

        {/* Cryptographic Proof Digest Box */}
        <div className="p-3.5 rounded-2xl bg-emerald-50/60 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 flex items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2.5 min-w-0">
            <Lock className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <div className="min-w-0">
              <div className="font-bold text-emerald-900 dark:text-emerald-300">
                Tamper-Proof Audit Fingerprint
              </div>
              <div className="font-mono text-[11px] text-emerald-800 dark:text-emerald-400 truncate">
                {evidence.evidenceHash || 'No cryptographic hash computed'}
              </div>
            </div>
          </div>
          <button
            onClick={handleCopyHash}
            className="btn-secondary text-[11px] py-1 px-2.5 inline-flex items-center gap-1 shrink-0"
            title="Copy cryptographic audit fingerprint"
          >
            {copiedHash ? <Check className="h-3 w-3 text-emerald-600" /> : <Copy className="h-3 w-3" />}
            <span>{copiedHash ? 'Copied' : 'Copy'}</span>
          </button>
        </div>

        {/* AI Pre-Screening Forensic Report */}
        <div className="space-y-3 p-4 rounded-2xl border border-brand-200 dark:border-brand-900/60 bg-gradient-to-br from-brand-50/40 to-indigo-50/30 dark:from-brand-950/20 dark:to-indigo-950/20">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Brain className="h-4 w-4 text-brand-600 dark:text-brand-400" />
              <h4 className="font-bold text-ink-900 dark:text-white text-xs uppercase tracking-wide">
                AI Pre-Screening & Forensic Analysis
              </h4>
            </div>
            {audit && (
              <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full border ${
                audit.confidenceScore >= 80
                  ? 'bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-950/70 dark:text-emerald-300 dark:border-emerald-800'
                  : audit.confidenceScore >= 60
                  ? 'bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-950/70 dark:text-amber-300 dark:border-amber-800'
                  : 'bg-rose-100 text-rose-800 border-rose-300 dark:bg-rose-950/70 dark:text-rose-300 dark:border-rose-800'
              }`}>
                {audit.confidenceScore}% Authenticity Score
              </span>
            )}
          </div>

          {/* Quick Indicator Badges */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
            <div className="p-2.5 rounded-xl bg-white dark:bg-[#161b22] border border-ink-100 dark:border-[#30363d]">
              <span className="text-[10px] text-ink-400 dark:text-[#8b949e] font-semibold block">Identity Match</span>
              <div className="mt-0.5 flex items-center gap-1 font-bold text-xs">
                {audit?.nameMatch ? (
                  <span className="text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                    <CheckCircle2 className="h-3.5 w-3.5" /> Name Confirmed
                  </span>
                ) : (
                  <span className="text-amber-600 dark:text-amber-400 flex items-center gap-1">
                    <AlertTriangle className="h-3.5 w-3.5" /> Check Recipient
                  </span>
                )}
              </div>
            </div>

            <div className="p-2.5 rounded-xl bg-white dark:bg-[#161b22] border border-ink-100 dark:border-[#30363d]">
              <span className="text-[10px] text-ink-400 dark:text-[#8b949e] font-semibold block">Issuer Registry</span>
              <div className="mt-0.5 font-bold text-ink-800 dark:text-[#c9d1d9] truncate text-xs">
                {audit?.issuerDetected || evidence.issuer}
              </div>
            </div>

            <div className="p-2.5 rounded-xl bg-white dark:bg-[#161b22] border border-ink-100 dark:border-[#30363d] col-span-2 sm:col-span-1">
              <span className="text-[10px] text-ink-400 dark:text-[#8b949e] font-semibold block">Skills Extracted</span>
              <div className="mt-0.5 font-bold text-brand-600 dark:text-brand-400 text-xs">
                {evidence.skills.length} Demonstrated
              </div>
            </div>
          </div>

          {/* OCR text snippet */}
          {audit?.ocrSnippet && (
            <div className="p-2.5 rounded-xl bg-white/80 dark:bg-[#161b22]/80 border border-ink-100 dark:border-[#30363d] text-[11px]">
              <span className="font-bold text-ink-600 dark:text-[#8b949e] block mb-0.5">Extracted Document Snippet:</span>
              <p className="text-ink-700 dark:text-[#c9d1d9] font-mono leading-relaxed line-clamp-2">
                &ldquo;{audit.ocrSnippet}&rdquo;
              </p>
            </div>
          )}

          {/* Forensic Flags */}
          {audit?.flags && audit.flags.length > 0 && (
            <div className="space-y-1">
              {audit.flags.map((flag, idx) => (
                <div
                  key={idx}
                  className="text-[11px] text-ink-700 dark:text-[#c9d1d9] flex items-start gap-1.5"
                >
                  <span className="shrink-0">{flag.slice(0, 2)}</span>
                  <span>{flag.slice(2).trim()}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Demonstrated Skills List */}
        <div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-ink-400 dark:text-[#8b949e]">
            Attributed Competencies
          </span>
          <div className="mt-1.5 flex flex-wrap gap-1.5">
            {evidence.skills.map((sId) => (
              <span
                key={sId}
                className="px-2.5 py-1 rounded-lg bg-ink-100 dark:bg-[#21262d] text-ink-800 dark:text-[#c9d1d9] text-xs font-semibold"
              >
                {skillMap[sId]?.name || sId}
              </span>
            ))}
          </div>
        </div>

        {/* Existing Verification / Sign-Off Record */}
        {evidence.verifiedBy && (
          <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 space-y-1 text-xs">
            <div className="flex items-center gap-1.5 font-bold text-emerald-900 dark:text-emerald-300">
              <FileCheck2 className="h-4 w-4 text-emerald-600" />
              <span>Signed & Verified Audit Seal</span>
            </div>
            <p className="text-emerald-800 dark:text-emerald-400">
              Approved by <strong>{evidence.verifiedBy}</strong> on{' '}
              {evidence.verifiedAt ? new Date(evidence.verifiedAt).toLocaleString('en-IN') : 'Official Audit Record'}.
            </p>
          </div>
        )}

        {/* Existing Rejection Notice */}
        {evidence.verification === 'rejected' && evidence.rejectionReason && (
          <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 space-y-1 text-xs">
            <div className="flex items-center gap-1.5 font-bold text-rose-900 dark:text-rose-300">
              <XCircle className="h-4 w-4 text-rose-600" />
              <span>Document Flagged & Rejected</span>
            </div>
            <p className="text-rose-800 dark:text-rose-400">
              Reviewer feedback: {evidence.rejectionReason}
            </p>
          </div>
        )}

        {/* Reviewer Sign-Off Form (When not readOnly) */}
        {!readOnly && (
          <div className="p-4 rounded-2xl border border-ink-200 dark:border-[#30363d] bg-ink-50/40 dark:bg-[#0d1117] space-y-3">
            <div className="flex items-center gap-1.5 font-bold text-ink-900 dark:text-white text-xs">
              <ShieldCheck className="h-4 w-4 text-brand-600" />
              <span>Human Verifier Sign-Off Action</span>
            </div>

            <div className="grid sm:grid-cols-2 gap-3 text-xs">
              <div>
                <label className="label">Reviewer Role</label>
                <select
                  value={reviewerRole}
                  onChange={(e) => setReviewerRole(e.target.value)}
                  className="input text-xs"
                >
                  {REVIEWER_ROLES.map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="label">Reviewer Name & Designation</label>
                <input
                  type="text"
                  value={reviewerName}
                  onChange={(e) => setReviewerName(e.target.value)}
                  className="input text-xs"
                  placeholder="e.g. Prof. Sharma / Lead Evaluator"
                />
              </div>
            </div>

            <div>
              <label className="label">Reviewer Audit Notes / Feedback (Required if rejecting)</label>
              <textarea
                value={reviewNotes}
                onChange={(e) => setReviewNotes(e.target.value)}
                placeholder="Add audit sign-off remarks, marksheet verification confirmation, or rejection reason…"
                rows={2}
                className="input text-xs resize-none"
              />
            </div>

            <div className="pt-2 flex flex-wrap items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={onClose}
                className="btn-secondary text-xs py-2 px-3"
              >
                Close
              </button>

              <button
                type="button"
                onClick={handleReject}
                disabled={isProcessing}
                className="btn-secondary text-xs py-2 px-3 text-rose-600 dark:text-rose-400 border-rose-300 dark:border-rose-800 hover:bg-rose-50 dark:hover:bg-rose-950/40 inline-flex items-center gap-1.5"
              >
                <XCircle className="h-3.5 w-3.5" />
                <span>Reject Evidence</span>
              </button>

              <button
                type="button"
                onClick={handleApprove}
                disabled={isProcessing}
                className="btn-primary text-xs py-2 px-4 bg-emerald-600 hover:bg-emerald-700 text-white inline-flex items-center gap-1.5 shadow-sm"
              >
                <CheckCircle2 className="h-3.5 w-3.5" />
                <span>Approve & Sign as Verified (1.0x Weight)</span>
              </button>
            </div>
          </div>
        )}

        {readOnly && (
          <div className="flex justify-end pt-2">
            <button onClick={onClose} className="btn-secondary text-xs">
              Close
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
