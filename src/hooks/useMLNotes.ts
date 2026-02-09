import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { Tables, TablesInsert, TablesUpdate, Json } from "@/integrations/supabase/types";
import { Block } from "@/components/editor/BlockEditor";

type MLNote = Tables<"ml_notes">;
type MLNoteInsert = TablesInsert<"ml_notes">;
type MLNoteUpdate = TablesUpdate<"ml_notes">;

export function useMLNotes() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const notesQuery = useQuery({
    queryKey: ["ml_notes", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from("ml_notes")
        .select("*")
        .eq("user_id", user.id)
        .order("updated_at", { ascending: false });

      if (error) throw error;
      return data as MLNote[];
    },
    enabled: !!user,
  });

  const favoriteNotesQuery = useQuery({
    queryKey: ["ml_notes", user?.id, "favorites"],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from("ml_notes")
        .select("*")
        .eq("user_id", user.id)
        .eq("is_favorite", true)
        .order("updated_at", { ascending: false });

      if (error) throw error;
      return data as MLNote[];
    },
    enabled: !!user,
  });

  const createNote = useMutation({
    mutationFn: async (note: Partial<Omit<MLNoteInsert, "user_id">>) => {
      if (!user) throw new Error("Not authenticated");
      const defaultContent: Block[] = [{ id: "1", type: "paragraph", content: "" }];
      const { data, error } = await supabase
        .from("ml_notes")
        .insert([{
          title: note.title || "Untitled",
          content: typeof note.content === 'string' ? note.content : JSON.stringify(note.content || defaultContent),
          category: note.category || "general",
          tags: note.tags || [],
          icon: note.icon || "🧠",
          user_id: user.id,
        }])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ml_notes"] });
    },
  });

  const updateNote = useMutation({
    mutationFn: async ({ id, ...updates }: MLNoteUpdate & { id: string }) => {
      const { data, error } = await supabase
        .from("ml_notes")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ml_notes"] });
    },
  });

  const deleteNote = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("ml_notes")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ml_notes"] });
    },
  });

  const toggleFavorite = useMutation({
    mutationFn: async ({ id, isFavorite }: { id: string; isFavorite: boolean }) => {
      const { error } = await supabase
        .from("ml_notes")
        .update({ is_favorite: !isFavorite })
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ml_notes"] });
    },
  });

  const categories = [...new Set(notesQuery.data?.map(n => n.category).filter(Boolean) || [])];
  const allTags = [...new Set(notesQuery.data?.flatMap(n => n.tags || []) || [])];

  return {
    notes: notesQuery.data ?? [],
    favoriteNotes: favoriteNotesQuery.data ?? [],
    categories,
    allTags,
    isLoading: notesQuery.isLoading,
    error: notesQuery.error,
    createNote,
    updateNote,
    deleteNote,
    toggleFavorite,
  };
}
