import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

import { corsHeaders } from "../_shared/cors.ts";
import { validateUser } from "../_shared/auth.ts";

interface GitHubRepo {
  name: string;
  full_name: string;
  description: string;
  stargazers_count: number;
  forks_count: number;
  watchers_count: number;
  open_issues_count: number;
  language: string;
  pushed_at: string;
  html_url: string;
}

interface GitHubCommit {
  sha: string;
  commit: {
    message: string;
    author: {
      name: string;
      date: string;
    };
  };
  html_url: string;
}

interface GitHubUser {
  login: string;
  avatar_url: string;
  name: string;
  public_repos: number;
  followers: number;
  following: number;
}

interface GitHubContributionDay {
  date: string;
  contributionCount: number;
}

/**
 * Unified helper for all GitHub API requests
 * Standardizes headers, error handling, and response parsing
 */
async function fetchGitHub(url: string, token: string, options: RequestInit = {}) {
  const method = options.method || "GET";

  const headers = new Headers({
    "Authorization": `Bearer ${token}`,
    "Accept": "application/vnd.github.v3+json",
    "User-Agent": "CS-Learning-Hub",
    ...options.headers
  });

  if (method !== "GET" && method !== "HEAD" && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  console.log(`[github-api] fetchGitHub: ${method} ${url}`);

  try {
    const response = await fetch(url, { ...options, headers });

    if (!response.ok) {
      let errorData;
      try {
        errorData = await response.json();
      } catch {
        errorData = { message: await response.text() || response.statusText };
      }

      console.error(`[github-api] GitHub API Error (${response.status}):`, errorData);

      return {
        data: null,
        error: errorData.message || "Upstream GitHub Error",
        status: response.status,
        details: errorData
      };
    }

    const contentType = response.headers.get("content-type");
    let data;
    if (contentType?.includes("application/json")) {
      data = await response.json();
    } else {
      data = await response.text();
    }

    return { data, error: null, status: response.status };
  } catch (err) {
    console.error(`[github-api] Fetch Exception:`, err);
    return { data: null, error: String(err), status: 500 };
  }
}

function createJsonResponse(data: any, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

Deno.serve(async (req) => {
  console.log(`[github-api] Received request: ${req.method} ${req.url}`);

  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const authHeader = req.headers.get("Authorization");
  console.log(`[github-api] Incoming request: ${req.method} ${req.url}`);
  console.log(`[github-api] Authorization header present: ${!!authHeader} (length: ${authHeader?.length || 0})`);

  try {
    // Authenticate the user
    const { user, response: authResponse } = await validateUser(req);
    if (authResponse) {
      console.error("[github-api] Authentication failed");
      return authResponse;
    }

    console.log("[github-api] Authenticated user found:", user.id);

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      {
        global: {
          headers: { Authorization: req.headers.get("Authorization") || "" },
        },
      }
    );

    // Get user's GitHub settings action
    const url = new URL(req.url);
    const method = req.method;

    // Parse body carefully - only once
    let body = null;
    if (method !== "GET" && method !== "HEAD") {
      try {
        body = await req.json();
      } catch (e) {
        console.warn("[github-api] Could not parse request body:", e);
      }
    }

    const action = url.searchParams.get("action") || body?.action;

    console.log(`GitHub API action: ${action} (${method}) for user: ${user.id}`);

    // Create a service client for DB operations to ensure reliability
    const serviceClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? Deno.env.get("SUPABASE_ANON_KEY") ?? ""
    );

    // Pre-fetch settings for actions that need a token
    const { data: settings } = await serviceClient
      .from("github_settings")
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle();

    const token = settings?.github_token;

    switch (action) {
      case "proxy": {
        const path = body?.path || url.searchParams.get("path");

        if (!path) return createJsonResponse({ error: "Path is required for proxy" }, 400);
        if (!token) return createJsonResponse({ error: "GitHub not connected" }, 400);

        const targetUrl = path.startsWith("http") ? path : `https://api.github.com${path.startsWith("/") ? "" : "/"}${path}`;

        const { data, error, status, details } = await fetchGitHub(targetUrl, token, {
          method,
          body: method !== "GET" && method !== "HEAD" && body?.data ? JSON.stringify(body.data) : undefined
        });

        if (error) return createJsonResponse({ error, details }, status);
        return createJsonResponse(data, status);
      }

      case "get-settings": {
        const { data, error } = await serviceClient
          .from("github_settings")
          .select("*")
          .eq("user_id", user.id)
          .maybeSingle();

        if (error) {
          return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        return new Response(JSON.stringify(data), {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      case "disconnect": {
        const { error } = await serviceClient
          .from("github_settings")
          .delete()
          .eq("user_id", user.id);

        if (error) {
          return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        return new Response(JSON.stringify({ success: true }), {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      case "test": {
        // Test connection with provided token
        const testToken = body?.token;

        if (!testToken) return createJsonResponse({ error: "Token is required" }, 400);

        const { data: userData, error, status } = await fetchGitHub("https://api.github.com/user", testToken);

        if (error) {
          return createJsonResponse({ error: "Invalid token", valid: false, details: error }, 200);
        }

        return createJsonResponse({
          valid: true,
          user: {
            login: userData.login,
            avatar_url: userData.avatar_url,
            name: userData.name,
          },
        });
      }

      case "save": {
        // Save GitHub settings
        // body is already parsed in the parent scope
        const { github_token, github_username, avatar_url, solutions_repo } = body || {};

        if (!github_token || !github_username) {
          return new Response(
            JSON.stringify({ error: "Token and username are required" }),
            {
              status: 400,
              headers: { ...corsHeaders, "Content-Type": "application/json" },
            }
          );
        }

        console.log(`[github-api] Saving settings for user: ${user.id}`);

        // Use service role client if available to ensure reliability, 
        // fall back to anon if not (it will still work because we already validated the user)
        const serviceClient = createClient(
          Deno.env.get("SUPABASE_URL") ?? "",
          Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? Deno.env.get("SUPABASE_ANON_KEY") ?? ""
        );

        const { data, error } = await serviceClient
          .from("github_settings")
          .upsert({
            user_id: user.id,
            github_token,
            github_username,
            avatar_url,
            solutions_repo,
            updated_at: new Date().toISOString(),
          }, {
            onConflict: "user_id",
          })
          .select()
          .single();

        if (error) {
          console.error("[github-api] Save error:", error);
          return new Response(
            JSON.stringify({ error: error.message }),
            {
              status: 500,
              headers: { ...corsHeaders, "Content-Type": "application/json" },
            }
          );
        }

        console.log("[github-api] Save successful");
        return new Response(
          JSON.stringify({ success: true, data }),
          {
            status: 200,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }

      case "user": {
        if (!token) return createJsonResponse({ error: "GitHub not connected" }, 400);

        const { data, error, status } = await fetchGitHub("https://api.github.com/user", token);
        if (error) return createJsonResponse({ error }, status);
        return createJsonResponse(data, status);
      }

      case "repos": {
        const type = url.searchParams.get("type") || "all";
        const sort = url.searchParams.get("sort") || "updated";
        const direction = url.searchParams.get("direction") || "desc";
        const per_page = url.searchParams.get("per_page") || "100";

        if (!token) return createJsonResponse({ error: "GitHub not connected" }, 400);

        const { data, error, status } = await fetchGitHub(
          `https://api.github.com/user/repos?type=${type}&sort=${sort}&direction=${direction}&per_page=${per_page}`,
          token
        );

        if (error) return createJsonResponse({ error }, status);
        return createJsonResponse(data);
      }

      case "commits": {
        if (!token) return createJsonResponse({ error: "GitHub not connected" }, 400);

        const owner = url.searchParams.get("owner");
        const repo = url.searchParams.get("repo");
        const limit = url.searchParams.get("limit") || "10";

        if (!owner || !repo) return createJsonResponse({ error: "Owner and repo are required" }, 400);

        const { data, error, status } = await fetchGitHub(
          `https://api.github.com/repos/${owner}/${repo}/commits?per_page=${limit}`,
          token
        );

        if (error) return createJsonResponse({ error }, status);
        return createJsonResponse(data);
      }

      case "contributions": {
        if (!token || !settings?.github_username) return createJsonResponse({ error: "GitHub not connected" }, 400);

        const username = settings.github_username;
        const query = `
          query($username: String!) {
            user(login: $username) {
              contributionsCollection {
                contributionCalendar {
                  totalContributions
                  weeks {
                    contributionDays {
                      date
                      contributionCount
                    }
                  }
                }
              }
            }
          }
        `;

        const { data, error, status } = await fetchGitHub("https://api.github.com/graphql", token, {
          method: "POST",
          body: JSON.stringify({ query, variables: { username } }),
        });

        if (error) return createJsonResponse({ error }, status);

        if (data.errors) {
          console.error("GraphQL errors:", data.errors);
          return createJsonResponse({ error: "GraphQL query failed" }, 400);
        }

        const calendar = data.data.user.contributionsCollection.contributionCalendar;
        const contributions: GitHubContributionDay[] = calendar.weeks.flatMap((week: any) =>
          week.contributionDays.map((day: any) => ({
            date: day.date,
            contributionCount: day.contributionCount,
          }))
        );

        return createJsonResponse({
          total: calendar.totalContributions,
          contributions,
        });
      }

      case "events": {
        if (!token || !settings?.github_username) return createJsonResponse({ error: "GitHub not connected" }, 400);

        const { data, error, status } = await fetchGitHub(
          `https://api.github.com/users/${settings.github_username}/events?per_page=30`,
          token
        );
        if (error) return createJsonResponse({ error }, status);
        return createJsonResponse(data);
      }

      case "codespaces": {
        if (!token) return createJsonResponse({ error: "GitHub not connected" }, 400);

        const { data, error, status } = await fetchGitHub("https://api.github.com/user/codespaces", token);
        if (error) return createJsonResponse({ error }, status);
        return createJsonResponse(data);
      }

      case "codespace-action": {
        if (!token) return createJsonResponse({ error: "GitHub not connected" }, 400);

        const { codespace_name, subaction } = body || {};
        if (!codespace_name || !subaction) return createJsonResponse({ error: "Codespace name and subaction are required" }, 400);

        let method = "POST";
        let targetUrl = `https://api.github.com/user/codespaces/${codespace_name}/${subaction}`;

        if (subaction === "delete") {
          method = "DELETE";
          targetUrl = `https://api.github.com/user/codespaces/${codespace_name}`;
        }

        const { data, error, status } = await fetchGitHub(targetUrl, token, { method });
        if (error) return createJsonResponse({ error: `Failed to ${subaction} codespace`, details: error }, status);
        return createJsonResponse(data);
      }

      case "git-tree": {
        if (!token) return createJsonResponse({ error: "GitHub not connected" }, 400);

        const owner = url.searchParams.get("owner");
        const repo = url.searchParams.get("repo");
        const tree_sha = url.searchParams.get("tree_sha") || "main";
        const recursive = url.searchParams.get("recursive") === "true" ? "1" : "0";

        if (!owner || !repo) return createJsonResponse({ error: "Owner and repo are required" }, 400);

        const { data, error, status } = await fetchGitHub(
          `https://api.github.com/repos/${owner}/${repo}/git/trees/${tree_sha}?recursive=${recursive}`,
          token
        );

        if (error) return createJsonResponse({ error }, status);
        return createJsonResponse(data);
      }

      case "solutions": {
        if (!token) return createJsonResponse({ error: "GitHub not connected" }, 400);

        const repoParam = url.searchParams.get("repo");
        const repo = repoParam || settings?.solutions_repo;

        if (!repo) return createJsonResponse({ error: "Solutions repo not configured" }, 400);

        const [owner, repoName] = repo.split("/");
        if (!owner || !repoName) return createJsonResponse({ error: "Invalid repo format. Use owner/repo" }, 400);

        // Try main first
        let { data, error, status } = await fetchGitHub(
          `https://api.github.com/repos/${owner}/${repoName}/git/trees/main?recursive=1`,
          token
        );

        // Fallback to master
        if (error) {
          const masterResult = await fetchGitHub(
            `https://api.github.com/repos/${owner}/${repoName}/git/trees/master?recursive=1`,
            token
          );
          data = masterResult.data;
          error = masterResult.error;
          status = masterResult.status;
        }

        if (error) return createJsonResponse({ error: "Failed to fetch repo contents" }, status);
        return parseAndReturnSolutions(data, owner, repoName);
      }

      default:
        return new Response(JSON.stringify({ error: "Unknown action" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
    }
  } catch (error) {
    console.error("Error in github-api:", error);
    const errorMessage = error instanceof Error ? error.message : "Internal server error";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});

function parseAndReturnSolutions(
  data: { tree: Array<{ path: string; type: string }> },
  owner: string,
  repoName: string
) {
  const codeExtensions = [".py", ".js", ".ts", ".java", ".cpp", ".c", ".go", ".rs"];
  const solutions: Array<{
    path: string;
    name: string;
    language: string;
    url: string;
  }> = [];

  for (const item of data.tree) {
    if (item.type === "blob") {
      const ext = item.path.substring(item.path.lastIndexOf("."));
      if (codeExtensions.includes(ext.toLowerCase())) {
        const pathParts = item.path.split("/");
        const fileName = pathParts[pathParts.length - 1];
        const name = fileName.replace(ext, "").replace(/[-_]/g, " ");

        solutions.push({
          path: item.path,
          name: name,
          language: ext.substring(1),
          url: `https://github.com/${owner}/${repoName}/blob/main/${item.path}`,
        });
      }
    }
  }

  return createJsonResponse({ solutions, total: solutions.length });
}
