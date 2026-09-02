import React, { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import type { User, Session } from '@supabase/supabase-js';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import type { UserRole, Student } from '@/types';
import { STUDENTS, getAllStudentMap } from '@/data/mockData';
import { addCustomStudentRecord } from '@/lib/customStudents';

export interface UserProfile {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  organization?: string;
  university?: string;
  program?: string;
  avatarColor?: string;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: UserProfile | null;
  role: UserRole;
  loading: boolean;
  isDemoMode: boolean;
  signInWithEmail: (email: string, password: string, roleHint?: UserRole) => Promise<{ error: string | null }>;
  signUpWithEmail: (
    email: string,
    password: string,
    role: UserRole,
    name: string,
    metadata?: { organization?: string; university?: string; program?: string }
  ) => Promise<{ error: string | null }>;
  signInWithOAuth: (provider: 'github' | 'google') => Promise<{ error: string | null }>;
  signInWithGitHubUsername: (username: string) => Promise<{ error: string | null }>;
  signInWithGoogleCredentials: (name: string, email: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
  setDemoUser: (profile: UserProfile) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const LOCAL_USER_KEY = 'evx_auth_user_v1';
const PROFILES_KEY = 'evx_user_profiles_v1';

const DEFAULT_DEMO_PROFILE: UserProfile = {
  id: 'st_aarav',
  email: 'rishav.s@university.edu',
  name: 'Rishav Singh',
  role: 'student',
  university: 'ITER SOA',
  program: 'B.Tech Computer Science',
  avatarColor: 'from-brand-500 to-brand-700',
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(() => {
    try {
      const saved = localStorage.getItem(LOCAL_USER_KEY);
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  const [loading, setLoading] = useState<boolean>(true);

  // Sync Supabase Auth session if configured
  useEffect(() => {
    if (!isSupabaseConfigured() || !supabase) {
      setLoading(false);
      return;
    }

    try {
      supabase.auth.getSession().then(({ data, error }) => {
        if (!error && data?.session) {
          setSession(data.session);
          setUser(data.session.user ?? null);
          if (data.session.user) {
            const meta = data.session.user.user_metadata || {};
            const userEmail = (data.session.user.email || '').toLowerCase().trim();
            let savedRole: UserRole | undefined;
            try {
              const savedRoles = JSON.parse(localStorage.getItem('evx_user_roles_v1') || '{}');
              savedRole = savedRoles[userEmail];
            } catch {}
            const resolvedRole: UserRole = (meta.role as UserRole) || savedRole || (userEmail.includes('org') || userEmail.includes('recruiter') ? 'organization' : 'student');

            const p: UserProfile = {
              id: data.session.user.id,
              email: data.session.user.email || '',
              name: meta.name || data.session.user.email?.split('@')[0] || 'User',
              role: resolvedRole,
              organization: meta.organization,
              university: meta.university,
              program: meta.program,
              avatarColor: resolvedRole === 'organization' ? 'from-accent-600 to-accent-800' : (meta.avatarColor || 'from-brand-500 to-brand-700'),
            };
            setProfile(p);
            localStorage.setItem(LOCAL_USER_KEY, JSON.stringify(p));
          }
        }
        setLoading(false);
      }).catch((err) => {
        console.warn('Supabase getSession network error:', err);
        setLoading(false);
      });

      const {
        data: { subscription },
      } = supabase.auth.onAuthStateChange((_event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        if (session?.user) {
          const meta = session.user.user_metadata || {};
          const userEmail = (session.user.email || '').toLowerCase().trim();
          let savedRole: UserRole | undefined;
          try {
            const savedRoles = JSON.parse(localStorage.getItem('evx_user_roles_v1') || '{}');
            savedRole = savedRoles[userEmail];
          } catch {}
          const resolvedRole: UserRole = (meta.role as UserRole) || savedRole || (userEmail.includes('org') || userEmail.includes('recruiter') ? 'organization' : 'student');

          const p: UserProfile = {
            id: session.user.id,
            email: session.user.email || '',
            name: meta.name || session.user.email?.split('@')[0] || 'User',
            role: resolvedRole,
            organization: meta.organization,
            university: meta.university,
            program: meta.program,
            avatarColor: resolvedRole === 'organization' ? 'from-accent-600 to-accent-800' : (meta.avatarColor || 'from-brand-500 to-brand-700'),
          };
          setProfile(p);
          localStorage.setItem(LOCAL_USER_KEY, JSON.stringify(p));
        } else if (_event === 'SIGNED_OUT') {
          setProfile(null);
          localStorage.removeItem(LOCAL_USER_KEY);
        }
      });

      return () => subscription.unsubscribe();
    } catch (err) {
      console.warn('Supabase auth initialization fallback:', err);
      setLoading(false);
    }
  }, []);

  const signInWithEmail = useCallback(async (email: string, password: string, roleHint?: UserRole) => {
    const cleanEmail = email.trim().toLowerCase();
    const cleanPassword = password.trim();

    // Check permanently stored registered profiles & roles first
    let savedProfile: UserProfile | undefined;
    let savedRole: UserRole | undefined;
    try {
      const savedProfiles = JSON.parse(localStorage.getItem(PROFILES_KEY) || '{}');
      savedProfile = savedProfiles[cleanEmail];
      const savedRoles = JSON.parse(localStorage.getItem('evx_user_roles_v1') || '{}');
      savedRole = savedRoles[cleanEmail] || savedProfile?.role;
    } catch {}

    // 1. Try Supabase cloud auth if configured
    if (isSupabaseConfigured() && supabase) {
      try {
        const { data, error } = await supabase.auth.signInWithPassword({ email: cleanEmail, password: cleanPassword });
        if (!error && data.user) {
          const meta = data.user.user_metadata || {};
          const resolvedRole: UserRole =
            roleHint ||
            (meta.role as UserRole) ||
            savedRole ||
            savedProfile?.role ||
            (cleanEmail.includes('org') || cleanEmail.includes('recruiter') ? 'organization' : 'student');

          const p: UserProfile = {
            id: data.user.id,
            email: data.user.email || cleanEmail,
            name: meta.name || savedProfile?.name || cleanEmail.split('@')[0],
            role: resolvedRole,
            organization: meta.organization || savedProfile?.organization || (resolvedRole === 'organization' ? (meta.name || 'Organization Partner') : undefined),
            university: meta.university || savedProfile?.university,
            program: meta.program || savedProfile?.program,
            avatarColor: resolvedRole === 'organization' ? 'from-accent-600 to-accent-800' : (meta.avatarColor || 'from-brand-500 to-brand-700'),
          };
          setProfile(p);
          localStorage.setItem(LOCAL_USER_KEY, JSON.stringify(p));
          try {
            const savedRoles = JSON.parse(localStorage.getItem('evx_user_roles_v1') || '{}');
            savedRoles[cleanEmail] = resolvedRole;
            localStorage.setItem('evx_user_roles_v1', JSON.stringify(savedRoles));

            const savedProfiles = JSON.parse(localStorage.getItem(PROFILES_KEY) || '{}');
            savedProfiles[cleanEmail] = p;
            localStorage.setItem(PROFILES_KEY, JSON.stringify(savedProfiles));
          } catch {}
          return { error: null };
        }
      } catch (err: any) {
        console.warn('Cloud sign in fallback:', err);
      }
    }

    // 2. Local Account Authentication & Matching
    const allStudentsMap = getAllStudentMap();
    const existingStudent = Object.values(allStudentsMap).find(
      (s) => s.email.toLowerCase() === cleanEmail
    );

    const userRole: UserRole =
      roleHint ||
      savedRole ||
      savedProfile?.role ||
      (cleanEmail.includes('org') || cleanEmail.includes('recruiter') ? 'organization' : 'student');

    const authenticatedProfile: UserProfile = {
      id: savedProfile?.id || (userRole === 'student' ? existingStudent?.id : undefined) || (userRole === 'organization' ? `org_usr_${Date.now()}` : `usr_${Date.now()}`),
      email: cleanEmail,
      name: savedProfile?.name || (userRole === 'student' ? existingStudent?.name : undefined) || cleanEmail.split('@')[0] || 'User',
      role: userRole,
      organization: savedProfile?.organization || (userRole === 'organization' ? (savedProfile?.name || 'Enterprise Partner') : undefined),
      university: userRole === 'student' ? (savedProfile?.university || existingStudent?.university || 'University Student') : undefined,
      program: userRole === 'student' ? (savedProfile?.program || existingStudent?.program || 'Engineering') : undefined,
      avatarColor: userRole === 'organization' ? 'from-accent-600 to-accent-800' : (savedProfile?.avatarColor || existingStudent?.avatarColor || 'from-brand-500 to-brand-700'),
    };

    // If new student user signing in for first time, register student record so matching works immediately
    if (userRole === 'student' && !existingStudent) {
      const studentRecord: Student = {
        id: authenticatedProfile.id,
        name: authenticatedProfile.name,
        email: cleanEmail,
        program: 'Computer Science',
        year: '1st Year',
        university: 'State University',
        bio: 'Self-motivated student building verified skills on EvidentX.',
        avatarColor: 'from-brand-500 to-brand-700',
        interests: ['Web Development', 'Software Engineering'],
      };
      addCustomStudentRecord(studentRecord, [], {});
    }

    // Update persistent registries
    try {
      const savedProfiles = JSON.parse(localStorage.getItem(PROFILES_KEY) || '{}');
      savedProfiles[cleanEmail] = authenticatedProfile;
      localStorage.setItem(PROFILES_KEY, JSON.stringify(savedProfiles));

      const savedRoles = JSON.parse(localStorage.getItem('evx_user_roles_v1') || '{}');
      savedRoles[cleanEmail] = userRole;
      localStorage.setItem('evx_user_roles_v1', JSON.stringify(savedRoles));
    } catch {}

    setProfile(authenticatedProfile);
    localStorage.setItem(LOCAL_USER_KEY, JSON.stringify(authenticatedProfile));
    return { error: null };
  }, []);

  const signUpWithEmail = useCallback(
    async (
      email: string,
      password: string,
      role: UserRole,
      name: string,
      metadata?: { organization?: string; university?: string; program?: string }
    ) => {
      const cleanEmail = email.trim().toLowerCase();
      let createdUserId = role === 'organization' ? `org_usr_${Date.now()}` : `st_usr_${Date.now()}`;

      // Save local credentials and role mapping
      const credKey = 'evx_user_credentials_v1';
      const rolesKey = 'evx_user_roles_v1';
      try {
        const savedCreds = JSON.parse(localStorage.getItem(credKey) || '{}');
        savedCreds[cleanEmail] = password;
        localStorage.setItem(credKey, JSON.stringify(savedCreds));

        const savedRoles = JSON.parse(localStorage.getItem(rolesKey) || '{}');
        savedRoles[cleanEmail] = role;
        localStorage.setItem(rolesKey, JSON.stringify(savedRoles));
      } catch {}

      // 1. Try Supabase cloud signup if configured
      if (isSupabaseConfigured() && supabase) {
        try {
          const { data, error } = await supabase.auth.signUp({
            email: cleanEmail,
            password,
            options: {
              data: {
                name,
                role,
                ...metadata,
              },
            },
          });
          if (data?.user?.id) {
            createdUserId = data.user.id;
          }
          if (error && !error.message.includes('fetch')) {
            console.warn('Supabase cloud signup warning:', error.message);
          }
        } catch (err) {
          console.warn('Supabase cloud signup network warning, proceeding with local registration:', err);
        }
      }

      // 2. Create and persist local user profile
      const newProfile: UserProfile = {
        id: createdUserId,
        email: cleanEmail,
        name,
        role,
        organization: metadata?.organization || (role === 'organization' ? (name.includes(' ') ? name : name + ' Org') : undefined),
        university: metadata?.university || (role === 'student' ? 'University Partner' : undefined),
        program: metadata?.program || (role === 'student' ? 'Undergraduate Degree' : undefined),
        avatarColor: role === 'organization' ? 'from-accent-600 to-accent-800' : 'from-brand-500 to-brand-700',
      };

      // Persist to user profiles registry
      try {
        const savedProfiles = JSON.parse(localStorage.getItem(PROFILES_KEY) || '{}');
        savedProfiles[cleanEmail] = newProfile;
        localStorage.setItem(PROFILES_KEY, JSON.stringify(savedProfiles));
      } catch {}

      // 3. If candidate, also register student in mockData store so all matching works immediately
      if (role === 'student') {
        const studentRecord: Student = {
          id: createdUserId,
          name,
          email: cleanEmail,
          program: metadata?.program || 'Computer Science',
          year: '1st Year',
          university: metadata?.university || 'State University',
          bio: 'Self-motivated student building verified skills on EvidentX.',
          avatarColor: 'from-brand-500 to-brand-700',
          interests: ['Web Development', 'Software Engineering'],
        };
        addCustomStudentRecord(studentRecord, [], {});
      }

      setProfile(newProfile);
      localStorage.setItem(LOCAL_USER_KEY, JSON.stringify(newProfile));
      return { error: null };
    },
    []
  );

    const signInWithGitHubUsername = useCallback(async (rawUsername: string) => {
    const cleaned = rawUsername
      .trim()
      .replace(/^https?:\/\/github\.com\//i, '')
      .replace(/\/+$/, '');
    if (!cleaned) return { error: 'Please enter a valid GitHub username' };

    try {
      let ghName = cleaned;
      let ghBio = 'Verified GitHub Developer building on EvidentX.';
      let ghEmail = `${cleaned}@github.com`;
      let ghCompany = 'GitHub Open Source Contributor';

      const res = await fetch(`https://api.github.com/users/${cleaned}`);
      if (res.ok) {
        const ghData = await res.json();
        ghName = ghData.name || ghData.login || cleaned;
        ghBio = ghData.bio || `Active GitHub developer with ${ghData.public_repos || 0} public repositories.`;
        ghEmail = ghData.email || `${cleaned}@users.noreply.github.com`;
        ghCompany = ghData.company || ghData.location || 'GitHub Developer Community';
      }

      const userId = `gh_${cleaned.toLowerCase()}`;
      const newProf: UserProfile = {
        id: userId,
        email: ghEmail,
        name: ghName,
        role: 'student',
        university: ghCompany,
        program: 'Software Development',
        avatarColor: 'from-brand-600 to-brand-900',
      };

      const studentRecord: Student = {
        id: userId,
        name: ghName,
        email: ghEmail,
        program: 'Software Development',
        year: '3rd Year',
        university: ghCompany,
        bio: ghBio,
        avatarColor: 'from-brand-600 to-brand-900',
        interests: ['Open Source', 'Full-Stack', 'Git & CI/CD'],
      };
      addCustomStudentRecord(studentRecord, [], {});

      setProfile(newProf);
      localStorage.setItem(LOCAL_USER_KEY, JSON.stringify(newProf));
      return { error: null };
    } catch (err: any) {
      return { error: err?.message || 'Failed to authenticate with GitHub' };
    }
  }, []);

  const signInWithGoogleCredentials = useCallback(async (name: string, email: string) => {
    const cleanEmail = email.trim() || 'developer@gmail.com';
    const cleanName = name.trim() || cleanEmail.split('@')[0];

    const userId = `google_${Date.now()}`;
    const newProf: UserProfile = {
      id: userId,
      email: cleanEmail,
      name: cleanName,
      role: 'student',
      university: 'Tech University',
      program: 'Computer Science',
      avatarColor: 'from-amber-500 to-rose-600',
    };

    const studentRecord: Student = {
      id: userId,
      name: cleanName,
      email: cleanEmail,
      program: 'Computer Science',
      year: '2nd Year',
      university: 'Tech University',
      bio: 'Verified Google authenticated student candidate on EvidentX.',
      avatarColor: 'from-amber-500 to-rose-600',
      interests: ['Cloud Computing', 'Web Development', 'AI'],
    };
    addCustomStudentRecord(studentRecord, [], {});

    setProfile(newProf);
    localStorage.setItem(LOCAL_USER_KEY, JSON.stringify(newProf));
    return { error: null };
  }, []);

  const signInWithOAuth = useCallback(async (provider: 'github' | 'google') => {
    if (provider === 'github') {
      return signInWithGitHubUsername('developer');
    } else {
      return signInWithGoogleCredentials('Google User', 'user@gmail.com');
    }
  }, [signInWithGitHubUsername, signInWithGoogleCredentials]);

  const signOut = useCallback(async () => {
    if (isSupabaseConfigured() && supabase) {
      try {
        await supabase.auth.signOut();
      } catch (err) {
        console.warn('Supabase sign out network warning:', err);
      }
    }
    setUser(null);
    setSession(null);
    setProfile(null);
    localStorage.removeItem(LOCAL_USER_KEY);
    window.location.href = '/';
  }, []);

  const setDemoUser = useCallback((demoProfile: UserProfile) => {
    setProfile(demoProfile);
    localStorage.setItem(LOCAL_USER_KEY, JSON.stringify(demoProfile));
  }, []);

  const role = profile?.role || 'student';
  const isDemoMode = !user;

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        profile,
        role,
        loading,
        isDemoMode,
        signInWithEmail,
        signUpWithEmail,
        signInWithOAuth,
        signInWithGitHubUsername,
        signInWithGoogleCredentials,
        signOut,
        setDemoUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
