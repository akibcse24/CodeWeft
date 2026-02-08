import { useMemo } from "react";
import { Github, Flame, GitCommit, ExternalLink, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useGitHub } from "@/hooks/useGitHub";
import { format, subDays, eachDayOfInterval, parseISO, differenceInDays } from "date-fns";

const CONTRIBUTION_LEVELS = [
  "bg-muted",
  "bg-green-200 dark:bg-green-900",
  "bg-green-300 dark:bg-green-700",
  "bg-green-500 dark:bg-green-500",
  "bg-green-700 dark:bg-green-300",
];

function getContributionLevel(count: number): number {
  if (count === 0) return 0;
  if (count <= 2) return 1;
  if (count <= 5) return 2;
  if (count <= 10) return 3;
  return 4;
}

export function GitHubContributions() {
  const { contributions, contributionsLoading, events, eventsLoading, settings, isConnected } =
    useGitHub();

  // Build the heatmap data for last 365 days
  const heatmapData = useMemo(() => {
    const today = new Date();
    const startDate = subDays(today, 364);
    const days = eachDayOfInterval({ start: startDate, end: today });

    const contributionMap = new Map<string, number>();
    if (contributions?.contributions) {
      for (const c of contributions.contributions) {
        contributionMap.set(c.date, c.contributionCount);
      }
    }

    return days.map((date) => ({
      date,
      dateStr: format(date, "yyyy-MM-dd"),
      count: contributionMap.get(format(date, "yyyy-MM-dd")) || 0,
    }));
  }, [contributions]);

  // Calculate current streak
  const currentStreak = useMemo(() => {
    if (!contributions?.contributions) return 0;

    let streak = 0;
    const today = format(new Date(), "yyyy-MM-dd");
    const contributionMap = new Map<string, number>();

    for (const c of contributions.contributions) {
      contributionMap.set(c.date, c.contributionCount);
    }

    // Start from today and go backwards
    let checkDate = new Date();
    while (true) {
      const dateStr = format(checkDate, "yyyy-MM-dd");
      const count = contributionMap.get(dateStr) || 0;

      // If today has no contributions, start from yesterday
      if (dateStr === today && count === 0) {
        checkDate = subDays(checkDate, 1);
        continue;
      }

      if (count > 0) {
        streak++;
        checkDate = subDays(checkDate, 1);
      } else {
        break;
      }
    }

    return streak;
  }, [contributions]);

  // Get recent push events
  const recentCommits = useMemo(() => {
    if (!events) return [];

    return events
      .filter((e) => e.type === "PushEvent" && e.payload.commits?.length)
      .slice(0, 5)
      .map((e) => ({
        repo: e.repo.name,
        message: e.payload.commits![0].message.split("\n")[0],
        date: e.created_at,
      }));
  }, [events]);

  // Group heatmap by weeks (columns)
  const weeks = useMemo(() => {
    const result: typeof heatmapData[] = [];
    let week: typeof heatmapData = [];

    // Pad the beginning to align with day of week
    const firstDayOfWeek = heatmapData[0]?.date.getDay() || 0;
    for (let i = 0; i < firstDayOfWeek; i++) {
      week.push({ date: new Date(), dateStr: "", count: -1 }); // -1 = empty
    }

    for (const day of heatmapData) {
      week.push(day);
      if (week.length === 7) {
        result.push(week);
        week = [];
      }
    }

    if (week.length > 0) {
      result.push(week);
    }

    return result;
  }, [heatmapData]);

  if (!isConnected) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg flex items-center gap-2">
            <Github className="h-5 w-5" /> GitHub Activity
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-6 text-center">
            <Github className="h-12 w-12 text-muted-foreground mb-3" />
            <p className="text-muted-foreground">Connect GitHub in Settings to see your activity</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (contributionsLoading) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg flex items-center gap-2">
            <Github className="h-5 w-5" /> GitHub Activity
          </CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Github className="h-5 w-5" /> GitHub Activity
          </CardTitle>
          <a
            href={`https://github.com/${settings?.github_username}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1"
          >
            @{settings?.github_username}
            <ExternalLink className="h-3 w-3" />
          </a>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Contribution Heatmap */}
        <div className="overflow-x-auto">
          <div className="flex gap-[3px] min-w-fit">
            {weeks.map((week, weekIdx) => (
              <div key={weekIdx} className="flex flex-col gap-[3px]">
                {week.map((day, dayIdx) => (
                  <div
                    key={`${weekIdx}-${dayIdx}`}
                    className={`w-[10px] h-[10px] rounded-sm ${
                      day.count === -1
                        ? "bg-transparent"
                        : CONTRIBUTION_LEVELS[getContributionLevel(day.count)]
                    }`}
                    title={
                      day.count >= 0
                        ? `${day.dateStr}: ${day.count} contribution${day.count !== 1 ? "s" : ""}`
                        : undefined
                    }
                  />
                ))}
              </div>
            ))}
          </div>
        </div>

        {/* Stats */}
        <div className="flex items-center gap-6 text-sm">
          <div className="flex items-center gap-2">
            <GitCommit className="h-4 w-4 text-muted-foreground" />
            <span className="font-medium">{contributions?.total || 0}</span>
            <span className="text-muted-foreground">contributions this year</span>
          </div>
          <div className="flex items-center gap-2">
            <Flame className="h-4 w-4 text-orange-500" />
            <span className="font-medium">{currentStreak}</span>
            <span className="text-muted-foreground">day streak</span>
          </div>
        </div>

        {/* Recent Commits */}
        {recentCommits.length > 0 && (
          <div className="space-y-2">
            <p className="text-sm font-medium">Recent Commits</p>
            <div className="space-y-1">
              {recentCommits.slice(0, 3).map((commit, idx) => (
                <div key={idx} className="flex items-start gap-2 text-sm">
                  <GitCommit className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                  <div className="min-w-0">
                    <p className="truncate">{commit.message}</p>
                    <p className="text-xs text-muted-foreground">
                      {commit.repo.split("/")[1]} •{" "}
                      {format(parseISO(commit.date), "MMM d")}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
