import { useQuery } from '@tanstack/react-query';
import { listBranches, getCommits, compareCommits } from '@/services/github/git.service';
import type { GitHubCommit } from '@/types/github';

interface UseRepositoryStatusProps {
    owner: string;
    repo: string;
    branch?: string;
    enabled?: boolean;
}

interface RepositoryStatus {
    currentBranch: string;
    defaultBranch: string;
    totalBranches: number;
    aheadBy: number;
    behindBy: number;
    syncStatus: 'synced' | 'ahead' | 'behind' | 'diverged' | 'unknown';
    recentCommits: GitHubCommit[];
    lastCommitDate: string | null;
    lastCommitAuthor: string | null;
}

/**
 * React Query hook for repository status
 * Provides current branch info, sync status, and recent activity
 */
export function useRepositoryStatus({
    owner,
    repo,
    branch = 'main',
    enabled = true,
}: UseRepositoryStatusProps) {
    const status = useQuery({
        queryKey: ['repository-status', owner, repo, branch],
        queryFn: async (): Promise<RepositoryStatus> => {
            try {
                // Fetch branches
                const branches = await listBranches(owner, repo);
                const currentBranch = branches.find((b) => b.name === branch) || branches[0];
                const defaultBranch = branches.find((b) => b.name === 'main' || b.name === 'master') || branches[0];

                // Fetch recent commits for the branch
                const commits = await getCommits(owner, repo, branch, 10);

                // Compare with default branch to get sync status
                let aheadBy = 0;
                let behindBy = 0;
                let syncStatus: RepositoryStatus['syncStatus'] = 'unknown';

                if (branch !== defaultBranch.name) {
                    try {
                        const comparison = await compareCommits(owner, repo, defaultBranch.name, branch);
                        aheadBy = comparison.ahead_by;
                        behindBy = comparison.behind_by;
                        // Map 'identical' to 'synced' for our type
                        syncStatus = comparison.status === 'identical' ? 'synced' : comparison.status;
                    } catch (error) {
                        // If comparison fails, assume unknown
                        console.warn('Failed to compare branches:', error);
                    }
                } else {
                    syncStatus = 'synced';
                }

                // Get latest commit info
                const latestCommit = commits[0];
                const lastCommitDate = latestCommit?.commit?.author?.date || null;
                const lastCommitAuthor = latestCommit?.commit?.author?.name || null;

                return {
                    currentBranch: currentBranch?.name || branch,
                    defaultBranch: defaultBranch?.name || 'main',
                    totalBranches: branches.length,
                    aheadBy,
                    behindBy,
                    syncStatus,
                    recentCommits: commits,
                    lastCommitDate,
                    lastCommitAuthor,
                };
            } catch (error) {
                console.error('Failed to fetch repository status:', error);
                throw error;
            }
        },
        enabled: enabled && !!owner && !!repo,
        staleTime: 3 * 60 * 1000, // 3 minutes
        retry: 2,
    });

    return {
        status: status.data,
        isLoading: status.isLoading,
        isError: status.isError,
        error: status.error,
        refetch: status.refetch,
    };
}

/**
 * Helper function to get sync status badge color
 */
export function getSyncStatusColor(status: RepositoryStatus['syncStatus']): string {
    switch (status) {
        case 'synced':
            return 'bg-green-500/20 text-green-400 border-green-500/30';
        case 'ahead':
            return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
        case 'behind':
            return 'bg-amber-500/20 text-amber-400 border-amber-500/30';
        case 'diverged':
            return 'bg-red-500/20 text-red-400 border-red-500/30';
        default:
            return 'bg-muted text-muted-foreground border-muted';
    }
}

/**
 * Helper function to get sync status label
 */
export function getSyncStatusLabel(status: RepositoryStatus['syncStatus'], aheadBy: number, behindBy: number): string {
    switch (status) {
        case 'synced':
            return 'Up to date';
        case 'ahead':
            return `${aheadBy} commit${aheadBy > 1 ? 's' : ''} ahead`;
        case 'behind':
            return `${behindBy} commit${behindBy > 1 ? 's' : ''} behind`;
        case 'diverged':
            return `${aheadBy} ahead, ${behindBy} behind`;
        default:
            return 'Unknown';
    }
}
