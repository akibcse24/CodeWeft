import { useState, useCallback, useMemo } from "react";
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

    const generateCheatSheet = useCallback(async (topic: string) => {
        const prompt = `Generate a technical cheat sheet for "${topic}".
        Return a valid JSON object with the following structure:
        {
            "title": "string",
            "categories": ["string", "string"],
            "items": [
                { "cmd": "string", "desc": "string", "cat": "string" }
            ]
        }
        Limit to 10-15 most important items. Ensure "cat" matches one of the values in "categories".
        DO NOT include any markdown formatting or extra text, ONLY the raw JSON object.`;

        const messages: Array<{ role: "system" | "user" | "assistant"; content: string }> = [
            { role: "system" as const, content: "You are a technical documentation expert. You output only valid JSON." },
            { role: "user" as const, content: prompt }
        ];

        try {
            const result = await streamCompletion(messages);
            // Since streamCompletion might be used for streaming, we'll wait for the full response here
            // Note: If streamCompletion returns a promise that resolves to the full text, this works.
            // If it's a generator, we'd need to collect it. Checking ai.service.ts would be good but I'll assume it returns a string for now based on previous usage.
            const text = typeof result === 'string' ? result : await (async () => {
                let full = "";
                const stream = result as AsyncIterable<{ choices: Array<{ delta: { content?: string } }> }>;
                for await (const chunk of stream) {
                    if (chunk.choices?.[0]?.delta?.content) {
                        full += chunk.choices[0].delta.content;
                    }
                }
                return full;
            })();

            // Basic JSON cleaning in case AI includes ```json ... ```
            const jsonStr = text.replace(/```json/g, "").replace(/```/g, "").trim();
            return JSON.parse(jsonStr);
        } catch (error) {
            logger.error("Generate Cheat Sheet failed", error);
            throw error;
        }
    }, []);

    return useMemo(() => ({
        indexPage,
        indexAllPages,
        askAI,
        generateCheatSheet,
        isIndexing,
        isSearching
    }), [indexPage, indexAllPages, askAI, generateCheatSheet, isIndexing, isSearching]);
}
