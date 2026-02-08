import { useState, useMemo } from "react";
import { Plus, Flame, Check, MoreVertical, Trash2, Edit, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useHabits } from "@/hooks/useHabits";
import { HabitDialog } from "@/components/habits/HabitDialog";
import { HabitHeatmap } from "@/components/habits/HabitHeatmap";
import { toast } from "sonner";
import { format, startOfWeek, addDays, isSameDay } from "date-fns";
import { Tables } from "@/integrations/supabase/types";

type Habit = Tables<"habits">;

export default function Habits() {
  const { 
    habits, 
    isLoading, 
    createHabit, 
    updateHabit, 
    deleteHabit,
    completions,
    toggleCompletion,
  } = useHabits();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingHabit, setEditingHabit] = useState<Habit | null>(null);

  // Get current week dates
  const weekDates = useMemo(() => {
    const today = new Date();
    const weekStart = startOfWeek(today, { weekStartsOn: 1 }); // Start on Monday
    return Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
  }, []);

  const today = new Date();
  const todayStr = format(today, "yyyy-MM-dd");

  // Calculate stats
  const activeHabits = habits.filter(h => h.is_active);
  const completedToday = useMemo(() => {
    const todayCompletions = completions.filter(c => c.completed_date === todayStr);
    const uniqueHabits = new Set(todayCompletions.map(c => c.habit_id));
    return uniqueHabits.size;
  }, [completions, todayStr]);

  const longestStreak = Math.max(...habits.map(h => h.longest_streak || 0), 0);

  const isHabitCompletedOnDate = (habitId: string, date: Date) => {
    const dateStr = format(date, "yyyy-MM-dd");
    return completions.some(c => c.habit_id === habitId && c.completed_date === dateStr);
  };

  const handleCreate = async (data: { 
    name: string; 
    description?: string; 
    frequency?: string;
    target_days?: number[];
    color?: string;
    icon?: string;
  }) => {
    try {
      await createHabit.mutateAsync(data);
      toast.success("Habit created!");
    } catch (error) {
      toast.error("Failed to create habit");
    }
  };

  const handleUpdate = async (data: { 
    name: string; 
    description?: string; 
    frequency?: string;
    target_days?: number[];
    color?: string;
    icon?: string;
  }) => {
    if (!editingHabit) return;
    try {
      await updateHabit.mutateAsync({ id: editingHabit.id, ...data });
      toast.success("Habit updated!");
    } catch (error) {
      toast.error("Failed to update habit");
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteHabit.mutateAsync(id);
      toast.success("Habit deleted");
    } catch (error) {
      toast.error("Failed to delete habit");
    }
  };

  const handleToggleCompletion = async (habitId: string, date: Date) => {
    const dateStr = format(date, "yyyy-MM-dd");
    try {
      await toggleCompletion.mutateAsync({ habitId, date: dateStr });
    } catch (error) {
      toast.error("Failed to update completion");
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Habit Tracker</h1>
          <p className="text-muted-foreground">Build consistent learning habits</p>
        </div>
        <Button onClick={() => { setEditingHabit(null); setDialogOpen(true); }}>
          <Plus className="mr-2 h-4 w-4" /> Add Habit
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold">{activeHabits.length}</div>
            <p className="text-xs text-muted-foreground">Active Habits</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold">{completedToday}</div>
            <p className="text-xs text-muted-foreground">Completed Today</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold flex items-center gap-1">
              {longestStreak}
              <Flame className="h-5 w-5 text-orange-500" />
            </div>
            <p className="text-xs text-muted-foreground">Longest Streak</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold">
              {activeHabits.length > 0 
                ? Math.round((completedToday / activeHabits.length) * 100) 
                : 0}%
            </div>
            <p className="text-xs text-muted-foreground">Today's Progress</p>
          </CardContent>
        </Card>
      </div>

      {/* Activity Heatmap */}
      {completions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Activity Overview
            </CardTitle>
          </CardHeader>
          <CardContent>
            <HabitHeatmap completions={completions} weeks={12} />
          </CardContent>
        </Card>
      )}

      {/* This Week */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">This Week</CardTitle>
          <CardDescription>Track your daily progress</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr>
                  <th className="text-left font-medium text-muted-foreground pb-3 pr-4">Habit</th>
                  {weekDates.map((date) => (
                    <th key={date.toISOString()} className="text-center font-medium text-muted-foreground pb-3 px-2">
                      <div className="flex flex-col items-center">
                        <span className="text-xs">{format(date, "EEE")}</span>
                        <span className={`text-sm ${isSameDay(date, today) ? "text-primary font-bold" : ""}`}>
                          {format(date, "d")}
                        </span>
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {habits.filter(h => h.is_active).map((habit) => (
                  <tr key={habit.id} className="border-t">
                    <td className="py-3 pr-4">
                      <div className="flex items-center gap-2">
                        <span>{habit.icon || "🎯"}</span>
                        <span className="font-medium">{habit.name}</span>
                      </div>
                    </td>
                    {weekDates.map((date) => {
                      const isCompleted = isHabitCompletedOnDate(habit.id, date);
                      const isFuture = date > today;
                      
                      return (
                        <td key={date.toISOString()} className="text-center py-3 px-2">
                          <Checkbox
                            checked={isCompleted}
                            disabled={isFuture}
                            onCheckedChange={() => handleToggleCompletion(habit.id, date)}
                            className={`h-6 w-6 ${isCompleted ? "" : ""}`}
                            style={isCompleted ? { 
                              backgroundColor: habit.color || "#22c55e",
                              borderColor: habit.color || "#22c55e"
                            } : {}}
                          />
                        </td>
                      );
                    })}
                  </tr>
                ))}
                {habits.filter(h => h.is_active).length === 0 && (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-muted-foreground">
                      No active habits yet. Create one to get started!
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Habit Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {habits.map((habit) => (
          <Card key={habit.id} className="card-hover group">
            <CardHeader className="pb-2">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">{habit.icon || "🎯"}</span>
                  <div>
                    <CardTitle className="text-lg">{habit.name}</CardTitle>
                    {habit.description && (
                      <CardDescription className="line-clamp-1">{habit.description}</CardDescription>
                    )}
                  </div>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="opacity-0 group-hover:opacity-100 h-8 w-8">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => {
                      setEditingHabit(habit);
                      setDialogOpen(true);
                    }}>
                      <Edit className="mr-2 h-4 w-4" /> Edit
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      className="text-destructive"
                      onClick={() => handleDelete(habit.id)}
                    >
                      <Trash2 className="mr-2 h-4 w-4" /> Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-1 text-muted-foreground">
                  <Flame className="h-4 w-4 text-orange-500" />
                  <span>{habit.streak || 0} day streak</span>
                </div>
                <div 
                  className="h-2 w-2 rounded-full"
                  style={{ backgroundColor: habit.color || "#22c55e" }}
                />
              </div>
            </CardContent>
          </Card>
        ))}

        {habits.length === 0 && !isLoading && (
          <Card 
            className="card-hover cursor-pointer border-dashed" 
            onClick={() => { setEditingHabit(null); setDialogOpen(true); }}
          >
            <CardContent className="pt-6">
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <div className="p-3 rounded-full bg-muted mb-3">
                  <Flame className="h-6 w-6 text-muted-foreground" />
                </div>
                <h3 className="font-medium">Create your first habit</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Start building consistency today
                </p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      <HabitDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        habit={editingHabit}
        onSave={editingHabit ? handleUpdate : handleCreate}
      />
    </div>
  );
}
