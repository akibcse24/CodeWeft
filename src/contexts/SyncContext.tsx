import React, { createContext, useContext, useEffect, useCallback, useRef, useState, useMemo } from "react";
import { db } from "@/lib/db";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Database } from "@/integrations/supabase/types";

type TableName = keyof Database['public']['Tables'];

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

interface SyncContextType {
    syncStatus: 'idle' | 'syncing' | 'error' | 'success';
    pendingCount: number;
    isSyncing: boolean;
    syncAll: () => Promise<void>;
    pushLocalChanges: () => Promise<void>;
    pullRemoteChanges: (specificTable?: TableName) => Promise<void>;
}

// eslint-disable-next-line react-refresh/only-export-components
export const SyncContext = createContext<SyncContextType | undefined>(undefined);

export function SyncProvider({ children }: { children: React.ReactNode }) {
    const { user } = useAuth();
    const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'error' | 'success'>('idle');
    const [pendingCount, setPendingCount] = useState(0);
    const [isDbReady, setIsDbReady] = useState(false);
    const isSyncingRef = useRef(false);
    const lastSyncErrorRef = useRef<string | null>(null);

    // Initialize DB and wait for it to be ready
    useEffect(() => {
        let mounted = true;

        const initDb = async () => {
            try {
                // Check if already open
                if (db.isOpen()) {
                    if (mounted) setIsDbReady(true);
                    return;
                }

                // Proactively open the database
                await db.open();
                if (mounted) {
                    console.log("[Sync] Database connection established");
                    setIsDbReady(true);
                }
            } catch (err) {
                console.error("[Sync] Failed to open database:", err);
                // If it's a "backing store" error, we might need to wait and retry
                if (mounted) {
                    setTimeout(initDb, 3000);
                }
            }
        };

        initDb();

        const handleBlocked = () => {
            console.warn("[Sync] Database is blocked by another tab");
            if (mounted) setIsDbReady(false);
        };

        db.on('blocked', handleBlocked);

        return () => {
            mounted = false;
            db.on('blocked').unsubscribe(handleBlocked);
        };
    }, []);

    // Update pending count periodically
    useEffect(() => {
        if (!isDbReady) return;

        let mounted = true;
        const updateCount = async () => {
            try {
                if (!db.isOpen()) {
                    setIsDbReady(false);
                    return;
                }
                const count = await db.sync_queue.count();
                if (mounted) setPendingCount(count);
            } catch (err) {
                if (err instanceof Error && err.name === 'DatabaseClosedError') {
                    if (mounted) setIsDbReady(false); // Trigger re-init
                }
                console.warn("[Sync] Failed to count sync queue:", err);
            }
        };

        updateCount();
        const interval = setInterval(updateCount, 10000); // 10s to reduce load
        return () => {
            mounted = false;
            clearInterval(interval);
        };
    }, [isDbReady]);

    const pushLocalChanges = useCallback(async () => {
        if (!user || isSyncingRef.current || !navigator.onLine || !isDbReady) return;

        try {
            if (!db.isOpen()) {
                setIsDbReady(false);
                return;
            }
            const queue = await db.sync_queue.toArray();
            if (queue.length === 0) {
                setSyncStatus('idle');
                return;
            }

            isSyncingRef.current = true;
            setSyncStatus('syncing');
            lastSyncErrorRef.current = null;
            console.log(`[Sync] Pushing ${queue.length} local changes...`);

            const upsertGroups: Record<string, { items: Record<string, unknown>[], ids: number[] }> = {};
            const deleteGroups: Record<string, { ids: number[], recordIds: string[] }> = {};

            for (const item of queue) {
                const table = item.table as TableName;

                if (item.action === 'delete') {
                    if (!deleteGroups[table]) deleteGroups[table] = { ids: [], recordIds: [] };
                    // We need the ID of the record to delete from Supabase
                    // Assuming item.data contains { id: ... } or item.data IS the ID?
                    // Usually item.data has the full object or at least the ID.
                    const recordId = (item.data as { id?: string })?.id;
                    if (recordId) {
                        deleteGroups[table].ids.push(item.id!);
                        deleteGroups[table].recordIds.push(recordId);
                    } else {
                        console.warn(`[Sync] Delete action missing record ID for ${table}`, item);
                        // Mark as processed anyway to avoid stuck queue? No, warn.
                        if (db.isOpen()) await db.sync_queue.delete(item.id!);
                    }
                } else if (item.action === 'insert' || item.action === 'update') {
                    if (!upsertGroups[table]) upsertGroups[table] = { items: [], ids: [] };

                    let dataToPush: Record<string, unknown> = { ...item.data };
                    if (user) dataToPush.user_id = user.id;
                    dataToPush.updated_at = new Date().toISOString();

                    // Column Sanitization
                    if (table === 'pages') {
                        const validColumns = [
                            'id', 'user_id', 'title', 'content', 'created_at', 'updated_at',
                            'parent_id', 'icon', 'cover_url', 'is_favorite', 'is_archived',
                            'is_public', 'tags', 'deleted_at'
                        ];
                        const cleanData: Record<string, unknown> = {};
                        validColumns.forEach(col => {
                            if (col in dataToPush) cleanData[col] = dataToPush[col];
                        });
                        dataToPush = cleanData;
                    } else {
                        delete dataToPush.search_vector;
                        delete dataToPush.search_content;
                    }

                    upsertGroups[table].items.push(dataToPush);
                    upsertGroups[table].ids.push(item.id!);
                }
            }

            // Execute Batch Deletes
            for (const table in deleteGroups) {
                try {
                    const { ids, recordIds } = deleteGroups[table];
                    console.log(`[Sync] Deleting batch of ${recordIds.length} from ${table}`);

                    // @ts-expect-error - Dynamic table access
                    const { error } = await supabase.from(table as TableName).delete().in('id', recordIds);

                    if (!error) {
                        if (db.isOpen()) await db.sync_queue.bulkDelete(ids);
                    } else {
                        console.error(`[Sync] Batch delete failed for ${table}:`, error);
                        // Handle retries... (same logic as upsert)
                        for (const qId of ids) {
                            const originalItem = queue.find(i => i.id === qId);
                            if (originalItem && db.isOpen()) {
                                const newRetryCount = (originalItem.retry_count || 0) + 1;
                                if (newRetryCount > 3) {
                                    await db.sync_queue.delete(qId);
                                } else {
                                    await db.sync_queue.update(qId, { retry_count: newRetryCount });
                                }
                            }
                        }
                    }
                } catch (err) {
                    console.error(`[Sync] Batch delete exception for ${table}:`, err);
                }
            }

            // Execute Batch Upserts
            for (const table in upsertGroups) {
                try {
                    const { items, ids } = upsertGroups[table];
                    console.log(`[Sync] Pushing batch of ${items.length} to ${table}`);

                    // @ts-expect-error - Dynamic table access
                    const { error } = await supabase.from(table as TableName).upsert(items as unknown[]);

                    if (!error) {
                        if (db.isOpen()) await db.sync_queue.bulkDelete(ids);
                    } else {
                        console.error(`[Sync] Batch push failed for ${table}:`, error);

                        // Handle retries individually to identify "toxic" items
                        for (const qId of ids) {
                            const originalItem = queue.find(i => i.id === qId);
                            if (originalItem && db.isOpen()) {
                                const newRetryCount = (originalItem.retry_count || 0) + 1;
                                if (newRetryCount > 3) {
                                    console.warn(`[Sync] Dropping toxic item ${qId} from ${table} after 3 retries`);
                                    await db.sync_queue.delete(qId);
                                } else {
                                    await db.sync_queue.update(qId, { retry_count: newRetryCount });
                                }
                            }
                        }

                        if (!error.message?.includes('AbortError')) {
                            lastSyncErrorRef.current = error.message;
                        }
                    }
                } catch (err) {
                    console.error(`[Sync] Batch exception for ${table}:`, err);
                }
            }
        } finally {
            try {
                if (db.isOpen()) {
                    const remainingCount = await db.sync_queue.count();
                    setPendingCount(remainingCount);
                }
            } catch (e) { /* ignore cleanup errors */ }

            isSyncingRef.current = false;

            if (lastSyncErrorRef.current) {
                setSyncStatus('error');
            } else {
                setSyncStatus('success');
                setTimeout(() => setSyncStatus('idle'), 3000);
            }
        }
    }, [user, isDbReady]);

    const pullRemoteChanges = useCallback(async (specificTable?: TableName) => {
        if (!user || !isDbReady) return;

        const tablesToPull = specificTable ? [specificTable] : CORE_TABLES;

        for (const tableName of (tablesToPull as string[])) {
            try {
                if (!db.isOpen()) {
                    setIsDbReady(false);
                    break;
                }
                const table = (db as unknown as Record<string, unknown>)[tableName] as { bulkPut: (data: unknown[]) => Promise<void> };
                if (!table) continue;

                const lastSyncKey = `last_sync_${tableName}`;
                const lastSyncTime = localStorage.getItem(lastSyncKey) || new Date(0).toISOString();

                // @ts-expect-error - Dynamic table access
                const { data, error } = await supabase.from(tableName as TableName)
                    .select("*")
                    .eq("user_id", user.id)
                    .gt("updated_at", lastSyncTime);

                if (error) {
                    if (error.message?.includes('AbortError')) continue;
                    console.error(`[Sync] Pull failed for ${tableName}:`, error);
                    continue;
                }

                if (data && data.length > 0) {
                    const sanitizedData = data.map((item: Record<string, unknown>) => {
                        const { search_vector, search_content, ...rest } = item;
                        return rest;
                    });
                    if (db.isOpen()) await table.bulkPut(sanitizedData);

                    // Update sync time to the latest record's updated_at
                    const maxUpdatedAt = data.reduce((max: string, item: Record<string, unknown>) => {
                        const updated = item.updated_at as string | undefined;
                        return (updated && updated > max) ? updated : max;
                    }, lastSyncTime);
                    localStorage.setItem(lastSyncKey, maxUpdatedAt);
                }
            } catch (err) {
                console.error(`[Sync] Exception during pull for ${tableName}:`, err);
            }
        }
    }, [user, isDbReady]);

    const syncAll = useCallback(async () => {
        if (!user || !navigator.onLine || isSyncingRef.current || !isDbReady) return;
        try {
            await pushLocalChanges();
            await pullRemoteChanges();
        } catch (error) {
            console.error("[Sync] syncAll failed:", error);
        }
    }, [user, isDbReady, pushLocalChanges, pullRemoteChanges]);

    // Initial sync and intervals
    useEffect(() => {
        if (!user || !isDbReady) return;

        // Delay initial sync to avoid contention with other startup tasks
        const initialSyncTimeout = setTimeout(() => {
            syncAll();
        }, 5000); // 5s delay at start

        const interval = setInterval(() => {
            if (navigator.onLine && isDbReady && db.isOpen()) syncAll();
        }, 1000 * 60 * 10); // 10 minute background interval

        const handleOnline = () => syncAll();
        window.addEventListener('online', handleOnline);

        const channel = supabase
            .channel('global-sync')
            .on('postgres_changes', { event: '*', schema: 'public' }, (payload) => {
                const table = payload.table as TableName;
                if (CORE_TABLES.includes(table as typeof CORE_TABLES[number])) {
                    pullRemoteChanges(table);
                }
            })
            .subscribe();

        return () => {
            clearTimeout(initialSyncTimeout);
            clearInterval(interval);
            window.removeEventListener('online', handleOnline);
            supabase.removeChannel(channel);
        };
    }, [user, isDbReady, syncAll, pullRemoteChanges]);

    const value = useMemo(() => ({
        syncStatus,
        pendingCount,
        isSyncing: syncStatus === 'syncing',
        syncAll,
        pushLocalChanges,
        pullRemoteChanges
    }), [syncStatus, pendingCount, syncAll, pushLocalChanges, pullRemoteChanges]);

    return (
        <SyncContext.Provider value={value}>
            {children}
        </SyncContext.Provider>
    );
}

