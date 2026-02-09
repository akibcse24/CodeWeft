import { supabase } from "@/integrations/supabase/client";
import { db } from "@/lib/db";
import { Tables } from "@/integrations/supabase/types";

type Page = Tables<"pages">;

export interface DeletedPage extends Page {
  deleted_at?: string;
}

export class TrashService {
  private static instance: TrashService;

  static getInstance(): TrashService {
    if (!TrashService.instance) {
      TrashService.instance = new TrashService();
    }
    return TrashService.instance;
  }

  async deletePage(pageId: string, userId: string): Promise<void> {
    const updates = {
      is_archived: true,
      updated_at: new Date().toISOString(),
    };

    await db.pages.update(pageId, updates);

    await db.sync_queue.add({
      table: "pages",
      action: "update",
      data: { id: pageId, ...updates },
      timestamp: Date.now(),
    });

    try {
      const { error } = await supabase
        .from("pages")
        .update(updates)
        .eq("id", pageId)
        .eq("user_id", userId);

      if (error) throw error;
    } catch (e) {
      console.warn("Background soft delete sync deferred.", e);
    }
  }

  async restorePage(pageId: string, userId: string): Promise<void> {
    const updates = {
      is_archived: false,
      updated_at: new Date().toISOString(),
    };

    await db.pages.update(pageId, updates);

    await db.sync_queue.add({
      table: "pages",
      action: "update",
      data: { id: pageId, ...updates },
      timestamp: Date.now(),
    });

    try {
      const { error } = await supabase
        .from("pages")
        .update(updates)
        .eq("id", pageId)
        .eq("user_id", userId);

      if (error) throw error;
    } catch (e) {
      console.warn("Background restore sync deferred.", e);
    }
  }

  async permanentlyDelete(pageId: string, userId: string): Promise<void> {
    const childIds = await this.getAllChildIds(pageId);
    const allIds = [pageId, ...childIds];

    for (const id of allIds) {
      await db.pages.delete(id);
    }

    await db.sync_queue.add({
      table: "pages",
      action: "delete",
      data: { ids: allIds },
      timestamp: Date.now(),
    });

    try {
      const { error } = await supabase
        .from("pages")
        .delete()
        .in("id", allIds)
        .eq("user_id", userId);

      if (error) throw error;
    } catch (e) {
      console.warn("Background permanent delete sync deferred.", e);
    }
  }

  async listDeleted(userId: string): Promise<DeletedPage[]> {
    const localDeleted = await db.pages
      .where("user_id")
      .equals(userId)
      .and((p) => p.is_archived === true)
      .reverse()
      .sortBy("updated_at");

    if (localDeleted.length > 0) {
      return localDeleted.map((p) => ({
        ...p,
        deleted_at: p.updated_at,
      }));
    }

    try {
      const { data, error } = await supabase
        .from("pages")
        .select("*")
        .eq("user_id", userId)
        .eq("is_archived", true)
        .order("updated_at", { ascending: false });

      if (error) throw error;

      if (data) {
        await db.pages.bulkPut(data);
        return data.map((p) => ({
          ...p,
          deleted_at: p.updated_at,
        }));
      }
    } catch (e) {
      console.warn("Cloud trash fetch failed, using local data.", e);
    }

    return [];
  }

  async emptyTrash(userId: string): Promise<void> {
    const deletedPages = await this.listDeleted(userId);
    const allIds = deletedPages.map((p) => p.id);

    for (const id of allIds) {
      await db.pages.delete(id);
    }

    await db.sync_queue.add({
      table: "pages",
      action: "delete",
      data: { ids: allIds },
      timestamp: Date.now(),
    });

    try {
      const { error } = await supabase
        .from("pages")
        .delete()
        .in("id", allIds)
        .eq("user_id", userId);

      if (error) throw error;
    } catch (e) {
      console.warn("Background empty trash sync deferred.", e);
    }
  }

  private async getAllChildIds(parentId: string): Promise<string[]> {
    const childIds: string[] = [];
    const queue: string[] = [parentId];

    while (queue.length > 0) {
      const currentId = queue.shift()!;

      const children = await db.pages
        .where("parent_id")
        .equals(currentId)
        .toArray();

      for (const child of children) {
        childIds.push(child.id);
        queue.push(child.id);
      }
    }

    return childIds;
  }

  async getDeletedPagePath(pageId: string): Promise<DeletedPage[]> {
    const path: DeletedPage[] = [];
    let currentId: string | null = pageId;

    while (currentId) {
      let page = await db.pages.get(currentId);

      if (!page) {
        try {
          const { data, error } = await supabase
            .from("pages")
            .select("*")
            .eq("id", currentId)
            .single();

          if (error || !data) break;
          page = data;
          await db.pages.put(page);
        } catch (e) {
          break;
        }
      }

      path.unshift({ ...page, deleted_at: page.updated_at });
      currentId = page.parent_id;
    }

    return path;
  }

  async getTrashCount(userId: string): Promise<number> {
    const localCount = await db.pages
      .where("user_id")
      .equals(userId)
      .and((p) => p.is_archived === true)
      .count();

    return localCount;
  }
}

export const trashService = TrashService.getInstance();
