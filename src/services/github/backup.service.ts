/**
 * Backup Service
 * 
 * Handles repository backup creation (ZIP) and history tracking.
 */

import { getOctokit } from './octokit.service';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import { db, BackupRecord } from '../database/db';
import { format } from 'date-fns';
import { getRepositoryTree } from './repository.service';
import { logger } from '@/lib/logger';

interface GitHubTreeItem {
    path?: string;
    mode?: string;
    type?: string;
    sha?: string;
    size?: number;
    url?: string;
}

/**
 * Generate a standard filename for backups
 */
export function generateBackupFilename(owner: string, repo: string, branch: string): string {
    const timestamp = format(new Date(), 'yyyyMMdd-HHmmss');
    return `${owner}-${repo}-${branch}-${timestamp}.zip`;
}

/**
 * Fetch a single file's content as a Blob/Buffer from GitHub
 */
async function getFileBlob(owner: string, repo: string, fileSha: string): Promise<Blob> {
    const octokit = await getOctokit();

    const { data } = await octokit.rest.git.getBlob({
        owner,
        repo,
        file_sha: fileSha,
    });

    // content is base64 encoded
    const byteCharacters = atob(data.content);
    const byteNumbers = new Array(byteCharacters.length);

    for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
    }

    const byteArray = new Uint8Array(byteNumbers);
    return new Blob([byteArray]);
}

/**
 * Create a full backup of the repository branch
 */
export async function createBackup(
    owner: string,
    repo: string,
    branch: string,
    onProgress?: (progress: number, currentFile: string) => void
): Promise<void> {
    const zip = new JSZip();

    // 1. Get file list using repository service
    const tree = await getRepositoryTree(owner, repo, branch);

    // Filter out blobs (files) only
    const files = tree.filter((item: GitHubTreeItem) => item.type === 'blob');
    const totalFiles = files.length;
    let processedFiles = 0;

    // 2. Fetch each file and add to ZIP
    // We limit concurrency to avoid hitting rate limits or browser hanging
    const chunkSize = 5; // Fetch 5 files at a time

    for (let i = 0; i < files.length; i += chunkSize) {
        const chunk = files.slice(i, i + chunkSize);

        await Promise.all(chunk.map(async (file: GitHubTreeItem) => {
            if (!file.path || !file.sha) return;

            try {
                const content = await getFileBlob(owner, repo, file.sha);
                zip.file(file.path, content);
            } catch (err) {
                logger.error(`Failed to backup file: ${file.path}`, err);
                // We typically continue even if one file fails, or write an error log in the zip
                zip.file(`${file.path}.error.txt`, `Failed to download: ${err}`);
            } finally {
                processedFiles++;
                if (onProgress) {
                    onProgress(Math.round((processedFiles / totalFiles) * 100), file.path || '');
                }
            }
        }));
    }

    // 3. Generate ZIP blob
    const zipBlob = await zip.generateAsync({ type: 'blob' });
    const filename = generateBackupFilename(owner, repo, branch);

    // 4. Trigger Download
    saveAs(zipBlob, filename);

    // 5. Record in Database
    await db.backups.add({
        owner,
        repo,
        branch,
        fileName: filename,
        size: zipBlob.size,
        fileCount: totalFiles,
        createdAt: new Date().toISOString(),
        storageType: 'local'
    });
}

/**
 * List backup history
 */
export async function listBackups(filters?: BackupFilters): Promise<BackupRecord[]> {
    const owner = filters?.owner;
    const repo = filters?.repo;
    if (owner && repo) {
        return await db.backups
            .where('[owner+repo]')
            .equals([owner, repo])
            .reverse()
            .sortBy('createdAt');
    }
    return await db.backups.orderBy('createdAt').reverse().toArray();
}

/**
 * Delete a backup record (metadata only)
 */
export async function deleteBackupRecord(id: number): Promise<void> {
    await db.backups.delete(id);
}

// --- Missing Exports added to satisfy useBackup.tsx ---

export interface BackupOptions {
    includeWiki?: boolean;
    includeIssues?: boolean;
    compress?: boolean;
}

export interface BackupFilters {
    owner?: string;
    repo?: string;
    dateRange?: { from: Date; to: Date };
}

export interface BackupSchedule {
    id: string;
    owner: string;
    repo: string;
    frequency: 'daily' | 'weekly' | 'monthly';
    nextRun: string;
    enabled: boolean;
}

// Stubs
export async function downloadBackup(backupId: string): Promise<void> {
    logger.debug(`Download backup ${backupId} triggered`);
    // In a real app, this might fetch from cloud storage
}

export async function deleteBackup(backupId: string): Promise<void> {
    return deleteBackupRecord(Number(backupId));
}

export async function restoreBackup(backupId: string, targetRepo: { owner: string; repo: string }): Promise<void> {
    logger.debug(`Restore backup ${backupId} to ${targetRepo.owner}/${targetRepo.repo}`);
    throw new Error('Restore functionality not implemented yet');
}

export async function createBackupSchedule(schedule: BackupSchedule): Promise<void> {
    logger.debug('Create schedule', schedule);
    return Promise.resolve();
}

export async function listBackupSchedules(): Promise<BackupSchedule[]> {
    return [];
}

export async function updateBackupSchedule(id: string, updates: Partial<BackupSchedule>): Promise<void> {
    logger.debug('Update schedule', id, updates);
    return Promise.resolve();
}

export async function deleteBackupSchedule(id: string): Promise<void> {
    logger.debug('Delete schedule', id);
    return Promise.resolve();
}
