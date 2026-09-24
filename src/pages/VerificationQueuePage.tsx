import { useState, useMemo } from 'react';
import {
  ShieldCheck,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  AlertTriangle,
  UserCheck,
  FileBadge,
  Sparkles,
  ArrowRight,
  Brain,
  Building2,
  Lock,
  Eye,
  FileCheck2,
  XCircle,
} from 'lucide-react';
import { PageHeader, Card, VerificationPill, EvidenceTypeIcon, Avatar, EmptyState } from '@/components/ui';
import { getAllStudents, getStudentEvidence, skillMap } from '@/data/mockData';
import { useCustomStudents, updateEvidenceRecord } from '@/lib/customStudents';
import { HitlVerificationModal } from '@/components/HitlVerificationModal';
import { useToast } from '@/lib/toast';
import type { Evidence, VerificationStatus } from '@/types';

export function VerificationQueuePage() {
  const { toast } = useToast();
  useCustomStudents(); // Re-render when custom students / evidence update

  const [activeTab, setActiveTab] = useState<'pending' | 'verified' | 'rejected' | 'all'>('pending');
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [selectedEvidenceForModal, setSelectedEvidenceForModal] = useState<Evidence | null>(null);

  // Collect all evidence records across all students
  const allStudents = getAllStudents();
  const studentMapLocal = useMemo(() => {
    const map = new Map<string, (typeof allStudents)[0]>();
    for (const s of allStudents) map.set(s.id, s);
    return map;
  }, [allStudents]);

  const allEvidence = useMemo(() => {
    const list: Evidence[] = [];
    for (const s of allStudents) {
      const studentEv = getStudentEvidence(s.id);
      list.push(...studentEv);
    }
    // Deduplicate by ID
    const unique = new Map<string, Evidence>();
    for (const e of list) unique.set(e.id, e);
    return Array.from(unique.values()).sort(
      (a, b) => +new Date(b.date) - +new Date(a.date)
    );
  }, [allStudents]);

  // Counts for KPIs
  const pendingItems = useMemo(() => allEvidence.filter((e) => e.verification === 'pending'), [allEvidence]);
  const verifiedItems = useMemo(() => allEvidence.filter((e) => e.verification === 'verified'), [allEvidence]);
  const rejectedItems = useMemo(() => allEvidence.filter((e) => e.verification === 'rejected'), [allEvidence]);

  // Filtered evidence list
  const filteredList = useMemo(() => {
    return allEvidence.filter((e) => {
      // Tab filter
      if (activeTab === 'pending' && e.verification !== 'pending') return false;
      if (activeTab === 'verified' && e.verification !== 'verified') return false;
      if (activeTab === 'rejected' && e.verification !== 'rejected') return false;

      // Type filter
      if (typeFilter !== 'all' && e.type !== typeFilter) return false;

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const student = studentMapLocal.get(e.studentId);
        const sName = student?.name?.toLowerCase() || '';
        const title = e.title.toLowerCase();
        const issuer = e.issuer.toLowerCase();
        const skillsText = e.skills.map((id) => skillMap[id]?.name.toLowerCase() || id).join(' ');
        if (!sName.includes(q) && !title.includes(q) && !issuer.includes(q) && !skillsText.includes(q)) {
          return false;
        }
      }

      return true;
    });
  }, [allEvidence, activeTab, typeFilter, searchQuery, studentMapLocal]);

  const handleQuickApprove = (e: Evidence, event: React.MouseEvent) => {
    event.stopPropagation();
    const updated: Evidence = {
      ...e,
      verification: 'verified',
      verifiedBy: 'Prof. A. K. Sharma (Placement Cell Verifier)',
      verifiedAt: new Date().toISOString(),
      rejectionReason: undefined,
    };
    updateEvidenceRecord(updated);
    toast.success(`"${e.title}" approved and verified!`);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Evidence Verification Hub"
        subtitle="Institutional faculty and recruiters audit pending student proof, review AI forensics, and sign off verified credentials"
        right={
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800 text-xs font-bold text-amber-800 dark:text-amber-300 shadow-2xs">
              <span className="h-2 w-2 rounded-full bg-amber-500 animate-pulse" />
              <span>{pendingItems.length} Awaiting Human Sign-Off</span>
            </span>
          </div>
        }
      />

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <Card className="p-4 sm:p-5 border-amber-200/80 bg-gradient-to-br from-amber-50/40 to-white dark:from-amber-950/20 dark:to-[#161b22]">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400">
              Pending Review
            </span>
            <Clock className="h-4 w-4 text-amber-600 dark:text-amber-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-extrabold text-ink-900 dark:text-white">
              {pendingItems.length}
            </span>
            <span className="text-[11px] font-semibold text-amber-700 dark:text-amber-300">In HITL Queue</span>
          </div>
          <div className="mt-1 text-[11px] text-ink-500 dark:text-[#8b949e]">Zero-trust default hold</div>
        </Card>

        <Card className="p-4 sm:p-5 border-emerald-200/80 bg-gradient-to-br from-emerald-50/40 to-white dark:from-emerald-950/20 dark:to-[#161b22]">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
              Verified Proofs
            </span>
            <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-extrabold text-ink-900 dark:text-white">
              {verifiedItems.length}
            </span>
            <span className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-300">1.0x Weight</span>
          </div>
          <div className="mt-1 text-[11px] text-ink-500 dark:text-[#8b949e]">Cryptographically sealed</div>
        </Card>

        <Card className="p-4 sm:p-5 border-rose-200/80 bg-gradient-to-br from-rose-50/40 to-white dark:from-rose-950/20 dark:to-[#161b22]">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-rose-700 dark:text-rose-400">
              Flagged / Rejected
            </span>
            <AlertTriangle className="h-4 w-4 text-rose-600 dark:text-rose-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-extrabold text-ink-900 dark:text-white">
              {rejectedItems.length}
            </span>
            <span className="text-[11px] font-semibold text-rose-700 dark:text-rose-300">Filtered</span>
          </div>
          <div className="mt-1 text-[11px] text-ink-500 dark:text-[#8b949e]">Excluded from matching</div>
        </Card>

        <Card className="p-4 sm:p-5 border-indigo-200/80 bg-gradient-to-br from-indigo-50/40 to-white dark:from-indigo-950/20 dark:to-[#161b22]">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-indigo-700 dark:text-indigo-400">
              Review Efficiency
            </span>
            <Brain className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-extrabold text-ink-900 dark:text-white">
              94%
            </span>
            <span className="text-[11px] font-semibold text-indigo-700 dark:text-indigo-300">AI Pre-Screened</span>
          </div>
          <div className="mt-1 text-[11px] text-ink-500 dark:text-[#8b949e]">Avg turn-around: 3.2 hrs</div>
        </Card>
      </div>

      {/* Filter Tabs & Search */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
          <button
            onClick={() => setActiveTab('pending')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
              activeTab === 'pending'
                ? 'bg-amber-500 text-white shadow-sm'
                : 'bg-white dark:bg-[#161b22] border border-ink-200 dark:border-[#30363d] text-ink-700 dark:text-[#c9d1d9] hover:bg-ink-50 dark:hover:bg-[#21262d]'
            }`}
          >
            <Clock className="h-3.5 w-3.5" />
            <span>Pending Review ({pendingItems.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('verified')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
              activeTab === 'verified'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'bg-white dark:bg-[#161b22] border border-ink-200 dark:border-[#30363d] text-ink-700 dark:text-[#c9d1d9] hover:bg-ink-50 dark:hover:bg-[#21262d]'
            }`}
          >
            <CheckCircle2 className="h-3.5 w-3.5" />
            <span>Verified ({verifiedItems.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('rejected')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
              activeTab === 'rejected'
                ? 'bg-rose-600 text-white shadow-sm'
                : 'bg-white dark:bg-[#161b22] border border-ink-200 dark:border-[#30363d] text-ink-700 dark:text-[#c9d1d9] hover:bg-ink-50 dark:hover:bg-[#21262d]'
            }`}
          >
            <XCircle className="h-3.5 w-3.5" />
            <span>Flagged / Rejected ({rejectedItems.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('all')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition ${
              activeTab === 'all'
                ? 'bg-brand-600 text-white shadow-sm'
                : 'bg-white dark:bg-[#161b22] border border-ink-200 dark:border-[#30363d] text-ink-700 dark:text-[#c9d1d9] hover:bg-ink-50 dark:hover:bg-[#21262d]'
            }`}
          >
            All ({allEvidence.length})
          </button>
        </div>

        {/* Search input & Category dropdown */}
        <div className="flex items-center gap-2">
          <div className="relative flex-1 sm:w-64">
            <Search className="h-3.5 w-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-ink-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search candidate, skill, or issuer…"
              className="input pl-8 py-1.5 text-xs"
            />
          </div>

          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="input py-1.5 text-xs w-32"
          >
            <option value="all">All Types</option>
            <option value="credential">Credential</option>
            <option value="coursework">Coursework</option>
            <option value="project">Project</option>
            <option value="competition">Competition</option>
          </select>
        </div>
      </div>

      {/* Queue List */}
      {filteredList.length === 0 ? (
        <EmptyState
          title="No evidence found in this filter"
          description="Submissions will appear here when students upload coursework, certifications, or projects."
          icon={<ShieldCheck className="h-10 w-10 text-ink-400" />}
        />
      ) : (
        <div className="space-y-3.5">
          {filteredList.map((e) => {
            const student = studentMapLocal.get(e.studentId);
            const audit = e.aiAuditSummary;
            const shortHash = e.evidenceHash
              ? `${e.evidenceHash.slice(0, 10)}...${e.evidenceHash.slice(-6)}`
              : 'pending_seal';

            return (
              <Card
                key={e.id}
                onClick={() => setSelectedEvidenceForModal(e)}
                className={`p-4 sm:p-5 transition hover:shadow-lift cursor-pointer border ${
                  e.verification === 'pending'
                    ? 'border-amber-200 dark:border-amber-900/60 bg-white dark:bg-[#161b22]'
                    : e.verification === 'rejected'
                    ? 'border-rose-200 dark:border-rose-900/60 bg-rose-50/20 dark:bg-[#161b22]'
                    : 'border-ink-200/80 dark:border-[#30363d] bg-white dark:bg-[#161b22]'
                }`}
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  {/* Left: Student info + Evidence details */}
                  <div className="flex items-start gap-3.5 min-w-0 flex-1">
                    {student ? (
                      <Avatar
                        name={student.name}
                        color={student.avatarColor}
                        photoUrl={student.photoUrl}
                        size="md"
                      />
                    ) : (
                      <EvidenceTypeIcon type={e.type} />
                    )}

                    <div className="min-w-0 flex-1 space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-bold text-sm text-ink-900 dark:text-white">
                          {student?.name || 'Unknown Candidate'}
                        </span>
                        <span className="text-xs text-ink-400">·</span>
                        <span className="text-xs text-ink-500 dark:text-[#8b949e]">
                          {student?.university || 'University'}
                        </span>
                        <VerificationPill status={e.verification} />
                      </div>

                      <div className="font-semibold text-ink-800 dark:text-[#c9d1d9] text-sm">
                        {e.title}
                      </div>

                      <div className="text-xs text-ink-500 dark:text-[#8b949e] flex flex-wrap items-center gap-2">
                        <span>Issuer: <strong>{e.issuer}</strong></span>
                        <span>·</span>
                        <span>Date: {new Date(e.date).toLocaleDateString('en-IN', { year: 'numeric', month: 'short' })}</span>
                        <span>·</span>
                        <span className="font-mono text-[11px] text-ink-500">Audit Seal: {shortHash}</span>
                      </div>

                      {/* Demonstrated skills tags */}
                      <div className="pt-1 flex flex-wrap gap-1">
                        {e.skills.map((sId) => (
                          <span
                            key={sId}
                            className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-ink-100 dark:bg-[#21262d] text-ink-700 dark:text-[#c9d1d9]"
                          >
                            {skillMap[sId]?.name || sId}
                          </span>
                        ))}
                      </div>

                      {/* Reviewer signature notice if already verified */}
                      {e.verifiedBy && (
                        <div className="pt-1 text-[11px] font-semibold text-emerald-700 dark:text-emerald-400 flex items-center gap-1">
                          <CheckCircle2 className="h-3 w-3" />
                          <span>Approved by {e.verifiedBy}</span>
                        </div>
                      )}

                      {/* Rejection reason notice */}
                      {e.verification === 'rejected' && e.rejectionReason && (
                        <div className="pt-1 text-[11px] font-semibold text-rose-700 dark:text-rose-400 flex items-center gap-1">
                          <XCircle className="h-3 w-3" />
                          <span>Rejection Reason: {e.rejectionReason}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Right: AI Pre-Audit Summary & Action Buttons */}
                  <div className="flex flex-col sm:flex-row md:flex-col lg:flex-row items-stretch md:items-end lg:items-center gap-2.5 shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-ink-100 dark:border-[#30363d]">
                    {audit ? (
                      <div className="flex items-center gap-2 text-xs bg-ink-50 dark:bg-[#21262d] px-3 py-1.5 rounded-xl border border-ink-200 dark:border-[#30363d]">
                        <Brain className="h-3.5 w-3.5 text-brand-600 dark:text-brand-400" />
                        <span className="font-bold text-ink-800 dark:text-[#c9d1d9]">
                          {audit.confidenceScore}% AI Confidence
                        </span>
                        {audit.nameMatch ? (
                          <span className="text-[10px] text-emerald-700 dark:text-emerald-400 font-bold bg-emerald-50 dark:bg-emerald-950/60 px-1.5 py-0.5 rounded">
                            Name Match
                          </span>
                        ) : (
                          <span className="text-[10px] text-amber-700 dark:text-amber-400 font-bold bg-amber-50 dark:bg-amber-950/60 px-1.5 py-0.5 rounded">
                            Check Recipient
                          </span>
                        )}
                      </div>
                    ) : (
                      <div className="text-[11px] font-mono text-ink-400 px-2">
                        Pre-screened
                      </div>
                    )}

                    <div className="flex items-center gap-2">
                      {e.verification === 'pending' && (
                        <button
                          type="button"
                          onClick={(ev) => handleQuickApprove(e, ev)}
                          className="btn-secondary text-xs py-1.5 px-3 border-emerald-300 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 inline-flex items-center gap-1 shadow-2xs"
                          title="Quick 1-Click Approval as Institutional Placement Chair"
                        >
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          <span>Quick Approve</span>
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={(ev) => {
                          ev.stopPropagation();
                          setSelectedEvidenceForModal(e);
                        }}
                        className="btn-primary text-xs py-1.5 px-3 inline-flex items-center gap-1"
                      >
                        <UserCheck className="h-3.5 w-3.5" />
                        <span>{e.verification === 'pending' ? 'Review & Sign' : 'Inspect Audit'}</span>
                      </button>
                    </div>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* HITL Inspection & Sign-Off Modal */}
      {selectedEvidenceForModal && (
        <HitlVerificationModal
          evidence={selectedEvidenceForModal}
          onClose={() => setSelectedEvidenceForModal(null)}
          onVerified={(updated) => {
            setSelectedEvidenceForModal(updated);
          }}
        />
      )}
    </div>
  );
}
