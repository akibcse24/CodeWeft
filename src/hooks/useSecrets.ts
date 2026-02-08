import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { Tables, TablesInsert, TablesUpdate } from "@/integrations/supabase/types";

type Secret = Tables<"secrets_vault">;
type SecretInsert = TablesInsert<"secrets_vault">;
type SecretUpdate = TablesUpdate<"secrets_vault">;

export function useSecrets() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const secretsQuery = useQuery({
    queryKey: ["secrets_vault", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from("secrets_vault")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      return data as Secret[];
    },
    enabled: !!user,
  });

  const createSecret = useMutation({
    mutationFn: async (secret: Omit<SecretInsert, "user_id">) => {
      if (!user) throw new Error("Not authenticated");
      const { data, error } = await supabase
        .from("secrets_vault")
        .insert({ ...secret, user_id: user.id })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["secrets_vault"] });
    },
  });

  const updateSecret = useMutation({
    mutationFn: async ({ id, ...updates }: SecretUpdate & { id: string }) => {
      const { data, error } = await supabase
        .from("secrets_vault")
        .update(updates)
        .eq("id", id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["secrets_vault"] });
    },
  });

  const deleteSecret = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("secrets_vault")
        .delete()
        .eq("id", id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["secrets_vault"] });
    },
  });

  const categories = [...new Set(secretsQuery.data?.map(s => s.category).filter(Boolean) || [])];

  return {
    secrets: secretsQuery.data ?? [],
    categories,
    isLoading: secretsQuery.isLoading,
    error: secretsQuery.error,
    createSecret,
    updateSecret,
    deleteSecret,
  };
}
