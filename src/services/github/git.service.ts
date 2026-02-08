/**
 * Git Operations Service
 * 
 * Provides high-level git operations using GitHub API:
 * - Branch management (create, delete, merge)
 * - Commit operations (create, compare)
 * - File operations (read, update, delete)
 * - Pull requests (create, list, merge)
 */

import { getOctokit, withRetry } from './octokit.service';
import type { GitHubBranch, GitHubCommit, GitHubFileContent, GitHubTree, FileDiff } from '@/types/github';

/**
 * List all branches in a repository
 */
export async function listBranches(owner: string, repo: string): Promise<GitHubBranch[]> {
    return withRetry(async () => {
        const octokit = await getOctokit();
        const { data } = await octokit.repos.listBranches({
            owner,
            repo,
            per_page: 100,
        });
        return data as unknown as GitHubBranch[];
    });
}

/**
 * Create a new branch
 */
export async function createBranch(
    owner: string,
    repo: string,
    branchName: string,
    fromBranch = 'main'
): Promise<GitHubBranch> {
    return withRetry(async () => {
        const octokit = await getOctokit();

        // Get the SHA of the source branch
        const { data: ref } = await octokit.git.getRef({
            owner,
            repo,
            ref: `heads/${fromBranch}`,
        });

        // Create new branch from that SHA
        const { data: newRef } = await octokit.git.createRef({
            owner,
            repo,
            ref: `refs/heads/${branchName}`,
            sha: ref.object.sha,
        });

        // Return branch info
        const { data: branch } = await octokit.repos.getBranch({
            owner,
            repo,
            branch: branchName,
        });

        return branch as unknown as GitHubBranch;
    });
}

/**
 * Delete a branch
 */
export async function deleteBranch(
    owner: string,
    repo: string,
    branchName: string
): Promise<void> {
    return withRetry(async () => {
        const octokit = await getOctokit();
        await octokit.git.deleteRef({
            owner,
            repo,
            ref: `heads/${branchName}`,
        });
    });
}

/**
 * Merge two branches
 */
export async function mergeBranches(
    owner: string,
    repo: string,
    base: string,
    head: string,
    commitMessage?: string
// eslint-disable-next-line @typescript-eslint/no-explicit-any
): Promise<any> {
    return withRetry(async () => {
        const octokit = await getOctokit();
        const { data } = await octokit.repos.merge({
            owner,
            repo,
            base,
            head,
            commit_message: commitMessage || `Merge ${head} into ${base}`,
        });
        return data;
    });
}

/**
 * Get commit history for a branch
 */
export async function getCommits(
    owner: string,
    repo: string,
    branch = 'main',
    limit = 30
): Promise<GitHubCommit[]> {
    return withRetry(async () => {
        const octokit = await getOctokit();
        const { data } = await octokit.repos.listCommits({
            owner,
            repo,
            sha: branch,
            per_page: limit,
        });
        return data as unknown as GitHubCommit[];
    });
}

/**
 * Get a single commit
 */
export async function getCommit(
    owner: string,
    repo: string,
    commitSha: string
): Promise<GitHubCommit & { files?: FileDiff[] }> {
    return withRetry(async () => {
        const octokit = await getOctokit();
        const { data } = await octokit.repos.getCommit({
            owner,
            repo,
            ref: commitSha,
        });
        return data as unknown as GitHubCommit & { files?: FileDiff[] };
    });
}

/**
 * Compare two commits
 */
export async function compareCommits(
    owner: string,
    repo: string,
    base: string,
    head: string
): Promise<{
    files: FileDiff[];
    ahead_by: number;
    behind_by: number;
    status: 'diverged' | 'ahead' | 'behind' | 'identical';
}> {
    return withRetry(async () => {
        const octokit = await getOctokit();
        const { data } = await octokit.repos.compareCommits({
            owner,
            repo,
            base,
            head,
        });

        return {
            files: data.files as unknown as FileDiff[],
            ahead_by: data.ahead_by,
            behind_by: data.behind_by,
            status: data.status as 'diverged' | 'ahead' | 'behind' | 'identical',
        };
    });
}

/**
 * Get file content from repository
 */
export async function getFileContent(
    owner: string,
    repo: string,
    path: string,
    ref = 'main'
): Promise<GitHubFileContent> {
    return withRetry(async () => {
        const octokit = await getOctokit();
        const { data } = await octokit.repos.getContent({
            owner,
            repo,
            path,
            ref,
        });

        if (Array.isArray(data)) {
            throw new Error('Path is a directory, not a file');
        }

        return data as unknown as GitHubFileContent;
    });
}

/**
 * Update (or create) a file in repository
 */
export async function updateFile(
    owner: string,
    repo: string,
    path: string,
    content: string,
    message: string,
    branch = 'main',
    sha?: string // Required for updates, not for create
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
): Promise<any> {
    return withRetry(async () => {
        const octokit = await getOctokit();

        // Convert content to base64
        const contentBase64 = btoa(unescape(encodeURIComponent(content)));

        const { data } = await octokit.repos.createOrUpdateFileContents({
            owner,
            repo,
            path,
            message,
            content: contentBase64,
            branch,
            sha, // If sha is provided, it updates; otherwise creates
        });

        return data.commit;
    });
}

/**
 * Delete a file from repository
 */
export async function deleteFile(
    owner: string,
    repo: string,
    path: string,
    message: string,
    sha: string,
    branch = 'main'
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
): Promise<any> {
    return withRetry(async () => {
        const octokit = await getOctokit();
        const { data } = await octokit.repos.deleteFile({
            owner,
            repo,
            path,
            message,
            sha,
            branch,
        });

        return data.commit;
    });
}

/**
 * Get repository tree (directory listing)
 */
export async function getTree(
    owner: string,
    repo: string,
    treeSha: string,
    recursive = false
): Promise<GitHubTree> {
    return withRetry(async () => {
        const octokit = await getOctokit();
        const { data } = await octokit.git.getTree({
            owner,
            repo,
            tree_sha: treeSha,
            recursive: recursive ? 'true' : undefined,
        });

        return data;
    });
}

/**
 * Create a commit with multiple file changes
 */
export async function createCommit(
    owner: string,
    repo: string,
    message: string,
    files: Array<{
        path: string;
        content: string;
        mode?: '100644' | '100755' | '040000' | '160000' | '120000';
    }>,
    branch = 'main'
): Promise<GitHubCommit> {
    return withRetry(async () => {
        const octokit = await getOctokit();

        // Get the current commit SHA
        const { data: ref } = await octokit.git.getRef({
            owner,
            repo,
            ref: `heads/${branch}`,
        });

        const currentCommitSha = ref.object.sha;

        // Get the current commit
        const { data: currentCommit } = await octokit.git.getCommit({
            owner,
            repo,
            commit_sha: currentCommitSha,
        });

        // Create blobs for each file
        const blobs = await Promise.all(
            files.map(async (file) => {
                const contentBase64 = btoa(unescape(encodeURIComponent(file.content)));
                const { data: blob } = await octokit.git.createBlob({
                    owner,
                    repo,
                    content: contentBase64,
                    encoding: 'base64',
                });
                return {
                    path: file.path,
                    mode: file.mode || '100644',
                    type: 'blob' as const,
                    sha: blob.sha,
                };
            })
        );

        // Create new tree
        const { data: newTree } = await octokit.git.createTree({
            owner,
            repo,
            base_tree: currentCommit.tree.sha,
            tree: blobs,
        });

        // Create new commit
        const { data: newCommit } = await octokit.git.createCommit({
            owner,
            repo,
            message,
            tree: newTree.sha,
            parents: [currentCommitSha],
        });

        // Update branch reference
        await octokit.git.updateRef({
            owner,
            repo,
            ref: `heads/${branch}`,
            sha: newCommit.sha,
        });

        return newCommit as unknown as GitHubCommit;
    });
}

/**
 * Get the latest commit SHA for a branch
 */
export async function getLatestCommitSha(
    owner: string,
    repo: string,
    branch = 'main'
): Promise<string> {
    return withRetry(async () => {
        const octokit = await getOctokit();
        const { data } = await octokit.git.getRef({
            owner,
            repo,
            ref: `heads/${branch}`,
        });
        return data.object.sha;
    });
}
