import { useState, useMemo, useEffect } from 'react';
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
  Globe,
  Filter,
  Bookmark,
  ExternalLink,
  Mail,
  Star,
  Award,
  BookOpen,
  GraduationCap,
  Copy,
  Check,
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
import {
  opportunityMap,
  studentMap,
  skillMap,
  evidenceMap,
  getAllStudents,
  getStudentSkills,
  getStudentEvidence,
  SKILLS,
} from '@/data/mockData';
import { useCustomOpportunities } from '@/lib/customOpportunities';
import { useApplications } from '@/lib/applications';
import { useNotifications } from '@/lib/notifications';
import { useToast } from '@/lib/toast';
import { useDebounce } from '@/lib/useDebounce';
import { rankStudentsForOpportunity, matchStudentToOpportunity } from '@/lib/matchingEngine';
import { PipelineStepper, PipelineLevelBadge } from '@/components/PipelineStepper';
import { PIPELINE_STAGES, getPipelineLevelNumber } from '@/lib/pipelineLevels';
import type { MatchResult, ApplicationStatus, Opportunity, Student } from '@/types';

export function CandidateMatchingPage({ opportunityId }: { opportunityId?: string }) {
  const { navigate } = useRouter();
  const { opportunities } = useCustomOpportunities();
  const { hasApplied, getApplication, updateStatus } = useApplications();
  const [selectedOpp, setSelectedOpp] = useState<string>(
    opportunityId ?? opportunities[0]?.id ?? 'op_fe_intern'
  );

  useEffect(() => {
    if (opportunityId && opportunityId !== selectedOpp) {
      setSelectedOpp(opportunityId);
    }
  }, [opportunityId]);
  const [query, setQuery] = useState('');
  const debouncedQuery = useDebounce(query, 180);
  const [filterApplicantsOnly, setFilterApplicantsOnly] = useState(false);
  const [statusStage, setStatusStage] = useState<'all' | 'Shortlisted' | 'Interviewing' | 'Offered' | 'Rejected' | 'Applied'>('all');
  const [viewMode, setViewMode] = useState<'list' | 'stages'>('list');

  // Bulk selection & comparison state
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);
  const [showCompareModal, setShowCompareModal] = useState(false);
  const [bulkFeedback, setBulkFeedback] = useState<string | null>(null);

  const { toast } = useToast();

  // Top Page Tab: 'opportunity' | 'directory'
  const [pageTab, setPageTab] = useState<'opportunity' | 'directory'>('opportunity');

  // Global Talent Directory Filters State
  const [dirQuery, setDirQuery] = useState('');
  const debouncedDirQuery = useDebounce(dirQuery, 180);
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  const [minProficiency, setMinProficiency] = useState<number>(0);
  const [selectedUniversity, setSelectedUniversity] = useState<string>('all');
  const [bookmarkedIds, setBookmarkedIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('evx_bookmarked_talents');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [outreachStudent, setOutreachStudent] = useState<Student | null>(null);

  const allStudents = useMemo(() => getAllStudents(), []);
  const allUniversities = useMemo(() => {
    const set = new Set<string>();
    for (const s of allStudents) {
      if (s.university) set.add(s.university);
    }
    return Array.from(set).sort();
  }, [allStudents]);

  const toggleBookmark = (id: string) => {
    setBookmarkedIds((prev) => {
      const next = prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id];
      localStorage.setItem('evx_bookmarked_talents', JSON.stringify(next));
      toast.success(prev.includes(id) ? 'Removed from bookmarked talent' : 'Candidate added to talent bookmarks!');
      return next;
    });
  };

  const toggleFilterSkill = (skillId: string) => {
    setSelectedSkills((prev) =>
      prev.includes(skillId) ? prev.filter((s) => s !== skillId) : [...prev, skillId]
    );
  };

  // Filtered Global Directory Candidates
  const filteredDirectory = useMemo(() => {
    return allStudents.filter((s) => {
      if (debouncedDirQuery.trim()) {
        const q = debouncedDirQuery.toLowerCase().trim();
        const matchesName = s.name.toLowerCase().includes(q);
        const matchesProg = s.program.toLowerCase().includes(q);
        const matchesUni = s.university.toLowerCase().includes(q);
        const matchesBio = s.bio.toLowerCase().includes(q);
        if (!matchesName && !matchesProg && !matchesUni && !matchesBio) return false;
      }

      if (selectedUniversity !== 'all' && s.university !== selectedUniversity) {
        return false;
      }

      const sSkills = getStudentSkills(s.id);

      if (selectedSkills.length > 0) {
        const hasAll = selectedSkills.every((skId) => {
          const found = sSkills.find((sk) => sk.skillId === skId);
          return found && (minProficiency === 0 || found.proficiency >= minProficiency);
        });
        if (!hasAll) return false;
      } else if (minProficiency > 0) {
        const hasAny = sSkills.some((sk) => sk.proficiency >= minProficiency);
        if (!hasAny) return false;
      }

      return true;
    });
  }, [allStudents, debouncedDirQuery, selectedUniversity, selectedSkills, minProficiency]);

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

      {/* Top View Selector Tabs */}
      <div className="mb-6 flex rounded-2xl bg-ink-100 dark:bg-ink-800 p-1.5 max-w-md border border-ink-200 dark:border-ink-700">
        <button
          onClick={() => setPageTab('opportunity')}
          className={`flex-1 py-2 text-xs font-bold rounded-xl transition flex items-center justify-center gap-2 ${
            pageTab === 'opportunity'
              ? 'bg-white dark:bg-ink-900 text-ink-950 dark:text-white shadow-xs'
              : 'text-ink-600 dark:text-ink-400 hover:text-ink-900 dark:hover:text-white'
          }`}
        >
          <Building2 className="h-3.5 w-3.5 text-brand-600 dark:text-brand-400" />
          Opportunity Pipeline
        </button>
        <button
          onClick={() => setPageTab('directory')}
          className={`flex-1 py-2 text-xs font-bold rounded-xl transition flex items-center justify-center gap-2 ${
            pageTab === 'directory'
              ? 'bg-white dark:bg-ink-900 text-ink-950 dark:text-white shadow-xs'
              : 'text-ink-600 dark:text-ink-400 hover:text-ink-900 dark:hover:text-white'
          }`}
        >
          <Globe className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
          Global Talent Directory
          <span className="rounded-full bg-emerald-100 dark:bg-emerald-950/60 px-1.5 py-0.5 text-[10px] font-extrabold text-emerald-700 dark:text-emerald-300">
            {allStudents.length}
          </span>
        </button>
      </div>

      {pageTab === 'directory' ? (
        <div className="space-y-6">
          {/* Filter Bar */}
          <Card className="p-5 border-ink-200 dark:border-ink-800">
            <div className="grid gap-4 sm:grid-cols-3">
              {/* Keyword Search */}
              <div>
                <label className="block text-xs font-semibold text-ink-700 dark:text-ink-300 mb-1">
                  Search Talent
                </label>
                <div className="relative">
                  <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-ink-400" />
                  <input
                    type="text"
                    value={dirQuery}
                    onChange={(e) => setDirQuery(e.target.value)}
                    placeholder="Name, degree, keyword..."
                    className="w-full rounded-xl border border-ink-200 dark:border-ink-700 bg-white dark:bg-ink-900 pl-9 pr-3 py-2 text-xs text-ink-900 dark:text-white placeholder:text-ink-400 focus:outline-none focus:ring-2 focus:ring-brand-500"
                  />
                  {dirQuery && (
                    <button
                      onClick={() => setDirQuery('')}
                      className="absolute right-2.5 top-2.5 text-ink-400 hover:text-ink-600"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              </div>

              {/* University Selector */}
              <div>
                <label className="block text-xs font-semibold text-ink-700 dark:text-ink-300 mb-1">
                  University / Institution
                </label>
                <select
                  value={selectedUniversity}
                  onChange={(e) => setSelectedUniversity(e.target.value)}
                  className="w-full rounded-xl border border-ink-200 dark:border-ink-700 bg-white dark:bg-ink-900 px-3 py-2 text-xs text-ink-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
                >
                  <option value="all">All Universities ({allUniversities.length})</option>
                  {allUniversities.map((u) => (
                    <option key={u} value={u}>{u}</option>
                  ))}
                </select>
              </div>

              {/* Minimum Proficiency Threshold */}
              <div>
                <label className="block text-xs font-semibold text-ink-700 dark:text-ink-300 mb-1">
                  Minimum Proficiency: {minProficiency > 0 ? `${minProficiency}%+` : 'Any'}
                </label>
                <select
                  value={minProficiency}
                  onChange={(e) => setMinProficiency(Number(e.target.value))}
                  className="w-full rounded-xl border border-ink-200 dark:border-ink-700 bg-white dark:bg-ink-900 px-3 py-2 text-xs text-ink-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
                >
                  <option value={0}>Any Demonstrated Proficiency</option>
                  <option value={50}>50%+ (Practitioner)</option>
                  <option value={70}>70%+ (Verified Production-Ready)</option>
                  <option value={85}>85%+ (Elite / Advanced)</option>
                </select>
              </div>
            </div>

            {/* Direct Skill Tag Filters */}
            <div className="mt-4 pt-4 border-t border-ink-100 dark:border-ink-800">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold uppercase tracking-wider text-ink-500 dark:text-ink-400 flex items-center gap-1.5">
                  <Filter className="h-3.5 w-3.5" /> Filter by Verified Competencies
                </span>
                {selectedSkills.length > 0 && (
                  <button
                    onClick={() => setSelectedSkills([])}
                    className="text-xs text-brand-600 dark:text-brand-400 hover:underline"
                  >
                    Clear skill filters ({selectedSkills.length})
                  </button>
                )}
              </div>
              <div className="flex flex-wrap gap-1.5">
                {SKILLS.map((sk) => {
                  const active = selectedSkills.includes(sk.id);
                  return (
                    <button
                      key={sk.id}
                      type="button"
                      onClick={() => toggleFilterSkill(sk.id)}
                      className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-semibold transition ${
                        active
                          ? 'bg-brand-600 text-white shadow-2xs'
                          : 'bg-ink-100 dark:bg-ink-800 text-ink-600 dark:text-ink-300 hover:bg-ink-200 dark:hover:bg-ink-700'
                      }`}
                    >
                      {sk.name}
                      {active && <Check className="h-3 w-3" />}
                    </button>
                  );
                })}
              </div>
            </div>
          </Card>

          {/* Results Summary */}
          <div className="flex items-center justify-between text-xs text-ink-500 dark:text-ink-400">
            <span>
              Showing <strong>{filteredDirectory.length}</strong> of {allStudents.length} candidates in global talent pool
            </span>
            {bookmarkedIds.length > 0 && (
              <span className="inline-flex items-center gap-1 font-semibold text-amber-600 dark:text-amber-400">
                <Bookmark className="h-3.5 w-3.5 fill-amber-500 text-amber-500" /> {bookmarkedIds.length} Bookmarked
              </span>
            )}
          </div>

          {/* Candidates Grid */}
          {filteredDirectory.length === 0 ? (
            <EmptyState
              title="No matching candidates found"
              description="Try broadening your search query or removing some of the selected skill filters."
              action={
                <button
                  onClick={() => {
                    setDirQuery('');
                    setSelectedSkills([]);
                    setMinProficiency(0);
                    setSelectedUniversity('all');
                  }}
                  className="btn-secondary text-xs"
                >
                  Reset all filters
                </button>
              }
            />
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {filteredDirectory.map((student) => {
                const sSkills = getStudentSkills(student.id);
                const sEvidence = getStudentEvidence(student.id);
                const verifiedEvidence = sEvidence.filter((e) => e.verification === 'verified');
                const isBookmarked = bookmarkedIds.includes(student.id);

                return (
                  <Card key={student.id} className="p-5 flex flex-col justify-between hover:shadow-lift transition border-ink-200 dark:border-ink-800">
                    <div>
                      {/* Header */}
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <Avatar name={student.name} color={student.avatarColor} photoUrl={student.photoUrl} size="lg" />
                          <div>
                            <div className="font-semibold text-ink-950 dark:text-white text-base leading-tight">
                              {student.name}
                            </div>
                            <div className="text-xs text-ink-500 dark:text-ink-400 mt-0.5">
                              {student.program} · {student.year}
                            </div>
                            <div className="text-xs text-ink-600 dark:text-ink-300 font-medium">
                              {student.university}
                            </div>
                          </div>
                        </div>
                        <button
                          onClick={() => toggleBookmark(student.id)}
                          className={`p-1.5 rounded-lg border transition ${
                            isBookmarked
                              ? 'bg-amber-50 dark:bg-amber-950/40 border-amber-300 text-amber-600'
                              : 'border-ink-200 dark:border-ink-700 text-ink-400 hover:text-ink-600 dark:hover:text-ink-200'
                          }`}
                          title={isBookmarked ? 'Remove bookmark' : 'Bookmark candidate'}
                        >
                          <Bookmark className={`h-4 w-4 ${isBookmarked ? 'fill-amber-500 text-amber-500' : ''}`} />
                        </button>
                      </div>

                      {/* Bio */}
                      <p className="mt-3 text-xs text-ink-600 dark:text-ink-300 line-clamp-2 leading-relaxed">
                        {student.bio}
                      </p>

                      {/* Verified Skills */}
                      <div className="mt-3">
                        <div className="text-[10px] font-bold uppercase tracking-wider text-ink-400 dark:text-ink-500 mb-1.5">
                          Verified Skill Claims ({sSkills.length})
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          {sSkills.slice(0, 5).map((sk) => {
                            const isMatch = selectedSkills.includes(sk.skillId);
                            return (
                              <span
                                key={sk.skillId}
                                className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[11px] font-semibold border ${
                                  isMatch
                                    ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 text-emerald-700 dark:text-emerald-300 font-bold'
                                    : 'bg-ink-50 dark:bg-ink-800 border-ink-200 dark:border-ink-700 text-ink-700 dark:text-ink-300'
                                }`}
                              >
                                {skillMap[sk.skillId]?.name || sk.skillId}
                                <span className="text-[10px] opacity-75">{sk.proficiency}%</span>
                              </span>
                            );
                          })}
                          {sSkills.length > 5 && (
                            <span className="text-[11px] text-ink-400 self-center">
                              +{sSkills.length - 5} more
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Proof metrics */}
                      <div className="mt-3 flex items-center gap-4 text-xs text-ink-500 dark:text-ink-400 border-t border-ink-100 dark:border-ink-800/80 pt-2.5">
                        <span className="inline-flex items-center gap-1">
                          <FileBadge className="h-3.5 w-3.5 text-brand-600 dark:text-brand-400" />
                          <strong>{verifiedEvidence.length}</strong> Verified Artifacts
                        </span>
                        <span className="inline-flex items-center gap-1">
                          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                          Evidence-Backed
                        </span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="mt-4 pt-3 border-t border-ink-100 dark:border-ink-800 flex items-center justify-between gap-2">
                      <button
                        onClick={() => navigate(`/passport/${student.id}`)}
                        className="btn-secondary text-xs inline-flex items-center gap-1.5 flex-1 justify-center"
                      >
                        <ExternalLink className="h-3.5 w-3.5" /> View Passport
                      </button>
                      <button
                        onClick={() => setOutreachStudent(student)}
                        className="btn-primary text-xs inline-flex items-center gap-1.5 flex-1 justify-center"
                      >
                        <Mail className="h-3.5 w-3.5" /> Direct Outreach
                      </button>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}

          {/* Direct Talent Outreach Modal */}
          {outreachStudent && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink-950/60 backdrop-blur-sm animate-in fade-in duration-150">
              <div className="relative max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white dark:bg-ink-900 shadow-2xl border border-ink-100 dark:border-ink-800 p-6 sm:p-8">
                <div className="flex items-start justify-between gap-4 border-b border-ink-100 dark:border-ink-800 pb-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-brand-500/10 text-brand-600 dark:text-brand-400">
                        <Mail className="h-4 w-4" />
                      </span>
                      <Chip color="brand">Direct Talent Outreach</Chip>
                    </div>
                    <h3 className="mt-2 text-xl font-display font-extrabold text-ink-950 dark:text-white">
                      Connect with {outreachStudent.name}
                    </h3>
                    <p className="text-xs text-ink-500 dark:text-ink-400">
                      {outreachStudent.program} · {outreachStudent.university} · {outreachStudent.email}
                    </p>
                  </div>
                  <button
                    onClick={() => setOutreachStudent(null)}
                    className="rounded-lg p-1.5 text-ink-400 hover:text-ink-700 dark:hover:text-ink-200 hover:bg-ink-50 dark:hover:bg-ink-800 transition"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>

                <div className="mt-5 space-y-3">
                  <div className="rounded-xl bg-ink-50 dark:bg-ink-800/50 p-3 text-xs text-ink-700 dark:text-ink-300">
                    <p className="font-semibold text-ink-900 dark:text-white mb-1">Pre-composed direct invitation:</p>
                    <p className="font-mono text-[11px] leading-relaxed">
                      {`Hi ${outreachStudent.name},\n\nWe discovered your verified profile on EvidentX and were impressed by your verified achievements and skills in ${getStudentSkills(outreachStudent.id).slice(0, 3).map(s => skillMap[s.skillId]?.name || s.skillId).join(', ')}. We have high-impact engineering opportunities and would love to connect!\n\nBest regards,\nRecruiting Team`}
                    </p>
                  </div>
                </div>

                <div className="mt-6 flex flex-wrap items-center justify-end gap-2 border-t border-ink-100 dark:border-ink-800 pt-4">
                  <button
                    onClick={() => {
                      const text = `Hi ${outreachStudent.name},\n\nWe discovered your verified profile on EvidentX and were impressed by your verified achievements and skills in ${getStudentSkills(outreachStudent.id).slice(0, 3).map(s => skillMap[s.skillId]?.name || s.skillId).join(', ')}. We have high-impact engineering opportunities and would love to connect!\n\nBest regards,\nRecruiting Team`;
                      navigator.clipboard.writeText(text);
                      toast.success('Invitation text copied to clipboard!');
                    }}
                    className="btn-secondary text-xs inline-flex items-center gap-1.5"
                  >
                    <Copy className="h-3.5 w-3.5" /> Copy Message
                  </button>
                  <a
                    href={`mailto:${outreachStudent.email}?subject=${encodeURIComponent('Career Opportunity via EvidentX')}&body=${encodeURIComponent(`Hi ${outreachStudent.name},\n\nWe discovered your verified profile on EvidentX and were impressed by your verified achievements in ${getStudentSkills(outreachStudent.id).slice(0, 3).map(s => skillMap[s.skillId]?.name || s.skillId).join(', ')}. We would love to discuss an opportunity.\n\nBest regards,\nRecruiting Team`)}`}
                    className="btn-primary text-xs inline-flex items-center gap-1.5"
                  >
                    <ExternalLink className="h-3.5 w-3.5" /> Open in Mail App
                  </a>
                </div>
              </div>
            </div>
          )}
        </div>
      ) : (
        <>
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
                  ? 'border-accent-300 dark:border-accent-600 bg-accent-50 dark:bg-accent-950/40 text-accent-700 dark:text-accent-300'
                  : 'border-ink-200 dark:border-[#30363d] bg-white dark:bg-[#161b22] text-ink-600 dark:text-[#c9d1d9] hover:bg-ink-50 dark:hover:bg-[#21262d]'
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
                  ? 'bg-ink-900 dark:bg-white dark:text-ink-900 text-white shadow-soft'
                  : 'bg-white dark:bg-[#161b22] border border-ink-200 dark:border-[#30363d] text-ink-700 dark:text-[#c9d1d9] hover:bg-ink-50 dark:hover:bg-[#21262d]'
              }`}
            >
              All Matched ({ranked.length})
            </button>
            <button
              onClick={() => setStatusStage('Applied')}
              className={`rounded-xl px-3 py-1.5 text-xs font-bold transition flex items-center gap-1.5 whitespace-nowrap ${
                statusStage === 'Applied'
                  ? 'bg-indigo-600 text-white shadow-soft'
                  : 'bg-white dark:bg-[#161b22] border border-ink-200 dark:border-[#30363d] text-indigo-700 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/40'
              }`}
            >
              <span>📋 Level 1: Applied / Review</span>
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-extrabold ${statusStage === 'Applied' ? 'bg-white/25 text-white' : 'bg-indigo-100 dark:bg-indigo-950/70 text-indigo-900 dark:text-indigo-300'}`}>
                {stageBuckets.applied.length}
              </span>
            </button>
            <button
              onClick={() => setStatusStage('Shortlisted')}
              className={`rounded-xl px-3 py-1.5 text-xs font-bold transition flex items-center gap-1.5 whitespace-nowrap ${
                statusStage === 'Shortlisted'
                  ? 'bg-brand-600 text-white shadow-soft'
                  : 'bg-white dark:bg-[#161b22] border border-ink-200 dark:border-[#30363d] text-brand-700 dark:text-brand-400 hover:bg-brand-50 dark:hover:bg-brand-950/40'
              }`}
            >
              <span>⭐ Level 2: Shortlisted</span>
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-extrabold ${statusStage === 'Shortlisted' ? 'bg-white/25 text-white' : 'bg-brand-100 dark:bg-brand-950/70 text-brand-800 dark:text-brand-300'}`}>
                {stageBuckets.shortlisted.length}
              </span>
            </button>
            <button
              onClick={() => setStatusStage('Interviewing')}
              className={`rounded-xl px-3 py-1.5 text-xs font-bold transition flex items-center gap-1.5 whitespace-nowrap ${
                statusStage === 'Interviewing'
                  ? 'bg-amber-600 text-white shadow-soft'
                  : 'bg-white dark:bg-[#161b22] border border-ink-200 dark:border-[#30363d] text-amber-800 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/40'
              }`}
            >
              <span>🎙️ Level 3: Interviewing</span>
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-extrabold ${statusStage === 'Interviewing' ? 'bg-white/25 text-white' : 'bg-amber-100 dark:bg-amber-950/70 text-amber-900 dark:text-amber-300'}`}>
                {stageBuckets.interviewing.length}
              </span>
            </button>
            <button
              onClick={() => setStatusStage('Offered')}
              className={`rounded-xl px-3 py-1.5 text-xs font-bold transition flex items-center gap-1.5 whitespace-nowrap ${
                statusStage === 'Offered'
                  ? 'bg-emerald-600 text-white shadow-soft'
                  : 'bg-white dark:bg-[#161b22] border border-ink-200 dark:border-[#30363d] text-emerald-800 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/40'
              }`}
            >
              <span>🏆 Level 4: Offered</span>
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-extrabold ${statusStage === 'Offered' ? 'bg-white/25 text-white' : 'bg-emerald-100 dark:bg-emerald-950/70 text-emerald-900 dark:text-emerald-300'}`}>
                {stageBuckets.offered.length}
              </span>
            </button>
            <button
              onClick={() => setStatusStage('Rejected')}
              className={`rounded-xl px-3 py-1.5 text-xs font-bold transition flex items-center gap-1.5 whitespace-nowrap ${
                statusStage === 'Rejected'
                  ? 'bg-rose-600 text-white shadow-soft'
                  : 'bg-white dark:bg-[#161b22] border border-ink-200 dark:border-[#30363d] text-rose-700 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40'
              }`}
            >
              <span>❌ Disqualified</span>
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-extrabold ${statusStage === 'Rejected' ? 'bg-white/25 text-white' : 'bg-rose-100 dark:bg-rose-950/70 text-rose-800 dark:text-rose-300'}`}>
                {stageBuckets.rejected.length}
              </span>
            </button>
          </div>

          {/* View Mode Toggle */}
          <div className="flex items-center gap-1 bg-ink-100 dark:bg-[#21262d] p-1 rounded-xl">
            <button
              onClick={() => setViewMode('list')}
              className={`flex items-center gap-1.5 px-3 py-1 text-xs font-bold rounded-lg transition ${
                viewMode === 'list' ? 'bg-white dark:bg-[#161b22] text-ink-900 dark:text-white shadow-2xs' : 'text-ink-600 dark:text-[#8b949e] hover:text-ink-900 dark:hover:text-white'
              }`}
            >
              <ListFilter className="h-3.5 w-3.5" />
              <span>Ranked List</span>
            </button>
            <button
              onClick={() => setViewMode('stages')}
              className={`flex items-center gap-1.5 px-3 py-1 text-xs font-bold rounded-lg transition ${
                viewMode === 'stages' ? 'bg-white dark:bg-[#161b22] text-brand-700 dark:text-brand-400 shadow-2xs' : 'text-ink-600 dark:text-[#8b949e] hover:text-ink-900 dark:hover:text-white'
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
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400 dark:text-[#8b949e]" />
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
                className="inline-flex items-center gap-1.5 rounded-xl border border-ink-200 dark:border-[#30363d] bg-white dark:bg-[#161b22] px-3 py-1.5 text-xs font-semibold text-ink-700 dark:text-[#c9d1d9] hover:bg-ink-50 dark:hover:bg-[#21262d] transition"
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
                  : 'bg-white dark:bg-[#161b22] border border-ink-200 dark:border-[#30363d] text-ink-700 dark:text-[#c9d1d9] hover:bg-ink-50 dark:hover:bg-[#21262d]'
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
          {/* 📋 Level 1: Applied & Under Review */}
          <div className="rounded-2xl border-2 border-indigo-200 dark:border-indigo-900 bg-indigo-50/20 dark:bg-indigo-950/20 p-5 shadow-soft">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-600 text-white font-bold text-xs shadow-2xs">
                  📋
                </span>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 bg-indigo-100 dark:bg-indigo-950 px-2 py-0.5 rounded-md border border-indigo-200 dark:border-indigo-800">
                      Level 1
                    </span>
                    <h3 className="font-display text-base font-bold text-ink-900 dark:text-white">
                      Applied / Under Review ({stageBuckets.applied.length})
                    </h3>
                  </div>
                </div>
              </div>
              <span className="text-xs font-semibold text-indigo-700 dark:text-indigo-300 bg-indigo-100/70 dark:bg-indigo-950/50 px-2.5 py-0.5 rounded-full border border-indigo-200 dark:border-indigo-800">
                Initial Match & Screening
              </span>
            </div>

            {stageBuckets.applied.length === 0 ? (
              <div className="rounded-xl border border-dashed border-indigo-200 dark:border-indigo-800 bg-white dark:bg-[#161b22] p-6 text-center text-xs text-ink-500">
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

          {/* ⭐ Level 2: Shortlisted Section */}
          <div className="rounded-2xl border-2 border-brand-200 dark:border-brand-900 bg-brand-50/20 dark:bg-brand-950/20 p-5 shadow-soft">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-brand-600 text-white font-bold text-xs shadow-2xs">
                  ⭐
                </span>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-brand-600 dark:text-brand-400 bg-brand-100 dark:bg-brand-950 px-2 py-0.5 rounded-md border border-brand-200 dark:border-brand-800">
                      Level 2
                    </span>
                    <h3 className="font-display text-base font-bold text-brand-950 dark:text-white">
                      Shortlisted Candidates ({stageBuckets.shortlisted.length})
                    </h3>
                  </div>
                </div>
              </div>
              <span className="text-xs font-semibold text-brand-700 dark:text-brand-300 bg-brand-100/70 dark:bg-brand-950/50 px-2.5 py-0.5 rounded-full border border-brand-200 dark:border-brand-800">
                Ready for Technical Evaluation
              </span>
            </div>

            {stageBuckets.shortlisted.length === 0 ? (
              <div className="rounded-xl border border-dashed border-brand-200 dark:border-brand-800 bg-white dark:bg-[#161b22] p-6 text-center text-xs text-brand-700 dark:text-brand-400">
                No candidates shortlisted yet. Click <strong className="font-semibold">"Advance to Level 2"</strong> on any candidate to move them to this area!
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

          {/* 🎙️ Level 3: Interviewing Section */}
          <div className="rounded-2xl border-2 border-amber-200 dark:border-amber-900 bg-amber-50/20 dark:bg-amber-950/20 p-5 shadow-soft">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-600 text-white font-bold text-xs shadow-2xs">
                  🎙️
                </span>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-amber-700 dark:text-amber-400 bg-amber-100 dark:bg-amber-950 px-2 py-0.5 rounded-md border border-amber-200 dark:border-amber-800">
                      Level 3
                    </span>
                    <h3 className="font-display text-base font-bold text-amber-950 dark:text-white">
                      Interview Stage ({stageBuckets.interviewing.length})
                    </h3>
                  </div>
                </div>
              </div>
              <span className="text-xs font-semibold text-amber-800 dark:text-amber-300 bg-amber-100/70 dark:bg-amber-950/50 px-2.5 py-0.5 rounded-full border border-amber-200 dark:border-amber-800">
                Interview Rounds Active
              </span>
            </div>

            {stageBuckets.interviewing.length === 0 ? (
              <div className="rounded-xl border border-dashed border-amber-200 dark:border-amber-800 bg-white dark:bg-[#161b22] p-6 text-center text-xs text-amber-700 dark:text-amber-400">
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

          {/* 🏆 Level 4: Offered Section */}
          <div className="rounded-2xl border-2 border-emerald-200 dark:border-emerald-900 bg-emerald-50/20 dark:bg-emerald-950/20 p-5 shadow-soft">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-600 text-white font-bold text-xs shadow-2xs">
                  🏆
                </span>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-700 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-950 px-2 py-0.5 rounded-md border border-emerald-200 dark:border-emerald-800">
                      Level 4
                    </span>
                    <h3 className="font-display text-base font-bold text-emerald-950 dark:text-white">
                      Offered / Hired ({stageBuckets.offered.length})
                    </h3>
                  </div>
                </div>
              </div>
              <span className="text-xs font-semibold text-emerald-800 dark:text-emerald-300 bg-emerald-100/70 dark:bg-emerald-950/50 px-2.5 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800">
                Official Offers Extended
              </span>
            </div>

            {stageBuckets.offered.length === 0 ? (
              <div className="rounded-xl border border-dashed border-emerald-200 dark:border-emerald-800 bg-white dark:bg-[#161b22] p-6 text-center text-xs text-emerald-700 dark:text-emerald-400">
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

          {/* ❌ Rejected / Disqualified */}
          {stageBuckets.rejected.length > 0 && (
            <div className="rounded-2xl border border-rose-200 dark:border-rose-900 bg-rose-50/15 dark:bg-rose-950/20 p-5 shadow-soft">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-rose-600 text-white font-bold text-xs shadow-2xs">
                    ❌
                  </span>
                  <h3 className="font-display text-base font-bold text-rose-950 dark:text-white">
                    Archived / Disqualified ({stageBuckets.rejected.length})
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

            <div className="flex items-center gap-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-white/60 px-1 hidden md:inline">
                Set Level:
              </span>
              <button
                onClick={() => handleBulkStatusChange('Applied')}
                className="rounded-lg bg-indigo-600/80 hover:bg-indigo-600 px-2.5 py-1.5 text-xs font-bold transition text-white"
                title="Level 1: Applied / Review"
              >
                L1 Review
              </button>
              <button
                onClick={() => handleBulkStatusChange('Shortlisted')}
                className="rounded-lg bg-brand-600 hover:bg-brand-500 px-2.5 py-1.5 text-xs font-bold transition text-white"
                title="Level 2: Shortlisted"
              >
                L2 Shortlist
              </button>
              <button
                onClick={() => handleBulkStatusChange('Interviewing')}
                className="rounded-lg bg-amber-600 hover:bg-amber-500 px-2.5 py-1.5 text-xs font-bold transition text-white"
                title="Level 3: Interviewing"
              >
                L3 Interview
              </button>
              <button
                onClick={() => handleBulkStatusChange('Offered')}
                className="rounded-lg bg-emerald-600 hover:bg-emerald-500 px-2.5 py-1.5 text-xs font-bold transition text-white"
                title="Level 4: Offered"
              >
                L4 Offer
              </button>
              <button
                onClick={() => handleBulkStatusChange('Rejected')}
                className="rounded-lg bg-rose-600 hover:bg-rose-500 px-2.5 py-1.5 text-xs font-bold transition text-white"
                title="Disqualify / Reject"
              >
                Reject
              </button>
            </div>

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
        </>
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
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold text-ink-900 dark:text-white truncate">{student.name}</span>
            <PipelineLevelBadge status={application?.status} />
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
        <div className="border-t border-ink-100 dark:border-[#30363d] p-4 bg-ink-50/30 dark:bg-[#161b22]/40 animate-fade-in space-y-4">
          <p className="text-sm text-ink-700 dark:text-[#c9d1d9]">{result.explanation}</p>

          {/* Hiring Pipeline Progression Levels */}
          <PipelineStepper
            currentStatus={application?.status}
            onUpdateStatus={onUpdateStatus}
          />

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
      <div className="relative flex max-h-[92vh] w-full max-w-6xl flex-col rounded-3xl bg-white dark:bg-[#161b22] shadow-2xl border border-ink-200 dark:border-[#30363d] overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-ink-100 dark:border-[#30363d] px-6 py-4 bg-ink-50/50 dark:bg-[#21262d]">
          <div>
            <div className="flex items-center gap-2">
              <Scale className="h-5 w-5 text-accent-600 dark:text-accent-400" />
              <h2 className="font-display text-lg font-bold text-ink-900 dark:text-white">
                Candidate Comparison Matrix
              </h2>
            </div>
            <p className="text-xs text-ink-500 dark:text-[#8b949e] mt-0.5">
              Evaluating {candidatesData.length} candidates side-by-side for <span className="font-semibold text-ink-800 dark:text-[#f0f6fc]">{opp.title}</span>
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-full p-1.5 text-ink-400 dark:text-[#8b949e] hover:bg-ink-100 dark:hover:bg-[#30363d] hover:text-ink-700 dark:hover:text-white transition"
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
                  <div className="mt-2 flex justify-center">
                    <PipelineLevelBadge status={app?.status} />
                  </div>
                  <div className="mt-3 flex items-center justify-center gap-1 flex-wrap">
                    <button
                      onClick={() => onUpdateStatus(id, 'Applied')}
                      className={`rounded-md px-1.5 py-0.5 text-[10px] font-bold transition ${
                        !app?.status || app?.status === 'Applied' ? 'bg-indigo-600 text-white' : 'bg-ink-100 dark:bg-[#21262d] text-ink-600 dark:text-[#8b949e] hover:bg-ink-200'
                      }`}
                      title="Level 1 Review"
                    >
                      L1
                    </button>
                    <button
                      onClick={() => onUpdateStatus(id, 'Shortlisted')}
                      className={`rounded-md px-1.5 py-0.5 text-[10px] font-bold transition ${
                        app?.status === 'Shortlisted' ? 'bg-brand-600 text-white' : 'bg-brand-50 dark:bg-brand-950/40 text-brand-700 dark:text-brand-300 hover:bg-brand-100'
                      }`}
                      title="Level 2 Shortlist"
                    >
                      L2 Shortlist
                    </button>
                    <button
                      onClick={() => onUpdateStatus(id, 'Interviewing')}
                      className={`rounded-md px-1.5 py-0.5 text-[10px] font-bold transition ${
                        app?.status === 'Interviewing' ? 'bg-amber-600 text-white' : 'bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 hover:bg-amber-100'
                      }`}
                      title="Level 3 Interview"
                    >
                      L3 Interview
                    </button>
                    <button
                      onClick={() => onUpdateStatus(id, 'Offered')}
                      className={`rounded-md px-1.5 py-0.5 text-[10px] font-bold transition ${
                        app?.status === 'Offered' ? 'bg-emerald-600 text-white' : 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 hover:bg-emerald-100'
                      }`}
                      title="Level 4 Offer"
                    >
                      L4 Offer
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
                  className="grid grid-cols-[200px_repeat(auto-fit,minmax(200px,1fr))] gap-4 items-center rounded-xl border border-ink-100 dark:border-[#30363d] bg-white dark:bg-[#161b22] p-3 hover:bg-ink-50/40 dark:hover:bg-[#21262d] transition"
                >
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="font-semibold text-xs text-ink-900 dark:text-white">{name}</span>
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
              <div className="font-bold text-sm text-ink-900 dark:text-white truncate">{student.name}</div>
              <div className="text-[11px] text-ink-500 truncate">{student.program}</div>
            </div>
          </div>
          <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-brand-50 border border-brand-200 text-brand-700 font-extrabold text-xs shadow-2xs">
            {result.matchScore}%
          </div>
        </div>

        <div className="mt-2.5">
          <PipelineLevelBadge status={stage} />
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

      <div className="mt-4 pt-3 border-t border-ink-100 dark:border-[#30363d]">
        <div className="flex items-center justify-between gap-1.5 flex-wrap">
          <button
            onClick={onDetails}
            className="text-[11px] font-semibold text-brand-600 hover:text-brand-800 transition py-1"
          >
            Inspect Proof →
          </button>

          <div className="flex items-center gap-1.5 flex-wrap">
            {stage === 'Applied' && (
              <>
                <button
                  onClick={() => onUpdateStatus('Shortlisted')}
                  className="rounded-lg bg-brand-600 hover:bg-brand-700 px-2.5 py-1 text-[11px] font-bold text-white transition shadow-2xs"
                  title="Advance to Level 2 (Shortlist)"
                >
                  Advance to L2 (Shortlist) →
                </button>
                <button
                  onClick={() => onUpdateStatus('Rejected')}
                  className="rounded-lg bg-rose-50 border border-rose-200 px-2 py-1 text-[11px] font-bold text-rose-700 hover:bg-rose-100 transition"
                  title="Reject candidate"
                >
                  Reject
                </button>
              </>
            )}

            {stage === 'Shortlisted' && (
              <>
                <button
                  onClick={() => onUpdateStatus('Interviewing')}
                  className="rounded-lg bg-amber-500 hover:bg-amber-600 px-2.5 py-1 text-[11px] font-bold text-white transition shadow-2xs"
                  title="Advance to Level 3 (Interview)"
                >
                  Advance to L3 (Interview) →
                </button>
                <button
                  onClick={() => onUpdateStatus('Offered')}
                  className="rounded-lg bg-emerald-600 hover:bg-emerald-700 px-2 py-1 text-[11px] font-bold text-white transition shadow-2xs"
                  title="Direct L4 Offer"
                >
                  L4 Offer
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
                  className="rounded-lg bg-emerald-600 hover:bg-emerald-700 px-2.5 py-1 text-[11px] font-bold text-white transition shadow-2xs"
                  title="Pass interview and advance to Level 4 (Extend Offer)"
                >
                  Advance to L4 (Extend Offer) →
                </button>
                <button
                  onClick={() => onUpdateStatus('Rejected')}
                  className="rounded-lg bg-rose-50 border border-rose-200 px-2 py-1 text-[11px] font-bold text-rose-700 hover:bg-rose-100 transition"
                  title="Reject"
                >
                  Reject
                </button>
              </>
            )}

            {stage === 'Offered' && (
              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-200">
                <CheckCircle2 className="h-3.5 w-3.5" /> Level 4 Offer Extended
              </span>
            )}

            {stage === 'Rejected' && (
              <div className="flex items-center gap-1">
                <button
                  onClick={() => onUpdateStatus('Applied')}
                  className="rounded-lg bg-ink-100 hover:bg-ink-200 px-2 py-1 text-[11px] font-bold text-ink-700 transition"
                  title="Restore to Level 1 (Review)"
                >
                  ↩️ L1 Review
                </button>
                <button
                  onClick={() => onUpdateStatus('Shortlisted')}
                  className="rounded-lg bg-brand-50 hover:bg-brand-100 border border-brand-200 px-2 py-1 text-[11px] font-bold text-brand-700 transition"
                  title="Restore to Level 2 (Shortlist)"
                >
                  ⭐ L2 Shortlist
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
}
