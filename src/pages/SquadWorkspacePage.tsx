import { useState } from 'react';
import {
  Users,
  GitBranch,
  GitPullRequest,
  CheckCircle2,
  Clock,
  PlusCircle,
  Sparkles,
  ExternalLink,
  ChevronRight,
  ChevronLeft,
  X,
  Code2,
  ShieldCheck,
  Building2,
  FolderGit2,
  Share2,
} from 'lucide-react';
import { TEAMS, studentMap, skillMap, SKILLS } from '@/data/mockData';
import { useRouter } from '@/lib/router';
import { Avatar } from '@/components/ui';
import { useToast } from '@/lib/toast';

interface KanbanTask {
  id: string;
  title: string;
  description: string;
  assigneeStudentId: string;
  requiredSkillId: string;
  column: 'backlog' | 'in_progress' | 'review' | 'completed';
  milestonePoints: number;
  commitSha?: string;
}

const INITIAL_TASKS: KanbanTask[] = [
  {
    id: 'tsk_1',
    title: 'Deploy HIPAA-Compliant Authentication Microservice',
    description: 'Implement JWT refresh tokens, role-based access control, and audit logging for clinician logins.',
    assigneeStudentId: 'st_kabir',
    requiredSkillId: 's_node',
    column: 'completed',
    milestonePoints: 8,
    commitSha: '7f9a12c',
  },
  {
    id: 'tsk_2',
    title: 'Design Clinician Diagnostic Dashboard in Figma',
    description: 'Create responsive high-contrast UI wireframes for patient ECG charts and emergency vital alerts.',
    assigneeStudentId: 'st_aanya',
    requiredSkillId: 's_uiux',
    column: 'completed',
    milestonePoints: 5,
    commitSha: '3c4b81e',
  },
  {
    id: 'tsk_3',
    title: 'Train MobileNet Chest X-Ray Inference Model',
    description: 'Fine-tune transfer learning weights on NIH dataset with 94.2% sensitivity and FP rate < 3%.',
    assigneeStudentId: 'st_diya',
    requiredSkillId: 's_ml',
    column: 'review',
    milestonePoints: 13,
    commitSha: '9e1d52a',
  },
  {
    id: 'tsk_4',
    title: 'Build Real-Time Patient Vitals WebSocket Streaming Client',
    description: 'Connect React dashboard with WebSocket gateway for sub-100ms real-time metric updates.',
    assigneeStudentId: 'st_aarav',
    requiredSkillId: 's_react',
    column: 'in_progress',
    milestonePoints: 8,
  },
  {
    id: 'tsk_5',
    title: 'Containerize Backend Microservices with Docker Compose',
    description: 'Create multi-stage Dockerfiles and compose configuration for local staging and CI test runs.',
    assigneeStudentId: 'st_kabir',
    requiredSkillId: 's_docker',
    column: 'backlog',
    milestonePoints: 5,
  },
  {
    id: 'tsk_6',
    title: 'Automated CI/CD End-to-End Test Suite',
    description: 'Setup GitHub Actions pipeline with Playwright integration testing and AST complexity checks.',
    assigneeStudentId: 'st_aarav',
    requiredSkillId: 's_ts',
    column: 'backlog',
    milestonePoints: 8,
  },
];

const COLUMNS: { id: KanbanTask['column']; label: string; badgeColor: string }[] = [
  { id: 'backlog', label: 'Backlog', badgeColor: 'bg-ink-100 text-ink-700 dark:bg-ink-800 dark:text-ink-300' },
  { id: 'in_progress', label: 'In Progress', badgeColor: 'bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300' },
  { id: 'review', label: 'Peer Review', badgeColor: 'bg-purple-50 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300' },
  { id: 'completed', label: 'Verified Completed', badgeColor: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300' },
];

export function SquadWorkspacePage({ teamId = 'team_ai_health' }: { teamId?: string }) {
  const { navigate } = useRouter();
  const { toast } = useToast();

  const [selectedTeamId, setSelectedTeamId] = useState(teamId);
  const [tasks, setTasks] = useState<KanbanTask[]>(INITIAL_TASKS);
  const [showNewTaskModal, setShowNewTaskModal] = useState(false);

  // New task form state
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskDesc, setNewTaskDesc] = useState('');
  const [newTaskAssignee, setNewTaskAssignee] = useState('st_aarav');
  const [newTaskSkill, setNewTaskSkill] = useState('s_react');
  const [newTaskPoints, setNewTaskPoints] = useState(5);

  const team = TEAMS.find((t) => t.id === selectedTeamId) || TEAMS[0];

  // Move task across columns
  const handleMoveTask = (taskId: string, direction: 'left' | 'right') => {
    const colOrder: KanbanTask['column'][] = ['backlog', 'in_progress', 'review', 'completed'];
    setTasks((prev) =>
      prev.map((t) => {
        if (t.id !== taskId) return t;
        const currentIdx = colOrder.indexOf(t.column);
        const nextIdx = direction === 'right' ? Math.min(3, currentIdx + 1) : Math.max(0, currentIdx - 1);
        const newCol = colOrder[nextIdx];
        if (newCol === 'completed' && !t.commitSha) {
          t.commitSha = Math.random().toString(16).slice(2, 9);
          toast.success(`Milestone "${t.title}" verified and sealed with commit ${t.commitSha}`);
        }
        return { ...t, column: newCol };
      })
    );
  };

  const handleCreateTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;

    const newTask: KanbanTask = {
      id: 'tsk_' + Date.now(),
      title: newTaskTitle.trim(),
      description: newTaskDesc.trim(),
      assigneeStudentId: newTaskAssignee,
      requiredSkillId: newTaskSkill,
      column: 'backlog',
      milestonePoints: Number(newTaskPoints),
    };

    setTasks((prev) => [newTask, ...prev]);
    setShowNewTaskModal(false);
    setNewTaskTitle('');
    setNewTaskDesc('');
    toast.success(`New milestone task created and added to squad backlog`);
  };

  // Squad Members (diverse multidisciplinary roster)
  const squadMembers = [
    { student: studentMap['st_aarav'], role: 'Frontend Lead & Core Arch' },
    { student: studentMap['st_diya'], role: 'AI & Data Science Specialist' },
    { student: studentMap['st_aanya'], role: 'Lead UI/UX & Interaction Designer' },
    { student: studentMap['st_kabir'], role: 'Backend & Cloud Infrastructure' },
  ].filter((m) => m.student);

  const completedCount = tasks.filter((t) => t.column === 'completed').length;
  const progressPercent = Math.round((completedCount / Math.max(1, tasks.length)) * 100);

  return (
    <div className="space-y-6">
      {/* Squad Header */}
      <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-ink-900 via-amber-950/70 to-ink-900 text-white border border-ink-800 shadow-soft relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 w-96 bg-amber-600/10 blur-3xl pointer-events-none" />

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="rounded-full bg-amber-500/20 border border-amber-400/30 px-3 py-1 text-xs font-bold text-amber-300 uppercase tracking-wider flex items-center gap-1.5">
                <Users className="h-3.5 w-3.5" />
                Live Collaborative Squad Workspace
              </span>
              <span className="rounded-full bg-emerald-500/20 border border-emerald-400/30 px-3 py-1 text-xs font-bold text-emerald-300 uppercase tracking-wider">
                96% Synergy Fit
              </span>
            </div>
            <h1 className="font-display font-extrabold text-2xl sm:text-3xl text-white tracking-tight">
              {team.title}
            </h1>
            <p className="text-xs sm:text-sm text-ink-300 max-w-2xl leading-relaxed">
              {team.description} · Project Hub for multidisciplinary student squads with verified skill synergy.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <select
              value={selectedTeamId}
              onChange={(e) => setSelectedTeamId(e.target.value)}
              className="rounded-2xl border border-white/20 bg-white/10 px-3 py-2 text-xs font-semibold text-white focus:outline-none focus:ring-2 focus:ring-amber-500 backdrop-blur-sm"
            >
              {TEAMS.map((t) => (
                <option key={t.id} value={t.id} className="text-ink-900 bg-white">
                  {t.title}
                </option>
              ))}
            </select>
            <button
              onClick={() => setShowNewTaskModal(true)}
              className="btn-primary bg-amber-600 hover:bg-amber-500 text-white text-xs py-2 px-4 inline-flex items-center gap-1.5 shadow-lift"
            >
              <PlusCircle className="h-3.5 w-3.5" />
              <span>New Milestone Task</span>
            </button>
          </div>
        </div>
      </div>

      {/* Squad Roster Bar */}
      <div className="p-5 rounded-3xl bg-white dark:bg-[#161b22] border border-ink-100 dark:border-[#30363d] shadow-soft space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="text-[11px] font-bold uppercase tracking-wider text-ink-500 dark:text-[#8b949e]">
            Assembled Multidisciplinary Squad Roster (4 Members)
          </div>
          <div className="flex items-center gap-2 text-xs text-ink-600 dark:text-[#8b949e]">
            <span>Milestone Sprint Velocity:</span>
            <strong className="text-emerald-600 dark:text-emerald-400">{progressPercent}% Completed</strong>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {squadMembers.map(({ student, role }) => (
            <div
              key={student.id}
              className="p-3 rounded-2xl bg-ink-50/70 dark:bg-[#0d1117] border border-ink-200/70 dark:border-[#30363d] flex items-center justify-between gap-3 group"
            >
              <div className="flex items-center gap-2.5 truncate">
                <Avatar name={student.name} color={student.avatarColor} size="sm" />
                <div className="truncate">
                  <div className="font-bold text-xs text-ink-900 dark:text-white truncate group-hover:text-brand-600 transition">
                    {student.name}
                  </div>
                  <div className="text-[10px] text-ink-500 dark:text-[#8b949e] truncate">{role}</div>
                </div>
              </div>
              <button
                onClick={() => navigate(`/passport/${student.id}`)}
                className="p-1 rounded-lg text-ink-400 hover:bg-ink-200 dark:hover:bg-[#21262d] dark:hover:text-white transition flex-shrink-0"
                title="View Verified Skill Passport"
              >
                <ExternalLink className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Interactive Milestone Kanban Board */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="text-xs font-bold text-ink-900 dark:text-white flex items-center gap-2">
            <span>Project Milestones & Task Deliverables</span>
            <span className="text-[11px] font-normal text-ink-500 dark:text-[#8b949e]">
              ({tasks.length} total tasks)
            </span>
          </div>
          <div className="text-[11px] text-ink-500 dark:text-[#8b949e]">
            Use arrows to transition tasks across delivery stages
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {COLUMNS.map((col) => {
            const colTasks = tasks.filter((t) => t.column === col.id);
            return (
              <div
                key={col.id}
                className="rounded-3xl bg-ink-50/60 dark:bg-[#0d1117] border border-ink-200/80 dark:border-[#30363d] p-3.5 flex flex-col min-h-[440px]"
              >
                {/* Column Header */}
                <div className="flex items-center justify-between pb-3 border-b border-ink-200/60 dark:border-[#30363d] mb-3">
                  <span className="font-bold text-xs text-ink-900 dark:text-white flex items-center gap-2">
                    <span>{col.label}</span>
                    <span className="rounded-full bg-ink-200 dark:bg-[#21262d] px-2 py-0.2 text-[10px] text-ink-600 dark:text-ink-400 font-mono">
                      {colTasks.length}
                    </span>
                  </span>
                </div>

                {/* Task Cards */}
                <div className="space-y-2.5 flex-1 overflow-y-auto">
                  {colTasks.map((task) => {
                    const assignee = studentMap[task.assigneeStudentId];
                    const skill = skillMap[task.requiredSkillId];
                    return (
                      <div
                        key={task.id}
                        className="p-3.5 rounded-2xl bg-white dark:bg-[#161b22] border border-ink-200/70 dark:border-[#30363d] shadow-sm space-y-2.5 hover:border-brand-300 dark:hover:border-[#58a6ff] transition"
                      >
                        <div className="flex items-start justify-between gap-1">
                          <span className="rounded-md bg-brand-50 dark:bg-brand-950/60 border border-brand-200 dark:border-brand-800 px-1.5 py-0.5 text-[9px] font-bold text-brand-700 dark:text-brand-300">
                            {skill ? skill.name : 'Skill'}
                          </span>
                          <span className="font-mono text-[9px] text-ink-400 font-semibold">
                            {task.milestonePoints} pts
                          </span>
                        </div>

                        <h4 className="font-bold text-xs text-ink-900 dark:text-white leading-snug">
                          {task.title}
                        </h4>

                        <p className="text-[11px] text-ink-600 dark:text-[#8b949e] line-clamp-2 leading-relaxed">
                          {task.description}
                        </p>

                        {task.commitSha && (
                          <div className="font-mono text-[9px] text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                            <CheckCircle2 className="h-3 w-3" />
                            <span>SHA: {task.commitSha}</span>
                          </div>
                        )}

                        {/* Card Footer */}
                        <div className="pt-2 border-t border-ink-100 dark:border-[#30363d] flex items-center justify-between">
                          {assignee && (
                            <div className="flex items-center gap-1.5">
                              <Avatar name={assignee.name} color={assignee.avatarColor} size="sm" />
                              <span className="text-[10px] font-semibold text-ink-700 dark:text-ink-300 truncate max-w-[80px]">
                                {assignee.name.split(' ')[0]}
                              </span>
                            </div>
                          )}

                          {/* Stage Transition Buttons */}
                          <div className="flex items-center gap-1">
                            {col.id !== 'backlog' && (
                              <button
                                onClick={() => handleMoveTask(task.id, 'left')}
                                className="p-1 rounded-lg border border-ink-200 dark:border-ink-700 text-ink-500 hover:bg-ink-100 dark:hover:bg-[#21262d]"
                                title="Move Back"
                              >
                                <ChevronLeft className="h-3 w-3" />
                              </button>
                            )}
                            {col.id !== 'completed' && (
                              <button
                                onClick={() => handleMoveTask(task.id, 'right')}
                                className="p-1 rounded-lg border border-brand-200 dark:border-brand-800 text-brand-600 dark:text-brand-400 bg-brand-50/50 dark:bg-brand-950/40 hover:bg-brand-100"
                                title="Advance Stage"
                              >
                                <ChevronRight className="h-3 w-3" />
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}

                  {colTasks.length === 0 && (
                    <div className="p-6 text-center text-[11px] text-ink-400 dark:text-[#8b949e] border border-dashed border-ink-200 dark:border-[#30363d] rounded-2xl">
                      No tasks in {col.label.toLowerCase()}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* GitHub Repository Sync Card */}
      <div className="p-5 rounded-3xl bg-white dark:bg-[#161b22] border border-ink-100 dark:border-[#30363d] shadow-soft space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2.5">
            <FolderGit2 className="h-5 w-5 text-ink-700 dark:text-ink-200" />
            <div>
              <h4 className="font-display font-bold text-sm text-ink-900 dark:text-white">
                Linked GitHub Repository: <code className="text-brand-600 dark:text-brand-400">evidentx-squads/{team.id}</code>
              </h4>
              <p className="text-[11px] text-ink-500 dark:text-[#8b949e]">
                Automated CI/CD webhook sync active on branch <code className="font-mono text-ink-700 dark:text-ink-300">main</code>
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 px-2.5 py-1 text-emerald-700 dark:text-emerald-300 font-semibold font-mono text-[10px]">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
              18 Tests Passing
            </span>
          </div>
        </div>

        <div className="p-3 rounded-2xl bg-ink-50 dark:bg-[#0d1117] border border-ink-200/70 dark:border-[#30363d] flex flex-col sm:flex-row sm:items-center justify-between text-xs gap-2">
          <div className="flex items-center gap-3">
            <GitPullRequest className="h-4 w-4 text-purple-500" />
            <span className="text-ink-700 dark:text-[#c9d1d9]">
              Latest Commit: <code className="font-mono text-ink-900 dark:text-white">e9b104a - chore: merge automated PR #14 from Rishav Singh</code>
            </span>
          </div>
          <span className="font-mono text-[10px] text-ink-400">23 minutes ago</span>
        </div>
      </div>

      {/* Create Task Modal */}
      {showNewTaskModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink-950/60 p-4 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md rounded-3xl bg-white dark:bg-[#161b22] p-6 shadow-lift space-y-4 border border-ink-100 dark:border-[#30363d]">
            <div className="flex items-center justify-between border-b border-ink-100 dark:border-[#30363d] pb-3">
              <h3 className="font-display font-bold text-ink-900 dark:text-white text-base">
                Create Milestone Task
              </h3>
              <button
                onClick={() => setShowNewTaskModal(false)}
                className="p-1 rounded-xl text-ink-400 hover:bg-ink-100 dark:hover:bg-[#21262d]"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleCreateTask} className="space-y-3 text-xs">
              <div>
                <label className="text-[11px] font-bold text-ink-700 dark:text-ink-300 block mb-1">
                  Task Title
                </label>
                <input
                  type="text"
                  value={newTaskTitle}
                  onChange={(e) => setNewTaskTitle(e.target.value)}
                  placeholder="e.g. Implement WebSocket gateway client"
                  required
                  className="w-full rounded-xl border border-ink-200 dark:border-[#30363d] bg-white dark:bg-[#0d1117] p-2.5 text-xs text-ink-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-ink-700 dark:text-ink-300 block mb-1">
                  Deliverable Description
                </label>
                <textarea
                  value={newTaskDesc}
                  onChange={(e) => setNewTaskDesc(e.target.value)}
                  placeholder="Technical acceptance criteria and deliverable details..."
                  rows={3}
                  className="w-full rounded-xl border border-ink-200 dark:border-[#30363d] bg-white dark:bg-[#0d1117] p-2.5 text-xs text-ink-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[11px] font-bold text-ink-700 dark:text-ink-300 block mb-1">
                    Assignee Member
                  </label>
                  <select
                    value={newTaskAssignee}
                    onChange={(e) => setNewTaskAssignee(e.target.value)}
                    className="w-full rounded-xl border border-ink-200 dark:border-[#30363d] bg-white dark:bg-[#0d1117] p-2 text-xs text-ink-900 dark:text-white"
                  >
                    {squadMembers.map(({ student }) => (
                      <option key={student.id} value={student.id}>
                        {student.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-[11px] font-bold text-ink-700 dark:text-ink-300 block mb-1">
                    Required Verified Skill
                  </label>
                  <select
                    value={newTaskSkill}
                    onChange={(e) => setNewTaskSkill(e.target.value)}
                    className="w-full rounded-xl border border-ink-200 dark:border-[#30363d] bg-white dark:bg-[#0d1117] p-2 text-xs text-ink-900 dark:text-white"
                  >
                    {SKILLS.slice(0, 12).map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowNewTaskModal(false)}
                  className="btn-secondary text-xs py-1.5 px-3"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary bg-amber-600 hover:bg-amber-500 text-white text-xs py-1.5 px-4"
                >
                  Add Milestone
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
