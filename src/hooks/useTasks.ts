import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
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

  // 1. Manual Observer for Dexie
  useEffect(() => {
    if (!user) return;

    const fetchLocal = async () => {
      const data = await db.tasks
        .where("user_id")
        .equals(user.id)
        .reverse()
        .sortBy("created_at");
      setLocalTasks(data);
    };

    fetchLocal();

    // Simple poll or custom event could work, but for now we'll update on mutations
    // Dexie also has a middleware system or hooks but this is the simplest without dependencies
  }, [user]);

  // Hook into Dexie changes (Crudely for now, better to use a real observer if possible)
  const refreshLocal = async () => {
    if (!user) return;
    const data = await db.tasks
      .where("user_id")
      .equals(user.id)
      .reverse()
      .sortBy("created_at");
    setLocalTasks(data);
  };

  // 2. Fetch from Cloud and populate local (Background Sync)
  const tasksQuery = useQuery({
    queryKey: ["tasks-cloud", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from("tasks")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Update local cache with cloud data
      if (data) {
        await db.tasks.bulkPut(data);
      }
      return data as Task[];
    },
    enabled: !!user,
  });

  const createTask = useMutation({
    mutationFn: async (task: Omit<TaskInsert, "user_id">) => {
      if (!user) throw new Error("Not authenticated");
      const id = crypto.randomUUID();
      const newTask = {
        ...task,
        id,
        user_id: user.id,
        created_at: new Date().toISOString(),
        status: task.status || 'todo'
      } as Task;

      // 1. Update Local Immediately
      await db.tasks.add(newTask);
      await refreshLocal();

      // 2. Queue for Sync
      await db.sync_queue.add({
        table: 'tasks',
        action: 'insert',
        data: newTask,
        timestamp: Date.now()
      });

      // 3. Attempt Background Cloud Sync
      try {
        const { error } = await supabase
          .from("tasks")
          .insert(newTask);

        if (!error) {
          // Success, cleanup queue entry
          // Use a find and delete approach since we don't have the sync_queue ID directly here
          const items = await db.sync_queue.where({ table: 'tasks' }).toArray();
          const target = items.find(i => i.data.id === newTask.id);
          if (target) await db.sync_queue.delete(target.id!);
        }
      } catch (e) {
        console.warn("Background sync failed, will retry later.");
      }

      return newTask;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks-cloud"] });
    },
  });

  const updateTask = useMutation({
    mutationFn: async ({ id, ...updates }: TaskUpdate & { id: string }) => {
      // 1. Update Local
      await db.tasks.update(id, updates);
      await refreshLocal();

      const currentTask = await db.tasks.get(id);

      // 2. Queue for Sync
      await db.sync_queue.add({
        table: 'tasks',
        action: 'update',
        data: currentTask,
        timestamp: Date.now()
      });

      // 3. Background Cloud Sync
      try {
        await supabase
          .from("tasks")
          .update(updates)
          .eq("id", id);
      } catch (e) {
        console.warn("Background update sync failed.");
      }

      return currentTask;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks-cloud"] });
    },
  });

  const deleteTask = useMutation({
    mutationFn: async (id: string) => {
      // 1. Local Delete
      await db.tasks.delete(id);
      await refreshLocal();

      // 2. Queue for Sync
      await db.sync_queue.add({
        table: 'tasks',
        action: 'delete',
        data: { id },
        timestamp: Date.now()
      });

      // 3. Background Sync
      try {
        await supabase.from("tasks").delete().eq("id", id);
      } catch (e) {
        console.warn("Background delete sync failed.");
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks-cloud"] });
    },
  });

  return {
    tasks: localTasks,
    isLoading: tasksQuery.isLoading && localTasks.length === 0,
    error: tasksQuery.error,
    createTask,
    updateTask,
    deleteTask,
  };
}
