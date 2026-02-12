import { useContext } from "react";
import { SyncContext } from "@/contexts/SyncContext";

/**
 * Hook to consume the SyncContext
 * Separated into its own file to ensure Vite HMR compatibility with PascalCase components.
 */
export function useSyncContext() {
    const context = useContext(SyncContext);
    if (context === undefined) {
        throw new Error("useSyncContext must be used within a SyncProvider");
    }
    return context;
}
