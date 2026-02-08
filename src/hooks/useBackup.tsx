import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from './use-toast';
import {
    createBackup,
    listBackups,
    downloadBackup,
    deleteBackup,
    restoreBackup,
    createBackupSchedule,
    listBackupSchedules,
    updateBackupSchedule,
    deleteBackupSchedule,
    type BackupOptions,
    type BackupFilters,
    type BackupSchedule,
} from '@/services/github/backup.service';
import type { Repository } from '@/types/github';

interface UseBackupProps {
    enabled?: boolean;
    filters?: BackupFilters;
}

export function useBackup({ enabled = true, filters }: UseBackupProps = {}) {
    const queryClient = useQueryClient();

    // Query: List backups
    const backups = useQuery({
        queryKey: ['backups', filters],
        queryFn: () => listBackups(filters),
        enabled,
        staleTime: 2 * 60 * 1000, // 2 minutes
    });

    // Query: List backup schedules
    const schedules = useQuery({
        queryKey: ['backup-schedules'],
        queryFn: () => listBackupSchedules(),
        enabled,
        staleTime: 5 * 60 * 1000, // 5 minutes
    });

    // Mutation: Create backup
    const createBackupMutation = useMutation({
        mutationFn: async ({
            repositories,
            options,
        }: {
            repositories: Repository[];
            options?: BackupOptions;
        }) => {
            // Create backup for first repository
            const repo = repositories[0];
            if (!repo) throw new Error('No repository selected');
            const [owner, repoName] = repo.full_name.split('/');
            await createBackup(owner, repoName, 'main');
            return { fileCount: 0, sizeBytes: 0 };
        },
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ['backups'] });
            toast({
                title: 'Backup created',
                description: `Backup completed successfully`,
            });
        },
        onError: (error: Error) => {
            toast({
                title: 'Backup failed',
                description: error.message,
                variant: 'destructive',
            });
        },
    });

    // Mutation: Download backup
    const downloadBackupMutation = useMutation({
        mutationFn: (backupId: string) => downloadBackup(backupId),
        onSuccess: () => {
            toast({
                title: 'Download started',
                description: 'Your backup is being downloaded',
            });
        },
        onError: (error: Error) => {
            toast({
                title: 'Download failed',
                description: error.message,
                variant: 'destructive',
            });
        },
    });

    // Mutation: Restore backup
    const restoreBackupMutation = useMutation({
        mutationFn: ({
            backupId,
            targetRepo,
        }: {
            backupId: string;
            targetRepo: { owner: string; repo: string };
        }) => restoreBackup(backupId, targetRepo),
        onSuccess: () => {
            toast({
                title: 'Restore complete',
                description: 'Backup has been restored successfully',
            });
        },
        onError: (error: Error) => {
            toast({
                title: 'Restore failed',
                description: error.message,
                variant: 'destructive',
            });
        },
    });

    // Mutation: Delete backup
    const deleteBackupMutation = useMutation({
        mutationFn: (backupId: string) => deleteBackup(backupId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['backups'] });
            toast({
                title: 'Backup deleted',
                description: 'Backup has been removed from storage',
            });
        },
        onError: (error: Error) => {
            toast({
                title: 'Delete failed',
                description: error.message,
                variant: 'destructive',
            });
        },
    });

    // Mutation: Create schedule
    const createScheduleMutation = useMutation({
        mutationFn: (schedule: BackupSchedule) => createBackupSchedule(schedule),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['backup-schedules'] });
            toast({
                title: 'Schedule created',
                description: 'Automated backup schedule has been set up',
            });
        },
        onError: (error: Error) => {
            toast({
                title: 'Schedule creation failed',
                description: error.message,
                variant: 'destructive',
            });
        },
    });

    // Mutation: Update schedule
    const updateScheduleMutation = useMutation({
        mutationFn: ({
            scheduleId,
            updates,
        }: {
            scheduleId: string;
            updates: Partial<BackupSchedule>;
        }) => updateBackupSchedule(scheduleId, updates),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['backup-schedules'] });
            toast({
                title: 'Schedule updated',
                description: 'Backup schedule has been modified',
            });
        },
        onError: (error: Error) => {
            toast({
                title: 'Update failed',
                description: error.message,
                variant: 'destructive',
            });
        },
    });

    // Mutation: Delete schedule
    const deleteScheduleMutation = useMutation({
        mutationFn: (scheduleId: string) => deleteBackupSchedule(scheduleId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['backup-schedules'] });
            toast({
                title: 'Schedule deleted',
                description: 'Automated backup schedule has been removed',
            });
        },
        onError: (error: Error) => {
            toast({
                title: 'Delete failed',
                description: error.message,
                variant: 'destructive',
            });
        },
    });

    return {
        // Queries
        backups: backups.data || [],
        isLoadingBackups: backups.isLoading,
        backupsError: backups.error,

        schedules: schedules.data || [],
        isLoadingSchedules: schedules.isLoading,
        schedulesError: schedules.error,

        // Mutations
        createBackup: createBackupMutation.mutate,
        isCreatingBackup: createBackupMutation.isPending,

        downloadBackup: downloadBackupMutation.mutate,
        isDownloading: downloadBackupMutation.isPending,

        restoreBackup: restoreBackupMutation.mutate,
        isRestoring: restoreBackupMutation.isPending,

        deleteBackup: deleteBackupMutation.mutate,
        isDeleting: deleteBackupMutation.isPending,

        createSchedule: createScheduleMutation.mutate,
        isCreatingSchedule: createScheduleMutation.isPending,

        updateSchedule: updateScheduleMutation.mutate,
        isUpdatingSchedule: updateScheduleMutation.isPending,

        deleteSchedule: deleteScheduleMutation.mutate,
        isDeletingSchedule: deleteScheduleMutation.isPending,

        // Refetch
        refetchBackups: backups.refetch,
        refetchSchedules: schedules.refetch,
    };
}
