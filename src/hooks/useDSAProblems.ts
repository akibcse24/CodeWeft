import { useState, useEffect, useCallback, useMemo } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { Tables, TablesInsert, TablesUpdate } from "@/integrations/supabase/types";
import { db } from "@/lib/db";

type DSAProblem = Tables<"dsa_problems">;
type DSAProblemInsert = TablesInsert<"dsa_problems">;
type DSAProblemUpdate = TablesUpdate<"dsa_problems">;

export function useDSAProblems() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [localProblems, setLocalProblems] = useState<DSAProblem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchLocal = useCallback(async () => {
    if (!user) return;
    const data = await db.dsa_problems
      .where("user_id")
      .equals(user.id)
      .filter(p => !p.deleted_at)
      .reverse()
      .sortBy("created_at");
    setLocalProblems(data);
    setIsLoading(false);
  }, [user]);

  useEffect(() => {
    fetchLocal();
  }, [fetchLocal]);

  // One-time Hydration
  useEffect(() => {
    if (!user) return;
    const hydrate = async () => {
      const count = await db.dsa_problems.where("user_id").equals(user.id).count();
      if (count > 0) return;

      try {
        const { data } = await supabase
          .from("dsa_problems")
          .select("*")
          .eq("user_id", user.id)
          .is("deleted_at", null)
          .order("created_at", { ascending: false });

        if (data && data.length > 0) {
          await db.dsa_problems.bulkPut(data as DSAProblem[]);
          await fetchLocal();
        }
      } catch (e) {
        console.warn("[useDSAProblems] Hydration failed", e);
      }
    };
    hydrate();
  }, [user, fetchLocal]);

  const createProblem = useMutation({
    mutationFn: async (problem: Omit<DSAProblemInsert, "user_id">) => {
      if (!user) throw new Error("Not authenticated");
      const id = crypto.randomUUID();
      const newProblem = {
        id,
        user_id: user.id,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        title: problem.title || "Untitled Problem",
        difficulty: problem.difficulty || "medium",
        status: problem.status || "todo",
        platform: problem.platform || "LeetCode",
        url: problem.url || "",
        patterns: (problem.patterns as string[]) || [],
        companies: (problem.companies as string[]) || [],
        notes: problem.notes || "",
        solution: problem.solution || "",
        solution_notes: problem.solution_notes || "",
        next_review_date: problem.next_review_date || null,
        last_reviewed: null,
        review_count: 0,
        solved_at: problem.solved_at || null,
        space_complexity: problem.space_complexity || "",
        time_complexity: problem.time_complexity || "",
        topics: problem.topics || [],
        understanding_rating: problem.understanding_rating || 0,
        deleted_at: null,
      } as DSAProblem;

      // 1. Local
      await db.dsa_problems.add(newProblem);
      await fetchLocal();

      // 2. Queue
      await db.sync_queue.add({
        table: 'dsa_problems',
        action: 'insert',
        data: newProblem,
        timestamp: Date.now()
      });

      // 3. Fire-and-Forget Cloud Sync
      supabase.from("dsa_problems").insert(newProblem).then(({ error }) => {
        if (error) console.warn("[useDSAProblems] Background insert failed:", error);
      });

      return newProblem;
    },
  });

  const updateProblem = useMutation({
    mutationFn: async ({ id, ...updates }: DSAProblemUpdate & { id: string }) => {
      const finalUpdates = { ...updates, updated_at: new Date().toISOString() };

      // 1. Local
      await db.dsa_problems.update(id, finalUpdates);
      await fetchLocal();

      const current = await db.dsa_problems.get(id);

      // 2. Queue
      if (current) {
        await db.sync_queue.add({
          table: 'dsa_problems',
          action: 'update',
          data: current,
          timestamp: Date.now()
        });
      }

      // 3. Fire-and-Forget Cloud Sync
      supabase.from("dsa_problems").update(finalUpdates).eq("id", id).then(({ error }) => {
        if (error) console.warn("[useDSAProblems] Background update failed:", error);
      });

      return current;
    },
  });

  const deleteProblem = useMutation({
    mutationFn: async (id: string) => {
      const now = new Date().toISOString();

      // 1. Local Soft Delete
      await db.dsa_problems.update(id, { deleted_at: now, updated_at: now });
      await fetchLocal();

      // 2. Queue for Sync
      await db.sync_queue.add({
        table: 'dsa_problems',
        action: 'delete',
        data: { id, deleted_at: now },
        timestamp: Date.now()
      });

      // 3. Fire-and-Forget Cloud Sync
      supabase.from("dsa_problems").update({ deleted_at: now }).eq("id", id).then(({ error }) => {
        if (error) console.warn("[useDSAProblems] Background delete failed:", error);
      });
    },
  });

  return useMemo(() => ({
    problems: localProblems,
    isLoading: isLoading && localProblems.length === 0,
    error: null,
    createProblem,
    updateProblem,
    deleteProblem,
  }), [localProblems, isLoading, createProblem, updateProblem, deleteProblem]);
}
