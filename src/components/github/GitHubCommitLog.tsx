import { GitCommit, ExternalLink, Loader2 } from "lucide-react";
import { useGitHubRepo } from "@/hooks/useGitHub";
import { formatDistanceToNow, parseISO } from "date-fns";

interface GitHubCommit {
  sha: string;
  html_url: string;
  commit: {
    message: string;
    author: {
      name: string;
      date: string;
    };
  };
}

interface GitHubCommitLogProps {
  githubUrl: string | null | undefined;
}

export function GitHubCommitLog({ githubUrl }: GitHubCommitLogProps) {
  const { commits, commitsLoading, parsed } = useGitHubRepo(githubUrl);

  if (!githubUrl || !parsed) return null;

  if (commitsLoading) {
    return (
      <div className="flex items-center justify-center py-4">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!commits || commits.length === 0) {
    return (
      <p className="text-sm text-muted-foreground text-center py-4">
        No commits found
      </p>
    );
  }

  return (
    <div className="space-y-3">
      <h4 className="font-medium text-sm flex items-center gap-2">
        <GitCommit className="h-4 w-4" />
        Recent Commits
      </h4>
      <div className="space-y-2">
        {commits.slice(0, 5).map((commit: GitHubCommit) => (
          <a
            key={commit.sha}
            href={commit.html_url}
            target="_blank"
            rel="noopener noreferrer"
            className="block p-2 rounded-lg hover:bg-muted transition-colors group"
          >
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium truncate group-hover:text-primary">
                  {commit.commit.message.split("\n")[0]}
                </p>
                <p className="text-xs text-muted-foreground">
                  {commit.commit.author.name} •{" "}
                  {formatDistanceToNow(parseISO(commit.commit.author.date))} ago
                </p>
              </div>
              <ExternalLink className="h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity shrink-0 mt-1" />
            </div>
            <code className="text-[10px] text-muted-foreground font-mono">
              {commit.sha.substring(0, 7)}
            </code>
          </a>
        ))}
      </div>
      <a
        href={`https://github.com/${parsed.owner}/${parsed.repo}/commits`}
        target="_blank"
        rel="noopener noreferrer"
        className="text-xs text-primary hover:underline flex items-center gap-1"
      >
        View all commits
        <ExternalLink className="h-3 w-3" />
      </a>
    </div>
  );
}
