import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { Tables, TablesInsert, TablesUpdate } from "@/integrations/supabase/types";

type Habit = Tables<"habits">;
type HabitInsert = TablesInsert<"habits">;
type HabitUpdate = TablesUpdate<"habits">;
type HabitCompletion = Tables<"habit_completions">;

export function useHabits() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const habitsQuery = useQuery({
    queryKey: ["habits", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from("habits")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      return data as Habit[];
    },
    enabled: !!user,
  });

  const createHabit = useMutation({
    mutationFn: async (habit: Omit<HabitInsert, "user_id">) => {
      if (!user) throw new Error("Not authenticated");
      const { data, error } = await supabase
        .from("habits")
        .insert({ ...habit, user_id: user.id })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["habits"] });
    },
  });

  const updateHabit = useMutation({
    mutationFn: async ({ id, ...updates }: HabitUpdate & { id: string }) => {
      const { data, error } = await supabase
        .from("habits")
        .update(updates)
        .eq("id", id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["habits"] });
    },
  });

  const deleteHabit = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("habits")
        .delete()
        .eq("id", id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["habits"] });
    },
  });

  // Completions
  const getCompletionsForWeek = useQuery({
    queryKey: ["habit_completions", user?.id, "week"],
    queryFn: async () => {
      if (!user) return [];
      const today = new Date();
      const weekStart = new Date(today);
      weekStart.setDate(today.getDate() - today.getDay());
      weekStart.setHours(0, 0, 0, 0);

      const { data, error } = await supabase
        .from("habit_completions")
        .select("*")
        .eq("user_id", user.id)
        .gte("completed_date", weekStart.toISOString().split("T")[0]);
      
      if (error) throw error;
      return data as HabitCompletion[];
    },
    enabled: !!user,
  });

  const toggleCompletion = useMutation({
    mutationFn: async ({ habitId, date }: { habitId: string; date: string }) => {
      if (!user) throw new Error("Not authenticated");
      
      // Check if completion exists
      const { data: existing } = await supabase
        .from("habit_completions")
        .select("id")
        .eq("habit_id", habitId)
        .eq("completed_date", date)
        .eq("user_id", user.id)
        .single();

      if (existing) {
        // Remove completion
        const { error } = await supabase
          .from("habit_completions")
          .delete()
          .eq("id", existing.id);
        if (error) throw error;
        return { action: "removed" };
      } else {
        // Add completion
        const { error } = await supabase
          .from("habit_completions")
          .insert({ habit_id: habitId, completed_date: date, user_id: user.id });
        if (error) throw error;
        return { action: "added" };
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["habit_completions"] });
      queryClient.invalidateQueries({ queryKey: ["habits"] });
    },
  });

  return {
    habits: habitsQuery.data ?? [],
    isLoading: habitsQuery.isLoading,
    createHabit,
    updateHabit,
    deleteHabit,
    completions: getCompletionsForWeek.data ?? [],
    toggleCompletion,
  };
}
