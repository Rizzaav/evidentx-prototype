import { Check, ArrowRight, XCircle, RotateCcw, Award } from 'lucide-react';
import { ApplicationStatus } from '@/types';
import {
  PIPELINE_STAGES,
  getPipelineLevelNumber,
  getNextPipelineStatus,
} from '@/lib/pipelineLevels';

interface PipelineStepperProps {
  currentStatus?: ApplicationStatus;
  onUpdateStatus?: (status: ApplicationStatus) => void;
  showActions?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function PipelineStepper({
  currentStatus,
  onUpdateStatus,
  showActions = true,
  size = 'md',
  className = '',
}: PipelineStepperProps) {
  const currentLevel = getPipelineLevelNumber(currentStatus);
  const isRejected = currentStatus === 'Rejected';
  const nextStatus = getNextPipelineStatus(currentStatus);

  return (
    <div className={`w-full rounded-2xl border border-ink-200/80 dark:border-[#30363d] bg-white dark:bg-[#161b22] p-4 shadow-2xs ${className}`}>
      {/* Header bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 pb-3 mb-4 border-b border-ink-100 dark:border-[#30363d]">
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-bold uppercase tracking-wider text-ink-500 dark:text-[#8b949e]">
            Hiring Pipeline Progression
          </span>
          <span
            className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-extrabold ${
              isRejected
                ? 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-200 dark:border-rose-800'
                : currentLevel === 4
                ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                : currentLevel === 3
                ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200 dark:border-amber-800'
                : currentLevel === 2
                ? 'bg-brand-100 text-brand-800 dark:bg-brand-950/60 dark:text-brand-300 border border-brand-200 dark:border-brand-800'
                : 'bg-accent-100 text-accent-800 dark:bg-accent-950/60 dark:text-accent-300 border border-accent-200 dark:border-accent-800'
            }`}
          >
            {isRejected ? '❌ Disqualified' : `Level ${currentLevel} of 4: ${PIPELINE_STAGES[currentLevel - 1]?.shortLabel || 'Applied'}`}
          </span>
        </div>

        {/* 4-bar mini progress track */}
        <div className="flex items-center gap-1">
          {[1, 2, 3, 4].map((step) => {
            const isCompleted = !isRejected && currentLevel >= step;
            const isCurrent = !isRejected && currentLevel === step;
            return (
              <div
                key={step}
                className={`h-1.5 w-6 rounded-full transition-all duration-300 ${
                  isRejected
                    ? 'bg-rose-200 dark:bg-rose-950'
                    : isCurrent
                    ? 'bg-brand-600 dark:bg-brand-400 ring-2 ring-brand-300/50'
                    : isCompleted
                    ? 'bg-emerald-500'
                    : 'bg-ink-100 dark:bg-[#21262d]'
                }`}
                title={`Level ${step}`}
              />
            );
          })}
        </div>
      </div>

      {/* Stepper Nodes */}
      <div className="relative flex items-center justify-between px-2 sm:px-4 py-2">
        {/* Background Connecting Line */}
        <div className="absolute left-6 right-6 top-1/2 -translate-y-1/2 h-1 bg-ink-100 dark:bg-[#30363d] -z-0" />
        {/* Active Connecting Progress Line */}
        <div
          className={`absolute left-6 top-1/2 -translate-y-1/2 h-1 transition-all duration-500 -z-0 ${
            isRejected ? 'bg-rose-300 dark:bg-rose-900' : 'bg-emerald-500'
          }`}
          style={{
            width: isRejected
              ? '100%'
              : currentLevel === 1
              ? '0%'
              : currentLevel === 2
              ? '33.3%'
              : currentLevel === 3
              ? '66.6%'
              : 'calc(100% - 3rem)',
          }}
        />

        {PIPELINE_STAGES.map((stage) => {
          const isPassed = !isRejected && currentLevel > stage.level;
          const isCurrent = !isRejected && currentLevel === stage.level;
          const isUpcoming = !isRejected && currentLevel < stage.level;

          return (
            <div
              key={stage.level}
              className="relative z-10 flex flex-col items-center group cursor-pointer"
              onClick={() => onUpdateStatus && onUpdateStatus(stage.status)}
              title={`Click to set status to ${stage.label}`}
            >
              {/* Step Circle */}
              <div
                className={`flex items-center justify-center rounded-full font-bold transition-all duration-200 ${
                  size === 'sm' ? 'h-7 w-7 text-xs' : 'h-9 w-9 text-sm'
                } ${
                  isPassed
                    ? 'bg-emerald-600 text-white shadow-soft ring-4 ring-emerald-50 dark:ring-emerald-950/40'
                    : isCurrent
                    ? `${stage.colorClasses.activeBg} text-white shadow-lift ring-4 ring-brand-100 dark:ring-brand-950/60 scale-110`
                    : isRejected
                    ? 'bg-ink-100 dark:bg-[#21262d] text-ink-400 dark:text-[#8b949e] border border-ink-200 dark:border-[#30363d]'
                    : 'bg-white dark:bg-[#161b22] text-ink-400 dark:text-[#8b949e] border-2 border-ink-200 dark:border-[#30363d] hover:border-ink-400'
                }`}
              >
                {isPassed ? (
                  <Check className="h-4 w-4 stroke-[3]" />
                ) : (
                  <span>{stage.level}</span>
                )}
              </div>

              {/* Stage Label */}
              <div className="mt-2 text-center select-none">
                <div
                  className={`text-[11px] sm:text-xs font-bold transition ${
                    isCurrent
                      ? 'text-ink-900 dark:text-white font-extrabold'
                      : isPassed
                      ? 'text-emerald-700 dark:text-emerald-400 font-semibold'
                      : 'text-ink-500 dark:text-[#8b949e]'
                  }`}
                >
                  <span className="hidden sm:inline">Level {stage.level}: </span>
                  <span>{stage.shortLabel}</span>
                </div>
                <div className="hidden md:block text-[10px] text-ink-400 dark:text-[#8b949e] max-w-[100px] truncate">
                  {stage.icon} {stage.status}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Rejected Alert Notice */}
      {isRejected && (
        <div className="mt-4 flex items-center justify-between gap-3 rounded-xl bg-rose-50 dark:bg-rose-950/30 p-3 border border-rose-200 dark:border-rose-900 text-xs text-rose-800 dark:text-rose-200 animate-fade-in">
          <div className="flex items-center gap-2">
            <XCircle className="h-4 w-4 text-rose-600 flex-shrink-0" />
            <span>Candidate is currently marked as <strong>Disqualified / Rejected</strong>.</span>
          </div>
          {onUpdateStatus && (
            <button
              onClick={() => onUpdateStatus('Shortlisted')}
              className="inline-flex items-center gap-1 rounded-lg bg-white dark:bg-[#161b22] px-2.5 py-1 text-xs font-bold text-ink-800 dark:text-ink-100 hover:bg-ink-100 shadow-2xs border border-ink-200 dark:border-[#30363d] transition"
            >
              <RotateCcw className="h-3 w-3" />
              Re-open to Level 2 (Shortlist)
            </button>
          )}
        </div>
      )}

      {/* Action Buttons Section */}
      {showActions && onUpdateStatus && (
        <div className="mt-4 pt-3 border-t border-ink-100 dark:border-[#30363d] flex flex-wrap items-center justify-between gap-3">
          {/* Sequential Next-Stage Primary Action */}
          <div className="flex items-center gap-2 flex-wrap">
            {nextStatus ? (
              <button
                onClick={() => onUpdateStatus(nextStatus)}
                className={`inline-flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-bold text-white shadow-soft transition active:scale-98 ${
                  nextStatus === 'Shortlisted'
                    ? 'bg-brand-600 hover:bg-brand-700'
                    : nextStatus === 'Interviewing'
                    ? 'bg-amber-600 hover:bg-amber-700'
                    : 'bg-emerald-600 hover:bg-emerald-700'
                }`}
              >
                <span>
                  Advance to Level {getPipelineLevelNumber(nextStatus)} ({PIPELINE_STAGES.find((s) => s.status === nextStatus)?.shortLabel})
                </span>
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            ) : currentLevel === 4 ? (
              <div className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 px-3.5 py-2 text-xs font-bold text-emerald-800 dark:text-emerald-300">
                <Award className="h-4 w-4 text-emerald-600" />
                <span>Level 4 Reached · Final Offer Extended</span>
              </div>
            ) : null}

            {/* Quick Level Jump Buttons */}
            <div className="flex items-center gap-1 bg-ink-50 dark:bg-[#21262d] p-1 rounded-xl border border-ink-200/60 dark:border-[#30363d]">
              <span className="text-[10px] font-bold text-ink-400 dark:text-[#8b949e] px-1.5 hidden lg:inline">
                Jump to:
              </span>
              {PIPELINE_STAGES.map((s) => {
                const isActive = !isRejected && currentStatus === s.status;
                return (
                  <button
                    key={s.status}
                    onClick={() => onUpdateStatus(s.status)}
                    className={`rounded-lg px-2 py-1 text-[11px] font-bold transition ${
                      isActive
                        ? `${s.colorClasses.activeBg} text-white shadow-2xs`
                        : 'text-ink-600 dark:text-[#c9d1d9] hover:bg-white dark:hover:bg-[#161b22]'
                    }`}
                    title={s.label}
                  >
                    L{s.level} {s.shortLabel}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Rejection / Terminal Action */}
          <div>
            {!isRejected ? (
              <button
                onClick={() => onUpdateStatus('Rejected')}
                className="inline-flex items-center gap-1 rounded-xl px-2.5 py-1.5 text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 border border-rose-200 dark:border-rose-900 transition"
                title="Reject candidate and move to archived"
              >
                <XCircle className="h-3.5 w-3.5" />
                <span>Reject</span>
              </button>
            ) : (
              <button
                onClick={() => onUpdateStatus('Applied')}
                className="inline-flex items-center gap-1 rounded-xl px-2.5 py-1.5 text-xs font-semibold text-ink-700 dark:text-[#c9d1d9] hover:bg-ink-100 dark:hover:bg-[#21262d] border border-ink-200 dark:border-[#30363d] transition"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                <span>Restore to Level 1</span>
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Compact Level Badge for list rows or cards
 */
export function PipelineLevelBadge({
  status,
  className = '',
}: {
  status?: ApplicationStatus;
  className?: string;
}) {
  const level = getPipelineLevelNumber(status);
  const isRejected = status === 'Rejected';

  if (isRejected) {
    return (
      <span
        className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-bold bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-200 dark:border-rose-800 ${className}`}
      >
        <span>❌</span>
        <span>Rejected</span>
      </span>
    );
  }

  const stage = PIPELINE_STAGES.find((s) => s.level === level) || PIPELINE_STAGES[0];

  return (
    <div
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-bold border transition ${stage.colorClasses.bg} ${stage.colorClasses.border} ${stage.colorClasses.text} ${className}`}
      title={stage.label}
    >
      <span>{stage.icon}</span>
      <span>{stage.chipLabel}</span>
      <div className="flex items-center gap-0.5 ml-0.5">
        {[1, 2, 3, 4].map((dot) => (
          <span
            key={dot}
            className={`h-1.5 w-1.5 rounded-full ${
              level >= dot ? 'bg-current opacity-90' : 'bg-current opacity-25'
            }`}
          />
        ))}
      </div>
    </div>
  );
}
