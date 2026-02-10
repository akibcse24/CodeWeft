import { db } from "@/lib/db";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { useEffect, useCallback, useRef, useMemo } from "react";
import { toast } from "./use-toast";
import { Database } from "@/integrations/supabase/types";

// Core tables to sync
const CORE_TABLES = [
    'tasks',
    'pages',
    'courses',
    'habits',
    'projects',
    'ml_notes',
    'dsa_problems',
    'flashcard_decks',
    'flashcards',
    'habit_completions',
    'habit_logs',
    'papers',
    'resources',
    'secrets_vault',
    'github_settings',
    'profiles',
    'growth_roadmaps',
    'growth_skills',
    'growth_retros'
] as const;

type TableName = keyof Database['public']['Tables'];

export function useSync(enableBackgroundSync = true) {
    const { user } = useAuth();
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
                    // Create a shallow copy to modify and sanitize
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    let dataToPush: any = { ...item.data };

                    if (user) dataToPush.user_id = user.id;

                    // Add/Update updated_at for conflict resolution
                    dataToPush.updated_at = new Date().toISOString();

                    // Remove server-generated columns that shouldn't be synced from client
                    // Strict whitelist for pages table to prevent "cannot extract elements from an object" error
                    if (item.table === 'pages') {
                        const validColumns = [
                            'id', 'user_id', 'title', 'content', 'created_at', 'updated_at',
                            'parent_id', 'icon', 'cover_url', 'is_favorite', 'is_archived',
                            'is_public', 'tags'
                        ];

                        // Create a new clean object with only valid columns
                        const cleanData: Record<string, unknown> = {};
                        validColumns.forEach(col => {
                            if (col in dataToPush) {
                                cleanData[col] = dataToPush[col];
                            }
                        });
                        dataToPush = cleanData;
                    } else {
                        // For other tables, just remove known bad columns
                        delete dataToPush.search_vector;
                        delete dataToPush.search_content;
                    }

                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    const { error: reqError } = await (supabase.from(item.table as TableName) as any)
                        .upsert(dataToPush as Database['public']['Tables'][TableName]['Insert']);
                    error = reqError;
                } else if (item.action === 'delete') {
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    const { error: reqError } = await (supabase.from(item.table as TableName) as any)
                        .delete()
                        .eq('id', (item.data as { id: string }).id);
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
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const table = (db as unknown as Record<string, any>)[tableName];
                if (!table) {
                    console.warn(`[Sync] Table ${tableName} not found in Dexie`);
                    continue;
                }

                // Get the last record's timestamp from local DB to perform a delta sync
                const lastRecord = await table
                    .orderBy('updated_at')
                    .last();

                const lastSyncTime = (lastRecord as { updated_at?: string })?.updated_at || new Date(0).toISOString();

                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const { data, error } = await (supabase.from(tableName as TableName) as any)
                    .select("*")
                    .eq("user_id", user.id)
                    .gt("updated_at", lastSyncTime);

                if (error) {
                    // Log but don't stop the whole sync process for one table error
                    console.error(`[Sync] Pull failed for ${tableName}:`, error);
                    continue;
                }

                if (data && data.length > 0) {
                    // bulkPut handles updates/inserts based on primary key (id)
                    await table.bulkPut(data);
                    console.log(`[Sync] Pulled ${data.length} new records for ${tableName}`);
                }
            } catch (err) {
                console.error(`[Sync] Exception during pull for ${tableName}:`, err);
            }
        }
    }, [user]);

    const syncAll = useCallback(async () => {
        if (!user || !navigator.onLine) return;

        try {
            await pushLocalChanges();
            await pullRemoteChanges();
        } catch (error) {
            console.error("[Sync] syncAll failed:", error);
            toast({
                title: "Sync failed",
                description: "There was a problem syncing your data. We'll try again shortly.",
                variant: "destructive"
            });
        }
    }, [user, pushLocalChanges, pullRemoteChanges]);

    useEffect(() => {
        if (user && enableBackgroundSync) {
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
                .subscribe((status) => {
                    if (status === 'SUBSCRIBED') {
                        console.log('[Sync] Realtime subscription active');
                    } else if (status === 'CHANNEL_ERROR') {
                        console.error('[Sync] Realtime subscription error');
                    } else if (status === 'TIMED_OUT') {
                        console.warn('[Sync] Realtime subscription timed out');
                    }
                });

            return () => {
                clearInterval(interval);
                window.removeEventListener('online', handleOnline);
                supabase.removeChannel(channel);
            };
        }
    }, [user, syncAll, pullRemoteChanges, enableBackgroundSync]);

    return useMemo(() => ({ syncAll, pushLocalChanges, pullRemoteChanges }), [syncAll, pushLocalChanges, pullRemoteChanges]);
}
