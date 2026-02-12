import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { logger } from "@/lib/logger";
import { toast } from "sonner";
import { useEffect, useMemo, useRef, useState, useCallback } from "react";
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

// ─── Direct GitHub API helper (bypasses edge function entirely) ──────────────
async function fetchGitHubDirect<T>(
  url: string,
  token: string
): Promise<{ data: T | null; error: string | null }> {
  try {
    const res = await fetch(url, {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/vnd.github+json",
      },
    });
    if (!res.ok) {
      const text = await res.text();
      return { data: null, error: `GitHub API ${res.status}: ${text}` };
    }
    const data = await res.json();
    return { data: data as T, error: null };
  } catch (err) {
    return { data: null, error: err instanceof Error ? err.message : "Network error" };
  }
}

import { Octokit } from "@octokit/rest";
import { initializeOctokit } from "@/services/github/octokit.service";

export function useGitHub() {
  const { user, session } = useAuth();
  const queryClient = useQueryClient();
  const syncInProgressRef = useRef(false);
  const [octokit, setOctokit] = useState<Octokit | null>(null);

  // ─── Settings: LOCAL-FIRST (Dexie instant, Supabase background) ────────────
  const [localSettings, setLocalSettings] = useState<GitHubSettings | null>(null);
  const [settingsLoading, setSettingsLoading] = useState(true);
  const settingsError = null; // Local reads don't error

  // 1. Load from Dexie INSTANTLY (zero network wait)
  useEffect(() => {
    if (!user) { setLocalSettings(null); setSettingsLoading(false); return; }
    db.github_settings.where("user_id").equals(user.id).first().then(local => {
      if (local) {
        console.log("[GitHub] Instant load from Dexie: found settings");
        setLocalSettings(local as GitHubSettings);
      }
      setSettingsLoading(false);
    });
  }, [user]);

  // Initialize Octokit when user is available
  useEffect(() => {
    if (!user) return;

    const init = async () => {
      try {
        // Pass user.id to avoid internal auth hang
        const octokit = await initializeOctokit(false, user.id);
        setOctokit(octokit);
      } catch (err) {
        console.error('[GitHub] Failed to initialize Octokit:', err);
        // Toast with simple description for sonner
        toast('GitHub Connection Failed', {
          description: 'Could not connect to GitHub. Please check your settings.',
          // variant: 'destructive', // sonner doesn't support variant directly this way usually, but some wrappers do. 
          // Assuming default shadcn/sonner wrapper:
          action: {
            label: 'Retry',
            onClick: () => window.location.reload(),
          },
        });
      }
    };

    init();
  }, [user]);
  // 2. Background sync from Supabase DB (non-blocking, updates Dexie silently)
  useEffect(() => {
    if (!user) return;
    const syncFromCloud = async () => {
      try {
        const { data: cloud, error } = await supabase
          .from("github_settings")
          .select("*")
          .eq("user_id", user.id)
          .maybeSingle();

        if (error || !cloud) return;

        // Only update if cloud is newer
        const localUpdated = localSettings?.updated_at || "";
        if (cloud.updated_at > localUpdated) {
          await db.github_settings.put({ ...cloud, user_id: user.id });
          setLocalSettings(cloud as GitHubSettings);
          console.log("[GitHub] Background sync: updated settings from cloud");
        }
      } catch {
        // Network down — no problem, local data is fine
      }
    };
    syncFromCloud();
  }, [user]); // eslint-disable-line react-hooks/exhaustive-deps

  const settings = localSettings;

  // Stabilize isConnected
  const isConnected = useMemo(() => {
    if (settingsLoading && !settings) return false;
    return !!settings?.github_token && !!settings?.github_username;
  }, [settings, settingsLoading]);

  // Background sync: push local settings to Supabase DB (fire-and-forget)
  useEffect(() => {
    if (!user || settingsLoading || !settings || syncInProgressRef.current) return;
    if (settings.github_token && settings.github_username && !settings.id) {
      syncInProgressRef.current = true;
      supabase.from("github_settings").upsert({
        user_id: user.id,
        github_token: settings.github_token,
        github_username: settings.github_username,
        avatar_url: settings.avatar_url,
        solutions_repo: settings.solutions_repo,
        updated_at: new Date().toISOString(),
      }, { onConflict: "user_id" }).then(({ error }) => {
        if (error) console.warn("[GitHub] bg push:", error.message);
        syncInProgressRef.current = false;
      });
    }
  }, [user, settings, settingsLoading]);

  if (settingsError) {
    console.error("[GitHub] Global query error:", settingsError);
  }

  // ─── Test Connection: Direct GitHub API (NO edge function) ─────────────────
  const testConnection = useMutation({
    mutationFn: async (token: string): Promise<TestConnectionResult> => {
      console.log("[GitHub] Testing connection directly via GitHub API...");
      try {
        const { data, error } = await fetchGitHubDirect<GitHubUser>(
          "https://api.github.com/user",
          token
        );

        if (error) {
          logger.error("Test connection error:", error);
          return { valid: false, error };
        }

        if (!data) {
          return { valid: false, error: "No response from GitHub" };
        }

        return {
          valid: true,
          user: {
            login: data.login,
            avatar_url: data.avatar_url,
            name: data.name,
          },
        };
      } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to test GitHub connection";
        logger.error("Test connection error:", message);
        return { valid: false, error: message };
      }
    },
  });

  // ─── Save Settings: Dexie + Supabase DB directly (NO edge function) ───────
  const saveSettings = useMutation({
    mutationFn: async (newSettings: {
      github_token: string;
      github_username: string;
      avatar_url?: string;
      solutions_repo?: string;
    }) => {
      console.log("[GitHub] Saving settings for:", newSettings.github_username);
      if (!user) throw new Error("Not authenticated");

      const existing = await db.github_settings.where("user_id").equals(user.id).first();
      const idToUse = existing?.id || settings?.id || crypto.randomUUID();
      const now = new Date().toISOString();

      const record: GitHubSettings = {
        id: idToUse,
        user_id: user.id,
        github_token: newSettings.github_token,
        github_username: newSettings.github_username,
        avatar_url: newSettings.avatar_url || null,
        solutions_repo: newSettings.solutions_repo || null,
        github_installation_id: existing?.github_installation_id || null,
        created_at: existing?.created_at || now,
        updated_at: now,
      };

      // 1. Save to Dexie immediately
      await db.github_settings.put(record);
      setLocalSettings(record);

      // 2. Update query cache immediately so other hooks (useGitHubRepo) see it
      queryClient.setQueryData(["github-settings"], record);

      // 3. Fire-and-Forget Cloud Sync
      supabase.from("github_settings").upsert({
        user_id: user.id,
        github_token: newSettings.github_token,
        github_username: newSettings.github_username,
        avatar_url: newSettings.avatar_url || null,
        solutions_repo: newSettings.solutions_repo || null,
        updated_at: now,
      }, { onConflict: "user_id" }).then(({ error }) => {
        if (error) console.warn("[GitHub] bg save:", error.message);
      });

      return record;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["github-settings"] });
    },
  });

  // ─── Disconnect: Dexie instant + Supabase fire-and-forget ──────────────────
  const disconnect = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("Not authenticated");
      // 1. Clear local Dexie immediately
      await db.github_settings.where("user_id").equals(user.id).delete();
      setLocalSettings(null);
      queryClient.setQueryData(["github-settings"], null);

      // 2. Fire-and-forget cloud delete
      supabase.from("github_settings").delete().eq("user_id", user.id).then(({ error }) => {
        if (error) console.warn("[GitHub] bg disconnect:", error.message);
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["github-settings"] });
      queryClient.invalidateQueries({ queryKey: ["github-contributions"] });
      queryClient.invalidateQueries({ queryKey: ["github-events"] });
      queryClient.invalidateQueries({ queryKey: ["github-repositories"] });
    },
  });

  // ─── Sync from OAuth session ──────────────────────────────────────────────
  const syncFromSession = useCallback(async () => {
    if (!session?.provider_token || !user) {
      // Don't toast if called automatically and nothing found (unless explicit manual call?)
      // But logging is good
      console.log("[GitHub] No session token found for sync.");
      return;
    }

    try {
      console.log("[GitHub] Syncing token from OAuth session...");

      // Optimistically assume valid if just signed in? Or test?
      // Testing is safer but slower. Let's test.
      const result = await testConnection.mutateAsync(session.provider_token);
      if (!result.valid) {
        console.warn("[GitHub] Session token invalid:", result.error);
        return;
      }

      await saveSettings.mutateAsync({
        github_token: session.provider_token,
        github_username: result.user?.login || "session_user",
        avatar_url: result.user?.avatar_url,
      });

      toast.success("GitHub connected automatically");
    } catch (e) {
      console.error("[GitHub] Failed to auto-sync from session:", e);
    }
  }, [session, user, testConnection, saveSettings]);

  // Auto-sync effect
  useEffect(() => {
    if (session?.provider_token && !settingsLoading && !settings?.github_token) {
      // Only auto-sync if we don't have a token yet
      syncFromSession();
    }
  }, [session?.provider_token, settingsLoading, settings?.github_token, syncFromSession]);

  // ─── Contributions: Direct GitHub API ─────────────────────────────────────
  const {
    data: contributions,
    isLoading: contributionsLoading,
    refetch: refetchContributions,
  } = useQuery({
    queryKey: ["github-contributions", user?.id],
    queryFn: async (): Promise<ContributionData | null> => {
      if (!isConnected || !settings?.github_token || !settings?.github_username) return null;

      try {
        // GitHub doesn't have a direct REST API for contribution graph,
        // so we use the events API to approximate recent contributions
        const { data: events, error } = await fetchGitHubDirect<GitHubEvent[]>(
          `https://api.github.com/users/${settings.github_username}/events?per_page=100`,
          settings.github_token
        );

        if (error || !events) {
          console.warn("[GitHub] Contributions fetch error:", error);
          return null;
        }

        // Count contributions by date from events
        const contribMap = new Map<string, number>();
        let total = 0;

        for (const event of events) {
          const date = event.created_at.split("T")[0];
          const count = event.type === "PushEvent"
            ? (event.payload?.commits?.length || 1)
            : 1;
          contribMap.set(date, (contribMap.get(date) || 0) + count);
          total += count;
        }

        const contributions = Array.from(contribMap.entries())
          .map(([date, contributionCount]) => ({ date, contributionCount }))
          .sort((a, b) => a.date.localeCompare(b.date));

        return { total, contributions };
      } catch (err) {
        logger.error("Contributions error:", err);
        return null;
      }
    },
    enabled: isConnected,
    staleTime: 1000 * 60 * 5,
  });

  // ─── Events: Direct GitHub API ─────────────────────────────────────────────
  const {
    data: events,
    isLoading: eventsLoading,
    refetch: refetchEvents,
  } = useQuery({
    queryKey: ["github-events", user?.id],
    queryFn: async (): Promise<GitHubEvent[] | null> => {
      if (!isConnected || !settings?.github_token || !settings?.github_username) return null;

      try {
        const { data, error } = await fetchGitHubDirect<GitHubEvent[]>(
          `https://api.github.com/users/${settings.github_username}/events?per_page=30`,
          settings.github_token
        );

        if (error) {
          console.warn("[GitHub] Events fetch error:", error);
          if (error.includes("401") || error.includes("Unauthorized")) {
            toast.error("GitHub token expired. Please reconnect in Settings.");
          }
          return null;
        }

        return data;
      } catch (err) {
        logger.error("Events error:", err);
        return null;
      }
    },
    enabled: isConnected,
    staleTime: 1000 * 60 * 5,
  });

  // ─── Repositories: Direct GitHub API ───────────────────────────────────────
  const {
    data: repositories,
    isLoading: repositoriesLoading,
    refetch: refetchRepositories,
  } = useQuery({
    queryKey: ["github-repositories", user?.id],
    queryFn: async (): Promise<GitHubRepo[] | null> => {
      if (!isConnected || !settings?.github_token) return null;

      try {
        const { data, error } = await fetchGitHubDirect<GitHubRepo[]>(
          "https://api.github.com/user/repos?sort=updated&per_page=100&type=all",
          settings.github_token
        );

        if (error) {
          console.warn("[GitHub] Repos fetch error:", error);
          if (error.includes("401") || error.includes("Unauthorized")) {
            toast.error("GitHub token expired. Please reconnect in Settings.");
          }
          return null;
        }

        return data;
      } catch (err) {
        logger.error("Repositories error:", err);
        return null;
      }
    },
    enabled: isConnected,
    staleTime: 1000 * 60 * 5,
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

// ─── Hook for repo-specific data: Direct GitHub API ──────────────────────────
export function useGitHubRepo(githubUrl: string | null | undefined) {
  const { user } = useAuth();

  const { data: settings } = useQuery({
    queryKey: ["github-settings"],
    queryFn: async () => {
      if (!user) return null;
      const local = await db.github_settings.where("user_id").equals(user.id).first();
      return (local as GitHubSettings | null) ?? null;
    },
    enabled: !!user,
  });
  const token = (settings as GitHubSettings | null)?.github_token;
  const isConnected = !!token && !!(settings as GitHubSettings | null)?.github_username;

  const parseGitHubUrl = (url: string) => {
    const match = url.match(/github\.com\/([^/]+)\/([^/]+)/);
    if (match) {
      return { owner: match[1], repo: match[2].replace(/\.git$/, "") };
    }
    return null;
  };

  const parsed = githubUrl ? parseGitHubUrl(githubUrl) : null;

  // Direct GitHub API call for repo stats
  const {
    data: repoStats,
    isLoading: repoLoading,
    error: repoError,
    refetch: refetchRepo,
  } = useQuery({
    queryKey: ["github-repo", parsed?.owner, parsed?.repo],
    queryFn: async () => {
      if (!parsed || !token) return null;
      const { data, error } = await fetchGitHubDirect(
        `https://api.github.com/repos/${parsed.owner}/${parsed.repo}`,
        token
      );
      if (error) throw new Error(error);
      return data;
    },
    enabled: !!parsed && !!user && !!isConnected,
    retry: 2,
  });

  // Direct GitHub API call for commits
  const {
    data: commits,
    isLoading: commitsLoading,
    refetch: refetchCommits,
  } = useQuery({
    queryKey: ["github-commits", parsed?.owner, parsed?.repo],
    queryFn: async () => {
      if (!parsed || !token) return null;
      const { data, error } = await fetchGitHubDirect(
        `https://api.github.com/repos/${parsed.owner}/${parsed.repo}/commits?per_page=5`,
        token
      );
      if (error) throw new Error(error);
      return data;
    },
    enabled: !!parsed && !!user && !!isConnected,
    retry: 2,
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

// ─── Hook for DSA solutions: Direct GitHub API ───────────────────────────────
export function useGitHubSolutions() {
  const { user } = useAuth();

  const { data: settings } = useQuery({
    queryKey: ["github-settings"],
    queryFn: async () => {
      if (!user) return null;
      const local = await db.github_settings.where("user_id").equals(user.id).first();
      return (local as GitHubSettings | null) ?? null;
    },
    enabled: !!user,
  });
  const ghSettings = settings as GitHubSettings | null;
  const isConnected = !!ghSettings?.github_token && !!ghSettings?.github_username;

  const fetchSolutions = useMutation({
    mutationFn: async (repo?: string) => {
      if (!isConnected || !ghSettings?.github_token) throw new Error("GitHub not connected");

      const repoName = repo || ghSettings.solutions_repo;
      if (!repoName) throw new Error("No solutions repo configured");

      // Parse owner/repo
      const repoPath = repoName.includes("/")
        ? repoName
        : `${ghSettings.github_username}/${repoName}`;

      const { data, error } = await fetchGitHubDirect(
        `https://api.github.com/repos/${repoPath}/contents`,
        ghSettings.github_token
      );

      if (error) throw new Error(error);
      return data;
    },
  });

  return {
    fetchSolutions,
  };
}
