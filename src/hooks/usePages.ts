import { useState, useEffect, useCallback, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
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
  const queryClient = useQueryClient();
  const [localPages, setLocalPages] = useState<Page[]>([]);
  const [localFavorites, setLocalFavorites] = useState<Page[]>([]);

  const fetchLocal = useCallback(async () => {
    if (!user) return;
    const all = await db.pages
      .where("user_id")
      .equals(user.id)
      .and(p => !p.is_archived)
      .reverse()
      .sortBy("updated_at");

    setLocalPages(all);
    setLocalFavorites(all.filter(p => p.is_favorite));
  }, [user]);

  useEffect(() => {
    fetchLocal();
  }, [fetchLocal]);

  const pagesQuery = useQuery({
    queryKey: ["pages-cloud", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from("pages")
        .select("*")
        .eq("user_id", user.id)
        .eq("is_archived", false)
        .order("updated_at", { ascending: false });

      if (error) throw error;
      return data as Page[];
    },
    enabled: !!user,
  });

  const getPagePath = async (pageId: string): Promise<Page[]> => {
    const path: Page[] = [];
    let currentId: string | null = pageId;

    while (currentId) {
      // Check local first
      let page = await db.pages.get(currentId);

      if (!page) {
        const { data, error } = await supabase
          .from("pages")
          .select("*")
          .eq("id", currentId)
          .single();
        if (error || !data) break;
        page = data as Page;
        await db.pages.put(page);
      }

      path.unshift(page);
      currentId = page.parent_id;
    }

    return path;
  };

  const createPage = useMutation({
    mutationFn: async (page: Partial<Omit<PageInsert, "user_id">>) => {
      if (!user) throw new Error("Not authenticated");
      const id = crypto.randomUUID();
      const defaultContent: Block[] = [{ id: "1", type: "paragraph", content: "" }];

      const newPage: Page = {
        id,
        title: page.title || "Untitled",
        content: (page.content || defaultContent) as unknown as Json,
        icon: page.icon || "📝",
        parent_id: page.parent_id || null,
        cover_url: page.cover_url || null,
        user_id: user.id,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        is_archived: false,
        is_favorite: false,
        is_public: false,
        tags: [],
        // Server-generated columns (filled by trigger, nulled here for type safety)
        search_content: null,
        search_vector: null,
      };

      // 1. Local
      await db.pages.add(newPage);
      await fetchLocal();

      // 2. Queue
      await db.sync_queue.add({
        table: 'pages',
        action: 'insert',
        data: newPage,
        timestamp: Date.now()
      });

      // Sync queue handles cloud push
      return newPage;
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["pages-cloud"] });
    },
  });

  const updatePage = useMutation({
    mutationFn: async ({ id, ...updates }: PageUpdate & { id: string }) => {
      const updated_at = new Date().toISOString();
      const finalUpdates = { ...updates, updated_at };

      // 1. Local
      await db.pages.update(id, finalUpdates);
      await fetchLocal();

      const current = await db.pages.get(id);

      // 2. Queue
      await db.sync_queue.add({
        table: 'pages',
        action: 'update',
        data: current,
        timestamp: Date.now()
      });

      // Sync queue handles cloud push
      return current;
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["pages-cloud"] });
    },
  });

  const deletePage = useMutation({
    mutationFn: async (id: string) => {
      // 1. Local (Archive)
      await db.pages.update(id, { is_archived: true });
      await fetchLocal();

      // 2. Queue
      await db.sync_queue.add({
        table: 'pages',
        action: 'update',
        data: { id, is_archived: true },
        timestamp: Date.now()
      });

      // Sync queue handles cloud push
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["pages-cloud"] });
    },
  });

  const toggleFavorite = useMutation({
    mutationFn: async ({ id, isFavorite }: { id: string; isFavorite: boolean }) => {
      const updates = { is_favorite: !isFavorite };

      // 1. Local
      await db.pages.update(id, updates);
      await fetchLocal();

      // 2. Queue
      await db.sync_queue.add({
        table: 'pages',
        action: 'update',
        data: { id, ...updates },
        timestamp: Date.now()
      });

      // Sync queue handles cloud push
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["pages-cloud"] });
    },
  });

  const togglePublic = useMutation({
    mutationFn: async ({ id, isPublic }: { id: string; isPublic: boolean }) => {
      const updates = { is_public: !isPublic };

      // 1. Local
      await db.pages.update(id, updates);
      await fetchLocal();

      // 2. Queue
      await db.sync_queue.add({
        table: 'pages',
        action: 'update',
        data: { id, ...updates },
        timestamp: Date.now()
      });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["pages-cloud"] });
    },
  });

  const movePage = useMutation({
    mutationFn: async ({ id, newParentId }: { id: string; newParentId: string | null }) => {
      const updates = { parent_id: newParentId };

      // 1. Local
      await db.pages.update(id, updates);
      await fetchLocal();

      // 2. Queue
      await db.sync_queue.add({
        table: 'pages',
        action: 'update',
        data: { id, ...updates },
        timestamp: Date.now()
      });

      // Sync queue handles cloud push
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["pages-cloud"] });
    },
  });

  const searchPages = async (query: string) => {
    if (!query) return [];
    // Local search first
    const localResults = await db.pages
      .filter(p => p.title.toLowerCase().includes(query.toLowerCase()) && !p.is_archived)
      .limit(10)
      .toArray();

    if (localResults.length > 0) return localResults;

    const { data } = await supabase
      .from("pages")
      .select("*")
      .eq("user_id", user?.id)
      .ilike("title", `%${query}%`)
      .order("updated_at", { ascending: false })
      .limit(10);

    return (data as Page[]) || [];
  };

  return useMemo(() => ({
    pages: localPages,
    favoritePages: localFavorites,
    isLoading: pagesQuery.isLoading && localPages.length === 0,
    getPagePath,
    createPage,
    updatePage,
    deletePage,
    toggleFavorite,
    togglePublic,
    movePage,
    searchPages,
  }), [localPages, localFavorites, pagesQuery.isLoading, getPagePath, createPage, updatePage, deletePage, toggleFavorite, togglePublic, movePage, searchPages]);
}

export function usePage(id: string) {
  const { user } = useAuth();
  const [localPage, setLocalPage] = useState<Page | null>(null);

  useEffect(() => {
    if (id) {
      db.pages.get(id).then(setLocalPage);
    }
  }, [id]);

  const query = useQuery({
    queryKey: ["pages", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("pages")
        .select("*")
        .eq("id", id)
        .single();

      if (error) throw error;
      return data as Page;
    },
    enabled: !!id,
  });

  return {
    ...query,
    data: localPage || query.data
  };
}
