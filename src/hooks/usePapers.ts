import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

export interface Paper {
    id: string;
    user_id: string;
    title: string;
    authors: string[] | null;
    publication_year: number | null;
    url: string | null;
    status: string;
    notes: string | null;
    tags: string[] | null;
    bibtex: string | null;
    summary: string | null;
    progress_percentage: number | null;
    created_at: string;
    updated_at: string;
}

export type PaperInsert = Omit<Paper, "id" | "created_at" | "updated_at">;
export type PaperUpdate = Partial<PaperInsert>;

export function usePapers() {
    const { user } = useAuth();
    const queryClient = useQueryClient();

    const papersQuery = useQuery({
        queryKey: ["papers", user?.id],
        queryFn: async () => {
            if (!user) return [];
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const { data, error } = await (supabase as any)
                .from("papers")
                .select("*")
                .eq("user_id", user.id)
                .order("created_at", { ascending: false });

            if (error) throw error;
            return (data || []) as Paper[];
        },
        enabled: !!user,
    });

    const createPaper = useMutation({
        mutationFn: async (paper: PaperInsert) => {
            if (!user) throw new Error("Not authenticated");
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const { data, error } = await (supabase as any)
                .from("papers")
                .insert({ ...paper, user_id: user.id })
                .select()
                .single();

            if (error) throw error;
            return data as Paper;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["papers"] });
        },
    });

    const updatePaper = useMutation({
        mutationFn: async (vars: PaperUpdate & { id: string }) => {
            const { id, ...updates } = vars;
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const { data, error } = await (supabase as any)
                .from("papers")
                .update(updates)
                .eq("id", id)
                .select()
                .single();

            if (error) throw error;
            return data as Paper;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["papers"] });
        },
    });

    const deletePaper = useMutation({
        mutationFn: async (id: string) => {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const { error } = await (supabase as any)
                .from("papers")
                .delete()
                .eq("id", id);

            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["papers"] });
        },
    });

    return {
        papers: papersQuery.data ?? [],
        isLoading: papersQuery.isLoading,
        createPaper,
        updatePaper,
        deletePaper,
    };
}
