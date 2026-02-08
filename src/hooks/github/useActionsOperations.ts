/**
 * useActionsOperations Hook
 * 
 * React hooks for GitHub Actions operations using TanStack Query
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as ActionsService from '@/services/github/actions.service';
import { toast } from 'sonner';

export function useWorkflows(owner: string, repo: string) {
    return useQuery({
        queryKey: ['github', 'workflows', owner, repo],
        queryFn: () => ActionsService.listWorkflows(owner, repo),
        staleTime: 1000 * 60 * 5, // 5 minutes
        enabled: !!owner && !!repo,
    });
}

export function useWorkflow(owner: string, repo: string, workflowId: number) {
    return useQuery({
        queryKey: ['github', 'workflow', owner, repo, workflowId],
        queryFn: () => ActionsService.getWorkflow(owner, repo, workflowId),
        staleTime: 1000 * 60 * 5,
        enabled: !!owner && !!repo && !!workflowId,
    });
}

export function useWorkflowRuns(
    owner: string,
    repo: string,
    workflowId?: number,
    options?: {
        branch?: string;
        status?: 'queued' | 'in_progress' | 'completed';
        per_page?: number;
    }
) {
    return useQuery({
        queryKey: ['github', 'workflow-runs', owner, repo, workflowId, options],
        queryFn: () => ActionsService.listWorkflowRuns(owner, repo, workflowId, options),
        staleTime: 1000 * 30, // 30 seconds (more frequent for active runs)
        enabled: !!owner && !!repo,
        refetchInterval: (query) => {
            const data = query.state.data;
            // Auto-refresh if there are in-progress runs
            const hasActiveRuns = data?.some(run => run.status === 'in_progress' || run.status === 'queued');
            return hasActiveRuns ? 10000 : false; // 10 seconds
        },
    });
}

export function useWorkflowRun(owner: string, repo: string, runId: number) {
    return useQuery({
        queryKey: ['github', 'workflow-run', owner, repo, runId],
        queryFn: () => ActionsService.getWorkflowRun(owner, repo, runId),
        staleTime: 1000 * 30,
        enabled: !!owner && !!repo && !!runId,
        refetchInterval: (query) => {
            const data = query.state.data;
            // Auto-refresh if run is active
            const isActive = data?.status === 'in_progress' || data?.status === 'queued';
            return isActive ? 5000 : false; // 5 seconds
        },
    });
}

export function useWorkflowJobs(owner: string, repo: string, runId: number) {
    return useQuery({
        queryKey: ['github', 'workflow-jobs', owner, repo, runId],
        queryFn: () => ActionsService.listWorkflowJobs(owner, repo, runId),
        staleTime: 1000 * 30,
        enabled: !!owner && !!repo && !!runId,
    });
}

export function useRerunWorkflow() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ owner, repo, runId }: { owner: string; repo: string; runId: number }) =>
            ActionsService.rerunWorkflow(owner, repo, runId),
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ['github', 'workflow-runs'] });
            queryClient.invalidateQueries({ queryKey: ['github', 'workflow-run', variables.owner, variables.repo, variables.runId] });
            toast.success('Workflow re-run triggered!');
        },
        onError: (error: Error) => {
            toast.error(`Failed to re-run workflow: ${error.message}`);
        },
    });
}

export function useCancelWorkflowRun() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ owner, repo, runId }: { owner: string; repo: string; runId: number }) =>
            ActionsService.cancelWorkflowRun(owner, repo, runId),
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ['github', 'workflow-runs'] });
            queryClient.invalidateQueries({ queryKey: ['github', 'workflow-run', variables.owner, variables.repo, variables.runId] });
            toast.success('Workflow run cancelled!');
        },
        onError: (error: Error) => {
            toast.error(`Failed to cancel workflow: ${error.message}`);
        },
    });
}

export function useTriggerWorkflow() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({
            owner,
            repo,
            workflowId,
            ref,
            inputs,
        }: {
            owner: string;
            repo: string;
            workflowId: number | string;
            ref?: string;
            inputs?: Record<string, string>;
        }) => ActionsService.triggerWorkflow(owner, repo, workflowId, ref, inputs),
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ['github', 'workflow-runs', variables.owner, variables.repo] });
            toast.success('Workflow triggered!');
        },
        onError: (error: Error) => {
            toast.error(`Failed to trigger workflow: ${error.message}`);
        },
    });
}

export function useEnableWorkflow() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ owner, repo, workflowId }: { owner: string; repo: string; workflowId: number }) =>
            ActionsService.enableWorkflow(owner, repo, workflowId),
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ['github', 'workflows'] });
            queryClient.invalidateQueries({ queryKey: ['github', 'workflow', variables.owner, variables.repo, variables.workflowId] });
            toast.success('Workflow enabled!');
        },
        onError: (error: Error) => {
            toast.error(`Failed to enable workflow: ${error.message}`);
        },
    });
}

export function useDisableWorkflow() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ owner, repo, workflowId }: { owner: string; repo: string; workflowId: number }) =>
            ActionsService.disableWorkflow(owner, repo, workflowId),
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ['github', 'workflows'] });
            queryClient.invalidateQueries({ queryKey: ['github', 'workflow', variables.owner, variables.repo, variables.workflowId] });
            toast.success('Workflow disabled!');
        },
        onError: (error: Error) => {
            toast.error(`Failed to disable workflow: ${error.message}`);
        },
    });
}

export function useDeleteWorkflowRun() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ owner, repo, runId }: { owner: string; repo: string; runId: number }) =>
            ActionsService.deleteWorkflowRun(owner, repo, runId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['github', 'workflow-runs'] });
            toast.success('Workflow run deleted!');
        },
        onError: (error: Error) => {
            toast.error(`Failed to delete workflow run: ${error.message}`);
        },
    });
}

export function useRerunFailedJobs() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ owner, repo, runId }: { owner: string; repo: string; runId: number }) =>
            ActionsService.rerunFailedJobs(owner, repo, runId),
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ['github', 'workflow-runs'] });
            queryClient.invalidateQueries({ queryKey: ['github', 'workflow-run', variables.owner, variables.repo, variables.runId] });
            toast.success('Re-running failed jobs!');
        },
        onError: (error: Error) => {
            toast.error(`Failed to re-run failed jobs: ${error.message}`);
        },
    });
}

export function useRepoSecrets(owner: string, repo: string) {
    return useQuery({
        queryKey: ['github', 'repo-secrets', owner, repo],
        queryFn: () => ActionsService.listRepoSecrets(owner, repo),
        staleTime: 1000 * 60 * 5, // 5 minutes
        enabled: !!owner && !!repo,
    });
}
