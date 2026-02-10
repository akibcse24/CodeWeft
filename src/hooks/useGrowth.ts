import { useState, useEffect, useCallback, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { Database } from '@/integrations/supabase/types';
import { db } from '@/lib/db';

export type RoadmapItem = Database['public']['Tables']['growth_roadmaps']['Row'];
export type SkillItem = Database['public']['Tables']['growth_skills']['Row'];
export type RetroEntry = Database['public']['Tables']['growth_retros']['Row'];

export function useGrowth() {
    const { user } = useAuth();
    const { toast } = useToast();
    const queryClient = useQueryClient();

    const [localRoadmaps, setLocalRoadmaps] = useState<RoadmapItem[]>([]);
    const [localSkills, setLocalSkills] = useState<SkillItem[]>([]);
    const [localRetros, setLocalRetros] = useState<RetroEntry[]>([]);

    const fetchLocal = useCallback(async () => {
        if (!user) return;

        const [roadmaps, skills, retros] = await Promise.all([
            db.growth_roadmaps.where('user_id').equals(user.id).reverse().sortBy('created_at'),
            db.growth_skills.where('user_id').equals(user.id).reverse().sortBy('level'),
            db.growth_retros.where('user_id').equals(user.id).reverse().sortBy('date')
        ]);

        setLocalRoadmaps(roadmaps);
        setLocalSkills(skills);
        setLocalRetros(retros);
    }, [user]);

    useEffect(() => {
        fetchLocal();
    }, [fetchLocal]);

    // Roadmaps Query (Handled by useSync, but kept for cloud refresh)
    const roadmapsQuery = useQuery({
        queryKey: ['growth-roadmaps', user?.id],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('growth_roadmaps')
                .select('*')
                .order('created_at', { ascending: false });
            if (error) throw error;
            return data;
        },
        enabled: !!user,
    });

    const addRoadmap = useMutation({
        mutationFn: async ({ title, description, milestonesCount = 3 }: { title: string; description: string; milestonesCount?: number }) => {
            if (!user) throw new Error("Not authenticated");
            const milestones = new Array(milestonesCount).fill(false);
            const id = crypto.randomUUID();

            const newRoadmap: RoadmapItem = {
                id,
                user_id: user.id,
                title,
                description,
                milestones,
                progress: 0,
                color: 'text-primary',
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            };

            // 1. Local
            await db.growth_roadmaps.add(newRoadmap);
            await fetchLocal();

            // 2. Queue
            await db.sync_queue.add({
                table: 'growth_roadmaps',
                action: 'insert',
                data: newRoadmap as any,
                timestamp: Date.now()
            });

            return newRoadmap;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['growth-roadmaps', user?.id] });
            toast({ title: "Roadmap Created", description: "Your new path is ready." });
        }
    });

    const advanceMilestone = useMutation({
        mutationFn: async ({ id, milestones }: { id: string; milestones: boolean[] | null }) => {
            if (!milestones) return;
            const nextIndex = milestones.findIndex(m => !m);
            if (nextIndex === -1) return;

            const newMilestones = [...milestones];
            newMilestones[nextIndex] = true;
            const newProgress = Math.round(((nextIndex + 1) / milestones.length) * 100);
            const updated_at = new Date().toISOString();

            const updates = { milestones: newMilestones, progress: newProgress, updated_at };

            // 1. Local
            await db.growth_roadmaps.update(id, updates);
            await fetchLocal();

            const current = await db.growth_roadmaps.get(id);

            // 2. Queue
            await db.sync_queue.add({
                table: 'growth_roadmaps',
                action: 'update',
                data: current as any,
                timestamp: Date.now()
            });

            return current;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['growth-roadmaps', user?.id] });
            toast({ title: "Milestone Reached", description: "Progress updated in your roadmap." });
        }
    });

    const removeRoadmap = useMutation({
        mutationFn: async (id: string) => {
            // 1. Local
            await db.growth_roadmaps.delete(id);
            await fetchLocal();

            // 2. Queue
            await db.sync_queue.add({
                table: 'growth_roadmaps',
                action: 'delete',
                data: { id },
                timestamp: Date.now()
            });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['growth-roadmaps', user?.id] });
            toast({ title: "Roadmap Removed" });
        }
    });

    // Skills Query
    const skillsQuery = useQuery({
        queryKey: ['growth-skills', user?.id],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('growth_skills')
                .select('*')
                .order('level', { ascending: false });
            if (error) throw error;
            return data;
        },
        enabled: !!user,
    });

    const addSkill = useMutation({
        mutationFn: async ({ name, category }: { name: string; category: string }) => {
            if (!user) throw new Error("Not authenticated");
            const id = crypto.randomUUID();

            const newSkill: SkillItem = {
                id,
                user_id: user.id,
                name,
                category,
                level: 1,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            };

            // 1. Local
            await db.growth_skills.add(newSkill);
            await fetchLocal();

            // 2. Queue
            await db.sync_queue.add({
                table: 'growth_skills',
                action: 'insert',
                data: newSkill as any,
                timestamp: Date.now()
            });

            return newSkill;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['growth-skills', user?.id] });
            toast({ title: "Skill Initiated", description: "New skill added to your matrix." });
        }
    });

    const levelUpSkill = useMutation({
        mutationFn: async ({ id, level }: { id: string; level: number | null }) => {
            if (level === null || level >= 10) return;
            const updated_at = new Date().toISOString();
            const updates = { level: level + 1, updated_at };

            // 1. Local
            await db.growth_skills.update(id, updates);
            await fetchLocal();

            const current = await db.growth_skills.get(id);

            // 2. Queue
            await db.sync_queue.add({
                table: 'growth_skills',
                action: 'update',
                data: current as any,
                timestamp: Date.now()
            });

            return current;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['growth-skills', user?.id] });
            toast({ title: "Mastery Increased", description: "Level up!" });
        }
    });

    const removeSkill = useMutation({
        mutationFn: async (id: string) => {
            // 1. Local
            await db.growth_skills.delete(id);
            await fetchLocal();

            // 2. Queue
            await db.sync_queue.add({
                table: 'growth_skills',
                action: 'delete',
                data: { id },
                timestamp: Date.now()
            });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['growth-skills', user?.id] });
            toast({ title: "Skill Removed" });
        }
    });

    // Retros Query
    const retrosQuery = useQuery({
        queryKey: ['growth-retros', user?.id],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('growth_retros')
                .select('*')
                .order('date', { ascending: false });
            if (error) throw error;
            return data;
        },
        enabled: !!user,
    });

    const addRetro = useMutation({
        mutationFn: async ({ content, takeaway }: { content: string; takeaway: string }) => {
            if (!user) throw new Error("Not authenticated");
            const id = crypto.randomUUID();

            const newRetro: RetroEntry = {
                id,
                user_id: user.id,
                content,
                takeaway,
                date: new Date().toISOString().split('T')[0],
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            };

            // 1. Local
            await db.growth_retros.add(newRetro);
            await fetchLocal();

            // 2. Queue
            await db.sync_queue.add({
                table: 'growth_retros',
                action: 'insert',
                data: newRetro as any,
                timestamp: Date.now()
            });

            return newRetro;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['growth-retros', user?.id] });
            toast({ title: "Reflection Captured", description: "Your evolution has been recorded." });
        }
    });

    const removeRetro = useMutation({
        mutationFn: async (id: string) => {
            // 1. Local
            await db.growth_retros.delete(id);
            await fetchLocal();

            // 2. Queue
            await db.sync_queue.add({
                table: 'growth_retros',
                action: 'delete',
                data: { id },
                timestamp: Date.now()
            });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['growth-retros', user?.id] });
            toast({ title: "Reflection Removed" });
        }
    });

    return useMemo(() => ({
        roadmaps: localRoadmaps,
        roadmapsLoading: roadmapsQuery.isLoading && localRoadmaps.length === 0,
        addRoadmap,
        advanceMilestone,
        removeRoadmap,
        skills: localSkills,
        skillsLoading: skillsQuery.isLoading && localSkills.length === 0,
        addSkill,
        levelUpSkill,
        removeSkill,
        retros: localRetros,
        retrosLoading: retrosQuery.isLoading && localRetros.length === 0,
        addRetro,
        removeRetro,
    }), [localRoadmaps, localSkills, localRetros, roadmapsQuery.isLoading, skillsQuery.isLoading, retrosQuery.isLoading, addRoadmap, advanceMilestone, removeRoadmap, addSkill, levelUpSkill, removeSkill, addRetro, removeRetro]);
}
