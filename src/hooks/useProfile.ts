import { useState, useEffect, useCallback, useMemo } from 'react';
import { useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useToast } from './use-toast';
import { db } from '@/lib/db';

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
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load from Dexie instantly
  useEffect(() => {
    if (!user?.id) { setProfile(null); setIsLoading(false); return; }
    db.profiles.where("user_id").equals(user.id).first().then(local => {
      if (local) setProfile(local as Profile);
      setIsLoading(false);
    });
  }, [user?.id]);

  // One-time hydration: only when Dexie is empty
  useEffect(() => {
    if (!user?.id) return;
    const hydrate = async () => {
      const count = await db.profiles.where("user_id").equals(user.id).count();
      if (count > 0) return; // Already have local data
      try {
        const { data: cloud } = await supabase.from('profiles').select('*').eq('user_id', user.id).maybeSingle();
        if (!cloud) {
          // Auto-create profile
          const newProfile = { user_id: user.id, username: user.email?.split('@')[0] || 'User', avatar_url: generateRandomAvatar(user.email) };
          const { data: created } = await supabase.from('profiles').insert(newProfile).select().single();
          if (created) { await db.profiles.put(created); setProfile(created as Profile); }
          return;
        }
        await db.profiles.put(cloud);
        setProfile(cloud as Profile);
      } catch { /* offline — no profile yet, will create on next online */ }
    };
    hydrate();
  }, [user?.id, user?.email]);

  const updateProfile = useMutation({
    mutationFn: async (updates: Partial<Pick<Profile, 'username' | 'avatar_url'>>) => {
      if (!user?.id) throw new Error('Not authenticated');
      const fin = { ...updates, updated_at: new Date().toISOString() };
      // Instant local update
      if (profile?.id) await db.profiles.update(profile.id, fin);
      setProfile(prev => prev ? { ...prev, ...fin } : prev);
      db.sync_queue.add({ table: 'profiles', action: 'update', data: { user_id: user.id, ...fin }, timestamp: Date.now() });
      // Fire-and-forget cloud
      supabase.from('profiles').update(fin).eq('user_id', user.id).then(({ error }) => { if (error) console.warn("[profile] bg update:", error.message); });
      return { ...profile, ...fin } as Profile;
    },
    onSuccess: () => { toast({ title: 'Profile Updated', description: 'Your profile has been saved.' }); },
    onError: (error) => { toast({ title: 'Error', description: error.message, variant: 'destructive' }); },
  });

  const regenerateAvatar = useMutation({
    mutationFn: async () => {
      if (!user?.id) throw new Error('Not authenticated');
      const newAvatarUrl = generateRandomAvatar();
      const now = new Date().toISOString();
      // Instant local update
      if (profile?.id) await db.profiles.update(profile.id, { avatar_url: newAvatarUrl, updated_at: now });
      setProfile(prev => prev ? { ...prev, avatar_url: newAvatarUrl, updated_at: now } : prev);
      db.sync_queue.add({ table: 'profiles', action: 'update', data: { user_id: user.id, avatar_url: newAvatarUrl, updated_at: now }, timestamp: Date.now() });
      // Fire-and-forget cloud
      supabase.from('profiles').update({ avatar_url: newAvatarUrl }).eq('user_id', user.id).then(({ error }) => { if (error) console.warn("[profile] bg avatar:", error.message); });
      return { ...profile, avatar_url: newAvatarUrl } as Profile;
    },
    onSuccess: () => { toast({ title: 'Avatar Updated', description: 'Your new avatar looks great!' }); },
    onError: (error) => { toast({ title: 'Error', description: error.message, variant: 'destructive' }); },
  });

  return useMemo(() => ({
    profile, isLoading, error: null, updateProfile, regenerateAvatar,
  }), [profile, isLoading, updateProfile, regenerateAvatar]);
}
