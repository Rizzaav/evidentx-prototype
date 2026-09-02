import { useState, useMemo } from 'react';
import {
  ArrowRight,
  Building2,
  MapPin,
  Clock,
  Wallet,
  Search,
  Shield,
  ChevronDown,
  Scale,
  Download,
  X,
  CheckCircle2,
  AlertCircle,
  XCircle,
  FileBadge,
  CheckSquare,
  Square,
  Sparkles,
  Columns,
  ListFilter,
  UserCheck,
  Send,
  RotateCcw,
} from 'lucide-react';
import { useRouter } from '@/lib/router';
import {
  PageHeader,
  Card,
  Chip,
  SkillBadge,
  Avatar,
  EmptyState,
  Section,
  MatchRing,
} from '@/components/ui';
import { opportunityMap, studentMap, skillMap, evidenceMap } from '@/data/mockData';
import { useCustomOpportunities } from '@/lib/customOpportunities';
import { useApplications } from '@/lib/applications';
import { useDebounce } from '@/lib/useDebounce';
import { rankStudentsForOpportunity, matchStudentToOpportunity } from '@/lib/matchingEngine';
import type { MatchResult, ApplicationStatus, Opportunity } from '@/types';

export function CandidateMatchingPage({ opportunityId }: { opportunityId?: string }) {
  const { navigate } = useRouter();
  const { opportunities } = useCustomOpportunities();
  const { hasApplied, getApplication, updateStatus } = useApplications();
  const [selectedOpp, setSelectedOpp] = useState<string>(
    opportunityId ?? opportunities[0]?.id ?? 'op_fe_intern'
  );
  const [query, setQuery] = useState('');
  const debouncedQuery = useDebounce(query, 180);
  const [filterApplicantsOnly, setFilterApplicantsOnly] = useState(false);
  const [statusStage, setStatusStage] = useState<'all' | 'Shortlisted' | 'Interviewing' | 'Offered' | 'Rejected' | 'Applied'>('all');
  const [viewMode, setViewMode] = useState<'list' | 'stages'>('list');

  // Bulk selection & comparison state
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);
  const [showCompareModal, setShowCompareModal] = useState(false);
  const [bulkFeedback, setBulkFeedback] = useState<string | null>(null);

  const opp =
    opportunityMap[selectedOpp] ??
    opportunities.find((o) => o.id === selectedOpp) ??
    opportunities[0];

  const ranked = useMemo(() => (opp ? rankStudentsForOpportunity(opp) : []), [opp]);

  // Stage Buckets for the Pipeline Area
  const stageBuckets = useMemo(() => {
    if (!opp) return { applied: [], shortlisted: [], interviewing: [], offered: [], rejected: [] };
    
    const applied: MatchResult[] = [];
    const shortlisted: MatchResult[] = [];
    const interviewing: MatchResult[] = [];
    const offered: MatchResult[] = [];
    const rejected: MatchResult[] = [];

    for (const r of ranked) {
      const app = getApplication(r.studentId, opp.id);
      if (!app) {
        applied.push(r);
      } else if (app.status === 'Shortlisted') {
        shortlisted.push(r);
      } else if (app.status === 'Interviewing') {
        interviewing.push(r);
      } else if (app.status === 'Offered') {
        offered.push(r);
      } else if (app.status === 'Rejected') {
        rejected.push(r);
      } else {
        applied.push(r);
      }
    }

    return { applied, shortlisted, interviewing, offered, rejected };
  }, [ranked, opp, getApplication]);

  const list = useMemo(() => {
    let res = ranked;
    if (filterApplicantsOnly && opp) {
      res = res.filter((r) => hasApplied(r.studentId, opp.id));
    }
    if (statusStage !== 'all' && opp) {
      if (statusStage === 'Applied') {
        res = res.filter((r) => {
          const app = getApplication(r.studentId, opp.id);
          return !app || app.status === 'Applied' || app.status === 'Reviewing';
        });
      } else {
        res = res.filter((r) => {
          const app = getApplication(r.studentId, opp.id);
          return app?.status === statusStage;
        });
      }
    }
    if (debouncedQuery.trim()) {
      const q = debouncedQuery.toLowerCase().trim();
      res = res.filter((r) => {
        const s = studentMap[r.studentId];
        if (!s) return false;
        return (
          s.name.toLowerCase().includes(q) ||
          s.program.toLowerCase().includes(q) ||
          s.university?.toLowerCase().includes(q)
        );
      });
    }
    return res;
  }, [ranked, filterApplicantsOnly, statusStage, opp, hasApplied, getApplication, debouncedQuery]);

  // Status Change Handler with notification feedback
  const handleSingleStatusChange = (studentId: string, status: ApplicationStatus) => {
    if (!opp) return;
    const s = studentMap[studentId];
    updateStatus(studentId, opp.id, status);
    setBulkFeedback(`Moved ${s?.name ?? 'candidate'} to "${status}" · Notification sent to student!`);
    setTimeout(() => setBulkFeedback(null), 4000);
  };

  // Bulk Selection Helpers
  const toggleSelectStudent = (id: string) => {
    setSelectedStudentIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const isAllSelected = list.length > 0 && list.every((r) => selectedStudentIds.includes(r.studentId));

  const toggleSelectAll = () => {
    if (isAllSelected) {
      setSelectedStudentIds([]);
    } else {
      setSelectedStudentIds(list.map((r) => r.studentId));
    }
  };

  const clearSelection = () => {
    setSelectedStudentIds([]);
  };

  const handleBulkStatusChange = (status: ApplicationStatus) => {
    if (!opp || selectedStudentIds.length === 0) return;
    for (const studentId of selectedStudentIds) {
      updateStatus(studentId, opp.id, status);
    }
    setBulkFeedback(`Updated ${selectedStudentIds.length} candidate(s) to "${status}" · Real-time notifications dispatched!`);
    setTimeout(() => setBulkFeedback(null), 4000);
  };

  const handleExportCSV = () => {
    if (!opp) return;
    const candidatesToExport =
      selectedStudentIds.length > 0
        ? list.filter((r) => selectedStudentIds.includes(r.studentId))
        : list;

    const headers = [
      'Rank',
      'Candidate Name',
      'Email',
      'University',
      'Program',
      'Match Score (%)',
      'Application Status',
      'Matched Skills',
      'Missing Skills',
    ];

    const rows = candidatesToExport.map((r, i) => {
      const student = studentMap[r.studentId];
      const app = getApplication(r.studentId, opp.id);
      const matched = r.matchedSkills.map((m) => skillMap[m.skillId]?.name ?? m.skillId).join('; ');
      const missing = r.missingSkills.map((m) => skillMap[m.skillId]?.name ?? m.skillId).join('; ');
      return [
        i + 1,
        `"${student?.name ?? r.studentId}"`,
        `"${student?.email ?? ''}"`,
        `"${student?.university ?? ''}"`,
        `"${student?.program ?? ''}"`,
        r.matchScore,
        `"${app?.status ?? (hasApplied(r.studentId, opp.id) ? 'Applied' : 'Not Applied')}"`,
        `"${matched}"`,
        `"${missing}"`,
      ];
    });

    const csvContent = [headers.join(','), ...rows.map((row) => row.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `Candidate_Evaluation_${opp.title.replace(/\s+/g, '_')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    setBulkFeedback(`Exported ${candidatesToExport.length} candidate record(s) to CSV.`);
    setTimeout(() => setBulkFeedback(null), 3500);
  };

  if (!opp) return null;

  return (
    <div className="relative pb-24">
      <PageHeader
        title="Candidate Matching"
        subtitle="Ranked candidates with explainable match scores & bulk decision tools"
        right={
          <div className="flex items-center gap-2">
            <button onClick={handleExportCSV} className="btn-secondary text-xs" title="Export all ranked candidates">
              <Download className="h-3.5 w-3.5" /> Export CSV
            </button>
            <button onClick={() => navigate('/org/create')} className="btn-primary text-xs">
              + New Opportunity
            </button>
          </div>
        }
      />

      {/* Opportunity selector */}
      <div className="mb-5 flex items-center gap-2 overflow-x-auto pb-2">
        <span className="text-xs font-bold uppercase tracking-wide text-ink-400 flex-shrink-0">
          Opportunity:
        </span>
        {opportunities.map((o) => {
          const active = o.id === selectedOpp;
          return (
            <button
              key={o.id}
              onClick={() => {
                setSelectedOpp(o.id);
                setSelectedStudentIds([]);
              }}
              className={`flex-shrink-0 rounded-xl border px-3 py-2 text-xs font-semibold transition ${
                active
                  ? 'border-accent-300 bg-accent-50 text-accent-700'
                  : 'border-ink-200 bg-white text-ink-600 hover:bg-ink-50'
              }`}
            >
              {o.title}
            </button>
          );
        })}
      </div>

      {/* Opportunity header */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-ink-900 to-brand-950 p-6 text-white sm:p-8">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <Chip color="brand">
              <span className="text-brand-700">{opp.type}</span>
            </Chip>
            <h2 className="mt-2 font-display text-xl font-extrabold">{opp.title}</h2>
            <div className="mt-1 flex flex-wrap items-center gap-3 text-sm text-white/80">
              <span className="inline-flex items-center gap-1">
                <Building2 className="h-4 w-4" /> {opp.organization}
              </span>
              <span className="inline-flex items-center gap-1">
                <MapPin className="h-4 w-4" /> {opp.location}
              </span>
              <span className="inline-flex items-center gap-1">
                <Clock className="h-4 w-4" /> {opp.duration}
              </span>
              <span className="inline-flex items-center gap-1">
                <Wallet className="h-4 w-4" /> {opp.stipend}
              </span>
            </div>
          </div>
          <div className="flex flex-shrink-0 gap-3">
            <div className="rounded-xl bg-white/10 p-3 text-center">
              <div className="text-2xl font-extrabold text-accent-400">
                {ranked.filter((r) => r.matchScore >= 75).length}
              </div>
              <div className="text-[10px] font-semibold uppercase text-white/60">Strong</div>
            </div>
            <div className="rounded-xl bg-white/10 p-3 text-center">
              <div className="text-2xl font-extrabold text-amber-400">
                {ranked.filter((r) => r.matchScore >= 50 && r.matchScore < 75).length}
              </div>
              <div className="text-[10px] font-semibold uppercase text-white/60">Good</div>
            </div>
            <div className="rounded-xl bg-white/10 p-3 text-center">
              <div className="text-2xl font-extrabold text-rose-400">
                {ranked.filter((r) => r.matchScore < 50).length}
              </div>
              <div className="text-[10px] font-semibold uppercase text-white/60">Weak</div>
            </div>
          </div>
        </div>
        <div className="mt-4 flex flex-wrap gap-1.5">
          <span className="text-[11px] font-bold uppercase text-white/60 mr-1">Required:</span>
          {opp.requiredSkills.map((id) => (
            <span key={id} className="rounded-md bg-white/10 px-2 py-0.5 text-xs">
              {skillMap[id]?.name ?? id}
            </span>
          ))}
          <span className="text-[11px] font-bold uppercase text-white/60 ml-2 mr-1">Preferred:</span>
          {opp.preferredSkills.map((id) => (
            <span key={id} className="rounded-md bg-white/5 px-2 py-0.5 text-xs text-white/70">
              {skillMap[id]?.name ?? id}
            </span>
          ))}
        </div>
      </div>

      {/* Notification Toast */}
      {bulkFeedback && (
        <div className="mt-4 flex items-center justify-between rounded-xl bg-accent-50 border border-accent-200 px-4 py-2.5 text-xs font-semibold text-accent-800 animate-fade-in shadow-soft">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-accent-600" />
            <span>{bulkFeedback}</span>
          </div>
          <button onClick={() => setBulkFeedback(null)} className="text-accent-600 hover:text-accent-800">
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      {/* Stage Filter Tabs & View Switcher */}
      <div className="mt-5 space-y-3">
        {/* Pipeline Stage Tabs */}
        <div className="flex items-center justify-between gap-3 flex-wrap border-b border-ink-100 pb-3">
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 max-w-full">
            <button
              onClick={() => setStatusStage('all')}
              className={`rounded-xl px-3 py-1.5 text-xs font-bold transition whitespace-nowrap ${
                statusStage === 'all'
                  ? 'bg-ink-900 text-white shadow-soft'
                  : 'bg-white border border-ink-200 text-ink-700 hover:bg-ink-50'
              }`}
            >
              All Matched ({ranked.length})
            </button>
            <button
              onClick={() => setStatusStage('Shortlisted')}
              className={`rounded-xl px-3 py-1.5 text-xs font-bold transition flex items-center gap-1.5 whitespace-nowrap ${
                statusStage === 'Shortlisted'
                  ? 'bg-brand-600 text-white shadow-soft'
                  : 'bg-white border border-ink-200 text-brand-700 hover:bg-brand-50'
              }`}
            >
              <span>⭐ Shortlisted</span>
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-extrabold ${statusStage === 'Shortlisted' ? 'bg-white/25 text-white' : 'bg-brand-100 text-brand-800'}`}>
                {stageBuckets.shortlisted.length}
              </span>
            </button>
            <button
              onClick={() => setStatusStage('Interviewing')}
              className={`rounded-xl px-3 py-1.5 text-xs font-bold transition flex items-center gap-1.5 whitespace-nowrap ${
                statusStage === 'Interviewing'
                  ? 'bg-amber-600 text-white shadow-soft'
                  : 'bg-white border border-ink-200 text-amber-800 hover:bg-amber-50'
              }`}
            >
              <span>🎙️ Interviewing</span>
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-extrabold ${statusStage === 'Interviewing' ? 'bg-white/25 text-white' : 'bg-amber-100 text-amber-900'}`}>
                {stageBuckets.interviewing.length}
              </span>
            </button>
            <button
              onClick={() => setStatusStage('Offered')}
              className={`rounded-xl px-3 py-1.5 text-xs font-bold transition flex items-center gap-1.5 whitespace-nowrap ${
                statusStage === 'Offered'
                  ? 'bg-emerald-600 text-white shadow-soft'
                  : 'bg-white border border-ink-200 text-emerald-800 hover:bg-emerald-50'
              }`}
            >
              <span>🏆 Offered</span>
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-extrabold ${statusStage === 'Offered' ? 'bg-white/25 text-white' : 'bg-emerald-100 text-emerald-900'}`}>
                {stageBuckets.offered.length}
              </span>
            </button>
            <button
              onClick={() => setStatusStage('Applied')}
              className={`rounded-xl px-3 py-1.5 text-xs font-bold transition flex items-center gap-1.5 whitespace-nowrap ${
                statusStage === 'Applied'
                  ? 'bg-accent-600 text-white shadow-soft'
                  : 'bg-white border border-ink-200 text-accent-800 hover:bg-accent-50'
              }`}
            >
              <span>📋 Applied / In Review</span>
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-extrabold ${statusStage === 'Applied' ? 'bg-white/25 text-white' : 'bg-accent-100 text-accent-900'}`}>
                {stageBuckets.applied.length}
              </span>
            </button>
            <button
              onClick={() => setStatusStage('Rejected')}
              className={`rounded-xl px-3 py-1.5 text-xs font-bold transition flex items-center gap-1.5 whitespace-nowrap ${
                statusStage === 'Rejected'
                  ? 'bg-rose-600 text-white shadow-soft'
                  : 'bg-white border border-ink-200 text-rose-700 hover:bg-rose-50'
              }`}
            >
              <span>❌ Rejected</span>
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-extrabold ${statusStage === 'Rejected' ? 'bg-white/25 text-white' : 'bg-rose-100 text-rose-800'}`}>
                {stageBuckets.rejected.length}
              </span>
            </button>
          </div>

          {/* View Mode Toggle */}
          <div className="flex items-center gap-1 bg-ink-100 p-1 rounded-xl">
            <button
              onClick={() => setViewMode('list')}
              className={`flex items-center gap-1.5 px-3 py-1 text-xs font-bold rounded-lg transition ${
                viewMode === 'list' ? 'bg-white text-ink-900 shadow-2xs' : 'text-ink-600 hover:text-ink-900'
              }`}
            >
              <ListFilter className="h-3.5 w-3.5" />
              <span>Ranked List</span>
            </button>
            <button
              onClick={() => setViewMode('stages')}
              className={`flex items-center gap-1.5 px-3 py-1 text-xs font-bold rounded-lg transition ${
                viewMode === 'stages' ? 'bg-white text-brand-700 shadow-2xs' : 'text-ink-600 hover:text-ink-900'
              }`}
            >
              <Columns className="h-3.5 w-3.5" />
              <span>Pipeline Stages</span>
            </button>
          </div>
        </div>

        {/* Search and selection controls */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search candidates by name, program or university…"
              className="input pl-9"
            />
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {list.length > 0 && (
              <button
                onClick={toggleSelectAll}
                className="inline-flex items-center gap-1.5 rounded-xl border border-ink-200 bg-white px-3 py-1.5 text-xs font-semibold text-ink-700 hover:bg-ink-50 transition"
              >
                {isAllSelected ? <CheckSquare className="h-3.5 w-3.5 text-brand-600" /> : <Square className="h-3.5 w-3.5 text-ink-400" />}
                <span>{isAllSelected ? 'Deselect All' : 'Select All'}</span>
              </button>
            )}
            <button
              onClick={() => setFilterApplicantsOnly((f) => !f)}
              className={`rounded-xl px-3 py-1.5 text-xs font-semibold transition ${
                filterApplicantsOnly
                  ? 'bg-brand-600 text-white shadow-2xs'
                  : 'bg-white border border-ink-200 text-ink-700 hover:bg-ink-50'
              }`}
            >
              {filterApplicantsOnly ? '✓ Applicants Only' : 'Filter Applicants Only'}
            </button>
          </div>
        </div>
      </div>

      {/* VIEW 1: PIPELINE STAGES VIEW */}
      {viewMode === 'stages' ? (
        <div className="mt-6 space-y-6">
          {/* ⭐ Shortlisted Section */}
          <div className="rounded-2xl border-2 border-brand-200 bg-brand-50/20 p-5 shadow-soft">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-brand-600 text-white font-bold text-xs shadow-2xs">
                  ⭐
                </span>
                <h3 className="font-display text-base font-bold text-brand-950">
                  Shortlisted Candidates ({stageBuckets.shortlisted.length})
                </h3>
              </div>
              <span className="text-xs font-semibold text-brand-700 bg-brand-100/70 px-2.5 py-0.5 rounded-full border border-brand-200">
                Ready for Technical Evaluation
              </span>
            </div>

            {stageBuckets.shortlisted.length === 0 ? (
              <div className="rounded-xl border border-dashed border-brand-200 bg-white p-6 text-center text-xs text-brand-700">
                No candidates shortlisted yet. Click <strong className="font-semibold">"Shortlist"</strong> on any candidate below to move them to this area!
              </div>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {stageBuckets.shortlisted.map((r) => (
                  <StageCandidateCard
                    key={r.studentId}
                    result={r}
                    oppId={opp.id}
                    stage="Shortlisted"
                    onUpdateStatus={(status) => handleSingleStatusChange(r.studentId, status)}
                    onDetails={() => navigate(`/org/candidates/${opp.id}/${r.studentId}`)}
                  />
                ))}
              </div>
            )}
          </div>

          {/* 🎙️ Interviewing Section */}
          <div className="rounded-2xl border-2 border-amber-200 bg-amber-50/20 p-5 shadow-soft">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-600 text-white font-bold text-xs shadow-2xs">
                  🎙️
                </span>
                <h3 className="font-display text-base font-bold text-amber-950">
                  Interview Stage ({stageBuckets.interviewing.length})
                </h3>
              </div>
              <span className="text-xs font-semibold text-amber-800 bg-amber-100/70 px-2.5 py-0.5 rounded-full border border-amber-200">
                Interview Rounds Active
              </span>
            </div>

            {stageBuckets.interviewing.length === 0 ? (
              <div className="rounded-xl border border-dashed border-amber-200 bg-white p-6 text-center text-xs text-amber-700">
                No candidates in interview stage.
              </div>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {stageBuckets.interviewing.map((r) => (
                  <StageCandidateCard
                    key={r.studentId}
                    result={r}
                    oppId={opp.id}
                    stage="Interviewing"
                    onUpdateStatus={(status) => handleSingleStatusChange(r.studentId, status)}
                    onDetails={() => navigate(`/org/candidates/${opp.id}/${r.studentId}`)}
                  />
                ))}
              </div>
            )}
          </div>

          {/* 🏆 Offered Section */}
          <div className="rounded-2xl border-2 border-emerald-200 bg-emerald-50/20 p-5 shadow-soft">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-600 text-white font-bold text-xs shadow-2xs">
                  🏆
                </span>
                <h3 className="font-display text-base font-bold text-emerald-950">
                  Offered / Hired ({stageBuckets.offered.length})
                </h3>
              </div>
              <span className="text-xs font-semibold text-emerald-800 bg-emerald-100/70 px-2.5 py-0.5 rounded-full border border-emerald-200">
                Official Offers Extended
              </span>
            </div>

            {stageBuckets.offered.length === 0 ? (
              <div className="rounded-xl border border-dashed border-emerald-200 bg-white p-6 text-center text-xs text-emerald-700">
                No offers extended yet.
              </div>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {stageBuckets.offered.map((r) => (
                  <StageCandidateCard
                    key={r.studentId}
                    result={r}
                    oppId={opp.id}
                    stage="Offered"
                    onUpdateStatus={(status) => handleSingleStatusChange(r.studentId, status)}
                    onDetails={() => navigate(`/org/candidates/${opp.id}/${r.studentId}`)}
                  />
                ))}
              </div>
            )}
          </div>

          {/* 📋 Applied & Under Review */}
          <div className="rounded-2xl border border-ink-200 bg-white p-5 shadow-soft">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-ink-800 text-white font-bold text-xs shadow-2xs">
                  📋
                </span>
                <h3 className="font-display text-base font-bold text-ink-900">
                  Applied / Under Review ({stageBuckets.applied.length})
                </h3>
              </div>
              <span className="text-xs font-semibold text-ink-500 bg-ink-100 px-2.5 py-0.5 rounded-full">
                New Submissions
              </span>
            </div>

            {stageBuckets.applied.length === 0 ? (
              <div className="rounded-xl border border-dashed border-ink-200 bg-ink-50/50 p-6 text-center text-xs text-ink-500">
                No new applications pending review.
              </div>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {stageBuckets.applied.map((r) => (
                  <StageCandidateCard
                    key={r.studentId}
                    result={r}
                    oppId={opp.id}
                    stage="Applied"
                    onUpdateStatus={(status) => handleSingleStatusChange(r.studentId, status)}
                    onDetails={() => navigate(`/org/candidates/${opp.id}/${r.studentId}`)}
                  />
                ))}
              </div>
            )}
          </div>

          {/* ❌ Rejected / Archived */}
          {stageBuckets.rejected.length > 0 && (
            <div className="rounded-2xl border border-rose-200 bg-rose-50/15 p-5 shadow-soft">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-rose-600 text-white font-bold text-xs shadow-2xs">
                    ❌
                  </span>
                  <h3 className="font-display text-base font-bold text-rose-950">
                    Archived / Rejected ({stageBuckets.rejected.length})
                  </h3>
                </div>
              </div>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {stageBuckets.rejected.map((r) => (
                  <StageCandidateCard
                    key={r.studentId}
                    result={r}
                    oppId={opp.id}
                    stage="Rejected"
                    onUpdateStatus={(status) => handleSingleStatusChange(r.studentId, status)}
                    onDetails={() => navigate(`/org/candidates/${opp.id}/${r.studentId}`)}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      ) : (
        /* VIEW 2: RANKED LIST VIEW */
        <Section title={`Candidates (${list.length})`}>
          {list.length === 0 ? (
            <EmptyState
              title="No candidates found in this stage"
              description="Try selecting 'All Matched' or clearing your search filters."
              icon={<Search className="h-10 w-10" />}
            />
          ) : (
            <div className="space-y-3">
              {list.map((r, i) => {
                const app = getApplication(r.studentId, opp.id);
                const isSelected = selectedStudentIds.includes(r.studentId);
                return (
                  <CandidateRow
                    key={r.studentId}
                    result={r}
                    rank={i + 1}
                    oppId={opp.id}
                    application={app}
                    isSelected={isSelected}
                    onToggleSelect={() => toggleSelectStudent(r.studentId)}
                    onUpdateStatus={(status) => handleSingleStatusChange(r.studentId, status)}
                    onDetails={() => navigate(`/org/candidates/${opp.id}/${r.studentId}`)}
                  />
                );
              })}
            </div>
          )}
        </Section>
      )}

      {/* Floating Bulk Action Bar */}
      {selectedStudentIds.length > 0 && (
        <div className="fixed bottom-5 left-1/2 -translate-x-1/2 z-40 flex max-w-2xl w-[92%] items-center justify-between rounded-2xl bg-ink-950 text-white px-4 py-3 shadow-2xl border border-ink-800 animate-slide-up backdrop-blur-md">
          <div className="flex items-center gap-3">
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-brand-500 text-xs font-bold">
              {selectedStudentIds.length}
            </span>
            <span className="text-xs font-semibold hidden sm:inline text-white/90">
              candidate{selectedStudentIds.length > 1 ? 's' : ''} selected
            </span>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2">
            <button
              onClick={() => setShowCompareModal(true)}
              disabled={selectedStudentIds.length < 2 || selectedStudentIds.length > 4}
              title={
                selectedStudentIds.length < 2
                  ? 'Select at least 2 candidates to compare'
                  : selectedStudentIds.length > 4
                  ? 'Select at most 4 candidates to compare'
                  : 'Compare selected candidates side-by-side'
              }
              className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold transition ${
                selectedStudentIds.length >= 2 && selectedStudentIds.length <= 4
                  ? 'bg-accent-500 text-ink-950 hover:bg-accent-400 cursor-pointer'
                  : 'bg-white/10 text-white/40 cursor-not-allowed'
              }`}
            >
              <Scale className="h-3.5 w-3.5" />
              <span>Compare {selectedStudentIds.length >= 2 && selectedStudentIds.length <= 4 ? `(${selectedStudentIds.length})` : ''}</span>
            </button>

            <div className="h-4 w-px bg-white/20 hidden sm:block" />

            <button
              onClick={() => handleBulkStatusChange('Shortlisted')}
              className="rounded-lg bg-accent-600 hover:bg-accent-700 px-2.5 py-1.5 text-xs font-semibold transition text-white"
            >
              Shortlist
            </button>
            <button
              onClick={() => handleBulkStatusChange('Interviewing')}
              className="rounded-lg bg-brand-600 hover:bg-brand-700 px-2.5 py-1.5 text-xs font-semibold transition text-white"
            >
              Interview
            </button>
            <button
              onClick={() => handleBulkStatusChange('Offered')}
              className="rounded-lg bg-emerald-600 hover:bg-emerald-700 px-2.5 py-1.5 text-xs font-semibold transition text-white"
            >
              Offer
            </button>
            <button
              onClick={() => handleBulkStatusChange('Rejected')}
              className="rounded-lg bg-rose-600 hover:bg-rose-700 px-2.5 py-1.5 text-xs font-semibold transition text-white"
            >
              Reject
            </button>

            <button
              onClick={clearSelection}
              className="p-1.5 text-white/60 hover:text-white transition"
              title="Clear selection"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* Side-by-Side Candidate Comparison Modal */}
      {showCompareModal && (
        <CandidateComparisonModal
          opp={opp}
          studentIds={selectedStudentIds.slice(0, 4)}
          onClose={() => setShowCompareModal(false)}
          onUpdateStatus={(studentId, status) => updateStatus(studentId, opp.id, status)}
        />
      )}

      {/* Fairness note */}
      <Card className="mt-4 p-4 bg-accent-50 border-accent-100">
        <div className="flex items-center gap-2">
          <Shield className="h-4 w-4 text-accent-600" />
          <span className="text-sm font-semibold text-accent-800">Fair matching active</span>
        </div>
        <p className="mt-1 text-xs text-accent-700">
          Rankings use only demonstrated skills, verified evidence and proficiency. No protected attributes
          (gender, caste, religion, race, appearance, income) are considered.
        </p>
      </Card>
    </div>
  );
}

function CandidateRow({
  result,
  rank,
  oppId,
  application,
  isSelected,
  onToggleSelect,
  onUpdateStatus,
  onDetails,
}: {
  result: MatchResult;
  rank: number;
  oppId: string;
  application?: ReturnType<typeof useApplications> extends { getApplication: (...args: any[]) => infer R }
    ? R
    : any;
  isSelected: boolean;
  onToggleSelect: () => void;
  onUpdateStatus: (status: ApplicationStatus) => void;
  onDetails: () => void;
}) {
  const student = studentMap[result.studentId];
  const [expanded, setExpanded] = useState(false);
  if (!student) return null;

  const color =
    result.matchScore >= 75
      ? 'bg-accent-500'
      : result.matchScore >= 50
      ? 'bg-amber-500'
      : 'bg-rose-500';

  const statusColors: Record<string, 'brand' | 'accent' | 'emerald' | 'amber' | 'rose' | 'gray'> = {
    Applied: 'brand',
    Reviewing: 'amber',
    Shortlisted: 'accent',
    Interviewing: 'brand',
    Offered: 'emerald',
    Rejected: 'rose',
  };

  return (
    <Card className={`overflow-hidden transition ${isSelected ? 'ring-2 ring-brand-500 border-brand-300 bg-brand-50/10' : ''}`}>
      <div className="flex w-full items-center gap-3 sm:gap-4 p-4 text-left hover:bg-ink-50/50 transition">
        {/* Selection Checkbox */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onToggleSelect();
          }}
          className="p-1 text-ink-400 hover:text-brand-600 transition flex-shrink-0"
          title={isSelected ? 'Deselect candidate' : 'Select candidate'}
        >
          {isSelected ? (
            <CheckSquare className="h-5 w-5 text-brand-600" />
          ) : (
            <Square className="h-5 w-5 text-ink-300 hover:text-ink-500" />
          )}
        </button>

        <span
          className={`inline-flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full text-xs font-bold ${
            rank === 1 ? 'bg-amber-100 text-amber-700' : 'bg-ink-100 text-ink-600'
          }`}
        >
          {rank}
        </span>
        <Avatar name={student.name} color={student.avatarColor} size="md" />
        <div className="min-w-0 flex-1 cursor-pointer" onClick={() => setExpanded((e) => !e)}>
          <div className="flex items-center gap-2">
            <span className="font-semibold text-ink-900 truncate">{student.name}</span>
            {application && (
              <Chip color={statusColors[application.status] ?? 'brand'}>{application.status}</Chip>
            )}
          </div>
          <div className="text-xs text-ink-500 truncate">
            {student.program} · {student.university}
          </div>
          <div className="mt-1.5 flex flex-wrap gap-1">
            {result.matchedSkills.slice(0, 3).map((m) => (
              <Chip key={m.skillId} color="emerald">
                {skillMap[m.skillId]?.name ?? m.skillId}
              </Chip>
            ))}
            {result.missingSkills.length > 0 && (
              <Chip color="rose">{result.missingSkills.length} missing</Chip>
            )}
          </div>
        </div>
        <div className="flex flex-shrink-0 items-center gap-3">
          <div
            className={`flex h-12 w-12 items-center justify-center rounded-xl ${color} text-white font-extrabold shadow-soft`}
          >
            {result.matchScore}%
          </div>
          <button
            onClick={() => setExpanded((e) => !e)}
            className="p-1 text-ink-400 hover:text-ink-600"
            aria-label="Toggle candidate details"
          >
            <ChevronDown className={`h-4 w-4 transition ${expanded ? 'rotate-180' : ''}`} />
          </button>
        </div>
      </div>

      {expanded && (
        <div className="border-t border-ink-100 p-4 bg-ink-50/30 animate-fade-in">
          <p className="text-sm text-ink-700">{result.explanation}</p>

          {/* Quick status recruiter controls */}
          <div className="mt-3 flex flex-wrap items-center gap-2 rounded-xl bg-white p-3 border border-ink-100">
            <span className="text-xs font-bold uppercase tracking-wide text-ink-500">
              Recruiter action:
            </span>
            <button
              onClick={() => onUpdateStatus('Shortlisted')}
              className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition ${
                application?.status === 'Shortlisted'
                  ? 'bg-accent-600 text-white'
                  : 'bg-accent-50 text-accent-700 hover:bg-accent-100'
              }`}
            >
              Shortlist
            </button>
            <button
              onClick={() => onUpdateStatus('Interviewing')}
              className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition ${
                application?.status === 'Interviewing'
                  ? 'bg-brand-600 text-white'
                  : 'bg-brand-50 text-brand-700 hover:bg-brand-100'
              }`}
            >
              Interview
            </button>
            <button
              onClick={() => onUpdateStatus('Offered')}
              className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition ${
                application?.status === 'Offered'
                  ? 'bg-emerald-600 text-white'
                  : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
              }`}
            >
              Offer
            </button>
            <button
              onClick={() => onUpdateStatus('Rejected')}
              className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition ${
                application?.status === 'Rejected'
                  ? 'bg-rose-600 text-white'
                  : 'bg-rose-50 text-rose-700 hover:bg-rose-100'
              }`}
            >
              Reject
            </button>
          </div>

          <div className="mt-3 grid gap-3 sm:grid-cols-3">
            <div>
              <div className="text-[11px] font-bold uppercase text-accent-600">
                Matched ({result.matchedSkills.length})
              </div>
              <div className="mt-1 flex flex-wrap gap-1">
                {result.matchedSkills.map((m) => (
                  <SkillBadge
                    key={m.skillId}
                    name={skillMap[m.skillId]?.name ?? m.skillId}
                    proficiency={m.studentProficiency}
                    size="sm"
                  />
                ))}
              </div>
            </div>
            {result.partialSkills.length > 0 && (
              <div>
                <div className="text-[11px] font-bold uppercase text-amber-600">
                  Partial ({result.partialSkills.length})
                </div>
                <div className="mt-1 flex flex-wrap gap-1">
                  {result.partialSkills.map((m) => (
                    <SkillBadge
                      key={m.skillId}
                      name={skillMap[m.skillId]?.name ?? m.skillId}
                      proficiency={m.studentProficiency}
                      size="sm"
                    />
                  ))}
                </div>
              </div>
            )}
            {result.missingSkills.length > 0 && (
              <div>
                <div className="text-[11px] font-bold uppercase text-rose-600">
                  Missing ({result.missingSkills.length})
                </div>
                <div className="mt-1 flex flex-wrap gap-1">
                  {result.missingSkills.map((m) => (
                    <SkillBadge
                      key={m.skillId}
                      name={skillMap[m.skillId]?.name ?? m.skillId}
                      size="sm"
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
          <button onClick={onDetails} className="mt-4 btn-primary text-xs">
            View full candidate profile <ArrowRight className="h-3 w-3" />
          </button>
        </div>
      )}
    </Card>
  );
}

/**
 * Side-by-Side Multi-Candidate Comparison Modal
 */
function CandidateComparisonModal({
  opp,
  studentIds,
  onClose,
  onUpdateStatus,
}: {
  opp: Opportunity;
  studentIds: string[];
  onClose: () => void;
  onUpdateStatus: (studentId: string, status: ApplicationStatus) => void;
}) {
  const { navigate } = useRouter();
  const { getApplication } = useApplications();

  const candidatesData = useMemo(() => {
    return studentIds.map((id) => {
      const student = studentMap[id];
      const match = matchStudentToOpportunity(id, opp);
      const app = getApplication(id, opp.id);
      return { id, student, match, app };
    });
  }, [studentIds, opp, getApplication]);

  const allSkills = useMemo(() => {
    const req = opp.requiredSkills.map((id) => ({ id, name: skillMap[id]?.name ?? id, required: true }));
    const pref = opp.preferredSkills
      .filter((id) => !opp.requiredSkills.includes(id))
      .map((id) => ({ id, name: skillMap[id]?.name ?? id, required: false }));
    return [...req, ...pref];
  }, [opp]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-3 sm:p-6 animate-fade-in">
      <div className="relative flex max-h-[92vh] w-full max-w-6xl flex-col rounded-3xl bg-white shadow-2xl border border-ink-200 overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-ink-100 px-6 py-4 bg-ink-50/50">
          <div>
            <div className="flex items-center gap-2">
              <Scale className="h-5 w-5 text-accent-600" />
              <h2 className="font-display text-lg font-bold text-ink-900">
                Candidate Comparison Matrix
              </h2>
            </div>
            <p className="text-xs text-ink-500 mt-0.5">
              Evaluating {candidatesData.length} candidates side-by-side for <span className="font-semibold text-ink-800">{opp.title}</span>
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-full p-1.5 text-ink-400 hover:bg-ink-100 hover:text-ink-700 transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Modal Scrollable Content */}
        <div className="flex-1 overflow-x-auto overflow-y-auto p-6">
          <div className="min-w-[720px]">
            {/* Candidate Header Cards */}
            <div className="grid grid-cols-[200px_repeat(auto-fit,minmax(200px,1fr))] gap-4 border-b border-ink-200 pb-5">
              <div className="flex flex-col justify-end text-xs font-bold uppercase tracking-wider text-ink-400">
                Candidate Profile
              </div>
              {candidatesData.map(({ student, match, app, id }) => (
                <div key={id} className="rounded-2xl border border-ink-200 bg-ink-50/30 p-4 text-center">
                  <div className="flex justify-center">
                    <Avatar name={student?.name ?? id} color={student?.avatarColor ?? 'from-brand-500 to-brand-700'} size="lg" />
                  </div>
                  <h3 className="mt-2 font-display text-sm font-bold text-ink-900 truncate">
                    {student?.name}
                  </h3>
                  <div className="text-xs text-ink-500 truncate">{student?.university}</div>
                  <div className="mt-3 flex items-center justify-center gap-2">
                    <div className="inline-flex items-center justify-center rounded-xl bg-ink-900 px-3 py-1 text-xs font-extrabold text-white">
                      {match.matchScore}% Match
                    </div>
                  </div>
                  <div className="mt-3 flex items-center justify-center gap-1">
                    <button
                      onClick={() => onUpdateStatus(id, 'Shortlisted')}
                      className={`rounded-md px-2 py-0.5 text-[10px] font-semibold transition ${
                        app?.status === 'Shortlisted' ? 'bg-accent-600 text-white' : 'bg-accent-50 text-accent-700 hover:bg-accent-100'
                      }`}
                    >
                      Shortlist
                    </button>
                    <button
                      onClick={() => onUpdateStatus(id, 'Interviewing')}
                      className={`rounded-md px-2 py-0.5 text-[10px] font-semibold transition ${
                        app?.status === 'Interviewing' ? 'bg-brand-600 text-white' : 'bg-brand-50 text-brand-700 hover:bg-brand-100'
                      }`}
                    >
                      Interview
                    </button>
                    <button
                      onClick={() => onUpdateStatus(id, 'Offered')}
                      className={`rounded-md px-2 py-0.5 text-[10px] font-semibold transition ${
                        app?.status === 'Offered' ? 'bg-emerald-600 text-white' : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                      }`}
                    >
                      Offer
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Skill Matrix Breakdown */}
            <div className="mt-5 space-y-3">
              <div className="text-xs font-bold uppercase tracking-wider text-ink-500 mb-2">
                Requirements & Competency Breakdown
              </div>
              {allSkills.map(({ id: skId, name, required }) => (
                <div
                  key={skId}
                  className="grid grid-cols-[200px_repeat(auto-fit,minmax(200px,1fr))] gap-4 items-center rounded-xl border border-ink-100 bg-white p-3 hover:bg-ink-50/40 transition"
                >
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="font-semibold text-xs text-ink-900">{name}</span>
                      <Chip color={required ? 'brand' : 'gray'}>
                        <span className="text-[9px] font-bold">{required ? 'Required' : 'Preferred'}</span>
                      </Chip>
                    </div>
                  </div>

                  {candidatesData.map(({ match, id }) => {
                    const skMatch =
                      match.matchedSkills.find((s) => s.skillId === skId) ??
                      match.partialSkills.find((s) => s.skillId === skId) ??
                      match.missingSkills.find((s) => s.skillId === skId);

                    const status = skMatch?.status ?? 'missing';
                    const prof = skMatch?.studentProficiency ?? 0;
                    const evidenceList = skMatch?.evidenceTitles ?? [];

                    return (
                      <div key={id} className="text-xs space-y-1">
                        <div className="flex items-center justify-between">
                          <span
                            className={`inline-flex items-center gap-1 font-bold text-[11px] ${
                              status === 'matched'
                                ? 'text-accent-700'
                                : status === 'partial'
                                ? 'text-amber-700'
                                : 'text-rose-600'
                            }`}
                          >
                            {status === 'matched' ? (
                              <CheckCircle2 className="h-3.5 w-3.5 text-accent-600" />
                            ) : status === 'partial' ? (
                              <AlertCircle className="h-3.5 w-3.5 text-amber-600" />
                            ) : (
                              <XCircle className="h-3.5 w-3.5 text-rose-500" />
                            )}
                            <span className="capitalize">{status}</span>
                          </span>
                          <span className="font-mono text-ink-600 font-semibold">{prof}%</span>
                        </div>
                        {evidenceList.length > 0 ? (
                          <div className="text-[10px] text-ink-500 truncate" title={evidenceList.join(', ')}>
                            Proof: {evidenceList[0]}
                          </div>
                        ) : (
                          <div className="text-[10px] text-ink-300 italic">No verified artifact</div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>

            {/* Strengths & Missing Overview */}
            <div className="mt-6 grid grid-cols-[200px_repeat(auto-fit,minmax(200px,1fr))] gap-4 border-t border-ink-200 pt-5">
              <div className="text-xs font-bold uppercase tracking-wider text-ink-400">
                Summary Gaps
              </div>
              {candidatesData.map(({ match, id }) => (
                <div key={id} className="space-y-2 text-xs">
                  {match.gaps.length > 0 ? (
                    <div className="rounded-xl bg-rose-50 p-2.5 text-rose-800 border border-rose-100">
                      <div className="font-bold text-[11px] mb-1">Gaps ({match.gaps.length}):</div>
                      <ul className="list-disc list-inside space-y-0.5 text-[10px]">
                        {match.gaps.map((g) => (
                          <li key={g}>{g}</li>
                        ))}
                      </ul>
                    </div>
                  ) : (
                    <div className="rounded-xl bg-accent-50 p-2.5 text-accent-800 border border-accent-100 text-[11px] font-semibold flex items-center gap-1">
                      <CheckCircle2 className="h-3.5 w-3.5 text-accent-600" /> Full skill requirement coverage
                    </div>
                  )}
                  <button
                    onClick={() => {
                      onClose();
                      navigate(`/org/candidates/${opp.id}/${id}`);
                    }}
                    className="w-full btn-secondary text-[11px] py-1.5"
                  >
                    Inspect Profile <ArrowRight className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between border-t border-ink-100 px-6 py-3 bg-ink-50/50">
          <span className="text-xs text-ink-500">
            Algorithmic comparison uses strictly demonstrated competency scores and verified artifact proofs.
          </span>
          <button onClick={onClose} className="btn-primary text-xs">
            Done Comparing
          </button>
        </div>
      </div>
    </div>
  );
}

function StageCandidateCard({
  result,
  oppId,
  stage,
  onUpdateStatus,
  onDetails,
}: {
  result: MatchResult;
  oppId: string;
  stage: ApplicationStatus;
  onUpdateStatus: (status: ApplicationStatus) => void;
  onDetails: () => void;
}) {
  const student = studentMap[result.studentId];
  if (!student) return null;

  return (
    <Card className="p-4 border-ink-100 hover:border-brand-300 transition flex flex-col justify-between shadow-2xs">
      <div>
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2.5 min-w-0">
            <Avatar name={student.name} color={student.avatarColor} photoUrl={student.photoUrl} size="md" />
            <div className="min-w-0">
              <div className="font-bold text-sm text-ink-900 truncate">{student.name}</div>
              <div className="text-[11px] text-ink-500 truncate">{student.program}</div>
            </div>
          </div>
          <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-brand-50 border border-brand-200 text-brand-700 font-extrabold text-xs shadow-2xs">
            {result.matchScore}%
          </div>
        </div>

        <div className="mt-3 flex flex-wrap gap-1">
          {result.matchedSkills.slice(0, 3).map((m) => (
            <Chip key={m.skillId} color="emerald">
              {skillMap[m.skillId]?.name ?? m.skillId}
            </Chip>
          ))}
          {result.missingSkills.length > 0 && (
            <Chip color="rose">{result.missingSkills.length} missing</Chip>
          )}
        </div>
      </div>

      <div className="mt-4 pt-3 border-t border-ink-100">
        <div className="flex items-center justify-between gap-1.5 flex-wrap">
          <button
            onClick={onDetails}
            className="text-[11px] font-semibold text-brand-600 hover:text-brand-800 transition py-1"
          >
            Inspect Proof →
          </button>

          <div className="flex items-center gap-1">
            {stage === 'Applied' && (
              <>
                <button
                  onClick={() => onUpdateStatus('Shortlisted')}
                  className="rounded-lg bg-brand-50 border border-brand-200 px-2 py-1 text-[11px] font-bold text-brand-700 hover:bg-brand-100 transition shadow-2xs"
                  title="Shortlist candidate"
                >
                  ⭐ Shortlist
                </button>
                <button
                  onClick={() => onUpdateStatus('Rejected')}
                  className="rounded-lg bg-rose-50 border border-rose-200 px-2 py-1 text-[11px] font-bold text-rose-700 hover:bg-rose-100 transition"
                  title="Reject / Archive"
                >
                  ❌
                </button>
              </>
            )}

            {stage === 'Shortlisted' && (
              <>
                <button
                  onClick={() => onUpdateStatus('Interviewing')}
                  className="rounded-lg bg-amber-500 hover:bg-amber-600 px-2 py-1 text-[11px] font-bold text-white transition shadow-2xs"
                  title="Invite to interview"
                >
                  🎙️ Interview
                </button>
                <button
                  onClick={() => onUpdateStatus('Offered')}
                  className="rounded-lg bg-emerald-600 hover:bg-emerald-700 px-2 py-1 text-[11px] font-bold text-white transition shadow-2xs"
                  title="Extend offer"
                >
                  🏆 Offer
                </button>
                <button
                  onClick={() => onUpdateStatus('Rejected')}
                  className="rounded-lg bg-rose-50 border border-rose-200 px-1.5 py-1 text-[11px] font-bold text-rose-700 hover:bg-rose-100 transition"
                  title="Reject"
                >
                  ❌
                </button>
              </>
            )}

            {stage === 'Interviewing' && (
              <>
                <button
                  onClick={() => onUpdateStatus('Offered')}
                  className="rounded-lg bg-emerald-600 hover:bg-emerald-700 px-2 py-1 text-[11px] font-bold text-white transition shadow-2xs"
                  title="Pass interview and extend offer"
                >
                  🏆 Extend Offer
                </button>
                <button
                  onClick={() => onUpdateStatus('Rejected')}
                  className="rounded-lg bg-rose-50 border border-rose-200 px-2 py-1 text-[11px] font-bold text-rose-700 hover:bg-rose-100 transition"
                  title="Conclude"
                >
                  Reject
                </button>
              </>
            )}

            {stage === 'Offered' && (
              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                <CheckCircle2 className="h-3 w-3" /> Offer Active
              </span>
            )}

            {stage === 'Rejected' && (
              <button
                onClick={() => onUpdateStatus('Shortlisted')}
                className="rounded-lg bg-ink-100 hover:bg-ink-200 px-2 py-1 text-[11px] font-bold text-ink-700 transition"
              >
                ↩️ Restore
              </button>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
}
