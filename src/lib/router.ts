import { useState, useEffect, useCallback } from 'react';

// Lightweight hash router: #/path/segment
export function useRouter() {
  const [path, setPath] = useState(() => normalize(window.location.hash));

  useEffect(() => {
    const onChange = () => setPath(normalize(window.location.hash));
    window.addEventListener('hashchange', onChange);
    return () => window.removeEventListener('hashchange', onChange);
  }, []);

  const navigate = useCallback((to: string) => {
    window.location.hash = to.startsWith('#') ? to : '#' + (to.startsWith('/') ? to : '/' + to);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  return { path, navigate };
}

function normalize(hash: string): string {
  if (!hash || hash === '#') return '/';
  // Supabase OAuth callback tokens arrive in hash fragment (#access_token=... or #error=...)
  if (hash.includes('access_token=') || hash.includes('refresh_token=') || hash.includes('error_code=')) {
    return '/';
  }
  return hash.replace(/^#/, '');
}

// Parse segments: "/student/aarav/passport" -> ["student","aarav","passport"]
export function segments(path: string): string[] {
  return path.split('/').filter(Boolean);
}
