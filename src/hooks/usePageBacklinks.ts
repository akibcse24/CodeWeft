import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Database } from '@/integrations/supabase/types';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

type BacklinkRecord = Database['public']['Tables']['page_backlinks']['Row'];

interface BacklinkWithPage extends BacklinkRecord {
  source_page?: {
    id: string;
    title: string;
    icon: string | null;
  };
  target_page?: {
    id: string;
    title: string;
    icon: string | null;
  };
}

export function usePageBacklinks(pageId: string | null) {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: backlinks, isLoading } = useQuery({
    queryKey: ['pageBacklinks', pageId],
    queryFn: async () => {
      if (!pageId || !user?.id) return [];
      
      const { data, error } = await supabase
        .from('page_backlinks')
        .select(`
          *,
          source_page:pages!source_page_id(id, title, icon),
          target_page:pages!target_page_id(id, title, icon)
        `)
        .or(`source_page_id.eq.${pageId},target_page_id.eq.${pageId}`)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as BacklinkWithPage[];
    },
    enabled: !!pageId && !!user?.id,
  });

  const incomingBacklinks = backlinks?.filter(b => b.target_page_id === pageId) || [];
  const outgoingBacklinks = backlinks?.filter(b => b.source_page_id === pageId) || [];

  const createBacklink = useMutation({
    mutationFn: async ({ sourceId, targetId }: { sourceId: string; targetId: string }) => {
      const { data, error } = await supabase
        .from('page_backlinks')
        .insert({
          source_page_id: sourceId,
          target_page_id: targetId,
        })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pageBacklinks'] });
      queryClient.invalidateQueries({ queryKey: ['pageBacklinks', pageId] });
    },
    onError: (error: Error) => {
      if (!error.message.includes('duplicate')) {
        toast({ title: 'Failed to create link', description: error.message, variant: 'destructive' });
      }
    },
  });

  const deleteBacklink = useMutation({
    mutationFn: async (backlinkId: string) => {
      const { error } = await supabase
        .from('page_backlinks')
        .delete()
        .eq('id', backlinkId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pageBacklinks'] });
      queryClient.invalidateQueries({ queryKey: ['pageBacklinks', pageId] });
    },
    onError: (error: Error) => {
      toast({ title: 'Failed to remove link', description: error.message, variant: 'destructive' });
    },
  });

  return {
    backlinks,
    incomingBacklinks,
    outgoingBacklinks,
    isLoading,
    createBacklink,
    deleteBacklink,
  };
}
