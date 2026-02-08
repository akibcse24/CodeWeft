import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useToast } from './use-toast';

export interface Profile {
  id: string;
  user_id: string;
  username: string | null;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}

// Generate a random DiceBear avatar URL
export function generateRandomAvatar(seed?: string): string {
  const styles = ['adventurer', 'avataaars', 'bottts', 'fun-emoji', 'lorelei', 'micah', 'miniavs', 'open-peeps', 'personas', 'pixel-art'];
  const randomStyle = styles[Math.floor(Math.random() * styles.length)];
  const randomSeed = seed || Math.random().toString(36).substring(7);
  return `https://api.dicebear.com/7.x/${randomStyle}/svg?seed=${randomSeed}`;
}

export function useProfile() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: profile, isLoading, error } = useQuery({
    queryKey: ['profile', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) throw error;

      // If no profile exists, create one
      if (!data) {
        const newProfile = {
          user_id: user.id,
          username: user.email?.split('@')[0] || 'User',
          avatar_url: generateRandomAvatar(user.email),
        };

        const { data: created, error: createError } = await supabase
          .from('profiles')
          .insert(newProfile)
          .select()
          .single();

        if (createError) throw createError;
        return created as Profile;
      }

      return data as Profile;
    },
    enabled: !!user?.id,
  });

  const updateProfile = useMutation({
    mutationFn: async (updates: Partial<Pick<Profile, 'username' | 'avatar_url'>>) => {
      if (!user?.id) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) throw error;
      return data as Profile;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile', user?.id] });
      toast({ title: 'Profile Updated', description: 'Your profile has been saved.' });
    },
    onError: (error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });

  const regenerateAvatar = useMutation({
    mutationFn: async () => {
      if (!user?.id) throw new Error('Not authenticated');

      const newAvatarUrl = generateRandomAvatar();

      const { data, error } = await supabase
        .from('profiles')
        .update({ avatar_url: newAvatarUrl })
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) throw error;
      return data as Profile;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile', user?.id] });
      toast({ title: 'Avatar Updated', description: 'Your new avatar looks great!' });
    },
    onError: (error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });

  return {
    profile,
    isLoading,
    error,
    updateProfile,
    regenerateAvatar,
  };
}
