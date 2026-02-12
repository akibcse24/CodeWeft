import { useState, useEffect, useCallback, useMemo } from "react";
import { useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { Tables, TablesInsert, TablesUpdate } from "@/integrations/supabase/types";
import { db } from "@/lib/db";

type Secret = Tables<"secrets_vault">;
type SecretInsert = TablesInsert<"secrets_vault">;
type SecretUpdate = TablesUpdate<"secrets_vault">;

export function useSecrets() {
  const { user } = useAuth();
  const [localSecrets, setLocalSecrets] = useState<Secret[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchLocal = useCallback(async () => {
    if (!user) return;
    const all = await db.secrets_vault.where("user_id").equals(user.id).and(s => !s.deleted_at).reverse().sortBy("updated_at");
    setLocalSecrets(all);
    setIsLoading(false);
  }, [user]);

  useEffect(() => { fetchLocal(); }, [fetchLocal]);

  // One-time hydration: only when Dexie is empty
  useEffect(() => {
    if (!user) return;
    const hydrate = async () => {
      const count = await db.secrets_vault.where("user_id").equals(user.id).count();
      if (count > 0) return;
      try {
        const { data } = await supabase.from("secrets_vault").select("*").eq("user_id", user.id).is("deleted_at", null);
        if (data?.length) { await db.secrets_vault.bulkPut(data as Secret[]); await fetchLocal(); }
      } catch { /* offline */ }
    };
    hydrate();
  }, [user, fetchLocal]);

  const createSecret = useMutation({
    mutationFn: async (secret: Omit<SecretInsert, "user_id">) => {
      if (!user) throw new Error("Not authenticated");
      const id = crypto.randomUUID();
      const now = new Date().toISOString();
      const rec = { id, ...secret, user_id: user.id, created_at: now, updated_at: now, deleted_at: null } as Secret;
      await db.secrets_vault.add(rec);
      await fetchLocal();
      db.sync_queue.add({ table: 'secrets_vault', action: 'insert', data: rec, timestamp: Date.now() });
      supabase.from("secrets_vault").insert([rec]).then(({ error }) => { if (error) console.warn("[secrets] bg insert:", error.message); });
      return rec;
    },
  });

  const updateSecret = useMutation({
    mutationFn: async ({ id, ...updates }: SecretUpdate & { id: string }) => {
      const fin = { ...updates, updated_at: new Date().toISOString() };
      await db.secrets_vault.update(id, fin);
      await fetchLocal();
      const cur = await db.secrets_vault.get(id);
      db.sync_queue.add({ table: 'secrets_vault', action: 'update', data: cur || { id, ...fin }, timestamp: Date.now() });
      supabase.from("secrets_vault").update(fin).eq("id", id).then(({ error }) => { if (error) console.warn("[secrets] bg update:", error.message); });
      return cur;
    },
  });

  const deleteSecret = useMutation({
    mutationFn: async (id: string) => {
      const now = new Date().toISOString();
      await db.secrets_vault.update(id, { deleted_at: now, updated_at: now });
      await fetchLocal();
      db.sync_queue.add({ table: 'secrets_vault', action: 'delete', data: { id, deleted_at: now }, timestamp: Date.now() });
      supabase.from("secrets_vault").update({ deleted_at: now }).eq("id", id).then(({ error }) => { if (error) console.warn("[secrets] bg delete:", error.message); });
    },
  });

  const categories = [...new Set(localSecrets.map(s => s.category).filter(Boolean) || [])];

  return useMemo(() => ({
    secrets: localSecrets,
    categories,
    isLoading: isLoading && localSecrets.length === 0,
    error: null,
    createSecret,
    updateSecret,
    deleteSecret,
  }), [localSecrets, categories, isLoading, createSecret, updateSecret, deleteSecret]);
}
