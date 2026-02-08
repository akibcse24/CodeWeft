import { BarChart3, Clock, Code2, BookOpen, Target, TrendingUp } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
} from "recharts";
import { useTasks } from "@/hooks/useTasks";
import { useDSAProblems } from "@/hooks/useDSAProblems";
import { useFlashcards } from "@/hooks/useFlashcards";
import { useMemo } from "react";
import { format, startOfWeek, endOfWeek, eachDayOfInterval, isSameDay } from "date-fns";

export default function Analytics() {
  const { tasks } = useTasks();
  const { problems } = useDSAProblems();
  const { decks } = useFlashcards();

  const weeklyData = useMemo(() => {
    const start = startOfWeek(new Date(), { weekStartsOn: 1 });
    const end = endOfWeek(new Date(), { weekStartsOn: 1 });
    const days = eachDayOfInterval({ start, end });

    return days.map(day => {
      const dayStr = format(day, "EEE");
      const dayTasks = tasks.filter(t => t.completed_at && isSameDay(new Date(t.completed_at), day)).length;
      const dayProblems = problems.filter(p => p.status === 'solved' && p.updated_at && isSameDay(new Date(p.updated_at), day)).length;

      return {
        day: dayStr,
        tasks: dayTasks,
        problems: dayProblems,
        hours: dayTasks * 0.5 + dayProblems * 1 // Rough estimate: 30m per task, 1h per problem
      };
    });
  }, [tasks, problems]);

  const stats = useMemo(() => {
    const start = startOfWeek(new Date(), { weekStartsOn: 1 });
    const weekTasks = tasks.filter(t => t.completed_at && new Date(t.completed_at) >= start).length;
    const weekProblems = problems.filter(p => p.status === 'solved' && p.updated_at && new Date(p.updated_at) >= start).length;
    const totalHours = weeklyData.reduce((acc, curr) => acc + curr.hours, 0);

    return {
      hours: totalHours,
      problems: weekProblems,
      tasks: weekTasks,
      goalsMet: Math.min(100, Math.round(((weekTasks + weekProblems) / 10) * 100)) // Goal: 10 completions per week
    };
  }, [tasks, problems, weeklyData]);
  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold">Analytics</h1>
        <p className="text-muted-foreground">Track your learning progress</p>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-info" />
              <span className="text-xs text-muted-foreground">Study Time</span>
            </div>
            <div className="text-2xl font-bold mt-1">{stats.hours}h</div>
            <p className="text-xs text-muted-foreground">This week</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <Code2 className="h-4 w-4 text-success" />
              <span className="text-xs text-muted-foreground">Problems</span>
            </div>
            <div className="text-2xl font-bold mt-1">{stats.problems}</div>
            <p className="text-xs text-muted-foreground">This week</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <BookOpen className="h-4 w-4 text-accent" />
              <span className="text-xs text-muted-foreground">Tasks Done</span>
            </div>
            <div className="text-2xl font-bold mt-1">{stats.tasks}</div>
            <p className="text-xs text-muted-foreground">This week</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <Target className="h-4 w-4 text-warning" />
              <span className="text-xs text-muted-foreground">Goals Met</span>
            </div>
            <div className="text-2xl font-bold mt-1">{stats.goalsMet}%</div>
            <p className="text-xs text-muted-foreground">This week</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Study Time</CardTitle>
            <CardDescription>Hours spent learning this week</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={weeklyData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="day" className="text-xs" />
                  <YAxis className="text-xs" />
                  <Tooltip />
                  <Area
                    type="monotone"
                    dataKey="hours"
                    stroke="hsl(var(--primary))"
                    fill="hsl(var(--primary) / 0.2)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Problems Solved</CardTitle>
            <CardDescription>DSA problems this week</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={weeklyData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="day" className="text-xs" />
                  <YAxis className="text-xs" />
                  <Tooltip />
                  <Bar dataKey="problems" fill="hsl(var(--success))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Goals Progress */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Weekly Goals</CardTitle>
          <CardDescription>Your progress toward weekly targets</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <div className="flex justify-between text-sm mb-1">
              <span>Study 20 hours</span>
              <span className="text-muted-foreground">{stats.hours} / 20 hours</span>
            </div>
            <Progress value={(stats.hours / 20) * 100} />
          </div>
          <div>
            <div className="flex justify-between text-sm mb-1">
              <span>Solve 15 problems</span>
              <span className="text-muted-foreground">{stats.problems} / 15 problems</span>
            </div>
            <Progress value={(stats.problems / 15) * 100} />
          </div>
          <div>
            <div className="flex justify-between text-sm mb-1">
              <span>Complete 10 tasks</span>
              <span className="text-muted-foreground">{stats.tasks} / 10 tasks</span>
            </div>
            <Progress value={(stats.tasks / 10) * 100} />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
