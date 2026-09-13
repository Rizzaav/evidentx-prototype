import type { ReactNode } from 'react';
import { ArrowLeft } from 'lucide-react';

// ============ Avatar ============
export function Avatar({
  name,
  color,
  photoUrl,
  size = 'md',
}: {
  name: string;
  color?: string;
  photoUrl?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}) {
  const initials = name
    .split(' ')
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
  const sizes = {
    sm: 'h-8 w-8 text-xs',
    md: 'h-10 w-10 text-sm',
    lg: 'h-14 w-14 text-lg',
    xl: 'h-20 w-20 text-2xl',
  };

  if (photoUrl) {
    return (
      <img
        src={photoUrl}
        alt={name}
        className={`inline-flex rounded-full object-cover ${sizes[size]} shadow-card select-none border border-ink-200/80`}
      />
    );
  }

  return (
    <div
      className={`inline-flex items-center justify-center rounded-full bg-gradient-to-br ${color || 'from-brand-500 to-brand-700'} text-white font-bold ${sizes[size]} shadow-card select-none`}
    >
      <span className="leading-none">{initials}</span>
    </div>
  );
}

// ============ Badge / Chip ============
export function Chip({
  children,
  color = 'gray',
  icon,
}: {
  children: ReactNode;
  color?: 'gray' | 'brand' | 'accent' | 'amber' | 'rose' | 'emerald';
  icon?: ReactNode;
}) {
  const colors: Record<string, string> = {
    gray: 'bg-ink-100 text-ink-700 border border-ink-200/80',
    brand: 'bg-brand-50 text-brand-700 border border-brand-200/80',
    accent: 'bg-accent-50 text-accent-700 border border-accent-200/80',
    amber: 'bg-amber-50 text-amber-800 border border-amber-200/80',
    rose: 'bg-rose-50 text-rose-700 border border-rose-200/80',
    emerald: 'bg-accent-50 text-accent-800 border border-accent-200/80',
  };
  return (
    <span className={`chip ${colors[color]}`}>
      {icon}
      <span>{children}</span>
    </span>
  );
}

// ============ Skill Badge with proficiency ============
export function SkillBadge({
  name,
  proficiency,
  size = 'md',
}: {
  name: string;
  proficiency?: number;
  size?: 'sm' | 'md';
}) {
  const color =
    proficiency === undefined
      ? 'bg-ink-100/80 text-ink-800 border-ink-200'
      : proficiency >= 70
      ? 'bg-accent-50 text-accent-800 border-accent-200'
      : proficiency >= 40
      ? 'bg-amber-50 text-amber-800 border-amber-200'
      : 'bg-rose-50 text-rose-800 border-rose-200';
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 font-medium ${
        size === 'sm' ? 'text-xs' : 'text-sm'
      } ${color}`}
    >
      <span>{name}</span>
      {proficiency !== undefined && <span className="text-ink-500 text-xs font-semibold">{proficiency}%</span>}
    </span>
  );
}

// ============ Progress Bar ============
export function ProgressBar({
  value,
  max = 100,
  color,
  height = 'h-2',
  showLabel = false,
}: {
  value: number;
  max?: number;
  color?: string;
  height?: string;
  showLabel?: boolean;
}) {
  const pct = Math.min(100, Math.max(0, (value / max) * 100));
  const auto =
    pct >= 70
      ? 'from-accent-500 to-accent-600'
      : pct >= 40
      ? 'from-amber-500 to-amber-600'
      : 'from-rose-500 to-rose-600';
  const grad = color ?? auto;
  return (
    <div className="flex items-center gap-2">
      <div className={`flex-1 ${height} rounded-full bg-ink-100 overflow-hidden`}>
        <div
          className={`progress-fill h-full rounded-full bg-gradient-to-r ${grad}`}
          style={
            {
              width: `${pct}%`,
              '--from': grad.includes('accent')
                ? '#298968'
                : grad.includes('amber')
                ? '#d97706'
                : grad.includes('brand')
                ? '#2d63e8'
                : '#e11d48',
              '--to': grad.includes('accent')
                ? '#236e55'
                : grad.includes('amber')
                ? '#b45309'
                : grad.includes('brand')
                ? '#1f40a1'
                : '#be123c',
            } as React.CSSProperties
          }
        />
      </div>
      {showLabel && <span className="text-xs font-bold text-ink-700 w-9 text-right">{Math.round(pct)}%</span>}
    </div>
  );
}

// ============ Match Score Ring ============
export function MatchRing({
  score,
  size = 120,
  label = 'Match',
}: {
  score: number;
  size?: number;
  label?: string;
}) {
  const radius = size / 2 - 10;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;
  const color = score >= 75 ? '#298968' : score >= 50 ? '#d97706' : '#e11d48';
  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="#e2e5eb" strokeWidth="7" />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth="7"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset 0.6s cubic-bezier(0.16,1,0.3,1)' }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
        <span className="text-2xl font-bold tracking-tight text-ink-900">
          {score}%
        </span>
        <span className="text-[10px] font-bold uppercase tracking-wider text-ink-500">{label}</span>
      </div>
    </div>
  );
}

// ============ Verification Pill ============
export function VerificationPill({ status }: { status: 'verified' | 'pending' | 'self-reported' }) {
  if (status === 'verified')
    return (
      <Chip color="emerald" icon={<CheckIcon />}>
        Verified
      </Chip>
    );
  if (status === 'pending')
    return (
      <Chip color="amber" icon={<ClockIcon />}>
        Pending
      </Chip>
    );
  return (
    <Chip color="gray" icon={<UserIcon />}>
      Self-reported
    </Chip>
  );
}

// ============ Evidence Type Icon (Bare mark without colored box) ============
export function EvidenceTypeIcon({ type }: { type: string }) {
  const map: Record<string, { icon: ReactNode; color: string }> = {
    coursework: { icon: <BookIcon />, color: 'text-brand-600' },
    project: { icon: <CodeIcon />, color: 'text-accent-600' },
    competition: { icon: <TrophyIcon />, color: 'text-amber-600' },
    credential: { icon: <BadgeIcon />, color: 'text-indigo-600' },
    experience: { icon: <BriefcaseIcon />, color: 'text-rose-600' },
  };
  const m = map[type] ?? map.project;
  return <div className={`flex-shrink-0 ${m.color}`}>{m.icon}</div>;
}

// ============ Page Header ============
export function PageHeader({
  title,
  subtitle,
  backTo,
  onBack,
  right,
}: {
  title: string;
  subtitle?: string;
  backTo?: string;
  onBack?: () => void;
  right?: ReactNode;
}) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3.5 sm:gap-4 mb-5 sm:mb-6">
      <div className="flex items-start gap-3 min-w-0">
        {backTo && (
          <button onClick={onBack} className="btn-ghost -ml-2 p-1.5 text-ink-500 hover:text-ink-900 dark:hover:text-white">
            <ArrowLeft className="h-4 w-4" />
          </button>
        )}
        <div className="min-w-0">
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-ink-900 dark:text-white truncate">{title}</h1>
          {subtitle && <p className="text-xs sm:text-sm text-ink-500 dark:text-ink-400 mt-0.5 leading-relaxed">{subtitle}</p>}
        </div>
      </div>
      {right && <div className="w-full sm:w-auto shrink-0">{right}</div>}
    </div>
  );
}

// ============ Empty State ============
export function EmptyState({
  title,
  description,
  icon,
  action,
}: {
  title: string;
  description?: string;
  icon?: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className="card p-10 text-center flex flex-col items-center">
      {icon && <div className="mb-3 text-ink-400">{icon}</div>}
      <h3 className="font-semibold text-ink-900">{title}</h3>
      {description && <p className="text-sm text-ink-500 mt-1 max-w-sm">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

// ============ Stat Card (Bare icon without box) ============
export function StatCard({
  label,
  value,
  icon,
  color = 'brand',
  sub,
}: {
  label: string;
  value: ReactNode;
  icon?: ReactNode;
  color?: 'brand' | 'accent' | 'amber' | 'rose' | 'emerald';
  sub?: string;
}) {
  const iconColors: Record<string, string> = {
    brand: 'text-brand-600',
    accent: 'text-accent-600',
    amber: 'text-amber-600',
    rose: 'text-rose-600',
    emerald: 'text-accent-700',
  };
  return (
    <div className="card p-5">
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold uppercase tracking-wider text-ink-500">{label}</span>
        {icon && <span className={iconColors[color]}>{icon}</span>}
      </div>
      <div className="mt-2 text-2xl font-bold tracking-tight text-ink-900">{value}</div>
      {sub && <div className="text-xs text-ink-500 mt-0.5">{sub}</div>}
    </div>
  );
}

// ============ Card ============
export function Card({ children, className = '', onClick }: { children: ReactNode; className?: string; onClick?: () => void }) {
  return (
    <div className={`card ${className}`} onClick={onClick}>
      {children}
    </div>
  );
}

// ============ Section ============
export function Section({ title, children, action }: { title: string; children: ReactNode; action?: ReactNode }) {
  return (
    <div className="mb-6">
      <div className="flex items-center justify-between mb-3">
        <h2 className="section-title">{title}</h2>
        {action}
      </div>
      {children}
    </div>
  );
}

// ============ Inline SVGs ============
function CheckIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="h-3 w-3">
      <path d="M20 6 9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
function ClockIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-3 w-3">
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" strokeLinecap="round" />
    </svg>
  );
}
function UserIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-3 w-3">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  );
}
function BookIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5">
      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
      <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
    </svg>
  );
}
function CodeIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5">
      <path d="m16 18 6-6-6-6M8 6l-6 6 6 6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
function TrophyIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5">
      <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6M18 9h1.5a2.5 2.5 0 0 0 0-5H18M4 22h16M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22M18 2H6v7a6 6 0 0 0 12 0V2z" />
    </svg>
  );
}
function BadgeIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5">
      <path d="M3.85 8.62a4 4 0 0 1 4.78-4.77 4 4 0 0 1 6.74 0 4 4 0 0 1 4.78 4.78 4 4 0 0 1 0 6.74 4 4 0 0 1-4.77 4.78 4 4 0 0 1-6.75 0 4 4 0 0 1-4.78-4.77 4 4 0 0 1 0-6.76Z" />
      <path d="m9 12 2 2 4-4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
function BriefcaseIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5">
      <rect width="20" height="14" x="2" y="7" rx="2" />
      <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
    </svg>
  );
}
