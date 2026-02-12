import { useState, useEffect, useCallback, useMemo } from "react";
import { useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { Tables, TablesInsert, TablesUpdate } from "@/integrations/supabase/types";
import { db } from "@/lib/db";

type Resource = Tables<"resources">;
type ResourceInsert = TablesInsert<"resources">;
type ResourceUpdate = TablesUpdate<"resources">;

export function useResources() {
  const { user } = useAuth();
  const [localResources, setLocalResources] = useState<Resource[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchLocal = useCallback(async () => {
    if (!user) return;
    const all = await db.resources.where("user_id").equals(user.id).and(r => !r.deleted_at).reverse().sortBy("updated_at");
    setLocalResources(all);
    setIsLoading(false);
  }, [user]);

  useEffect(() => { fetchLocal(); }, [fetchLocal]);

  // One-time hydration: only when Dexie is empty
  useEffect(() => {
    if (!user) return;
    const hydrate = async () => {
      const count = await db.resources.where("user_id").equals(user.id).count();
      if (count > 0) return;
      try {
        const { data } = await supabase.from("resources").select("*").eq("user_id", user.id).is("deleted_at", null);
        if (data?.length) { await db.resources.bulkPut(data as Resource[]); await fetchLocal(); }
      } catch { /* offline */ }
    };
    hydrate();
  }, [user, fetchLocal]);

  const createResource = useMutation({
    mutationFn: async (resource: Omit<ResourceInsert, "user_id">) => {
      if (!user) throw new Error("Not authenticated");
      const id = crypto.randomUUID();
      const now = new Date().toISOString();
      const rec = { id, ...resource, user_id: user.id, created_at: now, updated_at: now, deleted_at: null } as Resource;
      await db.resources.add(rec);
      await fetchLocal();
      db.sync_queue.add({ table: 'resources', action: 'insert', data: rec, timestamp: Date.now() });
      supabase.from("resources").insert([rec]).then(({ error }) => { if (error) console.warn("[resources] bg insert:", error.message); });
      return rec;
    },
  });

  const updateResource = useMutation({
    mutationFn: async ({ id, ...updates }: ResourceUpdate & { id: string }) => {
      const fin = { ...updates, updated_at: new Date().toISOString() };
      await db.resources.update(id, fin);
      await fetchLocal();
      const cur = await db.resources.get(id);
      db.sync_queue.add({ table: 'resources', action: 'update', data: cur || { id, ...fin }, timestamp: Date.now() });
      supabase.from("resources").update(fin).eq("id", id).then(({ error }) => { if (error) console.warn("[resources] bg update:", error.message); });
      return cur;
    },
  });

  const deleteResource = useMutation({
    mutationFn: async (id: string) => {
      const now = new Date().toISOString();
      await db.resources.update(id, { deleted_at: now, updated_at: now });
      await fetchLocal();
      db.sync_queue.add({ table: 'resources', action: 'delete', data: { id, deleted_at: now }, timestamp: Date.now() });
      supabase.from("resources").update({ deleted_at: now }).eq("id", id).then(({ error }) => { if (error) console.warn("[resources] bg delete:", error.message); });
    },
  });

  const categories = [...new Set(localResources.map(r => r.category).filter(Boolean) || [])];
  const allTags = [...new Set(localResources.flatMap(r => (r.tags as string[]) || []) || [])];
  const types = [...new Set(localResources.map(r => r.type).filter(Boolean) || [])];

  return useMemo(() => ({
    resources: localResources,
    categories,
    allTags,
    types,
    isLoading: isLoading && localResources.length === 0,
    error: null,
    createResource,
    updateResource,
    deleteResource,
  }), [localResources, categories, allTags, types, isLoading, createResource, updateResource, deleteResource]);
}
