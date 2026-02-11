import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { logger } from "@/lib/logger";
import { toast } from "sonner";
import { useEffect, useMemo } from "react";
import { db } from "@/lib/db";

interface GitHubSettings {
  id: string;
  user_id: string;
  github_token: string | null;
  github_username: string | null;
  avatar_url: string | null;
  solutions_repo: string | null;
  github_installation_id: string | null;
  created_at: string;
  updated_at: string;
}

interface GitHubUser {
  login: string;
  avatar_url: string;
  name: string;
}

interface TestConnectionResult {
  valid: boolean;
  user?: GitHubUser;
  error?: string;
}

interface ContributionData {
  total: number;
  contributions: Array<{
    date: string;
    contributionCount: number;
  }>;
}

interface GitHubEvent {
  id: string;
  type: string;
  created_at: string;
  repo: {
    name: string;
  };
  payload: {
    commits?: Array<{
      message: string;
      sha: string;
    }>;
  };
}

export interface GitHubRepo {
  name: string;
  stargazers_count: number;
  forks_count: number;
  html_url: string;
  language: string | null;
}

export function useGitHub() {
  const { user, session } = useAuth();
  const queryClient = useQueryClient();


  // Fetch settings - Check Dexie first, then server
  const {
    data: settings,
    isLoading: settingsLoading,
    error: settingsError,
  } = useQuery({
    queryKey: ["github-settings"],
    queryFn: async () => {
      console.log("[GitHub] Fetching settings for user:", user?.id);
      if (!user) return null;

      // 1. Try Dexie first
      const local = await db.github_settings.where("user_id").equals(user.id).first();
      console.log("[GitHub] Local Dexie settings found:", !!local);

      // 2. Fetch from Edge Function
      try {
        const { data: cloud, error } = await supabase.functions.invoke("github-api?action=get-settings", {
          method: "GET",
          headers: { "Content-Type": "application/json" }
        });

        if (error) {
          console.error("[GitHub] Cloud fetch error:", error);
          // Fallback to local if server is down
          return local as GitHubSettings || null;
        }

        // 3. Reconcile: If cloud is newer or different, update local
        if (cloud) {
          if (!local || cloud.updated_at > (local.updated_at || "")) {
            console.log("[GitHub] Cloud settings are newer, updating local cache");
            await db.github_settings.put({ ...cloud, user_id: user.id } as any);
          }
          return cloud as GitHubSettings;
        }

        return local as GitHubSettings || null;
      } catch (err) {
        console.warn("[GitHub] Cloud fetch failed, using local fallback:", err);
        return local as GitHubSettings || null;
      }
    },
    enabled: !!user,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  // Stabilize isConnected to prevent flickering during background reloads
  const isConnected = useMemo(() => {
    if (settingsLoading && !settings) return false; // Initial load
    return !!settings?.github_token && !!settings?.github_username;
  }, [settings, settingsLoading]);

  // Background Sync Effect: If local exists but cloud doesn't, push local to cloud
  useEffect(() => {
    let syncInProgress = false;

    const syncToCloud = async () => {
      if (!user || settingsLoading || !settings || syncInProgress) return;

      // Only push if we have a token locally but cloud might be out of sync (no cloud id)
      if (settings.github_token && settings.github_username && !settings.id) {
        syncInProgress = true;
        console.log("[GitHub] Background sync: Pushing local settings to cloud...");
        try {
          await supabase.functions.invoke("github-api?action=save", {
            body: {
              github_token: settings.github_token,
              github_username: settings.github_username,
              avatar_url: settings.avatar_url,
              solutions_repo: settings.solutions_repo
            }
          });
          // Update query cache to mark it as synced (gave us an ID)
          queryClient.invalidateQueries({ queryKey: ["github-settings"] });
        } catch (e) {
          console.error("[GitHub] Background push failed:", e);
        } finally {
          syncInProgress = false;
        }
      }
    };

    syncToCloud();
  }, [user, settings, settingsLoading, queryClient]);

  if (settingsError) {
    console.error("[GitHub] Global query error:", settingsError);
  }

  // Manual sync token from session — via Edge Function
  const syncFromSession = async () => {
    if (!session?.provider_token || !user) {
      toast.error("No GitHub session found to sync.");
      return;
    }

    try {
      logger.info("[GitHub] Syncing GitHub token via Edge Function...");

      const { data, error } = await supabase.functions.invoke("github-api?action=save", {
        body: {
          github_token: session.provider_token,
          github_username: "session_user", // Edge function will refetch anyway if test is valid
        }
      });

      if (error) throw error;

      logger.info("[GitHub] Token successfully synced from session");
      queryClient.invalidateQueries({ queryKey: ["github-settings"] });
      toast.success("GitHub account synced successfully");
    } catch (e) {
      logger.error("[GitHub] Failed to sync GitHub token from session:", e);
      toast.error("Failed to sync from session");
    }
  };

  // Test connection with a token — via Edge Function
  const testConnection = useMutation({
    mutationFn: async (token: string): Promise<TestConnectionResult> => {
      try {
        const { data, error } = await supabase.functions.invoke("github-api?action=test", {
          body: { token }
        });

        if (error) throw error;

        return data as TestConnectionResult;
      } catch (error) {
        logger.error("Test connection error:", error);
        throw error;
      }
    },
  });

  const saveSettings = useMutation({
    mutationFn: async (newSettings: {
      github_token: string;
      github_username: string;
      avatar_url?: string;
      solutions_repo?: string;
    }) => {
      console.log("[GitHub] Starting saveSettings via Edge Function for:", newSettings.github_username);
      if (!user) throw new Error("Not authenticated");

      try {
        // 1. Save to local Dexie immediately for responsiveness
        console.log("[GitHub] Saving to local Dexie...");

        // Ensure we have an ID for Dexie PK
        const existing = await db.github_settings.where("user_id").equals(user.id).first();
        const idToUse = existing?.id || (settings as any)?.id || crypto.randomUUID();

        await db.github_settings.put({
          id: idToUse,
          user_id: user.id,
          ...newSettings,
          updated_at: new Date().toISOString(),
        } as any);

        // 2. Clear query cache to reflect local change immediately
        queryClient.setQueryData(["github-settings"], (old: any) => ({
          ...old,
          ...newSettings,
          user_id: user.id
        }));

        // 3. Attempt cloud save in background/parallel
        const { data, error } = await supabase.functions.invoke("github-api?action=save", {
          body: newSettings
        });

        if (error) {
          console.warn("[GitHub] Cloud save deferred (will retry in background):", error);
        }

        return data;
      } catch (err) {
        console.error("[GitHub] Save failed with exception:", err);
        throw err;
      }
    },
    onSuccess: () => {
      console.log("[GitHub] Invalidate queries starting...");
      queryClient.invalidateQueries({ queryKey: ["github-settings"] });
    },
  });

  // Disconnect GitHub
  const disconnect = useMutation({
    mutationFn: async () => {
      console.log("[GitHub] Disconnecting via Edge Function...");
      if (!user) throw new Error("Not authenticated");

      try {
        // 1. Clear local Dexie immediately
        await db.github_settings.where("user_id").equals(user.id).delete();
        queryClient.setQueryData(["github-settings"], null);

        // 2. Call cloud disconnect
        const { error } = await supabase.functions.invoke("github-api?action=disconnect", {
          method: "POST"
        });

        if (error) {
          console.error("[GitHub] Disconnect error:", error);
          throw error;
        }
      } catch (error) {
        // Log error but allow mutation to proceed so we can clear local state
        console.error("[GitHub] Server-side disconnect failed:", error);
      }
    },
    onSuccess: () => {
      // Force clear the query data immediately
      queryClient.setQueryData(["github-settings"], null);

      // Invalidate all related queries
      queryClient.invalidateQueries({ queryKey: ["github-settings"] });
      queryClient.invalidateQueries({ queryKey: ["github-contributions"] });
      queryClient.invalidateQueries({ queryKey: ["github-events"] });
      queryClient.invalidateQueries({ queryKey: ["github-repositories"] });
    },
  });


  // Fetch contributions — via Edge Function
  const {
    data: contributions,
    isLoading: contributionsLoading,
    refetch: refetchContributions,
  } = useQuery({
    queryKey: ["github-contributions", user?.id],
    queryFn: async (): Promise<ContributionData | null> => {
      if (!isConnected) return null;

      try {
        const { data, error } = await supabase.functions.invoke("github-api?action=contributions");
        if (error) throw error;
        return data as ContributionData;
      } catch (error) {
        logger.error("Contributions error:", error);
        return null;
      }
    },
    enabled: isConnected,
  });

  // Fetch recent events — via Edge Function
  const {
    data: events,
    isLoading: eventsLoading,
    refetch: refetchEvents,
  } = useQuery({
    queryKey: ["github-events", user?.id],
    queryFn: async (): Promise<GitHubEvent[] | null> => {
      if (!isConnected) return null;

      try {
        const { data, error } = await supabase.functions.invoke("github-api?action=events");
        if (error) throw error;
        return data as GitHubEvent[];
      } catch (error) {
        logger.error("Events error:", error);
        return null;
      }
    },
    enabled: isConnected,
  });

  // Fetch all repositories — via Edge Function
  const {
    data: repositories,
    isLoading: repositoriesLoading,
    refetch: refetchRepositories,
  } = useQuery({
    queryKey: ["github-repositories", user?.id],
    queryFn: async (): Promise<GitHubRepo[] | null> => {
      if (!isConnected) return null;

      try {
        const { data, error } = await supabase.functions.invoke("github-api?action=repos");
        if (error) {
          console.error("[GitHub] Repositories fetch error:", error);
          throw error;
        }
        return data as GitHubRepo[];
      } catch (error) {
        logger.error("[GitHub] Repositories exception:", error);
        // Distinguish between 401 (invalid token) and others
        if (error instanceof Error && error.message.includes('401')) {
          toast.error("GitHub connection unauthorized. Please reconnect in Settings.");
        }
        return null;
      }
    },
    enabled: isConnected,
  });


  return {
    settings,
    settingsLoading,
    settingsError,
    isConnected,
    testConnection,
    saveSettings,
    disconnect,
    contributions,
    contributionsLoading,
    refetchContributions,
    events,
    eventsLoading,
    refetchEvents,
    repositories,
    repositoriesLoading,
    refetchRepositories,
    syncFromSession,
  };
}

// Hook for fetching repo-specific data — direct GitHub API calls
export function useGitHubRepo(githubUrl: string | null | undefined) {
  const { user } = useAuth();

  // Get the GitHub token from settings
  const { data: settings } = useQuery({
    queryKey: ["github-settings"],
    enabled: !!user,
  });
  const isConnected = !!(settings as GitHubSettings | null)?.github_token && !!(settings as GitHubSettings | null)?.github_username;
  const token = (settings as GitHubSettings | null)?.github_token;

  const parseGitHubUrl = (url: string) => {
    const match = url.match(/github\.com\/([^/]+)\/([^/]+)/);
    if (match) {
      return { owner: match[1], repo: match[2].replace(/\.git$/, "") };
    }
    return null;
  };

  const parsed = githubUrl ? parseGitHubUrl(githubUrl) : null;


  // Fetch repo stats — via Edge Function
  const {
    data: repoStats,
    isLoading: repoLoading,
    error: repoError,
    refetch: refetchRepo,
  } = useQuery({
    queryKey: ["github-repo", parsed?.owner, parsed?.repo],
    queryFn: async () => {
      if (!parsed) return null;
      const { data, error } = await supabase.functions.invoke(
        `github-api?action=repo&owner=${parsed.owner}&repo=${parsed.repo}`
      );
      if (error) throw error;
      return data;
    },
    enabled: !!parsed && !!user && !!isConnected,
  });

  // Fetch commits — via Edge Function
  const {
    data: commits,
    isLoading: commitsLoading,
    refetch: refetchCommits,
  } = useQuery({
    queryKey: ["github-commits", parsed?.owner, parsed?.repo],
    queryFn: async () => {
      if (!parsed) return null;
      const { data, error } = await supabase.functions.invoke(
        `github-api?action=commits&owner=${parsed.owner}&repo=${parsed.repo}&limit=5`
      );
      if (error) throw error;
      return data;
    },
    enabled: !!parsed && !!user && !!isConnected,
  });

  return {
    repoStats,
    repoLoading,
    repoError,
    refetchRepo,
    commits,
    commitsLoading,
    refetchCommits,
    parsed,
  };
}

// Hook for importing DSA solutions — direct GitHub API calls
export function useGitHubSolutions() {
  const { user } = useAuth();

  // Get the GitHub settings (token + solutions_repo)
  const { data: settings } = useQuery({
    queryKey: ["github-settings"],
    enabled: !!user,
  });
  const isConnected = !!(settings as GitHubSettings | null)?.github_token && !!(settings as GitHubSettings | null)?.github_username;
  const ghSettings = settings as GitHubSettings | null;

  const fetchSolutions = useMutation({
    mutationFn: async (repo?: string) => {
      if (!isConnected) throw new Error("GitHub not connected");

      const { data, error } = await supabase.functions.invoke(
        `github-api?action=solutions${repo ? `&repo=${repo}` : ""}`
      );
      if (error) throw error;
      return data;
    },
  });

  return {
    fetchSolutions,
  };
}
