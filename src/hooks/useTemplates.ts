import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Database } from '@/integrations/supabase/types';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

type PageTemplate = Database['public']['Tables']['page_templates']['Row'];
type TemplateInsert = Database['public']['Tables']['page_templates']['Insert'];
type TemplateUpdate = Database['public']['Tables']['page_templates']['Update'];

export function useTemplates() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: templates, isLoading } = useQuery({
    queryKey: ['templates', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      
      const { data, error } = await supabase
        .from('page_templates')
        .select('*')
        .eq('user_id', user.id)
        .order('category', { ascending: true })
        .order('name', { ascending: true });
      
      if (error) throw error;
      return data as PageTemplate[];
    },
    enabled: !!user?.id,
  });

  const createTemplate = useMutation({
    mutationFn: async (template: TemplateInsert) => {
      const { data, error } = await supabase
        .from('page_templates')
        .insert(template)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['templates', user?.id] });
      toast({ title: 'Template created' });
    },
    onError: (error: Error) => {
      toast({ title: 'Failed to create template', description: error.message, variant: 'destructive' });
    },
  });

  const updateTemplate = useMutation({
    mutationFn: async ({ id, ...updates }: TemplateUpdate & { id: string }) => {
      const { data, error } = await supabase
        .from('page_templates')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['templates', user?.id] });
      toast({ title: 'Template updated' });
    },
    onError: (error: Error) => {
      toast({ title: 'Failed to update template', description: error.message, variant: 'destructive' });
    },
  });

  const deleteTemplate = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('page_templates')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['templates', user?.id] });
      toast({ title: 'Template deleted' });
    },
    onError: (error: Error) => {
      toast({ title: 'Failed to delete template', description: error.message, variant: 'destructive' });
    },
  });

  const incrementUsage = async (id: string) => {
    const template = templates?.find(t => t.id === id);
    if (template) {
      await supabase
        .from('page_templates')
        .update({ usage_count: (template.usage_count || 0) + 1 })
        .eq('id', id);
    }
  };

  const { data: defaultTemplates } = useQuery({
    queryKey: ['defaultTemplates'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('page_templates')
        .select('*')
        .eq('is_default', true)
        .order('category', { ascending: true });
      
      if (error) throw error;
      return data as PageTemplate[];
    },
  });

  const { data: templatesByCategory } = useQuery({
    queryKey: ['templatesByCategory', user?.id],
    queryFn: async () => {
      if (!user?.id) return {};
      
      const { data, error } = await supabase
        .from('page_templates')
        .select('*')
        .eq('user_id', user.id);
      
      if (error) throw error;
      
      return data?.reduce((acc, template) => {
        const category = template.category || 'custom';
        if (!acc[category]) acc[category] = [];
        acc[category].push(template);
        return acc;
      }, {} as Record<string, PageTemplate[]>) || {};
    },
    enabled: !!user?.id,
  });

  return {
    templates,
    templatesByCategory,
    defaultTemplates,
    isLoading,
    createTemplate,
    updateTemplate,
    deleteTemplate,
    incrementUsage,
  };
}
