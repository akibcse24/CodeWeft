import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Database } from '@/integrations/supabase/types';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

type PageVersion = Database['public']['Tables']['page_versions']['Row'];

export function usePageVersions(pageId: string | null) {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: versions, isLoading } = useQuery({
    queryKey: ['pageVersions', pageId],
    queryFn: async () => {
      if (!pageId || !user?.id) return [];
      
      const { data, error } = await supabase
        .from('page_versions')
        .select('*')
        .eq('page_id', pageId)
        .eq('user_id', user.id)
        .order('version_number', { ascending: false });
      
      if (error) throw error;
      return data as PageVersion[];
    },
    enabled: !!pageId && !!user?.id,
  });

  const createVersion = useMutation({
    mutationFn: async () => {
      if (!pageId) throw new Error('No page ID');
      
      const { data: latestVersion } = await supabase
        .from('page_versions')
        .select('version_number')
        .eq('page_id', pageId)
        .order('version_number', { ascending: false })
        .limit(1)
        .single();
      
      const newVersionNumber = (latestVersion?.version_number || 0) + 1;
      
      const { data, error } = await supabase
        .from('page_versions')
        .insert({
          page_id: pageId,
          user_id: user!.id,
          title: '', // Empty title for automatic versioning
          version_number: newVersionNumber,
        })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pageVersions', pageId] });
    },
    onError: (error: Error) => {
      toast({ title: 'Failed to create version', description: error.message, variant: 'destructive' });
    },
  });

  const restoreVersion = useMutation({
    mutationFn: async (version: PageVersion) => {
      const { error } = await supabase
        .from('page_versions')
        .insert({
          page_id: version.page_id,
          user_id: user!.id,
          title: version.title,
          content: version.content,
          cover_url: version.cover_url,
          icon: version.icon,
          tags: version.tags,
          version_number: version.version_number + 1,
        })
        .select()
        .single();
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pageVersions', pageId] });
      toast({ title: 'Version restored' });
    },
    onError: (error: Error) => {
      toast({ title: 'Failed to restore version', description: error.message, variant: 'destructive' });
    },
  });

  const deleteVersion = useMutation({
    mutationFn: async (versionId: string) => {
      const { error } = await supabase
        .from('page_versions')
        .delete()
        .eq('id', versionId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pageVersions', pageId] });
      toast({ title: 'Version deleted' });
    },
    onError: (error: Error) => {
      toast({ title: 'Failed to delete version', description: error.message, variant: 'destructive' });
    },
  });

  const latestVersion = versions?.[0];
  const versionCount = versions?.length || 0;

  return {
    versions,
    latestVersion,
    versionCount,
    isLoading,
    createVersion,
    restoreVersion,
    deleteVersion,
  };
}
