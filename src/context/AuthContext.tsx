import { createContext, useContext, useEffect, useState } from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

interface AuthContextValue {
  session: Session | null;
  user: User | null;
  loading: boolean;
  /** True only when Supabase user_roles table confirms role = 'admin'. */
  isAdmin: boolean;
  /** Still fetching role from DB — treat as loading. */
  isAdminLoading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue>({
  session: null,
  user: null,
  loading: true,
  isAdmin: false,
  isAdminLoading: true,
  signOut: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isAdminLoading, setIsAdminLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Fetch admin role from Supabase user_roles table whenever user changes.
  // RLS ensures each user can only read their own role row.
  useEffect(() => {
    const userId = session?.user?.id;
    if (!userId) {
      setIsAdmin(false);
      setIsAdminLoading(false);
      return;
    }
    setIsAdminLoading(true);
    supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', userId)
      .maybeSingle()
      .then(({ data }) => {
        setIsAdmin(data?.role === 'admin');
        setIsAdminLoading(false);
      });
  }, [session?.user?.id]);

  async function signOut() {
    await supabase.auth.signOut();
    // Clear Supabase session cache from localStorage
    Object.keys(localStorage).forEach(key => {
      if (key.startsWith('sb-')) localStorage.removeItem(key);
    });
    setIsAdmin(false);
  }

  return (
    <AuthContext.Provider value={{ session, user: session?.user ?? null, loading, isAdmin, isAdminLoading, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
