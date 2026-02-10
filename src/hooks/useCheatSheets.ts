import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { useToast } from "./use-toast";

export interface CheatSheetItem {
    cmd: string;
    desc: string;
    cat: string;
}

export interface CheatSheet {
    id: string;
    user_id: string;
    title: string;
    icon: string;
    color: string;
    categories: string[];
    items: CheatSheetItem[];
    created_at: string;
    updated_at: string;
}

export function useCheatSheets() {
    const { user } = useAuth();
    const { toast } = useToast();
    const queryClient = useQueryClient();

    const { data: customSheets = [], isLoading } = useQuery({
        queryKey: ["cheatsheets", user?.id],
        queryFn: async () => {
            if (!user) return [];
            const { data, error } = await supabase
                .from("cheatsheets")
                .select("*")
                .eq("user_id", user.id)
                .order("created_at", { ascending: false });

            if (error) throw error;
            return data as CheatSheet[];
        },
        enabled: !!user,
    });

    const createSheet = useMutation({
        mutationFn: async (sheet: Partial<CheatSheet>) => {
            if (!user) throw new Error("User must be logged in");
            const { data, error } = await supabase
                .from("cheatsheets")
                .insert([{ ...sheet, user_id: user.id }])
                .select()
                .single();

            if (error) throw error;
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["cheatsheets"] });
            toast({ title: "Cheat Sheet Created", description: "Your custom guide has been saved." });
        },
        onError: (error) => {
            toast({ title: "Failed to create cheat sheet", description: error.message, variant: "destructive" });
        },
    });

    const deleteSheet = useMutation({
        mutationFn: async (id: string) => {
            const { error } = await supabase
                .from("cheatsheets")
                .delete()
                .eq("id", id);

            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["cheatsheets"] });
            toast({ title: "Cheat Sheet Deleted" });
        },
    });

    const updateSheet = useMutation({
        mutationFn: async (sheet: Partial<CheatSheet> & { id: string }) => {
            const { data, error } = await supabase
                .from("cheatsheets")
                .update({ ...sheet, updated_at: new Date().toISOString() })
                .eq("id", sheet.id)
                .select()
                .single();

            if (error) throw error;
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["cheatsheets"] });
            toast({ title: "Cheat Sheet Updated" });
        },
        onError: (error) => {
            toast({ title: "Update Failed", description: error.message, variant: "destructive" });
        },
    });

    const duplicateSheet = useMutation({
        mutationFn: async (sheet: { title: string; categories: string[]; items: CheatSheetItem[]; color?: string }) => {
            if (!user) throw new Error("User must be logged in");
            const { data, error } = await supabase
                .from("cheatsheets")
                .insert([{
                    title: sheet.title,
                    categories: sheet.categories,
                    items: sheet.items,
                    color: sheet.color || "text-primary",
                    user_id: user.id,
                }])
                .select()
                .single();

            if (error) throw error;
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["cheatsheets"] });
            toast({ title: "Sheet Forked!", description: "You can now customize this copy freely." });
        },
        onError: (error) => {
            toast({ title: "Fork Failed", description: error.message, variant: "destructive" });
        },
    });

    return {
        customSheets,
        isLoading,
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
