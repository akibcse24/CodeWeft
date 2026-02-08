import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { Tables, TablesInsert, TablesUpdate } from "@/integrations/supabase/types";

type FlashcardDeck = Tables<"flashcard_decks">;
type FlashcardDeckInsert = TablesInsert<"flashcard_decks">;
type FlashcardDeckUpdate = TablesUpdate<"flashcard_decks">;
type Flashcard = Tables<"flashcards">;
type FlashcardInsert = TablesInsert<"flashcards">;
type FlashcardUpdate = TablesUpdate<"flashcards">;

export function useFlashcards() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Decks
  const decksQuery = useQuery({
    queryKey: ["flashcard_decks", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from("flashcard_decks")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as FlashcardDeck[];
    },
    enabled: !!user,
  });

  const createDeck = useMutation({
    mutationFn: async (deck: Omit<FlashcardDeckInsert, "user_id">) => {
      if (!user) throw new Error("Not authenticated");
      const { data, error } = await supabase
        .from("flashcard_decks")
        .insert({ ...deck, user_id: user.id })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["flashcard_decks"] });
    },
  });

  const updateDeck = useMutation({
    mutationFn: async ({ id, ...updates }: FlashcardDeckUpdate & { id: string }) => {
      const { data, error } = await supabase
        .from("flashcard_decks")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["flashcard_decks"] });
    },
  });

  const deleteDeck = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("flashcard_decks")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["flashcard_decks"] });
    },
  });

  const getDueCards = useQuery({
    queryKey: ["flashcards_due", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from("flashcards")
        .select("*")
        .eq("user_id", user.id)
        .lte("next_review_date", new Date().toISOString())
        .order("next_review_date", { ascending: true });

      if (error) throw error;
      return data as Flashcard[];
    },
    enabled: !!user,
  });

  const createCard = useMutation({
    mutationFn: async (card: Omit<FlashcardInsert, "user_id">) => {
      if (!user) throw new Error("Not authenticated");
      const { data, error } = await supabase
        .from("flashcards")
        .insert({ ...card, user_id: user.id })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["flashcards"] });
      queryClient.invalidateQueries({ queryKey: ["flashcard_decks"] });
    },
  });

  const updateCard = useMutation({
    mutationFn: async ({ id, ...updates }: FlashcardUpdate & { id: string }) => {
      const { data, error } = await supabase
        .from("flashcards")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["flashcards"] });
      queryClient.invalidateQueries({ queryKey: ["flashcards_due"] });
    },
  });

  const deleteCard = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("flashcards")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["flashcards"] });
      queryClient.invalidateQueries({ queryKey: ["flashcard_decks"] });
    },
  });

  // SM-2 Algorithm for spaced repetition
  const reviewCard = useMutation({
    mutationFn: async ({ id, quality }: { id: string; quality: number }) => {
      // quality: 0-5 (0-2 = again, 3 = hard, 4 = good, 5 = easy)
      const { data: card, error: fetchError } = await supabase
        .from("flashcards")
        .select("*")
        .eq("id", id)
        .single();

      if (fetchError) throw fetchError;

      let easeFactor = card.ease_factor || 2.5;
      let interval = card.interval_days || 0;
      let repetitions = card.repetitions || 0;

      if (quality < 3) {
        repetitions = 0;
        interval = 1;
      } else {
        if (repetitions === 0) {
          interval = 1;
        } else if (repetitions === 1) {
          interval = 6;
        } else {
          interval = Math.round(interval * easeFactor);
        }
        repetitions += 1;
      }

      easeFactor = Math.max(1.3, easeFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02)));

      const nextReviewDate = new Date();
      nextReviewDate.setDate(nextReviewDate.getDate() + interval);

      const { data, error } = await supabase
        .from("flashcards")
        .update({
          ease_factor: easeFactor,
          interval_days: interval,
          repetitions,
          next_review_date: nextReviewDate.toISOString(),
          last_reviewed_at: new Date().toISOString(),
        })
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["flashcards"] });
      queryClient.invalidateQueries({ queryKey: ["flashcards_due"] });
    },
  });

  // Wrapper function for deck cards
  const getCardsForDeck = (deckId: string) => {
    return {
      data: null as Flashcard[] | null,
      isLoading: false,
      refetch: async () => {
        const { data, error } = await supabase
          .from("flashcards")
          .select("*")
          .eq("deck_id", deckId)
          .order("created_at", { ascending: false });
        if (error) throw error;
        return data as Flashcard[];
      }
    };
  };

  return {
    decks: decksQuery.data ?? [],
    isLoadingDecks: decksQuery.isLoading,
    createDeck,
    updateDeck,
    deleteDeck,
    dueCards: getDueCards.data ?? [],
    isLoadingDueCards: getDueCards.isLoading,
    createCard,
    updateCard,
    deleteCard,
    reviewCard,
    getCardsForDeck,
  };
}

export function useDeckCards(deckId: string) {
  return useQuery({
    queryKey: ["flashcards", deckId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("flashcards")
        .select("*")
        .eq("deck_id", deckId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as Flashcard[];
    },
    enabled: !!deckId,
  });
}
