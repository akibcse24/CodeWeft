/**
 * GitHub Gist Service
 * 
 * Provides operations for managing GitHub Gists (code snippets/pastebin)
 */

import { getOctokit } from './octokit.service';
import type { GitHubGist } from '@/types/github';

/**
 * List user's gists
 * @param type - Filter by gist type (all, public, secret)
 */
export async function listGists(type: 'all' | 'public' | 'secret' = 'all'): Promise<GitHubGist[]> {
    const octokit = await getOctokit();

    const params: { per_page: number } = {
        per_page: 100,
    };

    // GitHub API doesn't have a direct 'secret' filter, we filter client-side
    const { data } = await octokit.rest.gists.list(params);

    if (type === 'public') {
        return data.filter(gist => gist.public) as GitHubGist[];
    } else if (type === 'secret') {
        return data.filter(gist => !gist.public) as GitHubGist[];
    }

    return data as GitHubGist[];
}

/**
 * Get a specific gist by ID
 */
export async function getGist(gistId: string): Promise<GitHubGist> {
    const octokit = await getOctokit();
    const { data } = await octokit.rest.gists.get({ gist_id: gistId });
    return data as GitHubGist;
}

/**
 * Create a new gist
 */
export async function createGist(
    files: Record<string, { content: string }>,
    description: string,
    isPublic: boolean = true
): Promise<GitHubGist> {
    const octokit = await getOctokit();

    const { data } = await octokit.rest.gists.create({
        files,
        description,
        public: isPublic,
    });

    return data as GitHubGist;
}

/**
 * Update an existing gist
 */
export async function updateGist(
    gistId: string,
    files?: Record<string, { content: string } | null>, // null to delete a file
    description?: string
): Promise<GitHubGist> {
    const octokit = await getOctokit();

    const { data } = await octokit.rest.gists.update({
        gist_id: gistId,
        files,
        description,
    });

    return data as GitHubGist;
}

/**
 * Delete a gist
 */
export async function deleteGist(gistId: string): Promise<void> {
    const octokit = await getOctokit();
    await octokit.rest.gists.delete({ gist_id: gistId });
}

/**
 * Star a gist
 */
export async function starGist(gistId: string): Promise<void> {
    const octokit = await getOctokit();
    await octokit.rest.gists.star({ gist_id: gistId });
}

/**
 * Unstar a gist
 */
export async function unstarGist(gistId: string): Promise<void> {
    const octokit = await getOctokit();
    await octokit.rest.gists.unstar({ gist_id: gistId });
}

/**
 * Check if a gist is starred
 */
export async function isGistStarred(gistId: string): Promise<boolean> {
    const octokit = await getOctokit();
    try {
        await octokit.rest.gists.checkIsStarred({ gist_id: gistId });
        return true;
    } catch (error: unknown) {
        if ((error as { status?: number })?.status === 404) {
            return false;
        }
        throw error;
    }
}

/**
 * Fork a gist
 */
export async function forkGist(gistId: string): Promise<GitHubGist> {
    const octokit = await getOctokit();
    const { data } = await octokit.rest.gists.fork({ gist_id: gistId });
    return data as GitHubGist;
}

/**
 * List gist comments
 */
export async function listGistComments(gistId: string) {
    const octokit = await getOctokit();
    const { data } = await octokit.rest.gists.listComments({ gist_id: gistId });
    return data;
}

/**
 * Create gist comment
 */
export async function createGistComment(gistId: string, body: string) {
    const octokit = await getOctokit();
    const { data } = await octokit.rest.gists.createComment({
        gist_id: gistId,
        body,
    });
    return data;
}

/**
 * List starred gists
 */
export async function listStarredGists(): Promise<GitHubGist[]> {
    const octokit = await getOctokit();
    const { data } = await octokit.rest.gists.listStarred({
        per_page: 100,
    });
    return data as GitHubGist[];
}

/**
 * Detect programming language from file extension
 */
export function detectLanguage(filename: string): string {
    const ext = filename.split('.').pop()?.toLowerCase() || '';

    const languageMap: Record<string, string> = {
        js: 'javascript',
        jsx: 'javascript',
        ts: 'typescript',
        tsx: 'typescript',
        py: 'python',
        java: 'java',
        cpp: 'cpp',
        c: 'c',
        cs: 'csharp',
        php: 'php',
        rb: 'ruby',
        go: 'go',
        rs: 'rust',
        swift: 'swift',
        kt: 'kotlin',
        html: 'html',
        css: 'css',
        scss: 'scss',
        json: 'json',
        yaml: 'yaml',
        yml: 'yaml',
        md: 'markdown',
        sql: 'sql',
        sh: 'bash',
        bash: 'bash',
    };

    return languageMap[ext] || 'plaintext';
}

/**
 * Validate gist filename
 */
export function validateFilename(filename: string): { valid: boolean; error?: string } {
    if (!filename || filename.trim().length === 0) {
        return { valid: false, error: 'Filename cannot be empty' };
    }

    if (filename.includes('/') || filename.includes('\\')) {
        return { valid: false, error: 'Filename cannot contain slashes' };
    }

    if (filename.length > 255) {
        return { valid: false, error: 'Filename is too long (max 255 characters)' };
    }

    return { valid: true };
}

/**
 * Format file size
 */
export function formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 B';

    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}
