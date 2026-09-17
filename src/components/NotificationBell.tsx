import { useState, useEffect } from 'react';
import { Bell, Check, Sparkles, Trash2, X, ExternalLink } from 'lucide-react';
import { useNotifications, type AppNotification } from '@/lib/notifications';
import { useAuth } from '@/lib/authContext';
import { useRouter } from '@/lib/router';

export function NotificationBell() {
  const { profile } = useAuth();
  const { navigate } = useRouter();
  const filter = profile ? { studentId: profile.id, role: profile.role, organization: profile.organization } : undefined;
  const { notifications, unreadCount, markAsRead, markAllAsRead, clearAll } = useNotifications(filter);
  const [open, setOpen] = useState(false);

  // Close on Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const getIcon = (type: AppNotification['type']) => {
    switch (type) {
      case 'evidence_update':
        return '📝';
      case 'shortlist':
        return '⭐';
      case 'interview':
        return '🎙️';
      case 'offer':
        return '🏆';
      case 'reject':
        return '📬';
      case 'review':
        return '👀';
      default:
        return '🔔';
    }
  };

  const getBadgeColor = (type: AppNotification['type']) => {
    switch (type) {
      case 'evidence_update':
        return 'bg-indigo-50 border-indigo-200 text-indigo-700';
      case 'shortlist':
        return 'bg-brand-50 border-brand-200 text-brand-700';
      case 'interview':
        return 'bg-amber-50 border-amber-200 text-amber-800';
      case 'offer':
        return 'bg-emerald-50 border-emerald-200 text-emerald-800';
      case 'reject':
        return 'bg-rose-50 border-rose-200 text-rose-700';
      default:
        return 'bg-ink-50 border-ink-200 text-ink-700';
    }
  };

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="relative inline-flex h-9 w-9 items-center justify-center rounded-xl border border-ink-200 dark:border-ink-700 bg-white dark:bg-ink-800 text-ink-700 dark:text-ink-200 hover:border-brand-300 dark:hover:border-brand-500 hover:bg-brand-50 dark:hover:bg-ink-700 hover:text-brand-700 dark:hover:text-brand-300 shadow-sm transition active:scale-95"
        aria-label="Notifications"
        title="View Notifications"
      >
        <Bell className="h-4 w-4" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-extrabold text-white shadow-sm animate-pulse">
            {unreadCount}
          </span>
        )}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 z-50 mt-2 w-80 sm:w-96 rounded-2xl border border-ink-100 dark:border-[#30363d] bg-white dark:bg-[#161b22] p-3 shadow-2xl animate-scale-in">
            {/* Header */}
            <div className="flex items-center justify-between pb-2 mb-2 border-b border-ink-100 dark:border-[#30363d]">
              <div className="flex items-center gap-1.5 font-display text-sm font-bold text-ink-900 dark:text-white">
                <Bell className="h-4 w-4 text-brand-600 dark:text-brand-400" />
                <span>Notifications</span>
                {unreadCount > 0 && (
                  <span className="rounded-full bg-brand-50 dark:bg-brand-950/70 border border-brand-200 dark:border-brand-800 px-1.5 py-0.2 text-[10px] font-bold text-brand-700 dark:text-brand-300">
                    {unreadCount} new
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1">
                {unreadCount > 0 && (
                  <button
                    onClick={() => markAllAsRead(filter)}
                    className="text-[11px] font-semibold text-brand-600 dark:text-brand-400 hover:text-brand-800 dark:hover:text-brand-300 px-2 py-0.5 rounded-lg hover:bg-brand-50 dark:hover:bg-ink-800 transition"
                  >
                    Mark all read
                  </button>
                )}
                {notifications.length > 0 && (
                  <button
                    onClick={() => clearAll(filter)}
                    className="text-[11px] font-semibold text-ink-400 hover:text-rose-600 dark:hover:text-rose-400 px-1.5 py-0.5 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/50 transition"
                    title="Clear all"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            </div>

            {/* Notification List */}
            <div className="max-h-80 overflow-y-auto space-y-2 pr-0.5">
              {notifications.length === 0 ? (
                <div className="py-8 text-center text-ink-400 dark:text-[#8b949e]">
                  <Sparkles className="h-8 w-8 mx-auto mb-1 text-ink-300 dark:text-[#8b949e] opacity-60" />
                  <p className="text-xs font-semibold">No notifications yet</p>
                  <p className="text-[11px] text-ink-400 dark:text-[#8b949e] mt-0.5">
                    {profile?.role === 'organization'
                      ? 'Candidate evidence updates and application alerts will appear here.'
                      : 'Updates on shortlist, interview and offer status will appear here.'}
                  </p>
                </div>
              ) : (
                notifications.map((n) => (
                  <div
                    key={n.id}
                    onClick={() => {
                      markAsRead(n.id);
                      setOpen(false);
                      if (profile?.role === 'organization' && n.opportunityId && n.studentId) {
                        navigate(`/org/candidates/${n.opportunityId}/${n.studentId}`);
                      } else if (n.opportunityId) {
                        navigate(`/student/internships/${n.opportunityId}`);
                      } else if (n.type === 'evidence_update') {
                        navigate('/student/evidence');
                      }
                    }}
                    className={`cursor-pointer rounded-xl p-2.5 border transition ${
                      !n.read
                        ? 'bg-brand-50/40 dark:bg-brand-950/40 border-brand-200/80 dark:border-brand-800/80 shadow-2xs hover:bg-brand-50/70 dark:hover:bg-brand-950/60'
                        : 'bg-white dark:bg-[#161b22] border-ink-100 dark:border-[#30363d] hover:bg-ink-50/80 dark:hover:bg-[#21262d]'
                    }`}
                  >
                    <div className="flex items-start gap-2.5">
                      <span className="text-lg leading-none mt-0.5">{getIcon(n.type)}</span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-1">
                          <h4 className="text-xs font-bold text-ink-900 dark:text-white truncate">{n.title}</h4>
                          <span className="text-[10px] text-ink-400 dark:text-[#8b949e] whitespace-nowrap">
                            {new Date(n.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        <p className="text-[11.5px] text-ink-600 dark:text-ink-300 mt-0.5 leading-snug">{n.message}</p>
                        {n.opportunityTitle && (
                          <div className="mt-1.5 inline-flex items-center gap-1 text-[10px] font-bold text-brand-700 dark:text-brand-300 bg-brand-50 dark:bg-brand-950/60 px-2 py-0.5 rounded-md border border-brand-200 dark:border-brand-800">
                            <span>{n.organizationName} · {n.opportunityTitle}</span>
                            <ExternalLink className="h-2.5 w-2.5 ml-0.5" />
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
