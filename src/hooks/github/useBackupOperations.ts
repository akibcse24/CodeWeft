/**
 * useBackupOperations Hook
 * 
 * React hooks for Backup operations using TanStack Query and BackupService
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as BackupService from '@/services/github/backup.service';
import { toast } from 'sonner';

export function useBackups(owner?: string, repo?: string) {
    return useQuery({
        queryKey: ['backups', owner, repo],
        queryFn: () => BackupService.listBackups({ owner, repo }),
        staleTime: 1000 * 60, // 1 minute
    });
}

export function useCreateBackup() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({
            owner,
            repo,
            branch,
            onProgress
        }: {
            owner: string;
            repo: string;
            branch: string;
            onProgress?: (progress: number, currentFile: string) => void
        }) => BackupService.createBackup(owner, repo, branch, onProgress),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['backups'] });
            toast.success('Backup created and downloaded successfully!');
        },
        onError: (error: Error) => {
            toast.error(`Failed to create backup: ${error.message}`);
        },
    });
}

export function useDeleteBackup() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (id: number) => BackupService.deleteBackupRecord(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['backups'] });
            toast.success('Backup record deleted');
        },
        onError: (error: Error) => {
            toast.error(`Failed to delete backup record: ${error.message}`);
        },
    });
}
