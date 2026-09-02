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
        className="group flex items-center gap-1.5 rounded-full border border-ink-200 bg-white p-1 pr-2.5 shadow-sm hover:border-brand-300 hover:shadow-soft transition active:scale-95"
        title={current ? `Active Student: ${current.name} (Click to switch)` : 'Switch Student'}
      >
        {current && <Avatar name={current.name} color={current.avatarColor} photoUrl={current.photoUrl} size="sm" />}
        <ChevronDown className="h-3.5 w-3.5 text-ink-400 group-hover:text-brand-600 transition" />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 z-50 mt-2 w-72 rounded-2xl border border-ink-100 bg-white p-2 shadow-2xl animate-scale-in">
            <div className="px-3 py-2 text-[11px] font-bold uppercase tracking-wider text-ink-400 border-b border-ink-100">
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
                      active ? 'bg-brand-50 text-brand-900 border border-brand-200' : 'hover:bg-ink-50 text-ink-700'
                    }`}
                  >
                    <Avatar name={s.name} color={s.avatarColor} photoUrl={s.photoUrl} size="sm" />
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-semibold">{s.name}</div>
                      <div className="truncate text-xs text-ink-500">{s.program} · {s.university}</div>
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
