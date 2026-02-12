import { useState, useEffect, useCallback, useMemo } from "react";
import { useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { Tables, TablesInsert, TablesUpdate } from "@/integrations/supabase/types";
import { db } from "@/lib/db";

type FlashcardDeck = Tables<"flashcard_decks">;
type FlashcardDeckInsert = TablesInsert<"flashcard_decks">;
type FlashcardDeckUpdate = TablesUpdate<"flashcard_decks">;
type Flashcard = Tables<"flashcards">;
type FlashcardInsert = TablesInsert<"flashcards">;
type FlashcardUpdate = TablesUpdate<"flashcards">;

export function useFlashcards() {
  const { user } = useAuth();
  const [localDecks, setLocalDecks] = useState<FlashcardDeck[]>([]);
  const [dueCards, setDueCards] = useState<Flashcard[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchLocalDecks = useCallback(async () => {
    if (!user) return;
    const all = await db.flashcard_decks.where("user_id").equals(user.id).and(d => !d.deleted_at).reverse().sortBy("updated_at");
    setLocalDecks(all);
    setIsLoading(false);
  }, [user]);

  const fetchDueCards = useCallback(async () => {
    if (!user) return;
    const now = new Date().toISOString();
    const due = await db.flashcards
      .filter(c => !c.deleted_at && (c.next_review_date ?? "") <= now)
      .toArray();
    setDueCards(due as Flashcard[]);
  }, [user]);

  useEffect(() => { fetchLocalDecks(); fetchDueCards(); }, [fetchLocalDecks, fetchDueCards]);

  // One-time hydration for decks
  useEffect(() => {
    if (!user) return;
    const hydrate = async () => {
      const count = await db.flashcard_decks.where("user_id").equals(user.id).count();
      if (count > 0) return;
      try {
        const { data } = await supabase.from("flashcard_decks").select("*").eq("user_id", user.id).is("deleted_at", null);
        if (data?.length) { await db.flashcard_decks.bulkPut(data as FlashcardDeck[]); await fetchLocalDecks(); }
      } catch { /* offline */ }
    };
    hydrate();
  }, [user, fetchLocalDecks]);

  // One-time hydration for cards
  useEffect(() => {
    if (!user) return;
    const hydrate = async () => {
      const count = await db.flashcards.where("user_id").equals(user.id).count();
      if (count > 0) return;
      try {
        const { data } = await supabase.from("flashcards").select("*").eq("user_id", user.id).is("deleted_at", null);
        if (data?.length) { await db.flashcards.bulkPut(data as Flashcard[]); await fetchDueCards(); }
      } catch { /* offline */ }
    };
    hydrate();
  }, [user, fetchDueCards]);

  // ─── Deck mutations ────────────────────────────────────────────────────────
  const createDeck = useMutation({
    mutationFn: async (deck: Omit<FlashcardDeckInsert, "user_id">) => {
      if (!user) throw new Error("Not authenticated");
      const id = crypto.randomUUID();
      const now = new Date().toISOString();
      const rec = { id, ...deck, user_id: user.id, created_at: now, updated_at: now, deleted_at: null } as FlashcardDeck;
      await db.flashcard_decks.add(rec);
      await fetchLocalDecks();
      db.sync_queue.add({ table: 'flashcard_decks', action: 'insert', data: rec, timestamp: Date.now() });
      supabase.from("flashcard_decks").insert([rec]).then(({ error }) => { if (error) console.warn("[flashcards] bg deck insert:", error.message); });
      return rec;
    },
  });

  const updateDeck = useMutation({
    mutationFn: async ({ id, ...updates }: FlashcardDeckUpdate & { id: string }) => {
      const fin = { ...updates, updated_at: new Date().toISOString() };
      await db.flashcard_decks.update(id, fin);
      await fetchLocalDecks();
      const cur = await db.flashcard_decks.get(id);
      db.sync_queue.add({ table: 'flashcard_decks', action: 'update', data: cur || { id, ...fin }, timestamp: Date.now() });
      supabase.from("flashcard_decks").update(fin).eq("id", id).then(({ error }) => { if (error) console.warn("[flashcards] bg deck update:", error.message); });
      return cur;
    },
  });

  const deleteDeck = useMutation({
    mutationFn: async (id: string) => {
      const now = new Date().toISOString();
      await db.flashcard_decks.update(id, { deleted_at: now, updated_at: now });
      await fetchLocalDecks();
      db.sync_queue.add({ table: 'flashcard_decks', action: 'delete', data: { id, deleted_at: now }, timestamp: Date.now() });
      supabase.from("flashcard_decks").update({ deleted_at: now }).eq("id", id).then(({ error }) => { if (error) console.warn("[flashcards] bg deck delete:", error.message); });
    },
  });

  // ─── Card mutations ────────────────────────────────────────────────────────
  const createCard = useMutation({
    mutationFn: async (card: Omit<FlashcardInsert, "user_id">) => {
      if (!user) throw new Error("Not authenticated");
      const id = crypto.randomUUID();
      const now = new Date().toISOString();
      const rec = { id, ...card, user_id: user.id, created_at: now, updated_at: now, deleted_at: null } as Flashcard;
      await db.flashcards.add(rec);
      await fetchDueCards();
      db.sync_queue.add({ table: 'flashcards', action: 'insert', data: rec, timestamp: Date.now() });
      supabase.from("flashcards").insert([rec]).then(({ error }) => { if (error) console.warn("[flashcards] bg card insert:", error.message); });
      return rec;
    },
  });

  const updateCard = useMutation({
    mutationFn: async ({ id, ...updates }: FlashcardUpdate & { id: string }) => {
      const fin = { ...updates, updated_at: new Date().toISOString() };
      await db.flashcards.update(id, fin);
      const cur = await db.flashcards.get(id);
      db.sync_queue.add({ table: 'flashcards', action: 'update', data: cur || { id, ...fin }, timestamp: Date.now() });
      supabase.from("flashcards").update(fin).eq("id", id).then(({ error }) => { if (error) console.warn("[flashcards] bg card update:", error.message); });
      return cur;
    },
  });

  const deleteCard = useMutation({
    mutationFn: async (id: string) => {
      const now = new Date().toISOString();
      await db.flashcards.update(id, { deleted_at: now, updated_at: now });
      await fetchDueCards();
      db.sync_queue.add({ table: 'flashcards', action: 'delete', data: { id, deleted_at: now }, timestamp: Date.now() });
      supabase.from("flashcards").update({ deleted_at: now }).eq("id", id).then(({ error }) => { if (error) console.warn("[flashcards] bg card delete:", error.message); });
    },
  });

  // SM-2 spaced repetition
  const reviewCard = useMutation({
    mutationFn: async ({ id, quality }: { id: string; quality: number }) => {
      let card = await db.flashcards.get(id);
      if (!card) {
        // Fallback to cloud only if not in Dexie
        try {
          const { data } = await supabase.from("flashcards").select("*").eq("id", id).single();
          if (data) { card = data as Flashcard; await db.flashcards.put(card); }
        } catch { /* offline */ }
      }
      if (!card) throw new Error("Card not found");

      let easeFactor = card.ease_factor || 2.5;
      let interval = card.interval_days || 0;
      let repetitions = card.repetitions || 0;

      if (quality < 3) { repetitions = 0; interval = 1; }
      else {
        if (repetitions === 0) interval = 1;
        else if (repetitions === 1) interval = 6;
        else interval = Math.round(interval * easeFactor);
        repetitions += 1;
      }

      easeFactor = Math.max(1.3, easeFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02)));
      const nextReviewDate = new Date();
      nextReviewDate.setDate(nextReviewDate.getDate() + interval);

      const updates = {
        ease_factor: easeFactor, interval_days: interval, repetitions,
        next_review_date: nextReviewDate.toISOString(),
        last_reviewed_at: new Date().toISOString(), updated_at: new Date().toISOString(),
      };

      await db.flashcards.update(id, updates);
      await fetchDueCards();
      const updated = await db.flashcards.get(id);
      db.sync_queue.add({ table: 'flashcards', action: 'update', data: updated || { id, ...updates }, timestamp: Date.now() });
      supabase.from("flashcards").update(updates).eq("id", id).then(({ error }) => { if (error) console.warn("[flashcards] bg review:", error.message); });
      return updated;
    },
  });

  // Get cards for a specific deck (local-first)
  const getCardsForDeck = (deckId: string) => ({
    data: null as Flashcard[] | null,
    isLoading: false,
    refetch: async () => {
      const local = await db.flashcards.where("deck_id").equals(deckId).and(c => !c.deleted_at).reverse().sortBy("updated_at");
      if (local.length > 0) return local as Flashcard[];
      // Hydrate from cloud only if empty
      try {
        const { data } = await supabase.from("flashcards").select("*").eq("deck_id", deckId).is("deleted_at", null);
        if (data?.length) await db.flashcards.bulkPut(data as Flashcard[]);
        return (data || []) as Flashcard[];
      } catch { return []; }
    }
  });

  return useMemo(() => ({
    decks: localDecks,
    isLoadingDecks: isLoading && localDecks.length === 0,
    createDeck, updateDeck, deleteDeck,
    dueCards,
    isLoadingDueCards: false,
    createCard, updateCard, deleteCard, reviewCard,
    getCardsForDeck,
  }), [localDecks, isLoading, dueCards, createDeck, updateDeck, deleteDeck, createCard, updateCard, deleteCard, reviewCard]);
}

// Standalone hook for deck cards (local-first with one-time cloud hydration)
export function useDeckCards(deckId: string) {
  const [cards, setCards] = useState<Flashcard[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const local = await db.flashcards.where("deck_id").equals(deckId).and(c => !c.deleted_at).reverse().sortBy("updated_at");
      if (local.length > 0) {
        setCards(local as Flashcard[]);
        setIsLoading(false);
        return;
      }
      // One-time hydration
      try {
        const { data } = await supabase.from("flashcards").select("*").eq("deck_id", deckId).is("deleted_at", null);
        if (data?.length) {
          await db.flashcards.bulkPut(data as Flashcard[]);
          setCards(data as Flashcard[]);
        }
      } catch { /* offline */ }
      setIsLoading(false);
    };
    load();
  }, [deckId]);

  return {
    data: cards, isLoading, refetch: async () => {
      const local = await db.flashcards.where("deck_id").equals(deckId).and(c => !c.deleted_at).reverse().sortBy("updated_at");
      setCards(local as Flashcard[]);
      return local as Flashcard[];
    }
  };
}
