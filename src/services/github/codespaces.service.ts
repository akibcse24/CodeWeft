/**
 * Codespaces Service
 * 
 * Provides operations for managing GitHub Codespaces
 */

import { getOctokit } from './octokit.service';

export interface GitHubCodespace {
    id: number;
    name: string;
    environment_id: string | null;
    owner: {
        login: string;
        id: number;
        avatar_url: string;
        url: string;
    };
    billable_owner: {
        login: string;
        id: number;
        avatar_url: string;
        url: string;
    };
    repository: {
        id: number;
        name: string;
        full_name: string;
        html_url: string;
        description: string | null;
    };
    machine: {
        name: string;
        display_name: string;
        operating_system: string;
        storage_in_bytes: number;
        memory_in_bytes: number;
        cpus: number;
        prebuild_availability: unknown;
    } | null;
    prebuild: boolean;
    created_at: string;
    updated_at: string;
    last_used_at: string;
    state: 'Starting' | 'Available' | 'Unavailable' | 'Rebuilding' | 'Moving' | 'Stopped' | 'Stopping' | 'Terminated' | 'Terminating' | 'Queued';
    connection_url: string;
    web_url: string;
    machines_url: string;
    start_url: string;
    stop_url: string;
    publish_url: string | null;
    pulls_url: string | null;
    prebuild_availability: unknown;
    recent_folders: string[];
    runtime_constraints: unknown;
    pending_operation: boolean;
    pending_operation_disabled_reason: string | null;
    idle_timeout_notice: string | null;
    retention_period_minutes: number | null;
    retention_expires_at: string | null;
    last_known_stop_notice: string | null;
    git_status: {
        ahead: number;
        behind: number;
        has_unpushed_changes: boolean;
        has_uncommitted_changes: boolean;
        ref: string;
    };
    location: string;
}

export interface CodespaceMachine {
    name: string;
    display_name: string;
    operating_system: string;
    storage_in_bytes: number;
    memory_in_bytes: number;
    cpus: number;
    prebuild_availability: unknown;
}

/**
 * List all codespaces for the authenticated user
 */
export async function listCodespaces(): Promise<GitHubCodespace[]> {
    const octokit = await getOctokit();
    const { data } = await octokit.rest.codespaces.listForAuthenticatedUser();
    return data.codespaces as unknown as GitHubCodespace[];
}

/**
 * Get details for a specific codespace
 */
export async function getCodespace(codespaceName: string): Promise<GitHubCodespace> {
    const octokit = await getOctokit();
    const { data } = await octokit.rest.codespaces.getForAuthenticatedUser({
        codespace_name: codespaceName,
    });
    return data as unknown as GitHubCodespace;
}

/**
 * Create a new codespace
 */
export async function createCodespace(
    owner: string,
    repo: string,
    branch?: string,
    machine?: string
): Promise<GitHubCodespace> {
    const octokit = await getOctokit();
    const { data } = await octokit.rest.codespaces.createWithRepoForAuthenticatedUser({
        owner,
        repo,
        ref: branch,
        machine,
    });
    return data as unknown as GitHubCodespace;
}

/**
 * Start a codespace
 */
export async function startCodespace(codespaceName: string): Promise<GitHubCodespace> {
    const octokit = await getOctokit();
    const { data } = await octokit.rest.codespaces.startForAuthenticatedUser({
        codespace_name: codespaceName,
    });
    return data as unknown as GitHubCodespace;
}

/**
 * Stop a codespace
 */
export async function stopCodespace(codespaceName: string): Promise<GitHubCodespace> {
    const octokit = await getOctokit();
    const { data } = await octokit.rest.codespaces.stopForAuthenticatedUser({
        codespace_name: codespaceName,
    });
    return data as unknown as GitHubCodespace;
}

/**
 * Delete a codespace
 */
export async function deleteCodespace(codespaceName: string): Promise<void> {
    const octokit = await getOctokit();
    await octokit.rest.codespaces.deleteForAuthenticatedUser({
        codespace_name: codespaceName,
    });
}

/**
 * Get available machine types for a repository
 */
export async function getRepoMachines(owner: string, repo: string, branch?: string): Promise<CodespaceMachine[]> {
    const octokit = await getOctokit();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data } = await (octokit.rest.codespaces as any).listRepoMachinesForAuthenticatedUser({
        owner,
        repo,
        ref: branch,
    });
    return data.machines as unknown as CodespaceMachine[];
}

/**
 * Generate VS Code Desktop URL for a codespace
 */
export function getVSCodeDesktopUrl(codespaceName: string): string {
    return `vscode://github.codespaces/connect?name=${encodeURIComponent(codespaceName)}`;
}

/**
 * Rebuild a codespace (full rebuild)
 */
export async function rebuildCodespace(codespaceName: string): Promise<void> {
    const octokit = await getOctokit();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (octokit.request as any)('POST /user/codespaces/{codespace_name}/rebuild', {
        codespace_name: codespaceName,
    });
}

/**
 * Update a codespace (change machine type)
 */
export async function updateCodespace(
    codespaceName: string,
    options: { machine?: string; display_name?: string }
): Promise<GitHubCodespace> {
    const octokit = await getOctokit();
    const { data } = await octokit.rest.codespaces.updateForAuthenticatedUser({
        codespace_name: codespaceName,
        ...options,
    });
    return data as unknown as GitHubCodespace;
}

/**
 * Export changes to a new branch (creates a PR-ready branch)
 */
export async function exportChangesToBranch(
    codespaceName: string,
    branch: string
): Promise<{ url: string; ref: string }> {
    const octokit = await getOctokit();
    const { data } = await octokit.rest.codespaces.exportForAuthenticatedUser({
        codespace_name: codespaceName,
    });
    // The export API returns export details
    return data as unknown as { url: string; ref: string };
}
