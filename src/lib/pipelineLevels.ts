import { ApplicationStatus } from '@/types';

export interface PipelineStageConfig {
  level: number;
  status: ApplicationStatus;
  label: string;
  shortLabel: string;
  badgeName: string;
  chipLabel: string;
  icon: string;
  description: string;
  nextStatus?: ApplicationStatus;
  nextActionLabel?: string;
  badgeColor: 'brand' | 'accent' | 'amber' | 'emerald' | 'rose' | 'gray';
  colorClasses: {
    bg: string;
    border: string;
    text: string;
    activeText: string;
    activeBg: string;
    hoverBg: string;
    pillBg: string;
  };
}

export const PIPELINE_STAGES: PipelineStageConfig[] = [
  {
    level: 1,
    status: 'Applied',
    label: 'Level 1: Applied / Review',
    shortLabel: 'Applied',
    badgeName: 'Level 1: Review',
    chipLabel: 'L1 · Applied',
    icon: '📋',
    description: 'Initial portfolio submission and deterministic competency match evaluation',
    nextStatus: 'Shortlisted',
    nextActionLabel: 'Advance to Level 2 (Shortlist)',
    badgeColor: 'accent',
    colorClasses: {
      bg: 'bg-accent-50 dark:bg-accent-950/30',
      border: 'border-accent-200 dark:border-accent-800',
      text: 'text-accent-800 dark:text-accent-300',
      activeText: 'text-white',
      activeBg: 'bg-accent-600 dark:bg-accent-500',
      hoverBg: 'hover:bg-accent-100 dark:hover:bg-accent-900/50',
      pillBg: 'bg-accent-100 dark:bg-accent-900/50 text-accent-800 dark:text-accent-200',
    },
  },
  {
    level: 2,
    status: 'Shortlisted',
    label: 'Level 2: Shortlisted',
    shortLabel: 'Shortlist',
    badgeName: 'Level 2: Shortlisted',
    chipLabel: 'L2 · Shortlisted',
    icon: '⭐',
    description: 'Candidate verified and selected for technical & competency evaluation',
    nextStatus: 'Interviewing',
    nextActionLabel: 'Advance to Level 3 (Interview)',
    badgeColor: 'brand',
    colorClasses: {
      bg: 'bg-brand-50 dark:bg-brand-950/30',
      border: 'border-brand-200 dark:border-brand-800',
      text: 'text-brand-800 dark:text-brand-300',
      activeText: 'text-white',
      activeBg: 'bg-brand-600 dark:bg-brand-500',
      hoverBg: 'hover:bg-brand-100 dark:hover:bg-brand-900/50',
      pillBg: 'bg-brand-100 dark:bg-brand-900/50 text-brand-800 dark:text-brand-200',
    },
  },
  {
    level: 3,
    status: 'Interviewing',
    label: 'Level 3: Interviewing',
    shortLabel: 'Interview',
    badgeName: 'Level 3: Interviewing',
    chipLabel: 'L3 · Interviewing',
    icon: '🎙️',
    description: 'Active technical evaluation, code walkthroughs, and recruiter interviews',
    nextStatus: 'Offered',
    nextActionLabel: 'Advance to Level 4 (Extend Offer)',
    badgeColor: 'amber',
    colorClasses: {
      bg: 'bg-amber-50 dark:bg-amber-950/30',
      border: 'border-amber-200 dark:border-amber-800',
      text: 'text-amber-800 dark:text-amber-300',
      activeText: 'text-white',
      activeBg: 'bg-amber-600 dark:bg-amber-500',
      hoverBg: 'hover:bg-amber-100 dark:hover:bg-amber-900/50',
      pillBg: 'bg-amber-100 dark:bg-amber-900/50 text-amber-900 dark:text-amber-200',
    },
  },
  {
    level: 4,
    status: 'Offered',
    label: 'Level 4: Offered / Hired',
    shortLabel: 'Offered',
    badgeName: 'Level 4: Offered',
    chipLabel: 'L4 · Offered',
    icon: '🏆',
    description: 'Final evaluation approved; official role or internship offer extended',
    badgeColor: 'emerald',
    colorClasses: {
      bg: 'bg-emerald-50 dark:bg-emerald-950/30',
      border: 'border-emerald-200 dark:border-emerald-800',
      text: 'text-emerald-800 dark:text-emerald-300',
      activeText: 'text-white',
      activeBg: 'bg-emerald-600 dark:bg-emerald-500',
      hoverBg: 'hover:bg-emerald-100 dark:hover:bg-emerald-900/50',
      pillBg: 'bg-emerald-100 dark:bg-emerald-900/50 text-emerald-900 dark:text-emerald-200',
    },
  },
];

export function getPipelineLevelNumber(status?: ApplicationStatus): number {
  if (!status || status === 'Applied' || status === 'Reviewing') return 1;
  if (status === 'Shortlisted') return 2;
  if (status === 'Interviewing') return 3;
  if (status === 'Offered') return 4;
  if (status === 'Rejected') return 0;
  return 1;
}

export function getPipelineStageConfig(status?: ApplicationStatus): PipelineStageConfig {
  const level = getPipelineLevelNumber(status);
  if (level === 0) {
    return {
      level: 0,
      status: 'Rejected',
      label: 'Archived / Rejected',
      shortLabel: 'Rejected',
      badgeName: 'Rejected',
      chipLabel: 'Rejected',
      icon: '❌',
      description: 'Candidate was not moved forward in current evaluation cycle',
      badgeColor: 'rose',
      colorClasses: {
        bg: 'bg-rose-50 dark:bg-rose-950/30',
        border: 'border-rose-200 dark:border-rose-800',
        text: 'text-rose-800 dark:text-rose-300',
        activeText: 'text-white',
        activeBg: 'bg-rose-600 dark:bg-rose-500',
        hoverBg: 'hover:bg-rose-100 dark:hover:bg-rose-900/50',
        pillBg: 'bg-rose-100 dark:bg-rose-900/50 text-rose-800 dark:text-rose-200',
      },
    };
  }
  return PIPELINE_STAGES.find((s) => s.level === level) || PIPELINE_STAGES[0];
}

export function getNextPipelineStatus(status?: ApplicationStatus): ApplicationStatus | null {
  const current = getPipelineStageConfig(status);
  return current.nextStatus || null;
}

export function getNextPipelineActionLabel(status?: ApplicationStatus): string | null {
  const current = getPipelineStageConfig(status);
  return current.nextActionLabel || null;
}
