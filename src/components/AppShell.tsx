import { useState, useEffect, type ReactNode } from 'react';
import {
  LayoutDashboard,
  FolderGit2,
  Compass,
  Target,
  Users,
  PlusCircle,
  Shield,
  GraduationCap,
  Menu,
  X,
  Info,
  ChevronRight,
  ArrowLeftRight,
  User as UserIcon,
  LogOut,
  Sparkles,
  Search,
  Brain,
  Building2,
} from 'lucide-react';
import { useRouter } from '@/lib/router';
import { Logo, LogoMark } from '@/components/Logo';
import { useAuth } from '@/lib/authContext';
import { AuthModal } from '@/components/AuthModal';
import { CommandPalette } from '@/components/CommandPalette';
import { Avatar } from '@/components/ui';
import { NotificationBell } from '@/components/NotificationBell';
import { ThemeToggle } from '@/lib/themeContext';

type NavItem = { label: string; path: string; icon: ReactNode };

const STUDENT_NAV: NavItem[] = [
  { label: 'Dashboard', path: '/student/dashboard', icon: <LayoutDashboard className="h-4 w-4" /> },
  { label: 'Skill Passport', path: '/student/passport', icon: <GraduationCap className="h-4 w-4" /> },
  { label: 'Evidence & Credentials', path: '/student/evidence', icon: <FolderGit2 className="h-4 w-4" /> },
  { label: 'Internship Discovery', path: '/student/internships', icon: <Compass className="h-4 w-4" /> },
  { label: 'Skill Gap Analysis', path: '/student/skillgap', icon: <Target className="h-4 w-4" /> },
  { label: 'Team Matching', path: '/student/teams', icon: <Users className="h-4 w-4" /> },
  { label: 'Interview Coach', path: '/student/interview-coach', icon: <Brain className="h-4 w-4" /> },
];

const ORG_NAV: NavItem[] = [
  { label: 'Organization Dashboard', path: '/org/dashboard', icon: <LayoutDashboard className="h-4 w-4" /> },
  { label: 'Create Opportunity', path: '/org/create', icon: <PlusCircle className="h-4 w-4" /> },
  { label: 'Candidate Matching', path: '/org/candidates', icon: <Users className="h-4 w-4" /> },
];

const TEAM_NAV: NavItem[] = [
  { label: 'Team Matching', path: '/team/matching', icon: <Users className="h-4 w-4" /> },
  { label: 'Squad Workspace', path: '/team/workspace', icon: <FolderGit2 className="h-4 w-4" /> },
  { label: 'Create Team', path: '/team/create', icon: <PlusCircle className="h-4 w-4" /> },
];

const COMMON_NAV: NavItem[] = [
  { label: 'Fairness & Explainability', path: '/fairness', icon: <Shield className="h-4 w-4" /> },
  { label: 'About & Role Selection', path: '/', icon: <Info className="h-4 w-4" /> },
];

type Role = 'student' | 'org' | 'team';

export function AppShell({
  role,
  activePath,
  children,
}: {
  role: Role;
  activePath: string;
  children: ReactNode;
}) {
  const { navigate } = useRouter();
  const { user, profile, signOut, isDemoMode } = useAuth();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);

  // Keyboard shortcut listeners (Escape and Ctrl/Cmd+K)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setCommandPaletteOpen((prev) => !prev);
      } else if (e.key === 'Escape') {
        setDrawerOpen(false);
        setUserDropdownOpen(false);
        setCommandPaletteOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const nav =
    role === 'student' ? STUDENT_NAV : role === 'org' ? ORG_NAV : TEAM_NAV;

  const roleConfig = {
    student: {
      label: 'Student View',
      badgeClass: 'bg-brand-50 text-brand-700 border-brand-200 dark:bg-brand-950/60 dark:text-brand-300 dark:border-brand-800',
      gradient: 'from-brand-600 to-brand-800',
    },
    org: {
      label: 'Organization View',
      badgeClass: 'bg-accent-50 text-accent-700 border-accent-200 dark:bg-accent-950/60 dark:text-accent-300 dark:border-accent-800',
      gradient: 'from-accent-600 to-accent-800',
    },
    team: {
      label: 'Team Creator View',
      badgeClass: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800',
      gradient: 'from-amber-500 to-orange-600',
    },
  }[role];

  const handleNavClick = (path: string) => {
    navigate(path);
    setDrawerOpen(false);
  };

  return (
    <div className="min-h-screen bg-ink-50 dark:bg-ink-950 flex flex-col transition-colors">
      {/* Sleek Topbar with Hamburger Toggle */}
      <header className="sticky top-0 z-30 border-b border-ink-100 dark:border-ink-800 bg-white/90 dark:bg-ink-900/90 backdrop-blur-md px-4 sm:px-6 py-3 shadow-soft transition-all">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <div className="flex items-center gap-3">
            {/* Hamburger Button */}
            <button
              onClick={() => setDrawerOpen((o) => !o)}
              className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-ink-200 dark:border-ink-700 bg-white dark:bg-ink-800 text-ink-700 dark:text-ink-200 hover:bg-ink-50 dark:hover:bg-ink-700 hover:border-brand-300 hover:text-brand-600 shadow-sm transition active:scale-95"
              aria-label="Toggle navigation menu"
            >
              <Menu className="h-5 w-5" />
            </button>

            {/* Logo */}
            <button onClick={() => navigate('/')} className="flex items-center gap-2.5 group">
              <LogoMark size={32} />
              <span className="font-display text-lg font-extrabold text-ink-900 dark:text-white tracking-tight group-hover:text-brand-600 transition">
                EvidentX
              </span>
            </button>

            {/* Role Badge */}
            <div className={`hidden sm:inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-bold ${roleConfig.badgeClass}`}>
              {roleConfig.label}
            </div>
          </div>

          {/* Right Header Controls */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Quick Command Palette Trigger */}
            <button
              onClick={() => setCommandPaletteOpen(true)}
              className="inline-flex items-center gap-2 rounded-xl border border-ink-200 dark:border-ink-700 bg-ink-50/80 dark:bg-ink-800/80 px-2.5 py-1.5 text-xs text-ink-600 dark:text-ink-300 hover:text-ink-900 dark:hover:text-white hover:border-brand-300 dark:hover:border-brand-500 shadow-2xs transition active:scale-95"
              title="Search or press ⌘K / Ctrl+K"
            >
              <Search className="h-3.5 w-3.5 text-ink-400 dark:text-ink-400" />
              <span className="hidden md:inline text-[11px] font-medium">Quick Search</span>
              <kbd className="hidden sm:inline-flex items-center rounded border border-ink-200 dark:border-ink-600 bg-white dark:bg-ink-900 px-1 py-0.2 font-mono text-[9px] font-bold text-ink-500 dark:text-ink-400">
                ⌘K
              </kbd>
            </button>

            <button
              onClick={() => navigate('/fairness')}
              className="hidden md:inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold text-ink-600 dark:text-ink-300 hover:bg-ink-100/70 dark:hover:bg-ink-800 hover:text-ink-900 dark:hover:text-white transition"
            >
              <Shield className="h-3.5 w-3.5 text-accent-600" />
              Fairness Policy
            </button>

            <button
              onClick={() => setAuthModalOpen(true)}
              className="hidden sm:inline-flex items-center gap-1.5 rounded-xl border border-ink-200 dark:border-ink-700 bg-white dark:bg-ink-800 px-3 py-1.5 text-xs font-semibold text-ink-700 dark:text-ink-200 hover:border-brand-300 hover:bg-brand-50 dark:hover:bg-ink-700 hover:text-brand-700 shadow-sm transition"
              title="Switch Account or Sign In"
            >
              <ArrowLeftRight className="h-3.5 w-3.5" />
              <span>Switch Account</span>
            </button>

            {/* Theme Toggle Button */}
            <ThemeToggle />

            {/* Notification Bell */}
            <NotificationBell />

            {/* Auth / Account Profile Button */}
            <div className="relative">
              {profile ? (
                <button
                  onClick={() => setUserDropdownOpen((o) => !o)}
                  className="flex items-center gap-2 rounded-full border border-ink-200 dark:border-ink-700 bg-white dark:bg-ink-800 p-1 pr-3 hover:border-brand-300 shadow-sm transition active:scale-95"
                >
                  <Avatar
                    name={profile.name}
                    color={profile.avatarColor ?? 'from-brand-500 to-brand-700'}
                    size="sm"
                  />
                  <div className="text-left hidden lg:block">
                    <div className="text-xs font-bold text-ink-900 dark:text-white truncate max-w-[110px] leading-tight">
                      {profile.name}
                    </div>
                    <div className="text-[10px] text-ink-400 dark:text-ink-400 font-semibold uppercase tracking-wider">
                      {profile.role}
                    </div>
                  </div>
                </button>
              ) : (
                <button
                  onClick={() => setAuthModalOpen(true)}
                  className="btn-primary text-xs py-1.5 px-3"
                >
                  <UserIcon className="h-3.5 w-3.5" />
                  <span>Sign In</span>
                </button>
              )}

              {/* User Dropdown Menu */}
              {userDropdownOpen && profile && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setUserDropdownOpen(false)}
                  />
                  <div className="absolute right-0 z-50 mt-2 w-64 rounded-2xl border border-ink-100 dark:border-ink-800 bg-white dark:bg-ink-900 p-2 shadow-2xl animate-scale-in">
                    <div className="px-3 py-2 border-b border-ink-100 dark:border-ink-800">
                      <div className="text-xs font-bold text-ink-900 dark:text-white truncate">{profile.name}</div>
                      <div className="text-[11px] text-ink-500 dark:text-ink-400 truncate">{profile.email}</div>
                      <div className="mt-1.5 inline-flex items-center gap-1 rounded-full bg-brand-50 dark:bg-brand-950/50 border border-brand-200 dark:border-brand-800 px-2 py-0.5 text-[10px] font-bold text-brand-700 dark:text-brand-300 uppercase tracking-wider">
                        {profile.role} account
                      </div>
                    </div>

                    <div className="py-1 space-y-0.5">
                      <button
                        onClick={() => {
                          setUserDropdownOpen(false);
                          setAuthModalOpen(true);
                        }}
                        className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold text-ink-700 dark:text-ink-200 hover:bg-ink-50 dark:hover:bg-ink-800 transition"
                      >
                        <UserIcon className="h-3.5 w-3.5 text-brand-600 dark:text-brand-400" />
                        <span>Switch Account / Sign In</span>
                      </button>

                      <button
                        onClick={() => {
                          setUserDropdownOpen(false);
                          signOut();
                        }}
                        className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition"
                      >
                        <LogOut className="h-3.5 w-3.5" />
                        <span>Sign Out</span>
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Slide-out Hamburger Drawer */}
      {drawerOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          {/* Backdrop Blur */}
          <div
            className="absolute inset-0 bg-ink-950/50 backdrop-blur-sm transition-opacity animate-fade-in"
            onClick={() => setDrawerOpen(false)}
          />

          {/* Drawer Panel */}
          <aside className="absolute inset-y-0 left-0 flex max-w-full">
            <div className="w-80 sm:w-96 bg-white dark:bg-ink-900 shadow-2xl flex flex-col justify-between transform transition-transform duration-300 ease-in-out border-r border-ink-100 dark:border-ink-800">
              {/* Drawer Header */}
              <div>
                <div className="flex items-center justify-between p-5 border-b border-ink-100 dark:border-ink-800">
                  <div className="flex items-center gap-2.5">
                    <Logo size={32} />
                  </div>
                  <div className="flex items-center gap-2">
                    <ThemeToggle />
                    <button
                      onClick={() => setDrawerOpen(false)}
                      className="inline-flex h-9 w-9 items-center justify-center rounded-xl text-ink-400 hover:bg-ink-100 dark:hover:bg-ink-800 hover:text-ink-700 dark:hover:text-ink-200 transition"
                    >
                      <X className="h-5 w-5" />
                    </button>
                  </div>
                </div>

                {/* Role Switcher in Drawer */}
                <div className="p-4 bg-ink-50/70 dark:bg-ink-950/60 border-b border-ink-100 dark:border-ink-800">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-ink-400">Portal View</span>
                    <span className="text-[10px] font-semibold text-ink-500 capitalize">{profile?.role || 'Guest'} Account</span>
                  </div>
                  <div className="grid grid-cols-2 gap-1.5">
                    {profile?.role === 'organization' ? (
                      <>
                        <button
                          onClick={() => handleNavClick('/org/dashboard')}
                          className={`rounded-xl p-2 text-center text-xs font-bold transition ${
                            role === 'org'
                              ? 'bg-accent-600 text-white shadow-soft'
                              : 'bg-white dark:bg-ink-800 border border-ink-200 dark:border-ink-700 text-ink-600 dark:text-ink-300 hover:bg-ink-100 dark:hover:bg-ink-700'
                          }`}
                        >
                          Organization
                        </button>
                        <button
                          onClick={() => handleNavClick('/team/matching')}
                          className={`rounded-xl p-2 text-center text-xs font-bold transition ${
                            role === 'team'
                              ? 'bg-amber-600 text-white shadow-soft'
                              : 'bg-white dark:bg-ink-800 border border-ink-200 dark:border-ink-700 text-ink-600 dark:text-ink-300 hover:bg-ink-100 dark:hover:bg-ink-700'
                          }`}
                        >
                          Team Squads
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          onClick={() => handleNavClick('/student/dashboard')}
                          className={`rounded-xl p-2 text-center text-xs font-bold transition ${
                            role === 'student'
                              ? 'bg-brand-600 text-white shadow-soft'
                              : 'bg-white dark:bg-ink-800 border border-ink-200 dark:border-ink-700 text-ink-600 dark:text-ink-300 hover:bg-ink-100 dark:hover:bg-ink-700'
                          }`}
                        >
                          Student
                        </button>
                        <button
                          onClick={() => handleNavClick('/team/matching')}
                          className={`rounded-xl p-2 text-center text-xs font-bold transition ${
                            role === 'team'
                              ? 'bg-amber-600 text-white shadow-soft'
                              : 'bg-white dark:bg-ink-800 border border-ink-200 dark:border-ink-700 text-ink-600 dark:text-ink-300 hover:bg-ink-100 dark:hover:bg-ink-700'
                          }`}
                        >
                          Team Squads
                        </button>
                      </>
                    )}
                  </div>
                </div>

                {/* Navigation Links */}
                <nav className="p-4 space-y-6 overflow-y-auto max-h-[calc(100vh-280px)]">
                  <div>
                    <div className="text-[11px] font-bold uppercase tracking-wider text-ink-400 mb-2 px-2">
                      {roleConfig.label} Navigation
                    </div>
                    <div className="space-y-1">
                      {nav.map((item) => {
                        const active = activePath === item.path || activePath.startsWith(item.path + '/');
                        return (
                          <button
                            key={item.path}
                            onClick={() => handleNavClick(item.path)}
                            className={`flex w-full items-center justify-between rounded-xl px-3.5 py-2.5 text-sm font-semibold transition-all ${
                              active
                                ? 'bg-brand-50 dark:bg-brand-950/60 text-brand-700 dark:text-brand-300 shadow-sm border border-brand-200 dark:border-brand-800'
                                : 'text-ink-700 dark:text-ink-300 hover:bg-ink-50 dark:hover:bg-ink-800 hover:text-ink-900 dark:hover:text-white'
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              <span className={active ? 'text-brand-600 dark:text-brand-400' : 'text-ink-400'}>{item.icon}</span>
                              <span>{item.label}</span>
                            </div>
                            <ChevronRight className={`h-4 w-4 transition ${active ? 'text-brand-600 dark:text-brand-400' : 'text-ink-300'}`} />
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div>
                    <div className="text-[11px] font-bold uppercase tracking-wider text-ink-400 mb-2 px-2">
                      System & Policy
                    </div>
                    <div className="space-y-1">
                      {COMMON_NAV.map((item) => {
                        const active = activePath === item.path;
                        return (
                          <button
                            key={item.path}
                            onClick={() => handleNavClick(item.path)}
                            className={`flex w-full items-center justify-between rounded-xl px-3.5 py-2.5 text-sm font-semibold transition-all ${
                              active
                                ? 'bg-brand-50 dark:bg-brand-950/60 text-brand-700 dark:text-brand-300 shadow-sm border border-brand-200 dark:border-brand-800'
                                : 'text-ink-700 dark:text-ink-300 hover:bg-ink-50 dark:hover:bg-ink-800 hover:text-ink-900 dark:hover:text-white'
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              <span className={active ? 'text-brand-600 dark:text-brand-400' : 'text-ink-400'}>{item.icon}</span>
                              <span>{item.label}</span>
                            </div>
                            <ChevronRight className={`h-4 w-4 transition ${active ? 'text-brand-600 dark:text-brand-400' : 'text-ink-300'}`} />
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </nav>
              </div>

              {/* Drawer Footer */}
              <div className="p-4 border-t border-ink-100 dark:border-ink-800 bg-ink-50/50 dark:bg-ink-950/50 space-y-2">
                <button
                  onClick={() => {
                    setDrawerOpen(false);
                    setAuthModalOpen(true);
                  }}
                  className="w-full btn-primary text-xs"
                >
                  <UserIcon className="h-3.5 w-3.5" />
                  <span>Account & Authentication</span>
                </button>
                <button
                  onClick={() => handleNavClick('/')}
                  className="w-full btn-secondary text-xs"
                >
                  Return to Welcome Screen
                </button>
              </div>
            </div>
          </aside>
        </div>
      )}

      {/* Auth Modal */}
      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
      />

      {/* Command Palette Modal */}
      <CommandPalette
        isOpen={commandPaletteOpen}
        onClose={() => setCommandPaletteOpen(false)}
        onOpenAuthModal={() => setAuthModalOpen(true)}
      />

      {/* Main Content Area */}
      <main className="flex-1 pb-24 sm:pb-8">
        <div className="mx-auto max-w-7xl px-3 sm:px-6 lg:px-8 py-4 sm:py-6 animate-fade-in">{children}</div>
      </main>

      {/* Persistent Mobile Bottom Navigation Bar */}
      <nav
        aria-label="Mobile Bottom Navigation"
        className="sm:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-ink-900/95 backdrop-blur-lg border-t border-ink-200/90 dark:border-ink-800 shadow-lift"
        style={{ paddingBottom: 'max(0.375rem, env(safe-area-inset-bottom))' }}
      >
        <div className="flex items-center justify-around gap-1 px-2 py-1.5">
          {nav.slice(0, 5).map((item) => {
            const active = activePath === item.path || activePath.startsWith(item.path + '/');
            return (
              <button
                key={item.path}
                onClick={() => handleNavClick(item.path)}
                className={`flex flex-1 flex-col items-center justify-center py-1 rounded-xl transition-all ${
                  active
                    ? 'text-brand-600 dark:text-brand-400 font-bold'
                    : 'text-ink-500 dark:text-ink-400 hover:text-ink-800 dark:hover:text-ink-200 font-medium'
                }`}
              >
                <div
                  className={`p-1.5 rounded-xl transition-all ${
                    active
                      ? 'bg-brand-50 dark:bg-brand-950/80 text-brand-600 dark:text-brand-400 scale-105 shadow-2xs'
                      : ''
                  }`}
                >
                  {item.icon}
                </div>
                <span className="text-[10px] leading-tight mt-0.5 truncate max-w-[62px]">
                  {item.label.split(' ')[0]}
                </span>
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
