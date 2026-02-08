/**
 * useGistOperations Hook
 * 
 * React hooks for Gist operations using TanStack Query
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as GistService from '@/services/github/gist.service';
import { toast } from 'sonner';

export function useGists(type: 'all' | 'public' | 'secret' = 'all') {
    return useQuery({
        queryKey: ['github', 'gists', type],
        queryFn: () => GistService.listGists(type),
        staleTime: 1000 * 60 * 5, // 5 minutes
        retry: 2,
    });
}

export function useGist(gistId: string) {
    return useQuery({
        queryKey: ['github', 'gist', gistId],
        queryFn: () => GistService.getGist(gistId),
        staleTime: 1000 * 60 * 5,
        enabled: !!gistId,
    });
}

export function useCreateGist() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({
            files,
            description,
            isPublic,
        }: {
            files: Record<string, { content: string }>;
            description: string;
            isPublic: boolean;
        }) => GistService.createGist(files, description, isPublic),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['github', 'gists'] });
            toast.success('Gist created successfully!');
        },
        onError: (error: Error) => {
            toast.error(`Failed to create gist: ${error.message}`);
        },
    });
}

export function useUpdateGist() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({
            gistId,
            files,
            description,
        }: {
            gistId: string;
            files?: Record<string, { content: string } | null>;
            description?: string;
        }) => GistService.updateGist(gistId, files, description),
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ['github', 'gists'] });
            queryClient.invalidateQueries({ queryKey: ['github', 'gist', variables.gistId] });
            toast.success('Gist updated successfully!');
        },
        onError: (error: Error) => {
            toast.error(`Failed to update gist: ${error.message}`);
        },
    });
}

export function useDeleteGist() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (gistId: string) => GistService.deleteGist(gistId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['github', 'gists'] });
            toast.success('Gist deleted successfully!');
        },
        onError: (error: Error) => {
            toast.error(`Failed to delete gist: ${error.message}`);
        },
    });
}

export function useStarGist() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (gistId: string) => GistService.starGist(gistId),
        onSuccess: (_, gistId) => {
            queryClient.invalidateQueries({ queryKey: ['github', 'gist', gistId] });
            toast.success('Gist starred!');
        },
        onError: (error: Error) => {
            toast.error(`Failed to star gist: ${error.message}`);
        },
    });
}

export function useUnstarGist() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (gistId: string) => GistService.unstarGist(gistId),
        onSuccess: (_, gistId) => {
            queryClient.invalidateQueries({ queryKey: ['github', 'gist', gistId] });
            toast.success('Gist unstarred!');
        },
        onError: (error: Error) => {
            toast.error(`Failed to unstar gist: ${error.message}`);
        },
    });
}

export function useForkGist() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (gistId: string) => GistService.forkGist(gistId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['github', 'gists'] });
            toast.success('Gist forked successfully!');
        },
        onError: (error: Error) => {
            toast.error(`Failed to fork gist: ${error.message}`);
        },
    });
}
