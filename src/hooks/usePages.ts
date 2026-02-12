import { useState, useEffect, useCallback, useMemo } from "react";
import { useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { Tables, TablesInsert, TablesUpdate, Json } from "@/integrations/supabase/types";
import { Block } from "@/types/editor.types";
import { db } from "@/lib/db";

type Page = Tables<"pages">;
type PageInsert = TablesInsert<"pages">;
type PageUpdate = TablesUpdate<"pages">;

export function usePages() {
  const { user } = useAuth();
  const [localPages, setLocalPages] = useState<Page[]>([]);
  const [localFavorites, setLocalFavorites] = useState<Page[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchLocal = useCallback(async () => {
    if (!user) return;
    const all = await db.pages.where("user_id").equals(user.id).and(p => !p.is_archived && !p.deleted_at).reverse().sortBy("updated_at");
    setLocalPages(all);
    setLocalFavorites(all.filter(p => p.is_favorite));
    setIsLoading(false);
  }, [user]);

  useEffect(() => { fetchLocal(); }, [fetchLocal]);

  // One-time hydration: only when Dexie is empty (fresh sign-in)
  useEffect(() => {
    if (!user) return;
    const hydrate = async () => {
      const count = await db.pages.where("user_id").equals(user.id).count();
      if (count > 0) return;
      try {
        const { data } = await supabase.from("pages").select("*").eq("user_id", user.id).eq("is_archived", false).is("deleted_at", null);
        if (data?.length) { await db.pages.bulkPut(data as Page[]); await fetchLocal(); }
      } catch { /* offline */ }
    };
    hydrate();
  }, [user, fetchLocal]);

  const getPagePath = useCallback(async (pageId: string): Promise<Page[]> => {
    const path: Page[] = [];
    const visitedIds = new Set<string>();
    let currentId: string | null = pageId;
    while (currentId && !visitedIds.has(currentId)) {
      visitedIds.add(currentId);
      let page = await db.pages.get(currentId);
      if (!page) {
        try {
          const { data } = await supabase.from("pages").select("*").eq("id", currentId).single();
          if (!data) break;
          page = data as Page;
          await db.pages.put(page);
        } catch { break; }
      }
      path.unshift(page);
      currentId = page.parent_id;
    }
    return path;
  }, []);

  const createPage = useMutation({
    mutationFn: async (page: Partial<Omit<PageInsert, "user_id">>) => {
      if (!user) throw new Error("Not authenticated");
      const id = crypto.randomUUID();
      const defaultContent: Block[] = [{ id: "1", type: "paragraph", content: "" }];
      const rec: Page = {
        id, title: page.title || "Untitled",
        content: (page.content || defaultContent) as unknown as Json,
        icon: page.icon || "📝", parent_id: page.parent_id || null,
        cover_url: page.cover_url || null, user_id: user.id,
        created_at: new Date().toISOString(), updated_at: new Date().toISOString(),
        is_archived: false, is_favorite: false, is_public: false, tags: [],
        deleted_at: null, search_content: null, search_vector: null,
      };
      await db.pages.add(rec);
      await fetchLocal();
      db.sync_queue.add({ table: 'pages', action: 'insert', data: rec, timestamp: Date.now() });
      supabase.from("pages").insert([rec]).then(({ error }) => { if (error) console.warn("[pages] bg insert:", error.message); });
      return rec;
    },
  });

  const updatePage = useMutation({
    mutationFn: async ({ id, ...updates }: PageUpdate & { id: string }) => {
      const fin = { ...updates, updated_at: new Date().toISOString() };
      await db.pages.update(id, fin);
      await fetchLocal();
      const cur = await db.pages.get(id);
      db.sync_queue.add({ table: 'pages', action: 'update', data: cur, timestamp: Date.now() });
      supabase.from("pages").update(fin).eq("id", id).then(({ error }) => { if (error) console.warn("[pages] bg update:", error.message); });
      return cur;
    },
  });

  const deletePage = useMutation({
    mutationFn: async (id: string) => {
      const now = new Date().toISOString();
      // Recursive soft delete — instant
      const getDescendantIds = async (parentId: string): Promise<string[]> => {
        const children = await db.pages.where('parent_id').equals(parentId).toArray();
        const childIds = children.map(c => c.id);
        const nestedIds = await Promise.all(childIds.map(getDescendantIds));
        return [...childIds, ...nestedIds.flat()];
      };
      const idsToDelete = [id, ...(await getDescendantIds(id))];
      await Promise.all(idsToDelete.map(pid => db.pages.update(pid, { deleted_at: now, updated_at: now })));
      await fetchLocal();
      db.sync_queue.add({ table: 'pages', action: 'delete', data: { id, deleted_at: now }, timestamp: Date.now() });
      // Fire-and-forget cloud RPC
      supabase.rpc('move_to_trash', { p_page_id: id }).then(({ error }) => { if (error) console.warn("[pages] bg delete:", error.message); });
    },
  });

  const toggleFavorite = useMutation({
    mutationFn: async ({ id, isFavorite }: { id: string; isFavorite: boolean }) => {
      const upd = { is_favorite: !isFavorite };
      await db.pages.update(id, upd);
      await fetchLocal();
      db.sync_queue.add({ table: 'pages', action: 'update', data: { id, ...upd }, timestamp: Date.now() });
      supabase.from("pages").update(upd).eq("id", id).then(({ error }) => { if (error) console.warn("[pages] bg fav:", error.message); });
    },
  });

  const togglePublic = useMutation({
    mutationFn: async ({ id, isPublic }: { id: string; isPublic: boolean }) => {
      const upd = { is_public: !isPublic };
      await db.pages.update(id, upd);
      await fetchLocal();
      db.sync_queue.add({ table: 'pages', action: 'update', data: { id, ...upd }, timestamp: Date.now() });
      supabase.from("pages").update(upd).eq("id", id).then(({ error }) => { if (error) console.warn("[pages] bg public:", error.message); });
    },
  });

  const movePage = useMutation({
    mutationFn: async ({ id, newParentId }: { id: string; newParentId: string | null }) => {
      const upd = { parent_id: newParentId };
      await db.pages.update(id, upd);
      await fetchLocal();
      db.sync_queue.add({ table: 'pages', action: 'update', data: { id, ...upd }, timestamp: Date.now() });
      supabase.from("pages").update(upd).eq("id", id).then(({ error }) => { if (error) console.warn("[pages] bg move:", error.message); });
    },
  });

  const searchPages = useCallback(async (query: string) => {
    if (!query) return [];
    const local = await db.pages.filter(p => p.title.toLowerCase().includes(query.toLowerCase()) && !p.is_archived && !p.deleted_at).limit(10).toArray();
    if (local.length > 0) return local;
    try {
      const { data } = await supabase.from("pages").select("*").eq("user_id", user?.id).ilike("title", `%${query}%`).limit(10);
      return (data as Page[]) || [];
    } catch { return []; }
  }, [user?.id]);

  return useMemo(() => ({
    pages: localPages, favoritePages: localFavorites,
    isLoading: isLoading && localPages.length === 0,
    getPagePath, createPage, updatePage, deletePage,
    toggleFavorite, togglePublic, movePage, searchPages,
  }), [localPages, localFavorites, isLoading, getPagePath, createPage, updatePage, deletePage, toggleFavorite, togglePublic, movePage, searchPages]);
}

// Single page hook — local-first
export function usePage(id: string) {
  const [localPage, setLocalPage] = useState<Page | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!id) { setIsLoading(false); return; }
    const load = async () => {
      const local = await db.pages.get(id);
      if (local) { setLocalPage(local as Page); setIsLoading(false); return; }
      // One-time cloud fetch if not in Dexie
      try {
        const { data } = await supabase.from("pages").select("*").eq("id", id).single();
        if (data) { await db.pages.put(data); setLocalPage(data as Page); }
      } catch { /* offline */ }
      setIsLoading(false);
    };
    load();
  }, [id]);

  return { data: localPage, isLoading, error: null };
}
