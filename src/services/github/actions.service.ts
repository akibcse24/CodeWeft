/**
 * GitHub Actions Service
 * 
 * Provides operations for managing GitHub Actions workflows and runs
 */

import { getOctokit } from './octokit.service';
import type { GitHubWorkflow, GitHubWorkflowRun } from '@/types/github';

/**
 * List all workflows in a repository
 */
export async function listWorkflows(owner: string, repo: string): Promise<GitHubWorkflow[]> {
    const octokit = await getOctokit();
    const { data } = await octokit.rest.actions.listRepoWorkflows({
        owner,
        repo,
        per_page: 100,
    });
    return data.workflows as GitHubWorkflow[];
}

/**
 * Get a specific workflow
 */
export async function getWorkflow(owner: string, repo: string, workflowId: number): Promise<GitHubWorkflow> {
    const octokit = await getOctokit();
    const { data } = await octokit.rest.actions.getWorkflow({
        owner,
        repo,
        workflow_id: workflowId,
    });
    return data as GitHubWorkflow;
}

/**
 * List workflow runs for a repository or specific workflow
 */
export async function listWorkflowRuns(
    owner: string,
    repo: string,
    workflowId?: number,
    options?: {
        branch?: string;
        status?: 'queued' | 'in_progress' | 'completed';
        per_page?: number;
    }
): Promise<GitHubWorkflowRun[]> {
    const octokit = await getOctokit();

    const baseParams = {
        owner,
        repo,
        per_page: options?.per_page || 30,
        ...(options?.branch && { branch: options.branch }),
        ...(options?.status && { status: options.status }),
    };

    if (workflowId) {
        const { data } = await octokit.rest.actions.listWorkflowRuns({
            ...baseParams,
            workflow_id: workflowId,
        });
        return data.workflow_runs as GitHubWorkflowRun[];
    } else {
        const { data } = await octokit.rest.actions.listWorkflowRunsForRepo(baseParams);
        return data.workflow_runs as GitHubWorkflowRun[];
    }
}

/**
 * Get a specific workflow run
 */
export async function getWorkflowRun(owner: string, repo: string, runId: number): Promise<GitHubWorkflowRun> {
    const octokit = await getOctokit();
    const { data } = await octokit.rest.actions.getWorkflowRun({
        owner,
        repo,
        run_id: runId,
    });
    return data as GitHubWorkflowRun;
}

/**
 * Re-run a workflow
 */
export async function rerunWorkflow(owner: string, repo: string, runId: number): Promise<void> {
    const octokit = await getOctokit();
    await octokit.rest.actions.reRunWorkflow({
        owner,
        repo,
        run_id: runId,
    });
}

/**
 * Cancel a workflow run
 */
export async function cancelWorkflowRun(owner: string, repo: string, runId: number): Promise<void> {
    const octokit = await getOctokit();
    await octokit.rest.actions.cancelWorkflowRun({
        owner,
        repo,
        run_id: runId,
    });
}

/**
 * Trigger a workflow manually
 */
export async function triggerWorkflow(
    owner: string,
    repo: string,
    workflowId: number | string,
    ref: string = 'main',
    inputs?: Record<string, unknown>
): Promise<void> {
    const octokit = await getOctokit();
    await octokit.rest.actions.createWorkflowDispatch({
        owner,
        repo,
        workflow_id: workflowId,
        ref,
        inputs,
    });
}

/**
 * List workflow run jobs
 */
export async function listWorkflowJobs(owner: string, repo: string, runId: number) {
    const octokit = await getOctokit();
    const { data } = await octokit.rest.actions.listJobsForWorkflowRun({
        owner,
        repo,
        run_id: runId,
    });
    return data.jobs;
}

/**
 * Download workflow run logs
 */
export async function downloadWorkflowLogs(owner: string, repo: string, runId: number): Promise<ArrayBuffer> {
    const octokit = await getOctokit();
    const { data } = await octokit.rest.actions.downloadWorkflowRunLogs({
        owner,
        repo,
        run_id: runId,
    });
    return data as ArrayBuffer;
}

/**
 * List workflow artifacts
 */
export async function listWorkflowArtifacts(owner: string, repo: string, runId?: number) {
    const octokit = await getOctokit();

    if (runId) {
        const { data } = await octokit.rest.actions.listWorkflowRunArtifacts({
            owner,
            repo,
            run_id: runId,
        });
        return data.artifacts;
    } else {
        const { data } = await octokit.rest.actions.listArtifactsForRepo({
            owner,
            repo,
            per_page: 30,
        });
        return data.artifacts;
    }
}

/**
 * Download artifact
 */
export async function downloadArtifact(owner: string, repo: string, artifactId: number): Promise<ArrayBuffer> {
    const octokit = await getOctokit();
    const { data } = await octokit.rest.actions.downloadArtifact({
        owner,
        repo,
        artifact_id: artifactId,
        archive_format: 'zip',
    });
    return data as ArrayBuffer;
}

/**
 * Enable a workflow
 */
export async function enableWorkflow(owner: string, repo: string, workflowId: number): Promise<void> {
    const octokit = await getOctokit();
    await octokit.rest.actions.enableWorkflow({
        owner,
        repo,
        workflow_id: workflowId,
    });
}

/**
 * Disable a workflow
 */
export async function disableWorkflow(owner: string, repo: string, workflowId: number): Promise<void> {
    const octokit = await getOctokit();
    await octokit.rest.actions.disableWorkflow({
        owner,
        repo,
        workflow_id: workflowId,
    });
}

/**
 * Re-run failed jobs from a workflow run
 */
export async function rerunFailedJobs(
    owner: string,
    repo: string,
    runId: number
): Promise<void> {
    const octokit = await getOctokit();
    await octokit.rest.actions.reRunWorkflowFailedJobs({
        owner,
        repo,
        run_id: runId,
    });
}

/**
 * Format workflow run duration
 */
export function formatDuration(milliseconds: number): string {
    const seconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);

    if (hours > 0) {
        return `${hours}h ${minutes % 60}m`;
    } else if (minutes > 0) {
        return `${minutes}m ${seconds % 60}s`;
    } else {
        return `${seconds}s`;
    }
}

/**
 * Get status color for workflow run
 */
export function getRunStatusColor(status: string, conclusion?: string | null): string {
    if (status === 'completed') {
        switch (conclusion) {
            case 'success': return 'text-green-400';
            case 'failure': return 'text-red-400';
            case 'cancelled': return 'text-gray-400';
            case 'skipped': return 'text-blue-400';
            default: return 'text-yellow-400';
        }
    } else if (status === 'in_progress') {
        return 'text-blue-400';
    } else if (status === 'queued') {
        return 'text-gray-400';
    }
    return 'text-muted-foreground';
}

/**
 * Get status icon for workflow run
 */
export function getRunStatusIcon(status: string, conclusion?: string | null): string {
    if (status === 'completed') {
        switch (conclusion) {
            case 'success': return '✓';
            case 'failure': return '✗';
            case 'cancelled': return '⊘';
            case 'skipped': return '⊙';
            default: return '?';
        }
    } else if (status === 'in_progress') {
        return '⟳';
    } else if (status === 'queued') {
        return '⋯';
    }
    return '?';
}

/**
 * Calculate success rate from workflow runs
 */
export function calculateSuccessRate(runs: GitHubWorkflowRun[]): number {
    const completedRuns = runs.filter(r => r.status === 'completed');
    if (completedRuns.length === 0) return 0;

    const successfulRuns = completedRuns.filter(r => r.conclusion === 'success');
    return (successfulRuns.length / completedRuns.length) * 100;
}

/**
 * Calculate average duration from workflow runs
 */
export function calculateAverageDuration(runs: GitHubWorkflowRun[]): number {
    const completedRuns = runs.filter(r => r.status === 'completed');
    if (completedRuns.length === 0) return 0;

    const totalDuration = completedRuns.reduce((sum, run) => {
        if (run.created_at && run.updated_at) {
            const start = new Date(run.created_at).getTime();
            const end = new Date(run.updated_at).getTime();
            return sum + (end - start);
        }
        return sum;
    }, 0);

    return totalDuration / completedRuns.length;
}

/**
 * Delete an artifact
 */
export async function deleteArtifact(owner: string, repo: string, artifactId: number): Promise<void> {
    const octokit = await getOctokit();
    await octokit.rest.actions.deleteArtifact({
        owner,
        repo,
        artifact_id: artifactId,
    });
}

/**
 * Delete a workflow run
 */
export async function deleteWorkflowRun(owner: string, repo: string, runId: number): Promise<void> {
    const octokit = await getOctokit();
    await octokit.rest.actions.deleteWorkflowRun({
        owner,
        repo,
        run_id: runId,
    });
}

/**
 * Repository secret (name only, value not exposed)
 */
export interface RepoSecret {
    name: string;
    created_at: string;
    updated_at: string;
}

/**
 * List repository secrets (names only, not values)
 */
export async function listRepoSecrets(owner: string, repo: string): Promise<RepoSecret[]> {
    const octokit = await getOctokit();
    const { data } = await octokit.rest.actions.listRepoSecrets({
        owner,
        repo,
    });
    return data.secrets as RepoSecret[];
}
