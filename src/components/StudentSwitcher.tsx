import { ChevronDown } from 'lucide-react';
import { useState } from 'react';
import { Avatar } from '@/components/ui';

export function StudentSwitcher({
  students,
  currentId,
  onSelect,
}: {
  students: { id: string; name: string; avatarColor: string; program: string; university: string; photoUrl?: string }[];
  currentId: string;
  onSelect: (id: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const current = students.find((s) => s.id === currentId);

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="group flex items-center gap-1.5 rounded-full border border-ink-200 dark:border-ink-700 bg-white dark:bg-ink-800 p-1 pr-2.5 shadow-sm hover:border-brand-300 dark:hover:border-brand-500 hover:shadow-soft transition active:scale-95"
        title={current ? `Active Student: ${current.name} (Click to switch)` : 'Switch Student'}
      >
        {current && <Avatar name={current.name} color={current.avatarColor} photoUrl={current.photoUrl} size="sm" />}
        <ChevronDown className="h-3.5 w-3.5 text-ink-400 group-hover:text-brand-600 transition" />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 z-50 mt-2 w-72 rounded-2xl border border-ink-100 dark:border-[#30363d] bg-white dark:bg-[#161b22] p-2 shadow-2xl animate-scale-in">
            <div className="px-3 py-2 text-[11px] font-bold uppercase tracking-wider text-ink-400 dark:text-[#8b949e] border-b border-ink-100 dark:border-[#30363d]">
              Active Demo Profile
            </div>
            <div className="mt-1 space-y-1">
              {students.map((s) => {
                const active = s.id === currentId;
                return (
                  <button
                    key={s.id}
                    onClick={() => {
                      onSelect(s.id);
                      setOpen(false);
                    }}
                    className={`flex w-full items-center gap-3 rounded-xl px-2.5 py-2 text-left transition ${
                      active
                        ? 'bg-brand-50 dark:bg-brand-950/70 text-brand-900 dark:text-brand-300 border border-brand-200 dark:border-brand-800'
                        : 'hover:bg-ink-50 dark:hover:bg-[#21262d] text-ink-700 dark:text-[#c9d1d9]'
                    }`}
                  >
                    <Avatar name={s.name} color={s.avatarColor} photoUrl={s.photoUrl} size="sm" />
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-semibold text-ink-900 dark:text-white">{s.name}</div>
                      <div className="truncate text-xs text-ink-500 dark:text-[#8b949e]">{s.program} · {s.university}</div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
