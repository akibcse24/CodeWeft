import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from './use-toast';
import {
    listGists,
    getGist,
    createGist as createGistService,
    updateGist as updateGistService,
    deleteGist as deleteGistService,
    starGist as starGistService,
    unstarGist as unstarGistService,
    forkGist as forkGistService,
    listStarredGists,
    isGistStarred,
} from '@/services/github/gist.service';
import type { GitHubGist } from '@/types/github';

interface UseGistsProps {
    enabled?: boolean;
    type?: 'all' | 'public' | 'secret';
}

export function useGists({ enabled = true, type = 'all' }: UseGistsProps = {}) {
    const queryClient = useQueryClient();

    // Query: List gists
    const gists = useQuery({
        queryKey: ['gists', type],
        queryFn: () => listGists(type),
        enabled,
        staleTime: 2 * 60 * 1000, // 2 minutes
    });

    // Query: List starred gists
    const starredGists = useQuery({
        queryKey: ['gists', 'starred'],
        queryFn: () => listStarredGists(),
        enabled,
        staleTime: 3 * 60 * 1000, // 3 minutes
    });

    // Mutation: Create gist
    const createGistMutation = useMutation({
        mutationFn: ({
            files,
            description,
            isPublic,
        }: {
            files: Record<string, { content: string }>;
            description: string;
            isPublic: boolean;
        }) => createGistService(files, description, isPublic),
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ['gists'] });
            toast({
                title: 'Gist created',
                description: `Successfully created gist: ${data.description || 'Untitled'}`,
            });
        },
        onError: (error: Error) => {
            toast({
                title: 'Failed to create gist',
                description: error.message,
                variant: 'destructive',
            });
        },
    });

    // Mutation: Update gist
    const updateGistMutation = useMutation({
        mutationFn: ({
            gistId,
            files,
            description,
        }: {
            gistId: string;
            files?: Record<string, { content: string } | null>;
            description?: string;
        }) => updateGistService(gistId, files, description),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['gists'] });
            toast({
                title: 'Gist updated',
                description: 'Your gist has been updated successfully',
            });
        },
        onError: (error: Error) => {
            toast({
                title: 'Failed to update gist',
                description: error.message,
                variant: 'destructive',
            });
        },
    });

    // Mutation: Delete gist
    const deleteGistMutation = useMutation({
        mutationFn: (gistId: string) => deleteGistService(gistId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['gists'] });
            toast({
                title: 'Gist deleted',
                description: 'Your gist has been deleted permanently',
            });
        },
        onError: (error: Error) => {
            toast({
                title: 'Failed to delete gist',
                description: error.message,
                variant: 'destructive',
            });
        },
    });

    // Mutation: Star gist
    const starGistMutation = useMutation({
        mutationFn: (gistId: string) => starGistService(gistId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['gists'] });
            toast({
                title: 'Gist starred',
                description: 'Added to your starred gists',
            });
        },
        onError: (error: Error) => {
            toast({
                title: 'Failed to star gist',
                description: error.message,
                variant: 'destructive',
            });
        },
    });

    // Mutation: Unstar gist
    const unstarGistMutation = useMutation({
        mutationFn: (gistId: string) => unstarGistService(gistId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['gists'] });
            toast({
                title: 'Gist unstarred',
                description: 'Removed from your starred gists',
            });
        },
        onError: (error: Error) => {
            toast({
                title: 'Failed to unstar gist',
                description: error.message,
                variant: 'destructive',
            });
        },
    });

    // Mutation: Fork gist
    const forkGistMutation = useMutation({
        mutationFn: (gistId: string) => forkGistService(gistId),
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ['gists'] });
            toast({
                title: 'Gist forked',
                description: `Successfully forked to your account`,
            });
        },
        onError: (error: Error) => {
            toast({
                title: 'Failed to fork gist',
                description: error.message,
                variant: 'destructive',
            });
        },
    });

    return {
        // Queries
        gists: gists.data || [],
        isLoadingGists: gists.isLoading,
        gistsError: gists.error,

        starredGists: starredGists.data || [],
        isLoadingStarredGists: starredGists.isLoading,

        // Mutations
        createGist: createGistMutation.mutate,
        isCreatingGist: createGistMutation.isPending,

        updateGist: updateGistMutation.mutate,
        isUpdatingGist: updateGistMutation.isPending,

        deleteGist: deleteGistMutation.mutate,
        isDeletingGist: deleteGistMutation.isPending,

        starGist: starGistMutation.mutate,
        isStarringGist: starGistMutation.isPending,

        unstarGist: unstarGistMutation.mutate,
        isUnstarringGist: unstarGistMutation.isPending,

        forkGist: forkGistMutation.mutate,
        isForkingGist: forkGistMutation.isPending,

        // Refetch
        refetchGists: gists.refetch,
        refetchStarredGists: starredGists.refetch,
    };
}

/**
 * Hook to get a single gist by ID
 */
export function useGist(gistId: string | null, enabled = true) {
    return useQuery({
        queryKey: ['gist', gistId],
        queryFn: () => (gistId ? getGist(gistId) : Promise.reject('No gist ID')),
        enabled: enabled && !!gistId,
        staleTime: 5 * 60 * 1000, // 5 minutes
    });
}

/**
 * Hook to check if a gist is starred
 */
export function useGistStarred(gistId: string | null, enabled = true) {
    return useQuery({
        queryKey: ['gist-starred', gistId],
        queryFn: () => (gistId ? isGistStarred(gistId) : Promise.reject('No gist ID')),
        enabled: enabled && !!gistId,
        staleTime: 2 * 60 * 1000,
    });
}
