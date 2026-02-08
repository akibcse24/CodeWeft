/* eslint-disable @typescript-eslint/no-explicit-any */
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface PaperDraft {
    id: string;
    user_id: string;
    title: string;
    abstract: string | null;
    target_venue: string | null;
    venue_deadline: string | null;
    status: 'draft' | 'review' | 'submitted' | 'revising' | 'accepted' | 'published';
    repo_url: string | null;
    manuscript_url: string | null;
    page_id: string | null;
    bib_key: string | null;
    created_at: string;
    updated_at: string;
}

export const useDrafts = () => {
    const queryClient = useQueryClient();

    const { data: drafts = [], isLoading } = useQuery({
        queryKey: ["paper_drafts"],
        queryFn: async () => {
            const { data, error } = await (supabase as any)
                .from("paper_drafts")
                .select("*")
                .order("created_at", { ascending: false });
            if (error) throw error;
            return data as PaperDraft[];
        },
    });

    const createDraft = useMutation({
        mutationFn: async (draft: Partial<PaperDraft>) => {
            const { data, error } = await (supabase as any)
                .from("paper_drafts")
                .insert(draft)
                .select()
                .single();
            if (error) throw error;
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["paper_drafts"] });
        },
    });

    const updateDraft = useMutation({
        mutationFn: async ({ id, ...updates }: Partial<PaperDraft> & { id: string }) => {
            const { data, error } = await (supabase as any)
                .from("paper_drafts")
                .update(updates)
                .eq("id", id)
                .select()
                .single();
            if (error) throw error;
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["paper_drafts"] });
        },
    });

    const deleteDraft = useMutation({
        mutationFn: async (id: string) => {
            const { error } = await (supabase as any)
                .from("paper_drafts")
                .delete()
                .eq("id", id);
            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["paper_drafts"] });
        },
    });

    return { drafts, isLoading, createDraft, updateDraft, deleteDraft };
};
