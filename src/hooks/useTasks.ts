import { useState, useEffect, useCallback, useMemo } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { Tables, TablesInsert, TablesUpdate } from "@/integrations/supabase/types";
import { db } from "@/lib/db";

export type Task = Tables<"tasks">;
export type TaskInsert = TablesInsert<"tasks">;
export type TaskUpdate = TablesUpdate<"tasks">;

export function useTasks() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [localTasks, setLocalTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // 1. Manual Observer for Dexie
  const fetchLocal = useCallback(async () => {
    if (!user) return;
    const data = await db.tasks
      .where("user_id")
      .equals(user.id)
      .filter(t => !t.deleted_at)
      .reverse()
      .sortBy("created_at");
    setLocalTasks(data);
    setIsLoading(false);
  }, [user]);

  useEffect(() => {
    fetchLocal();
  }, [fetchLocal]);

  // 2. One-time Hydration
  useEffect(() => {
    if (!user) return;
    const hydrate = async () => {
      const count = await db.tasks.where("user_id").equals(user.id).count();
      if (count > 0) return; // Already have data

      try {
        const { data } = await supabase
          .from("tasks")
          .select("*")
          .eq("user_id", user.id)
          .is("deleted_at", null)
          .order("created_at", { ascending: false });

        if (data && data.length > 0) {
          await db.tasks.bulkPut(data as Task[]);
          await fetchLocal();
        }
      } catch (e) {
        // Offline or error, just use local
        console.warn("[useTasks] Hydration failed", e);
      }
    };
    hydrate();
  }, [user, fetchLocal]);

  const createTask = useMutation({
    mutationFn: async (task: Omit<TaskInsert, "user_id">) => {
      if (!user) throw new Error("Not authenticated");
      const id = crypto.randomUUID();
      const newTask = {
        ...task,
        id,
        user_id: user.id,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        deleted_at: null,
        status: task.status || 'todo',
        priority: task.priority || 'medium' // Ensure priority is set
      } as Task;

      // 1. Update Local Immediately
      await db.tasks.add(newTask);
      await fetchLocal();

      // 2. Queue for Sync
      await db.sync_queue.add({
        table: 'tasks',
        action: 'insert',
        data: newTask,
        timestamp: Date.now()
      });

      // 3. Fire-and-Forget Cloud Sync
      supabase.from("tasks").insert(newTask).then(({ error }) => {
        if (error) console.warn("[useTasks] Background insert failed:", error);
      });

      return newTask;
    },
    onSuccess: () => {
      // No need to invalidate queries as we drive from local state
    },
  });

  const updateTask = useMutation({
    mutationFn: async ({ id, ...updates }: TaskUpdate & { id: string }) => {
      const updated_at = new Date().toISOString();
      const finalUpdates = { ...updates, updated_at };

      // 1. Update Local
      await db.tasks.update(id, finalUpdates);
      await fetchLocal();

      const currentTask = await db.tasks.get(id);

      // 2. Queue for Sync
      if (currentTask) {
        await db.sync_queue.add({
          table: 'tasks',
          action: 'update',
          data: currentTask,
          timestamp: Date.now()
        });
      }

      // 3. Fire-and-Forget Cloud Sync
      supabase.from("tasks").update(finalUpdates).eq("id", id).then(({ error }) => {
        if (error) console.warn("[useTasks] Background update failed:", error);
      });

      return currentTask;
    },
  });

  const deleteTask = useMutation({
    mutationFn: async (id: string) => {
      const now = new Date().toISOString();

      // 1. Local Soft Delete
      await db.tasks.update(id, { deleted_at: now, updated_at: now });
      await fetchLocal();

      // 2. Queue for Sync
      await db.sync_queue.add({
        table: 'tasks',
        action: 'delete',
        data: { id, deleted_at: now },
        timestamp: Date.now()
      });

      // 3. Fire-and-Forget Cloud Sync
      supabase.from("tasks").update({ deleted_at: now }).eq("id", id).then(({ error }) => {
        if (error) console.warn("[useTasks] Background delete failed:", error);
      });
    },
  });

  return useMemo(() => ({
    tasks: localTasks,
    isLoading: isLoading && localTasks.length === 0,
    error: null,
    createTask,
    updateTask,
    deleteTask,
  }), [localTasks, isLoading, createTask, updateTask, deleteTask]);
}
