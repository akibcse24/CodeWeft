/**
 * Repository Service
 * 
 * Handles repository-level operations:
 * - List user repositories
 * - Get repository details
 * - Create/delete repositories
 * - Repository statistics
 */

import { getOctokit, withRetry } from './octokit.service';
import type { GitHubRepository } from '@/types/github';

/**
 * List all repositories for authenticated user
 */
export async function listUserRepositories(
    options: {
        type?: 'all' | 'owner' | 'public' | 'private' | 'member';
        sort?: 'created' | 'updated' | 'pushed' | 'full_name';
        direction?: 'asc' | 'desc';
        per_page?: number;
    } = {}
): Promise<GitHubRepository[]> {
    return withRetry(async () => {
        console.log('[RepoService] Listing user repositories...');
        const octokit = await getOctokit();
        const { data } = await octokit.repos.listForAuthenticatedUser({
            type: options.type || 'all',
            sort: options.sort || 'updated',
            direction: options.direction || 'desc',
            per_page: options.per_page || 50,
        });
        console.log(`[RepoService] Found ${data.length} repositories.`);
        return data;
    });
}

/**
 * Get a specific repository
 */
export async function getRepository(
    owner: string,
    repo: string
): Promise<GitHubRepository> {
    return withRetry(async () => {
        const octokit = await getOctokit();
        const { data } = await octokit.repos.get({
            owner,
            repo,
        });
        return data;
    });
}

/**
 * Get the full file tree of a repository recursively
 */
export async function getRepositoryTree(owner: string, repo: string, branch: string) {
    return withRetry(async () => {
        const octokit = await getOctokit();
        const { data } = await octokit.git.getTree({
            owner,
            repo,
            tree_sha: branch,
            recursive: 'true',
        });
        return data.tree;
    });
}

/**
 * Search repositories
 */
export async function searchRepositories(
    query: string,
    options: {
        sort?: 'stars' | 'forks' | 'updated';
        order?: 'asc' | 'desc';
        per_page?: number;
    } = {}
): Promise<GitHubRepository[]> {
    return withRetry(async () => {
        const octokit = await getOctokit();
        const { data } = await octokit.search.repos({
            q: query,
            sort: options.sort,
            order: options.order || 'desc',
            per_page: options.per_page || 30,
        });
        return data.items;
    });
}

/**
 * Create a new repository
 */
export async function createRepository(
    name: string,
    options: {
        description?: string;
        private?: boolean;
        auto_init?: boolean;
        gitignore_template?: string;
        license_template?: string;
    } = {}
): Promise<GitHubRepository> {
    return withRetry(async () => {
        const octokit = await getOctokit();
        const { data } = await octokit.repos.createForAuthenticatedUser({
            name,
            description: options.description,
            private: options.private ?? false,
            auto_init: options.auto_init ?? true,
            gitignore_template: options.gitignore_template,
            license_template: options.license_template,
        });
        return data;
    });
}

/**
 * Delete a repository
 */
export async function deleteRepository(
    owner: string,
    repo: string
): Promise<void> {
    return withRetry(async () => {
        const octokit = await getOctokit();
        await octokit.repos.delete({
            owner,
            repo,
        });
    });
}

/**
 * Star a repository
 */
export async function starRepository(
    owner: string,
    repo: string
): Promise<void> {
    return withRetry(async () => {
        const octokit = await getOctokit();
        await octokit.activity.starRepoForAuthenticatedUser({
            owner,
            repo,
        });
    });
}

/**
 * Unstar a repository
 */
export async function unstarRepository(
    owner: string,
    repo: string
): Promise<void> {
    return withRetry(async () => {
        const octokit = await getOctokit();
        await octokit.activity.unstarRepoForAuthenticatedUser({
            owner,
            repo,
        });
    });
}

/**
 * Check if repository is starred
 */
export async function isRepositoryStarred(
    owner: string,
    repo: string
): Promise<boolean> {
    try {
        const octokit = await getOctokit();
        await octokit.activity.checkRepoIsStarredByAuthenticatedUser({
            owner,
            repo,
        });
        return true;
    } catch (error: unknown) {
        if ((error as { status?: number })?.status === 404) {
            return false;
        }
        throw error;
    }
}

/**
 * Get repository languages breakdown
 */
export async function getRepositoryLanguages(
    owner: string,
    repo: string
): Promise<Record<string, number>> {
    return withRetry(async () => {
        const octokit = await getOctokit();
        const { data } = await octokit.repos.listLanguages({
            owner,
            repo,
        });
        return data;
    });
}

/**
 * Get repository contributors
 */
export async function getRepositoryContributors(
    owner: string,
    repo: string,
    limit = 30
): Promise<Array<{
    login: string;
    avatar_url: string;
    contributions: number;
}>> {
    return withRetry(async () => {
        const octokit = await getOctokit();
        const { data } = await octokit.repos.listContributors({
            owner,
            repo,
            per_page: limit,
        });
        return data as Array<{ login: string; avatar_url: string; contributions: number; }>;
    });
}
