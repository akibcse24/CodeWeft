import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from './use-toast';
import {
    listWorkflows,
    listWorkflowRuns,
    getWorkflowRun,
    rerunWorkflow,
    rerunFailedJobs,
    cancelWorkflowRun,
    triggerWorkflow as triggerWorkflowService,
    listWorkflowJobs,
} from '@/services/github/actions.service';
import type { GitHubWorkflow, GitHubWorkflowRun } from '@/types/github';

interface UseWorkflowsProps {
    owner: string;
    repo: string;
    enabled?: boolean;
}

export function useWorkflows({ owner, repo, enabled = true }: UseWorkflowsProps) {
    const queryClient = useQueryClient();

    // Query: List workflows
    const workflows = useQuery({
        queryKey: ['workflows', owner, repo],
        queryFn: () => listWorkflows(owner, repo),
        enabled: enabled && !!owner && !!repo,
        staleTime: 10 * 60 * 1000, // 10 minutes
    });

    // Query: List workflow runs
    const runs = useQuery({
        queryKey: ['workflow-runs', owner, repo],
        queryFn: () => listWorkflowRuns(owner, repo),
        enabled: enabled && !!owner && !!repo,
        staleTime: 1 * 60 * 1000, // 1 minute
        refetchInterval: 30 * 1000, // Auto-refresh every 30s for active runs
    });

    // Mutation: Trigger workflow
    const triggerWorkflowMutation = useMutation({
        mutationFn: ({
            workflowId,
            ref,
            inputs,
        }: {
            workflowId: number | string;
            ref: string;
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            inputs?: Record<string, any>;
        }) => triggerWorkflowService(owner, repo, workflowId, ref, inputs),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['workflow-runs', owner, repo] });
            toast({
                title: 'Workflow triggered',
                description: 'The workflow has been queued for execution',
            });
        },
        onError: (error: Error) => {
            toast({
                title: 'Failed to trigger workflow',
                description: error.message,
                variant: 'destructive',
            });
        },
    });

    // Mutation: Re-run workflow
    const rerunMutation = useMutation({
        mutationFn: (runId: number) => rerunWorkflow(owner, repo, runId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['workflow-runs', owner, repo] });
            toast({
                title: 'Workflow re-run started',
                description: 'The workflow is running again',
            });
        },
        onError: (error: Error) => {
            toast({
                title: 'Failed to re-run workflow',
                description: error.message,
                variant: 'destructive',
            });
        },
    });

    // Mutation: Re-run failed jobs
    const rerunFailedMutation = useMutation({
        mutationFn: (runId: number) => rerunFailedJobs(owner, repo, runId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['workflow-runs', owner, repo] });
            toast({
                title: 'Re-running failed jobs',
                description: 'Failed jobs are being executed again',
            });
        },
        onError: (error: Error) => {
            toast({
                title: 'Failed to re-run jobs',
                description: error.message,
                variant: 'destructive',
            });
        },
    });

    // Mutation: Cancel workflow
    const cancelMutation = useMutation({
        mutationFn: (runId: number) => cancelWorkflowRun(owner, repo, runId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['workflow-runs', owner, repo] });
            toast({
                title: 'Workflow cancelled',
                description: 'The workflow run has been cancelled',
            });
        },
        onError: (error: Error) => {
            toast({
                title: 'Failed to cancel workflow',
                description: error.message,
                variant: 'destructive',
            });
        },
    });

    return {
        // Queries
        workflows: workflows.data || [],
        runs: runs.data || [],
        isLoadingWorkflows: workflows.isLoading,
        isLoadingRuns: runs.isLoading,
        isLoading: workflows.isLoading || runs.isLoading,

        // Mutations
        triggerWorkflow: triggerWorkflowMutation.mutate,
        isTriggeringWorkflow: triggerWorkflowMutation.isPending,

        rerunWorkflow: rerunMutation.mutate,
        isRerunningWorkflow: rerunMutation.isPending,

        rerunFailedJobs: rerunFailedMutation.mutate,
        isRerunningFailedJobs: rerunFailedMutation.isPending,

        cancelWorkflow: cancelMutation.mutate,
        isCancellingWorkflow: cancelMutation.isPending,

        // Refetch
        refetchWorkflows: workflows.refetch,
        refetchRuns: runs.refetch,
    };
}

/**
 * Hook to get a single workflow run with jobs
 */
export function useWorkflowRun(
    owner: string,
    repo: string,
    runId: number | null,
    enabled = true
) {
    const run = useQuery({
        queryKey: ['workflow-run', owner, repo, runId],
        queryFn: () => (runId ? getWorkflowRun(owner, repo, runId) : Promise.reject('No run ID')),
        enabled: enabled && !!owner && !!repo && !!runId,
        staleTime: 30 * 1000, // 30 seconds
        refetchInterval: (query) => {
            const data = query.state.data;
            // Auto-refresh if run is in progress or queued
            if (data?.status === 'in_progress' || data?.status === 'queued') {
                return 10 * 1000; // 10 seconds
            }
            return false; // Don't auto-refresh completed runs
        },
    });

    const jobs = useQuery({
        queryKey: ['workflow-jobs', owner, repo, runId],
        queryFn: () => (runId ? listWorkflowJobs(owner, repo, runId) : Promise.reject('No run ID')),
        enabled: enabled && !!owner && !!repo && !!runId,
        staleTime: 30 * 1000,
    });

    return {
        run: run.data,
        jobs: jobs.data,
        isLoading: run.isLoading || jobs.isLoading,
        refetch: () => {
            run.refetch();
            jobs.refetch();
        },
    };
}
