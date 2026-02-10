import { useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase, safeInvoke } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { logger } from "@/lib/logger";

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

  // Fetch GitHub settings
  const {
    data: settings,
    isLoading: settingsLoading,
    error: settingsError,
  } = useQuery({
    queryKey: ["github-settings", user?.id],
    queryFn: async () => {
      if (!user) return null;

      const { data, error } = await supabase
        .from("github_settings")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();

      if (error) throw error;
      return data as GitHubSettings | null;
    },
    enabled: !!user,
  });

  // Sync token from session if available (OAuth)
  useEffect(() => {
    const syncToken = async () => {
      if (session?.provider_token && user && !settingsLoading) {
        // If we don't have a token or it's different, sync it
        if (!settings?.github_token || settings.github_token !== session.provider_token) {
          try {
            logger.info("Syncing GitHub token from session...");
            const { data: rawData, error } = await safeInvoke("github-api?action=test", {
              body: { token: session.provider_token },
              method: "POST",
            });
            const data = rawData as TestConnectionResult;

            if (data?.valid) {
              await supabase
                .from("github_settings")
                .upsert({
                  user_id: user.id,
                  github_token: session.provider_token,
                  github_username: data.user?.login,
                  avatar_url: data.user?.avatar_url,
                  updated_at: new Date().toISOString(),
                });

              queryClient.invalidateQueries({ queryKey: ["github-settings"] });
              logger.info("GitHub token successfully synced from session");
            }
          } catch (e) {
            logger.error("Failed to sync GitHub token from session:", e);
          }
        }
      }
    };

    syncToken();
  }, [session, user, settings, settingsLoading, queryClient]);

  // Test connection with a token
  const testConnection = useMutation({
    mutationFn: async (token: string): Promise<TestConnectionResult> => {
      const { data, error } = await supabase.functions.invoke("github-api?action=test", {
        body: { token },
        method: "POST",
      });

      if (error) throw error;
      return data;
    },
  });

  // Save GitHub settings
  const saveSettings = useMutation({
    mutationFn: async (newSettings: {
      github_token: string;
      github_username: string;
      avatar_url?: string;
      solutions_repo?: string;
    }) => {
      if (!user) throw new Error("Not authenticated");

      const { data: existing } = await supabase
        .from("github_settings")
        .select("id")
        .eq("user_id", user.id)
        .maybeSingle();

      if (existing) {
        const { data, error } = await supabase
          .from("github_settings")
          .update({
            ...newSettings,
            updated_at: new Date().toISOString(),
          })
          .eq("user_id", user.id)
          .select()
          .single();

        if (error) throw error;
        return data;
      } else {
        const { data, error } = await supabase
          .from("github_settings")
          .insert({
            user_id: user.id,
            ...newSettings,
          })
          .select()
          .single();

        if (error) throw error;
        return data;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["github-settings"] });
    },
  });

  // Disconnect GitHub
  const disconnect = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("Not authenticated");

      const { error } = await supabase
        .from("github_settings")
        .delete()
        .eq("user_id", user.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["github-settings"] });
      queryClient.invalidateQueries({ queryKey: ["github-contributions"] });
      queryClient.invalidateQueries({ queryKey: ["github-events"] });
    },
  });

  // Fetch contributions
  const {
    data: contributions,
    isLoading: contributionsLoading,
    refetch: refetchContributions,
  } = useQuery({
    queryKey: ["github-contributions", user?.id],
    queryFn: async (): Promise<ContributionData | null> => {
      const { data, error } = await safeInvoke("github-api?action=contributions", {
        method: "POST",
        body: {},
      });

      if (error) {
        logger.error("Contributions error:", error);
        return null;
      }
      return data as ContributionData;
    },
    enabled: !!settings?.github_token && !!settings?.github_username,
  });

  // Fetch recent events (commits, PRs, etc.)
  const {
    data: events,
    isLoading: eventsLoading,
    refetch: refetchEvents,
  } = useQuery({
    queryKey: ["github-events", user?.id],
    queryFn: async (): Promise<GitHubEvent[] | null> => {
      const { data, error } = await safeInvoke("github-api?action=events", {
        method: "POST",
        body: {},
      });

      if (error) {
        logger.error("Events error:", error);
        return null;
      }
      return data as GitHubEvent[];
    },
    enabled: !!settings?.github_token && !!settings?.github_username,
  });

  // Fetch all repositories
  const {
    data: repositories,
    isLoading: repositoriesLoading,
    refetch: refetchRepositories,
  } = useQuery({
    queryKey: ["github-repositories", user?.id],
    queryFn: async (): Promise<GitHubRepo[] | null> => {
      const { data, error } = await safeInvoke("github-api?action=repos", {
        method: "POST",
        body: {},
      });

      if (error) {
        logger.error("Repositories error:", error);
        return null;
      }
      return data as GitHubRepo[];
    },
    enabled: !!settings?.github_token && !!settings?.github_username,
  });

  const isConnected = !!settings?.github_token && !!settings?.github_username;

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
  };
}

// Hook for fetching repo-specific data
export function useGitHubRepo(githubUrl: string | null | undefined) {
  const { user } = useAuth();

  const parseGitHubUrl = (url: string) => {
    const match = url.match(/github\.com\/([^/]+)\/([^/]+)/);
    if (match) {
      return { owner: match[1], repo: match[2].replace(/\.git$/, "") };
    }
    return null;
  };

  const parsed = githubUrl ? parseGitHubUrl(githubUrl) : null;

  // Fetch repo stats
  const {
    data: repoStats,
    isLoading: repoLoading,
    error: repoError,
    refetch: refetchRepo,
  } = useQuery({
    queryKey: ["github-repo", parsed?.owner, parsed?.repo],
    queryFn: async () => {
      if (!parsed) return null;

      const { data, error } = await safeInvoke(
        `github-api?action=repo&owner=${parsed.owner}&repo=${parsed.repo}`,
        { method: "POST", body: {} }
      );

      if (error) throw error;
      return data;
    },
    enabled: !!parsed && !!user,
  });

  // Fetch commits
  const {
    data: commits,
    isLoading: commitsLoading,
    refetch: refetchCommits,
  } = useQuery({
    queryKey: ["github-commits", parsed?.owner, parsed?.repo],
    queryFn: async () => {
      if (!parsed) return null;

      const { data, error } = await safeInvoke(
        `github-api?action=commits&owner=${parsed.owner}&repo=${parsed.repo}&limit=5`,
        { method: "POST", body: {} }
      );

      if (error) throw error;
      return data;
    },
    enabled: !!parsed && !!user,
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

// Hook for importing DSA solutions
export function useGitHubSolutions() {
  const { user } = useAuth();

  const fetchSolutions = useMutation({
    mutationFn: async (repo?: string) => {
      const url = repo
        ? `github-api?action=solutions&repo=${encodeURIComponent(repo)}`
        : "github-api?action=solutions";

      const { data, error } = await safeInvoke(url, {
        method: "POST",
        body: {},
      });

      if (error) throw error;
      return data as {
        solutions: Array<{
          path: string;
          name: string;
          language: string;
          url: string;
        }>;
        total: number;
      };
    },
  });

  return {
    fetchSolutions,
  };
}
