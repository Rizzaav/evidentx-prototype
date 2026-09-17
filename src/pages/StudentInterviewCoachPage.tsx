import { useState, useMemo, useEffect } from 'react';
import {
  Brain,
  Sparkles,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  Clock,
  RotateCcw,
  Target,
  FileBadge,
  Award,
  ChevronDown,
  ChevronUp,
  History,
  Send,
  ThumbsUp,
  Zap,
  Lightbulb,
  ShieldCheck,
  Compass,
} from 'lucide-react';
import { useRouter } from '@/lib/router';
import {
  PageHeader,
  Card,
  Chip,
  SkillBadge,
  ProgressBar,
  Section,
} from '@/components/ui';
import { useDemoStudent } from '@/lib/useDemoStudent';
import { getStudentEvidence, getStudentSkills, skillMap } from '@/data/mockData';
import { useToast } from '@/lib/toast';

interface InterviewQuestion {
  id: string;
  category: 'Full-Stack' | 'AI & ML' | 'Systems & Backend' | 'Architecture';
  difficulty: 'Mid-Level' | 'Senior (L5)' | 'Foundational';
  title: string;
  evidenceTitle: string;
  evidenceType: string;
  targetSkills: string[];
  scenario: string;
  starTip: string;
  modelAnswer: string;
}

interface PracticeAttempt {
  id: string;
  questionId: string;
  questionTitle: string;
  evidenceTitle: string;
  answer: string;
  scores: {
    technical: number;
    evidence: number;
    communication: number;
  };
  overallGrade: string;
  strengths: string[];
  improvements: string[];
  timestamp: string;
}

export function StudentInterviewCoachPage() {
  const { navigate } = useRouter();
  const { studentId, student } = useDemoStudent();
  const { toast } = useToast();

  const evidenceList = useMemo(() => (studentId ? getStudentEvidence(studentId) : []), [studentId]);
  const studentSkills = useMemo(() => (studentId ? getStudentSkills(studentId) : []), [studentId]);

  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedQuestionId, setSelectedQuestionId] = useState<string>('');
  const [userAnswer, setUserAnswer] = useState<string>('');
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [showStarGuide, setShowStarGuide] = useState<boolean>(false);
  const [showModelAnswer, setShowModelAnswer] = useState<boolean>(false);
  const [activeFeedback, setActiveFeedback] = useState<PracticeAttempt | null>(null);

  // Local storage practice history
  const historyStorageKey = `evx_coach_history_${studentId ?? 'demo'}`;
  const [practiceHistory, setPracticeHistory] = useState<PracticeAttempt[]>(() => {
    try {
      const raw = localStorage.getItem(historyStorageKey);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  });

  // Dynamically generate interview questions grounded in actual student evidence
  const questions: InterviewQuestion[] = useMemo(() => {
    const defaultProject = evidenceList[0]?.title ?? 'Distributed Cloud Application';
    const secondProject = evidenceList[1]?.title ?? 'Full-Stack Analytics Engine';

    return [
      {
        id: 'q_1',
        category: 'Full-Stack',
        difficulty: 'Senior (L5)',
        title: 'Optimizing State & Async Data Pipelines',
        evidenceTitle: defaultProject,
        evidenceType: 'Project Artifact',
        targetSkills: ['s_react', 's_ts', 's_node'],
        scenario: `In your verified work on "${defaultProject}", you implemented client-side state handling and async backend API calls. Walk me through how you diagnosed and resolved race conditions or unnecessary re-renders when high-frequency data streams arrived.`,
        starTip: 'Focus on specific hooks (useMemo, useCallback, or custom debounce), cache invalidation strategies, and concrete render cycle benchmarks.',
        modelAnswer: `In "${defaultProject}", high-frequency updates triggered redundant reconciliation cycles. I isolated the root cause by profiling component flame charts in React DevTools, identifying excessive prop drilling across three container levels.\n\nI refactored the pipeline by introducing an optimistic atomic state store and batching socket payload dispatches into 60Hz animation frames. For network queries, I implemented an exponential backoff with request deduplication keys. This reduced CPU main-thread blocking time by 74% and completely eliminated UI stutter during continuous telemetry streaming.`,
      },
      {
        id: 'q_2',
        category: 'Systems & Backend',
        difficulty: 'Senior (L5)',
        title: 'Database Schema Design & Query Optimization',
        evidenceTitle: secondProject,
        evidenceType: 'Verified Coursework & Capstone',
        targetSkills: ['s_sql', 's_node', 's_docker'],
        scenario: `Looking at your verified evidence in "${secondProject}", you handled structured persistence. If the query volume on your primary database increased by 50x overnight, what index strategy, schema partitioning, or caching layers would you deploy first?`,
        starTip: 'State the exact index structures (B-Tree, composite, partial), explain write-amplification trade-offs, and describe Redis cache-aside invalidation.',
        modelAnswer: `In "${secondProject}", write-heavy transactional operations were our main bottleneck. At 50x scale, I would first analyze EXPLAIN ANALYZE query plans on the heaviest join paths. I would introduce composite indexes on (tenant_id, created_at DESC) to eliminate sequential table scans.\n\nFor high-velocity read queries, I would implement a Redis cache-aside layer with jittered TTLs to prevent cache stampedes. On the persistence tier, I would evaluate hash partitioning by date range to keep active working sets within RAM, keeping P99 query latency under 18ms.`,
      },
      {
        id: 'q_3',
        category: 'AI & ML',
        difficulty: 'Mid-Level',
        title: 'Model Evaluation & Data Imbalance Strategies',
        evidenceTitle: evidenceList.find((e) => e.skills.includes('s_ml') || e.skills.includes('s_python'))?.title ?? defaultProject,
        evidenceType: 'Research & Model Artifact',
        targetSkills: ['s_python', 's_ml', 's_pandas'],
        scenario: `When training your verified models for "${evidenceList.find((e) => e.skills.includes('s_ml'))?.title ?? 'Predictive ML Pipeline'}", how did you guard against overfitting and verify that real-world deployment data wouldn't suffer from data leakage?`,
        starTip: 'Discuss stratified k-fold splits, pipeline transforms strictly fit on training folds only, and metric selection (PR-AUC vs ROC-AUC) on skewed distributions.',
        modelAnswer: `During the evaluation phase, class distribution was heavily skewed at roughly 92:8. Relying on raw accuracy would have produced a deceptively high but useless metric. I replaced accuracy with PR-AUC and F1-macro as the primary convergence targets.\n\nTo eliminate data leakage, all imputation and feature normalization scalers were strictly fit inside cross-validation training folds using scikit-learn Pipelines, never on the combined dataset. We also conducted out-of-time split validation to simulate true production drift.`,
      },
      {
        id: 'q_4',
        category: 'Architecture',
        difficulty: 'Senior (L5)',
        title: 'Production Incident Post-Mortem & Failover',
        evidenceTitle: defaultProject,
        evidenceType: 'Production Evidence',
        targetSkills: ['s_docker', 's_git', 's_problem'],
        scenario: `Describe an unexpected production failure, corrupt build, or third-party dependency outage in "${defaultProject}". How did you maintain system availability and establish preventative safeguards?`,
        starTip: 'Walk through incident triage: Detection -> Containment -> Root Cause -> Long-term architectural prevention.',
        modelAnswer: `During an automated CI deployment in "${defaultProject}", an unpinned transitive upstream dependency introduced a breaking memory leak that caused pod crash-loops in Kubernetes. Our Prometheus liveness probes triggered automated alerts within 45 seconds.\n\nI immediately initiated an automated rollback to the last verified SHA-sealed container tag, restoring service in under 2 minutes. Afterward, I authored a blameless post-mortem, pinned all package lockfiles with cryptographically verified checksums in CI, and instituted circuit breakers on all external API boundaries.`,
      },
    ];
  }, [evidenceList]);

  // Set default question
  useEffect(() => {
    if (questions.length > 0 && !selectedQuestionId) {
      setSelectedQuestionId(questions[0].id);
    }
  }, [questions, selectedQuestionId]);

  const activeQuestion = questions.find((q) => q.id === selectedQuestionId) ?? questions[0];

  const filteredQuestions = useMemo(() => {
    if (selectedCategory === 'all') return questions;
    return questions.filter((q) => q.category === selectedCategory);
  }, [questions, selectedCategory]);

  const wordCount = useMemo(() => {
    return userAnswer.trim() ? userAnswer.trim().split(/\s+/).length : 0;
  }, [userAnswer]);

  // AI Answer Evaluation Simulation
  const handleEvaluateAnswer = () => {
    if (!userAnswer.trim() || wordCount < 20) {
      toast.error('Please write a more detailed response (at least 20 words) for a thorough AI critique.');
      return;
    }

    setIsAnalyzing(true);
    setTimeout(() => {
      // Analyze answer depth based on keywords and length
      const lower = userAnswer.toLowerCase();
      const mentionsEvidence =
        lower.includes('project') ||
        lower.includes('implemented') ||
        lower.includes('designed') ||
        lower.includes('data') ||
        lower.includes('latency') ||
        lower.includes('because');

      const mentionsMetrics =
        lower.includes('%') ||
        lower.includes('reduced') ||
        lower.includes('improved') ||
        lower.includes('result') ||
        lower.includes('metric');

      const hasTechTerms =
        lower.includes('cache') ||
        lower.includes('state') ||
        lower.includes('query') ||
        lower.includes('index') ||
        lower.includes('pipeline') ||
        lower.includes('scale') ||
        lower.includes('api');

      let techScore = Math.min(95, 65 + (hasTechTerms ? 22 : 8) + (wordCount > 60 ? 8 : 0));
      let evidenceScore = Math.min(96, 60 + (mentionsEvidence ? 24 : 10) + (mentionsMetrics ? 12 : 0));
      let commScore = Math.min(98, 70 + (wordCount >= 40 && wordCount <= 220 ? 18 : 6) + (mentionsMetrics ? 10 : 0));

      const avg = Math.round((techScore + evidenceScore + commScore) / 3);
      const grade =
        avg >= 88
          ? 'Strong Hire (L5 Equivalent)'
          : avg >= 78
          ? 'Hire (Production Ready)'
          : avg >= 65
          ? 'Pass with Follow-up'
          : 'Needs Technical Depth';

      const strengths: string[] = [];
      const improvements: string[] = [];

      if (mentionsEvidence) {
        strengths.push('Grounds explanations in real project context rather than purely abstract theory.');
      } else {
        improvements.push('Cite specific architectural decisions or codebase filenames from your verified evidence.');
      }

      if (hasTechTerms) {
        strengths.push('Employs precise industry terminology and recognizes key performance trade-offs.');
      } else {
        improvements.push('Deepen technical precision: specify data structures, API endpoints, or concurrency limits.');
      }

      if (mentionsMetrics) {
        strengths.push('Demonstrates business and technical impact through quantifiable metrics and benchmarks.');
      } else {
        improvements.push('Quantify the outcome: specify latency reduction, test coverage %, or memory savings.');
      }

      if (strengths.length === 0) {
        strengths.push('Clear and direct communication style addressing the core interview prompt.');
      }
      if (improvements.length === 0) {
        improvements.push('Consider mentioning how you would architect this for continuous integration telemetry.');
      }

      const newAttempt: PracticeAttempt = {
        id: 'attempt_' + Date.now(),
        questionId: activeQuestion.id,
        questionTitle: activeQuestion.title,
        evidenceTitle: activeQuestion.evidenceTitle,
        answer: userAnswer,
        scores: {
          technical: techScore,
          evidence: evidenceScore,
          communication: commScore,
        },
        overallGrade: grade,
        strengths,
        improvements,
        timestamp: new Date().toISOString(),
      };

      setActiveFeedback(newAttempt);
      const updatedHistory = [newAttempt, ...practiceHistory].slice(0, 15);
      setPracticeHistory(updatedHistory);
      localStorage.setItem(historyStorageKey, JSON.stringify(updatedHistory));

      setIsAnalyzing(false);
      toast.success('✨ Answer analyzed! Comprehensive AI critique generated.');
    }, 1200);
  };

  const handleSelectStarter = () => {
    setUserAnswer(
      `In my verified project "${activeQuestion.evidenceTitle}", the main technical challenge was ensuring low latency while maintaining strict data integrity.\n\nTo solve this, I designed...`
    );
  };

  return (
    <div className="space-y-6 pb-20">
      <PageHeader
        title="AI Technical Interview Coach"
        subtitle="Role-specific technical questions generated from your verified evidence portfolio with instant rubric critique"
        right={
          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate('/student/passport')}
              className="btn-secondary text-xs inline-flex items-center gap-1.5"
            >
              <FileBadge className="h-3.5 w-3.5 text-brand-600" />
              View Verified Artifacts ({evidenceList.length})
            </button>
            <button
              onClick={() => navigate('/student/skillgap')}
              className="btn-primary text-xs inline-flex items-center gap-1.5"
            >
              <Compass className="h-3.5 w-3.5" />
              Skill Gap Roadmap
            </button>
          </div>
        }
      />

      {/* Profile Evidence Context Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-950 via-brand-950 to-ink-950 p-6 text-white border border-indigo-900/50 shadow-lift">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <span className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl bg-indigo-500/20 text-indigo-300 text-2xl border border-indigo-400/20">
              <Brain className="h-6 w-6 text-indigo-400" />
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-display text-lg font-bold text-white">
                  Evidence-Grounded Interview Preparation
                </h2>
                <Chip color="brand">
                  <span className="text-brand-300">Live Rubric</span>
                </Chip>
              </div>
              <p className="text-xs text-indigo-200/90 mt-1 max-w-2xl leading-relaxed">
                Elite engineering recruiters don't ask generic trivia — they grill you on what you actually built.
                Our AI generates deep architectural questions directly from your verified code, coursework, and projects.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3 border-t border-white/10 pt-3 sm:border-t-0 sm:pt-0">
            <div className="rounded-xl bg-white/10 px-3.5 py-2 text-center">
              <div className="text-lg font-extrabold text-white">{practiceHistory.length}</div>
              <div className="text-[10px] uppercase font-semibold text-indigo-300">Sessions Practiced</div>
            </div>
            <div className="rounded-xl bg-white/10 px-3.5 py-2 text-center">
              <div className="text-lg font-extrabold text-emerald-400">{studentSkills.length}</div>
              <div className="text-[10px] uppercase font-semibold text-indigo-300">Target Skills</div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Studio Grid */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left Column: Questions List & Track Filter */}
        <div className="space-y-4">
          {/* Category Filter Pills */}
          <div className="flex flex-wrap gap-1.5 p-1 rounded-xl bg-ink-100 dark:bg-ink-800/80 border border-ink-200 dark:border-ink-700">
            {['all', 'Full-Stack', 'Systems & Backend', 'AI & ML', 'Architecture'].map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`flex-1 py-1.5 px-2 text-[11px] font-bold rounded-lg transition whitespace-nowrap text-center ${
                  selectedCategory === cat
                    ? 'bg-white dark:bg-ink-900 text-ink-950 dark:text-white shadow-2xs'
                    : 'text-ink-600 dark:text-ink-400 hover:text-ink-900 dark:hover:text-white'
                }`}
              >
                {cat === 'all' ? 'All Tracks' : cat}
              </button>
            ))}
          </div>

          {/* Question Cards List */}
          <div className="space-y-2.5">
            {filteredQuestions.map((q) => {
              const isSelected = q.id === activeQuestion.id;
              return (
                <div
                  key={q.id}
                  onClick={() => {
                    setSelectedQuestionId(q.id);
                    setUserAnswer('');
                    setActiveFeedback(null);
                    setShowModelAnswer(false);
                  }}
                  className={`card p-4 text-left cursor-pointer transition border ${
                    isSelected
                      ? 'ring-2 ring-indigo-500 border-indigo-400 bg-indigo-50/20 dark:bg-indigo-950/30'
                      : 'hover:border-ink-300 dark:hover:border-ink-700'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 mb-1.5">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/50 px-2 py-0.5 rounded border border-indigo-200 dark:border-indigo-800">
                      {q.category}
                    </span>
                    <span className="text-[10px] font-semibold text-ink-500 dark:text-ink-400">
                      {q.difficulty}
                    </span>
                  </div>
                  <h4 className="font-semibold text-ink-900 dark:text-white text-sm leading-snug">
                    {q.title}
                  </h4>
                  <div className="mt-2 flex items-center gap-1.5 text-xs text-ink-500 dark:text-ink-400 truncate">
                    <FileBadge className="h-3.5 w-3.5 text-brand-600 flex-shrink-0" />
                    <span className="truncate">Grounded in: <strong>{q.evidenceTitle}</strong></span>
                  </div>
                  <div className="mt-2 flex flex-wrap gap-1">
                    {q.targetSkills.slice(0, 3).map((skId) => (
                      <span
                        key={skId}
                        className="rounded bg-ink-100 dark:bg-ink-800 px-1.5 py-0.5 text-[10px] font-medium text-ink-600 dark:text-ink-300"
                      >
                        {skillMap[skId]?.name || skId}
                      </span>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Past Sessions History Card */}
          {practiceHistory.length > 0 && (
            <Card className="p-4 border-ink-200 dark:border-ink-800">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold uppercase tracking-wider text-ink-500 dark:text-ink-400 flex items-center gap-1.5">
                  <History className="h-3.5 w-3.5 text-indigo-600" /> Recent Attempts ({practiceHistory.length})
                </span>
                <button
                  onClick={() => {
                    localStorage.removeItem(historyStorageKey);
                    setPracticeHistory([]);
                    toast.info('Practice history cleared');
                  }}
                  className="text-[10px] text-ink-400 hover:text-rose-500 transition"
                >
                  Clear history
                </button>
              </div>
              <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                {practiceHistory.slice(0, 5).map((attempt) => (
                  <div
                    key={attempt.id}
                    className="rounded-lg border border-ink-100 dark:border-ink-800 p-2 text-xs bg-ink-50/50 dark:bg-ink-800/40"
                  >
                    <div className="flex items-center justify-between font-semibold text-ink-900 dark:text-white">
                      <span className="truncate max-w-[170px]">{attempt.questionTitle}</span>
                      <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                        {attempt.scores.technical}%
                      </span>
                    </div>
                    <div className="text-[10px] text-ink-400 mt-0.5">
                      {new Date(attempt.timestamp).toLocaleDateString([], { month: 'short', day: 'numeric' })} · {attempt.overallGrade}
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>

        {/* Right Column (2 spans): Interactive Answering & Critique Studio */}
        <div className="lg:col-span-2 space-y-6">
          {/* Active Question Banner */}
          <Card className="p-6 border-indigo-200 dark:border-indigo-900/60 bg-gradient-to-b from-white to-indigo-50/20 dark:from-ink-900 dark:to-indigo-950/10 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-ink-100 dark:border-ink-800 pb-3">
              <div className="flex items-center gap-2">
                <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
                  <Sparkles className="h-4 w-4" />
                </span>
                <div>
                  <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">
                    {activeQuestion.category} Question
                  </span>
                  <span className="mx-2 text-ink-300">·</span>
                  <span className="text-xs text-ink-500 dark:text-ink-400">{activeQuestion.difficulty}</span>
                </div>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-ink-600 dark:text-ink-300 bg-white dark:bg-ink-800 border border-ink-200 dark:border-ink-700 px-2.5 py-1 rounded-lg">
                <FileBadge className="h-3.5 w-3.5 text-brand-600" />
                Grounded in: <strong>{activeQuestion.evidenceTitle}</strong>
              </div>
            </div>

            <div className="mt-4">
              <h3 className="font-display text-lg font-bold text-ink-950 dark:text-white leading-snug">
                {activeQuestion.scenario}
              </h3>
            </div>

            {/* STAR Tip Box */}
            <div className="mt-4 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/40 p-3 text-xs text-amber-900 dark:text-amber-200 flex items-start gap-2.5">
              <Lightbulb className="h-4 w-4 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
              <div>
                <span className="font-bold">Coach's Pro Tip: </span>
                {activeQuestion.starTip}
              </div>
            </div>

            {/* STAR Framework Accordion Toggle */}
            <div className="mt-3">
              <button
                onClick={() => setShowStarGuide(!showStarGuide)}
                className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline inline-flex items-center gap-1 font-semibold"
              >
                {showStarGuide ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                {showStarGuide ? 'Hide STAR Method Cheatsheet' : 'Show STAR Method Cheatsheet (Situation, Task, Action, Result)'}
              </button>
              {showStarGuide && (
                <div className="mt-2.5 grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs rounded-xl border border-ink-100 dark:border-ink-800 p-3 bg-white dark:bg-ink-900">
                  <div className="rounded-lg p-2 bg-ink-50/80 dark:bg-ink-800/40">
                    <span className="font-bold text-indigo-600 dark:text-indigo-400">S · Situation</span>
                    <p className="text-[11px] text-ink-500 dark:text-ink-400 mt-0.5">The architectural setup, scale, or business constraint.</p>
                  </div>
                  <div className="rounded-lg p-2 bg-ink-50/80 dark:bg-ink-800/40">
                    <span className="font-bold text-indigo-600 dark:text-indigo-400">T · Task</span>
                    <p className="text-[11px] text-ink-500 dark:text-ink-400 mt-0.5">Your specific engineering responsibility.</p>
                  </div>
                  <div className="rounded-lg p-2 bg-ink-50/80 dark:bg-ink-800/40">
                    <span className="font-bold text-indigo-600 dark:text-indigo-400">A · Action</span>
                    <p className="text-[11px] text-ink-500 dark:text-ink-400 mt-0.5">Algorithms, libraries, refactors, and logic implemented.</p>
                  </div>
                  <div className="rounded-lg p-2 bg-ink-50/80 dark:bg-ink-800/40">
                    <span className="font-bold text-indigo-600 dark:text-indigo-400">R · Result</span>
                    <p className="text-[11px] text-ink-500 dark:text-ink-400 mt-0.5">Measurable outcome (ms latency, memory drop, zero downtime).</p>
                  </div>
                </div>
              )}
            </div>

            {/* Answer Input Workspace */}
            <div className="mt-5">
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-bold text-ink-800 dark:text-ink-200 uppercase tracking-wider">
                  Your Answer
                </label>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={handleSelectStarter}
                    className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline font-semibold"
                  >
                    Insert Project Context Starter
                  </button>
                  <span className={`text-xs ${wordCount >= 20 ? 'text-emerald-600 font-semibold' : 'text-ink-400'}`}>
                    {wordCount} words
                  </span>
                </div>
              </div>

              <textarea
                value={userAnswer}
                onChange={(e) => setUserAnswer(e.target.value)}
                placeholder="Structure your answer using STAR method. Reference your specific project implementation, trade-offs, and metrics..."
                rows={7}
                className="w-full rounded-2xl border border-ink-200 dark:border-ink-700 bg-white dark:bg-ink-900 p-4 text-xs sm:text-sm font-sans leading-relaxed text-ink-950 dark:text-white placeholder:text-ink-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-inner"
              />

              <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
                <button
                  onClick={() => setUserAnswer('')}
                  className="text-xs text-ink-400 hover:text-ink-700 dark:hover:text-ink-200 transition"
                >
                  Clear text
                </button>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setShowModelAnswer(!showModelAnswer)}
                    className="btn-secondary text-xs inline-flex items-center gap-1.5"
                  >
                    <Lightbulb className="h-3.5 w-3.5 text-amber-500" />
                    {showModelAnswer ? 'Hide Model Answer' : 'Peek Senior Model Answer'}
                  </button>
                  <button
                    onClick={handleEvaluateAnswer}
                    disabled={isAnalyzing || wordCount < 10}
                    className="btn-primary text-xs inline-flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50"
                  >
                    {isAnalyzing ? (
                      <>
                        <RotateCcw className="h-3.5 w-3.5 animate-spin" /> Evaluating with AI...
                      </>
                    ) : (
                      <>
                        <Zap className="h-3.5 w-3.5 text-amber-300" /> Analyze My Answer with AI
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* Expandable Model Answer */}
            {showModelAnswer && (
              <div className="mt-5 rounded-2xl border border-indigo-200 dark:border-indigo-800/80 bg-indigo-50/40 dark:bg-indigo-950/30 p-4 animate-in fade-in duration-200">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-indigo-700 dark:text-indigo-300 flex items-center gap-1.5">
                    <Award className="h-4 w-4 text-amber-500" /> Senior Engineer (L5) Model Answer
                  </span>
                  <span className="text-[10px] bg-indigo-100 dark:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 px-2 py-0.5 rounded font-mono">
                    Grounded in {activeQuestion.evidenceTitle}
                  </span>
                </div>
                <p className="whitespace-pre-line text-xs font-mono text-ink-800 dark:text-ink-200 leading-relaxed bg-white dark:bg-ink-900 p-3.5 rounded-xl border border-ink-100 dark:border-ink-800">
                  {activeQuestion.modelAnswer}
                </p>
              </div>
            )}
          </Card>

          {/* AI Rubric Feedback Section */}
          {activeFeedback && (
            <Card className="p-6 border-emerald-300 dark:border-emerald-800/80 bg-gradient-to-b from-white to-emerald-50/10 dark:from-ink-900 dark:to-emerald-950/10 shadow-lift animate-in fade-in duration-300">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-ink-100 dark:border-ink-800 pb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                      <ShieldCheck className="h-5 w-5" />
                    </span>
                    <Chip color="emerald">Evaluation Rubric Result</Chip>
                  </div>
                  <h3 className="mt-1.5 font-display text-lg font-bold text-ink-950 dark:text-white">
                    Candidate Interview Assessment
                  </h3>
                </div>
                <div className="text-right sm:self-center">
                  <div className="text-xs font-bold uppercase tracking-wider text-ink-400">Overall Readiness</div>
                  <div className="inline-block mt-0.5 text-xs font-extrabold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 px-3 py-1 rounded-full border border-emerald-300 dark:border-emerald-800">
                    {activeFeedback.overallGrade}
                  </div>
                </div>
              </div>

              {/* Score Breakdown Bars */}
              <div className="mt-5 grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="rounded-xl border border-ink-100 dark:border-ink-800 p-3 bg-white dark:bg-ink-900">
                  <div className="flex items-center justify-between text-xs mb-1.5">
                    <span className="font-semibold text-ink-700 dark:text-ink-300">Technical Depth</span>
                    <span className="font-extrabold text-emerald-600">{activeFeedback.scores.technical}%</span>
                  </div>
                  <ProgressBar value={activeFeedback.scores.technical} height="h-2" />
                  <div className="mt-2 text-[10px] text-ink-400">Algorithms, concurrency & trade-offs</div>
                </div>

                <div className="rounded-xl border border-ink-100 dark:border-ink-800 p-3 bg-white dark:bg-ink-900">
                  <div className="flex items-center justify-between text-xs mb-1.5">
                    <span className="font-semibold text-ink-700 dark:text-ink-300">Evidence Grounding</span>
                    <span className="font-extrabold text-indigo-600">{activeFeedback.scores.evidence}%</span>
                  </div>
                  <ProgressBar value={activeFeedback.scores.evidence} height="h-2" />
                  <div className="mt-2 text-[10px] text-ink-400">Concrete project & metric claims</div>
                </div>

                <div className="rounded-xl border border-ink-100 dark:border-ink-800 p-3 bg-white dark:bg-ink-900">
                  <div className="flex items-center justify-between text-xs mb-1.5">
                    <span className="font-semibold text-ink-700 dark:text-ink-300">STAR Communication</span>
                    <span className="font-extrabold text-brand-600">{activeFeedback.scores.communication}%</span>
                  </div>
                  <ProgressBar value={activeFeedback.scores.communication} height="h-2" />
                  <div className="mt-2 text-[10px] text-ink-400">Structured action-to-impact clarity</div>
                </div>
              </div>

              {/* Strengths & Improvements */}
              <div className="mt-5 grid gap-4 sm:grid-cols-2">
                <div className="rounded-xl border border-emerald-200 dark:border-emerald-900/40 bg-emerald-50/40 dark:bg-emerald-950/20 p-4">
                  <div className="flex items-center gap-2 text-xs font-bold text-emerald-800 dark:text-emerald-300 uppercase tracking-wider mb-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                    Demonstrated Strengths
                  </div>
                  <ul className="space-y-1.5 text-xs text-ink-700 dark:text-ink-300">
                    {activeFeedback.strengths.map((s, i) => (
                      <li key={i} className="flex items-start gap-1.5">
                        <span className="text-emerald-600 font-bold">•</span>
                        <span>{s}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="rounded-xl border border-amber-200 dark:border-amber-900/40 bg-amber-50/40 dark:bg-amber-950/20 p-4">
                  <div className="flex items-center gap-2 text-xs font-bold text-amber-800 dark:text-amber-300 uppercase tracking-wider mb-2">
                    <AlertCircle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                    Recommended Improvements
                  </div>
                  <ul className="space-y-1.5 text-xs text-ink-700 dark:text-ink-300">
                    {activeFeedback.improvements.map((imp, i) => (
                      <li key={i} className="flex items-start gap-1.5">
                        <span className="text-amber-600 font-bold">•</span>
                        <span>{imp}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Next Actions */}
              <div className="mt-5 pt-4 border-t border-ink-100 dark:border-ink-800 flex items-center justify-between">
                <span className="text-xs text-ink-500 dark:text-ink-400">
                  Try another question or review your skill gaps.
                </span>
                <button
                  onClick={() => {
                    const currentIndex = questions.findIndex((q) => q.id === activeQuestion.id);
                    const nextQ = questions[(currentIndex + 1) % questions.length];
                    setSelectedQuestionId(nextQ.id);
                    setUserAnswer('');
                    setActiveFeedback(null);
                    setShowModelAnswer(false);
                  }}
                  className="btn-primary text-xs inline-flex items-center gap-1.5"
                >
                  Next Interview Question <ArrowRight className="h-3.5 w-3.5" />
                </button>
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
