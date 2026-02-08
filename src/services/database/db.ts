import Dexie, { Table } from 'dexie';

export interface BackupRecord {
    id?: number;
    owner: string;
    repo: string;
    branch: string;
    fileName: string;
    size: number;
    fileCount: number;
    createdAt: string; // ISO string
    storageType: 'local'; // For now, we only download, so this is just a record
}

export class GitHubHubDatabase extends Dexie {
    backups!: Table<BackupRecord>;

    constructor() {
        super('GitHubHubDB');
        this.version(1).stores({
            backups: '++id, [owner+repo], createdAt',
        });
    }
}

export const db = new GitHubHubDatabase();
