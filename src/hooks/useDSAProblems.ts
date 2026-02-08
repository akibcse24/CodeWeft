import { useState, useEffect, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
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

  const fetchLocal = useCallback(async () => {
    if (!user) return;
    const data = await db.dsa_problems
      .where("user_id")
      .equals(user.id)
      .reverse()
      .sortBy("created_at");
    setLocalProblems(data);
  }, [user]);

  useEffect(() => {
    fetchLocal();
  }, [fetchLocal]);

  const problemsQuery = useQuery({
    queryKey: ["dsa_problems-cloud", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from("dsa_problems")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      if (data) {
        await db.dsa_problems.bulkPut(data);
        await fetchLocal();
      }
      return data as DSAProblem[];
    },
    enabled: !!user,
  });

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
        solution_notes: (problem as any).solution_notes || "",
        next_review_date: (problem as any).next_review_date || null,
        last_reviewed: null,
        review_count: 0,
        solved_at: (problem as any).solved_at || null,
        space_complexity: problem.space_complexity || "",
        time_complexity: problem.time_complexity || "",
        topics: (problem as any).topics || [],
        understanding_rating: problem.understanding_rating || 0,
      };

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

      // 3. Background Sync
      try {
        await supabase.from("dsa_problems").insert(newProblem);
      } catch (e) {
        console.warn("Background problem creation sync deferred.");
      }

      return newProblem;
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["dsa_problems-cloud"] });
    },
  });

  const updateProblem = useMutation({
    mutationFn: async ({ id, ...updates }: DSAProblemUpdate & { id: string }) => {
      // 1. Local
      await db.dsa_problems.update(id, updates);
      await fetchLocal();

      const current = await db.dsa_problems.get(id);

      // 2. Queue
      await db.sync_queue.add({
        table: 'dsa_problems',
        action: 'update',
        data: current,
        timestamp: Date.now()
      });

      // 3. Background Sync
      try {
        await supabase.from("dsa_problems").update(updates).eq("id", id);
      } catch (e) {
        console.warn("Background problem update sync deferred.");
      }

      return current;
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["dsa_problems-cloud"] });
    },
  });

  const deleteProblem = useMutation({
    mutationFn: async (id: string) => {
      // 1. Local
      await db.dsa_problems.delete(id);
      await fetchLocal();

      // 2. Queue
      await db.sync_queue.add({
        table: 'dsa_problems',
        action: 'delete',
        data: { id },
        timestamp: Date.now()
      });

      // 3. Background Sync
      try {
        await supabase.from("dsa_problems").delete().eq("id", id);
      } catch (e) {
        console.warn("Background problem deletion sync deferred.");
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["dsa_problems-cloud"] });
    },
  });

  return {
    problems: localProblems,
    isLoading: problemsQuery.isLoading && localProblems.length === 0,
    error: problemsQuery.error,
    createProblem,
    updateProblem,
    deleteProblem,
  };
}
