import { useState, useEffect, useCallback, useMemo } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { Tables, TablesInsert, TablesUpdate } from "@/integrations/supabase/types";
import { db } from "@/lib/db";

type Project = Tables<"projects">;
type ProjectInsert = TablesInsert<"projects">;
type ProjectUpdate = TablesUpdate<"projects">;

export function useProjects() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [localProjects, setLocalProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // 1. Manual Observer/Fetcher for Dexie
  const refreshLocal = useCallback(async () => {
    if (!user) return;
    const data = await db.projects
      .where("user_id")
      .equals(user.id)
      .filter(p => !p.deleted_at)
      .reverse()
      .sortBy("created_at");
    setLocalProjects(data);
    setIsLoading(false);
  }, [user]);

  useEffect(() => {
    refreshLocal();
  }, [refreshLocal]);

  // 2. One-time Hydration
  useEffect(() => {
    if (!user) return;
    const hydrate = async () => {
      const count = await db.projects.where("user_id").equals(user.id).count();
      if (count > 0) return; // Already have data

      try {
        const { data } = await supabase
          .from("projects")
          .select("*")
          .eq("user_id", user.id)
          .is("deleted_at", null)
          .order("created_at", { ascending: false });

        if (data && data.length > 0) {
          await db.projects.bulkPut(data as Project[]);
          await refreshLocal();
        }
      } catch (e) {
        console.warn("[useProjects] Hydration failed", e);
      }
    };
    hydrate();
  }, [user, refreshLocal]);

  const createProject = useMutation({
    mutationFn: async (project: Omit<ProjectInsert, "user_id">) => {
      if (!user) throw new Error("Not authenticated");
      const id = crypto.randomUUID();
      const newProject = {
        ...project,
        id,
        user_id: user.id,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        deleted_at: null,
      } as Project;

      // 1. Local
      await db.projects.add(newProject);
      await refreshLocal();

      // 2. Queue for Sync
      await db.sync_queue.add({
        table: 'projects',
        action: 'insert',
        data: newProject,
        timestamp: Date.now()
      });

      // 3. Fire-and-Forget Cloud Sync
      supabase.from("projects").insert(newProject).then(({ error }) => {
        if (error) console.warn("[useProjects] Background insert failed:", error);
      });

      return newProject;
    },
  });

  const updateProject = useMutation({
    mutationFn: async ({ id, ...updates }: ProjectUpdate & { id: string }) => {
      const updated_at = new Date().toISOString();
      const finalUpdates = { ...updates, updated_at };

      // 1. Local
      await db.projects.update(id, finalUpdates);
      await refreshLocal();

      const current = await db.projects.get(id);

      // 2. Queue for Sync
      if (current) {
        await db.sync_queue.add({
          table: 'projects',
          action: 'update',
          data: current as Record<string, unknown>,
          timestamp: Date.now()
        });
      }

      // 3. Fire-and-Forget Cloud Sync
      supabase.from("projects").update(finalUpdates).eq("id", id).then(({ error }) => {
        if (error) console.warn("[useProjects] Background update failed:", error);
      });

      return current;
    },
  });

  const deleteProject = useMutation({
    mutationFn: async (id: string) => {
      const now = new Date().toISOString();

      // 1. Local Soft Delete
      await db.projects.update(id, { deleted_at: now, updated_at: now });
      await refreshLocal();

      // 2. Queue for Sync
      await db.sync_queue.add({
        table: 'projects',
        action: 'delete',
        data: { id, deleted_at: now },
        timestamp: Date.now()
      });

      // 3. Fire-and-Forget Cloud Sync
      supabase.from("projects").update({ deleted_at: now }).eq("id", id).then(({ error }) => {
        if (error) console.warn("[useProjects] Background delete failed:", error);
      });
    },
  });

  return useMemo(() => ({
    projects: localProjects,
    isLoading: isLoading && localProjects.length === 0,
    error: null,
    createProject,
    updateProject,
    deleteProject,
  }), [localProjects, isLoading, createProject, updateProject, deleteProject]);
}
