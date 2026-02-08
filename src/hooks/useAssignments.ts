import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

export interface Assignment {
    id: string;
    user_id: string;
    course_id: string;
    name: string;
    weight: number;
    score: number | null;
    is_completed: boolean;
    created_at: string;
    updated_at: string;
}

export type AssignmentInsert = Omit<Assignment, "id" | "created_at" | "updated_at">;
export type AssignmentUpdate = Partial<AssignmentInsert>;

export function useAssignments(courseId?: string) {
    const { user } = useAuth();
    const queryClient = useQueryClient();

    const assignmentsQuery = useQuery({
        queryKey: ["assignments", courseId, user?.id],
        queryFn: async () => {
            if (!user) return [];
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            let query = (supabase as any).from("course_assignments").select("*").eq("user_id", user.id);

            if (courseId) {
                query = query.eq("course_id", courseId);
            }

            const { data, error } = await query.order("created_at", { ascending: true });

            if (error) throw error;
            return (data || []) as Assignment[];
        },
        enabled: !!user,
    });

    const createAssignment = useMutation({
        mutationFn: async (assignment: AssignmentInsert) => {
            if (!user) throw new Error("Not authenticated");
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const { data, error } = await (supabase as any)
                .from("course_assignments")
                .insert({ ...assignment, user_id: user.id })
                .select()
                .single();

            if (error) throw error;
            return data as Assignment;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["assignments"] });
        },
    });

    const updateAssignment = useMutation({
        mutationFn: async (vars: AssignmentUpdate & { id: string }) => {
            const { id, ...updates } = vars;
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const { data, error } = await (supabase as any)
                .from("course_assignments")
                .update(updates)
                .eq("id", id)
                .select()
                .single();

            if (error) throw error;
            return data as Assignment;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["assignments"] });
        },
    });

    const deleteAssignment = useMutation({
        mutationFn: async (id: string) => {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const { error } = await (supabase as any)
                .from("course_assignments")
                .delete()
                .eq("id", id);

            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["assignments"] });
        },
    });

    const calculateGrade = (assignments: Assignment[]) => {
        const completedAssignments = assignments.filter(a => a.is_completed && a.score !== null);
        if (completedAssignments.length === 0) return 0;

        let totalWeightedScore = 0;
        let totalWeight = 0;

        completedAssignments.forEach(a => {
            totalWeightedScore += (a.score! * a.weight);
            totalWeight += a.weight;
        });

        return totalWeight > 0 ? (totalWeightedScore / totalWeight) : 0;
    };

    return {
        assignments: assignmentsQuery.data ?? [],
        isLoading: assignmentsQuery.isLoading,
        createAssignment,
        updateAssignment,
        deleteAssignment,
        calculateGrade,
    };
}
