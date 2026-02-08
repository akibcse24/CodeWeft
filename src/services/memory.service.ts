/* eslint-disable @typescript-eslint/no-explicit-any */
import { supabase } from "@/integrations/supabase/client";
import { getEmbedding } from "./ai.service";
import { storeVector, searchVectors } from "./vector.service";

export interface ShortTermMemoryItem {
    id: string;
    type: "conversation" | "action" | "event" | "state";
    content: any;
    timestamp: number;
    metadata?: Record<string, any>;
}

export interface LongTermMemoryItem {
    id: string;
    content: string;
    embedding: number[];
    metadata: {
        type: "preference" | "habit" | "knowledge" | "pattern";
        importance: number;
        frequency: number;
        lastAccessed: number;
    };
}

class MemoryService {
    private shortTermMemory: Map<string, ShortTermMemoryItem> = new Map();
    private maxShortTermItems = 100;
    private shortTermTTL = 3600000;

    storeShortTerm(item: Omit<ShortTermMemoryItem, "id" | "timestamp">): string {
        const id = `stm_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const memoryItem: ShortTermMemoryItem = {
            id,
            ...item,
            timestamp: Date.now()
        };

        this.shortTermMemory.set(id, memoryItem);

        if (this.shortTermMemory.size > this.maxShortTermItems) {
            const oldest = Array.from(this.shortTermMemory.entries())
                .sort((a, b) => a[1].timestamp - b[1].timestamp)[0][0];
            this.shortTermMemory.delete(oldest);
        }

        return id;
    }

    getShortTerm(id: string): ShortTermMemoryItem | undefined {
        return this.shortTermMemory.get(id);
    }

    getRecentShortTerm(type?: string, limit: number = 10): ShortTermMemoryItem[] {
        const items = Array.from(this.shortTermMemory.values())
            .filter(item => !type || item.type === type)
            .sort((a, b) => b.timestamp - a.timestamp)
            .slice(0, limit);
        return items;
    }

    async storeLongTerm(content: string, metadata: Omit<LongTermMemoryItem["metadata"], "lastAccessed">): Promise<string> {
        const embedding = await getEmbedding(content);
        const id = `ltm_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

        await storeVector({
            id,
            content,
            embedding,
            metadata: {
                ...metadata,
                lastAccessed: Date.now()
            }
        });

        return id;
    }

    async searchLongTerm(query: string, limit: number = 5): Promise<LongTermMemoryItem[]> {
        const queryEmbedding = await getEmbedding(query);
        const results = await searchVectors(queryEmbedding, limit);

        return results.map(doc => ({
            id: doc.id,
            content: doc.content,
            embedding: [],
            metadata: doc.metadata as LongTermMemoryItem["metadata"]
        }));
    }

    async updateUserPreferences(preferences: Record<string, any>): Promise<void> {
        await this.storeLongTerm(
            JSON.stringify(preferences),
            {
                type: "preference",
                importance: 0.8,
                frequency: 1
            }
        );
    }

    async getUserPreferences(): Promise<Record<string, any> | null> {
        const results = await this.searchLongTerm("user preferences", 1);
        if (results.length > 0) {
            try {
                return JSON.parse(results[0].content);
            } catch {
                return null;
            }
        }
        return null;
    }

    async rememberPattern(pattern: string, context: Record<string, any>): Promise<void> {
        await this.storeLongTerm(
            `Pattern: ${pattern}\nContext: ${JSON.stringify(context)}`,
            {
                type: "pattern",
                importance: 0.6,
                frequency: 1
            }
        );
    }

    async getRelevantPatterns(context: string): Promise<string[]> {
        const results = await this.searchLongTerm(context, 3);
        return results
            .filter(r => r.metadata.type === "pattern")
            .map(r => r.content);
    }

    async learnFromAction(action: string, outcome: "success" | "failure", context?: Record<string, any>): Promise<void> {
        const importance = outcome === "success" ? 0.7 : 0.4;
        await this.storeLongTerm(
            `Action: ${action}\nOutcome: ${outcome}\nContext: ${context ? JSON.stringify(context) : "none"}`,
            {
                type: "habit",
                importance,
                frequency: 1
            }
        );
    }

    clearOldShortTerm(): void {
        const now = Date.now();
        for (const [id, item] of this.shortTermMemory.entries()) {
            if (now - item.timestamp > this.shortTermTTL) {
                this.shortTermMemory.delete(id);
            }
        }
    }

    getContextSummary(): string {
        const recentActions = this.getRecentShortTerm("action", 5);
        const recentConversations = this.getRecentShortTerm("conversation", 3);
        const recentEvents = this.getRecentShortTerm("event", 3);

        const parts: string[] = [];

        if (recentActions.length > 0) {
            parts.push("Recent actions: " + recentActions.map(a => JSON.stringify(a.content)).join(", "));
        }

        if (recentConversations.length > 0) {
            parts.push("Recent conversations: " + recentConversations.map(c => JSON.stringify(c.content)).join(", "));
        }

        if (recentEvents.length > 0) {
            parts.push("Recent events: " + recentEvents.map(e => JSON.stringify(e.content)).join(", "));
        }

        return parts.join("\n") || "No recent activity";
    }

    exportShortTerm(): ShortTermMemoryItem[] {
        return Array.from(this.shortTermMemory.values());
    }

    importShortTerm(items: ShortTermMemoryItem[]): void {
        for (const item of items) {
            this.shortTermMemory.set(item.id, item);
        }
    }

    async clearLongTerm(userId: string): Promise<void> {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { error } = await (supabase as any)
            .from("vectors")
            .delete()
            .eq("user_id", userId);

        if (error) {
            throw error;
        }
    }
}

export const memoryService = new MemoryService();
