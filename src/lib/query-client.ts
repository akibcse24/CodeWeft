import { QueryClient } from "@tanstack/react-query";
import { persistQueryClient } from "@tanstack/react-query-persist-client";
import { get, set, del } from "idb-keyval";

const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            gcTime: 1000 * 60 * 60 * 24, // 24 hours
            staleTime: 1000 * 60 * 5, // 5 minutes
            retry: 1,
        },
    },
});

const idbPersister = {
    persistClient: async (client: unknown) => {
        try {
            await set('react-query-cache', client);
        } catch (error) {
            console.warn("Failed to persist query client to IndexedDB:", error);
        }
    },
    restoreClient: async () => {
        try {
            return await get('react-query-cache');
        } catch (error) {
            console.error("Failed to restore query client from IndexedDB:", error);
            return undefined;
        }
    },
    removeClient: async () => {
        try {
            await del('react-query-cache');
        } catch (error) {
            console.warn("Failed to remove query client from IndexedDB:", error);
        }
    },
};


export const persistOptions = {
    persister: idbPersister,
    maxAge: 1000 * 60 * 60 * 24, // 24 hours
};

export { queryClient };
