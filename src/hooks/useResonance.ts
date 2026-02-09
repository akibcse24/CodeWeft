import { useState, useEffect, useCallback } from "react";
import { memoryService, LongTermMemoryItem } from "@/services/memory.service";
import { debounce } from "lodash";

export function useResonance(text: string, enabled: boolean = true) {
    const [results, setResults] = useState<LongTermMemoryItem[]>([]);
    const [isSearching, setIsSearching] = useState(false);

    const performSearch = useCallback(
        debounce(async (query: string) => {
            if (!query || query.trim().length < 10) {
                setResults([]);
                return;
            }

            setIsSearching(true);
            try {
                // We search for the top 5 most relevant items
                const searchResults = await memoryService.searchLongTerm(query, 5);
                setResults(searchResults);
            } catch (error) {
                console.error("Resonance search failed:", error);
            } finally {
                setIsSearching(false);
            }
        }, 1000),
        []
    );

    useEffect(() => {
        if (enabled && text) {
            performSearch(text);
        }
    }, [text, enabled, performSearch]);

    return { results, isSearching };
}
