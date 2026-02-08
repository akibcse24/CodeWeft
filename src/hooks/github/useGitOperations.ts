/**
 * useGitOperations Hook
 * 
 * React hook for git operations using TanStack Query
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as GitService from '@/services/github/git.service';
import * as RepoService from '@/services/github/repository.service';
import { toast } from 'sonner';

export function useRepositories() {
    return useQuery({
        queryKey: ['github', 'repositories'],
        queryFn: () => RepoService.listUserRepositories({
            sort: 'updated',
            direction: 'desc',
            per_page: 50,
        }),
        staleTime: 1000 * 60 * 5, // 5 minutes
        retry: 2,
    });
}

export function useRepository(owner: string, repo: string) {
    return useQuery({
        queryKey: ['github', 'repository', owner, repo],
        queryFn: () => RepoService.getRepository(owner, repo),
        staleTime: 1000 * 60 * 10, // 10 minutes
        enabled: !!owner && !!repo,
    });
}

export function useBranches(owner: string, repo: string) {
    return useQuery({
        queryKey: ['github', 'branches', owner, repo],
        queryFn: () => GitService.listBranches(owner, repo),
        staleTime: 1000 * 60 * 5, // 5 minutes
        enabled: !!owner && !!repo,
    });
}

export function useCommits(owner: string, repo: string, branch = 'main', limit = 30) {
    return useQuery({
        queryKey: ['github', 'commits', owner, repo, branch, limit],
        queryFn: () => GitService.getCommits(owner, repo, branch, limit),
        staleTime: 1000 * 60 * 5, // 5 minutes
        enabled: !!owner && !!repo,
    });
}

export function useCreateBranch() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({
            owner,
            repo,
            branchName,
            fromBranch,
        }: {
            owner: string;
            repo: string;
            branchName: string;
            fromBranch?: string;
        }) => GitService.createBranch(owner, repo, branchName, fromBranch),
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({
                queryKey: ['github', 'branches', variables.owner, variables.repo],
            });
            toast.success(`Branch "${variables.branchName}" created successfully!`);
        },
        onError: (error: Error) => {
            toast.error(`Failed to create branch: ${error.message}`);
        },
    });
}

export function useDeleteBranch() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({
            owner,
            repo,
            branchName,
        }: {
            owner: string;
            repo: string;
            branchName: string;
        }) => GitService.deleteBranch(owner, repo, branchName),
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({
                queryKey: ['github', 'branches', variables.owner, variables.repo],
            });
            toast.success(`Branch "${variables.branchName}" deleted successfully!`);
        },
        onError: (error: Error) => {
            toast.error(`Failed to delete branch: ${error.message}`);
        },
    });
}

export function useMergeBranches() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({
            owner,
            repo,
            base,
            head,
            commitMessage,
        }: {
            owner: string;
            repo: string;
            base: string;
            head: string;
            commitMessage?: string;
        }) => GitService.mergeBranches(owner, repo, base, head, commitMessage),
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({
                queryKey: ['github', 'commits', variables.owner, variables.repo],
            });
            queryClient.invalidateQueries({
                queryKey: ['github', 'branches', variables.owner, variables.repo],
            });
            toast.success(`Merged "${variables.head}" into "${variables.base}" successfully!`);
        },
        onError: (error: Error) => {
            toast.error(`Failed to merge branches: ${error.message}`);
        },
    });
}

export function useStarRepository() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ owner, repo }: { owner: string; repo: string }) =>
            RepoService.starRepository(owner, repo),
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({
                queryKey: ['github', 'repository', variables.owner, variables.repo],
            });
            toast.success('Repository starred!');
        },
        onError: (error: Error) => {
            toast.error(`Failed to star repository: ${error.message}`);
        },
    });
}

export function useUnstarRepository() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ owner, repo }: { owner: string; repo: string }) =>
            RepoService.unstarRepository(owner, repo),
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({
                queryKey: ['github', 'repository', variables.owner, variables.repo],
            });
            toast.success('Repository unstarred!');
        },
        onError: (error: Error) => {
            toast.error(`Failed to unstar repository: ${error.message}`);
        },
    });
}

export function useSearchRepositories(query: string) {
    return useQuery({
        queryKey: ['github', 'search', 'repositories', query],
        queryFn: () => RepoService.searchRepositories(query),
        staleTime: 1000 * 60 * 5, // 5 minutes
        enabled: query.length > 2, // Only search if query is at least 3 chars
    });
}

export function useRepositoryTree(owner: string, repo: string, branch: string) {
    return useQuery({
        queryKey: ['github', 'tree', owner, repo, branch],
        queryFn: () => RepoService.getRepositoryTree(owner, repo, branch),
        staleTime: 1000 * 60 * 60, // 1 hour
        enabled: !!owner && !!repo && !!branch,
    });
}
