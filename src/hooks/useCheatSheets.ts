import { useState, useEffect, useCallback, useMemo } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { useToast } from "./use-toast";
import { db } from "@/lib/db";
import { Tables } from "@/integrations/supabase/types";

export interface CheatSheetItem {
    cmd: string;
    desc: string;
    cat: string;
}

// Map to Supabase types if available, otherwise define compatible interface
export type CheatSheet = {
    id: string;
    user_id: string;
    title: string;
    icon: string;
    color: string;
    categories: string[];
    items: CheatSheetItem[]; // JSONB in DB
    created_at: string;
    updated_at: string;
};

export function useCheatSheets() {
    const { user } = useAuth();
    const { toast } = useToast();
    const queryClient = useQueryClient();
    const [localSheets, setLocalSheets] = useState<CheatSheet[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const fetchLocal = useCallback(async () => {
        if (!user) return;
        const data = await db.cheatsheets
            .where("user_id")
            .equals(user.id)
            .reverse()
            .sortBy("created_at");
        setLocalSheets(data as unknown as CheatSheet[]);
        setIsLoading(false);
    }, [user]);

    useEffect(() => {
        fetchLocal();
    }, [fetchLocal]);

    // One-time Hydration
    useEffect(() => {
        if (!user) return;
        const hydrate = async () => {
            const count = await db.cheatsheets.where("user_id").equals(user.id).count();
            if (count > 0) return;

            try {
                const { data } = await supabase
                    .from("cheatsheets")
                    .select("*")
                    .eq("user_id", user.id)
                    .order("created_at", { ascending: false });

                if (data && data.length > 0) {
                    await db.cheatsheets.bulkPut(data as any[]);
                    await fetchLocal();
                }
            } catch (e) {
                console.warn("[useCheatSheets] Hydration failed", e);
            }
        };
        hydrate();
    }, [user, fetchLocal]);

    const createSheet = useMutation({
        mutationFn: async (sheet: Partial<CheatSheet>) => {
            if (!user) throw new Error("User must be logged in");
            const id = crypto.randomUUID();
            const now = new Date().toISOString();
            const newSheet = {
                ...sheet,
                id,
                user_id: user.id,
                created_at: now,
                updated_at: now,
                title: sheet.title || "Untitled Sheet",
                icon: sheet.icon || "📝",
                color: sheet.color || "text-primary",
                categories: sheet.categories || [],
                items: sheet.items || []
            } as CheatSheet;

            // 1. Local
            await db.cheatsheets.put(newSheet as any);
            await fetchLocal();

            // 2. Queue
            await db.sync_queue.add({
                table: 'cheatsheets',
                action: 'insert',
                data: newSheet as any,
                timestamp: Date.now()
            });

            // 3. Fire-and-Forget Cloud
            supabase.from("cheatsheets").insert([newSheet as any]).then(({ error }) => {
                if (error) console.warn("[useCheatSheets] Background insert failed:", error);
            });

            return newSheet;
        },
        onSuccess: () => {
            toast({ title: "Cheat Sheet Created", description: "Your custom guide has been saved." });
        },
        onError: (error) => {
            toast({ title: "Failed to create cheat sheet", description: error.message, variant: "destructive" });
        },
    });

    const updateSheet = useMutation({
        mutationFn: async (sheet: Partial<CheatSheet> & { id: string }) => {
            const updated_at = new Date().toISOString();
            const updates = { ...sheet, updated_at };

            // 1. Local
            await db.cheatsheets.update(sheet.id, updates as any);
            await fetchLocal();

            const current = await db.cheatsheets.get(sheet.id);

            // 2. Queue
            if (current) {
                await db.sync_queue.add({
                    table: 'cheatsheets',
                    action: 'update',
                    data: current,
                    timestamp: Date.now()
                });
            }

            // 3. Fire-and-Forget Cloud
            supabase.from("cheatsheets").update(updates as any).eq("id", sheet.id).then(({ error }) => {
                if (error) console.warn("[useCheatSheets] Background update failed:", error);
            });

            return current;
        },
        onSuccess: () => {
            toast({ title: "Cheat Sheet Updated" });
        },
        onError: (error) => {
            toast({ title: "Update Failed", description: error.message, variant: "destructive" });
        },
    });

    const deleteSheet = useMutation({
        mutationFn: async (id: string) => {
            // 1. Local
            await db.cheatsheets.delete(id);
            await fetchLocal();

            // 2. Queue
            await db.sync_queue.add({
                table: 'cheatsheets',
                action: 'delete',
                data: { id },
                timestamp: Date.now()
            });

            // 3. Fire-and-Forget Cloud
            supabase.from("cheatsheets").delete().eq("id", id).then(({ error }) => {
                if (error) console.warn("[useCheatSheets] Background delete failed:", error);
            });
        },
        onSuccess: () => {
            toast({ title: "Cheat Sheet Deleted" });
        },
    });

    const duplicateSheet = useMutation({
        mutationFn: async (sheet: { title: string; categories: string[]; items: CheatSheetItem[]; color?: string }) => {
            return createSheet.mutateAsync(sheet);
        },
        onSuccess: () => {
            toast({ title: "Sheet Forked!", description: "You can now customize this copy freely." });
        },
        onError: (error) => {
            toast({ title: "Fork Failed", description: error.message, variant: "destructive" });
        },
    });

    return {
        customSheets: localSheets,
        isLoading: isLoading && localSheets.length === 0,
        createSheet: createSheet.mutateAsync,
        deleteSheet: deleteSheet.mutateAsync,
        updateSheet: updateSheet.mutateAsync,
        duplicateSheet: duplicateSheet.mutateAsync,
        isCreating: createSheet.isPending,
        isDeleting: deleteSheet.isPending,
        isUpdating: updateSheet.isPending,
        isDuplicating: duplicateSheet.isPending,
    };
}
