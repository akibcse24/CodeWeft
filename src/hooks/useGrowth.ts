import { useState, useEffect, useCallback, useMemo } from 'react';
import { useMutation } from '@tanstack/react-query';
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

    const [localRoadmaps, setLocalRoadmaps] = useState<RoadmapItem[]>([]);
    const [localSkills, setLocalSkills] = useState<SkillItem[]>([]);
    const [localRetros, setLocalRetros] = useState<RetroEntry[]>([]);
    const [isLoading, setIsLoading] = useState(true);

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
        setIsLoading(false);
    }, [user]);

    useEffect(() => { fetchLocal(); }, [fetchLocal]);

    // One-time hydration: only when Dexie is empty
    useEffect(() => {
        if (!user) return;
        const hydrate = async () => {
            const [rc, sc, rtc] = await Promise.all([
                db.growth_roadmaps.where('user_id').equals(user.id).count(),
                db.growth_skills.where('user_id').equals(user.id).count(),
                db.growth_retros.where('user_id').equals(user.id).count(),
            ]);
            if (rc > 0 && sc > 0 && rtc > 0) return; // Already hydrated
            try {
                const [r, s, rt] = await Promise.all([
                    rc === 0 ? supabase.from('growth_roadmaps').select('*').eq('user_id', user.id) : { data: null },
                    sc === 0 ? supabase.from('growth_skills').select('*').eq('user_id', user.id) : { data: null },
                    rtc === 0 ? supabase.from('growth_retros').select('*').eq('user_id', user.id) : { data: null },
                ]);
                if (r.data?.length) await db.growth_roadmaps.bulkPut(r.data);
                if (s.data?.length) await db.growth_skills.bulkPut(s.data);
                if (rt.data?.length) await db.growth_retros.bulkPut(rt.data);
                await fetchLocal();
            } catch { /* offline */ }
        };
        hydrate();
    }, [user, fetchLocal]);

    // ─── Roadmap mutations ────────────────────────────────────────────────
    const addRoadmap = useMutation({
        mutationFn: async ({ title, description, milestonesCount = 3 }: { title: string; description: string; milestonesCount?: number }) => {
            if (!user) throw new Error("Not authenticated");
            const milestones = new Array(milestonesCount).fill(false);
            const id = crypto.randomUUID();
            const rec: RoadmapItem = {
                id, user_id: user.id, title, description, milestones, progress: 0,
                color: 'text-primary', created_at: new Date().toISOString(), updated_at: new Date().toISOString()
            };
            await db.growth_roadmaps.add(rec);
            await fetchLocal();
            db.sync_queue.add({ table: 'growth_roadmaps', action: 'insert', data: rec as Record<string, unknown>, timestamp: Date.now() });
            supabase.from('growth_roadmaps').insert([rec]).then(({ error }) => { if (error) console.warn("[growth] bg roadmap insert:", error.message); });
            return rec;
        },
        onSuccess: () => { toast({ title: "Roadmap Created", description: "Your new path is ready." }); }
    });

    const advanceMilestone = useMutation({
        mutationFn: async ({ id, milestones }: { id: string; milestones: boolean[] | null }) => {
            if (!milestones) return;
            const nextIndex = milestones.findIndex(m => !m);
            if (nextIndex === -1) return;
            const newMilestones = [...milestones];
            newMilestones[nextIndex] = true;
            const newProgress = Math.round(((nextIndex + 1) / milestones.length) * 100);
            const updates = { milestones: newMilestones, progress: newProgress, updated_at: new Date().toISOString() };
            await db.growth_roadmaps.update(id, updates);
            await fetchLocal();
            const cur = await db.growth_roadmaps.get(id);
            db.sync_queue.add({ table: 'growth_roadmaps', action: 'update', data: cur as Record<string, unknown>, timestamp: Date.now() });
            supabase.from('growth_roadmaps').update(updates).eq('id', id).then(({ error }) => { if (error) console.warn("[growth] bg milestone:", error.message); });
            return cur;
        },
        onSuccess: () => { toast({ title: "Milestone Reached", description: "Progress updated in your roadmap." }); }
    });

    const removeRoadmap = useMutation({
        mutationFn: async (id: string) => {
            await db.growth_roadmaps.delete(id);
            await fetchLocal();
            db.sync_queue.add({ table: 'growth_roadmaps', action: 'delete', data: { id }, timestamp: Date.now() });
            supabase.from('growth_roadmaps').delete().eq('id', id).then(({ error }) => { if (error) console.warn("[growth] bg roadmap delete:", error.message); });
        },
        onSuccess: () => { toast({ title: "Roadmap Removed" }); }
    });

    // ─── Skill mutations ──────────────────────────────────────────────────
    const addSkill = useMutation({
        mutationFn: async ({ name, category }: { name: string; category: string }) => {
            if (!user) throw new Error("Not authenticated");
            const id = crypto.randomUUID();
            const rec: SkillItem = {
                id, user_id: user.id, name, category, level: 1,
                created_at: new Date().toISOString(), updated_at: new Date().toISOString()
            };
            await db.growth_skills.add(rec);
            await fetchLocal();
            db.sync_queue.add({ table: 'growth_skills', action: 'insert', data: rec as Record<string, unknown>, timestamp: Date.now() });
            supabase.from('growth_skills').insert([rec]).then(({ error }) => { if (error) console.warn("[growth] bg skill insert:", error.message); });
            return rec;
        },
        onSuccess: () => { toast({ title: "Skill Initiated", description: "New skill added to your matrix." }); }
    });

    const levelUpSkill = useMutation({
        mutationFn: async ({ id, level }: { id: string; level: number | null }) => {
            if (level === null || level >= 10) return;
            const updates = { level: level + 1, updated_at: new Date().toISOString() };
            await db.growth_skills.update(id, updates);
            await fetchLocal();
            const cur = await db.growth_skills.get(id);
            db.sync_queue.add({ table: 'growth_skills', action: 'update', data: cur as Record<string, unknown>, timestamp: Date.now() });
            supabase.from('growth_skills').update(updates).eq('id', id).then(({ error }) => { if (error) console.warn("[growth] bg skill level:", error.message); });
            return cur;
        },
        onSuccess: () => { toast({ title: "Mastery Increased", description: "Level up!" }); }
    });

    const removeSkill = useMutation({
        mutationFn: async (id: string) => {
            await db.growth_skills.delete(id);
            await fetchLocal();
            db.sync_queue.add({ table: 'growth_skills', action: 'delete', data: { id }, timestamp: Date.now() });
            supabase.from('growth_skills').delete().eq('id', id).then(({ error }) => { if (error) console.warn("[growth] bg skill delete:", error.message); });
        },
        onSuccess: () => { toast({ title: "Skill Removed" }); }
    });

    // ─── Retro mutations ──────────────────────────────────────────────────
    const addRetro = useMutation({
        mutationFn: async ({ content, takeaway }: { content: string; takeaway: string }) => {
            if (!user) throw new Error("Not authenticated");
            const id = crypto.randomUUID();
            const rec: RetroEntry = {
                id, user_id: user.id, content, takeaway,
                date: new Date().toISOString().split('T')[0],
                created_at: new Date().toISOString(), updated_at: new Date().toISOString()
            };
            await db.growth_retros.add(rec);
            await fetchLocal();
            db.sync_queue.add({ table: 'growth_retros', action: 'insert', data: rec as Record<string, unknown>, timestamp: Date.now() });
            supabase.from('growth_retros').insert([rec]).then(({ error }) => { if (error) console.warn("[growth] bg retro insert:", error.message); });
            return rec;
        },
        onSuccess: () => { toast({ title: "Reflection Captured", description: "Your evolution has been recorded." }); }
    });

    const removeRetro = useMutation({
        mutationFn: async (id: string) => {
            await db.growth_retros.delete(id);
            await fetchLocal();
            db.sync_queue.add({ table: 'growth_retros', action: 'delete', data: { id }, timestamp: Date.now() });
            supabase.from('growth_retros').delete().eq('id', id).then(({ error }) => { if (error) console.warn("[growth] bg retro delete:", error.message); });
        },
        onSuccess: () => { toast({ title: "Reflection Removed" }); }
    });

    return useMemo(() => ({
        roadmaps: localRoadmaps,
        roadmapsLoading: isLoading && localRoadmaps.length === 0,
        addRoadmap, advanceMilestone, removeRoadmap,
        skills: localSkills,
        skillsLoading: isLoading && localSkills.length === 0,
        addSkill, levelUpSkill, removeSkill,
        retros: localRetros,
        retrosLoading: isLoading && localRetros.length === 0,
        addRetro, removeRetro,
    }), [localRoadmaps, localSkills, localRetros, isLoading, addRoadmap, advanceMilestone, removeRoadmap, addSkill, levelUpSkill, removeSkill, addRetro, removeRetro]);
}
