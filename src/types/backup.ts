// Backup System Types

export interface BackupMetadata {
    id: string;
    user_id: string;
    repository_full_name: string;
    branch: string;
    backup_type: 'full' | 'incremental';
    storage_location: 's3' | 'gdrive' | 'local';
    storage_path: string;
    size_bytes: number;
    file_count: number;
    encrypted: boolean;
    compression: 'zip' | 'tar.gz';
    created_at: string;
    metadata?: {
        commit_sha?: string;
        tags?: string[];
        description?: string;
    };
}

export interface BackupOptions {
    branch?: string;
    encrypt?: boolean;
    compression?: 'zip' | 'tar.gz';
    storage?: 's3' | 'gdrive' | 'local';
    excludePatterns?: string[]; // e.g., ['node_modules', '.git']
    incremental?: boolean;
}

export interface RestoreOptions {
    target: 'same' | 'new' | 'local';
    targetRepo?: string; // Required if target is 'new'
    conflictStrategy?: 'overwrite' | 'skip' | 'merge';
    files?: string[]; // If not provided, restore all files
}

export interface ScheduledBackup {
    id: string;
    user_id: string;
    repository_full_name: string;
    cron_schedule: string; // e.g., '0 0 * * *' (daily at midnight)
    enabled: boolean;
    retention_count: number; // Keep last N backups
    backup_options: BackupOptions;
    last_run_at: string | null;
    next_run_at: string | null;
    created_at: string;
}

export interface BackupProgress {
    status: 'initializing' | 'fetching' | 'compressing' | 'encrypting' | 'uploading' | 'complete' | 'error';
    progress: number; // 0-100
    currentFile?: string;
    filesProcessed: number;
    totalFiles: number;
    bytesProcessed: number;
    totalBytes: number;
    error?: string;
}

export interface CloudStorageConfig {
    type: 's3' | 'gdrive';
    s3?: {
        bucket: string;
        region: string;
        accessKeyId: string;
        secretAccessKey: string;
    };
    gdrive?: {
        clientId: string;
        accessToken: string;
        refreshToken: string;
        folderId?: string;
    };
}
