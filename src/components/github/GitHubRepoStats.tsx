import { Star, GitFork, Eye, AlertCircle, Loader2 } from "lucide-react";
import { useGitHubRepo } from "@/hooks/useGitHub";
import { formatDistanceToNow, parseISO } from "date-fns";

interface GitHubRepoStatsProps {
  githubUrl: string | null | undefined;
  compact?: boolean;
}

export function GitHubRepoStats({ githubUrl, compact = false }: GitHubRepoStatsProps) {
  const { repoStats, repoLoading, repoError } = useGitHubRepo(githubUrl);

  if (!githubUrl) return null;

  if (repoLoading) {
    return (
      <div className="flex items-center gap-1 text-muted-foreground">
        <Loader2 className="h-3 w-3 animate-spin" />
        <span className="text-xs">Loading...</span>
      </div>
    );
  }

  if (repoError || !repoStats) {
    return null; // Silently fail - user might not have connected GitHub
  }

  if (compact) {
    return (
      <div className="flex items-center gap-3 text-xs text-muted-foreground">
        <span className="flex items-center gap-1">
          <Star className="h-3 w-3" />
          {repoStats.stargazers_count}
        </span>
        <span className="flex items-center gap-1">
          <GitFork className="h-3 w-3" />
          {repoStats.forks_count}
        </span>
        {repoStats.language && (
          <span className="flex items-center gap-1">
            <span
              className="h-2 w-2 rounded-full"
              style={{ backgroundColor: getLanguageColor(repoStats.language) }}
            />
            {repoStats.language}
          </span>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <Star className="h-4 w-4" />
          <span className="font-medium text-foreground">{repoStats.stargazers_count}</span>
          stars
        </span>
        <span className="flex items-center gap-1.5">
          <GitFork className="h-4 w-4" />
          <span className="font-medium text-foreground">{repoStats.forks_count}</span>
          forks
        </span>
        <span className="flex items-center gap-1.5">
          <Eye className="h-4 w-4" />
          <span className="font-medium text-foreground">{repoStats.watchers_count}</span>
          watchers
        </span>
        {repoStats.open_issues_count > 0 && (
          <span className="flex items-center gap-1.5">
            <AlertCircle className="h-4 w-4" />
            <span className="font-medium text-foreground">{repoStats.open_issues_count}</span>
            issues
          </span>
        )}
      </div>
      <div className="flex items-center gap-3 text-xs text-muted-foreground">
        {repoStats.language && (
          <span className="flex items-center gap-1.5">
            <span
              className="h-2.5 w-2.5 rounded-full"
              style={{ backgroundColor: getLanguageColor(repoStats.language) }}
            />
            {repoStats.language}
          </span>
        )}
        {repoStats.pushed_at && (
          <span>Updated {formatDistanceToNow(parseISO(repoStats.pushed_at))} ago</span>
        )}
      </div>
    </div>
  );
}

// Common programming language colors
function getLanguageColor(language: string): string {
  const colors: Record<string, string> = {
    JavaScript: "#f1e05a",
    TypeScript: "#3178c6",
    Python: "#3572A5",
    Java: "#b07219",
    "C++": "#f34b7d",
    C: "#555555",
    Go: "#00ADD8",
    Rust: "#dea584",
    Ruby: "#701516",
    PHP: "#4F5D95",
    Swift: "#F05138",
    Kotlin: "#A97BFF",
    Dart: "#00B4AB",
    HTML: "#e34c26",
    CSS: "#563d7c",
    Shell: "#89e051",
    Vue: "#41b883",
    Svelte: "#ff3e00",
  };

  return colors[language] || "#8b8b8b";
}
