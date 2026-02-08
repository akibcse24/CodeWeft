/**
 * useCodespacesOperations Hook
 * 
 * React hooks for GitHub Codespaces operations using TanStack Query
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as CodespacesService from '@/services/github/codespaces.service';
import { toast } from 'sonner';

export function useCodespaces() {
    return useQuery({
        queryKey: ['github', 'codespaces'],
        queryFn: () => CodespacesService.listCodespaces(),
        staleTime: 1000 * 30, // 30 seconds
        refetchInterval: (query) => {
            const data = query.state.data;
            // Auto-refresh if any codespace is changing state
            const hasTransitioning = data?.some(c =>
                ['Starting', 'Stopping', 'Rebuilding', 'Queued', 'Moving', 'Terminating'].includes(c.state)
            );
            return hasTransitioning ? 5000 : false;
        },
    });
}

export function useCodespace(name: string) {
    return useQuery({
        queryKey: ['github', 'codespace', name],
        queryFn: () => CodespacesService.getCodespace(name),
        staleTime: 1000 * 30,
        enabled: !!name,
        refetchInterval: (query) => {
            const data = query.state.data;
            const isTransitioning = data &&
                ['Starting', 'Stopping', 'Rebuilding', 'Queued', 'Moving', 'Terminating'].includes(data.state);
            return isTransitioning ? 3000 : false;
        },
    });
}

export function useRepoMachines(owner: string, repo: string, branch?: string) {
    return useQuery({
        queryKey: ['github', 'codespaces-machines', owner, repo, branch],
        queryFn: () => CodespacesService.getRepoMachines(owner, repo, branch),
        enabled: !!owner && !!repo,
        staleTime: 1000 * 60 * 60, // 1 hour (unlikely to change often)
    });
}

export function useCreateCodespace() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ owner, repo, branch, machine }: { owner: string; repo: string; branch?: string; machine?: string }) =>
            CodespacesService.createCodespace(owner, repo, branch, machine),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['github', 'codespaces'] });
            toast.success('Codespace creation started!');
        },
        onError: (error: Error) => {
            toast.error(`Failed to create codespace: ${error.message}`);
        },
    });
}

export function useStartCodespace() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (name: string) => CodespacesService.startCodespace(name),
        onSuccess: (_, name) => {
            queryClient.invalidateQueries({ queryKey: ['github', 'codespaces'] });
            queryClient.invalidateQueries({ queryKey: ['github', 'codespace', name] });
            toast.success('Codespace starting...');
        },
        onError: (error: Error) => {
            toast.error(`Failed to start codespace: ${error.message}`);
        },
    });
}

export function useStopCodespace() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (name: string) => CodespacesService.stopCodespace(name),
        onSuccess: (_, name) => {
            queryClient.invalidateQueries({ queryKey: ['github', 'codespaces'] });
            queryClient.invalidateQueries({ queryKey: ['github', 'codespace', name] });
            toast.success('Codespace stopping...');
        },
        onError: (error: Error) => {
            toast.error(`Failed to stop codespace: ${error.message}`);
        },
    });
}

export function useDeleteCodespace() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (name: string) => CodespacesService.deleteCodespace(name),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['github', 'codespaces'] });
            toast.success('Codespace deleted successfully');
        },
        onError: (error: Error) => {
            toast.error(`Failed to delete codespace: ${error.message}`);
        },
    });
}

export function useRebuildCodespace() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (name: string) => CodespacesService.rebuildCodespace(name),
        onSuccess: (_, name) => {
            queryClient.invalidateQueries({ queryKey: ['github', 'codespaces'] });
            queryClient.invalidateQueries({ queryKey: ['github', 'codespace', name] });
            toast.success('Codespace rebuild started!');
        },
        onError: (error: Error) => {
            toast.error(`Failed to rebuild codespace: ${error.message}`);
        },
    });
}

export function useUpdateCodespace() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ name, options }: { name: string; options: { machine?: string; display_name?: string } }) =>
            CodespacesService.updateCodespace(name, options),
        onSuccess: (_, { name }) => {
            queryClient.invalidateQueries({ queryKey: ['github', 'codespaces'] });
            queryClient.invalidateQueries({ queryKey: ['github', 'codespace', name] });
            toast.success('Codespace updated!');
        },
        onError: (error: Error) => {
            toast.error(`Failed to update codespace: ${error.message}`);
        },
    });
}

export function useExportCodespaceChanges() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ name, branch }: { name: string; branch: string }) =>
            CodespacesService.exportChangesToBranch(name, branch),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['github', 'codespaces'] });
            toast.success('Changes exported to branch!');
        },
        onError: (error: Error) => {
            toast.error(`Failed to export changes: ${error.message}`);
        },
    });
}

// Re-export the VS Code Desktop URL helper
export { getVSCodeDesktopUrl } from '@/services/github/codespaces.service';
