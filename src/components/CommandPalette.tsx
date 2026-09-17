import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  Search,
  LayoutDashboard,
  GraduationCap,
  FolderGit2,
  Compass,
  Target,
  Users,
  PlusCircle,
  Shield,
  Moon,
  Sun,
  ArrowRight,
  ExternalLink,
  Briefcase,
  User,
  X,
  FileBadge,
  Sparkles,
  Command,
  Brain,
} from 'lucide-react';
import { useRouter } from '@/lib/router';
import { useAuth } from '@/lib/authContext';
import { useTheme } from '@/lib/themeContext';
import { useToast } from '@/lib/toast';
import { useDemoStudent } from '@/lib/useDemoStudent';
import { getAllStudents, getAllOpportunities } from '@/data/mockData';
import { Avatar } from '@/components/ui';

interface CommandItem {
  id: string;
  category: 'Navigation' | 'Students & Passports' | 'Opportunities' | 'Quick Actions';
  title: string;
  subtitle?: string;
  icon: React.ReactNode;
  action: () => void;
  badge?: string;
}

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenAuthModal?: () => void;
}

export function CommandPalette({ isOpen, onClose, onOpenAuthModal }: CommandPaletteProps) {
  const { navigate } = useRouter();
  const { profile } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { toast } = useToast();
  const { studentId, setStudentId } = useDemoStudent();

  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const students = useMemo(() => getAllStudents(), []);
  const opportunities = useMemo(() => getAllOpportunities(), []);

  // Build the complete command palette dataset
  const allCommands = useMemo<CommandItem[]>(() => {
    const items: CommandItem[] = [];

    // --- Quick Actions ---
    items.push({
      id: 'action_theme',
      category: 'Quick Actions',
      title: theme === 'dark' ? 'Switch to Light Theme' : 'Switch to Dark Theme',
      subtitle: `Currently in ${theme} mode`,
      icon: theme === 'dark' ? <Sun className="h-4 w-4 text-amber-500" /> : <Moon className="h-4 w-4 text-brand-600" />,
      action: () => {
        toggleTheme();
        toast.info(`Switched to ${theme === 'dark' ? 'light' : 'dark'} mode`);
        onClose();
      },
      badge: 'Theme',
    });

    if (studentId) {
      items.push({
        id: 'action_copy_passport',
        category: 'Quick Actions',
        title: 'Copy Public Passport URL',
        subtitle: `Share link for current student passport`,
        icon: <ExternalLink className="h-4 w-4 text-brand-600" />,
        action: () => {
          const url = `${window.location.origin}/passport/${studentId}`;
          navigator.clipboard.writeText(url);
          toast.success('Public passport URL copied to clipboard');
          onClose();
        },
        badge: 'Share',
      });
    }

    if (onOpenAuthModal) {
      items.push({
        id: 'action_switch_account',
        category: 'Quick Actions',
        title: 'Switch Account / Sign In',
        subtitle: 'Log in as a different student or organization',
        icon: <User className="h-4 w-4 text-brand-600" />,
        action: () => {
          onClose();
          onOpenAuthModal();
        },
        badge: 'Auth',
      });
    }

    // --- Navigation ---
    items.push(
      {
        id: 'nav_student_dash',
        category: 'Navigation',
        title: 'Student Dashboard',
        subtitle: 'Applications, top matching opportunities, and alerts',
        icon: <LayoutDashboard className="h-4 w-4 text-brand-600" />,
        action: () => {
          navigate('/student/dashboard');
          onClose();
        },
        badge: 'Student',
      },
      {
        id: 'nav_passport',
        category: 'Navigation',
        title: 'Skill Passport',
        subtitle: 'Cryptographic competencies, proficiencies & proof breakdown',
        icon: <GraduationCap className="h-4 w-4 text-brand-600" />,
        action: () => {
          navigate('/student/passport');
          onClose();
        },
        badge: 'Student',
      },
      {
        id: 'nav_evidence',
        category: 'Navigation',
        title: 'Evidence & Credentials Vault',
        subtitle: 'GitHub repo scanner, certificates & SHA-256 seal generator',
        icon: <FolderGit2 className="h-4 w-4 text-brand-600" />,
        action: () => {
          navigate('/student/evidence');
          onClose();
        },
        badge: 'Student',
      },
      {
        id: 'nav_internships',
        category: 'Navigation',
        title: 'Internship Discovery',
        subtitle: 'Explore internships matched deterministically to your verified skills',
        icon: <Compass className="h-4 w-4 text-brand-600" />,
        action: () => {
          navigate('/student/internships');
          onClose();
        },
        badge: 'Student',
      },
      {
        id: 'nav_skillgap',
        category: 'Navigation',
        title: 'Skill Gap Analysis & Roadmaps',
        subtitle: 'Target role comparison, missing skills & curated learning courses',
        icon: <Target className="h-4 w-4 text-brand-600" />,
        action: () => {
          navigate('/student/skillgap');
          onClose();
        },
        badge: 'Student',
      },
      {
        id: 'nav_student_teams',
        category: 'Navigation',
        title: 'Team Matching',
        subtitle: 'Find multidisciplinary squads seeking your specific skill profile',
        icon: <Users className="h-4 w-4 text-brand-600" />,
        action: () => {
          navigate('/student/teams');
          onClose();
        },
        badge: 'Student',
      },
      {
        id: 'nav_interview_coach',
        category: 'Navigation',
        title: 'AI Technical Interview Coach',
        subtitle: 'Role-specific technical interview questions grounded in your verified portfolio',
        icon: <Brain className="h-4 w-4 text-purple-600" />,
        action: () => {
          navigate('/student/interview-coach');
          onClose();
        },
        badge: 'Coach',
      },
      {
        id: 'nav_org_dash',
        category: 'Navigation',
        title: 'Organization Dashboard',
        subtitle: 'Manage active postings, view candidate pipelines & hire from proof',
        icon: <Briefcase className="h-4 w-4 text-accent-600" />,
        action: () => {
          navigate('/org/dashboard');
          onClose();
        },
        badge: 'Recruiter',
      },
      {
        id: 'nav_create_opp',
        category: 'Navigation',
        title: 'Create Opportunity',
        subtitle: 'Define role requirements, required competencies & evidence thresholds',
        icon: <PlusCircle className="h-4 w-4 text-accent-600" />,
        action: () => {
          navigate('/org/create');
          onClose();
        },
        badge: 'Recruiter',
      },
      {
        id: 'nav_candidate_matching',
        category: 'Navigation',
        title: 'Candidate Matching & AI Dossiers',
        subtitle: 'Inspect ranked candidates, stage pipelines, and Gemini evaluations',
        icon: <Users className="h-4 w-4 text-accent-600" />,
        action: () => {
          navigate('/org/candidates');
          onClose();
        },
        badge: 'Recruiter',
      },
      {
        id: 'nav_team_builder',
        category: 'Navigation',
        title: 'Team Builder',
        subtitle: 'Assemble multidisciplinary hackathon or project squads',
        icon: <Users className="h-4 w-4 text-amber-600" />,
        action: () => {
          navigate('/team/matching');
          onClose();
        },
        badge: 'Squad',
      },
      {
        id: 'nav_fairness',
        category: 'Navigation',
        title: 'Fairness & Anti-Bias Policy',
        subtitle: 'Inspect zero demographic bias deterministic matching criteria',
        icon: <Shield className="h-4 w-4 text-accent-600" />,
        action: () => {
          navigate('/fairness');
          onClose();
        },
      }
    );

    // --- Students & Passports ---
    students.forEach((s) => {
      items.push({
        id: `student_${s.id}`,
        category: 'Students & Passports',
        title: s.name,
        subtitle: `${s.program} · ${s.university}`,
        icon: <Avatar name={s.name} color={s.avatarColor} photoUrl={s.photoUrl} size="sm" />,
        action: () => {
          setStudentId(s.id);
          navigate(`/passport/${s.id}`);
          toast.info(`Viewing Verified Passport: ${s.name}`);
          onClose();
        },
        badge: 'Passport',
      });
    });

    // --- Opportunities ---
    opportunities.forEach((o) => {
      items.push({
        id: `opp_${o.id}`,
        category: 'Opportunities',
        title: o.title,
        subtitle: `${o.organization} · ${o.location} (${o.type})`,
        icon: <Briefcase className="h-4 w-4 text-accent-600" />,
        action: () => {
          if (profile?.role === 'organization') {
            navigate(`/org/candidates/${o.id}`);
          } else {
            navigate(`/student/internships/${o.id}`);
          }
          onClose();
        },
        badge: o.type,
      });
    });

    return items;
  }, [theme, toggleTheme, toast, studentId, onOpenAuthModal, navigate, profile, students, setStudentId, opportunities, onClose]);

  // Filter commands by query
  const filteredCommands = useMemo(() => {
    if (!query.trim()) return allCommands;
    const q = query.toLowerCase().trim();
    return allCommands.filter(
      (c) =>
        c.title.toLowerCase().includes(q) ||
        (c.subtitle && c.subtitle.toLowerCase().includes(q)) ||
        c.category.toLowerCase().includes(q) ||
        (c.badge && c.badge.toLowerCase().includes(q))
    );
  }, [allCommands, query]);

  // Reset selected index on query change
  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  // Focus input when modal opens
  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev < filteredCommands.length - 1 ? prev + 1 : 0));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev > 0 ? prev - 1 : filteredCommands.length - 1));
      } else if (e.key === 'Enter') {
        e.preventDefault();
        const selected = filteredCommands[selectedIndex];
        if (selected) {
          selected.action();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, filteredCommands, selectedIndex, onClose]);

  // Scroll active item into view
  useEffect(() => {
    const listEl = listRef.current;
    if (!listEl) return;
    const selectedEl = listEl.querySelector(`[data-index="${selectedIndex}"]`) as HTMLElement;
    if (selectedEl) {
      selectedEl.scrollIntoView({ block: 'nearest' });
    }
  }, [selectedIndex]);

  if (!isOpen) return null;

  // Group filtered commands by category
  const grouped = filteredCommands.reduce<Record<string, CommandItem[]>>((acc, item) => {
    acc[item.category] = acc[item.category] || [];
    acc[item.category].push(item);
    return acc;
  }, {});

  let globalCounter = 0;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-start justify-center p-3 sm:p-6 sm:pt-20 bg-black/60 backdrop-blur-sm animate-fade-in"
      onClick={onClose}
    >
      <div
        className="w-full max-w-xl rounded-2xl bg-white dark:bg-[#161b22] border border-ink-200/90 dark:border-[#30363d] shadow-2xl overflow-hidden flex flex-col max-h-[80vh] animate-scale-in"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Input Bar */}
        <div className="relative flex items-center border-b border-ink-100 dark:border-[#30363d] px-4 py-3 bg-white dark:bg-[#161b22]">
          <Search className="h-4 w-4 text-ink-400 dark:text-[#8b949e] flex-shrink-0 mr-3" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Type a command, page, student passport, or opportunity..."
            className="w-full bg-transparent text-sm text-ink-900 dark:text-[#f0f6fc] placeholder:text-ink-400 dark:placeholder:text-[#6e7681] focus:outline-none"
          />
          {query ? (
            <button
              onClick={() => setQuery('')}
              className="p-1 rounded-md text-ink-400 hover:text-ink-600 dark:hover:text-[#c9d1d9] transition"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          ) : (
            <kbd className="hidden sm:inline-flex items-center rounded border border-ink-200 dark:border-[#30363d] bg-ink-50 dark:bg-[#21262d] px-1.5 py-0.5 text-[10px] font-semibold text-ink-500 dark:text-[#8b949e]">
              ESC
            </kbd>
          )}
        </div>

        {/* Command List */}
        <div ref={listRef} className="overflow-y-auto p-2 space-y-4 max-h-[60vh] overscroll-contain">
          {filteredCommands.length === 0 ? (
            <div className="py-10 text-center text-ink-400 dark:text-[#8b949e]">
              <Sparkles className="h-8 w-8 mx-auto mb-2 opacity-40" />
              <p className="text-xs font-semibold">No matching commands or profiles found</p>
              <p className="text-[11px] mt-0.5">Try searching for a skill, student name, or page</p>
            </div>
          ) : (
            Object.entries(grouped).map(([category, items]) => (
              <div key={category} className="space-y-1">
                <div className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-ink-400 dark:text-[#8b949e]">
                  {category}
                </div>
                {items.map((item) => {
                  const currentIndex = globalCounter++;
                  const isSelected = currentIndex === selectedIndex;

                  return (
                    <div
                      key={item.id}
                      data-index={currentIndex}
                      onClick={() => item.action()}
                      onMouseEnter={() => setSelectedIndex(currentIndex)}
                      className={`group flex items-center justify-between px-3 py-2.5 rounded-xl cursor-pointer transition select-none ${
                        isSelected
                          ? 'bg-brand-50/80 dark:bg-brand-950/60 text-brand-900 dark:text-[#58a6ff] border-l-2 border-brand-600 pl-2.5'
                          : 'hover:bg-ink-50 dark:hover:bg-[#21262d] text-ink-800 dark:text-[#c9d1d9]'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <span className="flex-shrink-0">{item.icon}</span>
                        <div className="min-w-0">
                          <div className="text-xs font-bold truncate leading-tight">{item.title}</div>
                          {item.subtitle && (
                            <div className="text-[11px] text-ink-500 dark:text-[#8b949e] truncate mt-0.5">
                              {item.subtitle}
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 flex-shrink-0 ml-3">
                        {item.badge && (
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full border border-ink-200/80 dark:border-[#30363d] bg-white dark:bg-[#21262d] text-ink-600 dark:text-[#8b949e]">
                            {item.badge}
                          </span>
                        )}
                        {isSelected && (
                          <ArrowRight className="h-3.5 w-3.5 text-brand-600 dark:text-[#58a6ff] hidden sm:block" />
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ))
          )}
        </div>

        {/* Footer Shortcut Hints */}
        <div className="border-t border-ink-100 dark:border-[#30363d] px-4 py-2 bg-ink-50/50 dark:bg-[#0d1117] flex items-center justify-between text-[11px] text-ink-400 dark:text-[#8b949e]">
          <div className="flex items-center gap-3">
            <span className="inline-flex items-center gap-1">
              <kbd className="rounded border border-ink-200 dark:border-[#30363d] bg-white dark:bg-[#161b22] px-1 py-0.5 font-mono text-[10px]">
                ↑↓
              </kbd>{' '}
              Navigate
            </span>
            <span className="inline-flex items-center gap-1">
              <kbd className="rounded border border-ink-200 dark:border-[#30363d] bg-white dark:bg-[#161b22] px-1 py-0.5 font-mono text-[10px]">
                ↵
              </kbd>{' '}
              Select
            </span>
          </div>
          <div>
            <span className="font-semibold text-brand-600 dark:text-[#58a6ff]">EvidentX</span> Quick Palette
          </div>
        </div>
      </div>
    </div>
  );
}
