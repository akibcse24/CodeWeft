import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-requested-with",
  "Access-Control-Allow-Methods": "POST, GET, OPTIONS, PUT, DELETE",
};

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

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    console.log("Authorization Header present:", !!authHeader);

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      {
        global: {
          headers: { Authorization: authHeader || "" },
        },
      }
    );

    // Get the user from the request
    const {
      data: { user },
      error: userError,
    } = await supabaseClient.auth.getUser();

    if (userError || !user) {
      console.error("Auth error details:", userError);
      return new Response(JSON.stringify({ error: "Unauthorized", details: userError?.message }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log("Authenticated user found:", user.id);

    // Get user's GitHub settings
    const { data: settings, error: settingsError } = await supabaseClient
      .from("github_settings")
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle();

    const url = new URL(req.url);
    const action = url.searchParams.get("action");

    console.log(`GitHub API action: ${action} for user: ${user.id}`);

    // For actions that need a token, check if we have one
    const token = settings?.github_token;

    switch (action) {
      case "test": {
        // Test connection with provided token
        const body = await req.json();
        const testToken = body.token;

        if (!testToken) {
          return new Response(
            JSON.stringify({ error: "Token is required" }),
            {
              status: 400,
              headers: { ...corsHeaders, "Content-Type": "application/json" },
            }
          );
        }

        const response = await fetch("https://api.github.com/user", {
          headers: {
            Authorization: `Bearer ${testToken}`,
            Accept: "application/vnd.github.v3+json",
            "User-Agent": "CS-Learning-Hub",
          },
        });

        if (!response.ok) {
          const errorData = await response.json();
          console.error("GitHub API error during test:", errorData);
          return new Response(
            JSON.stringify({ error: "Invalid token", valid: false, details: errorData }),
            {
              status: 200,
              headers: { ...corsHeaders, "Content-Type": "application/json" },
            }
          );
        }

        const userData: GitHubUser = await response.json();
        return new Response(
          JSON.stringify({
            valid: true,
            user: {
              login: userData.login,
              avatar_url: userData.avatar_url,
              name: userData.name,
            },
          }),
          {
            status: 200,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }

      case "user": {
        if (!token) {
          return new Response(
            JSON.stringify({ error: "GitHub not connected" }),
            {
              status: 400,
              headers: { ...corsHeaders, "Content-Type": "application/json" },
            }
          );
        }

        const response = await fetch("https://api.github.com/user", {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/vnd.github.v3+json",
            "User-Agent": "CS-Learning-Hub",
          },
        });

        if (!response.ok) {
          return new Response(
            JSON.stringify({ error: "Failed to fetch user" }),
            {
              status: response.status,
              headers: { ...corsHeaders, "Content-Type": "application/json" },
            }
          );
        }

        const userData: GitHubUser = await response.json();
        return new Response(JSON.stringify(userData), {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      case "repo": {
        if (!token) {
          return new Response(
            JSON.stringify({ error: "GitHub not connected" }),
            {
              status: 400,
              headers: { ...corsHeaders, "Content-Type": "application/json" },
            }
          );
        }

        const owner = url.searchParams.get("owner");
        const repo = url.searchParams.get("repo");

        if (!owner || !repo) {
          return new Response(
            JSON.stringify({ error: "Owner and repo are required" }),
            {
              status: 400,
              headers: { ...corsHeaders, "Content-Type": "application/json" },
            }
          );
        }

        const response = await fetch(
          `https://api.github.com/repos/${owner}/${repo}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              Accept: "application/vnd.github.v3+json",
              "User-Agent": "CS-Learning-Hub",
            },
          }
        );

        if (!response.ok) {
          return new Response(
            JSON.stringify({ error: "Failed to fetch repo" }),
            {
              status: response.status,
              headers: { ...corsHeaders, "Content-Type": "application/json" },
            }
          );
        }

        const repoData: GitHubRepo = await response.json();
        return new Response(JSON.stringify(repoData), {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      case "commits": {
        if (!token) {
          return new Response(
            JSON.stringify({ error: "GitHub not connected" }),
            {
              status: 400,
              headers: { ...corsHeaders, "Content-Type": "application/json" },
            }
          );
        }

        const owner = url.searchParams.get("owner");
        const repo = url.searchParams.get("repo");
        const limit = url.searchParams.get("limit") || "10";

        if (!owner || !repo) {
          return new Response(
            JSON.stringify({ error: "Owner and repo are required" }),
            {
              status: 400,
              headers: { ...corsHeaders, "Content-Type": "application/json" },
            }
          );
        }

        const response = await fetch(
          `https://api.github.com/repos/${owner}/${repo}/commits?per_page=${limit}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              Accept: "application/vnd.github.v3+json",
              "User-Agent": "CS-Learning-Hub",
            },
          }
        );

        if (!response.ok) {
          return new Response(
            JSON.stringify({ error: "Failed to fetch commits" }),
            {
              status: response.status,
              headers: { ...corsHeaders, "Content-Type": "application/json" },
            }
          );
        }

        const commits: GitHubCommit[] = await response.json();
        return new Response(JSON.stringify(commits), {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      case "contributions": {
        if (!token || !settings?.github_username) {
          return new Response(
            JSON.stringify({ error: "GitHub not connected" }),
            {
              status: 400,
              headers: { ...corsHeaders, "Content-Type": "application/json" },
            }
          );
        }

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

        const response = await fetch("https://api.github.com/graphql", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
            "User-Agent": "CS-Learning-Hub",
          },
          body: JSON.stringify({
            query,
            variables: { username },
          }),
        });

        if (!response.ok) {
          console.error("GraphQL error:", await response.text());
          return new Response(
            JSON.stringify({ error: "Failed to fetch contributions" }),
            {
              status: response.status,
              headers: { ...corsHeaders, "Content-Type": "application/json" },
            }
          );
        }

        const data = await response.json();

        if (data.errors) {
          console.error("GraphQL errors:", data.errors);
          return new Response(
            JSON.stringify({ error: "GraphQL query failed" }),
            {
              status: 400,
              headers: { ...corsHeaders, "Content-Type": "application/json" },
            }
          );
        }

        const calendar = data.data.user.contributionsCollection.contributionCalendar;
        const contributions: GitHubContributionDay[] = [];

        for (const week of calendar.weeks) {
          for (const day of week.contributionDays) {
            contributions.push({
              date: day.date,
              contributionCount: day.contributionCount,
            });
          }
        }

        return new Response(
          JSON.stringify({
            total: calendar.totalContributions,
            contributions,
          }),
          {
            status: 200,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }

      case "events": {
        if (!token || !settings?.github_username) {
          return new Response(
            JSON.stringify({ error: "GitHub not connected" }),
            {
              status: 400,
              headers: { ...corsHeaders, "Content-Type": "application/json" },
            }
          );
        }

        const response = await fetch(
          `https://api.github.com/users/${settings.github_username}/events?per_page=30`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              Accept: "application/vnd.github.v3+json",
              "User-Agent": "CS-Learning-Hub",
            },
          }
        );

        if (!response.ok) {
          return new Response(
            JSON.stringify({ error: "Failed to fetch events" }),
            {
              status: response.status,
              headers: { ...corsHeaders, "Content-Type": "application/json" },
            }
          );
        }

        const events = await response.json();
        return new Response(JSON.stringify(events), {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      case "solutions": {
        if (!token) {
          return new Response(
            JSON.stringify({ error: "GitHub not connected" }),
            {
              status: 400,
              headers: { ...corsHeaders, "Content-Type": "application/json" },
            }
          );
        }

        const repoParam = url.searchParams.get("repo");
        const repo = repoParam || settings?.solutions_repo;

        if (!repo) {
          return new Response(
            JSON.stringify({ error: "Solutions repo not configured" }),
            {
              status: 400,
              headers: { ...corsHeaders, "Content-Type": "application/json" },
            }
          );
        }

        const [owner, repoName] = repo.split("/");
        if (!owner || !repoName) {
          return new Response(
            JSON.stringify({ error: "Invalid repo format. Use owner/repo" }),
            {
              status: 400,
              headers: { ...corsHeaders, "Content-Type": "application/json" },
            }
          );
        }

        const response = await fetch(
          `https://api.github.com/repos/${owner}/${repoName}/git/trees/main?recursive=1`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              Accept: "application/vnd.github.v3+json",
              "User-Agent": "CS-Learning-Hub",
            },
          }
        );

        if (!response.ok) {
          const masterResponse = await fetch(
            `https://api.github.com/repos/${owner}/${repoName}/git/trees/master?recursive=1`,
            {
              headers: {
                Authorization: `Bearer ${token}`,
                Accept: "application/vnd.github.v3+json",
                "User-Agent": "CS-Learning-Hub",
              },
            }
          );

          if (!masterResponse.ok) {
            return new Response(
              JSON.stringify({ error: "Failed to fetch repo contents" }),
              {
                status: masterResponse.status,
                headers: { ...corsHeaders, "Content-Type": "application/json" },
              }
            );
          }

          const data = await masterResponse.json();
          return parseAndReturnSolutions(data, owner, repoName);
        }

        const data = await response.json();
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

  return new Response(JSON.stringify({ solutions, total: solutions.length }), {
    status: 200,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
