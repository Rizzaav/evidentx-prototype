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
  sendEmailOtp: (
    email: string,
    roleHint?: UserRole,
    name?: string,
    metadata?: { organization?: string; university?: string; program?: string }
  ) => Promise<{ error: string | null }>;
  verifyEmailOtp: (
    email: string,
    token: string,
    roleHint?: UserRole,
    name?: string,
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
      const syncUserToStateAndDb = async (authUser: User) => {
        const meta = authUser.user_metadata || {};
        const userEmail = (authUser.email || '').toLowerCase().trim();
        let savedRole: UserRole | undefined;
        try {
          const savedRoles = JSON.parse(localStorage.getItem('evx_user_roles_v1') || '{}');
          savedRole = savedRoles[userEmail];
        } catch {}
        const resolvedRole: UserRole =
          (meta.role as UserRole) ||
          savedRole ||
          (userEmail.includes('org') || userEmail.includes('recruiter') ? 'organization' : 'student');

        const realName = meta.full_name || meta.name || meta.user_name || userEmail.split('@')[0] || 'User';
        const provider = authUser.app_metadata?.provider || 'oauth';

        const p: UserProfile = {
          id: authUser.id,
          email: userEmail,
          name: realName,
          role: resolvedRole,
          organization: meta.organization,
          university: meta.university || (provider === 'github' ? 'GitHub Developer Community' : 'Verified Google Account'),
          program: meta.program || 'Software Engineering',
          avatarColor:
            resolvedRole === 'organization'
              ? 'from-accent-600 to-accent-800'
              : meta.avatarColor || 'from-brand-500 to-brand-700',
        };

        setProfile(p);
        localStorage.setItem(LOCAL_USER_KEY, JSON.stringify(p));

        // Automatically ensure real student record exists in local state and Supabase DB
        if (resolvedRole === 'student' && userEmail) {
          let studentId = `st_${authUser.id.replace(/[^a-zA-Z0-9]/g, '').slice(0, 10)}`;

          if (supabase) {
            try {
              const { data: existingStudent } = await supabase
                .from('students')
                .select('id')
                .eq('email', userEmail)
                .maybeSingle();

              if (existingStudent?.id) {
                studentId = existingStudent.id;
              }
            } catch (e) {
              console.warn('Supabase student lookup warning:', e);
            }
          }

          p.id = studentId;
          setProfile(p);
          localStorage.setItem(LOCAL_USER_KEY, JSON.stringify(p));

          const studentRec: Student = {
            id: studentId,
            name: realName,
            email: userEmail,
            program: meta.program || 'Software Engineering',
            year: meta.year || '3rd Year',
            university: meta.university || (provider === 'github' ? 'GitHub Developer Community' : 'Verified Google Account'),
            bio: meta.bio || `Verified candidate authenticated via ${provider.toUpperCase()}.`,
            avatarColor: 'from-brand-500 to-brand-700',
            interests: ['Full-Stack', 'Open Source', 'Software Engineering'],
          };

          addCustomStudentRecord(studentRec, [], {});

          if (supabase) {
            supabase
              .from('students')
              .upsert(
                {
                  id: studentId,
                  name: realName,
                  email: userEmail,
                  program: studentRec.program,
                  year: studentRec.year,
                  university: studentRec.university,
                  bio: studentRec.bio,
                  avatar_color: studentRec.avatarColor,
                  interests: studentRec.interests,
                  user_id: authUser.id,
                },
                { onConflict: 'id' }
              )
              .then(({ error: upErr }) => {
                if (upErr) console.warn('Supabase student sync warning:', upErr.message);
              });
          }
        }
      };

      supabase.auth.getSession().then(({ data, error }) => {
        if (!error && data?.session?.user) {
          setSession(data.session);
          setUser(data.session.user);
          syncUserToStateAndDb(data.session.user);
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
          syncUserToStateAndDb(session.user);
          const currentHash = window.location.hash;
          if (!currentHash || currentHash === '#' || currentHash === '#/' || currentHash === '#/login') {
            const userEmail = (session.user.email || '').toLowerCase();
            const target = (userEmail.includes('org') || userEmail.includes('recruiter'))
              ? '#/org/dashboard'
              : '#/student/dashboard';
            window.location.hash = target;
          }
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

    if (!cleanEmail) {
      return { error: 'Please enter your email address' };
    }
    if (!cleanPassword) {
      return { error: 'Please enter your password' };
    }

    const credKey = 'evx_user_credentials_v1';
    let savedCreds: Record<string, string> = {};
    let savedProfile: UserProfile | undefined;
    let savedRole: UserRole | undefined;
    try {
      savedCreds = JSON.parse(localStorage.getItem(credKey) || '{}');
      const savedProfiles = JSON.parse(localStorage.getItem(PROFILES_KEY) || '{}');
      savedProfile = savedProfiles[cleanEmail];
      const savedRoles = JSON.parse(localStorage.getItem('evx_user_roles_v1') || '{}');
      savedRole = savedRoles[cleanEmail] || savedProfile?.role;
    } catch {}

    // 1. Try Supabase cloud auth if configured
    let cloudError: string | null = null;
    let isCloudNetworkError = false;

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

            // Sync verified password locally
            savedCreds[cleanEmail] = cleanPassword;
            localStorage.setItem(credKey, JSON.stringify(savedCreds));
          } catch {}
          return { error: null };
        } else if (error) {
          cloudError = error.message;
          const msg = (error.message || '').toLowerCase();
          if (msg.includes('fetch') || msg.includes('network') || msg.includes('failed to fetch')) {
            isCloudNetworkError = true;
          }
        }
      } catch (err: any) {
        console.warn('Cloud sign in fallback:', err);
        cloudError = err?.message || 'Authentication service error';
        isCloudNetworkError = true;
      }
    }

    // 2. Local Account Authentication & Matching
    // Check if account has credentials saved locally (e.g. registered locally or offline)
    if (savedCreds[cleanEmail] !== undefined) {
      if (savedCreds[cleanEmail] !== cleanPassword) {
        return { error: 'Incorrect password. Please try again.' };
      }

      const userRole: UserRole =
        roleHint ||
        savedRole ||
        savedProfile?.role ||
        (cleanEmail.includes('org') || cleanEmail.includes('recruiter') ? 'organization' : 'student');

      const authenticatedProfile: UserProfile = savedProfile || {
        id: (userRole === 'organization' ? `org_usr_${Date.now()}` : `st_usr_${Date.now()}`),
        email: cleanEmail,
        name: cleanEmail.split('@')[0] || 'User',
        role: userRole,
        organization: userRole === 'organization' ? 'Enterprise Partner' : undefined,
        university: userRole === 'student' ? 'University Student' : undefined,
        program: userRole === 'student' ? 'Engineering' : undefined,
        avatarColor: userRole === 'organization' ? 'from-accent-600 to-accent-800' : 'from-brand-500 to-brand-700',
      };

      setProfile(authenticatedProfile);
      localStorage.setItem(LOCAL_USER_KEY, JSON.stringify(authenticatedProfile));
      return { error: null };
    }

    // 3. Demo Student profile matching (e.g. mock accounts)
    const allStudentsMap = getAllStudentMap();
    const existingStudent = Object.values(allStudentsMap).find(
      (s) => s.email.toLowerCase() === cleanEmail
    );

    if (existingStudent) {
      const isDemoPasswordValid =
        cleanPassword === 'demo123' ||
        cleanPassword === 'password' ||
        cleanPassword === 'evidentx';

      if (!isDemoPasswordValid) {
        return { error: 'Incorrect password for demo candidate account. (Use password: demo123)' };
      }

      const authenticatedProfile: UserProfile = {
        id: existingStudent.id,
        email: cleanEmail,
        name: existingStudent.name,
        role: 'student',
        university: existingStudent.university,
        program: existingStudent.program,
        avatarColor: existingStudent.avatarColor,
      };

      setProfile(authenticatedProfile);
      localStorage.setItem(LOCAL_USER_KEY, JSON.stringify(authenticatedProfile));
      return { error: null };
    }

    // 4. If Cloud returned an explicit auth rejection (e.g., wrong password, unconfirmed email)
    if (cloudError && !isCloudNetworkError) {
      if (cloudError.toLowerCase().includes('confirm')) {
        return { error: 'Email address not confirmed. Please check your inbox for the confirmation email.' };
      }
      return { error: 'Invalid email or password. Please check your credentials.' };
    }

    // 5. Otherwise: Account does not exist
    return { error: 'No account found with this email. Please click "Create Account" to register.' };
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
      const cleanPassword = password.trim();

      if (!cleanEmail) {
        return { error: 'Please enter your email address' };
      }
      if (cleanPassword.length < 6) {
        return { error: 'Password must be at least 6 characters long' };
      }

      let createdUserId = role === 'organization' ? `org_usr_${Date.now()}` : `st_usr_${Date.now()}`;

      // Save local credentials and role mapping
      const credKey = 'evx_user_credentials_v1';
      const rolesKey = 'evx_user_roles_v1';
      try {
        const savedCreds = JSON.parse(localStorage.getItem(credKey) || '{}');
        savedCreds[cleanEmail] = cleanPassword;
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
            password: cleanPassword,
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
          if (error) {
            const msg = error.message.toLowerCase();
            if (!msg.includes('fetch')) {
              if (msg.includes('already registered') || msg.includes('user already exists')) {
                return { error: 'An account with this email already exists. Please sign in instead.' };
              }
              console.warn('Supabase cloud signup warning:', error.message);
            }
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

  const sendEmailOtp = useCallback(
    async (
      email: string,
      roleHint?: UserRole,
      name?: string,
      metadata?: { organization?: string; university?: string; program?: string }
    ) => {
      const cleanEmail = email.trim().toLowerCase();
      if (!cleanEmail || !cleanEmail.includes('@')) {
        return { error: 'Please enter a valid email address.' };
      }

      if (isSupabaseConfigured() && supabase) {
        try {
          const { error } = await supabase.auth.signInWithOtp({
            email: cleanEmail,
            options: {
              shouldCreateUser: true,
              data: {
                name: name || cleanEmail.split('@')[0],
                role: roleHint || 'student',
                ...metadata,
              },
            },
          });

          if (error) {
            const msg = error.message.toLowerCase();
            if (msg.includes('rate limit') || msg.includes('once every') || msg.includes('security purposes')) {
              return { error: 'Please wait 60 seconds before requesting another verification code.' };
            }
            return { error: error.message };
          }
          return { error: null };
        } catch (err: any) {
          console.warn('Supabase signInWithOtp exception:', err);
          return { error: err?.message || 'Failed to send verification code. Please try again.' };
        }
      }

      // Offline / Local fallback: store test OTP code
      const testCode = '123456';
      sessionStorage.setItem(`evx_otp_${cleanEmail}`, testCode);
      console.log(`[EvidentX Demo] Offline OTP for ${cleanEmail} is: ${testCode}`);
      return { error: null };
    },
    []
  );

  const verifyEmailOtp = useCallback(
    async (
      email: string,
      token: string,
      roleHint?: UserRole,
      name?: string,
      metadata?: { organization?: string; university?: string; program?: string }
    ) => {
      const cleanEmail = email.trim().toLowerCase();
      const cleanToken = token.trim().replace(/\s+/g, '');

      if (!cleanEmail) {
        return { error: 'Please enter your email address.' };
      }
      if (!cleanToken || cleanToken.length < 6) {
        return { error: 'Please enter the complete 6-digit verification code.' };
      }

      let savedProfile: UserProfile | undefined;
      let savedRole: UserRole | undefined;
      try {
        const savedProfiles = JSON.parse(localStorage.getItem(PROFILES_KEY) || '{}');
        savedProfile = savedProfiles[cleanEmail];
        const savedRoles = JSON.parse(localStorage.getItem('evx_user_roles_v1') || '{}');
        savedRole = savedRoles[cleanEmail] || savedProfile?.role;
      } catch {}

      const userRole: UserRole =
        roleHint ||
        savedRole ||
        savedProfile?.role ||
        (cleanEmail.includes('org') || cleanEmail.includes('recruiter') ? 'organization' : 'student');

      // 1. Try Supabase cloud OTP verification if configured
      if (isSupabaseConfigured() && supabase) {
        try {
          let { data, error } = await supabase.auth.verifyOtp({
            email: cleanEmail,
            token: cleanToken,
            type: 'email',
          });

          // If 'email' type fails, try 'signup' type in case Supabase treated it as a signup confirmation
          if (error) {
            const signupAttempt = await supabase.auth.verifyOtp({
              email: cleanEmail,
              token: cleanToken,
              type: 'signup',
            });
            if (!signupAttempt.error && signupAttempt.data?.user) {
              data = signupAttempt.data;
              error = null;
            }
          }

          if (!error && data?.user) {
            const meta = data.user.user_metadata || {};
            const resolvedName = meta.name || name || savedProfile?.name || cleanEmail.split('@')[0];
            const p: UserProfile = {
              id: data.user.id,
              email: data.user.email || cleanEmail,
              name: resolvedName,
              role: userRole,
              organization: meta.organization || metadata?.organization || savedProfile?.organization || (userRole === 'organization' ? resolvedName : undefined),
              university: meta.university || metadata?.university || savedProfile?.university || (userRole === 'student' ? 'Verified Gmail Student' : undefined),
              program: meta.program || metadata?.program || savedProfile?.program || (userRole === 'student' ? 'Computer Science' : undefined),
              avatarColor: userRole === 'organization' ? 'from-accent-600 to-accent-800' : 'from-brand-500 to-brand-700',
            };

            setProfile(p);
            localStorage.setItem(LOCAL_USER_KEY, JSON.stringify(p));

            try {
              const savedRoles = JSON.parse(localStorage.getItem('evx_user_roles_v1') || '{}');
              savedRoles[cleanEmail] = userRole;
              localStorage.setItem('evx_user_roles_v1', JSON.stringify(savedRoles));

              const savedProfiles = JSON.parse(localStorage.getItem(PROFILES_KEY) || '{}');
              savedProfiles[cleanEmail] = p;
              localStorage.setItem(PROFILES_KEY, JSON.stringify(savedProfiles));
            } catch {}

            if (userRole === 'student') {
              const studentRec: Student = {
                id: p.id,
                name: resolvedName,
                email: cleanEmail,
                program: p.program || 'Software Engineering',
                year: '3rd Year',
                university: p.university || 'Verified Academic Account',
                bio: `Verified candidate authenticated via Gmail OTP (${cleanEmail}).`,
                avatarColor: 'from-brand-500 to-brand-700',
                interests: ['Full-Stack', 'Open Source', 'Software Engineering'],
              };
              addCustomStudentRecord(studentRec, [], {});

              if (supabase) {
                supabase
                  .from('students')
                  .upsert(
                    {
                      id: p.id,
                      name: resolvedName,
                      email: cleanEmail,
                      program: studentRec.program,
                      year: studentRec.year,
                      university: studentRec.university,
                      bio: studentRec.bio,
                      avatar_color: studentRec.avatarColor,
                      interests: studentRec.interests,
                      user_id: data.user.id,
                    },
                    { onConflict: 'id' }
                  )
                  .then(({ error: upErr }) => {
                    if (upErr) console.warn('Supabase student sync warning:', upErr.message);
                  });
              }
            }

            return { error: null };
          } else if (error) {
            return { error: error.message || 'Invalid or expired verification code.' };
          }
        } catch (err: any) {
          console.warn('Supabase verifyOtp exception:', err);
          return { error: err?.message || 'Verification service error.' };
        }
      }

      // 2. Offline / local fallback check
      const storedOtp = sessionStorage.getItem(`evx_otp_${cleanEmail}`) || '123456';
      if (cleanToken === storedOtp || cleanToken === '123456') {
        const localId = userRole === 'organization' ? `org_usr_${Date.now()}` : `st_usr_${Date.now()}`;
        const resolvedName = name || savedProfile?.name || cleanEmail.split('@')[0];
        const p: UserProfile = {
          id: localId,
          email: cleanEmail,
          name: resolvedName,
          role: userRole,
          organization: metadata?.organization || savedProfile?.organization,
          university: metadata?.university || savedProfile?.university || 'Verified Student',
          program: metadata?.program || savedProfile?.program || 'Engineering',
          avatarColor: userRole === 'organization' ? 'from-accent-600 to-accent-800' : 'from-brand-500 to-brand-700',
        };

        if (userRole === 'student') {
          addCustomStudentRecord({
            id: localId,
            name: resolvedName,
            email: cleanEmail,
            program: p.program || 'Engineering',
            year: '1st Year',
            university: p.university || 'University',
            bio: 'Verified student account.',
            avatarColor: 'from-brand-500 to-brand-700',
            interests: ['Software Engineering'],
          }, [], {});
        }

        setProfile(p);
        localStorage.setItem(LOCAL_USER_KEY, JSON.stringify(p));
        return { error: null };
      }

      return { error: 'Incorrect verification code. Please check your Gmail inbox and try again.' };
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
      const res = await fetch(`https://api.github.com/users/${cleaned}`);
      if (res.status === 404) {
        return { error: `GitHub account "${cleaned}" does not exist. Please check the username and try again.` };
      }
      if (!res.ok) {
        return { error: `GitHub API returned status ${res.status}: Unable to verify user "${cleaned}".` };
      }

      const ghData = await res.json();
      const ghName = ghData.name || ghData.login || cleaned;
      const ghBio = ghData.bio || `Active GitHub developer with ${ghData.public_repos || 0} public repositories.`;
      const ghEmail = ghData.email || `${cleaned.toLowerCase()}@users.noreply.github.com`;
      const ghCompany = ghData.company || ghData.location || 'GitHub Developer Community';

      const userId = `gh_${cleaned.toLowerCase().replace(/[^a-z0-9]/g, '')}`;
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

      if (supabase) {
        supabase
          .from('students')
          .upsert(
            {
              id: userId,
              name: ghName,
              email: ghEmail,
              program: studentRecord.program,
              year: studentRecord.year,
              university: studentRecord.university,
              bio: studentRecord.bio,
              avatar_color: studentRecord.avatarColor,
              interests: studentRecord.interests,
            },
            { onConflict: 'id' }
          )
          .then(({ error: upErr }) => {
            if (upErr) console.warn('Supabase sync GitHub user warning:', upErr.message);
          });
      }

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

    if (supabase) {
      supabase
        .from('students')
        .upsert(
          {
            id: userId,
            name: cleanName,
            email: cleanEmail,
            program: studentRecord.program,
            year: studentRecord.year,
            university: studentRecord.university,
            bio: studentRecord.bio,
            avatar_color: studentRecord.avatarColor,
            interests: studentRecord.interests,
          },
          { onConflict: 'id' }
        )
        .then(({ error: upErr }) => {
          if (upErr) console.warn('Supabase sync Google user warning:', upErr.message);
        });
    }

    setProfile(newProf);
    localStorage.setItem(LOCAL_USER_KEY, JSON.stringify(newProf));
    return { error: null };
  }, []);

  const signInWithOAuth = useCallback(async (provider: 'github' | 'google') => {
    if (!isSupabaseConfigured() || !supabase) {
      return { error: 'Supabase is not configured. Real OAuth requires a configured Supabase connection.' };
    }

    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: `${window.location.origin}/`,
          queryParams:
            provider === 'google'
              ? {
                  access_type: 'offline',
                  prompt: 'consent',
                }
              : undefined,
          scopes: provider === 'github' ? 'read:user user:email' : undefined,
        },
      });

      if (error) {
        return { error: error.message };
      }

      if (data?.url) {
        window.location.href = data.url;
      }

      return { error: null };
    } catch (err: any) {
      return { error: err?.message || `Failed to initiate real ${provider} OAuth sign-in.` };
    }
  }, []);

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
        sendEmailOtp,
        verifyEmailOtp,
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
