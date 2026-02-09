import { supabase } from "@/integrations/supabase/client";
import { RealtimeChannel } from "@supabase/supabase-js";
import { Database } from "@/integrations/supabase/types";

type PresenceRecord = Database["public"]["Tables"]["page_presence"]["Row"];

export interface CursorPosition {
  blockId: string;
  offset: number;
}

export interface SelectionRange {
  start: { blockId: string; offset: number };
  end: { blockId: string; offset: number };
}

export interface UserPresence {
  userId: string;
  userName: string;
  userAvatar?: string;
  pageId: string;
  cursor?: CursorPosition;
  selection?: SelectionRange;
  lastSeenAt: string;
  color: string;
}

// PresenceRecord is now defined from Database types

const PRESENCE_COLORS = [
  "#ef4444",
  "#f97316",
  "#f59e0b",
  "#84cc16",
  "#10b981",
  "#06b6d4",
  "#3b82f6",
  "#8b5cf6",
  "#d946ef",
  "#f43f5e",
];

const PRESENCE_TIMEOUT_MS = 5 * 60 * 1000;

export class PresenceService {
  private currentPageId: string | null = null;
  private realtimeChannel: RealtimeChannel | null = null;
  private updateCallback: ((users: UserPresence[]) => void) | null = null;
  private presenceInterval: NodeJS.Timeout | null = null;
  private userColor: string;

  constructor() {
    this.userColor =
      PRESENCE_COLORS[Math.floor(Math.random() * PRESENCE_COLORS.length)];
  }

  async joinPage(
    pageId: string,
    onUpdate: (users: UserPresence[]) => void
  ): Promise<void> {
    try {
      if (this.currentPageId) {
        await this.leavePage();
      }

      this.currentPageId = pageId;
      this.updateCallback = onUpdate;

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        throw new Error("User not authenticated");
      }

      await this.upsertPresence(pageId, user.id);

      this.realtimeChannel = supabase
        .channel(`presence:${pageId}`)
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "page_presence",
            filter: `page_id=eq.${pageId}`,
          },
          () => {
            this.fetchPageUsers(pageId);
          }
        )
        .subscribe();

      this.presenceInterval = setInterval(() => {
        this.updateLastSeen(pageId, user.id);
      }, 30000);

      await this.fetchPageUsers(pageId);

      await this.cleanupOldPresence();
    } catch (error) {
      console.error("Error joining page presence:", error);
      throw error;
    }
  }

  async updateCursor(blockId: string, offset: number): Promise<void> {
    if (!this.currentPageId) {
      throw new Error("Not currently on a page");
    }

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        throw new Error("User not authenticated");
      }

      const { error } = await supabase.from("page_presence").upsert(
        {
          page_id: this.currentPageId,
          user_id: user.id,
          cursor_block_id: blockId,
          cursor_offset: offset,
          last_seen_at: new Date().toISOString(),
          is_active: true
        },
        {
          onConflict: "page_id,user_id",
        }
      );

      if (error) {
        throw error;
      }
    } catch (error) {
      console.error("Error updating cursor:", error);
      throw error;
    }
  }

  async updateSelection(
    start: { blockId: string; offset: number },
    end: { blockId: string; offset: number }
  ): Promise<void> {
    if (!this.currentPageId) {
      throw new Error("Not currently on a page");
    }

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        throw new Error("User not authenticated");
      }

      const { error } = await supabase.from("page_presence").upsert(
        {
          page_id: this.currentPageId,
          user_id: user.id,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          selected_blocks: { start, end } as any,
          last_seen_at: new Date().toISOString(),
          is_active: true
        },
        {
          onConflict: "page_id,user_id",
        }
      );

      if (error) {
        throw error;
      }
    } catch (error) {
      console.error("Error updating selection:", error);
      throw error;
    }
  }

  async leavePage(): Promise<void> {
    try {
      if (this.presenceInterval) {
        clearInterval(this.presenceInterval);
        this.presenceInterval = null;
      }

      if (this.realtimeChannel) {
        await supabase.removeChannel(this.realtimeChannel);
        this.realtimeChannel = null;
      }

      if (this.currentPageId) {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (user) {
          await supabase
            .from("page_presence")
            .delete()
            .eq("page_id", this.currentPageId)
            .eq("user_id", user.id);
        }
      }

      this.currentPageId = null;
      this.updateCallback = null;
    } catch (error) {
      console.error("Error leaving page:", error);
      throw error;
    }
  }

  async getPageUsers(pageId: string): Promise<UserPresence[]> {
    return this.fetchPageUsers(pageId);
  }

  private async upsertPresence(pageId: string, userId: string): Promise<void> {
    const { data: userData } = await supabase
      .from("profiles")
      .select("username, avatar_url")
      .eq("id", userId)
      .single();

    const { error } = await supabase.from("page_presence").upsert(
      {
        page_id: pageId,
        user_id: userId,
        user_name: userData?.username || "Anonymous",
        user_avatar_url: userData?.avatar_url,
        last_seen_at: new Date().toISOString(),
        is_active: true
      },
      {
        onConflict: "page_id,user_id",
      }
    );

    if (error) {
      throw error;
    }
  }

  private async updateLastSeen(pageId: string, userId: string): Promise<void> {
    const { error } = await supabase
      .from("page_presence")
      .update({ last_seen_at: new Date().toISOString() })
      .eq("page_id", pageId)
      .eq("user_id", userId);

    if (error) {
      console.error("Error updating last seen:", error);
    }
  }

  private async fetchPageUsers(pageId: string): Promise<UserPresence[]> {
    try {
      const cutoffTime = new Date(
        Date.now() - PRESENCE_TIMEOUT_MS
      ).toISOString();

      const { data, error } = await supabase
        .from("page_presence")
        .select("*")
        .eq("page_id", pageId)
        .gt("last_seen_at", cutoffTime);

      if (error) {
        throw error;
      }

      const users: UserPresence[] =
        data?.map((record: PresenceRecord) => ({
          userId: record.user_id,
          userName: record.user_name || "Anonymous",
          userAvatar: record.user_avatar_url || undefined,
          pageId: record.page_id,
          cursor:
            record.cursor_block_id && record.cursor_offset !== null
              ? {
                blockId: record.cursor_block_id,
                offset: record.cursor_offset,
              }
              : undefined,
          selection: record.selected_blocks
            ? (record.selected_blocks as unknown as SelectionRange)
            : undefined,
          lastSeenAt: record.last_seen_at,
          color: "#3b82f6", // Default color as it's missing in schema
        })) || [];

      if (this.updateCallback) {
        this.updateCallback(users);
      }

      return users;
    } catch (error) {
      console.error("Error fetching page users:", error);
      return [];
    }
  }

  private async cleanupOldPresence(): Promise<void> {
    try {
      const cutoffTime = new Date(
        Date.now() - PRESENCE_TIMEOUT_MS
      ).toISOString();

      const { error } = await supabase
        .from("page_presence")
        .delete()
        .lt("last_seen_at", cutoffTime);

      if (error) {
        console.error("Error cleaning up old presence:", error);
      }
    } catch (error) {
      console.error("Error in cleanup:", error);
    }
  }
}

export const presenceService = new PresenceService();
