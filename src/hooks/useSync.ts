import { db } from "@/lib/db";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { useEffect, useCallback, useRef } from "react";
import { useToast } from "./use-toast";

const CORE_TABLES = [
    'tasks', 'pages', 'ml_notes', 'dsa_problems',
    'flashcard_decks', 'flashcards', 'courses',
    'habits', 'habit_completions', 'habit_logs',
    'papers', 'projects', 'resources', 'secrets_vault',
    'github_settings', 'profiles'
];

export function useSync() {
    const { user } = useAuth();
    const { toast } = useToast();
    const isSyncingRef = useRef(false);

    const pushLocalChanges = useCallback(async () => {
        if (!user || isSyncingRef.current) return;

        const queue = await db.sync_queue.toArray();
        if (queue.length === 0) return;

        isSyncingRef.current = true;
        console.log(`[Sync] Pushing ${queue.length} local changes...`);

        for (const item of queue) {
            try {
                let error;
                if (item.action === 'insert' || item.action === 'update') {
                    if (user) item.data.user_id = user.id;

                    // Add/Update updated_at for conflict resolution
                    item.data.updated_at = new Date().toISOString();

                    const { error: reqError } = await supabase
                        .from(item.table as any)
                        .upsert(item.data);
                    error = reqError;
                } else if (item.action === 'delete') {
                    const { error: reqError } = await supabase
                        .from(item.table as any)
                        .delete()
                        .eq('id', item.data.id);
                    error = reqError;
                }

                if (!error) {
                    await db.sync_queue.delete(item.id!);
                } else {
                    console.error(`[Sync] Push error for ${item.table}:`, error);
                }
            } catch (err) {
                console.error(`[Sync] Exception during push:`, err);
            }
        }
        isSyncingRef.current = false;
    }, [user]);

    const pullRemoteChanges = useCallback(async () => {
        if (!user) return;

        for (const tableName of CORE_TABLES) {
            try {
                // Get the last record's timestamp from local DB to perform a delta sync
                const lastRecord = await (db as any)[tableName]
                    .orderBy('updated_at')
                    .last();

                const lastSyncTime = lastRecord?.updated_at || new Date(0).toISOString();

                const { data, error } = await supabase
                    .from(tableName as any)
                    .select("*")
                    .eq("user_id", user.id)
                    .gt("updated_at", lastSyncTime);

                if (error) throw error;

                if (data && data.length > 0) {
                    await (db as any)[tableName].bulkPut(data);
                    console.log(`[Sync] Pulled ${data.length} new records for ${tableName}`);
                }
            } catch (err) {
                console.error(`[Sync] Pull failed for ${tableName}:`, err);
            }
        }
    }, [user]);

    const syncAll = useCallback(async () => {
        if (!user || !navigator.onLine) return;

        await pushLocalChanges();
        await pullRemoteChanges();
    }, [user, pushLocalChanges, pullRemoteChanges]);

    useEffect(() => {
        if (user) {
            syncAll();

            // Set up interval for background sync
            const interval = setInterval(() => {
                if (navigator.onLine) syncAll();
            }, 1000 * 60 * 2); // Every 2 minutes

            // Listen for online status
            const handleOnline = () => syncAll();
            window.addEventListener('online', handleOnline);

            // Supabase Realtime subscription for instant updates
            const channel = supabase
                .channel('schema-db-changes')
                .on('postgres_changes', { event: '*', schema: 'public' }, () => {
                    pullRemoteChanges();
                })
                .subscribe();

            return () => {
                clearInterval(interval);
                window.removeEventListener('online', handleOnline);
                supabase.removeChannel(channel);
            };
        }
    }, [user, syncAll, pullRemoteChanges]);

    return { syncAll, pushLocalChanges, pullRemoteChanges };
}
