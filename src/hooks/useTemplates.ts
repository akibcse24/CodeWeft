import { useState, useEffect, useCallback, useMemo } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Database } from '@/integrations/supabase/types';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { db } from '@/lib/db';

export type PageTemplate = Database['public']['Tables']['page_templates']['Row'];
export type TemplateInsert = Database['public']['Tables']['page_templates']['Insert'];
export type TemplateUpdate = Database['public']['Tables']['page_templates']['Update'];

export function useTemplates() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [localTemplates, setLocalTemplates] = useState<PageTemplate[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // 1. Manual Observer for Dexie
  const fetchLocal = useCallback(async () => {
    if (!user) return;
    const data = await db.page_templates
      .where("user_id")
      .equals(user.id)
      .toArray();
    // Sort locally as Dexie sorting with multiple keys is tricky
    data.sort((a, b) => {
      if (a.category === b.category) return (a.name || '').localeCompare(b.name || '');
      return (a.category || '').localeCompare(b.category || '');
    });
    setLocalTemplates(data as PageTemplate[]);
    setIsLoading(false);
  }, [user]);

  useEffect(() => {
    fetchLocal();
  }, [fetchLocal]);

  // 2. One-time Hydration
  useEffect(() => {
    if (!user) return;
    const hydrate = async () => {
      const count = await db.page_templates.where("user_id").equals(user.id).count();
      if (count > 0) return;

      try {
        const { data } = await supabase
          .from('page_templates')
          .select('*')
          .eq('user_id', user.id);

        if (data && data.length > 0) {
          await db.page_templates.bulkPut(data as PageTemplate[]);
          await fetchLocal();
        }
      } catch (e) {
        console.warn("[useTemplates] Hydration failed", e);
      }
    };
    hydrate();
  }, [user, fetchLocal]);

  const createTemplate = useMutation({
    mutationFn: async (template: TemplateInsert) => {
      if (!user) throw new Error("Not authenticated");
      const id = crypto.randomUUID();
      const newTemplate = {
        ...template,
        id,
        user_id: user.id,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        usage_count: 0
      } as PageTemplate;

      // 1. Local
      await db.page_templates.put(newTemplate);
      await fetchLocal();

      // 2. Queue
      await db.sync_queue.add({
        table: 'page_templates',
        action: 'insert',
        data: newTemplate,
        timestamp: Date.now()
      });

      // 3. Fire-and-Forget Cloud Sync
      supabase.from('page_templates').insert(newTemplate).then(({ error }) => {
        if (error) console.warn("[useTemplates] Background insert failed:", error);
      });

      return newTemplate;
    },
    onSuccess: () => {
      toast({ title: 'Template created' });
    },
    onError: (error: Error) => {
      toast({ title: 'Failed to create template', description: error.message, variant: 'destructive' });
    },
  });

  const updateTemplate = useMutation({
    mutationFn: async ({ id, ...updates }: TemplateUpdate & { id: string }) => {
      const finalUpdates = { ...updates, updated_at: new Date().toISOString() };

      // 1. Local
      await db.page_templates.update(id, finalUpdates);
      await fetchLocal();

      const current = await db.page_templates.get(id);

      // 2. Queue
      if (current) {
        await db.sync_queue.add({
          table: 'page_templates',
          action: 'update',
          data: current,
          timestamp: Date.now()
        });
      }

      // 3. Fire-and-Forget Cloud Sync
      supabase.from('page_templates').update(finalUpdates).eq('id', id).then(({ error }) => {
        if (error) console.warn("[useTemplates] Background update failed:", error);
      });

      return current;
    },
    onSuccess: () => {
      toast({ title: 'Template updated' });
    },
    onError: (error: Error) => {
      toast({ title: 'Failed to update template', description: error.message, variant: 'destructive' });
    },
  });

  const deleteTemplate = useMutation({
    mutationFn: async (id: string) => {
      // 1. Local Delete
      await db.page_templates.delete(id);
      await fetchLocal();

      // 2. Queue
      await db.sync_queue.add({
        table: 'page_templates',
        action: 'delete',
        data: { id },
        timestamp: Date.now()
      });

      // 3. Fire-and-Forget Cloud Sync
      supabase.from('page_templates').delete().eq('id', id).then(({ error }) => {
        if (error) console.warn("[useTemplates] Background delete failed:", error);
      });
    },
    onSuccess: () => {
      toast({ title: 'Template deleted' });
    },
    onError: (error: Error) => {
      toast({ title: 'Failed to delete template', description: error.message, variant: 'destructive' });
    },
  });

  const incrementUsage = async (id: string) => {
    const template = localTemplates.find(t => t.id === id);
    if (template) {
      updateTemplate.mutate({
        id,
        usage_count: (template.usage_count || 0) + 1
      });
    }
  };

  // We can treat default templates as read-only or just fetch from cloud as they change rarely
  // For now, let's keep them as a query since they are global/system data
  const { data: defaultTemplates } = useMutation({
    mutationFn: async () => { }, // dummy
  }) && { data: [] }; // Placeholder, better to fetch once

  // Actually, let's just use a simple fetch for defaults since they don't sync
  const [defaults, setDefaults] = useState<PageTemplate[]>([]);
  useEffect(() => {
    supabase.from('page_templates').select('*').eq('is_default', true).order('category')
      .then(({ data }) => {
        if (data) setDefaults(data as PageTemplate[]);
      });
  }, []);


  const templatesByCategory = useMemo(() => {
    return localTemplates.reduce((acc, template) => {
      const category = template.category || 'custom';
      if (!acc[category]) acc[category] = [];
      acc[category].push(template);
      return acc;
    }, {} as Record<string, PageTemplate[]>);
  }, [localTemplates]);

  return {
    templates: localTemplates,
    templatesByCategory,
    defaultTemplates: defaults,
    isLoading: isLoading && localTemplates.length === 0,
    createTemplate,
    updateTemplate,
    deleteTemplate,
    incrementUsage,
  };
}
