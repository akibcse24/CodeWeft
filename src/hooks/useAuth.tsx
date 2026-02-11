import { createContext, useContext, useEffect, useState, useMemo, useCallback, ReactNode } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { queryClient } from "@/lib/query-client";

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signUp: (email: string, password: string, displayName?: string) => Promise<{ error: Error | null }>;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signInWithGithub: () => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (mounted) {
        console.log("[Auth] Initial session check complete:", !!session);
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
      }
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (mounted) {
        console.log("[Auth] State change:", _event, !!session);
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const signUp = async (email: string, password: string, displayName?: string) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { display_name: displayName },
      },
    });
    return { error: error as Error | null };
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { error: error as Error | null };
  };

  const signInWithGithub = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "github",
      options: {
        redirectTo: `${window.location.origin}/`,
        scopes: "repo workflow gist user write:repo_hook delete_repo",
      },
    });
    return { error: error as Error | null };
  };

  const signOut = useCallback(async () => {
    console.log("[Auth] signOut called");

    // Don't await Supabase call — it may hang. Let it run in background.
    supabase.auth.signOut()
      .then(() => console.log("[Auth] Server-side signOut succeeded"))
      .catch((err) => console.warn("[Auth] Server-side signOut failed:", err));

    // Immediately clear local state (don't wait for server)
    console.log("[Auth] Clearing local state...");
    setUser(null);
    setSession(null);

    // Clear all cached queries so stale data doesn't persist
    console.log("[Auth] Clearing query cache...");
    queryClient.clear();

    // Clear Supabase session from localStorage to prevent auto-signin
    console.log("[Auth] Clearing Supabase session from localStorage...");
    localStorage.removeItem('sb-ukboercbnitgrhpflcbb-auth-token');

    // Redirect to auth page
    console.log("[Auth] Redirecting to /auth...");
    window.location.href = "/auth";
  }, []);

  // Memoize the context value to prevent unnecessary re-renders
  const value = useMemo(() => ({
    user, session, loading, signUp, signIn, signInWithGithub, signOut
  }), [user, session, loading, signOut]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
