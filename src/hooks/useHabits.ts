import { useState, useEffect, useCallback, useMemo } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { Tables, TablesInsert, TablesUpdate } from "@/integrations/supabase/types";
import { db } from "@/lib/db";

type Habit = Tables<"habits">;
type HabitInsert = TablesInsert<"habits">;
type HabitUpdate = TablesUpdate<"habits">;
type HabitCompletion = Tables<"habit_completions">;

export function useHabits() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [localHabits, setLocalHabits] = useState<Habit[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchLocal = useCallback(async () => {
    if (!user) return;
    const all = await db.habits.where("user_id").equals(user.id).and(h => !h.deleted_at).reverse().sortBy("updated_at");
    setLocalHabits(all);
    setIsLoading(false);
  }, [user]);

  useEffect(() => { fetchLocal(); }, [fetchLocal]);

  // One-time hydration: only when Dexie is empty
  useEffect(() => {
    if (!user) return;
    const hydrate = async () => {
      const count = await db.habits.where("user_id").equals(user.id).count();
      if (count > 0) return;
      try {
        const { data } = await supabase.from("habits").select("*").eq("user_id", user.id).is("deleted_at", null);
        if (data?.length) { await db.habits.bulkPut(data as Habit[]); await fetchLocal(); }
      } catch { /* offline */ }
    };
    hydrate();
  }, [user, fetchLocal]);

  const createHabit = useMutation({
    mutationFn: async (habit: Omit<HabitInsert, "user_id">) => {
      if (!user) throw new Error("Not authenticated");
      const id = crypto.randomUUID();
      const now = new Date().toISOString();
      const rec = { id, ...habit, user_id: user.id, created_at: now, updated_at: now, deleted_at: null } as Habit;
      await db.habits.add(rec);
      await fetchLocal();
      db.sync_queue.add({ table: 'habits', action: 'insert', data: rec, timestamp: Date.now() });
      supabase.from("habits").insert([rec]).then(({ error }) => { if (error) console.warn("[habits] bg insert:", error.message); });
      return rec;
    },
  });

  const updateHabit = useMutation({
    mutationFn: async ({ id, ...updates }: HabitUpdate & { id: string }) => {
      const fin = { ...updates, updated_at: new Date().toISOString() };
      await db.habits.update(id, fin);
      await fetchLocal();
      const cur = await db.habits.get(id);
      db.sync_queue.add({ table: 'habits', action: 'update', data: cur || { id, ...fin }, timestamp: Date.now() });
      supabase.from("habits").update(fin).eq("id", id).then(({ error }) => { if (error) console.warn("[habits] bg update:", error.message); });
      return cur;
    },
  });

  const deleteHabit = useMutation({
    mutationFn: async (id: string) => {
      const now = new Date().toISOString();
      await db.habits.update(id, { deleted_at: now, updated_at: now });
      await fetchLocal();
      db.sync_queue.add({ table: 'habits', action: 'delete', data: { id, deleted_at: now }, timestamp: Date.now() });
      supabase.from("habits").update({ deleted_at: now }).eq("id", id).then(({ error }) => { if (error) console.warn("[habits] bg delete:", error.message); });
    },
  });

  // Completions — these are small toggle operations, local-first via Dexie too
  const [localCompletions, setLocalCompletions] = useState<HabitCompletion[]>([]);

  const fetchCompletions = useCallback(async () => {
    if (!user) return;
    const today = new Date();
    const weekStart = new Date(today);
    weekStart.setDate(today.getDate() - today.getDay());
    weekStart.setHours(0, 0, 0, 0);
    const weekStartStr = weekStart.toISOString().split("T")[0];

    const all = await db.habit_completions
      .where("user_id").equals(user.id)
      .and(c => c.completed_date >= weekStartStr)
      .toArray();
    setLocalCompletions(all);
  }, [user]);

  useEffect(() => { fetchCompletions(); }, [fetchCompletions]);

  // One-time hydration for completions
  useEffect(() => {
    if (!user) return;
    const hydrate = async () => {
      const count = await db.habit_completions.where("user_id").equals(user.id).count();
      if (count > 0) return;
      try {
        const today = new Date();
        const weekStart = new Date(today);
        weekStart.setDate(today.getDate() - today.getDay());
        const { data } = await supabase.from("habit_completions").select("*").eq("user_id", user.id).gte("completed_date", weekStart.toISOString().split("T")[0]);
        if (data?.length) { await db.habit_completions.bulkPut(data as HabitCompletion[]); await fetchCompletions(); }
      } catch { /* offline */ }
    };
    hydrate();
  }, [user, fetchCompletions]);

  const toggleCompletion = useMutation({
    mutationFn: async ({ habitId, date }: { habitId: string; date: string }) => {
      if (!user) throw new Error("Not authenticated");

      // Check locally first
      const existing = await db.habit_completions
        .where({ habit_id: habitId, completed_date: date, user_id: user.id })
        .first();

      if (existing) {
        await db.habit_completions.delete(existing.id);
        await fetchCompletions();
        db.sync_queue.add({ table: 'habit_completions', action: 'delete', data: { id: existing.id }, timestamp: Date.now() });
        supabase.from("habit_completions").delete().eq("id", existing.id).then(({ error }) => { if (error) console.warn("[habits] bg completion delete:", error.message); });
        return { action: "removed" };
      } else {
        const id = crypto.randomUUID();
        const rec = { id, habit_id: habitId, completed_date: date, user_id: user.id, created_at: new Date().toISOString() } as HabitCompletion;
        await db.habit_completions.add(rec);
        await fetchCompletions();
        db.sync_queue.add({ table: 'habit_completions', action: 'insert', data: rec, timestamp: Date.now() });
        supabase.from("habit_completions").insert(rec).then(({ error }) => { if (error) console.warn("[habits] bg completion insert:", error.message); });
        return { action: "added" };
      }
    },
  });

  return useMemo(() => ({
    habits: localHabits,
    isLoading: isLoading && localHabits.length === 0,
    createHabit,
    updateHabit,
    deleteHabit,
    completions: localCompletions,
    toggleCompletion,
  }), [localHabits, isLoading, localCompletions, createHabit, updateHabit, deleteHabit, toggleCompletion]);
}
