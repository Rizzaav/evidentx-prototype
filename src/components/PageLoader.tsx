import { Sparkles } from 'lucide-react';

export function PageLoader() {
  return (
    <div
      role="status"
      aria-label="Loading page"
      className="flex min-h-[360px] w-full flex-col items-center justify-center gap-3 py-16 text-center animate-fade-in"
    >
      <div className="relative flex items-center justify-center">
        <div className="h-10 w-10 rounded-full border-2 border-brand-200 border-t-brand-600 animate-spin" />
        <Sparkles className="absolute h-4 w-4 text-brand-600 animate-pulse" />
      </div>
      <p className="text-xs font-semibold uppercase tracking-wider text-ink-500">
        Loading view...
      </p>
    </div>
  );
}
