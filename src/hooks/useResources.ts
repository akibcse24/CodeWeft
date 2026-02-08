import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { Tables, TablesInsert, TablesUpdate } from "@/integrations/supabase/types";

type Resource = Tables<"resources">;
type ResourceInsert = TablesInsert<"resources">;
type ResourceUpdate = TablesUpdate<"resources">;

export function useResources() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const resourcesQuery = useQuery({
    queryKey: ["resources", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from("resources")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      return data as Resource[];
    },
    enabled: !!user,
  });

  const createResource = useMutation({
    mutationFn: async (resource: Omit<ResourceInsert, "user_id">) => {
      if (!user) throw new Error("Not authenticated");
      const { data, error } = await supabase
        .from("resources")
        .insert({ ...resource, user_id: user.id })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["resources"] });
    },
  });

  const updateResource = useMutation({
    mutationFn: async ({ id, ...updates }: ResourceUpdate & { id: string }) => {
      const { data, error } = await supabase
        .from("resources")
        .update(updates)
        .eq("id", id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["resources"] });
    },
  });

  const deleteResource = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("resources")
        .delete()
        .eq("id", id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["resources"] });
    },
  });

  const categories = [...new Set(resourcesQuery.data?.map(r => r.category).filter(Boolean) || [])];
  const allTags = [...new Set(resourcesQuery.data?.flatMap(r => r.tags || []) || [])];
  const types = [...new Set(resourcesQuery.data?.map(r => r.type).filter(Boolean) || [])];

  return {
    resources: resourcesQuery.data ?? [],
    categories,
    allTags,
    types,
    isLoading: resourcesQuery.isLoading,
    error: resourcesQuery.error,
    createResource,
    updateResource,
    deleteResource,
  };
}
