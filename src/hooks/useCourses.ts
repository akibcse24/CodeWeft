import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { Tables, TablesInsert, TablesUpdate } from "@/integrations/supabase/types";

type Course = Tables<"courses">;
type CourseInsert = TablesInsert<"courses">;
type CourseUpdate = TablesUpdate<"courses">;

export function useCourses() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const coursesQuery = useQuery({
    queryKey: ["courses", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from("courses")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      return data as Course[];
    },
    enabled: !!user,
  });

  const createCourse = useMutation({
    mutationFn: async (course: Omit<CourseInsert, "user_id">) => {
      if (!user) throw new Error("Not authenticated");
      const { data, error } = await supabase
        .from("courses")
        .insert({ ...course, user_id: user.id })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["courses"] });
    },
  });

  const updateCourse = useMutation({
    mutationFn: async ({ id, ...updates }: CourseUpdate & { id: string }) => {
      const { data, error } = await supabase
        .from("courses")
        .update(updates)
        .eq("id", id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["courses"] });
    },
  });

  const deleteCourse = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("courses")
        .delete()
        .eq("id", id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["courses"] });
    },
  });

  return {
    courses: coursesQuery.data ?? [],
    isLoading: coursesQuery.isLoading,
    error: coursesQuery.error,
    createCourse,
    updateCourse,
    deleteCourse,
  };
}
