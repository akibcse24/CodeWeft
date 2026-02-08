import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
    listBranches,
    createBranch,
    deleteBranch,
    mergeBranches,
    getCommits,
    getCommit,
    compareCommits,
    getFileContent,
    updateFile,
    deleteFile,
    createCommit,
} from '@/services/github/git.service';
import type { GitHubBranch, GitHubCommit } from '@/types/github';
import { toast } from '@/hooks/use-toast';

interface UseGitOperationsProps {
    owner: string;
    repo: string;
    enabled?: boolean;
}

/**
 * React Query hook for Git operations
 * Provides queries and mutations for branch/commit management
 */
export function useGitOperations({ owner, repo, enabled = true }: UseGitOperationsProps) {
    const queryClient = useQueryClient();

    // Queries
    const branches = useQuery({
        queryKey: ['branches', owner, repo],
        queryFn: () => listBranches(owner, repo),
        enabled: enabled && !!owner && !!repo,
        staleTime: 5 * 60 * 1000, // 5 minutes
    });

    const commits = useQuery({
        queryKey: ['commits', owner, repo],
        queryFn: () => getCommits(owner, repo, 'main', 30),
        enabled: enabled && !!owner && !!repo,
        staleTime: 2 * 60 * 1000, // 2 minutes
    });

    // Mutations
    const createBranchMutation = useMutation({
        mutationFn: ({ name, from }: { name: string; from?: string }) =>
            createBranch(owner, repo, name, from),
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ['branches', owner, repo] });
            toast({
                title: 'Branch created',
                description: `Successfully created branch "${data.name}"`,
            });
        },
        onError: (error: Error) => {
            toast({
                title: 'Failed to create branch',
                description: error.message,
                variant: 'destructive',
            });
        },
    });

    const deleteBranchMutation = useMutation({
        mutationFn: (branchName: string) => deleteBranch(owner, repo, branchName),
        onSuccess: (_, branchName) => {
            queryClient.invalidateQueries({ queryKey: ['branches', owner, repo] });
            toast({
                title: 'Branch deleted',
                description: `Successfully deleted branch "${branchName}"`,
            });
        },
        onError: (error: Error) => {
            toast({
                title: 'Failed to delete branch',
                description: error.message,
                variant: 'destructive',
            });
        },
    });

    const mergeBranchesMutation = useMutation({
        mutationFn: ({ base, head, message }: { base: string; head: string; message?: string }) =>
            mergeBranches(owner, repo, base, head, message),
        onSuccess: (_, { base, head }) => {
            queryClient.invalidateQueries({ queryKey: ['commits', owner, repo] });
            queryClient.invalidateQueries({ queryKey: ['branches', owner, repo] });
            toast({
                title: 'Branches merged',
                description: `Successfully merged "${head}" into "${base}"`,
            });
        },
        onError: (error: Error) => {
            toast({
                title: 'Failed to merge branches',
                description: error.message,
                variant: 'destructive',
            });
        },
    });

    const createCommitMutation = useMutation({
        mutationFn: ({
            message,
            files,
            branch,
        }: {
            message: string;
            files: Array<{ path: string; content: string }>;
            branch?: string;
        }) => createCommit(owner, repo, message, files, branch),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['commits', owner, repo] });
            toast({
                title: 'Commit created',
                description: 'Successfully created commit',
            });
        },
        onError: (error: Error) => {
            toast({
                title: 'Failed to create commit',
                description: error.message,
                variant: 'destructive',
            });
        },
    });

    const updateFileMutation = useMutation({
        mutationFn: ({
            path,
            content,
            message,
            branch,
            sha,
        }: {
            path: string;
            content: string;
            message: string;
            branch?: string;
            sha?: string;
        }) => updateFile(owner, repo, path, content, message, branch, sha),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['commits', owner, repo] });
            toast({
                title: 'File updated',
                description: 'Successfully updated file',
            });
        },
        onError: (error: Error) => {
            toast({
                title: 'Failed to update file',
                description: error.message,
                variant: 'destructive',
            });
        },
    });

    return {
        // Queries
        branches: branches.data ?? [],
        commits: commits.data ?? [],
        isLoadingBranches: branches.isLoading,
        isLoadingCommits: commits.isLoading,
        branchesError: branches.error,
        commitsError: commits.error,

        // Mutations
        createBranch: createBranchMutation.mutateAsync,
        deleteBranch: deleteBranchMutation.mutateAsync,
        mergeBranches: mergeBranchesMutation.mutateAsync,
        createCommit: createCommitMutation.mutateAsync,
        updateFile: updateFileMutation.mutateAsync,

        // Mutation states
        isCreatingBranch: createBranchMutation.isPending,
        isDeletingBranch: deleteBranchMutation.isPending,
        isMergingBranches: mergeBranchesMutation.isPending,
        isCreatingCommit: createCommitMutation.isPending,
        isUpdatingFile: updateFileMutation.isPending,

        // Refetch functions
        refetchBranches: branches.refetch,
        refetchCommits: commits.refetch,
    };
}
