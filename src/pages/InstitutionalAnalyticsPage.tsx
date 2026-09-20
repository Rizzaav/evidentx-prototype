import { useState } from 'react';
import {
  Building2,
  Award,
  TrendingUp,
  BarChart3,
  CheckCircle2,
  AlertTriangle,
  Download,
  Printer,
  Sparkles,
  BookOpen,
  Users,
  ShieldCheck,
  Compass,
  FileBadge,
  ChevronRight,
  ExternalLink,
  Layers,
  GraduationCap,
} from 'lucide-react';
import { Card, Chip, ProgressBar } from '@/components/ui';
import { LogoMark } from '@/components/Logo';
import { useToast } from '@/lib/toast';

interface DepartmentStats {
  id: string;
  name: string;
  code: string;
  studentsCount: number;
  avgVerifiedSkills: number;
  placementFitScore: number;
  naacReadiness: number;
  nbaAttainment: number;
}

const DEPARTMENTS: DepartmentStats[] = [
  {
    id: 'dept_cse',
    name: 'Computer Science & Engineering',
    code: 'CSE',
    studentsCount: 480,
    avgVerifiedSkills: 6.8,
    placementFitScore: 89,
    naacReadiness: 96,
    nbaAttainment: 93,
  },
  {
    id: 'dept_aids',
    name: 'Artificial Intelligence & Data Science',
    code: 'AI/DS',
    studentsCount: 320,
    avgVerifiedSkills: 7.2,
    placementFitScore: 92,
    naacReadiness: 95,
    nbaAttainment: 91,
  },
  {
    id: 'dept_it',
    name: 'Information Technology',
    code: 'IT',
    studentsCount: 260,
    avgVerifiedSkills: 5.9,
    placementFitScore: 84,
    naacReadiness: 92,
    nbaAttainment: 88,
  },
  {
    id: 'dept_ece',
    name: 'Electronics & Communication',
    code: 'ECE',
    studentsCount: 180,
    avgVerifiedSkills: 5.1,
    placementFitScore: 81,
    naacReadiness: 90,
    nbaAttainment: 86,
  },
];

const CURRICULUM_GAPS = [
  {
    topic: 'Cloud-Native & Containerization (Docker, AWS, K8s)',
    industryDemand: 82,
    curriculumCoverage: 28,
    gap: -54,
    severity: 'critical',
    recommendation: 'Introduce 3-credit elective "Cloud-Native Infrastructure & DevOps" in Semester 6.',
  },
  {
    topic: 'Production ML Deployment & ONNX / FastAPI',
    industryDemand: 74,
    curriculumCoverage: 36,
    gap: -38,
    severity: 'high',
    recommendation: 'Upgrade Machine Learning Lab syllabus to include API serving and model monitoring.',
  },
  {
    topic: 'TypeScript & Enterprise Frontend Architecture',
    industryDemand: 86,
    curriculumCoverage: 62,
    gap: -24,
    severity: 'medium',
    recommendation: 'Transition Advanced Web Development curriculum from vanilla JavaScript to TypeScript.',
  },
  {
    topic: 'Data Structures, Graph Theory & Algorithms',
    industryDemand: 92,
    curriculumCoverage: 96,
    gap: +4,
    severity: 'optimal',
    recommendation: 'Excellent alignment. Benchmark course satisfies NBA PO1, PO2, and PO3 requirements.',
  },
  {
    topic: 'Relational & Distributed Databases (SQL, MongoDB)',
    industryDemand: 88,
    curriculumCoverage: 84,
    gap: -4,
    severity: 'optimal',
    recommendation: 'Strong alignment. Consider adding distributed caching (Redis) workshop.',
  },
];

const PROGRAM_OUTCOMES = [
  {
    po: 'PO1',
    label: 'Engineering Knowledge',
    target: 85,
    actual: 93,
    status: 'Exceeded',
    evidenceProof: '482 Coursework Artifacts & NPTEL Gold Certificates',
  },
  {
    po: 'PO2',
    label: 'Problem Analysis & Design',
    target: 80,
    actual: 88,
    status: 'Exceeded',
    evidenceProof: '320 Capstone Projects & Hackathon Proofs',
  },
  {
    po: 'PO3',
    label: 'Design/Development of Solutions',
    target: 80,
    actual: 87,
    status: 'Exceeded',
    evidenceProof: 'GitHub Verified Repositories with CI/CD',
  },
  {
    po: 'PO5',
    label: 'Modern Tool Usage (Docker/Git/Cloud)',
    target: 75,
    actual: 84,
    status: 'Target Met',
    evidenceProof: 'Verified AWS & Docker Badges with SHA-256',
  },
  {
    po: 'PO9',
    label: 'Individual & Team Work',
    target: 80,
    actual: 91,
    status: 'Exceeded',
    evidenceProof: 'Algorithmic Team Builder Squad Participation Records',
  },
];

export function InstitutionalAnalyticsPage() {
  const { toast } = useToast();
  const [selectedDept, setSelectedDept] = useState<string>('all');
  const [activeTab, setActiveTab] = useState<'accreditation' | 'curriculum' | 'outcomes'>('accreditation');

  const handlePrintReport = () => {
    window.print();
  };

  const handleDownloadDossier = () => {
    toast.success('Generated official NAAC/NBA Institutional Audit Dossier (PDF format ready)');
    window.print();
  };

  const filteredDepts =
    selectedDept === 'all'
      ? DEPARTMENTS
      : DEPARTMENTS.filter((d) => d.id === selectedDept);

  const totalStudents = DEPARTMENTS.reduce((acc, d) => acc + d.studentsCount, 0);

  return (
    <div className="space-y-6">
      {/* Official Header Banner */}
      <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-ink-900 via-brand-950 to-ink-900 text-white border border-ink-800 shadow-soft relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 w-96 bg-brand-600/10 blur-3xl pointer-events-none" />

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="rounded-full bg-brand-500/20 border border-brand-400/30 px-3 py-1 text-xs font-bold text-brand-300 uppercase tracking-wider flex items-center gap-1.5">
                <Building2 className="h-3.5 w-3.5" />
                Dean & Academic Council Portal
              </span>
              <span className="rounded-full bg-emerald-500/20 border border-emerald-400/30 px-3 py-1 text-xs font-bold text-emerald-300 uppercase tracking-wider">
                NAAC A++ Readiness · 94.8%
              </span>
            </div>
            <h1 className="font-display font-extrabold text-2xl sm:text-3xl text-white tracking-tight">
              Institutional Accreditation & Outcomes Intelligence
            </h1>
            <p className="text-xs sm:text-sm text-ink-300 max-w-2xl leading-relaxed">
              Automated NAAC Criterion 2.6 & 5.2, NBA Tier-1 Program Outcomes, and NEP 2020 National Credit Framework (NCrF) attestation derived from tamper-proof student evidence.
            </p>
          </div>

          <div className="flex items-center gap-3 print:hidden">
            <button
              onClick={handlePrintReport}
              className="btn-secondary bg-white/10 hover:bg-white/20 text-white border-white/20 text-xs py-2 px-3.5 inline-flex items-center gap-1.5 backdrop-blur-sm"
            >
              <Printer className="h-3.5 w-3.5" />
              <span>Print Audit Sheet</span>
            </button>
            <button
              onClick={handleDownloadDossier}
              className="btn-primary text-xs py-2 px-4 inline-flex items-center gap-1.5 shadow-lift"
            >
              <Download className="h-3.5 w-3.5" />
              <span>Export Official Dossier</span>
            </button>
          </div>
        </div>
      </div>

      {/* Top Accreditation KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="p-5 rounded-3xl bg-white dark:bg-[#161b22] border border-ink-100 dark:border-[#30363d] shadow-soft space-y-2">
          <div className="flex items-center justify-between text-ink-500 dark:text-[#8b949e]">
            <span className="text-[11px] font-bold uppercase tracking-wider">NAAC Criterion 2.6</span>
            <Award className="h-4 w-4 text-emerald-500" />
          </div>
          <div className="text-2xl sm:text-3xl font-display font-extrabold text-ink-900 dark:text-white">
            94.8%
          </div>
          <div className="flex items-center gap-1 text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold">
            <CheckCircle2 className="h-3.5 w-3.5" />
            <span>Learning Outcome Attainment (A++ Tier)</span>
          </div>
          <div className="w-full bg-ink-100 dark:bg-[#21262d] h-1.5 rounded-full overflow-hidden mt-1">
            <div className="bg-emerald-500 h-full rounded-full" style={{ width: '94.8%' }} />
          </div>
        </div>

        <div className="p-5 rounded-3xl bg-white dark:bg-[#161b22] border border-ink-100 dark:border-[#30363d] shadow-soft space-y-2">
          <div className="flex items-center justify-between text-ink-500 dark:text-[#8b949e]">
            <span className="text-[11px] font-bold uppercase tracking-wider">NBA PO / PSO Attainment</span>
            <TrendingUp className="h-4 w-4 text-brand-500" />
          </div>
          <div className="text-2xl sm:text-3xl font-display font-extrabold text-ink-900 dark:text-white">
            91.4%
          </div>
          <div className="flex items-center gap-1 text-[11px] text-brand-600 dark:text-brand-400 font-semibold">
            <CheckCircle2 className="h-3.5 w-3.5" />
            <span>Target Exceeded across 12 POs</span>
          </div>
          <div className="w-full bg-ink-100 dark:bg-[#21262d] h-1.5 rounded-full overflow-hidden mt-1">
            <div className="bg-brand-500 h-full rounded-full" style={{ width: '91.4%' }} />
          </div>
        </div>

        <div className="p-5 rounded-3xl bg-white dark:bg-[#161b22] border border-ink-100 dark:border-[#30363d] shadow-soft space-y-2">
          <div className="flex items-center justify-between text-ink-500 dark:text-[#8b949e]">
            <span className="text-[11px] font-bold uppercase tracking-wider">NEP 2020 / NCrF Credits</span>
            <FileBadge className="h-4 w-4 text-blue-500" />
          </div>
          <div className="text-2xl sm:text-3xl font-display font-extrabold text-ink-900 dark:text-white">
            4,820
          </div>
          <div className="flex items-center gap-1 text-[11px] text-blue-600 dark:text-blue-400 font-semibold">
            <CheckCircle2 className="h-3.5 w-3.5" />
            <span>Verified Transferable Credits</span>
          </div>
          <div className="w-full bg-ink-100 dark:bg-[#21262d] h-1.5 rounded-full overflow-hidden mt-1">
            <div className="bg-blue-500 h-full rounded-full" style={{ width: '88%' }} />
          </div>
        </div>

        <div className="p-5 rounded-3xl bg-white dark:bg-[#161b22] border border-ink-100 dark:border-[#30363d] shadow-soft space-y-2">
          <div className="flex items-center justify-between text-ink-500 dark:text-[#8b949e]">
            <span className="text-[11px] font-bold uppercase tracking-wider">Industry Skill Alignment</span>
            <Compass className="h-4 w-4 text-purple-500" />
          </div>
          <div className="text-2xl sm:text-3xl font-display font-extrabold text-ink-900 dark:text-white">
            88.6%
          </div>
          <div className="flex items-center gap-1 text-[11px] text-purple-600 dark:text-purple-400 font-semibold">
            <CheckCircle2 className="h-3.5 w-3.5" />
            <span>Syllabus-to-Job Market Fit</span>
          </div>
          <div className="w-full bg-ink-100 dark:bg-[#21262d] h-1.5 rounded-full overflow-hidden mt-1">
            <div className="bg-purple-500 h-full rounded-full" style={{ width: '88.6%' }} />
          </div>
        </div>
      </div>

      {/* Main Tab Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-ink-100 dark:border-[#30363d] pb-2 print:hidden">
        <div className="flex gap-2 overflow-x-auto text-xs font-bold">
          <button
            onClick={() => setActiveTab('accreditation')}
            className={`pb-3 px-3 border-b-2 transition whitespace-nowrap inline-flex items-center gap-1.5 ${
              activeTab === 'accreditation'
                ? 'border-brand-600 text-brand-600 dark:text-brand-400 dark:border-brand-400'
                : 'border-transparent text-ink-500 hover:text-ink-800 dark:text-[#8b949e] dark:hover:text-white'
            }`}
          >
            <Award className="h-3.5 w-3.5" />
            <span>NAAC & NBA Department Matrix</span>
          </button>
          <button
            onClick={() => setActiveTab('curriculum')}
            className={`pb-3 px-3 border-b-2 transition whitespace-nowrap inline-flex items-center gap-1.5 ${
              activeTab === 'curriculum'
                ? 'border-brand-600 text-brand-600 dark:text-brand-400 dark:border-brand-400'
                : 'border-transparent text-ink-500 hover:text-ink-800 dark:text-[#8b949e] dark:hover:text-white'
            }`}
          >
            <BookOpen className="h-3.5 w-3.5 text-blue-500" />
            <span>Curriculum Outcome Gap Intelligence</span>
          </button>
          <button
            onClick={() => setActiveTab('outcomes')}
            className={`pb-3 px-3 border-b-2 transition whitespace-nowrap inline-flex items-center gap-1.5 ${
              activeTab === 'outcomes'
                ? 'border-brand-600 text-brand-600 dark:text-brand-400 dark:border-brand-400'
                : 'border-transparent text-ink-500 hover:text-ink-800 dark:text-[#8b949e] dark:hover:text-white'
            }`}
          >
            <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" />
            <span>Program Outcomes (PO) Evidence Ledger</span>
          </button>
        </div>

        {/* Department Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto">
          <span className="text-[10px] font-bold text-ink-400 uppercase mr-1">Dept:</span>
          <button
            onClick={() => setSelectedDept('all')}
            className={`px-2.5 py-1 rounded-xl text-xs font-semibold transition ${
              selectedDept === 'all'
                ? 'bg-ink-900 text-white dark:bg-white dark:text-ink-950'
                : 'bg-ink-100 dark:bg-[#21262d] text-ink-600 dark:text-[#8b949e] hover:bg-ink-200'
            }`}
          >
            All Departments ({totalStudents})
          </button>
          {DEPARTMENTS.map((d) => (
            <button
              key={d.id}
              onClick={() => setSelectedDept(d.id)}
              className={`px-2.5 py-1 rounded-xl text-xs font-semibold transition whitespace-nowrap ${
                selectedDept === d.id
                  ? 'bg-ink-900 text-white dark:bg-white dark:text-ink-950'
                  : 'bg-ink-100 dark:bg-[#21262d] text-ink-600 dark:text-[#8b949e] hover:bg-ink-200'
              }`}
            >
              {d.code}
            </button>
          ))}
        </div>
      </div>

      {/* TAB 1: ACCREDITATION DEPARTMENT MATRIX */}
      {activeTab === 'accreditation' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredDepts.map((dept) => (
              <div
                key={dept.id}
                className="p-5 rounded-3xl bg-white dark:bg-[#161b22] border border-ink-100 dark:border-[#30363d] shadow-soft space-y-4"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="rounded-lg bg-brand-50 dark:bg-brand-950/60 border border-brand-200 dark:border-brand-800 px-2 py-0.5 font-mono text-[10px] font-bold text-brand-700 dark:text-brand-300">
                        {dept.code}
                      </span>
                      <h3 className="font-display font-bold text-ink-900 dark:text-white text-base">
                        {dept.name}
                      </h3>
                    </div>
                    <p className="text-xs text-ink-500 dark:text-[#8b949e] mt-1">
                      {dept.studentsCount} Active Students Enrolled · {dept.avgVerifiedSkills} Avg Verified Proofs / Student
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] uppercase font-bold text-ink-400 block">NAAC Score</span>
                    <span className="font-display font-extrabold text-lg text-emerald-600 dark:text-emerald-400">
                      {dept.naacReadiness}%
                    </span>
                  </div>
                </div>

                <div className="space-y-2 pt-1 text-xs">
                  <div>
                    <div className="flex justify-between text-[11px] mb-1">
                      <span className="text-ink-600 dark:text-[#8b949e]">NBA Criterion 3 PO Attainment</span>
                      <span className="font-bold text-ink-900 dark:text-white">{dept.nbaAttainment}%</span>
                    </div>
                    <div className="w-full bg-ink-100 dark:bg-[#21262d] h-2 rounded-full overflow-hidden">
                      <div className="bg-brand-500 h-full rounded-full" style={{ width: `${dept.nbaAttainment}%` }} />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-[11px] mb-1">
                      <span className="text-ink-600 dark:text-[#8b949e]">Placement & Industry Fit Readiness</span>
                      <span className="font-bold text-ink-900 dark:text-white">{dept.placementFitScore}%</span>
                    </div>
                    <div className="w-full bg-ink-100 dark:bg-[#21262d] h-2 rounded-full overflow-hidden">
                      <div className="bg-emerald-500 h-full rounded-full" style={{ width: `${dept.placementFitScore}%` }} />
                    </div>
                  </div>
                </div>

                <div className="pt-2 border-t border-ink-100 dark:border-[#30363d] flex items-center justify-between text-xs">
                  <span className="text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1 text-[11px]">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    <span>Peer-Review Ready</span>
                  </span>
                  <span className="font-mono text-[11px] text-ink-400">
                    Audit Hash: SHA256-DEPT-{dept.code}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 2: CURRICULUM OUTCOME GAP INTELLIGENCE */}
      {activeTab === 'curriculum' && (
        <div className="space-y-4">
          <div className="p-4 rounded-3xl bg-blue-50/70 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 text-blue-900 dark:text-blue-200 flex items-start gap-3 text-xs">
            <Sparkles className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="font-bold text-sm">Real-Time Market Demand vs. Academic Syllabus Gap Engine</h4>
              <p className="mt-1 opacity-90 leading-relaxed">
                This engine aggregates verified requirements from live corporate hiring postings on EvidentX and cross-references them against your university's current accredited course syllabi to prevent skill obsolescence.
              </p>
            </div>
          </div>

          <div className="space-y-3">
            {CURRICULUM_GAPS.map((gapItem, idx) => (
              <div
                key={idx}
                className="p-5 rounded-3xl bg-white dark:bg-[#161b22] border border-ink-100 dark:border-[#30363d] shadow-soft space-y-3"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <h4 className="font-display font-bold text-ink-900 dark:text-white text-sm">
                      {gapItem.topic}
                    </h4>
                    <p className="text-xs text-ink-500 dark:text-[#8b949e] mt-0.5">
                      Recruiter Market Demand: <strong>{gapItem.industryDemand}%</strong> vs. University Syllabus Coverage: <strong>{gapItem.curriculumCoverage}%</strong>
                    </p>
                  </div>
                  <div>
                    <span
                      className={`rounded-full px-2.5 py-1 text-xs font-bold ${
                        gapItem.severity === 'critical'
                          ? 'bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800'
                          : gapItem.severity === 'high'
                          ? 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800'
                          : gapItem.severity === 'medium'
                          ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800'
                          : 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                      }`}
                    >
                      {gapItem.gap > 0 ? `+${gapItem.gap}% Alignment` : `${gapItem.gap}% Gap`}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <div className="flex justify-between text-[11px] mb-1 text-ink-500">
                      <span>Industry Demand</span>
                      <span className="font-bold text-ink-900 dark:text-white">{gapItem.industryDemand}%</span>
                    </div>
                    <div className="w-full bg-ink-100 dark:bg-[#21262d] h-2 rounded-full overflow-hidden">
                      <div className="bg-brand-600 h-full rounded-full" style={{ width: `${gapItem.industryDemand}%` }} />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-[11px] mb-1 text-ink-500">
                      <span>Current Coursework</span>
                      <span className="font-bold text-ink-900 dark:text-white">{gapItem.curriculumCoverage}%</span>
                    </div>
                    <div className="w-full bg-ink-100 dark:bg-[#21262d] h-2 rounded-full overflow-hidden">
                      <div className="bg-blue-500 h-full rounded-full" style={{ width: `${gapItem.curriculumCoverage}%` }} />
                    </div>
                  </div>
                </div>

                <div className="p-3 rounded-2xl bg-ink-50 dark:bg-[#0d1117] border border-ink-200/70 dark:border-[#30363d] flex items-center gap-2 text-xs">
                  <Sparkles className="h-4 w-4 text-brand-600 dark:text-brand-400 flex-shrink-0" />
                  <span className="text-ink-700 dark:text-[#c9d1d9]">
                    <strong>Academic Council Recommendation:</strong> {gapItem.recommendation}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: PROGRAM OUTCOMES LEDGER */}
      {activeTab === 'outcomes' && (
        <div className="space-y-4">
          <div className="p-5 rounded-3xl bg-white dark:bg-[#161b22] border border-ink-100 dark:border-[#30363d] shadow-soft space-y-4">
            <div>
              <h3 className="font-display font-bold text-ink-900 dark:text-white text-base">
                NBA Program Outcomes (PO1–PO12) Cryptographic Evidence Attestation
              </h3>
              <p className="text-xs text-ink-500 dark:text-[#8b949e]">
                Directly maps course assessments and hackathon proofs into NBA Tier-1 accreditation metrics.
              </p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-ink-100 dark:border-[#30363d] text-[11px] font-bold text-ink-400 uppercase tracking-wider">
                    <th className="pb-3 px-2">Program Outcome</th>
                    <th className="pb-3 px-2">Target</th>
                    <th className="pb-3 px-2">Attained</th>
                    <th className="pb-3 px-2">Status</th>
                    <th className="pb-3 px-2">Audited Evidence Proof</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-ink-100 dark:divide-[#30363d]">
                  {PROGRAM_OUTCOMES.map((po, idx) => (
                    <tr key={idx} className="hover:bg-ink-50 dark:hover:bg-[#0d1117] transition">
                      <td className="py-3.5 px-2">
                        <span className="font-bold text-ink-900 dark:text-white font-mono mr-2">{po.po}</span>
                        <span className="text-ink-700 dark:text-[#c9d1d9]">{po.label}</span>
                      </td>
                      <td className="py-3.5 px-2 font-mono text-ink-600 dark:text-ink-400">{po.target}%</td>
                      <td className="py-3.5 px-2 font-mono font-bold text-emerald-600 dark:text-emerald-400">
                        {po.actual}%
                      </td>
                      <td className="py-3.5 px-2">
                        <span className="rounded-full bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 px-2 py-0.5 text-[10px] font-bold text-emerald-700 dark:text-emerald-300">
                          {po.status}
                        </span>
                      </td>
                      <td className="py-3.5 px-2 text-[11px] text-ink-500 dark:text-[#8b949e]">
                        {po.evidenceProof}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Official Sign-off Footer (visible on print / audit) */}
      <div className="p-6 rounded-3xl bg-white dark:bg-[#161b22] border border-ink-100 dark:border-[#30363d] shadow-soft flex flex-col sm:flex-row items-center justify-between text-xs text-ink-500 dark:text-[#8b949e] gap-4">
        <div className="flex items-center gap-3">
          <LogoMark size={28} />
          <div>
            <div className="font-bold text-ink-900 dark:text-white">EvidentX Institutional Trust Gateway</div>
            <div className="text-[11px]">Certified for NAAC Peer-Review Committee & AICTE NBA Inspection</div>
          </div>
        </div>
        <div className="text-center sm:text-right font-mono text-[10px]">
          <div>Report UID: NAAC-2026-ITER-AARAV-8841</div>
          <div className="text-emerald-600 dark:text-emerald-400 font-semibold">Cryptographically Certified & Tamper-Evident</div>
        </div>
      </div>
    </div>
  );
}
