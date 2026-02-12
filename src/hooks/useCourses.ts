import { useState, useEffect, useCallback, useMemo } from "react";
import { useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { Tables, TablesInsert, TablesUpdate } from "@/integrations/supabase/types";
import { db } from "@/lib/db";

type Course = Tables<"courses">;
type CourseInsert = TablesInsert<"courses">;
type CourseUpdate = TablesUpdate<"courses">;

export function useCourses() {
  const { user } = useAuth();
  const [localCourses, setLocalCourses] = useState<Course[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchLocal = useCallback(async () => {
    if (!user) return;
    const all = await db.courses.where("user_id").equals(user.id).and(c => !c.deleted_at).reverse().sortBy("updated_at");
    setLocalCourses(all);
    setIsLoading(false);
  }, [user]);

  useEffect(() => { fetchLocal(); }, [fetchLocal]);

  // One-time hydration: only when Dexie is empty (fresh sign-in)
  useEffect(() => {
    if (!user) return;
    const hydrate = async () => {
      const count = await db.courses.where("user_id").equals(user.id).count();
      if (count > 0) return;
      try {
        const { data } = await supabase.from("courses").select("*").eq("user_id", user.id).is("deleted_at", null);
        if (data?.length) { await db.courses.bulkPut(data as Course[]); await fetchLocal(); }
      } catch { /* offline */ }
    };
    hydrate();
  }, [user, fetchLocal]);

  const createCourse = useMutation({
    mutationFn: async (course: Omit<CourseInsert, "user_id">) => {
      if (!user) throw new Error("Not authenticated");
      const id = crypto.randomUUID();
      const now = new Date().toISOString();
      const rec = { id, ...course, user_id: user.id, created_at: now, updated_at: now, deleted_at: null } as Course;
      await db.courses.add(rec);
      await fetchLocal();
      db.sync_queue.add({ table: 'courses', action: 'insert', data: rec, timestamp: Date.now() });
      supabase.from("courses").insert([rec]).then(({ error }) => { if (error) console.warn("[courses] bg insert:", error.message); });
      return rec;
    },
  });

  const updateCourse = useMutation({
    mutationFn: async ({ id, ...updates }: CourseUpdate & { id: string }) => {
      const fin = { ...updates, updated_at: new Date().toISOString() };
      await db.courses.update(id, fin);
      await fetchLocal();
      const cur = await db.courses.get(id);
      db.sync_queue.add({ table: 'courses', action: 'update', data: cur || { id, ...fin }, timestamp: Date.now() });
      supabase.from("courses").update(fin).eq("id", id).then(({ error }) => { if (error) console.warn("[courses] bg update:", error.message); });
      return cur;
    },
  });

  const deleteCourse = useMutation({
    mutationFn: async (id: string) => {
      const now = new Date().toISOString();
      await db.courses.update(id, { deleted_at: now, updated_at: now });
      await fetchLocal();
      db.sync_queue.add({ table: 'courses', action: 'delete', data: { id, deleted_at: now }, timestamp: Date.now() });
      supabase.from("courses").update({ deleted_at: now }).eq("id", id).then(({ error }) => { if (error) console.warn("[courses] bg delete:", error.message); });
    },
  });

  return useMemo(() => ({
    courses: localCourses,
    isLoading: isLoading && localCourses.length === 0,
    error: null,
    createCourse,
    updateCourse,
    deleteCourse,
  }), [localCourses, isLoading, createCourse, updateCourse, deleteCourse]);
}
