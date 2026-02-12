import { useState, useEffect, useCallback, useMemo } from "react";
import { useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { Tables, TablesInsert, TablesUpdate } from "@/integrations/supabase/types";
import { Block } from "@/components/editor/BlockEditor";
import { db } from "@/lib/db";

type MLNote = Tables<"ml_notes">;
type MLNoteInsert = TablesInsert<"ml_notes">;
type MLNoteUpdate = TablesUpdate<"ml_notes">;

export function useMLNotes() {
  const { user } = useAuth();
  const [localNotes, setLocalNotes] = useState<MLNote[]>([]);
  const [localFavorites, setLocalFavorites] = useState<MLNote[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchLocal = useCallback(async () => {
    if (!user) return;
    const all = await db.ml_notes.where("user_id").equals(user.id).and(n => !n.deleted_at).reverse().sortBy("updated_at");
    setLocalNotes(all);
    setLocalFavorites(all.filter(n => n.is_favorite));
    setIsLoading(false);
  }, [user]);

  useEffect(() => { fetchLocal(); }, [fetchLocal]);

  // One-time hydration: only when Dexie is empty
  useEffect(() => {
    if (!user) return;
    const hydrate = async () => {
      const count = await db.ml_notes.where("user_id").equals(user.id).count();
      if (count > 0) return;
      try {
        const { data } = await supabase.from("ml_notes").select("*").eq("user_id", user.id).is("deleted_at", null);
        if (data?.length) { await db.ml_notes.bulkPut(data as MLNote[]); await fetchLocal(); }
      } catch { /* offline */ }
    };
    hydrate();
  }, [user, fetchLocal]);

  const createNote = useMutation({
    mutationFn: async (note: Partial<Omit<MLNoteInsert, "user_id">>) => {
      if (!user) throw new Error("Not authenticated");
      const id = crypto.randomUUID();
      const defaultContent: Block[] = [{ id: "1", type: "paragraph", content: "" }];
      const now = new Date().toISOString();
      const rec: MLNote = {
        id, title: note.title || "Untitled",
        content: typeof note.content === 'string' ? note.content : JSON.stringify(note.content || defaultContent),
        category: note.category || "general", tags: (note.tags || []) as string[],
        icon: note.icon || "🧠", user_id: user.id, is_favorite: false,
        created_at: now, updated_at: now, deleted_at: null,
      };
      await db.ml_notes.add(rec);
      await fetchLocal();
      db.sync_queue.add({ table: 'ml_notes', action: 'insert', data: rec, timestamp: Date.now() });
      supabase.from("ml_notes").insert([rec]).then(({ error }) => { if (error) console.warn("[ml_notes] bg insert:", error.message); });
      return rec;
    },
  });

  const updateNote = useMutation({
    mutationFn: async ({ id, ...updates }: MLNoteUpdate & { id: string }) => {
      const fin = { ...updates, updated_at: new Date().toISOString() };
      await db.ml_notes.update(id, fin);
      await fetchLocal();
      const cur = await db.ml_notes.get(id);
      db.sync_queue.add({ table: 'ml_notes', action: 'update', data: cur || { id, ...fin }, timestamp: Date.now() });
      supabase.from("ml_notes").update(fin).eq("id", id).then(({ error }) => { if (error) console.warn("[ml_notes] bg update:", error.message); });
      return cur;
    },
  });

  const deleteNote = useMutation({
    mutationFn: async (id: string) => {
      const now = new Date().toISOString();
      await db.ml_notes.update(id, { deleted_at: now, updated_at: now });
      await fetchLocal();
      db.sync_queue.add({ table: 'ml_notes', action: 'delete', data: { id, deleted_at: now }, timestamp: Date.now() });
      supabase.from("ml_notes").update({ deleted_at: now }).eq("id", id).then(({ error }) => { if (error) console.warn("[ml_notes] bg delete:", error.message); });
    },
  });

  const toggleFavorite = useMutation({
    mutationFn: async ({ id, isFavorite }: { id: string; isFavorite: boolean }) => {
      const upd = { is_favorite: !isFavorite, updated_at: new Date().toISOString() };
      await db.ml_notes.update(id, upd);
      await fetchLocal();
      db.sync_queue.add({ table: 'ml_notes', action: 'update', data: { id, ...upd }, timestamp: Date.now() });
      supabase.from("ml_notes").update(upd).eq("id", id).then(({ error }) => { if (error) console.warn("[ml_notes] bg fav:", error.message); });
    },
  });

  const categories = [...new Set(localNotes.map(n => n.category).filter(Boolean) || [])];
  const allTags = [...new Set(localNotes.flatMap(n => (n.tags as string[]) || []) || [])];

  return useMemo(() => ({
    notes: localNotes, favoriteNotes: localFavorites, categories, allTags,
    isLoading: isLoading && localNotes.length === 0, error: null,
    createNote, updateNote, deleteNote, toggleFavorite,
  }), [localNotes, localFavorites, categories, allTags, isLoading, createNote, updateNote, deleteNote, toggleFavorite]);
}
