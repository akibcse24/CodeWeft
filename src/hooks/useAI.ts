import { useState, useCallback } from "react";
import { usePages } from "./usePages";
import { getEmbedding, streamCompletion } from "@/services/ai.service";
import { storeVector, searchVectors } from "@/services/vector.service";
import { extractTextFromBlocks } from "@/lib/block-utils";
import { Block } from "@/types/editor.types";
import { useToast } from "@/hooks/use-toast";
import { logger } from "@/lib/logger";

export function useAI() {
    const { pages } = usePages();
    const { toast } = useToast();
    const [isIndexing, setIsIndexing] = useState(false);
    const [isSearching, setIsSearching] = useState(false);

    const indexPage = useCallback(async (pageId: string) => {
        const page = pages.find(p => p.id === pageId);
        if (!page) return;

        try {
            const content = page.content as unknown as Block[];
            const text = extractTextFromBlocks(content);
            const embedding = await getEmbedding(text);

            await storeVector({
                id: page.id,
                content: text,
                embedding,
                metadata: { title: page.title, path: `/notes?id=${page.id}` } // simplified path
            });
            logger.debug(`Indexed page: ${page.title}`);
        } catch (error) {
            logger.error("Failed to index page", page.title, error);
            throw error;
        }
    }, [pages]);

    const indexAllPages = useCallback(async () => {
        setIsIndexing(true);
        let successCount = 0;
        let failCount = 0;

        try {
            for (const page of pages) {
                try {
                    await indexPage(page.id);
                    successCount++;
                } catch (e) {
                    failCount++;
                }
            }
            toast({
                title: "Indexing Complete",
                description: `Indexed ${successCount} pages. ${failCount > 0 ? `Failed: ${failCount}` : ""}`
            });
        } catch (error) {
            toast({ title: "Indexing Failed", description: "Check console for details", variant: "destructive" });
        } finally {
            setIsIndexing(false);
        }
    }, [pages, indexPage, toast]);

    const askAI = useCallback(async (query: string) => {
        setIsSearching(true);
        try {
            const queryEmbedding = await getEmbedding(query);
            const similarDocs = await searchVectors(queryEmbedding, 3);

            const context = similarDocs.map(doc =>
                `Title: ${doc.metadata.title}\nContent: ${doc.content}`
            ).join("\n\n");

            const messages: Array<{ role: "system" | "user" | "assistant"; content: string }> = [
                { role: "system" as const, content: "You are a helpful assistant for a personal knowledge base. Use the provided context to answer the user's question. If the answer is not in the context, say so." },
                { role: "user" as const, content: `Context:\n${context}\n\nQuestion: ${query}` }
            ];

            return streamCompletion(messages);
        } catch (error) {
            logger.error("Ask AI failed", error);
            throw error;
        } finally {
            setIsSearching(false);
        }
    }, []);

    return {
        indexPage,
        indexAllPages,
        askAI,
        isIndexing,
        isSearching
    };
}
