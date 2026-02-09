import { supabase } from "@/integrations/supabase/client";
import { db } from "@/lib/db";
import { Block } from "@/types/editor.types";
import { Tables } from "@/integrations/supabase/types";

type Page = Tables<"pages">;

export interface BlockSearchResult {
  pageId: string;
  pageTitle: string;
  pageIcon?: string | null;
  blockId: string;
  blockType: string;
  content: string;
  preview: string;
  relevance: number;
  path: string[];
}

interface SearchMatch {
  block: Block;
  page: Page;
  path: string[];
  relevance: number;
}

export class QuickFindService {
  private static instance: QuickFindService;
  private readonly PREVIEW_CONTEXT_LENGTH = 50;

  static getInstance(): QuickFindService {
    if (!QuickFindService.instance) {
      QuickFindService.instance = new QuickFindService();
    }
    return QuickFindService.instance;
  }

  async search(query: string, userId: string): Promise<BlockSearchResult[]> {
    if (!query || query.trim().length === 0) {
      return [];
    }

    const cleanQuery = query.trim().toLowerCase();

    try {
      // @ts-expect-error: RPC function not yet in types
      const { data, error } = await supabase.rpc("search_blocks", {
        search_query: cleanQuery,
        user_id: userId,
      });

      if (error) throw error;

      if (data && Array.isArray(data)) {
        return this.formatRpcResults(data, cleanQuery);
      }
    } catch (e) {
      console.warn("RPC search failed, falling back to local search.", e);
    }

    return this.searchLocal(cleanQuery, userId);
  }

  async searchLocal(
    query: string,
    userId: string
  ): Promise<BlockSearchResult[]> {
    if (!query || query.trim().length === 0) {
      return [];
    }

    const cleanQuery = query.trim().toLowerCase();
    const matches: SearchMatch[] = [];

    const pages = await db.pages
      .where("user_id")
      .equals(userId)
      .and((p) => !p.is_archived)
      .toArray();

    for (const page of pages) {
      const content = page.content as unknown as Block[];
      if (!content || !Array.isArray(content)) continue;

      const pageMatches = this.searchBlocks(content, page, [], cleanQuery);
      matches.push(...pageMatches);
    }

    const results = this.formatSearchResults(matches, cleanQuery);
    return this.sortByRelevance(results);
  }

  private searchBlocks(
    blocks: Block[],
    page: Page,
    path: string[],
    query: string
  ): SearchMatch[] {
    const matches: SearchMatch[] = [];

    for (const block of blocks) {
      const currentPath = [...path, block.type];
      let relevance = 0;

      if (block.content && block.content.toLowerCase().includes(query)) {
        relevance += this.calculateRelevance(block, page, query);

        if (relevance > 0) {
          matches.push({
            block,
            page,
            path: currentPath,
            relevance,
          });
        }
      }

      if (block.children && block.children.length > 0) {
        const childMatches = this.searchBlocks(
          block.children,
          page,
          currentPath,
          query
        );
        matches.push(...childMatches);
      }

      if (block.columns && block.columns.length > 0) {
        for (const column of block.columns) {
          if (Array.isArray(column)) {
            const columnMatches = this.searchBlocks(
              column,
              page,
              [...currentPath, "column"],
              query
            );
            matches.push(...columnMatches);
          }
        }
      }
    }

    return matches;
  }

  private calculateRelevance(block: Block, page: Page, query: string): number {
    let score = 0;
    const content = block.content.toLowerCase();
    const queryLower = query.toLowerCase();

    if (page.title.toLowerCase().includes(queryLower)) {
      score += 2;
    }

    if (content === queryLower) {
      score += 1;
    }

    if (
      block.type === "heading1" ||
      block.type === "heading2" ||
      block.type === "heading3" ||
      block.type.startsWith("toggleHeading")
    ) {
      score += 1;
    }

    const exactMatches = (content.match(new RegExp(queryLower, "g")) || [])
      .length;
    score += exactMatches * 0.5;

    return score;
  }

  private formatSearchResults(
    matches: SearchMatch[],
    query: string
  ): BlockSearchResult[] {
    return matches.map((match) => ({
      pageId: match.page.id,
      pageTitle: match.page.title,
      pageIcon: match.page.icon,
      blockId: match.block.id,
      blockType: match.block.type,
      content: match.block.content,
      preview: this.generatePreview(match.block.content, query),
      relevance: match.relevance,
      path: match.path,
    }));
  }

  private formatRpcResults(
    data: unknown[],
    query: string
  ): BlockSearchResult[] {
    if (!Array.isArray(data)) return [];

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return data.map((item: any) => ({
      pageId: item.page_id || "",
      pageTitle: item.page_title || "Untitled",
      pageIcon: item.page_icon,
      blockId: item.block_id || "",
      blockType: item.block_type || "paragraph",
      content: item.content || "",
      preview:
        item.preview || this.generatePreview(item.content || "", query),
      relevance: item.relevance || 0,
      path: item.path || [],
    }));
  }

  private generatePreview(content: string, query: string): string {
    if (!content) return "";

    const contentLower = content.toLowerCase();
    const queryLower = query.toLowerCase();
    const index = contentLower.indexOf(queryLower);

    if (index === -1) {
      return content.length > this.PREVIEW_CONTEXT_LENGTH * 2
        ? content.substring(0, this.PREVIEW_CONTEXT_LENGTH * 2) + "..."
        : content;
    }

    const start = Math.max(0, index - this.PREVIEW_CONTEXT_LENGTH);
    const end = Math.min(
      content.length,
      index + query.length + this.PREVIEW_CONTEXT_LENGTH
    );

    let preview = content.substring(start, end);

    if (start > 0) {
      preview = "..." + preview;
    }
    if (end < content.length) {
      preview = preview + "...";
    }

    return preview;
  }

  private sortByRelevance(results: BlockSearchResult[]): BlockSearchResult[] {
    return results.sort((a, b) => {
      if (b.relevance !== a.relevance) {
        return b.relevance - a.relevance;
      }
      return a.pageTitle.localeCompare(b.pageTitle);
    });
  }

  async searchByTitle(query: string, userId: string): Promise<Page[]> {
    if (!query || query.trim().length === 0) {
      return [];
    }

    const cleanQuery = query.trim().toLowerCase();

    const localResults = await db.pages
      .where("user_id")
      .equals(userId)
      .and((p) => !p.is_archived)
      .filter((p) => p.title.toLowerCase().includes(cleanQuery))
      .limit(10)
      .toArray();

    if (localResults.length > 0) {
      return localResults;
    }

    try {
      const { data, error } = await supabase
        .from("pages")
        .select("*")
        .eq("user_id", userId)
        .eq("is_archived", false)
        .ilike("title", `%${cleanQuery}%`)
        .order("updated_at", { ascending: false })
        .limit(10);

      if (error) throw error;

      if (data) {
        await db.pages.bulkPut(data);
        return data;
      }
    } catch (e) {
      console.warn("Cloud title search failed, using local data.", e);
    }

    return [];
  }

  async getRecentPages(userId: string, limit: number = 10): Promise<Page[]> {
    const localPages = await db.pages
      .where("user_id")
      .equals(userId)
      .and((p) => !p.is_archived)
      .reverse()
      .sortBy("updated_at");

    return localPages.slice(0, limit);
  }
}

export const quickFindService = QuickFindService.getInstance();
